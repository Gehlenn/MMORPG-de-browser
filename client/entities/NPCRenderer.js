/**
 * NPC Renderer
 * Handles rendering of Non-Player Characters with specific sprites
 */

class NPCRenderer {
    constructor(ctx, spriteManager) {
        this.ctx = ctx;
        this.spriteManager = spriteManager;
        
        // NPC types and behaviors
        this.npcTypes = {
            innkeeper: {
                name: 'Taberneiro',
                behavior: 'static',
                interaction: 'dialogue',
                color: '#8B4513'
            },
            merchant: {
                name: 'Mercador',
                behavior: 'static',
                interaction: 'shop',
                color: '#FFD700'
            },
            captain: {
                name: 'Capitão',
                behavior: 'patrol',
                interaction: 'quest',
                color: '#4169E1'
            },
            explorer: {
                name: 'Explorador',
                behavior: 'wander',
                interaction: 'dialogue',
                color: '#228B22'
            },
            hermit: {
                name: 'Ermitão',
                behavior: 'static',
                interaction: 'dialogue',
                color: '#696969'
            },
            miner: {
                name: 'Minerador',
                behavior: 'work',
                interaction: 'trade',
                color: '#8B7355'
            },
            ranger: {
                name: 'Ranger',
                behavior: 'patrol',
                interaction: 'quest',
                color: '#006400'
            },
            sentinel: {
                name: 'Sentinela',
                behavior: 'guard',
                interaction: 'dialogue',
                color: '#8B0000'
            }
        };
    }
    
    /**
     * Render an NPC with animations
     */
    render(npc, gameTime) {
        const { x, y, type, direction, state, interactionRadius } = npc;
        
        // Get sprite for NPC type
        const sprite = this.spriteManager.getSprite(`npc_${type}`);
        if (!sprite || !sprite.loaded) {
            this.renderFallback(x, y, type);
            return;
        }
        
        // Calculate animation frame
        const animationType = this.getAnimationType(state);
        const frameIndex = this.getAnimationFrame(npc, gameTime, animationType);
        
        this.ctx.save();
        
        // Draw shadow
        this.drawShadow(x, y);
        
        // Draw NPC sprite
        const npcSprite = this.spriteManager.getSprite(`npc_${type}`);
        if (!npcSprite || !npcSprite.loaded) {
            this.renderFallback(x, y, type);
            return;
        }
        
        this.spriteManager.drawAnimatedSprite(
            this.ctx,
            `npc_${type}`,
            animationType,
            x * 64 + 64 / 2,
            y * 64 + 64 / 2,
            frameIndex,
            1.0
        );
        
        // Draw interaction indicator if player is nearby
        if (interactionRadius && this.shouldShowInteraction(npc)) {
            this.drawInteractionIndicator(x, y);
        }
        
        // Draw NPC name
        this.drawName(x, y, type);
        
        // Draw health bar if NPC has health
        if (npc.health !== undefined) {
            this.drawHealthBar(x, y, npc);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Get animation type based on NPC state
     */
    getAnimationType(state) {
        const animationMap = {
            idle: 'idle',
            walking: 'walk',
            talking: 'talk',
            working: 'walk',
            patrolling: 'walk'
        };
        
        return animationMap[state] || 'idle';
    }
    
    /**
     * Calculate animation frame
     */
    getAnimationFrame(npc, gameTime, animationType) {
        const { state, stateStartTime, direction } = npc;
        
        const animation = this.spriteManager.animations.npc[animationType];
        if (!animation) return 0;
        
        const elapsed = gameTime - (stateStartTime || gameTime);
        const frameDuration = animation.speed;
        const totalFrames = animation.frames;
        
        const frameIndex = Math.floor(elapsed / frameDuration) % totalFrames;
        
        // Add direction offset
        const directionOffset = (this.getDirectionIndex(direction) || 0) * totalFrames;
        
        return frameIndex + directionOffset;
    }
    
    /**
     * Get direction index
     */
    getDirectionIndex(direction) {
        const directions = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 };
        return directions[direction] || 0;
    }
    
    /**
     * Draw NPC shadow
     */
    drawShadow(x, y) {
        const shadowSize = 64 * 0.8;
        const shadowX = x * 64 + 64 / 2 - shadowSize / 2;
        const shadowY = y * 64 + 64 - shadowSize / 4;
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            shadowX + shadowSize / 2,
            shadowY + shadowSize / 2,
            shadowSize / 2,
            shadowSize / 4,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.restore();
    }
    
    /**
     * Draw interaction indicator
     */
    drawInteractionIndicator(x, y) {
        const indicatorX = x * 64 + 64 / 2;
        const indicatorY = y * 64 - 25;
        
        this.ctx.save();
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💬', indicatorX, indicatorY);
        this.ctx.restore();
    }
    
    /**
     * Draw NPC name
     */
    drawName(x, y, type) {
        const npcInfo = this.npcTypes[type];
        if (!npcInfo) return;
        
        const nameX = x * 64 + 64 / 2;
        const nameY = y * 64 + 64 + 5;
        
        this.ctx.save();
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFF';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        
        this.ctx.strokeText(npcInfo.name, nameX, nameY);
        this.ctx.fillText(npcInfo.name, nameX, nameY);
        this.ctx.restore();
    }
    
    /**
     * Draw health bar
     */
    drawHealthBar(x, y, npc) {
        const { health, maxHealth } = npc;
        if (!health || !maxHealth || health >= maxHealth) return;
        
        const barWidth = 64 * 0.8;
        const barHeight = 3;
        const barX = x * 64 + 64 / 2 - barWidth / 2;
        const barY = y * 64 - 20;
        
        const healthPercent = health / maxHealth;
        
        this.ctx.save();
        
        // Background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health fill
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        this.ctx.restore();
    }
    
    /**
     * Check if interaction indicator should be shown
     */
    shouldShowInteraction(npc) {
        // This would check player distance in a real implementation
        return npc.playerNearby || false;
    }
    
    /**
     * Fallback rendering when sprite is not loaded
     */
    renderFallback(x, y, type) {
        const npcInfo = this.npcTypes[type];
        if (!npcInfo) return;
        
        this.ctx.save();
        this.ctx.fillStyle = npcInfo.color;
        
        const npcX = x * 64 + 64 / 2;
        const npcY = y * 64 + 64 / 2;
        const size = 64 * 0.7;
        
        // Draw NPC body
        this.ctx.fillRect(npcX - size/2, npcY - size/2, size, size);
        
        // Draw NPC symbol
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const symbols = {
            innkeeper: '🍺',
            merchant: '🛒',
            captain: '⭐',
            explorer: '🧭',
            hermit: '🏚',
            miner: '⛏️',
            ranger: '🏹',
            sentinel: '🛡️'
        };
        
        this.ctx.fillText(symbols[type] || '👤', npcX, npcY);
        this.ctx.restore();
    }
    
    /**
     * Render multiple NPCs in batch
     */
    renderBatch(npcs, gameTime) {
        // Sort by Y position for proper depth ordering
        npcs.sort((a, b) => a.y - b.y);
        
        npcs.forEach(npc => {
            this.render(npc, gameTime);
        });
    }
    
    /**
     * Get NPC info by type
     */
    getNPCInfo(type) {
        return this.npcTypes[type];
    }
    
    /**
     * Create NPC preview for UI
     */
    createPreview(type, size = 64) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const tempNPC = {
            x: 0.5,
            y: 0.5,
            type,
            direction: 'DOWN',
            state: 'idle'
        };
        
        const tempRenderer = new NPCRenderer(ctx, this.spriteManager);
        tempRenderer.render(tempNPC, 0);
        
        return canvas;
    }
}

// Global instance
window.NPCRenderer = NPCRenderer;
