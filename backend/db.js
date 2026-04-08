const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_URL || 'libsql://twittur-clawgrabsol.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN,
});

async function init() {
  await db.executeMultiple(`
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
  console.log('DB initialized');
}

// Helper: run a query and return rows as plain objects
async function query(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows.map(row => {
    const obj = {};
    result.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

// Helper: get first row or null
async function get(sql, args = []) {
  const rows = await query(sql, args);
  return rows[0] || null;
}

// Helper: run insert/update/delete
async function run(sql, args = []) {
  const result = await db.execute({ sql, args });
  return { lastInsertRowid: Number(result.lastInsertRowid), changes: result.rowsAffected };
}

module.exports = { init, query, get, run };
