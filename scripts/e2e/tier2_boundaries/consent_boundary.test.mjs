/**
 * Tier 2 Boundary & Corner Cases: Consent Gating & Tenant Isolation
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 2: Consent Boundary & Isolation', () => {
    let doctorToken = null;
    let patientTokenAarav = null;
    let patientTokenRohan = null;
    let unconsentedPatientId = 'p-unconsented-patient-009';
    let temporaryConsentId = null;

    it('TC-CNS-B01: Doctor access to unconsented patient returns 403 CONSENT_REQUIRED', async () => {
      const loginDoc = await client.login('dr.rajesh.rao@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(loginDoc);
      doctorToken = loginDoc.data.data.accessToken;

      const res = await client.get(`/api/v1/patients/${unconsentedPatientId}`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'CONSENT_REQUIRED');
    });

    it('TC-CNS-B02: Immediate post-revocation access denial returns 403 CONSENT_REQUIRED', async () => {
      // Login as Rohan Verma, grant a temporary consent, then revoke it
      const loginRohan = await client.login('rohan.verma@synthetic-early-demo.in', 'hashed_password_123');
      client.assertEnvelope(loginRohan);
      patientTokenRohan = loginRohan.data.data.accessToken;

      const grantRes = await client.post('/api/v1/consents', {
        clinicId: 'clinic-metro-health-001',
        scope: 'FULL_HISTORY'
      }, client.createHeaders(patientTokenRohan));
      client.assertEnvelope(grantRes);
      temporaryConsentId = grantRes.data.data.id;

      // Revoke the consent
      const revokeRes = await client.post(`/api/v1/consents/${temporaryConsentId}/revoke`, {}, client.createHeaders(patientTokenRohan));
      client.assertEnvelope(revokeRes);
      assert.equal(revokeRes.status, 200);

      // Also revoke rohan's baseline consent if any to verify immediate 403 block
      const listConsents = await client.get('/api/v1/consents', client.createHeaders(patientTokenRohan));
      for (const c of listConsents.data.data) {
        if (c.status === 'ACTIVE') {
          await client.post(`/api/v1/consents/${c.id}/revoke`, {}, client.createHeaders(patientTokenRohan));
        }
      }

      // Doctor tries to query Rohan's timeline -> MUST immediately return 403 CONSENT_REQUIRED
      const res = await client.get(`/api/v1/patients/p-rohan-verma-003/timeline`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'CONSENT_REQUIRED');
    });

    it('TC-CNS-B03: Revoking an already revoked consent returns 409 Conflict', async () => {
      const res = await client.post(`/api/v1/consents/${temporaryConsentId}/revoke`, {}, client.createHeaders(patientTokenRohan));
      client.assertEnvelope(res);
      assert.equal(res.status, 409, 'Expected HTTP 409 Conflict');
      assert.equal(res.data.error.code, 'CONFLICT');
    });

    it('TC-CNS-B04: Patient cannot revoke consent belonging to another patient (cross-tenant)', async () => {
      // Login as Aarav Sharma and attempt to revoke Rohan's consent
      const loginAarav = await client.login('aarav.sharma@synthetic-early-demo.in', 'hashed_password_123');
      client.assertEnvelope(loginAarav);
      patientTokenAarav = loginAarav.data.data.accessToken;

      const res = await client.post(`/api/v1/consents/${temporaryConsentId}/revoke`, {}, client.createHeaders(patientTokenAarav));
      client.assertEnvelope(res);
      assert.ok([403, 404].includes(res.status), 'Must return 403 or 404 on cross-patient revoke');
    });

    it('TC-CNS-B05: Doctor attempting POST /consents returns 403 Forbidden', async () => {
      const res = await client.post('/api/v1/consents', {
        clinicId: 'clinic-metro-health-001',
        scope: 'FULL_HISTORY'
      }, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'FORBIDDEN');
    });

    it('TC-CNS-B06: Grant consent with missing clinicId returns 400 Validation Error', async () => {
      const res = await client.post('/api/v1/consents', {
        scope: 'FULL_HISTORY'
      }, client.createHeaders(patientTokenAarav));
      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-CNS-B07: Revoke non-existent consent UUID returns 404 Not Found', async () => {
      const res = await client.post(`/api/v1/consents/consent-nonexistent-999999/revoke`, {}, client.createHeaders(patientTokenAarav));
      client.assertEnvelope(res);
      assert.equal(res.status, 404, 'Expected HTTP 404 Not Found');
      assert.equal(res.data.error.code, 'NOT_FOUND');
    });

    it('TC-CNS-B08: Patient cannot access another patient demographics profile', async () => {
      // Aarav attempts to query Rohan's profile
      const res = await client.get(`/api/v1/patients/p-rohan-verma-003`, client.createHeaders(patientTokenAarav));
      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'CONSENT_REQUIRED');
    });

    it('TC-CNS-B09: Patient cannot browse authorized directory GET /patients', async () => {
      const res = await client.get('/api/v1/patients', client.createHeaders(patientTokenAarav));
      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'FORBIDDEN');
    });

    it('TC-CNS-B10: Doctor queries non-existent patient UUID returns 404 Not Found', async () => {
      const res = await client.get('/api/v1/patients/p-nonexistent-uuid-88888', client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 404, 'Expected HTTP 404 Not Found');
      assert.equal(res.data.error.code, 'NOT_FOUND');
    });
  });
}
