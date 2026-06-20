---
titulo: "El presupuesto de JavaScript: islas e hidratación en Astro sin autoengaños"
descripcion: "Por qué un Lighthouse en verde puede mentir, cómo funcionan de verdad las directivas client:* y un método para decidir qué se hidrata sin llenar la página de JavaScript que nadie pidió."
serie: "Buenas prácticas en Astro"
articulo: 1
nivel: "De fundamentos a avanzado"
actualizado: "2026-06-20"
version_astro: "6.x"
tiempo_lectura: "13 min"
---

# El presupuesto de JavaScript: islas e hidratación en Astro sin autoengaños

> **De la serie "Buenas prácticas en Astro" — Artículo 1 de 5**
> Nivel: de fundamentos a avanzado · Astro 6.x · Actualizado el 20 de junio de 2026

La primera vez que un cliente me dijo "la página se siente lenta al darle clic", yo tenía el Lighthouse en verde. Verde de los bonitos, 98 de rendimiento. Y tenía razón él, no el número.

El problema no estaba en la métrica de laboratorio, sino en su teléfono de gama media a media tarde, con el navegador masticando seis componentes de React que yo había marcado con `client:load` por pura pereza mental: "que cargue todo y así no me preocupo". Cada uno de esos seis quería el hilo principal al mismo tiempo, justo cuando el usuario intentaba tocar un botón. El resultado era una página que *parecía* rápida en mi MacBook y *se sentía* pegajosa en el mundo real.

Esa brecha —entre lo que mides en tu escritorio y lo que sufre el usuario en su bolsillo— es el tema de fondo de todo Astro. Y la arquitectura de islas es la respuesta del framework. Pero la respuesta no sirve de nada si la usas como yo la usaba aquel día: encendiéndolo todo "por si acaso".

---

## La inversión que casi nadie aprovecha

Astro hace algo que suena trivial y resulta no serlo: **invierte quién tiene que justificarse.**

En la mayoría de frameworks, el JavaScript llega por defecto y tu trabajo es *quitarlo* —diferir, dividir, perseguir bundles con un analizador. En Astro es al revés. La página nace como HTML estático, sin un solo byte de JS, y cada gramo de interactividad que añades es una decisión que tú firmas explícitamente con una directiva.

Esto cambia tu trabajo de fondo. Dejas de *optimizar* JavaScript y empiezas a *no pedirlo*. Es una diferencia de actitud más que de técnica, y es la que más cuesta interiorizar a quien viene de Next o de Nuxt, porque el reflejo aprendido es "todo es un componente de React". En Astro ese reflejo te traiciona.

La consecuencia práctica la resumo en una frase que repito hasta cansar:

> **El JavaScript en Astro no se hereda, se solicita.** Si algo termina pesando en el navegador del usuario, fue porque tú escribiste la directiva que lo pidió. Nadie más tiene la culpa.

### El componente `.astro` es tu material por defecto

Antes de hablar de directivas, hay un detalle que reordena todo lo demás: **los componentes `.astro` no se hidratan jamás.** Se ejecutan en el build (o en el servidor), escupen HTML y se desvanecen. No tienen estado en el cliente, no escuchan eventos, no pesan nada.

Eso significa que la pregunta correcta al crear un componente no es "¿en qué framework lo hago?", sino "¿de verdad necesita vivir en el navegador?". La mayoría de las veces —una tarjeta, una sección, un listado, un header— la respuesta es no. Y si es no, `.astro` y a otra cosa.

Veo gente escribiendo en React el footer de su sitio. El footer. Un bloque que no hace absolutamente nada salvo existir. Es como contratar a un electricista para colgar un cuadro: funciona, pero estás pagando corriente para sostener un clavo.

---

## Las directivas `client:*`, con sus letras pequeñas

Cuando un componente *sí* necesita estado o eventos en el cliente, le pones una directiva `client:*`. Cada una responde a una sola pregunta: **¿en qué momento bajamos y encendemos este JavaScript?**

Esta es la tabla que tengo mentalmente pegada al monitor, con la letra pequeña que la documentación menciona de pasada:

| Directiva | Cuándo baja el JS | El detalle que importa | Para qué la quiero |
|---|---|---|---|
| `client:load` | De inmediato, peleando por el hilo principal con el render inicial | Es la más cara que existe. Tres o cuatro en una misma vista y tu INP se desploma en móvil | Lo verdaderamente crítico y visible al instante: el carrito de una tienda, el buscador principal |
| `client:idle` | Cuando el navegador queda inactivo (`requestIdleCallback`) | Admite `timeout`: en una página siempre ocupada, el "idle" puede no llegar nunca, así que pones un tope | Interactividad importante pero no urgente: un selector de tema, un widget de chat |
| `client:visible` | Cuando el elemento entra en pantalla (`IntersectionObserver`) | Admite `rootMargin`: empiezas a hidratar *antes* de que se vea, para que llegue caliente | Casi todo lo que vive bajo el pliegue: carruseles, mapas, comentarios |
| `client:media` | Cuando se cumple una media query | Evita hidratar en desktop algo que solo existe en móvil, y al revés | Un menú hamburguesa que solo tiene sentido por debajo de 768px |
| `client:only` | Solo en el cliente, **sin** HTML de servidor | Pierdes el render inicial: hay un hueco hasta que hidrata. Es deuda visual a cambio de compatibilidad | Componentes que tocan `window` o usan librerías que se ahogan en SSR |

Las dos letras pequeñas que más rendimiento esconden:

```astro
---
import Buscador from '@components/Buscador.jsx';
import Chat from '@components/Chat.jsx';
import Carrusel from '@components/Carrusel.jsx';
---

<!-- Crítico y arriba: se gana el client:load -->
<Buscador client:load />

<!-- Importante, no urgente. El timeout evita que se quede esperando para siempre -->
<Chat client:idle={{ timeout: 2000 }} />

<!-- Al fondo. El rootMargin lo precalienta 200px antes de que el usuario llegue -->
<Carrusel client:visible={{ rootMargin: "200px" }} />
```

Ese `rootMargin` es la diferencia entre un carrusel que aparece ya funcionando cuando lo alcanzas y uno que se queda congelado el primer medio segundo mientras hidrata frente a tus ojos. Es gratis y casi nadie lo usa.

---

## Un presupuesto, no una checklist

Las listas de "buenas prácticas" me aburren un poco porque se leen y se olvidan. Lo que de verdad me cambió la forma de trabajar fue dejar de tratar las islas como decisiones sueltas y empezar a tratarlas como un **presupuesto de hidratación por página**.

Funciona así: antes de construir una vista, decido cuánto JavaScript estoy dispuesto a gastar en ella. Una landing de marketing: idealmente cero, una isla como mucho. Una ficha de producto: dos o tres, contadas. Un panel de usuario: ahí sí, es una aplicación y lo asumo. El número exacto importa menos que el gesto de *ponerle un techo antes de empezar*. Sin techo, cada componente parece justificable por sí solo y terminas con quince islas que individualmente tenían sentido y en conjunto matan el INP.

Cuando dudo qué directiva darle a algo, no consulto una tabla: recorro cinco preguntas en orden y me detengo en la primera que aplica.

1. **¿Necesita interactividad de cliente?** Si no → `.astro`. No hay isla, no hay debate.
2. **¿Es interactivo al instante y está arriba del todo?** → `client:load`, pero pregúntate de verdad si *tiene* que ser instantáneo o si es tu ansiedad hablando.
3. **¿Está bajo el pliegue?** → `client:visible`. Esta debería ser tu opción por defecto, no `client:load`.
4. **¿Solo importa en ciertas pantallas?** → `client:media`.
5. **¿Depende de APIs del navegador y muere en SSR?** → `client:only`, asumiendo el hueco visual.

Si te quedas con una sola idea de esta sección: **cuando dudes entre `load` y `visible`, elige `visible`.** El instinto de "que cargue ya, así no falla" es exactamente el que llenó mi home de seis islas aquel día.

---

## Dónde se esconde el JavaScript que no pediste

Si abres `astro build` y el peso de JS de una página te sorprende, casi siempre el culpable es uno de estos tres patrones. Los pongo en orden de frecuencia con la que me los encuentro auditando proyectos ajenos:

**El layout convertido en isla gigante.** Alguien envuelve toda la página en un componente de React con `client:load` para "tener estado global", y sin darse cuenta convierte un sitio Astro en un SPA con pasos de más.

```astro
<!-- ❌ Toda la página es una sola isla. Tiraste el render estático a la basura -->
<AppReact client:load>
  <Header /> <Contenido /> <Footer />
</AppReact>
```

La cura es invertir la relación: el layout es `.astro`, y las islas son hojas pequeñas dentro de él. El estado compartido casi nunca necesita un árbol de React entero; necesita, como mucho, un par de islas que se comuniquen por eventos o por una store mínima.

**El bucle que pare islas.** Doscientos productos mapeados, cada uno una isla:

```astro
<!-- ❌ 200 productos = 200 islas orquestándose -->
{productos.map(p => <Tarjeta client:visible producto={p} />)}
```

Cada isla tiene un coste fijo de coordinación, y doscientas veces ese coste es real. Si la tarjeta solo necesita un botón de "añadir al carrito", renderiza la tarjeta entera como `.astro` y deja que un único *listener* delegado en un script ligero atienda los clics de todas. Una isla, doscientos botones.

**El `client:load` por defecto.** El más caro y el más humano: lo ponemos por costumbre, no por necesidad. `client:load` compite de tú a tú con el render inicial por el hilo principal. Es la directiva que hay que *ganarse*, no regalar.

---

## El primo que casi nadie conoce: islas de servidor

A veces el problema no es el JavaScript del cliente. Es que **una esquina de la página es dinámica y el resto no.**

El caso que me convenció: una ficha de producto perfectamente estática —cacheable en CDN, rapidísima— salvo por el bloque "recomendado para ti", que depende de quién mira. Durante años, ese bloquecito te obligaba a renderizar la página entera bajo demanda, perdiendo el cacheo de todo lo demás por culpa del 5% que cambia.

Las islas de servidor (`server:defer`, estables desde Astro 5) parten el problema:

```astro
---
import Recomendados from '@components/Recomendados.astro';
---
<ProductoEstatico />

<Recomendados server:defer>
  <p slot="fallback">Buscando recomendaciones…</p>
</Recomendados>
```

Astro sirve la página estática al instante con el `fallback` en su sitio, y en paralelo renderiza solo `Recomendados` en el servidor, insertándolo cuando llega. El 95% cacheable nunca paga el coste del dinámico.

Lo importante es no confundirla con su prima de cliente, porque resuelven cosas distintas:

| | Isla de cliente (`client:*`) | Isla de servidor (`server:defer`) |
|---|---|---|
| Dónde corre | En el teléfono del usuario | En tu servidor, bajo demanda |
| ¿Envía JS al cliente? | Sí | No, por sí misma |
| Para qué sirve | Interactividad: eventos, estado | Contenido dinámico sin sacrificar el cacheo del resto |
| Mientras carga, se ve… | Lo que renderizó el SSR | El `slot="fallback"` |

No son alternativas. Una página real bien resuelta puede tener las dos. Las islas de servidor las desarrollamos a fondo en el [Artículo 3](./03-estrategias-de-render-ssg-ssr-server-islands.md).

---

## Cuándo Astro no es la herramienta (sí, pasa)

Un artículo honesto tiene que decir esto: si lo que construyes es una aplicación intensamente interactiva —un editor colaborativo, un dashboard donde *todo* es estado en vivo, una herramienta tipo Figma— la arquitectura de islas trabaja en tu contra. Acabarías con `client:only` por todas partes, reinventando un SPA dentro de un framework que está diseñado para lo opuesto.

Astro brilla cuando la mayor parte de tu página es contenido y la interactividad son islas dentro de un mar de HTML: marketing, blogs, documentación, e-commerce, catálogos, portafolios. Si tu sitio es 90% contenido y 10% interacción, no hay nada mejor. Si es al revés, quizá quieras otra herramienta —o al menos entrar con los ojos abiertos. Saber dónde *no* encaja una herramienta es parte de dominarla.

---

## Para cerrar

Vuelvo al cliente del principio. La solución a su queja no fue optimizar nada: fue *borrar*. Cambié cuatro `client:load` por `client:visible`, convertí dos componentes de React en `.astro` porque solo pintaban texto, y el INP en su teléfono cayó por debajo de los 200 ms. No escribí código nuevo. Escribí menos.

Esa es, al final, la disciplina de las islas. No es una técnica que se aprende una vez, es un hábito que se ejercita en cada componente: tratar cada `client:*` como una factura que alguien, en algún teléfono modesto, va a pagar con su batería y su paciencia. Cuando interiorizas eso, dejas de preguntarte "¿puedo hacer esto interactivo?" y empiezas a preguntarte "¿vale la pena?". Casi siempre, la respuesta honesta es enviar menos.

En el [siguiente artículo](./02-content-collections-y-content-layer.md) bajamos del comportamiento al contenido: cómo darle a tus datos un contrato que el build haga cumplir, con Content Collections y la Content Layer API.

---

### Fuentes

- [Islands architecture — Astro Docs](https://docs.astro.build/en/concepts/islands/)
- [Front-end frameworks (client directives) — Astro Docs](https://docs.astro.build/en/guides/framework-components/)
- [Server islands — Astro Docs](https://docs.astro.build/en/guides/server-islands/)
- [Astro 6.0 — Blog oficial](https://astro.build/blog/astro-6/)
