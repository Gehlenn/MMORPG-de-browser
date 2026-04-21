/**
 * QuestUI - Interface do Sistema de Quests
 * 
 * Painéis:
 * - Lista de quests disponíveis
 * - Quests ativas com tracker
 * - Quests completadas
 * - Detalhes da quest selecionada
 */

class QuestUI {
    constructor(questManager) {
        this.questManager = questManager || window.questManager;
        this.visible = false;
        this.activeTab = 'active'; // active, available, completed
        this.selectedQuest = null;
        this.elements = {};
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        this.createStyles();
        this.createQuestPanel();
        this.bindKeys();
        
        // Conectar callbacks do QuestManager
        if (this.questManager) {
            this.questManager.onQuestAccepted = (questId, quest) => this.onQuestAccepted(questId, quest);
            this.questManager.onQuestUpdate = (questId, quest) => this.onQuestUpdate(questId, quest);
            this.questManager.onQuestCompleted = (questId, rewards) => this.onQuestCompleted(questId, rewards);
            this.questManager.onQuestListUpdate = (quests) => this.renderAvailableQuests(quests);
        }
        
        this.initialized = true;
        console.log('📜 QuestUI inicializado');
    }
    
    createStyles() {
        const styles = `
            .quest-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; display: none; opacity: 0; transition: opacity 0.2s; }
            .quest-overlay.active { display: flex; opacity: 1; justify-content: center; align-items: center; }
            .quest-panel { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #4ecca3; border-radius: 12px; width: 700px; max-height: 85vh; overflow-y: auto; padding: 20px; box-shadow: 0 0 40px rgba(78,204,163,0.3); }
            .quest-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(78,204,163,0.3); }
            .quest-title { font-size: 20px; font-weight: bold; color: #4ecca3; text-transform: uppercase; letter-spacing: 1px; }
            .quest-close { background: transparent; border: 1px solid #4ecca3; color: #4ecca3; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 18px; transition: all 0.2s; }
            .quest-close:hover { background: #4ecca3; color: #1a1a2e; }
            .quest-tabs { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; }
            .quest-tab { padding: 10px 20px; background: rgba(0,0,0,0.3); border: none; color: #888; cursor: pointer; border-radius: 6px; font-size: 13px; transition: all 0.2s; position: relative; }
            .quest-tab:hover { color: white; background: rgba(78,204,163,0.1); }
            .quest-tab.active { background: #4ecca3; color: #1a1a2e; font-weight: bold; }
            .quest-tab-count { position: absolute; top: -6px; right: -6px; background: #e94560; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; }
            .quest-content { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
            .quest-list { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; max-height: 500px; overflow-y: auto; }
            .quest-item { padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; }
            .quest-item:hover { background: rgba(78,204,163,0.1); border-left-color: #4ecca3; }
            .quest-item.active { background: rgba(78,204,163,0.2); border-left-color: #4ecca3; }
            .quest-item.completed { border-left-color: #ffd700; opacity: 0.8; }
            .quest-item-name { font-weight: bold; color: white; margin-bottom: 4px; }
            .quest-item-meta { font-size: 11px; color: #888; display: flex; gap: 12px; }
            .quest-item-level { color: #4ecca3; }
            .quest-item-type { color: #e94560; }
            .quest-details { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 16px; }
            .quest-details-title { font-size: 16px; font-weight: bold; color: #4ecca3; margin-bottom: 12px; }
            .quest-details-desc { color: #aaa; font-size: 13px; line-height: 1.5; margin-bottom: 16px; }
            .quest-details-objectives { margin-bottom: 16px; }
            .quest-objective { display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; margin-bottom: 6px; }
            .quest-objective-icon { font-size: 14px; }
            .quest-objective-text { flex: 1; font-size: 12px; color: #ccc; }
            .quest-objective-progress { font-size: 11px; color: #4ecca3; font-weight: bold; }
            .quest-objective.completed .quest-objective-text { text-decoration: line-through; color: #666; }
            .quest-objective.completed .quest-objective-progress { color: #ffd700; }
            .quest-rewards { background: rgba(255,215,0,0.05); border: 1px solid rgba(255,215,0,0.2); border-radius: 6px; padding: 12px; margin-bottom: 16px; }
            .quest-rewards-title { font-size: 11px; color: #ffd700; text-transform: uppercase; margin-bottom: 8px; }
            .quest-reward { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #ccc; margin-bottom: 4px; }
            .quest-reward-gold { color: #ffd700; }
            .quest-reward-xp { color: #64b5f6; }
            .quest-reward-item { color: #ba68c8; }
            .quest-actions { display: flex; gap: 8px; }
            .quest-btn { flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
            .quest-btn.accept { background: #4ecca3; color: #1a1a2e; font-weight: bold; }
            .quest-btn.accept:hover { background: #3dbb92; }
            .quest-btn.complete { background: #ffd700; color: #1a1a2e; font-weight: bold; }
            .quest-btn.complete:hover { background: #e6c200; }
            .quest-btn.abandon { background: rgba(233,69,96,0.3); border: 1px solid #e94560; color: #e94560; }
            .quest-btn.abandon:hover { background: #e94560; color: white; }
            .quest-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .quest-tracker { position: fixed; right: 20px; top: 100px; width: 280px; background: rgba(26,26,46,0.95); border: 1px solid rgba(78,204,163,0.3); border-radius: 8px; padding: 12px; z-index: 100; }
            .quest-tracker-title { font-size: 12px; color: #4ecca3; text-transform: uppercase; margin-bottom: 8px; }
            .quest-tracker-item { padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; margin-bottom: 6px; }
            .quest-tracker-name { font-size: 12px; font-weight: bold; color: white; margin-bottom: 4px; }
            .quest-tracker-progress { height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
            .quest-tracker-bar { height: 100%; background: #4ecca3; transition: width 0.3s; }
            .quest-difficulty-easy { color: #4caf50; }
            .quest-difficulty-medium { color: #ff9800; }
            .quest-difficulty-hard { color: #f44336; }
        `;
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    createQuestPanel() {
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'quest-overlay';
        
        this.elements.panel = document.createElement('div');
        this.elements.panel.className = 'quest-panel';
        
        this.elements.panel.innerHTML = `
            <div class="quest-header">
                <div class="quest-title">📜 Diário de Quests</div>
                <button class="quest-close">×</button>
            </div>
            <div class="quest-tabs">
                <button class="quest-tab active" data-tab="active">Ativas <span class="quest-tab-count" id="active-count">0</span></button>
                <button class="quest-tab" data-tab="available">Disponíveis <span class="quest-tab-count" id="available-count">0</span></button>
                <button class="quest-tab" data-tab="completed">Completadas <span class="quest-tab-count" id="completed-count">0</span></button>
            </div>
            <div class="quest-content">
                <div class="quest-list" id="quest-list"></div>
                <div class="quest-details" id="quest-details">
                    <div style="color: #666; text-align: center; padding: 40px;">
                        Selecione uma quest para ver detalhes
                    </div>
                </div>
            </div>
        `;
        
        this.elements.overlay.appendChild(this.elements.panel);
        document.body.appendChild(this.elements.overlay);
        
        // Eventos
        this.elements.panel.querySelector('.quest-close').onclick = () => this.hide();
        
        this.elements.panel.querySelectorAll('.quest-tab').forEach(tab => {
            tab.onclick = () => {
                this.switchTab(tab.dataset.tab);
            };
        });
        
        // Tracker de quests ativas
        this.elements.tracker = document.createElement('div');
        this.elements.tracker.className = 'quest-tracker';
        this.elements.tracker.style.display = 'none';
        this.elements.tracker.innerHTML = `
            <div class="quest-tracker-title">Quests Ativas</div>
            <div id="quest-tracker-list"></div>
        `;
        document.body.appendChild(this.elements.tracker);
    }
    
    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'L' || e.key === 'l') {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }
    
    show() {
        this.visible = true;
        this.elements.overlay.classList.add('active');
        this.render();
        if (window.audioManager) window.audioManager.playSFX('ui_open');
    }
    
    hide() {
        this.visible = false;
        this.elements.overlay.classList.remove('active');
    }
    
    toggle() {
        if (this.visible) this.hide(); else this.show();
    }
    
    switchTab(tab) {
        this.activeTab = tab;
        this.selectedQuest = null;
        
        this.elements.panel.querySelectorAll('.quest-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        this.render();
    }
    
    render() {
        this.updateCounts();
        
        if (this.activeTab === 'active') {
            this.renderActiveQuests();
        } else if (this.activeTab === 'available') {
            this.renderAvailableQuests();
        } else if (this.activeTab === 'completed') {
            this.renderCompletedQuests();
        }
        
        this.renderDetails();
    }
    
    updateCounts() {
        const active = this.questManager?.activeQuests?.size || 0;
        const available = this.questManager?.availableQuests?.length || 0;
        const completed = this.questManager?.completedQuests?.size || 0;
        
        const activeCount = document.getElementById('active-count');
        const availableCount = document.getElementById('available-count');
        const completedCount = document.getElementById('completed-count');
        
        if (activeCount) activeCount.textContent = active;
        if (availableCount) availableCount.textContent = available;
        if (completedCount) completedCount.textContent = completed;
    }
    
    renderActiveQuests() {
        const list = document.getElementById('quest-list');
        if (!list) return;
        
        const quests = this.questManager?.getActiveQuests() || [];
        
        if (quests.length === 0) {
            list.innerHTML = `
                <div style="color: #666; text-align: center; padding: 40px;">
                    <div style="font-size: 32px; margin-bottom: 12px;">📭</div>
                    Nenhuma quest ativa<br>
                    <small>Fale com NPCs para encontrar quests</small>
                </div>
            `;
            return;
        }
        
        list.innerHTML = quests.map(quest => `
            <div class="quest-item ${this.selectedQuest?.id === quest.id ? 'active' : ''}" data-id="${quest.id}">
                <div class="quest-item-name">${quest.title}</div>
                <div class="quest-item-meta">
                    <span class="quest-item-level">Nível ${quest.requiredLevel || 1}</span>
                    <span class="quest-item-type">${this.getQuestTypeLabel(quest.type)}</span>
                </div>
            </div>
        `).join('');
        
        list.querySelectorAll('.quest-item').forEach(item => {
            item.onclick = () => {
                this.selectedQuest = quests.find(q => q.id === item.dataset.id);
                this.render();
            };
        });
        
        this.updateTracker(quests);
    }
    
    renderAvailableQuests(quests) {
        if (this.activeTab !== 'available') return;
        
        const list = document.getElementById('quest-list');
        if (!list) return;
        
        const availableQuests = quests || this.questManager?.availableQuests || [];
        
        if (availableQuests.length === 0) {
            list.innerHTML = `
                <div style="color: #666; text-align: center; padding: 40px;">
                    <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
                    Nenhuma quest disponível<br>
                    <small>Volte mais tarde ou explore outras áreas</small>
                </div>
            `;
            return;
        }
        
        list.innerHTML = availableQuests.map(quest => `
            <div class="quest-item ${this.selectedQuest?.id === quest.id ? 'active' : ''}" data-id="${quest.id}">
                <div class="quest-item-name">${quest.title}</div>
                <div class="quest-item-meta">
                    <span class="quest-item-level">Nível ${quest.requiredLevel || 1}</span>
                    <span class="quest-item-type">${this.getQuestTypeLabel(quest.type)}</span>
                </div>
            </div>
        `).join('');
        
        list.querySelectorAll('.quest-item').forEach(item => {
            item.onclick = () => {
                this.selectedQuest = availableQuests.find(q => q.id === item.dataset.id);
                this.render();
            };
        });
    }
    
    renderCompletedQuests() {
        const list = document.getElementById('quest-list');
        if (!list) return;
        
        const completed = Array.from(this.questManager?.completedQuests || []);
        
        if (completed.length === 0) {
            list.innerHTML = `
                <div style="color: #666; text-align: center; padding: 40px;">
                    <div style="font-size: 32px; margin-bottom: 12px;">🏆</div>
                    Nenhuma quest completada ainda
                </div>
            `;
            return;
        }
        
        list.innerHTML = completed.map(questId => `
            <div class="quest-item completed" data-id="${questId}">
                <div class="quest-item-name">Quest #${questId}</div>
                <div class="quest-item-meta">
                    <span style="color: #ffd700;">✓ Completada</span>
                </div>
            </div>
        `).join('');
    }
    
    renderDetails() {
        const details = document.getElementById('quest-details');
        if (!details) return;
        
        if (!this.selectedQuest) {
            details.innerHTML = `
                <div style="color: #666; text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📜</div>
                    Selecione uma quest para ver detalhes
                </div>
            `;
            return;
        }
        
        const quest = this.selectedQuest;
        const isActive = this.questManager?.hasActiveQuest(quest.id);
        const isCompleted = this.questManager?.isQuestCompleted(quest.id);
        const isAvailable = !isActive && !isCompleted;
        
        let actions = '';
        if (isAvailable) {
            actions = `<button class="quest-btn accept" id="quest-accept">Aceitar Quest</button>`;
        } else if (isActive && quest.status === 'ready_to_complete') {
            actions = `
                <button class="quest-btn complete" id="quest-complete">Completar Quest</button>
                <button class="quest-btn abandon" id="quest-abandon">Abandonar</button>
            `;
        } else if (isActive) {
            actions = `<button class="quest-btn abandon" id="quest-abandon">Abandonar Quest</button>`;
        }
        
        details.innerHTML = `
            <div class="quest-details-title">${quest.title}</div>
            <div class="quest-details-desc">${quest.description}</div>
            
            <div class="quest-details-objectives">
                ${this.renderObjectives(quest)}
            </div>
            
            <div class="quest-rewards">
                <div class="quest-rewards-title">🎁 Recompensas</div>
                ${quest.rewards?.xp ? `<div class="quest-reward quest-reward-xp">✨ ${quest.rewards.xp} XP</div>` : ''}
                ${quest.rewards?.gold ? `<div class="quest-reward quest-reward-gold">💰 ${quest.rewards.gold} Gold</div>` : ''}
                ${quest.rewards?.items?.map(item => `
                    <div class="quest-reward quest-reward-item">📦 ${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}</div>
                `).join('') || ''}
            </div>
            
            <div class="quest-actions">
                ${actions}
            </div>
        `;
        
        // Eventos dos botões
        const acceptBtn = document.getElementById('quest-accept');
        if (acceptBtn) {
            acceptBtn.onclick = () => {
                this.questManager?.acceptQuest(quest.id);
            };
        }
        
        const completeBtn = document.getElementById('quest-complete');
        if (completeBtn) {
            completeBtn.onclick = () => {
                this.questManager?.completeQuest(quest.id);
            };
        }
        
        const abandonBtn = document.getElementById('quest-abandon');
        if (abandonBtn) {
            abandonBtn.onclick = () => {
                if (confirm('Tem certeza que deseja abandonar esta quest?')) {
                    this.questManager?.abandonQuest?.(quest.id);
                    this.selectedQuest = null;
                    this.render();
                }
            };
        }
    }
    
    renderObjectives(quest) {
        if (!quest.objectives) return '';
        
        return quest.objectives.map((obj, idx) => {
            const progress = quest.progress?.[idx] || 0;
            const completed = progress >= obj.target;
            
            return `
                <div class="quest-objective ${completed ? 'completed' : ''}">
                    <span class="quest-objective-icon">${completed ? '✓' : '○'}</span>
                    <span class="quest-objective-text">${obj.description}</span>
                    <span class="quest-objective-progress">${progress}/${obj.target}</span>
                </div>
            `;
        }).join('');
    }
    
    updateTracker(activeQuests) {
        const tracker = document.getElementById('quest-tracker-list');
        if (!tracker) return;
        
        if (!activeQuests || activeQuests.length === 0) {
            this.elements.tracker.style.display = 'none';
            return;
        }
        
        this.elements.tracker.style.display = 'block';
        
        tracker.innerHTML = activeQuests.slice(0, 3).map(quest => {
            const objective = quest.objectives?.[0];
            const progress = objective ? (quest.progress?.[0] || 0) / objective.target : 0;
            const percent = Math.min(100, Math.round(progress * 100));
            
            return `
                <div class="quest-tracker-item">
                    <div class="quest-tracker-name">${quest.title}</div>
                    <div class="quest-tracker-progress">
                        <div class="quest-tracker-bar" style="width: ${percent}%"></div>
                    </div>
                    <div style="font-size: 10px; color: #888; margin-top: 4px;">
                        ${objective ? `${quest.progress?.[0] || 0}/${objective.target} ${objective.description}` : 'Em progresso...'}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getQuestTypeLabel(type) {
        const labels = {
            kill: '⚔️ Matar',
            collect: '📦 Coletar',
            escort: '🛡️ Escoltar',
            discover: '🔍 Explorar',
            talk: '💬 Falar',
            delivery: '📬 Entregar'
        };
        return labels[type] || type || 'Quest';
    }
    
    // Callbacks do QuestManager
    onQuestAccepted(questId, quest) {
        this.show();
        this.switchTab('active');
        this.selectedQuest = quest;
        this.render();
        
        if (window.effectsManager) {
            window.effectsManager.showToast(`Quest aceita: ${quest.title}`, '📜', '#4ecca3');
        }
    }
    
    onQuestUpdate(questId, quest) {
        this.render();
    }
    
    onQuestCompleted(questId, rewards) {
        this.switchTab('completed');
        this.render();
        
        if (window.effectsManager) {
            window.effectsManager.showToast('Quest completada!', '🏆', '#ffd700');
        }
    }
}

window.QuestUI = QuestUI;
