/**
 * SandWorm.js
 * 
 * Sand Worm mob for Aurélia desert zone
 * Level 42, burrow striker that senses vibrations
 * Special: Attracted to fast movement
 */

class SandWorm {
    constructor(id, position, zone) {
        this.id = id || `sandworm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = 'sand_worm';
        this.name = 'Sand Worm';
        this.level = 42;
        
        // Position
        this.x = position?.x || 0;
        this.y = position?.y || 0;
        this.zone = zone || 'aurelia';
        this.subZone = position?.subZone || 'golden_dunes';
        
        // Stats
        this.maxHp = 800;
        this.hp = this.maxHp;
        this.damage = 60;
        this.attackSpeed = 0.8;
        this.moveSpeed = 100; // Fast when underground
        this.surfaceSpeed = 40; // Slow on surface
        this.aggroRange = 300; // Large aggro range
        this.attackRange = 50;
        this.senseRange = 400; // Can sense vibrations from far
        
        // Behavior
        this.behavior = 'burrow_striker';
        this.state = 'underground'; // underground, emerging, surfaced, diving, attacking
        this.target = null;
        this.patrolCenter = { x: this.x, y: this.y };
        this.patrolRadius = 400;
        
        // Vibration sensing
        this.detectedVibrations = []; // Array of {x, y, intensity, time}
        this.vibrationDecayTime = 3000; // Vibration fades after 3 seconds
        this.movementSpeedThreshold = 100; // Speed above this attracts worm
        
        // Special abilities
        this.abilities = {
            undergroundAmbush: {
                name: 'Underground Ambush',
                cooldown: 20000,
                lastUsed: 0,
                damage: this.damage * 2,
                knockup: true,
                description: 'Surfaces violently beneath target'
            },
            devour: {
                name: 'Devour',
                cooldown: 30000,
                lastUsed: 0,
                damage: this.damage * 1.5,
                executeThreshold: 0.2, // 20% HP or less
                description: 'Attempts to swallow target whole'
            },
            sandSpray: {
                name: 'Sand Spray',
                cooldown: 12000,
                lastUsed: 0,
                damage: this.damage * 0.5,
                blindDuration: 3000,
                aoe: true,
                radius: 100,
                description: 'Blinds all nearby enemies'
            }
        };
        
        // Combat state
        this.inCombat = false;
        this.combatStartTime = null;
        this.lastAttackTime = 0;
        this.targetsInAggro = new Set();
        
        // Loot
        this.xpValue = 150;
        this.drops = [
            { id: 'worm_tooth', name: 'Worm Tooth', chance: 0.5, min: 1, max: 2 },
            { id: 'digestive_acid', name: 'Digestive Acid', chance: 0.35, min: 1, max: 1 },
            { id: 'sand_gland', name: 'Sand Gland', chance: 0.25, min: 1, max: 1 },
            { id: 'ancient_relics', name: 'Ancient Relics', chance: 0.1, min: 1, max: 1 }
        ];
        
        // Resistances
        this.resistances = {
            physical: 0.3,
            fire: 0.1,
            poison: 0.5,
            cold: -0.2 // Cold weakness
        };
        
        // Spawn and despawn
        this.spawnTime = Date.now();
        this.despawnRadius = 800;
        this.respawnTime = 90000; // 90 seconds
        
        // Burrow mechanics
        this.isUnderground = true;
        this.surfaceLevel = 0; // 0 = fully underground, 1 = fully surfaced
        this.surfaceTransitionSpeed = 0.3;
        
        // Movement trail (for tracking)
        this.trail = []; // Last positions
        this.maxTrailLength = 20;
        
        // Timers
        this.updateInterval = null;
        this.lastUpdate = Date.now();
        this.vibrationCheckInterval = 500; // Check vibrations every 500ms
        this.lastVibrationCheck = 0;
        
        this.initialize();
    }
    
    initialize() {
        console.log(`[SandWorm] ${this.id} initialized at (${this.x}, ${this.y})`);
        this.startUpdateLoop();
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 200);
    }
    
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // Update surface level transition
        this.updateSurfaceState(deltaTime);
        
        // Update vibrations
        this.updateVibrations();
        
        // Check vibrations periodically
        if (now - this.lastVibrationCheck >= this.vibrationCheckInterval) {
            this.lastVibrationCheck = now;
            this.checkVibrations();
        }
        
        // State machine
        switch (this.state) {
            case 'underground':
                this.updateUnderground(deltaTime);
                break;
            case 'hunting':
                this.updateHunting(deltaTime);
                break;
            case 'emerging':
                this.updateEmerging(deltaTime);
                break;
            case 'surfaced':
                this.updateSurfaced(deltaTime);
                break;
            case 'attacking':
                this.updateAttacking(deltaTime);
                break;
            case 'diving':
                this.updateDiving(deltaTime);
                break;
            case 'returning':
                this.updateReturning(deltaTime);
                break;
            case 'dead':
                break;
        }
        
        // Record trail
        this.recordTrail();
    }
    
    updateSurfaceState(deltaTime) {
        const targetLevel = this.isUnderground ? 0 : 1;
        
        if (this.surfaceLevel < targetLevel) {
            this.surfaceLevel = Math.min(1, this.surfaceLevel + this.surfaceTransitionSpeed * deltaTime);
        } else if (this.surfaceLevel > targetLevel) {
            this.surfaceLevel = Math.max(0, this.surfaceLevel - this.surfaceTransitionSpeed * deltaTime);
        }
    }
    
    updateUnderground(deltaTime) {
        // Patrol underground
        this.patrolUnderground(deltaTime);
        
        // Process vibrations and potentially switch to hunting
        if (this.detectedVibrations.length > 0) {
            const strongestVibration = this.getStrongestVibration();
            if (strongestVibration.intensity > 0.5) {
                this.state = 'hunting';
                this.targetVibration = strongestVibration;
            }
        }
    }
    
    updateHunting(deltaTime) {
        if (!this.targetVibration) {
            this.state = 'underground';
            return;
        }
        
        // Move toward vibration source underground
        const targetX = this.targetVibration.x;
        const targetY = this.targetVibration.y;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Use fast underground speed
        const moveDistance = this.moveSpeed * deltaTime;
        
        if (distance > this.attackRange * 0.5) {
            const ratio = Math.min(moveDistance / distance, 1);
            this.x += dx * ratio;
            this.y += dy * ratio;
        } else {
            // Close enough, emerge and attack
            this.state = 'emerging';
            this.isUnderground = false;
            this.target = this.targetVibration.source;
        }
        
        // Check if vibration is too old
        if (Date.now() - this.targetVibration.time > this.vibrationDecayTime) {
            this.targetVibration = null;
            this.state = 'underground';
        }
    }
    
    updateEmerging(deltaTime) {
        if (this.surfaceLevel >= 0.9) {
            this.state = 'surfaced';
            
            // Use underground ambush if off cooldown
            const now = Date.now();
            if (now - this.abilities.undergroundAmbush.lastUsed >= this.abilities.undergroundAmbush.cooldown) {
                this.useAbility('undergroundAmbush', this.target);
            }
        }
    }
    
    updateSurfaced(deltaTime) {
        if (!this.target) {
            this.state = 'diving';
            this.isUnderground = true;
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        
        // If target too far, dive and chase underground
        if (distance > this.aggroRange * 1.5) {
            this.state = 'diving';
            this.isUnderground = true;
            return;
        }
        
        // Combat logic
        this.updateCombat(deltaTime);
    }
    
    updateAttacking(deltaTime) {
        // Short attack window
        const now = Date.now();
        if (now - this.lastAttackTime > 1000) {
            this.state = 'surfaced';
        }
    }
    
    updateDiving(deltaTime) {
        if (this.surfaceLevel <= 0.1) {
            this.state = 'underground';
            if (!this.target || this.getDistanceTo(this.target) > this.aggroRange * 2) {
                this.target = null;
                this.state = 'returning';
            }
        }
    }
    
    updateReturning(deltaTime) {
        const distanceToCenter = this.getDistanceTo(this.patrolCenter);
        
        if (distanceToCenter <= 20) {
            this.state = 'underground';
            return;
        }
        
        // Return underground at fast speed
        const dx = this.patrolCenter.x - this.x;
        const dy = this.patrolCenter.y - this.y;
        const moveDistance = this.moveSpeed * deltaTime;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const ratio = Math.min(moveDistance / distance, 1);
            this.x += dx * ratio;
            this.y += dy * ratio;
        }
    }
    
    updateCombat(deltaTime) {
        const now = Date.now();
        const distance = this.getDistanceTo(this.target);
        
        // Try Devour if target is low HP
        if (this.target.hp / this.target.maxHp <= this.abilities.devour.executeThreshold) {
            if (now - this.abilities.devour.lastUsed >= this.abilities.devour.cooldown) {
                this.useAbility('devour', this.target);
                return;
            }
        }
        
        // Use sand spray if multiple targets nearby
        if (this.targetsInAggro.size >= 2) {
            if (now - this.abilities.sandSpray.lastUsed >= this.abilities.sandSpray.cooldown) {
                this.useAbility('sandSpray', this.target);
                return;
            }
        }
        
        // Basic attack
        if (distance <= this.attackRange) {
            if (now - this.lastAttackTime >= (1000 / this.attackSpeed)) {
                this.attack(this.target);
            }
        } else {
            // Chase on surface (slower)
            this.moveToward(this.target, deltaTime, this.surfaceSpeed);
        }
    }
    
    // Vibration sensing system
    detectVibration(x, y, intensity, source) {
        // Vibration intensity based on movement speed
        // Intensity 0-1: 0 = still, 1 = sprinting
        
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        
        if (distance <= this.senseRange) {
            // Vibration strength decreases with distance
            const distanceFactor = 1 - (distance / this.senseRange);
            const finalIntensity = intensity * distanceFactor;
            
            if (finalIntensity > 0.1) {
                this.detectedVibrations.push({
                    x,
                    y,
                    intensity: finalIntensity,
                    time: Date.now(),
                    source
                });
                
                // Limit stored vibrations
                if (this.detectedVibrations.length > 10) {
                    this.detectedVibrations.shift();
                }
            }
        }
    }
    
    updateVibrations() {
        const now = Date.now();
        // Remove old vibrations
        this.detectedVibrations = this.detectedVibrations.filter(
            v => now - v.time < this.vibrationDecayTime
        );
    }
    
    checkVibrations() {
        // Already handled in updateVibrations and getStrongestVibration
    }
    
    getStrongestVibration() {
        if (this.detectedVibrations.length === 0) return null;
        
        return this.detectedVibrations.reduce((strongest, current) => 
            current.intensity > strongest.intensity ? current : strongest
        );
    }
    
    // Patrol while underground
    patrolUnderground(deltaTime) {
        const distanceToCenter = this.getDistanceTo(this.patrolCenter);
        
        if (distanceToCenter > this.patrolRadius) {
            // Return to center
            const dx = this.patrolCenter.x - this.x;
            const dy = this.patrolCenter.y - this.y;
            const moveDistance = this.moveSpeed * deltaTime;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const ratio = Math.min(moveDistance / distance, 1);
                this.x += dx * ratio;
                this.y += dy * ratio;
            }
        } else {
            // Random patrol
            const angle = Math.random() * Math.PI * 2;
            const moveDistance = this.moveSpeed * deltaTime * 0.3;
            this.x += Math.cos(angle) * moveDistance;
            this.y += Math.sin(angle) * moveDistance;
        }
    }
    
    // Record position trail
    recordTrail() {
        this.trail.push({ x: this.x, y: this.y, time: Date.now() });
        
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }
    
    // Abilities
    useAbility(abilityName, target) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        
        const now = Date.now();
        if (now - ability.lastUsed < ability.cooldown) return false;
        
        ability.lastUsed = now;
        
        switch (abilityName) {
            case 'undergroundAmbush':
                this.performUndergroundAmbush(target, ability);
                break;
            case 'devour':
                this.performDevour(target, ability);
                break;
            case 'sandSpray':
                this.performSandSpray(target, ability);
                break;
        }
        
        return true;
    }
    
    performUndergroundAmbush(target, ability) {
        console.log(`[SandWorm] ${this.id} uses Underground Ambush!`);
        
        // Instantly move to target
        this.x = target.x || target.position?.x || this.x;
        this.y = target.y || target.position?.y || this.y;
        
        const damage = this.calculateDamage(ability.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        // Knockup effect
        if (target.applyStatusEffect) {
            target.applyStatusEffect({
                type: 'knockup',
                duration: 1500,
                source: this.id
            });
        }
        
        this.state = 'attacking';
        this.lastAttackTime = Date.now();
        
        this.emitCombatEvent('ability_used', {
            ability: 'undergroundAmbush',
            target: target.id,
            damage,
            knockup: true
        });
    }
    
    performDevour(target, ability) {
        console.log(`[SandWorm] ${this.id} attempts to Devour ${target.id || target}!`);
        
        const damage = this.calculateDamage(ability.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        // If target is below threshold, "devour" (instant kill or massive damage)
        const targetHpPercent = target.hp / target.maxHp;
        if (targetHpPercent <= ability.executeThreshold) {
            // Execute
            const executeDamage = target.hp; // Kill
            this.dealDamage(target, executeDamage, 'true');
            
            this.emitCombatEvent('execute', {
                ability: 'devour',
                target: target.id,
                message: 'Devoured whole!'
            });
        }
        
        this.state = 'attacking';
        this.lastAttackTime = Date.now();
    }
    
    performSandSpray(target, ability) {
        console.log(`[SandWorm] ${this.id} uses Sand Spray!`);
        
        // AOE around worm
        const affectedTargets = [];
        
        for (const t of this.targetsInAggro) {
            // Would need to look up actual player objects
            affectedTargets.push(t);
        }
        
        // Also affect current target
        const damage = this.calculateDamage(ability.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        if (target.applyStatusEffect) {
            target.applyStatusEffect({
                type: 'blind',
                duration: ability.blindDuration,
                source: this.id
            });
        }
        
        this.emitCombatEvent('ability_used', {
            ability: 'sandSpray',
            targets: affectedTargets,
            damage,
            blindDuration: ability.blindDuration
        });
    }
    
    // Combat methods
    attack(target) {
        this.lastAttackTime = Date.now();
        
        const damage = this.calculateDamage(this.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        this.emitCombatEvent('attack', {
            target: target.id,
            damage
        });
    }
    
    calculateDamage(baseDamage, target) {
        let damage = baseDamage;
        
        if (target.resistances && target.resistances.physical !== undefined) {
            damage = damage * (1 - target.resistances.physical);
        }
        
        const variance = 0.9 + Math.random() * 0.2;
        damage = Math.floor(damage * variance);
        
        return Math.max(1, damage);
    }
    
    dealDamage(target, damage, type) {
        if (target.takeDamage) {
            target.takeDamage(damage, this.id, type);
        } else if (typeof target.hp === 'number') {
            target.hp = Math.max(0, target.hp - damage);
        }
    }
    
    takeDamage(damage, source, type = 'physical') {
        const resistance = this.resistances[type] || 0;
        const finalDamage = Math.floor(damage * (1 - resistance));
        
        this.hp = Math.max(0, this.hp - finalDamage);
        
        // If damaged while underground, emerge
        if (this.isUnderground && finalDamage > 0) {
            this.isUnderground = false;
            this.state = 'emerging';
            this.target = source;
        }
        
        if (this.hp <= 0) {
            this.die(source);
        }
        
        return finalDamage;
    }
    
    die(killer) {
        this.hp = 0;
        this.state = 'dead';
        this.inCombat = false;
        
        console.log(`[SandWorm] ${this.id} killed by ${killer?.id || killer}`);
        
        const loot = this.generateLoot();
        
        this.emitCombatEvent('death', {
            killer: killer?.id || killer,
            loot,
            xp: this.xpValue,
            position: { x: this.x, y: this.y }
        });
        
        setTimeout(() => this.respawn(), this.respawnTime);
    }
    
    generateLoot() {
        const loot = [];
        for (const drop of this.drops) {
            if (Math.random() < drop.chance) {
                const amount = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
                loot.push({ id: drop.id, name: drop.name, amount });
            }
        }
        return loot;
    }
    
    respawn() {
        this.hp = this.maxHp;
        this.state = 'underground';
        this.isUnderground = true;
        this.surfaceLevel = 0;
        this.target = null;
        this.inCombat = false;
        this.detectedVibrations = [];
        
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.patrolRadius;
        this.x = this.patrolCenter.x + Math.cos(angle) * distance;
        this.y = this.patrolCenter.y + Math.sin(angle) * distance;
        
        console.log(`[SandWorm] ${this.id} respawned at (${this.x}, ${this.y})`);
    }
    
    moveToward(target, deltaTime, speed = null) {
        const targetX = target.x ?? target.position?.x ?? this.x;
        const targetY = target.y ?? target.position?.y ?? this.y;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveDistance = (speed || this.moveSpeed) * deltaTime;
            const ratio = Math.min(moveDistance / distance, 1);
            this.x += dx * ratio;
            this.y += dy * ratio;
        }
    }
    
    getDistanceTo(target) {
        const targetX = target.x ?? target.position?.x ?? this.x;
        const targetY = target.y ?? target.position?.y ?? this.y;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    setTarget(target) {
        this.target = target;
        if (!this.inCombat) {
            this.inCombat = true;
            this.combatStartTime = Date.now();
        }
        if (this.isUnderground) {
            this.isUnderground = false;
            this.state = 'emerging';
        }
    }
    
    loseTarget() {
        this.target = null;
        this.inCombat = false;
    }
    
    addToAggro(player) {
        this.targetsInAggro.add(player.id || player);
        if (!this.target) this.setTarget(player);
    }
    
    removeFromAggro(player) {
        this.targetsInAggro.delete(player.id || player);
        if (this.target?.id === (player.id || player)) {
            if (this.targetsInAggro.size > 0) {
                const newTargetId = this.targetsInAggro.values().next().value;
            } else {
                this.loseTarget();
                this.state = 'diving';
                this.isUnderground = true;
            }
        }
    }
    
    emitCombatEvent(eventType, data) {
        console.log(`[SandWorm] Event: ${eventType}`, data);
    }
    
    getClientData() {
        // Only show position if surfaced or emerging
        const showPosition = !this.isUnderground || this.state === 'emerging';
        
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            level: this.level,
            x: showPosition ? this.x : null,
            y: showPosition ? this.y : null,
            hp: showPosition ? this.hp : null,
            maxHp: this.maxHp,
            state: this.state,
            surfaceLevel: this.surfaceLevel,
            isUnderground: this.isUnderground,
            // Show trail only when underground (tremors in sand)
            trail: this.isUnderground ? this.trail.slice(-5) : []
        };
    }
    
    getFullData() {
        return {
            ...this.getClientData(),
            damage: this.damage,
            moveSpeed: this.moveSpeed,
            surfaceSpeed: this.surfaceSpeed,
            aggroRange: this.aggroRange,
            senseRange: this.senseRange,
            behavior: this.behavior,
            resistances: this.resistances,
            abilities: Object.keys(this.abilities),
            xpValue: this.xpValue,
            inCombat: this.inCombat
        };
    }
    
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

module.exports = SandWorm;
