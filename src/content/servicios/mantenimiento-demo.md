---
title: "Servicio de mantenimiento de ejemplo"
description: "Segundo servicio DEMO, categoría mantenimiento, para demostrar cómo el catálogo de servicios lista varias entradas y cómo se filtran los borradores con draft."
category: "mantenimiento"
image: "/images/servicios/mantenimiento-demo.svg"
includes:
  - "Revisión periódica de ejemplo"
  - "Reporte de estado"
featured: false
order: 2
---

## Mantenimiento de ejemplo

Cada servicio nuevo es un `.md` en `src/content/servicios/`. El listado del
catálogo se genera con `getCollection('servicios')` y filtra los que tengan
`draft: true`.
