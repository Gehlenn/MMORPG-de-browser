/**
 * Main Game - Simplified with LoginManager
 * Clean architecture with LoginManager integration
 */

import { NetworkManager } from './multiplayer/NetworkManager.js';
import LoginManager from './ui/LoginManager.js';

class Game {
    constructor() {
        // Core systems
        this.networkManager = null;
        this.loginManager = null;
        this.player = null;
        this.worldLoaded = false;
        
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = null;
        
        console.log('🎮 Game initialized');
    }
    
    async init() {
        console.log('🎮 Initializing game systems...');
        
        // Initialize LoginManager first
        this.loginManager = new LoginManager(this);
        
        // Initialize NetworkManager
        this.networkManager = new NetworkManager(this);
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        console.log('✅ Game systems initialized');
    }
    
    // === LOGIN FLOW ===
    
    startGame(character) {
        console.log('🎮 Starting game with character:', character.name);
        
        this.player = character;
        
        // Setup canvas
        this.setupCanvas();
        
        // Request world data
        if (this.networkManager && this.networkManager.isConnected) {
            this.networkManager.requestWorld();
        } else {
            // Start local game
            this.startLocalGame();
        }
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        console.log('📐 Canvas setup complete');
    }
    
    startLocalGame() {
        console.log('🎮 Starting local game...');
        this.worldLoaded = true;
        this.gameLoop();
    }
    
    // === NETWORK CALLBACKS ===
    
    onWorldInit(data) {
        console.log('🌍 World data received:', data);
        
        this.player = data.player;
        this.mobs = new Map(data.entities.map(entity => [entity.id, entity]));
        this.worldLoaded = true;
        
        // Start game loop
        this.gameLoop();
    }
    
    // === GAME LOOP ===
    
    gameLoop() {
        if (!this.worldLoaded) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw player
        if (this.player) {
            this.drawPlayer();
        }
        
        // Draw mobs
        if (this.mobs) {
            this.drawMobs();
        }
        
        // Draw UI
        this.drawUI();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    drawPlayer() {
        if (!this.ctx || !this.player) return;
        
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(
            this.player.x - 16,
            this.player.y - 16,
            32,
            32
        );
        
        // Draw player name
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.player.name,
            this.player.x,
            this.player.y - 20
        );
    }
    
    drawMobs() {
        if (!this.ctx || !this.mobs) return;
        
        this.mobs.forEach(mob => {
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.fillRect(
                mob.x - 12,
                mob.y - 12,
                24,
                24
            );
            
            // Draw mob name
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                mob.name,
                mob.x,
                mob.y - 15
            );
        });
    }
    
    drawUI() {
        if (!this.ctx || !this.player) return;
        
        // Health bar
        const healthPercent = this.player.hp / this.player.maxHp;
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(10, 10, 200, 20);
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(10, 10, 200 * healthPercent, 20);
        
        // Player info
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${this.player.name} - Level ${this.player.level}`, 10, 50);
    }
}

// Initialize game when script loads
const game = new Game();
game.init().catch(console.error);

// Export for global access
window.game = game;
