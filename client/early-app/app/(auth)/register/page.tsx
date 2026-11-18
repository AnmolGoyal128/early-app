'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { ShieldCheck, Stethoscope, User } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { loginAsDemo } = useAuth()
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email) {
      toast.error('Please fill in your name and email.')
      return
    }
    toast.success('Account created successfully in demo mode.')
    loginAsDemo(role)
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              E
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">Project EARLY</span>
          </Link>
          <p className="text-xs text-slate-500">Preventive Care Intelligence Platform</p>
        </div>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-900">Create Account</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Register as a patient or clinician on the connected record network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={role} onValueChange={(v) => setRole(v as 'PATIENT' | 'DOCTOR')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 p-1">
                <TabsTrigger value="PATIENT" className="text-xs font-medium">Patient</TabsTrigger>
                <TabsTrigger value="DOCTOR" className="text-xs font-medium">Doctor / Clinic</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium text-slate-700">Full Name</Label>
                <Input
                  id="name"
                  placeholder={role === 'PATIENT' ? 'Aarav Sharma' : 'Dr. Priya Nair, MD'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-xs h-9 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium text-slate-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs h-9 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-medium text-slate-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-xs h-9 bg-white"
                />
              </div>

              {role === 'DOCTOR' && (
                <div className="space-y-1">
                  <Label htmlFor="reg" className="text-xs font-medium text-slate-700">Medical Registration Number</Label>
                  <Input
                    id="reg"
                    placeholder="e.g. KMC-2014-88421"
                    defaultValue="KMC-2014-88421"
                    className="text-xs h-9 bg-white font-mono"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 mt-2 font-medium"
              >
                Register & Enter Portal
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pt-0 pb-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Already registered?</span>
            <Link href="/login" className="font-semibold text-slate-900 hover:underline">
              Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
