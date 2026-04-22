/**
 * FrostWolf.js
 * 
 * Level 67 pack hunter with ice abilities
 * Coordinates attacks with pack members
 */

const EventEmitter = require('events');

class FrostWolf extends EventEmitter {
    constructor(id, position, zone = 'draconia') {
        super();
        
        this.id = id;
        this.type = 'frost_wolf';
        this.name = 'Frost Wolf';
        this.zone = zone;
        
        // Position
        this.x = position.x;
        this.y = position.y;
        this.subZone = position.subZone || 'frostfire_ridge';
        
        // Pack information
        this.packId = position.packId || 0;
        this.packLeader = position.isLeader || false;
        this.packMembers = []; // Filled by spawn manager
        
        // Stats
        this.level = 67;
        this.maxHp = 1000;
        this.hp = this.maxHp;
        this.damage = 90;
        this.armor = 30;
        this.moveSpeed = 110; // Fast
        this.attackRange = 40;
        this.aggroRange = 300;
        
        // Resistances
        this.resistances = {
            ice: 0.6,      // 60% ice resistance
            fire: -0.4,   // 40% fire weakness
            physical: 0.1  // 10% physical resistance
        };
        
        // Combat
        this.target = null;
        this.inCombat = false;
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        this.howlCooldown = 45000;
        this.lastHowlTime = 0;
        
        // Pack bonus
        this.nearbyPackMembers = 0;
        this.packBonusDamage = 0;
        
        // Abilities
        this.abilities = {
            frostBite: {
                name: 'Frost Bite',
                cooldown: 6000,
                lastUsed: 0,
                damage: 100,
                effect: 'frostbite'
            },
            howl: {
                name: 'Howl',
                cooldown: 45000,
                lastUsed: 0,
                summonCount: [1, 2]
            },
            rend: {
                name: 'Rend',
                cooldown: 10000,
                lastUsed: 0,
                damage: 120,
                bleedDuration: 8000
            }
        };
        
        // State
        this.state = 'idle';
        this.patrolCenter = { x: this.x, y: this.y };
        this.patrolRadius = 250;
        
        // Loot
        this.xpValue = 500;
        this.lootTable = [
            { item: 'frost_pelt', chance: 0.5, quantity: 1 },
            { item: 'wolf_fang', chance: 0.7, quantity: [1, 2] },
            { item: 'icy_meat', chance: 0.6, quantity: [1, 3] },
            { item: 'frost_essence', chance: 0.3, quantity: 1 }
        ];
        
        // Update loop
        this.updateInterval = null;
        this.startUpdateLoop();
        
        this.onDeath = null;
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.update(1);
        }, 1000);
    }
    
    update(deltaTime) {
        // Check for nearby pack members
        this.updatePackBonus();
        
        // State machine
        switch (this.state) {
            case 'idle':
                this.updateIdle(deltaTime);
                break;
            case 'patrolling':
                this.updatePatrol(deltaTime);
                break;
            case 'hunting':
                this.updateHunting(deltaTime);
                break;
            case 'combat':
                this.updateCombat(deltaTime);
                break;
            case 'retreating':
                this.updateRetreating(deltaTime);
                break;
        }
    }
    
    updatePackBonus() {
        // This would check actual nearby wolves in a real implementation
        // For now, use a simulation based on spawn data
        this.nearbyPackMembers = Math.min(3, Math.floor(Math.random() * 4));
        
        // Pack bonus: +10% damage per nearby pack member
        this.packBonusDamage = this.nearbyPackMembers * 0.1;
    }
    
    updateIdle(deltaTime) {
        if (Math.random() < 0.15) {
            this.state = 'patrolling';
        }
        
        // Listen for howls from pack members
        this.checkForHowl();
    }
    
    updatePatrol(deltaTime) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.patrolRadius;
        
        this.x = this.patrolCenter.x + Math.cos(angle) * distance;
        this.y = this.patrolCenter.y + Math.sin(angle) * distance;
        
        if (Math.random() < 0.05) {
            this.state = 'idle';
        }
    }
    
    updateHunting(deltaTime) {
        if (!this.target) {
            this.state = 'idle';
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        
        // Howl if far from target to alert pack
        if (distance > 200 && this.canUseAbility('howl')) {
            this.useAbility('howl');
        }
        
        // Move to target
        if (distance > this.attackRange) {
            this.moveToward(this.target, deltaTime);
        } else {
            this.state = 'combat';
            this.inCombat = true;
        }
    }
    
    updateCombat(deltaTime) {
        if (!this.target) {
            this.state = 'idle';
            this.inCombat = false;
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        
        if (distance > 400) {
            this.state = 'idle';
            this.target = null;
            this.inCombat = false;
            return;
        }
        
        // Use abilities
        if (this.canUseAbility('rend')) {
            this.useAbility('rend', this.target);
        } else if (this.canUseAbility('frostBite')) {
            this.useAbility('frostBite', this.target);
        }
        
        // Howl if low HP
        if (this.hp < this.maxHp * 0.4 && this.canUseAbility('howl')) {
            this.useAbility('howl');
        }
        
        // Basic attack
        if (distance <= this.attackRange) {
            this.attack(this.target);
        } else {
            this.moveToward(this.target, deltaTime);
        }
        
        // Retreat if alone and low HP
        if (this.nearbyPackMembers === 0 && this.hp < this.maxHp * 0.2) {
            this.state = 'retreating';
        }
    }
    
    updateRetreating(deltaTime) {
        // Run away from target
        if (this.target) {
            const dx = this.x - this.target.x;
            const dy = this.y - this.target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                this.x += (dx / distance) * this.moveSpeed * deltaTime;
                this.y += (dy / distance) * this.moveSpeed * deltaTime;
            }
            
            // Stop retreating if far enough or healed
            if (distance > 500 || this.hp > this.maxHp * 0.5) {
                this.state = 'idle';
            }
        }
    }
    
    checkForHowl() {
        // In real implementation, would listen to events from other wolves
        // This triggers aggro when pack member howls
    }
    
    canUseAbility(abilityName) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        return Date.now() - ability.lastUsed >= ability.cooldown;
    }
    
    useAbility(abilityName, target = null) {
        const ability = this.abilities[abilityName];
        if (!ability || !this.canUseAbility(abilityName)) return false;
        
        ability.lastUsed = Date.now();
        
        switch (abilityName) {
            case 'frostBite':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'ice');
                    
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({
                            type: 'frostbite',
                            damagePerSecond: 12,
                            duration: 6000,
                            slowPercent: 0.3,
                            source: this.id
                        });
                    }
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
                
            case 'howl':
                // Summon additional wolves
                const summonCount = Array.isArray(ability.summonCount) ? 
                    Math.floor(Math.random() * (ability.summonCount[1] - ability.summonCount[0] + 1)) + ability.summonCount[0] :
                    ability.summonCount;
                
                this.emit('howl', {
                    id: this.id,
                    x: this.x,
                    y: this.y,
                    packId: this.packId,
                    summonCount: summonCount
                });
                
                // Howl alerts other pack members to target
                if (this.target) {
                    this.emit('packAlert', {
                        packId: this.packId,
                        target: this.target,
                        source: this.id
                    });
                }
                break;
                
            case 'rend':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'physical');
                    
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({
                            type: 'bleed',
                            damagePerSecond: 20,
                            duration: ability.bleedDuration,
                            source: this.id
                        });
                    }
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
        }
        
        return true;
    }
    
    attack(target) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;
        
        this.lastAttackTime = now;
        
        if (target && target.takeDamage) {
            // Apply pack bonus
            let damage = this.damage * (1 + this.packBonusDamage);
            damage = this.calculateDamage(damage, target);
            target.takeDamage(damage, this, 'physical');
            
            this.emit('attack', {
                id: this.id,
                target: target.id,
                damage: damage,
                packBonus: this.packBonusDamage > 0,
                type: 'physical'
            });
        }
    }
    
    calculateDamage(baseDamage, target) {
        let damage = baseDamage;
        damage *= (0.9 + Math.random() * 0.2);
        
        if (target.resistances) {
            const resistance = target.resistances.physical || 0;
            damage *= (1 - resistance);
        }
        
        return Math.floor(damage);
    }
    
    takeDamage(damage, source, type = 'physical') {
        if (this.resistances[type]) {
            damage *= (1 - this.resistances[type]);
        }
        
        damage = Math.max(1, Math.floor(damage));
        this.hp -= damage;
        
        // Aggro
        if (!this.inCombat && source) {
            this.target = source;
            this.state = 'hunting';
            this.inCombat = true;
        }
        
        // Howl on damage if pack member
        if (this.nearbyPackMembers > 0 && this.canUseAbility('howl') && Math.random() < 0.3) {
            this.useAbility('howl');
        }
        
        // Retreat if alone and low HP
        if (this.nearbyPackMembers === 0 && this.hp < this.maxHp * 0.25) {
            this.state = 'retreating';
        }
        
        this.emit('damageTaken', {
            id: this.id,
            damage: damage,
            hp: this.hp,
            maxHp: this.maxHp,
            source: source?.id
        });
        
        if (this.hp <= 0) {
            this.die(source);
        }
        
        return damage;
    }
    
    die(source) {
        this.hp = 0;
        this.state = 'dead';
        this.inCombat = false;
        
        const loot = this.generateLoot();
        
        this.emit('death', {
            id: this.id,
            source: source?.id,
            loot: loot,
            xpValue: this.xpValue,
            packId: this.packId
        });
        
        if (this.onDeath) this.onDeath();
        this.cleanup();
    }
    
    generateLoot() {
        const loot = [];
        for (const item of this.lootTable) {
            if (Math.random() < item.chance) {
                let quantity = item.quantity;
                if (Array.isArray(quantity)) {
                    quantity = Math.floor(Math.random() * (quantity[1] - quantity[0] + 1)) + quantity[0];
                }
                loot.push({ item: item.item, quantity });
            }
        }
        return loot;
    }
    
    moveToward(target, deltaTime) {
        if (!target || target.x === undefined || target.y === undefined) return;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            const moveDistance = this.moveSpeed * deltaTime;
            this.x += (dx / distance) * moveDistance;
            this.y += (dy / distance) * moveDistance;
        }
    }
    
    getDistanceTo(target) {
        if (!target || target.x === undefined || target.y === undefined) return Infinity;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getClientData() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            x: this.x,
            y: this.y,
            level: this.level,
            hp: this.hp,
            maxHp: this.maxHp,
            state: this.state,
            packId: this.packId,
            packBonus: this.packBonusDamage > 0
        };
    }
    
    getFullData() {
        return {
            ...this.getClientData(),
            damage: this.damage,
            armor: this.armor,
            resistances: this.resistances,
            abilities: Object.keys(this.abilities),
            xpValue: this.xpValue,
            inCombat: this.inCombat,
            target: this.target?.id || null
        };
    }
    
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.removeAllListeners();
    }
}

module.exports = FrostWolf;
