# Project EARLY — Step-by-Step Frontend & Backend Integration Plan

**Target Repository:** `C:\Users\DELL\OneDrive\Desktop\Early`  
**Frontend Root:** `client/early-app/` (Next.js App Router, React 19, TypeScript, Tailwind CSS, `shadcn/ui`, `Recharts`, `lucide-react`)  
**Design & Motion Showcase Skill:** [`benjitaylor/skills` (`stageshow`)](https://github.com/benjitaylor/skills/blob/main/stageshow/SKILL.md) installed via `npx skills add benjitaylor/skills --skill stageshow`  
**Backend Root:** `server/` (Java 21 + Spring Boot REST API at `http://localhost:8080/api/v1`)  
**Governing Specs:** `AGENTS.md`, `docs/Product/PRD.md`, `docs/architecture/Architecture.md`, `docs/database/SCHEMA.md`, `docs/api/Api_Contract.md`

---

## 0. How `stageshow` Fits Into Project EARLY

Before writing code, the coding agent must maintain a clear boundary between **marketing/showcase product demos** and **live data-bound application routes**:

1. **Where to Use `stageshow` (`src/components/stageshow/`):**
   - Per [`stageshow/SKILL.md`](https://github.com/benjitaylor/skills/blob/main/stageshow/SKILL.md), Stageshow is a React + plain CSS kit (`Stage`, `Window`, `Phone`, `Act`, `Bar`, `Text`, `Row`, `Card`, `Chart`, `Badge`, `Popover`, `Fly`, `Roll`, `Swap`) for **authored product UI illustrations, interactive cursor walkthroughs, and bento grids**.
   - Use `stageshow` on the **Public Landing & Hackathon Pitch Page (`/`)** to render:
     - **Hero Cursor Demo (`EarlyHeroStage`):** Based on the `hero-demo` and `upload` gold examples—an animated cursor drags a lab report PDF into EARLY, watches OCR extract `HbA1c 6.4%` and `BP 146/92 mmHg`, clicks **Verify**, and triggers a deterministic `REVIEW_NEEDED` follow-up card.
     - **Dual-Perspective Bento Grid (`EarlyBentoGrid`):** Based on the `bento` and `device-pair` gold examples—showing the Doctor Clinical Triage Window alongside the Patient Plain-Language Timeline & Follow-Up Card.
2. **Where to Use `shadcn/ui` + `Recharts` + Typed API Client (`src/app/(patient)/*` & `src/app/(doctor)/*`):**
   - All authenticated application screens (`/login`, `/register`, `/patient/*`, `/doctor/*`) must be real, interactive Next.js App Router pages bound to the Spring Boot backend via `src/lib/api-client.ts` and `docs/api/Api_Contract.md`.

---

## Phase 1: Install the `stageshow` Skill & Required UI Primitives

**Agent Goal:** Install the `stageshow` skill at the repository root and verify all `shadcn/ui` and chart dependencies in `client/early-app`.

### Step 1.1 — Install `stageshow` Skill for the Agent
Run in PowerShell at the repository root (`C:\Users\DELL\OneDrive\Desktop\Early`):
```powershell
npx skills add benjitaylor/skills --skill stageshow
```
- Verify the skill is installed and read its `SKILL.md` (`references/framing.md`, `references/craft.md`, `references/motion.md`, `references/kit.md`, `references/rehearse.md`).
- Copy or link the `stageshow` `kit/` directory into `client/early-app/src/components/stageshow/kit/` (with `lucide-react` installed) so React components can import from `@/components/stageshow/kit`.

### Step 1.2 — Install Frontend Packages & `shadcn/ui` Components
Run inside `C:\Users\DELL\OneDrive\Desktop\Early\client\early-app`:
```powershell
npm install lucide-react recharts clsx tailwind-merge
npx shadcn@latest add button card input label badge tabs table dialog select textarea separator avatar dropdown-menu alert sheet skeleton sonner
```

### Step 1.3 — Configure Environment Variables
Create `client/early-app/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_DEMO_MODE=false
```

**Phase 1 Verification Gate:** `npm run build` or `npm run dev` in `client/early-app` starts cleanly with zero missing package errors.

---

## Phase 2: Design Tokens, Typography & Target Folder Structure

**Agent Goal:** Set up a clean, minimalist clinical visual identity (slate/zinc neutrals, clinical teal/blue primary accent, amber for `REVIEW_NEEDED`, rose for `OVERDUE`, emerald for `VERIFIED`/`COMPLETED`—no floating decorative gradients or stock AI sparkles) and scaffold the App Router hierarchy.

### Step 2.1 — Directory Structure inside `client/early-app/src/`
```text
client/early-app/src/
├── app/
│   ├── layout.tsx                        # Root layout, fonts, AuthProvider, Sonner toaster
│   ├── page.tsx                          # Public Landing Page featuring Stageshow Hero & Bento
│   ├── (auth)/
│   │   ├── login/page.tsx                # Role-aware Login (Patient / Doctor / Staff)
│   │   └── register/page.tsx             # Patient & Clinician Registration
│   ├── (patient)/
│   │   ├── layout.tsx                    # Patient shell (sidebar/top nav + plain-language guard)
│   │   └── patient/
│   │       ├── dashboard/page.tsx        # Health overview, early-signal prompts, due follow-ups
│   │       ├── timeline/page.tsx         # Chronological year/date health journey
│   │       ├── reports/page.tsx          # Report list, upload modal, verification status
│   │       ├── trends/page.tsx           # Recharts HbA1c, BP, Glucose trend charts
│   │       ├── treatments/page.tsx       # Past diagnoses, medications & procedures
│   │       ├── follow-ups/page.tsx       # Upcoming tests/appointments & status
│   │       └── consents/page.tsx         # Grant/revoke clinic access & correction requests
│   └── (doctor)/
│       ├── layout.tsx                    # Doctor/Hospital shell (clinic badge, quick search)
│       └── doctor/
│           ├── dashboard/page.tsx        # Clinic KPI summary + overdue/pending triage queue
│           ├── patients/
│           │   ├── page.tsx              # Authorised patient directory & search
│           │   └── [patientId]/
│           │       ├── page.tsx          # Unified patient chart (timeline, signals, trends)
│           │       ├── verify/[reportId]/page.tsx # Side-by-side PDF/Image + OCR verification UI
│           │       └── encounter/new/page.tsx     # Record consultation, treatment & follow-up
│           ├── follow-ups/page.tsx       # Clinic-wide follow-up board (Complete/Postpone/Cancel)
│           └── rules/page.tsx            # Read-only view of active deterministic clinical rules
├── components/
│   ├── stageshow/
│   │   ├── kit/                          # Stageshow primitives (Stage, Window, Phone, Act, etc.)
│   │   ├── EarlyHeroStage.tsx            # 5-beat cursor walkthrough of report upload -> rule flag
│   │   ├── EarlyBentoGrid.tsx            # Dual-perspective Doctor Window + Patient Phone bento
│   │   └── REHEARSAL.md                  # Stageshow verification notes & gate results
│   ├── patient/                          # Patient-specific cards (PlainLanguageSignalCard, etc.)
│   ├── doctor/                           # Doctor-specific widgets (OcrVerificationForm, TriageTable)
│   ├── charts/                           # BiomarkerTrendChart.tsx (Recharts)
│   └── ui/                               # shadcn/ui primitives
├── context/
│   └── AuthContext.tsx                   # JWT session state, user role, login/logout helpers
├── lib/
│   ├── api-client.ts                     # Typed fetch wrapper with Bearer JWT & 401 refresh
│   ├── services/                         # Domain API modules matching Api_Contract.md
│   └── mock-seed.ts                      # 3 fictional patient histories for offline fallback
└── types/
    └── api.ts                            # Strict TypeScript interfaces matching Api_Contract.md
```

**Phase 2 Verification Gate:** `npx tsc --noEmit` passes with all route groups and layout shells rendering cleanly.

---

## Phase 3: Build Landing Page & Interactive Product Walkthroughs with `stageshow`

**Agent Goal:** Follow the 7-step workflow in [`stageshow/SKILL.md`](https://github.com/benjitaylor/skills/blob/main/stageshow/SKILL.md) (Medium & place -> Look -> Story -> Start from a gold example -> The screen -> Choreograph -> Rehearse) to craft the public showcase on `src/app/page.tsx`.

### Step 3.1 — Map Project EARLY Tokens to Stageshow (`references/looks.md` & `references/craft.md`)
- **Theme & Fidelity:** `light` theme, `accent` palette (clinical slate + teal `#0D9488`), `standard` fidelity (real words only on the focal patient `Aarav Sharma, 48`, biomarker `BP 146/92 mmHg`, `HbA1c 6.4%`, and status `Review Needed`; quiet `Bar` filler lines for peripheral rows so the frame stays calm).
- **Restraint Rule:** Keep real strings to 3–7 per stage; no purple AI sparkles or made-up logos; window fills at least two-thirds of the stage and crops cleanly off one edge (`references/framing.md`).

### Step 3.2 — Build `EarlyHeroStage.tsx` (Gold bases: `hero-demo` + `upload` + `table-edit`)
- **Stage Size:** `960 × 460` (desktop hero) with a `358`-wide compact redesign for mobile.
- **5-Beat Act Script (12–14 seconds loop):**
  1. **Poster / Beat 1:** Clinician workspace window open to patient `Aarav Sharma`. Previous visit shows `BP 146/92 mmHg` with `Follow-up: Pending`.
  2. **Beat 2 (Upload):** Cursor drags `Metro_Lab_Report.pdf` into the report dropzone (`upload` pattern); progress row resolves into extracted biomarkers (`HbA1c 6.4%`, `Fasting Glucose 118 mg/dL`) marked `PENDING_VERIFICATION`.
  3. **Beat 3 (Human Verification):** Cursor moves to `[data-target="verify-btn"]`, clicks **Verify Extracted Values**; badge animates on the same `Button` to `Verified`.
  4. **Beat 4 (Deterministic Rule Trigger):** A satellite card (`Review Needed — Elevated BP & HbA1c Drift`) slides in via `Fly` / `Collapse` alongside the timeline.
  5. **Beat 5 (Payoff):** Cursor clicks **Schedule Reassessment**; follow-up status rolls (`Roll`) from `Pending` to `Scheduled · 14 Days`, holds for reading time, and loops cleanly.

### Step 3.3 — Build `EarlyBentoGrid.tsx` (Gold bases: `bento` + `device-pair` + `chart-scrub`)
- **Tile 1 (`device-pair`):** Doctor desktop `Window` showing longitudinal biomarker comparison paired with a patient `Phone` showing the calm plain-language card: *"Your previous report contains a finding that may need review. Please discuss it with your doctor."*
- **Tile 2 (`chart-scrub`):** Multi-year `HbA1c` trajectory (`5.6% -> 6.0% -> 6.4%`) with a pointer scrub hairline.
- **Tile 3 (`static-card`):** Closed-loop follow-up tracker (`Pending -> Overdue -> Completed`).

### Step 3.4 — Rehearse & Gate (`references/rehearse.md`)
- Run the Stageshow capture/layout verification scripts (`film.mjs --gate`, `jumps.mjs`, `layout.mjs`) if operating in the Stageshow preview workspace, and document the results in `src/components/stageshow/REHEARSAL.md`.

---

## Phase 4: Build Core Application Views (`Patient` & `Doctor` Dashboards)

**Agent Goal:** Build all functional screens required by `docs/Product/PRD.md` (FR-01 through FR-12) using `shadcn/ui` and `Recharts`.

### Step 4.1 — Authentication & Role Routing (`(auth)/login` & `(auth)/register`)
- Build login and registration forms supporting `PATIENT`, `DOCTOR`, `CLINIC_ADMIN`, and `STAFF`.
- Include **1-Click Demo Login Pills** on `/login` for hackathon judges (*"Login as Demo Doctor"* / *"Login as Demo Patient — Aarav Sharma"*).
- Automatically route `PATIENT` users to `/patient/dashboard` and `DOCTOR`/`CLINIC_ADMIN`/`STAFF` users to `/doctor/dashboard`.

### Step 4.2 — Patient Experience (`/patient/*`)
1. **Health Overview (`/patient/dashboard`):** Summary cards for latest verified vitals (`BP`, `HbA1c`, `Fasting Glucose`), upcoming follow-ups count, and active plain-language Early Signal prompts.
2. **Chronological Health Timeline (`/patient/timeline`):** Year-and-month grouped vertical timeline combining verified `LAB_REPORT` entries, `ENCOUNTER` summaries (`patientFriendlySummary`), `TREATMENT` records, and `FOLLOW_UP` milestones.
3. **Reports & Upload (`/patient/reports`):** Upload modal (`PDF`, `PNG`, `JPG`) with metadata fields (`title`, `reportType`, `reportDate`, `sourceProviderName`), extraction status badge (`PROCESSING`, `NEEDS_REVIEW`, `VERIFIED`), and original file download button.
4. **Biomarker Trends (`/patient/trends`):** `Recharts` `ResponsiveContainer` + `LineChart` with `ReferenceArea` normal bands for `HbA1c (%)`, `Systolic/Diastolic BP (mmHg)`, and `Fasting Glucose (mg/dL)`.
5. **Treatments & Follow-Ups (`/patient/treatments`, `/patient/follow-ups`):** Clean tables/cards showing ongoing vs. completed medications and upcoming recommended tests.
6. **Privacy, Consent & Corrections (`/patient/consents`):** Toggle clinic/doctor access scopes (`FULL_HISTORY`, `REPORTS_ONLY`), revoke consent in one click, view access audit log, and submit a `CorrectionRequest` if an extracted value looks wrong.

### Step 4.3 — Doctor & Hospital Experience (`/doctor/*`)
1. **Clinic Operational Dashboard (`/doctor/dashboard`):**
   - 5 KPI metric cards from `GET /api/v1/clinic/dashboard/summary`: `Total Registered Patients`, `Follow-Ups Due`, `Overdue Follow-Ups`, `Completed Follow-Ups`, and `Patients Needing Review`.
   - Priority Triage Queue listing patients with `PENDING_REVIEW` early-signal flags or `OVERDUE` follow-ups.
2. **Authorised Patient Directory (`/doctor/patients`):** Searchable table of patients with `ACTIVE` consent for the clinic.
3. **Consolidated Patient Chart (`/doctor/patients/[patientId]`):**
   - Top banner with patient demographics, blood group, consent scope badge, and quick actions (*"Upload Report"*, *"New Encounter"*, *"Schedule Follow-Up"*).
   - **Deterministic Early-Signal Panel:** Displays clinical message (`clinicianMessage`), triggering rule code (`BP_ELEVATED_REVIEW`, `HBA1C_DRIFT_6M`), source observation link, and review modal (`ACKNOWLEDGED`, `ACTIONED`, `DISMISSED` with `clinicianNote`).
   - Multi-year `Recharts` trajectory overlay and full longitudinal timeline.
4. **Side-by-Side OCR Verification Screen (`/doctor/patients/[patientId]/verify/[reportId]`):**
   - Left pane: Embedded PDF/image viewer (`GET /api/v1/reports/{reportId}/download`).
   - Right pane: Editable table of extracted observations (`testName`, `loincCode`, `valueNumeric`, `unit`, `referenceLow`, `referenceHigh`, `ocrConfidence` badge). Low-confidence rows (`< 0.90`) are highlighted in amber for mandatory human check before submitting `POST /api/v1/reports/{reportId}/verify`.
5. **Encounter & Follow-Up Workflow (`/doctor/patients/[patientId]/encounter/new` & `/doctor/follow-ups`):**
   - Form to record `chiefComplaint`, `clinicalAssessment`, `patientFriendlySummary`, prescriptions (`treatments`), and linked preventive `follow_ups` (`REPEAT_TEST`, `REASSESSMENT_VISIT`, `SPECIALIST_REFERRAL`).
   - Clinic-wide follow-up status transitions (`PENDING -> COMPLETED / POSTPONED / CANCELLED`).

---

## Phase 5: Connect Frontend to Frontend/Backend via Typed API Layer

**Agent Goal:** Wire every UI view in `client/early-app` to the exact REST endpoints and envelopes defined in `docs/api/Api_Contract.md`, with seamless fallback to the 3 synthetic demo patients when `NEXT_PUBLIC_DEMO_MODE=true`.

### Step 5.1 — Implement Strict TypeScript Contracts (`src/types/api.ts`)
Define exact TypeScript interfaces matching `docs/api/Api_Contract.md` and `docs/database/SCHEMA.md`:
- `ApiResponse<T>`, `ApiError`
- `UserProfile`, `Role` (`'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN' | 'STAFF'`)
- `PatientSummary`, `ConsentRecord`, `MedicalReport`, `BiomarkerObservation`, `TrendSeries`
- `Encounter`, `Treatment`, `EarlySignalFlag`, `FollowUpItem`, `ClinicDashboardSummary`, `CorrectionRequest`, `AuditLogEntry`

### Step 5.2 — Build Central Fetch Client (`src/lib/api-client.ts`)
- Read `process.env.NEXT_PUBLIC_API_BASE_URL` (`http://localhost:8080/api/v1`).
- Automatically attach `Authorization: Bearer <accessToken>` on every request.
- Intercept `401 Unauthorized` responses to call `POST /api/v1/auth/refresh`; if refresh fails, clear session and redirect to `/login`.
- Parse the standard `{ success, data, error, timestamp }` envelope and surface `error.message` (e.g., `CONSENT_REQUIRED`, `VALIDATION_ERROR`) via `sonner` toast notifications.
- Support `multipart/form-data` uploads (omitting `Content-Type: application/json` so the browser sets the multipart boundary) for `POST /api/v1/reports/upload`.

### Step 5.3 — Implement Domain Service Modules (`src/lib/services/*.ts`)
Map 1-to-1 with `docs/api/Api_Contract.md`:
1. `auth.service.ts`: `login`, `register`, `refresh`, `getMe` (`/auth/*`)
2. `patients.service.ts`: `getMyProfile`, `listAuthorisedPatients`, `getPatientById`, `getPatientTimeline` (`/patients/*`)
3. `consents.service.ts`: `listConsents`, `grantConsent`, `revokeConsent` (`/consents/*`)
4. `reports.service.ts`: `uploadReport`, `listPatientReports`, `getReportById`, `getReportDownloadUrl`, `verifyReportObservations` (`/reports/*`)
5. `observations.service.ts`: `listObservations`, `getObservationTrends` (`/patients/{id}/observations*`)
6. `encounters.service.ts`: `listEncounters`, `createEncounter`, `listTreatments`, `updateTreatmentStatus` (`/patients/{id}/encounters`, `/treatments/*`)
7. `signals.service.ts`: `listRules`, `listPatientSignals`, `reviewSignal` (`/rules`, `/patients/{id}/signals`, `/signals/{id}/review`)
8. `followups.service.ts`: `listPatientFollowUps`, `createFollowUp`, `updateFollowUpStatus`, `getClinicDashboardSummary`, `listClinicFollowUps` (`/patients/{id}/follow-ups`, `/follow-ups/*`, `/clinic/*`)
9. `governance.service.ts`: `createCorrectionRequest`, `listCorrectionRequests`, `resolveCorrectionRequest`, `listAuditLogs` (`/correction-requests*`, `/audit-logs`)

### Step 5.4 — Configure Next.js & Spring Boot CORS / Proxy
- In `client/early-app/next.config.ts`, configure an optional `/api/v1/:path*` rewrite to `http://localhost:8080/api/v1/:path*` to avoid cross-origin cookie/header issues during local development.
- In `server/` (Spring Security `CorsConfigurationSource`), allow `http://localhost:3000` with methods `GET, POST, PATCH, PUT, DELETE, OPTIONS` and headers `Authorization, Content-Type`.

---

## Phase 6: End-to-End Verification & Hackathon Demo Checklist

**Agent Goal:** Verify the complete loop across both roles before marking the task finished.

1. **Static & Build Check:**
   - Run `npx tsc --noEmit` and `npm run build` in `client/early-app` — must exit with `0` errors.
2. **Stageshow Landing Check:**
   - Open `http://localhost:3000` and verify `EarlyHeroStage` and `EarlyBentoGrid` render at both desktop width and `358px` mobile width without text clipping or layout jumps.
3. **End-to-End Clinical Workflow Check (3 Fictional Patients):**
   - Log in as **Doctor** -> open **Aarav Sharma** -> upload a sample lab PDF -> verify OCR values on `/doctor/patients/[id]/verify/[reportId]` -> confirm deterministic `BP_ELEVATED_REVIEW` / `HBA1C_DRIFT_6M` flag appears -> create a reassessment follow-up.
   - Log in as **Patient (Aarav Sharma)** -> verify the new report appears on `/patient/timeline`, the `Recharts` trend updates on `/patient/trends`, the calm plain-language prompt appears on `/patient/dashboard`, and revoking consent on `/patient/consents` immediately blocks doctor access (`403 CONSENT_REQUIRED`).

---

## Direct Copy-Paste Master Prompt for Your Coding Agent

Copy and paste the block below directly into your coding agent (Claude Code, Cursor, Codex, or Windsurf):

```markdown
You are building the frontend and API integration for **Project EARLY** (*Preventive Care Intelligence*) in `C:\Users\DELL\OneDrive\Desktop\Early`.

### 1. Read Governing Specifications First
Before writing any code, read:
1. `AGENTS.md`
2. `docs/Product/PRD.md`
3. `docs/architecture/Architecture.md`
4. `docs/database/SCHEMA.md`
5. `docs/api/Api_Contract.md`
6. `FRONTEND_EXECUTION_PLAN.md`

### 2. Install & Load the `stageshow` Skill
Run:
`npx skills add benjitaylor/skills --skill stageshow`
Read the installed `stageshow/SKILL.md` and its references (`framing.md`, `craft.md`, `motion.md`, `kit.md`, `rehearse.md`).
- Use `stageshow` (`Stage`, `Window`, `Phone`, `Act`, `Bar`, `Text`, `Row`, `Card`, `Fly`, `Roll`) to build the public landing page showcase (`src/components/stageshow/EarlyHeroStage.tsx` and `EarlyBentoGrid.tsx`) on `src/app/page.tsx`.
- Use `shadcn/ui` + `Recharts` + our typed `src/lib/api-client.ts` for all authenticated application routes (`/login`, `/register`, `/patient/*`, `/doctor/*`).

### 3. Execute Phased Implementation
Execute Phases 1 through 6 in `FRONTEND_EXECUTION_PLAN.md` sequentially:
- **Phase 1:** Install `stageshow`, `lucide-react`, `recharts`, and required `shadcn/ui` components inside `client/early-app`.
- **Phase 2:** Scaffold the App Router groups (`(auth)`, `(patient)`, `(doctor)`), role-aware layouts, and clean clinical design tokens.
- **Phase 3:** Build and rehearse `EarlyHeroStage.tsx` (5-beat report upload -> human verification -> deterministic rule flag -> follow-up scheduled) and `EarlyBentoGrid.tsx` following `stageshow/SKILL.md` rules.
- **Phase 4:** Build all Patient Dashboard pages (`/patient/dashboard`, `timeline`, `reports`, `trends`, `treatments`, `follow-ups`, `consents`) and Doctor/Hospital Dashboard pages (`/doctor/dashboard`, `patients`, `patients/[patientId]`, `verify/[reportId]`, `encounter/new`, `follow-ups`, `rules`).
- **Phase 5:** Implement `src/types/api.ts`, `src/lib/api-client.ts` (JWT Bearer injection, `401` refresh, envelope parsing), and all 9 domain service modules matching `docs/api/Api_Contract.md`, plus a 3-patient synthetic demo fallback (`NEXT_PUBLIC_DEMO_MODE`).
- **Phase 6:** Run `npx tsc --noEmit` and `npm run build`, fix any type or layout issues, and verify the end-to-end flow across both Patient and Doctor roles.

Strictly enforce all clinical guardrails in `AGENTS.md`: AI/OCR is for extraction only with mandatory human verification (`PENDING_VERIFICATION` -> `VERIFIED`), all Early Signals come from deterministic rules, and patient-facing copy must remain calm and non-diagnostic.
```
