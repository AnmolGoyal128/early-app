'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { consentService, governanceService } from '@/lib/services'
import { ConsentRecord, CorrectionRequest } from '@/types/api'
import { toast } from 'sonner'
import { ShieldCheck, ShieldAlert, FileEdit, CheckCircle2, Building2 } from 'lucide-react'

export default function PatientConsentsPage() {
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([])
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false)
  const [targetType, setTargetType] = useState('OBSERVATION')
  const [targetId, setTargetId] = useState('obs-aarav-bp-1')
  const [issueDescription, setIssueDescription] = useState('')

  const loadData = async () => {
    const [cRes, crRes] = await Promise.all([
      consentService.listConsents(),
      governanceService.listCorrectionRequests(),
    ])
    if (cRes.success && cRes.data) setConsents(cRes.data)
    if (crRes.success && crRes.data) setCorrections(crRes.data)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRevoke = async (id: string, name: string) => {
    await consentService.revokeConsent(id)
    toast.success(`Consent revoked for ${name}. Clinic can no longer access your record.`)
    loadData()
  }

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issueDescription) {
      toast.error('Please describe the inaccuracy.')
      return
    }
    await governanceService.createCorrectionRequest({
      patientId: 'pat-aarav-001',
      targetType,
      targetId,
      issueDescription,
    })
    toast.success('Correction request submitted for clinical governance audit.')
    setIsCorrectionOpen(false)
    setIssueDescription('')
    loadData()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Privacy, Consent & Data Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            You own your central medical record. Control which healthcare providers can access your history.
          </p>
        </div>

        <Dialog open={isCorrectionOpen} onOpenChange={setIsCorrectionOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-xs h-8">
              <FileEdit className="w-3.5 h-3.5 mr-1.5" />
              Request Record Correction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Submit Record Correction Request
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitCorrection} className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Target Clinical Record</Label>
                <Input
                  value="Blood Pressure Reading (146/92 mmHg) · 2026-08-20"
                  disabled
                  className="text-xs h-9 bg-slate-50 font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="issue" className="text-xs font-medium text-slate-700">
                  Describe Inaccuracy or Discrepancy
                </Label>
                <Textarea
                  id="issue"
                  placeholder="e.g. The evening home reading was 134/86, please verify with log notes."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="text-xs min-h-[90px] bg-white"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Submitted requests are logged to the immutable audit trail and reviewed by clinic staff.
              </p>
              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 font-medium"
              >
                Submit for Audit Review
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Clinic Consents */}
      <Card className="border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900">
            Authorised Clinics & Healthcare Facilities
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Active permissions granted under DPDP Act & ABDM consent framework.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {consents.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">{c.clinicName}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Scope: <span className="font-semibold text-teal-800">{c.scope}</span> · Granted: {c.grantedAt.split('T')[0]}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className={`text-[10px] font-mono ${
                    c.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {c.status}
                </Badge>
                {c.status === 'ACTIVE' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(c.id, c.clinicName)}
                    className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-8"
                  >
                    Revoke Consent
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submitted Correction Requests */}
      {corrections.length > 0 && (
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Submitted Correction Requests
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Clinical governance review queue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {corrections.map((cr) => (
              <div key={cr.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-900">{cr.targetType} Target</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {cr.status}
                  </Badge>
                </div>
                <p className="text-slate-600 text-[11px]">{cr.issueDescription}</p>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Submitted: {cr.createdAt.split('T')[0]}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
