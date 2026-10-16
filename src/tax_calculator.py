"""
Tax Calculator module to compute monthly Mexican provisional taxes (ISR & IVA)
under the statutory cash-flow criterion (flujo de efectivo) and LISR Art. 106 cumulative rules.
"""

from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple


# Known non-deductible / personal expense RFCs
NON_DEDUCTIBLE_RFCS: Dict[str, str] = {
    "NWM9709244W4": "Supermercado y despensa personal (Wal Mart)",
    "CCO8605231N4": "Tienda de conveniencia / Bebidas y botanas (OXXO)",
    "RAD161031RK1": "Restaurante y consumo personal de alimentos (Restaurantes ADMX)",
    "CHC921006BM7": "Alimentos y abarrotes personales (Cremería Coronel)",
    "OPI210608AF7": "Bebidas embotelladas personales (Opineg)",
    "SECA630424G39": "Artículos deportivos personales (Yoga / Pilates)",
    "CCA940503DW5": "Calzado y tenis personales (Panam)",
    "TAL041210PN1": "Ropa y prendas de vestir personales (Tiendas Alka)",
    "AUGJ810427P79": "Prendas de vestir personales",
    "SAT170927Q91": "Colegiatura (Deducción personal anual, no provisional mensual)",
}

# ClaveProdServ prefixes that represent personal / non-deductible expenses for professional activity
NON_DEDUCTIBLE_CPS_PREFIXES: Tuple[str, ...] = (
    "50",       # Alimentos, bebidas y tabaco (despensa general)
    "901015",   # Establecimientos para comer y beber (restaurantes, comida rápida)
    "5310",     # Ropa y prendas de vestir
    "5311",     # Calzado
    "4922",     # Equipo deportivo y accesorios de gimnasio
)


def evaluate_expense_deductibility(invoice: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Evaluates whether an expense invoice qualifies as an Authorized Business Deduction
    or if it is a Non-Deductible / Personal Expense.
    Returns (is_deductible: bool, reason: str).
    """
    issuer_rfc = invoice.get("issuer_rfc", "").strip().upper()
    issuer_name = invoice.get("issuer_name", "").strip()

    # Rule 1: Check known supermarket/convenience/restaurant RFCs
    if issuer_rfc in NON_DEDUCTIBLE_RFCS:
        return False, NON_DEDUCTIBLE_RFCS[issuer_rfc]

    # Rule 2: Check Concept ClaveProdServ codes and descriptions
    for concept_str in invoice.get("concepts", []):
        parts = concept_str.split(":", 1)
        cps = parts[0].strip()
        desc = parts[1].strip() if len(parts) > 1 else ""

        for prefix in NON_DEDUCTIBLE_CPS_PREFIXES:
            if cps.startswith(prefix):
                return False, f"ClaveProdServ {cps} ({desc or 'Gasto personal/alimentos/ropa'})"

    # Rule 3: Heuristic name matching
    name_lower = issuer_name.lower()
    if any(k in name_lower for k in ("wal mart", "walmart", "oxxo", "restaurante", "cremeria", "abarrotes")):
        return False, f"Proveedor catalogado como gasto personal/despensa ({issuer_name})"

    return True, "Deducción autorizada indispensable para la actividad profesional"


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
    Segregates invoices by payment method, type, deductibility, and aggregates vendor totals.
    """
    pue_deductible_list: List[Dict[str, Any]] = []
    pue_non_deductible_list: List[Dict[str, Any]] = []
    ppd_list: List[Dict[str, Any]] = []
    payments_list: List[Dict[str, Any]] = []
    credit_notes: List[Dict[str, Any]] = []
    payroll_receipts: List[Dict[str, Any]] = []

    # Financial sums for deductible PUE
    subtotal_pue_deductible = 0.0
    vat_16_pue_deductible = 0.0
    ret_isr_pue_deductible = 0.0
    ret_vat_pue_deductible = 0.0
    total_pue_deductible = 0.0

    # Financial sums for non-deductible PUE
    subtotal_pue_non_deductible = 0.0
    vat_16_pue_non_deductible = 0.0
    total_pue_non_deductible = 0.0

    # PPD sums
    subtotal_ppd = 0.0
    total_ppd = 0.0

    # Vendor breakdowns strictly aggregated from PUE invoices
    deductible_vendors = defaultdict(
        lambda: {"name": "", "total": 0.0, "subtotal": 0.0, "vat": 0.0, "count": 0}
    )
    non_deductible_vendors = defaultdict(
        lambda: {"name": "", "total": 0.0, "subtotal": 0.0, "vat": 0.0, "count": 0, "reason": ""}
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

        if cfdi_type == "N":
            payroll_receipts.append(inv)
            continue
        elif cfdi_type == "P":
            payments_list.append(inv)
            continue
        elif cfdi_type == "E":
            credit_notes.append(inv)
            continue
        elif cfdi_type == "I":
            if method == "PUE":
                is_deductible, reason = evaluate_expense_deductibility(inv)
                inv["is_deductible"] = is_deductible
                inv["deductibility_reason"] = reason

                rfc = inv.get("issuer_rfc") or inv.get("receiver_rfc") or "UNKNOWN"
                name = inv.get("issuer_name") or inv.get("receiver_name") or ""

                if is_deductible:
                    pue_deductible_list.append(inv)
                    subtotal_pue_deductible += inv.get("subtotal", 0.0)
                    vat_16_pue_deductible += inv.get("vat_16", 0.0)
                    ret_isr_pue_deductible += inv.get("ret_isr", 0.0)
                    ret_vat_pue_deductible += inv.get("ret_vat", 0.0)
                    total_pue_deductible += inv.get("total", 0.0)

                    deductible_vendors[rfc]["name"] = name
                    deductible_vendors[rfc]["total"] += inv.get("total", 0.0)
                    deductible_vendors[rfc]["subtotal"] += inv.get("subtotal", 0.0)
                    deductible_vendors[rfc]["vat"] += inv.get("vat_16", 0.0)
                    deductible_vendors[rfc]["count"] += 1
                else:
                    pue_non_deductible_list.append(inv)
                    subtotal_pue_non_deductible += inv.get("subtotal", 0.0)
                    vat_16_pue_non_deductible += inv.get("vat_16", 0.0)
                    total_pue_non_deductible += inv.get("total", 0.0)

                    non_deductible_vendors[rfc]["name"] = name
                    non_deductible_vendors[rfc]["total"] += inv.get("total", 0.0)
                    non_deductible_vendors[rfc]["subtotal"] += inv.get("subtotal", 0.0)
                    non_deductible_vendors[rfc]["vat"] += inv.get("vat_16", 0.0)
                    non_deductible_vendors[rfc]["count"] += 1
                    non_deductible_vendors[rfc]["reason"] = reason
            else:
                ppd_list.append(inv)
                subtotal_ppd += inv.get("subtotal", 0.0)
                total_ppd += inv.get("total", 0.0)

    return {
        "pue_deductible_list": pue_deductible_list,
        "pue_non_deductible_list": pue_non_deductible_list,
        "ppd_list": ppd_list,
        "payments_list": payments_list,
        "credit_notes": credit_notes,
        "payroll_receipts": payroll_receipts,
        # Deductible totals
        "subtotal_pue_deductible": round(subtotal_pue_deductible, 2),
        "vat_16_pue_deductible": round(vat_16_pue_deductible, 2),
        "ret_isr_pue_deductible": round(ret_isr_pue_deductible, 2),
        "ret_vat_pue_deductible": round(ret_vat_pue_deductible, 2),
        "total_pue_deductible": round(total_pue_deductible, 2),
        # Non-deductible totals
        "subtotal_pue_non_deductible": round(subtotal_pue_non_deductible, 2),
        "vat_16_pue_non_deductible": round(vat_16_pue_non_deductible, 2),
        "total_pue_non_deductible": round(total_pue_non_deductible, 2),
        # PPD totals
        "subtotal_ppd": round(subtotal_ppd, 2),
        "total_ppd": round(total_ppd, 2),
        # Vendors
        "deductible_vendors": dict(deductible_vendors),
        "non_deductible_vendors": dict(non_deductible_vendors),
    }


def calculate_cumulative_isr_art106(
    taxable_base: float,
    month: int = 9,
) -> Dict[str, Any]:
    """
    Applies the cumulative tax tariff of Art. 106 LISR for the specified number of months.
    """
    # Official monthly bracket limits (LISR Art. 96 / 106, 2024-2026)
    monthly_brackets = [
        (0.01, 746.04, 0.00, 0.0192),
        (746.05, 6332.05, 14.32, 0.0640),
        (6332.06, 11128.01, 371.83, 0.1088),
        (11128.02, 12935.82, 893.63, 0.1600),
        (12935.83, 15487.71, 1182.88, 0.1792),
        (15487.72, 31236.49, 1640.18, 0.2136),
        (31236.50, 49233.00, 5004.12, 0.2352),
        (49233.01, 93993.90, 9236.89, 0.3000),
        (93993.91, 125325.20, 22665.17, 0.3200),
        (125325.21, 375975.61, 32691.18, 0.3400),
        (375975.62, float("inf"), 117912.32, 0.3500),
    ]

    if taxable_base <= 0.0:
        return {
            "determined_tax": 0.0,
            "cum_lower": 0.0,
            "cum_upper": 0.0,
            "cum_fixed": 0.0,
            "rate": 0.0,
            "excess": 0.0,
        }

    for lower, upper, fixed, rate in monthly_brackets:
        cum_lower = round(lower * month, 2)
        cum_upper = round(upper * month, 2) if upper != float("inf") else float("inf")
        cum_fixed = round(fixed * month, 2)

        if cum_lower <= taxable_base <= cum_upper:
            excess = round(taxable_base - cum_lower, 2)
            marginal_tax = round(excess * rate, 2)
            total_tax = round(cum_fixed + marginal_tax, 2)
            return {
                "determined_tax": total_tax,
                "cum_lower": cum_lower,
                "cum_upper": cum_upper,
                "cum_fixed": cum_fixed,
                "rate": rate,
                "excess": excess,
            }

    return {
        "determined_tax": 0.0,
        "cum_lower": 0.0,
        "cum_upper": 0.0,
        "cum_fixed": 0.0,
        "rate": 0.0,
        "excess": 0.0,
    }


def compute_monthly_tax_summary(
    issued_analysis: Dict[str, Any],
    received_analysis: Dict[str, Any],
    month: int = 9,
    # Historical cumulative balances (Jan - Aug 2026)
    previous_income: float = 110361.00,
    previous_deductions: float = 88173.00,
    previous_withheld_isr: float = 8623.00,
    previous_provisional_payments: float = 592.00,
    previous_vat_favorable_balance: float = 5326.00,
) -> Dict[str, Any]:
    """
    Computes comprehensive tax return figures incorporating cumulative ISR Art. 106 rules,
    depurated authorized deductions, and VAT balance tracking.
    """
    # 1. Income (Issued PUE)
    current_income = issued_analysis["subtotal_pue_deductible"]
    output_vat = issued_analysis["vat_16_pue_deductible"]
    current_withheld_isr = issued_analysis["ret_isr_pue_deductible"]
    current_withheld_vat = issued_analysis["ret_vat_pue_deductible"]
    total_invoiced_pue = issued_analysis["total_pue_deductible"]

    # 2. Deductions (Received PUE - strictly authorized)
    current_authorized_deductions = received_analysis["subtotal_pue_deductible"]
    creditable_vat = received_analysis["vat_16_pue_deductible"]
    total_deductible_disbursed = received_analysis["total_pue_deductible"]

    # Non-deductible expenses (Personal / groceries)
    non_deductible_subtotal = received_analysis["subtotal_pue_non_deductible"]
    non_deductible_vat = received_analysis["vat_16_pue_non_deductible"]
    non_deductible_total = received_analysis["total_pue_non_deductible"]

    # 3. Cumulative ISR Calculation (LISR Art. 106)
    cum_income = round(previous_income + current_income, 2)
    cum_deductions = round(previous_deductions + current_authorized_deductions, 2)
    cum_taxable_base = max(0.0, round(cum_income - cum_deductions, 2))

    isr_bracket_info = calculate_cumulative_isr_art106(cum_taxable_base, month=month)
    determined_isr = isr_bracket_info["determined_tax"]

    cum_withheld_isr = round(previous_withheld_isr + current_withheld_isr, 2)
    total_isr_credits = round(cum_withheld_isr + previous_provisional_payments, 2)

    net_isr_balance = round(determined_isr - total_isr_credits, 2)
    isr_to_pay = max(0.0, net_isr_balance)

    # 4. Monthly VAT Calculation
    # Net VAT of the month = Output VAT (Causado) - Creditable VAT (Acreditable) - Withheld VAT (Retenido)
    net_monthly_vat = round(output_vat - creditable_vat - current_withheld_vat, 2)
    monthly_vat_to_pay = max(0.0, net_monthly_vat)
    monthly_vat_favorable_balance = max(0.0, -net_monthly_vat)

    # VAT Favorable Balance Tracking
    total_accumulated_vat_favorable = round(previous_vat_favorable_balance + monthly_vat_favorable_balance, 2)

    return {
        # Month & Parameters
        "month": month,
        # Monthly Figures
        "current_income": current_income,
        "output_vat": output_vat,
        "current_withheld_isr": current_withheld_isr,
        "current_withheld_vat": current_withheld_vat,
        "total_invoiced_pue": total_invoiced_pue,
        "current_authorized_deductions": current_authorized_deductions,
        "creditable_vat": creditable_vat,
        "total_deductible_disbursed": total_deductible_disbursed,
        "non_deductible_subtotal": non_deductible_subtotal,
        "non_deductible_vat": non_deductible_vat,
        "non_deductible_total": non_deductible_total,
        # Cumulative ISR Art. 106
        "previous_income": previous_income,
        "previous_deductions": previous_deductions,
        "cum_income": cum_income,
        "cum_deductions": cum_deductions,
        "cum_taxable_base": cum_taxable_base,
        "isr_bracket_info": isr_bracket_info,
        "determined_isr": determined_isr,
        "previous_withheld_isr": previous_withheld_isr,
        "cum_withheld_isr": cum_withheld_isr,
        "previous_provisional_payments": previous_provisional_payments,
        "total_isr_credits": total_isr_credits,
        "net_isr_balance": net_isr_balance,
        "isr_to_pay": isr_to_pay,
        # VAT Determination
        "net_monthly_vat": net_monthly_vat,
        "monthly_vat_to_pay": monthly_vat_to_pay,
        "monthly_vat_favorable_balance": monthly_vat_favorable_balance,
        "previous_vat_favorable_balance": previous_vat_favorable_balance,
        "total_accumulated_vat_favorable": total_accumulated_vat_favorable,
    }
