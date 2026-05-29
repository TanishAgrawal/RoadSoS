import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

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

export default function Map({
  lat,
  lng,
  services = [],
  activeCategory = 'hospital',
  focusedServiceId = null,
  onCategoryChange,
  onBack,
}) {
  const center = typeof lat === 'number' && typeof lng === 'number' ? [lat, lng] : [0, 0]
  const [mapInstance, setMapInstance] = useState(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const markerRefs = useRef({})

  const filteredServices = useMemo(
    () => services.filter((service) => service.type === activeCategory),
    [services, activeCategory]
  )

  useEffect(() => {
    if (!focusedServiceId || !mapInstance) return
    const focusedService = filteredServices.find((service) => getServiceKey(service) === focusedServiceId)
    if (!focusedService) return

    mapInstance.flyTo([focusedService.lat, focusedService.lng], 15, { duration: 0.6 })
    const marker = markerRefs.current[focusedServiceId]
    marker?.openPopup()
  }, [focusedServiceId, filteredServices, mapInstance])

  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  return (
    <section className="relative h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-x-0 top-0 z-[500] border-b border-white/15 bg-slate-900/90 px-3 pb-3 pt-3 backdrop-blur md:px-5">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Back
          </button>
          <p className="text-sm font-semibold text-white/80">{filteredServices.length} results</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => onCategoryChange(category.value)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${
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
        whenCreated={setMapInstance}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={center} icon={createMarkerIcon('#2563eb')}>
          <Popup>You are here</Popup>
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
            >
              <Popup>
                <div className="space-y-2">
                  <div className="font-semibold text-slate-900">{service.name}</div>
                  <div className="text-sm text-slate-600">{formatDistance(service.distance)}</div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={`tel:${service.phone || ''}`}
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Call
                    </a>
                    <a
                      href={buildMapsLink(service.lat, service.lng)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Directions
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      <div
        className={`absolute bottom-0 left-0 right-0 z-[450] border-t border-white/15 bg-slate-900/90 p-3 backdrop-blur transition-transform md:right-auto md:top-[108px] md:h-[calc(100%-108px)] md:w-[360px] md:border-r md:border-t-0 ${
          panelOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-[86%] md:-translate-x-[92%] md:translate-y-0'
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">Results panel</p>
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
          >
            {panelOpen ? 'Collapse' : 'Expand'}
          </button>
        </div>

        <div className="max-h-[32vh] space-y-2 overflow-y-auto pr-1 md:max-h-full">
          {filteredServices.map((service) => {
            const key = getServiceKey(service)
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (!mapInstance) return
                  mapInstance.flyTo([service.lat, service.lng], 15, { duration: 0.6 })
                  markerRefs.current[key]?.openPopup()
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
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
          })}
        </div>
      </div>
    </section>
  )
}