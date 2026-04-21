/**
 * QuestManager - Gerencia quests no cliente
 * Tracka progresso, atualiza UI e comunica com servidor
 */
class QuestManager {
  constructor() {
    // Quests disponíveis (do NPC)
    this.availableQuests = [];
    
    // Quests ativas do jogador
    this.activeQuests = new Map();
    
    // Quests completadas
    this.completedQuests = new Set();
    
    // Callbacks para UI
    this.onQuestListUpdate = null;
    this.onQuestAccepted = null;
    this.onQuestUpdate = null;
    this.onQuestCompleted = null;
    
    Logger.info('[QuestManager] Inicializado');
  }

  /**
   * Inicializa listeners de rede
   */
  initializeNetworkListeners() {
    if (!window.networkManager) {
      Logger.error('[QuestManager] NetworkManager não disponível');
      return;
    }

    // Receber lista de quests
    window.networkManager.on('questList', (data) => {
      this.handleQuestList(data);
    });

    // Quest aceita confirmada
    window.networkManager.on('questAccepted', (data) => {
      this.handleQuestAccepted(data);
    });

    // Atualização de progresso
    window.networkManager.on('questUpdate', (data) => {
      this.handleQuestUpdate(data);
    });

    // Quest completada
    window.networkManager.on('questCompleted', (data) => {
      this.handleQuestCompleted(data);
    });

    Logger.info('[QuestManager] Listeners de rede registrados');
  }

  /**
   * Handler: Lista de quests recebida
   */
  handleQuestList(data) {
    if (!data || !Array.isArray(data.quests)) {
      Logger.warn('[QuestManager] Lista de quests inválida');
      return;
    }

    this.availableQuests = data.quests;
    Logger.info('[QuestManager] Lista de quests recebida:', data.quests.length);

    if (typeof this.onQuestListUpdate === 'function') {
      this.onQuestListUpdate(this.availableQuests);
    }
  }

  /**
   * Handler: Quest aceita pelo servidor
   */
  handleQuestAccepted(data) {
    if (!data || !data.questId) {
      Logger.warn('[QuestManager] Dados de quest aceita inválidos');
      return;
    }

    const questId = data.questId;
    const questData = data.quest || this.availableQuests.find(q => q.id === questId);
    
    if (!questData) {
      Logger.warn('[QuestManager] Quest não encontrada:', questId);
      return;
    }

    // Adicionar às quests ativas
    this.activeQuests.set(questId, {
      ...questData,
      progress: data.progress || 0,
      acceptedAt: Date.now(),
      status: 'active'
    });

    Logger.info('[QuestManager] Quest aceita:', questId);

    // Notificar UI
    if (typeof this.onQuestAccepted === 'function') {
      this.onQuestAccepted(questId, questData);
    }

    // Notificar HUD
    if (window.hud) {
      window.hud.addChatMessage(`Quest aceita: ${questData.title}`, '#81C784');
    }
  }

  /**
   * Handler: Atualização de progresso
   */
  handleQuestUpdate(data) {
    if (!data || !data.questId) return;

    const questId = data.questId;
    const activeQuest = this.activeQuests.get(questId);
    
    if (!activeQuest) {
      Logger.warn('[QuestManager] Update para quest não ativa:', questId);
      return;
    }

    // Atualizar progresso
    activeQuest.progress = data.progress || activeQuest.progress;
    
    // Verificar se completou
    if (data.completed) {
      activeQuest.status = 'ready_to_complete';
    }

    Logger.info('[QuestManager] Quest atualizada:', questId, 'Progresso:', activeQuest.progress);

    if (typeof this.onQuestUpdate === 'function') {
      this.onQuestUpdate(questId, activeQuest);
    }
  }

  /**
   * Handler: Quest completada
   */
  handleQuestCompleted(data) {
    if (!data || !data.questId) return;

    const questId = data.questId;
    const quest = this.activeQuests.get(questId);

    // Mover de ativas para completadas
    this.activeQuests.delete(questId);
    this.completedQuests.add(questId);

    Logger.info('[QuestManager] Quest completada:', questId);

    if (typeof this.onQuestCompleted === 'function') {
      this.onQuestCompleted(questId, data.rewards);
    }

    // Notificações
    if (window.hud) {
      window.hud.addChatMessage(`Quest completada!`, '#FFD54F');
      
      if (data.rewards) {
        const { xp, gold, items } = data.rewards;
        if (xp) window.hud.addChatMessage(`+${xp} XP`, '#64B5F6');
        if (gold) window.hud.addChatMessage(`+${gold} Gold`, '#FFD700');
        if (items) window.hud.addChatMessage(`Itens recebidos!`, '#BA68C8');
      }
    }
  }

  /**
   * Solicita lista de quests disponíveis
   */
  requestQuestList(npcId = null) {
    if (!window.networkManager) {
      Logger.error('[QuestManager] NetworkManager não disponível');
      return false;
    }

    return window.networkManager.requestQuestList({ npcId });
  }

  /**
   * Aceita uma quest
   */
  acceptQuest(questId) {
    if (!window.networkManager) {
      Logger.error('[QuestManager] NetworkManager não disponível');
      return false;
    }

    // Verificar se já tem essa quest ativa
    if (this.activeQuests.has(questId)) {
      Logger.warn('[QuestManager] Quest já está ativa:', questId);
      return false;
    }

    return window.networkManager.acceptQuest({ questId });
  }

  /**
   * Completa uma quest
   */
  completeQuest(questId) {
    if (!window.networkManager) {
      Logger.error('[QuestManager] NetworkManager não disponível');
      return false;
    }

    const quest = this.activeQuests.get(questId);
    if (!quest) {
      Logger.warn('[QuestManager] Quest não encontrada:', questId);
      return false;
    }

    return window.networkManager.completeQuest({ questId });
  }

  /**
   * Retorna quests ativas
   */
  getActiveQuests() {
    return Array.from(this.activeQuests.values());
  }

  /**
   * Retorna uma quest ativa específica
   */
  getActiveQuest(questId) {
    return this.activeQuests.get(questId);
  }

  /**
   * Verifica se tem quest ativa
   */
  hasActiveQuest(questId) {
    return this.activeQuests.has(questId);
  }

  /**
   * Verifica se quest está completada
   */
  isQuestCompleted(questId) {
    return this.completedQuests.has(questId);
  }

  /**
   * Reporta progresso local (para quest de matar mobs)
   * O servidor também deve processar isso
   */
  reportKill(mobType, count = 1) {
    // Verificar quests ativas de kill
    for (const [questId, quest] of this.activeQuests) {
      if (quest.type === 'kill' && quest.target === mobType) {
        // Atualizar localmente (servidor confirma depois)
        Logger.info('[QuestManager] Progresso de kill reportado:', mobType, count);
      }
    }
  }

  /**
   * Limpa todas as quests (logout)
   */
  clear() {
    this.availableQuests = [];
    this.activeQuests.clear();
    Logger.info('[QuestManager] Quests limpas');
  }

  /**
   * Abandona uma quest ativa
   */
  abandonQuest(questId) {
    if (!this.activeQuests.has(questId)) {
      Logger.warn('[QuestManager] Tentativa de abandonar quest não ativa:', questId);
      return false;
    }

    const quest = this.activeQuests.get(questId);
    this.activeQuests.delete(questId);

    Logger.info('[QuestManager] Quest abandonada:', questId);

    if (window.hud) {
      window.hud.addChatMessage(`Quest abandonada: ${quest.title}`, '#E57373');
    }

    if (typeof this.onQuestUpdate === 'function') {
      this.onQuestUpdate(questId, null);
    }

    return true;
  }

  /**
   * Reporta progresso de coleta de item
   */
  reportItemCollect(itemId, quantity = 1) {
    let updated = false;

    for (const [questId, quest] of this.activeQuests) {
      if (quest.type === 'collect') {
        const objective = quest.objectives?.find(obj => 
          obj.type === 'collect' && obj.itemId === itemId
        );

        if (objective) {
          // Atualizar progresso
          const currentProgress = quest.progress?.[0] || 0;
          const newProgress = Math.min(objective.target, currentProgress + quantity);
          
          if (!quest.progress) quest.progress = [];
          quest.progress[0] = newProgress;

          Logger.info('[QuestManager] Progresso de coleta:', questId, newProgress);
          updated = true;

          // Verificar se completou
          if (newProgress >= objective.target) {
            quest.status = 'ready_to_complete';
          }

          if (typeof this.onQuestUpdate === 'function') {
            this.onQuestUpdate(questId, quest);
          }
        }
      }
    }

    return updated;
  }

  /**
   * Reporta progresso de descoberta
   */
  reportDiscovery(locationId) {
    let updated = false;

    for (const [questId, quest] of this.activeQuests) {
      if (quest.type === 'discover') {
        const objectiveIndex = quest.objectives?.findIndex(obj => 
          obj.type === 'discover' && obj.locationId === locationId
        );

        if (objectiveIndex !== -1) {
          if (!quest.progress) quest.progress = [];
          quest.progress[objectiveIndex] = 1;

          Logger.info('[QuestManager] Localização descoberta:', questId, locationId);
          updated = true;

          // Verificar se todas as localizações foram descobertas
          const allDiscovered = quest.objectives.every((obj, idx) => 
            quest.progress?.[idx] >= obj.target
          );

          if (allDiscovered) {
            quest.status = 'ready_to_complete';
          }

          if (typeof this.onQuestUpdate === 'function') {
            this.onQuestUpdate(questId, quest);
          }
        }
      }
    }

    return updated;
  }

  /**
   * Carrega quests do localStorage
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('quests_progress');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.completedQuests) {
          this.completedQuests = new Set(data.completedQuests);
        }
        Logger.info('[QuestManager] Progresso de quests carregado');
      }
    } catch (e) {
      Logger.warn('[QuestManager] Erro ao carregar progresso:', e);
    }
  }

  /**
   * Salva quests no localStorage
   */
  saveToStorage() {
    try {
      const data = {
        completedQuests: Array.from(this.completedQuests),
        savedAt: Date.now()
      };
      localStorage.setItem('quests_progress', JSON.stringify(data));
    } catch (e) {
      Logger.warn('[QuestManager] Erro ao salvar progresso:', e);
    }
  }
}

// Instância global
window.questManager = new QuestManager();

// Auto-inicializar se networkManager estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  if (window.networkManager) {
    window.questManager.initializeNetworkListeners();
  } else {
    // Aguardar networkManager
    const checkInterval = setInterval(() => {
      if (window.networkManager) {
        window.questManager.initializeNetworkListeners();
        clearInterval(checkInterval);
      }
    }, 100);
    
    // Timeout de segurança
    setTimeout(() => clearInterval(checkInterval), 5000);
  }
});

console.log('[QuestManager] Módulo carregado');
