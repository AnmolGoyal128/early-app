"""
Test suite for POST /internal/extract endpoint (Feature F21).
Covers multipart file uploads, JSON payloads, PII scrubbing, error handling, and response schema.
"""

from app.corpus.corpus_loader import generate_panel_pdf


def test_extract_multipart_text_file(client, hba1c_text):
    """Validates multipart text file upload returns HTTP 200 and ExtractionResponse."""
    response = client.post(
        "/internal/extract",
        files={"file": ("hba1c_report.txt", hba1c_text.encode("utf-8"), "text/plain")},
        data={"report_type_hint": "LAB_REPORT"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "extractedAt" in data
    assert "documentMetadata" in data
    assert "patientDemographics" in data
    assert "observations" in data
    assert len(data["observations"]) >= 5

    # Check PII de-identification in demographics
    demo = data["patientDemographics"]
    assert demo["maskedName"] == "[PATIENT_NAME_REDACTED]"
    assert demo["maskedPhone"] == "[PHONE_REDACTED]"
    assert demo["maskedAddress"] == "[ADDRESS_REDACTED]"
    assert demo["age"] == 48
    assert demo["gender"] == "MALE"

    # Check observation fields
    obs0 = data["observations"][0]
    assert obs0["verificationStatus"] == "PENDING_VERIFICATION"
    assert 0.0 <= obs0["ocrConfidence"] <= 1.0


def test_extract_multipart_pdf_file(client):
    """Validates multipart synthetic PDF upload returns HTTP 200 and extracts observations."""
    pdf_bytes = generate_panel_pdf("METABOLIC")
    response = client.post(
        "/internal/extract",
        files={"file": ("renal_report.pdf", pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["observations"]) > 0

    test_names = [o["testName"] for o in data["observations"]]
    assert "Serum Creatinine" in test_names
    assert "eGFR" in test_names


def test_extract_json_payload(client, lipid_text):
    """Validates direct JSON payload invocation with text string."""
    response = client.post(
        "/internal/extract",
        json={"text": lipid_text, "report_type_hint": "LAB_REPORT"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    test_names = [o["testName"] for o in data["observations"]]
    assert "Total Cholesterol" in test_names
    assert "Triglycerides" in test_names


def test_extract_empty_file_returns_400(client):
    """Validates 0-byte file upload returns HTTP 400 MALFORMED_DOCUMENT."""
    response = client.post(
        "/internal/extract",
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "MALFORMED_DOCUMENT"


def test_extract_unsupported_executable_returns_422(client):
    """Validates executable binary upload returns HTTP 422 UNSUPPORTED_FILE."""
    # PE executable header
    response = client.post(
        "/internal/extract",
        files={"file": ("program.exe", b"MZ\x90\x00\x03\x00", "application/octet-stream")},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNSUPPORTED_FILE"


def test_extract_unsupported_mime_returns_422(client):
    """Validates declared application/x-msdownload returns HTTP 422 UNSUPPORTED_FILE."""
    response = client.post(
        "/internal/extract",
        files={"file": ("payload.bin", b"some content", "application/x-msdownload")},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNSUPPORTED_FILE"


def test_extract_unsupported_file_type_in_json_returns_422(client):
    """Validates fileType application/x-msdownload in JSON body returns HTTP 422."""
    response = client.post(
        "/internal/extract",
        json={"text": "sample text", "fileType": "application/x-msdownload"},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNSUPPORTED_FILE"
