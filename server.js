/**
 * Simple Node.js server for THE UNDERWEB
 * 
 * This is a basic server that serves static files and can be used to deploy
 * THE UNDERWEB to platforms like Heroku, Render, or any Node.js hosting.
 * 
 * Usage:
 * 1. Install Node.js if you haven't already
 * 2. Run `npm install` to install dependencies
 * 3. Run `node server.js` to start the server
 * 4. Visit http://localhost:3000 in your browser
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable compression for all responses
app.use(compression());

// Serve static files from the current directory
app.use(express.static(__dirname, {
  maxAge: '1d', // Cache static assets for 1 day
  etag: true,   // Enable ETags for caching
}));

// Add security headers
app.use((req, res, next) => {
  // Help protect against clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Help protect against XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Serve index.html for all routes to support SPA-like navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`THE UNDERWEB server running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});
