"""
CFDI XML Parser module for CFDI 3.3 and 4.0 specifications (SAT Anexo 20).
"""

from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional
import xml.etree.ElementTree as ET


def _to_decimal(value: Optional[str]) -> float:
    """Safely converts string number to float."""
    if not value:
        return 0.0
    try:
        return float(Decimal(value.strip()))
    except Exception:
        return 0.0


def parse_cfdi_xml(xml_path: Path) -> Dict[str, Any]:
    """
    Parses a CFDI XML file and extracts all essential fiscal and tax attributes.
    """
    if not xml_path.exists():
        raise FileNotFoundError(f"XML file not found: {xml_path}")

    tree = ET.parse(xml_path)
    root = tree.getroot()

    # Comprobante root attributes
    version = root.attrib.get("Version", "")
    date = root.attrib.get("Fecha", "")
    subtotal = _to_decimal(root.attrib.get("SubTotal", "0"))
    discount = _to_decimal(root.attrib.get("Descuento", "0"))
    total = _to_decimal(root.attrib.get("Total", "0"))
    currency = root.attrib.get("Moneda", "MXN")
    exchange_rate = _to_decimal(root.attrib.get("TipoCambio", "1"))
    payment_method = root.attrib.get("MetodoPago", "PUE")
    payment_form = root.attrib.get("FormaPago", "")
    cfdi_type = root.attrib.get("TipoDeComprobante", "I")
    series = root.attrib.get("Serie", "")
    folio = root.attrib.get("Folio", "")

    # Extract UUID from TimbreFiscalDigital
    uuid = ""
    date_certified = ""
    for elem in root.iter():
        if elem.tag.endswith("TimbreFiscalDigital"):
            uuid = elem.attrib.get("UUID", "").upper()
            date_certified = elem.attrib.get("FechaTimbrado", "")
            break

    if not uuid:
        uuid = xml_path.stem.upper()

    # Issuer (Emisor)
    issuer_rfc = ""
    issuer_name = ""
    issuer_regime = ""
    for elem in root.iter():
        if elem.tag.endswith("Emisor"):
            issuer_rfc = elem.attrib.get("Rfc", "")
            issuer_name = elem.attrib.get("Nombre", "")
            issuer_regime = elem.attrib.get("RegimenFiscal", "")
            break

    # Receiver (Receptor)
    receiver_rfc = ""
    receiver_name = ""
    receiver_use = ""
    for elem in root.iter():
        if elem.tag.endswith("Receptor"):
            receiver_rfc = elem.attrib.get("Rfc", "")
            receiver_name = elem.attrib.get("Nombre", "")
            receiver_use = elem.attrib.get("UsoCFDI", "")
            break

    # Taxes (Extracted from root-level Impuestos to avoid double-counting concept taxes)
    vat_16 = 0.0
    vat_other = 0.0
    ret_isr = 0.0
    ret_vat = 0.0

    root_impuestos = None
    for child in root:
        if child.tag.split("}")[-1] == "Impuestos":
            root_impuestos = child
            break

    scope = root_impuestos if root_impuestos is not None else root

    for elem in scope.iter():
        tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
        if tag == "Traslado":
            tax = elem.attrib.get("Impuesto", "")
            rate = _to_decimal(elem.attrib.get("TasaOCuota", "0"))
            amount = _to_decimal(elem.attrib.get("Importe", "0"))
            if tax in ("002", "IVA"):
                if abs(rate - 0.16) < 0.005 or rate == 16.0:
                    vat_16 += amount
                else:
                    vat_other += amount
        elif tag == "Retencion":
            tax = elem.attrib.get("Impuesto", "")
            amount = _to_decimal(elem.attrib.get("Importe", "0"))
            if tax in ("001", "ISR"):
                ret_isr += amount
            elif tax in ("002", "IVA"):
                ret_vat += amount

    # Related payment receipts (Complemento de Pagos)
    related_payments: List[Dict[str, Any]] = []
    for elem in root.iter():
        tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
        if tag == "DoctoRelacionado":
            doc_id = elem.attrib.get("IdDocumento", "").upper()
            paid = _to_decimal(elem.attrib.get("ImpPagado", "0"))
            related_payments.append({"related_uuid": doc_id, "amount_paid": paid})

    # Concept descriptions
    concepts = []
    for elem in root.iter():
        tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
        if tag == "Concepto":
            desc = elem.attrib.get("Descripcion", "")
            if desc:
                concepts.append(desc.strip())

    return {
        "file": xml_path.name,
        "uuid": uuid,
        "version": version,
        "date": date,
        "date_certified": date_certified,
        "subtotal": subtotal,
        "discount": discount,
        "total": total,
        "currency": currency,
        "exchange_rate": exchange_rate,
        "payment_method": payment_method,
        "payment_form": payment_form,
        "cfdi_type": cfdi_type,
        "series": series,
        "folio": folio,
        "issuer_rfc": issuer_rfc,
        "issuer_name": issuer_name,
        "issuer_regime": issuer_regime,
        "receiver_rfc": receiver_rfc,
        "receiver_name": receiver_name,
        "receiver_use": receiver_use,
        "vat_16": vat_16,
        "vat_other": vat_other,
        "ret_isr": ret_isr,
        "ret_vat": ret_vat,
        "related_payments": related_payments,
        "concepts": concepts[:3],
    }


def parse_xml_folder(xml_dir: Path) -> List[Dict[str, Any]]:
    """
    Parses all CFDI XML files found in xml_dir.
    """
    results = []
    xml_files = list(xml_dir.glob("*.xml")) + list(xml_dir.glob("*.XML"))
    for path in sorted(xml_files):
        try:
            item = parse_cfdi_xml(path)
            results.append(item)
        except Exception as e:
            print(f"Error parsing {path.name}: {e}")
    return results
