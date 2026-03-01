// routes/match.js
const express = require('express');
const router = express.Router();
const { scoreGyms } = require('../services/matchService');
const { getCoordinates } = require('../services/geocodeService');

let gyms;
try {
  gyms = require('../gyms.json');
} catch (e) {
  gyms = [];
  console.warn('⚠️  gyms.json not found. Run: node scripts/fetchGyms.js');
}

router.post('/', async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({ error: 'No preferences provided' });
    }

    // If user entered an address, convert it to lat/lng for distance scoring
    if (preferences.location && preferences.location.trim() !== '') {
      try {
        preferences.coords = await getCoordinates(preferences.location + ', Madison, WI');
      } catch (e) {
        console.warn('Geocoding failed:', e.message);
        // Not a fatal error — just skip distance scoring
      }
    }

    const results = scoreGyms(gyms, preferences);
    res.json(results);

  } catch (err) {
    console.error('Match error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;