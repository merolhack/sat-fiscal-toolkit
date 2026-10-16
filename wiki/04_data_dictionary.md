# 04 — Diccionario de Datos (`sat-fiscal-toolkit`)

Este documento establece la homologación y mapeo de nombres entre los atributos XML del CFDI, los DataFrames de pandas y las columnas del Papel de Trabajo en Excel.

---

## 📊 Matriz de Homologación de Campos

| Campo XML (Anexo 20) | Columna DataFrame (`pd.DataFrame`) | Columna Excel (Papel de Trabajo) | Tipo de Dato | Descripción / Regla |
| :--- | :--- | :--- | :--- | :--- |
| `tfd:UUID` | `uuid` | **Folio Fiscal (UUID)** | `string (36)` | Identificador universal único del comprobante. |
| `Fecha` | `fecha_emision` | **Fecha Emisión** | `datetime64[ns]` | Fecha de expedición del comprobante. |
| `FechaTimbrado` | `fecha_timbrado` | **Fecha Timbrado** | `datetime64[ns]` | Fecha oficial del sello del SAT. |
| `TipoDeComprobante` | `tipo_comprobante` | **Efecto Comprobante** | `string (1)` | `I` (Ingreso), `E` (Egreso), `P` (Pago). |
| `Emisor/@Rfc` | `rfc_emisor` | **RFC Emisor** | `string (12-13)`| RFC de quien emite la factura. |
| `Emisor/@Nombre` | `nombre_emisor` | **Nombre Emisor** | `string` | Razón social o nombre del emisor. |
| `Receptor/@Rfc` | `rfc_receptor` | **RFC Receptor** | `string (12-13)`| RFC de quien recibe la factura. |
| `Receptor/@Nombre`| `nombre_receptor` | **Nombre Receptor** | `string` | Razón social o nombre del receptor. |
| `MetodoPago` | `metodo_pago` | **Método Pago** | `string (3)` | `PUE` o `PPD`. |
| `FormaPago` | `forma_pago` | **Forma Pago** | `string (2)` | Clave catálogo (01, 03, 04, etc.). |
| `SubTotal` | `subtotal` | **Subtotal** | `float64` | Importe antes de impuestos y descuentos. |
| `Descuento` | `descuento` | **Descuento** | `float64` | Descuento aplicado (default 0.00). |
| `Impuestos/Traslados IVA` | `iva_trasladado` | **IVA 16%** | `float64` | Monto de IVA trasladado al 16%. |
| `Impuestos/Retenciones ISR` | `isr_retenido` | **Retención ISR** | `float64` | Monto de ISR retenido (10% en PM a PF). |
| `Impuestos/Retenciones IVA` | `iva_retenido` | **Retención IVA** | `float64` | Monto de IVA retenido (10.6667% en PM a PF). |
| `Total` | `total` | **Total** | `float64` | Importe total neto de la factura. |
| `EstatusCancelacion` | `estatus` | **Estatus SAT** | `string` | `Vigente` o `Cancelado`. |
| *Cálculo interno* | `es_deducible` | **Deducible (Sí/No)** | `boolean` | Flag de deducción autorizada tras clasificación. |
| *Cálculo interno* | `fecha_flujo` | **Fecha Flujo Efectivo**| `datetime64[ns]` | Fecha timbre si es PUE, o FechaPago si es CRP. |
