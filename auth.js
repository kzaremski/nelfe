/*
 * nelfe (Node-Express Library Front End)
 *   A web based portal/front end for consuming locally stored movies, music, and ebooks.
 * 
 * Konstantin Zaremski - 6 February 2022
 * See LICENSE.
 * 
 * auth.js - Authentication handler/router.
 */

const express = require('express');
const router = express.Router();

// Login front end
router.get('/login', (req, res) => {
  res.send('Login FE');
});

// Login server actions
router.post('/login', (req, res) => {
  res.send('Login');
});

// Logout
router.get('/logout', (req, res) => {
  res.send('About birds');
});

module.exports = router