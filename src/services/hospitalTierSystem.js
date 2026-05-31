const TIER = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
}

function hasPrioritySpeciality(specialities = []) {
  if (!Array.isArray(specialities)) return false
  const priorities = ['trauma', 'neurology', 'orthopedics', 'neurosurgery']
  return specialities.some((s) => priorities.some((p) => s.toLowerCase().includes(p)))
}

export function classifyHospital(hospital = {}) {
  const emergency = typeof hospital.emergency === 'string' ? hospital.emergency.toLowerCase() : hospital.emergency
  const beds = typeof hospital.beds === 'number' ? hospital.beds : null
  const specialities = Array.isArray(hospital.specialities) ? hospital.specialities : []

  const features = []
  if (emergency) features.push(`emergency:${emergency}`)
  if (beds !== null) features.push(`beds:${beds}`)
  if (specialities.length > 0) features.push(`specialities:${specialities.join(',')}`)

  // Default to Tier 2 if no beds and no speciality tags per spec
  const hasBedsOrSpeciality = beds !== null || specialities.length > 0

  let tier = TIER.THREE

  if ((emergency === 'yes' && beds !== null && beds >= 100) || hasPrioritySpeciality(specialities)) {
    tier = TIER.ONE
  } else if (emergency === 'yes' || (beds !== null && beds >= 50)) {
    tier = TIER.TWO
  } else if (!hasBedsOrSpeciality) {
    tier = TIER.TWO
  } else {
    tier = TIER.THREE
  }

  return {
    ...hospital,
    tier,
    features,
  }
}

export default { classifyHospital }
