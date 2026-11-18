"""
Clinical Biomarker Registry for 5 Standard Diagnostic Panels.

Panels covered:
1. Complete Blood Count (CBC) & Hemogram
2. Comprehensive Lipid Profile
3. Renal Function Test (RFT) & Metabolic Panel
4. Glycemic & HbA1c Panel
5. Thyroid Profile & Clinical Vitals
"""

from typing import Dict, List, Optional
from pydantic import BaseModel


class BiomarkerDefinition(BaseModel):
    canonical_name: str
    loinc_code: str
    canonical_unit: str
    unit_synonyms: List[str]
    default_ref_low: Optional[float]
    default_ref_high: Optional[float]
    category: str
    aliases: List[str]
    # In case normal is one-sided
    is_upper_bounded_only: bool = False  # e.g., < 200 mg/dL for Cholesterol
    is_lower_bounded_only: bool = False  # e.g., > 40 mg/dL for HDL, >= 90 for eGFR


# Comprehensive Authoritative Clinical Registry
BIOMARKER_REGISTRY: Dict[str, BiomarkerDefinition] = {
    # ---------------- PANEL 1: COMPLETE BLOOD COUNT (CBC) ----------------
    "HEMOGLOBIN": BiomarkerDefinition(
        canonical_name="Hemoglobin",
        loinc_code="718-7",
        canonical_unit="g/dL",
        unit_synonyms=["g/dl", "gm/dl", "g/L", "gm%"],
        default_ref_low=13.0,
        default_ref_high=17.0,
        category="Hematology",
        aliases=[
            r"(?<!glycated\s)(?<!glycosylated\s)hemoglobin\s*(?:\(hb\))?(?!\s*a1c)",
            r"(?<!glycated\s)(?<!glycosylated\s)\bhb\b(?!\s*a1c)",
            r"total\s*hemoglobin"
        ]
    ),
    "RBC_COUNT": BiomarkerDefinition(
        canonical_name="Total RBC Count",
        loinc_code="789-8",
        canonical_unit="mil/uL",
        unit_synonyms=["mil/ul", "million/cumm", "10^6/ul", "x10^12/l", "cells/mcL"],
        default_ref_low=4.50,
        default_ref_high=5.50,
        category="Hematology",
        aliases=[
            r"total\s*rbc\s*count",
            r"rbc\s*count",
            r"red\s*blood\s*cell\s*count"
        ]
    ),
    "PCV": BiomarkerDefinition(
        canonical_name="Packed Cell Volume (PCV)",
        loinc_code="4544-3",
        canonical_unit="%",
        unit_synonyms=["%", "vol%", "fraction"],
        default_ref_low=40.0,
        default_ref_high=50.0,
        category="Hematology",
        aliases=[
            r"packed\s*cell\s*volume\s*(?:\(pcv\s*/\s*hct\))?",
            r"\bpcv\b",
            r"hematocrit",
            r"\bhct\b"
        ]
    ),
    "MCV": BiomarkerDefinition(
        canonical_name="Mean Corpuscular Volume (MCV)",
        loinc_code="787-2",
        canonical_unit="fL",
        unit_synonyms=["fl", "cu micron"],
        default_ref_low=80.0,
        default_ref_high=100.0,
        category="Hematology",
        aliases=[
            r"mean\s*corpuscular\s*volume\s*(?:\(mcv\))?",
            r"\bmcv\b"
        ]
    ),
    "MCH": BiomarkerDefinition(
        canonical_name="Mean Corpuscular Hb (MCH)",
        loinc_code="785-6",
        canonical_unit="pg",
        unit_synonyms=["pg", "picogram"],
        default_ref_low=27.0,
        default_ref_high=32.0,
        category="Hematology",
        aliases=[
            r"mean\s*corpuscular\s*hb\s*(?:\(mch\))?",
            r"\bmch\b(?!\s*c)"
        ]
    ),
    "MCHC": BiomarkerDefinition(
        canonical_name="MCHC",
        loinc_code="786-4",
        canonical_unit="g/dL",
        unit_synonyms=["g/dl", "%", "gm/dl"],
        default_ref_low=31.5,
        default_ref_high=34.5,
        category="Hematology",
        aliases=[
            r"\bmchc\b",
            r"mean\s*corpuscular\s*hemoglobin\s*concentration"
        ]
    ),
    "RDW_CV": BiomarkerDefinition(
        canonical_name="Red Cell Distribution Width (RDW-CV)",
        loinc_code="21000-5",
        canonical_unit="%",
        unit_synonyms=["%"],
        default_ref_low=11.5,
        default_ref_high=14.5,
        category="Hematology",
        aliases=[
            r"rdw[\s\-_]*cv",
            r"red\s*cell\s*distribution\s*width",
            r"\brdw\b"
        ]
    ),
    "WBC": BiomarkerDefinition(
        canonical_name="Total Leukocyte Count (WBC)",
        loinc_code="6690-2",
        canonical_unit="/uL",
        unit_synonyms=["/ul", "/cu.mm", "cumm", "cells/mcl", "x10^3/ul", "/cumm"],
        default_ref_low=4000.0,
        default_ref_high=11000.0,
        category="Hematology",
        aliases=[
            r"total\s*leukocyte\s*count\s*(?:\(wbc\))?",
            r"total\s*wbc\s*count",
            r"wbc\s*count",
            r"\bwbc\b",
            r"white\s*blood\s*cells?"
        ]
    ),
    "PLATELETS": BiomarkerDefinition(
        canonical_name="Platelet Count",
        loinc_code="777-3",
        canonical_unit="/uL",
        unit_synonyms=["/ul", "/cu.mm", "cumm", "lakhs/cumm", "x10^3/ul", "/cumm"],
        default_ref_low=150000.0,
        default_ref_high=450000.0,
        category="Hematology",
        aliases=[
            r"platelet\s*count",
            r"platelets"
        ]
    ),
    "FERRITIN": BiomarkerDefinition(
        canonical_name="Serum Ferritin",
        loinc_code="2276-4",
        canonical_unit="ng/mL",
        unit_synonyms=["ng/ml", "ug/l", "mcg/l"],
        default_ref_low=24.0,
        default_ref_high=336.0,
        category="Hematology",
        aliases=[
            r"serum\s*ferritin\s*(?:\(iron\s*stores\))?",
            r"ferritin"
        ]
    ),

    # ---------------- PANEL 2: LIPID PROFILE ----------------
    "TOTAL_CHOLESTEROL": BiomarkerDefinition(
        canonical_name="Total Cholesterol",
        loinc_code="2093-3",
        canonical_unit="mg/dL",
        unit_synonyms=["mg/dl", "mmol/l"],
        default_ref_low=None,
        default_ref_high=200.0,
        is_upper_bounded_only=True,
        category="Lipid",
        aliases=[
            r"total\s*cholesterol",
            r"serum\s*cholesterol",
            r"\bcholesterol\b(?!\s*[\/–\-]\s*hdl)"
        ]
    ),
    "TRIGLYCERIDES": BiomarkerDefinition(
        canonical_name="Triglycerides",
        loinc_code="2571-8",
        canonical_unit="mg/dL",
        unit_synonyms=["mg/dl", "mmol/l"],
        default_ref_low=None,
        default_ref_high=150.0,
        is_upper_bounded_only=True,
        category="Lipid",
        aliases=[
            r"triglycerides",
            r"serum\s*triglycerides",
            r"\btg\b"
        ]
    ),
    "HDL": BiomarkerDefinition(
        canonical_name="HDL Cholesterol",
        loinc_code="2085-9",
        canonical_unit="mg/dL",
        unit_synonyms=["mg/dl", "mmol/l"],
        default_ref_low=40.0,
        default_ref_high=None,
        is_lower_bounded_only=True,
        category="Lipid",
        aliases=[
            r"hdl\s*cholesterol",
            r"\bhdl\b(?!\s*[\/–\-])",
            r"high\s*density\s*lipoprotein"
        ]
    ),
    "LDL": BiomarkerDefinition(
        canonical_name="LDL Cholesterol",
        loinc_code="13457-7",
        canonical_unit="mg/dL",
        unit_synonyms=["mg/dl", "mmol/l"],
        default_ref_low=None,
        default_ref_high=100.0,
        is_upper_bounded_only=True,
        category="Lipid",
        aliases=[
            r"ldl\s*cholesterol\s*(?:\(calculated\))?",
            r"\bldl\b",
            r"low\s*density\s*lipoprotein"
        ]
    ),
    "VLDL": BiomarkerDefinition(
        canonical_name="VLDL Cholesterol",
        loinc_code="13458-5",
        canonical_unit="mg/dL",
        unit_synonyms=["mg/dl", "mmol/l"],
        default_ref_low=None,
        default_ref_high=30.0,
        is_upper_bounded_only=True,
        category="Lipid",
        aliases=[
            r"vldl\s*cholesterol",
            r"\bvldl\b",
            r"very\s*low\s*density\s*lipoprotein"
        ]
    ),
    "CHOL_HDL_RATIO": BiomarkerDefinition(
        canonical_name="Cholesterol / HDL Ratio",
        loinc_code="9830-1",
        canonical_unit="ratio",
        unit_synonyms=["", "ratio", "dimensionless"],
        default_ref_low=None,
        default_ref_high=4.5,
        is_upper_bounded_only=True,
        category="Lipid",
        aliases=[
            r"chol\s*[\/–\-]\s*hdl\s*ratio",
            r"cholesterol\s*[\/–\-]\s*hdl\s*ratio",
            r"tc\s*[\/–\-]\s*hdl\s*ratio"
        ]
    ),

    # ---------------- PANEL 3: METABOLIC & RENAL PANEL ----------------
    "CREATININE": BiomarkerDefinition(
        canonical_name="Serum Creatinine",
        loinc_code="2160-0",
        canonical_unit="mg/dL",
        unit_synonyms=["mg/dl", "umol/l"],
        default_ref_low=0.5,
        default_ref_high=1.1,
        category="Renal",
        aliases=[
            r"serum\s*creatinine",
            r"creatinine(?!\s*ratio)"
        ]
    ),
    "BUN": BiomarkerDefinition(
        canonical_name="Blood Urea Nitrogen (BUN)",
        loinc_code="3094-0",
        canonical_unit="mg/dL",
        unit_synonyms=["mg/dl", "mmol/l"],
        default_ref_low=7.0,
        default_ref_high=20.0,
        category="Renal",
        aliases=[
            r"blood\s*urea\s*nitrogen\s*(?:\(bun\))?",
            r"\bbun\b(?!\s*[\/–\-])"
        ]
    ),
    "BUN_CREATININE_RATIO": BiomarkerDefinition(
        canonical_name="BUN / Creatinine Ratio",
        loinc_code="3097-3",
        canonical_unit="ratio",
        unit_synonyms=["", "ratio", "dimensionless"],
        default_ref_low=10.0,
        default_ref_high=20.0,
        category="Renal",
        aliases=[
            r"bun\s*[\/–\-]\s*creatinine\s*ratio",
            r"bun\s*[\/–\-]\s*creat\s*ratio"
        ]
    ),
    "EGFR": BiomarkerDefinition(
        canonical_name="eGFR",
        loinc_code="33914-3",
        canonical_unit="mL/min/1.73m2",
        unit_synonyms=["ml/min/1.73m2", "ml/min", "mL/min"],
        default_ref_low=90.0,
        default_ref_high=None,
        is_lower_bounded_only=True,
        category="Renal",
        aliases=[
            r"estimated\s*gfr\s*(?:\(egfr[^\)]*\))?",
            r"\begfr\b",
            r"gfr\s*\(ckd\-epi\)"
        ]
    ),
    "URIC_ACID": BiomarkerDefinition(
        canonical_name="Serum Uric Acid",
        loinc_code="3084-1",
        canonical_unit="mg/dL",
        unit_synonyms=["mg/dl", "umol/l"],
        default_ref_low=2.4,
        default_ref_high=5.7,
        category="Metabolic",
        aliases=[
            r"serum\s*uric\s*acid",
            r"uric\s*acid"
        ]
    ),
    "SODIUM": BiomarkerDefinition(
        canonical_name="Serum Sodium",
        loinc_code="2951-2",
        canonical_unit="mmol/L",
        unit_synonyms=["mmol/l", "meq/l", "mEq/L"],
        default_ref_low=136.0,
        default_ref_high=145.0,
        category="Electrolytes",
        aliases=[
            r"serum\s*sodium",
            r"\bsodium\b"
        ]
    ),
    "POTASSIUM": BiomarkerDefinition(
        canonical_name="Serum Potassium",
        loinc_code="2823-3",
        canonical_unit="mmol/L",
        unit_synonyms=["mmol/l", "meq/l", "mEq/L"],
        default_ref_low=3.5,
        default_ref_high=5.1,
        category="Electrolytes",
        aliases=[
            r"serum\s*potassium",
            r"\bpotassium\b"
        ]
    ),

    # ---------------- PANEL 4: GLYCEMIC & HBA1C PANEL ----------------
    "HBA1C": BiomarkerDefinition(
        canonical_name="HbA1c",
        loinc_code="4548-4",
        canonical_unit="%",
        unit_synonyms=["%", "mmol/mol"],
        default_ref_low=4.0,
        default_ref_high=5.6,
        category="Diabetes",
        aliases=[
            r"glycated\s*hemoglobin\s*(?:\(hba1c\))?",
            r"glycosylated\s*hemoglobin",
            r"\bhba1c\b"
        ]
    ),
    "EAG": BiomarkerDefinition(
        canonical_name="Estimated Average Glucose (eAG)",
        loinc_code="27353-2",
        canonical_unit="mg/dL",
        unit_synonyms=["mg/dl", "mmol/l"],
        default_ref_low=70.0,
        default_ref_high=115.0,
        category="Diabetes",
        aliases=[
            r"estimated\s*average\s*glucose\s*(?:\(eag\))?",
            r"\beag\b"
        ]
    ),
    "FASTING_GLUCOSE": BiomarkerDefinition(
        canonical_name="Fasting Blood Sugar (Glucose)",
        loinc_code="1558-6",
        canonical_unit="mg/dL",
        unit_synonyms=["mg/dl", "mmol/l"],
        default_ref_low=70.0,
        default_ref_high=99.0,
        category="Diabetes",
        aliases=[
            r"fasting\s*blood\s*sugar\s*(?:\(glucose\))?",
            r"fasting\s*blood\s*glucose",
            r"fasting\s*glucose",
            r"fasting\s*plasma\s*glucose",
            r"\bfbs\b"
        ]
    ),
    "POSTPRANDIAL_GLUCOSE": BiomarkerDefinition(
        canonical_name="Postprandial Blood Glucose (PPBS)",
        loinc_code="1521-4",
        canonical_unit="mg/dL",
        unit_synonyms=["mg/dl", "mmol/l"],
        default_ref_low=70.0,
        default_ref_high=140.0,
        category="Diabetes",
        aliases=[
            r"postprandial\s*blood\s*glucose\s*(?:\(ppbs\))?",
            r"postprandial\s*blood\s*sugar",
            r"ppbs",
            r"post\s*prandial\s*glucose"
        ]
    ),

    # ---------------- PANEL 5: THYROID PROFILE & CLINICAL VITALS ----------------
    "SYSTOLIC_BP": BiomarkerDefinition(
        canonical_name="Systolic BP",
        loinc_code="8480-6",
        canonical_unit="mmHg",
        unit_synonyms=["mmhg", "mm hg"],
        default_ref_low=90.0,
        default_ref_high=120.0,
        category="Vitals",
        aliases=[
            r"systolic\s*(?:bp|blood\s*pressure)?",
            r"\bsys\b"
        ]
    ),
    "DIASTOLIC_BP": BiomarkerDefinition(
        canonical_name="Diastolic BP",
        loinc_code="8462-4",
        canonical_unit="mmHg",
        unit_synonyms=["mmhg", "mm hg"],
        default_ref_low=60.0,
        default_ref_high=80.0,
        category="Vitals",
        aliases=[
            r"diastolic\s*(?:bp|blood\s*pressure)?",
            r"\bdia\b"
        ]
    ),
    "PULSE": BiomarkerDefinition(
        canonical_name="Pulse Rate",
        loinc_code="8867-4",
        canonical_unit="bpm",
        unit_synonyms=["bpm", "/min", "beats/min"],
        default_ref_low=60.0,
        default_ref_high=100.0,
        category="Vitals",
        aliases=[
            r"pulse\s*rate",
            r"heart\s*rate\s*(?:\/pulse)?",
            r"\bpulse\b"
        ]
    ),
    "TSH": BiomarkerDefinition(
        canonical_name="TSH (Thyroid Stimulating Hormone)",
        loinc_code="3016-3",
        canonical_unit="uIU/mL",
        unit_synonyms=["uiu/ml", "miu/l", "uu/ml", "uIU/ml"],
        default_ref_low=0.40,
        default_ref_high=4.50,
        category="Thyroid",
        aliases=[
            r"thyroid\s*stimulating\s*hormone\s*(?:\(tsh\))?",
            r"thyroid\s*stimulating\s*hormone",
            r"\btsh\b"
        ]
    ),
    "TOTAL_T3": BiomarkerDefinition(
        canonical_name="Total T3",
        loinc_code="3049-4",
        canonical_unit="ng/dL",
        unit_synonyms=["ng/dl", "nmol/l"],
        default_ref_low=60.0,
        default_ref_high=200.0,
        category="Thyroid",
        aliases=[
            r"total\s*triiodothyronine\s*(?:\(total\s*t3\))?",
            r"total\s*t3",
            r"\bt3\b(?!\s*free)"
        ]
    ),
    "TOTAL_T4": BiomarkerDefinition(
        canonical_name="Total T4",
        loinc_code="3026-2",
        canonical_unit="ug/dL",
        unit_synonyms=["ug/dl", "mcg/dl", "nmol/l"],
        default_ref_low=4.5,
        default_ref_high=12.0,
        category="Thyroid",
        aliases=[
            r"total\s*thyroxine\s*(?:\(total\s*t4\))?",
            r"total\s*t4",
            r"\bt4\b(?!\s*free)"
        ]
    ),
    "FREE_T3": BiomarkerDefinition(
        canonical_name="Free T3",
        loinc_code="3051-0",
        canonical_unit="pg/mL",
        unit_synonyms=["pg/ml", "pmol/l"],
        default_ref_low=2.0,
        default_ref_high=4.4,
        category="Thyroid",
        aliases=[
            r"free\s*triiodothyronine\s*(?:\(free\s*t3\))?",
            r"free\s*t3",
            r"\bft3\b"
        ]
    ),
    "FREE_T4": BiomarkerDefinition(
        canonical_name="Free T4",
        loinc_code="3024-7",
        canonical_unit="ng/dL",
        unit_synonyms=["ng/dl", "pmol/l"],
        default_ref_low=0.8,
        default_ref_high=1.8,
        category="Thyroid",
        aliases=[
            r"free\s*thyroxine\s*(?:\(free\s*t4\))?",
            r"free\s*t4",
            r"\bft4\b"
        ]
    ),
}
