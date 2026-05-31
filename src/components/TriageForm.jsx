import { useState } from 'react'

const SEVERITY_OPTIONS = ['Minor', 'Moderate', 'Severe']
const INJURY_OPTIONS = [
  'Minor scratches / No injuries',
  'Burns',
  'Fractures',
  'Crush injuries',
  'Head/Brain injury',
  'Spinal injury',
  'Chest/Internal bleeding',
  'Cardiac emergency',
  'Other',
]
const SCENE_HAZARD_OPTIONS = ['No hazard', 'Vehicle on fire', 'Unknown']

export default function TriageForm({ onSubmit, onClose }) {
  const [step, setStep] = useState(1)
  const [severity, setSeverity] = useState('Minor')
  const [injuryTypes, setInjuryTypes] = useState([INJURY_OPTIONS[0]])
  const [sceneHazard, setSceneHazard] = useState('No hazard')

  function toggleInjury(injury) {
    setInjuryTypes((prev) => (prev.includes(injury) ? prev.filter((i) => i !== injury) : [...prev, injury]))
  }

  function handleNext() {
    setStep((s) => Math.min(3, s + 1))
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1))
  }

  function handleSubmit() {
    const triage = {
      severity,
      injuryTypes,
      sceneHazard,
    }
    onSubmit?.(triage)
  }

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Quick Questions</h3>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-full bg-white border px-3 py-1 text-sm">Close</button>
          </div>
        </div>

        <div className="mt-4">
          {step === 1 && (
            <div>
              <p className="text-sm font-semibold">Step 1 — Severity</p>
              <div className="mt-2 flex flex-col gap-2">
                {SEVERITY_OPTIONS.map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2">
                    <input type="radio" name="severity" checked={severity === opt} onChange={() => setSeverity(opt)} />
                    <span className="ml-1">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm font-semibold">Step 2 — Injury Types (select all that apply)</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {INJURY_OPTIONS.map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={injuryTypes.includes(opt)} onChange={() => toggleInjury(opt)} />
                    <span className="ml-1 text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm font-semibold">Step 3 — Scene Hazard</p>
              <div className="mt-2 flex flex-col gap-2">
                {SCENE_HAZARD_OPTIONS.map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2">
                    <input type="radio" name="hazard" checked={sceneHazard === opt} onChange={() => setSceneHazard(opt)} />
                    <span className="ml-1 text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

          <div className="mt-6 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button onClick={handleBack} className="mr-2 rounded-full bg-white border px-3 py-1 text-sm">Back</button>
            )}
            {step < 3 && (
              <button onClick={handleNext} className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">Next</button>
            )}
          </div>

          <div>
            {step === 3 ? (
              <button onClick={handleSubmit} className="rounded-full bg-green-600 px-4 py-1 text-sm font-semibold text-white">Submit</button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
