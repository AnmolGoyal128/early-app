import {
  PatientSummary,
  TimelineItem,
  ConsentRecord,
  MedicalReport,
  BiomarkerTrend,
  EncounterRecord,
  EarlySignalFlag,
  PreventiveRule,
  FollowUpRecord,
  ClinicDashboardSummary,
  CorrectionRequest,
  AuditLog,
  UserProfile,
} from '@/types/api'

export const DEMO_DOCTOR_USER: UserProfile = {
  id: 'usr-doc-001',
  email: 'priya.nair@metropolitanhealth.in',
  fullName: 'Dr. Priya Nair, MD',
  role: 'DOCTOR',
  phone: '+91 98765 43210',
  doctorId: 'doc-001',
  clinicId: 'cln-001',
  clinicName: 'Metropolitan Health Clinic — Indiranagar',
  specialization: 'Internal Medicine',
  medicalRegNumber: 'KMC-2014-88421',
}

export const DEMO_PATIENT_USER: UserProfile = {
  id: 'usr-pat-001',
  email: 'aarav.sharma@example.com',
  fullName: 'Aarav Sharma',
  role: 'PATIENT',
  phone: '+91 99887 76655',
  patientId: 'pat-aarav-001',
}

export const INITIAL_PATIENTS: PatientSummary[] = [
  {
    id: 'pat-aarav-001',
    userId: 'usr-pat-001',
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 99887 76655',
    dateOfBirth: '1978-04-12',
    gender: 'MALE',
    bloodGroup: 'B+',
    abhaNumber: '91-4829-1029-4820',
    consentScope: 'FULL_HISTORY',
    consentStatus: 'ACTIVE',
    latestBp: '146/92 mmHg',
    latestHba1c: 6.4,
    latestGlucose: 118,
    pendingSignalsCount: 2,
    dueFollowUpsCount: 1,
    isSyntheticDemo: true,
  },
  {
    id: 'pat-meera-002',
    userId: 'usr-pat-002',
    fullName: 'Meera Nair',
    email: 'meera.nair@example.com',
    phone: '+91 98450 11223',
    dateOfBirth: '1972-09-24',
    gender: 'FEMALE',
    bloodGroup: 'O+',
    abhaNumber: '91-3948-2849-1192',
    consentScope: 'FULL_HISTORY',
    consentStatus: 'ACTIVE',
    latestBp: '132/84 mmHg',
    latestHba1c: 7.2,
    latestGlucose: 142,
    pendingSignalsCount: 1,
    dueFollowUpsCount: 1,
    isSyntheticDemo: true,
  },
  {
    id: 'pat-rohan-003',
    userId: 'usr-pat-003',
    fullName: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    phone: '+91 97410 99887',
    dateOfBirth: '1987-11-05',
    gender: 'MALE',
    bloodGroup: 'A+',
    abhaNumber: '91-5829-3910-4491',
    consentScope: 'FULL_HISTORY',
    consentStatus: 'ACTIVE',
    latestBp: '122/78 mmHg',
    latestHba1c: 5.4,
    latestGlucose: 92,
    pendingSignalsCount: 0,
    dueFollowUpsCount: 0,
    isSyntheticDemo: true,
  },
]

export const PREVENTIVE_RULES: PreventiveRule[] = [
  {
    id: 'rule-001',
    ruleCode: 'BP_ELEVATED_REVIEW',
    title: 'Elevated Blood Pressure Without Completed Reassessment',
    description: 'Triggers when systolic BP >= 140 mmHg or diastolic BP >= 90 mmHg and no completed reassessment visit exists within 30 days.',
    category: 'Hypertension Management',
    thresholdLogic: 'Systolic >= 140 OR Diastolic >= 90 AND FollowUp.reassessment != COMPLETED',
    isActive: true,
    clinicianGuidelineRef: 'Indian Guidelines on Hypertension (I-GH-IV) · Section 4.2',
  },
  {
    id: 'rule-002',
    ruleCode: 'HBA1C_DRIFT_6M',
    title: 'Longitudinal HbA1c Drift (>= 0.5% over 6 Months)',
    description: 'Flags pre-diabetic or diabetic glycemic escalation when HbA1c increases by >= 0.5% compared to baseline within a 6-month window.',
    category: 'Diabetes Care',
    thresholdLogic: 'Delta(HbA1c, 180d) >= +0.5% OR Current >= 6.5%',
    isActive: true,
    clinicianGuidelineRef: 'RSSDI Guidelines for Clinical Management of Diabetes (2024)',
  },
  {
    id: 'rule-003',
    ruleCode: 'EGFR_DECLINE_15PCT',
    title: 'Renal Function Vigilance (eGFR Decline >= 15%)',
    description: 'Monitors renal filtration velocity in hypertensive and diabetic patients over 12 months.',
    category: 'Nephrology & Renal Risk',
    thresholdLogic: 'Delta(eGFR, 365d) <= -15%',
    isActive: true,
    clinicianGuidelineRef: 'KDIGO 2024 Clinical Practice Guideline for CKD Evaluation',
  },
  {
    id: 'rule-004',
    ruleCode: 'OVERDUE_FOLLOWUP_TASK',
    title: 'Preventive Follow-Up Milestone Exceeded',
    description: 'Surfaces pending repeat tests or review appointments once current calendar date surpasses configured due date.',
    category: 'Care Continuity',
    thresholdLogic: 'FollowUp.status == PENDING AND FollowUp.dueDate < CURRENT_DATE',
    isActive: true,
    clinicianGuidelineRef: 'Standard Clinical Governance Protocol · Project EARLY',
  },
]

export const INITIAL_SIGNALS: EarlySignalFlag[] = [
  {
    id: 'sig-001',
    patientId: 'pat-aarav-001',
    patientName: 'Aarav Sharma',
    ruleCode: 'BP_ELEVATED_REVIEW',
    ruleTitle: 'Elevated Blood Pressure Without Completed Reassessment',
    severity: 'HIGH',
    status: 'PENDING_REVIEW',
    clinicianMessage: 'Blood pressure recorded at 146/92 mmHg on 2026-08-20. Recommended 14-day reassessment visit was not completed.',
    patientMessage: 'Your previous report contains a finding that may need review. Please discuss it with your doctor.',
    observationId: 'obs-aarav-bp-1',
    flaggedAt: '2026-08-20T10:30:00Z',
  },
  {
    id: 'sig-002',
    patientId: 'pat-aarav-001',
    patientName: 'Aarav Sharma',
    ruleCode: 'HBA1C_DRIFT_6M',
    ruleTitle: 'Longitudinal HbA1c Drift (+0.6% over 6 Months)',
    severity: 'MEDIUM',
    status: 'PENDING_REVIEW',
    clinicianMessage: 'HbA1c shifted upward from 5.8% (2026-02-10) to 6.1% (2026-06-14) to 6.4% (2026-10-15). Pre-diabetic drift requires lifestyle/pharmacotherapy discussion.',
    patientMessage: 'Your recent lab results show a trend that your doctor should examine at your next appointment.',
    observationId: 'obs-aarav-hba1c-3',
    flaggedAt: '2026-10-15T14:45:00Z',
  },
  {
    id: 'sig-003',
    patientId: 'pat-meera-002',
    patientName: 'Meera Nair',
    ruleCode: 'HBA1C_DRIFT_6M',
    ruleTitle: 'Glycemic Escalation (HbA1c 7.2%)',
    severity: 'HIGH',
    status: 'PENDING_REVIEW',
    clinicianMessage: 'Latest lab shows HbA1c at 7.2% and Fasting Blood Sugar 142 mg/dL. Ongoing Metformin dosage adjustment may be indicated.',
    patientMessage: 'Your latest lab report is ready for clinical discussion. Please schedule your routine review.',
    observationId: 'obs-meera-hba1c-1',
    flaggedAt: '2026-10-15T11:00:00Z',
  },
]

export const INITIAL_FOLLOW_UPS: FollowUpRecord[] = [
  {
    id: 'flw-001',
    patientId: 'pat-aarav-001',
    patientName: 'Aarav Sharma',
    clinicId: 'cln-001',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Nair',
    title: 'Repeat Blood Pressure Reassessment & Lifestyle Review',
    actionType: 'REASSESSMENT_VISIT',
    dueDate: '2026-09-05',
    status: 'OVERDUE',
    signalFlagId: 'sig-001',
    notes: 'Prior reading 146/92 mmHg at last consult. Advised low sodium intake and home log check.',
  },
  {
    id: 'flw-002',
    patientId: 'pat-aarav-001',
    patientName: 'Aarav Sharma',
    clinicId: 'cln-001',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Nair',
    title: 'Fasting Blood Glucose & Lipid Panel Recheck',
    actionType: 'REPEAT_TEST',
    dueDate: '2026-11-30',
    status: 'PENDING',
    signalFlagId: 'sig-002',
    notes: 'Evaluate glycemic response after 45 days dietary modification.',
  },
  {
    id: 'flw-003',
    patientId: 'pat-meera-002',
    patientName: 'Meera Nair',
    clinicId: 'cln-001',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Nair',
    title: 'Endocrine Specialist Review & HbA1c Target Discussion',
    actionType: 'SPECIALIST_REFERRAL',
    dueDate: '2026-11-20',
    status: 'PENDING',
    signalFlagId: 'sig-003',
    notes: 'Discuss add-on SGLT-2i or DPP-4i given HbA1c > 7.0%.',
  },
  {
    id: 'flw-004',
    patientId: 'pat-rohan-003',
    patientName: 'Rohan Verma',
    clinicId: 'cln-001',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Nair',
    title: 'Annual Executive Health Screen (Lipids + Fasting Sugar)',
    actionType: 'REPEAT_TEST',
    dueDate: '2026-05-15',
    status: 'COMPLETED',
    completedAt: '2026-05-12T09:30:00Z',
    notes: 'Completed ahead of schedule. All parameters within normal baseline.',
  },
]

export const INITIAL_REPORTS: MedicalReport[] = [
  {
    id: 'rep-aarav-001',
    patientId: 'pat-aarav-001',
    title: 'Comprehensive Metabolic & Lipid Profile',
    reportType: 'LABORATORY',
    reportDate: '2026-10-15',
    sourceProviderName: 'Metro Diagnostics Bangalore',
    extractionStatus: 'VERIFIED',
    originalFileUrl: '/reports/metro-lab-oct2026.pdf',
    createdAt: '2026-10-15T14:30:00Z',
    observations: [
      {
        id: 'obs-aarav-hba1c-3',
        reportId: 'rep-aarav-001',
        testName: 'HbA1c (Glycated Hemoglobin)',
        loincCode: '4548-4',
        valueNumeric: 6.4,
        unit: '%',
        referenceLow: 4.0,
        referenceHigh: 5.6,
        isAbnormal: true,
        ocrConfidence: 0.98,
        verificationStatus: 'VERIFIED',
        observedAt: '2026-10-15',
      },
      {
        id: 'obs-aarav-glu-3',
        reportId: 'rep-aarav-001',
        testName: 'Fasting Plasma Glucose',
        loincCode: '1558-6',
        valueNumeric: 118,
        unit: 'mg/dL',
        referenceLow: 70,
        referenceHigh: 99,
        isAbnormal: true,
        ocrConfidence: 0.96,
        verificationStatus: 'VERIFIED',
        observedAt: '2026-10-15',
      },
      {
        id: 'obs-aarav-ldl-1',
        reportId: 'rep-aarav-001',
        testName: 'LDL Cholesterol',
        loincCode: '13457-7',
        valueNumeric: 124,
        unit: 'mg/dL',
        referenceLow: 0,
        referenceHigh: 100,
        isAbnormal: true,
        ocrConfidence: 0.95,
        verificationStatus: 'VERIFIED',
        observedAt: '2026-10-15',
      },
    ],
  },
  {
    id: 'rep-aarav-002',
    patientId: 'pat-aarav-001',
    title: 'Routine Glycemic & Renal Checkup',
    reportType: 'LABORATORY',
    reportDate: '2026-06-14',
    sourceProviderName: 'Anand Diagnostic Laboratory',
    extractionStatus: 'VERIFIED',
    originalFileUrl: '/reports/anand-lab-jun2026.pdf',
    createdAt: '2026-06-14T11:00:00Z',
    observations: [
      {
        id: 'obs-aarav-hba1c-2',
        reportId: 'rep-aarav-002',
        testName: 'HbA1c (Glycated Hemoglobin)',
        loincCode: '4548-4',
        valueNumeric: 6.1,
        unit: '%',
        referenceLow: 4.0,
        referenceHigh: 5.6,
        isAbnormal: true,
        ocrConfidence: 0.97,
        verificationStatus: 'VERIFIED',
        observedAt: '2026-06-14',
      },
      {
        id: 'obs-aarav-glu-2',
        reportId: 'rep-aarav-002',
        testName: 'Fasting Plasma Glucose',
        loincCode: '1558-6',
        valueNumeric: 109,
        unit: 'mg/dL',
        referenceLow: 70,
        referenceHigh: 99,
        isAbnormal: true,
        ocrConfidence: 0.94,
        verificationStatus: 'VERIFIED',
        observedAt: '2026-06-14',
      },
    ],
  },
  {
    id: 'rep-aarav-003',
    patientId: 'pat-aarav-001',
    title: 'Annual Executive Health Panel',
    reportType: 'LABORATORY',
    reportDate: '2026-02-10',
    sourceProviderName: 'Apollo Diagnostics',
    extractionStatus: 'VERIFIED',
    originalFileUrl: '/reports/apollo-feb2026.pdf',
    createdAt: '2026-02-10T10:15:00Z',
    observations: [
      {
        id: 'obs-aarav-hba1c-1',
        reportId: 'rep-aarav-003',
        testName: 'HbA1c (Glycated Hemoglobin)',
        loincCode: '4548-4',
        valueNumeric: 5.8,
        unit: '%',
        referenceLow: 4.0,
        referenceHigh: 5.6,
        isAbnormal: true,
        ocrConfidence: 0.99,
        verificationStatus: 'VERIFIED',
        observedAt: '2026-02-10',
      },
    ],
  },
  {
    id: 'rep-meera-needs-review',
    patientId: 'pat-meera-002',
    title: 'Metro Diagnostics Lab Report — Diabetic & Renal Profile',
    reportType: 'LABORATORY',
    reportDate: '2026-10-15',
    sourceProviderName: 'Metro Diagnostics Bangalore',
    extractionStatus: 'NEEDS_REVIEW',
    originalFileUrl: '/reports/metro-meera-oct2026.pdf',
    createdAt: '2026-10-15T11:00:00Z',
    observations: [
      {
        id: 'obs-meera-hba1c-1',
        reportId: 'rep-meera-needs-review',
        testName: 'HbA1c (Glycated Hemoglobin)',
        loincCode: '4548-4',
        valueNumeric: 7.2,
        unit: '%',
        referenceLow: 4.0,
        referenceHigh: 5.6,
        isAbnormal: true,
        ocrConfidence: 0.98,
        verificationStatus: 'PENDING_VERIFICATION',
        observedAt: '2026-10-15',
      },
      {
        id: 'obs-meera-glu-1',
        reportId: 'rep-meera-needs-review',
        testName: 'Fasting Plasma Glucose',
        loincCode: '1558-6',
        valueNumeric: 142,
        unit: 'mg/dL',
        referenceLow: 70,
        referenceHigh: 99,
        isAbnormal: true,
        ocrConfidence: 0.96,
        verificationStatus: 'PENDING_VERIFICATION',
        observedAt: '2026-10-15',
      },
      {
        id: 'obs-meera-creat-1',
        reportId: 'rep-meera-needs-review',
        testName: 'Serum Creatinine',
        loincCode: '2160-0',
        valueNumeric: 0.9,
        unit: 'mg/dL',
        referenceLow: 0.5,
        referenceHigh: 1.1,
        isAbnormal: false,
        ocrConfidence: 0.88, // < 0.90 flags amber badge requiring clinician verification
        verificationStatus: 'PENDING_VERIFICATION',
        observedAt: '2026-10-15',
      },
      {
        id: 'obs-meera-egfr-1',
        reportId: 'rep-meera-needs-review',
        testName: 'Estimated GFR (CKD-EPI)',
        loincCode: '33914-3',
        valueNumeric: 88,
        unit: 'mL/min/1.73m²',
        referenceLow: 90,
        referenceHigh: 120,
        isAbnormal: true,
        ocrConfidence: 0.94,
        verificationStatus: 'PENDING_VERIFICATION',
        observedAt: '2026-10-15',
      },
    ],
  },
]

export const INITIAL_ENCOUNTERS: EncounterRecord[] = [
  {
    id: 'enc-aarav-001',
    patientId: 'pat-aarav-001',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Nair',
    clinicId: 'cln-001',
    clinicName: 'Metropolitan Health Clinic',
    encounterDate: '2026-08-20',
    chiefComplaint: 'Headache on waking, occasional dizziness after exertion.',
    clinicalAssessment: 'Stage 1 Essential Hypertension (Office BP 146/92 mmHg confirmed on two measurements). Mild dyslipidemia noted on previous lab. Lifestyle intervention advised; 14-day blood pressure log and reassessment requested.',
    patientFriendlySummary: 'You discussed mild headaches and morning dizziness. Your blood pressure was slightly higher than ideal (146/92). Your doctor recommended reducing dietary salt, tracking morning readings, and scheduling a follow-up in two weeks.',
    createdAt: '2026-08-20T10:45:00Z',
    treatments: [
      {
        id: 'trt-aarav-001',
        patientId: 'pat-aarav-001',
        name: 'Dietary Sodium Restriction (< 2g/day) & 30-min Brisk Walk',
        category: 'LIFESTYLE',
        dosage: 'Daily',
        status: 'ACTIVE',
        startedAt: '2026-08-20',
        notes: 'Target systolic < 130 mmHg without medication initiation if responsive.',
      },
    ],
  },
  {
    id: 'enc-aarav-002',
    patientId: 'pat-aarav-001',
    doctorId: 'doc-002',
    doctorName: 'Dr. Sanjay Rao',
    clinicId: 'cln-002',
    clinicName: 'CarePlus Medical Center',
    encounterDate: '2026-02-15',
    chiefComplaint: 'Routine annual preventive consultation.',
    clinicalAssessment: 'Overweight (BMI 26.8 kg/m²). Pre-diabetes risk factor discussion. HbA1c 5.8%. Advised carbohydrate moderation and weight management.',
    patientFriendlySummary: 'Your annual health review confirmed healthy cardiac and lung function. Your blood sugar was mildly elevated in the pre-diabetic category (HbA1c 5.8%). You agreed to increase physical activity.',
    createdAt: '2026-02-15T16:00:00Z',
    treatments: [],
  },
]

export const INITIAL_CONSENTS: ConsentRecord[] = [
  {
    id: 'cns-001',
    patientId: 'pat-aarav-001',
    clinicId: 'cln-001',
    clinicName: 'Metropolitan Health Clinic — Indiranagar',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Nair',
    scope: 'FULL_HISTORY',
    status: 'ACTIVE',
    grantedAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'cns-002',
    patientId: 'pat-aarav-001',
    clinicId: 'cln-002',
    clinicName: 'CarePlus Medical Center — Koramangala',
    scope: 'REPORTS_ONLY',
    status: 'ACTIVE',
    grantedAt: '2026-02-10T11:30:00Z',
  },
]

export const MOCK_TRENDS: Record<string, BiomarkerTrend[]> = {
  'pat-aarav-001': [
    {
      testName: 'HbA1c',
      unit: '%',
      refLow: 4.0,
      refHigh: 5.6,
      points: [
        { observedAt: '2026-02-10', valueNumeric: 5.8, isAbnormal: true },
        { observedAt: '2026-06-14', valueNumeric: 6.1, isAbnormal: true },
        { observedAt: '2026-10-15', valueNumeric: 6.4, isAbnormal: true },
      ],
    },
    {
      testName: 'Systolic Blood Pressure',
      unit: 'mmHg',
      refLow: 90,
      refHigh: 120,
      points: [
        { observedAt: '2026-02-15', valueNumeric: 130, isAbnormal: true },
        { observedAt: '2026-06-14', valueNumeric: 138, isAbnormal: true },
        { observedAt: '2026-08-20', valueNumeric: 146, isAbnormal: true },
      ],
    },
    {
      testName: 'Diastolic Blood Pressure',
      unit: 'mmHg',
      refLow: 60,
      refHigh: 80,
      points: [
        { observedAt: '2026-02-15', valueNumeric: 82, isAbnormal: true },
        { observedAt: '2026-06-14', valueNumeric: 88, isAbnormal: true },
        { observedAt: '2026-08-20', valueNumeric: 92, isAbnormal: true },
      ],
    },
    {
      testName: 'Fasting Plasma Glucose',
      unit: 'mg/dL',
      refLow: 70,
      refHigh: 99,
      points: [
        { observedAt: '2026-02-10', valueNumeric: 98, isAbnormal: false },
        { observedAt: '2026-06-14', valueNumeric: 109, isAbnormal: true },
        { observedAt: '2026-10-15', valueNumeric: 118, isAbnormal: true },
      ],
    },
  ],
  'pat-meera-002': [
    {
      testName: 'HbA1c',
      unit: '%',
      refLow: 4.0,
      refHigh: 5.6,
      points: [
        { observedAt: '2025-11-20', valueNumeric: 6.6, isAbnormal: true },
        { observedAt: '2026-04-10', valueNumeric: 6.9, isAbnormal: true },
        { observedAt: '2026-10-15', valueNumeric: 7.2, isAbnormal: true },
      ],
    },
    {
      testName: 'Fasting Plasma Glucose',
      unit: 'mg/dL',
      refLow: 70,
      refHigh: 99,
      points: [
        { observedAt: '2025-11-20', valueNumeric: 126, isAbnormal: true },
        { observedAt: '2026-04-10', valueNumeric: 134, isAbnormal: true },
        { observedAt: '2026-10-15', valueNumeric: 142, isAbnormal: true },
      ],
    },
  ],
  'pat-rohan-003': [
    {
      testName: 'HbA1c',
      unit: '%',
      refLow: 4.0,
      refHigh: 5.6,
      points: [
        { observedAt: '2025-05-10', valueNumeric: 5.3, isAbnormal: false },
        { observedAt: '2026-05-12', valueNumeric: 5.4, isAbnormal: false },
      ],
    },
    {
      testName: 'Systolic Blood Pressure',
      unit: 'mmHg',
      refLow: 90,
      refHigh: 120,
      points: [
        { observedAt: '2025-05-10', valueNumeric: 118, isAbnormal: false },
        { observedAt: '2026-05-12', valueNumeric: 122, isAbnormal: false },
      ],
    },
  ],
}

// In-Memory Mutating State for Demo Fallback
let patientsState = [...INITIAL_PATIENTS]
let reportsState = [...INITIAL_REPORTS]
let signalsState = [...INITIAL_SIGNALS]
let followUpsState = [...INITIAL_FOLLOW_UPS]
let encountersState = [...INITIAL_ENCOUNTERS]
let consentsState = [...INITIAL_CONSENTS]
let correctionRequestsState: CorrectionRequest[] = []

export const mockDb = {
  getPatients: () => patientsState,
  getPatientById: (id: string) => patientsState.find((p) => p.id === id),
  getReports: (patientId?: string) =>
    patientId ? reportsState.filter((r) => r.patientId === patientId) : reportsState,
  getReportById: (id: string) => reportsState.find((r) => r.id === id),
  getSignals: (patientId?: string) =>
    patientId ? signalsState.filter((s) => s.patientId === patientId) : signalsState,
  getFollowUps: (patientId?: string) =>
    patientId ? followUpsState.filter((f) => f.patientId === patientId) : followUpsState,
  getEncounters: (patientId?: string) =>
    patientId ? encountersState.filter((e) => e.patientId === patientId) : encountersState,
  getConsents: (patientId?: string) =>
    patientId ? consentsState.filter((c) => c.patientId === patientId) : consentsState,
  getRules: () => PREVENTIVE_RULES,
  getTrends: (patientId: string) => MOCK_TRENDS[patientId] || [],
  getDashboardSummary: (): ClinicDashboardSummary => {
    const totalPatients = patientsState.length
    const followUpsDue = followUpsState.filter((f) => f.status === 'PENDING').length
    const followUpsOverdue = followUpsState.filter((f) => f.status === 'OVERDUE').length
    const followUpsCompleted = followUpsState.filter((f) => f.status === 'COMPLETED').length
    const patientsNeedingReview = signalsState.filter((s) => s.status === 'PENDING_REVIEW').length
    return {
      totalPatients,
      followUpsDue,
      followUpsOverdue,
      followUpsCompleted,
      patientsNeedingReview,
    }
  },
  verifyReport: (reportId: string, observations: Array<{ observationId: string; valueNumeric?: number; unit?: string }>) => {
    const report = reportsState.find((r) => r.id === reportId)
    if (report) {
      report.extractionStatus = 'VERIFIED'
      report.observations = report.observations.map((obs) => {
        const update = observations.find((o) => o.observationId === obs.id)
        if (update) {
          return {
            ...obs,
            valueNumeric: update.valueNumeric ?? obs.valueNumeric,
            unit: update.unit ?? obs.unit,
            verificationStatus: 'VERIFIED',
          }
        }
        return { ...obs, verificationStatus: 'VERIFIED' }
      })
    }
    return report
  },
  reviewSignal: (signalId: string, status: 'ACKNOWLEDGED' | 'ACTIONED' | 'DISMISSED', clinicianNote?: string) => {
    const signal = signalsState.find((s) => s.id === signalId)
    if (signal) {
      signal.status = status
      signal.clinicianNote = clinicianNote
      signal.reviewedAt = new Date().toISOString()
      signal.reviewedByDoctorId = 'doc-001'
    }
    return signal
  },
  updateFollowUpStatus: (followUpId: string, status: 'COMPLETED' | 'POSTPONED' | 'CANCELLED', notes?: string) => {
    const followUp = followUpsState.find((f) => f.id === followUpId)
    if (followUp) {
      followUp.status = status
      if (notes) followUp.notes = `${followUp.notes || ''} [Update: ${notes}]`
      if (status === 'COMPLETED') followUp.completedAt = new Date().toISOString()
    }
    return followUp
  },
  createFollowUp: (data: Partial<FollowUpRecord>) => {
    const newFollowUp: FollowUpRecord = {
      id: `flw-${Date.now()}`,
      patientId: data.patientId || 'pat-aarav-001',
      clinicId: data.clinicId || 'cln-001',
      doctorId: 'doc-001',
      doctorName: 'Dr. Priya Nair',
      title: data.title || 'Follow-Up Action',
      actionType: data.actionType || 'REASSESSMENT_VISIT',
      dueDate: data.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'PENDING',
      notes: data.notes,
      signalFlagId: data.signalFlagId,
      encounterId: data.encounterId,
    }
    followUpsState.unshift(newFollowUp)
    return newFollowUp
  },
  addReport: (report: Partial<MedicalReport>) => {
    const newReport: MedicalReport = {
      id: `rep-${Date.now()}`,
      patientId: report.patientId || 'pat-aarav-001',
      title: report.title || 'Uploaded Medical Report',
      reportType: report.reportType || 'LABORATORY',
      reportDate: report.reportDate || new Date().toISOString().split('T')[0],
      sourceProviderName: report.sourceProviderName || 'Clinical Diagnostic Center',
      extractionStatus: 'NEEDS_REVIEW',
      createdAt: new Date().toISOString(),
      observations: report.observations || [
        {
          id: `obs-${Date.now()}-1`,
          testName: 'HbA1c',
          valueNumeric: 6.4,
          unit: '%',
          referenceLow: 4.0,
          referenceHigh: 5.6,
          isAbnormal: true,
          ocrConfidence: 0.97,
          verificationStatus: 'PENDING_VERIFICATION',
          observedAt: new Date().toISOString().split('T')[0],
        },
      ],
    }
    reportsState.unshift(newReport)
    return newReport
  },
  addCorrectionRequest: (req: Partial<CorrectionRequest>) => {
    const newReq: CorrectionRequest = {
      id: `cr-${Date.now()}`,
      patientId: req.patientId || 'pat-aarav-001',
      patientName: req.patientName || 'Aarav Sharma',
      targetType: req.targetType || 'OBSERVATION',
      targetId: req.targetId || 'obs-001',
      issueDescription: req.issueDescription || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }
    correctionRequestsState.unshift(newReq)
    return newReq
  },
  getCorrectionRequests: (patientId?: string) =>
    patientId ? correctionRequestsState.filter((c) => c.patientId === patientId) : correctionRequestsState,
}
