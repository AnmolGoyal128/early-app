'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { patientService } from '@/lib/services'
import { PatientSummary } from '@/types/api'
import { Search, UserCheck, ShieldCheck, ArrowRight, Stethoscope } from 'lucide-react'

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await patientService.listPatients(search)
      if (res.success && res.data) {
        setPatients(res.data)
      }
      setLoading(false)
    }
    load()
  }, [search])

  const filtered = patients.filter((p) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (p.abhaNumber && p.abhaNumber.includes(search))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Authorised Patient Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Patients with active DPDP/ABDM consent shared with Metropolitan Health Clinic.
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <Input
            placeholder="Search by name or ABHA number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9 bg-white"
          />
        </div>
      </div>

      <Card className="border-slate-200/80 shadow-xs bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Patient</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Consent Scope</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Latest Vitals</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600">Active Signals</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((pat) => (
                <TableRow key={pat.id} className="hover:bg-slate-50/50">
                  <TableCell className="py-3.5">
                    <div className="font-semibold text-xs text-slate-900">{pat.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {pat.gender} · {pat.dateOfBirth} · ABHA: {pat.abhaNumber}
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Badge variant="outline" className="text-[10px] font-mono bg-teal-50/50 text-teal-800 border-teal-200">
                      {pat.consentScope}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3.5 font-mono text-xs">
                    <div>BP: {pat.latestBp || '—'}</div>
                    <div className="text-[11px] text-slate-500">
                      HbA1c: {pat.latestHba1c ? `${pat.latestHba1c}%` : '—'}
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    {pat.pendingSignalsCount > 0 ? (
                      <Badge className="bg-amber-50 text-amber-900 border-amber-200 text-[10px] font-mono">
                        {pat.pendingSignalsCount} Review Needed
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-mono">
                        Stable
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 text-right">
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
