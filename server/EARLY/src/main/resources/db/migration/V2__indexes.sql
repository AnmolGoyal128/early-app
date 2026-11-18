-- V2__indexes.sql
-- Performance Indexes for Longitudinal Queries, Consent Checks, Follow-Ups, and Audit Trail

-- 1. Longitudinal Biomarker Timeline & Trend Queries
CREATE INDEX idx_observations_patient_date 
    ON biomarker_observations(patient_id, observed_at DESC);

CREATE INDEX idx_observations_loinc 
    ON biomarker_observations(patient_id, test_name, observed_at DESC);

CREATE INDEX idx_observations_trends 
    ON biomarker_observations(patient_id, test_name, verification_status, observed_at ASC);

-- 2. Follow-Up & Clinic Triage Dashboard
CREATE INDEX idx_followups_clinic_status_due 
    ON follow_ups(clinic_id, status, due_date ASC);

CREATE INDEX idx_followups_patient_due 
    ON follow_ups(patient_id, due_date ASC);

CREATE INDEX idx_followups_due_date
    ON follow_ups(clinic_id, due_date ASC);

-- 3. Consent Verification
CREATE INDEX idx_consents_patient_clinic_status 
    ON patient_consents(patient_id, clinic_id, status);

CREATE INDEX idx_consents_patient_doctor_status
    ON patient_consents(patient_id, doctor_id, status);

-- 4. Audit Log Inspection
CREATE INDEX idx_audit_resource 
    ON audit_logs(resource_type, resource_id, created_at DESC);

CREATE INDEX idx_audit_actor 
    ON audit_logs(actor_user_id, created_at DESC);

-- 5. Foreign Key & Search Helper Indexes
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_clinic_id ON doctors(clinic_id);

CREATE INDEX idx_reports_patient_date ON medical_reports(patient_id, report_date DESC);
CREATE INDEX idx_reports_sha256 ON medical_reports(file_sha256);

CREATE INDEX idx_encounters_patient_date ON encounters(patient_id, encounter_date DESC);
CREATE INDEX idx_treatments_patient_status ON treatments(patient_id, status);
CREATE INDEX idx_treatments_encounter ON treatments(encounter_id);

CREATE INDEX idx_signals_patient_status ON early_signal_flags(patient_id, status);
CREATE INDEX idx_correction_requests_patient_status ON correction_requests(patient_id, status);
