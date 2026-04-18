/**
 * WildBoar.js
 * Neutral mob that charges when provoked
 * Phase 3: Eldoria Zone
 */

class WildBoar {
    constructor(zone, spawnPosition) {
        this.zone = zone;
        this.id = `boar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Position
        this.x = spawnPosition.x;
        this.y = spawnPosition.y;
        
        // Stats
        this.name = 'Wild Boar';
        this.level = 22;
        this.type = 'neutral';
        this.behavior = 'charge';
        
        // Combat stats
        this.maxHp = 120;
        this.hp = this.maxHp;
        this.damage = 15;
        this.armor = 5;
        this.attackRange = 30;
        this.attackCooldown = 2000; // 2s between attacks
        this.lastAttackTime = 0;
        
        // XP and rewards
        this.xpValue = 25;
        this.drops = [
            { item: 'boar_meat', chance: 0.9, minQty: 1, maxQty: 3 },
            { item: 'tusk', chance: 0.6, minQty: 1, maxQty: 2 },
            { item: 'boar_hide', chance: 0.4, minQty: 1, maxQty: 1 }
        ];
        
        // Behavior state
        this.state = 'wandering'; // wandering, aggressive, charging, returning
        this.target = null;
        this.spawnPosition = { ...spawnPosition };
        this.leashDistance = 200;
        
        // Movement
        this.speed = 2;
        this.chargeSpeed = 7;
        this.targetPosition = null;
        
        // Detection
        this.detectionRadius = 100;
        this.aggroRadius = 150;
        
        // Charge mechanic
        this.isCharging = false;
        this.chargeTarget = null;
        this.chargeDamage = 30; // Extra damage on charge hit
        this.chargeStunDuration = 1000; // 1s stun
        
        // Initialize
        this.startAI();
    }
    
    /**
     * Start AI behavior loop
     */
    startAI() {
        this.aiInterval = setInterval(() => {
            this.updateBehavior();
        }, 1000);
    }
    
    /**
     * Update behavior based on state
     */
    updateBehavior() {
        switch (this.state) {
            case 'wandering':
                this.wanderingBehavior();
                break;
            case 'aggressive':
                this.aggressiveBehavior();
                break;
            case 'charging':
                this.chargingBehavior();
                break;
            case 'returning':
                this.returningBehavior();
                break;
        }
    }
    
    /**
     * Wandering behavior - move around spawn area
     */
    wanderingBehavior() {
        // Pick new random direction occasionally
        if (!this.targetPosition || Math.random() < 0.2) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 70;
            
            this.targetPosition = {
                x: this.spawnPosition.x + Math.cos(angle) * distance,
                y: this.spawnPosition.y + Math.sin(angle) * distance
            };
        }
        
        // Move toward target
        this.moveToTarget(this.speed);
    }
    
    /**
     * Aggressive behavior - chase and attack target
     */
    aggressiveBehavior() {
        if (!this.target) {
            this.state = 'returning';
            return;
        }
        
        // Check if target is too far from spawn (leash)
        const distFromSpawn = this.distanceTo(this.spawnPosition);
        if (distFromSpawn > this.leashDistance) {
            this.state = 'returning';
            this.target = null;
            return;
        }
        
        const distToTarget = this.distanceTo(this.target);
        
        // Use charge if far enough and not on cooldown
        if (distToTarget > 80 && distToTarget < 200 && !this.isCharging && Math.random() < 0.3) {
            this.startCharge();
            return;
        }
        
        // Move to attack range
        if (distToTarget > this.attackRange) {
            this.targetPosition = { x: this.target.x, y: this.target.y };
            this.moveToTarget(this.speed * 1.5);
        } else {
            // In attack range
            this.attack(this.target);
        }
    }
    
    /**
     * Start charge attack
     */
    startCharge() {
        if (!this.target || this.isCharging) return;
        
        this.isCharging = true;
        this.chargeTarget = { x: this.target.x, y: this.target.y };
        this.state = 'charging';
        
        // Emit charge start event
        this.zone.emit('mob:charge_started', {
            mobId: this.id,
            targetPosition: this.chargeTarget
        });
    }
    
    /**
     * Charging behavior - fast dash toward target
     */
    chargingBehavior() {
        if (!this.chargeTarget) {
            this.isCharging = false;
            this.state = this.target ? 'aggressive' : 'wandering';
            return;
        }
        
        // Move rapidly toward charge target
        const dx = this.chargeTarget.x - this.x;
        const dy = this.chargeTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            this.x += normalizedX * this.chargeSpeed * 5;
            this.y += normalizedY * this.chargeSpeed * 5;
        } else {
            // Charge complete
            this.isCharging = false;
            this.state = this.target ? 'aggressive' : 'wandering';
        }
        
        // Check if we hit the target during charge
        if (this.target && this.distanceTo(this.target) < this.attackRange) {
            this.chargeHit(this.target);
        }
    }
    
    /**
     * Charge hit - deals extra damage and stuns
     */
    chargeHit(target) {
        this.isCharging = false;
        
        // Deal charge damage
        const damage = this.chargeDamage;
        
        // Emit charge hit event
        this.zone.emit('mob:charge_hit', {
            mobId: this.id,
            target: target.id || target,
            damage: damage,
            stunDuration: this.chargeStunDuration
        });
    }
    
    /**
     * Return to spawn point
     */
    returningBehavior() {
        this.targetPosition = this.spawnPosition;
        
        const distance = this.distanceTo(this.spawnPosition);
        
        if (distance > 10) {
            this.moveToTarget(this.speed);
        } else {
            // Reached spawn, go back to wandering
            this.state = 'wandering';
            this.target = null;
            this.targetPosition = null;
        }
    }
    
    /**
     * Move toward target position
     */
    moveToTarget(speed) {
        if (!this.targetPosition) return;
        
        const dx = this.targetPosition.x - this.x;
        const dy = this.targetPosition.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            this.x += normalizedX * speed * 5;
            this.y += normalizedY * speed * 5;
        } else {
            // Reached target
            this.targetPosition = null;
        }
        
        this.constrainToZone();
    }
    
    /**
     * Calculate distance to position
     */
    distanceTo(position) {
        const dx = this.x - position.x;
        const dy = this.y - position.y;
        return Math.sqrt(dx * dx + dy * dy);
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
     * Check for players to aggro
     */
    checkForPlayers(players) {
        // Only aggro if provoked or already aggressive
        if (this.state === 'wandering' || this.state === 'returning') {
            // Neutral - don't auto-aggro, wait for provocation
            return;
        }
        
        // If already have a target, check if still in range
        if (this.target) {
            const distToTarget = this.distanceTo(this.target);
            if (distToTarget > this.aggroRadius * 1.5) {
                // Target too far, return to spawn
                this.state = 'returning';
                this.target = null;
            }
        }
    }
    
    /**
     * Provoke the boar (attacked by player)
     */
    provoke(attacker) {
        if (this.state === 'wandering' || this.state === 'returning') {
            this.state = 'aggressive';
            this.target = attacker;
        }
    }
    
    /**
     * Attack target
     */
    attack(target) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) {
            return; // Still on cooldown
        }
        
        this.lastAttackTime = now;
        
        // Calculate damage
        const damage = Math.floor(this.damage * (0.8 + Math.random() * 0.4));
        
        // Emit attack event
        this.zone.emit('mob:attack', {
            mobId: this.id,
            target: target.id || target,
            damage: damage
        });
        
        return damage;
    }
    
    /**
     * Take damage from attacker
     */
    takeDamage(amount, attacker) {
        // Apply armor reduction
        const actualDamage = Math.max(1, amount - this.armor);
        this.hp -= actualDamage;
        
        // Provoke if not already aggressive
        this.provoke(attacker);
        
        // Enrage at low HP (30%)
        if (this.hp <= this.maxHp * 0.3 && !this.isEnraged) {
            this.enrage();
        }
        
        if (this.hp <= 0) {
            return this.die(attacker);
        }
        
        return {
            hp: this.hp,
            maxHp: this.maxHp,
            damageTaken: actualDamage,
            state: this.state
        };
    }
    
    /**
     * Enrage - increased damage and speed at low HP
     */
    enrage() {
        this.isEnraged = true;
        this.damage = Math.floor(this.damage * 1.5);
        this.speed *= 1.3;
        
        this.zone.emit('mob:enraged', {
            mobId: this.id,
            mobType: 'wild_boar'
        });
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
            mobType: 'wild_boar',
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
            type: 'wild_boar',
            name: this.name,
            x: Math.floor(this.x),
            y: Math.floor(this.y),
            hp: this.hp,
            maxHp: this.maxHp,
            level: this.level,
            state: this.state,
            isCharging: this.isCharging,
            isEnraged: this.isEnraged,
            isAggressive: this.state === 'aggressive' || this.state === 'charging'
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

module.exports = WildBoar;
