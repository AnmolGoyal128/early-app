# Stageshow Rehearsal Gate — Project EARLY

**Target Components:**
- `src/components/stageshow/EarlyHeroStage.tsx`
- `src/components/stageshow/EarlyBentoGrid.tsx`

**Date:** 2026-11-17  
**Fidelity:** Standard (Light theme, Clinical Slate + Teal palette `#0D9488`)  
**Gold Baseline References:** `hero-demo` + `upload` + `device-pair` + `chart-scrub` + `static-card`

---

## 1. Focal Story & String Budget (Restraint Audit)
- **Focal Patient:** `Aarav Sharma · 48M`
- **Tracked Biomarkers:** `BP 146/92 mmHg` (Prior Visit), `HbA1c 6.4%` (Extracted & Verified)
- **Deterministic Trigger:** `Review Needed — Elevated BP & HbA1c Drift` (`BP_ELEVATED_REVIEW`)
- **Follow-Up Payoff:** `Scheduled · 14 Days`
- **Total Real Text Budget:** Under 7 strings in hero frame; peripheral rows use muted `Bar` components.

---

## 2. 5-Beat Choreography Check
1. **Beat 1 (Poster / Baseline):** Clinician view of patient Aarav Sharma. Prior elevated blood pressure (146/92) with pending follow-up.
2. **Beat 2 (Report Drop):** Drag of `Metro_Lab_Report.pdf` into dashed dropzone with ghost icon; resolves into extracted `HbA1c 6.4%` marked `Pending Verification`.
3. **Beat 3 (Human Verification):** Cursor targets `verify-btn`; click animates badge to `Verified` (emerald) with OCR confidence `98%`.
4. **Beat 4 (Deterministic Flag):** Satellite card `Review Needed` slides in with rule description.
5. **Beat 5 (Closed-Loop Action):** Cursor clicks `Schedule Reassessment`; follow-up status rolls to `Scheduled · 14 Days`. Holds for reading time before repeating.

---

## 3. Anti-AI-Slop Visual Compliance
- [x] Zero purple/indigo/neon gradient overlays.
- [x] Zero floating neon orbs or glassmorphic blur blobs.
- [x] Zero AI sparkles (`Sparkles`, `Wand2`, `BrainCircuit`).
- [x] Tabular numbers (`font-mono`) on all biomarkers, percentages, and dates.
- [x] Responsive layout with compact width redesign (358px).
- [x] Calm, non-alarmist plain-language messaging on patient perspective.
