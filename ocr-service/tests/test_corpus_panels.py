"""
Test suite for Synthetic 5-Panel Medical Report Corpus (Feature F20).
Validates all corpus fixtures, synthetic PDF generation, and legacy e2e fixtures.
"""

from pathlib import Path
from app.core.extractor import ClinicalExtractor
from app.corpus.corpus_loader import list_all_panels, generate_panel_pdf
from app.core.pdf_reader import DocumentReader


def test_all_five_corpus_panels_parse_successfully():
    """Validates that all 5 standard corpus panel fixtures produce structured observations."""
    panels = list_all_panels()
    assert len(panels) == 5
    extractor = ClinicalExtractor()

    for key, text in panels.items():
        obs, warnings = extractor.extract_observations(text)
        assert len(obs) > 0, f"Panel {key} produced 0 observations"
        for o in obs:
            assert o.verification_status == "PENDING_VERIFICATION"
            assert 0.0 <= o.ocr_confidence <= 1.0


def test_synthetic_pdf_generation_and_reading_for_all_panels():
    """Generates synthetic PDFs for all 5 panels and verifies text extraction via DocumentReader."""
    panels = ["CBC", "LIPID", "METABOLIC", "HBA1C", "THYROID"]
    reader = DocumentReader()

    for panel_key in panels:
        pdf_bytes = generate_panel_pdf(panel_key)
        assert len(pdf_bytes) > 500
        assert pdf_bytes.startswith(b"%PDF-")

        extracted_text, mime, _ = reader.read_document(pdf_bytes)
        assert mime == "application/pdf"
        assert len(extracted_text) > 100


def test_scripts_e2e_legacy_fixtures():
    """Validates compatibility with existing scripts/e2e/fixtures/*.txt."""
    fixtures_dir = Path("scripts/e2e/fixtures")
    if not fixtures_dir.exists():
        return

    txt_files = list(fixtures_dir.glob("*.txt"))
    assert len(txt_files) >= 4

    extractor = ClinicalExtractor()
    for txt_file in txt_files:
        with open(txt_file, "r", encoding="utf-8") as f:
            text = f.read()
        obs, _ = extractor.extract_observations(text)
        assert len(obs) > 0, f"Fixture {txt_file.name} yielded 0 observations"
        for o in obs:
            assert o.verification_status == "PENDING_VERIFICATION"
            assert 0.0 <= o.ocr_confidence <= 1.0
