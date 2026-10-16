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
