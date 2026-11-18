'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { encounterService } from '@/lib/services'
import { TreatmentRecord } from '@/types/api'
import { Pill, Activity, Calendar, ShieldCheck } from 'lucide-react'

export default function PatientTreatmentsPage() {
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await encounterService.listTreatments('pat-aarav-001')
      if (res.success && res.data) {
        setTreatments(res.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Treatments & Prescribed Care
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Active and historical medications, lifestyle protocols, and clinical interventions recorded across your visits.
        </p>
      </div>

      <div className="space-y-4">
        {treatments.length === 0 ? (
          <Card className="border-slate-200/80 shadow-xs bg-white p-8 text-center text-xs text-slate-500">
            No active medication records.
          </Card>
        ) : (
          treatments.map((t) => (
            <Card key={t.id} className="border-slate-200/80 shadow-xs bg-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">
                        {t.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        Category: {t.category} · Dosage: {t.dosage || 'As advised'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    className={`text-[10px] font-mono ${
                      t.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 pt-0">
                {t.notes && <p className="text-[11px] text-slate-600 mt-1">{t.notes}</p>}
                <div className="text-[10px] text-slate-400 font-mono mt-2">
                  Initiated: {t.startedAt} {t.endedAt ? `· Concluded: ${t.endedAt}` : ''}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
