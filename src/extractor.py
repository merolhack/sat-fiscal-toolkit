"""
Extractor module for decompressing bulk CFDI ZIP packages downloaded from SAT.
"""

from pathlib import Path
from typing import List
import zipfile


def extract_cfdi_zip(zip_path: Path, output_xml_dir: Path) -> List[Path]:
    """
    Extracts all XML files from a given ZIP archive into the destination directory.
    Returns the list of extracted XML file paths.
    """
    output_xml_dir.mkdir(parents=True, exist_ok=True)
    extracted_files: List[Path] = []

    if not zip_path.exists():
        raise FileNotFoundError(f"ZIP package not found: {zip_path}")

    with zipfile.ZipFile(zip_path, "r") as archive:
        for filename in archive.namelist():
            if filename.lower().endswith(".xml"):
                archive.extract(filename, output_xml_dir)
                extracted_files.append(output_xml_dir / filename)

    return extracted_files


def extract_all_zips_in_dir(zips_dir: Path, output_xml_dir: Path) -> List[Path]:
    """
    Finds all .zip archives in zips_dir and extracts all XMLs into output_xml_dir.
    """
    if not zips_dir.exists():
        return []

    all_xmls: List[Path] = []
    zip_files = list(zips_dir.glob("*.zip")) + list(zips_dir.glob("*.ZIP"))

    for z_path in zip_files:
        xmls = extract_cfdi_zip(z_path, output_xml_dir)
        all_xmls.extend(xmls)

    return all_xmls
