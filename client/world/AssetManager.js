/**
 * Asset Manager
 * Centralized system for managing all game assets from art/generated
 */

class AssetManager {
    constructor() {
        this.assets = new Map();
        this.loaded = false;
        this.loadingPromises = new Map();
        
        // Asset paths - estrutura padrão client/assets
        this.paths = {
            maps: {
                village_day: '/assets/maps/village_day.png',
                forest_north: '/assets/maps/forest_north.png',
                cave_echo: '/assets/maps/cave_echo.png'
            },
            characters: {
                human_adventurer: '/assets/characters/human_adventurer.png',
                elf_ranger: '/assets/characters/elf_ranger.png',
                dwarf_guardian: '/assets/characters/dwarf_guardian.png'
            },
            npcs: {
                innkeeper: '/assets/npcs/innkeeper.png',
                merchant: '/assets/npcs/merchant.png',
                captain: '/assets/npcs/captain.png',
                explorer_npc: '/assets/npcs/explorer_npc.png',
                hermit_npc: '/assets/npcs/hermit_npc.png',
                miner_npc: '/assets/npcs/miner_npc.png',
                ranger_npc: '/assets/npcs/ranger_npc.png',
                sentinel: '/assets/npcs/sentinel_npc.png'
            },
            monsters: {
                goblin_raider: '/assets/monsters/goblin_raider.png',
                dire_wolf: '/assets/monsters/dire_wolf.png',
                mountain_orc: '/assets/monsters/mountain_orc.png'
            },
            ui: {
                layout_main_01: '/assets/ui/layout_main_01.png',
                _main_01: '/assets/ui/_main_01.png'
            }
        };
        
        // Asset metadata
        this.metadata = {
            maps: {
                village_day: { width: 1920, height: 1080, tileSize: 64 },
                forest_north: { width: 1920, height: 1080, tileSize: 64 },
                mountain_gate: { width: 1920, height: 1080, tileSize: 64 },
                mountain_inside: { width: 1920, height: 1080, tileSize: 64 },
                cave_echo: { width: 1920, height: 1080, tileSize: 64 },
                dungeon_solo_ruins: { width: 1920, height: 1080, tileSize: 64 },
                dungeon_group_crypt: { width: 1920, height: 1080, tileSize: 64 },
                swamp_west: { width: 1920, height: 1080, tileSize: 64 }
            },
            characters: {
                human_adventurer: { width: 256, height: 256, frames: 8, frameSize: 64 },
                elf_ranger: { width: 256, height: 256, frames: 8, frameSize: 64 },
                dwarf_guardian: { width: 256, height: 256, frames: 8, frameSize: 64 }
            },
            npcs: {
                innkeeper: { width: 128, height: 128, frames: 4, frameSize: 64 },
                merchant: { width: 128, height: 128, frames: 4, frameSize: 64 },
                captain: { width: 128, height: 128, frames: 4, frameSize: 64 },
                explorer_npc: { width: 128, height: 128, frames: 4, frameSize: 64 },
                hermit_npc: { width: 128, height: 128, frames: 4, frameSize: 64 },
                miner_npc: { width: 128, height: 128, frames: 4, frameSize: 64 },
                ranger_npc: { width: 128, height: 128, frames: 4, frameSize: 64 },
                sentinel: { width: 128, height: 128, frames: 4, frameSize: 64 }
            },
            monsters: {
                goblin_raider: { width: 256, height: 256, frames: 8, frameSize: 64 },
                dire_wolf: { width: 256, height: 256, frames: 8, frameSize: 64 },
                mountain_orc: { width: 256, height: 256, frames: 8, frameSize: 64 }
            }
        };
    }
    
    /**
     * Initialize and load all assets
     */
    async initialize() {
        console.log('🎨 Carregando assets do jogo...');
        
        const loadPromises = [];
        
        // Load maps
        for (const [mapName, path] of Object.entries(this.paths.maps)) {
            loadPromises.push(this.loadAsset(`map_${mapName}`, path, 'map'));
        }
        
        // Load characters
        for (const [charName, path] of Object.entries(this.paths.characters)) {
            loadPromises.push(this.loadAsset(`character_${charName}`, path, 'character'));
        }
        
        // Load NPCs
        for (const [npcName, path] of Object.entries(this.paths.npcs)) {
            loadPromises.push(this.loadAsset(`npc_${npcName}`, path, 'npc'));
        }
        
        // Load monsters
        for (const [monsterName, path] of Object.entries(this.paths.monsters)) {
            loadPromises.push(this.loadAsset(`monster_${monsterName}`, path, 'monster'));
        }
        
        // Load UI assets
        for (const [uiName, path] of Object.entries(this.paths.ui)) {
            loadPromises.push(this.loadAsset(`ui_${uiName}`, path, 'ui'));
        }
        
        try {
            await Promise.all(loadPromises);
            this.loaded = true;
            console.log('✅ Todos os assets carregados com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao carregar assets:', error);
            return false;
        }
    }
    
    /**
     * Load a single asset
     */
    loadAsset(key, path, type) {
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }
        
        if (this.assets.has(key)) {
            return Promise.resolve(this.assets.get(key));
        }
        
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const metadata = this.getAssetMetadata(key, type);
                const assetData = {
                    image: img,
                    metadata,
                    loaded: true,
                    type,
                    key
                };
                
                // Create sprite sheet data for animated assets
                if (metadata.frames && metadata.frameSize) {
                    assetData.spriteSheet = this.createSpriteSheetData(img, metadata);
                }
                
                this.assets.set(key, assetData);
                this.loadingPromises.delete(key);
                resolve(assetData);
            };
            
            img.onerror = () => {
                console.error(`❌ Falha ao carregar asset: ${key} (${path})`);
                this.loadingPromises.delete(key);
                reject(new Error(`Failed to load asset: ${key}`));
            };
            
            img.src = path;
        });
        
        this.loadingPromises.set(key, promise);
        return promise;
    }
    
    /**
     * Get metadata for an asset
     */
    getAssetMetadata(key, type) {
        const categoryKey = key.split('_')[0];
        const assetKey = key.split('_').slice(1).join('_');
        
        return this.metadata[categoryKey]?.[assetKey] || {
            width: 64,
            height: 64,
            frameSize: 64,
            frames: 1
        };
    }
    
    /**
     * Create sprite sheet data from image and metadata
     */
    createSpriteSheetData(img, metadata) {
        const { frameSize, frames } = metadata;
        if (!frameSize || frames <= 1) return null;
        
        const framesPerRow = Math.floor(img.width / frameSize);
        const spriteSheet = {
            image: img,
            frameWidth: frameSize,
            frameHeight: frameSize,
            framesPerRow,
            totalFrames: frames,
            frameData: []
        };
        
        // Pre-calculate frame positions
        for (let i = 0; i < frames; i++) {
            const row = Math.floor(i / framesPerRow);
            const col = i % framesPerRow;
            
            spriteSheet.frameData.push({
                index: i,
                sx: col * frameSize,
                sy: row * frameSize,
                width: frameSize,
                height: frameSize
            });
        }
        
        return spriteSheet;
    }
    
    /**
     * Get asset data
     */
    getAsset(key) {
        return this.assets.get(key);
    }
    
    /**
     * Get map asset
     */
    getMap(mapName) {
        const key = `map_${mapName}`;
        const asset = this.assets.get(key);
        
        if (!asset) {
            console.warn(`⚠️ Map não encontrado: ${key}, usando fallback`);
            return this.assets.get('map_village_day');
        }
        
        return asset;
    }
    
    /**
     * Get character asset
     */
    getCharacter(characterName) {
        const key = `character_${characterName}`;
        const asset = this.assets.get(key);
        
        if (!asset) {
            console.warn(`⚠️ Personagem não encontrado: ${key}, usando fallback`);
            return this.assets.get('character_human_adventurer');
        }
        
        return asset;
    }
    
    /**
     * Get NPC asset
     */
    getNPC(npcName) {
        const key = `npc_${npcName}`;
        const asset = this.assets.get(key);
        
        if (!asset) {
            console.warn(`⚠️ NPC não encontrado: ${key}, usando fallback`);
            return this.assets.get('npc_innkeeper');
        }
        
        return asset;
    }
    
    /**
     * Get monster asset
     */
    getMonster(monsterName) {
        const key = `monster_${monsterName}`;
        const asset = this.assets.get(key);
        
        if (!asset) {
            console.warn(`⚠️ Monster não encontrado: ${key}, usando fallback`);
            return this.assets.get('monster_goblin_raider');
        }
        
        return asset;
    }
    
    /**
     * Get UI asset
     */
    getUI(uiName) {
        const key = `ui_${uiName}`;
        const asset = this.assets.get(key);
        
        if (!asset) {
            console.warn(`⚠️ UI asset não encontrado: ${key}`);
            return null;
        }
        
        return asset;
    }
    
    /**
     * Get animation frame from sprite sheet
     */
    getAnimationFrame(assetKey, frameIndex = 0) {
        const asset = this.assets.get(assetKey);
        if (!asset || !asset.spriteSheet) return null;
        
        const frameData = asset.spriteSheet.frameData[frameIndex];
        if (!frameData) return asset.spriteSheet.frameData[0];
        
        return frameData;
    }
    
    /**
     * Check if all assets are loaded
     */
    isLoaded() {
        return this.loaded;
    }
    
    /**
     * Get loading progress
     */
    getLoadingProgress() {
        const total = Object.keys(this.paths.maps).length + 
                   Object.keys(this.paths.characters).length + 
                   Object.keys(this.paths.npcs).length + 
                   Object.keys(this.paths.monsters).length + 
                   Object.keys(this.paths.ui).length;
        const loaded = this.assets.size;
        return Math.min(loaded / total, 1);
    }
    
    /**
     * Create asset preview
     */
    createPreview(assetKey, size = 128) {
        const asset = this.assets.get(assetKey);
        if (!asset || !asset.loaded) return null;
        
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Scale and center the asset
        const scale = Math.min(size / asset.metadata.width, size / asset.metadata.height);
        const scaledWidth = asset.metadata.width * scale;
        const scaledHeight = asset.metadata.height * scale;
        const x = (size - scaledWidth) / 2;
        const y = (size - scaledHeight) / 2;
        
        ctx.drawImage(asset.image, x, y, scaledWidth, scaledHeight);
        
        return canvas;
    }
    
    /**
     * Get all assets by category
     */
    getAssetsByCategory(category) {
        const result = {};
        
        this.assets.forEach((asset, key) => {
            if (key.startsWith(`${category}_`)) {
                result[key.replace(`${category}_`, '')] = asset;
            }
        });
        
        return result;
    }
    
    /**
     * Get asset statistics
     */
    getStats() {
        const stats = {
            total: 0,
            loaded: 0,
            categories: {
                maps: 0,
                characters: 0,
                npcs: 0,
                monsters: 0,
                ui: 0
            }
        };
        
        this.assets.forEach((asset, key) => {
            stats.total++;
            stats.loaded++;
            
            const category = key.split('_')[0];
            if (stats.categories[category] !== undefined) {
                stats.categories[category]++;
            }
        });
        
        return stats;
    }
}

// Export for ES6 modules
export { AssetManager };

// Global instance for legacy compatibility
window.assetManager = new AssetManager();

// Export constants
window.TILE_SIZE = 64;
window.GRID_W = 30;
window.GRID_H = 17;
