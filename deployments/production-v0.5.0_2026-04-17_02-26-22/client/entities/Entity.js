/**
 * Base Entity Class
 * All game entities inherit from this class
 */

class Entity {
    constructor(config = {}) {
        // Core properties
        this.id = config.id || null;
        this.type = config.type || 'entity';
        this.name = config.name || 'Unknown Entity';
        this.x = config.x || 0;
        this.y = config.y || 0;
        
        // Visual properties
        this.sprite = config.sprite || null;
        this.color = config.color || '#ffffff';
        this.visible = config.visible !== false;
        this.opacity = config.opacity || 1.0;
        
        // Physical properties
        this.width = config.width || 1;
        this.height = config.height || 1;
        this.solid = config.solid !== false;
        this.blocking = config.blocking !== false;
        
        // State
        this.active = config.active !== false;
        this.alive = config.alive !== false;
        this.health = config.health || 100;
        this.maxHealth = config.maxHealth || this.health;
        
        // Movement
        this.speed = config.speed || 1.0;
        this.movementSpeed = config.movementSpeed || 1.0;
        this.canMove = config.canMove !== false;
        
        // Combat
        this.attack = config.attack || 0;
        this.defense = config.defense || 0;
        this.level = config.level || 1;
        this.experience = config.experience || 0;
        
        // Status effects
        this.statusEffects = [];
        this.immunities = config.immunities || [];
        
        // Interaction
        this.interactive = config.interactive || false;
        this.dialogue = config.dialogue || null;
        
        // Metadata
        this.metadata = config.metadata || {};
        this.tags = config.tags || [];
        
        // Animation
        this.animationState = 'idle';
        this.animationTime = 0;
        this.animationOffset = Math.random() * Math.PI * 2;
        
        // References
        this.entityManager = null;
        this.world = null;
        
        // Events
        this.eventHandlers = {};
        
        // Performance
        this.lastUpdate = 0;
        this.updateInterval = config.updateInterval || 100; // ms
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Override in subclasses
    }
    
    update(deltaTime) {
        const now = Date.now();
        if (now - this.lastUpdate < this.updateInterval) {
            return;
        }
        
        this.lastUpdate = now;
        this.animationTime += deltaTime;
        
        // Update status effects
        this.updateStatusEffects(deltaTime);
        
        // Update animation state
        this.updateAnimation(deltaTime);
        
        // Custom update logic
        this.onUpdate(deltaTime);
    }
    
    onUpdate(deltaTime) {
        // Override in subclasses
    }
    
    render(renderer) {
        if (!this.visible) return;
        
        const ctx = renderer.ctx;
        const screenPos = renderer.camera.worldToScreen(
            this.x * 32,
            this.y * 32
        );
        
        // Apply opacity
        ctx.globalAlpha = this.opacity;
        
        // Render sprite or fallback
        if (this.sprite) {
            renderer.drawSprite(this.sprite, screenPos.x, screenPos.y);
        } else {
            this.renderFallback(ctx, screenPos.x, screenPos.y);
        }
        
        // Render custom effects
        this.renderEffects(ctx, screenPos.x, screenPos.y);
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
    }
    
    renderFallback(ctx, x, y) {
        ctx.fillStyle = this.color;
        ctx.fillRect(x + 5, y + 5, 32 - 10, 32 - 10);
    }
    
    renderEffects(ctx, x, y) {
        // Override in subclasses for special rendering effects
    }
    
    updateAnimation(deltaTime) {
        // Simple idle animation
        if (this.animationState === 'idle') {
            // Breathing effect
            const wobble = Math.sin(this.animationTime / 1000 + this.animationOffset) * 2;
            this.renderOffset = { x: 0, y: wobble };
        }
    }
    
    // Movement methods
    moveTo(x, y) {
        if (!this.canMove) return false;
        
        // Check if movement is valid
        if (!this.canMoveTo(x, y)) return false;
        
        this.x = x;
        this.y = y;
        
        this.emit('move', { x, y });
        return true;
    }
    
    moveBy(dx, dy) {
        return this.moveTo(this.x + dx, this.y + dy);
    }
    
    canMoveTo(x, y) {
        // Check boundaries
        if (x < 0 || y < 0) return false;
        
        // Check map collision if available
        if (this.world && this.world.mapData) {
            if (x >= this.world.mapData.width || y >= this.world.mapData.height) {
                return false;
            }
            if (!this.world.mapData.isWalkable(x, y)) {
                return false;
            }
        }
        
        // Check entity collision
        if (this.entityManager) {
            const entities = this.entityManager.getEntitiesAt(x, y);
            for (const entity of entities) {
                if (entity !== this && entity.blocking) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    getDistanceTo(other) {
        if (typeof other === 'object') {
            return Math.sqrt(
                Math.pow(other.x - this.x, 2) + 
                Math.pow(other.y - this.y, 2)
            );
        } else {
            return Math.sqrt(
                Math.pow(other - this.x, 2) + 
                Math.pow(arguments[1] - this.y, 2)
            );
        }
    }
    
    // Combat methods
    takeDamage(amount, source = 'unknown', type = 'physical') {
        if (this.immunities.includes(type)) {
            this.emit('damage_immuned', { amount, source, type });
            return 0;
        }
        
        // Apply defense
        const actualDamage = Math.max(1, amount - this.defense);
        this.health = Math.max(0, this.health - actualDamage);
        
        this.emit('damage', { amount: actualDamage, source, type });
        
        if (this.health <= 0) {
            this.die(source);
        }
        
        return actualDamage;
    }
    
    heal(amount) {
        const actualHeal = Math.min(amount, this.maxHealth - this.health);
        this.health += actualHeal;
        
        this.emit('heal', { amount: actualHeal });
        return actualHeal;
    }
    
    die(source = 'unknown') {
        this.alive = false;
        this.active = false;
        
        this.emit('death', { source });
    }
    
    revive(health = null) {
        this.alive = true;
        this.active = true;
        this.health = health || this.maxHealth;
        
        this.emit('revive', { health: this.health });
    }
    
    // Status effects
    addStatusEffect(effect) {
        if (this.immunities.includes(effect.type)) {
            return false;
        }
        
        // Check if effect already exists
        const existing = this.statusEffects.find(e => e.type === effect.type);
        if (existing) {
            // Refresh duration
            existing.duration = effect.duration;
            existing.startTime = Date.now();
            return false;
        }
        
        effect.startTime = Date.now();
        this.statusEffects.push(effect);
        
        this.emit('status_effect_added', effect);
        return true;
    }
    
    removeStatusEffect(effectType) {
        const index = this.statusEffects.findIndex(e => e.type === effectType);
        if (index > -1) {
            const effect = this.statusEffects.splice(index, 1)[0];
            this.emit('status_effect_removed', effect);
            return effect;
        }
        return null;
    }
    
    hasStatusEffect(effectType) {
        return this.statusEffects.some(e => e.type === effectType);
    }
    
    updateStatusEffects(deltaTime) {
        for (let i = this.statusEffects.length - 1; i >= 0; i--) {
            const effect = this.statusEffects[i];
            const elapsed = Date.now() - effect.startTime;
            
            if (elapsed >= effect.duration) {
                this.removeStatusEffect(effect.type);
            } else {
                // Apply effect
                this.applyStatusEffect(effect, deltaTime);
            }
        }
    }
    
    applyStatusEffect(effect, deltaTime) {
        switch (effect.type) {
            case 'poison':
                if (effect.damage) {
                    this.takeDamage(effect.damage * deltaTime / 1000, 'poison', 'poison');
                }
                break;
            case 'regeneration':
                if (effect.heal) {
                    this.heal(effect.heal * deltaTime / 1000);
                }
                break;
            case 'speed':
                this.movementSpeed = effect.multiplier || 1.0;
                break;
            case 'freeze':
                this.canMove = false;
                break;
        }
    }
    
    // Interaction methods
    interact(interactor) {
        if (!this.interactive) return null;
        
        this.emit('interact', interactor);
        
        if (this.dialogue) {
            return {
                type: 'dialogue',
                dialogue: this.dialogue
            };
        }
        
        return null;
    }
    
    // Event system
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }
    
    off(event, handler) {
        if (this.eventHandlers[event]) {
            const index = this.eventHandlers[event].indexOf(handler);
            if (index > -1) {
                this.eventHandlers[event].splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.eventHandlers[event]) {
            for (const handler of this.eventHandlers[event]) {
                handler(data);
            }
        }
    }
    
    // Utility methods
    hasTag(tag) {
        return this.tags.includes(tag);
    }
    
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
        }
    }
    
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index > -1) {
            this.tags.splice(index, 1);
        }
    }
    
    setMetadata(key, value) {
        this.metadata[key] = value;
    }
    
    getMetadata(key, defaultValue = null) {
        return this.metadata.hasOwnProperty(key) ? this.metadata[key] : defaultValue;
    }
    
    // Serialization
    serialize() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            x: this.x,
            y: this.y,
            sprite: this.sprite,
            color: this.color,
            visible: this.visible,
            opacity: this.opacity,
            width: this.width,
            height: this.height,
            solid: this.solid,
            blocking: this.blocking,
            active: this.active,
            alive: this.alive,
            health: this.health,
            maxHealth: this.maxHealth,
            speed: this.speed,
            movementSpeed: this.movementSpeed,
            canMove: this.canMove,
            attack: this.attack,
            defense: this.defense,
            level: this.level,
            experience: this.experience,
            statusEffects: this.statusEffects,
            immunities: this.immunities,
            interactive: this.interactive,
            dialogue: this.dialogue,
            metadata: this.metadata,
            tags: this.tags
        };
    }
    
    deserialize(data) {
        this.id = data.id;
        this.type = data.type;
        this.name = data.name;
        this.x = data.x;
        this.y = data.y;
        this.sprite = data.sprite;
        this.color = data.color;
        this.visible = data.visible;
        this.opacity = data.opacity;
        this.width = data.width;
        this.height = data.height;
        this.solid = data.solid;
        this.blocking = data.blocking;
        this.active = data.active;
        this.alive = data.alive;
        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.speed = data.speed;
        this.movementSpeed = data.movementSpeed;
        this.canMove = data.canMove;
        this.attack = data.attack;
        this.defense = data.defense;
        this.level = data.level;
        this.experience = data.experience;
        this.statusEffects = data.statusEffects || [];
        this.immunities = data.immunities || [];
        this.interactive = data.interactive;
        this.dialogue = data.dialogue;
        this.metadata = data.metadata || {};
        this.tags = data.tags || [];
    }
    
    reset(config = {}) {
        // Reset to initial state
        this.health = this.maxHealth;
        this.alive = true;
        this.active = true;
        this.statusEffects = [];
        this.animationState = 'idle';
        this.animationTime = 0;
        
        // Apply new config
        Object.assign(this, config);
    }
    
    // Cleanup
    cleanup() {
        this.eventHandlers = {};
        this.statusEffects = [];
        this.entityManager = null;
        this.world = null;
    }
    
    // Debug
    getDebugInfo() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            position: `${this.x},${this.y}`,
            health: `${this.health}/${this.maxHealth}`,
            level: this.level,
            active: this.active,
            alive: this.alive,
            statusEffects: this.statusEffects.length,
            tags: this.tags.join(', ')
        };
    }
}

export default Entity;
