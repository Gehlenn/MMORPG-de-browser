/**
 * Party System - Cooperative Multiplayer Party Management
 * Handles party creation, invites, member management, and shared rewards
 * Version 0.3.3 - Cooperative Multiplayer Gameplay
 */

class PartySystem {
    constructor(server) {
        this.server = server;
        
        // Party storage
        this.parties = new Map(); // partyId -> party data
        this.playerParties = new Map(); // playerId -> partyId
        
        // Configuration
        this.config = {
            maxPartySize: 5,
            inviteTimeout: 30000, // 30 seconds
            disbandTimeout: 60000, // 1 minute after last member leaves
            xpShareRadius: 200, // pixels
            partyXPBonus: 0.1, // 10% bonus
            partyDropBonus: 0.1 // 10% bonus
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        this.startCleanupTimer();
        console.log('Party System initialized');
    }
    
    setupEventHandlers() {
        this.server.on('createParty', (socket) => {
            this.handleCreateParty(socket);
        });
        
        this.server.on('inviteToParty', (socket, data) => {
            this.handleInviteToParty(socket, data);
        });
        
        this.server.on('acceptPartyInvite', (socket, data) => {
            this.handleAcceptPartyInvite(socket, data);
        });
        
        this.server.on('declinePartyInvite', (socket, data) => {
            this.handleDeclinePartyInvite(socket, data);
        });
        
        this.server.on('leaveParty', (socket) => {
            this.handleLeaveParty(socket);
        });
        
        this.server.on('kickFromParty', (socket, data) => {
            this.handleKickFromParty(socket, data);
        });
        
        this.server.on('promotePartyLeader', (socket, data) => {
            this.handlePromotePartyLeader(socket, data);
        });
        
        this.server.on('requestPartyInfo', (socket) => {
            this.handleRequestPartyInfo(socket);
        });
        
        this.server.on('playerDisconnected', (playerId) => {
            this.handlePlayerDisconnected(playerId);
        });
    }
    
    handleCreateParty(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        // Check if player is already in a party
        if (this.playerParties.has(socket.playerId)) {
            socket.emit('partyError', { message: 'Você já está em um grupo!' });
            return;
        }
        
        // Create new party
        const partyId = this.generatePartyId();
        const party = {
            id: partyId,
            leader: socket.playerId,
            members: new Map([
                [socket.playerId, {
                    id: socket.playerId,
                    name: player.name,
                    level: player.level,
                    class: player.class,
                    joinedAt: Date.now(),
                    isLeader: true
                }]
            ]),
            invites: new Map(),
            dungeon: null,
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        
        this.parties.set(partyId, party);
        this.playerParties.set(socket.playerId, partyId);
        
        // Send party info to creator
        socket.emit('partyCreated', {
            partyId: partyId,
            members: this.getPartyMembersArray(party),
            isLeader: true
        });
        
        console.log(`Player ${player.name} created party ${partyId}`);
    }
    
    handleInviteToParty(socket, data) {
        const { targetPlayerName } = data;
        const player = this.server.players.get(socket.playerId);
        
        if (!player) return;
        
        // Check if player is in a party and is leader
        const partyId = this.playerParties.get(socket.playerId);
        if (!partyId) {
            socket.emit('partyError', { message: 'Você não está em um grupo!' });
            return;
        }
        
        const party = this.parties.get(partyId);
        if (!party || party.leader !== socket.playerId) {
            socket.emit('partyError', { message: 'Apenas o líder pode convidar!' });
            return;
        }
        
        // Check if party is full
        if (party.members.size >= this.config.maxPartySize) {
            socket.emit('partyError', { message: 'O grupo está cheio!' });
            return;
        }
        
        // Find target player
        const targetPlayer = this.findPlayerByName(targetPlayerName);
        if (!targetPlayer) {
            socket.emit('partyError', { message: 'Jogador não encontrado!' });
            return;
        }
        
        // Check if target is already in a party
        if (this.playerParties.has(targetPlayer.id)) {
            socket.emit('partyError', { message: 'Este jogador já está em um grupo!' });
            return;
        }
        
        // Check if already invited
        if (party.invites.has(targetPlayer.id)) {
            socket.emit('partyError', { message: 'Já foi enviado um convite para este jogador!' });
            return;
        }
        
        // Create invite
        const invite = {
            from: socket.playerId,
            fromName: player.name,
            to: targetPlayer.id,
            partyId: partyId,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.config.inviteTimeout
        };
        
        party.invites.set(targetPlayer.id, invite);
        
        // Send invite to target
        const targetSocket = this.server.getPlayerSocket(targetPlayer.id);
        if (targetSocket) {
            targetSocket.emit('partyInvite', {
                from: player.name,
                partyId: partyId,
                expiresAt: invite.expiresAt
            });
        }
        
        // Send confirmation to inviter
        socket.emit('partyInviteSent', { targetName: targetPlayerName });
        
        // Set invite expiration
        setTimeout(() => {
            if (party.invites.has(targetPlayer.id)) {
                party.invites.delete(targetPlayer.id);
                
                // Notify inviter that invite expired
                socket.emit('partyInviteExpired', { targetName: targetPlayerName });
                
                // Notify target that invite expired
                const targetSocket = this.server.getPlayerSocket(targetPlayer.id);
                if (targetSocket) {
                    targetSocket.emit('partyInviteExpired', { fromName: player.name });
                }
            }
        }, this.config.inviteTimeout);
        
        console.log(`${player.name} invited ${targetPlayerName} to party ${partyId}`);
    }
    
    handleAcceptPartyInvite(socket, data) {
        const { partyId } = data;
        const player = this.server.players.get(socket.playerId);
        
        if (!player) return;
        
        // Check if player is already in a party
        if (this.playerParties.has(socket.playerId)) {
            socket.emit('partyError', { message: 'Você já está em um grupo!' });
            return;
        }
        
        const party = this.parties.get(partyId);
        if (!party) {
            socket.emit('partyError', { message: 'Grupo não encontrado!' });
            return;
        }
        
        // Check if invite exists
        const invite = party.invites.get(socket.playerId);
        if (!invite) {
            socket.emit('partyError', { message: 'Convite não encontrado!' });
            return;
        }
        
        // Check if party is full
        if (party.members.size >= this.config.maxPartySize) {
            socket.emit('partyError', { message: 'O grupo está cheio!' });
            return;
        }
        
        // Add player to party
        party.members.set(socket.playerId, {
            id: socket.playerId,
            name: player.name,
            level: player.level,
            class: player.class,
            joinedAt: Date.now(),
            isLeader: false
        });
        
        party.invites.delete(socket.playerId);
        party.lastActivity = Date.now();
        
        this.playerParties.set(socket.playerId, partyId);
        
        // Send party info to new member
        socket.emit('partyJoined', {
            partyId: partyId,
            members: this.getPartyMembersArray(party),
            isLeader: false
        });
        
        // Notify all party members
        this.broadcastToParty(partyId, 'partyMemberJoined', {
            member: {
                id: socket.playerId,
                name: player.name,
                level: player.level,
                class: player.class
            }
        });
        
        console.log(`${player.name} joined party ${partyId}`);
    }
    
    handleDeclinePartyInvite(socket, data) {
        const { partyId } = data;
        const player = this.server.players.get(socket.playerId);
        
        if (!player) return;
        
        const party = this.parties.get(partyId);
        if (!party) return;
        
        // Remove invite
        party.invites.delete(socket.playerId);
        
        // Notify party leader
        const leaderSocket = this.server.getPlayerSocket(party.leader);
        if (leaderSocket) {
            leaderSocket.emit('partyInviteDeclined', { playerName: player.name });
        }
        
        console.log(`${player.name} declined party invite to ${partyId}`);
    }
    
    handleLeaveParty(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const partyId = this.playerParties.get(socket.playerId);
        if (!partyId) {
            socket.emit('partyError', { message: 'Você não está em um grupo!' });
            return;
        }
        
        const party = this.parties.get(partyId);
        if (!party) return;
        
        // Remove player from party
        party.members.delete(socket.playerId);
        this.playerParties.delete(socket.playerId);
        
        // Notify player
        socket.emit('partyLeft', {});
        
        // Notify remaining party members
        this.broadcastToParty(partyId, 'partyMemberLeft', {
            memberId: socket.playerId,
            memberName: player.name
        });
        
        // Check if party should be disbanded
        if (party.members.size === 0) {
            this.disbandParty(partyId);
        } else if (party.leader === socket.playerId) {
            // Promote new leader
            this.promoteNewLeader(party);
        }
        
        // Leave dungeon if in one
        if (party.dungeon) {
            this.leaveDungeonInstance(socket.playerId, partyId);
        }
        
        console.log(`${player.name} left party ${partyId}`);
    }
    
    handleKickFromParty(socket, data) {
        const { targetPlayerId } = data;
        const player = this.server.players.get(socket.playerId);
        
        if (!player) return;
        
        const partyId = this.playerParties.get(socket.playerId);
        if (!partyId) {
            socket.emit('partyError', { message: 'Você não está em um grupo!' });
            return;
        }
        
        const party = this.parties.get(partyId);
        if (!party || party.leader !== socket.playerId) {
            socket.emit('partyError', { message: 'Apenas o líder pode remover membros!' });
            return;
        }
        
        const targetMember = party.members.get(targetPlayerId);
        if (!targetMember) {
            socket.emit('partyError', { message: 'Membro não encontrado no grupo!' });
            return;
        }
        
        // Remove target from party
        party.members.delete(targetPlayerId);
        this.playerParties.delete(targetPlayerId);
        
        // Notify kicked player
        const targetSocket = this.server.getPlayerSocket(targetPlayerId);
        if (targetSocket) {
            targetSocket.emit('partyKicked', { partyId: partyId });
        }
        
        // Notify party members
        this.broadcastToParty(partyId, 'partyMemberKicked', {
            memberId: targetPlayerId,
            memberName: targetMember.name
        });
        
        // Leave dungeon if in one
        if (party.dungeon) {
            this.leaveDungeonInstance(targetPlayerId, partyId);
        }
        
        console.log(`${targetMember.name} was kicked from party ${partyId}`);
    }
    
    handlePromotePartyLeader(socket, data) {
        const { targetPlayerId } = data;
        const player = this.server.players.get(socket.playerId);
        
        if (!player) return;
        
        const partyId = this.playerParties.get(socket.playerId);
        if (!partyId) {
            socket.emit('partyError', { message: 'Você não está em um grupo!' });
            return;
        }
        
        const party = this.parties.get(partyId);
        if (!party || party.leader !== socket.playerId) {
            socket.emit('partyError', { message: 'Apenas o líder pode promover!' });
            return;
        }
        
        const targetMember = party.members.get(targetPlayerId);
        if (!targetMember) {
            socket.emit('partyError', { message: 'Membro não encontrado no grupo!' });
            return;
        }
        
        // Transfer leadership
        const oldLeader = party.members.get(party.leader);
        if (oldLeader) {
            oldLeader.isLeader = false;
        }
        
        party.leader = targetPlayerId;
        targetMember.isLeader = true;
        
        // Notify all party members
        this.broadcastToParty(partyId, 'partyLeaderChanged', {
            newLeaderId: targetPlayerId,
            newLeaderName: targetMember.name
        });
        
        console.log(`${targetMember.name} promoted to leader of party ${partyId}`);
    }
    
    handleRequestPartyInfo(socket) {
        const partyId = this.playerParties.get(socket.playerId);
        if (!partyId) {
            socket.emit('partyError', { message: 'Você não está em um grupo!' });
            return;
        }
        
        const party = this.parties.get(partyId);
        if (!party) return;
        
        socket.emit('partyInfo', {
            partyId: partyId,
            members: this.getPartyMembersArray(party),
            isLeader: party.leader === socket.playerId,
            dungeon: party.dungeon
        });
    }
    
    handlePlayerDisconnected(playerId) {
        const partyId = this.playerParties.get(playerId);
        if (!partyId) return;
        
        const party = this.parties.get(partyId);
        if (!party) return;
        
        const member = party.members.get(playerId);
        if (!member) return;
        
        // Remove player from party
        party.members.delete(playerId);
        this.playerParties.delete(playerId);
        
        // Notify remaining party members
        this.broadcastToParty(partyId, 'partyMemberDisconnected', {
            memberId: playerId,
            memberName: member.name
        });
        
        // Check if party should be disbanded
        if (party.members.size === 0) {
            this.disbandParty(partyId);
        } else if (party.leader === playerId) {
            // Promote new leader
            this.promoteNewLeader(party);
        }
        
        // Leave dungeon if in one
        if (party.dungeon) {
            this.leaveDungeonInstance(playerId, partyId);
        }
        
        console.log(`Player ${member.name} disconnected and left party ${partyId}`);
    }
    
    promoteNewLeader(party) {
        if (party.members.size === 0) return;
        
        // Promote first available member
        const [newLeaderId, newLeader] = party.members.entries().next().value;
        party.leader = newLeaderId;
        newLeader.isLeader = true;
        
        // Notify party members
        this.broadcastToParty(party.id, 'partyLeaderChanged', {
            newLeaderId: newLeaderId,
            newLeaderName: newLeader.name
        });
        
        console.log(`${newLeader.name} auto-promoted to leader of party ${party.id}`);
    }
    
    // XP and Loot Distribution
    distributeXP(mob, nearbyPlayers) {
        const partyMembers = this.getNearbyPartyMembers(nearbyPlayers, mob.x, mob.y);
        
        if (partyMembers.length <= 1) return;
        
        // Calculate party XP bonus
        const baseXP = this.calculateMobXP(mob);
        const partyBonus = 1 + this.config.partyXPBonus;
        const totalXP = Math.floor(baseXP * partyBonus);
        const xpPerMember = Math.floor(totalXP / partyMembers.length);
        
        // Distribute XP to party members
        for (const member of partyMembers) {
            const player = this.server.players.get(member.id);
            if (player) {
                this.giveXPToPlayer(player, xpPerMember);
                
                // Notify player
                const socket = this.server.getPlayerSocket(member.id);
                if (socket) {
                    socket.emit('xpGained', {
                        amount: xpPerMember,
                        source: 'party',
                        bonus: this.config.partyXPBonus
                    });
                }
            }
        }
    }
    
    distributeLoot(mob, nearbyPlayers) {
        const partyMembers = this.getNearbyPartyMembers(nearbyPlayers, mob.x, mob.y);
        
        if (partyMembers.length <= 1) return;
        
        // Apply party drop bonus
        const dropChance = 0.7 * (1 + this.config.partyDropBonus);
        
        if (Math.random() < dropChance) {
            // Generate loot
            const loot = this.server.systems.itemSystem.generateLoot(mob.level, mob.type);
            
            if (loot && loot.length > 0) {
                // Random party member gets loot
                const luckyMember = partyMembers[Math.floor(Math.random() * partyMembers.length)];
                const player = this.server.players.get(luckyMember.id);
                
                if (player) {
                    // Give loot to player
                    for (const item of loot) {
                        this.server.systems.itemSystem.giveItemToPlayer(luckyMember.id, item.id, item.quantity || 1);
                    }
                    
                    // Notify party
                    this.broadcastToParty(this.playerParties.get(luckyMember.id), 'partyLoot', {
                        playerName: luckyMember.name,
                        items: loot
                    });
                }
            }
        }
    }
    
    getNearbyPartyMembers(players, x, y) {
        const nearby = [];
        
        for (const player of players) {
            const distance = Math.sqrt(
                Math.pow(x - player.x, 2) + 
                Math.pow(y - player.y, 2)
            );
            
            if (distance <= this.config.xpShareRadius) {
                nearby.push(player);
            }
        }
        
        return nearby;
    }
    
    calculateMobXP(mob) {
        // Base XP calculation (simplified)
        return Math.floor(mob.level * 10 * (1 + Math.random() * 0.5));
    }
    
    giveXPToPlayer(player, amount) {
        player.xp += amount;
        
        // Check for level up
        const xpNeeded = this.calculateXPNeeded(player.level);
        if (player.xp >= xpNeeded) {
            player.level++;
            player.xp -= xpNeeded;
            this.handleLevelUp(player);
        }
    }
    
    calculateXPNeeded(level) {
        return Math.floor(100 * Math.pow(1.2, level - 1));
    }
    
    handleLevelUp(player) {
        // Increase stats
        player.maxHealth += 10;
        player.health = player.maxHealth;
        player.maxMana += 5;
        player.mana = player.maxMana;
        player.attack += 2;
        player.defense += 1;
        
        // Notify player
        const socket = this.server.getPlayerSocket(player.id);
        if (socket) {
            socket.emit('levelUp', {
                newLevel: player.level,
                stats: {
                    health: player.maxHealth,
                    mana: player.maxMana,
                    attack: player.attack,
                    defense: player.defense
                }
            });
        }
        
        // Notify party
        const partyId = this.playerParties.get(player.id);
        if (partyId) {
            this.broadcastToParty(partyId, 'partyMemberLevelUp', {
                memberId: player.id,
                memberName: player.name,
                newLevel: player.level
            });
        }
    }
    
    // Dungeon Instance Management
    createDungeonInstance(partyId, dungeonType) {
        const party = this.parties.get(partyId);
        if (!party) return null;
        
        // Check if party already has a dungeon
        if (party.dungeon) {
            return party.dungeon;
        }
        
        // Create dungeon instance
        const dungeonId = this.generateDungeonId();
        const dungeon = {
            id: dungeonId,
            partyId: partyId,
            type: dungeonType,
            members: new Set(),
            state: 'active',
            createdAt: Date.now(),
            mobs: new Map(),
            boss: null,
            completed: false
        };
        
        party.dungeon = dungeon;
        
        // Add all party members to dungeon
        for (const [memberId] of party.members) {
            dungeon.members.add(memberId);
        }
        
        // Initialize dungeon (spawn mobs, etc.)
        this.initializeDungeon(dungeon);
        
        return dungeon;
    }
    
    initializeDungeon(dungeon) {
        // This would integrate with the dungeon system
        // For now, just mark as initialized
        console.log(`Dungeon instance ${dungeon.id} created for party ${dungeon.partyId}`);
    }
    
    leaveDungeonInstance(playerId, partyId) {
        const party = this.parties.get(partyId);
        if (!party || !party.dungeon) return;
        
        party.dungeon.members.delete(playerId);
        
        // Check if dungeon should be closed
        if (party.dungeon.members.size === 0) {
            this.closeDungeonInstance(partyId);
        }
    }
    
    closeDungeonInstance(partyId) {
        const party = this.parties.get(partyId);
        if (!party || !party.dungeon) return;
        
        // Clean up dungeon
        console.log(`Dungeon instance ${party.dungeon.id} closed for party ${partyId}`);
        party.dungeon = null;
    }
    
    // Utility Methods
    generatePartyId() {
        return 'party_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateDungeonId() {
        return 'dungeon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    findPlayerByName(name) {
        for (const [playerId, player] of this.server.players) {
            if (player.name === name) {
                return { id: playerId, ...player };
            }
        }
        return null;
    }
    
    getPartyMembersArray(party) {
        return Array.from(party.members.values());
    }
    
    broadcastToParty(partyId, event, data) {
        const party = this.parties.get(partyId);
        if (!party) return;
        
        for (const [memberId] of party.members) {
            const socket = this.server.getPlayerSocket(memberId);
            if (socket) {
                socket.emit(event, data);
            }
        }
    }
    
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupExpiredInvites();
            this.cleanupEmptyParties();
        }, 10000); // Check every 10 seconds
    }
    
    cleanupExpiredInvites() {
        const now = Date.now();
        
        for (const [partyId, party] of this.parties) {
            for (const [inviteId, invite] of party.invites) {
                if (now >= invite.expiresAt) {
                    party.invites.delete(inviteId);
                    
                    // Notify inviter that invite expired
                    const inviterSocket = this.server.getPlayerSocket(invite.from);
                    if (inviterSocket) {
                        inviterSocket.emit('partyInviteExpired', { targetName: invite.to });
                    }
                }
            }
        }
    }
    
    cleanupEmptyParties() {
        const now = Date.now();
        
        for (const [partyId, party] of this.parties) {
            if (party.members.size === 0 && (now - party.lastActivity) > this.config.disbandTimeout) {
                this.disbandParty(partyId);
            }
        }
    }
    
    disbandParty(partyId) {
        const party = this.parties.get(partyId);
        if (!party) return;
        
        // Close dungeon if exists
        if (party.dungeon) {
            this.closeDungeonInstance(partyId);
        }
        
        // Remove party
        this.parties.delete(partyId);
        
        console.log(`Party ${partyId} disbanded`);
    }
    
    // Public API
    getParty(playerId) {
        const partyId = this.playerParties.get(playerId);
        return partyId ? this.parties.get(partyId) : null;
    }
    
    getPartyMembers(playerId) {
        const party = this.getParty(playerId);
        return party ? Array.from(party.members.values()) : [];
    }
    
    isPartyLeader(playerId) {
        const party = this.getParty(playerId);
        return party && party.leader === playerId;
    }
    
    getPartySize(playerId) {
        const party = this.getParty(playerId);
        return party ? party.members.size : 0;
    }
    
    // Cleanup
    cleanup() {
        this.parties.clear();
        this.playerParties.clear();
        console.log('Party System cleanup complete');
    }
}

module.exports = PartySystem;
