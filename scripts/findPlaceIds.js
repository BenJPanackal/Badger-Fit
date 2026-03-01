require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.GOOGLE_PLACES_KEY;

const GYMS_TO_FIX = [
  'Nicholas Recreation Center Madison WI',
  'Bakke Recreation Wellbeing Center Madison WI'
];

async function findPlace(query) {
  const res = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
    params: {
      input: query,
      inputtype: 'textquery',
      fields: 'name,place_id,formatted_address,geometry',
      key: API_KEY
    }
  });

  if (res.data.status !== 'OK' || !res.data.candidates.length) {
    console.log(`❌ No result for: ${query} (status: ${res.data.status})`);
    return;
  }

  const place = res.data.candidates[0];
  console.log(`\n✅ ${place.name}`);
  console.log(`   placeId:  "${place.place_id}"`);
  console.log(`   address:  ${place.formatted_address}`);
  console.log(`   lat:      ${place.geometry.location.lat}`);
  console.log(`   lng:      ${place.geometry.location.lng}`);
  console.log(`\n   → In gyms.json, update this gym's placeId, address, and coordinates with the values above`);
}

async function main() {
  for (const query of GYMS_TO_FIX) {
    await findPlace(query);
    await new Promise(res => setTimeout(res, 500));
  }
}

main();