/**
 * Monster Renderer
 * Handles rendering of monsters with aggressive animations
 */

class MonsterRenderer {
    constructor(ctx, spriteManager) {
        this.ctx = ctx;
        this.spriteManager = spriteManager;
        
        // Monster types and behaviors
        this.monsterTypes = {
            goblin: {
                name: 'Goblin Saqueador',
                behavior: 'aggressive',
                health: 50,
                damage: 8,
                speed: 1.2,
                color: '#4CAF50'
            },
            wolf: {
                name: 'Lobo Cinzento',
                behavior: 'aggressive',
                health: 40,
                damage: 12,
                speed: 1.8,
                color: '#795548'
            }
        };
        
        // Monster states
        this.states = {
            IDLE: 'idle',
            WALK: 'walk',
            ATTACK: 'attack',
            HURT: 'hurt',
            DIE: 'die',
            CHASE: 'walk'
        };
    }
    
    /**
     * Render a monster with animations
     */
    render(monster, gameTime) {
        const { x, y, type, direction, state, health, maxHealth } = monster;
        
        // Get sprite for monster type
        const sprite = this.spriteManager.getMonsterSprite(type);
        if (!sprite || !sprite.loaded) {
            this.renderFallback(x, y, type);
            return;
        }
        
        // Calculate animation frame
        const animationType = this.states[state] || this.states.IDLE;
        const frameIndex = this.getAnimationFrame(monster, gameTime, animationType);
        
        this.ctx.save();
        
        // Apply damage effect
        if (state === this.states.HURT) {
            this.ctx.globalAlpha = 0.7;
            this.shakeEffect(gameTime);
        }
        
        // Draw shadow
        this.drawShadow(x, y);
        
        // Draw monster sprite
        this.spriteManager.drawAnimatedSprite(
            this.ctx,
            `monster_${type}`,
            animationType,
            x * 64 + 64 / 2,
            y * 64 + 64 / 2,
            frameIndex,
            1.0
        );
        
        // Draw health bar
        this.drawHealthBar(x, y, health, maxHealth);
        
        // Draw danger indicator
        if (this.isAggressive(type)) {
            this.drawDangerIndicator(x, y);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Calculate animation frame with attack timing
     */
    getAnimationFrame(monster, gameTime, animationType) {
        const { state, stateStartTime, direction } = monster;
        
        const animation = this.spriteManager.animations.monster[animationType];
        if (!animation) return 0;
        
        const elapsed = gameTime - (stateStartTime || gameTime);
        const frameDuration = animation.speed;
        const totalFrames = animation.frames;
        
        let frameIndex = Math.floor(elapsed / frameDuration) % totalFrames;
        
        // Special case for attack - show attack frame only once
        if (state === this.states.ATTACK) {
            frameIndex = elapsed < frameDuration ? 0 : 1;
        }
        
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
     * Draw monster shadow
     */
    drawShadow(x, y) {
        const shadowSize = 64 * 0.8;
        const shadowX = x * 64 + 64 / 2 - shadowSize / 2;
        const shadowY = y * 64 + 64 - shadowSize / 4;
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(139, 69, 19, 0.4)'; // Brown shadow for monsters
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
     * Draw health bar with monster styling
     */
    drawHealthBar(x, y, health, maxHealth) {
        if (!health || !maxHealth || health >= maxHealth) return;
        
        const barWidth = 64 * 0.8;
        const barHeight = 4;
        const barX = x * 64 + 64 / 2 - barWidth / 2;
        const barY = y * 64 - 20;
        
        const healthPercent = health / maxHealth;
        
        this.ctx.save();
        
        // Background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health fill with monster colors
        const healthColor = healthPercent > 0.5 ? '#F44336' : 
                          healthPercent > 0.25 ? '#FF9800' : '#D32F2F';
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        this.ctx.restore();
    }
    
    /**
     * Draw danger indicator for aggressive monsters
     */
    drawDangerIndicator(x, y) {
        const indicatorX = x * 64 + 64 / 2;
        const indicatorY = y * 64 - 30;
        
        this.ctx.save();
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        
        // Pulsing red indicator
        const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
        this.ctx.fillStyle = `rgba(244, 67, 54, ${pulse})`;
        this.ctx.fillText('⚠️', indicatorX, indicatorY);
        
        this.ctx.restore();
    }
    
    /**
     * Screen shake effect for damage
     */
    shakeEffect(gameTime) {
        const shakeIntensity = 5;
        const shakeX = (Math.random() - 0.5) * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * shakeIntensity;
        
        this.ctx.translate(shakeX, shakeY);
    }
    
    /**
     * Check if monster is aggressive
     */
    isAggressive(type) {
        const monsterInfo = this.monsterTypes[type];
        return monsterInfo && monsterInfo.behavior === 'aggressive';
    }
    
    /**
     * Get monster info by type
     */
    getMonsterInfo(type) {
        return this.monsterTypes[type];
    }
    
    /**
     * Fallback rendering when sprite is not loaded
     */
    renderFallback(x, y, type) {
        const monsterInfo = this.monsterTypes[type];
        if (!monsterInfo) return;
        
        this.ctx.save();
        this.ctx.fillStyle = monsterInfo.color;
        
        const monsterX = x * 64 + 64 / 2;
        const monsterY = y * 64 + 64 / 2;
        const size = 64 * 0.8;
        
        // Draw monster body
        this.ctx.beginPath();
        this.ctx.arc(monsterX, monsterY, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw monster symbol
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const symbols = {
            goblin: '👺',
            wolf: '🐺'
        };
        
        this.ctx.fillText(symbols[type] || '👹', monsterX, monsterY);
        this.ctx.restore();
    }
    
    /**
     * Render multiple monsters in batch
     */
    renderBatch(monsters, gameTime) {
        // Sort by Y position for proper depth ordering
        monsters.sort((a, b) => a.y - b.y);
        
        monsters.forEach(monster => {
            this.render(monster, gameTime);
        });
    }
    
    /**
     * Create monster preview for UI
     */
    createPreview(type, size = 64) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const tempMonster = {
            x: 0.5,
            y: 0.5,
            type,
            direction: 'DOWN',
            state: 'idle',
            health: this.monsterTypes[type]?.health || 50,
            maxHealth: this.monsterTypes[type]?.health || 50
        };
        
        const tempRenderer = new MonsterRenderer(ctx, this.spriteManager);
        tempRenderer.render(tempMonster, 0);
        
        return canvas;
    }
    
    /**
     * Create death effect
     */
    createDeathEffect(x, y, type) {
        const particles = 15;
        const monsterInfo = this.monsterTypes[type];
        
        return {
            x: x * TILE_SIZE + TILE_SIZE / 2,
            y: y * TILE_SIZE + TILE_SIZE / 2,
            particles: Array.from({ length: particles }, (_, i) => ({
                x: (Math.random() - 0.5) * TILE_SIZE,
                y: (Math.random() - 0.5) * TILE_SIZE,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4 - 2,
                size: Math.random() * 4 + 2,
                color: monsterInfo?.color || '#FF0000',
                life: 1.0
            }))
        };
    }
    
    /**
     * Update and render death particles
     */
    updateDeathEffect(effect, deltaTime) {
        effect.particles = effect.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 0.2 * deltaTime; // Gravity
            particle.life -= deltaTime * 2;
            
            if (particle.life <= 0) return false;
            
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(
                effect.x + particle.x - particle.size/2,
                effect.y + particle.y - particle.size/2,
                particle.size,
                particle.size
            );
            this.ctx.restore();
            
            return true;
        });
    }
}

// Global instance
window.MonsterRenderer = MonsterRenderer;
