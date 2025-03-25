// src/fix-map-interaction.js
// Add this file to your project and import it in your App.tsx

/**
 * This utility helps fix map interaction issues with Windy API
 */
export function fixMapInteraction() {
  console.log('🔧 Running map interaction fix...');
  
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixAfterLoad);
  } else {
    fixAfterLoad();
  }
  
  function fixAfterLoad() {
    // Wait a bit for all components to mount and initialize
    setTimeout(() => {
      const windyContainer = document.getElementById('windy');
      
      if (!windyContainer) {
        console.error('❌ #windy container not found!');
        return;
      }
      
      console.log('✅ #windy container found');
      
      // Check CSS properties
      const windyStyles = window.getComputedStyle(windyContainer);
      console.log(`Current #windy container styles:`, {
        position: windyStyles.position,
        zIndex: windyStyles.zIndex,
        pointerEvents: windyStyles.pointerEvents
      });
      
      // Fix 1: Ensure pointer-events is set to auto
      if (windyStyles.pointerEvents === 'none') {
        console.log('🔧 Fixing pointer-events on #windy container');
        windyContainer.style.pointerEvents = 'auto';
      }
      
      // Fix 2: Check for parent elements with pointer-events: none
      let parent = windyContainer.parentElement;
      while (parent) {
        const parentStyles = window.getComputedStyle(parent);
        if (parentStyles.pointerEvents === 'none') {
          console.log('🔧 Fixing pointer-events on parent element:', parent);
          parent.style.pointerEvents = 'auto';
        }
        parent = parent.parentElement;
      }
      
      // Fix 3: Check Leaflet map container
      const leafletContainer = document.querySelector('.leaflet-container');
      if (leafletContainer) {
        const leafletStyles = window.getComputedStyle(leafletContainer);
        console.log(`Leaflet container styles:`, {
          position: leafletStyles.position,
          zIndex: leafletStyles.zIndex,
          pointerEvents: leafletStyles.pointerEvents
        });
        
        if (leafletStyles.pointerEvents === 'none') {
          console.log('🔧 Fixing pointer-events on .leaflet-container');
          leafletContainer.style.pointerEvents = 'auto';
        }
      } else {
        console.warn('⚠️ .leaflet-container not found');
      }
      
      // Fix 4: Check for overlays that might block interaction
      const mapContainer = document.querySelector('.map-container');
      if (mapContainer) {
        Array.from(mapContainer.children).forEach(child => {
          if (child !== windyContainer && child.id !== 'windy') {
            const childStyles = window.getComputedStyle(child);
            if (childStyles.position === 'absolute' && 
                parseInt(childStyles.zIndex) > parseInt(windyStyles.zIndex)) {
              console.log('⚠️ Found overlay that might block interaction:', child);
              console.log('   Consider setting pointer-events: none on this element');
            }
          }
        });
      }
      
      // Fix 5: Check if windy instance is initialized properly
      if (typeof window.W === 'undefined') {
        console.error('❌ Windy API (window.W) is not initialized properly');
        console.log('   Make sure the Windy API script is loaded correctly');
      } else {
        console.log('✅ Windy API (window.W) is available');
      }
      
      // Fix 6: Add specific CSS fixes to document
      addCSSFixes();
      
      console.log('🔧 Map interaction fixes applied. Refresh the page to see effects.');
    }, 2000); // Wait 2 seconds for everything to initialize
  }
  
  function addCSSFixes() {
    // Create a style element
    const style = document.createElement('style');
    style.textContent = `
      /* Ensure the Windy container has pointer events */
      #windy {
        pointer-events: auto !important;
        z-index: 5 !important;
      }
      
      /* Ensure Leaflet controls are on top and clickable */
      .leaflet-control-container {
        z-index: 1000 !important;
        pointer-events: auto !important;
      }
      
      /* Fix any map overlays that should not block interaction */
      .map-controls, .zoom-indicator, .distance-overlay {
        pointer-events: auto;
      }
      
      /* Make sure the base container allows events */
      .map-container {
        pointer-events: auto !important;
      }
      
      /* Fix for Leaflet map container */
      .leaflet-container {
        pointer-events: auto !important;
      }
      
      /* Fix for Leaflet panes */
      .leaflet-map-pane {
        pointer-events: auto !important;
      }
      
      /* Ensure other panes don't block events */
      .leaflet-marker-pane,
      .leaflet-shadow-pane,
      .leaflet-overlay-pane,
      .leaflet-tooltip-pane,
      .leaflet-popup-pane {
        pointer-events: none;
      }
      
      /* But make sure markers and popups are clickable */
      .leaflet-marker-icon,
      .leaflet-popup,
      .leaflet-interactive {
        pointer-events: auto !important;
      }
    `;
    
    // Add the style element to the document head
    document.head.appendChild(style);
    console.log('✅ Added CSS fixes to document');
  }
}

// Function to diagnose common issues with the Windy setup
export function diagnoseWindySetup() {
  console.log('🔍 Starting Windy setup diagnosis...');
  
  // Check for Leaflet and Windy API availability
  const hasLeaflet = typeof window.L !== 'undefined';
  const hasWindyInit = typeof window.windyInit === 'function';
  
  console.log(`Leaflet available: ${hasLeaflet ? '✅' : '❌'}`);
  console.log(`windyInit available: ${hasWindyInit ? '✅' : '❌'}`);
  
  if (!hasLeaflet) {
    console.error('Leaflet not available. Check script loading order.');
  }
  
  if (!hasWindyInit) {
    console.error('windyInit function not available. Check Windy API script loading.');
  }
  
  // Check for container element
  const container = document.getElementById('windy');
  console.log(`#windy container: ${container ? '✅' : '❌'}`);
  
  if (container) {
    const rect = container.getBoundingClientRect();
    console.log(`Container dimensions: ${rect.width}x${rect.height}`);
    
    if (rect.width < 50 || rect.height < 50) {
      console.warn('⚠️ Container size is too small for proper interaction');
    }
  } else {
    console.error('Container with id="windy" not found. This is required for Windy API.');
  }
  
  // Check for other map elements
  const leafletContainer = document.querySelector('.leaflet-container');
  console.log(`Leaflet container: ${leafletContainer ? '✅' : '❌'}`);
  
  if (!leafletContainer && hasLeaflet) {
    console.warn('⚠️ Leaflet container not found, even though Leaflet is loaded.');
  }
  
  // Check for map initialization
  setTimeout(() => {
    const windyObj = window.W;
    console.log(`Windy object initialized: ${windyObj ? '✅' : '❌'}`);
    
    if (windyObj) {
      console.log('Windy map appears to be properly initialized');
    } else {
      console.error('Windy object not initialized. Check for errors during initialization.');
    }
    
    console.log('🔍 Diagnosis complete. Check console for issues.');
  }, 2000);
}