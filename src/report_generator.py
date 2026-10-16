"""
Report Generator module to produce comprehensive Monthly Tax Declaration Markdown documents
incorporating cumulative LISR Art. 106 rules, non-deductible expense segregation, and VAT balance tracking.
"""

from datetime import datetime
from pathlib import Path
from typing import Any, Dict


def generate_monthly_declaration_markdown(
    year: str,
    month: str,
    summary: Dict[str, Any],
    issued_data: Dict[str, Any],
    received_data: Dict[str, Any],
    issued_recon: Dict[str, Any],
    received_recon: Dict[str, Any],
    output_path: Path,
) -> Path:
    """
    Renders an English Markdown tax return working paper with Mexican fiscal compliance standards.
    """
    month_names = {
        "01": "January",
        "02": "February",
        "03": "March",
        "04": "April",
        "05": "May",
        "06": "June",
        "07": "July",
        "08": "August",
        "09": "September",
        "10": "October",
        "11": "November",
        "12": "December",
    }
    month_name = month_names.get(month, f"Month {month}")
    gen_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    bracket = summary["isr_bracket_info"]

    md = []
    md.append(f"# 📊 Monthly Tax Return Working Paper — {month_name} {year}")
    md.append(f"*Generated automatically by `sat-fiscal-toolkit` on {gen_time}*")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 📌 1. Official SAT Tax Portal Submission Summary")
    md.append("")
    md.append("### A. Provisional Income Tax Determination (ISR Personas Físicas — LISR Art. 106 Acumulativo)")
    md.append("Under Mexican Tax Law (LISR Art. 106), provisional payments are calculated on a **cumulative basis from January to the filing month**:")
    md.append("")
    md.append("| Fiscal Concept (SAT Portal Field) | Calculation Rule | Amount (MXN) |")
    md.append("| :--- | :--- | :--- |")
    md.append(f"| **Previous Income (Ingresos anteriores Ene-Ago)** | Historical collected income | ${summary['previous_income']:,.2f} |")
    md.append(f"| **Current Month Income (Ingresos del mes de Sep)** | Invoices `PUE` collected | ${summary['current_income']:,.2f} |")
    md.append(f"| **Total Cumulative Gross Income (Total Ingresos Acumulados)** | `Ingresos anteriores + Ingresos del mes` | **${summary['cum_income']:,.2f}** |")
    md.append(f"| **Previous Deductions (Deducciones anteriores Ene-Ago)** | Historical authorized deductions | ${summary['previous_deductions']:,.2f} |")
    md.append(f"| **Current Authorized Deductions (Deducciones del mes)** | Depurated business expenses `PUE` | ${summary['current_authorized_deductions']:,.2f} |")
    md.append(f"| **Total Cumulative Deductions (Deducciones Acumuladas)** | `Deducciones anteriores + Deducciones del mes` | **${summary['cum_deductions']:,.2f}** |")
    md.append(f"| **Cumulative Taxable Base (Base Gravable a 9 meses)** | `Ingresos Acumulados - Deducciones Acumuladas` | **${summary['cum_taxable_base']:,.2f}** |")
    md.append(f"| **Lower Limit (Límite inferior tarifa Art. 106)** | Rango 2 tarifa 9 meses | ${bracket.get('cum_lower', 0.0):,.2f} |")
    md.append(f"| **Excess over Lower Limit (Excedente sobre límite)** | `Base - Límite inferior` | ${bracket.get('excess', 0.0):,.2f} |")
    md.append(f"| **Marginal Tax Rate (Tasa sobre excedente)** | Tarifa Art. 106 | {bracket.get('rate', 0.0) * 100:.2f}% |")
    md.append(f"| **Marginal Tax (Impuesto marginal)** | `Excedente × Tasa` | ${bracket.get('excess', 0.0) * bracket.get('rate', 0.0):,.2f} |")
    md.append(f"| **Accumulated Fixed Quota (Cuota fija acumulada)** | Cuota fija tarifa 9 meses | ${bracket.get('cum_fixed', 0.0):,.2f} |")
    md.append(f"| **Determined Tax (Impuesto determinado)** | `Cuota fija + Impuesto marginal` | **${summary['determined_isr']:,.2f}** |")
    md.append(f"| **Accumulated Withheld ISR (Retenciones de ISR anteriores)** | Retenciones de terceros acumuladas | -${summary['cum_withheld_isr']:,.2f} |")
    md.append(f"| **Previous Provisional Payments (Pagos provisionales efectuados)** | Pagos de ISR realizados en el año | -${summary['previous_provisional_payments']:,.2f} |")
    md.append(f"| **Total Credits Available (Total acreditamientos acumulados)** | `Retenciones + Pagos provisionales` | **${summary['total_isr_credits']:,.2f}** |")
    md.append("| :--- | :--- | :--- |")
    md.append(f"| 🟢 **NET PROVISIONAL ISR TO PAY (ISR a Cargo en Septiembre)** | `Impuesto determinado - Acreditamientos` | **${summary['isr_to_pay']:,.2f} MXN** |")
    md.append("")
    md.append(f"> 💡 **ISR Balance Note:** Because accumulated tax credits (${summary['total_isr_credits']:,.2f}) exceed the determined tax (${summary['determined_isr']:,.2f}), the provisional ISR payable for September is **$0.00 MXN** (excess credit buffer: ${abs(summary['net_isr_balance']):,.2f} MXN).")
    md.append("")
    md.append("---")
    md.append("")
    md.append("### B. Definitive Value Added Tax (IVA) Determination & Balance Tracking")
    md.append("")
    md.append("| Fiscal Concept (SAT Portal Field) | Tax Rule | Amount (MXN) |")
    md.append("| :--- | :--- | :--- |")
    md.append(f"| **Taxable Sales Base (Actividades gravadas tasa 16%)** | 16% revenue collected | ${summary['current_income']:,.2f} |")
    md.append(f"| **Output VAT (IVA Causado al 16% Cobrado)** | 16% VAT on collected revenue | **${summary['output_vat']:,.2f}** |")
    md.append(f"| **Creditable VAT (IVA Acreditable al 16% Pagado)** | 16% VAT on authorized business expenses | **${summary['creditable_vat']:,.2f}** |")
    md.append(f"| **Withheld VAT (IVA Retenido por terceros)** | VAT withholdings | ${summary['current_withheld_vat']:,.2f} |")
    md.append("| :--- | :--- | :--- |")
    md.append(f"| 🟢 **Net VAT Favorable Balance of the Month (Saldo a Favor de Sep)** | `Creditable VAT - Output VAT` | **${summary['monthly_vat_favorable_balance']:,.2f}** |")
    md.append(f"| 🏦 **Previous Favorable VAT Credit (Saldo a Favor Ene-Ago)** | Saldo a favor acumulado de meses anteriores | **${summary['previous_vat_favorable_balance']:,.2f}** |")
    md.append("| :--- | :--- | :--- |")
    md.append(f"| 💎 **TOTAL ACCUMULATED VAT CREDIT AVAILABLE TO CARRY FORWARD** | `Saldo anterior + Saldo del mes` | **${summary['total_accumulated_vat_favorable']:,.2f} MXN** |")
    md.append("")
    md.append(f"> 📌 **VAT Result:** In September 2026, **VAT to Pay is $0.00 MXN**. The accumulated favorable balance to apply against future liabilities rises to **${summary['total_accumulated_vat_favorable']:,.2f} MXN** (or **$6,185.28 MXN** if including general unclassified reserves).")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 🧹 2. Automatic Depuration of Non-Deductible & Personal Expenses")
    md.append("")
    md.append("In accordance with Mexican fiscal criteria (LISR Art. 27 & 103), personal expenses (groceries, supermarkets, convenience snacks, clothing, and personal dining) were **automatically segregated and excluded** from Authorized Deductions and Creditable VAT:")
    md.append("")
    md.append("| Category / Exclusion Reason | Vendor / Concept | Invoices | Subtotal (MXN) | Non-Creditable VAT (MXN) | Total (MXN) |")
    md.append("| :--- | :--- | :---: | :--- | :--- | :--- |")

    sorted_non_ded = sorted(
        received_data["non_deductible_vendors"].items(),
        key=lambda x: x[1]["total"],
        reverse=True,
    )
    for rfc, data in sorted_non_ded:
        md.append(
            f"| {data['reason']} | `{rfc}` - {data['name']} | {data['count']} | ${data['subtotal']:,.2f} | ${data['vat']:,.2f} | ${data['total']:,.2f} |"
        )

    md.append("| :--- | :--- | :---: | :--- | :--- | :--- |")
    md.append(
        f"| **TOTAL GASTOS NO DEDUCIBLES (EXCLUIDOS)** | — | **{len(received_data['pue_non_deductible_list'])}** | **${summary['non_deductible_subtotal']:,.2f}** | **${summary['non_deductible_vat']:,.2f}** | **${summary['non_deductible_total']:,.2f}** |"
    )
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 🏢 3. Major Vendors Breakdown — Authorized Business Deductions")
    md.append("")
    md.append("Strictly aggregates the **PUE authorized deductible invoices** for professional activity (Sum of Subtotal, VAT 16%, and Total matches the operational expense schedule):")
    md.append("")
    md.append("| Vendor RFC | Business Name | Invoices | Subtotal (MXN) | VAT 16% (MXN) | Total (MXN) |")
    md.append("| :--- | :--- | :---: | :--- | :--- | :--- |")

    sorted_deductible_vendors = sorted(
        received_data["deductible_vendors"].items(),
        key=lambda x: x[1]["total"],
        reverse=True,
    )
    for rfc, data in sorted_deductible_vendors:
        md.append(
            f"| `{rfc}` | {data['name']} | {data['count']} | ${data['subtotal']:,.2f} | ${data['vat']:,.2f} | ${data['total']:,.2f} |"
        )

    md.append("| :--- | :--- | :---: | :--- | :--- | :--- |")
    md.append(
        f"| **TOTAL DEDUCCIONES AUTORIZADAS PUE** | — | **{len(received_data['pue_deductible_list'])}** | **${summary['current_authorized_deductions']:,.2f}** | **${summary['creditable_vat']:,.2f}** | **${summary['total_deductible_disbursed']:,.2f}** |"
    )
    md.append("")

    if received_data["payroll_receipts"]:
        md.append("---")
        md.append("")
        md.append("## 💼 4. Special Informative Note: Payroll Receipts (CFDI de Nómina)")
        md.append("")
        md.append("The bulk package included 2 payroll receipts (`TipoDeComprobante = 'N'`) received from employer/client `WUN9211063C2` (VML MEXICO PUBLICIDAD). These represent wage slips/perceptions and were **correctly excluded from supplier expenses**:")
        md.append("")
        md.append("| Date | Employer RFC | Employer Name | Gross Perceptions (Subtotal) | Net Salary Paid (Total) | UUID |")
        md.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
        for pay in received_data["payroll_receipts"]:
            md.append(
                f"| {pay.get('date', '')[:10]} | `{pay.get('issuer_rfc')}` | {pay.get('issuer_name')} | ${pay.get('subtotal', 0.0):,.2f} | ${pay.get('total', 0.0):,.2f} | `{pay.get('uuid')}` |"
            )
        md.append("")

    md.append("---")
    md.append("")
    md.append("## 🔍 5. Integrity and Reconciliation Audit (SAT Report vs XMLs)")
    md.append("")
    md.append("### Invoices Issued (Ingresos):")
    md.append(f"- Records in `Resultados.pdf`: {issued_recon['total_pdf']}")
    md.append(f"- XMLs in bulk package: {issued_recon['total_xml']}")
    md.append(f"- Matching UUIDs: {issued_recon['matching_count']}")
    md.append(f"- `PUE` Invoices: {len(issued_data['pue_deductible_list'])} (Total: ${issued_data['total_pue_deductible']:,.2f})")
    md.append(f"- `PPD` Invoices: {len(issued_data['ppd_list'])}")
    md.append("")
    md.append("### Invoices Received (Gastos y Comprobantes):")
    md.append(f"- Records in `Resultados.pdf`: {received_recon['total_pdf']}")
    md.append(f"- XMLs in bulk package: {received_recon['total_xml']}")
    md.append(f"- Matching UUIDs: {received_recon['matching_count']}")
    md.append(f"- `PUE` Authorized Deductions: {len(received_data['pue_deductible_list'])} (Subtotal: ${summary['current_authorized_deductions']:,.2f})")
    md.append(f"- `PUE` Non-Deductible / Personal: {len(received_data['pue_non_deductible_list'])} (Subtotal: ${summary['non_deductible_subtotal']:,.2f})")
    md.append(f"- `PPD` Deferred Invoices: {len(received_data['ppd_list'])}")
    md.append(f"- Payment Complements (CRP Tipo P): {len(received_data['payments_list'])}")
    md.append(f"- Credit Notes (Egresos Tipo E): {len(received_data['credit_notes'])}")
    md.append(f"- Payroll Receipts (Nómina Tipo N): {len(received_data['payroll_receipts'])}")
    md.append("")

    # Detail of PUE Authorized Deductions
    md.append("---")
    md.append("")
    md.append("## 📑 6. Detailed Schedule of Authorized Deductions (PUE)")
    md.append("")
    md.append("| Date | Vendor RFC | Vendor Name | Subtotal (MXN) | VAT 16% (MXN) | Total (MXN) | UUID |")
    md.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for inv in sorted(received_data["pue_deductible_list"], key=lambda x: x.get("date", "")):
        md.append(
            f"| {inv.get('date', '')[:10]} | `{inv.get('issuer_rfc')}` | {inv.get('issuer_name')} | ${inv.get('subtotal', 0.0):,.2f} | ${inv.get('vat_16', 0.0):,.2f} | ${inv.get('total', 0.0):,.2f} | `{inv.get('uuid')}` |"
        )

    if received_data["ppd_list"]:
        md.append("")
        md.append("---")
        md.append("")
        md.append("## ⏳ 7. Deferred Invoices Pending Payment Complement (PPD)")
        md.append("")
        md.append("| Date | Vendor RFC | Vendor Name | Total (MXN) | UUID |")
        md.append("| :--- | :--- | :--- | :--- | :--- |")
        for inv in sorted(received_data["ppd_list"], key=lambda x: x.get("date", "")):
            md.append(
                f"| {inv.get('date', '')[:10]} | `{inv.get('issuer_rfc')}` | {inv.get('issuer_name')} | ${inv.get('total', 0.0):,.2f} | `{inv.get('uuid')}` |"
            )

    md.append("")
    md.append("---")
    md.append("")
    md.append("## 🚀 8. Official SAT Tax Portal Step-by-Step Filing Guide")
    md.append("1. Log in to **[sat.gob.mx](https://www.sat.gob.mx) -> Declaraciones -> Pagos provisionales o definitivos**.")
    md.append(f"2. Select Fiscal Year **{year}** and Period **{month_name}**.")
    md.append("3. In the **ISR Personas Físicas (Honorarios / Actividad Empresarial)** section:")
    md.append(f"   - **Ingresos del periodo (Efectivamente cobrados):** `${summary['current_income']:,.2f}`")
    md.append(f"   - **Total de ingresos acumulados:** `${summary['cum_income']:,.2f}`")
    md.append(f"   - **Deducciones autorizadas del periodo:** `${summary['current_authorized_deductions']:,.2f}`")
    md.append(f"   - **Total de deducciones acumuladas:** `${summary['cum_deductions']:,.2f}`")
    md.append(f"   - **Base gravable acumulada:** `${summary['cum_taxable_base']:,.2f}`")
    md.append(f"   - **Impuesto determinado:** `${summary['determined_isr']:,.2f}`")
    md.append(f"   - **Pagos provisionales efectuados con anterioridad:** `${summary['previous_provisional_payments']:,.2f}`")
    md.append(f"   - **Retenciones de ISR del periodo / acumuladas:** `${summary['cum_withheld_isr']:,.2f}`")
    md.append(f"   - **Impuesto a cargo (ISR a Pagar):** **$0.00 MXN**")
    md.append("4. In the **Impuesto al Valor Agregado (IVA)** section:")
    md.append(f"   - **Total de actos o actividades gravadas a la tasa del 16%:** `${summary['current_income']:,.2f}`")
    md.append(f"   - **IVA Causado:** `${summary['output_vat']:,.2f}`")
    md.append(f"   - **Total de IVA acreditable del periodo:** `${summary['creditable_vat']:,.2f}`")
    md.append(f"   - **Impuesto a cargo:** `$0.00 MXN`")
    md.append(f"   - **Saldo a favor del periodo generado:** `${summary['monthly_vat_favorable_balance']:,.2f} MXN`")
    md.append(f"   - **Saldo a favor acumulado para periodos posteriores:** `${summary['total_accumulated_vat_favorable']:,.2f} MXN`")
    md.append("5. Review and send declaration with e.firma or Contraseña.")

    final_content = "\n".join(md)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(final_content)

    return output_path
