# 08 — Bitácora y Control de Saldos Fiscales Acumulados 2026 (`sat-fiscal-toolkit`)

**Contribuyente:** LENIN JOSE MEZA ZARCO  
**RFC:** `MEZL860614DB0`  
**Régimen:** Personas Físicas con Actividades Empresariales y Servicios Profesionales  
**Ejercicio Fiscal:** 2026  

Este documento registra la evolución histórica oficial mes con mes de los ingresos, deducciones, retenciones y saldos a favor para garantizar la continuidad exacta en los cálculos de pagos provisionales de ISR (Art. 106 LISR) y acreditamientos de IVA.

---

## 📈 1. Tabla Maestra de Acumulados Mensuales 2026

| Periodo | Ingresos del Mes (PUE) | Ingresos Acumulados | Deducciones del Mes (PUE) | Deducciones Acumuladas | Base Gravable Acumulada | ISR Causado Acumulado | Retenciones ISR Acumuladas | Pagos Prov. Previos | ISR Pagado en el Mes | Saldo a Favor IVA del Mes | Saldo a Favor IVA Acumulado | Núm. de Operación SAT | Estatus |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ene-Ago** | — | $110,361 | — | $88,173 | $22,188 | — | $8,623 | — | $592 | — | $5,326.00 | *Varios* | ✅ Presentado |
| **09 (Sep)** | $3,017 | $113,378 | $6,608 | $94,781 | $18,597 | $850 | $8,623 | $592 | **$0** | **$574.00** | **$5,900.00** | `262440271315` | ✅ Presentado |
| **10 (Oct)** | *Por procesar* | *Base: $113,378* | *Por procesar* | *Base: $94,781* | *Pendiente* | *Pendiente* | *Base: $8,623* | *Base: $592* | *Pendiente* | *Pendiente* | *Base: $5,900.00* | *Pendiente* | ⏳ En espera |

---

## 🎯 2. Parámetros Oficiales de Arranque para Octubre 2026

Al ejecutar el script de procesamiento para el mes de **Octubre 2026** (`scripts/procesar_cfdi_mes.py --year 2026 --month 10`), los parámetros iniciales de arrastre serán:

```bash
python3 scripts/procesar_cfdi_mes.py \
  --year 2026 \
  --month 10 \
  --prev-income 113378.00 \
  --prev-deductions 94781.00 \
  --prev-ret-isr 8623.00 \
  --prev-payments 592.00 \
  --prev-vat-favorable 5900.00
```

### Detalle de Saldos para Octubre:
1. **Ingresos acumulados base (Ene - Sep):** **$113,378.00 MXN**.
2. **Deducciones autorizadas acumuladas base (Ene - Sep):** **$94,781.00 MXN**.
3. **Retenciones de ISR acumuladas disponibles:** **$8,623.00 MXN** (con remanente no utilizado frente al impuesto acumulado de $8,365.00 MXN).
4. **Pagos provisionales de ISR acumulados previos:** **$592.00 MXN** (efectuado en febrero 2026, acuse Op. `262790094270`).
5. **Saldo a Favor de IVA total disponible para acreditar:** **$5,900.00 MXN** ($5,326.00 arrastrado de Ene-Ago + $574.00 generado y declarado en Septiembre).

---

## 📑 3. Historial de Acuses Oficiales de Recepción SAT

| Ejercicio / Periodo | Tipo | Fecha Presentación | Folio / Núm. Operación | Archivo de Respaldo |
| :--- | :--- | :---: | :---: | :--- |
| **Anual 2025** | Normal | — | `266990009396` | Pérdidas fiscales anteriores agotadas en cero. |
| **2026 - Febrero** | Normal | — | `262790094270` | Respaldo del pago provisional de ISR por $592.00 MXN. |
| **2026 - Septiembre** | Normal | 15/10/2026 22:06 | `262440271315` | [Acuse.MEZL860614DB0.38.2026.pdf](file://wsl$/Ubuntu-20.04/home/merolhack/fl/sat-fiscal-toolkit/data/outputs/2026/09/Acuse.MEZL860614DB0.38.2026.pdf) (ISR: $0, IVA a favor: $574). |
