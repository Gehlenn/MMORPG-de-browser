/**
 * FriendSystem - Manages player friendships, status, and interactions
 * Handles friend requests, friend list, and online status
 */

class FriendSystem {
    constructor(db, characterPersistence) {
        this.db = db;
        this.characterPersistence = characterPersistence;
        this.onlinePlayers = new Map(); // accountId -> { characterId, socket, status }
        this.statusUpdateInterval = null;
    }

    /**
     * Initialize friend system
     */
    async initialize() {
        await this.createTables();
        this.startStatusUpdates();
        console.log('[FriendSystem] Initialized');
    }

    /**
     * Create friend tables
     */
    async createTables() {
        return new Promise((resolve, reject) => {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS friendships (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    requester_id TEXT NOT NULL,
                    addressee_id TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    accepted_at DATETIME,
                    UNIQUE(requester_id, addressee_id)
                );

                CREATE TABLE IF NOT EXISTS friend_groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    color TEXT DEFAULT '#4CAF50',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS friend_group_members (
                    group_id INTEGER NOT NULL,
                    friend_id TEXT NOT NULL,
                    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (group_id, friend_id),
                    FOREIGN KEY (group_id) REFERENCES friend_groups(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS friend_notes (
                    account_id TEXT NOT NULL,
                    friend_id TEXT NOT NULL,
                    note TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (account_id, friend_id)
                );

                CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
                CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Player comes online
     */
    playerOnline(accountId, characterId, socket, characterData) {
        this.onlinePlayers.set(accountId, {
            characterId,
            socket,
            status: 'online',
            level: characterData?.level || 1,
            zone: characterData?.zone || 'unknown',
            class: characterData?.class || 'unknown'
        });

        // Notify friends
        this.notifyFriendsStatusChange(accountId, 'online');

        // Send friend list with online status
        this.sendFriendList(accountId, socket);

        console.log(`[FriendSystem] Player ${accountId} is now online`);
    }

    /**
     * Player goes offline
     */
    playerOffline(accountId) {
        const player = this.onlinePlayers.get(accountId);
        if (!player) return;

        // Notify friends
        this.notifyFriendsStatusChange(accountId, 'offline');

        this.onlinePlayers.delete(accountId);
        console.log(`[FriendSystem] Player ${accountId} is now offline`);
    }

    /**
     * Update player status
     */
    updateStatus(accountId, status, data = {}) {
        const player = this.onlinePlayers.get(accountId);
        if (!player) return;

        player.status = status;
        if (data.level) player.level = data.level;
        if (data.zone) player.zone = data.zone;

        this.notifyFriendsStatusChange(accountId, status, data);
    }

    /**
     * Send friend list to player
     */
    async sendFriendList(accountId, socket) {
        const friends = await this.getFriends(accountId);

        // Add online status to each friend
        const friendsWithStatus = friends.map(friend => {
            const onlineData = this.onlinePlayers.get(friend.id);
            return {
                ...friend,
                online: !!onlineData,
                status: onlineData?.status || 'offline',
                level: onlineData?.level || friend.level,
                zone: onlineData?.zone || 'Unknown'
            };
        });

        socket.emit('friend:list', {
            friends: friendsWithStatus,
            onlineCount: friendsWithStatus.filter(f => f.online).length
        });
    }

    /**
     * Get friends list
     */
    async getFriends(accountId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    CASE 
                        WHEN f.requester_id = ? THEN f.addressee_id 
                        ELSE f.requester_id 
                    END as friend_id,
                    a.username,
                    f.status,
                    f.accepted_at,
                    fn.note
                FROM friendships f
                JOIN accounts a ON 
                    (f.requester_id = ? AND f.addressee_id = a.id) OR
                    (f.addressee_id = ? AND f.requester_id = a.id)
                LEFT JOIN friend_notes fn ON fn.account_id = ? AND fn.friend_id = 
                    CASE 
                        WHEN f.requester_id = ? THEN f.addressee_id 
                        ELSE f.requester_id 
                    END
                WHERE (f.requester_id = ? OR f.addressee_id = ?)
                AND f.status = 'accepted'
            `, [accountId, accountId, accountId, accountId, accountId, accountId, accountId],
            (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                const friends = (rows || []).map(row => ({
                    id: row.friend_id,
                    username: row.username,
                    note: row.note,
                    friendSince: row.accepted_at
                }));

                resolve(friends);
            });
        });
    }

    /**
     * Send friend request
     */
    async sendFriendRequest(requesterId, addresseeUsername) {
        try {
            // Get addressee account
            const addressee = await this.getAccountByUsername(addresseeUsername);
            if (!addressee) {
                return { success: false, error: 'Player not found' };
            }

            if (addressee.id === requesterId) {
                return { success: false, error: 'Cannot add yourself' };
            }

            // Check if already friends or pending
            const existing = await this.getFriendship(requesterId, addressee.id);
            if (existing) {
                if (existing.status === 'accepted') {
                    return { success: false, error: 'Already friends' };
                } else if (existing.status === 'pending') {
                    return { success: false, error: 'Friend request already pending' };
                }
            }

            // Create request
            await this.createFriendship(requesterId, addressee.id, 'pending');

            // Notify addressee if online
            const addresseeOnline = this.onlinePlayers.get(addressee.id);
            if (addresseeOnline) {
                const requester = await this.getAccount(requesterId);
                addresseeOnline.socket.emit('friend:request', {
                    from: {
                        id: requesterId,
                        username: requester.username
                    },
                    timestamp: Date.now()
                });
            }

            return { success: true };
        } catch (error) {
            console.error('[FriendSystem] Request error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Accept friend request
     */
    async acceptFriendRequest(addresseeId, requesterId) {
        try {
            const friendship = await this.getFriendship(requesterId, addresseeId);
            if (!friendship || friendship.status !== 'pending') {
                return { success: false, error: 'Request not found' };
            }

            await this.updateFriendshipStatus(requesterId, addresseeId, 'accepted');

            // Notify requester if online
            const requesterOnline = this.onlinePlayers.get(requesterId);
            if (requesterOnline) {
                const addressee = await this.getAccount(addresseeId);
                requesterOnline.socket.emit('friend:accepted', {
                    by: {
                        id: addresseeId,
                        username: addressee.username
                    }
                });
            }

            // Update both players' friend lists
            const addresseeOnline = this.onlinePlayers.get(addresseeId);
            if (addresseeOnline) {
                this.sendFriendList(addresseeId, addresseeOnline.socket);
            }
            if (requesterOnline) {
                this.sendFriendList(requesterId, requesterOnline.socket);
            }

            return { success: true };
        } catch (error) {
            console.error('[FriendSystem] Accept error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Decline friend request
     */
    async declineFriendRequest(addresseeId, requesterId) {
        try {
            const friendship = await this.getFriendship(requesterId, addresseeId);
            if (!friendship || friendship.status !== 'pending') {
                return { success: false, error: 'Request not found' };
            }

            await this.deleteFriendship(requesterId, addresseeId);

            // Notify requester if online
            const requesterOnline = this.onlinePlayers.get(requesterId);
            if (requesterOnline) {
                requesterOnline.socket.emit('friend:declined', {
                    by: addresseeId
                });
            }

            return { success: true };
        } catch (error) {
            console.error('[FriendSystem] Decline error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove friend
     */
    async removeFriend(accountId, friendId) {
        try {
            await this.deleteFriendship(accountId, friendId);

            // Notify friend if online
            const friendOnline = this.onlinePlayers.get(friendId);
            if (friendOnline) {
                this.sendFriendList(friendId, friendOnline.socket);
            }

            // Update own list
            const selfOnline = this.onlinePlayers.get(accountId);
            if (selfOnline) {
                this.sendFriendList(accountId, selfOnline.socket);
            }

            return { success: true };
        } catch (error) {
            console.error('[FriendSystem] Remove error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get pending friend requests
     */
    async getPendingRequests(accountId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT f.requester_id, a.username, f.created_at
                FROM friendships f
                JOIN accounts a ON f.requester_id = a.id
                WHERE f.addressee_id = ? AND f.status = 'pending'
                ORDER BY f.created_at DESC
            `, [accountId], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve((rows || []).map(row => ({
                    id: row.requester_id,
                    username: row.username,
                    sentAt: row.created_at
                })));
            });
        });
    }

    /**
     * Add note to friend
     */
    async setFriendNote(accountId, friendId, note) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO friend_notes (account_id, friend_id, note, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `, [accountId, friendId, note], (err) => {
                if (err) reject(err);
                else resolve({ success: true });
            });
        });
    }

    /**
     * Notify friends of status change
     */
    async notifyFriendsStatusChange(accountId, status, data = {}) {
        const friends = await this.getFriends(accountId);

        for (const friend of friends) {
            const friendOnline = this.onlinePlayers.get(friend.id);
            if (friendOnline) {
                friendOnline.socket.emit('friend:status', {
                    friendId: accountId,
                    status,
                    ...data
                });
            }
        }
    }

    /**
     * Get friendship record
     */
    async getFriendship(user1, user2) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM friendships
                WHERE (requester_id = ? AND addressee_id = ?)
                OR (requester_id = ? AND addressee_id = ?)
            `, [user1, user2, user2, user1], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Create friendship record
     */
    async createFriendship(requesterId, addresseeId, status) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO friendships (requester_id, addressee_id, status)
                VALUES (?, ?, ?)
            `, [requesterId, addresseeId, status], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Update friendship status
     */
    async updateFriendshipStatus(user1, user2, status) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE friendships
                SET status = ?, accepted_at = CASE WHEN ? = 'accepted' THEN CURRENT_TIMESTAMP ELSE accepted_at END
                WHERE (requester_id = ? AND addressee_id = ?)
                OR (requester_id = ? AND addressee_id = ?)
            `, [status, status, user1, user2, user2, user1], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Delete friendship
     */
    async deleteFriendship(user1, user2) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                DELETE FROM friendships
                WHERE (requester_id = ? AND addressee_id = ?)
                OR (requester_id = ? AND addressee_id = ?)
            `, [user1, user2, user2, user1], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Get account by ID
     */
    async getAccount(accountId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT id, username FROM accounts WHERE id = ?
            `, [accountId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Get account by username
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
     * Start periodic status updates
     */
    startStatusUpdates() {
        // Send full friend list updates every 30 seconds
        this.statusUpdateInterval = setInterval(() => {
            this.broadcastStatusUpdates();
        }, 30000);
    }

    /**
     * Broadcast status updates to all online players
     */
    broadcastStatusUpdates() {
        for (const [accountId, player] of this.onlinePlayers) {
            this.sendFriendList(accountId, player.socket);
        }
    }

    /**
     * Cleanup
     */
    cleanup() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
        }
        this.onlinePlayers.clear();
    }
}

module.exports = FriendSystem;
