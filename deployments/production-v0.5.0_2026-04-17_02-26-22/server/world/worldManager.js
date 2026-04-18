/**
 * World Manager - Core World System Management
 * Manages chunks, spawning, and persistent world state
 * Version 0.3 - First Playable Gameplay Systems
 */

class WorldManager {
    constructor(server) {
        this.server = server;
        
        // World state
        this.worldState = {
            currentTime: Date.now(),
            dayNightCycle: 0,
            weather: 'clear',
            season: 'spring',
            regions: new Map(),
            instances: new Map(),
            globalEvents: new Map()
        };
        
        // Player management
        this.connectedPlayers = new Map();
        this.playerRegions = new Map();
        this.playerInstances = new Map();
        
        // Region management
        this.regions = new Map();
        this.regionTemplates = new Map();
        this.activeRegions = new Set();
        
        // Instance management
        this.instances = new Map();
        this.instanceTemplates = new Map();
        
        // World events
        this.worldEvents = new Map();
        this.eventSchedule = new Map();
        
        // Settings
        this.settings = {
            maxPlayersPerRegion: 100,
            regionLoadRadius: 200,
            saveInterval: 60000, // 1 minute
            worldEventInterval: 300000, // 5 minutes
            dayNightCycleDuration: 1200000, // 20 minutes
            weatherChangeInterval: 600000 // 10 minutes
        };
        
        // Initialize
        this.initialize();
    }
    
    async initialize() {
        // Load world data
        await this.loadWorldData();
        
        // Initialize regions
        await this.initializeRegions();
        
        // Setup world systems
        this.setupWorldSystems();
        
        // Start world loops
        this.startWorldLoops();
        
        console.log('World Manager initialized');
    }
    
    async loadWorldData() {
        try {
            // Simplified world data loading
            console.log('Loading world data...');
            
            // Set default world state
            this.worldState = {
                currentTime: Date.now(),
                dayNightCycle: 0,
                weather: 'clear',
                season: 'spring',
                regions: new Map(),
                instances: new Map(),
                globalEvents: new Map()
            };
            
            console.log('World data loaded successfully');
        } catch (error) {
            console.error('Error loading world data:', error);
        }
    }
    
    async initializeRegions() {
        // Create default regions if none exist
        if (this.regions.size === 0) {
            await this.createDefaultRegions();
        }
        
        // Load existing regions
        try {
            const savedRegions = await this.database.get('regions');
            if (savedRegions) {
                for (const [id, data] of Object.entries(savedRegions)) {
                    const region = this.createRegionFromData(id, data);
                    this.regions.set(id, region);
                }
            }
        } catch (error) {
            console.log('No saved regions found, starting with defaults');
        }
        
        console.log(`Initialized ${this.regions.size} regions`);
    }
    
    async createDefaultRegions() {
        const defaultRegions = [
            {
                id: 'starter_plains',
                name: 'Planícies Iniciais',
                type: 'plains',
                levelRange: { min: 1, max: 10 },
                bounds: { x: -100, y: -100, width: 200, height: 200 },
                spawnPoints: [
                    { x: 0, y: 0, type: 'player' },
                    { x: 50, y: 50, type: 'player' },
                    { x: -50, y: -50, type: 'player' }
                ],
                resources: ['herbs', 'wood', 'stone'],
                monsters: ['goblin', 'wolf', 'rabbit'],
                npcs: ['merchant', 'guard', 'quest_giver'],
                poi: [
                    { id: 'starter_town', name: 'Vila Inicial', type: 'town', x: 0, y: 0 },
                    { id: 'goblin_camp', name: 'Acampamento Goblin', type: 'dungeon', x: 80, y: 60 }
                ]
            },
            {
                id: 'forest_of_beginnings',
                name: 'Floresta dos Começos',
                type: 'forest',
                levelRange: { min: 5, max: 15 },
                bounds: { x: 100, y: -100, width: 200, height: 200 },
                spawnPoints: [
                    { x: 150, y: 0, type: 'player' }
                ],
                resources: ['rare_herbs', 'wood', 'berries'],
                monsters: ['wolf', 'bear', 'spider', 'forest_spirit'],
                npcs: ['herbalist', 'ranger', 'druid'],
                poi: [
                    { id: 'druid_grove', name: 'Bosque do Druida', type: 'sanctuary', x: 150, y: 50 },
                    { id: 'ancient_tree', name: 'Árvore Antiga', type: 'landmark', x: 200, y: 100 }
                ]
            },
            {
                id: 'mountain_pass',
                name: 'Passagem Montanhosa',
                type: 'mountain',
                levelRange: { min: 10, max: 25 },
                bounds: { x: -100, y: 100, width: 200, height: 200 },
                spawnPoints: [
                    { x: 0, y: 150, type: 'player' }
                ],
                resources: ['iron_ore', 'stone', 'crystals'],
                monsters: ['orc', 'troll', 'mountain_lion', 'eagle'],
                npcs: ['miner', 'blacksmith', 'mountain_guide'],
                poi: [
                    { id: 'iron_mine', name: 'Mina de Ferro', type: 'dungeon', x: -50, y: 150 },
                    { id: 'summit_shrine', name: 'Santuário do Pico', type: 'shrine', x: 0, y: 250 }
                ]
            },
            {
                id: 'dark_swamp',
                name: 'Pântano Sombrio',
                type: 'swamp',
                levelRange: { min: 15, max: 30 },
                bounds: { x: 300, y: -100, width: 200, height: 200 },
                spawnPoints: [
                    { x: 350, y: 0, type: 'player' }
                ],
                resources: ['swamp_herbs', 'toxic_components', 'rare_mushrooms'],
                monsters: ['crocodile', 'swamp_beast', 'poison_spider', 'will_o_wisp'],
                npcs: ['alchemist', 'swamp_witch', 'exile'],
                poi: [
                    { id: 'witch_hut', name: 'Cabana da Bruxa', type: 'npc_home', x: 380, y: 50 },
                    { id: 'toxic_lake', name: 'Lago Tóxico', type: 'hazard', x: 400, y: 100 }
                ]
            }
        ];
        
        for (const regionData of defaultRegions) {
            const region = this.createRegion(regionData);
            this.regions.set(region.id, region);
            await this.saveRegion(region);
        }
    }
    
    createRegion(data) {
        const region = {
            id: data.id,
            name: data.name,
            type: data.type,
            levelRange: data.levelRange,
            bounds: data.bounds,
            spawnPoints: data.spawnPoints || [],
            resources: data.resources || [],
            monsters: data.monsters || [],
            npcs: data.npcs || [],
            poi: data.poi || [],
            
            // Runtime state
            players: new Set(),
            npcs: new Map(),
            monsters: new Map(),
            items: new Map(),
            resources: new Map(),
            
            // Region properties
            loaded: false,
            lastActivity: Date.now(),
            instanceId: null,
            
            // Environmental
            weather: 'clear',
            temperature: 20,
            visibility: 100,
            
            // Events
            activeEvents: new Set(),
            eventHistory: []
        };
        
        return region;
    }
    
    createRegionFromData(id, data) {
        const region = this.createRegion(data);
        
        // Restore runtime state
        region.players = new Set(data.players || []);
        region.npcs = new Map(data.npcs || []);
        region.monsters = new Map(data.monsters || []);
        region.items = new Map(data.items || []);
        region.resources = new Map(data.resources || []);
        
        region.loaded = data.loaded || false;
        region.lastActivity = data.lastActivity || Date.now();
        region.weather = data.weather || 'clear';
        region.temperature = data.temperature || 20;
        region.visibility = data.visibility || 100;
        
        return region;
    }
    
    setupWorldSystems() {
        // Setup spawn system
        this.spawnSystem = {
            spawnMonster: (regionId, monsterType, x, y) => this.spawnMonster(regionId, monsterType, x, y),
            spawnNPC: (regionId, npcType, x, y) => this.spawnNPC(regionId, npcType, x, y),
            spawnResource: (regionId, resourceType, x, y) => this.spawnResource(regionId, resourceType, x, y),
            spawnItem: (regionId, itemType, x, y, quantity) => this.spawnItem(regionId, itemType, x, y, quantity)
        };
        
        // Setup exploration system
        this.explorationSystem = {
            discoverRegion: (playerId, regionId) => this.discoverRegion(playerId, regionId),
            exploreArea: (playerId, x, y, radius) => this.exploreArea(playerId, x, y, radius),
            getDiscoveredRegions: (playerId) => this.getDiscoveredRegions(playerId),
            isAreaExplored: (playerId, x, y) => this.isAreaExplored(playerId, x, y)
        };
        
        // Setup event system
        this.eventSystem = {
            createWorldEvent: (eventType, data) => this.createWorldEvent(eventType, data),
            triggerRegionEvent: (regionId, eventType, data) => this.triggerRegionEvent(regionId, eventType, data),
            getActiveEvents: () => this.getActiveEvents(),
            getRegionEvents: (regionId) => this.getRegionEvents(regionId)
        };
    }
    
    startWorldLoops() {
        // Main world update loop
        setInterval(() => {
            this.updateWorld();
        }, 1000); // Update every second
        
        // Save loop
        setInterval(() => {
            this.saveWorldState();
        }, this.settings.saveInterval);
        
        // World event loop
        setInterval(() => {
            this.updateWorldEvents();
        }, this.settings.worldEventInterval);
        
        // Day/night cycle loop
        setInterval(() => {
            this.updateDayNightCycle();
        }, 60000); // Update every minute
        
        // Weather change loop
        setInterval(() => {
            this.updateWeather();
        }, this.settings.weatherChangeInterval);
        
        // Region cleanup loop
        setInterval(() => {
            this.cleanupInactiveRegions();
        }, 300000); // Check every 5 minutes
    }
    
    // Player management
    async addPlayer(player) {
        this.connectedPlayers.set(player.id, player);
        
        // Determine starting region
        const startRegion = this.getStartingRegion(player);
        
        // Add player to region
        await this.addPlayerToRegion(player.id, startRegion);
        
        // Load player exploration data
        await this.loadPlayerExploration(player.id);
        
        console.log(`Player ${player.name} added to world in region ${startRegion}`);
        
        return startRegion;
    }
    
    removePlayer(playerId) {
        const player = this.connectedPlayers.get(playerId);
        if (!player) return;
        
        // Remove from current region
        const regionId = this.playerRegions.get(playerId);
        if (regionId) {
            this.removePlayerFromRegion(playerId, regionId);
        }
        
        // Save player exploration data
        this.savePlayerExploration(playerId);
        
        // Remove from connected players
        this.connectedPlayers.delete(playerId);
        this.playerRegions.delete(playerId);
        this.playerInstances.delete(playerId);
        
        console.log(`Player ${player.name} removed from world`);
    }
    
    async addPlayerToRegion(playerId, regionId) {
        const region = this.regions.get(regionId);
        const player = this.connectedPlayers.get(playerId);
        
        if (!region || !player) return false;
        
        // Check region capacity
        if (region.players.size >= this.settings.maxPlayersPerRegion) {
            // Find nearby region or create new instance
            const newRegionId = await this.findAvailableRegion(regionId, player.level);
            if (newRegionId) {
                return this.addPlayerToRegion(playerId, newRegionId);
            }
            return false;
        }
        
        // Remove from previous region
        const previousRegionId = this.playerRegions.get(playerId);
        if (previousRegionId && previousRegionId !== regionId) {
            this.removePlayerFromRegion(playerId, previousRegionId);
        }
        
        // Add to new region
        region.players.add(playerId);
        this.playerRegions.set(playerId, regionId);
        
        // Load region if not loaded
        if (!region.loaded) {
            await this.loadRegion(regionId);
        }
        
        // Set player position
        const spawnPoint = this.getSpawnPoint(region, 'player');
        player.x = spawnPoint.x;
        player.y = spawnPoint.y;
        player.regionId = regionId;
        
        // Update region activity
        region.lastActivity = Date.now();
        
        // Notify other players in region
        this.notifyRegionPlayers(regionId, {
            type: 'player_joined',
            playerId: playerId,
            playerName: player.name,
            x: player.x,
            y: player.y
        }, playerId);
        
        // Send region data to player
        this.sendRegionData(playerId, regionId);
        
        console.log(`Player ${player.name} joined region ${regionId}`);
        return true;
    }
    
    removePlayerFromRegion(playerId, regionId) {
        const region = this.regions.get(regionId);
        if (!region) return;
        
        region.players.delete(playerId);
        
        // Notify other players
        this.notifyRegionPlayers(regionId, {
            type: 'player_left',
            playerId: playerId
        }, playerId);
        
        // Update region activity
        region.lastActivity = Date.now();
        
        console.log(`Player ${playerId} left region ${regionId}`);
    }
    
    getStartingRegion(player) {
        // For new players, return starter region
        if (player.level <= 5) {
            return 'starter_plains';
        }
        
        // For existing players, try to find their last region
        const lastRegion = this.playerRegions.get(player.id);
        if (lastRegion && this.regions.has(lastRegion)) {
            return lastRegion;
        }
        
        // Find appropriate region based on level
        for (const [id, region] of this.regions) {
            if (player.level >= region.levelRange.min && 
                player.level <= region.levelRange.max) {
                return id;
            }
        }
        
        // Fallback to starter region
        return 'starter_plains';
    }
    
    async findAvailableRegion(preferredRegionId, playerLevel) {
        const preferredRegion = this.regions.get(preferredRegionId);
        if (!preferredRegion) return null;
        
        // Check if preferred region has space
        if (preferredRegion.players.size < this.settings.maxPlayersPerRegion) {
            return preferredRegionId;
        }
        
        // Find nearby region with same type and appropriate level
        for (const [id, region] of this.regions) {
            if (id === preferredRegionId) continue;
            
            if (region.type === preferredRegion.type &&
                playerLevel >= region.levelRange.min &&
                playerLevel <= region.levelRange.max &&
                region.players.size < this.settings.maxPlayersPerRegion) {
                
                // Check if regions are adjacent
                if (this.areRegionsAdjacent(preferredRegion, region)) {
                    return id;
                }
            }
        }
        
        // Create new instance if needed
        return await this.createRegionInstance(preferredRegionId);
    }
    
    areRegionsAdjacent(region1, region2) {
        // Simple adjacency check based on bounds
        const distance = Math.sqrt(
            Math.pow(region1.bounds.x - region2.bounds.x, 2) +
            Math.pow(region1.bounds.y - region2.bounds.y, 2)
        );
        
        return distance <= 300; // Regions within 300 units are considered adjacent
    }
    
    async createRegionInstance(baseRegionId) {
        const baseRegion = this.regions.get(baseRegionId);
        if (!baseRegion) return null;
        
        const instanceId = `${baseRegionId}_instance_${Date.now()}`;
        
        const instance = {
            ...baseRegion,
            id: instanceId,
            baseRegionId: baseRegionId,
            isInstance: true,
            players: new Set(),
            npcs: new Map(),
            monsters: new Map(),
            items: new Map(),
            resources: new Map(),
            loaded: false,
            createdAt: Date.now()
        };
        
        this.regions.set(instanceId, instance);
        await this.saveRegion(instance);
        
        console.log(`Created instance ${instanceId} from base region ${baseRegionId}`);
        return instanceId;
    }
    
    getSpawnPoint(region, type) {
        const spawnPoints = region.spawnPoints.filter(sp => sp.type === type);
        
        if (spawnPoints.length === 0) {
            // Fallback to region center
            return {
                x: region.bounds.x + region.bounds.width / 2,
                y: region.bounds.y + region.bounds.height / 2
            };
        }
        
        // Return random spawn point of type
        const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        return {
            x: spawnPoint.x + (Math.random() - 0.5) * 10,
            y: spawnPoint.y + (Math.random() - 0.5) * 10
        };
    }
    
    // Region management
    async loadRegion(regionId) {
        const region = this.regions.get(regionId);
        if (!region || region.loaded) return;
        
        // Load region entities
        await this.loadRegionEntities(region);
        
        // Start region systems
        this.startRegionSystems(region);
        
        region.loaded = true;
        this.activeRegions.add(regionId);
        
        console.log(`Loaded region ${regionId}`);
    }
    
    async loadRegionEntities(region) {
        // Load NPCs
        for (const npcType of region.npcs) {
            const positions = this.getNPCSpawnPositions(region, npcType);
            for (const pos of positions) {
                this.spawnNPC(region.id, npcType, pos.x, pos.y);
            }
        }
        
        // Load monsters
        for (const monsterType of region.monsters) {
            const positions = this.getMonsterSpawnPositions(region, monsterType);
            for (const pos of positions) {
                this.spawnMonster(region.id, monsterType, pos.x, pos.y);
            }
        }
        
        // Load resources
        for (const resourceType of region.resources) {
            const positions = this.getResourceSpawnPositions(region, resourceType);
            for (const pos of positions) {
                this.spawnResource(region.id, resourceType, pos.x, pos.y);
            }
        }
    }
    
    startRegionSystems(region) {
        // Start region update loop
        region.updateInterval = setInterval(() => {
            this.updateRegion(region.id);
        }, 1000);
        
        // Start monster respawn
        region.respawnInterval = setInterval(() => {
            this.respawnMonsters(region.id);
        }, 30000); // Respawn every 30 seconds
        
        // Start resource respawn
        region.resourceInterval = setInterval(() => {
            this.respawnResources(region.id);
        }, 60000); // Respawn every minute
    }
    
    updateRegion(regionId) {
        const region = this.regions.get(regionId);
        if (!region || !region.loaded) return;
        
        // Update monsters
        for (const [monsterId, monster] of region.monsters) {
            this.updateMonster(regionId, monsterId);
        }
        
        // Update NPCs
        for (const [npcId, npc] of region.npcs) {
            this.updateNPC(regionId, npcId);
        }
        
        // Update region events
        this.updateRegionEvents(regionId);
        
        // Update environment
        this.updateRegionEnvironment(regionId);
    }
    
    // Entity spawning
    spawnMonster(regionId, monsterType, x, y) {
        const region = this.regions.get(regionId);
        if (!region) return null;
        
        const monster = {
            id: `monster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: monsterType,
            x: x,
            y: y,
            regionId: regionId,
            
            // Stats
            level: this.getMonsterLevel(region, monsterType),
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            
            // Combat
            attack: 10,
            defense: 5,
            speed: 1,
            
            // AI
            aiState: 'idle',
            target: null,
            patrolPath: [],
            homePosition: { x, y },
            aggroRadius: 50,
            
            // Respawn
            respawnTime: 30000,
            lastDeath: null,
            
            // Loot
            lootTable: this.getMonsterLootTable(monsterType),
            
            // Metadata
            spawnedAt: Date.now(),
            lastUpdate: Date.now()
        };
        
        region.monsters.set(monster.id, monster);
        
        // Notify players
        this.notifyRegionPlayers(regionId, {
            type: 'monster_spawned',
            monster: this.getMonsterDataForClient(monster)
        });
        
        return monster.id;
    }
    
    spawnNPC(regionId, npcType, x, y) {
        const region = this.regions.get(regionId);
        if (!region) return null;
        
        const npc = {
            id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: npcType,
            name: this.getNPCName(npcType),
            x: x,
            y: y,
            regionId: regionId,
            
            // Appearance
            sprite: this.getNPCSprite(npcType),
            
            // Behavior
            behavior: this.getNPCBehavior(npcType),
            dialogue: this.getNPCDialogue(npcType),
            quests: this.getNPCQuests(npcType),
            shop: this.getNPCShop(npcType),
            
            // Movement
            canMove: this.getNPCCanMove(npcType),
            moveSpeed: 0.5,
            patrolPath: [],
            
            // Metadata
            spawnedAt: Date.now(),
            lastUpdate: Date.now()
        };
        
        region.npcs.set(npc.id, npc);
        
        // Notify players
        this.notifyRegionPlayers(regionId, {
            type: 'npc_spawned',
            npc: this.getNPCDataForClient(npc)
        });
        
        return npc.id;
    }
    
    spawnResource(regionId, resourceType, x, y) {
        const region = this.regions.get(regionId);
        if (!region) return null;
        
        const resource = {
            id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: resourceType,
            x: x,
            y: y,
            regionId: regionId,
            
            // Resource properties
            amount: this.getResourceAmount(resourceType),
            maxAmount: this.getResourceMaxAmount(resourceType),
            respawnTime: this.getResourceRespawnTime(resourceType),
            
            // Gathering
            requiredSkill: this.getResourceRequiredSkill(resourceType),
            requiredLevel: this.getResourceRequiredLevel(resourceType),
            toolRequired: this.getResourceToolRequired(resourceType),
            
            // Metadata
            spawnedAt: Date.now(),
            lastHarvested: null
        };
        
        region.resources.set(resource.id, resource);
        
        // Notify players
        this.notifyRegionPlayers(regionId, {
            type: 'resource_spawned',
            resource: this.getResourceDataForClient(resource)
        });
        
        return resource.id;
    }
    
    spawnItem(regionId, itemType, x, y, quantity = 1) {
        const region = this.regions.get(regionId);
        if (!region) return null;
        
        const item = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: itemType,
            x: x,
            y: y,
            regionId: regionId,
            quantity: quantity,
            
            // Item properties
            name: this.getItemName(itemType),
            rarity: this.getItemRarity(itemType),
            value: this.getItemValue(itemType),
            stackable: this.getItemStackable(itemType),
            
            // Despawn
            despawnTime: 300000, // 5 minutes
            spawnedAt: Date.now()
        };
        
        region.items.set(item.id, item);
        
        // Notify players
        this.notifyRegionPlayers(regionId, {
            type: 'item_spawned',
            item: this.getItemDataForClient(item)
        });
        
        return item.id;
    }
    
    // Exploration system
    async discoverRegion(playerId, regionId) {
        const player = this.connectedPlayers.get(playerId);
        if (!player) return;
        
        // Get player exploration data
        const explorationData = await this.getPlayerExplorationData(playerId);
        
        if (!explorationData.discoveredRegions.includes(regionId)) {
            explorationData.discoveredRegions.push(regionId);
            await this.savePlayerExplorationData(playerId, explorationData);
            
            // Notify player
            this.sendToPlayer(playerId, {
                type: 'region_discovered',
                regionId: regionId,
                regionName: this.regions.get(regionId)?.name || 'Unknown'
            });
            
            console.log(`Player ${player.name} discovered region ${regionId}`);
        }
    }
    
    async exploreArea(playerId, x, y, radius) {
        const player = this.connectedPlayers.get(playerId);
        if (!player) return;
        
        const regionId = this.playerRegions.get(playerId);
        const region = this.regions.get(regionId);
        if (!region) return;
        
        // Get player exploration data
        const explorationData = await this.getPlayerExplorationData(playerId);
        
        // Check what's in the area
        const discoveredEntities = [];
        
        // Check for POIs
        for (const poi of region.poi) {
            const distance = Math.sqrt(Math.pow(poi.x - x, 2) + Math.pow(poi.y - y, 2));
            if (distance <= radius) {
                if (!explorationData.discoveredPOI.includes(poi.id)) {
                    explorationData.discoveredPOI.push(poi.id);
                    discoveredEntities.push({ type: 'poi', data: poi });
                }
            }
        }
        
        // Check for resources
        for (const [resourceId, resource] of region.resources) {
            const distance = Math.sqrt(Math.pow(resource.x - x, 2) + Math.pow(resource.y - y, 2));
            if (distance <= radius) {
                if (!explorationData.discoveredResources.includes(resourceId)) {
                    explorationData.discoveredResources.push(resourceId);
                    discoveredEntities.push({ type: 'resource', data: resource });
                }
            }
        }
        
        // Save exploration data
        await this.savePlayerExplorationData(playerId, explorationData);
        
        // Notify player of discoveries
        if (discoveredEntities.length > 0) {
            this.sendToPlayer(playerId, {
                type: 'area_explored',
                x: x,
                y: y,
                radius: radius,
                discoveries: discoveredEntities
            });
        }
        
        return discoveredEntities;
    }
    
    async getDiscoveredRegions(playerId) {
        const explorationData = await this.getPlayerExplorationData(playerId);
        return explorationData.discoveredRegions;
    }
    
    async isAreaExplored(playerId, x, y) {
        const explorationData = await this.getPlayerExplorationData(playerId);
        
        // Check if any discovered POI or resource is near this position
        for (const poiId of explorationData.discoveredPOI) {
            // This would need to be implemented to check actual POI positions
        }
        
        return false;
    }
    
    // World events
    createWorldEvent(eventType, data) {
        const event = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            data: data,
            startTime: Date.now(),
            duration: data.duration || 300000, // 5 minutes default
            affectedRegions: data.regions || [],
            participants: new Set(),
            rewards: data.rewards || {},
            
            // Event state
            active: true,
            progress: 0,
            objectives: data.objectives || [],
            
            // Metadata
            createdAt: Date.now()
        };
        
        this.worldEvents.set(event.id, event);
        
        // Start event
        this.startWorldEvent(event);
        
        return event.id;
    }
    
    startWorldEvent(event) {
        // Notify affected regions
        for (const regionId of event.affectedRegions) {
            const region = this.regions.get(regionId);
            if (region) {
                region.activeEvents.add(event.id);
                
                // Notify players in region
                this.notifyRegionPlayers(regionId, {
                    type: 'world_event_started',
                    event: this.getEventDataForClient(event)
                });
            }
        }
        
        // Start event timer
        setTimeout(() => {
            this.endWorldEvent(event.id);
        }, event.duration);
        
        console.log(`World event ${event.type} started`);
    }
    
    endWorldEvent(eventId) {
        const event = this.worldEvents.get(eventId);
        if (!event) return;
        
        event.active = false;
        event.endTime = Date.now();
        
        // Calculate rewards
        const rewards = this.calculateEventRewards(event);
        
        // Distribute rewards to participants
        for (const playerId of event.participants) {
            this.awardEventRewards(playerId, rewards);
        }
        
        // Notify affected regions
        for (const regionId of event.affectedRegions) {
            const region = this.regions.get(regionId);
            if (region) {
                region.activeEvents.delete(eventId);
                region.eventHistory.push({
                    eventId: eventId,
                    type: event.type,
                    completedAt: Date.now()
                });
                
                // Notify players in region
                this.notifyRegionPlayers(regionId, {
                    type: 'world_event_ended',
                    event: this.getEventDataForClient(event),
                    rewards: rewards
                });
            }
        }
        
        // Remove from active events
        this.worldEvents.delete(eventId);
        
        console.log(`World event ${event.type} ended`);
    }
    
    // Utility methods
    getMonsterLevel(region, monsterType) {
        const baseLevel = Math.floor((region.levelRange.min + region.levelRange.max) / 2);
        const variance = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(1, baseLevel + variance);
    }
    
    getMonsterLootTable(monsterType) {
        const lootTables = {
            goblin: ['gold', 'cloth', 'rusty_dagger'],
            wolf: ['wolf_pelt', 'wolf_fang', 'meat'],
            bear: ['bear_pelt', 'bear_claws', 'meat'],
            orc: ['gold', 'iron_ore', 'orc_axe'],
            troll: ['troll_blood', 'rare_gems', 'magic_essence']
        };
        
        return lootTables[monsterType] || ['gold'];
    }
    
    getNPCName(npcType) {
        const names = {
            merchant: 'Mercador Joaquim',
            guard: 'Guarda Real',
            quest_giver: 'Ancião Sábio',
            herbalist: 'Herbalista Maria',
            blacksmith: 'Ferreiro Thorin',
            alchemist: 'Alquimista Elara'
        };
        
        return names[npcType] || npcType;
    }
    
    getNPCSprite(npcType) {
        const sprites = {
            merchant: 'merchant_male_01',
            guard: 'guard_01',
            quest_giver: 'elder_01',
            herbalist: 'herbalist_female_01',
            blacksmith: 'blacksmith_01',
            alchemist: 'alchemist_01'
        };
        
        return sprites[npcType] || 'npc_01';
    }
    
    // Communication methods
    notifyRegionPlayers(regionId, message, excludePlayerId = null) {
        const region = this.regions.get(regionId);
        if (!region) return;
        
        for (const playerId of region.players) {
            if (playerId !== excludePlayerId) {
                this.sendToPlayer(playerId, message);
            }
        }
    }
    
    sendToPlayer(playerId, message) {
        // This would be handled by the network manager
        console.log(`Sending to player ${playerId}:`, message);
    }
    
    sendRegionData(playerId, regionId) {
        const region = this.regions.get(regionId);
        if (!region) return;
        
        const regionData = {
            type: 'region_data',
            regionId: regionId,
            name: region.name,
            type: region.type,
            bounds: region.bounds,
            weather: region.weather,
            players: Array.from(region.players),
            npcs: Array.from(region.npcs.values()).map(npc => this.getNPCDataForClient(npc)),
            monsters: Array.from(region.monsters.values()).map(monster => this.getMonsterDataForClient(monster)),
            items: Array.from(region.items.values()).map(item => this.getItemDataForClient(item)),
            resources: Array.from(region.resources.values()).map(resource => this.getResourceDataForClient(resource)),
            poi: region.poi
        };
        
        this.sendToPlayer(playerId, regionData);
    }
    
    // Data transformation for client
    getMonsterDataForClient(monster) {
        return {
            id: monster.id,
            type: monster.type,
            x: monster.x,
            y: monster.y,
            level: monster.level,
            health: monster.health,
            maxHealth: monster.maxHealth
        };
    }
    
    getNPCDataForClient(npc) {
        return {
            id: npc.id,
            type: npc.type,
            name: npc.name,
            x: npc.x,
            y: npc.y,
            sprite: npc.sprite
        };
    }
    
    getItemDataForClient(item) {
        return {
            id: item.id,
            type: item.type,
            name: item.name,
            x: item.x,
            y: item.y,
            quantity: item.quantity,
            rarity: item.rarity
        };
    }
    
    getResourceDataForClient(resource) {
        return {
            id: resource.id,
            type: resource.type,
            x: resource.x,
            y: resource.y,
            amount: resource.amount,
            maxAmount: resource.maxAmount
        };
    }
    
    getEventDataForClient(event) {
        return {
            id: event.id,
            type: event.type,
            startTime: event.startTime,
            duration: event.duration,
            progress: event.progress,
            objectives: event.objectives
        };
    }
    
    // Database operations
    async saveRegion(region) {
        try {
            // Simplified region saving - just log for now
            console.log(`Saving region ${region.id}...`);
        } catch (error) {
            console.error(`Error saving region ${region.id}:`, error);
        }
    }
    
    async saveWorldState() {
        try {
            const worldState = {
                ...this.worldState,
                activeRegions: Array.from(this.activeRegions),
                lastSave: Date.now()
            };
            
            // Simplified - just log for now since database.set is not available
            console.log('Saving world state with', this.activeRegions.size, 'active regions');
            // TODO: Implement proper database saving with SQL INSERT/UPDATE
            
            // Save active regions
            for (const regionId of this.activeRegions) {
                const region = this.regions.get(regionId);
                if (region) {
                    await this.saveRegion(region);
                }
            }
            
            console.log('World state saved');
        } catch (error) {
            console.error('Error saving world state:', error);
        }
    }
    
    async getPlayerExplorationData(playerId) {
        try {
            const data = await this.database.get(`exploration_${playerId}`);
            return data || {
                discoveredRegions: [],
                discoveredPOI: [],
                discoveredResources: [],
                exploredAreas: []
            };
        } catch (error) {
            console.error(`Error loading exploration data for player ${playerId}:`, error);
            return {
                discoveredRegions: [],
                discoveredPOI: [],
                discoveredResources: [],
                exploredAreas: []
            };
        }
    }
    
    async savePlayerExplorationData(playerId, data) {
        try {
            await this.database.set(`exploration_${playerId}`, data);
        } catch (error) {
            console.error(`Error saving exploration data for player ${playerId}:`, error);
        }
    }
    
    async loadPlayerExploration(playerId) {
        const explorationData = await this.getPlayerExplorationData(playerId);
        
        // Restore discovered regions
        for (const regionId of explorationData.discoveredRegions) {
            // Notify player of already discovered regions
            this.sendToPlayer(playerId, {
                type: 'region_discovered',
                regionId: regionId,
                regionName: this.regions.get(regionId)?.name || 'Unknown',
                silent: true
            });
        }
    }
    
    async savePlayerExploration(playerId) {
        // This is called when player disconnects
        // Exploration data is already saved during discovery
    }
    
    // Update loops
    updateWorld() {
        // Update world time
        this.worldState.currentTime = Date.now();
        
        // Update all active regions
        for (const regionId of this.activeRegions) {
            this.updateRegion(regionId);
        }
        
        // Update connected players
        for (const [playerId, player] of this.connectedPlayers) {
            this.updatePlayer(playerId);
        }
    }
    
    updateWorldEvents() {
        // Check for scheduled events
        this.checkScheduledEvents();
        
        // Update active events
        for (const [eventId, event] of this.worldEvents) {
            this.updateWorldEvent(eventId);
        }
    }
    
    updateDayNightCycle() {
        this.worldState.dayNightCycle = (this.worldState.dayNightCycle + 1) % 24;
        
        // Notify all players of time change
        for (const playerId of this.connectedPlayers.keys()) {
            this.sendToPlayer(playerId, {
                type: 'time_update',
                hour: this.worldState.dayNightCycle,
                isDay: this.worldState.dayNightCycle >= 6 && this.worldState.dayNightCycle < 18
            });
        }
    }
    
    updateWeather() {
        // Simple weather change logic
        const weatherTypes = ['clear', 'cloudy', 'rain', 'storm'];
        const currentWeatherIndex = weatherTypes.indexOf(this.worldState.weather);
        const newWeatherIndex = (currentWeatherIndex + Math.floor(Math.random() * 3) - 1) % weatherTypes.length;
        
        this.worldState.weather = weatherTypes[Math.max(0, newWeatherIndex)];
        
        // Update all regions
        for (const region of this.regions.values()) {
            region.weather = this.worldState.weather;
        }
        
        // Notify all players
        for (const playerId of this.connectedPlayers.keys()) {
            this.sendToPlayer(playerId, {
                type: 'weather_update',
                weather: this.worldState.weather
            });
        }
    }
    
    cleanupInactiveRegions() {
        const now = Date.now();
        const inactiveThreshold = 300000; // 5 minutes
        
        for (const [regionId, region] of this.regions) {
            if (region.loaded && region.players.size === 0 && 
                (now - region.lastActivity) > inactiveThreshold) {
                
                // Unload region
                this.unloadRegion(regionId);
            }
        }
    }
    
    unloadRegion(regionId) {
        const region = this.regions.get(regionId);
        if (!region || !region.loaded) return;
        
        // Clear update intervals
        if (region.updateInterval) {
            clearInterval(region.updateInterval);
        }
        if (region.respawnInterval) {
            clearInterval(region.respawnInterval);
        }
        if (region.resourceInterval) {
            clearInterval(region.resourceInterval);
        }
        
        // Save region state
        this.saveRegion(region);
        
        // Clear entities
        region.npcs.clear();
        region.monsters.clear();
        region.items.clear();
        region.resources.clear();
        
        region.loaded = false;
        this.activeRegions.delete(regionId);
        
        console.log(`Unloaded region ${regionId}`);
    }
    
    // Placeholder methods for features to be implemented
    updateMonster(regionId, monsterId) {
        // Monster AI and behavior updates
    }
    
    updateNPC(regionId, npcId) {
        // NPC behavior updates
    }
    
    updateRegionEvents(regionId) {
        // Region-specific event updates
    }
    
    updateRegionEnvironment(regionId) {
        // Environmental updates
    }
    
    respawnMonsters(regionId) {
        // Monster respawn logic
    }
    
    respawnResources(regionId) {
        // Resource respawn logic
    }
    
    updatePlayer(playerId) {
        // Player state updates
    }
    
    checkScheduledEvents() {
        // Check for scheduled world events
    }
    
    updateWorldEvent(eventId) {
        // Update specific world event
    }
    
    triggerRegionEvent(regionId, eventType, data) {
        // Trigger region-specific event
    }
    
    getActiveEvents() {
        // Get all active world events
        return Array.from(this.worldEvents.values());
    }
    
    getRegionEvents(regionId) {
        // Get events for specific region
        const region = this.regions.get(regionId);
        return region ? Array.from(region.activeEvents) : [];
    }
    
    calculateEventRewards(event) {
        // Calculate rewards for event completion
        return {
            xp: 1000,
            gold: 500,
            items: ['event_token']
        };
    }
    
    awardEventRewards(playerId, rewards) {
        // Award rewards to player
        this.sendToPlayer(playerId, {
            type: 'rewards_awarded',
            rewards: rewards
        });
    }
    
    // Helper methods to be implemented
    getNPCSpawnPositions(region, npcType) {
        return [{ x: region.bounds.x + 50, y: region.bounds.y + 50 }];
    }
    
    getMonsterSpawnPositions(region, monsterType) {
        const positions = [];
        for (let i = 0; i < 5; i++) {
            positions.push({
                x: region.bounds.x + Math.random() * region.bounds.width,
                y: region.bounds.y + Math.random() * region.bounds.height
            });
        }
        return positions;
    }
    
    getResourceSpawnPositions(region, resourceType) {
        const positions = [];
        for (let i = 0; i < 10; i++) {
            positions.push({
                x: region.bounds.x + Math.random() * region.bounds.width,
                y: region.bounds.y + Math.random() * region.bounds.height
            });
        }
        return positions;
    }
    
    getNPCBehavior(npcType) {
        return 'idle';
    }
    
    getNPCDialogue(npcType) {
        return {};
    }
    
    getNPCQuests(npcType) {
        return [];
    }
    
    getNPCShop(npcType) {
        return null;
    }
    
    getNPCCanMove(npcType) {
        return false;
    }
    
    getResourceAmount(resourceType) {
        return 100;
    }
    
    getResourceMaxAmount(resourceType) {
        return 100;
    }
    
    getResourceRespawnTime(resourceType) {
        return 300000;
    }
    
    getResourceRequiredSkill(resourceType) {
        return null;
    }
    
    getResourceRequiredLevel(resourceType) {
        return 1;
    }
    
    getResourceToolRequired(resourceType) {
        return null;
    }
    
    getItemName(itemType) {
        return itemType;
    }
    
    getItemRarity(itemType) {
        return 'common';
    }
    
    getItemValue(itemType) {
        return 10;
    }
    
    getItemStackable(itemType) {
        return true;
    }
    
    // Event emitter methods for compatibility
    on(event, callback) {
        // Simplified event handling - just log for now
        console.log(`WorldManager: Event listener added for ${event}`);
    }
    
    emit(event, ...args) {
        // Simplified event emitting - just log for now
        console.log(`WorldManager: Event emitted: ${event}`);
    }
    
    getWorldStats() {
        return {
            totalRegions: this.regions.size,
            activeInstances: this.worldState.instances.size,
            activeEvents: this.worldState.globalEvents.size,
            currentTime: this.worldState.currentTime
        };
    }
}

module.exports = WorldManager;
