// === ECS COMPONENTS ===
export class PositionComponent {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    set(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class HealthComponent {
    constructor(maxHealth = 100, health = 100) {
        this.maxHealth = maxHealth;
        this.health = health;
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        return this.health >= this.maxHealth;
    }
    
    getHealthPercentage() {
        return (this.health / this.maxHealth) * 100;
    }
    
    isDead() {
        return this.health <= 0;
    }
}

export class MovementComponent {
    constructor(speed = 100) {
        this.speed = speed;
        this.velocity = { x: 0, y: 0 };
        this.direction = 0;
    }
    
    setDirection(direction) {
        this.direction = direction;
    }
    
    setVelocity(x, y) {
        this.velocity.x = x;
        this.velocity.y = y;
    }
    
    getSpeed() {
        return this.speed;
    }
}

export class RenderComponent {
    constructor(size = 32, color = '#4CAF50') {
        this.size = size;
        this.color = color;
        this.visible = true;
    }
    
    setVisible(visible) {
        this.visible = visible;
    }
    
    setColor(color) {
        this.color = color;
    }
}

// === ECS ENTITY ===
export class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
    }
    
    addComponent(name, component) {
        this.components.set(name, component);
    }
    
    getComponent(name) {
        return this.components.get(name);
    }
    
    hasComponent(name) {
        return this.components.has(name);
    }
    
    removeComponent(name) {
        this.components.delete(name);
    }
}

// === ECS SYSTEMS ===
export class MovementSystem {
    constructor() {
        this.entities = new Set();
        console.log('🏃 MovementSystem initialized');
    }
    
    addEntity(entity) {
        this.entities.add(entity);
    }
    
    removeEntity(entity) {
        this.entities.delete(entity);
    }
    
    update(deltaTime) {
        this.entities.forEach(entity => {
            const movement = entity.getComponent('movement');
            const position = entity.getComponent('position');
            
            if (movement && position) {
                // Update position based on velocity
                position.x += movement.velocity.x * deltaTime;
                position.y += movement.velocity.y * deltaTime;
            }
        });
    }
}

export class AISystem {
    constructor() {
        this.entities = new Set();
        console.log('🤖 AISystem initialized');
    }
    
    addEntity(entity) {
        this.entities.add(entity);
    }
    
    removeEntity(entity) {
        this.entities.delete(entity);
    }
    
    update(deltaTime) {
        this.entities.forEach(entity => {
            const health = entity.getComponent('health');
            const position = entity.getComponent('position');
            const movement = entity.getComponent('movement');
            
            if (health && position && movement) {
                // Simple AI logic
                if (health.isDead()) {
                    // Dead entities don't think
                    return;
                }
                
                // Flee if low health
                if (health.getHealthPercentage() < 30) {
                    movement.setDirection(Math.random() * Math.PI * 2);
                    movement.setVelocity(
                        Math.cos(movement.direction) * movement.getSpeed() * 1.5,
                        Math.sin(movement.direction) * movement.getSpeed() * 1.5
                    );
                } else {
                    // Normal movement
                    movement.setDirection(Math.random() * Math.PI * 2);
                    movement.setVelocity(
                        Math.cos(movement.direction) * movement.getSpeed(),
                        Math.sin(movement.direction) * movement.getSpeed()
                    );
                }
            }
        });
    }
}

export class RenderSystem {
    constructor() {
        this.entities = new Set();
        this.ctx = null;
        console.log('🎨 RenderSystem initialized');
    }
    
    setContext(ctx) {
        this.ctx = ctx;
    }
    
    addEntity(entity) {
        this.entities.add(entity);
    }
    
    removeEntity(entity) {
        this.entities.delete(entity);
    }
    
    render() {
        if (!this.ctx) return;
        
        this.entities.forEach(entity => {
            const position = entity.getComponent('position');
            const render = entity.getComponent('render');
            
            if (position && render && render.visible) {
                this.ctx.fillStyle = render.color;
                this.ctx.fillRect(
                    position.x - render.size/2,
                    position.y - render.size/2,
                    render.size,
                    render.size
                );
            }
        });
    }
}

// === ECS MANAGER ===
export class ECSManager {
    constructor() {
        this.entities = new Set();
        this.systems = {
            movement: new MovementSystem(),
            ai: new AISystem(),
            render: new RenderSystem()
        };
        
        console.log('🗄️ ECSManager initialized');
    }
    
    createEntity(id) {
        const entity = new Entity(id);
        this.entities.add(entity);
        return entity;
    }
    
    removeEntity(id) {
        const entity = Array.from(this.entities).find(e => e.id === id);
        if (entity) {
            this.entities.delete(entity);
            
            // Remove from all systems
            Object.values(this.systems).forEach(system => {
                system.removeEntity(entity);
            });
        }
    }
    
    addComponentToEntity(entityId, componentName, component) {
        const entity = Array.from(this.entities).find(e => e.id === entityId);
        if (entity) {
            entity.addComponent(componentName, component);
            
            // Add to relevant systems
            if (componentName === 'movement') {
                this.systems.movement.addEntity(entity);
            } else if (componentName === 'health') {
                this.systems.ai.addEntity(entity);
            } else if (componentName === 'render') {
                this.systems.render.addEntity(entity);
            }
        }
    }
    
    update(deltaTime) {
        // Update all systems
        Object.values(this.systems).forEach(system => {
            system.update(deltaTime);
        });
    }
    
    render(ctx) {
        // Set render context
        this.systems.render.setContext(ctx);
        
        // Render all entities
        this.systems.render.render();
    }
    
    getEntity(id) {
        return Array.from(this.entities).find(e => e.id === id);
    }
    
    getEntities() {
        return Array.from(this.entities);
    }
}
