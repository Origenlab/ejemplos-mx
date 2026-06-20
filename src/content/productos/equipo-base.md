---
title: "Equipo base de ejemplo para catálogo"
description: "Ficha de producto DEMO que muestra cómo se ve un equipo en el catálogo: título, descripción, categoría, imagen y precio editorial. Reemplaza este contenido por un producto real."
category: "equipos"
image: "/images/productos/desarrollo-web-astro-profesional.avif"
price: "Desde $0 (DEMO)"
sku: "DEMO-EQ-001"
brand: "EJEMPLOS"
featured: true
order: 1
seoTitle: "Equipo base de ejemplo | EJEMPLOS"
seoDescription: "Producto DEMO de la plantilla: ejemplo de ficha de equipo con categoría, imagen y precio editorial para el catálogo."
keywords: ["plantilla", "producto demo", "catálogo astro"]
---

## Sobre este producto de ejemplo

Esta es una ficha de producto **DEMO** de la plantilla. Sirve para que
veas qué campos viven en el frontmatter y cómo se valida contra el esquema Zod en
`src/content.config.ts`.

- El campo `category` solo acepta valores del enum `PRODUCT_CATEGORIES`.
- El campo `image` debe ser una ruta absoluta bajo `/images/`.
- El cuerpo Markdown se renderiza en la página de detalle del producto (parte futura).

> Reemplaza este texto por la descripción real del producto del cliente.
