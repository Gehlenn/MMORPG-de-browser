/**
 * Wyvern.js
 * 
 * Level 70 flying predator
 * Uses wind currents for speed, dive attacks
 */

const EventEmitter = require('events');

class Wyvern extends EventEmitter {
    constructor(id, position, zone = 'draconia') {
        super();
        
        this.id = id;
        this.type = 'wyvern';
        this.name = 'Wyvern';
        this.zone = zone;
        
        this.x = position.x;
        this.y = position.y;
        this.subZone = position.subZone || 'wyvern_heights';
        
        this.level = 70;
        this.maxHp = 1800;
        this.hp = this.maxHp;
        this.damage = 110;
        this.armor = 35;
        this.moveSpeed = 140; // Very fast
        this.flightSpeed = 180; // Even faster in flight
        this.attackRange = 50;
        this.aggroRange = 350;
        
        this.resistances = {
            physical: 0.2,
            wind: 0.5,
            fire: 0.1,
            ice: 0.1
        };
        
        this.target = null;
        this.inCombat = false;
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        
        this.abilities = {
            diveBomb: {
                name: 'Dive Bomb',
                cooldown: 12000,
                lastUsed: 0,
                damage: 200,
                stunDuration: 2000,
                requiresHeight: true
            },
            tailWhip: {
                name: 'Tail Whip',
                cooldown: 6000,
                lastUsed: 0,
                damage: 80,
                knockback: 100,
                coneAngle: Math.PI / 2
            },
            windGust: {
                name: 'Wind Gust',
                cooldown: 8000,
                lastUsed: 0,
                damage: 60,
                range: 150,
                pushDistance: 80
            },
            takeFlight: {
                name: 'Take Flight',
                cooldown: 20000,
                lastUsed: 0,
                duration: 10000
            }
        };
        
        this.state = 'perched'; // perched, flying, diving, combat, retreating
        this.isFlying = false;
        this.height = 0; // 0 = ground, 100 = max height
        this.flightEndTime = 0;
        
        this.perchPoint = { x: this.x, y: this.y };
        this.patrolRadius = 300;
        
        this.xpValue = 650;
        this.lootTable = [
            { item: 'wyvern_wing', chance: 0.35, quantity: [1, 2] },
            { item: 'wyvern_scale', chance: 0.5, quantity: [2, 4] },
            { item: 'wyvern_talon', chance: 0.6, quantity: [1, 3] },
            { item: 'wind_essence', chance: 0.25, quantity: 1 }
        ];
        
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
        // Update flight state
        if (this.isFlying && Date.now() > this.flightEndTime) {
            this.land();
        }
        
        switch (this.state) {
            case 'perched':
                this.updatePerched(deltaTime);
                break;
            case 'flying':
                this.updateFlying(deltaTime);
                break;
            case 'diving':
                this.updateDiving(deltaTime);
                break;
            case 'combat':
                this.updateCombat(deltaTime);
                break;
            case 'retreating':
                this.updateRetreating(deltaTime);
                break;
        }
    }
    
    updatePerched(deltaTime) {
        // Scan for targets
        if (Math.random() < 0.05) {
            // Would check for nearby players in real implementation
            this.state = 'flying';
            this.takeFlight();
        }
    }
    
    updateFlying(deltaTime) {
        // Patrol area while flying
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.patrolRadius;
        
        this.x = this.perchPoint.x + Math.cos(angle) * distance;
        this.y = this.perchPoint.y + Math.sin(angle) * distance;
        
        // Look for targets to dive on
        if (this.target && this.canUseAbility('diveBomb')) {
            this.state = 'diving';
        }
    }
    
    updateDiving(deltaTime) {
        if (!this.target) {
            this.state = 'flying';
            return;
        }
        
        // Execute dive bomb
        if (this.canUseAbility('diveBomb')) {
            this.useAbility('diveBomb', this.target);
        }
        
        // After dive, enter combat or return to flying
        if (this.getDistanceTo(this.target) <= this.attackRange) {
            this.state = 'combat';
            this.land();
        }
    }
    
    updateCombat(deltaTime) {
        if (!this.target) {
            this.state = 'perched';
            this.inCombat = false;
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        
        if (distance > 400) {
            this.state = 'perched';
            this.target = null;
            this.inCombat = false;
            return;
        }
        
        // Use abilities
        if (distance <= this.abilities.tailWhip.range && this.canUseAbility('tailWhip')) {
            this.useAbility('tailWhip', this.target);
        }
        
        if (distance <= this.abilities.windGust.range && this.canUseAbility('windGust')) {
            this.useAbility('windGust', this.target);
        }
        
        // Take flight if taking too much damage
        if (this.hp < this.maxHp * 0.4 && this.canUseAbility('takeFlight')) {
            this.useAbility('takeFlight');
            this.state = 'flying';
            return;
        }
        
        // Attack or move
        if (distance <= this.attackRange) {
            this.attack(this.target);
        } else {
            this.moveToward(this.target, deltaTime);
        }
        
        // Retreat if critical
        if (this.hp < this.maxHp * 0.15) {
            this.state = 'retreating';
            this.takeFlight();
        }
    }
    
    updateRetreating(deltaTime) {
        // Fly away to perch point
        if (this.isFlying) {
            const dx = this.perchPoint.x - this.x;
            const dy = this.perchPoint.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
                this.x += (dx / distance) * this.flightSpeed * 0.016;
                this.y += (dy / distance) * this.flightSpeed * 0.016;
            } else {
                this.land();
                this.state = 'perched';
                this.target = null;
                this.inCombat = false;
            }
        }
    }
    
    takeFlight() {
        this.isFlying = true;
        this.height = 100;
        this.abilities.takeFlight.lastUsed = Date.now();
        this.flightEndTime = Date.now() + this.abilities.takeFlight.duration;
        
        this.emit('takeFlight', { id: this.id, x: this.x, y: this.y });
    }
    
    land() {
        this.isFlying = false;
        this.height = 0;
        this.emit('land', { id: this.id, x: this.x, y: this.y });
    }
    
    canUseAbility(abilityName) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        
        if (ability.requiresHeight && !this.isFlying) return false;
        
        return Date.now() - ability.lastUsed >= ability.cooldown;
    }
    
    useAbility(abilityName, target = null) {
        const ability = this.abilities[abilityName];
        if (!ability || !this.canUseAbility(abilityName)) return false;
        
        ability.lastUsed = Date.now();
        
        switch (abilityName) {
            case 'diveBomb':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'physical');
                    
                    // Stun
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({
                            type: 'stun',
                            duration: ability.stunDuration,
                            source: this.id
                        });
                    }
                    
                    // Land after dive
                    this.land();
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
                
            case 'tailWhip':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'physical');
                    
                    // Knockback
                    if (target.x !== undefined && target.y !== undefined) {
                        const dx = target.x - this.x;
                        const dy = target.y - this.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance > 0) {
                            target.x += (dx / distance) * ability.knockback;
                            target.y += (dy / distance) * ability.knockback;
                        }
                    }
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
                
            case 'windGust':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'wind');
                    
                    // Push back
                    if (target.x !== undefined && target.y !== undefined) {
                        const dx = target.x - this.x;
                        const dy = target.y - this.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance > 0) {
                            target.x += (dx / distance) * ability.pushDistance;
                            target.y += (dy / distance) * ability.pushDistance;
                        }
                    }
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
                
            case 'takeFlight':
                this.takeFlight();
                break;
        }
        
        return true;
    }
    
    attack(target) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;
        
        this.lastAttackTime = now;
        
        if (target && target.takeDamage) {
            // Bonus damage from height
            let damage = this.damage;
            if (this.height > 50) {
                damage *= 1.3; // 30% bonus from height
            }
            
            damage = this.calculateDamage(damage, target);
            target.takeDamage(damage, this, 'physical');
            
            this.emit('attack', {
                id: this.id,
                target: target.id,
                damage: damage,
                fromHeight: this.height > 50,
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
        // Grounded wyverns take extra damage
        if (!this.isFlying) {
            damage *= 1.2;
        }
        
        if (this.resistances[type]) {
            damage *= (1 - this.resistances[type]);
        }
        
        damage = Math.max(1, Math.floor(damage));
        this.hp -= damage;
        
        if (!this.inCombat && source) {
            this.target = source;
            this.inCombat = true;
            
            // Take flight if attacked while perched
            if (this.state === 'perched' && this.canUseAbility('takeFlight')) {
                this.useAbility('takeFlight');
                this.state = 'flying';
            } else {
                this.state = 'combat';
            }
        }
        
        this.emit('damageTaken', {
            id: this.id,
            damage: damage,
            hp: this.hp,
            maxHp: this.maxHp,
            source: source?.id,
            grounded: !this.isFlying
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
        this.isFlying = false;
        
        const loot = this.generateLoot();
        
        this.emit('death', {
            id: this.id,
            source: source?.id,
            loot: loot,
            xpValue: this.xpValue
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
            const moveDistance = (this.isFlying ? this.flightSpeed : this.moveSpeed) * deltaTime;
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
            isFlying: this.isFlying,
            height: this.height
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

module.exports = Wyvern;
