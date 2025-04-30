const fs = require('fs');
const path = require('path');

// Path to the monster-battle.js file
const filePath = path.join(__dirname, 'monster-battle', 'monster-battle.js');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Find the first showItemSelection function and replace it with a comment
  const firstFunctionRegex = /function showItemSelection\(\) \{[\s\S]*?\/\/ For now, just show a message[\s\S]*?showMessage\('Items will be available in a future update!'\);[\s\S]*?\}/;
  
  const modifiedData = data.replace(firstFunctionRegex, 
    `// DEPRECATED: First showItemSelection function was removed to avoid conflicts with the newer implementation at line ~1007`);

  // Write the modified content back to the file
  fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Successfully fixed duplicate function in', filePath);
  });
}); 