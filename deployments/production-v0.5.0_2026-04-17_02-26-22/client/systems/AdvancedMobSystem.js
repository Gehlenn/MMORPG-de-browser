/**
 * Advanced Mob System - New Mob Types with Unique Behaviors
 * Version 0.4.0 - Enhanced Mob Variety
 */

class AdvancedMobSystem {
    constructor(game) {
        this.game = game;
        this.mobs = [];
        this.mobTypes = this.defineMobTypes();
        this.bosses = [];
        this.spawnTimers = {};
        
        this.initialize();
    }
    
    initialize() {
        this.setupMobBehaviors();
        this.startSpawnLoops();
    }
    
    defineMobTypes() {
        return {
            // Basic Mobs
            slime: {
                name: 'Slime',
                icon: '🟢',
                hp: 30,
                maxHp: 30,
                damage: 5,
                speed: 1,
                xp: 10,
                gold: 2,
                behavior: 'passive',
                color: '#2ecc71',
                size: 15,
                aggroRange: 100,
                drops: [
                    { item: 'slime_gel', chance: 0.3, quantity: [1, 3] },
                    { item: 'small_potion', chance: 0.1, quantity: [1, 1] }
                ]
            },
            
            goblin: {
                name: 'Goblin',
                icon: '👺',
                hp: 50,
                maxHp: 50,
                damage: 8,
                speed: 1.5,
                xp: 15,
                gold: 5,
                behavior: 'aggressive',
                color: '#27ae60',
                size: 18,
                aggroRange: 200,
                drops: [
                    { item: 'goblin_ear', chance: 0.4, quantity: [1, 2] },
                    { item: 'rusty_dagger', chance: 0.05, quantity: [1, 1] },
                    { item: 'gold_coin', chance: 0.6, quantity: [1, 5] }
                ]
            },
            
            wolf: {
                name: 'Lobo',
                icon: '🐺',
                hp: 65,
                maxHp: 65,
                damage: 12,
                speed: 2,
                xp: 20,
                gold: 8,
                behavior: 'pack',
                color: '#7f8c8d',
                size: 20,
                aggroRange: 250,
                packBonus: 0.2, // 20% bonus per pack member
                drops: [
                    { item: 'wolf_fang', chance: 0.35, quantity: [1, 2] },
                    { item: 'wolf_pelt', chance: 0.25, quantity: [1, 1] },
                    { item: 'meat', chance: 0.5, quantity: [1, 2] }
                ]
            },
            
            orc: {
                name: 'Orc',
                icon: '👹',
                hp: 100,
                maxHp: 100,
                damage: 15,
                speed: 0.8,
                xp: 30,
                gold: 12,
                behavior: 'aggressive',
                color: '#e74c3c',
                size: 25,
                aggroRange: 180,
                drops: [
                    { item: 'orc_tooth', chance: 0.3, quantity: [1, 2] },
                    { item: 'iron_ore', chance: 0.2, quantity: [1, 3] },
                    { item: 'orc_axe', chance: 0.03, quantity: [1, 1] }
                ]
            },
            
            // New Mob Types
            skeleton: {
                name: 'Esqueleto',
                icon: '💀',
                hp: 40,
                maxHp: 40,
                damage: 10,
                speed: 1.2,
                xp: 18,
                gold: 6,
                behavior: 'ranged',
                color: '#ecf0f1',
                size: 18,
                aggroRange: 300,
                attackRange: 200,
                projectile: 'bone_arrow',
                drops: [
                    { item: 'bone', chance: 0.5, quantity: [1, 3] },
                    { item: 'ancient_coin', chance: 0.15, quantity: [1, 2] }
                ]
            },
            
            spider: {
                name: 'Aranha Gigante',
                icon: '🕷️',
                hp: 35,
                maxHp: 35,
                damage: 8,
                speed: 1.8,
                xp: 16,
                gold: 4,
                behavior: 'ambush',
                color: '#8e44ad',
                size: 16,
                aggroRange: 150,
                stealth: true,
                poisonDamage: 2,
                poisonDuration: 5000,
                drops: [
                    { item: 'spider_silk', chance: 0.4, quantity: [1, 2] },
                    { item: 'venom_sac', chance: 0.2, quantity: [1, 1] }
                ]
            },
            
            golem: {
                name: 'Golem de Pedra',
                icon: '🗿',
                hp: 200,
                maxHp: 200,
                damage: 25,
                speed: 0.4,
                xp: 60,
                gold: 25,
                behavior: 'defensive',
                color: '#7f8c8d',
                size: 35,
                aggroRange: 120,
                armor: 0.5, // 50% damage reduction
                knockbackResist: true,
                drops: [
                    { item: 'stone_chunk', chance: 0.6, quantity: [2, 5] },
                    { item: 'golem_core', chance: 0.1, quantity: [1, 1] },
                    { item: 'mithril_ore', chance: 0.05, quantity: [1, 2] }
                ]
            },
            
            ghost: {
                name: 'Fantasma',
                icon: '👻',
                hp: 45,
                maxHp: 45,
                damage: 14,
                speed: 1.6,
                xp: 25,
                gold: 10,
                behavior: 'phasing',
                color: '#bdc3c7',
                size: 20,
                aggroRange: 220,
                ethereal: true, // Can pass through walls
                lifeDrain: 0.1, // 10% lifesteal
                drops: [
                    { item: 'ectoplasm', chance: 0.35, quantity: [1, 2] },
                    { item: 'soul_shard', chance: 0.1, quantity: [1, 1] }
                ]
            },
            
            bandit: {
                name: 'Bandido',
                icon: '🦹',
                hp: 70,
                maxHp: 70,
                damage: 13,
                speed: 1.4,
                xp: 22,
                gold: 15,
                behavior: 'tactical',
                color: '#34495e',
                size: 20,
                aggroRange: 280,
                fleeHealth: 0.3, // Flees at 30% health
                potionChance: 0.3,
                drops: [
                    { item: 'stolen_goods', chance: 0.4, quantity: [1, 3] },
                    { item: 'lockpick', chance: 0.25, quantity: [1, 2] },
                    { item: 'leather_armor', chance: 0.05, quantity: [1, 1] }
                ]
            },
            
            elemental: {
                name: 'Elemental de Fogo',
                icon: '🔥',
                hp: 80,
                maxHp: 80,
                damage: 18,
                speed: 1.3,
                xp: 35,
                gold: 18,
                behavior: 'caster',
                color: '#e67e22',
                size: 22,
                aggroRange: 350,
                auraDamage: 3,
                auraRadius: 50,
                fireballCooldown: 3000,
                drops: [
                    { item: 'fire_essence', chance: 0.4, quantity: [1, 2] },
                    { item: 'ember_stone', chance: 0.15, quantity: [1, 1] },
                    { item: 'flame_orb', chance: 0.08, quantity: [1, 1] }
                ]
            },
            
            // Elite Mobs
            eliteOrc: {
                name: 'Orc Elite',
                icon: '🐗',
                hp: 250,
                maxHp: 250,
                damage: 35,
                speed: 1,
                xp: 100,
                gold: 50,
                behavior: 'aggressive',
                color: '#c0392b',
                size: 30,
                aggroRange: 250,
                isElite: true,
                enrageHealth: 0.3,
                enrageMultiplier: 1.5,
                drops: [
                    { item: 'orc_chief_badge', chance: 0.5, quantity: [1, 1] },
                    { item: 'steel_ingot', chance: 0.3, quantity: [1, 3] },
                    { item: 'elite_weapon', chance: 0.15, quantity: [1, 1] }
                ]
            }
        };
    }
    
    setupMobBehaviors() {
        this.behaviors = {
            passive: (mob, player) => {
                // Only attack when attacked
                if (mob.target && !mob.isDead) {
                    this.moveTowards(mob, mob.target);
                }
            },
            
            aggressive: (mob, player) => {
                // Attack on sight
                const dist = this.getDistance(mob, player);
                if (dist <= mob.aggroRange && !mob.isDead) {
                    mob.target = player;
                    this.moveTowards(mob, player);
                }
            },
            
            pack: (mob, player) => {
                // Attack with pack bonus
                const dist = this.getDistance(mob, player);
                if (dist <= mob.aggroRange && !mob.isDead) {
                    mob.target = player;
                    const packMembers = this.getNearbyMobsOfSameType(mob, 100);
                    mob.damageMultiplier = 1 + (packMembers.length * mob.packBonus);
                    this.moveTowards(mob, player);
                }
            },
            
            ranged: (mob, player) => {
                // Keep distance and shoot
                const dist = this.getDistance(mob, player);
                if (dist <= mob.aggroRange && !mob.isDead) {
                    mob.target = player;
                    if (dist <= mob.attackRange) {
                        this.rangedAttack(mob, player);
                        // Kite - move away if too close
                        if (dist < mob.attackRange * 0.5) {
                            this.moveAway(mob, player);
                        }
                    } else {
                        this.moveTowards(mob, player);
                    }
                }
            },
            
            ambush: (mob, player) => {
                // Wait in stealth, attack when close
                const dist = this.getDistance(mob, player);
                if (dist <= mob.aggroRange && !mob.isDead) {
                    if (mob.stealth) {
                        mob.stealth = false;
                        mob.speed *= 2; // Burst of speed
                        this.game.showEffect('ambush', mob.x, mob.y);
                    }
                    mob.target = player;
                    this.moveTowards(mob, player);
                    
                    // Apply poison on hit
                    if (dist < 30 && Math.random() < 0.3) {
                        this.applyPoison(player, mob.poisonDamage, mob.poisonDuration);
                    }
                }
            },
            
            defensive: (mob, player) => {
                // Tanky, slow, high armor
                const dist = this.getDistance(mob, player);
                if (dist <= mob.aggroRange && !mob.isDead) {
                    mob.target = player;
                    // Only move if far enough
                    if (dist > 50) {
                        this.moveTowards(mob, player);
                    }
                    // Block chance
                    if (Math.random() < 0.3) {
                        mob.blocking = true;
                    }
                }
            },
            
            phasing: (mob, player) => {
                // Can pass through obstacles
                const dist = this.getDistance(mob, player);
                if (dist <= mob.aggroRange && !mob.isDead) {
                    mob.target = player;
                    mob.ethereal = true;
                    this.moveTowards(mob, player, true); // true = ignore obstacles
                    
                    // Life drain on attack
                    if (dist < 30 && mob.attackCooldown <= 0) {
                        const damage = this.attack(mob, player);
                        mob.hp = Math.min(mob.maxHp, mob.hp + damage * mob.lifeDrain);
                    }
                }
            },
            
            tactical: (mob, player) => {
                // Use potions, flee when low
                const dist = this.getDistance(mob, player);
                const healthPercent = mob.hp / mob.maxHp;
                
                if (dist <= mob.aggroRange && !mob.isDead) {
                    mob.target = player;
                    
                    // Flee if low health
                    if (healthPercent <= mob.fleeHealth) {
                        this.moveAway(mob, player);
                        // Try to use potion
                        if (Math.random() < mob.potionChance && !mob.usedPotion) {
                            mob.hp = Math.min(mob.maxHp, mob.hp + 30);
                            mob.usedPotion = true;
                            this.game.showFloatingText('+30', mob.x, mob.y - 30, '#2ecc71');
                        }
                    } else {
                        this.moveTowards(mob, player);
                    }
                }
            },
            
            caster: (mob, player) => {
                // Cast spells, keep distance
                const dist = this.getDistance(mob, player);
                if (dist <= mob.aggroRange && !mob.isDead) {
                    mob.target = player;
                    
                    // Aura damage
                    if (dist <= mob.auraRadius) {
                        player.hp -= mob.auraDamage;
                    }
                    
                    // Fireball attack
                    if (dist <= mob.aggroRange && mob.fireballCooldown <= 0) {
                        this.castFireball(mob, player);
                        mob.fireballCooldown = mob.fireballCooldown;
                    }
                    
                    // Keep optimal distance
                    if (dist < 150) {
                        this.moveAway(mob, player);
                    } else if (dist > 250) {
                        this.moveTowards(mob, player);
                    }
                }
            }
        };
    }
    
    spawnMob(type, x, y, isElite = false) {
        const mobTemplate = this.mobTypes[type];
        if (!mobTemplate) return null;
        
        const mob = {
            id: `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            x,
            y,
            ...mobTemplate,
            isElite,
            hp: isElite ? mobTemplate.hp * 2 : mobTemplate.hp,
            maxHp: isElite ? mobTemplate.hp * 2 : mobTemplate.hp,
            damage: isElite ? mobTemplate.damage * 1.5 : mobTemplate.damage,
            isDead: false,
            target: null,
            attackCooldown: 0,
            effects: [],
            usedPotion: false,
            blocking: false
        };
        
        if (isElite) {
            mob.name = `Elite ${mob.name}`;
            mob.size *= 1.2;
        }
        
        this.mobs.push(mob);
        return mob;
    }
    
    update(deltaTime, player) {
        // Update all mobs
        this.mobs.forEach(mob => {
            if (mob.isDead) return;
            
            // Update cooldowns
            if (mob.attackCooldown > 0) {
                mob.attackCooldown -= deltaTime;
            }
            if (mob.fireballCooldown > 0) {
                mob.fireballCooldown -= deltaTime;
            }
            
            // Apply behaviors
            const behavior = this.behaviors[mob.behavior];
            if (behavior) {
                behavior(mob, player);
            }
            
            // Check enrage for elites
            if (mob.isElite && mob.enrageHealth) {
                const healthPercent = mob.hp / mob.maxHp;
                if (healthPercent <= mob.enrageHealth && !mob.isEnraged) {
                    mob.isEnraged = true;
                    mob.damage *= mob.enrageMultiplier;
                    mob.speed *= 1.3;
                    this.game.showEffect('enrage', mob.x, mob.y);
                }
            }
            
            // Update effects
            this.updateEffects(mob, deltaTime);
        });
        
        // Remove dead mobs after delay
        this.mobs = this.mobs.filter(mob => {
            if (mob.isDead && (!mob.deathTime || Date.now() - mob.deathTime > 5000)) {
                return false;
            }
            return true;
        });
    }
    
    moveTowards(mob, target, ignoreObstacles = false) {
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            const moveX = (dx / dist) * mob.speed;
            const moveY = (dy / dist) * mob.speed;
            
            // Check collision unless ethereal
            if (!ignoreObstacles && !mob.ethereal) {
                if (!this.game.checkCollision(mob.x + moveX, mob.y)) {
                    mob.x += moveX;
                }
                if (!this.game.checkCollision(mob.x, mob.y + moveY)) {
                    mob.y += moveY;
                }
            } else {
                mob.x += moveX;
                mob.y += moveY;
            }
        }
    }
    
    moveAway(mob, target) {
        const dx = mob.x - target.x;
        const dy = mob.y - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            mob.x += (dx / dist) * mob.speed;
            mob.y += (dy / dist) * mob.speed;
        }
    }
    
    getDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getNearbyMobsOfSameType(mob, radius) {
        return this.mobs.filter(other => 
            other !== mob && 
            other.type === mob.type && 
            !other.isDead &&
            this.getDistance(mob, other) <= radius
        );
    }
    
    attack(mob, target) {
        if (mob.attackCooldown > 0) return 0;
        
        let damage = mob.damage * (mob.damageMultiplier || 1);
        
        // Apply armor reduction for defensive mobs
        if (mob.blocking) {
            damage *= 0.5;
            mob.blocking = false;
        }
        
        mob.attackCooldown = 1000; // 1 second cooldown
        return damage;
    }
    
    rangedAttack(mob, target) {
        if (mob.attackCooldown > 0) return;
        
        // Create projectile
        this.game.createProjectile({
            x: mob.x,
            y: mob.y,
            targetX: target.x,
            targetY: target.y,
            speed: 5,
            damage: mob.damage,
            owner: mob,
            type: mob.projectile || 'arrow'
        });
        
        mob.attackCooldown = 1500;
    }
    
    castFireball(mob, target) {
        this.game.createProjectile({
            x: mob.x,
            y: mob.y,
            targetX: target.x + (Math.random() - 0.5) * 50, // Some inaccuracy
            targetY: target.y + (Math.random() - 0.5) * 50,
            speed: 4,
            damage: mob.damage * 1.5,
            owner: mob,
            type: 'fireball',
            aoe: true,
            aoeRadius: 50
        });
    }
    
    applyPoison(target, damagePerTick, duration) {
        target.effects.push({
            type: 'poison',
            damage: damagePerTick,
            endTime: Date.now() + duration
        });
    }
    
    updateEffects(mob, deltaTime) {
        mob.effects = mob.effects.filter(effect => {
            if (Date.now() >= effect.endTime) {
                return false;
            }
            
            if (effect.type === 'poison') {
                mob.hp -= effect.damage * (deltaTime / 1000);
            }
            
            return true;
        });
    }
    
    takeDamage(mob, damage, attacker) {
        if (mob.isDead) return;
        
        // Apply armor
        if (mob.armor) {
            damage *= (1 - mob.armor);
        }
        
        mob.hp -= damage;
        mob.target = attacker; // Retaliate
        
        // Show damage number
        this.game.showFloatingText(Math.floor(damage), mob.x, mob.y - 20, '#e74c3c');
        
        if (mob.hp <= 0) {
            this.killMob(mob, attacker);
        }
    }
    
    killMob(mob, killer) {
        mob.isDead = true;
        mob.deathTime = Date.now();
        
        // Award XP and gold
        if (killer) {
            const xpGain = mob.xp * (mob.isElite ? 2 : 1);
            const goldGain = mob.gold * (mob.isElite ? 2 : 1);
            
            killer.addXP(xpGain);
            killer.gold += goldGain;
            
            this.game.showFloatingText(`+${xpGain} XP`, mob.x, mob.y - 40, '#3498db');
            this.game.showFloatingText(`+${goldGain} Gold`, mob.x, mob.y - 55, '#f1c40f');
        }
        
        // Generate drops
        this.generateDrops(mob);
        
        // Notify game
        this.game.onMobKilled(mob, killer);
    }
    
    generateDrops(mob) {
        if (!mob.drops) return;
        
        mob.drops.forEach(drop => {
            if (Math.random() <= drop.chance * (mob.isElite ? 1.5 : 1)) {
                const quantity = Array.isArray(drop.quantity) 
                    ? Math.floor(Math.random() * (drop.quantity[1] - drop.quantity[0] + 1)) + drop.quantity[0]
                    : drop.quantity;
                
                // Create loot drop in game
                this.game.createLootDrop({
                    x: mob.x + (Math.random() - 0.5) * 40,
                    y: mob.y + (Math.random() - 0.5) * 40,
                    item: {
                        id: drop.item,
                        name: this.getItemName(drop.item),
                        quantity,
                        rarity: this.getItemRarity(drop.item)
                    }
                });
            }
        });
    }
    
    getItemName(itemId) {
        const names = {
            slime_gel: 'Gel de Slime',
            goblin_ear: 'Orelha de Goblin',
            wolf_fang: 'Presa de Lobo',
            orc_tooth: 'Dente de Orc',
            bone: 'Osso',
            spider_silk: 'Seda de Aranha',
            stone_chunk: 'Pedaço de Pedra',
            ectoplasm: 'Ectoplasma',
            fire_essence: 'Essência de Fogo',
            small_potion: 'Poção Pequena',
            rusty_dagger: 'Adaga Enferrujada',
            wolf_pelt: 'Pele de Lobo',
            meat: 'Carne',
            iron_ore: 'Minério de Ferro',
            ancient_coin: 'Moeda Antiga',
            venom_sac: 'Bolsa de Veneno',
            golem_core: 'Núcleo de Golem',
            mithril_ore: 'Minério de Mithril',
            soul_shard: 'Fragmento de Alma',
            ember_stone: 'Pedra em Brasa',
            flame_orb: 'Orbe de Chama',
            stolen_goods: 'Bens Roubados',
            lockpick: 'Gazua',
            leather_armor: 'Armadura de Couro',
            orc_chief_badge: 'Insígnia de Chefe Orc',
            steel_ingot: 'Lingote de Aço',
            elite_weapon: 'Arma de Elite'
        };
        return names[itemId] || itemId;
    }
    
    getItemRarity(itemId) {
        const rarities = {
            small_potion: 'common',
            rusty_dagger: 'common',
            meat: 'common',
            bone: 'common',
            stone_chunk: 'common',
            goblin_ear: 'common',
            slime_gel: 'common',
            
            wolf_fang: 'uncommon',
            orc_tooth: 'uncommon',
            spider_silk: 'uncommon',
            iron_ore: 'uncommon',
            lockpick: 'uncommon',
            stolen_goods: 'uncommon',
            
            wolf_pelt: 'rare',
            venom_sac: 'rare',
            ancient_coin: 'rare',
            ectoplasm: 'rare',
            fire_essence: 'rare',
            leather_armor: 'rare',
            
            golem_core: 'epic',
            ember_stone: 'epic',
            soul_shard: 'epic',
            orc_chief_badge: 'epic',
            steel_ingot: 'epic',
            
            mithril_ore: 'legendary',
            flame_orb: 'legendary',
            elite_weapon: 'legendary'
        };
        return rarities[itemId] || 'common';
    }
    
    startSpawnLoops() {
        // Spawn different mob types in different zones
        const spawnConfigs = [
            { type: 'slime', interval: 5000, maxCount: 5, zones: ['forest'] },
            { type: 'goblin', interval: 8000, maxCount: 4, zones: ['forest', 'cave'] },
            { type: 'wolf', interval: 10000, maxCount: 3, zones: ['forest'] },
            { type: 'orc', interval: 12000, maxCount: 3, zones: ['cave'] },
            { type: 'skeleton', interval: 15000, maxCount: 4, zones: ['dungeon'] },
            { type: 'spider', interval: 10000, maxCount: 4, zones: ['cave', 'dungeon'] },
            { type: 'golem', interval: 30000, maxCount: 2, zones: ['cave', 'mountain'] },
            { type: 'ghost', interval: 20000, maxCount: 3, zones: ['dungeon', 'graveyard'] },
            { type: 'bandit', interval: 15000, maxCount: 3, zones: ['forest', 'road'] },
            { type: 'elemental', interval: 25000, maxCount: 2, zones: ['mountain', 'volcano'] }
        ];
        
        spawnConfigs.forEach(config => {
            this.spawnTimers[config.type] = setInterval(() => {
                const currentCount = this.mobs.filter(m => m.type === config.type && !m.isDead).length;
                if (currentCount < config.maxCount) {
                    this.spawnInZone(config.type, config.zones);
                }
            }, config.interval);
        });
    }
    
    spawnInZone(type, zones) {
        // Get random zone and position
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const pos = this.game.getRandomPositionInZone(zone);
        
        if (pos) {
            this.spawnMob(type, pos.x, pos.y);
        }
    }
    
    render(ctx) {
        this.mobs.forEach(mob => {
            if (mob.isDead) return;
            
            // Apply culling
            if (this.game.isOnScreen && !this.game.isOnScreen(mob.x, mob.y, 50)) return;
            
            // Render mob
            ctx.save();
            
            // Elite aura
            if (mob.isElite) {
                ctx.beginPath();
                ctx.arc(mob.x, mob.y, mob.size + 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.fill();
            }
            
            // Enrage effect
            if (mob.isEnraged) {
                ctx.beginPath();
                ctx.arc(mob.x, mob.y, mob.size + 8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
                ctx.fill();
            }
            
            // Mob body
            ctx.beginPath();
            ctx.arc(mob.x, mob.y, mob.size, 0, Math.PI * 2);
            ctx.fillStyle = mob.color;
            ctx.fill();
            ctx.strokeStyle = mob.isElite ? '#ffd700' : '#2c3e50';
            ctx.lineWidth = mob.isElite ? 3 : 2;
            ctx.stroke();
            
            // Icon
            ctx.font = `${mob.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(mob.icon, mob.x, mob.y);
            
            // Health bar
            const barWidth = mob.size * 2;
            const barHeight = 6;
            const hpPercent = mob.hp / mob.maxHp;
            
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(mob.x - barWidth/2, mob.y - mob.size - 15, barWidth, barHeight);
            
            ctx.fillStyle = hpPercent > 0.5 ? '#27ae60' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
            ctx.fillRect(mob.x - barWidth/2, mob.y - mob.size - 15, barWidth * hpPercent, barHeight);
            
            // Name
            ctx.fillStyle = '#ecf0f1';
            ctx.font = '12px Arial';
            ctx.fillText(mob.name, mob.x, mob.y - mob.size - 20);
            
            // Elite badge
            if (mob.isElite) {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 10px Arial';
                ctx.fillText('★ ELITE', mob.x, mob.y - mob.size - 32);
            }
            
            // Stealth indicator
            if (mob.stealth) {
                ctx.globalAlpha = 0.3;
            }
            
            ctx.restore();
        });
    }
    
    cleanup() {
        Object.values(this.spawnTimers).forEach(timer => clearInterval(timer));
        this.mobs = [];
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedMobSystem;
} else {
    window.AdvancedMobSystem = AdvancedMobSystem;
}
