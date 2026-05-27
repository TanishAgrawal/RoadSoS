import { useEffect, useState } from 'react'
import Map from './components/Map.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import SearchFallback from './components/SearchFallback.jsx'
import SOSButton from './components/SOSButton.jsx'
import ServiceList from './components/ServiceList.jsx'
import useGeolocation from './hooks/useGeolocation.js'
import useNearbyServices from './hooks/useNearbyServices.js'
import { saveLocation } from './services/offlineCache.js'

function App() {
  const { lat, lng, countryCode, error, loading } = useGeolocation()
  const [manualLocation, setManualLocation] = useState(null)

  const resolvedLat = manualLocation?.lat ?? lat
  const resolvedLng = manualLocation?.lng ?? lng
  const { services, loading: servicesLoading, source } = useNearbyServices({
    lat: resolvedLat,
    lng: resolvedLng,
  })

  useEffect(() => {
    if (typeof resolvedLat === 'number' && typeof resolvedLng === 'number') {
      saveLocation(resolvedLat, resolvedLng)
    }
  }, [resolvedLat, resolvedLng])

  if (loading && !manualLocation) {
    return <LoadingSpinner />
  }

  if (error && !manualLocation) {
    return <SearchFallback onLocationFound={(nextLat, nextLng) => setManualLocation({ lat: nextLat, lng: nextLng })} />
  }

  if (typeof resolvedLat !== 'number' || typeof resolvedLng !== 'number') {
    return <LoadingSpinner />
  }

  const statusLabel = source === 'cached' && !servicesLoading ? 'Cached' : 'Live'
  const statusDot = statusLabel === 'Cached' ? '○' : '●'

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">ROADSoS</h1>
            <p className="text-sm text-slate-500">Emergency services locator</p>
          </div>

          <div className="rounded-full bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
            {statusDot} {statusLabel}
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl flex-col md:flex-row md:gap-4 md:px-4 md:py-4">
        <section className="h-[48vh] min-h-[320px] md:h-auto md:flex-1">
          <Map lat={resolvedLat} lng={resolvedLng} services={services} />
        </section>

        <section className="h-[52vh] min-h-0 md:h-auto md:flex-1">
          <ServiceList services={services} />
        </section>
      </main>

      {servicesLoading ? (
        <div className="fixed left-4 top-24 z-30 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-lg shadow-slate-200/80">
          Updating nearby services...
        </div>
      ) : null}

      <SOSButton countryCode={countryCode} />
    </div>
  )
}

export default App