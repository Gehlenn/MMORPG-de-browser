/**
 * MountainGriffin.js
 * 
 * Level 74 tanky flying predator
 * Dive attack with armor buff
 */

const EventEmitter = require('events');

class MountainGriffin extends EventEmitter {
    constructor(id, position, zone = 'draconia') {
        super();
        this.id = id;
        this.type = 'mountain_griffin';
        this.name = 'Mountain Griffin';
        this.zone = zone;
        this.x = position.x;
        this.y = position.y;
        this.subZone = position.subZone || 'wyvern_heights';
        
        this.level = 74;
        this.maxHp = 2800;
        this.hp = this.maxHp;
        this.damage = 130;
        this.armor = 80;
        this.moveSpeed = 100;
        this.flightSpeed = 130;
        this.attackRange = 55;
        this.aggroRange = 300;
        
        this.resistances = {
            physical: 0.4,
            wind: 0.3,
            fire: 0.2,
            ice: 0.2
        };
        
        this.target = null;
        this.inCombat = false;
        this.attackCooldown = 2800;
        this.lastAttackTime = 0;
        
        this.abilities = {
            diveAttack: {
                name: 'Dive Attack',
                cooldown: 15000,
                lastUsed: 0,
                damage: 250,
                stunDuration: 2500,
                armorBonus: 30
            },
            roar: {
                name: 'Roar',
                cooldown: 25000,
                lastUsed: 0,
                buffDuration: 10000,
                armorIncrease: 0.3,
                damageIncrease: 0.2
            },
            rend: {
                name: 'Rend',
                cooldown: 12000,
                lastUsed: 0,
                damage: 180,
                bleedDuration: 8000
            },
            wingBuffet: {
                name: 'Wing Buffet',
                cooldown: 10000,
                lastUsed: 0,
                damage: 100,
                knockback: 120,
                coneAngle: Math.PI
            }
        };
        
        this.state = 'perched';
        this.isFlying = false;
        this.roarBuffActive = false;
        this.roarBuffEndTime = 0;
        
        this.perchPoint = { x: this.x, y: this.y };
        this.patrolRadius = 350;
        
        this.xpValue = 800;
        this.lootTable = [
            { item: 'griffin_feather', chance: 0.4, quantity: [2, 4] },
            { item: 'griffin_claw', chance: 0.5, quantity: [1, 3] },
            { item: 'griffin_beak', chance: 0.3, quantity: 1 },
            { item: 'wind_essence', chance: 0.25, quantity: [1, 2] }
        ];
        
        this.updateInterval = null;
        this.startUpdateLoop();
        this.onDeath = null;
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => this.update(1), 1000);
    }
    
    update(deltaTime) {
        if (this.roarBuffActive && Date.now() > this.roarBuffEndTime) {
            this.roarBuffActive = false;
        }
        
        switch (this.state) {
            case 'perched':
                if (Math.random() < 0.05) {
                    this.state = 'patrolling';
                    this.takeFlight();
                }
                break;
            case 'patrolling':
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * this.patrolRadius;
                this.x = this.perchPoint.x + Math.cos(angle) * distance;
                this.y = this.perchPoint.y + Math.sin(angle) * distance;
                if (this.target && this.canUseAbility('diveAttack')) {
                    this.state = 'diving';
                } else if (Math.random() < 0.03) {
                    this.land();
                    this.state = 'perched';
                }
                break;
            case 'diving':
                if (!this.target) {
                    this.state = 'patrolling';
                } else if (this.canUseAbility('diveAttack')) {
                    this.useAbility('diveAttack', this.target);
                    this.land();
                    this.state = 'combat';
                }
                break;
            case 'combat':
                this.updateCombat(deltaTime);
                break;
            case 'retreating':
                this.updateRetreating(deltaTime);
                break;
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
        
        if (!this.roarBuffActive && this.canUseAbility('roar')) {
            this.useAbility('roar');
        }
        if (this.canUseAbility('rend')) {
            this.useAbility('rend', this.target);
        }
        if (this.canUseAbility('wingBuffet')) {
            this.useAbility('wingBuffet', this.target);
        }
        
        if (this.hp < this.maxHp * 0.25 && !this.isFlying) {
            this.takeFlight();
            this.state = 'patrolling';
            return;
        }
        
        if (distance <= this.attackRange) {
            this.attack(this.target);
        } else {
            this.moveToward(this.target, deltaTime);
        }
    }
    
    updateRetreating(deltaTime) {
        if (!this.isFlying) this.takeFlight();
        const dx = this.perchPoint.x - this.x;
        const dy = this.perchPoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 10) {
            this.x += (dx / distance) * this.flightSpeed * 0.016;
            this.y += (dy / distance) * this.flightSpeed * 0.016;
        } else {
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.02);
            if (this.hp > this.maxHp * 0.6) {
                this.land();
                this.state = this.target ? 'combat' : 'perched';
            }
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
        return Date.now() - ability.lastUsed >= ability.cooldown;
    }
    
    useAbility(abilityName, target = null) {
        const ability = this.abilities[abilityName];
        if (!ability || !this.canUseAbility(abilityName)) return false;
        ability.lastUsed = Date.now();
        
        switch (abilityName) {
            case 'diveAttack':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'physical');
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({ type: 'stun', duration: ability.stunDuration, source: this.id });
                    }
                    this.armor += ability.armorBonus;
                    setTimeout(() => { this.armor -= ability.armorBonus; }, 5000);
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
            case 'roar':
                this.roarBuffActive = true;
                this.roarBuffEndTime = Date.now() + ability.buffDuration;
                this.emit('roar', { id: this.id, armorIncrease: ability.armorIncrease, damageIncrease: ability.damageIncrease });
                break;
            case 'rend':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'physical');
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({ type: 'bleed', damagePerSecond: 30, duration: ability.bleedDuration, source: this.id });
                    }
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
            case 'wingBuffet':
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
            let damage = this.damage;
            if (this.roarBuffActive) {
                damage *= (1 + this.abilities.roar.damageIncrease);
            }
            damage = this.calculateDamage(damage, target);
            target.takeDamage(damage, this, 'physical');
            this.emit('attack', { id: this.id, target: target.id, damage: damage, roarBuffed: this.roarBuffActive });
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
        if (this.roarBuffActive) {
            damage *= (1 - this.abilities.roar.armorIncrease);
        }
        damage = Math.max(1, Math.floor(damage));
        this.hp -= damage;
        if (!this.inCombat && source) {
            this.target = source;
            this.inCombat = true;
            this.state = 'combat';
        }
        if (this.hp < this.maxHp * 0.5 && this.canUseAbility('roar') && !this.roarBuffActive) {
            this.useAbility('roar');
        }
        this.emit('damageTaken', { id: this.id, damage: damage, hp: this.hp, maxHp: this.maxHp, source: source?.id });
        if (this.hp <= 0) this.die(source);
        return damage;
    }
    
    die(source) {
        this.hp = 0;
        this.state = 'dead';
        this.inCombat = false;
        this.isFlying = false;
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
            roarBuffed: this.roarBuffActive
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

module.exports = MountainGriffin;
