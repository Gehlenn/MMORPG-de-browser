/**
 * CharacterDatabase - Manages character persistence in SQLite
 * Handles character data, inventory, stats, and position
 */

class CharacterDatabase {
    constructor(db) {
        this.db = db;
    }

    /**
     * Initialize character tables
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS characters (
                    id TEXT PRIMARY KEY,
                    account_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    class TEXT NOT NULL,
                    level INTEGER DEFAULT 1,
                    experience INTEGER DEFAULT 0,
                    x REAL DEFAULT 400,
                    y REAL DEFAULT 300,
                    zone TEXT DEFAULT 'verdantis',
                    hp INTEGER DEFAULT 100,
                    max_hp INTEGER DEFAULT 100,
                    mp INTEGER DEFAULT 50,
                    max_mp INTEGER DEFAULT 50,
                    strength INTEGER DEFAULT 10,
                    agility INTEGER DEFAULT 10,
                    intelligence INTEGER DEFAULT 10,
                    vitality INTEGER DEFAULT 10,
                    stat_points INTEGER DEFAULT 0,
                    skill_points INTEGER DEFAULT 0,
                    gold INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    play_time INTEGER DEFAULT 0,
                    FOREIGN KEY (account_id) REFERENCES accounts(id)
                );

                CREATE TABLE IF NOT EXISTS character_inventory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    character_id TEXT NOT NULL,
                    item_id TEXT NOT NULL,
                    quantity INTEGER DEFAULT 1,
                    slot INTEGER,
                    equipped BOOLEAN DEFAULT 0,
                    durability INTEGER,
                    stats TEXT,
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS character_skills (
                    character_id TEXT NOT NULL,
                    skill_id TEXT NOT NULL,
                    level INTEGER DEFAULT 1,
                    cooldown_until DATETIME,
                    PRIMARY KEY (character_id, skill_id),
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS character_quests (
                    character_id TEXT NOT NULL,
                    quest_id TEXT NOT NULL,
                    status TEXT DEFAULT 'active',
                    progress TEXT,
                    completed_at DATETIME,
                    PRIMARY KEY (character_id, quest_id),
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_characters_account ON characters(account_id);
                CREATE INDEX IF NOT EXISTS idx_inventory_character ON character_inventory(character_id);
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Create a new character
     */
    async createCharacter(accountId, characterData) {
        return new Promise((resolve, reject) => {
            const id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const {
                name, class: charClass, x = 400, y = 300,
                hp = 100, maxHp = 100, mp = 50, maxMp = 50,
                strength = 10, agility = 10, intelligence = 10, vitality = 10
            } = characterData;

            this.db.run(
                `INSERT INTO characters (
                    id, account_id, name, class, x, y, hp, max_hp, mp, max_mp,
                    strength, agility, intelligence, vitality
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, accountId, name, charClass, x, y, hp, maxHp, mp, maxMp,
                 strength, agility, intelligence, vitality],
                (err) => {
                    if (err) reject(err);
                    else resolve(id);
                }
            );
        });
    }

    /**
     * Get character by ID
     */
    async getCharacter(characterId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM characters WHERE id = ?`,
                [characterId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    /**
     * Get all characters for an account
     */
    async getCharactersByAccount(accountId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM characters WHERE account_id = ? ORDER BY last_login DESC`,
                [accountId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    /**
     * Update character data
     */
    async updateCharacter(characterId, updates) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];

            for (const [key, value] of Object.entries(updates)) {
                if (key === 'maxHp') {
                    fields.push('max_hp = ?');
                } else if (key === 'maxMp') {
                    fields.push('max_mp = ?');
                } else {
                    fields.push(`${key} = ?`);
                }
                values.push(value);
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(characterId);

            this.db.run(
                `UPDATE characters SET ${fields.join(', ')} WHERE id = ?`,
                values,
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Delete a character
     */
    async deleteCharacter(characterId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `DELETE FROM characters WHERE id = ?`,
                [characterId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Get character inventory
     */
    async getInventory(characterId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM character_inventory WHERE character_id = ?`,
                [characterId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    /**
     * Add item to inventory
     */
    async addItem(characterId, item) {
        return new Promise((resolve, reject) => {
            const { itemId, quantity = 1, slot, equipped = false, durability, stats } = item;

            this.db.run(
                `INSERT INTO character_inventory (
                    character_id, item_id, quantity, slot, equipped, durability, stats
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [characterId, itemId, quantity, slot, equipped, durability, stats ? JSON.stringify(stats) : null],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Update item in inventory
     */
    async updateItem(itemId, updates) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];

            for (const [key, value] of Object.entries(updates)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
            values.push(itemId);

            this.db.run(
                `UPDATE character_inventory SET ${fields.join(', ')} WHERE id = ?`,
                values,
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Remove item from inventory
     */
    async removeItem(itemId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `DELETE FROM character_inventory WHERE id = ?`,
                [itemId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Get character count for account
     */
    async getCharacterCount(accountId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT COUNT(*) as count FROM characters WHERE account_id = ?`,
                [accountId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.count || 0);
                }
            );
        });
    }

    /**
     * Update last login
     */
    async updateLastLogin(characterId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE characters SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
                [characterId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
}

module.exports = CharacterDatabase;
