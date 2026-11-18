/**
 * Tier 4 Clinical Journey 1: Aarav Sharma — Glycemic Drift & Hypertension Preventive Care
 * Persona: 48M, pre-diabetes, elevated blood pressure (HbA1c 5.8% -> 6.4%, BP 146/92 mmHg)
 */

import { createSyntheticPdfBuffer } from '../fixtures/pdf_helper.mjs';

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 4 Journey 1: Aarav Sharma — Glycemic Drift & Hypertension Workflow', () => {
    let patientToken = null;
    let doctorToken = null;
    let patientId = 'p-aarav-sharma-001';
    let reportId = null;
    let bpFlagId = null;
    let hba1cFlagId = null;
    let encounterId = null;
    let followUpId = null;

    it('Stage 1: Aarav Sharma logs in to Patient Portal and views baseline health overview', async () => {
      const loginRes = await client.login('aarav.sharma@synthetic-early-demo.in', 'hashed_password_123');
      client.assertEnvelope(loginRes);
      assert.equal(loginRes.status, 200);
      patientToken = loginRes.data.data.accessToken;

      const profileRes = await client.get('/api/v1/patients/me', client.createHeaders(patientToken));
      client.assertEnvelope(profileRes);
      assert.equal(profileRes.status, 200);
      assert.equal(profileRes.data.data.fullName, 'Aarav Sharma');
      assert.equal(profileRes.data.data.gender, 'MALE');
      assert.ok(profileRes.data.data.isSyntheticDemo, 'Synthetic patient invariant');
    });

    it('Stage 2: Diagnostic report ingested with HbA1c 6.4% and BP 146/92; observations default to PENDING_VERIFICATION', async () => {
      // Login as Doctor Rajesh Rao
      const docLogin = await client.login('dr.rajesh.rao@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(docLogin);
      doctorToken = docLogin.data.data.accessToken;

      const pdfBuffer = createSyntheticPdfBuffer('HbA1c Diagnostic Report', fixtures.hba1cReportText);
      const uploadRes = await client.uploadReport({
        patientId,
        fileBuffer: pdfBuffer,
        fileName: 'aarav_hba1c_oct2026.pdf',
        mimeType: 'application/pdf',
        title: 'Clinical Biochemistry & Vitals Panel',
        reportType: 'LAB_REPORT',
        reportDate: '2026-10-15',
        sourceProviderName: 'Metro Diagnostic Services',
        token: doctorToken,
        observations: [
          { testName: 'HbA1c', loincCode: '4548-4', valueNumeric: 6.4, unit: '%', referenceLow: 4.0, referenceHigh: 5.6 },
          { testName: 'Systolic BP', loincCode: '8480-6', valueNumeric: 146.0, unit: 'mmHg', referenceLow: 90.0, referenceHigh: 120.0 },
          { testName: 'Diastolic BP', loincCode: '8462-4', valueNumeric: 92.0, unit: 'mmHg', referenceLow: 60.0, referenceHigh: 80.0 }
        ]
      });

      client.assertEnvelope(uploadRes);
      assert.equal(uploadRes.status, 201);
      reportId = uploadRes.data.data.reportId;
      assert.ok(reportId);

      // Verify unverified observations state
      const repDetails = await client.get(`/api/v1/reports/${reportId}`, client.createHeaders(doctorToken));
      client.assertEnvelope(repDetails);
      assert.ok(repDetails.data.data.observations.length >= 3);
      for (const obs of repDetails.data.data.observations) {
        assert.equal(obs.verificationStatus, 'PENDING_VERIFICATION', 'Extracted observation must be PENDING_VERIFICATION');
      }
    });

    it('Stage 3: Doctor performs side-by-side verification and confirms observations', async () => {
      const verifyRes = await client.post(`/api/v1/reports/${reportId}/verify`, {
        reportDate: '2026-10-15',
        observations: [
          { testName: 'HbA1c', valueNumeric: 6.4, action: 'VERIFY' },
          { testName: 'Systolic BP', valueNumeric: 146.0, action: 'VERIFY' },
          { testName: 'Diastolic BP', valueNumeric: 92.0, action: 'VERIFY' }
        ]
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(verifyRes);
      assert.equal(verifyRes.status, 200);
      assert.equal(verifyRes.data.data.status, 'VERIFIED');
    });

    it('Stage 4: Deterministic rules evaluate verified history and trigger BP_ELEVATED_REVIEW and HBA1C_DRIFT_6M', async () => {
      const sigRes = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(sigRes);
      assert.equal(sigRes.status, 200);

      const bpFlag = sigRes.data.data.find(s => s.ruleCode === 'BP_ELEVATED_REVIEW');
      const hba1cFlag = sigRes.data.data.find(s => s.ruleCode === 'HBA1C_DRIFT_6M');

      assert.ok(bpFlag, 'BP >= 140/90 must trigger BP_ELEVATED_REVIEW');
      assert.equal(bpFlag.severity, 'REVIEW_NEEDED');
      bpFlagId = bpFlag.id;

      assert.ok(hba1cFlag, 'Longitudinal drift from 5.8% to 6.4% must trigger HBA1C_DRIFT_6M');
      assert.equal(hba1cFlag.severity, 'PRIORITY');
      hba1cFlagId = hba1cFlag.id;
    });

    it('Stage 5: Dual-language projection verification (Doctor sees codes vs. Aarav sees calm advice)', async () => {
      // 1. Doctor projection
      const docView = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(docView);
      const doctorBPFlag = docView.data.data.find(s => s.id === bpFlagId);
      assert.ok(doctorBPFlag.clinicianMessage.includes('Elevated Blood Pressure'));
      assert.equal(doctorBPFlag.ruleCode, 'BP_ELEVATED_REVIEW');

      // 2. Patient projection
      const patView = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(patientToken));
      client.assertEnvelope(patView);
      const patientBPFlag = patView.data.data.find(s => s.id === bpFlagId);
      assert.ok(patientBPFlag.patientMessage);
      assert.equal(patientBPFlag.ruleCode, undefined, 'No ruleCode in patient view');
      assert.equal(patientBPFlag.clinicianMessage, undefined, 'No clinicianMessage in patient view');
      assert.ok(
        patientBPFlag.patientMessage.includes('review') && patientBPFlag.patientMessage.includes('doctor'),
        'Patient guidance must be calm non-diagnostic copy'
      );
    });

    it('Stage 6: Doctor initiates consultation encounter, records DASH diet plan, acknowledges signals, and schedules 3-month follow-up', async () => {
      // 1. Record clinical consultation encounter
      const encRes = await client.post(`/api/v1/patients/${patientId}/encounters`, {
        encounterDate: '2026-10-16T11:00:00Z',
        chiefComplaint: 'Follow-up on elevated blood pressure and lab findings',
        clinicalAssessment: 'Stage 1 Essential Hypertension with glycemic drift. Low-sodium DASH diet recommended.',
        patientFriendlySummary: 'Reviewed recent blood pressure and sugar readings. Starting dietary changes and home blood pressure monitoring.',
        treatments: [
          {
            treatmentType: 'LIFESTYLE',
            name: 'Low Sodium DASH Diet counseling',
            dosage: '< 2g sodium daily',
            frequency: 'DAILY',
            startDate: '2026-10-16'
          }
        ]
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(encRes);
      assert.equal(encRes.status, 201);
      encounterId = encRes.data.data.id;

      // 2. Acknowledge signal flags
      await client.post(`/api/v1/signals/${bpFlagId}/review`, {
        status: 'ACTIONED',
        clinicianNote: 'Encounter documented; dietary lifestyle intervention prescribed.'
      }, client.createHeaders(doctorToken));

      await client.post(`/api/v1/signals/${hba1cFlagId}/review`, {
        status: 'ACKNOWLEDGED',
        clinicianNote: 'Glycemic drift discussed; repeat HbA1c scheduled.'
      }, client.createHeaders(doctorToken));

      // 3. Schedule 3-month follow-up
      const fuRes = await client.post(`/api/v1/patients/${patientId}/follow-ups`, {
        title: '3-Month Repeat HbA1c & Blood Pressure Review',
        actionType: 'REPEAT_TEST',
        dueDate: '2027-01-16',
        encounterId,
        notes: 'Repeat glycated hemoglobin (HPLC) and clinic BP measurement.'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(fuRes);
      assert.equal(fuRes.status, 201);
      assert.equal(fuRes.data.data.status, 'PENDING');
      followUpId = fuRes.data.data.id;
    });

    it('Stage 7: Longitudinal timeline and Recharts trends reflect the verified observations and scheduled care plan', async () => {
      // 1. Check patient timeline
      const timelineRes = await client.get(`/api/v1/patients/${patientId}/timeline`, client.createHeaders(patientToken));
      client.assertEnvelope(timelineRes);
      assert.equal(timelineRes.status, 200);
      assert.ok(timelineRes.data.data.some(i => i.type === 'REPORT'));
      assert.ok(timelineRes.data.data.some(i => i.type === 'ENCOUNTER'));
      assert.ok(timelineRes.data.data.some(i => i.type === 'FOLLOW_UP'));

      // 2. Check longitudinal HbA1c trend
      const trendRes = await client.get(`/api/v1/patients/${patientId}/observations/trends?testName=HbA1c`, client.createHeaders(doctorToken));
      client.assertEnvelope(trendRes);
      assert.equal(trendRes.status, 200);
      const trend = Array.isArray(trendRes.data.data) ? trendRes.data.data[0] : trendRes.data.data;
      assert.ok(trend && trend.points.length >= 2, 'HbA1c trend shows drift from baseline to current');
      const latestPoint = trend.points[trend.points.length - 1];
      assert.equal(latestPoint.valueNumeric, 6.4);
    });
  });
}
