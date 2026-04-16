/**
 * QuestModule.js
 * Módulo de quests do servidor MMORPG
 * Responsabilidade: Gerenciar quests, progresso e recompensas
 */

class QuestModule {
    constructor(server) {
        this.server = server;
        
        // Quest Database (em memória)
        this.questDatabase = new Map([
            ['kill_rats_1', {
                id: 'kill_rats_1',
                name: 'Exterminio de Ratos',
                title: 'Exterminio de Ratos',
                description: 'Mate 5 ratos na area inicial.',
                type: 'kill',
                targetMobType: 'rat',
                requiredCount: 5,
                rewards: { xp: 50, gold: 10 }
            }],
            ['kill_slimes_1', {
                id: 'kill_slimes_1',
                name: 'Caca as Gosmas',
                title: 'Caca as Gosmas',
                description: 'Mate 3 slimes.',
                type: 'kill',
                targetMobType: 'slime',
                requiredCount: 3,
                rewards: { xp: 75, gold: 15 }
            }]
        ]);
        
        // Active quests por player (socketId -> { questId -> progress })
        this.playerQuests = new Map();
    }

    /**
     * Handle quest giver interaction
     */
    handleQuestGiverInteract(socket, data) {
        const playerId = socket.id;
        const npcId = data.npcId;
        
        console.log(`📜 Quest giver interact: ${npcId} by player ${playerId}`);
        
        // Retornar lista de quests disponíveis para este NPC
        const availableQuests = this.getAvailableQuestsForNPC(npcId, playerId);
        
        socket.emit('quest:list', {
            npcId: npcId,
            quests: availableQuests
        });
    }

    /**
     * Handle quest accept
     */
    handleQuestAccept(socket, data) {
        const playerId = socket.id;
        const questId = data.questId;
        
        console.log(`📜 Quest accept: ${questId} by player ${playerId}`);
        
        const quest = this.questDatabase.get(questId);
        if (!quest) {
            socket.emit('quest:accepted', {
                success: false,
                error: 'Quest not found'
            });
            return;
        }
        
        // Inicializar quests do jogador se não existir
        if (!this.playerQuests.has(playerId)) {
            this.playerQuests.set(playerId, new Map());
        }
        
        const playerQuestMap = this.playerQuests.get(playerId);
        
        // Verificar se já tem esta quest ativa
        if (playerQuestMap.has(questId)) {
            socket.emit('quest:accepted', {
                success: false,
                error: 'Quest already active'
            });
            return;
        }
        
        // Criar progresso da quest
        const questProgress = {
            questId: questId,
            currentCount: 0,
            requiredCount: quest.requiredCount,
            status: 'active',
            acceptedAt: Date.now()
        };
        
        playerQuestMap.set(questId, questProgress);
        
        // Atualizar jogador
        const player = this.server.players.get(playerId);
        if (player) {
            player.activeQuests = player.activeQuests || [];
            player.activeQuests.push({
                id: questId,
                name: quest.name,
                progress: questProgress
            });
        }
        
        socket.emit('quest:accepted', {
            success: true,
            questId: questId,
            questTitle: quest.title,
            activeQuests: Array.from(playerQuestMap.values())
        });
        
        console.log(`✅ Quest ${questId} accepted by ${playerId}`);
    }

    /**
     * Handle quest complete
     */
    handleQuestComplete(socket, data) {
        const playerId = socket.id;
        const questId = data.questId;
        
        console.log(`📜 Quest complete attempt: ${questId} by player ${playerId}`);
        
        const playerQuestMap = this.playerQuests.get(playerId);
        if (!playerQuestMap || !playerQuestMap.has(questId)) {
            socket.emit('quest:completed', {
                success: false,
                error: 'Quest not found or not active'
            });
            return;
        }
        
        const questProgress = playerQuestMap.get(questId);
        const quest = this.questDatabase.get(questId);
        
        // Verificar se completou
        if (questProgress.currentCount < questProgress.requiredCount) {
            socket.emit('quest:completed', {
                success: false,
                error: 'Quest not completed yet',
                progress: questProgress
            });
            return;
        }
        
        // Completar quest
        this.completePlayerQuest(socket, questId);
    }

    /**
     * Completar quest do jogador
     */
    completePlayerQuest(socket, questId) {
        const playerId = socket.id;
        const player = this.server.players.get(playerId);
        const playerQuestMap = this.playerQuests.get(playerId);
        const quest = this.questDatabase.get(questId);
        
        if (!player || !playerQuestMap || !quest) return;
        
        const questProgress = playerQuestMap.get(questId);
        
        // Dar recompensas
        const rewards = quest.rewards;
        
        // XP
        if (rewards.xp) {
            const xpResult = this.server.playerDataManager?.grantXpToPlayer(player, rewards.xp);
            if (xpResult && socket) {
                socket.emit('player:xp_gain', xpResult);
            }
        }
        
        // Gold
        if (rewards.gold) {
            player.gold = (player.gold || 0) + rewards.gold;
        }
        
        // Mover para completadas
        playerQuestMap.delete(questId);
        player.completedQuests = player.completedQuests || [];
        player.completedQuests.push({
            id: questId,
            completedAt: Date.now()
        });
        
        // Remover de activeQuests
        if (player.activeQuests) {
            player.activeQuests = player.activeQuests.filter(q => q.id !== questId);
        }
        
        // Notificar jogador
        socket.emit('quest:completed', {
            success: true,
            questId: questId,
            questTitle: quest.title,
            rewards: rewards,
            activeQuests: Array.from(playerQuestMap.values()),
            completedQuests: player.completedQuests
        });
        
        // Enviar recompensa detalhada
        socket.emit('quest:reward', {
            questId: questId,
            title: quest.title,
            xp: rewards.xp || 0,
            coins: rewards.gold || 0,
            items: rewards.items || []
        });
        
        console.log(`🎉 Quest ${questId} completed by ${player.name}`);
    }

    /**
     * Atualizar progresso de quest v2
     */
    updateQuestProgressV2(playerId, mobType) {
        const playerQuestMap = this.playerQuests.get(playerId);
        if (!playerQuestMap) return;
        
        // Encontrar quest ativa que requer este tipo de mob
        for (const [questId, progress] of playerQuestMap) {
            const quest = this.questDatabase.get(questId);
            if (!quest || quest.type !== 'kill') continue;
            if (quest.targetMobType !== mobType) continue;
            
            // Incrementar progresso
            progress.currentCount = Math.min(progress.currentCount + 1, progress.requiredCount);
            
            console.log(`📊 Quest ${questId} progress: ${progress.currentCount}/${progress.requiredCount}`);
            
            // Notificar jogador
            const socket = this.server.io.sockets.sockets.get(playerId);
            if (socket) {
                socket.emit('quest:progress_sync', {
                    questId: questId,
                    currentCount: progress.currentCount,
                    requiredCount: progress.requiredCount,
                    mobType: mobType
                });
            }
            
            // Auto-completar se atingiu o objetivo
            if (progress.currentCount >= quest.requiredCount) {
                console.log(`🎯 Quest ${questId} objective reached!`);
                if (socket) {
                    this.completePlayerQuest(socket, questId);
                }
            }
        }
        
        // Atualizar activeQuests do jogador
        const player = this.server.players.get(playerId);
        if (player && player.activeQuests) {
            const activeQuest = player.activeQuests.find(q => {
                const qData = this.questDatabase.get(q.id);
                return qData && qData.targetMobType === mobType;
            });
            
            if (activeQuest) {
                activeQuest.progress.currentCount = Math.min(
                    activeQuest.progress.currentCount + 1,
                    activeQuest.progress.requiredCount
                );
            }
        }
    }

    /**
     * Retornar quests disponíveis para um NPC
     */
    getAvailableQuestsForNPC(npcId, playerId) {
        const available = [];
        const playerQuestMap = this.playerQuests.get(playerId) || new Map();
        const player = this.server.players.get(playerId);
        const completedQuests = player?.completedQuests || [];
        
        // Para simplificar, todos os NPCs oferecem todas as quests
        // Na versão completa, filtrar por NPC específico
        for (const [questId, quest] of this.questDatabase) {
            // Verificar se já está ativa
            if (playerQuestMap.has(questId)) continue;
            
            // Verificar se já foi completada (para quests não repetíveis)
            if (completedQuests.some(q => q.id === questId)) continue;
            
            available.push({
                id: questId,
                name: quest.name,
                title: quest.title,
                description: quest.description,
                type: quest.type,
                requiredCount: quest.requiredCount,
                rewards: quest.rewards
            });
        }
        
        return available;
    }

    /**
     * Get active quests for player
     */
    getActiveQuests(playerId) {
        const playerQuestMap = this.playerQuests.get(playerId);
        if (!playerQuestMap) return [];
        
        return Array.from(playerQuestMap.values());
    }

    /**
     * Get completed quests for player
     */
    getCompletedQuests(playerId) {
        const player = this.server.players.get(playerId);
        return player?.completedQuests || [];
    }
}

module.exports = QuestModule;
