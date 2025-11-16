// Script to generate VAPID keys for Web Push API
// Run with: node scripts/generate-vapid-keys.js

const webpush = require('web-push');

console.log('Generating VAPID keys for Web Push API...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Add these to your .env.local file:\n');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:your-email@example.com\n');
console.log('Note: Update VAPID_SUBJECT with your actual email address');

