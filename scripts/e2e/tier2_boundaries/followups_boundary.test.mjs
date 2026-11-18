/**
 * Tier 2 Boundary & Corner Cases: Follow-Ups, Clinic RBAC & Governance Permissions
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 2: Follow-Ups & Governance RBAC Boundary Cases', () => {
    let patientTokenAarav = null;
    let doctorToken = null;
    let consentedPatientId = 'p-aarav-sharma-001';

    it('TC-FLW-B01: Patient attempting to create follow-up returns 403 Forbidden', async () => {
      const loginAarav = await client.login('aarav.sharma@synthetic-early-demo.in', 'hashed_password_123');
      client.assertEnvelope(loginAarav);
      patientTokenAarav = loginAarav.data.data.accessToken;

      const res = await client.post(`/api/v1/patients/${consentedPatientId}/follow-ups`, {
        title: 'Patient self follow-up',
        actionType: 'REPEAT_TEST',
        dueDate: '2027-01-01'
      }, client.createHeaders(patientTokenAarav));

      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'FORBIDDEN');
    });

    it('TC-FLW-B02: Patient attempting to update follow-up status returns 403 Forbidden', async () => {
      const res = await client.patch(`/api/v1/follow-ups/fu-sample-001/status`, {
        status: 'COMPLETED'
      }, client.createHeaders(patientTokenAarav));

      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'FORBIDDEN');
    });

    it('TC-FLW-B03: Patient accessing clinic triage worklist GET /clinic/follow-ups returns 403', async () => {
      const res = await client.get('/api/v1/clinic/follow-ups', client.createHeaders(patientTokenAarav));
      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'FORBIDDEN');
    });

    it('TC-FLW-B04: Patient accessing clinic dashboard summary returns 403 Forbidden', async () => {
      const res = await client.get('/api/v1/clinic/dashboard/summary', client.createHeaders(patientTokenAarav));
      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'FORBIDDEN');
    });

    it('TC-FLW-B05: Create follow-up with missing actionType returns 400 Validation Error', async () => {
      const loginDoc = await client.login('dr.rajesh.rao@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(loginDoc);
      doctorToken = loginDoc.data.data.accessToken;

      const res = await client.post(`/api/v1/patients/${consentedPatientId}/follow-ups`, {
        title: 'Missing action type follow-up',
        dueDate: '2027-01-15'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-FLW-B06: Create follow-up with missing title returns 400 Validation Error', async () => {
      const res = await client.post(`/api/v1/patients/${consentedPatientId}/follow-ups`, {
        actionType: 'REPEAT_TEST',
        dueDate: '2027-01-15'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-FLW-B07: Create follow-up with past dueDate returns 400 Validation Error', async () => {
      const res = await client.post(`/api/v1/patients/${consentedPatientId}/follow-ups`, {
        title: 'Past due date task',
        actionType: 'REPEAT_TEST',
        dueDate: '2020-01-01'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-FLW-B08: Transition status of non-existent follow-up UUID returns 404 Not Found', async () => {
      const res = await client.patch(`/api/v1/follow-ups/fu-nonexistent-999999/status`, {
        status: 'COMPLETED'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 404, 'Expected HTTP 404 Not Found');
      assert.equal(res.data.error.code, 'NOT_FOUND');
    });

    it('TC-FLW-B09: Transition follow-up with invalid status string returns 400 Validation Error', async () => {
      // First create a valid follow-up
      const createRes = await client.post(`/api/v1/patients/${consentedPatientId}/follow-ups`, {
        title: 'Valid task for invalid patch',
        actionType: 'REASSESSMENT_VISIT',
        dueDate: '2027-02-15'
      }, client.createHeaders(doctorToken));
      client.assertEnvelope(createRes);
      const fuId = createRes.data.data.id;

      const res = await client.patch(`/api/v1/follow-ups/${fuId}/status`, {
        status: 'INVALID_STATUS_CODE'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-FLW-B10: Patient attempting to resolve correction request returns 403 Forbidden', async () => {
      const res = await client.patch('/api/v1/correction-requests/cr-sample-001', {
        status: 'RESOLVED'
      }, client.createHeaders(patientTokenAarav));

      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'FORBIDDEN');
    });
  });
}
