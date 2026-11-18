# Project EARLY — AI Agent Instructions (`AGENTS.md`)

This repository contains **Project EARLY** (*Preventive Care Intelligence*), a B2B2C connected healthcare platform with a unified central patient record and two role-based interfaces: a **Patient Dashboard** and a **Doctor & Hospital Dashboard**.

## 1. Repository Structure

```text
Early/
├── client/
│   └── early-app/                  # Next.js (App Router) + React 19 + Tailwind CSS + shadcn/ui + Recharts + Stageshow
├── docs/
│   ├── api/
│   │   └── Api_Contract.md         # REST API contract (Next.js <-> Spring Boot)
│   ├── architecture/
│   │   └── Architecture.md         # System architecture, security & data flows
│   ├── database/
│   │   └── SCHEMA.md               # PostgreSQL 16 relational schema & indexes
│   └── Product/
│       └── PRD.md                  # Product requirements, personas & MVP scope
├── server/                         # Java 21 + Spring Boot REST API + Spring Security + MapStruct
├── ocr-service/                    # Python FastAPI OCR & structured JSON extraction service
├── FRONTEND_EXECUTION_PLAN.md      # Step-by-step frontend & API connection execution plan
└── AGENTS.md                       # This file
```

## 2. Mandatory Documentation-First Workflow

Before writing or modifying code in any domain, **read the corresponding specification first**:

| Task Domain | Mandatory Reference Document |
| :--- | :--- |
| API endpoints, DTOs, auth headers, status codes | `docs/api/Api_Contract.md` |
| System boundaries, OCR flow, security, deployment | `docs/architecture/Architecture.md` |
| Database tables, columns, enums, Flyway migrations | `docs/database/SCHEMA.md` |
| Feature scope, user stories, clinical copy, MVP rules | `docs/Product/PRD.md` |
| Frontend implementation & `stageshow` integration | `FRONTEND_EXECUTION_PLAN.md` |
| Any coding or documentation task | Root `AGENTS.md` |

### Synchronization Rule

* **Never invent** API endpoints, request/response fields, database columns, or architectural patterns that contradict the `docs/` files.
* If a feature genuinely requires a new endpoint, column, or rule, **update the relevant `docs/` file first** (or in the same change) so documentation and implementation stay synchronized.

## 3. Clinical Safety & Domain Guardrails (Non-Negotiable)

1. **No Autonomous Diagnosis or Prediction:** EARLY does **not** diagnose diseases, predict heart attacks/cancer, or prescribe/recommend medications. Never write prompts, UI copy, or code that claims diagnostic authority.
2. **Deterministic Rules Only for Early Signals:** Early-signal flags must be evaluated by deterministic, clinician-approved rules in Java (`server/`), **never** by an LLM.
3. **AI/OCR is Extraction-Only + Human-in-the-Loop:** `ocr-service/` extracts structured JSON with confidence scores. Extracted values must enter as `PENDING_VERIFICATION` and require human verification before becoming `VERIFIED` clinical history.
4. **Immutable Provenance:** Never silently overwrite historical observations or reports. Preserve `source_report_id`, `observed_at`, and `audit_logs`.
5. **Role-Appropriate Language:** Patient-facing UI must use plain, calm language (e.g., *"Your previous report contains a finding that may need review. Please discuss it with your doctor."*). Never expose raw clinical alert jargon to patients.
6. **Synthetic Data Only:** Use strictly fictional/synthetic patient data in seeds, tests, and hackathon demos.

## 4. Stack-Specific Engineering Standards

### 4.1 Frontend (`client/early-app/`)

* **Framework:** Next.js App Router, React 19, TypeScript (`strict: true`).
* **UI & Styling:** Tailwind CSS + `shadcn/ui` components (installed in `client/early-app/`) + `Recharts` for longitudinal biomarker charts.
* **Product Demos & Showcase (`stageshow`):** Install via `npx skills add benjitaylor/skills --skill stageshow`. Use the `stageshow` kit (`Stage`, `Window`, `Phone`, `Act`, `Bar`, `Text`, `Row`, `Card`, `Fly`, `Roll`) for the public landing page hero walkthrough (`EarlyHeroStage.tsx`) and dual-role feature bento (`EarlyBentoGrid.tsx`), while keeping all authenticated routes (`/patient/*`, `/doctor/*`) wired to live `shadcn/ui` + `Recharts` components and the typed API client.
* **Design Aesthetic:** Clean, minimalist, structured layouts; avoid cluttered decorative gradients or generic AI sparkle icons.
* **Data Access:** All backend calls must go through `src/lib/api-client.ts` and `src/lib/services/*` aligned with `docs/api/Api_Contract.md`. Never hardcode mock clinical logic in frontend components.

### 4.2 Backend (`server/`)

* **Framework:** Java 21, Spring Boot 3.x, Spring Security (JWT + RBAC), Spring Data JPA, Flyway.
* **Layering:** Strict separation: `Controller` -> `Service` -> `Repository`.
* **DTO Mapping:** Use **MapStruct** for Entity-to-DTO conversions. Never expose JPA `@Entity` classes in REST responses.
* **Authorization:** Enforce `@PreAuthorize` role checks **and** `ConsentService` checks on every patient-data endpoint. Log all sensitive reads/writes to `audit_logs`.

### 4.3 OCR & Extraction Service (`ocr-service/`)

* **Framework:** Python 3.11+ with FastAPI.
* **Privacy:** Mask/de-identify PII (names, phone numbers, addresses) before sending text to external LLM APIs.
* **Output:** Return strict schema-validated JSON with per-field `ocr_confidence` scores.