import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'

const CATEGORIES = [
  { value: 'hospital', label: 'Hospitals' },
  { value: 'police', label: 'Police' },
  { value: 'ambulance', label: 'Ambulance' },
  { value: 'towing', label: 'Towing' },
  { value: 'tyres', label: 'Tyres' },
  { value: 'showroom', label: 'Showrooms' },
]

function createMarkerIcon(color) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 6px 16px rgba(15, 23, 42, 0.28);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -18],
  })
}

function getServiceColor(type) {
  if (type === 'police') return '#2563eb'
  if (type === 'hospital' || type === 'ambulance') return '#dc2626'
  return '#f97316'
}

function formatDistance(distance) {
  if (typeof distance !== 'number' || Number.isNaN(distance)) return 'Distance unavailable'
  return `${distance.toFixed(1)} km away`
}

function buildMapsLink(lat, lng) {
  return `https://maps.google.com/?q=${lat},${lng}`
}

function getServiceKey(service) {
  return `${service.type}-${service.id}`
}

function MapViewController({ center, focusRevision, focusTarget, centerMarkerRef, markerRefs }) {
  const map = useMap()

  useEffect(() => {
    if (!focusTarget) return undefined

    const popupMarker = focusTarget.type === 'service'
      ? markerRefs.current[focusTarget.key]
      : centerMarkerRef.current

    if (!popupMarker) return undefined

    map.stop()
    map.flyTo(focusTarget.type === 'service' ? [popupMarker.getLatLng().lat, popupMarker.getLatLng().lng] : center, 14, {
      animate: true,
      duration: 0.32,
      easeLinearity: 0.25,
    })

    const handleMoveEnd = () => popupMarker.openPopup()
    map.once('moveend', handleMoveEnd)

    return () => {
      map.off('moveend', handleMoveEnd)
    }
  }, [center, centerMarkerRef, focusRevision, focusTarget, map, markerRefs])

  return null
}

export default function Map({
  lat,
  lng,
  services = [],
  activeCategory = 'hospital',
  focusedServiceId = null,
  onCategoryChange,
  onBack,
  onChangeLocation,
}) {
  const center = typeof lat === 'number' && typeof lng === 'number' ? [lat, lng] : [0, 0]
  const [panelOpen, setPanelOpen] = useState(true)
  const [selectedServiceId, setSelectedServiceId] = useState(focusedServiceId)
  const [focusTarget, setFocusTarget] = useState(null)
  const [focusRevision, setFocusRevision] = useState(0)
  const [showCenterPopup, setShowCenterPopup] = useState(false)
  const centerMarkerRef = useRef(null)
  const markerRefs = useRef({})
  const recenterButtonRef = useRef(null)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const recenterMap = () => {
    setSelectedServiceId(null)
    setFocusTarget({ type: 'center', key: null })
    setShowCenterPopup(true)
    setFocusRevision((value) => value + 1)
  }

  useEffect(() => {
    if (!recenterButtonRef.current) return undefined

    L.DomEvent.disableClickPropagation(recenterButtonRef.current)
    L.DomEvent.disableDoubleClickPropagation(recenterButtonRef.current)
    L.DomEvent.disableScrollPropagation(recenterButtonRef.current)

    return undefined
  }, [])

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const filteredServices = useMemo(
    () => services.filter((service) => service.type === activeCategory),
    [services, activeCategory]
  )

  const focusService = (service) => {
    const key = getServiceKey(service)
    setSelectedServiceId(key)
    setShowCenterPopup(false)
    setFocusTarget({ type: 'service', key })
    setFocusRevision((value) => value + 1)
  }

  useEffect(() => {
    setSelectedServiceId(focusedServiceId)
    if (focusedServiceId) {
      setShowCenterPopup(false)
      setFocusTarget({ type: 'service', key: focusedServiceId })
      setFocusRevision((value) => value + 1)
    } else {
      setShowCenterPopup(false)
      setFocusTarget(null)
    }
  }, [focusedServiceId, activeCategory])

  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  return (
    <section className="relative h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-x-0 top-0 z-[500] border-b border-white/15 bg-slate-900/90 px-3 pb-3 pt-3 backdrop-blur md:px-5">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Back
          </button>
          <p className="text-sm font-semibold text-white/80">{filteredServices.length} results</p>
        </div>
      </div>

      <div className="absolute left-3 right-3 top-[74px] z-[420] rounded-2xl border border-white/10 bg-slate-900/85 px-2 py-2 shadow-lg shadow-slate-950/40 backdrop-blur md:left-1/2 md:right-auto md:max-w-[min(720px,calc(100vw-420px))] md:-translate-x-1/2">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => onCategoryChange(category.value)}
              className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                activeCategory === category.value
                  ? 'bg-white text-slate-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={14}
        className="h-full w-full"
        zoomControl={false}
      >
        <MapViewController
          center={center}
          focusRevision={focusRevision}
          focusTarget={focusTarget}
          centerMarkerRef={centerMarkerRef}
          markerRefs={markerRefs}
        />
        {!isMobile && <ZoomControl position="bottomright" />}
        <div
          className="pointer-events-none absolute right-3 z-[460]"
          style={{ bottom: isMobile ? (panelOpen ? 'calc(42vh + 18px)' : '84px') : '7rem' }}
        >
          <button
            type="button"
            ref={recenterButtonRef}
            onClick={recenterMap}
            className="pointer-events-auto inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-slate-900/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 backdrop-blur transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl active:translate-y-0"
          >
            <span aria-hidden="true">⌖</span>
          </button>
        </div>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={center} icon={createMarkerIcon('#2563eb')} ref={centerMarkerRef}>
          {showCenterPopup ? (
            <Popup>
              <div className="space-y-2">
                <div className="font-semibold text-slate-900">You are here</div>
                
              </div>
            </Popup>
          ) : null}
        </Marker>

        {filteredServices.map((service) => {
          const key = getServiceKey(service)
          return (
            <Marker
              key={key}
              position={[service.lat, service.lng]}
              icon={createMarkerIcon(getServiceColor(service.type))}
              ref={(markerRef) => {
                markerRefs.current[key] = markerRef
              }}
              eventHandlers={{
                click: () => focusService(service),
              }}
            >
              <Popup>
                <div className="space-y-2">
                  <div className="font-semibold text-slate-900">{service.name}</div>
                  <div className="text-sm text-slate-600">{formatDistance(service.distance)}</div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Results panel */}
      <div
        className={`absolute bottom-2 left-3 right-3 z-[450] overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl shadow-slate-950/40 transition-[width,height] md:bottom-0 md:left-0 md:right-auto md:top-[108px] md:border-r md:border-t-0`}
        style={
          isMobile
            ? panelOpen
              ? { height: '42vh', width: 'calc(100% - 24px)' }
              : { height: '56px', width: '56px', borderRadius: '9999px', left: 'calc(50% - 28px)', right: 'auto' }
            : { width: panelOpen ? '380px' : '56px', height: 'calc(100% - 108px)' }
        }
      >
        {!panelOpen ? (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="flex h-full w-full cursor-pointer items-center justify-center text-white transition hover:bg-white/5"
            aria-label="Expand results panel"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl font-bold leading-none shadow-lg">
              {isMobile ? '↑' : '→'}
            </span>
          </button>
        ) : (
          <div className="flex h-full min-h-0 flex-col p-3">
            <div className="mb-2 flex items-center justify-between md:pr-4">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">Results panel</p>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="cursor-pointer rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Collapse
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {filteredServices.length ? (
                filteredServices.map((service) => {
                  const key = getServiceKey(service)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => focusService(service)}
                      className={`w-full cursor-pointer rounded-xl border p-3 text-left transition ${
                        selectedServiceId === key
                          ? 'border-blue-400 bg-blue-500/15 ring-1 ring-blue-400/70'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <p className="truncate text-sm font-semibold text-white">{service.name}</p>
                      <p className="mt-1 text-xs text-white/70">{formatDistance(service.distance)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={`tel:${service.phone || ''}`}
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Call
                        </a>
                        <a
                          href={buildMapsLink(service.lat, service.lng)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Directions
                        </a>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 text-center text-sm text-white/70">
                  No results in this category yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .leaflet-bottom.leaflet-right {
            bottom: 0 !important;
            right: 0 !important;
            left: auto !important;
          }

          .leaflet-bottom.leaflet-left {
            bottom: 0 !important;
            left: 0 !important;
            right: auto !important;
          }
        }
      `}</style>
    </section>
  )
}