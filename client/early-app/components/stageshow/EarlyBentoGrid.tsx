'use client'

import React, { useState } from 'react'
import { Window, Phone, Bar } from './kit'
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'

export function EarlyBentoGrid() {
  const [scrubIndex, setScrubIndex] = useState(2)

  const hba1cData = [
    { date: 'Feb 2025', value: 5.6, status: 'Normal' },
    { date: 'Nov 2025', value: 6.0, status: 'Pre-diabetic' },
    { date: 'Oct 2026', value: 6.4, status: 'Action Advised' },
  ]

  return (
    <section className="w-full max-w-6xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Precision Healthcare Architecture
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          One unified patient record. Clinical precision for clinicians, calm clarity for patients.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tile 1: Dual-Perspective Device Pair (Doctor Window + Patient Phone) */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Shared Source of Truth
              </span>
              <h3 className="text-base font-semibold text-slate-900">
                Dual-Role Interface Alignment
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Consent: Full History</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50/70 p-4 rounded-lg border border-slate-100">
            {/* Clinician Desk View */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <Stethoscope className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-semibold text-slate-800">Doctor Clinical Desk</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Aarav Sharma (48M)</span>
                  <span className="font-mono text-slate-900 font-medium">BP 146/92</span>
                </div>
                <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px]">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-700" />
                    <span>Rule BP_ELEVATED_REVIEW</span>
                  </div>
                  <p className="mt-0.5 text-amber-800">Prior reading unverified for 14-day reassessment.</p>
                </div>
                <div className="pt-1 flex justify-between items-center text-[11px] text-slate-500">
                  <span>Action: Schedule Consult</span>
                  <span className="font-mono text-teal-700 font-semibold">Ready</span>
                </div>
              </div>
            </div>

            {/* Patient Phone View */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <Activity className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold text-slate-800">Patient Health Portal</span>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200/80">
                  <div className="text-xs font-semibold text-teal-950 flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    <span>Doctor Review Note</span>
                  </div>
                  <p className="text-xs text-teal-900 leading-relaxed font-normal">
                    &ldquo;Your previous report contains a finding that may need review. Please discuss it with your doctor.&rdquo;
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between items-center px-1">
                  <span>Calm, non-alarmist communication</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            One underlying medical database. Zero patient-facing medical jargon, complete clinical rigor for the physician.
          </p>
        </div>

        {/* Tile 2: Multi-Year HbA1c Drift Chart */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Deterministic Drift
              </span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Longitudinal Biomarker Analysis
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tracks continuous multi-year trends rather than point-in-time snapshots.
            </p>
          </div>

          <div className="my-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs font-medium text-slate-600">HbA1c Trajectory</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {hba1cData[scrubIndex].value}%
              </span>
            </div>

            {/* Interactive Timeline Scrub */}
            <div className="flex items-center gap-2 mb-3">
              {hba1cData.map((d, i) => (
                <button
                  key={d.date}
                  onClick={() => setScrubIndex(i)}
                  className={`flex-1 py-1.5 px-2 rounded text-[11px] font-mono transition-all text-center ${
                    scrubIndex === i
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {d.date}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Status: <strong className="text-slate-800">{hba1cData[scrubIndex].status}</strong></span>
              <span className="font-mono text-slate-400">Ref: 4.0 – 5.6%</span>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Detected drift: <span className="font-mono font-medium text-amber-700">+0.8% across 18 months</span>
          </div>
        </div>

        {/* Tile 3: Closed-Loop Follow-Up State Machine */}
        <div className="md:col-span-3 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Care Continuity
              </span>
              <h3 className="text-base font-semibold text-slate-900">
                Closed-Loop Follow-Up State Machine
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Zero Missed Milestones</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/70">
              <div className="flex items-center justify-between text-xs font-medium text-amber-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>1. Flagged & Pending</span>
                </span>
                <span className="font-mono text-[11px]">Due 14d</span>
              </div>
              <p className="text-xs text-amber-800/90 mt-1">
                Biomarker elevation triggers automatic clinical follow-up task.
              </p>
            </div>

            <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200/70">
              <div className="flex items-center justify-between text-xs font-medium text-rose-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>2. Priority Triage Queue</span>
                </span>
                <span className="font-mono text-[11px]">Overdue</span>
              </div>
              <p className="text-xs text-rose-800/90 mt-1">
                Surfaces missed follow-ups to clinic staff before patients drop out of care.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/70">
              <div className="flex items-center justify-between text-xs font-medium text-emerald-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Reassessment & Closure</span>
                </span>
                <span className="font-mono text-[11px]">Verified</span>
              </div>
              <p className="text-xs text-emerald-800/90 mt-1">
                Completed repeat test or consult updates timeline and closes loop.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
