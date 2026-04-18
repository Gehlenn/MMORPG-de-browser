/**
 * CombatModule - Módulo de Combate
 * Arquitetura estilo Blizzard/Riot - Feature Module
 * Controla toda a lógica de combate do jogo
 */

class CombatModule {
    constructor() {
        this.name = 'combat';
        this.priority = 10; // Alta prioridade
        this.initialized = false;
        
        // Sistemas de combate
        this.combatSystem = null;
        this.damageCalculator = null;
        this.effectSystem = null;
        
        // Estado do módulo
        this.activeCombats = new Map(); // combatId -> combat data
        this.damageQueue = []; // Fila de danos a processar
        this.effectQueue = []; // Fila de efeitos a processar
        
        console.log('⚔️ CombatModule created');
    }
    
    /**
     * Inicializa o módulo de combate
     * @param {object} server - Instância do servidor
     */
    async init(server) {
        if (this.initialized) {
            console.warn('⚠️ CombatModule already initialized');
            return;
        }
        
        console.log('⚔️ Initializing CombatModule...');
        
        this.server = server;
        this.io = server.io;
        
        // Inicializar sistemas internos
        await this.initializeCombatSystem();
        await this.initializeDamageCalculator();
        await this.initializeEffectSystem();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        this.initialized = true;
        console.log('✅ CombatModule initialized successfully');
    }
    
    /**
     * Inicializa sistema de combate
     */
    async initializeCombatSystem() {
        this.combatSystem = {
            // Combates ativos
            activeCombats: new Map(),
            
            // Criar combate
            createCombat: (attacker, target) => {
                const combatId = `combat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                const combat = {
                    id: combatId,
                    attacker: attacker,
                    target: target,
                    startTime: Date.now(),
                    lastAction: Date.now(),
                    status: 'active',
                    rounds: []
                };
                
                this.combatSystem.activeCombats.set(combatId, combat);
                return combatId;
            },
            
            // Finalizar combate
            endCombat: (combatId, winner) => {
                const combat = this.combatSystem.activeCombats.get(combatId);
                if (combat) {
                    combat.status = 'ended';
                    combat.endTime = Date.now();
                    combat.winner = winner;
                    
                    // Notificar participantes
                    this.notifyCombatEnd(combat);
                    
                    // Remover combates ativos
                    this.combatSystem.activeCombats.delete(combatId);
                }
            },
            
            // Processar ação de combate
            processAction: (combatId, action) => {
                const combat = this.combatSystem.activeCombats.get(combatId);
                if (!combat || combat.status !== 'active') return false;
                
                combat.lastAction = Date.now();
                combat.rounds.push({
                    timestamp: Date.now(),
                    action: action
                });
                
                return true;
            }
        };
    }
    
    /**
     * Inicializa calculador de dano
     */
    async initializeDamageCalculator() {
        this.damageCalculator = {
            // Calcular dano base
            calculateBaseDamage: (attacker, target, skill) => {
                let damage = 0;
                
                // Dano base do atacante
                const attackPower = attacker.attack || 10;
                damage += attackPower;
                
                // Bônus de skill
                if (skill && skill.damageMultiplier) {
                    damage *= skill.damageMultiplier;
                }
                
                // Defesa do alvo
                const defense = target.defense || 5;
                damage = Math.max(1, damage - defense);
                
                // Randomização (±20%)
                const randomFactor = 0.8 + Math.random() * 0.4;
                damage = Math.floor(damage * randomFactor);
                
                return damage;
            },
            
            // Calcular dano crítico
            calculateCriticalDamage: (baseDamage, critChance = 0.1) => {
                const isCritical = Math.random() < critChance;
                if (isCritical) {
                    return Math.floor(baseDamage * 1.5); // 50% extra damage
                }
                return baseDamage;
            },
            
            // Aplicar vulnerabilidades/resistências
            applyDamageModifiers: (damage, damageType, target) => {
                let modifiedDamage = damage;
                
                // Resistências elementais
                if (target.resistances && target.resistances[damageType]) {
                    const resistance = target.resistances[damageType];
                    modifiedDamage = Math.floor(modifiedDamage * (1 - resistance));
                }
                
                // Vulnerabilidades
                if (target.vulnerabilities && target.vulnerabilities[damageType]) {
                    const vulnerability = target.vulnerabilities[damageType];
                    modifiedDamage = Math.floor(modifiedDamage * (1 + vulnerability));
                }
                
                return Math.max(1, modifiedDamage);
            }
        };
    }
    
    /**
     * Inicializa sistema de efeitos
     */
    async initializeEffectSystem() {
        this.effectSystem = {
            // Efeitos ativos
            activeEffects: new Map(), // entityId -> [effects]
            
            // Aplicar efeito
            applyEffect: (target, effect) => {
                if (!this.effectSystem.activeEffects.has(target.id)) {
                    this.effectSystem.activeEffects.set(target.id, []);
                }
                
                const effectWithId = {
                    ...effect,
                    id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    startTime: Date.now(),
                    appliedBy: target.id
                };
                
                this.effectSystem.activeEffects.get(target.id).push(effectWithId);
                
                // Aplicar efeito imediato
                this.applyImmediateEffect(target, effectWithId);
                
                return effectWithId.id;
            },
            
            // Remover efeito
            removeEffect: (targetId, effectId) => {
                const effects = this.effectSystem.activeEffects.get(targetId);
                if (effects) {
                    const index = effects.findIndex(e => e.id === effectId);
                    if (index !== -1) {
                        const removedEffect = effects.splice(index, 1)[0];
                        this.removeEffectStats(targetId, removedEffect);
                        return true;
                    }
                }
                return false;
            },
            
            // Update de efeitos
            updateEffects: (deltaTime) => {
                const now = Date.now();
                
                for (const [targetId, effects] of this.effectSystem.activeEffects) {
                    for (let i = effects.length - 1; i >= 0; i--) {
                        const effect = effects[i];
                        
                        // Verificar se expirou
                        if (effect.duration && now >= effect.startTime + effect.duration) {
                            this.removeEffect(targetId, effect.id);
                        }
                        
                        // Processar efeitos periódicos
                        if (effect.tickInterval && now >= effect.lastTick + effect.tickInterval) {
                            this.processPeriodicEffect(targetId, effect);
                            effect.lastTick = now;
                        }
                    }
                }
            }
        };
    }
    
    /**
     * Setup de event handlers
     */
    setupEventHandlers() {
        // Evento de ataque
        this.io.on('combatAttack', (socket, data) => {
            this.handleCombatAttack(socket, data);
        });
        
        // Evento de uso de skill
        this.io.on('combatSkill', (socket, data) => {
            this.handleCombatSkill(socket, data);
        });
        
        // Evento de morte de entidade
        this.io.on('entityDeath', (data) => {
            this.handleEntityDeath(data);
        });
    }
    
    /**
     * Update do módulo
     * @param {number} delta - Delta time
     */
    update(delta) {
        if (!this.initialized) return;
        
        // Processar fila de danos
        this.processDamageQueue();
        
        // Update de efeitos
        this.effectSystem.updateEffects(delta);
        
        // Update de combates ativos
        this.updateActiveCombats(delta);
        
        // Limpar combates expirados
        this.cleanupExpiredCombats();
    }
    
    /**
     * Processar fila de danos
     */
    processDamageQueue() {
        while (this.damageQueue.length > 0) {
            const damageEvent = this.damageQueue.shift();
            this.processDamage(damageEvent);
        }
    }
    
    /**
     * Processar dano
     * @param {object} damageEvent - Evento de dano
     */
    processDamage(damageEvent) {
        const { attacker, target, damage, damageType, source } = damageEvent;
        
        if (!target || target.health <= 0) return;
        
        // Aplicar dano
        target.health = Math.max(0, target.health - damage);
        
        // Notificar clientes
        this.notifyDamage(attacker, target, damage, damageType);
        
        // Verificar se morreu
        if (target.health <= 0) {
            this.server.emit('entityDeath', {
                entity: target,
                killer: attacker,
                source: source
            });
        }
    }
    
    /**
     * Handle de ataque de combate
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados do ataque
     */
    handleCombatAttack(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player || player.health <= 0) return;
        
        const { targetId, skillId } = data;
        
        // Encontrar alvo
        const target = this.findTarget(targetId);
        if (!target) return;
        
        // Verificar range
        const distance = this.calculateDistance(player, target);
        const maxRange = skillId ? 150 : 50; // Skills têm mais range
        
        if (distance > maxRange) {
            socket.emit('combatError', { message: 'Target too far' });
            return;
        }
        
        // Calcular dano
        const skill = skillId ? this.getSkill(skillId) : null;
        const baseDamage = this.damageCalculator.calculateBaseDamage(player, target, skill);
        const finalDamage = this.damageCalculator.applyDamageModifiers(baseDamage, skill?.damageType || 'physical', target);
        const criticalDamage = this.damageCalculator.calculateCriticalDamage(finalDamage, player.critChance || 0.1);
        
        // Adicionar à fila de danos
        this.damageQueue.push({
            attacker: player,
            target: target,
            damage: criticalDamage,
            damageType: skill?.damageType || 'physical',
            source: skillId || 'basic_attack'
        });
        
        // Criar ou atualizar combate
        let combatId = this.findActiveCombat(player.id, target.id);
        if (!combatId) {
            combatId = this.combatSystem.createCombat(player, target);
        }
        
        this.combatSystem.processAction(combatId, {
            type: 'attack',
            attacker: player.id,
            target: target.id,
            damage: criticalDamage,
            skill: skillId
        });
    }
    
    /**
     * Handle de uso de skill
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados da skill
     */
    handleCombatSkill(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player || player.health <= 0) return;
        
        const { skillId, targetId } = data;
        
        // Verificar se player tem a skill
        const skill = this.getSkill(skillId);
        if (!skill) {
            socket.emit('combatError', { message: 'Skill not found' });
            return;
        }
        
        // Verificar cooldown
        if (this.isSkillOnCooldown(player, skillId)) {
            socket.emit('combatError', { message: 'Skill on cooldown' });
            return;
        }
        
        // Verificar mana
        if (player.mana < skill.manaCost) {
            socket.emit('combatError', { message: 'Not enough mana' });
            return;
        }
        
        // Consumir mana
        player.mana -= skill.manaCost;
        
        // Aplicar cooldown
        this.applySkillCooldown(player, skillId);
        
        // Processar skill
        this.processSkill(player, skill, targetId);
    }
    
    /**
     * Processar skill
     * @param {object} player - Player
     * @param {object} skill - Skill
     * @param {string} targetId - ID do alvo
     */
    processSkill(player, skill, targetId) {
        switch (skill.type) {
            case 'damage':
                this.processDamageSkill(player, skill, targetId);
                break;
            case 'heal':
                this.processHealSkill(player, skill, targetId);
                break;
            case 'buff':
                this.processBuffSkill(player, skill, targetId);
                break;
            case 'debuff':
                this.processDebuffSkill(player, skill, targetId);
                break;
        }
    }
    
    /**
     * Processar skill de dano
     */
    processDamageSkill(player, skill, targetId) {
        const target = this.findTarget(targetId);
        if (!target) return;
        
        const damage = this.damageCalculator.calculateBaseDamage(player, target, skill);
        const finalDamage = this.damageCalculator.applyDamageModifiers(damage, skill.damageType, target);
        
        this.damageQueue.push({
            attacker: player,
            target: target,
            damage: finalDamage,
            damageType: skill.damageType,
            source: skill.id
        });
    }
    
    /**
     * Processar skill de cura
     */
    processHealSkill(player, skill, targetId) {
        const target = targetId ? this.findTarget(targetId) : player;
        if (!target) return;
        
        const healAmount = skill.healAmount || 50;
        target.health = Math.min(target.maxHealth, target.health + healAmount);
        
        this.notifyHeal(player, target, healAmount);
    }
    
    /**
     * Processar skill de buff
     */
    processBuffSkill(player, skill, targetId) {
        const target = targetId ? this.findTarget(targetId) : player;
        if (!target) return;
        
        const effect = {
            type: 'buff',
            stat: skill.buffStat,
            value: skill.buffValue,
            duration: skill.buffDuration || 10000,
            source: skill.id
        };
        
        this.effectSystem.applyEffect(target, effect);
        this.notifyBuffApplied(player, target, effect);
    }
    
    /**
     * Processar skill de debuff
     */
    processDebuffSkill(player, skill, targetId) {
        const target = this.findTarget(targetId);
        if (!target) return;
        
        const effect = {
            type: 'debuff',
            stat: skill.debuffStat,
            value: skill.debuffValue,
            duration: skill.debuffDuration || 5000,
            source: skill.id
        };
        
        this.effectSystem.applyEffect(target, effect);
        this.notifyDebuffApplied(player, target, effect);
    }
    
    /**
     * Handle de morte de entidade
     * @param {object} data - Dados da morte
     */
    handleEntityDeath(data) {
        const { entity, killer, source } = data;
        
        // Finalizar combates ativos
        for (const [combatId, combat] of this.combatSystem.activeCombats) {
            if (combat.attacker.id === entity.id || combat.target.id === entity.id) {
                const winner = combat.attacker.id === entity.id ? combat.target : combat.attacker;
                this.combatSystem.endCombat(combatId, winner);
            }
        }
        
        // Limpar efeitos
        this.effectSystem.activeEffects.delete(entity.id);
        
        // Notificar kill
        if (killer && killer.id !== entity.id) {
            this.notifyKill(killer, entity, source);
        }
        
        // Emitir evento de morte para outros módulos (loot)
        this.server.emit('mobDeath', {
            mob: entity,
            killer: killer,
            source: source
        });
    }
    
    /**
     * Update de combates ativos
     * @param {number} delta - Delta time
     */
    updateActiveCombats(delta) {
        const now = Date.now();
        
        for (const [combatId, combat] of this.combatSystem.activeCombats) {
            // Timeout de combate (30 segundos sem ação)
            if (now - combat.lastAction > 30000) {
                this.combatSystem.endCombat(combatId, null); // Empate
            }
        }
    }
    
    /**
     * Limpar combates expirados
     */
    cleanupExpiredCombats() {
        const now = Date.now();
        
        for (const [combatId, combat] of this.combatSystem.activeCombats) {
            if (combat.status === 'ended' && now - combat.endTime > 60000) {
                this.combatSystem.activeCombats.delete(combatId);
            }
        }
    }
    
    /**
     * Métodos utilitários
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
    
    calculateDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    findActiveCombat(attackerId, targetId) {
        for (const [combatId, combat] of this.combatSystem.activeCombats) {
            if ((combat.attacker.id === attackerId && combat.target.id === targetId) ||
                (combat.attacker.id === targetId && combat.target.id === attackerId)) {
                return combatId;
            }
        }
        return null;
    }
    
    getSkill(skillId) {
        // TODO: Implementar sistema de skills
        const skills = {
            'fireball': {
                id: 'fireball',
                name: 'Fireball',
                type: 'damage',
                damageType: 'fire',
                damageMultiplier: 2.0,
                manaCost: 20,
                cooldown: 3000
            },
            'heal': {
                id: 'heal',
                name: 'Heal',
                type: 'heal',
                healAmount: 50,
                manaCost: 15,
                cooldown: 2000
            },
            'power_attack': {
                id: 'power_attack',
                name: 'Power Attack',
                type: 'damage',
                damageMultiplier: 1.5,
                manaCost: 10,
                cooldown: 5000
            }
        };
        
        return skills[skillId];
    }
    
    isSkillOnCooldown(player, skillId) {
        if (!player.skillCooldowns) return false;
        const cooldownEnd = player.skillCooldowns[skillId];
        return cooldownEnd && Date.now() < cooldownEnd;
    }
    
    applySkillCooldown(player, skillId) {
        if (!player.skillCooldowns) player.skillCooldowns = {};
        
        const skill = this.getSkill(skillId);
        if (skill && skill.cooldown) {
            player.skillCooldowns[skillId] = Date.now() + skill.cooldown;
        }
    }
    
    // Métodos de notificação
    notifyDamage(attacker, target, damage, damageType) {
        // Notificar atacante
        const attackerSocket = this.server.getPlayerSocket(attacker.id);
        if (attackerSocket) {
            attackerSocket.emit('damageDealt', {
                targetId: target.id,
                damage: damage,
                damageType: damageType,
                targetHealth: target.health
            });
        }
        
        // Notificar alvo
        if (target.socket) {
            target.socket.emit('damageReceived', {
                attackerId: attacker.id,
                damage: damage,
                damageType: damageType,
                currentHealth: target.health
            });
        }
        
        // Notificar nearby players
        this.notifyNearbyPlayers(attacker, 'combatDamage', {
            attackerId: attacker.id,
            targetId: target.id,
            damage: damage
        });
    }
    
    notifyHeal(caster, target, healAmount) {
        const casterSocket = this.server.getPlayerSocket(caster.id);
        if (casterSocket) {
            casterSocket.emit('healPerformed', {
                targetId: target.id,
                healAmount: healAmount,
                targetHealth: target.health
            });
        }
        
        if (target.socket) {
            target.socket.emit('healReceived', {
                healerId: caster.id,
                healAmount: healAmount,
                currentHealth: target.health
            });
        }
    }
    
    notifyBuffApplied(caster, target, effect) {
        const casterSocket = this.server.getPlayerSocket(caster.id);
        if (casterSocket) {
            casterSocket.emit('buffApplied', {
                targetId: target.id,
                effect: effect
            });
        }
        
        if (target.socket) {
            target.socket.emit('buffReceived', {
                casterId: caster.id,
                effect: effect
            });
        }
    }
    
    notifyDebuffApplied(caster, target, effect) {
        const casterSocket = this.server.getPlayerSocket(caster.id);
        if (casterSocket) {
            casterSocket.emit('debuffApplied', {
                targetId: target.id,
                effect: effect
            });
        }
        
        if (target.socket) {
            target.socket.emit('debuffReceived', {
                casterId: caster.id,
                effect: effect
            });
        }
    }
    
    notifyKill(killer, victim, source) {
        const killerSocket = this.server.getPlayerSocket(killer.id);
        if (killerSocket) {
            killerSocket.emit('killPerformed', {
                victimId: victim.id,
                source: source
            });
        }
        
        this.notifyNearbyPlayers(killer, 'entityKilled', {
            killerId: killer.id,
            victimId: victim.id,
            source: source
        });
    }
    
    notifyCombatEnd(combat) {
        // Notificar participantes
        const attackerSocket = this.server.getPlayerSocket(combat.attacker.id);
        if (attackerSocket) {
            attackerSocket.emit('combatEnded', {
                combatId: combat.id,
                winner: combat.winner?.id,
                duration: combat.endTime - combat.startTime
            });
        }
        
        const targetSocket = this.server.getPlayerSocket(combat.target.id);
        if (targetSocket) {
            targetSocket.emit('combatEnded', {
                combatId: combat.id,
                winner: combat.winner?.id,
                duration: combat.endTime - combat.startTime
            });
        }
    }
    
    notifyNearbyPlayers(entity, event, data) {
        // TODO: Implementar notificação para players próximos
        // Usar spatial grid para encontrar players próximos
    }
    
    applyImmediateEffect(target, effect) {
        // Aplicar modificadores de stats imediatamente
        if (effect.type === 'buff' || effect.type === 'debuff') {
            if (!target.tempStats) target.tempStats = {};
            
            const currentValue = target[effect.stat] || 0;
            
            if (effect.multiplier) {
                target.tempStats[effect.stat] = currentValue * effect.value;
            } else {
                target.tempStats[effect.stat] = currentValue + effect.value;
            }
            
            target[effect.stat] = target.tempStats[effect.stat];
        }
    }
    
    removeEffectStats(targetId, effect) {
        const target = this.findTarget(targetId);
        if (!target || !target.tempStats) return;
        
        if (effect.type === 'buff' || effect.type === 'debuff') {
            const originalValue = target[effect.stat] || 0;
            
            if (effect.multiplier) {
                target[effect.stat] = originalValue / (1 + effect.value);
            } else {
                target[effect.stat] = originalValue - effect.value;
            }
            
            delete target.tempStats[effect.stat];
        }
    }
    
    processPeriodicEffect(targetId, effect) {
        // Processar efeitos como DoT (Damage over Time) ou HoT (Heal over Time)
        if (effect.type === 'dot' && effect.damagePerTick) {
            const target = this.findTarget(targetId);
            if (target && target.health > 0) {
                this.damageQueue.push({
                    attacker: { id: 'periodic_effect' },
                    target: target,
                    damage: effect.damagePerTick,
                    damageType: effect.damageType || 'poison',
                    source: effect.id
                });
            }
        }
        
        if (effect.type === 'hot' && effect.healPerTick) {
            const target = this.findTarget(targetId);
            if (target && target.health > 0) {
                target.health = Math.min(target.maxHealth, target.health + effect.healPerTick);
                this.notifyHeal({ id: 'periodic_effect' }, target, effect.healPerTick);
            }
        }
    }
    
    /**
     * Cleanup do módulo
     */
    cleanup() {
        console.log('🧹 Cleaning up CombatModule...');
        
        // Limpar combates ativos
        this.combatSystem.activeCombats.clear();
        
        // Limpar efeitos
        this.effectSystem.activeEffects.clear();
        
        // Limpar filas
        this.damageQueue = [];
        this.effectQueue = [];
        
        this.initialized = false;
        console.log('✅ CombatModule cleaned up');
    }
    
    /**
     * Obtém estatísticas do módulo
     */
    getStats() {
        return {
            name: this.name,
            initialized: this.initialized,
            activeCombats: this.combatSystem.activeCombats.size,
            damageQueueSize: this.damageQueue.length,
            effectQueueSize: this.effectQueue.length,
            activeEffects: this.effectSystem.activeEffects.size
        };
    }
}

module.exports = CombatModule;
