"""
Report Generator module to produce comprehensive Monthly Tax Declaration Markdown documents.
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

    md = []
    md.append(f"# 📊 Monthly Tax Return Working Paper — {month_name} {year}")
    md.append(f"*Generated automatically by `sat-fiscal-toolkit` on {gen_time}*")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 📌 1. Executive Summary for Official SAT Tax Portal Submission")
    md.append("")
    md.append("Figures determined under the Mexican statutory **cash-flow criterion (flujo de efectivo)** for provisional ISR payments and definitive VAT returns:")
    md.append("")
    md.append("| Fiscal Concept (SAT Portal Field) | Tax Rule | Amount (MXN) |")
    md.append("| :--- | :--- | :--- |")
    md.append(f"| **Collected Gross Income (Ingresos Efectivamente Cobrados)** | Invoices `PUE` issued | **${summary['collected_income']:,.2f}** |")
    md.append(f"| **Authorized Deductions (Deducciones Autorizadas Erogadas)** | Invoices `PUE` received | **${summary['authorized_deductions']:,.2f}** |")
    md.append(f"| **Net Provisional ISR Taxable Base (Base Gravable)** | `Income - Deductions` | **${summary['net_taxable_base']:,.2f}** |")
    if summary["fiscal_loss"] > 0:
        md.append(f"| **Monthly Tax Loss (Pérdida Fiscal del Mes)** | Deductions exceed Income | **${summary['fiscal_loss']:,.2f}** |")
    md.append(f"| **Output VAT (IVA Causado al 16% Cobrado)** | 16% VAT on collected sales | **${summary['output_vat']:,.2f}** |")
    md.append(f"| **Creditable VAT (IVA Acreditable al 16% Pagado)** | 16% VAT on authorized expenses | **${summary['creditable_vat']:,.2f}** |")
    md.append(f"| **Third-Party Withheld VAT (IVA Retenido por Personas Morales)** | Withholding credits | **${summary['issued_ret_vat']:,.2f}** |")
    md.append(f"| **Third-Party Withheld ISR (ISR Retenido por Personas Morales)** | Withholding credits | **${summary['issued_ret_isr']:,.2f}** |")
    md.append("| :--- | :--- | :--- |")

    if summary["vat_to_pay"] > 0:
        md.append(f"| 🚨 **NET VAT TO PAY (IVA a Cargo)** | `Output VAT - Creditable VAT` | **${summary['vat_to_pay']:,.2f}** |")
    else:
        md.append(f"| 🟢 **NET VAT FAVORABLE CREDIT (Saldo a Favor de IVA)** | `Creditable VAT - Output VAT` | **${summary['vat_favorable_balance']:,.2f}** |")

    md.append("")
    md.append("> 💡 **Statutory Cash-Flow Reminder:** Deferred invoices (`PPD`) are excluded from this month's calculations unless accompanied by an official Payment Receipt Complement (CRP) paid within this specific period.")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 🔍 2. Integrity and Reconciliation Audit (SAT Report vs XMLs)")
    md.append("")
    md.append("### Invoices Issued (Ingresos):")
    md.append(f"- Records in `Resultados.pdf`: {issued_recon['total_pdf']}")
    md.append(f"- XMLs in bulk package: {issued_recon['total_xml']}")
    md.append(f"- Matching UUIDs: {issued_recon['matching_count']}")
    md.append(f"- `PUE` Invoices: {len(issued_data['pue_list'])} (Total: ${issued_data['total_pue']:,.2f})")
    md.append(f"- `PPD` Invoices: {len(issued_data['ppd_list'])}")
    md.append("")
    md.append("### Invoices Received (Gastos y Deducciones):")
    md.append(f"- Records in `Resultados.pdf`: {received_recon['total_pdf']}")
    md.append(f"- XMLs in bulk package: {received_recon['total_xml']}")
    md.append(f"- Matching UUIDs: {received_recon['matching_count']}")
    md.append(f"- `PUE` Invoices: {len(received_data['pue_list'])} (Subtotal: ${received_data['subtotal_pue']:,.2f})")
    md.append(f"- `PPD` Invoices: {len(received_data['ppd_list'])}")
    md.append(f"- Payment Complements (CRP Tipo P): {len(received_data['payments_list'])}")
    md.append(f"- Credit Notes (Egresos Tipo E): {len(received_data['credit_notes'])}")
    md.append("")

    # Section 3: Issued invoices detail
    md.append("---")
    md.append("")
    md.append("## 📈 3. Issued Invoices Detail (Ingresos Facturados)")
    md.append("")
    md.append("| Date | Receiver RFC | Receiver Name | Subtotal (MXN) | VAT 16% (MXN) | Total (MXN) | UUID |")
    md.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for inv in issued_data["pue_list"]:
        md.append(
            f"| {inv.get('date', '')[:10]} | `{inv.get('receiver_rfc')}` | {inv.get('receiver_name')} | ${inv.get('subtotal', 0.0):,.2f} | ${inv.get('vat_16', 0.0):,.2f} | ${inv.get('total', 0.0):,.2f} | `{inv.get('uuid')}` |"
        )
    md.append("")

    # Section 4: Received breakdown by counterparty
    md.append("---")
    md.append("")
    md.append("## 🏢 4. Major Vendors Breakdown (Deducciones por Proveedor)")
    md.append("")
    md.append("| Vendor RFC | Business Name | Invoices | Subtotal (MXN) | VAT 16% (MXN) | Total (MXN) |")
    md.append("| :--- | :--- | :---: | :--- | :--- | :--- |")

    sorted_vendors = sorted(
        received_data["counterparties"].items(),
        key=lambda x: x[1]["total"],
        reverse=True,
    )
    for rfc, data in sorted_vendors:
        md.append(
            f"| `{rfc}` | {data['name']} | {data['count']} | ${data['subtotal']:,.2f} | ${data['vat']:,.2f} | ${data['total']:,.2f} |"
        )

    md.append("")
    md.append("---")
    md.append("")
    md.append("## 📑 5. Detailed Schedule of PUE Expenses (Authorized Deductions)")
    md.append("")
    md.append("| Date | Vendor RFC | Vendor Name | Subtotal (MXN) | VAT 16% (MXN) | Total (MXN) | UUID |")
    md.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for inv in sorted(received_data["pue_list"], key=lambda x: x.get("date", "")):
        md.append(
            f"| {inv.get('date', '')[:10]} | `{inv.get('issuer_rfc')}` | {inv.get('issuer_name')} | ${inv.get('subtotal', 0.0):,.2f} | ${inv.get('vat_16', 0.0):,.2f} | ${inv.get('total', 0.0):,.2f} | `{inv.get('uuid')}` |"
        )

    if received_data["ppd_list"]:
        md.append("")
        md.append("---")
        md.append("")
        md.append("## ⏳ 6. Deferred Invoices Pending Payment Complement (PPD)")
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
    md.append("## 🚀 7. Step-by-Step Filing Instructions for the SAT Official Portal")
    md.append("1. Log in to **[sat.gob.mx](https://www.sat.gob.mx) -> Declaraciones -> Pagos provisionales o definitivos**.")
    md.append(f"2. Select Fiscal Year **{year}** and Period **{month_name}**.")
    md.append("3. Under **ISR Personas Físicas (Income Tax)**:")
    md.append(f"   - Total Income Collected (Ingresos efectivamente cobrados): **${summary['collected_income']:,.2f}**")
    md.append(f"   - Authorized Deductions (Deducciones autorizadas): **${summary['authorized_deductions']:,.2f}**")
    md.append(f"   - Net Taxable Base: **${summary['net_taxable_base']:,.2f}** (Provisional ISR Payable: **$0.00**)")
    md.append("4. Under **IVA (Value Added Tax)**:")
    md.append(f"   - Actividades gravadas a la tasa del 16%: **${summary['collected_income']:,.2f}**")
    md.append(f"   - IVA Causado al 16%: **${summary['output_vat']:,.2f}**")
    md.append(f"   - IVA Acreditable pagado: **${summary['creditable_vat']:,.2f}**")
    md.append(f"   - **Favorable VAT Balance to Declare (Saldo a Favor):** **${summary['vat_favorable_balance']:,.2f}**")
    md.append("5. Review, authenticate with your e.firma or Contraseña, and download the official acknowledgment receipt (Acuse de recibo).")

    final_content = "\n".join(md)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(final_content)

    return output_path
