/**
 * RestedXpSystem - Sistema de XP Rested (WoW style)
 * 
 * Features:
 * - Acumula XP rested enquanto off-line ou em town/safe zones
 * - 2x XP ganho enquanto tiver rested XP
 * - Barra azul de rested XP na interface
 * - Cap máximo de rested XP (1.5 levels)
 * - Também funciona para profissões (sistema separado mas similar)
 * 
 * Fórmula:
 * - Acumulação: 5% do XP necessário para o próximo level por 8h de descanso
 * - Máximo: 150% do XP do próximo level (1.5 levels)
 * - Consumo: 1 rested XP consumido para cada 1 XP ganho (bonus é 2x)
 */

class RestedXpSystem {
    constructor(characterPersistence) {
        this.characterPersistence = characterPersistence;
        
        // Configurações de acumulação
        this.CONFIG = {
            // Para XP de combate/personagem
            combat: {
                accumulationRate: 0.05, // 5% do XP do próximo level por 8h
                maxCapMultiplier: 1.5, // Máximo 1.5 levels de XP
                bonusMultiplier: 2.0, // 2x XP enquanto rested
                consumptionRate: 1.0 // 1 rested = 1 XP normal
            },
            // Para XP de profissões
            profession: {
                accumulationRate: 0.10, // 10% por 8h (mais rápido)
                maxCapMultiplier: 1.5,
                bonusMultiplier: 2.0,
                consumptionRate: 1.0
            }
        };
        
        // Estados de descanso
        this.REST_STATES = {
            OFFLINE: 'offline',
            IN_TOWN: 'in_town',
            INN: 'inn',
            ACTIVE: 'active'
        };
        
        // Multiplicadores por estado
        this.STATE_MULTIPLIERS = {
            offline: 1.0,
            in_town: 1.5,
            inn: 2.0,
            active: 0.0 // Não acumula quando ativo
        };
    }
    
    initialize() {
        console.log('[RestedXpSystem] Sistema de XP Rested inicializado');
        this.startAccumulationLoop();
    }
    
    // ============ ACCUMULATION ============
    
    /**
     * Acumular rested XP baseado no tempo de descanso
     */
    accumulateRestedXp(characterId, restState = 'offline', hours = null) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char) return null;
        
        // Se não especificou horas, calcula desde o último logout/save
        if (hours === null) {
            const lastActive = char.data?.lastSave || char.data?.lastLogout || Date.now();
            hours = (Date.now() - lastActive) / (1000 * 60 * 60);
        }
        
        if (hours <= 0 || restState === 'active') return null;
        
        const results = {};
        
        // Acumular para XP de combate
        results.combat = this.accumulateCombatRestedXp(char, restState, hours);
        
        // Acumular para profissões
        results.professions = this.accumulateProfessionRestedXp(char, restState, hours);
        
        // Salvar personagem
        char.data.lastRestedAccumulation = Date.now();
        char.save();
        
        return results;
    }
    
    accumulateCombatRestedXp(char, restState, hours) {
        const config = this.CONFIG.combat;
        const stateMultiplier = this.STATE_MULTIPLIERS[restState] || 1;
        
        // Calcular XP necessário para próximo level
        const currentLevel = char.data?.level || 1;
        const xpForNextLevel = this.calculateXpForLevel(currentLevel);
        
        // Calcular quanto acumula
        // 5% do XP do próximo level a cada 8h de descanso
        const eightHourBlocks = hours / 8;
        const baseAccumulation = xpForNextLevel * config.accumulationRate * eightHourBlocks;
        const finalAccumulation = Math.floor(baseAccumulation * stateMultiplier);
        
        // Cap máximo (1.5 levels)
        const maxRested = Math.floor(xpForNextLevel * config.maxCapMultiplier);
        
        // Adicionar ao existente
        const currentRested = char.data?.restedXp || 0;
        const newRested = Math.min(currentRested + finalAccumulation, maxRested);
        const actuallyAdded = newRested - currentRested;
        
        if (actuallyAdded > 0) {
            char.data.restedXp = newRested;
            this.notifyRestedAccumulation(char, 'combat', actuallyAdded, newRested, maxRested);
        }
        
        return {
            added: actuallyAdded,
            total: newRested,
            max: maxRested,
            percentage: (newRested / maxRested * 100).toFixed(1)
        };
    }
    
    accumulateProfessionRestedXp(char, restState, hours) {
        const config = this.CONFIG.profession;
        const stateMultiplier = this.STATE_MULTIPLIERS[restState] || 1;
        
        const results = {};
        
        // Para cada profissão
        if (!char.data.professionsRestedXp) {
            char.data.professionsRestedXp = {};
        }
        
        // Iterar sobre profissões conhecidas (15 profissões)
        const professionIds = [
            'mining', 'logging', 'harvesting', 'fishing', 'tracking',
            'smelting', 'weaving', 'carpentry', 'tanning', 'stonecutting',
            'weaponsmithing', 'armoring', 'engineering', 'alchemy', 'cooking'
        ];
        
        for (const profId of professionIds) {
            const profData = char.data?.professions?.[profId] || { level: 1 };
            const xpForNextLevel = this.calculateProfessionXpForLevel(profData.level);
            
            // Acumular mais rápido para profissões (10% a cada 8h)
            const eightHourBlocks = hours / 8;
            const baseAccumulation = xpForNextLevel * config.accumulationRate * eightHourBlocks;
            const finalAccumulation = Math.floor(baseAccumulation * stateMultiplier);
            
            const maxRested = Math.floor(xpForNextLevel * config.maxCapMultiplier);
            
            const currentRested = char.data.professionsRestedXp[profId] || 0;
            const newRested = Math.min(currentRested + finalAccumulation, maxRested);
            const actuallyAdded = newRested - currentRested;
            
            if (actuallyAdded > 0) {
                char.data.professionsRestedXp[profId] = newRested;
            }
            
            results[profId] = {
                added: actuallyAdded,
                total: newRested,
                max: maxRested
            };
        }
        
        // Notificar uma vez para todas
        const totalAdded = Object.values(results).reduce((sum, r) => sum + r.added, 0);
        if (totalAdded > 0) {
            this.notifyRestedAccumulation(char, 'profession', totalAdded, 0, 0);
        }
        
        return results;
    }
    
    // ============ CONSUMPTION ============
    
    /**
     * Aplicar rested XP ao ganhar XP normal
     * Retorna o XP final com bônus e quanto rested foi consumido
     */
    applyRestedXp(characterId, baseXp, type = 'combat', professionId = null) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char || baseXp <= 0) {
            return { finalXp: baseXp, restedConsumed: 0, restedRemaining: 0, bonusActive: false };
        }
        
        if (type === 'combat') {
            return this.applyCombatRestedXp(char, baseXp);
        } else if (type === 'profession' && professionId) {
            return this.applyProfessionRestedXp(char, baseXp, professionId);
        }
        
        return { finalXp: baseXp, restedConsumed: 0, restedRemaining: 0, bonusActive: false };
    }
    
    applyCombatRestedXp(char, baseXp) {
        const config = this.CONFIG.combat;
        const restedXp = char.data?.restedXp || 0;
        
        if (restedXp <= 0) {
            return { 
                finalXp: baseXp, 
                restedConsumed: 0, 
                restedRemaining: 0, 
                bonusActive: false,
                restedPercentage: 0 
            };
        }
        
        // Calcular quanto rested consumir
        const restedToConsume = Math.min(restedXp, baseXp * config.consumptionRate);
        
        // Calcular XP final (2x bônus)
        const finalXp = Math.floor(baseXp * config.bonusMultiplier);
        
        // Consumir rested XP
        char.data.restedXp = Math.max(0, restedXp - restedToConsume);
        
        // Calcular percentagem restante para UI
        const currentLevel = char.data?.level || 1;
        const xpForNextLevel = this.calculateXpForLevel(currentLevel);
        const maxRested = Math.floor(xpForNextLevel * config.maxCapMultiplier);
        const restedPercentage = (char.data.restedXp / maxRested * 100).toFixed(1);
        
        return {
            finalXp,
            restedConsumed: restedToConsume,
            restedRemaining: char.data.restedXp,
            bonusActive: true,
            restedPercentage
        };
    }
    
    applyProfessionRestedXp(char, baseXp, professionId) {
        const config = this.CONFIG.profession;
        
        if (!char.data?.professionsRestedXp?.[professionId]) {
            return { 
                finalXp: baseXp, 
                restedConsumed: 0, 
                restedRemaining: 0, 
                bonusActive: false 
            };
        }
        
        const restedXp = char.data.professionsRestedXp[professionId];
        
        if (restedXp <= 0) {
            return { 
                finalXp: baseXp, 
                restedConsumed: 0, 
                restedRemaining: 0, 
                bonusActive: false 
            };
        }
        
        const restedToConsume = Math.min(restedXp, baseXp * config.consumptionRate);
        const finalXp = Math.floor(baseXp * config.bonusMultiplier);
        
        char.data.professionsRestedXp[professionId] = Math.max(0, restedXp - restedToConsume);
        
        return {
            finalXp,
            restedConsumed: restedToConsume,
            restedRemaining: char.data.professionsRestedXp[professionId],
            bonusActive: true
        };
    }
    
    // ============ QUERIES ============
    
    getRestedStatus(characterId) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char) return null;
        
        const currentLevel = char.data?.level || 1;
        const xpForNextLevel = this.calculateXpForLevel(currentLevel);
        const combatConfig = this.CONFIG.combat;
        
        const combatRested = char.data?.restedXp || 0;
        const maxCombatRested = Math.floor(xpForNextLevel * combatConfig.maxCapMultiplier);
        
        return {
            combat: {
                current: combatRested,
                max: maxCombatRested,
                percentage: (combatRested / maxCombatRested * 100).toFixed(1),
                hasBonus: combatRested > 0,
                bonusMultiplier: combatRested > 0 ? combatConfig.bonusMultiplier : 1,
                // Quantos levels de rested XP (ex: 1.5 = 1 level e meio)
                levelsWorth: (combatRested / xpForNextLevel).toFixed(2)
            },
            professions: this.getProfessionsRestedStatus(char)
        };
    }
    
    getProfessionsRestedStatus(char) {
        if (!char.data?.professionsRestedXp) return {};
        
        const result = {};
        for (const [profId, rested] of Object.entries(char.data.professionsRestedXp)) {
            const profData = char.data?.professions?.[profId] || { level: 1 };
            const xpForNext = this.calculateProfessionXpForLevel(profData.level);
            const maxRested = Math.floor(xpForNext * this.CONFIG.profession.maxCapMultiplier);
            
            result[profId] = {
                current: rested,
                max: maxRested,
                percentage: (rested / maxRested * 100).toFixed(1),
                hasBonus: rested > 0,
                bonusMultiplier: rested > 0 ? this.CONFIG.profession.bonusMultiplier : 1
            };
        }
        
        return result;
    }
    
    // ============ CALCULATIONS ============
    
    calculateXpForLevel(level) {
        // XP curve similar ao WoW (exponencial)
        // Level 1 = 400 XP, Level 60 = ~200k XP
        if (level <= 1) return 400;
        return Math.floor(400 * Math.pow(1.1, level - 1));
    }
    
    calculateProfessionXpForLevel(level) {
        // Profissões usam sistema 1-200 (New World style)
        // XP curve mais suave
        return Math.floor(100 * Math.pow(1.05, level - 1));
    }
    
    // ============ TIMERS ============
    
    startAccumulationLoop() {
        // Verificar jogadores que ficaram off-line e acumular rested XP
        // Roda a cada 5 minutos
        setInterval(() => {
            this.processOfflineAccumulation();
        }, 5 * 60 * 1000);
    }
    
    processOfflineAccumulation() {
        // Implementar: verificar todos os personagens que fizeram logout
        // e acumular rested XP baseado no tempo off-line
        // (Requer integração com sistema de persistência)
    }
    
    // ============ NOTIFICATIONS ============
    
    notifyRestedAccumulation(char, type, added, total, max) {
        if (!char?.socket) return;
        
        char.socket.emit('rested_xp:accumulated', {
            type,
            amount: added,
            total,
            max,
            percentage: max > 0 ? (total / max * 100).toFixed(1) : 0
        });
    }
    
    notifyRestedConsumption(char, type, consumed, remaining) {
        if (!char?.socket) return;
        
        char.socket.emit('rested_xp:consumed', {
            type,
            consumed,
            remaining
        });
    }
    
    // ============ UTILITY METHODS ============
    
    /**
     * Chamado quando jogador entra em uma town/safe zone
     */
    onPlayerEnterTown(characterId) {
        // Marcar estado atual para acumulação acelerada
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (char) {
            char.data.restState = 'in_town';
            char.data.restStateStartTime = Date.now();
        }
    }
    
    /**
     * Chamado quando jogador sai da town
     */
    onPlayerLeaveTown(characterId) {
        // Calcular acumulação durante o tempo em town
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (char && char.data?.restState === 'in_town') {
            const timeInTown = (Date.now() - (char.data.restStateStartTime || Date.now())) / (1000 * 60 * 60);
            if (timeInTown > 0) {
                this.accumulateRestedXp(characterId, 'in_town', timeInTown);
            }
        }
        char.data.restState = 'active';
    }
    
    /**
     * Chamado quando jogador faz logout
     */
    onPlayerLogout(characterId) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (char) {
            char.data.lastLogout = Date.now();
            char.data.restState = 'offline';
            char.save();
        }
    }
    
    /**
     * Chamado quando jogador faz login
     */
    onPlayerLogin(characterId) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (char && char.data?.lastLogout) {
            const hoursOffline = (Date.now() - char.data.lastLogout) / (1000 * 60 * 60);
            
            if (hoursOffline >= 1) { // Mínimo 1 hora para acumular
                const accumulated = this.accumulateRestedXp(characterId, 'offline', hoursOffline);
                
                // Notificar jogador do que acumulou
                if (accumulated?.combat?.added > 0 || accumulated?.professions) {
                    this.showLoginRestedNotification(char, accumulated, hoursOffline);
                }
            }
        }
    }
    
    showLoginRestedNotification(char, accumulated, hoursOffline) {
        if (!char?.socket) return;
        
        const combat = accumulated.combat || {};
        const hasCombat = combat.added > 0;
        const hasProfessions = accumulated.professions && 
            Object.values(accumulated.professions).some(p => p.added > 0);
        
        char.socket.emit('rested_xp:login_notification', {
            hoursOffline: Math.floor(hoursOffline),
            combatXp: combat.added || 0,
            combatTotal: combat.total || 0,
            combatPercentage: combat.percentage || 0,
            hasProfessionBonus: hasProfessions,
            message: this.generateRestedMessage(hoursOffline, hasCombat, hasProfessions)
        });
    }
    
    generateRestedMessage(hours, hasCombat, hasProfessions) {
        if (hours < 8) {
            return `Você descansou por ${Math.floor(hours)} horas. XP Rested acumulado!`;
        } else if (hours < 24) {
            return `Bom descanso! Você acumulou XP Rested para acelerar seu progresso.`;
        } else {
            return `Você está bem descansado! Máximo de XP Rested acumulado.`;
        }
    }
}

module.exports = RestedXpSystem;
