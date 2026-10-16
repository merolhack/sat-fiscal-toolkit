# 01 — Arquitectura del Sistema (`sat-fiscal-toolkit`)

## 🏛️ Visión General

`sat-fiscal-toolkit` está diseñado como un pipeline modular de procesamiento contable y fiscal en Python para personas físicas (Servicios Profesionales, Actividad Empresarial y RESICO).

```mermaid
flowchart LR
    A["Entrada: data/2026/MM-mes/"] --> B["cfdi_parser (XML & Metadatos)"]
    B --> C["cash_flow_filter (PUE vs PPD+CRP)"]
    C --> D["tax_calculator (ISR, IVA, Retenciones)"]
    D --> E["report_generator (Markdown & Excel Papel de Trabajo)"]
    E --> F["Salida: data/outputs/2026/MM-mes/"]
```

## 🧩 Componentes Principales (`src/`)

1. **`cfdi_parser.py`**:
   - Lectura rápida de XMLs mediante `lxml` / `xml.etree`.
   - Extracción de atributos de Comprobante (UUID, Fecha, Total, SubTotal, MetodoPago, FormaPago).
   - Extracción de Conceptos, ClaveProdServ, ClaveUnidad.
   - Extracción de Impuestos Trasladados (IVA) y Retenidos (ISR, IVA).
   - Extracción de Complementos (CRP 2.0 / Pagos20).

2. **`cash_flow_filter.py`**:
   - Clasificación por criterio de flujo de efectivo según LISR y LIVA.
   - Asociación de complementos de pago con su CFDI origen mediante UUID relacionado.

3. **`tax_calculator.py`**:
   - Base gravable para ISR provisional.
   - Base acreditable para IVA y cálculo de IVA neto a pagar o saldo a favor.
   - Conciliación de retenciones realizadas por personas morales.

4. **`excel_generator.py` y `markdown_generator.py`**:
   - Generación de papeles de trabajo estructurados en `.xlsx` con pestañas mensuales:
     - Ingresos PUE y Cobrados
     - Egresos Deducibles
     - Determinación ISR
     - Determinación IVA
   - Resúmenes ejecutivos en Markdown optimizados para auditoría rápida con LLMs (NotebookLM, Gemini).
