/**
 * Main Game Engine
 * Integrates all systems using generated art assets
 */

class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.running = false;
        this.gameTime = 0;
        this.lastTime = 0;
        
        // Constants
        this.TILE_SIZE = 64;
        
        // Game systems
        this.assetManager = null;
        this.tileMap = null;
        this.hudManager = null;
        this.characterRenderer = null;
        this.npcRenderer = null;
        this.monsterRenderer = null;
        
        // Game state
        this.player = null;
        this.currentMap = 'village_day';
        this.entities = [];
        
        // Input state
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        this.init();
    }
    
    /**
     * Initialize game engine
     */
    async init() {
        console.log('🎮 Inicializando motor do jogo...');
        
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Initialize canvas
            this.createGameCanvas();
            
            // Initialize systems
            await this.initializeSystems();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial map
            await this.loadInitialMap();
            
            // Start game loop
            this.startGameLoop();
            
            console.log('✅ Motor do jogo inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização do motor:', error);
        }
    }
    
    /**
     * Create game canvas
     */
    createGameCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('❌ Canvas do jogo não encontrado');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        
        // FORÇAR FOCO E TORNAR INTERATIVO
        this.canvas.tabIndex = 0; // Tornar canvas focusable
        this.canvas.style.outline = 'none'; // Remover outline
        this.canvas.focus();
        
        // Adicionar evento de clique para garantir foco
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
            console.log('🎯 Canvas clicado e focado');
        });
        
        // Adicionar evento de foco manual
        this.canvas.addEventListener('focus', () => {
            console.log('🎯 Canvas recebeu foco');
        });
        
        this.canvas.addEventListener('blur', () => {
            console.log('🎯 Canvas perdeu foco');
        });
        
        // FORÇAR FOCO QUANDO O JOGO INICIAR
        setTimeout(() => {
            this.canvas.focus();
            console.log('🎯 Canvas focado após delay');
        }, 1000);
        
        // DEBUG: Verificar foco
        console.log(`🎯 Canvas Focus Status: ${document.activeElement === this.canvas ? 'FOCUSED' : 'NOT FOCUSED'}`);
        console.log(`🎯 Canvas Element: ${this.canvas.tagName}#${this.canvas.id}`);
        console.log(`🎯 Active Element: ${document.activeElement?.tagName}#${document.activeElement?.id}`);
        
        console.log('✅ Canvas do jogo configurado');
    }
    
    /**
     * Resize canvas to window
     */
    resizeCanvas() {
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;
        
        const rect = gameScreen.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Center canvas
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
    }
    
    /**
     * Initialize all systems
     */
    async initializeSystems() {
        console.log('🔧 Inicializando sistemas...');
        
        // Initialize asset manager
        if (window.assetManager) {
            this.assetManager = window.assetManager;
            await this.assetManager.initialize();
        } else {
            console.error('❌ AssetManager não encontrado');
        }
        
        // Initialize tile map
        if (window.tileMapNew) {
            this.tileMap = new window.TileMap(this.assetManager);
            await this.loadInitialMap();
        } else {
            console.error('❌ TileMap não encontrado');
        }
        
        // Initialize sprite manager
        if (window.spriteManager) {
            this.spriteManager = window.spriteManager;
        } else {
            console.error('❌ SpriteManager não encontrado');
        }
        
        // Initialize HUD (após todos os sistemas)
        if (window.hudManager) {
            this.hudManager = window.hudManager;
            this.hudManager.setGameEngine(this); // Passar referência
        } else {
            console.error('❌ HUDManager não encontrado');
        }
        
        // Initialize renderers
        if (window.spriteManager) {
            this.characterRenderer = new CharacterRenderer(this.ctx, this.spriteManager);
            this.npcRenderer = new NPCRenderer(this.ctx, this.spriteManager);
            this.monsterRenderer = new MonsterRenderer(this.ctx, this.spriteManager);
        } else {
            console.error('❌ SpriteManager não encontrado');
        }
        
        console.log('✅ Sistemas inicializados');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Keyboard input - apenas quando o jogo está ativo
        window.addEventListener('keydown', (e) => {
            // DEBUG: Mostrar todos os keydowns
            console.log(`⌨️ KeyDown: ${e.key}, ActiveElement: ${document.activeElement?.tagName}, CanvasFocused: ${document.activeElement === this.canvas}`);
            
            // Só captura teclas do jogo se o canvas estiver focado
            if (document.activeElement === this.canvas || document.activeElement === document.body) {
                this.keys[e.key.toLowerCase()] = true;
                
                // Prevent default para teclas do jogo apenas quando canvas está focado
                if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            // Só captura teclas do jogo se o canvas estiver focado
            if (document.activeElement === this.canvas || document.activeElement === document.body) {
                this.keys[e.key.toLowerCase()] = false;
            }
        });
        
        // Mouse input
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.mouse.clicked = true;
            
            // Handle entity interaction
            this.handleEntityClick(e);
        });
        
        // Handle player data from login system
        window.addEventListener('playerDataReady', (e) => {
            this.handlePlayerData(e.detail);
        });
        
        console.log('✅ Event listeners configurados');
    }
    
    /**
     * Load initial map
     */
    async loadInitialMap() {
        console.log('🗺️ Carregando mapa inicial...');
        
        const success = await this.tileMap.loadMap(this.currentMap);
        if (success) {
            // Create player character
            this.createPlayer();
            
            // Update HUD with map info
            const mapInfo = this.tileMap.getCurrentMapInfo();
            if (this.hudManager && this.hudManager.addChatMessage) {
                this.hudManager.addChatMessage(`📍 Bem-vindo a ${mapInfo.displayName}!`, 'system');
                this.hudManager.addChatMessage(`📝 ${mapInfo.description}`, 'system');
            }
        }
    }
    
    /**
     * Handle player data from login
     */
    handlePlayerData(playerData) {
        console.log('👤 Dados do jogador recebidos:', playerData);
        
        this.player = {
            id: playerData.id,
            name: playerData.name,
            race: playerData.race || 'human',
            class: playerData.class || 'recruta',
            level: playerData.level || 1,
            x: 15,
            y: 8,
            health: playerData.health || 100,
            maxHealth: playerData.maxHealth || 100,
            mana: playerData.mana || 50,
            maxMana: playerData.maxMana || 50,
            exp: playerData.exp || 0,
            expToNext: playerData.expToNext || 100,
            strength: playerData.strength || 10,
            defense: playerData.defense || 5,
            speed: playerData.speed || 8,
            magic: playerData.magic || 3,
            direction: 'DOWN',
            state: 'IDLE',
            inventory: playerData.inventory || [],
            gold: playerData.gold || 0
        };
        
        // Update HUD with player stats
        this.hudManager.updatePlayerStats({
            playerHealth: this.player.health,
            playerMaxHealth: this.player.maxHealth,
            playerMana: this.player.mana,
            playerMaxMana: this.player.maxMana,
            playerExp: this.player.exp,
            playerExpToNext: this.player.expToNext,
            playerLevel: this.player.level,
            playerGold: this.player.gold,
            inventory: this.player.inventory
        });
        
        console.log('✅ Jogador criado no mundo do jogo');
    }
    
    /**
     * Create player character
     */
    createPlayer() {
        // Get spawn point
        const spawnPoint = this.tileMap.getSpawnPoint('player');
        
        // Create player entity
        this.player = {
            id: 'player_1',
            x: spawnPoint.x,
            y: spawnPoint.y,
            race: 'human',
            class: 'recruta',
            level: 1,
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            exp: 0,
            expToNext: 100,
            strength: 10,
            defense: 5,
            speed: 8,
            magic: 3,
            direction: 'DOWN',
            state: 'IDLE',
            inventory: [],
            gold: 0
        };
        
        // Add to entities list
        this.entities.push(this.player);
        
        console.log('✅ Personagem do jogador criado');
    }
    
    /**
     * Handle entity clicks
     */
    handleEntityClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Convert to grid coordinates
        const gridX = Math.floor(clickX / this.TILE_SIZE);
        const gridY = Math.floor(clickY / this.TILE_SIZE);
        
        // Check for entity at click position
        const entity = this.tileMap.getEntityAt(gridX, gridY);
        
        if (entity) {
            this.interactWithEntity(entity);
        }
    }
    
    /**
     * Interact with entity
     */
    interactWithEntity(entity) {
        console.log('🖱️ Interação com entidade:', entity);
        
        switch (entity.entityType) {
            case 'npc':
                this.interactWithNPC(entity);
                break;
            case 'object':
                this.interactWithObject(entity);
                break;
            case 'monster':
                this.interactWithMonster(entity);
                break;
        }
    }
    
    /**
     * Interact with NPC
     */
    interactWithNPC(npc) {
        const dialogue = npc.dialogue || ["Olá, aventureiro!"];
        const randomDialogue = dialogue[Math.floor(Math.random() * dialogue.length)];
        
        this.hudManager.addChatMessage(`💬 ${npc.name}: ${randomDialogue}`, 'npc');
        
        // Show NPC inventory if merchant
        if (npc.inventory && npc.inventory.length > 0) {
            console.log('🛒 Inventário do NPC:', npc.inventory);
        }
    }
    
    /**
     * Interact with object
     */
    interactWithObject(object) {
        console.log('🎯 Interação com objeto:', object);
        
        if (object.interactive) {
            this.hudManager.addChatMessage(`🎯 ${object.name}: ${object.action}`, 'system');
            
            // Add loot to inventory if object has loot
            if (object.loot && object.loot.length > 0) {
                object.loot.forEach(item => {
                    this.player.inventory.push(item);
                    this.hudManager.addInventoryItem(item);
                    this.hudManager.addChatMessage(`🎒 Obtido: ${item.name}`, 'system');
                });
                
                // Mark object as used
                object.used = true;
            }
        }
    }
    
    /**
     * Interact with monster
     */
    interactWithMonster(monster) {
        console.log('⚔️ Interação com monstro:', monster);
        
        // Start combat
        this.hudManager.addChatMessage(`⚔️ Combate iniciado contra ${monster.name}!`, 'combat');
        
        // Simple combat calculation
        const playerDamage = this.player.strength + Math.floor(Math.random() * 5);
        monster.health -= playerDamage;
        
        this.hudManager.addChatMessage(`⚔️ Você causou ${playerDamage} de dano!`, 'combat');
        
        if (monster.health <= 0) {
            this.defeatMonster(monster);
        } else {
            // Monster counter-attack
            setTimeout(() => {
                const monsterDamage = monster.damage || 10;
                this.player.health -= monsterDamage;
                
                this.hudManager.addChatMessage(`👹 ${monster.name} causou ${monsterDamage} de dano!`, 'combat');
                
                if (this.player.health <= 0) {
                    this.defeatPlayer();
                }
                
                // Update HUD
                this.hudManager.updatePlayerStats({
                    playerHealth: this.player.health,
                    playerMaxHealth: this.player.maxHealth
                });
            }, 1000);
        }
    }
    
    /**
     * Defeat monster
     */
    defeatMonster(monster) {
        this.hudManager.addChatMessage(`💀 ${monster.name} derrotado!`, 'combat');
        
        // Give experience and gold
        const expGained = monster.maxHealth * 2;
        const goldGained = Math.floor(Math.random() * 50) + 10;
        
        this.player.exp += expGained;
        this.player.gold += goldGained;
        
        this.hudManager.addChatMessage(`⭐ +${expGained} XP`, 'system');
        this.hudManager.addChatMessage(`🪙 +${goldGained} ouro`, 'system');
        
        // Check level up
        if (this.player.exp >= this.player.expToNext) {
            this.levelUp();
        }
        
        // Remove monster from entities
        const index = this.entities.findIndex(e => e.id === monster.id);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
        
        // Update HUD
        this.hudManager.updatePlayerStats({
            playerExp: this.player.exp,
            playerExpToNext: this.player.expToNext,
            playerLevel: this.player.level,
            playerGold: this.player.gold
        });
    }
    
    /**
     * Level up player
     */
    levelUp() {
        this.player.level++;
        this.player.exp -= this.player.expToNext;
        this.player.expToNext = this.player.level * 100;
        this.player.maxHealth += 10;
        this.player.health = this.player.maxHealth;
        this.player.maxMana += 5;
        this.player.mana = this.player.maxMana;
        this.player.strength += 2;
        this.player.defense += 1;
        this.player.speed += 0.5;
        this.player.magic += 1;
        
        this.hudManager.addChatMessage(`🎉 LEVEL UP! Agora nível ${this.player.level}!`, 'system');
        this.hudManager.addChatMessage(`📈 Atributos aumentados!`, 'system');
    }
    
    /**
     * Defeat player
     */
    defeatPlayer() {
        this.hudManager.addChatMessage(`💀 Você foi derrotado!`, 'combat');
        this.hudManager.addChatMessage(`🏥️ Revivindo na vila...`, 'system');
        
        // Respawn after delay
        setTimeout(() => {
            this.respawnPlayer();
        }, 3000);
    }
    
    /**
     * Respawn player
     */
    respawnPlayer() {
        const spawnPoint = this.tileMap.getSpawnPoint('player');
        this.player.x = spawnPoint.x;
        this.player.y = spawnPoint.y;
        this.player.health = this.player.maxHealth;
        this.player.mana = this.player.maxMana;
        this.player.state = 'IDLE';
        
        this.hudManager.addChatMessage(`✅ Revivido!`, 'system');
        
        // Update HUD
        this.hudManager.updatePlayerStats({
            playerHealth: this.player.health,
            playerMaxHealth: this.player.maxHealth,
            playerMana: this.player.mana,
            playerMaxMana: this.player.maxMana
        });
    }
    
    /**
     * Update player movement
     */
    updatePlayerMovement(deltaTime) {
        if (!this.player) return;
        
        let dx = 0;
        let dy = 0;
        const moveSpeed = this.player.speed * deltaTime * 0.1;
        
        // Handle input
        if (this.keys['w'] || this.keys['arrowup']) {
            dy -= moveSpeed;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            dy += moveSpeed;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            dx -= moveSpeed;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            dx += moveSpeed;
        }
        
        // Check collision
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        const gridX = Math.floor(newX);
        const gridY = Math.floor(newY);
        
        const isWalkable = this.tileMap.isWalkable(gridX, gridY);
        
        if (isWalkable) {
            this.player.x = newX;
            this.player.y = newY;
            
            // Update state
            if (dx !== 0 || dy !== 0) {
                this.player.state = 'WALK';
                
                // Update direction
                if (dy < 0) this.player.direction = 'UP';
                else if (dy > 0) this.player.direction = 'DOWN';
                else if (dx < 0) this.player.direction = 'LEFT';
                else if (dx > 0) this.player.direction = 'RIGHT';
            } else {
                this.player.state = 'IDLE';
            }
        }
    }
    
    /**
     * Update entities
     */
    updateEntities(deltaTime) {
        // Update NPCs
        this.tileMap.currentMap.npcs.forEach(npc => {
            // Simple AI - random movement
            if (Math.random() < 0.01) {
                const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
                npc.direction = directions[Math.floor(Math.random() * directions.length)];
            }
        });
        
        // Update monsters
        this.tileMap.currentMap.monsters.forEach(monster => {
            // Simple patrol AI
            if (monster.patrolPath && monster.patrolPath.length > 0) {
                const targetPoint = monster.patrolPath[Math.floor(Date.now() / 2000) % monster.patrolPath.length];
                const dx = targetPoint.x - monster.x;
                const dy = targetPoint.y - monster.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0.5) {
                    const moveSpeed = monster.speed * deltaTime * 0.05;
                    monster.x += (dx / distance) * moveSpeed;
                    monster.y += (dy / distance) * moveSpeed;
                }
            }
        });
    }
    
    /**
     * Render game
     */
    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // RENDER DE TESTE - Desenhar fundo azul
        this.ctx.fillStyle = '#87CEEB'; // Sky blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar player como quadrado vermelho
        if (this.player) {
            const playerX = this.player.x * this.TILE_SIZE;
            const playerY = this.player.y * this.TILE_SIZE;
            
            this.ctx.fillStyle = '#FF0000'; // Red
            this.ctx.fillRect(playerX - 10, playerY - 10, 20, 20);
        }
        
        // Render map background
        this.renderMap();
        
        // Render entities
        this.renderEntities();
        
        // Render player
        if (this.player) {
            this.characterRenderer.render(this.player, this.gameTime);
        }
        
        // Render HUD
        this.hudManager.render();
    }
    
    /**
     * Render map background
     */
    renderMap() {
        const mapAsset = this.tileMap.currentMap.asset;
        if (!mapAsset || !mapAsset.loaded) return;
        
        // Draw map image centered
        const mapWidth = this.tileMap.currentMap.width * this.TILE_SIZE;
        const mapHeight = this.tileMap.currentMap.height * this.TILE_SIZE;
        
        const offsetX = (this.canvas.width - mapWidth) / 2;
        const offsetY = (this.canvas.height - mapHeight) / 2;
        
        this.ctx.drawImage(mapAsset.image, offsetX, offsetY);
    }
    
    /**
     * Render all entities
     */
    renderEntities() {
        // Render NPCs
        this.npcRenderer.renderBatch(this.tileMap.currentMap.npcs, this.gameTime);
        
        // Render monsters
        this.monsterRenderer.renderBatch(this.tileMap.currentMap.monsters, this.gameTime);
        
        // Render objects
        this.renderObjects();
    }
    
    /**
     * Render objects
     */
    renderObjects() {
        this.tileMap.currentMap.objects.forEach(object => {
            const x = object.x * this.TILE_SIZE + this.TILE_SIZE / 2;
            const y = object.y * this.TILE_SIZE + this.TILE_SIZE / 2;
            
            // Draw object placeholder
            this.ctx.fillStyle = object.interactive ? '#4CAF50' : '#666';
            this.ctx.fillRect(x - 16, y - 16, 32, 32);
            
            // Draw object icon
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const icons = {
                fountain: '⛲',
                statue: '🗿',
                well: '⛲',
                blacksmith: '🔨',
                ancient_tree: '🌳',
                mushroom_circle: '🍄',
                abandoned_camp: '⛺',
                gate: '🚪',
                watchtower: '🏰',
                crystal: '💎',
                treasure_chest: '📦',
                echo_crystal: '🔮',
                ancient_runes: '📜',
                altar: '⛪',
                sarcophagus: '⚱️',
                throne: '👑',
                treasure_pile: '💰',
                witch_hut: '🏚',
                mystic_stones: '🗿'
            };
            
            const icon = icons[object.type] || '📦';
            this.ctx.fillText(icon, x, y);
            
            // Show interaction hint
            if (object.interactive) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = '12px Arial';
                this.ctx.fillText('!', x + 20, y - 20);
            }
        });
    }
    
    /**
     * Start game loop
     */
    startGameLoop() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.running) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        this.gameTime += deltaTime;
        
        // DEBUG: Game loop status - reduzido para não sobrecarregar
        if (Math.floor(this.gameTime) % 10 === 0) { // A cada 10 segundos
            const activeKeys = Object.keys(this.keys).filter(k => this.keys[k]);
            if (activeKeys.length > 0) {
                console.log(`🎮 Teclas ativas: ${activeKeys.join(',')}`);
            }
        }
        
        // CACHE BUST: Forçar reload
        if (Math.floor(this.gameTime) % 30 === 0) {
            console.log('🔄 Cache bust - Sistema atualizado v0.3.6');
        }
        
        // Update
        this.updatePlayerMovement(deltaTime);
        this.updateEntities(deltaTime);
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Stop game loop
     */
    stop() {
        this.running = false;
        console.log('🛑 Motor do jogo parado');
    }
}

// Initialize game when sprites are ready
window.addEventListener('spritesReady', async () => {
    console.log('🎮 Inicializando motor do jogo...');
    
    const gameEngine = new GameEngine();
    
    // Make game engine available globally
    window.gameEngine = gameEngine;
    
    console.log('✅ Motor do jogo pronto!');
});

// Global instance
window.GameEngine = GameEngine;

export default GameEngine;
