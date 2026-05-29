import { useEffect, useState } from 'react'
import { getDistanceKm } from '../utils/haversine.js'
import { loadServices, saveServices } from '../services/offlineCache.js'
import {
	fetchAmbulanceStations,
	fetchCarShowrooms,
	fetchHospitals,
	fetchPoliceStations,
	fetchPunctureShops,
	fetchTowingServices,
} from '../services/overpass.js'

function addDistances(services, lat, lng) {
	return services
		.map((service) => ({
			...service,
			distance: getDistanceKm(lat, lng, service.lat, service.lng),
		}))
		.sort((left, right) => left.distance - right.distance)
}

function dedupeServices(services) {
	const seen = new Set()
	return services.filter((service) => {
		const key = `${service.type}-${service.id}`
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})
}

function mergeServices(cachedServices, liveServices) {
	return dedupeServices([...(cachedServices || []), ...(liveServices || [])])
}

async function fetchAllServices(lat, lng) {
	const results = await Promise.all([
		fetchHospitals(lat, lng),
		fetchPoliceStations(lat, lng),
		fetchAmbulanceStations(lat, lng),
		fetchTowingServices(lat, lng),
		fetchPunctureShops(lat, lng),
		fetchCarShowrooms(lat, lng),
	])

	return results.flat()
}

export default function useNearbyServices({ lat, lng } = {}) {
	const [services, setServices] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)

	useEffect(() => {
		let cancelled = false

		if (typeof lat !== 'number' || typeof lng !== 'number') {
			return undefined
		}

		const cachedServices = loadServices(lat, lng)

		void (async () => {
			if (cachedServices?.length) {
				setServices(addDistances(cachedServices, lat, lng))
			} else {
				setServices([])
			}

			setError(null)
			setLoading(true)

			try {
				const fetchedServices = await fetchAllServices(lat, lng)
				if (cancelled) return

				const mergedServices = mergeServices(cachedServices, fetchedServices)
				const enrichedServices = addDistances(mergedServices, lat, lng)
				setServices(enrichedServices)
				saveServices(enrichedServices, { lat, lng })
			} catch (err) {
				if (cancelled) return
				setError('Unable to load nearby services from Overpass.')
				// log for debugging
				console.warn('[useNearbyServices] fetch failed', err)
			} finally {
				if (!cancelled) setLoading(false)
			}
		})()

		return () => {
			cancelled = true
		}
	}, [lat, lng])

	return { services, loading, error }
}
