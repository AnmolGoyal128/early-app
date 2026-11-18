/**
 * Tier 1 Feature Coverage: F06 & F07 - Observation Verification & Longitudinal Recharts Trends
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 1: F06 & F07 - Observations & Verification', () => {
    let doctorToken = null;
    let patientId = 'p-aarav-sharma-001';
    let reportId = null;

    it('TC-OBS-01: Clinician verifies report observations via POST /reports/{id}/verify', async () => {
      // Login as Dr. Rajesh Rao
      const loginRes = await client.login('dr.rajesh.rao@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(loginRes);
      doctorToken = loginRes.data.data.accessToken;

      // Upload report to verify
      const upRes = await client.uploadReport({
        patientId,
        title: 'October 2026 HbA1c Lab Report',
        reportType: 'LAB_REPORT',
        reportDate: '2026-10-15',
        token: doctorToken,
        observations: [
          { testName: 'HbA1c', loincCode: '4548-4', valueNumeric: 6.4, unit: '%', referenceLow: 4.0, referenceHigh: 5.6 },
          { testName: 'Systolic BP', loincCode: '8480-6', valueNumeric: 146.0, unit: 'mmHg', referenceLow: 90.0, referenceHigh: 120.0 },
          { testName: 'Diastolic BP', loincCode: '8462-4', valueNumeric: 92.0, unit: 'mmHg', referenceLow: 60.0, referenceHigh: 80.0 }
        ]
      });
      client.assertEnvelope(upRes);
      reportId = upRes.data.data.reportId;

      const verifyRes = await client.post(`/api/v1/reports/${reportId}/verify`, {
        reportDate: '2026-10-15',
        observations: [
          { testName: 'HbA1c', valueNumeric: 6.4, unit: '%', action: 'VERIFY' },
          { testName: 'Systolic BP', valueNumeric: 146.0, unit: 'mmHg', action: 'VERIFY' },
          { testName: 'Diastolic BP', valueNumeric: 92.0, unit: 'mmHg', action: 'VERIFY' }
        ]
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(verifyRes);
      assert.equal(verifyRes.status, 200, 'Expected HTTP 200 OK');
      assert.equal(verifyRes.data.data.status, 'VERIFIED');
    });

    it('TC-OBS-02: Verified observations contain verifiedByUserId and verifiedAt', async () => {
      const res = await client.get(`/api/v1/patients/${patientId}/observations`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const verified = res.data.data.filter(o => o.verificationStatus === 'VERIFIED');
      assert.ok(verified.length > 0, 'Must have verified observations');
      for (const obs of verified) {
        assert.ok(obs.verifiedByUserId, 'verifiedByUserId must be recorded');
        assert.ok(obs.verifiedAt, 'verifiedAt must be recorded');
      }
    });

    it('TC-OBS-03: Query patient observations list returns verified biomarkers', async () => {
      const res = await client.get(`/api/v1/patients/${patientId}/observations`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.some(o => o.testName === 'HbA1c'));
      assert.ok(res.data.data.some(o => o.testName === 'Systolic BP'));
    });

    it('TC-OBS-04: Filter observations by testName=HbA1c', async () => {
      const res = await client.get(
        `/api/v1/patients/${patientId}/observations?testName=HbA1c`,
        client.createHeaders(doctorToken)
      );
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(res.data.data.length > 0);
      assert.ok(res.data.data.every(o => o.testName === 'HbA1c' || o.testName === 'Glycated Hemoglobin'));
    });

    it('TC-OBS-05: Query longitudinal trends formatted for Recharts', async () => {
      const res = await client.get(
        `/api/v1/patients/${patientId}/observations/trends?testName=HbA1c`,
        client.createHeaders(doctorToken)
      );
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const trendData = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
      assert.ok(trendData && Array.isArray(trendData.points), 'Trend data must contain points array');
      assert.ok(trendData.points.length >= 2, 'Should contain at least 2 points (baseline + followup)');
    });

    it('TC-OBS-06: Longitudinal trend points strictly ordered chronologically', async () => {
      const res = await client.get(
        `/api/v1/patients/${patientId}/observations/trends?testName=HbA1c`,
        client.createHeaders(doctorToken)
      );
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const trendData = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
      for (let i = 1; i < trendData.points.length; i++) {
        const prev = new Date(trendData.points[i - 1].observedAt).getTime();
        const curr = new Date(trendData.points[i].observedAt).getTime();
        assert.ok(curr >= prev, 'Trend points must be sorted in ascending chronological order');
      }
    });
  });
}
