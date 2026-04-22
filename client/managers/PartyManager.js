/**
 * PartyManager - Sistema de Grupo/Party
 * 
 * Responsabilidades:
 * - Criar, juntar, sair de parties
 * - Gerenciar líder e membros
 * - Distribuição de XP
 * - Loot distribution modes (free-for-all, round-robin, master-looter)
 * - Sincronização de estado dos membros
 */

class PartyManager {
    constructor(playerId) {
        this.playerId = playerId;
        
        // Estado da party
        this.currentParty = null; // null = não está em party
        this.isLeader = false;
        this.invites = new Map(); // partyId -> inviteData
        
        // Configurações
        this.maxPartySize = 5;
        this.lootModes = ['free-for-all', 'round-robin', 'master-looter', 'need-before-greed'];
        this.currentLootMode = 'free-for-all';
        this.lootRoundRobinIndex = 0;
        
        // Callbacks
        this.onPartyCreated = null;
        this.onPartyJoined = null;
        this.onPartyLeft = null;
        this.onPartyDisbanded = null;
        this.onMemberJoined = null;
        this.onMemberLeft = null;
        this.onMemberUpdated = null;
        this.onInviteReceived = null;
        this.onLootModeChanged = null;
        
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        // Carregar do storage
        this.loadFromStorage();
        
        // Iniciar sync loop
        this.startSyncLoop();
        
        this.initialized = true;
        console.log('👥 PartyManager inicializado');
    }
    
    // ===================== CRIAÇÃO E GERENCIAMENTO =====================
    
    /**
     * Cria uma nova party
     */
    createParty() {
        if (this.currentParty) {
            return { success: false, reason: 'already_in_party' };
        }
        
        const partyId = this.generatePartyId();
        
        this.currentParty = {
            id: partyId,
            leaderId: this.playerId,
            members: [{
                id: this.playerId,
                name: this.getPlayerName(),
                level: this.getPlayerLevel(),
                class: this.getPlayerClass(),
                hp: 100,
                maxHp: 100,
                mp: 50,
                maxMp: 50,
                zone: 'verdantis',
                status: 'online'
            }],
            lootMode: 'free-for-all',
            createdAt: Date.now()
        };
        
        this.isLeader = true;
        this.saveToStorage();
        
        // Notificar
        if (this.onPartyCreated) {
            this.onPartyCreated(this.currentParty);
        }
        
        // Som
        if (window.audioManager) {
            window.audioManager.playSFX('party_created');
        }
        
        console.log('👥 Party criada:', partyId);
        return { success: true, party: this.currentParty };
    }
    
    /**
     * Convida jogador para party
     */
    invitePlayer(targetPlayerId, targetPlayerName) {
        if (!this.currentParty) {
            return { success: false, reason: 'not_in_party' };
        }
        
        if (!this.isLeader) {
            return { success: false, reason: 'not_leader' };
        }
        
        if (this.currentParty.members.length >= this.maxPartySize) {
            return { success: false, reason: 'party_full' };
        }
        
        if (this.isPlayerInParty(targetPlayerId)) {
            return { success: false, reason: 'already_member' };
        }
        
        // Criar invite
        const invite = {
            partyId: this.currentParty.id,
            partyLeader: this.playerId,
            partyLeaderName: this.getPlayerName(),
            targetId: targetPlayerId,
            targetName: targetPlayerName,
            createdAt: Date.now(),
            expiresAt: Date.now() + 60000 // 1 minuto
        };
        
        // Enviar convite
        this.sendInvite(invite);
        
        return { success: true, invite };
    }
    
    /**
     * Recebe convite de party
     */
    receiveInvite(invite) {
        // Verificar se já está em party
        if (this.currentParty) {
            this.declineInvite(invite.partyId, 'already_in_party');
            return;
        }
        
        // Armazenar convite
        this.invites.set(invite.partyId, invite);
        
        // Notificar UI
        if (this.onInviteReceived) {
            this.onInviteReceived(invite);
        }
        
        // Som
        if (window.audioManager) {
            window.audioManager.playSFX('party_invite');
        }
        
        // Auto-expirar
        setTimeout(() => {
            if (this.invites.has(invite.partyId)) {
                this.invites.delete(invite.partyId);
            }
        }, 60000);
    }
    
    /**
     * Aceita convite
     */
    acceptInvite(partyId) {
        const invite = this.invites.get(partyId);
        if (!invite) {
            return { success: false, reason: 'invite_expired' };
        }
        
        if (this.currentParty) {
            return { success: false, reason: 'already_in_party' };
        }
        
        // Remover convite
        this.invites.delete(partyId);
        
        // Notificar líder
        this.sendJoinRequest(partyId);
        
        // Em modo offline, auto-aceitar
        if (!window.networkManager?.isConnected) {
            this.simulateJoinParty(partyId);
        }
        
        return { success: true };
    }
    
    /**
     * Recusa convite
     */
    declineInvite(partyId, reason = 'declined') {
        this.invites.delete(partyId);
        
        // Notificar líder
        this.sendDecline(partyId, reason);
        
        return { success: true };
    }
    
    /**
     * Simula entrar em party (offline mode)
     */
    simulateJoinParty(partyId) {
        this.currentParty = {
            id: partyId,
            leaderId: 'simulated_leader',
            members: [
                {
                    id: 'simulated_leader',
                    name: 'Líder Simulado',
                    level: 10,
                    class: 'warrior',
                    hp: 150,
                    maxHp: 150,
                    mp: 80,
                    maxMp: 80,
                    zone: 'verdantis',
                    status: 'online'
                },
                {
                    id: this.playerId,
                    name: this.getPlayerName(),
                    level: this.getPlayerLevel(),
                    class: this.getPlayerClass(),
                    hp: 100,
                    maxHp: 100,
                    mp: 50,
                    maxMp: 50,
                    zone: 'verdantis',
                    status: 'online'
                }
            ],
            lootMode: 'free-for-all',
            createdAt: Date.now()
        };
        
        this.isLeader = false;
        this.saveToStorage();
        
        if (this.onPartyJoined) {
            this.onPartyJoined(this.currentParty);
        }
        
        console.log('👥 Entrou na party:', partyId);
    }
    
    /**
     * Sai da party
     */
    leaveParty() {
        if (!this.currentParty) {
            return { success: false, reason: 'not_in_party' };
        }
        
        const partyId = this.currentParty.id;
        const wasLeader = this.isLeader;
        
        // Notificar outros membros
        this.sendLeaveNotification(partyId);
        
        // Se era líder, passar liderança ou desfazer
        if (wasLeader && this.currentParty.members.length > 1) {
            this.transferLeadershipToNext();
        }
        
        this.currentParty = null;
        this.isLeader = false;
        this.saveToStorage();
        
        if (this.onPartyLeft) {
            this.onPartyLeft(partyId, wasLeader);
        }
        
        return { success: true };
    }
    
    /**
     * Remove membro da party (líder apenas)
     */
    kickMember(memberId) {
        if (!this.currentParty) {
            return { success: false, reason: 'not_in_party' };
        }
        
        if (!this.isLeader) {
            return { success: false, reason: 'not_leader' };
        }
        
        if (memberId === this.playerId) {
            return { success: false, reason: 'cannot_kick_self' };
        }
        
        const memberIndex = this.currentParty.members.findIndex(m => m.id === memberId);
        if (memberIndex === -1) {
            return { success: false, reason: 'member_not_found' };
        }
        
        const member = this.currentParty.members[memberIndex];
        this.currentParty.members.splice(memberIndex, 1);
        
        // Notificar
        this.sendKickNotification(memberId);
        
        if (this.onMemberLeft) {
            this.onMemberLeft(member, 'kicked');
        }
        
        this.saveToStorage();
        return { success: true };
    }
    
    /**
     * Desfaz party (líder apenas)
     */
    disbandParty() {
        if (!this.currentParty) {
            return { success: false, reason: 'not_in_party' };
        }
        
        if (!this.isLeader) {
            return { success: false, reason: 'not_leader' };
        }
        
        const partyId = this.currentParty.id;
        
        // Notificar membros
        this.sendDisbandNotification(partyId);
        
        this.currentParty = null;
        this.isLeader = false;
        this.saveToStorage();
        
        if (this.onPartyDisbanded) {
            this.onPartyDisbanded(partyId);
        }
        
        return { success: true };
    }
    
    /**
     * Transfere liderança
     */
    transferLeadership(newLeaderId) {
        if (!this.currentParty) {
            return { success: false, reason: 'not_in_party' };
        }
        
        if (!this.isLeader) {
            return { success: false, reason: 'not_leader' };
        }
        
        const newLeader = this.currentParty.members.find(m => m.id === newLeaderId);
        if (!newLeader) {
            return { success: false, reason: 'member_not_found' };
        }
        
        this.currentParty.leaderId = newLeaderId;
        this.isLeader = (newLeaderId === this.playerId);
        
        this.sendLeadershipTransfer(newLeaderId);
        this.saveToStorage();
        
        return { success: true, newLeader };
    }
    
    // ===================== LOOT DISTRIBUTION =====================
    
    /**
     * Muda modo de distribuição de loot
     */
    setLootMode(mode) {
        if (!this.currentParty) {
            return { success: false, reason: 'not_in_party' };
        }
        
        if (!this.isLeader) {
            return { success: false, reason: 'not_leader' };
        }
        
        if (!this.lootModes.includes(mode)) {
            return { success: false, reason: 'invalid_mode' };
        }
        
        this.currentParty.lootMode = mode;
        this.currentLootMode = mode;
        
        if (mode === 'round-robin') {
            this.lootRoundRobinIndex = 0;
        }
        
        this.sendLootModeChange(mode);
        this.saveToStorage();
        
        if (this.onLootModeChanged) {
            this.onLootModeChanged(mode);
        }
        
        return { success: true };
    }
    
    /**
     * Determina quem recebe um drop
     */
    getLootRecipient(item, dropPosition) {
        if (!this.currentParty) {
            return this.playerId;
        }
        
        const onlineMembers = this.currentParty.members.filter(m => m.status === 'online');
        
        switch (this.currentParty.lootMode) {
            case 'free-for-all':
                // Quem está mais perto
                return this.getClosestMember(dropPosition, onlineMembers);
                
            case 'round-robin':
                // Rotaciona entre membros
                const recipient = onlineMembers[this.lootRoundRobinIndex % onlineMembers.length];
                this.lootRoundRobinIndex++;
                return recipient?.id || this.playerId;
                
            case 'master-looter':
                // Apenas líder
                return this.currentParty.leaderId;
                
            case 'need-before-greed':
                // Sistema de rolagem (simplificado: free-for-all)
                return this.getClosestMember(dropPosition, onlineMembers);
                
            default:
                return this.playerId;
        }
    }
    
    getClosestMember(position, members) {
        // Simplificado: retorna líder ou primeiro membro
        const leader = members.find(m => m.id === this.currentParty.leaderId);
        if (leader) return leader.id;
        return members[0]?.id || this.playerId;
    }
    
    // ===================== XP DISTRIBUTION =====================
    
    /**
     * Calcula XP para distribuição em party
     */
    calculatePartyXP(baseXP) {
        if (!this.currentParty) {
            return { [this.playerId]: baseXP };
        }
        
        const onlineMembers = this.currentParty.members.filter(m => m.status === 'online');
        const memberCount = onlineMembers.length;
        
        // Bônus de party: +10% por membro (máx 50%)
        const partyBonus = Math.min(memberCount * 0.1, 0.5);
        const totalXP = Math.floor(baseXP * (1 + partyBonus));
        
        // Distribuir igualmente
        const xpPerMember = Math.floor(totalXP / memberCount);
        
        const distribution = {};
        for (const member of onlineMembers) {
            distribution[member.id] = xpPerMember;
        }
        
        return distribution;
    }
    
    // ===================== SYNC E UPDATES =====================
    
    /**
     * Atualiza status do jogador local
     */
    updatePlayerStatus(updates) {
        if (!this.currentParty) return;
        
        const me = this.currentParty.members.find(m => m.id === this.playerId);
        if (!me) return;
        
        Object.assign(me, updates);
        
        // Enviar para outros membros
        this.sendMemberUpdate(updates);
    }
    
    /**
     * Recebe update de outro membro
     */
    receiveMemberUpdate(memberId, updates) {
        if (!this.currentParty) return;
        
        const member = this.currentParty.members.find(m => m.id === memberId);
        if (member) {
            Object.assign(member, updates);
            
            if (this.onMemberUpdated) {
                this.onMemberUpdated(member, updates);
            }
        }
    }
    
    /**
     * Member entrou na party
     */
    memberJoined(member) {
        if (!this.currentParty) return;
        
        this.currentParty.members.push(member);
        
        if (this.onMemberJoined) {
            this.onMemberJoined(member);
        }
        
        this.saveToStorage();
    }
    
    /**
     * Member saiu da party
     */
    memberLeft(memberId, reason = 'left') {
        if (!this.currentParty) return;
        
        const index = this.currentParty.members.findIndex(m => m.id === memberId);
        if (index !== -1) {
            const member = this.currentParty.members[index];
            this.currentParty.members.splice(index, 1);
            
            if (this.onMemberLeft) {
                this.onMemberLeft(member, reason);
            }
            
            // Se ficou vazia, desfazer
            if (this.currentParty.members.length === 0) {
                this.currentParty = null;
                this.isLeader = false;
            }
            // Se líder saiu, passar liderança
            else if (memberId === this.currentParty.leaderId) {
                this.currentParty.leaderId = this.currentParty.members[0].id;
            }
            
            this.saveToStorage();
        }
    }
    
    startSyncLoop() {
        // Sync a cada 5 segundos
        setInterval(() => {
            if (this.currentParty) {
                this.sendHeartbeat();
            }
        }, 5000);
    }
    
    // ===================== NETWORK (Offline Mode) =====================
    
    sendInvite(invite) {
        console.log('👥 Enviando convite:', invite);
    }
    
    sendJoinRequest(partyId) {
        console.log('👥 Solicitando entrada na party:', partyId);
    }
    
    sendDecline(partyId, reason) {
        console.log('👥 Recusando convite:', partyId, reason);
    }
    
    sendLeaveNotification(partyId) {
        console.log('👥 Saindo da party:', partyId);
    }
    
    sendKickNotification(memberId) {
        console.log('👥 Expulsando membro:', memberId);
    }
    
    sendDisbandNotification(partyId) {
        console.log('👥 Desfazendo party:', partyId);
    }
    
    sendLeadershipTransfer(newLeaderId) {
        console.log('👥 Transferindo liderança para:', newLeaderId);
    }
    
    sendLootModeChange(mode) {
        console.log('👥 Mudando modo de loot:', mode);
    }
    
    sendMemberUpdate(updates) {
        // console.log('👥 Enviando update:', updates);
    }
    
    sendHeartbeat() {
        // console.log('👥 Heartbeat');
    }
    
    transferLeadershipToNext() {
        if (!this.currentParty || this.currentParty.members.length < 2) return;
        
        const nextLeader = this.currentParty.members.find(m => m.id !== this.playerId);
        if (nextLeader) {
            this.currentParty.leaderId = nextLeader.id;
            console.log('👥 Liderança transferida para:', nextLeader.name);
        }
    }
    
    // ===================== UTILS =====================
    
    generatePartyId() {
        return `party_${this.playerId}_${Date.now()}`;
    }
    
    getPlayerName() {
        return localStorage.getItem('player_name') || 'Jogador';
    }
    
    getPlayerLevel() {
        return parseInt(localStorage.getItem('player_level') || '1');
    }
    
    getPlayerClass() {
        return localStorage.getItem('player_class') || 'warrior';
    }
    
    isPlayerInParty(playerId) {
        if (!this.currentParty) return false;
        return this.currentParty.members.some(m => m.id === playerId);
    }
    
    getMemberCount() {
        if (!this.currentParty) return 0;
        return this.currentParty.members.length;
    }
    
    getOnlineCount() {
        if (!this.currentParty) return 0;
        return this.currentParty.members.filter(m => m.status === 'online').length;
    }
    
    getPartyStatus() {
        if (!this.currentParty) {
            return { inParty: false };
        }
        
        return {
            inParty: true,
            isLeader: this.isLeader,
            partyId: this.currentParty.id,
            memberCount: this.getMemberCount(),
            onlineCount: this.getOnlineCount(),
            lootMode: this.currentParty.lootMode,
            members: this.currentParty.members
        };
    }
    
    // ===================== PERSISTÊNCIA =====================
    
    saveToStorage() {
        const data = {
            currentParty: this.currentParty,
            isLeader: this.isLeader,
            invites: Array.from(this.invites.entries())
        };
        localStorage.setItem('party_data', JSON.stringify(data));
    }
    
    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('party_data') || '{}');
            if (data.currentParty) {
                this.currentParty = data.currentParty;
                this.isLeader = data.isLeader || false;
            }
            if (data.invites) {
                this.invites = new Map(data.invites);
            }
        } catch (e) {
            console.log('👥 Nenhum dado de party salvo');
        }
    }
    
    clearStorage() {
        localStorage.removeItem('party_data');
    }
}

window.PartyManager = PartyManager;
