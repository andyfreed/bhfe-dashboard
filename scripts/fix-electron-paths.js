const fs = require('fs');
const path = require('path');

// Fix absolute paths in HTML files for Electron file:// protocol
function fixPathsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace absolute paths with relative paths
    // /_next/ -> ./_next/
    // /manifest.json -> ./manifest.json
    // /favicon.ico -> ./favicon.ico
    // /icon- -> ./icon-
    // /apple-icon- -> ./apple-icon-
    
    // Fix HTML attributes
    content = content.replace(/href="\/_next\//g, 'href="./_next/');
    content = content.replace(/src="\/_next\//g, 'src="./_next/');
    content = content.replace(/href="\/manifest\.json"/g, 'href="./manifest.json"');
    content = content.replace(/href="\/favicon\.ico/g, 'href="./favicon.ico');
    content = content.replace(/href="\/icon-/g, 'href="./icon-');
    content = content.replace(/href="\/apple-icon-/g, 'href="./apple-icon-');
    
    // Fix embedded JavaScript strings (in self.__next_f.push calls)
    content = content.replace(/":\["\/_next\//g, '":["./_next/');
    content = content.replace(/","\/_next\//g, '","./_next/');
    content = content.replace(/\/_next\/static\//g, './_next/static/');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed paths in: ${filePath}`);
  } catch (err) {
    console.error(`Error fixing paths in ${filePath}:`, err.message);
  }
}

// Recursively find and fix all HTML files
function fixPathsInDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixPathsInDirectory(filePath);
    } else if (file.endsWith('.html')) {
      fixPathsInFile(filePath);
    }
  }
}

// Fix paths in the out directory
const outDir = path.join(__dirname, '../out');
if (fs.existsSync(outDir)) {
  console.log('Fixing absolute paths for Electron file:// protocol...');
  fixPathsInDirectory(outDir);
  console.log('Path fixing complete!');
} else {
  console.error('out directory not found!');
  process.exit(1);
}

