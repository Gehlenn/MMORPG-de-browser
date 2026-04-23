/**
 * TitleUI - Interface do Sistema de Títulos
 * 
 * Features:
 * - Lista de títulos desbloqueados
 * - Preview de títulos disponíveis
 * - Equipar/desquipar títulos
 * - Visualização de buffs
 * - Títulos com glow/raridade
 */

class TitleUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.unlockedTitles = [];
        this.availableTitles = [];
        this.activeTitle = null;
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
    }
    
    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'title-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 600px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #ec4899;
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
        
        this.contentArea = document.createElement('div');
        this.contentArea.style.cssText = `
            flex: 1;
            overflow: hidden;
            display: flex;
        `;
        this.container.appendChild(this.contentArea);
        
        const preview = this.createPreviewSection();
        this.container.appendChild(preview);
        
        document.body.appendChild(this.container);
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #ec4899, #db2777);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '👑 Títulos';
        title.style.cssText = `
            margin: 0;
            font-size: 22px;
            font-weight: 600;
        `;
        
        this.activeTitleDisplay = document.createElement('div');
        this.activeTitleDisplay.style.cssText = `
            font-size: 14px;
            color: rgba(255,255,255,0.8);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        this.activeTitleDisplay.innerHTML = 'Nenhum título ativo';
        
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
        header.appendChild(this.activeTitleDisplay);
        header.appendChild(closeBtn);
        
        return header;
    }
    
    createPreviewSection() {
        const preview = document.createElement('div');
        preview.style.cssText = `
            background: rgba(0, 0, 0, 0.4);
            padding: 15px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        `;
        
        this.previewText = document.createElement('div');
        this.previewText.style.cssText = `
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
        `;
        this.previewText.innerHTML = '<span style="color: rgba(255,255,255,0.5);">SeuNome</span>';
        
        this.buffDisplay = document.createElement('div');
        this.buffDisplay.style.cssText = `
            font-size: 13px;
            color: rgba(255,255,255,0.6);
        `;
        this.buffDisplay.innerHTML = 'Selecione um título para ver os buffs';
        
        preview.appendChild(this.previewText);
        preview.appendChild(this.buffDisplay);
        
        return preview;
    }
    
    renderContent() {
        this.contentArea.innerHTML = '';
        
        // Left panel - Unlocked
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const unlockedTitle = document.createElement('h3');
        unlockedTitle.textContent = '🏆 Seus Títulos';
        unlockedTitle.style.cssText = 'margin: 0 0 15px 0; color: #ec4899;';
        leftPanel.appendChild(unlockedTitle);
        
        this.unlockedContainer = document.createElement('div');
        this.unlockedContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 12px;
        `;
        leftPanel.appendChild(this.unlockedContainer);
        
        this.renderUnlockedTitles();
        
        // Right panel - Available
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        const availableTitle = document.createElement('h3');
        availableTitle.textContent = '🔒 Títulos Disponíveis';
        availableTitle.style.cssText = 'margin: 0 0 15px 0; color: #d69e2e;';
        rightPanel.appendChild(availableTitle);
        
        this.availableContainer = document.createElement('div');
        this.availableContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 12px;
        `;
        rightPanel.appendChild(this.availableContainer);
        
        this.renderAvailableTitles();
        
        this.contentArea.appendChild(leftPanel);
        this.contentArea.appendChild(rightPanel);
    }
    
    renderUnlockedTitles() {
        this.unlockedContainer.innerHTML = '';
        
        if (this.unlockedTitles.length === 0) {
            this.unlockedContainer.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center;">Nenhum título desbloqueado</div>';
            return;
        }
        
        this.unlockedTitles.forEach(title => {
            const card = this.createTitleCard(title, true);
            this.unlockedContainer.appendChild(card);
        });
    }
    
    renderAvailableTitles() {
        this.availableContainer.innerHTML = '';
        
        if (this.availableTitles.length === 0) {
            this.availableContainer.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center;">Nenhum título disponível no momento</div>';
            return;
        }
        
        this.availableTitles.forEach(title => {
            const card = this.createTitleCard(title, false);
            this.availableContainer.appendChild(card);
        });
    }
    
    createTitleCard(title, unlocked) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid ${unlocked ? (title.isActive ? '#ec4899' : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.05)'};
            border-radius: 10px;
            padding: 15px;
            cursor: ${unlocked ? 'pointer' : 'default'};
            transition: all 0.2s;
            opacity: ${unlocked ? '1' : '0.6'};
            position: relative;
        `;
        
        const glowStyle = title.glow ? 'text-shadow: 0 0 10px currentColor;' : '';
        const prestige = title.buffs?.prestige ? '👑 ' : '';
        
        card.innerHTML = `
            <div style="font-weight: 600; color: ${title.color}; ${glowStyle}; margin-bottom: 8px;">
                ${prestige}${title.name}
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 10px;">
                ${title.prefix ? 'Prefixo' : 'Sufixo'}
            </div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.4);">
                ${this.formatBuffs(title.buffs)}
            </div>
            ${title.isActive ? '<div style="position: absolute; top: 8px; right: 8px; color: #ec4899; font-size: 12px;">✓ ATIVO</div>' : ''}
        `;
        
        if (unlocked) {
            card.onmouseover = () => {
                card.style.background = 'rgba(255, 255, 255, 0.05)';
                card.style.borderColor = title.isActive ? '#ec4899' : title.color;
                this.updatePreview(title);
            };
            
            card.onmouseout = () => {
                card.style.background = 'rgba(0, 0, 0, 0.3)';
                card.style.borderColor = title.isActive ? '#ec4899' : 'rgba(255,255,255,0.1)';
            };
            
            card.onclick = () => {
                if (title.isActive) {
                    this.socket?.emit('title:clear');
                } else {
                    this.socket?.emit('title:set_active', { titleId: title.id });
                }
            };
        } else {
            card.onmouseover = () => {
                this.updatePreview(title, true);
            };
        }
        
        return card;
    }
    
    formatBuffs(buffs) {
        if (!buffs) return '';
        
        const buffList = [];
        for (const [key, value] of Object.entries(buffs)) {
            if (key === 'prestige') continue;
            
            const buffName = this.getBuffName(key);
            const buffValue = value < 1 ? `+${Math.round(value * 100)}%` : `+${value}`;
            buffList.push(`${buffName}: ${buffValue}`);
        }
        
        return buffList.join(' • ') || 'Sem buffs';
    }
    
    getBuffName(key) {
        const names = {
            hp: 'HP',
            attack: 'ATK',
            defense: 'DEF',
            critChance: 'Crítico',
            moveSpeed: 'Velocidade',
            expBonus: 'EXP',
            bossDamage: 'Dano Boss',
            pvpDamage: 'Dano PvP',
            pvpDefense: 'DEF PvP',
            craftingSpeed: 'Craft',
            craftingQuality: 'Qualidade',
            materialSave: 'Economia',
            sellPrice: 'Preço Venda',
            buyDiscount: 'Desconto',
            guildExp: 'EXP Guild',
            guildGold: 'Ouro Guild',
            expShare: 'Comp. EXP',
            allStats: 'Todos Atributos',
            eventDamage: 'Dano Evento'
        };
        return names[key] || key;
    }
    
    updatePreview(title, locked = false) {
        const playerName = this.game?.player?.name || 'SeuNome';
        const formatted = this.formatTitle(playerName, title);
        
        const glowStyle = title.glow ? `text-shadow: 0 0 10px ${title.color};` : '';
        this.previewText.innerHTML = `<span style="color: ${title.color}; ${glowStyle}">${formatted}</span>`;
        
        if (locked) {
            this.buffDisplay.innerHTML = `<span style="color: #d69e2e;">🔒 Desbloqueie para usar este título</span><br><small>${this.formatBuffs(title.buffs)}</small>`;
        } else {
            this.buffDisplay.innerHTML = this.formatBuffs(title.buffs);
        }
    }
    
    formatTitle(playerName, title) {
        if (!title) return playerName;
        
        if (title.prefix) {
            return `${title.name} ${playerName}`;
        } else if (title.suffix) {
            return `${playerName}, ${title.name}`;
        }
        
        return playerName;
    }
    
    updateActiveDisplay() {
        if (!this.activeTitle) {
            this.activeTitleDisplay.innerHTML = 'Nenhum título ativo';
            return;
        }
        
        const title = this.unlockedTitles.find(t => t.id === this.activeTitle) || 
                      this.availableTitles.find(t => t.id === this.activeTitle);
        
        if (title) {
            const glowStyle = title.glow ? `text-shadow: 0 0 10px ${title.color};` : '';
            const prestige = title.buffs?.prestige ? '👑 ' : '';
            this.activeTitleDisplay.innerHTML = `
                <span style="color: rgba(255,255,255,0.6);">Ativo:</span>
                <span style="color: ${title.color}; ${glowStyle}">${prestige}${title.name}</span>
            `;
        }
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('title:list', (data) => {
            this.unlockedTitles = data.unlocked || [];
            this.availableTitles = data.available || [];
            this.activeTitle = data.activeTitle;
            this.renderContent();
            this.updateActiveDisplay();
        });
        
        this.socket.on('title:set_active', (data) => {
            this.activeTitle = data.titleId;
            this.game?.showFloatingText?.(`Título "${data.title.name}" equipado!`, 0, -40, '#ec4899');
            this.socket?.emit('title:get_list');
        });
        
        this.socket.on('title:cleared', () => {
            this.activeTitle = null;
            this.socket?.emit('title:get_list');
        });
        
        this.socket.on('title:unlocked', (data) => {
            this.game?.showFloatingText?.(`Título "${data.name}" desbloqueado!`, 0, -40, '#d69e2e');
            this.socket?.emit('title:get_list');
        });
        
        this.socket.on('title:new_unlocks', (titles) => {
            titles.forEach(t => {
                this.game?.showFloatingText?.(`Título "${t.name}" desbloqueado!`, 0, -40, '#d69e2e');
            });
            this.socket?.emit('title:get_list');
        });
        
        this.socket.on('title:error', (data) => {
            this.game?.showFloatingText?.(data.message, 0, -40, '#ef4444');
        });
    }
    
    // ===== KEYBOARD =====
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' && !e.ctrlKey && !e.altKey && !e.metaKey) {
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
        this.socket?.emit('title:get_list');
        
        if (this.game?.pause) {
            this.game.pause();
        }
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        
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

window.TitleUI = TitleUI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TitleUI;
}
