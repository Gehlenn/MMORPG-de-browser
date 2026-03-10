/**
 * Character Renderer
 * Handles rendering of player characters with race-specific sprites
 */

class CharacterRenderer {
    constructor(ctx, spriteManager) {
        this.ctx = ctx;
        this.spriteManager = spriteManager;
        
        // Character animation states
        this.animations = {
            IDLE: 'idle',
            WALK: 'walk',
            ATTACK: 'attack',
            HURT: 'hurt',
            DIE: 'die'
        };
        
        // Direction mappings
        this.directions = {
            DOWN: 0,
            LEFT: 1,
            RIGHT: 2,
            UP: 3
        };
        
        // Race-specific color tints
        this.raceColors = {
            human: { r: 255, g: 255, b: 255 },
            elf: { r: 200, g: 255, b: 200 },
            dwarf: { r: 255, g: 200, b: 150 },
            orc: { r: 150, g: 255, b: 150 }
        };
    }
    
    /**
     * Render a character with animations
     */
    render(character, gameTime) {
        const { x, y, race, class: characterClass, direction, state, level } = character;
        
        // Get sprite for race
        const sprite = this.spriteManager.getPlayerSprite(race);
        if (!sprite || !sprite.loaded) {
            this.renderFallback(x, y, race);
            return;
        }
        
        // Calculate animation frame
        const animationType = this.animations[state] || this.animations.IDLE;
        const frameIndex = this.getAnimationFrame(character, gameTime, animationType);
        
        // Apply race-specific tint
        this.ctx.save();
        
        // Draw shadow
        this.drawShadow(x, y);
        
        // Draw character sprite
        this.spriteManager.drawAnimatedSprite(
            this.ctx,
            `player_${race}`,
            animationType,
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            frameIndex,
            1.0
        );
        
        // Draw class indicator
        this.drawClassIndicator(x, y, characterClass, level);
        
        // Draw health bar
        this.drawHealthBar(x, y, character);
        
        this.ctx.restore();
    }
    
    /**
     * Calculate animation frame based on character state and time
     */
    getAnimationFrame(character, gameTime, animationType) {
        const { state, stateStartTime, direction } = character;
        
        // Get animation config
        const animation = this.spriteManager.animations.player[animationType];
        if (!animation) return 0;
        
        // Calculate frame based on time
        const elapsed = gameTime - (stateStartTime || gameTime);
        const frameDuration = animation.speed;
        const totalFrames = animation.frames;
        
        const frameIndex = Math.floor(elapsed / frameDuration) % totalFrames;
        
        // Add direction offset (4 directions * frames per animation)
        const directionOffset = (this.directions[direction] || 0) * totalFrames;
        
        return frameIndex + directionOffset;
    }
    
    /**
     * Draw character shadow
     */
    drawShadow(x, y) {
        const shadowSize = 64;
        const shadowX = x * 64 + 64 / 2 - shadowSize / 2;
        const shadowY = y * 64 + 64 - shadowSize / 4;
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
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
     * Draw class indicator above character
     */
    drawClassIndicator(x, y, characterClass, level) {
        const indicatorX = x * 64 + 64 / 2;
        const indicatorY = y * 64 - 10;
        
        // Class icons
        const classIcons = {
            recruta: '⚔️',
            warrior: '🗡️',
            mage: '🔮',
            archer: '🏹',
            rogue: '🗡️'
        };
        
        const icon = classIcons[characterClass] || classIcons.recruta;
        
        this.ctx.save();
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(icon, indicatorX, indicatorY);
        
        // Level indicator
        if (level > 1) {
            this.ctx.font = '10px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`Lv${level}`, indicatorX, indicatorY - 15);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Draw health bar above character
     */
    drawHealthBar(x, y, character) {
        const { health, maxHealth } = character;
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
        
        // Health fill
        const healthColor = healthPercent > 0.5 ? '#4CAF50' : 
                          healthPercent > 0.25 ? '#FF9800' : '#F44336';
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        this.ctx.restore();
    }
    
    /**
     * Fallback rendering when sprite is not loaded
     */
    renderFallback(x, y, race) {
        const colors = this.raceColors[race] || this.raceColors.human;
        
        this.ctx.save();
        this.ctx.fillStyle = `rgb(${colors.r}, ${colors.g}, ${colors.b})`;
        
        // Draw simple character representation
        const charX = x * 64 + 64 / 2;
        const charY = y * 64 + 64 / 2;
        const size = 64 * 0.6;
        
        this.ctx.beginPath();
        this.ctx.arc(charX, charY, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw race symbol
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const raceSymbols = {
            human: '👤',
            elf: '🧝',
            dwarf: '⛏️',
            orc: '👹'
        };
        
        this.ctx.fillText(raceSymbols[race] || raceSymbols.human, charX, charY);
        this.ctx.restore();
    }
    
    /**
     * Render multiple characters in batch
     */
    renderBatch(characters, gameTime) {
        // Sort by Y position for proper depth ordering
        characters.sort((a, b) => a.y - b.y);
        
        characters.forEach(character => {
            this.render(character, gameTime);
        });
    }
    
    /**
     * Create character preview for UI
     */
    createPreview(race, characterClass, size = 64) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const tempCharacter = {
            x: 0.5,
            y: 0.5,
            race,
            class: characterClass,
            direction: 'DOWN',
            state: 'IDLE',
            health: 100,
            maxHealth: 100,
            level: 1
        };
        
        // Scale down for preview
        const tempRenderer = new CharacterRenderer(ctx, this.spriteManager);
        tempRenderer.render(tempCharacter, 0);
        
        return canvas;
    }
}

// Global instance
window.CharacterRenderer = CharacterRenderer;
