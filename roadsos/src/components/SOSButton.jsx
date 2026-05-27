import { useMemo, useState } from 'react'
import { getEmergencyNumber } from '../services/emergencyNumbers.js'

export default function SOSButton({ countryCode }) {
  const [isOpen, setIsOpen] = useState(false)

  const emergencyNumber = useMemo(() => getEmergencyNumber(countryCode), [countryCode])

  const handleConfirm = () => {
    setIsOpen(false)
    window.location.href = `tel:${emergencyNumber}`
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-[60] flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-lg font-black tracking-wide text-white shadow-[0_18px_40px_rgba(220,38,38,0.45)] transition hover:scale-105 hover:bg-red-500 active:scale-95"
      >
        SOS
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 px-4 pb-6 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Emergency call</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">Call {emergencyNumber}?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your detected region is {countryCode ? countryCode.toUpperCase() : 'unknown'}. This will open the phone dialer with the local emergency number.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Call now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}