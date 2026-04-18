/**
 * RoyalGuard.js
 * Neutral protector mob - attacks players who harm civilians
 * Phase 3: Eldoria Zone - Castle Grounds
 */

class RoyalGuard {
    constructor(zone, spawnPosition, protectedArea = null) {
        this.zone = zone;
        this.id = `guard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.x = spawnPosition.x;
        this.y = spawnPosition.y;
        
        this.name = 'Royal Guard';
        this.level = 35;
        this.type = 'neutral';
        this.behavior = 'protector';
        
        this.maxHp = 350;
        this.hp = this.maxHp;
        this.damage = 40;
        this.armor = 30;
        this.attackRange = 40;
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        
        this.xpValue = 70;
        this.drops = [
            { item: 'guard_insignia', chance: 0.7, minQty: 1, maxQty: 1 },
            { item: 'steel_sword', chance: 0.25, minQty: 1, maxQty: 1 },
            { item: 'guard_armor', chance: 0.15, minQty: 1, maxQty: 1 },
            { item: 'royal_seal', chance: 0.05, minQty: 1, maxQty: 1 }
        ];
        
        this.state = 'guarding'; // guarding, aggressive, pursuing, returning
        this.target = null;
        this.spawnPosition = { ...spawnPosition };
        this.patrolRadius = 80;
        
        this.speed = 2.5;
        this.pursuitSpeed = 4;
        this.targetPosition = null;
        
        this.detectionRadius = 160;
        this.criminalList = new Set(); // Players who attacked civilians
        
        // Abilities
        this.shieldBashCooldown = 6000;
        this.lastShieldBashTime = 0;
        this.canCallForHelp = true;
        
        this.startAI();
    }
    
    startAI() {
        this.aiInterval = setInterval(() => this.updateBehavior(), 800);
    }
    
    updateBehavior() {
        switch (this.state) {
            case 'guarding':
                this.guardingBehavior();
                break;
            case 'aggressive':
                this.aggressiveBehavior();
                break;
            case 'pursuing':
                this.pursuingBehavior();
                break;
            case 'returning':
                this.returningBehavior();
                break;
        }
    }
    
    guardingBehavior() {
        // Patrol around spawn position
        if (!this.targetPosition || Math.random() < 0.1) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.patrolRadius;
            this.targetPosition = {
                x: this.spawnPosition.x + Math.cos(angle) * distance,
                y: this.spawnPosition.y + Math.sin(angle) * distance
            };
        }
        
        const dx = this.targetPosition.x - this.x;
        const dy = this.targetPosition.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            this.x += (dx / distance) * this.speed * 3;
            this.y += (dy / distance) * this.speed * 3;
        }
        
        this.constrainToZone();
    }
    
    aggressiveBehavior() {
        if (!this.target) {
            this.state = 'returning';
            return;
        }
        
        const distToTarget = this.distanceTo(this.target);
        
        // Use shield bash if available and close
        if (distToTarget < 50 && this.canShieldBash()) {
            this.shieldBash(this.target);
        }
        
        if (distToTarget > this.attackRange) {
            this.targetPosition = { x: this.target.x, y: this.target.y };
            this.moveToTarget(this.pursuitSpeed);
        } else {
            this.attack(this.target);
        }
    }
    
    pursuingBehavior() {
        // Extended pursuit of criminals
        if (!this.target) {
            this.state = 'returning';
            return;
        }
        
        const distToTarget = this.distanceTo(this.target);
        
        // Give up if too far
        if (distToTarget > this.detectionRadius * 2) {
            this.state = 'returning';
            this.target = null;
            return;
        }
        
        if (distToTarget > this.attackRange) {
            this.targetPosition = { x: this.target.x, y: this.target.y };
            this.moveToTarget(this.pursuitSpeed);
        } else {
            this.attack(this.target);
        }
    }
    
    returningBehavior() {
        this.targetPosition = this.spawnPosition;
        const distance = this.distanceTo(this.spawnPosition);
        
        if (distance > 10) {
            this.moveToTarget(this.speed);
        } else {
            this.state = 'guarding';
            this.target = null;
            this.canCallForHelp = true;
            // Heal while returning
            this.hp = Math.min(this.maxHp, this.hp + 10);
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
    
    canShieldBash() {
        const now = Date.now();
        return now - this.lastShieldBashTime >= this.shieldBashCooldown;
    }
    
    shieldBash(target) {
        this.lastShieldBashTime = Date.now();
        
        const damage = Math.floor(this.damage * 1.3);
        const stunDuration = 1500;
        
        this.zone.emit('mob:shield_bash', {
            mobId: this.id,
            target: target.id || target,
            damage: damage,
            stunDuration: stunDuration
        });
        
        return damage;
    }
    
    callForHelp() {
        if (!this.canCallForHelp) return;
        
        this.canCallForHelp = false;
        
        this.zone.emit('mob:call_for_help', {
            mobId: this.id,
            mobType: 'royal_guard',
            position: { x: this.x, y: this.y },
            radius: 200
        });
    }
    
    attack(target) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;
        
        this.lastAttackTime = now;
        const damage = Math.floor(this.damage * (0.85 + Math.random() * 0.3));
        
        this.zone.emit('mob:attack', {
            mobId: this.id,
            target: target.id || target,
            damage: damage
        });
        
        return damage;
    }
    
    // Mark player as criminal (attacked civilian)
    reportCriminal(playerId) {
        this.criminalList.add(playerId);
        
        // If nearby, immediately aggro
        this.zone.emit('guard:criminal_reported', {
            guardId: this.id,
            criminalId: playerId
        });
    }
    
    takeDamage(amount, attacker, isCivilian = false) {
        const actualDamage = Math.max(1, amount - this.armor);
        this.hp -= actualDamage;
        
        // If attacker is marked as criminal or this guard was protecting civilians
        const shouldAggro = isCivilian || this.criminalList.has(attacker.id || attacker);
        
        if (shouldAggro && this.state !== 'aggressive') {
            this.target = attacker;
            this.state = 'aggressive';
            this.callForHelp();
        }
        
        if (this.hp <= this.maxHp * 0.5 && this.canCallForHelp) {
            this.callForHelp();
        }
        
        if (this.hp <= 0) return this.die(attacker);
        
        return {
            hp: this.hp,
            maxHp: this.maxHp,
            damageTaken: actualDamage,
            state: this.state
        };
    }
    
    checkForPlayers(players, criminals = []) {
        // Check for criminals in range
        for (const player of players) {
            const playerId = player.id || player;
            const dist = this.distanceTo(player);
            
            // Check if this player is a known criminal
            if (this.criminalList.has(playerId) && dist <= this.detectionRadius) {
                this.target = player;
                this.state = 'pursuing';
                
                this.zone.emit('guard:spotted_criminal', {
                    guardId: this.id,
                    criminalId: playerId,
                    message: 'Halt! Criminal scum!'
                });
                return;
            }
            
            // Also check provided criminals list
            if (criminals.includes(playerId) && dist <= this.detectionRadius) {
                this.criminalList.add(playerId);
                this.target = player;
                this.state = 'pursuing';
                return;
            }
        }
    }
    
    die(killer) {
        clearInterval(this.aiInterval);
        const drops = this.generateDrops();
        
        this.zone.emit('mob:died', {
            mobId: this.id,
            mobType: 'royal_guard',
            killer: killer.id || killer,
            position: { x: this.x, y: this.y },
            drops: drops,
            xpValue: this.xpValue,
            isGuard: true
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
            type: 'royal_guard',
            name: this.name,
            x: Math.floor(this.x),
            y: Math.floor(this.y),
            hp: this.hp,
            maxHp: this.maxHp,
            level: this.level,
            state: this.state,
            isAggressive: this.state === 'aggressive' || this.state === 'pursuing',
            isGuarding: this.state === 'guarding'
        };
    }
    
    cleanup() {
        if (this.aiInterval) clearInterval(this.aiInterval);
    }
}

module.exports = RoyalGuard;
