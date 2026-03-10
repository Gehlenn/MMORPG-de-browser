const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "mmorpg.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id TEXT NOT NULL,
            name TEXT NOT NULL UNIQUE,
            class TEXT NOT NULL DEFAULT 'warrior',
            race TEXT NOT NULL DEFAULT 'human',
            level INTEGER NOT NULL DEFAULT 1,
            x INTEGER NOT NULL DEFAULT 100,
            y INTEGER NOT NULL DEFAULT 100,
            health INTEGER NOT NULL DEFAULT 100,
            max_health INTEGER NOT NULL DEFAULT 100,
            mana INTEGER NOT NULL DEFAULT 50,
            max_mana INTEGER NOT NULL DEFAULT 50,
            exp INTEGER NOT NULL DEFAULT 0,
            exp_to_next INTEGER NOT NULL DEFAULT 100,
            strength INTEGER NOT NULL DEFAULT 10,
            defense INTEGER NOT NULL DEFAULT 5,
            speed INTEGER NOT NULL DEFAULT 8,
            magic INTEGER NOT NULL DEFAULT 3,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Migration: Add missing columns if they don't exist
    db.run(`ALTER TABLE characters ADD COLUMN class TEXT NOT NULL DEFAULT 'warrior'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.log('Column class already exists or error:', err.message);
        }
    });
    
    db.run(`ALTER TABLE characters ADD COLUMN race TEXT NOT NULL DEFAULT 'human'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.log('Column race already exists or error:', err.message);
        }
    });
});

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function onRun(err) {
            if (err) return reject(err);
            return resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            return resolve(row || null);
        });
    });
}

module.exports = {
    run,
    get
};
