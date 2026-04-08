const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Use /app/data on Railway, local dir otherwise
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'twittur.db');
console.log('DB path:', dbPath);

const db = new DatabaseSync(dbPath);

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
    retwut_of_id INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER NOT NULL,
    twut_id INTEGER NOT NULL,
    PRIMARY KEY(user_id, twut_id)
  );
  CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(follower_id, following_id)
  );
  CREATE TABLE IF NOT EXISTS retwuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    twut_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, twut_id)
  );
`);

function plain(obj) {
  if (!obj) return obj;
  return Object.assign({}, obj);
}

module.exports = {
  prepare: (sql) => db.prepare(sql),
  plain,
};
