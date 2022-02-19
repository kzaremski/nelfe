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
 *                will change for that specific movie. If the hash is different, it will be
 *                treated as a brand new, separate media item.
 */

// Require dependencies
const path = require('path');
const db = require(path.join(__dirname, 'db.js'));
const fs = require('fs');

// File types
const fileExtensions = {
  movie: ['mkv', 'mp4', 'mov', 'avi'],
  music: ['mp3', 'wav', 'wav'],
  books: ['epub', 'pdf'],
  photo: ['jpg', 'jpeg', 'png'] 
}

// Build the media library in the database
async function parse(rootPath) {
  // Try to access the root path passed to the function
  try { await fs.promises.access(rootPath) } catch {
    // If the fs library can not access the path, do nothing and display the error
    db.log(`[LIBRARIAN] Unable to access "${rootPath}", new library will not be parsed.`, 'error');
    return false;
  }
  
  // Loaded file path
  // Read in everything in that directory
  const rootContents = await fs.promises.readdir(rootPath);
  db.log(`[LIBRARIAN] Loaded source directory "${rootPath}"`);
  
  // Identify where different types of media may be stored
  let moviePath, musicPath, photoPath, bookPath;
  // Words that may be conducive to different folders and types of media
  const fuzzyNames = {
    movie: ['movie', 'video'],
    music: ['music', 'audio', 'song'],
    books: ['book', 'documents', 'epub', 'pdf'],
    photo: ['photo', 'picture'] 
  }
  // For the contents in the root directory
  rootContents.forEach(file => {
    // Log what we see in the directory
    db.log(`[LIBRARIAN] -- ${file.isDirectory() ? '(directory) ' : ''}${path.join(rootPath, file)}`);
    // Assign the paths based on the contents of the directory name
    if (file.isDirectory()) {
      const dirName = file.toLowerCase();      
      if (fuzzyNames.movie.some(fuzzyName => dirName.includes(fuzzyName)) && !moviePath) moviePath = path.join(rootPath, dirName);
      if (fuzzyNames.music.some(fuzzyName => dirName.includes(fuzzyName)) && !musicPath) musicPath = path.join(rootPath, dirName);
      if (fuzzyNames.books.some(fuzzyName => dirName.includes(fuzzyName)) && !bookPath ) bookPath  = path.join(rootPath, dirName);
      if (fuzzyNames.photo.some(fuzzyName => dirName.includes(fuzzyName)) && !photoPath) photoPath = path.join(rootPath, dirName);
    }
  });
  
  // Notify of decisions
  if (moviePath) db.log(`[LIBRARIAN] Assuming MOVIE directory is "${moviePath}"`);
  if (musicPath) db.log(`[LIBRARIAN] Assuming MUSIC directory is "${musicPath}"`);
  if (photoPath) db.log(`[LIBRARIAN] Assuming PHOTO directory is "${photoPath}"`);
  if (bookPath ) db.log(`[LIBRARIAN] Assuming BOOK directory is "${bookPath}"`);
  
  // Read in the contents of the directories
  let mediaContents = {};
  if (moviePath) mediaContents['movie'] = await fs.promises.readdir(moviePath);
  if (musicPath) mediaContents['music'] = await fs.promises.readdir(musicPath);
  if (photoPath) mediaContents['photo'] = await fs.promises.readdir(photoPath);
  if (bookPath ) mediaContents['book']  = await fs.promises.readdir(bookPath);
  
  // Traverse the contents of each of the media directories
  for (const [mediaType, mediaDirectory] of Object.entries(mediaContents)) {
    mediaDirectory.forEach(item => {
      // If it is a directory (usually there will be metadata and supporting imagery in the directory)
      if (item.isDirectory()) {

      // If it is a singular file
      } else {
  
      }
    })
  }
}

// Export the public functions to be used elsewhere
module.exports = { parse };