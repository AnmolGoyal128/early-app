import { apiClient } from '@/lib/api-client'
import {
  UserProfile,
  AuthResponse,
  PatientSummary,
  TimelineItem,
  ConsentRecord,
  MedicalReport,
  VerifyReportPayload,
  BiomarkerTrend,
  BiomarkerObservation,
  EncounterRecord,
  TreatmentRecord,
  EarlySignalFlag,
  PreventiveRule,
  FollowUpRecord,
  ClinicDashboardSummary,
  CorrectionRequest,
  AuditLog,
} from '@/types/api'

export const authService = {
  login: async (email: string, password: string, role?: string) => {
    return apiClient.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
      requiresAuth: false,
    })
  },
  register: async (payload: Record<string, unknown>) => {
    return apiClient.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: false,
    })
  },
  getMe: async () => {
    return apiClient.request<UserProfile>('/auth/me')
  },
}

export const patientService = {
  getMe: async () => {
    return apiClient.request<PatientSummary>('/patients/me')
  },
  listPatients: async (search?: string) => {
    const query = search ? `?q=${encodeURIComponent(search)}` : ''
    return apiClient.request<PatientSummary[]>(`/patients${query}`)
  },
  getPatientById: async (patientId: string) => {
    return apiClient.request<PatientSummary>(`/patients/${patientId}`)
  },
  getTimeline: async (patientId: string, params?: { fromDate?: string; toDate?: string; type?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return apiClient.request<TimelineItem[]>(`/patients/${patientId}/timeline${q ? `?${q}` : ''}`)
  },
}

export const consentService = {
  listConsents: async () => {
    return apiClient.request<ConsentRecord[]>('/consents')
  },
  grantConsent: async (payload: { clinicId: string; doctorId?: string; scope?: string; expiresAt?: string }) => {
    return apiClient.request<ConsentRecord>('/consents', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  revokeConsent: async (consentId: string) => {
    return apiClient.request<{ status: 'REVOKED' }>(`/consents/${consentId}/revoke`, {
      method: 'POST',
    })
  },
}

export const reportService = {
  uploadReport: async (formData: FormData) => {
    return apiClient.request<MedicalReport>('/reports/upload', {
      method: 'POST',
      body: formData,
    })
  },
  listPatientReports: async (patientId: string) => {
    return apiClient.request<MedicalReport[]>(`/patients/${patientId}/reports`)
  },
  getReport: async (reportId: string) => {
    return apiClient.request<MedicalReport>(`/reports/${reportId}`)
  },
  verifyReport: async (reportId: string, payload: VerifyReportPayload) => {
    return apiClient.request<MedicalReport>(`/reports/${reportId}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}

export const observationService = {
  getObservations: async (patientId: string, testName?: string) => {
    const q = testName ? `?testName=${encodeURIComponent(testName)}` : ''
    return apiClient.request<BiomarkerObservation[]>(`/patients/${patientId}/observations${q}`)
  },
  getTrends: async (patientId: string) => {
    return apiClient.request<BiomarkerTrend[]>(`/patients/${patientId}/observations/trends`)
  },
}

export const encounterService = {
  listEncounters: async (patientId: string) => {
    return apiClient.request<EncounterRecord[]>(`/patients/${patientId}/encounters`)
  },
  createEncounter: async (patientId: string, payload: {
    chiefComplaint: string
    clinicalAssessment: string
    patientFriendlySummary: string
    treatments?: Partial<TreatmentRecord>[]
  }) => {
    return apiClient.request<EncounterRecord>(`/patients/${patientId}/encounters`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  listTreatments: async (patientId: string) => {
    return apiClient.request<TreatmentRecord[]>(`/patients/${patientId}/treatments`)
  },
  updateTreatmentStatus: async (treatmentId: string, status: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED') => {
    return apiClient.request<TreatmentRecord>(`/treatments/${treatmentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}

export const signalService = {
  listSignals: async (patientId: string) => {
    return apiClient.request<EarlySignalFlag[]>(`/patients/${patientId}/signals`)
  },
  reviewSignal: async (signalId: string, status: 'ACKNOWLEDGED' | 'ACTIONED' | 'DISMISSED', clinicianNote?: string) => {
    return apiClient.request<EarlySignalFlag>(`/signals/${signalId}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, clinicianNote }),
    })
  },
  listRules: async () => {
    return apiClient.request<PreventiveRule[]>('/rules')
  },
}

export const followUpService = {
  listPatientFollowUps: async (patientId: string) => {
    return apiClient.request<FollowUpRecord[]>(`/patients/${patientId}/follow-ups`)
  },
  createFollowUp: async (patientId: string, payload: Partial<FollowUpRecord>) => {
    return apiClient.request<FollowUpRecord>(`/patients/${patientId}/follow-ups`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  updateStatus: async (followUpId: string, status: 'COMPLETED' | 'POSTPONED' | 'CANCELLED', notes?: string) => {
    return apiClient.request<FollowUpRecord>(`/follow-ups/${followUpId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    })
  },
  getClinicSummary: async () => {
    return apiClient.request<ClinicDashboardSummary>('/clinic/dashboard/summary')
  },
  listClinicFollowUps: async () => {
    return apiClient.request<FollowUpRecord[]>('/clinic/follow-ups')
  },
}

export const governanceService = {
  createCorrectionRequest: async (payload: { patientId: string; targetType: string; targetId: string; issueDescription: string }) => {
    return apiClient.request<CorrectionRequest>('/correction-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  listCorrectionRequests: async () => {
    return apiClient.request<CorrectionRequest[]>('/correction-requests')
  },
  listAuditLogs: async () => {
    return apiClient.request<AuditLog[]>('/audit-logs')
  },
}
