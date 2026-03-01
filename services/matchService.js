// services/matchService.js

const WEIGHTS = {
  amenities:  25,
  equipment:  20,
  hours:      20,
  location:   20,
  budget:     15,
};

const GOAL_EQUIPMENT_MAP = {
  'weight-loss':  ['cardio', 'machines'],
  'muscle':       ['free-weights', 'machines', 'squat-racks'],
  'endurance':    ['cardio', 'turf'],
  'flexibility':  ['stretching'],
  'strength':     ['squat-racks', 'powerlifting', 'free-weights'],
  'athletic':     ['turf', 'crossfit', 'squat-racks'],
  'wellness':     ['cardio', 'stretching'],
  'social':       [],
};

const HOUR_REQUIREMENTS = {
  'early-morning': { needsOpenBy: '05:00', needsOpenUntil: '08:00' },
  'morning':       { needsOpenBy: '08:00', needsOpenUntil: '12:00' },
  'afternoon':     { needsOpenBy: '12:00', needsOpenUntil: '16:00' },
  'evening':       { needsOpenBy: '16:00', needsOpenUntil: '20:00' },
  'night':         { needsOpenBy: '20:00', needsOpenUntil: '23:59' },
  '24/7':          { needsOpenBy: '00:00', needsOpenUntil: '23:59' },
};

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function scoreHours(gymHours, requestedSlots) {
  if (!requestedSlots || requestedSlots.length === 0) return 1;
  if (!gymHours) return 0;

  const day = gymHours.monday || gymHours.tuesday || gymHours.sunday;
  if (!day) return 0;

  const gymOpen  = timeToMinutes(day.open);
  const gymClose = timeToMinutes(day.close);

  let covered = 0;
  for (const slot of requestedSlots) {
    const req = HOUR_REQUIREMENTS[slot];
    if (!req) continue;
    if (gymOpen <= timeToMinutes(req.needsOpenBy) &&
        gymClose >= timeToMinutes(req.needsOpenUntil)) {
      covered++;
    }
  }
  return covered / requestedSlots.length;
}

function distanceMiles(a, b) {
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sin2 = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

function toRad(deg) { return deg * Math.PI / 180; }

function scoreLocation(gym, prefs) {
  if (!prefs.coords) return 0.5;
  const dist = distanceMiles(prefs.coords, gym.coordinates);
  const maxDist = prefs.distance && prefs.distance !== 'any'
    ? parseFloat(prefs.distance) : 10;

  if (dist > maxDist) return 0;
  if (dist <= 0.5) return 1.0;
  if (dist <= 1)   return 0.85;
  if (dist <= 2)   return 0.7;
  if (dist <= 5)   return 0.45;
  return 0.2;
}

function scoreBudget(gym, prefs) {
  if (!prefs.price) return 1;
  const budget = parseFloat(prefs.price);
  if (!gym.monthlyPrice) return 0.5;
  if (gym.monthlyPrice <= budget) return 1;
  const overBy = gym.monthlyPrice - budget;
  return Math.max(0, 1 - overBy / budget);
}

function scoreGym(gym, prefs) {
  let totalScore = 0;
  let totalWeight = 0;
  const matchedCriteria = [];

  // Amenities
  const wantedAmenities = [...(prefs.amenities || [])];
  if ((prefs.loc_pref || []).includes('parking')) wantedAmenities.push('parking');
  if (wantedAmenities.length > 0) {
    const matched = wantedAmenities.filter(a => (gym.amenities || []).includes(a));
    totalScore  += WEIGHTS.amenities * (matched.length / wantedAmenities.length);
    totalWeight += WEIGHTS.amenities;
    matched.forEach(a => matchedCriteria.push(`Has ${a}`));
  }

  // Equipment (boosted by goal)
  const wantedEquipment = [...(prefs.equipment || [])];
  if (prefs.goal && GOAL_EQUIPMENT_MAP[prefs.goal]) {
    GOAL_EQUIPMENT_MAP[prefs.goal].forEach(g => {
      if (!wantedEquipment.includes(g)) wantedEquipment.push(g);
    });
  }
  if (wantedEquipment.length > 0) {
    const matched = wantedEquipment.filter(e => (gym.equipment || []).includes(e));
    totalScore  += WEIGHTS.equipment * (matched.length / wantedEquipment.length);
    totalWeight += WEIGHTS.equipment;
    matched.forEach(e => matchedCriteria.push(`Has ${e}`));
  }

  // Hours
  if ((prefs.hours || []).length > 0) {
    const ratio = scoreHours(gym.hours, prefs.hours);
    totalScore  += WEIGHTS.hours * ratio;
    totalWeight += WEIGHTS.hours;
    if (ratio >= 1)    matchedCriteria.push('Open during your preferred hours');
    else if (ratio > 0) matchedCriteria.push('Partially covers your hours');
  }

  // Location
  const locScore = scoreLocation(gym, prefs);
  totalScore  += WEIGHTS.location * locScore;
  totalWeight += WEIGHTS.location;
  if (locScore >= 0.85)     matchedCriteria.push('Very close to your location');
  else if (locScore >= 0.5) matchedCriteria.push('Within your preferred distance');

  // Budget
  const budScore = scoreBudget(gym, prefs);
  totalScore  += WEIGHTS.budget * budScore;
  totalWeight += WEIGHTS.budget;
  if (budScore === 1 && gym.monthlyPrice) {
    matchedCriteria.push(`Within your $${prefs.price}/mo budget`);
  }

  const percentage = totalWeight > 0
    ? Math.round((totalScore / totalWeight) * 100) : 0;

  return { gym, percentage, matchedCriteria: [...new Set(matchedCriteria)] };
}

function scoreGyms(gyms, prefs) {
  return gyms
    .map(gym => scoreGym(gym, prefs))
    .filter(r => r.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6);
}

module.exports = { scoreGyms };