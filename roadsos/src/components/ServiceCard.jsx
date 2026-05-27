function getServiceIcon(type) {
  if (type === 'hospital') return '🏥'
  if (type === 'police') return '🚓'
  if (type === 'ambulance') return '🚑'
  if (type === 'towing') return '🔧'
  if (type === 'tyres') return '🛞'
  if (type === 'showroom') return '🚗'
  return '📍'
}

function formatDistance(distance) {
  if (typeof distance !== 'number' || Number.isNaN(distance)) return 'Distance unavailable'
  return `${distance.toFixed(1)} km away`
}

function buildMapsLink(lat, lng) {
  return `https://maps.google.com/?q=${lat},${lng}`
}

export default function ServiceCard({ service }) {
  const hasPhone = Boolean(service.phone)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl">
          {getServiceIcon(service.type)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-900">{service.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{formatDistance(service.distance)}</p>
            </div>
          </div>

          {service.phone ? <p className="mt-2 text-sm text-slate-600">{service.phone}</p> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={hasPhone ? `tel:${service.phone}` : undefined}
              aria-disabled={!hasPhone}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                hasPhone
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'cursor-not-allowed bg-slate-200 text-slate-400'
              }`}
              onClick={(event) => {
                if (!hasPhone) event.preventDefault()
              }}
            >
              📞 Call
            </a>

            <a
              href={buildMapsLink(service.lat, service.lng)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              🗺 Navigate
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}