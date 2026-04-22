/**
 * AccountDatabase - Manages player accounts in SQLite
 * Handles authentication, sessions, and account data
 */

const crypto = require('crypto');

class AccountDatabase {
    constructor(db) {
        this.db = db;
    }

    /**
     * Initialize account tables
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS accounts (
                    id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    is_active BOOLEAN DEFAULT 1,
                    is_banned BOOLEAN DEFAULT 0,
                    ban_reason TEXT,
                    premium_until DATETIME,
                    total_playtime INTEGER DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    account_id TEXT NOT NULL,
                    token TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME NOT NULL,
                    ip_address TEXT,
                    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS login_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id TEXT NOT NULL,
                    login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    success BOOLEAN,
                    failure_reason TEXT,
                    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
                CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
                CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
                CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Hash password with salt
     */
    hashPassword(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    }

    /**
     * Generate random salt
     */
    generateSalt() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Create a new account
     */
    async createAccount(username, email, password) {
        return new Promise((resolve, reject) => {
            // Check if username or email already exists
            this.db.get(
                `SELECT username, email FROM accounts WHERE username = ? OR email = ?`,
                [username, email],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (row) {
                        if (row.username === username) {
                            reject(new Error('Username already exists'));
                        } else {
                            reject(new Error('Email already exists'));
                        }
                        return;
                    }

                    // Create account
                    const id = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const salt = this.generateSalt();
                    const passwordHash = this.hashPassword(password, salt);

                    this.db.run(
                        `INSERT INTO accounts (id, username, email, password_hash, salt)
                         VALUES (?, ?, ?, ?, ?)`,
                        [id, username, email, passwordHash, salt],
                        (err) => {
                            if (err) reject(err);
                            else resolve({ id, username, email });
                        }
                    );
                }
            );
        });
    }

    /**
     * Authenticate account
     */
    async authenticate(username, password) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM accounts WHERE username = ? AND is_active = 1 AND is_banned = 0`,
                [username],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve({ success: false, error: 'Invalid username or password' });
                        return;
                    }

                    const passwordHash = this.hashPassword(password, row.salt);
                    if (passwordHash !== row.password_hash) {
                        resolve({ success: false, error: 'Invalid username or password' });
                        return;
                    }

                    resolve({
                        success: true,
                        account: {
                            id: row.id,
                            username: row.username,
                            email: row.email,
                            createdAt: row.created_at,
                            premiumUntil: row.premium_until
                        }
                    });
                }
            );
        });
    }

    /**
     * Get account by ID
     */
    async getAccount(accountId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT id, username, email, created_at, last_login, premium_until, total_playtime
                 FROM accounts WHERE id = ?`,
                [accountId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    /**
     * Get account by username
     */
    async getAccountByUsername(username) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT id, username, email, created_at, last_login, premium_until, total_playtime
                 FROM accounts WHERE username = ?`,
                [username],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    /**
     * Update last login
     */
    async updateLastLogin(accountId, ipAddress = null) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE accounts SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
                [accountId],
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Add to login history
                    this.db.run(
                        `INSERT INTO login_history (account_id, ip_address, success)
                         VALUES (?, ?, ?)`,
                        [accountId, ipAddress, true],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                }
            );
        });
    }

    /**
     * Create session
     */
    async createSession(accountId, ipAddress = null) {
        return new Promise((resolve, reject) => {
            const id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            this.db.run(
                `INSERT INTO sessions (id, account_id, token, expires_at, ip_address)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, accountId, token, expiresAt.toISOString(), ipAddress],
                (err) => {
                    if (err) reject(err);
                    else resolve({ id, token, expiresAt });
                }
            );
        });
    }

    /**
     * Validate session
     */
    async validateSession(token) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT s.id, s.account_id, s.expires_at, a.username, a.email
                 FROM sessions s
                 JOIN accounts a ON s.account_id = a.id
                 WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
                 AND a.is_active = 1 AND a.is_banned = 0`,
                [token],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve({ valid: false });
                        return;
                    }

                    resolve({
                        valid: true,
                        sessionId: row.id,
                        accountId: row.account_id,
                        username: row.username,
                        email: row.email
                    });
                }
            );
        });
    }

    /**
     * Revoke session
     */
    async revokeSession(sessionId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `DELETE FROM sessions WHERE id = ?`,
                [sessionId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Revoke all sessions for account
     */
    async revokeAllSessions(accountId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `DELETE FROM sessions WHERE account_id = ?`,
                [accountId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Change password
     */
    async changePassword(accountId, oldPassword, newPassword) {
        return new Promise((resolve, reject) => {
            // Verify old password
            this.db.get(
                `SELECT salt, password_hash FROM accounts WHERE id = ?`,
                [accountId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve({ success: false, error: 'Account not found' });
                        return;
                    }

                    const oldHash = this.hashPassword(oldPassword, row.salt);
                    if (oldHash !== row.password_hash) {
                        resolve({ success: false, error: 'Invalid current password' });
                        return;
                    }

                    // Update password
                    const newSalt = this.generateSalt();
                    const newHash = this.hashPassword(newPassword, newSalt);

                    this.db.run(
                        `UPDATE accounts SET password_hash = ?, salt = ? WHERE id = ?`,
                        [newHash, newSalt, accountId],
                        (err) => {
                            if (err) reject(err);
                            else {
                                // Revoke all sessions for security
                                this.revokeAllSessions(accountId);
                                resolve({ success: true });
                            }
                        }
                    );
                }
            );
        });
    }

    /**
     * Update playtime
     */
    async updatePlaytime(accountId, minutes) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE accounts SET total_playtime = total_playtime + ? WHERE id = ?`,
                [minutes, accountId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Check if username is available
     */
    async isUsernameAvailable(username) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT 1 FROM accounts WHERE username = ?`,
                [username],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(!row);
                }
            );
        });
    }

    /**
     * Check if email is available
     */
    async isEmailAvailable(email) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT 1 FROM accounts WHERE email = ?`,
                [email],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(!row);
                }
            );
        });
    }

    /**
     * Ban account
     */
    async banAccount(accountId, reason) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE accounts SET is_banned = 1, ban_reason = ? WHERE id = ?`,
                [reason, accountId],
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Revoke all sessions
                    this.revokeAllSessions(accountId);
                    resolve();
                }
            );
        });
    }

    /**
     * Get login history
     */
    async getLoginHistory(accountId, limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT login_at, ip_address, success, failure_reason
                 FROM login_history
                 WHERE account_id = ?
                 ORDER BY login_at DESC
                 LIMIT ?`,
                [accountId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }
}

module.exports = AccountDatabase;
