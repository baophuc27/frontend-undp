// src/debug-windy-css.js
// Add this script to your public/index.html or include it conditionally in development

(function() {
    console.log('🔍 Starting Windy CSS Debugger...');
    
    // Check if the windy container exists
    function checkWindyContainer() {
      const windyContainer = document.getElementById('windy');
      
      if (!windyContainer) {
        console.error('❌ #windy container not found in the DOM!');
        return null;
      }
      
      console.log('✅ #windy container found');
      
      // Check dimensions
      const rect = windyContainer.getBoundingClientRect();
      console.log(`📏 #windy container dimensions: ${rect.width}x${rect.height}`);
      
      if (rect.width < 100 || rect.height < 100) {
        console.warn('⚠️ #windy container is too small! Windy API needs sufficient space.');
      }
      
      // Check computed styles
      const styles = window.getComputedStyle(windyContainer);
      console.log(`🎨 #windy position: ${styles.position}`);
      console.log(`🎨 #windy z-index: ${styles.zIndex}`);
      
      if (styles.position !== 'absolute') {
        console.warn('⚠️ #windy container should have position: absolute');
      }
      
      if (parseInt(styles.zIndex) < 5) {
        console.warn('⚠️ #windy container z-index might be too low');
      }
      
      // Check parent container
      const parent = windyContainer.parentElement;
      if (parent) {
        const parentStyles = window.getComputedStyle(parent);
        console.log(`👪 Parent container position: ${parentStyles.position}`);
        console.log(`👪 Parent container dimensions: ${parentStyles.width}x${parentStyles.height}`);
        
        if (parentStyles.position !== 'relative' && parentStyles.position !== 'absolute') {
          console.warn('⚠️ Parent container should have position: relative or absolute');
        }
      }
      
      return windyContainer;
    }
    
    // Check for CSS conflicts
    function checkCssConflicts(windyContainer) {
      if (!windyContainer) return;
      
      // Look for z-index stacking context issues
      const highZIndexElements = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex);
        if (!isNaN(zIndex) && zIndex > 100 && el !== windyContainer) {
          highZIndexElements.push({
            element: el,
            zIndex: zIndex,
            position: style.position
          });
        }
      });
      
      if (highZIndexElements.length > 0) {
        console.log('⚠️ Elements with high z-index that might overlay the map:');
        highZIndexElements.forEach(item => {
          console.log(`- ${item.element.tagName}.${item.element.className}: z-index ${item.zIndex}, position ${item.position}`);
        });
      }
    }
    
    // Wait for DOM to be fully loaded
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const windyContainer = checkWindyContainer();
        checkCssConflicts(windyContainer);
        
        // Check if Windy API initialized properly
        if (typeof window.W !== 'undefined') {
          console.log('✅ Windy API (window.W) is available');
        } else {
          console.error('❌ Windy API (window.W) is not available, initialization might have failed');
        }
        
        console.log('🔍 Windy CSS Debugger complete');
      }, 2000); // Give time for everything to load
    });
  })();