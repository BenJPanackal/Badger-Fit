// BadgerFit - fetchImages.js
// Run once: node fetchImages.js
// Downloads one image per gym into the /images folder.
// After running, the server serves them as static files — no Google calls at runtime.

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const gyms = require('./gyms.json');
const key  = process.env.GOOGLE_PLACES_KEY;

const IMAGES_DIR = path.join(__dirname, 'images');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

// default images if non are found with this file
const FALLBACKS = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700&h=400&fit=crop',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=700&h=400&fit=crop',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&h=400&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=700&h=400&fit=crop',
];
// default images search
function getFallback(address) {
  const idx = Math.abs(
    address.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  ) % FALLBACKS.length;
  return FALLBACKS[idx];
}

// Sanitise place ID into a safe filename
function filename(gym) {
  return (gym.placeId || gym.name.replace(/[^a-z0-9]/gi, '_')) + '.jpg';
}

// download a image based on the information about the gym
function download(url, dest) {
  // return the image
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get  = url.startsWith('https') ? https : http;
    // get image for downloading
    function request(u) {
      get.get(u, res => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', err => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(err);
      });
    }

    request(url);
  });
}
// check google street view to get an image of gym, using google api
async function checkStreetView(address) {
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(address)}&key=${key}`;
  // return the image in a safe format
  return new Promise((resolve) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.status === 'OK');
        } catch { resolve(false); }
      });
    }).on('error', () => resolve(false));
  });
}

// function to actually do the work of getting all the images needed
async function run() {
  const SKIP = new Set(['Hilldale Shopping Center', 'Unifinium LTD']);
  const filtered = gyms.filter(g => !SKIP.has(g.name));

  console.log(`📸 Downloading images for ${filtered.length} gyms...\n`);
  // go through every gym
  for (let i = 0; i < filtered.length; i++) {
    const gym = filtered[i];
    const fname = filename(gym);
    const dest  = path.join(IMAGES_DIR, fname);

    // Skip if already downloaded
    if (fs.existsSync(dest)) {
      console.log(`[${i+1}/${filtered.length}] ✓ Already exists: ${fname}`);
      continue;
    }

    let imageUrl;
    // fetch Url
    if (key && gym.address) {
      const hasStreetView = await checkStreetView(gym.address);
      if (hasStreetView) {
        imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=700x400&location=${encodeURIComponent(gym.address)}&fov=90&pitch=10&key=${key}`;
        console.log(`[${i+1}/${filtered.length}] 🌍 Street View: ${gym.name}`);
      } else {
        imageUrl = getFallback(gym.address);
        console.log(`[${i+1}/${filtered.length}] 🖼  Fallback:    ${gym.name}`);
      }
    } else {
      imageUrl = getFallback(gym.address || gym.name);
      console.log(`[${i+1}/${filtered.length}] 🖼  Fallback:    ${gym.name}`);
    }
    // download
    try {
      await download(imageUrl, dest);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      // Try fallback if street view download itself failed
      if (imageUrl !== getFallback(gym.address)) {
        try {
          await download(getFallback(gym.address), dest);
          console.log(`  ↩ Saved fallback instead`);
        } catch (e2) {
          console.error(`  ✗ Fallback also failed: ${e2.message}`);
        }
      }
    }

    // Small delay to be polite to Google's API
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n✅ Done! Images saved to /images folder.');
  console.log('You can now restart server.js and images will be served locally.');
}

run();