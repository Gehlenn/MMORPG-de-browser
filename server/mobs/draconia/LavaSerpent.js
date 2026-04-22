/**
 * LavaSerpent.js
 * 
 * Level 78 magical serpent
 * Coil attacks and lava dive mechanics
 */

const EventEmitter = require('events');

class LavaSerpent extends EventEmitter {
    constructor(id, position, zone = 'draconia') {
        super();
        this.id = id;
        this.type = 'lava_serpent';
        this.name = 'Lava Serpent';
        this.zone = zone;
        this.x = position.x;
        this.y = position.y;
        this.subZone = position.subZone || 'volcanic_core';
        
        this.level = 78;
        this.maxHp = 2400;
        this.hp = this.maxHp;
        this.damage = 140;
        this.armor = 40;
        this.moveSpeed = 95;
        this.attackRange = 50;
        this.aggroRange = 300;
        
        this.resistances = {
            fire: 1.0,
            physical: 0.2,
            ice: -0.4
        };
        
        this.target = null;
        this.inCombat = false;
        this.attackCooldown = 2200;
        this.lastAttackTime = 0;
        
        this.abilities = {
            coil: {
                name: 'Coil',
                cooldown: 12000,
                lastUsed: 0,
                duration: 5000,
                damagePerSecond: 50,
                constrictDamage: 200
            },
            lavaDive: {
                name: 'Lava Dive',
                cooldown: 18000,
                lastUsed: 0,
                duration: 4000,
                emergeDamage: 180,
                healPerSecond: 0.05
            },
            spitLava: {
                name: 'Spit Lava',
                cooldown: 7000,
                lastUsed: 0,
                damage: 120,
                range: 180,
                burnDuration: 4000
            },
            tailWhip: {
                name: 'Tail Whip',
                cooldown: 9000,
                lastUsed: 0,
                damage: 100,
                knockback: 60,
                aoe: true
            }
        };
        
        this.state = 'idle';
        this.isSubmerged = false;
        this.isCoiled = false;
        this.coilTarget = null;
        this.coilEndTime = 0;
        this.submergeEndTime = 0;
        this.lavaPoolNearby = true;
        
        this.spawnPoint = { x: this.x, y: this.y };
        this.xpValue = 1050;
        this.lootTable = [
            { item: 'serpent_scale', chance: 0.5, quantity: [3, 6] },
            { item: 'lava_fang', chance: 0.6, quantity: [2, 4] },
            { item: 'serpent_eye', chance: 0.3, quantity: [1, 2] },
            { item: 'magma_sac', chance: 0.25, quantity: 1 },
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
        if (this.isCoiled && Date.now() > this.coilEndTime) {
            this.uncoil();
        }
        if (this.isSubmerged && Date.now() > this.submergeEndTime) {
            this.emerge();
        }
        
        switch (this.state) {
            case 'idle':
                if (Math.random() < 0.05) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * 80;
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
        if (distance > 450) {
            this.state = 'idle';
            this.target = null;
            this.inCombat = false;
            return;
        }
        
        // Lava dive to heal
        if (this.hp < this.maxHp * 0.3 && this.lavaPoolNearby && this.canUseAbility('lavaDive')) {
            this.useAbility('lavaDive');
            return;
        }
        
        // Coil target if close
        if (distance <= this.attackRange && this.canUseAbility('coil')) {
            this.useAbility('coil', this.target);
            return;
        }
        
        // Spit lava at range
        if (distance > this.attackRange && distance <= this.abilities.spitLava.range && this.canUseAbility('spitLava')) {
            this.useAbility('spitLava', this.target);
        }
        
        // Tail whip when surrounded
        if (this.canUseAbility('tailWhip')) {
            this.useAbility('tailWhip');
        }
        
        if (!this.isSubmerged && !this.isCoiled) {
            if (distance <= this.attackRange) {
                this.attack(this.target);
            } else {
                this.moveToward(this.target, deltaTime);
            }
        }
    }
    
    coil(target) {
        this.isCoiled = true;
        this.coilTarget = target;
        this.coilEndTime = Date.now() + this.abilities.coil.duration;
        this.emit('coil', { id: this.id, target: target?.id, duration: this.abilities.coil.duration });
    }
    
    uncoil() {
        this.isCoiled = false;
        if (this.coilTarget && this.coilTarget.takeDamage) {
            const damage = this.calculateDamage(this.abilities.coil.constrictDamage, this.coilTarget);
            this.coilTarget.takeDamage(damage, this, 'physical');
        }
        this.coilTarget = null;
        this.emit('uncoil', { id: this.id });
    }
    
    submerge() {
        this.isSubmerged = true;
        this.submergeEndTime = Date.now() + this.abilities.lavaDive.duration;
        this.emit('submerge', { id: this.id, duration: this.abilities.lavaDive.duration });
    }
    
    emerge() {
        this.isSubmerged = false;
        this.emit('emerge', { id: this.id, x: this.x, y: this.y });
        
        // Damage nearby on emerge
        if (this.target && this.target.takeDamage) {
            const distance = this.getDistanceTo(this.target);
            if (distance <= 100) {
                const damage = this.calculateDamage(this.abilities.lavaDive.emergeDamage, this.target);
                this.target.takeDamage(damage, this, 'fire');
                if (this.target.applyStatusEffect) {
                    this.target.applyStatusEffect({ type: 'burn', damagePerSecond: 40, duration: 5000, source: this.id });
                }
            }
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
            case 'coil':
                if (target) {
                    this.coil(target);
                }
                break;
            case 'lavaDive':
                this.submerge();
                break;
            case 'spitLava':
                this.emit('spitLava', {
                    id: this.id,
                    x: this.x,
                    y: this.y,
                    targetX: target?.x,
                    targetY: target?.y,
                    damage: ability.damage
                });
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'fire');
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({ type: 'burn', damagePerSecond: 25, duration: ability.burnDuration, source: this.id });
                    }
                }
                break;
            case 'tailWhip':
                this.emit('tailWhip', { id: this.id, x: this.x, y: this.y, knockback: ability.knockback });
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
                target.applyStatusEffect({ type: 'poison', damagePerSecond: 15, duration: 4000, source: this.id });
            }
            this.emit('attack', { id: this.id, target: target.id, damage: damage });
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
        
        // Heal while submerged
        if (this.isSubmerged) {
            this.hp = Math.min(this.maxHp, this.hp + (this.maxHp * this.abilities.lavaDive.healPerSecond));
        }
        
        if (!this.inCombat && source) {
            this.target = source;
            this.inCombat = true;
            this.state = 'combat';
        }
        this.emit('damageTaken', { id: this.id, damage: damage, hp: this.hp, maxHp: this.maxHp, source: source?.id, submerged: this.isSubmerged });
        if (this.hp <= 0) this.die(source);
        return damage;
    }
    
    die(source) {
        this.hp = 0;
        this.state = 'dead';
        this.inCombat = false;
        this.isSubmerged = false;
        this.isCoiled = false;
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
            isSubmerged: this.isSubmerged,
            isCoiled: this.isCoiled
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

module.exports = LavaSerpent;
