import { useEffect, useState, useRef } from 'react'
import { getDistanceKm } from '../utils/haversine.js'
import { loadServices, saveServices, isCacheClose } from '../services/offlineCache.js'
import {
	fetchNearbyServices,
} from '../services/overpass.js'
import { classifyHospital } from '../services/hospitalTierSystem.js'

function normalizeService(service) {
	if (!service || typeof service !== 'object') return null

	const lat = Number(service.lat)
	const lng = Number(service.lng)
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

	const rawType = typeof service.type === 'string' ? service.type.trim() : ''
	const type = rawType || 'unknown'

	const rawName = typeof service.name === 'string' ? service.name.trim() : ''
	const name = rawName || `Unnamed ${type}`

	const address = typeof service.address === 'string' && service.address.trim() ? service.address.trim() : null
	const phone = typeof service.phone === 'string' && service.phone.trim() ? service.phone.trim() : null

	// normalize multiple phone numbers into an array
	let phones = []
	if (typeof service.phone === 'string' && service.phone.trim()) {
		phones = String(service.phone)
			.split(/[;,\n|/]/)
			.map((p) => p.trim())
			.filter(Boolean)
	}


	const rawId = service.id
	const id = rawId ?? `${type}-${lat.toFixed(5)}-${lng.toFixed(5)}`

	return {
		id,
		name,
		address,
		lat,
		lng,
		type,
		phone,
		phones,
		// preserve optional hospital metadata if present (from Overpass)
		emergency: service.emergency ?? null,
		beds: typeof service.beds === 'number' ? service.beds : service.beds ? Number(service.beds) : null,
		specialities: Array.isArray(service.specialities) ? service.specialities : (service.specialities ? String(service.specialities).split(/[,;|]/).map(s=>s.trim()).filter(Boolean) : []),
	}
}

function normalizeServices(services) {
	if (!Array.isArray(services)) return []

	return services.map(normalizeService).filter(Boolean)
}

function addDistances(services, lat, lng) {
	return services
		.map((service) => ({
			...service,
			distance: getDistanceKm(lat, lng, service.lat, service.lng),
		}))
		.sort((left, right) => left.distance - right.distance)
}

function mergeServices(cachedServices, liveServices) {
	const byKey = new Map()

	for (const service of cachedServices || []) {
		const key = `${service.type}-${service.id}`
		byKey.set(key, service)
	}

	for (const service of liveServices || []) {
		const key = `${service.type}-${service.id}`
		const previous = byKey.get(key)

		// Fresh API data wins; only fill optional fields from cache if missing.
		byKey.set(key, {
			...previous,
			...service,
			address: service.address || previous?.address || null,
			phone: service.phone || previous?.phone || null,
		})
	}

	return [...byKey.values()]
}

const CACHE_REFRESH_INTERVAL_MS = 30 * 60 * 1000

export default function useNearbyServices({ lat, lng, reloadToken } = {}) {
	const [services, setServices] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const fetchingRef = useRef(false)

	useEffect(() => {
		let cancelled = false
		let refreshTimerId = null

		if (typeof lat !== 'number' || typeof lng !== 'number') {
			return undefined
		}

		const syncServices = async ({ forceFetch = false, silent = false } = {}) => {
			const cachedServices = normalizeServices(loadServices(lat, lng))

			// If cached services exist and their origin is within 1km of the current
			// location, skip the live Overpass fetch unless a background refresh forces it.
			if (!forceFetch && cachedServices.length && isCacheClose(lat, lng, 1)) {
				setServices(addDistances(cachedServices, lat, lng))
				setError(null)
				setLoading(false)
				return
			}

			if (cachedServices.length) {
				setServices(addDistances(cachedServices, lat, lng))
			} else {
				setServices([])
			}

			setError(null)

			// If a fetch is already in progress, skip starting another one.
			if (fetchingRef.current) {
				return
			}

			if (!silent) {
				setLoading(true)
			}

			fetchingRef.current = true

			try {
				const fetchedServices = normalizeServices(await fetchNearbyServices(lat, lng))
				if (cancelled) return

				const mergedServices = mergeServices(cachedServices, fetchedServices)
				// classify hospitals so `tier` is available for all hospital services
				const classified = mergedServices.map((s) => (s.type === 'hospital' ? classifyHospital(s) : s))
				const enrichedServices = addDistances(classified, lat, lng)
				setServices(enrichedServices)
				saveServices(enrichedServices, { lat, lng })
			} catch (err) {
				if (cancelled) return
				// If we have cached services, keep using them and don't surface an error.
				// Only set an error when there is no cached data to fall back to.
				if (cachedServices.length) {
					console.warn('[useNearbyServices] fetch failed — using cached services', err)
					setError(null)
				} else {
					setError('No Data Available')
					console.warn('[useNearbyServices] fetch failed and no cache available', err)
				}
			} finally {
				fetchingRef.current = false
				if (!cancelled && !silent) setLoading(false)
			}
		}

		void syncServices()

		if (typeof window !== 'undefined') {
			refreshTimerId = window.setInterval(() => {
				if (cancelled) return
				if (typeof document !== 'undefined' && document.hidden) return
				if (typeof navigator !== 'undefined' && navigator.onLine === false) return
				void syncServices({ forceFetch: true, silent: true })
			}, CACHE_REFRESH_INTERVAL_MS)

			const handleResume = () => {
				if (cancelled) return
				if (typeof navigator !== 'undefined' && navigator.onLine === false) return
				void syncServices({ forceFetch: true, silent: true })
			}

			window.addEventListener('focus', handleResume)
			window.addEventListener('online', handleResume)
			document.addEventListener('visibilitychange', handleResume)

			return () => {
				cancelled = true
				if (refreshTimerId !== null) {
					window.clearInterval(refreshTimerId)
				}
				window.removeEventListener('focus', handleResume)
				window.removeEventListener('online', handleResume)
				document.removeEventListener('visibilitychange', handleResume)
			}
		}

		return () => {
			cancelled = true
		}
	}, [lat, lng, reloadToken])

	return { services, loading, error }
}
