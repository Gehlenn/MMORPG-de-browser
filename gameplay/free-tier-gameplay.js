/**
 * Free Tier Gameplay System - Otimizado para Zero Budget
 * Sistema de gameplay viciante com recursos limitados
 * Version 1.0.0 - Free Tier Ready
 */

class FreeTierGameplay {
    constructor() {
        this.config = {
            maxPlayers: 50,
            maxMobs: 200,
            worldWidth: 1000,
            worldHeight: 1000,
            tickRate: 30,
            saveInterval: 60000,
            // Otimizações para free tier
            mobUpdateInterval: 1000,
            playerUpdateInterval: 100,
            eventInterval: 300000,
            cleanupInterval: 60000
        };
        
        this.players = new Map();
        this.mobs = new Map();
        this.worldState = {
            time: 0,
            weather: 'clear',
            events: [],
            lastSave: Date.now(),
            lastMobSpawn: Date.now(),
            lastEvent: Date.now()
        };
        
        this.gameLoops = new Map();
        this.isRunning = false;
        
        // Sistema de eventos otimizado
        this.eventQueue = [];
        this.eventProcessing = false;
        
        // Cache de cálculos
        this.spatialGrid = new SpatialGrid(this.config.worldWidth, this.config.worldHeight, 50);
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎮 Inicializando Free Tier Gameplay v1.0.0');
        
        // Inicializar sistemas
        this.initializeSpatialGrid();
        this.initializeMobSystem();
        this.initializeEventSystem();
        this.initializePlayerSystem();
        
        // Iniciar loops otimizados
        this.startOptimizedLoops();
        
        console.log('✅ Free Tier Gameplay inicializado');
    }
    
    initializeSpatialGrid() {
        // Grid espacial para otimizar colisões
        this.spatialGrid = new SpatialGrid(this.config.worldWidth, this.config.worldHeight, 50);
        console.log('🗺️ Spatial grid inicializado');
    }
    
    initializeMobSystem() {
        // Configurações de mobs otimizadas
        this.mobConfigs = {
            goblin: {
                name: 'Goblin',
                hp: 25,
                maxHp: 25,
                attack: 4,
                defense: 2,
                speed: 60,
                exp: 10,
                gold: 3,
                respawnTime: 20000,
                behavior: 'aggressive',
                detectionRange: 100,
                attackRange: 30,
                color: '#8B4513'
            },
            wolf: {
                name: 'Wolf',
                hp: 40,
                maxHp: 40,
                attack: 7,
                defense: 3,
                speed: 80,
                exp: 20,
                gold: 6,
                respawnTime: 30000,
                behavior: 'territorial',
                detectionRange: 80,
                attackRange: 40,
                color: '#696969'
            },
            orc: {
                name: 'Orc',
                hp: 60,
                maxHp: 60,
                attack: 10,
                defense: 5,
                speed: 40,
                exp: 30,
                gold: 12,
                respawnTime: 45000,
                behavior: 'aggressive',
                detectionRange: 120,
                attackRange: 50,
                color: '#556B2F'
            }
        };
        
        // Spawn inicial
        this.spawnInitialMobs();
        console.log('👾 Mob system inicializado');
    }
    
    initializeEventSystem() {
        // Eventos dinâmicos simples
        this.eventTypes = [
            {
                id: 'gold_rush',
                name: 'Gold Rush',
                duration: 300000, // 5 minutos
                probability: 0.1,
                effect: { goldMultiplier: 2, expMultiplier: 1.5 },
                description: 'Gold e exp duplicados por 5 minutos!'
            },
            {
                id: 'mob_madness',
                name: 'Mob Madness',
                duration: 180000, // 3 minutos
                probability: 0.05,
                effect: { mobSpawnRate: 2, mobStrength: 1.5 },
                description: 'Mobs mais fortes e frequentes!'
            },
            {
                id: 'blessing',
                name: 'Divine Blessing',
                duration: 600000, // 10 minutos
                probability: 0.15,
                effect: { playerRegen: 2, damageReduction: 0.5 },
                description: 'Regeneração e proteção aumentadas!'
            }
        ];
        
        console.log('🎪 Event system inicializado');
    }
    
    initializePlayerSystem() {
        // Sistema de jogador otimizado
        this.playerDefaults = {
            level: 1,
            exp: 0,
            maxExp: 100,
            hp: 100,
            maxHp: 100,
            mana: 50,
            maxMana: 50,
            gold: 100,
            attack: 10,
            defense: 5,
            speed: 100,
            inventory: [],
            skills: [],
            buffs: [],
            lastUpdate: Date.now(),
            lastAttack: 0,
            lastMove: 0
        };
        
        console.log('👥 Player system inicializado');
    }
    
    startOptimizedLoops() {
        this.isRunning = true;
        
        // Game loop principal (30 FPS)
        this.gameLoops.set('main', setInterval(() => {
            this.gameLoop();
        }, 1000 / this.config.tickRate));
        
        // Update de mobs (1 FPS)
        this.gameLoops.set('mobs', setInterval(() => {
            this.updateMobs();
        }, this.config.mobUpdateInterval));
        
        // Update de jogadores (10 FPS)
        this.gameLoops.set('players', setInterval(() => {
            this.updatePlayers();
        }, this.config.playerUpdateInterval));
        
        // Event system (5 minutos)
        this.gameLoops.set('events', setInterval(() => {
            this.checkEvents();
        }, this.config.eventInterval));
        
        // Cleanup (1 minuto)
        this.gameLoops.set('cleanup', setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval));
        
        // World time (1 minuto)
        this.gameLoops.set('worldtime', setInterval(() => {
            this.updateWorldTime();
        }, 60000));
        
        console.log('🔄 Loops otimizados iniciados');
    }
    
    gameLoop() {
        // Atualizar spatial grid
        this.updateSpatialGrid();
        
        // Processar eventos na fila
        this.processEventQueue();
        
        // Verificar colisões otimizadas
        this.checkCollisionsOptimized();
        
        // Atualizar buffs
        this.updateBuffs();
    }
    
    updateSpatialGrid() {
        // Limpar grid
        this.spatialGrid.clear();
        
        // Adicionar jogadores
        for (const player of this.players.values()) {
            this.spatialGrid.add(player, 'player');
        }
        
        // Adicionar mobs
        for (const mob of this.mobs.values()) {
            this.spatialGrid.add(mob, 'mob');
        }
    }
    
    checkCollisionsOptimized() {
        // Usar spatial grid para otimizar colisões
        for (const player of this.players.values()) {
            const nearbyMobs = this.spatialGrid.getNearby(player.x, player.y, 50, 'mob');
            
            for (const mob of nearbyMobs) {
                const distance = this.getDistance(player, mob);
                
                if (distance < 30) { // Colisão
                    this.handleCombat(player, mob);
                }
            }
        }
    }
    
    updateMobs() {
        const now = Date.now();
        
        for (const mob of this.mobs.values()) {
            this.updateMobAI(mob, now);
            this.updateMobPosition(mob);
        }
        
        // Spawn de novos mobs
        if (this.mobs.size < this.config.maxMobs) {
            this.spawnMob();
        }
    }
    
    updateMobAI(mob, now) {
        // AI simplificada para free tier
        if (now - mob.lastAIUpdate < 2000) return; // Update a cada 2 segundos
        
        mob.lastAIUpdate = now;
        
        // Encontrar jogador mais próximo
        const nearbyPlayers = this.spatialGrid.getNearby(mob.x, mob.y, mob.detectionRange, 'player');
        
        if (nearbyPlayers.length > 0) {
            const target = nearbyPlayers[0];
            const distance = this.getDistance(mob, target);
            
            // Comportamento baseado no tipo
            switch (mob.behavior) {
                case 'aggressive':
                    if (distance < mob.detectionRange) {
                        mob.targetX = target.x;
                        mob.targetY = target.y;
                        mob.state = 'chasing';
                    } else {
                        mob.state = 'patrolling';
                    }
                    break;
                    
                case 'territorial':
                    if (distance < mob.attackRange) {
                        mob.targetX = target.x;
                        mob.targetY = target.y;
                        mob.state = 'attacking';
                    } else {
                        mob.state = 'patrolling';
                    }
                    break;
            }
        } else {
            // Movimento aleatório
            if (Math.random() < 0.1) {
                mob.targetX = mob.x + (Math.random() - 0.5) * 100;
                mob.targetY = mob.y + (Math.random() - 0.5) * 100;
                mob.state = 'patrolling';
            }
        }
    }
    
    updateMobPosition(mob) {
        const dx = mob.targetX - mob.x;
        const dy = mob.targetY - mob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const moveSpeed = mob.speed / this.config.tickRate;
            mob.x += (dx / distance) * moveSpeed;
            mob.y += (dy / distance) * moveSpeed;
            
            // Limitar ao mundo
            mob.x = Math.max(0, Math.min(mob.x, this.config.worldWidth));
            mob.y = Math.max(0, Math.min(mob.y, this.config.worldHeight));
        }
    }
    
    updatePlayers() {
        const now = Date.now();
        
        for (const player of this.players.values()) {
            // Atualizar buffs
            this.updatePlayerBuffs(player, now);
            
            // Regeneração
            this.regeneratePlayer(player, now);
            
            // Verificar inatividade
            if (now - player.lastUpdate > 300000) { // 5 minutos
                this.removePlayer(player.id);
            }
        }
    }
    
    updatePlayerBuffs(player, now) {
        if (!player.buffs || player.buffs.length === 0) return;
        
        player.buffs = player.buffs.filter(buff => {
            // Verificar se buff expirou
            if (now > buff.endTime) {
                this.removeBuffEffect(player, buff);
                return false;
            }
            
            // Aplicar efeito do buff
            this.applyBuffEffect(player, buff, now);
            return true;
        });
    }
    
    applyBuffEffect(player, buff, now) {
        switch (buff.type) {
            case 'regen':
                if (now - buff.lastApply > 1000) { // 1 segundo
                    player.hp = Math.min(player.maxHp, player.hp + buff.value);
                    player.mana = Math.min(player.maxMana, player.mana + buff.value);
                    buff.lastApply = now;
                }
                break;
                
            case 'damage_boost':
                // Aplicado no combate
                break;
                
            case 'speed_boost':
                // Aplicado no movimento
                break;
        }
    }
    
    removeBuffEffect(player, buff) {
        // Remover efeito do buff quando expira
        console.log(`🔮 Buff ${buff.type} expirou para jogador ${player.name}`);
    }
    
    regeneratePlayer(player, now) {
        // Regeneração passiva
        if (now - player.lastRegen > 5000) { // 5 segundos
            player.hp = Math.min(player.maxHp, player.hp + 2);
            player.mana = Math.min(player.maxMana, player.mana + 1);
            player.lastRegen = now;
        }
    }
    
    handleCombat(player, mob) {
        const now = Date.now();
        
        // Verificar cooldown de ataque
        if (now - player.lastAttack < 1000) return; // 1 segundo
        
        player.lastAttack = now;
        
        // Calcular dano do jogador
        const playerDamage = Math.max(1, player.attack - mob.defense + Math.floor(Math.random() * 5));
        mob.hp = Math.max(0, mob.hp - playerDamage);
        
        // Calcular dano do mob
        if (mob.state === 'attacking') {
            const mobDamage = Math.max(1, mob.attack - player.defense + Math.floor(Math.random() * 3));
            player.hp = Math.max(0, player.hp - mobDamage);
        }
        
        // Notificar jogadores
        this.notifyCombat(player, mob, playerDamage, mobDamage);
        
        // Verificar se mob morreu
        if (mob.hp <= 0) {
            this.handleMobDeath(mob, player);
        }
        
        // Verificar se jogador morreu
        if (player.hp <= 0) {
            this.handlePlayerDeath(player);
        }
    }
    
    notifyCombat(player, mob, playerDamage, mobDamage) {
        // Notificar jogador
        const socket = this.getPlayerSocket(player.id);
        if (socket) {
            socket.emit('combat_update', {
                mobId: mob.id,
                mobHp: mob.hp,
                mobMaxHp: mob.maxHp,
                playerDamage: playerDamage,
                mobDamage: mobDamage,
                playerHp: player.hp,
                playerMaxHp: player.maxHp
            });
        }
        
        // Notificar jogadores próximos
        const nearbyPlayers = this.spatialGrid.getNearby(player.x, player.y, 100, 'player');
        for (const nearbyPlayer of nearbyPlayers) {
            if (nearbyPlayer.id !== player.id) {
                const nearbySocket = this.getPlayerSocket(nearbyPlayer.id);
                if (nearbySocket) {
                    nearbySocket.emit('nearby_combat', {
                        playerId: player.id,
                        playerName: player.name,
                        mobId: mob.id,
                        mobName: mob.name
                    });
                }
            }
        }
    }
    
    handleMobDeath(mob, player) {
        // Dar recompensas
        player.exp += mob.exp;
        player.gold += mob.gold;
        
        // Aplicar eventos ativos
        const activeEvent = this.worldState.events[0];
        if (activeEvent && activeEvent.effect) {
            if (activeEvent.effect.goldMultiplier) {
                player.gold = Math.floor(player.gold * activeEvent.effect.goldMultiplier);
            }
            if (activeEvent.effect.expMultiplier) {
                player.exp = Math.floor(player.exp * activeEvent.effect.expMultiplier);
            }
        }
        
        // Verificar level up
        this.checkLevelUp(player);
        
        // Notificar todos
        this.broadcastToAll('mob_death', {
            mobId: mob.id,
            mobName: mob.name,
            killer: player.name,
            rewards: { exp: mob.exp, gold: mob.gold }
        });
        
        // Remover mob
        this.mobs.delete(mob.id);
        
        // Agendar respawn
        setTimeout(() => {
            this.respawnMob(mob);
        }, mob.respawnTime);
        
        console.log(`💀 ${mob.name} morto por ${player.name}. Recompensas: ${mob.exp} exp, ${mob.gold} gold`);
    }
    
    handlePlayerDeath(player) {
        // Resetar jogador
        player.hp = player.maxHp;
        player.mana = player.maxMana;
        
        // Mover para spawn seguro
        player.x = 400;
        player.y = 300;
        
        // Penalidade de exp
        const expLoss = Math.floor(player.exp * 0.05); // 5% de perda
        player.exp = Math.max(0, player.exp - expLoss);
        
        // Notificar jogador
        const socket = this.getPlayerSocket(player.id);
        if (socket) {
            socket.emit('player_death', {
                message: 'Você morreu! Foi ressuscitado na cidade.',
                expLoss: expLoss,
                newPosition: { x: player.x, y: player.y }
            });
        }
        
        console.log(`💀 Jogador ${player.name} morreu e perdeu ${expLoss} de exp`);
    }
    
    checkLevelUp(player) {
        while (player.exp >= player.maxExp) {
            player.exp -= player.maxExp;
            player.level++;
            player.maxExp = Math.floor(player.maxExp * 1.2);
            
            // Aumentar stats
            player.maxHp += 10;
            player.hp = player.maxHp;
            player.maxMana += 5;
            player.mana = player.maxMana;
            player.attack += 2;
            player.defense += 1;
            
            // Notificar jogador
            const socket = this.getPlayerSocket(player.id);
            if (socket) {
                socket.emit('level_up', {
                    level: player.level,
                    newStats: {
                        hp: player.maxHp,
                        mana: player.maxMana,
                        attack: player.attack,
                        defense: player.defense
                    }
                });
            }
            
            console.log(`🎉 ${player.name} alcançou level ${player.level}!`);
        }
    }
    
    checkEvents() {
        const now = Date.now();
        
        // Verificar se evento atual terminou
        if (this.worldState.events.length > 0) {
            const currentEvent = this.worldState.events[0];
            if (now > currentEvent.endTime) {
                this.endEvent(currentEvent);
            }
        }
        
        // Verificar se deve iniciar novo evento
        if (this.worldState.events.length === 0 && Math.random() < 0.1) {
            this.startRandomEvent();
        }
    }
    
    startRandomEvent() {
        const eventType = this.eventTypes[Math.floor(Math.random() * this.eventTypes.length)];
        const event = {
            ...eventType,
            startTime: Date.now(),
            endTime: Date.now() + eventType.duration,
            isActive: true
        };
        
        this.worldState.events.push(event);
        
        // Aplicar efeitos do evento
        this.applyEventEffects(event);
        
        // Notificar todos
        this.broadcastToAll('event_started', {
            eventId: event.id,
            eventName: event.name,
            description: event.description,
            duration: event.duration
        });
        
        console.log(`🎪 Evento iniciado: ${event.name}`);
        
        // Agendar fim do evento
        setTimeout(() => this.endEvent(event), event.duration);
    }
    
    applyEventEffects(event) {
        // Aplicar efeitos globais
        if (event.effect) {
            this.worldState.eventEffects = event.effect;
        }
    }
    
    endEvent(event) {
        // Remover efeitos
        this.worldState.eventEffects = null;
        
        // Remover da lista
        this.worldState.events = this.worldState.events.filter(e => e.id !== event.id);
        
        // Notificar todos
        this.broadcastToAll('event_ended', {
            eventId: event.id,
            eventName: event.name
        });
        
        console.log(`🎪 Evento encerrado: ${event.name}`);
    }
    
    updateWorldTime() {
        this.worldState.time = (this.worldState.time + 1) % 1440; // 24 horas
        
        // Notificar jogadores
        this.broadcastToAll('world_time_update', {
            hour: Math.floor(this.worldState.time / 60),
            minute: this.worldState.time % 60
        });
    }
    
    cleanup() {
        const now = Date.now();
        
        // Remover mobs antigos
        if (this.mobs.size > this.config.maxMobs * 0.8) {
            const mobsToRemove = Math.floor(this.mobs.size * 0.2);
            const mobArray = Array.from(this.mobs.values());
            
            for (let i = 0; i < mobsToRemove; i++) {
                this.mobs.delete(mobArray[i].id);
            }
        }
        
        // Limpar spatial grid
        this.spatialGrid.cleanup();
        
        // Processar eventos pendentes
        this.processEventQueue();
        
        console.log(`🧹 Cleanup: ${this.players.size} players, ${this.mobs.size} mobs`);
    }
    
    // Métodos públicos
    addPlayer(socketId, playerData) {
        const player = {
            id: socketId,
            ...this.playerDefaults,
            ...playerData,
            lastUpdate: Date.now(),
            lastRegen: Date.now(),
            lastAIUpdate: Date.now()
        };
        
        this.players.set(socketId, player);
        return player;
    }
    
    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            this.players.delete(playerId);
            console.log(`👋 Jogador ${player.name} removido`);
        }
    }
    
    updatePlayerPosition(playerId, x, y) {
        const player = this.players.get(playerId);
        if (player) {
            player.x = x;
            player.y = y;
            player.lastUpdate = Date.now();
            player.lastMove = Date.now();
        }
    }
    
    playerAttack(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            const now = Date.now();
            
            // Verificar cooldown
            if (now - player.lastAttack < 1000) return;
            
            player.lastAttack = now;
            
            // Encontrar mob mais próximo
            const nearbyMobs = this.spatialGrid.getNearby(player.x, player.y, 50, 'mob');
            
            if (nearbyMobs.length > 0) {
                const mob = nearbyMobs[0];
                this.handleCombat(player, mob);
            }
        }
    }
    
    processChatMessage(playerId, message) {
        const player = this.players.get(playerId);
        if (player && message && message.length <= 100) {
            this.broadcastToAll('chat_message', {
                channel: 'global',
                author: player.name,
                message: message,
                playerId: playerId,
                level: player.level,
                class: player.class
            });
        }
    }
    
    // Métodos utilitários
    getDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getPlayerSocket(playerId) {
        // Este método deve ser implementado pelo servidor
        return null; // Placeholder
    }
    
    broadcastToAll(event, data) {
        // Este método deve ser implementado pelo servidor
        console.log(`📡 Broadcast: ${event}`, data);
    }
    
    spawnInitialMobs() {
        const initialCount = 20;
        
        for (let i = 0; i < initialCount; i++) {
            this.spawnMob();
        }
        
        console.log(`👾 ${initialCount} mobs spawnados inicialmente`);
    }
    
    spawnMob() {
        if (this.mobs.size >= this.config.maxMobs) return;
        
        const mobTypes = Object.keys(this.mobConfigs);
        const randomType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
        const config = this.mobConfigs[randomType];
        
        const mob = {
            id: `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: randomType,
            ...config,
            x: Math.random() * this.config.worldWidth,
            y: Math.random() * this.config.worldHeight,
            targetX: 0,
            targetY: 0,
            state: 'patrolling',
            lastAIUpdate: Date.now(),
            lastAttack: 0
        };
        
        this.mobs.set(mob.id, mob);
        return mob;
    }
    
    respawnMob(originalMob) {
        const mob = {
            ...originalMob,
            id: `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            hp: originalMob.maxHp,
            x: Math.random() * this.config.worldWidth,
            y: Math.random() * this.config.worldHeight,
            targetX: 0,
            targetY: 0,
            state: 'patrolling',
            lastAIUpdate: Date.now(),
            lastAttack: 0
        };
        
        this.mobs.set(mob.id, mob);
    }
    
    processEventQueue() {
        if (this.eventProcessing || this.eventQueue.length === 0) return;
        
        this.eventProcessing = true;
        
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.processEvent(event);
        }
        
        this.eventProcessing = false;
    }
    
    processEvent(event) {
        // Processar evento específico
        switch (event.type) {
            case 'player_join':
                // Lógica de entrada de jogador
                break;
            case 'player_leave':
                // Lógica de saída de jogador
                break;
            case 'mob_death':
                // Lógica de morte de mob
                break;
        }
    }
    
    updateBuffs() {
        const now = Date.now();
        
        for (const player of this.players.values()) {
            if (player.buffs) {
                player.buffs = player.buffs.filter(buff => {
                    if (now > buff.endTime) {
                        this.removeBuffEffect(player, buff);
                        return false;
                    }
                    return true;
                });
            }
        }
    }
    
    getStats() {
        return {
            players: this.players.size,
            mobs: this.mobs.size,
            events: this.worldState.events.length,
            worldTime: this.worldState.time,
            uptime: process.uptime()
        };
    }
    
    stop() {
        this.isRunning = false;
        
        // Parar todos os loops
        for (const [name, interval] of this.gameLoops) {
            clearInterval(interval);
        }
        
        this.gameLoops.clear();
        console.log('⏹️ Free Tier Gameplay parado');
    }
}

// Spatial Grid para otimização de colisões
class SpatialGrid {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = new Map();
    }
    
    add(entity, type) {
        const cell = this.getCell(entity.x, entity.y);
        if (!this.grid.has(cell)) {
            this.grid.set(cell, []);
        }
        
        this.grid.get(cell).push({ entity, type });
    }
    
    getCell(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return `${col},${row}`;
    }
    
    getNearby(x, y, radius, type) {
        const nearby = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCell = this.getCell(x, y);
        const [centerCol, centerRow] = centerCell.split(',').map(Number);
        
        for (let col = centerCol - cellRadius; col <= centerCol + cellRadius; col++) {
            for (let row = centerRow - cellRadius; row <= centerRow + cellRadius; row++) {
                const cell = `${col},${row}`;
                const entities = this.grid.get(cell) || [];
                
                for (const { entity, entityType } of entities) {
                    if (entityType === type) {
                        const distance = Math.sqrt(
                            Math.pow(entity.x - x, 2) + 
                            Math.pow(entity.y - y, 2)
                        );
                        
                        if (distance <= radius) {
                            nearby.push(entity);
                        }
                    }
                }
            }
        }
        
        return nearby;
    }
    
    clear() {
        this.grid.clear();
    }
    
    cleanup() {
        // Limpar células vazias
        for (const [cell, entities] of this.grid) {
            if (entities.length === 0) {
                this.grid.delete(cell);
            }
        }
    }
}

module.exports = FreeTierGameplay;
