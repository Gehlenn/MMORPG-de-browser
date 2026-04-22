/**
 * FireDrake.js
 * 
 * Level 78 powerful fire creature
 * Devastating fire breath and fireball attacks
 */

const EventEmitter = require('events');

class FireDrake extends EventEmitter {
    constructor(id, position, zone = 'draconia') {
        super();
        this.id = id;
        this.type = 'fire_drake';
        this.name = 'Fire Drake';
        this.zone = zone;
        this.x = position.x;
        this.y = position.y;
        this.subZone = position.subZone || 'volcanic_core';
        
        this.level = 78;
        this.maxHp = 3200;
        this.hp = this.maxHp;
        this.damage = 160;
        this.armor = 60;
        this.moveSpeed = 70;
        this.attackRange = 70;
        this.aggroRange = 350;
        
        this.resistances = {
            fire: 1.0,
            physical: 0.3,
            ice: -0.3
        };
        
        this.target = null;
        this.inCombat = false;
        this.attackCooldown = 2500;
        this.lastAttackTime = 0;
        
        this.abilities = {
            fireBreath: {
                name: 'Fire Breath',
                cooldown: 10000,
                lastUsed: 0,
                damage: 80,
                duration: 4000,
                range: 180,
                coneAngle: Math.PI / 2
            },
            fireball: {
                name: 'Fireball',
                cooldown: 6000,
                lastUsed: 0,
                damage: 200,
                range: 250,
                aoe: true,
                aoeRadius: 60
            },
            tailSwipe: {
                name: 'Tail Swipe',
                cooldown: 8000,
                lastUsed: 0,
                damage: 140,
                knockback: 80,
                coneAngle: Math.PI
            },
            wingGust: {
                name: 'Wing Gust',
                cooldown: 15000,
                lastUsed: 0,
                damage: 60,
                pushDistance: 100,
                aoe: true
            }
        };
        
        this.state = 'idle';
        this.isBreathingFire = false;
        this.fireBreathEndTime = 0;
        this.nestLocation = { x: this.x, y: this.y };
        this.patrolRadius = 200;
        
        this.xpValue = 1000;
        this.lootTable = [
            { item: 'drake_scale', chance: 0.45, quantity: [2, 5] },
            { item: 'drake_fang', chance: 0.6, quantity: [1, 3] },
            { item: 'drake_wing', chance: 0.3, quantity: 1 },
            { item: 'fire_heart', chance: 0.25, quantity: 1 },
            { item: 'inferno_essence', chance: 0.2, quantity: 1 }
        ];
        
        this.updateInterval = null;
        this.startUpdateLoop();
        this.onDeath = null;
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => this.update(1), 1000);
    }
    
    update(deltaTime) {
        if (this.isBreathingFire && Date.now() > this.fireBreathEndTime) {
            this.isBreathingFire = false;
        }
        
        switch (this.state) {
            case 'idle':
                this.updateIdle(deltaTime);
                break;
            case 'combat':
                this.updateCombat(deltaTime);
                break;
        }
    }
    
    updateIdle(deltaTime) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.patrolRadius;
        this.x = this.nestLocation.x + Math.cos(angle) * distance;
        this.y = this.nestLocation.y + Math.sin(angle) * distance;
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
        
        // Fireball at range
        if (distance > this.attackRange && distance <= this.abilities.fireball.range && this.canUseAbility('fireball')) {
            this.useAbility('fireball', this.target);
        }
        
        // Fire breath in cone
        if (distance <= this.abilities.fireBreath.range && this.canUseAbility('fireBreath')) {
            this.useAbility('fireBreath', this.target);
        }
        
        // Wing gust when surrounded
        if (this.canUseAbility('wingGust')) {
            this.useAbility('wingGust');
        }
        
        // Tail swipe close range
        if (distance <= this.attackRange && this.canUseAbility('tailSwipe')) {
            this.useAbility('tailSwipe', this.target);
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
            case 'fireBreath':
                this.isBreathingFire = true;
                this.fireBreathEndTime = Date.now() + ability.duration;
                this.emit('fireBreath', {
                    id: this.id,
                    x: this.x,
                    y: this.y,
                    direction: target ? { x: target.x - this.x, y: target.y - this.y } : { x: 1, y: 0 },
                    angle: ability.coneAngle,
                    range: ability.range,
                    duration: ability.duration
                });
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'fire');
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({ type: 'burn', damagePerSecond: 30, duration: 5000, source: this.id });
                    }
                }
                break;
            case 'fireball':
                this.emit('fireball', {
                    id: this.id,
                    x: this.x,
                    y: this.y,
                    targetX: target?.x,
                    targetY: target?.y,
                    damage: ability.damage,
                    aoeRadius: ability.aoeRadius
                });
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'fire');
                }
                break;
            case 'tailSwipe':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'physical');
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
                this.emit('abilityUse', { ability: abilityName, id: this.id });
                break;
            case 'wingGust':
                this.emit('wingGust', { id: this.id, x: this.x, y: this.y, pushDistance: ability.pushDistance });
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
                target.applyStatusEffect({ type: 'burn', damagePerSecond: 20, duration: 4000, source: this.id });
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
            isBreathingFire: this.isBreathingFire
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

module.exports = FireDrake;
