"""
Test suite for Document Reader and PDF Stream Extractor.
"""

import io
import pytest
from PIL import Image
from app.core.pdf_reader import (
    DocumentReader,
    EmptyDocumentException,
    UnsupportedFileTypeException,
)
from app.corpus.corpus_loader import generate_panel_pdf


def test_magic_byte_format_identification():
    """Validates format detection from magic bytes."""
    # PDF
    assert DocumentReader.identify_format(b"%PDF-1.4 test content") == "application/pdf"

    # Plain text
    assert DocumentReader.identify_format(b"Sample medical report plain text") == "text/plain"

    # PNG
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    assert DocumentReader.identify_format(png_bytes) == "image/png"

    # JPEG
    jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF"
    assert DocumentReader.identify_format(jpeg_bytes) == "image/jpeg"


def test_empty_document_raises_exception():
    """Validates 0-byte document raises EmptyDocumentException (MALFORMED_DOCUMENT)."""
    with pytest.raises(EmptyDocumentException) as exc_info:
        DocumentReader.identify_format(b"")
    assert exc_info.value.code == "MALFORMED_DOCUMENT"


def test_unsupported_executable_raises_exception():
    """Validates PE/executable formats raise UnsupportedFileTypeException."""
    # PE header MZ
    with pytest.raises(UnsupportedFileTypeException) as exc_info:
        DocumentReader.identify_format(b"MZ\x90\x00\x03\x00\x00\x00")
    assert exc_info.value.code == "UNSUPPORTED_FILE"

    # Declared MIME application/x-msdownload
    with pytest.raises(UnsupportedFileTypeException):
        DocumentReader.identify_format(b"some content", declared_mime="application/x-msdownload")

    # Executable file extension
    with pytest.raises(UnsupportedFileTypeException):
        DocumentReader.identify_format(b"some content", filename="malicious.exe")


def test_pure_python_pdf_stream_extraction():
    """Validates pure-Python text extraction from generated synthetic PDF."""
    pdf_bytes = generate_panel_pdf("HBA1C")
    assert pdf_bytes.startswith(b"%PDF-")

    raw_text, mime_type, warnings = DocumentReader.read_document(pdf_bytes)
    assert mime_type == "application/pdf"
    assert "GLYCATED HEMOGLOBIN" in raw_text or "HbA1c" in raw_text
    assert "137" in raw_text
    assert "118" in raw_text


def test_image_inspection_via_pillow():
    """Validates Pillow image format verification."""
    # Create simple 10x10 in-memory PNG
    img = Image.new("RGB", (10, 10), color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    raw_text, mime_type, warnings = DocumentReader.read_document(png_bytes)
    assert mime_type == "image/png"
    assert any("Image validated" in w for w in warnings)
