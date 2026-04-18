// === GAME ENGINE ===

/**
 * Motor principal do jogo
 * Inicializa apenas após world_init event
 */

export class GameEngine {
    constructor() {
        // Estado do jogo
        this.isInitialized = false;
        this.isRunning = false;
        this.worldData = null;
        
        // Canvas e renderização
        this.canvas = null;
        this.ctx = null;
        this.minimap = null;
        this.minimapCtx = null;
        
        // Entidades
        this.player = null;
        this.mobs = [];
        this.npcs = [];
        this.items = [];
        
        // Sistemas
        this.ecsManager = null;
        this.inputSystem = null;
        this.renderer = null;
        
        // Game loop
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTime = 0;
        
        // Configurações
        this.config = {
            playerSpeed: 150,
            mobCount: 5,
            gridSize: 32
        };
        
        // Eventos
        this.eventCallbacks = new Map();
        
        console.log('🎮 GameEngine initialized (waiting for world_init)');
    }
    
    // === INITIALIZATION ===
    
    initializeWorld(worldData) {
        if (this.isInitialized) {
            console.warn('⚠️ GameEngine already initialized');
            return false;
        }
        
        console.log('🌍 Initializing world with data:', worldData);
        
        this.worldData = worldData;
        
        try {
            // 1. Setup Canvas
            this.setupCanvas();
            
            // 2. Initialize ECS
            this.initializeECS();
            
            // 3. Spawn Player
            this.spawnPlayer(worldData.playerId);
            
            // 4. Spawn Mobs
            this.spawnMobs();
            
            // 5. Initialize Input
            this.initializeInput();
            
            // 6. Initialize Renderer
            this.initializeRenderer();
            
            // 7. Start Game Loop
            this.startGameLoop();
            
            this.isInitialized = true;
            console.log('✅ World initialized successfully');
            
            this.emit('world_initialized', { worldData });
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize world:', error);
            this.emit('world_init_error', { error });
            return false;
        }
    }
    
    setupCanvas() {
        if (!document) {
            throw new Error('Document not available');
        }
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.minimap = document.getElementById('minimap');
        this.minimapCtx = this.minimap ? this.minimap.getContext('2d') : null;
        
        if (!this.canvas || !this.ctx) {
            throw new Error('Canvas or context not available');
        }
        
        // Configurar canvas
        this.canvas.width = this.worldData.mapWidth || 800;
        this.canvas.height = this.worldData.mapHeight || 600;
        
        console.log('📐 Canvas configured:', `${this.canvas.width}x${this.canvas.height}`);
    }
    
    initializeECS() {
        if (!window.ECSManager) {
            console.warn('⚠️ ECSManager not available, using fallback');
            return;
        }
        
        this.ecsManager = new window.ECSManager();
        console.log('🗄️ ECS Manager initialized');
    }
    
    spawnPlayer(playerId) {
        const characterData = window.sessionManager?.getCurrentCharacter();
        if (!characterData) {
            throw new Error('No character data available');
        }
        
        this.player = {
            id: playerId,
            name: characterData.name,
            class: characterData.class || 'Guerreiro',
            level: characterData.level || 1,
            x: characterData.x || 400,
            y: characterData.y || 300,
            size: characterData.size || 32,
            speed: characterData.speed || this.config.playerSpeed,
            health: characterData.hp || 100,
            maxHealth: characterData.maxHp || 100,
            atk: characterData.atk || 10,
            def: characterData.def || 5,
            color: characterData.color || '#4CAF50'
        };
        
        // Criar entidade ECS
        if (this.ecsManager) {
            const playerEntity = this.ecsManager.createEntity(this.player.id);
            this.ecsManager.addComponentToEntity(playerEntity.id, 'position', {
                x: this.player.x,
                y: this.player.y
            });
            this.ecsManager.addComponentToEntity(playerEntity.id, 'movement', {
                speed: this.player.speed,
                velocity: { x: 0, y: 0 }
            });
            this.ecsManager.addComponentToEntity(playerEntity.id, 'health', {
                health: this.player.health,
                maxHealth: this.player.maxHealth
            });
            this.ecsManager.addComponentToEntity(playerEntity.id, 'render', {
                size: this.player.size,
                color: this.player.color
            });
        }
        
        console.log('🦸 Player spawned:', this.player.name);
    }
    
    spawnMobs() {
        this.mobs = [];
        
        // Dados de mobs (simplificado para estabilização)
        const mobTypes = [
            { name: 'Goblin', color: '#FF6B6B', hp: 30, atk: 5, speed: 80 },
            { name: 'Orc', color: '#8B4513', hp: 50, atk: 8, speed: 60 },
            { name: 'Skeleton', color: '#F0F0F0', hp: 25, atk: 6, speed: 100 }
        ];
        
        for (let i = 0; i < this.config.mobCount; i++) {
            const mobType = mobTypes[i % mobTypes.length];
            
            const mob = {
                id: `mob_${i}`,
                name: mobType.name,
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                size: 28,
                color: mobType.color,
                health: mobType.hp,
                maxHealth: mobType.hp,
                atk: mobType.atk,
                speed: mobType.speed,
                aiState: 'patrolling',
                direction: Math.random() * Math.PI * 2,
                lastDecision: Date.now(),
                decisionCooldown: 2000,
                aggroRange: 150,
                attackRange: 40,
                attackCooldown: 1500,
                lastAttack: 0,
                patrolCenter: null,
                patrolRadius: 100
            };
            
            this.mobs.push(mob);
            
            // Criar entidade ECS
            if (this.ecsManager) {
                const mobEntity = this.ecsManager.createEntity(mob.id);
                this.ecsManager.addComponentToEntity(mobEntity.id, 'position', {
                    x: mob.x,
                    y: mob.y
                });
                this.ecsManager.addComponentToEntity(mobEntity.id, 'movement', {
                    speed: mob.speed,
                    velocity: { x: 0, y: 0 }
                });
                this.ecsManager.addComponentToEntity(mobEntity.id, 'health', {
                    health: mob.health,
                    maxHealth: mob.maxHealth
                });
                this.ecsManager.addComponentToEntity(mobEntity.id, 'render', {
                    size: mob.size,
                    color: mob.color
                });
                this.ecsManager.addComponentToEntity(mobEntity.id, 'ai', {
                    state: mob.aiState,
                    aggroRange: mob.aggroRange,
                    attackRange: mob.attackRange
                });
            }
        }
        
        console.log(`👾 Spawned ${this.mobs.length} mobs`);
    }
    
    initializeInput() {
        this.inputSystem = {
            keys: {},
            isInitialized: false
        };
        
        // Setup keyboard listeners
        if (document) {
            document.addEventListener('keydown', (e) => {
                this.inputSystem.keys[e.key.toLowerCase()] = true;
            });
            
            document.addEventListener('keyup', (e) => {
                this.inputSystem.keys[e.key.toLowerCase()] = false;
            });
        }
        
        this.inputSystem.isInitialized = true;
        console.log('⌨️ Input system initialized');
    }
    
    initializeRenderer() {
        this.renderer = {
            isInitialized: false
        };
        
        if (this.ctx) {
            this.renderer.isInitialized = true;
            console.log('🎨 Renderer initialized');
        } else {
            throw new Error('Cannot initialize renderer without context');
        }
    }
    
    // === GAME LOOP ===
    
    startGameLoop() {
        if (this.isRunning) {
            console.warn('⚠️ Game loop already running');
            return;
        }
        
        console.log('🔄 Starting game loop...');
        this.isRunning = true;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fpsTime = this.lastTime;
        
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        try {
            // Update
            this.update(deltaTime);
            
            // Render
            this.render();
            
            // FPS
            this.updateFPS(currentTime);
            
        } catch (error) {
            console.error('❌ Game loop error:', error);
            this.emit('game_loop_error', { error });
        }
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Update ECS
        if (this.ecsManager) {
            this.ecsManager.update(deltaTime);
        } else {
            // Fallback update
            this.updatePlayer(deltaTime);
            this.updateMobs(deltaTime);
        }
        
        // Sync entities
        this.syncEntities();
    }
    
    updatePlayer(deltaTime) {
        if (!this.player || !this.inputSystem) return;
        
        const speed = this.player.speed * deltaTime;
        const keys = this.inputSystem.keys;
        
        // Movement
        if (keys['w']) this.player.y = Math.max(this.player.size/2, this.player.y - speed);
        if (keys['s']) this.player.y = Math.min(this.canvas.height - this.player.size/2, this.player.y + speed);
        if (keys['a']) this.player.x = Math.max(this.player.size/2, this.player.x - speed);
        if (keys['d']) this.player.x = Math.min(this.canvas.width - this.player.size/2, this.player.x + speed);
        
        // Send network update
        if (window.networkManager?.isConnected) {
            window.networkManager.sendPlayerUpdate(
                { x: this.player.x, y: this.player.y },
                { x: 0, y: 0 }
            );
        }
    }
    
    updateMobs(deltaTime) {
        this.mobs.forEach(mob => {
            if (!mob) return;
            
            // Simple AI
            this.updateMobAI(mob, deltaTime);
            this.updateMobPosition(mob, deltaTime);
        });
    }
    
    updateMobAI(mob, deltaTime) {
        const now = Date.now();
        if (now - mob.lastDecision < mob.decisionCooldown) return;
        
        const dx = this.player.x - mob.x;
        const dy = this.player.y - mob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // State transitions
        if (mob.health / mob.maxHealth < 0.3) {
            mob.aiState = 'fleeing';
        } else if (distance < mob.aggroRange) {
            mob.aiState = 'aggro';
        } else if (mob.aiState !== 'patrolling') {
            mob.aiState = 'patrolling';
        }
        
        mob.lastDecision = now;
    }
    
    updateMobPosition(mob, deltaTime) {
        const speed = mob.speed * deltaTime;
        
        switch (mob.aiState) {
            case 'patrolling':
                this.handlePatrolState(mob, speed);
                break;
            case 'aggro':
                this.handleAggroState(mob, speed);
                break;
            case 'fleeing':
                this.handleFleeState(mob, speed);
                break;
        }
        
        // Keep in bounds
        mob.x = Math.max(mob.size/2, Math.min(this.canvas.width - mob.size/2, mob.x));
        mob.y = Math.max(mob.size/2, Math.min(this.canvas.height - mob.size/2, mob.y));
    }
    
    handlePatrolState(mob, speed) {
        if (!mob.patrolCenter) {
            mob.patrolCenter = { x: mob.x, y: mob.y };
        }
        
        if (Math.random() < 0.02) {
            mob.direction += (Math.random() - 0.5) * Math.PI * 0.1;
        }
        
        mob.x += Math.cos(mob.direction) * speed;
        mob.y += Math.sin(mob.direction) * speed;
        
        const distFromCenter = Math.sqrt(
            Math.pow(mob.x - mob.patrolCenter.x, 2) + 
            Math.pow(mob.y - mob.patrolCenter.y, 2)
        );
        
        if (distFromCenter > mob.patrolRadius) {
            const angleToCenter = Math.atan2(
                mob.patrolCenter.y - mob.y,
                mob.patrolCenter.x - mob.x
            );
            mob.direction = angleToCenter;
        }
    }
    
    handleAggroState(mob, speed) {
        const dx = this.player.x - mob.x;
        const dy = this.player.y - mob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > mob.aggroRange) {
            mob.aiState = 'patrolling';
            return;
        }
        
        mob.direction = Math.atan2(dy, dx);
        
        if (distance > mob.attackRange) {
            mob.x += Math.cos(mob.direction) * speed;
            mob.y += Math.sin(mob.direction) * speed;
        }
    }
    
    handleFleeState(mob, speed) {
        const dx = mob.x - this.player.x;
        const dy = mob.y - this.player.y;
        const angle = Math.atan2(dy, dx);
        
        mob.direction = angle;
        mob.x += Math.cos(angle) * speed * 1.5;
        mob.y += Math.sin(angle) * speed * 1.5;
        
        const distFromPlayer = Math.sqrt(dx * dx + dy * dy);
        if (distFromPlayer > mob.aggroRange * 2) {
            mob.aiState = 'patrolling';
        }
    }
    
    syncEntities() {
        if (!this.ecsManager) return;
        
        // Sync player
        const playerEntity = this.ecsManager.getEntity(this.player.id);
        if (playerEntity) {
            const position = playerEntity.getComponent('position');
            if (position) {
                position.x = this.player.x;
                position.y = this.player.y;
            }
        }
        
        // Sync mobs
        this.mobs.forEach(mob => {
            const mobEntity = this.ecsManager.getEntity(mob.id);
            if (mobEntity) {
                const position = mobEntity.getComponent('position');
                const health = mobEntity.getComponent('health');
                const ai = mobEntity.getComponent('ai');
                
                if (position) {
                    position.x = mob.x;
                    position.y = mob.y;
                }
                if (health) {
                    health.health = mob.health;
                }
                if (ai) {
                    ai.state = mob.aiState;
                }
            }
        });
    }
    
    render() {
        if (!this.renderer?.isInitialized) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#405b33';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render grid
        this.renderGrid();
        
        // Render entities
        if (this.ecsManager) {
            this.ecsManager.render(this.ctx);
        } else {
            this.renderEntities();
        }
        
        // Render minimap
        this.renderMinimap();
        
        // Update UI
        this.updateUI();
    }
    
    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvas.width; x += this.config.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += this.config.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    renderEntities() {
        // Render player
        if (this.player) {
            this.ctx.fillStyle = this.player.color;
            this.ctx.fillRect(
                this.player.x - this.player.size/2,
                this.player.y - this.player.size/2,
                this.player.size,
                this.player.size
            );
            
            // Player border
            this.ctx.strokeStyle = '#2E7D32';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                this.player.x - this.player.size/2,
                this.player.y - this.player.size/2,
                this.player.size,
                this.player.size
            );
        }
        
        // Render mobs
        this.mobs.forEach(mob => {
            if (!mob) return;
            
            this.ctx.fillStyle = mob.color;
            this.ctx.fillRect(
                mob.x - mob.size/2,
                mob.y - mob.size/2,
                mob.size,
                mob.size
            );
            
            // Mob border
            this.ctx.strokeStyle = '#C62828';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                mob.x - mob.size/2,
                mob.y - mob.size/2,
                mob.size,
                mob.size
            );
            
            // Mob eyes
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(mob.x - 6, mob.y - 4, 4, 4);
            this.ctx.fillRect(mob.x + 2, mob.y - 4, 4, 4);
        });
    }
    
    renderMinimap() {
        if (!this.minimap || !this.minimapCtx) return;
        
        // Clear minimap
        this.minimapCtx.fillStyle = '#405b33';
        this.minimapCtx.fillRect(0, 0, this.minimap.width, this.minimap.height);
        
        // Render player
        if (this.player) {
            this.minimapCtx.fillStyle = '#4CAF50';
            const miniX = (this.player.x / this.canvas.width) * this.minimap.width;
            const miniY = (this.player.y / this.canvas.height) * this.minimap.height;
            this.minimapCtx.fillRect(miniX - 1, miniY - 1, 2, 2);
        }
        
        // Render mobs
        this.mobs.forEach(mob => {
            if (!mob) return;
            
            this.minimapCtx.fillStyle = mob.color;
            const miniX = (mob.x / this.canvas.width) * this.minimap.width;
            const miniY = (mob.y / this.canvas.height) * this.minimap.height;
            this.minimapCtx.fillRect(miniX - 1, miniY - 1, 2, 2);
        });
    }
    
    updateUI() {
        if (!this.player) return;
        
        const playerName = document.getElementById('playerName');
        const playerLevel = document.getElementById('playerLevel');
        const hpText = document.getElementById('hpText');
        const positionText = document.getElementById('positionText');
        const mobCount = document.getElementById('mobCount');
        const fpsText = document.getElementById('fpsText');
        
        if (playerName) playerName.textContent = this.player.name;
        if (playerLevel) playerLevel.textContent = `Lv. ${this.player.level}`;
        if (hpText) hpText.textContent = `${this.player.health}/${this.player.maxHealth}`;
        if (positionText) positionText.textContent = `${Math.round(this.player.x)}, ${Math.round(this.player.y)}`;
        if (mobCount) mobCount.textContent = `${this.mobs.length} mobs`;
        if (fpsText) fpsText.textContent = `${this.fps} FPS`;
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        if (currentTime - this.fpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = currentTime;
        }
    }
    
    // === EVENT SYSTEM ===
    
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.eventCallbacks.has(event)) {
            this.eventCallbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in game engine callback for ${event}:`, error);
                }
            });
        }
    }
    
    // === CONTROL METHODS ===
    
    stop() {
        console.log('🛑 Stopping game engine');
        this.isRunning = false;
        this.isInitialized = false;
    }
    
    restart() {
        console.log('🔄 Restarting game engine');
        this.stop();
        if (this.worldData) {
            this.initializeWorld(this.worldData);
        }
    }
    
    // === STATUS ===
    
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            hasWorldData: !!this.worldData,
            hasPlayer: !!this.player,
            mobCount: this.mobs.length,
            fps: this.fps,
            hasECS: !!this.ecsManager,
            hasInput: !!this.inputSystem?.isInitialized,
            hasRenderer: !!this.renderer?.isInitialized
        };
    }
    
    // === ADVANCED SYSTEMS (DISABLED FOR STABILIZATION) ===
    
    enableEconomy() {
        console.log('💰 Economy system disabled for stabilization');
    }
    
    enableGuilds() {
        console.log('🏰 Guild system disabled for stabilization');
    }
    
    enableQuests() {
        console.log('📜 Quest system disabled for stabilization');
    }
    
    enablePvP() {
        console.log('⚔️ PvP system disabled for stabilization');
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.GameEngine = GameEngine;
}
