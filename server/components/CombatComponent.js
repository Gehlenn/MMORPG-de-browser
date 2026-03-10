/**
 * Combat Component
 * Defines combat attributes for entities
 */

class CombatComponent {
    constructor(attack = 10, defense = 5) {
        this.attack = attack;
        this.defense = defense;
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 100;
        this.criticalChance = 0.1; // 10% chance
        this.criticalMultiplier = 2.0;
        this.attackSpeed = 1.0; // Attacks per second
        this.lastAttackTime = 0;
        this.attackRange = 1.0; // Range in tiles
        this.damageType = 'physical'; // physical, magical, fire, ice, etc.
        this.resistances = {
            physical: 0,
            magical: 0,
            fire: 0,
            ice: 0,
            poison: 0
        };
        this.statusEffects = new Map(); // Map<effectName, {duration, startTime}>
    }

    /**
     * Set combat stats
     * @param {number} attack - Attack power
     * @param {number} defense - Defense value
     */
    setStats(attack, defense) {
        this.attack = Math.max(1, attack);
        this.defense = Math.max(0, defense);
    }

    /**
     * Calculate damage against target
     * @param {number} targetDefense - Target defense
     * @param {number} currentTime - Current timestamp
     * @returns {object} - Damage calculation result
     */
    calculateDamage(targetDefense, currentTime = Date.now()) {
        // Check attack cooldown
        const attackCooldown = 1000 / this.attackSpeed; // milliseconds
        if (currentTime - this.lastAttackTime < attackCooldown) {
            return { damage: 0, isCritical: false, canAttack: false };
        }

        // Base damage calculation
        let baseDamage = Math.max(1, this.attack - targetDefense);
        
        // Critical hit chance
        const isCritical = Math.random() < this.criticalChance;
        if (isCritical) {
            baseDamage *= this.criticalMultiplier;
        }

        // Update last attack time
        this.lastAttackTime = currentTime;

        return {
            damage: Math.round(baseDamage),
            isCritical,
            canAttack: true
        };
    }

    /**
     * Take damage with resistance calculation
     * @param {number} damage - Base damage
     * @param {string} damageType - Type of damage
     * @returns {number} - Actual damage after resistance
     */
    calculateDamageTaken(damage, damageType = 'physical') {
        const resistance = this.resistances[damageType] || 0;
        const damageReduction = damage * (resistance / 100);
        return Math.max(1, damage - damageReduction);
    }

    /**
     * Set level
     * @param {number} level - New level
     */
    setLevel(level) {
        this.level = Math.max(1, level);
        this.experienceToNext = this.calculateExperienceToNext(level);
    }

    /**
     * Add experience
     * @param {number} amount - Experience amount
     * @returns {boolean} - True if leveled up
     */
    addExperience(amount) {
        this.experience += amount;
        let leveledUp = false;

        while (this.experience >= this.experienceToNext) {
            this.experience -= this.experienceToNext;
            this.levelUp();
            leveledUp = true;
        }

        return leveledUp;
    }

    /**
     * Level up entity
     */
    levelUp() {
        this.level++;
        this.experienceToNext = this.calculateExperienceToNext(this.level);
        
        // Improve stats on level up
        this.attack += Math.floor(this.attack * 0.1);
        this.defense += Math.floor(this.defense * 0.1);
        
        console.log(`Leveled up to ${this.level}! Attack: ${this.attack}, Defense: ${this.defense}`);
    }

    /**
     * Calculate experience needed for next level
     * @param {number} level - Current level
     * @returns {number} - Experience needed
     */
    calculateExperienceToNext(level) {
        return Math.floor(100 * Math.pow(1.2, level - 1));
    }

    /**
     * Set resistance
     * @param {string} damageType - Damage type
     * @param {number} percentage - Resistance percentage (0-100)
     */
    setResistance(damageType, percentage) {
        this.resistances[damageType] = Math.max(0, Math.min(100, percentage));
    }

    /**
     * Add status effect
     * @param {string} effectName - Name of effect
     * @param {number} duration - Duration in milliseconds
     */
    addStatusEffect(effectName, duration) {
        this.statusEffects.set(effectName, {
            duration,
            startTime: Date.now()
        });
    }

    /**
     * Remove status effect
     * @param {string} effectName - Name of effect
     * @returns {boolean} - True if effect was removed
     */
    removeStatusEffect(effectName) {
        return this.statusEffects.delete(effectName);
    }

    /**
     * Update status effects
     * @param {number} currentTime - Current timestamp
     * @returns {string[]} - Array of expired effects
     */
    updateStatusEffects(currentTime = Date.now()) {
        const expiredEffects = [];

        for (const [effectName, effect] of this.statusEffects) {
            if (currentTime - effect.startTime >= effect.duration) {
                expiredEffects.push(effectName);
            }
        }

        // Remove expired effects
        for (const effectName of expiredEffects) {
            this.statusEffects.delete(effectName);
        }

        return expiredEffects;
    }

    /**
     * Check if has status effect
     * @param {string} effectName - Name of effect
     * @returns {boolean} - True if has effect
     */
    hasStatusEffect(effectName) {
        return this.statusEffects.has(effectName);
    }

    /**
     * Get experience percentage
     * @returns {number} - Experience percentage (0-100)
     */
    getExperiencePercentage() {
        return (this.experience / this.experienceToNext) * 100;
    }

    /**
     * Clone combat component
     * @returns {CombatComponent} - Cloned component
     */
    clone() {
        const cloned = new CombatComponent(this.attack, this.defense);
        cloned.level = this.level;
        cloned.experience = this.experience;
        cloned.experienceToNext = this.experienceToNext;
        cloned.criticalChance = this.criticalChance;
        cloned.criticalMultiplier = this.criticalMultiplier;
        cloned.attackSpeed = this.attackSpeed;
        cloned.attackRange = this.attackRange;
        cloned.damageType = this.damageType;
        cloned.resistances = { ...this.resistances };
        cloned.statusEffects = new Map(this.statusEffects);
        return cloned;
    }

    /**
     * Serialize to object
     * @returns {object} - Serialized data
     */
    serialize() {
        return {
            attack: this.attack,
            defense: this.defense,
            level: this.level,
            experience: this.experience,
            experienceToNext: this.experienceToNext,
            criticalChance: this.criticalChance,
            criticalMultiplier: this.criticalMultiplier,
            attackSpeed: this.attackSpeed,
            attackRange: this.attackRange,
            damageType: this.damageType,
            resistances: { ...this.resistances },
            statusEffects: Array.from(this.statusEffects.entries())
        };
    }

    /**
     * Deserialize from object
     * @param {object} data - Serialized data
     */
    deserialize(data) {
        this.attack = data.attack || 10;
        this.defense = data.defense || 5;
        this.level = data.level || 1;
        this.experience = data.experience || 0;
        this.experienceToNext = data.experienceToNext || 100;
        this.criticalChance = data.criticalChance || 0.1;
        this.criticalMultiplier = data.criticalMultiplier || 2.0;
        this.attackSpeed = data.attackSpeed || 1.0;
        this.attackRange = data.attackRange || 1.0;
        this.damageType = data.damageType || 'physical';
        this.resistances = data.resistances || { physical: 0, magical: 0, fire: 0, ice: 0, poison: 0 };
        this.statusEffects = new Map(data.statusEffects || []);
        this.lastAttackTime = 0;
    }
}

module.exports = CombatComponent;
