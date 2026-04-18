/**
 * Health Component
 * Manages health points for entities
 */

class HealthComponent {
    constructor(hp = 100, maxHp = 100) {
        this.hp = hp;
        this.maxHp = maxHp;
        this.regeneration = 0; // HP per second
        this.lastRegenTime = Date.now();
        this.isDead = false;
        this.invulnerable = false;
        this.invulnerableUntil = 0;
    }

    /**
     * Set health values
     * @param {number} hp - Current health
     * @param {number} maxHp - Maximum health
     */
    set(hp, maxHp) {
        this.hp = Math.max(0, Math.min(hp, maxHp));
        this.maxHp = maxHp;
        this.checkDeath();
    }

    /**
     * Heal entity
     * @param {number} amount - Amount to heal
     * @returns {number} - Actual amount healed
     */
    heal(amount) {
        if (this.isDead) return 0;
        
        const oldHp = this.hp;
        this.hp = Math.min(this.hp + amount, this.maxHp);
        return this.hp - oldHp;
    }

    /**
     * Damage entity
     * @param {number} amount - Amount of damage
     * @param {number} currentTime - Current timestamp
     * @returns {number} - Actual damage dealt
     */
    damage(amount, currentTime = Date.now()) {
        if (this.isDead) return 0;
        
        // Check invulnerability
        if (this.invulnerable && currentTime < this.invulnerableUntil) {
            return 0;
        }
        
        const oldHp = this.hp;
        this.hp = Math.max(0, this.hp - amount);
        const actualDamage = oldHp - this.hp;
        
        this.checkDeath();
        return actualDamage;
    }

    /**
     * Set invulnerability
     * @param {boolean} invulnerable - Invulnerable state
     * @param {number} duration - Duration in milliseconds
     */
    setInvulnerable(invulnerable, duration = 0) {
        this.invulnerable = invulnerable;
        if (invulnerable && duration > 0) {
            this.invulnerableUntil = Date.now() + duration;
        } else {
            this.invulnerableUntil = 0;
        }
    }

    /**
     * Set regeneration rate
     * @param {number} regeneration - HP per second
     */
    setRegeneration(regeneration) {
        this.regeneration = regeneration;
    }

    /**
     * Update regeneration
     * @param {number} currentTime - Current timestamp
     */
    updateRegeneration(currentTime = Date.now()) {
        if (this.isDead || this.regeneration <= 0) return;
        
        const deltaTime = (currentTime - this.lastRegenTime) / 1000; // Convert to seconds
        const regenAmount = this.regeneration * deltaTime;
        
        this.heal(regenAmount);
        this.lastRegenTime = currentTime;
    }

    /**
     * Check if entity is dead
     * @returns {boolean} - True if dead
     */
    checkDeath() {
        this.isDead = this.hp <= 0;
        return this.isDead;
    }

    /**
     * Revive entity
     * @param {number} hpPercentage - Health percentage (0-100)
     */
    revive(hpPercentage = 100) {
        this.isDead = false;
        this.hp = (hpPercentage / 100) * this.maxHp;
        this.invulnerable = false;
        this.invulnerableUntil = 0;
    }

    /**
     * Get health percentage
     * @returns {number} - Health percentage (0-100)
     */
    getHealthPercentage() {
        return (this.hp / this.maxHp) * 100;
    }

    /**
     * Check if health is low
     * @param {number} threshold - Low health threshold (0-100)
     * @returns {boolean} - True if health is low
     */
    isLowHealth(threshold = 25) {
        return this.getHealthPercentage() <= threshold;
    }

    /**
     * Clone health component
     * @returns {HealthComponent} - Cloned component
     */
    clone() {
        const cloned = new HealthComponent(this.hp, this.maxHp);
        cloned.regeneration = this.regeneration;
        cloned.invulnerable = this.invulnerable;
        cloned.invulnerableUntil = this.invulnerableUntil;
        return cloned;
    }

    /**
     * Serialize to object
     * @returns {object} - Serialized data
     */
    serialize() {
        return {
            hp: this.hp,
            maxHp: this.maxHp,
            regeneration: this.regeneration,
            isDead: this.isDead,
            invulnerable: this.invulnerable,
            invulnerableUntil: this.invulnerableUntil
        };
    }

    /**
     * Deserialize from object
     * @param {object} data - Serialized data
     */
    deserialize(data) {
        this.hp = data.hp || 100;
        this.maxHp = data.maxHp || 100;
        this.regeneration = data.regeneration || 0;
        this.isDead = data.isDead || false;
        this.invulnerable = data.invulnerable || false;
        this.invulnerableUntil = data.invulnerableUntil || 0;
        this.lastRegenTime = Date.now();
    }
}

module.exports = HealthComponent;
