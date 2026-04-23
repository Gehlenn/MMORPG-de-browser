/**
 * LeaderboardUI - Interface de Leaderboards e Estatísticas
 * 
 * Features:
 * - Visualização de rankings por categoria
 * - Tier system (Bronze → Lendário)
 * - Estatísticas pessoais
 * - Hall da Fama
 * - Recompensas de temporada
 */

class LeaderboardUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.currentType = 'level';
        this.currentPage = 0;
        this.leaderboardData = [];
        this.playerStats = null;
        this.playerRanks = {};
        
        this.leaderboardTypes = [
            { id: 'level', name: 'Nível', icon: '⭐', color: '#3b82f6' },
            { id: 'pvp', name: 'PvP', icon: '⚔️', color: '#ef4444' },
            { id: 'wealth', name: 'Riqueza', icon: '💰', color: '#f59e0b' },
            { id: 'achievements', name: 'Conquistas', icon: '🏆', color: '#8b5cf6' },
            { id: 'dungeon', name: 'Dungeons', icon: '🏰', color: '#10b981' },
            { id: 'crafting', name: 'Crafting', icon: '⚒️', color: '#ec4899' }
        ];
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
    }
    
    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'leaderboard-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 950px;
            height: 700px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #ffd700;
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
        
        const nav = this.createNavigation();
        this.container.appendChild(nav);
        
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
            background: linear-gradient(90deg, #ffd700, #f59e0b);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '🏆 Leaderboards';
        title.style.cssText = `
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            color: #1a1a2e;
        `;
        
        this.seasonDisplay = document.createElement('div');
        this.seasonDisplay.style.cssText = `
            font-size: 13px;
            color: #1a1a2e;
            font-weight: 600;
        `;
        this.seasonDisplay.innerHTML = 'Temporada 1';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: rgba(26, 26, 46, 0.3);
            border: none;
            color: #1a1a2e;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
        `;
        closeBtn.onclick = () => this.hide();
        
        header.appendChild(title);
        header.appendChild(this.seasonDisplay);
        header.appendChild(closeBtn);
        
        return header;
    }
    
    createNavigation() {
        const nav = document.createElement('div');
        nav.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            padding: 10px 20px;
            display: flex;
            gap: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            overflow-x: auto;
        `;
        
        this.leaderboardTypes.forEach(type => {
            const btn = document.createElement('button');
            btn.innerHTML = `${type.icon} ${type.name}`;
            btn.style.cssText = `
                padding: 10px 18px;
                background: ${this.currentType === type.id ? type.color : 'rgba(255,255,255,0.1)'};
                border: none;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                font-weight: 600;
                font-size: 13px;
                white-space: nowrap;
            `;
            btn.onclick = () => this.switchType(type.id);
            nav.appendChild(btn);
        });
        
        return nav;
    }
    
    switchType(type) {
        this.currentType = type;
        this.currentPage = 0;
        
        // Update nav styles
        const nav = this.container.querySelector('div:nth-child(2)');
        if (nav) {
            Array.from(nav.children).forEach((btn, idx) => {
                const typeInfo = this.leaderboardTypes[idx];
                btn.style.cssText = `
                    padding: 10px 18px;
                    background: ${this.currentType === typeInfo.id ? typeInfo.color : 'rgba(255,255,255,0.1)'};
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 13px;
                    white-space: nowrap;
                `;
            });
        }
        
        this.loadLeaderboard();
    }
    
    renderContent() {
        this.contentArea.innerHTML = '';
        
        // Left panel - Leaderboard
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const typeInfo = this.leaderboardTypes.find(t => t.id === this.currentType);
        
        const title = document.createElement('h3');
        title.innerHTML = `${typeInfo.icon} Ranking de ${typeInfo.name}`;
        title.style.cssText = `margin: 0 0 20px 0; color: ${typeInfo.color};`;
        leftPanel.appendChild(title);
        
        if (this.leaderboardData.length === 0) {
            leftPanel.innerHTML += '<div style="color: rgba(255,255,255,0.5); text-align: center; padding: 40px;">Carregando ranking...</div>';
        } else {
            const list = document.createElement('div');
            list.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
            
            this.leaderboardData.forEach(entry => {
                const row = this.createLeaderboardRow(entry);
                list.appendChild(row);
            });
            
            leftPanel.appendChild(list);
            
            // Pagination
            const pagination = document.createElement('div');
            pagination.style.cssText = `
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 20px;
            `;
            
            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '← Anterior';
            prevBtn.style.cssText = `
                padding: 8px 16px;
                background: rgba(255,255,255,0.1);
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
            `;
            prevBtn.disabled = this.currentPage === 0;
            prevBtn.onclick = () => {
                if (this.currentPage > 0) {
                    this.currentPage--;
                    this.loadLeaderboard();
                }
            };
            
            const pageDisplay = document.createElement('span');
            pageDisplay.textContent = `Página ${this.currentPage + 1}`;
            pageDisplay.style.cssText = 'padding: 8px 16px; color: rgba(255,255,255,0.7);';
            
            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = 'Próximo →';
            nextBtn.style.cssText = prevBtn.style.cssText;
            nextBtn.onclick = () => {
                this.currentPage++;
                this.loadLeaderboard();
            };
            
            pagination.appendChild(prevBtn);
            pagination.appendChild(pageDisplay);
            pagination.appendChild(nextBtn);
            leftPanel.appendChild(pagination);
        }
        
        // Right panel - Player stats
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            width: 300px;
            padding: 20px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        rightPanel.appendChild(this.createPlayerStatsPanel());
        
        this.contentArea.appendChild(leftPanel);
        this.contentArea.appendChild(rightPanel);
    }
    
    createLeaderboardRow(entry) {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 15px;
            background: ${entry.playerId === this.game?.player?.id ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0, 0, 0, 0.3)'};
            border: 1px solid ${entry.playerId === this.game?.player?.id ? '#ffd700' : 'transparent'};
            border-radius: 10px;
            transition: all 0.2s;
        `;
        
        const isTop3 = entry.rank <= 3;
        const rankIcon = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
        
        row.innerHTML = `
            <div style="
                width: 40px;
                text-align: center;
                font-size: ${isTop3 ? '24px' : '14px'};
                font-weight: 600;
                color: ${entry.tier?.color || '#fff'};
            ">${rankIcon}</div>
            <div style="
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, ${entry.tier?.color || '#666'}, ${entry.tier?.color || '#666'}80);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            ">${this.getClassIcon(entry.playerClass)}</div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${entry.playerName}
                    ${entry.isOnline ? '<span style="color: #22c55e; margin-left: 5px;">●</span>' : ''}
                </div>
                <div style="font-size: 12px; color: ${entry.tier?.color || '#999'};">
                    ${entry.tier?.name || ''} Tier
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; color: #ffd700; font-size: 16px;">${this.formatValue(entry.value)}</div>
                ${entry.subValue ? `<div style="font-size: 11px; color: rgba(255,255,255,0.5);">${entry.subValue}</div>` : ''}
            </div>
        `;
        
        return row;
    }
    
    createPlayerStatsPanel() {
        const panel = document.createElement('div');
        
        if (!this.playerStats) {
            panel.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center;">Carregando estatísticas...</div>';
            return panel;
        }
        
        const currentRank = this.playerRanks[this.currentType];
        const typeInfo = this.leaderboardTypes.find(t => t.id === this.currentType);
        
        panel.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 48px; margin-bottom: 10px;">👤</div>
                <h4 style="margin: 0; color: #fff;">${this.playerStats.playerName || 'Você'}</h4>
            </div>
            
            ${currentRank ? `
                <div style="
                    background: linear-gradient(135deg, ${currentRank.tier?.color || '#666'}20, ${currentRank.tier?.color || '#666'}40);
                    border: 2px solid ${currentRank.tier?.color || '#666'};
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    margin-bottom: 20px;
                ">
                    <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 5px;">Sua Posição em ${typeInfo.name}</div>
                    <div style="font-size: 36px; font-weight: 700; color: ${currentRank.tier?.color || '#fff'};">#${currentRank.rank}</div>
                    <div style="font-size: 14px; color: ${currentRank.tier?.color || '#fff'};">${currentRank.tier?.name || ''} Tier</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 5px;">Top ${currentRank.percentile}%</div>
                </div>
            ` : `
                <div style="
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    margin-bottom: 20px;
                ">
                    <div style="color: rgba(255,255,255,0.5);">Você ainda não está no ranking</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 5px;">Continue progredindo!</div>
                </div>
            `}
            
            <h5 style="margin: 0 0 15px 0; color: ${typeInfo.color};">📊 Suas Estatísticas</h5>
            
            <div style="display: grid; gap: 10px; margin-bottom: 20px;">
                ${this.renderStatRow('Nível', this.playerStats.level)}
                ${this.playerStats.pvpRating ? this.renderStatRow('Rating PvP', this.playerStats.pvpRating) : ''}
                ${this.playerStats.pvpWinRate ? this.renderStatRow('Win Rate PvP', `${this.playerStats.pvpWinRate}%`) : ''}
                ${this.playerStats.gold ? this.renderStatRow('Ouro Total', this.formatNumber(this.playerStats.gold)) : ''}
                ${this.playerStats.achievementPoints ? this.renderStatRow('Pontos de Conquista', this.playerStats.achievementPoints) : ''}
                ${this.playerStats.dungeonsCompleted ? this.renderStatRow('Dungeons Completadas', this.playerStats.dungeonsCompleted) : ''}
            </div>
            
            <h5 style="margin: 0 0 15px 0; color: #ffd700;">🏆 Suas Colocações</h5>
            
            <div style="display: grid; gap: 8px;">
                ${Object.entries(this.playerRanks).map(([type, rank]) => `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px;
                        background: rgba(0,0,0,0.3);
                        border-radius: 8px;
                    ">
                        <span style="color: rgba(255,255,255,0.8);">${this.getTypeIcon(type)} ${this.getTypeName(type)}</span>
                        <span style="color: ${rank.tier?.color || '#fff'}; font-weight: 600;">#${rank.rank}</span>
                    </div>
                `).join('')}
            </div>
            
            ${this.playerStats.ranks && Object.keys(this.playerStats.ranks).length > 0 ? `
                <button id="claim-rewards-btn" style="
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(45deg, #ffd700, #f59e0b);
                    border: none;
                    border-radius: 8px;
                    color: #1a1a2e;
                    font-weight: 700;
                    cursor: pointer;
                    margin-top: 20px;
                ">🎁 Resgatar Recompensas</button>
            ` : ''}
        `;
        
        setTimeout(() => {
            const btn = panel.querySelector('#claim-rewards-btn');
            if (btn) {
                btn.onclick = () => {
                    this.socket?.emit('leaderboard:claim_rewards');
                };
            }
        }, 0);
        
        return panel;
    }
    
    renderStatRow(label, value) {
        return `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: rgba(255,255,255,0.7);">${label}</span>
                <span style="color: #fff; font-weight: 600;">${value}</span>
            </div>
        `;
    }
    
    getClassIcon(className) {
        const icons = {
            warrior: '⚔️',
            mage: '🔮',
            archer: '🏹',
            rogue: '🗡️',
            priest: '✨'
        };
        return icons[className] || '👤';
    }
    
    getTypeIcon(type) {
        const typeInfo = this.leaderboardTypes.find(t => t.id === type);
        return typeInfo?.icon || '📊';
    }
    
    getTypeName(type) {
        const typeInfo = this.leaderboardTypes.find(t => t.id === type);
        return typeInfo?.name || type;
    }
    
    formatValue(value) {
        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
        if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
        return value.toString();
    }
    
    formatNumber(num) {
        return num.toLocaleString();
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('leaderboard:data', (data) => {
            this.leaderboardData = data.entries || [];
            this.seasonDisplay.innerHTML = `Temporada ${data.currentSeason?.id || 1}`;
            this.renderContent();
        });
        
        this.socket.on('leaderboard:player_stats', (data) => {
            this.playerStats = data;
            this.renderContent();
        });
        
        this.socket.on('leaderboard:player_rank', (data) => {
            if (data.rank) {
                this.playerRanks[this.currentType] = data;
            }
            this.renderContent();
        });
        
        this.socket.on('leaderboard:rewards_claimed', (data) => {
            this.game?.showFloatingText?.('Recompensas resgatadas!', 0, -40, '#ffd700');
        });
        
        this.socket.on('leaderboard:error', (data) => {
            this.game?.showFloatingText?.(data.message, 0, -40, '#ef4444');
        });
    }
    
    loadLeaderboard() {
        this.socket?.emit('leaderboard:get', {
            type: this.currentType,
            page: this.currentPage,
            pageSize: 20
        });
        
        this.socket?.emit('leaderboard:get_player_rank', { type: this.currentType });
        this.socket?.emit('leaderboard:get_stats');
    }
    
    // ===== KEYBOARD =====
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'l' && !e.ctrlKey && !e.altKey && !e.metaKey) {
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
        this.loadLeaderboard();
        
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

window.LeaderboardUI = LeaderboardUI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardUI;
}
