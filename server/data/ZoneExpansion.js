/**
 * ZoneExpansion - New zones and mob definitions for Legacy of Komodo
 * Adds Eldoria, Aurélia, and Dracônia with unique mobs and bosses
 */

const ZoneExpansion = {
    // ============ ELDORIA - The Central Kingdom (Levels 20-40) ============
    eldoria: {
        id: 'eldoria',
        name: 'Eldoria',
        description: 'O reino central de Aethelgard, coração político e religioso do continente. Cidades medievais, castelos imponentes e florestas reais.',
        levelRange: { min: 20, max: 40 },
        environment: 'temperate_forest',
        weather: ['sunny', 'cloudy', 'rainy', 'foggy'],
        features: ['castles', 'villages', 'temples', 'royal_road'],
        connectedZones: ['verdantis', 'aurelia'],
        spawnPoints: [
            { x: 400, y: 300, name: 'Portão Real' },
            { x: 800, y: 600, name: 'Cruzamento do Comerciante' },
            { x: 200, y: 700, name: 'Floresta Real' }
        ],
        music: 'eldoria_theme',
        ambientSounds: ['birds', 'wind', 'distant_bells'],
        
        mobs: {
            // Regular mobs
            royal_guard: {
                id: 'royal_guard',
                name: 'Guarda Real',
                level: 22,
                hp: 350,
                maxHp: 350,
                damage: 35,
                defense: 20,
                experience: 120,
                gold: 25,
                aggroRange: 150,
                attackRange: 40,
                attackSpeed: 1200,
                respawnTime: 8000,
                sprite: 'guard_blue',
                color: '#4169E1',
                behavior: 'patrol',
                patrolRadius: 100,
                drops: [
                    { itemId: 'iron_sword', chance: 0.15 },
                    { itemId: 'guard_shield', chance: 0.10 },
                    { itemId: 'royal_badge', chance: 0.05 },
                    { itemId: 'health_potion', chance: 0.30 }
                ]
            },
            
            forest_bandit: {
                id: 'forest_bandit',
                name: 'Bandido da Floresta',
                level: 24,
                hp: 280,
                maxHp: 280,
                damage: 42,
                defense: 12,
                experience: 140,
                gold: 35,
                aggroRange: 200,
                attackRange: 45,
                attackSpeed: 1000,
                respawnTime: 7000,
                sprite: 'bandit',
                color: '#8B4513',
                behavior: 'ambush',
                stealth: true,
                critChance: 0.15,
                drops: [
                    { itemId: 'dagger_poison', chance: 0.12 },
                    { itemId: 'leather_armor', chance: 0.20 },
                    { itemId: 'stolen_goods', chance: 0.25 },
                    { itemId: 'bandit_mask', chance: 0.08 }
                ]
            },
            
            wild_boar: {
                id: 'wild_boar',
                name: 'Javali Selvagem',
                level: 20,
                hp: 250,
                maxHp: 250,
                damage: 38,
                defense: 15,
                experience: 100,
                gold: 15,
                aggroRange: 120,
                attackRange: 35,
                attackSpeed: 900,
                respawnTime: 6000,
                sprite: 'boar',
                color: '#8B7355',
                behavior: 'charge',
                chargeDamage: 1.5,
                chargeCooldown: 5000,
                drops: [
                    { itemId: 'boar_tusk', chance: 0.40 },
                    { itemId: 'boar_hide', chance: 0.35 },
                    { itemId: 'raw_meat', chance: 0.50 }
                ]
            },
            
            dark_acolyte: {
                id: 'dark_acolyte',
                name: 'Acólito das Sombras',
                level: 28,
                hp: 220,
                maxHp: 220,
                damage: 48,
                defense: 10,
                experience: 180,
                gold: 40,
                aggroRange: 250,
                attackRange: 180,
                attackSpeed: 2000,
                respawnTime: 9000,
                sprite: 'cultist',
                color: '#800080',
                behavior: 'caster',
                spells: ['shadow_bolt', 'life_drain'],
                mana: 150,
                drops: [
                    { itemId: 'shadow_essence', chance: 0.20 },
                    { itemId: 'dark_scroll', chance: 0.15 },
                    { itemId: 'cult_robes', chance: 0.10 },
                    { itemId: 'mana_potion', chance: 0.35 }
                ]
            },
            
            // Elite mobs
            elite_knight: {
                id: 'elite_knight',
                name: 'Cavaleiro de Elite',
                level: 32,
                hp: 800,
                maxHp: 800,
                damage: 65,
                defense: 35,
                experience: 450,
                gold: 120,
                aggroRange: 180,
                attackRange: 50,
                attackSpeed: 1100,
                respawnTime: 30000,
                sprite: 'knight_heavy',
                color: '#C0C0C0',
                isElite: true,
                eliteAura: '#FFD700',
                behavior: 'defensive',
                shieldBlock: 0.25,
                skills: ['shield_bash', 'heavy_strike'],
                drops: [
                    { itemId: 'knight_armor', chance: 0.25 },
                    { itemId: 'steel_longsword', chance: 0.20 },
                    { itemId: 'elite_badge', chance: 0.15 },
                    { itemId: 'health_potion_large', chance: 0.50 }
                ]
            },
            
            shadow_assassin: {
                id: 'shadow_assassin',
                name: 'Assassino das Sombras',
                level: 35,
                hp: 450,
                maxHp: 450,
                damage: 85,
                defense: 15,
                experience: 550,
                gold: 150,
                aggroRange: 300,
                attackRange: 40,
                attackSpeed: 700,
                respawnTime: 45000,
                sprite: 'assassin',
                color: '#2F2F2F',
                isElite: true,
                eliteAura: '#FF0000',
                behavior: 'stealth_assassin',
                stealthDuration: 3000,
                backstabMultiplier: 2.5,
                poisonDamage: 15,
                skills: ['vanish', 'shadow_strike', 'poison_blade'],
                drops: [
                    { itemId: 'shadow_blade', chance: 0.20 },
                    { itemId: 'assassin_cloak', chance: 0.18 },
                    { itemId: 'poison_vial', chance: 0.30 },
                    { itemId: 'rare_gem', chance: 0.10 }
                ]
            }
        },
        
        boss: {
            id: 'corrupted_paladin',
            name: 'Valerius, o Paladino Corrompido',
            title: 'Campeão Caído de Eldoria',
            level: 40,
            hp: 5000,
            maxHp: 5000,
            damage: 120,
            defense: 50,
            experience: 5000,
            gold: 2000,
            aggroRange: 400,
            attackRange: 70,
            attackSpeed: 1500,
            respawnTime: 600000, // 10 minutes
            sprite: 'boss_paladin',
            color: '#4B0082',
            bossAura: '#9400D3',
            
            phases: [
                {
                    phase: 1,
                    hpThreshold: 0.75,
                    damageMultiplier: 1.0,
                    abilities: ['holy_slash', 'shield_bash'],
                    behavior: 'defensive'
                },
                {
                    phase: 2,
                    hpThreshold: 0.50,
                    damageMultiplier: 1.3,
                    abilities: ['dark_purge', 'unholy_aura', 'summon_corrupted_souls'],
                    behavior: 'aggressive'
                },
                {
                    phase: 3,
                    hpThreshold: 0.25,
                    damageMultiplier: 1.6,
                    abilities: ['apocalyptic_strike', 'soul_drain', 'desperation'],
                    behavior: 'berserk'
                }
            ],
            
            abilities: {
                holy_slash: {
                    name: 'Corte Sagrado Corrompido',
                    damage: 150,
                    cooldown: 4000,
                    range: 100,
                    type: 'melee_aoe'
                },
                dark_purge: {
                    name: 'Expurgo das Trevas',
                    damage: 200,
                    cooldown: 8000,
                    range: 250,
                    type: 'magic_aoe',
                    effect: 'curse'
                },
                summon_corrupted_souls: {
                    name: 'Evocar Almas Corrompidas',
                    cooldown: 15000,
                    summonCount: 3,
                    summonType: 'corrupted_soul'
                },
                apocalyptic_strike: {
                    name: 'Golpe Apocalíptico',
                    damage: 400,
                    cooldown: 12000,
                    range: 150,
                    type: 'heavy_aoe',
                    warningTime: 2000
                }
            },
            
            introDialogue: [
                "Valerius: 'Eu já fui o protetor deste reino...'",
                "Valerius: 'Agora, sou seu juiz e carrasco!'",
                "Valerius: 'Sinta a dor da corrupção divina!'"
            ],
            
            deathDialogue: [
                "Valerius: 'A escuridão... me libertou...'",
                "Valerius: 'Eldoria... perdoe-me...'"
            ],
            
            drops: [
                { itemId: 'valerius_sword', chance: 0.30, guaranteed: true },
                { itemId: 'corrupted_paladin_armor', chance: 0.25 },
                { itemId: 'shadow_shield', chance: 0.20 },
                { itemId: 'fallen_champion_essence', chance: 0.50 },
                { itemId: 'legendary_gem', chance: 0.15 },
                { itemId: 'boss_chest_eldoria', chance: 1.0, guaranteed: true }
            ],
            
            achievements: {
                firstKill: 'valerius_conqueror',
                soloKill: 'valerius_solo_slayer',
                noDeathKill: 'valerius_perfect'
            }
        }
    },

    // ============ AURÉLIA - The Golden Desert (Levels 40-60) ============
    aurelia: {
        id: 'aurelia',
        name: 'Aurélia',
        description: 'Desertos dourados de areia cristalina, ruínas antigas de civilizações perdidas e oásis escondidos. Território dos nomades e segredos enterrados.',
        levelRange: { min: 40, max: 60 },
        environment: 'desert',
        weather: ['scorching', 'sandstorm', 'night_cold', 'oasis_mist'],
        features: ['pyramids', 'ruins', 'oasis', 'nomad_camps'],
        connectedZones: ['eldoria', 'draconia'],
        spawnPoints: [
            { x: 300, y: 400, name: 'Portão do Deserto' },
            { x: 700, y: 200, name: 'Oásis da Lua' },
            { x: 900, y: 700, name: 'Ruínas de Seth' }
        ],
        music: 'aurelia_theme',
        ambientSounds: ['wind_desert', 'sand_shift', 'distant_drums'],
        
        environmentalEffects: {
            heat: {
                damage: 2,
                interval: 5000,
                protection: 'heat_resistance'
            },
            sandstorm: {
                visibility: 0.5,
                movementPenalty: 0.3,
                chance: 0.2
            }
        },
        
        mobs: {
            sand_scorpion: {
                id: 'sand_scorpion',
                name: 'Escorpião de Areia Gigante',
                level: 42,
                hp: 550,
                maxHp: 550,
                damage: 70,
                defense: 25,
                experience: 280,
                gold: 50,
                aggroRange: 160,
                attackRange: 45,
                attackSpeed: 1100,
                respawnTime: 8000,
                sprite: 'scorpion_large',
                color: '#DAA520',
                behavior: 'burrow',
                burrowDuration: 2000,
                poisonDamage: 20,
                poisonDuration: 5000,
                drops: [
                    { itemId: 'scorpion_stinger', chance: 0.35 },
                    { itemId: 'desert_chitin', chance: 0.40 },
                    { itemId: 'venom_sac', chance: 0.25 }
                ]
            },
            
            nomad_raider: {
                id: 'nomad_raider',
                name: 'Saqueador Nômade',
                level: 45,
                hp: 480,
                maxHp: 480,
                damage: 78,
                defense: 22,
                experience: 320,
                gold: 65,
                aggroRange: 220,
                attackRange: 50,
                attackSpeed: 1050,
                respawnTime: 7500,
                sprite: 'nomad',
                color: '#CD853F',
                behavior: 'hit_and_run',
                mounted: true,
                mountedSpeed: 1.5,
                javelinAttack: {
                    damage: 90,
                    range: 200,
                    cooldown: 6000
                },
                drops: [
                    { itemId: 'nomad_spear', chance: 0.18 },
                    { itemId: 'desert_robes', chance: 0.22 },
                    { itemId: 'camel_saddle', chance: 0.15 },
                    { itemId: 'water_skin', chance: 0.30 }
                ]
            },
            
            sandstone_golem: {
                id: 'sandstone_golem',
                name: 'Golem de Arenito',
                level: 48,
                hp: 1200,
                maxHp: 1200,
                damage: 85,
                defense: 60,
                experience: 450,
                gold: 80,
                aggroRange: 140,
                attackRange: 60,
                attackSpeed: 1800,
                respawnTime: 12000,
                sprite: 'golem_stone',
                color: '#DEB887',
                behavior: 'slow_tank',
                slowImmune: true,
                stunResist: 0.5,
                earthquake: {
                    damage: 60,
                    range: 100,
                    cooldown: 8000,
                    knockback: true
                },
                drops: [
                    { itemId: 'golem_core', chance: 0.20 },
                    { itemId: 'sandstone_brick', chance: 0.50 },
                    { itemId: 'ancient_rune', chance: 0.12 }
                ]
            },
            
            mirage_witch: {
                id: 'mirage_witch',
                name: 'Bruxa das Miragens',
                level: 52,
                hp: 380,
                maxHp: 380,
                damage: 95,
                defense: 15,
                experience: 380,
                gold: 75,
                aggroRange: 300,
                attackRange: 220,
                attackSpeed: 2200,
                respawnTime: 10000,
                sprite: 'desert_witch',
                color: '#FF69B4',
                behavior: 'illusionist',
                mirrorImages: 3,
                spells: ['heat_wave', 'sand_blast', 'illusion_trap'],
                mana: 300,
                drops: [
                    { itemId: 'mirage_orb', chance: 0.15 },
                    { itemId: 'desert_staff', chance: 0.18 },
                    { itemId: 'silk_veil', chance: 0.25 },
                    { itemId: 'oasis_water', chance: 0.40 }
                ]
            },
            
            // Elite mobs
            desert_warlord: {
                id: 'desert_warlord',
                name: 'Senhor da Guerra do Deserto',
                level: 56,
                hp: 1800,
                maxHp: 1800,
                damage: 110,
                defense: 40,
                experience: 900,
                gold: 250,
                aggroRange: 250,
                attackRange: 70,
                attackSpeed: 1000,
                respawnTime: 60000,
                sprite: 'warlord_desert',
                color: '#B8860B',
                isElite: true,
                eliteAura: '#FFD700',
                behavior: 'commander',
                summonGuards: {
                    count: 2,
                    type: 'nomad_guard',
                    cooldown: 20000
                },
                whirlwind: {
                    damage: 140,
                    range: 100,
                    cooldown: 10000
                },
                drops: [
                    { itemId: 'warlord_scimitar', chance: 0.22 },
                    { itemId: 'desert_crown', chance: 0.15 },
                    { itemId: 'nomad_treasure', chance: 0.30 },
                    { itemId: 'ancient_coin', chance: 0.50 }
                ]
            },
            
            mummy_guardian: {
                id: 'mummy_guardian',
                name: 'Guardião Mumificado',
                level: 58,
                hp: 1400,
                maxHp: 1400,
                damage: 100,
                defense: 55,
                experience: 850,
                gold: 200,
                aggroRange: 200,
                attackRange: 50,
                attackSpeed: 1300,
                respawnTime: 50000,
                sprite: 'mummy',
                color: '#F5F5DC',
                isElite: true,
                eliteAura: '#32CD32',
                behavior: 'ancient_guardian',
                curseAttack: {
                    effect: 'reduce_stats',
                    duration: 10000,
                    strength: 0.2
                },
                regeneration: 20,
                drops: [
                    { itemId: 'ancient_bandages', chance: 0.30 },
                    { itemId: 'pharaoh_ring', chance: 0.12 },
                    { itemId: 'canopic_jar', chance: 0.25 },
                    { itemId: 'mummy_ash', chance: 0.45 }
                ]
            }
        },
        
        boss: {
            id: 'pharaoh_anub',
            name: 'Anub, o Faraó Imortal',
            title: 'Guardião das Pirâmides Eternas',
            level: 60,
            hp: 8000,
            maxHp: 8000,
            damage: 180,
            defense: 70,
            experience: 10000,
            gold: 5000,
            aggroRange: 450,
            attackRange: 80,
            attackSpeed: 1600,
            respawnTime: 900000, // 15 minutes
            sprite: 'boss_pharaoh',
            color: '#FFD700',
            bossAura: '#00CED1',
            
            phases: [
                {
                    phase: 1,
                    hpThreshold: 0.80,
                    damageMultiplier: 1.0,
                    abilities: ['sands_of_time', 'mummification'],
                    behavior: 'calculated'
                },
                {
                    phase: 2,
                    hpThreshold: 0.60,
                    damageMultiplier: 1.2,
                    abilities: ['desert_storm', 'summon_scarab_swarm', 'oasis_drain'],
                    behavior: 'environmental'
                },
                {
                    phase: 3,
                    hpThreshold: 0.40,
                    damageMultiplier: 1.4,
                    abilities: ['eternal_curse', 'pyramid_prison', 'ancient_wrath'],
                    behavior: 'aggressive'
                },
                {
                    phase: 4,
                    hpThreshold: 0.15,
                    damageMultiplier: 1.8,
                    abilities: ['immortality_denied', 'final_judgment', 'pharaoh_rebirth'],
                    behavior: 'desperate'
                }
            ],
            
            abilities: {
                sands_of_time: {
                    name: 'Areias do Tempo',
                    damage: 250,
                    cooldown: 6000,
                    range: 200,
                    type: 'magic_aoe',
                    effect: 'slow_time',
                    slowAmount: 0.5
                },
                mummification: {
                    name: 'Mumificação',
                    damage: 150,
                    cooldown: 10000,
                    range: 120,
                    type: 'curse',
                    effect: 'stun_and_drain',
                    drainPercentage: 0.1
                },
                desert_storm: {
                    name: 'Tempestade de Areia',
                    damage: 100,
                    cooldown: 15000,
                    range: 400,
                    type: 'environmental',
                    duration: 10000,
                    blindChance: 0.3
                },
                summon_scarab_swarm: {
                    name: 'Enxame de Escaravelhos',
                    cooldown: 20000,
                    summonCount: 8,
                    summonType: 'scarab_beetle',
                    summonDuration: 30000
                },
                pyramid_prison: {
                    name: 'Prisão da Pirâmide',
                    damage: 300,
                    cooldown: 25000,
                    range: 150,
                    type: 'trap',
                    imprisonDuration: 5000,
                    damageWhileTrapped: 50
                },
                final_judgment: {
                    name: 'Julgamento Final',
                    damage: 800,
                    cooldown: 45000,
                    range: 300,
                    type: 'ultimate',
                    chargeTime: 4000,
                    warning: 'Anub está canalizando o poder dos deuses antigos!'
                }
            },
            
            introDialogue: [
                "Anub: 'Eu governava este deserto antes de sua civilização nascer...'",
                "Anub: 'Milênios de conhecimento perfeito estão ao meu alcance.'",
                "Anub: 'Você ousa perturbar meu sono eterno? Sua arrogância será sua ruína!'"
            ],
            
            deathDialogue: [
                "Anub: 'Im... possível... minha imortalidade...'",
                "Anub: 'O ciclo... deve... continuar...'",
                "Anub: 'Eu... retornarei...'"
            ],
            
            drops: [
                { itemId: 'anub_staff', chance: 0.25, guaranteed: true },
                { itemId: 'crown_pharaoh', chance: 0.20 },
                { itemId: 'sands_of_eternity', chance: 0.15 },
                { itemId: 'mummification_scroll', chance: 0.30 },
                { itemId: 'pharaoh_seal', chance: 0.40 },
                { itemId: 'legendary_gem_desert', chance: 0.20 },
                { itemId: 'boss_chest_aurelia', chance: 1.0, guaranteed: true }
            ],
            
            achievements: {
                firstKill: 'anub_conqueror',
                soloKill: 'anub_solo_slayer',
                noDeathKill: 'anub_perfect',
                speedKill: 'anub_speed_runner'
            },
            
            specialMechanic: {
                name: 'Canopic Jars',
                description: 'Destrua os 4 jarros canópicos ao redor da arena para impedir a regeneração de Anub',
                jarsRequired: 4
            }
        }
    },

    // ============ DRACÔNIA - The Dragon Mountains (Levels 60-80) ============
    draconia: {
        id: 'draconia',
        name: 'Dracônia',
        description: 'Montanhas imponentes onde os antigos dragões fazem seus ninhos. Lar dos últimos dragões de Aethelgard e tesouros incontáveis.',
        levelRange: { min: 60, max: 80 },
        environment: 'mountain_volcanic',
        weather: ['ash_fall', 'volcanic_heat', 'dragon_storm', 'calm_peak'],
        features: ['volcanoes', 'dragon_nests', 'crystal_caves', 'ancient_ruins'],
        connectedZones: ['aurelia', 'ruins_komodo'],
        spawnPoints: [
            { x: 350, y: 250, name: 'Pé da Montanha' },
            { x: 600, y: 150, name: 'Passo do Dragão' },
            { x: 850, y: 300, name: 'Ninho Antigo' }
        ],
        music: 'draconia_theme',
        ambientSounds: ['wind_mountain', 'distant_roar', 'lava_flow', 'crystal_hum'],
        
        environmentalEffects: {
            volcanic_heat: {
                damage: 5,
                interval: 3000,
                protection: 'fire_immunity'
            },
            altitude: {
                oxygenDepletion: true,
                damage: 3,
                interval: 5000,
                protection: 'breathing_enchantment'
            }
        },
        
        mobs: {
            drake_whelp: {
                id: 'drake_whelp',
                name: 'Draconeto',
                level: 62,
                hp: 750,
                maxHp: 750,
                damage: 95,
                defense: 30,
                experience: 450,
                gold: 90,
                aggroRange: 180,
                attackRange: 55,
                attackSpeed: 1000,
                respawnTime: 10000,
                sprite: 'drake_small',
                color: '#FF4500',
                behavior: 'pack',
                packBonus: 0.1,
                fireBreath: {
                    damage: 120,
                    range: 100,
                    cooldown: 6000,
                    angle: 60
                },
                drops: [
                    { itemId: 'whelp_scale', chance: 0.45 },
                    { itemId: 'small_claw', chance: 0.35 },
                    { itemId: 'fire_essence_weak', chance: 0.25 }
                ]
            },
            
            wyvern: {
                id: 'wyvern',
                name: 'Viverna',
                level: 66,
                hp: 1100,
                maxHp: 1100,
                damage: 115,
                defense: 35,
                experience: 600,
                gold: 120,
                aggroRange: 280,
                attackRange: 70,
                attackSpeed: 1100,
                respawnTime: 12000,
                sprite: 'wyvern',
                color: '#228B22',
                behavior: 'air_combat',
                flying: true,
                diveAttack: {
                    damage: 180,
                    multiplier: 1.5,
                    cooldown: 8000
                },
                tailStrike: {
                    damage: 140,
                    range: 90,
                    poison: true
                },
                drops: [
                    { itemId: 'wyvern_wing', chance: 0.30 },
                    { itemId: 'venom_gland', chance: 0.35 },
                    { itemId: 'wyvern_horn', chance: 0.20 }
                ]
            },
            
            lava_elemental: {
                id: 'lava_elemental',
                name: 'Elemental de Lava',
                level: 70,
                hp: 1500,
                maxHp: 1500,
                damage: 130,
                defense: 50,
                experience: 750,
                gold: 150,
                aggroRange: 200,
                attackRange: 65,
                attackSpeed: 1400,
                respawnTime: 15000,
                sprite: 'elemental_lava',
                color: '#FF6347',
                behavior: 'elemental',
                fireImmune: true,
                lavaPool: {
                    damage: 40,
                    duration: 8000,
                    cooldown: 12000,
                    size: 80
                },
                eruption: {
                    damage: 200,
                    range: 120,
                    cooldown: 15000,
                    knockback: true
                },
                drops: [
                    { itemId: 'lava_core', chance: 0.25 },
                    { itemId: 'magma_stone', chance: 0.50 },
                    { itemId: 'fire_heart', chance: 0.15 }
                ]
            },
            
            dragon_whelp: {
                id: 'dragon_whelp',
                name: 'Filhote de Dragão',
                level: 74,
                hp: 2000,
                maxHp: 2000,
                damage: 160,
                defense: 45,
                experience: 1000,
                gold: 250,
                aggroRange: 250,
                attackRange: 75,
                attackSpeed: 1200,
                respawnTime: 20000,
                sprite: 'dragon_young',
                color: '#DC143C',
                behavior: 'dragon_breath',
                dragonBreath: {
                    damage: 250,
                    range: 150,
                    angle: 90,
                    cooldown: 10000,
                    type: 'fire'
                },
                wingBuffet: {
                    damage: 100,
                    range: 100,
                    knockback: 80,
                    cooldown: 8000
                },
                drops: [
                    { itemId: 'dragon_scale_young', chance: 0.35 },
                    { itemId: 'dragon_tooth', chance: 0.25 },
                    { itemId: 'small_hoard', chance: 0.40 },
                    { itemId: 'fire_crystal', chance: 0.20 }
                ]
            },
            
            // Elite mobs
            elder_wyvern: {
                id: 'elder_wyvern',
                name: 'Viverna Anciã',
                level: 76,
                hp: 3500,
                maxHp: 3500,
                damage: 190,
                defense: 55,
                experience: 1800,
                gold: 500,
                aggroRange: 320,
                attackRange: 85,
                attackSpeed: 1050,
                respawnTime: 90000,
                sprite: 'wyvern_elder',
                color: '#8B0000',
                isElite: true,
                eliteAura: '#FFD700',
                behavior: 'dragon_elite',
                alphaRoar: {
                    buffNearby: 0.3,
                    fearEnemies: true,
                    cooldown: 20000
                },
                stormBreath: {
                    damage: 350,
                    range: 200,
                    type: 'lightning_fire',
                    cooldown: 15000
                },
                drops: [
                    { itemId: 'elder_wyvern_hide', chance: 0.25 },
                    { itemId: 'storm_sac', chance: 0.20 },
                    { itemId: 'ancient_claw', chance: 0.30 },
                    { itemId: 'rare_dragon_egg', chance: 0.05 }
                ]
            },
            
            dragonkin_champion: {
                id: 'dragonkin_champion',
                name: 'Campeão Draconiano',
                level: 78,
                hp: 2800,
                maxHp: 2800,
                damage: 175,
                defense: 60,
                experience: 1500,
                gold: 400,
                aggroRange: 220,
                attackRange: 70,
                attackSpeed: 1000,
                respawnTime: 75000,
                sprite: 'dragonkin',
                color: '#9932CC',
                isElite: true,
                eliteAura: '#FF8C00',
                behavior: 'honor_combat',
                dragonBlood: {
                    healOnDamage: 0.15,
                    fireEnchant: true
                },
                greatsword: {
                    damage: 250,
                    cleave: true,
                    fireProc: 0.3
                },
                drops: [
                    { itemId: 'dragonkin_armor', chance: 0.20 },
                    { itemId: 'flame_greatsword', chance: 0.18 },
                    { itemId: 'dragon_blood_vial', chance: 0.35 },
                    { itemId: 'champion_insignia', chance: 0.15 }
                ]
            }
        },
        
        boss: {
            id: 'ignis_ancient',
            name: 'Ignis, o Dragão Ancião',
            title: 'Progenitor das Chamas Eternas',
            level: 80,
            hp: 15000,
            maxHp: 15000,
            damage: 280,
            defense: 90,
            experience: 25000,
            gold: 15000,
            aggroRange: 500,
            attackRange: 100,
            attackSpeed: 1800,
            respawnTime: 1200000, // 20 minutes
            sprite: 'boss_dragon_ancient',
            color: '#8B0000',
            bossAura: '#FF4500',
            
            phases: [
                {
                    phase: 1,
                    hpThreshold: 0.85,
                    damageMultiplier: 1.0,
                    abilities: ['fire_breath', 'tail_sweep', 'wing_buffet'],
                    behavior: 'majesty'
                },
                {
                    phase: 2,
                    hpThreshold: 0.70,
                    damageMultiplier: 1.2,
                    abilities: ['inferno_breath', 'summon_drakes', 'searing_ground'],
                    behavior: 'heated'
                },
                {
                    phase: 3,
                    hpThreshold: 0.50,
                    damageMultiplier: 1.4,
                    abilities: ['cataclysm_breath', 'volcanic_eruption', 'dragons_wrath'],
                    behavior: 'enraged'
                },
                {
                    phase: 4,
                    hpThreshold: 0.25,
                    damageMultiplier: 1.8,
                    abilities: ['world_breaker', 'eternal_flame', 'dragon_rebirth'],
                    behavior: 'apocalyptic'
                }
            ],
            
            abilities: {
                fire_breath: {
                    name: 'Bafo de Fogo',
                    damage: 400,
                    cooldown: 6000,
                    range: 200,
                    angle: 120,
                    type: 'cone_fire'
                },
                inferno_breath: {
                    name: 'Bafo Infernal',
                    damage: 600,
                    cooldown: 10000,
                    range: 250,
                    angle: 120,
                    type: 'cone_fire_intense',
                    burnDamage: 100,
                    burnDuration: 5000
                },
                cataclysm_breath: {
                    name: 'Bafo Cataclísmico',
                    damage: 900,
                    cooldown: 15000,
                    range: 300,
                    angle: 120,
                    type: 'cone_fire_cataclysm',
                    meltArmor: true,
                    fear: true
                },
                world_breaker: {
                    name: 'Ruptura Mundial',
                    damage: 1500,
                    cooldown: 45000,
                    range: 400,
                    type: 'ultimate_earth_fire',
                    earthquake: true,
                    fissures: true,
                    warningTime: 5000
                },
                summon_drakes: {
                    name: 'Chamar Prole',
                    cooldown: 25000,
                    summonCount: 4,
                    summonType: 'drake_feral'
                },
                volcanic_eruption: {
                    name: 'Erupção Vulcânica',
                    damage: 500,
                    cooldown: 30000,
                    range: 350,
                    type: 'environmental',
                    lavaGeysers: 8,
                    duration: 15000
                },
                dragon_rebirth: {
                    name: 'Renascimento Dracônico',
                    cooldown: 60000,
                    healPercent: 0.15,
                    clearDebuffs: true,
                    damageBoost: 1.5,
                    duration: 20000,
                    useLimit: 1
                }
            },
            
            introDialogue: [
                "Ignis: 'Você sente o calor, mortal? Este é o calor da criação.'",
                "Ignis: 'Eu existi antes das montanhas. Antes dos mares.'",
                "Ignis: 'Minha chama consumiu civilizações inteiras. Você é nada.'",
                "Ignis: 'Venha, pequeno. Queime na glória de Ignis!'"
            ],
            
            deathDialogue: [
                "Ignis: 'Impossível... eu sou... eterno...'",
                "Ignis: 'Minha chama... nunca se extinguirá...'",
                "Ignis: 'Um dia... renascerei... das cinzas...'"
            ],
            
            drops: [
                { itemId: 'ignis_scale', chance: 0.30, guaranteed: true },
                { itemId: 'heart_of_fire', chance: 0.25 },
                { itemId: 'dragonbone_weapon', chance: 0.20 },
                { itemId: 'ancient_dragon_hoard', chance: 0.50, guaranteed: true },
                { itemId: 'eternal_flame_essence', chance: 0.15 },
                { itemId: 'dragon_rider_reins', chance: 0.10 },
                { itemId: 'legendary_gem_dragon', chance: 0.25 },
                { itemId: 'boss_chest_draconia', chance: 1.0, guaranteed: true }
            ],
            
            achievements: {
                firstKill: 'ignis_conqueror',
                soloKill: 'ignis_solo_slayer',
                noDeathKill: 'ignis_perfect',
                speedKill: 'ignis_speed_runner',
                noFireDamage: 'ignis_fire_immune',
                tankOnlyKill: 'ignis_tank_challenge'
            },
            
            specialMechanic: {
                name: 'Dragon Hoard',
                description: 'Durante o combate, baús de tesouro aparecem aleatoriamente na arena. Colete-os para buffs temporários.',
                chestCount: 6,
                respawnTime: 30000
            },
            
            flightMechanic: {
                name: 'Aerial Combat',
                description: 'Ignis alterna entre combate terrestre e aéreo. Durante o voo, apenas ataques à distância funcionam.',
                groundPhases: [1, 3],
                airPhases: [2, 4]
            }
        }
    },

    // ============ UTILITY FUNCTIONS ============
    
    /**
     * Get zone by ID
     */
    getZone(zoneId) {
        return this[zoneId] || null;
    },
    
    /**
     * Get all zones as array
     */
    getAllZones() {
        return [this.eldoria, this.aurelia, this.draconia];
    },
    
    /**
     * Get mob definition from any zone
     */
    getMob(mobId) {
        for (const zone of this.getAllZones()) {
            if (zone.mobs[mobId]) {
                return { ...zone.mobs[mobId], zoneId: zone.id };
            }
        }
        return null;
    },
    
    /**
     * Get boss from zone
     */
    getBoss(zoneId) {
        const zone = this.getZone(zoneId);
        return zone ? zone.boss : null;
    },
    
    /**
     * Get mobs for level range
     */
    getMobsForLevel(level, zoneId = null) {
        const zones = zoneId ? [this.getZone(zoneId)] : this.getAllZones();
        const mobs = [];
        
        for (const zone of zones) {
            if (!zone) continue;
            
            for (const [id, mob] of Object.entries(zone.mobs)) {
                if (Math.abs(mob.level - level) <= 5) {
                    mobs.push({ ...mob, zoneId: zone.id });
                }
            }
        }
        
        return mobs;
    },
    
    /**
     * Check if level can enter zone
     */
    canEnterZone(zoneId, level) {
        const zone = this.getZone(zoneId);
        if (!zone) return false;
        return level >= zone.levelRange.min;
    },
    
    /**
     * Get zone recommendation for level
     */
    getRecommendedZone(level) {
        for (const zone of this.getAllZones()) {
            if (level >= zone.levelRange.min && level <= zone.levelRange.max) {
                return zone;
            }
        }
        return null;
    }
};

module.exports = ZoneExpansion;
