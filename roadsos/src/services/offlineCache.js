const SERVICES_KEY = 'roadsos_cache'
const LOCATION_KEY = 'roadsos_last_location'
const CACHE_TTL_MS = 60 * 60 * 1000

function now() {
	return Date.now()
}

function safeJsonParse(value) {
	try {
		return JSON.parse(value)
	} catch {
		return null
	}
}

export function saveServices(data) {
	if (typeof localStorage === 'undefined') return

	localStorage.setItem(
		SERVICES_KEY,
		JSON.stringify({ timestamp: now(), data })
	)
}

export function loadServices() {
	if (typeof localStorage === 'undefined') return null

	const rawValue = localStorage.getItem(SERVICES_KEY)
	if (!rawValue) return null

	const parsedValue = safeJsonParse(rawValue)
	if (!parsedValue || typeof parsedValue.timestamp !== 'number') return null

	if (now() - parsedValue.timestamp > CACHE_TTL_MS) return null

	return Array.isArray(parsedValue.data) ? parsedValue.data : null
}

export function saveLocation(lat, lng) {
	if (typeof localStorage === 'undefined') return

	localStorage.setItem(LOCATION_KEY, JSON.stringify({ lat, lng, timestamp: now() }))
}

export function loadLocation() {
	if (typeof localStorage === 'undefined') return null

	const rawValue = localStorage.getItem(LOCATION_KEY)
	if (!rawValue) return null

	const parsedValue = safeJsonParse(rawValue)
	if (!parsedValue || typeof parsedValue.lat !== 'number' || typeof parsedValue.lng !== 'number') {
		return null
	}

	return { lat: parsedValue.lat, lng: parsedValue.lng }
}
