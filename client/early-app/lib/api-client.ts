import { ApiResponse, AuthTokens } from '@/types/api'
import { mockDb, DEMO_DOCTOR_USER, DEMO_PATIENT_USER } from './mock-seed'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'
const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

class ApiClient {
  private getTokens(): AuthTokens | null {
    if (typeof window === 'undefined') return null
    const tokens = localStorage.getItem('early_auth_tokens')
    if (!tokens) return null
    try {
      return JSON.parse(tokens)
    } catch {
      return null
    }
  }

  public setTokens(tokens: AuthTokens | null) {
    if (typeof window === 'undefined') return
    if (tokens) {
      localStorage.setItem('early_auth_tokens', JSON.stringify(tokens))
    } else {
      localStorage.removeItem('early_auth_tokens')
    }
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    // If explicitly in demo mode, route directly to mock fallback
    if (IS_DEMO_MODE) {
      return this.handleMockRoute<T>(endpoint, options)
    }

    const { requiresAuth = true, headers = {}, ...restOptions } = options
    const tokenObj = this.getTokens()

    const requestHeaders: Record<string, string> = {
      ...(headers as Record<string, string>),
    }

    if (!(options.body instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json'
    }

    if (requiresAuth && tokenObj?.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${tokenObj.accessToken}`
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...restOptions,
        headers: requestHeaders,
      })

      // Handle 401 token refresh
      if (response.status === 401 && tokenObj?.refreshToken && !endpoint.includes('/auth/refresh')) {
        const refreshed = await this.refreshToken(tokenObj.refreshToken)
        if (refreshed) {
          requestHeaders['Authorization'] = `Bearer ${refreshed.accessToken}`
          const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...restOptions,
            headers: requestHeaders,
          })
          return retryRes.json()
        }
      }

      const json: ApiResponse<T> = await response.json()
      return json
    } catch (networkError) {
      console.warn(`[Project EARLY] Backend API unreachable at ${endpoint}. Seamlessly falling back to synthetic mock data.`, networkError)
      return this.handleMockRoute<T>(endpoint, options)
    }
  }

  private async refreshToken(refreshToken: string): Promise<AuthTokens | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) throw new Error('Refresh failed')
      const data: ApiResponse<AuthTokens> = await res.json()
      if (data.success && data.data) {
        this.setTokens(data.data)
        return data.data
      }
      return null
    } catch {
      this.setTokens(null)
      return null
    }
  }

  // Resilient fallback router for offline preview & hackathon demo
  private handleMockRoute<T>(endpoint: string, options: RequestOptions): ApiResponse<T> {
    const method = options.method?.toUpperCase() || 'GET'
    let data: unknown = null
    const timestamp = new Date().toISOString()

    // 1. Auth routes
    if (endpoint.startsWith('/auth/me')) {
      const role = typeof window !== 'undefined' ? localStorage.getItem('early_demo_role') : 'DOCTOR'
      data = role === 'PATIENT' ? DEMO_PATIENT_USER : DEMO_DOCTOR_USER
    } else if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register')) {
      const body = options.body ? JSON.parse(options.body as string) : {}
      const isPatient =
        body.role === 'PATIENT' ||
        body.email?.toLowerCase().includes('sharma') ||
        body.email?.toLowerCase().includes('aarav') ||
        body.email?.toLowerCase().includes('patient')
      data = {
        accessToken: isPatient ? 'patient-access-token-jwt' : 'doctor-access-token-jwt',
        refreshToken: isPatient ? 'patient-refresh-token-jwt' : 'doctor-refresh-token-jwt',
        user: isPatient ? DEMO_PATIENT_USER : DEMO_DOCTOR_USER,
      }
    }

    // 2. Patient routes
    else if (endpoint === '/patients/me') {
      data = mockDb.getPatientById('pat-aarav-001')
    } else if (endpoint === '/patients' || endpoint.startsWith('/patients?')) {
      data = mockDb.getPatients()
    } else if (endpoint.match(/^\/patients\/([^/]+)$/)) {
      const match = endpoint.match(/^\/patients\/([^/]+)$/)
      const patientId = match ? match[1] : 'pat-aarav-001'
      data = mockDb.getPatientById(patientId) || mockDb.getPatientById('pat-aarav-001')
    }

    // 3. Trends & Observations
    else if (endpoint.includes('/observations/trends')) {
      const parts = endpoint.split('/')
      const patientId = parts[2] || 'pat-aarav-001'
      data = mockDb.getTrends(patientId)
    } else if (endpoint.includes('/observations')) {
      const parts = endpoint.split('/')
      const patientId = parts[2] || 'pat-aarav-001'
      const reports = mockDb.getReports(patientId)
      data = reports.flatMap((r) => r.observations)
    }

    // 4. Reports & Verification
    else if (endpoint.match(/^\/reports\/([^/]+)\/verify$/) && method === 'POST') {
      const match = endpoint.match(/^\/reports\/([^/]+)\/verify$/)
      const reportId = match ? match[1] : ''
      const body = options.body ? JSON.parse(options.body as string) : {}
      data = mockDb.verifyReport(reportId, body.observations || [])
    } else if (endpoint === '/reports/upload' && method === 'POST') {
      data = mockDb.addReport({
        title: 'Uploaded Blood Chemistry Panel',
        sourceProviderName: 'Metropolitan Clinical Labs',
      })
    } else if (endpoint.match(/^\/reports\/([^/]+)$/)) {
      const match = endpoint.match(/^\/reports\/([^/]+)$/)
      const reportId = match ? match[1] : ''
      data = mockDb.getReportById(reportId)
    } else if (endpoint.includes('/reports')) {
      const parts = endpoint.split('/')
      const patientId = parts[2]
      data = mockDb.getReports(patientId)
    }

    // 5. Signals & Rules
    else if (endpoint === '/rules') {
      data = mockDb.getRules()
    } else if (endpoint.match(/^\/signals\/([^/]+)\/review$/) && method === 'POST') {
      const match = endpoint.match(/^\/signals\/([^/]+)\/review$/)
      const signalId = match ? match[1] : ''
      const body = options.body ? JSON.parse(options.body as string) : {}
      data = mockDb.reviewSignal(signalId, body.status, body.clinicianNote)
    } else if (endpoint.includes('/signals')) {
      const parts = endpoint.split('/')
      const patientId = parts[2]
      data = mockDb.getSignals(patientId)
    }

    // 6. Follow-ups
    else if (endpoint === '/clinic/dashboard/summary') {
      data = mockDb.getDashboardSummary()
    } else if (endpoint === '/clinic/follow-ups') {
      data = mockDb.getFollowUps()
    } else if (endpoint.match(/^\/follow-ups\/([^/]+)\/status$/) && method === 'PATCH') {
      const match = endpoint.match(/^\/follow-ups\/([^/]+)\/status$/)
      const followUpId = match ? match[1] : ''
      const body = options.body ? JSON.parse(options.body as string) : {}
      data = mockDb.updateFollowUpStatus(followUpId, body.status, body.notes)
    } else if (endpoint.includes('/follow-ups') && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {}
      data = mockDb.createFollowUp(body)
    } else if (endpoint.includes('/follow-ups')) {
      const parts = endpoint.split('/')
      const patientId = parts[2]
      data = mockDb.getFollowUps(patientId)
    }

    // 7. Encounters & Treatments
    else if (endpoint.includes('/encounters')) {
      const parts = endpoint.split('/')
      const patientId = parts[2]
      data = mockDb.getEncounters(patientId)
    } else if (endpoint.includes('/treatments')) {
      const parts = endpoint.split('/')
      const patientId = parts[2]
      const encounters = mockDb.getEncounters(patientId)
      data = encounters.flatMap((e) => e.treatments)
    }

    // 8. Consents
    else if (endpoint.includes('/consents')) {
      data = mockDb.getConsents('pat-aarav-001')
    }

    // 9. Timeline endpoint
    else if (endpoint.includes('/timeline')) {
      const parts = endpoint.split('/')
      const patientId = parts[2] || 'pat-aarav-001'
      data = this.buildMockTimeline(patientId)
    }

    // 10. Correction requests
    else if (endpoint === '/correction-requests' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {}
      data = mockDb.addCorrectionRequest(body)
    } else if (endpoint.includes('/correction-requests')) {
      data = mockDb.getCorrectionRequests()
    }

    return {
      success: true,
      data: data as T,
      error: null,
      timestamp,
    }
  }

  private buildMockTimeline(patientId: string) {
    const reports = mockDb.getReports(patientId)
    const encounters = mockDb.getEncounters(patientId)
    const followUps = mockDb.getFollowUps(patientId)

    const items = [
      ...reports.map((r) => ({
        id: r.id,
        type: 'LAB_REPORT' as const,
        date: r.reportDate,
        title: r.title,
        subtitle: `${r.sourceProviderName} · ${r.observations.length} Biomarkers`,
        provider: r.sourceProviderName,
        badgeText: r.extractionStatus,
        badgeVariant: r.extractionStatus === 'VERIFIED' ? ('verified' as const) : ('amber' as const),
      })),
      ...encounters.map((e) => ({
        id: e.id,
        type: 'ENCOUNTER' as const,
        date: e.encounterDate,
        title: `Clinical Consultation with ${e.doctorName}`,
        subtitle: e.chiefComplaint,
        provider: e.clinicName,
        badgeText: 'Completed Visit',
        badgeVariant: 'secondary' as const,
        details: { patientSummary: e.patientFriendlySummary, assessment: e.clinicalAssessment },
      })),
      ...followUps.map((f) => ({
        id: f.id,
        type: 'FOLLOW_UP' as const,
        date: f.dueDate,
        title: f.title,
        subtitle: f.notes,
        provider: f.doctorName || 'Clinic Staff',
        badgeText: f.status,
        badgeVariant: f.status === 'OVERDUE' ? ('destructive' as const) : ('default' as const),
      })),
    ]

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}

export const apiClient = new ApiClient()
