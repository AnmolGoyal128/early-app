"""
Indian PII Masking and De-identification Engine (Feature F17).

Scrubs Indian personal identification (Mobile +91, Aadhaar 12-digit, ABHA 14-digit,
ABHA handles, hospital MRN/UHID, patient names, patient addresses/PIN codes)
prior to any external LLM processing.

Preserves clinical metadata:
- Doctor names (e.g. Referred By: Dr. Ananya Sen)
- Clinic and laboratory provider names
- Clinical numeric values (e.g. Platelet Count 245000 /uL)
"""

import re
from typing import Optional, Tuple
from app.schemas.extraction import PatientDemographics


class PIIMasker:
    """Regex-based deterministic Indian PII scrubber."""

    def __init__(self):
        # 1. Indian Mobile numbers (+91-98765-43210, +91 98765 43210, 09876543210, 9876543210, 98765-43210)
        self.phone_regex = re.compile(
            r'(?i)(?:(?:\+|00)91[\s\-]?)?(?:0)?[6-9]\d{4}[\s\-]?\d{5}\b'
        )

        # 2. Aadhaar numbers (UIDAI 12 digits, excluding leading 0/1, or masked XXXX-XXXX-1234)
        self.aadhaar_regex = re.compile(
            r'\b(?:[2-9]\d{3}[\s\-]\d{4}[\s\-]\d{4}|[2-9]\d{11}|(?:[Xx]{4}[\s\-][Xx]{4}[\s\-]\d{4}))\b'
        )

        # 3. ABHA numbers (14 digits) and ABHA addresses (@abdm, @sbx)
        self.abha_id_regex = re.compile(
            r'\b\d{2}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}\b'
        )
        self.abha_handle_regex = re.compile(
            r'\b[A-Za-z0-9._%+-]+@(abdm|sbx)\b',
            re.IGNORECASE
        )

        # 4. Hospital MRN, UHID, Lab/Visit IDs, Patient IDs
        # (Explicitly anchored to identifiers, preserving general text)
        self.patient_id_label_regex = re.compile(
            r'(?i)\b(patient\s*id|pt\s*id|mrn|uhid|visit\s*id|lab\s*no|barcode)\s*[:\-]\s*([A-Za-z0-9\-_/]+)'
        )

        # 5. Patient Name lines (e.g., "Patient Name : Aarav Sharma", "Pt. Name: Meera Nair")
        # Must not match doctor lines (e.g. "Referred By : Dr. Ananya Sen")
        # Use [ \t] instead of \s so it does not match across newlines
        self.patient_name_label_regex = re.compile(
            r'(?i)^(\s*(?:patient\s*name|pt\.?\s*name|name)\s*[:\-]\s*)(?:Mr\.|Mrs\.|Ms\.|Master\s+)?([A-Za-z \t\.\']{2,40})',
            re.MULTILINE
        )

        # 6. Patient Address lines
        self.patient_address_label_regex = re.compile(
            r'(?i)^(\s*(?:address|residence)\s*[:\-]\s*)([^\r\n]+)',
            re.MULTILINE
        )

        # 7. Context-gated PIN codes (only preceded by PIN keywords or Indian city/state)
        # Prevents masking Platelet counts like 245000 /uL
        self.context_pin_regex = re.compile(
            r'(?i)\b(pincode|pin\s*code|pin|postal\s*code|bengaluru|karnataka|delhi|mumbai|chennai|hyderabad|pune|kolkata)[\s\-:,]{1,10}\b([1-9]\d{5})\b'
        )

        # 8. Age extraction: "Age / Gender : 48 Y / Male" or "Age: 48 Yrs"
        self.age_regex = re.compile(
            r'(?i)\b(?:age|age\s*/\s*gender)\s*[:\-]?\s*(\d{1,3})\s*(?:y|yrs|years)?\b'
        )

        # 9. Gender extraction
        self.gender_regex = re.compile(
            r'(?i)\b(?:gender|sex)\s*[:\-]?\s*(male|female|other)\b|\b(?:male|female|other)\b'
        )

    def mask_pii(self, raw_text: str) -> Tuple[str, PatientDemographics]:
        """
        Applies Indian PII de-identification to text and extracts demographic metadata.
        Returns (scrubbed_text, patient_demographics).
        """
        if not raw_text or not raw_text.strip():
            return "", PatientDemographics(
                masked_name="[PATIENT_NAME_REDACTED]",
                masked_phone="[PHONE_REDACTED]",
                masked_address="[ADDRESS_REDACTED]",
                age=None,
                gender=None,
            )

        extracted_age: Optional[int] = None
        extracted_gender: Optional[str] = None

        # 1. Extract Age
        age_match = self.age_regex.search(raw_text)
        if age_match:
            try:
                age_val = int(age_match.group(1))
                if 0 <= age_val <= 150:
                    extracted_age = age_val
            except (ValueError, TypeError):
                pass

        # 2. Extract Gender
        # Search specifically on Age/Gender line or general header
        gender_line = ""
        for line in raw_text.splitlines()[:25]:
            if any(k in line.lower() for k in ("gender", "sex", "age")):
                gender_line += " " + line
        if gender_line:
            if re.search(r'\bfemale\b', gender_line, re.IGNORECASE):
                extracted_gender = "FEMALE"
            elif re.search(r'\bmale\b', gender_line, re.IGNORECASE):
                extracted_gender = "MALE"
            elif re.search(r'\bother\b', gender_line, re.IGNORECASE):
                extracted_gender = "OTHER"

        # 3. Scrubbing pipeline
        text = raw_text

        # A. Mask Patient Name (preserving prefix label)
        text = self.patient_name_label_regex.sub(r'\1[PATIENT_NAME_REDACTED]', text)

        # B. Mask Patient Address
        text = self.patient_address_label_regex.sub(r'\1[ADDRESS_REDACTED]', text)

        # C. Mask Patient IDs / MRN / UHID / Barcodes
        text = self.patient_id_label_regex.sub(r'\1: [PATIENT_ID_REDACTED]', text)

        # D. Mask ABHA IDs and Handles
        text = self.abha_id_regex.sub('[ABHA_REDACTED]', text)
        text = self.abha_handle_regex.sub('[ABHA_REDACTED]', text)

        # E. Mask Aadhaar
        text = self.aadhaar_regex.sub('[AADHAAR_REDACTED]', text)

        # F. Mask Context-Gated PIN codes (leaving numerical counts intact)
        text = self.context_pin_regex.sub(r'\1: [PIN_REDACTED]', text)

        # G. Mask Phone Numbers (Check phone context or +91 pattern)
        # Avoid masking test numbers or reference ranges by matching phone pattern
        def phone_sub(m: re.Match) -> str:
            val = m.group(0)
            # Extra safety check: if preceding token is an equality or biomarker keyword, do not mask
            start = max(0, m.start() - 20)
            pre_context = text[start:m.start()].lower()
            if any(biokey in pre_context for biokey in ("wbc", "platelet", "count", "rbc", "<", ">", "=")):
                return val
            return "[PHONE_REDACTED]"

        text = self.phone_regex.sub(phone_sub, text)

        demographics = PatientDemographics(
            masked_name="[PATIENT_NAME_REDACTED]",
            masked_phone="[PHONE_REDACTED]",
            masked_address="[ADDRESS_REDACTED]",
            age=extracted_age,
            gender=extracted_gender,
        )

        return text, demographics
