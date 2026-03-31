/**
 * 🆕 Subagentes Especializados Expandidos
 * Novos tipos de agentes para sistemas específicos do jogo
 */

/**
 * 📜 SUBAGENTE: QUESTS
 * Especializado em análise de missões e progressão de quests
 */
class QuestAgent {
    constructor() {
        this.name = 'quest';
        this.description = 'Análise de sistema de missões e quests';
        this.capabilities = ['quest_analysis', 'progression_tracking', 'objective_validation', 'reward_balance'];
        this.questHistory = [];
        this.completionStats = new Map();
    }

    async analyze(projectPath) {
        console.log('📜 Analisando sistema de quests...');

        const issues = [];
        const suggestions = [];
        const metrics = {};

        // Analisar QuestSystem
        const questAnalysis = this.analyzeQuestSystem();
        issues.push(...questAnalysis.issues);
        suggestions.push(...questAnalysis.suggestions);
        metrics.questCount = questAnalysis.questCount;
        metrics.completionRate = questAnalysis.completionRate;

        // Analisar balanceamento de recompensas
        const rewardAnalysis = this.analyzeRewardBalance();
        if (rewardAnalysis.issues.length > 0) {
            issues.push(...rewardAnalysis.issues);
        }

        // Analisar fluxo de quests
        const flowAnalysis = this.analyzeQuestFlow();
        suggestions.push(...flowAnalysis.suggestions);

        return {
            agent: 'quest',
            status: 'completed',
            issues,
            suggestions,
            metrics: {
                questScore: this.calculateQuestScore(),
                balanceScore: rewardAnalysis.score,
                flowScore: flowAnalysis.score,
                ...metrics
            }
        };
    }

    analyzeQuestSystem() {
        const issues = [];
        const suggestions = [];
        let questCount = 0;
        let completionRate = 0;

        // Verificar QuestSystem
        if (!window.QuestSystem) {
            issues.push({
                type: 'missing_system',
                description: 'QuestSystem não encontrado',
                severity: 'high',
                fix: 'Implementar QuestSystem em quest-system.js'
            });
        } else {
            // Contar quests
            if (window.questSystem) {
                questCount = window.questSystem.quests ? window.questSystem.quests.size : 0;
                
                // Verificar quests ativas
                const activeQuests = window.questSystem.activeQuests;
                if (!activeQuests || activeQuests.length === 0) {
                    suggestions.push('Nenhuma quest ativa - considerar auto-iniciar tutorial');
                }
            }
        }

        // Verificar integração com GameplayEngine
        if (window._gameplayEngine && !window._gameplayEngine.questSystem) {
            issues.push({
                type: 'integration_error',
                description: 'QuestSystem não integrado ao GameplayEngine',
                severity: 'medium',
                fix: 'Adicionar this.questSystem no constructor do GameplayEngine'
            });
        }

        return { issues, suggestions, questCount, completionRate };
    }

    analyzeRewardBalance() {
        const issues = [];
        let score = 100;

        // Analisar balanceamento de XP
        if (window.questSystem && window.questSystem.quests) {
            for (const [id, quest] of window.questSystem.quests) {
                if (quest.rewards) {
                    // Verificar se recompensa é adequada para o nível
                    const expectedXP = 100 * (quest.level || 1);
                    const actualXP = quest.rewards.exp || 0;
                    
                    if (actualXP < expectedXP * 0.5) {
                        issues.push({
                            type: 'under_rewarded',
                            description: `Quest ${id} tem recompensa de XP muito baixa (${actualXP} vs ${expectedXP} esperado)`,
                            severity: 'low',
                            fix: `Aumentar exp para ${expectedXP}`
                        });
                        score -= 5;
                    }
                }
            }
        }

        return { issues, score: Math.max(0, score) };
    }

    analyzeQuestFlow() {
        const suggestions = [];
        let score = 100;

        // Verificar se há gaps na progressão
        if (window.questSystem && window.questSystem.quests) {
            const quests = Array.from(window.questSystem.quests.values());
            
            // Verificar sequência de níveis
            const levels = quests.map(q => q.level).sort((a, b) => a - b);
            for (let i = 1; i < levels.length; i++) {
                const gap = levels[i] - levels[i-1];
                if (gap > 3) {
                    suggestions.push(`Gap de ${gap} níveis entre quests - adicionar conteúdo intermediário`);
                    score -= 10;
                }
            }
        }

        return { suggestions, score: Math.max(0, score) };
    }

    calculateQuestScore() {
        // Calcular score baseado na completude do sistema
        let score = 70;

        if (window.QuestSystem) score += 10;
        if (window.questSystem) score += 10;
        if (window.questSystem && window.questSystem.quests && window.questSystem.quests.size > 0) {
            score += Math.min(10, window.questSystem.quests.size);
        }

        return Math.min(100, score);
    }

    // Métodos para integração em tempo real
    recordQuestStart(questId) {
        this.questHistory.push({
            type: 'start',
            questId,
            timestamp: Date.now()
        });
    }

    recordQuestComplete(questId, rewards) {
        this.questHistory.push({
            type: 'complete',
            questId,
            rewards,
            timestamp: Date.now()
        });

        // Atualizar estatísticas
        const current = this.completionStats.get(questId) || { attempts: 0, completions: 0 };
        current.completions++;
        this.completionStats.set(questId, current);
    }

    getQuestAnalytics() {
        const totalStarted = this.questHistory.filter(h => h.type === 'start').length;
        const totalCompleted = this.questHistory.filter(h => h.type === 'complete').length;
        const completionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

        return {
            totalStarted,
            totalCompleted,
            completionRate: Math.round(completionRate),
            averageCompletionTime: this.calculateAverageCompletionTime()
        };
    }

    calculateAverageCompletionTime() {
        const completions = this.questHistory.filter(h => h.type === 'complete');
        const starts = this.questHistory.filter(h => h.type === 'start');
        
        if (completions.length === 0) return 0;

        let totalTime = 0;
        completions.forEach(complete => {
            const start = starts.find(s => s.questId === complete.questId && s.timestamp < complete.timestamp);
            if (start) {
                totalTime += complete.timestamp - start.timestamp;
            }
        });

        return Math.round(totalTime / completions.length / 1000); // em segundos
    }
}

/**
 * 🗺️ SUBAGENTE: ZONAS
 * Especializado em análise de zonas, mapas e ambientes
 */
class ZoneAgent {
    constructor() {
        this.name = 'zone';
        this.description = 'Análise de zonas e sistema de mapas';
        this.capabilities = ['zone_analysis', 'mob_distribution', 'transition_validation', 'theme_consistency'];
        this.zoneVisits = new Map();
        this.transitionHistory = [];
    }

    async analyze(projectPath) {
        console.log('🗺️ Analisando sistema de zonas...');

        const issues = [];
        const suggestions = [];

        // Analisar ZoneSystem
        const zoneAnalysis = this.analyzeZoneSystem();
        issues.push(...zoneAnalysis.issues);
        suggestions.push(...zoneAnalysis.suggestions);

        // Analisar distribuição de mobs
        const mobDistribution = this.analyzeMobDistribution();
        if (mobDistribution.issues.length > 0) {
            issues.push(...mobDistribution.issues);
        }

        // Analisar transições
        const transitionAnalysis = this.analyzeTransitions();
        suggestions.push(...transitionAnalysis.suggestions);

        return {
            agent: 'zone',
            status: 'completed',
            issues,
            suggestions,
            metrics: {
                zoneScore: zoneAnalysis.score,
                mobScore: mobDistribution.score,
                transitionScore: transitionAnalysis.score,
                zoneCount: zoneAnalysis.zoneCount,
                totalMobs: mobDistribution.totalMobs
            }
        };
    }

    analyzeZoneSystem() {
        const issues = [];
        const suggestions = [];
        let score = 100;
        let zoneCount = 0;

        if (!window.ZoneSystem) {
            issues.push({
                type: 'missing_system',
                description: 'ZoneSystem não encontrado',
                severity: 'high',
                fix: 'Implementar ZoneSystem em zone-system.js'
            });
            score = 0;
        } else if (window.zoneSystem) {
            zoneCount = window.zoneSystem.zones ? window.zoneSystem.zones.size : 0;

            if (zoneCount === 0) {
                issues.push({
                    type: 'no_zones',
                    description: 'Nenhuma zona definida',
                    severity: 'high',
                    fix: 'Adicionar zonas ao ZoneSystem'
                });
                score -= 50;
            } else if (zoneCount < 3) {
                suggestions.push(`Apenas ${zoneCount} zona(s) - considerar adicionar mais variedade`);
                score -= 20;
            }

            // Verificar temas
            for (const [id, zone] of window.zoneSystem.zones) {
                if (!zone.theme) {
                    issues.push({
                        type: 'missing_theme',
                        description: `Zona ${id} não tem tema definido`,
                        severity: 'medium',
                        fix: 'Adicionar propriedade theme à zona'
                    });
                    score -= 10;
                }
            }
        }

        return { issues, suggestions, score: Math.max(0, score), zoneCount };
    }

    analyzeMobDistribution() {
        const issues = [];
        let score = 100;
        let totalMobs = 0;

        if (window.zoneSystem && window.zoneSystem.zones) {
            for (const [id, zone] of window.zoneSystem.zones) {
                if (zone.spawns && zone.spawns.mobs) {
                    const mobCount = zone.spawns.mobs.reduce((sum, m) => sum + m.count, 0);
                    totalMobs += mobCount;

                    // Verificar densidade de mobs
                    const area = zone.size ? (zone.size.width * zone.size.height) : 1000000;
                    const density = mobCount / (area / 10000); // mobs por 10k pixels

                    if (density < 0.5) {
                        issues.push({
                            type: 'low_density',
                            description: `Zona ${id} tem poucos mobs (${mobCount}) para sua área`,
                            severity: 'low',
                            fix: 'Adicionar mais spawn points de mobs'
                        });
                        score -= 5;
                    }
                }
            }
        }

        return { issues, score: Math.max(0, score), totalMobs };
    }

    analyzeTransitions() {
        const suggestions = [];
        let score = 100;

        if (window.zoneSystem && window.zoneSystem.zones) {
            for (const [id, zone] of window.zoneSystem.zones) {
                if (!zone.transitions || zone.transitions.length === 0) {
                    if (zone.levelRange && zone.levelRange.max < 30) {
                        suggestions.push(`Zona ${id} não tem transições - adicionar conexão com próxima zona`);
                        score -= 15;
                    }
                }
            }
        }

        return { suggestions, score: Math.max(0, score) };
    }

    // Métodos para integração em tempo real
    recordZoneVisit(zoneId, playerLevel) {
        const visits = this.zoneVisits.get(zoneId) || [];
        visits.push({
            timestamp: Date.now(),
            playerLevel
        });
        this.zoneVisits.set(zoneId, visits);
    }

    recordZoneTransition(fromZone, toZone, playerLevel) {
        this.transitionHistory.push({
            from: fromZone,
            to: toZone,
            playerLevel,
            timestamp: Date.now()
        });
    }

    getZoneAnalytics() {
        const analytics = {};
        
        for (const [zoneId, visits] of this.zoneVisits) {
            analytics[zoneId] = {
                visitCount: visits.length,
                averagePlayerLevel: visits.reduce((sum, v) => sum + v.playerLevel, 0) / visits.length,
                lastVisit: visits[visits.length - 1]?.timestamp
            };
        }

        return analytics;
    }

    getPopularZones() {
        const sorted = Array.from(this.zoneVisits.entries())
            .sort((a, b) => b[1].length - a[1].length);
        
        return sorted.slice(0, 3).map(([zoneId, visits]) => ({
            zoneId,
            visits: visits.length
        }));
    }
}

/**
 * 📈 SUBAGENTE: PROGRESSÃO
 * Especializado em análise de sistema de níveis e progressão
 */
class ProgressionAgent {
    constructor() {
        this.name = 'progression';
        this.description = 'Análise de sistema de níveis e progressão de personagem';
        this.capabilities = ['level_balance', 'xp_curve', 'stat_progression', 'ability_unlocks'];
        this.levelHistory = [];
    }

    async analyze(projectPath) {
        console.log('📈 Analisando sistema de progressão...');

        const issues = [];
        const suggestions = [];

        // Analisar ProgressionSystem
        const progressionAnalysis = this.analyzeProgressionSystem();
        issues.push(...progressionAnalysis.issues);
        suggestions.push(...progressionAnalysis.suggestions);

        // Analisar curva de XP
        const xpCurveAnalysis = this.analyzeXPCurve();
        if (xpCurveAnalysis.issues.length > 0) {
            issues.push(...xpCurveAnalysis.issues);
        }

        // Analisar balanceamento de classes
        const classBalance = this.analyzeClassBalance();
        suggestions.push(...classBalance.suggestions);

        return {
            agent: 'progression',
            status: 'completed',
            issues,
            suggestions,
            metrics: {
                progressionScore: progressionAnalysis.score,
                xpCurveScore: xpCurveAnalysis.score,
                balanceScore: classBalance.score,
                maxLevel: progressionAnalysis.maxLevel
            }
        };
    }

    analyzeProgressionSystem() {
        const issues = [];
        const suggestions = [];
        let score = 100;
        let maxLevel = 10;

        if (!window.ProgressionSystem) {
            issues.push({
                type: 'missing_system',
                description: 'ProgressionSystem não encontrado',
                severity: 'high',
                fix: 'Implementar ProgressionSystem em progression-system.js'
            });
            score = 0;
        } else if (window.progressionSystem) {
            // Verificar thresholds
            const thresholds = window.progressionSystem.levelThresholds;
            if (!thresholds || Object.keys(thresholds).length === 0) {
                issues.push({
                    type: 'missing_thresholds',
                    description: 'Thresholds de nível não definidos',
                    severity: 'high',
                    fix: 'Gerar levelThresholds no constructor'
                });
                score -= 40;
            } else {
                maxLevel = Object.keys(thresholds).length;
            }

            // Verificar bônus de stats
            const statBonuses = window.progressionSystem.statBonuses;
            if (!statBonuses || Object.keys(statBonuses).length === 0) {
                issues.push({
                    type: 'missing_stats',
                    description: 'Bônus de stats por classe não definidos',
                    severity: 'medium',
                    fix: 'Definir statBonuses para cada classe'
                });
                score -= 20;
            }
        }

        return { issues, suggestions, score: Math.max(0, score), maxLevel };
    }

    analyzeXPCurve() {
        const issues = [];
        let score = 100;

        if (window.progressionSystem && window.progressionSystem.levelThresholds) {
            const thresholds = window.progressionSystem.levelThresholds;
            const levels = Object.keys(thresholds).map(Number).sort((a, b) => a - b);

            // Verificar se curva é muito íngreme
            for (let i = 1; i < Math.min(levels.length, 10); i++) {
                const ratio = thresholds[levels[i]] / thresholds[levels[i-1]];
                if (ratio > 2.0) {
                    issues.push({
                        type: 'steep_curve',
                        description: `Curva de XP muito íngreme entre níveis ${levels[i-1]} e ${levels[i]} (${ratio.toFixed(2)}x)`,
                        severity: 'medium',
                        fix: 'Reduzir multiplicador de XP'
                    });
                    score -= 10;
                    break; // Reportar apenas uma vez
                }
            }
        }

        return { issues, score: Math.max(0, score) };
    }

    analyzeClassBalance() {
        const suggestions = [];
        let score = 100;

        if (window.progressionSystem && window.progressionSystem.statBonuses) {
            const classes = Object.keys(window.progressionSystem.statBonuses);
            
            if (classes.length < 4) {
                suggestions.push(`Apenas ${classes.length} classes definidas - considerar adicionar mais variedade`);
                score -= 15;
            }

            // Verificar se todas as classes têm stats definidos
            classes.forEach(className => {
                const stats = window.progressionSystem.statBonuses[className];
                if (!stats.baseStats || !stats.perLevel) {
                    suggestions.push(`Classe ${className} não tem stats completos`);
                    score -= 10;
                }
            });
        }

        return { suggestions, score: Math.max(0, score) };
    }

    // Métodos para integração em tempo real
    recordLevelUp(characterClass, oldLevel, newLevel, timeSpent) {
        this.levelHistory.push({
            characterClass,
            oldLevel,
            newLevel,
            timeSpent,
            timestamp: Date.now()
        });
    }

    getProgressionAnalytics() {
        if (this.levelHistory.length === 0) return null;

        const avgTimePerLevel = this.levelHistory.reduce((sum, h) => sum + h.timeSpent, 0) / this.levelHistory.length;
        const byClass = {};

        this.levelHistory.forEach(h => {
            if (!byClass[h.characterClass]) {
                byClass[h.characterClass] = { count: 0, avgTime: 0 };
            }
            byClass[h.characterClass].count++;
            byClass[h.characterClass].avgTime += h.timeSpent;
        });

        // Calcular médias
        for (const cls in byClass) {
            byClass[cls].avgTime = Math.round(byClass[cls].avgTime / byClass[cls].count);
        }

        return {
            totalLevelUps: this.levelHistory.length,
            averageTimePerLevel: Math.round(avgTimePerLevel),
            byClass,
            fastestLevelUp: Math.min(...this.levelHistory.map(h => h.timeSpent)),
            slowestLevelUp: Math.max(...this.levelHistory.map(h => h.timeSpent))
        };
    }
}

/**
 * 👥 SUBAGENTE: NPCs
 * Especializado em análise de NPCs e interações
 */
class NPCAgent {
    constructor() {
        this.name = 'npc';
        this.description = 'Análise de NPCs e sistema de interação';
        this.capabilities = ['npc_analysis', 'dialog_validation', 'shop_balance', 'interaction_flow'];
        this.interactionHistory = [];
    }

    async analyze(projectPath) {
        console.log('👥 Analisando sistema de NPCs...');

        const issues = [];
        const suggestions = [];

        // Analisar NPCSystem
        const npcAnalysis = this.analyzeNPCSystem();
        issues.push(...npcAnalysis.issues);
        suggestions.push(...npcAnalysis.suggestions);

        // Analisar diálogos
        const dialogAnalysis = this.analyzeDialogs();
        if (dialogAnalysis.issues.length > 0) {
            issues.push(...dialogAnalysis.issues);
        }

        // Analisar shops
        const shopAnalysis = this.analyzeShops();
        suggestions.push(...shopAnalysis.suggestions);

        return {
            agent: 'npc',
            status: 'completed',
            issues,
            suggestions,
            metrics: {
                npcScore: npcAnalysis.score,
                dialogScore: dialogAnalysis.score,
                shopScore: shopAnalysis.score,
                npcCount: npcAnalysis.npcCount,
                vendorCount: npcAnalysis.vendorCount
            }
        };
    }

    analyzeNPCSystem() {
        const issues = [];
        const suggestions = [];
        let score = 100;
        let npcCount = 0;
        let vendorCount = 0;

        if (!window.NPCSystem) {
            issues.push({
                type: 'missing_system',
                description: 'NPCSystem não encontrado',
                severity: 'high',
                fix: 'Implementar NPCSystem em npc-system.js'
            });
            score = 0;
        } else if (window.npcSystem) {
            npcCount = window.npcSystem.npcs ? window.npcSystem.npcs.size : 0;

            if (npcCount === 0) {
                issues.push({
                    type: 'no_npcs',
                    description: 'Nenhum NPC definido',
                    severity: 'high',
                    fix: 'Adicionar NPCs ao NPCSystem'
                });
                score -= 50;
            } else if (npcCount < 3) {
                suggestions.push(`Apenas ${npcCount} NPC(s) - mundo pode parecer vazio`);
                score -= 15;
            }

            // Contar vendors
            for (const [id, npc] of window.npcSystem.npcs) {
                if (npc.type === 'vendor') {
                    vendorCount++;
                }
            }

            if (vendorCount === 0) {
                suggestions.push('Nenhum vendor no jogo - adicionar sistema de comércio');
                score -= 10;
            }
        }

        return { issues, suggestions, score: Math.max(0, score), npcCount, vendorCount };
    }

    analyzeDialogs() {
        const issues = [];
        let score = 100;

        if (window.npcSystem && window.npcSystem.npcs) {
            for (const [id, npc] of window.npcSystem.npcs) {
                if (!npc.dialog) {
                    issues.push({
                        type: 'missing_dialog',
                        description: `NPC ${id} não tem diálogo definido`,
                        severity: 'medium',
                        fix: 'Adicionar propriedade dialog ao NPC'
                    });
                    score -= 10;
                }
            }
        }

        return { issues, score: Math.max(0, score) };
    }

    analyzeShops() {
        const suggestions = [];
        let score = 100;

        if (window.npcSystem && window.npcSystem.npcs) {
            for (const [id, npc] of window.npcSystem.npcs) {
                if (npc.type === 'vendor') {
                    if (!npc.inventory || npc.inventory.length === 0) {
                        suggestions.push(`Vendor ${id} não tem inventário`);
                        score -= 15;
                    } else if (npc.inventory.length < 3) {
                        suggestions.push(`Vendor ${id} tem poucos itens (${npc.inventory.length})`);
                        score -= 5;
                    }
                }
            }
        }

        return { suggestions, score: Math.max(0, score) };
    }

    // Métodos para integração em tempo real
    recordInteraction(npcId, npcType, playerLevel) {
        this.interactionHistory.push({
            npcId,
            npcType,
            playerLevel,
            timestamp: Date.now()
        });
    }

    getNPCAnalytics() {
        const byNPC = {};
        const byType = {};

        this.interactionHistory.forEach(interaction => {
            // Por NPC
            if (!byNPC[interaction.npcId]) {
                byNPC[interaction.npcId] = { count: 0, levels: [] };
            }
            byNPC[interaction.npcId].count++;
            byNPC[interaction.npcId].levels.push(interaction.playerLevel);

            // Por tipo
            if (!byType[interaction.npcType]) {
                byType[interaction.npcType] = 0;
            }
            byType[interaction.npcType]++;
        });

        // Calcular médias
        for (const npcId in byNPC) {
            const levels = byNPC[npcId].levels;
            byNPC[npcId].avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
            delete byNPC[npcId].levels;
        }

        return { byNPC, byType };
    }

    getMostVisitedNPC() {
        const analytics = this.getNPCAnalytics();
        const sorted = Object.entries(analytics.byNPC)
            .sort((a, b) => b[1].count - a[1].count);
        
        return sorted.length > 0 ? { npcId: sorted[0][0], visits: sorted[0][1].count } : null;
    }
}

// Exportar novos agentes
if (typeof window !== 'undefined') {
    window.QuestAgent = QuestAgent;
    window.ZoneAgent = ZoneAgent;
    window.ProgressionAgent = ProgressionAgent;
    window.NPCAgent = NPCAgent;
}

console.log('🆕 Subagentes especializados carregados:');
console.log('  📜 QuestAgent - Análise de missões');
console.log('  🗺️ ZoneAgent - Análise de zonas');
console.log('  📈 ProgressionAgent - Análise de progressão');
console.log('  👥 NPCAgent - Análise de NPCs');

export { QuestAgent, ZoneAgent, ProgressionAgent, NPCAgent };
