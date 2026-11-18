"""
Test suite for Pydantic Extraction Schemas (Feature F18).
Validates extra="forbid", dual alias support, confidence bounds, and PENDING_VERIFICATION.
"""

import pytest
from pydantic import ValidationError
from app.schemas.extraction import (
    DocumentMetadata,
    ExtractedObservation,
    ExtractionResponse,
    HealthCheckResponse,
    PatientDemographics,
)


def test_extracted_observation_valid():
    """Valid observation parses with defaults."""
    obs = ExtractedObservation(
        test_name="HbA1c",
        loinc_code="4548-4",
        value_numeric=6.4,
        unit="%",
        reference_low=4.0,
        reference_high=5.6,
        is_abnormal=True,
        ocr_confidence=0.98,
    )
    assert obs.test_name == "HbA1c"
    assert obs.verification_status == "PENDING_VERIFICATION"
    assert obs.ocr_confidence == 0.98
    assert obs.is_abnormal is True


def test_extracted_observation_dual_alias():
    """Validates both camelCase and snake_case construction."""
    # From camelCase
    obs_camel = ExtractedObservation.model_validate({
        "testName": "Systolic BP",
        "loincCode": "8480-6",
        "valueNumeric": 146.0,
        "unit": "mmHg",
        "referenceLow": 90.0,
        "referenceHigh": 120.0,
        "isAbnormal": True,
        "ocrConfidence": 0.99,
        "verificationStatus": "PENDING_VERIFICATION",
    })
    assert obs_camel.test_name == "Systolic BP"
    assert obs_camel.value_numeric == 146.0

    # From snake_case
    obs_snake = ExtractedObservation.model_validate({
        "test_name": "Systolic BP",
        "loinc_code": "8480-6",
        "value_numeric": 146.0,
        "unit": "mmHg",
        "reference_low": 90.0,
        "reference_high": 120.0,
        "is_abnormal": True,
        "ocr_confidence": 0.99,
        "verification_status": "PENDING_VERIFICATION",
    })
    assert obs_snake.test_name == "Systolic BP"
    assert obs_snake.ocr_confidence == 0.99


def test_schema_extra_forbid():
    """Validates extra='forbid' raises ValidationError on unexpected field."""
    with pytest.raises(ValidationError):
        ExtractedObservation.model_validate({
            "test_name": "Hemoglobin",
            "unit": "g/dL",
            "ocr_confidence": 0.95,
            "unexpected_rogue_field": "disallowed",
        })


def test_confidence_score_bounds():
    """Validates ocr_confidence constraint 0.0 <= conf <= 1.0."""
    # Negative confidence
    with pytest.raises(ValidationError):
        ExtractedObservation(
            test_name="HbA1c",
            unit="%",
            ocr_confidence=-0.1,
        )

    # Exceeding 1.0
    with pytest.raises(ValidationError):
        ExtractedObservation(
            test_name="HbA1c",
            unit="%",
            ocr_confidence=1.05,
        )

    # Valid boundaries
    obs_0 = ExtractedObservation(test_name="HbA1c", unit="%", ocr_confidence=0.0)
    assert obs_0.ocr_confidence == 0.0

    obs_1 = ExtractedObservation(test_name="HbA1c", unit="%", ocr_confidence=1.0)
    assert obs_1.ocr_confidence == 1.0


def test_verification_status_must_be_pending():
    """Validates verification_status cannot be set to VERIFIED upon extraction."""
    with pytest.raises(ValidationError):
        ExtractedObservation.model_validate({
            "test_name": "HbA1c",
            "unit": "%",
            "ocr_confidence": 0.98,
            "verification_status": "VERIFIED",  # Prohibited upon OCR extraction
        })


def test_document_metadata_and_demographics():
    """Validates DocumentMetadata and PatientDemographics schemas."""
    meta = DocumentMetadata(
        source_provider_name="Metro Diagnostics",
        report_date="2026-10-15",
        report_type="LAB_REPORT",
        confidence=0.98,
    )
    assert meta.source_provider_name == "Metro Diagnostics"
    assert meta.confidence == 0.98

    demo = PatientDemographics(
        masked_name="[PATIENT_NAME_REDACTED]",
        masked_phone="[PHONE_REDACTED]",
        masked_address="[ADDRESS_REDACTED]",
        age=48,
        gender="MALE",
    )
    assert demo.age == 48
    assert demo.gender == "MALE"


def test_extraction_response_envelope():
    """Validates complete ExtractionResponse envelope."""
    resp = ExtractionResponse(
        success=True,
        extracted_at="2026-11-17T15:30:00Z",
        document_metadata=DocumentMetadata(
            source_provider_name="Apollo Diagnostics",
            report_date="2026-10-15",
            report_type="LAB_REPORT",
            confidence=0.98,
        ),
        patient_demographics=PatientDemographics(
            masked_name="[PATIENT_NAME_REDACTED]",
            masked_phone="[PHONE_REDACTED]",
            masked_address="[ADDRESS_REDACTED]",
            age=48,
            gender="MALE",
        ),
        observations=[
            ExtractedObservation(
                test_name="HbA1c",
                loinc_code="4548-4",
                value_numeric=6.4,
                unit="%",
                reference_low=4.0,
                reference_high=5.6,
                is_abnormal=True,
                ocr_confidence=0.98,
            )
        ],
        warnings=[],
    )
    assert resp.success is True
    assert len(resp.observations) == 1
    assert resp.observations[0].loinc_code == "4548-4"

    # Dump by alias produces camelCase
    dumped = resp.model_dump(by_alias=True)
    assert "extractedAt" in dumped
    assert "documentMetadata" in dumped
    assert "patientDemographics" in dumped
    assert dumped["observations"][0]["testName"] == "HbA1c"
