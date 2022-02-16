/*
 * nelfe (Node-Express Library Front End)
 *   A web based portal/front end for consuming locally stored movies, music, and ebooks.
 * 
 * Konstantin Zaremski - 6 February 2022
 * See LICENSE.
 * 
 * db.js - Database controller file. Database connection and repetetive operations are performed 
 */

// Require dependencies
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// DB namespace
let db = {};
db['user'] = {};
db['settings'] = {};

/**
 * Database connection function, accepts the database path as a string and returns an sqlite3 database object
 * @param {String} databasePath sqlite3 database path eg. ':memory:' or './test.db'
 * @returns sqlite3 database object
 */
function dbConnect(databasePath) {
  return new sqlite3.Database(databasePath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
      // If there is an error, output it to the console
      if (err) return console.error(err.message);
    }
  );
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
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    // Use the bcrypt library to hash the password, 
    bcrypt.hash(password, 10, function(err, hash) {
      if (err) reject(err);
      resolve(hash);
    });
  });
}

/**
 * Compare a user-inputted password to a hashed password and return a boolean value.
 * @param {String} password String of raw user input password to be compared
 * @param {String} hashed String of hashed password
 * @returns A boolean, true for correct passwords, false for incorrect passwords or other errors
 */
function comparePassword(password, hashed) {
  return new Promise(function(resolve, reject) {
      bcrypt.compare(password, hashed, function(err, res) {
          if (err) {
               reject(false);
          } else {
               resolve(true);
          }
      });
  });
}

/**
 * Escapes potentiall dangerous characters with backslashes, to be used in SQL statements.
 * @param {String} str Input string
 * @returns String with all characters that are potentially dangerous to SQL escaped with backslashes
 */
function mysql_real_escape_string (str) {
  if (typeof str != 'string') return str; // If the inputted value is not a string, just return that value
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
      switch (char) {
          case "\0":
              return "\\0";
          case "\x08":
              return "\\b";
          case "\x09":
              return "\\t";
          case "\x1a":
              return "\\z";
          case "\n":
              return "\\n";
          case "\r":
              return "\\r";
          case "\"": // Fall through to case "%"
          case "'":  // Fall through to case "%"
          case "\\": // Fall through to case "%"
          case "%":  // Fall through to case "%"
              return "\\" + char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
      }
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
  // Check to see if the Logs table already exists, determined by the results returning rows
  const logTableExists = ((await dbPromiseExecSQL(
    conn,
    `SELECT name FROM sqlite_master WHERE type='table' AND name='Logs';`
  )).length > 0);
  if (!logTableExists) {
    console.log('Logs database table does not exist, creating...');
    await dbPromiseExecSQL(
      conn,
      `CREATE TABLE if not exists Logs (UUID VARCHAR(128),
                                        DateTime DATETIME,
                                        Level VARCHAR(16),
                                        Message VARCHAR(4096));`
    );
    console.log('   DONE!');
  }
  // Close the database connection
  conn.close((err) => { if (err) console.log(err.message) });
  return true;
}

/**
 * Write a log entry to the log database
 * @param {String} message The message to be logged
 * @param {String} level The type or level of message to log, default: INFO
 * @param {Boolean} suppressOutput True: do not console.log or console.error the message
 */
db.log = async function (message, level, suppressOutput) {
  try {
    if (!message) return console.error('Error (db.log): Log message can not be undefined');
    const logLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];
    if (!level) level = 'INFO'; // If no log level is provided, default to INFO
    // If the supplied log level is not a valid log level, default to INFO
    if (!logLevels.includes(level.toUpperCase())) {
      level = 'INFO';
      console.error('Error (db.log): Supplied log level is not valid, defaulting to "INFO"');
    }
    // Connect to the database
    let conn = dbConnect(`${__dirname}/nelfe.db`);
    const logDate = new Date();
    // Insert the log in to the database
    await dbPromiseExecSQL(
      conn,
      `INSERT INTO Logs (UUID,
                         DateTime,
                         Level,
                         Message)
                 VALUES ('${crypto.randomUUID()}',
                         '${formatDateSQL(logDate, true)}',
                         '${level.toUpperCase()}',
                         '${mysql_real_escape_string(message)}');`
    );
    // If the console output is not suppressed, console
    if (!suppressOutput) {
      // Create a friendly output for the console that includes the same DateTime
      const consoleOutput = `[${formatDateSQL(logDate, true)}]${message}`;
      // Different console output types based on the log level
      switch (level.toUpperCase()) {
        case 'DEBUG':
          console.debug(consoleOutput);
        case 'INFO':
          console.log(consoleOutput);
        case 'WARNING':
          console.warn(consoleOutput);
        case 'ERROR':
          console.error(consoleOutput);
        default:
          console.log(consoleOutput);
      }
    }
    // Close the database connection
    conn.close((err) => { if (err) console.log(err.message) });
    return true;
  } catch(err) {
    return console.error(`Error: ${err}`);
  }
}

/**
 * Authenticate a user based on their username and password from form input.
 * @param {String} username Username from form input
 * @param {String} password Password from form input
 * @returns {Number} Returns an error code based on the response and issues, zero for success
 */
db.user.authenticate = async function(username, password) {
  return new Promise((resolve, reject) => {
    // Select all from Users table with the passed username
    const accounts = await dbPromiseExecSQL(
      conn,
      `SELECT * FROM Users WHERE AccountName='${mysql_real_escape_string(username)}';`
    );
    // If there is one row returned then the account exists
    const accountExists = (accounts.length === 1);
    if (!accountExists) reject(1); // If the account does not exist, reject with error code 1
    // Select the account object from the single row returned by the database
    const account = accounts[0];
    try {
      // Hash the user-inputted password and compare that hash against the one in the account
      await comparePassword(password, account.Passowrd); 
    } catch {
      reject(2); // Password is incorrect, response code 2
    }
    resolve(0); // User exists and password is correct, response code 0
  });
}

/**
 * Get all system/app settings from the database and return them as a JSON
 * @returns {Object} All settings key/values
 */
db.settings.get = async function() {
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
        break;
      case 'number':
        parsedValue = Setting.value.includes('.') ? parseFloat(setting.Value) : parseInt(setting.Value);
        break;
      case 'date':
        parsedValue = new Date(setting.Value);
        break;
      case 'object':
        parsedValue = JSON.parse(setting.Value);
        break;
      default:
        parsedValue = String(setting.Value);
        break;
    }
    settings[setting.Key] = parsedValue;
  });
  // Close the database connection
  conn.close((err) => { if (err) console.log(err.message) });
  // Return the settings object
  console.log(settings);
  return settings;
}

/**
 * Save the key value pairs passed to the function in the database
 * @param {Object} settings Settings object. Object keys correspond to the setting_key in the database.
 */
db.settings.save = async function(settings) {
  // If there are no settings passed to save, return and do nothing
  if (Object.keys(settings).length === 0) return false;
  // Connect to the database
  let conn = dbConnect(`${__dirname}/nelfe.db`);
  // For each entrie (key/value pair) in the provided settings object
  for (const [key, value] of Object.entries(settings)) {
    // Variables synonymous to those in SQL
    const Key = key;
    let Value;
    let Type;
    // Set the type and format the value
    switch (typeof value) {
      case 'string':
        Value = mysql_real_escape_string(value);
        Type = 'string';
        break;
      case 'number':
        Value = String(value);
        Type = 'number';
        break;
      case 'object':
        // Dates will also have the typeof as object
        if (value instanceof Date) {
          // If the value is a JS date then the type is a date
          Value = value.toUTCString();
          Type = 'date';
        } else {
          // Otherwise stringify and store as JSON
          Value = mysql_real_escape_string(JSON.stringify(value));
          Type = 'object';
        };
        break;
      default:
        // Other types will be stored as strings
        Value = String(mysql_real_escape_string(value));
        Type = 'string';
        break;
    }
    // Replace into in order to either add or replace existing rows in the database
    await dbPromiseExecSQL(
      conn,
      `REPLACE INTO Settings (Key, Value, Type) values('${Key}', '${Value}', '${Type}');`
    );
  }
  // Close the database connection
  conn.close((err) => { if (err) console.log(err.message) });
}


module.exports = db;