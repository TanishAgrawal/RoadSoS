import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

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

export default function Map({ lat, lng, services = [] }) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  const center = [lat, lng]

  return (
    <MapContainer center={center} zoom={14} className="h-full w-full min-h-[320px]">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={center} icon={createMarkerIcon('#2563eb')}>
        <Popup>You are here</Popup>
      </Marker>

      {services.map((service) => (
        <Marker key={`${service.type}-${service.id}`} position={[service.lat, service.lng]} icon={createMarkerIcon(getServiceColor(service.type))}>
          <Popup>
            <div className="space-y-2">
              <div className="font-semibold text-slate-900">{service.name}</div>
              <div className="text-sm text-slate-600">{formatDistance(service.distance)}</div>
              {service.phone ? <div className="text-sm text-slate-600">{service.phone}</div> : null}
              <div className="flex flex-wrap gap-2 pt-1">
                {service.phone ? (
                  <a
                    href={`tel:${service.phone}`}
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Call
                  </a>
                ) : null}
                <a
                  href={buildMapsLink(service.lat, service.lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Navigate
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}