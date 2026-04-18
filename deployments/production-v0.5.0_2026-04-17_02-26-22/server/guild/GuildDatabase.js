/**
 * GuildDatabase.js - SQLite Version
 * Database operations for the Guild System
 * Legacy of Komodo MMORPG v0.5.0
 * 
 * ADAPTADO: PostgreSQL → SQLite (compatível com projeto)
 */

class GuildDatabase {
    constructor(db) {
        this.db = db;
    }

    /**
     * Promisify SQLite run
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    /**
     * Promisify SQLite get (single row)
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Promisify SQLite all (multiple rows)
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Create a new guild
     */
    async createGuild({ name, tag, description, leaderId }) {
        const guildId = `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.run(
            `INSERT INTO guilds (id, name, tag, description, leader_id, created_at, max_members, is_recruiting)
             VALUES (?, ?, ?, ?, ?, datetime('now'), 100, 1)`,
            [guildId, name, tag.toUpperCase(), description || '', leaderId]
        );

        // Add leader as first member
        await this.run(
            `INSERT INTO guild_members (id, guild_id, player_id, rank, joined_at)
             VALUES (?, ?, ?, 'LEADER', datetime('now'))`,
            [`member_${Date.now()}_leader`, guildId, leaderId]
        );

        return this.getGuildById(guildId);
    }

    /**
     * Disband a guild
     */
    async disbandGuild(guildId) {
        const result = await this.run(
            'DELETE FROM guilds WHERE id = ?',
            [guildId]
        );
        return result.changes > 0;
    }

    /**
     * Get guild by ID
     */
    async getGuildById(guildId) {
        const guild = await this.get(
            `SELECT g.*, 
                    (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id) as member_count
             FROM guilds g
             WHERE g.id = ?`,
            [guildId]
        );
        return guild ? this.formatGuild(guild) : null;
    }

    /**
     * Get guild by name
     */
    async getGuildByName(name) {
        const guild = await this.get(
            'SELECT * FROM guilds WHERE LOWER(name) = LOWER(?)',
            [name]
        );
        return guild ? this.formatGuild(guild) : null;
    }

    /**
     * Get guild by tag
     */
    async getGuildByTag(tag) {
        const guild = await this.get(
            'SELECT * FROM guilds WHERE tag = UPPER(?)',
            [tag]
        );
        return guild ? this.formatGuild(guild) : null;
    }

    /**
     * Get player's guild membership
     */
    async getPlayerGuild(playerId) {
        return await this.get(
            `SELECT gm.*, g.name as guild_name, g.tag as guild_tag, g.description, g.motd, g.is_recruiting
             FROM guild_members gm
             JOIN guilds g ON gm.guild_id = g.id
             WHERE gm.player_id = ?`,
            [playerId]
        );
    }

    /**
     * Get all members of a guild
     */
    async getGuildMembers(guildId) {
        return await this.all(
            `SELECT gm.*, p.username, p.level, p.is_online, p.last_login
             FROM guild_members gm
             JOIN players p ON gm.player_id = p.id
             WHERE gm.guild_id = ?
             ORDER BY 
                CASE gm.rank 
                    WHEN 'LEADER' THEN 1 
                    WHEN 'OFFICER' THEN 2 
                    WHEN 'MEMBER' THEN 3 
                    WHEN 'INITIATE' THEN 4 
                END,
                gm.joined_at`,
            [guildId]
        );
    }

    /**
     * Add guild member
     */
    async addGuildMember(guildId, playerId, rank = 'INITIATE') {
        const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.run(
            `INSERT INTO guild_members (id, guild_id, player_id, rank, joined_at, last_active)
             VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [memberId, guildId, playerId, rank]
        );
        return { id: memberId, guild_id: guildId, player_id: playerId, rank };
    }

    /**
     * Remove guild member
     */
    async removeGuildMember(guildId, playerId) {
        const result = await this.run(
            'DELETE FROM guild_members WHERE guild_id = ? AND player_id = ?',
            [guildId, playerId]
        );
        return result.changes > 0;
    }

    /**
     * Update member rank
     */
    async updateMemberRank(guildId, playerId, newRank) {
        await this.run(
            'UPDATE guild_members SET rank = ? WHERE guild_id = ? AND player_id = ?',
            [newRank, guildId, playerId]
        );
        return { guild_id: guildId, player_id: playerId, rank: newRank };
    }

    /**
     * Update last active timestamp
     */
    async updateLastActive(playerId) {
        await this.run(
            'UPDATE guild_members SET last_active = datetime("now") WHERE player_id = ?',
            [playerId]
        );
    }

    /**
     * Create invitation
     */
    async createInvitation(guildId, inviterId, inviteeId) {
        const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
        
        await this.run(
            `INSERT INTO guild_invitations (id, guild_id, inviter_id, invitee_id, status, created_at, expires_at)
             VALUES (?, ?, ?, ?, 'PENDING', datetime('now'), ?)`,
            [inviteId, guildId, inviterId, inviteeId, expiresAt]
        );
        
        return { id: inviteId, guild_id: guildId, inviter_id: inviterId, invitee_id: inviteeId };
    }

    /**
     * Get pending invitations for a player
     */
    async getPlayerInvitations(playerId) {
        return await this.all(
            `SELECT gi.*, g.name as guild_name, g.tag as guild_tag, 
                    p.username as inviter_name
             FROM guild_invitations gi
             JOIN guilds g ON gi.guild_id = g.id
             JOIN players p ON gi.inviter_id = p.id
             WHERE gi.invitee_id = ? AND gi.status = 'PENDING' AND gi.expires_at > datetime('now')`,
            [playerId]
        );
    }

    /**
     * Get guild invitations
     */
    async getGuildInvitations(guildId) {
        return await this.all(
            `SELECT gi.*, p.username as invitee_name
             FROM guild_invitations gi
             JOIN players p ON gi.invitee_id = p.id
             WHERE gi.guild_id = ? AND gi.status = 'PENDING'`,
            [guildId]
        );
    }

    /**
     * Respond to invitation
     */
    async respondToInvitation(invitationId, status) {
        // Update invitation
        await this.run(
            'UPDATE guild_invitations SET status = ? WHERE id = ? AND status = "PENDING"',
            [status, invitationId]
        );

        const invitation = await this.get(
            'SELECT * FROM guild_invitations WHERE id = ?',
            [invitationId]
        );

        if (status === 'ACCEPTED' && invitation) {
            // Check if player already in guild
            const existing = await this.get(
                'SELECT id FROM guild_members WHERE player_id = ?',
                [invitation.invitee_id]
            );
            
            if (existing) {
                throw new Error('Player already in a guild');
            }

            // Check guild capacity
            const memberCount = await this.get(
                'SELECT COUNT(*) as count FROM guild_members WHERE guild_id = ?',
                [invitation.guild_id]
            );
            
            const guildInfo = await this.get(
                'SELECT max_members FROM guilds WHERE id = ?',
                [invitation.guild_id]
            );
            
            if (memberCount.count >= guildInfo.max_members) {
                throw new Error('Guild is full');
            }

            // Add member
            await this.addGuildMember(invitation.guild_id, invitation.invitee_id, 'INITIATE');
        }

        return invitation;
    }

    /**
     * Save chat message
     */
    async saveChatMessage(guildId, senderId, senderName, senderRank, message, isOfficerChat = false) {
        const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.run(
            `INSERT INTO guild_chat_history (id, guild_id, sender_id, sender_name, sender_rank, message, is_officer_chat, sent_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [msgId, guildId, senderId, senderName, senderRank, message, isOfficerChat ? 1 : 0]
        );
        
        // Keep only last 100 messages per guild
        await this.run(
            `DELETE FROM guild_chat_history 
             WHERE id NOT IN (
                 SELECT id FROM guild_chat_history 
                 WHERE guild_id = ? 
                 ORDER BY sent_at DESC 
                 LIMIT 100
             ) AND guild_id = ?`,
            [guildId, guildId]
        );
        
        return { id: msgId, guild_id: guildId, sender_id: senderId, message };
    }

    /**
     * Get chat history
     */
    async getChatHistory(guildId, limit = 50, isOfficerChat = false) {
        return await this.all(
            `SELECT * FROM guild_chat_history 
             WHERE guild_id = ? AND is_officer_chat = ?
             ORDER BY sent_at DESC 
             LIMIT ?`,
            [guildId, isOfficerChat ? 1 : 0, limit]
        );
    }

    /**
     * Update guild info
     */
    async updateGuildInfo(guildId, updates) {
        const fields = [];
        const values = [];
        
        if (updates.description !== undefined) {
            fields.push('description = ?');
            values.push(updates.description);
        }
        if (updates.motd !== undefined) {
            fields.push('motd = ?');
            values.push(updates.motd);
        }
        if (updates.isRecruiting !== undefined) {
            fields.push('is_recruiting = ?');
            values.push(updates.isRecruiting ? 1 : 0);
        }
        if (updates.leaderId !== undefined) {
            fields.push('leader_id = ?');
            values.push(updates.leaderId);
        }
        
        if (fields.length === 0) return null;
        
        values.push(guildId);
        await this.run(
            `UPDATE guilds SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        
        return this.getGuildById(guildId);
    }

    /**
     * Browse recruiting guilds
     */
    async browseGuilds({ page = 1, limit = 10, search = '' } = {}) {
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE is_recruiting = 1';
        let params = [];
        
        if (search) {
            whereClause += ' AND (LOWER(name) LIKE ? OR tag LIKE ?)';
            params.push(`%${search.toLowerCase()}%`, `%${search.toUpperCase()}%`);
        }
        
        const guilds = await this.all(
            `SELECT g.*, 
                    (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id) as member_count
             FROM guilds g
             ${whereClause}
             ORDER BY member_count DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        
        const totalResult = await this.get(
            `SELECT COUNT(*) as count FROM guilds ${whereClause}`,
            params
        );
        
        return {
            guilds: guilds.map(g => this.formatGuild(g)),
            total: totalResult.count,
            page,
            totalPages: Math.ceil(totalResult.count / limit)
        };
    }

    /**
     * Transfer leadership
     */
    async transferLeadership(guildId, currentLeaderId, newLeaderId) {
        // Update old leader to officer
        await this.updateMemberRank(guildId, currentLeaderId, 'OFFICER');
        // Update new leader
        await this.updateMemberRank(guildId, newLeaderId, 'LEADER');
        // Update guild leader
        await this.updateGuildInfo(guildId, { leaderId: newLeaderId });
        
        return { success: true, newLeaderId };
    }

    /**
     * Format guild object
     */
    formatGuild(guild) {
        return {
            id: guild.id,
            name: guild.name,
            tag: guild.tag,
            description: guild.description,
            motd: guild.motd,
            leaderId: guild.leader_id,
            createdAt: guild.created_at,
            maxMembers: guild.max_members,
            isRecruiting: !!guild.is_recruiting,
            memberCount: guild.member_count || 0
        };
    }
}

module.exports = GuildDatabase;
