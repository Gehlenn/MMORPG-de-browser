/**
 * Harpy.js
 * 
 * Level 72 flying predator
 * Ambush attacker with shriek and dive abilities
 */

const EventEmitter = require('events');

class Harpy extends EventEmitter {
    constructor(id, position, zone = 'draconia') {
        super();
        
        this.id = id;
        this.type = 'harpy';
        this.name = 'Harpy';
        this.zone = zone;
        
        this.x = position.x;
        this.y = position.y;
        this.subZone = position.subZone || 'wyvern_heights';
        
        this.level = 72;
        this.maxHp = 1600;
        this.hp = this.maxHp;
        this.damage = 100;
        this.armor = 25;
        this.moveSpeed = 150; // Fastest
        this.attackRange = 45;
        this.aggroRange = 300;
        
        this.resistances = {
            physical: 0.1,
            wind: 0.4,
            fire: 0.1
        };
        
        this.target = null;
        this.inCombat = false;
        this.attackCooldown = 1500; // Very fast attack
        this.lastAttackTime = 0;
        
        this.abilities = {
            shriek: {
                name: 'Shriek',
                cooldown: 20000,
                lastUsed: 0,
                range: 200,
                stunDuration: 3000,
                aoe: true
            },
            dive: {
                name: 'Dive',
                cooldown: 8000,
                lastUsed: 0,
                damage: 150,
                requiresFlight: true
            },
            talonRend: {
                name: 'Talon Rend',
                cooldown: 10000,
                lastUsed: 0,
                damage: 80,
                bleedDuration: 5000,
                hits: 3
            },
            fly: {
                name: 'Fly',
                cooldown: 15000,
                lastUsed: 0
            }
        };
        
        this.state = 'hiding'; // hiding, flying, diving, combat, retreating
        this.isFlying = false;
        this.nestLocation = { x: this.x, y: this.y };
        
        this.xpValue = 700;
        this.lootTable = [
            { item: 'harpy_feather', chance: 0.6, quantity: [3, 6] },
            { item: 'harpy_talon', chance: 0.5, quantity: [1, 2] },
            { item: 'shriek_gland', chance: 0.3, quantity: 1 },
            { item: 'wind_essence', chance: 0.2, quantity: 1 }
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
        switch (this.state) {
            case 'hiding':
                this.updateHiding(deltaTime);
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
    
    updateHiding(deltaTime) {
        // Wait for target to pass below
        if (Math.random() < 0.1) {
            // Check if target is nearby (simulated)
            if (Math.random() < 0.3) {
                this.state = 'flying';
                this.takeFlight();
            }
        }
    }
    
    updateFlying(deltaTime) {
        // Circle above target
        if (this.target && this.canUseAbility('dive')) {
            this.state = 'diving';
        } else if (Math.random() < 0.1) {
            // Randomly start combat
            this.state = 'combat';
            this.land();
        }
    }
    
    updateDiving(deltaTime) {
        if (!this.target) {
            this.state = 'flying';
            return;
        }
        
        // Execute dive
        if (this.canUseAbility('dive')) {
            this.useAbility('dive', this.target);
            this.land();
            this.state = 'combat';
        }
    }
    
    updateCombat(deltaTime) {
        if (!this.target) {
            this.state = 'hiding';
            this.inCombat = false;
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        
        if (distance > 350) {
            this.state = 'hiding';
            this.target = null;
            this.inCombat = false;
            return;
        }
        
        // Shriek if multiple targets nearby or need to escape
        if (this.canUseAbility('shriek') && (this.hp < this.maxHp * 0.5 || Math.random() < 0.1)) {
            this.useAbility('shriek');
        }
        
        // Talon rend for damage
        if (this.canUseAbility('talonRend')) {
            this.useAbility('talonRend', this.target);
        }
        
        // Fly away if taking damage
        if (this.hp < this.maxHp * 0.3 && this.canUseAbility('fly')) {
            this.useAbility('fly');
            this.state = 'flying';
            return;
        }
        
        // Fast attacks
        if (distance <= this.attackRange) {
            this.attack(this.target);
        } else {
            this.moveToward(this.target, deltaTime);
        }
    }
    
    updateRetreating(deltaTime) {
        // Return to nest
        const dx = this.nestLocation.x - this.x;
        const dy = this.nestLocation.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            if (!this.isFlying) this.takeFlight();
            this.x += (dx / distance) * this.moveSpeed * 0.016;
            this.y += (dy / distance) * this.moveSpeed * 0.016;
        } else {
            this.land();
            this.state = 'hiding';
            this.target = null;
            this.inCombat = false;
        }
    }
    
    takeFlight() {
        this.isFlying = true;
        this.emit('takeFlight', { id: this.id });
    }
    
    land() {
        this.isFlying = false;
        this.emit('land', { id: this.id });
    }
    
    canUseAbility(abilityName) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        
        if (abilityName === 'dive' && !this.isFlying) return false;
        
        return Date.now() - ability.lastUsed >= ability.cooldown;
    }
    
    useAbility(abilityName, target = null) {
        const ability = this.abilities[abilityName];
        if (!ability || !this.canUseAbility(abilityName)) return false;
        
        ability.lastUsed = Date.now();
        
        switch (abilityName) {
            case 'shriek':
                // AOE stun around harpy
                this.emit('shriek', {
                    id: this.id,
                    x: this.x,
                    y: this.y,
                    range: ability.range,
                    stunDuration: ability.stunDuration
                });
                break;
                
            case 'dive':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'physical');
                    
                    // Multi-hit
                    for (let i = 1; i < ability.hits; i++) {
                        setTimeout(() => {
                            if (target && target.takeDamage) {
                                const hitDamage = this.calculateDamage(ability.damage / 3, target);
                                target.takeDamage(hitDamage, this, 'physical');
                            }
                        }, i * 300);
                    }
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
                
            case 'talonRend':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'physical');
                    
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({
                            type: 'bleed',
                            damagePerSecond: 25,
                            duration: ability.bleedDuration,
                            source: this.id
                        });
                    }
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
                
            case 'fly':
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
            let damage = this.damage;
            
            // Triple attack (three quick hits)
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (target && target.takeDamage) {
                        const hitDamage = this.calculateDamage(damage / 3, target);
                        target.takeDamage(hitDamage, this, 'physical');
                    }
                }, i * 200);
            }
            
            this.emit('attack', {
                id: this.id,
                target: target.id,
                damage: damage,
                tripleHit: true,
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
        
        // Ambush - if attacked while hiding, shriek and counter
        if (this.state === 'hiding' && this.canUseAbility('shriek')) {
            this.useAbility('shriek');
        }
        
        if (!this.inCombat && source) {
            this.target = source;
            this.inCombat = true;
            this.state = 'combat';
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
            isFlying: this.isFlying
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

module.exports = Harpy;
