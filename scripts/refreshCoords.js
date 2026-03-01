require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GOOGLE_PLACES_KEY;
const GYMS_PATH = path.join(__dirname, '..', 'gyms.json');
const gyms = require(GYMS_PATH);

async function getDetails(placeId) {
  const res = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
    params: {
      place_id: placeId,
      fields: 'name,geometry,formatted_address',
      key: API_KEY
    }
  });

  if (res.data.status !== 'OK') {
    throw new Error(`Places API error: ${res.data.status}`);
  }

  return res.data.result;
}

async function main() {
  if (!API_KEY) {
    console.error('❌ GOOGLE_PLACES_KEY not found in .env');
    process.exit(1);
  }

  // Only process gyms that are missing valid coordinates
    const needsUpdate = gyms.filter(g => g.placeId);

  // Also force-update ALL gyms (comment out the filter above and use this instead if you want to refresh everything)
  // const needsUpdate = gyms.filter(g => g.placeId);

  console.log(`Found ${needsUpdate.length} gyms that need coordinate updates out of ${gyms.length} total.\n`);

  if (needsUpdate.length === 0) {
    console.log('✅ All gyms already have coordinates! If you want to force-refresh all, edit the script.');
    process.exit(0);
  }

  let updated = 0;
  let failed = 0;
  const failedNames = [];

  for (let i = 0; i < needsUpdate.length; i++) {
    const gym = needsUpdate[i];

    try {
      process.stdout.write(`[${i + 1}/${needsUpdate.length}] ${gym.name}... `);
      const details = await getDetails(gym.placeId);

      // Find this gym in the main array and update it
      const idx = gyms.findIndex(g => g.placeId === gym.placeId);
      gyms[idx].coordinates = {
        lat: details.geometry.location.lat,
        lng: details.geometry.location.lng
      };
      gyms[idx].address = details.formatted_address;

      console.log(`✅`);
      updated++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed++;
      failedNames.push(gym.name);
    }

    // Save after every gym so progress isn't lost if script crashes
    fs.writeFileSync(GYMS_PATH, JSON.stringify(gyms, null, 2));

    // 500ms delay between requests to avoid rate limiting
    if (i < needsUpdate.length - 1) {
      await new Promise(res => setTimeout(res, 500));
    }
  }

  console.log(`\n✅ Updated: ${updated}`);
  console.log(`❌ Failed:  ${failed}`);

  if (failedNames.length > 0) {
    console.log('\nFailed gyms (run script again to retry):');
    failedNames.forEach(n => console.log(`  - ${n}`));
  }

  console.log('\nRestart your server: node server.js');
}

main();