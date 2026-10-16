#!/usr/bin/env python3
"""
CLI script to process monthly CFDI invoices, decompress ZIP archives,
parse XMLs and official SAT 'Resultados.pdf' summaries,
and generate the monthly tax declaration working paper.
"""

import argparse
from pathlib import Path
import shutil
import sys

# Add project root to sys.path
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.extractor import extract_all_zips_in_dir
from src.pdf_parser import parse_sat_summary_pdf
from src.cfdi_parser import parse_xml_folder
from src.tax_calculator import (
    reconcile_dataset,
    analyze_invoices_by_flow,
    compute_monthly_tax_summary,
)
from src.report_generator import generate_monthly_declaration_markdown


def process_dataset(
    dataset_name: str,
    data_dir: Path,
) -> tuple:
    """
    Processes either issued or received invoices: extracts ZIPs, parses XMLs and summary PDF.
    """
    zips_dir = data_dir / "zips"
    summary_dir = data_dir / "summary"
    xml_dir = data_dir / "xml"

    print(f"📦 Extracting {dataset_name} ZIP archives...")
    extracted_xmls = extract_all_zips_in_dir(zips_dir, xml_dir)
    print(f"   XMLs extracted: {len(extracted_xmls)}")

    print(f"📑 Parsing {dataset_name} XML files...")
    xml_invoices = parse_xml_folder(xml_dir)
    print(f"   Total {dataset_name} XMLs parsed: {len(xml_invoices)}")

    print(f"📄 Reading {dataset_name} Resultados.pdf...")
    pdf_files = list(summary_dir.glob("*.pdf")) + list(summary_dir.glob("*.PDF"))
    pdf_invoices = []
    if pdf_files:
        pdf_path = pdf_files[0]
        pdf_invoices = parse_sat_summary_pdf(pdf_path)
        print(f"   Invoices found in {pdf_path.name}: {len(pdf_invoices)}")
    else:
        print(f"   ⚠️ No PDF found in {summary_dir}. Proceeding with XMLs only.")

    recon = reconcile_dataset(pdf_invoices, xml_invoices)
    analysis = analyze_invoices_by_flow(xml_invoices, recon["pdf_map"])

    return recon, analysis


def process_month(year: str, month: str, root: Path = project_root) -> Path:
    """
    Executes the full accounting pipeline for the specified fiscal period.
    """
    month_str = f"{int(month):02d}"
    print(f"\n🚀 Running fiscal pipeline for period: {year}-{month_str}...")

    period_dir = root / "data" / year / month_str
    issued_dir = period_dir / "issued"
    received_dir = period_dir / "received"
    output_dir = root / "data" / "outputs" / year / month_str

    if not period_dir.exists():
        raise FileNotFoundError(f"Data directory not found for period: {period_dir}")

    # 1. Process Issued Invoices (Income)
    print("\n--- 1. ISSUED INVOICES (INGRESOS) ---")
    issued_recon, issued_analysis = process_dataset("issued", issued_dir)

    # 2. Process Received Invoices (Expenses)
    print("\n--- 2. RECEIVED INVOICES (GASTOS) ---")
    received_recon, received_analysis = process_dataset("received", received_dir)

    # 3. Calculate Provisional Tax Summary
    print("\n--- 3. DETERMINING MONTHLY TAXES ---")
    tax_summary = compute_monthly_tax_summary(issued_analysis, received_analysis)

    # 4. Generate Output Markdown Files
    output_file_en = output_dir / f"monthly_tax_declaration_{year}_{month_str}.md"
    output_file_es = output_dir / f"declaracion_mensual_{year}_{month_str}.md"

    generate_monthly_declaration_markdown(
        year=year,
        month=month_str,
        summary=tax_summary,
        issued_data=issued_analysis,
        received_data=received_analysis,
        issued_recon=issued_recon,
        received_recon=received_recon,
        output_path=output_file_en,
    )
    shutil.copyfile(output_file_en, output_file_es)

    print("\n✅ MONTHLY PROCESSING COMPLETED SUCCESSFULLY")
    print(f"   - Collected Income (PUE):       ${tax_summary['collected_income']:,.2f} MXN")
    print(f"   - Authorized Deductions (PUE):  ${tax_summary['authorized_deductions']:,.2f} MXN")
    print(f"   - Net Taxable Base (ISR):       ${tax_summary['net_taxable_base']:,.2f} MXN")
    print(f"   - Output VAT (IVA Causado 16%): ${tax_summary['output_vat']:,.2f} MXN")
    print(f"   - Creditable VAT (Acreditable): ${tax_summary['creditable_vat']:,.2f} MXN")
    if tax_summary["vat_to_pay"] > 0:
        print(f"   - Net VAT to Pay:               ${tax_summary['vat_to_pay']:,.2f} MXN")
    else:
        print(f"   - Favorable VAT Balance:        ${tax_summary['vat_favorable_balance']:,.2f} MXN")

    print(f"\n📄 Reports generated:")
    print(f"   1. {output_file_en}")
    print(f"   2. {output_file_es}\n")

    return output_file_en


def main():
    parser = argparse.ArgumentParser(
        description="sat-fiscal-toolkit: Process monthly CFDI invoices for SAT tax return."
    )
    parser.add_argument(
        "--year",
        default="2026",
        help="Fiscal year (default: 2026)",
    )
    parser.add_argument(
        "--month",
        default="09",
        help="Month in 2-digit format (e.g. 09 for September, 10 for October)",
    )
    args = parser.parse_args()

    try:
        process_month(args.year, args.month)
    except Exception as e:
        print(f"❌ Execution error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
