/**
 * Tier 4 Clinical Journey 3: Rohan Verma — Fatigue, Microcytic Anemia & Governance Audit Trail
 * Persona: 32M, software engineer, fatigue, CBC Hemoglobin 9.8 g/dL (ref 13.0-17.0), Ferritin 12 ng/mL
 */

import { createSyntheticPdfBuffer } from '../fixtures/pdf_helper.mjs';

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 4 Journey 3: Rohan Verma — Anemia Protocol & Correction Governance Workflow', () => {
    let patientToken = null;
    let doctorToken = null;
    let staffToken = null;
    let patientId = 'p-rohan-verma-003';
    let reportId = null;
    let encounterId = null;
    let treatmentId = null;
    let followUpId = null;
    let correctionId = null;

    it('Stage 1: Rohan Verma logs in and grants consent to Metro Preventive Care Clinic', async () => {
      const loginRes = await client.login('rohan.verma@synthetic-early-demo.in', 'hashed_password_123');
      client.assertEnvelope(loginRes);
      patientToken = loginRes.data.data.accessToken;

      const consentRes = await client.post('/api/v1/consents', {
        clinicId: 'clinic-metro-health-001',
        scope: 'FULL_HISTORY'
      }, client.createHeaders(patientToken));

      client.assertEnvelope(consentRes);
      assert.equal(consentRes.status, 201);
      assert.equal(consentRes.data.data.status, 'ACTIVE');
    });

    it('Stage 2: Complete Blood Count diagnostic report ingested with Hemoglobin 9.8 g/dL and Ferritin 12 ng/mL', async () => {
      const docLogin = await client.login('dr.rajesh.rao@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(docLogin);
      doctorToken = docLogin.data.data.accessToken;

      const pdfBuffer = createSyntheticPdfBuffer('CBC Hemogram Report', fixtures.cbcReportText);
      const uploadRes = await client.uploadReport({
        patientId,
        fileBuffer: pdfBuffer,
        fileName: 'rohan_cbc_oct2026.pdf',
        mimeType: 'application/pdf',
        title: 'Complete Blood Count & Iron Stores Panel',
        reportType: 'LAB_REPORT',
        reportDate: '2026-10-25',
        sourceProviderName: 'Metro Diagnostic Services',
        token: doctorToken,
        observations: [
          { testName: 'Hemoglobin', loincCode: '718-7', valueNumeric: 9.8, unit: 'g/dL', referenceLow: 13.0, referenceHigh: 17.0, ocrConfidence: 0.96 },
          { testName: 'Total RBC Count', loincCode: '789-8', valueNumeric: 3.85, unit: 'mil/uL', referenceLow: 4.5, referenceHigh: 5.5, ocrConfidence: 0.95 },
          { testName: 'Mean Corpuscular Volume (MCV)', loincCode: '787-2', valueNumeric: 72.4, unit: 'fL', referenceLow: 80.0, referenceHigh: 100.0, ocrConfidence: 0.94 },
          { testName: 'Serum Ferritin', loincCode: '24-336', valueNumeric: 12.0, unit: 'ng/mL', referenceLow: 24.0, referenceHigh: 336.0, ocrConfidence: 0.98 }
        ]
      });

      client.assertEnvelope(uploadRes);
      assert.equal(uploadRes.status, 201);
      reportId = uploadRes.data.data.reportId;
      assert.ok(reportId);
    });

    it('Stage 3: Doctor verifies microcytic anemia findings via side-by-side human-in-the-loop review', async () => {
      const verifyRes = await client.post(`/api/v1/reports/${reportId}/verify`, {
        reportDate: '2026-10-25',
        observations: [
          { testName: 'Hemoglobin', valueNumeric: 9.8, action: 'VERIFY' },
          { testName: 'Total RBC Count', valueNumeric: 3.85, action: 'VERIFY' },
          { testName: 'Mean Corpuscular Volume (MCV)', valueNumeric: 72.4, action: 'VERIFY' },
          { testName: 'Serum Ferritin', valueNumeric: 12.0, action: 'VERIFY' }
        ]
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(verifyRes);
      assert.equal(verifyRes.status, 200);
      assert.equal(verifyRes.data.data.status, 'VERIFIED');
    });

    it('Stage 4: Doctor records clinical encounter, notes nutritional iron deficiency, and prescribes oral iron therapy', async () => {
      const encRes = await client.post(`/api/v1/patients/${patientId}/encounters`, {
        encounterDate: '2026-10-26T14:00:00Z',
        chiefComplaint: 'Progressive fatigue, decreased stamina, and lightheadedness',
        clinicalAssessment: 'Microcytic hypochromic anemia secondary to dietary iron deficiency. Initiating oral iron supplementation.',
        patientFriendlySummary: 'Your blood test shows low hemoglobin and iron levels causing your fatigue. We have started an iron supplement to rebuild your red blood cells.',
        treatments: [
          {
            treatmentType: 'MEDICATION',
            name: 'Ferrous Ascorbate 100mg with Folic Acid',
            dosage: '1 tablet once daily after dinner',
            frequency: 'ONCE_DAILY',
            startDate: '2026-10-26'
          }
        ]
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(encRes);
      assert.equal(encRes.status, 201);
      encounterId = encRes.data.data.id;

      // Verify active treatment
      const trRes = await client.get(`/api/v1/patients/${patientId}/treatments`, client.createHeaders(doctorToken));
      client.assertEnvelope(trRes);
      const iron = trRes.data.data.find(t => t.name.includes('Ferrous Ascorbate'));
      assert.ok(iron);
      assert.equal(iron.status, 'ACTIVE');
      treatmentId = iron.id;
    });

    it('Stage 5: Doctor schedules 30-day repeat hemogram follow-up', async () => {
      const fuRes = await client.post(`/api/v1/patients/${patientId}/follow-ups`, {
        title: '30-Day Hemoglobin & RBC Reassessment',
        actionType: 'REPEAT_TEST',
        dueDate: '2026-11-26',
        encounterId,
        notes: 'Target hemoglobin rise: >= 1.0 g/dL over 4 weeks.'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(fuRes);
      assert.equal(fuRes.status, 201);
      assert.equal(fuRes.data.data.status, 'PENDING');
      followUpId = fuRes.data.data.id;
    });

    it('Stage 6: Rohan reviews timeline and submits correction request for observation annotation', async () => {
      const crRes = await client.post('/api/v1/correction-requests', {
        targetType: 'OBSERVATION',
        targetId: 'obs-rohan-hgb',
        issueDescription: 'Please confirm whether Ferritin was measured on fasting sample.',
        requestedChange: 'Verify sample collection type note'
      }, client.createHeaders(patientToken));

      client.assertEnvelope(crRes);
      assert.equal(crRes.status, 201);
      assert.equal(crRes.data.data.status, 'OPEN');
      correctionId = crRes.data.data.id;
    });

    it('Stage 7: Clinic staff resolves correction request and inspects immutable audit trail', async () => {
      const loginStaff = await client.login('priya.patel@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(loginStaff);
      staffToken = loginStaff.data.data.accessToken;

      // 1. Resolve correction request
      const resolveRes = await client.patch(`/api/v1/correction-requests/${correctionId}`, {
        status: 'RESOLVED',
        resolutionNotes: 'Lab confirmed serum ferritin collected fasting at 10:00 AM.'
      }, client.createHeaders(staffToken));

      client.assertEnvelope(resolveRes);
      assert.equal(resolveRes.status, 200);
      assert.equal(resolveRes.data.data.status, 'RESOLVED');

      // 2. Audit trail verification
      const auditRes = await client.get('/api/v1/audit-logs', client.createHeaders(staffToken));
      client.assertEnvelope(auditRes);
      assert.equal(auditRes.status, 200);
      const items = auditRes.data.data.items || auditRes.data.data;
      assert.ok(Array.isArray(items));
      assert.ok(items.length >= 5, 'Comprehensive audit trail must capture end-to-end journey events');
    });
  });
}
