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

// Constants/flags
const LISTEN_PORT = process.env.PORT || 3000;

// Database controller
const db = require('./db.js');
// Create default tables if they do not already exist
db.createDefaults();

// Express App Object
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(LISTEN_PORT, () => {
  console.log(`NELFE web endpoint listening on port ${LISTEN_PORT}`);
});
