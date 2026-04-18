/**
 * Integrated Map System - Legacy of Komodo
 * Sistema de mapas do mundo de Aethelgard
 * Fragmentos de Komodo e civilizações perdidas
 */

class IntegratedMap {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.tileSize = 32;
        this.mapWidth = 50;
        this.mapHeight = 30;
        
        // Configurações do mundo de Aethelgard
        this.gameWorld = {
            name: 'Aethelgard',
            title: 'Legacy of Komodo',
            lore: 'Mundo de fantasia medieval com Fragmentos de Komodo'
        };
        
        // Dados do mapa
        this.tiles = [];
        this.npcs = [];
        this.items = [];
        this.portals = [];
        
        // Configurações das áreas de Aethelgard e Raids
        this.config = {
            currentArea: 'verdanthis_village',
            areas: {
                verdanthis_village: {
                    name: 'Aldeia Verdantis',
                    description: 'Ponto inicial para aventureiros em Aethelgard',
                    width: 50,
                    height: 30,
                    spawnPoint: { x: 400, y: 300 },
                    backgroundColor: '#2d5016',
                    tileTheme: 'grass',
                    level: 'starting'
                },
                eldoria_city: {
                    name: 'Cidade de Eldoria',
                    description: 'Capital do reino, centro do poder',
                    width: 60,
                    height: 40,
                    spawnPoint: { x: 300, y: 200 },
                    backgroundColor: '#1e3a5f',
                    tileTheme: 'stone',
                    level: 'capital'
                },
                draconia_mountains: {
                    name: 'Montanhas Dracônia',
                    description: 'Terras altas guardadas por dragões antigos',
                    width: 45,
                    height: 25,
                    spawnPoint: { x: 225, y: 125 },
                    backgroundColor: '#4a4a4a',
                    tileTheme: 'mountain',
                    level: 'high'
                },
                aurelia_swamps: {
                    name: 'Pântanos Aurélia',
                    description: 'Terras pantanosas com segredos antigos',
                    width: 40,
                    height: 20,
                    spawnPoint: { x: 200, y: 100 },
                    backgroundColor: '#1a4d2e',
                    tileTheme: 'swamp',
                    level: 'medium'
                },
                ruins_komodo: {
                    name: 'Ruínas de Komodo',
                    description: 'Antiga civilização dos Construtores',
                    width: 30,
                    height: 20,
                    spawnPoint: { x: 150, y: 100 },
                    backgroundColor: '#2c1810',
                    tileTheme: 'ruins',
                    isDungeon: true,
                    level: 'high'
                },
                crypt_builders: {
                    name: 'Cripta dos Construtores',
                    description: 'Túmulo dos antigos Construtores',
                    width: 35,
                    height: 25,
                    spawnPoint: { x: 175, y: 125 },
                    backgroundColor: '#1a0f0f',
                    tileTheme: 'crypt',
                    isDungeon: true,
                    level: 'very_high'
                },
                // Áreas das Raids dos Generais Demônios
                fortress_of_agony: {
                    name: 'Fortaleza da Agonia',
                    description: 'Fortaleza escura onde Arkazhul tortura almas',
                    width: 40,
                    height: 30,
                    spawnPoint: { x: 200, y: 150 },
                    backgroundColor: '#4a0a0a',
                    tileTheme: 'dark',
                    isRaid: true,
                    level: 90,
                    boss: 'Arkazhul',
                    title: 'Master of Torture'
                },
                infernal_crucible: {
                    name: 'Crucível Infernal',
                    description: 'Vulcão onde Vorthrax forja armas de destruição',
                    width: 45,
                    height: 35,
                    spawnPoint: { x: 225, y: 175 },
                    backgroundColor: '#8b2500',
                    tileTheme: 'volcano',
                    isRaid: true,
                    level: 92,
                    boss: 'Vorthrax',
                    title: 'General of Destruction'
                },
                cathedral_of_decay: {
                    name: 'Catedral da Decadência',
                    description: 'Catedral corrompida onde Valzareth espalha escuridão',
                    width: 50,
                    height: 40,
                    spawnPoint: { x: 250, y: 200 },
                    backgroundColor: '#1a0a1a',
                    tileTheme: 'corrupted',
                    isRaid: true,
                    level: 94,
                    boss: 'Valzareth',
                    title: 'Lord of Corruption'
                },
                citadel_of_the_void: {
                    name: 'Cidadela do Void',
                    description: 'Fortaleza dimensional onde Dravokhar devora almas',
                    width: 55,
                    height: 45,
                    spawnPoint: { x: 275, y: 225 },
                    backgroundColor: '#0a0a1a',
                    tileTheme: 'void',
                    isRaid: true,
                    level: 96,
                    boss: 'Dravokhar',
                    title: 'Devourer of Souls'
                },
                abyss_gate: {
                    name: 'Portão do Abismo',
                    description: 'Confronto final com Malekondrius, Lord of the Abyss',
                    width: 60,
                    height: 50,
                    spawnPoint: { x: 300, y: 250 },
                    backgroundColor: '#000000',
                    tileTheme: 'abyss',
                    isRaid: true,
                    level: 99,
                    boss: 'Malekondrius',
                    title: 'Lord of the Abyss',
                    isFinal: true
                }
            }
        };
        
        this.initializeMap();
    }
    
    initializeMap() {
        console.log('🗺️ Inicializando mapa integrado...');
        
        // Carregar área atual
        this.loadArea('plains');
        
        // Inicializar NPCs
        this.initializeNPCs();
        
        // Inicializar itens
        this.initializeItems();
        
        // Inicializar portais
        this.initializePortals();
        
        console.log('✅ Mapa integrado inicializado');
    }
    
    loadArea(areaId) {
        const area = this.config.areas[areaId];
        if (!area) {
            console.warn(`Área não encontrada: ${areaId}`);
            return;
        }
        
        this.config.currentArea = areaId;
        this.mapWidth = area.width;
        this.mapHeight = area.height;
        
        // Gerar tiles do mapa
        this.generateTiles(area);
        
        console.log(`📍 Área carregada: ${area.name}`);
    }
    
    generateTiles(area) {
        this.tiles = [];
        
        for (let y = 0; y < area.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < area.width; x++) {
                const tile = this.generateTile(x, y, area.tileTheme);
                this.tiles[y][x] = tile;
            }
        }
        
        // Adicionar estruturas especiais
        this.addStructures(area);
    }
    
    generateTile(x, y, theme) {
        const tileVariations = {
            grass: [
                { type: 'grass', walkable: true, texture: 'grass' },
                { type: 'grass', walkable: true, texture: 'grass' },
                { type: 'stone', walkable: false, texture: 'stone' },
                { type: 'water', walkable: false, texture: 'water' }
            ],
            forest: [
                { type: 'grass', walkable: true, texture: 'grass' },
                { type: 'grass', walkable: true, texture: 'grass' },
                { type: 'tree', walkable: false, texture: 'tree' },
                { type: 'grass', walkable: true, texture: 'grass' }
            ],
            sand: [
                { type: 'sand', walkable: true, texture: 'sand' },
                { type: 'sand', walkable: true, texture: 'sand' },
                { type: 'stone', walkable: false, texture: 'stone' },
                { type: 'water', walkable: false, texture: 'water' }
            ],
            stone: [
                { type: 'stone', walkable: true, texture: 'stone' },
                { type: 'stone', walkable: true, texture: 'stone' },
                { type: 'mountain', walkable: false, texture: 'mountain' },
                { type: 'stone', walkable: true, texture: 'stone' }
            ]
        };
        
        const variations = tileVariations[theme] || tileVariations.grass;
        const random = Math.random();
        
        // 70% chance de tile normal, 30% de especial
        if (random < 0.7) {
            return variations[Math.floor(Math.random() * variations.length)];
        } else {
            return variations[Math.floor(Math.random() * 2)]; // Apenas os primeiros 2 tipos
        }
    }
    
    addStructures(area) {
        // Adicionar edifícios e estruturas especiais
        
        if (area.id === 'plains') {
            // Adicionar algumas árvores
            for (let i = 0; i < 10; i++) {
                const x = Math.floor(Math.random() * area.width);
                const y = Math.floor(Math.random() * area.height);
                if (this.tiles[y] && this.tiles[y][x]) {
                    this.tiles[y][x] = { type: 'tree', walkable: false, texture: 'tree' };
                }
            }
            
            // Adicionar pedras
            for (let i = 0; i < 5; i++) {
                const x = Math.floor(Math.random() * area.width);
                const y = Math.floor(Math.random() * area.height);
                if (this.tiles[y] && this.tiles[y][x]) {
                    this.tiles[y][x] = { type: 'stone', walkable: false, texture: 'stone' };
                }
            }
        }
        
        // Adicionar água em algumas áreas
        if (area.tileTheme === 'grass' || area.tileTheme === 'forest') {
            // Criar pequenos lagos
            for (let i = 0; i < 2; i++) {
                const centerX = Math.floor(Math.random() * (area.width - 5)) + 2;
                const centerY = Math.floor(Math.random() * (area.height - 5)) + 2;
                
                for (let dx = -2; dx <= 2; dx++) {
                    for (let dy = -2; dy <= 2; dy++) {
                        const x = centerX + dx;
                        const y = centerY + dy;
                        if (x >= 0 && x < area.width && y >= 0 && y < area.height) {
                            if (Math.abs(dx) === 2 || Math.abs(dy) === 2) {
                                this.tiles[y][x] = { type: 'water', walkable: false, texture: 'water' };
                            }
                        }
                    }
                }
            }
        }
    }
    
    initializeNPCs() {
        this.npcs = [];
        
        // Adicionar NPCs baseados na área atual
        const area = this.config.areas[this.config.currentArea];
        
        if (area.isDungeon) {
            // NPCs de dungeon
            this.npcs.push({
                id: 'dungeon_entrance',
                name: 'Portal de Saída',
                type: 'portal',
                x: area.spawnPoint.x,
                y: area.spawnPoint.y,
                texture: 'portal',
                interaction: 'exit',
                targetArea: 'plains'
            });
        } else {
            // NPCs normais da área
            const npcConfigs = this.assetManager.getAllNPCConfigs();
            
            npcConfigs.forEach((config, index) => {
                // Apenas NPCs que fazem sentido na área atual
                if (this.shouldSpawnNPC(config, area)) {
                    this.npcs.push({
                        ...config,
                        id: `npc_${index}`,
                        texture: config.type,
                        interaction: 'dialogue'
                    });
                }
            });
        }
        
        console.log(`👥 ${this.npcs.length} NPCs inicializados`);
    }
    
    shouldSpawnNPC(npcConfig, area) {
        // Lógica de quais NPCs devem aparecer em quais áreas
        const npcTypeRules = {
            merchant: ['plains', 'forest'],
            guard: ['plains', 'forest', 'mountain'],
            quest_giver: ['plains', 'forest', 'mountain'],
            innkeeper: ['plains', 'forest'],
            hunter: ['forest', 'mountain'],
            craftsman: ['plains', 'mountain']
        };
        
        const allowedAreas = npcTypeRules[npcConfig.type] || ['plains'];
        return allowedAreas.includes(area.tileTheme);
    }
    
    initializeItems() {
        this.items = [];
        
        // Adicionar itens aleatórios no mapa
        const itemCount = Math.floor(Math.random() * 10) + 5;
        
        for (let i = 0; i < itemCount; i++) {
            const x = Math.floor(Math.random() * this.mapWidth);
            const y = Math.floor(Math.random() * this.mapHeight);
            
            // Verificar se o tile é walkable
            if (this.isWalkable(x, y)) {
                const itemTypes = ['potion', 'coin', 'sword', 'shield'];
                const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                
                this.items.push({
                    id: `item_${i}`,
                    type: itemType,
                    x: x,
                    y: y,
                    texture: itemType
                });
            }
        }
        
        console.log(`🎒 ${this.items.length} itens inicializados`);
    }
    
    initializePortals() {
        this.portals = [];
        
        // Adicionar portais entre áreas
        const area = this.config.areas[this.config.currentArea];
        
        if (!area.isDungeon) {
            // Portal para dungeon
            this.portals.push({
                id: 'portal_dungeon',
                name: 'Portal para Ruínas',
                x: area.width * this.tileSize - 100,
                y: area.height * this.tileSize / 2,
                targetArea: 'dungeon_solo_ruins',
                texture: 'portal'
            });
        }
        
        console.log(`🌀 ${this.portals.length} portais inicializados`);
    }
    
    render(ctx, camera) {
        const area = this.config.areas[this.config.currentArea];
        
        // Renderizar background
        ctx.fillStyle = area.backgroundColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Calcular tiles visíveis
        const startTileX = Math.floor(camera.x / this.tileSize);
        const startTileY = Math.floor(camera.y / this.tileSize);
        const endTileX = Math.ceil((camera.x + camera.width) / this.tileSize);
        const endTileY = Math.ceil((camera.y + camera.height) / this.tileSize);
        
        // Renderizar tiles
        for (let y = startTileY; y < endTileY && y < this.mapHeight; y++) {
            for (let x = startTileX; x < endTileX && x < this.mapWidth; x++) {
                const tile = this.tiles[y] ? this.tiles[y][x] : null;
                if (tile) {
                    const screenX = x * this.tileSize - camera.x;
                    const screenY = y * this.tileSize - camera.y;
                    
                    // Renderizar tile
                    this.assetManager.drawSprite(ctx, 'tiles', tile.texture, screenX, screenY, this.tileSize, this.tileSize);
                }
            }
        }
        
        // Renderizar itens
        this.renderItems(ctx, camera);
        
        // Renderizar NPCs
        this.renderNPCs(ctx, camera);
        
        // Renderizar portais
        this.renderPortals(ctx, camera);
    }
    
    renderItems(ctx, camera) {
        this.items.forEach(item => {
            const screenX = item.x * this.tileSize - camera.x;
            const screenY = item.y * this.tileSize - camera.y;
            
            // Desenhar item
            this.assetManager.drawSprite(ctx, 'items', item.type, screenX, screenY, this.tileSize, this.tileSize);
            
            // Brilho para itens
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(screenX + this.tileSize/2, screenY + this.tileSize/2, this.tileSize/2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    renderNPCs(ctx, camera) {
        this.npcs.forEach(npc => {
            const screenX = npc.x - camera.x;
            const screenY = npc.y - camera.y;
            
            // Desenhar NPC
            this.assetManager.drawSprite(ctx, 'npcs', npc.texture, screenX - 16, screenY - 16, 32, 32);
            
            // Desenhar nome
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(npc.name, screenX, screenY - 20);
            
            // Indicador de interação
            const distance = Math.sqrt(
                Math.pow(camera.playerX - npc.x, 2) + 
                Math.pow(camera.playerY - npc.y, 2)
            );
            
            if (distance < 50) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 16px Arial';
                ctx.fillText('!', screenX, screenY - 35);
            }
        });
    }
    
    renderPortals(ctx, camera) {
        this.portals.forEach(portal => {
            const screenX = portal.x - camera.x;
            const screenY = portal.y - camera.y;
            
            // Desenhar portal com animação
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 2) * 0.5 + 0.5;
            
            ctx.fillStyle = `rgba(138, 43, 226, ${pulse})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // Centro do portal
            ctx.fillStyle = '#8A2BE2';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Nome do portal
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(portal.name, screenX, screenY + 35);
        });
    }
    
    isWalkable(x, y) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return false;
        }
        
        const tile = this.tiles[y] && this.tiles[y][x];
        return tile && tile.walkable;
    }
    
    getTile(x, y) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return null;
        }
        
        return this.tiles[y] ? this.tiles[y][x] : null;
    }
    
    getNPCAt(x, y) {
        return this.npcs.find(npc => 
            Math.abs(npc.x - x) < 20 && Math.abs(npc.y - y) < 20
        );
    }
    
    getItemAt(x, y) {
        return this.items.find(item => 
            Math.abs(item.x * this.tileSize - x) < this.tileSize && 
            Math.abs(item.y * this.tileSize - y) < this.tileSize
        );
    }
    
    getPortalAt(x, y) {
        return this.portals.find(portal => 
            Math.abs(portal.x - x) < 30 && Math.abs(portal.y - y) < 30
        );
    }
    
    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
    }
    
    changeArea(areaId) {
        if (this.config.areas[areaId]) {
            this.loadArea(areaId);
            this.initializeNPCs();
            this.initializeItems();
            this.initializePortals();
        }
    }
    
    getCurrentArea() {
        return this.config.areas[this.config.currentArea];
    }
    
    getSpawnPoint() {
        const area = this.config.areas[this.config.currentArea];
        return area.spawnPoint;
    }
}

// Exportar para uso global
window.IntegratedMap = IntegratedMap;
