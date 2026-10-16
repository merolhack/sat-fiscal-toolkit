#!/usr/bin/env python3
"""
scripts/procesar_cfdi_mes.py
Script CLI principal para procesar CFDI del mes, aplicar depuración de gastos no deducibles,
calcular la acumulación de ISR según el Art. 106 LISR, rastrear saldos a favor de IVA
y regenerar los papeles de trabajo fiscales.
"""

import argparse
from pathlib import Path
import shutil
import sys

# Agregar la raíz del proyecto al sys.path
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


def process_dataset(dataset_name: str, data_dir: Path) -> tuple:
    """
    Descomprime ZIPs, parsea XMLs y el reporte oficial Resultados.pdf.
    """
    zips_dir = data_dir / "zips"
    summary_dir = data_dir / "summary"
    xml_dir = data_dir / "xml"

    print(f"📦 Descomprimiendo archivos ZIP de {dataset_name}...")
    extracted_xmls = extract_all_zips_in_dir(zips_dir, xml_dir)
    print(f"   XMLs extraídos: {len(extracted_xmls)}")

    print(f"📑 Parseando archivos XML de {dataset_name}...")
    xml_invoices = parse_xml_folder(xml_dir)
    print(f"   Total XMLs parseados: {len(xml_invoices)}")

    print(f"📄 Leyendo reporte oficial Resultados.pdf de {dataset_name}...")
    pdf_files = list(summary_dir.glob("*.pdf")) + list(summary_dir.glob("*.PDF"))
    pdf_invoices = []
    if pdf_files:
        pdf_path = pdf_files[0]
        pdf_invoices = parse_sat_summary_pdf(pdf_path)
        print(f"   Comprobantes en {pdf_path.name}: {len(pdf_invoices)}")
    else:
        print(f"   ⚠️ No se encontró PDF en {summary_dir}. Se procesa solo con XMLs.")

    recon = reconcile_dataset(pdf_invoices, xml_invoices)
    analysis = analyze_invoices_by_flow(xml_invoices, recon["pdf_map"])

    return recon, analysis


def procesar_mes(
    year: str = "2026",
    month: str = "09",
    previous_income: float = 110361.00,
    previous_deductions: float = 88173.00,
    previous_withheld_isr: float = 8623.00,
    previous_provisional_payments: float = 592.00,
    previous_vat_favorable_balance: float = 5326.00,
    root: Path = project_root,
) -> Path:
    """
    Ejecuta el pipeline fiscal integral con acumulación de ISR LISR Art. 106,
    depuración automática de gastos y conciliación por proveedor.
    """
    month_int = int(month)
    month_str = f"{month_int:02d}"
    print(f"\n🚀 Iniciando procesamiento fiscal integral: Periodo {year}-{month_str}...")

    period_dir = root / "data" / year / month_str
    issued_dir = period_dir / "issued"
    received_dir = period_dir / "received"
    output_dir = root / "data" / "outputs" / year / month_str

    if not period_dir.exists():
        raise FileNotFoundError(f"Directorio del periodo no encontrado: {period_dir}")

    # 1. Facturas emitidas (Ingresos)
    print("\n--- 1. FACTURAS EMITIDAS (INGRESOS COBRADOS) ---")
    issued_recon, issued_analysis = process_dataset("issued", issued_dir)

    # 2. Facturas recibidas (Gastos / Deducciones)
    print("\n--- 2. FACTURAS RECIBIDAS (GASTOS Y DEDUCCIONES) ---")
    received_recon, received_analysis = process_dataset("received", received_dir)

    # 3. Determinación de Impuestos Acumulativos
    print("\n--- 3. DETERMINACIÓN FISCAL ACUMULADA (ISR ART. 106 & IVA) ---")
    tax_summary = compute_monthly_tax_summary(
        issued_analysis=issued_analysis,
        received_analysis=received_analysis,
        month=month_int,
        previous_income=previous_income,
        previous_deductions=previous_deductions,
        previous_withheld_isr=previous_withheld_isr,
        previous_provisional_payments=previous_provisional_payments,
        previous_vat_favorable_balance=previous_vat_favorable_balance,
    )

    # 4. Generación de Reportes
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

    print("\n✅ PROCESAMIENTO FISCAL COMPLETADO")
    print(f"   • Ingresos cobrados en el mes (PUE):         ${tax_summary['current_income']:,.2f} MXN")
    print(f"   • Total Ingresos Acumulados (Ene-Sep):       ${tax_summary['cum_income']:,.2f} MXN")
    print(f"   • Deducciones autorizadas depuradas del mes: ${tax_summary['current_authorized_deductions']:,.2f} MXN")
    print(f"   • Gastos Personales / No deducibles (Sep):   ${tax_summary['non_deductible_subtotal']:,.2f} MXN")
    print(f"   • Total Deducciones Acumuladas (Ene-Sep):    ${tax_summary['cum_deductions']:,.2f} MXN")
    print(f"   • Base Gravable Acumulada ISR (9 meses):     ${tax_summary['cum_taxable_base']:,.2f} MXN")
    print(f"   • Impuesto Determinado Art. 106:             ${tax_summary['determined_isr']:,.2f} MXN")
    print(f"   • Total Acreditamientos ISR (Ret + Pagos):   ${tax_summary['total_isr_credits']:,.2f} MXN")
    print(f"   • ISR PROVISIONAL A PAGAR (Septiembre):      ${tax_summary['isr_to_pay']:,.2f} MXN")
    print(f"   • IVA Causado (Cobrado al 16%):              ${tax_summary['output_vat']:,.2f} MXN")
    print(f"   • IVA Acreditable (Gastos autorizados):      ${tax_summary['creditable_vat']:,.2f} MXN")
    print(f"   • Saldo a Favor de IVA generado en el mes:   ${tax_summary['monthly_vat_favorable_balance']:,.2f} MXN")
    print(f"   • Saldo a Favor IVA acumulado anterior:      ${tax_summary['previous_vat_favorable_balance']:,.2f} MXN")
    print(f"   • SALDO A FAVOR TOTAL IVA DISPONIBLE:        ${tax_summary['total_accumulated_vat_favorable']:,.2f} MXN")

    print(f"\n📄 Reportes generados:")
    print(f"   1. {output_file_en}")
    print(f"   2. {output_file_es}\n")

    return output_file_en


HISTORICAL_BALANCES_2026 = {
    # Mes 9 (Septiembre): Acumulados de Ene-Ago
    9: {
        "prev_income": 110361.00,
        "prev_deductions": 88173.00,
        "prev_ret_isr": 8623.00,
        "prev_payments": 592.00,
        "prev_vat_favorable": 5326.00,
    },
    # Mes 10 (Octubre): Acumulados de Ene-Sep (tras presentación oficial con Acuse 262440271315)
    10: {
        "prev_income": 113378.00,
        "prev_deductions": 94781.00,
        "prev_ret_isr": 8623.00,
        "prev_payments": 592.00,
        "prev_vat_favorable": 5900.00,
    },
}


def main():
    parser = argparse.ArgumentParser(
        description="sat-fiscal-toolkit: Procesador integral de CFDI para declaración mensual SAT."
    )
    parser.add_argument("--year", default="2026", help="Ejercicio fiscal (default: 2026)")
    parser.add_argument("--month", default="09", help="Mes de cálculo en dos dígitos (default: 09)")
    parser.add_argument("--prev-income", type=float, default=None, help="Ingresos acumulados anteriores")
    parser.add_argument("--prev-deductions", type=float, default=None, help="Deducciones acumuladas anteriores")
    parser.add_argument("--prev-ret-isr", type=float, default=None, help="Retenciones ISR anteriores")
    parser.add_argument("--prev-payments", type=float, default=None, help="Pagos provisionales anteriores")
    parser.add_argument("--prev-vat-favorable", type=float, default=None, help="Saldo a favor IVA anterior")
    args = parser.parse_args()

    m_int = int(args.month)
    defaults = HISTORICAL_BALANCES_2026.get(
        m_int,
        {
            "prev_income": 0.0,
            "prev_deductions": 0.0,
            "prev_ret_isr": 0.0,
            "prev_payments": 0.0,
            "prev_vat_favorable": 0.0,
        },
    )

    prev_income = args.prev_income if args.prev_income is not None else defaults["prev_income"]
    prev_deductions = args.prev_deductions if args.prev_deductions is not None else defaults["prev_deductions"]
    prev_ret_isr = args.prev_ret_isr if args.prev_ret_isr is not None else defaults["prev_ret_isr"]
    prev_payments = args.prev_payments if args.prev_payments is not None else defaults["prev_payments"]
    prev_vat_favorable = args.prev_vat_favorable if args.prev_vat_favorable is not None else defaults["prev_vat_favorable"]

    try:
        procesar_mes(
            year=args.year,
            month=args.month,
            previous_income=prev_income,
            previous_deductions=prev_deductions,
            previous_withheld_isr=prev_ret_isr,
            previous_provisional_payments=prev_payments,
            previous_vat_favorable_balance=prev_vat_favorable,
        )
    except Exception as e:
        print(f"❌ Error durante el procesamiento: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
