'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  Activity,
  Calendar,
  FileText,
  LineChart,
  Pill,
  ShieldCheck,
  Clock,
  LogOut,
  Stethoscope,
  User,
  HeartPulse,
} from 'lucide-react'

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout, loginAsDemo } = useAuth()

  const navItems = [
    { label: 'Overview', href: '/patient/dashboard', icon: Activity },
    { label: 'Health Timeline', href: '/patient/timeline', icon: Clock },
    { label: 'Medical Reports', href: '/patient/reports', icon: FileText },
    { label: 'Biomarker Trends', href: '/patient/trends', icon: LineChart },
    { label: 'Treatments & Meds', href: '/patient/treatments', icon: Pill },
    { label: 'Follow-Ups & Tests', href: '/patient/follow-ups', icon: Calendar },
    { label: 'Privacy & Consents', href: '/patient/consents', icon: ShieldCheck },
  ]

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Persistent Left Sidebar */}
      <aside className="w-60 border-r border-slate-200/80 bg-white flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Platform Info */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                E
              </div>
              <div>
                <div className="text-xs font-bold tracking-tight text-slate-900 leading-none">
                  Project EARLY
                </div>
                <div className="text-[10px] text-teal-700 font-medium mt-0.5">
                  Patient Health Portal
                </div>
              </div>
            </Link>
          </div>

          {/* Patient Profile Card in Sidebar */}
          <div className="p-3 m-3 bg-slate-50/80 rounded-lg border border-slate-200/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs">
                AS
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {user?.fullName || 'Aarav Sharma'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  ABHA: 91-4829-1029-4820
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600">
              <span>Age: 48M · Blood: B+</span>
              <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Connected
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-2 py-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-900 font-semibold border-l-2 border-teal-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Switcher & Logout */}
        <div className="p-3 border-t border-slate-200/80 space-y-2">
          {/* Quick Doctor Desk demo switch */}
          <button
            onClick={() => loginAsDemo('DOCTOR')}
            className="w-full text-left p-2 rounded-md bg-slate-100 hover:bg-slate-200/80 text-[11px] text-slate-700 font-medium flex items-center justify-between transition-colors"
            title="Switch role for demo evaluation"
          >
            <span className="flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
              <span>Switch to Doctor View</span>
            </span>
            <span className="text-[9px] font-mono bg-white px-1 py-0.5 rounded border border-slate-200">
              Demo
            </span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-rose-600 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-200/80 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Patient View</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-900 capitalize">
              {pathname.split('/')[2] || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-medium text-slate-800">Metropolitan Health Clinic</div>
              <div className="text-[10px] text-slate-500 font-mono">Consented: Full History</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-300 text-teal-800 font-bold text-xs flex items-center justify-center">
              AS
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
