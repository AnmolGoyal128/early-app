export interface ApiResponse<T> {
  success: boolean
  data: T
  error: ApiError | null
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: unknown[]
}

export type UserRole = 'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN' | 'STAFF'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: UserRole
  phone?: string
  patientId?: string
  doctorId?: string
  clinicId?: string
  clinicName?: string
  specialization?: string
  medicalRegNumber?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse extends AuthTokens {
  user: UserProfile
}

export interface PatientSummary {
  id: string
  userId: string
  fullName: string
  email: string
  phone?: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  bloodGroup?: string
  abhaNumber?: string
  consentScope: 'FULL_HISTORY' | 'REPORTS_ONLY' | 'FOLLOW_UPS_ONLY'
  consentStatus: 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  latestBp?: string
  latestHba1c?: number
  latestGlucose?: number
  pendingSignalsCount: number
  dueFollowUpsCount: number
  isSyntheticDemo?: boolean
}

export interface TimelineItem {
  id: string
  type: 'LAB_REPORT' | 'ENCOUNTER' | 'TREATMENT' | 'FOLLOW_UP' | 'SIGNAL'
  date: string
  title: string
  subtitle?: string
  provider?: string
  badgeText?: string
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'verified' | 'amber'
  details?: Record<string, unknown>
}

export interface ConsentRecord {
  id: string
  patientId: string
  clinicId: string
  clinicName: string
  doctorId?: string
  doctorName?: string
  scope: 'FULL_HISTORY' | 'REPORTS_ONLY' | 'FOLLOW_UPS_ONLY'
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  grantedAt: string
  expiresAt?: string
  revokedAt?: string
}

export type ExtractionStatus = 'PROCESSING' | 'NEEDS_REVIEW' | 'VERIFIED' | 'FAILED'
export type VerificationStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED'

export interface BiomarkerObservation {
  id: string
  reportId?: string
  testName: string
  loincCode?: string
  valueNumeric?: number
  valueText?: string
  unit?: string
  referenceLow?: number
  referenceHigh?: number
  isAbnormal?: boolean
  ocrConfidence?: number
  verificationStatus: VerificationStatus
  observedAt: string
  sourceReportId?: string
}

export interface MedicalReport {
  id: string
  patientId: string
  title: string
  reportType: string
  reportDate: string
  sourceProviderName: string
  extractionStatus: ExtractionStatus
  originalFileUrl?: string
  rawOcrJson?: unknown
  createdAt: string
  observations: BiomarkerObservation[]
}

export interface VerifyReportPayload {
  reportDate: string
  sourceProviderName: string
  observations: Array<{
    observationId: string
    testName: string
    loincCode?: string
    valueNumeric?: number
    valueText?: string
    unit?: string
    referenceLow?: number
    referenceHigh?: number
    action: 'VERIFY' | 'REJECT' | 'EDIT'
  }>
}

export interface TrendPoint {
  observedAt: string
  valueNumeric: number
  sourceReportId?: string
  isAbnormal?: boolean
}

export interface BiomarkerTrend {
  testName: string
  unit: string
  refLow?: number
  refHigh?: number
  points: TrendPoint[]
}

export interface TreatmentRecord {
  id: string
  patientId: string
  encounterId?: string
  name: string
  category: 'MEDICATION' | 'LIFESTYLE' | 'PROCEDURE'
  dosage?: string
  frequency?: string
  status: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED'
  startedAt: string
  endedAt?: string
  notes?: string
}

export interface EncounterRecord {
  id: string
  patientId: string
  doctorId: string
  doctorName: string
  clinicId: string
  clinicName: string
  encounterDate: string
  chiefComplaint: string
  clinicalAssessment: string
  patientFriendlySummary: string
  treatments: TreatmentRecord[]
  createdAt: string
}

export type SignalSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type SignalStatus = 'PENDING_REVIEW' | 'ACKNOWLEDGED' | 'ACTIONED' | 'DISMISSED'

export interface EarlySignalFlag {
  id: string
  patientId: string
  patientName?: string
  ruleCode: string
  ruleTitle: string
  severity: SignalSeverity
  status: SignalStatus
  clinicianMessage: string
  patientMessage: string
  observationId?: string
  flaggedAt: string
  reviewedAt?: string
  reviewedByDoctorId?: string
  clinicianNote?: string
}

export interface PreventiveRule {
  id: string
  ruleCode: string
  title: string
  description: string
  category: string
  thresholdLogic: string
  isActive: boolean
  clinicianGuidelineRef?: string
}

export type FollowUpActionType = 'REPEAT_TEST' | 'REASSESSMENT_VISIT' | 'SPECIALIST_REFERRAL' | 'LIFESTYLE_CHECK'
export type FollowUpStatus = 'PENDING' | 'OVERDUE' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED'

export interface FollowUpRecord {
  id: string
  patientId: string
  patientName?: string
  clinicId: string
  doctorId?: string
  doctorName?: string
  title: string
  actionType: FollowUpActionType
  dueDate: string
  status: FollowUpStatus
  signalFlagId?: string
  encounterId?: string
  notes?: string
  completedAt?: string
}

export interface ClinicDashboardSummary {
  totalPatients: number
  followUpsDue: number
  followUpsOverdue: number
  followUpsCompleted: number
  patientsNeedingReview: number
}

export interface CorrectionRequest {
  id: string
  patientId: string
  patientName: string
  targetType: 'OBSERVATION' | 'REPORT' | 'TREATMENT'
  targetId: string
  issueDescription: string
  status: 'PENDING' | 'RESOLVED' | 'REJECTED'
  resolutionNotes?: string
  createdAt: string
}

export interface AuditLog {
  id: string
  timestamp: string
  actorUserId: string
  actorName: string
  actorRole: string
  action: string
  resourceType: string
  resourceId: string
  details?: string
}
