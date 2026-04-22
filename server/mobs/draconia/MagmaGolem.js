/**
 * MagmaGolem.js
 * 
 * Level 76 tanky fire creature
 * Slow but powerful with magma armor and eruption
 */

const EventEmitter = require('events');

class MagmaGolem extends EventEmitter {
    constructor(id, position, zone = 'draconia') {
        super();
        this.id = id;
        this.type = 'magma_golem';
        this.name = 'Magma Golem';
        this.zone = zone;
        this.x = position.x;
        this.y = position.y;
        this.subZone = position.subZone || 'volcanic_core';
        
        this.level = 76;
        this.maxHp = 4500;
        this.hp = this.maxHp;
        this.damage = 180;
        this.armor = 120;
        this.moveSpeed = 25; // Very slow
        this.attackRange = 60;
        this.aggroRange = 250;
        
        this.resistances = {
            fire: 0.9,
            physical: 0.6,
            ice: -0.5
        };
        
        this.target = null;
        this.inCombat = false;
        this.attackCooldown = 3500;
        this.lastAttackTime = 0;
        
        this.abilities = {
            magmaArmor: {
                name: 'Magma Armor',
                cooldown: 20000,
                lastUsed: 0,
                duration: 8000,
                active: false,
                thornsDamage: 40
            },
            eruption: {
                name: 'Eruption',
                cooldown: 15000,
                lastUsed: 0,
                damage: 250,
                range: 150,
                knockup: true
            },
            moltenFist: {
                name: 'Molten Fist',
                cooldown: 8000,
                lastUsed: 0,
                damage: 200,
                burnDuration: 6000
            },
            groundSlam: {
                name: 'Ground Slam',
                cooldown: 12000,
                lastUsed: 0,
                damage: 150,
                stunDuration: 2000,
                aoe: true,
                range: 100
            }
        };
        
        this.state = 'idle';
        this.spawnPoint = { x: this.x, y: this.y };
        this.maxWanderDistance = 100;
        
        this.xpValue = 950;
        this.lootTable = [
            { item: 'magma_core', chance: 0.4, quantity: 1 },
            { item: 'obsidian_chunk', chance: 0.6, quantity: [2, 5] },
            { item: 'golem_fragment', chance: 0.5, quantity: [1, 3] },
            { item: 'fire_essence', chance: 0.35, quantity: [1, 2] }
        ];
        
        this.updateInterval = null;
        this.startUpdateLoop();
        this.onDeath = null;
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => this.update(1), 1000);
    }
    
    update(deltaTime) {
        if (this.abilities.magmaArmor.active) {
            if (Date.now() - this.abilities.magmaArmor.activatedAt > this.abilities.magmaArmor.duration) {
                this.abilities.magmaArmor.active = false;
            }
        }
        
        switch (this.state) {
            case 'idle':
                if (Math.random() < 0.08) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * this.maxWanderDistance;
                    this.x = this.spawnPoint.x + Math.cos(angle) * distance;
                    this.y = this.spawnPoint.y + Math.sin(angle) * distance;
                }
                break;
            case 'combat':
                this.updateCombat(deltaTime);
                break;
        }
    }
    
    updateCombat(deltaTime) {
        if (!this.target) {
            this.state = 'idle';
            this.inCombat = false;
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        if (distance > 500) {
            this.state = 'idle';
            this.target = null;
            this.inCombat = false;
            return;
        }
        
        if (!this.abilities.magmaArmor.active && this.canUseAbility('magmaArmor')) {
            this.useAbility('magmaArmor');
        }
        if (this.canUseAbility('eruption')) {
            this.useAbility('eruption', this.target);
        }
        if (this.canUseAbility('groundSlam')) {
            this.useAbility('groundSlam', this.target);
        }
        if (this.canUseAbility('moltenFist')) {
            this.useAbility('moltenFist', this.target);
        }
        
        if (distance <= this.attackRange) {
            this.attack(this.target);
        } else {
            this.moveToward(this.target, deltaTime);
        }
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
            case 'magmaArmor':
                ability.active = true;
                ability.activatedAt = Date.now();
                this.emit('abilityUse', { ability: abilityName, id: this.id });
                break;
            case 'eruption':
                this.emit('eruption', {
                    id: this.id,
                    x: this.x,
                    y: this.y,
                    damage: ability.damage,
                    range: ability.range,
                    knockup: ability.knockup
                });
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'fire');
                    if (ability.knockup && target.applyStatusEffect) {
                        target.applyStatusEffect({ type: 'knockup', duration: 1500, source: this.id });
                    }
                }
                break;
            case 'moltenFist':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'fire');
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({ type: 'burn', damagePerSecond: 25, duration: ability.burnDuration, source: this.id });
                    }
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
            case 'groundSlam':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'physical');
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({ type: 'stun', duration: ability.stunDuration, source: this.id });
                    }
                }
                this.emit('groundSlam', { id: this.id, x: this.x, y: this.y, range: ability.range });
                break;
        }
        return true;
    }
    
    attack(target) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;
        this.lastAttackTime = now;
        if (target && target.takeDamage) {
            const damage = this.calculateDamage(this.damage, target);
            target.takeDamage(damage, this, 'physical');
            if (target.applyStatusEffect) {
                target.applyStatusEffect({ type: 'burn', damagePerSecond: 15, duration: 3000, source: this.id });
            }
            this.emit('attack', { id: this.id, target: target.id, damage: damage, type: 'physical' });
        }
    }
    
    calculateDamage(baseDamage, target) {
        let damage = baseDamage * (0.9 + Math.random() * 0.2);
        if (target.resistances) {
            damage *= (1 - (target.resistances.physical || 0));
        }
        return Math.floor(damage);
    }
    
    takeDamage(damage, source, type = 'physical') {
        if (this.resistances[type]) {
            damage *= (1 - this.resistances[type]);
        }
        damage = Math.max(1, Math.floor(damage));
        this.hp -= damage;
        
        // Thorns damage if magma armor is active
        if (this.abilities.magmaArmor.active && source && source.takeDamage) {
            const thorns = this.abilities.magmaArmor.thornsDamage;
            source.takeDamage(thorns, this, 'fire');
        }
        
        if (!this.inCombat && source) {
            this.target = source;
            this.inCombat = true;
            this.state = 'combat';
        }
        this.emit('damageTaken', { id: this.id, damage: damage, hp: this.hp, maxHp: this.maxHp, source: source?.id });
        if (this.hp <= 0) this.die(source);
        return damage;
    }
    
    die(source) {
        this.hp = 0;
        this.state = 'dead';
        this.inCombat = false;
        const loot = this.generateLoot();
        this.emit('death', { id: this.id, source: source?.id, loot: loot, xpValue: this.xpValue });
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
            magmaArmor: this.abilities.magmaArmor.active
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

module.exports = MagmaGolem;
