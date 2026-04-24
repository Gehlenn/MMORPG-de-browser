/**
 * AssetLoader.js
 * Sistema de Lazy Loading de Assets
 * Legacy of Komodo MMORPG v0.5.0
 */

class AssetLoader {
    constructor() {
        this.cache = new Map();
        this.loadingQueue = [];
        this.isLoading = false;
        this.maxConcurrent = 3;
        
        // Zonas e seus assets
        this.zoneAssets = {
            'eldoria': {
                sprites: ['player', 'slime', 'goblin', 'wolf', 'npc_guardian', 'npc_merchant'],
                tilesets: ['grass', 'forest', 'water'],
                audio: ['bgm_eldoria', 'sfx_forest'],
                priority: 'high'
            },
            'draconia': {
                sprites: ['dragon', 'magma_golem', 'salamander', 'fire_elemental'],
                tilesets: ['lava', 'obsidian', 'volcano'],
                audio: ['bgm_draconia', 'sfx_fire'],
                priority: 'medium'
            },
            'aurelia': {
                sprites: ['mummy', 'scorpion', 'sandworm', 'sphinx'],
                tilesets: ['sand', 'pyramid', 'oasis'],
                audio: ['bgm_aurelia', 'sfx_desert'],
                priority: 'medium'
            }
        };
        
        // Assets base sempre carregados
        this.baseAssets = ['ui', 'hud', 'fonts', 'particles'];
        
        console.log('🎯 AssetLoader initialized (Lazy Loading ready)');
    }

    /**
     * Carrega assets da zona atual
     */
    async loadZone(zoneName) {
        if (!this.zoneAssets[zoneName]) {
            console.warn(`Zone ${zoneName} not found in asset registry`);
            return;
        }

        const zone = this.zoneAssets[zoneName];
        console.log(`📦 Loading assets for zone: ${zoneName}`);

        // Carrega assets base primeiro
        await this.loadBaseAssets();

        // Carrega assets da zona
        const promises = [];
        
        if (zone.sprites) {
            promises.push(this.loadSprites(zone.sprites));
        }
        if (zone.tilesets) {
            promises.push(this.loadTilesets(zone.tilesets));
        }
        if (zone.audio) {
            promises.push(this.loadAudio(zone.audio));
        }

        await Promise.all(promises);
        console.log(`✅ Zone ${zoneName} assets loaded`);
    }

    /**
     * Carrega assets base
     */
    async loadBaseAssets() {
        const unloaded = this.baseAssets.filter(asset => !this.cache.has(asset));
        
        if (unloaded.length === 0) return;

        console.log('📦 Loading base assets...');
        await this.loadSprites(unloaded);
    }

    /**
     * Carrega sprites com lazy loading
     */
    async loadSprites(spriteNames) {
        const unloaded = spriteNames.filter(name => !this.cache.has(`sprite_${name}`));
        
        if (unloaded.length === 0) return;

        const promises = unloaded.map(name => this.loadSprite(name));
        await Promise.all(promises);
    }

    /**
     * Carrega um sprite individual
     */
    loadSprite(name) {
        return new Promise((resolve, reject) => {
            if (this.cache.has(`sprite_${name}`)) {
                resolve(this.cache.get(`sprite_${name}`));
                return;
            }

            const img = new Image();
            
            img.onload = () => {
                this.cache.set(`sprite_${name}`, img);
                console.log(`✅ Sprite loaded: ${name}`);
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`❌ Failed to load sprite: ${name}`);
                reject(new Error(`Failed to load sprite: ${name}`));
            };

            // Simulação - em produção, teria URLs reais
            img.src = `assets/sprites/${name}.png`;
        });
    }

    /**
     * Carrega tilesets
     */
    async loadTilesets(tilesetNames) {
        const unloaded = tilesetNames.filter(name => !this.cache.has(`tileset_${name}`));
        
        if (unloaded.length === 0) return;

        const promises = unloaded.map(name => this.loadTileset(name));
        await Promise.all(promises);
    }

    /**
     * Carrega um tileset
     */
    loadTileset(name) {
        return new Promise((resolve, reject) => {
            if (this.cache.has(`tileset_${name}`)) {
                resolve(this.cache.get(`tileset_${name}`));
                return;
            }

            const img = new Image();
            
            img.onload = () => {
                this.cache.set(`tileset_${name}`, img);
                console.log(`✅ Tileset loaded: ${name}`);
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`❌ Failed to load tileset: ${name}`);
                reject(new Error(`Failed to load tileset: ${name}`));
            };

            img.src = `assets/tilesets/${name}.png`;
        });
    }

    /**
     * Carrega áudio
     */
    async loadAudio(audioNames) {
        const unloaded = audioNames.filter(name => !this.cache.has(`audio_${name}`));
        
        if (unloaded.length === 0) return;

        const promises = unloaded.map(name => this.loadAudioFile(name));
        await Promise.all(promises);
    }

    /**
     * Carrega arquivo de áudio
     */
    loadAudioFile(name) {
        return new Promise((resolve, reject) => {
            if (this.cache.has(`audio_${name}`)) {
                resolve(this.cache.get(`audio_${name}`));
                return;
            }

            const audio = new Audio();
            
            audio.oncanplaythrough = () => {
                this.cache.set(`audio_${name}`, audio);
                console.log(`✅ Audio loaded: ${name}`);
                resolve(audio);
            };
            
            audio.onerror = () => {
                console.warn(`❌ Failed to load audio: ${name}`);
                reject(new Error(`Failed to load audio: ${name}`));
            };

            audio.src = `assets/audio/${name}.mp3`;
            audio.preload = 'auto';
        });
    }

    /**
     * Obtém asset do cache
     */
    get(name) {
        return this.cache.get(name);
    }

    /**
     * Verifica se asset está carregado
     */
    has(name) {
        return this.cache.has(name);
    }

    /**
     * Pré-carrega assets baseado na proximidade
     */
    preloadNearby(playerZone, adjacentZones) {
        console.log('🔮 Preloading adjacent zones:', adjacentZones);
        
        adjacentZones.forEach(zone => {
            if (this.zoneAssets[zone]) {
                // Carrega em background com baixa prioridade
                this.loadZoneInBackground(zone);
            }
        });
    }

    /**
     * Carrega zona em background
     */
    async loadZoneInBackground(zoneName) {
        const zone = this.zoneAssets[zoneName];
        if (!zone) return;

        // Carrega apenas sprites essenciais
        if (zone.sprites) {
            const essential = zone.sprites.slice(0, 2); // Apenas 2 principais
            await this.loadSprites(essential);
        }
    }

    /**
     * Limpa cache de zonas não utilizadas
     */
    cleanupUnused(currentZone) {
        const zones = Object.keys(this.zoneAssets);
        const unusedZones = zones.filter(z => z !== currentZone);
        
        console.log('🧹 Cleaning up unused zone assets');
        
        // Não limpa imediatamente, marca para limpeza futura
        setTimeout(() => {
            unusedZones.forEach(zone => this.unloadZone(zone));
        }, 60000); // Limpa após 1 minuto
    }

    /**
     * Descarrega assets de uma zona
     */
    unloadZone(zoneName) {
        const zone = this.zoneAssets[zoneName];
        if (!zone) return;

        console.log(`🗑️ Unloading zone: ${zoneName}`);

        zone.sprites?.forEach(name => {
            this.cache.delete(`sprite_${name}`);
        });
        
        zone.tilesets?.forEach(name => {
            this.cache.delete(`tileset_${name}`);
        });
        
        zone.audio?.forEach(name => {
            this.cache.delete(`audio_${name}`);
        });
    }

    /**
     * Obtém estatísticas do cache
     */
    getStats() {
        return {
            cachedItems: this.cache.size,
            zones: Object.keys(this.zoneAssets).length,
            memoryEstimate: this.estimateMemoryUsage()
        };
    }

    /**
     * Estima uso de memória
     */
    estimateMemoryUsage() {
        let total = 0;
        
        this.cache.forEach((value, key) => {
            if (value instanceof Image) {
                total += (value.width * value.height * 4) || 0;
            }
        });

        return `${(total / 1024 / 1024).toFixed(2)} MB`;
    }
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssetLoader;
} else {
    window.AssetLoader = AssetLoader;
}
