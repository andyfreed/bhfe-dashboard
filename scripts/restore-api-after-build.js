const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../app/api');
const apiBackupDir = path.join(__dirname, '../app-api-backup');

// Restore API directory after Electron build
if (fs.existsSync(apiBackupDir)) {
  console.log('Restoring API directory after Electron build...');
  if (fs.existsSync(apiDir)) {
    fs.rmSync(apiDir, { recursive: true, force: true });
  }
  fs.renameSync(apiBackupDir, apiDir);
  console.log('API directory restored successfully');
}

