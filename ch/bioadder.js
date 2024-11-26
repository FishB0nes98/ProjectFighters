// bioadder.js
const fs = require('fs');
const path = require('path');

const chDir = './ch';
const charactersDir = './characters';

// Read all files in ch directory
fs.readdir(chDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    // Process only HTML files
    files.filter(file => file.endsWith('.html')).forEach(file => {
        const filePath = path.join(chDir, file);
        
        // Read the file content
        fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) {
                console.error(`Error reading file ${file}:`, err);
                return;
            }

            // Find the character name from the file name
            const characterName = file.replace('.html', '');
            
            // Create the bio page filename
            const bioPageName = `${characterName} Page.html`;
            
            // Check if corresponding bio page exists
            if (fs.existsSync(path.join(charactersDir, bioPageName))) {
                // Find the end of the character description (before the closing </p> tag)
                const descEndIndex = content.indexOf('</p>');
                if (descEndIndex === -1) return;

                // Check if button already exists
                if (content.includes('Check Bio')) return;

                // Add the bio button
                const newContent = content.slice(0, descEndIndex) +
                    ` <a href="../characters/${bioPageName}" class="bio-button">Check Bio</a>` +
                    content.slice(descEndIndex);

                // Add the button styles if they don't exist
                if (!content.includes('.bio-button')) {
                    const styleEndIndex = content.indexOf('</style>');
                    if (styleEndIndex !== -1) {
                        const buttonStyles = `
            .bio-button {
                display: inline-block;
                margin: 10px 0;
                padding: 8px 16px;
                background-color: #007bff;
                color: white;node bio
                text-decoration: none;
                border-radius: 4px;
                transition: background-color 0.3s;
            }
            .bio-button:hover {
                background-color: #0056b3;
                text-decoration: none;
                color: white;
            }`;
                        const newContent2 = content.slice(0, styleEndIndex) + 
                            buttonStyles + 
                            content.slice(styleEndIndex);
                        
                        // Write the updated content back to the file
                        fs.writeFile(filePath, newContent2, 'utf8', (err) => {
                            if (err) {
                                console.error(`Error writing file ${file}:`, err);
                                return;
                            }
                            console.log(`Updated ${file} with styles`);
                        });
                    }
                }

                // Write the updated content back to the file
                fs.writeFile(filePath, newContent, 'utf8', (err) => {
                    if (err) {
                        console.error(`Error writing file ${file}:`, err);
                        return;
                    }
                    console.log(`Updated ${file} with bio button`);
                });
            } else {
                console.log(`No bio page found for ${characterName}`);
            }
        });
    });
});