'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { followUpService } from '@/lib/services'
import { FollowUpRecord } from '@/types/api'
import { toast } from 'sonner'
import { CalendarCheck, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

export default function DoctorFollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([])
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'PENDING' | 'COMPLETED'>('ALL')
  const [loading, setLoading] = useState(true)

  const loadFollowUps = async () => {
    const res = await followUpService.listClinicFollowUps()
    if (res.success && res.data) {
      setFollowUps(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadFollowUps()
  }, [])

  const handleUpdateStatus = async (id: string, status: 'COMPLETED' | 'POSTPONED' | 'CANCELLED') => {
    await followUpService.updateStatus(id, status, 'Status updated from Clinic Follow-Up Board.')
    toast.success(`Follow-up milestone updated to ${status}.`)
    loadFollowUps()
  }

  const filtered = followUps.filter((f) => {
    if (filter === 'ALL') return true
    return f.status === filter
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Clinic Follow-Up Management Board
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Closed-loop tracking of reassessments, repeat testing, and specialist handoffs across all patients.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          {(['ALL', 'OVERDUE', 'PENDING', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === st
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-slate-200/80 shadow-xs bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Patient</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Milestone Action</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Type</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Due Date</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((flw) => (
                <TableRow key={flw.id} className="hover:bg-slate-50/50">
                  <TableCell className="py-3.5">
                    <Link
                      href={`/doctor/patients/${flw.patientId}`}
                      className="font-semibold text-xs text-slate-900 hover:underline flex items-center gap-1"
                    >
                      <span>{flw.patientName || 'Aarav Sharma'}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </Link>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="text-xs font-semibold text-slate-900">{flw.title}</div>
                    {flw.notes && <div className="text-[11px] text-slate-500 mt-0.5">{flw.notes}</div>}
                  </TableCell>
                  <TableCell className="py-3.5 font-mono text-[11px] text-slate-600">
                    {flw.actionType}
                  </TableCell>
                  <TableCell className="py-3.5 font-mono text-xs font-medium text-slate-800">
                    {flw.dueDate}
                  </TableCell>
                  <TableCell className="py-3.5">
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
                  </TableCell>
                  <TableCell className="py-3.5 text-right">
                    {flw.status !== 'COMPLETED' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] h-7 px-2 font-medium"
                          onClick={() => handleUpdateStatus(flw.id, 'COMPLETED')}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[11px] h-7 px-2 text-slate-600"
                          onClick={() => handleUpdateStatus(flw.id, 'POSTPONED')}
                        >
                          Postpone
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-mono font-medium">
                        Closed Loop
                      </span>
                    )}
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
