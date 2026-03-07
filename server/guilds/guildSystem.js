/**
 * Guild System - Guild Management and Social Features
 * Handles guild creation, management, wars, and activities
 * Version 0.3 - First Playable Gameplay Systems
 */

class GuildSystem {
    constructor(server) {
        this.server = server;
        
        // Guild configuration
        this.config = {
            minMembersToCreate: 5,
            maxGuildSize: 50,
            maxGuildNameLength: 20,
            maxGuildTagLength: 4,
            createGuildCost: 1000,
            guildWarCost: 5000,
            allianceCost: 2000,
            inactivityDays: 30,
            ranks: {
                leader: { name: 'Guild Leader', permissions: ['all'] },
                officer: { name: 'Officer', permissions: ['invite', 'kick', 'manage_rank', 'manage_bank'] },
                veteran: { name: 'Veteran', permissions: ['invite', 'manage_bank'] },
                member: { name: 'Member', permissions: [] },
                initiate: { name: 'Initiate', permissions: [] }
            },
            guildLevels: {
                1: { name: 'Novice Guild', maxMembers: 20, requiredExp: 0 },
                2: { name: 'Apprentice Guild', maxMembers: 30, requiredExp: 10000 },
                3: { name: 'Adept Guild', maxMembers: 40, requiredExp: 50000 },
                4: { name: 'Master Guild', maxMembers: 50, requiredExp: 200000 },
                5: { name: 'Legendary Guild', maxMembers: 60, requiredExp: 1000000 }
            }
        };
        
        // Active guilds
        this.guilds = new Map();
        this.playerGuilds = new Map();
        
        // Guild wars
        this.guildWars = new Map();
        this.warHistory = [];
        
        // Alliances
        this.alliances = new Map();
        
        // Guild activities
        this.guildActivities = new Map();
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Load guild data
        this.loadGuildData();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start activity tracking
        this.startActivityTracking();
        
        console.log('Guild System initialized');
    }
    
    async loadGuildData() {
        try {
            // Load guilds
            const guildData = await this.server.db.all('SELECT * FROM guilds');
            
            for (const data of guildData) {
                const guild = {
                    id: data.id,
                    name: data.name,
                    tag: data.tag,
                    leaderId: data.leader_id,
                    level: data.level,
                    experience: data.experience,
                    gold: data.gold,
                    description: data.description,
                    createdAt: data.created_at,
                    members: JSON.parse(data.members || '[]'),
                    ranks: JSON.parse(data.ranks || '{}'),
                    bank: JSON.parse(data.bank || '[]'),
                    settings: JSON.parse(data.settings || '{}'),
                    lastActivity: data.last_activity,
                    status: data.status || 'active'
                };
                
                this.guilds.set(guild.id, guild);
                
                // Map players to guilds
                for (const member of guild.members) {
                    this.playerGuilds.set(member.playerId, guild.id);
                }
            }
            
            // Load guild wars
            const warData = await this.server.db.all('SELECT * FROM guild_wars WHERE status = "active"');
            
            for (const data of warData) {
                this.guildWars.set(data.id, {
                    id: data.id,
                    aggressorId: data.aggressor_id,
                    defenderId: data.defender_id,
                    startTime: data.start_time,
                    endTime: data.end_time,
                    warGoals: JSON.parse(data.war_goals || '[]'),
                    score: { aggressor: 0, defender: 0 },
                    status: data.status,
                    participants: JSON.parse(data.participants || '[]')
                });
            }
            
            // Load alliances
            const allianceData = await this.server.db.all('SELECT * FROM guild_alliances WHERE status = "active"');
            
            for (const data of allianceData) {
                this.alliances.set(data.id, {
                    id: data.id,
                    guild1Id: data.guild1_id,
                    guild2Id: data.guild2_id,
                    createdAt: data.created_at,
                    type: data.type,
                    status: data.status
                });
            }
            
            console.log(`Loaded ${this.guilds.size} guilds, ${this.guildWars.size} wars, ${this.alliances.size} alliances`);
            
        } catch (error) {
            console.error('Error loading guild data:', error);
        }
    }
    
    setupEventHandlers() {
        // Player events
        this.server.on('playerJoined', (playerId, playerData) => {
            this.handlePlayerJoined(playerId, playerData);
        });
        
        this.server.on('playerLeft', (playerId) => {
            this.handlePlayerLeft(playerId);
        });
        
        this.server.on('playerDeath', (playerId, killerId) => {
            this.handlePlayerDeath(playerId, killerId);
        });
        
        // Combat events
        this.server.on('entityDeath', (entityId, killerId) => {
            this.handleEntityDeath(entityId, killerId);
        });
        
        // Guild events
        this.server.on('guildCreate', (playerId, guildData) => {
            this.handleGuildCreate(playerId, guildData);
        });
        
        this.server.on('guildInvite', (leaderId, targetId) => {
            this.handleGuildInvite(leaderId, targetId);
        });
        
        this.server.on('guildJoin', (playerId, guildId) => {
            this.handleGuildJoin(playerId, guildId);
        });
        
        this.server.on('guildLeave', (playerId) => {
            this.handleGuildLeave(playerId);
        });
        
        this.server.on('guildKick', (leaderId, targetId) => {
            this.handleGuildKick(leaderId, targetId);
        });
        
        this.server.on('guildWar', (aggressorId, defenderId) => {
            this.handleGuildWar(aggressorId, defenderId);
        });
    }
    
    startActivityTracking() {
        // Update guild activity every minute
        setInterval(() => {
            this.updateGuildActivity();
        }, 60000);
        
        // Check for inactive guilds every hour
        setInterval(() => {
            this.checkInactiveGuilds();
        }, 3600000);
    }
    
    // Guild management
    async createGuild(playerId, guildData) {
        const player = await this.getPlayerData(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        
        // Check if player is already in a guild
        if (this.playerGuilds.has(playerId)) {
            return { success: false, message: 'Already in a guild' };
        }
        
        // Check if player has enough gold
        if (player.gold < this.config.createGuildCost) {
            return { success: false, message: 'Insufficient gold' };
        }
        
        // Validate guild data
        if (!guildData.name || guildData.name.length > this.config.maxGuildNameLength) {
            return { success: false, message: 'Invalid guild name' };
        }
        
        if (!guildData.tag || guildData.tag.length > this.config.maxGuildTagLength) {
            return { success: false, message: 'Invalid guild tag' };
        }
        
        // Check if name or tag is taken
        for (const guild of this.guilds.values()) {
            if (guild.name === guildData.name || guild.tag === guildData.tag) {
                return { success: false, message: 'Name or tag already taken' };
            }
        }
        
        try {
            // Deduct gold
            await this.server.db.run(`
                UPDATE characters SET gold = gold - ? WHERE player_id = ?
            `, [this.config.createGuildCost, playerId]);
            
            // Create guild
            const guildId = this.generateGuildId();
            const guild = {
                id: guildId,
                name: guildData.name,
                tag: guildData.tag,
                leaderId: playerId,
                level: 1,
                experience: 0,
                gold: 0,
                description: guildData.description || '',
                createdAt: Date.now(),
                members: [{
                    playerId: playerId,
                    rank: 'leader',
                    joinedAt: Date.now(),
                    contribution: 0
                }],
                ranks: { ...this.config.ranks },
                bank: [],
                settings: {
                    inviteOnly: false,
                    requireApproval: false,
                    minLevel: 1
                },
                lastActivity: Date.now(),
                status: 'active'
            };
            
            // Save to database
            await this.saveGuild(guild);
            
            // Add to active guilds
            this.guilds.set(guildId, guild);
            this.playerGuilds.set(playerId, guildId);
            
            // Notify player
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('guildCreated', {
                    guild: this.getGuildSummary(guild)
                });
            }
            
            console.log(`Guild created: ${guild.name} (${guildId}) by player ${playerId}`);
            
            return { success: true, guild: guild };
            
        } catch (error) {
            console.error('Error creating guild:', error);
            return { success: false, message: 'Error creating guild' };
        }
    }
    
    async inviteToGuild(leaderId, targetId) {
        const guild = this.getPlayerGuild(leaderId);
        if (!guild) {
            return { success: false, message: 'Not in a guild' };
        }
        
        // Check permissions
        if (!this.hasPermission(leaderId, 'invite')) {
            return { success: false, message: 'No permission to invite' };
        }
        
        // Check if target is already in a guild
        if (this.playerGuilds.has(targetId)) {
            return { success: false, message: 'Target already in a guild' };
        }
        
        // Check guild size limit
        const maxMembers = this.config.guildLevels[guild.level].maxMembers;
        if (guild.members.length >= maxMembers) {
            return { success: false, message: 'Guild is full' };
        }
        
        // Send invitation
        const targetSocket = this.server.getPlayerSocket(targetId);
        if (!targetSocket) {
            return { success: false, message: 'Target not online' };
        }
        
        const invitation = {
            id: this.generateInvitationId(),
            guildId: guild.id,
            guildName: guild.name,
            guildTag: guild.tag,
            inviterId: leaderId,
            inviterName: await this.getPlayerName(leaderId),
            timestamp: Date.now(),
            expiresAt: Date.now() + 300000 // 5 minutes
        };
        
        targetSocket.emit('guildInvitation', invitation);
        
        // Also notify inviter
        const inviterSocket = this.server.getPlayerSocket(leaderId);
        if (inviterSocket) {
            inviterSocket.emit('guildInvitationSent', {
                targetId: targetId,
                targetName: await this.getPlayerName(targetId)
            });
        }
        
        console.log(`Guild invitation sent: ${guild.name} -> ${targetId}`);
        
        return { success: true, invitation: invitation };
    }
    
    async acceptGuildInvitation(playerId, invitationId) {
        // This would be handled by the client accepting the invitation
        // For now, we'll implement the join logic
        return { success: true, message: 'Invitation accepted' };
    }
    
    async joinGuild(playerId, guildId) {
        const guild = this.guilds.get(guildId);
        if (!guild) {
            return { success: false, message: 'Guild not found' };
        }
        
        // Check if player is already in a guild
        if (this.playerGuilds.has(playerId)) {
            return { success: false, message: 'Already in a guild' };
        }
        
        // Check guild size limit
        const maxMembers = this.config.guildLevels[guild.level].maxMembers;
        if (guild.members.length >= maxMembers) {
            return { success: false, message: 'Guild is full' };
        }
        
        // Add member to guild
        const member = {
            playerId: playerId,
            rank: 'member',
            joinedAt: Date.now(),
            contribution: 0
        };
        
        guild.members.push(member);
        guild.lastActivity = Date.now();
        
        // Update mappings
        this.playerGuilds.set(playerId, guildId);
        
        // Save guild
        await this.saveGuild(guild);
        
        // Notify guild members
        this.notifyGuildMembers(guild, {
            type: 'member_joined',
            playerId: playerId,
            playerName: await this.getPlayerName(playerId),
            rank: member.rank
        });
        
        // Notify new member
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('guildJoined', {
                guild: this.getGuildSummary(guild)
            });
        }
        
        console.log(`Player ${playerId} joined guild ${guild.name}`);
        
        return { success: true, guild: guild };
    }
    
    async leaveGuild(playerId) {
        const guildId = this.playerGuilds.get(playerId);
        if (!guildId) {
            return { success: false, message: 'Not in a guild' };
        }
        
        const guild = this.guilds.get(guildId);
        if (!guild) {
            return { success: false, message: 'Guild not found' };
        }
        
        // Check if player is leader
        if (guild.leaderId === playerId) {
            // Leader cannot leave, must transfer leadership or disband
            return { success: false, message: 'Leader cannot leave guild' };
        }
        
        // Remove member
        const memberIndex = guild.members.findIndex(m => m.playerId === playerId);
        if (memberIndex !== -1) {
            guild.members.splice(memberIndex, 1);
        }
        
        // Update mappings
        this.playerGuilds.delete(playerId);
        
        // Save guild
        await this.saveGuild(guild);
        
        // Notify guild members
        this.notifyGuildMembers(guild, {
            type: 'member_left',
            playerId: playerId,
            playerName: await this.getPlayerName(playerId)
        });
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('guildLeft', {
                guildId: guildId
            });
        }
        
        console.log(`Player ${playerId} left guild ${guild.name}`);
        
        return { success: true };
    }
    
    async kickFromGuild(leaderId, targetId) {
        const guild = this.getPlayerGuild(leaderId);
        if (!guild) {
            return { success: false, message: 'Not in a guild' };
        }
        
        // Check permissions
        if (!this.hasPermission(leaderId, 'kick')) {
            return { success: false, message: 'No permission to kick' };
        }
        
        // Cannot kick leader
        if (guild.leaderId === targetId) {
            return { success: false, message: 'Cannot kick guild leader' };
        }
        
        // Cannot kick members with equal or higher rank
        const targetRank = this.getMemberRank(guild, targetId);
        const leaderRank = this.getMemberRank(guild, leaderId);
        
        if (this.compareRanks(targetRank, leaderRank) >= 0) {
            return { success: false, message: 'Cannot kick member with equal or higher rank' };
        }
        
        // Remove member
        const memberIndex = guild.members.findIndex(m => m.playerId === targetId);
        if (memberIndex !== -1) {
            guild.members.splice(memberIndex, 1);
        }
        
        // Update mappings
        this.playerGuilds.delete(targetId);
        
        // Save guild
        await this.saveGuild(guild);
        
        // Notify guild members
        this.notifyGuildMembers(guild, {
            type: 'member_kicked',
            playerId: targetId,
            playerName: await this.getPlayerName(targetId),
            kickedBy: await this.getPlayerName(leaderId)
        });
        
        // Notify kicked player
        const socket = this.server.getPlayerSocket(targetId);
        if (socket) {
            socket.emit('guildKicked', {
                guildId: guild.id,
                guildName: guild.name
            });
        }
        
        console.log(`Player ${targetId} kicked from guild ${guild.name} by ${leaderId}`);
        
        return { success: true };
    }
    
    async transferLeadership(leaderId, targetId) {
        const guild = this.getPlayerGuild(leaderId);
        if (!guild) {
            return { success: false, message: 'Not in a guild' };
        }
        
        // Only leader can transfer leadership
        if (guild.leaderId !== leaderId) {
            return { success: false, message: 'Only leader can transfer leadership' };
        }
        
        // Check if target is guild member
        if (!this.isGuildMember(guild.id, targetId)) {
            return { success: false, message: 'Target not in guild' };
        }
        
        // Transfer leadership
        const oldLeaderRank = this.getMemberRank(guild, leaderId);
        const newLeaderRank = this.getMemberRank(guild, targetId);
        
        guild.leaderId = targetId;
        
        // Update ranks
        this.setMemberRank(guild, leaderId, 'officer');
        this.setMemberRank(guild, targetId, 'leader');
        
        // Save guild
        await this.saveGuild(guild);
        
        // Notify guild members
        this.notifyGuildMembers(guild, {
            type: 'leadership_transferred',
            oldLeaderId: leaderId,
            oldLeaderName: await this.getPlayerName(leaderId),
            newLeaderId: targetId,
            newLeaderName: await this.getPlayerName(targetId)
        });
        
        console.log(`Leadership transferred in guild ${guild.name}: ${leaderId} -> ${targetId}`);
        
        return { success: true };
    }
    
    async disbandGuild(leaderId) {
        const guild = this.getPlayerGuild(leaderId);
        if (!guild) {
            return { success: false, message: 'Not in a guild' };
        }
        
        // Only leader can disband
        if (guild.leaderId !== leaderId) {
            return { success: false, message: 'Only leader can disband guild' };
        }
        
        // Remove all members from guild
        for (const member of guild.members) {
            this.playerGuilds.delete(member.playerId);
            
            // Notify members
            const socket = this.server.getPlayerSocket(member.playerId);
            if (socket) {
                socket.emit('guildDisbanded', {
                    guildId: guild.id,
                    guildName: guild.name
                });
            }
        }
        
        // Handle active wars
        for (const [warId, war] of this.guildWars) {
            if (war.aggressorId === guild.id || war.defenderId === guild.id) {
                this.endGuildWar(warId, 'disbanded');
            }
        }
        
        // Handle alliances
        for (const [allianceId, alliance] of this.alliances) {
            if (alliance.guild1Id === guild.id || alliance.guild2Id === guild.id) {
                this.endAlliance(allianceId);
            }
        }
        
        // Remove guild
        this.guilds.delete(guild.id);
        
        // Update database
        await this.server.db.run('DELETE FROM guilds WHERE id = ?', [guild.id]);
        
        console.log(`Guild disbanded: ${guild.name} (${guild.id})`);
        
        return { success: true };
    }
    
    // Guild wars
    async declareWar(aggressorId, defenderId) {
        const aggressorGuild = this.guilds.get(aggressorId);
        const defenderGuild = this.guilds.get(defenderId);
        
        if (!aggressorGuild || !defenderGuild) {
            return { success: false, message: 'Guild not found' };
        }
        
        // Check if already at war
        for (const war of this.guildWars.values()) {
            if ((war.aggressorId === aggressorId && war.defenderId === defenderId) ||
                (war.aggressorId === defenderId && war.defenderId === aggressorId)) {
                return { success: false, message: 'Already at war' };
            }
        }
        
        // Check if allied
        if (this.areAllied(aggressorId, defenderId)) {
            return { success: false, message: 'Cannot declare war on allied guild' };
        }
        
        // Check guild level (must be at least level 2)
        if (aggressorGuild.level < 2 || defenderGuild.level < 2) {
            return { success: false, message: 'Guilds must be at least level 2 to wage war' };
        }
        
        try {
            // Deduct war cost from aggressor
            if (aggressorGuild.gold < this.config.guildWarCost) {
                return { success: false, message: 'Insufficient guild funds' };
            }
            
            aggressorGuild.gold -= this.config.guildWarCost;
            
            // Create war
            const warId = this.generateWarId();
            const war = {
                id: warId,
                aggressorId: aggressorId,
                defenderId: defenderId,
                startTime: Date.now(),
                endTime: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
                warGoals: [
                    { type: 'kills', target: 100, progress: { aggressor: 0, defender: 0 } },
                    { type: 'territory', target: 3, progress: { aggressor: 0, defender: 0 } }
                ],
                score: { aggressor: 0, defender: 0 },
                status: 'active',
                participants: {
                    aggressor: aggressorGuild.members.map(m => m.playerId),
                    defender: defenderGuild.members.map(m => m.playerId)
                }
            };
            
            // Save to database
            await this.server.db.run(`
                INSERT INTO guild_wars (id, aggressor_id, defender_id, start_time, end_time, war_goals, status, participants)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                warId,
                aggressorId,
                defenderId,
                war.startTime,
                war.endTime,
                JSON.stringify(war.warGoals),
                war.status,
                JSON.stringify(war.participants)
            ]);
            
            // Add to active wars
            this.guildWars.set(warId, war);
            
            // Save guilds
            await this.saveGuild(aggressorGuild);
            await this.saveGuild(defenderGuild);
            
            // Notify all guild members
            this.notifyGuildMembers(aggressorGuild, {
                type: 'war_declared',
                war: this.getWarSummary(war),
                role: 'aggressor'
            });
            
            this.notifyGuildMembers(defenderGuild, {
                type: 'war_declared',
                war: this.getWarSummary(war),
                role: 'defender'
            });
            
            console.log(`War declared: ${aggressorGuild.name} vs ${defenderGuild.name}`);
            
            return { success: true, war: war };
            
        } catch (error) {
            console.error('Error declaring war:', error);
            return { success: false, message: 'Error declaring war' };
        }
    }
    
    updateWarProgress(warId, eventType, data) {
        const war = this.guildWars.get(warId);
        if (!war || war.status !== 'active') return;
        
        switch (eventType) {
            case 'kill':
                this.updateWarKillProgress(war, data);
                break;
            case 'territory':
                this.updateWarTerritoryProgress(war, data);
                break;
        }
        
        // Check win conditions
        this.checkWarWinConditions(war);
    }
    
    updateWarKillProgress(war, data) {
        const { victimId, killerId } = data;
        
        // Determine which side the kill benefits
        let side = null;
        if (war.participants.aggressor.includes(killerId) && war.participants.defender.includes(victimId)) {
            side = 'aggressor';
        } else if (war.participants.defender.includes(killerId) && war.participants.aggressor.includes(victimId)) {
            side = 'defender';
        }
        
        if (side) {
            war.score[side]++;
            
            // Update kill objective
            const killObjective = war.warGoals.find(g => g.type === 'kills');
            if (killObjective) {
                killObjective.progress[side]++;
            }
            
            // Notify participants
            this.notifyWarParticipants(war, {
                type: 'war_score_update',
                warId: war.id,
                score: war.score,
                kill: { killerId, victimId, side }
            });
        }
    }
    
    updateWarTerritoryProgress(war, data) {
        // Territory control logic would go here
        // This would involve controlling specific areas or objectives
    }
    
    checkWarWinConditions(war) {
        const now = Date.now();
        
        // Check time limit
        if (now >= war.endTime) {
            this.endGuildWar(war.id, 'time_limit');
            return;
        }
        
        // Check kill objective
        const killObjective = war.warGoals.find(g => g.type === 'kills');
        if (killObjective) {
            if (killObjective.progress.aggressor >= killObjective.target) {
                this.endGuildWar(war.id, 'aggressor_victory');
                return;
            } else if (killObjective.progress.defender >= killObjective.target) {
                this.endGuildWar(war.id, 'defender_victory');
                return;
            }
        }
    }
    
    async endGuildWar(warId, reason) {
        const war = this.guildWars.get(warId);
        if (!war) return;
        
        war.status = 'ended';
        war.endTime = Date.now();
        war.result = reason;
        
        const aggressorGuild = this.guilds.get(war.aggressorId);
        const defenderGuild = this.guilds.get(war.defenderId);
        
        let winner = null;
        let loser = null;
        
        if (reason === 'aggressor_victory') {
            winner = aggressorGuild;
            loser = defenderGuild;
        } else if (reason === 'defender_victory') {
            winner = defenderGuild;
            loser = aggressorGuild;
        } else if (reason === 'time_limit') {
            // Determine winner by score
            if (war.score.aggressor > war.score.defender) {
                winner = aggressorGuild;
                loser = defenderGuild;
            } else if (war.score.defender > war.score.aggressor) {
                winner = defenderGuild;
                loser = aggressorGuild;
            }
        }
        
        // Award rewards
        if (winner && loser) {
            await this.awardWarRewards(winner, loser, war);
        }
        
        // Add to history
        this.warHistory.push({
            warId: war.id,
            aggressorId: war.aggressorId,
            defenderId: war.defenderId,
            startTime: war.startTime,
            endTime: war.endTime,
            result: reason,
            winner: winner ? winner.id : null,
            finalScore: war.score
        });
        
        // Update database
        await this.server.db.run(`
            UPDATE guild_wars SET status = ?, end_time = ?, result = ? WHERE id = ?
        `, [war.status, war.endTime, reason, warId]);
        
        // Notify participants
        this.notifyWarParticipants(war, {
            type: 'war_ended',
            warId: war.id,
            result: reason,
            winner: winner ? winner.name : null,
            finalScore: war.score
        });
        
        // Remove from active wars
        this.guildWars.delete(warId);
        
        console.log(`War ended: ${war.aggressorId} vs ${war.defenderId} - ${reason}`);
    }
    
    async awardWarRewards(winner, loser, war) {
        // Award guild experience
        winner.experience += 10000;
        loser.experience += 2000;
        
        // Award gold from loser to winner (portion of guild bank)
        const goldTransfer = Math.floor(loser.gold * 0.2); // 20% of loser's gold
        loser.gold -= goldTransfer;
        winner.gold += goldTransfer;
        
        // Save guilds
        await this.saveGuild(winner);
        await this.saveGuild(loser);
        
        // Check for level ups
        this.checkGuildLevelUp(winner);
        this.checkGuildLevelUp(loser);
    }
    
    // Alliances
    async createAlliance(guild1Id, guild2Id, type = 'mutual_defense') {
        // Check if already allied
        if (this.areAllied(guild1Id, guild2Id)) {
            return { success: false, message: 'Already allied' };
        }
        
        // Check if at war
        for (const war of this.guildWars.values()) {
            if ((war.aggressorId === guild1Id && war.defenderId === guild2Id) ||
                (war.aggressorId === guild2Id && war.defenderId === guild1Id)) {
                return { success: false, message: 'Cannot ally with guild at war' };
            }
        }
        
        const guild1 = this.guilds.get(guild1Id);
        const guild2 = this.guilds.get(guild2Id);
        
        if (!guild1 || !guild2) {
            return { success: false, message: 'Guild not found' };
        }
        
        try {
            // Deduct alliance cost
            if (guild1.gold < this.config.allianceCost || guild2.gold < this.config.allianceCost) {
                return { success: false, message: 'Insufficient guild funds' };
            }
            
            guild1.gold -= this.config.allianceCost;
            guild2.gold -= this.config.allianceCost;
            
            // Create alliance
            const allianceId = this.generateAllianceId();
            const alliance = {
                id: allianceId,
                guild1Id: guild1Id,
                guild2Id: guild2Id,
                createdAt: Date.now(),
                type: type,
                status: 'active'
            };
            
            // Save to database
            await this.server.db.run(`
                INSERT INTO guild_alliances (id, guild1_id, guild2_id, created_at, type, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [allianceId, guild1Id, guild2Id, alliance.createdAt, alliance.type, alliance.status]);
            
            // Add to active alliances
            this.alliances.set(allianceId, alliance);
            
            // Save guilds
            await this.saveGuild(guild1);
            await this.saveGuild(guild2);
            
            // Notify guild members
            this.notifyGuildMembers(guild1, {
                type: 'alliance_formed',
                allyGuildId: guild2Id,
                allyGuildName: guild2.name,
                allianceType: type
            });
            
            this.notifyGuildMembers(guild2, {
                type: 'alliance_formed',
                allyGuildId: guild1Id,
                allyGuildName: guild1.name,
                allianceType: type
            });
            
            console.log(`Alliance formed: ${guild1.name} + ${guild2.name}`);
            
            return { success: true, alliance: alliance };
            
        } catch (error) {
            console.error('Error creating alliance:', error);
            return { success: false, message: 'Error creating alliance' };
        }
    }
    
    async endAlliance(allianceId) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) return;
        
        const guild1 = this.guilds.get(alliance.guild1Id);
        const guild2 = this.guilds.get(alliance.guild2Id);
        
        // Update database
        await this.server.db.run(`
            UPDATE guild_alliances SET status = 'ended' WHERE id = ?
        `, [allianceId]);
        
        // Remove from active alliances
        this.alliances.delete(allianceId);
        
        // Notify guild members
        if (guild1) {
            this.notifyGuildMembers(guild1, {
                type: 'alliance_ended',
                allyGuildId: guild2Id,
                allyGuildName: guild2 ? guild2.name : 'Unknown'
            });
        }
        
        if (guild2) {
            this.notifyGuildMembers(guild2, {
                type: 'alliance_ended',
                allyGuildId: guild1Id,
                allyGuildName: guild1 ? guild1.name : 'Unknown'
            });
        }
        
        console.log(`Alliance ended: ${alliance.guild1Id} + ${alliance.guild2Id}`);
    }
    
    // Event handlers
    handlePlayerJoined(playerId, playerData) {
        // Notify if player is in a guild
        const guildId = this.playerGuilds.get(playerId);
        if (guildId) {
            const guild = this.guilds.get(guildId);
            if (guild) {
                const socket = this.server.getPlayerSocket(playerId);
                if (socket) {
                    socket.emit('guildData', {
                        guild: this.getGuildSummary(guild)
                    });
                }
                
                // Notify guild members
                this.notifyGuildMembers(guild, {
                    type: 'member_online',
                    playerId: playerId,
                    playerName: playerData.name
                }, playerId);
            }
        }
    }
    
    handlePlayerLeft(playerId) {
        // Notify guild members that player went offline
        const guildId = this.playerGuilds.get(playerId);
        if (guildId) {
            const guild = this.guilds.get(guildId);
            if (guild) {
                this.notifyGuildMembers(guild, {
                    type: 'member_offline',
                    playerId: playerId
                }, playerId);
            }
        }
    }
    
    handlePlayerDeath(playerId, killerId) {
        // Update war progress if killer is in enemy guild
        const victimGuildId = this.playerGuilds.get(playerId);
        const killerGuildId = this.playerGuilds.get(killerId);
        
        if (victimGuildId && killerGuildId && victimGuildId !== killerGuildId) {
            for (const war of this.guildWars.values()) {
                if ((war.aggressorId === killerGuildId && war.defenderId === victimGuildId) ||
                    (war.aggressorId === victimGuildId && war.defenderId === killerGuildId)) {
                    this.updateWarProgress(war.id, 'kill', { victimId, killerId });
                    break;
                }
            }
        }
    }
    
    handleEntityDeath(entityId, killerId) {
        // Award guild experience for entity kills
        const guildId = this.playerGuilds.get(killerId);
        if (guildId) {
            const guild = this.guilds.get(guildId);
            if (guild) {
                const entity = this.server.worldManager.entities.get(entityId);
                if (entity && entity.level) {
                    const expGain = entity.level * 10;
                    guild.experience += expGain;
                    this.checkGuildLevelUp(guild);
                }
            }
        }
    }
    
    // Utility methods
    updateGuildActivity() {
        const now = Date.now();
        
        for (const guild of this.guilds.values()) {
            // Update activity based on online members
            let hasActiveMembers = false;
            
            for (const member of guild.members) {
                const socket = this.server.getPlayerSocket(member.playerId);
                if (socket) {
                    hasActiveMembers = true;
                    break;
                }
            }
            
            if (hasActiveMembers) {
                guild.lastActivity = now;
            }
        }
    }
    
    checkInactiveGuilds() {
        const now = Date.now();
        const inactiveThreshold = this.config.inactivityDays * 24 * 60 * 60 * 1000;
        
        for (const [guildId, guild] of this.guilds) {
            if (now - guild.lastActivity > inactiveThreshold) {
                // Mark as inactive or disband
                guild.status = 'inactive';
                console.log(`Guild marked as inactive: ${guild.name}`);
            }
        }
    }
    
    checkGuildLevelUp(guild) {
        const currentLevel = guild.level;
        const nextLevel = currentLevel + 1;
        
        if (nextLevel <= 5 && this.config.guildLevels[nextLevel]) {
            const requiredExp = this.config.guildLevels[nextLevel].requiredExp;
            
            if (guild.experience >= requiredExp) {
                guild.level = nextLevel;
                
                // Notify guild members
                this.notifyGuildMembers(guild, {
                    type: 'guild_level_up',
                    newLevel: nextLevel,
                    guildName: guild.name
                });
                
                console.log(`Guild leveled up: ${guild.name} -> Level ${nextLevel}`);
            }
        }
    }
    
    // Permission system
    hasPermission(playerId, permission) {
        const guild = this.getPlayerGuild(playerId);
        if (!guild) return false;
        
        const rank = this.getMemberRank(guild, playerId);
        if (!rank) return false;
        
        return rank.permissions.includes('all') || rank.permissions.includes(permission);
    }
    
    getMemberRank(guild, playerId) {
        const member = guild.members.find(m => m.playerId === playerId);
        if (!member) return null;
        
        return guild.ranks[member.rank] || guild.ranks.member;
    }
    
    setMemberRank(guild, playerId, newRank) {
        const member = guild.members.find(m => m.playerId === playerId);
        if (member) {
            member.rank = newRank;
        }
    }
    
    compareRanks(rank1, rank2) {
        const rankOrder = ['initiate', 'member', 'veteran', 'officer', 'leader'];
        const index1 = rankOrder.indexOf(rank1);
        const index2 = rankOrder.indexOf(rank2);
        
        return index1 - index2;
    }
    
    isGuildMember(guildId, playerId) {
        const guild = this.guilds.get(guildId);
        if (!guild) return false;
        
        return guild.members.some(m => m.playerId === playerId);
    }
    
    areAllied(guild1Id, guild2Id) {
        for (const alliance of this.alliances.values()) {
            if ((alliance.guild1Id === guild1Id && alliance.guild2Id === guild2Id) ||
                (alliance.guild1Id === guild2Id && alliance.guild2Id === guild1Id)) {
                return true;
            }
        }
        return false;
    }
    
    // Notification system
    notifyGuildMembers(guild, data, excludePlayerId = null) {
        for (const member of guild.members) {
            if (member.playerId === excludePlayerId) continue;
            
            const socket = this.server.getPlayerSocket(member.playerId);
            if (socket) {
                socket.emit('guildNotification', data);
            }
        }
    }
    
    notifyWarParticipants(war, data) {
        const aggressorGuild = this.guilds.get(war.aggressorId);
        const defenderGuild = this.guilds.get(war.defenderId);
        
        if (aggressorGuild) {
            this.notifyGuildMembers(aggressorGuild, data);
        }
        
        if (defenderGuild) {
            this.notifyGuildMembers(defenderGuild, data);
        }
    }
    
    // Data accessors
    getPlayerGuild(playerId) {
        const guildId = this.playerGuilds.get(playerId);
        return guildId ? this.guilds.get(guildId) : null;
    }
    
    getGuildSummary(guild) {
        return {
            id: guild.id,
            name: guild.name,
            tag: guild.tag,
            level: guild.level,
            experience: guild.experience,
            leaderId: guild.leaderId,
            memberCount: guild.members.length,
            maxMembers: this.config.guildLevels[guild.level].maxMembers,
            description: guild.description,
            createdAt: guild.createdAt,
            status: guild.status
        };
    }
    
    getWarSummary(war) {
        const aggressorGuild = this.guilds.get(war.aggressorId);
        const defenderGuild = this.guilds.get(war.defenderId);
        
        return {
            id: war.id,
            aggressor: {
                guildId: war.aggressorId,
                guildName: aggressorGuild ? aggressorGuild.name : 'Unknown',
                score: war.score.aggressor
            },
            defender: {
                guildId: war.defenderId,
                guildName: defenderGuild ? defenderGuild.name : 'Unknown',
                score: war.score.defender
            },
            startTime: war.startTime,
            endTime: war.endTime,
            status: war.status,
            warGoals: war.warGoals
        };
    }
    
    // Database operations
    async saveGuild(guild) {
        try {
            await this.server.db.run(`
                INSERT OR REPLACE INTO guilds 
                (id, name, tag, leader_id, level, experience, gold, description, created_at, members, ranks, bank, settings, last_activity, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                guild.id,
                guild.name,
                guild.tag,
                guild.leaderId,
                guild.level,
                guild.experience,
                guild.gold,
                guild.description,
                guild.createdAt,
                JSON.stringify(guild.members),
                JSON.stringify(guild.ranks),
                JSON.stringify(guild.bank),
                JSON.stringify(guild.settings),
                guild.lastActivity,
                guild.status
            ]);
        } catch (error) {
            console.error('Error saving guild:', error);
        }
    }
    
    async getPlayerData(playerId) {
        try {
            const player = await this.server.db.get(
                'SELECT * FROM characters WHERE player_id = ?',
                [playerId]
            );
            return player;
        } catch (error) {
            console.error('Error getting player data:', error);
            return null;
        }
    }
    
    async getPlayerName(playerId) {
        const player = await this.getPlayerData(playerId);
        return player ? player.name : 'Unknown';
    }
    
    // ID generators
    generateGuildId() {
        return 'guild_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateInvitationId() {
        return 'invite_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateWarId() {
        return 'war_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateAllianceId() {
        return 'alliance_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Public API
    getGuild(guildId) {
        return this.guilds.get(guildId);
    }
    
    getGuilds() {
        const guilds = [];
        for (const guild of this.guilds.values()) {
            guilds.push(this.getGuildSummary(guild));
        }
        return guilds;
    }
    
    getActiveWars() {
        const wars = [];
        for (const war of this.guildWars.values()) {
            wars.push(this.getWarSummary(war));
        }
        return wars;
    }
    
    getWarHistory(limit = 50) {
        return this.warHistory.slice(-limit);
    }
    
    getGuildLeaderboard(type = 'level', limit = 10) {
        const leaderboard = [];
        
        for (const guild of this.guilds.values()) {
            let score = 0;
            
            switch (type) {
                case 'level':
                    score = guild.level;
                    break;
                case 'experience':
                    score = guild.experience;
                    break;
                case 'members':
                    score = guild.members.length;
                    break;
                case 'wins':
                    score = this.warHistory.filter(w => w.winner === guild.id).length;
                    break;
            }
            
            leaderboard.push({
                guildId: guild.id,
                guildName: guild.name,
                guildTag: guild.tag,
                score: score
            });
        }
        
        // Sort by score (descending)
        leaderboard.sort((a, b) => b.score - a.score);
        
        return leaderboard.slice(0, limit);
    }
    
    // Cleanup
    async cleanup() {
        // Save all guild data
        for (const guild of this.guilds.values()) {
            await this.saveGuild(guild);
        }
        
        // Clear data
        this.guilds.clear();
        this.playerGuilds.clear();
        this.guildWars.clear();
        this.alliances.clear();
        
        console.log('Guild System cleanup complete');
    }
}

module.exports = GuildSystem;
