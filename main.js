/*
 * nelfe (Node-Express Library Front End)
 *   A web based portal/front end for consuming locally stored movies, music, and ebooks.
 * 
 * Licensed under the MIT license. 
 * Konstantin Zaremski - 6 February 2022
 * 
 * main.js - Main server file.
 */

// Require dependencies
const express = require('express');
const session = require('express-session');
const nunjucks = require('nunjucks');
const crypto = require('crypto');
const fs = require('fs');

// Database controller
const db = require('./db.js');
require('dotenv').config();

// Express App Object
const app = express();
// Session management/support (express-session)
app.use(session({
  secret: crypto.randomUUID(), // Random secret on every run
  cookie: {
    secure: (app.get('env') === 'production')
  }
}));
// Parse JSON-encoded request bodies
app.use(express.json());

// Configure nunjucks
nunjucks.configure('views', {
  noCache: true,
  watch: true,
  autoescape: true,
  express: app
});
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/static', express.static(path.join(__dirname, 'static')));

// Define essential routes
app.get('/', (req, res) => {
  if (!req.session.username) req.redirect('/auth');
  res.send('');
});

// Authentication router (/auth)(auth.js)
app.use('/auth', require('./auth'));

// Initialization/preparation actions
async function prepare() {
  // Create default database tables if they do not exist already
  await db.createDefaults();
  // Parse all the media in the library folder
  if (!process.env.LIBRARY_ROOT) return console.error('The library root (LIBRARY_ROOT) is not defined in the configuration file, no libary will be built. Please fix ./config.env');
  await buildLibaray(process.env.LIBRARY_ROOT);
}; prepare(); // Execute

// Listen for HTTP requests on the configured HTTP_PORT
// If the port is not configured, use port 8080
app.listen(process.env.HTTP_PORT || 8080, (PORT) => {
  console.log(`NELFE web endpoint listening on port ${PORT}`);
});
