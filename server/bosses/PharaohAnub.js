/**
 * PharaohAnub.js
 * 
 * Pharaoh Anub - Level 60 Raid Boss
 * The cursed ruler of ancient Aurélia
 * 4-phase encounter with complex mechanics
 */

class PharaohAnub {
    constructor(database) {
        this.db = database;
        this.id = 'pharaoh_anub';
        this.type = 'raid_boss';
        this.name = 'Pharaoh Anub';
        this.title = 'The Eternal King';
        this.level = 60;
        
        // Position (center of pyramid chamber)
        this.x = 2000;
        this.y = 500;
        this.zone = 'aurelia';
        this.subZone = 'pyramid_anub';
        
        // Raid configuration
        this.minPlayers = 5;
        this.maxPlayers = 8;
        this.respawnTime = 8 * 60 * 60 * 1000; // 8 hours
        this.enrageTimer = 8 * 60 * 1000; // 8 minutes
        
        // Stats
        this.maxHp = 50000;
        this.hp = this.maxHp;
        this.damage = 150;
        this.attackSpeed = 1.0;
        this.moveSpeed = 70;
        this.aggroRange = 1000; // Whole room
        this.attackRange = 60;
        
        // Phases
        this.currentPhase = 1;
        this.phaseThresholds = {
            1: 1.0,     // 100% - Phase 1
            2: 0.75,    // 75% - Phase 2
            3: 0.50,    // 50% - Phase 3
            4: 0.25     // 25% - Phase 4
        };
        
        // Phase states
        this.phaseState = {
            1: { name: "The Eternal King", active: true },
            2: { name: "Wrath of the Sun", active: false, solarBeamCharging: false },
            3: { name: "Rise of the Dead", active: false, immune: false },
            4: { name: "Immortality's Price", active: false, pillarsRemaining: 4 }
        };
        
        // Abilities
        this.abilities = {
            // Phase 1
            scepterStrike: {
                name: 'Scepter Strike',
                cooldown: 3000,
                lastUsed: 0,
                damage: this.damage,
                description: 'Powerful melee attack'
            },
            summonMummy: {
                name: 'Summon Mummy',
                cooldown: 25000,
                lastUsed: 0,
                count: 2,
                description: 'Summons 2 mummies'
            },
            curseOfAging: {
                name: 'Curse of Aging',
                cooldown: 15000,
                lastUsed: 0,
                maxHpReduction: 0.10, // 10% max HP reduction
                duration: 30000,
                stackable: true,
                maxStacks: 5,
                description: 'Reduces max HP by 10% per stack'
            },
            
            // Phase 2
            solarBeam: {
                name: 'Solar Beam',
                cooldown: 20000,
                lastUsed: 0,
                chargeTime: 3000,
                damage: this.damage * 3,
                frontal: true,
                range: 400,
                description: 'High damage beam, must hide behind pillars'
            },
            summonConstruct: {
                name: 'Summon Construct',
                cooldown: 35000,
                lastUsed: 0,
                count: 1,
                description: 'Summons 1 Ancient Construct'
            },
            roomHeat: {
                name: 'Room Heat',
                passive: true,
                tickDamage: 5,
                tickInterval: 5000,
                lastTick: 0
            },
            quicksand: {
                name: 'Quicksand',
                cooldown: 18000,
                lastUsed: 0,
                duration: 10000,
                slowAmount: 0.5,
                description: 'Slows movement in room'
            },
            
            // Phase 3
            summonCaptains: {
                name: 'Summon Captains',
                cooldown: 30000,
                lastUsed: 0,
                captainCount: 2,
                mummyCount: 4,
                description: 'Summons 2 Mercenary Captains and 4 Mummies'
            },
            armyOfTheDead: {
                name: 'Army of the Dead',
                cooldown: 45000,
                lastUsed: 0,
                resurrectHpPercent: 0.50,
                description: 'Resurrects all dead adds at 50% HP'
            },
            pharaohsDecree: {
                name: "Pharaoh's Decree",
                cooldown: 25000,
                lastUsed: 0,
                fearDuration: 3000,
                aoe: true,
                immuneDuration: 5000,
                description: 'Fear all players, Anub becomes immune'
            },
            
            // Phase 4
            finalCurse: {
                name: 'Final Curse',
                passive: true,
                tickDamagePercent: 0.02, // 2% max HP per tick
                tickInterval: 5000,
                lastTick: 0,
                description: 'Constant damage to all players'
            },
            soulDrain: {
                name: 'Soul Drain',
                cooldown: 12000,
                lastUsed: 0,
                lifestealPercent: 0.20,
                description: 'Steals 20% of damage dealt as HP'
            },
            eternalRest: {
                name: 'Eternal Rest',
                cooldown: 0, // Only usable at 5% HP
                lastUsed: 0,
                damage: 9999, // Raid wipe
                requiresPillars: true,
                pillarsToDestroy: 4,
                channelTime: 10000,
                description: 'Wipes raid if pillars not destroyed in time'
            }
        };
        
        // Combat state
        this.inCombat = false;
        this.combatStartTime = null;
        this.lastAttackTime = 0;
        this.raidGroup = new Set();
        this.aggroTable = new Map(); // playerId -> threat
        this.highestThreatTarget = null;
        
        // Summoned adds
        this.summonedMummies = [];
        this.summonedConstructs = [];
        this.summonedCaptains = [];
        this.deadAdds = []; // Track for resurrection
        
        // Room pillars (for phase 2 and 4)
        this.pillars = [
            { id: 'pillar_north', x: 2000, y: 300, hp: 2000, maxHp: 2000, destroyed: false },
            { id: 'pillar_south', x: 2000, y: 700, hp: 2000, maxHp: 2000, destroyed: false },
            { id: 'pillar_east', x: 2200, y: 500, hp: 2000, maxHp: 2000, destroyed: false },
            { id: 'pillar_west', x: 1800, y: 500, hp: 2000, maxHp: 2000, destroyed: false }
        ];
        
        // Loot
        this.lootTable = {
            guaranteed: [
                { id: 'gold_per_player', name: 'Gold', min: 1000, max: 2000 }
            ],
            random: [
                { id: 'crown_of_the_sun', name: 'Crown of the Sun', type: 'legendary', slot: 'helmet', chance: 0.15 },
                { id: 'scepter_of_anub', name: 'Scepter of Anub', type: 'epic', slot: 'weapon', chance: 0.20 },
                { id: 'ankh_of_immortality', name: 'Ankh of Immortality', type: 'trinket', chance: 0.25 },
                { id: 'pharaohs_wraps', name: "Pharaoh's Wraps", type: 'rare', slot: 'gloves', chance: 0.40 }
            ]
        };
        
        // Resistances
        this.resistances = {
            physical: 0.3,
            fire: 0.2,
            poison: 0.5,
            cold: 0.1,
            holy: -0.2, // Weak to holy
            magic: 0.2
        };
        
        // Timers
        this.updateInterval = null;
        this.lastUpdate = Date.now();
        
        // Encounter tracking
        this.encounterId = null;
        this.totalDeaths = 0;
        this.raidWipe = false;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('[PharaohAnub] Boss initialized');
        this.startUpdateLoop();
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => this.update(), 200);
    }
    
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // Check enrage
        if (this.inCombat && now - this.combatStartTime >= this.enrageTimer) {
            this.enrage();
        }
        
        // Check phase transition
        this.checkPhaseTransition();
        
        // Update adds
        this.updateAdds(deltaTime);
        
        // Apply passive abilities
        this.applyPassiveAbilities(now);
        
        // Phase-specific updates
        if (this.currentPhase === 2) {
            this.updatePhase2(deltaTime);
        } else if (this.currentPhase === 4) {
            this.updatePhase4(deltaTime);
        }
        
        // Combat state machine
        if (this.inCombat && !this.phaseState[this.currentPhase].immune) {
            this.updateCombat(deltaTime);
        }
    }
    
    checkPhaseTransition() {
        const hpPercent = this.hp / this.maxHp;
        
        // Check for phase transitions
        for (let phase = 2; phase <= 4; phase++) {
            if (this.currentPhase < phase && hpPercent <= this.phaseThresholds[phase]) {
                this.transitionToPhase(phase);
                break;
            }
        }
    }
    
    transitionToPhase(newPhase) {
        console.log(`[PharaohAnub] Transitioning to Phase ${newPhase}: ${this.phaseState[newPhase].name}`);
        
        this.currentPhase = newPhase;
        this.phaseState[newPhase].active = true;
        
        // Broadcast phase change
        this.broadcastToRaid({
            type: 'phase_transition',
            phase: newPhase,
            name: this.phaseState[newPhase].name,
            message: this.getPhaseMessage(newPhase)
        });
        
        // Phase-specific actions
        switch (newPhase) {
            case 2:
                this.onPhase2Start();
                break;
            case 3:
                this.onPhase3Start();
                break;
            case 4:
                this.onPhase4Start();
                break;
        }
    }
    
    getPhaseMessage(phase) {
        const messages = {
            2: "☀️ O SOL ESCALDANTE INVADE A CÂMARA! 🌞",
            3: "💀 OS MORTOS SE LEVANTAM! 💀",
            4: "⚰️ A IMORTALIDADE TEM UM PREÇO! ⚰️"
        };
        return messages[phase] || '';
    }
    
    onPhase2Start() {
        // Summon initial constructs
        this.useAbility('summonConstruct');
        
        // Room starts heating up
        this.abilities.roomHeat.lastTick = Date.now();
    }
    
    onPhase3Start() {
        // Summon captains and mummies
        this.useAbility('summonCaptains');
    }
    
    onPhase4Start() {
        // Final curse starts
        this.abilities.finalCurse.lastTick = Date.now();
        
        // Check if all pillars are up
        const intactPillars = this.pillars.filter(p => !p.destroyed).length;
        this.phaseState[4].pillarsRemaining = intactPillars;
    }
    
    updatePhase2(deltaTime) {
        const now = Date.now();
        
        // Check for solar beam
        if (now - this.abilities.solarBeam.lastUsed >= this.abilities.solarBeam.cooldown) {
            this.prepareSolarBeam();
        }
    }
    
    updatePhase4(deltaTime) {
        const hpPercent = this.hp / this.maxHp;
        
        // Check for Eternal Rest at 5% HP
        if (hpPercent <= 0.05 && this.abilities.eternalRest.lastUsed === 0) {
            this.beginEternalRest();
        }
    }
    
    applyPassiveAbilities(now) {
        // Room Heat (Phase 2+)
        if (this.currentPhase >= 2) {
            const heat = this.abilities.roomHeat;
            if (now - heat.lastTick >= heat.tickInterval) {
                heat.lastTick = now;
                this.applyRoomHeat();
            }
        }
        
        // Final Curse (Phase 4)
        if (this.currentPhase === 4) {
            const curse = this.abilities.finalCurse;
            if (now - curse.lastTick >= curse.tickInterval) {
                curse.lastTick = now;
                this.applyFinalCurse();
            }
        }
    }
    
    // Ability methods
    useAbility(abilityName, target = null) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        
        if (ability.passive) return false;
        
        const now = Date.now();
        if (ability.cooldown > 0 && now - ability.lastUsed < ability.cooldown) return false;
        
        ability.lastUsed = now;
        
        switch (abilityName) {
            case 'scepterStrike':
                this.performScepterStrike(target, ability);
                break;
            case 'summonMummy':
                this.performSummonMummy(ability);
                break;
            case 'curseOfAging':
                this.performCurseOfAging(target, ability);
                break;
            case 'solarBeam':
                this.performSolarBeam(ability);
                break;
            case 'summonConstruct':
                this.performSummonConstruct(ability);
                break;
            case 'summonCaptains':
                this.performSummonCaptains(ability);
                break;
            case 'armyOfTheDead':
                this.performArmyOfTheDead(ability);
                break;
            case 'pharaohsDecree':
                this.performPharaohsDecree(ability);
                break;
            case 'soulDrain':
                this.performSoulDrain(target, ability);
                break;
        }
        
        return true;
    }
    
    performScepterStrike(target, ability) {
        const damage = this.calculateDamage(ability.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        this.broadcastToRaid({
            type: 'boss_attack',
            ability: 'scepterStrike',
            target: target.id,
            damage
        });
    }
    
    performSummonMummy(ability) {
        for (let i = 0; i < ability.count; i++) {
            const mummy = {
                id: `anub_mummy_${Date.now()}_${i}`,
                type: 'mummy',
                hp: 800,
                maxHp: 800,
                damage: 35,
                owner: this.id,
                x: this.x + (Math.random() - 0.5) * 100,
                y: this.y + (Math.random() - 0.5) * 100
            };
            this.summonedMummies.push(mummy);
        }
        
        this.broadcastToRaid({
            type: 'boss_summon',
            ability: 'summonMummy',
            count: ability.count
        });
    }
    
    performCurseOfAging(target, ability) {
        if (target.applyStatusEffect) {
            target.applyStatusEffect({
                type: 'curse',
                subtype: 'aging',
                maxHpReduction: ability.maxHpReduction,
                duration: ability.duration,
                source: this.id,
                stackable: ability.stackable,
                maxStacks: ability.maxStacks
            });
        }
        
        this.broadcastToRaid({
            type: 'boss_ability',
            ability: 'curseOfAging',
            target: target.id,
            message: `${target.name || target.id} foi amaldiçoado pelo Envelhecimento!`
        });
    }
    
    prepareSolarBeam() {
        this.phaseState[2].solarBeamCharging = true;
        
        this.broadcastToRaid({
            type: 'boss_warning',
            ability: 'solarBeam',
            message: '⚠️ Anub está carregando o Raio Solar! Esconda-se atrás dos pilares!',
            chargeTime: this.abilities.solarBeam.chargeTime
        });
        
        setTimeout(() => {
            if (this.hp > 0 && this.currentPhase === 2) {
                this.useAbility('solarBeam');
            }
            this.phaseState[2].solarBeamCharging = false;
        }, this.abilities.solarBeam.chargeTime);
    }
    
    performSolarBeam(ability) {
        // Get direction toward highest threat target
        const target = this.highestThreatTarget;
        if (!target) return;
        
        // Calculate beam direction
        const dx = (target.x || target.position?.x) - this.x;
        const dy = (target.y || target.position?.y) - this.y;
        const angle = Math.atan2(dy, dx);
        
        // Hit all players in frontal cone
        for (const playerId of this.raidGroup) {
            // Would get actual player position
            const playerAngle = 0; // Calculate relative to beam
            
            // If not behind pillar, take damage
            const behindPillar = this.isPlayerBehindPillar(playerId);
            
            if (!behindPillar) {
                const damage = this.calculateDamage(ability.damage, { id: playerId });
                this.dealDamage({ id: playerId, takeDamage: (d, s, t) => {} }, damage, 'magic');
            }
        }
        
        this.broadcastToRaid({
            type: 'boss_ability',
            ability: 'solarBeam',
            message: '☀️ RAIO SOLAR! ☀️'
        });
    }
    
    performSummonCaptains(ability) {
        // Summon 2 captains and 4 mummies
        for (let i = 0; i < ability.captainCount; i++) {
            const captain = {
                id: `anub_captain_${Date.now()}_${i}`,
                type: 'mercenary_captain',
                hp: 1500,
                maxHp: 1500,
                damage: 60,
                owner: this.id
            };
            this.summonedCaptains.push(captain);
        }
        
        this.performSummonMummy({ count: 4 });
        
        this.phaseState[3].immune = true;
        setTimeout(() => {
            this.phaseState[3].immune = false;
        }, this.abilities.pharaohsDecree.immuneDuration);
        
        this.broadcastToRaid({
            type: 'boss_summon',
            ability: 'summonCaptains',
            captains: ability.captainCount,
            mummies: 4
        });
    }
    
    performArmyOfTheDead(ability) {
        // Resurrect all dead adds at 50% HP
        for (const deadAdd of this.deadAdds) {
            const resurrected = {
                ...deadAdd,
                hp: deadAdd.maxHp * ability.resurrectHpPercent,
                resurrected: true
            };
            
            if (deadAdd.type === 'mummy') {
                this.summonedMummies.push(resurrected);
            } else if (deadAdd.type === 'mercenary_captain') {
                this.summonedCaptains.push(resurrected);
            }
        }
        
        this.deadAdds = [];
        
        this.broadcastToRaid({
            type: 'boss_ability',
            ability: 'armyOfTheDead',
            message: '💀 OS MORTOS SE LEVANTAM NOVAMENTE! 💀'
        });
    }
    
    performPharaohsDecree(ability) {
        // Fear all players
        for (const playerId of this.raidGroup) {
            // Apply fear
        }
        
        // Become immune
        this.phaseState[3].immune = true;
        
        setTimeout(() => {
            this.phaseState[3].immune = false;
        }, ability.immuneDuration);
        
        this.broadcastToRaid({
            type: 'boss_ability',
            ability: 'pharaohsDecree',
            fearDuration: ability.fearDuration,
            message: '📜 DECRETO DO FARAÓ! Todos fujam em MEDO! 📜'
        });
    }
    
    performSoulDrain(target, ability) {
        const damage = this.calculateDamage(this.damage * 1.2, target);
        this.dealDamage(target, damage, 'magic');
        
        // Lifesteal
        const healAmount = Math.floor(damage * ability.lifestealPercent);
        this.hp = Math.min(this.maxHp, this.hp + healAmount);
        
        this.broadcastToRaid({
            type: 'boss_ability',
            ability: 'soulDrain',
            target: target.id,
            damage,
            healAmount
        });
    }
    
    beginEternalRest() {
        this.abilities.eternalRest.lastUsed = Date.now();
        
        this.broadcastToRaid({
            type: 'boss_emergency',
            ability: 'eternalRest',
            message: '⚰️ ANUB INICIA O DESCANSO ETERNO! DESTRUAM OS PILARES! ⚰️',
            channelTime: this.abilities.eternalRest.channelTime,
            pillarsRemaining: this.pillars.filter(p => !p.destroyed).length
        });
        
        // Start channeling
        setTimeout(() => {
            const intactPillars = this.pillars.filter(p => !p.destroyed).length;
            
            if (intactPillars > 0) {
                // Wipe raid
                this.wipeRaid();
            } else {
                // All pillars destroyed, interrupt and become vulnerable
                this.interruptEternalRest();
            }
        }, this.abilities.eternalRest.channelTime);
    }
    
    wipeRaid() {
        this.raidWipe = true;
        
        // Kill all players
        for (const playerId of this.raidGroup) {
            // Kill player
        }
        
        this.broadcastToRaid({
            type: 'raid_wipe',
            message: '💀 A RAID FOI ANIQUILADA! 💀'
        });
        
        this.resetEncounter();
    }
    
    interruptEternalRest() {
        this.phaseState[4].immune = false;
        
        this.broadcastToRaid({
            type: 'boss_interrupt',
            message: '✨ PILARES DESTRUÍDOS! Anub está VULNERÁVEL! ✨'
        });
    }
    
    applyRoomHeat() {
        for (const playerId of this.raidGroup) {
            // Deal heat damage
        }
    }
    
    applyFinalCurse() {
        for (const playerId of this.raidGroup) {
            // Deal % max HP damage
        }
    }
    
    // Combat methods
    updateCombat(deltaTime) {
        const now = Date.now();
        
        // Update target based on threat
        this.updateThreat();
        
        if (!this.highestThreatTarget) return;
        
        const distance = this.getDistanceTo(this.highestThreatTarget);
        
        // Use abilities based on phase
        this.usePhaseAbilities(now);
        
        // Basic attack
        if (distance <= this.attackRange) {
            if (now - this.lastAttackTime >= (1000 / this.attackSpeed)) {
                this.attack(this.highestThreatTarget);
            }
        } else {
            this.moveToward(this.highestThreatTarget, deltaTime);
        }
    }
    
    usePhaseAbilities(now) {
        switch (this.currentPhase) {
            case 1:
                if (now - this.abilities.summonMummy.lastUsed >= this.abilities.summonMummy.cooldown) {
                    this.useAbility('summonMummy');
                }
                if (now - this.abilities.curseOfAging.lastUsed >= this.abilities.curseOfAging.cooldown) {
                    this.useAbility('curseOfAging', this.highestThreatTarget);
                }
                break;
            case 2:
                if (now - this.abilities.summonConstruct.lastUsed >= this.abilities.summonConstruct.cooldown) {
                    this.useAbility('summonConstruct');
                }
                break;
            case 3:
                if (now - this.abilities.armyOfTheDead.lastUsed >= this.abilities.armyOfTheDead.cooldown &&
                    this.deadAdds.length > 0) {
                    this.useAbility('armyOfTheDead');
                }
                if (now - this.abilities.pharaohsDecree.lastUsed >= this.abilities.pharaohsDecree.cooldown) {
                    this.useAbility('pharaohsDecree');
                }
                break;
            case 4:
                if (now - this.abilities.soulDrain.lastUsed >= this.abilities.soulDrain.cooldown) {
                    this.useAbility('soulDrain', this.highestThreatTarget);
                }
                break;
        }
    }
    
    attack(target) {
        this.lastAttackTime = Date.now();
        
        let damage = this.calculateDamage(this.damage, target);
        
        // Soul drain lifesteal in phase 4
        if (this.currentPhase === 4) {
            const drain = this.abilities.soulDrain;
            const healAmount = Math.floor(damage * drain.lifestealPercent);
            this.hp = Math.min(this.maxHp, this.hp + healAmount);
        }
        
        this.dealDamage(target, damage, 'physical');
        
        this.broadcastToRaid({
            type: 'boss_attack',
            target: target.id,
            damage
        });
    }
    
    calculateDamage(baseDamage, target) {
        let damage = baseDamage;
        
        // Apply resistances
        if (target.resistances) {
            // Calculate based on damage type
        }
        
        const variance = 0.9 + Math.random() * 0.2;
        return Math.max(1, Math.floor(damage * variance));
    }
    
    dealDamage(target, damage, type) {
        if (target.takeDamage) {
            target.takeDamage(damage, this.id, type);
        } else if (typeof target.hp === 'number') {
            target.hp = Math.max(0, target.hp - damage);
        }
        
        // Update threat
        const currentThreat = this.aggroTable.get(target.id) || 0;
        this.aggroTable.set(target.id, currentThreat + damage);
    }
    
    takeDamage(damage, source, type = 'physical') {
        if (this.phaseState[this.currentPhase].immune) {
            return 0; // Immune
        }
        
        const resistance = this.resistances[type] || 0;
        const finalDamage = Math.floor(damage * (1 - resistance));
        
        this.hp = Math.max(0, this.hp - finalDamage);
        
        // Add threat
        const sourceId = source?.id || source;
        const currentThreat = this.aggroTable.get(sourceId) || 0;
        this.aggroTable.set(sourceId, currentThreat + finalDamage * 2); // Damage generates threat
        
        if (this.hp <= 0) {
            this.die(source);
        }
        
        return finalDamage;
    }
    
    die(killer) {
        this.hp = 0;
        this.inCombat = false;
        
        console.log(`[PharaohAnub] Killed by raid group`);
        
        // Distribute loot
        this.distributeLoot();
        
        // Save encounter to database
        this.saveEncounter(true);
        
        this.broadcastToRaid({
            type: 'boss_death',
            message: '🎉 FARAÓ ANUB FOI DERROTADO! 🎉',
            loot: this.generateLootList(),
            title: 'Kingslayer',
            achievement: 'Curse Breaker'
        });
        
        // Schedule respawn
        setTimeout(() => this.respawn(), this.respawnTime);
    }
    
    respawn() {
        this.hp = this.maxHp;
        this.currentPhase = 1;
        this.inCombat = false;
        this.raidGroup.clear();
        this.aggroTable.clear();
        this.summonedMummies = [];
        this.summonedCaptains = [];
        this.summonedConstructs = [];
        this.deadAdds = [];
        this.totalDeaths = 0;
        this.raidWipe = false;
        
        // Reset pillars
        for (const pillar of this.pillars) {
            pillar.hp = pillar.maxHp;
            pillar.destroyed = false;
        }
        
        // Reset phase states
        for (let i = 1; i <= 4; i++) {
            this.phaseState[i].active = false;
        }
        this.phaseState[1].active = true;
        
        // Reset cooldowns
        Object.values(this.abilities).forEach(a => a.lastUsed = 0);
        
        console.log('[PharaohAnub] Boss respawned');
    }
    
    // Methods for player actions
    onPillarAttacked(pillarId, damage, attacker) {
        const pillar = this.pillars.find(p => p.id === pillarId);
        if (!pillar || pillar.destroyed) return;
        
        pillar.hp -= damage;
        
        if (pillar.hp <= 0) {
            pillar.destroyed = true;
            this.phaseState[4].pillarsRemaining--;
            
            this.broadcastToRaid({
                type: 'pillar_destroyed',
                pillarId,
                remaining: this.phaseState[4].pillarsRemaining
            });
        }
    }
    
    isPlayerBehindPillar(playerId) {
        // Calculate if player is behind any intact pillar
        // Based on line of sight to Anub
        return false; // Simplified
    }
    
    // Helper methods
    updateThreat() {
        let highestThreat = 0;
        let highestTarget = null;
        
        for (const [playerId, threat] of this.aggroTable) {
            if (threat > highestThreat) {
                highestThreat = threat;
                highestTarget = { id: playerId };
            }
        }
        
        this.highestThreatTarget = highestTarget;
    }
    
    updateAdds(deltaTime) {
        // Update all summoned adds
        // Remove dead ones and track them
    }
    
    moveToward(target, deltaTime) {
        const targetX = target.x ?? target.position?.x ?? this.x;
        const targetY = target.y ?? target.position?.y ?? this.y;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveDistance = this.moveSpeed * deltaTime;
            const ratio = Math.min(moveDistance / distance, 1);
            this.x += dx * ratio;
            this.y += dy * ratio;
        }
    }
    
    getDistanceTo(target) {
        const targetX = target.x ?? target.position?.x ?? this.x;
        const targetY = target.y ?? target.position?.y ?? this.y;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    startEncounter(players) {
        this.inCombat = true;
        this.combatStartTime = Date.now();
        this.encounterId = `anub_${Date.now()}`;
        
        for (const player of players) {
            this.raidGroup.add(player.id || player);
        }
        
        this.saveEncounter(false);
        
        this.broadcastToRaid({
            type: 'encounter_start',
            boss: this.name,
            phase: 1,
            message: '⚔️ O ENFRENTAMENTO COM FARAÓ ANUB COMEÇOU! ⚔️'
        });
    }
    
    async saveEncounter(completed) {
        try {
            await this.db.run(
                `INSERT INTO pharaoh_anub_encounters 
                 (raid_id, player_ids, start_time, end_time, success, final_phase, deaths, loot_distributed)
                 VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?)`,
                [
                    this.encounterId,
                    JSON.stringify(Array.from(this.raidGroup)),
                    completed ? Date.now() : null,
                    completed,
                    this.currentPhase,
                    this.totalDeaths,
                    completed ? JSON.stringify(this.generateLootList()) : null
                ]
            );
        } catch (error) {
            console.error('[PharaohAnub] Error saving encounter:', error);
        }
    }
    
    generateLootList() {
        const loot = [];
        
        // Guaranteed gold
        for (let i = 0; i < this.raidGroup.size; i++) {
            const gold = Math.floor(Math.random() * 1000) + 1000;
            loot.push({ type: 'gold', amount: gold });
        }
        
        // Random drops
        for (const item of this.lootTable.random) {
            if (Math.random() < item.chance) {
                loot.push({
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    slot: item.slot
                });
            }
        }
        
        return loot;
    }
    
    distributeLoot() {
        // Logic to distribute loot to raid members
    }
    
    broadcastToRaid(message) {
        // Broadcast to all players in raid
        console.log(`[PharaohAnub] Broadcast: ${message.type || message}`, message);
    }
    
    getClientData() {
        return {
            id: this.id,
            name: this.name,
            title: this.title,
            level: this.level,
            x: this.x,
            y: this.y,
            hp: this.hp,
            maxHp: this.maxHp,
            phase: this.currentPhase,
            phaseName: this.phaseState[this.currentPhase].name,
            inCombat: this.inCombat,
            pillars: this.pillars.map(p => ({
                id: p.id,
                destroyed: p.destroyed,
                hp: p.hp,
                maxHp: p.maxHp
            })),
            summonedCount: this.summonedMummies.length + this.summonedCaptains.length + this.summonedConstructs.length
        };
    }
    
    getFullData() {
        return {
            ...this.getClientData(),
            damage: this.damage,
            attackSpeed: this.attackSpeed,
            moveSpeed: this.moveSpeed,
            resistances: this.resistances,
            abilities: Object.keys(this.abilities),
            minPlayers: this.minPlayers,
            maxPlayers: this.maxPlayers,
            enrageTimer: this.enrageTimer,
            raidGroupSize: this.raidGroup.size,
            totalDeaths: this.totalDeaths
        };
    }
    
    enrage() {
        this.damage *= 2;
        this.attackSpeed *= 1.5;
        
        this.broadcastToRaid({
            type: 'boss_enrage',
            message: '😤 ANUB ENFURECEU! 😤'
        });
    }
    
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

module.exports = PharaohAnub;
