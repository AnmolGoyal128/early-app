"""
Test suite for Indian PII Masking Engine (Feature F17).
"""

from app.core.pii_masker import PIIMasker


def test_mask_indian_mobile_numbers():
    """Validates redaction of +91, 0-prefixed, and 10-digit Indian phone numbers."""
    masker = PIIMasker()
    samples = [
        "Contact: +91-98765-43210",
        "Mobile: +91 98765 43210",
        "Phone: 09876543210",
        "Tel: 9876543210",
        "Cell: 98765-43210",
    ]
    for s in samples:
        masked, _ = masker.mask_pii(s)
        assert "[PHONE_REDACTED]" in masked
        assert "98765" not in masked


def test_mask_aadhaar_numbers():
    """Validates redaction of UIDAI 12-digit Aadhaar numbers and masked references."""
    masker = PIIMasker()
    samples = [
        "Aadhaar No: 2345 6789 0123",
        "UID: 8899-4433-1122",
        "Aadhaar (Ref): XXXX-XXXX-4589",
        "Aadhaar Ref: XXXX-XXXX-7711",
    ]
    for s in samples:
        masked, _ = masker.mask_pii(s)
        assert "[AADHAAR_REDACTED]" in masked


def test_mask_abha_id_and_handles():
    """Validates redaction of 14-digit ABHA numbers and @abdm / @sbx addresses."""
    masker = PIIMasker()
    samples = [
        "ABHA Number: 14-3456-7890-1234",
        "ABHA No: 91-8821-4452-9012",
        "ABHA ID: meera.nair@abdm",
        "ABHA Address: kavita.s@abdm",
        "Health ID: patient123@sbx",
    ]
    for s in samples:
        masked, _ = masker.mask_pii(s)
        assert "[ABHA_REDACTED]" in masked
        assert "@abdm" not in masked
        assert "@sbx" not in masked


def test_mask_patient_name_and_address():
    """Validates masking of patient name lines and address lines."""
    masker = PIIMasker()
    text = (
        "Patient Name : Aarav Sharma\n"
        "Address : 42 Palm Meadows, Whitefield, Bengaluru - 560066\n"
    )
    masked, demo = masker.mask_pii(text)
    assert "[PATIENT_NAME_REDACTED]" in masked
    assert "Aarav Sharma" not in masked
    assert "[ADDRESS_REDACTED]" in masked
    assert "Palm Meadows" not in masked
    assert demo.masked_name == "[PATIENT_NAME_REDACTED]"


def test_mask_patient_mrn_uhid_barcode():
    """Validates redaction of MRN, UHID, Patient ID, Visit ID, Barcodes."""
    masker = PIIMasker()
    samples = [
        "Patient ID : P-882910",
        "UHID : AD-BLR-449102",
        "MRN : MRN-882910",
        "Visit ID : METRO-MUM-774120",
        "Lab No : LPL-DEL-892147",
    ]
    for s in samples:
        masked, _ = masker.mask_pii(s)
        assert "[PATIENT_ID_REDACTED]" in masked


def test_preserve_doctor_and_lab_names():
    """Crucial negative guardrail: doctor and clinic names must NOT be redacted."""
    masker = PIIMasker()
    text = (
        "METRO DIAGNOSTIC SERVICES & PATHOLOGY LAB\n"
        "Referred By : Dr. Ananya Sen\n"
        "Authenticated by Dr. Rajesh Rao, MD (Biochemistry)\n"
        "Patient Name : Rohan Verma\n"
    )
    masked, _ = masker.mask_pii(text)
    assert "METRO DIAGNOSTIC SERVICES" in masked
    assert "Dr. Ananya Sen" in masked
    assert "Dr. Rajesh Rao" in masked
    assert "Rohan Verma" not in masked
    assert "[PATIENT_NAME_REDACTED]" in masked


def test_preserve_clinical_numeric_counts():
    """Crucial negative guardrail: platelet and WBC counts must NOT be redacted as PIN codes."""
    masker = PIIMasker()
    text = (
        "PLATELET COUNT 245000 /uL\n"
        "TOTAL LEUKOCYTE COUNT (WBC) 6800 /uL\n"
        "PIN Code: 560066\n"
    )
    masked, _ = masker.mask_pii(text)
    assert "245000" in masked
    assert "6800" in masked
    assert "[PIN_REDACTED]" in masked
    assert "560066" not in masked


def test_extract_age_and_gender():
    """Validates demographic extraction of age and gender."""
    masker = PIIMasker()
    text = "Patient Name : Aarav Sharma\nAge / Gender : 48 Y / Male\n"
    _, demo = masker.mask_pii(text)
    assert demo.age == 48
    assert demo.gender == "MALE"

    text2 = "Pt Name: Meera Nair\nAge: 54 Yrs\nGender: Female\n"
    _, demo2 = masker.mask_pii(text2)
    assert demo2.age == 54
    assert demo2.gender == "FEMALE"
