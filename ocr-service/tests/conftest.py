"""
Pytest fixtures and configuration for EARLY OCR Service tests.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure ocr-service root is in sys.path
SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.main import app
from app.corpus.corpus_loader import load_panel_text, generate_panel_pdf


@pytest.fixture(scope="session")
def client():
    """Shared FastAPI TestClient fixture."""
    test_client = TestClient(app)
    yield test_client
    test_client.close()


@pytest.fixture
def cbc_text():
    return load_panel_text("CBC")


@pytest.fixture
def lipid_text():
    return load_panel_text("LIPID")


@pytest.fixture
def metabolic_text():
    return load_panel_text("METABOLIC")


@pytest.fixture
def hba1c_text():
    return load_panel_text("HBA1C")


@pytest.fixture
def thyroid_text():
    return load_panel_text("THYROID")
