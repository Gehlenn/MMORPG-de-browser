/**
 * Gameplay Engine - Sistema de Jogo Principal
 * Responsável pelo loop de gameplay, renderização e física
 * Version 0.3 - Gameplay Loop Funcional
 */

class GameplayEngine {
    constructor() {
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
            mobCount: 8,
            attackRange: 20,
            attackDamage: 10
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
        console.log('🎮 Iniciando gameplay...');
        
        // Setup canvas
        if (typeof document !== 'undefined') {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
            this.minimap = document.getElementById('minimap');
            this.minimapCtx = this.minimap ? this.minimap.getContext('2d') : null;
        }
        
        if (!this.canvas || !this.ctx) {
            console.error('❌ Canvas não encontrado');
            return false;
        }
        
        // Configure canvas
        this.resizeCanvas();
        
        // Initialize player
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: 32,
            speed: this.config.playerSpeed,
            ...characterData
        };
        
        // Initialize mobs
        this.spawnMobs();
        
        // Start game loop
        this.isRunning = true;
        this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.gameLoop();
        
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
        for (let i = 0; i < this.config.mobCount; i++) {
            this.mobs.push({
                id: `mob_${i}`,
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                size: 32,
                color: '#FF6B6B',
                name: `Goblin ${i + 1}`,
                hp: 30,
                maxHp: 30,
                speed: 50,
                direction: Math.random() * Math.PI * 2
            });
        }
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
    
    updateMobs(deltaTime) {
        this.mobs.forEach(mob => {
            // Random direction change
            if (Math.random() < 0.01) {
                mob.direction = Math.random() * Math.PI * 2;
            }
            
            // Move mob
            const mobMoveX = Math.cos(mob.direction) * mob.speed * deltaTime;
            const mobMoveY = Math.sin(mob.direction) * mob.speed * deltaTime;
            
            mob.x += mobMoveX;
            mob.y += mobMoveY;
            
            // Keep mob within bounds
            if (mob.x < mob.size/2 || mob.x > this.canvas.width - mob.size/2) {
                mob.direction = Math.PI - mob.direction;
                mob.x = Math.max(mob.size/2, Math.min(this.canvas.width - mob.size/2, mob.x));
            }
            if (mob.y < mob.size/2 || mob.y > this.canvas.height - mob.size/2) {
                mob.direction = -mob.direction;
                mob.y = Math.max(mob.size/2, Math.min(this.canvas.height - mob.size/2, mob.y));
            }
        });
    }
    
    checkCollisions() {
        this.mobs.forEach(mob => {
            const dist = Math.sqrt(Math.pow(this.player.x - mob.x, 2) + Math.pow(this.player.y - mob.y, 2));
            if (dist < (this.player.size + mob.size) / 2) {
                // Collision detected - visual feedback only
                // In a real game, this would cause damage
            }
        });
    }
    
    render() {
        if (!this.ctx || !this.canvas) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw mobs
        this.mobs.forEach(mob => {
            this.sprites.mob.draw(mob);
            this.drawMobHUD(mob);
        });
        
        // Draw player
        this.sprites.player.draw(this.player.x, this.player.y, this.player.size);
        this.drawPlayerHUD();
        
        // Draw minimap
        this.drawMinimap();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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
        
        // Name
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(mob.name, mob.x, mob.y - mob.size/2 - 20);
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameplayEngine;
} else if (typeof window !== 'undefined') {
    window.GameplayEngine = GameplayEngine;
}
