/**
 * Main Game - Complete Gameplay with Tile Map
 * Full gameplay with movement, combat, mobs, XP, and Tibia-style map
 */

import { NetworkManager } from './multiplayer/NetworkManager.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.networkManager = null;
        this.player = null;
        this.mobs = new Map();
        this.input = null;
        this.worldLoaded = false;
        this.mapRenderer = null;
        this.gameMap = null;
        
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        console.log('Game initialized');
    }
    
    async init() {
        console.log('🎮 Initializing game systems...');
        
        // Initialize input
        this.input = new Input();
        this.setupInputCallbacks();
        
        // Initialize network
        this.networkManager = new NetworkManager();
        this.networkManager.game = this;
        await this.networkManager.connect();
        
        // Don't start game loop yet - wait for login flow
        console.log('⏳ Waiting for login and character selection...');
    }
    
    setupInputCallbacks() {
        // Movement callback
        this.input.onMove((dx, dy) => {
            if (this.player && this.worldLoaded) {
                this.movePlayer(dx, dy);
            }
        });
        
        // Attack callback
        this.input.onAttack((mouseX, mouseY) => {
            if (this.player && this.worldLoaded) {
                this.performAttack(mouseX, mouseY);
            }
        });
    }
    
    movePlayer(dx, dy) {
        if (!this.mapRenderer) return;
        
        const speed = 3; // pixels per frame
        const newX = this.player.x + dx * speed;
        const newY = this.player.y + dy * speed;
        
        // Check if new position is walkable
        const tile = this.mapRenderer.getTileAt(newX, newY);
        if (tile && this.mapRenderer.isTileWalkable(tile.x, tile.y)) {
            this.player.x = newX;
            this.player.y = newY;
            
            // Keep player in bounds
            this.player.x = Math.max(16, Math.min(this.gameMap.width * 32 - 16, this.player.x));
            this.player.y = Math.max(16, Math.min(this.gameMap.height * 32 - 16, this.player.y));
        }
        
        // Update UI
        this.updateUI();
    }
    
    performAttack(mouseX, mouseY) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const worldX = mouseX - canvasRect.left;
        const worldY = mouseY - canvasRect.top;
        
        console.log(`⚔️ Attacking at (${worldX}, ${worldY})`);
        
        // Send attack to server
        this.networkManager.socket.emit('player_attack', {
            x: this.player.x,
            y: this.player.y,
            targetX: worldX,
            targetY: worldY
        });
    }
    
    onWorldInit(data) {
        console.log('🌍 World initialized:', data);
        
        // Store map data
        this.gameMap = data.map;
        
        // Create map renderer
        this.mapRenderer = new MapRenderer(this.ctx, this.gameMap);
        
        // Create player
        this.player = new Player(data.player);
        
        // Create mobs
        this.mobs.clear();
        for (const mobData of data.entities) {
            const mob = new Mob(mobData);
            this.mobs.set(mob.id, mob);
        }
        
        this.worldLoaded = true;
        this.updateUI();
        
        // Start game loop only after world is loaded
        this.startGameLoop();
        
        console.log(`✅ Player spawned: ${this.player.name}`);
        console.log(`✅ Mobs spawned: ${this.mobs.size}`);
        console.log(`✅ Map loaded: ${this.gameMap.width}x${this.gameMap.height}`);
    }
    
    startGameLoop() {
        if (!this.gameLoopStarted) {
            this.gameLoopStarted = true;
            console.log('🎮 Starting game loop...');
            this.gameLoop();
        }
    }
    
    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        
        if (!this.worldLoaded) return;
        
        this.update();
        this.render();
    }
    
    update() {
        // Update input
        this.input.update();
        
        // Update player
        if (this.player) {
            this.player.update(1/60);
        }
        
        // Update mobs
        for (const mob of this.mobs.values()) {
            mob.update(1/60);
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw map first
        if (this.mapRenderer) {
            this.mapRenderer.draw();
        }
        
        // Draw entities
        this.drawEntities();
        
        // Draw UI
        this.drawUI();
    }
    
    drawEntities() {
        // Draw mobs
        for (const mob of this.mobs.values()) {
            this.drawMob(mob);
        }
        
        // Draw player
        if (this.player) {
            this.drawPlayer(this.player);
        }
    }
    
    drawPlayer(player) {
        // Player body
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.fillRect(player.x - 16, player.y - 16, 32, 32);
        
        // Player name
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.name, player.x, player.y - 25);
        
        // Health bar
        this.drawHealthBar(player.x, player.y - 30, player.health, player.maxHealth);
    }
    
    drawMob(mob) {
        if (mob.isDead) return;
        
        const pos = mob.getRenderPosition();
        
        // Mob body - red squares as requested
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(pos.x - 8, pos.y - 8, 16, 16);
        
        // Mob name
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(mob.name, pos.x, pos.y - 15);
        
        // Health bar
        this.drawHealthBar(pos.x, pos.y - 25, mob.health, mob.maxHealth);
    }
    
    drawHealthBar(x, y, health, maxHealth) {
        const barWidth = 40;
        const barHeight = 4;
        const healthPercentage = health / maxHealth;
        
        // Background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x - barWidth/2, y, barWidth, barHeight);
        
        // Health fill
        this.ctx.fillStyle = healthPercentage > 0.5 ? '#22c55e' : 
                            healthPercentage > 0.25 ? '#f59e0b' : '#ef4444';
        this.ctx.fillRect(x - barWidth/2, y, barWidth * healthPercentage, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - barWidth/2, y, barWidth, barHeight);
    }
    
    drawUI() {
        // Connection status
        this.ctx.fillStyle = '#22c55e';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Connected', this.canvas.width - 10, 30);
        
        // Map info
        if (this.gameMap) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Map: ${this.gameMap.width}x${this.gameMap.height}`, 10, this.canvas.height - 10);
        }
    }
    
    updateUI() {
        if (!this.player) return;
        
        document.getElementById('player-name').textContent = this.player.name || '-';
        document.getElementById('player-health').textContent = `${this.player.health || 100}/${this.player.maxHealth || 100}`;
        document.getElementById('player-level').textContent = this.player.level || 1;
        document.getElementById('player-xp').textContent = `${this.player.xp || 0}/${this.player.xpToNext || 100}`;
        document.getElementById('mob-count').textContent = this.mobs.size;
        document.getElementById('player-x').textContent = Math.round(this.player.x);
        document.getElementById('player-y').textContent = Math.round(this.player.y);
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init().catch(console.error);
    window.game = game;
});
