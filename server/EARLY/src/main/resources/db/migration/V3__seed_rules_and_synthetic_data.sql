-- V3__seed_rules_and_synthetic_data.sql
-- Seed Clinical Rules, Clinics, Doctors, Staff, Synthetic Patients, Observations, Encounters, Follow-Ups

-- 1. Preventive Rules Catalog (Deterministic Rules)
INSERT INTO preventive_rules (id, rule_code, name, category, rule_definition_json, severity, clinician_message_template, patient_message_template, is_active)
VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'BP_ELEVATED_REVIEW',
    'Elevated Blood Pressure Without Completed Reassessment',
    'HYPERTENSION',
    '{"condition": "BP_ELEVATED", "systolic_threshold": 140, "diastolic_threshold": 90, "reassessment_window_days": 30}',
    'REVIEW_NEEDED',
    'Blood pressure recorded at or above 140/90 mmHg. Recommended reassessment visit was not completed within 30 days.',
    'Your previous report contains a finding that may need review. Please discuss it with your doctor.',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000002',
    'HBA1C_DRIFT_6M',
    'Longitudinal HbA1c Drift (>= 0.5% over 6 Months)',
    'DIABETES',
    '{"condition": "HBA1C_DRIFT", "delta_threshold": 0.5, "window_days": 180, "absolute_threshold": 6.5}',
    'REVIEW_NEEDED',
    'HbA1c shifted upward by >= 0.5% over a 6-month window or exceeds 6.5%. Pre-diabetic or diabetic drift requires review.',
    'Your recent lab results show a trend that your doctor should examine at your next appointment.',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000003',
    'EGFR_DECLINE_15PCT',
    'Renal Function Vigilance (eGFR Decline >= 15%)',
    'NEPHROLOGY',
    '{"condition": "EGFR_DECLINE", "percent_decline_threshold": 15.0, "window_days": 365}',
    'PRIORITY',
    'eGFR has declined by >= 15% within 12 months. Monitor renal filtration velocity.',
    'Your previous report contains a finding that may need review. Please discuss it with your doctor.',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000004',
    'OVERDUE_FOLLOWUP_TASK',
    'Preventive Follow-Up Milestone Exceeded',
    'CARE_CONTINUITY',
    '{"condition": "OVERDUE_TASK", "target": "follow_ups", "status": "PENDING"}',
    'REVIEW_NEEDED',
    'Preventive follow-up task is overdue. Patient reassessment or repeat test requires attention.',
    'You have an overdue health follow-up. Please contact your clinic to reschedule.',
    TRUE
);

-- 2. Clinic & Clinical Staff
-- BCrypt password for "Password@123": $2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRZxW1iS9P5nBvUe1rM1yXWb2UweG

INSERT INTO clinics (id, name, type, registration_number, address, city, state, contact_phone)
VALUES (
    '11111111-1111-1111-1111-111111111001',
    'Metropolitan Health Clinic — Indiranagar',
    'CLINIC',
    'REG-BLR-2023-9012',
    '12th Main Rd, HAL 2nd Stage, Indiranagar',
    'Bengaluru',
    'Karnataka',
    '+91 80 2525 1100'
);

-- Doctor: Dr. Priya Nair
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active)
VALUES (
    '11111111-1111-1111-1111-111111110001',
    'priya.nair@metropolitanhealth.in',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRZxW1iS9P5nBvUe1rM1yXWb2UweG',
    'Dr. Priya Nair, MD',
    '+91 98765 43210',
    'DOCTOR',
    TRUE
);

INSERT INTO doctors (id, user_id, clinic_id, medical_reg_number, specialization)
VALUES (
    '11111111-1111-1111-1111-111111112001',
    '11111111-1111-1111-1111-111111110001',
    '11111111-1111-1111-1111-111111111001',
    'KMC-2014-88421',
    'Internal Medicine'
);

-- Clinic Admin
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active)
VALUES (
    '11111111-1111-1111-1111-111111110002',
    'admin@metropolitanhealth.in',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRZxW1iS9P5nBvUe1rM1yXWb2UweG',
    'Clinic Administrator',
    '+91 80 2525 1101',
    'CLINIC_ADMIN',
    TRUE
);

-- Staff User
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active)
VALUES (
    '11111111-1111-1111-1111-111111110003',
    'staff@metropolitanhealth.in',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRZxW1iS9P5nBvUe1rM1yXWb2UweG',
    'Care Coordinator Suman',
    '+91 80 2525 1102',
    'STAFF',
    TRUE
);

-- 3. Synthetic Patients (Aarav Sharma, Meera Nair, Rohan Verma)
-- Patient 1: Aarav Sharma
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active)
VALUES (
    '22222222-2222-2222-2222-222222220001',
    'aarav.sharma@example.com',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRZxW1iS9P5nBvUe1rM1yXWb2UweG',
    'Aarav Sharma',
    '+91 99887 76655',
    'PATIENT',
    TRUE
);

INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, abha_number, emergency_contact_name, emergency_contact_phone, is_synthetic_demo)
VALUES (
    '22222222-2222-2222-2222-222222221001',
    '22222222-2222-2222-2222-222222220001',
    '1978-04-12',
    'MALE',
    'B+',
    '91-4829-1029-4820',
    'Sunita Sharma',
    '+91 99887 76650',
    TRUE
);

INSERT INTO patient_consents (id, patient_id, clinic_id, doctor_id, scope, status, granted_at)
VALUES (
    '22222222-2222-2222-2222-222222222001',
    '22222222-2222-2222-2222-222222221001',
    '11111111-1111-1111-1111-111111111001',
    '11111111-1111-1111-1111-111111112001',
    'FULL_HISTORY',
    'ACTIVE',
    '2026-01-10 09:00:00+00'
);

-- Patient 2: Meera Nair
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active)
VALUES (
    '22222222-2222-2222-2222-222222220002',
    'meera.nair@example.com',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRZxW1iS9P5nBvUe1rM1yXWb2UweG',
    'Meera Nair',
    '+91 98450 11223',
    'PATIENT',
    TRUE
);

INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, abha_number, emergency_contact_name, emergency_contact_phone, is_synthetic_demo)
VALUES (
    '22222222-2222-2222-2222-222222221002',
    '22222222-2222-2222-2222-222222220002',
    '1972-09-24',
    'FEMALE',
    'O+',
    '91-3948-2849-1192',
    'Ramesh Nair',
    '+91 98450 11220',
    TRUE
);

INSERT INTO patient_consents (id, patient_id, clinic_id, doctor_id, scope, status, granted_at)
VALUES (
    '22222222-2222-2222-2222-222222222002',
    '22222222-2222-2222-2222-222222221002',
    '11111111-1111-1111-1111-111111111001',
    '11111111-1111-1111-1111-111111112001',
    'FULL_HISTORY',
    'ACTIVE',
    '2026-02-15 10:00:00+00'
);

-- Patient 3: Rohan Verma
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active)
VALUES (
    '22222222-2222-2222-2222-222222220003',
    'rohan.verma@example.com',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRZxW1iS9P5nBvUe1rM1yXWb2UweG',
    'Rohan Verma',
    '+91 97410 99887',
    'PATIENT',
    TRUE
);

INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, abha_number, emergency_contact_name, emergency_contact_phone, is_synthetic_demo)
VALUES (
    '22222222-2222-2222-2222-222222221003',
    '22222222-2222-2222-2222-222222220003',
    '1987-11-05',
    'MALE',
    'A+',
    '91-5829-3910-4491',
    'Anjali Verma',
    '+91 97410 99880',
    TRUE
);

INSERT INTO patient_consents (id, patient_id, clinic_id, doctor_id, scope, status, granted_at)
VALUES (
    '22222222-2222-2222-2222-222222222003',
    '22222222-2222-2222-2222-222222221003',
    '11111111-1111-1111-1111-111111111001',
    '11111111-1111-1111-1111-111111112001',
    'FULL_HISTORY',
    'ACTIVE',
    '2026-03-01 11:00:00+00'
);

-- 4. Clinical Data for Aarav Sharma
-- Medical Report
INSERT INTO medical_reports (id, patient_id, uploaded_by_user_id, clinic_id, title, report_type, source_provider_name, report_date, file_storage_key, file_mime_type, file_sha256, extraction_status)
VALUES (
    '33333333-3333-3333-3333-333333330001',
    '22222222-2222-2222-2222-222222221001',
    '11111111-1111-1111-1111-111111110001',
    '11111111-1111-1111-1111-111111111001',
    'Comprehensive Metabolic & Lipid Profile',
    'LAB_REPORT',
    'Metro Diagnostics Bangalore',
    '2026-10-15',
    'reports/synthetic/metro-lab-oct2026.pdf',
    'application/pdf',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'VERIFIED'
);

-- Longitudinal HbA1c observations
INSERT INTO biomarker_observations (id, patient_id, source_report_id, loinc_code, test_name, value_numeric, unit, reference_low, reference_high, observed_at, ocr_confidence, verification_status, verified_by_user_id, verified_at)
VALUES 
(
    '44444444-4444-4444-4444-444444440001',
    '22222222-2222-2222-2222-222222221001',
    NULL,
    '4548-4',
    'HbA1c',
    5.8,
    '%',
    4.0,
    5.6,
    '2026-02-10 10:00:00+00',
    0.99,
    'VERIFIED',
    '11111111-1111-1111-1111-111111110001',
    '2026-02-10 10:05:00+00'
),
(
    '44444444-4444-4444-4444-444444440002',
    '22222222-2222-2222-2222-222222221001',
    NULL,
    '4548-4',
    'HbA1c',
    6.1,
    '%',
    4.0,
    5.6,
    '2026-06-14 11:00:00+00',
    0.98,
    'VERIFIED',
    '11111111-1111-1111-1111-111111110001',
    '2026-06-14 11:05:00+00'
),
(
    '44444444-4444-4444-4444-444444440003',
    '22222222-2222-2222-2222-222222221001',
    '33333333-3333-3333-3333-333333330001',
    '4548-4',
    'HbA1c',
    6.4,
    '%',
    4.0,
    5.6,
    '2026-10-15 14:30:00+00',
    0.98,
    'VERIFIED',
    '11111111-1111-1111-1111-111111110001',
    '2026-10-15 14:35:00+00'
);

-- Blood pressure observations
INSERT INTO biomarker_observations (id, patient_id, source_report_id, loinc_code, test_name, value_numeric, unit, reference_low, reference_high, observed_at, ocr_confidence, verification_status, verified_by_user_id, verified_at)
VALUES 
(
    '44444444-4444-4444-4444-444444440004',
    '22222222-2222-2222-2222-222222221001',
    NULL,
    '8480-6',
    'Systolic BP',
    146.0,
    'mmHg',
    90.0,
    120.0,
    '2026-08-20 10:30:00+00',
    1.0,
    'VERIFIED',
    '11111111-1111-1111-1111-111111110001',
    '2026-08-20 10:35:00+00'
),
(
    '44444444-4444-4444-4444-444444440005',
    '22222222-2222-2222-2222-222222221001',
    NULL,
    '8462-4',
    'Diastolic BP',
    92.0,
    'mmHg',
    60.0,
    80.0,
    '2026-08-20 10:30:00+00',
    1.0,
    'VERIFIED',
    '11111111-1111-1111-1111-111111110001',
    '2026-08-20 10:35:00+00'
);

-- Early Signal Flags
INSERT INTO early_signal_flags (id, patient_id, rule_id, observation_id, clinician_message, patient_message, status, created_at)
VALUES 
(
    '55555555-5555-5555-5555-555555550001',
    '22222222-2222-2222-2222-222222221001',
    '00000000-0000-0000-0000-000000000001',
    '44444444-4444-4444-4444-444444440004',
    'Blood pressure recorded at 146/92 mmHg on 2026-08-20. Recommended 14-day reassessment visit was not completed.',
    'Your previous report contains a finding that may need review. Please discuss it with your doctor.',
    'PENDING_REVIEW',
    '2026-08-20 10:30:00+00'
),
(
    '55555555-5555-5555-5555-555555550002',
    '22222222-2222-2222-2222-222222221001',
    '00000000-0000-0000-0000-000000000002',
    '44444444-4444-4444-4444-444444440003',
    'HbA1c shifted upward from 5.8% (2026-02-10) to 6.1% (2026-06-14) to 6.4% (2026-10-15). Pre-diabetic drift requires lifestyle/pharmacotherapy discussion.',
    'Your recent lab results show a trend that your doctor should examine at your next appointment.',
    'PENDING_REVIEW',
    '2026-10-15 14:45:00+00'
);

-- Follow-Ups
INSERT INTO follow_ups (id, patient_id, doctor_id, clinic_id, signal_flag_id, title, action_type, due_date, status, notes)
VALUES 
(
    '66666666-6666-6666-6666-666666660001',
    '22222222-2222-2222-2222-222222221001',
    '11111111-1111-1111-1111-111111112001',
    '11111111-1111-1111-1111-111111111001',
    '55555555-5555-5555-5555-555555550001',
    'Repeat Blood Pressure Reassessment & Lifestyle Review',
    'REASSESSMENT_VISIT',
    '2026-09-05',
    'OVERDUE',
    'Prior reading 146/92 mmHg at last consult. Advised low sodium intake and home log check.'
),
(
    '66666666-6666-6666-6666-666666660002',
    '22222222-2222-2222-2222-222222221001',
    '11111111-1111-1111-1111-111111112001',
    '11111111-1111-1111-1111-111111111001',
    '55555555-5555-5555-5555-555555550002',
    'Fasting Blood Glucose & Lipid Panel Recheck',
    'REPEAT_TEST',
    '2026-11-30',
    'PENDING',
    'Evaluate glycemic response after 45 days dietary modification.'
);

-- Clinical Encounter & Treatment for Aarav Sharma
INSERT INTO encounters (id, patient_id, doctor_id, clinic_id, encounter_date, chief_complaint, clinical_assessment, patient_friendly_summary)
VALUES (
    '77777777-7777-7777-7777-777777770001',
    '22222222-2222-2222-2222-222222221001',
    '11111111-1111-1111-1111-111111112001',
    '11111111-1111-1111-1111-111111111001',
    '2026-08-20 10:00:00+00',
    'Routine preventive health checkup and mild work-related fatigue',
    'Stage 1 essential hypertension documented (146/92 mmHg). Glycemic markers borderline. Recommended dietary intervention and scheduled 14-day blood pressure reassessment.',
    'Your checkup went well. Your blood pressure was slightly elevated today, so we discussed reducing salt intake and will recheck it in two weeks.'
);

INSERT INTO treatments (id, patient_id, encounter_id, doctor_id, treatment_type, name, dosage, frequency, start_date, end_date, status, notes)
VALUES (
    '88888888-8888-8888-8888-888888880001',
    '22222222-2222-2222-2222-222222221001',
    '77777777-7777-7777-7777-777777770001',
    '11111111-1111-1111-1111-111111112001',
    'MEDICATION',
    'Telmisartan',
    '40 mg',
    'Once daily in the morning',
    '2026-08-20',
    NULL,
    'ACTIVE',
    'First-line antihypertensive therapy for Stage 1 elevation.'
);
