/**
 * Integrated Gameplay Engine - Eldoria
 * Motor de jogo completo do continente de Eldoria
 * Mundo de fantasia medieval com continentes misteriosos
 */

class IntegratedGameplayEngine {
    constructor(canvasId, characterData) {
        this.canvasId = canvasId;
        this.characterData = characterData;
        
        // Configurações do mundo
        this.gameWorld = {
            name: 'Eldoria',
            title: 'Continente de Eldoria',
            lore: 'Mundo de fantasia medieval com continentes misteriosos'
        };

        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas com ID '${canvasId}' não encontrado`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.characterData = characterData;
        
        // Configuração inicial
        this.config = {
            width: 1200,
            height: 800,
            fps: 60,
            tileSize: 32,
            debug: false
        };
        
        // Estado do jogo
        this.isRunning = false;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.actualFPS = 0;
        this.lastTime = 0;
        this.fps = 0;
        this.fpsTime = 0;
        
        // Player - estado consolidado (removido playerStats e progression duplicados)
        this.player = {
            id: characterData?.id || 'player_1',
            name: characterData?.name || 'Player',
            x: characterData?.x || 400,
            y: characterData?.y || 300,
            width: 32,
            height: 32,
            speed: 5,
            hp: characterData?.hp || 100,
            maxHp: characterData?.maxHp || 100,
            mana: characterData?.mana || 50,
            maxMana: characterData?.maxMana || 50,
            level: characterData?.level || 1,
            xp: characterData?.xp || 0,
            totalXp: characterData?.totalXp || 0,
            xpToNext: characterData?.xpToNext || 100,
            gold: characterData?.gold || 0,
            color: '#4CAF50',
            velocity: { x: 0, y: 0 },
            facing: 'down',
            stats: {
                attack: 10,
                defense: 0,
                speed: 1
            }
        };
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        // Entidades
        this.entities = [];
        this.mobs = [];
        this.remotePlayers = [];
        this.items = [];
        this.particles = [];
        
        // Loot e Inventário
        this.lootDrops = [];
        this.inventory = [];
        this.floatingTexts = []; // Textos flutuantes (dano, coleta, etc.)
        
        // Sistema de Combate Melhorado
        this.combatEffects = []; // Efeitos visuais de combate
        this.attackAnimations = []; // Animações de ataque
        this.comboSystem = {
            count: 0,
            lastHitTime: 0,
            window: 2000, // 2 segundos para combo
            multiplier: 1.0
        };
        this.screenShake = {
            active: false,
            intensity: 0,
            duration: 0,
            startTime: 0
        };
        
        // Performance Optimizer
        this.perfOptimizer = null;
        
        // Effects Manager (transições, toasts, dicas)
        this.effectsManager = null;
        
        // Tutorial Manager
        this.tutorialManager = null;
        
        // Inventory Manager
        this.inventoryManager = null;
        this.inventoryUI = null;
        
        // Quest UI
        this.questUI = null;
        
        // Crafting System
        this.craftingManager = null;
        this.craftingUI = null;
        
        // Merchant System
        this.merchantManager = null;
        this.merchantUI = null;
        
        // Trading System
        this.tradeManager = null;
        this.tradeUI = null;
        
        // Loot Drop System
        this.lootDropManager = null;
        
        // Party System
        this.partyManager = null;
        this.partyUI = null;
        
        // Economy System
        this.economyManager = null;
        this.economyUI = null;
        
        // Guild System
        this.guildManager = null;
        this.guildUI = null;
        
        // PvP System
        this.pvpManager = null;
        this.pvpUI = null;
        
        // UI/UX Managers
        this.animationManager = null;
        this.tooltipManager = null;
        this.toastManager = null;
        this.settingsManager = null;
        this.settingsUI = null;
        this.responsiveManager = null;
        this.achievementsUI = null;
        this.zoneSelectorUI = null;
        this.classUI = null;
        
        // Equipamento
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        
        // Quests - consolidado (removido activeQuests vs currentQuest duplicado)
        this.quests = {
            active: [],
            completed: [],
            current: null,
            progress: {
                mobIdRequired: null,
                mobNameRequired: '',
                targetCount: 0,
                currentCount: 0
            }
        };
        
        // NPCs
        this.npcs = [];
        
        // Profissões
        this.professions = {
            mining: { level: 1, xp: 0, xpToNext: 50 }
        };
        
        // Nós de recursos
        this.resourceNodes = [];
        
        // NOVOS SISTEMAS v0.4.0
        this.advancedMobSystem = null;
        this.craftingSystem = null;
        this.partySystem = null;
        this.inventoryUI = null;
        
        // Camera
        this.camera = {
            x: 0,
            y: 0,
            width: this.config.width,
            height: this.config.height,
            followPlayer: true
        };
        
        // Mapa
        this.map = {
            width: 2400,
            height: 1600,
            tiles: [],
            obstacles: []
        };
        
        // Sistemas
        this.systems = {
            hud: null,
            minimap: null,
            network: null,
            ai: null
        };
        
        // HUD Manager
        this.hud = null;
        
        // Sistemas de jogo
        this.zoneSystem = null;
        this.questSystem = null;
        this.npcSystem = null;
        this.currentZone = 'korvien_village';
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎮 Inicializando IntegratedGameplayEngine...');
        
        // Configurar canvas
        this.setupCanvas();
        
        // Inicializar sistemas
        this.setupInput();
        this.setupMap();
        this.setupSystems();
        
        // Conectar ao servidor
        this.connectToServer();
        
        console.log('✅ IntegratedGameplayEngine inicializado');
    }
    
    setupCanvas() {
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
        
        // Estilos
        this.canvas.style.background = '#1a1a1a';
        this.canvas.style.border = '2px solid #333';
        this.canvas.style.cursor = 'crosshair';
        
        // Focar no canvas para input
        this.canvas.tabIndex = 1;
        this.canvas.focus();
    }
    
    setupInput() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleKeyDown(e.key.toLowerCase());
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.handleKeyUp(e.key.toLowerCase());
        });
        
        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.mouse.clicked = true;
            this.handleClick(e);
        });
        
        // Prevenir scroll com setas
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
    
    setupMap() {
        // Gerar mapa simples
        const tilesX = Math.floor(this.map.width / this.config.tileSize);
        const tilesY = Math.floor(this.map.height / this.config.tileSize);
        
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                const tile = {
                    x: x * this.config.tileSize,
                    y: y * this.config.tileSize,
                    width: this.config.tileSize,
                    height: this.config.tileSize,
                    type: 'grass',
                    walkable: true
                };
                
                // Adicionar alguns obstáculos
                if (Math.random() < 0.05) {
                    tile.type = 'rock';
                    tile.walkable = false;
                    this.map.obstacles.push(tile);
                }
                
                this.map.tiles.push(tile);
            }
        }
        
        // Adicionar bordas
        for (let i = 0; i < tilesX; i++) {
            this.map.obstacles.push({
                x: i * this.config.tileSize,
                y: 0,
                width: this.config.tileSize,
                height: this.config.tileSize,
                walkable: false
            });
            this.map.obstacles.push({
                x: i * this.config.tileSize,
                y: (tilesY - 1) * this.config.tileSize,
                width: this.config.tileSize,
                height: this.config.tileSize,
                walkable: false
            });
        }
        
        for (let i = 0; i < tilesY; i++) {
            this.map.obstacles.push({
                x: 0,
                y: i * this.config.tileSize,
                width: this.config.tileSize,
                height: this.config.tileSize,
                walkable: false
            });
            this.map.obstacles.push({
                x: (tilesX - 1) * this.config.tileSize,
                y: i * this.config.tileSize,
                width: this.config.tileSize,
                height: this.config.tileSize,
                walkable: false
            });
        }
    }
    
    setupSystems() {
        // Inicializar HUD Manager (novo sistema)
        if (typeof HUDManager !== 'undefined') {
            this.hud = new HUDManager();
            this.hud.show();
            console.log('✅ HUDManager inicializado');
        }
        
        // HUD System (legado - fallback)
        if (window.hudSystem) {
            this.systems.hud = window.hudSystem;
            this.systems.hud.updatePlayerState({
                name: this.player.name,
                level: this.player.level,
                health: this.player.hp,
                maxHealth: this.player.maxHp,
                mana: this.player.mana,
                maxMana: this.player.maxMana,
                exp: this.player.exp,
                maxExp: this.player.maxExp,
                gold: this.player.gold,
                position: { x: this.player.x, y: this.player.y }
            });
        }
        
        // Minimap
        this.setupMinimap();
        
        // NOVOS: Managers de refatoração MVP (Passo 2)
        this.setupManagers();
        
        // NOVOS SISTEMAS v0.4.0
        this.setupNewSystems();
        
        // NOVOS: Botões de Talentos (BLOCO 13)
        this.setupTalentButtons();
    }
    
    setupManagers() {
        // Inicializar MobManager
        if (typeof MobManager !== 'undefined') {
            this.mobManager = new MobManager(this);
            console.log('✅ MobManager inicializado');
        }
        
        // Inicializar LootManager
        if (typeof LootManager !== 'undefined') {
            this.lootManager = new LootManager(this);
            console.log('✅ LootManager inicializado');
        }
        
        // Inicializar EquipmentManager
        if (typeof EquipmentManager !== 'undefined') {
            this.equipmentManager = new EquipmentManager(this);
            console.log('✅ EquipmentManager inicializado');
        }
    }
    
    setupNewSystems() {
        console.log('🎮 Inicializando novos sistemas v0.4.0...');
        
        // AdvancedMobSystem - Novos tipos de mobs
        if (typeof AdvancedMobSystem !== 'undefined') {
            this.advancedMobSystem = new AdvancedMobSystem(this);
            console.log('✅ AdvancedMobSystem inicializado');
            
            // Spawn mobs iniciais
            this.spawnInitialMobs();
        }
        
        // InventoryUI - Interface de inventário
        if (typeof InventoryUI !== 'undefined') {
            this.inventoryUI = new InventoryUI(this);
            console.log('✅ InventoryUI inicializado');
        }
        
        // CraftingSystem - Sistema de crafting
        if (typeof CraftingSystem !== 'undefined') {
            this.craftingSystem = new CraftingSystem(this);
            console.log('✅ CraftingSystem inicializado');
        }
        
        // PartySystem - Sistema de grupo
        if (typeof PartySystem !== 'undefined') {
            this.partySystem = new PartySystem(this);
            console.log('✅ PartySystem inicializado');
        }
        
        console.log('✅ Todos os sistemas v0.4.0 inicializados');
    }
    
    spawnInitialMobs() {
        if (!this.advancedMobSystem) return;
        
        // Spawn diferentes tipos de mobs
        const spawnConfigs = [
            { type: 'slime', count: 5, x: 200, y: 200, spread: 300 },
            { type: 'goblin', count: 3, x: 600, y: 400, spread: 200 },
            { type: 'wolf', count: 2, x: 800, y: 600, spread: 150 },
            { type: 'skeleton', count: 2, x: 1000, y: 300, spread: 100 },
            { type: 'spider', count: 3, x: 400, y: 800, spread: 200 },
            { type: 'orc', count: 2, x: 1200, y: 500, spread: 150 }
        ];
        
        spawnConfigs.forEach(config => {
            for (let i = 0; i < config.count; i++) {
                const x = config.x + (Math.random() - 0.5) * config.spread;
                const y = config.y + (Math.random() - 0.5) * config.spread;
                this.advancedMobSystem.spawnMob(config.type, x, y);
            }
        });
        
        console.log(`👾 ${this.advancedMobSystem.mobs.length} mobs spawnados inicialmente`);
    }
    
    setupTalentButtons() {
        // Botão para abrir painel de talentos
        const openTalentBtn = document.getElementById('openTalentBtn');
        if (openTalentBtn) {
            openTalentBtn.addEventListener('click', () => {
                this.openTalentPanel();
            });
        }
        
        // Botão para fechar painel de talentos
        const closeTalentBtn = document.getElementById('closeTalentPanel');
        if (closeTalentBtn) {
            closeTalentBtn.addEventListener('click', () => {
                this.closeTalentPanel();
            });
        }
        
        // Solicitar árvore de talentos ao conectar
        if (window.networkManager) {
            window.networkManager.requestTalentTree();
        }
    }
    
    setupMinimap() {
        const minimapCanvas = document.getElementById('minimap');
        if (minimapCanvas) {
            minimapCanvas.width = 150;
            minimapCanvas.height = 150;
            this.systems.minimap = {
                canvas: minimapCanvas,
                ctx: minimapCanvas.getContext('2d')
            };
        }
    }
    
    connectToServer() {
        // Usar NetworkManager centralizado se disponível
        if (window.networkManager) {
            console.log('📡 Usando NetworkManager centralizado');
            this.setupNetworkManagerHandlers();
            return;
        }
        
        // Fallback: conectar diretamente (legado)
        if (window.io) {
            this.socket = io();
            this.setupSocketHandlers();
        } else {
            console.log('📡 Socket.io não disponível - modo offline');
        }
    }
    
    setupNetworkManagerHandlers() {
        if (!window.networkManager) return;
        
        // World init
        window.networkManager.on('worldInit', (data) => {
            console.log('🌍 GameplayEngine: World init recebido', data);
            
            if (data.entities) {
                this.mobs = data.entities.filter(e => e.type === 'mob');
                this.remotePlayers = data.entities.filter(e => e.type === 'player' && e.id !== window.networkManager.getSocketId());
            }
            
            if (data.player) {
                // Atualizar dados do player local
                Object.assign(this.player, data.player);
            }
            
            if (data.world) {
                this.world = { ...this.world, ...data.world };
            }
            
            // Loot e Inventário do world init
            if (Array.isArray(data.lootDrops)) {
                this.lootDrops = data.lootDrops;
                Logger.info('Loot drops carregados:', this.lootDrops.length);
            }
            
            if (Array.isArray(data.inventory)) {
                this.inventory = data.inventory;
                Logger.info('Inventário carregado:', this.inventory.length, 'itens');
                
                if (this.hud && typeof this.hud.updateInventory === 'function') {
                    this.hud.updateInventory(this.inventory);
                }
            }
            
            // NOVO: Progressão do world init
            if (data.progression) {
                this.progression = {
                    level: data.progression.level ?? this.progression.level,
                    xp: data.progression.xp ?? this.progression.xp,
                    xpToNextLevel: data.progression.xpToNextLevel ?? this.progression.xpToNextLevel
                };
                
                // Sincronizar com player
                if (this.player) {
                    this.player.level = this.progression.level;
                }
                
                Logger.info('Progressão carregada:', this.progression);
                
                if (this.hud && typeof this.hud.updateProgression === 'function') {
                    this.hud.updateProgression(this.progression);
                }
            }
            
            // NOVO: Equipamento e Stats do world init
            if (data.equipment) {
                this.equipment = data.equipment;
                Logger.info('Equipamento carregado:', this.equipment);
                
                if (this.hud && typeof this.hud.updateEquipment === 'function') {
                    this.hud.updateEquipment(this.equipment);
                }
            }
            
            if (data.stats) {
                this.playerStats = data.stats;
                Logger.info('Stats carregados:', this.playerStats);
                
                // Aplicar stats ao player
                if (this.player) {
                    this.player.maxHp = data.stats.maxHealth ?? this.player.maxHp;
                    this.player.hp = Math.min(this.player.hp ?? data.stats.maxHealth, data.stats.maxHealth);
                    this.player.attack = data.stats.attack;
                    this.player.defense = data.stats.defense;
                    this.player.speed = data.stats.speed;
                    this.player.level = data.stats.level ?? this.player.level;
                }
                
                if (this.hud && typeof this.hud.updateStatsPanel === 'function') {
                    this.hud.updateStatsPanel(this.playerStats);
                }
            }
            
            // NOVO: Quests do world init
            if (data.quests) {
                this.activeQuests = data.quests.active || [];
                this.completedQuests = data.quests.completed || [];
                Logger.info('Quests carregadas:', this.activeQuests.length, 'ativas,', this.completedQuests.length, 'completadas');
                
                if (this.hud && typeof this.hud.updateQuestLog === 'function') {
                    this.hud.updateQuestLog(this.activeQuests);
                }
            }
            
            // NOVO: Profissões, nós de recursos e crafting do world init
            if (data.professions) {
                this.professions = { ...this.professions, ...data.professions };
                Logger.info('Profissões carregadas:', this.professions);
                
                if (this.hud && typeof this.hud.updateProfessionsPanel === 'function') {
                    this.hud.updateProfessionsPanel(this.professions);
                }
            }
            
            if (Array.isArray(data.resourceNodes)) {
                this.resourceNodes = data.resourceNodes;
                Logger.info('Nós de recursos carregados:', this.resourceNodes.length);
            }
            
            if (Array.isArray(data.craftRecipes)) {
                this.craftRecipes = data.craftRecipes;
                Logger.info('Recipes de crafting carregadas:', this.craftRecipes.length);
                
                if (this.hud && typeof this.hud.initCrafting === 'function' && this.craftRecipes.length > 0) {
                    this.hud.initCrafting(this.craftRecipes, (recipeId) => this.tryCraft(recipeId));
                }
            }
        });
        
        // World updates (delta)
        window.networkManager.on('worldUpdate', (data) => {
            if (data.entities) {
                // Atualizar mobs
                data.entities.forEach(entity => {
                    if (entity.type === 'mob') {
                        const existingMob = this.mobs.find(m => m.id === entity.id);
                        if (existingMob) {
                            Object.assign(existingMob, entity);
                        } else {
                            this.mobs.push(entity);
                        }
                    } else if (entity.type === 'player' && entity.id !== window.networkManager.getSocketId()) {
                        const existingPlayer = this.remotePlayers.find(p => p.id === entity.id);
                        if (existingPlayer) {
                            Object.assign(existingPlayer, entity);
                        } else {
                            this.remotePlayers.push(entity);
                        }
                    }
                });
            }
        });
        
        // Player movement
        window.networkManager.on('playerMoved', (data) => {
            if (data.id !== window.networkManager.getSocketId()) {
                const remotePlayer = this.remotePlayers.find(p => p.id === data.id);
                if (remotePlayer) {
                    remotePlayer.x = data.x;
                    remotePlayer.y = data.y;
                    remotePlayer.facing = data.facing;
                }
            }
        });
        
        // Player join/leave
        window.networkManager.on('playerJoin', (data) => {
            if (data.id !== window.networkManager.getSocketId()) {
                this.remotePlayers.push(data);
                console.log('👤 Player joined:', data.name);
            }
        });
        
        window.networkManager.on('playerLeave', (data) => {
            this.remotePlayers = this.remotePlayers.filter(p => p.id !== data.id);
            console.log('👤 Player left:', data.id);
        });
        
        // Mob events
        window.networkManager.on('mobSpawn', (data) => {
            this.mobs.push(data);
            console.log('👾 Mob spawned:', data.name);
        });
        
        window.networkManager.on('mobDespawn', (data) => {
            this.mobs = this.mobs.filter(m => m.id !== data.id);
            console.log('👾 Mob despawned:', data.id);
        });
        
        // Combat
        window.networkManager.on('combatResult', (data) => {
            if (data.damage && data.targetId === window.networkManager.getSocketId()) {
                this.player.hp = Math.max(0, this.player.hp - data.damage);
                this.showDamage(this.player.x, this.player.y, data.damage);
            }
        });
        
        // Loot
        window.networkManager.on('lootDropCreated', (data) => {
            this.handleLootDropCreated(data);
        });
        
        window.networkManager.on('lootCollected', (data) => {
            this.handleLootCollected(data);
        });
        
        // Inventário
        window.networkManager.on('inventorySync', (data) => {
            this.handleInventorySync(data);
        });
        
        // NOVOS: Equipamento e Stats
        window.networkManager.on('equipmentSync', (data) => {
            if (typeof this.handleEquipmentSync === 'function') {
                this.handleEquipmentSync(data);
            }
        });
        
        window.networkManager.on('playerStatsSync', (data) => {
            if (typeof this.handlePlayerStatsSync === 'function') {
                this.handlePlayerStatsSync(data);
            }
        });
        
        // NOVOS: Progressão (XP/Level)
        window.networkManager.on('playerXpGained', (data) => {
            this.handleXpGained(data);
        });
        
        window.networkManager.on('playerXpGain', (data) => {
            this.handlePlayerXpGain(data);
        });
        
        window.networkManager.on('playerLevelUp', (data) => {
            this.handleLevelUp(data);
        });
        
        window.networkManager.on('playerProgressionSync', (data) => {
            this.handleProgressionSync(data);
        });
        
        // NOVOS: Handlers de Quests
        window.networkManager.on('questList', (data) => {
            this.handleQuestList(data);
        });
        
        window.networkManager.on('questAccepted', (data) => {
            this.handleQuestAccepted(data);
        });
        
        window.networkManager.on('questProgress', (data) => {
            this.handleQuestProgress(data);
        });
        
        window.networkManager.on('questCompleted', (data) => {
            this.handleQuestCompleted(data);
        });
        
        // NOVOS: Quest System v2 Handlers
        window.networkManager.on('questGive', (data) => {
            this.receiveQuest(data);
        });
        
        window.networkManager.on('questProgressSync', (data) => {
            this.syncQuestProgress(data);
        });
        
        window.networkManager.on('questComplete', (data) => {
            this.completeQuest(data);
        });
        
        window.networkManager.on('questReward', (data) => {
            this.handleQuestReward(data);
        });
        
        // NOVOS: Handlers de Talent System (BLOCO 13)
        window.networkManager.on('talentTreeData', (data) => {
            this.handleTalentTreeData(data);
        });
        
        window.networkManager.on('talentSelectResult', (data) => {
            this.handleTalentSelectResult(data);
        });
        
        window.networkManager.on('playerTalentsSync', (data) => {
            this.handlePlayerTalentsSync(data);
        });
        
        window.networkManager.on('talentPointsAvailable', (data) => {
            this.handleTalentPointsAvailable(data);
        });
        
        // NOVOS: Handlers de Profissões e Crafting
        window.networkManager.on('professionGatherResult', (data) => {
            this.handleGatherResult(data);
        });
        
        window.networkManager.on('craftResult', (data) => {
            this.handleCraftResult(data);
        });
    }
    
    setupSocketHandlers() {
        if (!this.socket) return;
        
        this.socket.on('connect', () => {
            console.log('📡 Conectado ao servidor');
            this.socket.emit('player_join', {
                id: this.player.id,
                name: this.player.name,
                x: this.player.x,
                y: this.player.y,
                level: this.player.level
            });
        });
        
        this.socket.on('currentMobs', (mobs) => {
            console.log('👾 Current mobs recebidos:', mobs.length);
            this.mobs = mobs || [];
            this.renderAllMobs();
        });
        
        this.socket.on('mobSpawn', (mob) => {
            console.log('👾 Mob spawn recebido:', mob.name || mob.type);
            this.mobs.push(mob);
            this.renderMob(mob);
        });
        
        this.socket.on('mobUpdate', (mob) => {
            console.log('📊 Mob update recebido:', mob.name || mob.id);
            const existingMob = this.mobs.find(m => m.id === mob.id);
            if (existingMob) {
                Object.assign(existingMob, mob);
                this.updateMobPosition(mob);
            }
        });
        
        this.socket.on('mobRemove', (data) => {
            console.log('💀 Mob remove recebido:', data.id);
            this.mobs = this.mobs.filter(m => m.id !== data.id);
            this.removeMobFromCanvas(data.id);
        });
        
        // NOVOS: Handlers de combate padronizados
        this.socket.on(NET_EVENTS.COMBAT_ATTACK_RESULT, (data) => {
            console.log('⚔️ Resultado de ataque:', data);
            
            if (data.success) {
                // Atualizar HP do mob
                const mob = this.mobs.find(m => m.id === data.targetId);
                if (mob) {
                    mob.hp = data.currentHealth;
                    mob.maxHp = data.maxHealth;
                    
                    // Feedback visual de dano
                    this.showDamage(mob.x + 16, mob.y, data.damage);
                }
                
                // Se matou o mob
                if (data.isDead) {
                    console.log('💀 Mob morto:', data.targetId);
                    
                    // Remover mob
                    this.mobs = this.mobs.filter(m => m.id !== data.targetId);
                    
                    // Mostrar XP ganho
                    if (data.xpGained && this.hud) {
                        this.hud.showDamage(this.player.x, this.player.y - 40, `+${data.xpGained} XP`, false);
                    }
                }
            } else {
                console.log('❌ Ataque falhou:', data.error);
            }
        });
        
        this.socket.on(NET_EVENTS.MOB_DIED, (data) => {
            console.log('💀 Mob morreu:', data.mobName);
            
            // Remover mob da lista
            this.mobs = this.mobs.filter(m => m.id !== data.mobId);
            
            // Se foi o player que matou, mostrar XP
            if (data.killerId === this.socket.id && data.xpGained) {
                console.log('⭐ Você ganhou', data.xpGained, 'XP!');
                this.player.exp = (this.player.exp || 0) + data.xpGained;
                
                // Mostrar XP no HUD
                if (this.hud) {
                    this.hud.showDamage(this.player.x, this.player.y - 40, `+${data.xpGained} XP`, false);
                }
                
                // Verificar level up
                this.checkLevelUp();
            }
        });
        
        this.socket.on(NET_EVENTS.COMBAT_DAMAGE, (data) => {
            // Receber dano
            if (data.targetId === this.socket.id) {
                this.player.hp = Math.max(0, data.currentHealth || (this.player.hp - data.damage));
                console.log('💔 Você recebeu', data.damage, 'de dano! HP:', this.player.hp);
                
                // Som de dano recebido
                if (window.audioManager) {
                    window.audioManager.playSFX('hit');
                }
                
                this.updateHUD();
                this.showDamage(this.player.x, this.player.y, data.damage, false, true);
                
                if (this.player.hp <= 0) {
                    this.handlePlayerDeath();
                }
            }
        });
        
        this.socket.on(NET_EVENTS.PLAYER_LEVEL_UP, (data) => {
            console.log('🎉 Level up! Novo level:', data.newLevel);
            this.player.level = data.newLevel;
            this.player.maxHp = data.newMaxHP;
            this.player.hp = data.newHP;
            this.player.maxExp = data.xpToNext;
            
            if (this.hud) {
                this.hud.showDamage(this.player.x, this.player.y - 60, 'LEVEL UP!', false);
            }
            
            this.updateHUD();
        });
        
        this.socket.on('combat_damage', (data) => {
            if (data.targetId === this.player.id || data.targetId === this.socket.id) {
                this.player.hp = Math.max(0, this.player.hp - data.damage);
                console.log('💔 Player recebeu ' + data.damage + ' de dano! HP: ' + this.player.hp + '/' + this.player.maxHp);
                this.updateHUD();
                this.showDamage(this.player.x, this.player.y, data.damage);
            }
        });
        
        this.socket.on('mobAttack', (data) => {
            if (data.targetId === this.player.id || data.targetId === this.socket.id) {
                this.player.hp = Math.max(0, this.player.hp - data.damage);
                console.log('👹 ' + data.mobName + ' atacou! Dano: ' + data.damage + ' HP: ' + this.player.hp + '/' + this.player.maxHp);
                this.updateHUD();
                this.showDamage(this.player.x, this.player.y, data.damage);
                
                if (this.player.hp <= 0) {
                    console.log('💀 Player derrotado!');
                    this.handlePlayerDeath();
                }
            }
        });
        
        this.socket.on('disconnect', () => {
            console.log('📡 Desconectado do servidor');
        });
    }
    
    start() {
        if (this.isRunning) {
            console.log('⚠️ Jogo já está rodando');
            return;
        }
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        
        // Inicializar sistema de áudio
        if (window.audioManager && !window.audioManager.initialized) {
            window.audioManager.init();
            // Criar UI de controle de volume
            window.audioManager.createVolumeUI();
        }
        
        // Inicializar Performance Optimizer
        if (window.PerformanceOptimizer) {
            this.perfOptimizer = new PerformanceOptimizer(this);
            this.perfOptimizer.init();
        }
        
        // Inicializar Effects Manager
        if (window.EffectsManager) {
            this.effectsManager = new EffectsManager(this.canvas);
            this.effectsManager.init();
            window.effectsManager = this.effectsManager;
        }
        
        // Inicializar Tutorial Manager
        if (window.TutorialManager) {
            this.tutorialManager = new TutorialManager(this);
            this.tutorialManager.init();
        }
        
        // Inicializar Inventory Manager
        if (window.InventoryManager) {
            this.inventoryManager = new InventoryManager(this.playerId || 'player_1');
            this.inventoryManager.init();
            window.inventoryManager = this.inventoryManager;
            
            if (window.InventoryUI) {
                this.inventoryUI = new InventoryUI(this.inventoryManager);
                this.inventoryUI.init();
            }
            
            console.log('🎒 Inventory Manager inicializado');
        }
        
        // Inicializar Quest UI
        if (window.QuestUI) {
            this.questUI = new QuestUI(window.questManager);
            this.questUI.init();
            console.log('📜 Quest UI inicializado');
        }
        
        // Inicializar Crafting System
        if (window.CraftingManager) {
            this.craftingManager = new CraftingManager(this.playerId || 'player_1');
            this.craftingManager.init();
            window.craftingManager = this.craftingManager;
            
            if (window.CraftingUI && this.inventoryManager) {
                this.craftingUI = new CraftingUI(this.craftingManager, this.inventoryManager);
                this.craftingUI.init();
            }
            
            console.log('⚒️ Crafting System inicializado');
        }
        
        // Inicializar Merchant System
        if (window.MerchantManager) {
            this.merchantManager = new MerchantManager();
            this.merchantManager.init(this.inventoryManager, this.inventoryManager);
            window.merchantManager = this.merchantManager;
            
            if (window.MerchantUI && this.inventoryManager) {
                this.merchantUI = new MerchantUI(this.merchantManager, this.inventoryManager);
                this.merchantUI.init();
                window.merchantUI = this.merchantUI;
            }
            
            console.log('🏪 Merchant System inicializado');
            console.log('   - Mercadores:', window.MerchantDatabase ? window.MerchantDatabase.getAll().length : 0);
        }
        
        // Inicializar Trading System
        if (window.TradeManager) {
            this.tradeManager = new TradeManager(this.playerId || 'player_1');
            this.tradeManager.init(this.inventoryManager, this.inventoryManager);
            window.tradeManager = this.tradeManager;
            
            if (window.TradeUI && this.inventoryManager) {
                this.tradeUI = new TradeUI(this.tradeManager, this.inventoryManager);
                this.tradeUI.init();
                window.tradeUI = this.tradeUI;
            }
            
            console.log('🤝 Trading System inicializado');
        }
        
        // Inicializar Loot Drop System
        if (window.LootDropManager) {
            this.lootDropManager = new LootDropManager();
            this.lootDropManager.init(this.inventoryManager);
            window.lootDropManager = this.lootDropManager;
            
            console.log('💰 Loot Drop System inicializado');
            console.log('   - Mobs com tabela de loot:', window.LootDatabase ? Object.keys(window.LootDatabase).length - 5 : 0); // -5 para funções helper
        }
        
        // Inicializar Party System
        if (window.PartyManager) {
            this.partyManager = new PartyManager(this.playerId || 'player_1');
            this.partyManager.init();
            window.partyManager = this.partyManager;
            
            if (window.PartyUI) {
                this.partyUI = new PartyUI(this.partyManager);
                this.partyUI.init();
                window.partyUI = this.partyUI;
            }
            
            console.log('👥 Party System inicializado');
        }
        
        // Inicializar Economy System
        if (window.EconomyManager) {
            this.economyManager = new EconomyManager();
            this.economyManager.init();
            window.economyManager = this.economyManager;
            
            if (window.EconomyUI) {
                this.economyUI = new EconomyUI(this.economyManager);
                this.economyUI.init();
                window.economyUI = this.economyUI;
            }
            
            console.log('💹 Economy System inicializado');
            console.log('   - Itens rastreados:', this.economyManager?.basePrices?.size || 0);
        }
        
        // Inicializar Guild System
        if (window.GuildManager) {
            this.guildManager = new GuildManager(this.playerId || 'player_1');
            this.guildManager.init();
            window.guildManager = this.guildManager;
            
            if (window.GuildUI) {
                this.guildUI = new GuildUI(this.guildManager);
                this.guildUI.init();
                window.guildUI = this.guildUI;
            }
            
            console.log('🏰 Guild System inicializado');
            console.log('   - Guildas disponíveis:', this.guildManager?.guilds?.size || 0);
        }
        
        // Inicializar PvP System
        if (window.PvPManager) {
            this.pvpManager = new PvPManager(this.playerId || 'player_1');
            this.pvpManager.init();
            window.pvpManager = this.pvpManager;
            
            if (window.PvPUI) {
                this.pvpUI = new PvPUI(this.pvpManager);
                this.pvpUI.init();
                window.pvpUI = this.pvpUI;
            }
            
            console.log('⚔️ PvP System inicializado');
            console.log('   - Rating:', this.pvpManager?.myRank?.rating || 1000);
            console.log('   - Título:', this.pvpManager?.myRank?.title || 'Novato');
        }
        
        // Inicializar UI/UX Managers
        if (window.AnimationManager) {
            this.animationManager = new AnimationManager();
            this.animationManager.init();
            window.animationManager = this.animationManager;
            console.log('✨ AnimationManager inicializado');
        }
        
        if (window.TooltipManager) {
            this.tooltipManager = new TooltipManager();
            this.tooltipManager.init();
            window.tooltipManager = this.tooltipManager;
            console.log('💬 TooltipManager inicializado');
            
            // Auto-attach tooltips aos painéis existentes
            setTimeout(() => {
                this.tooltipManager.autoAttach();
            }, 1000);
        }
        
        if (window.ToastManager) {
            this.toastManager = new ToastManager();
            this.toastManager.init();
            window.toastManager = this.toastManager;
            console.log('🍞 ToastManager inicializado');
            
            // Toast de boas-vindas
            setTimeout(() => {
                this.toastManager.info(
                    'Pressione I, Q, C, M, T, P, G ou V para abrir os painéis de jogo',
                    'Dica de Controles',
                    8000
                );
            }, 2000);
        }
        
        // Inicializar Settings
        if (window.SettingsManager) {
            this.settingsManager = new SettingsManager();
            this.settingsManager.init();
            window.settingsManager = this.settingsManager;
            console.log('⚙️ SettingsManager inicializado');
            
            if (window.SettingsUI) {
                this.settingsUI = new SettingsUI(this.settingsManager);
                this.settingsUI.init();
                window.settingsUI = this.settingsUI;
                console.log('⚙️ SettingsUI inicializada (tecla O)');
            }
        }
        
        // Inicializar Responsive Manager
        if (window.ResponsiveManager) {
            this.responsiveManager = new ResponsiveManager();
            this.responsiveManager.init();
            window.responsiveManager = this.responsiveManager;
            console.log('📱 ResponsiveManager inicializado');
            
            // Aplicar responsividade aos painéis existentes
            if (this.inventoryUI) {
                this.responsiveManager.makePanelResponsive(this.inventoryUI.elements?.panel, { sheetMode: true });
            }
            if (this.questUI) {
                this.responsiveManager.makePanelResponsive(this.questUI.elements?.panel, { sheetMode: true });
            }
            if (this.craftingUI) {
                this.responsiveManager.makePanelResponsive(this.craftingUI.elements?.panel, { sheetMode: true });
            }
        }
        
        // Inicializar Achievements UI
        if (window.AchievementsUI) {
            this.achievementsUI = new AchievementsUI(this);
            this.achievementsUI.initialize();
            window.achievementsUI = this.achievementsUI;
            console.log('🏆 AchievementsUI inicializado');
        }
        
        // Inicializar Zone Selector UI
        if (window.ZoneSelectorUI) {
            this.zoneSelectorUI = new ZoneSelectorUI(this);
            this.zoneSelectorUI.initialize();
            this.zoneSelectorUI.setPlayerLevel(this.player?.level || 1);
            window.zoneSelectorUI = this.zoneSelectorUI;
            console.log('🗺️ ZoneSelectorUI inicializado');
        }
        
        // Inicializar Class UI
        if (window.ClassUI) {
            this.classUI = new ClassUI(this);
            this.classUI.initialize();
            window.classUI = this.classUI;
            console.log('⚔️ ClassUI inicializado');
        }
        
        // Transição de entrada
        if (this.effectsManager) {
            this.effectsManager.fadeIn(500);
        }
        
        console.log('🎮 Iniciando gameplay loop');
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        
        // Cancelar animation frame pendente
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        console.log('⏹️ Gameplay loop parado');
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms para evitar spiral
        this.lastTime = currentTime;
        
        // Update performance metrics
        if (this.perfOptimizer) {
            this.perfOptimizer.updateMetrics(deltaTime * 1000);
        }
        
        // Update (com throttling opcional)
        if (!this.perfOptimizer || this.perfOptimizer.shouldUpdate()) {
            this.update(deltaTime);
        }
        
        // Render (com throttling opcional)
        if (!this.perfOptimizer || this.perfOptimizer.shouldRender()) {
            this.render();
        }
        
        // Calcular FPS
        this.frameCount++;
        if (currentTime - this.fpsTime >= 1000) {
            this.fps = this.frameCount;
            this.actualFPS = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = currentTime;
        }
        
        // Próximo frame
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Update player
        this.updatePlayer(deltaTime);
        
        // Update camera
        this.updateCamera();
        
        // Update screen shake (combat effect)
        this.updateScreenShake();
        
        // Update entities
        this.updateEntities(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // NOVO: Atualizar spatial grid para colisões otimizadas
        if (this.perfOptimizer) {
            this.perfOptimizer.updateSpatialGrid();
        }
        
        // NOVO: Update AdvancedMobSystem
        if (this.advancedMobSystem) {
            this.advancedMobSystem.update(deltaTime * 1000, this.player);
        }
        
        // NOVO: Update Tutorial Manager
        if (this.tutorialManager) {
            this.tutorialManager.update();
        }
        
        // NOVO: Update NPCSystem (animações e speech bubbles)
        if (this.npcSystem) {
            this.npcSystem.updateNPCs(deltaTime);
        }
        
        // Update HUD
        this.updateHUD();
        
        // Update minimap
        this.updateMinimap();
        
        // NOVO: Limpeza periódica de recursos (a cada 5 segundos aproximadamente)
        if (this.frameCount % 300 === 0) {
            this.cleanupResources();
        }
        
        // Reset mouse click
        this.mouse.clicked = false;
    }
    
    /**
     * Limpeza periódica de recursos para prevenir memory leaks
     * Chamado a cada ~5 segundos (300 frames @ 60fps)
     */
    cleanupResources() {
        // Limpar loot drops antigos (mais de 5 minutos)
        const now = Date.now();
        const maxLootAge = 300000; // 5 minutos
        if (this.lootDrops && this.lootDrops.length > 0) {
            const beforeCount = this.lootDrops.length;
            this.lootDrops = this.lootDrops.filter(loot => {
                const age = now - (loot.createdAt || now);
                return age < maxLootAge;
            });
            const removed = beforeCount - this.lootDrops.length;
            if (removed > 0) {
                Logger.info(`Cleanup: ${removed} loots antigos removidos`);
            }
        }
        
        // Limpar jogadores remotos inativos (não atualizados há 30 segundos)
        if (this.remotePlayers && this.remotePlayers.length > 0) {
            const maxInactiveTime = 30000; // 30 segundos
            const beforeCount = this.remotePlayers.length;
            this.remotePlayers = this.remotePlayers.filter(player => {
                const lastUpdate = player.lastUpdate || now;
                return (now - lastUpdate) < maxInactiveTime;
            });
            const removed = beforeCount - this.remotePlayers.length;
            if (removed > 0) {
                Logger.info(`Cleanup: ${removed} jogadores remotos inativos removidos`);
            }
        }
        
        // Limpar entities mortas ou inativas
        if (this.entities && this.entities.length > 0) {
            const beforeCount = this.entities.length;
            this.entities = this.entities.filter(entity => {
                // Remover entidades marcadas para deleção ou sem vida
                return !entity.markedForDeletion && (entity.life === undefined || entity.life > 0);
            });
            const removed = beforeCount - this.entities.length;
            if (removed > 0) {
                Logger.info(`Cleanup: ${removed} entities removidas`);
            }
        }
        
        // Forçar garbage collection do LootManager se disponível
        if (this.lootManager && typeof this.lootManager.cleanupOldLoot === 'function') {
            this.lootManager.cleanupOldLoot();
        }
    }
    
    updatePlayer(deltaTime) {
        if (!this.player) {
            console.warn('⚠️ updatePlayer chamado sem player definido');
            return;
        }
        
        // Movement input
        let dx = 0;
        let dy = 0;
        
        if (this.keys['w'] || this.keys['arrowup']) dy = -1;
        if (this.keys['s'] || this.keys['arrowdown']) dy = 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx = -1;
        if (this.keys['d'] || this.keys['arrowright']) dx = 1;
        
        // Normalizar movimento diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        // Calcular nova posição
        const moveSpeed = this.keys['shift'] ? this.player.speed * 1.5 : this.player.speed;
        const deltaX = dx * moveSpeed;
        const deltaY = dy * moveSpeed;
        
        // Verificar colisões com sliding em eixos separados
        this.handleMovementWithSliding(deltaX, deltaY);
        
        // Atualizar facing
        if (dx > 0) this.player.facing = 'right';
        else if (dx < 0) this.player.facing = 'left';
        else if (dy > 0) this.player.facing = 'down';
        else if (dy < 0) this.player.facing = 'up';
        
        // Enviar posição para servidor via NetworkManager
        if (window.networkManager && window.networkManager.isConnected()) {
            if (dx !== 0 || dy !== 0) {
                window.networkManager.sendPlayerMove({
                    x: this.player.x,
                    y: this.player.y,
                    facing: this.player.facing
                });
            }
        }
        // Fallback: socket direto (legado)
        else if (this.socket && (dx !== 0 || dy !== 0)) {
            this.socket.emit('player_move', {
                id: this.player.id,
                x: this.player.x,
                y: this.player.y,
                facing: this.player.facing
            });
        }
        
        // Auto-coleta de loot próximo (quando parado)
        if (dx === 0 && dy === 0) {
            this.tryCollectLoot();
        }
    }
    
    updateCamera() {
        if (!this.player) return;
        
        if (this.camera.followPlayer) {
            this.camera.x = this.player.x - this.camera.width / 2;
            this.camera.y = this.player.y - this.camera.height / 2;
            
            // Limitar ao mapa
            this.camera.x = Math.max(0, Math.min(this.camera.x, this.map.width - this.camera.width));
            this.camera.y = Math.max(0, Math.min(this.camera.y, this.map.height - this.camera.height));
            
            // Aplicar screen shake se ativo
            if (this.screenShake.active) {
                this.camera.x += this.camera.shakeX || 0;
                this.camera.y += this.camera.shakeY || 0;
            }
        }
    }
    
    updateEntities(deltaTime) {
        // Update mobs
        this.mobs.forEach(mob => {
            if (mob.ai) {
                // Simular movimento simples de mobs
                if (Math.random() < 0.01) {
                    mob.x += (Math.random() - 0.5) * 50;
                    mob.y += (Math.random() - 0.5) * 50;
                }
            }
        });
    }
    
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 100 * deltaTime; // Gravidade
            
            return particle.life > 0;
        });
    }
    
    updateHUD() {
        // Atualizar novo HUDManager (único sistema de HUD)
        if (!this.player) {
            console.warn('⚠️ updateHUD chamado sem player definido');
            return;
        }
        
        if (this.hud) {
            this.hud.update(this.player, this.mobs.length, this.fps);
            this.hud.updateMana(this.player.mana, this.player.maxMana);
        }
    }
    
    updateMinimap() {
        if (!this.systems.minimap) return;
        
        const ctx = this.systems.minimap.ctx;
        const canvas = this.systems.minimap.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Escala
        const scale = width / this.map.width;
        
        // Criar máscara circular
        ctx.clearRect(0, 0, width, height);
        
        // Background com gradiente
        const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        bgGradient.addColorStop(0, 'rgba(20, 30, 40, 0.95)');
        bgGradient.addColorStop(1, 'rgba(10, 20, 30, 0.98)');
        ctx.fillStyle = bgGradient;
        ctx.beginPath();
        ctx.arc(width/2, height/2, width/2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Borda decorativa
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width/2, height/2, width/2 - 1, 0, Math.PI * 2);
        ctx.stroke();
        
        // Anel interno
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(width/2, height/2, width/2 - 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Grade sutil
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.1)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const pos = 10 + (i * (width - 20) / 4);
            ctx.beginPath();
            ctx.moveTo(pos, 10);
            ctx.lineTo(pos, height - 10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(10, pos);
            ctx.lineTo(width - 10, pos);
            ctx.stroke();
        }
        
        // Zona atual (se disponível)
        if (this.currentZone) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.currentZone, width/2, 15);
        }
        
        // Área descoberta (simulação de fog of war)
        this.renderDiscoveredArea(ctx, scale, width, height);
        
        // Loot drops (pontos amarelos pequenos)
        this.lootDrops.slice(0, 10).forEach(drop => { // Limitar a 10 para performance
            const x = drop.x * scale;
            const y = drop.y * scale;
            ctx.fillStyle = '#FFD54F';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // NPCs (pontos azuis)
        if (this.npcSystem) {
            for (const [id, npc] of this.npcSystem.npcs) {
                const x = npc.position.x * scale;
                const y = npc.position.y * scale;
                ctx.fillStyle = '#2196F3';
                ctx.beginPath();
                ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Outros jogadores (pontos brancos)
        this.remotePlayers.slice(0, 5).forEach(player => {
            const x = player.x * scale;
            const y = player.y * scale;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Mobs (triângulos vermelhos)
        this.mobs.slice(0, 20).forEach(mob => { // Limitar a 20 para performance
            const x = mob.x * scale;
            const y = mob.y * scale;
            ctx.fillStyle = '#f44336';
            ctx.beginPath();
            ctx.moveTo(x, y - 3);
            ctx.lineTo(x - 2.5, y + 2);
            ctx.lineTo(x + 2.5, y + 2);
            ctx.closePath();
            ctx.fill();
        });
        
        // Player (seta verde com direção)
        if (this.player) {
            const px = this.player.x * scale;
            const py = this.player.y * scale;
            
            // Glow do player
            ctx.shadowColor = '#4CAF50';
            ctx.shadowBlur = 8;
            
            // Direção do player
            const facingAngles = {
                'up': 0,
                'right': Math.PI / 2,
                'down': Math.PI,
                'left': -Math.PI / 2
            };
            const angle = facingAngles[this.player.facing] || 0;
            
            ctx.fillStyle = '#4CAF50';
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(-3, 3);
            ctx.lineTo(0, 1);
            ctx.lineTo(3, 3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            ctx.shadowBlur = 0;
            
            // Círculo ao redor do player
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Viewport (retângulo branco semi-transparente)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            this.camera.x * scale,
            this.camera.y * scale,
            this.camera.width * scale,
            this.camera.height * scale
        );
        
        // Borda circular final (máscara)
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width/2, height/2, width/2 - 1, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    renderDiscoveredArea(ctx, scale, width, height) {
        // Simular áreas descobertas com pontos suaves
        const discoveredPoints = [
            {x: this.player.x, y: this.player.y, radius: 200}
        ];
        
        // Adicionar pontos ao redor de locais importantes
        if (this.npcSystem) {
            for (const [id, npc] of this.npcSystem.npcs) {
                discoveredPoints.push({
                    x: npc.position.x,
                    y: npc.position.y,
                    radius: 100
                });
            }
        }
        
        // Renderizar áreas descobertas com gradiente sutil
        discoveredPoints.forEach(point => {
            const x = point.x * scale;
            const y = point.y * scale;
            const r = point.radius * scale;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
            gradient.addColorStop(0, 'rgba(100, 150, 200, 0.15)');
            gradient.addColorStop(1, 'rgba(100, 150, 200, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    toggleWorldMap() {
        if (!this.worldMapUI) {
            this.createWorldMapUI();
        }
        
        this.worldMapVisible = !this.worldMapVisible;
        this.worldMapUI.style.display = this.worldMapVisible ? 'flex' : 'none';
        
        if (this.worldMapVisible) {
            this.renderWorldMap();
            console.log('🗺️ World Map aberto');
        } else {
            console.log('🗺️ World Map fechado');
        }
    }
    
    createWorldMapUI() {
        // Container do world map
        this.worldMapUI = document.createElement('div');
        this.worldMapUI.id = 'worldMapUI';
        this.worldMapUI.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            flex-direction: column;
        `;
        
        // Título
        const title = document.createElement('h2');
        title.textContent = '🗺️ Mapa do Mundo - Eldoria';
        title.style.cssText = `
            color: #FFD700;
            margin-bottom: 20px;
            font-family: Arial, sans-serif;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        `;
        this.worldMapUI.appendChild(title);
        
        // Canvas do mapa
        this.worldMapCanvas = document.createElement('canvas');
        this.worldMapCanvas.width = 800;
        this.worldMapCanvas.height = 600;
        this.worldMapCanvas.style.cssText = `
            border: 3px solid #4CAF50;
            border-radius: 10px;
            background: #1a1a2e;
            box-shadow: 0 0 30px rgba(76, 175, 80, 0.3);
        `;
        this.worldMapUI.appendChild(this.worldMapCanvas);
        
        // Instruções
        const instructions = document.createElement('p');
        instructions.textContent = 'Pressione M para fechar | Use WASD para mover';
        instructions.style.cssText = `
            color: #aaa;
            margin-top: 15px;
            font-size: 14px;
        `;
        this.worldMapUI.appendChild(instructions);
        
        // Botão fechar
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Fechar Mapa (M)';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        `;
        closeBtn.onclick = () => this.toggleWorldMap();
        this.worldMapUI.appendChild(closeBtn);
        
        document.body.appendChild(this.worldMapUI);
        this.worldMapVisible = false;
    }
    
    renderWorldMap() {
        if (!this.worldMapCanvas) return;
        
        const ctx = this.worldMapCanvas.getContext('2d');
        const width = this.worldMapCanvas.width;
        const height = this.worldMapCanvas.height;
        
        // Escala
        const scaleX = width / this.map.width;
        const scaleY = height / this.map.height;
        
        // Background
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, '#1a1a2e');
        bgGradient.addColorStop(1, '#16213e');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Grid
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= 10; x++) {
            const pos = x * (width / 10);
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, height);
            ctx.stroke();
        }
        for (let y = 0; y <= 10; y++) {
            const pos = y * (height / 10);
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(width, pos);
            ctx.stroke();
        }
        
        // Áreas de interesse (zonas)
        const zones = [
            {name: 'Vila Korvien', x: this.map.width * 0.3, y: this.map.height * 0.3, color: '#4CAF50'},
            {name: 'Floresta Sombria', x: this.map.width * 0.7, y: this.map.height * 0.4, color: '#2E7D32'},
            {name: 'Montanhas Geladas', x: this.map.width * 0.5, y: this.map.height * 0.2, color: '#90CAF9'},
            {name: 'Deserto Ardente', x: this.map.width * 0.8, y: this.map.height * 0.7, color: '#FF9800'},
            {name: 'Cavernas Profundas', x: this.map.width * 0.2, y: this.map.height * 0.6, color: '#5D4037'}
        ];
        
        zones.forEach(zone => {
            const zx = zone.x * scaleX;
            const zy = zone.y * scaleY;
            
            // Área da zona
            ctx.fillStyle = zone.color + '20';
            ctx.beginPath();
            ctx.arc(zx, zy, 50, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = zone.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(zx, zy, 50, 0, Math.PI * 2);
            ctx.stroke();
            
            // Nome da zona
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(zone.name, zx, zy - 60);
        });
        
        // Entidades no mapa mundial
        // Loot
        ctx.fillStyle = '#FFD54F';
        this.lootDrops.forEach(drop => {
            ctx.beginPath();
            ctx.arc(drop.x * scaleX, drop.y * scaleY, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // NPCs
        if (this.npcSystem) {
            for (const [id, npc] of this.npcSystem.npcs) {
                const nx = npc.position.x * scaleX;
                const ny = npc.position.y * scaleY;
                ctx.fillStyle = '#2196F3';
                ctx.beginPath();
                ctx.arc(nx, ny, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.fillText(npc.name, nx, ny - 8);
            }
        }
        
        // Mobs
        ctx.fillStyle = '#f44336';
        this.mobs.forEach(mob => {
            ctx.beginPath();
            ctx.moveTo(mob.x * scaleX, mob.y * scaleY - 4);
            ctx.lineTo(mob.x * scaleX - 3, mob.y * scaleY + 3);
            ctx.lineTo(mob.x * scaleX + 3, mob.y * scaleY + 3);
            ctx.closePath();
            ctx.fill();
        });
        
        // Player
        if (this.player) {
            const px = this.player.x * scaleX;
            const py = this.player.y * scaleY;
            
            // Glow
            ctx.shadowColor = '#4CAF50';
            ctx.shadowBlur = 15;
            
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
            // Label
            ctx.fillStyle = '#4CAF50';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('VOCÊ', px, py - 12);
        }
        
        // Viewport atual
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.camera.x * scaleX,
            this.camera.y * scaleY,
            this.camera.width * scaleX,
            this.camera.height * scaleY
        );
        
        // Legenda
        this.renderWorldMapLegend(ctx, width, height);
    }
    
    renderWorldMapLegend(ctx, width, height) {
        const legendX = width - 150;
        const legendY = 20;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(legendX - 10, legendY - 10, 140, 110);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX - 10, legendY - 10, 140, 110);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Legenda:', legendX, legendY);
        
        const items = [
            {color: '#4CAF50', text: 'Você', y: 20},
            {color: '#f44336', text: 'Mobs', y: 35},
            {color: '#2196F3', text: 'NPCs', y: 50},
            {color: '#FFD54F', text: 'Loot', y: 65},
            {color: '#fff', text: 'Viewport', y: 80}
        ];
        
        items.forEach(item => {
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(legendX + 8, legendY + item.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Arial';
            ctx.fillText(item.text, legendX + 18, legendY + item.y + 3);
        });
    }
    
    render() {
        // Limpar canvas
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // DEBUG: Verificar estado dos assets
        if (this.frameCount % 60 === 0) { // A cada 1 segundo
            const assetsLoaded = window.assetManager && window.assetManager.assets;
            const playerSprite = assetsLoaded ? window.assetManager.assets.get('characters_human_adventurer') : null;
            const mobSprite = assetsLoaded ? window.assetManager.assets.get('monsters_goblin_raider') : null;
            
            console.log('🔍 DEBUG Assets:', {
                assetManager: !!window.assetManager,
                assetsLoaded: !!assetsLoaded,
                playerSprite: !!playerSprite,
                mobSprite: !!mobSprite,
                mobsCount: this.mobs.length,
                entitiesCount: this.entities.length
            });
        }
        
        // Salvar contexto
        this.ctx.save();
        
        // Aplicar transformação da camera
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Renderizar mapa
        this.renderMap();
        
        // Renderizar players remotos
        this.renderRemotePlayers();
        
        // Renderizar entidades
        this.renderEntities();
        
        // Renderizar NPCs (NOVO: com sistema de interação visual)
        if (this.npcSystem) {
            this.npcSystem.renderNPCs(this.ctx, this.camera, this.player?.x, this.player?.y);
        }
        
        // Renderizar mobs
        this.renderMobs();
        
        // Renderizar player
        this.renderPlayer();
        
        // Renderizar loot drops no chão
        this.renderLootDrops();
        
        // NOVO: Renderizar nós de recursos
        this.renderResourceNodes();
        
        // Renderizar partículas
        this.renderParticles();
        
        // NOVO: Renderizar efeitos de combate (swings, flashes, impactos)
        this.renderCombatEffects();
        
        // NOVO: Renderizar AdvancedMobSystem mobs
        if (this.advancedMobSystem) {
            this.advancedMobSystem.render(this.ctx);
        }
        
        // NOVO: Renderizar effects (weather, ambient, screen effects)
        if (this.effectsManager) {
            this.effectsManager.render(this.ctx, this.canvas);
        }
        
        // Restaurar contexto
        this.ctx.restore();
        
        // Renderizar UI (sem transformação)
        this.renderUI();
    }
    
    renderMap() {
        // Renderizar tiles visíveis
        const startX = Math.floor(this.camera.x / this.config.tileSize);
        const startY = Math.floor(this.camera.y / this.config.tileSize);
        const endX = Math.ceil((this.camera.x + this.camera.width) / this.config.tileSize);
        const endY = Math.ceil((this.camera.y + this.camera.height) / this.config.tileSize);
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const tile = this.map.tiles[y * (this.map.width / this.config.tileSize) + x];
                if (!tile) continue;
                
                // Cor baseado no tipo
                switch (tile.type) {
                    case 'grass':
                        this.ctx.fillStyle = '#4a7c59';
                        break;
                    case 'rock':
                        this.ctx.fillStyle = '#666';
                        break;
                    default:
                        this.ctx.fillStyle = '#4a7c59';
                }
                
                this.ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
                
                // Grid lines (debug)
                if (this.config.debug) {
                    this.ctx.strokeStyle = '#333';
                    this.ctx.strokeRect(tile.x, tile.y, tile.width, tile.height);
                }
            }
        }
        
        // Renderizar obstáculos
        this.ctx.fillStyle = '#333';
        this.map.obstacles.forEach(obstacle => {
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
    }
    
    renderRemotePlayers() {
        // Renderizar outros jogadores (multiplayer)
        this.remotePlayers.forEach(remotePlayer => {
            // Não renderizar o próprio jogador
            if (remotePlayer.id === this.player.id) return;
            
            const x = remotePlayer.x || 400;
            const y = remotePlayer.y || 300;
            const width = remotePlayer.width || 32;
            const height = remotePlayer.height || 32;
            
            // Cor azul para players remotos
            this.ctx.fillStyle = '#2196F3';
            this.ctx.fillRect(x, y, width, height);
            
            // Borda mais escura
            this.ctx.strokeStyle = '#0D47A1';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, width, height);
            
            // Nome do jogador
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(remotePlayer.name || 'Player', x + width/2, y - 5);
        });
    }
    
    renderEntities() {
        // Renderizar outras entidades
        this.entities.forEach(entity => {
            this.ctx.fillStyle = entity.color || '#888';
            this.ctx.fillRect(entity.x, entity.y, entity.width || 32, entity.height || 32);
        });
    }
    
    renderMobs() {
        // Renderizar mobs com culling - só renderiza se estiver na tela
        this.mobs.forEach(mob => {
            // Culling: verificar se mob está visível na tela
            if (!this.isOnScreen(mob.x, mob.y, 50)) return;
            
            // Tentar usar sprite do asset manager
            let sprite = null;
            if (window.assetManager && window.assetManager.assets) {
                sprite = window.assetManager.assets.get(`monsters_${mob.type}`);
            }
            
            if (sprite) {
                // Usar sprite real
                this.ctx.drawImage(sprite, mob.x, mob.y, mob.width || 32, mob.height || 32);
            } else {
                // Fallback para cores - ATUALIZADO COM CORES DO SERVIDOR
                const mobColors = {
                    goblin: '#228B22',      // Verde
                    wolf: '#696969',        // Cinza
                    orc: '#8B4513',         // Marrom
                    slime: '#90EE90',       // Verde claro
                    goblin_raider: '#8B4513',
                    dire_wolf: '#696969',
                    mountain_orc: '#556B2F',
                    troll: '#2F4F4F',
                    dragon: '#8B0000'
                };
                
                this.ctx.fillStyle = mob.color || mobColors[mob.type] || '#f44336';
                this.ctx.fillRect(mob.x, mob.y, mob.width || 32, mob.height || 32);
            }
            
            // Nome
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(mob.name || 'Mob', mob.x + 16, mob.y - 5);
            
            // HP bar
            if (mob.hp && mob.maxHp) {
                const hpPercent = mob.hp / mob.maxHp;
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(mob.x, mob.y - 15, 32, 4);
                this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#f44336';
                this.ctx.fillRect(mob.x, mob.y - 15, 32 * hpPercent, 4);
            }
        });
    }
    
    // Métodos auxiliares para renderização de mobs
    renderMob(mob) {
        // Adicionar mob se não existir
        if (!this.mobs.find(m => m.id === mob.id)) {
            this.mobs.push(mob);
        }
        // Forçar renderização completa
        this.render();
    }
    
    updateMobPosition(mob) {
        // Atualizar mob existente
        const existingMob = this.mobs.find(m => m.id === mob.id);
        if (existingMob) {
            // Logar posição para debug
            if (existingMob.x !== mob.x || existingMob.y !== mob.y) {
                console.log(`🏃 ${mob.name} movendo de (${existingMob.x}, ${existingMob.y}) para (${mob.x}, ${mob.y})`);
            }
            Object.assign(existingMob, mob);
        }
        // Forçar renderização completa
        this.render();
    }
    
    removeMobFromCanvas(mobId) {
        // Remover mob da lista
        this.mobs = this.mobs.filter(m => m.id !== mobId);
        // Forçar renderização completa
        this.render();
    }
    
    attackMob(mobId) {
        const mob = this.mobs.find(m => m.id === mobId);
        if (!mob) {
            console.log('❌ Mob não encontrado: ' + mobId);
            return;
        }
        
        // Calcular distância
        const dx = mob.x - this.player.x;
        const dy = mob.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) {
            console.log('❌ Mob muito longe: ' + distance.toFixed(2) + 'px (máximo 100px)');
            return;
        }
        
        // Calcular dano
        const damage = 10 + Math.floor(Math.random() * 10); // 10-20 dano
        
        console.log('⚔️ Atacando ' + mob.name + ' a ' + distance.toFixed(2) + 'px com ' + damage + ' de dano');
        
        // Usar NetworkManager se disponível
        if (window.networkManager && window.networkManager.isConnected()) {
            window.networkManager.sendAttack({
                mobId: mobId,
                damage: damage
            });
        }
        // Fallback: socket direto (legado)
        else if (this.socket) {
            this.socket.emit('attackMob', {
                mobId: mobId,
                damage: damage
            });
        }
        
        // Feedback visual
        this.showDamage(mob.x, mob.y, damage);
    }

        renderAllMobs() {
        // Renderizar todos os mobs
        this.render();
    }
    
    // Funções de Combate
    performAttack() {
        // Encontrar mob mais próximo no alcance
        let nearestMob = null;
        let minDistance = Infinity;
        
        this.mobs.forEach(mob => {
            const dx = mob.x - this.player.x;
            const dy = mob.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Alcance de ataque: 60px
            if (distance <= 60 && distance < minDistance) {
                minDistance = distance;
                nearestMob = mob;
            }
        });
        
        if (nearestMob) {
            console.log('⚔️ Atacando ' + nearestMob.name + ' a ' + minDistance.toFixed(2) + 'px');
            
            // Som de ataque
            if (window.audioManager) {
                window.audioManager.playSFX('attack');
            }
            
            // Animação de ataque visual
            this.createAttackAnimation(
                this.player.x + 16,
                this.player.y + 16,
                nearestMob.x + (nearestMob.width || 32) / 2,
                nearestMob.y + (nearestMob.height || 32) / 2,
                'normal'
            );
            
            // Calcular dano com chance de crítico
            const baseDamage = 10 + Math.floor(Math.random() * 10);
            const isCritical = Math.random() < 0.15; // 15% chance
            const finalDamage = isCritical ? Math.floor(baseDamage * 1.5) : baseDamage;
            
            // NOVO: Usar sistema de combate padronizado
            if (this.socket && this.socket.connected) {
                this.socket.emit(NET_EVENTS.COMBAT_ATTACK, {
                    targetId: nearestMob.id,
                    targetType: 'mob',
                    damage: finalDamage,
                    isCritical
                });
            } else {
                // Modo offline - processar localmente
                console.log('🎮 Modo offline - ataque local');
                this.processOfflineAttack(nearestMob, finalDamage, isCritical);
            }
            
            // Efeitos visuais e sonoros de impacto (com delay para sincronizar com animação)
            setTimeout(() => {
                // Som de hit ou crítico
                if (window.audioManager) {
                    window.audioManager.playSFX(isCritical ? 'crit' : 'hit');
                }
                
                this.spawnHitEffect(
                    nearestMob.x + (nearestMob.width || 32) / 2,
                    nearestMob.y + (nearestMob.height || 32) / 2,
                    isCritical ? '#ff0000' : '#ff6600',
                    isCritical ? 1.5 : 1
                );
                
                // Feedback visual de dano
                this.showDamage(
                    nearestMob.x + 16,
                    nearestMob.y,
                    finalDamage,
                    isCritical,
                    false
                );
                
                // Screen shake em crítico
                if (isCritical) {
                    this.triggerScreenShake(8, 200);
                }
            }, 100);
        } else {
            console.log('❌ Nenhum mob no alcance (60px)');
            // Som de ataque no vazio mesmo assim
            if (window.audioManager) {
                window.audioManager.playSFX('attack');
            }
            // Animação de ataque no vazio (miss)
            const facingAngles = {
                'up': { x: 0, y: -40 },
                'down': { x: 0, y: 40 },
                'left': { x: -40, y: 0 },
                'right': { x: 40, y: 0 }
            };
            const offset = facingAngles[this.player.facing] || { x: 0, y: 40 };
            this.createAttackAnimation(
                this.player.x + 16,
                this.player.y + 16,
                this.player.x + 16 + offset.x,
                this.player.y + 16 + offset.y,
                'normal'
            );
        }
    }
    
    processOfflineAttack(mob, damage = null, isCritical = false) {
        // Calcular dano localmente
        const finalDamage = damage || (10 + Math.floor(Math.random() * 11));
        
        // Aplicar dano
        mob.hp = Math.max(0, (mob.hp || 50) - finalDamage);
        
        console.log(`💥 ${mob.name} recebeu ${finalDamage} de dano! HP: ${mob.hp}/${mob.maxHp || 50}`);
        
        // Verificar se morreu
        if (mob.hp <= 0) {
            this.handleMobDeath(mob);
        }
    }
    
    handleMobDeath(mob) {
        console.log(`☠️ ${mob.name} foi derrotado!`);
        
        // Som de morte
        if (window.audioManager) {
            window.audioManager.playSFX('death');
        }
        
        // Efeitos de morte
        this.spawnHitEffect(
            mob.x + (mob.width || 32) / 2,
            mob.y + (mob.height || 32) / 2,
            '#ff0000',
            2
        );
        
        // Screen shake leve
        this.triggerScreenShake(3, 150);
        
        // Remover mob
        const index = this.mobs.indexOf(mob);
        if (index > -1) {
            this.mobs.splice(index, 1);
        }
        
        // Reportar kill para QuestManager
        if (window.questManager && mob.type) {
            window.questManager.reportKill(mob.type, 1);
        }
        
        // XP e loot
        const xpGained = mob.xp || mob.exp || 10;
        this.player.xp = (this.player.xp || 0) + xpGained;
        
        // Mostrar XP
        if (this.hud) {
            this.hud.showDamage(this.player.x, this.player.y - 40, `+${xpGained} XP`, false);
        }
        
        // Drop de loot usando o novo LootDropManager
        if (this.lootDropManager) {
            const mobLevel = mob.level || 1;
            const luckBonus = this.player?.luck || 0;
            
            this.lootDropManager.generateMobDrops(
                mob.type,
                {
                    x: mob.x + (mob.width || 32) / 2,
                    y: mob.y + (mob.height || 32) / 2
                },
                mobLevel,
                luckBonus
            );
        } else {
            // Fallback: drop simples de gold
            this.createLootDrop({
                x: mob.x + (mob.width || 32) / 2,
                y: mob.y + (mob.height || 32) / 2,
                item: {
                    name: 'Gold',
                    rarity: 'common',
                    quantity: Math.floor(Math.random() * 10) + 5
                }
            });
        }
    }
    
    /**
     * Mostra efeito visual de level up
     * @param {number} newLevel - Novo nível alcançado
     */
    showLevelUpEffect(newLevel) {
        console.log('🎉 LEVEL UP! Novo level:', newLevel);
        
        // Som de level up
        if (window.audioManager) {
            window.audioManager.playSFX('levelup');
        }
        
        // Mostrar no HUD
        if (this.hud) {
            this.hud.showDamage(this.player.x, this.player.y - 60, 'LEVEL UP!', false);
            this.hud.addChatMessage(`LEVEL UP! Agora você é nível ${newLevel}`, '#FFD54F');
        }
        
        // Efeito visual
        this.hitEffects.push({
            x: this.player?.x ?? 0,
            y: (this.player?.y ?? 0) - 40,
            label: 'LEVEL UP!',
            createdAt: performance.now(),
            color: '#FFD54F',
            isLevelUp: true
        });
        
        this.updateHUD();
    }
    
    useSkill(skillIndex) {
        console.log('🎯 Usando skill ' + (skillIndex + 1));
        
        // Skills baseadas no índice
        const skills = [
            { name: 'Fireball', damage: 25, range: 150 },
            { name: 'Heal', healing: 30, range: 0 },
            { name: 'Lightning', damage: 40, range: 200 },
            { name: 'Berserk', damage: 15, range: 80 }
        ];
        
        const skill = skills[skillIndex];
        if (!skill) return;
        
        if (skill.damage) {
            // Skill de dano
            let nearestMob = null;
            let minDistance = Infinity;
            
            this.mobs.forEach(mob => {
                const dx = mob.x - this.player.x;
                const dy = mob.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance && distance < skill.range) {
                    minDistance = distance;
                    nearestMob = mob;
                }
            });
            
            if (nearestMob) {
                console.log('🔥 Usando ' + skill.name + ' em ' + nearestMob.name);
                
                this.socket.emit('attackMob', {
                    mobId: nearestMob.id,
                    damage: skill.damage
                });
                
                this.showDamage(nearestMob.x, nearestMob.y, skill.damage);
                this.showSkillEffect(skill.name, nearestMob.x, nearestMob.y);
            } else {
                console.log('❌ Nenhum mob no alcance da skill ' + skill.range + 'px');
            }
        } else if (skill.healing) {
            // Skill de cura
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + skill.healing);
            console.log('💚 Usando ' + skill.name + ' - curou ' + skill.healing + ' HP');
            this.updateHUD();
            this.showSkillEffect(skill.name, this.player.x, this.player.y);
        }
    }
    
    handlePlayerDeath() {
        console.log('💀 Player died - implementing death mechanics...');
        
        // Som de morte
        if (window.audioManager) {
            window.audioManager.playSFX('death');
        }
        
        // Parar movimento
        this.player.hp = 0;
        this.updateHUD();
        
        // Mostrar tela de morte
        this.showDeathScreen();
        
        // Resetar posição após delay
        setTimeout(() => {
            this.respawnPlayer();
        }, 3000);
    }
    
    showDeathScreen() {
        // Criar overlay de morte
        const deathOverlay = document.createElement('div');
        deathOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        deathOverlay.innerHTML = `
            <div style="text-align: center; padding: 40px; background: rgba(255, 0, 0, 0.8); border-radius: 10px;">
                <h1 style="color: #ff4444; margin-bottom: 20px;">💀 Você Morreu!</h1>
                <p style="margin-bottom: 20px;">Revivindo em 3 segundos...</p>
                <div style="font-size: 14px; color: #ccc;">
                    <p>Perdeu 10% de experiência</p>
                    <p>Volte para o ponto de spawn seguro</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(deathOverlay);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (deathOverlay.parentNode) {
                deathOverlay.parentNode.removeChild(deathOverlay);
            }
        }, 3000);
    }
    
    respawnPlayer() {
        // Resetar jogador
        this.player.hp = this.player.maxHp;
        this.player.mana = Math.floor(this.player.maxMana * 0.5); // 50% de mana
        this.player.x = 400; // Spawn point
        this.player.y = 300;
        
        // Perder experiência
        this.player.exp = Math.max(0, this.player.exp - Math.floor(this.player.maxExp * 0.1));
        
        // Atualizar HUD
        this.updateHUD();
        
        console.log('🔄 Player respawned at (400, 300)');
    }
    
    showDamage(x, y, damage, isCritical = false, isPlayer = false) {
        const time = Date.now();
        
        // Verificar combo
        if (!isPlayer && time - this.comboSystem.lastHitTime < this.comboSystem.window) {
            this.comboSystem.count++;
            this.comboSystem.multiplier = 1 + (this.comboSystem.count * 0.1); // +10% por combo
        } else {
            this.comboSystem.count = 1;
            this.comboSystem.multiplier = 1;
        }
        this.comboSystem.lastHitTime = time;
        
        // Calcular dano final com combo
        const finalDamage = Math.floor(damage * this.comboSystem.multiplier);
        
        // Cor baseada no tipo de dano
        let color = isPlayer ? '#ff4444' : '#ff6600';
        let fontSize = isCritical ? '24px' : '18px';
        
        if (isCritical) {
            color = '#ff0000';
        }
        
        // Mostrar número de dano flutuante
        const damageText = document.createElement('div');
        damageText.textContent = isPlayer ? '-' + finalDamage : finalDamage;
        damageText.style.position = 'absolute';
        damageText.style.left = x + 'px';
        damageText.style.top = (y - 20) + 'px';
        damageText.style.color = color;
        damageText.style.fontSize = fontSize;
        damageText.style.fontWeight = 'bold';
        damageText.style.zIndex = '9999';
        damageText.style.pointerEvents = 'none';
        damageText.style.transition = 'all 1s ease-out';
        damageText.style.textShadow = isCritical ? '0 0 10px #ff0000, 0 0 20px #ff0000' : '2px 2px 4px rgba(0,0,0,0.8)';
        
        // Adicionar indicador de combo
        if (this.comboSystem.count > 1 && !isPlayer) {
            damageText.textContent += ` (x${this.comboSystem.count})`;
        }
        
        document.body.appendChild(damageText);
        
        // Animação mais dinâmica
        setTimeout(() => {
            const randomX = (Math.random() - 0.5) * 30;
            damageText.style.transform = `translate(${randomX}px, -40px) scale(${isCritical ? 1.3 : 1})`;
            damageText.style.opacity = '0';
        }, 50);
        
        // Remover após animação
        setTimeout(() => {
            if (damageText.parentNode) {
                damageText.parentNode.removeChild(damageText);
            }
        }, 1000);
        
        // Adicionar floating text no canvas também
        this.addFloatingText(
            finalDamage.toString(),
            x,
            y,
            color,
            1000,
            false
        );
    }
    
    triggerScreenShake(intensity = 5, duration = 300) {
        this.screenShake = {
            active: true,
            intensity,
            duration,
            startTime: Date.now()
        };
    }
    
    updateScreenShake() {
        if (!this.screenShake.active) return;
        
        const elapsed = Date.now() - this.screenShake.startTime;
        
        if (elapsed >= this.screenShake.duration) {
            this.screenShake.active = false;
            this.camera.shakeX = 0;
            this.camera.shakeY = 0;
            return;
        }
        
        // Decaimento do shake
        const progress = elapsed / this.screenShake.duration;
        const currentIntensity = this.screenShake.intensity * (1 - progress);
        
        this.camera.shakeX = (Math.random() - 0.5) * currentIntensity;
        this.camera.shakeY = (Math.random() - 0.5) * currentIntensity;
    }
    
    spawnHitEffect(x, y, color = '#ff6600', size = 1) {
        // Flash de impacto
        this.combatEffects.push({
            type: 'flash',
            x,
            y,
            radius: 30 * size,
            color,
            life: 10,
            maxLife: 10
        });
        
        // Partículas de impacto
        const particleCount = Math.floor(8 * size);
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 10,
                maxLife: 30,
                color: color,
                size: 2 + Math.random() * 3,
                gravity: 0.2,
                decay: 0.95
            });
        }
        
        // Linhas de impacto (radial)
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            this.combatEffects.push({
                type: 'impactLine',
                x,
                y,
                angle,
                length: 20 * size,
                color,
                life: 15,
                maxLife: 15
            });
        }
    }
    
    createAttackAnimation(attackerX, attackerY, targetX, targetY, type = 'normal') {
        const angle = Math.atan2(targetY - attackerY, targetX - attackerX);
        const distance = Math.hypot(targetX - attackerX, targetY - attackerY);
        
        this.attackAnimations.push({
            type: 'swing',
            startX: attackerX,
            startY: attackerY,
            targetX,
            targetY,
            angle,
            distance,
            weaponType: type,
            life: 20,
            maxLife: 20,
            color: type === 'critical' ? '#ff0000' : '#ffffff'
        });
    }
    
    renderCombatEffects() {
        const time = Date.now();
        
        // Renderizar flash effects
        this.combatEffects = this.combatEffects.filter(effect => {
            effect.life--;
            
            if (effect.life <= 0) return false;
            
            const progress = 1 - (effect.life / effect.maxLife);
            const alpha = 1 - progress;
            
            this.ctx.save();
            
            if (effect.type === 'flash') {
                // Flash circular de impacto
                const gradient = this.ctx.createRadialGradient(
                    effect.x, effect.y, 0,
                    effect.x, effect.y, effect.radius * (1 + progress)
                );
                gradient.addColorStop(0, effect.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
                gradient.addColorStop(1, effect.color + '00');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius * (1 + progress), 0, Math.PI * 2);
                this.ctx.fill();
            } else if (effect.type === 'impactLine') {
                // Linhas radiais de impacto
                this.ctx.strokeStyle = effect.color;
                this.ctx.lineWidth = 2 * (1 - progress);
                this.ctx.globalAlpha = alpha;
                
                const x2 = effect.x + Math.cos(effect.angle) * effect.length * (1 + progress * 0.5);
                const y2 = effect.y + Math.sin(effect.angle) * effect.length * (1 + progress * 0.5);
                
                this.ctx.beginPath();
                this.ctx.moveTo(effect.x, effect.y);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
            return true;
        });
        
        // Renderizar animações de ataque
        this.attackAnimations = this.attackAnimations.filter(anim => {
            anim.life--;
            
            if (anim.life <= 0) return false;
            
            const progress = 1 - (anim.life / anim.maxLife);
            
            this.ctx.save();
            
            if (anim.type === 'swing') {
                // Arco de ataque
                this.ctx.strokeStyle = anim.color;
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = 'round';
                this.ctx.globalAlpha = 1 - progress;
                
                const arcStart = anim.angle - 0.5 + (progress * 0.3);
                const arcEnd = anim.angle + 0.5 - (progress * 0.3);
                const radius = 25 + (progress * 10);
                
                this.ctx.beginPath();
                this.ctx.arc(anim.startX, anim.startY, radius, arcStart, arcEnd);
                this.ctx.stroke();
                
                // Trajectory line
                this.ctx.setLineDash([5, 5]);
                this.ctx.lineWidth = 1;
                this.ctx.globalAlpha = 0.3 * (1 - progress);
                this.ctx.beginPath();
                this.ctx.moveTo(anim.startX, anim.startY);
                this.ctx.lineTo(anim.targetX, anim.targetY);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            
            this.ctx.restore();
            return true;
        });
    }
    
    showSkillEffect(skillName, x, y) {
        // Mostrar efeito visual da skill
        const effect = document.createElement('div');
        effect.textContent = '✨ ' + skillName;
        effect.style.position = 'absolute';
        effect.style.left = (x - 30) + 'px';
        effect.style.top = (y - 40) + 'px';
        effect.style.color = '#ffff00';
        effect.style.fontSize = '14px';
        effect.style.fontWeight = 'bold';
        effect.style.zIndex = '9999';
        effect.style.pointerEvents = 'none';
        effect.style.transition = 'all 1.5s ease-out';
        
        document.body.appendChild(effect);
        
        // Animação
        setTimeout(() => {
            effect.style.transform = 'translateY(-20px) scale(1.5)';
            effect.style.opacity = '0';
        }, 100);
        
        // Remover após animação
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1600);
    }
    
    renderPlayer() {
        if (!this.player) {
            console.warn('⚠️ renderPlayer chamado sem player definido');
            return;
        }
        
        // Tentar usar sprite do personagem
        let playerSprite = null;
        if (window.assetManager && window.assetManager.assets) {
            // Tentar sprite baseado na raça do personagem
            const raceSprites = {
                human: 'characters_human_adventurer',
                elf: 'characters_elf_ranger', 
                dwarf: 'characters_dwarf_guardian'
            };
            const spriteKey = raceSprites[this.characterData.race] || 'characters_human_adventurer';
            playerSprite = window.assetManager.assets.get(spriteKey);
        }
        
        if (playerSprite) {
            // Usar sprite real do personagem
            this.ctx.drawImage(playerSprite, this.player.x, this.player.y, this.player.width, this.player.height);
        } else {
            // Fallback para cor sólida
            const raceColors = {
                human: '#4CAF50',
                elf: '#2196F3', 
                dwarf: '#795548'
            };
            const playerColor = raceColors[this.characterData.race] || '#4CAF50';
            this.ctx.fillStyle = playerColor;
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            
            // Indicador de facing
            this.ctx.fillStyle = '#fff';
            const facingOffsets = {
                up: { x: 16, y: 5 },
                down: { x: 16, y: 27 },
                left: { x: 5, y: 16 },
                right: { x: 27, y: 16 }
            };
            
            const offset = facingOffsets[this.player.facing];
            this.ctx.fillRect(this.player.x + offset.x - 2, this.player.y + offset.y - 2, 4, 4);
        }
        
        // Desenhar nome do jogador
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.player.name, this.player.x + 16, this.player.y - 5);
    }
    
    renderParticles() {
        // Renderizar partículas
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            this.ctx.globalAlpha = 1;
        });
    }
    
    renderUI() {
        // Debug info
        if (this.config.debug) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`FPS: ${this.actualFPS}`, 10, 20);
            this.ctx.fillText(`Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`, 10, 35);
            this.ctx.fillText(`Mobs: ${this.mobs.length}`, 10, 50);
            this.ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, 10, 65);
            this.ctx.fillText(`Collision: ${this.checkCollisionWithAll(this.player.x, this.player.y, this.player.width, this.player.height) ? 'YES' : 'NO'}`, 10, 80);
            this.ctx.fillText('Press F1 to toggle debug', 10, this.canvas.height - 10);
            
            // NOVO: Performance Optimizer debug info
            if (this.perfOptimizer) {
                this.perfOptimizer.renderDebugInfo(this.ctx);
            }
        }
        
        // Debug visual de colisões (sobreposto ao mundo)
        if (this.config.debug && this.player) {
            // Salvar contexto para desenhar no espaço do mundo
            this.ctx.save();
            this.ctx.translate(-this.camera.x, -this.camera.y);
            
            // Hitbox do player (verde = livre, vermelho = colidindo)
            const hitbox = this.getPlayerHitbox();
            const isColliding = this.checkCollisionWithAll(this.player.x, this.player.y, this.player.width, this.player.height);
            this.ctx.strokeStyle = isColliding ? '#ff0000' : '#00ff00';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            
            // Visual hitbox (amarelo - o que o jogador vê)
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
            this.ctx.setLineDash([]);
            
            // Hitboxes de mobs
            this.ctx.strokeStyle = '#ff6600';
            for (const mob of this.mobs.slice(0, 5)) { // Limitar a 5 para não poluir
                this.ctx.strokeRect(mob.x, mob.y, mob.width || 32, mob.height || 32);
            }
            
            // Hitboxes de obstáculos próximos
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            for (const obstacle of this.map.obstacles.slice(0, 20)) {
                if (this.isOnScreen(obstacle.x, obstacle.y, 50)) {
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                }
            }
            
            this.ctx.restore();
        }
    }

    /**
     * Verifica se uma posição está visível na tela (culling)
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {number} margin - Margem extra (padrão: 100px)
     * @returns {boolean} true se estiver visível
     */
    isOnScreen(x, y, margin = 100) {
        return x >= this.camera.x - margin &&
               x <= this.camera.x + this.canvas.width + margin &&
               y >= this.camera.y - margin &&
               y <= this.camera.y + this.canvas.height + margin;
    }

    handleMovementWithSliding(deltaX, deltaY) {
        const hitbox = this.getPlayerHitbox();
        let canMoveX = true;
        let canMoveY = true;
        
        // Tentar mover em X primeiro
        if (deltaX !== 0) {
            const testX = this.player.x + deltaX;
            if (this.checkCollisionWithAll(testX, this.player.y, hitbox.width, hitbox.height)) {
                canMoveX = false;
            }
        }
        
        // Tentar mover em Y depois
        if (deltaY !== 0) {
            const testY = this.player.y + deltaY;
            if (this.checkCollisionWithAll(this.player.x, testY, hitbox.width, hitbox.height)) {
                canMoveY = false;
            }
        }
        
        // Se ambos bloqueados, tentar com posição combinada (canto)
        if (!canMoveX && !canMoveY && deltaX !== 0 && deltaY !== 0) {
            const testX = this.player.x + deltaX;
            const testY = this.player.y + deltaY;
            if (!this.checkCollisionWithAll(testX, testY, hitbox.width, hitbox.height)) {
                canMoveX = true;
                canMoveY = true;
            }
        }
        
        // Aplicar movimento
        if (canMoveX) this.player.x += deltaX;
        if (canMoveY) this.player.y += deltaY;
        
        // Retornar se houve colisão para feedback visual/sonoro
        return { blockedX: !canMoveX && deltaX !== 0, blockedY: !canMoveY && deltaY !== 0 };
    }
    
    getPlayerHitbox() {
        // Hitbox ligeiramente menor que o visual para melhor UX
        const margin = 4;
        return {
            x: this.player.x + margin,
            y: this.player.y + margin,
            width: this.player.width - margin * 2,
            height: this.player.height - margin * 2
        };
    }
    
    checkCollisionWithAll(x, y, width, height) {
        return this.checkObstacleCollision(x, y, width, height) ||
               this.checkEntityCollision(x, y, width, height) ||
               this.checkMapBounds(x, y, width, height);
    }
    
    checkObstacleCollision(x, y, width, height) {
        // Verificar colisão com obstáculos (com pequena margem)
        const buffer = 2;
        for (const obstacle of this.map.obstacles) {
            if (x + buffer < obstacle.x + obstacle.width &&
                x + width - buffer > obstacle.x &&
                y + buffer < obstacle.y + obstacle.height &&
                y + height - buffer > obstacle.y) {
                return true;
            }
        }
        return false;
    }
    
    checkEntityCollision(x, y, width, height) {
        // Verificar colisão com mobs
        for (const mob of this.mobs) {
            if (mob.x < x + width && mob.x + mob.width > x &&
                mob.y < y + height && mob.y + mob.height > y) {
                return true;
            }
        }
        
        // Verificar colisão com NPCs
        for (const npc of this.npcs) {
            if (npc.x < x + width && npc.x + npc.width > x &&
                npc.y < y + height && npc.y + npc.height > y) {
                return true;
            }
        }
        
        // Verificar colisão com outros jogadores
        for (const player of this.remotePlayers) {
            if (player.x < x + width && player.x + (player.width || 32) > x &&
                player.y < y + height && player.y + (player.height || 32) > y) {
                return true;
            }
        }
        
        return false;
    }
    
    checkMapBounds(x, y, width, height) {
        // Verificar limites do mapa com margem
        const margin = 5;
        return x < margin || 
               x + width > this.map.width - margin ||
               y < margin || 
               y + height > this.map.height - margin;
    }
    
    checkCollision(x, y, width, height) {
        // Método legado - manter para compatibilidade
        return this.checkCollisionWithAll(x, y, width, height);
    }
    
    handleKeyDown(key) {
        // Debug toggle
        if (key === 'f1') {
            this.config.debug = !this.config.debug;
            console.log('🔧 Debug mode:', this.config.debug);
        }
        
        // Spawn test mob
        if (key === 'f2' && this.config.debug) {
            this.spawnTestMob();
        }
        
        // Clear mobs
        if (key === 'f3' && this.config.debug) {
            this.mobs = [];
            console.log('🧹 Mobs cleared');
        }
        
        // Attack/Combat
        if (key === ' ') {
            this.performAttack();
        }
        
        // Interagir com E (NPC ou Loot - NPC tem prioridade)
        if (key === 'e') {
            this.handleInteraction();
        }
        
        // Diálogo rápido com F (só NPCs)
        if (key === 'f') {
            this.handleNPCDialog();
        }
        
        // NOVO: World Map com M
        if (key === 'm') {
            this.toggleWorldMap();
        }
        
        // NOVO: Gathering de recursos usando G
        if (key === 'g') {
            this.tryGatherResource();
        }
        
        // Skill 1-4
        if (key >= '1' && key <= '4') {
            this.useSkill(parseInt(key) - 1);
        }
    }
    
    handleKeyUp(key) {
        // Handle key up if needed
    }
    
    handleClick(event) {
        // Converter click para coordenadas do mundo
        const worldX = this.mouse.x + this.camera.x;
        const worldY = this.mouse.y + this.camera.y;
        
        // Criar partícula de clique
        this.createParticle(worldX, worldY, '#4CAF50', 3, 0.5);
        
        // Enviar para servidor
        if (this.socket) {
            this.socket.emit('player_click', {
                x: worldX,
                y: worldY
            });
        }
        
        console.log('🖱️ Click no mundo:', worldX, worldY);
    }
    
    spawnTestMob() {
        // Usar monstros reais configurados no asset manager
        const monsterTypes = ['goblin_raider', 'dire_wolf', 'mountain_orc'];
        const randomType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        
        // Obter configuração do monstro do asset manager
        let monsterConfig = null;
        if (window.assetManager && window.assetManager.monsterConfigs) {
            monsterConfig = window.assetManager.monsterConfigs[randomType];
        }
        
        const testMob = {
            id: `mob_${Date.now()}`,
            name: monsterConfig ? monsterConfig.name : 'Test Mob',
            type: randomType,
            x: this.player.x + (Math.random() - 0.5) * 200,
            y: this.player.y + (Math.random() - 0.5) * 200,
            width: 32,
            height: 32,
            hp: monsterConfig ? monsterConfig.hp : 50,
            maxHp: monsterConfig ? monsterConfig.maxHp : 50,
            level: monsterConfig ? monsterConfig.level || 1 : 1,
            attack: monsterConfig ? monsterConfig.attack : 8,
            defense: monsterConfig ? monsterConfig.defense : 2,
            exp: monsterConfig ? monsterConfig.exp : 15,
            gold: monsterConfig ? monsterConfig.gold : 10,
            ai: true
        };
        
        this.mobs.push(testMob);
        console.log('👾 Test mob spawned:', testMob);
    }
    
    createParticle(x, y, color, size, life) {
        this.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100 - 50,
            color: color,
            size: size,
            life: life
        });
    }
    
    showFloatingText(text, x, y, color = '#ffffff') {
        // Converter coordenadas do mundo para tela
        const screenX = x - this.camera.x;
        const screenY = y - this.camera.y;
        
        const floatingText = document.createElement('div');
        floatingText.textContent = text;
        floatingText.style.cssText = `
            position: absolute;
            left: ${screenX}px;
            top: ${screenY}px;
            color: ${color};
            font-size: 14px;
            font-weight: bold;
            z-index: 9999;
            pointer-events: none;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            animation: floatUp 1.5s ease-out forwards;
        `;
        
        document.body.appendChild(floatingText);
        
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 1500);
    }
    
    createLootDrop(dropData) {
        const newLoot = {
            id: dropData.id || `loot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            x: dropData.x,
            y: dropData.y,
            itemId: dropData.item?.id || dropData.itemId,
            itemName: dropData.item?.name || dropData.itemName || 'Item',
            quantity: dropData.quantity || dropData.item?.quantity || 1,
            rarity: dropData.rarity || dropData.item?.rarity || 'common',
            item: dropData.item,
            collected: false,
            createdAt: Date.now()
        };
        
        this.lootDrops.push(newLoot);
        
        // Efeito de spawn
        this.spawnLootSpawnEffect(newLoot.x, newLoot.y, newLoot.rarity);
        
        Logger.info('Loot drop criado:', newLoot.itemName, `(${newLoot.rarity})`);
    }
    
    spawnLootSpawnEffect(x, y, rarity) {
        // Cores por raridade
        const colors = {
            'common': '#9E9E9E',
            'uncommon': '#4CAF50',
            'rare': '#2196F3',
            'epic': '#9C27B0',
            'legendary': '#FF9800',
            'mythic': '#F44336'
        };
        const color = colors[rarity] || '#FFD54F';
        
        // Partículas de spawn
        const particleCount = rarity === 'legendary' || rarity === 'mythic' ? 20 : 
                             rarity === 'epic' ? 15 : 10;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const speed = 3 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // Ligeiramente para cima
                life: 40,
                maxLife: 40,
                color: color,
                size: 4 + Math.random() * 3,
                gravity: 0.15
            });
        }
        
        // Flash de luz para itens raros
        if (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') {
            this.particles.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                life: 20,
                maxLife: 20,
                color: color,
                size: 50,
                isFlash: true,
                alpha: 0.5
            });
        }
    }
    
    showEffect(effectType, x, y) {
        // Efeitos visuais simples
        const colors = {
            ambush: '#8e44ad',
            enrage: '#e74c3c',
            poison: '#27ae60',
            heal: '#2ecc71'
        };
        
        // Criar partículas para o efeito
        for (let i = 0; i < 8; i++) {
            this.createParticle(
                x + (Math.random() - 0.5) * 40,
                y + (Math.random() - 0.5) * 40,
                colors[effectType] || '#ffffff',
                4,
                0.8
            );
        }
    }
    
    createProjectile(projectileData) {
        // Simplificado - adicionar ao array de projéteis se existir
        if (!this.projectiles) this.projectiles = [];
        
        this.projectiles.push({
            ...projectileData,
            id: `proj_${Date.now()}`,
            currentX: projectileData.x,
            currentY: projectileData.y
        });
    }
    
    onMobKilled(mob, killer) {
        Logger.info('Mob morto:', mob.name, 'por', killer?.name || 'desconhecido');
        
        // Atualizar quests se necessário
        this.activeQuests.forEach(quest => {
            if (quest.objective?.type === 'kill' && quest.objective.target === mob.type) {
                quest.progress = (quest.progress || 0) + 1;
                
                if (quest.progress >= quest.objective.count) {
                    this.showNotification(`Quest "${quest.name}" completada!`, '#f1c40f');
                }
            }
        });
    }
    
    showNotification(message, color = '#3498db') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1003;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    getRandomPositionInZone(zone) {
        // Simplificado - retornar posição aleatória no mapa
        const positions = {
            forest: { x: 200 + Math.random() * 600, y: 200 + Math.random() * 400 },
            cave: { x: 800 + Math.random() * 400, y: 100 + Math.random() * 300 },
            dungeon: { x: 500 + Math.random() * 300, y: 500 + Math.random() * 200 },
            mountain: { x: 100 + Math.random() * 200, y: 600 + Math.random() * 200 },
            graveyard: { x: 900 + Math.random() * 200, y: 700 + Math.random() * 100 },
            road: { x: 400 + Math.random() * 400, y: 300 + Math.random() * 200 },
            volcano: { x: 100 + Math.random() * 150, y: 100 + Math.random() * 150 }
        };
        
        return positions[zone] || positions.forest;
    }
    
    // Simplificação para InventorySystem
    hasItem(itemId, quantity = 1) {
        // Mock - sempre retorna true para crafting funcionar
        return true;
    }
    
    removeItem(itemId, quantity) {
        // Mock - remove do inventário se implementado
        Logger.info(`Removido ${quantity}x ${itemId} do inventário`);
    }
    
    addItem(item) {
        // Mock - adiciona ao inventário
        Logger.info(`Adicionado ${item.name || item.item} ao inventário`);
        this.showNotification(`+${item.name || item.item}`, '#2ecc71');
    }
    
    getEntities() {
        return this.entities;
    }
    
    getMobs() {
        return this.mobs;
    }
    
    getCamera() {
        return this.camera;
    }
    
    checkLevelUp() {
        const xpNeeded = (this.player.level || 1) * 100;
        
        if (this.player.exp >= xpNeeded) {
            this.player.level++;
            this.player.exp -= xpNeeded;
            this.player.maxExp = this.player.level * 100;
            
            // Aumentar stats
            this.player.maxHp += 10;
            this.player.hp = this.player.maxHp;
            this.player.maxMana += 5;
            this.player.mana = this.player.maxMana;
            
            // Delegar efeito visual para método dedicado
            this.showLevelUpEffect(this.player.level);
        }
    }

    // ===== MÉTODOS DE LOOT E INVENTÁRIO =====

    handleLootDropCreated(data) {
        if (!data) return;

        this.lootDrops.push(data);

        Logger.info('Drop criado no chão:', data);

        if (this.hud) {
            this.hud.addChatMessage(`Drop apareceu: ${data.itemName}`, '#81C784');
        }
    }

    handleLootCollected(data) {
        if (!data) return;

        // Remover drop da lista
        if (data.dropId) {
            this.lootDrops = this.lootDrops.filter(drop => drop.id !== data.dropId);
        }

        // Atualizar inventário
        if (Array.isArray(data.inventory)) {
            this.inventory = data.inventory;
        }

        if (this.hud) {
            this.hud.addChatMessage(`Item coletado: ${data.itemName}`, '#4FC3F7');

            if (typeof this.hud.updateInventory === 'function') {
                this.hud.updateInventory(this.inventory);
            }
        }

        Logger.info('Loot coletado:', data);
    }

    handleInventorySync(data) {
        if (!data || !Array.isArray(data.items)) return;

        this.inventory = data.items;

        Logger.info('Inventário sincronizado:', this.inventory);

        if (this.hud && typeof this.hud.updateInventory === 'function') {
            this.hud.updateInventory(this.inventory);
        }
    }

    renderResourceNodes() {
        this.resourceNodes.forEach(node => {
            // Culling: só renderiza se estiver na tela
            if (!this.isOnScreen(node.x, node.y, 50)) return;
            
            this.ctx.save();

            if (node.type === 'mining') {
                this.ctx.fillStyle = '#B0BEC5';
            } else if (node.type === 'herbalism') {
                this.ctx.fillStyle = '#66BB6A';
            } else {
                this.ctx.fillStyle = '#9E9E9E';
            }

            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = '#212121';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Nome do recurso
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(node.name || node.type, node.x, node.y - 14);

            this.ctx.restore();
        });
    }

    renderLootDrops() {
        const time = Date.now();
        
        this.lootDrops.forEach(drop => {
            // Culling: só renderiza se estiver na tela
            if (!this.isOnScreen(drop.x, drop.y, 50)) return;
            
            this.ctx.save();
            
            // Calcular distância do player para efeitos
            let playerDist = Infinity;
            let isNearby = false;
            if (this.player) {
                playerDist = Math.hypot(drop.x - this.player.x, drop.y - this.player.y);
                isNearby = playerDist <= 80;
            }
            
            // Efeito de magnet (puxar quando segura E)
            if (this.keys['e'] && this.player && playerDist < 200 && playerDist > 30) {
                // Direção para o player
                const angle = Math.atan2(this.player.y - drop.y, this.player.x - drop.x);
                const pullStrength = 2;
                drop.x += Math.cos(angle) * pullStrength;
                drop.y += Math.sin(angle) * pullStrength;
            }
            
            // Cor baseada na raridade
            const rarityColors = {
                'common': '#9E9E9E',
                'uncommon': '#4CAF50',
                'rare': '#2196F3',
                'epic': '#9C27B0',
                'legendary': '#FF9800',
                'mythic': '#F44336'
            };
            const color = rarityColors[drop.rarity] || '#FFD54F';
            
            // Efeito de pulso baseado na raridade
            const pulseSpeed = drop.rarity === 'legendary' || drop.rarity === 'mythic' ? 150 : 300;
            const pulse = Math.sin(time / pulseSpeed) * 3;
            
            // Glow externo maior para itens raros
            if (drop.rarity === 'epic' || drop.rarity === 'legendary' || drop.rarity === 'mythic') {
                const glowSize = 15 + pulse;
                const gradient = this.ctx.createRadialGradient(drop.x, drop.y, 5, drop.x, drop.y, glowSize);
                gradient.addColorStop(0, color + '40');
                gradient.addColorStop(1, color + '00');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(drop.x, drop.y, glowSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Brilho externo pulsante
            this.ctx.strokeStyle = color + '80';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(drop.x, drop.y, 12 + pulse, 0, Math.PI * 2);
            this.ctx.stroke();

            // Círculo principal
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(drop.x, drop.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Borda brilhante
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(drop.x, drop.y, 8, 0, Math.PI * 2);
            this.ctx.stroke();

            // Brilho interno
            this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
            this.ctx.beginPath();
            this.ctx.arc(drop.x - 2, drop.y - 2, 3, 0, Math.PI * 2);
            this.ctx.fill();

            // Nome do item (sempre visível se próximo, ou em raridade alta)
            if (isNearby || drop.rarity === 'legendary' || drop.rarity === 'mythic') {
                // Background do texto
                const text = drop.itemName || 'Loot';
                this.ctx.font = isNearby ? 'bold 12px Arial' : '11px Arial';
                const metrics = this.ctx.measureText(text);
                const textWidth = metrics.width + 8;
                const textHeight = 16;
                
                this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                this.ctx.beginPath();
                this.ctx.roundRect(drop.x - textWidth/2, drop.y - 30, textWidth, textHeight, 4);
                this.ctx.fill();
                
                // Texto
                this.ctx.fillStyle = isNearby ? '#FFFFFF' : color;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(text, drop.x, drop.y - 22);
                
                // Quantidade
                if (drop.quantity > 1) {
                    this.ctx.font = 'bold 10px Arial';
                    this.ctx.fillStyle = '#FFD54F';
                    this.ctx.fillText(`x${drop.quantity}`, drop.x + 12, drop.y + 12);
                }
            }
            
            // Indicador "Pressione E" para loot próximo
            if (isNearby && !this.keys['e']) {
                const bounce = Math.sin(time / 200) * 2;
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillText('[E]', drop.x, drop.y - 38 + bounce);
            }

            this.ctx.restore();
        });
        
        // Renderizar floating texts de coleta
        this.renderFloatingTexts();
    }
    
    renderFloatingTexts() {
        const time = Date.now();
        
        this.floatingTexts = this.floatingTexts.filter(ft => {
            const age = time - ft.startTime;
            return age < ft.duration;
        });
        
        this.floatingTexts.forEach(ft => {
            const age = time - ft.startTime;
            const progress = age / ft.duration;
            const yOffset = -progress * 40; // Sobe 40px
            const alpha = 1 - progress;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.font = ft.isLoot ? 'bold 14px Arial' : '12px Arial';
            this.ctx.fillStyle = ft.color;
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
            this.ctx.shadowBlur = 3;
            this.ctx.fillText(ft.text, ft.x, ft.y + yOffset);
            this.ctx.restore();
        });
    }
    
    addFloatingText(text, x, y, color = '#FFFFFF', duration = 1500, isLoot = false) {
        this.floatingTexts.push({
            text,
            x,
            y,
            color,
            startTime: Date.now(),
            duration,
            isLoot
        });
    }

    tryCollectLoot() {
        if (!this.player || !Array.isArray(this.lootDrops)) return;

        const range = 60; // Aumentado de 50 para 60
        let nearest = null;
        let nearestDistance = Infinity;

        for (const drop of this.lootDrops) {
            const dx = drop.x - this.player.x;
            const dy = drop.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= range && dist < nearestDistance) {
                nearest = drop;
                nearestDistance = dist;
            }
        }

        if (!nearest) return;

        // Usar LootManager se disponível
        if (this.lootManager && typeof this.lootManager.tryCollectLoot === 'function') {
            const result = this.lootManager.tryCollectLoot(nearest.id, this.player.id);
            if (result.success) {
                this.onLootCollectedLocally(result.item);
            }
            return;
        }

        // Fallback: networkManager
        if (window.networkManager && window.networkManager.isConnected()) {
            window.networkManager.collectLoot({
                playerId: this.player.id,
                dropId: nearest.id
            });

            Logger.info('Tentativa de coleta enviada:', nearest.id);
        } else {
            // Modo offline: coletar diretamente
            this.collectLootOffline(nearest);
        }
    }
    
    collectLootOffline(loot) {
        // Remover do chão
        this.lootDrops = this.lootDrops.filter(d => d.id !== loot.id);
        
        // Adicionar ao inventário
        this.inventory.push({
            id: loot.itemId || loot.item?.id || `item_${Date.now()}`,
            name: loot.itemName || loot.item?.name || 'Item',
            quantity: loot.quantity || 1,
            rarity: loot.rarity || 'common'
        });
        
        // Efeitos visuais
        this.onLootCollectedLocally(loot);
        
        // Log
        Logger.info('Loot coletado (offline):', loot.itemName);
    }
    
    onLootCollectedLocally(item) {
        // Som de coleta
        if (window.audioManager) {
            window.audioManager.playSFX('collect');
        }
        
        // Adicionar ao inventário (ou gold)
        if (this.inventoryManager) {
            const itemName = item.itemName || item.name || '';
            
            if (itemName.toLowerCase() === 'gold' || item.type === 'currency') {
                // É gold - adicionar diretamente
                this.inventoryManager.addGold(item.quantity || item.amount || 1);
                if (this.inventoryUI && this.inventoryUI.visible) {
                    this.inventoryUI.render();
                }
            } else {
                // É um item normal
                const result = this.inventoryManager.addItem(item, item.quantity || 1, 'loot');
                
                if (!result.success && result.reason === 'inventory_full') {
                    if (this.effectsManager) {
                        this.effectsManager.showToast('Inventário cheio!', '⚠️', '#ff4444');
                    }
                }
                
                if (this.inventoryUI && this.inventoryUI.visible) {
                    this.inventoryUI.render();
                }
            }
        }
        
        // Texto flutuante
        const rarityColors = {
            'common': '#9E9E9E',
            'uncommon': '#4CAF50',
            'rare': '#2196F3',
            'epic': '#9C27B0',
            'legendary': '#FF9800',
            'mythic': '#F44336'
        };
        const color = rarityColors[item.rarity] || '#FFD54F';
        
        // Posição do player ou do loot
        const x = this.player ? this.player.x : item.x;
        const y = this.player ? this.player.y - 20 : item.y;
        
        // Adicionar texto flutuante
        this.addFloatingText(
            `+${item.quantity || 1} ${item.itemName || item.name}`,
            x,
            y,
            color,
            2000,
            true
        );
        
        // Notificação
        this.showNotification(`+${item.quantity || 1} ${item.itemName || item.name}`, color);
        
        // Partículas de coleta
        this.spawnCollectParticles(x, y, color);
    }
    
    spawnCollectParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30,
                maxLife: 30,
                color: color,
                size: 3 + Math.random() * 2
            });
        }
    }

    // Manual loot collection with key E
    manualCollectLoot() {
        Logger.info('Tecla E pressionada - tentando coletar loot');
        this.tryCollectLoot();
    }

    // ===== MÉTODOS DE EQUIPAMENTO E STATS =====

    handleEquipmentSync(data) {
        if (!data || !data.equipment) return;

        this.equipment = data.equipment;

        Logger.info('Equipamento sincronizado', this.equipment);

        if (this.hud && typeof this.hud.updateEquipment === 'function') {
            this.hud.updateEquipment(this.equipment);
        }
    }

    handlePlayerStatsSync(data) {
        if (!data || !data.stats) return;

        this.playerStats = data.stats;

        if (this.player) {
            this.player.maxHp = data.stats.maxHealth ?? this.player.maxHp;
            this.player.hp = Math.min(this.player.hp ?? data.stats.maxHealth, data.stats.maxHealth);
            this.player.attack = data.stats.attack;
            this.player.defense = data.stats.defense;
            this.player.speed = data.stats.speed;
            this.player.level = data.stats.level ?? this.player.level;
        }

        Logger.info('Stats sincronizados', this.playerStats);

        if (this.hud && typeof this.hud.updateStatsPanel === 'function') {
            this.hud.updateStatsPanel(this.playerStats);
        }
    }

    equipInventoryItem(itemId) {
        if (!itemId || !window.networkManager || !this.player) return;

        window.networkManager.equipItem({
            playerId: this.player.id,
            itemId
        });

        Logger.info('Solicitação para equipar item', itemId);
    }

    unequipSlot(slot) {
        if (!slot || !window.networkManager || !this.player) return;

        window.networkManager.unequipItem({
            playerId: this.player.id,
            slot
        });

        Logger.info('Solicitação para desequipar slot', slot);
    }

    // ===== MÉTODOS DE PROGRESSÃO (XP/LEVEL) =====

    handleProgressionSync(data) {
        if (!data) return;

        this.progression = {
            level: data.level ?? this.progression.level ?? 1,
            xp: data.xp ?? this.progression.xp ?? 0,
            xpToNextLevel: data.xpToNextLevel ?? this.progression.xpToNextLevel ?? 100
        };

        if (this.player) {
            this.player.level = this.progression.level;
        }

        Logger.info('Progressão sincronizada', this.progression);

        if (this.hud && typeof this.hud.updateProgression === 'function') {
            this.hud.updateProgression(this.progression);
        }

        if (this.hud && typeof this.hud.updateStatsPanel === 'function' && this.playerStats) {
            this.hud.updateStatsPanel(this.playerStats);
        }
    }

    handleXpGained(data) {
        if (!data) return;

        // Consolidado: usar player.exp como fonte única de verdade
        const gainedXp = data.gainedXp || data.amount || 0;
        if (gainedXp > 0) {
            this.player.exp = (this.player.exp || 0) + gainedXp;
            
            Logger.info('XP recebido:', gainedXp);
            
            if (this.hud) {
                this.hud.addChatMessage(`+${gainedXp} XP`, '#64B5F6');
            }
            
            // Usar checkLevelUp como único sistema de level up
            this.checkLevelUp();
        }
    }

    handleLevelUp(data) {
        if (!data) return;

        this.progression.level = data.level ?? this.progression.level;
        this.progression.xp = data.xp ?? this.progression.xp;
        this.progression.xpToNextLevel = data.xpToNextLevel ?? this.progression.xpToNextLevel;

        if (this.player) {
            this.player.level = this.progression.level;
        }

        Logger.info('Level up recebido', data);

        if (this.hud) {
            this.hud.addChatMessage(`LEVEL UP! Agora você é nível ${this.progression.level}`, '#FFD54F');

            if (typeof this.hud.updateProgression === 'function') {
                this.hud.updateProgression(this.progression);
            }
        }

        // Efeito visual de level up
        this.hitEffects.push({
            x: this.player?.x ?? 0,
            y: (this.player?.y ?? 0) - 40,
            label: 'LEVEL UP!',
            createdAt: performance.now(),
            color: '#FFD54F',
            isLevelUp: true
        });
        
        // NOVOS: Verificar pontos de talento ao subir de nível (BLOCO 13)
        this.checkTalentPointsOnLevelUp();
    }

    // ===== MÉTODO DE GANHO DE XP =====

    handlePlayerXpGain(data) {
        if (!data) return;

        // Consolidado: delegar para checkLevelUp como único sistema
        const gained = data.gained || 0;
        if (gained > 0) {
            this.player.exp = (this.player.exp || 0) + gained;
            
            if (this.hud) {
                this.hud.addChatMessage(`+${gained} XP`, '#64B5F6');
            }
            
            this.checkLevelUp();
        }
        
        // Atualizar playerStats para compatibilidade
        this.playerStats.xp = this.player.exp;
        this.playerStats.xpToNext = this.player.level * 100;
        this.playerStats.level = this.player.level;
        
        Logger.info('XP ganho consolidado', data);
    }

    // ===== MÉTODOS DE QUEST =====

    handleQuestList(data) {
        if (!data) return;
        this.availableQuests = data.available || [];
        Logger.info('Quests disponíveis recebidas', this.availableQuests);
    }

    handleQuestAccepted(data) {
        if (!data) return;
        this.activeQuests = data.active || this.activeQuests;
        Logger.info('Quest aceita', data);

        if (this.hud && typeof this.hud.updateQuestLog === 'function') {
            this.hud.updateQuestLog(this.activeQuests);
        }

        if (this.hud && data.questTitle) {
            this.hud.addChatMessage(`Quest aceita: ${data.questTitle}`, '#81C784');
        }
    }

    handleQuestProgress(data) {
        if (!data || !data.questId) return;

        const quest = this.activeQuests.find(q => q.id === data.questId);
        if (!quest) return;

        quest.progress = data.progress ?? quest.progress;
        quest.currentCount = data.currentCount ?? quest.currentCount;

        Logger.info('Quest progress', data.questId, quest.progress);

        if (this.hud && typeof this.hud.updateQuestLog === 'function') {
            this.hud.updateQuestLog(this.activeQuests);
        }

        // Mostrar progresso no chat
        if (this.hud && data.progressText) {
            this.hud.addChatMessage(`Progresso: ${data.progressText}`, '#64B5F6');
        }
    }

    handleQuestCompleted(data) {
        if (!data) return;

        this.activeQuests = data.active || this.activeQuests;
        this.completedQuests = data.completed || this.completedQuests;

        Logger.info('Quest completada', data);

        if (this.hud) {
            this.hud.addChatMessage(`Quest completada: ${data.questTitle || 'Quest'}`, '#FFEE58');

            if (typeof this.hud.updateQuestLog === 'function') {
                this.hud.updateQuestLog(this.activeQuests);
            }
        }
    }

    interactWithNearestQuestGiver() {
        if (!this.player || !Array.isArray(this.npcs)) return;

        const range = 60;
        let nearest = null;
        let nearestDistance = Infinity;

        for (const npc of this.npcs) {
            if (npc.type !== 'quest_giver') continue;

            const dx = npc.x - this.player.x;
            const dy = npc.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= range && dist < nearestDistance) {
                nearest = npc;
                nearestDistance = dist;
            }
        }

        if (!nearest) return;

        // Solicitar lista de quests do servidor
        window.networkManager.requestQuestList({
            npcId: nearest.id,
            playerId: this.player.id
        });

        Logger.info('Interagindo com quest giver', nearest.id);
    }

    acceptQuestFromHUD(questId) {
        if (!questId || !this.player) return;

        window.networkManager.acceptQuest({
            playerId: this.player.id,
            questId
        });

        Logger.info('Aceitando quest via HUD', questId);
    }

    // ===== MÉTODOS DE PROFISSÕES E GATHERING =====

    tryGatherResource() {
        if (!this.player || !Array.isArray(this.resourceNodes) || !window.networkManager) return;

        const range = 50;
        let nearest = null;
        let nearestDistance = Infinity;

        for (const node of this.resourceNodes) {
            const dx = node.x - this.player.x;
            const dy = node.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= range && dist < nearestDistance) {
                nearest = node;
                nearestDistance = dist;
            }
        }

        if (!nearest) {
            if (this.hud) this.hud.addChatMessage('Nenhum recurso próximo para coletar.', '#B0BEC5');
            return;
        }

        window.networkManager.requestGather({
            playerId: this.player.id,
            nodeId: nearest.id
        });

        Logger.info('Solicitação de gathering enviada', nearest.id);
    }

    handleGatherResult(data) {
        if (!data) return;

        // Ex: { success: true, nodeId, removedNode: true, itemGained, inventory, profession }
        if (data.removedNode && data.nodeId) {
            this.resourceNodes = this.resourceNodes.filter(node => node.id !== data.nodeId);
        }

        if (Array.isArray(data.inventory)) {
            this.inventory = data.inventory;
        }

        if (data.profession && this.professions[data.profession.name]) {
            this.professions[data.profession.name] = {
                ...this.professions[data.profession.name],
                ...data.profession
            };
        }

        if (this.hud) {
            if (data.success) {
                this.hud.addChatMessage(`Você coletou: ${data.itemGained?.name || 'recurso'}`, '#AED581');
            } else {
                this.hud.addChatMessage(data.message || 'Falha ao coletar recurso.', '#EF9A9A');
            }

            if (typeof this.hud.updateInventory === 'function' && Array.isArray(this.inventory)) {
                this.hud.updateInventory(this.inventory);
            }
            if (typeof this.hud.updateProfessionsPanel === 'function') {
                this.hud.updateProfessionsPanel(this.professions);
            }
        }

        Logger.info('Resultado de gathering recebido', data);
    }

    // ===== MÉTODOS DE CRAFTING =====

    tryCraft(recipeId) {
        if (!recipeId || !window.networkManager || !this.player) return;

        window.networkManager.requestCraft({
            playerId: this.player.id,
            recipeId
        });

        Logger.info('Solicitação de crafting enviada', recipeId);
    }

    handleCraftResult(data) {
        if (!data) return;

        if (Array.isArray(data.inventory)) {
            this.inventory = data.inventory;
        }

        if (this.hud) {
            if (data.success) {
                this.hud.showCraftMessage(`Crafted: ${data.itemCreated?.name || 'item'}`, true);
                this.hud.addChatMessage(`Crafted: ${data.itemCreated?.name || 'item'}`, '#FFCC80');
            } else {
                this.hud.showCraftMessage(data.message || 'Craft falhou.', false);
            }

            if (typeof this.hud.updateInventory === 'function' && Array.isArray(this.inventory)) {
                this.hud.updateInventory(this.inventory);
            }
        }

        Logger.info('Resultado de craft recebido', data);
    }

    // ===== MÉTODOS DE QUEST V2 =====

    receiveQuest(questData) {
        if (!questData) return;

        this.currentQuest = questData;

        // Quest do tipo "mate X mobs de tipo Y"
        if (questData.type === 'kill') {
            this.questProgress = {
                mobIdRequired: questData.mobId,
                mobNameRequired: questData.mobName || 'Unknown',
                targetCount: questData.target ?? 0,
                currentCount: 0
            };
        }

        Logger.info('Nova quest recebida', this.currentQuest);

        if (this.hud && typeof this.hud.updateQuestPanel === 'function') {
            this.hud.updateQuestPanel(this.currentQuest, this.questProgress);
        }

        if (this.hud) {
            this.hud.addChatMessage(`Nova quest: ${questData.title}`, '#FFCC80');
        }
    }

    syncQuestProgress(progressData) {
        if (!progressData || !this.currentQuest) return;

        // Esperado: { questId, mobId, currentCount, targetCount }
        if (progressData.questId === this.currentQuest.id) {
            this.questProgress = {
                mobIdRequired: progressData.mobId ?? this.questProgress.mobIdRequired,
                mobNameRequired: progressData.mobName ?? this.questProgress.mobNameRequired,
                targetCount: progressData.targetCount ?? this.questProgress.targetCount,
                currentCount: progressData.currentCount ?? this.questProgress.currentCount
            };
        }

        Logger.info('Progresso de quest sincronizado', this.questProgress);

        if (this.hud) {
            this.hud.updateQuestPanel(this.currentQuest, this.questProgress);
        }
    }

    completeQuest(completionData) {
        if (!completionData || !this.currentQuest) return;

        // Esperado: { questId, xpReward, lootReward }
        const { questId } = completionData;

        if (questId === this.currentQuest.id) {
            // Indicar que a quest acabou
            this.currentQuest = null;
            this.questProgress = { mobIdRequired: null, mobNameRequired: '', targetCount: 0, currentCount: 0 };
        }

        Logger.info('Quest completada', completionData);

        if (this.hud) {
            this.hud.addChatMessage(`QUEST COMPLETA: ${completionData.title}`, '#81C784');

            if (completionData.xpReward && completionData.xpReward > 0) {
                this.hud.addChatMessage(`+${completionData.xpReward} XP`, '#64B5F6');
            }

            if (completionData.lootRewardName) {
                const quantity = completionData.lootRewardQuantity ?? 1;
                this.hud.addChatMessage(`Recompensa: ${quantity}x ${completionData.lootRewardName}`, '#FFD54F');
            }

            if (typeof this.hud.updateQuestPanel === 'function') {
                this.hud.updateQuestPanel(null, null);
            }
        }
    }

    handleQuestReward(data) {
        if (!data) return;

        Logger.info('Recompensa de quest recebida', data);

        // Esperado: { questId, title, xp, coins, items }
        if (this.hud) {
            if (data.xp && data.xp > 0) {
                this.hud.addChatMessage(`+${data.xp} XP (Quest)`, '#FFB74D');
            }

            if (data.coins && data.coins > 0) {
                this.hud.addChatMessage(`+${data.coins} moedas`, '#FFF176');
            }

            if (Array.isArray(data.items) && data.items.length > 0) {
                data.items.forEach(item => {
                    this.hud.addChatMessage(`Recompensa de item: ${item.name || item.id}`, '#81C784');
                });
            }
        }
    }

    // ===== MÉTODOS DE TALENT SYSTEM (BLOCO 13) =====

    handleTalentTreeData(data) {
        if (!data || !data.success) {
            Logger.warn('Falha ao carregar árvore de talentos:', data?.error);
            return;
        }

        Logger.info('Árvore de talentos recebida:', data.className);
        this.talentTree = data.tree;
        this.playerTalents = data.playerTalents || [];
        this.availableTalentPoints = data.availablePoints || 0;

        // Mostrar botão de talentos se houver pontos disponíveis
        const openTalentBtn = document.getElementById('openTalentBtn');
        const talentBtnBadge = document.getElementById('talentBtnBadge');
        
        if (openTalentBtn && this.availableTalentPoints > 0) {
            openTalentBtn.style.display = 'flex';
            if (talentBtnBadge) {
                talentBtnBadge.textContent = this.availableTalentPoints;
                talentBtnBadge.style.display = 'block';
            }
        }

        // Atualizar painel se estiver aberto
        this.renderTalentPanel();
    }

    handleTalentSelectResult(data) {
        if (!data) return;

        if (data.success) {
            Logger.info('Talento adquirido:', data.talentId);
            
            if (this.hud) {
                this.hud.addChatMessage(`🌟 Talento adquirido!`, '#FFD700');
            }

            // Recarregar árvore de talentos
            if (window.networkManager) {
                window.networkManager.requestTalentTree();
            }
        } else {
            Logger.warn('Falha ao adquirir talento:', data.error);
            
            if (this.hud) {
                this.hud.addChatMessage(`❌ ${data.error || 'Não foi possível adquirir o talento'}`, '#FF5252');
            }
        }
    }

    handlePlayerTalentsSync(data) {
        if (!data) return;

        this.playerTalents = data.talents || [];
        this.availableTalentPoints = data.availablePoints || 0;

        // Atualizar badge do botão
        const talentBtnBadge = document.getElementById('talentBtnBadge');
        const openTalentBtn = document.getElementById('openTalentBtn');
        
        if (talentBtnBadge) {
            talentBtnBadge.textContent = this.availableTalentPoints;
            talentBtnBadge.style.display = this.availableTalentPoints > 0 ? 'block' : 'none';
        }

        if (openTalentBtn) {
            openTalentBtn.style.display = this.availableTalentPoints > 0 ? 'flex' : 'none';
        }

        // Atualizar painel se estiver aberto
        this.renderTalentPanel();
    }

    handleTalentPointsAvailable(data) {
        if (!data) return;

        this.availableTalentPoints = data.points || 0;

        // Mostrar notificação
        if (this.hud && this.availableTalentPoints > 0) {
            this.hud.addChatMessage(`🌟 Você tem ${this.availableTalentPoints} ponto(s) de talento disponível!`, '#FFD700');
        }

        // Mostrar botão de talentos
        const openTalentBtn = document.getElementById('openTalentBtn');
        const talentBtnBadge = document.getElementById('talentBtnBadge');
        
        if (openTalentBtn) {
            openTalentBtn.style.display = this.availableTalentPoints > 0 ? 'flex' : 'none';
        }
        
        if (talentBtnBadge) {
            talentBtnBadge.textContent = this.availableTalentPoints;
            talentBtnBadge.style.display = this.availableTalentPoints > 0 ? 'block' : 'none';
        }
    }

    openTalentPanel() {
        const panel = document.getElementById('talent-panel');
        if (panel) {
            panel.style.display = 'block';
            this.renderTalentPanel();
        }
    }

    closeTalentPanel() {
        const panel = document.getElementById('talent-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    renderTalentPanel() {
        const container = document.getElementById('talentTreeContainer');
        const badge = document.getElementById('talentPointsBadge');
        
        if (!container) return;

        // Atualizar badge de pontos
        if (badge) {
            badge.textContent = this.availableTalentPoints || 0;
        }

        // Se não temos dados da árvore, solicitar
        if (!this.talentTree) {
            container.innerHTML = '<div class="talent-placeholder">Carregando árvore de talentos...</div>';
            if (window.networkManager) {
                window.networkManager.requestTalentTree();
            }
            return;
        }

        // Renderizar árvore de talentos
        let html = '';
        
        if (this.talentTree.lines) {
            this.talentTree.lines.forEach((line, lineIndex) => {
                html += `<div class="talent-line">`;
                html += `<div class="talent-line-title">${line.name} (Nv. ${line.levelReq}+)</div>`;
                html += `<div class="talent-row">`;
                
                if (line.talents) {
                    line.talents.forEach(talent => {
                        const isAcquired = this.playerTalents?.includes(talent.id);
                        const isLocked = talent.req && !this.playerTalents?.includes(talent.req);
                        const isAvailable = !isAcquired && !isLocked && this.availableTalentPoints > 0;
                        
                        let cssClass = 'talent-node';
                        if (isAcquired) cssClass += ' acquired';
                        else if (isLocked) cssClass += ' locked';
                        else if (isAvailable) cssClass += ' available';
                        
                        const bonusText = Object.entries(talent.bonus || {}).map(([k, v]) => `+${v} ${k}`).join(', ');
                        
                        html += `<div class="${cssClass}" onclick="window.gameplayEngine?.selectTalent('${talent.id}')">`;
                        html += `<div class="talent-node-name">${talent.name}</div>`;
                        html += `<div class="talent-node-cost">${bonusText}</div>`;
                        html += `</div>`;
                    });
                }
                
                html += `</div></div>`;
            });
        }

        container.innerHTML = html;
    }

    selectTalent(talentId) {
        if (!talentId) return;

        // Verificar se já temos o talento
        if (this.playerTalents?.includes(talentId)) {
            Logger.info('Talento já adquirido:', talentId);
            return;
        }

        // Verificar se temos pontos disponíveis
        if (this.availableTalentPoints <= 0) {
            Logger.warn('Sem pontos de talento disponíveis');
            if (this.hud) {
                this.hud.addChatMessage('Sem pontos de talento disponíveis', '#FF5252');
            }
            return;
        }

        // Enviar requisição ao servidor
        if (window.networkManager) {
            window.networkManager.selectTalent(talentId);
        }
    }

    checkTalentPointsOnLevelUp() {
        // Verificar se ganhou novos pontos de talento
        const level = this.playerStats?.level || this.player?.level || 1;
        const totalPoints = Math.floor((level - 1) / 5) + 1;
        const spentPoints = this.playerTalents?.length || 0;
        const available = Math.max(0, totalPoints - spentPoints);

        if (available > 0) {
            this.handleTalentPointsAvailable({ points: available });
        }

        return available;
    }

    // ===== MÉTODOS DE SISTEMAS DE JOGO =====

    initializeGameSystems(characterData) {
        console.log('🎮 Inicializando sistemas de jogo...');
        
        // Inicializar ZoneSystem
        if (typeof ZoneSystem !== 'undefined') {
            this.zoneSystem = new ZoneSystem();
            this.zoneSystem.setCurrentZone(this.currentZone);
            console.log('✅ ZoneSystem inicializado');
        }
        
        // Inicializar QuestSystem
        if (typeof QuestSystem !== 'undefined') {
            this.questSystem = new QuestSystem();
            console.log('✅ QuestSystem inicializado');
        }
        
        // Inicializar NPCSystem
        if (typeof NPCSystem !== 'undefined') {
            this.npcSystem = new NPCSystem();
            console.log('✅ NPCSystem inicializado');
        }
        
        // Gerar conteúdo da zona
        this.generateZoneContent();
        
        // Iniciar primeira quest
        if (this.questSystem) {
            this.questSystem.startQuest('q1_tutorial');
        }
    }

    generateZoneContent() {
        if (!this.zoneSystem) return;
        
        const zone = this.zoneSystem.getCurrentZone();
        if (!zone) return;
        
        // Gerar mobs da zona
        this.mobs = this.zoneSystem.generateMobs();
        console.log(`👾 Gerados ${this.mobs.length} mobs na zona ${zone.name}`);
        
        // Gerar itens da zona
        this.items = this.zoneSystem.generateItems();
        console.log(`💎 Gerados ${this.items.length} itens na zona ${zone.name}`);
        
        // Aplicar tema da zona
        const theme = this.zoneSystem.getZoneTheme();
        this.zoneTheme = theme;
        
        // Posicionar jogador no spawn da zona
        const spawnPos = this.zoneSystem.getSpawnPosition('player');
        if (this.player && spawnPos) {
            this.player.x = spawnPos.x;
            this.player.y = spawnPos.y;
        }
    }

    handleNPCInteraction() {
        if (!this.npcSystem || !this.player) return;
        
        const nearestNPC = this.npcSystem.getNearestNPC(this.player.x, this.player.y, this.currentZone);
        
        if (nearestNPC && nearestNPC.distance <= this.npcSystem.interactionRange) {
            // Mostrar prompt de interação
            if (this.hud) {
                this.hud.addChatMessage(`Pressione [E] para falar com ${nearestNPC.npc.name}`, '#00FF00');
            }
            
            // Verificar tecla E
            if (this.keys && (this.keys['e'] || this.keys['E'])) {
                const dialog = this.npcSystem.startInteraction(nearestNPC.npc, this.player);
                if (dialog && this.hud) {
                    this.hud.addChatMessage(`${nearestNPC.npc.name}: ${dialog.text}`, '#FFD700');
                }
            }
        }
    }

    /**
     * Manipula interação com E - tenta NPC primeiro, depois loot
     */
    handleInteraction() {
        if (!this.player) return;
        
        // 1. Tentar interagir com NPC mais próximo
        if (this.npcSystem) {
            const nearestNPC = this.npcSystem.getNearestNPC(this.player.x, this.player.y);
            
            if (nearestNPC && nearestNPC.distance <= this.npcSystem.interactionRange) {
                // Iniciar interação
                const dialog = this.npcSystem.startInteraction(nearestNPC.npc, this.player);
                if (dialog) {
                    // Mostrar fala do NPC em speech bubble
                    this.npcSystem.showNPCSpeech(nearestNPC.npc.id, dialog.text, 4000);
                    
                    // Log no chat
                    if (this.hud) {
                        this.hud.addChatMessage(`${nearestNPC.npc.name}: ${dialog.text}`, '#FFD700');
                        
                        // Mostrar opções de diálogo
                        if (dialog.options && dialog.options.length > 0) {
                            dialog.options.forEach((opt, i) => {
                                this.hud.addChatMessage(`  ${i + 1}. ${opt.text}`, '#AAAAAA');
                            });
                        }
                    }
                    
                    console.log(`💬 Interagindo com ${nearestNPC.npc.name}: "${dialog.text}"`);
                    return; // Interação concluída
                }
            }
        }
        
        // 2. Se não há NPC próximo, tentar coletar loot
        this.manualCollectLoot();
    }

    /**
     * Diálogo rápido com F - apenas NPCs
     */
    handleNPCDialog() {
        if (!this.player || !this.npcSystem) return;
        
        const nearestNPC = this.npcSystem.getNearestNPC(this.player.x, this.player.y);
        
        if (nearestNPC && nearestNPC.distance <= this.npcSystem.interactionRange) {
            // Apenas mostrar saudação básica
            const npc = nearestNPC.npc;
            const greeting = npc.dialog?.greeting || `Olá, sou ${npc.name}!`;
            
            // Mostrar em speech bubble
            this.npcSystem.showNPCSpeech(npc.id, greeting, 3000);
            
            if (this.hud) {
                this.hud.addChatMessage(`${npc.name}: ${greeting}`, '#FFD700');
            }
            
            console.log(`👋 ${npc.name} cumprimentou`);
        }
    }

    checkZoneTransition() {
        if (!this.zoneSystem || !this.player) return;
        
        const transition = this.zoneSystem.checkTransition(this.player.x, this.player.y);
        
        if (transition) {
            console.log(`🌍 Transicionando para zona: ${transition.to}`);
            
            // Mudar de zona
            this.currentZone = transition.to;
            this.zoneSystem.setCurrentZone(transition.to);
            
            // Gerar conteúdo da nova zona
            this.generateZoneContent();
            
            // Notificar jogador
            if (this.hud) {
                const newZone = this.zoneSystem.getCurrentZone();
                this.hud.addChatMessage(`🌍 Entrou em: ${newZone.name}`, '#00FF00');
                const warning = this.zoneSystem.getLevelRangeWarning(this.player.level);
                if (warning) {
                    this.hud.addChatMessage(warning, '#FFFF00');
                }
            }
        }
    }

    clearRemotePlayers() {
        this.remotePlayers = [];
        // Sistemas de Jogo
        this.zoneSystem = null;
        this.questSystem = null;
        this.npcSystem = null;
        this.currentZone = 'korvien_village';
        console.log('🧹 Remote players limpos');
    }

    updateFromServer(updates) {
        // updates: { player: {x, y, ...}, entities: [...] }
        console.log('🔄 Atualizando jogo a partir do servidor:', updates);
        
        // Atualizar jogador local se necessário
        if (updates.player) {
            Object.assign(this.player, updates.player);
            console.log('👤 Jogador atualizado:', this.player);
        }
        
        // Atualizar entidades (outros jogadores, mobs, etc)
        if (updates.entities && Array.isArray(updates.entities)) {
            updates.entities.forEach(remoteEntity => {
                const isPlayer = remoteEntity.type === 'player';
                const isMob = remoteEntity.type === 'mob';

                // Se for mob, atualiza ou cria um mob local
                if (isMob) {
                    const existingMob = this.mobs.find(m => m.id === remoteEntity.id);
                    if (existingMob) {
                        Object.assign(existingMob, remoteEntity);
                    } else {
                        this.mobs.push(remoteEntity);
                    }
                }
                
                // Se for outro jogador, atualiza ou cria
                if (isPlayer && remoteEntity.id !== this.player.id) {
                    const existingPlayer = this.remotePlayers.find(p => p.id === remoteEntity.id);
                    if (existingPlayer) {
                        Object.assign(existingPlayer, remoteEntity);
                    } else {
                        this.remotePlayers.push(remoteEntity);
                    }
                }
            });
            
            console.log(`🌍 Entidades atualizadas: ${updates.entities.length}`);
        }
        
        // Atualizar mundo se fornecido
        if (updates.world) {
            Object.assign(this.world, updates.world);
        }
    }

    // ===== MÉTODOS UTILITÁRIOS =====

    sendToServer(event, data) {
        // Envia dados para o servidor se estiver em modo online
        if (typeof Config !== 'undefined' && Config.GAME_MODE === 'SERVER_ONLINE') {
            if (window.networkManager && window.networkManager.connected) {
                switch (event) {
                    case 'playerMove':
                        window.networkManager.sendPlayerMove(data.x, data.y);
                        break;
                    case 'attackMob':
                        window.networkManager.sendAttackMob(data.mobId, data.damage);
                        break;
                    case 'useSkill':
                        window.networkManager.sendUseSkill(data.skillId, data.target);
                        break;
                    default:
                        console.warn('📡 Evento não reconhecido:', event);
                }
            } else {
                console.warn('📡 NetworkManager não disponível para enviar:', event);
            }
        } else {
            // Modo offline - processar localmente
            console.log('📡 Processando evento localmente:', event, data);
        }
    }

    getEntityColor(type) {
        const colors = {
            player: '#4CAF50',
            mob: '#FF5722',
            npc: '#2196F3',
            item: '#FFC107',
            unknown: '#9E9E9E'
        };
        return colors[type] || colors.unknown;
    }
}

// Exportar para uso global
window.IntegratedGameplayEngine = IntegratedGameplayEngine;
window.gameplayEngine = null; // Inicializar como null para evitar conflitos
