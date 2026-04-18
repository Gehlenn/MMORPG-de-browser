/**
 * World Event Manager - Dynamic Content System
 * Handles world events, invasions, and seasonal activities
 * Version 0.3 - Social & Multiplayer Systems
 */

class WorldEventManager {
    constructor(networkManager, game) {
        this.networkManager = networkManager;
        this.game = game;
        
        // Active events
        this.activeEvents = new Map();
        this.eventHistory = [];
        this.eventSchedule = [];
        
        // Event types
        this.eventTypes = {
            INVASION: 'invasion',
            BOSS_SPAWN: 'boss_spawn',
            RESOURCE_BONUS: 'resource_bonus',
            WORLD_BOSS: 'world_boss',
            SEASONAL: 'seasonal',
            COMMUNITY: 'community'
        };
        
        // Event settings
        this.settings = {
            showEventNotifications: true,
            autoJoinEvents: false,
            eventSoundEnabled: true,
            minimapEventMarkers: true
        };
        
        // UI elements
        this.eventUI = null;
        this.eventNotification = null;
        this.eventTimer = null;
        
        // Event participants
        this.eventParticipants = new Map();
        this.playerContributions = new Map();
        
        // Initialize
        this.setupNetworkHandlers();
        this.createUI();
        this.startEventScheduler();
    }
    
    setupNetworkHandlers() {
        this.networkManager.registerHandler('event_start', this.handleEventStart.bind(this));
        this.networkManager.registerHandler('event_end', this.handleEventEnd.bind(this));
        this.networkManager.registerHandler('event_update', this.handleEventUpdate.bind(this));
        this.networkManager.registerHandler('event_join', this.handleEventJoin.bind(this));
        this.networkManager.registerHandler('event_leave', this.handleEventLeave.bind(this));
        this.networkManager.registerHandler('event_contribution', this.handleEventContribution.bind(this));
        this.networkManager.registerHandler('event_reward', this.handleEventReward.bind(this));
        this.networkManager.registerHandler('event_schedule', this.handleEventSchedule.bind(this));
    }
    
    createUI() {
        // Create event panel
        this.eventUI = document.createElement('div');
        this.eventUI.className = 'world-event-system';
        this.eventUI.innerHTML = `
            <div class="event-header">
                <h3>Eventos Mundiais</h3>
                <div class="event-controls">
                    <button class="event-toggle" title="Minimizar">_</button>
                </div>
            </div>
            <div class="event-list"></div>
            <div class="event-schedule">
                <h4>Próximos Eventos</h4>
                <div class="schedule-list"></div>
            </div>
        `;
        
        // Style the event UI
        this.eventUI.style.cssText = `
            position: fixed;
            top: 100px;
            left: 20px;
            width: 300px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #444;
            border-radius: 8px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
        `;
        
        // Add to page
        document.body.appendChild(this.eventUI);
        
        // Get references
        this.eventListContainer = this.eventUI.querySelector('.event-list');
        this.scheduleListContainer = this.eventUI.querySelector('.schedule-list');
        
        // Setup event handlers
        this.setupUIHandlers();
        
        // Update UI
        this.updateEventList();
        this.updateScheduleList();
    }
    
    setupUIHandlers() {
        // Toggle button
        this.eventUI.querySelector('.event-toggle').addEventListener('click', () => {
            this.toggleVisibility();
        });
    }
    
    // Event scheduling
    startEventScheduler() {
        // Check for scheduled events every minute
        setInterval(() => {
            this.checkScheduledEvents();
        }, 60000);
        
        // Request current schedule from server
        this.networkManager.sendMessage('get_event_schedule');
    }
    
    checkScheduledEvents() {
        const now = Date.now();
        
        for (const scheduledEvent of this.eventSchedule) {
            if (scheduledEvent.startTime <= now && !scheduledEvent.triggered) {
                this.triggerScheduledEvent(scheduledEvent);
                scheduledEvent.triggered = true;
            }
        }
    }
    
    triggerScheduledEvent(scheduledEvent) {
        // This would typically be handled by the server
        // Client can request the server to start the event
        this.networkManager.sendMessage('trigger_scheduled_event', {
            eventId: scheduledEvent.id
        });
    }
    
    // Event types implementation
    createInvasionEvent(biome, difficulty) {
        const event = {
            id: this.generateEventId(),
            type: this.eventTypes.INVASION,
            name: `Invasão ${this.getBiomeName(biome)}`,
            description: `Monstros estão invadindo o bioma ${this.getBiomeName(biome)}!`,
            biome: biome,
            difficulty: difficulty,
            duration: 3600000, // 1 hour
            startTime: Date.now(),
            endTime: Date.now() + 3600000,
            objectives: this.generateInvasionObjectives(difficulty),
            rewards: this.generateInvasionRewards(difficulty),
            participants: new Set(),
            status: 'active'
        };
        
        this.activeEvents.set(event.id, event);
        this.notifyEventStart(event);
        this.updateEventList();
        
        return event;
    }
    
    createWorldBossEvent(bossType, location) {
        const event = {
            id: this.generateEventId(),
            type: this.eventTypes.WORLD_BOSS,
            name: `World Boss: ${bossType}`,
            description: `Um boss poderoso apareceu em ${location}!`,
            bossType: bossType,
            location: location,
            duration: 7200000, // 2 hours
            startTime: Date.now(),
            endTime: Date.now() + 7200000,
            objectives: this.generateBossObjectives(bossType),
            rewards: this.generateBossRewards(bossType),
            participants: new Set(),
            status: 'active'
        };
        
        this.activeEvents.set(event.id, event);
        this.notifyEventStart(event);
        this.updateEventList();
        
        return event;
    }
    
    createResourceBonusEvent(resourceType, bonusMultiplier, duration) {
        const event = {
            id: this.generateEventId(),
            type: this.eventTypes.RESOURCE_BONUS,
            name: `Bônus de ${this.getResourceName(resourceType)}`,
            description: `Coleta de ${this.getResourceName(resourceType)} com ${bonusMultiplier}x de bônus!`,
            resourceType: resourceType,
            bonusMultiplier: bonusMultiplier,
            duration: duration,
            startTime: Date.now(),
            endTime: Date.now() + duration,
            objectives: this.generateResourceObjectives(resourceType),
            rewards: this.generateResourceRewards(resourceType),
            participants: new Set(),
            status: 'active'
        };
        
        this.activeEvents.set(event.id, event);
        this.notifyEventStart(event);
        this.updateEventList();
        
        return event;
    }
    
    createSeasonalEvent(seasonName, activities) {
        const event = {
            id: this.generateEventId(),
            type: this.eventTypes.SEASONAL,
            name: `Festival de ${seasonName}`,
            description: `Celebre o festival de ${seasonName} com atividades especiais!`,
            seasonName: seasonName,
            activities: activities,
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            startTime: Date.now(),
            endTime: Date.now() + (7 * 24 * 60 * 60 * 1000),
            objectives: this.generateSeasonalObjectives(activities),
            rewards: this.generateSeasonalRewards(seasonName),
            participants: new Set(),
            status: 'active'
        };
        
        this.activeEvents.set(event.id, event);
        this.notifyEventStart(event);
        this.updateEventList();
        
        return event;
    }
    
    // Objective generation
    generateInvasionObjectives(difficulty) {
        const baseObjectives = [
            { type: 'kill', target: 'monsters', count: 50 * difficulty, current: 0 },
            { type: 'survive', duration: 1800000, current: 0 } // 30 minutes
        ];
        
        if (difficulty >= 3) {
            baseObjectives.push({ type: 'kill_elite', target: 'elite_monsters', count: 10 * difficulty, current: 0 });
        }
        
        if (difficulty >= 5) {
            baseObjectives.push({ type: 'kill_boss', target: 'invasion_leader', count: 1, current: 0 });
        }
        
        return baseObjectives;
    }
    
    generateBossObjectives(bossType) {
        return [
            { type: 'damage', target: bossType, count: 100000, current: 0 },
            { type: 'survive', duration: 3600000, current: 0 },
            { type: 'participate', minPlayers: 10, current: 0 }
        ];
    }
    
    generateResourceObjectives(resourceType) {
        return [
            { type: 'gather', target: resourceType, count: 100, current: 0 },
            { type: 'craft', target: `${resourceType}_items`, count: 20, current: 0 }
        ];
    }
    
    generateSeasonalObjectives(activities) {
        const objectives = [];
        
        for (const activity of activities) {
            switch (activity.type) {
                case 'collection':
                    objectives.push({ type: 'collect', target: activity.item, count: activity.count, current: 0 });
                    break;
                case 'combat':
                    objectives.push({ type: 'defeat', target: activity.enemy, count: activity.count, current: 0 });
                    break;
                case 'crafting':
                    objectives.push({ type: 'craft', target: activity.recipe, count: activity.count, current: 0 });
                    break;
            }
        }
        
        return objectives;
    }
    
    // Reward generation
    generateInvasionRewards(difficulty) {
        return {
            experience: 1000 * difficulty,
            gold: 500 * difficulty,
            items: this.generateEventItems(difficulty),
            currency: { type: 'event_tokens', amount: 10 * difficulty }
        };
    }
    
    generateBossRewards(bossType) {
        return {
            experience: 5000,
            gold: 2000,
            items: [
                { id: `${bossType}_essence`, rarity: 'epic', count: 1 },
                { id: 'world_boss_chest', rarity: 'legendary', count: 1 }
            ],
            currency: { type: 'boss_points', amount: 50 }
        };
    }
    
    generateResourceRewards(resourceType) {
        return {
            experience: 500,
            gold: 200,
            items: [
                { id: `${resourceType}_bundle`, rarity: 'rare', count: 1 }
            ],
            currency: { type: 'resource_tokens', amount: 5 }
        };
    }
    
    generateSeasonalRewards(seasonName) {
        return {
            experience: 2000,
            gold: 1000,
            items: [
                { id: `${seasonName}_cosmetic`, rarity: 'epic', count: 1 },
                { id: `${seasonName}_mount`, rarity: 'legendary', count: 1 }
            ],
            currency: { type: 'seasonal_tokens', amount: 25 }
        };
    }
    
    generateEventItems(difficulty) {
        const items = [];
        const rarity = this.getRarityByDifficulty(difficulty);
        
        items.push({
            id: `event_weapon_${difficulty}`,
            rarity: rarity,
            count: 1
        });
        
        if (difficulty >= 3) {
            items.push({
                id: `event_armor_${difficulty}`,
                rarity: rarity,
                count: 1
            });
        }
        
        return items;
    }
    
    // Network message handlers
    handleEventStart(data) {
        const event = {
            ...data.event,
            startTime: Date.now(),
            participants: new Set(),
            status: 'active'
        };
        
        this.activeEvents.set(event.id, event);
        this.notifyEventStart(event);
        this.updateEventList();
        
        // Play event sound if enabled
        if (this.settings.eventSoundEnabled) {
            this.playEventSound(event.type);
        }
    }
    
    handleEventEnd(data) {
        const event = this.activeEvents.get(data.eventId);
        if (!event) return;
        
        event.status = 'completed';
        event.endTime = Date.now();
        
        // Move to history
        this.eventHistory.push(event);
        this.activeEvents.delete(event.id);
        
        this.notifyEventEnd(event, data.rewards);
        this.updateEventList();
        
        // Clean up old history (keep last 50 events)
        if (this.eventHistory.length > 50) {
            this.eventHistory.shift();
        }
    }
    
    handleEventUpdate(data) {
        const event = this.activeEvents.get(data.eventId);
        if (!event) return;
        
        // Update event data
        Object.assign(event, data.updates);
        
        // Update objectives
        if (data.objectiveUpdates) {
            for (const update of data.objectiveUpdates) {
                const objective = event.objectives.find(obj => obj.type === update.type);
                if (objective) {
                    objective.current = update.current;
                }
            }
        }
        
        this.updateEventList();
    }
    
    handleEventJoin(data) {
        const event = this.activeEvents.get(data.eventId);
        if (!event) return;
        
        event.participants.add(data.playerId);
        
        // Update participant count objective
        const participateObjective = event.objectives.find(obj => obj.type === 'participate');
        if (participateObjective) {
            participateObjective.current = event.participants.size;
        }
        
        this.updateEventList();
    }
    
    handleEventLeave(data) {
        const event = this.activeEvents.get(data.eventId);
        if (!event) return;
        
        event.participants.delete(data.playerId);
        this.updateEventList();
    }
    
    handleEventContribution(data) {
        const event = this.activeEvents.get(data.eventId);
        if (!event) return;
        
        // Track player contribution
        if (!this.playerContributions.has(data.eventId)) {
            this.playerContributions.set(data.eventId, new Map());
        }
        
        const contributions = this.playerContributions.get(data.eventId);
        contributions.set(data.playerId, (contributions.get(data.playerId) || 0) + data.amount);
    }
    
    handleEventReward(data) {
        // Award rewards to player
        this.awardEventRewards(data.rewards);
        
        // Show reward notification
        this.showRewardNotification(data.rewards);
    }
    
    handleEventSchedule(data) {
        this.eventSchedule = data.schedule;
        this.updateScheduleList();
    }
    
    // UI methods
    updateEventList() {
        this.eventListContainer.innerHTML = '';
        
        if (this.activeEvents.size === 0) {
            this.eventListContainer.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">Nenhum evento ativo</div>';
            return;
        }
        
        for (const event of this.activeEvents.values()) {
            const eventElement = this.createEventElement(event);
            this.eventListContainer.appendChild(eventElement);
        }
    }
    
    createEventElement(event) {
        const element = document.createElement('div');
        element.className = 'world-event';
        element.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid ${this.getEventTypeColor(event.type)};
            border-radius: 4px;
            padding: 10px;
            margin: 5px 0;
            cursor: pointer;
            transition: background 0.2s;
        `;
        
        element.addEventListener('mouseenter', () => {
            element.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        
        element.addEventListener('click', () => {
            this.showEventDetails(event);
        });
        
        const timeRemaining = Math.max(0, event.endTime - Date.now());
        const timeString = this.formatTimeRemaining(timeRemaining);
        
        element.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span style="font-weight: bold; color: ${this.getEventTypeColor(event.type)};">
                    ${event.name}
                </span>
                <span style="font-size: 12px; color: #888;">${timeString}</span>
            </div>
            <div style="font-size: 12px; color: #ccc; margin-bottom: 5px;">
                ${event.description}
            </div>
            <div style="font-size: 11px; color: #888;">
                Participantes: ${event.participants.size}
            </div>
            <div style="margin-top: 5px;">
                ${this.createProgressBar(event)}
            </div>
        `;
        
        return element;
    }
    
    createProgressBar(event) {
        if (!event.objectives || event.objectives.length === 0) {
            return '';
        }
        
        const mainObjective = event.objectives[0];
        const progress = Math.min(100, (mainObjective.current / mainObjective.count) * 100);
        
        return `
            <div style="background: rgba(0, 0, 0, 0.5); border-radius: 2px; height: 4px; overflow: hidden;">
                <div style="background: ${this.getEventTypeColor(event.type)}; height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
            </div>
            <div style="font-size: 10px; color: #888; margin-top: 2px;">
                ${mainObjective.current}/${mainObjective.count} ${this.getObjectiveTypeName(mainObjective.type)}
            </div>
        `;
    }
    
    updateScheduleList() {
        this.scheduleListContainer.innerHTML = '';
        
        const upcomingEvents = this.eventSchedule
            .filter(event => event.startTime > Date.now())
            .sort((a, b) => a.startTime - b.startTime)
            .slice(0, 5); // Show next 5 events
        
        if (upcomingEvents.length === 0) {
            this.scheduleListContainer.innerHTML = '<div style="color: #888; font-size: 12px;">Nenhum evento agendado</div>';
            return;
        }
        
        for (const scheduledEvent of upcomingEvents) {
            const eventElement = document.createElement('div');
            eventElement.style.cssText = `
                font-size: 11px;
                color: #ccc;
                margin: 3px 0;
                padding: 3px 5px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 2px;
            `;
            
            const timeUntil = scheduledEvent.startTime - Date.now();
            const timeString = this.formatTimeRemaining(timeUntil);
            
            eventElement.innerHTML = `
                <div style="color: ${this.getEventTypeColor(scheduledEvent.type)}; font-weight: bold;">
                    ${scheduledEvent.name}
                </div>
                <div style="color: #888;">${timeString}</div>
            `;
            
            this.scheduleListContainer.appendChild(eventElement);
        }
    }
    
    showEventDetails(event) {
        const dialog = document.createElement('div');
        dialog.className = 'event-details-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid ${this.getEventTypeColor(event.type)};
            border-radius: 8px;
            padding: 20px;
            color: white;
            z-index: 2000;
            min-width: 400px;
            max-width: 600px;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: ${this.getEventTypeColor(event.type)};">
                ${event.name}
            </h3>
            <div style="margin-bottom: 15px; color: #ccc;">
                ${event.description}
            </div>
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #f59e0b;">Objetivos:</h4>
                ${this.createObjectivesList(event.objectives)}
            </div>
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #10b981;">Recompensas:</h4>
                ${this.createRewardsList(event.rewards)}
            </div>
            <div style="margin-bottom: 15px; color: #888;">
                <div>Participantes: ${event.participants.size}</div>
                <div>Duração: ${this.formatDuration(event.duration)}</div>
                <div>Tempo restante: ${this.formatTimeRemaining(Math.max(0, event.endTime - Date.now()))}</div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="window.game.eventManager.joinEvent('${event.id}')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Participar</button>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Fechar</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
    }
    
    createObjectivesList(objectives) {
        if (!objectives || objectives.length === 0) {
            return '<div style="color: #888;">Nenhum objetivo</div>';
        }
        
        let html = '';
        for (const objective of objectives) {
            const progress = Math.min(100, (objective.current / objective.count) * 100);
            html += `
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <span style="font-size: 12px;">${this.getObjectiveDescription(objective)}</span>
                        <span style="font-size: 12px; color: #888;">${objective.current}/${objective.count}</span>
                    </div>
                    <div style="background: rgba(0, 0, 0, 0.5); border-radius: 2px; height: 6px; overflow: hidden;">
                        <div style="background: #10b981; height: 100%; width: ${progress}%;"></div>
                    </div>
                </div>
            `;
        }
        
        return html;
    }
    
    createRewardsList(rewards) {
        if (!rewards) return '<div style="color: #888;">Nenhuma recompensa</div>';
        
        let html = '';
        
        if (rewards.experience) {
            html += `<div style="color: #f59e0b;">• ${rewards.experience} EXP</div>`;
        }
        
        if (rewards.gold) {
            html += `<div style="color: #facc15;">• ${rewards.gold} Gold</div>`;
        }
        
        if (rewards.items) {
            for (const item of rewards.items) {
                html += `<div style="color: ${this.getRarityColor(item.rarity)};">• ${item.count}x ${item.id}</div>`;
            }
        }
        
        if (rewards.currency) {
            html += `<div style="color: #8b5cf6;">• ${rewards.currency.amount} ${rewards.currency.type}</div>`;
        }
        
        return html;
    }
    
    // Event participation
    joinEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) {
            this.showMessage('Evento não encontrado!', 'error');
            return;
        }
        
        if (event.participants.has(window.game.player.id)) {
            this.showMessage('Você já está participando deste evento!', 'info');
            return;
        }
        
        this.networkManager.sendMessage('join_event', {
            eventId: eventId
        });
        
        // Close dialog
        const dialog = document.querySelector('.event-details-dialog');
        if (dialog) dialog.remove();
    }
    
    leaveEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        this.networkManager.sendMessage('leave_event', {
            eventId: eventId
        });
    }
    
    // Utility methods
    generateEventId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getEventTypeColor(eventType) {
        const colors = {
            [this.eventTypes.INVASION]: '#ef4444',
            [this.eventTypes.BOSS_SPAWN]: '#dc2626',
            [this.eventTypes.RESOURCE_BONUS]: '#10b981',
            [this.eventTypes.WORLD_BOSS]: '#f59e0b',
            [this.eventTypes.SEASONAL]: '#8b5cf6',
            [this.eventTypes.COMMUNITY]: '#3b82f6'
        };
        
        return colors[eventType] || '#6b7280';
    }
    
    getBiomeName(biome) {
        const biomeNames = {
            plains: 'Planícies',
            forest: 'Floresta',
            mountain: 'Montanhas',
            swamp: 'Pântano',
            desert: 'Deserto',
            frozen: 'Terras Congeladas',
            volcanic: 'Terras Vulcânicas',
            darklands: 'Terras Sombrias'
        };
        
        return biomeNames[biome] || biome;
    }
    
    getResourceName(resourceType) {
        const resourceNames = {
            wood: 'Madeira',
            stone: 'Pedra',
            iron: 'Ferro',
            gold: 'Ouro',
            herbs: 'Ervas',
            crystals: 'Cristais'
        };
        
        return resourceNames[resourceType] || resourceType;
    }
    
    getRarityByDifficulty(difficulty) {
        if (difficulty <= 2) return 'common';
        if (difficulty <= 4) return 'uncommon';
        if (difficulty <= 6) return 'rare';
        if (difficulty <= 8) return 'epic';
        return 'legendary';
    }
    
    getRarityColor(rarity) {
        const colors = {
            common: '#ffffff',
            uncommon: '#1eff00',
            rare: '#0070dd',
            epic: '#a335ee',
            legendary: '#ff8000'
        };
        
        return colors[rarity] || '#ffffff';
    }
    
    getObjectiveTypeName(type) {
        const names = {
            kill: 'Abates',
            kill_elite: 'Elite Abatidos',
            kill_boss: 'Boss Derrotado',
            survive: 'Sobrevivência',
            damage: 'Dano',
            gather: 'Coleta',
            craft: 'Crafting',
            collect: 'Coleção',
            defeat: 'Derrotados',
            participate: 'Participantes'
        };
        
        return names[type] || type;
    }
    
    getObjectiveDescription(objective) {
        const descriptions = {
            kill: `Derrotar ${objective.count} monstros`,
            kill_elite: `Derrotar ${objective.count} monstros elite`,
            kill_boss: `Derrotar o líder da invasão`,
            survive: `Sobreviver por ${Math.floor(objective.duration / 60000)} minutos`,
            damage: `Causar ${objective.count} de dano`,
            gather: `Coletar ${objective.count} recursos`,
            craft: `Craftar ${objective.count} itens`,
            collect: `Coletar ${objective.count} itens`,
            defeat: `Derrotar ${objective.count} inimigos`,
            participate: `Mínimo de ${objective.minPlayers} participantes`
        };
        
        return descriptions[objective.type] || `${objective.type}: ${objective.count}`;
    }
    
    formatTimeRemaining(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else {
            return `${minutes}m`;
        }
    }
    
    notifyEventStart(event) {
        if (!this.settings.showEventNotifications) return;
        
        this.showMessage(`🎭 Evento iniciado: ${event.name}`, 'info');
        
        // Show visual notification
        this.showEventNotification(event, 'start');
    }
    
    notifyEventEnd(event, rewards) {
        this.showMessage(`🏆 Evento concluído: ${event.name}`, 'success');
        
        // Show visual notification
        this.showEventNotification(event, 'end', rewards);
    }
    
    showEventNotification(event, type, rewards = null) {
        const notification = document.createElement('div');
        notification.className = 'event-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid ${this.getEventTypeColor(event.type)};
            border-radius: 8px;
            padding: 15px;
            color: white;
            z-index: 2000;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        if (type === 'start') {
            notification.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 24px; margin-right: 10px;">🎭</span>
                    <div>
                        <div style="font-weight: bold; color: ${this.getEventTypeColor(event.type)};">
                            ${event.name}
                        </div>
                        <div style="font-size: 12px; color: #ccc;">
                            ${event.description}
                        </div>
                    </div>
                </div>
                <button onclick="window.game.eventManager.joinEvent('${event.id}')" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Participar</button>
            `;
        } else if (type === 'end') {
            notification.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 24px; margin-right: 10px;">🏆</span>
                    <div>
                        <div style="font-weight: bold; color: ${this.getEventTypeColor(event.type)};">
                            ${event.name} Concluído!
                        </div>
                        <div style="font-size: 12px; color: #10b981;">
                            Evento finalizado com sucesso!
                        </div>
                    </div>
                </div>
            `;
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 10000);
    }
    
    showRewardNotification(rewards) {
        const notification = document.createElement('div');
        notification.className = 'reward-notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 15px;
            color: white;
            z-index: 2000;
            min-width: 250px;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; color: #10b981; margin-bottom: 10px;">🎁 Recompensas Recebidas!</div>
            ${this.createRewardsList(rewards)}
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }
    
    playEventSound(eventType) {
        // Implementation for event sounds
        // Would use Web Audio API or HTML5 audio
        console.log(`Playing sound for event type: ${eventType}`);
    }
    
    awardEventRewards(rewards) {
        const player = window.game.player;
        
        if (rewards.experience) {
            player.gainExperience(rewards.experience);
        }
        
        if (rewards.gold) {
            player.gold += rewards.gold;
        }
        
        if (rewards.items) {
            for (const item of rewards.items) {
                player.addToInventory(item);
            }
        }
        
        if (rewards.currency) {
            // Handle special currencies
            player.addCurrency(rewards.currency.type, rewards.currency.amount);
        }
        
        this.game.updateUI();
    }
    
    showMessage(message, type = 'info') {
        if (this.game && this.game.ui) {
            this.game.ui.addSystemMessage(message, type);
        }
    }
    
    toggleVisibility() {
        const isVisible = this.eventUI.style.display !== 'none';
        this.eventUI.style.display = isVisible ? 'none' : 'block';
        
        const toggleButton = this.eventUI.querySelector('.event-toggle');
        toggleButton.textContent = isVisible ? '□' : '_';
    }
    
    // Public API
    getActiveEvents() {
        return Array.from(this.activeEvents.values());
    }
    
    getEventById(eventId) {
        return this.activeEvents.get(eventId);
    }
    
    isParticipatingInEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        return event && event.participants.has(window.game.player.id);
    }
    
    getEventHistory() {
        return [...this.eventHistory];
    }
    
    cleanup() {
        // Remove UI elements
        if (this.eventUI && this.eventUI.parentNode) {
            this.eventUI.parentNode.removeChild(this.eventUI);
        }
        
        // Clear data
        this.activeEvents.clear();
        this.eventHistory = [];
        this.eventSchedule = [];
        this.eventParticipants.clear();
        this.playerContributions.clear();
    }
}

export default WorldEventManager;
