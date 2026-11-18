'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { followUpService } from '@/lib/services'
import { FollowUpRecord } from '@/types/api'
import { Calendar, AlertCircle, Clock, CheckCircle2, User } from 'lucide-react'

export default function PatientFollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await followUpService.listPatientFollowUps('pat-aarav-001')
      if (res.success && res.data) {
        setFollowUps(res.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Preventive Follow-Ups & Appointments
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Closed-loop scheduled tests, blood pressure reassessments, and specialist consultations.
        </p>
      </div>

      <div className="space-y-4">
        {followUps.map((flw) => (
          <Card key={flw.id} className="border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      flw.status === 'OVERDUE'
                        ? 'bg-rose-50 text-rose-700'
                        : flw.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      {flw.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Recommended by {flw.doctorName || 'Dr. Priya Nair'} · Action Type: {flw.actionType}
                    </CardDescription>
                  </div>
                </div>

                <Badge
                  className={`text-[10px] font-mono uppercase ${
                    flw.status === 'OVERDUE'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : flw.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  {flw.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2 text-xs text-slate-600">
              {flw.notes && <p className="text-[11px] text-slate-700">{flw.notes}</p>}
              <div className="mt-2 text-[10px] text-slate-400 font-mono">
                Due Date: <span className="font-semibold text-slate-700">{flw.dueDate}</span>
                {flw.completedAt && ` · Verified Completed: ${flw.completedAt}`}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
