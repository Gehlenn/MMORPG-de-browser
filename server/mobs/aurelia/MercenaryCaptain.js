/**
 * MercenaryCaptain.js
 * 
 * Mercenary Captain mob for Aurélia desert zone
 * Level 55, commander that buffs allies and summons bandits
 * The toughest non-boss mob in Aurelia
 */

class MercenaryCaptain {
    constructor(id, position, zone) {
        this.id = id || `captain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = 'mercenary_captain';
        this.name = 'Mercenary Captain';
        this.level = 55;
        
        // Position
        this.x = position?.x || 0;
        this.y = position?.y || 0;
        this.zone = zone || 'aurelia';
        this.subZone = position?.subZone || 'thief_valley';
        
        // Stats
        this.maxHp = 800;
        this.hp = this.maxHp;
        this.damage = 75;
        this.attackSpeed = 1.0;
        this.moveSpeed = 85;
        this.aggroRange = 250;
        this.attackRange = 45;
        this.leashRadius = 500;
        
        // Behavior
        this.behavior = 'commander';
        this.state = 'patrol'; // patrol, active, defensive, retreating, rallying, returning
        this.target = null;
        this.campPosition = { x: this.x, y: this.y };
        this.patrolRadius = 200;
        
        // Summoned minions
        this.summonedBandits = [];
        this.maxSummonedBandits = 3;
        this.summonCooldownActive = false;
        
        // Special abilities
        this.abilities = {
            commandBandits: {
                name: 'Command Bandits',
                cooldown: 25000,
                lastUsed: 0,
                summonCount: 3,
                description: 'Summons bandit minions'
            },
            swordDance: {
                name: 'Sword Dance',
                cooldown: 12000,
                lastUsed: 0,
                damage: this.damage * 1.3,
                hits: 3,
                description: 'Multi-hit combo attack'
            },
            inspire: {
                name: 'Inspire',
                cooldown: 18000,
                lastUsed: 0,
                duration: 10000,
                damageBoost: 0.2, // 20% more damage for allies
                attackSpeedBoost: 0.15,
                range: 200,
                description: 'Buffs nearby allies'
            },
            retreatCall: {
                name: 'Retreat Call',
                cooldown: 30000,
                lastUsed: 0,
                healPercent: 0.1, // 10% heal for all allies
                speedBoost: 1.3,
                description: 'Orders retreat and heals allies'
            },
            rally: {
                name: 'Rally',
                cooldown: 0, // Only usable when no bandits
                lastUsed: 0,
                instantSummon: true,
                description: 'Instantly summons bandits when alone'
            }
        };
        
        // Combat state
        this.inCombat = false;
        this.combatStartTime = null;
        this.lastAttackTime = 0;
        this.comboCount = 0;
        this.defensiveMode = false;
        this.targetsInAggro = new Set();
        
        // Loot
        this.xpValue = 250;
        this.drops = [
            { id: 'captain_insignia', name: 'Captain Insignia', chance: 0.5, min: 1, max: 1 },
            { id: 'master_sword', name: 'Master Sword', chance: 0.25, min: 1, max: 1 },
            { id: 'desert_armor', name: 'Desert Armor', chance: 0.2, min: 1, max: 1 },
            { id: 'ancient_relics', name: 'Ancient Relics', chance: 0.3, min: 1, max: 2 },
            { id: 'gold_nuggets', name: 'Gold Nuggets', chance: 0.6, min: 2, max: 5 }
        ];
        
        // Resistances
        this.resistances = {
            physical: 0.25,
            fire: 0.15,
            poison: 0.3,
            cold: 0.2,
            holy: 0.1
        };
        
        // Buff state
        this.inspired = false;
        this.inspireEndTime = 0;
        
        // Spawn and despawn
        this.spawnTime = Date.now();
        this.respawnTime = 90000; // 90 seconds
        
        // Timers
        this.updateInterval = null;
        this.lastUpdate = Date.now();
        
        this.initialize();
    }
    
    initialize() {
        console.log(`[MercenaryCaptain] ${this.id} initialized at (${this.x}, ${this.y})`);
        this.startUpdateLoop();
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => this.update(), 200);
    }
    
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // Update summoned bandits
        this.updateSummonedBandits(deltaTime);
        
        // Check inspire buff expiration
        if (this.inspired && now >= this.inspireEndTime) {
            this.inspired = false;
            console.log(`[MercenaryCaptain] ${this.id} inspire buff expired`);
        }
        
        // Auto-summon if alone and in combat
        if (this.inCombat && this.summonedBandits.length === 0 && !this.summonCooldownActive) {
            const now = Date.now();
            if (now - this.abilities.rally.lastUsed >= 5000) {
                this.useAbility('rally');
            }
        }
        
        // State machine
        switch (this.state) {
            case 'patrol':
                this.updatePatrol(deltaTime);
                break;
            case 'active':
                this.updateActive(deltaTime);
                break;
            case 'defensive':
                this.updateDefensive(deltaTime);
                break;
            case 'rallying':
                this.updateRallying(deltaTime);
                break;
            case 'retreating':
                this.updateRetreating(deltaTime);
                break;
            case 'returning':
                this.updateReturning(deltaTime);
                break;
            case 'dead':
                break;
        }
    }
    
    updateSummonedBandits(deltaTime) {
        // Clean up dead bandits
        this.summonedBandits = this.summonedBandits.filter(bandit => {
            return bandit.hp > 0;
        });
        
        // Update each bandit
        for (const bandit of this.summonedBandits) {
            if (bandit.update) {
                // Captain's bandits are stronger
                const effectiveDamage = this.inspired ? 
                    bandit.damage * 1.2 : bandit.damage;
                bandit.update(deltaTime, this.target, effectiveDamage);
            }
        }
        
        // Command bandits to attack captain's target
        if (this.target) {
            for (const bandit of this.summonedBandits) {
                if (!bandit.target || bandit.target !== this.target) {
                    bandit.setTarget?.(this.target);
                }
            }
        }
    }
    
    updatePatrol(deltaTime) {
        if (this.target) {
            this.state = 'active';
            
            // Summon bandits at combat start
            const now = Date.now();
            if (this.summonedBandits.length === 0 && 
                now - this.abilities.commandBandits.lastUsed >= this.abilities.commandBandits.cooldown) {
                this.state = 'rallying';
            }
            return;
        }
        
        // Patrol around camp
        const distanceToCamp = this.getDistanceTo(this.campPosition);
        
        if (distanceToCamp > this.patrolRadius) {
            this.moveToward(this.campPosition, deltaTime);
        } else {
            // Random patrol
            if (Math.random() < 0.2) {
                const angle = Math.random() * Math.PI * 2;
                const moveDistance = this.moveSpeed * deltaTime * 0.4;
                this.x += Math.cos(angle) * moveDistance;
                this.y += Math.sin(angle) * moveDistance;
            }
        }
    }
    
    updateRallying(deltaTime) {
        // Pause to summon
        if (this.summonedBandits.length === 0) {
            this.useAbility('commandBandits');
        }
        
        // After summoning, go active
        if (this.summonedBandits.length > 0) {
            this.state = 'active';
        }
    }
    
    updateActive(deltaTime) {
        if (!this.target) {
            this.state = 'returning';
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        const distanceFromCamp = this.getDistanceTo(this.campPosition);
        
        // Leash check
        if (distanceFromCamp > this.leashRadius) {
            this.useAbility('retreatCall');
            this.state = 'retreating';
            return;
        }
        
        // Enter defensive mode at low HP
        if (this.hp / this.maxHp < 0.4 && !this.defensiveMode) {
            this.state = 'defensive';
            return;
        }
        
        // Summon more bandits if most are dead
        if (this.summonedBandits.length < 2 && this.hp / this.maxHp > 0.3) {
            const now = Date.now();
            if (now - this.abilities.commandBandits.lastUsed >= this.abilities.commandBandits.cooldown) {
                this.useAbility('commandBandits');
            }
        }
        
        // Use inspire periodically
        const now = Date.now();
        if (now - this.abilities.inspire.lastUsed >= this.abilities.inspire.cooldown) {
            if (this.summonedBandits.length > 0) {
                this.useAbility('inspire');
            }
        }
        
        this.updateCombat(deltaTime);
    }
    
    updateDefensive(deltaTime) {
        if (!this.defensiveMode) {
            this.defensiveMode = true;
            console.log(`[MercenaryCaptain] ${this.id} enters defensive mode`);
        }
        
        if (!this.target) {
            this.defensiveMode = false;
            this.state = 'returning';
            return;
        }
        
        // Summon bandits immediately if needed
        if (this.summonedBandits.length === 0) {
            this.useAbility('rally');
        }
        
        // Use retreat call if very low
        if (this.hp / this.maxHp < 0.25) {
            this.useAbility('retreatCall');
        }
        
        // Continue fighting defensively
        this.updateCombat(deltaTime);
        
        // Exit defensive if recovered
        if (this.hp / this.maxHp > 0.6) {
            this.defensiveMode = false;
            this.state = 'active';
        }
    }
    
    updateRetreating(deltaTime) {
        // Run back to camp with bandits
        const distanceToCamp = this.getDistanceTo(this.campPosition);
        
        if (distanceToCamp <= 30) {
            this.defensiveMode = false;
            this.state = 'defensive'; // Hold position at camp
            return;
        }
        
        // Command bandits to retreat too
        for (const bandit of this.summonedBandits) {
            if (bandit.retreat) {
                bandit.retreat(this.campPosition);
            }
        }
        
        // Fast retreat
        this.moveToward(this.campPosition, deltaTime, this.moveSpeed * 1.2);
    }
    
    updateReturning(deltaTime) {
        const distanceToCamp = this.getDistanceTo(this.campPosition);
        
        if (distanceToCamp <= 10) {
            this.state = 'patrol';
            this.defensiveMode = false;
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.3); // Heal 30%
            
            // Dismiss summoned bandits
            this.summonedBandits = [];
            this.summonCooldownActive = false;
            
            console.log(`[MercenaryCaptain] ${this.id} returned to camp`);
            return;
        }
        
        // Check for targets while returning
        if (this.target && this.getDistanceTo(this.target) <= this.aggroRange) {
            this.state = 'active';
            return;
        }
        
        this.moveToward(this.campPosition, deltaTime);
    }
    
    updateCombat(deltaTime) {
        const now = Date.now();
        const distance = this.getDistanceTo(this.target);
        
        // Use sword dance when in melee
        if (distance <= this.attackRange && Math.random() < 0.4) {
            if (now - this.abilities.swordDance.lastUsed >= this.abilities.swordDance.cooldown) {
                this.useAbility('swordDance', this.target);
                return;
            }
        }
        
        // Basic attack or move
        if (distance <= this.attackRange) {
            if (now - this.lastAttackTime >= (1000 / this.attackSpeed)) {
                this.attack(this.target);
            }
        } else {
            this.moveToward(this.target, deltaTime);
        }
    }
    
    // Abilities
    useAbility(abilityName, target = null) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        
        const now = Date.now();
        if (ability.cooldown > 0 && now - ability.lastUsed < ability.cooldown) return false;
        
        ability.lastUsed = now;
        
        switch (abilityName) {
            case 'commandBandits':
                this.performCommandBandits(ability);
                break;
            case 'swordDance':
                this.performSwordDance(target, ability);
                break;
            case 'inspire':
                this.performInspire(ability);
                break;
            case 'retreatCall':
                this.performRetreatCall(ability);
                break;
            case 'rally':
                this.performRally(ability);
                break;
        }
        
        return true;
    }
    
    performCommandBandits(ability) {
        console.log(`[MercenaryCaptain] ${this.id} commands bandits to attack!`);
        
        for (let i = 0; i < ability.summonCount; i++) {
            const angle = (Math.PI * 2 * i) / ability.summonCount;
            const distance = 40;
            
            const bandit = {
                id: `${this.id}_bandit_${i}`,
                hp: 350,
                maxHp: 350,
                damage: 40,
                attackSpeed: 1.2,
                moveSpeed: 100,
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                target: this.target,
                owner: this,
                inspired: false,
                
                update: function(deltaTime, target, effectiveDamage) {
                    if (!target || this.hp <= 0) return;
                    
                    const dx = (target.x || target.position?.x) - this.x;
                    const dy = (target.y || target.position?.y) - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 30 && dist > 0) {
                        const speed = this.moveSpeed * deltaTime;
                        this.x += (dx / dist) * speed;
                        this.y += (dy / dist) * speed;
                    } else {
                        // Attack
                        if (target.takeDamage) {
                            const dmg = effectiveDamage || this.damage;
                            target.takeDamage(dmg, this.owner.id, 'physical');
                        }
                    }
                },
                
                setTarget: function(target) {
                    this.target = target;
                },
                
                retreat: function(position) {
                    // Move toward retreat position
                },
                
                applyInspire: function() {
                    this.inspired = true;
                    this.damage *= 1.2;
                    this.attackSpeed *= 1.15;
                }
            };
            
            if (this.inspired) {
                bandit.applyInspire();
            }
            
            this.summonedBandits.push(bandit);
        }
        
        this.summonCooldownActive = true;
        
        this.emitCombatEvent('ability_used', {
            ability: 'commandBandits',
            count: ability.summonCount
        });
    }
    
    performSwordDance(target, ability) {
        console.log(`[MercenaryCaptain] ${this.id} performs Sword Dance!`);
        
        let totalDamage = 0;
        
        for (let i = 0; i < ability.hits; i++) {
            setTimeout(() => {
                if (this.hp <= 0 || !target) return;
                
                const damage = this.calculateDamage(ability.damage / ability.hits, target);
                this.dealDamage(target, damage, 'physical');
                totalDamage += damage;
                
                this.emitCombatEvent('sword_dance_hit', {
                    hit: i + 1,
                    damage,
                    target: target.id
                });
            }, i * 300); // 300ms between hits
        }
        
        this.emitCombatEvent('ability_used', {
            ability: 'swordDance',
            target: target.id,
            hits: ability.hits,
            totalDamage
        });
    }
    
    performInspire(ability) {
        console.log(`[MercenaryCaptain] ${this.id} inspires allies!`);
        
        this.inspired = true;
        this.inspireEndTime = Date.now() + ability.duration;
        
        // Buff summoned bandits
        for (const bandit of this.summonedBandits) {
            if (bandit.applyInspire) {
                bandit.applyInspire();
            }
        }
        
        this.emitCombatEvent('ability_used', {
            ability: 'inspire',
            duration: ability.duration,
            damageBoost: ability.damageBoost,
            attackSpeedBoost: ability.attackSpeedBoost
        });
    }
    
    performRetreatCall(ability) {
        console.log(`[MercenaryCaptain] ${this.id} calls for retreat!`);
        
        // Heal self and bandits
        const selfHeal = this.maxHp * ability.healPercent;
        this.hp = Math.min(this.maxHp, this.hp + selfHeal);
        
        for (const bandit of this.summonedBandits) {
            bandit.hp = Math.min(bandit.maxHp, bandit.hp + bandit.maxHp * ability.healPercent);
        }
        
        // Speed boost
        this.emitCombatEvent('ability_used', {
            ability: 'retreatCall',
            healPercent: ability.healPercent,
            speedBoost: ability.speedBoost
        });
        
        // Start retreating
        this.state = 'retreating';
    }
    
    performRally(ability) {
        console.log(`[MercenaryCaptain] ${this.id} rallies bandits instantly!`);
        
        // Instant summon (2 instead of 3)
        const quickSummon = { ...this.abilities.commandBandits, summonCount: 2 };
        this.performCommandBandits(quickSummon);
    }
    
    // Combat methods
    attack(target) {
        this.lastAttackTime = Date.now();
        
        let damage = this.calculateDamage(this.damage, target);
        
        // Inspired bonus
        if (this.inspired) {
            damage = Math.floor(damage * 1.2);
        }
        
        this.dealDamage(target, damage, 'physical');
        
        this.emitCombatEvent('attack', {
            target: target.id,
            damage,
            inspired: this.inspired
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
        
        if (!this.target) {
            this.setTarget(source);
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
        
        console.log(`[MercenaryCaptain] ${this.id} killed by ${killer?.id || killer}`);
        
        // Dismiss all bandits
        for (const bandit of this.summonedBandits) {
            bandit.hp = 0;
        }
        this.summonedBandits = [];
        
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
        this.state = 'patrol';
        this.x = this.campPosition.x;
        this.y = this.campPosition.y;
        this.target = null;
        this.inCombat = false;
        this.defensiveMode = false;
        this.inspired = false;
        this.summonedBandits = [];
        this.summonCooldownActive = false;
        
        Object.values(this.abilities).forEach(a => a.lastUsed = 0);
        
        console.log(`[MercenaryCaptain] ${this.id} respawned at camp`);
    }
    
    moveToward(target, deltaTime, speedOverride = null) {
        const targetX = target.x ?? target.position?.x ?? this.x;
        const targetY = target.y ?? target.position?.y ?? this.y;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            let speed = speedOverride || this.moveSpeed;
            
            const moveDistance = speed * deltaTime;
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
    }
    
    loseTarget() {
        this.target = null;
        this.inCombat = false;
        this.defensiveMode = false;
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
                this.state = 'returning';
            }
        }
    }
    
    emitCombatEvent(eventType, data) {
        console.log(`[MercenaryCaptain] Event: ${eventType}`, data);
    }
    
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
            defensiveMode: this.defensiveMode,
            inspired: this.inspired,
            summonedCount: this.summonedBandits.length
        };
    }
    
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
            summonedBandits: this.summonedBandits.map(b => ({
                id: b.id,
                hp: b.hp,
                x: b.x,
                y: b.y
            }))
        };
    }
    
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

module.exports = MercenaryCaptain;
