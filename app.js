/* IA & Empresa — versión corregida de interacciones (sin dependencias externas) */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let toastTimer = null;

  function announce(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function reportError(feature, error) {
    console.error(`[IA & Empresa] Error en ${feature}:`, error);
    announce(`La herramienta «${feature}» tuvo un problema. Recarga la página e inténtalo otra vez.`);
  }

  function initFeature(name, init) {
    try { init(); }
    catch (error) { reportError(name, error); }
  }

  function listen(element, eventName, feature, callback) {
    if (!element) return;
    element.addEventListener(eventName, event => {
      try {
        const result = callback(event);
        if (result && typeof result.catch === 'function') result.catch(error => reportError(feature, error));
      } catch (error) { reportError(feature, error); }
    });
  }

  // Esta marca permite confirmar que el archivo JavaScript nuevo sí se cargó.
  document.documentElement.dataset.iaAppVersion = '2.1-fixed';
  document.documentElement.classList.add('ia-app-ready');

  initFeature('menú de navegación', () => {
    const menuToggle = $('#menuToggle');
    const nav = $('#primaryNav');
    if (!menuToggle || !nav) return;
    listen(menuToggle, 'click', 'menú de navegación', () => {
      const open = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      const label = $('.sr-only', menuToggle);
      if (label) label.textContent = open ? 'Cerrar menú' : 'Abrir menú';
    });
    $$('#primaryNav a').forEach(link => listen(link, 'click', 'menú de navegación', () => {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      const label = $('.sr-only', menuToggle);
      if (label) label.textContent = 'Abrir menú';
    }));
  });

  initFeature('tema claro y oscuro', () => {
    const toggle = $('#themeToggle');
    try { if (localStorage.getItem('ia-empresa-theme') === 'dark') document.body.classList.add('theme-dark'); } catch (_) {}
    listen(toggle, 'click', 'tema claro y oscuro', () => {
      document.body.classList.toggle('theme-dark');
      const dark = document.body.classList.contains('theme-dark');
      try { localStorage.setItem('ia-empresa-theme', dark ? 'dark' : 'light'); } catch (_) {}
      announce(dark ? 'Tema oscuro activado.' : 'Tema claro activado.');
    });
  });

  initFeature('filtros de aplicaciones', () => {
    const search = $('#useCaseSearch');
    const cards = $$('.usecase-card');
    let activeFilter = 'all';
    function filterUseCases() {
      const query = (search?.value || '').trim().toLocaleLowerCase('es');
      let visible = 0;
      cards.forEach(card => {
        const categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
        const text = `${card.dataset.search || ''} ${card.textContent}`.toLocaleLowerCase('es');
        const show = categoryMatch && (!query || text.includes(query));
        card.classList.toggle('is-hidden', !show);
        card.setAttribute('aria-hidden', String(!show));
        if (show) visible++;
      });
      const status = $('#searchStatus');
      if (status) status.textContent = visible ? `Mostrando ${visible} ${visible === 1 ? 'aplicación' : 'aplicaciones'}.` : 'No hay resultados. Prueba otra palabra o categoría.';
    }
    $$('.filter-button').forEach(button => listen(button, 'click', 'filtros de aplicaciones', () => {
      activeFilter = button.dataset.filter || 'all';
      $$('.filter-button').forEach(other => {
        const selected = other === button;
        other.classList.toggle('is-active', selected);
        other.setAttribute('aria-pressed', String(selected));
      });
      filterUseCases();
    }));
    listen(search, 'input', 'filtros de aplicaciones', filterUseCases);
    filterUseCases();
  });

  initFeature('pestañas de contenido', () => {
    $$('.tabs').forEach(group => {
      const tabs = $$('.tab-button', group);
      function activate(tab, focus = false) {
        tabs.forEach(item => {
          const selected = item === tab;
          item.classList.toggle('is-active', selected);
          item.setAttribute('aria-selected', String(selected));
          item.tabIndex = selected ? 0 : -1;
          const panel = document.getElementById(item.getAttribute('aria-controls'));
          if (panel) panel.hidden = !selected;
        });
        if (focus) tab.focus();
      }
      tabs.forEach((tab, index) => {
        listen(tab, 'click', 'pestañas de contenido', () => activate(tab));
        listen(tab, 'keydown', 'pestañas de contenido', event => {
          let next = index;
          if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
          else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = tabs.length - 1;
          else return;
          event.preventDefault();
          activate(tabs[next], true);
        });
      });
      const selectedTab = tabs.find(tab => tab.classList.contains('is-active')) || tabs[0];
      if (selectedTab) activate(selectedTab);
    });
  });

  initFeature('constructor de prompts', () => {
    const parts = $$('.prompt-part');
    const preview = $('#promptPreview');
    const hint = $('#promptHint');
    const labels = {
      objetivo: 'Objetivo: [describe qué necesitas resolver].',
      contexto: 'Contexto: [explica la situación, el negocio y la audiencia].',
      restricciones: 'Restricciones: [indica límites, formato, extensión y exclusiones].',
      evidencia: 'Evidencia: [define fuentes fiables, citas y qué debe verificarse].',
      criterios: 'Criterios de éxito: [explica cómo evaluarás la calidad de la respuesta].',
      riesgos: 'Riesgos y límites: [señala supuestos que deben evitarse y cuándo escalar a una persona].'
    };
    function updatePrompt() {
      if (!preview || !hint) return;
      const chosen = parts.filter(input => input.checked).map(input => labels[input.value]).filter(Boolean);
      preview.textContent = chosen.length ? chosen.join('\n\n') : 'Selecciona al menos un componente para construir una estructura de prompt.';
      hint.textContent = `Has seleccionado ${chosen.length} de ${parts.length} componentes. ${chosen.length < 3 ? 'Añade los elementos necesarios para que la tarea sea comprensible.' : 'Revisa que cada elemento aporte claridad y no agregue restricciones innecesarias.'}`;
    }
    parts.forEach(input => listen(input, 'change', 'constructor de prompts', updatePrompt));
    listen($('#copyPrompt'), 'click', 'copiar prompt', async () => {
      if (!preview) return;
      try {
        await navigator.clipboard.writeText(preview.textContent);
        announce('Estructura copiada al portapapeles.');
      } catch (_) {
        const range = document.createRange(); range.selectNodeContents(preview);
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        announce('Texto seleccionado. Presiona Ctrl+C para copiarlo.');
      }
    });
    updatePrompt();
  });

  initFeature('evaluación de conocimientos', () => {
    const questions = [
      {q:'¿Cuál es una diferencia importante entre automatización y aumento?', options:['La automatización siempre es más segura.','El aumento ayuda a una persona a trabajar y decidir mejor.','El aumento elimina la necesidad de verificar.'], correct:1, why:'El aumento amplía la capacidad humana; no elimina la responsabilidad ni la necesidad de revisión.'},
      {q:'¿Qué significa que los datos sean sintéticos?', options:['Que siempre son anónimos y seguros.','Que son registros generados artificialmente para reproducir propiedades útiles.','Que son datos reales sin necesidad de permisos.'], correct:1, why:'Los datos sintéticos pueden ser útiles, pero aún requieren pruebas de privacidad, calidad y sesgo.'},
      {q:'¿Qué debe hacerse antes de escalar un caso de uso?', options:['Lanzarlo a toda la empresa para aprender más rápido.','Medirlo solo por la rapidez de respuesta.','Probar un piloto con métricas, controles y criterios de salida.'], correct:2, why:'Un piloto permite comparar con una línea base y evaluar calidad, costos, riesgos y adopción.'},
      {q:'¿Qué demuestra una respuesta de IA bien redactada?', options:['Que el contenido necesariamente es verdadero.','Que el texto parece coherente; los hechos importantes aún deben verificarse.','Que las fuentes citadas existen.'], correct:1, why:'La fluidez no garantiza exactitud. Verifica afirmaciones relevantes con fuentes primarias.'},
      {q:'¿Qué es una línea base?', options:['La marca del modelo elegido.','La medición del proceso antes del cambio para poder comparar.','El presupuesto máximo de una empresa.'], correct:1, why:'Una línea base ayuda a evaluar cambios con medidas comparables antes y después.'},
      {q:'¿Qué métrica conviene revisar junto con la velocidad?', options:['Calidad, errores, satisfacción y costo total.','Solo la cantidad de respuestas generadas.','El número de prompts usados.'], correct:0, why:'La rapidez sin calidad o control puede incrementar retrabajo, incidentes y costos.'},
      {q:'¿Qué significa que un agente de IA tenga permisos mínimos?', options:['Puede realizar cualquier tarea sin preguntar.','Solo tiene acceso a las herramientas y acciones necesarias para su función.','No necesita registros.'], correct:1, why:'Los permisos mínimos limitan el daño potencial si el agente se equivoca o recibe instrucciones maliciosas.'},
      {q:'¿Qué hacer ante una posible fuga de información?', options:['Borrar todo y no informar a nadie.','Esperar a comprobar si aparece en internet.','Activar el protocolo interno, preservar registros autorizados y avisar a los responsables.'], correct:2, why:'Una respuesta organizada permite investigar, contener y cumplir obligaciones aplicables.'},
      {q:'¿Qué puede indicar un falso positivo?', options:['Una alerta incorrecta que marca un caso normal como sospechoso.','Que el sistema siempre acertó.','Una predicción de valor futuro.'], correct:0, why:'Los falsos positivos pueden generar trabajo extra y afectar injustamente a personas o clientes.'},
      {q:'¿Cuándo conviene escalar un piloto?', options:['Cuando genera entusiasmo, aunque no tenga mediciones.','Cuando alcanza criterios definidos de utilidad, calidad, costo, riesgo y adopción.','Inmediatamente después de comprar la licencia.'], correct:1, why:'Escalar debe basarse en resultados medidos y controles operativos, no solo en expectativas.'}
    ];
    const optionsBox = $('#quizOptions'), next = $('#quizNext'), questionTitle = $('#quizQuestion');
    const kicker = $('#quizKicker'), feedback = $('#quizFeedback'), scoreBox = $('#quizScore');
    const progress = $('#quizProgressBar'), progressLabel = $('#quizProgressLabel');
    if (!optionsBox || !next || !questionTitle || !kicker || !feedback || !scoreBox || !progress || !progressLabel) return;
    let index = 0, score = 0, answered = false, finished = false;
    function renderQuestion() {
      const q = questions[index]; answered = false;
      kicker.textContent = `PREGUNTA ${String(index + 1).padStart(2, '0')}`;
      questionTitle.textContent = q.q;
      optionsBox.replaceChildren();
      q.options.forEach((option, optionIndex) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'quiz-option'; button.textContent = option;
        listen(button, 'click', 'evaluación de conocimientos', () => chooseAnswer(optionIndex));
        optionsBox.append(button);
      });
      feedback.textContent = '';
      scoreBox.textContent = `Puntuación: ${score}`;
      progress.style.width = `${(index + 1) / questions.length * 100}%`;
      progressLabel.textContent = `Pregunta ${index + 1} de ${questions.length}`;
      next.disabled = true;
      next.textContent = index === questions.length - 1 ? 'Ver resultado →' : 'Siguiente pregunta →';
    }
    function chooseAnswer(optionIndex) {
      if (answered) return;
      answered = true;
      const q = questions[index];
      $$('.quiz-option', optionsBox).forEach((button, i) => {
        button.disabled = true;
        if (i === q.correct) button.classList.add('correct');
        else if (i === optionIndex) button.classList.add('incorrect');
      });
      if (optionIndex === q.correct) { score++; feedback.textContent = `¡Correcto! ${q.why}`; }
      else feedback.textContent = `No exactamente. ${q.why}`;
      scoreBox.textContent = `Puntuación: ${score}`;
      next.disabled = false;
    }
    listen(next, 'click', 'evaluación de conocimientos', () => {
      if (finished) { index = 0; score = 0; finished = false; renderQuestion(); return; }
      if (!answered) return;
      if (index < questions.length - 1) { index++; renderQuestion(); }
      else {
        finished = true;
        kicker.textContent = 'RESULTADO FINAL';
        questionTitle.textContent = `Obtuviste ${score} de ${questions.length} respuestas correctas.`;
        optionsBox.replaceChildren();
        feedback.textContent = score === questions.length ? 'Excelente: estás conectando utilidad, verificación y gobernanza.' : 'Repasa las secciones de automatización, datos y riesgos y vuelve a intentarlo.';
        next.textContent = 'Repetir evaluación ↻'; next.disabled = false;
      }
    });
    renderQuestion();
  });

  initFeature('evaluador de casos de uso', () => {
    const form = $('#readinessForm');
    const result = $('#readinessResult');
    if (!form || !result) return;
    listen(form, 'submit', 'evaluador de casos de uso', event => {
      event.preventDefault();
      const value = Number($('#valueScore')?.value || 3);
      const data = Number($('#dataScore')?.value || 3);
      const repeat = Number($('#repeatScore')?.value || 3);
      const risk = Number($('#riskScore')?.value || 3);
      const score = value + data + repeat + (6 - risk);
      let heading, body;
      if (risk >= 4) {
        heading = `Resultado: ${score}/20 · controles reforzados antes de pilotar`;
        body = 'El impacto potencial del error es alto. Antes de probar, realiza evaluación de riesgos, define revisión humana efectiva, permisos mínimos, registro, pruebas de fallos y un plan de reversión. Una puntuación alta no compensa un riesgo inaceptable.';
      } else if (score >= 16) {
        heading = `Resultado: ${score}/20 · candidato a piloto acotado`;
        body = 'El caso parece tener condiciones iniciales favorables. Define una línea base y criterios de éxito, prueba con datos autorizados y representa casos límite. No escales hasta medir calidad, costos y adopción.';
      } else if (score >= 11) {
        heading = `Resultado: ${score}/20 · necesita preparación`;
        body = 'Antes de seleccionar una herramienta, aclara el valor esperado, mejora la calidad/acceso a los datos y define quién verificará resultados. Puede convenir empezar con automatización simple o un piloto manual asistido.';
      } else {
        heading = `Resultado: ${score}/20 · replantea el caso`;
        body = 'El objetivo, los datos o la repetibilidad todavía no están suficientemente definidos. Delimita el problema y su línea base; no uses IA únicamente porque la tecnología está disponible.';
      }
      result.replaceChildren();
      const strong = document.createElement('strong'); strong.textContent = heading;
      const p = document.createElement('p'); p.textContent = body;
      result.append(strong, p);
      announce('Evaluación orientativa actualizada.');
    });
  });

  initFeature('calculadora de escenarios', () => {
    const form = $('#roiForm');
    const fields = ['minutesSaved', 'dailyVolume', 'workdays', 'hourlyCost', 'adoptionRate', 'toolCost'];
    const outputHours = $('#roiHours'), outputGross = $('#roiGross'), outputNet = $('#roiNet'), caveat = $('#roiCaveat');
    if (!form || fields.some(id => !$('#' + id)) || !outputHours || !outputGross || !outputNet || !caveat) return;
    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
    function calculate(event) {
      if (event) event.preventDefault();
      const minutes = Math.max(0, Number($('#minutesSaved').value) || 0);
      const volume = Math.max(0, Number($('#dailyVolume').value) || 0);
      const days = Math.max(1, Number($('#workdays').value) || 1);
      const hourly = Math.max(0, Number($('#hourlyCost').value) || 0);
      const adoption = Math.min(100, Math.max(0, Number($('#adoptionRate').value) || 0)) / 100;
      const fee = Math.max(0, Number($('#toolCost').value) || 0);
      const monthlyHours = minutes * volume * days * adoption / 60;
      const gross = monthlyHours * hourly;
      const net = gross - fee;
      const pct = fee > 0 ? net / fee * 100 : null;
      outputHours.textContent = `${monthlyHours.toLocaleString('es-MX', { maximumFractionDigits: 1 })} h/mes`;
      outputGross.textContent = money.format(gross);
      outputNet.textContent = `${net < 0 ? '−' : ''}${money.format(Math.abs(net))}`;
      caveat.textContent = `Escenario teórico: ${pct === null ? 'no se calcula porcentaje de retorno porque el costo indicado es $0' : `relación neta/costo aproximada de ${pct.toLocaleString('es-MX', { maximumFractionDigits: 0 })}%`}. No equivale a flujo de efectivo: el tiempo solo crea valor si se reasigna útilmente y se descuentan capacitación, revisión, integración, fallos, mantenimiento y otros costos.`;
    }
    listen(form, 'submit', 'calculadora de escenarios', calculate);
    fields.forEach(id => {
      const input = $('#' + id);
      listen(input, 'input', 'calculadora de escenarios', calculate);
      listen(input, 'change', 'calculadora de escenarios', calculate);
    });
    calculate();
  });

  initFeature('plan de 90 días', () => {
    const checks = $$('[data-roadmap-item]');
    const key = 'ia-empresa-roadmap-v2';
    function refresh() {
      const done = checks.filter(item => item.checked).length;
      const percent = checks.length ? Math.round(done / checks.length * 100) : 0;
      const bar = $('#roadmapBar'), label = $('#roadmapPercent'), count = $('#roadmapCount');
      if (bar) bar.style.width = `${percent}%`;
      if (label) label.textContent = `${percent}%`;
      if (count) count.textContent = `${done} de ${checks.length} acciones completadas`;
      try { localStorage.setItem(key, JSON.stringify(checks.map(item => item.checked))); } catch (_) {}
    }
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (Array.isArray(saved)) checks.forEach((item, index) => { item.checked = Boolean(saved[index]); });
    } catch (_) {}
    checks.forEach(item => listen(item, 'change', 'plan de 90 días', refresh));
    listen($('#resetRoadmap'), 'click', 'plan de 90 días', () => {
      checks.forEach(item => { item.checked = false; });
      refresh(); announce('Lista de implementación reiniciada.');
    });
    refresh();
  });

  initFeature('análisis de escenarios', () => {
    const answers = {
      privacy: {title:'Primero limita el riesgo; después investiga.', body:'Activa el procedimiento interno de incidentes. Identifica qué información se compartió, en qué herramienta, en qué momento y con qué cuenta; conserva registros autorizados y comunica a seguridad, privacidad y legal. No prometas que el contenido fue eliminado sin confirmación del proveedor. Evita culpar antes de conocer los hechos.'},
      hiring: {title:'No uses una puntuación automática como decisión final.', body:'Revisa la validez y necesidad de la herramienta, los criterios del trabajo, la posible discriminación y las obligaciones aplicables. Prueba resultados, conserva trazabilidad y ofrece revisión humana significativa. Evita inferir personalidad o capacidad a partir de señales no relacionadas con el puesto.'},
      hallucination: {title:'Pausa la publicación y verifica cada afirmación.', body:'Contrasta cifras con documentos primarios, comprueba fórmulas, fechas y unidades y elimina las fuentes que no puedan localizarse. Conserva una versión revisada por una persona responsable. La redacción convincente no sustituye evidencia.'},
      agent: {title:'Reduce permisos y exige aprobación para acciones críticas.', body:'Empieza en modo de prueba o solo lectura, limita herramientas y presupuesto, separa tareas de consulta y ejecución, registra cada acción y fija umbrales que requieran aprobación humana. Añade una forma de detener el agente y revertir operaciones cuando sea posible.'},
      synthetic: {title:'Evalúa utilidad y riesgo de privacidad por separado.', body:'Define para qué se utilizarán los datos, genera con un método documentado y prueba semejanza estadística, cobertura de casos raros, sesgos y posibles filtraciones o reidentificación. Limita el acceso y elimina variables innecesarias. “Sintético” no es sinónimo de anónimo.'}
    };
    const select = $('#scenarioSelect'), target = $('#scenarioAnswer');
    if (!select || !target) return;
    function render() {
      const scenario = answers[select.value] || answers.privacy;
      target.replaceChildren();
      const label = document.createElement('span'); label.className = 'mini-label'; label.textContent = 'RECOMENDACIÓN';
      const title = document.createElement('h4'); title.textContent = scenario.title;
      const p = document.createElement('p'); p.textContent = scenario.body;
      target.append(label, title, p);
    }
    listen($('#scenarioButton'), 'click', 'análisis de escenarios', render);
    listen(select, 'change', 'análisis de escenarios', render);
    render();
  });

  initFeature('banco de prompts', () => {
    const templates = {
      report: 'Actúa como analista de negocio. Revisa el siguiente reporte: [tipo de reporte y periodo]. Resume tres hallazgos verificables, señala limitaciones de los datos y propone dos acciones con sus indicadores. No inventes cifras; distingue hechos, hipótesis y recomendaciones. Devuelve una tabla con hallazgo, evidencia, implicación y dato pendiente de validar.',
      process: 'Actúa como especialista en mejora de procesos. Analiza este proceso: [descripción, responsables, entradas y salidas]. Identifica pasos repetitivos, cuellos de botella y riesgos. Compara al menos tres opciones: mantenerlo, automatización basada en reglas e IA asistida. Evalúa complejidad, costo total, errores, supervisión, privacidad y reversibilidad. Declara los datos que faltan antes de recomendar.',
      marketing: 'Actúa como asesor de comunicación comercial. Audiencia: [segmento autorizado y no sensible]. Objetivo: [objetivo medible]. Canales: [canales]. Genera tres enfoques de mensaje, explica el supuesto de cada uno y sugiere una prueba A/B con indicadores. No inventes testimonios, estadísticas ni promesas. Mantén tono [tono] y evita afirmaciones que no estén respaldadas por evidencia.',
      data: 'Actúa como analista de datos. Interpreta la tabla que proporcionaré. Primero describe columnas, periodo, unidades y valores faltantes. Después resume patrones y anomalías con los cálculos explícitos. Separa correlación de causalidad, indica limitaciones y solicita aclaraciones si la tabla no permite concluir. No generes registros ni cifras ausentes. Devuelve resumen ejecutivo, tabla de hallazgos y próximos pasos.',
      risk: 'Actúa como facilitador de riesgos de IA. Caso de uso: [descripción]. Usuarios y personas afectadas: [grupos]. Datos utilizados: [categorías, sin pegar datos sensibles]. Identifica fallos posibles, impacto, probabilidad estimada y señales de detección. Propón controles preventivos, detectivos y correctivos, responsable, evidencia de verificación y criterio de suspensión. Marca como hipótesis cualquier riesgo que dependa de información faltante.',
      training: 'Diseña una sesión de capacitación de [duración] para [rol profesional] sobre uso responsable de IA en [proceso]. Define objetivos observables, conceptos mínimos, tres ejercicios prácticos, un caso de error, una lista de comprobación de privacidad, una evaluación breve con respuestas y criterios de aprobación. Adapta el nivel a [experiencia]. No presupongas herramientas no disponibles y diferencia reglas internas de recomendaciones generales.'
    };
    const select = $('#promptTemplate'), preview = $('#templatePreview'), hint = $('#templateHint');
    listen($('#loadPromptTemplate'), 'click', 'banco de prompts', () => {
      if (!select || !preview) return;
      preview.value = templates[select.value] || templates.report;
      if (hint) hint.textContent = 'Ejemplo cargado. Sustituye los campos entre corchetes y verifica que la información que añadas pueda compartirse con la herramienta.';
      announce('Ejemplo de prompt cargado.');
    });
    listen($('#copyTemplate'), 'click', 'banco de prompts', async () => {
      if (!preview) return;
      try { await navigator.clipboard.writeText(preview.value); announce('Prompt de ejemplo copiado.'); }
      catch (_) { preview.focus(); preview.select(); announce('Texto seleccionado. Presiona Ctrl+C para copiarlo.'); }
    });
  });

  initFeature('búsqueda del glosario', () => {
    const search = $('#glossarySearch'), grid = $('#glossaryGrid');
    if (!search || !grid) return;
    listen(search, 'input', 'búsqueda del glosario', () => {
      const query = search.value.trim().toLocaleLowerCase('es');
      let visible = 0;
      $$('.glossary-item', grid).forEach(item => {
        const text = `${item.dataset.term || ''} ${item.textContent}`.toLocaleLowerCase('es');
        const show = !query || text.includes(query);
        item.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });
      let empty = $('#glossaryEmpty');
      if (!visible) {
        if (!empty) { empty = document.createElement('p'); empty.id = 'glossaryEmpty'; empty.textContent = 'No encontramos ese término. Prueba con otra palabra.'; empty.className = 'search-status'; grid.after(empty); }
      } else if (empty) empty.remove();
    });
  });
})();
