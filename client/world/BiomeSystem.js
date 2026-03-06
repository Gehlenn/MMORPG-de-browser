/**
 * Biome System
 * Manages different biomes and their properties
 */

import { TILE_TYPES } from './TileMap.js';

// Biome definitions
export const BIOMES = {
    plains: {
        id: 'plains',
        name: 'Plains',
        description: 'Vast grasslands with scattered trees and gentle hills.',
        floorColor: '#4a7c59',
        wallColor: '#3d5a3d',
        gridColor: 'rgba(255,255,255,0.08)',
        
        // Terrain generation
        terrain: {
            primary: TILE_TYPES.GRASS,
            secondary: TILE_TYPES.FOREST,
            walls: TILE_TYPES.STONE,
            water: TILE_TYPES.WATER
        },
        
        // Generation parameters
        generation: {
            noiseScale: 0.1,
            treeDensity: 0.15,
            rockDensity: 0.05,
            waterDensity: 0.08,
            elevationVariation: 0.3
        },
        
        // Monster spawns
        monsters: [
            { type: 'goblin', weight: 40, level: 1 },
            { type: 'wolf', weight: 30, level: 2 },
            { type: 'slime', weight: 20, level: 1 },
            { type: 'boar', weight: 10, level: 3 }
        ],
        
        // Resources
        resources: [
            { type: 'herbs', rarity: 'common', density: 0.2 },
            { type: 'wood', rarity: 'common', density: 0.15 },
            { type: 'stone', rarity: 'common', density: 0.1 }
        ],
        
        // Dungeons
        dungeons: ['forest_cave', 'goblin_camp'],
        
        // Environmental effects
        effects: {
            movementSpeed: 1.0,
            visibility: 1.0,
            damage: 0
        }
    },
    
    forest: {
        id: 'forest',
        name: 'Forest',
        description: 'Dense woodland filled with ancient trees and wildlife.',
        floorColor: '#2d5016',
        wallColor: '#1a2f0a',
        gridColor: 'rgba(255,255,255,0.06)',
        
        terrain: {
            primary: TILE_TYPES.FOREST,
            secondary: TILE_TYPES.GRASS,
            walls: TILE_TYPES.WOOD,
            water: TILE_TYPES.WATER
        },
        
        generation: {
            noiseScale: 0.08,
            treeDensity: 0.4,
            rockDensity: 0.02,
            waterDensity: 0.12,
            elevationVariation: 0.4
        },
        
        monsters: [
            { type: 'wolf', weight: 35, level: 3 },
            { type: 'bear', weight: 25, level: 5 },
            { type: 'spider', weight: 20, level: 2 },
            { type: 'ent', weight: 15, level: 6 },
            { type: 'pixie', weight: 5, level: 4 }
        ],
        
        resources: [
            { type: 'wood', rarity: 'common', density: 0.4 },
            { type: 'herbs', rarity: 'common', density: 0.3 },
            { type: 'rare_herbs', rarity: 'uncommon', density: 0.1 },
            { type: 'mushrooms', rarity: 'common', density: 0.15 }
        ],
        
        dungeons: ['ancient_grove', 'spider_lair'],
        
        effects: {
            movementSpeed: 0.8,
            visibility: 0.7,
            damage: 0
        }
    },
    
    mountain: {
        id: 'mountain',
        name: 'Mountain',
        description: 'Tall peaks and rocky cliffs with treacherous paths.',
        floorColor: '#696969',
        wallColor: '#4a4a4a',
        gridColor: 'rgba(255,255,255,0.1)',
        
        terrain: {
            primary: TILE_TYPES.STONE,
            secondary: TILE_TYPES.MOUNTAIN,
            walls: TILE_TYPES.MOUNTAIN,
            water: TILE_TYPES.WATER
        },
        
        generation: {
            noiseScale: 0.15,
            treeDensity: 0.02,
            rockDensity: 0.3,
            waterDensity: 0.05,
            elevationVariation: 0.8
        },
        
        monsters: [
            { type: 'orc', weight: 30, level: 8 },
            { type: 'eagle', weight: 25, level: 6 },
            { type: 'golem', weight: 20, level: 10 },
            { type: 'harpy', weight: 15, level: 7 },
            { type: 'dragon', weight: 10, level: 15 }
        ],
        
        resources: [
            { type: 'iron', rarity: 'common', density: 0.2 },
            { type: 'stone', rarity: 'common', density: 0.4 },
            { type: 'gold', rarity: 'rare', density: 0.05 },
            { type: 'gems', rarity: 'uncommon', density: 0.08 }
        ],
        
        dungeons: ['dwarf_mine', 'dragon_peak'],
        
        effects: {
            movementSpeed: 0.7,
            visibility: 1.2,
            damage: 0
        }
    },
    
    swamp: {
        id: 'swamp',
        name: 'Swamp',
        description: 'Murky wetlands filled with dangerous creatures.',
        floorColor: '#4a5d23',
        wallColor: '#2d3a1a',
        gridColor: 'rgba(255,255,255,0.05)',
        
        terrain: {
            primary: TILE_TYPES.SWAMP,
            secondary: TILE_TYPES.WATER,
            walls: TILE_TYPES.WOOD,
            water: TILE_TYPES.WATER
        },
        
        generation: {
            noiseScale: 0.12,
            treeDensity: 0.2,
            rockDensity: 0.01,
            waterDensity: 0.4,
            elevationVariation: 0.2
        },
        
        monsters: [
            { type: 'crocodile', weight: 30, level: 7 },
            { type: 'snake', weight: 25, level: 5 },
            { type: 'slime', weight: 20, level: 4 },
            { type: 'witch', weight: 15, level: 9 },
            { type: 'will_o_wisp', weight: 10, level: 6 }
        ],
        
        resources: [
            { type: 'herbs', rarity: 'common', density: 0.25 },
            { type: 'poison_ingredients', rarity: 'uncommon', density: 0.15 },
            { type: 'rare_herbs', rarity: 'rare', density: 0.08 },
            { type: 'mushrooms', rarity: 'common', density: 0.2 }
        ],
        
        dungeons: ['witch_hut', 'ancient_ruins'],
        
        effects: {
            movementSpeed: 0.6,
            visibility: 0.6,
            damage: 0
        }
    },
    
    desert: {
        id: 'desert',
        name: 'Desert',
        description: 'Vast sandy dunes under the scorching sun.',
        floorColor: '#edc9af',
        wallColor: '#d4a574',
        gridColor: 'rgba(0,0,0,0.1)',
        
        terrain: {
            primary: TILE_TYPES.SAND,
            secondary: TILE_TYPES.STONE,
            walls: TILE_TYPES.STONE,
            water: TILE_TYPES.WATER
        },
        
        generation: {
            noiseScale: 0.2,
            treeDensity: 0.01,
            rockDensity: 0.15,
            waterDensity: 0.02,
            elevationVariation: 0.3
        },
        
        monsters: [
            { type: 'scorpion', weight: 35, level: 6 },
            { type: 'vulture', weight: 25, level: 5 },
            { type: 'sand_worm', weight: 20, level: 8 },
            { type: 'mummy', weight: 15, level: 7 },
            { type: 'djinn', weight: 5, level: 12 }
        ],
        
        resources: [
            { type: 'crystals', rarity: 'common', density: 0.15 },
            { type: 'sand', rarity: 'common', density: 0.5 },
            { type: 'rare_crystals', rarity: 'rare', density: 0.05 },
            { type: 'oasis_water', rarity: 'uncommon', density: 0.03 }
        ],
        
        dungeons: ['pharaoh_tomb', 'sand_worm_nest'],
        
        effects: {
            movementSpeed: 0.9,
            visibility: 1.5,
            damage: 2 // Heat damage
        }
    },
    
    frozen: {
        id: 'frozen',
        name: 'Frozen Lands',
        description: 'Icy wastelands where only the hardiest survive.',
        floorColor: '#b0e0e6',
        wallColor: '#87ceeb',
        gridColor: 'rgba(0,0,0,0.08)',
        
        terrain: {
            primary: TILE_TYPES.SNOW,
            secondary: TILE_TYPES.FROZEN,
            walls: TILE_TYPES.STONE,
            water: TILE_TYPES.WATER
        },
        
        generation: {
            noiseScale: 0.18,
            treeDensity: 0.05,
            rockDensity: 0.25,
            waterDensity: 0.3,
            elevationVariation: 0.5
        },
        
        monsters: [
            { type: 'ice_elemental', weight: 30, level: 9 },
            { type: 'polar_bear', weight: 25, level: 8 },
            { type: 'frost_wolf', weight: 20, level: 7 },
            { type: 'yeti', weight: 15, level: 10 },
            { type: 'ice_dragon', weight: 10, level: 18 }
        ],
        
        resources: [
            { type: 'ice_ore', rarity: 'common', density: 0.2 },
            { type: 'frozen_herbs', rarity: 'uncommon', density: 0.1 },
            { type: 'ice_crystals', rarity: 'rare', density: 0.06 },
            { type: 'snow', rarity: 'common', density: 0.4 }
        ],
        
        dungeons: ['ice_cave', 'frozen_fortress'],
        
        effects: {
            movementSpeed: 0.5,
            visibility: 0.8,
            damage: 1 // Cold damage
        }
    },
    
    volcanic: {
        id: 'volcanic',
        name: 'Volcanic Wastes',
        description: 'Fiery lands of lava and ash, home to fire creatures.',
        floorColor: '#8b0000',
        wallColor: '#660000',
        gridColor: 'rgba(255,255,0,0.1)',
        
        terrain: {
            primary: TILE_TYPES.VOLCANIC,
            secondary: TILE_TYPES.LAVA,
            walls: TILE_TYPES.STONE,
            water: TILE_TYPES.LAVA
        },
        
        generation: {
            noiseScale: 0.15,
            treeDensity: 0,
            rockDensity: 0.4,
            waterDensity: 0.25,
            elevationVariation: 0.7
        },
        
        monsters: [
            { type: 'fire_elemental', weight: 30, level: 11 },
            { type: 'lava_golem', weight: 25, level: 13 },
            { type: 'fire_demon', weight: 20, level: 12 },
            { type: 'phoenix', weight: 15, level: 14 },
            { type: 'volcano_dragon', weight: 10, level: 20 }
        ],
        
        resources: [
            { type: 'obsidian', rarity: 'common', density: 0.3 },
            { type: 'fire_crystals', rarity: 'uncommon', density: 0.15 },
            { type: 'lava_stones', rarity: 'rare', density: 0.08 },
            { type: 'ash', rarity: 'common', density: 0.5 }
        ],
        
        dungeons: ['fire_temple', 'lava_caverns'],
        
        effects: {
            movementSpeed: 0.8,
            visibility: 0.9,
            damage: 5 // Fire damage
        }
    },
    
    darklands: {
        id: 'darklands',
        name: 'Darklands',
        description: 'Corrupted lands where shadows hold ancient evils.',
        floorColor: '#1a1a1a',
        wallColor: '#0d0d0d',
        gridColor: 'rgba(128,0,128,0.1)',
        
        terrain: {
            primary: TILE_TYPES.DARKLANDS,
            secondary: TILE_TYPES.STONE,
            walls: TILE_TYPES.WALL,
            water: TILE_TYPES.WATER
        },
        
        generation: {
            noiseScale: 0.1,
            treeDensity: 0.1,
            rockDensity: 0.2,
            waterDensity: 0.15,
            elevationVariation: 0.4
        },
        
        monsters: [
            { type: 'shadow_beast', weight: 30, level: 14 },
            { type: 'dark_knight', weight: 25, level: 16 },
            { type: 'necromancer', weight: 20, level: 15 },
            { type: 'demon', weight: 15, level: 17 },
            { type: 'shadow_dragon', weight: 10, level: 25 }
        ],
        
        resources: [
            { type: 'shadow_essence', rarity: 'uncommon', density: 0.15 },
            { type: 'dark_crystals', rarity: 'rare', density: 0.1 },
            { type: 'cursed_items', rarity: 'epic', density: 0.05 },
            { type: 'void_energy', rarity: 'legendary', density: 0.02 }
        ],
        
        dungeons: ['shadow_fortress', 'abyss_portal'],
        
        effects: {
            movementSpeed: 0.7,
            visibility: 0.4,
            damage: 3 // Shadow damage
        }
    }
};

class BiomeSystem {
    constructor() {
        this.biomes = BIOMES;
        this.biomeMap = new Map();
        this.noiseGenerator = null;
        
        this.initializeNoise();
    }
    
    initializeNoise() {
        // Simple pseudo-random noise generator
        this.noiseGenerator = {
            seed: Math.random() * 10000,
            
            noise(x, y) {
                const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
                return n - Math.floor(n);
            },
            
            smoothNoise(x, y) {
                const corners = (
                    this.noise(x - 1, y - 1) + this.noise(x + 1, y - 1) +
                    this.noise(x - 1, y + 1) + this.noise(x + 1, y + 1)
                ) / 16;
                
                const sides = (
                    this.noise(x - 1, y) + this.noise(x + 1, y) +
                    this.noise(x, y - 1) + this.noise(x, y + 1)
                ) / 8;
                
                const center = this.noise(x, y) / 4;
                
                return corners + sides + center;
            },
            
            interpolatedNoise(x, y) {
                const intX = Math.floor(x);
                const fractX = x - intX;
                const intY = Math.floor(y);
                const fractY = y - intY;
                
                const v1 = this.smoothNoise(intX, intY);
                const v2 = this.smoothNoise(intX + 1, intY);
                const v3 = this.smoothNoise(intX, intY + 1);
                const v4 = this.smoothNoise(intX + 1, intY + 1);
                
                const i1 = this.cosineInterpolate(v1, v2, fractX);
                const i2 = this.cosineInterpolate(v3, v4, fractX);
                
                return this.cosineInterpolate(i1, i2, fractY);
            },
            
            cosineInterpolate(a, b, x) {
                const ft = x * Math.PI;
                const f = (1 - Math.cos(ft)) * 0.5;
                return a * (1 - f) + b * f;
            }
        };
    }
    
    getBiome(biomeId) {
        return this.biomes[biomeId] || this.biomes.plains;
    }
    
    getBiomeAt(worldX, worldY) {
        const key = `${worldX},${worldY}`;
        if (this.biomeMap.has(key)) {
            return this.biomeMap.get(key);
        }
        
        // Generate biome based on world coordinates
        const biome = this.generateBiomeForPosition(worldX, worldY);
        this.biomeMap.set(key, biome);
        return biome;
    }
    
    generateBiomeForPosition(worldX, worldY) {
        // Use noise to determine biome type
        const noiseValue = this.noiseGenerator.interpolatedNoise(
            worldX * 0.1,
            worldY * 0.1
        );
        
        // Determine biome based on noise value
        if (noiseValue < 0.15) return this.biomes.swamp;
        if (noiseValue < 0.25) return this.biomes.forest;
        if (noiseValue < 0.35) return this.biomes.plains;
        if (noiseValue < 0.45) return this.biomes.desert;
        if (noiseValue < 0.55) return this.biomes.mountain;
        if (noiseValue < 0.65) return this.biomes.frozen;
        if (noiseValue < 0.75) return this.biomes.volcanic;
        return this.biomes.darklands;
    }
    
    getAdjacentBiomes(worldX, worldY, radius = 1) {
        const adjacent = new Map();
        
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const x = worldX + dx;
                const y = worldY + dy;
                const key = `${x},${y}`;
                adjacent.set(key, this.getBiomeAt(x, y));
            }
        }
        
        return adjacent;
    }
    
    getBiomeTransition(worldX, worldY) {
        const currentBiome = this.getBiomeAt(worldX, worldY);
        const adjacent = this.getAdjacentBiomes(worldX, worldY);
        
        const transitions = [];
        for (const [pos, biome] of adjacent.entries()) {
            if (biome.id !== currentBiome.id) {
                transitions.push({
                    position: pos,
                    biome: biome,
                    direction: this.getDirection(worldX, worldY, ...pos.split(',').map(Number))
                });
            }
        }
        
        return transitions;
    }
    
    getDirection(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'east' : 'west';
        } else {
            return dy > 0 ? 'south' : 'north';
        }
    }
    
    getMonstersForBiome(biomeId, level = null) {
        const biome = this.getBiome(biomeId);
        const monsters = [...biome.monsters];
        
        // Filter by level if specified
        if (level !== null) {
            return monsters.filter(m => Math.abs(m.level - level) <= 3);
        }
        
        return monsters;
    }
    
    getRandomMonster(biomeId, level = null) {
        const monsters = this.getMonstersForBiome(biomeId, level);
        if (monsters.length === 0) return null;
        
        // Weighted random selection
        const totalWeight = monsters.reduce((sum, m) => sum + m.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const monster of monsters) {
            random -= monster.weight;
            if (random <= 0) {
                return monster;
            }
        }
        
        return monsters[0];
    }
    
    getResourcesForBiome(biomeId) {
        const biome = this.getBiome(biomeId);
        return [...biome.resources];
    }
    
    getRandomResource(biomeId) {
        const resources = this.getResourcesForBiome(biomeId);
        if (resources.length === 0) return null;
        
        return resources[Math.floor(Math.random() * resources.length)];
    }
    
    getDungeonsForBiome(biomeId) {
        const biome = this.getBiome(biomeId);
        return [...biome.dungeons];
    }
    
    applyBiomeEffects(entity, biomeId) {
        const biome = this.getBiome(biomeId);
        const effects = biome.effects;
        
        // Apply movement speed modifier
        if (effects.movementSpeed !== 1.0 && entity.movementSpeed) {
            entity.movementSpeed *= effects.movementSpeed;
        }
        
        // Apply visibility modifier
        if (effects.visibility !== 1.0 && entity.visibility) {
            entity.visibility *= effects.visibility;
        }
        
        // Apply environmental damage
        if (effects.damage > 0 && entity.takeDamage) {
            entity.takeDamage(effects.damage, 'environment');
        }
    }
    
    getBiomeColorScheme(biomeId) {
        const biome = this.getBiome(biomeId);
        return {
            floor: biome.floorColor,
            wall: biome.wallColor,
            grid: biome.gridColor
        };
    }
    
    // World generation helpers
    generateBiomeMap(width, height) {
        const map = [];
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                row.push(this.getBiomeAt(x, y));
            }
            map.push(row);
        }
        
        return map;
    }
    
    smoothBiomeMap(map, iterations = 1) {
        const width = map[0].length;
        const height = map.length;
        
        for (let iter = 0; iter < iterations; iter++) {
            const newMap = [];
            
            for (let y = 0; y < height; y++) {
                const row = [];
                for (let x = 0; x < width; x++) {
                    const neighbors = this.getNeighborBiomes(map, x, y);
                    const counts = {};
                    
                    // Count neighboring biome types
                    for (const neighbor of neighbors) {
                        counts[neighbor.id] = (counts[neighbor.id] || 0) + 1;
                    }
                    
                    // Find most common neighbor
                    let maxCount = 0;
                    let dominantBiome = map[y][x];
                    
                    for (const [biomeId, count] of Object.entries(counts)) {
                        if (count > maxCount) {
                            maxCount = count;
                            dominantBiome = this.getBiome(biomeId);
                        }
                    }
                    
                    row.push(dominantBiome);
                }
                newMap.push(row);
            }
            
            // Replace map with smoothed version
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    map[y][x] = newMap[y][x];
                }
            }
        }
        
        return map;
    }
    
    getNeighborBiomes(map, x, y) {
        const neighbors = [];
        const height = map.length;
        const width = map[0].length;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    neighbors.push(map[ny][nx]);
                }
            }
        }
        
        return neighbors;
    }
    
    // Debug and utility methods
    getBiomeInfo(biomeId) {
        const biome = this.getBiome(biomeId);
        return {
            id: biome.id,
            name: biome.name,
            description: biome.description,
            monsterCount: biome.monsters.length,
            resourceCount: biome.resources.length,
            dungeonCount: biome.dungeons.length,
            effects: biome.effects
        };
    }
    
    listAllBiomes() {
        return Object.keys(this.biomes).map(id => this.getBiomeInfo(id));
    }
}

export default BiomeSystem;
