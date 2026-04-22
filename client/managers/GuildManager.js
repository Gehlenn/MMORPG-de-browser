/**
 * GuildManager - Sistema de Guildas (Client-Side Offline)
 * 
 * Responsabilidades:
 * - Criar/desfazer guildas
 * - Convidar/aceitar membros
 * - Hierarquia (Líder, Oficial, Membro, Iniciante)
 * - Banco da guilda
 * - Habilidades de guilda
 * - Chat de guilda
 * - Guerra entre guildas
 */

class GuildManager {
    constructor(playerId) {
        this.playerId = playerId;
        
        // Guilda atual do jogador
        this.currentGuild = null;
        
        // Todas as guildas (simulação)
        this.guilds = new Map();
        
        // Convites pendentes
        this.invitations = new Map();
        
        // Configurações
        this.maxGuildNameLength = 24;
        this.minGuildNameLength = 2;
        this.maxTagLength = 4;
        this.minTagLength = 3;
        this.maxMembers = 50;
        this.createCost = 10000;
        this.minLevel = 10;
        
        // Callbacks
        this.onGuildCreated = null;
        this.onGuildJoined = null;
        this.onGuildLeft = null;
        this.onMemberJoined = null;
        this.onMemberLeft = null;
        this.onInviteReceived = null;
        this.onGuildChat = null;
        this.onGuildWar = null;
        
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        this.loadFromStorage();
        
        // Criar guildas de exemplo se não existirem
        this.createSampleGuilds();
        
        this.initialized = true;
        console.log('🏰 GuildManager inicializado');
    }
    
    // ===================== CRIAR GUILDA =====================
    
    createGuild(name, tag, description = '') {
        // Validações
        if (!name || name.length < this.minGuildNameLength || name.length > this.maxGuildNameLength) {
            return { success: false, error: `Nome deve ter ${this.minGuildNameLength}-${this.maxGuildNameLength} caracteres` };
        }
        
        if (!tag || tag.length < this.minTagLength || tag.length > this.maxTagLength) {
            return { success: false, error: `Tag deve ter ${this.minTagLength}-${this.maxTagLength} caracteres` };
        }
        
        // Verificar se já está em uma guilda
        if (this.currentGuild) {
            return { success: false, error: 'Você já está em uma guilda' };
        }
        
        // Verificar nome/tag únicos
        for (const guild of this.guilds.values()) {
            if (guild.name.toLowerCase() === name.toLowerCase()) {
                return { success: false, error: 'Nome de guilda já existe' };
            }
            if (guild.tag.toLowerCase() === tag.toLowerCase()) {
                return { success: false, error: 'Tag já existe' };
            }
        }
        
        // Criar guilda
        const guildId = `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const guild = {
            id: guildId,
            name: name.trim(),
            tag: tag.trim().toUpperCase(),
            description: description.trim(),
            leaderId: this.playerId,
            createdAt: Date.now(),
            level: 1,
            experience: 0,
            maxMembers: this.maxMembers,
            members: new Map(),
            bank: {
                gold: 0,
                items: []
            },
            skills: {
                attackBonus: 0,
                defenseBonus: 0,
                xpBonus: 0,
                goldBonus: 0
            },
            wars: [], // Guerras ativas
            allies: [], // Alianças
            announcements: []
        };
        
        // Adicionar líder como membro
        guild.members.set(this.playerId, {
            id: this.playerId,
            name: 'Você',
            rank: 'LEADER',
            joinedAt: Date.now(),
            contribution: 0,
            status: 'online',
            lastActive: Date.now()
        });
        
        this.guilds.set(guildId, guild);
        this.currentGuild = guild;
        
        this.saveToStorage();
        
        if (this.onGuildCreated) {
            this.onGuildCreated(guild);
        }
        
        // Som
        if (window.audioManager) {
            window.audioManager.play('guild_created');
        }
        
        console.log('🏰 Guilda criada:', guild.name, `[${guild.tag}]`);
        
        return {
            success: true,
            guild,
            message: `Guilda "${guild.name}" [${guild.tag}] criada com sucesso!`
        };
    }
    
    // ===================== CONVITES E ENTRADA =====================
    
    invitePlayer(targetPlayerId, targetPlayerName) {
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        // Verificar permissão (líder ou oficial)
        const myMembership = this.currentGuild.members.get(this.playerId);
        if (!myMembership || !['LEADER', 'OFFICER'].includes(myMembership.rank)) {
            return { success: false, error: 'Apenas líderes e oficiais podem convidar' };
        }
        
        // Verificar limite
        if (this.currentGuild.members.size >= this.currentGuild.maxMembers) {
            return { success: false, error: 'Guilda está cheia' };
        }
        
        // Verificar se já é membro
        if (this.currentGuild.members.has(targetPlayerId)) {
            return { success: false, error: 'Jogador já é membro' };
        }
        
        // Criar convite
        const inviteId = `invite_${Date.now()}`;
        const invite = {
            id: inviteId,
            guildId: this.currentGuild.id,
            guildName: this.currentGuild.name,
            guildTag: this.currentGuild.tag,
            inviterId: this.playerId,
            inviterName: myMembership.name,
            targetPlayerId,
            targetPlayerName,
            createdAt: Date.now(),
            expiresAt: Date.now() + 86400000 // 24 horas
        };
        
        this.invitations.set(inviteId, invite);
        
        // Notificar (simulação offline)
        setTimeout(() => {
            this.simulateInviteResponse(invite);
        }, 3000);
        
        this.saveToStorage();
        
        console.log('📨 Convite enviado para', targetPlayerName);
        
        return {
            success: true,
            invite,
            message: `Convite enviado para ${targetPlayerName}`
        };
    }
    
    simulateInviteResponse(invite) {
        // Simulação: 70% aceita, 30% recusa
        const accepted = Math.random() < 0.7;
        
        setTimeout(() => {
            if (accepted) {
                this.acceptInviteAsPlayer(invite);
            } else {
                this.declineInvite(invite.id);
                console.log(`❌ ${invite.targetPlayerName} recusou o convite`);
            }
        }, 5000);
    }
    
    acceptInviteAsPlayer(invite) {
        const guild = this.guilds.get(invite.guildId);
        if (!guild) return;
        
        // Adicionar membro
        guild.members.set(invite.targetPlayerId, {
            id: invite.targetPlayerId,
            name: invite.targetPlayerName,
            rank: 'INITIATE',
            joinedAt: Date.now(),
            contribution: 0,
            status: 'online',
            lastActive: Date.now()
        });
        
        // Remover convite
        this.invitations.delete(invite.id);
        
        this.saveToStorage();
        
        if (this.onMemberJoined) {
            this.onMemberJoined({
                guildId: guild.id,
                playerId: invite.targetPlayerId,
                playerName: invite.targetPlayerName
            });
        }
        
        console.log('✅', invite.targetPlayerName, 'entrou na guilda');
    }
    
    acceptInvite(inviteId) {
        const invite = this.invitations.get(inviteId);
        if (!invite) {
            return { success: false, error: 'Convite não encontrado' };
        }
        
        if (invite.targetPlayerId !== this.playerId) {
            return { success: false, error: 'Este convite não é para você' };
        }
        
        if (invite.expiresAt < Date.now()) {
            this.invitations.delete(inviteId);
            return { success: false, error: 'Convite expirado' };
        }
        
        if (this.currentGuild) {
            return { success: false, error: 'Você já está em uma guilda' };
        }
        
        const guild = this.guilds.get(invite.guildId);
        if (!guild) {
            return { success: false, error: 'Guilda não encontrada' };
        }
        
        // Adicionar como membro
        guild.members.set(this.playerId, {
            id: this.playerId,
            name: 'Você',
            rank: 'INITIATE',
            joinedAt: Date.now(),
            contribution: 0,
            status: 'online',
            lastActive: Date.now()
        });
        
        this.currentGuild = guild;
        this.invitations.delete(inviteId);
        
        this.saveToStorage();
        
        if (this.onGuildJoined) {
            this.onGuildJoined(guild);
        }
        
        console.log('🏰 Você entrou na guilda:', guild.name);
        
        return {
            success: true,
            guild,
            message: `Você entrou em [${guild.tag}] ${guild.name}!`
        };
    }
    
    declineInvite(inviteId) {
        this.invitations.delete(inviteId);
        this.saveToStorage();
        return { success: true };
    }
    
    // ===================== GERENCIAMENTO DE MEMBROS =====================
    
    leaveGuild() {
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        const myMembership = this.currentGuild.members.get(this.playerId);
        if (myMembership?.rank === 'LEADER') {
            return { success: false, error: 'O líder deve transferir liderança ou desfazer a guilda' };
        }
        
        const guildName = this.currentGuild.name;
        const guildId = this.currentGuild.id;
        
        this.currentGuild.members.delete(this.playerId);
        this.currentGuild = null;
        
        this.saveToStorage();
        
        if (this.onGuildLeft) {
            this.onGuildLeft({ guildId, guildName });
        }
        
        console.log('🏰 Você saiu da guilda:', guildName);
        
        return {
            success: true,
            message: `Você saiu de [${guildName}]`
        };
    }
    
    disbandGuild() {
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        const myMembership = this.currentGuild.members.get(this.playerId);
        if (myMembership?.rank !== 'LEADER') {
            return { success: false, error: 'Apenas o líder pode desfazer a guilda' };
        }
        
        const guildName = this.currentGuild.name;
        const guildId = this.currentGuild.id;
        
        // Notificar membros
        for (const [memberId] of this.currentGuild.members) {
            if (memberId !== this.playerId && this.onGuildLeft) {
                this.onGuildLeft({ guildId, guildName, disbanded: true });
            }
        }
        
        this.guilds.delete(guildId);
        this.currentGuild = null;
        
        this.saveToStorage();
        
        console.log('💥 Guilda desfeita:', guildName);
        
        return {
            success: true,
            message: `Guilda "${guildName}" foi desfeita`
        };
    }
    
    kickMember(targetPlayerId) {
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        const myMembership = this.currentGuild.members.get(this.playerId);
        if (!myMembership || !['LEADER', 'OFFICER'].includes(myMembership.rank)) {
            return { success: false, error: 'Apenas líderes e oficiais podem expulsar' };
        }
        
        const targetMembership = this.currentGuild.members.get(targetPlayerId);
        if (!targetMembership) {
            return { success: false, error: 'Jogador não é membro' };
        }
        
        // Oficial não pode expulsar outro oficial
        if (myMembership.rank === 'OFFICER' && targetMembership.rank === 'OFFICER') {
            return { success: false, error: 'Oficiais não podem expulsar outros oficiais' };
        }
        
        // Não pode expulsar líder
        if (targetMembership.rank === 'LEADER') {
            return { success: false, error: 'Não pode expulsar o líder' };
        }
        
        const targetName = targetMembership.name;
        this.currentGuild.members.delete(targetPlayerId);
        
        this.saveToStorage();
        
        if (this.onMemberLeft) {
            this.onMemberLeft({
                guildId: this.currentGuild.id,
                playerId: targetPlayerId,
                playerName: targetName,
                kicked: true
            });
        }
        
        console.log('🚫', targetName, 'foi expulso');
        
        return {
            success: true,
            message: `${targetName} foi expulso da guilda`
        };
    }
    
    promoteMember(targetPlayerId, newRank) {
        const validRanks = ['INITIATE', 'MEMBER', 'OFFICER'];
        if (!validRanks.includes(newRank)) {
            return { success: false, error: 'Rank inválido' };
        }
        
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        const myMembership = this.currentGuild.members.get(this.playerId);
        if (myMembership?.rank !== 'LEADER') {
            return { success: false, error: 'Apenas o líder pode promover' };
        }
        
        const targetMembership = this.currentGuild.members.get(targetPlayerId);
        if (!targetMembership) {
            return { success: false, error: 'Jogador não é membro' };
        }
        
        const oldRank = targetMembership.rank;
        targetMembership.rank = newRank;
        
        this.saveToStorage();
        
        console.log('⬆️', targetMembership.name, 'promovido de', oldRank, 'para', newRank);
        
        return {
            success: true,
            message: `${targetMembership.name} agora é ${this.getRankName(newRank)}`
        };
    }
    
    transferLeadership(newLeaderId) {
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        const myMembership = this.currentGuild.members.get(this.playerId);
        if (myMembership?.rank !== 'LEADER') {
            return { success: false, error: 'Apenas o líder pode transferir' };
        }
        
        const newLeaderMembership = this.currentGuild.members.get(newLeaderId);
        if (!newLeaderMembership) {
            return { success: false, error: 'Novo líder deve ser membro da guilda' };
        }
        
        // Trocar ranks
        myMembership.rank = 'OFFICER';
        newLeaderMembership.rank = 'LEADER';
        this.currentGuild.leaderId = newLeaderId;
        
        this.saveToStorage();
        
        console.log('👑 Liderança transferida para', newLeaderMembership.name);
        
        return {
            success: true,
            message: `Liderança transferida para ${newLeaderMembership.name}`
        };
    }
    
    // ===================== BANCO DA GUILDA =====================
    
    depositToBank(type, amountOrItem) {
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        if (type === 'gold') {
            // Verificar se jogador tem ouro suficiente
            if (window.inventoryManager) {
                const currentGold = window.inventoryManager.getGold();
                if (currentGold < amountOrItem) {
                    return { success: false, error: 'Ouro insuficiente' };
                }
                window.inventoryManager.removeGold(amountOrItem);
            }
            
            this.currentGuild.bank.gold += amountOrItem;
            this.addContribution(this.playerId, amountOrItem);
            
            this.saveToStorage();
            
            return {
                success: true,
                message: `${amountOrItem}💰 depositados no banco da guilda`
            };
        }
        
        if (type === 'item') {
            this.currentGuild.bank.items.push(amountOrItem);
            this.saveToStorage();
            
            return {
                success: true,
                message: 'Item depositado no banco'
            };
        }
        
        return { success: false, error: 'Tipo inválido' };
    }
    
    withdrawFromBank(type, amountOrIndex) {
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        // Verificar permissão
        const myMembership = this.currentGuild.members.get(this.playerId);
        if (!myMembership || !['LEADER', 'OFFICER'].includes(myMembership.rank)) {
            return { success: false, error: 'Apenas líderes e oficiais podem sacar' };
        }
        
        if (type === 'gold') {
            if (this.currentGuild.bank.gold < amountOrIndex) {
                return { success: false, error: 'Ouro insuficiente no banco' };
            }
            
            this.currentGuild.bank.gold -= amountOrIndex;
            
            if (window.inventoryManager) {
                window.inventoryManager.addGold(amountOrIndex);
            }
            
            this.saveToStorage();
            
            return {
                success: true,
                message: `${amountOrIndex}💰 sacados do banco`
            };
        }
        
        if (type === 'item') {
            if (amountOrIndex < 0 || amountOrIndex >= this.currentGuild.bank.items.length) {
                return { success: false, error: 'Item não encontrado' };
            }
            
            const item = this.currentGuild.bank.items.splice(amountOrIndex, 1)[0];
            
            if (window.inventoryManager) {
                window.inventoryManager.addItem(item);
            }
            
            this.saveToStorage();
            
            return {
                success: true,
                item,
                message: 'Item sacado do banco'
            };
        }
        
        return { success: false, error: 'Tipo inválido' };
    }
    
    // ===================== HABILIDADES DA GUILDA =====================
    
    upgradeSkill(skillType) {
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        const myMembership = this.currentGuild.members.get(this.playerId);
        if (myMembership?.rank !== 'LEADER') {
            return { success: false, error: 'Apenas o líder pode melhorar habilidades' };
        }
        
        const costs = {
            attackBonus: 10000,
            defenseBonus: 10000,
            xpBonus: 15000,
            goldBonus: 15000
        };
        
        const currentLevel = this.currentGuild.skills[skillType] || 0;
        const maxLevel = 10;
        
        if (currentLevel >= maxLevel) {
            return { success: false, error: 'Habilidade no nível máximo' };
        }
        
        const cost = costs[skillType] * (currentLevel + 1);
        
        if (this.currentGuild.bank.gold < cost) {
            return { success: false, error: `Necessário ${cost}💰 no banco` };
        }
        
        this.currentGuild.bank.gold -= cost;
        this.currentGuild.skills[skillType] = currentLevel + 1;
        
        this.saveToStorage();
        
        const skillNames = {
            attackBonus: 'Bônus de Ataque',
            defenseBonus: 'Bônus de Defesa',
            xpBonus: 'Bônus de XP',
            goldBonus: 'Bônus de Ouro'
        };
        
        return {
            success: true,
            message: `${skillNames[skillType]} melhorado para nível ${currentLevel + 1}`
        };
    }
    
    getSkillEffects() {
        if (!this.currentGuild) return {};
        
        return {
            attackBonus: this.currentGuild.skills.attackBonus * 2, // +2% por nível
            defenseBonus: this.currentGuild.skills.defenseBonus * 2,
            xpBonus: this.currentGuild.skills.xpBonus * 5, // +5% por nível
            goldBonus: this.currentGuild.skills.goldBonus * 5
        };
    }
    
    // ===================== GERRA DE GUILDA =====================
    
    declareWar(targetGuildId) {
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        const myMembership = this.currentGuild.members.get(this.playerId);
        if (myMembership?.rank !== 'LEADER') {
            return { success: false, error: 'Apenas o líder pode declarar guerra' };
        }
        
        const targetGuild = this.guilds.get(targetGuildId);
        if (!targetGuild) {
            return { success: false, error: 'Guilda alvo não encontrada' };
        }
        
        if (targetGuildId === this.currentGuild.id) {
            return { success: false, error: 'Não pode declarar guerra contra si mesmo' };
        }
        
        // Verificar se já está em guerra
        const existingWar = this.currentGuild.wars.find(w => w.targetGuildId === targetGuildId);
        if (existingWar) {
            return { success: false, error: 'Já está em guerra com esta guilda' };
        }
        
        const war = {
            id: `war_${Date.now()}`,
            targetGuildId,
            targetGuildName: targetGuild.name,
            targetGuildTag: targetGuild.tag,
            declaredAt: Date.now(),
            kills: 0,
            deaths: 0,
            status: 'active'
        };
        
        this.currentGuild.wars.push(war);
        
        // Adicionar guerra na guilda alvo também
        const counterWar = {
            id: war.id,
            targetGuildId: this.currentGuild.id,
            targetGuildName: this.currentGuild.name,
            targetGuildTag: this.currentGuild.tag,
            declaredAt: Date.now(),
            kills: 0,
            deaths: 0,
            status: 'active'
        };
        targetGuild.wars.push(counterWar);
        
        this.saveToStorage();
        
        if (this.onGuildWar) {
            this.onGuildWar({
                type: 'declared',
                war,
                guildName: this.currentGuild.name
            });
        }
        
        console.log('⚔️ Guerra declarada contra', targetGuild.name);
        
        return {
            success: true,
            message: `Guerra declarada contra [${targetGuild.tag}] ${targetGuild.name}!`
        };
    }
    
    endWar(targetGuildId) {
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        const myMembership = this.currentGuild.members.get(this.playerId);
        if (myMembership?.rank !== 'LEADER') {
            return { success: false, error: 'Apenas o líder pode encerrar guerra' };
        }
        
        const warIndex = this.currentGuild.wars.findIndex(w => w.targetGuildId === targetGuildId);
        if (warIndex === -1) {
            return { success: false, error: 'Não está em guerra com esta guilda' };
        }
        
        const war = this.currentGuild.wars[warIndex];
        war.status = 'ended';
        war.endedAt = Date.now();
        
        // Remover das guerras ativas
        this.currentGuild.wars.splice(warIndex, 1);
        
        // Também remover da guilda alvo
        const targetGuild = this.guilds.get(targetGuildId);
        if (targetGuild) {
            const targetWarIndex = targetGuild.wars.findIndex(w => w.targetGuildId === this.currentGuild.id);
            if (targetWarIndex !== -1) {
                targetGuild.wars.splice(targetWarIndex, 1);
            }
        }
        
        this.saveToStorage();
        
        return {
            success: true,
            message: `Guerra contra [${war.targetGuildTag}] encerrada`
        };
    }
    
    // ===================== UTILS =====================
    
    addContribution(playerId, amount) {
        if (!this.currentGuild) return;
        
        const member = this.currentGuild.members.get(playerId);
        if (member) {
            member.contribution += amount;
            member.lastActive = Date.now();
            this.saveToStorage();
        }
    }
    
    getRankName(rank) {
        const names = {
            'LEADER': 'Líder',
            'OFFICER': 'Oficial',
            'MEMBER': 'Membro',
            'INITIATE': 'Iniciante'
        };
        return names[rank] || rank;
    }
    
    getGuildStatus() {
        if (!this.currentGuild) {
            return { inGuild: false };
        }
        
        const myMembership = this.currentGuild.members.get(this.playerId);
        
        return {
            inGuild: true,
            guild: {
                id: this.currentGuild.id,
                name: this.currentGuild.name,
                tag: this.currentGuild.tag,
                description: this.currentGuild.description,
                level: this.currentGuild.level,
                experience: this.currentGuild.experience,
                maxMembers: this.currentGuild.maxMembers,
                memberCount: this.currentGuild.members.size,
                bank: this.currentGuild.bank,
                skills: this.currentGuild.skills,
                wars: this.currentGuild.wars,
                myRank: myMembership?.rank,
                myContribution: myMembership?.contribution || 0
            },
            members: Array.from(this.currentGuild.members.values()),
            invitations: Array.from(this.invitations.values()).filter(i => i.targetPlayerId === this.playerId)
        };
    }
    
    browseGuilds() {
        const guilds = [];
        for (const guild of this.guilds.values()) {
            guilds.push({
                id: guild.id,
                name: guild.name,
                tag: guild.tag,
                description: guild.description,
                level: guild.level,
                memberCount: guild.members.size,
                maxMembers: guild.maxMembers,
                leaderName: guild.members.get(guild.leaderId)?.name || 'Desconhecido'
            });
        }
        return guilds;
    }
    
    createSampleGuilds() {
        if (this.guilds.size > 0) return;
        
        const sampleGuilds = [
            {
                name: 'Dragões de Eldoria',
                tag: 'ELD',
                description: 'Os protetores do reino de Eldoria'
            },
            {
                name: 'Sombras de Verdantis',
                tag: 'VERD',
                description: 'Guilda misteriosa das florestas'
            },
            {
                name: 'Cavaleiros de Aurélia',
                tag: 'AUR',
                description: 'Honra e glória para Aurélia!'
            }
        ];
        
        sampleGuilds.forEach((data, index) => {
            const guildId = `guild_sample_${index}`;
            const guild = {
                id: guildId,
                name: data.name,
                tag: data.tag,
                description: data.description,
                leaderId: `npc_leader_${index}`,
                createdAt: Date.now() - 86400000 * 30, // 30 dias atrás
                level: Math.floor(Math.random() * 5) + 1,
                experience: 0,
                maxMembers: this.maxMembers,
                members: new Map(),
                bank: { gold: Math.floor(Math.random() * 50000), items: [] },
                skills: {
                    attackBonus: Math.floor(Math.random() * 5),
                    defenseBonus: Math.floor(Math.random() * 5),
                    xpBonus: Math.floor(Math.random() * 3),
                    goldBonus: Math.floor(Math.random() * 3)
                },
                wars: [],
                allies: [],
                announcements: []
            };
            
            // Adicionar líder e alguns membros NPC
            guild.members.set(guild.leaderId, {
                id: guild.leaderId,
                name: `Líder ${data.tag}`,
                rank: 'LEADER',
                joinedAt: guild.createdAt,
                contribution: 10000,
                status: Math.random() > 0.5 ? 'online' : 'offline',
                lastActive: Date.now()
            });
            
            // Adicionar membros aleatórios
            const memberCount = Math.floor(Math.random() * 15) + 5;
            for (let i = 0; i < memberCount; i++) {
                const memberId = `npc_${guildId}_${i}`;
                const ranks = ['OFFICER', 'MEMBER', 'MEMBER', 'MEMBER', 'INITIATE', 'INITIATE'];
                guild.members.set(memberId, {
                    id: memberId,
                    name: `Membro${i} ${data.tag}`,
                    rank: ranks[Math.floor(Math.random() * ranks.length)],
                    joinedAt: Date.now() - Math.random() * 86400000 * 20,
                    contribution: Math.floor(Math.random() * 5000),
                    status: Math.random() > 0.7 ? 'online' : 'offline',
                    lastActive: Date.now() - Math.random() * 86400000
                });
            }
            
            this.guilds.set(guildId, guild);
        });
        
        console.log('🏰 Guildas de exemplo criadas:', sampleGuilds.length);
    }
    
    // ===================== CHAT DE GUILDA =====================
    
    sendGuildMessage(message) {
        if (!this.currentGuild) {
            return { success: false, error: 'Você não está em uma guilda' };
        }
        
        const myMembership = this.currentGuild.members.get(this.playerId);
        
        const chatMessage = {
            id: `msg_${Date.now()}`,
            senderId: this.playerId,
            senderName: myMembership.name,
            senderRank: myMembership.rank,
            message: message.trim(),
            timestamp: Date.now()
        };
        
        // Limitar histórico
        if (!this.currentGuild.chatHistory) {
            this.currentGuild.chatHistory = [];
        }
        this.currentGuild.chatHistory.push(chatMessage);
        if (this.currentGuild.chatHistory.length > 100) {
            this.currentGuild.chatHistory.shift();
        }
        
        this.saveToStorage();
        
        if (this.onGuildChat) {
            this.onGuildChat(chatMessage);
        }
        
        return { success: true };
    }
    
    // ===================== PERSISTÊNCIA =====================
    
    saveToStorage() {
        const data = {
            guilds: Array.from(this.guilds.entries()).map(([id, guild]) => ({
                id,
                ...guild,
                members: Array.from(guild.members.entries()),
                wars: guild.wars,
                allies: guild.allies,
                announcements: guild.announcements,
                chatHistory: guild.chatHistory || []
            })),
            currentGuildId: this.currentGuild?.id || null,
            invitations: Array.from(this.invitations.entries())
        };
        
        localStorage.setItem('guild_data', JSON.stringify(data));
    }
    
    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('guild_data') || '{}');
            
            if (data.guilds) {
                this.guilds.clear();
                for (const guildData of data.guilds) {
                    const guild = {
                        ...guildData,
                        members: new Map(guildData.members || []),
                        bank: guildData.bank || { gold: 0, items: [] },
                        skills: guildData.skills || { attackBonus: 0, defenseBonus: 0, xpBonus: 0, goldBonus: 0 },
                        wars: guildData.wars || [],
                        allies: guildData.allies || [],
                        announcements: guildData.announcements || [],
                        chatHistory: guildData.chatHistory || []
                    };
                    this.guilds.set(guildData.id, guild);
                }
            }
            
            if (data.currentGuildId && this.guilds.has(data.currentGuildId)) {
                this.currentGuild = this.guilds.get(data.currentGuildId);
                
                // Atualizar status para online
                const myMembership = this.currentGuild.members.get(this.playerId);
                if (myMembership) {
                    myMembership.status = 'online';
                    myMembership.lastActive = Date.now();
                }
            }
            
            if (data.invitations) {
                this.invitations = new Map(data.invitations);
            }
            
        } catch (e) {
            console.log('🏰 Nenhuma guilda salva');
        }
    }
    
    resetGuilds() {
        this.guilds.clear();
        this.currentGuild = null;
        this.invitations.clear();
        localStorage.removeItem('guild_data');
        this.createSampleGuilds();
    }
}

window.GuildManager = GuildManager;
