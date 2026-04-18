/**
 * Event Manager - Sistema de Eventos Dinâmicos
 * Responsável por eventos especiais, invasões e conteúdo dinâmico
 * Version 0.3.6v - Event System Implementation
 */

class EventManager {
    constructor() {
        this.activeEvents = new Map(); // eventId -> EventData
        this.eventSchedule = new Map(); // eventType -> ScheduleData
        this.eventHistory = new Map(); // eventType -> EventHistory[]
        this.playerParticipation = new Map(); // playerId -> ParticipationRecord[]
        
        // Configuration
        this.config = {
            minEventInterval: 900000, // 15 minutos
            maxEventInterval: 1800000, // 30 minutos
            eventDuration: 600000, // 10 minutos
            announcementLeadTime: 60000, // 1 minuto de aviso
            participationThreshold: 0.05, // 5% de participação para recompensa
            maxConcurrentEvents: 2,
            eventScalingFactor: 0.1 // 10% de dificuldade por jogador
        };
        
        // Event definitions
        this.eventDefinitions = {
            'goblin_invasion': {
                id: 'goblin_invasion',
                name: 'Invasão de Goblins',
                type: 'invasion',
                description: 'Uma horda de goblins invadiu a área!',
                duration: 300000, // 5 minutos
                difficulty: 1.0,
                requiredPlayers: 3,
                spawnZones: ['zone_forest'],
                mobTypes: ['goblin', 'goblin_warrior', 'goblin_shaman'],
                spawnCount: { min: 10, max: 20 },
                spawnRate: 2000, // 2 segundos entre spawns
                objectives: [
                    { type: 'kill', target: 'goblin', count: 15, description: 'Derrotar 15 goblins' },
                    { type: 'survive', duration: 300, description: 'Sobreviver por 5 minutos' }
                ],
                rewards: {
                    participation: { experience: 200, gold: 100 },
                    completion: { experience: 500, gold: 250, items: ['goblin_ear'] },
                    bonus: { experience: 1000, gold: 500, items: ['goblin_king_sword'] }
                },
                announcement: '⚔️ Invasão de Goblins em {zone}! Reúna-se para defender a área!',
                warning: '🚨 Invasão de Goblins começará em 1 minuto em {zone}!'
            },
            'dragon_attack': {
                id: 'dragon_attack',
                name: 'Ataque de Dragão',
                type: 'boss_event',
                description: 'Um dragão selvagem atacou a região!',
                duration: 600000, // 10 minutos
                difficulty: 2.5,
                requiredPlayers: 5,
                spawnZones: ['zone_mountain'],
                mobTypes: ['dragon', 'dragon_whelp'],
                spawnCount: { min: 1, max: 3 },
                spawnRate: 30000, // 30 segundos entre spawns
                objectives: [
                    { type: 'kill', target: 'dragon', count: 1, description: 'Derrotar o dragão' },
                    { type: 'protect', target: 'village', description: 'Proteger a vila' }
                ],
                rewards: {
                    participation: { experience: 500, gold: 300 },
                    completion: { experience: 1500, gold: 750, items: ['dragon_scale'] },
                    bonus: { experience: 3000, gold: 1500, items: ['dragon_wing'] }
                },
                announcement: '🐉 Um dragão selvagem apareceu em {zone}! Cuidado!',
                warning: '🔥 Alerta de Dragão! Um ataque iminente em {zone}!'
            },
            'undead_horde': {
                id: 'undead_horde',
                name: 'Horda de Mortos-Vivos',
                type: 'horde',
                description: 'Uma horda de mortos-vivos emerge das sombras!',
                duration: 450000, // 7.5 minutos
                difficulty: 1.8,
                requiredPlayers: 4,
                spawnZones: ['zone_dark', 'zone_swamp'],
                mobTypes: ['zombie', 'skeleton', 'ghost'],
                spawnCount: { min: 15, max: 30 },
                spawnRate: 1500, // 1.5 segundos entre spawns
                objectives: [
                    { type: 'kill', target: 'undead', count: 25, description: 'Derrotar 25 mortos-vivos' },
                    { type: 'purify', target: 'altar', count: 3, description: 'Purificar 3 altares' }
                ],
                rewards: {
                    participation: { experience: 350, gold: 200 },
                    completion: { experience: 800, gold: 400, items: ['holy_water'] },
                    bonus: { experience: 1600, gold: 800, items: ['blessed_cross'] }
                },
                announcement: '💀 Horda de Mortos-Vivos em {zone}! A luta começa!',
                warning: '🌑 Alerta de Necromancia! Mortos-vivos estão se reunindo em {zone}!'
            },
            'merchant_caravan': {
                id: 'merchant_caravan',
                name: 'Caravana de Mercadores',
                type: 'social',
                description: 'Uma caravana de mercadores especiais está visitando!',
                duration: 900000, // 15 minutos
                difficulty: 0.5,
                requiredPlayers: 1,
                spawnZones: ['zone_forest', 'zone_mountain'],
                mobTypes: [], // Sem mobs, evento social
                spawnCount: { min: 0, max: 0 },
                spawnRate: 0,
                objectives: [
                    { type: 'trade', description: 'Comprar itens raros dos mercadores' },
                    { type: 'protect', description: 'Proteger a caravana' }
                ],
                rewards: {
                    participation: { experience: 100, gold: 50 },
                    completion: { experience: 200, gold: 100, items: ['rare_gem'] },
                    bonus: { experience: 400, gold: 200, items: ['legendary_scroll'] }
                },
                announcement: '🛒 Caravana de Mercadores chegou a {zone}! Itens raros disponíveis!',
                warning: '📦 Caravana de Mercadores chegará em 1 minuto a {zone}!'
            },
            'treasure_hunt': {
                id: 'treasure_hunt',
                name: 'Caça ao Tesouro',
                type: 'exploration',
                description: 'Tesouros misteriosos aparecerão na área!',
                duration: 600000, // 10 minutos
                difficulty: 1.2,
                requiredPlayers: 2,
                spawnZones: ['zone_forest', 'zone_swamp', 'zone_mountain'],
                mobTypes: ['treasure_guardian'],
                spawnCount: { min: 5, max: 10 },
                spawnRate: 10000, // 10 segundos entre spawns
                objectives: [
                    { type: 'collect', target: 'treasure', count: 5, description: 'Coletar 5 tesouros' },
                    { type: 'explore', description: 'Explorar a área' }
                ],
                rewards: {
                    participation: { experience: 150, gold: 75 },
                    completion: { experience: 400, gold: 200, items: ['treasure_chest'] },
                    bonus: { experience: 800, gold: 400, items: ['golden_idol'] }
                },
                announcement: '💰 Caça ao Tesouro em {zone}! Encontre os tesouros escondidos!',
                warning: '🗺️ Tesouros misteriosos aparecerão em 1 minuto em {zone}!'
            }
        };
        
        // Event listeners
        this.onEventStart = null;
        this.onEventEnd = null;
        this.onEventWarning = null;
        this.onObjectiveComplete = null;
        this.onRewardDistributed = null;
        this.onEventSpawn = null;
    }
    
    /**
     * Inicializa o event system
     */
    initialize() {
        console.log('[EventManager] Inicializando event system...');
        this.startEventScheduler();
        this.startEventMonitoring();
        this.initializeEventHistory();
    }
    
    /**
     * Inicializa histórico de eventos
     */
    initializeEventHistory() {
        for (const eventType of Object.keys(this.eventDefinitions)) {
            this.eventHistory.set(eventType, []);
        }
    }
    
    /**
     * Inicia agendador de eventos
     */
    startEventScheduler() {
        setInterval(() => {
            this.attemptEventSchedule();
        }, 120000); // Verificar a cada 2 minutos
    }
    
    /**
     * Tenta agendar um evento
     */
    attemptEventSchedule() {
        // Verificar limite de eventos concorrentes
        if (this.activeEvents.size >= this.config.maxConcurrentEvents) {
            return;
        }
        
        // Verificar se há eventos disponíveis
        const availableEvents = this.getAvailableEvents();
        if (availableEvents.length === 0) return;
        
        // Selecionar evento aleatório
        const selectedEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
        
        // Agendar evento com tempo de aviso
        this.scheduleEvent(selectedEvent);
    }
    
    /**
     * Obtém eventos disponíveis para agendamento
     */
    getAvailableEvents() {
        const available = [];
        
        for (const [eventType, definition] of Object.entries(this.eventDefinitions)) {
            if (this.canScheduleEvent(eventType)) {
                available.push(eventType);
            }
        }
        
        return available;
    }
    
    /**
     * Verifica se um evento pode ser agendado
     */
    canScheduleEvent(eventType) {
        const definition = this.eventDefinitions[eventType];
        const history = this.eventHistory.get(eventType) || [];
        
        // Verificar se já tem evento ativo deste tipo
        const hasActiveEvent = Array.from(this.activeEvents.values())
            .some(event => event.type === eventType);
        
        if (hasActiveEvent) return false;
        
        // Verificar intervalo mínimo desde último evento
        if (history.length > 0) {
            const lastEvent = history[history.length - 1];
            const timeSinceLastEvent = Date.now() - lastEvent.startTime;
            
            if (timeSinceLastEvent < this.config.minEventInterval) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Agenda um evento
     */
    scheduleEvent(eventType) {
        const definition = this.eventDefinitions[eventType];
        const startTime = Date.now() + this.config.announcementLeadTime;
        
        const scheduleData = {
            eventType: eventType,
            startTime: startTime,
            zoneId: this.selectEventZone(definition.spawnZones),
            warningSent: false,
            scheduledAt: Date.now()
        };
        
        this.eventSchedule.set(eventType, scheduleData);
        
        // Enviar aviso
        this.sendEventWarning(scheduleData);
        
        // Agendar início do evento
        setTimeout(() => {
            this.startScheduledEvent(eventType);
        }, this.config.announcementLeadTime);
        
        console.log(`[EventManager] Evento ${eventType} agendado para ${new Date(startTime).toLocaleTimeString()}`);
    }
    
    /**
     * Seleciona zona para o evento
     */
    selectEventZone(availableZones) {
        // Lógica para selecionar zona baseada em população, etc.
        return availableZones[Math.floor(Math.random() * availableZones.length)];
    }
    
    /**
     * Envia aviso de evento
     */
    sendEventWarning(scheduleData) {
        const definition = this.eventDefinitions[scheduleData.eventType];
        const message = definition.warning.replace('{zone}', scheduleData.zoneId);
        
        console.log(`[EventManager] AVISO: ${message}`);
        
        // Trigger warning event
        if (this.onEventWarning) {
            this.onEventWarning(scheduleData, message);
        }
        
        // Enviar aviso global
        this.sendGlobalNotification(message);
    }
    
    /**
     * Inicia evento agendado
     */
    startScheduledEvent(eventType) {
        const scheduleData = this.eventSchedule.get(eventType);
        if (!scheduleData) return;
        
        this.eventSchedule.delete(eventType);
        this.startEvent(eventType, scheduleData.zoneId);
    }
    
    /**
     * Inicia um evento
     */
    startEvent(eventType, zoneId = null) {
        const definition = this.eventDefinitions[eventType];
        if (!definition) {
            console.error(`[EventManager] Definição de evento ${eventType} não encontrada`);
            return null;
        }
        
        // Selecionar zona se não fornecida
        const eventZone = zoneId || this.selectEventZone(definition.spawnZones);
        if (!eventZone) {
            console.warn(`[EventManager] Nenhuma zona válida para evento ${eventType}`);
            return null;
        }
        
        // Calcular dificuldade escalada
        const playerCount = this.getPlayerCountInZone(eventZone);
        const scaledDifficulty = this.calculateScaledDifficulty(definition.difficulty, playerCount);
        
        // Criar event data
        const eventData = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            name: definition.name,
            description: definition.description,
            zoneId: eventZone,
            startTime: Date.now(),
            endTime: Date.now() + definition.duration,
            duration: definition.duration,
            difficulty: scaledDifficulty,
            baseDifficulty: definition.difficulty,
            playerCount: playerCount,
            participants: new Map(), // playerId -> ParticipationData
            objectives: this.initializeObjectives(definition.objectives),
            completedObjectives: [],
            spawnedMobs: [],
            spawnedObjects: [],
            isActive: true,
            progress: 0
        };
        
        // Adicionar aos sistemas
        this.activeEvents.set(eventData.id, eventData);
        
        // Adicionar ao histórico
        const history = this.eventHistory.get(eventType) || [];
        history.push({
            eventId: eventData.id,
            startTime: Date.now(),
            zoneId: eventZone,
            triggeredBy: 'system'
        });
        this.eventHistory.set(eventType, history);
        
        // Anunciar início do evento
        this.announceEventStart(eventData);
        
        // Iniciar mecânicas do evento
        this.startEventMechanics(eventData);
        
        // Trigger start event
        if (this.onEventStart) {
            this.onEventStart(eventData);
        }
        
        // Agendar fim do evento
        setTimeout(() => {
            this.endEvent(eventData.id);
        }, definition.duration);
        
        console.log(`[EventManager] Evento ${eventType} iniciado na zona ${eventZone}`);
        return eventData;
    }
    
    /**
     * Calcula dificuldade escalada baseada no número de jogadores
     */
    calculateScaledDifficulty(baseDifficulty, playerCount) {
        const scalingBonus = playerCount * this.config.eventScalingFactor;
        return baseDifficulty + scalingBonus;
    }
    
    /**
     * Obtém número de jogadores em uma zona
     */
    getPlayerCountInZone(zoneId) {
        // Implementar contagem real de jogadores
        return Math.floor(Math.random() * 10) + 1; // Placeholder
    }
    
    /**
     * Inicializa objetivos do evento
     */
    initializeObjectives(objectives) {
        return objectives.map(obj => ({
            ...obj,
            progress: 0,
            completed: false,
            startTime: Date.now()
        }));
    }
    
    /**
     * Anuncia início do evento
     */
    announceEventStart(eventData) {
        const definition = this.eventDefinitions[eventData.type];
        const message = definition.announcement.replace('{zone}', eventData.zoneId);
        
        console.log(`[EventManager] INÍCIO: ${message}`);
        
        // Enviar anúncio global
        this.sendGlobalNotification(message);
    }
    
    /**
     * Inicia mecânicas do evento
     */
    startEventMechanics(eventData) {
        const definition = this.eventDefinitions[eventData.type];
        
        // Iniciar spawn de mobs se aplicável
        if (definition.mobTypes.length > 0) {
            this.startEventMobSpawning(eventData);
        }
        
        // Iniciar spawn de objetos se aplicável
        if (eventData.type === 'treasure_hunt') {
            this.startTreasureSpawning(eventData);
        }
        
        // Iniciar mecânicas especiais
        switch (eventData.type) {
            case 'merchant_caravan':
                this.spawnMerchantCaravan(eventData);
                break;
            case 'undead_horde':
                this.spawnAltars(eventData);
                break;
        }
    }
    
    /**
     * Inicia spawn de mobs do evento
     */
    startEventMobSpawning(eventData) {
        const definition = this.eventDefinitions[eventData.type];
        const spawnCount = Math.floor(
            definition.spawnCount.min + 
            Math.random() * (definition.spawnCount.max - definition.spawnCount.min)
        );
        
        let spawnedCount = 0;
        
        const spawnInterval = setInterval(() => {
            if (spawnedCount >= spawnCount || !eventData.isActive) {
                clearInterval(spawnInterval);
                return;
            }
            
            // Spawn mob
            const mobType = definition.mobTypes[Math.floor(Math.random() * definition.mobTypes.length)];
            this.spawnEventMob(eventData, mobType);
            
            spawnedCount++;
        }, definition.spawnRate);
    }
    
    /**
     * Spawn de mob de evento
     */
    spawnEventMob(eventData, mobType) {
        const position = this.generateEventSpawnPosition(eventData.zoneId);
        
        const mobData = {
            id: `event_mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: mobType,
            eventId: eventData.id,
            position: position,
            level: Math.floor(10 + eventData.difficulty * 5),
            stats: this.generateEventMobStats(mobType, eventData.difficulty),
            spawnedAt: Date.now()
        };
        
        eventData.spawnedMobs.push(mobData);
        
        // Trigger spawn event
        if (this.onEventSpawn) {
            this.onEventSpawn(mobData, eventData);
        }
        
        console.log(`[EventManager] Event mob ${mobType} spawnado para evento ${eventData.id}`);
    }
    
    /**
     * Gera stats de mob de evento
     */
    generateEventMobStats(mobType, difficulty) {
        const baseStats = {
            'goblin': { hp: 50, attack: 8, defense: 3 },
            'goblin_warrior': { hp: 80, attack: 12, defense: 5 },
            'goblin_shaman': { hp: 60, attack: 10, defense: 4 },
            'dragon': { hp: 2000, attack: 40, defense: 20 },
            'dragon_whelp': { hp: 500, attack: 20, defense: 10 },
            'zombie': { hp: 70, attack: 10, defense: 4 },
            'skeleton': { hp: 60, attack: 12, defense: 3 },
            'ghost': { hp: 50, attack: 15, defense: 2 },
            'treasure_guardian': { hp: 150, attack: 18, defense: 8 }
        };
        
        const stats = baseStats[mobType] || baseStats['goblin'];
        const difficultyMultiplier = 1 + difficulty * 0.5;
        
        return {
            hp: Math.floor(stats.hp * difficultyMultiplier),
            attack: Math.floor(stats.attack * difficultyMultiplier),
            defense: Math.floor(stats.defense * difficultyMultiplier)
        };
    }
    
    /**
     * Gera posição de spawn para evento
     */
    generateEventSpawnPosition(zoneId) {
        return {
            x: 100 + Math.random() * 800,
            y: 100 + Math.random() * 300
        };
    }
    
    /**
     * Inicia spawn de tesouros
     */
    startTreasureSpawning(eventData) {
        const treasureCount = 8;
        
        for (let i = 0; i < treasureCount; i++) {
            setTimeout(() => {
                if (eventData.isActive) {
                    this.spawnTreasure(eventData);
                }
            }, i * 5000); // Spawn a cada 5 segundos
        }
    }
    
    /**
     * Spawn de tesouro
     */
    spawnTreasure(eventData) {
        const position = this.generateEventSpawnPosition(eventData.zoneId);
        
        const treasureData = {
            id: `treasure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventId: eventData.id,
            position: position,
            type: 'treasure_chest',
            value: Math.floor(100 + Math.random() * 400),
            spawnedAt: Date.now()
        };
        
        eventData.spawnedObjects.push(treasureData);
        
        console.log(`[EventManager] Tesouro spawnado para evento ${eventData.id}`);
    }
    
    /**
     * Spawn de caravana de mercadores
     */
    spawnMerchantCaravan(eventData) {
        const position = this.generateEventSpawnPosition(eventData.zoneId);
        
        const caravanData = {
            id: `caravan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventId: eventData.id,
            position: position,
            type: 'merchant_caravan',
            merchants: this.generateMerchants(),
            spawnedAt: Date.now()
        };
        
        eventData.spawnedObjects.push(caravanData);
        
        console.log(`[EventManager] Caravana de mercadores spawnada para evento ${eventData.id}`);
    }
    
    /**
     * Gera mercadores para caravana
     */
    generateMerchants() {
        return [
            { name: 'Mercador de Armas', specialty: 'weapons' },
            { name: 'Mercador de Armaduras', specialty: 'armor' },
            { name: 'Mercador de Poções', specialty: 'potions' },
            { name: 'Mercador de Itens Raros', specialty: 'rare' }
        ];
    }
    
    /**
     * Spawn de altares (para evento undead_horde)
     */
    spawnAltars(eventData) {
        const altarCount = 3;
        
        for (let i = 0; i < altarCount; i++) {
            const position = this.generateEventSpawnPosition(eventData.zoneId);
            
            const altarData = {
                id: `altar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                eventId: eventData.id,
                position: position,
                type: 'altar',
                purified: false,
                spawnedAt: Date.now()
            };
            
            eventData.spawnedObjects.push(altarData);
        }
        
        console.log(`[EventManager] ${altarCount} altares spawnados para evento ${eventData.id}`);
    }
    
    /**
     * Registra participação em evento
     */
    registerEventParticipation(eventId, playerId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return false;
        
        if (!event.participants.has(playerId)) {
            event.participants.set(playerId, {
                joinedAt: Date.now(),
                contributions: [],
                damageDealt: 0,
                objectivesCompleted: 0,
                participationScore: 0
            });
        }
        
        console.log(`[EventManager] Jogador ${playerId} participando do evento ${eventId}`);
        return true;
    }
    
    /**
     * Registra progresso de objetivo
     */
    registerObjectiveProgress(eventId, playerId, objectiveType, progress = 1) {
        const event = this.activeEvents.get(eventId);
        if (!event) return false;
        
        // Atualizar progresso do jogador
        const participation = event.participants.get(playerId);
        if (participation) {
            participation.contributions.push({
                type: objectiveType,
                progress: progress,
                timestamp: Date.now()
            });
            participation.participationScore += progress;
        }
        
        // Atualizar progresso do evento
        for (const objective of event.objectives) {
            if (objective.type === objectiveType && !objective.completed) {
                objective.progress += progress;
                
                // Verificar se objetivo foi completado
                if (objective.progress >= (objective.count || 1)) {
                    objective.completed = true;
                    objective.completedAt = Date.now();
                    event.completedObjectives.push(objective);
                    
                    // Trigger objective completion
                    if (this.onObjectiveComplete) {
                        this.onObjectiveComplete(event, objective, playerId);
                    }
                    
                    console.log(`[EventManager] Objetivo ${objectiveType} completado no evento ${eventId}`);
                }
                
                break;
            }
        }
        
        // Atualizar progresso geral do evento
        this.updateEventProgress(event);
        
        return true;
    }
    
    /**
     * Atualiza progresso geral do evento
     */
    updateEventProgress(event) {
        const totalObjectives = event.objectives.length;
        const completedObjectives = event.objectives.filter(obj => obj.completed).length;
        
        event.progress = completedObjectives / totalObjectives;
    }
    
    /**
     * Finaliza um evento
     */
    endEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return false;
        
        event.isActive = false;
        event.endTime = Date.now();
        
        // Calcular resultados
        const results = this.calculateEventResults(event);
        
        // Distribuir recompensas
        this.distributeEventRewards(event, results);
        
        // Remover evento ativo
        this.activeEvents.delete(eventId);
        
        // Trigger end event
        if (this.onEventEnd) {
            this.onEventEnd(event, results);
        }
        
        // Anunciar fim do evento
        this.announceEventEnd(event, results);
        
        console.log(`[EventManager] Evento ${eventId} finalizado`);
        return true;
    }
    
    /**
     * Calcula resultados do evento
     */
    calculateEventResults(event) {
        const definition = this.eventDefinitions[event.type];
        const allObjectivesCompleted = event.objectives.every(obj => obj.completed);
        
        return {
            success: allObjectivesCompleted,
            completionRate: event.progress,
            totalParticipants: event.participants.size,
            objectivesCompleted: event.completedObjectives.length,
            duration: event.endTime - event.startTime,
            topParticipants: this.getTopParticipants(event)
        };
    }
    
    /**
     * Obtém melhores participantes
     */
    getTopParticipants(event) {
        const participants = Array.from(event.participants.entries());
        return participants
            .sort((a, b) => b[1].participationScore - a[1].participationScore)
            .slice(0, 5)
            .map(([playerId, data]) => ({ playerId, score: data.participationScore }));
    }
    
    /**
     * Distribui recompensas do evento
     */
    distributeEventRewards(event, results) {
        const definition = this.eventDefinitions[event.type];
        
        for (const [playerId, participation] of event.participants) {
            const rewards = this.calculatePlayerRewards(event, participation, results, definition);
            this.awardEventRewards(playerId, rewards, event);
        }
    }
    
    /**
     * Calcula recompensas para um jogador
     */
    calculatePlayerRewards(event, participation, results, definition) {
        const rewards = { experience: 0, gold: 0, items: [] };
        
        // Recompensa de participação
        if (participation.participationScore > 0) {
            rewards.experience += definition.rewards.participation.experience;
            rewards.gold += definition.rewards.participation.gold;
        }
        
        // Recompensa de conclusão
        if (results.success) {
            rewards.experience += definition.rewards.completion.experience;
            rewards.gold += definition.rewards.completion.gold;
            
            if (definition.rewards.completion.items) {
                rewards.items.push(...definition.rewards.completion.items);
            }
        }
        
        // Recompensa bônus para top participantes
        const topParticipants = results.topParticipants.slice(0, 3); // Top 3
        const isTopParticipant = topParticipants.some(p => p.playerId === participation.playerId);
        
        if (isTopParticipant) {
            rewards.experience += definition.rewards.bonus.experience;
            rewards.gold += definition.rewards.bonus.gold;
            
            if (definition.rewards.bonus.items) {
                rewards.items.push(...definition.rewards.bonus.items);
            }
        }
        
        return rewards;
    }
    
    /**
     * Awards recompensas de evento para um jogador
     */
    awardEventRewards(playerId, rewards, event) {
        console.log(`[EventManager] Recompensas de evento para jogador ${playerId}:`, rewards);
        
        // Trigger reward event
        if (this.onRewardDistributed) {
            this.onRewardDistributed(playerId, rewards, event);
        }
        
        // Implementar entrega real das recompensas
    }
    
    /**
     * Anuncia fim do evento
     */
    announceEventEnd(event, results) {
        const message = results.success ? 
            `🎉 Evento ${event.name} concluído com sucesso!` : 
            `⏰ Evento ${event.name} finalizado.`;
        
        console.log(`[EventManager] FIM: ${message}`);
        this.sendGlobalNotification(message);
    }
    
    /**
     * Envia notificação global
     */
    sendGlobalNotification(message) {
        // Implementar envio para todos os jogadores
        console.log(`[EventManager] Notificação global: ${message}`);
    }
    
    /**
     * Inicia monitoramento de eventos
     */
    startEventMonitoring() {
        setInterval(() => {
            this.monitorEventActivity();
        }, 30000); // Verificar a cada 30 segundos
    }
    
    /**
     * Monitora atividade dos eventos
     */
    monitorEventActivity() {
        const now = Date.now();
        
        for (const [eventId, event] of this.activeEvents) {
            // Verificar eventos expirados
            if (now > event.endTime) {
                this.endEvent(eventId);
            }
        }
    }
    
    /**
     * Obtém eventos ativos em uma zona
     */
    getActiveEventsInZone(zoneId) {
        return Array.from(this.activeEvents.values())
            .filter(event => event.zoneId === zoneId);
    }
    
    /**
     * Obtém todos os eventos ativos
     */
    getAllActiveEvents() {
        return Array.from(this.activeEvents.values());
    }
    
    /**
     * Obtém estatísticas do event system
     */
    getEventStatistics() {
        const stats = {
            activeEvents: this.activeEvents.size,
            scheduledEvents: this.eventSchedule.size,
            totalEvents: 0,
            eventTypes: {}
        };
        
        for (const [eventType, history] of this.eventHistory) {
            const definition = this.eventDefinitions[eventType];
            const activeEvent = Array.from(this.activeEvents.values())
                .find(event => event.type === eventType);
            
            stats.eventTypes[eventType] = {
                name: definition.name,
                active: !!activeEvent,
                totalOccurrences: history.length,
                lastOccurrence: history.length > 0 ? history[history.length - 1].startTime : null,
                averageParticipation: this.calculateAverageParticipation(eventType)
            };
            
            stats.totalEvents += history.length;
        }
        
        return stats;
    }
    
    /**
     * Calcula participação média em eventos
     */
    calculateAverageParticipation(eventType) {
        // Implementar cálculo baseado no histórico
        return 5.5; // Placeholder
    }
}

module.exports = EventManager;
