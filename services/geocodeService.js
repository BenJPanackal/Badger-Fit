// services/geocodeService.js
const axios = require('axios');

async function getCoordinates(address) {
  const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: {
      address: address,
      key: process.env.GOOGLE_PLACES_KEY
    }
  });

  const result = response.data.results[0];
  if (!result) throw new Error(`Address not found: ${address}`);

  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng
  };
}

module.exports = { getCoordinates };