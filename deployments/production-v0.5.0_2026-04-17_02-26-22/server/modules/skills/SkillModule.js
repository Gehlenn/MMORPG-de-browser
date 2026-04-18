/**
 * SkillModule - Módulo de Skills e Talent Trees
 * Arquitetura estilo Blizzard/Riot - Feature Module
 * Controla sistema de skills, cooldowns e talent trees
 */

class SkillModule {
    constructor() {
        this.name = 'skills';
        this.priority = 15; // Prioridade média-alta (depois de combat, antes de inventory)
        this.initialized = false;
        
        // Sistemas do módulo
        this.skillSystem = null;
        this.cooldownSystem = null;
        this.talentTreeSystem = null;
        
        // Estado do módulo
        this.playerSkills = new Map(); // playerId -> skills data
        this.playerTalents = new Map(); // playerId -> talents data
        
        console.log('⚔️ SkillModule created');
    }
    
    /**
     * Inicializa o módulo de skills
     * @param {object} server - Instância do servidor
     */
    async init(server) {
        if (this.initialized) {
            console.warn('⚠️ SkillModule already initialized');
            return;
        }
        
        console.log('⚔️ Initializing SkillModule...');
        
        this.server = server;
        this.io = server.io;
        
        // Inicializar sistemas internos
        await this.initializeSkillSystem();
        await this.initializeCooldownSystem();
        await this.initializeTalentTreeSystem();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        this.initialized = true;
        console.log('✅ SkillModule initialized successfully');
    }
    
    /**
     * Inicializa sistema de skills
     */
    async initializeSkillSystem() {
        const SkillSystem = require('./SkillSystem');
        this.skillSystem = new SkillSystem();
        console.log('⚔️ SkillSystem initialized');
    }
    
    /**
     * Inicializa sistema de cooldowns
     */
    async initializeCooldownSystem() {
        const CooldownSystem = require('./CooldownSystem');
        this.cooldownSystem = new CooldownSystem();
        console.log('⏱️ CooldownSystem initialized');
    }
    
    /**
     * Inicializa sistema de talent trees
     */
    async initializeTalentTreeSystem() {
        this.talentTreeSystem = {
            // Obtém talent tree de uma classe
            getTalentTree: (className) => {
                const { getTalentTree } = require('./TalentTree');
                return getTalentTree(className);
            },
            
            // Obtém talentos disponíveis para jogador
            getAvailableTalents: (player) => {
                const { getAvailableTalents } = require('./TalentTree');
                return getAvailableTalents(player);
            },
            
            // Aprende talento
            learnTalent: (player, talentId) => {
                const tree = this.talentTreeSystem.getTalentTree(player.class);
                if (!tree) return { success: false, error: 'Invalid class' };
                
                // Encontrar talento
                let talent = null;
                for (let tier = 1; tier <= 3; tier++) {
                    const tierKey = `tier${tier}`;
                    if (tree[tierKey]) {
                        talent = tree[tierKey].find(t => t.id === talentId);
                        if (talent) break;
                    }
                }
                
                if (!talent) {
                    return { success: false, error: 'Talent not found' };
                }
                
                // Verificar se pode aprender
                const { canLearnTalent } = require('./TalentTree');
                if (!canLearnTalent(player, player.class, talent)) {
                    return { success: false, error: 'Cannot learn this talent' };
                }
                
                // Aprender talento
                if (!player.talents) player.talents = {};
                if (!player.talents[talentId]) player.talents[talentId] = 0;
                
                player.talents[talentId]++;
                talent.currentRank = player.talents[talentId];
                
                // Aplicar efeitos do talento
                this.applyTalentEffects(player, talent);
                
                return { success: true, talent: talent };
            },
            
            // Aplica efeitos de talento
            applyTalentEffects: (player, talent) => {
                if (!talent.effects) return;
                
                for (const [stat, value] of Object.entries(talent.effects)) {
                    switch (stat) {
                        case 'attack':
                        case 'bonusDamage':
                            player.attack = (player.attack || 10) + value;
                            break;
                        case 'defense':
                        case 'armor':
                            player.defense = (player.defense || 5) + value;
                            break;
                        case 'health':
                            player.maxHp = (player.maxHp || 100) + value;
                            player.hp = (player.hp || player.maxHp) + value;
                            break;
                        case 'mana':
                            player.maxMana = (player.maxMana || 50) + value;
                            player.mana = (player.mana || player.maxMana) + value;
                            break;
                        case 'agility':
                            player.agility = (player.agility || 10) + value;
                            break;
                        case 'strength':
                            player.strength = (player.strength || 10) + value;
                            break;
                        case 'intelligence':
                            player.intelligence = (player.intelligence || 10) + value;
                            break;
                        case 'spellCritChance':
                            player.spellCritChance = (player.spellCritChance || 0.05) + (value / 100);
                            break;
                        case 'rangedCritChance':
                            player.rangedCritChance = (player.rangedCritChance || 0.05) + (value / 100);
                            break;
                    }
                }
            }
        };
        
        console.log('🌳 TalentTreeSystem initialized');
    }
    
    /**
     * Setup de event handlers
     */
    setupEventHandlers() {
        // Eventos de skills
        this.io.on('skill_use', (socket, data) => {
            this.handleSkillUse(socket, data);
        });
        
        this.io.on('skill_learn', (socket, data) => {
            this.handleSkillLearn(socket, data);
        });
        
        this.io.on('skills_get', (socket, data) => {
            this.handleGetSkills(socket, data);
        });
        
        // Eventos de talentos
        this.io.on('talent_learn', (socket, data) => {
            this.handleTalentLearn(socket, data);
        });
        
        this.io.on('talents_get', (socket, data) => {
            this.handleGetTalents(socket, data);
        });
        
        // Eventos de jogador
        this.io.on('playerConnected', (player) => {
            this.handlePlayerConnected(player);
        });
        
        this.io.on('playerDisconnected', (playerId) => {
            this.handlePlayerDisconnected(playerId);
        });
        
        // Eventos de level up
        this.io.on('playerLevelUp', (player) => {
            this.handlePlayerLevelUp(player);
        });
    }
    
    /**
     * Update do módulo
     * @param {number} delta - Delta time
     */
    update(delta) {
        if (!this.initialized) return;
        
        // Update de cooldowns para todos os jogadores
        for (const player of this.server.players.values()) {
            this.cooldownSystem.update(player);
        }
    }
    
    /**
     * Handle de uso de skill
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados da skill
     */
    handleSkillUse(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { skillName, targetId, x, y } = data;
        
        // Encontrar alvo
        let target = null;
        if (targetId) {
            target = this.findTarget(targetId);
        } else if (x !== undefined && y !== undefined) {
            // Criar alvo de posição
            target = { x, y, name: 'Ground' };
        }
        
        // Usar skill
        const result = this.skillSystem.useSkill(player, skillName, target);
        
        if (result.success) {
            // Notificar sucesso
            socket.emit('skill_used', {
                skillName: skillName,
                target: targetId,
                result: result
            });
            
            // Notificar clientes próximos
            this.notifyNearbyPlayers(player, 'skill_cast', {
                casterId: player.id,
                skillName: skillName,
                targetId: targetId,
                damage: result.damage,
                effects: result.effects
            });
            
            // Se o alvo é um mob, notificar mudança de HP
            if (target && target.hp !== undefined) {
                const mobSocket = this.server.getPlayerSocket(target.id);
                if (mobSocket) {
                    mobSocket.emit('mob_damage', {
                        damage: result.damage,
                        currentHp: target.hp,
                        attackerId: player.id
                    });
                }
            }
            
            // Enviar stats atualizados
            socket.emit('player_stats', {
                health: player.hp,
                maxHealth: player.maxHp,
                mana: player.mana,
                maxMana: player.maxMana
            });
            
            console.log(`⚔️ ${player.name} used ${skillName}`);
        } else {
            // Notificar erro
            socket.emit('skill_error', {
                skillName: skillName,
                error: result.error
            });
        }
    }
    
    /**
     * Handle de aprendizado de skill
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados da skill
     */
    handleSkillLearn(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { skillName } = data;
        
        // Verificar se pode aprender skill
        const skill = this.skillSystem.getSkillInfo(skillName);
        if (!skill) {
            socket.emit('skill_error', { error: 'Skill not found' });
            return;
        }
        
        // Verificar requisitos
        if (player.level < skill.level) {
            socket.emit('skill_error', { error: 'Level too low' });
            return;
        }
        
        // Adicionar skill conhecida
        if (!player.knownSkills) player.knownSkills = new Set();
        player.knownSkills.add(skillName);
        
        // Notificar sucesso
        socket.emit('skill_learned', {
            skillName: skillName,
            skill: skill
        });
        
        console.log(`📚 ${player.name} learned ${skillName}`);
    }
    
    /**
     * Handle de obtenção de skills
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados da requisição
     */
    handleGetSkills(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        // Obter skills disponíveis
        const availableSkills = this.skillSystem.getAvailableSkills(player);
        
        // Obter skills conhecidas
        const knownSkills = player.knownSkills ? Array.from(player.knownSkills) : [];
        
        // Obter cooldowns ativos
        const activeCooldowns = this.cooldownSystem.getAllCooldowns(player);
        
        // Enviar para cliente
        socket.emit('skills_update', {
            availableSkills: availableSkills.map(skill => ({
                id: skill.id,
                name: skill.name,
                level: skill.level,
                damage: skill.damage,
                cooldown: skill.cooldown,
                manaCost: skill.manaCost,
                range: skill.range,
                type: skill.type,
                subtype: skill.subtype,
                description: skill.description,
                icon: skill.icon,
                known: knownSkills.includes(skill.id),
                onCooldown: activeCooldowns[skill.id] || null
            })),
            knownSkills: knownSkills,
            activeCooldowns: activeCooldowns
        });
    }
    
    /**
     * Handle de aprendizado de talento
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados do talento
     */
    handleTalentLearn(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { talentId } = data;
        
        // Verificar pontos de talento
        if (!player.talentPoints || player.talentPoints <= 0) {
            socket.emit('talent_error', { error: 'No talent points available' });
            return;
        }
        
        // Aprender talento
        const result = this.talentTreeSystem.learnTalent(player, talentId);
        
        if (result.success) {
            // Consumir ponto de talento
            player.talentPoints--;
            
            // Notificar sucesso
            socket.emit('talent_learned', {
                talentId: talentId,
                talent: result.talent,
                remainingPoints: player.talentPoints
            });
            
            // Enviar stats atualizados
            socket.emit('player_stats', {
                health: player.hp,
                maxHealth: player.maxHp,
                mana: player.mana,
                maxMana: player.maxMana,
                attack: player.attack,
                defense: player.defense
            });
            
            console.log(`🌳 ${player.name} learned talent ${talentId}`);
        } else {
            socket.emit('talent_error', { error: result.error });
        }
    }
    
    /**
     * Handle de obtenção de talentos
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados da requisição
     */
    handleGetTalents(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        // Obter árvore de talentos
        const talentTree = this.talentTreeSystem.getTalentTree(player.class);
        if (!talentTree) {
            socket.emit('talent_error', { error: 'Invalid class' });
            return;
        }
        
        // Obter talentos disponíveis
        const availableTalents = this.talentTreeSystem.getAvailableTalents(player);
        
        // Preparar dados dos talentos
        const talentsData = {
            tree: {
                name: talentTree.name,
                description: talentTree.description,
                maxPoints: talentTree.maxPoints
            },
            tiers: {},
            availableTalents: availableTalents,
            currentPoints: player.talentPoints || 0,
            learnedTalents: player.talents || {}
        };
        
        // Adicionar tiers
        for (let tier = 1; tier <= 3; tier++) {
            const tierKey = `tier${tier}`;
            if (talentTree[tierKey]) {
                talentsData.tiers[tierKey] = talentTree[tierKey].map(talent => ({
                    ...talent,
                    currentRank: (player.talents && player.talents[talent.id]) || 0,
                    canLearn: availableTalents.some(t => t.id === talent.id)
                }));
            }
        }
        
        // Enviar para cliente
        socket.emit('talents_update', talentsData);
    }
    
    /**
     * Handle de conexão de jogador
     * @param {object} player - Dados do jogador
     */
    handlePlayerConnected(player) {
        // Inicializar sistemas do jogador
        if (!player.knownSkills) {
            player.knownSkills = new Set();
        }
        
        if (!player.cooldowns) {
            player.cooldowns = {};
        }
        
        if (!player.talents) {
            player.talents = {};
        }
        
        if (!player.talentPoints) {
            player.talentPoints = Math.floor(player.level / 5); // 1 ponto a cada 5 níveis
        }
        
        // Salvar referências
        this.playerSkills.set(player.id, {
            knownSkills: player.knownSkills,
            cooldowns: player.cooldowns
        });
        
        this.playerTalents.set(player.id, {
            talents: player.talents,
            talentPoints: player.talentPoints
        });
        
        console.log(`⚔️ Initialized skills for ${player.name}`);
    }
    
    /**
     * Handle de desconexão de jogador
     * @param {string} playerId - ID do jogador
     */
    handlePlayerDisconnected(playerId) {
        // Limpar referências
        this.playerSkills.delete(playerId);
        this.playerTalents.delete(playerId);
        
        console.log(`⚔️ Cleaned up skills for player ${playerId}`);
    }
    
    /**
     * Handle de level up de jogador
     * @param {object} player - Dados do jogador
     */
    handlePlayerLevelUp(player) {
        // Adicionar ponto de talento a cada 5 níveis
        if (player.level % 5 === 0) {
            player.talentPoints = (player.talentPoints || 0) + 1;
            
            // Notificar jogador
            const socket = this.server.getPlayerSocket(player.id);
            if (socket) {
                socket.emit('talent_point_earned', {
                    level: player.level,
                    talentPoints: player.talentPoints
                });
            }
            
            console.log(`🌟 ${player.name} earned talent point at level ${player.level}`);
        }
        
        // Unlock skills baseadas no nível
        const availableSkills = this.skillSystem.getAvailableSkills(player);
        for (const skill of availableSkills) {
            if (!player.knownSkills.has(skill.id) && skill.level <= player.level) {
                player.knownSkills.add(skill.id);
                
                // Notificar jogador sobre nova skill
                const socket = this.server.getPlayerSocket(player.id);
                if (socket) {
                    socket.emit('skill_unlocked', {
                        skillName: skill.name,
                        skillId: skill.id
                    });
                }
                
                console.log(`🔓 ${player.name} unlocked skill ${skill.name}`);
            }
        }
    }
    
    /**
     * Encontra alvo
     * @param {string} targetId - ID do alvo
     * @returns {object|null} - Alvo encontrado
     */
    findTarget(targetId) {
        // Verificar players
        const player = this.server.players.get(targetId);
        if (player) return player;
        
        // Verificar mobs
        if (this.server.systems.spawnSystem) {
            const mob = this.server.systems.spawnSystem.getMob(targetId);
            if (mob) return mob;
        }
        
        return null;
    }
    
    /**
     * Notifica jogadores próximos
     * @param {object} player - Jogador de referência
     * @param {string} event - Evento
     * @param {object} data - Dados do evento
     */
    notifyNearbyPlayers(player, event, data) {
        // TODO: Implementar notificação para players próximos
        // Usar spatial grid do gameLoop
    }
    
    /**
     * Obtém informações de skills de um jogador
     * @param {string} playerId - ID do jogador
     * @returns {object} - Informações de skills
     */
    getPlayerSkills(playerId) {
        const player = this.server.players.get(playerId);
        if (!player) return null;
        
        return {
            knownSkills: Array.from(player.knownSkills || []),
            activeCooldowns: this.cooldownSystem.getAllCooldowns(player),
            availableSkills: this.skillSystem.getAvailableSkills(player)
        };
    }
    
    /**
     * Obtém informações de talentos de um jogador
     * @param {string} playerId - ID do jogador
     * @returns {object} - Informações de talentos
     */
    getPlayerTalents(playerId) {
        const player = this.server.players.get(playerId);
        if (!player) return null;
        
        return {
            talents: player.talents || {},
            talentPoints: player.talentPoints || 0,
            talentTree: this.talentTreeSystem.getTalentTree(player.class)
        };
    }
    
    /**
     * Cleanup do módulo
     */
    cleanup() {
        console.log('🧹 Cleaning up SkillModule...');
        
        // Limpar referências
        this.playerSkills.clear();
        this.playerTalents.clear();
        
        this.initialized = false;
        console.log('✅ SkillModule cleaned up');
    }
    
    /**
     * Obtém estatísticas do módulo
     */
    getStats() {
        return {
            name: this.name,
            initialized: this.initialized,
            playerCount: this.playerSkills.size,
            systems: {
                skillSystem: !!this.skillSystem,
                cooldownSystem: !!this.cooldownSystem,
                talentTreeSystem: !!this.talentTreeSystem
            }
        };
    }
}

module.exports = SkillModule;
