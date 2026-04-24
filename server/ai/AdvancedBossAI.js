/**
 * AdvancedBossAI.js
 * Sistema de IA Avançada para Bosses com Machine Learning Patterns
 * Legacy of Komodo MMORPG v0.6.0 - Nível 10
 */

class AdvancedBossAI {
    constructor(database, playerManager, combatSystem) {
        this.db = database;
        this.playerManager = playerManager;
        this.combatSystem = combatSystem;
        
        // Estado de aprendizado dos bosses
        this.bossMemory = new Map(); // bossId -> learnedPatterns
        
        // Padrões de comportamento
        this.behaviorPatterns = {
            aggressive: {
                name: 'Aggressive',
                description: 'Prioriza ataques, menos defesa',
                attackChance: 0.7,
                defenseChance: 0.2,
                specialChance: 0.1
            },
            defensive: {
                name: 'Defensive',
                description: 'Prioriza defesa quando HP baixo',
                attackChance: 0.4,
                defenseChance: 0.4,
                specialChance: 0.2
            },
            tactical: {
                name: 'Tactical',
                description: 'Alterna entre ataques e defesa estrategicamente',
                attackChance: 0.5,
                defenseChance: 0.3,
                specialChance: 0.2
            },
            berserker: {
                name: 'Berserker',
                description: 'Fica mais agressivo com HP baixo',
                attackChance: 0.8,
                defenseChance: 0.1,
                specialChance: 0.1
            },
            adaptive: {
                name: 'Adaptive',
                description: 'Adapta-se ao comportamento dos jogadores',
                attackChance: 0.5,
                defenseChance: 0.3,
                specialChance: 0.2
            }
        };
        
        // Estados de fase
        this.phaseThresholds = {
            phase2: 0.75, // 75% HP
            phase3: 0.50, // 50% HP
            phase4: 0.25  // 25% HP
        };
        
        // Estratégias de targeting
        this.targetingStrategies = {
            random: 'Random targeting',
            lowestHp: 'Target lowest HP player',
            highestThreat: 'Target highest threat (damage dealt)',
            healer: 'Target healers/support',
            tank: 'Target tanks first',
            closest: 'Target closest player'
        };
        
        console.log('🧠 AdvancedBossAI initialized');
    }

    /**
     * Inicializa memória de aprendizado para boss
     */
    initializeBossMemory(bossId, bossType) {
        const memory = {
            bossId: bossId,
            bossType: bossType,
            createdAt: Date.now(),
            
            // Histórico de combates
            encounters: [],
            
            // Padrões aprendidos
            learnedPatterns: {
                playerBehaviors: {}, // playerId -> { avgDps, healingStyle, positioning }
                effectiveAbilities: [], // habilidades que funcionaram bem
                counterStrategies: {} // estratégias contra jogadores específicos
            },
            
            // Estatísticas
            totalFights: 0,
            wins: 0,
            losses: 0,
            avgFightDuration: 0,
            mostDangerousPlayer: null,
            
            // Adaptação
            currentPhase: 1,
            behaviorMode: 'adaptive',
            lastAbilityUsed: null,
            abilityUsageCount: {},
            
            // Previsão
            predictedPlayerActions: {},
            dangerZones: [], // áreas onde jogadores se agrupam
            escapeRoutes: [] // rotas de fuga calculadas
        };
        
        this.bossMemory.set(bossId, memory);
        return memory;
    }

    /**
     * Processa tick de AI do boss
     */
    async processBossTick(bossId, bossData, playersInRange) {
        const memory = this.bossMemory.get(bossId) || this.initializeBossMemory(bossId, bossData.type);
        
        // Atualiza estado
        this.updateBossState(memory, bossData, playersInRange);
        
        // Detecta mudança de fase
        const phaseChange = this.checkPhaseTransition(memory, bossData);
        if (phaseChange.changed) {
            return this.executePhaseChange(memory, bossData, phaseChange.newPhase, playersInRange);
        }
        
        // Decide ação baseada em comportamento
        const action = this.decideAction(memory, bossData, playersInRange);
        
        // Executa ação
        return this.executeAction(memory, bossData, action, playersInRange);
    }

    /**
     * Atualiza estado do boss
     */
    updateBossState(memory, bossData, playersInRange) {
        // Calcula HP percentual
        const hpPercent = bossData.hp / bossData.maxHp;
        
        // Atualiza dados dos jogadores
        for (const player of playersInRange) {
            if (!memory.learnedPatterns.playerBehaviors[player.id]) {
                memory.learnedPatterns.playerBehaviors[player.id] = {
                    totalDamage: 0,
                    healingDone: 0,
                    deaths: 0,
                    positioning: [],
                    threatLevel: 0
                };
            }
            
            const playerData = memory.learnedPatterns.playerBehaviors[player.id];
            
            // Atualiza threat baseado em dano recente
            playerData.threatLevel = this.calculateThreat(player, memory);
        }
        
        // Atualiza fase atual
        if (hpPercent <= this.phaseThresholds.phase4) {
            memory.currentPhase = 4;
        } else if (hpPercent <= this.phaseThresholds.phase3) {
            memory.currentPhase = 3;
        } else if (hpPercent <= this.phaseThresholds.phase2) {
            memory.currentPhase = 2;
        } else {
            memory.currentPhase = 1;
        }
    }

    /**
     * Verifica transição de fase
     */
    checkPhaseTransition(memory, bossData) {
        const hpPercent = bossData.hp / bossData.maxHp;
        let targetPhase = 1;
        
        if (hpPercent <= this.phaseThresholds.phase4) targetPhase = 4;
        else if (hpPercent <= this.phaseThresholds.phase3) targetPhase = 3;
        else if (hpPercent <= this.phaseThresholds.phase2) targetPhase = 2;
        
        return {
            changed: targetPhase !== memory.currentPhase,
            newPhase: targetPhase,
            previousPhase: memory.currentPhase
        };
    }

    /**
     * Executa mudança de fase
     */
    executePhaseChange(memory, bossData, newPhase, playersInRange) {
        const phaseActions = {
            2: {
                message: `${bossData.name} enters Phase 2! The battle intensifies!`,
                effects: ['increased_damage', 'new_abilities'],
                healPercent: 0
            },
            3: {
                message: `${bossData.name} enters Phase 3! Desperate measures!`,
                effects: ['enrage', 'summon_minions'],
                healPercent: 0.05 // 5% heal
            },
            4: {
                message: `${bossData.name} enters FINAL PHASE! All or nothing!`,
                effects: ['berserk', 'ultimate_abilities', 'damage_immunity_phases'],
                healPercent: 0.10 // 10% heal
            }
        };
        
        const phaseData = phaseActions[newPhase];
        
        // Heal se necessário
        if (phaseData.healPercent > 0) {
            bossData.hp = Math.min(bossData.maxHp, bossData.hp + (bossData.maxHp * phaseData.healPercent));
        }
        
        // Atualiza comportamento
        if (newPhase >= 3) {
            memory.behaviorMode = 'berserker';
        }
        
        console.log(`🔄 Boss ${bossData.name} transitioned to Phase ${newPhase}`);
        
        return {
            type: 'phase_change',
            phase: newPhase,
            message: phaseData.message,
            effects: phaseData.effects,
            heal: phaseData.healPercent
        };
    }

    /**
     * Decide próxima ação
     */
    decideAction(memory, bossData, playersInRange) {
        const behavior = this.behaviorPatterns[memory.behaviorMode];
        const roll = Math.random();
        
        // Análise tática
        const tacticalAnalysis = this.analyzeTacticalSituation(memory, bossData, playersInRange);
        
        // Modifica chances baseado na situação
        let attackChance = behavior.attackChance;
        let defenseChance = behavior.defenseChance;
        let specialChance = behavior.specialChance;
        
        // Se HP baixo, prioriza defesa (exceto berserker)
        if (bossData.hp / bossData.maxHp < 0.3 && memory.behaviorMode !== 'berserker') {
            defenseChance += 0.2;
            attackChance -= 0.2;
        }
        
        // Se jogadores agrupados, usa AOE
        if (tacticalAnalysis.playersClustered) {
            specialChance += 0.15;
        }
        
        // Se tem habilidade ultimate disponível e situação crítica
        if (tacticalAnalysis.isCritical && this.hasUltimateAvailable(bossData)) {
            return { type: 'ultimate', target: tacticalAnalysis.bestTarget };
        }
        
        // Decide baseado nas chances
        if (roll < attackChance) {
            const target = this.selectTarget(memory, playersInRange, 'attack');
            return { type: 'attack', target: target, ability: this.selectAttackAbility(bossData) };
        } else if (roll < attackChance + defenseChance) {
            return { type: 'defense', ability: this.selectDefenseAbility(bossData) };
        } else {
            const target = this.selectTarget(memory, playersInRange, 'special');
            return { type: 'special', target: target, ability: this.selectSpecialAbility(bossData, memory) };
        }
    }

    /**
     * Analisa situação tática
     */
    analyzeTacticalSituation(memory, bossData, playersInRange) {
        const analysis = {
            playerCount: playersInRange.length,
            playersClustered: false,
            avgPlayerDistance: 0,
            totalThreat: 0,
            isCritical: false,
            bestTarget: null
        };
        
        if (playersInRange.length === 0) return analysis;
        
        // Calcula centro de massa dos jogadores
        const centerX = playersInRange.reduce((sum, p) => sum + (p.x || 0), 0) / playersInRange.length;
        const centerY = playersInRange.reduce((sum, p) => sum + (p.y || 0), 0) / playersInRange.length;
        
        // Verifica se jogadores estão agrupados
        let clusteredCount = 0;
        for (const player of playersInRange) {
            const distToCenter = Math.hypot((player.x || 0) - centerX, (player.y || 0) - centerY);
            if (distToCenter < 100) clusteredCount++;
            
            // Soma threat
            const playerData = memory.learnedPatterns.playerBehaviors[player.id];
            if (playerData) {
                analysis.totalThreat += playerData.threatLevel;
            }
        }
        
        analysis.playersClustered = clusteredCount >= 3;
        analysis.isCritical = bossData.hp / bossData.maxHp < 0.2 && analysis.totalThreat > 100;
        
        // Seleciona melhor alvo
        analysis.bestTarget = this.selectTarget(memory, playersInRange, 'highest_threat');
        
        return analysis;
    }

    /**
     * Seleciona alvo
     */
    selectTarget(memory, playersInRange, strategy = 'adaptive') {
        if (playersInRange.length === 0) return null;
        if (playersInRange.length === 1) return playersInRange[0];
        
        switch (strategy) {
            case 'random':
                return playersInRange[Math.floor(Math.random() * playersInRange.length)];
                
            case 'lowest_hp':
                return playersInRange.reduce((lowest, p) => 
                    (p.hp || 100) < (lowest.hp || 100) ? p : lowest
                );
                
            case 'highest_threat':
                return playersInRange.reduce((highest, p) => {
                    const pThreat = memory.learnedPatterns.playerBehaviors[p.id]?.threatLevel || 0;
                    const hThreat = memory.learnedPatterns.playerBehaviors[highest.id]?.threatLevel || 0;
                    return pThreat > hThreat ? p : highest;
                });
                
            case 'healer':
                // Prioriza jogadores que curam muito
                return playersInRange.reduce((healer, p) => {
                    const pHeal = memory.learnedPatterns.playerBehaviors[p.id]?.healingDone || 0;
                    const hHeal = memory.learnedPatterns.playerBehaviors[healer.id]?.healingDone || 0;
                    return pHeal > hHeal ? p : healer;
                });
                
            case 'closest':
                return playersInRange.reduce((closest, p) => {
                    const pDist = Math.hypot((p.x || 0) - memory.bossX, (p.y || 0) - memory.bossY);
                    const cDist = Math.hypot((closest.x || 0) - memory.bossX, (closest.y || 0) - memory.bossY);
                    return pDist < cDist ? p : closest;
                });
                
            default: // adaptive
                // Mistura de estratégias baseado na situação
                const roll = Math.random();
                if (roll < 0.4) return this.selectTarget(memory, playersInRange, 'highest_threat');
                if (roll < 0.7) return this.selectTarget(memory, playersInRange, 'lowest_hp');
                return this.selectTarget(memory, playersInRange, 'random');
        }
    }

    /**
     * Executa ação decidida
     */
    executeAction(memory, bossData, action, playersInRange) {
        // Registra uso de habilidade
        if (action.ability) {
            memory.lastAbilityUsed = action.ability;
            memory.abilityUsageCount[action.ability] = (memory.abilityUsageCount[action.ability] || 0) + 1;
        }
        
        return {
            type: action.type,
            target: action.target,
            ability: action.ability,
            bossId: memory.bossId,
            timestamp: Date.now()
        };
    }

    /**
     * Aprende com resultado do combate
     */
    async learnFromEncounter(bossId, encounterData) {
        const memory = this.bossMemory.get(bossId);
        if (!memory) return;
        
        // Adiciona ao histórico
        memory.encounters.push({
            ...encounterData,
            learnedAt: Date.now()
        });
        
        // Mantém apenas últimos 50 combates na memória ativa
        if (memory.encounters.length > 50) {
            memory.encounters = memory.encounters.slice(-50);
        }
        
        // Atualiza estatísticas
        memory.totalFights++;
        if (encounterData.bossWon) {
            memory.wins++;
        } else {
            memory.losses++;
        }
        
        // Calcula duração média
        const durations = memory.encounters.map(e => e.duration || 0);
        memory.avgFightDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        
        // Identifica jogador mais perigoso
        let maxThreat = 0;
        let mostDangerous = null;
        
        for (const [playerId, data] of Object.entries(memory.learnedPatterns.playerBehaviors)) {
            if (data.threatLevel > maxThreat) {
                maxThreat = data.threatLevel;
                mostDangerous = playerId;
            }
        }
        
        memory.mostDangerousPlayer = mostDangerous;
        
        // Aprende habilidades efetivas
        if (encounterData.effectiveAbilities) {
            for (const ability of encounterData.effectiveAbilities) {
                if (!memory.learnedPatterns.effectiveAbilities.includes(ability)) {
                    memory.learnedPatterns.effectiveAbilities.push(ability);
                }
            }
        }
        
        // Salva no banco para persistência
        await this.db.saveBossMemory(bossId, memory);
        
        console.log(`🧠 Boss ${bossId} learned from encounter #${memory.totalFights}`);
    }

    /**
     * Prediz ação do jogador
     */
    predictPlayerAction(playerId, memory) {
        const playerData = memory.learnedPatterns.playerBehaviors[playerId];
        if (!playerData) return null;
        
        // Analisa padrão de comportamento
        const predictions = {
            willAttack: playerData.threatLevel > 50,
            willHeal: playerData.healingDone > playerData.totalDamage,
            willFlee: playerData.deaths > 2,
            preferredRange: playerData.positioning?.[0]?.range || 'medium'
        };
        
        memory.predictedPlayerActions[playerId] = predictions;
        
        return predictions;
    }

    /**
     * Calcula nível de ameaça
     */
    calculateThreat(player, memory) {
        const data = memory.learnedPatterns.playerBehaviors[player.id];
        if (!data) return 0;
        
        // Fórmula de ameaça
        const dpsWeight = 0.5;
        const healingWeight = 0.3;
        const deathWeight = -0.2;
        
        return (
            (data.totalDamage * dpsWeight) +
            (data.healingDone * healingWeight) +
            (data.deaths * deathWeight)
        );
    }

    /**
     * Seleciona habilidade de ataque
     */
    selectAttackAbility(bossData) {
        const abilities = bossData.abilities || ['basic_attack'];
        
        // Prioriza habilidades que não usou recentemente
        const available = abilities.filter(a => a !== 'basic_attack');
        if (available.length > 0 && Math.random() < 0.6) {
            return available[Math.floor(Math.random() * available.length)];
        }
        
        return 'basic_attack';
    }

    /**
     * Seleciona habilidade defensiva
     */
    selectDefenseAbility(bossData) {
        const defenses = bossData.defensiveAbilities || ['block', 'dodge', 'shield'];
        return defenses[Math.floor(Math.random() * defenses.length)];
    }

    /**
     * Seleciona habilidade especial
     */
    selectSpecialAbility(bossData, memory) {
        const specials = bossData.specialAbilities || bossData.abilities || [];
        
        // Prioriza habilidades efetivas aprendidas
        const effective = memory.learnedPatterns.effectiveAbilities;
        const preferred = specials.filter(a => effective.includes(a));
        
        if (preferred.length > 0 && Math.random() < 0.7) {
            return preferred[Math.floor(Math.random() * preferred.length)];
        }
        
        return specials[Math.floor(Math.random() * specials.length)] || 'special_attack';
    }

    /**
     * Verifica se ultimate está disponível
     */
    hasUltimateAvailable(bossData) {
        return bossData.ultimateAbility && 
               (bossData.ultimateCooldown || 0) <= 0 &&
               bossData.energy >= (bossData.ultimateCost || 100);
    }

    /**
     * Obtém memória do boss
     */
    getBossMemory(bossId) {
        return this.bossMemory.get(bossId);
    }

    /**
     * Limpa memória antiga
     */
    async cleanupOldMemory(daysOld = 30) {
        const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        
        for (const [bossId, memory] of this.bossMemory) {
            if (memory.createdAt < cutoff && memory.encounters.length === 0) {
                this.bossMemory.delete(bossId);
            }
        }
        
        console.log(`🧠 Cleaned up old boss memories. Current: ${this.bossMemory.size}`);
    }

    getStats() {
        return {
            bossesWithMemory: this.bossMemory.size,
            totalEncounters: Array.from(this.bossMemory.values())
                .reduce((sum, m) => sum + m.totalFights, 0),
            behaviorPatterns: Object.keys(this.behaviorPatterns).length,
            targetingStrategies: Object.keys(this.targetingStrategies).length
        };
    }
}

// Exporta
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedBossAI;
} else {
    window.AdvancedBossAI = AdvancedBossAI;
}
