export function formatDistance(distance) {
	if (typeof distance !== 'number' || Number.isNaN(distance)) return 'Distance unavailable'
	return `${distance.toFixed(1)} km away`
}

export function capitalizeWords(value) {
	if (!value && value !== '') return value
	return String(value || '').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase())
}

export function cleanTel(number) {
	if (!number) return ''
	return String(number).replace(/[^+\d]/g, '')
}