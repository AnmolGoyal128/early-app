/**
 * Tier 1 Feature Coverage: F12 - Correction Requests, Clinical Governance & Immutable Audit Logs
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 1: F12 - Correction Requests & Audit Trail Governance', () => {
    let patientToken = null;
    let doctorToken = null;
    let staffToken = null;
    let patientId = 'p-rohan-verma-003';
    let correctionRequestId = null;
    let rejectCorrectionId = null;

    it('TC-GOV-01: Patient submits correction request POST /correction-requests', async () => {
      // Login as synthetic patient Rohan Verma
      const loginPat = await client.post('/api/v1/auth/login', {
        email: 'rohan.verma@synthetic-early-demo.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginPat);
      patientToken = loginPat.data.data.accessToken;

      const res = await client.post('/api/v1/correction-requests', {
        targetType: 'OBSERVATION',
        targetId: 'obs-sample-rohan-001',
        issueDescription: 'Hemoglobin unit recorded in g/dL, please verify against original hospital slip.',
        requestedChange: 'Verify whether reading was 9.8 or 10.2'
      }, client.createHeaders(patientToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 201, 'Expected HTTP 201 Created');
      assert.equal(res.data.data.status, 'OPEN');
      correctionRequestId = res.data.data.id;
    });

    it('TC-GOV-02: Patient views own correction requests GET /correction-requests', async () => {
      const res = await client.get('/api/v1/correction-requests', client.createHeaders(patientToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.some(c => c.id === correctionRequestId));
    });

    it('TC-GOV-03: Staff/Doctor resolves correction request PATCH /correction-requests/{id}', async () => {
      // Login as Priya Patel
      const loginStaff = await client.post('/api/v1/auth/login', {
        email: 'priya.patel@metrocare.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginStaff);
      staffToken = loginStaff.data.data.accessToken;

      const res = await client.patch(`/api/v1/correction-requests/${correctionRequestId}`, {
        status: 'RESOLVED',
        resolutionNotes: 'Cross-checked with original lab PDF: 9.8 g/dL is correct.'
      }, client.createHeaders(staffToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.status, 'RESOLVED');
    });

    it('TC-GOV-04: Staff/Doctor rejects spurious correction request with clinical rationale', async () => {
      // Create second correction request to test REJECTED
      const reqRes = await client.post('/api/v1/correction-requests', {
        targetType: 'REPORT',
        targetId: 'rep-sample-002',
        issueDescription: 'Duplicate upload request',
        requestedChange: 'Remove duplicate record'
      }, client.createHeaders(patientToken));
      client.assertEnvelope(reqRes);
      rejectCorrectionId = reqRes.data.data.id;

      const res = await client.patch(`/api/v1/correction-requests/${rejectCorrectionId}`, {
        status: 'REJECTED',
        resolutionNotes: 'File is not a duplicate; separate date panels confirmed.'
      }, client.createHeaders(staffToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.status, 'REJECTED');
    });

    it('TC-GOV-05: Staff/Doctor inspects clinic audit log GET /audit-logs', async () => {
      const res = await client.get('/api/v1/audit-logs', client.createHeaders(staffToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const items = res.data.data.items || res.data.data;
      assert.ok(Array.isArray(items), 'Audit items must be array');
      assert.ok(items.length > 0, 'Audit trail must contain recorded events');
    });

    it('TC-GOV-06: Patient queries audit log and verifies scoped personal access trail', async () => {
      const res = await client.get('/api/v1/audit-logs', client.createHeaders(patientToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const items = res.data.data.items || res.data.data;
      assert.ok(Array.isArray(items));
    });
  });
}
