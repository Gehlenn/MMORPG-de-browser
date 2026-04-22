/**
 * GiantScorpion.js
 * 
 * Giant Scorpion mob for Aurélia desert zone
 * Level 40, aggressive predator with burrow ambush mechanics
 */

class GiantScorpion {
    constructor(id, position, zone) {
        this.id = id || `scorpion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = 'giant_scorpion';
        this.name = 'Giant Scorpion';
        this.level = 40;
        
        // Position
        this.x = position?.x || 0;
        this.y = position?.y || 0;
        this.zone = zone || 'aurelia';
        this.subZone = position?.subZone || 'golden_dunes';
        
        // Stats
        this.maxHp = 600;
        this.hp = this.maxHp;
        this.damage = 45;
        this.attackSpeed = 1.2; // attacks per second
        this.moveSpeed = 80; // pixels per second
        this.aggroRange = 150;
        this.attackRange = 40;
        
        // Behavior
        this.behavior = 'ambush_predator';
        this.state = 'burrowed'; // burrowed, emerging, active, returning
        this.target = null;
        this.patrolCenter = { x: this.x, y: this.y };
        this.patrolRadius = 200;
        
        // Special abilities
        this.abilities = {
            burrowAttack: {
                name: 'Burrow Attack',
                cooldown: 15000, // 15 seconds
                lastUsed: 0,
                damage: this.damage * 1.5,
                stunDuration: 2000 // 2 seconds
            },
            venomSting: {
                name: 'Venom Sting',
                cooldown: 8000, // 8 seconds
                lastUsed: 0,
                damage: this.damage * 0.8,
                poisonDamage: 10, // per tick
                poisonDuration: 10000, // 10 seconds
                poisonTicks: 5
            },
            pincerCrush: {
                name: 'Pincer Crush',
                cooldown: 5000, // 5 seconds
                lastUsed: 0,
                damage: this.damage,
                armorReduction: 0.3, // 30% armor reduction for 5s
                debuffDuration: 5000
            }
        };
        
        // Combat state
        this.inCombat = false;
        this.combatStartTime = null;
        this.lastAttackTime = 0;
        this.targetsInAggro = new Set();
        
        // Loot
        this.xpValue = 120;
        this.drops = [
            { id: 'scorpion_tail', name: 'Scorpion Tail', chance: 0.6, min: 1, max: 1 },
            { id: 'chitin_plate', name: 'Chitin Plate', chance: 0.4, min: 1, max: 2 },
            { id: 'venom_sac', name: 'Venom Sac', chance: 0.3, min: 1, max: 1 },
            { id: 'gold_nuggets', name: 'Gold Nuggets', chance: 0.15, min: 1, max: 3 }
        ];
        
        // Resistances
        this.resistances = {
            physical: 0.2, // 20% physical resistance
            fire: -0.3, // 30% fire weakness
            poison: 1.0, // Immune to poison
            cold: 0.1 // 10% cold resistance
        };
        
        // Spawn and despawn
        this.spawnTime = Date.now();
        this.despawnRadius = 500; // Despawn if players beyond this range
        this.respawnTime = 60000; // 60 seconds to respawn
        
        // Burrow mechanics
        this.burrowDepth = 0; // 0 = surface, 1 = fully buried
        this.isBurrowed = true;
        this.burrowTransitionSpeed = 0.5; // Speed of burrow/emerge animation
        
        // Timers
        this.updateInterval = null;
        this.lastUpdate = Date.now();
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initialize the scorpion
     */
    initialize() {
        console.log(`[GiantScorpion] ${this.id} initialized at (${this.x}, ${this.y})`);
        this.startUpdateLoop();
    }
    
    /**
     * Start update loop
     */
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 200); // Update 5 times per second
    }
    
    /**
     * Main update loop
     */
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // Update burrow depth
        this.updateBurrowState(deltaTime);
        
        // State machine
        switch (this.state) {
            case 'burrowed':
                this.updateBurrowed(deltaTime);
                break;
            case 'emerging':
                this.updateEmerging(deltaTime);
                break;
            case 'active':
                this.updateActive(deltaTime);
                break;
            case 'returning':
                this.updateReturning(deltaTime);
                break;
            case 'dead':
                // Do nothing, waiting for respawn
                break;
        }
    }
    
    /**
     * Update burrow depth transition
     */
    updateBurrowState(deltaTime) {
        const targetDepth = this.isBurrowed ? 1 : 0;
        
        if (this.burrowDepth < targetDepth) {
            this.burrowDepth = Math.min(1, this.burrowDepth + this.burrowTransitionSpeed * deltaTime);
        } else if (this.burrowDepth > targetDepth) {
            this.burrowDepth = Math.max(0, this.burrowDepth - this.burrowTransitionSpeed * deltaTime);
        }
    }
    
    /**
     * Update while burrowed (hidden underground)
     */
    updateBurrowed(deltaTime) {
        // Sense vibrations - check for players in aggro range
        // In burrowed state, can sense from slightly farther
        const senseRange = this.aggroRange * 1.3;
        
        // If we have a target and it's in range, emerge
        if (this.target) {
            const distance = this.getDistanceTo(this.target);
            if (distance <= senseRange) {
                this.emerge();
            }
        }
    }
    
    /**
     * Update while emerging from ground
     */
    updateEmerging(deltaTime) {
        // Wait until fully emerged
        if (this.burrowDepth <= 0.1) {
            this.state = 'active';
            this.isBurrowed = false;
            console.log(`[GiantScorpion] ${this.id} fully emerged and attacking!`);
            
            // If we have a target, immediately use burrow attack
            if (this.target) {
                this.useAbility('burrowAttack', this.target);
            }
        }
    }
    
    /**
     * Update while active (visible and fighting)
     */
    updateActive(deltaTime) {
        if (!this.target) {
            // No target, return to patrol
            this.state = 'returning';
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        
        // Check if target is too far
        if (distance > this.aggroRange * 2) {
            this.loseTarget();
            this.state = 'returning';
            return;
        }
        
        // Check if target is dead
        if (this.target.hp <= 0) {
            this.loseTarget();
            this.state = 'returning';
            return;
        }
        
        // Combat logic
        this.updateCombat(deltaTime);
    }
    
    /**
     * Update combat behavior
     */
    updateCombat(deltaTime) {
        const now = Date.now();
        const distance = this.getDistanceTo(this.target);
        
        // Use abilities when available
        if (distance <= this.attackRange) {
            // Try venom sting first (apply DoT)
            if (now - this.abilities.venomSting.lastUsed >= this.abilities.venomSting.cooldown) {
                this.useAbility('venomSting', this.target);
                return;
            }
            
            // Then pincer crush (armor reduction)
            if (now - this.abilities.pincerCrush.lastUsed >= this.abilities.pincerCrush.cooldown) {
                this.useAbility('pincerCrush', this.target);
                return;
            }
            
            // Basic attack
            if (now - this.lastAttackTime >= (1000 / this.attackSpeed)) {
                this.attack(this.target);
            }
        } else {
            // Move toward target
            this.moveToward(this.target, deltaTime);
        }
    }
    
    /**
     * Update while returning to patrol point
     */
    updateReturning(deltaTime) {
        // Check if back at patrol center
        const distanceToCenter = this.getDistanceTo(this.patrolCenter);
        
        if (distanceToCenter <= 10) {
            // Back at center, burrow again
            this.burrow();
            return;
        }
        
        // Check for new targets while returning
        // Can sense while moving but not as far
        if (this.target && this.getDistanceTo(this.target) <= this.aggroRange * 1.5) {
            this.state = 'active';
            return;
        }
        
        // Move toward patrol center
        this.moveToward(this.patrolCenter, deltaTime);
    }
    
    /**
     * Emerge from burrow
     */
    emerge() {
        if (this.state !== 'burrowed') return;
        
        this.isBurrowed = false;
        this.state = 'emerging';
        console.log(`[GiantScorpion] ${this.id} emerging from burrow!`);
    }
    
    /**
     * Burrow underground
     */
    burrow() {
        this.isBurrowed = true;
        this.state = 'burrowed';
        this.target = null;
        this.inCombat = false;
        console.log(`[GiantScorpion] ${this.id} burrowed underground`);
    }
    
    /**
     * Use an ability
     */
    useAbility(abilityName, target) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        
        const now = Date.now();
        if (now - ability.lastUsed < ability.cooldown) {
            return false; // On cooldown
        }
        
        ability.lastUsed = now;
        
        switch (abilityName) {
            case 'burrowAttack':
                this.performBurrowAttack(target, ability);
                break;
            case 'venomSting':
                this.performVenomSting(target, ability);
                break;
            case 'pincerCrush':
                this.performPincerCrush(target, ability);
                break;
        }
        
        return true;
    }
    
    /**
     * Perform burrow attack (emerging from ground under target)
     */
    performBurrowAttack(target, ability) {
        console.log(`[GiantScorpion] ${this.id} uses Burrow Attack on ${target.id || target}`);
        
        // Move to target position instantly (underground)
        this.x = target.x || target.position?.x || this.x;
        this.y = target.y || target.position?.y || this.y;
        
        // Deal damage
        const damage = this.calculateDamage(ability.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        // Apply stun
        if (target.applyStatusEffect) {
            target.applyStatusEffect({
                type: 'stun',
                duration: ability.stunDuration,
                source: this.id
            });
        }
        
        // Emit event
        this.emitCombatEvent('ability_used', {
            ability: 'burrowAttack',
            target: target.id,
            damage,
            stunDuration: ability.stunDuration
        });
    }
    
    /**
     * Perform venom sting (applies poison DoT)
     */
    performVenomSting(target, ability) {
        console.log(`[GiantScorpion] ${this.id} uses Venom Sting on ${target.id || target}`);
        
        // Deal initial damage
        const damage = this.calculateDamage(ability.damage, target);
        this.dealDamage(target, damage, 'poison');
        
        // Apply poison DoT
        if (target.applyStatusEffect) {
            target.applyStatusEffect({
                type: 'poison',
                duration: ability.poisonDuration,
                tickDamage: ability.poisonDamage,
                ticks: ability.poisonTicks,
                source: this.id,
                sourceName: this.name
            });
        }
        
        this.emitCombatEvent('ability_used', {
            ability: 'venomSting',
            target: target.id,
            damage,
            poisonDamage: ability.poisonDamage,
            poisonDuration: ability.poisonDuration
        });
    }
    
    /**
     * Perform pincer crush (armor reduction)
     */
    performPincerCrush(target, ability) {
        console.log(`[GiantScorpion] ${this.id} uses Pincer Crush on ${target.id || target}`);
        
        // Deal damage
        const damage = this.calculateDamage(ability.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        // Apply armor reduction debuff
        if (target.applyStatusEffect) {
            target.applyStatusEffect({
                type: 'armor_reduction',
                duration: ability.debuffDuration,
                reduction: ability.armorReduction,
                source: this.id
            });
        }
        
        this.emitCombatEvent('ability_used', {
            ability: 'pincerCrush',
            target: target.id,
            damage,
            armorReduction: ability.armorReduction
        });
    }
    
    /**
     * Basic attack
     */
    attack(target) {
        this.lastAttackTime = Date.now();
        
        const damage = this.calculateDamage(this.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        this.emitCombatEvent('attack', {
            target: target.id,
            damage,
            type: 'physical'
        });
    }
    
    /**
     * Calculate damage with resistances
     */
    calculateDamage(baseDamage, target) {
        let damage = baseDamage;
        
        // Apply resistance
        if (target.resistances && target.resistances.physical !== undefined) {
            damage = damage * (1 - target.resistances.physical);
        }
        
        // Random variance (±10%)
        const variance = 0.9 + Math.random() * 0.2;
        damage = Math.floor(damage * variance);
        
        return Math.max(1, damage);
    }
    
    /**
     * Deal damage to target
     */
    dealDamage(target, damage, type) {
        if (target.takeDamage) {
            target.takeDamage(damage, this.id, type);
        } else if (typeof target.hp === 'number') {
            target.hp = Math.max(0, target.hp - damage);
        }
    }
    
    /**
     * Take damage
     */
    takeDamage(damage, source, type = 'physical') {
        // Apply resistance
        const resistance = this.resistances[type] || 0;
        const finalDamage = Math.floor(damage * (1 - resistance));
        
        this.hp = Math.max(0, this.hp - finalDamage);
        
        // If damaged while burrowed, emerge immediately
        if (this.state === 'burrowed' && finalDamage > 0) {
            this.target = source;
            this.emerge();
        }
        
        // Check death
        if (this.hp <= 0) {
            this.die(source);
        }
        
        return finalDamage;
    }
    
    /**
     * Die
     */
    die(killer) {
        this.hp = 0;
        this.state = 'dead';
        this.inCombat = false;
        
        console.log(`[GiantScorpion] ${this.id} killed by ${killer?.id || killer}`);
        
        // Generate loot
        const loot = this.generateLoot();
        
        // Emit death event
        this.emitCombatEvent('death', {
            killer: killer?.id || killer,
            loot,
            xp: this.xpValue,
            position: { x: this.x, y: this.y }
        });
        
        // Start respawn timer
        setTimeout(() => {
            this.respawn();
        }, this.respawnTime);
    }
    
    /**
     * Generate loot drops
     */
    generateLoot() {
        const loot = [];
        
        for (const drop of this.drops) {
            if (Math.random() < drop.chance) {
                const amount = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
                loot.push({
                    id: drop.id,
                    name: drop.name,
                    amount
                });
            }
        }
        
        return loot;
    }
    
    /**
     * Respawn
     */
    respawn() {
        this.hp = this.maxHp;
        this.state = 'burrowed';
        this.isBurrowed = true;
        this.burrowDepth = 1;
        this.target = null;
        this.inCombat = false;
        
        // Random position near patrol center
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.patrolRadius;
        this.x = this.patrolCenter.x + Math.cos(angle) * distance;
        this.y = this.patrolCenter.y + Math.sin(angle) * distance;
        
        console.log(`[GiantScorpion] ${this.id} respawned at (${this.x}, ${this.y})`);
    }
    
    /**
     * Move toward target
     */
    moveToward(target, deltaTime) {
        const targetX = target.x ?? target.position?.x ?? this.x;
        const targetY = target.y ?? target.position?.y ?? this.y;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveDistance = this.moveSpeed * deltaTime;
            const ratio = Math.min(moveDistance / distance, 1);
            
            this.x += dx * ratio;
            this.y += dy * ratio;
        }
    }
    
    /**
     * Get distance to target
     */
    getDistanceTo(target) {
        const targetX = target.x ?? target.position?.x ?? this.x;
        const targetY = target.y ?? target.position?.y ?? this.y;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Set target
     */
    setTarget(target) {
        this.target = target;
        
        if (!this.inCombat) {
            this.inCombat = true;
            this.combatStartTime = Date.now();
        }
        
        // If burrowed, emerge
        if (this.state === 'burrowed') {
            this.emerge();
        }
    }
    
    /**
     * Lose target
     */
    loseTarget() {
        this.target = null;
        this.inCombat = false;
        this.combatStartTime = null;
    }
    
    /**
     * Add player to aggro list
     */
    addToAggro(player) {
        this.targetsInAggro.add(player.id || player);
        
        // If not already targeting someone, target this player
        if (!this.target) {
            this.setTarget(player);
        }
    }
    
    /**
     * Remove player from aggro list
     */
    removeFromAggro(player) {
        this.targetsInAggro.delete(player.id || player);
        
        // If current target left, find new target or return
        if (this.target?.id === (player.id || player)) {
            if (this.targetsInAggro.size > 0) {
                // Switch to another target
                const newTargetId = this.targetsInAggro.values().next().value;
                // Would need to look up player by ID
            } else {
                this.loseTarget();
                this.state = 'returning';
            }
        }
    }
    
    /**
     * Emit combat event
     */
    emitCombatEvent(eventType, data) {
        // This would integrate with the game's event system
        console.log(`[GiantScorpion] Event: ${eventType}`, data);
    }
    
    /**
     * Get client-safe data
     */
    getClientData() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            level: this.level,
            x: this.x,
            y: this.y,
            hp: this.hp,
            maxHp: this.maxHp,
            state: this.state,
            burrowDepth: this.burrowDepth,
            isBurrowed: this.isBurrowed
        };
    }
    
    /**
     * Get full data
     */
    getFullData() {
        return {
            ...this.getClientData(),
            damage: this.damage,
            attackSpeed: this.attackSpeed,
            moveSpeed: this.moveSpeed,
            aggroRange: this.aggroRange,
            behavior: this.behavior,
            resistances: this.resistances,
            abilities: Object.keys(this.abilities),
            xpValue: this.xpValue,
            inCombat: this.inCombat,
            target: this.target?.id || null
        };
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

module.exports = GiantScorpion;
