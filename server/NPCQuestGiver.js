/**
 * NPCQuestGiver.js
 * Sistema de NPCs que dão quests do tipo "mate X mobs" (MVP - Passo 7)
 */

class NPCQuestGiver {
    constructor() {
        // Definir NPCs quest givers
        this.questNPCs = new Map();
        
        // Quests disponíveis por NPC
        this.npcQuests = new Map();
        
        // Progresso dos jogadores por quest
        this.playerQuestProgress = new Map(); // playerId -> { questId: { currentCount, completed } }
        
        this.initializeNPCs();
    }

    /**
     * Inicializa NPCs quest givers no mundo
     */
    initializeNPCs() {
        // NPC 1: Guarda da Vila (quests para iniciantes)
        this.questNPCs.set('guard_village', {
            id: 'guard_village',
            name: 'Guarda da Vila',
            x: 400,
            y: 300,
            color: '#1976D2',
            level: 1,
            dialogue: 'Olá aventureiro! Precisamos de ajuda para proteger a vila.',
            icon: '🛡️'
        });

        // NPC 2: Caçador da Floresta (quests de matar)
        this.questNPCs.set('hunter_forest', {
            id: 'hunter_forest',
            name: 'Caçador da Floresta',
            x: 600,
            y: 400,
            color: '#388E3C',
            level: 5,
            dialogue: 'As florestas estão cheias de criaturas perigosas. Ajude-me a caçá-las!',
            icon: '🏹'
        });

        // NPC 3: Sábio da Montanha (quests avançadas)
        this.questNPCs.set('sage_mountain', {
            id: 'sage_mountain',
            name: 'Sábio da Montanha',
            x: 900,
            y: 600,
            color: '#7B1FA2',
            level: 15,
            dialogue: 'As criaturas das montanhas ameaçam o equilíbrio. Derrote-as!',
            icon: '📜'
        });

        // Definir quests para cada NPC
        this.npcQuests.set('guard_village', [
            {
                id: 'kill_slimes_village',
                title: 'Limpeza da Vila',
                description: 'Mate 5 Slimes que estão invadindo a vila.',
                type: 'kill',
                targetMobType: 'slime',
                requiredCount: 5,
                minLevel: 1,
                rewards: {
                    xp: 50,
                    gold: 25,
                    items: [{ id: 'potion_small', name: 'Small Health Potion', quantity: 2 }]
                }
            },
            {
                id: 'kill_goblins_threat',
                title: 'Ameaça Goblin',
                description: 'Elimine 3 Goblins que estão atacando viajantes.',
                type: 'kill',
                targetMobType: 'goblin',
                requiredCount: 3,
                minLevel: 5,
                rewards: {
                    xp: 100,
                    gold: 50,
                    items: [{ id: 'sword_basic', name: 'Basic Sword', quantity: 1 }]
                }
            }
        ]);

        this.npcQuests.set('hunter_forest', [
            {
                id: 'kill_wolves_forest',
                title: 'Caça aos Lobos',
                description: 'Mate 4 Lobos que estão aterrorizando a floresta.',
                type: 'kill',
                targetMobType: 'wolf',
                requiredCount: 4,
                minLevel: 8,
                rewards: {
                    xp: 150,
                    gold: 80,
                    items: [{ id: 'potion_medium', name: 'Medium Health Potion', quantity: 3 }]
                }
            },
            {
                id: 'kill_spiders_nest',
                title: 'Ninho de Aranhas',
                description: 'Destrua 6 Aranhas Gigantes que infestam a floresta.',
                type: 'kill',
                targetMobType: 'spider',
                requiredCount: 6,
                minLevel: 4,
                rewards: {
                    xp: 80,
                    gold: 40,
                    items: [{ id: 'armor_leather', name: 'Leather Armor', quantity: 1 }]
                }
            }
        ]);

        this.npcQuests.set('sage_mountain', [
            {
                id: 'kill_orcs_mountain',
                title: 'Invasão Orc',
                description: 'Derrote 5 Orcs que ameaçam as montanhas.',
                type: 'kill',
                targetMobType: 'orc',
                requiredCount: 5,
                minLevel: 12,
                rewards: {
                    xp: 250,
                    gold: 150,
                    items: [
                        { id: 'potion_large', name: 'Large Health Potion', quantity: 2 },
                        { id: 'sword_steel', name: 'Steel Sword', quantity: 1 }
                    ]
                }
            },
            {
                id: 'kill_skeletons_crypt',
                title: 'Cripta Amaldiçoada',
                description: 'Elimine 8 Esqueletos que ressurgiram das profundezas.',
                type: 'kill',
                targetMobType: 'skeleton',
                requiredCount: 8,
                minLevel: 6,
                rewards: {
                    xp: 120,
                    gold: 60,
                    items: [{ id: 'shield_wooden', name: 'Wooden Shield', quantity: 1 }]
                }
            }
        ]);

        console.log('✅ NPCQuestGiver inicializado com', this.questNPCs.size, 'NPCs e', this.getTotalQuestCount(), 'quests');
    }

    /**
     * Retorna todos os NPCs quest givers
     */
    getAllNPCs() {
        return Array.from(this.questNPCs.values());
    }

    /**
     * Retorna um NPC específico
     */
    getNPC(npcId) {
        return this.questNPCs.get(npcId);
    }

    /**
     * Retorna quests disponíveis para um NPC específico
     */
    getAvailableQuests(npcId, playerLevel = 1) {
        const allQuests = this.npcQuests.get(npcId) || [];
        
        // Filtrar por nível mínimo
        return allQuests.filter(quest => quest.minLevel <= playerLevel);
    }

    /**
     * Jogador aceita uma quest
     */
    acceptQuest(playerId, questId, npcId) {
        const npc = this.getNPC(npcId);
        const quests = this.npcQuests.get(npcId) || [];
        const quest = quests.find(q => q.id === questId);
        
        if (!quest) {
            return { success: false, error: 'Quest não encontrada' };
        }
        
        // Verificar se já está ativa
        const playerProgress = this.getPlayerQuestProgress(playerId);
        if (playerProgress[questId]) {
            return { success: false, error: 'Quest já aceita' };
        }
        
        // Inicializar progresso
        playerProgress[questId] = {
            npcId: npcId,
            currentCount: 0,
            acceptedAt: Date.now(),
            completed: false,
            delivered: false
        };
        
        this.playerQuestProgress.set(playerId, playerProgress);
        
        console.log(`📜 Player ${playerId} aceitou quest "${quest.title}" de ${npc?.name}`);
        
        return {
            success: true,
            quest: {
                id: quest.id,
                title: quest.title,
                description: quest.description,
                targetMobType: quest.targetMobType,
                requiredCount: quest.requiredCount,
                currentCount: 0
            }
        };
    }

    /**
     * Atualiza progresso quando jogador mata um mob
     */
    updateKillProgress(playerId, mobType) {
        const playerProgress = this.getPlayerQuestProgress(playerId);
        let updated = false;
        
        for (const [questId, progress] of Object.entries(playerProgress)) {
            if (progress.completed || progress.delivered) continue;
            
            // Encontrar quest
            const quest = this.findQuestById(questId);
            if (!quest) continue;
            
            // Verificar se é quest do tipo kill e alvo correto
            if (quest.type === 'kill' && quest.targetMobType === mobType) {
                progress.currentCount = Math.min(quest.requiredCount, progress.currentCount + 1);
                updated = true;
                
                console.log(`📜 Quest progress: ${quest.title} = ${progress.currentCount}/${quest.requiredCount}`);
                
                // Verificar se completou
                if (progress.currentCount >= quest.requiredCount) {
                    progress.completed = true;
                    console.log(`✅ Quest "${quest.title}" completada por ${playerId}!`);
                }
            }
        }
        
        if (updated) {
            this.playerQuestProgress.set(playerId, playerProgress);
        }
        
        return updated;
    }

    /**
     * Jogador entrega quest completada
     */
    deliverQuest(playerId, questId) {
        const playerProgress = this.getPlayerQuestProgress(playerId);
        const progress = playerProgress[questId];
        
        if (!progress) {
            return { success: false, error: 'Quest não encontrada' };
        }
        
        if (!progress.completed) {
            return { success: false, error: 'Quest não completada' };
        }
        
        if (progress.delivered) {
            return { success: false, error: 'Quest já entregue' };
        }
        
        const quest = this.findQuestById(questId);
        if (!quest) {
            return { success: false, error: 'Quest inválida' };
        }
        
        progress.delivered = true;
        
        console.log(`🎉 Player ${playerId} entregou quest "${quest.title}"!`);
        
        return {
            success: true,
            rewards: quest.rewards
        };
    }

    /**
     * Retorna todas as quests ativas de um jogador
     */
    getPlayerActiveQuests(playerId) {
        const playerProgress = this.getPlayerQuestProgress(playerId);
        const activeQuests = [];
        
        for (const [questId, progress] of Object.entries(playerProgress)) {
            if (progress.delivered) continue;
            
            const quest = this.findQuestById(questId);
            if (!quest) continue;
            
            activeQuests.push({
                id: quest.id,
                title: quest.title,
                description: quest.description,
                type: quest.type,
                targetMobType: quest.targetMobType,
                requiredCount: quest.requiredCount,
                currentCount: progress.currentCount,
                completed: progress.completed,
                npcId: progress.npcId,
                rewards: quest.rewards
            });
        }
        
        return activeQuests;
    }

    /**
     * Helper: Retorna progresso do jogador
     */
    getPlayerQuestProgress(playerId) {
        return this.playerQuestProgress.get(playerId) || {};
    }

    /**
     * Helper: Encontra quest por ID
     */
    findQuestById(questId) {
        for (const quests of this.npcQuests.values()) {
            const quest = quests.find(q => q.id === questId);
            if (quest) return quest;
        }
        return null;
    }

    /**
     * Helper: Conta total de quests
     */
    getTotalQuestCount() {
        let count = 0;
        for (const quests of this.npcQuests.values()) {
            count += quests.length;
        }
        return count;
    }

    /**
     * Verifica se jogador pode interagir com NPC (distância)
     */
    canInteractWithNPC(playerX, playerY, npcId, maxDistance = 80) {
        const npc = this.getNPC(npcId);
        if (!npc) return false;
        
        const dx = playerX - npc.x;
        const dy = playerY - npc.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= maxDistance;
    }

    /**
     * Retorna NPCs próximos a uma posição
     */
    getNPCsNearPosition(x, y, radius = 100) {
        return this.getAllNPCs().filter(npc => {
            const dx = npc.x - x;
            const dy = npc.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        });
    }
}

module.exports = NPCQuestGiver;
