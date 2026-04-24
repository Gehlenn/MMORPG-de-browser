/**
 * CombatSystem.js
 * Sistema Avançado de Combate com Habilidades Especiais e Combos
 * Legacy of Komodo MMORPG v0.5.0
 */

class CombatSystem {
    constructor(playerManager, visualEffects) {
        this.playerManager = playerManager;
        this.visualEffects = visualEffects;
        
        // Habilidades por classe
        this.classAbilities = {
            warrior: {
                name: 'Guerreiro',
                abilities: [
                    { id: 'slash', name: 'Corte Profundo', damage: 1.5, cooldown: 3000, icon: '⚔️' },
                    { id: 'whirlwind', name: 'Redemoinho', damage: 2.0, aoe: true, cooldown: 8000, icon: '🌪️' },
                    { id: 'shield_bash', name: 'Golpe de Escudo', damage: 1.2, stun: 2000, cooldown: 6000, icon: '🛡️' },
                    { id: 'berserk', name: 'Berserk', damage: 2.5, selfDamage: 0.1, duration: 5000, cooldown: 15000, icon: '😤' }
                ],
                combo: ['slash', 'slash', 'whirlwind']
            },
            mage: {
                name: 'Mago',
                abilities: [
                    { id: 'fireball', name: 'Bola de Fogo', damage: 2.0, element: 'fire', cooldown: 4000, icon: '🔥' },
                    { id: 'frost_nova', name: 'Nova de Gelo', damage: 1.5, aoe: true, slow: 3000, cooldown: 7000, icon: '❄️' },
                    { id: 'lightning', name: 'Raio', damage: 2.5, element: 'lightning', cooldown: 5000, icon: '⚡' },
                    { id: 'teleport', name: 'Teleporte', damage: 0, distance: 150, cooldown: 10000, icon: '✨' }
                ],
                combo: ['fireball', 'frost_nova', 'lightning']
            },
            archer: {
                name: 'Arqueiro',
                abilities: [
                    { id: 'power_shot', name: 'Tiro Potente', damage: 1.8, cooldown: 3000, icon: '🏹' },
                    { id: 'multishot', name: 'Multi-Tiro', damage: 1.2, shots: 3, cooldown: 6000, icon: '🔫' },
                    { id: 'poison_arrow', name: 'Flecha Envenenada', damage: 1.0, dot: 5, duration: 5000, cooldown: 5000, icon: '🧪' },
                    { id: 'rapid_fire', name: 'Disparo Rápido', damage: 0.8, shots: 5, duration: 3000, cooldown: 8000, icon: '💨' }
                ],
                combo: ['power_shot', 'power_shot', 'multishot']
            },
            rogue: {
                name: 'Ladino',
                abilities: [
                    { id: 'backstab', name: 'Ataque pelas Costas', damage: 2.5, stealthBonus: true, cooldown: 4000, icon: '🗡️' },
                    { id: 'stealth', name: 'Furtividade', damage: 0, invisible: 5000, cooldown: 10000, icon: '👤' },
                    { id: 'poison_blade', name: 'Lâmina Envenenada', damage: 1.3, dot: 3, duration: 4000, cooldown: 6000, icon: '🩸' },
                    { id: 'shadow_strike', name: 'Golpe Sombrio', damage: 3.0, teleport: true, cooldown: 12000, icon: '🌑' }
                ],
                combo: ['stealth', 'backstab', 'shadow_strike']
            }
        };
        
        // Sistema de combos
        this.activeCombos = new Map();
        this.cooldowns = new Map();
        
        console.log('⚔️ CombatSystem initialized');
    }

    /**
     * Executa uma habilidade
     */
    useAbility(player, abilityId, target) {
        const classData = this.classAbilities[player.class];
        if (!classData) return { success: false, error: 'Classe inválida' };
        
        const ability = classData.abilities.find(a => a.id === abilityId);
        if (!ability) return { success: false, error: 'Habilidade não encontrada' };
        
        // Verifica cooldown
        const cdKey = `${player.id}_${abilityId}`;
        if (this.cooldowns.has(cdKey)) {
            const remaining = this.cooldowns.get(cdKey) - Date.now();
            if (remaining > 0) {
                return { success: false, error: `Cooldown: ${Math.ceil(remaining / 1000)}s` };
            }
        }
        
        // Calcula dano base
        let damage = player.stats.attack * ability.damage;
        let isCritical = false;
        
        // Verifica combo
        const combo = this.checkCombo(player, abilityId);
        if (combo) {
            damage *= 1.5; // Bonus de combo
            this.visualEffects?.createBuffEffect(player.x, player.y, true);
        }
        
        // Verifica crítico
        if (Math.random() < (player.stats.critChance || 0.05)) {
            damage *= 2;
            isCritical = true;
        }
        
        // Aplica efeitos
        const result = {
            success: true,
            ability: ability.name,
            damage: Math.floor(damage),
            isCritical: isCritical,
            isCombo: !!combo,
            effects: []
        };
        
        // Aplica dano ao alvo
        if (target && damage > 0) {
            target.hp -= damage;
            
            // Efeitos visuais
            if (isCritical) {
                this.visualEffects?.createCriticalEffect(target.x, target.y, result.damage);
            } else {
                this.visualEffects?.createAttackTrail(player.x, player.y, 
                    Math.atan2(target.y - player.y, target.x - player.x), 
                    ability.element || 'normal');
            }
            
            // DOT (Damage over time)
            if (ability.dot) {
                this.applyDOT(target, ability.dot, ability.duration, ability.element);
                result.effects.push('poison');
            }
            
            // Stun
            if (ability.stun) {
                target.stunned = true;
                setTimeout(() => target.stunned = false, ability.stun);
                result.effects.push('stun');
            }
            
            // Slow
            if (ability.slow) {
                const originalSpeed = target.speed;
                target.speed *= 0.5;
                setTimeout(() => target.speed = originalSpeed, ability.slow);
                result.effects.push('slow');
            }
        }
        
        // AOE (Area of Effect)
        if (ability.aoe) {
            this.applyAOE(player, target, damage * 0.6, 100);
            this.visualEffects?.createMagicEffect(player.x, player.y, ability.element || 'fire');
        }
        
        // Auto-dano (Berserk)
        if (ability.selfDamage) {
            player.hp -= player.stats.maxHp * ability.selfDamage;
            result.effects.push('self_damage');
        }
        
        // Invisibilidade
        if (ability.invisible) {
            player.invisible = true;
            player.invisibleEndTime = Date.now() + ability.invisible;
            result.effects.push('stealth');
        }
        
        // Set cooldown
        this.cooldowns.set(cdKey, Date.now() + ability.cooldown);
        
        // Atualiza combo
        this.updateCombo(player, abilityId);
        
        console.log(`⚔️ ${player.name} usou ${ability.name} - ${result.damage} dano`);
        return result;
    }

    /**
     * Verifica sequência de combo
     */
    checkCombo(player, abilityId) {
        const classData = this.classAbilities[player.class];
        if (!classData) return false;
        
        const combo = this.activeCombos.get(player.id);
        if (!combo) return false;
        
        // Verifica se a sequência atual + novo move completam o combo
        const currentSequence = [...combo.sequence, abilityId];
        const requiredCombo = classData.combo;
        
        // Verifica se a sequência termina com o combo
        const endsWithCombo = currentSequence.length >= requiredCombo.length &&
            currentSequence.slice(-requiredCombo.length).every((move, i) => 
                move === requiredCombo[i]);
        
        return endsWithCombo;
    }

    /**
     * Atualiza sequência de combo
     */
    updateCombo(player, abilityId) {
        const classData = this.classAbilities[player.class];
        if (!classData || !classData.combo) return;
        
        let combo = this.activeCombos.get(player.id);
        if (!combo) {
            combo = { sequence: [], timeout: null };
        }
        
        // Adiciona movimento
        combo.sequence.push(abilityId);
        
        // Limpa após 5 segundos de inatividade
        if (combo.timeout) clearTimeout(combo.timeout);
        combo.timeout = setTimeout(() => {
            this.activeCombos.delete(player.id);
        }, 5000);
        
        // Mantém apenas últimos 5 movimentos
        if (combo.sequence.length > 5) {
            combo.sequence.shift();
        }
        
        this.activeCombos.set(player.id, combo);
    }

    /**
     * Aplica DOT (Damage over Time)
     */
    applyDOT(target, damage, duration, element) {
        const interval = 1000;
        const ticks = duration / interval;
        let tick = 0;
        
        const dotInterval = setInterval(() => {
            if (tick >= ticks || target.hp <= 0) {
                clearInterval(dotInterval);
                return;
            }
            
            target.hp -= damage;
            this.visualEffects?.createFloatingText(target.x, target.y - 10, `-${damage}`, 
                element === 'poison' ? '#44ff44' : '#ff4444', 14);
            tick++;
        }, interval);
    }

    /**
     * Aplica AOE (Area of Effect)
     */
    applyAOE(player, center, damage, radius) {
        // Encontra alvos no raio
        const targets = this.playerManager?.getNearby(center.x, center.y, radius) || [];
        
        targets.forEach(target => {
            if (target.id !== player.id && !target.friendly) {
                target.hp -= damage;
                this.visualEffects?.createAttackTrail(player.x, player.y, 
                    Math.atan2(target.y - player.y, target.x - player.x), 'magic');
            }
        });
    }

    /**
     * Ataque básico
     */
    basicAttack(player, target) {
        const damage = player.stats.attack * (0.8 + Math.random() * 0.4);
        const isCritical = Math.random() < (player.stats.critChance || 0.05);
        const finalDamage = isCritical ? damage * 2 : damage;
        
        if (target) {
            target.hp -= finalDamage;
            
            if (isCritical) {
                this.visualEffects?.createCriticalEffect(target.x, target.y, Math.floor(finalDamage));
            } else {
                this.visualEffects?.createFloatingText(target.x, target.y - 20, 
                    Math.floor(finalDamage).toString(), '#ffffff', 16);
            }
        }
        
        return {
            damage: Math.floor(finalDamage),
            isCritical: isCritical
        };
    }

    /**
     * Calcula stats de combate
     */
    calculateCombatStats(player) {
        const stats = {
            dps: player.stats.attack * (1 / (player.stats.attackSpeed || 1)),
            critChance: player.stats.critChance || 0.05,
            survivability: player.stats.maxHp / 100,
            utility: this.calculateUtilityScore(player)
        };
        
        return stats;
    }

    /**
     * Calcula score de utilidade
     */
    calculateUtilityScore(player) {
        const classData = this.classAbilities[player.class];
        if (!classData) return 1;
        
        let score = 1;
        classData.abilities.forEach(ability => {
            if (ability.aoe) score += 0.5;
            if (ability.stun) score += 0.3;
            if (ability.heal) score += 0.4;
            if (ability.invisible) score += 0.3;
        });
        
        return score;
    }

    /**
     * Verifica se habilidade está em cooldown
     */
    isOnCooldown(playerId, abilityId) {
        const cdKey = `${playerId}_${abilityId}`;
        if (!this.cooldowns.has(cdKey)) return false;
        
        return this.cooldowns.get(cdKey) > Date.now();
    }

    /**
     * Obtém cooldown restante
     */
    getCooldownRemaining(playerId, abilityId) {
        const cdKey = `${playerId}_${abilityId}`;
        if (!this.cooldowns.has(cdKey)) return 0;
        
        const remaining = this.cooldowns.get(cdKey) - Date.now();
        return Math.max(0, remaining);
    }

    /**
     * Obtém habilidades da classe
     */
    getClassAbilities(className) {
        return this.classAbilities[className]?.abilities || [];
    }

    /**
     * Obtém info de combo
     */
    getComboInfo(className) {
        const classData = this.classAbilities[className];
        if (!classData || !classData.combo) return null;
        
        return {
            sequence: classData.combo,
            abilities: classData.combo.map(id => 
                classData.abilities.find(a => a.id === id)
            )
        };
    }

    /**
     * Limpa cooldowns
     */
    clearCooldowns() {
        this.cooldowns.clear();
    }

    /**
     * Estatísticas
     */
    getStats() {
        return {
            activeCooldowns: this.cooldowns.size,
            activeCombos: this.activeCombos.size,
            classesSupported: Object.keys(this.classAbilities).length
        };
    }
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatSystem;
} else {
    window.CombatSystem = CombatSystem;
}
