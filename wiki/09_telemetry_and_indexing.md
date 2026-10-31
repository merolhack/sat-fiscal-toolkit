# 📊 Telemetría, Indexación y SEO — `wiki/09_telemetry_and_indexing.md`

Este documento detalla la infraestructura de telemetría analítica, validación de propiedad en motores de búsqueda (Google Search Console y Bing Webmaster Tools), rastreo (crawling) y enlaces canónicos para el despliegue en GitHub Pages de **`sat-fiscal-toolkit`**.

---

## 🌐 URLs Canónicas y Despliegue en Producción

- **URL de Producción (GitHub Pages):** `https://merolhack.github.io/sat-fiscal-toolkit/`
- **Dominio Base del Autor:** `https://merolhack.github.io/`
- **Plataforma Principal Ecosistema:** `https://freelancemexico.com.mx/`
- **Repositorio GitHub:** `https://github.com/merolhack/sat-fiscal-toolkit`

---

## 📈 1. Google Analytics 4 (GA4)

- **ID de Medición (Measurement ID):** `G-8STYZ8GZRJ`
- **Cuenta Analítica:** `a389930119`
- **Propiedad Principal del Ecosistema:** `p560646502`
- **Implementación Técnica:**
  - Archivo: `web/src/app/layout.tsx`
  - Estrategia: `next/script` con `strategy="afterInteractive"`
  - Configuración: Anonimización de IP habilitada (`anonymize_ip: true`), recolección de eventos de vista de página automática sobre rutas relativas (`page_path: window.location.pathname`).

```typescript
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-8STYZ8GZRJ"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-8STYZ8GZRJ', {
      anonymize_ip: true,
      page_path: window.location.pathname,
    });
  `}
</Script>
```

---

## 🔍 2. Google Search Console (GSC)

- **Propiedad GSC (URL Prefix):** `https://merolhack.github.io/sat-fiscal-toolkit/`
- **Token de Verificación Oficial:** `google7d4ec8c5344a17de`
- **Métodos de Validación Activos en Producción:**
  1. **Archivo HTML Estático:**
     - Archivo físico: `web/public/google7d4ec8c5344a17de.html`
     - URL pública verificada: `https://merolhack.github.io/sat-fiscal-toolkit/google7d4ec8c5344a17de.html` (HTTP/2 200 OK)
     - Contenido: `google-site-verification: google7d4ec8c5344a17de.html`
  2. **Etiqueta Meta en el Encabezado:**
     - Archivo: `web/src/app/layout.tsx` (sección `verification.google`)
     - Tag HTML generado: `<meta name="google-site-verification" content="google7d4ec8c5344a17de" />`

---

## 🔎 3. Bing WebMaster Tools

- **Identificador de Usuario / Perfil:** `tid=39ae6463-c3a9-44a5-a413-752977ed4d3d`
- **Token de Verificación Bing (`msvalidate.01`):** `856757614FFC2C5582FBCB81B1B4E4CA`
- **Métodos de Validación Implementados:**
  1. **Etiqueta Meta en Encabezado:**
     - En `web/src/app/layout.tsx`: `verification.other['msvalidate.01'] = ['856757614FFC2C5582FBCB81B1B4E4CA']`
     - Tag HTML generado: `<meta name="msvalidate.01" content="856757614FFC2C5582FBCB81B1B4E4CA" />`
  2. **Archivo XML de Autenticación:**
     - Archivo físico: `web/public/BingSiteAuth.xml`
     - URL pública: `https://merolhack.github.io/sat-fiscal-toolkit/BingSiteAuth.xml`
     - Contenido:
       ```xml
       <?xml version="1.0"?>
       <users>
       	<user>856757614FFC2C5582FBCB81B1B4E4CA</user>
       </users>
       ```
  3. **Importación Directa desde Google Search Console:**
     - Al estar verificada la propiedad en GSC bajo la misma cuenta de Google, Bing Webmaster Tools permite la sincronización automática con un solo clic conservando todos los datos de rastreo.

---

## 🤖 4. Robots.txt y Sitemap XML

Para garantizar la correcta indexación de la SPA estática generada por Next.js:

1. **`web/public/robots.txt`**:
   ```txt
   User-agent: *
   Allow: /

   Sitemap: https://merolhack.github.io/sat-fiscal-toolkit/sitemap.xml
   ```

2. **`web/public/sitemap.xml`**:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://merolhack.github.io/sat-fiscal-toolkit/</loc>
       <lastmod>2026-10-31</lastmod>
       <changefreq>weekly</changefreq>
       <priority>1.0</priority>
     </url>
   </urlset>
   ```

---

## 🔗 5. Enlaces Institucionales y Backlinks (Footer)

En el pie de página (`web/src/app/page.tsx`), se implementaron accesos y reconocimiento de autoría hacia los dominios principales del ecosistema:
- **El Autor:** `https://merolhack.github.io/` (Lenin Meza)
- **El Proyecto Principal:** `https://freelancemexico.com.mx/` (FreelanceMexico)
- **Repositorio Oficial:** `https://github.com/merolhack/sat-fiscal-toolkit`
