import { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import StepWelcome from './StepWelcome'
import StepSleep from './StepSleep'
import StepWork from './StepWork'
import StepTheme from './StepTheme'
import StepPin from './StepPin'
import { useAppStore } from '../../store/useAppStore'
import { saveSettings } from '../../lib/db'

const STEPS = ['Welcome', 'Sleep', 'Work', 'Theme', 'PIN']

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const settings = useAppStore(s => s.settings)
  const setSettings = useAppStore(s => s.setSettings)

  async function handleFinish() {
    setSaving(true)
    const updated = { ...settings, onboarding_done: true }
    const saved = await saveSettings(updated)
    setSettings(saved || updated)
    setSaving(false)
    onComplete()
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }
  const isLast = step === STEPS.length - 1

  const stepComponents = [
    <StepWelcome key="welcome" onNext={next} />,
    <StepSleep key="sleep" onNext={next} />,
    <StepWork key="work" onNext={next} />,
    <StepTheme key="theme" onNext={next} />,
    <StepPin key="pin" onFinish={handleFinish} saving={saving} />,
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-800">
        <div
          className="h-full accent-bg transition-all duration-500"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-2 pt-6">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-all ${
              i === step ? 'accent-bg w-6' : i < step ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {stepComponents[step]}
        </div>
      </div>

      {/* Navigation (except step 0 which has its own CTA and last step) */}
      {step > 0 && step < STEPS.length - 1 && (
        <div className="flex justify-between items-center px-6 pb-8 max-w-md mx-auto w-full">
          <button
            onClick={back}
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1 accent-bg text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-all"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
