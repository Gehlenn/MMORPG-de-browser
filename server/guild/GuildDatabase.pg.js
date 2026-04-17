/**
 * GuildDatabase.js
 * Database operations for the Guild System
 * Legacy of Komodo MMORPG v0.5.0
 */

const { Pool } = require('pg');

class GuildDatabase {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Create a new guild
     * @param {Object} guildData - Guild creation data
     * @returns {Promise<Object>} Created guild
     */
    async createGuild({ name, tag, description, leaderId }) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Create guild
            const guildResult = await client.query(
                `INSERT INTO guilds (name, tag, description, leader_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [name, tag.toUpperCase(), description || '', leaderId]
            );

            const guild = guildResult.rows[0];

            // Add leader as first member
            await client.query(
                `INSERT INTO guild_members (guild_id, player_id, rank)
                 VALUES ($1, $2, 'LEADER')`,
                [guild.id, leaderId]
            );

            await client.query('COMMIT');
            return this.formatGuild(guild);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Disband a guild
     * @param {string} guildId - Guild UUID
     * @returns {Promise<boolean>}
     */
    async disbandGuild(guildId) {
        const result = await this.pool.query(
            'DELETE FROM guilds WHERE id = $1 RETURNING id',
            [guildId]
        );
        return result.rowCount > 0;
    }

    /**
     * Get guild by ID
     * @param {string} guildId - Guild UUID
     * @returns {Promise<Object|null>}
     */
    async getGuildById(guildId) {
        const result = await this.pool.query(
            `SELECT g.*, 
                    COUNT(gm.id) as member_count,
                    (SELECT COUNT(*) FROM guild_members gm2 
                     JOIN players p ON gm2.player_id = p.id 
                     WHERE gm2.guild_id = g.id AND p.is_online = TRUE) as online_count
             FROM guilds g
             LEFT JOIN guild_members gm ON g.id = gm.guild_id
             WHERE g.id = $1
             GROUP BY g.id`,
            [guildId]
        );
        return result.rows.length ? this.formatGuild(result.rows[0]) : null;
    }

    /**
     * Get guild by name
     * @param {string} name - Guild name
     * @returns {Promise<Object|null>}
     */
    async getGuildByName(name) {
        const result = await this.pool.query(
            'SELECT * FROM guilds WHERE LOWER(name) = LOWER($1)',
            [name]
        );
        return result.rows.length ? this.formatGuild(result.rows[0]) : null;
    }

    /**
     * Get guild by tag
     * @param {string} tag - Guild tag
     * @returns {Promise<Object|null>}
     */
    async getGuildByTag(tag) {
        const result = await this.pool.query(
            'SELECT * FROM guilds WHERE tag = UPPER($1)',
            [tag]
        );
        return result.rows.length ? this.formatGuild(result.rows[0]) : null;
    }

    /**
     * Get player's guild membership
     * @param {string} playerId - Player UUID
     * @returns {Promise<Object|null>} Guild member info with guild details
     */
    async getPlayerGuild(playerId) {
        const result = await this.pool.query(
            `SELECT gm.*, g.name as guild_name, g.tag as guild_tag, g.description, g.motd, g.is_recruiting
             FROM guild_members gm
             JOIN guilds g ON gm.guild_id = g.id
             WHERE gm.player_id = $1`,
            [playerId]
        );
        return result.rows.length ? result.rows[0] : null;
    }

    /**
     * Get all members of a guild
     * @param {string} guildId - Guild UUID
     * @returns {Promise<Array>} List of members with online status
     */
    async getGuildMembers(guildId) {
        const result = await this.pool.query(
            `SELECT gm.*, p.username, p.level, p.is_online, p.last_login
             FROM guild_members gm
             JOIN players p ON gm.player_id = p.id
             WHERE gm.guild_id = $1
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
        return result.rows;
    }

    /**
     * Invite player to guild
     * @param {string} guildId - Guild UUID
     * @param {string} inviterId - Inviter player UUID
     * @param {string} inviteeId - Invitee player UUID
     * @returns {Promise<Object>} Invitation
     */
    async createInvitation(guildId, inviterId, inviteeId) {
        const result = await this.pool.query(
            `INSERT INTO guild_invitations (guild_id, inviter_id, invitee_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [guildId, inviterId, inviteeId]
        );
        return result.rows[0];
    }

    /**
     * Get pending invitations for a player
     * @param {string} playerId - Player UUID
     * @returns {Promise<Array>}
     */
    async getPlayerInvitations(playerId) {
        const result = await this.pool.query(
            `SELECT gi.*, g.name as guild_name, g.tag as guild_tag, 
                    p.username as inviter_name
             FROM guild_invitations gi
             JOIN guilds g ON gi.guild_id = g.id
             JOIN players p ON gi.inviter_id = p.id
             WHERE gi.invitee_id = $1 AND gi.status = 'PENDING' AND gi.expires_at > NOW()`,
            [playerId]
        );
        return result.rows;
    }

    /**
     * Accept or decline invitation
     * @param {string} invitationId - Invitation UUID
     * @param {string} status - 'ACCEPTED' or 'DECLINED'
     * @returns {Promise<Object>}
     */
    async respondToInvitation(invitationId, status) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Update invitation status
            const inviteResult = await client.query(
                `UPDATE guild_invitations 
                 SET status = $1
                 WHERE id = $2 AND status = 'PENDING' AND expires_at > NOW()
                 RETURNING *`,
                [status, invitationId]
            );

            if (inviteResult.rowCount === 0) {
                throw new Error('Invitation not found or expired');
            }

            const invitation = inviteResult.rows[0];

            // If accepted, add to guild
            if (status === 'ACCEPTED') {
                // Check if player already in a guild
                const existing = await client.query(
                    'SELECT id FROM guild_members WHERE player_id = $1',
                    [invitation.invitee_id]
                );
                if (existing.rowCount > 0) {
                    throw new Error('Player already in a guild');
                }

                // Check guild capacity
                const memberCount = await client.query(
                    'SELECT COUNT(*) as count FROM guild_members WHERE guild_id = $1',
                    [invitation.guild_id]
                );
                const guildInfo = await client.query(
                    'SELECT max_members FROM guilds WHERE id = $1',
                    [invitation.guild_id]
                );
                
                if (parseInt(memberCount.rows[0].count) >= guildInfo.rows[0].max_members) {
                    throw new Error('Guild is full');
                }

                // Add member
                await client.query(
                    `INSERT INTO guild_members (guild_id, player_id, rank)
                     VALUES ($1, $2, 'INITIATE')`,
                    [invitation.guild_id, invitation.invitee_id]
                );
            }

            await client.query('COMMIT');
            return invitation;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Add member to guild (direct join for open guilds)
     * @param {string} guildId - Guild UUID
     * @param {string} playerId - Player UUID
     * @returns {Promise<Object>}
     */
    async addMember(guildId, playerId) {
        const result = await this.pool.query(
            `INSERT INTO guild_members (guild_id, player_id, rank)
             VALUES ($1, $2, 'INITIATE')
             RETURNING *`,
            [guildId, playerId]
        );
        return result.rows[0];
    }

    /**
     * Remove member from guild
     * @param {string} guildId - Guild UUID
     * @param {string} playerId - Player UUID
     * @returns {Promise<boolean>}
     */
    async removeMember(guildId, playerId) {
        const result = await this.pool.query(
            'DELETE FROM guild_members WHERE guild_id = $1 AND player_id = $2 RETURNING id',
            [guildId, playerId]
        );
        return result.rowCount > 0;
    }

    /**
     * Update member rank
     * @param {string} guildId - Guild UUID
     * @param {string} playerId - Player UUID
     * @param {string} newRank - New rank
     * @returns {Promise<boolean>}
     */
    async updateMemberRank(guildId, playerId, newRank) {
        const result = await this.pool.query(
            `UPDATE guild_members 
             SET rank = $1
             WHERE guild_id = $2 AND player_id = $3
             RETURNING id`,
            [newRank, guildId, playerId]
        );
        return result.rowCount > 0;
    }

    /**
     * Transfer guild leadership
     * @param {string} guildId - Guild UUID
     * @param {string} newLeaderId - New leader player UUID
     * @returns {Promise<boolean>}
     */
    async transferLeadership(guildId, newLeaderId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Get old leader
            const guildResult = await client.query(
                'SELECT leader_id FROM guilds WHERE id = $1',
                [guildId]
            );
            const oldLeaderId = guildResult.rows[0]?.leader_id;

            // Demote old leader to officer
            if (oldLeaderId) {
                await client.query(
                    `UPDATE guild_members 
                     SET rank = 'OFFICER'
                     WHERE guild_id = $1 AND player_id = $2`,
                    [guildId, oldLeaderId]
                );
            }

            // Promote new leader
            await client.query(
                `UPDATE guild_members 
                 SET rank = 'LEADER'
                 WHERE guild_id = $1 AND player_id = $2`,
                [guildId, newLeaderId]
            );

            // Update guild leader
            await client.query(
                'UPDATE guilds SET leader_id = $1 WHERE id = $2',
                [newLeaderId, guildId]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update guild info
     * @param {string} guildId - Guild UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>}
     */
    async updateGuildInfo(guildId, updates) {
        const allowedFields = ['description', 'motd', 'is_recruiting'];
        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(guildId);

        const result = await this.pool.query(
            `UPDATE guilds SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    /**
     * Save chat message
     * @param {string} guildId - Guild UUID
     * @param {Object} message - Message data
     * @returns {Promise<Object>}
     */
    async saveChatMessage(guildId, { senderId, senderName, senderRank, message, isOfficerChat }) {
        const result = await this.pool.query(
            `INSERT INTO guild_chat_history (guild_id, sender_id, sender_name, sender_rank, message, is_officer_chat)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [guildId, senderId, senderName, senderRank, message, isOfficerChat]
        );

        // Clean up old messages (keep last 100)
        await this.pool.query(
            `DELETE FROM guild_chat_history 
             WHERE id NOT IN (
                SELECT id FROM guild_chat_history 
                WHERE guild_id = $1 
                ORDER BY sent_at DESC 
                LIMIT 100
             ) AND guild_id = $1`,
            [guildId]
        );

        return result.rows[0];
    }

    /**
     * Get recent chat history
     * @param {string} guildId - Guild UUID
     * @param {number} limit - Number of messages
     * @returns {Promise<Array>}
     */
    async getChatHistory(guildId, limit = 100) {
        const result = await this.pool.query(
            `SELECT * FROM guild_chat_history 
             WHERE guild_id = $1
             ORDER BY sent_at DESC
             LIMIT $2`,
            [guildId, limit]
        );
        return result.rows.reverse();
    }

    /**
     * Browse guilds directory
     * @param {Object} filters - Search filters
     * @returns {Promise<Array>}
     */
    async browseGuilds({ search, isRecruiting, page = 1, limit = 20 }) {
        let query = `
            SELECT g.*, 
                   COUNT(gm.id) as member_count,
                   (SELECT COUNT(*) FROM guild_members gm2 
                    JOIN players p ON gm2.player_id = p.id 
                    WHERE gm2.guild_id = g.id AND p.is_online = TRUE) as online_count
            FROM guilds g
            LEFT JOIN guild_members gm ON g.id = gm.guild_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND (LOWER(g.name) LIKE LOWER($${paramIndex}) OR g.tag LIKE UPPER($${paramIndex}))`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (isRecruiting !== undefined) {
            query += ` AND g.is_recruiting = $${paramIndex}`;
            params.push(isRecruiting);
            paramIndex++;
        }

        query += `
            GROUP BY g.id
            ORDER BY g.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limit);
        params.push((page - 1) * limit);

        const result = await this.pool.query(query, params);
        return result.rows.map(row => this.formatGuild(row));
    }

    /**
     * Update member last active
     * @param {string} playerId - Player UUID
     */
    async updateLastActive(playerId) {
        await this.pool.query(
            'UPDATE guild_members SET last_active = NOW() WHERE player_id = $1',
            [playerId]
        );
    }

    /**
     * Format guild data
     * @private
     */
    formatGuild(row) {
        return {
            id: row.id,
            name: row.name,
            tag: row.tag,
            description: row.description,
            motd: row.motd,
            leaderId: row.leader_id,
            createdAt: row.created_at,
            maxMembers: row.max_members,
            isRecruiting: row.is_recruiting,
            memberCount: parseInt(row.member_count) || 0,
            onlineCount: parseInt(row.online_count) || 0
        };
    }
}

module.exports = GuildDatabase;
