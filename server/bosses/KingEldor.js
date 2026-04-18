/**
 * KingEldor.js
 * Level 40 Raid Boss - 4 Phase Encounter
 * Phase 3: Eldoria Zone - The Throne Room
 */

const EventEmitter = require('events');

class KingEldor extends EventEmitter {
    constructor(zone) {
        super();
        this.zone = zone;
        this.id = 'boss_king_eldor';
        
        this.name = 'King Eldor IV';
        this.title = 'King of Eldoria';
        this.level = 40;
        this.type = 'raid_boss';
        
        // Position (center of throne room)
        this.x = 1600;
        this.y = 700;
        
        // Boss stats scale with phase
        this.maxHp = 8000;
        this.hp = this.maxHp;
        this.baseDamage = 60;
        this.armor = 40;
        
        // Combat
        this.attackRange = 60;
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        
        // Phase system
        this.currentPhase = 1;
        this.phaseThresholds = {
            2: 0.70, // 70% HP
            3: 0.40, // 40% HP
            4: 0.10  // 10% HP
        };
        
        // Raid management
        this.minPlayers = 3;
        this.maxPlayers = 5;
        this.activePlayers = new Map(); // playerId -> {damageDealt, isAlive}
        this.raidGroup = [];
        this.combatStartTime = null;
        this.enrageTimer = 5 * 60 * 1000; // 5 minutes
        this.isEnraged = false;
        
        // Summons
        this.activeSummons = new Map();
        this.summonLimits = {
            1: 2, // Phase 1: 2 guards
            2: 4, // Phase 2: 4 guards
            3: 6, // Phase 3: 2 knights + 4 guards
            4: 10 // Phase 4: All remaining
        };
        
        // Abilities per phase
        this.abilities = {
            swordStrike: { cooldown: 2000, lastUse: 0 },
            shieldBash: { cooldown: 8000, lastUse: 0, stunDuration: 2000 },
            royalCommand: { cooldown: 15000, lastUse: 0, fearDuration: 3000 }, // Phase 2+
            summonGuards: { cooldown: 30000, lastUse: 0 },
            selfHeal: { cooldown: 20000, lastUse: 0, amount: 0.05 }, // Phase 2+ 5% heal
            cleave: { cooldown: 12000, lastUse: 0, range: 100 }, // Phase 3+
            lastDecree: { cooldown: 45000, lastUse: 0, damage: 150 }, // Phase 4 ultimate
            lastStand: { used: false, buffAmount: 1.5 } // Phase 3 buff
        };
        
        // State
        this.state = 'idle'; // idle, engaging, combat, defeated
        this.target = null;
        this.inCombat = false;
        
        // AI interval
        this.aiInterval = null;
        this.enrageCheckInterval = null;
    }
    
    /**
     * Start the boss encounter
     */
    startEncounter(players) {
        if (players.length < this.minPlayers) {
            return {
                success: false,
                error: `Requires at least ${this.minPlayers} players (${players.length} present)`
            };
        }
        
        if (players.length > this.maxPlayers) {
            return {
                success: false,
                error: `Maximum ${this.maxPlayers} players allowed (${players.length} present)`
            };
        }
        
        this.raidGroup = players.map(p => p.id || p);
        this.activePlayers.clear();
        
        for (const player of players) {
            this.activePlayers.set(player.id || player, {
                damageDealt: 0,
                isAlive: true
            });
        }
        
        this.state = 'engaging';
        this.combatStartTime = Date.now();
        
        // Start AI
        this.startAI();
        this.startEnrageTimer();
        
        // Initial summons for phase 1
        this.summonRoyalGuards(2);
        
        this.emit('boss:encounter_started', {
            bossId: this.id,
            bossName: this.name,
            players: this.raidGroup,
            phase: this.currentPhase,
            enrageTimer: this.enrageTimer
        });
        
        return { success: true, message: 'The King rises from his throne!' };
    }
    
    startAI() {
        this.aiInterval = setInterval(() => this.updateAI(), 1000);
    }
    
    startEnrageTimer() {
        this.enrageCheckInterval = setInterval(() => {
            if (this.inCombat && !this.isEnraged) {
                const elapsed = Date.now() - this.combatStartTime;
                if (elapsed >= this.enrageTimer) {
                    this.enrage();
                }
            }
        }, 5000);
    }
    
    updateAI() {
        if (this.state === 'defeated') return;
        
        // Check phase transitions
        this.checkPhaseTransition();
        
        // Check if should summon more guards
        this.checkSummons();
        
        // Use abilities based on phase
        this.useAbilities();
        
        // Basic attack if target in range
        if (this.target && this.distanceTo(this.target) <= this.attackRange) {
            this.swordStrike(this.target);
        }
    }
    
    checkPhaseTransition() {
        const hpPercent = this.hp / this.maxHp;
        
        // Check for phase 2
        if (this.currentPhase === 1 && hpPercent <= this.phaseThresholds[2]) {
            this.transitionToPhase(2);
        }
        // Check for phase 3
        else if (this.currentPhase === 2 && hpPercent <= this.phaseThresholds[3]) {
            this.transitionToPhase(3);
        }
        // Check for phase 4
        else if (this.currentPhase === 3 && hpPercent <= this.phaseThresholds[4]) {
            this.transitionToPhase(4);
        }
    }
    
    transitionToPhase(phase) {
        this.currentPhase = phase;
        
        const phaseMessages = {
            2: 'The King raises his voice! "Guards! To me!"',
            3: 'King Eldor\'s eyes glow with fury! "You dare challenge the crown?!"',
            4: 'The King channels his final power! "FOR ELDORIA!"'
        };
        
        this.emit('boss:phase_transition', {
            bossId: this.id,
            phase: phase,
            message: phaseMessages[phase],
            hpPercent: this.hp / this.maxHp
        });
        
        // Phase specific actions
        if (phase === 2) {
            this.summonRoyalGuards(4);
        } else if (phase === 3) {
            this.activateLastStand();
            this.summonKnights(2);
            this.summonRoyalGuards(4);
        } else if (phase === 4) {
            // Summon all remaining
            this.summonKnights(4);
            this.summonRoyalGuards(6);
        }
    }
    
    activateLastStand() {
        if (this.abilities.lastStand.used) return;
        
        this.abilities.lastStand.used = true;
        this.baseDamage *= this.abilities.lastStand.buffAmount;
        this.armor += 20;
        
        this.emit('boss:last_stand', {
            bossId: this.id,
            message: 'King Eldor enters his Last Stand!',
            damageBuff: this.abilities.lastStand.buffAmount,
            armorBuff: 20
        });
    }
    
    useAbilities() {
        const now = Date.now();
        
        // Shield Bash
        if (this.canUseAbility('shieldBash') && this.target) {
            this.shieldBash(this.target);
        }
        
        // Phase 2+ abilities
        if (this.currentPhase >= 2) {
            // Self Heal
            if (this.canUseAbility('selfHeal') && this.hp < this.maxHp * 0.5) {
                this.selfHeal();
            }
            
            // Royal Command (Fear)
            if (this.canUseAbility('royalCommand')) {
                this.royalCommand();
            }
        }
        
        // Phase 3+ abilities
        if (this.currentPhase >= 3) {
            // Cleave
            if (this.canUseAbility('cleave')) {
                this.cleave();
            }
        }
        
        // Phase 4 abilities
        if (this.currentPhase >= 4) {
            // Last Decree (Ultimate)
            if (this.canUseAbility('lastDecree')) {
                this.lastDecree();
            }
        }
    }
    
    canUseAbility(abilityName) {
        const ability = this.abilities[abilityName];
        const now = Date.now();
        return now - ability.lastUse >= ability.cooldown;
    }
    
    swordStrike(target) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;
        
        this.lastAttackTime = now;
        
        const damage = Math.floor(this.baseDamage * (0.9 + Math.random() * 0.2));
        
        this.emit('boss:attack', {
            bossId: this.id,
            target: target.id || target,
            ability: 'sword_strike',
            damage: damage
        });
        
        return damage;
    }
    
    shieldBash(target) {
        this.abilities.shieldBash.lastUse = Date.now();
        
        const damage = Math.floor(this.baseDamage * 1.3);
        
        this.emit('boss:ability', {
            bossId: this.id,
            ability: 'shield_bash',
            target: target.id || target,
            damage: damage,
            stunDuration: this.abilities.shieldBash.stunDuration
        });
        
        return damage;
    }
    
    royalCommand() {
        this.abilities.royalCommand.lastUse = Date.now();
        
        this.emit('boss:ability', {
            bossId: this.id,
            ability: 'royal_command',
            message: 'Kneel before your King!',
            fearDuration: this.abilities.royalCommand.fearDuration,
            affects: 'all_players'
        });
    }
    
    selfHeal() {
        this.abilities.selfHeal.lastUse = Date.now();
        
        const healAmount = Math.floor(this.maxHp * this.abilities.selfHeal.amount);
        this.hp = Math.min(this.maxHp, this.hp + healAmount);
        
        this.emit('boss:heal', {
            bossId: this.id,
            amount: healAmount,
            hp: this.hp,
            maxHp: this.maxHp
        });
    }
    
    cleave() {
        this.abilities.cleave.lastUse = Date.now();
        
        const damage = Math.floor(this.baseDamage * 1.5);
        
        this.emit('boss:ability', {
            bossId: this.id,
            ability: 'cleave',
            damage: damage,
            range: this.abilities.cleave.range,
            affects: 'nearby_players'
        });
    }
    
    lastDecree() {
        this.abilities.lastDecree.lastUse = Date.now();
        
        const damage = this.abilities.lastDecree.damage;
        
        this.emit('boss:ultimate', {
            bossId: this.id,
            ability: 'last_decree',
            message: 'The King unleashes his FINAL DECREE!',
            damage: damage,
            affects: 'all_players'
        });
    }
    
    summonRoyalGuards(count) {
        this.abilities.summonGuards.lastUse = Date.now();
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const distance = 80;
            const summonX = this.x + Math.cos(angle) * distance;
            const summonY = this.y + Math.sin(angle) * distance;
            
            const guardId = `summoned_guard_${Date.now()}_${i}`;
            this.activeSummons.set(guardId, {
                id: guardId,
                type: 'royal_guard',
                x: summonX,
                y: summonY,
                hp: 200,
                maxHp: 200,
                damage: 25
            });
        }
        
        this.emit('boss:summon', {
            bossId: this.id,
            type: 'royal_guards',
            count: count,
            summons: Array.from(this.activeSummons.values())
        });
    }
    
    summonKnights(count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 40;
            const summonX = this.x + Math.cos(angle) * distance;
            const summonY = this.y + Math.sin(angle) * distance;
            
            const knightId = `summoned_knight_${Date.now()}_${i}`;
            this.activeSummons.set(knightId, {
                id: knightId,
                type: 'knight',
                x: summonX,
                y: summonY,
                hp: 300,
                maxHp: 300,
                damage: 40
            });
        }
        
        this.emit('boss:summon', {
            bossId: this.id,
            type: 'knights',
            count: count,
            summons: Array.from(this.activeSummons.values())
        });
    }
    
    checkSummons() {
        const maxSummons = this.summonLimits[this.currentPhase] || 0;
        const currentSummons = this.activeSummons.size;
        
        if (currentSummons < maxSummons / 2 && this.canUseAbility('summonGuards')) {
            // Replenish summons
            if (this.currentPhase >= 3) {
                this.summonKnights(2);
            }
            this.summonRoyalGuards(Math.min(2, maxSummons - this.activeSummons.size));
        }
    }
    
    enrage() {
        this.isEnraged = true;
        this.baseDamage *= 2;
        this.attackCooldown = 1000; // Attack faster
        
        this.emit('boss:enrage', {
            bossId: this.id,
            message: 'King Eldor enters BERSERK RAGE! The raid is doomed!',
            damageMultiplier: 2
        });
    }
    
    takeDamage(amount, attacker) {
        const actualDamage = Math.max(1, amount - this.armor);
        this.hp -= actualDamage;
        
        // Track damage for loot distribution
        const playerId = attacker.id || attacker;
        if (this.activePlayers.has(playerId)) {
            const playerData = this.activePlayers.get(playerId);
            playerData.damageDealt += actualDamage;
        }
        
        // First hit starts combat
        if (!this.inCombat) {
            this.inCombat = true;
            this.state = 'combat';
        }
        
        // Set as target if no target
        if (!this.target) {
            this.target = attacker;
        }
        
        if (this.hp <= 0) {
            return this.defeat();
        }
        
        return {
            hp: this.hp,
            maxHp: this.maxHp,
            damageTaken: actualDamage,
            phase: this.currentPhase
        };
    }
    
    defeat() {
        this.state = 'defeated';
        clearInterval(this.aiInterval);
        clearInterval(this.enrageCheckInterval);
        
        // Calculate rewards
        const rewards = this.calculateRewards();
        
        this.emit('boss:defeated', {
            bossId: this.id,
            bossName: this.name,
            rewards: rewards,
            participants: Array.from(this.activePlayers.entries()).map(([id, data]) => ({
                playerId: id,
                damageDealt: data.damageDealt
            }))
        });
        
        // Notify zone to record kill
        this.zone.recordBossKill(
            Array.from(this.activePlayers.keys())[0],
            Array.from(this.activePlayers.keys()),
            rewards
        );
        
        return {
            defeated: true,
            rewards: rewards
        };
    }
    
    calculateRewards() {
        const baseGold = 500;
        const damageData = Array.from(this.activePlayers.values());
        const totalDamage = damageData.reduce((sum, d) => sum + d.damageDealt, 0);
        
        const rewards = {
            gold: {},
            items: [
                { item: 'kings_crown', chance: 0.3, isLegendary: true },
                { item: 'royal_scepter', chance: 0.5, isEpic: true },
                { item: 'eldoria_seal', chance: 0.8, isRare: true }
            ],
            title: 'Kingslayer'
        };
        
        // Distribute gold based on damage contribution
        for (const [playerId, data] of this.activePlayers) {
            if (data.damageDealt > 0) {
                const contribution = data.damageDealt / totalDamage;
                rewards.gold[playerId] = Math.floor(baseGold + (contribution * baseGold));
            }
        }
        
        return rewards;
    }
    
    removeSummon(summonId) {
        this.activeSummons.delete(summonId);
    }
    
    distanceTo(position) {
        const dx = this.x - position.x;
        const dy = this.y - position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getBossData() {
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
            state: this.state,
            isEnraged: this.isEnraged,
            activeSummons: this.activeSummons.size,
            participants: this.activePlayers.size
        };
    }
    
    cleanup() {
        if (this.aiInterval) clearInterval(this.aiInterval);
        if (this.enrageCheckInterval) clearInterval(this.enrageCheckInterval);
    }
}

module.exports = KingEldor;
