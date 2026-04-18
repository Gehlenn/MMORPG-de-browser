/**
 * CaveTroll.js
 * Regenerating mob with high HP
 * Phase 3: Eldoria Zone - Iron Mines
 */

class CaveTroll {
    constructor(zone, spawnPosition) {
        this.zone = zone;
        this.id = `troll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.x = spawnPosition.x;
        this.y = spawnPosition.y;
        
        this.name = 'Cave Troll';
        this.level = 32;
        this.type = 'aggressive';
        this.behavior = 'regenerator';
        
        // High HP, moderate damage
        this.maxHp = 500;
        this.hp = this.maxHp;
        this.damage = 45;
        this.armor = 15;
        this.attackRange = 50;
        this.attackCooldown = 2500;
        this.lastAttackTime = 0;
        
        this.xpValue = 80;
        this.drops = [
            { item: 'troll_hide', chance: 0.8, minQty: 1, maxQty: 2 },
            { item: 'cave_moss', chance: 0.6, minQty: 2, maxQty: 4 },
            { item: 'regeneration_gland', chance: 0.3, minQty: 1, maxQty: 1 },
            { item: 'troll_club', chance: 0.15, minQty: 1, maxQty: 1 }
        ];
        
        this.state = 'sleeping'; // sleeping, aggressive, enraged, fleeing
        this.target = null;
        this.spawnPosition = { ...spawnPosition };
        this.leashDistance = 200;
        
        this.speed = 1.2;
        this.targetPosition = null;
        
        this.detectionRadius = 150;
        this.wakeRange = 100;
        
        // Regeneration
        this.regenRate = 5; // HP per second
        this.regenInterval = null;
        this.lastCombatTime = 0;
        this.combatRegenDelay = 5000; // 5s after combat for regen to resume
        
        // Enrage at low HP
        this.enrageThreshold = 0.25;
        this.isEnraged = false;
        
        // Roar stun
        this.roarCooldown = 12000;
        this.lastRoarTime = 0;
        
        this.startAI();
        this.startRegeneration();
    }
    
    startAI() {
        this.aiInterval = setInterval(() => this.updateBehavior(), 1200);
    }
    
    startRegeneration() {
        this.regenInterval = setInterval(() => {
            if (this.hp < this.maxHp && this.canRegenerate()) {
                this.hp = Math.min(this.maxHp, this.hp + this.regenRate);
            }
        }, 1000);
    }
    
    canRegenerate() {
        // No regen while in combat or recently in combat
        if (this.state === 'aggressive' || this.state === 'enraged') return false;
        
        const timeSinceCombat = Date.now() - this.lastCombatTime;
        return timeSinceCombat >= this.combatRegenDelay;
    }
    
    updateBehavior() {
        switch (this.state) {
            case 'sleeping':
                this.sleepingBehavior();
                break;
            case 'aggressive':
                this.aggressiveBehavior();
                break;
            case 'enraged':
                this.enragedBehavior();
                break;
            case 'fleeing':
                this.fleeingBehavior();
                break;
        }
    }
    
    sleepingBehavior() {
        // Regen faster while sleeping
        if (this.hp < this.maxHp && Date.now() - this.lastCombatTime > this.combatRegenDelay) {
            this.hp = Math.min(this.maxHp, this.hp + this.regenRate * 2);
        }
    }
    
    aggressiveBehavior() {
        if (!this.target) {
            this.state = 'sleeping';
            return;
        }
        
        // Check enrage
        if (this.hp <= this.maxHp * this.enrageThreshold && !this.isEnraged) {
            this.enrage();
            return;
        }
        
        // Check leash
        const distFromSpawn = this.distanceTo(this.spawnPosition);
        if (distFromSpawn > this.leashDistance) {
            this.roarStun(this.target);
            this.state = 'sleeping';
            this.target = null;
            return;
        }
        
        const distToTarget = this.distanceTo(this.target);
        
        // Use roar stun if available and close
        if (distToTarget < 80 && this.canUseRoar()) {
            this.roarStun(this.target);
        }
        
        // Move to attack
        if (distToTarget > this.attackRange) {
            this.targetPosition = { x: this.target.x, y: this.target.y };
            this.moveToTarget(this.speed);
        } else {
            this.clubSlam(this.target);
        }
    }
    
    enragedBehavior() {
        if (!this.target) {
            this.isEnraged = false;
            this.state = 'sleeping';
            return;
        }
        
        const distToTarget = this.distanceTo(this.target);
        
        // Faster and more aggressive when enraged
        if (distToTarget > this.attackRange) {
            this.targetPosition = { x: this.target.x, y: this.target.y };
            this.moveToTarget(this.speed * 1.5);
        } else {
            // Double attack speed when enraged
            this.clubSlam(this.target);
            if (this.canAttack()) {
                setTimeout(() => this.clubSlam(this.target), 500);
            }
        }
    }
    
    fleeingBehavior() {
        // Trolls rarely flee, only if somehow out of leash
        const distFromSpawn = this.distanceTo(this.spawnPosition);
        
        if (distFromSpawn > this.leashDistance) {
            this.targetPosition = this.spawnPosition;
            this.moveToTarget(this.speed * 0.8);
        } else {
            this.state = 'sleeping';
            this.target = null;
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
    
    enrage() {
        this.isEnraged = true;
        this.state = 'enraged';
        this.damage = Math.floor(this.damage * 1.4);
        this.speed *= 1.3;
        
        this.zone.emit('mob:enraged', {
            mobId: this.id,
            mobType: 'cave_troll',
            message: 'The Cave Troll enters a blood rage!'
        });
    }
    
    canUseRoar() {
        const now = Date.now();
        return now - this.lastRoarTime >= this.roarCooldown;
    }
    
    roarStun(target) {
        this.lastRoarTime = Date.now();
        
        this.zone.emit('mob:roar_stun', {
            mobId: this.id,
            target: target.id || target,
            stunDuration: 2000, // 2s stun
            radius: 80,
            position: { x: this.x, y: this.y }
        });
    }
    
    canAttack() {
        const now = Date.now();
        return now - this.lastAttackTime >= this.attackCooldown;
    }
    
    clubSlam(target) {
        if (!this.canAttack()) return;
        
        this.lastAttackTime = Date.now();
        
        // Club slam has AoE
        const damage = Math.floor(this.damage * (0.9 + Math.random() * 0.2));
        
        this.zone.emit('mob:club_slam', {
            mobId: this.id,
            target: target.id || target,
            damage: damage,
            radius: 40,
            position: { x: this.x, y: this.y }
        });
        
        return damage;
    }
    
    attack(target) {
        if (!this.canAttack()) return;
        
        this.lastAttackTime = Date.now();
        const damage = Math.floor(this.damage * (0.9 + Math.random() * 0.2));
        
        this.zone.emit('mob:attack', {
            mobId: this.id,
            target: target.id || target,
            damage: damage
        });
        
        return damage;
    }
    
    takeDamage(amount, attacker) {
        this.lastCombatTime = Date.now();
        
        const actualDamage = Math.max(1, amount - this.armor);
        this.hp -= actualDamage;
        
        // Wake up if sleeping
        if (this.state === 'sleeping') {
            const dist = this.distanceTo(attacker);
            if (dist <= this.wakeRange) {
                this.state = 'aggressive';
                this.target = attacker;
                
                this.zone.emit('mob:woke_up', {
                    mobId: this.id,
                    mobType: 'cave_troll',
                    message: 'The Cave Troll wakes up hungry!'
                });
            }
        }
        
        if (!this.target && this.state !== 'sleeping') {
            this.target = attacker;
            this.state = 'aggressive';
        }
        
        if (this.hp <= 0) return this.die(attacker);
        
        return {
            hp: this.hp,
            maxHp: this.maxHp,
            damageTaken: actualDamage,
            state: this.state
        };
    }
    
    checkForPlayers(players) {
        for (const player of players) {
            const dist = this.distanceTo(player);
            
            if (this.state === 'sleeping' && dist <= this.wakeRange) {
                this.target = player;
                this.state = 'aggressive';
                this.zone.emit('mob:detected_player', {
                    mobId: this.id,
                    mobType: 'cave_troll',
                    player: player.id || player
                });
                return;
            }
            
            if (this.state === 'aggressive' && dist <= this.detectionRadius) {
                if (!this.target) this.target = player;
                return;
            }
        }
    }
    
    die(killer) {
        clearInterval(this.aiInterval);
        clearInterval(this.regenInterval);
        
        const drops = this.generateDrops();
        
        this.zone.emit('mob:died', {
            mobId: this.id,
            mobType: 'cave_troll',
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
            type: 'cave_troll',
            name: this.name,
            x: Math.floor(this.x),
            y: Math.floor(this.y),
            hp: this.hp,
            maxHp: this.maxHp,
            level: this.level,
            state: this.state,
            isEnraged: this.isEnraged,
            isSleeping: this.state === 'sleeping',
            isRegenerating: this.canRegenerate()
        };
    }
    
    cleanup() {
        if (this.aiInterval) clearInterval(this.aiInterval);
        if (this.regenInterval) clearInterval(this.regenInterval);
    }
}

module.exports = CaveTroll;
