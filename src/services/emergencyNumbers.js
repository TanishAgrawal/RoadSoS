const EMERGENCY_NUMBERS = {
	in: '112',
	us: '911',
	gb: '999',
	au: '000',
	de: '112',
	fr: '112',
	za: '10111',
	ng: '199',
}

export function getEmergencyNumber(countryCode) {
	if (!countryCode) return '112'

	const normalizedCode = String(countryCode).trim().toLowerCase()
	return EMERGENCY_NUMBERS[normalizedCode] ?? '112'
}
