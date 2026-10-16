# 02 — Reglas Fiscales SAT 2026 (`sat-fiscal-toolkit`)

Este documento compila el marco normativo y las reglas de negocio fiscales mexicanas aplicables al toolkit.

---

## 1. Criterio de Flujo de Efectivo (LISR Art. 102 y LIVA Art. 1-B)

Para personas físicas con Actividad Empresarial y Servicios Profesionales (Régimen General o RESICO):
- **Ingresos Acumulables:** Se consideran únicamente aquellos ingresos efectivamente cobrados en el mes natural correspondiente.
- **Deducciones Autorizadas:** Se consideran únicamente aquellos gastos y compras efectivamente erogados o pagados en el mes natural correspondiente.

### Reglas por Método de Pago:
* **`PUE` (Pago en Una Sola Exhibición):**
  - Se presume cobrado/pagado en la fecha de emisión del CFDI.
  - Se computa en el mes correspondiente a la fecha del timbre.
* **`PPD` (Pago en Parcialidades o Diferido):**
  - **NO** se computa en la fecha de emisión de la factura de origen.
  - Requiere obligatoriamente un **CFDI con Complemento de Recepción de Pagos (CRP)** emitido.
  - La fecha efectiva para acumulación o deducción es la **`FechaPago`** indicada en el nodo del Complemento de Pago, NO la fecha de timbrado del comprobante inicial.

---

## 2. Tasas y Fórmulas de Retención (Personas Morales a Físicas)

Cuando una Persona Moral recibe servicios o adquiere bienes de una Persona Física:

1. **Retención de ISR (Honorarios / Servicios Profesionales - Art. 106 LISR):**
   - Tasa fija: **10%** sobre el Subtotal (base gravable).
2. **Retención de IVA (Art. 1-A LIVA y Art. 3 RIVA):**
   - Regla general: **2/3 partes del IVA trasladado**.
   - Con IVA al 16%, la retención efectiva equivale al **10.6667%** (10.666667%) del Subtotal.
   - Fórmula: `Retención IVA = (Subtotal × 0.16) × (2 / 3) = Subtotal × 0.106667`.

---

## 3. Mecánica del Impuesto al Valor Agregado (IVA)

* **IVA Causado (Cobrado):** Suma del IVA trasladado en facturas de ingresos cobradas en el mes.
* **IVA Acreditable (Pagado):** Suma del IVA trasladado en facturas de gastos efectivamente deducibles pagadas en el mes.
* **IVA Retenido a Favor:** Suma de las retenciones de IVA que las Personas Morales efectuaron al contribuyente.
* **Determinación:**
  `IVA a Cargo/Favor = IVA Causado - IVA Acreditable - IVA Retenido`
* **Saldos a Favor Anteriores:** Si resulta IVA a cargo, se puede aplicar acreditamiento de saldo a favor de meses previos hasta agotar el saldo, sin generar duplicidad.
