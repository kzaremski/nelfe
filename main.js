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

//


// Express App Object
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Listen for HTTP requests
app.listen(LISTEN_PORT, () => {
  console.log(`Example app listening on port ${LISTEN_PORT}`);
});