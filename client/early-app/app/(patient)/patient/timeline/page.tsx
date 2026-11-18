'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { patientService } from '@/lib/services'
import { TimelineItem } from '@/types/api'
import { Clock, FileText, Stethoscope, Calendar, Activity, ChevronRight } from 'lucide-react'

export default function PatientTimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await patientService.getTimeline('pat-aarav-001')
        if (res.success && res.data) {
          setItems(res.data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Chronological Health Timeline
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          A continuous, tamper-evident journey of all verified lab reports, consultations, and care milestones.
        </p>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-8 py-4">
        {items.map((item) => (
          <div key={item.id} className="relative group">
            {/* Timeline Connector Dot */}
            <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
            </div>

            <Card className="border-slate-200/80 shadow-xs bg-white hover:border-slate-300 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.date}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono uppercase">
                      {item.type}
                    </Badge>
                  </div>
                  {item.badgeText && (
                    <Badge
                      className={`text-[10px] font-mono ${
                        item.badgeText === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.badgeText === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badgeText}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                  {item.title}
                </CardTitle>
                {item.subtitle && (
                  <CardDescription className="text-xs text-slate-600">
                    {item.subtitle}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0 text-xs text-slate-600">
                {item.provider && (
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Provider: {item.provider}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
