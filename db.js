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
const bcrypt = require('bcrypt');

// DB namespace
let db = {};
db.prepared = false;

/**
 * Database connection function, accepts the database path as a string and returns an sqlite3 database object
 * @param {String} databasePath sqlite3 database path eg. ':memory:' or './test.db'
 * @returns sqlite3 database object
 */
function dbConnect(databasePath) {
  return new sqlite3.Database(databasePath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    , (err) => {
      // If there is an error, output it to the console
      if (err) return console.error(err.message);
    });
}

/**
 * Execute SQL query on the connection object that is provided.
 * @param {*} database sqlite3 database/connection object
 * @param {*} query SQL to be executed
 * @returns A new promise
 */
function dbPromiseExecSQL(database, query) {
  return new Promise((resolve, reject) => { database.all(
    query, // Run the SQL query
    function (err, rows) {
      if (err) reject(err); // Reject promise if there is an error
      else resolve(rows); // Fulfill promise with data if there is no error
    }
  )});
}

/**
 * Hash a password with bcrypt, returns a new Promise.
 * @param {*} password Unhashed, raw password from user input
 * @returns {String} Hashed password
 */
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    // Use the bcrypt library to hash the password, 
    bcrypt.hash(password, 10, function(err, hash) {
      if (err) reject(err);
      resolve(hash);
    });
  });
}

/**
 * Format a JavaScript date object as an SQL DATE or DATETIME
 * @param {Date} date Input JavaScript Date object/class
 * @param {Boolean} isDATETIME Should the time be added to make the formatted date an SQL DATETIME (YYYY-MM-DD HH:MI:SS)
 */
function formatDateSQL(date, isDATETIME) {
  let SQLDate = date.toISOString().slice(0, 10); // YYYY-MM-DD
  if (isDATETIME) SQLDate += date.toISOString().slice(10, 19).replace('T', ' '); // HH:MI:SS
  return SQLDate;
}

/**
 * This function creates tables in the database for user accounts, settings, etc. and populates them with default values for a fresh installation.
 * 
 * TABLES:
 * - USERS (AccountID, AccountName, Password, DisplayName, IsAdmin, IsDisabled, Created, LastLogin)
 * - SETTINGS (Key, Value, Type)
 * 
 * The default user account u:p admin:admin
 */
db.createDefaults = async function() {
  // Connect to the nelfe disk database
  let conn = dbConnect(`${__dirname}/nelfe.db`);
  // Check to see if the accounts table already exists, determined by the results returning rows
  const usersTableExists = ((await dbPromiseExecSQL(
    conn,
    `SELECT name FROM sqlite_master WHERE type='table' AND name='Users';`
  )).length > 0);
  // Create user accounts table if it does not already exist
  if (!usersTableExists) {
    console.log('Users database table does not exist, creating...');
    await dbPromiseExecSQL(
      conn,
      `CREATE TABLE if not exists Users (AccountID INT,
                                         AccountName VARCHAR(50),
                                         Password VARCHAR(4096),
                                         DisplayName VARCHAR(50),
                                         IsAdmin BOOL,
                                         IsDisabled BOOL,
                                         Created DATE,
                                         LastLogin DATETIME);`
    );
    console.log('   DONE!');
    // After the table has been created, populate it with a generic admin user account
    console.log('Creating the initial admin user used for access...');
    console.log('   Username:Password - admin:admin');
    await dbPromiseExecSQL(
      conn,
      `INSERT INTO Users (AccountID,
                          AccountName,
                          Password,
                          DisplayName,
                          IsAdmin,
                          IsDisabled,
                          Created,
                          LastLogin)
                  VALUES (0,
                          'admin',
                          '${await hashPassword('admin')}',
                          'Admin',
                          TRUE,
                          FALSE,
                          '${formatDateSQL(new Date(), false)}',
                          '${formatDateSQL(new Date(0), true)}');`
    );
    console.log('   DONE!');
  }
  // Check to see if the settings table already exists, determined by the results returning rows
  const settingsTableExists = ((await dbPromiseExecSQL(
    conn,
    `SELECT name FROM sqlite_master WHERE type='table' AND name='Settings';`
  )).length > 0);
  // Create user accounts table if it does not already exist
  if (!settingsTableExists) {
    console.log('Settings database table does not exist, creating...');
    await dbPromiseExecSQL(
      conn,
      `CREATE TABLE if not exists Settings (Key VARCHAR(50),
                                            Value VARCHAR(4096),
                                            Type VARCHAR(16));`
    );
    // After the table has been created, populate it with the default values/settings
    await dbPromiseExecSQL(conn, `INSERT INTO Settings VALUES('LISTEN_PORT', '3080', 'number');`);
    console.log('   DONE!');
  }
  // Close the database connection
  conn.close((err) => { if (err) console.log(err.message) });
  return true;
}

/**
 * Get all system/app settings from the database and return them as a JSON
 */
db.getSettings = async function() {
  // Connect to the database
  let conn = dbConnect(`${__dirname}/nelfe.db`);
  let settings = {};
  // Get all settings entries in the database
  const settingsRows = await dbPromiseExecSQL(conn, `SELECT * FROM Settings;`);
  // Loop through the settings returned by the database and build the settings object
  settingsRows.forEach(setting => {
    let parsedValue;
    // Parse the value based on the type
    switch (setting.Type) {
      case 'string':
        parsedValue = String(setting.Value);
      case 'number':
        parsedValue = parseInt(setting.Value);
      case 'date':
        parsedValue = new Date(setting.Value);
      case 'object':
        parsedValue = JSON.parse(setting.Value);
    }
    settings[setting.Key] = parsedValue;
  });
  // Close the database connection
  conn.close((err) => { if (err) console.log(err.message) });
  // Return the settings object
  console.log(settings)
  return settings;
}

/**
 * 
 * @param {Object} settings Settings object. Object keys correspond to the setting_key in the database.
 */
db.saveSettings = async function(settings) {
  return;
}


module.exports = db;