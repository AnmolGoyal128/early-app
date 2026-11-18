'use client'

import React, { useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { encounterService, followUpService } from '@/lib/services'
import { toast } from 'sonner'
import { ArrowLeft, Stethoscope, CheckCircle2, Calendar } from 'lucide-react'

export default function DoctorNewEncounterPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const resolvedParams = use(params)
  const patientId = resolvedParams.patientId
  const router = useRouter()

  const [encounterDate, setEncounterDate] = useState(new Date().toISOString().split('T')[0])
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [clinicalAssessment, setClinicalAssessment] = useState('')
  const [patientFriendlySummary, setPatientFriendlySummary] = useState('')
  const [treatmentName, setTreatmentName] = useState('')
  const [treatmentDosage, setTreatmentDosage] = useState('')
  const [followUpTitle, setFollowUpTitle] = useState('')
  const [followUpDueDate, setFollowUpDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chiefComplaint || !clinicalAssessment) {
      toast.error('Please enter chief complaint and clinical assessment.')
      return
    }

    setIsSubmitting(true)
    try {
      await encounterService.createEncounter(patientId, {
        chiefComplaint,
        clinicalAssessment,
        patientFriendlySummary:
          patientFriendlySummary ||
          `Consultation on ${encounterDate}: Reviewed health trends with Dr. Priya Nair. Ongoing preventive care advised.`,
        treatments: treatmentName
          ? [
              {
                name: treatmentName,
                category: 'MEDICATION',
                dosage: treatmentDosage,
                status: 'ACTIVE',
                startedAt: encounterDate,
              },
            ]
          : [],
      })

      if (followUpTitle && followUpDueDate) {
        await followUpService.createFollowUp(patientId, {
          title: followUpTitle,
          dueDate: followUpDueDate,
          actionType: 'REASSESSMENT_VISIT',
          notes: 'Follow-up created during clinical visit.',
        })
      }

      toast.success('Clinical encounter & follow-up saved to patient record.')
      router.push(`/doctor/patients/${patientId}`)
    } catch {
      toast.error('Failed to save encounter.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/doctor/patients/${patientId}`}>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Chart
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Record Clinical Encounter
          </h1>
          <p className="text-xs text-slate-500">
            Record diagnosis, patient summary, treatments, and closed-loop follow-up milestones.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">Clinical Consultation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="enc-date" className="text-xs font-medium text-slate-700">Encounter Date</Label>
                <Input
                  id="enc-date"
                  type="date"
                  value={encounterDate}
                  onChange={(e) => setEncounterDate(e.target.value)}
                  className="text-xs h-9 bg-white font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="chief" className="text-xs font-medium text-slate-700">Chief Complaint</Label>
                <Input
                  id="chief"
                  placeholder="e.g. Headache on waking, BP monitoring review"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="text-xs h-9 bg-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="assessment" className="text-xs font-medium text-slate-700">
                Clinician Assessment (Internal Medical Record)
              </Label>
              <Textarea
                id="assessment"
                placeholder="Stage 1 Hypertension. Elevated BP 146/92. Dietary salt restriction advised..."
                value={clinicalAssessment}
                onChange={(e) => setClinicalAssessment(e.target.value)}
                className="text-xs min-h-[80px] bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="patient-summary" className="text-xs font-medium text-slate-700">
                  Patient-Friendly Summary (Plain-Language Perspective)
                </Label>
                <span className="text-[10px] text-teal-800 font-medium">Calm Clinical Copy Guard</span>
              </div>
              <Textarea
                id="patient-summary"
                placeholder="We reviewed your blood pressure readings and discussed keeping a daily morning log before our two-week review..."
                value={patientFriendlySummary}
                onChange={(e) => setPatientFriendlySummary(e.target.value)}
                className="text-xs min-h-[70px] bg-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Treatment & Follow-Up Section */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Prescribed Treatment & Linked Follow-Up
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Close the care loop by linking clinical findings directly to tracked actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="rx-name" className="text-xs font-medium text-slate-700">Treatment / Medication</Label>
                <Input
                  id="rx-name"
                  placeholder="e.g. Telmisartan 40mg or Low Sodium Diet"
                  value={treatmentName}
                  onChange={(e) => setTreatmentName(e.target.value)}
                  className="text-xs h-9 bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rx-dose" className="text-xs font-medium text-slate-700">Dosage / Frequency</Label>
                <Input
                  id="rx-dose"
                  placeholder="e.g. 1 tablet once daily morning"
                  value={treatmentDosage}
                  onChange={(e) => setTreatmentDosage(e.target.value)}
                  className="text-xs h-9 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <Label htmlFor="fu-act" className="text-xs font-medium text-slate-700">Scheduled Follow-Up Action</Label>
                <Input
                  id="fu-act"
                  placeholder="e.g. 14-Day Blood Pressure Reassessment"
                  value={followUpTitle}
                  onChange={(e) => setFollowUpTitle(e.target.value)}
                  className="text-xs h-9 bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fu-due" className="text-xs font-medium text-slate-700">Follow-Up Due Date</Label>
                <Input
                  id="fu-due"
                  type="date"
                  value={followUpDueDate}
                  onChange={(e) => setFollowUpDueDate(e.target.value)}
                  className="text-xs h-9 bg-white font-mono"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 p-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
              Save Encounter & Commit to Central Record
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
