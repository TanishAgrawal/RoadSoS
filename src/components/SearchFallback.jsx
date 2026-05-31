import { useState } from 'react'

export default function SearchFallback({ onLocationFound, onUseGPS }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resolvedPlace, setResolvedPlace] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    setLoading(true)
    setError(null)

    try {
      const searchUrl = `https://nominatim/search?q=${encodeURIComponent(trimmedQuery)}&format=json&addressdetails=1&limit=1`
      const response = await fetch(
        searchUrl,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Location search failed.')
      }

      const results = await response.json()
      const firstResult = Array.isArray(results) ? results[0] : null

      if (!firstResult) {
        throw new Error('No matching location found.')
      }

      const resolvedLocation = {
        lat: Number(firstResult.lat),
        lng: Number(firstResult.lon),
        placeName: firstResult.display_name || trimmedQuery,
        countryCode: firstResult.address?.country_code || null,
      }

      setResolvedPlace(resolvedLocation.placeName)
      onLocationFound(resolvedLocation)
    } catch (submissionError) {
      setError(submissionError.message || 'Unable to find that location.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_45%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl shadow-slate-200/70">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Location needed</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Enter your city or area</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          GPS access is unavailable. Search manually so ROADSoS can locate nearby emergency services.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="text"
            placeholder="Enter your city or area"
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Searching...' : 'Find services'}
          </button>
          <button
            type="button"
            onClick={() => onUseGPS?.()}
            className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Use GPS
          </button>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
        {resolvedPlace ? (
          <p className="mt-3 text-sm font-semibold text-emerald-700">
            Resolved location: {resolvedPlace}
          </p>
        ) : null}
      </form>
    </div>
  )
}