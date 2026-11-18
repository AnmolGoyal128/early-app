/**
 * Tier 1 Feature Coverage: F04 & F05 - Medical Report Ingestion, SHA-256 Storage & OCR Extraction
 */

import { createSyntheticPdfBuffer } from '../fixtures/pdf_helper.mjs';

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 1: F04 & F05 - Reports & OCR Microservice', () => {
    let doctorToken = null;
    let patientToken = null;
    let patientId = 'p-aarav-sharma-001';
    let uploadedReportId = null;

    it('TC-REP-01: Upload diagnostic lab report via POST /reports/upload', async () => {
      // Login as Dr. Rajesh Rao
      const loginRes = await client.login('dr.rajesh.rao@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(loginRes);
      doctorToken = loginRes.data.data.accessToken;

      const pdfBuffer = createSyntheticPdfBuffer('HbA1c Lab Report', fixtures.hba1cReportText);
      const res = await client.uploadReport({
        patientId,
        fileBuffer: pdfBuffer,
        fileName: 'aarav_hba1c_oct2026.pdf',
        mimeType: 'application/pdf',
        title: 'Glycated Hemoglobin & Lipid Diagnostic Report',
        reportType: 'LAB_REPORT',
        reportDate: '2026-10-15',
        sourceProviderName: 'Metro Diagnostic Services',
        token: doctorToken
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 201, 'Expected HTTP 201 Created');
      assert.ok(res.data.data.reportId, 'Must return reportId');
      assert.ok(['NEEDS_REVIEW', 'PROCESSING'].includes(res.data.data.extractionStatus));
      uploadedReportId = res.data.data.reportId;
    });

    it('TC-REP-02: OCR extraction observations default to PENDING_VERIFICATION', async () => {
      const res = await client.post('/internal/extract', {
        text: fixtures.hba1cReportText,
        fileType: 'application/pdf'
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(res.data.data.observations && res.data.data.observations.length > 0);
      for (const obs of res.data.data.observations) {
        assert.equal(
          obs.verificationStatus,
          'PENDING_VERIFICATION',
          'Observation status MUST be PENDING_VERIFICATION prior to human verification'
        );
        assert.ok(obs.ocrConfidence > 0.8, 'Confidence score must be recorded');
      }
    });

    it('TC-REP-03: PII de-identification engine scrubs sensitive patient identifiers', async () => {
      const res = await client.post('/internal/extract', {
        text: fixtures.hba1cReportText
      });

      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      const demographics = res.data.data.patientDemographics;
      assert.ok(demographics, 'Must return patientDemographics');
      assert.equal(demographics.maskedName, '[PATIENT_NAME_REDACTED]');
      assert.equal(demographics.maskedPhone, '[PHONE_REDACTED]');
      assert.equal(demographics.maskedAddress, '[ADDRESS_REDACTED]');
    });

    it('TC-REP-04: Query patient reports GET /patients/{id}/reports returns uploaded report', async () => {
      const res = await client.get(`/api/v1/patients/${patientId}/reports`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(Array.isArray(res.data.data));
      const rep = res.data.data.find(r => r.id === uploadedReportId);
      assert.ok(rep, 'Uploaded report must appear in patient reports');
      assert.equal(rep.title, 'Glycated Hemoglobin & Lipid Diagnostic Report');
    });

    it('TC-REP-05: Query individual report details GET /reports/{id}', async () => {
      const res = await client.get(`/api/v1/reports/${uploadedReportId}`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.equal(res.data.data.id, uploadedReportId);
      assert.ok(Array.isArray(res.data.data.observations), 'Must contain observations');
      assert.ok(res.data.data.fileSha256, 'Must contain SHA-256 checksum');
    });

    it('TC-REP-06: Report download GET /reports/{id}/download provides download metadata', async () => {
      const res = await client.get(`/api/v1/reports/${uploadedReportId}/download`, client.createHeaders(doctorToken));
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK');
      assert.ok(res.data.data.fileStorageKey, 'Must include storage key');
      assert.ok(res.data.data.downloadUrl, 'Must include download URL');
    });
  });
}
