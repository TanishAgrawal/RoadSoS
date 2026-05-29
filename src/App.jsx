import { useEffect, useState } from 'react'
import Map from './components/Map.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import SearchFallback from './components/SearchFallback.jsx'
import SOSButton from './components/SOSButton.jsx'
import useGeolocation from './hooks/useGeolocation.js'
import useNearbyServices from './hooks/useNearbyServices.js'
import { saveLocation } from './services/offlineCache.js'

const CATEGORY_META = [
  { type: 'hospital', label: 'Hospital', emoji: '🏥' },
  { type: 'police', label: 'Police Station', emoji: '🚓' },
  { type: 'ambulance', label: 'Ambulance', emoji: '🚑' },
  { type: 'towing', label: 'Towing', emoji: '🔧' },
  { type: 'tyres', label: 'Tyre Shop', emoji: '🛞' },
  { type: 'showroom', label: 'Car Showroom', emoji: '🚗' },
]

function App() {
  const { lat, lng, countryCode, placeName, error, loading } = useGeolocation()
  const [manualLocation, setManualLocation] = useState(null)
  const [activeView, setActiveView] = useState('home')
  const [activeCategory, setActiveCategory] = useState('hospital')
  const [focusedServiceId, setFocusedServiceId] = useState(null)

  const resolvedLat = manualLocation?.lat ?? lat
  const resolvedLng = manualLocation?.lng ?? lng
  const resolvedCountryCode = manualLocation?.countryCode ?? countryCode
  const resolvedPlaceName = manualLocation?.placeName ?? placeName ?? null

  const { services } = useNearbyServices({
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
    return <SearchFallback onLocationFound={(location) => setManualLocation(location)} />
  }

  if (typeof resolvedLat !== 'number' || typeof resolvedLng !== 'number') {
    return <LoadingSpinner />
  }

  const openCategoryMap = (category, serviceId = null) => {
    setActiveCategory(category)
    setFocusedServiceId(serviceId)
    setActiveView('map')
  }

  if (activeView === 'map') {
    return (
      <Map
        lat={resolvedLat}
        lng={resolvedLng}
        services={services}
        activeCategory={activeCategory}
        focusedServiceId={focusedServiceId}
        onCategoryChange={(category) => {
          setActiveCategory(category)
          setFocusedServiceId(null)
        }}
        onBack={() => {
          setActiveView('home')
          setFocusedServiceId(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-black tracking-tight text-slate-950">ROADSoS</h1>
            <p className="text-sm text-slate-500">Emergency services locator</p>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full rounded-3xl border border-white/80 bg-white/75 p-4 text-center shadow-xl shadow-slate-200/70 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Current origin</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {resolvedPlaceName || `${resolvedLat.toFixed(4)}, ${resolvedLng.toFixed(4)}`}
          </p>
        </div>

        <div className="mt-8 flex w-full justify-center">
          <SOSButton
            countryCode={resolvedCountryCode}
            services={services}
            onOpenDirections={(service) => openCategoryMap(service.type, `${service.type}-${service.id}`)}
          />
        </div>

        <section className="mt-10 w-full">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Open map by category</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORY_META.map((category) => (
              <button
                key={category.type}
                type="button"
                onClick={() => openCategoryMap(category.type)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
              >
                <div className="text-2xl">{category.emoji}</div>
                <div className="mt-2 text-sm font-semibold text-slate-700">{category.label}</div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App