/**
 * Gameplay Engine - Sistema de Jogo Principal
 * Responsável pelo loop de gameplay, renderização e física
 * Version 0.4 - Gameplay Loop Limpo e Funcional
 */

// Importar sistema completo do game.js
const RACES = {
    human: { name: "Humano", hp: 110, atk: 2, def: 1 },
    elf: { name: "Elfo", hp: 95, atk: 4, def: 0 },
    dwarf: { name: "Anao", hp: 130, atk: 1, def: 3 }
};

const CLASSES = {
    warrior: { name: "Guerreiro", hp: 30, atk: 6, def: 4 },
    mage: { name: "Mago", hp: 10, atk: 8, def: 1 },
    ranger: { name: "Rastreador", hp: 20, atk: 7, def: 2 }
};

const MOBS = {
    goblin: { name: "Goblin", hp: 36, atk: 7, def: 1, exp: 20, gold: 12 },
    wolf: { name: "Lobo", hp: 48, atk: 9, def: 2, exp: 28, gold: 14 },
    orc: { name: "Orc", hp: 72, atk: 12, def: 4, exp: 45, gold: 24 }
};

const THEMES = {
    city: { floor: "#314a2f", wall: "#1f2a24", grid: "rgba(255,255,255,0.08)" },
    plains: { floor: "#405b33", wall: "#213229", grid: "rgba(255,255,255,0.08)" },
    north: { floor: "#245d44", wall: "#183b2c", grid: "rgba(255,255,255,0.07)" },
    mountain_gate: { floor: "#5f7a37", wall: "#36461f", grid: "rgba(0,0,0,0.15)" },
    mountain_inside: { floor: "#687b4f", wall: "#3d4b2d", grid: "rgba(0,0,0,0.2)" },
    cave_inside: { floor: "#3c475c", wall: "#111827", grid: "rgba(255,255,255,0.08)" },
    swamp: { floor: "#2e4632", wall: "#1b2b1f", grid: "rgba(255,255,255,0.07)" }
};

class GameplayEngine {
    constructor() {
        console.log('🎮 GameplayEngine constructor chamado');
        
        this.canvas = null;
        this.ctx = null;
        this.minimap = null;
        this.minimapCtx = null;
        
        // Game state
        this.isRunning = false;
        this.isInitialized = false;
        this.worldData = null;
        this.player = null;
        this.mobs = [];
        this.keys = {};
        
        // Performance
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTime = 0;
        
        // Configuration
        this.config = {
            playerSpeed: 200,
            mobCount: 12,
            attackRange: 20,
            attackDamage: 10,
            currentTheme: 'plains'
        };
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        console.log('🎮 Gameplay Engine initialized');
    }
    
    setupEventListeners() {
        // Keyboard input
        if (typeof document !== 'undefined') {
            document.addEventListener('keydown', (e) => {
                // Check if we're in an input field - if so, don't handle game keys
                const activeElement = document.activeElement;
                const isInputField = activeElement && (
                    activeElement.tagName === 'INPUT' || 
                    activeElement.tagName === 'TEXTAREA' || 
                    activeElement.tagName === 'SELECT'
                );
                
                if (!isInputField) {
                    this.keys[e.key.toLowerCase()] = true;
                    e.preventDefault();
                }
            });
            
            document.addEventListener('keyup', (e) => {
                // Check if we're in an input field - if so, don't handle game keys
                const activeElement = document.activeElement;
                const isInputField = activeElement && (
                    activeElement.tagName === 'INPUT' || 
                    activeElement.tagName === 'TEXTAREA' || 
                    activeElement.tagName === 'SELECT'
                );
                
                if (!isInputField) {
                    this.keys[e.key.toLowerCase()] = false;
                    e.preventDefault();
                }
            });
        }
        
        // Window resize
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => {
                this.resizeCanvas();
            });
        }
    }
    
    startGame(characterData) {
        console.log('🎮 Iniciando gameplay com character:', characterData);
        
        // Setup canvas
        this.setupCanvas();
        
        if (!this.canvas || !this.ctx) {
            console.error('❌ Canvas não encontrado');
            return false;
        }
        
        // Spawn player
        this.spawnPlayer(characterData);
        
        // Spawn mobs
        this.spawnMobs();
        
        // Start game loop
        this.startGameLoop();
        
        console.log('✅ Gameplay iniciado com sucesso');
        return true;
    }
    
    setupCanvas() {
        if (typeof document !== 'undefined') {
            console.log('📋 Configurando canvas...');
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
            this.minimap = document.getElementById('minimap');
            this.minimapCtx = this.minimap ? this.minimap.getContext('2d') : null;
            
            if (!this.canvas || !this.ctx) {
                console.error('❌ Canvas não encontrado');
                return false;
            }
            
            // Configure canvas
            this.resizeCanvas();
            
            // Forçar visibilidade do canvas
            this.canvas.style.display = 'block';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = '999';
            
            console.log('✅ Canvas configurado com sucesso');
            return true;
        }
        
        console.error('❌ Document não disponível');
        return false;
    }
    
    spawnPlayer(characterData) {
        console.log('🦸 Spawning player:', characterData);
        
        if (!this.canvas || !this.ctx) {
            console.error('❌ Cannot spawn player: canvas not available');
            return;
        }
        
        this.player = {
            id: characterData.id || Date.now().toString(),
            name: characterData.name || 'Player',
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: 32,
            speed: this.config.playerSpeed,
            health: 100,
            maxHealth: 100,
            level: characterData.level || 1,
            class: characterData.class || 'Guerreiro',
            race: characterData.race || 'human'
        };
        
        console.log('✅ Player spawned:', this.player);
    }
    
    spawnMobs() {
        console.log('👾 Spawning mobs...');
        
        if (!this.canvas || !this.ctx) {
            console.error('❌ Cannot spawn mobs: canvas not available');
            return;
        }
        
        this.mobs = [];
        const mobTypes = Object.keys(MOBS);
        
        for (let i = 0; i < this.config.mobCount; i++) {
            const mobType = mobTypes[i % mobTypes.length];
            const mobData = MOBS[mobType];
            
            this.mobs.push({
                id: `mob_${i}`,
                type: mobType,
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                size: 32,
                color: this.getMobColor(mobType),
                name: mobData.name,
                hp: mobData.hp,
                maxHp: mobData.hp,
                atk: mobData.atk,
                def: mobData.def,
                exp: mobData.exp,
                gold: mobData.gold,
                speed: 30 + Math.random() * 40,
                direction: Math.random() * Math.PI * 2,
                
                // AI System
                aiState: 'patrolling',
                lastDecision: 0,
                decisionCooldown: 1000,
                target: null,
                fleeThreshold: 0.3,
                aggroRange: 100,
                attackRange: 30,
                patrolCenter: null,
                patrolRadius: 150,
                lastAttack: 0,
                attackCooldown: 2000
            });
        }
        
        // Inicializar centros de patrulha
        this.mobs.forEach(mob => {
            mob.patrolCenter = { x: mob.x, y: mob.y };
        });
        
        console.log(`✅ Spawned ${this.mobs.length} mobs with AI system`);
    }
    
    getMobColor(mobType) {
        const colors = {
            goblin: '#FF6B6B',
            wolf: '#8B4513',
            orc: '#4B0082'
        };
        return colors[mobType] || '#FF6B6B';
    }
    
    startGameLoop() {
        console.log('🔄 Starting game loop...');
        
        if (!this.player || !this.ctx) {
            console.error('❌ Cannot start game loop: missing dependencies');
            return;
        }
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fpsTime = performance.now();
        
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update
        this.update(deltaTime);
        
        // Render
        this.render();
        
        // FPS
        this.frameCount++;
        if (currentTime - this.fpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = currentTime;
        }
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        if (!this.player) return;
        
        // Player movement
        this.updatePlayerMovement(deltaTime);
        
        // Player attack
        this.updatePlayerAttack();
        
        // Update mobs
        this.updateMobs(deltaTime);
        
        // Check collisions
        this.checkCollisions();
    }
    
    updatePlayerMovement(deltaTime) {
        const moveX = (this.keys['d'] ? 1 : 0) - (this.keys['a'] ? 1 : 0);
        const moveY = (this.keys['s'] ? 1 : 0) - (this.keys['w'] ? 1 : 0);
        
        if (moveX !== 0 || moveY !== 0) {
            // Normalize diagonal movement
            const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
            const normalizedX = (moveX / magnitude) * this.player.speed * deltaTime;
            const normalizedY = (moveY / magnitude) * this.player.speed * deltaTime;
            
            const newX = this.player.x + normalizedX;
            const newY = this.player.y + normalizedY;
            
            // Keep within canvas bounds
            this.player.x = Math.max(this.player.size/2, Math.min(this.canvas.width - this.player.size/2, newX));
            this.player.y = Math.max(this.player.size/2, Math.min(this.canvas.height - this.player.size/2, newY));
        }
    }
    
    updatePlayerAttack() {
        if (this.keys[' ']) {
            this.keys[' '] = false; // Prevent continuous attack
            
            // Check for nearby mobs
            this.mobs.forEach(mob => {
                const dist = Math.sqrt(Math.pow(this.player.x - mob.x, 2) + Math.pow(this.player.y - mob.y, 2));
                if (dist < (this.player.size + mob.size) / 2 + this.config.attackRange) {
                    this.attackMob(mob);
                }
            });
        }
    }
    
    attackMob(mob) {
        const damage = this.config.attackDamage + (this.player.level || 1) * 2;
        mob.hp -= damage;
        
        const expGained = mob.exp || 20;
        const goldGained = mob.gold || 10;
        
        this.addChatMessage(`⚔️ Você atacou ${mob.name}! (-${damage} HP)`, '#FFD700');
        this.addChatMessage(`📊 +${expGained} EXP, +${goldGained} Gold`, '#FFD700');
        
        if (mob.hp <= 0) {
            // Mob derrotado
            this.addChatMessage(`⚔️ Você derrotou ${mob.name}!`, '#FFD700');
            this.respawnMob(mob);
            
            // Atualizar stats do player
            if (this.player.exp !== undefined) {
                this.player.exp += expGained;
                this.player.gold = (this.player.gold || 0) + goldGained;
            }
        }
    }
    
    respawnMob(mob) {
        mob.hp = mob.maxHp;
        mob.x = Math.random() * (this.canvas.width - 100) + 50;
        mob.y = Math.random() * (this.canvas.height - 100) + 50;
        mob.aiState = 'patrolling';
        mob.target = null;
    }
    
    updateMobs(deltaTime) {
        this.mobs.forEach(mob => {
            this.updateMobAI(mob, deltaTime);
            this.updateMobPosition(mob, deltaTime);
        });
    }
    
    updateMobAI(mob, deltaTime) {
        const now = Date.now();
        
        // Verificar cooldown de decisão
        if (now - mob.lastDecision < mob.decisionCooldown) {
            return;
        }
        
        mob.lastDecision = now;
        
        // Verificar HP para flee
        const hpPercent = mob.hp / mob.maxHp;
        if (hpPercent < mob.fleeThreshold && mob.aiState !== 'fleeing') {
            mob.aiState = 'fleeing';
            mob.target = null;
            console.log(`🏃 ${mob.name} está fugindo com ${Math.round(hpPercent * 100)}% HP`);
        }
        
        // Verificar aggro do player
        if (this.player && mob.aiState !== 'fleeing') {
            const distance = this.getDistance(mob, this.player);
            
            if (distance <= mob.aggroRange && mob.aiState !== 'aggro') {
                mob.aiState = 'aggro';
                mob.target = this.player;
                console.log(`⚔️ ${mob.name} está em aggro com o player!`);
            } else if (distance > mob.aggroRange * 1.5 && mob.aiState === 'aggro') {
                mob.aiState = 'patrolling';
                mob.target = null;
                console.log(`🔄 ${mob.name} voltou para patrulha`);
            }
        }
        
        // Executar comportamento baseado no estado
        switch (mob.aiState) {
            case 'idle':
                this.handleIdleState(mob);
                break;
            case 'patrolling':
                this.handlePatrolState(mob);
                break;
            case 'aggro':
                this.handleAggroState(mob);
                break;
            case 'fleeing':
                this.handleFleeState(mob);
                break;
            case 'attacking':
                this.handleAttackState(mob);
                break;
        }
    }
    
    handleIdleState(mob) {
        if (Math.random() < 0.3) {
            mob.aiState = 'patrolling';
        }
    }
    
    handlePatrolState(mob) {
        if (!mob.patrolCenter) {
            mob.patrolCenter = { x: mob.x, y: mob.y };
        }
        
        if (Math.random() < 0.1) {
            const angle = Math.random() * Math.PI * 2;
            mob.direction = angle;
        }
        
        const distFromCenter = this.getDistance(mob, mob.patrolCenter);
        if (distFromCenter > mob.patrolRadius) {
            const angleToCenter = Math.atan2(
                mob.patrolCenter.y - mob.y,
                mob.patrolCenter.x - mob.x
            );
            mob.direction = angleToCenter;
        }
    }
    
    handleAggroState(mob) {
        if (!mob.target || !this.player) {
            mob.aiState = 'patrolling';
            return;
        }
        
        const distance = this.getDistance(mob, mob.target);
        
        if (distance > mob.attackRange) {
            const angle = Math.atan2(
                mob.target.y - mob.y,
                mob.target.x - mob.x
            );
            mob.direction = angle;
        } else {
            mob.aiState = 'attacking';
        }
    }
    
    handleFleeState(mob) {
        if (this.player) {
            const angle = Math.atan2(
                mob.y - this.player.y,
                mob.x - this.player.x
            );
            mob.direction = angle;
        }
        
        const hpPercent = mob.hp / mob.maxHp;
        if (hpPercent > mob.fleeThreshold * 2) {
            mob.aiState = 'patrolling';
            mob.target = null;
        }
    }
    
    handleAttackState(mob) {
        if (!mob.target || !this.player) {
            mob.aiState = 'patrolling';
            return;
        }
        
        const now = Date.now();
        const distance = this.getDistance(mob, mob.target);
        
        if (distance <= mob.attackRange && now - mob.lastAttack >= mob.attackCooldown) {
            this.mobAttackPlayer(mob, mob.target);
            mob.lastAttack = now;
        } else if (distance > mob.attackRange) {
            mob.aiState = 'aggro';
        }
    }
    
    mobAttackPlayer(mob, player) {
        const baseDamage = mob.atk;
        const variance = 0.2;
        const damage = Math.round(baseDamage * (1 + (Math.random() - 0.5) * variance));
        
        const knockbackAngle = Math.atan2(player.y - mob.y, player.x - mob.x);
        const knockbackDistance = 20;
        player.x += Math.cos(knockbackAngle) * knockbackDistance;
        player.y += Math.sin(knockbackAngle) * knockbackDistance;
        
        // Apply knockback boundaries
        player.x = Math.max(player.size/2, Math.min(this.canvas.width - player.size/2, player.x));
        player.y = Math.max(player.size/2, Math.min(this.canvas.height - player.size/2, player.y));
        
        console.log(`⚔️ Mob ${mob.name} attacked player for ${damage} damage`);
        this.addChatMessage(`⚔️ ${mob.name} atacou você! (-${damage} HP)`, '#FF6B6B');
    }
    
    updateMobPosition(mob, deltaTime) {
        const speed = mob.speed * deltaTime;
        
        switch (mob.aiState) {
            case 'patrolling':
                this.handlePatrolMovement(mob, speed);
                break;
            case 'aggro':
                this.handleAggroMovement(mob, speed);
                break;
            case 'fleeing':
                this.handleFleeMovement(mob, speed);
                break;
        }
        
        // Manter dentro dos limites do canvas
        mob.x = Math.max(mob.size/2, Math.min(this.canvas.width - mob.size/2, mob.x));
        mob.y = Math.max(mob.size/2, Math.min(this.canvas.height - mob.size/2, mob.y));
        
        // Mudar direção se bater na parede
        if (mob.x <= mob.size/2 || mob.x >= this.canvas.width - mob.size/2 ||
            mob.y <= mob.size/2 || mob.y >= this.canvas.height - mob.size/2) {
            mob.direction = Math.random() * Math.PI * 2;
        }
    }
    
    handlePatrolMovement(mob, speed) {
        mob.x += Math.cos(mob.direction) * speed;
        mob.y += Math.sin(mob.direction) * speed;
    }
    
    handleAggroMovement(mob, speed) {
        if (this.player) {
            const dx = this.player.x - mob.x;
            const dy = this.player.y - mob.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > mob.attackRange) {
                mob.x += Math.cos(mob.direction) * speed;
                mob.y += Math.sin(mob.direction) * speed;
            }
        }
    }
    
    handleFleeMovement(mob, speed) {
        mob.x += Math.cos(mob.direction) * speed * 1.5; // 1.5x speed when fleeing
        mob.y += Math.sin(mob.direction) * speed * 1.5;
    }
    
    checkCollisions() {
        if (!this.player) return;
        
        this.mobs.forEach(mob => {
            const dist = Math.sqrt(Math.pow(this.player.x - mob.x, 2) + Math.pow(this.player.y - mob.y, 2));
            if (dist < (this.player.size + mob.size) / 2) {
                // Collision detected - visual feedback only
                // In a real game, this would cause damage
            }
        });
    }
    
    render() {
        if (!this.ctx || !this.canvas) {
            console.error('❌ Render: Canvas ou ctx não disponível');
            return;
        }
        
        // Clear canvas
        this.ctx.fillStyle = THEMES[this.config.currentTheme].floor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render grid
        this.ctx.strokeStyle = THEMES[this.config.currentTheme].grid;
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvas.width; x += 32) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += 32) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Render mobs
        this.mobs.forEach(mob => {
            this.ctx.fillStyle = mob.color || '#FF6B6B';
            this.ctx.fillRect(mob.x - mob.size/2, mob.y - mob.size/2, mob.size, mob.size);
            
            // Mob border
            this.ctx.strokeStyle = '#C62828';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(mob.x - mob.size/2, mob.y - mob.size/2, mob.size, mob.size);
            
            // Mob eyes
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(mob.x - 6, mob.y - 4, 4, 4);
            this.ctx.fillRect(mob.x + 2, mob.y - 4, 4, 4);
            
            // HP bar
            const hpPercent = mob.hp / mob.maxHp;
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(mob.x - mob.size/2, mob.y - mob.size/2 - 15, mob.size, 4);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(mob.x - mob.size/2, mob.y - mob.size/2 - 15, mob.size * hpPercent, 4);
        });
        
        // Render player
        if (this.player) {
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(this.player.x - this.player.size/2, this.player.y - this.player.size/2, this.player.size, this.player.size);
            
            // Player border
            this.ctx.strokeStyle = '#2E7D32';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.player.x - this.player.size/2, this.player.y - this.player.size/2, this.player.size, this.player.size);
            
            // Player direction indicator
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(this.player.x - 2, this.player.y - this.player.size/2 - 5, 4, 3);
        }
        
        // Update UI
        this.updateUI();
        
        // Draw minimap
        this.drawMinimap();
    }
    
    drawMinimap() {
        if (!this.minimapCtx || !this.minimap) return;
        
        const scale = 150 / Math.max(this.canvas.width, this.canvas.height);
        
        // Clear minimap
        this.minimapCtx.fillStyle = '#0a0a0a';
        this.minimapCtx.fillRect(0, 0, 150, 150);
        
        // Draw grid
        this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.minimapCtx.lineWidth = 0.5;
        
        for (let x = 0; x < 150; x += 15) {
            this.minimapCtx.beginPath();
            this.minimapCtx.moveTo(x, 0);
            this.minimapCtx.lineTo(x, 150);
            this.minimapCtx.stroke();
        }
        
        for (let y = 0; y < 150; y += 15) {
            this.minimapCtx.beginPath();
            this.minimapCtx.moveTo(0, y);
            this.minimapCtx.lineTo(150, y);
            this.minimapCtx.stroke();
        }
        
        // Draw mobs
        this.mobs.forEach(mob => {
            this.minimapCtx.fillStyle = mob.color || '#FF6B6B';
            this.minimapCtx.fillRect(mob.x * scale - 1, mob.y * scale - 1, 2, 2);
        });
        
        // Draw player
        if (this.player) {
            this.minimapCtx.fillStyle = '#4CAF50';
            this.minimapCtx.fillRect(this.player.x * scale - 2, this.player.y * scale - 2, 4, 4);
        }
    }
    
    updateUI() {
        if (!this.player || typeof document === 'undefined') return;
        
        // Update HUD elements
        const playerName = document.getElementById('playerName');
        const playerLevel = document.getElementById('playerLevel');
        const healthFill = document.getElementById('healthFill');
        const hpText = document.getElementById('hpText');
        const positionText = document.getElementById('positionText');
        const mobCount = document.getElementById('mobCount');
        const fpsText = document.getElementById('fpsText');
        
        if (playerName) playerName.textContent = this.player.name;
        if (playerLevel) playerLevel.textContent = `Lv. ${this.player.level || 1}`;
        if (healthFill) {
            const hpPercent = this.player.health / this.player.maxHealth;
            healthFill.style.width = `${hpPercent * 100}%`;
        }
        if (hpText) hpText.textContent = `${this.player.health || 100}/${this.player.maxHealth || 100}`;
        if (positionText) positionText.textContent = `${Math.round(this.player.x)}, ${Math.round(this.player.y)}`;
        if (mobCount) mobCount.textContent = `${this.mobs.length} mobs`;
        if (fpsText) fpsText.textContent = `${Math.round(this.fps)} FPS`;
    }
    
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    resizeCanvas() {
        if (!this.canvas) return;
        
        if (typeof window !== 'undefined') {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        
        // Reposition player if outside bounds
        if (this.player) {
            this.player.x = Math.max(this.player.size/2, Math.min(this.canvas.width - this.player.size/2, this.player.x));
            this.player.y = Math.max(this.player.size/2, Math.min(this.canvas.height - this.player.size/2, this.player.y));
        }
    }
    
    addChatMessage(message, color = '#FFFFFF') {
        if (typeof document !== 'undefined') {
            const chatBox = document.getElementById('chatMessages');
            if (chatBox) {
                const msgElement = document.createElement('div');
                msgElement.style.color = color;
                msgElement.textContent = message;
                chatBox.appendChild(msgElement);
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }
    }
    
    stopGame() {
        this.isRunning = false;
        console.log('🎮 Gameplay parado');
    }
    
    // Public API
    getPlayerPosition() {
        return {
            x: this.player.x,
            y: this.player.y
        };
    }
    
    getMobCount() {
        return this.mobs.length;
    }
    
    getFPS() {
        return this.fps;
    }
    
    isGameRunning() {
        return this.isRunning;
    }
}

// Export for use in HTML and testing
if (typeof window !== 'undefined') {
    window.GameplayEngine = GameplayEngine;
}
