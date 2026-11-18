/**
 * Tier 3 Cross-Feature Combination: Encounter -> Treatment -> Follow-Up State Machine
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 3 Flow: Encounter, Treatment & Follow-Up Lifecycle', () => {
    let doctorToken = null;
    let staffToken = null;
    let patientId = 'p-aarav-sharma-001';
    let encounterId = null;
    let treatmentId = null;
    let followUpId = null;

    it('Flow 7: Clinical Encounter Creation with Inline Treatments and Observations', async () => {
      const loginDoc = await client.login('dr.rajesh.rao@metrocare.in', 'hashed_password_123');
      client.assertEnvelope(loginDoc);
      doctorToken = loginDoc.data.data.accessToken;

      const encRes = await client.post(`/api/v1/patients/${patientId}/encounters`, {
        encounterDate: '2026-10-18T10:30:00Z',
        chiefComplaint: 'Glycemic drift and Stage 1 Hypertension management',
        clinicalAssessment: 'Confirmed essential hypertension with glycemic drift. Initiating dietary therapy and oral medication.',
        patientFriendlySummary: 'We reviewed your blood pressure and blood sugar. We have started a mild blood pressure tablet and advised dietary changes.',
        treatments: [
          {
            treatmentType: 'MEDICATION',
            name: 'Amlodipine 5mg',
            dosage: '5mg once daily at bedtime',
            frequency: 'ONCE_DAILY',
            startDate: '2026-10-18'
          }
        ],
        observations: [
          {
            testName: 'Clinic Systolic BP',
            loincCode: '8480-6',
            valueNumeric: 144.0,
            unit: 'mmHg',
            referenceLow: 90.0,
            referenceHigh: 120.0
          }
        ]
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(encRes);
      assert.equal(encRes.status, 201);
      encounterId = encRes.data.data.id;

      // Verify treatment was saved
      const trRes = await client.get(`/api/v1/patients/${patientId}/treatments`, client.createHeaders(doctorToken));
      client.assertEnvelope(trRes);
      const amlodipine = trRes.data.data.find(t => t.name.includes('Amlodipine'));
      assert.ok(amlodipine);
      treatmentId = amlodipine.id;
    });

    it('Flow 8: Signal Review Action Linked to Preventive Follow-Up Scheduling', async () => {
      // Find active signal flag for Aarav
      const sigRes = await client.get(`/api/v1/patients/${patientId}/signals`, client.createHeaders(doctorToken));
      client.assertEnvelope(sigRes);
      const flag = sigRes.data.data[0];

      if (flag) {
        // Review and action signal
        const reviewRes = await client.post(`/api/v1/signals/${flag.id}/review`, {
          status: 'ACTIONED',
          clinicianNote: 'Encounter documented; scheduling repeat metabolic follow-up.'
        }, client.createHeaders(doctorToken));
        client.assertEnvelope(reviewRes);
        assert.equal(reviewRes.status, 200);
        assert.equal(reviewRes.data.data.status, 'ACTIONED');
      }

      // Schedule follow-up task
      const fuRes = await client.post(`/api/v1/patients/${patientId}/follow-ups`, {
        title: '6-Week BP & Fasting Glucose Follow-Up',
        actionType: 'REASSESSMENT_VISIT',
        dueDate: '2026-12-01',
        encounterId,
        notes: 'Review tolerance to Amlodipine and ambulatory BP values'
      }, client.createHeaders(doctorToken));

      client.assertEnvelope(fuRes);
      assert.equal(fuRes.status, 201);
      assert.equal(fuRes.data.data.status, 'PENDING');
      followUpId = fuRes.data.data.id;
    });

    it('Flow 9: Follow-Up State Machine Progression (PENDING -> POSTPONED -> COMPLETED)', async () => {
      const loginStaff = await client.login('priya.patel@metrocare.in', 'hashed_password_123');
      staffToken = loginStaff.data.data.accessToken;

      // 1. Postpone due to patient request
      const postRes = await client.patch(`/api/v1/follow-ups/${followUpId}/status`, {
        status: 'POSTPONED',
        newDueDate: '2026-12-15',
        notes: 'Patient rescheduled due to work trip.'
      }, client.createHeaders(staffToken));
      client.assertEnvelope(postRes);
      assert.equal(postRes.status, 200);
      assert.equal(postRes.data.data.status, 'POSTPONED');
      assert.equal(postRes.data.data.dueDate, '2026-12-15');

      // 2. Complete follow-up
      const compRes = await client.patch(`/api/v1/follow-ups/${followUpId}/status`, {
        status: 'COMPLETED',
        notes: 'Reassessment visit attended; BP normalized to 128/82.'
      }, client.createHeaders(doctorToken));
      client.assertEnvelope(compRes);
      assert.equal(compRes.status, 200);
      assert.equal(compRes.data.data.status, 'COMPLETED');

      // 3. Complete medication treatment course
      const trComp = await client.patch(`/api/v1/treatments/${treatmentId}`, {
        status: 'COMPLETED',
        notes: 'Initial titration phase successful.'
      }, client.createHeaders(doctorToken));
      client.assertEnvelope(trComp);
      assert.equal(trComp.status, 200);
      assert.equal(trComp.data.data.status, 'COMPLETED');
    });
  });
}
