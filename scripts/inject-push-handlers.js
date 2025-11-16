// Post-build script to inject push handlers into next-pwa's generated service worker
// This runs after the build to add push notification support

const fs = require('fs')
const path = require('path')

const swPath = path.join(__dirname, '../public/sw.js')
const pushHandlerPath = path.join(__dirname, '../public/sw-custom.js')

console.log('[Inject Push Handlers] Starting...')

// Check if service worker exists
if (!fs.existsSync(swPath)) {
  console.error('[Inject Push Handlers] ❌ Service worker not found at:', swPath)
  process.exit(1)
}

// Read the generated service worker
let swContent = fs.readFileSync(swPath, 'utf8')

// Read our custom push handlers
if (!fs.existsSync(pushHandlerPath)) {
  console.error('[Inject Push Handlers] ❌ Push handler file not found at:', pushHandlerPath)
  process.exit(1)
}

const pushHandlerContent = fs.readFileSync(pushHandlerPath, 'utf8')

// Check if push handlers are already injected
if (swContent.includes('[SW] Push event received')) {
  console.log('[Inject Push Handlers] ℹ️ Push handlers already injected, skipping')
  process.exit(0)
}

// Extract just the push handler code (remove comments about injection)
const pushHandlerCode = pushHandlerContent
  .replace(/\/\/ Custom service worker code.*?\n/g, '')
  .replace(/\/\/ This will be used to add push handlers.*?\n/g, '')
  .trim()

// Inject our push handlers at the end of the service worker
// This ensures they're registered when the service worker loads
const injectedContent = swContent + '\n\n// ===== Custom Push Notification Handlers =====\n' + pushHandlerCode

// Write back the modified service worker
fs.writeFileSync(swPath, injectedContent, 'utf8')

console.log('[Inject Push Handlers] ✅ Push handlers injected successfully')
console.log('[Inject Push Handlers] Service worker size:', injectedContent.length, 'bytes')
console.log('[Inject Push Handlers] Push handler code length:', pushHandlerCode.length, 'bytes')

// Verify injection worked
const verifyContent = fs.readFileSync(swPath, 'utf8')
if (verifyContent.includes('[SW] Push event received')) {
  console.log('[Inject Push Handlers] ✅ Verification: Push handlers found in service worker')
} else {
  console.error('[Inject Push Handlers] ❌ Verification failed: Push handlers NOT found in service worker')
  process.exit(1)
}

