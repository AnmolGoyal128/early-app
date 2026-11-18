'use client'

import React from 'react'
import { Stage, Window, Bar, Text, Roll, Collapse, Fly, type Act, type Point } from './kit'
import { FileText, CheckCircle2, AlertTriangle, Calendar, ArrowRight, ShieldCheck } from 'lucide-react'
import './early-hero.css'

interface HeroState {
  fileDropped: boolean
  isVerified: boolean
  satelliteOpen: boolean
  followUpScheduled: boolean
  ghost: { on: boolean; at: Point }
}

const initial: HeroState = {
  fileDropped: false,
  isVerified: false,
  satelliteOpen: false,
  followUpScheduled: false,
  ghost: { on: false, at: { x: 0, y: 0 } },
}

const POSTER: HeroState = {
  fileDropped: true,
  isVerified: true,
  satelliteOpen: true,
  followUpScheduled: true,
  ghost: { on: false, at: { x: 0, y: 0 } },
}

async function script(a: Act<HeroState>) {
  await a.wait(700)

  // Beat 1: Clinician workspace open to Aarav Sharma
  a.mark('init')
  await a.wait(600)

  // Beat 2: Cursor drags Metro_Lab_Report.pdf into dropzone
  a.mark('drag-file')
  const deskFile = a.rect('desk-file')
  const dropzone = a.rect('dropzone')
  
  await a.move({ x: deskFile.x + deskFile.width / 2, y: deskFile.y + deskFile.height / 2 })
  await a.wait(250)

  await a.drag(
    { x: dropzone.x + dropzone.width * 0.45, y: dropzone.y + dropzone.height * 0.45 },
    (at) => {
      a.put({ ghost: { on: true, at } })
    },
    { duration: 1100, cursor: 'preserve' }
  )

  await a.set({ fileDropped: true, ghost: { on: false, at: { x: 0, y: 0 } } })
  await a.wait(500)

  // Beat 3: Cursor moves to verify button and clicks
  a.mark('verify-click')
  await a.move('verify-btn')
  await a.wait(350)
  await a.click('verify-btn')
  await a.set({ isVerified: true })
  await a.wait(600)

  // Beat 4: Deterministic rule triggers satellite card
  a.mark('rule-satellite')
  await a.set({ satelliteOpen: true })
  await a.wait(700)

  // Beat 5: Cursor clicks Schedule Reassessment and status rolls
  a.mark('schedule-click')
  await a.move('schedule-btn')
  await a.wait(350)
  await a.click('schedule-btn')
  await a.set({ followUpScheduled: true })
  await a.wait(2500) // Reading hold time before smooth loop reset
}

export function EarlyHeroStage() {
  return (
    <div className="w-full flex justify-center py-4">
      <Stage<HeroState>
        width={960}
        height={460}
        initial={initial}
        poster={POSTER}
        script={script}
        play="loop"
        className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
      >
        {(s, _rect, layout) => {
          const isCompact = layout === 'compact'

          return (
            <div className={`early-hero ${isCompact ? 'early-hero-compact' : ''}`}>
              {/* Desktop source file icon */}
              {!s.fileDropped && (
                <div
                  data-target="desk-file"
                  style={{
                    position: 'absolute',
                    top: isCompact ? 16 : 32,
                    right: isCompact ? 16 : 36,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#0f172a',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Metro_Lab_Report.pdf</span>
                </div>
              )}

              {/* Drag ghost */}
              {s.ghost.on && (
                <div
                  className="early-hero-file-ghost"
                  style={{
                    left: s.ghost.at.x - 20,
                    top: s.ghost.at.y - 15,
                  }}
                >
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Metro_Lab_Report.pdf</span>
                </div>
              )}

              {/* Main Clinical Window */}
              <div className="early-hero-window">
                <div className="early-hero-header">
                  <div className="early-hero-patient">
                    <div className="early-hero-avatar">AS</div>
                    <div>
                      <div className="early-hero-name">Aarav Sharma · 48M</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="early-hero-scope-pill">Full History</span>
                        <Bar w={40} h={8} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <Bar w={60} h={10} />
                  </div>
                </div>

                <div className="early-hero-body">
                  {/* Prior Observation Row */}
                  <div className="early-hero-card">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700">Prior Clinical Visit</span>
                      <span className="text-slate-400 font-mono text-[11px]">2026-08-20</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 font-mono">BP 146/92 mmHg</span>
                        <span className="early-hero-badge-amber">Elevated</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>Follow-up:</span>
                        <Roll
                          className={`font-mono text-xs font-medium ${
                            s.followUpScheduled ? 'text-teal-700 font-semibold' : 'text-amber-700'
                          }`}
                        >
                          {s.followUpScheduled ? 'Scheduled · 14 Days' : 'Pending'}
                        </Roll>
                      </div>
                    </div>
                  </div>

                  {/* Upload Dropzone */}
                  <div
                    data-target="dropzone"
                    className="early-hero-dropzone"
                    data-active={s.fileDropped ? 'true' : 'false'}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-600">
                        {s.fileDropped ? 'Metro_Lab_Report.pdf (Processed)' : 'Drag lab report PDF here to extract'}
                      </span>
                    </div>
                    <Bar w={50} h={8} />
                  </div>

                  {/* Extracted Values Section */}
                  {s.fileDropped && (
                    <div className="early-hero-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">Extracted Lab Findings</span>
                          <span
                            className={
                              s.isVerified
                                ? 'early-hero-badge-emerald'
                                : 'early-hero-badge-amber'
                            }
                          >
                            {s.isVerified ? 'Verified' : 'Pending Verification'}
                          </span>
                        </div>
                        {!s.isVerified ? (
                          <button
                            data-target="verify-btn"
                            className="text-xs font-medium px-2.5 py-1 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                            <span>Verify Extracted Values</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-700 text-xs font-semibold font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Audited & Committed</span>
                          </div>
                        )}
                      </div>

                      <div className="early-hero-extracted-row">
                        <div>
                          <div className="font-semibold text-slate-900 font-mono text-xs">HbA1c 6.4%</div>
                          <div className="text-[10px] text-slate-500 font-mono">Ref: 4.0 – 5.6% · Fasting Glucose 118 mg/dL</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-teal-700 font-mono font-medium">OCR Conf: 98%</div>
                          <div className="text-[10px] text-slate-400">Metro Diagnostics</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Peripheral rows with calm Bar filler */}
                  <div className="flex flex-col gap-1.5 opacity-60">
                    <Bar w="100%" h={10} />
                    <Bar w="75%" h={10} />
                  </div>
                </div>
              </div>

              {/* Satellite Deterministic Flag Card */}
              {s.satelliteOpen && (
                <div className="early-hero-satellite">
                  <div className="early-hero-satellite-title">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span>Review Needed</span>
                  </div>
                  <div className="early-hero-satellite-desc">
                    Deterministic Rule <strong>BP_ELEVATED_REVIEW</strong> triggered. Prior BP 146/92 with HbA1c drift (+0.6% over 6m).
                  </div>
                  <div className="pt-1 border-t border-amber-100 flex items-center justify-between">
                    <button
                      data-target="schedule-btn"
                      className="w-full py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule Reassessment</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        }}
      </Stage>
    </div>
  )
}
