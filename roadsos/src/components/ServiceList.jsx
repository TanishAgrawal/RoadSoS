import { useMemo, useState } from 'react'
import ServiceCard from './ServiceCard.jsx'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Hospitals', value: 'hospital' },
  { label: 'Police', value: 'police' },
  { label: 'Ambulance', value: 'ambulance' },
  { label: 'Towing', value: 'towing' },
  { label: 'Tyres', value: 'tyres' },
  { label: 'Showrooms', value: 'showroom' },
]

export default function ServiceList({ services = [] }) {
  const [activeFilter, setActiveFilter] = useState('all')

  const filteredServices = useMemo(() => {
    if (activeFilter === 'all') return services
    return services.filter((service) => service.type === activeFilter)
  }, [activeFilter, services])

  return (
    <section className="flex h-full flex-col rounded-t-3xl bg-slate-50 px-4 pb-4 pt-3 md:rounded-none md:px-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Nearby services</h2>
          <p className="text-sm text-slate-500">{services.length} contacts found</p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
          {filteredServices.length} shown
        </div>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeFilter === filter.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {filteredServices.length ? (
          filteredServices.map((service) => <ServiceCard key={`${service.type}-${service.id}`} service={service} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No services match this filter.
          </div>
        )}
      </div>
    </section>
  )
}