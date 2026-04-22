/**
 * PrivateChatSystem - Manages private messaging between players
 * Handles whisper/tell commands, chat history, and blocking
 */

class PrivateChatSystem {
    constructor(db, friendSystem) {
        this.db = db;
        this.friendSystem = friendSystem;
        this.messageCache = new Map(); // In-memory recent messages
        this.CACHE_SIZE = 100;
        this.MAX_HISTORY_DAYS = 30;
    }

    /**
     * Initialize private chat system
     */
    async initialize() {
        await this.createTables();
        this.startCleanupInterval();
        console.log('[PrivateChatSystem] Initialized');
    }

    /**
     * Create chat tables
     */
    async createTables() {
        return new Promise((resolve, reject) => {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS private_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sender_id TEXT NOT NULL,
                    receiver_id TEXT NOT NULL,
                    message TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT 0,
                    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    sender_deleted BOOLEAN DEFAULT 0,
                    receiver_deleted BOOLEAN DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS chat_blocked (
                    blocker_id TEXT NOT NULL,
                    blocked_id TEXT NOT NULL,
                    blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    reason TEXT,
                    PRIMARY KEY (blocker_id, blocked_id)
                );

                CREATE TABLE IF NOT EXISTS chat_settings (
                    account_id TEXT PRIMARY KEY,
                    allow_whispers_from TEXT DEFAULT 'friends',
                    allow_party_invites BOOLEAN DEFAULT 1,
                    allow_guild_invites BOOLEAN DEFAULT 1,
                    auto_decline_strangers BOOLEAN DEFAULT 0,
                    sound_notifications BOOLEAN DEFAULT 1
                );

                CREATE INDEX IF NOT EXISTS idx_messages_sender ON private_messages(sender_id);
                CREATE INDEX IF NOT EXISTS idx_messages_receiver ON private_messages(receiver_id);
                CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON private_messages(sent_at);
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Send a whisper/private message
     */
    async sendWhisper(senderId, senderName, receiverUsername, message) {
        try {
            // Validate message
            if (!message || message.trim().length === 0) {
                return { success: false, error: 'Message cannot be empty' };
            }

            if (message.length > 500) {
                return { success: false, error: 'Message too long (max 500 characters)' };
            }

            // Get receiver account
            const receiver = await this.getAccountByUsername(receiverUsername);
            if (!receiver) {
                return { success: false, error: 'Player not found' };
            }

            // Check if blocked
            const isBlocked = await this.isBlocked(receiver.id, senderId);
            if (isBlocked) {
                return { success: false, error: 'Message could not be delivered' };
            }

            // Check receiver settings
            const canReceive = await this.canReceiveWhispers(receiver.id, senderId);
            if (!canReceive) {
                return { success: false, error: 'Player is not accepting messages' };
            }

            // Save message to database
            const messageId = await this.saveMessage(senderId, receiver.id, message);

            // Try to deliver immediately if online
            const delivered = await this.deliverMessage(receiver.id, {
                id: messageId,
                sender: { id: senderId, username: senderName },
                message: message,
                timestamp: Date.now()
            });

            // Cache for quick retrieval
            this.cacheMessage(senderId, receiver.id, {
                id: messageId,
                senderId,
                receiverId: receiver.id,
                message,
                timestamp: Date.now(),
                delivered
            });

            return {
                success: true,
                delivered,
                messageId
            };
        } catch (error) {
            console.error('[PrivateChatSystem] Whisper error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deliver message to online player
     */
    async deliverMessage(receiverId, messageData) {
        const receiver = this.friendSystem?.onlinePlayers?.get(receiverId);
        if (!receiver || !receiver.socket) {
            return false;
        }

        receiver.socket.emit('chat:whisper', messageData);
        return true;
    }

    /**
     * Get conversation between two players
     */
    async getConversation(user1, user2, limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    m.id,
                    m.sender_id,
                    s.username as sender_name,
                    m.message,
                    m.is_read,
                    m.sent_at,
                    CASE WHEN m.sender_id = ? THEN 1 ELSE 0 END as is_mine
                FROM private_messages m
                JOIN accounts s ON m.sender_id = s.id
                WHERE (
                    (m.sender_id = ? AND m.receiver_id = ? AND m.sender_deleted = 0)
                    OR (m.sender_id = ? AND m.receiver_id = ? AND m.receiver_deleted = 0)
                )
                ORDER BY m.sent_at DESC
                LIMIT ? OFFSET ?
            `, [user1, user1, user2, user2, user1, limit, offset], async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Mark messages as read
                await this.markAsRead(user1, user2);

                resolve((rows || []).reverse().map(row => ({
                    id: row.id,
                    senderId: row.sender_id,
                    senderName: row.sender_name,
                    message: row.message,
                    isRead: row.is_read,
                    timestamp: row.sent_at,
                    isMine: row.is_mine === 1
                })));
            });
        });
    }

    /**
     * Get conversation list for a player
     */
    async getConversations(accountId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                WITH recent_messages AS (
                    SELECT 
                        CASE 
                            WHEN sender_id = ? THEN receiver_id 
                            ELSE sender_id 
                        END as other_id,
                        message,
                        sent_at,
                        is_read,
                        sender_id
                    FROM private_messages
                    WHERE (sender_id = ? AND sender_deleted = 0)
                       OR (receiver_id = ? AND receiver_deleted = 0)
                    ORDER BY sent_at DESC
                )
                SELECT 
                    r.other_id,
                    a.username as other_name,
                    r.message as last_message,
                    r.sent_at as last_message_time,
                    r.is_read,
                    r.sender_id,
                    COUNT(CASE WHEN m.is_read = 0 AND m.receiver_id = ? THEN 1 END) as unread_count
                FROM recent_messages r
                JOIN accounts a ON r.other_id = a.id
                LEFT JOIN private_messages m ON 
                    (m.sender_id = r.other_id AND m.receiver_id = ? AND m.is_read = 0)
                GROUP BY r.other_id, a.username
                ORDER BY r.sent_at DESC
            `, [accountId, accountId, accountId, accountId, accountId], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve((rows || []).map(row => ({
                    id: row.other_id,
                    username: row.other_name,
                    lastMessage: row.last_message,
                    lastMessageTime: row.last_message_time,
                    unreadCount: row.unread_count,
                    isOnline: this.friendSystem?.onlinePlayers?.has(row.other_id) || false
                })));
            });
        });
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(accountId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT COUNT(*) as count 
                FROM private_messages 
                WHERE receiver_id = ? AND is_read = 0 AND receiver_deleted = 0
            `, [accountId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row?.count || 0);
            });
        });
    }

    /**
     * Mark messages as read
     */
    async markAsRead(readerId, senderId) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE private_messages
                SET is_read = 1
                WHERE receiver_id = ? AND sender_id = ? AND is_read = 0
            `, [readerId, senderId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Delete conversation
     */
    async deleteConversation(accountId, otherId) {
        return new Promise((resolve, reject) => {
            // Mark messages as deleted for this user only
            this.db.run(`
                UPDATE private_messages
                SET sender_deleted = CASE WHEN sender_id = ? THEN 1 ELSE sender_deleted END,
                    receiver_deleted = CASE WHEN receiver_id = ? THEN 1 ELSE receiver_deleted END
                WHERE (sender_id = ? AND receiver_id = ?)
                   OR (sender_id = ? AND receiver_id = ?)
            `, [accountId, accountId, accountId, otherId, otherId, accountId], (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Clean up fully deleted messages
                this.db.run(`
                    DELETE FROM private_messages
                    WHERE sender_deleted = 1 AND receiver_deleted = 1
                `);

                resolve({ success: true });
            });
        });
    }

    /**
     * Delete specific message
     */
    async deleteMessage(accountId, messageId) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE private_messages
                SET sender_deleted = CASE WHEN sender_id = ? THEN 1 ELSE sender_deleted END,
                    receiver_deleted = CASE WHEN receiver_id = ? THEN 1 ELSE receiver_deleted END
                WHERE id = ?
            `, [accountId, accountId, messageId], (err) => {
                if (err) reject(err);
                else resolve({ success: true });
            });
        });
    }

    /**
     * Block a player
     */
    async blockPlayer(blockerId, blockedUsername, reason = '') {
        try {
            const blocked = await this.getAccountByUsername(blockedUsername);
            if (!blocked) {
                return { success: false, error: 'Player not found' };
            }

            if (blocked.id === blockerId) {
                return { success: false, error: 'Cannot block yourself' };
            }

            await this.addBlock(blockerId, blocked.id, reason);

            return { success: true, blockedId: blocked.id };
        } catch (error) {
            console.error('[PrivateChatSystem] Block error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unblock a player
     */
    async unblockPlayer(blockerId, blockedId) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                DELETE FROM chat_blocked
                WHERE blocker_id = ? AND blocked_id = ?
            `, [blockerId, blockedId], (err) => {
                if (err) reject(err);
                else resolve({ success: true });
            });
        });
    }

    /**
     * Get blocked list
     */
    async getBlockedList(blockerId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT b.blocked_id, a.username, b.blocked_at, b.reason
                FROM chat_blocked b
                JOIN accounts a ON b.blocked_id = a.id
                WHERE b.blocker_id = ?
                ORDER BY b.blocked_at DESC
            `, [blockerId], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve((rows || []).map(row => ({
                    id: row.blocked_id,
                    username: row.username,
                    blockedAt: row.blocked_at,
                    reason: row.reason
                })));
            });
        });
    }

    /**
     * Get chat settings
     */
    async getSettings(accountId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM chat_settings WHERE account_id = ?
            `, [accountId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!row) {
                    // Create default settings
                    this.db.run(`
                        INSERT INTO chat_settings (account_id)
                        VALUES (?)
                    `, [accountId]);

                    resolve({
                        allowWhispersFrom: 'friends',
                        allowPartyInvites: true,
                        allowGuildInvites: true,
                        autoDeclineStrangers: false,
                        soundNotifications: true
                    });
                    return;
                }

                resolve({
                    allowWhispersFrom: row.allow_whispers_from,
                    allowPartyInvites: row.allow_party_invites === 1,
                    allowGuildInvites: row.allow_guild_invites === 1,
                    autoDeclineStrangers: row.auto_decline_strangers === 1,
                    soundNotifications: row.sound_notifications === 1
                });
            });
        });
    }

    /**
     * Update chat settings
     */
    async updateSettings(accountId, settings) {
        return new Promise((resolve, reject) => {
            const {
                allowWhispersFrom,
                allowPartyInvites,
                allowGuildInvites,
                autoDeclineStrangers,
                soundNotifications
            } = settings;

            this.db.run(`
                INSERT OR REPLACE INTO chat_settings (
                    account_id, allow_whispers_from, allow_party_invites,
                    allow_guild_invites, auto_decline_strangers, sound_notifications
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                accountId,
                allowWhispersFrom,
                allowPartyInvites ? 1 : 0,
                allowGuildInvites ? 1 : 0,
                autoDeclineStrangers ? 1 : 0,
                soundNotifications ? 1 : 0
            ], (err) => {
                if (err) reject(err);
                else resolve({ success: true });
            });
        });
    }

    /**
     * Helper: Check if player is blocked
     */
    async isBlocked(receiverId, senderId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT 1 FROM chat_blocked
                WHERE blocker_id = ? AND blocked_id = ?
            `, [receiverId, senderId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(!!row);
            });
        });
    }

    /**
     * Helper: Check if player can receive whispers
     */
    async canReceiveWhispers(receiverId, senderId) {
        const settings = await this.getSettings(receiverId);

        if (settings.allowWhispersFrom === 'everyone') {
            return true;
        }

        if (settings.allowWhispersFrom === 'friends') {
            // Check if sender is friend
            const friendship = await this.friendSystem?.getFriendship(receiverId, senderId);
            return friendship && friendship.status === 'accepted';
        }

        if (settings.allowWhispersFrom === 'none') {
            return false;
        }

        return true;
    }

    /**
     * Helper: Save message to database
     */
    async saveMessage(senderId, receiverId, message) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO private_messages (sender_id, receiver_id, message)
                VALUES (?, ?, ?)
            `, [senderId, receiverId, message], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    /**
     * Helper: Cache message in memory
     */
    cacheMessage(senderId, receiverId, message) {
        const cacheKey = `${senderId}:${receiverId}`;
        if (!this.messageCache.has(cacheKey)) {
            this.messageCache.set(cacheKey, []);
        }

        const cache = this.messageCache.get(cacheKey);
        cache.push(message);

        // Keep cache size limited
        if (cache.length > this.CACHE_SIZE) {
            cache.shift();
        }
    }

    /**
     * Helper: Get account by username
     */
    async getAccountByUsername(username) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT id, username FROM accounts WHERE username = ?
            `, [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Helper: Add block record
     */
    async addBlock(blockerId, blockedId, reason) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO chat_blocked (blocker_id, blocked_id, reason)
                VALUES (?, ?, ?)
            `, [blockerId, blockedId, reason], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Cleanup old messages periodically
     */
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupOldMessages();
        }, 24 * 60 * 60 * 1000); // Daily
    }

    /**
     * Delete messages older than MAX_HISTORY_DAYS
     */
    async cleanupOldMessages() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.MAX_HISTORY_DAYS);

        return new Promise((resolve, reject) => {
            this.db.run(`
                DELETE FROM private_messages
                WHERE sent_at < ?
                AND (sender_deleted = 1 OR receiver_deleted = 1)
            `, [cutoff.toISOString()], (err) => {
                if (err) {
                    console.error('[PrivateChatSystem] Cleanup error:', err);
                    reject(err);
                } else {
                    console.log('[PrivateChatSystem] Cleaned up old messages');
                    resolve();
                }
            });
        });
    }
}

module.exports = PrivateChatSystem;
