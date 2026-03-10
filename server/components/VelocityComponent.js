/**
 * Velocity Component
 * Defines movement velocity for entities
 */

class VelocityComponent {
    constructor(vx = 0, vy = 0) {
        this.vx = vx; // Velocity X (tiles per second)
        this.vy = vy; // Velocity Y (tiles per second)
        this.maxSpeed = 5.0; // Maximum speed
        this.acceleration = 10.0; // Acceleration rate
        this.friction = 0.9; // Friction coefficient (0-1)
        this.isMoving = false;
        this.lastUpdateTime = Date.now();
    }

    /**
     * Set velocity
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     */
    set(vx, vy) {
        this.vx = vx;
        this.vy = vy;
        this.isMoving = (vx !== 0 || vy !== 0);
    }

    /**
     * Add velocity
     * @param {number} dvx - X velocity delta
     * @param {number} dvy - Y velocity delta
     */
    add(dvx, dvy) {
        this.vx += dvx;
        this.vy += dvy;
        this.isMoving = (this.vx !== 0 || this.vy !== 0);
    }

    /**
     * Apply acceleration towards target velocity
     * @param {number} targetVx - Target X velocity
     * @param {number} targetVy - Target Y velocity
     * @param {number} deltaTime - Time delta in seconds
     */
    applyAcceleration(targetVx, targetVy, deltaTime) {
        const dvx = targetVx - this.vx;
        const dvy = targetVy - this.vy;
        
        const accelAmount = this.acceleration * deltaTime;
        
        if (Math.abs(dvx) < accelAmount) {
            this.vx = targetVx;
        } else {
            this.vx += Math.sign(dvx) * accelAmount;
        }
        
        if (Math.abs(dvy) < accelAmount) {
            this.vy = targetVy;
        } else {
            this.vy += Math.sign(dvy) * accelAmount;
        }
        
        this.isMoving = (this.vx !== 0 || this.vy !== 0);
    }

    /**
     * Apply friction
     * @param {number} deltaTime - Time delta in seconds
     */
    applyFriction(deltaTime) {
        if (!this.isMoving) return;
        
        const frictionAmount = Math.pow(this.friction, deltaTime * 60); // Normalize to 60 FPS
        
        this.vx *= frictionAmount;
        this.vy *= frictionAmount;
        
        // Stop if velocity is very small
        const threshold = 0.01;
        if (Math.abs(this.vx) < threshold) this.vx = 0;
        if (Math.abs(this.vy) < threshold) this.vy = 0;
        
        this.isMoving = (this.vx !== 0 || this.vy !== 0);
    }

    /**
     * Limit velocity to maximum speed
     */
    limitToMaxSpeed() {
        const speed = this.getSpeed();
        if (speed > this.maxSpeed) {
            const ratio = this.maxSpeed / speed;
            this.vx *= ratio;
            this.vy *= ratio;
        }
    }

    /**
     * Get current speed
     * @returns {number} - Current speed
     */
    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    /**
     * Get velocity direction
     * @returns {number} - Direction in radians
     */
    getDirection() {
        return Math.atan2(this.vy, this.vx);
    }

    /**
     * Set velocity by direction and speed
     * @param {number} direction - Direction in radians
     * @param {number} speed - Speed value
     */
    setDirectionSpeed(direction, speed) {
        this.vx = Math.cos(direction) * speed;
        this.vy = Math.sin(direction) * speed;
        this.isMoving = (speed > 0);
    }

    /**
     * Normalize velocity to unit vector
     */
    normalize() {
        const speed = this.getSpeed();
        if (speed > 0) {
            this.vx /= speed;
            this.vy /= speed;
        }
    }

    /**
     * Get velocity as object
     * @returns {object} - Velocity {vx, vy}
     */
    get() {
        return { vx: this.vx, vy: this.vy };
    }

    /**
     * Check if entity is moving
     * @returns {boolean} - True if moving
     */
    isEntityMoving() {
        return this.isMoving;
    }

    /**
     * Stop movement
     */
    stop() {
        this.vx = 0;
        this.vy = 0;
        this.isMoving = false;
    }

    /**
     * Apply force (for physics-based movement)
     * @param {number} fx - Force X
     * @param {number} fy - Force Y
     * @param {number} mass - Entity mass (default 1)
     * @param {number} deltaTime - Time delta in seconds
     */
    applyForce(fx, fy, mass = 1, deltaTime = 1/60) {
        const ax = fx / mass;
        const ay = fy / mass;
        
        this.vx += ax * deltaTime;
        this.vy += ay * deltaTime;
        
        this.isMoving = (this.vx !== 0 || this.vy !== 0);
    }

    /**
     * Clone velocity component
     * @returns {VelocityComponent} - Cloned component
     */
    clone() {
        const cloned = new VelocityComponent(this.vx, this.vy);
        cloned.maxSpeed = this.maxSpeed;
        cloned.acceleration = this.acceleration;
        cloned.friction = this.friction;
        return cloned;
    }

    /**
     * Serialize to object
     * @returns {object} - Serialized data
     */
    serialize() {
        return {
            vx: this.vx,
            vy: this.vy,
            maxSpeed: this.maxSpeed,
            acceleration: this.acceleration,
            friction: this.friction,
            isMoving: this.isMoving
        };
    }

    /**
     * Deserialize from object
     * @param {object} data - Serialized data
     */
    deserialize(data) {
        this.vx = data.vx || 0;
        this.vy = data.vy || 0;
        this.maxSpeed = data.maxSpeed || 5.0;
        this.acceleration = data.acceleration || 10.0;
        this.friction = data.friction || 0.9;
        this.isMoving = data.isMoving || false;
        this.lastUpdateTime = Date.now();
    }
}

module.exports = VelocityComponent;
