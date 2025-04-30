// This script downloads the talim_desert icon and converts it to a favicon.ico file
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// First, ensure we have the necessary libraries
console.log('Installing required packages...');
exec('npm install jimp sharp', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error installing packages: ${error.message}`);
    return;
  }
  
  console.log('Packages installed successfully.');
  
  // Now require the installed packages
  const Jimp = require('jimp');
  const sharp = require('sharp');
  
  const sourcePath = path.join(__dirname, 'Icons', 'Profile', 'talim_desert.webp');
  const tempPngPath = path.join(__dirname, 'temp_favicon.png');
  const faviconPath = path.join(__dirname, 'favicon.ico');
  
  console.log('Converting talim_desert.webp to favicon.ico...');
  
  // First convert WebP to PNG
  sharp(sourcePath)
    .resize(32, 32) // Resize to standard favicon size
    .toFile(tempPngPath)
    .then(() => {
      // Then convert PNG to ICO format
      Jimp.read(tempPngPath)
        .then(image => {
          // Create different sizes for favicon
          return Promise.all([
            image.clone().resize(16, 16).getBufferAsync(Jimp.MIME_PNG),
            image.clone().resize(32, 32).getBufferAsync(Jimp.MIME_PNG),
            image.clone().resize(48, 48).getBufferAsync(Jimp.MIME_PNG)
          ]);
        })
        .then(buffers => {
          // Use sharp to create the ICO file
          return sharp(buffers[1])
            .toFile(faviconPath);
        })
        .then(() => {
          console.log(`Favicon created successfully at ${faviconPath}`);
          
          // Clean up temporary file
          fs.unlinkSync(tempPngPath);
          console.log('Temporary files cleaned up.');
          
          // Now update all HTML files to reference the new favicon
          updateHtmlFiles();
        })
        .catch(err => {
          console.error('Error in conversion process:', err);
        });
    })
    .catch(err => {
      console.error('Error processing WebP image:', err);
    });
});

function updateHtmlFiles() {
  // Get all HTML files in the current directory
  const htmlFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.html'));
  
  console.log(`Found ${htmlFiles.length} HTML files to update.`);
  
  // Update each HTML file to include the favicon
  htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if there's already a favicon link
    const faviconRegex = /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i;
    
    if (faviconRegex.test(content)) {
      // Replace existing favicon link
      content = content.replace(faviconRegex, '<link rel="icon" href="favicon.ico">');
    } else {
      // Add new favicon link after the title tag
      content = content.replace(/<\/title>/, '</title>\n    <link rel="icon" href="favicon.ico">');
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  });
  
  console.log('All HTML files have been updated with the new favicon reference.');
} 