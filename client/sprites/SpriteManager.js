/**
 * Sprite Manager
 * Centralized system for managing all game sprites
 */

class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.loaded = false;
        this.loadingPromises = new Map();
        
        // Sprite paths configuration
        this.paths = {
            players: {
                human: './sprites/human.webp',
                elf: './sprites/elf.webp',
                dwarf: './sprites/dwarf.webp',
                orc: './sprites/orc.webp'
            },
            npcs: {
                captain: './sprites/npcs/captain.webp',
                innkeeper: './sprites/npcs/innkeeper.webp',
                merchant: './sprites/npcs/merchant.webp',
                explorer: './sprites/npcs/explorer_npc.webp',
                hermit: './sprites/npcs/hermit_npc.webp',
                miner: './sprites/npcs/miner_npc.webp',
                ranger: './sprites/npcs/ranger_npc.webp',
                sentinel: './sprites/npcs/sentinel_npc.webp'
            },
            monsters: {
                goblin: './sprites/goblin.webp',
                wolf: './sprites/wolf.webp'
            },
            ui: {
                buttons: './ui/buttons.webp',
                icons: './ui/icons.webp',
                panels: './ui/panels.webp'
            }
        };
        
        // Animation frames configuration
        this.animations = {
            player: {
                idle: { frames: 4, speed: 200 },
                walk: { frames: 8, speed: 100 },
                attack: { frames: 6, speed: 80 },
                hurt: { frames: 2, speed: 150 },
                die: { frames: 6, speed: 100 }
            },
            npc: {
                idle: { frames: 4, speed: 300 },
                walk: { frames: 8, speed: 150 },
                talk: { frames: 2, speed: 400 }
            },
            monster: {
                idle: { frames: 4, speed: 250 },
                walk: { frames: 8, speed: 120 },
                attack: { frames: 6, speed: 90 },
                die: { frames: 8, speed: 80 }
            }
        };
    }
    
    /**
     * Initialize and load all sprites
     */
    async initialize() {
        console.log('🎮 Carregando sprites do jogo...');
        
        const loadPromises = [];
        
        // Load player sprites
        for (const [race, path] of Object.entries(this.paths.players)) {
            loadPromises.push(this.loadSprite(`player_${race}`, path));
        }
        
        // Load NPC sprites
        for (const [type, path] of Object.entries(this.paths.npcs)) {
            loadPromises.push(this.loadSprite(`npc_${type}`, path));
        }
        
        // Load monster sprites
        for (const [type, path] of Object.entries(this.paths.monsters)) {
            loadPromises.push(this.loadSprite(`monster_${type}`, path));
        }
        
        try {
            await Promise.all(loadPromises);
            this.loaded = true;
            console.log('✅ Todos os sprites carregados com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao carregar sprites:', error);
            return false;
        }
    }
    
    /**
     * Load a single sprite
     */
    loadSprite(key, path) {
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }
        
        if (this.sprites.has(key)) {
            return Promise.resolve(this.sprites.get(key));
        }
        
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Create sprite sheet data
                const spriteData = {
                    image: img,
                    width: img.width,
                    height: img.height,
                    frameWidth: 64, // Standard frame width
                    frameHeight: 64, // Standard frame height
                    loaded: true
                };
                
                this.sprites.set(key, spriteData);
                this.loadingPromises.delete(key);
                resolve(spriteData);
            };
            
            img.onerror = () => {
                console.error(`❌ Falha ao carregar sprite: ${key} (${path})`);
                this.loadingPromises.delete(key);
                reject(new Error(`Failed to load sprite: ${key}`));
            };
            
            img.src = path;
        });
        
        this.loadingPromises.set(key, promise);
        return promise;
    }
    
    /**
     * Get sprite data
     */
    getSprite(key) {
        return this.sprites.get(key);
    }
    
    /**
     * Get player sprite by race
     */
    getPlayerSprite(race) {
        const key = `player_${race}`;
        const sprite = this.sprites.get(key);
        
        if (!sprite) {
            console.warn(`⚠️ Sprite não encontrado: ${key}, usando fallback human`);
            return this.sprites.get('player_human');
        }
        
        return sprite;
    }
    
    /**
     * Get NPC sprite by type
     */
    getNPCSprite(type) {
        const key = `npc_${type}`;
        const sprite = this.sprites.get(key);
        
        if (!sprite) {
            console.warn(`⚠️ NPC sprite não encontrado: ${key}, usando fallback captain`);
            return this.sprites.get('npc_captain');
        }
        
        return sprite;
    }
    
    /**
     * Get monster sprite by type
     */
    getMonsterSprite(type) {
        const key = `monster_${type}`;
        const sprite = this.sprites.get(key);
        
        if (!sprite) {
            console.warn(`⚠️ Monster sprite não encontrado: ${key}, usando fallback goblin`);
            return this.sprites.get('monster_goblin');
        }
        
        return sprite;
    }
    
    /**
     * Get animation frame from sprite sheet
     */
    getAnimationFrame(spriteKey, animationType, frameIndex = 0) {
        const sprite = this.sprites.get(spriteKey);
        if (!sprite || !sprite.loaded) return null;
        
        const animation = this.animations[this.getSpriteCategory(spriteKey)]?.[animationType];
        if (!animation) return sprite;
        
        const { frameWidth, frameHeight } = sprite;
        const framesPerRow = Math.floor(sprite.width / frameWidth);
        
        const totalFrameIndex = (frameIndex % animation.frames);
        const row = Math.floor(totalFrameIndex / framesPerRow);
        const col = totalFrameIndex % framesPerRow;
        
        return {
            image: sprite.image,
            sx: col * frameWidth,
            sy: row * frameHeight,
            width: frameWidth,
            height: frameHeight,
            duration: animation.speed
        };
    }
    
    /**
     * Get sprite category (player, npc, monster)
     */
    getSpriteCategory(spriteKey) {
        if (spriteKey.startsWith('player_')) return 'player';
        if (spriteKey.startsWith('npc_')) return 'npc';
        if (spriteKey.startsWith('monster_')) return 'monster';
        return 'player';
    }
    
    /**
     * Check if all sprites are loaded
     */
    isLoaded() {
        return this.loaded;
    }
    
    /**
     * Get loading progress
     */
    getLoadingProgress() {
        const total = Object.keys(this.paths.players).length + 
                   Object.keys(this.paths.npcs).length + 
                   Object.keys(this.paths.monsters).length;
        const loaded = this.sprites.size;
        return Math.min(loaded / total, 1);
    }
    
    /**
     * Draw sprite with animation support
     */
    drawAnimatedSprite(ctx, spriteKey, animationType, x, y, frameIndex = 0, scale = 1) {
        const frame = this.getAnimationFrame(spriteKey, animationType, frameIndex);
        if (!frame) return;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.drawImage(
            frame.image,
            frame.sx, frame.sy,
            frame.width, frame.height,
            -frame.width / 2, -frame.height / 2,
            frame.width, frame.height
        );
        ctx.restore();
    }
    
    /**
     * Draw static sprite
     */
    drawStaticSprite(ctx, spriteKey, x, y, scale = 1) {
        const sprite = this.getSprite(spriteKey);
        if (!sprite || !sprite.loaded) return;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.drawImage(
            sprite.image,
            -sprite.frameWidth / 2,
            -sprite.frameHeight / 2,
            sprite.frameWidth,
            sprite.frameHeight
        );
        ctx.restore();
    }
}

// Global instance
window.spriteManager = new SpriteManager();
