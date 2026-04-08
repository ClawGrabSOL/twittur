// Uses Node.js built-in sqlite (v22.5+) — no npm package needed, no compilation
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'twittur.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    pfp_url TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS twuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER NOT NULL,
    twut_id INTEGER NOT NULL,
    PRIMARY KEY(user_id, twut_id)
  );
`);

// Migrations
try { db.exec('ALTER TABLE users ADD COLUMN display_name TEXT DEFAULT NULL'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN pfp_url TEXT DEFAULT NULL'); } catch {}
try { db.exec('ALTER TABLE twuts ADD COLUMN retwut_of_id INTEGER DEFAULT NULL'); } catch {}

// Follows table
db.exec(`
  CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(follower_id, following_id)
  );
`);

// Retwuts table
db.exec(`
  CREATE TABLE IF NOT EXISTS retwuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    twut_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, twut_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(twut_id) REFERENCES twuts(id)
  );
`);

module.exports = db;
