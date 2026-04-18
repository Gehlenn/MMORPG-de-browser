/**
 * CooldownSystem - Sistema de Cooldowns
 * Gerencia cooldowns de skills e buffs
 */

class CooldownSystem {
    constructor() {
        this.name = 'CooldownSystem';
        
        // Configurações
        this.config = {
            updateInterval: 1000,    // Update a cada 1 segundo
            maxEffects: 50,          // Máximo de efeitos por jogador
            cleanupInterval: 5000    // Cleanup a cada 5 segundos
        };
        
        // Estado do sistema
        this.lastCleanup = 0;
        
        console.log('⏱️ CooldownSystem created');
    }
    
    /**
     * Update do sistema de cooldowns
     * @param {object} player - Dados do jogador
     */
    update(player) {
        if (!player) return;
        
        // Update de cooldowns de skills
        this.updateSkillCooldowns(player);
        
        // Update de efeitos ativos
        this.updateActiveEffects(player);
        
        // Update de buffs
        this.updateBuffs(player);
        
        // Update de transformações
        this.updateTransformations(player);
        
        // Cleanup periódico
        const now = Date.now();
        if (now - this.lastCleanup > this.config.cleanupInterval) {
            this.cleanupExpiredEffects(player);
            this.lastCleanup = now;
        }
    }
    
    /**
     * Update de cooldowns de skills
     * @param {object} player - Dados do jogador
     */
    updateSkillCooldowns(player) {
        if (!player.cooldowns) return;
        
        const now = Date.now();
        const expiredCooldowns = [];
        
        for (const [skillId, cooldownEnd] of Object.entries(player.cooldowns)) {
            if (now >= cooldownEnd) {
                expiredCooldowns.push(skillId);
            }
        }
        
        // Remover cooldowns expirados
        for (const skillId of expiredCooldowns) {
            delete player.cooldowns[skillId];
        }
    }
    
    /**
     * Update de efeitos ativos
     * @param {object} player - Dados do jogador
     */
    updateActiveEffects(player) {
        if (!player.activeEffects) return;
        
        const now = Date.now();
        const expiredEffects = [];
        
        for (const [effectId, effect] of player.activeEffects) {
            // Verificar se expirou
            if (now >= effect.startTime + effect.duration) {
                expiredEffects.push(effectId);
                continue;
            }
            
            // Processar efeitos periódicos
            if (effect.interval && now >= effect.lastTick + effect.interval) {
                this.processPeriodicEffect(player, effect);
                effect.lastTick = now;
            }
        }
        
        // Remover efeitos expirados
        for (const effectId of expiredEffects) {
            this.removeEffect(player, effectId);
        }
    }
    
    /**
     * Update de buffs
     * @param {object} player - Dados do jogador
     */
    updateBuffs(player) {
        if (!player.buffs) return;
        
        const now = Date.now();
        const expiredBuffs = [];
        
        for (const [buffId, buff] of player.buffs) {
            if (now >= buff.startTime + buff.duration) {
                expiredBuffs.push(buffId);
            }
        }
        
        // Remover buffs expirados
        for (const buffId of expiredBuffs) {
            this.removeBuff(player, buffId);
        }
    }
    
    /**
     * Update de transformações
     * @param {object} player - Dados do jogador
     */
    updateTransformations(player) {
        if (!player.transformations) return;
        
        const now = Date.now();
        const expiredTransformations = [];
        
        for (const [transformId, transform] of player.transformations) {
            if (now >= transform.startTime + transform.duration) {
                expiredTransformations.push(transformId);
            }
        }
        
        // Remover transformações expiradas
        for (const transformId of expiredTransformations) {
            this.removeTransformation(player, transformId);
        }
    }
    
    /**
     * Processa efeito periódico
     * @param {object} player - Dados do jogador
     * @param {object} effect - Dados do efeito
     */
    processPeriodicEffect(player, effect) {
        switch (effect.type) {
            case 'dot':
            case 'burn':
            case 'poison':
                // Damage over time
                if (player.hp > 0) {
                    player.hp = Math.max(0, player.hp - effect.damage);
                    console.log(`💀 ${player.name} took ${effect.damage} ${effect.type} damage`);
                    
                    // Notificar se necessário
                    if (player.socket) {
                        player.socket.emit('periodic_damage', {
                            type: effect.type,
                            damage: effect.damage,
                            currentHp: player.hp
                        });
                    }
                }
                break;
                
            case 'hot':
                // Heal over time
                if (player.hp < player.maxHp) {
                    const healAmount = Math.min(effect.heal, player.maxHp - player.hp);
                    player.hp = Math.min(player.maxHp, player.hp + healAmount);
                    console.log(`💚 ${player.name} healed ${healAmount} HP`);
                    
                    // Notificar se necessário
                    if (player.socket) {
                        player.socket.emit('periodic_heal', {
                            healAmount: healAmount,
                            currentHp: player.hp
                        });
                    }
                }
                break;
        }
    }
    
    /**
     * Remove efeito
     * @param {object} player - Dados do jogador
     * @param {string} effectId - ID do efeito
     */
    removeEffect(player, effectId) {
        if (!player.activeEffects) return;
        
        const effect = player.activeEffects.get(effectId);
        if (effect) {
            // Remover efeitos permanentes
            this.removePermanentEffect(player, effect);
            
            player.activeEffects.delete(effectId);
            console.log(`🔚 Removed effect: ${effectId} from ${player.name}`);
        }
    }
    
    /**
     * Remove buff
     * @param {object} player - Dados do jogador
     * @param {string} buffId - ID do buff
     */
    removeBuff(player, buffId) {
        if (!player.buffs) return;
        
        const buff = player.buffs.get(buffId);
        if (buff) {
            // Remover efeitos permanentes do buff
            this.removePermanentEffect(player, buff);
            
            player.buffs.delete(buffId);
            console.log(`🔚 Removed buff: ${buff.name} from ${player.name}`);
            
            // Notificar jogador
            if (player.socket) {
                player.socket.emit('buff_expired', {
                    buffId: buffId,
                    buffName: buff.name
                });
            }
        }
    }
    
    /**
     * Remove transformação
     * @param {object} player - Dados do jogador
     * @param {string} transformId - ID da transformação
     */
    removeTransformation(player, transformId) {
        if (!player.transformations) return;
        
        const transform = player.transformations.get(transformId);
        if (transform) {
            // Remover efeitos permanentes da transformação
            this.removePermanentEffect(player, transform);
            
            player.transformations.delete(transformId);
            console.log(`🔚 Removed transformation: ${transform.name} from ${player.name}`);
            
            // Notificar jogador
            if (player.socket) {
                player.socket.emit('transformation_expired', {
                    transformId: transformId,
                    transformName: transform.name
                });
            }
        }
    }
    
    /**
     * Remove efeitos permanentes
     * @param {object} player - Dados do jogador
     * @param {object} effectData - Dados do efeito
     */
    removePermanentEffect(player, effectData) {
        if (!effectData.effects) return;
        
        for (const effect of effectData.effects) {
            this.removeEffectStat(player, effect);
        }
    }
    
    /**
     * Remove stat de efeito
     * @param {object} player - Dados do jogador
     * @param {string} effect - Efeito a remover
     */
    removeEffectStat(player, effect) {
        // Parse effect: "type_value_duration"
        const parts = effect.split('_');
        const effectType = parts[0];
        const value = parseFloat(parts[1]) || 0;
        
        switch (effectType) {
            case 'stun':
                player.stunned = false;
                delete player.stunEndTime;
                break;
                
            case 'slow':
                // Restaurar velocidade original
                player.speed = player.originalSpeed || 10;
                delete player.slowEndTime;
                break;
                
            case 'defense':
                player.defense = (player.defense || 5) - value;
                break;
                
            case 'attack_speed':
                player.attackSpeed = (player.attackSpeed || 1) / (1 + value / 100);
                break;
                
            case 'shield':
                player.shield = Math.max(0, (player.shield || 0) - value);
                break;
                
            case 'health':
                player.maxHp = Math.max(1, (player.maxHp || 100) - value);
                player.hp = Math.min(player.hp, player.maxHp);
                break;
                
            case 'armor':
                player.defense = Math.max(0, (player.defense || 5) - value);
                break;
        }
    }
    
    /**
     * Verifica se jogador está em cooldown
     * @param {object} player - Dados do jogador
     * @param {string} skillId - ID da skill
     * @returns {boolean} - Está em cooldown
     */
    isOnCooldown(player, skillId) {
        if (!player.cooldowns) return false;
        
        const cooldownEnd = player.cooldowns[skillId];
        if (!cooldownEnd) return false;
        
        return Date.now() < cooldownEnd;
    }
    
    /**
     * Obtém tempo restante de cooldown
     * @param {object} player - Dados do jogador
     * @param {string} skillId - ID da skill
     * @returns {number} - Tempo restante em segundos
     */
    getCooldownRemaining(player, skillId) {
        if (!player.cooldowns) return 0;
        
        const cooldownEnd = player.cooldowns[skillId];
        if (!cooldownEnd) return 0;
        
        const remaining = cooldownEnd - Date.now();
        return Math.max(0, Math.ceil(remaining / 1000));
    }
    
    /**
     * Obtém todos os cooldowns ativos
     * @param {object} player - Dados do jogador
     * @returns {object} - Cooldowns ativos
     */
    getAllCooldowns(player) {
        if (!player.cooldowns) return {};
        
        const now = Date.now();
        const activeCooldowns = {};
        
        for (const [skillId, cooldownEnd] of Object.entries(player.cooldowns)) {
            if (now < cooldownEnd) {
                activeCooldowns[skillId] = {
                    remainingTime: Math.ceil((cooldownEnd - now) / 1000),
                    maxCooldown: 0 // TODO: Obter do SkillDatabase
                };
            }
        }
        
        return activeCooldowns;
    }
    
    /**
     * Limpa todos os cooldowns
     * @param {object} player - Dados do jogador
     */
    clearAllCooldowns(player) {
        if (player.cooldowns) {
            player.cooldowns = {};
            console.log(`🔄 Cleared all cooldowns for ${player.name}`);
        }
    }
    
    /**
     * Limpa todos os efeitos
     * @param {object} player - Dados do jogador
     */
    clearAllEffects(player) {
        // Remover efeitos ativos
        if (player.activeEffects) {
            for (const effectId of player.activeEffects.keys()) {
                this.removeEffect(player, effectId);
            }
            player.activeEffects.clear();
        }
        
        // Remover buffs
        if (player.buffs) {
            for (const buffId of player.buffs.keys()) {
                this.removeBuff(player, buffId);
            }
            player.buffs.clear();
        }
        
        // Remover transformações
        if (player.transformations) {
            for (const transformId of player.transformations.keys()) {
                this.removeTransformation(player, transformId);
            }
            player.transformations.clear();
        }
        
        // Resetar estados
        player.stunned = false;
        player.silenced = false;
        delete player.stunEndTime;
        delete player.silenceEndTime;
        
        console.log(`🔄 Cleared all effects for ${player.name}`);
    }
    
    /**
     * Cleanup de efeitos expirados
     * @param {object} player - Dados do jogador
     */
    cleanupExpiredEffects(player) {
        this.updateSkillCooldowns(player);
        this.updateActiveEffects(player);
        this.updateBuffs(player);
        this.updateTransformations(player);
    }
    
    /**
     * Obtém resumo dos efeitos ativos
     * @param {object} player - Dados do jogador
     * @returns {object} - Resumo dos efeitos
     */
    getEffectsSummary(player) {
        const summary = {
            cooldowns: this.getAllCooldowns(player),
            buffs: [],
            effects: [],
            transformations: [],
            stunned: player.stunned || false,
            silenced: player.silenced || false
        };
        
        // Adicionar buffs
        if (player.buffs) {
            for (const [buffId, buff] of player.buffs) {
                const remainingTime = Math.ceil((buff.startTime + buff.duration - Date.now()) / 1000);
                summary.buffs.push({
                    id: buffId,
                    name: buff.name,
                    remainingTime: remainingTime,
                    effects: buff.effects
                });
            }
        }
        
        // Adicionar efeitos ativos
        if (player.activeEffects) {
            for (const [effectId, effect] of player.activeEffects) {
                const remainingTime = Math.ceil((effect.startTime + effect.duration - Date.now()) / 1000);
                summary.effects.push({
                    id: effectId,
                    type: effect.type,
                    remainingTime: remainingTime,
                    damage: effect.damage || effect.heal
                });
            }
        }
        
        // Adicionar transformações
        if (player.transformations) {
            for (const [transformId, transform] of player.transformations) {
                const remainingTime = Math.ceil((transform.startTime + transform.duration - Date.now()) / 1000);
                summary.transformations.push({
                    id: transformId,
                    name: transform.name,
                    remainingTime: remainingTime,
                    effects: transform.effects
                });
            }
        }
        
        return summary;
    }
    
    /**
     * Obtém estatísticas do sistema
     * @returns {object} - Estatísticas
     */
    getStats() {
        return {
            name: this.name,
            config: this.config,
            lastCleanup: this.lastCleanup
        };
    }
}

module.exports = CooldownSystem;
