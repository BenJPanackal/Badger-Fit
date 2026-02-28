// BadgerFit - script.js

// Filter pills toggle
const pills = document.querySelectorAll('.pill');
pills.forEach(pill => {
  pill.addEventListener('click', () => {
    pill.classList.toggle('active');
  });
});

// Search button
const searchBtn = document.querySelector('.search-bar button');
const searchInput = document.querySelector('.search-bar input');

searchBtn?.addEventListener('click', () => {
  const query = searchInput.value.toLowerCase();
  console.log('Searching for:', query);
  // TODO: filter gym cards based on query
});

function findMatch() {
  alert("Feature coming soon! We'll ask about your budget, location, and goals.");
  // TODO: replace with a quiz/modal later
}