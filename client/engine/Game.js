/**
 * Main Game Engine
 * Version 0.2 - Scalable Browser MMORPG Engine
 */

class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.running = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        
        // Core systems
        this.renderer = null;
        this.input = null;
        this.camera = null;
        this.entityManager = null;
        
        // Game systems
        this.world = null;
        this.combatSystem = null;
        this.aiSystem = null;
        this.spawnSystem = null;
        this.lootSystem = null;
        this.inventorySystem = null;
        this.classSystem = null;
        this.skillSystem = null;
        this.economyManager = null;
        this.dungeonManager = null;
        
        // Game state
        this.state = {
            screen: 'login',
            sessionUser: '',
            worldX: 0,
            worldY: 0,
            instance: null,
            dungeonRun: null,
            player: null,
            entities: [],
            mapData: null,
            currentBiome: null,
            gameTime: 0,
            paused: false
        };
        
        this.init();
    }
    
    async init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.canvas) {
            console.error('Game canvas not found!');
            return;
        }
        
        // Initialize core systems
        await this.initializeSystems();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start game loop
        this.start();
    }
    
    async initializeSystems() {
        // Import and initialize core systems
        const { Renderer } = await import('./Renderer.js');
        const { Input } = await import('./Input.js');
        const { Camera } = await import('./Camera.js');
        const { EntityManager } = await import('./EntityManager.js');
        
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.input = new Input(this.canvas);
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.entityManager = new EntityManager();
        
        // Import and initialize game systems
        const { WorldGenerator } = await import('../world/WorldGenerator.js');
        const { CombatSystem } = await import('../systems/CombatSystem.js');
        const { AISystem } = await import('../systems/AISystem.js');
        const { SpawnSystem } = await import('../systems/SpawnSystem.js');
        const { ClassSystem } = await import('../systems/ClassSystem.js');
        const { SkillSystem } = await import('../systems/SkillSystem.js');
        
        this.world = new WorldGenerator();
        this.combatSystem = new CombatSystem(this);
        this.aiSystem = new AISystem(this);
        this.spawnSystem = new SpawnSystem(this);
        this.classSystem = new ClassSystem(this);
        this.skillSystem = new SkillSystem(this);
        
        console.log('All systems initialized successfully');
    }
    
    setupEventListeners() {
        // Window events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('focus', () => this.resume());
        
        // Input events
        this.input.on('move', (direction) => this.handlePlayerMove(direction));
        this.input.on('action', (action) => this.handlePlayerAction(action));
        this.input.on('skill', (skillId) => this.handleSkillUse(skillId));
    }
    
    handleResize() {
        // Handle canvas resize
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.camera.updateViewport(this.canvas.width, this.canvas.height);
        }
    }
    
    handlePlayerMove(direction) {
        if (!this.state.player || this.state.paused) return;
        
        const player = this.state.player;
        const newX = player.x;
        const newY = player.y;
        
        // Calculate new position based on direction
        switch (direction) {
            case 'north': newY--; break;
            case 'south': newY++; break;
            case 'west': newX--; break;
            case 'east': newX++; break;
        }
        
        // Check if movement is valid
        if (this.canMoveTo(newX, newY)) {
            player.x = newX;
            player.y = newY;
            
            // Trigger combat if enemy is at new position
            this.checkCombatEncounter();
            
            // Update camera to follow player
            this.camera.follow(player);
        }
    }
    
    handlePlayerAction(action) {
        if (!this.state.player || this.state.paused) return;
        
        switch (action) {
            case 'interact':
                this.handleInteraction();
                break;
            case 'attack':
                this.handleAttack();
                break;
            case 'inventory':
                this.toggleInventory();
                break;
        }
    }
    
    handleSkillUse(skillId) {
        if (!this.state.player || this.state.paused) return;
        this.skillSystem.useSkill(this.state.player, skillId);
    }
    
    canMoveTo(x, y) {
        // Check boundaries
        if (x < 0 || y < 0 || x >= 25 || y >= 15) return false;
        
        // Check map collision
        if (this.state.mapData && this.state.mapData[y][x] === 1) return false;
        
        // Check entity collision
        const entityAtPosition = this.entityManager.getEntityAt(x, y);
        if (entityAtPosition && entityAtPosition.type === 'monster') {
            return false; // Can't move through monsters
        }
        
        return true;
    }
    
    checkCombatEncounter() {
        const entityAtPosition = this.entityManager.getEntityAt(
            this.state.player.x, 
            this.state.player.y
        );
        
        if (entityAtPosition && entityAtPosition.type === 'monster') {
            this.combatSystem.startCombat(this.state.player, entityAtPosition);
        }
    }
    
    handleInteraction() {
        // Check for nearby NPCs or interactive objects
        const nearbyEntities = this.entityManager.getEntitiesInRange(
            this.state.player.x, 
            this.state.player.y, 
            1
        );
        
        for (const entity of nearbyEntities) {
            if (entity.type === 'npc' || entity.interactive) {
                this.interactWithEntity(entity);
                break;
            }
        }
    }
    
    handleAttack() {
        // Find nearest enemy in attack range
        const attackRange = 1; // Adjacent tiles
        const enemies = this.entityManager.getEntitiesInRange(
            this.state.player.x,
            this.state.player.y,
            attackRange
        ).filter(e => e.type === 'monster');
        
        if (enemies.length > 0) {
            this.combatSystem.startCombat(this.state.player, enemies[0]);
        }
    }
    
    interactWithEntity(entity) {
        console.log(`Interacting with ${entity.name || entity.id}`);
        // Implementation depends on entity type
    }
    
    toggleInventory() {
        // Toggle inventory UI
        const inventoryUI = document.getElementById('inventoryPanel');
        if (inventoryUI) {
            inventoryUI.classList.toggle('hidden');
        }
    }
    
    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    pause() {
        this.state.paused = true;
    }
    
    resume() {
        this.state.paused = false;
    }
    
    stop() {
        this.running = false;
    }
    
    gameLoop(currentTime = 0) {
        if (!this.running) return;
        
        // Calculate delta time
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update game state
        if (!this.state.paused) {
            this.update(this.deltaTime);
        }
        
        // Render everything
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        this.state.gameTime += deltaTime;
        
        // Update all systems
        this.entityManager.update(deltaTime);
        this.aiSystem.update(deltaTime);
        this.combatSystem.update(deltaTime);
        this.spawnSystem.update(deltaTime);
        this.skillSystem.update(deltaTime);
        
        // Update camera
        if (this.state.player) {
            this.camera.follow(this.state.player);
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render game world
        this.renderer.render(this.state, this.camera);
        
        // Render UI elements
        this.renderUI();
    }
    
    renderUI() {
        // This would be handled by UI components
        // For now, just render basic debug info
        if (process.env.NODE_ENV === 'development') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(`FPS: ${Math.round(1000 / this.deltaTime)}`, 10, 20);
            this.ctx.fillText(`Entities: ${this.entityManager.entities.length}`, 10, 35);
            this.ctx.fillText(`Position: ${this.state.player?.x || 0}, ${this.state.player?.y || 0}`, 10, 50);
        }
    }
    
    // Public API for external systems
    getEntityManager() {
        return this.entityManager;
    }
    
    getCombatSystem() {
        return this.combatSystem;
    }
    
    getWorld() {
        return this.world;
    }
    
    getState() {
        return this.state;
    }
    
    setState(key, value) {
        this.state[key] = value;
    }
}

// Export for use in main application
window.Game = Game;
export default Game;
