"""
Corpus Loader & Synthetic Document Utilities (Feature F20).
"""

from pathlib import Path
from typing import Dict, List
import fpdf

CORPUS_DIR = Path(__file__).parent

PANEL_FILES = {
    "CBC": "cbc_panel.txt",
    "LIPID": "lipid_panel.txt",
    "METABOLIC": "metabolic_renal_panel.txt",
    "HBA1C": "hba1c_glucose_panel.txt",
    "THYROID": "thyroid_vitals_panel.txt",
}


def load_panel_text(panel_key: str) -> str:
    """Loads raw report text for a given panel key."""
    key = panel_key.upper()
    if key not in PANEL_FILES:
        raise ValueError(f"Unknown panel key: {panel_key}. Available: {list(PANEL_FILES.keys())}")
    file_path = CORPUS_DIR / PANEL_FILES[key]
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def list_all_panels() -> Dict[str, str]:
    """Returns mapping of panel names to their report text."""
    return {k: load_panel_text(k) for k in PANEL_FILES}


def generate_panel_pdf(panel_key: str) -> bytes:
    """
    Generates a synthetic PDF document from a corpus report text
    using fpdf2 standard primitives.
    """
    text = load_panel_text(panel_key)
    pdf = fpdf.FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=9)
    for line in text.splitlines():
        # Encode safe latin-1
        safe_line = line.encode("latin-1", errors="replace").decode("latin-1")
        pdf.cell(w=0, h=4.5, text=safe_line, new_x=fpdf.enums.XPos.LMARGIN, new_y=fpdf.enums.YPos.NEXT)
    return bytes(pdf.output())
