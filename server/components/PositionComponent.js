/**
 * Position Component
 * Defines 2D position for entities
 */

class PositionComponent {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Set position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    set(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Get position as object
     * @returns {object} - Position {x, y}
     */
    get() {
        return { x: this.x, y: this.y };
    }

    /**
     * Move position by delta
     * @param {number} dx - X delta
     * @param {number} dy - Y delta
     */
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    /**
     * Calculate distance to another position
     * @param {number} x - Other X coordinate
     * @param {number} y - Other Y coordinate
     * @returns {number} - Distance
     */
    distanceTo(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Clone position component
     * @returns {PositionComponent} - Cloned component
     */
    clone() {
        return new PositionComponent(this.x, this.y);
    }

    /**
     * Serialize to object
     * @returns {object} - Serialized data
     */
    serialize() {
        return { x: this.x, y: this.y };
    }

    /**
     * Deserialize from object
     * @param {object} data - Serialized data
     */
    deserialize(data) {
        this.x = data.x || 0;
        this.y = data.y || 0;
    }
}

module.exports = PositionComponent;
