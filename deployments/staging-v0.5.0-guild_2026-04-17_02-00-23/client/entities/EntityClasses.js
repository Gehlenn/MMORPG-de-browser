// === ENTITY CLASSES ===

/**
 * Entidade base do ECS
 */

export class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
        this.active = true;
        
        console.log(`📦 Entity created: ${id}`);
    }
    
    addComponent(name, component) {
        this.components.set(name, component);
        return this;
    }
    
    getComponent(name) {
        return this.components.get(name);
    }
    
    hasComponent(name) {
        return this.components.has(name);
    }
    
    removeComponent(name) {
        this.components.delete(name);
        return this;
    }
    
    getComponents() {
        return new Map(this.components);
    }
    
    isActive() {
        return this.active;
    }
    
    setActive(active) {
        this.active = active;
        return this;
    }
    
    destroy() {
        this.components.clear();
        this.active = false;
        console.log(`🗑️ Entity destroyed: ${this.id}`);
    }
}

/**
 * Entidade Player
 */

export class PlayerEntity extends Entity {
    constructor(id, characterData) {
        super(id);
        
        this.characterData = characterData;
        this.setupComponents();
    }
    
    setupComponents() {
        // Position Component
        this.addComponent('position', {
            x: this.characterData.x || 400,
            y: this.characterData.y || 300,
            previousX: this.characterData.x || 400,
            previousY: this.characterData.y || 300
        });
        
        // Movement Component
        this.addComponent('movement', {
            speed: this.characterData.speed || 150,
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            friction: 0.9,
            maxSpeed: this.characterData.speed || 150
        });
        
        // Health Component
        this.addComponent('health', {
            health: this.characterData.hp || 100,
            maxHealth: this.characterData.maxHp || 100,
            regeneration: 0.1,
            lastDamageTime: 0,
            invulnerableTime: 0
        });
        
        // Combat Component
        this.addComponent('combat', {
            attack: this.characterData.atk || 10,
            defense: this.characterData.def || 5,
            attackRange: 40,
            attackCooldown: 500,
            lastAttackTime: 0,
            criticalChance: 0.1,
            criticalMultiplier: 2.0
        });
        
        // Render Component
        this.addComponent('render', {
            size: this.characterData.size || 32,
            color: this.characterData.color || '#4CAF50',
            sprite: null,
            visible: true,
            zIndex: 10
        });
        
        // Input Component
        this.addComponent('input', {
            controllable: true,
            inputEnabled: true
        });
        
        // Network Component
        this.addComponent('network', {
            synchronized: true,
            updateFrequency: 10,
            lastUpdateTime: 0,
            dirty: true
        });
        
        // Experience Component
        this.addComponent('experience', {
            level: this.characterData.level || 1,
            experience: 0,
            experienceToNext: 100,
            skillPoints: 0
        });
        
        // Inventory Component
        this.addComponent('inventory', {
            slots: 20,
            items: [],
            gold: 0,
            maxWeight: 100
        });
    }
}

/**
 * Entidade Mob
 */

export class MobEntity extends Entity {
    constructor(id, mobData) {
        super(id);
        
        this.mobData = mobData;
        this.setupComponents();
    }
    
    setupComponents() {
        // Position Component
        this.addComponent('position', {
            x: this.mobData.x || Math.random() * 800,
            y: this.mobData.y || Math.random() * 600,
            previousX: this.mobData.x || Math.random() * 800,
            previousY: this.mobData.y || Math.random() * 600
        });
        
        // Movement Component
        this.addComponent('movement', {
            speed: this.mobData.speed || 80,
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            friction: 0.8,
            maxSpeed: this.mobData.speed || 80
        });
        
        // Health Component
        this.addComponent('health', {
            health: this.mobData.health || 30,
            maxHealth: this.mobData.maxHealth || 30,
            regeneration: 0,
            lastDamageTime: 0,
            invulnerableTime: 0
        });
        
        // Combat Component
        this.addComponent('combat', {
            attack: this.mobData.atk || 5,
            defense: this.mobData.def || 2,
            attackRange: this.mobData.attackRange || 40,
            attackCooldown: this.mobData.attackCooldown || 1500,
            lastAttackTime: 0,
            criticalChance: 0.05,
            criticalMultiplier: 1.5
        });
        
        // Render Component
        this.addComponent('render', {
            size: this.mobData.size || 28,
            color: this.mobData.color || '#FF6B6B',
            sprite: null,
            visible: true,
            zIndex: 5
        });
        
        // AI Component
        this.addComponent('ai', {
            state: this.mobData.aiState || 'patrolling',
            behavior: this.mobData.behavior || 'aggressive',
            aggroRange: this.mobData.aggroRange || 150,
            fleeThreshold: 0.3,
            patrolCenter: null,
            patrolRadius: this.mobData.patrolRadius || 100,
            direction: Math.random() * Math.PI * 2,
            decisionCooldown: 2000,
            lastDecisionTime: 0,
            target: null,
            homePosition: null
        });
        
        // Loot Component
        this.addComponent('loot', {
            gold: Math.floor(Math.random() * 10) + 1,
            experience: Math.floor(Math.random() * 20) + 10,
            items: [],
            dropChance: 0.8
        });
        
        // Spawn Component
        this.addComponent('spawn', {
            respawnTime: 30000,
            spawnPoint: { x: this.mobData.x, y: this.mobData.y },
            maxRespawns: -1,
            currentRespawns: 0
        });
    }
}

/**
 * Entidade NPC
 */

export class NPCEntity extends Entity {
    constructor(id, npcData) {
        super(id);
        
        this.npcData = npcData;
        this.setupComponents();
    }
    
    setupComponents() {
        // Position Component
        this.addComponent('position', {
            x: this.npcData.x || 400,
            y: this.npcData.y || 300,
            previousX: this.npcData.x || 400,
            previousY: this.npcData.y || 300
        });
        
        // Movement Component
        this.addComponent('movement', {
            speed: 0,
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            friction: 1,
            maxSpeed: 0
        });
        
        // Health Component
        this.addComponent('health', {
            health: 100,
            maxHealth: 100,
            regeneration: 0,
            lastDamageTime: 0,
            invulnerableTime: 0
        });
        
        // Render Component
        this.addComponent('render', {
            size: this.npcData.size || 32,
            color: this.npcData.color || '#FFD700',
            sprite: null,
            visible: true,
            zIndex: 8
        });
        
        // Interaction Component
        this.addComponent('interaction', {
            interactable: true,
            interactionRange: 50,
            interactionType: this.npcData.type || 'dialogue',
            dialogue: this.npcData.dialogue || [],
            quests: this.npcData.quests || [],
            shop: this.npcData.shop || null
        });
        
        // AI Component
        this.addComponent('ai', {
            state: 'idle',
            behavior: 'friendly',
            aggroRange: 0,
            fleeThreshold: 0,
            patrolCenter: null,
            patrolRadius: 0,
            direction: 0,
            decisionCooldown: 5000,
            lastDecisionTime: 0,
            target: null,
            homePosition: { x: this.npcData.x, y: this.npcData.y }
        });
    }
}

/**
 * Entidade Item
 */

export class ItemEntity extends Entity {
    constructor(id, itemData) {
        super(id);
        
        this.itemData = itemData;
        this.setupComponents();
    }
    
    setupComponents() {
        // Position Component
        this.addComponent('position', {
            x: this.itemData.x || Math.random() * 800,
            y: this.itemData.y || Math.random() * 600,
            previousX: this.itemData.x || Math.random() * 800,
            previousY: this.itemData.y || Math.random() * 600
        });
        
        // Movement Component
        this.addComponent('movement', {
            speed: 0,
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            friction: 1,
            maxSpeed: 0
        });
        
        // Render Component
        this.addComponent('render', {
            size: this.itemData.size || 16,
            color: this.itemData.color || '#00FF00',
            sprite: null,
            visible: true,
            zIndex: 3,
            glowEffect: true
        });
        
        // Item Component
        this.addComponent('item', {
            type: this.itemData.type || 'consumable',
            name: this.itemData.name || 'Unknown Item',
            description: this.itemData.description || '',
            rarity: this.itemData.rarity || 'common',
            value: this.itemData.value || 0,
            stackable: this.itemData.stackable || false,
            maxStack: this.itemData.maxStack || 1,
            consumable: this.itemData.consumable || false,
            effects: this.itemData.effects || []
        });
        
        // Interaction Component
        this.addComponent('interaction', {
            interactable: true,
            interactionRange: 30,
            interactionType: 'pickup',
            autoPickup: this.itemData.autoPickup || false,
            pickupDelay: this.itemData.pickupDelay || 0,
            pickupTime: 0
        });
        
        // Lifetime Component
        this.addComponent('lifetime', {
            despawnTime: this.itemData.despawnTime || 60000,
            spawnTime: Date.now(),
            fadeInTime: 500,
            fadeOutTime: 1000
        });
    }
}

/**
 * Entidade Projectile
 */

export class ProjectileEntity extends Entity {
    constructor(id, projectileData) {
        super(id);
        
        this.projectileData = projectileData;
        this.setupComponents();
    }
    
    setupComponents() {
        // Position Component
        this.addComponent('position', {
            x: this.projectileData.x || 0,
            y: this.projectileData.y || 0,
            previousX: this.projectileData.x || 0,
            previousY: this.projectileData.y || 0
        });
        
        // Movement Component
        this.addComponent('movement', {
            speed: this.projectileData.speed || 300,
            velocity: this.projectileData.velocity || { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            friction: 0,
            maxSpeed: this.projectileData.speed || 300
        });
        
        // Render Component
        this.addComponent('render', {
            size: this.projectileData.size || 8,
            color: this.projectileData.color || '#FFFF00',
            sprite: null,
            visible: true,
            zIndex: 15,
            trailEffect: true
        });
        
        // Projectile Component
        this.addComponent('projectile', {
            damage: this.projectileData.damage || 10,
            owner: this.projectileData.owner || null,
            team: this.projectileData.team || 'neutral',
            piercing: this.projectileData.piercing || false,
            lifetime: this.projectileData.lifetime || 2000,
            spawnTime: Date.now(),
            hitTargets: [],
            maxHits: this.projectileData.maxHits || 1
        });
        
        // Collision Component
        this.addComponent('collision', {
            enabled: true,
            radius: this.projectileData.size / 2 || 4,
            collisionMask: this.projectileData.collisionMask || ['mob', 'player'],
            damageOnHit: true
        });
    }
}

/**
 * Entidade Effect
 */

export class EffectEntity extends Entity {
    constructor(id, effectData) {
        super(id);
        
        this.effectData = effectData;
        this.setupComponents();
    }
    
    setupComponents() {
        // Position Component
        this.addComponent('position', {
            x: this.effectData.x || 0,
            y: this.effectData.y || 0,
            previousX: this.effectData.x || 0,
            previousY: this.effectData.y || 0
        });
        
        // Render Component
        this.addComponent('render', {
            size: this.effectData.size || 32,
            color: this.effectData.color || '#FFFFFF',
            sprite: null,
            visible: true,
            zIndex: 20,
            alpha: 1.0,
            animation: this.effectData.animation || null
        });
        
        // Effect Component
        this.addComponent('effect', {
            type: this.effectData.type || 'visual',
            duration: this.effectData.duration || 1000,
            startTime: Date.now(),
            loop: this.effectData.loop || false,
            fadeInTime: this.effectData.fadeInTime || 200,
            fadeOutTime: this.effectData.fadeOutTime || 200
        });
        
        // Particle Component (para efeitos de partículas)
        if (this.effectData.particles) {
            this.addComponent('particles', {
                count: this.effectData.particles.count || 10,
                emissionRate: this.effectData.particles.emissionRate || 5,
                particles: [],
                particleTemplate: this.effectData.particles.template || {}
            });
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.Entity = Entity;
    window.PlayerEntity = PlayerEntity;
    window.MobEntity = MobEntity;
    window.NPCEntity = NPCEntity;
    window.ItemEntity = ItemEntity;
    window.ProjectileEntity = ProjectileEntity;
    window.EffectEntity = EffectEntity;
}
