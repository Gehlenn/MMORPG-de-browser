/**
 * Exploration System - World Discovery and Progress Tracking
 * Manages player exploration, POI discovery, and fog of war
 * Version 0.3 - First Playable Gameplay Systems
 */

class ExplorationSystem {
    constructor(worldManager, database) {
        this.worldManager = worldManager;
        this.database = database;
        
        // Exploration settings
        this.settings = {
            explorationRadius: 50, // Units
            tileResolution: 10, // Units per tile
            discoveryThreshold: 0.3, // 30% of tile must be explored
            poiDiscoveryRadius: 30,
            autoSaveInterval: 60000, // 1 minute
            sharedExploration: false, // Players share discoveries in party/guild
            fogOfWarEnabled: true
        };
        
        // Player exploration data
        this.playerExploration = new Map();
        this.sharedExploration = new Map();
        
        // World discovery data
        this.discoveredRegions = new Set();
        this.discoveredPOI = new Map();
        this.discoveredResources = new Map();
        this.discoveredSecrets = new Map();
        
        // Exploration rewards
        this.explorationRewards = {
            firstDiscovery: { xp: 100, gold: 50 },
            poiDiscovery: { xp: 50, gold: 25 },
            resourceDiscovery: { xp: 25 },
            secretDiscovery: { xp: 200, gold: 100, items: ['explorer_badge'] },
            regionCompletion: { xp: 500, gold: 250, title: 'Explorer' }
        };
        
        // Achievement tracking
        this.explorationAchievements = new Map();
        
        // Statistics
        this.globalStats = {
            totalTilesExplored: 0,
            totalRegionsDiscovered: 0,
            totalPOIDiscovered: 0,
            totalSecretsFound: 0,
            topExplorers: []
        };
        
        // Initialize
        this.initialize();
    }
    
    async initialize() {
        // Load exploration data
        await this.loadExplorationData();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start auto-save loop
        this.startAutoSave();
        
        console.log('Exploration System initialized');
    }
    
    async loadExplorationData() {
        try {
            // Load player exploration data
            const playerData = await this.database.get('player_exploration');
            if (playerData) {
                for (const [playerId, data] of Object.entries(playerData)) {
                    this.playerExploration.set(playerId, {
                        exploredTiles: new Set(data.exploredTiles || []),
                        discoveredRegions: new Set(data.discoveredRegions || []),
                        discoveredPOI: new Set(data.discoveredPOI || []),
                        discoveredResources: new Set(data.discoveredResources || []),
                        discoveredSecrets: new Set(data.discoveredSecrets || []),
                        explorationProgress: data.explorationProgress || {},
                        achievements: new Set(data.achievements || []),
                        statistics: data.statistics || {
                            tilesExplored: 0,
                            regionsDiscovered: 0,
                            poiDiscovered: 0,
                            secretsFound: 0,
                            totalDistance: 0,
                            explorationTime: 0
                        },
                        lastUpdate: data.lastUpdate || Date.now()
                    });
                }
            }
            
            // Load shared exploration data
            const sharedData = await this.database.get('shared_exploration');
            if (sharedData) {
                for (const [groupId, data] of Object.entries(sharedData)) {
                    this.sharedExploration.set(groupId, {
                        exploredTiles: new Set(data.exploredTiles || []),
                        discoveredPOI: new Set(data.discoveredPOI || []),
                        discoveredResources: new Set(data.discoveredResources || []),
                        discoveredSecrets: new Set(data.discoveredSecrets || []),
                        lastUpdate: data.lastUpdate || Date.now()
                    });
                }
            }
            
            // Load world discovery data
            const worldData = await this.database.get('world_discovery');
            if (worldData) {
                this.discoveredRegions = new Set(worldData.discoveredRegions || []);
                this.discoveredPOI = new Map(Object.entries(worldData.discoveredPOI || {}));
                this.discoveredResources = new Map(Object.entries(worldData.discoveredResources || {}));
                this.discoveredSecrets = new Map(Object.entries(worldData.discoveredSecrets || {}));
            }
            
            // Load global statistics
            const stats = await this.database.get('exploration_statistics');
            if (stats) {
                this.globalStats = stats;
            }
            
        } catch (error) {
            console.error('Error loading exploration data:', error);
        }
    }
    
    setupEventHandlers() {
        // Listen to player movement
        this.worldManager.on('playerMoved', (playerId, x, y) => {
            this.onPlayerMoved(playerId, x, y);
        });
        
        // Listen to region changes
        this.worldManager.on('playerRegionChanged', (playerId, oldRegionId, newRegionId) => {
            this.onPlayerRegionChanged(playerId, oldRegionId, newRegionId);
        });
        
        // Listen to player join/leave
        this.worldManager.on('playerJoined', (playerId) => {
            this.onPlayerJoined(playerId);
        });
        
        this.worldManager.on('playerLeft', (playerId) => {
            this.onPlayerLeft(playerId);
        });
        
        // Listen to party/guild events
        this.worldManager.on('partyFormed', (partyId, members) => {
            this.onPartyFormed(partyId, members);
        });
        
        this.worldManager.on('guildJoined', (playerId, guildId) => {
            this.onGuildJoined(playerId, guildId);
        });
    }
    
    startAutoSave() {
        setInterval(() => {
            this.saveExplorationData();
        }, this.settings.autoSaveInterval);
    }
    
    // Main exploration methods
    async onPlayerMoved(playerId, x, y) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return;
        
        // Get player exploration data
        const explorationData = this.getPlayerExplorationData(playerId);
        
        // Update exploration
        const discoveries = await this.updatePlayerExploration(playerId, x, y, explorationData);
        
        // Process discoveries
        if (discoveries.length > 0) {
            await this.processDiscoveries(playerId, discoveries, explorationData);
        }
        
        // Update statistics
        this.updatePlayerStatistics(playerId, x, y, explorationData);
        
        // Check achievements
        await this.checkExplorationAchievements(playerId, explorationData);
    }
    
    async updatePlayerExploration(playerId, x, y, explorationData) {
        const discoveries = [];
        const regionId = this.worldManager.playerRegions.get(playerId);
        const region = this.worldManager.regions.get(regionId);
        
        if (!region) return discoveries;
        
        // Calculate explored tiles
        const exploredTiles = this.calculateExploredTiles(x, y);
        
        // Check each tile
        for (const tile of exploredTiles) {
            const tileKey = `${tile.x},${tile.y}`;
            
            // Skip if already explored
            if (explorationData.exploredTiles.has(tileKey)) continue;
            
            // Add to explored tiles
            explorationData.exploredTiles.add(tileKey);
            
            // Check for discoveries in this tile
            const tileDiscoveries = await this.checkTileDiscoveries(regionId, tile, playerId);
            discoveries.push(...tileDiscoveries);
            
            // Update global stats
            this.globalStats.totalTilesExplored++;
        }
        
        // Check for POI discoveries
        const poiDiscoveries = await this.checkPOIDiscoveries(regionId, x, y, playerId, explorationData);
        discoveries.push(...poiDiscoveries);
        
        // Update exploration progress
        this.updateExplorationProgress(regionId, explorationData);
        
        return discoveries;
    }
    
    calculateExploredTiles(centerX, centerY) {
        const tiles = [];
        const radius = this.settings.explorationRadius;
        const tileSize = this.settings.tileResolution;
        
        // Calculate tile bounds
        const minTileX = Math.floor((centerX - radius) / tileSize);
        const maxTileX = Math.floor((centerX + radius) / tileSize);
        const minTileY = Math.floor((centerY - radius) / tileSize);
        const maxTileY = Math.floor((centerY + radius) / tileSize);
        
        for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
            for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
                // Check if tile center is within exploration radius
                const tileCenterX = tileX * tileSize + tileSize / 2;
                const tileCenterY = tileY * tileSize + tileSize / 2;
                const distance = Math.sqrt(
                    Math.pow(tileCenterX - centerX, 2) + 
                    Math.pow(tileCenterY - centerY, 2)
                );
                
                if (distance <= radius) {
                    tiles.push({ x: tileX, y: tileY });
                }
            }
        }
        
        return tiles;
    }
    
    async checkTileDiscoveries(regionId, tile, playerId) {
        const discoveries = [];
        const region = this.worldManager.regions.get(regionId);
        if (!region) return discoveries;
        
        // Check for resources in this tile
        for (const [resourceId, resource] of region.resources) {
            const resourceTileX = Math.floor(resource.x / this.settings.tileResolution);
            const resourceTileY = Math.floor(resource.y / this.settings.tileResolution);
            
            if (resourceTileX === tile.x && resourceTileY === tile.y) {
                const discovery = {
                    type: 'resource',
                    id: resourceId,
                    data: resource,
                    tile: tile
                };
                discoveries.push(discovery);
            }
        }
        
        // Check for secrets in this tile
        const secret = await this.checkForSecrets(regionId, tile, playerId);
        if (secret) {
            discoveries.push({
                type: 'secret',
                id: secret.id,
                data: secret,
                tile: tile
            });
        }
        
        return discoveries;
    }
    
    async checkPOIDiscoveries(regionId, x, y, playerId, explorationData) {
        const discoveries = [];
        const region = this.worldManager.regions.get(regionId);
        if (!region) return discoveries;
        
        // Check POIs within discovery radius
        for (const poi of region.poi) {
            const distance = Math.sqrt(Math.pow(poi.x - x, 2) + Math.pow(poi.y - y, 2));
            
            if (distance <= this.settings.poiDiscoveryRadius) {
                // Check if already discovered
                if (explorationData.discoveredPOI.has(poi.id)) continue;
                
                // Check line of sight (simplified)
                if (this.hasLineOfSight(region, x, y, poi.x, poi.y)) {
                    const discovery = {
                        type: 'poi',
                        id: poi.id,
                        data: poi,
                        distance: distance
                    };
                    discoveries.push(discovery);
                }
            }
        }
        
        return discoveries;
    }
    
    async checkForSecrets(regionId, tile, playerId) {
        // Secret discovery logic
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return null;
        
        // Check player stats for secret finding
        const perception = player.stats?.perception || 10;
        const luck = player.stats?.luck || 10;
        
        // Base chance modified by player stats
        const baseChance = 0.02; // 2%
        const modifiedChance = baseChance * (1 + (perception + luck) / 100);
        
        if (Math.random() > modifiedChance) return null;
        
        // Generate secret
        const secret = this.generateSecret(regionId, tile, player);
        if (secret) {
            this.discoveredSecrets.set(secret.id, {
                ...secret,
                discoveredBy: playerId,
                discoveredAt: Date.now()
            });
        }
        
        return secret;
    }
    
    generateSecret(regionId, tile, player) {
        const secretTypes = ['hidden_treasure', 'ancient_relic', 'secret_passage', 'mysterious_shrine'];
        const type = secretTypes[Math.floor(Math.random() * secretTypes.length)];
        
        const secret = {
            id: `secret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            regionId: regionId,
            tile: tile,
            worldX: tile.x * this.settings.tileResolution,
            worldY: tile.y * this.settings.tileResolution
        };
        
        switch (type) {
            case 'hidden_treasure':
                secret.name = 'Tesouro Escondido';
                secret.description = 'Um baú antigo escondido nas sombras.';
                secret.rewards = {
                    gold: Math.floor(Math.random() * 200) + 100,
                    items: this.generateTreasureItems(player.level),
                    experience: Math.floor(Math.random() * 100) + 50
                };
                break;
                
            case 'ancient_relic':
                secret.name = 'Relíquia Antiga';
                secret.description = 'Um artefato de poder perdido no tempo.';
                secret.rewards = {
                    items: ['ancient_relic'],
                    experience: Math.floor(Math.random() * 200) + 100,
                    reputation: { scholars: 50 }
                };
                break;
                
            case 'secret_passage':
                secret.name = 'Passagem Secreta';
                secret.description = 'Um caminho oculto que leva a lugares desconhecidos.';
                secret.rewards = {
                    experience: Math.floor(Math.random() * 150) + 75,
                    discovery: 'hidden_area'
                };
                break;
                
            case 'mysterious_shrine':
                secret.name = 'Santuário Misterioso';
                secret.description = 'Um santurio antigo com poderes benéficos.';
                secret.rewards = {
                    blessing: this.generateRandomBlessing(),
                    experience: Math.floor(Math.random() * 100) + 50
                };
                break;
        }
        
        return secret;
    }
    
    generateTreasureItems(playerLevel) {
        const itemPools = {
            1: ['health_potion', 'mana_potion', 'iron_dagger'],
            10: ['leather_armor', 'steel_sword', 'magic_ring'],
            20: ['enchanted_armor', 'mythril_sword', 'rare_gem'],
            30: ['legendary_weapon', 'epic_armor', 'ancient_artifact']
        };
        
        const pool = itemPools[Math.floor(playerLevel / 10) * 10] || itemPools[1];
        const numItems = Math.floor(Math.random() * 3) + 1;
        const items = [];
        
        for (let i = 0; i < numItems; i++) {
            items.push(pool[Math.floor(Math.random() * pool.length)]);
        }
        
        return items;
    }
    
    generateRandomBlessing() {
        const blessings = [
            { type: 'stat_boost', stat: 'health', amount: 10, duration: 3600000 },
            { type: 'stat_boost', stat: 'attack', amount: 5, duration: 3600000 },
            { type: 'luck_boost', amount: 20, duration: 7200000 },
            { type: 'experience_boost', multiplier: 1.5, duration: 3600000 }
        ];
        
        return blessings[Math.floor(Math.random() * blessings.length)];
    }
    
    hasLineOfSight(region, x1, y1, x2, y2) {
        // Simplified line of sight check
        // In a real implementation, this would check for obstacles
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        return distance <= this.settings.poiDiscoveryRadius;
    }
    
    async processDiscoveries(playerId, discoveries, explorationData) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return;
        
        for (const discovery of discoveries) {
            switch (discovery.type) {
                case 'poi':
                    await this.processPOIDiscovery(playerId, discovery, explorationData);
                    break;
                case 'resource':
                    await this.processResourceDiscovery(playerId, discovery, explorationData);
                    break;
                case 'secret':
                    await this.processSecretDiscovery(playerId, discovery, explorationData);
                    break;
            }
        }
    }
    
    async processPOIDiscovery(playerId, discovery, explorationData) {
        const poi = discovery.data;
        
        // Add to discovered POI
        explorationData.discoveredPOI.add(poi.id);
        this.discoveredPOI.set(poi.id, {
            ...poi,
            discoveredBy: playerId,
            discoveredAt: Date.now()
        });
        
        // Award rewards
        const rewards = this.explorationRewards.poiDiscovery;
        this.awardExplorationRewards(playerId, rewards);
        
        // Send notification
        this.worldManager.sendToPlayer(playerId, {
            type: 'poi_discovered',
            poi: poi,
            message: `Você descobriu: ${poi.name}!`,
            rewards: rewards
        });
        
        // Update statistics
        explorationData.statistics.poiDiscovered++;
        this.globalStats.totalPOIDiscovered++;
        
        // Share with party/guild if enabled
        if (this.settings.sharedExploration) {
            await this.shareDiscovery(playerId, 'poi', poi.id);
        }
        
        console.log(`Player ${player.name} discovered POI: ${poi.name}`);
    }
    
    async processResourceDiscovery(playerId, discovery, explorationData) {
        const resource = discovery.data;
        
        // Add to discovered resources
        explorationData.discoveredResources.add(resource.id);
        
        // Award small reward
        const rewards = this.explorationRewards.resourceDiscovery;
        this.awardExplorationRewards(playerId, rewards);
        
        // Send notification
        this.worldManager.sendToPlayer(playerId, {
            type: 'resource_discovered',
            resource: resource,
            message: `Você encontrou: ${resource.type}`,
            rewards: rewards
        });
        
        console.log(`Player ${playerId} discovered resource: ${resource.type}`);
    }
    
    async processSecretDiscovery(playerId, discovery, explorationData) {
        const secret = discovery.data;
        
        // Add to discovered secrets
        explorationData.discoveredSecrets.add(secret.id);
        
        // Award rewards
        this.awardExplorationRewards(playerId, secret.rewards);
        
        // Send notification
        this.worldManager.sendToPlayer(playerId, {
            type: 'secret_discovered',
            secret: secret,
            message: `🌟 Descoberta secreta: ${secret.name}!`,
            rewards: secret.rewards
        });
        
        // Update statistics
        explorationData.statistics.secretsFound++;
        this.globalStats.totalSecretsFound++;
        
        console.log(`Player ${playerId} discovered secret: ${secret.name}`);
    }
    
    onPlayerRegionChanged(playerId, oldRegionId, newRegionId) {
        const explorationData = this.getPlayerExplorationData(playerId);
        
        // Check if this is a new region discovery
        if (!explorationData.discoveredRegions.has(newRegionId)) {
            this.discoverRegion(playerId, newRegionId, explorationData);
        }
    }
    
    async discoverRegion(playerId, regionId, explorationData) {
        const region = this.worldManager.regions.get(regionId);
        if (!region) return;
        
        // Add to discovered regions
        explorationData.discoveredRegions.add(regionId);
        this.discoveredRegions.add(regionId);
        
        // Award rewards
        const rewards = this.explorationRewards.firstDiscovery;
        this.awardExplorationRewards(playerId, rewards);
        
        // Send notification
        this.worldManager.sendToPlayer(playerId, {
            type: 'region_discovered',
            region: {
                id: regionId,
                name: region.name,
                type: region.type,
                levelRange: region.levelRange
            },
            message: `Você descobriu a região: ${region.name}!`,
            rewards: rewards
        });
        
        // Update statistics
        explorationData.statistics.regionsDiscovered++;
        this.globalStats.totalRegionsDiscovered++;
        
        // Share discovery
        await this.shareDiscovery(playerId, 'region', regionId);
        
        console.log(`Player ${playerId} discovered region: ${region.name}`);
    }
    
    // Progress tracking
    updateExplorationProgress(regionId, explorationData) {
        if (!explorationData.explorationProgress[regionId]) {
            explorationData.explorationProgress[regionId] = {
                exploredTiles: 0,
                totalTiles: 0,
                completionPercentage: 0,
                poiDiscovered: 0,
                totalPOI: 0,
                secretsFound: 0,
                lastUpdate: Date.now()
            };
        }
        
        const progress = explorationData.explorationProgress[regionId];
        const region = this.worldManager.regions.get(regionId);
        
        if (!region) return;
        
        // Calculate total tiles in region
        const tileWidth = Math.ceil(region.bounds.width / this.settings.tileResolution);
        const tileHeight = Math.ceil(region.bounds.height / this.settings.tileResolution);
        progress.totalTiles = tileWidth * tileHeight;
        
        // Count explored tiles in this region
        progress.exploredTiles = 0;
        for (const tileKey of explorationData.exploredTiles) {
            const [tileX, tileY] = tileKey.split(',').map(Number);
            const worldX = tileX * this.settings.tileResolution;
            const worldY = tileY * this.settings.tileResolution;
            
            if (worldX >= region.bounds.x && worldX <= region.bounds.x + region.bounds.width &&
                worldY >= region.bounds.y && worldY <= region.bounds.y + region.bounds.height) {
                progress.exploredTiles++;
            }
        }
        
        // Calculate completion percentage
        progress.completionPercentage = Math.floor((progress.exploredTiles / progress.totalTiles) * 100);
        
        // Count POI
        progress.poiDiscovered = 0;
        progress.totalPOI = region.poi.length;
        for (const poi of region.poi) {
            if (explorationData.discoveredPOI.has(poi.id)) {
                progress.poiDiscovered++;
            }
        }
        
        // Check for region completion
        if (progress.completionPercentage >= 100 && progress.poiDiscovered === progress.totalPOI) {
            if (!progress.completed) {
                this.completeRegionExploration(playerId, regionId, explorationData);
                progress.completed = true;
            }
        }
        
        progress.lastUpdate = Date.now();
    }
    
    async completeRegionExploration(playerId, regionId, explorationData) {
        const region = this.worldManager.regions.get(regionId);
        if (!region) return;
        
        // Award completion rewards
        const rewards = this.explorationRewards.regionCompletion;
        this.awardExplorationRewards(playerId, rewards);
        
        // Send notification
        this.worldManager.sendToPlayer(playerId, {
            type: 'region_exploration_completed',
            region: {
                id: regionId,
                name: region.name
            },
            message: `🎉 Você explorou completamente a região ${region.name}!`,
            rewards: rewards
        });
        
        // Award title if first time
        if (!explorationData.achievements.has('region_explorer')) {
            explorationData.achievements.add('region_explorer');
            this.worldManager.sendToPlayer(playerId, {
                type: 'achievement_earned',
                achievement: {
                    id: 'region_explorer',
                    name: 'Explorador de Regiões',
                    description: 'Completou a exploração de uma região'
                }
            });
        }
        
        console.log(`Player ${playerId} completed exploration of region: ${region.name}`);
    }
    
    // Statistics and achievements
    updatePlayerStatistics(playerId, x, y, explorationData) {
        const stats = explorationData.statistics;
        
        // Update tiles explored
        stats.tilesExplored = explorationData.exploredTiles.size;
        
        // Update total distance (simplified)
        if (explorationData.lastPosition) {
            const distance = Math.sqrt(
                Math.pow(x - explorationData.lastPosition.x, 2) + 
                Math.pow(y - explorationData.lastPosition.y, 2)
            );
            stats.totalDistance += distance;
        }
        
        explorationData.lastPosition = { x, y };
        stats.explorationTime = Date.now() - (explorationData.startTime || Date.now());
        
        // Update global top explorers
        this.updateTopExplorers(playerId, stats);
    }
    
    updateTopExplorers(playerId, stats) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return;
        
        const explorerData = {
            playerId: playerId,
            playerName: player.name,
            tilesExplored: stats.tilesExplored,
            regionsDiscovered: stats.regionsDiscovered,
            poiDiscovered: stats.poiDiscovered,
            secretsFound: stats.secretsFound,
            totalScore: this.calculateExplorerScore(stats)
        };
        
        // Update top explorers list
        const existingIndex = this.globalStats.topExplorers.findIndex(e => e.playerId === playerId);
        if (existingIndex >= 0) {
            this.globalStats.topExplorers[existingIndex] = explorerData;
        } else {
            this.globalStats.topExplorers.push(explorerData);
        }
        
        // Sort and keep top 10
        this.globalStats.topExplorers.sort((a, b) => b.totalScore - a.totalScore);
        this.globalStats.topExplorers = this.globalStats.topExplorers.slice(0, 10);
    }
    
    calculateExplorerScore(stats) {
        return (
            stats.tilesExplored * 1 +
            stats.regionsDiscovered * 100 +
            stats.poiDiscovered * 50 +
            stats.secretsFound * 200
        );
    }
    
    async checkExplorationAchievements(playerId, explorationData) {
        const achievements = [
            {
                id: 'novice_explorer',
                name: 'Explorador Novato',
                description: 'Explore 100 tiles',
                check: () => explorationData.statistics.tilesExplored >= 100
            },
            {
                id: 'seasoned_explorer',
                name: 'Explorador Experiente',
                description: 'Explore 1000 tiles',
                check: () => explorationData.statistics.tilesExplored >= 1000
            },
            {
                id: 'master_explorer',
                name: 'Mestre Explorador',
                description: 'Explore 5000 tiles',
                check: () => explorationData.statistics.tilesExplored >= 5000
            },
            {
                id: 'poi_hunter',
                name: 'Caçador de POI',
                description: 'Descubra 20 pontos de interesse',
                check: () => explorationData.statistics.poiDiscovered >= 20
            },
            {
                id: 'secret_seeker',
                name: 'Buscador de Segredos',
                description: 'Encontre 5 segredos',
                check: () => explorationData.statistics.secretsFound >= 5
            },
            {
                id: 'world_traveler',
                name: 'Viajante Mundial',
                description: 'Descubra 10 regiões',
                check: () => explorationData.statistics.regionsDiscovered >= 10
            }
        ];
        
        for (const achievement of achievements) {
            if (!explorationData.achievements.has(achievement.id) && achievement.check()) {
                await this.awardAchievement(playerId, achievement, explorationData);
            }
        }
    }
    
    async awardAchievement(playerId, achievement, explorationData) {
        explorationData.achievements.add(achievement.id);
        
        // Send notification
        this.worldManager.sendToPlayer(playerId, {
            type: 'achievement_earned',
            achievement: achievement,
            message: `🏆 Conquista obtida: ${achievement.name}`
        });
        
        // Award achievement rewards
        const rewards = {
            xp: 100,
            gold: 50
        };
        this.awardExplorationRewards(playerId, rewards);
        
        console.log(`Player ${playerId} earned achievement: ${achievement.name}`);
    }
    
    // Shared exploration
    async shareDiscovery(playerId, discoveryType, discoveryId) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return;
        
        // Get player's party and guild
        const partyId = player.partyId;
        const guildId = player.guildId;
        
        const groupsToShare = [];
        if (partyId) groupsToShare.push({ type: 'party', id: partyId });
        if (guildId) groupsToShare.push({ type: 'guild', id: guildId });
        
        for (const group of groupsToShare) {
            const groupId = `${group.type}_${group.id}`;
            
            if (!this.sharedExploration.has(groupId)) {
                this.sharedExploration.set(groupId, {
                    exploredTiles: new Set(),
                    discoveredPOI: new Set(),
                    discoveredResources: new Set(),
                    discoveredSecrets: new Set(),
                    lastUpdate: Date.now()
                });
            }
            
            const sharedData = this.sharedExploration.get(groupId);
            
            // Add discovery to shared data
            switch (discoveryType) {
                case 'poi':
                    sharedData.discoveredPOI.add(discoveryId);
                    break;
                case 'resource':
                    sharedData.discoveredResources.add(discoveryId);
                    break;
                case 'secret':
                    sharedData.discoveredSecrets.add(discoveryId);
                    break;
                case 'region':
                    // Regions are not shared in the same way
                    break;
            }
            
            // Notify group members
            await this.notifyGroupMembers(group, playerId, discoveryType, discoveryId);
        }
    }
    
    async notifyGroupMembers(group, discovererId, discoveryType, discoveryId) {
        // This would notify other members of the party/guild about the discovery
        // Implementation depends on the party/guild systems
        console.log(`Shared discovery ${discoveryType}:${discoveryId} with ${group.type}:${group.id}`);
    }
    
    // Utility methods
    getPlayerExplorationData(playerId) {
        if (!this.playerExploration.has(playerId)) {
            this.playerExploration.set(playerId, {
                exploredTiles: new Set(),
                discoveredRegions: new Set(),
                discoveredPOI: new Set(),
                discoveredResources: new Set(),
                discoveredSecrets: new Set(),
                explorationProgress: {},
                achievements: new Set(),
                statistics: {
                    tilesExplored: 0,
                    regionsDiscovered: 0,
                    poiDiscovered: 0,
                    secretsFound: 0,
                    totalDistance: 0,
                    explorationTime: 0
                },
                lastUpdate: Date.now(),
                startTime: Date.now()
            });
        }
        
        return this.playerExploration.get(playerId);
    }
    
    awardExplorationRewards(playerId, rewards) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return;
        
        if (rewards.xp) {
            player.gainExperience(rewards.xp);
        }
        
        if (rewards.gold) {
            player.gold += rewards.gold;
        }
        
        if (rewards.items) {
            for (const item of rewards.items) {
                player.addToInventory({ id: item, quantity: 1 });
            }
        }
        
        if (rewards.blessing) {
            player.applyBlessing(rewards.blessing);
        }
        
        if (rewards.reputation) {
            for (const [faction, amount] of Object.entries(rewards.reputation)) {
                player.addReputation({ faction, amount });
            }
        }
        
        if (rewards.title) {
            player.addTitle(rewards.title);
        }
    }
    
    // Event handlers
    onPlayerJoined(playerId) {
        // Initialize exploration data for new player
        this.getPlayerExplorationData(playerId);
    }
    
    onPlayerLeft(playerId) {
        // Save exploration data
        this.savePlayerExplorationData(playerId);
    }
    
    onPartyFormed(partyId, members) {
        // Initialize shared exploration for new party
        const groupId = `party_${partyId}`;
        if (!this.sharedExploration.has(groupId)) {
            this.sharedExploration.set(groupId, {
                exploredTiles: new Set(),
                discoveredPOI: new Set(),
                discoveredResources: new Set(),
                discoveredSecrets: new Set(),
                lastUpdate: Date.now()
            });
        }
    }
    
    onGuildJoined(playerId, guildId) {
        // Initialize shared exploration for guild
        const groupId = `guild_${guildId}`;
        if (!this.sharedExploration.has(groupId)) {
            this.sharedExploration.set(groupId, {
                exploredTiles: new Set(),
                discoveredPOI: new Set(),
                discoveredResources: new Set(),
                discoveredSecrets: new Set(),
                lastUpdate: Date.now()
            });
        }
    }
    
    // Public API
    async getExplorationMap(playerId, regionId) {
        const explorationData = this.getPlayerExplorationData(playerId);
        const region = this.worldManager.regions.get(regionId);
        
        if (!region) return null;
        
        const map = {
            regionId: regionId,
            bounds: region.bounds,
            tileSize: this.settings.tileResolution,
            exploredTiles: [],
            discoveredPOI: [],
            progress: explorationData.explorationProgress[regionId] || {}
        };
        
        // Add explored tiles
        for (const tileKey of explorationData.exploredTiles) {
            const [tileX, tileY] = tileKey.split(',').map(Number);
            const worldX = tileX * this.settings.tileResolution;
            const worldY = tileY * this.settings.tileResolution;
            
            if (worldX >= region.bounds.x && worldX <= region.bounds.x + region.bounds.width &&
                worldY >= region.bounds.y && worldY <= region.bounds.y + region.bounds.height) {
                map.exploredTiles.push({ x: tileX, y: tileY });
            }
        }
        
        // Add discovered POI
        for (const poi of region.poi) {
            if (explorationData.discoveredPOI.has(poi.id)) {
                map.discoveredPOI.push(poi);
            }
        }
        
        return map;
    }
    
    getExplorationStatistics(playerId) {
        const explorationData = this.getPlayerExplorationData(playerId);
        return explorationData.statistics;
    }
    
    getGlobalExplorationStatistics() {
        return this.globalStats;
    }
    
    getTopExplorers() {
        return this.globalStats.topExplorers;
    }
    
    isAreaExplored(playerId, x, y, radius = 10) {
        const explorationData = this.getPlayerExplorationData(playerId);
        const tileSize = this.settings.tileResolution;
        
        // Check tiles in the area
        const minTileX = Math.floor((x - radius) / tileSize);
        const maxTileX = Math.floor((x + radius) / tileSize);
        const minTileY = Math.floor((y - radius) / tileSize);
        const maxTileY = Math.floor((y + radius) / tileSize);
        
        for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
            for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
                const tileKey = `${tileX},${tileY}`;
                if (explorationData.exploredTiles.has(tileKey)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Database operations
    async saveExplorationData() {
        try {
            // Save player exploration data
            const playerData = {};
            for (const [playerId, data] of this.playerExploration) {
                playerData[playerId] = {
                    exploredTiles: Array.from(data.exploredTiles),
                    discoveredRegions: Array.from(data.discoveredRegions),
                    discoveredPOI: Array.from(data.discoveredPOI),
                    discoveredResources: Array.from(data.discoveredResources),
                    discoveredSecrets: Array.from(data.discoveredSecrets),
                    explorationProgress: data.explorationProgress,
                    achievements: Array.from(data.achievements),
                    statistics: data.statistics,
                    lastUpdate: data.lastUpdate
                };
            }
            // Simplified - just log for now since database.set is not available
            console.log('Saving exploration data for', Object.keys(playerData).length, 'players');
            // TODO: Implement proper database saving with SQL INSERT/UPDATE
            
            // Save shared exploration data
            const sharedData = {};
            for (const [groupId, data] of this.sharedExploration) {
                sharedData[groupId] = {
                    exploredTiles: Array.from(data.exploredTiles),
                    discoveredPOI: Array.from(data.discoveredPOI),
                    discoveredResources: Array.from(data.discoveredResources),
                    discoveredSecrets: Array.from(data.discoveredSecrets),
                    lastUpdate: data.lastUpdate
                };
            }
            await this.database.set('shared_exploration', sharedData);
            
            // Save world discovery data
            const worldData = {
                discoveredRegions: Array.from(this.discoveredRegions),
                discoveredPOI: Object.fromEntries(this.discoveredPOI),
                discoveredResources: Object.fromEntries(this.discoveredResources),
                discoveredSecrets: Object.fromEntries(this.discoveredSecrets)
            };
            await this.database.set('world_discovery', worldData);
            
            // Save global statistics
            await this.database.set('exploration_statistics', this.globalStats);
            
        } catch (error) {
            console.error('Error saving exploration data:', error);
        }
    }
    
    async savePlayerExplorationData(playerId) {
        const data = this.playerExploration.get(playerId);
        if (!data) return;
        
        try {
            const playerData = {
                [playerId]: {
                    exploredTiles: Array.from(data.exploredTiles),
                    discoveredRegions: Array.from(data.discoveredRegions),
                    discoveredPOI: Array.from(data.discoveredPOI),
                    discoveredResources: Array.from(data.discoveredResources),
                    discoveredSecrets: Array.from(data.discoveredSecrets),
                    explorationProgress: data.explorationProgress,
                    achievements: Array.from(data.achievements),
                    statistics: data.statistics,
                    lastUpdate: data.lastUpdate
                }
            };
            
            await this.database.set(`player_exploration_${playerId}`, playerData[playerId]);
        } catch (error) {
            console.error(`Error saving exploration data for player ${playerId}:`, error);
        }
    }
    
    // Cleanup
    cleanup() {
        this.playerExploration.clear();
        this.sharedExploration.clear();
        this.discoveredRegions.clear();
        this.discoveredPOI.clear();
        this.discoveredResources.clear();
        this.discoveredSecrets.clear();
        this.explorationAchievements.clear();
    }
}

module.exports = ExplorationSystem;
