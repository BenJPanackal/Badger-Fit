// ===========================
//  BadgerFit - Results Page
// ===========================

// Read filters from the URL
// Example URL: results.html?budget=low&location=campus&classes=true
const params = new URLSearchParams(window.location.search);
const budget = params.get('budget');       // low, mid, high
const location = params.get('location');   // campus, eastside, westside, downtown
const classes = params.get('classes');     // true or false
const open247 = params.get('open247');     // true or false

// Update the summary text at the top
const summary = document.getElementById('results-summary');
const parts = [];
if (location) parts.push(location.replace('-', ' '));
if (budget === 'low') parts.push('under $15/mo');
if (budget === 'mid') parts.push('$15–$35/mo');
if (budget === 'high') parts.push('$35+/mo');
if (classes === 'true') parts.push('has classes');
if (open247 === 'true') parts.push('open 24/7');
summary.textContent = parts.length > 0
  ? `Showing gyms: ${parts.join(' · ')}`
  : 'Showing all gyms in Madison';

// Filter the gyms list
function filterGyms() {
  return gyms.filter(gym => {

    // Filter by location
    if (location && gym.location !== location) return false;

    // Filter by budget
    if (budget === 'low' && gym.price > 15) return false;
    if (budget === 'mid' && (gym.price < 15 || gym.price > 35)) return false;
    if (budget === 'high' && gym.price < 35) return false;

    // Filter by classes
    if (classes === 'true' && !gym.classes) return false;

    // Filter by 24/7
    if (open247 === 'true' && !gym.open247) return false;

    return true;
  });
}

// Build a gym card from a gym object
function buildCard(gym) {
  return `
    <div class="gym-card">
      <div class="gym-info">
        <h3>${gym.name}</h3>
        <p>📍 ${gym.location.charAt(0).toUpperCase() + gym.location.slice(1)}</p>
        <p>💰 ${gym.priceLabel}</p>
        <p>${gym.description}</p>
        <p class="amenities">${gym.amenities.join(' &nbsp; ')}</p>
        <a href="${gym.link}" class="view-btn" target="_blank">Learn More</a>
      </div>
    </div>
  `;
}

// Render results
const results = filterGyms();
const grid = document.getElementById('results-grid');
const noResults = document.getElementById('no-results');

if (results.length === 0) {
  noResults.style.display = 'block';
} else {
  grid.innerHTML = results.map(buildCard).join('');
}