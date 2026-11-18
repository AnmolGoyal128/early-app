# Project EARLY — API Contract (`Api_Contract.md`)

**Version:** 1.0 (MVP)  
**Base URL:** `/api/v1`  
**Transport:** HTTPS (TLS 1.3 in production) · JSON (`application/json`) · `multipart/form-data` for report uploads  
**Authentication:** Bearer JWT (`Authorization: Bearer <access_token>`)

---

## 1. Standard Conventions

### 1.1 Response Envelope
All JSON endpoints return a consistent envelope:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2026-11-16T18:00:00Z"
}
```

### 1.2 Error Format
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONSENT_REQUIRED",
    "message": "Active patient consent is required to access this record.",
    "details": []
  },
  "timestamp": "2026-11-16T18:00:00Z"
}
```

### 1.3 Standard HTTP Status Codes
- `200 OK` / `201 Created`: Request succeeded.
- `400 Bad Request`: Validation error or malformed input (`VALIDATION_ERROR`).
- `401 Unauthorized`: Missing or expired JWT (`UNAUTHORIZED`).
- `403 Forbidden`: Insufficient role or missing/revoked patient consent (`FORBIDDEN`, `CONSENT_REQUIRED`).
- `404 Not Found`: Resource does not exist (`NOT_FOUND`).
- `409 Conflict`: Duplicate email or invalid state transition (`CONFLICT`).
- `422 Unprocessable Entity`: OCR/file format unsupported (`UNSUPPORTED_FILE`).

---

## 2. Authentication & Session Endpoints

| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a `PATIENT` or `DOCTOR` / `CLINIC_ADMIN` account |
| `POST` | `/auth/login` | Public | Authenticate with email + password; returns `accessToken`, `refreshToken`, and user profile |
| `POST` | `/auth/refresh` | Public | Exchange valid `refreshToken` for a new `accessToken` |
| `GET` | `/auth/me` | All Auth | Return current authenticated user profile, role, and linked `patientId` or `doctorId`/`clinicId` |

---

## 3. Patient Profiles & Authorised Directory

| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/patients/me` | `PATIENT` | Get logged-in patient's profile and health overview |
| `GET` | `/patients` | `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | Search/list patients who have `ACTIVE` consent with the caller's clinic |
| `GET` | `/patients/{patientId}` | `PATIENT` (self), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | Get patient demographics and summary (consent-gated) |
| `GET` | `/patients/{patientId}/timeline` | `PATIENT` (self), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | Chronological timeline combining verified reports, observations, encounters, treatments, and follow-ups. Query params: `fromDate`, `toDate`, `type` |

---

## 4. Consent & Access Control

| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/consents` | `PATIENT` | List all clinics/doctors with active, expired, or revoked consent |
| `POST` | `/consents` | `PATIENT` | Grant consent to a `clinicId` (and optional `doctorId`, `scope`, `expiresAt`) |
| `POST` | `/consents/{consentId}/revoke` | `PATIENT` | Immediately revoke consent (`status = REVOKED`, sets `revokedAt`) |

---

## 5. Medical Reports & AI/OCR Extraction

### 5.1 Upload & Download
| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/reports/upload` | `PATIENT`, `DOCTOR`, `STAFF` | `multipart/form-data` (`file`, `patientId`, `title`, `reportType`, `reportDate`, `sourceProviderName`). Triggers Python OCR extraction asynchronously/synchronously and returns `reportId` + extracted preview. |
| `GET` | `/patients/{patientId}/reports` | `PATIENT` (self), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | List all uploaded reports for a patient |
| `GET` | `/reports/{reportId}` | `PATIENT` (self), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | Get report metadata, extraction status, and extracted observations |
| `GET` | `/reports/{reportId}/download` | `PATIENT` (self), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | Stream original PDF/image file (audited) |

### 5.2 Human-in-the-Loop Verification
- **Endpoint:** `POST /reports/{reportId}/verify`
- **Roles:** `DOCTOR`, `STAFF`, `PATIENT` (for self-uploaded reports pending clinical review)
- **Request Body:**
```json
{
  "reportDate": "2026-10-15",
  "sourceProviderName": "Metro Diagnostics",
  "observations": [
    {
      "observationId": "uuid-1",
      "testName": "HbA1c",
      "loincCode": "4548-4",
      "valueNumeric": 6.4,
      "unit": "%",
      "referenceLow": 4.0,
      "referenceHigh": 5.6,
      "action": "VERIFY"
    }
  ]
}
```
- **Behavior:** Updates observation values, sets `verificationStatus = VERIFIED`, records `verifiedByUserId` + `verifiedAt`, triggers Deterministic Rules Engine, and writes `audit_logs`.

---

## 6. Biomarker Observations & Trends

| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/patients/{patientId}/observations` | `PATIENT` (self), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | List verified observations (filter by `testName`, `loincCode`, `fromDate`, `toDate`) |
| `GET` | `/patients/{patientId}/observations/trends` | `PATIENT` (self), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | Time-series data formatted for Recharts (`testName`, `unit`, `refLow`, `refHigh`, `points: [{ observedAt, valueNumeric, sourceReportId }]`) |

---

## 7. Encounters & Treatment History

| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/patients/{patientId}/encounters` | `PATIENT` (self), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | List clinical encounters |
| `POST` | `/patients/{patientId}/encounters` | `DOCTOR` | Record a new clinical visit (`encounterDate`, `chiefComplaint`, `clinicalAssessment`, `patientFriendlySummary`, optional inline `observations` and `treatments`) |
| `GET` | `/patients/{patientId}/treatments` | `PATIENT` (self), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | List past and active medications, diagnoses, and procedures |
| `PATCH` | `/treatments/{treatmentId}` | `DOCTOR` | Update treatment status (`ACTIVE`, `COMPLETED`, `DISCONTINUED`) |

---

## 8. Early-Signal Flags & Preventive Rules

| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/rules` | `DOCTOR`, `CLINIC_ADMIN` | List active deterministic preventive rules |
| `GET` | `/patients/{patientId}/signals` | `PATIENT` (self), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | List early-signal flags. **Note:** `PATIENT` responses return `patientMessage` only (plain-language, non-diagnostic); `DOCTOR` responses return `clinicianMessage`, `ruleCode`, and `observationId`. |
| `POST` | `/signals/{signalId}/review` | `DOCTOR` | Review a flag (`status`: `ACKNOWLEDGED`, `ACTIONED`, or `DISMISSED`; `clinicianNote`) |

---

## 9. Follow-Up Management & Clinic Dashboard

| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/patients/{patientId}/follow-ups` | `PATIENT` (self), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | List follow-ups for a patient |
| `POST` | `/patients/{patientId}/follow-ups` | `DOCTOR`, `STAFF` | Create a preventive follow-up (`title`, `actionType`, `dueDate`, `signalFlagId`, `encounterId`, `notes`) |
| `PATCH` | `/follow-ups/{followUpId}/status` | `DOCTOR`, `STAFF` | Transition follow-up status (`COMPLETED`, `POSTPONED`, `CANCELLED`, with optional new `dueDate` and `notes`) |
| `GET` | `/clinic/dashboard/summary` | `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | Operational counts for caller's clinic: `totalPatients`, `followUpsDue`, `followUpsOverdue`, `followUpsCompleted`, `patientsNeedingReview` |
| `GET` | `/clinic/follow-ups` | `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | Clinic-wide pending/overdue follow-up worklist sorted by `dueDate ASC` |

---

## 10. Correction Requests & Audit Logs

| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/correction-requests` | `PATIENT` | Submit a correction request for an inaccurate observation or report |
| `GET` | `/correction-requests` | `PATIENT` (own), `DOCTOR`, `CLINIC_ADMIN`, `STAFF` | List correction requests |
| `PATCH` | `/correction-requests/{id}` | `DOCTOR`, `STAFF` | Mark request `RESOLVED` or `REJECTED` |
| `GET` | `/audit-logs` | `CLINIC_ADMIN`, `PATIENT` (own record access history) | Paginated audit trail of record access and mutations |

---

## 11. Next.js <-> Spring Boot Integration Notes

- **API Client:** `client/early-app/src/lib/api-client.ts` wraps `fetch` with automatic `Authorization: Bearer` header injection and `401` token refresh handling.
- **DTO Mapping:** Spring Boot controllers accept/return dedicated Java DTO records mapped via **MapStruct**—never expose JPA `@Entity` classes directly.
- **Role-Based Response Shaping:** For endpoints shared between `PATIENT` and `DOCTOR` (e.g., `/signals`, `/timeline`), Spring Boot projects role-appropriate fields so clinical jargon or internal clinician notes never leak to the patient UI.
