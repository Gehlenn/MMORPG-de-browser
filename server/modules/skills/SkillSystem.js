/**
 * SkillSystem - Sistema de Skills
 * Gerencia uso, validação e execução de skills
 */

const { getSkill, canUseSkill } = require('./SkillDatabase');

class SkillSystem {
    constructor() {
        this.name = 'SkillSystem';
        
        // Configurações
        this.config = {
            maxCooldowns: 20,      // Máximo de cooldowns ativos
            skillFailPenalty: 1000 // Penalidade por tentativa falha
        };
        
        console.log('⚔️ SkillSystem created');
    }
    
    /**
     * Usa uma skill
     * @param {object} player - Dados do jogador
     * @param {string} skillName - Nome da skill
     * @param {object} target - Alvo da skill
     * @param {object} options - Opções adicionais
     * @returns {object} - Resultado da skill
     */
    useSkill(player, skillName, target, options = {}) {
        const skill = getSkill(skillName);
        if (!skill) {
            return { success: false, error: 'Skill not found' };
        }
        
        // Verificar se pode usar skill
        const canUse = this.canUseSkill(player, skill);
        if (!canUse.success) {
            return canUse;
        }
        
        // Verificar mana
        if (skill.manaCost > 0) {
            if (!player.mana || player.mana < skill.manaCost) {
                return { success: false, error: 'Not enough mana' };
            }
            
            // Consumir mana
            player.mana -= skill.manaCost;
        }
        
        // Verificar range
        if (target && skill.range > 0) {
            const distance = this.calculateDistance(player, target);
            if (distance > skill.range) {
                return { success: false, error: 'Target out of range' };
            }
        }
        
        // Executar skill baseada no tipo
        const result = this.executeSkill(player, skill, target, options);
        
        if (result.success) {
            // Aplicar cooldown
            this.applyCooldown(player, skill);
            
            // Notificar sucesso
            console.log(`⚔️ ${player.name} used ${skill.name} on ${target?.name || 'self'}`);
        }
        
        return result;
    }
    
    /**
     * Verifica se jogador pode usar skill
     * @param {object} player - Dados do jogador
     * @param {object} skill - Dados da skill
     * @returns {object} - Resultado da verificação
     */
    canUseSkill(player, skill) {
        // Verificar requisitos de classe/nível
        if (!canUseSkill(player, skill)) {
            return { success: false, error: 'Cannot use this skill' };
        }
        
        // Verificar cooldown
        if (!player.cooldowns) player.cooldowns = {};
        
        const cooldown = player.cooldowns[skill.id];
        if (cooldown && Date.now() < cooldown) {
            const remainingTime = Math.ceil((cooldown - Date.now()) / 1000);
            return { 
                success: false, 
                error: `Skill on cooldown (${remainingTime}s remaining)` 
            };
        }
        
        // Verificar se está em estado válido
        if (player.stunned || player.silenced) {
            return { success: false, error: 'Cannot use skills while stunned/silenced' };
        }
        
        return { success: true };
    }
    
    /**
     * Executa a skill baseada no tipo
     * @param {object} player - Dados do jogador
     * @param {object} skill - Dados da skill
     * @param {object} target - Alvo da skill
     * @param {object} options - Opções adicionais
     * @returns {object} - Resultado da execução
     */
    executeSkill(player, skill, target, options) {
        try {
            switch (skill.type) {
                case 'attack':
                    return this.executeAttackSkill(player, skill, target);
                case 'magic':
                    return this.executeMagicSkill(player, skill, target);
                case 'heal':
                    return this.executeHealSkill(player, skill, target);
                case 'buff':
                    return this.executeBuffSkill(player, skill, target);
                case 'summon':
                    return this.executeSummonSkill(player, skill, target);
                case 'transform':
                    return this.executeTransformSkill(player, skill, target);
                default:
                    return { success: false, error: 'Unknown skill type' };
            }
        } catch (error) {
            console.error(`❌ Error executing skill ${skill.name}:`, error);
            return { success: false, error: 'Skill execution failed' };
        }
    }
    
    /**
     * Executa skill de ataque
     * @param {object} player - Dados do jogador
     * @param {object} skill - Dados da skill
     * @param {object} target - Alvo da skill
     * @returns {object} - Resultado
     */
    executeAttackSkill(player, skill, target) {
        if (!target) {
            return { success: false, error: 'No target' };
        }
        
        // Calcular dano
        let damage = skill.damage || 0;
        
        // Adicionar bônus do jogador
        if (player.attack) {
            damage += player.attack;
        }
        
        // Adicionar bônus de equipamentos
        if (player.totalStats && player.totalStats.attack) {
            damage += player.totalStats.attack;
        }
        
        // Verificar se é ataque crítico
        const critChance = (player.totalStats?.critChance || 0.05);
        const isCritical = Math.random() < critChance;
        
        if (isCritical) {
            damage = Math.floor(damage * (player.totalStats?.critDamage || 1.5));
        }
        
        // Aplicar dano ao alvo
        if (target.hp !== undefined) {
            target.hp = Math.max(0, target.hp - damage);
        }
        
        // Aplicar efeitos
        this.applySkillEffects(player, target, skill);
        
        return {
            success: true,
            damage: damage,
            critical: isCritical,
            targetHp: target.hp,
            effects: skill.effects
        };
    }
    
    /**
     * Executa skill mágica
     * @param {object} player - Dados do jogador
     * @param {object} skill - Dados da skill
     * @param {object} target - Alvo da skill
     * @returns {object} - Resultado
     */
    executeMagicSkill(player, skill, target) {
        if (!target && skill.subtype !== 'self') {
            return { success: false, error: 'No target' };
        }
        
        // Calcular dano mágico
        let damage = skill.damage || 0;
        
        // Adicionar bônus mágico do jogador
        if (player.magic) {
            damage += player.magic;
        }
        
        // Adicionar bônus de equipamentos
        if (player.totalStats && player.totalStats.magic) {
            damage += player.totalStats.magic;
        }
        
        // Skills mágicas sempre têm chance de crítico menor
        const critChance = (player.totalStats?.critChance || 0.05) * 0.5;
        const isCritical = Math.random() < critChance;
        
        if (isCritical) {
            damage = Math.floor(damage * 1.3);
        }
        
        // Aplicar dano ao alvo
        if (target && target.hp !== undefined) {
            target.hp = Math.max(0, target.hp - damage);
        }
        
        // Aplicar efeitos
        this.applySkillEffects(player, target, skill);
        
        return {
            success: true,
            damage: damage,
            critical: isCritical,
            targetHp: target ? target.hp : 0,
            effects: skill.effects
        };
    }
    
    /**
     * Executa skill de cura
     * @param {object} player - Dados do jogador
     * @param {object} skill - Dados da skill
     * @param {object} target - Alvo da skill
     * @returns {object} - Resultado
     */
    executeHealSkill(player, skill, target) {
        if (!target) {
            return { success: false, error: 'No target' };
        }
        
        // Calcular cura (dano negativo = cura)
        let healAmount = Math.abs(skill.damage || 0);
        
        // Adicionar bônus mágico à cura
        if (player.magic) {
            healAmount += Math.floor(player.magic * 0.5);
        }
        
        // Adicionar bônus de equipamentos
        if (player.totalStats && player.totalStats.magic) {
            healAmount += Math.floor(player.totalStats.magic * 0.3);
        }
        
        // Aplicar cura ao alvo
        if (target.hp !== undefined && target.maxHp !== undefined) {
            const actualHeal = Math.min(healAmount, target.maxHp - target.hp);
            target.hp = Math.min(target.maxHp, target.hp + healAmount);
            
            // Aplicar efeitos
            this.applySkillEffects(player, target, skill);
            
            return {
                success: true,
                healAmount: actualHeal,
                targetHp: target.hp,
                effects: skill.effects
            };
        }
        
        return { success: false, error: 'Invalid target for heal' };
    }
    
    /**
     * Executa skill de buff
     * @param {object} player - Dados do jogador
     * @param {object} skill - Dados da skill
     * @param {object} target - Alvo da skill
     * @returns {object} - Resultado
     */
    executeBuffSkill(player, skill, target) {
        const buffTarget = target || player;
        
        if (!buffTarget.buffs) {
            buffTarget.buffs = new Map();
        }
        
        // Criar buff
        const buff = {
            id: `buff_${skill.id}`,
            name: skill.name,
            duration: skill.duration || 10000,
            startTime: Date.now(),
            effects: skill.effects,
            source: player.id
        };
        
        // Aplicar buff
        buffTarget.buffs.set(buff.id, buff);
        
        // Aplicar efeitos imediatos
        this.applySkillEffects(player, buffTarget, skill);
        
        return {
            success: true,
            buff: buff,
            targetName: buffTarget.name,
            effects: skill.effects
        };
    }
    
    /**
     * Executa skill de summon
     * @param {object} player - Dados do jogador
     * @param {object} skill - Dados da skill
     * @param {object} target - Alvo da skill
     * @returns {object} - Resultado
     */
    executeSummonSkill(player, skill, target) {
        // TODO: Implementar sistema de pets/summons
        console.log(`🐾 ${player.name} summoned pet with ${skill.name}`);
        
        return {
            success: true,
            petType: skill.effects[0],
            duration: skill.duration
        };
    }
    
    /**
     * Executa skill de transformação
     * @param {object} player - Dados do jogador
     * @param {object} skill - Dados da skill
     * @param {object} target - Alvo da skill
     * @returns {object} - Resultado
     */
    executeTransformSkill(player, skill, target) {
        const transformTarget = target || player;
        
        if (!transformTarget.transformations) {
            transformTarget.transformations = new Map();
        }
        
        // Criar transformação
        const transformation = {
            id: `transform_${skill.id}`,
            name: skill.name,
            duration: skill.duration || 30000,
            startTime: Date.now(),
            effects: skill.effects,
            source: player.id
        };
        
        // Aplicar transformação
        transformTarget.transformations.set(transformation.id, transformation);
        
        // Aplicar efeitos imediatos
        this.applySkillEffects(player, transformTarget, skill);
        
        return {
            success: true,
            transformation: transformation,
            targetName: transformTarget.name,
            effects: skill.effects
        };
    }
    
    /**
     * Aplica efeitos da skill
     * @param {object} player - Dados do jogador
     * @param {object} target - Alvo da skill
     * @param {object} skill - Dados da skill
     */
    applySkillEffects(player, target, skill) {
        if (!skill.effects || !target) return;
        
        for (const effect of skill.effects) {
            this.applyEffect(player, target, effect);
        }
    }
    
    /**
     * Aplica um efeito específico
     * @param {object} player - Dados do jogador
     * @param {object} target - Alvo da skill
     * @param {string} effect - Efeito a aplicar
     */
    applyEffect(player, target, effect) {
        // Parse effect: "type_value_duration" ou "type_value"
        const parts = effect.split('_');
        const effectType = parts[0];
        const value = parseFloat(parts[1]) || 0;
        const duration = parseFloat(parts[2]) || 0;
        
        if (!target.activeEffects) {
            target.activeEffects = new Map();
        }
        
        switch (effectType) {
            case 'stun':
                target.stunned = true;
                target.stunEndTime = Date.now() + value * 1000;
                break;
                
            case 'slow':
                target.speed = (target.speed || 10) * (1 - value / 100);
                target.slowEndTime = Date.now() + duration * 1000;
                break;
                
            case 'burn':
            case 'poison':
                // Damage over time
                const dotEffect = {
                    type: effectType,
                    damage: value,
                    interval: 1000,
                    duration: duration * 1000,
                    lastTick: Date.now(),
                    source: player.id
                };
                target.activeEffects.set(`dot_${effectType}`, dotEffect);
                break;
                
            case 'hot':
                // Heal over time
                const hotEffect = {
                    type: 'hot',
                    heal: value,
                    interval: 1000,
                    duration: duration * 1000,
                    lastTick: Date.now(),
                    source: player.id
                };
                target.activeEffects.set('hot', hotEffect);
                break;
                
            case 'defense':
                target.defense = (target.defense || 5) + value;
                break;
                
            case 'attack_speed':
                target.attackSpeed = (target.attackSpeed || 1) * (1 + value / 100);
                break;
                
            case 'shield':
                target.shield = (target.shield || 0) + value;
                break;
                
            case 'health':
                target.maxHp = (target.maxHp || 100) + value;
                target.hp = (target.hp || target.maxHp) + value;
                break;
                
            case 'armor':
                target.defense = (target.defense || 5) + value;
                break;
                
            default:
                console.log(`⚠️ Unknown effect type: ${effectType}`);
        }
    }
    
    /**
     * Aplica cooldown de skill
     * @param {object} player - Dados do jogador
     * @param {object} skill - Dados da skill
     */
    applyCooldown(player, skill) {
        if (!player.cooldowns) {
            player.cooldowns = {};
        }
        
        const cooldownEnd = Date.now() + skill.cooldown;
        player.cooldowns[skill.id] = cooldownEnd;
        
        // Limitar número de cooldowns
        const cooldownCount = Object.keys(player.cooldowns).length;
        if (cooldownCount > this.config.maxCooldowns) {
            // Remover cooldowns expirados
            this.cleanupExpiredCooldowns(player);
        }
    }
    
    /**
     * Limpa cooldowns expirados
     * @param {object} player - Dados do jogador
     */
    cleanupExpiredCooldowns(player) {
        if (!player.cooldowns) return;
        
        const now = Date.now();
        const expiredCooldowns = [];
        
        for (const [skillId, cooldownEnd] of Object.entries(player.cooldowns)) {
            if (now >= cooldownEnd) {
                expiredCooldowns.push(skillId);
            }
        }
        
        for (const skillId of expiredCooldowns) {
            delete player.cooldowns[skillId];
        }
    }
    
    /**
     * Obtém cooldowns ativos de um jogador
     * @param {object} player - Dados do jogador
     * @returns {object} - Cooldowns ativos
     */
    getActiveCooldowns(player) {
        if (!player.cooldowns) return {};
        
        const now = Date.now();
        const activeCooldowns = {};
        
        for (const [skillId, cooldownEnd] of Object.entries(player.cooldowns)) {
            if (now < cooldownEnd) {
                const skill = getSkill(skillId);
                const remainingTime = Math.ceil((cooldownEnd - now) / 1000);
                
                activeCooldowns[skillId] = {
                    skillName: skill?.name || skillId,
                    remainingTime: remainingTime,
                    maxCooldown: skill?.cooldown || 0
                };
            }
        }
        
        return activeCooldowns;
    }
    
    /**
     * Calcula distância entre duas entidades
     * @param {object} entity1 - Entidade 1
     * @param {object} entity2 - Entidade 2
     * @returns {number} - Distância
     */
    calculateDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Obtém skills disponíveis para um jogador
     * @param {object} player - Dados do jogador
     * @returns {array} - Skills disponíveis
     */
    getAvailableSkills(player) {
        const { getSkillsByClassAndLevel } = require('./SkillDatabase');
        return getSkillsByClassAndLevel(player.class, player.level);
    }
    
    /**
     * Obtém informações de skill
     * @param {string} skillId - ID da skill
     * @returns {object} - Informações da skill
     */
    getSkillInfo(skillId) {
        const skill = getSkill(skillId);
        if (!skill) return null;
        
        return {
            id: skill.id,
            name: skill.name,
            class: skill.class,
            level: skill.level,
            damage: skill.damage,
            cooldown: skill.cooldown,
            manaCost: skill.manaCost,
            range: skill.range,
            type: skill.type,
            subtype: skill.subtype,
            description: skill.description,
            icon: skill.icon,
            effects: skill.effects
        };
    }
    
    /**
     * Obtém estatísticas do sistema
     * @returns {object} - Estatísticas
     */
    getStats() {
        return {
            name: this.name,
            config: this.config
        };
    }
}

module.exports = SkillSystem;
