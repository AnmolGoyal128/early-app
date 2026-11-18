/**
 * Tier 1 Feature Coverage: F01 - Authentication & Session Management
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 1: F01 - Authentication & Session Management', () => {
    let patientEmail = `patient-t1-${Date.now()}@early-test.in`;
    let doctorEmail = `doctor-t1-${Date.now()}@metrocare.in`;
    const password = 'TestSecurePassword123!';
    let patientToken = null;
    let patientRefreshToken = null;
    let patientUserId = null;
    let doctorToken = null;

    it('TC-AUTH-01: Register new PATIENT account successfully', async () => {
      const res = await client.post('/api/v1/auth/register', {
        email: patientEmail,
        password,
        fullName: 'Kavita Nair',
        role: 'PATIENT',
        phone: '+91-98765-11223',
        dateOfBirth: '1988-06-15',
        gender: 'FEMALE',
        bloodGroup: 'A+'
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 201, 'Expected HTTP 201 Created');
      assert.ok(res.data.data.accessToken, 'Must contain accessToken');
      assert.ok(res.data.data.refreshToken, 'Must contain refreshToken');
      assert.equal(res.data.data.user.role, 'PATIENT', 'Role must be PATIENT');
      assert.equal(res.data.data.user.email, patientEmail);

      patientToken = res.data.data.accessToken;
      patientRefreshToken = res.data.data.refreshToken;
      patientUserId = res.data.data.user.id;
    });

    it('TC-AUTH-02: Register new DOCTOR account with clinic linkage', async () => {
      const res = await client.post('/api/v1/auth/register', {
        email: doctorEmail,
        password,
        fullName: 'Dr. Suresh Varma',
        role: 'DOCTOR',
        phone: '+91-98111-99887',
        medicalRegNumber: 'KMC-2018-44552',
        specialization: 'Internal Medicine',
        clinicId: 'clinic-metro-health-001'
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 201, 'Expected HTTP 201 Created');
      assert.ok(res.data.data.accessToken);
      assert.equal(res.data.data.user.role, 'DOCTOR', 'Role must be DOCTOR');
      doctorToken = res.data.data.accessToken;
    });

    it('TC-AUTH-03: User authentication and login returns valid JWT tokens', async () => {
      const res = await client.post('/api/v1/auth/login', {
        email: patientEmail,
        password
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(res.data.data.accessToken);
      assert.ok(res.data.data.refreshToken);
      assert.equal(res.data.data.user.email, patientEmail);
    });

    it('TC-AUTH-04: Session profile query via GET /auth/me with Bearer token', async () => {
      const res = await client.get('/api/v1/auth/me', client.createHeaders(patientToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.id, patientUserId);
      assert.equal(res.data.data.email, patientEmail);
      assert.equal(res.data.data.role, 'PATIENT');
      assert.ok(res.data.data.patientId, 'Patient profile must link patientId');
    });

    it('TC-AUTH-05: Token refresh exchanges valid refreshToken for new access token', async () => {
      const res = await client.post('/api/v1/auth/refresh', {
        refreshToken: patientRefreshToken
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(res.data.data.accessToken, 'Must return refreshed accessToken');
      assert.ok(res.data.data.refreshToken, 'Must return new refreshToken');
      assert.notEqual(res.data.data.accessToken, patientToken, 'New token must differ');
    });

    it('TC-AUTH-06: Doctor session profile identifies clinic linkage and doctorId', async () => {
      const res = await client.get('/api/v1/auth/me', client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.role, 'DOCTOR');
      assert.ok(res.data.data.doctorId, 'Doctor profile must include doctorId');
      assert.equal(res.data.data.clinicId, 'clinic-metro-health-001', 'Clinic ID must match');
    });
  });
}
