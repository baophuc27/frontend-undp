const fs = require('fs');
const path = require('path');

try {
  // Check package.json
  const packageJsonPath = path.resolve('./package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('Checking Leaflet version compatibility for Windy API');
    console.log('-----------------------------------------------------');
    
    // Get installed versions
    const leafletVersion = packageJson.dependencies?.leaflet || 'not installed';
    const reactLeafletVersion = packageJson.dependencies?.['react-leaflet'] || 'not installed';
    
    console.log(`Leaflet: ${leafletVersion}`);
    console.log(`React-Leaflet: ${reactLeafletVersion}`);
    
    // Check compatibility
    if (leafletVersion.startsWith('1.4.')) {
      console.log('✅ Leaflet version is compatible with Windy API (1.4.x)');
    } else {
      console.log('❌ Leaflet version is NOT compatible with Windy API (1.4.x required)');
    }
    
    if (reactLeafletVersion.startsWith('2.')) {
      console.log('✅ React-Leaflet version is compatible with Leaflet 1.4.x');
    } else {
      console.log('❌ React-Leaflet version might not be compatible with Leaflet 1.4.x (v2.x recommended)');
    }
    
    console.log('\nRecommended versions:');
    console.log('- leaflet: 1.4.0');
    console.log('- react-leaflet: 2.7.0');
    console.log('- @types/leaflet: 1.5.19');
  } else {
    console.log('Package.json not found');
  }
} catch (error) {
  console.error('Error checking compatibility:', error);
}
