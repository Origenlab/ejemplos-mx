> Título SEO: Homologación y control de calidad para una flota de sitios web (framework práctico)

# Framework de Homologación y Control de Calidad para Decenas de Sitios Web

## Introducción ejecutiva

Construir un sitio bien es un problema de oficio. Construir cuarenta sitios que se vean, se comporten y se mantengan **igual de bien** es un problema distinto: es un problema de homologación. La diferencia se siente el día que cambias un detalle en un componente compartido y tienes que rezar para que no haya roto algo en los otros treinta y nueve sitios que no estás mirando. Esta guía trata de no rezar: de construir el andamiaje que hace que la calidad sea una propiedad del sistema y no una virtud de la persona que tuvo cuidado ese día.

El punto de partida del repo es bueno y conviene reconocerlo. Tiene una **fuente única de verdad** que reduce la superficie de edición de cada sitio a tres zonas, **design tokens** que permiten re-vestir un sitio entero cambiando un archivo, y una **librería de componentes** con un componente por tipo de entidad. Eso ya es más homologación de la que tienen la mayoría de las operaciones que producen sitios en serie. Lo que falta —y es el otro 50% de esta guía— son las **compuertas automáticas**: el ojo humano no escala a revisar cuarenta sitios, así que la calidad tiene que vigilarla la máquina.

Aquí no hay teoría sin cicatriz. Cada convención que vas a leer existe porque romperla costó algo: un componente bespoke que desentonó, unos estilos que no aparecían, unas tarjetas que no cuadraban con el resto. La homologación no es burocracia; es el recuerdo institucional de los errores que ya no queremos repetir.

## Tabla de contenido

1. [Qué es homologar y por qué importa a escala](#1-qué-es-homologar-y-por-qué-importa-a-escala)
2. [La SSoT como motor de homologación](#2-la-ssot-como-motor-de-homologación)
3. [Design tokens: una marca, un archivo](#3-design-tokens-una-marca-un-archivo)
4. [La librería de componentes: uno por tipo](#4-la-librería-de-componentes-uno-por-tipo)
5. [Reusar antes que inventar: el caso Benefits](#5-reusar-antes-que-inventar-el-caso-benefits)
6. [Convenciones que no se negocian](#6-convenciones-que-no-se-negocian)
7. [Las GuiaNota como onboarding vivo](#7-las-guianota-como-onboarding-vivo)
8. [Compuertas de CI: lo que el ojo no escala a revisar](#8-compuertas-de-ci-lo-que-el-ojo-no-escala-a-revisar)
9. [Regresión visual: probar la flota con un cambio](#9-regresión-visual-probar-la-flota-con-un-cambio)
10. [La deuda del puente de tokens (honestidad)](#10-la-deuda-del-puente-de-tokens-honestidad)
11. [Casos de uso](#11-casos-de-uso)
12. [Buenas prácticas](#12-buenas-prácticas)
13. [Errores comunes y su porqué](#13-errores-comunes-y-su-porqué)
14. [Procedimiento: homologar un componente nuevo](#14-procedimiento-homologar-un-componente-nuevo)
15. [Checklist de homologación](#15-checklist-de-homologación)
16. [KPIs e indicadores de calidad](#16-kpis-e-indicadores-de-calidad)
17. [Conclusiones](#17-conclusiones)
18. [Recomendaciones finales](#18-recomendaciones-finales)

---

## 1. Qué es homologar y por qué importa a escala

Homologar es garantizar que dos cosas que deberían ser iguales **lo sean**, y que lo sigan siendo cuando cambien. En una flota de sitios, eso opera en dos niveles. El primero es dentro de un sitio: que todas las tarjetas de catálogo se vean idénticas, que todos los títulos sigan el mismo patrón, que el botón de WhatsApp sea el mismo en todas partes. El segundo es entre sitios: que el sitio del cliente A y el del cliente B compartan la misma base de código, los mismos componentes y los mismos estándares, de modo que una mejora se haga una vez y beneficie a todos.

El antónimo de homologar es la **deriva**: ese proceso lento por el cual, sin que nadie lo decida, las cosas que empezaron iguales se vuelven distintas. Una tarjeta que alguien ajustó "solo para esta página", un color hex que se coló a mano en lugar del token, un componente nuevo que reinventa lo que ya existía. La deriva no llega de golpe; llega de a poquito, y para cuando se nota, deshacerla cuesta diez veces más que haberla prevenido. Por eso la homologación es, sobre todo, una disciplina de **prevención**, y las herramientas que vamos a ver existen para que la deriva sea difícil, no para arreglarla después.

## 2. La SSoT como motor de homologación

La fuente única de verdad no es solo una buena práctica de datos; es el primer motor de homologación del sistema. Si toda la identidad, el contacto, la taxonomía y la navegación de un sitio viven en `site.ts`, y toda la marca visual vive en `tokens.css`, entonces **la superficie de personalización de un sitio nuevo son tres zonas**: configuración, tokens y contenido. Todo lo demás —layouts, componentes, librería de SEO— es idéntico entre sitios, y por construcción está homologado.

Esto convierte "levantar un sitio nuevo homologado" en un acto mecánico en lugar de un acto creativo propenso a deriva. No hay margen para que el sitio B tenga un header sutilmente distinto al del sitio A, porque ambos heredan el mismo componente de header que se alimenta del mismo `NAV` derivado de la taxonomía. La regla que esto impone, y que hay que defender con terquedad: **nada que deba ser igual entre sitios se edita fuera de las tres zonas.** El día que alguien "arregla rápido" un componente compartido para un solo sitio, rompió la homologación y abrió la puerta a la deriva.

## 3. Design tokens: una marca, un archivo

Los **design tokens** son la homologación visual hecha sistema. En `tokens.css`, los colores, tipografías, espaciados y radios viven como variables CSS en un solo lugar, y **cada componente bebe de ahí** —nada tiene su color escrito a mano—. La consecuencia es que re-vestir un sitio entero para un cliente nuevo toma minutos: cambias `--c-primary` (hoy el índigo `#5b3df5`) y la fuente principal, y los botones, las tarjetas, el header y hasta la sección de "sistema de diseño" se revisten de golpe. Una sola fuente de verdad para la marca significa cero búsqueda de colores sueltos regados por mil archivos.

A la escala de un sitio, `tokens.css` cumple de sobra. Cuando la flota crezca a muchas marcas, la práctica que conviene adoptar es el estándar **W3C DTCG** (que alcanzó su primera versión estable en octubre de 2025) transformado a variables CSS con **Style Dictionary**, organizando los tokens en dos capas: *primitivos* (la paleta cruda) y *semánticos* (los roles: "primario", "superficie", "texto"). Así, cada marca nueva sobreescribe solo la capa primitiva, y todo lo semántico —que es lo que usan los componentes— se re-mapea solo. Es la diferencia entre "cada sitio define sus colores" y "cada sitio elige su paleta y el sistema hace el resto".

```css
/* tokens.css — una marca, un archivo. Cambia esto y se reviste todo el sitio. */
:root {
  --c-primary: #5b3df5;        /* índigo de marca; sustituir por el del cliente */
  --c-primary-dark: #3f28c2;
  --c-ink: #14132a;            /* texto principal */
  --c-surface: #f5f5fb;        /* fondos suaves */
  --c-border: #e6e6f0;
  /* …espaciados, radios, tipografía: el resto del sistema los hereda */
}
```

## 4. La librería de componentes: uno por tipo

El sistema sigue un patrón claro y homologante: **un componente por tipo de entidad**. `CategoryCard` para categorías, `ProductCard` para productos, `ServiceCard` para servicios, `ReviewCard` para reseñas, `ContactForm` para el formulario. No hay diez variantes de "tarjeta"; hay una por propósito, y cada una vive en un archivo con su comentario de cabecera que explica qué es, por qué está armada así y qué props recibe. Esa cabecera no es adorno: es el contrato del componente, y es lo que permite que alguien nuevo lo use bien sin leer su CSS.

La virtud de este patrón a escala es doble. Primero, **consistencia**: todas las fichas de producto del sitio —y de todos los sitios— se ven y se comportan igual porque salen del mismo componente. Segundo, **mantenibilidad**: mejorar las fichas de producto es editar un archivo, y el cambio se propaga a todas las instancias en todos los sitios que comparten la librería. La regla de oro de una librería homologada: **antes de crear un componente, pregunta si ya existe uno que hace el 80% del trabajo.** Casi siempre la respuesta es sí, y reusarlo —aunque cueste un poco más de pensamiento— es lo que mantiene la flota coherente.

## 5. Reusar antes que inventar: el caso Benefits

Esta lección la pagamos en vivo, y es el corazón de la guía. Construyendo la sección "Por qué elegirnos", hicimos lo intuitivo: un componente nuevo, `Benefits.astro`, con su diseño propio —tiles de ícono con degradado, una métrica destacada, su CSS a medida—. Se veía bien. Y estaba **mal**, por dos razones que no son obvias hasta que muerden.

La primera: desentonaba. El sitio ya tenía un lenguaje de tarjetas (el del catálogo, `CategoryCard`), y este componente inventaba otro. Dos lenguajes de tarjeta en la misma página es exactamente la deriva visual que la homologación existe para impedir. La segunda, más sutil y más cara: un componente nuevo trae estilos *scoped* nuevos, y en el entorno de desarrollo esos estilos **no se inyectan hasta reiniciar el servidor** —pasamos un buen rato persiguiendo un "se ve sin CSS" que no era un bug del código sino del ciclo de vida de un componente nuevo—.

La corrección fue homologar: borramos `Benefits.astro` y reusamos `CategoryCard` para los beneficios —misma foto, badge, título, texto y CTA que el catálogo—. El resultado lo dice todo: **−143 líneas netas de código**, diseño idéntico al resto del sitio, y un bug menos. La moraleja que dejó esto, y que conviene tatuar en la cultura del equipo: *reusar no es pereza; inventar sin necesidad es la deriva.* El componente más homologado es el que no escribiste porque ya existía.

## 6. Convenciones que no se negocian

Una flota coherente necesita un puñado de reglas que **no se discuten en cada PR**, porque discutirlas cada vez es la puerta de entrada de la deriva. En este sistema hay varias, y vale nombrarlas como lo que son: leyes, no sugerencias.

- **Todos los títulos van en `duo`.** Cada título de sección usa `SectionHeading layout="duo"`: eyebrow + título + descripción a la izquierda, dos párrafos a la derecha. Un solo patrón para todos los títulos del sitio. Inventar el formato de un título es romper la ley.
- **Los módulos "categoría a fondo" son idénticos, sin zig-zag.** Todos van con la información a la izquierda y la galería a la derecha, sin alternar lados ni fondos. La tentación del zig-zag (alternar para "dar dinamismo") está prohibida: la consistencia gana al adorno.
- **WhatsApp siempre vía `waUrl()`** (regla D4), nunca el número a mano.
- **Nada de datos del negocio hardcodeados** fuera de `site.ts`.

Estas reglas tienen un costo —a veces quisieras alternar un lado o ajustar un título "solo aquí"— y ese costo es precisamente el punto. La homologación se sostiene cuando las excepciones cuestan más de lo que valen, no cuando dependen de la disciplina de cada quien bajo presión de entrega.

## 7. Las GuiaNota como onboarding vivo

Hay una pieza de homologación en este repo que es genuinamente original: las **`GuiaNota`**. Cada módulo de la home lleva una nota que explica, ahí mismo, qué hace el bloque, por qué está armado así y en qué archivo se edita. El sitio es, a la vez, una demo de negocio real y un manual de sí mismo. Para una operación que mete gente nueva con frecuencia —redactores, desarrolladores junior—, esto es oro: el onboarding no es un PDF que nadie lee, es el propio producto explicándose mientras se navega.

¿Por qué esto homologa? Porque la deriva nace muchas veces de la ignorancia, no de la malicia: alguien edita un componente de la forma equivocada porque no sabía que existía la forma correcta. Una `GuiaNota` que dice "esto se edita en `site.ts`, no aquí" previene ese error en el momento exacto en que alguien estaría a punto de cometerlo. En un sitio real de cliente estas notas se quitan, pero en la plantilla-guía son la documentación que no se desactualiza, porque vive pegada al código que describe.

## 8. Compuertas de CI: lo que el ojo no escala a revisar

Aquí está el frente donde el sistema todavía depende demasiado del cuidado humano, y donde más rinde invertir. Hoy el CI corre `astro check` antes de `astro build`, lo que significa que **un error de tipos bloquea el deploy** —y el historial muestra `astro check` en verde en cada commit, lo cual ya es una compuerta real—. Pero faltan tres compuertas que el ojo no escala a vigilar en cuarenta sitios:

1. **Gate de datos demo.** Un paso de `predeploy` que haga `grep` de centinelas (`0000 0000`, `Av. Demo`, `(DEMO)`) y **falle el build** si los encuentra en producción. Es la red que atrapa el error más vergonzoso de una fábrica: publicar un sitio a medio llenar con datos de relleno.
2. **Chequeo de enlaces internos.** Un paso post-build que recorra el sitio y falle si hay enlaces a páginas inexistentes. Atraparía, hoy mismo, los 404 de la nav que la auditoría encontró.
3. **Presupuesto de rendimiento.** Lighthouse CI con un `budget.json` compartido y `runs: 3` (para evitar falsos negativos por ruido). Garantiza que ningún sitio de la flota regrese por debajo del estándar de velocidad.

A todo esto se suman las herramientas de estilo —`eslint-plugin-astro`, `prettier-plugin-astro`, Stylelint— configuradas **una vez como paquetes compartidos** y aplicadas en cada repo. La idea unificadora: cuando produces muchos sitios casi idénticos, **la revisión manual no escala**; las compuertas automáticas son el único mecanismo que mantiene uniforme a la flota sin que un humano tenga que mirar cada deploy.

## 9. Regresión visual: probar la flota con un cambio

El miedo legítimo de una librería compartida es el de la sección 1: cambias un componente y no sabes a qué sitios afectó. La respuesta profesional es la **regresión visual**. Se desarrolla y documenta la librería en **Storybook** (con Autodocs, que mantiene la documentación pegada a la API real del componente, sin desactualizarse), y se conecta una herramienta de *visual testing* —**Chromatic** es el estándar— que toma una captura de cada componente en cada estado y, en cada PR, **compara pixel a pixel** contra la versión aprobada. Si un cambio movió algo que no debía, el PR lo muestra antes de mezclar, no después de desplegar.

La pieza que cierra el ciclo es hacer esos chequeos **obligatorios**: el visual, el de interacción y el de accesibilidad como *required checks* del PR. Con eso, "un cambio en el botón compartido" deja de ser un acto de fe y se vuelve un experimento controlado: o pasa las pruebas contra toda la flota, o no se mezcla. A esto se le suma versionar la librería con SemVer y Changesets, de modo que cada sitio decida cuándo adopta una versión nueva en lugar de heredar cambios sin avisar.

## 10. La deuda del puente de tokens (honestidad)

Una auditoría que solo elogia no sirve, así que aquí va la deuda real del sistema de homologación. El repo arrastra un **puente de tokens** heredado de proyectos origen: variables como `--color-red`, `--color-gray-50` o `--color-red-light` que se mapean a los tokens actuales (`--c-primary`, etc.) con valores hex *de fallback* literales —un rojo `#C41E24`, por ejemplo, cuando la marca real es índigo—. Esos fallbacks solo se disparan si falta un token, así que en la práctica no rompen nada; pero son una **trampa latente**: el día que alguien copie un componente a un contexto donde el token no esté definido, aparecerá un rojo fantasma en un sitio índigo.

Encontramos un caso vivo de esto homologando el FAQ: el estado "abierto" del acordeón usaba `--color-red-light`, que sin definir caía a un rosa-rojo en un sitio morado. Lo corregimos a un tinte de la marca con `color-mix`. La lección de homologación es general: **los fallbacks hex literales son deuda disfrazada de robustez.** Como los tokens están garantizados por `BaseLayout`, lo correcto es pagar la deuda quitando esos fallbacks y dejando que el sistema dependa de su única fuente de verdad de color, sin redes de seguridad que mienten.

## 11. Casos de uso

- **Levantar el sitio 15 de la flota.** Se clona, se editan las tres zonas (config, tokens, contenido), y por construcción queda homologado con los otros 14. El código no se toca.
- **Mejorar las fichas de producto en toda la flota.** Se edita `ProductCard` una vez; la regresión visual confirma que no rompió nada; se versiona y cada sitio adopta.
- **Re-vestir un sitio para un rebrand.** Se cambian los tokens primitivos; todo lo semántico se re-mapea solo.
- **Meter a un desarrollador nuevo.** Las `GuiaNota` y los comentarios de cabecera lo orientan sin un manual aparte.

## 12. Buenas prácticas

- Edita solo las tres zonas (config, tokens, contenido) por sitio; nada compartido se toca "solo para uno".
- Define la marca en tokens; cero colores hex a mano en componentes.
- Un componente por tipo; antes de crear, busca el que ya hace el 80%.
- **Reusa antes que inventes**; el mejor componente es el que no escribiste.
- Trata las convenciones (duo, no zig-zag, D4) como leyes, no como sugerencias.
- Documenta en el código (cabeceras, `GuiaNota`), no en un PDF aparte.
- Automatiza las compuertas (demo, enlaces, Lighthouse, lint); el ojo no escala.
- Prueba la flota con regresión visual antes de mezclar un cambio compartido.

## 13. Errores comunes y su porqué

| Error | Por qué genera deriva | Antídoto |
|---|---|---|
| Componente bespoke que duplica uno existente | Dos lenguajes visuales en el mismo sistema | Reusar el componente aprobado |
| "Arreglo rápido" en un componente compartido para un sitio | Rompe la homologación entre sitios | Editar solo las tres zonas; cambios compartidos versionados |
| Color hex a mano en un componente | Escapa al sistema de tokens; deriva visual | Usar siempre la variable del token |
| Fallback hex literal en el puente de tokens | Rojo fantasma en un sitio de otra marca | Quitar fallbacks; depender de la SSoT de color |
| Excepción a una convención "solo aquí" | La primera grieta de la deriva | Convenciones como leyes; excepción que cueste |
| Revisar la flota a ojo | No escala; se cuela lo que nadie miró | Compuertas automáticas en CI |
| Cambiar un componente compartido sin regresión visual | Rompes sitios que no estás mirando | Storybook + Chromatic como required check |
| Documentación en un doc aparte | Se desactualiza; nadie la lee | Documentar pegado al código |

## 14. Procedimiento: homologar un componente nuevo

1. **Verifica que de verdad sea nuevo**: ¿hay un componente existente que hace el 80%? Si sí, reúsalo o extiéndelo.
2. **Escribe la cabecera de contrato**: qué es, por qué está armado así, qué props recibe.
3. **Usa solo tokens** para color/espaciado/tipografía; cero hex a mano.
4. **Respeta las convenciones** (jerarquía de encabezados, `duo` para títulos, D4 para WhatsApp).
5. **Documenta el módulo** con una `GuiaNota` si vive en la plantilla-guía.
6. **Crea su historia en Storybook** con todos los estados relevantes.
7. **Conecta la regresión visual** (Chromatic) y haz el chequeo obligatorio.
8. **Versiona** con SemVer + Changesets; deja que cada sitio adopte la versión.
9. **Verifica** `astro check` + lint + build en limpio antes de publicar.

## 15. Checklist de homologación

- [ ] El sitio nuevo se levantó editando solo config, tokens y contenido.
- [ ] Cero colores hex a mano; todo viene de `tokens.css`.
- [ ] Ningún componente compartido fue editado "solo para un sitio".
- [ ] No hay componentes bespoke que dupliquen uno existente.
- [ ] Las convenciones (duo, no zig-zag, D4, datos en `site.ts`) se cumplen sin excepción.
- [ ] Cada componente tiene cabecera de contrato y, si aplica, `GuiaNota`.
- [ ] Los fallbacks hex literales del puente de tokens están en el backlog de limpieza.
- [ ] CI corre `astro check`, lint y build como puerta bloqueante.
- [ ] Existe (o está planificado) el gate de datos demo y el chequeo de enlaces.
- [ ] La librería compartida tiene regresión visual obligatoria antes de mezclar.

## 16. KPIs e indicadores de calidad

| Indicador | Meta | Por qué |
|---|---|---|
| Zonas editadas por sitio nuevo | 3 (config, tokens, contenido) | Mide que la homologación se respeta |
| Colores hex a mano en componentes | 0 | Todo color viene del token |
| Componentes bespoke duplicando uno existente | 0 | Señal de deriva visual |
| PRs a componentes compartidos sin regresión visual | 0 | Cambios compartidos verificados contra la flota |
| Cobertura de historias en Storybook | Alta | Documentación viva + base de la regresión |
| Compuertas automáticas activas en CI | demo + enlaces + Lighthouse + lint | El ojo no escala |
| Centinelas de datos demo en producción | 0 | Atrapados por el gate |
| Variación visual no intencional entre sitios | 0 | El propósito mismo de homologar |
| Tiempo de adopción de una mejora en la flota | Bajo | Una edición, propagación versionada |

## 17. Conclusiones

La homologación es lo que convierte "sé hacer un sitio bueno" en "tengo un sistema que produce sitios buenos". El repo ya tiene los cimientos: la SSoT que reduce la edición a tres zonas, los tokens que re-visten un sitio con un archivo, y la librería de un componente por tipo. La lección más cara —el caso Benefits— dejó la regla cultural que sostiene todo: **reusar antes que inventar**, porque cada componente que reinventas sin necesidad es una grieta por donde entra la deriva.

Lo que falta es el otro pilar: las **compuertas automáticas**. A escala de flota, el cuidado humano no alcanza; la calidad tiene que ser una propiedad que la máquina verifica en cada deploy —datos demo, enlaces, rendimiento, regresión visual—. Y hay que pagar la deuda honesta del puente de tokens, esos fallbacks rojos que son una red de seguridad que miente. Con esos dos movimientos, la homologación deja de depender de que alguien tenga cuidado y pasa a ser, como debe, una garantía del sistema.

## 18. Recomendaciones finales

1. **Instala el gate de datos demo y el chequeo de enlaces** en CI; son baratos y atrapan los dos errores que más rompen la credibilidad de la flota.
2. **Adopta la cultura "reusar antes que inventar"** como criterio explícito de revisión de PR, con el caso Benefits como ejemplo.
3. **Paga la deuda del puente de tokens**: quita los fallbacks hex literales; que el sistema dependa de su única fuente de color.
4. **Monta Storybook + regresión visual** cuando la librería se comparta entre sitios; haz el chequeo obligatorio.
5. **Eleva los tokens a W3C DTCG + Style Dictionary** cuando la flota tenga varias marcas; capas primitiva/semántica para re-brandear sin duplicar.
6. **Defiende las convenciones como leyes**: la homologación se sostiene cuando la excepción cuesta más de lo que vale.

> Documento vivo. La homologación se mide por lo que evita, no por lo que produce. Relacionado: `01` (arquitectura) · `02` (SEO) · `03` (contenido) · `05` (fábrica).
