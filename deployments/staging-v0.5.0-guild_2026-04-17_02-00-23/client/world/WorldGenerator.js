/**
 * World Generator
 * Procedural world generation with biomes, cities, roads, and dungeons
 */

import TileMap, { TILE_TYPES } from './TileMap.js';
import BiomeSystem, { BIOMES } from './BiomeSystem.js';
import Chunk from './Chunk.js';

class WorldGenerator {
    constructor() {
        this.biomeSystem = new BiomeSystem();
        this.chunks = new Map();
        this.chunkSize = 50; // Each chunk is 50x50 tiles
        this.worldSeed = Math.random() * 1000000;
        
        // World parameters
        this.worldSize = {
            width: 1000,  // 1000 chunks = 50,000 tiles
            height: 1000  // 1000 chunks = 50,000 tiles
        };
        
        // Generation parameters
        this.params = {
            cityDensity: 0.02,      // 2% of chunks have cities
            roadDensity: 0.3,       // 30% connectivity between cities
            dungeonDensity: 0.05,   // 5% of chunks have dungeons
            resourceDensity: 0.15,  // 15% of chunks have special resources
            portalDensity: 0.01     // 1% of chunks have portals
        };
        
        // Pre-generated structures
        this.cities = [];
        this.roads = [];
        this.dungeons = [];
        this.portals = [];
        
        this.initializeWorld();
    }
    
    initializeWorld() {
        // Generate world structure
        this.generateCities();
        this.generateRoads();
        this.generateDungeons();
        this.generatePortals();
    }
    
    generateChunk(worldX, worldY) {
        const chunkKey = this.getChunkKey(worldX, worldY);
        
        // Check if chunk already exists
        if (this.chunks.has(chunkKey)) {
            return this.chunks.get(chunkKey);
        }
        
        // Create new chunk
        const chunk = new Chunk(worldX, worldY, this.chunkSize);
        
        // Get biome for this chunk
        const biome = this.biomeSystem.getBiomeAt(worldX, worldY);
        chunk.setBiome(biome);
        
        // Generate terrain
        this.generateChunkTerrain(chunk, biome);
        
        // Add structures if any
        this.addChunkStructures(chunk, worldX, worldY);
        
        // Cache chunk
        this.chunks.set(chunkKey, chunk);
        
        return chunk;
    }
    
    generateChunkTerrain(chunk, biome) {
        const { generation } = biome;
        const map = chunk.map;
        
        // Generate base terrain using noise
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunk.worldX * this.chunkSize + x;
                const worldY = chunk.worldY * this.chunkSize + y;
                
                // Generate noise value
                const noise = this.generateNoise(
                    worldX * generation.noiseScale,
                    worldY * generation.noiseScale
                );
                
                // Determine tile type
                let tileType = biome.terrain.primary;
                
                // Add secondary terrain based on noise
                if (noise > 0.6) {
                    if (Math.random() < generation.treeDensity) {
                        tileType = biome.terrain.secondary;
                    }
                } else if (noise < 0.2) {
                    if (Math.random() < generation.waterDensity) {
                        tileType = biome.terrain.water;
                    }
                }
                
                // Add rocks/walls
                if (Math.random() < generation.rockDensity) {
                    tileType = biome.terrain.walls;
                }
                
                // Set tile
                map.setTile(x, y, tileType);
            }
        }
        
        // Add elevation variation
        this.addElevationVariation(chunk, biome);
        
        // Create borders
        this.createChunkBorders(chunk);
    }
    
    addElevationVariation(chunk, biome) {
        const { elevationVariation } = biome.generation;
        if (elevationVariation === 0) return;
        
        const map = chunk.map;
        
        for (let y = 1; y < this.chunkSize - 1; y++) {
            for (let x = 1; x < this.chunkSize - 1; x++) {
                if (Math.random() < elevationVariation) {
                    const currentTile = map.getTile(x, y);
                    
                    // Create small hills or depressions
                    if (currentTile === biome.terrain.primary) {
                        const neighbors = this.getNeighborTiles(map, x, y);
                        const wallCount = neighbors.filter(t => t === biome.terrain.walls).length;
                        
                        if (wallCount >= 4 && Math.random() < 0.3) {
                            map.setTile(x, y, biome.terrain.walls);
                        }
                    }
                }
            }
        }
    }
    
    createChunkBorders(chunk) {
        const map = chunk.map;
        
        // Create natural borders at chunk edges
        for (let x = 0; x < this.chunkSize; x++) {
            // Top and bottom borders
            if (Math.random() < 0.1) {
                map.setTile(x, 0, TILE_TYPES.WALL);
                map.setTile(x, this.chunkSize - 1, TILE_TYPES.WALL);
            }
        }
        
        for (let y = 0; y < this.chunkSize; y++) {
            // Left and right borders
            if (Math.random() < 0.1) {
                map.setTile(0, y, TILE_TYPES.WALL);
                map.setTile(this.chunkSize - 1, y, TILE_TYPES.WALL);
            }
        }
    }
    
    addChunkStructures(chunk, worldX, worldY) {
        // Check for cities
        const city = this.getCityAt(worldX, worldY);
        if (city) {
            this.generateCity(chunk, city);
            return;
        }
        
        // Check for roads
        const road = this.getRoadAt(worldX, worldY);
        if (road) {
            this.generateRoad(chunk, road);
        }
        
        // Check for dungeons
        const dungeon = this.getDungeonAt(worldX, worldY);
        if (dungeon) {
            this.generateDungeon(chunk, dungeon);
        }
        
        // Check for portals
        const portal = this.getPortalAt(worldX, worldY);
        if (portal) {
            this.generatePortal(chunk, portal);
        }
        
        // Add resources
        this.generateResources(chunk);
    }
    
    generateCities() {
        const numCities = Math.floor(this.worldSize.width * this.worldSize.height * this.params.cityDensity);
        
        for (let i = 0; i < numCities; i++) {
            const x = Math.floor(Math.random() * this.worldSize.width);
            const y = Math.floor(Math.random() * this.worldSize.height);
            
            // Ensure minimum distance between cities
            const tooClose = this.cities.some(city => {
                const distance = Math.sqrt(Math.pow(city.x - x, 2) + Math.pow(city.y - y, 2));
                return distance < 10; // Minimum 10 chunks apart
            });
            
            if (!tooClose) {
                const biome = this.biomeSystem.getBiomeAt(x, y);
                this.cities.push({
                    id: `city_${i}`,
                    name: this.generateCityName(),
                    x,
                    y,
                    biome: biome.id,
                    size: Math.random() < 0.3 ? 'large' : 'medium',
                    population: Math.floor(Math.random() * 10000) + 1000,
                    services: this.generateCityServices(biome),
                    market: this.generateMarket(biome)
                });
            }
        }
    }
    
    generateCityName() {
        const prefixes = ['New', 'Old', 'Grand', 'Silver', 'Golden', 'Iron', 'Stone', 'Crystal'];
        const suffixes = ['town', 'ville', 'burg', 'shire', 'haven', 'port', 'crest', 'fall'];
        const middles = ['wind', 'stone', 'water', 'fire', 'earth', 'shadow', 'light', 'moon'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const middle = middles[Math.floor(Math.random() * middles.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix}${middle}${suffix}`;
    }
    
    generateCityServices(biome) {
        const allServices = ['tavern', 'blacksmith', 'alchemist', 'market', 'guild', 'temple'];
        const numServices = Math.floor(Math.random() * 3) + 2; // 2-4 services
        
        const services = [];
        for (let i = 0; i < numServices; i++) {
            const service = allServices[Math.floor(Math.random() * allServices.length)];
            if (!services.includes(service)) {
                services.push(service);
            }
        }
        
        return services;
    }
    
    generateMarket(biome) {
        return {
            tax: 0.05, // 5% market tax
            resources: this.biomeSystem.getResourcesForBiome(biome.id),
            specialItems: this.generateSpecialItems(biome)
        };
    }
    
    generateSpecialItems(biome) {
        const items = [];
        
        // Add biome-specific items
        switch (biome.id) {
            case 'mountain':
                items.push({ type: 'mining_pick', rarity: 'uncommon' });
                items.push({ type: 'iron_ore', rarity: 'common' });
                break;
            case 'forest':
                items.push({ type: 'wooden_bow', rarity: 'common' });
                items.push({ type: 'herbs', rarity: 'common' });
                break;
            case 'volcanic':
                items.push({ type: 'fire_sword', rarity: 'rare' });
                items.push({ type: 'fire_resistance_potion', rarity: 'uncommon' });
                break;
            // Add more biome-specific items...
        }
        
        return items;
    }
    
    generateRoads() {
        // Connect cities with roads
        for (let i = 0; i < this.cities.length; i++) {
            for (let j = i + 1; j < this.cities.length; j++) {
                if (Math.random() < this.params.roadDensity) {
                    const city1 = this.cities[i];
                    const city2 = this.cities[j];
                    
                    // Create road path between cities
                    const path = this.findPath(city1.x, city1.y, city2.x, city2.y);
                    
                    this.roads.push({
                        id: `road_${i}_${j}`,
                        from: city1.id,
                        to: city2.id,
                        path: path,
                        type: 'stone'
                    });
                }
            }
        }
    }
    
    findPath(startX, startY, endX, endY) {
        const path = [];
        let x = startX;
        let y = startY;
        
        while (x !== endX || y !== endY) {
            path.push({ x, y });
            
            // Simple pathfinding - move towards target
            if (x < endX) x++;
            else if (x > endX) x--;
            
            if (y < endY) y++;
            else if (y > endY) y--;
        }
        
        path.push({ x: endX, y: endY });
        return path;
    }
    
    generateDungeons() {
        const numDungeons = Math.floor(this.worldSize.width * this.worldSize.height * this.params.dungeonDensity);
        
        for (let i = 0; i < numDungeons; i++) {
            const x = Math.floor(Math.random() * this.worldSize.width);
            const y = Math.floor(Math.random() * this.worldSize.height);
            
            const biome = this.biomeSystem.getBiomeAt(x, y);
            const dungeonTypes = this.biomeSystem.getDungeonsForBiome(biome.id);
            
            if (dungeonTypes.length > 0) {
                this.dungeons.push({
                    id: `dungeon_${i}`,
                    name: this.generateDungeonName(),
                    x,
                    y,
                    type: dungeonTypes[Math.floor(Math.random() * dungeonTypes.length)],
                    level: Math.floor(Math.random() * 20) + 5,
                    difficulty: Math.random() < 0.3 ? 'elite' : 'normal'
                });
            }
        }
    }
    
    generateDungeonName() {
        const prefixes = ['Ancient', 'Forgotten', 'Cursed', 'Haunted', 'Dark', 'Hidden'];
        const suffixes = ['Caverns', 'Dungeon', 'Lair', 'Crypt', 'Tomb', 'Ruins'];
        const creatures = ['Goblin', 'Dragon', 'Demon', 'Undead', 'Spider', 'Troll'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const creature = creatures[Math.floor(Math.random() * creatures.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix} ${creature} ${suffix}`;
    }
    
    generatePortals() {
        const numPortals = Math.floor(this.worldSize.width * this.worldSize.height * this.params.portalDensity);
        
        for (let i = 0; i < numPortals; i++) {
            const x = Math.floor(Math.random() * this.worldSize.width);
            const y = Math.floor(Math.random() * this.worldSize.height);
            
            // Find destination
            let destX, destY;
            do {
                destX = Math.floor(Math.random() * this.worldSize.width);
                destY = Math.floor(Math.random() * this.worldSize.height);
            } while (destX === x && destY === y);
            
            this.portals.push({
                id: `portal_${i}`,
                x,
                y,
                destination: { x: destX, y: destY },
                type: Math.random() < 0.5 ? 'biome' : 'dungeon',
                cooldown: 5000 // 5 seconds cooldown
            });
        }
    }
    
    generateCity(chunk, city) {
        const map = chunk.map;
        const centerX = Math.floor(this.chunkSize / 2);
        const centerY = Math.floor(this.chunkSize / 2);
        
        // Create city center
        const citySize = city.size === 'large' ? 15 : 10;
        
        // Clear area for city
        for (let y = centerY - citySize; y <= centerY + citySize; y++) {
            for (let x = centerX - citySize; x <= centerX + citySize; x++) {
                if (x >= 0 && x < this.chunkSize && y >= 0 && y < this.chunkSize) {
                    map.setTile(x, y, TILE_TYPES.STONE);
                }
            }
        }
        
        // Add city walls
        for (let i = -citySize; i <= citySize; i++) {
            if (centerX + i >= 0 && centerX + i < this.chunkSize) {
                map.setTile(centerX + i, centerY - citySize, TILE_TYPES.WALL);
                map.setTile(centerX + i, centerY + citySize, TILE_TYPES.WALL);
            }
            if (centerY + i >= 0 && centerY + i < this.chunkSize) {
                map.setTile(centerX - citySize, centerY + i, TILE_TYPES.WALL);
                map.setTile(centerX + citySize, centerY + i, TILE_TYPES.WALL);
            }
        }
        
        // Add city gate
        map.setTile(centerX, centerY + citySize, TILE_TYPES.DOOR);
        
        // Add buildings
        this.generateCityBuildings(chunk, centerX, centerY, citySize);
        
        // Store city data in chunk
        chunk.city = city;
    }
    
    generateCityBuildings(chunk, centerX, centerY, citySize) {
        const map = chunk.map;
        const buildingTypes = [TILE_TYPES.WOOD, TILE_TYPES.STONE];
        
        // Generate random buildings
        for (let i = 0; i < 5; i++) {
            const buildingX = centerX + Math.floor(Math.random() * (citySize - 4)) - citySize/2 + 2;
            const buildingY = centerY + Math.floor(Math.random() * (citySize - 4)) - citySize/2 + 2;
            const buildingWidth = Math.floor(Math.random() * 3) + 2;
            const buildingHeight = Math.floor(Math.random() * 3) + 2;
            
            // Create building
            for (let y = buildingY; y < buildingY + buildingHeight && y < this.chunkSize; y++) {
                for (let x = buildingX; x < buildingX + buildingWidth && x < this.chunkSize; x++) {
                    if (x >= 0 && y >= 0) {
                        const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
                        map.setTile(x, y, buildingType);
                    }
                }
            }
        }
    }
    
    generateRoad(chunk, road) {
        const map = chunk.map;
        
        // Create stone path through chunk
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                if (Math.random() < 0.3) {
                    map.setTile(x, y, TILE_TYPES.STONE);
                }
            }
        }
        
        chunk.road = road;
    }
    
    generateDungeon(chunk, dungeon) {
        const map = chunk.map;
        const centerX = Math.floor(this.chunkSize / 2);
        const centerY = Math.floor(this.chunkSize / 2);
        
        // Create dungeon entrance
        map.setTile(centerX, centerY, TILE_TYPES.STAIRS_DOWN);
        
        // Add some walls around entrance
        for (let i = -2; i <= 2; i++) {
            if (Math.abs(i) !== 2) {
                map.setTile(centerX + i, centerY - 2, TILE_TYPES.WALL);
                map.setTile(centerX + i, centerY + 2, TILE_TYPES.WALL);
                map.setTile(centerX - 2, centerY + i, TILE_TYPES.WALL);
                map.setTile(centerX + 2, centerY + i, TILE_TYPES.WALL);
            }
        }
        
        chunk.dungeon = dungeon;
    }
    
    generatePortal(chunk, portal) {
        const map = chunk.map;
        const centerX = Math.floor(this.chunkSize / 2);
        const centerY = Math.floor(this.chunkSize / 2);
        
        // Create portal
        map.setTile(centerX, centerY, TILE_TYPES.PORTAL);
        
        // Add portal decoration
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i !== 0 || j !== 0) {
                    map.setTile(centerX + i, centerY + j, TILE_TYPES.STONE);
                }
            }
        }
        
        chunk.portal = portal;
    }
    
    generateResources(chunk) {
        const biome = chunk.biome;
        const resources = this.biomeSystem.getResourcesForBiome(biome.id);
        const map = chunk.map;
        
        for (const resource of resources) {
            const density = resource.density || 0.1;
            const numResources = Math.floor(this.chunkSize * this.chunkSize * density);
            
            for (let i = 0; i < numResources; i++) {
                const x = Math.floor(Math.random() * this.chunkSize);
                const y = Math.floor(Math.random() * this.chunkSize);
                
                // Only place on walkable tiles
                if (map.isWalkable(x, y)) {
                    map.setTileMetadata(x, y, {
                        resource: resource.type,
                        rarity: resource.rarity,
                        amount: Math.floor(Math.random() * 5) + 1
                    });
                }
            }
        }
    }
    
    // Utility methods
    getChunkKey(worldX, worldY) {
        return `${worldX},${worldY}`;
    }
    
    generateNoise(x, y) {
        // Simple pseudo-random noise
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.worldSeed) * 43758.5453;
        return n - Math.floor(n);
    }
    
    getNeighborTiles(map, x, y) {
        const neighbors = [];
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < this.chunkSize && ny >= 0 && ny < this.chunkSize) {
                    neighbors.push(map.getTile(nx, ny));
                }
            }
        }
        
        return neighbors;
    }
    
    getCityAt(worldX, worldY) {
        return this.cities.find(city => city.x === worldX && city.y === worldY);
    }
    
    getRoadAt(worldX, worldY) {
        return this.roads.find(road => 
            road.path.some(point => point.x === worldX && point.y === worldY)
        );
    }
    
    getDungeonAt(worldX, worldY) {
        return this.dungeons.find(dungeon => dungeon.x === worldX && dungeon.y === worldY);
    }
    
    getPortalAt(worldX, worldY) {
        return this.portals.find(portal => portal.x === worldX && portal.y === worldY);
    }
    
    // Public API
    getWorldMap(worldX, worldY, width, height) {
        const map = new TileMap(width, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const chunkX = Math.floor((worldX + x) / this.chunkSize);
                const chunkY = Math.floor((worldY + y) / this.chunkSize);
                
                const chunk = this.generateChunk(chunkX, chunkY);
                const localX = (worldX + x) % this.chunkSize;
                const localY = (worldY + y) % this.chunkSize;
                
                const tileType = chunk.map.getTile(localX, localY);
                const metadata = chunk.map.getTileMetadata(localX, localY);
                
                map.setTile(x, y, tileType, metadata);
            }
        }
        
        return map;
    }
    
    getChunk(worldX, worldY) {
        return this.generateChunk(worldX, worldY);
    }
    
    getBiomeSystem() {
        return this.biomeSystem;
    }
    
    getWorldInfo() {
        return {
            seed: this.worldSeed,
            size: this.worldSize,
            chunkSize: this.chunkSize,
            cities: this.cities.length,
            roads: this.roads.length,
            dungeons: this.dungeons.length,
            portals: this.portals.length
        };
    }
}

export default WorldGenerator;
