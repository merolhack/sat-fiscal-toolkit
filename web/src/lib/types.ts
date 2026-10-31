export type PaymentMethod = 'PUE' | 'PPD' | string;
export type VoucherType = 'I' | 'E' | 'T' | 'N' | 'P' | string; // Ingreso, Egreso, Traslado, Nomina, Pago

export interface CFDIRelatedDoc {
  uuid: string;
  serie?: string;
  folio?: string;
  moneda: string;
  numParcialidad?: number;
  impSaldoAnt?: number;
  impPagado: number;
  impSaldoInsoluto?: number;
}

export interface CFDIPayment {
  fechaPago: string;
  formaDePagoP: string;
  monedaP: string;
  monto: number;
  doctosRelacionados: CFDIRelatedDoc[];
}

export interface CFDIConcept {
  claveProdServ: string;
  claveUnidad: string;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  importe: number;
  descuento?: number;
}

export interface CFDIInvoice {
  uuid: string;
  filename: string;
  fecha: string; // YYYY-MM-DDTHH:mm:ss
  tipoDeComprobante: VoucherType;
  metodoPago: PaymentMethod;
  formaPago: string;
  moneda: string;
  subtotal: number;
  descuento: number;
  total: number;
  
  // Emisor
  emisorRfc: string;
  emisorNombre: string;
  emisorRegimenFiscal: string;

  // Receptor
  receptorRfc: string;
  receptorNombre: string;
  receptorRegimenFiscal: string;
  receptorUsoCFDI: string;

  // Impuestos Root
  ivaTrasladado16: number;
  ivaRetenido: number;
  isrRetenido: number;

  // Conceptos
  conceptos: CFDIConcept[];

  // CRP (Pagos)
  pagos: CFDIPayment[];

  // Estado y clasificación
  isDeductible?: boolean;
  deductibilityReason?: string;
  isEffectiveFlow?: boolean; // PUE en el mes o PPD con CRP en el mes
}

export interface TaxBracket {
  limiteInferior: number;
  limiteSuperior: number;
  cuotaFija: number;
  porcentajeExcedente: number;
}

export interface MonthlyTaxSummary {
  year: number;
  month: number; // 1-12
  
  // Ingresos (Issued)
  ingresosCobradosMes: number;
  ingresosAcumuladosPrevios: number;
  ingresosAcumuladosTotal: number;

  // Deducciones (Received)
  deduccionesAutorizadasMes: number;
  deduccionesAcumuladasPrevias: number;
  deduccionesAcumuladasTotal: number;
  gastosNoDeduciblesMes: number;

  // Base Gravable ISR
  baseGravableMes: number;
  baseGravableAcumulada: number;
  impuestoDeterminadoArt106: number;

  // Acreditamientos ISR
  retencionesIsrMes: number;
  retencionesIsrAcumuladasPrevias: number;
  retencionesIsrTotal: number;
  pagosProvisionalesPrevios: number;
  isrPagarMes: number;

  // IVA
  ivaCausadoMes: number;
  ivaAcreditableMes: number;
  retencionesIvaMes: number;
  ivaNetoPrevioAcreditamiento: number; // Causado - Acreditable - Retenido
  saldoFavorIvaMes: number;
  ivaCargoMes: number;
  saldoFavorIvaAnteriorAplicado: number;
  ivaPagarFinal: number;

  // Saldos a favor remanentes
  saldoFavorIvaAnteriorDisponible: number;
  saldoFavorIvaRemanenteParaSiguienteMes: number;
}

