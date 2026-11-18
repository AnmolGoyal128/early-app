/**
 * Tier 1 Feature Coverage: F11 - Clinic Operational Dashboard & KPI Metrics
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 1: F11 - Clinic Operational Dashboard', () => {
    let doctorToken = null;
    let staffToken = null;

    it('TC-DSH-01: Doctor queries clinic dashboard summary GET /clinic/dashboard/summary', async () => {
      // Login as Dr. Ananya Sen
      const loginDoc = await client.post('/api/v1/auth/login', {
        email: 'dr.ananya.sen@metrocare.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginDoc);
      doctorToken = loginDoc.data.data.accessToken;

      const res = await client.get('/api/v1/clinic/dashboard/summary', client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(typeof res.data.data.totalPatients === 'number');
    });

    it('TC-DSH-02: Staff member queries clinic dashboard summary', async () => {
      // Login as Priya Patel
      const loginStaff = await client.post('/api/v1/auth/login', {
        email: 'priya.patel@metrocare.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginStaff);
      staffToken = loginStaff.data.data.accessToken;

      const res = await client.get('/api/v1/clinic/dashboard/summary', client.createHeaders(staffToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
    });

    it('TC-DSH-03: Verify totalPatients is a positive integer reflecting consented patients', async () => {
      const res = await client.get('/api/v1/clinic/dashboard/summary', client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(res.data.data.totalPatients >= 1, 'Total patients must be at least 1');
    });

    it('TC-DSH-04: Verify follow-up counters are valid non-negative numbers', async () => {
      const res = await client.get('/api/v1/clinic/dashboard/summary', client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(typeof res.data.data.followUpsDue === 'number' && res.data.data.followUpsDue >= 0);
      assert.ok(typeof res.data.data.followUpsOverdue === 'number' && res.data.data.followUpsOverdue >= 0);
      assert.ok(typeof res.data.data.followUpsCompleted === 'number' && res.data.data.followUpsCompleted >= 0);
    });

    it('TC-DSH-05: Verify patientsNeedingReview metric reflects active signal flags', async () => {
      const res = await client.get('/api/v1/clinic/dashboard/summary', client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(typeof res.data.data.patientsNeedingReview === 'number');
      assert.ok(res.data.data.patientsNeedingReview >= 0);
    });

    it('TC-DSH-06: Clinic worklist triage query returns actionable items', async () => {
      const res = await client.get('/api/v1/clinic/follow-ups', client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
    });
  });
}
