/**
 * Eldoria Mobs Test Suite
 * Tests for all 7 Eldoria mobs
 */

const ForestDeer = require('../../server/mobs/eldoria/ForestDeer');
const WildBoar = require('../../server/mobs/eldoria/WildBoar');
const Bandit = require('../../server/mobs/eldoria/Bandit');
const Knight = require('../../server/mobs/eldoria/Knight');
const RoyalGuard = require('../../server/mobs/eldoria/RoyalGuard');
const CaveTroll = require('../../server/mobs/eldoria/CaveTroll');
const IronGolem = require('../../server/mobs/eldoria/IronGolem');

describe('Eldoria Mobs', () => {
    afterEach(() => {
        jest.clearAllTimers();
    });

    describe('Forest Deer (Passive)', () => {
        let deer;
        let mockZone;

        beforeEach(() => {
            mockZone = { id: 'eldoria' };
            deer = new ForestDeer(mockZone, { x: 100, y: 100 });
        });

        test('should initialize with correct stats', () => {
            expect(deer.level).toBe(20);
            expect(deer.maxHp).toBe(80);
            expect(deer.damage).toBe(0); // Passive
            expect(deer.behavior).toBe('flee');
        });

        test('should be passive type', () => {
            expect(deer.type).toBe('passive');
        });

        test('should have drops configured', () => {
            expect(deer.drops).toBeDefined();
            expect(deer.drops.length).toBeGreaterThan(0);
        });
    });

    describe('Wild Boar (Neutral)', () => {
        let boar;
        let mockZone;

        beforeEach(() => {
            mockZone = { id: 'eldoria' };
            boar = new WildBoar(mockZone, { x: 100, y: 100 });
        });

        test('should initialize with correct stats', () => {
            expect(boar.level).toBe(22);
            expect(boar.maxHp).toBe(120);
            expect(boar.damage).toBe(15);
            expect(boar.behavior).toBe('charge');
        });

        test('should be neutral type', () => {
            expect(boar.type).toBe('neutral');
        });

        test('should have drops configured', () => {
            expect(boar.drops).toBeDefined();
            expect(boar.drops.length).toBeGreaterThan(0);
        });
    });

    describe('Bandit (Humanoid)', () => {
        let bandit;
        let mockZone;

        beforeEach(() => {
            mockZone = { id: 'eldoria' };
            bandit = new Bandit(mockZone, { x: 100, y: 100 });
        });

        test('should initialize with correct stats', () => {
            expect(bandit.level).toBe(24);
            expect(bandit.maxHp).toBeGreaterThan(100);
            expect(bandit.damage).toBeGreaterThan(0);
        });

        test('should be aggressive type', () => {
            expect(bandit.type).toBe('aggressive');
        });
    });

    describe('Knight (Elite)', () => {
        let knight;
        let mockZone;

        beforeEach(() => {
            mockZone = { id: 'eldoria' };
            knight = new Knight(mockZone, { x: 100, y: 100 });
        });

        test('should initialize with elite stats', () => {
            expect(knight.level).toBe(38);
            expect(knight.maxHp).toBe(450);
            expect(knight.armor).toBeGreaterThan(0);
        });

        test('should be aggressive type', () => {
            expect(knight.type).toBe('aggressive');
        });
    });

    describe('Royal Guard (Elite)', () => {
        let guard;
        let mockZone;

        beforeEach(() => {
            mockZone = { id: 'eldoria' };
            guard = new RoyalGuard(mockZone, { x: 100, y: 100 });
        });

        test('should initialize with elite stats', () => {
            expect(guard.level).toBe(35);
            expect(guard.maxHp).toBe(350);
        });

        test('should be neutral type', () => {
            expect(guard.type).toBe('neutral');
        });
    });

    describe('Cave Troll (Dungeon)', () => {
        let troll;
        let mockZone;

        beforeEach(() => {
            mockZone = { id: 'eldoria' };
            troll = new CaveTroll(mockZone, { x: 100, y: 100 });
        });

        test('should initialize with high HP', () => {
            expect(troll.level).toBe(32);
            expect(troll.maxHp).toBe(500);
        });

        test('should be aggressive type', () => {
            expect(troll.type).toBe('aggressive');
        });
    });

    describe('Iron Golem (Construct)', () => {
        let golem;
        let mockZone;

        beforeEach(() => {
            mockZone = { id: 'eldoria' };
            golem = new IronGolem(mockZone, { x: 100, y: 100 });
        });

        test('should initialize with construct stats', () => {
            expect(golem.level).toBe(28);
            expect(golem.maxHp).toBe(400);
            expect(golem.armor).toBe(50);
        });

        test('should be aggressive type', () => {
            expect(golem.type).toBe('aggressive');
        });

        test('should have high armor', () => {
            expect(golem.armor).toBeGreaterThan(40);
        });
    });
});
