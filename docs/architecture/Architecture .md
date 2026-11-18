# Project EARLY — System Architecture

**Version:** 1.0 (Hackathon MVP)  
**Stack:** Next.js (React 19 + Tailwind CSS + shadcn/ui) · Java 21 + Spring Boot · PostgreSQL 16 · Python OCR/AI Extraction Service · Docker

---

## 1. Architectural Principles

1. **One Central Patient Record, Two Role-Based Views:** Both the Patient Dashboard and the Doctor/Hospital Dashboard read from and write to the exact same central PostgreSQL health record, filtered by role-based access control (RBAC) and active patient consent.
2. **Deterministic Clinical Logic, AI for Extraction Only:** LLMs and OCR are strictly scoped to converting unstructured PDF/image reports into structured JSON. All clinical flags ("Early Signals") are evaluated by a **deterministic, auditable Java rules engine** using clinician-approved thresholds.
3. **Human-in-the-Loop Verification:** Extracted report values are stored in a `PENDING_VERIFICATION` state until reviewed and confirmed by an authorised clinician, clinic staff member, or patient.
4. **Immutable Provenance:** Historical records are never silently overwritten. Every biomarker observation retains its `source_report_id`, `observed_at` timestamp, source provider, OCR confidence score, and verification audit trail.
5. **Privacy & PII De-Identification:** Personally Identifiable Information (name, phone, ID numbers) is stripped/masked before text is sent to external LLM extraction APIs.

---

## 2. Repository Structure

```text
Early/
├── client/
│   └── early-app/              # Next.js (App Router) + React 19 + Tailwind + shadcn/ui + Recharts
├── server/                     # Java 21 + Spring Boot REST API + Spring Security + JPA + MapStruct
├── ocr-service/                # Python FastAPI service for OCR + PII masking + LLM JSON extraction
├── docs/
│   ├── api/
│   │   └── Api_Contract.md     # REST API contract between Next.js and Spring Boot
│   ├── architecture/
│   │   └── Architecture.md     # This document
│   ├── database/
│   │   └── SCHEMA.md           # PostgreSQL 16 relational schema & Flyway migrations
│   └── Product/
│       └── PRD.md              # Product Requirements Document
├── docker-compose.yml          # Local orchestration (PostgreSQL, Spring Boot, Python OCR, Next.js)
└── AGENTS.md                   # Repository-wide AI coding agent instructions
```

---

## 3. System Components

| Layer | Technology | Responsibilities |
| :--- | :--- | :--- |
| **Client Tier** | Next.js (App Router), React 19, TypeScript, Tailwind CSS, `shadcn/ui`, Recharts | Role-routed UI (`/patient/*` and `/doctor/*`), report upload & side-by-side verification UI, chronological timeline, Recharts biomarker trend graphs, follow-up management boards, clinic operational metrics. |
| **Core API Tier** | Java 21, Spring Boot 3.x, Spring Security (JWT), Spring Data JPA, MapStruct, Flyway | Authentication & RBAC, consent verification, patient/clinic/encounter/treatment CRUD, report orchestration, deterministic Early-Signal Rules Engine, follow-up state machine, immutable audit logging. |
| **Extraction Tier** | Python 3.11+, FastAPI, Tesseract / PaddleOCR / Vision OCR, LLM Structured Output (JSON Schema) | PDF/image text & table extraction, PII redaction, normalization to canonical test names/LOINC-ready codes and units, confidence scoring per field. |
| **Data & Storage Tier** | PostgreSQL 16, Local Disk / S3-Compatible Encrypted Blob Storage | Relational FHIR-aligned clinical data, JSONB raw extraction payloads, append-only audit logs, encrypted original PDF/image report files. |

---

## 4. Core End-to-End Workflows

### 4.1 Report Upload, Extraction & Verification Flow
1. **Upload:** Patient or authorised clinic staff uploads a PDF/image report via `POST /api/v1/reports/upload` (`multipart/form-data`).
2. **Persist Raw File:** Spring Boot computes a SHA-256 file hash, stores the encrypted file in Blob Storage (local `./storage/reports` in dev; S3 in prod), and creates a `medical_reports` row with `extraction_status = PROCESSING`.
3. **OCR & Structured Extraction:** Spring Boot calls the internal Python `ocr-service` (`POST /internal/extract`) with the file stream/path.
   - Python extracts text/tables via OCR.
   - PII (patient name, phone, address) is masked before LLM structured parsing.
   - LLM returns strict JSON: `{ reportDate, sourceLab, observations: [{ testName, loincCode, valueNumeric, valueText, unit, refLow, refHigh, confidence }] }`.
4. **Pending Review:** Spring Boot saves `raw_ocr_json` on `medical_reports`, inserts `biomarker_observations` with `verification_status = PENDING_VERIFICATION`, and sets `extraction_status = NEEDS_REVIEW`.
5. **Human Verification:** The clinician/staff opens the side-by-side verification screen in Next.js, edits any misread values/units, and submits `POST /api/v1/reports/{id}/verify`.
6. **Commit & Rule Evaluation:** Spring Boot marks observations `VERIFIED` (recording `verified_by` and `verified_at`), sets `medical_reports.extraction_status = VERIFIED`, writes an `audit_logs` entry, and triggers the **Deterministic Rules Engine**.

### 4.2 Deterministic Early-Signal Rules Engine Flow
1. Triggered automatically upon verification of new `biomarker_observations` or creation of an `encounter` / `follow_up`.
2. Evaluates active clinician-approved rules from `preventive_rules` against the patient's verified longitudinal history:
   - **Threshold / Elevation Rule:** e.g., Verified Systolic BP >= 140 mmHg or Diastolic BP >= 90 mmHg, or HbA1c >= 6.5% (or 5.7%–6.4% pre-diabetic range) -> creates `PENDING_REVIEW` flag if no recent clinician review exists.
   - **Longitudinal Drift Rule:** e.g., HbA1c increased by >= 0.5% over 6–12 months, or eGFR declined by >= 15%.
   - **Missed Follow-Up / Overdue Reassessment Rule:** A `follow_ups` item has `status = PENDING` and `due_date < CURRENT_DATE` -> transitions status to `OVERDUE` and raises a workflow flag.
   - **Missing Baseline Data Rule:** Required comparator value or unit is missing -> flags incomplete screening workflow for staff review.
3. **Dual-Language Rendering:**
   - **Doctor View:** Displays clinical metric, delta, rule code, and action button (*"Acknowledge"*, *"Schedule Follow-Up"*, *"Dismiss"*).
   - **Patient View:** Displays calm, non-diagnostic prompt: *"Your previous report contains a finding that may need review. Please discuss it with your doctor."*

### 4.3 Consent & Access Control Flow
- Every clinic/doctor request for a patient's records passes through a Spring Security authorization check + `ConsentService.assertAccess(actor, patientId, requiredScope)`.
- Access is granted only if:
  - `actor.role == PATIENT` and `actor.id == patient.userId`, **OR**
  - `actor.role in [DOCTOR, CLINIC_ADMIN, STAFF]` and an active, non-expired, non-revoked row exists in `patient_consents` linking `patientId` to the actor's `clinicId` (or specific `doctorId`).
- All read/write accesses to patient records are logged asynchronously/synchronously to `audit_logs`.

---

## 5. Security, Privacy & Compliance Architecture

- **Authentication:** Stateless JWT access tokens (short-lived, e.g., 15–30 min) + refresh tokens, BCrypt password hashing.
- **Authorization:** Method-level `@PreAuthorize` RBAC + object-level ownership/consent checks in the service layer (never trust client-supplied `clinicId` or `patientId` without verifying against the JWT principal).
- **Transport & Storage:** HTTPS/TLS 1.3 in production; AES-256 server-side encryption for stored report files and database backups.
- **CORS:** Spring Boot explicitly restricts CORS origins to the configured Next.js frontend origin (`http://localhost:3000` in dev).
- **Regulatory Readiness:** Data model uses UTC timestamps, explicit consent timestamps (`granted_at`, `revoked_at`), and LOINC-compatible observation codes to ease future **ABDM / FHIR R4** interoperability and **DPDP Act** compliance.

---

## 6. Deployment & Local Development Topology

### Local Development (Docker Compose)
- `early-db`: PostgreSQL 16 (`localhost:5432`)
- `early-ocr`: Python FastAPI OCR service (`localhost:8000`, internal network only in prod)
- `early-server`: Spring Boot API (`localhost:8080`)
- `early-client`: Next.js (`localhost:3000`)

### Production Considerations
- Deploy `early-client` (Vercel / Container) and `early-server` + `early-ocr` (AWS ECS / Cloud Run / Kubernetes) in a private VPC with region-locked PostgreSQL (e.g., `ap-south-1` Mumbai for Indian data residency) and encrypted S3 bucket for medical reports.
