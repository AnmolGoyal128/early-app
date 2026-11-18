'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { signalService } from '@/lib/services'
import { PreventiveRule } from '@/types/api'
import { ShieldCheck, BookOpen, AlertCircle, Code } from 'lucide-react'

export default function DoctorRulesPage() {
  const [rules, setRules] = useState<PreventiveRule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await signalService.listRules()
      if (res.success && res.data) {
        setRules(res.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Deterministic Preventive Rules Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Clinician-approved deterministic logic evaluated by the Java backend rules engine.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
          <span>Deterministic · 0% AI Hallucination</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
        <strong>Clinical Safety Architecture:</strong> Early-Signal Flags are evaluated strictly by deterministic rules against verified clinical observations—<strong>never by a generative LLM</strong>. When a rule condition is met, it surfaces an actionable triage flag to the physician and a calm, non-diagnostic guidance prompt to the patient.
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {rule.ruleCode}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-slate-600">
                      {rule.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 mt-1.5">
                    {rule.title}
                  </CardTitle>
                </div>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-mono">
                  ACTIVE RULE
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-600 mt-1 leading-relaxed">
                {rule.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2 space-y-3">
              {/* Threshold Logic Code Box */}
              <div className="p-2.5 rounded bg-slate-900 text-slate-100 font-mono text-[11px] flex items-start gap-2">
                <Code className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400">Deterministic Logic: </span>
                  <span className="text-teal-300">{rule.thresholdLogic}</span>
                </div>
              </div>

              {/* Guideline Reference */}
              {rule.clinicianGuidelineRef && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clinical Standard: {rule.clinicianGuidelineRef}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
