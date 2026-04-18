/**
 * GuildInvitationManager.js
 * Guild invitation lifecycle management
 * Legacy of Komodo MMORPG v0.5.0
 */

class GuildInvitationManager {
    constructor(guildManager, database) {
        this.guildManager = guildManager;
        this.db = database;
        
        // Invitation expiration: 24 hours
        this.EXPIRATION_HOURS = 24;
        
        // Max pending invitations per guild
        this.MAX_GUILD_INVITATIONS = 50;
        
        // Max pending invitations per player
        this.MAX_PLAYER_INVITATIONS = 10;
    }

    /**
     * Initialize invitation manager
     */
    initialize() {
        // Start periodic cleanup of expired invitations
        setInterval(() => this.cleanupExpiredInvitations(), 3600000); // Every hour
        console.log('📨 GuildInvitationManager initialized');
    }

    /**
     * Create a new invitation
     * @param {string} guildId - Guild ID
     * @param {string} inviterId - Player sending invitation
     * @param {string} inviteeId - Player being invited
     * @returns {Promise<Object>}
     */
    async createInvitation(guildId, inviterId, inviteeId) {
        try {
            // Check inviter permissions
            const inviterMembership = await this.db.getPlayerGuild(inviterId);
            if (!inviterMembership || inviterMembership.guild_id !== guildId) {
                throw new Error('Not in this guild');
            }

            if (!['LEADER', 'OFFICER'].includes(inviterMembership.rank)) {
                throw new Error('Only officers can invite players');
            }

            // Check if invitee already in a guild
            const existingMembership = await this.db.getPlayerGuild(inviteeId);
            if (existingMembership) {
                throw new Error('Player already in a guild');
            }

            // Check guild capacity
            const guild = await this.db.getGuildById(guildId);
            if (!guild) {
                throw new Error('Guild not found');
            }

            if (guild.memberCount >= guild.maxMembers) {
                throw new Error('Guild is full');
            }

            // Check if guild has too many pending invitations
            const guildInvitations = await this.db.getGuildInvitations(guildId);
            const pendingGuildInvites = guildInvitations.filter(i => i.status === 'PENDING');
            if (pendingGuildInvites.length >= this.MAX_GUILD_INVITATIONS) {
                throw new Error('Too many pending invitations for this guild');
            }

            // Check if player has too many pending invitations
            const playerInvitations = await this.db.getPlayerInvitations(inviteeId);
            if (playerInvitations.length >= this.MAX_PLAYER_INVITATIONS) {
                throw new Error('Player has too many pending invitations');
            }

            // Check for existing pending invitation from this guild
            const existingInvite = pendingGuildInvites.find(i => i.invitee_id === inviteeId);
            if (existingInvite) {
                throw new Error('Player already has a pending invitation from this guild');
            }

            // Create invitation
            const invitation = await this.db.createInvitation(guildId, inviterId, inviteeId);

            // Notify invitee
            this.notifyPlayerOfInvitation(inviteeId, invitation, guild, inviterId);

            return {
                success: true,
                invitation: this.formatInvitation(invitation, guild),
                message: 'Invitation sent successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cancel an invitation
     * @param {string} inviterId - Officer who sent invitation
     * @param {string} invitationId - Invitation ID
     * @returns {Promise<Object>}
     */
    async cancelInvitation(inviterId, invitationId) {
        try {
            // Get invitation
            const invitation = await this.db.getInvitationById(invitationId);
            if (!invitation) {
                throw new Error('Invitation not found');
            }

            // Check permissions (only inviter or guild officers can cancel)
            const inviterMembership = await this.db.getPlayerGuild(inviterId);
            if (!inviterMembership) {
                throw new Error('Not in a guild');
            }

            const canCancel = 
                invitation.inviter_id === inviterId || 
                (inviterMembership.guild_id === invitation.guild_id && 
                 ['LEADER', 'OFFICER'].includes(inviterMembership.rank));

            if (!canCancel) {
                throw new Error('Not authorized to cancel this invitation');
            }

            // Cancel invitation
            await this.db.cancelInvitation(invitationId);

            // Notify invitee
            this.guildManager.playerManager.sendToPlayer(invitation.invitee_id, {
                type: 'guild:invitation_cancelled',
                data: {
                    invitationId,
                    guildId: invitation.guild_id
                }
            });

            return {
                success: true,
                message: 'Invitation cancelled'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Accept an invitation
     * @param {string} playerId - Player accepting
     * @param {string} invitationId - Invitation ID
     * @returns {Promise<Object>}
     */
    async acceptInvitation(playerId, invitationId) {
        try {
            // Get invitation
            const invitation = await this.db.getInvitationById(invitationId);
            if (!invitation) {
                throw new Error('Invitation not found or expired');
            }

            if (invitation.invitee_id !== playerId) {
                throw new Error('Not your invitation');
            }

            if (invitation.status !== 'PENDING') {
                throw new Error('Invitation already processed');
            }

            // Check if player already in a guild
            const existingMembership = await this.db.getPlayerGuild(playerId);
            if (existingMembership) {
                throw new Error('You are already in a guild');
            }

            // Accept invitation
            let result;
            if (this.guildManager && typeof this.guildManager.respondToInvitation === 'function') {
                result = await this.guildManager.respondToInvitation(playerId, invitationId, true);
            } else {
                // Fallback: respond directly via database
                const status = 'ACCEPTED';
                const invitation = await this.db.respondToInvitation(invitationId, status);
                result = { success: true, invitation };
            }
            
            if (result.success) {
                // Decline all other pending invitations
                await this.declineAllOtherInvitations(playerId, invitationId);
            }

            return result;

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Decline an invitation
     * @param {string} playerId - Player declining
     * @param {string} invitationId - Invitation ID
     * @returns {Promise<Object>}
     */
    async declineInvitation(playerId, invitationId) {
        try {
            // Get invitation
            const invitation = await this.db.getInvitationById(invitationId);
            if (!invitation) {
                throw new Error('Invitation not found or expired');
            }

            if (invitation.invitee_id !== playerId) {
                throw new Error('Not your invitation');
            }

            if (invitation.status !== 'PENDING') {
                throw new Error('Invitation already processed');
            }

            // Decline invitation
            if (this.guildManager && typeof this.guildManager.respondToInvitation === 'function') {
                return await this.guildManager.respondToInvitation(playerId, invitationId, false);
            } else {
                // Fallback: respond directly via database
                const status = 'DECLINED';
                const invitation = await this.db.respondToInvitation(invitationId, status);
                return { success: true, invitation };
            }

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all pending invitations for a player
     * @param {string} playerId - Player ID
     * @returns {Promise<Object>}
     */
    async getPlayerInvitations(playerId) {
        try {
            const invitations = await this.db.getPlayerInvitations(playerId);
            
            // Enrich with guild and inviter info
            const enrichedInvitations = await Promise.all(
                invitations.map(async (inv) => {
                    const guild = await this.db.getGuildById(inv.guild_id);
                    const inviter = await this.guildManager.playerManager.getPlayer(inv.inviter_id);
                    
                    return {
                        id: inv.id,
                        guildId: inv.guild_id,
                        guildName: guild?.name,
                        guildTag: guild?.tag,
                        guildMemberCount: guild?.memberCount,
                        guildMaxMembers: guild?.maxMembers,
                        inviterId: inv.inviter_id,
                        inviterName: inviter?.username,
                        createdAt: inv.created_at,
                        expiresAt: inv.expires_at
                    };
                })
            );

            return {
                success: true,
                invitations: enrichedInvitations
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all pending invitations for a guild
     * @param {string} playerId - Officer requesting
     * @param {string} guildId - Guild ID
     * @returns {Promise<Object>}
     */
    async getGuildInvitations(playerId, guildId) {
        try {
            // Check permissions
            const membership = await this.db.getPlayerGuild(playerId);
            if (!membership || membership.guild_id !== guildId) {
                throw new Error('Not in this guild');
            }

            if (!['LEADER', 'OFFICER'].includes(membership.rank)) {
                throw new Error('Only officers can view invitations');
            }

            const invitations = await this.db.getGuildInvitations(guildId);
            
            // Enrich with invitee info
            const enrichedInvitations = await Promise.all(
                invitations.map(async (inv) => {
                    const invitee = await this.guildManager.playerManager.getPlayer(inv.invitee_id);
                    
                    return {
                        id: inv.id,
                        inviteeId: inv.invitee_id,
                        inviteeName: invitee?.username,
                        inviteeLevel: invitee?.level,
                        createdAt: inv.created_at,
                        expiresAt: inv.expires_at,
                        status: inv.status
                    };
                })
            );

            return {
                success: true,
                invitations: enrichedInvitations
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Decline all other pending invitations for a player
     * @private
     */
    async declineAllOtherInvitations(playerId, acceptedInvitationId) {
        const invitations = await this.db.getPlayerInvitations(playerId);
        
        for (const invitation of invitations) {
            if (invitation.id !== acceptedInvitationId && invitation.status === 'PENDING') {
                await this.db.respondToInvitation(invitation.id, 'DECLINED');
                
                // Notify guild that player declined
                this.guildManager.playerManager.sendToPlayer(
                    invitation.inviter_id,
                    {
                        type: 'guild:invite_declined_auto',
                        data: {
                            playerId,
                            guildId: invitation.guild_id
                        }
                    }
                );
            }
        }
    }

    /**
     * Notify player of new invitation
     * @private
     */
    notifyPlayerOfInvitation(inviteeId, invitation, guild, inviterId) {
        const inviter = this.guildManager.playerManager.getPlayer(inviterId);
        
        this.guildManager.playerManager.sendToPlayer(inviteeId, {
            type: 'guild:invited',
            data: {
                invitationId: invitation.id,
                guildId: guild.id,
                guildName: guild.name,
                guildTag: guild.tag,
                inviterName: inviter?.username,
                inviterId,
                memberCount: guild.memberCount,
                maxMembers: guild.maxMembers,
                expiresAt: invitation.expires_at
            }
        });
    }

    /**
     * Format invitation for client
     * @private
     */
    formatInvitation(invitation, guild) {
        return {
            id: invitation.id,
            guildId: guild.id,
            guildName: guild.name,
            guildTag: guild.tag,
            createdAt: invitation.created_at,
            expiresAt: invitation.expires_at,
            status: invitation.status
        };
    }

    /**
     * Periodic cleanup of expired invitations
     * @private
     */
    async cleanupExpiredInvitations() {
        try {
            console.log('🧹 Cleaning up expired guild invitations...');
            const expired = await this.db.cleanupExpiredInvitations();
            if (expired > 0) {
                console.log(`  → Expired ${expired} invitations`);
            }
        } catch (error) {
            console.error('Error cleaning up invitations:', error);
        }
    }
}

module.exports = GuildInvitationManager;
