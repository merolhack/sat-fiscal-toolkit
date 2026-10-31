# 05 — Changelog & Insights Técnicos (`sat-fiscal-toolkit`)

Registro cronológico de decisiones arquitectónicas, aprendizajes técnicos y resoluciones de integración.

---

## 📅 Historial de Decisiones y Eventos

### [2026-10-15] — Reestructuración Modular de la LLM Wiki y Protocolo de Agentes
- **Ubicación de Memoria:**
  - Se estableció de forma definitiva y obligatoria el directorio `wiki/` como el contenedor de la memoria viva y documentación del repositorio (sustituyendo cualquier uso de `.memory/`).
  - Se modularizó en 7 documentos temáticos independientes para evitar sobrecarga de contexto en LLMs.
- **Reglas Obligatorias en `AGENTS.md`:**
  - Obligatoriedad de probar/usar `ollama-local` y emitir advertencia explícita si el servicio no está disponible.
  - Obligatoriedad de consultar el grafo de dependencias con `codebase-memory`.
  - Obligatoriedad de respetar el ciclo de 3 fases (Lectura previa de `wiki/`, Ejecución, Escritura a `wiki/`).
- **Validación de Servidores MCP:**
  - `ollama-local` (`consultar_modelo_local`): Validado y operativo.
  - `codebase-memory` (`index_repository`): Repositorio `sat-fiscal-toolkit` indexado con éxito (46 nodos, 45 aristas).
- **Consolidación de `.gitignore`:**
  - Se integró la protección estricta contra subida de comprobantes fiscales (`*.xml`, `*.pdf`, `*.zip`), llaves privadas (`*.key`, `*.cer`, `*.pfx`), tokens y credenciales de entorno.
- **Estructura Mensual de Datos:**
  - Se definió el esquema de almacenamiento `data/2026/MM-mes/` separando `recibidas/` y `emitidas/` con subcarpetas para `resumen/`, `zips/` y `xml/`.

### [2026-10-15] — Migración Integral a Inglés (Directorios, Scripts y Reportes) y Cálculo Integral (Issued & Received)
- **Nomenclatura en Inglés:**
  - Se actualizaron las rutas de datos a `data/{year}/{month}/issued/` (summary, zips, xml) y `data/{year}/{month}/received/` (summary, zips, xml).
  - Se refactorizaron los módulos de `src/` a inglés: `extractor.py`, `pdf_parser.py`, `cfdi_parser.py`, `tax_calculator.py`, `report_generator.py`.
  - Script CLI unificado: `scripts/process_month.py --year 2026 --month 09`.
- **Procesamiento Dual de Ingresos y Gastos (Septiembre 2026):**
  - **Issued (1 CFDI):** 1 factura emitida PUE (`$3,017.24` MXN subtotal, `$482.76` MXN IVA 16%, `$3,500.00` MXN total).
  - **Received (70 CFDIs):** 55 facturas recibidas PUE (`$12,686.58` MXN subtotal, `$1,342.04` MXN IVA 16% acreditable).
- **Corrección Crítica de Extracción Fiscal:**
  - Se corrigió la lectura de impuestos en `cfdi_parser.py` para acotarla al nodo raíz `cfdi:Impuestos`, evitando la duplicidad sistemática entre los traslados a nivel concepto y los traslados del resumen general.
- **Determinación Fiscal Neta:**
  - **ISR:** Base gravable $0.00 MXN (Pérdida fiscal de $9,669.34 MXN).
  - **IVA Definitivo:** Saldo a Favor generado de **$859.28 MXN** ($1,342.04 acreditable - $482.76 causado).
  - Reportes exportados en `data/outputs/2026/09/monthly_tax_declaration_2026_09.md` y `declaracion_mensual_2026_09.md`.

### [2026-10-15] — Correcciones Contables: ISR Acumulativo Art. 106, Depuración de Gastos y Desglose por Proveedor
- **Acumulación de ISR (LISR Art. 106 a 9 meses):**
  - Se integró la acumulación histórica (Ene-Ago): Ingresos anteriores ($110,361.00) + Ingresos del mes ($3,017.24) = $113,378.24.
  - Deducciones anteriores ($88,173.00) + Deducciones del mes ($6,607.74) = $94,780.74.
  - Base gravable acumulada a 9 meses: $18,597.50.
  - Aplicación de tarifa Art. 106: Impuesto determinado de $889.40.
  - Acreditamientos acumulados: Retenciones de ISR ($8,623.00) + Pagos provisionales ($592.00) = $9,215.00.
  - ISR Provisional a pagar: **$0.00 MXN**.
- **Depuración Automática de Gastos No Deducibles:**
  - Se implementó `evaluate_expense_deductibility` filtrando RFCs (Walmart, OXXO, ADMX) y ClaveProdServ (`50`, `901015`, `5310`, `5311`, `4922`).
  - 31 facturas ($6,078.84 MXN subtotal) segregadas a gastos personales y excluidas del IVA acreditable.
  - 24 facturas ($6,607.74 MXN subtotal, $938.35 MXN IVA acreditable) confirmadas como deducciones autorizadas operativas.
- **Corrección de Agregación de Proveedores:**
  - Se identificó que `WUN9211063C2` (VML México) correspondía a recibos de Nómina (`TipoDeComprobante = 'N'`), por lo que se separaron en su propia sección informativa.
  - La tabla de proveedores ahora suma exclusivamente facturas PUE autorizadas con cuadratura exacta de Subtotal, IVA y Total.
- **Rastreo de Saldos a Favor de IVA:**
  - Saldo acumulado anterior (Ene-Ago): $5,326.00 MXN.
  - Saldo a favor generado en Septiembre: $455.59 MXN.
  - Saldo a favor total acumulado disponible: **$5,781.59 MXN** (o $6,185.28 MXN incluyendo reservas generales).
- **Nuevo Script CLI:** `scripts/procesar_cfdi_mes.py`.

### [2026-10-15] — Presentación Oficial SAT (Septiembre 2026) e Ingesta Modular en LLM Wiki
- **Declaración Mensual Presentada con Éxito:**
  - Se completó la declaración normal de Septiembre 2026 ante el portal del SAT con base en los papeles de trabajo generados.
  - **Número de Operación:** `262440271315` (Fecha y hora: `15/10/2026 22:06`).
  - **ISR Personas Físicas:** A cargo $0 MXN, Cantidad a pagar **$0.00 MXN**.
  - **IVA Personas Físicas:** Saldo a favor definitivo del mes: **$574.00 MXN**, Cantidad a pagar **$0.00 MXN**.
  - **Acuse Oficial Descargado:** `data/outputs/2026/09/Acuse.MEZL860614DB0.38.2026.pdf`.
- **Nuevos Módulos Integrados al LLM Wiki:**
  - `wiki/07_sat_portal_filing_guide.md`: Guía práctica estandarizada paso a paso de captura en pantalla y ventanas emergentes (pop-ups) del SAT para ISR e IVA.
  - `wiki/08_tax_balance_tracker_2026.md`: Bitácora histórica de acumulación y control de saldos de arranque para Octubre 2026.
- **Saldos de Arrastre Establecidos para Octubre 2026:**
  - Ingresos acumulados base: **$113,378.00 MXN**.
  - Deducciones autorizadas acumuladas base: **$94,781.00 MXN**.
  - Retenciones de ISR acumuladas base: **$8,623.00 MXN** (Remanente: $8,365.00 MXN).
  - Pagos provisionales de ISR acumulados base: **$592.00 MXN**.
  - Saldo a Favor de IVA acumulado disponible para acreditar: **$5,900.00 MXN** ($5,326.00 + $574.00).

### [2026-10-31] — Evaluación Arquitectónica: Portabilidad Web a GitHub Pages (Next.js Estático) y Opciones de Backend
- **Contexto:** Evaluación para transformar el toolkit CLI/Python en una interfaz web interactiva alojada en GitHub Pages con Next.js.
- **Reto Clave:** GitHub Pages no admite backend en ejecución (solo archivos estáticos `out/`) y las facturas fiscales (CFDI 4.0) exigen estricta privacidad de datos sensibles (RFC, importes, sellos).
- **Ruta Estratégica Determinada:**
  1. **Arquitectura Recomendada (Client-Side / Local-First):** Frontend Next.js estático (`output: 'export'`) procesando XMLs directamente en el navegador del cliente mediante JS/TS (con `DOMParser`/`JSZip`) o WebAssembly (Pyodide). Garantiza 100% de privacidad (los XMLs nunca viajan por internet) y costo operativo cero permanente sin depender de cold starts.
  2. **Arquitectura Alternativa (Decoupled Backend Gratuito):** API FastAPI en Python montada en Hugging Face Spaces (sin spin-down agresivo) o Render Free Web Service (con mitigación de cold start de 50s) consumida por el frontend en GitHub Pages con CORS habilitado.
  3. **Persistencia Local:** Uso de IndexedDB en el navegador para mantener el historial acumulado de meses anteriores (arrastre de saldos ISR e IVA).

### [2026-10-31] — Implementación de la Aplicación Web Estática Client-Side (`web/`)
- **Implementación Exitosa:**
  - Se estructuró la aplicación en `web/` con Next.js (App Router), TypeScript, Tailwind CSS, JSZip y SheetJS (`xlsx`).
  - **Motor Fiscal en TypeScript:** Se implementaron `web/src/lib/cfdiParser.ts` (parseo en navegador con DOMParser de CFDI 4.0 y Pagos 2.0 evitando duplicidad de impuestos) y `web/src/lib/taxCalculator.ts` (cálculo acumulativo Art. 106 LISR, segregación de gastos personales/deducibles y mecánica de IVA).
  - **Interfaz de Usuario:** Dashboard reactivo en `web/src/app/page.tsx` con soporte de arrastre de archivos ZIP/XML, reclasificación interactiva de deducciones con recálculo en tiempo real, guía paso a paso de captura SAT con copia directa y exportación a Excel y Markdown.
  - **CI/CD:** Se creó el workflow `.github/workflows/deploy-pages.yml` para despliegue automático en GitHub Pages.
  - **Pruebas BDD y Despliegue en Vivo:**
    - Pruebas BDD locales de comportamiento de usuario (`web/src/test/bdd/user_journey.feature.test.tsx`): 6 escenarios aprobados (flujo de efectivo, cálculo Art. 106, reclasificación de gastos, guía de captura SAT y exportación a Excel).
    - Pruebas BDD remotas (`web/src/test/bdd/remote_health.test.ts`): Verificación exitosa de endpoint HTTP 200 en producción.
    - **URL Oficial en Producción:** `https://merolhack.github.io/sat-fiscal-toolkit/`.
  - **Validación:** Compilación estática (`npm run build`) completada con éxito generando el directorio `web/out/`.
  - **Instrucciones SAT Integradas en UI:** Se agregaron desplegables interactivos en las tarjetas de carga con las rutas exactas paso a paso para descargar facturas Emitidas y Recibidas desde el portal del SAT.
  - **Integración de Telemetría (GA4) y Verificación Search Console:**
    - Se integró Google Analytics 4 (`G-8STYZ8GZRJ`) en `web/src/app/layout.tsx` con carga diferida `afterInteractive` y anonimización de IP.
    - Se incorporó la verificación de Google Search Console vía meta-tag y archivo estático `web/public/google7d4ec8c5344a17de.html`.
    - Se añadió pie de página oficial con enlaces a `https://merolhack.github.io/` (El Autor) y `https://freelancemexico.com.mx/` (Proyecto Principal).
    - Suite BDD ampliada a 7 escenarios con cobertura para los enlaces del footer.

### [2026-10-31] — Configuración y Vinculación de Propiedades SEO y Telemetría Multi-Plataforma
- **Consolidación de Propiedades y Verificación:**
  - **Google Search Console (GSC):**
    - Propiedad URL Prefix: `https://merolhack.github.io/sat-fiscal-toolkit/`.
    - Token oficial: `google7d4ec8c5344a17de`.
    - Verificación doble activa: archivo estático `google7d4ec8c5344a17de.html` (HTTP/2 200 en producción) y meta-tag en `<head>`.
  - **Bing Webmaster Tools:**
    - Identificador de usuario / perfil: `tid=39ae6463-c3a9-44a5-a413-752977ed4d3d`.
    - Token de verificación: `856757614FFC2C5582FBCB81B1B4E4CA`.
    - Implementación de `BingSiteAuth.xml` en `web/public/BingSiteAuth.xml` y meta-tag `msvalidate.01` en `layout.tsx`.
  - **Google Analytics 4 (GA4):**
    - Cuenta `a389930119`, propiedad base `p560646502` / ID de medición unificado `G-8STYZ8GZRJ`.
  - **Archivos de Indexación SEO:**
    - Generación de `web/public/robots.txt` permitiendo rastreo e indicando el sitemap.
    - Generación de `web/public/sitemap.xml` para indexación de la URL canónica.
  - **Documentación en LLM Wiki:**
    - Creación del módulo temático independiente `wiki/09_telemetry_and_indexing.md` y actualización del índice general `wiki/00_index.md`.
