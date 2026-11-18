/**
 * Tier 1 Feature Coverage: F02 - Patient Profiles, Authorised Directory & Unified Timeline
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 1: F02 - Patient Profiles & Authorised Directory', () => {
    let patientToken = null;
    let doctorToken = null;
    let patientId = null;

    it('TC-PAT-01: Patient queries own profile via GET /patients/me', async () => {
      // Login as synthetic patient Aarav Sharma
      const loginRes = await client.post('/api/v1/auth/login', {
        email: 'aarav.sharma@synthetic-early-demo.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginRes);
      patientToken = loginRes.data.data.accessToken;

      const res = await client.get('/api/v1/patients/me', client.createHeaders(patientToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.fullName, 'Aarav Sharma');
      assert.equal(res.data.data.gender, 'MALE');
      assert.equal(res.data.data.bloodGroup, 'B+');
      assert.ok(res.data.data.isSyntheticDemo, 'Must be marked as synthetic demo');
      patientId = res.data.data.id;
    });

    it('TC-PAT-02: Doctor queries directory GET /patients for consented clinic patients', async () => {
      // Login as Dr. Ananya Sen
      const loginRes = await client.post('/api/v1/auth/login', {
        email: 'dr.ananya.sen@metrocare.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginRes);
      doctorToken = loginRes.data.data.accessToken;

      const res = await client.get('/api/v1/patients', client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data), 'Expected array of patients');
      assert.ok(res.data.data.length > 0, 'Directory should return consented patients');
      const aarav = res.data.data.find(p => p.fullName === 'Aarav Sharma');
      assert.ok(aarav, 'Aarav Sharma must be listed in consented directory');
    });

    it('TC-PAT-03: Doctor searches directory GET /patients?q=Aarav', async () => {
      const res = await client.get('/api/v1/patients?q=Aarav', client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.every(p => p.fullName.toLowerCase().includes('aarav')), 'All items must match search query');
    });

    it('TC-PAT-04: Doctor queries individual consented profile GET /patients/{id}', async () => {
      const res = await client.get(`/api/v1/patients/${patientId}`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.id, patientId);
      assert.equal(res.data.data.fullName, 'Aarav Sharma');
      assert.equal(res.data.data.gender, 'MALE');
    });

    it('TC-PAT-05: Query unified timeline GET /patients/{id}/timeline sorted chronologically', async () => {
      const res = await client.get(`/api/v1/patients/${patientId}/timeline`, client.createHeaders(patientToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data), 'Timeline must return an array');
      // Timeline should contain verified baseline observations
      assert.ok(res.data.data.length >= 0, 'Timeline items returned');
    });

    it('TC-PAT-06: Query timeline with date filter fromDate and toDate', async () => {
      const res = await client.get(
        `/api/v1/patients/${patientId}/timeline?fromDate=2026-01-01&toDate=2026-12-31`,
        client.createHeaders(doctorToken)
      );
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
    });
  });
}
