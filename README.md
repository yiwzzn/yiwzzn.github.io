# IA & Empresa — experiencia interactiva

Sitio educativo adaptable sobre cómo la inteligencia artificial transforma la gestión empresarial. Está construido con HTML, CSS y JavaScript nativos, sin frameworks ni dependencias externas, para publicarse en GitHub Pages.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub, por ejemplo `ia-empresa`.
2. Sube `index.html`, `styles.css`, `app.js` y `README.md` a la raíz del repositorio.
3. En el repositorio abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/ (root)`, luego pulsa **Save**.
6. Espera la publicación y abre la URL que GitHub Pages muestre en esa sección.

## Ejecutar localmente

Abre `index.html` en un navegador moderno. No se requiere instalar paquetes ni iniciar un servidor para las interacciones principales.

## Contenido e interacciones

- Navegación anclada y menú móvil.
- Tema claro/oscuro con preferencia local.
- Evolución de la IA, automatización frente a aumento y ejemplos de uso empresarial.
- Filtros por área y búsqueda de casos de uso.
- Pestañas accesibles con soporte de teclado.
- Secciones sobre habilidades, capacitación, cultura y liderazgo de IA/CAIO.
- Riesgos, controles prácticos, privacidad, datos sintéticos y privacidad diferencial.
- Laboratorio para construir la estructura de un prompt y copiarla.
- Quiz formativo con retroalimentación.
- Glosario filtrable, preguntas frecuentes y enlaces a fuentes institucionales.

## Personalización visual

Las variables CSS principales están al inicio de `styles.css`, dentro de `:root`: `--bg`, `--surface`, `--ink`, `--muted`, `--accent`, `--blue`, `--cyan`, `--lime`, `--purple`, `--radius`, `--max` y `--font`.

## Accesibilidad y UX

- HTML semántico, idioma español, enlace para saltar al contenido y etiquetas de navegación.
- Estados de foco visibles y controles con nombres accesibles.
- Estados ARIA para menú, filtros y pestañas; navegación de pestañas con teclado.
- Texto alternativo conceptual para la ilustración generada con CSS (no depende de una imagen externa).
- Diseño adaptable con Flexbox/Grid y breakpoints para escritorio, tableta y móvil.
- Respeta `prefers-reduced-motion`.
- Contraste alto en zonas principales y áreas táctiles cómodas.

## Notas de rigor

El sitio es material educativo, no asesoría legal, de seguridad ni de inversión. Las aplicaciones son ejemplos ilustrativos y no garantías de resultados. Los marcos y requisitos cambian; verifica las fuentes oficiales y la legislación vigente aplicable a cada organización.
