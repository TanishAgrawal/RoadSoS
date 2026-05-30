import { getEmergencyNumber } from '../services/emergencyNumbers.js'

export default function ErrorLanding({ message, countryCode, onRetry }) {
  const emergency = getEmergencyNumber(countryCode)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-red-50 to-white px-4 py-16">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-black text-slate-900">Something went wrong</h1>
        <p className="mt-4 text-sm text-slate-600">{message || 'Unable to load emergency services or access location.'}</p>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Try Again
          </button>

          <div className="rounded-2xl border border-slate-100 bg-amber-50 px-4 py-3 text-sm">
            <div className="text-xs text-slate-500">Local emergency number</div>
            <div className="mt-1 text-lg font-bold text-amber-700">{emergency}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
