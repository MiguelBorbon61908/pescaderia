# Pescadería Álvarez

Landing oficial + panel de administración de ofertas.

## Stack
- **Vite + React** (frontend)
- **Supabase** (base de datos, auth y almacenamiento de imágenes)
- Datos aislados en el proyecto Supabase `viaja-mas-landing` con prefijo `pesc_`

## Correr en local
```bash
npm install
npm run dev
```
- Landing: http://localhost:5173/
- Panel admin: http://localhost:5173/admin

## Acceso admin
Las credenciales del panel `/admin` se entregan de forma privada al administrador.
No se guardan en este repositorio.

## ¿Qué controla el administrador? (CMS completo)
Entra a `/admin`, inicia sesión y usa las pestañas:
1. **Promociones** — cards de ofertas (título, precios, imagen, activa/oculta, orden).
2. **Categorías** — tarjetas de "Del mar a tu mesa" (título, descripción, imagen).
3. **Galería** — imágenes (subir, orden, marcar destacada = recuadro grande).
4. **Sucursales** — nombre, badge, dirección, horario, teléfono, WhatsApp.
5. **Textos del sitio** — hero (con imagen de fondo), ticker de precios, encabezados,
   bloque Boneless (con precios), Nosotros (textos + stats + imagen), CTA, WhatsApp global, footer.

Todas las imágenes se pueden **subir** (se guardan en Supabase Storage). Los cambios aparecen
en la landing **en vivo** (Supabase Realtime) — sin recargar la página.

**Vista previa contextual:** el botón "👁 Vista previa" abre la landing embebida en el panel.
Al cambiar de pestaña o enfocar una sección en "Textos del sitio", la vista previa se
**desplaza y resalta** esa sección con una etiqueta (comunicación admin↔iframe vía postMessage).

## Base de datos (Supabase)
- `public.pesc_ofertas` — promociones
- `public.pesc_config` — textos/imágenes generales (JSONB, 1 fila)
- `public.pesc_categorias` — tarjetas "Del mar a tu mesa"
- `public.pesc_galeria` — imágenes de galería
- `public.pesc_sucursales` — sucursales
- `public.pesc_admins` — quién puede editar
- Imágenes subidas: bucket `pesc-ofertas`
- **RLS:** el público lee; solo los admins escriben.

## Deploy (estático)
`npm run build` genera `dist/`. Súbelo a Vercel o Netlify.
- Variables de entorno en el hosting: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` (ver `.env`).
- Configura fallback SPA (todas las rutas → `index.html`) para que `/admin` funcione en producción.

## Origen
Reconstruido desde el bundle original de diseño (conservado localmente, fuera del repo).
Las 8 imágenes se extrajeron a `public/img/`.
