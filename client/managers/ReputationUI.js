/**
 * ReputationUI - Interface do Sistema de Reputação/Facções
 * 
 * Features:
 * - Lista de facções com reputação
 * - Barras de progresso visuais
 * - Recompensas disponíveis
 * - Histórico de mudanças
 * - Filtros por categoria
 */

class ReputationUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.factions = [];
        this.selectedFaction = null;
        this.currentFilter = 'all';
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
    }
    
    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'reputation-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 900px;
            height: 650px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
        `;
        
        const header = this.createHeader();
        this.container.appendChild(header);
        
        const filters = this.createFilters();
        this.container.appendChild(filters);
        
        this.contentArea = document.createElement('div');
        this.contentArea.style.cssText = `
            flex: 1;
            overflow: hidden;
            display: flex;
        `;
        this.container.appendChild(this.contentArea);
        
        document.body.appendChild(this.container);
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #f59e0b, #d97706);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '🤝 Reputação & Facções';
        title.style.cssText = `
            margin: 0;
            font-size: 22px;
            font-weight: 600;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        `;
        closeBtn.onclick = () => this.hide();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        return header;
    }
    
    createFilters() {
        const filters = document.createElement('div');
        filters.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            padding: 10px 20px;
            display: flex;
            gap: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const filterOptions = [
            { id: 'all', label: 'Todas' },
            { id: 'major', label: 'Principais' },
            { id: 'minor', label: 'Secundárias' },
            { id: 'hostile', label: 'Hostis' }
        ];
        
        filterOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.textContent = opt.label;
            btn.style.cssText = `
                padding: 6px 14px;
                background: ${this.currentFilter === opt.id ? '#f59e0b' : 'rgba(255,255,255,0.1)'};
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 13px;
            `;
            btn.onclick = () => {
                this.currentFilter = opt.id;
                this.renderContent();
            };
            filters.appendChild(btn);
        });
        
        return filters;
    }
    
    renderContent() {
        this.contentArea.innerHTML = '';
        
        // Filter factions
        const filtered = this.currentFilter === 'all' 
            ? this.factions 
            : this.factions.filter(f => f.category === this.currentFilter);
        
        // Left panel - Faction list
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        if (filtered.length === 0) {
            leftPanel.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center;">Nenhuma facção disponível</div>';
        } else {
            filtered.forEach(faction => {
                const card = this.createFactionCard(faction);
                leftPanel.appendChild(card);
            });
        }
        
        // Right panel - Selected faction details
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        if (this.selectedFaction) {
            rightPanel.appendChild(this.createFactionDetail(this.selectedFaction));
        } else {
            rightPanel.innerHTML = `
                <div style="height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); flex-direction: column; gap: 15px;">
                    <div style="font-size: 48px;">🤝</div>
                    <div>Selecione uma facção para ver detalhes</div>
                </div>
            `;
        }
        
        this.contentArea.appendChild(leftPanel);
        this.contentArea.appendChild(rightPanel);
    }
    
    createFactionCard(faction) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid ${this.selectedFaction?.factionId === faction.factionId ? '#f59e0b' : 'rgba(255,255,255,0.1)'};
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        
        const hasRewards = faction.availableRewards?.length > 0;
        
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                <div style="font-size: 32px;">${faction.factionIcon}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #fff; margin-bottom: 3px;">${faction.factionName}</div>
                    <div style="font-size: 12px; color: ${faction.levelColor};">${faction.levelName.toUpperCase()}</div>
                </div>
                ${hasRewards ? '<div style="background: #f59e0b; color: #000; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">🎁 Recompensas!</div>' : ''}
            </div>
            <div style="background: rgba(0,0,0,0.3); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="width: ${this.calculateProgress(faction.value)}%; height: 100%; background: ${faction.levelColor}; border-radius: 4px;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 11px; color: rgba(255,255,255,0.5);">
                <span>${faction.value} rep</span>
                ${faction.nextLevel ? `<span>${faction.nextLevel.needed} para ${faction.nextLevel.name}</span>` : '<span>Máximo!</span>'}
            </div>
        `;
        
        card.onmouseover = () => {
            if (this.selectedFaction?.factionId !== faction.factionId) {
                card.style.borderColor = 'rgba(245, 158, 11, 0.5)';
            }
        };
        
        card.onmouseout = () => {
            if (this.selectedFaction?.factionId !== faction.factionId) {
                card.style.borderColor = 'rgba(255,255,255,0.1)';
            }
        };
        
        card.onclick = () => {
            this.selectedFaction = faction;
            this.renderContent();
            this.socket?.emit('reputation:get_faction', { factionId: faction.factionId });
        };
        
        return card;
    }
    
    createFactionDetail(faction) {
        const detail = document.createElement('div');
        
        detail.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 64px; margin-bottom: 10px;">${faction.factionIcon}</div>
                <h3 style="margin: 0; color: #fff; font-size: 24px;">${faction.factionName}</h3>
                <div style="color: ${faction.levelColor}; font-weight: 600; margin-top: 5px;">${faction.levelName.toUpperCase()}</div>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 15px;">
                    ${faction.description || 'Descrição não disponível'}
                </div>
                
                <div style="background: rgba(0,0,0,0.3); height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 10px;">
                    <div style="width: ${this.calculateProgress(faction.value)}%; height: 100%; background: linear-gradient(90deg, ${faction.levelColor}, #fff); border-radius: 6px;"></div>
                </div>
                
                <div style="display: flex; justify-content: space-between; font-size: 14px;">
                    <span style="color: rgba(255,255,255,0.7);">Reputação: <span style="color: #fff; font-weight: 600;">${faction.value}</span></span>
                    ${faction.nextLevel ? `<span style="color: rgba(255,255,255,0.7);">Faltam: <span style="color: ${faction.nextLevel.color}; font-weight: 600;">${faction.nextLevel.needed}</span> para ${faction.nextLevel.name}</span>` : '<span style="color: #f59e0b; font-weight: 600;">⭐ EXALTADO</span>'}
                </div>
            </div>
            
            ${faction.enemies?.length > 0 ? `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="font-size: 13px; color: #ef4444; font-weight: 600; margin-bottom: 5px;">⚠️ Inimigos</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Ganhar reputação com esta facção reduzirá reputação com inimigos</div>
                </div>
            ` : ''}
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; color: #f59e0b;">🎁 Recompensas Disponíveis</h4>
                <div id="rewards-container" style="display: grid; gap: 10px;">
                    Carregando...
                </div>
            </div>
        `;
        
        // Load rewards
        setTimeout(() => {
            const container = detail.querySelector('#rewards-container');
            if (container && faction.availableRewards?.length > 0) {
                container.innerHTML = '';
                faction.availableRewards.forEach(reward => {
                    const rewardEl = this.createRewardElement(reward, faction.factionId);
                    container.appendChild(rewardEl);
                });
            } else if (container) {
                container.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 13px;">Nenhuma recompensa disponível no momento. Continue ganhando reputação!</div>';
            }
        }, 0);
        
        return detail;
    }
    
    createRewardElement(reward, factionId) {
        const el = document.createElement('div');
        el.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 8px;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const items = reward.rewards.items?.join(', ') || '';
        const special = reward.rewards.special ? '⭐ ' + reward.rewards.special : '';
        
        el.innerHTML = `
            <div>
                <div style="font-weight: 600; color: #f59e0b; margin-bottom: 3px;">${reward.level.toUpperCase()}</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.7);">
                    ${items} ${special}
                    ${reward.rewards.discount ? `• Desconto ${Math.round(reward.rewards.discount * 100)}%` : ''}
                </div>
            </div>
            <button class="claim-btn" style="
                padding: 8px 16px;
                background: #f59e0b;
                border: none;
                border-radius: 6px;
                color: #000;
                font-weight: 600;
                cursor: pointer;
                font-size: 13px;
            ">Resgatar</button>
        `;
        
        const btn = el.querySelector('.claim-btn');
        btn.onclick = () => {
            this.socket?.emit('reputation:claim_reward', { factionId, level: reward.level });
        };
        
        return el;
    }
    
    calculateProgress(value) {
        // Calculate progress within current level range
        const level = this.getLevelInfo(value);
        if (!level || !level.next) return 100;
        
        const range = level.max - level.min;
        const progress = value - level.min;
        return Math.min(100, Math.max(0, (progress / range) * 100));
    }
    
    getLevelInfo(value) {
        const levels = [
            { name: 'odiado', min: -10000, max: -3000 },
            { name: 'hostil', min: -2999, max: -1000 },
            { name: 'desconhecido', min: -999, max: 0 },
            { name: 'neutro', min: 1, max: 1000 },
            { name: 'amigavel', min: 1001, max: 3000 },
            { name: 'honrado', min: 3001, max: 6000 },
            { name: 'reverenciado', min: 6001, max: 10000 },
            { name: 'exaltado', min: 10001, max: 25000 }
        ];
        
        return levels.find(l => value >= l.min && value <= l.max);
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('reputation:list', (data) => {
            this.factions = data;
            this.renderContent();
        });
        
        this.socket.on('reputation:faction_detail', (data) => {
            // Update selected faction with detailed info
            if (this.selectedFaction?.factionId === data.factionId) {
                this.selectedFaction = { ...this.selectedFaction, ...data };
                this.renderContent();
            }
        });
        
        this.socket.on('reputation:modified', (data) => {
            // Update faction in list
            const faction = this.factions.find(f => f.factionId === data.factionId);
            if (faction) {
                faction.value = data.newValue;
                faction.levelName = data.newLevel;
                faction.levelColor = this.getLevelColor(data.newLevel);
            }
            
            if (data.change > 0) {
                this.game?.showFloatingText?.(`+${data.change} reputação!`, 0, -40, '#22c55e');
            }
            
            this.renderContent();
        });
        
        this.socket.on('reputation:level_up', (data) => {
            this.game?.showFloatingText?.(`${data.factionName}: ${data.newLevel}!`, 0, -40, data.color);
            this.socket?.emit('reputation:get_all');
        });
        
        this.socket.on('reputation:reward_claimed', (data) => {
            this.game?.showFloatingText?.('Recompensa resgatada!', 0, -40, '#f59e0b');
            this.socket?.emit('reputation:get_all');
        });
        
        this.socket.on('reputation:reward_available', (data) => {
            this.game?.showFloatingText?.('Nova recompensa disponível!', 0, -40, '#f59e0b');
        });
        
        this.socket.on('reputation:error', (data) => {
            this.game?.showFloatingText?.(data.message, 0, -40, '#ef4444');
        });
    }
    
    getLevelColor(levelName) {
        const colors = {
            'odiado': '#dc2626',
            'hostil': '#ef4444',
            'desconhecido': '#9ca3af',
            'neutro': '#fbbf24',
            'amigavel': '#22c55e',
            'honrado': '#16a34a',
            'reverenciado': '#3b82f6',
            'exaltado': '#8b5cf6'
        };
        return colors[levelName] || '#fbbf24';
    }
    
    // ===== KEYBOARD =====
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.toggle();
                }
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    // ===== SHOW/HIDE =====
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.socket?.emit('reputation:get_all');
        
        if (this.game?.pause) {
            this.game.pause();
        }
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.selectedFaction = null;
        
        if (this.game?.resume) {
            this.game.resume();
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

window.ReputationUI = ReputationUI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReputationUI;
}
