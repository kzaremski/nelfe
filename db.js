/*
 * nelfe (Node-Express Library Front End)
 *   A web based portal/front end for consuming locally stored movies, music, and ebooks.
 * 
 * Licensed under the MIT license. 
 * Konstantin Zaremski - 6 February 2022
 * 
 * db.js - Database controller file. Database connection and repetetive operations are performed 
 */

// Require dependencies
const sqlite3 = require('sqlite3').verbose();

let db = {};

/**
 * Database connection function, accepts the database path as a string and returns an sqlite3 database object
 * @param {String} databasePath sqlite3 database path eg. ':memory:' or './test.db'
 * @returns sqlite3 database object
 */
function dbConnect(databasePath) {
  return new sqlite3.Database(databasePath, sqlite3.OPEN_READWRITE, (err) => {
    // If there is an error, output it to the console
    if (err) return console.error(err.message);
  });
}

/**
 * This function creates tables in the database for user accounts, settings, etc. and populates them with default values for a fresh installation.
 * 
 * TABLES:
 * - USERS
 * - SETTINGS
 * 
 * The default user account u:p admin:admin
 */
function dbCreateDefaults() {
  // Connect to the nelfe disk database
  let conn = dbConnect('./nelfe.db');
  // Create user accounts table
  conn.'CREATE TABLE if not exists Settings (AccountID INT, AccountName VARCHAR(50), DisplayName VARCHAR(50), IsAdmin BOOL, IsDisabled BOOL, )'
  // Close the database connection
  conn.close((err) => {
    if (err) console.log(err.message)
  });
  return true;
}

// Create default database tables with all of their values if they do not already exist
dbCreateDefaults();

export default db;