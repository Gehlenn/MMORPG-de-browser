/**
 * PvPUI - Interface de Player vs Player
 *
 * Features:
 * - Painel de duelos e arenas
 * - Leaderboard com rankings
 * - Convites de duelo
 * - Status de PvP em tempo real
 * - Histórico de combates
 * - Atalho de teclado (V)
 */

class PvPUI {
    constructor(pvpManager) {
        this.pvpManager = pvpManager;
        this.visible = false;
        this.elements = {};
        this.currentTab = 'duel'; // duel, arena, ranking, history
        this.initialized = false;

        // Estado da UI
        this.duelAnimation = null;
    }

    init() {
        if (this.initialized) return;

        this.createStyles();
        this.createPvPPanel();
        this.bindKeys();

        // Bind events do manager
        if (this.pvpManager) {
            this.pvpManager.onDuelStarted = (duel) => {
                this.showToast(`⚔️ Duelo iniciado! ${duel.player1.name} vs ${duel.player2.name}`, 'success');
                this.render();
            };

            this.pvpManager.onDuelEnded = (duel) => {
                const result = duel.winner
                    ? (duel.winner.id === this.pvpManager.playerId ? '🏆 Você venceu!' : '❌ Você perdeu')
                    : '🤝 Empate';
                this.showToast(result, duel.winner?.id === this.pvpManager.playerId ? 'success' : 'warning');
                this.render();
            };

            this.pvpManager.onDuelInvite = (invite) => {
                if (invite.status === 'expired') return;
                this.showDuelInvite(invite);
            };

            this.pvpManager.onRankUpdated = (rank, change) => {
                const msg = change > 0
                    ? `📈 Rating: ${rank.rating} (+${change})`
                    : `📉 Rating: ${rank.rating} (${change})`;
                this.showToast(msg, change > 0 ? 'success' : 'warning');
                this.render();
            };

            this.pvpManager.onArenaJoined = (arena) => {
                this.showToast(`🎯 Entrou na arena: ${arena.name}`, 'success');
                this.render();
            };

            this.pvpManager.onArenaLeft = () => {
                this.showToast('🚫 Saiu da arena', 'info');
                this.render();
            };
        }

        this.initialized = true;
        console.log('⚔️ PvPUI inicializada');
    }

    createStyles() {
        const styles = document.createElement('style');
        styles.id = 'pvp-ui-styles';
        styles.textContent = `
            .pvp-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 650px;
                max-height: 85vh;
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #e74c3c;
                border-radius: 12px;
                box-shadow: 0 0 30px rgba(231, 76, 60, 0.3), 0 10px 40px rgba(0,0,0,0.5);
                z-index: 99999;
                display: none;
                flex-direction: column;
                overflow: hidden;
                font-family: 'Cinzel', serif;
            }

            .pvp-panel.active { display: flex; }

            .pvp-header {
                background: linear-gradient(135deg, #c0392b 0%, #e74c3c 50%, #c0392b 100%);
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #a93226;
            }

            .pvp-title {
                color: #fff;
                font-size: 18px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .pvp-rank-badge {
                background: rgba(255,255,255,0.2);
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
            }

            .pvp-close-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: #fff;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                transition: all 0.2s ease;
            }

            .pvp-close-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }

            .pvp-tabs {
                display: flex;
                background: rgba(0,0,0,0.2);
                border-bottom: 1px solid rgba(231, 76, 60, 0.3);
            }

            .pvp-tab {
                flex: 1;
                padding: 12px 15px;
                background: transparent;
                border: none;
                color: #aaa;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .pvp-tab:hover { color: #fff; background: rgba(231, 76, 60, 0.1); }
            .pvp-tab.active { color: #e74c3c; background: rgba(231, 76, 60, 0.15); border-bottom: 2px solid #e74c3c; }

            .pvp-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }

            .pvp-content::-webkit-scrollbar { width: 6px; }
            .pvp-content::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            .pvp-content::-webkit-scrollbar-thumb { background: #e74c3c; border-radius: 3px; }

            .pvp-section { margin-bottom: 25px; }
            .pvp-section-title {
                color: #e74c3c;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            /* Status Card */
            .pvp-status-card {
                background: linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(192, 57, 43, 0.05) 100%);
                border: 1px solid rgba(231, 76, 60, 0.3);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
            }

            .pvp-rating-display {
                text-align: center;
                margin-bottom: 20px;
            }

            .pvp-rating-number {
                font-size: 48px;
                font-weight: bold;
                color: #e74c3c;
                text-shadow: 0 0 20px rgba(231, 76, 60, 0.5);
            }

            .pvp-rating-title {
                font-size: 18px;
                color: #ffd700;
                margin-top: 5px;
            }

            .pvp-stats-row {
                display: flex;
                justify-content: space-around;
                margin-top: 15px;
            }

            .pvp-stat {
                text-align: center;
            }

            .pvp-stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #fff;
            }

            .pvp-stat-label {
                font-size: 11px;
                color: #aaa;
                text-transform: uppercase;
            }

            /* Duel Panel */
            .pvp-duel-controls {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .pvp-duel-input {
                display: flex;
                gap: 10px;
            }

            .pvp-duel-input input {
                flex: 1;
                padding: 12px 15px;
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(231, 76, 60, 0.3);
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
            }

            .pvp-duel-input input:focus {
                outline: none;
                border-color: #e74c3c;
            }

            .pvp-btn {
                padding: 12px 25px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: center;
            }

            .pvp-btn-primary {
                background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
                color: #fff;
                box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
            }

            .pvp-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
            }

            .pvp-btn-secondary {
                background: rgba(255,255,255,0.1);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.2);
            }

            .pvp-btn-secondary:hover { background: rgba(255,255,255,0.15); }

            .pvp-btn-danger {
                background: linear-gradient(135deg, #7f0000 0%, #c0392b 100%);
                color: #fff;
            }

            .pvp-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none !important;
            }

            /* Duel Display */
            .pvp-duel-display {
                background: rgba(0,0,0,0.3);
                border-radius: 12px;
                padding: 25px;
                margin-top: 20px;
            }

            .pvp-duel-arena {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .pvp-combatant {
                flex: 1;
                text-align: center;
            }

            .pvp-combatant-avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                margin: 0 auto 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 36px;
                border: 3px solid;
            }

            .pvp-combatant-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 8px;
            }

            .pvp-hp-bar {
                width: 100%;
                height: 20px;
                background: rgba(0,0,0,0.3);
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 5px;
            }

            .pvp-hp-fill {
                height: 100%;
                background: linear-gradient(90deg, #c0392b 0%, #e74c3c 100%);
                border-radius: 10px;
                transition: width 0.3s ease;
            }

            .pvp-hp-text {
                font-size: 12px;
                color: #aaa;
            }

            .pvp-vs-indicator {
                font-size: 32px;
                font-weight: bold;
                color: #e74c3c;
                text-shadow: 0 0 20px rgba(231, 76, 60, 0.5);
                animation: pulse-vs 1.5s infinite;
            }

            @keyframes pulse-vs {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }

            .pvp-duel-log {
                margin-top: 20px;
                max-height: 150px;
                overflow-y: auto;
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
                padding: 15px;
            }

            .pvp-log-entry {
                padding: 5px 0;
                font-size: 13px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }

            .pvp-log-entry:last-child { border-bottom: none; }

            /* Arena List */
            .pvp-arena-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .pvp-arena-card {
                background: rgba(0,0,0,0.2);
                border: 1px solid rgba(231, 76, 60, 0.2);
                border-radius: 10px;
                padding: 20px;
                transition: all 0.2s ease;
            }

            .pvp-arena-card:hover {
                border-color: rgba(231, 76, 60, 0.4);
                transform: translateX(5px);
            }

            .pvp-arena-header {
                display: flex;
                justify-content: space-between;
                align-items: start;
                margin-bottom: 10px;
            }

            .pvp-arena-name {
                font-size: 16px;
                font-weight: bold;
                color: #fff;
                margin-bottom: 5px;
            }

            .pvp-arena-type {
                font-size: 11px;
                padding: 3px 10px;
                border-radius: 10px;
                text-transform: uppercase;
            }

            .pvp-type-ffa { background: #9c27b0; color: #fff; }
            .pvp-type-duel { background: #e74c3c; color: #fff; }
            .pvp-type-team { background: #2196f3; color: #fff; }

            .pvp-arena-desc {
                color: #aaa;
                font-size: 13px;
                margin-bottom: 15px;
            }

            .pvp-arena-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .pvp-arena-players {
                font-size: 13px;
                color: #888;
            }

            .pvp-arena-rewards {
                display: flex;
                gap: 15px;
                font-size: 12px;
                color: #ffd700;
            }

            /* Leaderboard */
            .pvp-leaderboard {
                background: rgba(0,0,0,0.2);
                border-radius: 10px;
                overflow: hidden;
            }

            .pvp-lb-header {
                display: grid;
                grid-template-columns: 50px 1fr 100px 80px 80px;
                padding: 12px 15px;
                background: rgba(231, 76, 60, 0.1);
                font-size: 12px;
                color: #aaa;
                text-transform: uppercase;
                border-bottom: 1px solid rgba(231, 76, 60, 0.2);
            }

            .pvp-lb-row {
                display: grid;
                grid-template-columns: 50px 1fr 100px 80px 80px;
                padding: 12px 15px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                align-items: center;
                transition: background 0.2s ease;
            }

            .pvp-lb-row:hover { background: rgba(255,255,255,0.05); }
            .pvp-lb-row:last-child { border-bottom: none; }

            .pvp-lb-rank {
                font-weight: bold;
                font-size: 16px;
            }

            .pvp-lb-rank.top-1 { color: #ffd700; }
            .pvp-lb-rank.top-2 { color: #c0c0c0; }
            .pvp-lb-rank.top-3 { color: #cd7f32; }

            .pvp-lb-player {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .pvp-lb-title {
                font-size: 10px;
                padding: 2px 8px;
                border-radius: 10px;
                color: #fff;
            }

            .pvp-lb-rating { font-weight: bold; color: #e74c3c; }
            .pvp-lb-wins { color: #4caf50; }
            .pvp-lb-losses { color: #f44336; }

            .pvp-lb-row.player-row {
                background: rgba(231, 76, 60, 0.1);
                border-left: 3px solid #e74c3c;
            }

            /* Invite Popup */
            .pvp-invite-popup {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #e74c3c;
                border-radius: 12px;
                padding: 20px;
                width: 320px;
                z-index: 100000;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(231, 76, 60, 0.2);
                animation: slide-in 0.3s ease;
            }

            @keyframes slide-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            .pvp-invite-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 15px;
            }

            .pvp-invite-icon {
                font-size: 32px;
            }

            .pvp-invite-text {
                flex: 1;
            }

            .pvp-invite-title {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 3px;
            }

            .pvp-invite-subtitle {
                font-size: 12px;
                color: #aaa;
            }

            .pvp-invite-actions {
                display: flex;
                gap: 10px;
            }

            .pvp-invite-actions .pvp-btn {
                flex: 1;
                padding: 10px;
                font-size: 13px;
            }

            /* Toast */
            .pvp-toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 12px 25px;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                z-index: 100001;
                animation: toast-up 0.3s ease;
            }

            @keyframes toast-up {
                from { transform: translateX(-50%) translateY(100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }

            .pvp-toast.success { background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); }
            .pvp-toast.warning { background: linear-gradient(135deg, #f39c12 0%, #f1c40f 100%); }
            .pvp-toast.error { background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%); }
            .pvp-toast.info { background: linear-gradient(135deg, #2980b9 0%, #3498db 100%); }
        `;

        if (!document.getElementById('pvp-ui-styles')) {
            document.head.appendChild(styles);
        }
    }

    createPvPPanel() {
        const panel = document.createElement('div');
        panel.id = 'pvp-panel';
        panel.className = 'pvp-panel';

        panel.innerHTML = `
            <div class="pvp-header">
                <div class="pvp-title">
                    ⚔️ PvP - Combate
                    <span class="pvp-rank-badge" id="pvp-rank-badge">Novato</span>
                </div>
                <button class="pvp-close-btn" id="pvp-close">×</button>
            </div>
            <div class="pvp-tabs">
                <button class="pvp-tab active" data-tab="duel">⚔️ Duelo</button>
                <button class="pvp-tab" data-tab="arena">🎯 Arena</button>
                <button class="pvp-tab" data-tab="ranking">🏆 Ranking</button>
                <button class="pvp-tab" data-tab="history">📜 Histórico</button>
            </div>
            <div class="pvp-content" id="pvp-content">
                <!-- Content will be rendered here -->
            </div>
        `;

        document.body.appendChild(panel);
        this.elements.panel = panel;
        this.elements.content = document.getElementById('pvp-content');
        this.elements.rankBadge = document.getElementById('pvp-rank-badge');

        // Bind events
        document.getElementById('pvp-close').onclick = () => this.hide();

        panel.querySelectorAll('.pvp-tab').forEach(tab => {
            tab.onclick = () => this.switchTab(tab.dataset.tab);
        });
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'v' || e.key === 'V') {
                if (e.target.tagName === 'INPUT') return;
                this.toggle();
            }
            if (e.key === 'Escape' && this.visible) {
                this.hide();
            }
        });
    }

    show() {
        if (!this.visible) {
            this.visible = true;
            this.elements.panel.classList.add('active');
            this.render();
        }
    }

    hide() {
        if (this.visible) {
            this.visible = false;
            this.elements.panel.classList.remove('active');
        }
    }

    toggle() {
        if (this.visible) this.hide();
        else this.show();
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.elements.panel.querySelectorAll('.pvp-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        this.render();
    }

    render() {
        if (!this.elements.content) return;

        const status = this.pvpManager ? this.pvpManager.getPvPStatus() : null;

        // Update rank badge
        if (this.elements.rankBadge && status) {
            this.elements.rankBadge.textContent = status.rank.title;
            this.elements.rankBadge.style.background = status.rank.titleColor || '#9e9e9e';
        }

        switch (this.currentTab) {
            case 'duel':
                this.renderDuelTab(status);
                break;
            case 'arena':
                this.renderArenaTab(status);
                break;
            case 'ranking':
                this.renderRankingTab(status);
                break;
            case 'history':
                this.renderHistoryTab(status);
                break;
        }
    }

    renderDuelTab(status) {
        const inDuel = status?.inDuel;
        const duel = status?.duel;

        let html = `
            <div class="pvp-status-card">
                <div class="pvp-rating-display">
                    <div class="pvp-rating-number">${status?.rank?.rating || 1000}</div>
                    <div class="pvp-rating-title">${status?.rank?.title || 'Novato'}</div>
                </div>
                <div class="pvp-stats-row">
                    <div class="pvp-stat">
                        <div class="pvp-stat-value" style="color: #4caf50">${status?.rank?.wins || 0}</div>
                        <div class="pvp-stat-label">Vitórias</div>
                    </div>
                    <div class="pvp-stat">
                        <div class="pvp-stat-value" style="color: #f44336">${status?.rank?.losses || 0}</div>
                        <div class="pvp-stat-label">Derrotas</div>
                    </div>
                    <div class="pvp-stat">
                        <div class="pvp-stat-value">${status?.rank?.draws || 0}</div>
                        <div class="pvp-stat-label">Empates</div>
                    </div>
                    <div class="pvp-stat">
                        <div class="pvp-stat-value" style="color: #ffd700">${status?.winRate || 0}%</div>
                        <div class="pvp-stat-label">Win Rate</div>
                    </div>
                </div>
            </div>
        `;

        if (inDuel && duel) {
            // Show active duel
            const isPlayer1 = duel.player1.id === this.pvpManager.playerId;
            const me = isPlayer1 ? duel.player1 : duel.player2;
            const opponent = isPlayer1 ? duel.player2 : duel.player1;

            html += `
                <div class="pvp-section">
                    <div class="pvp-section-title">Duelo em Andamento</div>
                    <div class="pvp-duel-display">
                        <div class="pvp-duel-arena">
                            <div class="pvp-combatant">
                                <div class="pvp-combatant-avatar" style="border-color: ${me.hp > 30 ? '#4caf50' : '#f44336'}">
                                    ${isPlayer1 ? '🧑' : '👤'}
                                </div>
                                <div class="pvp-combatant-name">${me.name}</div>
                                <div class="pvp-hp-bar">
                                    <div class="pvp-hp-fill" style="width: ${(me.hp / me.maxHp) * 100}%"></div>
                                </div>
                                <div class="pvp-hp-text">${me.hp}/${me.maxHp} HP</div>
                            </div>
                            <div class="pvp-vs-indicator">VS</div>
                            <div class="pvp-combatant">
                                <div class="pvp-combatant-avatar" style="border-color: ${opponent.hp > 30 ? '#4caf50' : '#f44336'}">
                                    ${isPlayer1 ? '👤' : '🧑'}
                                </div>
                                <div class="pvp-combatant-name">${opponent.name}</div>
                                <div class="pvp-hp-bar">
                                    <div class="pvp-hp-fill" style="width: ${(opponent.hp / opponent.maxHp) * 100}%"></div>
                                </div>
                                <div class="pvp-hp-text">${opponent.hp}/${opponent.maxHp} HP</div>
                            </div>
                        </div>
                        <div class="pvp-duel-log" id="pvp-duel-log">
                            ${duel.log.slice(-5).map(entry => `
                                <div class="pvp-log-entry">Round ${entry.round}: ${entry.p1Action} | ${entry.p2Action}</div>
                            `).join('')}
                        </div>
                        ${duel.status === 'active' ? `
                            <button class="pvp-btn pvp-btn-danger" style="width: 100%; margin-top: 15px;" onclick="window.pvpManager.forfeitDuel()">
                                🏳️ Desistir
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            // Show duel controls
            html += `
                <div class="pvp-section">
                    <div class="pvp-section-title">Desafiar para Duelo</div>
                    <div class="pvp-duel-controls">
                        <div class="pvp-duel-input">
                            <input type="text" id="pvp-duel-target" placeholder="Nome do jogador..." maxlength="20">
                            <button class="pvp-btn pvp-btn-primary" onclick="window.pvpUI.sendDuelInvite()">
                                ⚔️ Desafiar
                            </button>
                        </div>
                        <div style="font-size: 12px; color: #888; text-align: center;">
                            💡 Em modo offline, o duelo é simulado automaticamente
                        </div>
                    </div>
                </div>
            `;
        }

        this.elements.content.innerHTML = html;
    }

    renderArenaTab(status) {
        const inArena = status?.inArena;
        const arenas = this.pvpManager ? this.pvpManager.getAvailableArenas() : [];

        let html = '';

        if (inArena && status.arena) {
            const arena = status.arena;
            const allReady = arena.players.every(p => p.ready);

            html += `
                <div class="pvp-section">
                    <div class="pvp-section-title">Arena Atual: ${arena.name}</div>
                    <div class="pvp-status-card">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <span class="pvp-arena-type pvp-type-${arena.type}">${arena.type}</span>
                        </div>
                        <div class="pvp-arena-desc" style="text-align: center; margin-bottom: 20px;">
                            ${arena.description}
                        </div>
                        <div class="pvp-stats-row">
                            <div class="pvp-stat">
                                <div class="pvp-stat-value">${arena.players.length}</div>
                                <div class="pvp-stat-label">Jogadores</div>
                            </div>
                            <div class="pvp-stat">
                                <div class="pvp-stat-value">${arena.minPlayers}</div>
                                <div class="pvp-stat-label">Mínimo</div>
                            </div>
                            <div class="pvp-stat">
                                <div class="pvp-stat-value">${arena.maxPlayers}</div>
                                <div class="pvp-stat-label">Máximo</div>
                            </div>
                        </div>
                        <div style="margin-top: 20px;">
                            <div style="font-size: 12px; color: #888; margin-bottom: 10px;">Jogadores na arena:</div>
                            ${arena.players.map(p => `
                                <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 5px; margin-bottom: 5px;">
                                    <span style="font-size: 16px;">${p.ready ? '✅' : '⏳'}</span>
                                    <span style="flex: 1;">${p.name}</span>
                                    <span style="font-size: 12px; color: ${p.ready ? '#4caf50' : '#f39c12'}">${p.ready ? 'Pronto' : 'Aguardando'}</span>
                                </div>
                            `).join('')}
                        </div>
                        ${arena.status === 'waiting' ? `
                            <div style="display: flex; gap: 10px; margin-top: 20px;">
                                <button class="pvp-btn pvp-btn-primary" style="flex: 1;" onclick="window.pvpManager.setReady(true)">
                                    ✅ Pronto
                                </button>
                                <button class="pvp-btn pvp-btn-secondary" style="flex: 1;" onclick="window.pvpManager.leaveArena()">
                                    🚫 Sair
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="pvp-section">
                    <div class="pvp-section-title">Arenas Disponíveis</div>
                    <div class="pvp-arena-list">
            `;

            arenas.forEach(arena => {
                html += `
                    <div class="pvp-arena-card">
                        <div class="pvp-arena-header">
                            <div>
                                <div class="pvp-arena-name">${arena.name}</div>
                                <span class="pvp-arena-type pvp-type-${arena.type}">${arena.type}</span>
                            </div>
                        </div>
                        <div class="pvp-arena-desc">${arena.description}</div>
                        <div class="pvp-arena-meta">
                            <div class="pvp-arena-players">
                                👥 ${arena.playerCount}/${arena.maxPlayers} jogadores | Nv. ${arena.minLevel}+
                            </div>
                        </div>
                        <div class="pvp-arena-rewards">
                            <span>💰 ${arena.rewards.gold}</span>
                            <span>📚 ${arena.rewards.xp} XP</span>
                            ${arena.rewards.rating ? `<span>🏆 ${arena.rewards.rating} pts</span>` : ''}
                        </div>
                        <button class="pvp-btn pvp-btn-primary" style="width: 100%; margin-top: 15px;"
                            onclick="window.pvpManager.joinArena('${arena.id}')"
                            ${!arena.canJoin ? 'disabled' : ''}>
                            ${arena.canJoin ? '🎯 Entrar na Arena' : '🔒 Arena Cheia'}
                        </button>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        this.elements.content.innerHTML = html;
    }

    renderRankingTab(status) {
        const leaderboard = this.pvpManager ? this.pvpManager.getLeaderboard(10) : [];

        let html = `
            <div class="pvp-section">
                <div class="pvp-section-title">Top 10 - Ranking PvP</div>
                <div class="pvp-leaderboard">
                    <div class="pvp-lb-header">
                        <div>Rank</div>
                        <div>Jogador</div>
                        <div>Rating</div>
                        <div>Vitórias</div>
                        <div>Derrotas</div>
                    </div>
        `;

        leaderboard.forEach(player => {
            const rankClass = player.rank <= 3 ? `top-${player.rank}` : '';
            const isPlayer = player.isPlayer;
            const titleColor = this.pvpManager.titles.find(t => t.title === player.title)?.color || '#9e9e9e';

            html += `
                <div class="pvp-lb-row ${isPlayer ? 'player-row' : ''}">
                    <div class="pvp-lb-rank ${rankClass}">
                        ${player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`}
                    </div>
                    <div class="pvp-lb-player">
                        <span>${player.name}</span>
                        <span class="pvp-lb-title" style="background: ${titleColor}">${player.title}</span>
                    </div>
                    <div class="pvp-lb-rating">${player.rating}</div>
                    <div class="pvp-lb-wins">${player.wins}</div>
                    <div class="pvp-lb-losses">${player.losses}</div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
            <div class="pvp-section">
                <div class="pvp-section-title">Seu Progresso</div>
                <div class="pvp-status-card">
                    <div class="pvp-stats-row">
                        <div class="pvp-stat">
                            <div class="pvp-stat-value" style="color: #e74c3c">${status?.rank?.rating || 1000}</div>
                            <div class="pvp-stat-label">Rating Atual</div>
                        </div>
                        <div class="pvp-stat">
                            <div class="pvp-stat-value" style="color: #ffd700">${status?.rank?.bestStreak || 0}</div>
                            <div class="pvp-stat-label">Melhor Streak</div>
                        </div>
                        <div class="pvp-stat">
                            <div class="pvp-stat-value">${status?.rank?.streak || 0}</div>
                            <div class="pvp-stat-label">Streak Atual</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.elements.content.innerHTML = html;
    }

    renderHistoryTab(status) {
        // Simplified history for offline mode
        const totalDuels = status?.totalDuels || 0;
        const wins = status?.rank?.wins || 0;
        const losses = status?.rank?.losses || 0;
        const draws = status?.rank?.draws || 0;

        let html = `
            <div class="pvp-section">
                <div class="pvp-section-title">Estatísticas de Combate</div>
                <div class="pvp-status-card">
                    <div class="pvp-stats-row">
                        <div class="pvp-stat">
                            <div class="pvp-stat-value">${totalDuels}</div>
                            <div class="pvp-stat-label">Total de Combates</div>
                        </div>
                        <div class="pvp-stat">
                            <div class="pvp-stat-value" style="color: #4caf50">${wins}</div>
                            <div class="pvp-stat-label">Vitórias</div>
                        </div>
                        <div class="pvp-stat">
                            <div class="pvp-stat-value" style="color: #f44336">${losses}</div>
                            <div class="pvp-stat-label">Derrotas</div>
                        </div>
                        <div class="pvp-stat">
                            <div class="pvp-stat-value">${draws}</div>
                            <div class="pvp-stat-label">Empates</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="pvp-section">
                <div class="pvp-section-title">Distribuição de Resultados</div>
                <div class="pvp-status-card">
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #4caf50;">Vitórias</span>
                                <span>${totalDuels > 0 ? Math.round((wins / totalDuels) * 100) : 0}%</span>
                            </div>
                            <div style="width: 100%; height: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden;">
                                <div style="width: ${totalDuels > 0 ? (wins / totalDuels) * 100 : 0}%; height: 100%; background: #4caf50; border-radius: 10px; transition: width 0.5s ease;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #f44336;">Derrotas</span>
                                <span>${totalDuels > 0 ? Math.round((losses / totalDuels) * 100) : 0}%</span>
                            </div>
                            <div style="width: 100%; height: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden;">
                                <div style="width: ${totalDuels > 0 ? (losses / totalDuels) * 100 : 0}%; height: 100%; background: #f44336; border-radius: 10px; transition: width 0.5s ease;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Empates</span>
                                <span>${totalDuels > 0 ? Math.round((draws / totalDuels) * 100) : 0}%</span>
                            </div>
                            <div style="width: 100%; height: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden;">
                                <div style="width: ${totalDuels > 0 ? (draws / totalDuels) * 100 : 0}%; height: 100%; background: #9e9e9e; border-radius: 10px; transition: width 0.5s ease;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.elements.content.innerHTML = html;
    }

    sendDuelInvite() {
        const input = document.getElementById('pvp-duel-target');
        if (!input || !input.value.trim()) return;

        const targetName = input.value.trim();
        const result = this.pvpManager.sendDuelInvite('player_' + targetName, targetName);

        if (result.success) {
            this.showToast(`⚔️ Convite enviado para ${targetName}`, 'success');
            input.value = '';
        } else {
            this.showToast(result.error, 'error');
        }
    }

    showDuelInvite(invite) {
        // Remove existing invite popup
        const existing = document.getElementById('pvp-invite-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'pvp-invite-popup';
        popup.className = 'pvp-invite-popup';

        popup.innerHTML = `
            <div class="pvp-invite-header">
                <div class="pvp-invite-icon">⚔️</div>
                <div class="pvp-invite-text">
                    <div class="pvp-invite-title">Duelo!</div>
                    <div class="pvp-invite-subtitle">${invite.fromName} te desafiou</div>
                </div>
            </div>
            <div class="pvp-invite-actions">
                <button class="pvp-btn pvp-btn-primary" onclick="window.pvpUI.acceptInvite('${invite.fromId}')">
                    Aceitar
                </button>
                <button class="pvp-btn pvp-btn-secondary" onclick="window.pvpUI.declineInvite('${invite.fromId}')">
                    Recusar
                </button>
            </div>
        `;

        document.body.appendChild(popup);

        // Auto-remove after timeout
        setTimeout(() => {
            if (popup.parentNode) popup.remove();
        }, this.pvpManager ? this.pvpManager.duelTimeout : 30000);
    }

    acceptInvite(fromId) {
        const popup = document.getElementById('pvp-invite-popup');
        if (popup) popup.remove();

        // Find invite
        const invite = this.pvpManager.pendingInvites.get(fromId);
        if (invite) {
            this.pvpManager.acceptDuelInvite(invite);
        }
    }

    declineInvite(fromId) {
        const popup = document.getElementById('pvp-invite-popup');
        if (popup) popup.remove();

        this.pvpManager.declineDuelInvite(fromId);
    }

    showToast(message, type = 'info') {
        // Remove existing toast
        const existing = document.querySelector('.pvp-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `pvp-toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 3000);
    }
}

window.PvPUI = PvPUI;
