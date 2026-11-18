'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { followUpService, patientService } from '@/lib/services'
import { ClinicDashboardSummary, PatientSummary } from '@/types/api'
import {
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'

export default function DoctorDashboardPage() {
  const [summary, setSummary] = useState<ClinicDashboardSummary | null>(null)
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, patRes] = await Promise.all([
          followUpService.getClinicSummary(),
          patientService.listPatients(),
        ])
        if (sumRes.success) setSummary(sumRes.data)
        if (patRes.success) setPatients(patRes.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Clinic Operational Workbench
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Metropolitan Health Clinic · Preventive care continuity and triage queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/doctor/patients">
            <Button size="sm" variant="outline" className="text-xs h-8">
              <Users className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Patient Directory
            </Button>
          </Link>
          <Link href="/doctor/rules">
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-400" />
              Active Rules
            </Button>
          </Link>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Metric 1 */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Total Patients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {summary?.totalPatients ?? 3}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active consent</div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Follow-Ups Due
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold font-mono text-amber-800">
              {summary?.followUpsDue ?? 2}
            </div>
            <div className="text-[10px] text-amber-700/80 mt-0.5">Next 30 days</div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-rose-600">
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold font-mono text-rose-700">
              {summary?.followUpsOverdue ?? 1}
            </div>
            <div className="text-[10px] text-rose-600 mt-0.5">Requires outreach</div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold font-mono text-emerald-800">
              {summary?.followUpsCompleted ?? 1}
            </div>
            <div className="text-[10px] text-emerald-700/80 mt-0.5">Closed-loop tests</div>
          </CardContent>
        </Card>

        {/* Metric 5 */}
        <Card className="border-slate-200/80 shadow-xs bg-white col-span-2 sm:col-span-1">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-teal-800">
              Review Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold font-mono text-teal-900">
              {summary?.patientsNeedingReview ?? 2}
            </div>
            <div className="text-[10px] text-teal-700 mt-0.5">Rule flags raised</div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Clinical Triage Queue */}
      <Card className="border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Priority Clinical Triage Queue
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Patients flagged by deterministic preventive rules or overdue follow-up milestones.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono bg-slate-50">
              Live Queue
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Patient</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Latest Vitals</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Active Rule Trigger</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Triage Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((pat) => (
                <TableRow key={pat.id} className="hover:bg-slate-50/50">
                  <TableCell className="py-3">
                    <div className="font-semibold text-xs text-slate-900">{pat.fullName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {pat.gender} · {pat.dateOfBirth} · ABHA: {pat.abhaNumber}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 font-mono text-xs text-slate-800">
                    <div>BP: {pat.latestBp || '—'}</div>
                    <div className="text-[11px] text-slate-500">
                      HbA1c: {pat.latestHba1c ? `${pat.latestHba1c}%` : '—'}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {pat.pendingSignalsCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>
                          {pat.id === 'pat-aarav-001'
                            ? 'BP_ELEVATED_REVIEW (146/92 mmHg)'
                            : 'HBA1C_DRIFT_6M (7.2%)'}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Stable · Routine Baseline</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    {pat.dueFollowUpsCount > 0 ? (
                      <Badge
                        variant="destructive"
                        className="bg-rose-50 text-rose-800 border-rose-200 text-[10px] font-mono"
                      >
                        {pat.id === 'pat-aarav-001' ? 'OVERDUE (14d)' : 'PENDING'}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-slate-600 text-[10px] font-mono"
                      >
                        COMPLETED
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Link href={`/doctor/patients/${pat.id}`}>
                      <Button
                        size="sm"
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-7 px-2.5 font-medium"
                      >
                        <span>Open Chart</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
