/**
 * Tier 1 Feature Coverage: F10 - Preventive Follow-Up Management & Clinic Worklist
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 1: F10 - Preventive Follow-Up Management', () => {
    let doctorToken = null;
    let staffToken = null;
    let patientToken = null;
    let patientId = 'p-aarav-sharma-001';
    let followUpId = null;

    it('TC-FLW-01: Doctor creates preventive follow-up task POST /patients/{id}/follow-ups', async () => {
      // Login as Dr. Rajesh Rao
      const loginDoc = await client.post('/api/v1/auth/login', {
        email: 'dr.rajesh.rao@metrocare.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginDoc);
      doctorToken = loginDoc.data.data.accessToken;

      const res = await client.post(`/api/v1/patients/${patientId}/follow-ups`, {
        title: '3-Month Repeat HbA1c & BP Reassessment',
        actionType: 'REPEAT_TEST',
        dueDate: '2027-01-15',
        notes: 'Repeat glycated hemoglobin and clinic BP evaluation'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 201, 'Expected HTTP 201 Created');
      assert.equal(res.data.data.status, 'PENDING');
      assert.equal(res.data.data.actionType, 'REPEAT_TEST');
      followUpId = res.data.data.id;
    });

    it('TC-FLW-02: Doctor creates follow-up linked to early signal flag', async () => {
      const res = await client.post(`/api/v1/patients/${patientId}/follow-ups`, {
        title: 'Hypertension Protocol Reassessment',
        actionType: 'REASSESSMENT_VISIT',
        dueDate: '2026-12-15',
        signalFlagId: 'flag-sample-001',
        notes: 'Evaluate ambulatory blood pressure log'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 201, 'Expected HTTP 201 Created');
      assert.ok(res.data.data.id);
    });

    it('TC-FLW-03: Patient queries own follow-up tasks GET /patients/{id}/follow-ups', async () => {
      const loginPat = await client.post('/api/v1/auth/login', {
        email: 'aarav.sharma@synthetic-early-demo.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginPat);
      patientToken = loginPat.data.data.accessToken;

      const res = await client.get(`/api/v1/patients/${patientId}/follow-ups`, client.createHeaders(patientToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.some(f => f.id === followUpId));
    });

    it('TC-FLW-04: Staff transitions follow-up status to POSTPONED with new dueDate', async () => {
      // Login as Priya Patel
      const loginStaff = await client.post('/api/v1/auth/login', {
        email: 'priya.patel@metrocare.in',
        password: 'hashed_password_123'
      });
      client.assertEnvelope(loginStaff);
      staffToken = loginStaff.data.data.accessToken;

      const res = await client.patch(`/api/v1/follow-ups/${followUpId}/status`, {
        status: 'POSTPONED',
        newDueDate: '2027-02-01',
        notes: 'Patient requested rescheduling due to work travel.'
      }, client.createHeaders(staffToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.status, 'POSTPONED');
      assert.equal(res.data.data.dueDate, '2027-02-01');
    });

    it('TC-FLW-05: Staff transitions follow-up status to COMPLETED', async () => {
      const res = await client.patch(`/api/v1/follow-ups/${followUpId}/status`, {
        status: 'COMPLETED',
        notes: 'Follow-up lab repeat successfully completed.'
      }, client.createHeaders(staffToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.status, 'COMPLETED');
    });

    it('TC-FLW-06: Clinic triage worklist GET /clinic/follow-ups returns clinic tasks', async () => {
      const res = await client.get('/api/v1/clinic/follow-ups', client.createHeaders(staffToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
    });
  });
}
