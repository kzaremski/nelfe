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

// Database controller
const db = require('./db.js');

// Express App Object
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Prepare
async function prepare() {
  // Create default database tables with all of their values if they do not already exist
  await db.createDefaults();
  // Set settings based on the settings database table
  let LISTEN_PORT = await db.getSettings()['LISTEN_PORT'];
  // Listen for HTTP requests
  app.listen(LISTEN_PORT, () => {
    console.log(`Example app listening on port ${LISTEN_PORT}`);
  });
}

prepare();