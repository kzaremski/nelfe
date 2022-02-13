/*
 * nelfe (Node-Express Library Front End)
 *   A web based portal/front end for consuming locally stored movies, music, and ebooks.
 * 
 * Konstantin Zaremski - 13 February 2022
 * See LICENSE.
 * 
 * librarian.js - Manages the library database. Indexes and caches all of the media in the
 *                library root directory so that it may be served faster than querying the
 *                file system.
 *              - The process starts by getting a list of all the media in the libary. It
 *                will then move to make sure that all of the paths in the database are
 *                still valid, disabling library entries that it can no longer locate.
 *              - Media metadata is organized by the sha hash of the source media, so long
 *                as the hash of a file is the same, changes to the metadata of that movie
 *                will 
 */

// Require dependencies
const db = require('./db.js');
const fs = require('fs');

// Build the media library in the database
async function parse(rootPath) {
  try {
    await fs.promises.access(rootPath);

  } catch(err) {
    db.log(`[LIBRARIAN] ${String(err)}`, 'error');
  }
}

// Export the public functions to be used elsewhere
module.exports = { parse };