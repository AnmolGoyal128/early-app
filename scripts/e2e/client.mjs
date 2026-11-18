/**
 * Project EARLY — E2E Test HTTP Client Helper & In-Memory Contract Simulation Engine
 * 
 * Supports:
 * - Live HTTP REST requests to Spring Boot (:8080/api/v1), FastAPI OCR (:8000), Next.js (:3000)
 * - Integrated contract-compliant mock/simulation mode so tests run deterministically in CI/standalone
 * - High-fidelity clinical guardrail enforcement:
 *   - PENDING_VERIFICATION defaults
 *   - PII masking on extraction
 *   - Deterministic Java rules (BP, HbA1c drift, eGFR decline, Overdue follow-up)
 *   - ConsentService access verification & immediate revocation gating
 *   - Dual-language projection (calm non-diagnostic patient message vs clinical doctor metrics)
 *   - Append-only audit logs
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load synthetic patient fixtures
let syntheticFixtures = { patients: [], clinics: [], doctors: [], staff: [] };
try {
  const fixturePath = join(__dirname, 'fixtures', 'synthetic_patients.json');
  if (existsSync(fixturePath)) {
    syntheticFixtures = JSON.parse(readFileSync(fixturePath, 'utf8'));
  }
} catch (e) {
  // fallback if file not yet ready
}

export class ApiSimulationEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = new Map();
    this.clinics = new Map();
    this.doctors = new Map();
    this.patients = new Map();
    this.patientConsents = new Map();
    this.medicalReports = new Map();
    this.biomarkerObservations = new Map();
    this.encounters = new Map();
    this.treatments = new Map();
    this.earlySignalFlags = new Map();
    this.followUps = new Map();
    this.correctionRequests = new Map();
    this.auditLogs = [];
    this.activeTokens = new Map(); // token -> userId

    this.rules = [
      {
        id: 'rule-bp-001',
        ruleCode: 'BP_ELEVATED_REVIEW',
        name: 'Elevated Blood Pressure Review',
        category: 'HYPERTENSION',
        severity: 'REVIEW_NEEDED',
        ruleDefinitionJson: { systolicThreshold: 140, diastolicThreshold: 90 },
        clinicianMessageTemplate: 'Elevated Blood Pressure recorded (Systolic >= 140 or Diastolic >= 90 mmHg). Clinical review and repeat assessment indicated per NP-NCD / JNC guidelines.',
        patientMessageTemplate: 'Your previous report contains a finding that may need review. Please discuss it with your doctor.',
        isActive: true
      },
      {
        id: 'rule-hba1c-002',
        ruleCode: 'HBA1C_DRIFT_6M',
        name: 'Longitudinal Glycemic Drift (6 Months)',
        category: 'DIABETES',
        severity: 'PRIORITY',
        ruleDefinitionJson: { driftThreshold: 0.5, windowMonths: 6 },
        clinicianMessageTemplate: 'Longitudinal Glycemic Drift detected: HbA1c increase >= 0.5% over 6 months. Reassessment and metabolic review indicated.',
        patientMessageTemplate: 'Your previous report contains a finding that may need review. Please discuss it with your doctor.',
        isActive: true
      },
      {
        id: 'rule-egfr-003',
        ruleCode: 'EGFR_DECLINE_REVIEW',
        name: 'Estimated GFR Rapid Decline',
        category: 'RENAL',
        severity: 'PRIORITY',
        ruleDefinitionJson: { percentageDeclineThreshold: 15.0 },
        clinicianMessageTemplate: 'Estimated GFR decline detected (>= 15% reduction from baseline). Renal function monitoring indicated.',
        patientMessageTemplate: 'Your previous report contains a finding that may need review. Please discuss it with your doctor.',
        isActive: true
      },
      {
        id: 'rule-overdue-004',
        ruleCode: 'OVERDUE_FOLLOWUP',
        name: 'Missed Preventive Follow-Up',
        category: 'FOLLOW_UP',
        severity: 'REVIEW_NEEDED',
        ruleDefinitionJson: { checkOverdue: true },
        clinicianMessageTemplate: 'Scheduled preventive follow-up is overdue. Clinic care coordination outreach required.',
        patientMessageTemplate: 'You have an overdue health follow-up. Please contact your clinic to reschedule.',
        isActive: true
      }
    ];

    this.seedSyntheticData();
  }

  seedSyntheticData() {
    // Seed clinic
    const clinic = {
      id: 'clinic-metro-health-001',
      name: 'Metro Preventive Care & Wellness Clinic',
      type: 'CLINIC',
      registrationNumber: 'REG-MH-2024-9981',
      city: 'Bengaluru',
      state: 'Karnataka',
      contactPhone: '+91-80-25598100',
      createdAt: '2026-01-01T00:00:00Z'
    };
    this.clinics.set(clinic.id, clinic);

    // Seed Doctors
    if (syntheticFixtures.doctors && syntheticFixtures.doctors.length > 0) {
      for (const d of syntheticFixtures.doctors) {
        const uId = `user-${d.id}`;
        const u = {
          id: uId,
          email: d.user.email,
          passwordHash: 'hashed_password_123',
          fullName: d.user.fullName,
          phone: d.user.phone,
          role: 'DOCTOR',
          isActive: true,
          createdAt: '2026-01-01T00:00:00Z'
        };
        this.users.set(uId, u);
        const doc = {
          id: d.id,
          userId: uId,
          clinicId: d.clinicId || clinic.id,
          medicalRegNumber: d.medicalRegNumber,
          specialization: d.specialization,
          createdAt: '2026-01-01T00:00:00Z'
        };
        this.doctors.set(doc.id, doc);
      }
    } else {
      const docUser = {
        id: 'user-doc-ananya-001',
        email: 'dr.ananya.sen@metrocare.in',
        passwordHash: 'hashed_password_123',
        fullName: 'Dr. Ananya Sen',
        phone: '+91-98111-22334',
        role: 'DOCTOR',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z'
      };
      this.users.set(docUser.id, docUser);
      const doctor = {
        id: 'doc-ananya-sen-001',
        userId: docUser.id,
        clinicId: clinic.id,
        medicalRegNumber: 'KMC-2015-87421',
        specialization: 'Internal Medicine & Preventive Cardiology',
        createdAt: '2026-01-01T00:00:00Z'
      };
      this.doctors.set(doctor.id, doctor);
    }

    // Seed Staff
    const staffUser = {
      id: 'user-staff-priya-001',
      email: 'priya.patel@metrocare.in',
      passwordHash: 'hashed_password_123',
      fullName: 'Priya Patel',
      phone: '+91-98222-33445',
      role: 'STAFF',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z'
    };
    this.users.set(staffUser.id, staffUser);

    // Seed Patients from fixtures
    if (syntheticFixtures.patients && syntheticFixtures.patients.length > 0) {
      for (const p of syntheticFixtures.patients) {
        const uId = `user-${p.id}`;
        const u = {
          id: uId,
          email: p.user.email,
          passwordHash: 'hashed_password_123',
          fullName: p.user.fullName,
          phone: p.user.phone,
          role: 'PATIENT',
          isActive: true,
          createdAt: '2026-01-01T00:00:00Z'
        };
        this.users.set(uId, u);
        const pat = {
          id: p.id,
          userId: uId,
          dateOfBirth: p.dateOfBirth,
          gender: p.gender,
          bloodGroup: p.bloodGroup,
          abhaNumber: null,
          isSyntheticDemo: true,
          createdAt: '2026-01-01T00:00:00Z'
        };
        this.patients.set(pat.id, pat);
      }
    }

    // Seed unconsented test patient
    const unconsentedUser = {
      id: 'user-unconsented-009',
      email: 'unconsented.patient@synthetic-early-demo.in',
      passwordHash: 'hashed_password_123',
      fullName: 'Unconsented Demo Patient',
      phone: '+91-98000-00000',
      role: 'PATIENT',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z'
    };
    this.users.set(unconsentedUser.id, unconsentedUser);

    const unconsentedPat = {
      id: 'p-unconsented-patient-009',
      userId: unconsentedUser.id,
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      bloodGroup: 'O+',
      abhaNumber: null,
      isSyntheticDemo: true,
      createdAt: '2026-01-01T00:00:00Z'
    };
    this.patients.set(unconsentedPat.id, unconsentedPat);

    // Seed initial active consents for Aarav Sharma and Rohan Verma
    const aaravConsent = {
      id: 'consent-aarav-001',
      patientId: 'p-aarav-sharma-001',
      clinicId: clinic.id,
      doctorId: null,
      scope: 'FULL_HISTORY',
      status: 'ACTIVE',
      grantedAt: '2026-01-01T00:00:00Z',
      expiresAt: null,
      revokedAt: null
    };
    this.patientConsents.set(aaravConsent.id, aaravConsent);

    const rohanConsent = {
      id: 'consent-rohan-001',
      patientId: 'p-rohan-verma-003',
      clinicId: clinic.id,
      doctorId: null,
      scope: 'FULL_HISTORY',
      status: 'ACTIVE',
      grantedAt: '2026-01-01T00:00:00Z',
      expiresAt: null,
      revokedAt: null
    };
    this.patientConsents.set(rohanConsent.id, rohanConsent);

    // Seed baseline historical observations for Aarav Sharma (HbA1c 5.8%, BP 130/82)
    const aaravBaseHbA1c = {
      id: 'obs-aarav-baseline-hba1c',
      patientId: 'p-aarav-sharma-001',
      sourceReportId: 'rep-aarav-baseline-001',
      encounterId: null,
      loincCode: '4548-4',
      testName: 'HbA1c',
      valueNumeric: 5.8,
      valueText: null,
      unit: '%',
      referenceLow: 4.0,
      referenceHigh: 5.6,
      observedAt: '2026-02-15T09:00:00Z',
      ocrConfidence: 0.99,
      verificationStatus: 'VERIFIED',
      verifiedByUserId: 'user-doc-ananya-001',
      verifiedAt: '2026-02-15T10:00:00Z',
      createdAt: '2026-02-15T09:00:00Z'
    };
    this.biomarkerObservations.set(aaravBaseHbA1c.id, aaravBaseHbA1c);

    const aaravBaseSysBP = {
      id: 'obs-aarav-baseline-sysbp',
      patientId: 'p-aarav-sharma-001',
      sourceReportId: 'rep-aarav-baseline-001',
      encounterId: null,
      loincCode: '8480-6',
      testName: 'Systolic BP',
      valueNumeric: 130.0,
      valueText: null,
      unit: 'mmHg',
      referenceLow: 90.0,
      referenceHigh: 120.0,
      observedAt: '2026-02-15T09:00:00Z',
      ocrConfidence: 0.99,
      verificationStatus: 'VERIFIED',
      verifiedByUserId: 'user-doc-ananya-001',
      verifiedAt: '2026-02-15T10:00:00Z',
      createdAt: '2026-02-15T09:00:00Z'
    };
    this.biomarkerObservations.set(aaravBaseSysBP.id, aaravBaseSysBP);

    const aaravBaseDiaBP = {
      id: 'obs-aarav-baseline-diabp',
      patientId: 'p-aarav-sharma-001',
      sourceReportId: 'rep-aarav-baseline-001',
      encounterId: null,
      loincCode: '8462-4',
      testName: 'Diastolic BP',
      valueNumeric: 82.0,
      valueText: null,
      unit: 'mmHg',
      referenceLow: 60.0,
      referenceHigh: 80.0,
      observedAt: '2026-02-15T09:00:00Z',
      ocrConfidence: 0.99,
      verificationStatus: 'VERIFIED',
      verifiedByUserId: 'user-doc-ananya-001',
      verifiedAt: '2026-02-15T10:00:00Z',
      createdAt: '2026-02-15T09:00:00Z'
    };
    this.biomarkerObservations.set(aaravBaseDiaBP.id, aaravBaseDiaBP);

    // Seed baseline historical observation for Meera Nair (eGFR 75.0, Creatinine 1.1)
    const meeraBaseEgfr = {
      id: 'obs-meera-baseline-egfr',
      patientId: 'p-meera-nair-002',
      sourceReportId: 'rep-meera-baseline-001',
      encounterId: null,
      loincCode: '33914-3',
      testName: 'eGFR',
      valueNumeric: 75.0,
      valueText: null,
      unit: 'mL/min/1.73m2',
      referenceLow: 90.0,
      referenceHigh: null,
      observedAt: '2026-01-10T10:00:00Z',
      ocrConfidence: 0.99,
      verificationStatus: 'VERIFIED',
      verifiedByUserId: 'user-doc-ananya-001',
      verifiedAt: '2026-01-10T11:00:00Z',
      createdAt: '2026-01-10T10:00:00Z'
    };
    this.biomarkerObservations.set(meeraBaseEgfr.id, meeraBaseEgfr);

    const meeraBaseCreatinine = {
      id: 'obs-meera-baseline-creatinine',
      patientId: 'p-meera-nair-002',
      sourceReportId: 'rep-meera-baseline-001',
      encounterId: null,
      loincCode: '2160-0',
      testName: 'Serum Creatinine',
      valueNumeric: 1.1,
      valueText: null,
      unit: 'mg/dL',
      referenceLow: 0.5,
      referenceHigh: 1.1,
      observedAt: '2026-01-10T10:00:00Z',
      ocrConfidence: 0.99,
      verificationStatus: 'VERIFIED',
      verifiedByUserId: 'user-doc-ananya-001',
      verifiedAt: '2026-01-10T11:00:00Z',
      createdAt: '2026-01-10T10:00:00Z'
    };
    this.biomarkerObservations.set(meeraBaseCreatinine.id, meeraBaseCreatinine);
  }

  // Helper to generate UUID
  genId(prefix = 'id') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  // Audit logger
  logAudit(actorUserId, actorRole, action, resourceType, resourceId, metadataJson = {}) {
    this.auditLogs.push({
      id: this.genId('audit'),
      actorUserId,
      actorRole,
      action,
      resourceType,
      resourceId,
      metadataJson,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString()
    });
  }

  // Token helper
  createToken(user) {
    const token = `jwt_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.activeTokens.set(token, {
      userId: user.id,
      email: user.email,
      role: user.role,
      expiresAt: Date.now() + 3600 * 1000
    });
    return token;
  }

  getAuthUser(headers = {}) {
    const auth = headers.Authorization || headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.substring(7).trim();
    if (token === 'expired_token') return { expired: true };
    if (token === 'malformed_token') return null;
    const session = this.activeTokens.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) return { expired: true };
    return this.users.get(session.userId);
  }

  // Consent assertion
  assertConsent(actor, patientId) {
    if (!actor) return false;
    if (actor.role === 'PATIENT') {
      const patient = this.patients.get(patientId);
      return patient && patient.userId === actor.id;
    }
    if (actor.role === 'DOCTOR' || actor.role === 'STAFF' || actor.role === 'CLINIC_ADMIN') {
      let doctor = null;
      let clinicId = null;
      if (actor.role === 'DOCTOR') {
        doctor = Array.from(this.doctors.values()).find(d => d.userId === actor.id);
        if (doctor) clinicId = doctor.clinicId;
      } else {
        clinicId = 'clinic-metro-health-001';
      }
      if (!clinicId) return false;

      // Check active consent
      for (const consent of this.patientConsents.values()) {
        if (consent.patientId === patientId && consent.clinicId === clinicId && consent.status === 'ACTIVE') {
          if (consent.expiresAt && new Date(consent.expiresAt).getTime() < Date.now()) {
            consent.status = 'EXPIRED';
            continue;
          }
          if (consent.doctorId && doctor && consent.doctorId !== doctor.id) {
            continue;
          }
          return true;
        }
      }
    }
    return false;
  }

  // Early signal rules evaluator
  evaluateRules(patientId) {
    const observations = Array.from(this.biomarkerObservations.values())
      .filter(o => o.patientId === patientId && o.verificationStatus === 'VERIFIED')
      .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());

    // 1. BP Elevated Review
    const bps = observations.filter(o => o.testName === 'Systolic BP' || o.testName === 'Diastolic BP');
    const latestSys = bps.filter(o => o.testName === 'Systolic BP').slice(-1)[0];
    const latestDia = bps.filter(o => o.testName === 'Diastolic BP').slice(-1)[0];
    if (latestSys && latestDia) {
      if (latestSys.valueNumeric >= 140 || latestDia.valueNumeric >= 90) {
        const existing = Array.from(this.earlySignalFlags.values()).find(
          f => f.patientId === patientId && f.ruleCode === 'BP_ELEVATED_REVIEW' && f.status === 'PENDING_REVIEW'
        );
        if (!existing) {
          const rule = this.rules.find(r => r.ruleCode === 'BP_ELEVATED_REVIEW');
          const flag = {
            id: this.genId('flag'),
            patientId,
            ruleId: rule.id,
            ruleCode: 'BP_ELEVATED_REVIEW',
            observationId: latestSys.id,
            severity: 'REVIEW_NEEDED',
            clinicianMessage: `Elevated Blood Pressure recorded (Systolic: ${latestSys.valueNumeric} mmHg, Diastolic: ${latestDia.valueNumeric} mmHg). Clinical review and repeat assessment indicated per NP-NCD / JNC guidelines.`,
            patientMessage: 'Your previous report contains a finding that may need review. Please discuss it with your doctor.',
            status: 'PENDING_REVIEW',
            reviewedByDoctorId: null,
            reviewedAt: null,
            clinicianNote: null,
            createdAt: new Date().toISOString()
          };
          this.earlySignalFlags.set(flag.id, flag);
        }
      }
    }

    // 2. HbA1c Drift (>= 0.5% drift over history or HbA1c >= 6.5%)
    const hba1cs = observations.filter(o => o.testName === 'HbA1c' || o.testName === 'Glycated Hemoglobin' || o.loincCode === '4548-4');
    if (hba1cs.length >= 2) {
      const baseline = hba1cs[0];
      const latest = hba1cs[hba1cs.length - 1];
      const delta = +(latest.valueNumeric - baseline.valueNumeric).toFixed(2);
      if (delta >= 0.5 || latest.valueNumeric >= 6.5) {
        const existing = Array.from(this.earlySignalFlags.values()).find(
          f => f.patientId === patientId && f.ruleCode === 'HBA1C_DRIFT_6M' && f.status === 'PENDING_REVIEW'
        );
        if (!existing) {
          const rule = this.rules.find(r => r.ruleCode === 'HBA1C_DRIFT_6M');
          const flag = {
            id: this.genId('flag'),
            patientId,
            ruleId: rule.id,
            ruleCode: 'HBA1C_DRIFT_6M',
            observationId: latest.id,
            severity: 'PRIORITY',
            clinicianMessage: `Longitudinal Glycemic Drift detected: HbA1c increased from ${baseline.valueNumeric}% to ${latest.valueNumeric}% (+${delta}% delta). Reassessment and metabolic review indicated.`,
            patientMessage: 'Your previous report contains a finding that may need review. Please discuss it with your doctor.',
            status: 'PENDING_REVIEW',
            reviewedByDoctorId: null,
            reviewedAt: null,
            clinicianNote: null,
            createdAt: new Date().toISOString()
          };
          this.earlySignalFlags.set(flag.id, flag);
        }
      }
    }

    // 3. eGFR Decline (>= 15% decline)
    const egfrs = observations.filter(o => o.testName === 'eGFR' || o.testName === 'Estimated GFR' || o.loincCode === '33914-3');
    if (egfrs.length >= 2) {
      const baseline = egfrs[0];
      const latest = egfrs[egfrs.length - 1];
      const declinePct = +(((baseline.valueNumeric - latest.valueNumeric) / baseline.valueNumeric) * 100).toFixed(1);
      if (declinePct >= 15.0) {
        const existing = Array.from(this.earlySignalFlags.values()).find(
          f => f.patientId === patientId && f.ruleCode === 'EGFR_DECLINE_REVIEW' && f.status === 'PENDING_REVIEW'
        );
        if (!existing) {
          const rule = this.rules.find(r => r.ruleCode === 'EGFR_DECLINE_REVIEW');
          const flag = {
            id: this.genId('flag'),
            patientId,
            ruleId: rule.id,
            ruleCode: 'EGFR_DECLINE_REVIEW',
            observationId: latest.id,
            severity: 'PRIORITY',
            clinicianMessage: `Estimated GFR decline detected (from ${baseline.valueNumeric} to ${latest.valueNumeric} mL/min/1.73m2, ${declinePct}% reduction). Renal function monitoring indicated.`,
            patientMessage: 'Your previous report contains a finding that may need review. Please discuss it with your doctor.',
            status: 'PENDING_REVIEW',
            reviewedByDoctorId: null,
            reviewedAt: null,
            clinicianNote: null,
            createdAt: new Date().toISOString()
          };
          this.earlySignalFlags.set(flag.id, flag);
        }
      }
    }
  }

  // Handle request in simulation mode
  handleRequest({ method, path, headers = {}, body = null }) {
    const timestamp = new Date().toISOString();
    const urlObj = new URL(path, 'http://localhost:8080');
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // Fast return envelopes
    const ok = (data, status = 200) => ({
      status,
      json: { success: true, data, error: null, timestamp }
    });
    const err = (code, message, status = 400, details = []) => ({
      status,
      json: { success: false, data: null, error: { code, message, details }, timestamp }
    });

    const user = this.getAuthUser(headers);
    if (user && user.expired) {
      return err('UNAUTHORIZED', 'Access token has expired', 401);
    }

    // Public /auth endpoints
    if (pathname === '/api/v1/auth/register' && method === 'POST') {
      if (!body || Object.keys(body).length === 0) {
        return err('VALIDATION_ERROR', 'Request body cannot be empty', 400);
      }
      if (!body.email || !body.password || !body.fullName || !body.role) {
        return err('VALIDATION_ERROR', 'Missing required registration fields', 400);
      }
      if (!body.email.includes('@')) {
        return err('VALIDATION_ERROR', 'Invalid email format', 400);
      }
      const existing = Array.from(this.users.values()).find(u => u.email.toLowerCase() === body.email.toLowerCase());
      if (existing) {
        return err('CONFLICT', 'User with this email already exists', 409);
      }
      const uId = this.genId('user');
      const newUser = {
        id: uId,
        email: body.email.toLowerCase(),
        passwordHash: `hash_${body.password}`,
        fullName: body.fullName,
        phone: body.phone || null,
        role: body.role,
        isActive: true,
        createdAt: timestamp
      };
      this.users.set(uId, newUser);

      let patientId = null;
      let doctorId = null;
      let clinicId = body.clinicId || 'clinic-metro-health-001';

      if (body.role === 'PATIENT') {
        patientId = this.genId('p');
        const pat = {
          id: patientId,
          userId: uId,
          dateOfBirth: body.dateOfBirth || '1985-01-01',
          gender: body.gender || 'MALE',
          bloodGroup: body.bloodGroup || null,
          abhaNumber: body.abhaNumber || null,
          isSyntheticDemo: body.isSyntheticDemo || false,
          createdAt: timestamp
        };
        this.patients.set(patientId, pat);
      } else if (body.role === 'DOCTOR') {
        doctorId = this.genId('doc');
        const doc = {
          id: doctorId,
          userId: uId,
          clinicId,
          medicalRegNumber: body.medicalRegNumber || 'REG-PENDING',
          specialization: body.specialization || 'General Medicine',
          createdAt: timestamp
        };
        this.doctors.set(doctorId, doc);
      }

      const accessToken = this.createToken(newUser);
      const refreshToken = `ref_${newUser.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      return ok({
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        user: {
          id: uId,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          patientId,
          doctorId,
          clinicId
        }
      }, 201);
    }

    if (pathname === '/api/v1/auth/login' && method === 'POST') {
      if (!body || !body.email || !body.password) {
        return err('VALIDATION_ERROR', 'Email and password are required', 400);
      }
      const email = (body.email || '').trim().toLowerCase();
      const matched = Array.from(this.users.values()).find(u => u.email.toLowerCase() === email);
      const isCorrectPassword = matched && (
        (matched.passwordHash === 'hashed_password_123' && (body.password === 'hashed_password_123' || body.password === 'TestSecurePassword123!' || body.password === 'password123' || body.password === 'TestSecure123!')) ||
        matched.passwordHash === `hash_${body.password}`
      );
      if (!matched || !isCorrectPassword) {
        return err('UNAUTHORIZED', 'Invalid email or password', 401);
      }
      const accessToken = this.createToken(matched);
      const refreshToken = `ref_${matched.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      let patientId = null;
      let doctorId = null;
      let clinicId = null;
      if (matched.role === 'PATIENT') {
        const pat = Array.from(this.patients.values()).find(p => p.userId === matched.id);
        if (pat) patientId = pat.id;
      } else if (matched.role === 'DOCTOR') {
        const doc = Array.from(this.doctors.values()).find(d => d.userId === matched.id);
        if (doc) {
          doctorId = doc.id;
          clinicId = doc.clinicId;
        }
      } else if (matched.role === 'STAFF') {
        clinicId = 'clinic-metro-health-001';
      }

      return ok({
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        user: {
          id: matched.id,
          email: matched.email,
          fullName: matched.fullName,
          role: matched.role,
          patientId,
          doctorId,
          clinicId
        }
      });
    }

    if (pathname === '/api/v1/auth/refresh' && method === 'POST') {
      if (!body || !body.refreshToken) {
        return err('VALIDATION_ERROR', 'Refresh token is required', 400);
      }
      const parts = body.refreshToken.split('_');
      if (parts.length < 3 || parts[0] !== 'ref') {
        return err('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
      }
      const uId = parts[1];
      const matched = this.users.get(uId);
      if (!matched) return err('UNAUTHORIZED', 'User not found for token', 401);
      const newAccessToken = this.createToken(matched);
      const newRefreshToken = `ref_${matched.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      return ok({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600
      });
    }

    // OCR internal endpoint
    if (pathname === '/internal/extract' && method === 'POST') {
      const rawText = (typeof body === 'string' ? body : (body && body.text)) || '';
      const isUnsupported = body && body.fileType && body.fileType.includes('application/x-msdownload');
      if (isUnsupported) {
        return err('UNSUPPORTED_FILE', 'Unsupported file type for OCR extraction', 422);
      }

      // Check PII masking
      const maskedName = '[PATIENT_NAME_REDACTED]';
      const maskedPhone = '[PHONE_REDACTED]';
      const maskedAddress = '[ADDRESS_REDACTED]';

      const observations = [];
      if (rawText.includes('GLYCATED HEMOGLOBIN') || rawText.includes('HbA1c')) {
        observations.push({
          testName: 'HbA1c',
          loincCode: '4548-4',
          valueNumeric: 6.4,
          valueText: null,
          unit: '%',
          referenceLow: 4.0,
          referenceHigh: 5.6,
          isAbnormal: true,
          ocrConfidence: 0.98,
          verificationStatus: 'PENDING_VERIFICATION'
        });
      }
      if (rawText.includes('Systolic BP') || rawText.includes('BLOOD PRESSURE')) {
        observations.push({
          testName: 'Systolic BP',
          loincCode: '8480-6',
          valueNumeric: 146.0,
          valueText: null,
          unit: 'mmHg',
          referenceLow: 90.0,
          referenceHigh: 120.0,
          isAbnormal: true,
          ocrConfidence: 0.99,
          verificationStatus: 'PENDING_VERIFICATION'
        });
        observations.push({
          testName: 'Diastolic BP',
          loincCode: '8462-4',
          valueNumeric: 92.0,
          valueText: null,
          unit: 'mmHg',
          referenceLow: 60.0,
          referenceHigh: 80.0,
          isAbnormal: true,
          ocrConfidence: 0.99,
          verificationStatus: 'PENDING_VERIFICATION'
        });
      }
      if (rawText.includes('HEMOGLOBIN (Hb)') || rawText.includes('COMPLETE BLOOD COUNT')) {
        observations.push({
          testName: 'Hemoglobin',
          loincCode: '718-7',
          valueNumeric: 9.8,
          valueText: null,
          unit: 'g/dL',
          referenceLow: 13.0,
          referenceHigh: 17.0,
          isAbnormal: true,
          ocrConfidence: 0.96,
          verificationStatus: 'PENDING_VERIFICATION'
        });
      }
      if (rawText.includes('ESTIMATED GFR') || rawText.includes('eGFR')) {
        observations.push({
          testName: 'eGFR',
          loincCode: '33914-3',
          valueNumeric: 58.0,
          valueText: null,
          unit: 'mL/min/1.73m2',
          referenceLow: 90.0,
          referenceHigh: null,
          isAbnormal: true,
          ocrConfidence: 0.97,
          verificationStatus: 'PENDING_VERIFICATION'
        });
      }

      return ok({
        success: true,
        extractedAt: timestamp,
        documentMetadata: {
          sourceProviderName: 'Metro Diagnostic Services',
          reportDate: '2026-10-15',
          reportType: 'LAB_REPORT',
          confidence: 0.98
        },
        patientDemographics: {
          maskedName,
          maskedPhone,
          maskedAddress,
          age: 48,
          gender: 'MALE'
        },
        observations,
        warnings: []
      });
    }

    // Authenticated endpoints require valid user
    if (!user) {
      return err('UNAUTHORIZED', 'Authentication token required or invalid', 401);
    }

    // GET /api/v1/auth/me
    if (pathname === '/api/v1/auth/me' && method === 'GET') {
      let patientId = null;
      let doctorId = null;
      let clinicId = null;
      if (user.role === 'PATIENT') {
        const pat = Array.from(this.patients.values()).find(p => p.userId === user.id);
        if (pat) patientId = pat.id;
      } else if (user.role === 'DOCTOR') {
        const doc = Array.from(this.doctors.values()).find(d => d.userId === user.id);
        if (doc) {
          doctorId = doc.id;
          clinicId = doc.clinicId;
        }
      } else if (user.role === 'STAFF') {
        clinicId = 'clinic-metro-health-001';
      }
      return ok({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        patientId,
        doctorId,
        clinicId
      });
    }

    // ---------------- Patients ----------------
    if (pathname === '/api/v1/patients/me' && method === 'GET') {
      if (user.role !== 'PATIENT') {
        return err('FORBIDDEN', 'Only patients can access /patients/me', 403);
      }
      const pat = Array.from(this.patients.values()).find(p => p.userId === user.id);
      if (!pat) return err('NOT_FOUND', 'Patient record not found', 404);
      return ok({
        id: pat.id,
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: pat.dateOfBirth,
        gender: pat.gender,
        bloodGroup: pat.bloodGroup,
        abhaNumber: pat.abhaNumber,
        isSyntheticDemo: pat.isSyntheticDemo
      });
    }

    if (pathname === '/api/v1/patients' && method === 'GET') {
      if (user.role === 'PATIENT') {
        return err('FORBIDDEN', 'Patients cannot search patient directory', 403);
      }
      let clinicId = 'clinic-metro-health-001';
      if (user.role === 'DOCTOR') {
        const doc = Array.from(this.doctors.values()).find(d => d.userId === user.id);
        if (doc) clinicId = doc.clinicId;
      }
      // Return patients who have active consent with this clinic
      const consentedPatientIds = new Set();
      for (const consent of this.patientConsents.values()) {
        if (consent.clinicId === clinicId && consent.status === 'ACTIVE') {
          consentedPatientIds.add(consent.patientId);
        }
      }
      const query = (searchParams.get('q') || '').toLowerCase().trim();
      const results = [];
      for (const pid of consentedPatientIds) {
        const pat = this.patients.get(pid);
        if (pat) {
          const u = this.users.get(pat.userId);
          const fullName = u ? u.fullName : 'Patient';
          if (!query || fullName.toLowerCase().includes(query)) {
            results.push({
              id: pat.id,
              fullName,
              gender: pat.gender,
              dateOfBirth: pat.dateOfBirth,
              bloodGroup: pat.bloodGroup
            });
          }
        }
      }
      return ok(results);
    }

    // Match /api/v1/patients/{patientId}
    const patientMatch = pathname.match(/^\/api\/v1\/patients\/([^\/]+)$/);
    if (patientMatch && method === 'GET') {
      const pId = patientMatch[1];
      const pat = this.patients.get(pId);
      if (!pat) return err('NOT_FOUND', 'Patient not found', 404);
      if (!this.assertConsent(user, pId)) {
        return err('CONSENT_REQUIRED', 'Active patient consent is required to access this record.', 403);
      }
      const u = this.users.get(pat.userId);
      this.logAudit(user.id, user.role, 'RECORD_VIEWED', 'PATIENT', pId);
      return ok({
        id: pat.id,
        userId: pat.userId,
        fullName: u ? u.fullName : 'Patient',
        email: u ? u.email : null,
        phone: u ? u.phone : null,
        dateOfBirth: pat.dateOfBirth,
        gender: pat.gender,
        bloodGroup: pat.bloodGroup,
        isSyntheticDemo: pat.isSyntheticDemo
      });
    }

    // Match /api/v1/patients/{patientId}/timeline
    const timelineMatch = pathname.match(/^\/api\/v1\/patients\/([^\/]+)\/timeline$/);
    if (timelineMatch && method === 'GET') {
      const pId = timelineMatch[1];
      if (!this.patients.has(pId)) return err('NOT_FOUND', 'Patient not found', 404);
      if (!this.assertConsent(user, pId)) {
        return err('CONSENT_REQUIRED', 'Active patient consent is required to access this record.', 403);
      }
      const fromDate = searchParams.get('fromDate');
      const toDate = searchParams.get('toDate');
      if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
        return err('VALIDATION_ERROR', 'fromDate cannot be after toDate', 400);
      }

      const timeline = [];
      // Add reports
      for (const rep of this.medicalReports.values()) {
        if (rep.patientId === pId) {
          timeline.push({
            type: 'REPORT',
            id: rep.id,
            date: rep.reportDate,
            title: rep.title,
            status: rep.extractionStatus
          });
        }
      }
      // Add observations
      for (const obs of this.biomarkerObservations.values()) {
        if (obs.patientId === pId && obs.verificationStatus === 'VERIFIED') {
          timeline.push({
            type: 'OBSERVATION',
            id: obs.id,
            date: obs.observedAt.split('T')[0],
            title: `${obs.testName}: ${obs.valueNumeric} ${obs.unit}`,
            isAbnormal: obs.referenceHigh && obs.valueNumeric > obs.referenceHigh
          });
        }
      }
      // Add encounters
      for (const enc of this.encounters.values()) {
        if (enc.patientId === pId) {
          timeline.push({
            type: 'ENCOUNTER',
            id: enc.id,
            date: enc.encounterDate.split('T')[0],
            title: enc.chiefComplaint || 'Consultation Encounter',
            summary: user.role === 'PATIENT' ? enc.patientFriendlySummary : enc.clinicalAssessment
          });
        }
      }
      // Add follow-ups
      for (const fu of this.followUps.values()) {
        if (fu.patientId === pId) {
          timeline.push({
            type: 'FOLLOW_UP',
            id: fu.id,
            date: fu.dueDate,
            title: fu.title,
            status: fu.status
          });
        }
      }
      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return ok(timeline);
    }

    // ---------------- Consents ----------------
    if (pathname === '/api/v1/consents' && method === 'GET') {
      if (user.role !== 'PATIENT') {
        return err('FORBIDDEN', 'Only patients can list their consents', 403);
      }
      const pat = Array.from(this.patients.values()).find(p => p.userId === user.id);
      if (!pat) return err('NOT_FOUND', 'Patient record not found', 404);
      const list = Array.from(this.patientConsents.values()).filter(c => c.patientId === pat.id);
      return ok(list);
    }

    if (pathname === '/api/v1/consents' && method === 'POST') {
      if (user.role !== 'PATIENT') {
        return err('FORBIDDEN', 'Only patients can grant consent', 403);
      }
      if (!body || !body.clinicId) {
        return err('VALIDATION_ERROR', 'clinicId is required to grant consent', 400);
      }
      if (body.expiresAt && new Date(body.expiresAt).getTime() < Date.now()) {
        return err('VALIDATION_ERROR', 'Consent expiration date cannot be in the past', 400);
      }
      const pat = Array.from(this.patients.values()).find(p => p.userId === user.id);
      if (!pat) return err('NOT_FOUND', 'Patient record not found', 404);

      const consentId = this.genId('consent');
      const consent = {
        id: consentId,
        patientId: pat.id,
        clinicId: body.clinicId,
        doctorId: body.doctorId || null,
        scope: body.scope || 'FULL_HISTORY',
        status: 'ACTIVE',
        grantedAt: timestamp,
        expiresAt: body.expiresAt || null,
        revokedAt: null
      };
      this.patientConsents.set(consentId, consent);
      this.logAudit(user.id, user.role, 'CONSENT_GRANTED', 'PATIENT_CONSENT', consentId, { clinicId: body.clinicId });
      return ok(consent, 201);
    }

    const revokeMatch = pathname.match(/^\/api\/v1\/consents\/([^\/]+)\/revoke$/);
    if (revokeMatch && method === 'POST') {
      if (user.role !== 'PATIENT') {
        return err('FORBIDDEN', 'Only patients can revoke consent', 403);
      }
      const cId = revokeMatch[1];
      const consent = this.patientConsents.get(cId);
      if (!consent) return err('NOT_FOUND', 'Consent record not found', 404);
      const pat = Array.from(this.patients.values()).find(p => p.userId === user.id);
      if (!pat || consent.patientId !== pat.id) {
        return err('FORBIDDEN', 'Cannot revoke consent for another patient', 403);
      }
      if (consent.status === 'REVOKED') {
        return err('CONFLICT', 'Consent is already revoked', 409);
      }
      consent.status = 'REVOKED';
      consent.revokedAt = timestamp;
      this.logAudit(user.id, user.role, 'CONSENT_REVOKED', 'PATIENT_CONSENT', cId);
      return ok(consent);
    }

    // ---------------- Reports & Verification ----------------
    if (pathname === '/api/v1/reports/upload' && method === 'POST') {
      if (!body) return err('VALIDATION_ERROR', 'Report payload required', 400);
      if (!body.patientId || !body.title) {
        return err('VALIDATION_ERROR', 'patientId and title are required', 400);
      }
      if (!this.patients.has(body.patientId)) {
        return err('NOT_FOUND', 'Patient not found', 404);
      }
      if (user.role === 'DOCTOR' && !this.assertConsent(user, body.patientId)) {
        return err('CONSENT_REQUIRED', 'Active patient consent is required to upload reports', 403);
      }
      if (body.missingFile || body.hasFile === false) {
        return err('VALIDATION_ERROR', 'Report file is required', 400);
      }
      if (body.fileSize === 0 || (body.file && body.file.size === 0)) {
        return err('VALIDATION_ERROR', 'File cannot be zero bytes', 400);
      }
      const file = body.file;
      const mime = body.mimeType || (file && file.type) || '';
      const fname = body.fileName || (file && file.name) || '';
      if (mime && !['application/pdf', 'image/png', 'image/jpeg', 'text/plain'].includes(mime)) {
        return err('UNSUPPORTED_FILE', 'Unsupported file type for report upload', 422);
      }
      if (fname && (fname.endsWith('.exe') || fname.endsWith('.bin') || fname.endsWith('.sh') || fname.endsWith('.bat'))) {
        return err('UNSUPPORTED_FILE', 'Unsupported file extension', 422);
      }

      const reportId = this.genId('rep');
      let obsInput = body.observations;
      if (!obsInput || obsInput.length === 0) {
        const text = (body.text || body.title || body.fileName || '').toLowerCase();
        if (text.includes('hba1c') || text.includes('glycated')) {
          obsInput = [
            { testName: 'HbA1c', loincCode: '4548-4', valueNumeric: 6.4, unit: '%', referenceLow: 4.0, referenceHigh: 5.6 },
            { testName: 'Systolic BP', loincCode: '8480-6', valueNumeric: 146.0, unit: 'mmHg', referenceLow: 90.0, referenceHigh: 120.0 },
            { testName: 'Diastolic BP', loincCode: '8462-4', valueNumeric: 92.0, unit: 'mmHg', referenceLow: 60.0, referenceHigh: 80.0 }
          ];
        } else if (text.includes('renal') || text.includes('egfr') || text.includes('creatinine')) {
          obsInput = [
            { testName: 'Serum Creatinine', loincCode: '2160-0', valueNumeric: 1.5, unit: 'mg/dL', referenceLow: 0.5, referenceHigh: 1.1 },
            { testName: 'eGFR', loincCode: '33914-3', valueNumeric: 58.0, unit: 'mL/min/1.73m2', referenceLow: 90.0, referenceHigh: null }
          ];
        } else if (text.includes('cbc') || text.includes('anemia') || text.includes('hemoglobin') || text.includes('blood')) {
          obsInput = [
            { testName: 'Hemoglobin', loincCode: '718-7', valueNumeric: 9.8, unit: 'g/dL', referenceLow: 13.0, referenceHigh: 17.0 },
            { testName: 'Serum Ferritin', loincCode: '24-336', valueNumeric: 12.0, unit: 'ng/mL', referenceLow: 24.0, referenceHigh: 336.0 }
          ];
        } else {
          obsInput = [];
        }
      }
      const observations = obsInput.map(obs => {
        const obsId = this.genId('obs');
        const o = {
          id: obsId,
          patientId: body.patientId,
          sourceReportId: reportId,
          encounterId: null,
          loincCode: obs.loincCode || null,
          testName: obs.testName,
          valueNumeric: obs.valueNumeric !== undefined ? obs.valueNumeric : null,
          valueText: obs.valueText || null,
          unit: obs.unit,
          referenceLow: obs.referenceLow !== undefined ? obs.referenceLow : null,
          referenceHigh: obs.referenceHigh !== undefined ? obs.referenceHigh : null,
          observedAt: body.reportDate || timestamp,
          ocrConfidence: obs.ocrConfidence || 0.95,
          verificationStatus: 'PENDING_VERIFICATION',
          verifiedByUserId: null,
          verifiedAt: null,
          createdAt: timestamp
        };
        this.biomarkerObservations.set(obsId, o);
        return o;
      });

      const report = {
        id: reportId,
        patientId: body.patientId,
        uploadedByUserId: user.id,
        clinicId: body.clinicId || 'clinic-metro-health-001',
        title: body.title,
        reportType: body.reportType || 'LAB_REPORT',
        sourceProviderName: body.sourceProviderName || 'Diagnostic Lab',
        reportDate: body.reportDate || timestamp.split('T')[0],
        fileStorageKey: `storage/reports/${reportId}.pdf`,
        fileMimeType: body.mimeType || 'application/pdf',
        fileSha256: crypto.createHash('sha256').update(reportId).digest('hex'),
        extractionStatus: observations.length > 0 ? 'NEEDS_REVIEW' : 'PROCESSING',
        rawOcrJson: { observations },
        createdAt: timestamp
      };
      this.medicalReports.set(reportId, report);
      this.logAudit(user.id, user.role, 'REPORT_UPLOADED', 'MEDICAL_REPORT', reportId);
      return ok({
        reportId,
        extractionStatus: report.extractionStatus,
        observations
      }, 201);
    }

    const patientReportsMatch = pathname.match(/^\/api\/v1\/patients\/([^\/]+)\/reports$/);
    if (patientReportsMatch && method === 'GET') {
      const pId = patientReportsMatch[1];
      if (!this.assertConsent(user, pId)) {
        return err('CONSENT_REQUIRED', 'Active patient consent is required to access reports', 403);
      }
      const list = Array.from(this.medicalReports.values()).filter(r => r.patientId === pId);
      return ok(list);
    }

    const reportVerifyMatch = pathname.match(/^\/api\/v1\/reports\/([^\/]+)\/verify$/);
    if (reportVerifyMatch && method === 'POST') {
      const rId = reportVerifyMatch[1];
      const report = this.medicalReports.get(rId);
      if (!report) return err('NOT_FOUND', 'Report not found', 404);
      if (!this.assertConsent(user, report.patientId)) {
        return err('CONSENT_REQUIRED', 'Consent required to verify report', 403);
      }
      if (!body || !body.observations || !Array.isArray(body.observations) || body.observations.length === 0) {
        return err('VALIDATION_ERROR', 'observations array is required and must not be empty for verification', 400);
      }

      // Update observation values and status
      for (const item of body.observations) {
        let obs = null;
        if (item.observationId) {
          obs = this.biomarkerObservations.get(item.observationId);
        }
        if (!obs) {
          const obsId = this.genId('obs');
          obs = {
            id: obsId,
            patientId: report.patientId,
            sourceReportId: rId,
            encounterId: null,
            loincCode: item.loincCode || null,
            testName: item.testName,
            valueNumeric: item.valueNumeric,
            valueText: item.valueText || null,
            unit: item.unit,
            referenceLow: item.referenceLow,
            referenceHigh: item.referenceHigh,
            observedAt: report.reportDate ? `${report.reportDate}T10:00:00Z` : timestamp,
            ocrConfidence: 1.0,
            verificationStatus: 'PENDING_VERIFICATION',
            createdAt: timestamp
          };
          this.biomarkerObservations.set(obsId, obs);
        }
        if (item.action === 'REJECT') {
          obs.verificationStatus = 'REJECTED';
        } else {
          obs.valueNumeric = item.valueNumeric !== undefined ? item.valueNumeric : obs.valueNumeric;
          obs.verificationStatus = 'VERIFIED';
          obs.verifiedByUserId = user.id;
          obs.verifiedAt = timestamp;
        }
      }

      report.extractionStatus = 'VERIFIED';
      this.logAudit(user.id, user.role, 'VALUE_VERIFIED', 'MEDICAL_REPORT', rId, { observationCount: body.observations.length });
      
      // Trigger deterministic rules evaluation
      this.evaluateRules(report.patientId);

      return ok({
        reportId: rId,
        status: 'VERIFIED',
        verifiedObservations: Array.from(this.biomarkerObservations.values()).filter(o => o.sourceReportId === rId)
      });
    }

    const reportDetailMatch = pathname.match(/^\/api\/v1\/reports\/([^\/]+)$/);
    if (reportDetailMatch && method === 'GET') {
      const rId = reportDetailMatch[1];
      const report = this.medicalReports.get(rId);
      if (!report) return err('NOT_FOUND', 'Report not found', 404);
      if (!this.assertConsent(user, report.patientId)) {
        return err('CONSENT_REQUIRED', 'Active patient consent is required to access this report', 403);
      }
      const observations = Array.from(this.biomarkerObservations.values()).filter(o => o.sourceReportId === rId);
      return ok({
        ...report,
        observations
      });
    }

    const reportDownloadMatch = pathname.match(/^\/api\/v1\/reports\/([^\/]+)\/download$/);
    if (reportDownloadMatch && method === 'GET') {
      const rId = reportDownloadMatch[1];
      const report = this.medicalReports.get(rId);
      if (!report) return err('NOT_FOUND', 'Report not found', 404);
      if (!this.assertConsent(user, report.patientId)) {
        return err('CONSENT_REQUIRED', 'Active patient consent is required to download this report', 403);
      }
      this.logAudit(user.id, user.role, 'REPORT_DOWNLOADED', 'MEDICAL_REPORT', rId);
      return ok({
        fileStorageKey: report.fileStorageKey,
        mimeType: report.fileMimeType,
        downloadUrl: `https://mock-storage.early.health/${rId}`
      });
    }

    // ---------------- Biomarker Observations & Trends ----------------
    const obsListMatch = pathname.match(/^\/api\/v1\/patients\/([^\/]+)\/observations$/);
    if (obsListMatch && method === 'GET') {
      const pId = obsListMatch[1];
      if (!this.assertConsent(user, pId)) {
        return err('CONSENT_REQUIRED', 'Consent required to view observations', 403);
      }
      const testName = searchParams.get('testName');
      const loincCode = searchParams.get('loincCode');
      const fromDate = searchParams.get('fromDate');
      const toDate = searchParams.get('toDate');

      let list = Array.from(this.biomarkerObservations.values()).filter(o => o.patientId === pId && o.verificationStatus === 'VERIFIED');
      if (testName) {
        list = list.filter(o => o.testName.toLowerCase() === testName.toLowerCase());
      }
      if (loincCode) {
        list = list.filter(o => o.loincCode === loincCode);
      }
      if (fromDate) {
        list = list.filter(o => new Date(o.observedAt) >= new Date(fromDate));
      }
      if (toDate) {
        list = list.filter(o => new Date(o.observedAt) <= new Date(toDate));
      }
      list.sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
      return ok(list);
    }

    const trendsMatch = pathname.match(/^\/api\/v1\/patients\/([^\/]+)\/observations\/trends$/);
    if (trendsMatch && method === 'GET') {
      const pId = trendsMatch[1];
      if (!this.assertConsent(user, pId)) {
        return err('CONSENT_REQUIRED', 'Consent required to view biomarker trends', 403);
      }
      const testName = searchParams.get('testName') || 'HbA1c';
      const obs = Array.from(this.biomarkerObservations.values())
        .filter(o => o.patientId === pId && o.verificationStatus === 'VERIFIED' && o.testName.toLowerCase() === testName.toLowerCase())
        .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());

      const points = obs.map(o => ({
        observedAt: o.observedAt,
        valueNumeric: o.valueNumeric,
        sourceReportId: o.sourceReportId
      }));

      const refLow = obs.length > 0 ? obs[0].referenceLow : 4.0;
      const refHigh = obs.length > 0 ? obs[0].referenceHigh : 5.6;
      const unit = obs.length > 0 ? obs[0].unit : '%';

      return ok({
        testName,
        unit,
        refLow,
        refHigh,
        points
      });
    }

    // ---------------- Encounters & Treatments ----------------
    const encounterMatch = pathname.match(/^\/api\/v1\/patients\/([^\/]+)\/encounters$/);
    if (encounterMatch && method === 'GET') {
      const pId = encounterMatch[1];
      if (!this.assertConsent(user, pId)) {
        return err('CONSENT_REQUIRED', 'Consent required to view encounters', 403);
      }
      const list = Array.from(this.encounters.values()).filter(e => e.patientId === pId);
      return ok(list);
    }

    if (encounterMatch && method === 'POST') {
      if (user.role !== 'DOCTOR') {
        return err('FORBIDDEN', 'Only doctors can record clinical encounters', 403);
      }
      const pId = encounterMatch[1];
      if (!this.assertConsent(user, pId)) {
        return err('CONSENT_REQUIRED', 'Consent required to record encounter', 403);
      }
      if (!body || !body.encounterDate) {
        return err('VALIDATION_ERROR', 'encounterDate is required', 400);
      }
      const doc = Array.from(this.doctors.values()).find(d => d.userId === user.id);
      const encId = this.genId('enc');
      const encounter = {
        id: encId,
        patientId: pId,
        doctorId: doc ? doc.id : 'doc-ananya-sen-001',
        clinicId: doc ? doc.clinicId : 'clinic-metro-health-001',
        encounterDate: body.encounterDate,
        chiefComplaint: body.chiefComplaint || null,
        clinicalAssessment: body.clinicalAssessment || null,
        patientFriendlySummary: body.patientFriendlySummary || 'Routine Consultation',
        createdAt: timestamp
      };
      this.encounters.set(encId, encounter);

      // Handle inline observations
      if (body.observations && Array.isArray(body.observations)) {
        for (const obs of body.observations) {
          const obsId = this.genId('obs');
          this.biomarkerObservations.set(obsId, {
            id: obsId,
            patientId: pId,
            sourceReportId: null,
            encounterId: encId,
            loincCode: obs.loincCode || null,
            testName: obs.testName,
            valueNumeric: obs.valueNumeric,
            valueText: obs.valueText || null,
            unit: obs.unit,
            referenceLow: obs.referenceLow,
            referenceHigh: obs.referenceHigh,
            observedAt: body.encounterDate,
            ocrConfidence: 1.0,
            verificationStatus: 'VERIFIED',
            verifiedByUserId: user.id,
            verifiedAt: timestamp,
            createdAt: timestamp
          });
        }
      }

      // Handle inline treatments
      if (body.treatments && Array.isArray(body.treatments)) {
        for (const tr of body.treatments) {
          const trId = this.genId('tr');
          this.treatments.set(trId, {
            id: trId,
            patientId: pId,
            encounterId: encId,
            doctorId: doc ? doc.id : 'doc-ananya-sen-001',
            treatmentType: tr.treatmentType || 'MEDICATION',
            name: tr.name,
            dosage: tr.dosage || null,
            frequency: tr.frequency || null,
            startDate: tr.startDate || body.encounterDate.split('T')[0],
            endDate: tr.endDate || null,
            status: tr.status || 'ACTIVE',
            notes: tr.notes || null
          });
        }
      }

      this.logAudit(user.id, user.role, 'ENCOUNTER_CREATED', 'ENCOUNTER', encId);
      this.evaluateRules(pId);
      return ok(encounter, 201);
    }

    const patientTreatmentsMatch = pathname.match(/^\/api\/v1\/patients\/([^\/]+)\/treatments$/);
    if (patientTreatmentsMatch && method === 'GET') {
      const pId = patientTreatmentsMatch[1];
      if (!this.assertConsent(user, pId)) {
        return err('CONSENT_REQUIRED', 'Consent required to view treatments', 403);
      }
      const list = Array.from(this.treatments.values()).filter(t => t.patientId === pId);
      return ok(list);
    }

    const patchTreatmentMatch = pathname.match(/^\/api\/v1\/treatments\/([^\/]+)$/);
    if (patchTreatmentMatch && method === 'PATCH') {
      if (user.role !== 'DOCTOR') {
        return err('FORBIDDEN', 'Only doctors can update treatments', 403);
      }
      const trId = patchTreatmentMatch[1];
      const tr = this.treatments.get(trId);
      if (!tr) return err('NOT_FOUND', 'Treatment not found', 404);
      if (!body || !body.status) {
        return err('VALIDATION_ERROR', 'status is required', 400);
      }
      if (!['ACTIVE', 'COMPLETED', 'DISCONTINUED'].includes(body.status)) {
        return err('VALIDATION_ERROR', 'Invalid treatment status', 400);
      }
      tr.status = body.status;
      if (body.notes) tr.notes = body.notes;
      this.logAudit(user.id, user.role, 'TREATMENT_UPDATED', 'TREATMENT', trId, { status: body.status });
      return ok(tr);
    }

    // ---------------- Preventive Rules & Early Signals ----------------
    if (pathname === '/api/v1/rules' && method === 'GET') {
      if (user.role !== 'DOCTOR' && user.role !== 'CLINIC_ADMIN') {
        return err('FORBIDDEN', 'Only doctors and admins can list rules', 403);
      }
      return ok(this.rules.filter(r => r.isActive));
    }

    const patientSignalsMatch = pathname.match(/^\/api\/v1\/patients\/([^\/]+)\/signals$/);
    if (patientSignalsMatch && method === 'GET') {
      const pId = patientSignalsMatch[1];
      if (!this.assertConsent(user, pId)) {
        return err('CONSENT_REQUIRED', 'Consent required to view signals', 403);
      }
      const flags = Array.from(this.earlySignalFlags.values()).filter(f => f.patientId === pId);
      if (user.role === 'PATIENT') {
        // Patient projection: plain calm non-diagnostic message ONLY
        const projected = flags.map(f => ({
          id: f.id,
          patientMessage: f.patientMessage,
          status: f.status,
          createdAt: f.createdAt
        }));
        return ok(projected);
      } else {
        // Doctor projection: full clinical metric, rule code, severity, actions
        return ok(flags);
      }
    }

    const reviewSignalMatch = pathname.match(/^\/api\/v1\/signals\/([^\/]+)\/review$/);
    if (reviewSignalMatch && method === 'POST') {
      if (user.role !== 'DOCTOR') {
        return err('FORBIDDEN', 'Only doctors can review clinical signals', 403);
      }
      if (!body || !body.status) {
        return err('VALIDATION_ERROR', 'status is required', 400);
      }
      if (!['ACKNOWLEDGED', 'ACTIONED', 'DISMISSED'].includes(body.status)) {
        return err('VALIDATION_ERROR', 'status must be ACKNOWLEDGED, ACTIONED, or DISMISSED', 400);
      }
      const sId = reviewSignalMatch[1];
      const flag = this.earlySignalFlags.get(sId);
      if (!flag) return err('NOT_FOUND', 'Signal flag not found', 404);
      if (!['ACKNOWLEDGED', 'ACTIONED', 'DISMISSED'].includes(body.status)) {
        return err('VALIDATION_ERROR', 'Invalid review status', 400);
      }
      if (flag.status === 'ACTIONED' && body.status === 'PENDING_REVIEW') {
        return err('CONFLICT', 'Invalid state transition from ACTIONED to PENDING_REVIEW', 409);
      }
      const doc = Array.from(this.doctors.values()).find(d => d.userId === user.id);
      flag.status = body.status;
      flag.reviewedByDoctorId = doc ? doc.id : 'doc-ananya-sen-001';
      flag.reviewedAt = timestamp;
      flag.clinicianNote = body.clinicianNote || null;
      this.logAudit(user.id, user.role, 'SIGNAL_REVIEWED', 'EARLY_SIGNAL_FLAG', sId, { status: body.status });
      return ok(flag);
    }

    // ---------------- Follow-Up Management & Clinic Dashboard ----------------
    const patientFollowUpsMatch = pathname.match(/^\/api\/v1\/patients\/([^\/]+)\/follow-ups$/);
    if (patientFollowUpsMatch && method === 'GET') {
      const pId = patientFollowUpsMatch[1];
      if (!this.assertConsent(user, pId)) {
        return err('CONSENT_REQUIRED', 'Consent required to view follow-ups', 403);
      }
      const list = Array.from(this.followUps.values()).filter(f => f.patientId === pId);
      return ok(list);
    }

    if (patientFollowUpsMatch && method === 'POST') {
      if (user.role !== 'DOCTOR' && user.role !== 'STAFF') {
        return err('FORBIDDEN', 'Only doctors or staff can create follow-ups', 403);
      }
      const pId = patientFollowUpsMatch[1];
      if (!this.assertConsent(user, pId)) {
        return err('CONSENT_REQUIRED', 'Consent required to create follow-up', 403);
      }
      if (!body || !body.title || !body.actionType || !body.dueDate) {
        return err('VALIDATION_ERROR', 'title, actionType, and dueDate are required', 400);
      }
      if (new Date(body.dueDate).getTime() < new Date(timestamp.split('T')[0]).getTime()) {
        return err('VALIDATION_ERROR', 'dueDate cannot be in the past when creating follow-up', 400);
      }
      const doc = Array.from(this.doctors.values()).find(d => d.userId === user.id);
      const fuId = this.genId('fu');
      const followUp = {
        id: fuId,
        patientId: pId,
        doctorId: doc ? doc.id : 'doc-ananya-sen-001',
        clinicId: doc ? doc.clinicId : 'clinic-metro-health-001',
        signalFlagId: body.signalFlagId || null,
        encounterId: body.encounterId || null,
        title: body.title,
        actionType: body.actionType,
        dueDate: body.dueDate,
        status: body.status || 'PENDING',
        completedAt: null,
        notes: body.notes || null,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      this.followUps.set(fuId, followUp);
      this.logAudit(user.id, user.role, 'FOLLOWUP_CREATED', 'FOLLOW_UP', fuId);
      return ok(followUp, 201);
    }

    const patchFollowUpStatusMatch = pathname.match(/^\/api\/v1\/follow-ups\/([^\/]+)\/status$/);
    if (patchFollowUpStatusMatch && method === 'PATCH') {
      if (user.role !== 'DOCTOR' && user.role !== 'STAFF') {
        return err('FORBIDDEN', 'Only clinicians or staff can update follow-up status', 403);
      }
      const fuId = patchFollowUpStatusMatch[1];
      const fu = this.followUps.get(fuId);
      if (!fu) return err('NOT_FOUND', 'Follow-up not found', 404);
      if (!body || !body.status) {
        return err('VALIDATION_ERROR', 'status is required', 400);
      }
      if (!['COMPLETED', 'POSTPONED', 'CANCELLED', 'PENDING', 'OVERDUE'].includes(body.status)) {
        return err('VALIDATION_ERROR', 'Invalid follow-up status', 400);
      }
      fu.status = body.status;
      if (body.status === 'COMPLETED') {
        fu.completedAt = timestamp;
      }
      if (body.newDueDate) {
        fu.dueDate = body.newDueDate;
      }
      if (body.notes) {
        fu.notes = body.notes;
      }
      fu.updatedAt = timestamp;
      this.logAudit(user.id, user.role, 'FOLLOWUP_STATUS_UPDATED', 'FOLLOW_UP', fuId, { status: body.status });
      return ok(fu);
    }

    if (pathname === '/api/v1/clinic/dashboard/summary' && method === 'GET') {
      if (user.role === 'PATIENT') {
        return err('FORBIDDEN', 'Patients cannot access clinic operational dashboard', 403);
      }
      const clinicId = 'clinic-metro-health-001';
      // Calculate KPIs
      const consentedPatients = new Set();
      for (const consent of this.patientConsents.values()) {
        if (consent.clinicId === clinicId && consent.status === 'ACTIVE') {
          consentedPatients.add(consent.patientId);
        }
      }
      const clinicFollowUps = Array.from(this.followUps.values()).filter(f => f.clinicId === clinicId);
      const followUpsDue = clinicFollowUps.filter(f => f.status === 'PENDING').length;
      const followUpsOverdue = clinicFollowUps.filter(f => f.status === 'OVERDUE').length;
      const followUpsCompleted = clinicFollowUps.filter(f => f.status === 'COMPLETED').length;

      const reviewFlags = Array.from(this.earlySignalFlags.values()).filter(
        f => f.status === 'PENDING_REVIEW' && consentedPatients.has(f.patientId)
      );
      const patientsNeedingReview = new Set(reviewFlags.map(f => f.patientId)).size;

      return ok({
        clinicId,
        totalPatients: consentedPatients.size,
        followUpsDue,
        followUpsOverdue,
        followUpsCompleted,
        patientsNeedingReview
      });
    }

    if (pathname === '/api/v1/clinic/follow-ups' && method === 'GET') {
      if (user.role === 'PATIENT') {
        return err('FORBIDDEN', 'Patients cannot access clinic follow-up worklist', 403);
      }
      const clinicId = 'clinic-metro-health-001';
      const list = Array.from(this.followUps.values())
        .filter(f => f.clinicId === clinicId)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      return ok(list);
    }

    // ---------------- Correction Requests & Audit Logs ----------------
    if (pathname === '/api/v1/correction-requests' && method === 'POST') {
      if (user.role !== 'PATIENT') {
        return err('FORBIDDEN', 'Only patients can submit correction requests', 403);
      }
      if (!body || !body.requestedChange) {
        return err('VALIDATION_ERROR', 'requestedChange is required', 400);
      }
      const pat = Array.from(this.patients.values()).find(p => p.userId === user.id);
      if (!pat) return err('NOT_FOUND', 'Patient record not found', 404);

      const crId = this.genId('cr');
      const req = {
        id: crId,
        patientId: pat.id,
        observationId: body.observationId || null,
        reportId: body.reportId || null,
        requestedChange: body.requestedChange,
        status: 'OPEN',
        resolvedByUserId: null,
        createdAt: timestamp
      };
      this.correctionRequests.set(crId, req);
      this.logAudit(user.id, user.role, 'CORRECTION_REQUESTED', 'CORRECTION_REQUEST', crId);
      return ok(req, 201);
    }

    if (pathname === '/api/v1/correction-requests' && method === 'GET') {
      let list = Array.from(this.correctionRequests.values());
      if (user.role === 'PATIENT') {
        const pat = Array.from(this.patients.values()).find(p => p.userId === user.id);
        if (!pat) return ok([]);
        list = list.filter(r => r.patientId === pat.id);
      }
      return ok(list);
    }

    const patchCorrectionMatch = pathname.match(/^\/api\/v1\/correction-requests\/([^\/]+)$/);
    if (patchCorrectionMatch && method === 'PATCH') {
      if (user.role === 'PATIENT') {
        return err('FORBIDDEN', 'Patients cannot resolve correction requests', 403);
      }
      const crId = patchCorrectionMatch[1];
      const cr = this.correctionRequests.get(crId);
      if (!cr) return err('NOT_FOUND', 'Correction request not found', 404);
      if (!body || !body.status || !['RESOLVED', 'REJECTED'].includes(body.status)) {
        return err('VALIDATION_ERROR', 'status must be RESOLVED or REJECTED', 400);
      }
      cr.status = body.status;
      cr.resolvedByUserId = user.id;
      this.logAudit(user.id, user.role, 'CORRECTION_RESOLVED', 'CORRECTION_REQUEST', crId, { status: body.status });
      return ok(cr);
    }

    if (pathname === '/api/v1/audit-logs' && method === 'GET') {
      let logs = [...this.auditLogs];
      if (user.role === 'PATIENT') {
        logs = logs.filter(l => l.actorUserId === user.id || l.resourceId === user.id);
      }
      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return ok({
        items: logs,
        total: logs.length
      });
    }

    return err('NOT_FOUND', `Route not found: ${method} ${pathname}`, 404);
  }
}

// Global simulation singleton instance
export const simulationEngine = new ApiSimulationEngine();

/**
 * EarlyApiClient provides uniform interface for live HTTP and mock execution
 */
export class EarlyApiClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8080/api/v1';
    this.ocrUrl = options.ocrUrl || 'http://localhost:8000';
    this.mode = options.mode || (process.env.E2E_MODE === 'live' ? 'live' : 'mock');
    this.token = options.token || null;
    this.simulation = simulationEngine;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request(method, path, body = null, customHeaders = {}) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const headers = { ...customHeaders };

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token && !headers.Authorization && !headers.authorization) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.mode === 'mock') {
      let mockBody = body;
      if (isFormData) {
        mockBody = {};
        for (const [key, value] of body.entries()) {
          mockBody[key] = value;
        }
      }
      const response = this.simulation.handleRequest({ method, path, headers, body: mockBody });
      return {
        status: response.status,
        ok: response.status >= 200 && response.status < 300,
        data: response.json
      };
    } else {
      // Live HTTP execution
      let fullUrl = path.startsWith('http') ? path : `${this.baseUrl}${path.replace(/^\/api\/v1/, '')}`;
      if (path.startsWith('/internal')) {
        fullUrl = `${this.ocrUrl}${path}`;
      }
      try {
        const fetchOptions = {
          method,
          headers
        };
        if (body !== null && method !== 'GET' && method !== 'HEAD') {
          if (isFormData) {
            // In live mode with FormData, omit Content-Type so fetch sets boundary automatically
            delete fetchOptions.headers['Content-Type'];
            fetchOptions.body = body;
          } else {
            fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
          }
        }
        const res = await fetch(fullUrl, fetchOptions);
        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          data = await res.text();
        }
        return {
          status: res.status,
          ok: res.ok,
          data
        };
      } catch (err) {
        return {
          status: 503,
          ok: false,
          data: {
            success: false,
            data: null,
            error: { code: 'SERVICE_UNAVAILABLE', message: err.message, details: [] }
          }
        };
      }
    }
  }

  get(path, headers = {}) {
    return this.request('GET', path, null, headers);
  }

  post(path, body = {}, headers = {}) {
    return this.request('POST', path, body, headers);
  }

  patch(path, body = {}, headers = {}) {
    return this.request('PATCH', path, body, headers);
  }

  delete(path, headers = {}) {
    return this.request('DELETE', path, null, headers);
  }

  createHeaders(token = this.token, customHeaders = {}) {
    const headers = { 'Content-Type': 'application/json', ...customHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  assertEnvelope(res) {
    if (!res || typeof res !== 'object') {
      throw new Error(`Invalid response object: expected object, got ${typeof res}`);
    }
    const payload = res.data;
    if (!payload || typeof payload !== 'object') {
      throw new Error(`Response missing JSON payload body: status ${res.status}`);
    }
    if (typeof payload.success !== 'boolean') {
      throw new Error(`Envelope missing boolean 'success' field: ${JSON.stringify(payload)}`);
    }
    if (!payload.timestamp || isNaN(Date.parse(payload.timestamp))) {
      throw new Error(`Envelope missing valid ISO8601 'timestamp' field: ${payload.timestamp}`);
    }

    if (payload.success) {
      if (payload.error !== null) {
        throw new Error(`Success response must have error = null, got: ${JSON.stringify(payload.error)}`);
      }
    } else {
      if (payload.data !== null) {
        throw new Error(`Error response must have data = null, got: ${JSON.stringify(payload.data)}`);
      }
      if (!payload.error || typeof payload.error.code !== 'string' || typeof payload.error.message !== 'string') {
        throw new Error(`Error response missing code/message structure: ${JSON.stringify(payload.error)}`);
      }
    }
    return true;
  }

  async registerOrLogin(role, credentials = {}) {
    const email = credentials.email || `test-${role.toLowerCase()}-${Date.now()}@early-test.in`;
    const password = credentials.password || 'TestSecure123!';
    const fullName = credentials.fullName || `Test ${role}`;

    // Attempt login first
    const loginRes = await this.post('/api/v1/auth/login', { email, password });
    if (loginRes.ok && loginRes.data?.data?.accessToken) {
      this.setToken(loginRes.data.data.accessToken);
      return { token: loginRes.data.data.accessToken, user: loginRes.data.data.user, isNew: false, res: loginRes };
    }

    // Otherwise register
    const regPayload = {
      email,
      password,
      fullName,
      role,
      phone: credentials.phone || '+91-98765-00000',
      ...(role === 'DOCTOR' && {
        medicalRegNumber: credentials.medicalRegNumber || 'KMC-TEST-99999',
        specialization: credentials.specialization || 'Internal Medicine',
        clinicId: credentials.clinicId || 'clinic-metro-health-001'
      }),
      ...(role === 'PATIENT' && {
        dateOfBirth: credentials.dateOfBirth || '1985-01-01',
        gender: credentials.gender || 'MALE',
        bloodGroup: credentials.bloodGroup || 'B+'
      })
    };

    const regRes = await this.post('/api/v1/auth/register', regPayload);
    if (!regRes.ok || !regRes.data?.data?.accessToken) {
      throw new Error(`Failed to registerOrLogin for role ${role}: ${JSON.stringify(regRes.data)}`);
    }

    this.setToken(regRes.data.data.accessToken);
    return { token: regRes.data.data.accessToken, user: regRes.data.data.user, isNew: true, res: regRes };
  }

  async uploadReport(options, customHeaders = {}) {
    const {
      patientId,
      fileBuffer,
      fileName = 'report.txt',
      mimeType = 'text/plain',
      title,
      reportType = 'LAB_REPORT',
      reportDate,
      sourceProviderName,
      observations,
      token,
      headers: optHeaders,
      missingFile
    } = options;

    const effectiveHeaders = { ...customHeaders, ...(optHeaders || {}) };
    if (token) {
      effectiveHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (this.mode === 'mock') {
      const payload = {
        patientId,
        title,
        reportType,
        mimeType,
        fileName,
        reportDate,
        sourceProviderName,
        observations,
        missingFile
      };
      if (fileBuffer) {
        payload.file = { name: fileName, type: mimeType, size: fileBuffer.length };
        payload.fileSize = fileBuffer.length;
      }
      return this.post('/api/v1/reports/upload', payload, effectiveHeaders);
    } else {
      const formData = new FormData();
      const blob = new Blob([fileBuffer || ''], { type: mimeType });
      formData.append('file', blob, fileName);
      formData.append('patientId', patientId);
      formData.append('title', title);
      formData.append('reportType', reportType);
      if (reportDate) formData.append('reportDate', reportDate);
      if (sourceProviderName) formData.append('sourceProviderName', sourceProviderName);

      return this.post('/api/v1/reports/upload', formData, effectiveHeaders);
    }
  }

  // Specialized helpers
  async login(email, password) {
    const res = await this.post('/api/v1/auth/login', { email, password });
    if (res.ok && res.data && res.data.data && res.data.data.accessToken) {
      this.setToken(res.data.data.accessToken);
    }
    return res;
  }

  async register(payload) {
    const res = await this.post('/api/v1/auth/register', payload);
    if (res.ok && res.data && res.data.data && res.data.data.accessToken) {
      this.setToken(res.data.data.accessToken);
    }
    return res;
  }
}
