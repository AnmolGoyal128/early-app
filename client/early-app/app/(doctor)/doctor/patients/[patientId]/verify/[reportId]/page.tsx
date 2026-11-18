'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { reportService, patientService } from '@/lib/services'
import { MedicalReport, BiomarkerObservation, PatientSummary } from '@/types/api'
import { toast } from 'sonner'
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Eye,
  Edit3,
} from 'lucide-react'

export default function DoctorVerifyReportPage({
  params,
}: {
  params: Promise<{ patientId: string; reportId: string }>
}) {
  const resolvedParams = use(params)
  const { patientId, reportId } = resolvedParams
  const router = useRouter()

  const [report, setReport] = useState<MedicalReport | null>(null)
  const [patient, setPatient] = useState<PatientSummary | null>(null)
  const [observations, setObservations] = useState<BiomarkerObservation[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [repRes, patRes] = await Promise.all([
        reportService.getReport(reportId),
        patientService.getPatientById(patientId),
      ])
      if (repRes.success && repRes.data) {
        setReport(repRes.data)
        setObservations(repRes.data.observations || [])
      }
      if (patRes.success && patRes.data) {
        setPatient(patRes.data)
      }
      setLoading(false)
    }
    load()
  }, [reportId, patientId])

  const handleValueChange = (obsId: string, newValue: string) => {
    setObservations((prev) =>
      prev.map((o) =>
        o.id === obsId ? { ...o, valueNumeric: parseFloat(newValue) || o.valueNumeric } : o
      )
    )
  }

  const handleUnitChange = (obsId: string, newUnit: string) => {
    setObservations((prev) =>
      prev.map((o) => (o.id === obsId ? { ...o, unit: newUnit } : o))
    )
  }

  const handleCommitVerification = async () => {
    setIsSubmitting(true)
    try {
      await reportService.verifyReport(reportId, {
        reportDate: report?.reportDate || new Date().toISOString().split('T')[0],
        sourceProviderName: report?.sourceProviderName || 'Metro Diagnostics',
        observations: observations.map((o) => ({
          observationId: o.id,
          testName: o.testName,
          valueNumeric: o.valueNumeric,
          unit: o.unit,
          action: 'VERIFY',
        })),
      })
      toast.success('Report values verified and committed. Deterministic rules updated.')
      router.push(`/doctor/patients/${patientId}`)
    } catch {
      toast.error('Verification failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href={`/doctor/patients/${patientId}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Chart
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Side-by-Side Human Verification
            </h1>
            <p className="text-xs text-slate-500">
              Patient: {patient?.fullName} · {report?.title} ({report?.sourceProviderName})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono bg-amber-50 text-amber-900 border-amber-200">
            Status: NEEDS_REVIEW
          </Badge>
          <Button
            size="sm"
            disabled={isSubmitting}
            onClick={handleCommitVerification}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-teal-400" />
            {isSubmitting ? 'Auditing & Committing...' : 'Verify & Commit to Timeline'}
          </Button>
        </div>
      </div>

      {/* Verification Notice */}
      <Alert className="bg-amber-50/70 border-amber-200/80 text-amber-950 p-3.5 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5" />
        <div className="ml-2 text-xs">
          <AlertTitle className="font-semibold text-amber-900">Human-in-the-Loop Clinical Guardrail</AlertTitle>
          <AlertDescription className="text-amber-800 mt-0.5">
            OCR extracts data for convenience only. Every value remains in <code className="font-mono bg-white/70 px-1 py-0.2 rounded border border-amber-300">PENDING_VERIFICATION</code> until confirmed by an authorised clinician. Rows with confidence &lt; 90% are flagged with an amber notice.
          </AlertDescription>
        </div>
      </Alert>

      {/* Split-Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Original Document View */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Source Document Preview
              </CardTitle>
            </div>
            <span className="text-[11px] font-mono text-slate-400">PDF / Raster View</span>
          </CardHeader>
          <CardContent className="p-5 font-mono text-xs">
            {/* Simulated Diagnostic Lab PDF Letterhead */}
            <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/40 space-y-4">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900 text-sm tracking-tight">
                    METRO DIAGNOSTIC SERVICES
                  </div>
                  <div className="text-[10px] text-slate-500">
                    NABL Accredited Clinical Reference Laboratory · Indiranagar, Bangalore
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  REF: MDS-2026-OCT-8841
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-3 rounded border border-slate-200/80">
                <div>
                  <span className="text-slate-400">Patient: </span>
                  <span className="font-semibold text-slate-800">{patient?.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400">Age / Gender: </span>
                  <span className="text-slate-800">{patient?.gender} · 48Y</span>
                </div>
                <div>
                  <span className="text-slate-400">Report Date: </span>
                  <span className="text-slate-800">{report?.reportDate}</span>
                </div>
                <div>
                  <span className="text-slate-400">Ref Doctor: </span>
                  <span className="text-slate-800">Dr. Priya Nair, MD</span>
                </div>
              </div>

              {/* Lab Table */}
              <div className="bg-white rounded border border-slate-200/80 overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-2 font-medium">Investigation</th>
                      <th className="p-2 font-medium">Observed Value</th>
                      <th className="p-2 font-medium">Unit</th>
                      <th className="p-2 font-medium">Biological Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-medium text-slate-900">HbA1c (Glycated Hb)</td>
                      <td className="p-2 font-bold text-slate-900">6.4</td>
                      <td className="p-2 text-slate-600">%</td>
                      <td className="p-2 text-slate-500">4.0 - 5.6</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900">Fasting Plasma Glucose</td>
                      <td className="p-2 font-bold text-slate-900">118</td>
                      <td className="p-2 text-slate-600">mg/dL</td>
                      <td className="p-2 text-slate-500">70 - 99</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900">Serum Creatinine</td>
                      <td className="p-2 font-bold text-slate-900">0.9</td>
                      <td className="p-2 text-slate-600">mg/dL</td>
                      <td className="p-2 text-slate-500">0.5 - 1.1</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900">Estimated GFR</td>
                      <td className="p-2 font-bold text-slate-900">88</td>
                      <td className="p-2 text-slate-600">mL/min/1.73m²</td>
                      <td className="p-2 text-slate-500">&gt; 90</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-slate-400 italic text-center pt-2">
                Digitally authenticated by Metro Diagnostics Pathology Unit.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Pane: Editable Extracted Values */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-teal-700" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Extracted Biomarkers & Confidence
              </CardTitle>
            </div>
            <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Editable Form
            </span>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {observations.map((obs) => {
              const lowConf = obs.ocrConfidence !== undefined && obs.ocrConfidence < 0.90
              return (
                <div
                  key={obs.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    lowConf
                      ? 'border-amber-300 bg-amber-50/30'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{obs.testName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        LOINC: {obs.loincCode || 'Standard Marker'}
                      </div>
                    </div>
                    {lowConf ? (
                      <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        <span>Confidence: {Math.round((obs.ocrConfidence || 0) * 100)}% (Verify)</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-mono">
                        Confidence: {Math.round((obs.ocrConfidence || 0.98) * 100)}%
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
                        Numeric Value
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={obs.valueNumeric ?? ''}
                        onChange={(e) => handleValueChange(obs.id, e.target.value)}
                        className="text-xs h-8 bg-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
                        Unit
                      </label>
                      <Input
                        type="text"
                        value={obs.unit || ''}
                        onChange={(e) => handleUnitChange(obs.id, e.target.value)}
                        className="text-xs h-8 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>Ref: {obs.referenceLow ?? '—'} to {obs.referenceHigh ?? '—'}</span>
                    <span className="text-slate-500">Status: {obs.verificationStatus}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
          <CardFooter className="border-t border-slate-100 p-4">
            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 font-medium"
              disabled={isSubmitting}
              onClick={handleCommitVerification}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
              <span>Confirm & Commit All Extracted Values</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
