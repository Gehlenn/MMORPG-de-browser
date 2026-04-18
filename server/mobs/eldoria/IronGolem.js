/**
 * IronGolem.js
 * Tank mob with high armor and slow movement
 * Phase 3: Eldoria Zone - Iron Mines
 */

class IronGolem {
    constructor(zone, spawnPosition) {
        this.zone = zone;
        this.id = `golem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.x = spawnPosition.x;
        this.y = spawnPosition.y;
        
        this.name = 'Iron Golem';
        this.level = 28;
        this.type = 'aggressive';
        this.behavior = 'slow_tank';
        
        // Tank stats - high HP, high armor
        this.maxHp = 400;
        this.hp = this.maxHp;
        this.damage = 35;
        this.armor = 50; // 50% damage reduction
        this.magicResistance = 0; // Vulnerable to magic
        this.attackRange = 45;
        this.attackCooldown = 3000; // 3s slow attacks
        this.lastAttackTime = 0;
        
        this.xpValue = 60;
        this.drops = [
            { item: 'iron_ore', chance: 0.9, minQty: 2, maxQty: 5 },
            { item: 'golem_core', chance: 0.4, minQty: 1, maxQty: 1 },
            { item: 'broken_plate', chance: 0.6, minQty: 1, maxQty: 3 }
        ];
        
        this.state = 'dormant'; // dormant, waking, aggressive, returning
        this.target = null;
        this.spawnPosition = { ...spawnPosition };
        this.leashDistance = 150; // Short leash
        
        // Slow movement
        this.speed = 0.8;
        this.targetPosition = null;
        
        this.detectionRadius = 120;
        this.wakeRange = 80; // Wake up when player gets this close
        
        // Special abilities
        this.isArmorUp = false;
        this.armorUpCooldown = 15000; // 15s
        this.lastArmorUpTime = 0;
        
        this.slamCooldown = 8000; // 8s
        this.lastSlamTime = 0;
        
        this.startAI();
    }
    
    startAI() {
        this.aiInterval = setInterval(() => this.updateBehavior(), 1500);
    }
    
    updateBehavior() {
        switch (this.state) {
            case 'dormant':
                this.dormantBehavior();
                break;
            case 'waking':
                this.wakingBehavior();
                break;
            case 'aggressive':
                this.aggressiveBehavior();
                break;
            case 'returning':
                this.returningBehavior();
                break;
        }
    }
    
    dormantBehavior() {
        // Stationary, waiting for player to approach
        // Visual: Could show as a pile of rocks/iron
        
        // Slowly heal when dormant
        if (this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + 2);
        }
    }
    
    wakingBehavior() {
        // Transition state - takes 2 seconds to fully wake
        // Could emit particles/sound effect
        
        setTimeout(() => {
            if (this.state === 'waking') {
                this.state = 'aggressive';
                
                // Wake up event
                this.zone.emit('mob:woke_up', {
                    mobId: this.id,
                    mobType: 'iron_golem'
                });
            }
        }, 2000);
    }
    
    aggressiveBehavior() {
        if (!this.target) {
            this.state = 'returning';
            return;
        }
        
        // Check leash
        const distFromSpawn = this.distanceTo(this.spawnPosition);
        if (distFromSpawn > this.leashDistance) {
            this.state = 'returning';
            this.target = null;
            return;
        }
        
        const distToTarget = this.distanceTo(this.target);
        
        // Use armor up if available and damaged
        if (!this.isArmorUp && this.hp < this.maxHp * 0.7) {
            this.activateArmorUp();
        }
        
        // Use slam if in range and available
        if (distToTarget <= this.attackRange && this.canUseSlam()) {
            this.heavySlam(this.target);
            return;
        }
        
        // Move toward target (slowly)
        if (distToTarget > this.attackRange) {
            this.targetPosition = { x: this.target.x, y: this.target.y };
            this.moveToTarget(this.speed);
        } else {
            this.attack(this.target);
        }
    }
    
    returningBehavior() {
        // Go dormant when returning to spawn
        const distance = this.distanceTo(this.spawnPosition);
        
        if (distance > 10) {
            this.targetPosition = this.spawnPosition;
            this.moveToTarget(this.speed * 0.5);
        } else {
            // Back at spawn, go dormant
            this.state = 'dormant';
            this.target = null;
            this.isArmorUp = false;
            
            // Heal over time while dormant
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.2);
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
    
    activateArmorUp() {
        const now = Date.now();
        if (now - this.lastArmorUpTime < this.armorUpCooldown) return;
        
        this.lastArmorUpTime = now;
        this.isArmorUp = true;
        this.armor += 25; // Total 75 armor
        
        this.zone.emit('mob:armor_up', {
            mobId: this.id,
            mobType: 'iron_golem',
            armorBonus: 25,
            totalArmor: this.armor
        });
        
        // Armor up lasts 10 seconds
        setTimeout(() => {
            if (this.state !== 'dormant') {
                this.isArmorUp = false;
                this.armor -= 25;
            }
        }, 10000);
    }
    
    canUseSlam() {
        const now = Date.now();
        return now - this.lastSlamTime >= this.slamCooldown;
    }
    
    heavySlam(target) {
        this.lastSlamTime = Date.now();
        
        const damage = this.damage * 2; // Double damage
        
        this.zone.emit('mob:heavy_slam', {
            mobId: this.id,
            target: target.id || target,
            damage: damage,
            position: { x: this.x, y: this.y },
            radius: 60 // AoE radius
        });
        
        return damage;
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
    
    takeDamage(amount, attacker, damageType = 'physical') {
        // Armor calculation
        let actualDamage = amount;
        
        if (damageType === 'physical') {
            // Armor reduces physical damage
            actualDamage = Math.max(1, amount - this.armor);
        } else if (damageType === 'magic') {
            // Magic bypasses armor but golem has no magic resist
            actualDamage = amount;
        }
        
        this.hp -= actualDamage;
        
        // Wake up if dormant
        if (this.state === 'dormant') {
            const dist = this.distanceTo(attacker);
            if (dist <= this.wakeRange) {
                this.state = 'waking';
                this.target = attacker;
            }
        }
        
        // Aggro if not already
        if (!this.target && this.state !== 'dormant' && this.state !== 'waking') {
            this.target = attacker;
            this.state = 'aggressive';
        }
        
        if (this.hp <= 0) {
            return this.die(attacker);
        }
        
        return {
            hp: this.hp,
            maxHp: this.maxHp,
            damageTaken: actualDamage,
            state: this.state
        };
    }
    
    checkForPlayers(players) {
        // Only detect if dormant or aggressive
        if (this.state !== 'dormant' && this.state !== 'aggressive') return;
        
        for (const player of players) {
            const dist = this.distanceTo(player);
            
            // Wake up if player gets close
            if (this.state === 'dormant' && dist <= this.wakeRange) {
                this.target = player;
                this.state = 'waking';
                
                this.zone.emit('mob:detected_player', {
                    mobId: this.id,
                    mobType: 'iron_golem',
                    player: player.id || player,
                    distance: dist
                });
                return;
            }
            
            // Aggro if already awake and player in detection range
            if (this.state === 'aggressive' && dist <= this.detectionRadius) {
                if (!this.target) {
                    this.target = player;
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
            mobType: 'iron_golem',
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
            type: 'iron_golem',
            name: this.name,
            x: Math.floor(this.x),
            y: Math.floor(this.y),
            hp: this.hp,
            maxHp: this.maxHp,
            level: this.level,
            state: this.state,
            isArmorUp: this.isArmorUp,
            isDormant: this.state === 'dormant',
            isAggressive: this.state === 'aggressive'
        };
    }
    
    cleanup() {
        if (this.aiInterval) clearInterval(this.aiInterval);
    }
}

module.exports = IronGolem;
