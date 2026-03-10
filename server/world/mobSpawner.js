/**
 * Mob Spawner System
 * Spawns and manages mobs in the game world using world map regions
 */

const zones = require("./spawnZones");
const worldMap = require("./worldMap");

class MobSpawner {
    constructor() {
        this.mobs = new Map();
        this.nextMobId = 1000; // Start from 1000 to avoid conflicts
        this.zoneMobs = new Map(); // Track mobs per zone
        this.regionMobs = new Map(); // Track mobs per region
        
        // Enhanced mob templates with more variety
        this.mobTemplates = {
            // Starter Plains mobs
            rat: {
                type: 'rat',
                name: 'Giant Rat',
                health: 15,
                maxHealth: 15,
                damage: 2,
                speed: 40,
                color: '#8b4513',
                size: 16,
                xpValue: 5,
                loot: ['rat_tail', 'cheap_fur']
            },
            slime: {
                type: 'slime',
                name: 'Green Slime',
                health: 20,
                maxHealth: 20,
                damage: 3,
                speed: 30,
                color: '#22c55e',
                size: 20,
                xpValue: 8,
                loot: ['slime_goo', 'gelatin']
            },
            young_wolf: {
                type: 'young_wolf',
                name: 'Young Wolf',
                health: 25,
                maxHealth: 25,
                damage: 4,
                speed: 60,
                color: '#92400e',
                size: 24,
                xpValue: 12,
                loot: ['wolf_pelt', 'sharp_tooth']
            },
            bandit: {
                type: 'bandit',
                name: 'Forest Bandit',
                health: 30,
                maxHealth: 30,
                damage: 5,
                speed: 50,
                color: '#dc2626',
                size: 28,
                xpValue: 15,
                loot: ['bandit_hood', 'stolen_gold']
            },
            
            // Forest mobs
            wolf: {
                type: 'wolf',
                name: 'Timber Wolf',
                health: 40,
                maxHealth: 40,
                damage: 8,
                speed: 70,
                color: '#6b7280',
                size: 32,
                xpValue: 20,
                loot: ['wolf_pelt', 'wolf_heart']
            },
            boar: {
                type: 'boar',
                name: 'Wild Boar',
                health: 35,
                maxHealth: 35,
                damage: 7,
                speed: 55,
                color: '#a16207',
                size: 30,
                xpValue: 18,
                loot: ['boar_tusk', 'tough_hide']
            },
            goblin: {
                type: 'goblin',
                name: 'Forest Goblin',
                health: 30,
                maxHealth: 30,
                damage: 6,
                speed: 45,
                color: '#16a34a',
                size: 24,
                xpValue: 16,
                loot: ['goblin_ear', 'crude_dagger']
            },
            forest_troll: {
                type: 'forest_troll',
                name: 'Forest Troll',
                health: 60,
                maxHealth: 60,
                damage: 10,
                speed: 35,
                color: '#059669',
                size: 40,
                xpValue: 35,
                loot: ['troll_blood', 'heavy_club']
            },
            
            // Mountain mobs
            harpy: {
                type: 'harpy',
                name: 'Mountain Harpy',
                health: 45,
                maxHealth: 45,
                damage: 9,
                speed: 80,
                color: '#7c3aed',
                size: 28,
                xpValue: 25,
                loot: ['harpy_feather', 'enchanted_bone']
            },
            stone_golem: {
                type: 'stone_golem',
                name: 'Stone Golem',
                health: 80,
                maxHealth: 80,
                damage: 12,
                speed: 20,
                color: '#6b7280',
                size: 48,
                xpValue: 45,
                loot: ['stone_core', 'magic_rune']
            },
            mountain_wolf: {
                type: 'mountain_wolf',
                name: 'Mountain Wolf',
                health: 50,
                maxHealth: 50,
                damage: 10,
                speed: 75,
                color: '#374151',
                size: 34,
                xpValue: 28,
                loot: ['winter_pelt', 'ice_fang']
            },
            frost_giant: {
                type: 'frost_giant',
                name: 'Frost Giant',
                health: 120,
                maxHealth: 120,
                damage: 15,
                speed: 25,
                color: '#0891b2',
                size: 56,
                xpValue: 65,
                loot: ['giant_heart', 'ice_crystal']
            },
            
            // Desert mobs
            sand_worm: {
                type: 'sand_worm',
                name: 'Giant Sand Worm',
                health: 55,
                maxHealth: 55,
                damage: 11,
                speed: 40,
                color: '#eab308',
                size: 36,
                xpValue: 32,
                loot: ['worm_scale', 'desert_venom']
            },
            scorpion: {
                type: 'scorpion',
                name: 'Desert Scorpion',
                health: 40,
                maxHealth: 40,
                damage: 9,
                speed: 60,
                color: '#b91c1c',
                size: 26,
                xpValue: 24,
                loot: ['scorpion_stinger', 'chitin_armor']
            },
            desert_spirit: {
                type: 'desert_spirit',
                name: 'Desert Spirit',
                health: 65,
                maxHealth: 65,
                damage: 13,
                speed: 85,
                color: '#f97316',
                size: 30,
                xpValue: 42,
                loot: ['spirit_essence', 'ancient_amulet']
            },
            
            // Swamp mobs
            swamp_beast: {
                type: 'swamp_beast',
                name: 'Swamp Beast',
                health: 70,
                maxHealth: 70,
                damage: 14,
                speed: 45,
                color: '#365314',
                size: 42,
                xpValue: 48,
                loot: ['swamp_hide', 'toxic_gland']
            },
            poison_frog: {
                type: 'poison_frog',
                name: 'Poison Dart Frog',
                health: 25,
                maxHealth: 25,
                damage: 6,
                speed: 70,
                color: '#16a34a',
                size: 18,
                xpValue: 20,
                loot: ['poison_dart', 'frog_leg']
            },
            swamp_zombie: {
                type: 'swamp_zombie',
                name: 'Swamp Zombie',
                health: 45,
                maxHealth: 45,
                damage: 8,
                speed: 30,
                color: '#166534',
                size: 32,
                xpValue: 26,
                loot: ['zombie_brain', 'rotten_flesh']
            },
            hydra: {
                type: 'hydra',
                name: 'Swamp Hydra',
                health: 150,
                maxHealth: 150,
                damage: 18,
                speed: 35,
                color: '#14532d',
                size: 52,
                xpValue: 85,
                loot: ['hydra_head', 'regeneration_essence']
            },
            
            // Darklands mobs
            skeleton: {
                type: 'skeleton',
                name: 'Dark Skeleton',
                health: 50,
                maxHealth: 50,
                damage: 10,
                speed: 40,
                color: '#d4d4d8',
                size: 30,
                xpValue: 30,
                loot: ['bone_fragments', 'dark_soul']
            },
            dark_knight: {
                type: 'dark_knight',
                name: 'Dark Knight',
                health: 80,
                maxHealth: 80,
                damage: 16,
                speed: 50,
                color: '#3f3f46',
                size: 36,
                xpValue: 55,
                loot: ['dark_sword', 'knight_armor']
            },
            shadow_beast: {
                type: 'shadow_beast',
                name: 'Shadow Beast',
                health: 90,
                maxHealth: 90,
                damage: 17,
                speed: 90,
                color: '#18181b',
                size: 38,
                xpValue: 62,
                loot: ['shadow_essence', 'void_crystal']
            },
            demon_minion: {
                type: 'demon_minion',
                name: 'Demon Minion',
                health: 60,
                maxHealth: 60,
                damage: 14,
                speed: 65,
                color: '#dc2626',
                size: 34,
                xpValue: 45,
                loot: ['demon_horn', 'hellfire_stone']
            },
            
            // Frostlands mobs
            ice_wolf: {
                type: 'ice_wolf',
                name: 'Ice Wolf',
                health: 65,
                maxHealth: 65,
                damage: 15,
                speed: 80,
                color: '#0284c7',
                size: 36,
                xpValue: 52,
                loot: ['ice_pelt', 'frost_fang']
            },
            ice_elemental: {
                type: 'ice_elemental',
                name: 'Ice Elemental',
                health: 85,
                maxHealth: 85,
                damage: 18,
                speed: 55,
                color: '#0891b2',
                size: 40,
                xpValue: 68,
                loot: ['ice_core', 'frozen_heart']
            },
            yeti: {
                type: 'yeti',
                name: 'Mountain Yeti',
                health: 100,
                maxHealth: 100,
                damage: 20,
                speed: 45,
                color: '#e2e8f0',
                size: 48,
                xpValue: 75,
                loot: ['yeti_fur', 'ice_club']
            },
            
            // Volcanic mobs
            fire_elemental: {
                type: 'fire_elemental',
                name: 'Fire Elemental',
                health: 75,
                maxHealth: 75,
                damage: 19,
                speed: 60,
                color: '#dc2626',
                size: 38,
                xpValue: 58,
                loot: ['fire_core', 'lava_stone']
            },
            lava_golem: {
                type: 'lava_golem',
                name: 'Lava Golem',
                health: 140,
                maxHealth: 140,
                damage: 22,
                speed: 25,
                color: '#ea580c',
                size: 56,
                xpValue: 88,
                loot: ['lava_core', 'obsidian_shard']
            },
            ash_drake: {
                type: 'ash_drake',
                name: 'Ash Drake',
                health: 120,
                maxHealth: 120,
                damage: 25,
                speed: 70,
                color: '#991b1b',
                size: 64,
                xpValue: 95,
                loot: ['drake_scale', 'fire_breath_essence']
            },
            fire_imp: {
                type: 'fire_imp',
                name: 'Fire Imp',
                health: 55,
                maxHealth: 55,
                damage: 13,
                speed: 85,
                color: '#f97316',
                size: 24,
                xpValue: 42,
                loot: ['imp_wing', 'fire_essence']
            },
            
            // Ancient Ruins mobs
            arcane_construct: {
                type: 'arcane_construct',
                name: 'Arcane Construct',
                health: 95,
                maxHealth: 95,
                damage: 21,
                speed: 40,
                color: '#7c3aed',
                size: 44,
                xpValue: 72,
                loot: ['arcane_core', 'magic_rune']
            },
            ancient_guardian: {
                type: 'ancient_guardian',
                name: 'Ancient Guardian',
                health: 160,
                maxHealth: 160,
                damage: 26,
                speed: 30,
                color: '#6d28d9',
                size: 60,
                xpValue: 105,
                loot: ['guardian_shard', 'ancient_artifact']
            },
            spell_wraith: {
                type: 'spell_wraith',
                name: 'Spell Wraith',
                health: 85,
                maxHealth: 85,
                damage: 23,
                speed: 95,
                color: '#4c1d95',
                size: 32,
                xpValue: 65,
                loot: ['wraith_essence', 'spell_scroll']
            },
            time_elemental: {
                type: 'time_elemental',
                name: 'Time Elemental',
                health: 90,
                maxHealth: 90,
                damage: 24,
                speed: 100,
                color: '#5b21b6',
                size: 36,
                xpValue: 78,
                loot: ['time_shard', 'chronos_essence']
            },
            
            // Abyss mobs
            abyss_demon: {
                type: 'abyss_demon',
                name: 'Abyss Demon',
                health: 110,
                maxHealth: 110,
                damage: 28,
                speed: 75,
                color: '#7f1d1d',
                size: 48,
                xpValue: 92,
                loot: ['demon_soul', 'abyssal_core']
            },
            void_beast: {
                type: 'void_beast',
                name: 'Void Beast',
                health: 130,
                maxHealth: 130,
                damage: 30,
                speed: 85,
                color: '#1e293b',
                size: 52,
                xpValue: 115,
                loot: ['void_essence', 'dimensional_shard']
            },
            chaos_spawn: {
                type: 'chaos_spawn',
                name: 'Chaos Spawn',
                health: 150,
                maxHealth: 150,
                damage: 32,
                speed: 90,
                color: '#581c87',
                size: 56,
                xpValue: 135,
                loot: ['chaos_heart', 'entropy_core']
            },
            abyssal_horror: {
                type: 'abyssal_horror',
                name: 'Abyssal Horror',
                health: 120,
                maxHealth: 120,
                damage: 29,
                speed: 80,
                color: '#831843',
                size: 50,
                xpValue: 98,
                loot: ['horror_tentacle', 'nightmare_essence']
            }
        };
        
        console.log('🧟 Enhanced Mob Spawner initialized with world map integration');
    }
    
    /**
     * Spawn mobs from world map regions
     */
    spawnRegionMobs(region) {
        console.log(`🧟 Spawning mobs for region: ${region.name}`);
        
        const regionMobs = [];
        
        // Spawn mobs from region spawn zones
        if (region.spawnZones) {
            region.spawnZones.forEach(zone => {
                for (let i = 0; i < zone.mobTypes.length; i++) {
                    const mobType = zone.mobTypes[i];
                    const mob = this.spawnMobInZone(zone, mobType);
                    if (mob) {
                        regionMobs.push(mob);
                    }
                }
            });
        }
        
        // Also spawn from region mob definitions
        if (region.mobs) {
            region.mobs.forEach(mobConfig => {
                for (let i = 0; i < mobConfig.count; i++) {
                    const mob = this.spawnMobByConfig(mobConfig, region);
                    if (mob) {
                        regionMobs.push(mob);
                    }
                }
            });
        }
        
        this.regionMobs.set(region.id, regionMobs);
        console.log(`✅ Spawned ${regionMobs.length} mobs in ${region.name}`);
        
        return regionMobs;
    }
    
    /**
     * Spawn mob by configuration
     */
    spawnMobByConfig(mobConfig, region) {
        const template = this.mobTemplates[mobConfig.type];
        if (!template) {
            console.warn(`⚠️ Unknown mob type: ${mobConfig.type}`);
            return null;
        }
        
        // Find a random position within the region
        const x = Math.random() * 500 + region.spawnZones[0]?.x || 1000;
        const y = Math.random() * 500 + region.spawnZones[0]?.y || 1000;
        
        const mob = {
            id: this.nextMobId++,
            ...template,
            level: mobConfig.level,
            x: x,
            y: y,
            velocityX: (Math.random() - 0.5) * 2,
            velocityY: (Math.random() - 0.5) * 2,
            lastMoveTime: Date.now(),
            isDead: false,
            regionId: region.id,
            respawnTime: mobConfig.respawnTime || 10000
        };
        
        this.mobs.set(mob.id, mob);
        return mob;
    }
    
    /**
     * Spawn initial mobs from all regions
     */
    spawnInitialMobs() {
        console.log('🧟 Spawning mobs from all world regions...');
        
        worldMap.regions.forEach(region => {
            this.spawnRegionMobs(region);
        });
        
        console.log(`✅ Spawned ${this.mobs.size} mobs from ${worldMap.regions.length} regions`);
        return this.getAllMobs();
    }
    
    /**
     * Spawn mobs from a specific zone
     */
    spawnFromZone(zone) {
        const zoneMobs = [];
        
        for (let i = 0; i < zone.count; i++) {
            const mob = this.spawnMobInZone(zone);
            if (mob) {
                zoneMobs.push(mob);
            }
        }
        
        this.zoneMobs.set(zone.name, zoneMobs);
        console.log(`🧟 Spawned ${zoneMobs.length} mobs in ${zone.name}`);
        
        return zoneMobs;
    }
    
    /**
     * Spawn a single mob within a zone
     */
    spawnMobInZone(zone, mobType = null) {
        const template = this.mobTemplates[mobType || zone.mob];
        if (!template) {
            console.warn(`⚠️ Unknown mob type: ${mobType || zone.mob}`);
            return null;
        }
        
        // Generate random position within zone radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * zone.radius;
        
        const x = zone.x + Math.cos(angle) * distance;
        const y = zone.y + Math.sin(angle) * distance;
        
        const mob = {
            id: this.nextMobId++,
            ...template,
            x: x,
            y: y,
            velocityX: (Math.random() - 0.5) * 2,
            velocityY: (Math.random() - 0.5) * 2,
            lastMoveTime: Date.now(),
            isDead: false,
            zoneName: zone.name,
            respawnTime: zone.respawnTime || 10000
        };
        
        this.mobs.set(mob.id, mob);
        return mob;
    }
    
    /**
     * Respawn mob after death (with delay)
     */
    scheduleRespawn(mob) {
        if (!mob.zoneName && !mob.regionId) return;
        
        setTimeout(() => {
            console.log(`🧟 Respawning ${mob.type}`);
            
            if (mob.regionId) {
                const region = worldMap.getRegionById(mob.regionId);
                if (region) {
                    this.spawnMobByConfig(
                        region.mobs.find(m => m.type === mob.type),
                        region
                    );
                }
            } else if (mob.zoneName) {
                const zone = zones.find(z => z.name === mob.zoneName);
                if (zone) {
                    this.spawnMobInZone(zone, mob.type);
                }
            }
        }, mob.respawnTime);
    }
    
    /**
     * Get all mobs
     */
    getAllMobs() {
        return Array.from(this.mobs.values());
    }
    
    /**
     * Get mob by ID
     */
    getMobById(mobId) {
        return this.mobs.get(mobId);
    }
    
    /**
     * Get mobs by region
     */
    getMobsByRegion(regionId) {
        return Array.from(this.mobs.values()).filter(mob => mob.regionId === regionId);
    }
    
    /**
     * Update mob positions (simple AI movement within zones)
     */
    updateMobs(deltaTime) {
        const now = Date.now();
        
        for (const mob of this.mobs.values()) {
            if (mob.isDead) continue;
            
            // Simple random movement
            if (now - mob.lastMoveTime > 2000) { // Change direction every 2 seconds
                mob.velocityX = (Math.random() - 0.5) * 2;
                mob.velocityY = (Math.random() - 0.5) * 2;
                mob.lastMoveTime = now;
            }
            
            // Update position
            mob.x += mob.velocityX * deltaTime * 0.1;
            mob.y += mob.velocityY * deltaTime * 0.1;
            
            // Keep mobs in bounds (map size based on world map)
            mob.x = Math.max(32, Math.min(2970, mob.x)); // 3000px - 32px
            mob.y = Math.max(32, Math.min(1970, mob.y)); // 2000px - 32px
        }
    }
    
    /**
     * Apply damage to mob
     */
    damageMob(mobId, damage) {
        const mob = this.mobs.get(mobId);
        if (!mob || mob.isDead) return false;
        
        mob.health -= damage;
        console.log(`🗡️ Mob ${mob.name} took ${damage} damage, HP: ${mob.health}/${mob.maxHealth}`);
        
        if (mob.health <= 0) {
            mob.isDead = true;
            console.log(`💀 Mob ${mob.name} died! +${mob.xpValue} XP`);
            return true; // Mob died
        }
        
        return false; // Mob still alive
    }
    
    /**
     * Remove dead mob and schedule respawn
     */
    removeMob(mobId) {
        const mob = this.mobs.get(mobId);
        if (mob) {
            this.mobs.delete(mobId);
            console.log(`🧹 Removed mob ${mob.name}`);
            
            // Schedule respawn
            this.scheduleRespawn(mob);
            
            return mob.xpValue || 0;
        }
        return 0;
    }
    
    /**
     * Get mobs near position
     */
    getMobsNearPosition(x, y, radius) {
        const nearbyMobs = [];
        
        for (const mob of this.mobs.values()) {
            if (mob.isDead) continue;
            
            const distance = Math.sqrt(Math.pow(mob.x - x, 2) + Math.pow(mob.y - y, 2));
            if (distance <= radius) {
                nearbyMobs.push(mob);
            }
        }
        
        return nearbyMobs;
    }
    
    /**
     * Get mob statistics
     */
    getMobStats() {
        const stats = {
            totalMobs: this.mobs.size,
            aliveMobs: 0,
            deadMobs: 0,
            mobsByType: {},
            mobsByRegion: {}
        };
        
        for (const mob of this.mobs.values()) {
            if (mob.isDead) {
                stats.deadMobs++;
            } else {
                stats.aliveMobs++;
            }
            
            // Count by type
            stats.mobsByType[mob.type] = (stats.mobsByType[mob.type] || 0) + 1;
            
            // Count by region
            if (mob.regionId) {
                stats.mobsByRegion[mob.regionId] = (stats.mobsByRegion[mob.regionId] || 0) + 1;
            }
        }
        
        return stats;
    }
    
    /**
     * Set server reference
     */
    setServer(server) {
        this.server = server;
    }
}

module.exports = MobSpawner;
