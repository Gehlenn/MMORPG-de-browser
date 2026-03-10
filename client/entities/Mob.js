/**
 * Mob Entity Client
 * Represents a mob entity on the client side
 */

class Mob {
    constructor(data) {
        this.id = data.id;
        this.type = data.type;
        this.name = data.name;
        this.x = data.x;
        this.y = data.y;
        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.damage = data.damage;
        this.speed = data.speed;
        this.color = data.color;
        this.size = data.size;
        this.xpValue = data.xpValue;
        this.isDead = false;
        
        // Animation properties
        this.animationTime = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    /**
     * Update mob animation and state
     */
    update(deltaTime) {
        if (this.isDead) return;
        
        // Simple bobbing animation
        this.animationTime += deltaTime;
        this.bobOffset += deltaTime * 2;
    }
    
    /**
     * Take damage
     */
    takeDamage(damage) {
        if (this.isDead) return;
        
        this.health -= damage;
        console.log(`🗡️ ${this.name} took ${damage} damage! HP: ${this.health}/${this.maxHealth}`);
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            console.log(`💀 ${this.name} died! +${this.xpValue} XP`);
        }
    }
    
    /**
     * Get current render position with animation
     */
    getRenderPosition() {
        const bobAmount = Math.sin(this.bobOffset) * 2;
        return {
            x: this.x,
            y: this.y + bobAmount
        };
    }
    
    /**
     * Check if mob is within range of position
     */
    isInRange(x, y, range) {
        const distance = Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
        return distance <= range;
    }
    
    /**
     * Get mob info for debugging
     */
    getInfo() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            position: `(${Math.round(this.x)}, ${Math.round(this.y)})`,
            health: `${this.health}/${this.maxHealth}`,
            isDead: this.isDead
        };
    }
}

// Export for global access
window.Mob = Mob;
