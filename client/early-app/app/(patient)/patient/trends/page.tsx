'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { observationService } from '@/lib/services'
import { BiomarkerTrend } from '@/types/api'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts'
import { LineChart as ChartIcon, ShieldCheck, Info } from 'lucide-react'

export default function PatientTrendsPage() {
  const [trends, setTrends] = useState<BiomarkerTrend[]>([])
  const [selectedTest, setSelectedTest] = useState<string>('HbA1c')

  useEffect(() => {
    async function load() {
      const res = await observationService.getTrends('pat-aarav-001')
      if (res.success && res.data) {
        setTrends(res.data)
      }
    }
    load()
  }, [])

  const currentTrend = trends.find((t) => t.testName === selectedTest) || trends[0]

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Longitudinal Biomarker Trends
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Multi-timepoint tracking of critical diagnostic markers with shaded reference intervals.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Deterministic Analysis</span>
          </div>
        </div>
      </div>

      <Card className="border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                {currentTrend ? `${currentTrend.testName} (${currentTrend.unit})` : 'Biomarker Progression'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                {currentTrend?.refLow && currentTrend?.refHigh
                  ? `Standard Clinical Reference Range: ${currentTrend.refLow} – ${currentTrend.refHigh} ${currentTrend.unit}`
                  : 'Time-series biomarker progression'}
              </CardDescription>
            </div>

            {/* Test Selector Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {trends.map((t) => (
                <button
                  key={t.testName}
                  onClick={() => setSelectedTest(t.testName)}
                  className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors ${
                    selectedTest === t.testName
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.testName}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="h-80 w-full">
            {currentTrend && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={currentTrend.points}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="observedAt"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    fontFamily="monospace"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    fontFamily="monospace"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                    formatter={(val: any) => [`${val} ${currentTrend.unit}`, currentTrend.testName]}
                  />
                  {currentTrend.refLow !== undefined && currentTrend.refHigh !== undefined && (
                    <ReferenceArea
                      y1={currentTrend.refLow}
                      y2={currentTrend.refHigh}
                      fill="#0d9488"
                      fillOpacity={0.06}
                      stroke="#0d9488"
                      strokeOpacity={0.2}
                      strokeDasharray="2 2"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="valueNumeric"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    dot={{ fill: '#0d9488', r: 4, stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#0f172a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-start gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Longitudinal Continuity Principle: </span>
              Isolated measurements often look benign, but comparing changes across multi-month intervals allows clinicians to detect early signal drift before severe complications develop.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
