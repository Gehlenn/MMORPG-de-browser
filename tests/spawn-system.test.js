/**
 * Spawn System Test Suite v0.3.6v
 * Comprehensive testing for SpawnManager, ZoneManager, BossManager, EventManager
 */

const { describe, test, expect, beforeEach, afterEach } = require('@vitest/runner');
const { vi } = require('vitest');

// Import systems to test
const SpawnManager = require('../server/SpawnManager.js');
const ZoneManager = require('../server/ZoneManager.js');
const BossManager = require('../server/BossManager.js');
const EventManager = require('../server/EventManager.js');

describe('Spawn System v0.3.6v', () => {
    let spawnManager;
    let zoneManager;
    let bossManager;
    let eventManager;

    beforeEach(() => {
        // Initialize fresh instances for each test
        spawnManager = new SpawnManager();
        zoneManager = new ZoneManager();
        bossManager = new BossManager();
        eventManager = new EventManager();
    });

    afterEach(() => {
        // Clean up after each test
        if (spawnManager) spawnManager.clearAllSpawns();
        if (zoneManager) zoneManager.zones.clear();
        if (bossManager) bossManager.activeBosses.clear();
        if (eventManager) eventManager.activeEvents.clear();
    });

    describe('SpawnManager', () => {
        test('should initialize correctly', () => {
            expect(spawnManager).toBeDefined();
            expect(spawnManager.spawns).toBeInstanceOf(Map);
            expect(spawnManager.respawnTimers).toBeInstanceOf(Map);
            expect(spawnManager.config).toBeDefined();
        });

        test('should setup zones correctly', () => {
            spawnManager.setupZoneLimits();
            
            expect(spawnManager.spawnLimits.size).toBeGreaterThan(0);
            expect(spawnManager.activeMobs.size).toBeGreaterThan(0);
            
            // Check specific zones
            expect(spawnManager.spawnLimits.has('zone_1')).toBe(true);
            expect(spawnManager.spawnLimits.get('zone_1')).toBe(8);
        });

        test('should spawn initial mobs', () => {
            spawnManager.setupZoneLimits();
            spawnManager.spawnInitialMobs();
            
            const allMobs = spawnManager.getAllActiveMobs();
            expect(allMobs.length).toBeGreaterThan(0);
            
            // Check mob structure
            const firstMob = allMobs[0];
            expect(firstMob).toHaveProperty('id');
            expect(firstMob).toHaveProperty('type');
            expect(firstMob).toHaveProperty('zoneId');
            expect(firstMob).toHaveProperty('position');
            expect(firstMob).toHaveProperty('stats');
        });

        test('should spawn mob in valid zone', () => {
            spawnManager.setupZoneLimits();
            
            const mob = spawnManager.spawnMob('zone_1', 'goblin');
            
            expect(mob).toBeDefined();
            expect(mob.type).toBe('goblin');
            expect(mob.zoneId).toBe('zone_1');
            expect(mob.stats).toBeDefined();
            expect(mob.stats.hp).toBeGreaterThan(0);
        });

        test('should respect spawn limits', () => {
            spawnManager.setupZoneLimits();
            
            // Fill zone to capacity
            const zoneLimit = spawnManager.spawnLimits.get('zone_1');
            const spawnedMobs = [];
            
            for (let i = 0; i < zoneLimit + 5; i++) {
                const mob = spawnManager.spawnMob('zone_1', 'goblin');
                if (mob) spawnedMobs.push(mob);
            }
            
            expect(spawnedMobs.length).toBeLessThanOrEqual(zoneLimit);
        });

        test('should remove mob correctly', () => {
            spawnManager.setupZoneLimits();
            
            const mob = spawnManager.spawnMob('zone_1', 'goblin');
            expect(mob).toBeDefined();
            
            const removed = spawnManager.removeMob(mob.id, 'death');
            expect(removed).toBe(true);
            
            const foundMob = spawnManager.spawns.get(mob.id);
            expect(foundMob).toBeUndefined();
        });

        test('should schedule respawn on death', () => {
            spawnManager.setupZoneLimits();
            
            const mob = spawnManager.spawnMob('zone_1', 'goblin');
            expect(mob).toBeDefined();
            
            // Mock setTimeout to test scheduling
            vi.useFakeTimers();
            
            spawnManager.removeMob(mob.id, 'death');
            
            // Check timer was created
            expect(spawnManager.respawnTimers.has(mob.id)).toBe(true);
            
            vi.useRealTimers();
        });

        test('should respawn mob after timer', () => {
            spawnManager.setupZoneLimits();
            
            const mob = spawnManager.spawnMob('zone_1', 'goblin');
            expect(mob).toBeDefined();
            
            // Mock setTimeout and trigger respawn
            vi.useFakeTimers();
            
            let respawnedMob = null;
            spawnManager.onRespawn = (newMob, originalMob) => {
                respawnedMob = newMob;
            };
            
            spawnManager.removeMob(mob.id, 'death');
            
            // Fast-forward time
            vi.advanceTimersByTime(10000);
            
            expect(respawnedMob).toBeDefined();
            expect(respawnedMob.type).toBe(mob.type);
            expect(respawnedMob.zoneId).toBe(mob.zoneId);
            expect(respawnedMob.isRespawn).toBe(true);
            
            vi.useRealTimers();
        });

        test('should generate valid positions', () => {
            const bounds = { x: 0, y: 0, width: 100, height: 100 };
            const position = spawnManager.generateRandomPosition(bounds);
            
            expect(position.x).toBeGreaterThanOrEqual(bounds.x);
            expect(position.x).toBeLessThanOrEqual(bounds.x + bounds.width);
            expect(position.y).toBeGreaterThanOrEqual(bounds.y);
            expect(position.y).toBeLessThanOrEqual(bounds.y + bounds.height);
        });

        test('should generate valid mob levels', () => {
            const levelRange = [5, 10];
            const level = spawnManager.generateMobLevel(levelRange);
            
            expect(level).toBeGreaterThanOrEqual(levelRange[0]);
            expect(level).toBeLessThanOrEqual(levelRange[1]);
        });

        test('should generate mob stats with variation', () => {
            const stats = spawnManager.generateMobStats('goblin');
            
            expect(stats).toHaveProperty('hp');
            expect(stats).toHaveProperty('attack');
            expect(stats).toHaveProperty('defense');
            expect(stats).toHaveProperty('speed');
            
            expect(stats.hp).toBeGreaterThan(0);
            expect(stats.attack).toBeGreaterThan(0);
            expect(stats.defense).toBeGreaterThanOrEqual(0);
            expect(stats.speed).toBeGreaterThan(0);
        });

        test('should calculate respawn time correctly', () => {
            const respawnTime = spawnManager.calculateRespawnTime('goblin');
            
            expect(respawnTime).toBeGreaterThanOrEqual(spawnManager.config.minRespawnTime);
            expect(respawnTime).toBeLessThanOrEqual(spawnManager.config.maxRespawnTime);
        });

        test('should get zone statistics', () => {
            spawnManager.setupZoneLimits();
            spawnManager.spawnInitialMobs();
            
            const stats = spawnManager.getStatistics();
            
            expect(stats).toHaveProperty('totalSpawns');
            expect(stats).toHaveProperty('activeTimers');
            expect(stats).toHaveProperty('zones');
            
            expect(typeof stats.totalSpawns).toBe('number');
            expect(typeof stats.activeTimers).toBe('number');
            expect(typeof stats.zones).toBe('object');
        });
    });

    describe('ZoneManager', () => {
        test('should initialize correctly', () => {
            expect(zoneManager).toBeDefined();
            expect(zoneManager.zones).toBeInstanceOf(Map);
            expect(zoneManager.mobPatrols).toBeInstanceOf(Map);
            expect(zoneManager.config).toBeDefined();
        });

        test('should setup zones correctly', () => {
            zoneManager.setupZones();
            
            expect(zoneManager.zones.size).toBeGreaterThan(0);
            
            // Check zone structure
            const firstZone = zoneManager.zones.values().next().value;
            expect(firstZone).toHaveProperty('id');
            expect(firstZone).toHaveProperty('name');
            expect(firstZone).toHaveProperty('type');
            expect(firstZone).toHaveProperty('levelRange');
            expect(firstZone).toHaveProperty('bounds');
            expect(firstZone).toHaveProperty('currentMobs');
            expect(firstZone).toHaveProperty('patrolPoints');
        });

        test('should detect zone at position', () => {
            zoneManager.setupZones();
            
            const position = { x: 250, y: 200 }; // Should be in zone_forest
            const zoneId = zoneManager.getZoneAtPosition(position);
            
            expect(zoneId).toBeDefined();
            expect(typeof zoneId).toBe('string');
        });

        test('should check position in zone bounds', () => {
            const bounds = { x: 0, y: 0, width: 100, height: 100 };
            
            // Position inside bounds
            const insidePos = { x: 50, y: 50 };
            expect(zoneManager.isPositionInZone(insidePos, bounds)).toBe(true);
            
            // Position outside bounds
            const outsidePos = { x: 150, y: 150 };
            expect(zoneManager.isPositionInZone(outsidePos, bounds)).toBe(false);
        });

        test('should add mob to zone', () => {
            zoneManager.setupZones();
            
            const mobId = 'test_mob_1';
            const zoneId = 'zone_forest';
            const position = { x: 100, y: 100 };
            
            const added = zoneManager.addMobToZone(mobId, zoneId, position);
            expect(added).toBe(true);
            
            const zone = zoneManager.getZoneData(zoneId);
            expect(zone.currentMobs).toContainEqual(
                expect.objectContaining({ id: mobId, position })
            );
        });

        test('should respect zone density limits', () => {
            zoneManager.setupZones();
            
            const zoneId = 'zone_forest';
            const zone = zoneManager.getZoneData(zoneId);
            const maxMobs = Math.floor(zone.baseLimit * zoneManager.config.maxDensityPerZone);
            
            // Add mobs up to and beyond limit
            let addedCount = 0;
            for (let i = 0; i < maxMobs + 5; i++) {
                const added = zoneManager.addMobToZone(`mob_${i}`, zoneId, { x: 100, y: 100 });
                if (added) addedCount++;
            }
            
            expect(addedCount).toBeLessThanOrEqual(maxMobs);
        });

        test('should remove mob from zone', () => {
            zoneManager.setupZones();
            
            const mobId = 'test_mob_1';
            const zoneId = 'zone_forest';
            const position = { x: 100, y: 100 };
            
            zoneManager.addMobToZone(mobId, zoneId, position);
            
            const removed = zoneManager.removeMobFromZone(mobId, zoneId);
            expect(removed).toBe(true);
            
            const zone = zoneManager.getZoneData(zoneId);
            const mobInZone = zone.currentMobs.find(mob => mob.id === mobId);
            expect(mobInZone).toBeUndefined();
        });

        test('should start mob patrol', () => {
            zoneManager.setupZones();
            
            const mobId = 'test_mob_1';
            const zoneId = 'zone_forest';
            
            zoneManager.addMobToZone(mobId, zoneId, { x: 100, y: 100 });
            
            expect(zoneManager.mobPatrols.has(mobId)).toBe(true);
            
            const patrolData = zoneManager.mobPatrols.get(mobId);
            expect(patrolData).toHaveProperty('mobId', mobId);
            expect(patrolData).toHaveProperty('zoneId', zoneId);
            expect(patrolData).toHaveProperty('targetPoint');
        });

        test('should generate patrol points', () => {
            const bounds = { x: 0, y: 0, width: 200, height: 200 };
            const patrolPoints = zoneManager.generatePatrolPoints(bounds);
            
            expect(patrolPoints.length).toBeGreaterThan(0);
            
            // Check patrol point structure
            const firstPoint = patrolPoints[0];
            expect(firstPoint).toHaveProperty('x');
            expect(firstPoint).toHaveProperty('y');
            expect(firstPoint).toHaveProperty('weight');
            
            // Check points are within bounds
            for (const point of patrolPoints) {
                expect(point.x).toBeGreaterThanOrEqual(bounds.x);
                expect(point.x).toBeLessThanOrEqual(bounds.x + bounds.width);
                expect(point.y).toBeGreaterThanOrEqual(bounds.y);
                expect(point.y).toBeLessThanOrEqual(bounds.y + bounds.height);
            }
        });

        test('should check zone transition eligibility', () => {
            zoneManager.setupZones();
            
            const canTransition = zoneManager.canTransitionToZone(
                'test_mob_1',
                'zone_forest',
                'zone_mountain'
            );
            
            expect(typeof canTransition).toBe('boolean');
        });

        test('should get zone statistics', () => {
            zoneManager.setupZones();
            
            const stats = zoneManager.getZoneStatistics();
            
            expect(stats).toHaveProperty('totalZones');
            expect(stats).toHaveProperty('totalMobs');
            expect(stats).toHaveProperty('totalPlayers');
            expect(stats).toHaveProperty('zones');
            
            expect(typeof stats.totalZones).toBe('number');
            expect(typeof stats.totalMobs).toBe('number');
            expect(typeof stats.totalPlayers).toBe('number');
            expect(typeof stats.zones).toBe('object');
        });
    });

    describe('BossManager', () => {
        test('should initialize correctly', () => {
            expect(bossManager).toBeDefined();
            expect(bossManager.activeBosses).toBeInstanceOf(Map);
            expect(bossManager.bossTimers).toBeInstanceOf(Map);
            expect(bossManager.config).toBeDefined();
        });

        test('should check boss spawn eligibility', () => {
            const canSpawn = bossManager.canSpawnBoss('dragon_lord');
            expect(typeof canSpawn).toBe('boolean');
        });

        test('should spawn boss correctly', () => {
            const boss = bossManager.spawnBoss('dragon_lord', 'zone_mountain');
            
            expect(boss).toBeDefined();
            expect(boss.type).toBe('dragon_lord');
            expect(boss.zoneId).toBe('zone_mountain');
            expect(boss.stats).toBeDefined();
            expect(boss.currentHp).toBe(boss.maxHp);
            expect(boss.participants).toBeInstanceOf(Map);
        });

        test('should generate boss stats with scaling', () => {
            const definition = bossManager.bossDefinitions['dragon_lord'];
            const stats = bossManager.generateBossStats(definition);
            
            expect(stats.hp).toBeGreaterThan(0);
            expect(stats.attack).toBeGreaterThan(0);
            expect(stats.defense).toBeGreaterThan(0);
            expect(stats.speed).toBeGreaterThan(0);
        });

        test('should register damage correctly', () => {
            const boss = bossManager.spawnBoss('dragon_lord', 'zone_mountain');
            const playerId = 'test_player_1';
            const damage = 100;
            
            const registered = bossManager.registerDamage(boss.id, playerId, damage);
            expect(registered).toBe(true);
            
            expect(boss.currentHp).toBe(boss.maxHp - damage);
            expect(boss.participants.get(playerId)).toBe(damage);
        });

        test('should handle boss death', () => {
            const boss = bossManager.spawnBoss('dragon_lord', 'zone_mountain');
            const playerId = 'test_player_1';
            
            // Mock reward distribution
            let rewardsDistributed = false;
            bossManager.onRewardDistributed = () => {
                rewardsDistributed = true;
            };
            
            // Deal lethal damage
            bossManager.registerDamage(boss.id, playerId, boss.maxHp);
            
            expect(boss.currentHp).toBe(0);
            expect(rewardsDistributed).toBe(true);
            expect(bossManager.activeBosses.has(boss.id)).toBe(false);
        });

        test('should trigger boss phases', () => {
            const boss = bossManager.spawnBoss('dragon_lord', 'zone_mountain');
            const playerId = 'test_player_1';
            
            // Deal damage to trigger phase 2 (50% HP)
            bossManager.registerDamage(boss.id, playerId, Math.floor(boss.maxHp * 0.6));
            expect(boss.phase).toBe(2);
            
            // Deal more damage to trigger phase 3 (25% HP)
            bossManager.registerDamage(boss.id, playerId, Math.floor(boss.maxHp * 0.3));
            expect(boss.phase).toBe(3);
        });

        test('should trigger enrage mode', () => {
            const boss = bossManager.spawnBoss('dragon_lord', 'zone_mountain');
            const playerId = 'test_player_1';
            
            // Deal damage to trigger enrage (10% HP)
            bossManager.registerDamage(boss.id, playerId, Math.floor(boss.maxHp * 0.95));
            
            expect(boss.isEnraged).toBe(true);
            expect(boss.stats.attack).toBeGreaterThan(bossManager.bossDefinitions['dragon_lord'].baseStats.attack);
        });

        test('should calculate respawn time correctly', () => {
            const respawnTime = bossManager.calculateRespawnTime('dragon_lord');
            
            expect(respawnTime).toBeGreaterThanOrEqual(0);
            expect(typeof respawnTime).toBe('number');
        });

        test('should distribute rewards based on participation', () => {
            const boss = bossManager.spawnBoss('dragon_lord', 'zone_mountain');
            
            // Add participants with different damage amounts
            boss.participants.set('player_1', 1000);
            boss.participants.set('player_2', 500);
            boss.participants.set('player_3', 100);
            
            const totalDamage = 1600;
            boss.currentHp = 0; // Boss defeated
            
            // Mock reward distribution
            const rewards = [];
            bossManager.onRewardDistributed = (playerId, rewardData) => {
                rewards.push({ playerId, rewardData });
            };
            
            bossManager.handleBossDeath(boss);
            
            expect(rewards.length).toBe(3); // All participants should get rewards
            
            // Check that higher damage gets better rewards
            const player1Rewards = rewards.find(r => r.playerId === 'player_1');
            const player3Rewards = rewards.find(r => r.playerId === 'player_3');
            
            expect(player1Rewards.rewardData.experience).toBeGreaterThan(player3Rewards.rewardData.experience);
        });

        test('should get boss statistics', () => {
            bossManager.initializeBossHistory();
            
            const stats = bossManager.getBossStatistics();
            
            expect(stats).toHaveProperty('activeBosses');
            expect(stats).toHaveProperty('totalSpawnAttempts');
            expect(stats).toHaveProperty('totalKills');
            expect(stats).toHaveProperty('bossTypes');
            
            expect(typeof stats.activeBosses).toBe('number');
            expect(typeof stats.totalSpawnAttempts).toBe('number');
            expect(typeof stats.totalKills).toBe('number');
            expect(typeof stats.bossTypes).toBe('object');
        });
    });

    describe('EventManager', () => {
        test('should initialize correctly', () => {
            expect(eventManager).toBeDefined();
            expect(eventManager.activeEvents).toBeInstanceOf(Map);
            expect(eventManager.eventSchedule).toBeInstanceOf(Map);
            expect(eventManager.config).toBeDefined();
        });

        test('should check event scheduling eligibility', () => {
            const canSchedule = eventManager.canScheduleEvent('goblin_invasion');
            expect(typeof canSchedule).toBe('boolean');
        });

        test('should start event correctly', () => {
            const event = eventManager.startEvent('goblin_invasion', 'zone_forest');
            
            expect(event).toBeDefined();
            expect(event.type).toBe('goblin_invasion');
            expect(event.zoneId).toBe('zone_forest');
            expect(event.isActive).toBe(true);
            expect(event.objectives).toBeInstanceOf(Array);
            expect(event.participants).toBeInstanceOf(Map);
        });

        test('should initialize objectives correctly', () => {
            const definition = eventManager.eventDefinitions['goblin_invasion'];
            const objectives = eventManager.initializeObjectives(definition.objectives);
            
            expect(objectives.length).toBe(definition.objectives.length);
            
            for (const objective of objectives) {
                expect(objective).toHaveProperty('type');
                expect(objective).toHaveProperty('progress', 0);
                expect(objective).toHaveProperty('completed', false);
                expect(objective).toHaveProperty('startTime');
            }
        });

        test('should register event participation', () => {
            const event = eventManager.startEvent('goblin_invasion', 'zone_forest');
            const playerId = 'test_player_1';
            
            const registered = eventManager.registerEventParticipation(event.id, playerId);
            expect(registered).toBe(true);
            
            expect(event.participants.has(playerId)).toBe(true);
            
            const participation = event.participants.get(playerId);
            expect(participation).toHaveProperty('joinedAt');
            expect(participation).toHaveProperty('contributions');
            expect(participation).toHaveProperty('participationScore', 0);
        });

        test('should register objective progress', () => {
            const event = eventManager.startEvent('goblin_invasion', 'zone_forest');
            const playerId = 'test_player_1';
            
            eventManager.registerEventParticipation(event.id, playerId);
            
            const updated = eventManager.registerObjectiveProgress(event.id, playerId, 'kill', 1);
            expect(updated).toBe(true);
            
            // Check player contribution
            const participation = event.participants.get(playerId);
            expect(participation.contributions.length).toBe(1);
            expect(participation.participationScore).toBe(1);
            
            // Check objective progress
            const killObjective = event.objectives.find(obj => obj.type === 'kill');
            expect(killObjective.progress).toBe(1);
        });

        test('should complete objectives when threshold reached', () => {
            const event = eventManager.startEvent('goblin_invasion', 'zone_forest');
            const playerId = 'test_player_1';
            
            eventManager.registerEventParticipation(event.id, playerId);
            
            // Mock objective completion
            let objectiveCompleted = false;
            eventManager.onObjectiveComplete = () => {
                objectiveCompleted = true;
            };
            
            // Complete kill objective (15 kills needed)
            for (let i = 0; i < 15; i++) {
                eventManager.registerObjectiveProgress(event.id, playerId, 'kill', 1);
            }
            
            expect(objectiveCompleted).toBe(true);
            
            const killObjective = event.objectives.find(obj => obj.type === 'kill');
            expect(killObjective.completed).toBe(true);
        });

        test('should calculate event difficulty scaling', () => {
            const baseDifficulty = 1.0;
            const playerCount = 5;
            
            const scaledDifficulty = eventManager.calculateScaledDifficulty(baseDifficulty, playerCount);
            
            expect(scaledDifficulty).toBeGreaterThan(baseDifficulty);
            expect(scaledDifficulty).toBe(baseDifficulty + (playerCount * eventManager.config.eventScalingFactor));
        });

        test('should end event and distribute rewards', () => {
            const event = eventManager.startEvent('goblin_invasion', 'zone_forest');
            const playerId = 'test_player_1';
            
            // Add participant and complete objectives
            eventManager.registerEventParticipation(event.id, playerId);
            
            // Complete all objectives for success
            for (const objective of event.objectives) {
                objective.progress = objective.count || 1;
                objective.completed = true;
            }
            event.completedObjectives = [...event.objectives];
            
            // Mock reward distribution
            let rewardsDistributed = false;
            eventManager.onRewardDistributed = () => {
                rewardsDistributed = true;
            };
            
            eventManager.endEvent(event.id);
            
            expect(rewardsDistributed).toBe(true);
            expect(eventManager.activeEvents.has(event.id)).toBe(false);
        });

        test('should calculate player rewards correctly', () => {
            const event = eventManager.startEvent('goblin_invasion', 'zone_forest');
            const definition = eventManager.eventDefinitions['goblin_invasion'];
            
            const participation = {
                playerId: 'test_player_1',
                joinedAt: Date.now(),
                contributions: [{ type: 'kill', progress: 10 }],
                damageDealt: 0,
                objectivesCompleted: 2,
                participationScore: 10
            };
            
            const results = {
                success: true,
                completionRate: 1.0,
                totalParticipants: 3,
                objectivesCompleted: 2,
                duration: 300000,
                topParticipants: [
                    { playerId: 'test_player_1', score: 10 },
                    { playerId: 'test_player_2', score: 8 }
                ]
            };
            
            const rewards = eventManager.calculatePlayerRewards(event, participation, results, definition);
            
            expect(rewards).toHaveProperty('experience');
            expect(rewards).toHaveProperty('gold');
            expect(rewards).toHaveProperty('items');
            
            expect(rewards.experience).toBeGreaterThan(0);
            expect(rewards.gold).toBeGreaterThan(0);
            expect(Array.isArray(rewards.items)).toBe(true);
        });

        test('should get event statistics', () => {
            eventManager.initializeEventHistory();
            
            const stats = eventManager.getEventStatistics();
            
            expect(stats).toHaveProperty('activeEvents');
            expect(stats).toHaveProperty('scheduledEvents');
            expect(stats).toHaveProperty('totalEvents');
            expect(stats).toHaveProperty('eventTypes');
            
            expect(typeof stats.activeEvents).toBe('number');
            expect(typeof stats.scheduledEvents).toBe('number');
            expect(typeof stats.totalEvents).toBe('number');
            expect(typeof stats.eventTypes).toBe('object');
        });
    });

    describe('Integration Tests', () => {
        test('should integrate spawn and zone managers', () => {
            // Setup both managers
            spawnManager.setupZoneLimits();
            zoneManager.setupZones();
            
            // Spawn mob
            const mob = spawnManager.spawnMob('zone_forest', 'goblin');
            expect(mob).toBeDefined();
            
            // Add to zone
            const added = zoneManager.addMobToZone(mob.id, 'zone_forest', mob.position);
            expect(added).toBe(true);
            
            // Check mob is in both systems
            const spawnMob = spawnManager.spawns.get(mob.id);
            const zoneMobs = zoneManager.getMobsInZone('zone_forest');
            
            expect(spawnMob).toBeDefined();
            expect(zoneMobs.some(m => m.id === mob.id)).toBe(true);
        });

        test('should handle boss event integration', () => {
            // Start event
            const event = eventManager.startEvent('dragon_attack', 'zone_mountain');
            expect(event).toBeDefined();
            
            // Spawn boss as part of event
            const boss = bossManager.spawnBoss('dragon_lord', 'zone_mountain');
            expect(boss).toBeDefined();
            
            // Register damage
            const playerId = 'test_player_1';
            bossManager.registerDamage(boss.id, playerId, 100);
            
            // Check boss has participant
            expect(boss.participants.has(playerId)).toBe(true);
            
            // End event
            eventManager.endEvent(event.id);
            expect(eventManager.activeEvents.has(event.id)).toBe(false);
        });

        test('should handle zone transitions with spawn system', () => {
            spawnManager.setupZoneLimits();
            zoneManager.setupZones();
            
            // Spawn mob in zone 1
            const mob = spawnManager.spawnMob('zone_forest', 'goblin');
            zoneManager.addMobToZone(mob.id, 'zone_forest', mob.position);
            
            // Check if transition is possible
            const canTransition = zoneManager.canTransitionToZone(
                mob.id,
                'zone_forest',
                'zone_mountain'
            );
            
            expect(typeof canTransition).toBe('boolean');
        });

        test('should handle event mob spawning', () => {
            const event = eventManager.startEvent('goblin_invasion', 'zone_forest');
            
            // Mock event mob spawning
            const mobData = {
                id: 'event_mob_1',
                type: 'goblin',
                eventId: event.id,
                position: { x: 100, y: 100 },
                stats: { hp: 50, attack: 8, defense: 3 }
            };
            
            // Trigger event spawn
            if (eventManager.onEventSpawn) {
                eventManager.onEventSpawn(mobData, event);
            }
            
            expect(mobData.eventId).toBe(event.id);
            expect(mobData.type).toBe('goblin');
        });
    });

    describe('Performance Tests', () => {
        test('should handle large number of spawns efficiently', () => {
            spawnManager.setupZoneLimits();
            
            const startTime = Date.now();
            
            // Spawn many mobs
            for (let i = 0; i < 100; i++) {
                spawnManager.spawnMob('zone_forest', 'goblin');
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete within reasonable time (less than 1 second)
            expect(duration).toBeLessThan(1000);
            
            const allMobs = spawnManager.getAllActiveMobs();
            expect(allMobs.length).toBeGreaterThan(0);
        });

        test('should handle zone operations efficiently', () => {
            zoneManager.setupZones();
            
            const startTime = Date.now();
            
            // Add many mobs to zones
            for (let i = 0; i < 50; i++) {
                zoneManager.addMobToZone(`mob_${i}`, 'zone_forest', { x: 100, y: 100 });
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(500);
        });

        test('should handle event operations efficiently', () => {
            const startTime = Date.now();
            
            // Start multiple events
            const events = [];
            for (let i = 0; i < 5; i++) {
                const event = eventManager.startEvent('goblin_invasion', 'zone_forest');
                events.push(event);
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(1000);
            expect(events.length).toBe(5);
        });
    });

    describe('Error Handling Tests', () => {
        test('should handle invalid zone IDs gracefully', () => {
            spawnManager.setupZoneLimits();
            
            const mob = spawnManager.spawnMob('invalid_zone', 'goblin');
            expect(mob).toBeNull();
        });

        test('should handle invalid boss types gracefully', () => {
            const boss = bossManager.spawnBoss('invalid_boss', 'zone_forest');
            expect(boss).toBeNull();
        });

        test('should handle invalid event types gracefully', () => {
            const event = eventManager.startEvent('invalid_event', 'zone_forest');
            expect(event).toBeNull();
        });

        test('should handle missing mob data gracefully', () => {
            const removed = spawnManager.removeMob('non_existent_mob', 'death');
            expect(removed).toBe(false);
        });

        test('should handle damage to non-existent boss gracefully', () => {
            const registered = bossManager.registerDamage('non_existent_boss', 'player_1', 100);
            expect(registered).toBe(false);
        });
    });
});
