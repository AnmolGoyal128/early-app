/**
 * Tier 1 Feature Coverage: F03 - Consent Management & Lifecycle
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 1: F03 - Consent Management', () => {
    let patientToken = null;
    let patientId = null;
    let createdConsentId = null;
    let scopedConsentId = null;

    it('TC-CNS-01: Patient lists current consents GET /consents', async () => {
      // Login as synthetic patient Meera Nair
      const loginRes = await client.post('/api/v1/auth/login', {
        email: 'meera.nair@synthetic-early-demo.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginRes);
      patientToken = loginRes.data.data.accessToken;
      patientId = loginRes.data.data.user.id;

      const res = await client.get('/api/v1/consents', client.createHeaders(patientToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
    });

    it('TC-CNS-02: Patient grants FULL_HISTORY consent POST /consents', async () => {
      const res = await client.post('/api/v1/consents', {
        clinicId: 'clinic-metro-health-001',
        scope: 'FULL_HISTORY',
        expiresAt: '2027-12-31T23:59:59Z'
      }, client.createHeaders(patientToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 201, 'Expected HTTP 201 Created');
      assert.equal(res.data.data.status, 'ACTIVE');
      assert.equal(res.data.data.scope, 'FULL_HISTORY');
      assert.equal(res.data.data.clinicId, 'clinic-metro-health-001');
      assert.ok(res.data.data.grantedAt);
      createdConsentId = res.data.data.id;
    });

    it('TC-CNS-03: Patient grants doctor-scoped REPORTS_ONLY consent', async () => {
      const res = await client.post('/api/v1/consents', {
        clinicId: 'clinic-metro-health-001',
        doctorId: 'doc-ananya-sen-001',
        scope: 'REPORTS_ONLY'
      }, client.createHeaders(patientToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 201, 'Expected HTTP 201 Created');
      assert.equal(res.data.data.status, 'ACTIVE');
      assert.equal(res.data.data.scope, 'REPORTS_ONLY');
      assert.equal(res.data.data.doctorId, 'doc-ananya-sen-001');
      scopedConsentId = res.data.data.id;
    });

    it('TC-CNS-04: Patient immediately revokes consent via POST /consents/{id}/revoke', async () => {
      const res = await client.post(`/api/v1/consents/${scopedConsentId}/revoke`, {}, client.createHeaders(patientToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.status, 'REVOKED');
      assert.ok(res.data.data.revokedAt, 'revokedAt must be populated');
    });

    it('TC-CNS-05: Query consent list reflects updated ACTIVE and REVOKED statuses', async () => {
      const res = await client.get('/api/v1/consents', client.createHeaders(patientToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const activeConsent = res.data.data.find(c => c.id === createdConsentId);
      const revokedConsent = res.data.data.find(c => c.id === scopedConsentId);
      assert.ok(activeConsent && activeConsent.status === 'ACTIVE', 'Created consent must remain ACTIVE');
      assert.ok(revokedConsent && revokedConsent.status === 'REVOKED', 'Revoked consent must reflect REVOKED');
    });

    it('TC-CNS-06: Consent actions log audit trail entries', async () => {
      // Query audit logs as patient to verify consent audit records
      const res = await client.get('/api/v1/audit-logs', client.createHeaders(patientToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const items = res.data.data.items || res.data.data;
      assert.ok(Array.isArray(items), 'Audit items must be array');
      const consentLogs = items.filter(l => l.resourceType === 'PATIENT_CONSENT');
      assert.ok(consentLogs.length > 0, 'Audit trail must contain consent grant/revoke records');
    });
  });
}
