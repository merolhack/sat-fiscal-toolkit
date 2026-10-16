"""
Tax Calculator module to compute monthly Mexican provisional taxes (ISR & IVA)
using the statutory cash-flow criterion (flujo de efectivo).
"""

from collections import defaultdict
from typing import Any, Dict, List


def reconcile_dataset(
    pdf_invoices: List[Dict[str, Any]],
    xml_invoices: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Reconciles PDF summary entries against parsed XML records.
    """
    pdf_map = {item["uuid"]: item for item in pdf_invoices}
    xml_map = {item["uuid"]: item for item in xml_invoices}

    pdf_uuids = set(pdf_map.keys())
    xml_uuids = set(xml_map.keys())

    matching_uuids = pdf_uuids.intersection(xml_uuids)
    missing_in_xml = [pdf_map[u] for u in (pdf_uuids - xml_uuids)]
    only_in_xml = [xml_map[u] for u in (xml_uuids - pdf_uuids)]

    return {
        "total_pdf": len(pdf_invoices),
        "total_xml": len(xml_invoices),
        "matching_count": len(matching_uuids),
        "missing_in_xml": missing_in_xml,
        "only_in_xml": only_in_xml,
        "pdf_map": pdf_map,
    }


def analyze_invoices_by_flow(
    xml_invoices: List[Dict[str, Any]],
    pdf_map: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Segregates invoices by payment method (PUE vs PPD), type (I, E, P), and provider/client.
    """
    pue_list: List[Dict[str, Any]] = []
    ppd_list: List[Dict[str, Any]] = []
    payments_list: List[Dict[str, Any]] = []
    credit_notes: List[Dict[str, Any]] = []

    subtotal_pue = 0.0
    vat_16_pue = 0.0
    ret_isr_pue = 0.0
    ret_vat_pue = 0.0
    total_pue = 0.0

    subtotal_ppd = 0.0
    total_ppd = 0.0

    counterparties = defaultdict(
        lambda: {"name": "", "total": 0.0, "subtotal": 0.0, "vat": 0.0, "count": 0}
    )

    for inv in xml_invoices:
        uuid = inv["uuid"]
        pdf_info = pdf_map.get(uuid, {})
        status = pdf_info.get("status", "Vigente")
        inv["sat_status"] = status

        if status == "Cancelado":
            continue

        cfdi_type = inv.get("cfdi_type", "I")
        method = inv.get("payment_method", "PUE")

        # Track counterparty (issuer if received, receiver if issued)
        rfc = inv.get("issuer_rfc") or inv.get("receiver_rfc") or "UNKNOWN"
        name = inv.get("issuer_name") or inv.get("receiver_name") or ""
        counterparties[rfc]["name"] = name
        counterparties[rfc]["total"] += inv.get("total", 0.0)
        counterparties[rfc]["subtotal"] += inv.get("subtotal", 0.0)
        counterparties[rfc]["vat"] += inv.get("vat_16", 0.0)
        counterparties[rfc]["count"] += 1

        if cfdi_type == "P":
            payments_list.append(inv)
        elif cfdi_type == "E":
            credit_notes.append(inv)
        elif cfdi_type == "I":
            if method == "PUE":
                pue_list.append(inv)
                subtotal_pue += inv.get("subtotal", 0.0)
                vat_16_pue += inv.get("vat_16", 0.0)
                ret_isr_pue += inv.get("ret_isr", 0.0)
                ret_vat_pue += inv.get("ret_vat", 0.0)
                total_pue += inv.get("total", 0.0)
            else:
                ppd_list.append(inv)
                subtotal_ppd += inv.get("subtotal", 0.0)
                total_ppd += inv.get("total", 0.0)

    return {
        "pue_list": pue_list,
        "ppd_list": ppd_list,
        "payments_list": payments_list,
        "credit_notes": credit_notes,
        "subtotal_pue": subtotal_pue,
        "vat_16_pue": vat_16_pue,
        "ret_isr_pue": ret_isr_pue,
        "ret_vat_pue": ret_vat_pue,
        "total_pue": total_pue,
        "subtotal_ppd": subtotal_ppd,
        "total_ppd": total_ppd,
        "counterparties": dict(counterparties),
    }


def compute_monthly_tax_summary(
    issued_analysis: Dict[str, Any],
    received_analysis: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Calculates net provisional tax liabilities for ISR and VAT.
    """
    # Incomes (Issued PUE)
    collected_income = issued_analysis["subtotal_pue"]
    output_vat = issued_analysis["vat_16_pue"]
    issued_ret_isr = issued_analysis["ret_isr_pue"]
    issued_ret_vat = issued_analysis["ret_vat_pue"]
    total_invoiced_pue = issued_analysis["total_pue"]

    # Expenses (Received PUE)
    authorized_deductions = received_analysis["subtotal_pue"]
    creditable_vat = received_analysis["vat_16_pue"]
    received_ret_isr = received_analysis["ret_isr_pue"]
    received_ret_vat = received_analysis["ret_vat_pue"]
    total_disbursed_pue = received_analysis["total_pue"]

    # Net ISR Taxable Base (Income - Deductions)
    net_taxable_base = max(0.0, collected_income - authorized_deductions)
    fiscal_loss = max(0.0, authorized_deductions - collected_income)

    # Net VAT Balance (Output VAT - Creditable VAT - Withheld VAT)
    net_vat = output_vat - creditable_vat - issued_ret_vat
    vat_to_pay = max(0.0, net_vat)
    vat_favorable_balance = max(0.0, -net_vat)

    return {
        "collected_income": collected_income,
        "output_vat": output_vat,
        "issued_ret_isr": issued_ret_isr,
        "issued_ret_vat": issued_ret_vat,
        "total_invoiced_pue": total_invoiced_pue,
        "authorized_deductions": authorized_deductions,
        "creditable_vat": creditable_vat,
        "received_ret_isr": received_ret_isr,
        "received_ret_vat": received_ret_vat,
        "total_disbursed_pue": total_disbursed_pue,
        "net_taxable_base": net_taxable_base,
        "fiscal_loss": fiscal_loss,
        "net_vat": net_vat,
        "vat_to_pay": vat_to_pay,
        "vat_favorable_balance": vat_favorable_balance,
    }
