/**
 * Dungeon Generator - Procedural Dungeon System
 * Creates randomized dungeons with rooms, corridors, and encounters
 * Version 0.3 - First Playable Gameplay Systems
 */

class DungeonGenerator {
    constructor(worldManager) {
        this.worldManager = worldManager;
        this.server = worldManager.server;
        
        // Dungeon configuration
        this.config = {
            minRoomSize: 5,
            maxRoomSize: 15,
            minRooms: 5,
            maxRooms: 20,
            corridorWidth: 2,
            maxCorridorLength: 10,
            
            // Dungeon types
            dungeonTypes: {
                cave: {
                    name: 'Cave',
                    roomShape: 'irregular',
                    corridorChance: 0.3,
                    monsterDensity: 0.8,
                    treasureDensity: 0.4,
                    trapDensity: 0.2
                },
                crypt: {
                    name: 'Crypt',
                    roomShape: 'rectangular',
                    corridorChance: 0.8,
                    monsterDensity: 0.9,
                    treasureDensity: 0.6,
                    trapDensity: 0.4
                },
                fortress: {
                    name: 'Fortress',
                    roomShape: 'rectangular',
                    corridorChance: 0.9,
                    monsterDensity: 0.7,
                    treasureDensity: 0.5,
                    trapDensity: 0.3
                },
                temple: {
                    name: 'Temple',
                    roomShape: 'circular',
                    corridorChance: 0.6,
                    monsterDensity: 0.6,
                    treasureDensity: 0.8,
                    trapDensity: 0.2
                },
                laboratory: {
                    name: 'Laboratory',
                    roomShape: 'rectangular',
                    corridorChance: 0.7,
                    monsterDensity: 0.5,
                    treasureDensity: 0.7,
                    trapDensity: 0.6
                }
            },
            
            // Room types
            roomTypes: {
                entrance: {
                    weight: 10,
                    guaranteedFeatures: ['entrance_door'],
                    possibleFeatures: ['torch', 'chest']
                },
                hallway: {
                    weight: 30,
                    guaranteedFeatures: [],
                    possibleFeatures: ['torch', 'trap', 'monster']
                },
                storage: {
                    weight: 20,
                    guaranteedFeatures: ['chest'],
                    possibleFeatures: ['barrels', 'crates', 'monster']
                },
                barracks: {
                    weight: 15,
                    guaranteedFeatures: ['beds'],
                    possibleFeatures: ['chest', 'armor_stand', 'monster']
                },
                treasury: {
                    weight: 5,
                    guaranteedFeatures: ['chest'],
                    possibleFeatures: ['gold_pile', 'jewels', 'trap']
                },
                ritual: {
                    weight: 8,
                    guaranteedFeatures: ['altar'],
                    possibleFeatures: ['candles', 'magic_rune', 'monster']
                },
                prison: {
                    weight: 7,
                    guaranteedFeatures: ['cells'],
                    possibleFeatures: ['chains', 'monster', 'chest']
                },
                library: {
                    weight: 5,
                    guaranteedFeatures: ['bookshelves'],
                    possibleFeatures: ['scrolls', 'chest', 'monster']
                }
            },
            
            // Boss rooms
            bossRoomTypes: {
                throne: {
                    name: 'Throne Room',
                    requiredFeatures: ['throne', 'boss_spawn'],
                    optionalFeatures: ['guards', 'treasure']
                },
                arena: {
                    name: 'Arena',
                    requiredFeatures: ['boss_spawn', 'spectator_seats'],
                    optionalFeatures: ['weapons_rack', 'treasure']
                },
                sanctum: {
                    name: 'Sanctum',
                    requiredFeatures: ['altar', 'boss_spawn'],
                    optionalFeatures: ['pillars', 'magic_rune', 'treasure']
                },
                cavern: {
                    name: 'Great Cavern',
                    requiredFeatures: ['boss_spawn'],
                    optionalFeatures: ['stalactites', 'lava_pool', 'treasure']
                }
            }
        };
        
        // Active dungeons
        this.activeDungeons = new Map();
        this.dungeonInstances = new Map();
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Start dungeon update loop
        this.startUpdateLoop();
        
        console.log('Dungeon Generator initialized');
    }
    
    startUpdateLoop() {
        setInterval(() => {
            this.update();
        }, 60000); // Update every minute
    }
    
    update() {
        // Update active dungeons
        this.updateActiveDungeons();
        
        // Clean up empty instances
        this.cleanupEmptyInstances();
        
        // Generate new dungeons if needed
        this.maintainDungeonPool();
    }
    
    // Main dungeon generation
    generateDungeon(options = {}) {
        const dungeonType = options.type || this.getRandomDungeonType();
        const tier = options.tier || 1;
        const size = options.size || 'medium';
        const seed = options.seed || Date.now();
        
        // Set random seed for reproducible generation
        this.setRandomSeed(seed);
        
        const dungeon = {
            id: this.generateDungeonId(),
            type: dungeonType,
            tier: tier,
            size: size,
            seed: seed,
            width: this.getDungeonWidth(size),
            height: this.getDungeonHeight(size),
            rooms: [],
            corridors: [],
            features: [],
            monsters: [],
            treasures: [],
            traps: [],
            entrance: null,
            bossRoom: null,
            created: Date.now(),
            lastActivity: Date.now(),
            instances: new Map()
        };
        
        // Generate dungeon layout
        this.generateDungeonLayout(dungeon);
        
        // Place features
        this.placeDungeonFeatures(dungeon);
        
        // Place monsters
        this.placeMonsters(dungeon);
        
        // Place treasures
        this.placeTreasures(dungeon);
        
        // Place traps
        this.placeTraps(dungeon);
        
        // Create boss room
        this.createBossRoom(dungeon);
        
        // Save dungeon
        this.saveDungeon(dungeon);
        
        console.log(`Generated ${dungeonType} dungeon (${dungeon.id}) with ${dungeon.rooms.length} rooms`);
        
        return dungeon;
    }
    
    generateDungeonLayout(dungeon) {
        const typeConfig = this.config.dungeonTypes[dungeon.type];
        const roomCount = this.getRandomInt(this.config.minRooms, this.config.maxRooms);
        
        // Generate rooms
        for (let i = 0; i < roomCount; i++) {
            const room = this.generateRoom(dungeon, i === 0);
            if (this.isValidRoomPosition(dungeon, room)) {
                dungeon.rooms.push(room);
            }
        }
        
        // Generate corridors
        if (Math.random() < typeConfig.corridorChance) {
            this.generateCorridors(dungeon);
        } else {
            this.connectRoomsDirectly(dungeon);
        }
        
        // Set entrance
        if (dungeon.rooms.length > 0) {
            dungeon.entrance = dungeon.rooms[0];
            dungeon.entrance.type = 'entrance';
        }
    }
    
    generateRoom(dungeon, isEntrance = false) {
        const typeConfig = this.config.dungeonTypes[dungeon.type];
        let width, height;
        
        if (typeConfig.roomShape === 'circular') {
            const radius = this.getRandomInt(this.config.minRoomSize, this.config.maxRoomSize);
            width = height = radius * 2;
        } else {
            width = this.getRandomInt(this.config.minRoomSize, this.config.maxRoomSize);
            height = this.getRandomInt(this.config.minRoomSize, this.config.maxRoomSize);
        }
        
        const room = {
            id: this.generateRoomId(),
            x: this.getRandomInt(1, dungeon.width - width - 1),
            y: this.getRandomInt(1, dungeon.height - height - 1),
            width: width,
            height: height,
            shape: typeConfig.roomShape,
            type: isEntrance ? 'entrance' : this.selectRoomType(),
            connected: false,
            features: [],
            monsters: [],
            treasures: [],
            traps: []
        };
        
        return room;
    }
    
    selectRoomType() {
        const roomTypes = Object.keys(this.config.roomTypes);
        const weights = roomTypes.map(type => this.config.roomTypes[type].weight);
        
        return this.weightedRandom(roomTypes, weights);
    }
    
    isValidRoomPosition(dungeon, newRoom) {
        // Check if room overlaps with existing rooms
        for (const room of dungeon.rooms) {
            if (this.roomsOverlap(room, newRoom)) {
                return false;
            }
        }
        
        // Check if room is within dungeon bounds
        if (newRoom.x < 0 || newRoom.y < 0 || 
            newRoom.x + newRoom.width > dungeon.width || 
            newRoom.y + newRoom.height > dungeon.height) {
            return false;
        }
        
        return true;
    }
    
    roomsOverlap(room1, room2) {
        return !(room1.x + room1.width < room2.x || 
                 room2.x + room2.width < room1.x || 
                 room1.y + room1.height < room2.y || 
                 room2.y + room2.height < room1.y);
    }
    
    generateCorridors(dungeon) {
        // Connect rooms with corridors
        for (let i = 0; i < dungeon.rooms.length - 1; i++) {
            const room1 = dungeon.rooms[i];
            const room2 = dungeon.rooms[i + 1];
            
            const corridor = this.createCorridor(room1, room2);
            dungeon.corridors.push(corridor);
            
            room1.connected = true;
            room2.connected = true;
        }
    }
    
    connectRoomsDirectly(dungeon) {
        // Connect rooms directly without corridors
        for (let i = 0; i < dungeon.rooms.length - 1; i++) {
            const room1 = dungeon.rooms[i];
            const room2 = dungeon.rooms[i + 1];
            
            // Create direct connection
            this.createDirectConnection(room1, room2);
            
            room1.connected = true;
            room2.connected = true;
        }
    }
    
    createCorridor(room1, room2) {
        const startX = room1.x + Math.floor(room1.width / 2);
        const startY = room1.y + Math.floor(room1.height / 2);
        const endX = room2.x + Math.floor(room2.width / 2);
        const endY = room2.y + Math.floor(room2.height / 2);
        
        const corridor = {
            id: this.generateCorridorId(),
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            width: this.config.corridorWidth,
            path: []
        };
        
        // Generate L-shaped path
        const midX = startX;
        const midY = endY;
        
        // Path from start to midpoint
        for (let x = Math.min(startX, midX); x <= Math.max(startX, midX); x++) {
            corridor.path.push({ x: x, y: startY });
        }
        
        // Path from midpoint to end
        for (let y = Math.min(startY, midY); y <= Math.max(startY, midY); y++) {
            corridor.path.push({ x: midX, y: y });
        }
        
        for (let x = Math.min(midX, endX); x <= Math.max(midX, endX); x++) {
            corridor.path.push({ x: x, y: endY });
        }
        
        return corridor;
    }
    
    createDirectConnection(room1, room2) {
        // Create direct doorway between rooms
        const doorway = {
            id: this.generateDoorwayId(),
            from: room1.id,
            to: room2.id,
            position: this.calculateDoorwayPosition(room1, room2)
        };
        
        room1.doorways = room1.doorways || [];
        room2.doorways = room2.doorways || [];
        
        room1.doorways.push(doorway);
        room2.doorways.push(doorway);
    }
    
    calculateDoorwayPosition(room1, room2) {
        // Simple doorway calculation - place at closest edge
        const centerX1 = room1.x + room1.width / 2;
        const centerY1 = room1.y + room1.height / 2;
        const centerX2 = room2.x + room2.width / 2;
        const centerY2 = room2.y + room2.height / 2;
        
        if (Math.abs(centerX1 - centerX2) > Math.abs(centerY1 - centerY2)) {
            // Horizontal connection
            if (centerX1 < centerX2) {
                return { x: room1.x + room1.width, y: Math.floor(centerY1) };
            } else {
                return { x: room1.x, y: Math.floor(centerY1) };
            }
        } else {
            // Vertical connection
            if (centerY1 < centerY2) {
                return { x: Math.floor(centerX1), y: room1.y + room1.height };
            } else {
                return { x: Math.floor(centerX1), y: room1.y };
            }
        }
    }
    
    placeDungeonFeatures(dungeon) {
        for (const room of dungeon.rooms) {
            const roomTypeConfig = this.config.roomTypes[room.type];
            if (!roomTypeConfig) continue;
            
            // Place guaranteed features
            for (const feature of roomTypeConfig.guaranteedFeatures) {
                this.placeFeature(room, feature, true);
            }
            
            // Place possible features
            for (const feature of roomTypeConfig.possibleFeatures) {
                if (Math.random() < 0.3) { // 30% chance for each possible feature
                    this.placeFeature(room, feature, false);
                }
            }
        }
    }
    
    placeFeature(room, featureType, guaranteed) {
        const feature = {
            id: this.generateFeatureId(),
            type: featureType,
            x: 0,
            y: 0,
            properties: this.getFeatureProperties(featureType)
        };
        
        // Find valid position for feature
        const position = this.findFeaturePosition(room, feature);
        if (position) {
            feature.x = position.x;
            feature.y = position.y;
            room.features.push(feature);
            dungeon.features.push(feature);
        }
    }
    
    getFeatureProperties(featureType) {
        const featureProperties = {
            chest: {
                locked: Math.random() < 0.3,
                trapped: Math.random() < 0.2,
                gold: Math.floor(Math.random() * 100) + 50,
                items: this.generateLootItems()
            },
            torch: {
                lit: true,
                radius: 5
            },
            trap: {
                type: this.getRandomTrapType(),
                damage: Math.floor(Math.random() * 20) + 10,
                triggered: false
            },
            altar: {
                type: 'dark',
                glowing: Math.random() < 0.5
            },
            throne: {
                occupied: Math.random() < 0.3,
                material: this.getRandomThroneMaterial()
            }
        };
        
        return featureProperties[featureType] || {};
    }
    
    placeMonsters(dungeon) {
        const typeConfig = this.config.dungeonTypes[dungeon.type];
        
        for (const room of dungeon.rooms) {
            if (room.type === 'entrance') continue; // No monsters in entrance
            
            const monsterCount = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < monsterCount; i++) {
                if (Math.random() < typeConfig.monsterDensity) {
                    this.placeMonster(room, dungeon);
                }
            }
        }
    }
    
    placeMonster(room, dungeon) {
        const monster = {
            id: this.generateMonsterId(),
            type: this.getRandomMonsterType(dungeon.tier),
            level: this.getMonsterLevel(dungeon.tier),
            x: 0,
            y: 0,
            health: 100,
            maxHealth: 100,
            ai: {
                state: 'patrol',
                patrolPath: [],
                homePosition: null
            }
        };
        
        // Find valid position
        const position = this.findMonsterPosition(room);
        if (position) {
            monster.x = position.x;
            monster.y = position.y;
            monster.ai.homePosition = { x: position.x, y: position.y };
            
            room.monsters.push(monster);
            dungeon.monsters.push(monster);
        }
    }
    
    placeTreasures(dungeon) {
        const typeConfig = this.config.dungeonTypes[dungeon.type];
        
        for (const room of dungeon.rooms) {
            if (Math.random() < typeConfig.treasureDensity) {
                this.placeTreasure(room, dungeon);
            }
        }
    }
    
    placeTreasure(room, dungeon) {
        const treasure = {
            id: this.generateTreasureId(),
            type: 'chest',
            x: 0,
            y: 0,
            contents: this.generateTreasureContents(dungeon.tier),
            opened: false
        };
        
        // Find valid position
        const position = this.findTreasurePosition(room);
        if (position) {
            treasure.x = position.x;
            treasure.y = position.y;
            
            room.treasures.push(treasure);
            dungeon.treasures.push(treasure);
        }
    }
    
    placeTraps(dungeon) {
        const typeConfig = this.config.dungeonTypes[dungeon.type];
        
        for (const room of dungeon.rooms) {
            if (Math.random() < typeConfig.trapDensity) {
                this.placeTrap(room, dungeon);
            }
        }
    }
    
    placeTrap(room, dungeon) {
        const trap = {
            id: this.generateTrapId(),
            type: this.getRandomTrapType(),
            x: 0,
            y: 0,
            damage: Math.floor(Math.random() * 30) + 20,
            triggered: false,
            hidden: true
        };
        
        // Find valid position
        const position = this.findTrapPosition(room);
        if (position) {
            trap.x = position.x;
            trap.y = position.y;
            
            room.traps.push(trap);
            dungeon.traps.push(trap);
        }
    }
    
    createBossRoom(dungeon) {
        const bossRoomType = this.getRandomBossRoomType();
        const bossRoomConfig = this.config.bossRoomTypes[bossRoomType];
        
        const bossRoom = {
            id: this.generateRoomId(),
            type: 'boss',
            name: bossRoomConfig.name,
            x: dungeon.width - 20,
            y: Math.floor(dungeon.height / 2) - 10,
            width: 18,
            height: 20,
            features: [],
            monsters: [],
            treasures: [],
            traps: []
        };
        
        // Add required features
        for (const feature of bossRoomConfig.requiredFeatures) {
            this.placeFeature(bossRoom, feature, true);
        }
        
        // Add optional features
        for (const feature of bossRoomConfig.optionalFeatures) {
            if (Math.random() < 0.5) {
                this.placeFeature(bossRoom, feature, false);
            }
        }
        
        // Place boss
        this.placeBoss(bossRoom, dungeon);
        
        dungeon.rooms.push(bossRoom);
        dungeon.bossRoom = bossRoom;
        
        // Connect boss room to main dungeon
        this.connectBossRoom(dungeon, bossRoom);
    }
    
    placeBoss(bossRoom, dungeon) {
        const boss = {
            id: this.generateMonsterId(),
            type: this.getRandomBossType(dungeon.tier),
            level: dungeon.tier * 10,
            x: bossRoom.x + Math.floor(bossRoom.width / 2),
            y: bossRoom.y + Math.floor(bossRoom.height / 2),
            health: 1000,
            maxHealth: 1000,
            isBoss: true,
            ai: {
                state: 'idle',
                abilities: this.generateBossAbilities(dungeon.tier)
            }
        };
        
        bossRoom.monsters.push(boss);
        dungeon.monsters.push(boss);
    }
    
    connectBossRoom(dungeon, bossRoom) {
        // Find closest room to connect to
        let closestRoom = null;
        let closestDistance = Infinity;
        
        for (const room of dungeon.rooms) {
            if (room === bossRoom) continue;
            
            const distance = this.calculateRoomDistance(room, bossRoom);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestRoom = room;
            }
        }
        
        if (closestRoom) {
            const corridor = this.createCorridor(closestRoom, bossRoom);
            dungeon.corridors.push(corridor);
        }
    }
    
    // Dungeon instance management
    createDungeonInstance(dungeonId, playerId) {
        const dungeon = this.activeDungeons.get(dungeonId);
        if (!dungeon) {
            return null;
        }
        
        const instance = {
            id: this.generateInstanceId(),
            dungeonId: dungeonId,
            ownerId: playerId,
            players: new Set([playerId]),
            state: 'active',
            startTime: Date.now(),
            endTime: null,
            progress: {
                roomsCleared: 0,
                monstersKilled: 0,
                treasuresFound: 0,
                bossDefeated: false
            },
            customData: {}
        };
        
        // Copy dungeon data for instance
        instance.dungeonData = JSON.parse(JSON.stringify(dungeon));
        
        dungeon.instances.set(instance.id, instance);
        this.dungeonInstances.set(instance.id, instance);
        
        console.log(`Created dungeon instance ${instance.id} for player ${playerId}`);
        
        return instance;
    }
    
    joinDungeonInstance(instanceId, playerId) {
        const instance = this.dungeonInstances.get(instanceId);
        if (!instance) {
            return null;
        }
        
        instance.players.add(playerId);
        instance.lastActivity = Date.now();
        
        return instance;
    }
    
    leaveDungeonInstance(instanceId, playerId) {
        const instance = this.dungeonInstances.get(instanceId);
        if (!instance) {
            return;
        }
        
        instance.players.delete(playerId);
        instance.lastActivity = Date.now();
        
        // If no players left, mark for cleanup
        if (instance.players.size === 0) {
            instance.state = 'empty';
        }
    }
    
    // Utility methods
    getRandomDungeonType() {
        const types = Object.keys(this.config.dungeonTypes);
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getDungeonWidth(size) {
        const sizes = {
            small: 30,
            medium: 50,
            large: 70,
            huge: 100
        };
        return sizes[size] || sizes.medium;
    }
    
    getDungeonHeight(size) {
        const sizes = {
            small: 30,
            medium: 50,
            large: 70,
            huge: 100
        };
        return sizes[size] || sizes.medium;
    }
    
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[0];
    }
    
    generateLootItems() {
        // Generate random loot items
        const items = [];
        const itemCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < itemCount; i++) {
            items.push({
                id: this.generateItemId(),
                type: this.getRandomItemType(),
                quality: this.getRandomItemQuality(),
                stats: this.generateItemStats()
            });
        }
        
        return items;
    }
    
    getRandomItemType() {
        const types = ['weapon', 'armor', 'consumable', 'material'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getRandomItemQuality() {
        const qualities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const weights = [50, 30, 15, 4, 1];
        return this.weightedRandom(qualities, weights);
    }
    
    generateItemStats() {
        return {
            attack: Math.floor(Math.random() * 20) + 5,
            defense: Math.floor(Math.random() * 15) + 3,
            magic: Math.floor(Math.random() * 10) + 2
        };
    }
    
    getRandomTrapType() {
        const types = ['spike', 'fire', 'poison', 'electric', 'ice'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getRandomThroneMaterial() {
        const materials = ['gold', 'silver', 'bronze', 'marble', 'obsidian'];
        return materials[Math.floor(Math.random() * materials.length)];
    }
    
    getRandomMonsterType(tier) {
        const types = ['goblin', 'orc', 'skeleton', 'zombie', 'spider', 'wolf'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getRandomBossType(tier) {
        const types = ['dragon', 'demon', 'lich', 'giant', 'behemoth'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getMonsterLevel(tier) {
        return tier * 5 + Math.floor(Math.random() * 10);
    }
    
    getRandomBossRoomType() {
        const types = Object.keys(this.config.bossRoomTypes);
        return types[Math.floor(Math.random() * types.length)];
    }
    
    generateBossAbilities(tier) {
        const abilities = ['cleave', 'fireball', 'heal', 'summon', 'rage'];
        const count = Math.min(tier, abilities.length);
        
        const selectedAbilities = [];
        for (let i = 0; i < count; i++) {
            const ability = abilities[Math.floor(Math.random() * abilities.length)];
            if (!selectedAbilities.includes(ability)) {
                selectedAbilities.push(ability);
            }
        }
        
        return selectedAbilities;
    }
    
    generateTreasureContents(tier) {
        return {
            gold: Math.floor(Math.random() * 500 * tier) + 100,
            gems: Math.floor(Math.random() * 10 * tier) + 1,
            items: this.generateLootItems()
        };
    }
    
    calculateRoomDistance(room1, room2) {
        const centerX1 = room1.x + room1.width / 2;
        const centerY1 = room1.y + room1.height / 2;
        const centerX2 = room2.x + room2.width / 2;
        const centerY2 = room2.y + room2.height / 2;
        
        return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2));
    }
    
    findFeaturePosition(room, feature) {
        const maxAttempts = 20;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = room.x + Math.floor(Math.random() * (room.width - 2)) + 1;
            const y = room.y + Math.floor(Math.random() * (room.height - 2)) + 1;
            
            if (this.isValidFeaturePosition(room, x, y)) {
                return { x, y };
            }
        }
        
        return null;
    }
    
    findMonsterPosition(room) {
        const maxAttempts = 20;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = room.x + Math.floor(Math.random() * (room.width - 2)) + 1;
            const y = room.y + Math.floor(Math.random() * (room.height - 2)) + 1;
            
            if (this.isValidMonsterPosition(room, x, y)) {
                return { x, y };
            }
        }
        
        return null;
    }
    
    findTreasurePosition(room) {
        return this.findFeaturePosition(room, { type: 'chest' });
    }
    
    findTrapPosition(room) {
        return this.findFeaturePosition(room, { type: 'trap' });
    }
    
    isValidFeaturePosition(room, x, y) {
        // Check if position is not occupied by other features
        for (const feature of room.features) {
            if (feature.x === x && feature.y === y) {
                return false;
            }
        }
        
        return true;
    }
    
    isValidMonsterPosition(room, x, y) {
        // Check if position is not occupied
        for (const monster of room.monsters) {
            if (monster.x === x && monster.y === y) {
                return false;
            }
        }
        
        for (const feature of room.features) {
            if (feature.x === x && feature.y === y) {
                return false;
            }
        }
        
        return true;
    }
    
    setRandomSeed(seed) {
        // Simple seed implementation
        this.randomSeed = seed;
    }
    
    // ID generators
    generateDungeonId() {
        return 'dungeon_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateRoomId() {
        return 'room_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateCorridorId() {
        return 'corridor_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateDoorwayId() {
        return 'doorway_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateFeatureId() {
        return 'feature_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateMonsterId() {
        return 'monster_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateTreasureId() {
        return 'treasure_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateTrapId() {
        return 'trap_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateItemId() {
        return 'item_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateInstanceId() {
        return 'instance_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Database operations
    async saveDungeon(dungeon) {
        try {
            const dungeonData = JSON.stringify(dungeon);
            
            await this.server.db.run(`
                INSERT OR REPLACE INTO dungeons (id, type, tier, data, created) 
                VALUES (?, ?, ?, ?, ?)
            `, [dungeon.id, dungeon.type, dungeon.tier, dungeonData, dungeon.created]);
            
            this.activeDungeons.set(dungeon.id, dungeon);
            
        } catch (error) {
            console.error('Error saving dungeon:', error);
        }
    }
    
    async loadDungeon(dungeonId) {
        try {
            const result = await this.server.db.get(
                'SELECT * FROM dungeons WHERE id = ?',
                [dungeonId]
            );
            
            if (result) {
                const dungeon = JSON.parse(result.data);
                this.activeDungeons.set(dungeonId, dungeon);
                return dungeon;
            }
            
        } catch (error) {
            console.error('Error loading dungeon:', error);
        }
        
        return null;
    }
    
    // Update loop methods
    updateActiveDungeons() {
        const now = Date.now();
        
        for (const [dungeonId, dungeon] of this.activeDungeons) {
            // Update dungeon state
            dungeon.lastActivity = now;
            
            // Update instances
            for (const [instanceId, instance] of dungeon.instances) {
                this.updateInstance(instance);
            }
        }
    }
    
    updateInstance(instance) {
        // Check timeout
        const now = Date.now();
        const timeout = 30 * 60 * 1000; // 30 minutes
        
        if (now - instance.lastActivity > timeout) {
            instance.state = 'timeout';
            instance.endTime = now;
        }
    }
    
    cleanupEmptyInstances() {
        const toRemove = [];
        
        for (const [instanceId, instance] of this.dungeonInstances) {
            if (instance.state === 'empty' || instance.state === 'timeout') {
                toRemove.push(instanceId);
            }
        }
        
        for (const instanceId of toRemove) {
            const instance = this.dungeonInstances.get(instanceId);
            if (instance) {
                const dungeon = this.activeDungeons.get(instance.dungeonId);
                if (dungeon) {
                    dungeon.instances.delete(instanceId);
                }
                this.dungeonInstances.delete(instanceId);
            }
        }
        
        if (toRemove.length > 0) {
            console.log(`Cleaned up ${toRemove.length} empty dungeon instances`);
        }
    }
    
    maintainDungeonPool() {
        // Keep a pool of active dungeons
        const targetPoolSize = 10;
        const currentPoolSize = this.activeDungeons.size;
        
        if (currentPoolSize < targetPoolSize) {
            // Generate new dungeons
            const toGenerate = targetPoolSize - currentPoolSize;
            for (let i = 0; i < toGenerate; i++) {
                const dungeon = this.generateDungeon();
                console.log(`Generated new dungeon for pool: ${dungeon.id}`);
            }
        }
    }
    
    // Public API
    getDungeon(dungeonId) {
        return this.activeDungeons.get(dungeonId);
    }
    
    getInstance(instanceId) {
        return this.dungeonInstances.get(instanceId);
    }
    
    getAvailableDungeons() {
        const dungeons = [];
        
        for (const [dungeonId, dungeon] of this.activeDungeons) {
            dungeons.push({
                id: dungeon.id,
                type: dungeon.type,
                tier: dungeon.tier,
                size: dungeon.size,
                roomCount: dungeon.rooms.length,
                created: dungeon.created
            });
        }
        
        return dungeons;
    }
    
    getPlayerInstances(playerId) {
        const instances = [];
        
        for (const [instanceId, instance] of this.dungeonInstances) {
            if (instance.players.has(playerId)) {
                instances.push(instance);
            }
        }
        
        return instances;
    }
}

module.exports = DungeonGenerator;
