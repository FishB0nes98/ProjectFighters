// A simpler approach to update all HTML files to use talim_desert.webp directly as favicon
const fs = require('fs');
const path = require('path');

// Path to the directory containing HTML files
const dirPath = __dirname;

// Get all HTML files in the current directory
const htmlFiles = fs.readdirSync(dirPath)
  .filter(file => file.endsWith('.html'));

console.log(`Found ${htmlFiles.length} HTML files to update.`);

// Image path relative to the HTML files
const faviconPath = 'Icons/Profile/talim_desert.webp';

// Update each HTML file to include the favicon
htmlFiles.forEach(file => {
  const filePath = path.join(dirPath, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if there's already a favicon link
  const faviconRegex = /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i;
  
  if (faviconRegex.test(content)) {
    // Replace existing favicon link
    content = content.replace(faviconRegex, `<link rel="icon" href="${faviconPath}" type="image/webp">`);
  } else {
    // Add new favicon link after the title tag
    content = content.replace(/<\/title>/, `</title>\n    <link rel="icon" href="${faviconPath}" type="image/webp">`);
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file} with WebP favicon reference`);
});

console.log('✅ All HTML files have been updated to use talim_desert.webp as favicon.');
console.log('Note: Modern browsers support WebP as favicon, but older browsers may not show it correctly.'); 