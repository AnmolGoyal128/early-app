/**
 * Tier 3 Cross-Feature Combination: Auth Session & Consent Interlock Flows
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 3 Flow: Auth & Consent Gating Lifecycle', () => {
    let patientUser = null;
    let patientToken = null;
    let patientId = null;
    let doctorUser = null;
    let doctorToken = null;
    let consentId = null;

    it('Flow 1: End-to-End Session Lifecycle (Register -> Login -> /me -> Refresh)', async () => {
      const email = `patient-combo-${Date.now()}@early-test.in`;
      const password = 'TestSecureCombo123!';

      // 1. Register
      const regRes = await client.post('/api/v1/auth/register', {
        email,
        password,
        fullName: 'Combo Test Patient',
        role: 'PATIENT',
        dateOfBirth: '1989-09-09',
        gender: 'FEMALE',
        bloodGroup: 'B+'
      });
      client.assertEnvelope(regRes);
      assert.equal(regRes.status, 201);
      patientUser = regRes.data.data.user;
      patientId = regRes.data.data.user.patientId;

      // 2. Login
      const loginRes = await client.login(email, password);
      client.assertEnvelope(loginRes);
      assert.equal(loginRes.status, 200);
      patientToken = loginRes.data.data.accessToken;

      // 3. Verify /me
      const meRes = await client.get('/api/v1/auth/me', client.createHeaders(patientToken));
      client.assertEnvelope(meRes);
      assert.equal(meRes.status, 200);
      assert.equal(meRes.data.data.email, email);

      // 4. Token Refresh
      const refRes = await client.post('/api/v1/auth/refresh', {
        refreshToken: loginRes.data.data.refreshToken
      });
      client.assertEnvelope(refRes);
      assert.equal(refRes.status, 200);
      assert.ok(refRes.data.data.accessToken);
    });

    it('Flow 2: Consent Grant Interlock (Doctor 403 -> Patient Grants Consent -> Doctor 200)', async () => {
      // 1. Register a new Doctor
      const docEmail = `doctor-combo-${Date.now()}@metrocare.in`;
      const docPassword = 'TestDocPassword123!';
      const regDoc = await client.post('/api/v1/auth/register', {
        email: docEmail,
        password: docPassword,
        fullName: 'Dr. Combo Clinician',
        role: 'DOCTOR',
        medicalRegNumber: 'KMC-COMBO-12345',
        specialization: 'Internal Medicine',
        clinicId: 'clinic-metro-health-001'
      });
      client.assertEnvelope(regDoc);
      doctorToken = regDoc.data.data.accessToken;

      // 2. Doctor queries new patient -> MUST return 403 CONSENT_REQUIRED
      const preRes = await client.get(`/api/v1/patients/${patientId}`, client.createHeaders(doctorToken));
      client.assertEnvelope(preRes);
      assert.equal(preRes.status, 403, 'Doctor must be blocked before consent');
      assert.equal(preRes.data.error.code, 'CONSENT_REQUIRED');

      // 3. Patient grants FULL_HISTORY consent to Doctor's clinic
      const grantRes = await client.post('/api/v1/consents', {
        clinicId: 'clinic-metro-health-001',
        scope: 'FULL_HISTORY'
      }, client.createHeaders(patientToken));
      client.assertEnvelope(grantRes);
      assert.equal(grantRes.status, 201);
      assert.equal(grantRes.data.data.status, 'ACTIVE');
      consentId = grantRes.data.data.id;

      // 4. Doctor queries patient again -> MUST return 200 OK
      const postRes = await client.get(`/api/v1/patients/${patientId}`, client.createHeaders(doctorToken));
      client.assertEnvelope(postRes);
      assert.equal(postRes.status, 200, 'Doctor must be permitted after consent grant');
      assert.equal(postRes.data.data.id, patientId);
    });

    it('Flow 3: Immediate Consent Revocation Gating (Patient Revokes -> Doctor Immediate 403)', async () => {
      // 1. Patient revokes consent
      const revokeRes = await client.post(`/api/v1/consents/${consentId}/revoke`, {}, client.createHeaders(patientToken));
      client.assertEnvelope(revokeRes);
      assert.equal(revokeRes.status, 200);
      assert.equal(revokeRes.data.data.status, 'REVOKED');

      // 2. Doctor queries patient immediately after revocation -> MUST return 403 CONSENT_REQUIRED
      const blockedRes = await client.get(`/api/v1/patients/${patientId}`, client.createHeaders(doctorToken));
      client.assertEnvelope(blockedRes);
      assert.equal(blockedRes.status, 403, 'Doctor must be immediately blocked post-revocation');
      assert.equal(blockedRes.data.error.code, 'CONSENT_REQUIRED');

      // 3. Doctor queries patient timeline -> ALSO returns 403 CONSENT_REQUIRED
      const timelineRes = await client.get(`/api/v1/patients/${patientId}/timeline`, client.createHeaders(doctorToken));
      client.assertEnvelope(timelineRes);
      assert.equal(timelineRes.status, 403);
      assert.equal(timelineRes.data.error.code, 'CONSENT_REQUIRED');
    });
  });
}
