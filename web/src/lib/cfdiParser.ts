import { CFDIInvoice, CFDIConcept, CFDIPayment, CFDIRelatedDoc } from './types';

/**
 * Helper to safely extract float from string
 */
function toDecimal(val: string | null | undefined): number {
  if (!val) return 0.0;
  const num = parseFloat(val);
  return isNaN(num) ? 0.0 : Math.round(num * 100) / 100;
}

/**
 * Parse a CFDI XML document (Version 3.3 or 4.0) entirely in the browser
 */
export function parseCFDIXML(xmlContent: string, filename: string): CFDIInvoice | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');

    // Check for XML parsing error
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error(`Error parsing XML for ${filename}:`, parserError.textContent);
      return null;
    }

    // Root node (cfdi:Comprobante)
    const comprobante = doc.documentElement;
    if (!comprobante || !comprobante.nodeName.includes('Comprobante')) {
      return null;
    }

    const fecha = comprobante.getAttribute('Fecha') || '';
    const tipoDeComprobante = comprobante.getAttribute('TipoDeComprobante') || 'I';
    const metodoPago = comprobante.getAttribute('MetodoPago') || 'PUE';
    const formaPago = comprobante.getAttribute('FormaPago') || '';
    const moneda = comprobante.getAttribute('Moneda') || 'MXN';
    const subtotal = toDecimal(comprobante.getAttribute('SubTotal'));
    const descuento = toDecimal(comprobante.getAttribute('Descuento'));
    const total = toDecimal(comprobante.getAttribute('Total'));

    // UUID from TimbreFiscalDigital
    let uuid = '';
    const timbre = doc.querySelector('TimbreFiscalDigital, [UUID]');
    if (timbre) {
      uuid = (timbre.getAttribute('UUID') || '').toUpperCase();
    }
    if (!uuid) {
      // Fallback: search anywhere
      const allElems = doc.getElementsByTagName('*');
      for (let i = 0; i < allElems.length; i++) {
        const u = allElems[i].getAttribute('UUID');
        if (u) {
          uuid = u.toUpperCase();
          break;
        }
      }
    }

    // Emisor
    const emisorElem = doc.querySelector('Emisor');
    const emisorRfc = emisorElem ? (emisorElem.getAttribute('Rfc') || '').toUpperCase() : '';
    const emisorNombre = emisorElem ? (emisorElem.getAttribute('Nombre') || '') : '';
    const emisorRegimenFiscal = emisorElem ? (emisorElem.getAttribute('RegimenFiscal') || '') : '';

    // Receptor
    const receptorElem = doc.querySelector('Receptor');
    const receptorRfc = receptorElem ? (receptorElem.getAttribute('Rfc') || '').toUpperCase() : '';
    const receptorNombre = receptorElem ? (receptorElem.getAttribute('Nombre') || '') : '';
    const receptorRegimenFiscal = receptorElem ? (receptorElem.getAttribute('RegimenFiscalReceptor') || receptorElem.getAttribute('RegimenFiscal') || '') : '';
    const receptorUsoCFDI = receptorElem ? (receptorElem.getAttribute('UsoCFDI') || '') : '';

    // Impuestos Root (Crucial fix: avoid concept tax duplication)
    let ivaTrasladado16 = 0.0;
    let ivaRetenido = 0.0;
    let isrRetenido = 0.0;

    // Find direct child Impuestos of Comprobante
    let rootImpuestos: Element | null = null;
    for (let i = 0; i < comprobante.children.length; i++) {
      if (comprobante.children[i].nodeName.includes('Impuestos')) {
        rootImpuestos = comprobante.children[i];
        break;
      }
    }

    if (rootImpuestos) {
      // Traslados at root
      const traslados = rootImpuestos.querySelectorAll('Traslado');
      traslados.forEach(tr => {
        const impuesto = tr.getAttribute('Impuesto');
        const tasaOCuota = parseFloat(tr.getAttribute('TasaOCuota') || '0');
        const importe = toDecimal(tr.getAttribute('Importe'));

        // 002 is IVA in SAT catalog
        if (impuesto === '002' || impuesto === 'IVA') {
          if (Math.abs(tasaOCuota - 0.16) < 0.005 || tasaOCuota === 16) {
            ivaTrasladado16 += importe;
          }
        }
      });

      // Retenciones at root
      const retenciones = rootImpuestos.querySelectorAll('Retencion');
      retenciones.forEach(ret => {
        const impuesto = ret.getAttribute('Impuesto');
        const importe = toDecimal(ret.getAttribute('Importe'));

        // 001 is ISR, 002 is IVA in SAT catalog
        if (impuesto === '001' || impuesto === 'ISR') {
          isrRetenido += importe;
        } else if (impuesto === '002' || impuesto === 'IVA') {
          ivaRetenido += importe;
        }
      });
    }

    // Conceptos
    const conceptos: CFDIConcept[] = [];
    const conceptosElems = doc.querySelectorAll('Concepto');
    conceptosElems.forEach(c => {
      conceptos.push({
        claveProdServ: c.getAttribute('ClaveProdServ') || '',
        claveUnidad: c.getAttribute('ClaveUnidad') || '',
        descripcion: c.getAttribute('Descripcion') || '',
        cantidad: toDecimal(c.getAttribute('Cantidad')),
        valorUnitario: toDecimal(c.getAttribute('ValorUnitario')),
        importe: toDecimal(c.getAttribute('Importe')),
        descuento: toDecimal(c.getAttribute('Descuento')),
      });
    });

    // Complemento de Recepcion de Pagos (CRP 2.0 / Pagos)
    const pagos: CFDIPayment[] = [];
    const pagoNodes = doc.querySelectorAll('Pago, [nodeName$=":Pago"]');
    pagoNodes.forEach(p => {
      const fechaPago = p.getAttribute('FechaPago') || '';
      const formaDePagoP = p.getAttribute('FormaDePagoP') || '';
      const monedaP = p.getAttribute('MonedaP') || 'MXN';
      const monto = toDecimal(p.getAttribute('Monto'));

      const doctosRelacionados: CFDIRelatedDoc[] = [];
      const doctos = p.querySelectorAll('DoctoRelacionado, [nodeName$=":DoctoRelacionado"]');
      doctos.forEach(d => {
        doctosRelacionados.push({
          uuid: (d.getAttribute('IdDocumento') || '').toUpperCase(),
          serie: d.getAttribute('Serie') || '',
          folio: d.getAttribute('Folio') || '',
          moneda: d.getAttribute('MonedaDR') || 'MXN',
          numParcialidad: parseInt(d.getAttribute('NumParcialidad') || '1', 10),
          impSaldoAnt: toDecimal(d.getAttribute('ImpSaldoAnt')),
          impPagado: toDecimal(d.getAttribute('ImpPagado')),
          impSaldoInsoluto: toDecimal(d.getAttribute('ImpSaldoInsoluto')),
        });
      });

      pagos.push({
        fechaPago,
        formaDePagoP,
        monedaP,
        monto,
        doctosRelacionados,
      });
    });

    return {
      uuid,
      filename,
      fecha,
      tipoDeComprobante,
      metodoPago,
      formaPago,
      moneda,
      subtotal,
      descuento,
      total,
      emisorRfc,
      emisorNombre,
      emisorRegimenFiscal,
      receptorRfc,
      receptorNombre,
      receptorRegimenFiscal,
      receptorUsoCFDI,
      ivaTrasladado16: Math.round(ivaTrasladado16 * 100) / 100,
      ivaRetenido: Math.round(ivaRetenido * 100) / 100,
      isrRetenido: Math.round(isrRetenido * 100) / 100,
      conceptos,
      pagos,
    };
  } catch (err) {
    console.error(`Unexpected error reading XML ${filename}:`, err);
    return null;
  }
}

