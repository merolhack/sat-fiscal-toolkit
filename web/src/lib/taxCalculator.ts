import { CFDIInvoice, MonthlyTaxSummary, TaxBracket } from './types';

// Known non-deductible / personal expense RFCs
export const NON_DEDUCTIBLE_RFCS: Record<string, string> = {
  'NWM9709244W4': 'Supermercado y despensa personal (Wal Mart)',
  'CCO8605231N4': 'Tienda de conveniencia / Bebidas y botanas (OXXO)',
  'RAD161031RK1': 'Restaurante y consumo personal de alimentos (Restaurantes ADMX)',
  'CHC921006BM7': 'Alimentos y abarrotes personales (Cremería Coronel)',
  'OPI210608AF7': 'Bebidas embotelladas personales (Opineg)',
  'SECA630424G39': 'Artículos deportivos personales (Yoga / Pilates)',
  'CCA940503DW5': 'Calzado y tenis personales (Panam)',
  'TAL041210PN1': 'Ropa y prendas de vestir personales (Tiendas Alka)',
  'AUGJ810427P79': 'Prendas de vestir personales',
  'SAT170927Q91': 'Colegiatura (Deducción personal anual, no provisional mensual)',
};

// ClaveProdServ prefixes representing personal / non-deductible expenses
export const NON_DEDUCTIBLE_CPS_PREFIXES: string[] = [
  '50',     // Alimentos, bebidas y tabaco (despensa general)
  '901015', // Establecimientos para comer y beber (restaurantes, comida rápida)
  '5310',   // Ropa y prendas de vestir
  '5311',   // Calzado
  '4922',   // Equipo deportivo y accesorios de gimnasio
];

export function evaluateDeductibility(inv: CFDIInvoice): { isDeductible: boolean; reason: string } {
  const rfc = (inv.emisorRfc || '').trim().toUpperCase();
  const name = (inv.emisorNombre || '').trim().toLowerCase();

  // Rule 1: Known non-deductible RFCs
  if (NON_DEDUCTIBLE_RFCS[rfc]) {
    return { isDeductible: false, reason: NON_DEDUCTIBLE_RFCS[rfc] };
  }

  // Rule 2: ClaveProdServ prefixes
  for (const c of inv.conceptos) {
    for (const prefix of NON_DEDUCTIBLE_CPS_PREFIXES) {
      if (c.claveProdServ.startsWith(prefix)) {
        return {
          isDeductible: false,
          reason: `ClaveProdServ ${c.claveProdServ} (${c.descripcion || 'Gasto personal/alimentos/ropa'})`,
        };
      }
    }
  }

  // Rule 3: Heuristic name matching
  if (['wal mart', 'walmart', 'oxxo', 'restaurante', 'cremeria', 'abarrotes'].some(k => name.includes(k))) {
    return { isDeductible: false, reason: `Proveedor catalogado como gasto personal/despensa (${inv.emisorNombre})` };
  }

  return { isDeductible: true, reason: 'Deducción autorizada indispensable para la actividad profesional' };
}

// Official monthly brackets LISR Art. 96 / 106 (2024 - 2026)
export const MONTHLY_BRACKETS: TaxBracket[] = [
  { limiteInferior: 0.01, limiteSuperior: 746.04, cuotaFija: 0.00, porcentajeExcedente: 0.0192 },
  { limiteInferior: 746.05, limiteSuperior: 6332.05, cuotaFija: 14.32, porcentajeExcedente: 0.0640 },
  { limiteInferior: 6332.06, limiteSuperior: 11128.01, cuotaFija: 371.83, porcentajeExcedente: 0.1088 },
  { limiteInferior: 11128.02, limiteSuperior: 12935.82, cuotaFija: 893.63, porcentajeExcedente: 0.1600 },
  { limiteInferior: 12935.83, limiteSuperior: 15487.71, cuotaFija: 1182.88, porcentajeExcedente: 0.1792 },
  { limiteInferior: 15487.72, limiteSuperior: 31236.49, cuotaFija: 1640.18, porcentajeExcedente: 0.2136 },
  { limiteInferior: 31236.50, limiteSuperior: 49233.00, cuotaFija: 5004.12, porcentajeExcedente: 0.2352 },
  { limiteInferior: 49233.01, limiteSuperior: 93993.90, cuotaFija: 9236.89, porcentajeExcedente: 0.3000 },
  { limiteInferior: 93993.91, limiteSuperior: 125325.20, cuotaFija: 22665.17, porcentajeExcedente: 0.3200 },
  { limiteInferior: 125325.21, limiteSuperior: 375975.61, cuotaFija: 32691.18, porcentajeExcedente: 0.3400 },
  { limiteInferior: 375975.62, limiteSuperior: Number.POSITIVE_INFINITY, cuotaFija: 117912.32, porcentajeExcedente: 0.3500 },
];

export function calculateISRArt106(taxableBase: number, month: number): {
  determinedTax: number;
  cumLower: number;
  cumUpper: number;
  cumFixed: number;
  rate: number;
  excess: number;
} {
  if (taxableBase <= 0.0) {
    return { determinedTax: 0, cumLower: 0, cumUpper: 0, cumFixed: 0, rate: 0, excess: 0 };
  }

  for (const b of MONTHLY_BRACKETS) {
    const cumLower = Math.round(b.limiteInferior * month * 100) / 100;
    const cumUpper = b.limiteSuperior === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Math.round(b.limiteSuperior * month * 100) / 100;
    const cumFixed = Math.round(b.cuotaFija * month * 100) / 100;

    if (taxableBase >= cumLower && taxableBase <= cumUpper) {
      const excess = Math.round((taxableBase - cumLower) * 100) / 100;
      const marginalTax = Math.round(excess * b.porcentajeExcedente * 100) / 100;
      const totalTax = Math.round((cumFixed + marginalTax) * 100) / 100;
      return {
        determinedTax: totalTax,
        cumLower,
        cumUpper,
        cumFixed,
        rate: b.porcentajeExcedente,
        excess,
      };
    }
  }

  return { determinedTax: 0, cumLower: 0, cumUpper: 0, cumFixed: 0, rate: 0, excess: 0 };
}

export interface HistoricalBalances {
  previousIncome: number;
  previousDeductions: number;
  previousWithheldIsr: number;
  previousProvisionalPayments: number;
  previousVatFavorableBalance: number;
}

export function computeMonthlyDeclaration(
  issuedInvoices: CFDIInvoice[],
  receivedInvoices: CFDIInvoice[],
  year: number = 2026,
  month: number = 9,
  historical: HistoricalBalances = {
    previousIncome: 110361.0,
    previousDeductions: 88173.0,
    previousWithheldIsr: 8623.0,
    previousProvisionalPayments: 592.0,
    previousVatFavorableBalance: 5326.0,
  }
): MonthlyTaxSummary {
  // 1. Incomes: Issued PUE
  let ingresosCobradosMes = 0;
  let ivaCausadoMes = 0;
  let retencionesIsrMes = 0;
  let retencionesIvaMes = 0;

  issuedInvoices.forEach(inv => {
    if (inv.tipoDeComprobante === 'I' && inv.metodoPago === 'PUE') {
      ingresosCobradosMes += inv.subtotal;
      ivaCausadoMes += inv.ivaTrasladado16;
      retencionesIsrMes += inv.isrRetenido;
      retencionesIvaMes += inv.ivaRetenido;
    }
  });

  // 2. Expenses: Received PUE (authorized deductions vs personal expenses)
  let deduccionesAutorizadasMes = 0;
  let ivaAcreditableMes = 0;
  let gastosNoDeduciblesMes = 0;

  receivedInvoices.forEach(inv => {
    if (inv.tipoDeComprobante === 'I' && inv.metodoPago === 'PUE') {
      if (inv.isDeductible) {
        deduccionesAutorizadasMes += inv.subtotal;
        ivaAcreditableMes += inv.ivaTrasladado16;
      } else {
        gastosNoDeduciblesMes += inv.subtotal;
      }
    }
  });

  // Round values to 2 decimals
  ingresosCobradosMes = Math.round(ingresosCobradosMes * 100) / 100;
  ivaCausadoMes = Math.round(ivaCausadoMes * 100) / 100;
  retencionesIsrMes = Math.round(retencionesIsrMes * 100) / 100;
  retencionesIvaMes = Math.round(retencionesIvaMes * 100) / 100;

  deduccionesAutorizadasMes = Math.round(deduccionesAutorizadasMes * 100) / 100;
  ivaAcreditableMes = Math.round(ivaAcreditableMes * 100) / 100;
  gastosNoDeduciblesMes = Math.round(gastosNoDeduciblesMes * 100) / 100;

  // 3. ISR Cumulative Art. 106
  const ingresosAcumuladosTotal = Math.round((historical.previousIncome + ingresosCobradosMes) * 100) / 100;
  const deduccionesAcumuladasTotal = Math.round((historical.previousDeductions + deduccionesAutorizadasMes) * 100) / 100;

  const baseGravableMes = Math.max(0, Math.round((ingresosCobradosMes - deduccionesAutorizadasMes) * 100) / 100);
  const baseGravableAcumulada = Math.max(0, Math.round((ingresosAcumuladosTotal - deduccionesAcumuladasTotal) * 100) / 100);

  const isrResult = calculateISRArt106(baseGravableAcumulada, month);
  const impuestoDeterminadoArt106 = isrResult.determinedTax;

  const retencionesIsrTotal = Math.round((historical.previousWithheldIsr + retencionesIsrMes) * 100) / 100;
  const pagosProvisionalesPrevios = historical.previousProvisionalPayments;

  const totalCreditableISR = Math.round((retencionesIsrTotal + pagosProvisionalesPrevios) * 100) / 100;
  const isrPagarMes = Math.max(0, Math.round((impuestoDeterminadoArt106 - totalCreditableISR) * 100) / 100);

  // 4. IVA
  const netVatBeforeAccreditation = Math.round((ivaCausadoMes - ivaAcreditableMes - retencionesIvaMes) * 100) / 100;
  let saldoFavorIvaMes = 0;
  let ivaCargoMes = 0;
  let saldoFavorIvaAnteriorAplicado = 0;
  let ivaPagarFinal = 0;
  let saldoFavorIvaRemanenteParaSiguienteMes = historical.previousVatFavorableBalance;

  if (netVatBeforeAccreditation < 0) {
    saldoFavorIvaMes = Math.abs(netVatBeforeAccreditation);
    saldoFavorIvaRemanenteParaSiguienteMes = Math.round((historical.previousVatFavorableBalance + saldoFavorIvaMes) * 100) / 100;
  } else {
    ivaCargoMes = netVatBeforeAccreditation;
    if (historical.previousVatFavorableBalance > 0) {
      if (historical.previousVatFavorableBalance >= ivaCargoMes) {
        saldoFavorIvaAnteriorAplicado = ivaCargoMes;
        ivaPagarFinal = 0;
        saldoFavorIvaRemanenteParaSiguienteMes = Math.round((historical.previousVatFavorableBalance - ivaCargoMes) * 100) / 100;
      } else {
        saldoFavorIvaAnteriorAplicado = historical.previousVatFavorableBalance;
        ivaPagarFinal = Math.round((ivaCargoMes - saldoFavorIvaAnteriorAplicado) * 100) / 100;
        saldoFavorIvaRemanenteParaSiguienteMes = 0;
      }
    } else {
      ivaPagarFinal = ivaCargoMes;
    }
  }

  return {
    year,
    month,
    ingresosCobradosMes,
    ingresosAcumuladosPrevios: historical.previousIncome,
    ingresosAcumuladosTotal,
    deduccionesAutorizadasMes,
    deduccionesAcumuladasPrevias: historical.previousDeductions,
    deduccionesAcumuladasTotal,
    gastosNoDeduciblesMes,
    baseGravableMes,
    baseGravableAcumulada,
    impuestoDeterminadoArt106,
    retencionesIsrMes,
    retencionesIsrAcumuladasPrevias: historical.previousWithheldIsr,
    retencionesIsrTotal,
    pagosProvisionalesPrevios,
    isrPagarMes,
    ivaCausadoMes,
    ivaAcreditableMes,
    retencionesIvaMes,
    ivaNetoPrevioAcreditamiento: netVatBeforeAccreditation,
    saldoFavorIvaMes,
    ivaCargoMes,
    saldoFavorIvaAnteriorAplicado,
    ivaPagarFinal,
    saldoFavorIvaAnteriorDisponible: historical.previousVatFavorableBalance,
    saldoFavorIvaRemanenteParaSiguienteMes,
  };
}

