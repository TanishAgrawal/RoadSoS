const OVERPASS_ENDPOINT = '/overpass/api-de/api/interpreter'
const OVERPASS_TIMEOUT_MS = 45000
const SEARCH_RADIUS_METERS = 10000

const inFlightQueries = new Map()

const SERVICE_QUERY_CONFIG = [
	{ type: 'hospital', lines: [
		`  node["amenity"="hospital"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["amenity"="hospital"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  node["amenity"="clinic"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["amenity"="clinic"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
	] },
	{ type: 'police', lines: [
		`  node["amenity"="police"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["amenity"="police"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
	] },
	{ type: 'ambulance', lines: [
		`  node["emergency"="ambulance_station"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["emergency"="ambulance_station"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
	] },
	{ type: 'fire', lines: [
		`  node["amenity"="fire_station"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["amenity"="fire_station"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  node["emergency"="fire"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["emergency"="fire"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  node["emergency"="fire_station"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["emergency"="fire_station"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
	] },
	{ type: 'towing', lines: [
		`  node["emergency"="tow"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["emergency"="tow"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  node["service"="tow"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["service"="tow"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  node["amenity"="vehicle_inspection"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["amenity"="vehicle_inspection"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  node["shop"="car_repair"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["shop"="car_repair"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
	] },
	{ type: 'tyres', lines: [
		`  node["shop"="tyres"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["shop"="tyres"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  node["shop"="car_repair"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["shop"="car_repair"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
	] },
	{ type: 'showroom', lines: [
		`  node["shop"="car"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
		`  way["shop"="car"](around:${SEARCH_RADIUS_METERS},LAT,LNG);`,
	] },
]

function formatAddress(tags) {
	if (!tags || typeof tags !== 'object') return null

	if (typeof tags['addr:full'] === 'string' && tags['addr:full'].trim()) {
		return tags['addr:full'].trim()
	}

	const streetLine = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ').trim()
	const locality = [
		tags['addr:suburb'],
		tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
		tags['addr:district'],
		tags['addr:state'],
		tags['addr:postcode'],
	]
		.filter(Boolean)
		.join(', ')
		.trim()

	const composed = [streetLine, locality].filter(Boolean).join(', ').trim()
	if (composed) return composed

	if (typeof tags['addr:place'] === 'string' && tags['addr:place'].trim()) {
		return tags['addr:place'].trim()
	}

	const contactLine = [tags['contact:street'], tags['contact:city'], tags['contact:postcode']]
		.filter(Boolean)
		.join(', ')
		.trim()
	if (contactLine) return contactLine

	if (typeof tags['is_in'] === 'string' && tags['is_in'].trim()) {
		return tags['is_in'].trim()
	}

	return null
}

function buildQuery(lines) {
	return `[out:json][timeout:25];\n(\n${lines.join('\n')}\n);\nout tags center;`
}

function buildElementQuery(tagKey, tagValue, lat, lng) {
	return [
		`  node["${tagKey}"="${tagValue}"](around:${SEARCH_RADIUS_METERS},${lat},${lng});`,
		`  way["${tagKey}"="${tagValue}"](around:${SEARCH_RADIUS_METERS},${lat},${lng});`,
	]
}

function determineServiceType(tags) {
	if (!tags || typeof tags !== 'object') return null

	if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'hospital'
	if (tags.amenity === 'police') return 'police'
	if (tags.emergency === 'ambulance_station') return 'ambulance'
	if (tags.amenity === 'fire_station' || tags.emergency === 'fire' || tags.emergency === 'fire_station') return 'fire'
	if (tags.emergency === 'tow' || tags.service === 'tow' || tags.amenity === 'vehicle_inspection' || tags.shop === 'car_repair') return 'towing'
	if (tags.shop === 'tyres') return 'tyres'
	if (tags.shop === 'car') return 'showroom'
	return null
}

function normalizeElement(element, fallbackType) {
	const tags = element.tags ?? {}
	const center = element.center ?? element
	const elementLat = typeof center.lat === 'number' ? center.lat : null
	const elementLng =
		typeof center.lon === 'number'
			? center.lon
			: typeof center.lng === 'number'
				? center.lng
				: null

	if (elementLat === null || elementLng === null) return null

	const resolvedFallbackType = typeof fallbackType === 'function' ? fallbackType(element, tags) : fallbackType
	const detectedType = determineServiceType(tags) ?? resolvedFallbackType
	if (!detectedType) return null

	return {
		id: element.id,
		name: tags.name ?? `Unnamed ${detectedType}`,
		address: formatAddress(tags),
		lat: elementLat,
		lng: elementLng,
		type: detectedType,
		phone: tags.phone ?? tags['contact:phone'] ?? null,
		emergency: tags.emergency ?? null,
		beds: typeof tags.beds === 'string' && tags.beds.trim() ? parseInt(tags.beds, 10) : typeof tags.beds === 'number' ? tags.beds : null,
		specialities: (function () {
			const raw = tags['healthcare:speciality'] || tags['healthcare:speciality:en'] || tags.speciality || null
			if (!raw) return []
			return String(raw)
				.split(/[;,|]/)
				.map((s) => s.trim())
				.filter(Boolean)
		})(),
	}
}

async function queryOverpass(lines, type) {
	const q = buildQuery(lines)
	const cacheKey = `${type}:${q}`

	if (inFlightQueries.has(cacheKey)) {
		return inFlightQueries.get(cacheKey)
	}

	const requestPromise = (async () => {
		const controller = new AbortController()
		const timeoutId = setTimeout(
			() => controller.abort(new DOMException('Overpass request timed out', 'TimeoutError')),
			OVERPASS_TIMEOUT_MS
		)

		try {
			console.debug('[overpass] querying', OVERPASS_ENDPOINT)

			const response = await fetch(OVERPASS_ENDPOINT, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
					Accept: 'application/json',
				},
				body: new URLSearchParams({ data: q }),
				signal: controller.signal,
			})

			if (!response.ok) {
				console.warn(`[overpass] endpoint ${OVERPASS_ENDPOINT} returned ${response.status}`)
				return []
			}

			const payload = await response.json()
			const elements = Array.isArray(payload?.elements) ? payload.elements : []

			console.debug(`[overpass] ${OVERPASS_ENDPOINT} returned ${elements.length} elements for type=${type}`)

			return elements.map((element) => normalizeElement(element, type)).filter(Boolean)
		} catch (err) {
			if (err?.name === 'AbortError' || err?.name === 'TimeoutError' || controller.signal.aborted) {
				return []
			}
			console.warn('[overpass] request failed for endpoint', OVERPASS_ENDPOINT, err && err.message ? err.message : err)
			return []
		} finally {
			clearTimeout(timeoutId)
		}
	})()

	inFlightQueries.set(cacheKey, requestPromise)

	try {
		return await requestPromise
	} finally {
		if (inFlightQueries.get(cacheKey) === requestPromise) {
			inFlightQueries.delete(cacheKey)
		}
	}
}

export async function fetchNearbyServices(lat, lng) {
	const rLat = typeof lat === 'number' ? Number(lat).toFixed(5) : String(lat)
	const rLng = typeof lng === 'number' ? Number(lng).toFixed(5) : String(lng)

	return queryOverpass(
		SERVICE_QUERY_CONFIG.flatMap((config) =>
			config.lines.map((line) => line.replace(/LAT/g, rLat).replace(/LNG/g, rLng))
		),
		(element) => determineServiceType(element.tags)
	)
}

export function fetchHospitals(lat, lng) {
	return queryOverpass(
		[
			...buildElementQuery('amenity', 'hospital', lat, lng),
			...buildElementQuery('amenity', 'clinic', lat, lng),
		],
		'hospital',
		lat,
		lng
	)
}

export function fetchPoliceStations(lat, lng) {
	return queryOverpass(buildElementQuery('amenity', 'police', lat, lng), 'police', lat, lng)
}

export function fetchAmbulanceStations(lat, lng) {
	return queryOverpass(
		buildElementQuery('emergency', 'ambulance_station', lat, lng),
		'ambulance',
		lat,
		lng
	)
}

export function fetchFireStations(lat, lng) {
	return queryOverpass(
		[
			...buildElementQuery('amenity', 'fire_station', lat, lng),
			...buildElementQuery('emergency', 'fire', lat, lng),
			...buildElementQuery('emergency', 'fire_station', lat, lng),
		],
		'fire',
		lat,
		lng
	)
}

export async function fetchTowingServices(lat, lng) {
	const services = await queryOverpass(
		[
			...buildElementQuery('emergency', 'tow', lat, lng),
			...buildElementQuery('service', 'tow', lat, lng),
			...buildElementQuery('amenity', 'vehicle_inspection', lat, lng),
			...buildElementQuery('shop', 'car_repair', lat, lng),
		],
		'towing',
		lat,
		lng
	)

	const towingNamedServices = services.filter((service) => /tow|towing|roadside|breakdown|recovery/i.test(service.name))

	// Prefer explicit towing matches, but keep fallback services so category is not empty.
	return towingNamedServices.length > 0 ? towingNamedServices : services
}

export function fetchPunctureShops(lat, lng) {
	return queryOverpass(
		[
			...buildElementQuery('shop', 'tyres', lat, lng),
			...buildElementQuery('shop', 'car_repair', lat, lng),
		],
		'tyres',
		lat,
		lng
	)
}

export function fetchCarShowrooms(lat, lng) {
	return queryOverpass(buildElementQuery('shop', 'car', lat, lng), 'showroom', lat, lng)
}
