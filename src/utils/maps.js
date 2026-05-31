export function buildGoogleMapsSearchUrl(service, fallbackLabel = 'emergency service') {
	const query = [service?.name, service?.address].filter(Boolean).join(', ')
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || service?.name || fallbackLabel)}`
}