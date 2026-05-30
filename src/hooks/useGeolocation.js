import { useEffect, useState } from 'react'

function pickDetectedPlaceName(address = {}) {
	return (
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

async function reverseGeocodeLocation(lat, lng, signal) {
	const response = await fetch(
		`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
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

				const nextLat = position.coords.latitude
				const nextLng = position.coords.longitude

				setLat(nextLat)
				setLng(nextLng)

				try {
					const detectedLocation = await reverseGeocodeLocation(nextLat, nextLng, controller.signal)
					if (!cancelled && detectedLocation) {
						const detectedCountryCode = detectedLocation.address?.country_code ?? null
						const detectedPlaceName = pickDetectedPlaceName(detectedLocation.address)

						if (detectedCountryCode) {
							setCountryCode(detectedCountryCode)
						}

						if (detectedPlaceName) {
							setPlaceName(detectedPlaceName)
						}
					}
				} catch {
					// Country lookup is best-effort; keep location usable if it fails.
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
		setLoading(true)
		setRefreshIndex((i) => i + 1)
	}

	return { lat, lng, countryCode, placeName, error, loading, refresh }
}
