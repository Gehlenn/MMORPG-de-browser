/**
 * PartyManager - Sistema de Grupos Estilo WoW
 * 
 * Features:
 * - Party: até 5 membros (XP compartilhado)
 * - Raid: até 12 membros (XP individual)
 * - Bônus de XP: +20% para 2 players, +40% para 3, +60% para 4, +80% para 5
 * - Distribuição de loot (need/greed, master, free-for-all)
 * - Buffs de grupo (só em party, não em raid)
 * - Chat de party/raid
 * - Marcação de alvo
 * - Convert Party <-> Raid
 */

class PartyManager {
    constructor(characterPersistence, zoneManager) {
        this.characterPersistence = characterPersistence;
        this.zoneManager = zoneManager;
        
        this.parties = new Map(); // partyId -> Party
        this.invites = new Map(); // characterId -> { partyId, invitedBy, expiresAt }
        
        // Limites de grupo estilo WoW
        this.MAX_PARTY_SIZE = 5;   // Party normal (XP compartilhado)
        this.MAX_RAID_SIZE = 12;   // Raid (XP individual)
        this.RAID_THRESHOLD = 5;   // A partir de 6 membros vira raid
        
        this.MAX_LEVEL_GAP = 30; // Máxima diferença de nível para compartilhar EXP
        this.INVITE_EXPIRY_MS = 60000; // 1 minuto
        this.EXP_SHARING_RANGE = 600; // Distância em pixels
        
        // Bônus de XP estilo WoW (só até 5 players)
        this.EXP_BONUS = {
            1: 0,    // Solo
            2: 20,   // +20%
            3: 40,   // +40%
            4: 60,   // +60%
            5: 80    // +80% (máximo)
        };
        
        this.LOOT_MODES = {
            FREE: 'free',           // Cada um pega o que quiser (FFA)
            RANDOM: 'random',       // Sorteio entre membros (Round Robin)
            MASTER: 'master',       // Líder decide (Master Looter)
            NEED_GREED: 'need_greed' // Sistema Need Before Greed (estilo WoW)
        };
        
        this.GROUP_TYPES = {
            PARTY: 'party',  // Até 5 membros, XP compartilhado
            RAID: 'raid'     // 6-12 membros, XP individual
        };
    }

    initialize() {
        this.startInviteCleanupTimer();
        this.startPartyBuffTimer();
        console.log('[PartyManager] Sistema de grupos inicializado');
    }

    // ============ PARTY CREATION ============

    createParty(leaderId, options = {}) {
        const leader = this.characterPersistence?.getActiveCharacter(leaderId);
        if (!leader) return { success: false, error: 'Líder não encontrado' };

        // Verificar se já está em party
        const existingParty = this.findPartyByMember(leaderId);
        if (existingParty) {
            return { success: false, error: 'Você já está em um grupo' };
        }

        const partyId = `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Determinar tipo de grupo
        const groupType = options.groupType || this.GROUP_TYPES.PARTY;
        const maxSize = groupType === this.GROUP_TYPES.RAID ? this.MAX_RAID_SIZE : this.MAX_PARTY_SIZE;
        
        const party = {
            id: partyId,
            name: options.name || `Grupo de ${leader.data.name}`,
            leaderId: leaderId,
            groupType: groupType, // 'party' ou 'raid'
            members: new Map(),
            createdAt: Date.now(),
            lootMode: options.lootMode || this.LOOT_MODES.FREE,
            lootTurnIndex: 0, // Para modo rodízio
            expSharing: groupType === this.GROUP_TYPES.PARTY, // Só compartilha XP em party
            targetId: null, // Alvo marcado
            buffs: new Map(), // Buffs ativos (só em party)
            chatHistory: [], // Histórico de chat
            maxSize: maxSize,
            settings: {
                autoShareQuests: options.autoShareQuests || false,
                allowInvite: options.allowInvite !== false, // Default true
                minLevel: options.minLevel || 1,
                maxLevel: options.maxLevel || 99
            }
        };

        // Adicionar líder como primeiro membro
        party.members.set(leaderId, {
            characterId: leaderId,
            name: leader.data.name,
            level: leader.data.level,
            class: leader.data.class,
            hp: leader.data.hp,
            maxHp: leader.data.maxHp,
            position: leader.data.position,
            joinedAt: Date.now(),
            isLeader: true,
            lootPriority: 0
        });

        this.parties.set(partyId, party);
        
        // Notificar líder
        this.notifyPartyCreated(leaderId, party);
        
        console.log(`[PartyManager] Grupo ${partyId} criado por ${leaderId}`);
        
        return { success: true, party: this.sanitizePartyForClient(party) };
    }

    // ============ INVITES ============

    inviteToParty(inviterId, targetId) {
        const party = this.findPartyByMember(inviterId);
        if (!party) return { success: false, error: 'Você não está em um grupo' };

        // Verificar permissão
        if (inviterId !== party.leaderId && !party.settings.allowInvite) {
            return { success: false, error: 'Apenas o líder pode convidar' };
        }

        // Verificar limite (5 para party, 12 para raid)
        if (party.members.size >= party.maxSize) {
            const groupTypeName = party.groupType === this.GROUP_TYPES.RAID ? 'Raid' : 'Grupo';
            const maxSize = party.maxSize;
            return { success: false, error: `${groupTypeName} está cheio (máx ${maxSize})` };
        }

        const target = this.characterPersistence?.getActiveCharacter(targetId);
        if (!target) return { success: false, error: 'Jogador não encontrado' };

        // Verificar se já está em party
        if (this.findPartyByMember(targetId)) {
            return { success: false, error: 'Jogador já está em um grupo' };
        }

        // Verificar nível
        if (target.data.level < party.settings.minLevel || 
            target.data.level > party.settings.maxLevel) {
            return { success: false, error: 'Nível do jogador não atende requisitos' };
        }

        // Criar convite
        this.invites.set(targetId, {
            partyId: party.id,
            invitedBy: inviterId,
            inviterName: party.members.get(inviterId)?.name,
            partyName: party.name,
            expiresAt: Date.now() + this.INVITE_EXPIRY_MS
        });

        // Notificar target
        this.notifyInviteReceived(targetId, party, inviterId);

        return { success: true, message: 'Convite enviado' };
    }

    acceptInvite(characterId) {
        const invite = this.invites.get(characterId);
        if (!invite) return { success: false, error: 'Nenhum convite pendente' };

        if (Date.now() > invite.expiresAt) {
            this.invites.delete(characterId);
            return { success: false, error: 'Convite expirado' };
        }

        const party = this.parties.get(invite.partyId);
        if (!party) {
            this.invites.delete(characterId);
            return { success: false, error: 'Grupo não existe mais' };
        }

        if (party.members.size >= this.MAX_PARTY_SIZE) {
            return { success: false, error: 'Grupo ficou cheio' };
        }

        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char) return { success: false, error: 'Personagem não encontrado' };

        // Adicionar ao grupo
        party.members.set(characterId, {
            characterId: characterId,
            name: char.data.name,
            level: char.data.level,
            class: char.data.class,
            hp: char.data.hp,
            maxHp: char.data.maxHp,
            position: char.data.position,
            joinedAt: Date.now(),
            isLeader: false,
            lootPriority: party.members.size
        });

        this.invites.delete(characterId);

        // Notificar todos
        this.notifyMemberJoined(party, characterId);
        
        console.log(`[PartyManager] ${characterId} entrou no grupo ${party.id}`);

        return { 
            success: true, 
            party: this.sanitizePartyForClient(party)
        };
    }

    declineInvite(characterId) {
        const invite = this.invites.get(characterId);
        if (!invite) return { success: false, error: 'Nenhum convite pendente' };

        const party = this.parties.get(invite.partyId);
        
        this.invites.delete(characterId);

        // Notificar inviter
        if (party) {
            this.notifyInviteDeclined(party, characterId, invite.invitedBy);
        }

        return { success: true };
    }

    // ============ PARTY MANAGEMENT ============

    leaveParty(characterId) {
        const party = this.findPartyByMember(characterId);
        if (!party) return { success: false, error: 'Você não está em um grupo' };

        // Se for líder, transferir ou destruir
        if (party.leaderId === characterId) {
            if (party.members.size > 1) {
                // Transferir para próximo membro mais antigo
                const newLeader = Array.from(party.members.values())
                    .filter(m => m.characterId !== characterId)
                    .sort((a, b) => a.joinedAt - b.joinedAt)[0];
                
                party.leaderId = newLeader.characterId;
                newLeader.isLeader = true;
                
                this.notifyLeaderChanged(party, newLeader.characterId);
            } else {
                // Destruir grupo
                this.destroyParty(party.id);
                return { success: true, message: 'Grupo desfeito' };
            }
        }

        party.members.delete(characterId);
        
        // Renumerar prioridades de loot
        let index = 0;
        for (const member of party.members.values()) {
            member.lootPriority = index++;
        }

        this.notifyMemberLeft(party, characterId);

        return { success: true };
    }

    kickMember(leaderId, targetId) {
        const party = this.findPartyByMember(leaderId);
        if (!party) return { success: false, error: 'Você não está em um grupo' };

        if (party.leaderId !== leaderId) {
            return { success: false, error: 'Apenas o líder pode expulsar' };
        }

        if (!party.members.has(targetId)) {
            return { success: false, error: 'Jogador não está no grupo' };
        }

        party.members.delete(targetId);
        
        this.notifyMemberKicked(party, targetId);

        return { success: true };
    }

    changeLeader(leaderId, newLeaderId) {
        const party = this.findPartyByMember(leaderId);
        if (!party) return { success: false, error: 'Você não está em um grupo' };

        if (party.leaderId !== leaderId) {
            return { success: false, error: 'Apenas o líder pode transferir' };
        }

        if (!party.members.has(newLeaderId)) {
            return { success: false, error: 'Novo líder não está no grupo' };
        }

        // Atualizar flags
        party.members.get(leaderId).isLeader = false;
        party.members.get(newLeaderId).isLeader = true;
        party.leaderId = newLeaderId;

        this.notifyLeaderChanged(party, newLeaderId);

        return { success: true };
    }

    destroyParty(partyId) {
        const party = this.parties.get(partyId);
        if (!party) return;

        // Notificar todos
        for (const memberId of party.members.keys()) {
            this.notifyPartyDestroyed(memberId, party);
        }

        this.parties.delete(partyId);
        
        console.log(`[PartyManager] Grupo ${partyId} destruído`);
    }

    // ============ LOOT DISTRIBUTION ============

    distributeLoot(partyId, itemData, mobPosition) {
        const party = this.parties.get(partyId);
        if (!party) return null;

        switch (party.lootMode) {
            case this.LOOT_MODES.FREE:
                // Cada um pega o que estiver mais perto/primeiro
                return { mode: 'free', availableTo: Array.from(party.members.keys()) };
            
            case this.LOOT_MODES.RANDOM:
                const members = Array.from(party.members.keys());
                const winner = members[Math.floor(Math.random() * members.length)];
                return { mode: 'random', winner };
            
            case this.LOOT_MODES.MASTER:
                return { mode: 'master', leaderDecides: party.leaderId };
            
            case this.LOOT_MODES.TURN:
                const membersList = Array.from(party.members.values())
                    .sort((a, b) => a.lootPriority - b.lootPriority);
                const turnWinner = membersList[party.lootTurnIndex % membersList.length];
                party.lootTurnIndex++;
                return { mode: 'turn', winner: turnWinner.characterId };
            
            default:
                return { mode: 'free', availableTo: Array.from(party.members.keys()) };
        }
    }

    setLootMode(leaderId, mode) {
        const party = this.findPartyByMember(leaderId);
        if (!party) return { success: false, error: 'Você não está em um grupo' };

        if (party.leaderId !== leaderId) {
            return { success: false, error: 'Apenas o líder pode mudar' };
        }

        if (!Object.values(this.LOOT_MODES).includes(mode)) {
            return { success: false, error: 'Modo inválido' };
        }

        party.lootMode = mode;
        
        this.notifyLootModeChanged(party, mode);

        return { success: true };
    }

    // ============ EXP SHARING ============

    shareExp(partyId, totalExp, mobLevel, killerId) {
        const party = this.parties.get(partyId);
        if (!party || !party.expSharing) return null;

        // Em raids (6+ membros), não compartilha XP
        if (party.groupType === this.GROUP_TYPES.RAID) {
            return null; // XP individual em raid
        }

        const membersInRange = [];
        const killer = party.members.get(killerId);
        
        if (!killer) return null;

        // Encontrar membros em alcance
        for (const [memberId, member] of party.members) {
            const distance = this.calculateDistance(killer.position, member.position);
            
            if (distance <= this.EXP_SHARING_RANGE) {
                // Verificar diferença de nível
                const levelDiff = Math.abs(member.level - mobLevel);
                if (levelDiff <= this.MAX_LEVEL_GAP) {
                    membersInRange.push(member);
                }
            }
        }

        if (membersInRange.length === 0) return null;

        // Bônus de grupo estilo WoW (só até 5 membros)
        // 1 player = 100%, 2 = 120%, 3 = 140%, 4 = 160%, 5 = 180%
        const memberCount = Math.min(membersInRange.length, 5); // Cap em 5
        const bonusPercent = this.EXP_BONUS[memberCount] || 0;
        const partyBonus = 1 + (bonusPercent / 100);
        
        // XP total com bônus dividido entre todos
        const totalExpWithBonus = Math.floor(totalExp * partyBonus);
        const expPerMember = Math.floor(totalExpWithBonus / membersInRange.length);

        const distribution = {};
        for (const member of membersInRange) {
            // Penalidade de nível
            const levelDiff = member.level - mobLevel;
            let multiplier = 1;
            if (levelDiff > 10) multiplier = 0.5;
            else if (levelDiff > 5) multiplier = 0.75;
            else if (levelDiff < -10) multiplier = 1.5; // Bônus para ajudar níveis baixos

            const finalExp = Math.floor(expPerMember * multiplier);
            
            distribution[member.characterId] = finalExp;
            
            // Aplicar EXP
            const char = this.characterPersistence?.getActiveCharacter(member.characterId);
            if (char?.addExperience) {
                char.addExperience(finalExp);
            }
        }

        return { 
            totalExp, 
            partyBonus, 
            bonusPercent,
            memberCount: membersInRange.length,
            distribution 
        };
    }

    setExpSharing(leaderId, enabled) {
        const party = this.findPartyByMember(leaderId);
        if (!party) return { success: false, error: 'Você não está em um grupo' };

        if (party.leaderId !== leaderId) {
            return { success: false, error: 'Apenas o líder pode mudar' };
        }

        party.expSharing = enabled;
        
        this.notifyExpSharingChanged(party, enabled);

        return { success: true };
    }

    // ============ PARTY/RAID CONVERSION ============

    convertToRaid(leaderId) {
        const party = this.findPartyByMember(leaderId);
        if (!party) return { success: false, error: 'Você não está em um grupo' };

        if (party.leaderId !== leaderId) {
            return { success: false, error: 'Apenas o líder pode converter' };
        }

        if (party.groupType === this.GROUP_TYPES.RAID) {
            return { success: false, error: 'Já é um Raid' };
        }

        // Converter para raid
        party.groupType = this.GROUP_TYPES.RAID;
        party.maxSize = this.MAX_RAID_SIZE;
        party.expSharing = false; // Raids não compartilham XP
        party.name = party.name.replace('Grupo', 'Raid');

        // Notificar todos
        this.notifyGroupTypeChanged(party, this.GROUP_TYPES.RAID);

        console.log(`[PartyManager] Grupo ${party.id} convertido para Raid`);
        
        return { success: true, groupType: this.GROUP_TYPES.RAID, maxSize: this.MAX_RAID_SIZE };
    }

    convertToParty(leaderId) {
        const party = this.findPartyByMember(leaderId);
        if (!party) return { success: false, error: 'Você não está em um grupo' };

        if (party.leaderId !== leaderId) {
            return { success: false, error: 'Apenas o líder pode converter' };
        }

        if (party.groupType === this.GROUP_TYPES.PARTY) {
            return { success: false, error: 'Já é um Party' };
        }

        // Verificar se pode reduzir (só se tiver 5 ou menos membros)
        if (party.members.size > this.MAX_PARTY_SIZE) {
            return { success: false, error: `Não pode converter: Raid tem ${party.members.size} membros (máx ${this.MAX_PARTY_SIZE} para Party)` };
        }

        // Converter para party
        party.groupType = this.GROUP_TYPES.PARTY;
        party.maxSize = this.MAX_PARTY_SIZE;
        party.expSharing = true; // Parties compartilham XP
        party.name = party.name.replace('Raid', 'Grupo');

        // Notificar todos
        this.notifyGroupTypeChanged(party, this.GROUP_TYPES.PARTY);

        console.log(`[PartyManager] Raid ${party.id} convertido para Party`);
        
        return { success: true, groupType: this.GROUP_TYPES.PARTY, maxSize: this.MAX_PARTY_SIZE };
    }

    // ============ TARGET MARKING ============

    setPartyTarget(leaderId, targetId, targetType = 'mob') {
        const party = this.findPartyByMember(leaderId);
        if (!party) return { success: false, error: 'Você não está em um grupo' };

        if (party.leaderId !== leaderId) {
            return { success: false, error: 'Apenas o líder pode marcar alvo' };
        }

        party.targetId = { id: targetId, type: targetType, markedAt: Date.now() };
        
        this.notifyTargetMarked(party, targetId, targetType);

        return { success: true };
    }

    clearPartyTarget(leaderId) {
        const party = this.findPartyByMember(leaderId);
        if (!party) return { success: false, error: 'Você não está em um grupo' };

        if (party.leaderId !== leaderId) {
            return { success: false, error: 'Apenas o líder pode limpar' };
        }

        party.targetId = null;
        
        this.notifyTargetCleared(party);

        return { success: true };
    }

    // ============ PARTY BUFFS ============

    startPartyBuffTimer() {
        // Aplicar buffs a cada 10 segundos
        setInterval(() => {
            this.updatePartyBuffs();
        }, 10000);
    }

    updatePartyBuffs() {
        for (const party of this.parties.values()) {
            // Só aplica buffs em Party (não em Raid)
            if (party.groupType === this.GROUP_TYPES.RAID) continue;
            
            const memberCount = Math.min(party.members.size, 5); // Cap em 5
            if (memberCount < 2) continue;

            // Buffs baseados no tamanho do grupo (só até 5 membros)
            const hpBonus = memberCount * 2; // +2% HP por membro (máx +10%)
            const expBonus = memberCount * 2; // +2% EXP por membro (máx +10%)

            for (const member of party.members.values()) {
                const char = this.characterPersistence?.getActiveCharacter(member.characterId);
                if (char?.applyPartyBuff) {
                    char.applyPartyBuff({
                        hpBonus,
                        expBonus,
                        duration: 15000 // 15 segundos
                    });
                }
            }
        }
    }

    // ============ PARTY CHAT ============

    sendPartyMessage(senderId, message) {
        const party = this.findPartyByMember(senderId);
        if (!party) return { success: false, error: 'Você não está em um grupo' };

        const sender = party.members.get(senderId);
        
        const chatEntry = {
            senderId,
            senderName: sender.name,
            message,
            timestamp: Date.now()
        };

        party.chatHistory.push(chatEntry);
        
        // Limitar histórico
        if (party.chatHistory.length > 100) {
            party.chatHistory.shift();
        }

        // Broadcast para todos
        for (const memberId of party.members.keys()) {
            this.notifyPartyMessage(memberId, chatEntry);
        }

        return { success: true };
    }

    // ============ UPDATE MEMBER DATA ============

    updateMemberData(characterId, data) {
        const party = this.findPartyByMember(characterId);
        if (!party) return;

        const member = party.members.get(characterId);
        if (!member) return;

        // Atualizar dados
        if (data.hp !== undefined) member.hp = data.hp;
        if (data.maxHp !== undefined) member.maxHp = data.maxHp;
        if (data.position) member.position = data.position;
        if (data.level) member.level = data.level;

        // Broadcast para outros membros
        this.broadcastMemberUpdate(party, characterId, member);
    }

    // ============ UTILITY ============

    findPartyByMember(characterId) {
        for (const party of this.parties.values()) {
            if (party.members.has(characterId)) {
                return party;
            }
        }
        return null;
    }

    calculateDistance(pos1, pos2) {
        if (!pos1 || !pos2) return Infinity;
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    sanitizePartyForClient(party) {
        return {
            id: party.id,
            name: party.name,
            leaderId: party.leaderId,
            groupType: party.groupType || 'party',
            maxSize: party.maxSize || this.MAX_PARTY_SIZE,
            memberCount: party.members.size,
            members: Array.from(party.members.values()),
            lootMode: party.lootMode,
            expSharing: party.expSharing,
            expBonus: party.groupType === this.GROUP_TYPES.PARTY ? this.EXP_BONUS[Math.min(party.members.size, 5)] : 0,
            targetId: party.targetId,
            settings: party.settings
        };
    }

    startInviteCleanupTimer() {
        setInterval(() => {
            const now = Date.now();
            for (const [characterId, invite] of this.invites) {
                if (now > invite.expiresAt) {
                    this.invites.delete(characterId);
                    
                    // Notificar que expirou
                    const char = this.characterPersistence?.getActiveCharacter(characterId);
                    if (char?.socket) {
                        char.socket.emit('party:invite_expired', { 
                            partyId: invite.partyId 
                        });
                    }
                }
            }
        }, 30000); // Checar a cada 30 segundos
    }

    // ============ NOTIFICATIONS ============

    notifyPartyCreated(leaderId, party) {
        const char = this.characterPersistence?.getActiveCharacter(leaderId);
        if (char?.socket) {
            char.socket.emit('party:created', { 
                party: this.sanitizePartyForClient(party) 
            });
        }
    }

    notifyInviteReceived(targetId, party, inviterId) {
        const char = this.characterPersistence?.getActiveCharacter(targetId);
        if (char?.socket) {
            char.socket.emit('party:invite_received', {
                partyId: party.id,
                partyName: party.name,
                invitedBy: inviterId,
                inviterName: party.members.get(inviterId)?.name,
                expiresIn: this.INVITE_EXPIRY_MS
            });
        }
    }

    notifyInviteDeclined(party, targetId, inviterId) {
        const inviter = this.characterPersistence?.getActiveCharacter(inviterId);
        if (inviter?.socket) {
            inviter.socket.emit('party:invite_declined', {
                targetId,
                targetName: party.members.get(targetId)?.name || 'Jogador'
            });
        }
    }

    notifyMemberJoined(party, newMemberId) {
        const newMember = party.members.get(newMemberId);
        
        for (const [memberId, member] of party.members) {
            const char = this.characterPersistence?.getActiveCharacter(memberId);
            if (char?.socket) {
                char.socket.emit('party:member_joined', {
                    party: this.sanitizePartyForClient(party),
                    newMember: {
                        characterId: newMemberId,
                        name: newMember.name,
                        level: newMember.level,
                        class: newMember.class
                    }
                });
            }
        }
    }

    notifyMemberLeft(party, leftMemberId) {
        for (const memberId of party.members.keys()) {
            const char = this.characterPersistence?.getActiveCharacter(memberId);
            if (char?.socket) {
                char.socket.emit('party:member_left', {
                    memberId: leftMemberId,
                    newLeader: party.leaderId,
                    party: this.sanitizePartyForClient(party)
                });
            }
        }
    }

    notifyMemberKicked(party, kickedId) {
        // Notificar kikado
        const kicked = this.characterPersistence?.getActiveCharacter(kickedId);
        if (kicked?.socket) {
            kicked.socket.emit('party:kicked');
        }

        // Notificar resto do grupo
        for (const memberId of party.members.keys()) {
            const char = this.characterPersistence?.getActiveCharacter(memberId);
            if (char?.socket) {
                char.socket.emit('party:member_kicked', {
                    memberId: kickedId,
                    party: this.sanitizePartyForClient(party)
                });
            }
        }
    }

    notifyLeaderChanged(party, newLeaderId) {
        for (const memberId of party.members.keys()) {
            const char = this.characterPersistence?.getActiveCharacter(memberId);
            if (char?.socket) {
                char.socket.emit('party:leader_changed', {
                    newLeaderId,
                    party: this.sanitizePartyForClient(party)
                });
            }
        }
    }

    notifyGroupTypeChanged(party, newGroupType) {
        const isRaid = newGroupType === this.GROUP_TYPES.RAID;
        const message = isRaid 
            ? `Grupo convertido para Raid! (máx ${this.MAX_RAID_SIZE} membros, XP individual)`
            : `Raid convertido para Grupo! (máx ${this.MAX_PARTY_SIZE} membros, XP compartilhado)`;
        
        for (const memberId of party.members.keys()) {
            const char = this.characterPersistence?.getActiveCharacter(memberId);
            if (char?.socket) {
                char.socket.emit('party:group_type_changed', {
                    groupType: newGroupType,
                    maxSize: party.maxSize,
                    expSharing: party.expSharing,
                    message,
                    party: this.sanitizePartyForClient(party)
                });
            }
        }
    }

    notifyPartyDestroyed(memberId, party) {
        const char = this.characterPersistence?.getActiveCharacter(memberId);
        if (char?.socket) {
            char.socket.emit('party:destroyed', {
                partyName: party.name
            });
        }
    }

    notifyLootModeChanged(party, mode) {
        for (const memberId of party.members.keys()) {
            const char = this.characterPersistence?.getActiveCharacter(memberId);
            if (char?.socket) {
                char.socket.emit('party:loot_mode_changed', { mode });
            }
        }
    }

    notifyExpSharingChanged(party, enabled) {
        for (const memberId of party.members.keys()) {
            const char = this.characterPersistence?.getActiveCharacter(memberId);
            if (char?.socket) {
                char.socket.emit('party:exp_sharing_changed', { enabled });
            }
        }
    }

    notifyTargetMarked(party, targetId, targetType) {
        for (const memberId of party.members.keys()) {
            const char = this.characterPersistence?.getActiveCharacter(memberId);
            if (char?.socket) {
                char.socket.emit('party:target_marked', {
                    targetId,
                    targetType
                });
            }
        }
    }

    notifyTargetCleared(party) {
        for (const memberId of party.members.keys()) {
            const char = this.characterPersistence?.getActiveCharacter(memberId);
            if (char?.socket) {
                char.socket.emit('party:target_cleared');
            }
        }
    }

    notifyPartyMessage(memberId, chatEntry) {
        const char = this.characterPersistence?.getActiveCharacter(memberId);
        if (char?.socket) {
            char.socket.emit('party:message', chatEntry);
        }
    }

    broadcastMemberUpdate(party, memberId, memberData) {
        for (const id of party.members.keys()) {
            if (id === memberId) continue; // Não enviar para o próprio
            
            const char = this.characterPersistence?.getActiveCharacter(id);
            if (char?.socket) {
                char.socket.emit('party:member_update', {
                    memberId,
                    hp: memberData.hp,
                    maxHp: memberData.maxHp,
                    position: memberData.position,
                    level: memberData.level
                });
            }
        }
    }

    // ============ GETTERS ============

    getPartyInfo(partyId) {
        const party = this.parties.get(partyId);
        if (!party) return null;
        return this.sanitizePartyForClient(party);
    }

    getMemberParty(characterId) {
        const party = this.findPartyByMember(characterId);
        if (!party) return null;
        return this.sanitizePartyForClient(party);
    }

    getAllParties() {
        return Array.from(this.parties.values()).map(p => this.sanitizePartyForClient(p));
    }

    getPartyStats() {
        return {
            totalParties: this.parties.size,
            totalMembers: Array.from(this.parties.values())
                .reduce((sum, p) => sum + p.members.size, 0),
            averagePartySize: this.parties.size > 0 
                ? Array.from(this.parties.values()).reduce((sum, p) => sum + p.members.size, 0) / this.parties.size 
                : 0
        };
    }
}

module.exports = PartyManager;
