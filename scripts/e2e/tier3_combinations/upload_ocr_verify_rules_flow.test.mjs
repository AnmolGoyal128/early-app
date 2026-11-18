/**
 * Tier 3 Cross-Feature Combination: Report Ingestion -> OCR -> Verification -> Rules Pipeline
 */

import { createSyntheticPdfBuffer } from '../fixtures/pdf_helper.mjs';

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 3 Flow: Upload -> OCR -> Verification -> Rules Engine', () => {
    let doctorToken = null;
    let patientToken = null;
    let patientId = null;
    let reportId = null;

    it('Flow 4: Ingestion to Verification Pipeline (Upload -> PENDING_VERIFICATION -> Doctor Verify)', async () => {
      // 1. Create a patient with baseline HbA1c 5.8%
      const patRes = await client.post('/api/v1/auth/register', {
        email: `glycemic-pipeline-${Date.now()}@early-test.in`,
        password: 'Password123!',
        fullName: 'Glycemic Pipeline Patient',
        role: 'PATIENT'
      });
      client.assertEnvelope(patRes);
      patientToken = patRes.data.data.accessToken;
      patientId = patRes.data.data.user.patientId;

      // Login doctor
      const docRes = await client.login('dr.rajesh.rao@metrocare.in', 'hashed_password_123');
      doctorToken = docRes.data.data.accessToken;

      // Patient grants consent
      await client.post('/api/v1/consents', {
        clinicId: 'clinic-metro-health-001',
        scope: 'FULL_HISTORY'
      }, client.createHeaders(patientToken));

      // Upload baseline HbA1c 5.8%
      const baseUp = await client.uploadReport({
        patientId,
        title: 'Baseline Health Checkup',
        reportDate: '2026-03-01',
        token: doctorToken,
        observations: [{ testName: 'HbA1c', valueNumeric: 5.8, unit: '%' }]
      });
      client.assertEnvelope(baseUp);
      await client.post(`/api/v1/reports/${baseUp.data.data.reportId}/verify`, {
        reportDate: '2026-03-01',
        observations: [{ testName: 'HbA1c', valueNumeric: 5.8, action: 'VERIFY' }]
      }, client.createHeaders(doctorToken));

      // 2. Upload follow-up report with HbA1c 6.4% and elevated BP
      const pdfBuffer = createSyntheticPdfBuffer('HbA1c Followup', fixtures.hba1cReportText);
      const followUp = await client.uploadReport({
        patientId,
        fileBuffer: pdfBuffer,
        title: 'Follow-up Metabolic Report',
        reportDate: '2026-10-15',
        token: doctorToken,
        observations: [
          { testName: 'HbA1c', valueNumeric: 6.4, unit: '%', ocrConfidence: 0.98 },
          { testName: 'Systolic BP', valueNumeric: 146.0, unit: 'mmHg', ocrConfidence: 0.99 },
          { testName: 'Diastolic BP', valueNumeric: 92.0, unit: 'mmHg', ocrConfidence: 0.99 }
        ]
      });
      client.assertEnvelope(followUp);
      reportId = followUp.data.data.reportId;

      // Check that newly ingested observations are PENDING_VERIFICATION
      const repDetails = await client.get(`/api/v1/reports/${reportId}`, client.createHeaders(doctorToken));
      client.assertEnvelope(repDetails);
      for (const obs of repDetails.data.data.observations) {
        assert.equal(obs.verificationStatus, 'PENDING_VERIFICATION');
      }

      // 3. Clinician verifies values
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

    it('Flow 5: Verification to Deterministic Rule Evaluation (Triggers HBA1C_DRIFT_6M and BP_ELEVATED_REVIEW)', async () => {
      // Query signals as Doctor
      const sigRes = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(sigRes);
      assert.equal(sigRes.status, 200);
      assert.ok(Array.isArray(sigRes.data.data));

      const driftFlag = sigRes.data.data.find(s => s.ruleCode === 'HBA1C_DRIFT_6M');
      const bpFlag = sigRes.data.data.find(s => s.ruleCode === 'BP_ELEVATED_REVIEW');

      assert.ok(driftFlag, 'Glycemic drift flag must trigger for delta 5.8 -> 6.4 (+0.6%)');
      assert.equal(driftFlag.severity, 'PRIORITY');
      assert.ok(bpFlag, 'Elevated BP flag must trigger for 146/92 mmHg');
      assert.equal(bpFlag.severity, 'REVIEW_NEEDED');
    });

    it('Flow 6: Dual-Language Projection Isolation Verification', async () => {
      // 1. Doctor sees clinical codes, metric deltas, and action buttons
      const docView = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(docView);
      for (const flag of docView.data.data) {
        assert.ok(flag.ruleCode, 'Doctor view must contain ruleCode');
        assert.ok(flag.clinicianMessage, 'Doctor view must contain clinicianMessage');
        assert.ok(flag.severity, 'Doctor view must contain severity');
      }

      // 2. Patient sees calm non-diagnostic message and ZERO clinical codes
      const patView = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(patientToken));
      client.assertEnvelope(patView);
      for (const flag of patView.data.data) {
        assert.equal(flag.ruleCode, undefined, 'ruleCode MUST NOT be exposed to patient');
        assert.equal(flag.clinicianMessage, undefined, 'clinicianMessage MUST NOT be exposed to patient');
        assert.equal(flag.observationId, undefined, 'observationId MUST NOT be exposed to patient');
        assert.ok(flag.patientMessage, 'patientMessage must be exposed to patient');
      }
    });
  });
}
