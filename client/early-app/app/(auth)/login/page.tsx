'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Stethoscope, User, ShieldCheck, AlertCircle, ArrowRight, Check } from 'lucide-react'

export default function LoginPage() {
  const { login, loginAsDemo, isLoading } = useAuth()
  const [activeRole, setActiveRole] = useState<'doctor' | 'patient'>('doctor')
  const [email, setEmail] = useState('priya.nair@metropolitanhealth.in')
  const [password, setPassword] = useState('doctor123')
  const [errorMsg, setErrorMsg] = useState('')

  const handleRoleChange = (role: 'doctor' | 'patient') => {
    setActiveRole(role)
    setErrorMsg('')
    if (role === 'doctor') {
      setEmail('priya.nair@metropolitanhealth.in')
      setPassword('doctor123')
    } else {
      setEmail('aarav.sharma@example.com')
      setPassword('patient123')
    }
  }

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!email) {
      setErrorMsg('Please enter an email address.')
      return
    }
    const roleHint = activeRole === 'patient' ? 'PATIENT' : 'DOCTOR'
    const success = await login(email, password, roleHint)
    if (!success) {
      setErrorMsg('Invalid credentials. You may use 1-click demo login below.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              E
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">Project EARLY</span>
          </Link>
          <p className="text-xs text-slate-500">Preventive Care Intelligence Platform</p>
        </div>

        {/* 1-Click Instant Evaluation Box for Judges */}
        <div className="bg-white border border-teal-200/90 rounded-lg p-3.5 mb-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Instant Hackathon Evaluation</span>
            </span>
            <Badge variant="outline" className="text-[10px] bg-teal-50 border-teal-200 text-teal-800 font-mono">
              Demo Active
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => loginAsDemo('DOCTOR')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs justify-start h-10 px-2.5"
            >
              <Stethoscope className="w-4 h-4 mr-2 text-teal-400 shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-[11px] font-semibold leading-none truncate">Doctor Desk</div>
                <div className="text-[9px] text-slate-400 leading-tight mt-0.5 truncate">Dr. Priya Nair, MD</div>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loginAsDemo('PATIENT')}
              className="border-slate-300 text-slate-800 hover:bg-slate-100 text-xs justify-start h-10 px-2.5"
            >
              <User className="w-4 h-4 mr-2 text-teal-600 shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-[11px] font-semibold leading-none truncate">Patient Portal</div>
                <div className="text-[9px] text-slate-500 leading-tight mt-0.5 truncate">Aarav Sharma (48M)</div>
              </div>
            </Button>
          </div>
        </div>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-900">Sign In</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Select your role and authenticate into your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Clean Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleRoleChange('doctor')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  activeRole === 'doctor'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor / Clinic</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('patient')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  activeRole === 'patient'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient</span>
              </button>
            </div>

            {errorMsg && (
              <Alert variant="destructive" className="text-xs py-2">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle className="text-xs font-semibold">Authentication Error</AlertTitle>
                <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleManualLogin} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                  Email Address ({activeRole === 'doctor' ? 'Clinician' : 'Patient'})
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs h-9 bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-700">Password</Label>
                  <span className="text-[10px] text-teal-700 font-mono">Demo: pre-filled</span>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-xs h-9 bg-white"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 mt-2 font-medium"
              >
                {isLoading ? 'Verifying Session...' : `Sign In as ${activeRole === 'doctor' ? 'Doctor' : 'Patient'}`}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pt-0 pb-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Don&apos;t have an account?</span>
            <Link href="/register" className="font-semibold text-slate-900 hover:underline">
              Create Account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
