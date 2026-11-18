"""
Test suite for Deterministic Clinical Extractor (Feature F19).
Verifies parsing, LOINC codes, canonical test names, reference bounds, and abnormal flags across all 5 panels.
"""

from app.core.extractor import ClinicalExtractor


def test_extract_cbc_panel(cbc_text):
    """Validates complete blood count panel extraction and abnormal flag evaluation."""
    extractor = ClinicalExtractor()
    obs, warnings = extractor.extract_observations(cbc_text)
    obs_map = {o.test_name: o for o in obs}

    # Verify key parameters present
    assert "Hemoglobin" in obs_map
    assert "Total RBC Count" in obs_map
    assert "Packed Cell Volume (PCV)" in obs_map
    assert "Mean Corpuscular Volume (MCV)" in obs_map
    assert "Mean Corpuscular Hb (MCH)" in obs_map
    assert "MCHC" in obs_map
    assert "Red Cell Distribution Width (RDW-CV)" in obs_map
    assert "Total Leukocyte Count (WBC)" in obs_map
    assert "Platelet Count" in obs_map
    assert "Serum Ferritin" in obs_map

    # Verify LOINC codes
    assert obs_map["Hemoglobin"].loinc_code == "718-7"
    assert obs_map["Total RBC Count"].loinc_code == "789-8"
    assert obs_map["Total Leukocyte Count (WBC)"].loinc_code == "6690-2"
    assert obs_map["Platelet Count"].loinc_code == "777-3"
    assert obs_map["Serum Ferritin"].loinc_code == "2276-4"

    # Verify values and abnormal triggers
    assert obs_map["Hemoglobin"].value_numeric == 9.8
    assert obs_map["Hemoglobin"].is_abnormal is True  # 9.8 < 13.0

    assert obs_map["Total RBC Count"].value_numeric == 3.85
    assert obs_map["Total RBC Count"].is_abnormal is True  # 3.85 < 4.50

    assert obs_map["Total Leukocyte Count (WBC)"].value_numeric == 6800.0
    assert obs_map["Total Leukocyte Count (WBC)"].is_abnormal is False  # 4000 - 11000

    assert obs_map["Platelet Count"].value_numeric == 245000.0
    assert obs_map["Platelet Count"].is_abnormal is False  # 150000 - 450000

    assert obs_map["Serum Ferritin"].value_numeric == 12.0
    assert obs_map["Serum Ferritin"].is_abnormal is True  # 12.0 < 24.0


def test_extract_lipid_panel(lipid_text):
    """Validates comprehensive lipid panel extraction, inequality bounds, and abnormal flags."""
    extractor = ClinicalExtractor()
    obs, warnings = extractor.extract_observations(lipid_text)
    obs_map = {o.test_name: o for o in obs}

    assert "Total Cholesterol" in obs_map
    assert "Triglycerides" in obs_map
    assert "HDL Cholesterol" in obs_map
    assert "LDL Cholesterol" in obs_map
    assert "VLDL Cholesterol" in obs_map
    assert "Cholesterol / HDL Ratio" in obs_map

    # Total Cholesterol: 215 mg/dL (< 200 normal) -> abnormal
    tc = obs_map["Total Cholesterol"]
    assert tc.value_numeric == 215.0
    assert tc.loinc_code == "2093-3"
    assert tc.is_abnormal is True

    # Triglycerides: 178 mg/dL (< 150 normal) -> abnormal
    tg = obs_map["Triglycerides"]
    assert tg.value_numeric == 178.0
    assert tg.loinc_code == "2571-8"
    assert tg.is_abnormal is True

    # HDL: 42 mg/dL (> 40 normal) -> normal
    hdl = obs_map["HDL Cholesterol"]
    assert hdl.value_numeric == 42.0
    assert hdl.loinc_code == "2085-9"
    assert hdl.is_abnormal is False

    # LDL: 137 mg/dL (< 100 normal) -> abnormal
    ldl = obs_map["LDL Cholesterol"]
    assert ldl.value_numeric == 137.0
    assert ldl.loinc_code == "13457-7"
    assert ldl.is_abnormal is True

    # Ratio: 5.12 (< 4.5 normal) -> abnormal
    ratio = obs_map["Cholesterol / HDL Ratio"]
    assert ratio.value_numeric == 5.12
    assert ratio.is_abnormal is True


def test_extract_metabolic_renal_panel(metabolic_text):
    """Validates renal function test and metabolic parameter extraction."""
    extractor = ClinicalExtractor()
    obs, warnings = extractor.extract_observations(metabolic_text)
    obs_map = {o.test_name: o for o in obs}

    assert "Serum Creatinine" in obs_map
    assert "Blood Urea Nitrogen (BUN)" in obs_map
    assert "BUN / Creatinine Ratio" in obs_map
    assert "eGFR" in obs_map
    assert "Serum Uric Acid" in obs_map
    assert "Serum Sodium" in obs_map
    assert "Serum Potassium" in obs_map
    assert "Systolic BP" in obs_map
    assert "Diastolic BP" in obs_map

    # Serum Creatinine: 1.5 mg/dL -> abnormal
    cr = obs_map["Serum Creatinine"]
    assert cr.value_numeric == 1.5
    assert cr.loinc_code == "2160-0"
    assert cr.is_abnormal is True

    # eGFR: 58.0 mL/min/1.73m2 -> abnormal
    egfr = obs_map["eGFR"]
    assert egfr.value_numeric == 58.0
    assert egfr.loinc_code == "33914-3"
    assert egfr.is_abnormal is True

    # Sodium: 138 mmol/L -> normal
    na = obs_map["Serum Sodium"]
    assert na.value_numeric == 138.0
    assert na.is_abnormal is False

    # Potassium: 4.6 mmol/L -> normal
    k = obs_map["Serum Potassium"]
    assert k.value_numeric == 4.6
    assert k.is_abnormal is False

    # Blood Pressure: 152/96 mmHg -> both abnormal
    sys_bp = obs_map["Systolic BP"]
    assert sys_bp.value_numeric == 152.0
    assert sys_bp.is_abnormal is True

    dia_bp = obs_map["Diastolic BP"]
    assert dia_bp.value_numeric == 96.0
    assert dia_bp.is_abnormal is True


def test_extract_glycemic_hba1c_panel(hba1c_text):
    """Validates glycemic monitoring, multi-tier HbA1c reference range, and vitals."""
    extractor = ClinicalExtractor()
    obs, warnings = extractor.extract_observations(hba1c_text)
    obs_map = {o.test_name: o for o in obs}

    assert "HbA1c" in obs_map
    assert "Estimated Average Glucose (eAG)" in obs_map
    assert "Fasting Blood Sugar (Glucose)" in obs_map
    assert "Postprandial Blood Glucose (PPBS)" in obs_map
    assert "Systolic BP" in obs_map
    assert "Diastolic BP" in obs_map
    assert "Pulse Rate" in obs_map

    # HbA1c: 6.4 % -> prediabetes abnormal drift
    hba1c = obs_map["HbA1c"]
    assert hba1c.value_numeric == 6.4
    assert hba1c.loinc_code == "4548-4"
    assert hba1c.reference_low == 4.0
    assert hba1c.reference_high == 5.6
    assert hba1c.is_abnormal is True

    # Fasting glucose: 118 mg/dL -> abnormal
    fbs = obs_map["Fasting Blood Sugar (Glucose)"]
    assert fbs.value_numeric == 118.0
    assert fbs.is_abnormal is True

    # Pulse: 78 bpm -> normal
    pulse = obs_map["Pulse Rate"]
    assert pulse.value_numeric == 78.0
    assert pulse.is_abnormal is False


def test_extract_thyroid_vitals_panel(thyroid_text):
    """Validates thyroid hormone panel and outpatient vitals."""
    extractor = ClinicalExtractor()
    obs, warnings = extractor.extract_observations(thyroid_text)
    obs_map = {o.test_name: o for o in obs}

    assert "TSH (Thyroid Stimulating Hormone)" in obs_map
    assert "Total T3" in obs_map
    assert "Total T4" in obs_map
    assert "Free T3" in obs_map
    assert "Free T4" in obs_map
    assert "Systolic BP" in obs_map
    assert "Diastolic BP" in obs_map
    assert "Pulse Rate" in obs_map

    # TSH: 6.85 uIU/mL (ref 0.40 - 4.50) -> abnormal
    tsh = obs_map["TSH (Thyroid Stimulating Hormone)"]
    assert tsh.value_numeric == 6.85
    assert tsh.loinc_code == "3016-3"
    assert tsh.is_abnormal is True

    # Total T4: 7.2 ug/dL (ref 4.5 - 12.0) -> normal
    t4 = obs_map["Total T4"]
    assert t4.value_numeric == 7.2
    assert t4.is_abnormal is False

    # Free T4: 1.1 ng/dL (ref 0.8 - 1.8) -> normal
    ft4 = obs_map["Free T4"]
    assert ft4.value_numeric == 1.1
    assert ft4.is_abnormal is False


def test_combined_slash_blood_pressure():
    """Validates combined 'Blood Pressure: 146/92 mmHg' produces two observations."""
    extractor = ClinicalExtractor()
    text = "Clinical Vitals:\nBlood Pressure: 146/92 mmHg\nPulse: 72 bpm\n"
    obs, _ = extractor.extract_observations(text)
    obs_map = {o.test_name: o for o in obs}

    assert "Systolic BP" in obs_map
    assert obs_map["Systolic BP"].value_numeric == 146.0
    assert obs_map["Systolic BP"].unit == "mmHg"
    assert obs_map["Systolic BP"].is_abnormal is True

    assert "Diastolic BP" in obs_map
    assert obs_map["Diastolic BP"].value_numeric == 92.0
    assert obs_map["Diastolic BP"].unit == "mmHg"
    assert obs_map["Diastolic BP"].is_abnormal is True


def test_safety_invariants_across_all_panels(cbc_text, lipid_text, metabolic_text, hba1c_text, thyroid_text):
    """Guarantees 100% of observations carry PENDING_VERIFICATION and bounded confidence."""
    extractor = ClinicalExtractor()
    for text in [cbc_text, lipid_text, metabolic_text, hba1c_text, thyroid_text]:
        obs, _ = extractor.extract_observations(text)
        assert len(obs) > 0
        for o in obs:
            assert o.verification_status == "PENDING_VERIFICATION"
            assert 0.0 <= o.ocr_confidence <= 1.0
            assert o.loinc_code is not None
            assert o.unit is not None
