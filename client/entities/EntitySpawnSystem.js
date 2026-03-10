// === ENTITY SPAWN SYSTEM ===

/**
 * Sistema de spawn de entidades
 * Converte dados do servidor em ECS entities
 */

export class EntitySpawnSystem {
    constructor() {
        this.ecsManager = null;
        this.entityFactory = null;
        this.spawnQueue = [];
        this.isInitialized = false;
        
        // Spawn configurations
        this.config = {
            maxEntities: 1000,
            spawnRadius: 500,
            despawnDistance: 1000,
            batchSpawnSize: 50
        };
        
        // Entity templates
        this.templates = new Map();
        this.setupTemplates();
        
        console.log('👾 Entity Spawn System initialized');
    }
    
    initialize(ecsManager) {
        if (this.isInitialized) {
            console.warn('⚠️ Entity Spawn System already initialized');
            return false;
        }
        
        this.ecsManager = ecsManager;
        this.entityFactory = new EntityFactory(ecsManager);
        this.isInitialized = true;
        
        console.log('✅ Entity Spawn System initialized with ECS');
        return true;
    }
    
    setupTemplates() {
        // Player template
        this.templates.set('player', {
            components: ['position', 'movement', 'health', 'combat', 'render', 'input', 'network', 'experience', 'inventory'],
            defaults: {
                health: { health: 100, maxHealth: 100, regeneration: 0.1 },
                movement: { speed: 150, friction: 0.9 },
                combat: { attack: 10, defense: 5, attackRange: 40, attackCooldown: 500 },
                render: { size: 32, color: '#4CAF50', visible: true, zIndex: 10 },
                input: { controllable: true, inputEnabled: true },
                network: { synchronized: true, updateFrequency: 10 },
                experience: { level: 1, experience: 0, experienceToNext: 100 },
                inventory: { slots: 20, items: [], gold: 0, maxWeight: 100 }
            }
        });
        
        // Mob templates
        this.templates.set('goblin', {
            components: ['position', 'movement', 'health', 'combat', 'render', 'ai', 'loot', 'spawn'],
            defaults: {
                health: { health: 30, maxHealth: 30, regeneration: 0 },
                movement: { speed: 80, friction: 0.8 },
                combat: { attack: 5, defense: 2, attackRange: 40, attackCooldown: 1500 },
                render: { size: 28, color: '#FF6B6B', visible: true, zIndex: 5 },
                ai: { state: 'patrolling', behavior: 'aggressive', aggroRange: 150, fleeThreshold: 0.3 },
                loot: { gold: Math.floor(Math.random() * 10) + 1, experience: Math.floor(Math.random() * 20) + 10, dropChance: 0.8 },
                spawn: { respawnTime: 30000, maxRespawns: -1 }
            }
        });
        
        this.templates.set('orc', {
            components: ['position', 'movement', 'health', 'combat', 'render', 'ai', 'loot', 'spawn'],
            defaults: {
                health: { health: 50, maxHealth: 50, regeneration: 0 },
                movement: { speed: 60, friction: 0.8 },
                combat: { attack: 8, defense: 4, attackRange: 45, attackCooldown: 2000 },
                render: { size: 32, color: '#8B4513', visible: true, zIndex: 5 },
                ai: { state: 'patrolling', behavior: 'aggressive', aggroRange: 200, fleeThreshold: 0.2 },
                loot: { gold: Math.floor(Math.random() * 15) + 5, experience: Math.floor(Math.random() * 30) + 20, dropChance: 0.9 },
                spawn: { respawnTime: 45000, maxRespawns: -1 }
            }
        });
        
        this.templates.set('skeleton', {
            components: ['position', 'movement', 'health', 'combat', 'render', 'ai', 'loot', 'spawn'],
            defaults: {
                health: { health: 25, maxHealth: 25, regeneration: 0 },
                movement: { speed: 100, friction: 0.8 },
                combat: { attack: 6, defense: 1, attackRange: 35, attackCooldown: 1200 },
                render: { size: 26, color: '#F0F0F0', visible: true, zIndex: 5 },
                ai: { state: 'patrolling', behavior: 'aggressive', aggroRange: 120, fleeThreshold: 0.4 },
                loot: { gold: Math.floor(Math.random() * 8) + 2, experience: Math.floor(Math.random() * 15) + 8, dropChance: 0.7 },
                spawn: { respawnTime: 20000, maxRespawns: -1 }
            }
        });
        
        // NPC template
        this.templates.set('npc', {
            components: ['position', 'movement', 'health', 'render', 'interaction', 'ai'],
            defaults: {
                health: { health: 100, maxHealth: 100, regeneration: 0 },
                movement: { speed: 0, friction: 1 },
                render: { size: 32, color: '#FFD700', visible: true, zIndex: 8 },
                interaction: { interactable: true, interactionRange: 50, interactionType: 'dialogue' },
                ai: { state: 'idle', behavior: 'friendly', aggroRange: 0 }
            }
        });
        
        // Item template
        this.templates.set('item', {
            components: ['position', 'movement', 'render', 'item', 'interaction', 'lifetime'],
            defaults: {
                movement: { speed: 0, friction: 1 },
                render: { size: 16, visible: true, zIndex: 3, glowEffect: true },
                interaction: { interactable: true, interactionRange: 30, interactionType: 'pickup' },
                lifetime: { despawnTime: 60000 }
            }
        });
    }
    
    // === SERVER DATA CONVERSION ===
    
    spawnFromServerData(serverData) {
        if (!this.isInitialized || !this.ecsManager) {
            console.warn('⚠️ Entity Spawn System not initialized');
            return null;
        }
        
        try {
            const entity = this.convertServerDataToEntity(serverData);
            if (entity) {
                this.ecsManager.addEntity(entity);
                console.log(`👾 Spawned entity from server data: ${entity.id}`);
                return entity;
            }
        } catch (error) {
            console.error('❌ Failed to spawn entity from server data:', error);
        }
        
        return null;
    }
    
    convertServerDataToEntity(serverData) {
        if (!serverData || !serverData.type) {
            console.warn('⚠️ Invalid server data for entity spawn');
            return null;
        }
        
        // Create entity based on type
        switch (serverData.type) {
            case 'player':
                return this.spawnPlayerFromServerData(serverData);
            case 'mob':
                return this.spawnMobFromServerData(serverData);
            case 'npc':
                return this.spawnNPCFromServerData(serverData);
            case 'item':
                return this.spawnItemFromServerData(serverData);
            default:
                console.warn(`⚠️ Unknown entity type: ${serverData.type}`);
                return null;
        }
    }
    
    spawnPlayerFromServerData(serverData) {
        const template = this.templates.get('player');
        if (!template) return null;
        
        const entityData = {
            id: serverData.id || `player_${Date.now()}`,
            type: 'player',
            components: {}
        };
        
        // Convert server data to components
        template.components.forEach(componentType => {
            const defaults = template.defaults[componentType] || {};
            const serverComponent = serverData.components?.[componentType] || {};
            
            entityData.components[componentType] = this.mergeComponentData(defaults, serverComponent);
        });
        
        // Override with specific server data
        if (serverData.name) entityData.components.render.name = serverData.name;
        if (serverData.level) entityData.components.experience.level = serverData.level;
        if (serverData.class) entityData.components.render.class = serverData.class;
        
        return this.entityFactory.createEntity(entityData);
    }
    
    spawnMobFromServerData(serverData) {
        const template = this.templates.get(serverData.template || 'goblin');
        if (!template) return null;
        
        const entityData = {
            id: serverData.id || `mob_${Date.now()}`,
            type: 'mob',
            components: {}
        };
        
        // Convert server data to components
        template.components.forEach(componentType => {
            const defaults = template.defaults[componentType] || {};
            const serverComponent = serverData.components?.[componentType] || {};
            
            entityData.components[componentType] = this.mergeComponentData(defaults, serverComponent);
        });
        
        // Override with specific server data
        if (serverData.name) entityData.components.render.name = serverData.name;
        if (serverData.health) entityData.components.health.health = serverData.health;
        if (serverData.position) {
            entityData.components.position.x = serverData.position.x;
            entityData.components.position.y = serverData.position.y;
        }
        
        return this.entityFactory.createEntity(entityData);
    }
    
    spawnNPCFromServerData(serverData) {
        const template = this.templates.get('npc');
        if (!template) return null;
        
        const entityData = {
            id: serverData.id || `npc_${Date.now()}`,
            type: 'npc',
            components: {}
        };
        
        // Convert server data to components
        template.components.forEach(componentType => {
            const defaults = template.defaults[componentType] || {};
            const serverComponent = serverData.components?.[componentType] || {};
            
            entityData.components[componentType] = this.mergeComponentData(defaults, serverComponent);
        });
        
        // Override with specific server data
        if (serverData.name) entityData.components.render.name = serverData.name;
        if (serverData.dialogue) entityData.components.interaction.dialogue = serverData.dialogue;
        if (serverData.position) {
            entityData.components.position.x = serverData.position.x;
            entityData.components.position.y = serverData.position.y;
        }
        
        return this.entityFactory.createEntity(entityData);
    }
    
    spawnItemFromServerData(serverData) {
        const template = this.templates.get('item');
        if (!template) return null;
        
        const entityData = {
            id: serverData.id || `item_${Date.now()}`,
            type: 'item',
            components: {}
        };
        
        // Convert server data to components
        template.components.forEach(componentType => {
            const defaults = template.defaults[componentType] || {};
            const serverComponent = serverData.components?.[componentType] || {};
            
            entityData.components[componentType] = this.mergeComponentData(defaults, serverComponent);
        });
        
        // Override with specific server data
        if (serverData.name) entityData.components.item.name = serverData.name;
        if (serverData.rarity) entityData.components.item.rarity = serverData.rarity;
        if (serverData.value) entityData.components.item.value = serverData.value;
        if (serverData.position) {
            entityData.components.position.x = serverData.position.x;
            entityData.components.position.y = serverData.position.y;
        }
        
        return this.entityFactory.createEntity(entityData);
    }
    
    mergeComponentData(defaults, serverData) {
        const merged = { ...defaults };
        
        if (serverData) {
            Object.keys(serverData).forEach(key => {
                if (typeof serverData[key] === 'object' && !Array.isArray(serverData[key])) {
                    merged[key] = { ...merged[key], ...serverData[key] };
                } else {
                    merged[key] = serverData[key];
                }
            });
        }
        
        return merged;
    }
    
    // === BATCH SPAWNING ===
    
    spawnFromWorldData(worldData) {
        if (!worldData || !worldData.entities) {
            console.warn('⚠️ No entities in world data');
            return;
        }
        
        console.log(`🌍 Spawning ${worldData.entities.length} entities from world data`);
        
        const entities = worldData.entities;
        const batchSize = this.config.batchSpawnSize;
        let spawnedCount = 0;
        
        // Process in batches to avoid blocking
        for (let i = 0; i < entities.length; i += batchSize) {
            const batch = entities.slice(i, i + batchSize);
            
            setTimeout(() => {
                batch.forEach(serverData => {
                    const entity = this.spawnFromServerData(serverData);
                    if (entity) {
                        spawnedCount++;
                    }
                });
                
                if (i + batchSize >= entities.length) {
                    console.log(`✅ Spawned ${spawnedCount}/${entities.length} entities`);
                }
            }, i / batchSize * 10); // Stagger batches
        }
    }
    
    // === UTILITY METHODS ===
    
    spawnPlayer(characterData) {
        const serverData = {
            type: 'player',
            id: characterData.id,
            name: characterData.name,
            level: characterData.level,
            class: characterData.class,
            components: {
                position: {
                    x: characterData.x || 400,
                    y: characterData.y || 300
                },
                health: {
                    health: characterData.hp || 100,
                    maxHealth: characterData.maxHp || 100
                },
                combat: {
                    attack: characterData.atk || 10,
                    defense: characterData.def || 5
                },
                render: {
                    color: characterData.color || '#4CAF50',
                    size: characterData.size || 32
                },
                movement: {
                    speed: characterData.speed || 150
                }
            }
        };
        
        return this.spawnFromServerData(serverData);
    }
    
    spawnMobs(mobCount = 5) {
        const mobTypes = ['goblin', 'orc', 'skeleton'];
        const entities = [];
        
        for (let i = 0; i < mobCount; i++) {
            const mobType = mobTypes[i % mobTypes.length];
            
            const serverData = {
                type: 'mob',
                template: mobType,
                id: `mob_${i}`,
                components: {
                    position: {
                        x: Math.random() * 800,
                        y: Math.random() * 600
                    }
                }
            };
            
            const entity = this.spawnFromServerData(serverData);
            if (entity) {
                entities.push(entity);
            }
        }
        
        console.log(`👾 Spawned ${entities.length} mobs`);
        return entities;
    }
    
    despawnEntity(entityId) {
        if (!this.ecsManager) return false;
        
        const entity = this.ecsManager.getEntity(entityId);
        if (entity) {
            this.ecsManager.removeEntity(entityId);
            console.log(`🗑️ Despawned entity: ${entityId}`);
            return true;
        }
        
        return false;
    }
    
    // === STATUS ===
    
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasECSManager: !!this.ecsManager,
            spawnQueueSize: this.spawnQueue.length,
            templateCount: this.templates.size,
            entityCount: this.ecsManager ? this.ecsManager.getEntityCount() : 0
        };
    }
    
    // === CLEANUP ===
    
    destroy() {
        this.spawnQueue = [];
        this.templates.clear();
        this.isInitialized = false;
        console.log('🗑️ Entity Spawn System destroyed');
    }
}

/**
 * Entity Factory
 * Creates entities from data
 */

class EntityFactory {
    constructor(ecsManager) {
        this.ecsManager = ecsManager;
    }
    
    createEntity(entityData) {
        if (!entityData || !entityData.id) {
            console.warn('⚠️ Invalid entity data');
            return null;
        }
        
        try {
            const entity = this.ecsManager.createEntity(entityData.id);
            
            // Add components
            Object.entries(entityData.components).forEach(([componentType, componentData]) => {
                this.ecsManager.addComponentToEntity(entity.id, componentType, componentData);
            });
            
            return entity;
            
        } catch (error) {
            console.error(`❌ Failed to create entity ${entityData.id}:`, error);
            return null;
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.EntitySpawnSystem = EntitySpawnSystem;
}
