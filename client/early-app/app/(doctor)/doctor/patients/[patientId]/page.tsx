'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  patientService,
  signalService,
  observationService,
  reportService,
  followUpService,
  encounterService,
} from '@/lib/services'
import {
  PatientSummary,
  EarlySignalFlag,
  BiomarkerTrend,
  MedicalReport,
  FollowUpRecord,
  TimelineItem,
  EncounterRecord,
} from '@/types/api'
import { toast } from 'sonner'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts'
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  FileText,
  ShieldCheck,
  Plus,
  ArrowRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

export default function DoctorPatientChartPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const resolvedParams = use(params)
  const patientId = resolvedParams.patientId

  const [patient, setPatient] = useState<PatientSummary | null>(null)
  const [signals, setSignals] = useState<EarlySignalFlag[]>([])
  const [trends, setTrends] = useState<BiomarkerTrend[]>([])
  const [reports, setReports] = useState<MedicalReport[]>([])
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([])
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [selectedSignal, setSelectedSignal] = useState<EarlySignalFlag | null>(null)
  const [clinicianNote, setClinicianNote] = useState('')
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)
  const [newFollowUpTitle, setNewFollowUpTitle] = useState('')
  const [newFollowUpDueDate, setNewFollowUpDueDate] = useState('')
  const [loading, setLoading] = useState(true)

  const loadAllData = async () => {
    try {
      const [patRes, sigRes, trdRes, repRes, flwRes, tmlRes] = await Promise.all([
        patientService.getPatientById(patientId),
        signalService.listSignals(patientId),
        observationService.getTrends(patientId),
        reportService.listPatientReports(patientId),
        followUpService.listPatientFollowUps(patientId),
        patientService.getTimeline(patientId),
      ])

      if (patRes.success) setPatient(patRes.data)
      if (sigRes.success) setSignals(sigRes.data)
      if (trdRes.success) setTrends(trdRes.data)
      if (repRes.success) setReports(repRes.data)
      if (flwRes.success) setFollowUps(flwRes.data)
      if (tmlRes.success) setTimeline(tmlRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [patientId])

  const handleReviewSignal = async (status: 'ACKNOWLEDGED' | 'ACTIONED' | 'DISMISSED') => {
    if (!selectedSignal) return
    await signalService.reviewSignal(selectedSignal.id, status, clinicianNote)
    toast.success(`Early-signal flag marked as ${status}.`)
    setIsReviewOpen(false)
    setClinicianNote('')
    loadAllData()
  }

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFollowUpTitle || !newFollowUpDueDate) {
      toast.error('Please provide a title and due date.')
      return
    }
    await followUpService.createFollowUp(patientId, {
      title: newFollowUpTitle,
      dueDate: newFollowUpDueDate,
      actionType: 'REASSESSMENT_VISIT',
      notes: 'Scheduled by Dr. Priya Nair from clinical chart.',
    })
    toast.success('Preventive follow-up task scheduled.')
    setIsFollowUpOpen(false)
    setNewFollowUpTitle('')
    setNewFollowUpDueDate('')
    loadAllData()
  }

  const pendingReports = reports.filter((r) => r.extractionStatus === 'NEEDS_REVIEW')
  const hba1cTrend = trends.find((t) => t.testName === 'HbA1c') || trends[0]

  return (
    <div className="space-y-6">
      {/* Patient Header & Consent Ribbon */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {patient?.fullName || 'Aarav Sharma'}
            </h1>
            <Badge variant="outline" className="text-xs font-mono bg-teal-50 text-teal-800 border-teal-200">
              {patient?.gender || 'MALE'} · {patient?.dateOfBirth || '1978-04-12'}
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              ABHA: {patient?.abhaNumber || '91-4829-1029-4820'}
            </Badge>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Consent Scope: <strong className="text-teal-900 font-semibold">{patient?.consentScope || 'FULL_HISTORY'}</strong></span>
            <span className="text-slate-300">·</span>
            <span>Blood Group: <strong className="text-slate-800 font-mono">{patient?.bloodGroup || 'B+'}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/doctor/patients/${patientId}/encounter/new`}>
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Record Encounter
            </Button>
          </Link>

          <Dialog open={isFollowUpOpen} onOpenChange={setIsFollowUpOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs h-8">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Schedule Follow-Up
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Create Preventive Follow-Up Milestone
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFollowUp} className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label htmlFor="fu-title" className="text-xs font-medium text-slate-700">Follow-Up Action</Label>
                  <Input
                    id="fu-title"
                    placeholder="e.g. Repeat Blood Pressure Reassessment & Lifestyle Check"
                    value={newFollowUpTitle}
                    onChange={(e) => setNewFollowUpTitle(e.target.value)}
                    className="text-xs h-9 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fu-date" className="text-xs font-medium text-slate-700">Due Date</Label>
                  <Input
                    id="fu-date"
                    type="date"
                    value={newFollowUpDueDate}
                    onChange={(e) => setNewFollowUpDueDate(e.target.value)}
                    className="text-xs h-9 bg-white font-mono"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9">
                  Schedule Task
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Unverified Reports Alert Banner (Side-by-Side OCR Verification Gateway) */}
      {pendingReports.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-950">
                Action Required: Unverified Report Extraction Pending Human Review
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                {pendingReports[0].title} ({pendingReports[0].sourceProviderName}) contains extracted biomarkers requiring clinician verification.
              </div>
            </div>
          </div>
          <Link href={`/doctor/patients/${patientId}/verify/${pendingReports[0].id}`}>
            <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white text-xs h-8">
              Side-by-Side Verification
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Deterministic Early-Signal Cards */}
      {signals.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Active Deterministic Early Signals ({signals.filter(s => s.status === 'PENDING_REVIEW').length})</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Auditable Java Rules</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {signals.map((sig) => (
              <Card
                key={sig.id}
                className={`border shadow-xs ${
                  sig.status === 'PENDING_REVIEW'
                    ? 'border-amber-200/90 bg-amber-50/40'
                    : 'border-slate-200/80 bg-white opacity-75'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[11px] font-mono font-semibold text-amber-900">
                        {sig.ruleCode}
                      </div>
                      <CardTitle className="text-xs font-bold text-slate-900 mt-0.5">
                        {sig.ruleTitle}
                      </CardTitle>
                    </div>
                    <Badge
                      className={`text-[10px] font-mono ${
                        sig.status === 'PENDING_REVIEW'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {sig.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs">
                  <p className="text-slate-800 text-[11px] leading-relaxed">
                    {sig.clinicianMessage}
                  </p>
                  <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Flagged: {sig.flaggedAt.split('T')[0]}
                    </span>
                    {sig.status === 'PENDING_REVIEW' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 bg-white text-slate-800 hover:bg-amber-100/50"
                        onClick={() => {
                          setSelectedSignal(sig)
                          setIsReviewOpen(true)
                        }}
                      >
                        Review Flag
                      </Button>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700">
                        Reviewed: {sig.status}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Clinician Review — {selectedSignal?.ruleCode}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2 text-xs">
            <p className="text-slate-700">{selectedSignal?.clinicianMessage}</p>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Clinician Assessment Note</Label>
              <Textarea
                placeholder="Enter clinical rationale..."
                value={clinicianNote}
                onChange={(e) => setClinicianNote(e.target.value)}
                className="text-xs bg-white min-h-[70px]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
                onClick={() => handleReviewSignal('ACTIONED')}
              >
                Actioned (Follow-Up Scheduled)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8"
                onClick={() => handleReviewSignal('ACKNOWLEDGED')}
              >
                Acknowledge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi-Year Longitudinal Biomarker Trend */}
      {hba1cTrend && (
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Longitudinal Glycemic Trajectory — {hba1cTrend.testName} ({hba1cTrend.unit})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Comparing multi-timepoint values across 2026 visits.
                </CardDescription>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">
                Ref Band: {hba1cTrend.refLow} – {hba1cTrend.refHigh}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hba1cTrend.points} margin={{ top: 15, right: 30, left: 10, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="observedAt" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#94a3b8" fontSize={11} fontFamily="monospace" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <ReferenceArea
                    y1={hba1cTrend.refLow}
                    y2={hba1cTrend.refHigh}
                    fill="#0d9488"
                    fillOpacity={0.06}
                    stroke="#0d9488"
                    strokeOpacity={0.2}
                    strokeDasharray="2 2"
                  />
                  <Line
                    type="monotone"
                    dataKey="valueNumeric"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    dot={{ fill: '#0d9488', r: 4, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Timeline and Follow-ups */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="timeline" className="text-xs font-medium">Longitudinal History</TabsTrigger>
          <TabsTrigger value="followups" className="text-xs font-medium">Follow-Up Worklist</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs font-medium">Uploaded Documents ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4 space-y-3">
          {timeline.map((item) => (
            <div key={item.id} className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.date}
                  </span>
                  <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                </div>
                {item.subtitle && <p className="text-xs text-slate-500 mt-1">{item.subtitle}</p>}
                <div className="text-[10px] text-slate-400 font-mono mt-1">Provider: {item.provider}</div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {item.type}
              </Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="followups" className="mt-4 space-y-3">
          {followUps.map((flw) => (
            <div key={flw.id} className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs flex justify-between items-start">
              <div>
                <div className="text-xs font-semibold text-slate-900">{flw.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{flw.notes}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">Due: {flw.dueDate}</div>
              </div>
              <Badge
                className={`text-[10px] font-mono ${
                  flw.status === 'OVERDUE'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {flw.status}
              </Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-3">
          {reports.map((rep) => (
            <div key={rep.id} className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs flex justify-between items-center">
              <div>
                <div className="text-xs font-semibold text-slate-900">{rep.title}</div>
                <div className="text-[11px] text-slate-500 font-mono">{rep.sourceProviderName} · {rep.reportDate}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-[10px] font-mono ${
                    rep.extractionStatus === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  {rep.extractionStatus}
                </Badge>
                {rep.extractionStatus === 'NEEDS_REVIEW' && (
                  <Link href={`/doctor/patients/${patientId}/verify/${rep.id}`}>
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Verify Values
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
