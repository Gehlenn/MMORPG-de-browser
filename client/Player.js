/**
 * Simple Player Class
 * Basic player entity for the game
 */

class Player {
    constructor(data) {
        this.id = data.id;
        this.x = data.x || 100;
        this.y = data.y || 100;
        this.name = data.name || 'Player';
        this.health = data.hp || 100;
        this.maxHealth = data.maxHp || 100;
        this.level = data.level || 1;
        this.velocity = { vx: 0, vy: 0 };
    }
    
    update(deltaTime) {
        // Update player logic here
        this.x += this.velocity.vx * deltaTime;
        this.y += this.velocity.vy * deltaTime;
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    setVelocity(vx, vy) {
        this.velocity.vx = vx;
        this.velocity.vy = vy;
    }
}

// Export for use in main game
window.Player = Player;
