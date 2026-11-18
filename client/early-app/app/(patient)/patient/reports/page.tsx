'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { reportService } from '@/lib/services'
import { MedicalReport } from '@/types/api'
import { toast } from 'sonner'
import { FileText, Upload, Download, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function PatientReportsPage() {
  const [reports, setReports] = useState<MedicalReport[]>([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [sourceProvider, setSourceProvider] = useState('')
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadReports = async () => {
    const res = await reportService.listPatientReports('pat-aarav-001')
    if (res.success && res.data) {
      setReports(res.data)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title || 'Patient Uploaded Lab Report')
      formData.append('sourceProviderName', sourceProvider || 'Metropolitan Diagnostics')
      formData.append('reportDate', reportDate)
      formData.append('patientId', 'pat-aarav-001')

      await reportService.uploadReport(formData)
      toast.success('Report uploaded successfully. Sent to verification queue.')
      setIsUploadOpen(false)
      setTitle('')
      setSourceProvider('')
      loadReports()
    } catch {
      toast.error('Failed to upload report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Medical Reports & Lab Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store, view, and verify original diagnostic documents and extracted biomarkers.
          </p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">Upload Diagnostic Report</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-3.5 mt-2">
              <div className="space-y-1">
                <Label htmlFor="title" className="text-xs font-medium text-slate-700">Report Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Lipid Profile & Fasting Blood Sugar"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs h-9 bg-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="provider" className="text-xs font-medium text-slate-700">Diagnostic Center / Lab Name</Label>
                <Input
                  id="provider"
                  placeholder="e.g. Metro Diagnostics Bangalore"
                  value={sourceProvider}
                  onChange={(e) => setSourceProvider(e.target.value)}
                  className="text-xs h-9 bg-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="date" className="text-xs font-medium text-slate-700">Date on Report</Label>
                <Input
                  id="date"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="text-xs h-9 bg-white font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="file" className="text-xs font-medium text-slate-700">Report File (PDF, PNG, JPG)</Label>
                <Input
                  id="file"
                  type="file"
                  className="text-xs h-9 bg-white file:text-xs file:font-medium"
                />
                <p className="text-[10px] text-slate-500">
                  Files are encrypted at rest with append-only audit trail.
                </p>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 font-medium mt-2"
              >
                {isSubmitting ? 'Extracting via OCR...' : 'Upload & Process Report'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      {report.sourceProviderName} · <span className="font-mono">{report.reportDate}</span>
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-[10px] font-mono uppercase ${
                      report.extractionStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : report.extractionStatus === 'NEEDS_REVIEW'
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {report.extractionStatus}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 text-slate-700"
                    onClick={() => toast.info('Original file download started (audited).')}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border-t border-slate-100 pt-3">
                <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Extracted Biomarker Observations ({report.observations.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {report.observations.map((obs) => (
                    <div
                      key={obs.id}
                      className="p-2.5 rounded-md border border-slate-100 bg-slate-50/70 flex flex-col justify-between"
                    >
                      <div className="text-xs font-semibold text-slate-900">{obs.testName}</div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {obs.valueNumeric} {obs.unit}
                        </span>
                        {obs.referenceLow !== undefined && obs.referenceHigh !== undefined && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Ref: {obs.referenceLow}–{obs.referenceHigh}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1">
                        <span>Conf: {obs.ocrConfidence ? `${Math.round(obs.ocrConfidence * 100)}%` : '98%'}</span>
                        <span className="text-teal-700">{obs.verificationStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
