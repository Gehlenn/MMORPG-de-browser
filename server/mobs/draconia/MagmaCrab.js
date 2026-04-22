/**
 * MagmaCrab.js
 * 
 * Level 65 elemental creature
 * Defensive fire creature that hardens its shell and spits magma
 */

const EventEmitter = require('events');

class MagmaCrab extends EventEmitter {
    constructor(id, position, zone = 'draconia') {
        super();
        
        this.id = id;
        this.type = 'magma_crab';
        this.name = 'Magma Crab';
        this.zone = zone;
        
        // Position
        this.x = position.x;
        this.y = position.y;
        this.subZone = position.subZone || 'frostfire_ridge';
        
        // Stats
        this.level = 65;
        this.maxHp = 1200;
        this.hp = this.maxHp;
        this.damage = 80;
        this.armor = 50;
        this.moveSpeed = 30; // Very slow
        this.attackRange = 50;
        this.aggroRange = 200;
        
        // Resistances
        this.resistances = {
            fire: 0.8,     // 80% fire resistance
            ice: -0.3,    // 30% ice weakness
            physical: 0.3 // 30% physical resistance
        };
        
        // Combat
        this.target = null;
        this.inCombat = false;
        this.attackCooldown = 3000;
        this.lastAttackTime = 0;
        
        // Abilities
        this.abilities = {
            shellHarden: {
                name: 'Shell Harden',
                cooldown: 15000,
                lastUsed: 0,
                duration: 5000,
                active: false,
                damageReduction: 0.5
            },
            magmaSpit: {
                name: 'Magma Spit',
                cooldown: 8000,
                lastUsed: 0,
                range: 150,
                damage: 100
            },
            thermalVent: {
                name: 'Thermal Vent',
                cooldown: 12000,
                lastUsed: 0,
                range: 100,
                damage: 60,
                duration: 5000
            }
        };
        
        // State
        this.state = 'idle'; // idle, patrolling, aggressive, defensive, retreating, burrowed
        this.isBurrowed = false;
        this.patrolCenter = { x: this.x, y: this.y };
        this.patrolRadius = 150;
        
        // Loot
        this.xpValue = 450;
        this.lootTable = [
            { item: 'magma_shell', chance: 0.4, quantity: 1 },
            { item: 'fire_essence', chance: 0.6, quantity: [1, 2] },
            { item: 'crab_meat', chance: 0.8, quantity: [2, 4] },
            { item: 'volcanic_stone', chance: 0.3, quantity: [1, 3] }
        ];
        
        // Update loop
        this.updateInterval = null;
        this.startUpdateLoop();
        
        this.onDeath = null; // Callback for spawn management
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.update(1); // 1 second delta
        }, 1000);
    }
    
    update(deltaTime) {
        // Update ability cooldowns
        this.updateCooldowns();
        
        // State machine
        switch (this.state) {
            case 'idle':
                this.updateIdle(deltaTime);
                break;
            case 'patrolling':
                this.updatePatrol(deltaTime);
                break;
            case 'aggressive':
                this.updateAggressive(deltaTime);
                break;
            case 'defensive':
                this.updateDefensive(deltaTime);
                break;
            case 'retreating':
                this.updateRetreating(deltaTime);
                break;
            case 'burrowed':
                this.updateBurrowed(deltaTime);
                break;
        }
        
        // Check for shell harden expiration
        if (this.abilities.shellHarden.active) {
            if (Date.now() - this.abilities.shellHarden.activatedAt > this.abilities.shellHarden.duration) {
                this.abilities.shellHarden.active = false;
                this.emit('abilityEnd', { ability: 'shellHarden' });
            }
        }
    }
    
    updateCooldowns() {
        // Cooldowns are checked against current time when using abilities
    }
    
    updateIdle(deltaTime) {
        // Occasionally start patrolling
        if (Math.random() < 0.1) {
            this.state = 'patrolling';
        }
    }
    
    updatePatrol(deltaTime) {
        // Move around patrol center
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.patrolRadius;
        
        this.x = this.patrolCenter.x + Math.cos(angle) * distance;
        this.y = this.patrolCenter.y + Math.sin(angle) * distance;
        
        // Return to idle after a while
        if (Math.random() < 0.05) {
            this.state = 'idle';
        }
    }
    
    updateAggressive(deltaTime) {
        if (!this.target) {
            this.state = 'idle';
            this.inCombat = false;
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        
        // Check if target is too far
        if (distance > 400) {
            this.state = 'idle';
            this.target = null;
            this.inCombat = false;
            return;
        }
        
        // Use abilities
        if (this.canUseAbility('shellHarden') && this.hp < this.maxHp * 0.6) {
            this.useAbility('shellHarden');
        }
        
        if (distance <= this.abilities.magmaSpit.range && this.canUseAbility('magmaSpit')) {
            this.useAbility('magmaSpit', this.target);
        } else if (distance <= this.abilities.thermalVent.range && this.canUseAbility('thermalVent')) {
            this.useAbility('thermalVent', this.target);
        }
        
        // Move towards target if not in range
        if (distance > this.attackRange) {
            this.moveToward(this.target, deltaTime);
        } else {
            // Attack
            this.attack(this.target);
        }
    }
    
    updateDefensive(deltaTime) {
        // Defensive state - use shell harden if available
        if (!this.abilities.shellHarden.active && this.canUseAbility('shellHarden')) {
            this.useAbility('shellHarden');
        }
        
        // Still attack if target is close
        if (this.target) {
            const distance = this.getDistanceTo(this.target);
            if (distance <= this.abilities.magmaSpit.range) {
                this.useAbility('magmaSpit', this.target);
            }
        }
    }
    
    updateRetreating(deltaTime) {
        // Burrow to escape
        if (!this.isBurrowed) {
            this.burrow();
        }
        
        // Heal while burrowed
        this.hp = Math.min(this.maxHp, this.hp + (this.maxHp * 0.02 * deltaTime));
        
        // Emerge when healed
        if (this.hp > this.maxHp * 0.7) {
            this.emerge();
            this.state = 'aggressive';
        }
    }
    
    updateBurrowed(deltaTime) {
        // While burrowed, heal slowly
        this.hp = Math.min(this.maxHp, this.hp + (this.maxHp * 0.01 * deltaTime));
        
        // Auto-emerge after 10 seconds
        if (this.burrowTime && Date.now() - this.burrowTime > 10000) {
            this.emerge();
        }
    }
    
    burrow() {
        this.isBurrowed = true;
        this.state = 'burrowed';
        this.burrowTime = Date.now();
        this.emit('burrow', { id: this.id });
    }
    
    emerge() {
        this.isBurrowed = false;
        this.state = this.target ? 'aggressive' : 'idle';
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
            case 'shellHarden':
                ability.active = true;
                ability.activatedAt = Date.now();
                this.state = 'defensive';
                this.emit('abilityUse', { ability: abilityName, id: this.id });
                break;
                
            case 'magmaSpit':
                if (target && target.takeDamage) {
                    const damage = this.calculateDamage(ability.damage, target);
                    target.takeDamage(damage, this, 'fire');
                    
                    // Apply DoT
                    if (target.applyStatusEffect) {
                        target.applyStatusEffect({
                            type: 'burn',
                            damagePerSecond: 15,
                            duration: 5000,
                            source: this.id
                        });
                    }
                }
                this.emit('abilityUse', { ability: abilityName, id: this.id, target: target?.id });
                break;
                
            case 'thermalVent':
                // Create thermal vent at target location
                this.emit('thermalVent', {
                    x: target?.x || this.x,
                    y: target?.y || this.y,
                    duration: ability.duration,
                    damage: ability.damage,
                    radius: 80
                });
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
        
        // Apply variance (±10%)
        damage *= (0.9 + Math.random() * 0.2);
        
        // Apply target resistances if any
        if (target.resistances) {
            const resistance = target.resistances.physical || 0;
            damage *= (1 - resistance);
        }
        
        return Math.floor(damage);
    }
    
    takeDamage(damage, source, type = 'physical') {
        // Check if burrowed
        if (this.isBurrowed) {
            // Emerge when taking damage
            this.emerge();
            this.target = source;
            this.state = 'aggressive';
            this.inCombat = true;
        }
        
        // Apply shell harden
        if (this.abilities.shellHarden.active) {
            damage *= (1 - this.abilities.shellHarden.damageReduction);
        }
        
        // Apply resistances
        if (this.resistances[type]) {
            damage *= (1 - this.resistances[type]);
        }
        
        // Minimum damage is 1
        damage = Math.max(1, Math.floor(damage));
        
        this.hp -= damage;
        
        // Aggro on damage
        if (!this.inCombat && source) {
            this.target = source;
            this.state = 'aggressive';
            this.inCombat = true;
        }
        
        // Retreat if low HP
        if (this.hp < this.maxHp * 0.3 && this.state !== 'retreating') {
            this.state = 'retreating';
        }
        
        this.emit('damageTaken', {
            id: this.id,
            damage: damage,
            hp: this.hp,
            maxHp: this.maxHp,
            source: source?.id
        });
        
        // Check death
        if (this.hp <= 0) {
            this.die(source);
        }
        
        return damage;
    }
    
    die(source) {
        this.hp = 0;
        this.state = 'dead';
        this.inCombat = false;
        
        // Generate loot
        const loot = this.generateLoot();
        
        this.emit('death', {
            id: this.id,
            source: source?.id,
            loot: loot,
            xpValue: this.xpValue
        });
        
        // Callback for spawn management
        if (this.onDeath) {
            this.onDeath();
        }
        
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
                loot.push({ item: item.item, quantity: quantity });
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
    
    // Data export
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
            isBurrowed: this.isBurrowed,
            shellHardened: this.abilities.shellHarden.active
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

module.exports = MagmaCrab;
