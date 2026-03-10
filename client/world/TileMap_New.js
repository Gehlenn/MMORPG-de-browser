/**
 * Tile Map System
 * Manages game world maps using generated art assets
 */

class TileMap {
    constructor(assetManager) {
        this.assetManager = assetManager;
        
        // Map configuration
        this.tileSize = 64;
        this.currentMap = null;
        this.mapData = null;
        
        // Available maps
        this.maps = {
            village_day: {
                name: 'Vila Principal',
                description: 'Uma vila pacífica onde aventureiros começam sua jornada',
                width: 30, // tiles
                height: 17, // tiles
                spawnPoints: [
                    { x: 15, y: 8, type: 'player' },
                    { x: 10, y: 5, type: 'npc' },
                    { x: 20, y: 12, type: 'npc' }
                ],
                npcs: [
                    { x: 10, y: 5, type: 'innkeeper', name: 'Taberneiro' },
                    { x: 15, y: 3, type: 'merchant', name: 'Mercador' },
                    { x: 20, y: 12, type: 'captain', name: 'Capitão' },
                    { x: 8, y: 10, type: 'ranger_npc', name: 'Ranger' }
                ],
                objects: [
                    { x: 12, y: 8, type: 'fountain', name: 'Fonte' },
                    { x: 18, y: 6, type: 'statue', name: 'Estátua' },
                    { x: 5, y: 15, type: 'well', name: 'Poço' },
                    { x: 25, y: 10, type: 'blacksmith', name: 'Ferreiro' }
                ],
                exits: {
                    north: 'forest_north',
                    east: 'mountain_gate',
                    south: null,
                    west: null
                }
            },
            forest_north: {
                name: 'Floresta Norte',
                description: 'Uma floresta densa com criaturas misteriosas',
                width: 30,
                height: 17,
                spawnPoints: [
                    { x: 5, y: 8, type: 'player' }
                ],
                npcs: [
                    { x: 15, y: 10, type: 'hermit_npc', name: 'Ermitão' },
                    { x: 8, y: 12, type: 'explorer_npc', name: 'Explorador' }
                ],
                monsters: [
                    { x: 20, y: 5, type: 'goblin_raider', name: 'Goblin Saqueador' },
                    { x: 25, y: 15, type: 'dire_wolf', name: 'Lobo' },
                    { x: 3, y: 3, type: 'goblin_raider', name: 'Goblin Patrulheiro' }
                ],
                objects: [
                    { x: 10, y: 8, type: 'ancient_tree', name: 'Árvore Antiga' },
                    { x: 22, y: 12, type: 'mushroom_circle', name: 'Círculo de Cogumelos' },
                    { x: 5, y: 5, type: 'abandoned_camp', name: 'Acampamento Abandonado' }
                ],
                exits: {
                    north: null,
                    east: null,
                    south: 'village_day',
                    west: null
                }
            },
            mountain_gate: {
                name: 'Portão da Montanha',
                description: 'Um grande portão que leva às montanhas',
                width: 30,
                height: 17,
                spawnPoints: [
                    { x: 15, y: 8, type: 'player' }
                ],
                npcs: [
                    { x: 10, y: 10, type: 'sentinel', name: 'Sentinela' },
                    { x: 20, y: 5, type: 'sentinel', name: 'Guarda' }
                ],
                monsters: [
                    { x: 5, y: 15, type: 'mountain_orc', name: 'Orc da Montanha' }
                ],
                objects: [
                    { x: 15, y: 3, type: 'gate', name: 'Portão Principal' },
                    { x: 8, y: 12, type: 'watchtower', name: 'Torre de Vigia' }
                ],
                exits: {
                    north: 'mountain_inside',
                    east: null,
                    south: 'village_day',
                    west: null
                }
            },
            mountain_inside: {
                name: 'Caverna da Montanha',
                description: 'Uma caverna escura com tesouros escondidos',
                width: 25,
                height: 15,
                spawnPoints: [
                    { x: 12, y: 7, type: 'player' }
                ],
                npcs: [
                    { x: 5, y: 5, type: 'miner_npc', name: 'Minerador' }
                ],
                monsters: [
                    { x: 20, y: 10, type: 'goblin_raider', name: 'Goblin das Minas' },
                    { x: 8, y: 12, type: 'goblin_raider', name: 'Goblin Guarda' }
                ],
                objects: [
                    { x: 12, y: 3, type: 'crystal', name: 'Cristal Mágico' },
                    { x: 18, y: 10, type: 'treasure_chest', name: 'Baú do Tesouro' }
                ],
                exits: {
                    north: null,
                    east: null,
                    south: 'mountain_gate',
                    west: null
                }
            },
            cave_echo: {
                name: 'Caverna do Eco',
                description: 'Uma caverna misteriosa com ecos estranhos',
                width: 20,
                height: 15,
                spawnPoints: [
                    { x: 10, y: 7, type: 'player' }
                ],
                monsters: [
                    { x: 5, y: 5, type: 'dire_wolf', name: 'Lobo Alfa' },
                    { x: 15, y: 12, type: 'goblin_raider', name: 'Goblin das Sombras' }
                ],
                objects: [
                    { x: 8, y: 8, type: 'echo_crystal', name: 'Cristal do Eco' },
                    { x: 12, y: 3, type: 'ancient_runes', name: 'Runas Antigas' }
                ],
                exits: {
                    north: null,
                    east: 'dungeon_solo_ruins',
                    south: null,
                    west: null
                }
            },
            dungeon_solo_ruins: {
                name: 'Ruínas da Masmorra',
                description: 'Ruínas antigas com perigos ocultos',
                width: 25,
                height: 15,
                spawnPoints: [
                    { x: 12, y: 7, type: 'player' }
                ],
                monsters: [
                    { x: 5, y: 5, type: 'mountain_orc', name: 'Orc Guerreiro' },
                    { x: 20, y: 10, type: 'goblin_raider', name: 'Goblin Chefe' }
                ],
                objects: [
                    { x: 10, y: 8, type: 'altar', name: 'Altar Antigo' },
                    { x: 15, y: 3, type: 'sarcophagus', name: 'Sarcófago' }
                ],
                exits: {
                    north: null,
                    east: 'dungeon_group_crypt',
                    south: null,
                    west: 'cave_echo'
                }
            },
            dungeon_group_crypt: {
                name: 'Cripta Grupal',
                description: 'Uma cripta onde aventureiros se unem contra chefões',
                width: 20,
                height: 15,
                spawnPoints: [
                    { x: 10, y: 7, type: 'player' }
                ],
                monsters: [
                    { x: 5, y: 5, type: 'mountain_orc', name: 'Orc Chefe' },
                    { x: 15, y: 10, type: 'goblin_raider', name: 'Goblin Sombrio' },
                    { x: 8, y: 12, type: 'dire_wolf', name: 'Lobo Beta' }
                ],
                objects: [
                    { x: 10, y: 8, type: 'throne', name: 'Trono do Rei Goblin' },
                    { x: 5, y: 3, type: 'treasure_pile', name: 'Pilha de Tesouros' }
                ],
                exits: {
                    north: null,
                    east: null,
                    south: null,
                    west: 'dungeon_solo_ruins'
                }
            },
            swamp_west: {
                name: 'Pântano Oeste',
                description: 'Um pântano perigoso com criaturas únicas',
                width: 30,
                height: 17,
                spawnPoints: [
                    { x: 5, y: 8, type: 'player' }
                ],
                npcs: [
                    { x: 15, y: 10, type: 'hermit_npc', name: 'Ermitão do Pântano' }
                ],
                monsters: [
                    { x: 20, y: 5, type: 'dire_wolf', name: 'Lobo do Pântano' },
                    { x: 10, y: 15, type: 'goblin_raider', name: 'Goblin do Pântano' }
                ],
                objects: [
                    { x: 8, y: 8, type: 'witch_hut', name: 'Cabana da Bruxa' },
                    { x: 22, y: 12, type: 'mystic_stones', name: 'Pedras Místicas' }
                ],
                exits: {
                    north: null,
                    east: null,
                    south: null,
                    west: 'village_day'
                }
            }
        };
        
        // Tile types for collision and interaction
        this.tileTypes = {
            WALKABLE: 0,
            SOLID: 1,
            WATER: 2,
            LAVA: 3,
            INTERACTIVE: 4,
            SPAWN: 5
        };
        
        // Object types
        this.objectTypes = {
            FOUNTAIN: 'fountain',
            STATUE: 'statue',
            WELL: 'well',
            BLACKSMITH: 'blacksmith',
            ANCIENT_TREE: 'ancient_tree',
            MUSHROOM_CIRCLE: 'mushroom_circle',
            ABANDONED_CAMP: 'abandoned_camp',
            GATE: 'gate',
            WATCHTOWER: 'watchtower',
            CRYSTAL: 'crystal',
            TREASURE_CHEST: 'treasure_chest',
            ECHO_CRYSTAL: 'echo_crystal',
            ANCIENT_RUNES: 'ancient_runes',
            ALTAR: 'altar',
            SARCOPHAGUS: 'sarcophagus',
            THRONE: 'throne',
            TREASURE_PILE: 'treasure_pile',
            WITCH_HUT: 'witch_hut',
            MYSTIC_STONES: 'mystic_stones'
        };
    }
    
    /**
     * Load a map
     */
    async loadMap(mapName) {
        console.log(`🗺️ Carregando mapa: ${mapName}`);
        
        const mapConfig = this.maps[mapName];
        if (!mapConfig) {
            console.error(`❌ Mapa não encontrado: ${mapName}`);
            return false;
        }
        
        // Load map asset
        const mapAsset = this.assetManager.getMap(mapName);
        if (!mapAsset || !mapAsset.loaded) {
            console.error(`❌ Asset do mapa não carregado: ${mapName}`);
            return false;
        }
        
        // Create map data structure
        this.currentMap = {
            name: mapName,
            config: mapConfig,
            asset: mapAsset,
            width: mapConfig.width,
            height: mapConfig.height,
            entities: [],
            objects: [],
            npcs: [],
            monsters: [],
            collisionMap: this.createCollisionMap(mapConfig)
        };
        
        // Initialize entities
        this.initializeMapEntities();
        
        console.log(`✅ Mapa ${mapName} carregado com sucesso!`);
        return true;
    }
    
    /**
     * Create collision map for the current map
     */
    createCollisionMap(mapConfig) {
        const collisionMap = [];
        
        for (let y = 0; y < mapConfig.height; y++) {
            collisionMap[y] = [];
            for (let x = 0; x < mapConfig.width; x++) {
                // Basic collision - most tiles are walkable except borders
                if (x === 0 || x === mapConfig.width - 1 || 
                    y === 0 || y === mapConfig.height - 1) {
                    collisionMap[y][x] = this.tileTypes.SOLID;
                } else {
                    collisionMap[y][x] = this.tileTypes.WALKABLE;
                }
            }
        }
        
        return collisionMap;
    }
    
    /**
     * Initialize map entities (NPCs, monsters, objects)
     */
    initializeMapEntities() {
        const mapConfig = this.currentMap.config;
        
        // Add NPCs
        if (mapConfig.npcs) {
            mapConfig.npcs.forEach(npcData => {
                const npc = {
                    id: `npc_${npcData.type}_${Date.now()}`,
                    x: npcData.x,
                    y: npcData.y,
                    type: npcData.type,
                    name: npcData.name,
                    entityType: 'npc',
                    behavior: 'idle',
                    dialogue: this.generateNPCDialogue(npcData.type),
                    inventory: this.generateNPCInventory(npcData.type)
                };
                
                this.currentMap.npcs.push(npc);
                this.currentMap.entities.push(npc);
            });
        }
        
        // Add monsters
        if (mapConfig.monsters) {
            mapConfig.monsters.forEach(monsterData => {
                const monster = {
                    id: `monster_${monsterData.type}_${Date.now()}`,
                    x: monsterData.x,
                    y: monsterData.y,
                    type: monsterData.type,
                    name: monsterData.name,
                    entityType: 'monster',
                    behavior: 'patrol',
                    health: this.getMonsterHealth(monsterData.type),
                    maxHealth: this.getMonsterHealth(monsterData.type),
                    damage: this.getMonsterDamage(monsterData.type),
                    speed: this.getMonsterSpeed(monsterData.type),
                    patrolPath: this.generatePatrolPath(monsterData)
                };
                
                this.currentMap.monsters.push(monster);
                this.currentMap.entities.push(monster);
            });
        }
        
        // Add objects
        if (mapConfig.objects) {
            mapConfig.objects.forEach(objectData => {
                const object = {
                    id: `object_${objectData.type}_${Date.now()}`,
                    x: objectData.x,
                    y: objectData.y,
                    type: objectData.type,
                    name: objectData.name,
                    entityType: 'object',
                    interactive: this.isObjectInteractive(objectData.type),
                    action: this.getObjectAction(objectData.type),
                    loot: this.generateObjectLoot(objectData.type)
                };
                
                this.currentMap.objects.push(object);
                this.currentMap.entities.push(object);
            });
        }
    }
    
    /**
     * Generate NPC dialogue based on type
     */
    generateNPCDialogue(npcType) {
        const dialogues = {
            innkeeper: [
                "Bem-vindo à minha taverna! Precisa de um lugar para descansar?",
                "Tenho as melhores bebidas da região!",
                "Ouvi rumores sobre aventureiros como você..."
            ],
            merchant: [
                "Olá! Tenho itens especiais para aventureiros.",
                "Veja minhas mercadorias - preços justos!",
                "Volte sempre que precisar de suprimentos."
            ],
            captain: [
                "Capitão da guarda, a seu serviço!",
                "A vila está segura sob minha proteção.",
                "Há rumores de monstros nas florestas próximas..."
            ],
            explorer: [
                "Eu já explorei muitas terras distantes!",
                "Cuidado com as cavernas nas montanhas.",
                "Posso te dar algumas dicas sobre a região."
            ],
            hermit: [
                "Eu prefiro a solidão da floresta...",
                "A natureza me ensina mais do que qualquer livro.",
                "Há segredos antigos nestas terras..."
            ],
            miner: [
                "Estou sempre em busca de minérios raros!",
                "As montanhas guardam muitos tesouros.",
                "Cuidado com as minas abandonadas..."
            ],
            ranger: [
                "Eu conheço estas florestas como a palma da minha mão.",
                "Os animais têm mudado de comportamento ultimamente.",
                "Posso te guiar por caminhos seguros."
            ],
            sentinel: [
                "Nada passa por mim sem que eu veja!",
                "Minha função é proteger esta área.",
                "Reporte qualquer atividade suspeita."
            ]
        };
        
        return dialogues[npcType] || ["Olá, aventureiro!"];
    }
    
    /**
     * Generate NPC inventory
     */
    generateNPCInventory(npcType) {
        const inventories = {
            innkeeper: [
                { name: 'Pão', type: 'food', price: 5 },
                { name: 'Cerveja', type: 'drink', price: 8 },
                { name: 'Quarto', type: 'service', price: 20 }
            ],
            merchant: [
                { name: 'Poção de Cura', type: 'potion', price: 50 },
                { name: 'Espada de Ferro', type: 'weapon', price: 100 },
                { name: 'Armadura de Couro', type: 'armor', price: 80 }
            ],
            captain: [
                { name: 'Mapa da Região', type: 'quest', price: 0 },
                { name: 'Distintivo da Guarda', type: 'item', price: 0 }
            ]
        };
        
        return inventories[npcType] || [];
    }
    
    /**
     * Get monster health by type
     */
    getMonsterHealth(monsterType) {
        const healthValues = {
            goblin_raider: 50,
            dire_wolf: 80,
            mountain_orc: 120
        };
        
        return healthValues[monsterType] || 50;
    }
    
    /**
     * Get monster damage by type
     */
    getMonsterDamage(monsterType) {
        const damageValues = {
            goblin_raider: 8,
            dire_wolf: 15,
            mountain_orc: 25
        };
        
        return damageValues[monsterType] || 10;
    }
    
    /**
     * Get monster speed by type
     */
    getMonsterSpeed(monsterType) {
        const speedValues = {
            goblin_raider: 1.2,
            dire_wolf: 1.8,
            mountain_orc: 0.8
        };
        
        return speedValues[monsterType] || 1.0;
    }
    
    /**
     * Generate patrol path for monsters
     */
    generatePatrolPath(monsterData) {
        const path = [];
        const startX = monsterData.x;
        const startY = monsterData.y;
        const radius = 3;
        
        // Create a simple square patrol pattern
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.round(startX + Math.cos(angle) * radius);
            const y = Math.round(startY + Math.sin(angle) * radius);
            
            path.push({ x, y });
        }
        
        return path;
    }
    
    /**
     * Check if position is walkable
     */
    isWalkable(x, y) {
        if (!this.currentMap || !this.currentMap.collisionMap) return false;
        
        // Check bounds
        if (x < 0 || x >= this.currentMap.width || 
            y < 0 || y >= this.currentMap.height) {
            return false;
        }
        
        // Check collision map
        const tile = this.currentMap.collisionMap[y][x];
        return tile === this.tileTypes.WALKABLE || tile === this.tileTypes.INTERACTIVE;
    }
    
    /**
     * Get entity at position
     */
    getEntityAt(x, y) {
        if (!this.currentMap) return null;
        
        return this.currentMap.entities.find(entity => 
            Math.floor(entity.x) === x && Math.floor(entity.y) === y
        );
    }
    
    /**
     * Get all entities in radius
     */
    getEntitiesInRadius(x, y, radius) {
        if (!this.currentMap) return [];
        
        return this.currentMap.entities.filter(entity => {
            const distance = Math.sqrt(
                Math.pow(entity.x - x, 2) + 
                Math.pow(entity.y - y, 2)
            );
            return distance <= radius;
        });
    }
    
    /**
     * Get spawn point for entity type
     */
    getSpawnPoint(entityType = 'player') {
        if (!this.currentMap || !this.currentMap.config.spawnPoints) {
            return { x: 15, y: 8 }; // Default spawn
        }
        
        const spawnPoints = this.currentMap.config.spawnPoints.filter(
            point => point.type === entityType
        );
        
        if (spawnPoints.length === 0) {
            return this.currentMap.config.spawnPoints[0]; // Fallback
        }
        
        // Return random spawn point for this entity type
        return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    }
    
    /**
     * Get map exits
     */
    getExits() {
        return this.currentMap?.config?.exits || {};
    }
    
    /**
     * Change to different map
     */
    changeMap(newMapName) {
        if (this.maps[newMapName]) {
            return this.loadMap(newMapName);
        }
        
        console.error(`❌ Mapa não encontrado: ${newMapName}`);
        return false;
    }
    
    /**
     * Get current map info
     */
    getCurrentMapInfo() {
        if (!this.currentMap) return null;
        
        return {
            name: this.currentMap.name,
            displayName: this.currentMap.config.name,
            description: this.currentMap.config.description,
            width: this.currentMap.width,
            height: this.currentMap.height,
            entityCount: {
                npcs: this.currentMap.npcs.length,
                monsters: this.currentMap.monsters.length,
                objects: this.currentMap.objects.length,
                total: this.currentMap.entities.length
            },
            exits: this.currentMap.config.exits
        };
    }
    
    /**
     * Check if object type is interactive
     */
    isObjectInteractive(objectType) {
        const interactiveObjects = [
            'fountain', 'statue', 'well', 'blacksmith',
            'ancient_tree', 'mushroom_circle', 'abandoned_camp',
            'crystal', 'treasure_chest', 'echo_crystal',
            'ancient_runes', 'altar', 'sarcophagus',
            'throne', 'treasure_pile', 'witch_hut', 'mystic_stones'
        ];
        
        return interactiveObjects.includes(objectType);
    }
    
    /**
     * Get object action description
     */
    getObjectAction(objectType) {
        const actions = {
            fountain: 'Beber água fresca',
            statue: 'Examinar estátua antiga',
            well: 'Buscar no poço',
            blacksmith: 'Conversar com ferreiro',
            ancient_tree: 'Examinar árvore milenar',
            mushroom_circle: 'Investigar círculo mágico',
            abandoned_camp: 'Explorar acampamento',
            crystal: 'Tocar cristal',
            treasure_chest: 'Abrir baú do tesouro',
            echo_crystal: 'Ouvir ecos',
            ancient_runes: 'Decifrar runas',
            altar: 'Usar altar',
            sarcophagus: 'Abrir sarcófago',
            throne: 'Sentar no trono',
            treasure_pile: 'Pegar tesouros',
            witch_hut: 'Entrar na cabana',
            mystic_stones: 'Examinar pedras'
        };
        
        return actions[objectType] || 'Examinar';
    }
    
    /**
     * Generate object loot
     */
    generateObjectLoot(objectType) {
        const lootTables = {
            treasure_chest: [
                { name: 'Moedas de Ouro', type: 'gold', quantity: 50 },
                { name: 'Poção de Cura', type: 'potion', quantity: 2 },
                { name: 'Gema Mágica', type: 'gem', quantity: 1 }
            ],
            crystal: [
                { name: 'Fragmento de Cristal', type: 'material', quantity: 3 },
                { name: 'Energia Arcana', type: 'mana', quantity: 20 }
            ],
            ancient_runes: [
                { name: 'Pergaminho Antigo', type: 'scroll', quantity: 1 },
                { name: 'Conhecimento Arcano', type: 'knowledge', quantity: 1 }
            ],
            sarcophagus: [
                { name: 'Artefato Antigo', type: 'artifact', quantity: 1 },
                { name: 'Amuleto da Morte', type: 'amulet', quantity: 1 }
            ],
            throne: [
                { name: 'Coroa do Rei', type: 'crown', quantity: 1 },
                { name: 'Cetro Real', type: 'scepter', quantity: 1 }
            ],
            treasure_pile: [
                { name: 'Tesouro Escondido', type: 'treasure', quantity: 100 },
                { name: 'Jóias Raras', type: 'jewels', quantity: 5 }
            ],
            witch_hut: [
                { name: 'Poção Misteriosa', type: 'potion', quantity: 1 },
                { name: 'Ingrediente Mágico', type: 'ingredient', quantity: 3 }
            ],
            mystic_stones: [
                { name: 'Pedra do Poder', type: 'stone', quantity: 1 },
                { name: 'Essência Elemental', type: 'essence', quantity: 2 }
            ]
        };
        
        return lootTables[objectType] || [];
    }

    /**
     * Get map configuration
     */
    getMapConfig(mapName) {
        return this.maps[mapName];
    }
    
    /**
     * Get all available maps
     */
    getAvailableMaps() {
        return Object.keys(this.maps).map(key => ({
            id: key,
            name: this.maps[key].name,
            description: this.maps[key].description
        }));
    }
}

// Export constants
window.TILE_SIZE = 64;
window.GRID_W = 30;
window.GRID_H = 17;

// Global instance
window.tileMapNew = new TileMap();
window.TileMap = TileMap;
