import { useMemo, useState } from 'react'
import { getEmergencyNumber } from '../services/emergencyNumbers.js'

function formatDistance(distance) {
  if (typeof distance !== 'number' || Number.isNaN(distance)) return 'Distance unavailable'
  return `${distance.toFixed(1)} km away`
}

function pickNearest(services, type) {
  const byType = services.filter((service) => service.type === type)
  if (!byType.length) return null
  return byType.reduce((nearest, current) =>
    current.distance < nearest.distance ? current : nearest
  )
}

export default function SOSButton({ countryCode, services = [], onOpenDirections }) {
  const [isOpen, setIsOpen] = useState(false)

  const emergencyNumber = useMemo(() => getEmergencyNumber(countryCode), [countryCode])
  const nearestHospital = useMemo(() => pickNearest(services, 'hospital'), [services])
  const nearestPolice = useMemo(() => pickNearest(services, 'police'), [services])
  const nearestAmbulance = useMemo(() => pickNearest(services, 'ambulance'), [services])

  const nearestOptions = [
    { key: 'hospital', label: 'Nearest Hospital', service: nearestHospital, emoji: '🏥' },
    { key: 'police', label: 'Nearest Police Station', service: nearestPolice, emoji: '🚓' },
    { key: 'ambulance', label: 'Nearest Ambulance', service: nearestAmbulance, emoji: '🚑' },
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="z-[20] flex h-40 w-40 items-center justify-center rounded-full bg-red-600 text-4xl font-black tracking-wide text-white shadow-[0_24px_50px_rgba(220,38,38,0.45)] transition hover:scale-105 hover:bg-red-500 active:scale-95"
      >
        SOS
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/55 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Emergency options</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">Nearest help right now</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {nearestOptions.map((option) => {
                const callNumber = option.service?.phone || emergencyNumber
                return (
                  <article key={option.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="mt-1 text-lg font-bold text-slate-900">
                          {option.emoji} {option.label}
                        </h4>
                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {option.service?.name || 'No location data available'}
                        </p>
                        <p className="text-sm text-slate-500">{option.service ? formatDistance(option.service.distance) : 'Distance unavailable'}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={`tel:${callNumber}`}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        📞 Call
                      </a>
                      {option.service ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false)
                            onOpenDirections(option.service)
                          }}
                          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                        >
                          🗺 Directions
                        </button>
                      ) : null}
                    </div>
                  </article>
                )
              })}

              <article className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Emergency Number</p>
                <h4 className="mt-1 text-lg font-black text-slate-900">🌍 {emergencyNumber}</h4>
                <p className="mt-2 text-sm text-slate-600">
                  Country detected: {countryCode ? countryCode.toUpperCase() : 'Unknown'}
                </p>

                <div className="mt-4">
                  <a
                    href={`tel:${emergencyNumber}`}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    📞 Call Emergency Number
                  </a>
                </div>
              </article>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}