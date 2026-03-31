/**
 * QuestManager.js
 * Módulo de quests do cliente MMORPG
 * Responsabilidade: Gerenciar quests, progresso e UI no cliente
 */

class QuestManager {
    constructor(gameplayEngine) {
        this.engine = gameplayEngine;
        
        // Estado das quests
        this.activeQuests = [];
        this.completedQuests = [];
        this.availableQuests = [];
        this.trackedQuestId = null;
        
        // Quest atual do tipo "mate X mobs de tipo Y"
        this.currentQuest = null;
        this.questProgress = {
            mobIdRequired: null,
            mobNameRequired: '',
            targetCount: 0,
            currentCount: 0
        };
        
        console.log('📜 QuestManager inicializado');
    }

    /**
     * Receber nova quest
     */
    receiveQuest(questData) {
        if (!questData) return;

        this.currentQuest = questData;

        // Quest do tipo "mate X mobs de tipo Y"
        if (questData.type === 'kill') {
            this.questProgress = {
                mobIdRequired: questData.mobId,
                mobNameRequired: questData.mobName || 'Unknown',
                targetCount: questData.target ?? 0,
                currentCount: 0
            };
        }

        // Adicionar às quests ativas
        const activeQuest = {
            id: questData.id,
            title: questData.title,
            type: questData.type,
            progress: this.questProgress,
            status: 'active'
        };
        
        this.activeQuests.push(activeQuest);

        console.log('📜 Nova quest recebida:', this.currentQuest);

        // Atualizar HUD
        this.updateQuestPanel();

        // Mostrar mensagem
        if (this.engine.hud) {
            this.engine.hud.addChatMessage(`Nova quest: ${questData.title}`, '#FFCC80');
        }
    }

    /**
     * Sincronizar progresso de quest
     */
    syncQuestProgress(progressData) {
        if (!progressData || !this.currentQuest) return;

        // Atualizar progresso da quest atual
        if (progressData.questId === this.currentQuest.id) {
            this.questProgress = {
                mobIdRequired: progressData.mobId ?? this.questProgress.mobIdRequired,
                mobNameRequired: progressData.mobName ?? this.questProgress.mobNameRequired,
                targetCount: progressData.targetCount ?? this.questProgress.targetCount,
                currentCount: progressData.currentCount ?? this.questProgress.currentCount
            };
        }

        // Atualizar nas activeQuests
        const activeQuest = this.activeQuests.find(q => q.id === progressData.questId);
        if (activeQuest) {
            activeQuest.progress.currentCount = progressData.currentCount;
        }

        console.log('📊 Progresso de quest sincronizado:', this.questProgress);

        this.updateQuestPanel();
    }

    /**
     * Completar quest
     */
    completeQuest(completionData) {
        if (!completionData || !this.currentQuest) return;

        const { questId } = completionData;

        // Mover para completadas
        if (questId === this.currentQuest.id) {
            this.completedQuests.push({
                id: questId,
                title: this.currentQuest.title,
                completedAt: Date.now()
            });

            // Remover das ativas
            this.activeQuests = this.activeQuests.filter(q => q.id !== questId);

            // Resetar quest atual
            this.currentQuest = null;
            this.questProgress = { 
                mobIdRequired: null, 
                mobNameRequired: '', 
                targetCount: 0, 
                currentCount: 0 
            };
        }

        console.log('🎉 Quest completada:', completionData);

        // Atualizar HUD
        this.updateQuestPanel();

        // Mostrar mensagens de recompensa
        if (this.engine.hud) {
            this.engine.hud.addChatMessage(`Quest completa: ${completionData.title}`, '#81C784');

            if (completionData.xpReward && completionData.xpReward > 0) {
                this.engine.hud.addChatMessage(`+${completionData.xpReward} XP`, '#64B5F6');
            }

            if (completionData.lootRewardName) {
                const quantity = completionData.lootRewardQuantity ?? 1;
                this.engine.hud.addChatMessage(`Recompensa: ${quantity}x ${completionData.lootRewardName}`, '#FFD54F');
            }
        }
    }

    /**
     * Processar recompensa de quest
     */
    handleQuestReward(data) {
        if (!data) return;

        console.log('💰 Recompensa de quest recebida:', data);

        if (this.engine.hud) {
            if (data.xp && data.xp > 0) {
                this.engine.hud.addChatMessage(`+${data.xp} XP (Quest)`, '#FFB74D');
            }

            if (data.coins && data.coins > 0) {
                this.engine.hud.addChatMessage(`+${data.coins} moedas`, '#FFF176');
            }

            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    this.engine.hud.addChatMessage(`Recompensa de item: ${item.name || item.id}`, '#81C784');
                });
            }
        }
    }

    /**
     * Atualizar painel de quest no HUD
     */
    updateQuestPanel() {
        if (!this.engine.hud || typeof this.engine.hud.updateQuestPanel !== 'function') return;

        this.engine.hud.updateQuestPanel(this.currentQuest, this.questProgress);
    }

    /**
     * Atualizar log de quests
     */
    updateQuestLog() {
        if (!this.engine.hud || typeof this.engine.hud.updateQuestLog !== 'function') return;

        this.engine.hud.updateQuestLog(this.activeQuests);
    }

    /**
     * Rastrear quest específica
     */
    trackQuest(questId) {
        this.trackedQuestId = questId;
        
        const quest = this.activeQuests.find(q => q.id === questId);
        if (quest && this.engine.hud) {
            this.engine.hud.addChatMessage(`Rastreando: ${quest.title}`, '#64B5F6');
        }
    }

    /**
     * Cancelar quest
     */
    cancelQuest(questId) {
        const quest = this.activeQuests.find(q => q.id === questId);
        if (!quest) return false;

        this.activeQuests = this.activeQuests.filter(q => q.id !== questId);

        if (this.currentQuest && this.currentQuest.id === questId) {
            this.currentQuest = null;
            this.questProgress = { 
                mobIdRequired: null, 
                mobNameRequired: '', 
                targetCount: 0, 
                currentCount: 0 
            };
        }

        if (this.engine.hud) {
            this.engine.hud.addChatMessage(`Quest cancelada: ${quest.title}`, '#EF9A9A');
        }

        this.updateQuestPanel();
        this.updateQuestLog();

        return true;
    }

    /**
     * Verificar se quest está ativa
     */
    isQuestActive(questId) {
        return this.activeQuests.some(q => q.id === questId);
    }

    /**
     * Verificar se quest foi completada
     */
    isQuestCompleted(questId) {
        return this.completedQuests.some(q => q.id === questId);
    }

    /**
     * Obter progresso da quest atual
     */
    getCurrentProgress() {
        return {
            quest: this.currentQuest,
            progress: this.questProgress
        };
    }

    /**
     * Obter todas as quests ativas
     */
    getActiveQuests() {
        return this.activeQuests;
    }

    /**
     * Obter todas as quests completadas
     */
    getCompletedQuests() {
        return this.completedQuests;
    }

    /**
     * Limpar todas as quests (logout)
     */
    clear() {
        this.activeQuests = [];
        this.completedQuests = [];
        this.availableQuests = [];
        this.trackedQuestId = null;
        this.currentQuest = null;
        this.questProgress = { 
            mobIdRequired: null, 
            mobNameRequired: '', 
            targetCount: 0, 
            currentCount: 0 
        };

        console.log('📜 Quests limpas');
    }

    /**
     * Serializar estado para salvamento
     */
    serialize() {
        return {
            active: this.activeQuests,
            completed: this.completedQuests,
            current: this.currentQuest,
            progress: this.questProgress
        };
    }

    /**
     * Desserializar estado do salvamento
     */
    deserialize(data) {
        if (!data) return;

        this.activeQuests = data.active || [];
        this.completedQuests = data.completed || [];
        this.currentQuest = data.current || null;
        this.questProgress = data.progress || { 
            mobIdRequired: null, 
            mobNameRequired: '', 
            targetCount: 0, 
            currentCount: 0 
        };

        this.updateQuestPanel();
        this.updateQuestLog();
    }
}

// Exportar para uso global
window.QuestManager = QuestManager;
