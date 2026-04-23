/**
 * PvPArenaUI - Interface do Sistema PvP (Duelos e Arenas)
 * 
 * Features:
 * - Solicitar/aceitar duelos
 * - Fila de arena
 * - Estatísticas PvP
 * - Leaderboard PvP
 * - Sistema de espectador
 */

class PvPArenaUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.currentTab = 'duel';
        this.playerStats = null;
        this.inQueue = false;
        this.currentMatch = null;
        
        this.arenaModes = [
            { id: 'deathmatch', name: 'Deathmatch', icon: '⚔️', teamSize: 3, desc: '3v3 - Primeiro a 20 kills vence' },
            { id: 'ctf', name: 'Capture the Flag', icon: '🚩', teamSize: 5, desc: '5v5 - Capture 3 bandeiras' },
            { id: 'domination', name: 'Domination', icon: '🏰', teamSize: 5, desc: '5v5 - Controle pontos para pontuar' }
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
        this.container.id = 'pvp-arena-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 900px;
            height: 700px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #ef4444;
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
            background: linear-gradient(90deg, #ef4444, #dc2626);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '⚔️ PvP Arena';
        title.style.cssText = `
            margin: 0;
            font-size: 22px;
            font-weight: 600;
        `;
        
        this.statusDisplay = document.createElement('div');
        this.statusDisplay.style.cssText = `
            font-size: 14px;
            color: rgba(255,255,255,0.9);
        `;
        this.statusDisplay.innerHTML = 'Pronto para combate';
        
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
        header.appendChild(this.statusDisplay);
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
        `;
        
        const tabs = [
            { id: 'duel', icon: '⚔️', label: 'Duelo' },
            { id: 'arena', icon: '🏟️', label: 'Arena' },
            { id: 'stats', icon: '📊', label: 'Estatísticas' },
            { id: 'leaderboard', icon: '🏆', label: 'Ranking' }
        ];
        
        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.innerHTML = `${tab.icon} ${tab.label}`;
            btn.style.cssText = `
                padding: 10px 18px;
                background: ${this.currentTab === tab.id ? '#ef4444' : 'rgba(255,255,255,0.1)'};
                border: none;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
            `;
            btn.onclick = () => {
                this.currentTab = tab.id;
                this.renderContent();
                this.updateNavStyles();
            };
            nav.appendChild(btn);
        });
        
        return nav;
    }
    
    updateNavStyles() {
        const nav = this.container.querySelector('div:nth-child(2)');
        if (!nav) return;
        
        const tabs = ['duel', 'arena', 'stats', 'leaderboard'];
        Array.from(nav.children).forEach((btn, idx) => {
            btn.style.cssText = `
                padding: 10px 18px;
                background: ${this.currentTab === tabs[idx] ? '#ef4444' : 'rgba(255,255,255,0.1)'};
                border: none;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
            `;
        });
    }
    
    renderContent() {
        this.contentArea.innerHTML = '';
        
        switch (this.currentTab) {
            case 'duel':
                this.renderDuelTab();
                break;
            case 'arena':
                this.renderArenaTab();
                break;
            case 'stats':
                this.renderStatsTab();
                break;
            case 'leaderboard':
                this.renderLeaderboardTab();
                break;
        }
    }
    
    renderDuelTab() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            flex: 1;
            padding: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;
        
        panel.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 20px;">⚔️</div>
            <h3 style="margin: 0 0 10px 0; color: #ef4444;">Duelo 1v1</h3>
            <p style="color: rgba(255,255,255,0.7); text-align: center; max-width: 400px; margin-bottom: 30px;">
                Desafie outro jogador para um duelo justo. 
                Vença para ganhar rating e honra!
            </p>
            
            <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; margin-bottom: 30px; width: 100%; max-width: 400px;">
                <h4 style="margin: 0 0 15px 0; color: #fff;">Como funciona:</h4>
                <ul style="color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Aproxime-se de um jogador</li>
                    <li>Clique nele e selecione "Duelo"</li>
                    <li>Aguarde a aceitação</li>
                    <li>Derrote seu oponente!</li>
                </ul>
            </div>
            
            <div style="font-size: 13px; color: rgba(255,255,255,0.5);">
                Dica: Você também pode usar <strong>/duelo [nome]</strong> no chat
            </div>
        `;
        
        this.contentArea.appendChild(panel);
    }
    
    renderArenaTab() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            flex: 1;
            padding: 25px;
            overflow-y: auto;
        `;
        
        if (this.inQueue) {
            panel.innerHTML = `
                <div style="text-align: center; padding: 60px;">
                    <div style="font-size: 64px; margin-bottom: 20px; animation: pulse 1.5s infinite;">⏳</div>
                    <h3 style="color: #ef4444; margin-bottom: 10px;">Na Fila...</h3>
                    <p style="color: rgba(255,255,255,0.7);">Procurando jogadores para a partida</p>
                    <button id="leave-queue-btn" style="
                        margin-top: 30px;
                        padding: 12px 24px;
                        background: #dc2626;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                    ">Sair da Fila</button>
                </div>
            `;
            
            setTimeout(() => {
                const btn = panel.querySelector('#leave-queue-btn');
                if (btn) {
                    btn.onclick = () => {
                        this.socket?.emit('pvp:arena_leave_queue');
                    };
                }
            }, 0);
        } else {
            const title = document.createElement('h3');
            title.innerHTML = '🏟️ Modos de Arena';
            title.style.cssText = 'margin: 0 0 20px 0; color: #ef4444;';
            panel.appendChild(title);
            
            this.arenaModes.forEach(mode => {
                const card = document.createElement('div');
                card.style.cssText = `
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                `;
                
                card.innerHTML = `
                    <div style="font-size: 40px;">${mode.icon}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #fff; font-size: 16px; margin-bottom: 5px;">${mode.name}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 13px;">${mode.desc}</div>
                    </div>
                    <button class="queue-btn" data-mode="${mode.id}" style="
                        padding: 12px 24px;
                        background: linear-gradient(45deg, #ef4444, #dc2626);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                    ">Entrar na Fila</button>
                `;
                
                panel.appendChild(card);
            });
            
            setTimeout(() => {
                panel.querySelectorAll('.queue-btn').forEach(btn => {
                    btn.onclick = () => {
                        const mode = btn.dataset.mode;
                        this.socket?.emit('pvp:arena_queue', { mode });
                    };
                });
            }, 0);
        }
        
        this.contentArea.appendChild(panel);
    }
    
    renderStatsTab() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            flex: 1;
            padding: 25px;
            overflow-y: auto;
        `;
        
        if (!this.playerStats) {
            panel.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center; padding: 40px;">Carregando estatísticas...</div>';
            this.contentArea.appendChild(panel);
            return;
        }
        
        const stats = this.playerStats;
        
        panel.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 72px; margin-bottom: 10px;">⚔️</div>
                <h3 style="margin: 0; color: #fff;">${this.game?.player?.name || 'Você'}</h3>
                <div style="font-size: 14px; color: #ef4444; font-weight: 600;">Rating: ${stats.rating}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; color: #22c55e; font-weight: 700;">${stats.duelsWon || 0}</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Duelos Vencidos</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; color: #ef4444; font-weight: 700;">${stats.duelsLost || 0}</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Duelos Perdidos</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; color: #3b82f6; font-weight: 700;">${stats.arenaWins || 0}</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Arenas Vencidas</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; color: #f59e0b; font-weight: 700;">${stats.kills || 0}</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Kills Totais</div>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px;">
                <h4 style="margin: 0 0 15px 0; color: #ef4444;">📊 Estatísticas Detalhadas</h4>
                <div style="display: grid; gap: 10px;">
                    ${this.renderStatRow('Win Rate Duelos', `${stats.duelWinRate || 0}%`)}
                    ${this.renderStatRow('Win Rate Arenas', `${stats.arenaWinRate || 0}%`)}
                    ${this.renderStatRow('K/D Ratio', stats.kdr || '0.00')}
                    ${this.renderStatRow('Maior Rating', stats.highestRating || 1000)}
                    ${this.renderStatRow('Mortes', stats.deaths || 0)}
                </div>
            </div>
            
            ${stats.titlesEarned?.length > 0 ? `
                <div style="margin-top: 25px;">
                    <h4 style="margin: 0 0 15px 0; color: #ffd700;">🏆 Títulos Desbloqueados</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${stats.titlesEarned.map(title => `
                            <span style="
                                background: linear-gradient(45deg, #ffd700, #f59e0b);
                                color: #1a1a2e;
                                padding: 6px 12px;
                                border-radius: 20px;
                                font-size: 12px;
                                font-weight: 600;
                            ">${title}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        this.contentArea.appendChild(panel);
    }
    
    renderStatRow(label, value) {
        return `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: rgba(255,255,255,0.7);">${label}</span>
                <span style="color: #fff; font-weight: 600;">${value}</span>
            </div>
        `;
    }
    
    renderLeaderboardTab() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            flex: 1;
            padding: 25px;
            overflow-y: auto;
        `;
        
        panel.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #ef4444;">🏆 Ranking PvP</h3>
            <div id="pvp-leaderboard-list" style="display: flex; flex-direction: column; gap: 8px;">
                <div style="color: rgba(255,255,255,0.5); text-align: center; padding: 40px;">Carregando ranking...</div>
            </div>
        `;
        
        this.contentArea.appendChild(panel);
        
        // Request leaderboard data
        this.socket?.emit('pvp:get_leaderboard', { type: 'rating', limit: 50 });
    }
    
    updateLeaderboard(data) {
        const list = this.contentArea.querySelector('#pvp-leaderboard-list');
        if (!list) return;
        
        if (data.entries.length === 0) {
            list.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center; padding: 40px;">Nenhum dado disponível</div>';
            return;
        }
        
        list.innerHTML = data.entries.map((entry, idx) => `
            <div style="
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 15px;
                background: ${entry.playerId === this.game?.player?.id ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 0, 0, 0.3)'};
                border: 1px solid ${entry.playerId === this.game?.player?.id ? '#ef4444' : 'transparent'};
                border-radius: 10px;
            ">
                <div style="width: 30px; text-align: center; font-weight: 700; color: ${idx < 3 ? '#ffd700' : '#fff'};">${idx + 1}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #fff;">${entry.playerName}</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.5);">${entry.wins} vitórias • ${entry.kills} kills</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700; color: #ef4444;">${entry.rating}</div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.5);">rating</div>
                </div>
            </div>
        `).join('');
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('pvp:stats', (data) => {
            this.playerStats = data;
            if (this.currentTab === 'stats') {
                this.renderContent();
            }
        });
        
        this.socket.on('pvp:leaderboard', (data) => {
            this.updateLeaderboard(data);
        });
        
        this.socket.on('pvp:queued', (data) => {
            this.inQueue = true;
            this.statusDisplay.innerHTML = `⏳ Na fila: ${data.mode}`;
            this.game?.showFloatingText?.('Entrou na fila!', 0, -40, '#ef4444');
            this.renderContent();
        });
        
        this.socket.on('pvp:queue_left', () => {
            this.inQueue = false;
            this.statusDisplay.innerHTML = 'Pronto para combate';
            this.renderContent();
        });
        
        this.socket.on('pvp:arena_match_found', (data) => {
            this.inQueue = false;
            this.game?.showFloatingText?.('Partida encontrada!', 0, -40, '#ef4444');
        });
        
        this.socket.on('pvp:duel_request_received', (data) => {
            // Show duel request notification
            if (window.notificationManager) {
                window.notificationManager.addNotification({
                    title: 'Desafio de Duelo!',
                    message: `${data.fromPlayerName} te desafiou para um duelo!`,
                    category: 'combat',
                    actions: [
                        { id: 'accept', label: 'Aceitar', handler: () => {
                            this.socket.emit('pvp:duel_accept', { fromPlayerId: data.fromPlayerId });
                        }},
                        { id: 'decline', label: 'Recusar', handler: () => {
                            this.socket.emit('pvp:duel_decline', { fromPlayerId: data.fromPlayerId });
                        }}
                    ]
                });
            }
        });
        
        this.socket.on('pvp:title_unlocked', (data) => {
            this.game?.showFloatingText?.(`Título desbloqueado: ${data.title}!`, 0, -40, '#ffd700');
        });
        
        this.socket.on('pvp:error', (data) => {
            this.game?.showFloatingText?.(data.message, 0, -40, '#ef4444');
            this.inQueue = false;
            this.statusDisplay.innerHTML = 'Pronto para combate';
            this.renderContent();
        });
    }
    
    // ===== KEYBOARD =====
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' && !e.ctrlKey && !e.altKey && !e.metaKey) {
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
        this.renderContent();
        this.socket?.emit('pvp:get_stats');
        
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

window.PvPArenaUI = PvPArenaUI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PvPArenaUI;
}
