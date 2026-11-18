# E2E Test Infra: Project EARLY (Preventive Care Intelligence)

## Test Philosophy
- **Opaque-Box & Requirement-Driven:** Every test exercises the system strictly through public API boundaries (`http://localhost:8080/api/v1` for Spring Boot, `http://localhost:8000` for FastAPI OCR, `http://localhost:3000` for Next.js frontend). No access to internal classes, private methods, or database internals.
- **Strict Clinical & Privacy Guardrails:**
  - 100% synthetic fictional patient personas (Aarav Sharma, Meera Nair, Rohan Verma).
  - Deterministic clinician-approved Java rules only; zero autonomous AI diagnosis or medication prescriptions.
  - Indian PII de-identification (Aadhaar, ABHA, mobile +91, names, addresses) tested for 100% masking.
  - All extracted observations default to `PENDING_VERIFICATION` until verified by a human clinician.
  - Plain-language non-diagnostic messaging for patient endpoints; clinical codes and triage metrics for doctor endpoints.
- **Methodology:** Systematic 4-tier testing (Category-Partition, Boundary Value Analysis, Pairwise Combinations, Real-World Workloads).

---

## Feature Inventory & Requirement Mapping
| # | Feature | Endpoints & Operations | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|------------------------|:------:|:------:|:------:|:------:|
| F01 | Auth & Session | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me` | 5 | 5 | ✓ | ✓ |
| F02 | Patient Directory & Profiles | `/patients/me`, `/patients`, `/patients/{id}` | 5 | 5 | ✓ | ✓ |
| F03 | Consent Management | `/consents`, `/consents/{id}/revoke` | 5 | 5 | ✓ | ✓ |
| F04 | Report Ingestion & Storage | `/reports/upload`, `/reports/{id}`, `/reports/{id}/download` | 5 | 5 | ✓ | ✓ |
| F05 | OCR Extraction Service | `POST /internal/extract` (PII masking, confidence, PENDING_VERIFICATION) | 5 | 5 | ✓ | ✓ |
| F06 | Human-in-the-Loop Verification | `POST /reports/{id}/verify` (status transition, audit log) | 5 | 5 | ✓ | ✓ |
| F07 | Biomarkers & Longitudinal Trends | `/patients/{id}/observations`, `/observations/trends` | 5 | 5 | ✓ | ✓ |
| F08 | Clinical Encounters & Treatments | `/patients/{id}/encounters`, `/treatments/{id}` | 5 | 5 | ✓ | ✓ |
| F09 | Deterministic Early-Signal Rules | Rule catalog `/rules`, `/patients/{id}/signals`, `/signals/{id}/review` | 5 | 5 | ✓ | ✓ |
| F10 | Preventive Follow-Up Management | `/patients/{id}/follow-ups`, `/follow-ups/{id}/status`, `/clinic/follow-ups` | 5 | 5 | ✓ | ✓ |
| F11 | Clinic Operational Dashboard | `/clinic/dashboard/summary` (KPI metrics) | 5 | 5 | ✓ | ✓ |
| F12 | Correction Requests & Audit Logs | `/correction-requests`, `/audit-logs` | 5 | 5 | ✓ | ✓ |

---

## Test Architecture & Directory Layout

```text
Early/
├── scripts/
│   ├── test-e2e.ps1                     # Unified entry point for Windows PowerShell CI/local runs
│   └── e2e/
│       ├── runner.mjs                   # Automated test harness & runner (Node.js ESM)
│       ├── client.mjs                   # HTTP API client with auth/consent session helpers
│       ├── fixtures/                    # Synthetic medical PDFs, text reports & JSON payloads
│       │   ├── hba1c_lab_report.txt
│       │   ├── lipid_panel_report.txt
│       │   ├── metabolic_renal_report.txt
│       │   ├── cbc_blood_report.txt
│       │   └── synthetic_patients.json
│       ├── tier1_features/              # Tier 1 Feature Coverage test suites (≥60 tests)
│       │   ├── auth.test.mjs
│       │   ├── patients.test.mjs
│       │   ├── consents.test.mjs
│       │   ├── reports_ocr.test.mjs
│       │   ├── observations.test.mjs
│       │   ├── encounters.test.mjs
│       │   ├── signals_rules.test.mjs
│       │   ├── followups.test.mjs
│       │   ├── clinic_dashboard.test.mjs
│       │   └── audit_governance.test.mjs
│       ├── tier2_boundaries/            # Tier 2 Boundary & Corner Case test suites (≥60 tests)
│       │   ├── auth_boundary.test.mjs
│       │   ├── consent_boundary.test.mjs
│       │   ├── report_boundary.test.mjs
│       │   ├── observation_boundary.test.mjs
│       │   ├── signals_boundary.test.mjs
│       │   └── followups_boundary.test.mjs
│       ├── tier3_combinations/          # Tier 3 Pairwise & Cross-Feature test suites
│       │   ├── auth_consent_flow.test.mjs
│       │   ├── upload_ocr_verify_rules_flow.test.mjs
│       │   ├── encounter_treatment_followup_flow.test.mjs
│       │   └── correction_audit_flow.test.mjs
│       └── tier4_clinical_journeys/     # Tier 4 Real-World End-to-End Clinical Scenarios
│           ├── journey1_aarav_glycemic_drift.test.mjs
│           ├── journey2_meera_hypertension_renal.test.mjs
│           └── journey3_rohan_cbc_anemia.test.mjs
```

---

## Real-World Application Scenarios (Tier 4)

| # | Scenario | Persona & Medical Domain | Key Features Exercised | Pass Criteria |
|---|----------|--------------------------|------------------------|---------------|
| 1 | **Glycemic Drift & Hypertension Workflow** | **Aarav Sharma** (48M, pre-diabetic, elevated BP) | F01, F03, F04, F05, F06, F07, F08, F09, F10 | HbA1c 5.8% -> 6.4% drift detected; BP 146/92 triggers `BP_ELEVATED_REVIEW`; patient sees calm message; doctor schedules 3-month follow-up |
| 2 | **Hypertension & Renal Monitoring Workflow** | **Meera Nair** (54F, hypertensive, declining eGFR) | F01, F02, F03, F06, F07, F09, F10, F11 | eGFR decline flags review; overdue repeat test appears in clinic triage queue; staff postpones with reason; clinic KPIs increment |
| 3 | **CBC Anemia Follow-Up Workflow** | **Rohan Verma** (32M, fatigue, low hemoglobin) | F01, F04, F05, F06, F08, F10, F12 | CBC report extracted (Hb 9.8 g/dL); doctor verifies; creates encounter & iron treatment; schedules 30-day follow-up; patient reviews timeline |

---

## Coverage Thresholds & Quality Gates
- **Tier 1:** ≥5 test cases per feature (12 features × 5 = 60 cases).
- **Tier 2:** ≥5 boundary/edge test cases per feature (60 cases).
- **Tier 3:** Pairwise coverage across major cross-feature flows (≥12 cross-feature integration scenarios).
- **Tier 4:** 3 complete multi-stage clinical journeys.
- **Total Minimum Test Count:** ≥135 executable assertions.
- **Pass Semantics:** Exit code `0` on 100% test pass; non-zero on any failure.
