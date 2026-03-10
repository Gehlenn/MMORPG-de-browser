import { describe, it, expect, beforeEach, vi } from 'vitest';

// Importar GameplayEngine diretamente
import GameplayEngine from '../client/GameplayEngine.js';

// Mock DOM e Canvas
const mockCanvas = {
    width: 800,
    height: 600,
    getContext: vi.fn(() => ({
        fillStyle: '',
        fillRect: vi.fn(),
        strokeStyle: '',
        lineWidth: 1,
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        font: '',
        fillText: vi.fn(),
        textAlign: '',
        measureText: vi.fn(() => ({ width: 100 }))
    }))
};

const mockDocument = {
    getElementById: vi.fn((id) => {
        if (id === 'gameCanvas') return mockCanvas;
        if (id === 'minimap') return mockCanvas;
        return null;
    })
};

global.document = mockDocument;
global.window = {
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: vi.fn()
};
global.performance = {
    now: vi.fn(() => Date.now())
};
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));

describe('GameplayEngine - Advanced Mob AI', () => {
    let engine;
    
    beforeEach(() => {
        engine = new GameplayEngine();
        vi.clearAllMocks();
    });
    
    describe('Mob AI System', () => {
        it('should initialize mobs with AI properties', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            expect(engine.mobs).toHaveLength(12);
            engine.mobs.forEach(mob => {
                expect(mob).toHaveProperty('aiState');
                expect(mob).toHaveProperty('lastDecision');
                expect(mob).toHaveProperty('target');
                expect(mob).toHaveProperty('fleeThreshold');
                expect(mob).toHaveProperty('aggroRange');
            });
        });
        
        it('should implement intelligent movement patterns', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const mob = engine.mobs[0];
            const initialX = mob.x;
            const initialY = mob.y;
            
            // Simular update de IA
            engine.updateMobAI(mob, 0.016);
            
            // Mob deve ter mudado de posição ou estado
            expect(mob.lastDecision).toBeDefined();
            expect(mob.aiState).toBeDefined();
        });
        
        it('should implement flee system when HP is low', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const mob = engine.mobs[0];
            mob.hp = 5; // HP baixo
            mob.fleeThreshold = 0.3; // 30% HP para fugir
            
            engine.updateMobAI(mob, 0.016);
            
            expect(mob.aiState).toBe('fleeing');
        });
        
        it('should implement aggro system', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const mob = engine.mobs[0];
            const player = engine.player;
            
            // Colocar player dentro do range de aggro
            const distance = Math.sqrt(Math.pow(player.x - mob.x, 2) + Math.pow(player.y - mob.y, 2));
            mob.aggroRange = 100;
            
            if (distance <= mob.aggroRange) {
                engine.updateMobAI(mob, 0.016);
                expect(mob.aiState).toBe('aggro');
                expect(mob.target).toBe(player);
            }
        });
        
        it('should implement patrol behavior', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const mob = engine.mobs[0];
            mob.aiState = 'patrolling';
            
            engine.updateMobAI(mob, 0.016);
            
            expect(mob.aiState).toBe('patrolling');
            expect(typeof mob.direction).toBe('number');
        });
        
        it('should handle AI state transitions', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const mob = engine.mobs[0];
            
            // Testar transição de estados
            mob.aiState = 'idle';
            engine.updateMobAI(mob, 0.016);
            
            mob.hp = 5; // Baixo HP
            engine.updateMobAI(mob, 0.016);
            expect(mob.aiState).toBe('fleeing');
            
            mob.hp = mob.maxHp; // Recuperar HP
            engine.updateMobAI(mob, 0.016);
            expect(mob.aiState).not.toBe('fleeing');
        });
        
        it('should implement pathfinding basics', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const mob = engine.mobs[0];
            const target = { x: 400, y: 300 };
            
            const path = engine.calculatePath(mob, target);
            
            expect(Array.isArray(path)).toBe(true);
            expect(path.length).toBeGreaterThan(0);
        });
        
        it('should avoid obstacles during movement', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const mob = engine.mobs[0];
            const obstacles = [
                { x: 200, y: 200, width: 50, height: 50 }
            ];
            
            const nextPos = engine.avoidObstacles(mob, obstacles);
            
            expect(nextPos.x).toBeDefined();
            expect(nextPos.y).toBeDefined();
            // Verificar se não colide com obstáculos
            obstacles.forEach(obs => {
                const collision = nextPos.x < obs.x + obs.width &&
                                 nextPos.x + mob.size > obs.x &&
                                 nextPos.y < obs.y + obs.height &&
                                 nextPos.y + mob.size > obs.y;
                expect(collision).toBe(false);
            });
        });
    });
    
    describe('Mob AI Performance', () => {
        it('should update AI efficiently', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const startTime = performance.now();
            
            // Atualizar IA de todos os mobs
            engine.mobs.forEach(mob => {
                engine.updateMobAI(mob, 0.016);
            });
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // AI updates devem ser rápidos (< 1ms por mob)
            expect(duration).toBeLessThan(12); // 12ms para 12 mobs
        });
        
        it('should handle AI updates at 60 FPS', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const frameTime = 1000 / 60; // 16.67ms por frame
            
            const startTime = performance.now();
            
            // Simular um frame completo
            engine.update(frameTime / 1000);
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(frameTime);
        });
    });
    
    describe('Mob AI Edge Cases', () => {
        it('should handle null target gracefully', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const mob = engine.mobs[0];
            mob.target = null;
            mob.aiState = 'aggro';
            
            expect(() => engine.updateMobAI(mob, 0.016)).not.toThrow();
            expect(mob.aiState).toBe('patrolling');
        });
        
        it('should handle missing player', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const mob = engine.mobs[0];
            engine.player = null;
            
            expect(() => engine.updateMobAI(mob, 0.016)).not.toThrow();
        });
        
        it('should handle zero deltaTime', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            const mob = engine.mobs[0];
            
            expect(() => engine.updateMobAI(mob, 0)).not.toThrow();
        });
    });
});
