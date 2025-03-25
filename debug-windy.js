console.log('Starting Windy API compatibility check...');

// Check if Leaflet is available
if (typeof window.L !== 'undefined') {
  console.log('Leaflet is available:', window.L.version);
} else {
  console.error('Leaflet is not available on the window object!');
}

// Check if Windy API is available
if (typeof window.windyInit === 'function') {
  console.log('Windy API is available (windyInit function exists)');
} else {
  console.error('Windy API is not available! Check script loading.');
}

// Check for the windy div container
const windyContainer = document.getElementById('windy');
if (windyContainer) {
  console.log('Windy container element found:', windyContainer);
} else {
  console.error('Windy container element (id="windy") not found in the DOM!');
}

console.log('Compatibility check complete. Check console for results.');