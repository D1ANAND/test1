const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../build-tmp');
const destDir = path.join(__dirname, '../chrome-extension');

// Create clean extension directory
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true });
}
fs.mkdirSync(destDir);

// Function to filter and copy files
function copyFilesRecursively(src, dest) {
  if (!fs.existsSync(src)) return;
  
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    
    const entries = fs.readdirSync(src);
    entries.forEach(entry => {
      if (!entry.includes('*') && !entry.startsWith('_next')) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        copyFilesRecursively(srcPath, destPath);
      }
    });
  } else {
    if (!src.includes('*')) {
      fs.copyFileSync(src, dest);
    }
  }
}

// Copy static assets
const staticDir = path.join(srcDir, 'static');
if (fs.existsSync(staticDir)) {
  copyFilesRecursively(staticDir, path.join(destDir, 'static'));
}

// Copy and modify index.html to popup.html with environment variables
const indexPath = path.join(srcDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let htmlContent = fs.readFileSync(indexPath, 'utf-8');
  
  // Add environment variables
  const envScript = `
    <script>
      window.ENV = {
        NEXT_PUBLIC_AKASH_API_KEY: "${process.env.NEXT_PUBLIC_AKASH_API_KEY}"
      };
    </script>
  `;
  
  // Insert environment variables before the first script tag
  htmlContent = htmlContent.replace('<script', envScript + '<script');
  
  // Write the modified content to popup.html
  fs.writeFileSync(path.join(destDir, 'popup.html'), htmlContent);
}

// Copy manifest
fs.copyFileSync(
  path.join(__dirname, '../manifest.json'),
  path.join(destDir, 'manifest.json')
);

// Create and copy icons
const iconsDir = path.join(destDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

const srcIconsDir = path.join(__dirname, '../public/icons');
if (fs.existsSync(srcIconsDir)) {
  copyFilesRecursively(srcIconsDir, iconsDir);
}

// Clean up temporary build directory
if (fs.existsSync(srcDir)) {
  fs.rmSync(srcDir, { recursive: true });
}

console.log('Extension built successfully in /chrome-extension directory');