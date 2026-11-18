/**
 * Tier 2 Boundary & Corner Cases: Report Upload, Storage & OCR Boundaries
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 2: Report & OCR Boundary Cases', () => {
    let doctorToken = null;
    let consentedPatientId = 'p-aarav-sharma-001';
    let unconsentedPatientId = 'p-unconsented-patient-009';

    it('TC-REP-B01: Upload report with missing file payload returns 400 Validation Error', async () => {
      const loginDoc = await client.login('dr.rajesh.rao@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(loginDoc);
      doctorToken = loginDoc.data.data.accessToken;

      const res = await client.uploadReport({
        patientId: consentedPatientId,
        title: 'Report with missing file',
        missingFile: true,
        token: doctorToken
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-REP-B02: Upload report with unsupported file format (.exe) returns 422 Unsupported File', async () => {
      const res = await client.uploadReport({
        patientId: consentedPatientId,
        title: 'Malicious Executable Payload',
        fileName: 'malicious.exe',
        mimeType: 'application/x-msdownload',
        fileBuffer: Buffer.from('MZ...fake executable'),
        token: doctorToken
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 422, 'Expected HTTP 422 Unsupported Entity');
      assert.equal(res.data.error.code, 'UNSUPPORTED_FILE');
    });

    it('TC-REP-B03: Upload report with zero bytes returns 400 Validation Error', async () => {
      const res = await client.uploadReport({
        patientId: consentedPatientId,
        title: 'Empty zero-byte file',
        fileName: 'empty.pdf',
        mimeType: 'application/pdf',
        fileBuffer: Buffer.alloc(0),
        token: doctorToken
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-REP-B04: Upload report missing required patientId returns 400 Validation Error', async () => {
      const res = await client.uploadReport({
        title: 'Missing patient ID report',
        fileBuffer: Buffer.from('Sample Content'),
        token: doctorToken
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-REP-B05: Upload report missing required title returns 400 Validation Error', async () => {
      const res = await client.uploadReport({
        patientId: consentedPatientId,
        fileBuffer: Buffer.from('Sample Content'),
        token: doctorToken
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-REP-B06: Upload report for non-existent patient returns 404 Not Found', async () => {
      const res = await client.uploadReport({
        patientId: 'p-nonexistent-patient-99999',
        title: 'Report for non-existent patient',
        fileBuffer: Buffer.from('Sample Content'),
        token: doctorToken
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 404, 'Expected HTTP 404 Not Found');
      assert.equal(res.data.error.code, 'NOT_FOUND');
    });

    it('TC-REP-B07: Doctor uploads report for unconsented patient returns 403 CONSENT_REQUIRED', async () => {
      const res = await client.uploadReport({
        patientId: unconsentedPatientId,
        title: 'Report for unconsented patient',
        fileBuffer: Buffer.from('Sample Content'),
        token: doctorToken
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 403, 'Expected HTTP 403 Forbidden');
      assert.equal(res.data.error.code, 'CONSENT_REQUIRED');
    });

    it('TC-REP-B08: Query non-existent report details returns 404 Not Found', async () => {
      const res = await client.get('/api/v1/reports/rep-nonexistent-999999', client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 404, 'Expected HTTP 404 Not Found');
      assert.equal(res.data.error.code, 'NOT_FOUND');
    });

    it('TC-REP-B09: Download non-existent report file returns 404 Not Found', async () => {
      const res = await client.get('/api/v1/reports/rep-nonexistent-999999/download', client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 404, 'Expected HTTP 404 Not Found');
      assert.equal(res.data.error.code, 'NOT_FOUND');
    });

    it('TC-REP-B10: OCR extraction with empty text body returns empty observations array', async () => {
      const res = await client.post('/internal/extract', {
        text: ''
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data.observations));
      assert.equal(res.data.data.observations.length, 0);
    });
  });
}
