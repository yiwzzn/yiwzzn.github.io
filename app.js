/* IA & Empresa — interacciones accesibles y sin bibliotecas externas */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Menú móvil: mantiene aria-expanded sincronizado con el estado visible.
  const menuToggle = $('#menuToggle');
  const nav = $('#primaryNav');
  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    $('.sr-only', menuToggle).textContent = open ? 'Cerrar menú' : 'Abrir menú';
  });
  $$('#primaryNav a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    const label = $('.sr-only', menuToggle);
    if (label) label.textContent = 'Abrir menú';
  }));

  // Tema visual. La preferencia se guarda localmente si el navegador lo permite.
  const themeToggle = $('#themeToggle');
  try { if (localStorage.getItem('ia-empresa-theme') === 'dark') document.body.classList.add('theme-dark'); } catch (_) {}
  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');
    const dark = document.body.classList.contains('theme-dark');
    try { localStorage.setItem('ia-empresa-theme', dark ? 'dark' : 'light'); } catch (_) {}
    announce(dark ? 'Tema oscuro activado.' : 'Tema claro activado.');
  });

  // Mensajes breves para confirmar acciones sin interrumpir la navegación.
  let toastTimer;
  function announce(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  // Filtros combinables por categoría y texto para casos de uso.
  let activeFilter = 'all';
  const caseSearch = $('#useCaseSearch');
  const caseCards = $$('.usecase-card');
  function filterUseCases() {
    const query = (caseSearch?.value || '').trim().toLocaleLowerCase('es');
    let visible = 0;
    caseCards.forEach(card => {
      const categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
      const text = `${card.dataset.search || ''} ${card.textContent}`.toLocaleLowerCase('es');
      const queryMatch = !query || text.includes(query);
      const show = categoryMatch && queryMatch;
      card.classList.toggle('is-hidden', !show);
      card.setAttribute('aria-hidden', String(!show));
      if (show) visible++;
    });
    const status = $('#searchStatus');
    if (status) status.textContent = visible ? `Mostrando ${visible} ${visible === 1 ? 'aplicación' : 'aplicaciones'}.` : 'No hay resultados. Prueba otra palabra o categoría.';
  }
  $$('.filter-button').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all';
    $$('.filter-button').forEach(other => {
      const active = other === button;
      other.classList.toggle('is-active', active);
      other.setAttribute('aria-pressed', String(active));
    });
    filterUseCases();
  }));
  caseSearch?.addEventListener('input', filterUseCases);

  // Tabs con navegación por teclado mediante flechas, Home y End.
  $$('.tabs').forEach(tabGroup => {
    const tabs = $$('.tab-button', tabGroup);
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
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', event => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault(); activate(tabs[next], true);
      });
    });
  });

  // Laboratorio de prompts: muestra una estructura a partir de los componentes elegidos.
  const promptParts = $$('.prompt-part');
  const promptLabels = {
    objetivo: 'Objetivo: [describe qué necesitas resolver].',
    contexto: 'Contexto: [explica la situación, el negocio y la audiencia].',
    restricciones: 'Restricciones: [indica límites, formato, extensión y exclusiones].',
    evidencia: 'Evidencia: [define fuentes fiables, citas y qué debe verificarse].',
    criterios: 'Criterios de éxito: [explica cómo evaluarás la calidad de la respuesta].',
    riesgos: 'Riesgos y límites: [señala supuestos que deben evitarse y cuándo escalar a una persona].'
  };
  function updatePrompt() {
    const chosen = promptParts.filter(input => input.checked).map(input => promptLabels[input.value]);
    $('#promptPreview').textContent = chosen.length ? chosen.join('\n\n') : 'Selecciona al menos un componente para construir una estructura de prompt.';
    $('#promptHint').textContent = `Has seleccionado ${chosen.length} de ${promptParts.length} componentes. ${chosen.length < 3 ? 'Añade los elementos necesarios para que la tarea sea comprensible.' : 'Revisa que cada elemento aporte claridad y no agregue restricciones innecesarias.'}`;
  }
  promptParts.forEach(input => input.addEventListener('change', updatePrompt));
  $('#copyPrompt')?.addEventListener('click', async () => {
    const text = $('#promptPreview').textContent;
    try {
      await navigator.clipboard.writeText(text);
      announce('Estructura copiada al portapapeles.');
    } catch (_) {
      const range = document.createRange(); range.selectNodeContents($('#promptPreview'));
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      announce('No se pudo copiar automáticamente. La estructura quedó seleccionada para copiarla manualmente.');
    }
  });
  updatePrompt();

  // Evaluación formativa con explicación inmediata y navegación paso a paso.
  const questions = [
    {q:'¿Cuál es una diferencia importante entre automatización y aumento?', options:['La automatización siempre es más segura.','El aumento ayuda a una persona a trabajar y decidir mejor.','El aumento elimina la necesidad de verificar.'], correct:1, why:'El aumento amplía la capacidad humana; no elimina la responsabilidad ni la necesidad de revisión.'},
    {q:'¿Qué significa que los datos sean sintéticos?', options:['Que siempre son anónimos y seguros.','Que son registros generados artificialmente para reproducir propiedades útiles.','Que son datos reales sin necesidad de permisos.'], correct:1, why:'Los datos sintéticos pueden ser útiles, pero todavía requieren pruebas de privacidad, calidad y sesgo.'},
    {q:'¿Qué debe hacerse antes de escalar un caso de uso de IA?', options:['Lanzarlo a toda la empresa para aprender más rápido.','Medirlo solo por la rapidez de respuesta.','Probar un piloto con métricas, controles y criterios de salida.'], correct:2, why:'Un piloto permite comparar con una línea base y evaluar calidad, costos, riesgos y adopción.'},
    {q:'¿Qué demuestra una respuesta de IA bien redactada?', options:['Que su contenido es necesariamente verdadero.','Solo que el texto parece coherente; los hechos importantes aún deben verificarse.','Que la fuente citada existe.'], correct:1, why:'La fluidez no garantiza exactitud. Verifica afirmaciones relevantes con fuentes primarias.'}
  ];
  let quizIndex = 0, quizScore = 0, answered = false, quizFinished = false;
  const quizNext = $('#quizNext');
  function renderQuestion() {
    const q = questions[quizIndex]; answered = false;
    $('#quizKicker').textContent = `PREGUNTA ${String(quizIndex + 1).padStart(2, '0')}`;
    $('#quizQuestion').textContent = q.q;
    $('#quizOptions').innerHTML = '';
    q.options.forEach((option, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'quiz-option'; button.dataset.answer = String(index); button.textContent = option;
      button.addEventListener('click', () => chooseAnswer(index)); $('#quizOptions').append(button);
    });
    $('#quizFeedback').textContent = '';
    $('#quizScore').textContent = `Puntuación: ${quizScore}`;
    $('#quizProgressBar').style.width = `${(quizIndex + 1) / questions.length * 100}%`;
    $('#quizProgressLabel').textContent = `Pregunta ${quizIndex + 1} de ${questions.length}`;
    quizNext.disabled = true; quizNext.textContent = quizIndex === questions.length - 1 ? 'Ver resultado →' : 'Siguiente pregunta →';
  }
  function chooseAnswer(index) {
    if (answered) return; answered = true;
    const q = questions[quizIndex];
    $$('.quiz-option', $('#quizOptions')).forEach((button, i) => {
      button.disabled = true;
      if (i === q.correct) button.classList.add('correct');
      else if (i === index) button.classList.add('incorrect');
    });
    if (index === q.correct) { quizScore++; $('#quizFeedback').textContent = `¡Correcto! ${q.why}`; }
    else $('#quizFeedback').textContent = `No exactamente. ${q.why}`;
    $('#quizScore').textContent = `Puntuación: ${quizScore}`;
    quizNext.disabled = false;
  }
  quizNext?.addEventListener('click', () => {
    if (quizFinished) { quizIndex = 0; quizScore = 0; quizFinished = false; renderQuestion(); return; }
    if (!answered) return;
    if (quizIndex < questions.length - 1) { quizIndex++; renderQuestion(); }
    else {
      quizFinished = true;
      $('#quizKicker').textContent = 'RESULTADO FINAL';
      $('#quizQuestion').textContent = `Obtuviste ${quizScore} de ${questions.length} respuestas correctas.`;
      $('#quizOptions').innerHTML = '';
      $('#quizFeedback').textContent = quizScore === questions.length ? 'Excelente: estás conectando utilidad, verificación y gobernanza.' : 'Repasa las secciones de automatización, datos y riesgos y vuelve a intentarlo.';
      quizNext.textContent = 'Repetir evaluación ↻'; quizNext.disabled = false;
    }
  });
  renderQuestion();

  // Glosario con búsqueda instantánea.
  const glossarySearch = $('#glossarySearch');
  glossarySearch?.addEventListener('input', () => {
    const query = glossarySearch.value.trim().toLocaleLowerCase('es');
    let visible = 0;
    $$('.glossary-item').forEach(item => {
      const text = `${item.dataset.term || ''} ${item.textContent}`.toLocaleLowerCase('es');
      const show = !query || text.includes(query);
      item.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });
    let empty = $('#glossaryEmpty');
    if (!visible) {
      if (!empty) { empty = document.createElement('p'); empty.id = 'glossaryEmpty'; empty.textContent = 'No encontramos ese término. Prueba con otra palabra.'; empty.className = 'search-status'; $('#glossaryGrid').after(empty); }
    } else if (empty) empty.remove();
  });
})();
