/**
 * Tier 4 Clinical Journey 2: Meera Nair — Hypertension & Declining Renal Function (eGFR)
 * Persona: 54F, hypertensive, baseline eGFR 75 -> 58 mL/min/1.73m2 (22.7% decline), Creatinine 1.1 -> 1.5 mg/dL
 */

import { createSyntheticPdfBuffer } from '../fixtures/pdf_helper.mjs';

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 4 Journey 2: Meera Nair — Hypertension & Renal Monitoring Workflow', () => {
    let patientToken = null;
    let doctorToken = null;
    let staffToken = null;
    let patientId = 'p-meera-nair-002';
    let reportId = null;
    let egfrFlagId = null;
    let followUpId = null;

    it('Stage 1: Meera Nair logs in and grants central consent to Metro Preventive Care Clinic', async () => {
      const loginRes = await client.login('meera.nair@synthetic-early-demo.in', 'hashed_password_123');
      client.assertEnvelope(loginRes);
      patientToken = loginRes.data.data.accessToken;

      const grantRes = await client.post('/api/v1/consents', {
        clinicId: 'clinic-metro-health-001',
        scope: 'FULL_HISTORY'
      }, client.createHeaders(patientToken));

      client.assertEnvelope(grantRes);
      assert.equal(grantRes.status, 201);
      assert.equal(grantRes.data.data.status, 'ACTIVE');
    });

    it('Stage 2: Diagnostic renal panel report uploaded with Creatinine 1.5 and eGFR 58.0 mL/min/1.73m2', async () => {
      const docLogin = await client.login('dr.ananya.sen@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(docLogin);
      doctorToken = docLogin.data.data.accessToken;

      const pdfBuffer = createSyntheticPdfBuffer('Renal Function Test', fixtures.renalReportText);
      const uploadRes = await client.uploadReport({
        patientId,
        fileBuffer: pdfBuffer,
        fileName: 'meera_renal_panel_oct2026.pdf',
        mimeType: 'application/pdf',
        title: 'Renal Function Test & Metabolic Panel',
        reportType: 'LAB_REPORT',
        reportDate: '2026-10-20',
        sourceProviderName: 'Apex Renal & Diagnostic Care',
        token: doctorToken,
        observations: [
          { testName: 'Serum Creatinine', loincCode: '2160-0', valueNumeric: 1.5, unit: 'mg/dL', referenceLow: 0.5, referenceHigh: 1.1, ocrConfidence: 0.88 },
          { testName: 'eGFR', loincCode: '33914-3', valueNumeric: 58.0, unit: 'mL/min/1.73m2', referenceLow: 90.0, referenceHigh: null, ocrConfidence: 0.97 },
          { testName: 'Systolic BP', loincCode: '8480-6', valueNumeric: 152.0, unit: 'mmHg', referenceLow: 90.0, referenceHigh: 120.0, ocrConfidence: 0.99 },
          { testName: 'Diastolic BP', loincCode: '8462-4', valueNumeric: 96.0, unit: 'mmHg', referenceLow: 60.0, referenceHigh: 80.0, ocrConfidence: 0.99 }
        ]
      });

      client.assertEnvelope(uploadRes);
      assert.equal(uploadRes.status, 201);
      reportId = uploadRes.data.data.reportId;
      assert.ok(reportId);
    });

    it('Stage 3: Doctor verifies observations including amber confidence reading', async () => {
      const verifyRes = await client.post(`/api/v1/reports/${reportId}/verify`, {
        reportDate: '2026-10-20',
        observations: [
          { testName: 'Serum Creatinine', valueNumeric: 1.5, action: 'VERIFY' },
          { testName: 'eGFR', valueNumeric: 58.0, action: 'VERIFY' },
          { testName: 'Systolic BP', valueNumeric: 152.0, action: 'VERIFY' },
          { testName: 'Diastolic BP', valueNumeric: 96.0, action: 'VERIFY' }
        ]
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(verifyRes);
      assert.equal(verifyRes.status, 200);
      assert.equal(verifyRes.data.data.status, 'VERIFIED');
    });

    it('Stage 4: Deterministic rule EGFR_DECLINE_REVIEW triggers on 22.7% filtration drop from baseline 75.0', async () => {
      const sigRes = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(sigRes);
      assert.equal(sigRes.status, 200);

      const egfrFlag = sigRes.data.data.find(s => s.ruleCode === 'EGFR_DECLINE_REVIEW');
      assert.ok(egfrFlag, 'eGFR decline of 22.7% must trigger EGFR_DECLINE_REVIEW');
      assert.equal(egfrFlag.severity, 'PRIORITY');
      egfrFlagId = egfrFlag.id;
    });

    it('Stage 5: Doctor schedules urgent repeat RFT follow-up and Meera appears in clinic triage queue', async () => {
      // 1. Doctor schedules follow-up
      const fuRes = await client.post(`/api/v1/patients/${patientId}/follow-ups`, {
        title: 'Repeat Renal Function Test (Serum Creatinine & eGFR)',
        actionType: 'REPEAT_TEST',
        dueDate: '2026-11-20',
        signalFlagId: egfrFlagId,
        notes: 'Confirm eGFR drop; correlate with spot urine albumin-creatinine ratio (uACR).'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(fuRes);
      assert.equal(fuRes.status, 201);
      followUpId = fuRes.data.data.id;

      // 2. Staff views clinic triage queue
      const loginStaff = await client.login('priya.patel@metrocare.in', 'hashed_password_123');
      staffToken = loginStaff.data.data.accessToken;

      const queueRes = await client.get('/api/v1/clinic/follow-ups', client.createHeaders(staffToken));
      client.assertEnvelope(queueRes);
      assert.equal(queueRes.status, 200);
      const meeraTask = queueRes.data.data.find(f => f.patientId === patientId);
      assert.ok(meeraTask, 'Meera Nair must be present in clinic follow-up worklist');
    });

    it('Stage 6: Care coordinator postpones follow-up with documented clinical reason', async () => {
      const postponeRes = await client.patch(`/api/v1/follow-ups/${followUpId}/status`, {
        status: 'POSTPONED',
        newDueDate: '2026-11-28',
        notes: 'Patient scheduled for Nephrology consult next Tuesday; repeat RFT ordered.'
      }, client.createHeaders(staffToken));

      client.assertEnvelope(postponeRes);
      assert.equal(postponeRes.status, 200);
      assert.equal(postponeRes.data.data.status, 'POSTPONED');
      assert.equal(postponeRes.data.data.dueDate, '2026-11-28');
    });

    it('Stage 7: Clinic Operational Dashboard summary reflects updated patients and triage metrics', async () => {
      const summaryRes = await client.get('/api/v1/clinic/dashboard/summary', client.createHeaders(doctorToken));
      client.assertEnvelope(summaryRes);
      assert.equal(summaryRes.status, 200);
      assert.ok(summaryRes.data.data.totalPatients >= 2);
      assert.ok(summaryRes.data.data.patientsNeedingReview >= 1);
    });
  });
}
