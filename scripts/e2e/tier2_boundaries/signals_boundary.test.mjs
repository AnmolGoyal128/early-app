/**
 * Tier 2 Boundary & Corner Cases: Early-Signal Dual Projection & Clinical Rule Boundaries
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 2: Early Signals & Rules Boundary Cases', () => {
    let doctorToken = null;
    let patientTokenAarav = null;
    let consentedPatientId = 'p-aarav-sharma-001';
    let unconsentedPatientId = 'p-unconsented-patient-009';
    let activeSignalId = null;

    it('TC-SIG-B01: Patient calling GET /rules returns 403 Forbidden', async () => {
      const loginAarav = await client.login('aarav.sharma@synthetic-early-demo.in', 'hashed_password_123');
      client.assertEnvelope(loginAarav);
      patientTokenAarav = loginAarav.data.data.accessToken;

      const res = await client.get('/api/v1/rules', client.createHeaders(patientTokenAarav));
      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'FORBIDDEN');
    });

    it('TC-SIG-B02: Patient attempting to review signal returns 403 Forbidden', async () => {
      const res = await client.post('/api/v1/signals/flag-sample-001/review', {
        status: 'DISMISSED',
        clinicianNote: 'Patient self review attempt'
      }, client.createHeaders(patientTokenAarav));

      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'FORBIDDEN');
    });

    it('TC-SIG-B03: Doctor reviews signal with invalid status string returns 400 Validation Error', async () => {
      const loginDoc = await client.login('dr.rajesh.rao@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(loginDoc);
      doctorToken = loginDoc.data.data.accessToken;

      const res = await client.post('/api/v1/signals/flag-sample-001/review', {
        status: 'INVALID_STATUS_STRING',
        clinicianNote: 'Testing invalid status'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-SIG-B04: Doctor reviews non-existent signal UUID returns 404 Not Found', async () => {
      const res = await client.post('/api/v1/signals/flag-nonexistent-999999/review', {
        status: 'ACKNOWLEDGED'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 404, 'Expected HTTP 404 Not Found');
      assert.equal(res.data.error.code, 'NOT_FOUND');
    });

    it('TC-SIG-B05: Doctor queries signals for unconsented patient returns 403 CONSENT_REQUIRED', async () => {
      const res = await client.get(`/api/v1/patients/${unconsentedPatientId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'CONSENT_REQUIRED');
    });

    it('TC-SIG-B06: Dual-language projection sanitization: Patient view has ZERO clinical codes or internal notes', async () => {
      const res = await client.get(`/api/v1/patients/${consentedPatientId}/signals`, client.createHeaders(patientTokenAarav));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));

      for (const flag of res.data.data) {
        // Assert clinical invariants
        assert.equal(flag.ruleCode, undefined, 'ruleCode must be omitted from patient projection');
        assert.equal(flag.clinicianMessage, undefined, 'clinicianMessage must be omitted from patient projection');
        assert.equal(flag.observationId, undefined, 'observationId must be omitted from patient projection');
        assert.equal(flag.clinicianNote, undefined, 'clinicianNote must be omitted from patient projection');
        assert.ok(flag.patientMessage, 'patientMessage must be present');
        assert.ok(!flag.patientMessage.includes('Hypertension') && !flag.patientMessage.includes('Diabetes'), 'Must not claim medical diagnosis');
      }
    });

    it('TC-SIG-B07: Dual-language projection: Doctor view includes ruleCode, clinicianMessage and severity', async () => {
      const res = await client.get(`/api/v1/patients/${consentedPatientId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      for (const flag of res.data.data) {
        assert.ok(flag.ruleCode, 'Doctor view must contain ruleCode');
        assert.ok(flag.clinicianMessage, 'Doctor view must contain clinicianMessage');
        assert.ok(flag.severity, 'Doctor view must contain severity');
      }
    });

    it('TC-SIG-B08: BP threshold boundary check: Systolic 139 and Diastolic 89 mmHg does NOT trigger BP_ELEVATED_REVIEW', async () => {
      // Create a test patient with normal/subthreshold BP
      const patRes = await client.post('/api/v1/auth/register', {
        email: `subthreshold-bp-${Date.now()}@early-test.in`,
        password: 'Password123!',
        fullName: 'Subthreshold BP Patient',
        role: 'PATIENT'
      });
      client.assertEnvelope(patRes);
      const subToken = patRes.data.data.accessToken;
      const subPatId = patRes.data.data.user.patientId;

      // Grant consent
      await client.post('/api/v1/consents', { clinicId: 'clinic-metro-health-001', scope: 'FULL_HISTORY' }, client.createHeaders(subToken));

      // Upload and verify BP 139/89
      const upRes = await client.uploadReport({
        patientId: subPatId,
        title: 'Normal BP Report',
        token: doctorToken,
        observations: [
          { testName: 'Systolic BP', valueNumeric: 139.0, unit: 'mmHg' },
          { testName: 'Diastolic BP', valueNumeric: 89.0, unit: 'mmHg' }
        ]
      });
      if (upRes.ok && upRes.data.data.reportId) {
        await client.post(`/api/v1/reports/${upRes.data.data.reportId}/verify`, {
          reportDate: '2026-10-15',
          observations: [
            { testName: 'Systolic BP', valueNumeric: 139.0, action: 'VERIFY' },
            { testName: 'Diastolic BP', valueNumeric: 89.0, action: 'VERIFY' }
          ]
        }, client.createHeaders(doctorToken));
      }

      const sigRes = await client.get(`/api/v1/patients/${subPatId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(sigRes);
      const bpFlag = sigRes.data.data.find(s => s.ruleCode === 'BP_ELEVATED_REVIEW');
      assert.equal(bpFlag, undefined, 'BP 139/89 must NOT trigger BP_ELEVATED_REVIEW flag');
    });

    it('TC-SIG-B09: BP threshold boundary check: Systolic 140 and Diastolic 90 mmHg DOES trigger BP_ELEVATED_REVIEW', async () => {
      // Create a test patient with exact threshold BP
      const patRes = await client.post('/api/v1/auth/register', {
        email: `threshold-bp-${Date.now()}@early-test.in`,
        password: 'Password123!',
        fullName: 'Threshold BP Patient',
        role: 'PATIENT'
      });
      client.assertEnvelope(patRes);
      const thToken = patRes.data.data.accessToken;
      const thPatId = patRes.data.data.user.patientId;

      // Grant consent
      await client.post('/api/v1/consents', { clinicId: 'clinic-metro-health-001', scope: 'FULL_HISTORY' }, client.createHeaders(thToken));

      // Upload and verify BP 140/90
      const upRes = await client.uploadReport({
        patientId: thPatId,
        title: 'Threshold BP Report',
        token: doctorToken,
        observations: [
          { testName: 'Systolic BP', valueNumeric: 140.0, unit: 'mmHg' },
          { testName: 'Diastolic BP', valueNumeric: 90.0, unit: 'mmHg' }
        ]
      });
      if (upRes.ok && upRes.data.data.reportId) {
        await client.post(`/api/v1/reports/${upRes.data.data.reportId}/verify`, {
          reportDate: '2026-10-15',
          observations: [
            { testName: 'Systolic BP', valueNumeric: 140.0, action: 'VERIFY' },
            { testName: 'Diastolic BP', valueNumeric: 90.0, action: 'VERIFY' }
          ]
        }, client.createHeaders(doctorToken));
      }

      const sigRes = await client.get(`/api/v1/patients/${thPatId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(sigRes);
      const bpFlag = sigRes.data.data.find(s => s.ruleCode === 'BP_ELEVATED_REVIEW');
      assert.ok(bpFlag, 'BP 140/90 MUST trigger BP_ELEVATED_REVIEW flag');
    });

    it('TC-SIG-B10: Signal review without status field returns 400 Validation Error', async () => {
      const res = await client.post('/api/v1/signals/flag-sample-001/review', {
        clinicianNote: 'Missing status payload'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });
  });
}
