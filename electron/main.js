const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Load environment variables from .env.local if it exists
if (!isDev) {
  try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      console.log('Loaded environment variables from .env.local');
    }
  } catch (err) {
    console.warn('Could not load .env.local:', err.message);
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, '../public/icon-512x512.png'),
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Load the app
  if (isDev) {
    // In development, load from Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the built Next.js app
    // In packaged app, files are in resources/app.asar
    // Try multiple path strategies
    const possiblePaths = [
      path.join(process.resourcesPath, 'app.asar', 'out', 'index.html'),
      path.join(__dirname, '..', 'out', 'index.html'),
      path.join(app.getAppPath(), 'out', 'index.html'),
    ];
    
    let loaded = false;
    for (const htmlPath of possiblePaths) {
      console.log('Trying to load from:', htmlPath);
      if (fs.existsSync(htmlPath)) {
        console.log('Found HTML file at:', htmlPath);
        mainWindow.loadFile(htmlPath).catch((err) => {
          console.error('Error loading file:', err);
          // Try with file:// protocol as fallback
          mainWindow.loadURL(`file://${htmlPath}`).catch((err2) => {
            console.error('Error loading URL:', err2);
          });
        });
        loaded = true;
        break;
      }
    }
    
    if (!loaded) {
      console.error('Could not find index.html in any of the expected locations:', possiblePaths);
      // Show error message
      mainWindow.loadURL('data:text/html,<html><body><h1>Error: Could not find app files</h1><p>Please reinstall the application.</p></body></html>');
    }
    
    // Open DevTools in production for debugging (remove this later)
    mainWindow.webContents.openDevTools();
  }
  
  // Log errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });
  
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Renderer ${level}]:`, message);
  });

  // Inject environment variables into the renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    // Inject Supabase env vars if they exist
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      mainWindow.webContents.executeJavaScript(`
        window.__NEXT_PUBLIC_SUPABASE_URL__ = ${JSON.stringify(supabaseUrl)};
        window.__NEXT_PUBLIC_SUPABASE_ANON_KEY__ = ${JSON.stringify(supabaseKey)};
        console.log('Supabase env vars injected');
      `).catch(err => console.error('Error injecting env vars:', err));
    } else {
      console.warn('Supabase env vars not found in Electron process.env');
    }
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus the window
    if (isDev) {
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app protocol for deep linking (optional)
app.setAsDefaultProtocolClient('bhfe-dashboard');

// IPC handlers for Electron-specific features
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

