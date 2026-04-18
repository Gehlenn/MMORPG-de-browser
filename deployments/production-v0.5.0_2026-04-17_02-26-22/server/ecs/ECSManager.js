/**
 * ECS Manager
 * Central coordinator for Entity Component System
 * Integrates Entity, Component, and System managers
 */

class ECSManager {
    constructor() {
        // Core managers
        this.entityManager = null;
        this.componentManager = null;
        this.systemManager = null;
        
        // Spatial partitioning
        this.spatialGrid = null;
        
        // Configuration
        this.config = {
            worldWidth: 1000,
            worldHeight: 1000,
            cellSize: 50,
            maxEntities: 10000
        };
        
        // Performance tracking
        this.stats = {
            totalEntities: 0,
            totalComponents: 0,
            totalSystems: 0,
            lastUpdateTime: 0,
            averageUpdateTime: 0
        };
        
        // Entity templates
        this.templates = new Map();
        
        this.initialized = false;
    }

    /**
     * Initialize ECS system
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('🏗️ Initializing ECS Manager...');
        
        // Initialize core managers
        const EntityManager = require('./EntityManager');
        const ComponentManager = require('./ComponentManager');
        const SystemManager = require('./SystemManager');
        const SpatialGrid = require('../world/spatial/SpatialGrid');
        
        this.entityManager = new EntityManager();
        this.componentManager = new ComponentManager();
        this.systemManager = new SystemManager();
        this.spatialGrid = new SpatialGrid(
            this.config.worldWidth, 
            this.config.worldHeight, 
            this.config.cellSize
        );
        
        // Register core components
        this.registerCoreComponents();
        
        // Initialize entity templates
        this.initializeTemplates();
        
        this.initialized = true;
        console.log('✅ ECS Manager initialized successfully!');
    }

    /**
     * Register core components
     */
    registerCoreComponents() {
        // Position component
        this.componentManager.register('position', {
            x: 'number',
            y: 'number'
        });
        
        // Health component
        this.componentManager.register('health', {
            hp: 'number',
            maxHp: 'number'
        });
        
        // Combat component
        this.componentManager.register('combat', {
            attack: 'number',
            defense: 'number',
            level: 'number'
        });
        
        // Velocity component
        this.componentManager.register('velocity', {
            vx: 'number',
            vy: 'number'
        });
        
        console.log('✅ Core components registered');
    }

    /**
     * Initialize entity templates
     */
    initializeTemplates() {
        // Player template
        this.templates.set('player', {
            components: {
                position: { x: 0, y: 0 },
                health: { hp: 100, maxHp: 100 },
                combat: { attack: 15, defense: 10, level: 1 },
                velocity: { vx: 0, vy: 0 }
            }
        });
        
        // Mob template
        this.templates.set('mob', {
            components: {
                position: { x: 0, y: 0 },
                health: { hp: 50, maxHp: 50 },
                combat: { attack: 8, defense: 5, level: 1 },
                velocity: { vx: 0, vy: 0 }
            }
        });
        
        // NPC template
        this.templates.set('npc', {
            components: {
                position: { x: 0, y: 0 },
                health: { hp: 100, maxHp: 100 },
                combat: { attack: 0, defense: 0, level: 1 },
                velocity: { vx: 0, vy: 0 }
            }
        });
        
        console.log('✅ Entity templates initialized');
    }

    /**
     * Add system to ECS
     * @param {object} system - System object
     * @param {number} priority - Execution priority
     */
    addSystem(system, priority = 0) {
        if (!this.initialized) {
            throw new Error('ECS Manager not initialized');
        }
        
        return this.systemManager.add(system, priority);
    }

    /**
     * Create entity from template
     * @param {string} templateName - Template name
     * @param {object} overrides - Component overrides
     * @returns {number} - Entity ID
     */
    createEntity(templateName, overrides = {}) {
        if (!this.initialized) {
            throw new Error('ECS Manager not initialized');
        }
        
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Template ${templateName} not found`);
        }
        
        const entityId = this.entityManager.create();
        
        // Add components from template
        for (const [componentName, componentData] of Object.entries(template.components)) {
            const finalData = { ...componentData };
            
            // Apply overrides
            if (overrides[componentName]) {
                Object.assign(finalData, overrides[componentName]);
            }
            
            this.componentManager.add(entityId, componentName, finalData);
        }
        
        // Add to spatial grid if has position
        const position = this.componentManager.get(entityId, 'position');
        if (position) {
            this.spatialGrid.addEntity(entityId, position.x, position.y);
        }
        
        this.updateStats();
        return entityId;
    }

    /**
     * Remove entity
     * @param {number} entityId - Entity ID
     */
    removeEntity(entityId) {
        if (!this.initialized) return false;
        
        // Remove from spatial grid
        this.spatialGrid.removeEntity(entityId);
        
        // Remove all components
        this.componentManager.removeAll(entityId);
        
        // Remove entity
        return this.entityManager.remove(entityId);
    }

    /**
     * Get entity components
     * @param {number} entityId - Entity ID
     * @returns {object} - Entity components
     */
    getEntityComponents(entityId) {
        if (!this.initialized) return null;
        
        const components = {};
        const componentTypes = this.componentManager.getComponentTypes();
        
        for (const componentName of Object.keys(componentTypes)) {
            const component = this.componentManager.get(entityId, componentName);
            if (component) {
                components[componentName] = component;
            }
        }
        
        return components;
    }

    /**
     * Update ECS system
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        if (!this.initialized) return;
        
        const startTime = performance.now();
        
        // Update spatial grid for moving entities
        this.updateSpatialGrid();
        
        // Update all systems
        this.systemManager.update(deltaTime);
        
        // Clean up removed entities
        this.entityManager.clearRemoved();
        
        // Update statistics
        const endTime = performance.now();
        this.stats.lastUpdateTime = endTime - startTime;
        this.stats.averageUpdateTime = 
            (this.stats.averageUpdateTime + this.stats.lastUpdateTime) / 2;
        
        this.updateStats();
    }

    /**
     * Update spatial grid for moving entities
     */
    updateSpatialGrid() {
        const velocityEntities = this.componentManager.getAllWith('velocity');
        
        for (const [entityId, velocity] of velocityEntities) {
            if (velocity.isMoving) {
                const position = this.componentManager.get(entityId, 'position');
                if (position) {
                    this.spatialGrid.updateEntity(entityId, position.x, position.y);
                }
            }
        }
    }

    /**
     * Get nearby entities
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Search radius
     * @returns {number[]} - Array of nearby entity IDs
     */
    getNearbyEntities(x, y, radius) {
        if (!this.initialized) return [];
        
        return Array.from(this.spatialGrid.getNearbyEntities(x, y, radius));
    }

    /**
     * Get entities with specific components
     * @param {string[]} componentNames - Array of component names
     * @returns {number[]} - Array of entity IDs
     */
    getEntitiesWithComponents(componentNames) {
        if (!this.initialized) return [];
        
        return this.componentManager.getEntitiesWithComponents(componentNames);
    }

    /**
     * Spawn helper functions
     */
    spawnPlayer(x = 0, y = 0, overrides = {}) {
        return this.createEntity('player', {
            position: { x, y },
            ...overrides
        });
    }

    spawnMob(x = 0, y = 0, level = 1, overrides = {}) {
        return this.createEntity('mob', {
            position: { x, y },
            combat: { attack: 8 + level * 2, defense: 5 + level, level },
            health: { hp: 50 + level * 10, maxHp: 50 + level * 10 },
            ...overrides
        });
    }

    spawnNPC(x = 0, y = 0, overrides = {}) {
        return this.createEntity('npc', {
            position: { x, y },
            ...overrides
        });
    }

    /**
     * Update statistics
     */
    updateStats() {
        this.stats.totalEntities = this.entityManager.getCount();
        this.stats.totalComponents = this.componentManager.getStats().totalComponents;
        this.stats.totalSystems = this.systemManager.getStats().totalSystems;
    }

    /**
     * Get comprehensive statistics
     * @returns {object} - System statistics
     */
    getStats() {
        return {
            ...this.stats,
            entityManager: this.entityManager.getStats(),
            componentManager: this.componentManager.getStats(),
            systemManager: this.systemManager.getStats(),
            spatialGrid: this.spatialGrid.getStats()
        };
    }

    /**
     * Get system information
     * @returns {object} - System information
     */
    getSystemInfo() {
        if (!this.initialized) return null;
        
        return {
            systems: this.systemManager.getSystemInfo(),
            executionOrder: this.systemManager.getExecutionOrder(),
            componentTypes: this.componentManager.getComponentTypes()
        };
    }

    /**
     * Reset ECS system
     */
    reset() {
        if (!this.initialized) return;
        
        this.entityManager.reset();
        this.componentManager.clear();
        this.systemManager.clear();
        this.spatialGrid.clear();
        
        this.updateStats();
        console.log('🔄 ECS Manager reset');
    }

    /**
     * Shutdown ECS system
     */
    shutdown() {
        if (!this.initialized) return;
        
        this.reset();
        this.initialized = false;
        console.log('🛑 ECS Manager shutdown');
    }
}

// Singleton instance
let ecsManagerInstance = null;

/**
 * Get ECS Manager singleton
 * @returns {ECSManager} - ECS Manager instance
 */
function getECSManager() {
    if (!ecsManagerInstance) {
        ecsManagerInstance = new ECSManager();
    }
    return ecsManagerInstance;
}

module.exports = {
    ECSManager,
    getECSManager
};
