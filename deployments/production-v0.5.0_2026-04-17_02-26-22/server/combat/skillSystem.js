/**
 * Skill System - Combat Skills and Abilities
 * Handles skill definitions, casting, cooldowns, and effects
 * Version 0.3.2 - Character Progression Systems
 */

class SkillSystem {
    constructor(server) {
        this.server = server;
        
        // Skill database
        this.skills = new Map();
        this.skillTemplates = new Map();
        
        // Player skill states
        this.playerSkills = new Map(); // playerId -> skills
        this.playerCooldowns = new Map(); // playerId -> cooldowns
        this.activeEffects = new Map(); // playerId -> active effects
        
        // Configuration
        this.config = {
            maxSkillSlots: 6,
            baseManaRegen: 5, // per second
            globalCooldown: 1000, // ms
            effectUpdateInterval: 1000 // ms
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.loadSkillTemplates();
        this.setupEventHandlers();
        this.startEffectUpdateLoop();
        console.log('Skill System initialized');
    }
    
    loadSkillTemplates() {
        // Warrior Skills
        this.createSkillTemplate('power_strike', {
            name: 'Golpe Poderoso',
            description: 'Um ataque poderoso que causa dano aumentado.',
            type: 'active',
            class: 'warrior',
            levelRequirement: 1,
            damage: 1.5, // 150% weapon damage
            manaCost: 10,
            cooldown: 5000,
            castTime: 0,
            range: 50,
            icon: '⚔️',
            effects: []
        });
        
        this.createSkillTemplate('whirlwind', {
            name: 'Redemoinho',
            description: 'Ataca todos os inimigos próximos.',
            type: 'active',
            class: 'warrior',
            levelRequirement: 5,
            damage: 0.8, // 80% weapon damage to each target
            manaCost: 25,
            cooldown: 10000,
            castTime: 1000,
            range: 80,
            icon: '🌪️',
            effects: [],
            aoe: true
        });
        
        this.createSkillTemplate('battle_cry', {
            name: 'Grito de Batalha',
            description: 'Aumenta o ataque do jogador por 30 segundos.',
            type: 'active',
            class: 'warrior',
            levelRequirement: 10,
            damage: 0,
            manaCost: 20,
            cooldown: 30000,
            castTime: 500,
            range: 0,
            icon: '📢',
            effects: [
                { type: 'buff', stat: 'attack', value: 10, duration: 30000 }
            ]
        });
        
        // Mage Skills
        this.createSkillTemplate('fireball', {
            name: 'Bola de Fogo',
            description: 'Lança uma bola de fogo que causa dano mágico.',
            type: 'active',
            class: 'mage',
            levelRequirement: 1,
            damage: 2.0, // 200% magic damage
            manaCost: 15,
            cooldown: 3000,
            castTime: 1500,
            range: 150,
            icon: '🔥',
            effects: [
                { type: 'dot', damage: 5, duration: 5000, interval: 1000 }
            ],
            elementType: 'fire'
        });
        
        this.createSkillTemplate('frost_armor', {
            name: 'Armadura de Gelo',
            description: 'Aumenta a defesa e reduz dano recebido.',
            type: 'active',
            class: 'mage',
            levelRequirement: 3,
            damage: 0,
            manaCost: 30,
            cooldown: 45000,
            castTime: 2000,
            range: 0,
            icon: '❄️',
            effects: [
                { type: 'buff', stat: 'defense', value: 15, duration: 60000 },
                { type: 'buff', stat: 'damageReduction', value: 0.2, duration: 60000 }
            ]
        });
        
        this.createSkillTemplate('lightning_bolt', {
            name: 'Raio',
            description: 'Lança um raio poderoso com chance de atordoar.',
            type: 'active',
            class: 'mage',
            levelRequirement: 8,
            damage: 3.0, // 300% magic damage
            manaCost: 40,
            cooldown: 15000,
            castTime: 2000,
            range: 200,
            icon: '⚡',
            effects: [
                { type: 'stun', duration: 2000, chance: 0.3 }
            ],
            elementType: 'lightning'
        });
        
        // Rogue Skills
        this.createSkillTemplate('backstab', {
            name: 'Facada',
            description: 'Ataque furtivo com dano crítico aumentado.',
            type: 'active',
            class: 'rogue',
            levelRequirement: 1,
            damage: 2.5, // 250% weapon damage
            manaCost: 15,
            cooldown: 8000,
            castTime: 0,
            range: 30,
            icon: '🗡️',
            effects: [],
            criticalBonus: 0.5
        });
        
        this.createSkillTemplate('stealth', {
            name: 'Furtividade',
            description: 'Fica invisível por 10 segundos.',
            type: 'active',
            class: 'rogue',
            levelRequirement: 4,
            damage: 0,
            manaCost: 25,
            cooldown: 30000,
            castTime: 1000,
            range: 0,
            icon: '👤',
            effects: [
                { type: 'stealth', duration: 10000 }
            ]
        });
        
        this.createSkillTemplate('poison_blade', {
            name: 'Lâmina Envenenada',
            description: 'Aplica veneno na arma por 1 minuto.',
            type: 'active',
            class: 'rogue',
            levelRequirement: 7,
            damage: 1.2, // 120% weapon damage
            manaCost: 20,
            cooldown: 20000,
            castTime: 0,
            range: 50,
            icon: '🩸',
            effects: [
                { type: 'poison', damage: 8, duration: 10000, interval: 2000 }
            ]
        });
        
        // Passive Skills
        this.createSkillTemplate('weapon_mastery', {
            name: 'Maestria com Armas',
            description: 'Aumenta o dano de ataque em 10%.',
            type: 'passive',
            class: 'warrior',
            levelRequirement: 2,
            damage: 0,
            manaCost: 0,
            cooldown: 0,
            castTime: 0,
            range: 0,
            icon: '🎯',
            effects: [
                { type: 'passive', stat: 'attack', value: 0.1, multiplier: true }
            ]
        });
        
        this.createSkillTemplate('mana_efficiency', {
            name: 'Eficiência de Mana',
            description: 'Reduz o custo de mana em 20%.',
            type: 'passive',
            class: 'mage',
            levelRequirement: 2,
            damage: 0,
            manaCost: 0,
            cooldown: 0,
            castTime: 0,
            range: 0,
            icon: '💧',
            effects: [
                { type: 'passive', stat: 'manaCostReduction', value: 0.2 }
            ]
        });
        
        this.createSkillTemplate('critical_strike', {
            name: 'Golpe Crítico',
            description: 'Aumenta chance de acerto crítico em 5%.',
            type: 'passive',
            class: 'rogue',
            levelRequirement: 2,
            damage: 0,
            manaCost: 0,
            cooldown: 0,
            castTime: 0,
            range: 0,
            icon: '💥',
            effects: [
                { type: 'passive', stat: 'critChance', value: 0.05 }
            ]
        });
        
        console.log(`Loaded ${this.skillTemplates.size} skill templates`);
    }
    
    createSkillTemplate(id, template) {
        this.skillTemplates.set(id, {
            id,
            ...template,
            createdAt: Date.now()
        });
    }
    
    setupEventHandlers() {
        this.server.on('castSkill', (socket, data) => {
            this.handleCastSkill(socket, data);
        });
        
        this.server.on('learnSkill', (socket, data) => {
            this.handleLearnSkill(socket, data);
        });
        
        this.server.on('upgradeSkill', (socket, data) => {
            this.handleUpgradeSkill(socket, data);
        });
        
        this.server.on('requestSkills', (socket) => {
            this.handleRequestSkills(socket);
        });
        
        this.server.on('playerDisconnected', (playerId) => {
            this.handlePlayerDisconnected(playerId);
        });
    }
    
    handleCastSkill(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { skillId, targetId } = data;
        
        // Validate skill
        const skill = this.getSkill(skillId);
        if (!skill) {
            socket.emit('skillCastResult', { success: false, message: 'Habilidade não encontrada' });
            return;
        }
        
        // Check if player knows the skill
        if (!this.playerKnowsSkill(socket.playerId, skillId)) {
            socket.emit('skillCastResult', { success: false, message: 'Você não conhece esta habilidade' });
            return;
        }
        
        // Check level requirement
        if (player.level < skill.levelRequirement) {
            socket.emit('skillCastResult', { success: false, message: 'Nível insuficiente' });
            return;
        }
        
        // Check cooldown
        if (this.isOnCooldown(socket.playerId, skillId)) {
            socket.emit('skillCastResult', { success: false, message: 'Habilidade em recarga' });
            return;
        }
        
        // Check mana cost
        const manaCost = this.calculateManaCost(player, skill);
        if (player.mana < manaCost) {
            socket.emit('skillCastResult', { success: false, message: 'Mana insuficiente' });
            return;
        }
        
        // Check range
        if (targetId) {
            const target = this.getTarget(targetId);
            if (!target) {
                socket.emit('skillCastResult', { success: false, message: 'Alvo inválido' });
                return;
            }
            
            const distance = this.calculateDistance(player, target);
            if (distance > skill.range) {
                socket.emit('skillCastResult', { success: false, message: 'Alvo muito distante' });
                return;
            }
        }
        
        // Check if player can cast (not stunned, etc.)
        if (this.isSilenced(socket.playerId)) {
            socket.emit('skillCastResult', { success: false, message: 'Não pode usar habilidades' });
            return;
        }
        
        // Start casting
        this.startCasting(socket.playerId, skillId, targetId, manaCost);
    }
    
    startCasting(playerId, skillId, targetId, manaCost) {
        const player = this.server.players.get(playerId);
        const skill = this.getSkill(skillId);
        
        if (!player || !skill) return;
        
        // Consume mana
        player.mana -= manaCost;
        
        // Set casting state
        player.casting = {
            skillId: skillId,
            targetId: targetId,
            startTime: Date.now(),
            castTime: skill.castTime
        };
        
        // Notify clients
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('skillCastStart', {
                skillId: skillId,
                castTime: skill.castTime,
                targetId: targetId
            });
        }
        
        // Broadcast casting to nearby players
        this.broadcastSkillCast(playerId, skillId, targetId, 'start');
        
        // Execute skill after cast time
        if (skill.castTime > 0) {
            setTimeout(() => {
                this.executeSkill(playerId, skillId, targetId);
            }, skill.castTime);
        } else {
            this.executeSkill(playerId, skillId, targetId);
        }
    }
    
    executeSkill(playerId, skillId, targetId) {
        const player = this.server.players.get(playerId);
        const skill = this.getSkill(skillId);
        
        if (!player || !skill) return;
        
        // Clear casting state
        player.casting = null;
        
        // Set cooldown
        this.setCooldown(playerId, skillId, skill.cooldown);
        
        // Apply global cooldown
        this.setGlobalCooldown(playerId);
        
        // Execute skill effects
        const results = this.applySkillEffects(player, skill, targetId);
        
        // Notify clients
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('skillCastResult', {
                success: true,
                skillId: skillId,
                results: results
            });
        }
        
        // Broadcast to nearby players
        this.broadcastSkillCast(playerId, skillId, targetId, 'execute', results);
        
        console.log(`Player ${player.name} cast skill ${skill.name}`);
    }
    
    applySkillEffects(caster, skill, targetId) {
        const results = {
            damage: 0,
            targets: [],
            effects: []
        };
        
        if (skill.type === 'passive') {
            // Passive skills don't need execution
            return results;
        }
        
        // Get targets
        const targets = this.getSkillTargets(caster, skill, targetId);
        
        for (const target of targets) {
            const targetResult = {
                id: target.id,
                damage: 0,
                effects: [],
                hit: false
            };
            
            // Calculate damage
            if (skill.damage > 0) {
                const damage = this.calculateSkillDamage(caster, target, skill);
                this.applyDamage(target, damage);
                targetResult.damage = damage;
                targetResult.hit = true;
                results.damage += damage;
            }
            
            // Apply effects
            if (skill.effects && skill.effects.length > 0) {
                for (const effect of skill.effects) {
                    this.applyEffect(target, effect, caster);
                    targetResult.effects.push(effect.type);
                    results.effects.push(effect.type);
                }
            }
            
            results.targets.push(targetResult);
        }
        
        return results;
    }
    
    getSkillTargets(caster, skill, targetId) {
        const targets = [];
        
        if (skill.aoe) {
            // Area of effect - get all targets in range
            const centerX = targetId ? this.getTarget(targetId)?.x || caster.x : caster.x;
            const centerY = targetId ? this.getTarget(targetId)?.y || caster.y : caster.y;
            
            for (const [entityId, entity] of this.server.players) {
                if (entityId === caster.id) continue;
                
                const distance = this.calculateDistance(
                    { x: centerX, y: centerY },
                    { x: entity.x, y: entity.y }
                );
                
                if (distance <= skill.range) {
                    targets.push(entity);
                }
            }
            
            // Add mobs in range
            if (this.server.systems && this.server.systems.spawnSystem) {
                for (const mob of this.server.systems.spawnSystem.getMobs()) {
                    const distance = this.calculateDistance(
                        { x: centerX, y: centerY },
                        { x: mob.x, y: mob.y }
                    );
                    
                    if (distance <= skill.range) {
                        targets.push(mob);
                    }
                }
            }
        } else if (targetId) {
            // Single target
            const target = this.getTarget(targetId);
            if (target) {
                targets.push(target);
            }
        } else if (skill.range === 0) {
            // Self-cast
            targets.push(caster);
        }
        
        return targets;
    }
    
    calculateSkillDamage(caster, target, skill) {
        let baseDamage = 0;
        
        // Calculate base damage based on skill type
        if (skill.damage > 0) {
            if (skill.elementType) {
                // Magic damage
                baseDamage = (caster.magicAttack || caster.attack || 10) * skill.damage;
            } else {
                // Physical damage
                baseDamage = (caster.attack || 10) * skill.damage;
            }
        }
        
        // Apply level scaling
        const levelMultiplier = Math.pow(1.05, caster.level - 1);
        baseDamage *= levelMultiplier;
        
        // Apply target defense
        const defense = target.defense || 5;
        const damageReduction = defense * 0.5;
        baseDamage = Math.max(1, baseDamage - damageReduction);
        
        // Apply damage variance
        const variance = 1 + (Math.random() - 0.5) * 0.2; // ±10%
        baseDamage *= variance;
        
        // Check for critical hit
        let isCritical = false;
        const critChance = caster.critChance || 0.05;
        if (Math.random() < critChance) {
            baseDamage *= 2;
            isCritical = true;
        }
        
        // Apply skill-specific critical bonus
        if (skill.criticalBonus && isCritical) {
            baseDamage *= (1 + skill.criticalBonus);
        }
        
        // Apply elemental effectiveness (simplified)
        if (skill.elementType) {
            baseDamage *= this.getElementalMultiplier(skill.elementType, target);
        }
        
        return Math.floor(baseDamage);
    }
    
    getElementalMultiplier(element, target) {
        // Simplified elemental system
        const weaknesses = {
            fire: { ice: 1.5, nature: 0.8 },
            ice: { fire: 0.8, lightning: 1.3 },
            lightning: { earth: 1.5, water: 0.8 },
            poison: { nature: 1.2 }
        };
        
        const elementWeaknesses = weaknesses[element];
        if (!elementWeaknesses) return 1.0;
        
        // This would be expanded based on target's elemental properties
        return 1.0;
    }
    
    applyEffect(target, effect, caster) {
        if (!this.activeEffects.has(target.id)) {
            this.activeEffects.set(target.id, new Map());
        }
        
        const targetEffects = this.activeEffects.get(target.id);
        
        switch (effect.type) {
            case 'buff':
                this.applyBuff(target, effect);
                break;
            case 'debuff':
                this.applyDebuff(target, effect);
                break;
            case 'dot':
                this.applyDamageOverTime(target, effect);
                break;
            case 'hot':
                this.applyHealOverTime(target, effect);
                break;
            case 'stun':
                this.applyStun(target, effect);
                break;
            case 'stealth':
                this.applyStealth(target, effect);
                break;
            case 'poison':
                this.applyPoison(target, effect);
                break;
        }
        
        // Store effect for tracking
        const effectId = `${effect.type}_${Date.now()}`;
        targetEffects.set(effectId, {
            ...effect,
            startTime: Date.now(),
            caster: caster.id
        });
    }
    
    applyBuff(target, effect) {
        if (!target.buffs) target.buffs = new Map();
        
        const existingBuff = target.buffs.get(effect.stat);
        if (existingBuff) {
            // Refresh duration
            existingBuff.endTime = Date.now() + effect.duration;
        } else {
            // Apply new buff
            target.buffs.set(effect.stat, {
                value: effect.value,
                endTime: Date.now() + effect.duration,
                multiplier: effect.multiplier || false
            });
            
            // Apply stat change immediately
            if (effect.multiplier) {
                target[effect.stat] = (target[effect.stat] || 0) * (1 + effect.value);
            } else {
                target[effect.stat] = (target[effect.stat] || 0) + effect.value;
            }
        }
    }
    
    applyDebuff(target, effect) {
        if (!target.debuffs) target.debuffs = new Map();
        
        const existingDebuff = target.debuffs.get(effect.stat);
        if (existingDebuff) {
            existingDebuff.endTime = Date.now() + effect.duration;
        } else {
            target.debuffs.set(effect.stat, {
                value: effect.value,
                endTime: Date.now() + effect.duration,
                multiplier: effect.multiplier || false
            });
            
            // Apply stat change immediately
            if (effect.multiplier) {
                target[effect.stat] = (target[effect.stat] || 0) * (1 - effect.value);
            } else {
                target[effect.stat] = (target[effect.stat] || 0) - effect.value;
            }
        }
    }
    
    applyDamageOverTime(target, effect) {
        if (!target.dots) target.dots = new Map();
        
        const dotId = `dot_${Date.now()}`;
        target.dots.set(dotId, {
            damage: effect.damage,
            interval: effect.interval || 1000,
            lastTick: Date.now(),
            endTime: Date.now() + effect.duration
        });
    }
    
    applyHealOverTime(target, effect) {
        if (!target.hots) target.hots = new Map();
        
        const hotId = `hot_${Date.now()}`;
        target.hots.set(hotId, {
            healing: effect.healing,
            interval: effect.interval || 1000,
            lastTick: Date.now(),
            endTime: Date.now() + effect.duration
        });
    }
    
    applyStun(target, effect) {
        if (Math.random() < (effect.chance || 1.0)) {
            target.stunned = true;
            target.stunEndTime = Date.now() + effect.duration;
        }
    }
    
    applyStealth(target, effect) {
        target.stealthed = true;
        target.stealthEndTime = Date.now() + effect.duration;
    }
    
    applyPoison(target, effect) {
        this.applyDamageOverTime(target, effect);
    }
    
    applyDamage(target, damage) {
        target.health = Math.max(0, target.health - damage);
        
        // Check if target died
        if (target.health <= 0) {
            this.handleDeath(target);
        }
    }
    
    handleDeath(target) {
        // Clear all effects
        this.activeEffects.delete(target.id);
        
        // Handle mob death
        if (target.type === 'mob') {
            this.server.emit('mobDeath', target.id, 'skill');
        }
        // Handle player death
        else if (target.type === 'player') {
            this.server.emit('playerDeath', target.id);
        }
    }
    
    calculateManaCost(player, skill) {
        let cost = skill.manaCost;
        
        // Apply mana cost reduction buffs
        if (player.buffs && player.buffs.has('manaCostReduction')) {
            const reduction = player.buffs.get('manaCostReduction').value;
            cost *= (1 - reduction);
        }
        
        return Math.floor(cost);
    }
    
    calculateDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getTarget(targetId) {
        // Check players
        const player = this.server.players.get(targetId);
        if (player) return player;
        
        // Check mobs
        if (this.server.systems && this.server.systems.spawnSystem) {
            const mob = this.server.systems.spawnSystem.getMob(targetId);
            if (mob) return mob;
        }
        
        return null;
    }
    
    setCooldown(playerId, skillId, cooldown) {
        if (!this.playerCooldowns.has(playerId)) {
            this.playerCooldowns.set(playerId, new Map());
        }
        
        const playerCooldowns = this.playerCooldowns.get(playerId);
        playerCooldowns.set(skillId, Date.now() + cooldown);
    }
    
    setGlobalCooldown(playerId) {
        this.setCooldown(playerId, 'global', this.config.globalCooldown);
    }
    
    isOnCooldown(playerId, skillId) {
        const playerCooldowns = this.playerCooldowns.get(playerId);
        if (!playerCooldowns) return false;
        
        const cooldownEnd = playerCooldowns.get(skillId);
        if (!cooldownEnd) return false;
        
        return Date.now() < cooldownEnd;
    }
    
    isSilenced(playerId) {
        const effects = this.activeEffects.get(playerId);
        if (!effects) return false;
        
        for (const [effectId, effect] of effects) {
            if (effect.type === 'silence' && Date.now() < effect.startTime + effect.duration) {
                return true;
            }
        }
        
        return false;
    }
    
    playerKnowsSkill(playerId, skillId) {
        const playerSkills = this.playerSkills.get(playerId);
        if (!playerSkills) return false;
        
        return playerSkills.has(skillId);
    }
    
    getSkill(skillId) {
        return this.skillTemplates.get(skillId);
    }
    
    startEffectUpdateLoop() {
        setInterval(() => {
            this.updateActiveEffects();
            this.updateCooldowns();
            this.regenerateMana();
        }, this.config.effectUpdateInterval);
    }
    
    updateActiveEffects() {
        const now = Date.now();
        
        for (const [targetId, effects] of this.activeEffects) {
            const target = this.getTarget(targetId);
            if (!target) {
                this.activeEffects.delete(targetId);
                continue;
            }
            
            // Update buffs/debuffs
            this.updateBuffs(target, now);
            this.updateDebuffs(target, now);
            
            // Update DoTs
            this.updateDamageOverTime(target, now);
            
            // Update HoTs
            this.updateHealOverTime(target, now);
            
            // Update status effects
            this.updateStatusEffects(target, now);
            
            // Remove expired effects
            for (const [effectId, effect] of effects) {
                if (now >= effect.startTime + effect.duration) {
                    effects.delete(effectId);
                }
            }
            
            if (effects.size === 0) {
                this.activeEffects.delete(targetId);
            }
        }
    }
    
    updateBuffs(target, now) {
        if (!target.buffs) return;
        
        for (const [stat, buff] of target.buffs) {
            if (now >= buff.endTime) {
                // Remove buff
                target.buffs.delete(stat);
                
                // Revert stat change
                if (buff.multiplier) {
                    target[stat] = target[stat] / (1 + buff.value);
                } else {
                    target[stat] = target[stat] - buff.value;
                }
            }
        }
    }
    
    updateDebuffs(target, now) {
        if (!target.debuffs) return;
        
        for (const [stat, debuff] of target.debuffs) {
            if (now >= debuff.endTime) {
                // Remove debuff
                target.debuffs.delete(stat);
                
                // Revert stat change
                if (debuff.multiplier) {
                    target[stat] = target[stat] / (1 - debuff.value);
                } else {
                    target[stat] = target[stat] + debuff.value;
                }
            }
        }
    }
    
    updateDamageOverTime(target, now) {
        if (!target.dots) return;
        
        for (const [dotId, dot] of target.dots) {
            if (now >= dot.endTime) {
                target.dots.delete(dotId);
                continue;
            }
            
            if (now >= dot.lastTick + dot.interval) {
                this.applyDamage(target, dot.damage);
                dot.lastTick = now;
            }
        }
    }
    
    updateHealOverTime(target, now) {
        if (!target.hots) return;
        
        for (const [hotId, hot] of target.hots) {
            if (now >= hot.endTime) {
                target.hots.delete(hotId);
                continue;
            }
            
            if (now >= hot.lastTick + hot.interval) {
                target.health = Math.min(target.health + hot.healing, target.maxHealth);
                hot.lastTick = now;
            }
        }
    }
    
    updateStatusEffects(target, now) {
        // Update stun
        if (target.stunned && now >= target.stunEndTime) {
            target.stunned = false;
        }
        
        // Update stealth
        if (target.stealthed && now >= target.stealthEndTime) {
            target.stealthed = false;
        }
    }
    
    updateCooldowns() {
        const now = Date.now();
        
        for (const [playerId, cooldowns] of this.playerCooldowns) {
            for (const [skillId, endTime] of cooldowns) {
                if (now >= endTime) {
                    cooldowns.delete(skillId);
                }
            }
            
            if (cooldowns.size === 0) {
                this.playerCooldowns.delete(playerId);
            }
        }
    }
    
    regenerateMana() {
        for (const [playerId, player] of this.server.players) {
            if (player.health <= 0) continue;
            
            const manaRegen = this.config.baseManaRegen;
            player.mana = Math.min(player.mana + manaRegen, player.maxMana);
        }
    }
    
    broadcastSkillCast(playerId, skillId, targetId, phase, results = null) {
        const skill = this.getSkill(skillId);
        const player = this.server.players.get(playerId);
        
        if (!skill || !player) return;
        
        const nearbyPlayers = this.getNearbyPlayers(player.x, player.y, 300);
        
        for (const nearbyPlayerId of nearbyPlayers) {
            if (nearbyPlayerId === playerId) continue;
            
            const socket = this.server.getPlayerSocket(nearbyPlayerId);
            if (socket) {
                socket.emit('skillCast', {
                    casterId: playerId,
                    skillId: skillId,
                    targetId: targetId,
                    phase: phase,
                    results: results
                });
            }
        }
    }
    
    getNearbyPlayers(x, y, range) {
        const nearby = [];
        
        for (const [playerId, player] of this.server.players) {
            if (!player.name) continue;
            
            const distance = Math.sqrt(
                Math.pow(x - player.x, 2) + 
                Math.pow(y - player.y, 2)
            );
            
            if (distance <= range) {
                nearby.push(playerId);
            }
        }
        
        return nearby;
    }
    
    handleLearnSkill(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { skillId } = data;
        const skill = this.getSkill(skillId);
        
        if (!skill) {
            socket.emit('skillLearnResult', { success: false, message: 'Habilidade não encontrada' });
            return;
        }
        
        // Check requirements
        if (player.level < skill.levelRequirement) {
            socket.emit('skillLearnResult', { success: false, message: 'Nível insuficiente' });
            return;
        }
        
        // Check class requirement
        if (skill.class && skill.class !== player.class) {
            socket.emit('skillLearnResult', { success: false, message: 'Classe incompatível' });
            return;
        }
        
        // Add skill to player
        if (!this.playerSkills.has(socket.playerId)) {
            this.playerSkills.set(socket.playerId, new Map());
        }
        
        const playerSkills = this.playerSkills.get(socket.playerId);
        playerSkills.set(skillId, { level: 1, learnedAt: Date.now() });
        
        // Save to database
        this.savePlayerSkills(socket.playerId);
        
        socket.emit('skillLearnResult', { success: true, skillId: skillId });
        socket.emit('skillsUpdate', this.getPlayerSkills(socket.playerId));
    }
    
    handleUpgradeSkill(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { skillId } = data;
        
        // Implementation for skill upgrading
        socket.emit('skillUpgradeResult', { success: false, message: 'Não implementado ainda' });
    }
    
    handleRequestSkills(socket) {
        const skills = this.getPlayerSkills(socket.playerId);
        socket.emit('skillsUpdate', skills);
    }
    
    handlePlayerDisconnected(playerId) {
        // Clean up player data
        this.playerSkills.delete(playerId);
        this.playerCooldowns.delete(playerId);
        this.activeEffects.delete(playerId);
    }
    
    getPlayerSkills(playerId) {
        const playerSkills = this.playerSkills.get(playerId);
        if (!playerSkills) return {};
        
        const skills = {};
        for (const [skillId, data] of playerSkills) {
            const template = this.getSkill(skillId);
            if (template) {
                skills[skillId] = {
                    ...template,
                    level: data.level,
                    learnedAt: data.learnedAt
                };
            }
        }
        
        return skills;
    }
    
    getPlayerCooldowns(playerId) {
        const cooldowns = this.playerCooldowns.get(playerId);
        if (!cooldowns) return {};
        
        const result = {};
        const now = Date.now();
        
        for (const [skillId, endTime] of cooldowns) {
            const remaining = Math.max(0, endTime - now);
            if (remaining > 0) {
                result[skillId] = remaining;
            }
        }
        
        return result;
    }
    
    // Database operations
    async savePlayerSkills(playerId) {
        const playerSkills = this.playerSkills.get(playerId);
        if (!playerSkills) return;
        
        try {
            const skillsJson = JSON.stringify(Object.fromEntries(playerSkills));
            await this.server.database.run(
                'UPDATE characters SET skills = ? WHERE player_id = ?',
                [skillsJson, playerId]
            );
        } catch (error) {
            console.error('Error saving player skills:', error);
        }
    }
    
    async loadPlayerSkills(playerId) {
        try {
            const row = await this.server.database.get(
                'SELECT skills FROM characters WHERE player_id = ?',
                [playerId]
            );
            
            if (row && row.skills) {
                const skillsData = JSON.parse(row.skills);
                const skillsMap = new Map();
                
                for (const [skillId, data] of Object.entries(skillsData)) {
                    skillsMap.set(skillId, data);
                }
                
                return skillsMap;
            }
        } catch (error) {
            console.error('Error loading player skills:', error);
        }
        
        return new Map();
    }
    
    // Public API
    getAllSkills() {
        return Array.from(this.skillTemplates.values());
    }
    
    getSkillsByClass(className) {
        return Array.from(this.skillTemplates.values()).filter(skill => 
            !skill.class || skill.class === className
        );
    }
    
    getSkillsByType(type) {
        return Array.from(this.skillTemplates.values()).filter(skill => 
            skill.type === type
        );
    }
    
    // Cleanup
    cleanup() {
        this.skills.clear();
        this.skillTemplates.clear();
        this.playerSkills.clear();
        this.playerCooldowns.clear();
        this.activeEffects.clear();
        console.log('Skill System cleanup complete');
    }
}

module.exports = SkillSystem;
