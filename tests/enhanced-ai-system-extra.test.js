/**
 * Enhanced AI System - Extra Modules Tests
 * Tests for DecisionTree, EventReactions, AIReactionHandler, and DeltaCompressor
 */

const DecisionTree = require('../server/ai/DecisionTree');
const EventReactions = require('../server/ai/EventReactions');
const AIReactionHandler = require('../server/ai/AIReactionHandler');
const DeltaCompressor = require('../server/ai/DeltaCompressor');

describe('Enhanced AI System - Extra Modules', () => {
    describe('DecisionTree', () => {
        let decisionTree;

        beforeEach(() => {
            decisionTree = new DecisionTree();
        });

        test('should initialize with empty trees', () => {
            expect(decisionTree.trees).toBeInstanceOf(Map);
            expect(decisionTree.trees.size).toBe(0);
        });

        test('should add a decision tree', () => {
            const tree = {
                root: {
                    type: 'condition',
                    condition: 'health_low',
                    true: { type: 'action', action: 'flee' },
                    false: { type: 'action', action: 'attack' }
                }
            };
            decisionTree.addTree('combat', tree);
            expect(decisionTree.trees.has('combat')).toBe(true);
        });

        test('should get a decision tree', () => {
            const tree = {
                root: {
                    type: 'condition',
                    condition: 'health_low',
                    true: { type: 'action', action: 'flee' },
                    false: { type: 'action', action: 'attack' }
                }
            };
            decisionTree.addTree('combat', tree);
            const retrieved = decisionTree.getTree('combat');
            expect(retrieved).toBeDefined();
            expect(retrieved.root.type).toBe('condition');
        });

        test('should return null for non-existent tree', () => {
            const result = decisionTree.getTree('non_existent');
            expect(result).toBeNull();
        });

        test('should remove a decision tree', () => {
            const tree = {
                root: { type: 'action', action: 'idle' }
            };
            decisionTree.addTree('test', tree);
            decisionTree.removeTree('test');
            expect(decisionTree.trees.has('test')).toBe(false);
        });

        test('should evaluate a simple action node', () => {
            const node = { type: 'action', action: 'attack' };
            const context = {};
            const result = decisionTree.evaluateNode(node, context);
            expect(result).toBe('attack');
        });

        test('should evaluate a condition node - true branch', () => {
            const node = {
                type: 'condition',
                condition: 'health_low',
                true: { type: 'action', action: 'flee' },
                false: { type: 'action', action: 'attack' }
            };
            const context = { health_low: true };
            const result = decisionTree.evaluateNode(node, context);
            expect(result).toBe('flee');
        });

        test('should evaluate a condition node - false branch', () => {
            const node = {
                type: 'condition',
                condition: 'health_low',
                true: { type: 'action', action: 'flee' },
                false: { type: 'action', action: 'attack' }
            };
            const context = { health_low: false };
            const result = decisionTree.evaluateNode(node, context);
            expect(result).toBe('attack');
        });

        test('should evaluate a nested condition node', () => {
            const node = {
                type: 'condition',
                condition: 'has_target',
                true: {
                    type: 'condition',
                    condition: 'in_range',
                    true: { type: 'action', action: 'attack' },
                    false: { type: 'action', action: 'chase' }
                },
                false: { type: 'action', action: 'patrol' }
            };
            const context = { has_target: true, in_range: true };
            const result = decisionTree.evaluateNode(node, context);
            expect(result).toBe('attack');
        });

        test('should evaluate condition with missing context', () => {
            const node = {
                type: 'condition',
                condition: 'unknown_condition',
                true: { type: 'action', action: 'option_a' },
                false: { type: 'action', action: 'option_b' }
            };
            const context = {};
            const result = decisionTree.evaluateNode(node, context);
            expect(result).toBe('option_b');
        });

        test('should evaluate a selector node - first success', () => {
            const node = {
                type: 'selector',
                children: [
                    { type: 'condition', condition: 'can_attack', true: { type: 'action', action: 'attack' }, false: { type: 'action', action: 'skip' } },
                    { type: 'action', action: 'patrol' }
                ]
            };
            const context = { can_attack: true };
            const result = decisionTree.evaluateNode(node, context);
            expect(result).toBe('attack');
        });

        test('should evaluate a selector node - fallback', () => {
            const node = {
                type: 'selector',
                children: [
                    { type: 'condition', condition: 'can_attack', true: { type: 'action', action: 'attack' }, false: { type: 'action', action: null } },
                    { type: 'action', action: 'patrol' }
                ]
            };
            const context = { can_attack: false };
            const result = decisionTree.evaluateNode(node, context);
            expect(result).toBe('patrol');
        });

        test('should evaluate a sequence node - all success', () => {
            const node = {
                type: 'sequence',
                children: [
                    { type: 'action', action: 'step1' },
                    { type: 'action', action: 'step2' }
                ]
            };
            const context = {};
            const result = decisionTree.evaluateNode(node, context);
            expect(result).toEqual(['step1', 'step2']);
        });

        test('should evaluate with custom evaluator', () => {
            decisionTree.addEvaluator('custom_check', (context) => context.custom_value > 10);
            const node = {
                type: 'condition',
                condition: 'custom_check',
                true: { type: 'action', action: 'success' },
                false: { type: 'action', action: 'fail' }
            };
            const context = { custom_value: 15 };
            const result = decisionTree.evaluateNode(node, context);
            expect(result).toBe('success');
        });

        test('should clear all trees', () => {
            decisionTree.addTree('tree1', { root: { type: 'action', action: 'test' } });
            decisionTree.addTree('tree2', { root: { type: 'action', action: 'test' } });
            decisionTree.clear();
            expect(decisionTree.trees.size).toBe(0);
        });

        test('should get all tree names', () => {
            decisionTree.addTree('tree1', { root: { type: 'action', action: 'test' } });
            decisionTree.addTree('tree2', { root: { type: 'action', action: 'test' } });
            const names = decisionTree.getTreeNames();
            expect(names).toContain('tree1');
            expect(names).toContain('tree2');
        });

        test('should check if tree exists', () => {
            decisionTree.addTree('existing', { root: { type: 'action', action: 'test' } });
            expect(decisionTree.hasTree('existing')).toBe(true);
            expect(decisionTree.hasTree('non_existent')).toBe(false);
        });

        test('should clone a tree', () => {
            const original = {
                root: { type: 'action', action: 'original' }
            };
            decisionTree.addTree('original', original);
            const clone = decisionTree.cloneTree('original', 'cloned');
            expect(decisionTree.hasTree('cloned')).toBe(true);
            expect(clone.root.action).toBe('original');
        });

        test('should merge trees', () => {
            const tree1 = {
                root: { type: 'action', action: 'action1' }
            };
            const tree2 = {
                root: { type: 'action', action: 'action2' }
            };
            decisionTree.addTree('tree1', tree1);
            decisionTree.addTree('tree2', tree2);
            decisionTree.mergeTrees('merged', ['tree1', 'tree2']);
            expect(decisionTree.hasTree('merged')).toBe(true);
        });

        test('should validate a tree structure', () => {
            const validTree = {
                root: { type: 'action', action: 'test' }
            };
            const isValid = decisionTree.validateTree(validTree);
            expect(isValid).toBe(true);
        });

        test('should invalidate an invalid tree', () => {
            const invalidTree = {
                root: { type: 'unknown', action: 'test' }
            };
            const isValid = decisionTree.validateTree(invalidTree);
            expect(isValid).toBe(false);
        });

        test('should get tree statistics', () => {
            const tree = {
                root: {
                    type: 'condition',
                    condition: 'test',
                    true: { type: 'action', action: 'a' },
                    false: { type: 'action', action: 'b' }
                }
            };
            decisionTree.addTree('stats_tree', tree);
            const stats = decisionTree.getTreeStats('stats_tree');
            expect(stats).toBeDefined();
            expect(stats.nodeCount).toBeGreaterThan(0);
        });
    });

    describe('EventReactions', () => {
        let eventReactions;

        beforeEach(() => {
            eventReactions = new EventReactions();
        });

        test('should initialize with empty reactions', () => {
            expect(eventReactions.reactions).toBeInstanceOf(Map);
            expect(eventReactions.reactions.size).toBe(0);
        });

        test('should register a reaction to an event', () => {
            const reaction = jest.fn();
            eventReactions.on('player_damage', reaction);
            expect(eventReactions.reactions.has('player_damage')).toBe(true);
        });

        test('should trigger a reaction when event occurs', () => {
            const reaction = jest.fn();
            eventReactions.on('player_damage', reaction);
            eventReactions.emit('player_damage', { playerId: 'p1', damage: 10 });
            expect(reaction).toHaveBeenCalledWith({ playerId: 'p1', damage: 10 });
        });

        test('should trigger multiple reactions for same event', () => {
            const reaction1 = jest.fn();
            const reaction2 = jest.fn();
            eventReactions.on('player_damage', reaction1);
            eventReactions.on('player_damage', reaction2);
            eventReactions.emit('player_damage', { damage: 10 });
            expect(reaction1).toHaveBeenCalled();
            expect(reaction2).toHaveBeenCalled();
        });

        test('should remove a specific reaction', () => {
            const reaction = jest.fn();
            eventReactions.on('test_event', reaction);
            eventReactions.off('test_event', reaction);
            eventReactions.emit('test_event', {});
            expect(reaction).not.toHaveBeenCalled();
        });

        test('should remove all reactions for an event', () => {
            const reaction1 = jest.fn();
            const reaction2 = jest.fn();
            eventReactions.on('test_event', reaction1);
            eventReactions.on('test_event', reaction2);
            eventReactions.removeAll('test_event');
            eventReactions.emit('test_event', {});
            expect(reaction1).not.toHaveBeenCalled();
            expect(reaction2).not.toHaveBeenCalled();
        });

        test('should handle emit with no reactions', () => {
            expect(() => {
                eventReactions.emit('non_existent_event', {});
            }).not.toThrow();
        });

        test('should get registered events', () => {
            eventReactions.on('event1', () => {});
            eventReactions.on('event2', () => {});
            const events = eventReactions.getEvents();
            expect(events).toContain('event1');
            expect(events).toContain('event2');
        });

        test('should check if event has reactions', () => {
            eventReactions.on('has_reactions', () => {});
            expect(eventReactions.hasReactions('has_reactions')).toBe(true);
            expect(eventReactions.hasReactions('no_reactions')).toBe(false);
        });

        test('should get reaction count for event', () => {
            eventReactions.on('count_test', () => {});
            eventReactions.on('count_test', () => {});
            expect(eventReactions.getReactionCount('count_test')).toBe(2);
        });

        test('should create a one-time reaction', () => {
            const reaction = jest.fn();
            eventReactions.once('one_time', reaction);
            eventReactions.emit('one_time', {});
            eventReactions.emit('one_time', {});
            expect(reaction).toHaveBeenCalledTimes(1);
        });

        test('should pipe events to another emitter', () => {
            const target = new EventReactions();
            const reaction = jest.fn();
            target.on('piped', reaction);
            eventReactions.pipe('original', target, 'piped');
            eventReactions.emit('original', { data: 'test' });
            expect(reaction).toHaveBeenCalledWith({ data: 'test' });
        });

        test('should pause and resume reactions', () => {
            const reaction = jest.fn();
            eventReactions.on('paused_event', reaction);
            eventReactions.pause();
            eventReactions.emit('paused_event', {});
            expect(reaction).not.toHaveBeenCalled();
            eventReactions.resume();
            eventReactions.emit('paused_event', {});
            expect(reaction).toHaveBeenCalled();
        });

        test('should emit with priority', () => {
            const order = [];
            eventReactions.on('priority', () => order.push('normal'), 5);
            eventReactions.on('priority', () => order.push('high'), 10);
            eventReactions.on('priority', () => order.push('low'), 1);
            eventReactions.emit('priority', {});
            expect(order).toEqual(['high', 'normal', 'low']);
        });

        test('should get reaction statistics', () => {
            eventReactions.on('stats_test', () => {});
            eventReactions.emit('stats_test', {});
            const stats = eventReactions.getStats();
            expect(stats).toBeDefined();
            expect(stats.emitCount).toBeGreaterThan(0);
        });
    });

    describe('AIReactionHandler', () => {
        let reactionHandler;

        beforeEach(() => {
            reactionHandler = new AIReactionHandler();
        });

        test('should initialize with empty handlers', () => {
            expect(reactionHandler.handlers).toBeInstanceOf(Map);
            expect(reactionHandler.handlers.size).toBe(0);
        });

        test('should register a handler for a reaction type', () => {
            const handler = jest.fn();
            reactionHandler.register('on_damage_taken', handler);
            expect(reactionHandler.handlers.has('on_damage_taken')).toBe(true);
        });

        test('should process a reaction', () => {
            const handler = jest.fn();
            reactionHandler.register('on_damage_taken', handler);
            const context = { mobId: 'mob1', damage: 20 };
            reactionHandler.process('on_damage_taken', context);
            expect(handler).toHaveBeenCalledWith(context);
        });

        test('should return reaction result', () => {
            const handler = jest.fn().mockReturnValue({ action: 'flee' });
            reactionHandler.register('on_low_health', handler);
            const result = reactionHandler.process('on_low_health', {});
            expect(result).toEqual({ action: 'flee' });
        });

        test('should handle unknown reaction type', () => {
            const result = reactionHandler.process('unknown_type', {});
            expect(result).toBeNull();
        });

        test('should unregister a handler', () => {
            const handler = jest.fn();
            reactionHandler.register('test', handler);
            reactionHandler.unregister('test');
            reactionHandler.process('test', {});
            expect(handler).not.toHaveBeenCalled();
        });

        test('should clear all handlers', () => {
            reactionHandler.register('handler1', () => {});
            reactionHandler.register('handler2', () => {});
            reactionHandler.clear();
            expect(reactionHandler.handlers.size).toBe(0);
        });

        test('should get registered handler types', () => {
            reactionHandler.register('type1', () => {});
            reactionHandler.register('type2', () => {});
            const types = reactionHandler.getTypes();
            expect(types).toContain('type1');
            expect(types).toContain('type2');
        });

        test('should check if handler exists', () => {
            reactionHandler.register('exists', () => {});
            expect(reactionHandler.hasHandler('exists')).toBe(true);
            expect(reactionHandler.hasHandler('not_exists')).toBe(false);
        });

        test('should process with timeout', async () => {
            const slowHandler = jest.fn().mockImplementation(() => {
                return new Promise(resolve => setTimeout(() => resolve('done'), 100));
            });
            reactionHandler.register('slow', slowHandler);
            const result = await reactionHandler.processWithTimeout('slow', {}, 50);
            expect(result).toBeNull(); // Timeout
        });

        test('should batch process multiple reactions', () => {
            const handler1 = jest.fn().mockReturnValue({ priority: 1 });
            const handler2 = jest.fn().mockReturnValue({ priority: 2 });
            reactionHandler.register('reaction1', handler1);
            reactionHandler.register('reaction2', handler2);
            const results = reactionHandler.processBatch(['reaction1', 'reaction2'], {});
            expect(results).toHaveLength(2);
        });

        test('should get handler priority', () => {
            reactionHandler.register('priority_test', () => {}, 10);
            const priority = reactionHandler.getPriority('priority_test');
            expect(priority).toBe(10);
        });

        test('should set handler priority', () => {
            reactionHandler.register('priority_change', () => {}, 5);
            reactionHandler.setPriority('priority_change', 15);
            expect(reactionHandler.getPriority('priority_change')).toBe(15);
        });

        test('should enable and disable handlers', () => {
            const handler = jest.fn();
            reactionHandler.register('toggle', handler);
            reactionHandler.disable('toggle');
            reactionHandler.process('toggle', {});
            expect(handler).not.toHaveBeenCalled();
            reactionHandler.enable('toggle');
            reactionHandler.process('toggle', {});
            expect(handler).toHaveBeenCalled();
        });

        test('should get handler statistics', () => {
            reactionHandler.register('stats', () => {});
            reactionHandler.process('stats', {});
            reactionHandler.process('stats', {});
            const stats = reactionHandler.getStats();
            expect(stats).toBeDefined();
            expect(stats.processCount).toBeGreaterThan(0);
        });
    });

    describe('DeltaCompressor', () => {
        let compressor;

        beforeEach(() => {
            compressor = new DeltaCompressor();
        });

        test('should initialize with empty state', () => {
            expect(compressor.previousState).toBeNull();
            expect(compressor.compressionEnabled).toBe(true);
        });

        test('should compress state changes', () => {
            const prev = { x: 10, y: 20, hp: 100 };
            const curr = { x: 15, y: 20, hp: 90 };
            const delta = compressor.compress(prev, curr);
            expect(delta).toEqual({ x: 15, hp: 90 });
        });

        test('should return null for identical states', () => {
            const state = { x: 10, y: 20 };
            const delta = compressor.compress(state, state);
            expect(delta).toBeNull();
        });

        test('should decompress delta', () => {
            const prev = { x: 10, y: 20, hp: 100 };
            const delta = { x: 15, hp: 90 };
            const curr = compressor.decompress(prev, delta);
            expect(curr).toEqual({ x: 15, y: 20, hp: 90 });
        });

        test('should track state history', () => {
            const state1 = { x: 10 };
            const state2 = { x: 20 };
            const state3 = { x: 30 };
            compressor.compress(state1, state2);
            compressor.compress(state2, state3);
            expect(compressor.getHistoryLength()).toBe(2);
        });

        test('should get state at specific index', () => {
            const state1 = { x: 10 };
            const state2 = { x: 20 };
            compressor.compress(state1, state2);
            const retrieved = compressor.getStateAt(0);
            expect(retrieved).toEqual(state1);
        });

        test('should enable compression', () => {
            compressor.disable();
            expect(compressor.compressionEnabled).toBe(false);
            compressor.enable();
            expect(compressor.compressionEnabled).toBe(true);
        });

        test('should return full state when disabled', () => {
            compressor.disable();
            const prev = { x: 10 };
            const curr = { x: 20 };
            const delta = compressor.compress(prev, curr);
            expect(delta).toEqual(curr);
        });

        test('should clear history', () => {
            compressor.compress({ x: 10 }, { x: 20 });
            compressor.clear();
            expect(compressor.getHistoryLength()).toBe(0);
        });

        test('should get compression ratio', () => {
            const prev = { x: 10, y: 20, z: 30, a: 40, b: 50 };
            const curr = { x: 15, y: 20, z: 35, a: 40, b: 55 };
            compressor.compress(prev, curr);
            const ratio = compressor.getCompressionRatio();
            expect(ratio).toBeGreaterThan(0);
        });

        test('should batch compress multiple states', () => {
            const states = [
                { x: 10 },
                { x: 20 },
                { x: 30 }
            ];
            const deltas = compressor.batchCompress(states);
            expect(deltas).toHaveLength(2);
        });

        test('should get compression statistics', () => {
            compressor.compress({ x: 10, y: 20 }, { x: 15, y: 20 });
            const stats = compressor.getStats();
            expect(stats).toBeDefined();
            expect(stats.compressionCount).toBeGreaterThan(0);
        });

        test('should set max history size', () => {
            compressor.setMaxHistory(2);
            compressor.compress({ x: 1 }, { x: 2 });
            compressor.compress({ x: 2 }, { x: 3 });
            compressor.compress({ x: 3 }, { x: 4 });
            expect(compressor.getHistoryLength()).toBeLessThanOrEqual(2);
        });

        test('should handle nested object compression', () => {
            const prev = { position: { x: 10, y: 20 }, stats: { hp: 100 } };
            const curr = { position: { x: 15, y: 20 }, stats: { hp: 90 } };
            const delta = compressor.compress(prev, curr);
            expect(delta).toBeDefined();
        });

        test('should handle array compression', () => {
            const prev = { items: [1, 2, 3] };
            const curr = { items: [1, 2, 4] };
            const delta = compressor.compress(prev, curr);
            expect(delta).toBeDefined();
        });
    });
});
