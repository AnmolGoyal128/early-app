# Project EARLY — Database Schema (`SCHEMA.md`)

**Database Engine:** PostgreSQL 16  
**Primary Key Strategy:** `UUID` (`gen_random_uuid()`)  
**Timestamp Standard:** `TIMESTAMPTZ` (all timestamps stored in UTC)  
**Migration Tool:** Flyway (`server/src/main/resources/db/migration/V1__init.sql`, etc.)

---

## 1. Design Principles

1. **Single Central Patient Record:** Patients, reports, observations, encounters, treatments, and follow-ups live in one normalized relational schema shared across both Patient and Doctor/Hospital views.
2. **FHIR-Aligned & ABDM-Ready:** Observations support `loinc_code` and standardized units; patients support optional `abha_address` / `abha_number` fields for future ABDM integration.
3. **Non-Destructive History:** Historical test values and clinical notes are never silently overwritten. Corrections create an audit log entry and update verification metadata while preserving the original `medical_reports` file and `raw_ocr_json`.
4. **Append-Only Auditability:** The `audit_logs` table is strictly append-only (no `UPDATE` or `DELETE` operations permitted by application roles).

---

## 2. Entity-Relationship Summary

- `users` (1) ── (0..1) `patients`
- `users` (1) ── (0..1) `doctors`
- `clinics` (1) ── (N) `doctors`
- `patients` (1) ── (N) `patient_consents` ── (1) `clinics`
- `patients` (1) ── (N) `medical_reports`
- `medical_reports` (1) ── (N) `biomarker_observations`
- `patients` (1) ── (N) `encounters` ── (1) `doctors`
- `encounters` (1) ── (N) `treatments`
- `preventive_rules` (1) ── (N) `early_signal_flags`
- `patients` (1) ── (N) `early_signal_flags`
- `patients` (1) ── (N) `follow_ups`
- `patients` (1) ── (N) `correction_requests`
- `users` (1) ── (N) `audit_logs`

---

## 3. Table Definitions

### 3.1 `users`
Stores authentication credentials and system role for all actors.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique user identifier |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Login email address |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | BCrypt hashed password |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | Display name |
| `phone` | `VARCHAR(20)` | `NULL` | Contact phone number |
| `role` | `VARCHAR(30)` | `NOT NULL` | `PATIENT`, `DOCTOR`, `CLINIC_ADMIN`, `STAFF` |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Account active flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Record creation time |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Last update time |

### 3.2 `clinics`
Represents clinics, hospitals, or diagnostic centres subscribing to Project EARLY.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique clinic identifier |
| `name` | `VARCHAR(200)` | `NOT NULL` | Formal clinic/hospital name |
| `type` | `VARCHAR(50)` | `NOT NULL` | `CLINIC`, `HOSPITAL`, `DIAGNOSTIC_LAB` |
| `registration_number` | `VARCHAR(100)` | `NULL` | Clinical establishment / facility ID |
| `address` | `TEXT` | `NULL` | Street address |
| `city` | `VARCHAR(100)` | `NULL` | City |
| `state` | `VARCHAR(100)` | `NULL` | State |
| `contact_phone` | `VARCHAR(20)` | `NULL` | Clinic contact number |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp |

### 3.3 `doctors`
Links clinician users to their clinic and medical credentials.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique doctor profile ID |
| `user_id` | `UUID` | `UNIQUE, NOT NULL, FK -> users(id)` | Associated user account |
| `clinic_id` | `UUID` | `NOT NULL, FK -> clinics(id)` | Primary clinic/hospital |
| `medical_reg_number` | `VARCHAR(100)` | `NOT NULL` | Medical council registration number |
| `specialization` | `VARCHAR(100)` | `NOT NULL` | e.g., `General Medicine`, `Cardiology`, `Endocrinology` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp |

### 3.4 `patients`
Central patient profile linked to a user account.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique patient identifier |
| `user_id` | `UUID` | `UNIQUE, NOT NULL, FK -> users(id)` | Associated user account |
| `date_of_birth` | `DATE` | `NOT NULL` | Patient DOB |
| `gender` | `VARCHAR(20)` | `NOT NULL` | `MALE`, `FEMALE`, `OTHER` |
| `blood_group` | `VARCHAR(10)` | `NULL` | e.g., `O+`, `A+`, `B+` |
| `abha_number` | `VARCHAR(30)` | `UNIQUE, NULL` | Optional future ABDM ABHA ID |
| `emergency_contact_name` | `VARCHAR(150)` | `NULL` | Caregiver/emergency contact |
| `emergency_contact_phone` | `VARCHAR(20)` | `NULL` | Caregiver/emergency phone |
| `is_synthetic_demo` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Flags synthetic hackathon demo profiles |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp |

### 3.5 `patient_consents`
Enforces patient-controlled, consent-based record sharing with clinics/doctors.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique consent record ID |
| `patient_id` | `UUID` | `NOT NULL, FK -> patients(id)` | Patient granting consent |
| `clinic_id` | `UUID` | `NOT NULL, FK -> clinics(id)` | Authorised clinic/hospital |
| `doctor_id` | `UUID` | `NULL, FK -> doctors(id)` | Optional specific doctor restriction |
| `scope` | `VARCHAR(50)` | `NOT NULL, DEFAULT 'FULL_HISTORY'` | `FULL_HISTORY`, `REPORTS_ONLY`, `FOLLOW_UPS_ONLY` |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'ACTIVE'` | `ACTIVE`, `REVOKED`, `EXPIRED` |
| `granted_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | When consent was granted |
| `expires_at` | `TIMESTAMPTZ` | `NULL` | Optional expiration |
| `revoked_at` | `TIMESTAMPTZ` | `NULL` | When consent was revoked |

### 3.6 `medical_reports`
Stores metadata and raw OCR output for uploaded PDF/image reports.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique report ID |
| `patient_id` | `UUID` | `NOT NULL, FK -> patients(id)` | Patient owning the report |
| `uploaded_by_user_id` | `UUID` | `NOT NULL, FK -> users(id)` | User who uploaded the file |
| `clinic_id` | `UUID` | `NULL, FK -> clinics(id)` | Clinic context if uploaded by provider |
| `title` | `VARCHAR(255)` | `NOT NULL` | Report title (e.g., `Complete Blood & HbA1c Panel`) |
| `report_type` | `VARCHAR(50)` | `NOT NULL` | `LAB_REPORT`, `PRESCRIPTION`, `DISCHARGE_SUMMARY`, `VITALS` |
| `source_provider_name` | `VARCHAR(200)` | `NULL` | Lab or hospital name on the report |
| `report_date` | `DATE` | `NOT NULL` | Clinical date on the report |
| `file_storage_key` | `VARCHAR(500)` | `NOT NULL` | Local path or S3 object key |
| `file_mime_type` | `VARCHAR(100)` | `NOT NULL` | `application/pdf`, `image/png`, `image/jpeg` |
| `file_sha256` | `VARCHAR(64)` | `NOT NULL` | Integrity checksum |
| `extraction_status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'PROCESSING'` | `PROCESSING`, `NEEDS_REVIEW`, `VERIFIED`, `FAILED` |
| `raw_ocr_json` | `JSONB` | `NULL` | Unmodified structured JSON returned by `ocr-service` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Upload timestamp |

### 3.7 `biomarker_observations`
Structured, longitudinal clinical measurements extracted from reports or entered during encounters.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique observation ID |
| `patient_id` | `UUID` | `NOT NULL, FK -> patients(id)` | Patient |
| `source_report_id` | `UUID` | `NULL, FK -> medical_reports(id)` | Source report (if extracted from report) |
| `encounter_id` | `UUID` | `NULL, FK -> encounters(id)` | Source encounter (if recorded in clinic) |
| `loinc_code` | `VARCHAR(30)` | `NULL` | Standard LOINC code (e.g., `4548-4` for HbA1c) |
| `test_name` | `VARCHAR(150)` | `NOT NULL` | Canonical name (e.g., `HbA1c`, `Systolic BP`, `Fasting Glucose`) |
| `value_numeric` | `NUMERIC(10,3)` | `NULL` | Numeric measurement value |
| `value_text` | `VARCHAR(100)` | `NULL` | String value if non-numeric |
| `unit` | `VARCHAR(50)` | `NOT NULL` | Unit (e.g., `%`, `mmHg`, `mg/dL`) |
| `reference_low` | `NUMERIC(10,3)` | `NULL` | Lower normal bound |
| `reference_high` | `NUMERIC(10,3)` | `NULL` | Upper normal bound |
| `observed_at` | `TIMESTAMPTZ` | `NOT NULL` | Date/time measurement was taken |
| `ocr_confidence` | `NUMERIC(4,3)` | `NULL` | AI/OCR confidence (`0.000`–`1.000`) |
| `verification_status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'PENDING_VERIFICATION'` | `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED` |
| `verified_by_user_id` | `UUID` | `NULL, FK -> users(id)` | Human who verified/corrected the value |
| `verified_at` | `TIMESTAMPTZ` | `NULL` | Verification timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp |

### 3.8 `encounters`
Records clinical visits and doctor notes.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique encounter ID |
| `patient_id` | `UUID` | `NOT NULL, FK -> patients(id)` | Patient |
| `doctor_id` | `UUID` | `NOT NULL, FK -> doctors(id)` | Attending doctor |
| `clinic_id` | `UUID` | `NOT NULL, FK -> clinics(id)` | Clinic/hospital |
| `encounter_date` | `TIMESTAMPTZ` | `NOT NULL` | Visit date/time |
| `chief_complaint` | `TEXT` | `NULL` | Primary reason for visit |
| `clinical_assessment` | `TEXT` | `NULL` | Doctor's clinical summary |
| `patient_friendly_summary` | `TEXT` | `NULL` | Plain-language summary visible to patient |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp |

### 3.9 `treatments`
Tracks diagnoses, prescribed medications, and procedures recorded by clinicians.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique treatment ID |
| `patient_id` | `UUID` | `NOT NULL, FK -> patients(id)` | Patient |
| `encounter_id` | `UUID` | `NOT NULL, FK -> encounters(id)` | Associated clinical encounter |
| `doctor_id` | `UUID` | `NOT NULL, FK -> doctors(id)` | Recording doctor |
| `treatment_type` | `VARCHAR(40)` | `NOT NULL` | `MEDICATION`, `DIAGNOSIS`, `PROCEDURE`, `LIFESTYLE` |
| `name` | `VARCHAR(200)` | `NOT NULL` | Medication/condition/procedure name |
| `dosage` | `VARCHAR(100)` | `NULL` | e.g., `500 mg` |
| `frequency` | `VARCHAR(100)` | `NULL` | e.g., `Once daily after dinner` |
| `start_date` | `DATE` | `NOT NULL` | Start date |
| `end_date` | `DATE` | `NULL` | End date (NULL if ongoing) |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'ACTIVE'` | `ACTIVE`, `COMPLETED`, `DISCONTINUED` |
| `notes` | `TEXT` | `NULL` | Additional instructions |

### 3.10 `preventive_rules`
Clinician-approved deterministic rules for early-signal monitoring.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique rule ID |
| `rule_code` | `VARCHAR(60)` | `UNIQUE, NOT NULL` | e.g., `BP_ELEVATED_REVIEW`, `HBA1C_DRIFT_6M` |
| `name` | `VARCHAR(150)` | `NOT NULL` | Human-readable rule name |
| `category` | `VARCHAR(50)` | `NOT NULL` | `HYPERTENSION`, `DIABETES`, `FOLLOW_UP`, `DATA_GAP` |
| `rule_definition_json` | `JSONB` | `NOT NULL` | Deterministic threshold/window parameters |
| `severity` | `VARCHAR(20)` | `NOT NULL` | `INFO`, `REVIEW_NEEDED`, `PRIORITY` |
| `clinician_message_template` | `TEXT` | `NOT NULL` | Clinical alert text for doctor view |
| `patient_message_template` | `TEXT` | `NOT NULL` | Plain-language prompt for patient view |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Active toggle |

### 3.11 `early_signal_flags`
Instances where a deterministic rule matched a patient's verified data.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique flag ID |
| `patient_id` | `UUID` | `NOT NULL, FK -> patients(id)` | Patient |
| `rule_id` | `UUID` | `NOT NULL, FK -> preventive_rules(id)` | Triggered rule |
| `observation_id` | `UUID` | `NULL, FK -> biomarker_observations(id)` | Triggering observation |
| `clinician_message` | `TEXT` | `NOT NULL` | Rendered clinical review text |
| `patient_message` | `TEXT` | `NOT NULL` | Rendered plain-language patient prompt |
| `status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'PENDING_REVIEW'` | `PENDING_REVIEW`, `ACKNOWLEDGED`, `ACTIONED`, `DISMISSED` |
| `reviewed_by_doctor_id` | `UUID` | `NULL, FK -> doctors(id)` | Reviewing clinician |
| `reviewed_at` | `TIMESTAMPTZ` | `NULL` | Review timestamp |
| `clinician_note` | `TEXT` | `NULL` | Doctor's decision rationale |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Trigger timestamp |

### 3.12 `follow_ups`
Tracks recommended preventive actions, repeat tests, and review appointments.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique follow-up ID |
| `patient_id` | `UUID` | `NOT NULL, FK -> patients(id)` | Patient |
| `doctor_id` | `UUID` | `NOT NULL, FK -> doctors(id)` | Ordering doctor |
| `clinic_id` | `UUID` | `NOT NULL, FK -> clinics(id)` | Responsible clinic |
| `signal_flag_id` | `UUID` | `NULL, FK -> early_signal_flags(id)` | Linked early-signal flag if applicable |
| `encounter_id` | `UUID` | `NULL, FK -> encounters(id)` | Linked encounter if applicable |
| `title` | `VARCHAR(200)` | `NOT NULL` | e.g., `Repeat Blood Pressure Reassessment` |
| `action_type` | `VARCHAR(40)` | `NOT NULL` | `REPEAT_TEST`, `REASSESSMENT_VISIT`, `SPECIALIST_REFERRAL` |
| `due_date` | `DATE` | `NOT NULL` | Target completion date |
| `status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'PENDING'` | `PENDING`, `OVERDUE`, `COMPLETED`, `POSTPONED`, `CANCELLED` |
| `completed_at` | `TIMESTAMPTZ` | `NULL` | Completion timestamp |
| `notes` | `TEXT` | `NULL` | Instructions or cancellation reason |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Last status update |

### 3.13 `correction_requests`
Allows patients to flag inaccurate extracted values or history entries for review.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique request ID |
| `patient_id` | `UUID` | `NOT NULL, FK -> patients(id)` | Requesting patient |
| `observation_id` | `UUID` | `NULL, FK -> biomarker_observations(id)` | Target observation |
| `report_id` | `UUID` | `NULL, FK -> medical_reports(id)` | Target report |
| `requested_change` | `TEXT` | `NOT NULL` | Description of inaccuracy |
| `status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'OPEN'` | `OPEN`, `RESOLVED`, `REJECTED` |
| `resolved_by_user_id` | `UUID` | `NULL, FK -> users(id)` | Staff/doctor who resolved it |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp |

### 3.14 `audit_logs`
Immutable log of all sensitive clinical and administrative actions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique audit event ID |
| `actor_user_id` | `UUID` | `NOT NULL, FK -> users(id)` | Acting user |
| `actor_role` | `VARCHAR(30)` | `NOT NULL` | Role at time of action |
| `action` | `VARCHAR(60)` | `NOT NULL` | e.g., `REPORT_UPLOADED`, `RECORD_VIEWED`, `VALUE_VERIFIED`, `CONSENT_REVOKED` |
| `resource_type` | `VARCHAR(50)` | `NOT NULL` | e.g., `MEDICAL_REPORT`, `PATIENT`, `FOLLOW_UP` |
| `resource_id` | `UUID` | `NOT NULL` | ID of affected resource |
| `metadata_json` | `JSONB` | `NULL` | Before/after diff or context |
| `ip_address` | `VARCHAR(45)` | `NULL` | Client IP |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Event timestamp |

---

## 4. Indexing Strategy

- `idx_observations_patient_date` on `biomarker_observations(patient_id, observed_at DESC)` — fast longitudinal timeline & trend queries.
- `idx_observations_loinc` on `biomarker_observations(patient_id, test_name, observed_at DESC)` — fast biomarker comparison.
- `idx_followups_clinic_status_due` on `follow_ups(clinic_id, status, due_date ASC)` — fast clinic overdue/due dashboard.
- `idx_consents_patient_clinic_status` on `patient_consents(patient_id, clinic_id, status)` — fast authorization middleware checks.
- `idx_audit_resource` on `audit_logs(resource_type, resource_id, created_at DESC)` — fast compliance/audit inspection.
