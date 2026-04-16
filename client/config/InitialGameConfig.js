/**
 * Initial Game Configuration - Legacy of Komodo
 * Configuração inicial do jogo: classe Aprendiz e primeiros mobs
 */

const InitialGameConfig = {
    // === CONFIGURAÇÃO DA CLASSE APRENDIZ ===
    classes: {
        apprentice: {
            id: 'apprentice',
            name: 'Aprendiz',
            description: 'Um jovem aventureiro em busca de conhecimento e poder',
            startingLevel: 1,
            maxLevel: 99,
            
            // Atributos base
            baseStats: {
                health: 100,
                maxHealth: 100,
                mana: 50,
                maxMana: 50,
                attack: 10,
                defense: 8,
                speed: 12,
                magic: 15,
                critical: 5,
                evasion: 10,
                accuracy: 85
            },
            
            // Crescimento por nível
            statGrowth: {
                health: 8,
                mana: 5,
                attack: 2,
                defense: 1,
                speed: 1,
                magic: 3,
                critical: 0.5,
                evasion: 0.5,
                accuracy: 1
            },
            
            // Habilidades iniciais
            startingSkills: [
                {
                    id: 'magic_missile',
                    name: 'Míssil Mágico',
                    description: 'Dispara um míssil de energia mágica',
                    manaCost: 5,
                    damage: 15,
                    range: 5,
                    cooldown: 1000,
                    icon: '✨'
                },
                {
                    id: 'heal',
                    name: 'Cura Menor',
                    description: 'Recupera uma pequena quantidade de saúde',
                    manaCost: 10,
                    healing: 25,
                    range: 0,
                    cooldown: 3000,
                    icon: '💚'
                }
            ],
            
            // Equipamento inicial
            startingEquipment: {
                weapon: {
                    id: 'apprentice_wand',
                    name: 'Varinha de Aprendiz',
                    type: 'wand',
                    damage: 5,
                    magicBonus: 3,
                    icon: '🪄'
                },
                armor: {
                    id: 'apprentice_robes',
                    name: 'Vestes de Aprendiz',
                    type: 'armor',
                    defense: 3,
                    magicBonus: 2,
                    icon: '🧙'
                },
                accessory: {
                    id: 'apprentice_ring',
                    name: 'Anel de Aprendiz',
                    type: 'ring',
                    manaBonus: 5,
                    icon: '💍'
                }
            },
            
            // Inventário inicial
            startingInventory: [
                {
                    id: 'health_potion',
                    name: 'Poção de Cura',
                    type: 'consumable',
                    healing: 50,
                    quantity: 3,
                    icon: '🧪'
                },
                {
                    id: 'mana_potion',
                    name: 'Poção de Mana',
                    type: 'consumable',
                    mana: 30,
                    quantity: 3,
                    icon: '💙'
                },
                {
                    id: 'bread',
                    name: 'Pão',
                    type: 'food',
                    healing: 10,
                    quantity: 5,
                    icon: '🍞'
                }
            ],
            
            // Visual
            appearance: {
                sprite: 'player_apprentice',
                color: '#2196F3',
                size: { width: 32, height: 48 },
                animations: {
                    idle: { frames: 4, speed: 200 },
                    walk: { frames: 8, speed: 100 },
                    attack: { frames: 6, speed: 150 },
                    cast: { frames: 8, speed: 100 },
                    hurt: { frames: 2, speed: 300 },
                    death: { frames: 6, speed: 200 }
                }
            }
        }
    },
    
    // === CONFIGURAÇÃO DOS PRIMEIROS MOBS ===
    mobs: {
        // === MOBS NÍVEL 1-5 ===
        rat: {
            id: 'rat',
            name: 'Rato',
            level: 1,
            type: 'beast',
            behavior: 'passive',
            
            stats: {
                health: 15,
                maxHealth: 15,
                attack: 2,
                defense: 1,
                speed: 15,
                magic: 0,
                critical: 2,
                evasion: 15,
                accuracy: 70
            },
            
            rewards: {
                experience: 5,
                gold: 1,
                loot: [
                    { id: 'rat_tail', name: 'Cauda de Rato', chance: 0.3, quantity: 1 },
                    { id: 'rat_fur', name: 'Pele de Rato', chance: 0.2, quantity: 1 }
                ]
            },
            
            appearance: {
                sprite: 'mob_rat',
                color: '#795548',
                size: { width: 24, height: 16 },
                animations: {
                    idle: { frames: 2, speed: 500 },
                    walk: { frames: 4, speed: 150 },
                    attack: { frames: 3, speed: 200 },
                    death: { frames: 4, speed: 200 }
                }
            },
            
            ai: {
                behavior: 'wander',
                detectionRange: 3,
                fleeThreshold: 0.5,
                groupBehavior: 'solo'
            }
        },
        
        slime: {
            id: 'slime',
            name: 'Slime',
            level: 2,
            type: 'slime',
            behavior: 'neutral',
            
            stats: {
                health: 20,
                maxHealth: 20,
                attack: 3,
                defense: 2,
                speed: 8,
                magic: 1,
                critical: 1,
                evasion: 5,
                accuracy: 75
            },
            
            rewards: {
                experience: 8,
                gold: 2,
                loot: [
                    { id: 'slime_gel', name: 'Gel de Slime', chance: 0.4, quantity: 1 },
                    { id: 'slime_core', name: 'Núcleo de Slime', chance: 0.1, quantity: 1 }
                ]
            },
            
            appearance: {
                sprite: 'mob_slime',
                color: '#4CAF50',
                size: { width: 28, height: 20 },
                animations: {
                    idle: { frames: 3, speed: 400 },
                    walk: { frames: 6, speed: 150 },
                    attack: { frames: 4, speed: 200 },
                    death: { frames: 5, speed: 250 }
                }
            },
            
            ai: {
                behavior: 'patrol',
                detectionRange: 2,
                fleeThreshold: 0.3,
                groupBehavior: 'group'
            }
        },
        
        wolf: {
            id: 'wolf',
            name: 'Lobo Jovem',
            level: 3,
            type: 'beast',
            behavior: 'aggressive',
            
            stats: {
                health: 30,
                maxHealth: 30,
                attack: 5,
                defense: 3,
                speed: 18,
                magic: 0,
                critical: 5,
                evasion: 12,
                accuracy: 80
            },
            
            rewards: {
                experience: 12,
                gold: 3,
                loot: [
                    { id: 'wolf_pelt', name: 'Pele de Lobo', chance: 0.3, quantity: 1 },
                    { id: 'wolf_fang', name: 'Presa de Lobo', chance: 0.2, quantity: 1 }
                ]
            },
            
            appearance: {
                sprite: 'mob_wolf',
                color: '#616161',
                size: { width: 36, height: 24 },
                animations: {
                    idle: { frames: 3, speed: 400 },
                    walk: { frames: 6, speed: 120 },
                    attack: { frames: 5, speed: 180 },
                    death: { frames: 6, speed: 200 }
                }
            },
            
            ai: {
                behavior: 'hunt',
                detectionRange: 5,
                fleeThreshold: 0.2,
                groupBehavior: 'pack'
            }
        },
        
        bandit: {
            id: 'bandit',
            name: 'Bandido',
            level: 4,
            type: 'humanoid',
            behavior: 'aggressive',
            
            stats: {
                health: 35,
                maxHealth: 35,
                attack: 6,
                defense: 4,
                speed: 14,
                magic: 2,
                critical: 8,
                evasion: 10,
                accuracy: 85
            },
            
            rewards: {
                experience: 15,
                gold: 5,
                loot: [
                    { id: 'bandit_mask', name: 'Máscara de Bandido', chance: 0.2, quantity: 1 },
                    { id: 'stolen_gold', name: 'Ouro Roubado', chance: 0.5, quantity: 3 }
                ]
            },
            
            appearance: {
                sprite: 'mob_bandit',
                color: '#F44336',
                size: { width: 32, height: 40 },
                animations: {
                    idle: { frames: 4, speed: 300 },
                    walk: { frames: 8, speed: 100 },
                    attack: { frames: 6, speed: 150 },
                    death: { frames: 5, speed: 250 }
                }
            },
            
            ai: {
                behavior: 'ambush',
                detectionRange: 4,
                fleeThreshold: 0.1,
                groupBehavior: 'gang'
            }
        },
        
        boar: {
            id: 'boar',
            name: 'Javali',
            level: 3,
            type: 'beast',
            behavior: 'neutral',
            
            stats: {
                health: 28,
                maxHealth: 28,
                attack: 6,
                defense: 5,
                speed: 12,
                magic: 0,
                critical: 3,
                evasion: 8,
                accuracy: 75
            },
            
            rewards: {
                experience: 10,
                gold: 2,
                loot: [
                    { id: 'boar_meat', name: 'Carne de Javali', chance: 0.4, quantity: 1 },
                    { id: 'boar_tusk', name: 'Presa de Javali', chance: 0.2, quantity: 1 }
                ]
            },
            
            appearance: {
                sprite: 'mob_boar',
                color: '#795548',
                size: { width: 32, height: 24 },
                animations: {
                    idle: { frames: 3, speed: 400 },
                    walk: { frames: 6, speed: 130 },
                    attack: { frames: 4, speed: 200 },
                    death: { frames: 5, speed: 250 }
                }
            },
            
            ai: {
                behavior: 'forage',
                detectionRange: 3,
                fleeThreshold: 0.4,
                groupBehavior: 'solo'
            }
        },
        
        goblin: {
            id: 'goblin',
            name: 'Goblin',
            level: 3,
            type: 'humanoid',
            behavior: 'aggressive',
            
            stats: {
                health: 25,
                maxHealth: 25,
                attack: 4,
                defense: 2,
                speed: 16,
                magic: 3,
                critical: 6,
                evasion: 15,
                accuracy: 80
            },
            
            rewards: {
                experience: 11,
                gold: 3,
                loot: [
                    { id: 'goblin_ear', name: 'Orelha de Goblin', chance: 0.3, quantity: 1 },
                    { id: 'goblin_dagger', name: 'Adaga de Goblin', chance: 0.1, quantity: 1 }
                ]
            },
            
            appearance: {
                sprite: 'mob_goblin',
                color: '#4CAF50',
                size: { width: 28, height: 32 },
                animations: {
                    idle: { frames: 4, speed: 350 },
                    walk: { frames: 6, speed: 120 },
                    attack: { frames: 5, speed: 180 },
                    death: { frames: 4, speed: 250 }
                }
            },
            
            ai: {
                behavior: 'scavenger',
                detectionRange: 4,
                fleeThreshold: 0.3,
                groupBehavior: 'tribe'
            }
        },
        
        rabbit: {
            id: 'rabbit',
            name: 'Coelho',
            level: 1,
            type: 'beast',
            behavior: 'passive',
            
            stats: {
                health: 10,
                maxHealth: 10,
                attack: 1,
                defense: 1,
                speed: 20,
                magic: 0,
                critical: 1,
                evasion: 25,
                accuracy: 60
            },
            
            rewards: {
                experience: 3,
                gold: 1,
                loot: [
                    { id: 'rabbit_foot', name: 'Pé de Coelho', chance: 0.1, quantity: 1 },
                    { id: 'rabbit_meat', name: 'Carne de Coelho', chance: 0.3, quantity: 1 }
                ]
            },
            
            appearance: {
                sprite: 'mob_rabbit',
                color: '#FFC107',
                size: { width: 20, height: 16 },
                animations: {
                    idle: { frames: 2, speed: 300 },
                    walk: { frames: 4, speed: 100 },
                    flee: { frames: 4, speed: 80 },
                    death: { frames: 3, speed: 200 }
                }
            },
            
            ai: {
                behavior: 'flee',
                detectionRange: 4,
                fleeThreshold: 0.8,
                groupBehavior: 'solo'
            }
        },
        
        bear: {
            id: 'bear',
            name: 'Urso',
            level: 5,
            type: 'beast',
            behavior: 'territorial',
            
            stats: {
                health: 50,
                maxHealth: 50,
                attack: 8,
                defense: 6,
                speed: 10,
                magic: 0,
                critical: 4,
                evasion: 8,
                accuracy: 85
            },
            
            rewards: {
                experience: 20,
                gold: 8,
                loot: [
                    { id: 'bear_pelt', name: 'Pele de Urso', chance: 0.3, quantity: 1 },
                    { id: 'bear_claw', name: 'Garra de Urso', chance: 0.2, quantity: 1 }
                ]
            },
            
            appearance: {
                sprite: 'mob_bear',
                color: '#795548',
                size: { width: 40, height: 32 },
                animations: {
                    idle: { frames: 3, speed: 400 },
                    walk: { frames: 6, speed: 150 },
                    attack: { frames: 5, speed: 200 },
                    death: { frames: 6, speed: 250 }
                }
            },
            
            ai: {
                behavior: 'territorial',
                detectionRange: 6,
                fleeThreshold: 0.1,
                groupBehavior: 'solo'
            }
        },
        
        imp: {
            id: 'imp',
            name: 'Imp',
            level: 4,
            type: 'demon',
            behavior: 'mischievous',
            
            stats: {
                health: 30,
                maxHealth: 30,
                attack: 5,
                defense: 3,
                speed: 14,
                magic: 6,
                critical: 8,
                evasion: 18,
                accuracy: 80
            },
            
            rewards: {
                experience: 16,
                gold: 4,
                loot: [
                    { id: 'imp_wing', name: 'Asa de Imp', chance: 0.2, quantity: 1 },
                    { id: 'demon_essence', name: 'Essência Demoníaca', chance: 0.1, quantity: 1 }
                ]
            },
            
            appearance: {
                sprite: 'mob_imp',
                color: '#9C27B0',
                size: { width: 24, height: 28 },
                animations: {
                    idle: { frames: 4, speed: 300 },
                    walk: { frames: 6, speed: 120 },
                    attack: { frames: 5, speed: 180 },
                    cast: { frames: 6, speed: 150 },
                    death: { frames: 5, speed: 250 }
                }
            },
            
            ai: {
                behavior: 'harass',
                detectionRange: 4,
                fleeThreshold: 0.2,
                groupBehavior: 'swarm'
            }
        }
    },
    
    // === CONFIGURAÇÃO DO PRIMEIRO MAPA ===
    starterPlains: {
        id: 'starter_plains',
        name: 'Planícies Iniciais',
        description: 'Uma área pacífica onde novos aventureiros começam sua jornada',
        levelRange: [1, 10],
        biome: 'plains',
        
        // Configuração de spawn
        spawnConfig: {
            // Densidade de mobs por tipo
            mobDensity: {
                rat: { count: 15, spread: 'random' },
                slime: { count: 12, spread: 'random' },
                wolf: { count: 8, spread: 'pack' },
                bandit: { count: 6, spread: 'gang' },
                boar: { count: 10, spread: 'random' },
                goblin: { count: 8, spread: 'tribe' },
                rabbit: { count: 20, spread: 'random' },
                bear: { count: 3, spread: 'territorial' },
                imp: { count: 5, spread: 'swarm' }
            },
            
            // Áreas de spawn específicas
            spawnAreas: [
                {
                    id: 'forest_area',
                    name: 'Área Florestal',
                    bounds: { x: 10, y: 10, width: 15, height: 10 },
                    preferredMobs: ['wolf', 'rabbit', 'bear']
                },
                {
                    id: 'road_area',
                    name: 'Estrada Principal',
                    bounds: { x: 20, y: 20, width: 10, height: 5 },
                    preferredMobs: ['bandit', 'goblin']
                },
                {
                    id: 'swamp_area',
                    name: 'Área Pantanosa',
                    bounds: { x: 5, y: 25, width: 8, height: 8 },
                    preferredMobs: ['slime', 'imp']
                }
            ],
            
            // Configuração de respawn
            respawnConfig: {
                normalMobs: { time: 30000, variance: 10000 }, // 30s ± 10s
                aggressiveMobs: { time: 45000, variance: 15000 }, // 45s ± 15s
                rareMobs: { time: 1800000, variance: 300000 } // 30min ± 5min
            }
        },
        
        // Pontos de interesse
        pointsOfInterest: [
            {
                id: 'starting_village',
                name: 'Aldeia Inicial',
                type: 'village',
                position: { x: 25, y: 25 },
                description: 'Uma pequena aldeia onde começamos nossa jornada'
            },
            {
                id: 'training_grounds',
                name: 'Campo de Treinamento',
                type: 'training',
                position: { x: 30, y: 20 },
                description: 'Área segura para praticar combate'
            },
            {
                id: 'merchant_shop',
                name: 'Loja do Mercador',
                type: 'shop',
                position: { x: 22, y: 28 },
                description: 'Compre e venda itens básicos'
            },
            {
                id: 'quest_board',
                name: 'Quadro de Missões',
                type: 'quest',
                position: { x: 24, y: 24 },
                description: 'Aceite missões para ganhar recompensas'
            }
        ],
        
        // Clima e ambiente
        environment: {
            weather: ['sunny', 'cloudy', 'light_rain'],
            timeOfDay: 'day',
            ambientSounds: ['birds_chirping', 'wind_gentle', 'grass_rustling']
        }
    },
    
    // === CONFIGURAÇÃO DE PROGRESSÃO ===
    progression: {
        // Experiência necessária por nível (inicial)
        experienceTable: {
            1: 0,
            2: 100,
            3: 250,
            4: 450,
            5: 700,
            6: 1000,
            7: 1350,
            8: 1750,
            9: 2200,
            10: 2700
        },
        
        // Recompensas por nível
        levelRewards: {
            2: { skillPoints: 1, statPoints: 2 },
            3: { skillPoints: 1, statPoints: 2, item: 'health_potion' },
            4: { skillPoints: 1, statPoints: 2 },
            5: { skillPoints: 2, statPoints: 3, skill: 'fire_bolt' },
            6: { skillPoints: 1, statPoints: 2 },
            7: { skillPoints: 1, statPoints: 2 },
            8: { skillPoints: 1, statPoints: 2, item: 'mana_potion' },
            9: { skillPoints: 1, statPoints: 2 },
            10: { skillPoints: 2, statPoints: 3, skill: 'shield' }
        },
        
        // Desbloqueio de conteúdo
        contentUnlocks: {
            level2: { areas: ['forest_path'], npcs: ['trainer'] },
            level3: { areas: ['river_bank'], npcs: ['merchant'] },
            level5: { areas: ['bandit_camp'], npcs: ['quest_giver'] },
            level10: { areas: ['next_region'], npcs: ['class_trainer'] }
        }
    },
    
    // === CONFIGURAÇÃO DE INTERFACE ===
    ui: {
        // Elementos do HUD
        hudElements: [
            'health_bar',
            'mana_bar',
            'experience_bar',
            'level_display',
            'gold_display',
            'minimap',
            'skill_bar',
            'inventory',
            'chat',
            'quest_tracker'
        ],
        
        // Controles
        controls: {
            movement: ['W', 'A', 'S', 'D'],
            attack: ['Mouse1', 'Space'],
            skills: ['1', '2', '3', '4', '5'],
            inventory: ['I', 'E'],
            map: ['M'],
            chat: ['Enter', 'T']
        },
        
        // Configurações visuais
        graphics: {
            resolution: { width: 1024, height: 768 },
            fullscreen: false,
            vsync: true,
            particles: true,
            shadows: false,
            antiAliasing: true
        }
    },
    
    // === CONFIGURAÇÃO DE SOM ===
    audio: {
        masterVolume: 0.8,
        musicVolume: 0.6,
        sfxVolume: 0.8,
        voiceVolume: 0.7,
        
        // Músicas de fundo
        backgroundMusic: {
            peaceful: 'starter_plains_ambient.mp3',
            combat: 'combat_theme.mp3',
            victory: 'victory_fanfare.mp3',
            defeat: 'defeat_theme.mp3'
        },
        
        // Efeitos sonoros
        soundEffects: {
            footstep: ['footstep_grass_1.wav', 'footstep_grass_2.wav'],
            attack: ['sword_swing_1.wav', 'magic_cast_1.wav'],
            hit: ['hit_flesh_1.wav', 'hit_armor_1.wav'],
            death: ['death_mob_1.wav', 'death_player_1.wav'],
            levelup: 'levelup_fanfare.wav',
            itempickup: 'item_pickup.wav'
        }
    },
    
    // === CONFIGURAÇÃO DE DEBUG ===
    debug: {
        enabled: false,
        showCoordinates: false,
        showFPS: false,
        showMobInfo: false,
        godMode: false,
        unlimitedMana: false,
        instantKill: false,
        spawnTestMobs: false
    }
};

module.exports = InitialGameConfig;
