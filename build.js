const fs = require('fs');
const path = require('path');

// Create a .env file for the build process
const envContent = `
CI=false
REACT_APP_BACKEND_URL=${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''}
`;

fs.writeFileSync(path.join(__dirname, '.env'), envContent.trim());

console.log('Environment variables set for build');
