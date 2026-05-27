import { useEffect, useState } from 'react'

async function reverseGeocodeCountry(lat, lng, signal) {
	const response = await fetch(
		`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
		{
			signal,
			headers: {
				Accept: 'application/json',
			},
		}
	)

	if (!response.ok) return null

	const payload = await response.json()
	return payload?.address?.country_code ?? null
}

export default function useGeolocation() {
	const [lat, setLat] = useState(null)
	const [lng, setLng] = useState(null)
	const [countryCode, setCountryCode] = useState(null)
	const supportsGeolocation = typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
	const [error, setError] = useState(
		supportsGeolocation ? null : 'Geolocation is not supported by this browser.'
	)
	const [loading, setLoading] = useState(supportsGeolocation)

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
					const detectedCountryCode = await reverseGeocodeCountry(nextLat, nextLng, controller.signal)
					if (!cancelled && detectedCountryCode) {
						setCountryCode(detectedCountryCode)
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
	}, [supportsGeolocation])

	return { lat, lng, countryCode, error, loading }
}
