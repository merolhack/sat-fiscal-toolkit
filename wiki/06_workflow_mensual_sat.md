# 06 — Workflow Mensual del SAT y Gestión de Archivos (`sat-fiscal-toolkit`)

Este documento detalla el procedimiento operativo para la descarga, almacenamiento y procesamiento mensual de comprobantes fiscales (CFDI 4.0) desde el Portal del SAT.

---

## 🏛️ 1. Origen de los Datos en el Portal del SAT

El contribuyente realiza consultas en:
* **Facturas Recibidas (Gastos / Deducciones):** [Portal Contribuyentes CFDI | Buscar CFDI (ConsultaReceptor)](https://portalcfdi.facturaelectronica.sat.gob.mx/ConsultaReceptor.aspx)
* **Facturas Emitidas (Ingresos Cobrados):** [Portal Contribuyentes CFDI | Buscar CFDI (ConsultaEmisor)](https://portalcfdi.facturaelectronica.sat.gob.mx/ConsultaEmisor.aspx)

### Tipos de Archivos Generados por el SAT:
1. **Reporte Resumen (`Resultados.pdf`):**
   - Se genera de inmediato al dar clic en "Buscar CFDI" e imprimir o descargar el resumen de la tabla en pantalla.
   - Contiene la relación resumida de folios fiscales (UUID), RFC del emisor/receptor, fechas, montos totales y estado (Vigente / Cancelado).
2. **Paquete Masivo (`.zip`):**
   - Se solicita mediante el botón "Descargar Seleccionados" o "Descargar Paquete".
   - El portal genera un **Folio de Descarga** (ejemplo: `C67011FE-FD7B-41A8-A074-CDFF16CD9558`).
   - El SAT procesa la solicitud en un periodo de hasta 48 horas.
   - Se recupera posteriormente en la opción **"Recuperar descargas de CFDI"**.

---

## 📁 2. Official Data Directory Structure (English & ISO `MM` Format)

To maintain chronological sorting and automated CLI workflow (`--year 2026 --month 09`):

```text
data/
└── 2026/
    ├── 09/                         <-- Monthly period (September)
    │   ├── issued/                 <-- Invoices issued (Ingresos cobrados)
    │   │   ├── summary/            <-- "Resultados.pdf" of issued invoices
    │   │   ├── zips/               <-- Downloaded SAT bulk .zip archive
    │   │   └── xml/                <-- Extracted XML invoices
    │   └── received/               <-- Invoices received (Gastos / Deducciones)
    │       ├── summary/            <-- "Resultados.pdf" of received invoices
    │       ├── zips/               <-- Downloaded SAT bulk .zip archive
    │       └── xml/                <-- Extracted XML invoices
    └── 10/                         <-- Monthly period (October)
        └── ...
```

### Outputs and Working Papers (`data/outputs/`):
```text
data/
└── outputs/
    └── 2026/
        ├── 09/
        │   ├── monthly_tax_declaration_2026_09.md  <-- Official declaration working paper
        │   └── declaracion_mensual_2026_09.md      <-- Mirror copy
        └── 10/
            └── ...
```

---

## 🔒 3. Reglas de Seguridad y Git

- Todos los archivos `*.xml`, `*.pdf`, `*.zip`, `*.xlsx` están permanentemente excluidos en [.gitignore](file://wsl$/Ubuntu-20.04/home/merolhack/fl/sat-fiscal-toolkit/.gitignore).
- Solo los archivos `.gitkeep` se mantienen en el control de versiones para conservar intacto el árbol de directorios mensual.

---

## ⚡ 4. Ciclo de Ejecución Mensual

1. **Paso 1:** Al consultar el mes en el SAT, descargar el PDF de la consulta y guardarlo en `data/2026/10-octubre/recibidas/resumen/Resultados.pdf`.
2. **Paso 2:** Solicitar la descarga masiva y registrar el folio de solicitud (ej. `C67011FE-FD7B-41A8-A074-CDFF16CD9558`).
3. **Paso 3:** Una vez disponible en "Recuperar descargas de CFDI", descargar el `.zip` y colocarlo en `data/2026/10-octubre/recibidas/zips/`.
4. **Paso 4:** Descomprimir los XMLs en `data/2026/10-octubre/recibidas/xml/`.
5. **Paso 5:** Ejecutar el pipeline de procesamiento de `sat-fiscal-toolkit`:
   ```bash
   python scripts/run_monthly_report.py --periodo 2026-10
   ```
