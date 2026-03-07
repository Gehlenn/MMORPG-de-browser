/**
 * Boss AI System - Advanced Boss Behaviors and Phase Management
 * Implements complex boss mechanics, multi-phase fights, and special abilities
 * Version 0.3 - Complete Architecture Integration
 */

class BossAI {
    constructor(worldManager, combatSystem, aggroSystem, monsterAI) {
        this.worldManager = worldManager;
        this.combatSystem = combatSystem;
        this.aggroSystem = aggroSystem;
        this.monsterAI = monsterAI;
        
        // Boss configuration
        this.config = {
            phaseTransitionThreshold: 0.75, // 75% health for phase 1, 50% for phase 2, 25% for phase 3
            enrageThreshold: 0.1, // 10% health for enrage
            abilityCooldown: 15000, // 15 seconds between special abilities
            summonCooldown: 30000, // 30 seconds between summons
            phaseTransitionDuration: 3000, // 3 seconds for phase transition
            
            // Difficulty modifiers
            difficultyMultipliers: {
                normal: { damage: 1.0, health: 1.0, abilityFrequency: 1.0 },
                hard: { damage: 1.5, health: 1.5, abilityFrequency: 1.3 },
                mythic: { damage: 2.0, health: 2.0, abilityFrequency: 1.6 },
                legendary: { damage: 3.0, health: 3.0, abilityFrequency: 2.0 }
            },
            
            // Environmental mechanics
            arenaRadius: 150,
            addSpawnRadius: 80,
            mechanicWarningTime: 5000, // 5 seconds warning before mechanics
            
            // Player targeting
            tankPriority: 2.0, // Tanks get 2x threat priority
            healerPriority: 1.5, // Healers get 1.5x threat priority
            rangedPriority: 1.2, // Ranged get 1.2x threat priority
        };
        
        // Boss states
        this.bossStates = new Map(); // bossId -> Boss state
        this.phaseDefinitions = new Map(); // bossType -> Phase definitions
        this.abilityDefinitions = new Map(); // bossType -> Ability definitions
        this.mechanicDefinitions = new Map(); // bossType -> Mechanic definitions
        
        // Active mechanics
        this.activeMechanics = new Map(); // bossId -> Active mechanics
        this.mechanicTimers = new Map(); // bossId -> Mechanic timers
        this.arenaStates = new Map(); // bossId -> Arena state
        
        // Boss statistics
        this.bossStats = {
            totalBossFights: 0,
            totalPhaseTransitions: 0,
            totalMechanicsTriggered: 0,
            totalPlayerDeaths: 0,
            averageFightDuration: 0,
            successRate: 0,
            mostChallengingBoss: null,
            fastestKill: Infinity,
            longestFight: 0
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Initialize boss definitions
        this.initializeBossDefinitions();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start boss update loop
        this.startBossLoop();
        
        console.log('Boss AI System initialized');
    }
    
    initializeBossDefinitions() {
        // Dragon Whelp Boss
        this.phaseDefinitions.set('dragon_whelp', {
            name: 'Filhote de Dragão',
            maxPhases: 3,
            phases: [
                {
                    phase: 1,
                    healthRange: [0.75, 1.0],
                    abilities: ['basic_attack', 'fire_breath', 'tail_swipe'],
                    mechanics: ['fire_pool'],
                    addSpawns: [],
                    environmentChanges: [],
                    duration: null
                },
                {
                    phase: 1,
                    healthRange: [0.5, 0.75],
                    abilities: ['basic_attack', 'fire_breath', 'wing_attack', 'cleave'],
                    mechanics: ['fire_pool', 'fire_orbs'],
                    addSpawns: ['dragonling'],
                    environmentChanges: ['lava_rise'],
                    duration: null
                },
                {
                    phase: 2,
                    healthRange: [0.25, 0.5],
                    abilities: ['enraged_attack', 'fire_breath', 'wing_attack', 'meteor_strike'],
                    mechanics: ['fire_pool', 'fire_orbs', 'inferno'],
                    addSpawns: ['dragonling', 'fire_elemental'],
                    environmentChanges: ['lava_rise', 'fire_storm'],
                    duration: null
                },
                {
                    phase: 3,
                    healthRange: [0, 0.25],
                    abilities: ['ultimate_attack', 'meteor_strike', 'inferno'],
                    mechanics: ['fire_pool', 'fire_orbs', 'inferno', 'final_stand'],
                    addSpawns: ['dragonling', 'fire_elemental', 'fire_spirit'],
                    environmentChanges: ['lava_rise', 'fire_storm', 'volcanic_eruption'],
                    duration: null
                }
            ]
        });
        
        this.abilityDefinitions.set('dragon_whelp', {
            basic_attack: {
                name: 'Arranhão',
                type: 'attack',
                damage: 1.0,
                range: 10,
                cooldown: 2000,
                castTime: 0,
                warning: false,
                effects: []
            },
            fire_breath: {
                name: 'Sopro de Fogo',
                type: 'spell',
                damage: 2.0,
                range: 60,
                cooldown: 8000,
                castTime: 2000,
                warning: true,
                warningTime: 3000,
                effects: ['burn_dot'],
                aoe: true,
                aoeAngle: 45,
                aoeRange: 80
            },
            tail_swipe: {
                name: 'Golpe de Cauda',
                type: 'attack',
                damage: 1.5,
                range: 30,
                cooldown: 6000,
                castTime: 1000,
                warning: true,
                warningTime: 2000,
                effects: ['knockback'],
                aoe: true,
                aoeAngle: 180,
                aoeRange: 40
            },
            wing_attack: {
                name: 'Ataque de Asas',
                type: 'attack',
                damage: 1.3,
                range: 50,
                cooldown: 10000,
                castTime: 1500,
                warning: true,
                warningTime: 2500,
                effects: ['wind_push'],
                aoe: true,
                aoeRadius: 60
            },
            cleave: {
                name: 'Golpe Amplo',
                type: 'attack',
                damage: 1.8,
                range: 15,
                cooldown: 12000,
                castTime: 2000,
                warning: true,
                warningTime: 3000,
                effects: ['bleed'],
                aoe: true,
                aoeAngle: 120,
                aoeRange: 25
            },
            enraged_attack: {
                name: 'Ataque Enfurecido',
                type: 'attack',
                damage: 2.5,
                range: 12,
                cooldown: 3000,
                castTime: 0,
                warning: false,
                effects: ['enrage_self']
            },
            meteor_strike: {
                name: 'Impacto de Meteoro',
                type: 'spell',
                damage: 3.0,
                range: 100,
                cooldown: 20000,
                castTime: 4000,
                warning: true,
                warningTime: 6000,
                effects: ['burn_dot', 'stun'],
                aoe: true,
                aoeRadius: 20,
                groundTarget: true
            },
            ultimate_attack: {
                name: 'Ataque Supremo',
                type: 'spell',
                damage: 5.0,
                range: 150,
                cooldown: 45000,
                castTime: 5000,
                warning: true,
                warningTime: 8000,
                effects: ['massive_damage', 'burn_dot'],
                aoe: true,
                aoeRadius: 100,
                channel: true,
                channelTime: 3000
            },
            inferno: {
                name: 'Inferno',
                type: 'spell',
                damage: 1.5,
                range: 0,
                cooldown: 25000,
                castTime: 3000,
                warning: true,
                warningTime: 5000,
                effects: ['burn_dot'],
                aoe: true,
                aoeRadius: 150,
                duration: 10000,
                persistent: true
            }
        });
        
        this.mechanicDefinitions.set('dragon_whelp', {
            fire_pool: {
                name: 'Piscina de Fogo',
                type: 'ground_effect',
                damage: 0.5,
                duration: 15000,
                radius: 15,
                warning: true,
                warningTime: 2000,
                effects: ['burn_dot'],
                spawnCount: 3,
                spawnPattern: 'random'
            },
            fire_orbs: {
                name: 'Orbes de Fogo',
                type: 'projectile',
                damage: 1.0,
                speed: 20,
                duration: 8000,
                count: 6,
                warning: true,
                warningTime: 3000,
                effects: ['burn_dot'],
                pattern: 'spiral'
            },
            lava_rise: {
                name: 'Ascensão de Lava',
                type: 'environment',
                damage: 2.0,
                duration: 20000,
                warning: true,
                warningTime: 5000,
                effects: ['slow', 'burn_dot'],
                area: 'arena_edges'
            },
            fire_storm: {
                name: 'Tempestade de Fogo',
                type: 'environment',
                damage: 1.0,
                duration: 30000,
                warning: true,
                warningTime: 7000,
                effects: ['burn_dot', 'reduced_visibility'],
                area: 'entire_arena',
                interval: 2000
            },
            volcanic_eruption: {
                name: 'Erupção Vulcânica',
                type: 'environment',
                damage: 3.0,
                duration: 15000,
                warning: true,
                warningTime: 8000,
                effects: ['massive_damage', 'burn_dot', 'knockback'],
                area: 'random_zones',
                zoneCount: 5
            },
            final_stand: {
                name: 'Posição Final',
                type: 'buff',
                damage: 0,
                duration: 30000,
                warning: true,
                warningTime: 5000,
                effects: ['damage_boost', 'speed_boost', 'immunity'],
                target: 'self'
            }
        });
        
        // Demon Lord Boss
        this.phaseDefinitions.set('demon_lord', {
            name: 'Lorde Demônio',
            maxPhases: 3,
            phases: [
                {
                    phase: 1,
                    healthRange: [0.66, 1.0],
                    abilities: ['basic_attack', 'shadow_bolt', 'curse'],
                    mechanics: ['shadow_pools'],
                    addSpawns: ['imp'],
                    environmentChanges: [],
                    duration: null
                },
                {
                    phase: 1,
                    healthRange: [0.33, 0.66],
                    abilities: ['basic_attack', 'shadow_bolt', 'life_drain', 'shadow_clones'],
                    mechanics: ['shadow_pools', 'soul_link'],
                    addSpawns: ['imp', 'shadow_beast'],
                    environmentChanges: ['darkness_falls'],
                    duration: null
                },
                {
                    phase: 2,
                    healthRange: [0, 0.33],
                    abilities: ['enraged_attack', 'life_drain', 'shadow_clones', 'demonic_pact'],
                    mechanics: ['shadow_pools', 'soul_link', 'hellfire'],
                    addSpawns: ['imp', 'shadow_beast', 'demon_guardian'],
                    environmentChanges: ['darkness_falls', 'nether_portal'],
                    duration: null
                },
                {
                    phase: 3,
                    healthRange: [0, 0.1],
                    abilities: ['ultimate_attack', 'demonic_pact', 'hellfire'],
                    mechanics: ['shadow_pools', 'soul_link', 'hellfire', 'final_desperation'],
                    addSpawns: ['imp', 'shadow_beast', 'demon_guardian', 'demon_lord_spirit'],
                    environmentChanges: ['darkness_falls', 'nether_portal', 'realm_tear'],
                    duration: null
                }
            ]
        });
        
        // Add demon lord abilities and mechanics (simplified for brevity)
        this.abilityDefinitions.set('demon_lord', {
            basic_attack: {
                name: 'Golpe Sombrio',
                type: 'attack',
                damage: 1.2,
                range: 12,
                cooldown: 2000,
                castTime: 0,
                warning: false,
                effects: ['shadow_corruption']
            },
            shadow_bolt: {
                name: 'Raio Sombrio',
                type: 'spell',
                damage: 1.8,
                range: 80,
                cooldown: 6000,
                castTime: 2000,
                warning: true,
                warningTime: 3000,
                effects: ['shadow_corruption', 'silence']
            },
            curse: {
                name: 'Maldição',
                type: 'spell',
                damage: 0,
                range: 60,
                cooldown: 15000,
                castTime: 2500,
                warning: true,
                warningTime: 4000,
                effects: ['curse_debuff', 'damage_taken_increase'],
                duration: 20000
            },
            life_drain: {
                name: 'Drenagem de Vida',
                type: 'spell',
                damage: 1.5,
                range: 30,
                cooldown: 12000,
                castTime: 3000,
                warning: true,
                warningTime: 4000,
                effects: ['life_drain', 'heal_self'],
                channel: true,
                channelTime: 5000
            },
            shadow_clones: {
                name: 'Clones Sombrios',
                type: 'spell',
                damage: 0,
                range: 0,
                cooldown: 30000,
                castTime: 4000,
                warning: true,
                warningTime: 6000,
                effects: ['summon_clones'],
                cloneCount: 3
            },
            demonic_pact: {
                name: 'Pacto Demoníaco',
                type: 'spell',
                damage: 2.5,
                range: 100,
                cooldown: 25000,
                castTime: 5000,
                warning: true,
                warningTime: 7000,
                effects: ['massive_damage', 'curse_debuff', 'fear'],
                aoe: true,
                aoeRadius: 80
            },
            ultimate_attack: {
                name: 'Apocalipse Sombrio',
                type: 'spell',
                damage: 6.0,
                range: 150,
                cooldown: 60000,
                castTime: 6000,
                warning: true,
                warningTime: 10000,
                effects: ['massive_damage', 'shadow_corruption', 'fear', 'silence'],
                aoe: true,
                aoeRadius: 120,
                channel: true,
                channelTime: 4000
            },
            hellfire: {
                name: 'Fogo Infernal',
                type: 'spell',
                damage: 2.0,
                range: 0,
                cooldown: 20000,
                castTime: 3000,
                warning: true,
                warningTime: 5000,
                effects: ['burn_dot', 'curse_debuff'],
                aoe: true,
                aoeRadius: 100,
                duration: 15000,
                persistent: true
            },
            enraged_attack: {
                name: 'Fúria Demoníaca',
                type: 'attack',
                damage: 3.0,
                range: 15,
                cooldown: 2500,
                castTime: 0,
                warning: false,
                effects: ['enrage_self', 'damage_boost']
            }
        });
        
        this.mechanicDefinitions.set('demon_lord', {
            shadow_pools: {
                name: 'Piscinas Sombrias',
                type: 'ground_effect',
                damage: 0.8,
                duration: 20000,
                radius: 20,
                warning: true,
                warningTime: 3000,
                effects: ['shadow_corruption', 'slow'],
                spawnCount: 4,
                spawnPattern: 'cross'
            },
            soul_link: {
                name: 'Vínculo Almático',
                type: 'link',
                damage: 0,
                duration: 25000,
                warning: true,
                warningTime: 4000,
                effects: ['damage_sharing', 'heal_sharing'],
                targets: ['self', 'adds']
            },
            darkness_falls: {
                name: 'Escuridão Caindo',
                type: 'environment',
                damage: 0.5,
                duration: 30000,
                warning: true,
                warningTime: 6000,
                effects: ['reduced_visibility', 'fear'],
                area: 'entire_arena'
            },
            nether_portal: {
                name: 'Portal do Nether',
                type: 'portal',
                damage: 1.5,
                duration: 20000,
                warning: true,
                warningTime: 7000,
                effects: ['spawn_adds', 'shadow_damage'],
                portalCount: 2,
                spawnInterval: 5000
            },
            realm_tear: {
                name: 'Rasgo do Realm',
                type: 'environment',
                damage: 4.0,
                duration: 10000,
                warning: true,
                warningTime: 8000,
                effects: ['massive_damage', 'reality_warp'],
                area: 'center_arena',
                radius: 50
            },
            final_desperation: {
                name: 'Desespero Final',
                type: 'buff',
                damage: 0,
                duration: 20000,
                warning: true,
                warningTime: 5000,
                effects: ['immunity', 'damage_boost', 'speed_boost', 'regeneration'],
                target: 'self'
            }
        });
    }
    
    setupEventListeners() {
        // Listen to combat events
        this.combatSystem.on('combat_start', (combatId, participants) => {
            this.onCombatStart(combatId, participants);
        });
        
        this.combatSystem.on('combat_end', (combatId, winner) => {
            this.onCombatEnd(combatId, winner);
        });
        
        this.combatSystem.on('damage_dealt', (attackerId, targetId, damage, damageType) => {
            this.onDamageDealt(attackerId, targetId, damage, damageType);
        });
        
        // Listen to monster death
        this.worldManager.on('monster_death', (monsterId, killerId) => {
            this.onMonsterDeath(monsterId, killerId);
        });
        
        // Listen to player death
        this.worldManager.on('player_death', (playerId, killerId) => {
            this.onPlayerDeath(playerId, killerId);
        });
    }
    
    startBossLoop() {
        setInterval(() => {
            this.updateAllBosses();
        }, 500); // Update every 500ms for precise boss mechanics
    }
    
    // Main boss update
    updateAllBosses() {
        for (const [regionId, region] of this.worldManager.regions) {
            for (const [monsterId, monster] of region.monsters) {
                if (monster.isDead || !monster.isBoss) continue;
                
                this.updateBossAI(monsterId, monster);
            }
        }
    }
    
    updateBossAI(bossId, boss) {
        // Get or create boss state
        let bossState = this.bossStates.get(bossId);
        if (!bossState) {
            bossState = this.createBossState(bossId, boss);
            this.bossStates.set(bossId, bossState);
        }
        
        // Update boss context
        const context = this.updateBossContext(bossId, boss, bossState);
        
        // Check for phase transition
        this.checkPhaseTransition(bossId, boss, bossState, context);
        
        // Execute current phase behavior
        this.executePhaseBehavior(bossId, boss, bossState, context);
        
        // Update mechanics
        this.updateBossMechanics(bossId, boss, bossState, context);
        
        // Update arena state
        this.updateArenaState(bossId, boss, bossState, context);
        
        // Update boss state
        bossState.lastUpdate = Date.now();
        bossState.context = context;
    }
    
    createBossState(bossId, boss) {
        return {
            bossId: bossId,
            bossType: boss.bossType || boss.type,
            currentPhase: 1,
            phaseStartTime: Date.now(),
            lastPhaseTransition: 0,
            
            // Ability tracking
            abilityCooldowns: new Map(),
            lastAbilityUse: new Map(),
            abilityHistory: [],
            
            // Mechanic tracking
            activeMechanics: new Map(),
            mechanicHistory: [],
            mechanicTimers: new Map(),
            
            // Arena state
            arenaCenter: { x: boss.x, y: boss.y },
            arenaRadius: this.config.arenaRadius,
            environmentalEffects: new Map(),
            
            // Add management
            spawnedAdds: new Set(),
            maxAdds: 10,
            addSpawnTimer: 0,
            
            // Targeting
            priorityTargets: new Map(),
            lastTargetSwitch: 0,
            
            // Enrage state
            isEnraged: false,
            enrageTime: 0,
            
            // Statistics
            damageTaken: 0,
            damageDealt: 0,
            abilitiesUsed: 0,
            mechanicsTriggered: 0,
            addsKilled: 0,
            
            // Fight tracking
            fightStartTime: Date.now(),
            phaseTransitionCount: 0,
            playerDeaths: 0,
            
            lastUpdate: Date.now()
        };
    }
    
    updateBossContext(bossId, boss, bossState) {
        const context = {
            bossId: bossId,
            boss: boss,
            bossState: bossState,
            
            // Combat status
            inCombat: boss.combatId !== null,
            healthPercent: boss.currentHealth / boss.maxHealth,
            manaPercent: (boss.currentMana || 0) / (boss.maxMana || 100),
            
            // Phase information
            currentPhase: bossState.currentPhase,
            phaseTime: Date.now() - bossState.phaseStartTime,
            timeInPhase: Date.now() - bossState.phaseStartTime,
            
            // Environment
            nearbyPlayers: this.getNearbyPlayers(bossId, this.config.arenaRadius),
            nearbyAdds: this.getNearbyAdds(bossId, this.config.arenaRadius),
            arenaState: bossState.arenaState,
            
            // Timing
            currentTime: Date.now(),
            timeSinceLastAbility: (abilityId) => {
                const lastUse = bossState.lastAbilityUse.get(abilityId) || 0;
                return Date.now() - lastUse;
            },
            
            // Cooldowns
            canUseAbility: (abilityId) => {
                const cooldown = bossState.abilityCooldowns.get(abilityId) || 0;
                return Date.now() >= cooldown;
            },
            
            // Targeting
            getPriorityTarget: () => this.getPriorityTarget(bossId, bossState),
            
            // Mechanics
            activeMechanics: Array.from(bossState.activeMechanics.values()),
            
            // Arena
            isPlayerInArena: (playerId) => this.isPlayerInArena(bossId, playerId),
            getPlayersInMechanic: (mechanicId) => this.getPlayersInMechanic(bossId, mechanicId)
        };
        
        return context;
    }
    
    checkPhaseTransition(bossId, boss, bossState, context) {
        const phaseDef = this.getPhaseDefinition(bossState.bossType);
        if (!phaseDef) return;
        
        // Find appropriate phase based on health
        let targetPhase = bossState.currentPhase;
        
        for (const phase of phaseDef.phases) {
            if (context.healthPercent <= phase.healthRange[1] && 
                context.healthPercent > phase.healthRange[0]) {
                targetPhase = phase.phase;
                break;
            }
        }
        
        // Check for enrage
        if (context.healthPercent <= this.config.enrageThreshold && !bossState.isEnraged) {
            this.triggerEnrage(bossId, boss, bossState, context);
        }
        
        // Transition to new phase if needed
        if (targetPhase !== bossState.currentPhase) {
            this.transitionToPhase(bossId, boss, bossState, targetPhase, context);
        }
    }
    
    transitionToPhase(bossId, boss, bossState, newPhase, context) {
        const oldPhase = bossState.currentPhase;
        
        // Start phase transition
        bossState.isTransitioning = true;
        bossState.transitionStartTime = Date.now();
        
        // Notify phase transition start
        this.notifyPhaseTransitionStart(bossId, oldPhase, newPhase);
        
        // Execute phase transition effects
        this.executePhaseTransitionEffects(bossId, boss, bossState, oldPhase, newPhase, context);
        
        // Wait for transition duration
        setTimeout(() => {
            // Complete transition
            bossState.currentPhase = newPhase;
            bossState.phaseStartTime = Date.now();
            bossState.lastPhaseTransition = Date.now();
            bossState.isTransitioning = false;
            bossState.phaseTransitionCount++;
            
            // Clear some cooldowns for new phase
            this.clearPhaseCooldowns(bossState);
            
            // Notify phase transition complete
            this.notifyPhaseTransitionComplete(bossId, newPhase);
            
            // Update statistics
            this.bossStats.totalPhaseTransitions++;
            
        }, this.config.phaseTransitionDuration);
    }
    
    executePhaseTransitionEffects(bossId, boss, bossState, oldPhase, newPhase, context) {
        const phaseDef = this.getPhaseDefinition(bossState.bossType);
        if (!phaseDef) return;
        
        const oldPhaseDef = phaseDef.phases.find(p => p.phase === oldPhase);
        const newPhaseDef = phaseDef.phases.find(p => p.phase === newPhase);
        
        if (!oldPhaseDef || !newPhaseDef) return;
        
        // Remove old phase effects
        for (const mechanic of oldPhaseDef.mechanics) {
            this.removeMechanic(bossId, mechanic);
        }
        
        // Apply new phase effects
        for (const mechanic of newPhaseDef.mechanics) {
            this.scheduleMechanic(bossId, mechanic, 2000); // Start after 2 seconds
        }
        
        // Apply environment changes
        for (const envChange of newPhaseDef.environmentChanges) {
            this.applyEnvironmentChange(bossId, envChange, context);
        }
        
        // Spawn adds for new phase
        for (const addType of newPhaseDef.addSpawns) {
            this.scheduleAddSpawn(bossId, addType, 5000); // Spawn adds after 5 seconds
        }
        
        // Heal/restore boss for new phase (optional)
        if (newPhaseDef.phaseRestore) {
            const healAmount = boss.maxHealth * newPhaseDef.phaseRestore;
            boss.currentHealth = Math.min(boss.maxHealth, boss.currentHealth + healAmount);
        }
    }
    
    executePhaseBehavior(bossId, boss, bossState, context) {
        if (bossState.isTransitioning) return;
        
        const phaseDef = this.getCurrentPhaseDefinition(bossState.bossType, context.currentPhase);
        if (!phaseDef) return;
        
        // Execute abilities
        this.executePhaseAbilities(bossId, boss, bossState, phaseDef, context);
        
        // Execute add spawns
        this.executePhaseAddSpawns(bossId, boss, bossState, phaseDef, context);
        
        // Update targeting
        this.updateBossTargeting(bossId, boss, bossState, context);
    }
    
    executePhaseAbilities(bossId, boss, bossState, phaseDef, context) {
        const abilities = phaseDef.abilities;
        if (abilities.length === 0) return;
        
        // Select ability to use
        const ability = this.selectAbility(bossId, abilities, context);
        if (!ability) return;
        
        // Check if can use ability
        if (!context.canUseAbility(ability)) return;
        
        // Execute ability
        this.executeBossAbility(bossId, ability, context);
        
        // Set cooldown
        const abilityDef = this.getAbilityDefinition(bossState.bossType, ability);
        if (abilityDef) {
            const cooldown = abilityDef.cooldown || this.config.abilityCooldown;
            bossState.abilityCooldowns.set(ability, Date.now() + cooldown);
            bossState.lastAbilityUse.set(ability, Date.now());
        }
        
        // Update statistics
        bossState.abilitiesUsed++;
    }
    
    selectAbility(bossId, availableAbilities, context) {
        // Weighted random selection based on situation
        const weights = new Map();
        
        for (const ability of availableAbilities) {
            let weight = 1.0;
            
            // Check if ability is on cooldown
            if (!context.canUseAbility(ability)) {
                weight = 0;
                continue;
            }
            
            // Adjust weight based on situation
            weight *= this.getAbilityWeight(ability, context);
            
            weights.set(ability, weight);
        }
        
        // Select weighted random ability
        const totalWeight = Array.from(weights.values()).reduce((sum, w) => sum + w, 0);
        if (totalWeight === 0) return null;
        
        let random = Math.random() * totalWeight;
        for (const [ability, weight] of weights) {
            random -= weight;
            if (random <= 0) {
                return ability;
            }
        }
        
        return availableAbilities[0]; // Fallback
    }
    
    getAbilityWeight(ability, context) {
        let weight = 1.0;
        
        // Adjust weight based on health
        if (context.healthPercent < 0.3) {
            // Low health - prefer defensive/ultimate abilities
            if (ability.includes('ultimate') || ability.includes('enraged')) {
                weight *= 2.0;
            } else if (ability.includes('basic_attack')) {
                weight *= 0.5;
            }
        }
        
        // Adjust weight based on number of players
        const playerCount = context.nearbyPlayers.length;
        if (playerCount > 4) {
            // Many players - prefer AOE abilities
            const abilityDef = this.getAbilityDefinition(context.bossState.bossType, ability);
            if (abilityDef && abilityDef.aoe) {
                weight *= 1.5;
            }
        }
        
        // Adjust weight based on phase time
        const phaseTimePercent = context.timeInPhase / 60000; // Percentage of minute in phase
        if (phaseTimePercent > 0.8) {
            // Near end of phase - prefer special abilities
            if (ability !== 'basic_attack') {
                weight *= 1.3;
            }
        }
        
        return weight;
    }
    
    executeBossAbility(bossId, abilityId, context) {
        const abilityDef = this.getAbilityDefinition(context.bossState.bossType, abilityId);
        if (!abilityDef) return;
        
        // Show warning if needed
        if (abilityDef.warning) {
            this.showAbilityWarning(bossId, abilityDef, context);
        }
        
        // Wait for cast time
        setTimeout(() => {
            // Execute the ability
            switch (abilityDef.type) {
                case 'attack':
                    this.executeAttackAbility(bossId, abilityDef, context);
                    break;
                case 'spell':
                    this.executeSpellAbility(bossId, abilityDef, context);
                    break;
                default:
                    console.warn(`Unknown ability type: ${abilityDef.type}`);
            }
            
            // Apply effects
            this.applyAbilityEffects(bossId, abilityDef, context);
            
        }, abilityDef.castTime || 0);
    }
    
    executeAttackAbility(bossId, abilityDef, context) {
        if (!context.boss.target) return;
        
        const target = this.getEntity(context.boss.target);
        if (!target) return;
        
        // Calculate damage
        const baseDamage = context.boss.attack || 50;
        let damage = baseDamage * (abilityDef.damage || 1.0);
        
        // Apply difficulty multiplier
        const difficulty = this.getBossDifficulty(bossId);
        const diffMultiplier = this.config.difficultyMultipliers[difficulty] || this.config.difficultyMultipliers.normal;
        damage *= diffMultiplier.damage;
        
        // Apply damage through combat system
        if (context.boss.combatId) {
            this.combatSystem.performAction(context.boss.combatId, bossId, {
                type: 'attack',
                targetId: context.boss.target,
                skill: abilityId,
                damage: Math.floor(damage)
            });
        }
        
        // Handle AOE
        if (abilityDef.aoe) {
            this.executeAOEAttack(bossId, abilityDef, context);
        }
    }
    
    executeSpellAbility(bossId, abilityDef, context) {
        // Handle different spell types
        if (abilityDef.groundTarget) {
            // Ground-targeted spell
            const targetPos = this.selectGroundTarget(bossId, abilityDef, context);
            if (targetPos) {
                this.executeGroundSpell(bossId, abilityDef, targetPos, context);
            }
        } else if (abilityDef.channel) {
            // Channeled spell
            this.executeChanneledSpell(bossId, abilityDef, context);
        } else {
            // Regular spell
            this.executeRegularSpell(bossId, abilityDef, context);
        }
    }
    
    executeAOEAttack(bossId, abilityDef, context) {
        const targets = this.getTargetsInAOE(bossId, abilityDef, context);
        
        for (const target of targets) {
            const damage = this.calculateAOEDamage(abilityDef, context);
            
            if (context.boss.combatId) {
                this.combatSystem.performAction(context.boss.combatId, bossId, {
                    type: 'attack',
                    targetId: target.id,
                    skill: abilityId,
                    damage: Math.floor(damage)
                });
            }
        }
    }
    
    executeGroundSpell(bossId, abilityDef, targetPos, context) {
        // Create ground effect at target position
        const mechanicId = `${abilityId}_${Date.now()}`;
        
        this.createGroundEffect(bossId, mechanicId, {
            type: 'ground_spell',
            abilityId: abilityId,
            position: targetPos,
            radius: abilityDef.aoeRadius || 20,
            duration: abilityDef.duration || 10000,
            damage: abilityDef.damage || 1.0,
            effects: abilityDef.effects || []
        });
        
        // Notify players
        this.notifyGroundSpell(bossId, abilityDef, targetPos, context);
    }
    
    executeChanneledSpell(bossId, abilityDef, context) {
        // Start channeling
        const channelId = `${abilityId}_${Date.now()}`;
        
        this.createChannelEffect(bossId, channelId, {
            type: 'channel',
            abilityId: abilityId,
            duration: abilityDef.channelTime || 3000,
            target: context.boss.target,
            effects: abilityDef.effects || []
        });
        
        // Apply channel effects
        setTimeout(() => {
            this.completeChannel(bossId, channelId, abilityDef, context);
        }, abilityDef.channelTime || 3000);
    }
    
    executeRegularSpell(bossId, abilityDef, context) {
        if (!context.boss.target) return;
        
        // Apply spell effects to target
        this.applySpellEffects(bossId, context.boss.target, abilityDef, context);
        
        // Handle AOE
        if (abilityDef.aoe) {
            this.executeAOESpell(bossId, abilityDef, context);
        }
    }
    
    // Mechanics management
    updateBossMechanics(bossId, boss, bossState, context) {
        const phaseDef = this.getCurrentPhaseDefinition(bossState.bossType, context.currentPhase);
        if (!phaseDef) return;
        
        // Update active mechanics
        for (const [mechanicId, mechanic] of bossState.activeMechanics) {
            this.updateMechanic(bossId, mechanicId, mechanic, context);
        }
        
        // Check for new mechanics to trigger
        this.checkMechanicTriggers(bossId, phaseDef, context);
    }
    
    checkMechanicTriggers(bossId, phaseDef, context) {
        const mechanics = phaseDef.mechanics;
        
        for (const mechanicType of mechanics) {
            // Check if mechanic should be triggered
            if (this.shouldTriggerMechanic(bossId, mechanicType, context)) {
                this.triggerMechanic(bossId, mechanicType, context);
            }
        }
    }
    
    shouldTriggerMechanic(bossId, mechanicType, context) {
        const bossState = this.bossStates.get(bossId);
        
        // Check if mechanic is already active
        if (bossState.activeMechanics.has(mechanicType)) {
            return false;
        }
        
        // Check cooldown
        const lastTrigger = bossState.mechanicTimers.get(mechanicType) || 0;
        const cooldown = this.getMechanicCooldown(mechanicType);
        if (Date.now() - lastTrigger < cooldown) {
            return false;
        }
        
        // Check trigger conditions
        return this.checkMechanicConditions(bossId, mechanicType, context);
    }
    
    checkMechanicConditions(bossId, mechanicType, context) {
        const mechanicDef = this.getMechanicDefinition(context.bossState.bossType, mechanicType);
        if (!mechanicDef) return false;
        
        // Check time-based conditions
        const phaseTime = context.timeInPhase;
        if (mechanicDef.minPhaseTime && phaseTime < mechanicDef.minPhaseTime) {
            return false;
        }
        
        // Check player count conditions
        const playerCount = context.nearbyPlayers.length;
        if (mechanicDef.minPlayers && playerCount < mechanicDef.minPlayers) {
            return false;
        }
        
        // Check health conditions
        if (mechanicDef.healthThreshold && context.healthPercent > mechanicDef.healthThreshold) {
            return false;
        }
        
        // Random chance
        if (mechanicDef.chance && Math.random() > mechanicDef.chance) {
            return false;
        }
        
        return true;
    }
    
    triggerMechanic(bossId, mechanicType, context) {
        const mechanicDef = this.getMechanicDefinition(context.bossState.bossType, mechanicType);
        if (!mechanicDef) return;
        
        // Show warning
        if (mechanicDef.warning) {
            this.showMechanicWarning(bossId, mechanicDef, context);
        }
        
        // Wait for warning time
        setTimeout(() => {
            // Execute mechanic
            this.executeMechanic(bossId, mechanicType, mechanicDef, context);
            
            // Update statistics
            const bossState = this.bossStates.get(bossId);
            if (bossState) {
                bossState.mechanicsTriggered++;
                bossState.mechanicTimers.set(mechanicType, Date.now());
            }
            
            this.bossStats.totalMechanicsTriggered++;
            
        }, mechanicDef.warningTime || 0);
    }
    
    executeMechanic(bossId, mechanicType, mechanicDef, context) {
        switch (mechanicDef.type) {
            case 'ground_effect':
                this.executeGroundEffectMechanic(bossId, mechanicType, mechanicDef, context);
                break;
            case 'projectile':
                this.executeProjectileMechanic(bossId, mechanicType, mechanicDef, context);
                break;
            case 'environment':
                this.executeEnvironmentMechanic(bossId, mechanicType, mechanicDef, context);
                break;
            case 'portal':
                this.executePortalMechanic(bossId, mechanicType, mechanicDef, context);
                break;
            case 'link':
                this.executeLinkMechanic(bossId, mechanicType, mechanicDef, context);
                break;
            case 'buff':
                this.executeBuffMechanic(bossId, mechanicType, mechanicDef, context);
                break;
            default:
                console.warn(`Unknown mechanic type: ${mechanicDef.type}`);
        }
    }
    
    executeGroundEffectMechanic(bossId, mechanicType, mechanicDef, context) {
        const spawnPositions = this.getMechanicSpawnPositions(bossId, mechanicDef, context);
        
        for (const pos of spawnPositions) {
            const effectId = `${mechanicType}_${Date.now()}_${Math.random()}`;
            
            this.createGroundEffect(bossId, effectId, {
                type: mechanicType,
                position: pos,
                radius: mechanicDef.radius || 15,
                duration: mechanicDef.duration || 15000,
                damage: mechanicDef.damage || 0.5,
                effects: mechanicDef.effects || []
            });
        }
    }
    
    executeProjectileMechanic(bossId, mechanicType, mechanicDef, context) {
        const projectileCount = mechanicDef.count || 6;
        
        for (let i = 0; i < projectileCount; i++) {
            const projectileId = `${mechanicType}_${Date.now()}_${i}`;
            
            this.createProjectile(bossId, projectileId, {
                type: mechanicType,
                damage: mechanicDef.damage || 1.0,
                speed: mechanicDef.speed || 20,
                duration: mechanicDef.duration || 8000,
                effects: mechanicDef.effects || [],
                pattern: mechanicDef.pattern || 'random'
            });
        }
    }
    
    executeEnvironmentMechanic(bossId, mechanicType, mechanicDef, context) {
        // Apply environmental effect to arena
        this.applyEnvironmentEffect(bossId, mechanicType, mechanicDef, context);
    }
    
    // Utility methods
    getPhaseDefinition(bossType) {
        return this.phaseDefinitions.get(bossType);
    }
    
    getCurrentPhaseDefinition(bossType, phase) {
        const phaseDef = this.phaseDefinitions.get(bossType);
        if (!phaseDef) return null;
        
        return phaseDef.phases.find(p => p.phase === phase);
    }
    
    getAbilityDefinition(bossType, abilityId) {
        const abilities = this.abilityDefinitions.get(bossType);
        return abilities ? abilities[abilityId] : null;
    }
    
    getMechanicDefinition(bossType, mechanicType) {
        const mechanics = this.mechanicDefinitions.get(bossType);
        return mechanics ? mechanics[mechanicType] : null;
    }
    
    getNearbyPlayers(bossId, radius) {
        const boss = this.getBoss(bossId);
        if (!boss) return [];
        
        const players = [];
        const region = this.worldManager.regions.get(boss.regionId);
        
        if (region) {
            for (const playerId of region.players) {
                const player = this.worldManager.connectedPlayers.get(playerId);
                if (player) {
                    const distance = this.calculateDistance(boss, player);
                    if (distance <= radius) {
                        players.push(player);
                    }
                }
            }
        }
        
        return players;
    }
    
    getNearbyAdds(bossId, radius) {
        const boss = this.getBoss(bossId);
        if (!boss) return [];
        
        const adds = [];
        const region = this.worldManager.regions.get(boss.regionId);
        
        if (region) {
            for (const [addId, add] of region.monsters) {
                if (addId === bossId || add.isDead) continue;
                
                const distance = this.calculateDistance(boss, add);
                if (distance <= radius) {
                    adds.push(add);
                }
            }
        }
        
        return adds;
    }
    
    getBoss(bossId) {
        for (const region of this.worldManager.regions.values()) {
            const boss = region.monsters.get(bossId);
            if (boss && boss.isBoss) {
                return boss;
            }
        }
        return null;
    }
    
    getEntity(entityId) {
        // Try player first
        const player = this.worldManager.connectedPlayers.get(entityId);
        if (player) return player;
        
        // Try monster
        return this.getBoss(entityId) || this.monsterAI.getMonster(entityId);
    }
    
    calculateDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Event handlers
    onCombatStart(combatId, participants) {
        // Check if any participants are bosses
        for (const participant of participants) {
            const entity = this.getEntity(participant.id);
            if (entity && entity.isBoss) {
                this.initializeBossFight(participant.id, entity, combatId);
            }
        }
    }
    
    onCombatEnd(combatId, winner) {
        // Clean up boss states
        for (const [bossId, bossState] of this.bossStates) {
            if (bossState.boss.combatId === combatId) {
                this.finalizeBossFight(bossId, winner !== null);
            }
        }
    }
    
    onDamageDealt(attackerId, targetId, damage, damageType) {
        // Check if target is a boss
        const bossState = this.bossStates.get(targetId);
        if (bossState) {
            bossState.damageTaken += damage;
        }
    }
    
    onMonsterDeath(monsterId, killerId) {
        // Check if dead monster is a boss
        const bossState = this.bossStates.get(monsterId);
        if (bossState) {
            this.handleBossDeath(monsterId, killerId, bossState);
        }
    }
    
    onPlayerDeath(playerId, killerId) {
        // Update boss statistics
        for (const [bossId, bossState] of this.bossStates) {
            if (bossState.boss.combatId) {
                bossState.playerDeaths++;
                this.bossStats.totalPlayerDeaths++;
            }
        }
    }
    
    // Boss fight management
    initializeBossFight(bossId, boss, combatId) {
        let bossState = this.bossStates.get(bossId);
        if (!bossState) {
            bossState = this.createBossState(bossId, boss);
            this.bossStates.set(bossId, bossState);
        }
        
        bossState.fightStartTime = Date.now();
        bossState.boss.combatId = combatId;
        
        // Initialize arena
        this.initializeArena(bossId, boss, bossState);
        
        // Update statistics
        this.bossStats.totalBossFights++;
        
        // Notify boss fight start
        this.notifyBossFightStart(bossId, boss);
    }
    
    finalizeBossFight(bossId, victory) {
        const bossState = this.bossStates.get(bossId);
        if (!bossState) return;
        
        const fightDuration = Date.now() - bossState.fightStartTime;
        
        // Update statistics
        this.bossStats.averageFightDuration = 
            (this.bossStats.averageFightDuration + fightDuration) / 2;
        
        if (victory) {
            this.bossStats.successRate = 
                (this.bossStats.successRate + 1) / 2;
            
            if (fightDuration < this.bossStats.fastestKill) {
                this.bossStats.fastestKill = fightDuration;
            }
        }
        
        if (fightDuration > this.bossStats.longestFight) {
            this.bossStats.longestFight = fightDuration;
        }
        
        // Clean up boss state
        this.cleanupBossState(bossId);
        
        // Notify boss fight end
        this.notifyBossFightEnd(bossId, victory, fightDuration);
    }
    
    handleBossDeath(bossId, killerId, bossState) {
        const fightDuration = Date.now() - bossState.fightStartTime;
        
        // Award loot and experience
        this.awardBossLoot(bossId, killerId, bossState);
        
        // Update statistics
        this.bossStats.successRate = 
            (this.bossStats.successRate + 1) / 2;
        
        if (fightDuration < this.bossStats.fastestKill) {
            this.bossStats.fastestKill = fightDuration;
            this.bossStats.mostChallengingBoss = bossState.bossType;
        }
        
        // Finalize fight
        this.finalizeBossFight(bossId, true);
    }
    
    // Notifications
    notifyBossFightStart(bossId, boss) {
        const region = this.worldManager.regions.get(boss.regionId);
        if (!region) return;
        
        for (const playerId of region.players) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'boss_fight_start',
                bossId: bossId,
                bossName: boss.name,
                bossType: boss.bossType,
                message: `⚔️ ${boss.name} apareceu! Prepare-se para a batalha!`
            });
        }
    }
    
    notifyBossFightEnd(bossId, victory, duration) {
        const boss = this.getBoss(bossId);
        if (!boss) return;
        
        const region = this.worldManager.regions.get(boss.regionId);
        if (!region) return;
        
        for (const playerId of region.players) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'boss_fight_end',
                bossId: bossId,
                bossName: boss.name,
                victory: victory,
                duration: duration,
                message: victory ? 
                    `🎉 ${boss.name} foi derrotado!` : 
                    `💀 ${boss.name} venceu a batalha...`
            });
        }
    }
    
    notifyPhaseTransitionStart(bossId, oldPhase, newPhase) {
        const boss = this.getBoss(bossId);
        if (!boss) return;
        
        const region = this.worldManager.regions.get(boss.regionId);
        if (!region) return;
        
        for (const playerId of region.players) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'boss_phase_transition_start',
                bossId: bossId,
                bossName: boss.name,
                oldPhase: oldPhase,
                newPhase: newPhase,
                message: `${boss.name} está entrando na fase ${newPhase}!`
            });
        }
    }
    
    notifyPhaseTransitionComplete(bossId, newPhase) {
        const boss = this.getBoss(bossId);
        if (!boss) return;
        
        const region = this.worldManager.regions.get(boss.regionId);
        if (!region) return;
        
        for (const playerId of region.players) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'boss_phase_transition_complete',
                bossId: bossId,
                bossName: boss.name,
                newPhase: newPhase,
                message: `${boss.name} entrou na fase ${newPhase}!`
            });
        }
    }
    
    // Public API
    getBossState(bossId) {
        return this.bossStates.get(bossId);
    }
    
    getBossStatistics() {
        return this.bossStats;
    }
    
    setBossDifficulty(bossId, difficulty) {
        const bossState = this.bossStates.get(bossId);
        if (bossState) {
            bossState.difficulty = difficulty;
        }
    }
    
    // Cleanup
    cleanupBossState(bossId) {
        const bossState = this.bossStates.get(bossId);
        if (bossState) {
            // Clear active mechanics
            for (const mechanicId of bossState.activeMechanics.keys()) {
                this.removeMechanic(bossId, mechanicId);
            }
            
            // Clear arena effects
            for (const effectId of bossState.environmentalEffects.keys()) {
                this.removeEnvironmentEffect(bossId, effectId);
            }
        }
        
        this.bossStates.delete(bossId);
    }
    
    cleanup() {
        for (const bossId of this.bossStates.keys()) {
            this.cleanupBossState(bossId);
        }
        
        this.bossStates.clear();
        this.phaseDefinitions.clear();
        this.abilityDefinitions.clear();
        this.mechanicDefinitions.clear();
        this.activeMechanics.clear();
        this.mechanicTimers.clear();
        this.arenaStates.clear();
    }
}

export default BossAI;
