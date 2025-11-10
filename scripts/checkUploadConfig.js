const fs = require('fs');
const path = require('path');

// Check if products directory exists
const productsDir = path.join(__dirname, '../../public/uploads/products');

console.log('Checking uploads directory structure:\n');
console.log('Products directory:', productsDir);
console.log('Exists:', fs.existsSync(productsDir));

if (fs.existsSync(productsDir)) {
  const files = fs.readdirSync(productsDir);
  console.log('\nFiles in products directory:', files.length);
  
  if (files.length > 0) {
    console.log('\nFiles:');
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      const stats = fs.statSync(path.join(productsDir, file));
      console.log(`  - ${file} (${ext}) - ${(stats.size / 1024).toFixed(2)} KB`);
    });
  }
}

console.log('\n---');
console.log('WebP mime type check:');
const testMimeTypes = ['image/webp', 'image/jpeg', 'image/png', 'image/gif'];
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

testMimeTypes.forEach(mime => {
  const isAllowed = allowedMimeTypes.includes(mime.toLowerCase());
  console.log(`  ${mime}: ${isAllowed ? '✓ ALLOWED' : '✗ BLOCKED'}`);
});
