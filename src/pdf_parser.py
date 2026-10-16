"""
PDF Parser module to extract structured metadata from official SAT 'Resultados.pdf' summary reports.
"""

from pathlib import Path
import re
import shutil
import subprocess
from typing import Any, Dict, List


def extract_text_from_pdf(pdf_path: Path) -> str:
    """
    Extracts plain text from a PDF file using pdftotext (Poppler) or pypdf fallback.
    """
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    # Method 1: pdftotext (Poppler utility)
    if shutil.which("pdftotext"):
        result = subprocess.run(
            ["pdftotext", "-layout", str(pdf_path), "-"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout

    # Method 2: pypdf fallback
    try:
        import pypdf

        reader = pypdf.PdfReader(str(pdf_path))
        pages_text = [p.extract_text() for p in reader.pages if p.extract_text()]
        return "\n".join(pages_text)
    except ImportError:
        pass

    raise RuntimeError(
        "Could not extract text from PDF. Please install 'poppler-utils' (pdftotext) or 'pypdf'."
    )


def parse_sat_summary_pdf(pdf_path: Path) -> List[Dict[str, Any]]:
    """
    Parses SAT 'Resultados.pdf' report and returns structured list of invoice metadata.
    """
    raw_text = extract_text_from_pdf(pdf_path)
    blocks = re.split(r"Folio Fiscal:\s*", raw_text)

    invoices: List[Dict[str, Any]] = []

    for block in blocks[1:]:
        lines = block.strip().split("\n")
        uuid = lines[0].strip().upper()

        # Regex matchers
        m_rfc_issuer = re.search(r"RFC Emisor:\s*([A-Z0-9&Ñ]+)", block)
        m_name_issuer = re.search(r"Nombre o Razón Social:\s*([^\n\r]+)", block)
        m_rfc_receiver = re.search(r"RFC Receptor:\s*([A-Z0-9&Ñ]+)", block)
        m_total = re.search(r"Total:\s*\$([0-9,.]+)", block)
        m_date_issued = re.search(r"Fecha Emisión:\s*(\S+)", block)
        m_date_cert = re.search(r"Fecha Certificación:\s*(\S+)", block)
        m_status = re.search(r"Estado del Comprobante:\s*(\w+)", block)
        m_effect = re.search(r"Efecto del Comprobante:\s*(\w+)", block)

        total_val = 0.0
        if m_total:
            total_val = float(m_total.group(1).replace(",", ""))

        invoices.append(
            {
                "uuid": uuid,
                "rfc_issuer": m_rfc_issuer.group(1) if m_rfc_issuer else "",
                "name_issuer": m_name_issuer.group(1).strip() if m_name_issuer else "",
                "rfc_receiver": m_rfc_receiver.group(1) if m_rfc_receiver else "",
                "total": total_val,
                "date_issued": m_date_issued.group(1) if m_date_issued else "",
                "date_certified": m_date_cert.group(1) if m_date_cert else "",
                "status": m_status.group(1) if m_status else "Vigente",
                "effect": m_effect.group(1) if m_effect else "Ingreso",
            }
        )

    return invoices
