// Price slider
const priceRange = document.getElementById('priceRange');
const priceVal   = document.getElementById('priceVal');
priceRange.addEventListener('input', () => {
  priceVal.textContent = priceRange.value == 300 ? '300+' : priceRange.value;
});

// Progress bar
const sections     = document.querySelectorAll('.section');
const allInputs    = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
const progressFill = document.getElementById('progressFill');

allInputs.forEach(input => input.addEventListener('change', updateProgress));
priceRange.addEventListener('input', updateProgress);
// update progress bar based on the amount of user input
function updateProgress() {
  const filled = [...sections].filter(section =>
    section.querySelector('input:checked') ||
    section.querySelector('input[type="text"]')?.value ||
    section.querySelector('select')?.value
  ).length;
  progressFill.style.width = Math.round((filled / sections.length) * 100) + '%';
}

// ── Google Places Autocomplete ────────────────────────────────────────────────

let addressVerified = false; // tracks whether user picked from dropdown

// Auto complete for search bar
function initAutocomplete() {
    const input      = document.getElementById('locationInput');
    const latInput   = document.getElementById('latInput');
    const lngInput   = document.getElementById('lngInput');
    const fmtInput   = document.getElementById('formattedInput');
    const errorMsg   = document.getElementById('addressError');

  const madisonBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(42.9, -89.6),
    new google.maps.LatLng(43.2, -89.1)
  );

  const autocomplete = new google.maps.places.Autocomplete(input, {
    bounds:                madisonBounds,
    strictBounds:          false,
    componentRestrictions: { country: 'us' },
    types:                 ['address'],
    fields:                ['formatted_address', 'geometry']
  });

  // When user picks a suggestion from the dropdown
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();

    if (!place.geometry) {
      addressVerified = false;
      latInput.value  = '';
      lngInput.value  = '';
      fmtInput.value  = '';
      return;
    }

    addressVerified  = true;
    latInput.value   = place.geometry.location.lat();
    lngInput.value   = place.geometry.location.lng();
    fmtInput.value   = place.formatted_address;
    input.value      = place.formatted_address;

    // Clear error state and show green confirmation
    errorMsg.style.display  = 'none';
    input.style.borderColor = '#4ade80';
    updateProgress();
  });

  // If user manually edits the field after picking, mark as unverified
  input.addEventListener('input', () => {
    addressVerified = false;
    latInput.value  = '';
    lngInput.value  = '';
    fmtInput.value  = '';
    input.style.borderColor = '';
  });
}

// Form validation on submit
document.getElementById('surveyForm').addEventListener('submit', (e) => {
  const input    = document.getElementById('locationInput');
  const errorMsg = document.getElementById('addressError');

  if (input.value.trim() === '') {
    e.preventDefault();
    errorMsg.textContent = '⚠️ Please enter and select your address from the dropdown.';
    errorMsg.style.display = 'block';
    input.style.borderColor = 'var(--accent)';
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
    return;
  }

  if (!addressVerified) {
    e.preventDefault();
    errorMsg.textContent = '⚠️ Please select an address from the dropdown suggestions.';
    errorMsg.style.display = 'block';
    input.style.borderColor = 'var(--accent)';
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
    return;
  }

  errorMsg.style.display  = 'none';
  input.style.borderColor = '';
});

window.initAutocomplete = initAutocomplete;


// ── Form validation on submit ─────────────────────────────────────────────────

document.getElementById('surveyForm').addEventListener('submit', (e) => {
  const input    = document.getElementById('locationInput');
  const errorMsg = document.getElementById('addressError');

  // Block submission if address field is empty
  if (input.value.trim() === '') {
    e.preventDefault();
    errorMsg.textContent = '⚠️ Please enter and select your address from the dropdown.';
    errorMsg.style.display = 'block';
    input.style.borderColor = 'var(--accent)';
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
    return;
  }

  // Block submission if user typed but didn't pick from dropdown
  if (!addressVerified) {
    e.preventDefault();
    errorMsg.textContent = '⚠️ Please select an address from the dropdown suggestions.';
    errorMsg.style.display = 'block';
    input.style.borderColor = 'var(--accent)';
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
    return;
  }

  errorMsg.style.display = 'none';
  input.style.borderColor = '';
});