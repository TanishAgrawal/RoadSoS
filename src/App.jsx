import { useEffect, useState } from 'react'
import Map from './components/Map.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import SearchFallback from './components/SearchFallback.jsx'
import SOSButton from './components/SOSButton.jsx'
import ErrorLanding from './components/ErrorLanding.jsx'
import TriageForm from './components/TriageForm.jsx'
import useGeolocation from './hooks/useGeolocation.js'
import useNearbyServices from './hooks/useNearbyServices.js'
import { saveLocation } from './services/offlineCache.js'
import { matchHospitalsForTriage } from './services/triageToHospitalMatcher.js'

const CATEGORY_META = [
  { type: 'hospital', label: 'Hospital', emoji: '🏥' },
  { type: 'fire', label: 'Fire Brigade', emoji: '🚒' },
  { type: 'police', label: 'Police Station', emoji: '🚓' },
  { type: 'ambulance', label: 'Ambulance', emoji: '🚑' },
  { type: 'towing', label: 'Towing', emoji: '🔧' },
  { type: 'tyres', label: 'Tyre Shop', emoji: '🛞' },
  { type: 'showroom', label: 'Car Showroom', emoji: '🚗' },
]

function App() {
  const { lat, lng, countryCode, placeName, error, loading, refresh } = useGeolocation()
  const [manualLocation, setManualLocation] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [locationRequesting, setLocationRequesting] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [activeView, setActiveView] = useState('home')
  const [activeCategory, setActiveCategory] = useState('hospital')
  const [focusedServiceId, setFocusedServiceId] = useState(null)

  const resolvedLat = manualLocation?.lat ?? lat
  const resolvedLng = manualLocation?.lng ?? lng
  const resolvedCountryCode = manualLocation?.countryCode ?? countryCode
  const resolvedPlaceName = manualLocation?.placeName ?? placeName ?? null

  const { services, loading: servicesLoading, error: servicesError } = useNearbyServices({
    lat: resolvedLat,
    lng: resolvedLng,
    reloadToken,
  })

  const [triageOpen, setTriageOpen] = useState(false)
  const [triagedServices, setTriagedServices] = useState(null)
  const [triageSceneHazard, setTriageSceneHazard] = useState(null)
  const [showSOSCard, setShowSOSCard] = useState(false)

  useEffect(() => {
    if (typeof resolvedLat === 'number' && typeof resolvedLng === 'number') {
      saveLocation(resolvedLat, resolvedLng)
    }
  }, [resolvedLat, resolvedLng])

  // Full-page error landing when geolocation or Overpass/service fetch fails
  // If geolocation failed (user denied or unavailable), allow manual search instead of showing an error.
  if (error && !manualLocation) {
    if (locationRequesting || loading) {
      return <LoadingSpinner message="Locating you..." submessage="Finding your GPS location" />
    }
    return <SearchFallback onLocationFound={(location) => { setManualLocation(location); setLocationRequesting(false) }} onUseGPS={() => { setManualLocation(null); setShowSearch(false); setLocationRequesting(true); setReloadToken((t) => t + 1); refresh(); }} />
  }

  // If Overpass / services fetch failed, show the full-page error landing with emergency number and retry.
  if (servicesError) {
    return (
      <ErrorLanding
        message={typeof servicesError === 'string' ? servicesError : 'Unable to load nearby services.'}
        countryCode={resolvedCountryCode}
        onRetry={() => setReloadToken((t) => t + 1)}
      />
    )
  }

  // Show search fallback when user explicitly requests manual search
  if (showSearch) {
    if (locationRequesting || loading) {
      return <LoadingSpinner message="Locating you..." submessage="Finding your GPS location" />
    }
    return <SearchFallback onLocationFound={(location) => { setManualLocation(location); setShowSearch(false); setLocationRequesting(false) }} onUseGPS={() => { setManualLocation(null); setShowSearch(false); setLocationRequesting(true); setReloadToken((t) => t + 1); refresh(); }} />
  }

  // Show a locating spinner while GPS is being resolved (initially),
  // then show a services-loading spinner while nearby services are fetched.
  if ((locationRequesting || loading) && (typeof resolvedLat !== 'number' || typeof resolvedLng !== 'number')) {
    return <LoadingSpinner message="Locating you..." submessage="Finding your GPS location" />
  }

  if (typeof resolvedLat === 'number' && typeof resolvedLng === 'number' && servicesLoading) {
    return <LoadingSpinner message="Loading nearby services..." submessage="Preparing map results and service data" />
  }

  if (typeof resolvedLat !== 'number' || typeof resolvedLng !== 'number') {
    // fallback: still show locating spinner
    return <LoadingSpinner message="Locating you..." submessage="Finding your GPS location" />
  }

  const openCategoryMap = (category, serviceId = null) => {
    setActiveCategory(category)
    setFocusedServiceId(serviceId)
    setActiveView('map')
  }

  function handleOpenAllOptions(category) {
    if (category === 'hospital') {
      setTriageOpen(true)
      return
    }
    openCategoryMap(category)
  }

  function handleTriageSubmit(triage) {
    const result = matchHospitalsForTriage(services || [], triage, { lat: resolvedLat, lng: resolvedLng })
    setTriagedServices(result.hospitals)
    setTriageSceneHazard(triage.sceneHazard)
    setTriageOpen(false)
    // show SOS card with updated services instead of redirecting to map
    setShowSOSCard(true)
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
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="ROADSoS logo"
              className="h-14 w-14 rounded-2xl object-cover shadow-sm shadow-slate-200 sm:h-16 sm:w-16"
            />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">ROADSoS</h1>
              <p className="text-sm text-slate-500">Emergency services locator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full rounded-3xl border border-white/80 bg-white/75 p-4 text-center shadow-xl shadow-slate-200/70 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Current origin</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {resolvedPlaceName || `${resolvedLat.toFixed(4)}, ${resolvedLng.toFixed(4)}`}
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:translate-y-0"
            >
              Change Location
            </button>
          </div>
        </div>

        <div className="mt-8 flex w-full justify-center">
          <SOSButton
            countryCode={resolvedCountryCode}
            services={triagedServices ? [...(services || []).filter((s) => s.type !== 'hospital'), ...triagedServices] : services}
            open={showSOSCard}
            onOpenChange={(v) => setShowSOSCard(!!v)}
            triageSceneHazard={triageSceneHazard}
            onStartTriage={() => handleOpenAllOptions('hospital')}
          />
        </div>

        {triageOpen ? (
          <TriageForm
            onSubmit={handleTriageSubmit}
            onClose={() => setTriageOpen(false)}
          
          />
        ) : null}

        <section className="mt-10 w-full">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Open map by category</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORY_META.map((category) => (
              <button
                key={category.type}
                type="button"
                onClick={() => openCategoryMap(category.type)}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
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