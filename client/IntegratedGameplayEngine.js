/**
 * IntegratedGameplayEngine - Motor de Jogo Principal
 * Versão integrada com Enhanced AI System v0.3.7v
 */

class IntegratedGameplayEngine {
    constructor(canvasId, characterData) {
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
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.actualFPS = 0;
        
        // Player
        this.player = {
            id: characterData.id || 'player_1',
            name: characterData.name || 'Player',
            x: characterData.x || 400,
            y: characterData.y || 300,
            width: 32,
            height: 32,
            speed: 5,
            hp: characterData.hp || 100,
            maxHp: characterData.maxHp || 100,
            mana: characterData.mana || 50,
            maxMana: characterData.maxMana || 50,
            level: characterData.level || 1,
            exp: characterData.exp || 0,
            maxExp: characterData.maxExp || 100,
            gold: characterData.gold || 0,
            color: '#4CAF50',
            velocity: { x: 0, y: 0 },
            facing: 'down'
        };
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        // Entidades
        this.entities = [];
        this.mobs = [];
        this.items = [];
        this.particles = [];
        
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
        // HUD System
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
        // Conectar ao servidor se disponível
        if (window.io) {
            this.socket = io();
            this.setupSocketHandlers();
        } else {
            console.log('📡 Socket.io não disponível - modo offline');
        }
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
        
        this.socket.on('world_init', (data) => {
            console.log('🌍 Mundo inicializado:', data);
            this.entities = data.entities || [];
            this.mobs = data.mobs || [];
        });
        
        this.socket.on('mob_spawn', (mob) => {
            this.mobs.push(mob);
        });
        
        this.socket.on('mob_death', (mobId) => {
            this.mobs = this.mobs.filter(m => m.id !== mobId);
        });
        
        this.socket.on('combat_damage', (data) => {
            if (data.targetId === this.player.id) {
                this.player.hp = Math.max(0, this.player.hp - data.damage);
                this.updateHUD();
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
        
        console.log('🎮 Iniciando gameplay loop');
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        console.log('⏹️ Gameplay loop parado');
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Calcular FPS
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.actualFPS = Math.round(1 / deltaTime);
        }
        
        // Update
        this.update(deltaTime);
        
        // Render
        this.render();
        
        // Próximo frame
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Update player
        this.updatePlayer(deltaTime);
        
        // Update camera
        this.updateCamera();
        
        // Update entities
        this.updateEntities(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update HUD
        this.updateHUD();
        
        // Update minimap
        this.updateMinimap();
        
        // Reset mouse click
        this.mouse.clicked = false;
    }
    
    updatePlayer(deltaTime) {
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
        const newX = this.player.x + dx * this.player.speed;
        const newY = this.player.y + dy * this.player.speed;
        
        // Verificar colisões
        if (!this.checkCollision(newX, newY, this.player.width, this.player.height)) {
            this.player.x = newX;
            this.player.y = newY;
        }
        
        // Atualizar facing
        if (dx > 0) this.player.facing = 'right';
        else if (dx < 0) this.player.facing = 'left';
        else if (dy > 0) this.player.facing = 'down';
        else if (dy < 0) this.player.facing = 'up';
        
        // Enviar posição para servidor
        if (this.socket && (dx !== 0 || dy !== 0)) {
            this.socket.emit('player_move', {
                id: this.player.id,
                x: this.player.x,
                y: this.player.y,
                facing: this.player.facing
            });
        }
    }
    
    updateCamera() {
        if (this.camera.followPlayer) {
            this.camera.x = this.player.x - this.camera.width / 2;
            this.camera.y = this.player.y - this.camera.height / 2;
            
            // Limitar ao mapa
            this.camera.x = Math.max(0, Math.min(this.camera.x, this.map.width - this.camera.width));
            this.camera.y = Math.max(0, Math.min(this.camera.y, this.map.height - this.camera.height));
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
        if (this.systems.hud) {
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
        
        // Atualizar HUD antigo (fallback)
        const playerNameEl = document.getElementById('playerName');
        const playerLevelEl = document.getElementById('playerLevel');
        const hpTextEl = document.getElementById('hpText');
        const healthFillEl = document.getElementById('healthFill');
        const positionTextEl = document.getElementById('positionText');
        const mobCountEl = document.getElementById('mobCount');
        const fpsTextEl = document.getElementById('fpsText');
        
        if (playerNameEl) playerNameEl.textContent = this.player.name;
        if (playerLevelEl) playerLevelEl.textContent = `Lv. ${this.player.level}`;
        if (hpTextEl) hpTextEl.textContent = `${this.player.hp}/${this.player.maxHp} HP`;
        if (healthFillEl) healthFillEl.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
        if (positionTextEl) positionTextEl.textContent = `X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`;
        if (mobCountEl) mobCountEl.textContent = `Mobs: ${this.mobs.length}`;
        if (fpsTextEl) fpsTextEl.textContent = `FPS: ${this.actualFPS}`;
    }
    
    updateMinimap() {
        if (!this.systems.minimap) return;
        
        const ctx = this.systems.minimap.ctx;
        const canvas = this.systems.minimap.canvas;
        
        // Limpar
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Escala
        const scale = canvas.width / this.map.width;
        
        // Desenhar player
        ctx.fillStyle = '#4CAF50';
        const playerX = this.player.x * scale;
        const playerY = this.player.y * scale;
        ctx.fillRect(playerX - 2, playerY - 2, 4, 4);
        
        // Desenhar mobs
        ctx.fillStyle = '#f44336';
        this.mobs.forEach(mob => {
            const mobX = mob.x * scale;
            const mobY = mob.y * scale;
            ctx.fillRect(mobX - 1, mobY - 1, 2, 2);
        });
        
        // Desenhar viewport
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(
            this.camera.x * scale,
            this.camera.y * scale,
            this.camera.width * scale,
            this.camera.height * scale
        );
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
        
        // Renderizar entidades
        this.renderEntities();
        
        // Renderizar mobs
        this.renderMobs();
        
        // Renderizar player
        this.renderPlayer();
        
        // Renderizar partículas
        this.renderParticles();
        
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
    
    renderEntities() {
        // Renderizar outras entidades
        this.entities.forEach(entity => {
            this.ctx.fillStyle = entity.color || '#888';
            this.ctx.fillRect(entity.x, entity.y, entity.width || 32, entity.height || 32);
        });
    }
    
    renderMobs() {
        // Renderizar mobs
        this.mobs.forEach(mob => {
            // Tentar usar sprite do asset manager
            let sprite = null;
            if (window.assetManager && window.assetManager.assets) {
                sprite = window.assetManager.assets.get(`monsters_${mob.type}`);
            }
            
            if (sprite) {
                // Usar sprite real
                this.ctx.drawImage(sprite, mob.x, mob.y, mob.width || 32, mob.height || 32);
            } else {
                // Fallback para cores
                const mobColors = {
                    goblin_raider: '#8B4513',
                    dire_wolf: '#696969',
                    mountain_orc: '#556B2F',
                    troll: '#2F4F4F',
                    dragon: '#8B0000'
                };
                
                this.ctx.fillStyle = mobColors[mob.type] || '#f44336';
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
    
    renderPlayer() {
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
            this.ctx.fillStyle = this.player.color;
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
        
        // Nome
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.player.name, this.player.x + 16, this.player.y - 10);
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
        }
    }
    
    checkCollision(x, y, width, height) {
        // Verificar colisão com obstáculos
        for (const obstacle of this.map.obstacles) {
            if (x < obstacle.x + obstacle.width &&
                x + width > obstacle.x &&
                y < obstacle.y + obstacle.height &&
                y + height > obstacle.y) {
                return true;
            }
        }
        
        // Verificar limites do mapa
        if (x < 0 || x + width > this.map.width ||
            y < 0 || y + height > this.map.height) {
            return true;
        }
        
        return false;
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
    
    // Métodos públicos
    getPlayer() {
        return this.player;
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
    
    getConfig() {
        return this.config;
    }
}

// Exportar para uso global
window.IntegratedGameplayEngine = IntegratedGameplayEngine;
window.gameplayEngine = null; // Inicializar como null para evitar conflitos
