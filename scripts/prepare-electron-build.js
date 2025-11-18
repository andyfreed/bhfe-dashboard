const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../app/api');
const apiBackupDir = path.join(__dirname, '../app-api-backup');

// Backup API directory before Electron build
if (fs.existsSync(apiDir)) {
  console.log('Backing up API directory for Electron build...');
  if (fs.existsSync(apiBackupDir)) {
    fs.rmSync(apiBackupDir, { recursive: true, force: true });
  }
  fs.renameSync(apiDir, apiBackupDir);
  console.log('API directory backed up successfully');
}

