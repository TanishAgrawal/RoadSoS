const EARTH_RADIUS_KM = 6371

export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRadians = (value) => (value * Math.PI) / 180

  const deltaLat = toRadians(lat2 - lat1)
  const deltaLng = toRadians(lng2 - lng1)
  const startLat = toRadians(lat1)
  const endLat = toRadians(lat2)

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}