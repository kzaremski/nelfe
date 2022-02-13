/*
 * nelfe (Node-Express Library Front End)
 *   A web based portal/front end for consuming locally stored movies, music, and ebooks.
 * 
 * Konstantin Zaremski - 6 February 2022
 * See LICENSE.
 * 
 * auth.js - Authentication handler/router.
 */

const e = require('express');
const express = require('express');
const router = express.Router();

// Login front end
router.get('/', (req, res) => {
  if (req.session.username) req.redirect('/');
});

// Login server actions
router.post('/login', async (req, res) => {
  let response = { code: 500 };
  res.send(JSON.stringify(response));
});

// Logout
router.get('/logout', (req, res) => {
  // Destroy the req.session object and then redirect the user back to the root
  req.session.destroy(function(err) {
    req.redirect('/');
  });
});

module.exports = router;