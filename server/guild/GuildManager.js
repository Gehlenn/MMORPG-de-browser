/**
 * GuildManager.js
 * Core guild system logic for Legacy of Komodo MMORPG v0.5.0
 */

const EventEmitter = require('events');

class GuildManager extends EventEmitter {
    constructor(database, playerManager, chatManager) {
        super();
        this.db = database;
        this.playerManager = playerManager;
        this.chatManager = chatManager;
        
        // In-memory cache for online guild members
        this.onlineMembers = new Map(); // guildId -> Set(playerIds)
        
        // Rate limiting for chat
        this.chatCooldowns = new Map(); // playerId -> lastMessageTime
        
        // Create costs
        this.GUILD_CREATE_COST = 10000;
        this.GUILD_CREATE_MIN_LEVEL = 10;
    }

    /**
     * Initialize the guild manager
     */
    async initialize() {
        console.log('🏰 GuildManager initialized');
        this.emit('initialized');
    }

    /**
     * Create a new guild
     * @param {string} playerId - Creator player ID
     * @param {Object} guildData - Guild data
     * @returns {Promise<Object>}
     */
    async createGuild(playerId, { name, tag, description }) {
        try {
            // Validate player level and gold
            const player = await this.playerManager.getPlayer(playerId);
            if (!player) {
                throw new Error('Player not found');
            }

            if (player.level < this.GUILD_CREATE_MIN_LEVEL) {
                throw new Error(`Requires level ${this.GUILD_CREATE_MIN_LEVEL}`);
            }

            if (player.gold < this.GUILD_CREATE_COST) {
                throw new Error(`Requires ${this.GUILD_CREATE_COST} gold`);
            }

            // Check if player already in a guild
            const existingGuild = await this.db.getPlayerGuild(playerId);
            if (existingGuild) {
                throw new Error('Already in a guild');
            }

            // Validate name
            if (!name || name.length < 2 || name.length > 24) {
                throw new Error('Guild name must be 2-24 characters');
            }

            // Validate tag
            if (!tag || tag.length < 3 || tag.length > 4) {
                throw new Error('Guild tag must be 3-4 characters');
            }

            // Check name uniqueness
            const nameExists = await this.db.getGuildByName(name);
            if (nameExists) {
                throw new Error('Guild name already exists');
            }

            // Check tag uniqueness
            const tagExists = await this.db.getGuildByTag(tag);
            if (tagExists) {
                throw new Error('Guild tag already exists');
            }

            // Deduct gold
            await this.playerManager.updateGold(playerId, -this.GUILD_CREATE_COST);

            // Create guild
            const guild = await this.db.createGuild({
                name: name.trim(),
                tag: tag.trim().toUpperCase(),
                description: description?.trim() || '',
                leaderId: playerId
            });

            // Add to online members cache
            this.onlineMembers.set(guild.id, new Set([playerId]));

            this.emit('guild:created', { guild, playerId });

            return {
                success: true,
                guild,
                message: `Guild "${guild.name}" [${guild.tag}] created successfully!`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Disband a guild
     * @param {string} playerId - Leader player ID
     * @param {string} guildId - Guild ID
     * @returns {Promise<Object>}
     */
    async disbandGuild(playerId, guildId) {
        try {
            const guild = await this.db.getGuildById(guildId);
            if (!guild) {
                throw new Error('Guild not found');
            }

            if (guild.leaderId !== playerId) {
                throw new Error('Only the guild leader can disband');
            }

            // Get all members for notification
            const members = await this.db.getGuildMembers(guildId);

            // Disband guild
            await this.db.disbandGuild(guildId);

            // Clear cache
            this.onlineMembers.delete(guildId);

            // Notify all members
            this.emit('guild:disbanded', { 
                guildId, 
                guildName: guild.name,
                memberIds: members.map(m => m.player_id)
            });

            return {
                success: true,
                message: `Guild "${guild.name}" has been disbanded`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Invite player to guild
     * @param {string} inviterId - Inviter player ID
     * @param {string} guildId - Guild ID
     * @param {string} inviteeUsername - Username to invite
     * @returns {Promise<Object>}
     */
    async invitePlayer(inviterId, guildId, inviteeUsername) {
        try {
            // Check inviter permissions
            const inviterMembership = await this.db.getPlayerGuild(inviterId);
            if (!inviterMembership || inviterMembership.guild_id !== guildId) {
                throw new Error('Not in this guild');
            }

            if (!['LEADER', 'OFFICER'].includes(inviterMembership.rank)) {
                throw new Error('Only officers can invite');
            }

            // Get guild info
            const guild = await this.db.getGuildById(guildId);
            if (!guild) {
                throw new Error('Guild not found');
            }

            // Check guild capacity
            if (guild.memberCount >= guild.maxMembers) {
                throw new Error('Guild is full');
            }

            // Find invitee
            const invitee = await this.playerManager.getPlayerByUsername(inviteeUsername);
            if (!invitee) {
                throw new Error('Player not found');
            }

            if (invitee.id === inviterId) {
                throw new Error('Cannot invite yourself');
            }

            // Check if already in guild
            const existingMembership = await this.db.getPlayerGuild(invitee.id);
            if (existingMembership) {
                throw new Error('Player already in a guild');
            }

            // Create invitation
            const invitation = await this.db.createInvitation(guildId, inviterId, invitee.id);

            // Get inviter name for notification
            const inviter = await this.playerManager.getPlayer(inviterId);

            this.emit('guild:invited', {
                invitation,
                guild,
                inviterName: inviter?.username,
                inviteeId: invitee.id
            });

            return {
                success: true,
                invitation,
                message: `Invitation sent to ${inviteeUsername}`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Respond to guild invitation
     * @param {string} playerId - Player ID
     * @param {string} invitationId - Invitation ID
     * @param {boolean} accept - Accept or decline
     * @returns {Promise<Object>}
     */
    async respondToInvitation(playerId, invitationId, accept) {
        try {
            const status = accept ? 'ACCEPTED' : 'DECLINED';
            const invitation = await this.db.respondToInvitation(invitationId, status);

            if (accept) {
                // Add to online members
                const guildMembers = this.onlineMembers.get(invitation.guild_id);
                if (guildMembers) {
                    guildMembers.add(playerId);
                } else {
                    this.onlineMembers.set(invitation.guild_id, new Set([playerId]));
                }

                const guild = await this.db.getGuildById(invitation.guild_id);

                this.emit('guild:member_joined', {
                    guildId: invitation.guild_id,
                    playerId,
                    guildName: guild.name,
                    tag: guild.tag
                });

                return {
                    success: true,
                    guild,
                    message: `You have joined [${guild.tag}] ${guild.name}!`
                };
            } else {
                return {
                    success: true,
                    message: 'Invitation declined'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Leave guild
     * @param {string} playerId - Player ID
     * @returns {Promise<Object>}
     */
    async leaveGuild(playerId) {
        try {
            const membership = await this.db.getPlayerGuild(playerId);
            if (!membership) {
                throw new Error('Not in a guild');
            }

            if (membership.rank === 'LEADER') {
                throw new Error('Leader must transfer leadership or disband');
            }

            const guild = await this.db.getGuildById(membership.guild_id);
            await this.db.removeMember(membership.guild_id, playerId);

            // Remove from online cache
            const guildMembers = this.onlineMembers.get(membership.guild_id);
            if (guildMembers) {
                guildMembers.delete(playerId);
            }

            this.emit('guild:member_left', {
                guildId: membership.guild_id,
                playerId,
                guildName: guild.name,
                tag: guild.tag
            });

            return {
                success: true,
                message: `You left [${guild.tag}] ${guild.name}`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Kick member from guild
     * @param {string} kickerId - Officer/Leader kicking
     * @param {string} targetPlayerId - Player to kick
     * @returns {Promise<Object>}
     */
    async kickMember(kickerId, targetPlayerId) {
        try {
            // Check kicker permissions
            const kickerMembership = await this.db.getPlayerGuild(kickerId);
            if (!kickerMembership) {
                throw new Error('Not in a guild');
            }

            if (!['LEADER', 'OFFICER'].includes(kickerMembership.rank)) {
                throw new Error('Only officers can kick');
            }

            // Get target membership
            const targetMembership = await this.db.getPlayerGuild(targetPlayerId);
            if (!targetMembership || targetMembership.guild_id !== kickerMembership.guild_id) {
                throw new Error('Player not in your guild');
            }

            // Cannot kick leader
            if (targetMembership.rank === 'LEADER') {
                throw new Error('Cannot kick the leader');
            }

            // Officers cannot kick other officers
            if (kickerMembership.rank === 'OFFICER' && targetMembership.rank === 'OFFICER') {
                throw new Error('Cannot kick other officers');
            }

            const guild = await this.db.getGuildById(kickerMembership.guild_id);
            const targetPlayer = await this.playerManager.getPlayer(targetPlayerId);

            await this.db.removeMember(kickerMembership.guild_id, targetPlayerId);

            // Remove from online cache
            const guildMembers = this.onlineMembers.get(kickerMembership.guild_id);
            if (guildMembers) {
                guildMembers.delete(targetPlayerId);
            }

            this.emit('guild:member_kicked', {
                guildId: kickerMembership.guild_id,
                playerId: targetPlayerId,
                playerName: targetPlayer?.username,
                guildName: guild.name,
                tag: guild.tag
            });

            return {
                success: true,
                message: `${targetPlayer?.username} has been kicked`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Promote/Demote member
     * @param {string} leaderId - Leader player ID
     * @param {string} targetPlayerId - Target player ID
     * @param {string} newRank - New rank
     * @returns {Promise<Object>}
     */
    async promoteMember(leaderId, targetPlayerId, newRank) {
        try {
            // Only leader can promote/demote
            const leaderMembership = await this.db.getPlayerGuild(leaderId);
            if (!leaderMembership || leaderMembership.rank !== 'LEADER') {
                throw new Error('Only the leader can promote/demote');
            }

            const validRanks = ['OFFICER', 'MEMBER', 'INITIATE'];
            if (!validRanks.includes(newRank)) {
                throw new Error('Invalid rank');
            }

            const targetMembership = await this.db.getPlayerGuild(targetPlayerId);
            if (!targetMembership || targetMembership.guild_id !== leaderMembership.guild_id) {
                throw new Error('Player not in your guild');
            }

            const guild = await this.db.getGuildById(leaderMembership.guild_id);
            const targetPlayer = await this.playerManager.getPlayer(targetPlayerId);

            await this.db.updateMemberRank(leaderMembership.guild_id, targetPlayerId, newRank);

            this.emit('guild:member_promoted', {
                guildId: leaderMembership.guild_id,
                playerId: targetPlayerId,
                playerName: targetPlayer?.username,
                newRank,
                guildName: guild.name,
                tag: guild.tag
            });

            return {
                success: true,
                message: `${targetPlayer?.username} is now ${newRank}`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Demote member (alias for promoteMember with lower rank)
     * @param {string} leaderId - Leader player ID
     * @param {string} targetPlayerId - Target player ID
     * @param {string} newRank - New rank (must be lower than current)
     * @returns {Promise<Object>}
     */
    async demoteMember(leaderId, targetPlayerId, newRank) {
        return this.promoteMember(leaderId, targetPlayerId, newRank);
    }

    /**
     * Transfer guild leadership
     * @param {string} leaderId - Current leader ID
     * @param {string} newLeaderId - New leader ID
     * @returns {Promise<Object>}
     */
    async transferLeadership(leaderId, newLeaderId) {
        try {
            const leaderMembership = await this.db.getPlayerGuild(leaderId);
            if (!leaderMembership || leaderMembership.rank !== 'LEADER') {
                throw new Error('Only the leader can transfer leadership');
            }

            const newLeaderMembership = await this.db.getPlayerGuild(newLeaderId);
            if (!newLeaderMembership || newLeaderMembership.guild_id !== leaderMembership.guild_id) {
                throw new Error('New leader must be in your guild');
            }

            const guild = await this.db.getGuildById(leaderMembership.guild_id);
            const newLeader = await this.playerManager.getPlayer(newLeaderId);

            await this.db.transferLeadership(leaderMembership.guild_id, newLeaderId);

            this.emit('guild:leadership_transferred', {
                guildId: leaderMembership.guild_id,
                oldLeaderId: leaderId,
                newLeaderId,
                newLeaderName: newLeader?.username,
                guildName: guild.name,
                tag: guild.tag
            });

            return {
                success: true,
                message: `Leadership transferred to ${newLeader?.username}`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update guild information
     * @param {string} playerId - Player ID (must be leader or officer)
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>}
     */
    async updateGuildInfo(playerId, updates) {
        try {
            const membership = await this.db.getPlayerGuild(playerId);
            if (!membership) {
                throw new Error('Not in a guild');
            }

            // Only officers can update info
            if (!['LEADER', 'OFFICER'].includes(membership.rank)) {
                throw new Error('Only officers can update guild info');
            }

            const guild = await this.db.updateGuildInfo(membership.guild_id, updates);

            this.emit('guild:info_updated', {
                guildId: membership.guild_id,
                updates,
                guildName: guild.name,
                tag: guild.tag
            });

            return {
                success: true,
                guild,
                message: 'Guild information updated'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get guild info for a player
     * @param {string} playerId - Player ID
     * @returns {Promise<Object>}
     */
    async getPlayerGuildInfo(playerId) {
        try {
            const membership = await this.db.getPlayerGuild(playerId);
            if (!membership) {
                return { success: true, guild: null };
            }

            const guild = await this.db.getGuildById(membership.guild_id);
            const members = await this.db.getGuildMembers(membership.guild_id);

            return {
                success: true,
                guild: {
                    ...guild,
                    myRank: membership.rank,
                    members
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get pending invitations for player
     * @param {string} playerId - Player ID
     * @returns {Promise<Object>}
     */
    async getPlayerInvitations(playerId) {
        try {
            const invitations = await this.db.getPlayerInvitations(playerId);
            return {
                success: true,
                invitations
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Browse guild directory
     * @param {Object} filters - Search filters
     * @returns {Promise<Object>}
     */
    async browseGuilds(filters = {}) {
        try {
            const guilds = await this.db.browseGuilds(filters);
            return {
                success: true,
                guilds
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle player coming online
     * @param {string} playerId - Player ID
     */
    async handlePlayerOnline(playerId) {
        const membership = await this.db.getPlayerGuild(playerId);
        if (membership) {
            const guildMembers = this.onlineMembers.get(membership.guild_id);
            if (guildMembers) {
                guildMembers.add(playerId);
            } else {
                this.onlineMembers.set(membership.guild_id, new Set([playerId]));
            }

            // Update last active
            await this.db.updateLastActive(playerId);

            // Notify guild
            this.emit('guild:member_online', {
                guildId: membership.guild_id,
                playerId
            });
        }
    }

    /**
     * Handle player going offline
     * @param {string} playerId - Player ID
     */
    async handlePlayerOffline(playerId) {
        const membership = await this.db.getPlayerGuild(playerId);
        if (membership) {
            const guildMembers = this.onlineMembers.get(membership.guild_id);
            if (guildMembers) {
                guildMembers.delete(playerId);
            }

            this.emit('guild:member_offline', {
                guildId: membership.guild_id,
                playerId
            });
        }
    }

    /**
     * Alias for handlePlayerOnline for test compatibility
     * @param {string} guildId - Guild ID (optional, for cache pre-initialization)
     * @param {string} playerId - Player ID
     */
    async setPlayerOnline(guildId, playerId) {
        // Initialize cache for guild if provided
        if (guildId && !this.onlineMembers.has(guildId)) {
            this.onlineMembers.set(guildId, new Set());
        }
        return this.handlePlayerOnline(playerId);
    }

    /**
     * Alias for handlePlayerOffline for test compatibility
     * @param {string} guildId - Guild ID
     * @param {string} playerId - Player ID
     */
    async setPlayerOffline(guildId, playerId) {
        const guildMembers = this.onlineMembers.get(guildId);
        if (guildMembers) {
            guildMembers.delete(playerId);
        }
        return this.handlePlayerOffline(playerId);
    }

    /**
     * Check if a player is online in a specific guild
     * @param {string} guildId - Guild ID
     * @param {string} playerId - Player ID
     * @returns {boolean}
     */
    isPlayerOnline(guildId, playerId) {
        const guildMembers = this.onlineMembers.get(guildId);
        return guildMembers ? guildMembers.has(playerId) : false;
    }

    /**
     * Get online guild members for a guild
     * @param {string} guildId - Guild ID
     * @returns {Set<string>}
     */
    getOnlineMembers(guildId) {
        return this.onlineMembers.get(guildId) || new Set();
    }
}

module.exports = GuildManager;
