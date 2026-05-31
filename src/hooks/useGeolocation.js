import { useEffect, useState } from 'react'

function pickDetectedPlaceName(address = {}) {
	return (
		address.road ||
		address.pedestrian ||
		address.footway ||
		address.path ||
		address.locality ||
		address.neighbourhood ||
		address.suburb ||
		address.city_district ||
		address.district ||
		address.town ||
		address.village ||
		address.city ||
		address.municipality ||
		address.county ||
		null
	)
}

async function snapToNearestRoad(lat, lng, signal) {
	const response = await fetch(`/osrm/nearest/v1/driving/${lng},${lat}?number=1`, {
		signal,
		headers: {
			Accept: 'application/json',
		},
	})

	if (!response.ok) return null

	const payload = await response.json()
	const waypoint = Array.isArray(payload?.waypoints) ? payload.waypoints[0] : null
	const location = Array.isArray(waypoint?.location) ? waypoint.location : null

	if (!location || location.length < 2) return null

	return {
		lat: Number(location[1]),
		lng: Number(location[0]),
		roadName: typeof waypoint?.name === 'string' && waypoint.name.trim() ? waypoint.name.trim() : null,
	}
}

async function reverseGeocodeLocation(lat, lng, signal) {
	const response = await fetch(
		`/nominatim/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
		{
			signal,
			headers: {
				Accept: 'application/json',
			},
		}
	)

	if (!response.ok) return null

	const payload = await response.json()
	return payload
}

export default function useGeolocation() {
	const [lat, setLat] = useState(null)
	const [lng, setLng] = useState(null)
	const [countryCode, setCountryCode] = useState(null)
	const [placeName, setPlaceName] = useState(null)
	const supportsGeolocation = typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
	const [error, setError] = useState(
		supportsGeolocation ? null : 'Geolocation is not supported by this browser.'
	)
	const [loading, setLoading] = useState(supportsGeolocation)
	const [refreshIndex, setRefreshIndex] = useState(0)

	useEffect(() => {
		let cancelled = false
		const controller = new AbortController()

		if (!supportsGeolocation) {
			return undefined
		}

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				if (cancelled) return

				const rawLat = position.coords.latitude
				const rawLng = position.coords.longitude
				let nextLat = rawLat
				let nextLng = rawLng
				let snappedRoadName = null

				try {
					const snappedLocation = await snapToNearestRoad(rawLat, rawLng, controller.signal)
					if (snappedLocation) {
						nextLat = snappedLocation.lat
						nextLng = snappedLocation.lng
						snappedRoadName = snappedLocation.roadName
					}
				} catch {
					// Snapping is best-effort; continue with raw coordinates.
				}

				setLat(nextLat)
				setLng(nextLng)
				setError(null)

				try {
					const detectedLocation = await reverseGeocodeLocation(nextLat, nextLng, controller.signal)
					if (!cancelled && detectedLocation) {
						const detectedCountryCode = detectedLocation.address?.country_code ?? detectedLocation?.country_code ?? null
						const detectedPlaceName = pickDetectedPlaceName(detectedLocation.address)

						if (detectedCountryCode) {
							setCountryCode(String(detectedCountryCode).toLowerCase())
						}

						if (detectedPlaceName) {
							setPlaceName(detectedPlaceName)
						} else if (snappedRoadName) {
							setPlaceName(snappedRoadName)
						}
					} else if (!cancelled && snappedRoadName) {
						setPlaceName(snappedRoadName)
					}
				} catch {
					// Country lookup is best-effort; keep location usable if it fails.
					if (!cancelled && snappedRoadName) {
						setPlaceName(snappedRoadName)
					}
				} finally {
					if (!cancelled) setLoading(false)
				}
			},
			(positionError) => {
				if (cancelled) return

				setError(positionError.message || 'Unable to access your location.')
				setLoading(false)
			},
			{
				enableHighAccuracy: true,
				timeout: 15000,
				maximumAge: 60000,
			}
		)

		return () => {
			cancelled = true
			controller.abort()
		}
	}, [supportsGeolocation, refreshIndex])

	// Expose a refresh function to re-request the location (used by UI retry)
	function refresh() {
		setError(null)
		setLoading(true)
		setRefreshIndex((i) => i + 1)
	}

	return { lat, lng, countryCode, placeName, error, loading, refresh }
}
