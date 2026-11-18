'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { patientService, signalService, followUpService } from '@/lib/services'
import { PatientSummary, EarlySignalFlag, FollowUpRecord } from '@/types/api'
import {
  HeartPulse,
  Activity,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  TrendingUp,
} from 'lucide-react'

export default function PatientDashboardPage() {
  const [patient, setPatient] = useState<PatientSummary | null>(null)
  const [signals, setSignals] = useState<EarlySignalFlag[]>([])
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [patRes, sigRes, flwRes] = await Promise.all([
          patientService.getMe(),
          signalService.listSignals('pat-aarav-001'),
          followUpService.listPatientFollowUps('pat-aarav-001'),
        ])
        if (patRes.success) setPatient(patRes.data)
        if (sigRes.success) setSignals(sigRes.data)
        if (flwRes.success) setFollowUps(flwRes.data)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Welcome back, {patient?.fullName || 'Aarav'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your connected personal health record is up to date.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/patient/reports">
            <Button size="sm" variant="outline" className="text-xs h-8">
              <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Upload Report
            </Button>
          </Link>
          <Link href="/patient/timeline">
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8">
              View Timeline
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Mandatory Non-Diagnostic Clinical Guardrail Banner */}
      {signals.length > 0 && (
        <Alert className="bg-teal-50/70 border-teal-200/80 text-teal-950 p-4 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5" />
          <div className="ml-2">
            <AlertTitle className="text-xs font-semibold text-teal-900">
              Doctor Review Prompt
            </AlertTitle>
            <AlertDescription className="text-xs text-teal-800 mt-1 leading-relaxed">
              Your previous report contains a finding that may need review. Please discuss it with your doctor.
              <span className="block mt-1 text-[11px] text-teal-700/80 italic font-mono">
                Guidance note: This prompt is informational to maintain care continuity. It is not an automated medical diagnosis.
              </span>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Primary Biomarker Cards (Tabular-nums formatted) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Blood Pressure */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Blood Pressure
            </CardTitle>
            <HeartPulse className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {patient?.latestBp || '146/92 mmHg'}
              </span>
              <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 text-[10px] font-semibold">
                Needs Review
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              Recorded: 2026-08-20 · Ref: 120/80 mmHg
            </p>
          </CardContent>
        </Card>

        {/* Card 2: HbA1c */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">
              HbA1c (Glycated Hb)
            </CardTitle>
            <Activity className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {patient?.latestHba1c ? `${patient.latestHba1c}%` : '6.4%'}
              </span>
              <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 text-[10px] font-semibold">
                Elevated
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              Observed: 2026-10-15 · Ref: 4.0 – 5.6%
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Fasting Glucose */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Fasting Blood Sugar
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {patient?.latestGlucose ? `${patient.latestGlucose} mg/dL` : '118 mg/dL'}
              </span>
              <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 text-[10px] font-semibold">
                Pre-diabetic
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              Observed: 2026-10-15 · Ref: 70 – 99 mg/dL
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Follow-ups and Care Continuity Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Preventive Actions */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Upcoming Tests & Follow-Ups
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Scheduled preventive care actions from your consultations.
              </CardDescription>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            {followUps.map((flw) => (
              <div
                key={flw.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">{flw.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{flw.notes}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Due: {flw.dueDate} · Doctor: {flw.doctorName || 'Dr. Priya Nair'}
                  </div>
                </div>
                <Badge
                  variant={flw.status === 'OVERDUE' ? 'destructive' : 'outline'}
                  className={`text-[10px] font-mono uppercase ${
                    flw.status === 'OVERDUE' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {flw.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Longitudinal Summary */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Recent Record Activity
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Verified lab extractions and consultations.
              </CardDescription>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-100 bg-white flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Comprehensive Metabolic & Lipid Profile
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  2026-10-15 · Metro Diagnostics
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">
                Verified
              </Badge>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 bg-white flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Clinical Consultation with Dr. Priya Nair
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  2026-08-20 · Metropolitan Health Clinic
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] text-slate-600">
                Consult
              </Badge>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 bg-white flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Routine Glycemic Checkup
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  2026-06-14 · Anand Diagnostic Laboratory
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">
                Verified
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
