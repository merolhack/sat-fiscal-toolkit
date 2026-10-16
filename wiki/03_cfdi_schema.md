# 03 — Esquema Anexo 20 CFDI 4.0 (`sat-fiscal-toolkit`)

## 📄 Estructura del XML Anexo 20 (CFDI versión 4.0)

Namespaces estándar:
- `cfdi`: `http://www.sat.gob.mx/cfd/4`
- `tfd`: `http://www.sat.gob.mx/TimbreFiscalDigital`
- `pago20`: `http://www.sat.gob.mx/Pagos20`

---

## 🔍 Nodos Clave y Atributos de Extracción

### 1. `cfdi:Comprobante` (Nodo Raíz)
- `Version`: Debe ser "4.0".
- `Serie` y `Folio`: Identificadores internos del emisor.
- `Fecha`: Fecha y hora de emisión (`AAAA-MM-DDThh:mm:ss`).
- `FormaPago`: Clave de catálogo (ej. "03" Transferencia electrónica).
- `MetodoPago`: `PUE` (Pago en una sola exhibición) o `PPD` (Pago en parcialidades o diferido).
- `TipoDeComprobante`: `I` (Ingreso), `E` (Egreso / Nota de crédito), `P` (Pago / CRP), `N` (Nómina), `T` (Traslado).
- `Moneda`: `MXN`, `USD`, etc.
- `TipoCambio`: Requerido si es moneda extranjera.
- `SubTotal`: Suma de importes de conceptos antes de descuentos e impuestos.
- `Descuento`: Importe descontado si aplica.
- `Total`: Subtotal - Descuento + Impuestos Trasladados - Impuestos Retenidos.

### 2. `cfdi:Emisor` y `cfdi:Receptor`
- `Rfc`: Registro Federal de Contribuyentes.
- `Nombre` / `RazonSocial`: Nombre legal.
- `RegimenFiscal`: Clave de régimen del emisor (ej. "612", "626", "601").
- `RegimenFiscalReceptor`: Clave de régimen fiscal del receptor.
- `UsoCFDI`: Uso fiscal declarado (ej. "G03" Gastos en general, "CP01" Pagos).

### 3. `cfdi:Impuestos`
- `cfdi:Retenciones/cfdi:Retencion`:
  - `Impuesto`: "001" (ISR), "002" (IVA), "003" (IEPS).
  - `Importe`: Monto retenido.
- `cfdi:Traslados/cfdi:Traslado`:
  - `Base`: Base sobre la cual se calcula el impuesto.
  - `Impuesto`: "002" (IVA).
  - `TipoFactor`: "Tasa", "Cuota", "Exento".
  - `TasaOCuota`: Ej. "0.160000".
  - `Importe`: Monto trasladado.

### 4. `cfdi:Complemento/tfd:TimbreFiscalDigital`
- `UUID`: Folio Fiscal único de 36 caracteres (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
- `FechaTimbrado`: Fecha oficial de certificación por el PAC o SAT.
- `RfcProvCertif`: RFC del PAC que timbró el comprobante.

### 5. `cfdi:Complemento/pago20:Pagos` (CFDI Tipo P)
- `pago20:Totales`: Resumen de bases e impuestos retenidos/trasladados de los pagos.
- `pago20:Pago`:
  - `FechaPago`: Fecha y hora real en que se efectuó el cobro/pago.
  - `Monto`: Importe pagado.
  - `pago20:DoctoRelacionado`:
    - `IdDocumento`: UUID de la factura PPD origen liquidada o abonada.
    - `NumParcialidad`: Número de pago.
    - `ImpSaldoAnt`, `ImpPagado`, `ImpSaldoInsoluto`.
