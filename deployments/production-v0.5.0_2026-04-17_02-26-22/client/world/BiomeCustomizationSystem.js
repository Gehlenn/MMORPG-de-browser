/**
 * Biome Customization System - Legacy of Komodo
 * Sistema de customização visual para 13 biomas diferentes
 */

class BiomeCustomizationSystem {
    constructor() {
        this.biomes = new Map();
        this.tilesets = new Map();
        this.particleSystems = new Map();
        this.weatherEffects = new Map();
        this.lightingPresets = new Map();
        
        this.initializeBiomes();
    }
    
    initializeBiomes() {
        // === BIOMAS COM CUSTOMIZAÇÃO VISUAL ===
        
        // 1. Plains
        this.biomes.set('plains', {
            name: 'Plains',
            theme: 'peaceful_beginnings',
            colors: {
                ground: ['#7cb342', '#8bc34a', '#689f38'],
                water: ['#42a5f5', '#2196f3', '#1976d2'],
                objects: ['#8d6e63', '#795548', '#6d4c41'],
                sky: ['#87ceeb', '#87cefa', '#b0e0e6']
            },
            tiles: {
                ground: ['grass_light', 'grass_medium', 'grass_dark', 'dirt_path', 'flowers'],
                water: ['water_shallow', 'water_medium', 'water_deep', 'water_rapids'],
                objects: ['tree_oak', 'tree_pine', 'bush_small', 'bush_large', 'rock_small', 'rock_large'],
                decorations: ['flower_red', 'flower_blue', 'flower_yellow', 'grass_tall', 'mushroom_brown']
            },
            particles: ['dust', 'pollen', 'butterflies', 'leaves_light'],
            weather: ['sunny', 'cloudy', 'light_rain', 'breeze'],
            lighting: 'natural',
            ambient: ['birds_chirping', 'wind_gentle', 'grass_rustling']
        });
        
        // 2. Meadow
        this.biomes.set('meadow', {
            name: 'Meadow',
            theme: 'flower_fields',
            colors: {
                ground: ['#8bc34a', '#9ccc65', '#7cb342'],
                water: ['#4fc3f7', '#29b6f6', '#03a9f4'],
                objects: ['#ffb74d', '#ffa726', '#ff9800'],
                sky: ['#fff9c4', '#ffecb3', '#ffe0b2']
            },
            tiles: {
                ground: ['grass_floral', 'meadow_grass', 'flower_patch', 'clover_patch', 'dirt_path'],
                water: ['stream_small', 'pond_shallow', 'water_clear'],
                objects: ['tree_flowering', 'bush_flowering', 'rock_flower', 'fence_wood'],
                decorations: ['flower_daisy', 'flower_tulip', 'flower_sunflower', 'butterfly_garden', 'bee_swarm']
            },
            particles: ['pollen_golden', 'petals_pink', 'petals_white', 'butterflies_colorful', 'sparkles_golden'],
            weather: ['sunny', 'golden_hour', 'breeze', 'flower_petals'],
            lighting: 'golden_hour',
            ambient: ['bees_buzzing', 'birds_melody', 'wind_chimes']
        });
        
        // 3. Forest
        this.biomes.set('forest', {
            name: 'Forest',
            theme: 'ancient_woods',
            colors: {
                ground: ['#2e7d32', '#388e3c', '#1b5e20'],
                water: ['#1976d2', '#1565c0', '#0d47a1'],
                objects: ['#5d4037', '#4e342e', '#3e2723'],
                sky: ['#37474f', '#455a64', '#546e7a']
            },
            tiles: {
                ground: ['forest_floor', 'moss_covered', 'leaf_litter', 'root_exposed', 'mud_patch'],
                water: ['creek_small', 'pool_forest', 'water_murky'],
                objects: ['tree_ancient', 'tree_dead', 'moss_rock', 'hollow_log', 'vines_thick'],
                decorations: ['mushroom_red', 'mushroom_blue', 'fern_large', 'spider_web', 'fireflies']
            },
            particles: ['leaves_brown', 'spores_green', 'fireflies_glow', 'mist_light', 'pollen_brown'],
            weather: ['foggy', 'rainy', 'mystical', 'wind_gentle'],
            lighting: 'canopy_shaded',
            ambient: ['owl_hoot', 'wolves_howl', 'crickets_chirping', 'wind_rustling']
        });
        
        // 4. River
        this.biomes.set('river', {
            name: 'River',
            theme: 'magical_waters',
            colors: {
                ground: ['#4db6ac', '#26a69a', '#00897b'],
                water: ['#00acc1', '#0097a7', '#00838f'],
                objects: ['#795548', '#6d4c41', '#5d4037'],
                sky: ['#b2dfdb', '#80cbc4', '#4db6ac']
            },
            tiles: {
                ground: ['riverbank', 'sand_wet', 'pebble_beach', 'mud_river', 'grass_wet'],
                water: ['water_crystal', 'water_rapids', 'water_deep', 'water_shallow', 'waterfall'],
                objects: ['rock_river', 'driftwood', 'reed_thick', 'crystal_formation', 'water_lily'],
                decorations: ['crystal_shard', 'water_bubbles', 'fish_school', 'dragonfly', 'water_spirit']
            },
            particles: ['water_spray', 'crystals_glow', 'bubbles_rising', 'mist_water', 'sparkles_blue'],
            weather: ['misty', 'rainy', 'crystal_shine', 'breeze_cool'],
            lighting: 'reflective',
            ambient: ['water_flow', 'frogs_croaking', 'birds_water', 'crystal_chime']
        });
        
        // 5. Mountain
        this.biomes.set('mountain', {
            name: 'Mountain',
            theme: 'dwarven_peaks',
            colors: {
                ground: ['#757575', '#616161', '#424242'],
                water: ['#607d8b', '#546e7a', '#455a64'],
                objects: ['#5d4037', '#4e342e', '#3e2723'],
                sky: ['#cfd8dc', '#b0bec5', '#90a4ae']
            },
            tiles: {
                ground: ['rock_mountain', 'stone_path', 'gravel_mountain', 'snow_patch', 'moss_rock'],
                water: ['glacier_water', 'mountain_spring', 'water_cold'],
                objects: ['mountain_peak', 'rock_large', 'cave_entrance', 'dwarf_statue', 'mine_cart'],
                decorations: ['mineral_vein', 'crystal_rock', 'snow_pile', 'flag_dwarven', 'torch_lit']
            },
            particles: ['snow_light', 'rock_dust', 'wind_strong', 'sparks_metal', 'mist_mountain'],
            weather: ['snowy', 'windy', 'stormy', 'cloudy_high'],
            lighting: 'high_altitude',
            ambient: ['wind_howling', 'eagle_call', 'rock_slide', 'dwarf_hammer']
        });
        
        // 6. Desert
        this.biomes.set('desert', {
            name: 'Desert',
            theme: 'golden_sands',
            colors: {
                ground: ['#fdd835', '#fbc02d', '#f57f17'],
                water: ['#ffb74d', '#ffa726', '#ff9800'],
                objects: ['#8d6e63', '#795548', '#6d4c41'],
                sky: ['#fff3e0', '#ffe0b2', '#ffcc80']
            },
            tiles: {
                ground: ['sand_gold', 'sand_light', 'dune_large', 'rock_desert', 'oasis_ground'],
                water: ['oasis_water', 'mirage_water', 'water_salt'],
                objects: ['cactus_large', 'palm_tree', 'ruin_sand', 'skeleton_desert', 'caravan_wreck'],
                decorations: ['sand_swirl', 'heat_haze', 'mirage_shimmer', 'scorpion_buried', 'desert_flower']
            },
            particles: ['sand_storm', 'heat_waves', 'dust_devil', 'sun_glare', 'mirage_effect'],
            weather: ['sunny', 'sandstorm', 'hot', 'dry'],
            lighting: 'harsh_sunlight',
            ambient: ['wind_sand', 'camel_call', 'scorpion_rustle', 'silence_hot']
        });
        
        // 7. Swamp
        this.biomes.set('swamp', {
            name: 'Swamp',
            theme: 'dark_waters',
            colors: {
                ground: ['#4e342e', '#3e2723', '#2e1a17'],
                water: ['#37474f', '#263238', '#1c1c1c'],
                objects: ['#3e2723', '#2e1a17', '#1a0e0a'],
                sky: ['#37474f', '#263238', '#1c1c1c']
            },
            tiles: {
                ground: ['mud_thick', 'swamp_water', 'grass_dead', 'root_swamp', 'slime_patch'],
                water: ['water_murky', 'water_poison', 'bog_bubble', 'swamp_deep'],
                objects: ['tree_dead', 'hut_swamp', 'vine_thick', 'skull_animal', 'cauldron_bubble'],
                decorations: ['mushroom_poison', 'firefly_swarm', 'spider_web_large', 'fog_permanent', 'vines_hanging']
            },
            particles: ['mist_poison', 'spores_green', 'fireflies_swarm', 'bubbles_bog', 'fog_dense'],
            weather: ['foggy', 'humid', 'poisonous', 'rain_acid'],
            lighting: 'dim_swamp',
            ambient: ['frog_croak', 'insect_buzz', 'water_drip', 'owl_distant']
        });
        
        // 8. Coastal
        this.biomes.set('coastal', {
            name: 'Coastal',
            theme: 'tropical_shores',
            colors: {
                ground: ['#fff59d', '#fff176', '#ffee58'],
                water: ['#039be5', '#0288d1', '#0277bd'],
                objects: ['#8d6e63', '#795548', '#6d4c41'],
                sky: ['#e1f5fe', '#b3e5fc', '#81d4fa']
            },
            tiles: {
                ground: ['sand_beach', 'sand_wet', 'coral_rock', 'seaweed_patch', 'shell_scattered'],
                water: ['water_tropical', 'water_reef', 'wave_splash', 'tide_pool', 'water_shallow'],
                objects: ['palm_tree', 'rock_coastal', 'coral_formation', 'driftwood_large', 'lighthouse'],
                decorations: ['shell_colorful', 'starfish', 'crab_small', 'seagull_perch', 'coconut']
            },
            particles: ['sea_spray', 'bubbles_ocean', 'sand_blowing', 'seaglass_glimmer', 'sunlight_water'],
            weather: ['sunny', 'breeze', 'tropical', 'high_tide'],
            lighting: 'coastal_glare',
            ambient: ['waves_crashing', 'seagulls_calling', 'wind_ocean', 'dolphins_chatter']
        });
        
        // 9. Corrupted
        this.biomes.set('corrupted', {
            name: 'Corrupted',
            theme: 'demon_infested',
            colors: {
                ground: ['#263238', '#212121', '#1a1a1a'],
                water: ['#37474f', '#263238', '#1c1c1c'],
                objects: ['#212121', '#1a1a1a', '#0d0d0d'],
                sky: ['#1a1a1a', '#0d0d0d', '#000000']
            },
            tiles: {
                ground: ['earth_corrupted', 'blood_soaked', 'ash_covered', 'void_crack', 'flesh_ground'],
                water: ['blood_river', 'void_water', 'poison_lake', 'tear_abyss'],
                objects: ['tree_dead_corrupted', 'ruin_demonic', 'crystal_dark', 'altar_blood', 'cage_soul'],
                decorations: ['blood_pool', 'soul_fragment', 'dark_energy', 'chains_rusting', 'bones_scattered']
            },
            particles: ['dark_energy', 'blood_drops', 'shadows_dancing', 'void_sparkles', 'soul_wisps'],
            weather: ['dark', 'blood_moon', 'corrupted', 'ash_fall'],
            lighting: 'eerie_glow',
            ambient: ['whispers_distant', 'screams_faint', 'chains_rattling', 'heart_beat_slow']
        });
        
        // 10. Snow
        this.biomes.set('snow', {
            name: 'Snow',
            theme: 'frozen_wastes',
            colors: {
                ground: ['#eceff1', '#cfd8dc', '#b0bec5'],
                water: ['#b3e5fc', '#81d4fa', '#4fc3f7'],
                objects: ['#78909c', '#607d8b', '#546e7a'],
                sky: ['#e3f2fd', '#bbdefb', '#90caf9']
            },
            tiles: {
                ground: ['snow_deep', 'snow_packed', 'ice_formation', 'snow_drift', 'frost_rock'],
                water: ['ice_thick', 'water_frozen', 'glacier_ice', 'snow_melt'],
                objects: ['tree_snow', 'ice_sculpture', 'igloo', 'frozen_statue', 'ice_cave'],
                decorations: ['icicle_large', 'snowflake_pattern', 'frost_crystal', 'aurora_lights', 'snow_banks']
            },
            particles: ['snowflakes_heavy', 'ice_crystals', 'frost_mist', 'aurora_particles', 'wind_snow'],
            weather: ['blizzard', 'snow', 'freezing', 'aurora'],
            lighting: 'cold_blue',
            ambient: ['wind_howling', 'ice_cracking', 'wolf_howl', 'silence_deep']
        });
        
        // 11. Jungle
        this.biomes.set('jungle', {
            name: 'Jungle',
            theme: 'tropical_wilderness',
            colors: {
                ground: ['#1b5e20', '#2e7d32', '#388e3c'],
                water: ['#00695c', '#00796b', '#004d40'],
                objects: ['#4e342e', '#3e2723', '#2e1a17'],
                sky: ['#004d40', '#00695c', '#00796b']
            },
            tiles: {
                ground: ['jungle_floor', 'vines_thick', 'leaf_litter', 'mud_jungle', 'root_tangled'],
                water: ['water_lush', 'river_jungle', 'waterfall_large', 'pool_tropical'],
                objects: ['tree_giant', 'vine_hanging', 'ruin_temple', 'statue_stone', 'bridge_vine'],
                decorations: ['flower_exotic', 'fruit_tropical', 'insect_swarm', 'monkey_chatter', 'parrot_colorful']
            },
            particles: ['leaves_tropical', 'insects_swarm', 'pollen_colorful', 'rain_drops', 'mist_humid'],
            weather: ['humid', 'rainy', 'tropical_storm', 'sun_dappled'],
            lighting: 'canopy_filtered',
            ambient: ['monkey_calls', 'bird_tropical', 'insect_buzz', 'water_rushing']
        });
        
        // 12. Volcano
        this.biomes.set('volcano', {
            name: 'Volcano',
            theme: 'fiery_forges',
            colors: {
                ground: ['#d32f2f', '#c62828', '#b71c1c'],
                water: ['#ff6f00', '#f57c00', '#ef6c00'],
                objects: ['#424242', '#303030', '#212121'],
                sky: ['#ff6f00', '#f57c00', '#ef6c00']
            },
            tiles: {
                ground: ['lava_cooled', 'ash_covered', 'rock_volcanic', 'obsidian_shard', 'magma_crust'],
                water: ['lava_molten', 'magma_pool', 'fire_lake', 'lava_bubble'],
                objects: ['volcano_peak', 'lava_fall', 'obsidian_formation', 'forge_demonic', 'crystal_fire'],
                decorations: ['lava_splash', 'ash_cloud', 'fire_spark', 'magma_bubble', 'ember_glow']
            },
            particles: ['ash_falling', 'lava_splatter', 'fire_sparks', 'smoke_thick', 'heat_shimmer'],
            weather: ['ashen', 'lava_glow', 'volcanic', 'smoke_thick'],
            lighting: 'volcanic_glow',
            ambient: ['lava_bubbling', 'rock_cracking', 'fire_roaring', 'explosion_distant']
        });
        
        // 13. Arcane
        this.biomes.set('arcane', {
            name: 'Arcane',
            theme: 'mystical_remnants',
            colors: {
                ground: ['#4a148c', '#6a1b9a', '#7b1fa2'],
                water: ['#7b1fa2', '#8e24aa', '#9c27b0'],
                objects: ['#6a1b9a', '#4a148c', '#311b92'],
                sky: ['#e1bee7', '#ce93d8', '#ba68c8']
            },
            tiles: {
                ground: ['crystal_ground', 'rune_etched', 'magic_pulsing', 'void_crack', 'energy_flow'],
                water: ['liquid_magic', 'potion_bubble', 'ethereal_water', 'mana_pool'],
                objects: ['crystal_formation', 'rune_stone', 'portal_inactive', 'statue_mage', 'tower_mystical'],
                decorations: ['magic_orb', 'rune_glowing', 'energy_sparkle', 'phantom_wisp', 'crystal_shard']
            },
            particles: ['magic_sparkles', 'rune_glow', 'energy_particles', 'crystal_shine', 'void_energy'],
            weather: ['mystical', 'arcane', 'ancient', 'magical'],
            lighting: 'magical_glow',
            ambient: ['magic_hum', 'crystal_chime', 'rune_whisper', 'energy_flow']
        });
        
        // 14. Mountain Peaks
        this.biomes.set('mountain_peaks', {
            name: 'Mountain Peaks',
            theme: 'celestial_heights',
            colors: {
                ground: ['#b3e5fc', '#81d4fa', '#4fc3f7'],
                water: ['#e1f5fe', '#b3e5fc', '#81d4fa'],
                objects: ['#81d4fa', '#4fc3f7', '#29b6f6'],
                sky: ['#e3f2fd', '#bbdefb', '#90caf9']
            },
            tiles: {
                ground: ['cloud_solid', 'ice_crystal', 'star_dust', 'wind_current', 'heavenly_path'],
                water: ['cloud_water', 'rainbow_stream', 'celestial_pool', 'light_liquid'],
                objects: ['cloud_castle', 'star_tower', 'wind_mill', 'crystal_sky', 'rainbow_bridge'],
                decorations: ['star_sparkle', 'cloud_fluffy', 'rainbow_fragment', 'angel_feather', 'halo_glow']
            },
            particles: ['cloud_puffs', 'star_dust', 'wind_currents', 'light_particles', 'rainbow_sparkles'],
            weather: ['cloudy', 'windy', 'celestial', 'rainbow'],
            lighting: 'heavenly_glow',
            ambient: ['angel_choir', 'wind_harmony', 'star_chime', 'cloud_murmur']
        });
        
        // 15. Abyss
        this.biomes.set('abyss', {
            name: 'Abyss',
            theme: 'endgame_chaos',
            colors: {
                ground: ['#1a1a1a', '#0d0d0d', '#000000'],
                water: ['#4a148c', '#880e4f', '#4a0e4e'],
                objects: ['#000000', '#1a1a1a', '#0d0d0d'],
                sky: ['#000000', '#1a1a1a', '#0d0d0d']
            },
            tiles: {
                ground: ['void_abyss', 'chaos_energy', 'darkness_absolute', 'soul_ground', 'despair_stone'],
                water: ['void_liquid', 'chaos_brew', 'soul_essence', 'darkness_flowing'],
                objects: ['throne_chaos', 'portal_demon', 'statue_fallen', 'chains_damned', 'altar_sacrifice'],
                decorations: ['soul_fragment', 'chaos_rune', 'void_crystal', 'darkness_swirl', 'despair_mist']
            },
            particles: ['void_energy', 'chaos_sparks', 'soul_wisps', 'darkness_particles', 'despair_mist'],
            weather: ['chaotic', 'dimensional', 'apocalyptic', 'void_storm'],
            lighting: 'abyssal_glow',
            ambient: ['void_silence', 'chaos_whispers', 'soul_screams', 'despair_echo']
        });
    }
    
    /**
     * Obtém configuração de bioma
     */
    getBiomeConfig(biomeId) {
        return this.biomes.get(biomeId);
    }
    
    /**
     * Obtém tiles para um bioma
     */
    getBiomeTiles(biomeId) {
        const biome = this.biomes.get(biomeId);
        return biome ? biome.tiles : null;
    }
    
    /**
     * Obtém cores para um bioma
     */
    getBiomeColors(biomeId) {
        const biome = this.biomes.get(biomeId);
        return biome ? biome.colors : null;
    }
    
    /**
     * Obtém partículas para um bioma
     */
    getBiomeParticles(biomeId) {
        const biome = this.biomes.get(biomeId);
        return biome ? biome.particles : null;
    }
    
    /**
     * Obtém clima para um bioma
     */
    getBiomeWeather(biomeId) {
        const biome = this.biomes.get(biomeId);
        return biome ? biome.weather : null;
    }
    
    /**
     * Obtém iluminação para um bioma
     */
    getBiomeLighting(biomeId) {
        const biome = this.biomes.get(biomeId);
        return biome ? biome.lighting : null;
    }
    
    /**
     * Obtém sons ambiente para um bioma
     */
    getBiomeAmbient(biomeId) {
        const biome = this.biomes.get(biomeId);
        return biome ? biome.ambient : null;
    }
    
    /**
     * Lista todos os biomas disponíveis
     */
    getAllBiomes() {
        return Array.from(this.biomes.keys());
    }
    
    /**
     * Aplica customização de bioma a um mapa
     */
    applyBiomeToMap(mapId, biomeId) {
        const biome = this.biomes.get(biomeId);
        if (!biome) return false;
        
        // Aplica cores
        this.applyColors(mapId, biome.colors);
        
        // Aplica tiles
        this.applyTiles(mapId, biome.tiles);
        
        // Aplica partículas
        this.applyParticles(mapId, biome.particles);
        
        // Aplica clima
        this.applyWeather(mapId, biome.weather);
        
        // Aplica iluminação
        this.applyLighting(mapId, biome.lighting);
        
        // Aplica sons ambiente
        this.applyAmbient(mapId, biome.ambient);
        
        return true;
    }
    
    /**
     * Aplica cores ao mapa
     */
    applyColors(mapId, colors) {
        // Implementar lógica de aplicação de cores
        console.log(`Aplicando cores para mapa ${mapId}:`, colors);
    }
    
    /**
     * Aplica tiles ao mapa
     */
    applyTiles(mapId, tiles) {
        // Implementar lógica de aplicação de tiles
        console.log(`Aplicando tiles para mapa ${mapId}:`, tiles);
    }
    
    /**
     * Aplica partículas ao mapa
     */
    applyParticles(mapId, particles) {
        // Implementar lógica de aplicação de partículas
        console.log(`Aplicando partículas para mapa ${mapId}:`, particles);
    }
    
    /**
     * Aplica clima ao mapa
     */
    applyWeather(mapId, weather) {
        // Implementar lógica de aplicação de clima
        console.log(`Aplicando clima para mapa ${mapId}:`, weather);
    }
    
    /**
     * Aplica iluminação ao mapa
     */
    applyLighting(mapId, lighting) {
        // Implementar lógica de aplicação de iluminação
        console.log(`Aplicando iluminação para mapa ${mapId}:`, lighting);
    }
    
    /**
     * Aplica sons ambiente ao mapa
     */
    applyAmbient(mapId, ambient) {
        // Implementar lógica de aplicação de sons ambiente
        console.log(`Aplicando sons ambiente para mapa ${mapId}:`, ambient);
    }
    
    /**
     * Gera configuração de renderização para bioma
     */
    generateRenderConfig(biomeId) {
        const biome = this.biomes.get(biomeId);
        if (!biome) return null;
        
        return {
            colors: biome.colors,
            tiles: biome.tiles,
            particles: biome.particles,
            weather: biome.weather,
            lighting: biome.lighting,
            ambient: biome.ambient,
            theme: biome.theme
        };
    }
    
    /**
     * Obtém estatísticas do sistema
     */
    getSystemStats() {
        return {
            totalBiomes: this.biomes.size,
            totalTiles: this.getTotalTiles(),
            totalParticles: this.getTotalParticles(),
            totalWeatherEffects: this.getTotalWeatherEffects(),
            totalLightingPresets: this.getTotalLightingPresets()
        };
    }
    
    getTotalTiles() {
        let total = 0;
        this.biomes.forEach(biome => {
            Object.values(biome.tiles).forEach(tileArray => {
                total += tileArray.length;
            });
        });
        return total;
    }
    
    getTotalParticles() {
        let total = 0;
        this.biomes.forEach(biome => {
            total += biome.particles.length;
        });
        return total;
    }
    
    getTotalWeatherEffects() {
        let total = 0;
        this.biomes.forEach(biome => {
            total += biome.weather.length;
        });
        return total;
    }
    
    getTotalLightingPresets() {
        const presets = new Set();
        this.biomes.forEach(biome => {
            presets.add(biome.lighting);
        });
        return presets.size;
    }
}

module.exports = BiomeCustomizationSystem;
