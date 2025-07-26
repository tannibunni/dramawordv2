export const appleConfig = {
  clientId: process.env.APPLE_CLIENT_ID || 'com.tanny.dramaword',
  teamId: process.env.APPLE_TEAM_ID || '',
  keyId: process.env.APPLE_KEY_ID || '',
  privateKey: process.env.APPLE_PRIVATE_KEY || '',
  redirectUri: process.env.APPLE_REDIRECT_URI || 'dramaword://apple-login',
}; 