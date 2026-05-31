import { classifyHospital } from './hospitalTierSystem'
import { getDistanceKm } from '../utils/haversine'

function normalizeSeverity(s) {
  return typeof s === 'string' ? s.trim().toLowerCase() : s
}

export function matchHospitalsForTriage(hospitals = [], triage = {}, userLocation = null) {
  const severity = normalizeSeverity(triage.severity)
  const injuries = Array.isArray(triage.injuryTypes) ? triage.injuryTypes.map((i) => i.toLowerCase()) : []

  const classified = hospitals.map((h) => classifyHospital(h))

  // determine allowed tiers based on rules
  let allowed = [1, 2, 3]

  if (severity === 'severe') {
    const severeOnlyInjuries = ['burns', 'spinal injury', 'head/brain injury', 'head', 'spinal']
    const hasSevereOnly = injuries.some((inj) => severeOnlyInjuries.some((s) => inj.includes(s)))
    allowed = hasSevereOnly ? [1] : [1, 2]
  } else if (severity === 'moderate') {
    allowed = [1, 2]
  } else if (severity === 'minor') {
    allowed = [2, 3]
  }

  // compute distance (km) if not present and userLocation provided
  const withDistance = classified.map((h) => {
    let distanceKm = null
    if (typeof h.distance === 'number') distanceKm = h.distance
    else if (userLocation && typeof h.lat === 'number' && typeof h.lng === 'number') {
      distanceKm = getDistanceKm(userLocation.lat, userLocation.lng, h.lat, h.lng)
    }
    return { ...h, distanceKm, distance: distanceKm }
  })

  // filter by allowed tiers
  let filtered = withDistance.filter((h) => allowed.includes(h.tier))

  // if none found, relax to all hospitals but keep sorting
  if (filtered.length === 0) filtered = withDistance

  // sort by tier (lower better) then distance
  filtered.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier
    const da = a.distanceKm ?? Number.POSITIVE_INFINITY
    const db = b.distanceKm ?? Number.POSITIVE_INFINITY
    return da - db
  })

  // build recommendation string
  const tierNames = { 1: 'Tier 1 (Trauma / Tertiary Care)', 2: 'Tier 2 (General Hospital)', 3: 'Tier 3 (Primary / Clinic)'}
  const recommendedTier = allowed[0]
  const recommendation = `Recommended: ${tierNames[recommendedTier]}. Based on severity=${triage.severity} and injuries=${(triage.injuryTypes||[]).join(', ')}`

  return { hospitals: filtered, recommendation }
}

export default { matchHospitalsForTriage }
