/**
 * Tier 3 Cross-Feature Combination: Correction Governance & Immutable Audit Logging Pipeline
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 3 Flow: Correction Governance, Longitudinal Trends & Audit Trails', () => {
    let patientToken = null;
    let staffToken = null;
    let doctorToken = null;
    let patientId = 'p-rohan-verma-003';
    let correctionId = null;

    it('Flow 10: Correction Request Governance Pipeline (Submit -> Review -> RESOLVED)', async () => {
      // 1. Patient Rohan logs in and submits correction request
      const loginPat = await client.login('rohan.verma@synthetic-early-demo.in', 'hashed_password_123');
      client.assertEnvelope(loginPat);
      patientToken = loginPat.data.data.accessToken;

      const submitRes = await client.post('/api/v1/correction-requests', {
        targetType: 'OBSERVATION',
        targetId: 'obs-rohan-hgb-001',
        issueDescription: 'Hemoglobin reading was recorded from preliminary slip; please verify against final lab sheet.',
        requestedChange: 'Verify if reading is 9.8 g/dL or 10.0 g/dL'
      }, client.createHeaders(patientToken));

      client.assertEnvelope(submitRes);
      assert.equal(submitRes.status, 201);
      assert.equal(submitRes.data.data.status, 'OPEN');
      correctionId = submitRes.data.data.id;

      // 2. Staff Priya Patel reviews and resolves request
      const loginStaff = await client.login('priya.patel@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(loginStaff);
      staffToken = loginStaff.data.data.accessToken;

      const resolveRes = await client.patch(`/api/v1/correction-requests/${correctionId}`, {
        status: 'RESOLVED',
        resolutionNotes: 'Verified against signed hematology report; confirmed 9.8 g/dL.'
      }, client.createHeaders(staffToken));

      client.assertEnvelope(resolveRes);
      assert.equal(resolveRes.status, 200);
      assert.equal(resolveRes.data.data.status, 'RESOLVED');

      // 3. Patient queries correction requests and sees status updated
      const patList = await client.get('/api/v1/correction-requests', client.createHeaders(patientToken));
      client.assertEnvelope(patList);
      const req = patList.data.data.find(r => r.id === correctionId);
      assert.ok(req);
      assert.equal(req.status, 'RESOLVED');
    });

    it('Flow 11: Longitudinal Biomarker Trend Aggregation Across Multiple Observations', async () => {
      const loginDoc = await client.login('dr.rajesh.rao@metrocare.in', 'hashed_password_123');
      doctorToken = loginDoc.data.data.accessToken;

      // Ensure Rohan has active consent
      await client.post('/api/v1/consents', {
        clinicId: 'clinic-metro-health-001',
        scope: 'FULL_HISTORY'
      }, client.createHeaders(patientToken));

      // Upload and verify a second CBC report for Rohan (e.g. 30 days later: Hb 11.2 g/dL)
      const upRes = await client.uploadReport({
        patientId,
        title: '30-Day Follow-Up Hemogram',
        reportDate: '2026-11-25',
        token: doctorToken,
        observations: [
          { testName: 'Hemoglobin', loincCode: '718-7', valueNumeric: 11.2, unit: 'g/dL', referenceLow: 13.0, referenceHigh: 17.0 }
        ]
      });
      client.assertEnvelope(upRes);
      if (upRes.data.data.reportId) {
        await client.post(`/api/v1/reports/${upRes.data.data.reportId}/verify`, {
          reportDate: '2026-11-25',
          observations: [
            { testName: 'Hemoglobin', valueNumeric: 11.2, action: 'VERIFY' }
          ]
        }, client.createHeaders(doctorToken));
      }

      // Query trends
      const trendRes = await client.get(
        `/api/v1/patients/${patientId}/observations/trends?testName=Hemoglobin`,
        client.createHeaders(doctorToken)
      );
      client.assertEnvelope(trendRes);
      assert.equal(trendRes.status, 200);
      const trendData = Array.isArray(trendRes.data.data) ? trendRes.data.data[0] : trendRes.data.data;
      assert.ok(trendData && trendData.points);
      assert.ok(trendData.points.length >= 1, 'Longitudinal trend points must be aggregated');
    });

    it('Flow 12: Comprehensive Audit Trail Verification Across Historical Operations', async () => {
      const auditRes = await client.get('/api/v1/audit-logs', client.createHeaders(staffToken));
      client.assertEnvelope(auditRes);
      assert.equal(auditRes.status, 200);
      const items = auditRes.data.data.items || auditRes.data.data;
      assert.ok(Array.isArray(items));
      assert.ok(items.length > 0);

      // Verify that audit log recorded various clinical actions
      const actions = items.map(l => l.action);
      assert.ok(actions.includes('CORRECTION_RESOLVED') || actions.includes('VALUE_VERIFIED') || actions.includes('REPORT_UPLOADED') || actions.includes('ENCOUNTER_CREATED'), 'Audit trail must record sensitive actions');
    });
  });
}
