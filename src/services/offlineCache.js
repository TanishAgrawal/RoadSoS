import { getDistanceKm } from '../utils/haversine.js'

const SERVICES_KEY = 'roadsos_cache'
const LOCATION_KEY = 'roadsos_last_location'
const CACHE_TTL_MS = 4 * 60 * 60 * 1000
const CACHE_LOAD_RADIUS_KM = 100
const CACHE_PRUNE_RADIUS_KM = 100

function now() {
	return Date.now()
}

function clearServicesCache() {
	if (typeof localStorage === 'undefined') return

	localStorage.removeItem(SERVICES_KEY)
}

function isValidOrigin(origin) {
	return origin && typeof origin.lat === 'number' && typeof origin.lng === 'number'
}

function safeJsonParse(value) {
	try {
		return JSON.parse(value)
	} catch {
		return null
	}
}

export function saveServices(data, origin) {
	if (typeof localStorage === 'undefined') return

	localStorage.setItem(
		SERVICES_KEY,
		JSON.stringify({ timestamp: now(), origin: isValidOrigin(origin) ? origin : null, data })
	)
}

export function loadServices(lat, lng) {
	if (typeof localStorage === 'undefined') return null
	if (typeof lat !== 'number' || typeof lng !== 'number') return null

	const rawValue = localStorage.getItem(SERVICES_KEY)
	if (!rawValue) return null

	const parsedValue = safeJsonParse(rawValue)
	if (!parsedValue || typeof parsedValue.timestamp !== 'number') {
		clearServicesCache()
		return null
	}

	if (now() - parsedValue.timestamp > CACHE_TTL_MS) {
		clearServicesCache()
		return null
	}

	const cacheOrigin = isValidOrigin(parsedValue.origin) ? parsedValue.origin : loadLocation()
	if (!isValidOrigin(cacheOrigin)) {
		return Array.isArray(parsedValue.data) ? parsedValue.data : null
	}

	const distanceFromOrigin = getDistanceKm(lat, lng, cacheOrigin.lat, cacheOrigin.lng)

	if (distanceFromOrigin > CACHE_PRUNE_RADIUS_KM) {
		clearServicesCache()
		return null
	}

	if (distanceFromOrigin > CACHE_LOAD_RADIUS_KM) return null

	return Array.isArray(parsedValue.data) ? parsedValue.data : null
}

export function isCacheClose(lat, lng, thresholdKm = 1) {
	if (typeof localStorage === 'undefined') return false
	if (typeof lat !== 'number' || typeof lng !== 'number') return false

	const rawValue = localStorage.getItem(SERVICES_KEY)
	if (!rawValue) return false

	const parsedValue = safeJsonParse(rawValue)
	if (!parsedValue || typeof parsedValue.timestamp !== 'number') {
		clearServicesCache()
		return false
	}

	if (now() - parsedValue.timestamp > CACHE_TTL_MS) {
		clearServicesCache()
		return false
	}

	const cacheOrigin = isValidOrigin(parsedValue.origin) ? parsedValue.origin : loadLocation()
	if (!isValidOrigin(cacheOrigin)) return false

	const distanceFromOrigin = getDistanceKm(lat, lng, cacheOrigin.lat, cacheOrigin.lng)

	if (distanceFromOrigin > CACHE_PRUNE_RADIUS_KM) {
		clearServicesCache()
		return false
	}

	return distanceFromOrigin <= thresholdKm
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
