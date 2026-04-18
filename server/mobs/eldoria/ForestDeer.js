/**
 * ForestDeer.js
 * Passive mob that flees when attacked
 * Phase 3: Eldoria Zone
 */

class ForestDeer {
    constructor(zone, spawnPosition) {
        this.zone = zone;
        this.id = `deer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Position
        this.x = spawnPosition.x;
        this.y = spawnPosition.y;
        
        // Stats
        this.name = 'Forest Deer';
        this.level = 20;
        this.type = 'passive';
        this.behavior = 'flee';
        
        // Combat stats
        this.maxHp = 80;
        this.hp = this.maxHp;
        this.damage = 0; // Deer don't attack
        this.armor = 0;
        
        // XP and rewards
        this.xpValue = 15;
        this.drops = [
            { item: 'venison', chance: 0.8, minQty: 1, maxQty: 2 },
            { item: 'deer_hide', chance: 0.5, minQty: 1, maxQty: 1 },
            { item: 'antler', chance: 0.2, minQty: 1, maxQty: 1 }
        ];
        
        // Behavior state
        this.state = 'grazing'; // grazing, fleeing, wandering
        this.targetPosition = null;
        this.fleeTarget = null;
        
        // Movement
        this.speed = 2.5; // Slow when grazing
        this.fleeSpeed = 5; // Fast when fleeing
        this.lastMoveTime = 0;
        this.moveInterval = 2000; // Change behavior every 2s
        
        // Detection
        this.detectionRadius = 150;
        this.fleeDistance = 300;
        
        // Initialize
        this.startAI();
    }
    
    /**
     * Start AI behavior loop
     */
    startAI() {
        this.aiInterval = setInterval(() => {
            this.updateBehavior();
        }, this.moveInterval);
    }
    
    /**
     * Update behavior based on state
     */
    updateBehavior() {
        switch (this.state) {
            case 'grazing':
                this.grazingBehavior();
                break;
            case 'fleeing':
                this.fleeingBehavior();
                break;
            case 'wandering':
                this.wanderingBehavior();
                break;
        }
    }
    
    /**
     * Grazing behavior - slow movement, eating grass
     */
    grazingBehavior() {
        // Small random movement
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 20;
        
        this.x += Math.cos(angle) * distance;
        this.y += Math.sin(angle) * distance;
        
        // Keep within zone bounds
        this.constrainToZone();
    }
    
    /**
     * Fleeing behavior - run away from target
     */
    fleeingBehavior() {
        if (!this.fleeTarget) {
            this.state = 'wandering';
            return;
        }
        
        // Calculate direction away from threat
        const dx = this.x - this.fleeTarget.x;
        const dy = this.y - this.fleeTarget.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.fleeDistance) {
            // Safe distance reached, stop fleeing
            this.state = 'wandering';
            this.fleeTarget = null;
            return;
        }
        
        // Move away from threat
        if (distance > 0) {
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            this.x += normalizedX * this.fleeSpeed * 10;
            this.y += normalizedY * this.fleeSpeed * 10;
        }
        
        this.constrainToZone();
    }
    
    /**
     * Wandering behavior - normal movement
     */
    wanderingBehavior() {
        // Pick new random direction occasionally
        if (!this.targetPosition || Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            
            this.targetPosition = {
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance
            };
        }
        
        // Move toward target
        const dx = this.targetPosition.x - this.x;
        const dy = this.targetPosition.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            this.x += normalizedX * this.speed * 5;
            this.y += normalizedY * this.speed * 5;
        } else {
            // Reached target, go back to grazing
            this.state = 'grazing';
            this.targetPosition = null;
        }
        
        this.constrainToZone();
    }
    
    /**
     * Keep mob within zone bounds
     */
    constrainToZone() {
        if (this.zone && this.zone.config) {
            const bounds = this.zone.config.size;
            this.x = Math.max(0, Math.min(this.x, bounds.width));
            this.y = Math.max(0, Math.min(this.y, bounds.height));
        }
    }
    
    /**
     * Check for nearby threats and flee if necessary
     */
    checkForThreats(players) {
        if (this.state === 'fleeing') return; // Already fleeing
        
        for (const player of players) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.detectionRadius) {
                // Player detected, start fleeing
                this.state = 'fleeing';
                this.fleeTarget = { x: player.x, y: player.y };
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Take damage from attacker
     */
    takeDamage(amount, attacker) {
        this.hp -= amount;
        
        // Immediately flee from attacker
        this.state = 'fleeing';
        this.fleeTarget = { x: attacker.x, y: attacker.y };
        
        if (this.hp <= 0) {
            return this.die(attacker);
        }
        
        return {
            hp: this.hp,
            maxHp: this.maxHp,
            state: this.state
        };
    }
    
    /**
     * Handle death
     */
    die(killer) {
        clearInterval(this.aiInterval);
        
        // Generate drops
        const drops = this.generateDrops();
        
        // Emit death event
        this.zone.emit('mob:died', {
            mobId: this.id,
            mobType: 'forest_deer',
            killer: killer.id || killer,
            position: { x: this.x, y: this.y },
            drops: drops,
            xpValue: this.xpValue
        });
        
        return {
            died: true,
            drops: drops,
            xpValue: this.xpValue
        };
    }
    
    /**
     * Generate drops based on drop tables
     */
    generateDrops() {
        const drops = [];
        
        for (const drop of this.drops) {
            if (Math.random() <= drop.chance) {
                const quantity = Math.floor(
                    Math.random() * (drop.maxQty - drop.minQty + 1)
                ) + drop.minQty;
                
                drops.push({
                    item: drop.item,
                    quantity: quantity
                });
            }
        }
        
        return drops;
    }
    
    /**
     * Get mob data for client
     */
    getClientData() {
        return {
            id: this.id,
            type: 'forest_deer',
            name: this.name,
            x: Math.floor(this.x),
            y: Math.floor(this.y),
            hp: this.hp,
            maxHp: this.maxHp,
            level: this.level,
            state: this.state,
            isAggressive: false
        };
    }
    
    /**
     * Cleanup when removing mob
     */
    cleanup() {
        if (this.aiInterval) {
            clearInterval(this.aiInterval);
        }
    }
}

module.exports = ForestDeer;
