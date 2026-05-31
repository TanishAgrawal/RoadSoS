import { useMemo, useState, useEffect } from 'react'
import { getEmergencyNumber } from '../services/emergencyNumbers.js'
import { buildGoogleMapsSearchUrl } from '../utils/maps.js'
import { capitalizeWords, cleanTel, formatDistance } from '../utils/formatting.js'

function pickNearest(services, type) {
  const byType = services.filter((service) => service.type === type)
  if (!byType.length) return null
  return byType.reduce((nearest, current) =>
    current.distance < nearest.distance ? current : nearest
  )
}

export default function SOSButton({ countryCode, services = [], onStartTriage, open, onOpenChange, triageSceneHazard }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [phoneMenuNumbers, setPhoneMenuNumbers] = useState(null)
  const [callNotice, setCallNotice] = useState('')

  const isOpen = typeof open === 'boolean' ? open : internalIsOpen

  useEffect(() => {
    if (!callNotice) return undefined
    const t = setTimeout(() => setCallNotice(''), 2200)
    return () => clearTimeout(t)
  }, [callNotice])

  const emergencyNumber = useMemo(() => getEmergencyNumber(countryCode), [countryCode])

  const nearestPolice = useMemo(() => pickNearest(services, 'police'), [services])
  const nearestAmbulance = useMemo(() => pickNearest(services, 'ambulance'), [services])
  const nearestFire = useMemo(() => pickNearest(services, 'fire'), [services])

  const fallbackHospital = useMemo(() => pickNearest(services, 'hospital'), [services])
  const displayedHospital = fallbackHospital
  const hospitalLabel = 'Nearest Hospital'

  function getValidPhones(service) {
    const rawPhones = service?.phones || (service?.phone ? [service.phone] : [])
    return rawPhones.map(cleanTel).filter(Boolean)
  }

  function dialOrNotify(number) {
    if (!number) {
      setCallNotice('No valid phone number available')
      return
    }
    window.location.href = `tel:${number}`
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (typeof onStartTriage === 'function') return onStartTriage()
          return setInternalIsOpen(true)
        }}
        className="z-[20] flex h-40 w-40 cursor-pointer items-center justify-center rounded-full bg-red-600 text-4xl font-black tracking-wide text-white shadow-[0_24px_50px_rgba(220,38,38,0.45)] transition hover:scale-105 hover:bg-red-500 active:scale-95"
      >
        SOS
      </button>

      {isOpen ? (
        <div onClick={() => { setInternalIsOpen(false); onOpenChange?.(false); setPhoneMenuNumbers(null); }} className="fixed inset-0 z-[70] cursor-pointer overflow-y-auto bg-slate-950/55 px-4 py-6">
          <div onClick={(e) => e.stopPropagation()} className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Emergency options</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">Nearest help right now</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInternalIsOpen(false)
                    onOpenChange?.(false)
                    setPhoneMenuNumbers(null)
                  }}
                  className="cursor-pointer rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-200"
                >
                  Close
                </button>
              </div>
            </div>

              <div className="mt-5 grid gap-3">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="mt-1 text-lg font-bold text-slate-900">🏥 {hospitalLabel}</h4>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {displayedHospital?.name ? capitalizeWords(displayedHospital.name) : 'No location data available'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {displayedHospital ? (displayedHospital.address ? capitalizeWords(displayedHospital.address) : 'No address') : 'No address'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {displayedHospital ? formatDistance(displayedHospital.distance) : 'Distance unavailable'}
                    </p>
                    
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const phones = getValidPhones(displayedHospital)
                      if (phones.length > 1) {
                        setPhoneMenuNumbers(phones)
                      } else {
                        const number = phones[0] || ''
                        dialOrNotify(number)
                      }
                    }}
                    className="cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    📞 Call
                  </button>
                  {/* phone numbers shown in a modal when present */}
                  {displayedHospital ? (
                    <a
                      href={buildGoogleMapsSearchUrl(displayedHospital)}
                      target="_blank"
                      rel="noreferrer"
                      className="cursor-pointer rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-lg active:translate-y-0"
                    >
                      🗺 Directions
                    </a>
                  ) : null}
                </div>
              </article>
              { (triageSceneHazard === 'Vehicle on fire' || triageSceneHazard === 'Unknown') && (
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="mt-1 text-lg font-bold text-slate-900">🚒 Nearest Fire Brigade</h4>
                      <p className="mt-2 text-sm font-semibold text-slate-700">{nearestFire?.name ? capitalizeWords(nearestFire.name) : 'No location data available'}</p>
                      <p className="mt-1 text-xs text-slate-500">{nearestFire ? (nearestFire.address ? capitalizeWords(nearestFire.address) : 'No address') : 'No address'}</p>
                      <p className="text-sm text-slate-500">{nearestFire ? formatDistance(nearestFire.distance) : 'Distance unavailable'}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => {
                      const phones = getValidPhones(nearestFire)
                      if (phones.length > 1) { setPhoneMenuNumbers(phones) }
                      else {
                        const number = phones[0] || ''
                        dialOrNotify(number)
                      }
                    }} className="cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">📞 Call</button>
                    {nearestFire ? (<a href={buildGoogleMapsSearchUrl(nearestFire)} target="_blank" rel="noreferrer" className="cursor-pointer rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">🗺 Directions</a>) : null}
                  </div>
                </article>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="mt-1 text-lg font-bold text-slate-900">🚓 Nearest Police</h4>
                      <p className="mt-2 text-sm font-semibold text-slate-700">{nearestPolice?.name ? capitalizeWords(nearestPolice.name) : 'No location data available'}</p>
                      <p className="mt-1 text-xs text-slate-500">{nearestPolice ? (nearestPolice.address ? capitalizeWords(nearestPolice.address) : 'No address') : 'No address'}</p>
                      <p className="text-sm text-slate-500">{nearestPolice ? formatDistance(nearestPolice.distance) : 'Distance unavailable'}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => {
                      const phones = getValidPhones(nearestPolice)
                      if (phones.length > 1) { setPhoneMenuNumbers(phones) }
                      else {
                        const number = phones[0] || ''
                        dialOrNotify(number)
                      }
                    }} className="cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">📞 Call</button>
                    {/* phone numbers shown in a modal when present */}
                    {nearestPolice ? (<a href={buildGoogleMapsSearchUrl(nearestPolice)} target="_blank" rel="noreferrer" className="cursor-pointer rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">🗺 Directions</a>) : null}
                  </div>
                </article>
                

                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="mt-1 text-lg font-bold text-slate-900">🚑 Nearest Ambulance</h4>
                      <p className="mt-2 text-sm font-semibold text-slate-700">{nearestAmbulance?.name ? capitalizeWords(nearestAmbulance.name) : 'No location data available'}</p>
                      <p className="mt-1 text-xs text-slate-500">{nearestAmbulance ? (nearestAmbulance.address ? capitalizeWords(nearestAmbulance.address) : 'No address') : 'No address'}</p>
                      <p className="text-sm text-slate-500">{nearestAmbulance ? formatDistance(nearestAmbulance.distance) : 'Distance unavailable'}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => {
                      const phones = getValidPhones(nearestAmbulance)
                      if (phones.length > 1) { setPhoneMenuNumbers(phones) }
                      else {
                        const number = phones[0] || ''
                        dialOrNotify(number)
                      }
                    }} className="cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">📞 Call</button>
                    {/* phone numbers shown in a modal when present */}
                    {nearestAmbulance ? (<a href={buildGoogleMapsSearchUrl(nearestAmbulance)} target="_blank" rel="noreferrer" className="cursor-pointer rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">🗺 Directions</a>) : null}
                  </div>
                </article>
              </div>

              <article className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Emergency Number</p>
                <h4 className="mt-1 text-lg font-black text-slate-900">🌍 {emergencyNumber}</h4>
                <p className="mt-2 text-sm text-slate-600">
                  Country detected: {countryCode ? countryCode.toUpperCase() : 'Unknown'}
                </p>

                <div className="mt-4">
                  <a
                    href={`tel:${cleanTel(emergencyNumber)}`}
                    className="cursor-pointer rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    📞 Call Emergency Number
                  </a>
                </div>
              </article>
            </div>
            {phoneMenuNumbers ? (
              <div onClick={() => { setPhoneMenuNumbers(null); }} className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 p-4">
                <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-slate-900">Phone numbers</h4>
                    <button
                      onClick={() => { setPhoneMenuNumbers(null); }}
                      className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {phoneMenuNumbers.map((num, idx) => (
                      <a key={idx} href={`tel:${num}`} onClick={() => { setPhoneMenuNumbers(null); }} className="block w-full rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900">{num}</a>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            {callNotice ? (
              <div className="fixed bottom-6 left-1/2 z-[76] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white shadow-xl">
                {callNotice}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}