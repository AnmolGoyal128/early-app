/**
 * Tier 1 Feature Coverage: F09 - Deterministic Early-Signal Rules Engine & Dual Projection
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 1: F09 - Early Signals & Deterministic Rules', () => {
    let doctorToken = null;
    let patientToken = null;
    let patientId = 'p-aarav-sharma-001';
    let signalId = null;

    it('TC-SIG-01: Doctor queries rule catalog GET /rules', async () => {
      // Login as Dr. Rajesh Rao
      const loginDoc = await client.post('/api/v1/auth/login', {
        email: 'dr.rajesh.rao@metrocare.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginDoc);
      doctorToken = loginDoc.data.data.accessToken;

      const res = await client.get('/api/v1/rules', client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
      const ruleCodes = res.data.data.map(r => r.ruleCode);
      assert.ok(ruleCodes.includes('BP_ELEVATED_REVIEW'), 'Must include BP rule');
      assert.ok(ruleCodes.includes('HBA1C_DRIFT_6M'), 'Must include HbA1c rule');
    });

    it('TC-SIG-02: Deterministic BP rule generates active signal flag on verified BP >= 140/90', async () => {
      // Ensure Aarav Sharma has verified elevated BP and HbA1c observations
      const obsRes = await client.get(`/api/v1/patients/${patientId}/observations`, client.createHeaders(doctorToken));
      const hasElevatedBP = obsRes.ok && obsRes.data.data.some(o => o.testName === 'Systolic BP' && o.valueNumeric >= 140 && o.verificationStatus === 'VERIFIED');
      if (!hasElevatedBP) {
        const upRes = await client.uploadReport({
          patientId,
          title: 'Aarav Vitals & Metabolic Report',
          reportType: 'LAB_REPORT',
          reportDate: '2026-10-15',
          token: doctorToken,
          observations: [
            { testName: 'HbA1c', loincCode: '4548-4', valueNumeric: 6.4, unit: '%', referenceLow: 4.0, referenceHigh: 5.6 },
            { testName: 'Systolic BP', loincCode: '8480-6', valueNumeric: 146.0, unit: 'mmHg', referenceLow: 90.0, referenceHigh: 120.0 },
            { testName: 'Diastolic BP', loincCode: '8462-4', valueNumeric: 92.0, unit: 'mmHg', referenceLow: 60.0, referenceHigh: 80.0 }
          ]
        });
        if (upRes.ok && upRes.data.data.reportId) {
          await client.post(`/api/v1/reports/${upRes.data.data.reportId}/verify`, {
            reportDate: '2026-10-15',
            observations: [
              { testName: 'HbA1c', valueNumeric: 6.4, unit: '%', action: 'VERIFY' },
              { testName: 'Systolic BP', valueNumeric: 146.0, unit: 'mmHg', action: 'VERIFY' },
              { testName: 'Diastolic BP', valueNumeric: 92.0, unit: 'mmHg', action: 'VERIFY' }
            ]
          }, client.createHeaders(doctorToken));
        }
      }

      const res = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
      const bpFlag = res.data.data.find(s => s.ruleCode === 'BP_ELEVATED_REVIEW');
      assert.ok(bpFlag, 'BP_ELEVATED_REVIEW flag must be triggered for 146/92 BP');
      assert.equal(bpFlag.severity, 'REVIEW_NEEDED');
      signalId = bpFlag.id;
    });

    it('TC-SIG-03: Deterministic glycemic drift rule generates active signal flag for HbA1c increase >= 0.5%', async () => {
      const res = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const hba1cFlag = res.data.data.find(s => s.ruleCode === 'HBA1C_DRIFT_6M');
      assert.ok(hba1cFlag, 'HBA1C_DRIFT_6M flag must be triggered for drift 5.8 -> 6.4');
      assert.equal(hba1cFlag.severity, 'PRIORITY');
    });

    it('TC-SIG-04: Doctor projection includes full clinical alert message and rule details', async () => {
      const res = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const bpFlag = res.data.data.find(s => s.ruleCode === 'BP_ELEVATED_REVIEW');
      assert.ok(bpFlag.clinicianMessage, 'Doctor view must include clinicianMessage');
      assert.ok(bpFlag.ruleCode, 'Doctor view must include ruleCode');
      assert.ok(bpFlag.severity, 'Doctor view must include severity');
    });

    it('TC-SIG-05: Patient projection delivers calm non-diagnostic message and hides clinical jargon', async () => {
      const loginPat = await client.post('/api/v1/auth/login', {
        email: 'aarav.sharma@synthetic-early-demo.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginPat);
      patientToken = loginPat.data.data.accessToken;

      const res = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(patientToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
      for (const flag of res.data.data) {
        assert.ok(flag.patientMessage, 'Must provide calm patientMessage');
        assert.ok(!flag.clinicianMessage, 'Patient projection MUST NOT leak clinicianMessage');
        assert.ok(!flag.ruleCode, 'Patient projection MUST NOT leak clinical ruleCode');
        assert.ok(!flag.observationId, 'Patient projection MUST NOT leak observationId');
        assert.ok(flag.patientMessage.includes('review') || flag.patientMessage.includes('doctor'), 'Message must be calm and advisory');
      }
    });

    it('TC-SIG-06: Doctor reviews and acknowledges early signal flag via POST /signals/{id}/review', async () => {
      const res = await client.post(`/api/v1/signals/${signalId}/review`, {
        status: 'ACKNOWLEDGED',
        clinicianNote: 'Noted elevated BP; initiated lifestyle and follow-up protocol.'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.status, 'ACKNOWLEDGED');
      assert.ok(res.data.data.reviewedAt);
    });
  });
}
