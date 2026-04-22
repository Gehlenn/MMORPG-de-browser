/**
 * Mummy.js
 * 
 * Mummy mob for Aurélia desert zone
 * Level 45, slow but powerful undead with curse abilities
 * Weakness: Fire, Resistance: Physical
 */

class Mummy {
    constructor(id, position, zone) {
        this.id = id || `mummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = 'mummy';
        this.name = 'Cursed Mummy';
        this.level = 45;
        
        // Position
        this.x = position?.x || 0;
        this.y = position?.y || 0;
        this.zone = zone || 'aurelia';
        this.subZone = position?.subZone || 'ruins_ankhet';
        
        // Stats
        this.maxHp = 550;
        this.hp = this.maxHp;
        this.damage = 50;
        this.attackSpeed = 0.6; // Slow attacks
        this.moveSpeed = 50; // Very slow
        this.aggroRange = 120;
        this.attackRange = 40;
        
        // Behavior
        this.behavior = 'slow_striker';
        this.state = 'dormant'; // dormant, active, attacking, returning
        this.target = null;
        this.spawnPoint = { x: this.x, y: this.y };
        this.leashRadius = 250;
        
        // Special abilities
        this.abilities = {
            bandageBind: {
                name: 'Bandage Bind',
                cooldown: 15000,
                lastUsed: 0,
                rootDuration: 3000,
                damage: this.damage * 0.7,
                description: 'Wraps target in bandages, rooting them'
            },
            curseOfDecay: {
                name: 'Curse of Decay',
                cooldown: 20000,
                lastUsed: 0,
                statReduction: 0.2, // 20% reduction to all stats
                duration: 15000,
                description: 'Reduces all player stats'
            },
            summonScarab: {
                name: 'Summon Scarab',
                cooldown: 12000,
                lastUsed: 0,
                count: 3,
                scarabHp: 30,
                scarabDamage: 8,
                description: 'Summons scarab swarms'
            }
        };
        
        // Combat state
        this.inCombat = false;
        this.combatStartTime = null;
        this.lastAttackTime = 0;
        this.targetsInAggro = new Set();
        this.summonedScarabs = []; // Track summoned minions
        
        // Loot
        this.xpValue = 140;
        this.drops = [
            { id: 'linen_wraps', name: 'Linen Wraps', chance: 0.6, min: 1, max: 2 },
            { id: 'ancient_coin', name: 'Ancient Coin', chance: 0.5, min: 1, max: 3 },
            { id: 'cursed_amulet', name: 'Cursed Amulet', chance: 0.2, min: 1, max: 1 },
            { id: 'ancient_relics', name: 'Ancient Relics', chance: 0.15, min: 1, max: 1 }
        ];
        
        // Resistances
        this.resistances = {
            physical: 0.4, // High physical resistance
            fire: -0.5, // Severe fire weakness
            poison: 1.0, // Immune to poison
            cold: 0.2,
            holy: -0.3 // Weak to holy damage
        };
        
        // Spawn and despawn
        this.spawnTime = Date.now();
        this.respawnTime = 75000; // 75 seconds
        
        // Dormant state
        this.isDormant = true;
        this.dormantWakeRange = 80; // Closer range to wake from dormant
        
        // Timers
        this.updateInterval = null;
        this.lastUpdate = Date.now();
        
        this.initialize();
    }
    
    initialize() {
        console.log(`[Mummy] ${this.id} initialized at (${this.x}, ${this.y}) - dormant`);
        this.startUpdateLoop();
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => this.update(), 200);
    }
    
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // Update scarabs
        this.updateScarabs(deltaTime);
        
        // State machine
        switch (this.state) {
            case 'dormant':
                this.updateDormant(deltaTime);
                break;
            case 'active':
                this.updateActive(deltaTime);
                break;
            case 'attacking':
                this.updateAttacking(deltaTime);
                break;
            case 'returning':
                this.updateReturning(deltaTime);
                break;
            case 'dead':
                break;
        }
    }
    
    updateDormant(deltaTime) {
        // Wait for player to get close
        if (this.target) {
            const distance = this.getDistanceTo(this.target);
            
            if (distance <= this.dormantWakeRange) {
                this.wakeUp();
            }
        }
    }
    
    updateActive(deltaTime) {
        if (!this.target) {
            this.state = 'returning';
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        const distanceFromSpawn = this.getDistanceTo(this.spawnPoint);
        
        // Leash check
        if (distanceFromSpawn > this.leashRadius) {
            this.loseTarget();
            this.state = 'returning';
            return;
        }
        
        // Check if target too far
        if (distance > this.aggroRange * 1.5) {
            this.loseTarget();
            this.state = 'returning';
            return;
        }
        
        this.updateCombat(deltaTime);
    }
    
    updateAttacking(deltaTime) {
        // Brief attacking state after using ability
        const now = Date.now();
        if (now - this.lastAttackTime > 500) {
            this.state = 'active';
        }
    }
    
    updateReturning(deltaTime) {
        const distanceToSpawn = this.getDistanceTo(this.spawnPoint);
        
        if (distanceToSpawn <= 5) {
            // Back at spawn, go dormant
            this.state = 'dormant';
            this.isDormant = true;
            this.hp = this.maxHp; // Regen when dormant
            console.log(`[Mummy] ${this.id} returned to dormant state`);
            return;
        }
        
        // Check for targets while returning (but at reduced range)
        if (this.target && this.getDistanceTo(this.target) <= this.aggroRange) {
            this.state = 'active';
            return;
        }
        
        // Move back to spawn
        this.moveToward(this.spawnPoint, deltaTime);
    }
    
    updateCombat(deltaTime) {
        const now = Date.now();
        const distance = this.getDistanceTo(this.target);
        
        // Use abilities when available
        if (distance <= this.attackRange * 2) {
            // Try curse first (debuff)
            if (now - this.abilities.curseOfDecay.lastUsed >= this.abilities.curseOfDecay.cooldown) {
                this.useAbility('curseOfDecay', this.target);
                return;
            }
            
            // Then bandage bind (root)
            if (now - this.abilities.bandageBind.lastUsed >= this.abilities.bandageBind.cooldown) {
                this.useAbility('bandageBind', this.target);
                return;
            }
            
            // Summon scarabs when HP is low
            if (this.hp / this.maxHp < 0.5 && 
                now - this.abilities.summonScarab.lastUsed >= this.abilities.summonScarab.cooldown) {
                this.useAbility('summonScarab', this.target);
                return;
            }
        }
        
        // Basic attack
        if (distance <= this.attackRange) {
            if (now - this.lastAttackTime >= (1000 / this.attackSpeed)) {
                this.attack(this.target);
            }
        } else {
            // Move toward target (slowly)
            this.moveToward(this.target, deltaTime);
        }
    }
    
    // Update summoned scarabs
    updateScarabs(deltaTime) {
        // Clean up dead scarabs
        this.summonedScarabs = this.summonedScarabs.filter(scarab => scarab.hp > 0);
        
        // Update each scarab
        for (const scarab of this.summonedScarabs) {
            if (scarab.update) {
                scarab.update(deltaTime, this.target);
            }
        }
    }
    
    // Wake up from dormant state
    wakeUp() {
        this.isDormant = false;
        this.state = 'active';
        console.log(`[Mummy] ${this.id} wakes from dormancy!`);
        
        // Emit wake event
        this.emitCombatEvent('wake', {
            position: { x: this.x, y: this.y }
        });
    }
    
    // Abilities
    useAbility(abilityName, target) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        
        const now = Date.now();
        if (now - ability.lastUsed < ability.cooldown) return false;
        
        ability.lastUsed = now;
        
        switch (abilityName) {
            case 'bandageBind':
                this.performBandageBind(target, ability);
                break;
            case 'curseOfDecay':
                this.performCurseOfDecay(target, ability);
                break;
            case 'summonScarab':
                this.performSummonScarab(target, ability);
                break;
        }
        
        this.state = 'attacking';
        this.lastAttackTime = now;
        
        return true;
    }
    
    performBandageBind(target, ability) {
        console.log(`[Mummy] ${this.id} uses Bandage Bind on ${target.id || target}`);
        
        // Deal damage
        const damage = this.calculateDamage(ability.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        // Root the target
        if (target.applyStatusEffect) {
            target.applyStatusEffect({
                type: 'root',
                duration: ability.rootDuration,
                source: this.id,
                visual: 'bandages'
            });
        }
        
        this.emitCombatEvent('ability_used', {
            ability: 'bandageBind',
            target: target.id,
            damage,
            rootDuration: ability.rootDuration
        });
    }
    
    performCurseOfDecay(target, ability) {
        console.log(`[Mummy] ${this.id} casts Curse of Decay on ${target.id || target}`);
        
        // Apply curse debuff
        if (target.applyStatusEffect) {
            target.applyStatusEffect({
                type: 'curse',
                subtype: 'decay',
                duration: ability.duration,
                statReduction: ability.statReduction,
                source: this.id,
                visual: 'purple_aura'
            });
        }
        
        this.emitCombatEvent('ability_used', {
            ability: 'curseOfDecay',
            target: target.id,
            statReduction: ability.statReduction,
            duration: ability.duration
        });
    }
    
    performSummonScarab(target, ability) {
        console.log(`[Mummy] ${this.id} summons ${ability.count} scarabs!`);
        
        for (let i = 0; i < ability.count; i++) {
            const angle = (Math.PI * 2 * i) / ability.count;
            const distance = 30;
            
            const scarab = {
                id: `${this.id}_scarab_${i}`,
                hp: ability.scarabHp,
                maxHp: ability.scarabHp,
                damage: ability.scarabDamage,
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                target: target,
                owner: this,
                
                update: (deltaTime, target) => {
                    if (!target || this.hp <= 0) {
                        this.hp = 0; // Die if mummy dies or no target
                        return;
                    }
                    
                    // Move toward target
                    const dx = (target.x || target.position?.x) - this.x;
                    const dy = (target.y || target.position?.y) - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 20 && dist > 0) {
                        const speed = 60 * deltaTime;
                        this.x += (dx / dist) * speed;
                        this.y += (dy / dist) * speed;
                    } else {
                        // Attack
                        if (target.takeDamage) {
                            target.takeDamage(this.damage, this.owner.id, 'physical');
                        }
                    }
                }
            };
            
            this.summonedScarabs.push(scarab);
        }
        
        this.emitCombatEvent('ability_used', {
            ability: 'summonScarab',
            count: ability.count,
            scarabHp: ability.scarabHp,
            scarabDamage: ability.scarabDamage
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
        // Fire damage does extra
        let resistance = this.resistances[type] || 0;
        
        // Special fire weakness
        if (type === 'fire') {
            console.log(`[Mummy] ${this.id} takes EXTRA fire damage!`);
        }
        
        const finalDamage = Math.floor(damage * (1 - resistance));
        this.hp = Math.max(0, this.hp - finalDamage);
        
        // Wake up if dormant and taking damage
        if (this.isDormant && finalDamage > 0) {
            this.target = source;
            this.wakeUp();
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
        
        // Kill all summoned scarabs
        this.summonedScarabs.forEach(s => s.hp = 0);
        this.summonedScarabs = [];
        
        console.log(`[Mummy] ${this.id} killed by ${killer?.id || killer}`);
        
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
        this.state = 'dormant';
        this.isDormant = true;
        this.x = this.spawnPoint.x;
        this.y = this.spawnPoint.y;
        this.target = null;
        this.inCombat = false;
        this.summonedScarabs = [];
        
        // Reset cooldowns
        Object.values(this.abilities).forEach(a => a.lastUsed = 0);
        
        console.log(`[Mummy] ${this.id} respawned and dormant`);
    }
    
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
        if (this.isDormant) {
            this.wakeUp();
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
                this.state = 'returning';
            }
        }
    }
    
    emitCombatEvent(eventType, data) {
        console.log(`[Mummy] Event: ${eventType}`, data);
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
            isDormant: this.isDormant,
            scarabCount: this.summonedScarabs.length
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
            summonedScarabs: this.summonedScarabs.map(s => ({
                id: s.id,
                hp: s.hp,
                x: s.x,
                y: s.y
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

module.exports = Mummy;
