'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { EarlyHeroStage } from '@/components/stageshow/EarlyHeroStage'
import { EarlyBentoGrid } from '@/components/stageshow/EarlyBentoGrid'
import {
  Stethoscope,
  Activity,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Clock,
  ChevronRight,
  UserCheck,
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { loginAsDemo } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider">
            E
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>Project EARLY</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Preventive Care
              </span>
            </div>
            <div className="text-[11px] text-slate-500 hidden sm:block">
              Connected Preventive Care Intelligence
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loginAsDemo('DOCTOR')}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Launch Doctor Desk</span>
            <span className="sm:hidden">Doctor</span>
          </button>
          <button
            onClick={() => loginAsDemo('PATIENT')}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Patient Portal</span>
            <span className="sm:hidden">Patient</span>
          </button>
          <Link
            href="/login"
            className="text-xs font-medium px-2.5 py-1.5 text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        <section className="pt-12 pb-6 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50/80 border border-teal-200/80 text-teal-900 text-xs font-medium mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Deterministic Rules · Human-in-the-Loop OCR · Shared Record</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 max-w-3xl mx-auto leading-[1.15]">
            Every health record tells a story.{' '}
            <span className="text-teal-700">EARLY connects it.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Connecting a patient&apos;s scattered medical history with their present healthcare needs so recommended preventive follow-ups never fall through the cracks.
          </p>

          {/* Quick Demo Access Pills for Evaluators */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => loginAsDemo('DOCTOR')}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all hover:ring-2 hover:ring-slate-300"
            >
              <Stethoscope className="w-4 h-4 text-teal-400" />
              <span>Demo Doctor — Dr. Priya Nair, MD</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => loginAsDemo('PATIENT')}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all"
            >
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Demo Patient — Aarav Sharma (48M)</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </section>

        {/* Stageshow Animated Hero Walkthrough */}
        <section className="px-2 sm:px-4">
          <EarlyHeroStage />
        </section>

        {/* Clinical Statistics Band */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-slate-200 py-6">
            <div className="text-center sm:text-left sm:border-r border-slate-200 pr-4">
              <div className="text-2xl font-bold font-mono text-slate-900">33.5+ Crore</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Screenings conducted in India with high continuity & revisit drop-offs.
              </div>
            </div>
            <div className="text-center sm:text-left sm:border-r border-slate-200 px-4">
              <div className="text-2xl font-bold font-mono text-slate-900">&lt; 5 Minutes</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Average consultation window to inspect past fragmented reports and vitals.
              </div>
            </div>
            <div className="text-center sm:text-left pl-4">
              <div className="text-2xl font-bold font-mono text-teal-800">100% Deterministic</div>
              <div className="text-xs text-slate-600 mt-0.5">
                All clinical flags evaluated by auditable Java rules with zero AI diagnosis.
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Showcase */}
        <EarlyBentoGrid />
      </main>

      {/* Footer & Clinical Boundary Note */}
      <footer className="border-t border-slate-200 bg-white px-4 sm:px-8 py-8 mt-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="font-semibold text-slate-800">Project EARLY — Preventive Care Intelligence</div>
            <p className="mt-1 text-[11px] text-slate-500 max-w-xl">
              Non-diagnostic clinical decision support & longitudinal patient record. AI/OCR is used strictly for structured data extraction under human verification.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/login" className="hover:text-slate-900">Sign In</Link>
            <Link href="/register" className="hover:text-slate-900">Register</Link>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-slate-400">v1.0 (Hackathon MVP)</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
