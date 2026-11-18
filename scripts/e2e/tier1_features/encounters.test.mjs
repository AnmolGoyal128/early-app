/**
 * Tier 1 Feature Coverage: F08 - Clinical Encounters & Prescribed Treatments
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 1: F08 - Clinical Encounters & Treatments', () => {
    let doctorToken = null;
    let patientToken = null;
    let patientId = 'p-aarav-sharma-001';
    let encounterId = null;
    let treatmentId = null;

    it('TC-ENC-01: Doctor creates clinical consultation encounter POST /patients/{id}/encounters', async () => {
      // Login as Dr. Rajesh Rao
      const loginDoc = await client.post('/api/v1/auth/login', {
        email: 'dr.rajesh.rao@metrocare.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginDoc);
      doctorToken = loginDoc.data.data.accessToken;

      const res = await client.post(`/api/v1/patients/${patientId}/encounters`, {
        encounterDate: '2026-10-16T11:00:00Z',
        chiefComplaint: 'Follow-up on elevated blood pressure and lab results',
        clinicalAssessment: 'Stage 1 Essential Hypertension with upward Glycemic Drift. Lifestyle counseling provided.',
        patientFriendlySummary: 'Discussed your recent test results. We are focusing on diet and blood pressure monitoring.',
        treatments: [
          {
            treatmentType: 'MEDICATION',
            name: 'Telmisartan 40mg',
            dosage: '40 mg once daily morning',
            frequency: 'ONCE_DAILY',
            startDate: '2026-10-16'
          },
          {
            treatmentType: 'LIFESTYLE',
            name: 'Low Sodium DASH Diet counseling',
            dosage: '< 2g sodium daily',
            frequency: 'DAILY',
            startDate: '2026-10-16'
          }
        ]
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 201, 'Expected HTTP 201 Created');
      assert.ok(res.data.data.id, 'Encounter must have ID');
      encounterId = res.data.data.id;
    });

    it('TC-ENC-02: Encounter record captures both clinical assessment and patient-friendly summary', async () => {
      const res = await client.get(`/api/v1/patients/${patientId}/encounters`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const enc = res.data.data.find(e => e.id === encounterId);
      assert.ok(enc, 'Created encounter must be found');
      assert.ok(enc.clinicalAssessment.includes('Hypertension'));
      assert.ok(enc.patientFriendlySummary.includes('blood pressure'));
    });

    it('TC-ENC-03: Patient treatment history reflects inline treatments created with encounter', async () => {
      const res = await client.get(`/api/v1/patients/${patientId}/treatments`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
      const telmi = res.data.data.find(t => t.name.includes('Telmisartan'));
      assert.ok(telmi, 'Prescribed Telmisartan must be in treatment history');
      assert.equal(telmi.status, 'ACTIVE');
      treatmentId = telmi.id;
    });

    it('TC-ENC-04: Patient queries own clinical encounters via GET /patients/{id}/encounters', async () => {
      const loginPat = await client.post('/api/v1/auth/login', {
        email: 'aarav.sharma@synthetic-early-demo.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginPat);
      patientToken = loginPat.data.data.accessToken;

      const res = await client.get(`/api/v1/patients/${patientId}/encounters`, client.createHeaders(patientToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length > 0);
    });

    it('TC-ENC-05: Doctor updates treatment status to COMPLETED via PATCH /treatments/{id}', async () => {
      const res = await client.patch(`/api/v1/treatments/${treatmentId}`, {
        status: 'COMPLETED',
        notes: 'Initial course completed; patient well tolerated'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.status, 'COMPLETED');
    });

    it('TC-ENC-06: Treatment status update persists in subsequent treatment queries', async () => {
      const res = await client.get(`/api/v1/patients/${patientId}/treatments`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const updated = res.data.data.find(t => t.id === treatmentId);
      assert.ok(updated);
      assert.equal(updated.status, 'COMPLETED');
    });
  });
}
