/**
 * Knight.js
 * Elite aggressive mob with shield bash and combat skills
 * Phase 3: Eldoria Zone - Castle Grounds
 */

class Knight {
    constructor(zone, spawnPosition) {
        this.zone = zone;
        this.id = `knight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.x = spawnPosition.x;
        this.y = spawnPosition.y;
        
        this.name = 'Knight of Eldoria';
        this.level = 38;
        this.type = 'aggressive';
        this.behavior = 'disciplined_warrior';
        
        // Elite stats
        this.maxHp = 450;
        this.hp = this.maxHp;
        this.damage = 55;
        this.armor = 35;
        this.attackRange = 45;
        this.attackCooldown = 1800;
        this.lastAttackTime = 0;
        
        this.xpValue = 100;
        this.drops = [
            { item: 'knight_badge', chance: 0.8, minQty: 1, maxQty: 1 },
            { item: 'mithril_shard', chance: 0.4, minQty: 1, maxQty: 2 },
            { item: 'noble_sword', chance: 0.2, minQty: 1, maxQty: 1 },
            { item: 'knight_helmet', chance: 0.1, minQty: 1, maxQty: 1 }
        ];
        
        this.state = 'patrolling';
        this.target = null;
        this.spawnPosition = { ...spawnPosition };
        this.patrolRadius = 100;
        this.leashDistance = 250;
        
        this.speed = 2.2;
        this.chargeSpeed = 6;
        this.targetPosition = null;
        
        this.detectionRadius = 180;
        this.aggroRadius = 200;
        
        // Abilities
        this.abilities = {
            shieldBash: { cooldown: 8000, lastUse: 0 },
            charge: { cooldown: 10000, lastUse: 0, range: 150 },
            swordFlurry: { cooldown: 12000, lastUse: 0, hits: 3 },
            parry: { cooldown: 6000, lastUse: 0, duration: 2000, active: false }
        };
        
        this.startAI();
    }
    
    startAI() {
        this.aiInterval = setInterval(() => this.updateBehavior(), 700);
    }
    
    updateBehavior() {
        switch (this.state) {
            case 'patrolling':
                this.patrollingBehavior();
                break;
            case 'aggressive':
                this.aggressiveBehavior();
                break;
            case 'charging':
                this.chargingBehavior();
                break;
            case 'flurrying':
                this.flurryingBehavior();
                break;
            case 'returning':
                this.returningBehavior();
                break;
        }
    }
    
    patrollingBehavior() {
        if (!this.targetPosition || Math.random() < 0.12) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.patrolRadius;
            this.targetPosition = {
                x: this.spawnPosition.x + Math.cos(angle) * distance,
                y: this.spawnPosition.y + Math.sin(angle) * distance
            };
        }
        this.moveToTarget(this.speed);
    }
    
    aggressiveBehavior() {
        if (!this.target) {
            this.state = 'returning';
            return;
        }
        
        const distFromSpawn = this.distanceTo(this.spawnPosition);
        if (distFromSpawn > this.leashDistance) {
            this.state = 'returning';
            this.target = null;
            return;
        }
        
        const distToTarget = this.distanceTo(this.target);
        
        // Try to use charge if far enough
        if (distToTarget > 80 && distToTarget < this.abilities.charge.range && this.canUseAbility('charge')) {
            this.startCharge();
            return;
        }
        
        // Try parry if about to be attacked (predictive)
        if (!this.abilities.parry.active && this.canUseAbility('parry') && Math.random() < 0.3) {
            this.activateParry();
        }
        
        // Shield bash in melee
        if (distToTarget < 50 && this.canUseAbility('shieldBash')) {
            this.shieldBash(this.target);
            return;
        }
        
        // Sword flurry if in range and HP is good
        if (distToTarget <= this.attackRange && this.hp > this.maxHp * 0.5 && this.canUseAbility('swordFlurry')) {
            this.startFlurry();
            return;
        }
        
        // Basic movement and attack
        if (distToTarget > this.attackRange) {
            this.targetPosition = { x: this.target.x, y: this.target.y };
            this.moveToTarget(this.speed * 1.3);
        } else {
            this.attack(this.target);
        }
    }
    
    startCharge() {
        this.abilities.charge.lastUse = Date.now();
        this.state = 'charging';
        this.chargeTarget = { x: this.target.x, y: this.target.y };
        
        this.zone.emit('mob:charge_started', {
            mobId: this.id,
            mobType: 'knight',
            targetPosition: this.chargeTarget,
            speed: this.chargeSpeed
        });
    }
    
    chargingBehavior() {
        if (!this.chargeTarget || !this.target) {
            this.state = 'aggressive';
            return;
        }
        
        const dx = this.chargeTarget.x - this.x;
        const dy = this.chargeTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            this.x += (dx / distance) * this.chargeSpeed * 5;
            this.y += (dy / distance) * this.chargeSpeed * 5;
        } else {
            // Charge complete, deal damage
            this.chargeHit();
            this.state = 'aggressive';
        }
        
        this.constrainToZone();
    }
    
    chargeHit() {
        const damage = this.damage * 1.8;
        
        this.zone.emit('mob:charge_hit', {
            mobId: this.id,
            target: this.target.id || this.target,
            damage: Math.floor(damage),
            stunDuration: 1000
        });
    }
    
    startFlurry() {
        this.abilities.swordFlurry.lastUse = Date.now();
        this.state = 'flurrying';
        this.flurryHitsRemaining = this.abilities.swordFlurry.hits;
        this.flurryInterval = setInterval(() => {
            if (this.flurryHitsRemaining > 0 && this.target) {
                this.flurryAttack();
                this.flurryHitsRemaining--;
            } else {
                clearInterval(this.flurryInterval);
                this.state = 'aggressive';
            }
        }, 400); // 3 hits over 1.2 seconds
    }
    
    flurryingBehavior() {
        // Movement paused during flurry, just attacking
        if (!this.target || this.flurryHitsRemaining <= 0) {
            clearInterval(this.flurryInterval);
            this.state = 'aggressive';
        }
    }
    
    flurryAttack() {
        if (!this.target) return;
        
        const damage = Math.floor(this.damage * 0.7);
        
        this.zone.emit('mob:flurry_hit', {
            mobId: this.id,
            target: this.target.id || this.target,
            damage: damage,
            hitNumber: this.abilities.swordFlurry.hits - this.flurryHitsRemaining + 1,
            totalHits: this.abilities.swordFlurry.hits
        });
    }
    
    canUseAbility(abilityName) {
        const ability = this.abilities[abilityName];
        const now = Date.now();
        return now - ability.lastUse >= ability.cooldown && !ability.active;
    }
    
    activateParry() {
        this.abilities.parry.lastUse = Date.now();
        this.abilities.parry.active = true;
        
        this.zone.emit('mob:parry_activated', {
            mobId: this.id,
            duration: this.abilities.parry.duration
        });
        
        setTimeout(() => {
            this.abilities.parry.active = false;
        }, this.abilities.parry.duration);
    }
    
    shieldBash(target) {
        this.abilities.shieldBash.lastUse = Date.now();
        
        const damage = Math.floor(this.damage * 1.2);
        
        this.zone.emit('mob:shield_bash', {
            mobId: this.id,
            target: target.id || target,
            damage: damage,
            stunDuration: 1200,
            knockback: 30
        });
        
        return damage;
    }
    
    returningBehavior() {
        this.targetPosition = this.spawnPosition;
        const distance = this.distanceTo(this.spawnPosition);
        
        if (distance > 10) {
            this.moveToTarget(this.speed);
        } else {
            this.state = 'patrolling';
            this.target = null;
            this.hp = Math.min(this.maxHp, this.hp + 30);
        }
    }
    
    moveToTarget(speed) {
        if (!this.targetPosition) return;
        
        const dx = this.targetPosition.x - this.x;
        const dy = this.targetPosition.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            this.x += (dx / distance) * speed * 5;
            this.y += (dy / distance) * speed * 5;
        } else {
            this.targetPosition = null;
        }
        
        this.constrainToZone();
    }
    
    distanceTo(position) {
        const dx = this.x - position.x;
        const dy = this.y - position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    constrainToZone() {
        if (this.zone?.config?.size) {
            const bounds = this.zone.config.size;
            this.x = Math.max(0, Math.min(this.x, bounds.width));
            this.y = Math.max(0, Math.min(this.y, bounds.height));
        }
    }
    
    attack(target) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;
        
        this.lastAttackTime = now;
        const damage = Math.floor(this.damage * (0.9 + Math.random() * 0.2));
        
        this.zone.emit('mob:attack', {
            mobId: this.id,
            target: target.id || target,
            damage: damage
        });
        
        return damage;
    }
    
    takeDamage(amount, attacker) {
        // Check parry
        if (this.abilities.parry.active) {
            this.abilities.parry.active = false;
            
            this.zone.emit('mob:parried', {
                mobId: this.id,
                attacker: attacker.id || attacker,
                damageBlocked: amount
            });
            
            // Counter-attack after parry
            setTimeout(() => {
                if (this.target) {
                    this.attack(this.target);
                }
            }, 300);
            
            return { parried: true, damageBlocked: amount };
        }
        
        const actualDamage = Math.max(1, amount - this.armor);
        this.hp -= actualDamage;
        
        if (!this.target) {
            this.target = attacker;
            this.state = 'aggressive';
        }
        
        if (this.hp <= 0) return this.die(attacker);
        
        return { hp: this.hp, maxHp: this.maxHp, damageTaken: actualDamage };
    }
    
    checkForPlayers(players) {
        if (this.state !== 'patrolling') return;
        
        for (const player of players) {
            const dist = this.distanceTo(player);
            if (dist <= this.detectionRadius) {
                this.target = player;
                this.state = 'aggressive';
                
                this.zone.emit('mob:challenged', {
                    mobId: this.id,
                    mobType: 'knight',
                    player: player.id || player,
                    message: 'Halt! State your business!'
                });
                return;
            }
        }
    }
    
    die(killer) {
        clearInterval(this.aiInterval);
        if (this.flurryInterval) clearInterval(this.flurryInterval);
        
        const drops = this.generateDrops();
        
        this.zone.emit('mob:died', {
            mobId: this.id,
            mobType: 'knight',
            killer: killer.id || killer,
            position: { x: this.x, y: this.y },
            drops: drops,
            xpValue: this.xpValue,
            isElite: true
        });
        
        return { died: true, drops: drops, xpValue: this.xpValue };
    }
    
    generateDrops() {
        const drops = [];
        for (const drop of this.drops) {
            if (Math.random() <= drop.chance) {
                const qty = Math.floor(Math.random() * (drop.maxQty - drop.minQty + 1)) + drop.minQty;
                drops.push({ item: drop.item, quantity: qty });
            }
        }
        return drops;
    }
    
    getClientData() {
        return {
            id: this.id,
            type: 'knight',
            name: this.name,
            x: Math.floor(this.x),
            y: Math.floor(this.y),
            hp: this.hp,
            maxHp: this.maxHp,
            level: this.level,
            state: this.state,
            isParrying: this.abilities.parry.active,
            isElite: true,
            isAggressive: this.state === 'aggressive' || this.state === 'charging' || this.state === 'flurrying'
        };
    }
    
    cleanup() {
        if (this.aiInterval) clearInterval(this.aiInterval);
        if (this.flurryInterval) clearInterval(this.flurryInterval);
    }
}

module.exports = Knight;
