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
	const [loading, setLoading] = useState(typeof lat === 'number' && typeof lng === 'number')
	const [error, setError] = useState(null)
	const [source, setSource] = useState('live')

	useEffect(() => {
		let cancelled = false

		if (typeof lat !== 'number' || typeof lng !== 'number') {
			return undefined
		}

		const cachedServices = loadServices()

		void (async () => {
			if (cachedServices?.length) {
				setServices(cachedServices)
				setLoading(false)
				setSource('cached')
			} else {
				setLoading(true)
				setSource('live')
			}

			setError(null)

			try {
				const fetchedServices = await fetchAllServices(lat, lng)
				if (cancelled) return

				const enrichedServices = addDistances(fetchedServices, lat, lng)
				setServices(enrichedServices)
				setLoading(false)
				setSource('live')
				saveServices(enrichedServices)
			} catch {
				if (cancelled) return

				if (!cachedServices?.length) {
					setError('Unable to load nearby services.')
					setLoading(false)
				}
			}
		})()

		return () => {
			cancelled = true
		}
	}, [lat, lng])

	return { services, loading, error, source }
}
