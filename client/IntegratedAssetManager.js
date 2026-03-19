/**
 * Integrated Asset Manager
 * Integra todos os assets existentes: NPCs, Mapas, HUD, UI, Mobs, Dungeons
 */

class IntegratedAssetManager {
    constructor() {
        this.assets = new Map();
        this.sprites = new Map();
        this.loaded = false;
        this.loadCount = 0;
        this.totalAssets = 0;
        
        // Definir caminhos dos assets existentes
        this.assetPaths = {
            // NPCs existentes
            npcs: {
                'captain': 'client/assets/npcs/captain.png',
                'explorer_npc': 'client/assets/npcs/explorer_npc.png',
                'hermit_npc': 'client/assets/npcs/hermit_npc.png',
                'innkeeper': 'client/assets/npcs/innkeeper.png',
                'merchant': 'client/assets/npcs/merchant.png',
                'miner_npc': 'client/assets/npcs/miner_npc.png',
                'ranger_npc': 'client/assets/npcs/ranger_npc.png',
                'sentinel_npc': 'client/assets/npcs/sentinel_npc.png',
            },
            // Monstros existentes
            monsters: {
                'dire_wolf': 'client/assets/monsters/dire_wolf.png',
                'goblin_raider': 'client/assets/monsters/goblin_raider.png',
                'mountain_orc': 'client/assets/monsters/mountain_orc.png'
            },
            // Personagens existentes
            characters: {
                'human_adventurer': 'client/assets/characters/human_adventurer.png',
                'elf_ranger': 'client/assets/characters/elf_ranger.png',
                'dwarf_guardian': 'client/assets/characters/dwarf_guardian.png'
            },
            // Mapas existentes
            maps: {
                'village_day': 'client/assets/maps/village_day.png',
                'forest_north': 'client/assets/maps/forest_north.png',
                'cave_echo': 'client/assets/maps/cave_echo.png'
            },
            // Areas/Dungeons existentes
            dungeons: {
                'solo_ruins': 'client/areas/dungeons/solo_ruins.png',
                'group_crypt': 'client/areas/dungeons/group_crypt.png'
            },
            // Tiles para mapas
            tiles: {
                grass: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                stone: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                water: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                sand: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            }
        };
        
        // Configurações de NPCs baseadas nos sprites existentes
        this.npcConfigs = {
            captain: {
                name: 'Capitão da Guarda',
                type: 'guard',
                x: 400,
                y: 200,
                sprite: 'npcs_captain',
                dialogue: [
                    'Bem-vindo à cidade, aventureiro!',
                    'Mantenha a ordem por aqui.',
                    'Preciso de ajuda com uma missão.'
                ],
                quests: [
                    {
                        id: 'first_quest',
                        name: 'Primeira Missão',
                        description: 'Encontre e derrote 5 goblins.',
                        reward: { gold: 50, exp: 25 },
                        target: 'goblin_raider',
                        count: 5
                    }
                ]
            },
            merchant: {
                name: 'Mercador Viajante',
                type: 'merchant',
                x: 300,
                y: 300,
                sprite: 'npcs_merchant',
                dialogue: [
                    'Olá! Tenho itens raros.',
                    'Dê uma olhada em minha mercadoria.',
                    'Volte sempre!'
                ],
                shop: [
                    { id: 'sword_basic', name: 'Espada Básica', price: 100, damage: 15 },
                    { id: 'shield_basic', name: 'Escudo Básico', price: 75, defense: 10 },
                    { id: 'potion_heal', name: 'Poção de Cura', price: 25, heal: 50 }
                ]
            },
            explorer_npc: {
                name: 'Explorador',
                type: 'quest_giver',
                x: 500,
                y: 250,
                sprite: 'npcs_explorer_npc',
                dialogue: [
                    'Novas terras foram descobertas!',
                    'Perigos espreitam nas dungeons.',
                    'Corajoso aventureiro como você...'
                ],
                quests: [
                    {
                        id: 'dungeon_quest',
                        name: 'Exploração das Ruínas',
                        description: 'Explore as ruínas antigas e encontre tesouros.',
                        reward: { gold: 75, exp: 40 },
                        target: 'ruins',
                        count: 1
                    }
                ]
            },
            hermit_npc: {
                name: 'Ermitão',
                type: 'quest',
                x: 150,
                y: 150,
                sprite: 'npcs_hermit_npc',
                dialogue: [
                    'A solidão é minha companhia.',
                    'Tenho conhecimentos antigos.',
                    'Buscadores de sabedoria são bem-vindos.'
                ],
                quests: [
                    {
                        id: 'hermit_quest',
                        name: 'Conhecimento Perdido',
                        description: 'Encontre o livro antigo na floresta.',
                        reward: { gold: 100, exp: 60 },
                        target: 'book',
                        count: 1
                    }
                ]
            },
            innkeeper: {
                name: 'Estalajadeiro',
                type: 'innkeeper',
                x: 600,
                y: 400,
                sprite: 'npcs_innkeeper',
                dialogue: [
                    'Bem-vindo à minha estalagem!',
                    'Descanse um pouco, viajante.',
                    'Comida e bebida sempre disponíveis.'
                ]
            },
            miner_npc: {
                name: 'Mineiro',
                type: 'quest',
                x: 700,
                y: 200,
                sprite: 'npcs_miner_npc',
                dialogue: [
                    'As minas são perigosas.',
                    'Mas ricas em minérios!',
                    'Preciso de ajuda lá embaixo.'
                ],
                quests: [
                    {
                        id: 'mine_quest',
                        name: 'Operação Mineira',
                        description: 'Colete 10 minérios raros.',
                        reward: { gold: 150, exp: 80 },
                        target: 'ore',
                        count: 10
                    }
                ]
            },
            ranger_npc: {
                name: 'Guarda Florestal',
                type: 'guard',
                x: 250,
                y: 450,
                sprite: 'npcs_ranger_npc',
                dialogue: [
                    'A floresta é minha casa.',
                    'Protejo todos os seres vivos.',
                    'A natureza deve ser respeitada.'
                ],
                quests: [
                    {
                        id: 'ranger_quest',
                        name: 'Patrulha Florestal',
                        description: 'Caçe 5 lobos e traga as peles.',
                        reward: { gold: 75, exp: 40 },
                        target: 'wolf',
                        count: 5
                    }
                ]
            },
            sentinel: {
                name: 'Sentinela',
                type: 'guard',
                x: 550,
                y: 350,
                sprite: 'npcs_sentinel_npc',
                dialogue: [
                    'Nada passa por mim!',
                    'Vigio estas terras há anos.',
                    'Apenas pessoas de bem podem passar.'
                ],
                quests: [
                    {
                        id: 'guard_quest',
                        name: 'Dever de Sentinela',
                        description: 'Proteja a entrada da cidade por 10 minutos.',
                        reward: { gold: 100, exp: 50 }
                    }
                ]
            }
        };
        
        // Configurações de monstros baseadas nos sprites existentes
        this.monsterConfigs = {
            goblin_raider: {
                name: 'Goblin Saqueador',
                type: 'hostile',
                hp: 30,
                maxHp: 30,
                attack: 8,
                defense: 2,
                exp: 15,
                gold: 10,
                sprite: 'monsters_goblin_raider',
                loot: ['potion_heal', 'basic_sword']
            },
            dire_wolf: {
                name: 'Lobo Terrível',
                type: 'hostile',
                hp: 45,
                maxHp: 45,
                attack: 12,
                defense: 4,
                exp: 25,
                gold: 20,
                sprite: 'monsters_dire_wolf',
                loot: ['wolf_pelt', 'basic_armor']
            },
            mountain_orc: {
                name: 'Orc da Montanha',
                type: 'hostile',
                hp: 60,
                maxHp: 60,
                attack: 15,
                defense: 6,
                exp: 35,
                gold: 30,
                sprite: 'monsters_mountain_orc',
                loot: ['orc_axe', 'heavy_armor']
            }
        };
        
        this.loadAssets();
    }
    
    async loadAssets() {
        console.log('📦 Carregando assets integrados...');
        
        // Carregar sprites de NPCs existentes
        for (const [npcType, path] of Object.entries(this.assetPaths.npcs)) {
            await this.loadImage(npcType, path, 'npcs');
        }
        
        // Carregar monstros existentes
        for (const [monsterType, path] of Object.entries(this.assetPaths.monsters)) {
            await this.loadImage(monsterType, path, 'monsters');
        }
        
        // Carregar personagens existentes
        for (const [charType, path] of Object.entries(this.assetPaths.characters)) {
            await this.loadImage(charType, path, 'characters');
        }
        
        // Carregar mapas existentes
        for (const [mapType, path] of Object.entries(this.assetPaths.maps)) {
            await this.loadImage(mapType, path, 'maps');
        }
        
        // Carregar dungeons existentes
        for (const [dungeonType, path] of Object.entries(this.assetPaths.dungeons)) {
            await this.loadImage(dungeonType, path, 'dungeons');
        }
        
        // Criar tiles programaticamente
        this.createTileSprites();
        
        console.log('✅ Assets carregados com sucesso');
        this.loaded = true;
    }
    
    async loadImage(key, path, category) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const assetKey = `${category}_${key}`;
                this.assets.set(assetKey, img);
                this.sprites.set(assetKey, img);
                this.loadCount++;
                console.log(`✅ Asset carregado: ${assetKey}`);
                resolve(img);
            };
            img.onerror = () => {
                // Apenas logar erro sem criar fallback para evitar problemas
                console.warn(`⚠️ Asset não encontrado: ${path} (continuando sem este asset)`);
                resolve();
            };
            img.src = path;
        });
    }
    
    createTileSprites() {
        // Criar sprites de tiles programaticamente
        const tileTypes = ['grass', 'stone', 'water', 'sand'];
        
        tileTypes.forEach(tileType => {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            
            switch(tileType) {
                case 'grass':
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(0, 0, 32, 32);
                    // Adicionar textura
                    ctx.fillStyle = '#32CD32';
                    for(let i = 0; i < 10; i++) {
                        const x = Math.random() * 32;
                        const y = Math.random() * 32;
                        ctx.fillRect(x, y, 1, 1);
                    }
                    break;
                    
                case 'stone':
                    ctx.fillStyle = '#696969';
                    ctx.fillRect(0, 0, 32, 32);
                    // Adicionar textura
                    ctx.fillStyle = '#808080';
                    for(let i = 0; i < 5; i++) {
                        const x = Math.random() * 32;
                        const y = Math.random() * 32;
                        ctx.fillRect(x, y, 2, 2);
                    }
                    break;
                    
                case 'water':
                    ctx.fillStyle = '#4682B4';
                    ctx.fillRect(0, 0, 32, 32);
                    // Adicionar ondas
                    ctx.strokeStyle = '#87CEEB';
                    ctx.lineWidth = 1;
                    for(let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.moveTo(0, 8 + i * 8);
                        ctx.lineTo(32, 8 + i * 8);
                        ctx.stroke();
                    }
                    break;
                    
                case 'sand':
                    ctx.fillStyle = '#F4A460';
                    ctx.fillRect(0, 0, 32, 32);
                    // Adicionar textura
                    ctx.fillStyle = '#DEB887';
                    for(let i = 0; i < 15; i++) {
                        const x = Math.random() * 32;
                        const y = Math.random() * 32;
                        ctx.fillRect(x, y, 1, 1);
                    }
                    break;
            }
            
            const assetKey = `tiles_${tileType}`;
            this.assets.set(assetKey, canvas);
            this.sprites.set(assetKey, canvas);
        });
    }
    
    createFallbackSprite(key, category) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Criar sprite placeholder baseado na categoria
        switch(category) {
            case 'npcs':
                // Figura humana básica
                ctx.fillStyle = '#4169E1';
                ctx.fillRect(12, 8, 8, 16);  // Corpo
                ctx.fillRect(13, 4, 6, 6);    // Cabeça
                ctx.fillRect(11, 22, 2, 6);    // Perna esquerda
                ctx.fillRect(19, 22, 2, 6);    // Perna direita
                break;
        }
        
        const assetKey = `${category}_${key}`;
        this.assets.set(assetKey, canvas);
        this.sprites.set(assetKey, canvas);
    }
    
    getNPCConfig(npcType) {
        return this.npcConfigs[npcType] || null;
    }
    
    getAllNPCConfigs() {
        return Object.values(this.npcConfigs);
    }
    
    getSprite(category, key) {
        const assetKey = `${category}_${key}`;
        return this.sprites.get(assetKey);
    }
    
    drawSprite(ctx, category, key, x, y, width = 32, height = 32) {
        const sprite = this.getSprite(category, key);
        if (sprite) {
            ctx.drawImage(sprite, x, y, width, height);
        } else {
            // Desenhar placeholder
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(x, y, width, height);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.fillText('?', x + width/2 - 5, y + height/2 + 5);
        }
    }
    
    isLoaded() {
        return this.loaded;
    }
    
    getLoadProgress() {
        return {
            loaded: this.loadCount,
            total: this.totalAssets,
            percentage: this.totalAssets > 0 ? (this.loadCount / this.totalAssets) * 100 : 0
        };
    }
}

// Exportar para uso global
window.IntegratedAssetManager = IntegratedAssetManager;
