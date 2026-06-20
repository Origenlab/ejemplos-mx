> Título SEO: SEO para servicios y directorios locales — metodología 2026 (con lo que cambió este año)

# Metodología SEO Moderna para Sitios de Servicios y Directorios Locales

## Introducción ejecutiva

El SEO local de 2026 castiga dos cosas con saña: la mentira y la pereza. La mentira es marcar un negocio que no existe, inflar reseñas, prometer en el `<title>` lo que la página no cumple. La pereza es generar cien páginas "[servicio] en [ciudad]" cambiando solo el nombre del municipio. Esta guía está escrita contra esos dos pecados, y lo hace desde un sistema real —`ejemplos-mx`— que ya tomó varias de las decisiones correctas y todavía arrastra un par de errores que vamos a nombrar sin maquillaje.

La buena noticia es que el motor de SEO de este proyecto no es marketing improvisado: es una librería (`src/lib/seo.ts`) con reglas codificadas y auditables. Construye títulos con la palabra clave principal al frente y un tope de 60 caracteres, descripciones de 120–160, y un grafo JSON-LD que liga `Organization`, `WebSite` y `LocalBusiness` por `@id`. Tiene incluso una función, `metaAudit`, que se autocalifica con nueve condiciones. Eso es más disciplina de la que tiene el 95% de los sitios de servicios que verás esta semana.

La mala noticia, y el motivo de esta guía, es que la disciplina técnica no salva a nadie del cambio de reglas. En 2026 pasaron tres cosas que reordenan el tablero: **Google retiró por completo los rich results de FAQ** (7 de mayo), la política de **scaled content abuse** ya vive en el núcleo del ranking, y **Cloudflare compró Astro**. Quien siga optimizando con el manual de 2022 va a invertir esfuerzo en snippets que ya no existen y a esquivar penalizaciones que ya están encendidas. Vamos a recorrer la metodología que sí aplica hoy, decisión por decisión, con el código del repo como testigo.

## Tabla de contenido

1. [La tripleta de keywords: jerarquía antes que volumen](#1-la-tripleta-de-keywords-jerarquía-antes-que-volumen)
2. [Títulos y descriptions: el motor de metas (y por qué quitamos «Kw1:»)](#2-títulos-y-descriptions-el-motor-de-metas-y-por-qué-quitamos-kw1)
3. [Datos estructurados: el grafo que sí y los snippets que ya no](#3-datos-estructurados-el-grafo-que-sí-y-los-snippets-que-ya-no)
4. [El cambio de 2026: adiós a los rich results de FAQ](#4-el-cambio-de-2026-adiós-a-los-rich-results-de-faq)
5. [Sobreoptimización: cómo se ve y por qué se castiga](#5-sobreoptimización-cómo-se-ve-y-por-qué-se-castiga)
6. [Scaled content abuse: el mayor riesgo de una fábrica de sitios](#6-scaled-content-abuse-el-mayor-riesgo-de-una-fábrica-de-sitios)
7. [E-E-A-T y Helpful Content: la confianza por encima de todo](#7-e-e-a-t-y-helpful-content-la-confianza-por-encima-de-todo)
8. [Enlazado interno: el contrato que las rutas muertas rompen](#8-enlazado-interno-el-contrato-que-las-rutas-muertas-rompen)
9. [SEO local de verdad: NAP, nombre y ficha de Google](#9-seo-local-de-verdad-nap-nombre-y-ficha-de-google)
10. [Los bugs SEO reales de este repo](#10-los-bugs-seo-reales-de-este-repo)
11. [Casos de uso](#11-casos-de-uso)
12. [Buenas prácticas](#12-buenas-prácticas)
13. [Errores comunes y su porqué](#13-errores-comunes-y-su-porqué)
14. [Procedimiento: optimizar una ficha de servicio](#14-procedimiento-optimizar-una-ficha-de-servicio)
15. [Checklist SEO](#15-checklist-seo)
16. [KPIs e indicadores de calidad](#16-kpis-e-indicadores-de-calidad)
17. [Conclusiones](#17-conclusiones)
18. [Recomendaciones finales](#18-recomendaciones-finales)

---

## 1. La tripleta de keywords: jerarquía antes que volumen

El error clásico del SEO de servicios es pensar en keywords como una bolsa: cuantas más, mejor. La metodología del repo piensa al revés —en **jerarquía**—: cada página declara tres palabras clave en orden de importancia (`kw1` principal, `kw2` secundaria, `kw3` variante), y todo el resto se construye sobre esa tripleta. No es un detalle estético: que la `kw1` sea *una* y vaya *primero* es lo que evita que una página intente rankear para cinco cosas y no rankee para ninguna.

La página declara su tripleta y el sistema hace el resto:

```astro
<PageLayout keywords={["plomería CDMX", "fontanero a domicilio", "reparación de fugas"]} />
```

La regla operativa para elegirlas es de intención, no de volumen: la `kw1` es lo que la persona escribiría si tuviera el problema ahora mismo ("fontanero a domicilio"), no el término más buscado en abstracto ("plomería"). En servicios locales, la intención transaccional —alguien con una fuga a las once de la noche— vale más que el volumen informativo. El módulo de "Metadatos" de la home enseña esto en vivo, mostrando la misma description bien hecha y mal hecha, y dejando que la propia regla marque la versión recargada.

## 2. Títulos y descriptions: el motor de metas (y por qué quitamos «Kw1:»)

El `<title>` es, en palabras de la propia documentación de Google, *la principal información que la gente usa para decidir en qué resultado hacer clic.* No hay límite duro de caracteres —el navegador trunca por ancho de pantalla, y los ~50–60 son un artefacto de ese truncado, no una ley—, pero hay reglas que sí importan: único por página, descriptivo, con el significado al frente, y la marca al final con un separador discreto. Si el título está medio vacío, desactualizado o duplicado, Google lo reescribe por ti, y casi nunca lo hace mejor que tú.

`buildKeywordTitle` codifica esto: arma el título empezando por la `kw1`, sin pegar la marca al frente, y lo recorta respetando el tope con una poda inteligente de "finales débiles" (no corta a media palabra ni deja una preposición colgando). Es buena ingeniería.

La description es donde este proyecto cometió —y corrigió— un error instructivo. La función `buildKeywordDescription` **inyectaba `«Kw1: …»` al frente** cuando la copy no abría con la palabra clave principal. La intención era buena (Google premia que la description abra con la kw1), pero el resultado era un patrón robótico de keyword-stuffing: descripciones que empezaban con un dos puntos artificial, exactamente la cadencia de máquina que toda esta metodología dice evitar. Lo quitamos:

```ts
// ANTES (robótico): forzaba «Kw1: ...» al frente
if (k1 && !text.toLowerCase().startsWith(k1.toLowerCase())) {
  text = `${capitalize(k1)}: ${text}`;     // ← stuffing
}
// AHORA: no se fuerza nada; metaAudit.opensWithK1 avisa para reescribir natural
const text = (copy ?? '').trim();
return truncateMetaDescription(text);
```

La lección es más grande que una función: **un sistema que predica "escribe para humanos" no puede tener una línea de código que escribe para el robot.** La regla "abre con la kw1" sigue siendo buena; lo que cambió es quién la cumple: ahora la persona, avisada por `metaAudit`, en vez de un `text = lead + ': ' + text` que delataba la costura. Para servicios locales, una description del estilo *"Reparamos fugas y destapamos drenajes en CDMX el mismo día, con garantía por escrito. Cotización sin compromiso por WhatsApp."* convierte más que cualquier lista de keywords —y es justo el ejemplo que Google pone como bueno frente al malo—.

## 3. Datos estructurados: el grafo que sí y los snippets que ya no

El JSON-LD de este repo es ejemplar y conviene entender por qué. En vez de esparcir bloques de schema por cada componente, `lib/seo.ts` emite un **`@graph`** único que liga `Organization`, `WebSite` y `LocalBusiness` por `@id`, de modo que Google entiende que son la misma entidad vista desde tres ángulos. Y hay una decisión de carácter que vale oro: **el sistema se niega a fabricar `aggregateRating`**. No inventa "4.8 estrellas de 200 reseñas" porque no las tiene. Esa honestidad no es solo ética —es la política correcta—: marcar reseñas sobre tu propio negocio (incluso vía widgets de Google o Facebook incrustados) te deja inelegible para las estrellas y te expone a una acción manual.

El mapa de qué schema usar en 2026, para un sitio de servicios local:

| Schema | ¿Sirve hoy? | Regla clave |
|---|---|---|
| `LocalBusiness` | **Sí** | Usa el subtipo específico (`Plumber`, `Electrician`); `geo` con ≥5 decimales; **un bloque por URL de ubicación**; debe coincidir con el contenido visible |
| `BreadcrumbList` | **Sí** | ≥2 niveles; refleja el camino del usuario, no la URL; emítelo **una sola vez** |
| `Service` | Parcial | No genera rich result propio; la entidad soportada para un negocio de servicios es `LocalBusiness`, no un snippet por servicio |
| `Product` | Solo fichas únicas | **Nunca** en páginas de categoría/listado ("zapatos en nuestra tienda" no es un producto específico) |
| `FAQPage` | **Ya no** (rich result retirado may-2026) | Mantén el FAQ por el usuario; no esperes snippet |
| `Review`/`AggregateRating` propio | **No marcar** | Reseñas sobre tu negocio = inelegibles; muéstralas vía tu ficha de Google |

El patrón de arquitectura que sostiene esto: el `BreadcrumbList` lo emite la librería **una vez**, no el componente visual `Breadcrumbs`. Si ambos lo emitieran, habría dos en la página y Google reportaría datos estructurados duplicados. Centralizar el schema en una librería —y no en los componentes— es lo que evita ese doble disparo a escala.

## 4. El cambio de 2026: adiós a los rich results de FAQ

Este merece su propia sección porque es el cambio que más esfuerzo mal invertido va a causar este año. **El 7 de mayo de 2026 Google retiró por completo los resultados enriquecidos de FAQ de la búsqueda.** No es la restricción de 2023 (que los limitaba a sitios de gobierno y salud): es la desaparición total de la función para todos. La herramienta de prueba dejó de reportarlos en junio; la API, en agosto.

¿Qué significa para este proyecto, que tiene un módulo de FAQ en la home? Dos cosas, y conviene no confundirlas. Primero: **el FAQ se queda**, porque sigue siendo útil para la persona que llega con una duda antes de contactar —resolver "¿cuánto tarda?", "¿dan garantía?" reduce fricción y mejora la conversión, con o sin snippet—. Segundo: **no inviertas en el schema `FAQPage` esperando estrellas en Google**, porque ya no las da. La auditoría del repo había marcado "falta el schema FAQ en la home" como hallazgo; con este dato de 2026, el hallazgo se reclasifica: añadirlo no aporta rich result, así que no es prioridad. Es un buen ejemplo de por qué auditar contra las reglas *vigentes* importa: un consejo correcto en 2022 es esfuerzo desperdiciado en 2026. (Lo mismo aplica a `HowTo`, deprecado desde 2023: si lo tienes, no urge quitarlo, pero no esperes que se muestre.)

## 5. Sobreoptimización: cómo se ve y por qué se castiga

La sobreoptimización tiene una firma reconocible, y casi siempre nace de tratar a Google como el lector. Sus síntomas: títulos que repiten la keyword con barras ("Plomería CDMX | Plomero CDMX | Plomería a domicilio CDMX"), descriptions que apilan términos en vez de hablar, párrafos que listan ciudades "para rankear en todas", y ese tono de folleto donde nadie estuvo realmente. Google nombra estos casos en sus propias políticas de spam con ejemplos que parecen escritos contra los directorios: *"listas de números de teléfono sin valor agregado sustancial"* y *"bloques de texto que listan ciudades y regiones para las que una página intenta rankear."*

El antídoto no es escribir menos keywords; es escribir para una persona y dejar que la keyword caiga natural. Una pista práctica del propio repo: el módulo de metadatos muestra la versión recargada (marca repetida + tokens duplicados + keyword apilada) y deja que `metaAudit` la marque sola con avisos. Tener una regla automatizada que detecta tu propia sobreoptimización es más honesto que confiar en el criterio bajo presión de entrega. Y la corrección del `«Kw1:»` de la sección 2 es el caso de manual: el primer keyword-stuffing que hay que eliminar suele ser el que tú mismo automatizaste sin darte cuenta.

## 6. Scaled content abuse: el mayor riesgo de una fábrica de sitios

Si esta metodología existe para construir docenas de sitios locales, este es el riesgo que puede tumbar a todos a la vez, y hay que mirarlo de frente. En marzo de 2024 Google cerró el último resquicio con la política de **scaled content abuse**, y la integró al núcleo. La definición es brutal por lo amplia: *"producir contenido a escala para mejorar el ranking —ya sea por automatización, por humanos o por una combinación."* El detonante no es la IA; es la *intención de escalar para rankear sin agregar valor*. Sus ejemplos golpean directo al modelo de directorio: páginas que "tienen poco sentido para el lector pero contienen palabras clave", y las *doorway pages* "dirigidas a regiones o ciudades específicas". Google reportó que esto redujo cerca de un 45% el contenido de baja calidad.

Traducido a este sistema: **clonar la plantilla para veinte ciudades cambiando solo el nombre del municipio es exactamente lo que Google penaliza.** La eficiencia de la SSoT —que hace trivial generar páginas— es, sin disciplina de contenido, una máquina de fabricar doorway pages. La salida no es dejar de escalar; es **escalar especificidad real**: cada página de zona con su detalle genuino —tiempos de traslado reales, colonias que de verdad se atienden, un caso o una foto de un trabajo hecho ahí—. El esquema de la colección `zonas` (con `geo`, `colonias`, `casos`) está diseñado para soportar esa especificidad; usarlo para rellenar con plantilla es traicionar su propósito. La regla de oro de la fábrica: *si la página de Coyoacán y la de Tlalpan se distinguen solo por el reemplazo del nombre, ninguna de las dos merece existir.*

## 7. E-E-A-T y Helpful Content: la confianza por encima de todo

E-E-A-T —Experiencia, Pericia, Autoridad y Confianza— no es un factor de ranking que puedas "activar"; es la rúbrica que los evaluadores de calidad de Google usan para aproximar si una página merece confianza, y de las cuatro letras, **la Confianza pesa más**. Para servicios locales que tocan dinero, seguridad o salud (un electricista, un cerrajero, una clínica), Google aplica criterio extra porque son temas donde una mala recomendación hace daño real.

La forma de operacionalizarlo no es esotérica: demuestra **Experiencia de primera mano** (trabajos reales hechos en la zona, no descripciones genéricas del servicio), pon **autoría** donde aplique (quién responde, con qué credenciales), y sé específico hasta el punto de que el texto no se pudiera copiar a la web de tu competencia. El sistema de Helpful Content que evalúa esto ya no es un "update" periódico: vive en el núcleo y se aplica en cada rastreo. La prueba honesta que Google sugiere cabe en una pregunta: *¿escribirías esto si los buscadores no existieran?* Si la respuesta sincera es "no, esto está aquí para rankear", el texto nació del lado equivocado, y ninguna densidad de keyword lo arregla.

## 8. Enlazado interno: el contrato que las rutas muertas rompen

El enlazado interno es cómo Google descubre y reparte autoridad entre tus páginas, y tiene tres reglas simples que el repo cumple a medias. Una: los enlaces deben ser `<a href>` rastreables, no `<span>` con `onclick` —aquí se cumplen—. Dos: cada página importante necesita al menos un enlace interno desde otra —de ahí que las subcategorías de `CategoryCard` sean enlaces con anchor text real—. Tres: el anchor text debe describir el destino, ni "clic aquí" ni una keyword apilada.

Donde el contrato se rompe es en un defecto que la auditoría destapó y que es SEO además de UX: **la navegación enlaza a `/servicios`, `/blog`, `/contacto` y `/cobertura`, que aún no existen.** Para el usuario es un 404; para el SEO es enlazado interno que apunta al vacío. Hay un mitigante real —el `sitemap` solo lista las páginas que existen, así que Google no recibe esos enlaces muertos como URLs a indexar—, pero el daño de credibilidad y de flujo de autoridad sigue. La regla, que comparte con la guía de arquitectura: **un enlace en la nav es un contrato; la página existe o el enlace no.**

## 9. SEO local de verdad: NAP, nombre y ficha de Google

El SEO local tiene reglas propias que un sitio bonito no sustituye. La primera es la **consistencia de NAP** (Name, Address, Phone): el nombre, dirección y teléfono del sitio deben coincidir, carácter por carácter, con los de tu Ficha de Google y con cualquier directorio donde aparezcas. Inconsistencias de NAP confunden a Google sobre qué negocio es cuál.

La segunda es contraintuitiva y cuesta suspensiones: **el nombre del negocio no debe llevar keywords ni ciudad.** "Plomería Rápida CDMX 24h" como nombre en tu ficha es motivo de suspensión; el nombre va como el negocio se llama en el mundo real, y las keywords viven en el contenido, no en el rótulo. La tercera: para un negocio que atiende a domicilio (service-area business) se usa **una sola ficha con la dirección oculta**, no una ficha por colonia. Y la cuarta: las **categorías más específicas y menos numerosas** ganan a un puñado de categorías genéricas. El teléfono local (con lada de la zona) refuerza la señal sobre un 800 nacional.

Nada de esto vive en el repo —es trabajo de la Ficha de Google— pero todo debe **espejar** lo que el `LocalBusiness` del JSON-LD declara. Por eso el siguiente punto importa tanto.

## 10. Los bugs SEO reales de este repo

Ser auditor de uno mismo exige nombrar los defectos propios. Estos son los reales, en orden de impacto/esfuerzo:

**La imagen Open Graph es un SVG.** Ni WhatsApp, ni Facebook, ni LinkedIn renderizan OG en SVG. En un sitio cuya conversión depende de que la gente comparta el enlace por WhatsApp, cada compartido sale **sin imagen**: un rectángulo de texto en vez de una tarjeta. La corrección es un `og.jpg` raster de 1200×630. Tres minutos de trabajo, impacto en el CTR de todo lo que se comparta. Es, sin discusión, el arreglo SEO de mejor relación valor/esfuerzo del proyecto.

**El `LocalBusiness` se emite con NAP demo.** En la plantilla, el JSON-LD publica datos estructurados de un negocio que no existe (teléfono `0000…`, dirección "Demo"). Para un template, lo correcto es `business: undefined` —no emitir `LocalBusiness` hasta que haya datos reales— y que el cliente lo llene al configurar su sitio. Publicar schema de un negocio ficticio es, en el mejor caso, ruido; en el peor, una incoherencia entre el schema y el contenido que las políticas penalizan.

**Faltan favicons y el `theme-color` usaba una variable CSS** (ya corregido a hex). Los `<link>` a `favicon.ico` y `apple-touch-icon.png` apuntan a archivos que no existen → 404 en cada página. Cosmético para el ranking, pero parte de la señal de "sitio terminado".

## 11. Casos de uso

- **Una página de servicio que quiere rankear local.** Tripleta de keywords con intención transaccional, `LocalBusiness` con subtipo específico, contenido de primera mano sobre cómo se hace el trabajo en esa zona, y enlaces internos a servicios relacionados con anchor descriptivo.
- **Un directorio de zonas.** Una página por zona con especificidad genuina (colonias reales, tiempos reales), no plantilla con el nombre cambiado. Es la diferencia entre rankear y recibir una acción manual por scaled content.
- **Un catálogo de productos.** `Product` schema solo en las fichas individuales, nunca en las landings de categoría; landings de categoría que agregan autoridad en una sola URL gracias al enum cerrado.
- **Compartir por WhatsApp como canal principal.** Aquí el OG raster no es cosmético: es el activo que decide si el enlace compartido se ve como una tarjeta o como texto pelón.

## 12. Buenas prácticas

- Elige keywords por **intención**, no por volumen; una `kw1`, al frente, por página.
- Escribe títulos y descriptions para una persona que ojea resultados; la keyword cae natural, no apilada.
- Centraliza el JSON-LD en una librería y emite cada pieza estructural (`BreadcrumbList`, canonical) **una sola vez**.
- Usa el subtipo específico de `LocalBusiness`, `geo` con ≥5 decimales, un bloque por ubicación.
- **Nunca** inventes `aggregateRating` ni marques reseñas propias.
- Para escalar a muchas zonas, escala **especificidad real**, no plantilla.
- Mantén NAP consistente y sin keywords en el nombre del negocio.
- Cada página importante con al menos un enlace interno rastreable y anchor descriptivo.

## 13. Errores comunes y su porqué

| Error | Por qué duele | Antídoto |
|---|---|---|
| Forzar la keyword al frente con dos puntos | Cadencia robótica de stuffing | Escribir natural; avisar con `metaAudit`, no forzar |
| Apilar la keyword en el `<title>` con barras | Google lo reescribe; señal de spam | Único, descriptivo, kw1 primero, marca al final |
| `Product` en páginas de categoría | Política: una categoría no es un producto específico | `Product` solo en fichas únicas |
| Esperar rich result de FAQ | Retirado en mayo 2026 | Mantener FAQ por el usuario; no invertir en su schema |
| Marcar reseñas propias / inventar rating | Inelegible + riesgo de acción manual | No marcarlas; mostrarlas vía Ficha de Google |
| Páginas "[servicio] en [ciudad]" clonadas | Scaled content abuse (penalización core) | Especificidad real por zona |
| Keywords/ciudad en el nombre del negocio | Suspensión de la Ficha de Google | Nombre real; keywords en el contenido |
| OG en SVG | Cada compartido sin preview | Raster 1200×630 |
| `LocalBusiness` con NAP demo | Schema de un negocio inexistente | `business: undefined` en el template |

## 14. Procedimiento: optimizar una ficha de servicio

1. **Define la tripleta** (`kw1` transaccional, `kw2` secundaria, `kw3` variante) en el frontmatter / `keywords` de la página.
2. **Redacta el `<title>`** empezando por la `kw1`, descriptivo, marca al final con separador; deja que `buildKeywordTitle` aplique el tope.
3. **Escribe la description** para una persona (120–160), que abra de forma natural con la `kw1`; revisa que `metaAudit.opensWithK1` no marque aviso —sin forzar el dos puntos—.
4. **Llena el contenido con experiencia real**: cómo se hace el trabajo, en qué zona, con qué materiales/tiempos verificables. Nada que se pudiera copiar a la web del competidor.
5. **Configura el `LocalBusiness`** con subtipo específico y `geo` real (≥5 decimales); un bloque por ubicación.
6. **Enlaza internamente** a servicios/zonas relacionados con anchor descriptivo (y verifica que esas páginas existan).
7. **Verifica el JSON-LD** en el Rich Results Test y revisa que coincida con el contenido visible.
8. **Confirma el OG raster** y que el `<title>`/description no excedan ni se trunquen mal.

## 15. Checklist SEO

- [ ] Cada página declara una tripleta de keywords con `kw1` transaccional al frente.
- [ ] Títulos únicos, descriptivos, kw1 primero, marca al final, sin apilar.
- [ ] Descriptions 120–160 escritas para personas; sin el prefijo robótico `«Kw1:»`.
- [ ] JSON-LD `@graph` centralizado; `BreadcrumbList` emitido una sola vez.
- [ ] `LocalBusiness` con subtipo específico, `geo` ≥5 decimales, uno por ubicación.
- [ ] Cero `aggregateRating` inventado; cero marcado de reseñas propias.
- [ ] Sin schema `FAQPage`/`HowTo` esperando rich result (retirados/deprecados).
- [ ] Páginas de zona con especificidad real; cero plantilla "[servicio] en [ciudad]".
- [ ] NAP consistente; nombre de negocio sin keywords/ciudad.
- [ ] Enlaces internos rastreables, con anchor descriptivo, a páginas que existen.
- [ ] Imagen OG raster 1200×630; favicons presentes.
- [ ] `LocalBusiness` no se emite con datos demo en producción.

## 16. KPIs e indicadores de calidad

| Indicador | Meta | Por qué |
|---|---|---|
| `<title>` únicos ≤ 60 visibles | 100 % | Heredado del motor de metas; el desvío es bug |
| Descriptions 120–160, naturales | 100 % | Sin stuffing; `metaAudit` lo vigila |
| Avisos de `metaAudit` por página | 0 | Detector propio de sobreoptimización |
| JSON-LD válido (Rich Results Test) | 100 % | Schema que no valida, no sirve |
| `aggregateRating`/reseñas propias marcadas | 0 | Política; protege de acción manual |
| Páginas de zona con contenido único (no plantilla) | 100 % | Defensa contra scaled content abuse |
| Enlaces internos rotos / 404 de nav | 0 | Flujo de autoridad y credibilidad |
| Compartidos con preview OG correcto | 100 % | El OG raster decide el CTR social |
| Consistencia NAP (sitio ↔ Ficha de Google) | Exacta | Señal local fundamental |
| CTR orgánico por página clave | Tendencia al alza | Títulos/descriptions que de verdad invitan al clic |

## 17. Conclusiones

El SEO de este sistema parte de una base poco común: un motor de metas auditable, un JSON-LD centralizado y honesto, y la negativa a inventar reseñas. Eso ya lo pone por encima de la mayoría de los sitios de servicios. Pero el SEO de 2026 no premia la disciplina técnica en abstracto —premia decir la verdad y agregar valor real—, y ahí el sistema tiene dos frentes: corregir lo cosmético-pero-visible (OG raster, NAP demo, el prefijo robótico ya eliminado) y, sobre todo, **resistir la tentación de su propia eficiencia**. La SSoT hace trivial generar páginas; usar esa facilidad para clonar zonas con plantilla es la forma más rápida de que una fábrica de sitios se gane una penalización por scaled content que las hunde a todas.

La metodología, entonces, es menos sobre trucos y más sobre carácter: keywords con intención, metas escritas para personas, schema solo donde es verdad, y contenido local con experiencia de primera mano que no se podría copiar a otro sitio. Lo que cambió en 2026 —FAQ sin rich result, scaled content en el core, Astro bajo Cloudflare— refuerza la misma dirección: el atajo SEO está cerrado; queda el camino largo, que también es el único que aguanta.

## 18. Recomendaciones finales

1. **Genera el OG raster 1200×630 y los favicons.** Es el arreglo de mejor relación valor/esfuerzo del proyecto; impacta cada enlace compartido.
2. **Pon `business: undefined` en el template** y emite `LocalBusiness` solo con datos reales del cliente.
3. **Trata `scaled content abuse` como el riesgo nº 1 de la fábrica**: prohíbe las páginas de zona clonadas; exige especificidad real y verificable por zona.
4. **Reclasifica el "falta schema FAQ"**: no inviertas en él (rich result retirado); conserva el FAQ por el usuario.
5. **Cierra los enlaces internos**: construye las rutas que la nav promete, para que el enlazado interno apunte a páginas reales y no al vacío.
6. **Mantén `metaAudit` como puerta**: si marca avisos de sobreoptimización, reescribe antes de publicar; es tu auditor que no se cansa.

> Documento vivo. Las reglas de Google cambian; cuando una de aquí caduque, edita la guía, no la realidad. Relacionado: `01` (arquitectura) · `03` (contenido humano) · `04` (homologación) · `05` (fábrica).
