const OVERPASS_ENDPOINTS = [
	'https://overpass.openstreetmap.fr/api/interpreter',
	'https://overpass-api.de/api/interpreter',
	'https://lz4.overpass-api.de/api/interpreter',
	'https://overpass.kumi.systems/api/interpreter',
]
const SEARCH_RADIUS_METERS = 10000

function buildQuery(lines) {
	return `[out:json][timeout:25];\n(\n${lines.join('\n')}\n);\nout center;`
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
						lat: elementLat,
						lng: elementLng,
						type,
						phone: tags.phone ?? tags['contact:phone'] ?? null,
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

export async function fetchTowingServices(lat, lng) {
	const services = await queryOverpass(
		[
			...buildElementQuery('amenity', 'vehicle_inspection', lat, lng),
			...buildElementQuery('shop', 'car_repair', lat, lng),
		],
		'towing',
		lat,
		lng
	)

	return services.filter((service) => /tow/i.test(service.name))
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
