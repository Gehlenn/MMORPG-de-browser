/**
 * GuildChatHandler.js
 * Guild chat system for Legacy of Komodo MMORPG v0.5.0
 */

class GuildChatHandler {
    constructor(guildManager, database) {
        this.guildManager = guildManager;
        this.db = database;
        
        // Rate limiting: 5 messages per 10 seconds
        this.cooldownMs = 10000;
        this.maxMessages = 5;
        this.playerMessageCounts = new Map(); // playerId -> { count, resetTime }
    }

    /**
     * Initialize chat handler
     */
    initialize() {
        // Listen for guild events that should generate system messages
        this.guildManager.on('guild:member_joined', (data) => {
            this.sendSystemMessage(data.guildId, `${data.playerName} has joined the guild!`);
        });

        this.guildManager.on('guild:member_left', (data) => {
            this.sendSystemMessage(data.guildId, `A member has left the guild.`);
        });

        this.guildManager.on('guild:member_kicked', (data) => {
            this.sendSystemMessage(data.guildId, `${data.playerName} has been kicked from the guild.`);
        });

        this.guildManager.on('guild:member_promoted', (data) => {
            this.sendSystemMessage(data.guildId, `${data.playerName} has been promoted to ${data.newRank}.`);
        });

        this.guildManager.on('guild:leadership_transferred', (data) => {
            this.sendSystemMessage(data.guildId, `Leadership has been transferred to ${data.newLeaderName}.`);
        });

        console.log('💬 GuildChatHandler initialized');
    }

    /**
     * Handle guild chat message
     * @param {string} playerId - Sender player ID
     * @param {string} message - Message content
     * @returns {Promise<Object>}
     */
    async handleChat(playerId, message) {
        try {
            // Rate limit check
            if (!this.checkRateLimit(playerId)) {
                return {
                    success: false,
                    error: 'Rate limit exceeded. Please wait before sending another message.'
                };
            }

            // Get player guild info
            const membership = await this.db.getPlayerGuild(playerId);
            if (!membership) {
                return {
                    success: false,
                    error: 'You are not in a guild'
                };
            }

            // Validate message
            if (!message || message.trim().length === 0) {
                return {
                    success: false,
                    error: 'Message cannot be empty'
                };
            }

            if (message.length > 500) {
                return {
                    success: false,
                    error: 'Message too long (max 500 characters)'
                };
            }

            // Get player info
            const player = await this.guildManager.playerManager.getPlayer(playerId);
            if (!player) {
                return {
                    success: false,
                    error: 'Player not found'
                };
            }

            // Save message to history
            const chatMessage = await this.db.saveChatMessage(membership.guild_id, {
                senderId: playerId,
                senderName: player.username,
                senderRank: membership.rank,
                message: message.trim(),
                isOfficerChat: false
            });

            // Broadcast to online guild members
            this.broadcastMessage(membership.guild_id, {
                type: 'guild:chat_message',
                data: {
                    id: chatMessage.id,
                    senderId: playerId,
                    senderName: player.username,
                    senderRank: membership.rank,
                    message: message.trim(),
                    timestamp: chatMessage.sent_at,
                    isOfficerChat: false
                }
            });

            return {
                success: true,
                message: 'Message sent'
            };

        } catch (error) {
            console.error('Error handling guild chat:', error);
            return {
                success: false,
                error: 'Failed to send message'
            };
        }
    }

    /**
     * Handle officer chat message
     * @param {string} playerId - Sender player ID
     * @param {string} message - Message content
     * @returns {Promise<Object>}
     */
    async handleOfficerChat(playerId, message) {
        try {
            // Rate limit check
            if (!this.checkRateLimit(playerId)) {
                return {
                    success: false,
                    error: 'Rate limit exceeded. Please wait before sending another message.'
                };
            }

            // Get player guild info
            const membership = await this.db.getPlayerGuild(playerId);
            if (!membership) {
                return {
                    success: false,
                    error: 'You are not in a guild'
                };
            }

            // Only officers can use officer chat
            if (!['LEADER', 'OFFICER'].includes(membership.rank)) {
                return {
                    success: false,
                    error: 'Only officers can use officer chat'
                };
            }

            // Validate message
            if (!message || message.trim().length === 0) {
                return {
                    success: false,
                    error: 'Message cannot be empty'
                };
            }

            if (message.length > 500) {
                return {
                    success: false,
                    error: 'Message too long (max 500 characters)'
                };
            }

            // Get player info
            const player = await this.guildManager.playerManager.getPlayer(playerId);
            if (!player) {
                return {
                    success: false,
                    error: 'Player not found'
                };
            }

            // Save message to history
            const chatMessage = await this.db.saveChatMessage(membership.guild_id, {
                senderId: playerId,
                senderName: player.username,
                senderRank: membership.rank,
                message: message.trim(),
                isOfficerChat: true
            });

            // Broadcast to online officers only
            this.broadcastOfficerMessage(membership.guild_id, {
                type: 'guild:officer_chat_message',
                data: {
                    id: chatMessage.id,
                    senderId: playerId,
                    senderName: player.username,
                    senderRank: membership.rank,
                    message: message.trim(),
                    timestamp: chatMessage.sent_at,
                    isOfficerChat: true
                }
            });

            return {
                success: true,
                message: 'Officer message sent'
            };

        } catch (error) {
            console.error('Error handling officer chat:', error);
            return {
                success: false,
                error: 'Failed to send message'
            };
        }
    }

    /**
     * Send system message to guild
     * @param {string} guildId - Guild ID
     * @param {string} message - System message
     */
    sendSystemMessage(guildId, message) {
        this.broadcastMessage(guildId, {
            type: 'guild:system_message',
            data: {
                senderId: null,
                senderName: 'System',
                senderRank: 'SYSTEM',
                message: message,
                timestamp: new Date().toISOString(),
                isSystem: true
            }
        });
    }

    /**
     * Broadcast message to all online guild members
     * @param {string} guildId - Guild ID
     * @param {Object} messageData - Message data to broadcast
     */
    broadcastMessage(guildId, messageData) {
        const onlineMembers = this.guildManager.getOnlineMembers(guildId);
        
        for (const playerId of onlineMembers) {
            this.guildManager.playerManager.sendToPlayer(playerId, messageData);
        }
    }

    /**
     * Broadcast officer message to online officers only
     * @param {string} guildId - Guild ID
     * @param {Object} messageData - Message data to broadcast
     */
    async broadcastOfficerMessage(guildId, messageData) {
        const members = await this.db.getGuildMembers(guildId);
        const onlineMembers = this.guildManager.getOnlineMembers(guildId);

        for (const member of members) {
            // Only send to online officers
            if (onlineMembers.has(member.player_id) && 
                ['LEADER', 'OFFICER'].includes(member.rank)) {
                this.guildManager.playerManager.sendToPlayer(member.player_id, messageData);
            }
        }
    }

    /**
     * Get chat history for player
     * @param {string} playerId - Player ID
     * @param {number} limit - Number of messages to retrieve
     * @returns {Promise<Object>}
     */
    async getChatHistory(playerId, limit = 100) {
        try {
            const membership = await this.db.getPlayerGuild(playerId);
            if (!membership) {
                return {
                    success: false,
                    error: 'You are not in a guild'
                };
            }

            // Get regular chat history
            const history = await this.db.getChatHistory(membership.guild_id, limit);

            // If player is officer, they see all messages
            // If not, filter out officer chat
            const isOfficer = ['LEADER', 'OFFICER'].includes(membership.rank);
            
            const filteredHistory = isOfficer 
                ? history 
                : history.filter(msg => !msg.is_officer_chat);

            return {
                success: true,
                history: filteredHistory.map(msg => ({
                    id: msg.id,
                    senderId: msg.sender_id,
                    senderName: msg.sender_name,
                    senderRank: msg.sender_rank,
                    message: msg.message,
                    timestamp: msg.sent_at,
                    isOfficerChat: msg.is_officer_chat,
                    isSystem: msg.sender_id === null
                }))
            };

        } catch (error) {
            console.error('Error getting chat history:', error);
            return {
                success: false,
                error: 'Failed to get chat history'
            };
        }
    }

    /**
     * Check rate limit for player
     * @param {string} playerId - Player ID
     * @returns {boolean}
     */
    checkRateLimit(playerId) {
        const now = Date.now();
        const playerData = this.playerMessageCounts.get(playerId);

        if (!playerData) {
            // First message
            this.playerMessageCounts.set(playerId, {
                count: 1,
                resetTime: now + this.cooldownMs
            });
            return true;
        }

        // Reset if cooldown expired
        if (now > playerData.resetTime) {
            this.playerMessageCounts.set(playerId, {
                count: 1,
                resetTime: now + this.cooldownMs
            });
            return true;
        }

        // Check if under limit
        if (playerData.count < this.maxMessages) {
            playerData.count++;
            return true;
        }

        // Rate limit exceeded
        return false;
    }

    /**
     * Clean up old rate limit data (call periodically)
     */
    cleanupRateLimits() {
        const now = Date.now();
        for (const [playerId, data] of this.playerMessageCounts.entries()) {
            if (now > data.resetTime) {
                this.playerMessageCounts.delete(playerId);
            }
        }
    }
}

module.exports = GuildChatHandler;
