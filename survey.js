const priceRange = document.getElementById('priceRange');
const priceVal = document.getElementById('priceVal');
priceRange.addEventListener('input', () => {
    priceVal.textContent = priceRange.value == 300 ? '300+' : priceRange.value;
});