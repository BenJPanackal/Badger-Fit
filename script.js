// ── Gym data store ────────────────────────────────────────────────────────────
let allGyms = [];

// Fetch gyms from backend and render on page load
async function loadGyms() {
  try { // try to get gyms list
    const res = await fetch('http://localhost:3000/api/gyms');
    if (!res.ok) throw new Error('Server error');
    allGyms = await res.json();
    renderGyms(allGyms); // load gyms to screen
  } catch (err) {
    document.getElementById('gymGrid').innerHTML =
      '<p style="color:#888;">Could not load gyms. Make sure the server is running with <code>node server.js</code>.</p>';
  }
}

// Render a list of gyms into the grid
function renderGyms(gyms) {
  const grid  = document.getElementById('gymGrid');
  const title = document.getElementById('gymListingsTitle');
  // verify there aren't 0 gyms
  if (!gyms.length) {
    title.textContent = 'No gyms found';
    grid.innerHTML = '<p style="color:#888;">No gyms match your search.</p>';
    return;
  }

  title.textContent = gyms.length === allGyms.length
    ? 'All Gyms in Madison'
    : `${gyms.length} Gym${gyms.length !== 1 ? 's' : ''} Found`;

  grid.innerHTML = gyms.map(gym => {
    // hours — show today's hours or a fallback
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const today = days[new Date().getDay()];
    const todayHours = gym.hours?.[today];
    const hoursText = todayHours
      ? `Open today: ${todayHours.open} – ${todayHours.close}`
      : (gym.hoursText?.[0] || 'Hours not available');

    // amenities tags (show up to 4)
    const amenityTags = (gym.amenities || []).slice(0, 4)
      .map(a => `<span class="amenity-tag">${a}</span>`)
      .join('');

    // equipment tags (show up to 3)
    const equipmentTags = (gym.equipment || []).slice(0, 3)
      .map(e => `<span class="amenity-tag equipment">${e}</span>`)
      .join('');
    // html to load gym to website
    return `
      <div class="gym-card">
        <div class="gym-info">
          <h3>${gym.name}</h3>
          <p>📍 ${gym.address}</p>
          ${gym.rating ? `<p>⭐ ${gym.rating} <span style="color:#aaa;">(${gym.totalRatings} reviews)</span></p>` : ''}
          ${gym.monthlyPrice ? `<p>💵 From $${gym.monthlyPrice}/mo</p>` : ''}
          <p style="font-size:0.82rem; color:#666; margin-top:0.3rem;">🕐 ${hoursText}</p>
          ${gym.phone ? `<p style="font-size:0.82rem; color:#666;">📞 ${gym.phone}</p>` : ''}

          ${amenityTags || equipmentTags ? `
          <div class="amenity-tags" style="margin-top:0.75rem; display:flex; flex-wrap:wrap; gap:0.35rem;">
            ${amenityTags}
            ${equipmentTags}
          </div>` : ''}

          ${gym.website
            ? `<a href="${gym.website}" target="_blank" class="view-btn">Visit Website →</a>`
            : `<span style="display:inline-block; margin-top:0.85rem; font-size:0.82rem; color:#aaa;">No website available</span>`
          }
        </div>
      </div>
    `;
  }).join('');
}

// filter gyms by name as user types
function filterGyms() {
  const query = document.getElementById('gymSearch').value.trim().toLowerCase();
  // load all gyms to website
  if (!query) {
    renderGyms(allGyms);
    return;
  }
  // filter gyms then render
  const filtered = allGyms.filter(gym =>
    gym.name.toLowerCase().includes(query) ||
    gym.address.toLowerCase().includes(query)
  );
  renderGyms(filtered);
}

// live search on keyup
document.addEventListener('DOMContentLoaded', () => {
  loadGyms();
  // auto fill search
  const searchInput = document.getElementById('gymSearch');
  if (searchInput) {
    searchInput.addEventListener('keyup', filterGyms);
  }
});