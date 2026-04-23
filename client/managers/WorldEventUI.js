/**
 * WorldEventUI - Interface de Eventos de Mundo
 * 
 * Features:
 * - Lista de eventos ativos
 * - Notificações de eventos em tempo real
 * - Participação em eventos
 * - Leaderboard de contribuição
 * - Timer/contagem regressiva
 * - Indicadores visuais no mapa
 */

class WorldEventUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.activeEvents = [];
        this.currentEvent = null;
        this.eventNotifications = [];
        
        // Event type definitions (mirror from server)
        this.EVENT_TYPES = {
            monster_invasion: {
                name: 'Invasão de Monstros',
                icon: '👹',
                color: '#DC143C',
                description: 'Defenda a cidade das hordas de monstros!'
            },
            world_boss: {
                name: 'Boss World',
                icon: '👾',
                color: '#8B008B',
                description: 'Derrote o boss poderoso com outros jogadores!'
            },
            meteor_shower: {
                name: 'Chuva de Meteoros',
                icon: '☄️',
                color: '#FF4500',
                description: 'Colete meteoros para obter recursos raros!'
            },
            treasure_hunt: {
                name: 'Caça ao Tesouro',
                icon: '💰',
                color: '#FFD700',
                description: 'Encontre tesouros escondidos primeiro!'
            },
            defense_line: {
                name: 'Linha de Defesa',
                icon: '🛡️',
                color: '#4169E1',
                description: 'Defenda a linha contra ondas de inimigos!'
            }
        };
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
        this.startUpdateLoop();
    }
    
    createUI() {
        // Main container (hidden by default)
        this.container = document.createElement('div');
        this.container.id = 'worldevent-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 700px;
            height: 550px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #4169E1;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
            overflow: hidden;
        `;
        
        // Header
        const header = this.createHeader();
        this.container.appendChild(header);
        
        // Content
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            flex: 1;
            overflow: hidden;
        `;
        
        // Sidebar with active events
        this.sidebar = document.createElement('div');
        this.sidebar.style.cssText = `
            width: 280px;
            background: rgba(0, 0, 0, 0.3);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            overflow-y: auto;
            padding: 15px;
        `;
        
        content.appendChild(this.sidebar);
        
        // Main panel
        this.mainPanel = document.createElement('div');
        this.mainPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        content.appendChild(this.mainPanel);
        
        this.container.appendChild(content);
        
        // Event notification area (top of screen)
        this.notificationArea = document.createElement('div');
        this.notificationArea.id = 'worldevent-notifications';
        this.notificationArea.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 9000;
            pointer-events: none;
        `;
        
        document.body.appendChild(this.container);
        document.body.appendChild(this.notificationArea);
        
        // Event indicator (bottom right, always visible if event active)
        this.eventIndicator = document.createElement('div');
        this.eventIndicator.id = 'worldevent-indicator';
        this.eventIndicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(65, 105, 225, 0.9), rgba(139, 0, 139, 0.9));
            padding: 12px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            z-index: 8000;
            display: none;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            transition: all 0.3s;
        `;
        this.eventIndicator.onclick = () => this.show();
        document.body.appendChild(this.eventIndicator);
        
        this.renderMainPanel();
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #4169E1, #8B008B);
            padding: 18px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '🌍 Eventos de Mundo';
        title.style.cssText = `
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.onclick = () => this.hide();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        return header;
    }
    
    // ===== EVENT LIST RENDERING =====
    
    renderEventList() {
        this.sidebar.innerHTML = '';
        
        if (this.activeEvents.length === 0) {
            this.sidebar.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.5);">
                    <div style="font-size: 48px; margin-bottom: 15px;">😴</div>
                    <h3 style="margin: 0 0 10px 0; font-size: 16px;">Nenhum Evento Ativo</h3>
                    <p style="margin: 0; font-size: 13px;">Eventos de mundo aparecem periodicamente. Fique atento!</p>
                </div>
            `;
            return;
        }
        
        // Header
        const listHeader = document.createElement('div');
        listHeader.textContent = `${this.activeEvents.length} Evento(s) Ativo(s)`;
        listHeader.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        this.sidebar.appendChild(listHeader);
        
        // Event items
        for (const event of this.activeEvents) {
            const item = this.createEventItem(event);
            this.sidebar.appendChild(item);
        }
    }
    
    createEventItem(event) {
        const type = this.EVENT_TYPES[event.type];
        const remaining = event.endTime - Date.now();
        const minutes = Math.ceil(remaining / 60000);
        
        const item = document.createElement('div');
        item.className = 'worldevent-item';
        item.dataset.eventId = event.id;
        item.style.cssText = `
            display: flex;
            align-items: center;
            padding: 15px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid transparent;
        `;
        
        item.onmouseover = () => {
            item.style.background = 'rgba(255, 255, 255, 0.1)';
            item.style.borderColor = type.color;
        };
        
        item.onmouseout = () => {
            if (this.currentEvent?.id !== event.id) {
                item.style.background = 'rgba(255, 255, 255, 0.05)';
                item.style.borderColor = 'transparent';
            }
        };
        
        item.onclick = () => this.selectEvent(event);
        
        // Icon
        const icon = document.createElement('div');
        icon.textContent = type.icon;
        icon.style.cssText = `
            font-size: 32px;
            margin-right: 12px;
            filter: drop-shadow(0 0 8px ${type.color});
        `;
        
        // Info
        const info = document.createElement('div');
        info.style.cssText = 'flex: 1;';
        
        const name = document.createElement('div');
        name.textContent = type.name;
        name.style.cssText = `
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
        `;
        
        const meta = document.createElement('div');
        meta.style.cssText = `
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        `;
        meta.innerHTML = `
            <span style="color: ${type.color};">●</span> ${event.location} • 
            <span style="color: ${minutes < 5 ? '#ef4444' : '#22c55e'};">⏱️ ${minutes}min</span>
        `;
        
        info.appendChild(name);
        info.appendChild(meta);
        
        item.appendChild(icon);
        item.appendChild(info);
        
        return item;
    }
    
    // ===== MAIN PANEL =====
    
    renderMainPanel() {
        if (!this.currentEvent) {
            this.mainPanel.innerHTML = `
                <div style="text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.5);">
                    <div style="font-size: 64px; margin-bottom: 20px;">🌍</div>
                    <h3 style="margin: 0 0 10px 0; font-size: 20px;">Eventos de Mundo</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                        Eventos especiais que acontecem periodicamente no mundo.<br>
                        Participe para ganhar recompensas exclusivas!
                    </p>
                </div>
            `;
            return;
        }
        
        const event = this.currentEvent;
        const type = this.EVENT_TYPES[event.type];
        const remaining = Math.max(0, event.endTime - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        this.mainPanel.innerHTML = '';
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const icon = document.createElement('div');
        icon.textContent = type.icon;
        icon.style.cssText = `
            font-size: 56px;
            margin-right: 20px;
            filter: drop-shadow(0 0 15px ${type.color});
        `;
        
        const info = document.createElement('div');
        info.innerHTML = `
            <h2 style="margin: 0 0 8px 0; color: ${type.color}; font-size: 24px;">${type.name}</h2>
            <div style="display: flex; gap: 15px; align-items: center; font-size: 14px;">
                <span style="color: rgba(255,255,255,0.7);">📍 ${event.location}</span>
                <span style="color: rgba(255,255,255,0.7);">👥 ${event.participants || 0} participantes</span>
            </div>
        `;
        
        header.appendChild(icon);
        header.appendChild(info);
        this.mainPanel.appendChild(header);
        
        // Timer
        const timerSection = document.createElement('div');
        timerSection.style.cssText = `
            background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2));
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
        `;
        
        timerSection.innerHTML = `
            <div style="font-size: 12px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 10px;">
                Tempo Restante
            </div>
            <div style="font-size: 36px; font-weight: 700; color: ${remaining < 5 * 60000 ? '#ef4444' : '#fff'}; font-family: monospace;">
                ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
            </div>
        `;
        this.mainPanel.appendChild(timerSection);
        
        // Description
        const descSection = document.createElement('div');
        descSection.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        `;
        descSection.innerHTML = `
            <h4 style="margin: 0 0 12px 0; color: ${type.color}; font-size: 15px;">📜 Descrição</h4>
            <p style="margin: 0; color: rgba(255,255,255,0.9); line-height: 1.6; font-size: 14px;">
                ${type.description}
            </p>
        `;
        this.mainPanel.appendChild(descSection);
        
        // Action buttons
        const buttonSection = document.createElement('div');
        buttonSection.style.cssText = `
            display: flex;
            gap: 12px;
        `;
        
        // Join button (if not already joined)
        const isParticipating = event.isParticipating;
        
        const joinBtn = document.createElement('button');
        joinBtn.textContent = isParticipating ? '✓ Você está participando' : '🎯 Participar do Evento';
        joinBtn.style.cssText = `
            flex: 1;
            padding: 14px 20px;
            background: ${isParticipating ? 'linear-gradient(45deg, #22c55e, #16a34a)' : 'linear-gradient(45deg, #4169E1, #8B008B)'};
            border: none;
            border-radius: 10px;
            color: white;
            font-weight: 700;
            font-size: 15px;
            cursor: ${isParticipating ? 'default' : 'pointer'};
            transition: all 0.2s;
        `;
        
        if (!isParticipating) {
            joinBtn.onmouseover = () => {
                joinBtn.style.transform = 'translateY(-2px)';
                joinBtn.style.boxShadow = '0 8px 25px rgba(65, 105, 225, 0.4)';
            };
            joinBtn.onmouseout = () => {
                joinBtn.style.transform = 'translateY(0)';
                joinBtn.style.boxShadow = 'none';
            };
            joinBtn.onclick = () => this.joinEvent(event);
        }
        
        buttonSection.appendChild(joinBtn);
        this.mainPanel.appendChild(buttonSection);
        
        // Leaderboard (if participating)
        if (isParticipating && event.leaderboard) {
            const leaderboardSection = document.createElement('div');
            leaderboardSection.style.cssText = `
                background: rgba(0, 0, 0, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin-top: 20px;
            `;
            
            let leaderboardHTML = `
                <h4 style="margin: 0 0 15px 0; color: #f59e0b; font-size: 15px;">🏆 Top Contribuidores</h4>
                <div style="display: grid; gap: 8px;">
            `;
            
            event.leaderboard.slice(0, 5).forEach((entry, index) => {
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                leaderboardHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: ${index < 3 ? 'rgba(245, 158, 11, 0.1)' : 'transparent'}; border-radius: 6px;">
                        <span>${medals[index]} ${entry.playerId}</span>
                        <span style="color: #f59e0b; font-weight: 600;">${entry.score} pts</span>
                    </div>
                `;
            });
            
            leaderboardHTML += '</div>';
            leaderboardSection.innerHTML = leaderboardHTML;
            this.mainPanel.appendChild(leaderboardSection);
        }
        
        // Personal contribution (if participating)
        if (isParticipating && event.contribution) {
            const contribSection = document.createElement('div');
            contribSection.style.cssText = `
                background: rgba(65, 105, 225, 0.1);
                border: 1px solid rgba(65, 105, 225, 0.3);
                border-radius: 12px;
                padding: 15px;
                margin-top: 15px;
            `;
            
            contribSection.innerHTML = `
                <h4 style="margin: 0 0 10px 0; color: #4169E1; font-size: 14px;">📊 Sua Contribuição</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                    <div>
                        <div style="font-size: 20px; font-weight: 700; color: #fff;">${event.contribution.kills || 0}</div>
                        <div style="font-size: 11px; color: rgba(255,255,255,0.6);">Kills</div>
                    </div>
                    <div>
                        <div style="font-size: 20px; font-weight: 700; color: #fff;">${event.contribution.damage || 0}</div>
                        <div style="font-size: 11px; color: rgba(255,255,255,0.6);">Dano</div>
                    </div>
                    <div>
                        <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${event.contribution.score || 0}</div>
                        <div style="font-size: 11px; color: rgba(255,255,255,0.6);">Pontos</div>
                    </div>
                </div>
            `;
            
            this.mainPanel.appendChild(contribSection);
        }
    }
    
    // ===== NOTIFICATIONS =====
    
    showEventNotification(event) {
        const type = this.EVENT_TYPES[event.type];
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: linear-gradient(135deg, ${type.color}, ${this.darkenColor(type.color, 20)});
            padding: 15px 25px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            animation: slideDown 0.5s ease;
            pointer-events: auto;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 15px;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 32px;">${type.icon}</span>
            <div>
                <div style="font-size: 16px; margin-bottom: 3px;">🌍 ${type.name}</div>
                <div style="font-size: 13px; opacity: 0.9;">${type.description}</div>
            </div>
        `;
        
        notification.onclick = () => {
            this.show();
            this.selectEvent(event);
            notification.remove();
        };
        
        this.notificationArea.appendChild(notification);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 10000);
    }
    
    updateEventIndicator() {
        if (this.activeEvents.length === 0) {
            this.eventIndicator.style.display = 'none';
            return;
        }
        
        // Show the most urgent event (shortest time remaining)
        const urgentEvent = this.activeEvents
            .sort((a, b) => a.endTime - b.endTime)[0];
        const type = this.EVENT_TYPES[urgentEvent.type];
        const remaining = Math.max(0, urgentEvent.endTime - Date.now());
        const minutes = Math.ceil(remaining / 60000);
        
        this.eventIndicator.style.display = 'block';
        this.eventIndicator.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">${type.icon}</span>
                <div>
                    <div style="font-size: 14px;">${type.name}</div>
                    <div style="font-size: 12px; opacity: 0.8;">⏱️ ${minutes}min restantes</div>
                </div>
            </div>
        `;
        
        this.eventIndicator.style.background = `linear-gradient(135deg, ${type.color}, ${this.darkenColor(type.color, 30)})`;
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        // Event started
        this.socket.on('worldevent:started', (data) => {
            this.handleEventStarted(data);
        });
        
        // Event ended
        this.socket.on('worldevent:ended', (data) => {
            this.handleEventEnded(data);
        });
        
        // Time update
        this.socket.on('worldevent:time_update', (data) => {
            this.handleTimeUpdate(data);
        });
        
        // Joined event
        this.socket.on('worldevent:joined', (data) => {
            this.handleJoinedEvent(data);
        });
        
        // Leaderboard update
        this.socket.on('worldevent:leaderboard', (data) => {
            this.handleLeaderboardUpdate(data);
        });
        
        // Contribution update
        this.socket.on('worldevent:contribution_updated', (data) => {
            this.handleContributionUpdate(data);
        });
        
        // Rewards
        this.socket.on('worldevent:rewards', (data) => {
            this.handleRewards(data);
        });
        
        // Wave updates (for invasion/defense)
        this.socket.on('worldevent:wave_started', (data) => {
            this.handleWaveStarted(data);
        });
        
        this.socket.on('worldevent:wave_completed', (data) => {
            this.handleWaveCompleted(data);
        });
    }
    
    handleEventStarted(data) {
        // Add to active events
        const existingIndex = this.activeEvents.findIndex(e => e.id === data.eventId);
        if (existingIndex >= 0) {
            this.activeEvents[existingIndex] = { ...this.activeEvents[existingIndex], ...data };
        } else {
            this.activeEvents.push({
                ...data,
                isParticipating: false,
                contribution: null,
                leaderboard: null
            });
        }
        
        // Show notification
        this.showEventNotification(data);
        
        // Update UI
        this.renderEventList();
        this.updateEventIndicator();
        
        // Show floating text in game
        this.game?.showFloatingText?.(`🌍 ${data.name} começou!`, 0, -80, data.color);
    }
    
    handleEventEnded(data) {
        // Remove from active events
        this.activeEvents = this.activeEvents.filter(e => e.id !== data.eventId);
        
        // Update UI
        this.renderEventList();
        this.renderMainPanel();
        this.updateEventIndicator();
        
        // Notification
        if (this.currentEvent?.id === data.eventId) {
            this.game?.showFloatingText?.(`Evento ${data.reason === 'completed' ? 'completado' : 'encerrado'}!`, 0, -80, '#22c55e');
        }
    }
    
    handleJoinedEvent(data) {
        const event = this.activeEvents.find(e => e.id === data.eventId);
        if (event) {
            event.isParticipating = true;
            this.currentEvent = event;
            this.renderMainPanel();
        }
        
        this.game?.showFloatingText?.('Você entrou no evento!', 0, -50, '#22c55e');
    }
    
    handleLeaderboardUpdate(data) {
        const event = this.activeEvents.find(e => e.id === data.eventId);
        if (event) {
            event.leaderboard = data.leaderboard;
            if (this.currentEvent?.id === data.eventId) {
                this.renderMainPanel();
            }
        }
    }
    
    handleContributionUpdate(data) {
        const event = this.activeEvents.find(e => e.id === this.currentEvent?.id);
        if (event) {
            event.contribution = data;
            if (this.currentEvent?.id === event.id) {
                this.renderMainPanel();
            }
        }
    }
    
    handleRewards(data) {
        // Show rewards screen
        const rewardsModal = document.createElement('div');
        rewardsModal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 40px 60px;
            border-radius: 20px;
            border: 3px solid #22c55e;
            text-align: center;
            z-index: 20000;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        `;
        
        let rankText = '';
        if (data.rank <= 3) {
            const medals = ['🥇', '🥈', '🥉'];
            rankText = `<div style="font-size: 48px; margin: 15px 0;">${medals[data.rank - 1]}</div>
                       <div style="color: #f59e0b; font-weight: 600;">${data.rank}º Lugar!</div>`;
        }
        
        rewardsModal.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
            <h2 style="margin: 0 0 15px 0; color: #22c55e; font-size: 28px;">Evento Completado!</h2>
            ${rankText}
            <div style="display: grid; gap: 15px; margin: 25px 0;">
                <div style="color: #eab308; font-size: 20px; font-weight: 600;">💰 +${data.gold} Ouro</div>
                <div style="color: #22c55e; font-size: 20px; font-weight: 600;">⭐ +${data.xp.toLocaleString()} XP</div>
            </div>
            <div style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 25px;">
                Itens: ${data.items.join(', ')}
            </div>
            <button onclick="this.parentElement.remove()" style="
                padding: 12px 40px;
                background: linear-gradient(45deg, #22c55e, #16a34a);
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: 700;
                cursor: pointer;
                font-size: 16px;
            ">Continuar</button>
        `;
        
        document.body.appendChild(rewardsModal);
    }
    
    handleWaveStarted(data) {
        this.game?.showFloatingText?.(`Onda ${data.wave} iniciada!`, 0, -60, '#ef4444');
    }
    
    handleWaveCompleted(data) {
        this.game?.showFloatingText?.(`Onda ${data.wave} completada!`, 0, -60, '#22c55e');
    }
    
    handleTimeUpdate(data) {
        // Update timer in UI if this is the current event
        if (this.currentEvent?.id === data.eventId) {
            this.currentEvent.endTime = Date.now() + data.remaining;
            this.renderMainPanel();
        }
    }
    
    // ===== ACTIONS =====
    
    selectEvent(event) {
        this.currentEvent = event;
        
        // Update visual selection
        document.querySelectorAll('.worldevent-item').forEach(el => {
            if (el.dataset.eventId === event.id) {
                const type = this.EVENT_TYPES[event.type];
                el.style.background = `rgba(65, 105, 225, 0.2)`;
                el.style.borderColor = type.color;
            } else {
                el.style.background = 'rgba(255, 255, 255, 0.05)';
                el.style.borderColor = 'transparent';
            }
        });
        
        this.renderMainPanel();
    }
    
    joinEvent(event) {
        if (!this.socket) return;
        
        this.socket.emit('event:join', { eventId: event.id });
    }
    
    // ===== UPDATE LOOP =====
    
    startUpdateLoop() {
        // Update timer display every second
        setInterval(() => {
            if (this.isVisible && this.currentEvent) {
                this.renderMainPanel();
            }
            this.updateEventIndicator();
        }, 1000);
    }
    
    // ===== KEYBOARD =====
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'w' && !e.ctrlKey && !e.altKey && !e.metaKey) {
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
    
    // ===== UTILITIES =====
    
    darkenColor(color, percent) {
        // Simple color darkening for gradients
        return color;
    }
    
    // ===== SHOW/HIDE =====
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.renderEventList();
        this.renderMainPanel();
        
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

// Exportar
if (typeof window !== 'undefined') {
    window.WorldEventUI = WorldEventUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorldEventUI;
}
