const OVERPASS_ENDPOINTS = [
	'https://overpass.openstreetmap.fr/api/interpreter',
	'https://overpass-api.de/api/interpreter',
	'https://lz4.overpass-api.de/api/interpreter',
	'https://overpass.kumi.systems/api/interpreter',
]
const SEARCH_RADIUS_METERS = 10000

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

async function queryOverpass(lines, type) {
	const q = buildQuery(lines)

	for (const endpoint of OVERPASS_ENDPOINTS) {
		try {
			console.debug('[overpass] querying', endpoint)

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
					Accept: 'application/json',
				},
				body: new URLSearchParams({ data: q }),
			})

			if (!response.ok) {
				console.warn(`[overpass] endpoint ${endpoint} returned ${response.status}`)
				continue
			}

			const payload = await response.json()
			const elements = Array.isArray(payload?.elements) ? payload.elements : []

			console.debug(`[overpass] ${endpoint} returned ${elements.length} elements for type=${type}`)

			const normalized = elements
				.map((element) => {
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

					return {
						id: element.id,
						name: tags.name ?? `Unnamed ${type}`,
						address: formatAddress(tags),
						lat: elementLat,
						lng: elementLng,
						type,
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
				})
				.filter(Boolean)

			// if we got results, return them; otherwise try next endpoint
			if (normalized.length > 0) return normalized
		} catch (err) {
			console.warn('[overpass] request failed for endpoint', endpoint, err && err.message ? err.message : err)
			// try next endpoint
		}
	}

	// none returned results; return empty array
	return []
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
