/**
 * Bandit.js
 * Aggressive mob that steals gold and runs at low HP
 * Phase 3: Eldoria Zone
 */

class Bandit {
    constructor(zone, spawnPosition) {
        this.zone = zone;
        this.id = `bandit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.x = spawnPosition.x;
        this.y = spawnPosition.y;
        
        this.name = 'Forest Bandit';
        this.level = 24;
        this.type = 'aggressive';
        this.behavior = 'hit_and_run';
        
        this.maxHp = 150;
        this.hp = this.maxHp;
        this.damage = 20;
        this.armor = 8;
        this.attackRange = 35;
        this.attackCooldown = 1500;
        this.lastAttackTime = 0;
        
        this.xpValue = 35;
        this.drops = [
            { item: 'stolen_goods', chance: 0.7, minQty: 1, maxQty: 2 },
            { item: 'bandit_dagger', chance: 0.3, minQty: 1, maxQty: 1 },
            { item: 'small_gold_pouch', chance: 0.5, minQty: 5, maxQty: 15 }
        ];
        
        this.state = 'patrolling';
        this.target = null;
        this.spawnPosition = { ...spawnPosition };
        this.leashDistance = 250;
        
        this.speed = 2.8;
        this.fleeSpeed = 4.5;
        this.targetPosition = null;
        
        this.detectionRadius = 180;
        this.aggroRadius = 200;
        
        this.stealAmount = 10;
        this.hasStolen = false;
        this.fleeThreshold = 0.3;
        this.isFleeing = false;
        
        this.startAI();
    }
    
    startAI() {
        this.aiInterval = setInterval(() => this.updateBehavior(), 800);
    }
    
    updateBehavior() {
        switch (this.state) {
            case 'patrolling':
                this.patrollingBehavior();
                break;
            case 'aggressive':
                this.aggressiveBehavior();
                break;
            case 'fleeing':
                this.fleeingBehavior();
                break;
            case 'returning':
                this.returningBehavior();
                break;
        }
    }
    
    patrollingBehavior() {
        if (!this.targetPosition || Math.random() < 0.15) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 80;
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
        
        if (this.hp <= this.maxHp * this.fleeThreshold && !this.isFleeing) {
            this.startFleeing();
            return;
        }
        
        const distFromSpawn = this.distanceTo(this.spawnPosition);
        if (distFromSpawn > this.leashDistance) {
            this.state = 'returning';
            this.target = null;
            return;
        }
        
        const distToTarget = this.distanceTo(this.target);
        
        if (!this.hasStolen && distToTarget < this.attackRange) {
            this.stealGold(this.target);
        }
        
        if (distToTarget > this.attackRange) {
            this.targetPosition = { x: this.target.x, y: this.target.y };
            this.moveToTarget(this.speed);
        } else {
            this.attack(this.target);
        }
    }
    
    startFleeing() {
        this.isFleeing = true;
        this.state = 'fleeing';
        this.zone.emit('mob:fleeing', { mobId: this.id, mobType: 'bandit' });
    }
    
    fleeingBehavior() {
        if (!this.target) {
            this.state = 'returning';
            return;
        }
        
        const dx = this.x - this.target.x;
        const dy = this.y - this.target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.fleeSpeed * 5;
            this.y += (dy / distance) * this.fleeSpeed * 5;
        }
        
        if (distance > this.leashDistance) {
            this.state = 'returning';
        }
        
        this.constrainToZone();
    }
    
    returningBehavior() {
        this.targetPosition = this.spawnPosition;
        const distance = this.distanceTo(this.spawnPosition);
        
        if (distance > 10) {
            this.moveToTarget(this.speed);
        } else {
            this.state = 'patrolling';
            this.target = null;
            this.isFleeing = false;
            this.hasStolen = false;
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.3);
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
    
    stealGold(target) {
        if (this.hasStolen) return;
        this.hasStolen = true;
        this.zone.emit('mob:stole_gold', {
            mobId: this.id,
            target: target.id || target,
            amount: this.stealAmount
        });
    }
    
    attack(target) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;
        
        this.lastAttackTime = now;
        const damage = Math.floor(this.damage * (0.8 + Math.random() * 0.4));
        
        this.zone.emit('mob:attack', {
            mobId: this.id,
            target: target.id || target,
            damage: damage
        });
        return damage;
    }
    
    takeDamage(amount, attacker) {
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
        if (this.state !== 'patrolling' || this.isFleeing) return;
        
        for (const player of players) {
            const dist = this.distanceTo(player);
            if (dist <= this.detectionRadius) {
                this.target = player;
                this.state = 'aggressive';
                if (dist < 50) {
                    this.zone.emit('mob:ambush', { mobId: this.id, target: player.id || player });
                }
                return;
            }
        }
    }
    
    die(killer) {
        clearInterval(this.aiInterval);
        const drops = this.generateDrops();
        
        this.zone.emit('mob:died', {
            mobId: this.id,
            mobType: 'bandit',
            killer: killer.id || killer,
            position: { x: this.x, y: this.y },
            drops: drops,
            xpValue: this.xpValue
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
            type: 'bandit',
            name: this.name,
            x: Math.floor(this.x),
            y: Math.floor(this.y),
            hp: this.hp,
            maxHp: this.maxHp,
            level: this.level,
            state: this.state,
            isFleeing: this.isFleeing,
            isAggressive: this.state === 'aggressive'
        };
    }
    
    cleanup() {
        if (this.aiInterval) clearInterval(this.aiInterval);
    }
}

module.exports = Bandit;
