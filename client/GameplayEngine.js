/**
 * Gameplay Engine - Sistema de Jogo Principal
 * Responsável pelo loop de gameplay, renderização e física
 * Version 0.3 - Gameplay Loop Funcional
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
            mobCount: 12, // Aumentado para mais variedade
            attackRange: 20,
            attackDamage: 10,
            currentTheme: 'plains' // Tema do mundo
        };
        
        // Sprites
        this.sprites = {
            player: {
                draw: (x, y, size) => {
                    // Player body (verde)
                    this.ctx.fillStyle = '#4CAF50';
                    this.ctx.fillRect(x - size/2, y - size/2, size, size);
                    
                    // Player border
                    this.ctx.strokeStyle = '#2E7D32';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x - size/2, y - size/2, size, size);
                    
                    // Player direction indicator
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(x - 2, y - size/2 - 5, 4, 3);
                }
            },
            mob: {
                draw: (mob) => {
                    // Mob body (vermelho)
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
                }
            }
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
                this.keys[e.key.toLowerCase()] = true;
                e.preventDefault();
            });
            
            document.addEventListener('keyup', (e) => {
                this.keys[e.key.toLowerCase()] = false;
                e.preventDefault();
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
        console.log('🎮🎮🎮 startGame chamado! characterData:', characterData);
        console.log('🎮🎮🎮 this.mobs.length:', this.mobs.length);
        
        // Setup canvas
        if (typeof document !== 'undefined') {
            console.log('📋 Document disponível, buscando canvas...');
            this.canvas = document.getElementById('gameCanvas');
            console.log('📋 Canvas encontrado:', this.canvas);
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
            console.log('📋 Context encontrado:', this.ctx);
            this.minimap = document.getElementById('minimap');
            this.minimapCtx = this.minimap ? this.minimap.getContext('2d') : null;
        } else {
            console.error('❌ Document não disponível');
        }
        
        if (!this.canvas || !this.ctx) {
            console.error('❌ Canvas não encontrado');
            return false;
        }
        
        console.log(`📐 Canvas encontrado: ${this.canvas.width}x${this.canvas.height}`);
        console.log(`📐 Canvas position:`, this.canvas.getBoundingClientRect());
        console.log(`📐 Canvas style:`, this.canvas.style.cssText);
        console.log(`📐 Canvas parent:`, this.canvas.parentElement);
        
        // Configure canvas
        this.resizeCanvas();
        console.log(`📐 Canvas configurado: ${this.canvas.width}x${this.canvas.height}`);
        
        // Forçar visibilidade do canvas
        this.canvas.style.display = 'block';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '999';
        this.canvas.style.background = '#FF0000';
        this.canvas.style.border = '5px solid #00FF00';
        
        console.log('🎨 Canvas style forçado:', this.canvas.style.cssText);
        
        // Initialize player
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: 32,
            speed: this.config.playerSpeed,
            ...characterData
        };
        
        console.log(`🦸 Player criado:`, this.player);
        
        // Initialize mobs
        console.log('👾 Chamando spawnMobs...');
        this.spawnMobs();
        console.log(`👾 SpawnMobs finalizado. Total mobs: ${this.mobs.length}`);
        
        // Forçar render inicial
        console.log('🎨 Forçando render inicial...');
        this.render();
        
        // Start game loop
        this.isRunning = true;
        this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.gameLoop();
        
        console.log('🎮 Game loop iniciado');
        return true;
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
    
    spawnMobs() {
        this.mobs = [];
        const mobTypes = Object.keys(MOBS);
        
        for (let i = 0; i < this.config.mobCount; i++) {
            const mobType = mobTypes[i % mobTypes.length]; // Rotacionar tipos
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
                speed: 30 + Math.random() * 40, // Velocidade variada
                direction: Math.random() * Math.PI * 2,
                
                // AI System
                aiState: 'patrolling', // idle, patrolling, aggro, fleeing, attacking
                lastDecision: 0,
                decisionCooldown: 1000, // ms
                target: null,
                fleeThreshold: 0.3, // 30% HP para fugir
                aggroRange: 100,
                attackRange: 30,
                patrolCenter: null,
                patrolRadius: 150,
                lastAttack: 0,
                attackCooldown: 2000 // ms
            });
        }
        
        // Inicializar centros de patrulha
        this.mobs.forEach(mob => {
            mob.patrolCenter = { x: mob.x, y: mob.y };
        });
        
        console.log(`👾 Spawned ${this.mobs.length} mobs with AI system`);
    }
    
    getMobColor(mobType) {
        const colors = {
            goblin: '#FF6B6B',
            wolf: '#8B4513',
            orc: '#4B0082'
        };
        return colors[mobType] || '#FF6B6B';
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;
        
        // Update FPS
        this.updateFPS(currentTime);
        
        // Update game state
        this.update(deltaTime);
        
        // Render
        this.render();
        
        // Update HUD
        this.updateHUD();
        
        // Continue loop
        if (this.isRunning && typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
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
        mob.hp -= this.config.attackDamage;
        this.addChatMessage(`⚔️ Você atacou ${mob.name}! (-${this.config.attackDamage} HP)`, '#FFD700');
        
        if (mob.hp <= 0) {
            // Mob defeated
            this.addChatMessage(`⚔️ Você derrotou ${mob.name}!`, '#FFD700');
            this.respawnMob(mob);
        }
    }
    
    respawnMob(mob) {
        mob.hp = mob.maxHp;
        mob.x = Math.random() * (this.canvas.width - 100) + 50;
        mob.y = Math.random() * (this.canvas.height - 100) + 50;
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
        // Mudar para patrulha após um tempo
        if (Math.random() < 0.3) {
            mob.aiState = 'patrolling';
        }
    }
    
    handlePatrolState(mob) {
        // Movimento aleatório dentro do raio de patrulha
        if (!mob.patrolCenter) {
            mob.patrolCenter = { x: mob.x, y: mob.y };
        }
        
        // Mudar direção ocasionalmente
        if (Math.random() < 0.1) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * mob.patrolRadius;
            mob.direction = angle;
        }
        
        // Manter dentro do raio de patrulha
        const distFromCenter = this.getDistance(mob, mob.patrolCenter);
        if (distFromCenter > mob.patrolRadius) {
            // Voltar para o centro
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
        
        // Perseguir player
        if (distance > mob.attackRange) {
            const angle = Math.atan2(
                mob.target.y - mob.y,
                mob.target.x - mob.x
            );
            mob.direction = angle;
        } else {
            // Dentro do range de ataque
            mob.aiState = 'attacking';
        }
    }
    
    handleFleeState(mob) {
        // Fugir na direção oposta ao player
        if (this.player) {
            const angle = Math.atan2(
                mob.y - this.player.y,
                mob.x - this.player.x
            );
            mob.direction = angle;
        }
        
        // Parar de fugir se HP recuperar
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
        
        // Atacar se estiver no range e cooldown acabou
        if (distance <= mob.attackRange && now - mob.lastAttack >= mob.attackCooldown) {
            this.mobAttackPlayer(mob, mob.target);
            mob.lastAttack = now;
        } else if (distance > mob.attackRange) {
            // Perseguir se sair do range
            mob.aiState = 'aggro';
        }
    }
    
    updateMobPosition(mob, deltaTime) {
        // Calcular movimento baseado no estado
        let speed = mob.speed;
        
        // Aumentar velocidade quando fugindo
        if (mob.aiState === 'fleeing') {
            speed *= 1.5;
        }
        
        // Reduzir velocidade quando perseguindo
        if (mob.aiState === 'aggro') {
            speed *= 0.8;
        }
        
        // Mover na direção atual
        const moveDistance = speed * deltaTime;
        mob.x += Math.cos(mob.direction) * moveDistance;
        mob.y += Math.sin(mob.direction) * moveDistance;
        
        // Manter dentro dos limites do canvas
        mob.x = Math.max(mob.size/2, Math.min(this.canvas.width - mob.size/2, mob.x));
        mob.y = Math.max(mob.size/2, Math.min(this.canvas.height - mob.size/2, mob.y));
        
        // Mudar direção se bater na parede
        if (mob.x <= mob.size/2 || mob.x >= this.canvas.width - mob.size/2 ||
            mob.y <= mob.size/2 || mob.y >= this.canvas.height - mob.size/2) {
            mob.direction = Math.random() * Math.PI * 2;
        }
    }
    
    mobAttackPlayer(mob, player) {
        // Calcular dano
        const baseDamage = mob.atk;
        const variance = 0.2; // 20% de variação
        const damage = Math.round(baseDamage * (1 + (Math.random() - 0.5) * variance));
        
        // Aplicar dano (sistema visual por enquanto)
        console.log(`⚔️ ${mob.name} atacou player! (-${damage} HP)`);
        this.addChatMessage(`⚔️ ${mob.name} atacou você! (-${damage} HP)`, '#FF6B6B');
        
        // Knockback visual
        const knockbackAngle = Math.atan2(player.y - mob.y, player.x - mob.x);
        const knockbackDistance = 20;
        player.x += Math.cos(knockbackAngle) * knockbackDistance;
        player.y += Math.sin(knockbackAngle) * knockbackDistance;
        
        // Manter player nos limites
        player.x = Math.max(player.size/2, Math.min(this.canvas.width - player.size/2, player.x));
        player.y = Math.max(player.size/2, Math.min(this.canvas.height - player.size/2, player.y));
    }
    
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    calculatePath(mob, target) {
        // Pathfinding simples (linha reta por enquanto)
        return [
            { x: mob.x, y: mob.y },
            { x: target.x, y: target.y }
        ];
    }
    
    avoidObstacles(mob, obstacles) {
        // Sistema simples de evasão de obstáculos
        let nextPos = {
            x: mob.x + Math.cos(mob.direction) * mob.speed * 0.016,
            y: mob.y + Math.sin(mob.direction) * mob.speed * 0.016
        };
        
        // Verificar colisões com obstáculos
        for (const obs of obstacles) {
            if (this.checkRectCollision(nextPos, mob.size, obs)) {
                // Mudar direção para evitar obstáculo
                mob.direction += Math.PI / 2; // Virar 90 graus
                nextPos = {
                    x: mob.x + Math.cos(mob.direction) * mob.speed * 0.016,
                    y: mob.y + Math.sin(mob.direction) * mob.speed * 0.016
                };
                break;
            }
        }
        
        return nextPos;
    }
    
    checkRectCollision(pos, size, obstacle) {
        return pos.x < obstacle.x + obstacle.width &&
               pos.x + size > obstacle.x &&
               pos.y < obstacle.y + obstacle.height &&
               pos.y + size > obstacle.y;
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
        
        console.log('🎨🎨🎨 RENDER CHAMADO!');
        
        // Clear canvas com cor forte
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Texto gigante no centro
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAMEPLAY VISÍVEL', this.canvas.width / 2, this.canvas.height / 2);
        
        // Informações
        this.ctx.font = '32px Arial';
        this.ctx.fillText(`MOBS: ${this.mobs.length}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
        this.ctx.fillText(`PLAYER: ${this.player?.name || 'N/A'}`, this.canvas.width / 2, this.canvas.height / 2 + 120);
        
        // Desenhar mobs se existirem
        this.mobs.forEach((mob, index) => {
            console.log(`👾 Desenhando mob ${index}: ${mob.name}`);
            
            this.ctx.fillStyle = mob.color || '#FFFF00';
            this.ctx.fillRect(mob.x - 50, mob.y - 50, 100, 100);
            
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(mob.name, mob.x, mob.y);
        });
        
        // Desenhar player se existir
        if (this.player) {
            console.log(`🦸 Desenhando player: ${this.player.name}`);
            
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(this.player.x - 50, this.player.y - 50, 100, 100);
            
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.player.name, this.player.x, this.player.y);
        }
        
        console.log('🎨🎨🎨 RENDER FINALIZADO!');
    }
    
    getAIStateColor(aiState) {
        const colors = {
            idle: '#808080',
            patrolling: '#4169E1',
            aggro: '#FF4500',
            fleeing: '#FFD700',
            attacking: '#FF0000'
        };
        return colors[aiState] || '#FFFFFF';
    }
    
    drawMinimap() {
        if (!this.minimap || !this.minimapCtx) return;
        
        // Clear minimap
        this.minimapCtx.fillStyle = '#1a1a2e';
        this.minimapCtx.fillRect(0, 0, this.minimap.width, this.minimap.height);
        
        // Draw player on minimap
        if (this.player) {
            const scaleX = this.minimap.width / this.canvas.width;
            const scaleY = this.minimap.height / this.canvas.height;
            
            this.minimapCtx.fillStyle = '#4CAF50';
            this.minimapCtx.fillRect(
                this.player.x * scaleX - 2,
                this.player.y * scaleY - 2,
                4, 4
            );
        }
        
        // Draw mobs on minimap
        this.mobs.forEach(mob => {
            const scaleX = this.minimap.width / this.canvas.width;
            const scaleY = this.minimap.height / this.canvas.height;
            
            this.minimapCtx.fillStyle = mob.color || '#FF6B6B';
            this.minimapCtx.fillRect(
                mob.x * scaleX - 1,
                mob.y * scaleY - 1,
                2, 2
            );
        });
    }
    
    drawGrid(theme) {
        this.ctx.strokeStyle = theme.grid;
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawMobHUD(mob) {
        // HP bar
        const hpPercent = mob.hp / mob.maxHp;
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(mob.x - mob.size/2, mob.y - mob.size/2 - 15, mob.size, 4);
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(mob.x - mob.size/2, mob.y - mob.size/2 - 15, mob.size * hpPercent, 4);
        
        // Name com tipo
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${mob.name} (${mob.type})`, mob.x, mob.y - mob.size/2 - 20);
        
        // Stats adicionais
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText(`⚔${mob.atk} 🛡${mob.def}`, mob.x, mob.y - mob.size/2 - 35);
    }
    
    drawPlayerHUD() {
        // Name
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.player.name, this.player.x, this.player.y - this.player.size/2 - 5);
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
        this.minimapCtx.fillStyle = '#FF6B6B';
        this.mobs.forEach(mob => {
            this.minimapCtx.fillRect(mob.x * scale - 1, mob.y * scale - 1, 2, 2);
        });
        
        // Draw player
        this.minimapCtx.fillStyle = '#4CAF50';
        this.minimapCtx.fillRect(this.player.x * scale - 2, this.player.y * scale - 2, 4, 4);
    }
    
    updateHUD() {
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
            const hpPercent = this.player.hp / this.player.maxHp;
            healthFill.style.width = `${hpPercent * 100}%`;
        }
        if (hpText) hpText.textContent = `${this.player.hp}/${this.player.maxHp}`;
        if (positionText) positionText.textContent = `${Math.round(this.player.x)}, ${Math.round(this.player.y)}`;
        if (mobCount) mobCount.textContent = this.mobs.length;
        if (fpsText) fpsText.textContent = `${Math.round(this.fps)} FPS`;
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        if (currentTime - this.fpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = currentTime;
        }
    }
    
    addChatMessage(message, color = '#FFFFFF') {
        // Add message to chat (implementation depends on UI)
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
    
    // Sistema de temas
    changeTheme(themeName) {
        if (THEMES[themeName]) {
            this.config.currentTheme = themeName;
            this.addChatMessage(`🌍 Tema alterado para: ${themeName}`, '#00FF00');
            console.log(`🎨 Theme changed to: ${themeName}`);
        }
    }
    
    // Sistema de combate melhorado
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
            if (this.player.exp) {
                this.player.exp += expGained;
                this.player.gold = (this.player.gold || 0) + goldGained;
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
