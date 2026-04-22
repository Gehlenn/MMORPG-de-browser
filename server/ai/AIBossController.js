/**
 * AI Boss Controller - Enhanced AI System v0.3.7v
 * Controlador avançado para bosses com táticas complexas e comportamento adaptativo
 */

class AIBossController {
    constructor() {
        this.bosses = new Map(); // bossId -> BossAIData
        this.tactics = new Map(); // bossType -> TacticalProfile
        this.patterns = new Map(); // bossId -> PatternMemory
        this.adaptiveDifficulty = new Map(); // bossId -> DifficultyData
        
        // Configuration
        this.config = {
            updateFrequency: 50, // ms (mais rápido para bosses)
            decisionTimeout: 200, // ms
            patternMemorySize: 50,
            adaptationRate: 0.1,
            tacticalChangeThreshold: 0.3, // 30% HP
            enrageThreshold: 0.15, // 15% HP
            minionSpawnCooldown: 10000, // 10s
            specialAbilityCooldown: 8000, // 8s
            environmentalInteractionRange: 300
        };
        
        // Tactical profiles
        this.setupTacticalProfiles();
        
        // Event listeners
        this.onTacticalChange = null;
        this.onPhaseTransition = null;
        this.onAdaptiveDifficulty = null;
        this.onMinionSpawn = null;
        this.onSpecialAbility = null;
        
        // Update loop
        this.lastUpdateTime = 0;
        this.isRunning = false;
    }
    
    /**
     * Configura perfis táticos por tipo de boss
     */
    setupTacticalProfiles() {
        // Perfil tático agressivo
        this.tactics.set('aggressive', {
            style: 'aggressive',
            preferredRange: 'melee',
            aggression: 0.9,
            adaptability: 0.6,
            coordination: 0.5,
            environmentalUsage: 0.4,
            minionPreference: 'swarm',
            abilities: ['berserk', 'cleave', 'charge'],
            phases: {
                1: { behavior: 'direct_assault', abilityFrequency: 0.8 },
                2: { behavior: 'coordinated_attack', abilityFrequency: 0.9 },
                3: { behavior: 'desperate_assault', abilityFrequency: 1.0 }
            }
        });
        
        // Perfil tático tático
        this.tactics.set('tactical', {
            style: 'tactical',
            preferredRange: 'mixed',
            aggression: 0.6,
            adaptability: 0.9,
            coordination: 0.8,
            environmentalUsage: 0.8,
            minionPreference: 'specialized',
            abilities: ['summon', 'trap', 'debuff'],
            phases: {
                1: { behavior: 'probe_defenses', abilityFrequency: 0.5 },
                2: { behavior: 'exploit_weakness', abilityFrequency: 0.7 },
                3: { behavior: 'all_out_tactics', abilityFrequency: 0.9 }
            }
        });
        
        // Perfil tático defensivo
        this.tactics.set('defensive', {
            style: 'defensive',
            preferredRange: 'ranged',
            aggression: 0.3,
            adaptability: 0.7,
            coordination: 0.9,
            environmentalUsage: 0.9,
            minionPreference: 'tanks',
            abilities: ['shield', 'heal', 'area_control'],
            phases: {
                1: { behavior: 'fortify_position', abilityFrequency: 0.4 },
                2: { behavior: 'counter_attack', abilityFrequency: 0.6 },
                3: { behavior: 'last_stand', abilityFrequency: 0.8 }
            }
        });
        
        // Perfil tático caçador
        this.tactics.set('hunter', {
            style: 'hunter',
            preferredRange: 'ranged',
            aggression: 0.7,
            adaptability: 0.8,
            coordination: 0.6,
            environmentalUsage: 0.7,
            minionPreference: 'support',
            abilities: ['mark', 'pursuit', 'trap'],
            phases: {
                1: { behavior: 'track_and_hunt', abilityFrequency: 0.6 },
                2: { behavior: 'corner_and_trap', abilityFrequency: 0.8 },
                3: { behavior: 'relentless_pursuit', abilityFrequency: 0.9 }
            }
        });
        
        // Mapeamento de tipos de boss para perfis táticos
        this.bossTactics = {
            'dragon_lord': 'aggressive',
            'demon_king': 'tactical',
            'ancient_treant': 'defensive',
            'frost_giant': 'hunter'
        };
    }
    
    /**
     * Inicializa o AI Boss system
     */
    initialize() {
        console.log('[AIBossController] Inicializando Enhanced Boss AI System...');
        this.setupAbilityPatterns();
        this.startUpdateLoop();
    }
    
    /**
     * Configura padrões de habilidades
     */
    setupAbilityPatterns() {
        this.abilityPatterns = {
            berserk: {
                name: 'Berserk',
                cooldown: 15000,
                duration: 8000,
                effects: { damage: 2.0, speed: 1.5, defense: 0.5 },
                conditions: { health_below: 0.5, enemies_nearby: 2 }
            },
            cleave: {
                name: 'Cleave',
                cooldown: 6000,
                radius: 120,
                damage: 1.5,
                effects: { knockback: 50 },
                conditions: { enemies_in_range: 3 }
            },
            charge: {
                name: 'Charge',
                cooldown: 12000,
                range: 200,
                damage: 2.5,
                effects: { stun: 2000 },
                conditions: { target_distance: 150 }
            },
            summon: {
                name: 'Summon Minions',
                cooldown: 20000,
                count: 3,
                types: ['minion_melee', 'minion_ranged'],
                conditions: { health_below: 0.7, no_minions: true }
            },
            trap: {
                name: 'Trap',
                cooldown: 10000,
                radius: 80,
                damage: 1.0,
                effects: { slow: 5000 },
                conditions: { target_stationary: true }
            },
            debuff: {
                name: 'Debuff',
                cooldown: 8000,
                range: 150,
                effects: { attack_reduction: 0.3, defense_reduction: 0.3 },
                duration: 10000,
                conditions: { target_buffed: true }
            },
            shield: {
                name: 'Shield',
                cooldown: 18000,
                duration: 6000,
                effects: { damage_reduction: 0.5, immunity: true },
                conditions: { health_below: 0.4, taking_damage: true }
            },
            heal: {
                name: 'Heal',
                cooldown: 25000,
                amount: 0.3, // 30% HP
                conditions: { health_below: 0.6, no_recent_heal: true }
            },
            area_control: {
                name: 'Area Control',
                cooldown: 15000,
                radius: 200,
                duration: 8000,
                effects: { zone_damage: 0.5, movement_slow: 0.3 },
                conditions: { multiple_enemies: true }
            },
            mark: {
                name: 'Hunter\'s Mark',
                cooldown: 12000,
                duration: 15000,
                effects: { vulnerability: 0.25, tracking: true },
                conditions: { priority_target: true }
            },
            pursuit: {
                name: 'Pursuit',
                cooldown: 8000,
                duration: 5000,
                effects: { speed: 2.0, unstoppable: true },
                conditions: { target_fleeing: true }
            }
        };
    }
    
    /**
     * Adiciona um boss ao sistema AI
     */
    addBoss(bossData) {
        const tacticalProfile = this.getTacticalProfile(bossData.type);
        const patternMemory = this.createPatternMemory(bossData.id);
        const difficultyData = this.createDifficultyData(bossData.id);
        
        const bossAI = {
            id: bossData.id,
            type: bossData.type,
            tacticalProfile: tacticalProfile,
            patternMemory: patternMemory,
            difficultyData: difficultyData,
            currentPhase: 1,
            currentTactic: tacticalProfile.phases[1].behavior,
            currentTarget: null,
            currentAction: 'assess',
            abilities: new Map(), // abilityName -> cooldownData
            minions: new Set(),
            environmentalObjects: new Set(),
            lastDecision: 0,
            lastUpdate: Date.now(),
            combatStartTime: null,
            phaseTransitionTime: null,
            stats: {
                decisions: 0,
                phaseChanges: 0,
                abilitiesUsed: 0,
                minionsSpawned: 0,
                adaptiveAdjustments: 0
            }
        };
        
        // Inicializar habilidades
        this.initializeBossAbilities(bossAI);
        
        this.bosses.set(bossData.id, bossAI);
        this.patterns.set(bossData.id, patternMemory);
        this.adaptiveDifficulty.set(bossData.id, difficultyData);
        
        console.log(`[AIBossController] Boss ${bossData.id} (${bossData.type}) adicionado ao AI system`);
        return bossAI;
    }
    
    /**
     * Remove um boss do sistema AI
     */
    removeBoss(bossId) {
        const existed = this.bosses.has(bossId);
        this.bosses.delete(bossId);
        this.patterns.delete(bossId);
        this.adaptiveDifficulty.delete(bossId);
        
        console.log(`[AIBossController] Boss ${bossId} removido do AI system`);
        return existed;
    }
    
    /**
     * Obtém perfil tático para tipo de boss
     */
    getTacticalProfile(bossType) {
        const tacticName = this.bossTactics[bossType] || 'aggressive';
        return this.tactics.get(tacticName) || this.tactics.get('aggressive');
    }
    
    /**
     * Cria memória de padrões para um boss
     */
    createPatternMemory(bossId) {
        return {
            playerPatterns: new Map(), // playerId -> PatternData
            successfulAttacks: [],
            failedAttacks: [],
            abilityEffectiveness: new Map(), // ability -> effectiveness
            environmentalUsage: [],
            phaseHistory: [],
            totalCombatTime: 0
        };
    }
    
    /**
     * Cria dados de dificuldade adaptativa
     */
    createDifficultyData(bossId) {
        return {
            playerSkillLevel: 1.0,
            playerCount: 1,
            deathCount: 0,
            successRate: 1.0,
            difficultyMultiplier: 1.0,
            lastAdjustment: Date.now(),
            adjustmentHistory: []
        };
    }
    
    /**
     * Inicializa habilidades do boss
     */
    initializeBossAbilities(bossAI) {
        const abilities = bossAI.tacticalProfile.abilities;
        
        for (const abilityName of abilities) {
            const ability = this.abilityPatterns[abilityName];
            if (ability) {
                bossAI.abilities.set(abilityName, {
                    lastUsed: 0,
                    cooldown: ability.cooldown,
                    uses: 0,
                    effectiveness: 1.0
                });
            }
        }
    }
    
    /**
     * Inicia loop de update
     */
    startUpdateLoop() {
        this.isRunning = true;
        this.updateLoop();
    }
    
    /**
     * Loop principal de update
     */
    updateLoop() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        
        if (deltaTime >= this.config.updateFrequency) {
            this.updateAllBosses();
            this.lastUpdateTime = now;
        }
        
        // Próximo frame
        setTimeout(() => this.updateLoop(), 10);
    }
    
    /**
     * Atualiza todos os bosses
     */
    updateAllBosses() {
        for (const [bossId, bossAI] of this.bosses) {
            this.updateBoss(bossId, bossAI);
        }
    }
    
    /**
     * Atualiza um boss específico
     */
    updateBoss(bossId, bossAI) {
        const now = Date.now();
        
        // Verificar se precisa tomar decisão
        if (now - bossAI.lastDecision >= this.config.decisionTimeout) {
            this.makeBossDecision(bossId, bossAI);
            bossAI.lastDecision = now;
        }
        
        // Atualizar cooldowns de habilidades
        this.updateAbilityCooldowns(bossAI);
        
        // Verificar transições de fase
        this.checkPhaseTransition(bossId, bossAI);
        
        // Adaptar dificuldade
        this.updateAdaptiveDifficulty(bossId, bossAI);
        
        bossAI.lastUpdate = now;
    }
    
    /**
     * Tomada de decisão para boss
     */
    makeBossDecision(bossId, bossAI) {
        const context = this.buildBossDecisionContext(bossId, bossAI);
        const decision = this.evaluateBossTactics(bossAI, context);
        
        if (decision !== bossAI.currentAction) {
            this.executeBossDecision(bossId, bossAI, decision);
            bossAI.currentAction = decision;
            bossAI.stats.decisions++;
            
            // Trigger event
            if (this.onTacticalChange) {
                this.onTacticalChange(bossId, decision, context);
            }
        }
    }
    
    /**
     * Constrói contexto para decisão do boss
     */
    buildBossDecisionContext(bossId, bossAI) {
        const bossData = this.getBossData(bossId);
        const patternMemory = bossAI.patternMemory;
        const difficultyData = bossAI.difficultyData;
        
        return {
            boss_id: bossId,
            boss_type: bossAI.type,
            position: bossData.position,
            health: bossData.currentHp,
            max_health: bossData.maxHp,
            health_percentage: bossData.currentHp / bossData.maxHp,
            current_phase: bossAI.currentPhase,
            current_tactic: bossAI.currentTactic,
            has_target: bossAI.currentTarget !== null,
            target_count: this.getTargetCount(bossId),
            minions_alive: bossAI.minions.size,
            abilities_ready: this.getReadyAbilities(bossAI),
            environmental_objects: bossAI.environmentalObjects.size,
            combat_duration: bossAI.combatStartTime ? Date.now() - bossAI.combatStartTime : 0,
            player_skill_level: difficultyData.playerSkillLevel,
            difficulty_multiplier: difficultyData.difficultyMultiplier,
            pattern_memory: patternMemory,
            tactical_profile: bossAI.tacticalProfile
        };
    }
    
    /**
     * Avalia táticas do boss
     */
    evaluateBossTactics(bossAI, context) {
        const phase = context.current_phase;
        const phaseConfig = bossAI.tacticalProfile.phases[phase];
        
        if (!phaseConfig) return 'assess';
        
        // Decisão baseada no comportamento da fase
        switch (phaseConfig.behavior) {
            case 'direct_assault':
                return this.evaluateDirectAssault(context);
            case 'coordinated_attack':
                return this.evaluateCoordinatedAttack(context);
            case 'desperate_assault':
                return this.evaluateDesperateAssault(context);
            case 'probe_defenses':
                return this.evaluateProbeDefenses(context);
            case 'exploit_weakness':
                return this.evaluateExploitWeakness(context);
            case 'all_out_tactics':
                return this.evaluateAllOutTactics(context);
            case 'fortify_position':
                return this.evaluateFortifyPosition(context);
            case 'counter_attack':
                return this.evaluateCounterAttack(context);
            case 'last_stand':
                return this.evaluateLastStand(context);
            case 'track_and_hunt':
                return this.evaluateTrackAndHunt(context);
            case 'corner_and_trap':
                return this.evaluateCornerAndTrap(context);
            case 'relentless_pursuit':
                return this.evaluateRelentlessPursuit(context);
            default:
                return 'assess';
        }
    }
    
    /**
     * Avalia ataque direto
     */
    evaluateDirectAssault(context) {
        if (context.has_target && context.target_count === 1) {
            if (this.canUseAbility(context, 'charge')) {
                return 'use_charge';
            } else if (this.canUseAbility(context, 'berserk')) {
                return 'use_berserk';
            } else {
                return 'melee_assault';
            }
        } else if (context.target_count > 1) {
            if (this.canUseAbility(context, 'cleave')) {
                return 'use_cleave';
            } else {
                return 'area_assault';
            }
        }
        
        return 'advance';
    }
    
    /**
     * Avalia ataque coordenado
     */
    evaluateCoordinatedAttack(context) {
        if (context.minions_alive === 0 && this.canUseAbility(context, 'summon')) {
            return 'summon_minions';
        } else if (context.has_target && context.minions_alive > 0) {
            return 'coordinate_with_minions';
        } else if (context.target_count > 1 && this.canUseAbility(context, 'cleave')) {
            return 'use_cleave';
        }
        
        return 'tactical_assault';
    }
    
    /**
     * Avalia ataque desesperado
     */
    evaluateDesperateAssault(context) {
        if (context.health_percentage < this.config.enrageThreshold) {
            if (this.canUseAbility(context, 'berserk')) {
                return 'use_berserk';
            }
            return 'enraged_assault';
        }
        
        return 'desperate_attack';
    }
    
    /**
     * Avalia sondagem de defesas
     */
    evaluateProbeDefenses(context) {
        if (!context.has_target) {
            return 'scan_area';
        } else if (this.canUseAbility(context, 'mark')) {
            return 'mark_target';
        } else {
            return 'probe_attack';
        }
    }
    
    /**
     * Avalia exploração de fraquezas
     */
    evaluateExploitWeakness(context) {
        const pattern = context.pattern_memory;
        
        if (pattern.abilityEffectiveness.has('debuff') && 
            pattern.abilityEffectiveness.get('debuff') > 0.7 &&
            this.canUseAbility(context, 'debuff')) {
            return 'use_debuff';
        } else if (this.canUseAbility(context, 'trap')) {
            return 'setup_trap';
        } else {
            return 'exploit_weakness';
        }
    }
    
    /**
     * Avalia táticas totais
     */
    evaluateAllOutTactics(context) {
        if (context.target_count > 2 && this.canUseAbility(context, 'area_control')) {
            return 'use_area_control';
        } else if (context.minions_alive < 3 && this.canUseAbility(context, 'summon')) {
            return 'summon_minions';
        } else {
            return 'all_out_attack';
        }
    }
    
    /**
     * Avalia fortificação de posição
     */
    evaluateFortifyPosition(context) {
        if (context.health_percentage < 0.8 && this.canUseAbility(context, 'shield')) {
            return 'use_shield';
        } else if (context.health_percentage < 0.6 && this.canUseAbility(context, 'heal')) {
            return 'use_heal';
        } else {
            return 'fortify';
        }
    }
    
    /**
     * Avalia contra-ataque
     */
    evaluateCounterAttack(context) {
        if (this.canUseAbility(context, 'area_control')) {
            return 'use_area_control';
        } else if (context.minions_alive > 0) {
            return 'coordinate_counter';
        } else {
            return 'counter_attack';
        }
    }
    
    /**
     * Avalia última resistência
     */
    evaluateLastStand(context) {
        if (context.health_percentage < 0.2) {
            if (this.canUseAbility(context, 'shield')) {
                return 'use_shield';
            }
            return 'last_stand';
        }
        
        return 'defensive_assault';
    }
    
    /**
     * Avalia perseguição
     */
    evaluateTrackAndHunt(context) {
        if (!context.has_target) {
            return 'hunt_for_targets';
        } else if (this.canUseAbility(context, 'mark')) {
            return 'mark_target';
        } else {
            return 'pursue_target';
        }
    }
    
    /**
     * Avalia encurralar e armar ciladas
     */
    evaluateCornerAndTrap(context) {
        if (this.canUseAbility(context, 'trap')) {
            return 'setup_trap';
        } else if (context.minions_alive < 2 && this.canUseAbility(context, 'summon')) {
            return 'summon_minions';
        } else {
            return 'corner_target';
        }
    }
    
    /**
     * Avalia perseguição implacável
     */
    evaluateRelentlessPursuit(context) {
        if (this.canUseAbility(context, 'pursuit')) {
            return 'use_pursuit';
        } else if (this.canUseAbility(context, 'charge')) {
            return 'use_charge';
        } else {
            return 'relentless_attack';
        }
    }
    
    /**
     * Verifica se habilidade pode ser usada
     */
    canUseAbility(context, abilityName) {
        const bossAI = this.bosses.get(context.boss_id);
        if (!bossAI) return false;
        
        const ability = bossAI.abilities.get(abilityName);
        if (!ability) return false;
        
        const abilityPattern = this.abilityPatterns[abilityName];
        if (!abilityPattern) return false;
        
        // Verificar cooldown
        const now = Date.now();
        if (now - ability.lastUsed < ability.cooldown) return false;
        
        // Verificar condições
        return this.checkAbilityConditions(context, abilityPattern.conditions);
    }
    
    /**
     * Verifica condições da habilidade
     */
    checkAbilityConditions(context, conditions) {
        if (!conditions) return true;
        
        for (const [condition, value] of Object.entries(conditions)) {
            switch (condition) {
                case 'health_below':
                    if (context.health_percentage >= value) return false;
                    break;
                case 'enemies_nearby':
                    if (context.target_count < value) return false;
                    break;
                case 'target_distance':
                    // Implementar verificação de distância
                    break;
                case 'enemies_in_range':
                    if (context.target_count < value) return false;
                    break;
                case 'no_minions':
                    if (context.minions_alive > 0) return false;
                    break;
                case 'target_stationary':
                    // Implementar verificação de movimento do alvo
                    break;
                case 'target_buffed':
                    // Implementar verificação de buffs do alvo
                    break;
                case 'no_recent_heal':
                    // Implementar verificação de heal recente
                    break;
                case 'taking_damage':
                    // Implementar verificação de dano recente
                    break;
                case 'multiple_enemies':
                    if (context.target_count < 2) return false;
                    break;
                case 'priority_target':
                    // Implementar verificação de alvo prioritário
                    break;
                case 'target_fleeing':
                    // Implementar verificação de fuga do alvo
                    break;
            }
        }
        
        return true;
    }
    
    /**
     * Executa decisão do boss
     */
    executeBossDecision(bossId, bossAI, decision) {
        switch (decision) {
            case 'melee_assault':
            case 'area_assault':
            case 'tactical_assault':
            case 'desperate_attack':
            case 'enraged_assault':
            case 'probe_attack':
            case 'exploit_weakness':
            case 'all_out_attack':
            case 'counter_attack':
            case 'defensive_assault':
            case 'hunt_for_targets':
            case 'pursue_target':
            case 'corner_target':
            case 'relentless_attack':
                this.executeAttackPattern(bossId, bossAI, decision);
                break;
                
            case 'use_charge':
            case 'use_berserk':
            case 'use_cleave':
            case 'use_summon':
            case 'use_trap':
            case 'use_debuff':
            case 'use_shield':
            case 'use_heal':
            case 'use_area_control':
            case 'use_mark':
            case 'use_pursuit':
                this.executeAbility(bossId, bossAI, decision.replace('use_', ''));
                break;
                
            case 'summon_minions':
                this.executeSummonMinions(bossId, bossAI);
                break;
                
            case 'coordinate_with_minions':
            case 'coordinate_counter':
                this.executeCoordinateMinions(bossId, bossAI);
                break;
                
            case 'setup_trap':
                this.executeSetupTrap(bossId, bossAI);
                break;
                
            case 'fortify':
            case 'last_stand':
            case 'scan_area':
            case 'advance':
            case 'assess':
                this.executeTacticalMovement(bossId, bossAI, decision);
                break;
        }
    }
    
    /**
     * Executa padrão de ataque
     */
    executeAttackPattern(bossId, bossAI, pattern) {
        console.log(`[AIBossController] Boss ${bossId} executando ataque: ${pattern}`);
        
        // Implementar lógica específica de cada padrão
        // Isso deve ser integrado com o sistema de combate
    }
    
    /**
     * Executa habilidade especial
     */
    executeAbility(bossId, bossAI, abilityName) {
        const ability = bossAI.abilities.get(abilityName);
        const abilityPattern = this.abilityPatterns[abilityName];
        
        if (!ability || !abilityPattern) return;
        
        const now = Date.now();
        ability.lastUsed = now;
        ability.uses++;
        
        bossAI.stats.abilitiesUsed++;
        
        // Trigger event
        if (this.onSpecialAbility) {
            this.onSpecialAbility(bossId, abilityName, abilityPattern);
        }
        
        console.log(`[AIBossController] Boss ${bossId} usando habilidade: ${abilityName}`);
    }
    
    /**
     * Executa summon de minions
     */
    executeSummonMinions(bossId, bossAI) {
        const ability = bossAI.abilities.get('summon');
        const abilityPattern = this.abilityPatterns['summon'];
        
        if (!ability || Date.now() - ability.lastUsed < ability.cooldown) return;
        
        ability.lastUsed = Date.now();
        ability.uses++;
        
        bossAI.stats.minionsSpawned += abilityPattern.count;
        
        // Trigger event
        if (this.onMinionSpawn) {
            this.onMinionSpawn(bossId, abilityPattern.count, abilityPattern.types);
        }
        
        console.log(`[AIBossController] Boss ${bossId} summoning ${abilityPattern.count} minions`);
    }
    
    /**
     * Executa coordenação com minions
     */
    executeCoordinateMinions(bossId, bossAI, coordination) {
        console.log(`[AIBossController] Boss ${bossId} coordenando minions: ${coordination}`);
        // Implementar lógica de coordenação
    }
    
    /**
     * Executa setup de armadilha
     */
    executeSetupTrap(bossId, bossAI) {
        const ability = bossAI.abilities.get('trap');
        const abilityPattern = this.abilityPatterns['trap'];
        
        if (!ability || Date.now() - ability.lastUsed < ability.cooldown) return;
        
        ability.lastUsed = Date.now();
        ability.uses++;
        
        console.log(`[AIBossController] Boss ${bossId} setup armadilha`);
        // Implementar lógica de armadilha
    }
    
    /**
     * Executa movimento tático
     */
    executeTacticalMovement(bossId, bossAI, movement) {
        console.log(`[AIBossController] Boss ${bossId} movimento tático: ${movement}`);
        // Implementar lógica de movimento
    }
    
    /**
     * Verifica transição de fase
     */
    checkPhaseTransition(bossId, bossAI) {
        const bossData = this.getBossData(bossId);
        const healthPercentage = bossData.currentHp / bossData.maxHp;
        
        let newPhase = bossAI.currentPhase;
        
        if (healthPercentage <= 0.25 && bossAI.currentPhase < 3) {
            newPhase = 3;
        } else if (healthPercentage <= 0.5 && bossAI.currentPhase < 2) {
            newPhase = 2;
        }
        
        if (newPhase !== bossAI.currentPhase) {
            this.transitionPhase(bossId, bossAI, newPhase);
        }
    }
    
    /**
     * Transiciona para nova fase
     */
    transitionPhase(bossId, bossAI, newPhase) {
        const oldPhase = bossAI.currentPhase;
        const phaseConfig = bossAI.tacticalProfile.phases[newPhase];
        
        bossAI.currentPhase = newPhase;
        bossAI.currentTactic = phaseConfig.behavior;
        bossAI.phaseTransitionTime = Date.now();
        bossAI.stats.phaseChanges++;
        
        // Adicionar ao histórico
        bossAI.patternMemory.phaseHistory.push({
            from: oldPhase,
            to: newPhase,
            timestamp: Date.now(),
            health_percentage: bossAI.currentHp / bossAI.maxHp
        });
        
        // Trigger event
        if (this.onPhaseTransition) {
            this.onPhaseTransition(bossId, oldPhase, newPhase, phaseConfig);
        }
        
        console.log(`[AIBossController] Boss ${bossId}: Phase ${oldPhase} → ${newPhase} (${phaseConfig.behavior})`);
    }
    
    /**
     * Atualiza dificuldade adaptativa
     */
    updateAdaptiveDifficulty(bossId, bossAI) {
        const difficultyData = bossAI.difficultyData;
        const now = Date.now();
        
        // Ajustar dificuldade a cada 30 segundos
        if (now - difficultyData.lastAdjustment < 30000) return;
        
        const adjustment = this.calculateDifficultyAdjustment(bossId, bossAI);
        
        if (Math.abs(adjustment) > 0.05) { // Ajuste mínimo de 5%
            difficultyData.difficultyMultiplier += adjustment;
            difficultyData.difficultyMultiplier = Math.max(0.5, Math.min(2.0, difficultyData.difficultyMultiplier));
            difficultyData.lastAdjustment = now;
            difficultyData.adjustmentHistory.push({
                timestamp: now,
                adjustment: adjustment,
                new_multiplier: difficultyData.difficultyMultiplier
            });
            
            bossAI.stats.adaptiveAdjustments++;
            
            // Trigger event
            if (this.onAdaptiveDifficulty) {
                this.onAdaptiveDifficulty(bossId, adjustment, difficultyData.difficultyMultiplier);
            }
            
            console.log(`[AIBossController] Boss ${bossId} difficulty adjusted: ${adjustment > 0 ? '+' : ''}${(adjustment * 100).toFixed(1)}%`);
        }
    }
    
    /**
     * Calcula ajuste de dificuldade
     */
    calculateDifficultyAdjustment(bossId, bossAI) {
        const difficultyData = bossAI.difficultyData;
        const patternMemory = bossAI.patternMemory;
        
        let adjustment = 0;
        
        // Baseado na taxa de sucesso dos ataques
        const recentAttacks = patternMemory.successfulAttacks.slice(-10);
        if (recentAttacks.length > 0) {
            const successRate = recentAttacks.filter(a => a.success).length / recentAttacks.length;
            if (successRate > 0.8) {
                adjustment += 0.1; // Aumentar dificuldade
            } else if (successRate < 0.3) {
                adjustment -= 0.1; // Diminuir dificuldade
            }
        }
        
        // Baseado no número de jogadores
        if (difficultyData.playerCount > 1) {
            adjustment += (difficultyData.playerCount - 1) * 0.05;
        }
        
        // Baseado no tempo de combate
        const combatDuration = bossAI.combatStartTime ? Date.now() - bossAI.combatStartTime : 0;
        if (combatDuration > 300000) { // 5 minutos
            adjustment += 0.05; // Aumentar dificuldade em combates longos
        }
        
        return adjustment * this.config.adaptationRate;
    }
    
    /**
     * Atualiza cooldowns de habilidades
     */
    updateAbilityCooldowns(bossAI) {
        const now = Date.now();
        
        for (const [abilityName, ability] of bossAI.abilities) {
            if (ability.lastUsed > 0) {
                const timeSinceUse = now - ability.lastUsed;
                if (timeSinceUse >= ability.cooldown) {
                    ability.lastUsed = 0; // Reset cooldown
                }
            }
        }
    }
    
    /**
     * Obtém habilidades prontas
     */
    getReadyAbilities(bossAI) {
        const readyAbilities = [];
        const now = Date.now();
        
        for (const [abilityName, ability] of bossAI.abilities) {
            if (ability.lastUsed === 0 || now - ability.lastUsed >= ability.cooldown) {
                readyAbilities.push(abilityName);
            }
        }
        
        return readyAbilities;
    }
    
    /**
     * Obtém número de alvos
     */
    getTargetCount(bossId) {
        // Implementar contagem real de alvos
        return 1; // Placeholder
    }
    
    // Métodos de acesso a dados (precisam ser integrados)
    
    getBossData(bossId) {
        // Implementar acesso aos dados do boss
        return {
            id: bossId,
            position: { x: 400, y: 300 },
            currentHp: 1000,
            maxHp: 2000
        };
    }
    
    /**
     * Obtém estatísticas do AI Boss system
     */
    getStatistics() {
        const stats = {
            totalBosses: this.bosses.size,
            activePhases: {},
            tactics: {},
            abilities: {},
            decisions: 0,
            phaseChanges: 0,
            adaptiveAdjustments: 0
        };
        
        for (const [bossId, bossAI] of this.bosses) {
            // Contar fases ativas
            const phase = bossAI.currentPhase;
            stats.activePhases[phase] = (stats.activePhases[phase] || 0) + 1;
            
            // Contar táticas
            const tactic = bossAI.currentTactic;
            stats.tactics[tactic] = (stats.tactics[tactic] || 0) + 1;
            
            // Contar habilidades usadas
            for (const [abilityName, ability] of bossAI.abilities) {
                if (ability.uses > 0) {
                    stats.abilities[abilityName] = (stats.abilities[abilityName] || 0) + ability.uses;
                }
            }
            
            // Somar estatísticas
            stats.decisions += bossAI.stats.decisions;
            stats.phaseChanges += bossAI.stats.phaseChanges;
            stats.adaptiveAdjustments += bossAI.stats.adaptiveAdjustments;
        }
        
        return stats;
    }
    
    /**
     * Para o AI Boss system
     */
    stop() {
        this.isRunning = false;
        console.log('[AIBossController] Enhanced Boss AI System parado');
    }
}

module.exports = AIBossController;
