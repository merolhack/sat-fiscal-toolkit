import * as XLSX from 'xlsx';
import { CFDIInvoice, MonthlyTaxSummary } from './types';

export function exportWorkpaperExcel(
  summary: MonthlyTaxSummary,
  issuedInvoices: CFDIInvoice[],
  receivedInvoices: CFDIInvoice[],
  filename = `Papel_de_Trabajo_Fiscal_${summary.year}_${String(summary.month).padStart(2, '0')}.xlsx`
) {
  const wb = XLSX.utils.book_new();

  // 1. Resumen Determinacion
  const resumenData = [
    ['CONCEPTO FISCAL', 'IMPORTE (MXN)'],
    ['--- DETERMINACIÓN DE ISR (Art. 106 LISR) ---', ''],
    ['Ingresos cobrados del mes', summary.ingresosCobradosMes],
    ['Ingresos acumulados anteriores', summary.ingresosAcumuladosPrevios],
    ['Total Ingresos Acumulados', summary.ingresosAcumuladosTotal],
    ['Deducciones autorizadas del mes', summary.deduccionesAutorizadasMes],
    ['Deducciones acumuladas anteriores', summary.deduccionesAcumuladasPrevias],
    ['Total Deducciones Acumuladas', summary.deduccionesAcumuladasTotal],
    ['Base Gravable Acumulada', summary.baseGravableAcumulada],
    ['Impuesto Determinado Art. 106', summary.impuestoDeterminadoArt106],
    ['Retenciones ISR acumuladas periodo', summary.retencionesIsrTotal],
    ['Pagos provisionales anteriores', summary.pagosProvisionalesPrevios],
    ['ISR Provisional a Pagar', summary.isrPagarMes],
    ['', ''],
    ['--- DETERMINACIÓN DE IVA DEFINITIVO ---', ''],
    ['IVA Causado (Trasladado cobrado)', summary.ivaCausadoMes],
    ['IVA Acreditable (Gastos autorizados)', summary.ivaAcreditableMes],
    ['IVA Retenido por Personas Morales', summary.retencionesIvaMes],
    ['IVA Neto del Periodo', summary.ivaNetoPrevioAcreditamiento],
    ['Saldo a Favor generado en el mes', summary.saldoFavorIvaMes],
    ['IVA a Cargo del mes', summary.ivaCargoMes],
    ['Saldo a favor anterior acreditado', summary.saldoFavorIvaAnteriorAplicado],
    ['IVA Definitivo a Pagar', summary.ivaPagarFinal],
    ['Saldo a Favor Remanente disponible', summary.saldoFavorIvaRemanenteParaSiguienteMes],
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen_Fiscal');

  // 2. Ingresos Cobrados (Issued)
  const issuedRows = issuedInvoices.map(inv => ({
    UUID: inv.uuid,
    Fecha: inv.fecha,
    Receptor_RFC: inv.receptorRfc,
    Receptor_Nombre: inv.receptorNombre,
    Metodo_Pago: inv.metodoPago,
    Subtotal: inv.subtotal,
    IVA_16: inv.ivaTrasladado16,
    Ret_ISR: inv.isrRetenido,
    Ret_IVA: inv.ivaRetenido,
    Total: inv.total,
  }));
  const wsIssued = XLSX.utils.json_to_sheet(issuedRows);
  XLSX.utils.book_append_sheet(wb, wsIssued, 'Ingresos_Emitidos');

  // 3. Egresos Recibidos (Deducibles y No Deducibles)
  const receivedRows = receivedInvoices.map(inv => ({
    UUID: inv.uuid,
    Fecha: inv.fecha,
    Emisor_RFC: inv.emisorRfc,
    Emisor_Nombre: inv.emisorNombre,
    Metodo_Pago: inv.metodoPago,
    Deducible: inv.isDeductible ? 'SÍ' : 'NO (Personal)',
    Motivo: inv.deductibilityReason || '',
    Subtotal: inv.subtotal,
    IVA_16: inv.ivaTrasladado16,
    Total: inv.total,
  }));
  const wsReceived = XLSX.utils.json_to_sheet(receivedRows);
  XLSX.utils.book_append_sheet(wb, wsReceived, 'Gastos_Recibidos');

  // Generate binary and trigger download
  XLSX.writeFile(wb, filename);
}

export function exportMarkdownReport(
  summary: MonthlyTaxSummary,
  issuedInvoices: CFDIInvoice[],
  receivedInvoices: CFDIInvoice[]
): string {
  const monthName = new Date(summary.year, summary.month - 1).toLocaleString('es-MX', { month: 'long' });
  const titleMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return `# Declaración Fiscal y Papel de Trabajo — ${titleMonth} ${summary.year}

**Régimen:** Personas Físicas con Actividades Empresariales y Profesionales (Honorarios / LISR Art. 106)  
**Criterio de Determinación:** Flujo de Efectivo (Efectivamente Cobrado y Pagado)  
**Fecha de Generación:** ${new Date().toLocaleDateString('es-MX')}

---

## 1. Resumen Ejecutivo de Determinación

| Impuesto | Base / Causado | Acreditamientos / Retenciones | Saldo a Pagar | Saldo a Favor |
| :--- | :--- | :--- | :--- | :--- |
| **ISR Provisional (Art. 106)** | MXN ${summary.baseGravableAcumulada.toLocaleString('es-MX', { minimumFractionDigits: 2 })} | MXN ${(summary.retencionesIsrTotal + summary.pagosProvisionalesPrevios).toLocaleString('es-MX', { minimumFractionDigits: 2 })} | **MXN ${summary.isrPagarMes.toFixed(2)}** | MXN 0.00 |
| **IVA Definitivo** | MXN ${summary.ivaCausadoMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })} | MXN ${(summary.ivaAcreditableMes + summary.retencionesIvaMes).toLocaleString('es-MX', { minimumFractionDigits: 2 })} | **MXN ${summary.ivaPagarFinal.toFixed(2)}** | **MXN ${summary.saldoFavorIvaMes.toFixed(2)}** |

---

## 2. Detalle de Cálculo ISR (Acumulativo LISR Art. 106)

* **Ingresos del Mes (Efectivamente Cobrados):** MXN ${summary.ingresosCobradosMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **Ingresos Acumulados Anteriores:** MXN ${summary.ingresosAcumuladosPrevios.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **Total Ingresos Acumulados al Periodo:** MXN ${summary.ingresosAcumuladosTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **Deducciones Autorizadas del Mes:** MXN ${summary.deduccionesAutorizadasMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **Deducciones Acumuladas Anteriores:** MXN ${summary.deduccionesAcumuladasPrevias.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **Total Deducciones Acumuladas:** MXN ${summary.deduccionesAcumuladasTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **Base Gravable Acumulada:** MXN ${summary.baseGravableAcumulada.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **Impuesto Determinado Art. 106:** MXN ${summary.impuestoDeterminadoArt106.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **Retenciones ISR Personas Morales (Acumuladas):** MXN ${summary.retencionesIsrTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **Pagos Provisionales de ISR Previos:** MXN ${summary.pagosProvisionalesPrevios.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **ISR a Pagar del Mes:** **MXN ${summary.isrPagarMes.toFixed(2)}**

---

## 3. Detalle de Determinación de IVA

* **IVA Causado (16% sobre Ingresos Cobrados):** MXN ${summary.ivaCausadoMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **IVA Acreditable (Gastos Deducibles Pagados):** MXN ${summary.ivaAcreditableMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **Retenciones de IVA efectivas:** MXN ${summary.retencionesIvaMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **IVA Neto Previo a Acreditamiento:** MXN ${summary.ivaNetoPrevioAcreditamiento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **Saldo a Favor Anterior Aplicado:** MXN ${summary.saldoFavorIvaAnteriorAplicado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
* **IVA a Pagar Final:** **MXN ${summary.ivaPagarFinal.toFixed(2)}**
* **Saldo a Favor de IVA Remanente para Siguiente Mes:** **MXN ${summary.saldoFavorIvaRemanenteParaSiguienteMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}**

---

## 4. Clasificación de Comprobantes

* **Facturas Emitidas Procesadas:** ${issuedInvoices.length}
* **Facturas Recibidas Procesadas:** ${receivedInvoices.length}
  * Deducibles Autorizadas: ${receivedInvoices.filter(i => i.isDeductible).length}
  * No Deducibles (Gastos Personales): ${receivedInvoices.filter(i => !i.isDeductible).length} (MXN ${summary.gastosNoDeduciblesMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })} subtotal)
`;
}

export function downloadTextFile(content: string, filename: string, mimeType = 'text/markdown;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

