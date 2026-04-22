/**
 * SteamElemental.js
 * 
 * Level 68 hit-and-run elemental
 * Uses environment for healing and ambush attacks
 */

const EventEmitter = require('events');

class SteamElemental extends EventEmitter {
    constructor(id, position, zone = 'draconia') {
        super();
        
        this.id = id;
        this.type = 'steam_elemental';
        this.name = 'Steam Elemental';
        this.zone = zone;
        
        this.x = position.x;
        this.y = position.y;
        this.subZone = position.subZone || 'frostfire_ridge';
        
        this.level = 68;
        this.maxHp = 1400;
        this.hp = this.maxHp;
        this.damage = 75;
        this.armor = 20;
        this.moveSpeed = 90; // Moderate
        this.attackRange = 60;
        this.aggroRange = 250;
        
        this.resistances = {
            fire: 0.4,
            ice: 0.4,
            physical: -0.2 // Weak to physical
        };
        
        this.target = null;
        this.inCombat = false;
        this.attackCooldown = 2500;
        this.lastAttackTime = 0;
        
        this.abilities = {
            steamBlast: {
                name: 'Steam Blast',
                cooldown: 7000,
                lastUsed: 0,
                damage: 80,
                range: 100,
                coneAngle: Math.PI / 3
            },
            condensate: {
                name: 'Condensate',
                cooldown: 12000,
                lastUsed: 0,
                healPercent: 0.15
            },
            evaporate: {
                name: 'Evaporate',
                cooldown: 15000,
                lastUsed: 0,
                duration: 3000,
                damageBonus: 0.5
            }
        };
        
        this.state = 'idle';
        this.isInvisible = false;
        this.invisibleEndTime = 0;
        
        this.patrolCenter = { x: this.x, y: this.y };
        this.patrolRadius = 180;
        
        this.xpValue = 550;
        this.lootTable = [
            { item: 'steam_core', chance: 0.4, quantity: 1 },
            { item: 'condensed_water', chance: 0.6, quantity: [2, 4] },
            { item: 'elemental_dust', chance: 0.5, quantity: [1, 3] },
            { item: 'vapor_essence', chance: 0.2, quantity: 1 }
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
        // Update invisibility
        if (this.isInvisible && Date.now() > this.invisibleEndTime) {
            this.emerge();
        }
        
        // Check for nearby geysers/water sources
        this.checkForWaterSources();
        
        switch (this.state) {
            case 'idle':
                this.updateIdle(deltaTime);
                break;
            case 'patrolling':
                this.updatePatrol(deltaTime);
                break;
            case 'combat':
                this.updateCombat(deltaTime);
                break;
            case 'healing':
                this.updateHealing(deltaTime);
                break;
        }
    }
    
    checkForWaterSources() {
        // Would check actual positions in real implementation
        // Returns true if near geyser/water
        return Math.random() < 0.3; // 30% chance near water
    }
    
    updateIdle(deltaTime) {
        if (Math.random() < 0.1) {
            this.state = 'patrolling';
        }
        
        // Heal if near water
        if (this.checkForWaterSources() && this.hp < this.maxHp * 0.8) {
            this.state = 'healing';
        }
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
        
        // Evaporate (go invisible) if available and not invisible
        if (!this.isInvisible && this.canUseAbility('evaporate')) {
            this.useAbility('evaporate');
        }
        
        // Use steam blast if in range
        if (distance <= this.abilities.steamBlast.range && this.canUseAbility('steamBlast')) {
            this.useAbility('steamBlast', this.target);
        }
        
        // Condensate to heal if low HP and near water
        if (this.hp < this.maxHp * 0.4 && this.checkForWaterSources() && this.canUseAbility('condensate')) {
            this.useAbility('condensate');
        }
        
        // Attack or move
        if (distance <= this.attackRange && !this.isInvisible) {
            this.attack(this.target);
        } else if (!this.isInvisible) {
            this.moveToward(this.target, deltaTime);
        }
        
        // Retreat if very low HP
        if (this.hp < this.maxHp * 0.2) {
            this.state = 'healing';
        }
    }
    
    updateHealing(deltaTime) {
        if (this.checkForWaterSources()) {
            // Heal rapidly when near water
            this.hp = Math.min(this.maxHp, this.hp + (this.maxHp * 0.05 * deltaTime));
            
            if (this.hp > this.maxHp * 0.7) {
                this.state = this.target ? 'combat' : 'idle';
            }
        } else {
            // Look for water or return to combat
            this.state = this.target ? 'combat' : 'patrolling';
        }
    }
    
    evaporate() {
        this.isInvisible = true;
        this.invisibleEndTime = Date.now() + this.abilities.evaporate.duration;
        this.emit('evaporate', { id: this.id });
    }
    
    emerge() {
        this.isInvisible = false;
        
        // Bonus damage when emerging
        if (this.target && this.target.takeDamage) {
            const bonusDamage = this.damage * (1 + this.abilities.evaporate.damageBonus);
            const damage = this.calculateDamage(bonusDamage, this.target);
            this.target.takeDamage(damage, this, 'physical');
            
            this.emit('emergeAttack', {
                id: this.id,
                target: this.target.id,
                damage: damage
            });
        }
        
        this.emit('emerge', { id: this.id, x: this.x, y: this.y });
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
            case 'steamBlast':
                if (target && target.takeDamage) {
                    // Cone attack
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'fire');
                    
                    // Blind effect
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({
                            type: 'blind',
                            duration: 4000,
                            source: this.id
                        });
                    }
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
                
            case 'condensate':
                const healAmount = this.maxHp * ability.healPercent;
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
                
                this.emit('heal', {
                    id: this.id,
                    amount: healAmount,
                    hp: this.hp,
                    maxHp: this.maxHp
                });
                break;
                
            case 'evaporate':
                this.evaporate();
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
            
            this.emit('attack', {
                id: this.id,
                target: target.id,
                damage: damage,
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
        // Take double damage while invisible (vulnerable)
        if (this.isInvisible) {
            damage *= 2;
        }
        
        if (this.resistances[type]) {
            damage *= (1 - this.resistances[type]);
        }
        
        damage = Math.max(1, Math.floor(damage));
        this.hp -= damage;
        
        // Emerge if invisible and taking damage
        if (this.isInvisible) {
            this.emerge();
        }
        
        if (!this.inCombat && source) {
            this.target = source;
            this.state = 'combat';
            this.inCombat = true;
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
        
        // Explode into steam on death
        this.emit('steamExplosion', {
            x: this.x,
            y: this.y,
            radius: 100,
            duration: 3000
        });
        
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
            isInvisible: this.isInvisible
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

module.exports = SteamElemental;
