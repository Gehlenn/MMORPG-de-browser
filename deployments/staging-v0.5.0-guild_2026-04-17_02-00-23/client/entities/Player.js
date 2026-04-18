/**
 * Player Entity Class
 * Represents the player character with advanced systems
 */

import Entity from './Entity.js';

class Player extends Entity {
    constructor(config = {}) {
        super({
            type: 'player',
            color: '#4ade80',
            solid: true,
            blocking: true,
            interactive: false,
            ...config
        });
        
        // Player-specific properties
        this.userId = config.userId || null;
        this.username = config.username || 'Player';
        this.email = config.email || '';
        
        // Character creation
        this.race = config.race || 'human';
        this.baseClass = config.baseClass || 'warrior';
        this.className = config.className || 'Apprentice';
        
        // Attributes (STR, AGI, INT, VIT, DEX, WIS)
        this.attributes = {
            str: config.str || 10,
            agi: config.agi || 10,
            int: config.int || 10,
            vit: config.vit || 10,
            dex: config.dex || 10,
            wis: config.wis || 10
        };
        
        this.attributePoints = config.attributePoints || 0;
        
        // Advanced stats
        this.critChance = config.critChance || 0.05;
        this.critDamage = config.critDamage || 1.5;
        this.attackSpeed = config.attackSpeed || 1.0;
        this.castSpeed = config.castSpeed || 1.0;
        this.movementSpeed = config.movementSpeed || 1.0;
        
        // Resources
        this.mana = config.mana || 100;
        this.maxMana = config.maxMana || 100;
        this.stamina = config.stamina || 100;
        this.maxStamina = config.maxStamina || 100;
        
        // Economy
        this.gold = config.gold || 0;
        this.silver = config.silver || 0;
        this.copper = config.copper || 0;
        
        // Inventory and equipment
        this.inventory = config.inventory || [];
        this.equipment = {
            weapon: null,
            armor: null,
            helmet: null,
            gloves: null,
            boots: null,
            accessory1: null,
            accessory2: null
        };
        
        this.inventorySize = config.inventorySize || 30;
        
        // Skills
        this.skills = config.skills || [];
        this.skillPoints = config.skillPoints || 0;
        this.cooldowns = new Map();
        
        // Quests and achievements
        this.quests = config.quests || [];
        this.achievements = config.achievements || [];
        this.achievementPoints = config.achievementPoints || 0;
        
        // Statistics
        this.stats = {
            monstersKilled: config.monstersKilled || 0,
            playersKilled: config.playersKilled || 0,
            deaths: config.deaths || 0,
            questsCompleted: config.questsCompleted || 0,
            itemsCrafted: config.itemsCrafted || 0,
            dungeonsCompleted: config.dungeonsCompleted || 0,
            playTime: config.playTime || 0,
            distanceTraveled: config.distanceTraveled || 0,
            damageDealt: config.damageDealt || 0,
            damageTaken: config.damageTaken || 0,
            healingDone: config.healingDone || 0
        };
        
        // Social
        this.guild = config.guild || null;
        this.party = config.party || null;
        this.friends = config.friends || [];
        this.ignoreList = config.ignoreList || [];
        
        // Titles and cosmetics
        this.currentTitle = config.currentTitle || null;
        this.unlockedTitles = config.unlockedTitles || [];
        this.cosmetics = config.cosmetics || [];
        
        // World exploration
        this.exploredAreas = config.exploredAreas || new Set();
        this.discoveredPortals = config.discoveredPortals || [];
        this.unlockedFastTravel = config.unlockedFastTravel || [];
        
        // Combat state
        this.inCombat = false;
        this.combatTarget = null;
        this.autoAttack = false;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 1 second base cooldown
        
        // State tracking
        this.lastPosition = { x: this.x, y: this.y };
        this.sessionStartTime = Date.now();
        
        // Initialize
        this.calculateDerivedStats();
        this.setupEventHandlers();
    }
    
    initialize() {
        super.initialize();
        this.updateClassName();
    }
    
    calculateDerivedStats() {
        // Calculate stats based on attributes, equipment, and level
        const baseStats = this.getBaseStatsFromAttributes();
        const equipmentStats = this.getEquipmentStats();
        const levelStats = this.getLevelStats();
        
        // Health
        this.maxHealth = baseStats.health + equipmentStats.health + levelStats.health;
        this.health = Math.min(this.health, this.maxHealth);
        
        // Mana
        this.maxMana = baseStats.mana + equipmentStats.mana + levelStats.mana;
        this.mana = Math.min(this.mana, this.maxMana);
        
        // Stamina
        this.maxStamina = baseStats.stamina + equipmentStats.stamina + levelStats.stamina;
        this.stamina = Math.min(this.stamina, this.maxStamina);
        
        // Combat stats
        this.attack = baseStats.attack + equipmentStats.attack + levelStats.attack;
        this.defense = baseStats.defense + equipmentStats.defense + levelStats.defense;
        this.critChance = Math.min(0.95, baseStats.critChance + equipmentStats.critChance);
        this.critDamage = baseStats.critDamage + equipmentStats.critDamage;
        this.attackSpeed = Math.min(3.0, baseStats.attackSpeed + equipmentStats.attackSpeed);
        this.castSpeed = Math.min(3.0, baseStats.castSpeed + equipmentStats.castSpeed);
    }
    
    getBaseStatsFromAttributes() {
        const vit = this.attributes.vit;
        const str = this.attributes.str;
        const agi = this.attributes.agi;
        const dex = this.attributes.dex;
        const int = this.attributes.int;
        const wis = this.attributes.wis;
        
        return {
            health: 100 + vit * 10,
            mana: 50 + int * 5 + wis * 3,
            stamina: 100 + vit * 5 + agi * 3,
            attack: str * 2 + dex * 1,
            defense: vit * 1 + agi * 0.5,
            critChance: agi * 0.002 + dex * 0.001,
            critDamage: 1.5 + str * 0.01,
            attackSpeed: 1.0 + agi * 0.01,
            castSpeed: 1.0 + int * 0.01 + wis * 0.005
        };
    }
    
    getEquipmentStats() {
        let stats = {
            health: 0, mana: 0, stamina: 0,
            attack: 0, defense: 0,
            critChance: 0, critDamage: 0,
            attackSpeed: 0, castSpeed: 0
        };
        
        for (const [slot, itemId] of Object.entries(this.equipment)) {
            if (itemId && this.world && this.world.itemSystem) {
                const item = this.world.itemSystem.getItem(itemId);
                if (item && item.stats) {
                    for (const [stat, value] of Object.entries(item.stats)) {
                        if (stats.hasOwnProperty(stat)) {
                            stats[stat] += value;
                        }
                    }
                }
            }
        }
        
        return stats;
    }
    
    getLevelStats() {
        return {
            health: this.level * 12,
            mana: this.level * 6,
            stamina: this.level * 8,
            attack: this.level * 2,
            defense: this.level * 1
        };
    }
    
    updateClassName() {
        // Update class name based on level and base class
        if (this.level >= 50) {
            // Advanced classes
            this.className = this.getAdvancedClassName();
        } else if (this.level >= 30) {
            // Tier 2 classes
            this.className = this.getTier2ClassName();
        } else if (this.level >= 10) {
            // Base classes
            this.className = this.getBaseClassName();
        } else {
            // Apprentice
            this.className = 'Apprentice';
        }
    }
    
    getBaseClassName() {
        const classMap = {
            warrior: 'Warrior',
            mage: 'Mage',
            hunter: 'Hunter',
            rogue: 'Rogue',
            priest: 'Priest',
            druid: 'Druid'
        };
        return classMap[this.baseClass] || 'Adventurer';
    }
    
    getTier2ClassName() {
        const tier2Map = {
            warrior: ['Knight', 'Berserker'],
            mage: ['Wizard', 'Elementalist'],
            hunter: ['Ranger', 'Beast Master'],
            rogue: ['Assassin', 'Ninja'],
            priest: ['Cleric', 'Paladin'],
            druid: ['Shaman', 'Nature Guardian']
        };
        
        const classes = tier2Map[this.baseClass] || ['Adventurer'];
        return classes[Math.floor(this.level / 20) % classes.length];
    }
    
    getAdvancedClassName() {
        const advancedMap = {
            warrior: ['Lord', 'Champion', 'Guardian', 'Warlord'],
            mage: ['Archmage', 'Battle Mage', 'Chronomancer', 'Necromancer'],
            hunter: ['Marksman', 'Beast Lord', 'Shadow Hunter', 'Wind Walker'],
            rogue: ['Master Assassin', 'Shadow Master', 'Blade Dancer', 'Phantom'],
            priest: ['High Priest', 'Holy Paladin', 'Divine Champion', 'Light Bringer'],
            druid: ['Archdruid', 'Elemental Lord', 'Nature Master', 'Storm Caller']
        };
        
        const classes = advancedMap[this.baseClass] || ['Master Adventurer'];
        return classes[Math.floor(this.level / 15) % classes.length];
    }
    
    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);
        
        // Update play time
        this.stats.playTime += deltaTime;
        
        // Update distance traveled
        if (this.lastPosition.x !== this.x || this.lastPosition.y !== this.y) {
            const distance = Math.sqrt(
                Math.pow(this.x - this.lastPosition.x, 2) +
                Math.pow(this.y - this.lastPosition.y, 2)
            );
            this.stats.distanceTraveled += distance;
            this.lastPosition = { x: this.x, y: this.y };
        }
        
        // Update cooldowns
        this.updateCooldowns(deltaTime);
        
        // Regenerate resources
        this.regenerateResources(deltaTime);
        
        // Auto attack
        if (this.autoAttack && this.inCombat && this.combatTarget) {
            this.tryAutoAttack();
        }
    }
    
    updateCooldowns(deltaTime) {
        for (const [skillId, endTime] of this.cooldowns.entries()) {
            if (Date.now() >= endTime) {
                this.cooldowns.delete(skillId);
            }
        }
    }
    
    regenerateResources(deltaTime) {
        const regenRate = deltaTime / 1000; // Convert to seconds
        
        // Health regeneration (out of combat only)
        if (!this.inCombat && this.health < this.maxHealth) {
            const healthRegen = this.maxHealth * 0.01 * regenRate; // 1% per second
            this.heal(healthRegen);
        }
        
        // Mana regeneration
        if (this.mana < this.maxMana) {
            const manaRegen = this.maxMana * 0.02 * regenRate; // 2% per second
            this.mana = Math.min(this.maxMana, this.mana + manaRegen);
        }
        
        // Stamina regeneration
        if (this.stamina < this.maxStamina) {
            const staminaRegen = this.maxMana * 0.05 * regenRate; // 5% per second
            this.stamina = Math.min(this.maxStamina, this.stamina + staminaRegen);
        }
    }
    
    tryAutoAttack() {
        const now = Date.now();
        const cooldown = this.attackCooldown / this.attackSpeed;
        
        if (now - this.lastAttackTime >= cooldown) {
            this.performAttack(this.combatTarget);
            this.lastAttackTime = now;
        }
    }
    
    performAttack(target) {
        if (!target || !target.alive) return;
        
        // Calculate damage
        let damage = this.attack;
        
        // Check for critical hit
        const isCrit = Math.random() < this.critChance;
        if (isCrit) {
            damage *= this.critDamage;
        }
        
        // Apply damage
        const actualDamage = target.takeDamage(damage, this.id, 'physical');
        
        // Update stats
        this.stats.damageDealt += actualDamage;
        
        // Emit events
        this.emit('attack', { target, damage: actualDamage, critical: isCrit });
        
        return actualDamage;
    }
    
    useSkill(skillId, target = null) {
        // Check cooldown
        if (this.cooldowns.has(skillId)) {
            return { success: false, reason: 'cooldown' };
        }
        
        // Get skill data
        const skill = this.getSkill(skillId);
        if (!skill) {
            return { success: false, reason: 'not_found' };
        }
        
        // Check mana cost
        if (this.mana < skill.manaCost) {
            return { success: false, reason: 'no_mana' };
        }
        
        // Check range
        if (target && this.getDistanceTo(target) > skill.range) {
            return { success: false, reason: 'out_of_range' };
        }
        
        // Use skill
        this.mana -= skill.manaCost;
        
        // Set cooldown
        const cooldownMs = skill.cooldown * 1000;
        this.cooldowns.set(skillId, Date.now() + cooldownMs);
        
        // Execute skill effect
        const result = this.executeSkill(skill, target);
        
        this.emit('skill_used', { skill, target, result });
        
        return { success: true, result };
    }
    
    getSkill(skillId) {
        return this.skills.find(s => s.id === skillId);
    }
    
    executeSkill(skill, target) {
        // This would be implemented by the skill system
        return { damage: 0, effects: [] };
    }
    
    // Inventory management
    addToInventory(itemId, amount = 1) {
        if (this.inventory.length >= this.inventorySize) {
            return false;
        }
        
        for (let i = 0; i < amount; i++) {
            this.inventory.push(itemId);
        }
        
        this.emit('item_added', { itemId, amount });
        return true;
    }
    
    removeFromInventory(itemId, amount = 1) {
        let removed = 0;
        
        for (let i = this.inventory.length - 1; i >= 0 && removed < amount; i--) {
            if (this.inventory[i] === itemId) {
                this.inventory.splice(i, 1);
                removed++;
            }
        }
        
        if (removed > 0) {
            this.emit('item_removed', { itemId, amount: removed });
        }
        
        return removed;
    }
    
    hasItem(itemId, amount = 1) {
        let count = 0;
        for (const item of this.inventory) {
            if (item === itemId) {
                count++;
                if (count >= amount) return true;
            }
        }
        return false;
    }
    
    getItemCount(itemId) {
        let count = 0;
        for (const item of this.inventory) {
            if (item === itemId) count++;
        }
        return count;
    }
    
    equipItem(itemId, slot) {
        if (!this.equipment.hasOwnProperty(slot)) {
            return false;
        }
        
        if (!this.hasItem(itemId)) {
            return false;
        }
        
        // Unequip current item
        const currentItem = this.equipment[slot];
        if (currentItem) {
            this.addToInventory(currentItem);
        }
        
        // Equip new item
        this.removeFromInventory(itemId);
        this.equipment[slot] = itemId;
        
        // Recalculate stats
        this.calculateDerivedStats();
        
        this.emit('item_equipped', { itemId, slot });
        return true;
    }
    
    unequipItem(slot) {
        if (!this.equipment.hasOwnProperty(slot)) {
            return false;
        }
        
        const item = this.equipment[slot];
        if (!item) {
            return false;
        }
        
        if (this.addToInventory(item)) {
            this.equipment[slot] = null;
            this.calculateDerivedStats();
            
            this.emit('item_unequipped', { itemId: item, slot });
            return true;
        }
        
        return false;
    }
    
    // Experience and leveling
    addExperience(amount) {
        this.experience += amount;
        
        const requiredExp = this.getExperienceForNextLevel();
        if (this.experience >= requiredExp) {
            this.levelUp();
        }
        
        this.emit('experience_gained', { amount });
    }
    
    getExperienceForNextLevel() {
        return Math.floor(100 * Math.pow(1.1, this.level - 1));
    }
    
    levelUp() {
        const requiredExp = this.getExperienceForNextLevel();
        this.experience -= requiredExp;
        this.level++;
        
        // Award attribute points
        this.attributePoints += 3;
        this.skillPoints += 1;
        
        // Update class name
        this.updateClassName();
        
        // Recalculate stats
        this.calculateDerivedStats();
        
        // Full heal
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        this.stamina = this.maxStamina;
        
        this.emit('level_up', { level: this.level });
    }
    
    // Attribute management
    allocateAttribute(attribute, points) {
        if (!this.attributes.hasOwnProperty(attribute)) {
            return false;
        }
        
        if (this.attributePoints < points) {
            return false;
        }
        
        this.attributes[attribute] += points;
        this.attributePoints -= points;
        
        // Recalculate stats
        this.calculateDerivedStats();
        
        this.emit('attribute_allocated', { attribute, points });
        return true;
    }
    
    // Override death method
    die(source = 'unknown') {
        super.die(source);
        
        this.stats.deaths++;
        
        // Death penalty
        this.experience = Math.max(0, this.experience - Math.floor(this.getExperienceForNextLevel() * 0.1));
        
        // Clear combat state
        this.inCombat = false;
        this.combatTarget = null;
        this.autoAttack = false;
        
        this.emit('player_death', { source });
    }
    
    // Override revive method
    revive(health = null) {
        super.revive(health);
        
        // Clear negative status effects
        this.statusEffects = this.statusEffects.filter(effect => 
            effect.type === 'buff' || effect.type === 'healing'
        );
        
        this.emit('player_revive');
    }
    
    setupEventHandlers() {
        this.on('damage', (data) => {
            this.stats.damageTaken += data.amount;
        });
        
        this.on('heal', (data) => {
            this.stats.healingDone += data.amount;
        });
        
        this.on('move', (data) => {
            // Track exploration
            const areaKey = `${Math.floor(data.x / 10)},${Math.floor(data.y / 10)}`;
            this.exploredAreas.add(areaKey);
        });
    }
    
    // Serialization
    serialize() {
        const baseData = super.serialize();
        
        return {
            ...baseData,
            userId: this.userId,
            username: this.username,
            email: this.email,
            race: this.race,
            baseClass: this.baseClass,
            className: this.className,
            attributes: this.attributes,
            attributePoints: this.attributePoints,
            critChance: this.critChance,
            critDamage: this.critDamage,
            attackSpeed: this.attackSpeed,
            castSpeed: this.castSpeed,
            movementSpeed: this.movementSpeed,
            mana: this.mana,
            maxMana: this.maxMana,
            stamina: this.stamina,
            maxStamina: this.maxStamina,
            gold: this.gold,
            silver: this.silver,
            copper: this.copper,
            inventory: this.inventory,
            equipment: this.equipment,
            inventorySize: this.inventorySize,
            skills: this.skills,
            skillPoints: this.skillPoints,
            quests: this.quests,
            achievements: this.achievements,
            achievementPoints: this.achievementPoints,
            stats: this.stats,
            guild: this.guild,
            party: this.party,
            friends: this.friends,
            ignoreList: this.ignoreList,
            currentTitle: this.currentTitle,
            unlockedTitles: this.unlockedTitles,
            cosmetics: this.cosmetics,
            exploredAreas: Array.from(this.exploredAreas),
            discoveredPortals: this.discoveredPortals,
            unlockedFastTravel: this.unlockedFastTravel,
            sessionStartTime: this.sessionStartTime
        };
    }
    
    deserialize(data) {
        super.deserialize(data);
        
        this.userId = data.userId;
        this.username = data.username;
        this.email = data.email;
        this.race = data.race;
        this.baseClass = data.baseClass;
        this.className = data.className;
        this.attributes = data.attributes;
        this.attributePoints = data.attributePoints;
        this.critChance = data.critChance;
        this.critDamage = data.critDamage;
        this.attackSpeed = data.attackSpeed;
        this.castSpeed = data.castSpeed;
        this.movementSpeed = data.movementSpeed;
        this.mana = data.mana;
        this.maxMana = data.maxMana;
        this.stamina = data.stamina;
        this.maxStamina = data.maxStamina;
        this.gold = data.gold;
        this.silver = data.silver;
        this.copper = data.copper;
        this.inventory = data.inventory;
        this.equipment = data.equipment;
        this.inventorySize = data.inventorySize;
        this.skills = data.skills;
        this.skillPoints = data.skillPoints;
        this.quests = data.quests;
        this.achievements = data.achievements;
        this.achievementPoints = data.achievementPoints;
        this.stats = data.stats;
        this.guild = data.guild;
        this.party = data.party;
        this.friends = data.friends;
        this.ignoreList = data.ignoreList;
        this.currentTitle = data.currentTitle;
        this.unlockedTitles = data.unlockedTitles;
        this.cosmetics = data.cosmetics;
        this.exploredAreas = new Set(data.exploredAreas || []);
        this.discoveredPortals = data.discoveredPortals || [];
        this.unlockedFastTravel = data.unlockedFastTravel || [];
        this.sessionStartTime = data.sessionStartTime;
        
        // Recalculate derived stats
        this.calculateDerivedStats();
    }
}

export default Player;
