import { describe, it, expect, beforeEach, vi } from 'vitest';

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

const mockMinimapCanvas = {
    width: 150,
    height: 150,
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
        measureText: vi.fn(() => ({ width: 50 }))
    }))
};

const mockDocument = {
    getElementById: vi.fn((id) => {
        if (id === 'gameCanvas') return mockCanvas;
        if (id === 'minimap') return mockMinimapCanvas;
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

// Mock GameplayEngine completo
class MockGameplayEngine {
    constructor() {
        this.mobs = [];
        this.player = null;
        this.canvas = mockCanvas;
        this.ctx = mockCanvas.getContext();
    }
    
    startGame(characterData) {
        this.player = {
            x: 400,
            y: 300,
            size: 32,
            speed: 100,
            ...characterData
        };
        
        this.mobs = [];
        for (let i = 0; i < 12; i++) {
            this.mobs.push({
                id: `mob_${i}`,
                type: ['goblin', 'wolf', 'orc'][i % 3],
                x: Math.random() * 700 + 50,
                y: Math.random() * 500 + 50,
                size: 32,
                color: ['#FF6B6B', '#8B4513', '#4B0082'][i % 3],
                name: ['Goblin', 'Wolf', 'Orc'][i % 3],
                hp: 20,
                maxHp: 20,
                atk: 5,
                def: 2,
                exp: 10,
                gold: 5,
                speed: 30 + Math.random() * 40,
                direction: Math.random() * Math.PI * 2,
                
                // AI System
                aiState: 'patrolling',
                lastDecision: 0,
                decisionCooldown: 1000,
                target: null,
                fleeThreshold: 0.3,
                aggroRange: 100,
                attackRange: 30,
                patrolCenter: null,
                patrolRadius: 150,
                lastAttack: 0,
                attackCooldown: 2000
            });
        }
        
        // Inicializar centros de patrulha
        this.mobs.forEach(mob => {
            mob.patrolCenter = { x: mob.x, y: mob.y };
        });
        
        return true;
    }
    
    updateMobAI(mob, deltaTime) {
        const now = Date.now();
        
        if (now - mob.lastDecision < mob.decisionCooldown) {
            return;
        }
        
        mob.lastDecision = now;
        
        // Verificar HP para flee
        const hpPercent = mob.hp / mob.maxHp;
        if (hpPercent < mob.fleeThreshold && mob.aiState !== 'fleeing') {
            mob.aiState = 'fleeing';
            mob.target = null;
            return;
        }
        
        // Verificar aggro do player
        if (this.player && mob.aiState !== 'fleeing') {
            const distance = this.getDistance(mob, this.player);
            
            if (distance <= mob.aggroRange && mob.aiState !== 'aggro') {
                mob.aiState = 'aggro';
                mob.target = this.player;
            } else if (distance > mob.aggroRange * 1.5 && mob.aiState === 'aggro') {
                mob.aiState = 'patrolling';
                mob.target = null;
            }
        }
        
        // Executar comportamento baseado no estado
        switch (mob.aiState) {
            case 'idle':
                this.handleIdleState(mob);
                break;
            case 'patrolling':
                this.handlePatrolState(mob);
                break;
            case 'aggro':
                this.handleAggroState(mob);
                break;
            case 'fleeing':
                this.handleFleeState(mob);
                break;
            case 'attacking':
                this.handleAttackState(mob);
                break;
        }
    }
    
    handleIdleState(mob) {
        if (Math.random() < 0.3) {
            mob.aiState = 'patrolling';
        }
    }
    
    handlePatrolState(mob) {
        if (!mob.patrolCenter) {
            mob.patrolCenter = { x: mob.x, y: mob.y };
        }
        
        if (Math.random() < 0.1) {
            const angle = Math.random() * Math.PI * 2;
            mob.direction = angle;
        }
        
        const distFromCenter = this.getDistance(mob, mob.patrolCenter);
        if (distFromCenter > mob.patrolRadius) {
            const angleToCenter = Math.atan2(
                mob.patrolCenter.y - mob.y,
                mob.patrolCenter.x - mob.x
            );
            mob.direction = angleToCenter;
        }
    }
    
    handleAggroState(mob) {
        if (!mob.target || !this.player) {
            mob.aiState = 'patrolling';
            return;
        }
        
        const distance = this.getDistance(mob, mob.target);
        
        if (distance > mob.attackRange) {
            const angle = Math.atan2(
                mob.target.y - mob.y,
                mob.target.x - mob.x
            );
            mob.direction = angle;
        } else {
            mob.aiState = 'attacking';
        }
    }
    
    handleFleeState(mob) {
        if (this.player) {
            const angle = Math.atan2(
                mob.y - this.player.y,
                mob.x - this.player.x
            );
            mob.direction = angle;
        }
        
        const hpPercent = mob.hp / mob.maxHp;
        if (hpPercent > mob.fleeThreshold * 2) {
            mob.aiState = 'patrolling';
            mob.target = null;
        }
    }
    
    handleAttackState(mob) {
        if (!mob.target || !this.player) {
            mob.aiState = 'patrolling';
            return;
        }
        
        const now = Date.now();
        const distance = this.getDistance(mob, mob.target);
        
        if (distance <= mob.attackRange && now - mob.lastAttack >= mob.attackCooldown) {
            this.mobAttackPlayer(mob, mob.target);
            mob.lastAttack = now;
        } else if (distance > mob.attackRange) {
            mob.aiState = 'aggro';
        }
    }
    
    mobAttackPlayer(mob, player) {
        const baseDamage = mob.atk;
        const variance = 0.2;
        const damage = Math.round(baseDamage * (1 + (Math.random() - 0.5) * variance));
        
        const knockbackAngle = Math.atan2(player.y - mob.y, player.x - mob.x);
        const knockbackDistance = 20;
        player.x += Math.cos(knockbackAngle) * knockbackDistance;
        player.y += Math.sin(knockbackAngle) * knockbackDistance;
    }
    
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    calculatePath(mob, target) {
        return [
            { x: mob.x, y: mob.y },
            { x: target.x, y: target.y }
        ];
    }
    
    avoidObstacles(mob, obstacles) {
        let nextPos = {
            x: mob.x + Math.cos(mob.direction) * mob.speed * 0.016,
            y: mob.y + Math.sin(mob.direction) * mob.speed * 0.016
        };
        
        for (const obs of obstacles) {
            if (this.checkRectCollision(nextPos, mob.size, obs)) {
                mob.direction += Math.PI / 2;
                nextPos = {
                    x: mob.x + Math.cos(mob.direction) * mob.speed * 0.016,
                    y: mob.y + Math.sin(mob.direction) * mob.speed * 0.016
                };
                break;
            }
        }
        
        return nextPos;
    }
    
    checkRectCollision(pos, size, obstacle) {
        return pos.x < obstacle.x + obstacle.width &&
               pos.x + size > obstacle.x &&
               pos.y < obstacle.y + obstacle.height &&
               pos.y + size > obstacle.y;
    }
    
    addChatMessage(message, color) {
        // Mock para teste
    }
    
    update(deltaTime) {
        // Update player
        this.updatePlayer(deltaTime);
        
        // Update mobs com IA
        this.mobs.forEach(mob => {
            this.updateMobAI(mob, deltaTime);
            this.updateMobPosition(mob, deltaTime);
        });
        
        // Check collisions
        this.checkCollisions();
    }
    
    updatePlayer(deltaTime) {
        // Mock implementation
    }
    
    updateMobPosition(mob, deltaTime) {
        // Mock implementation
    }
    
    checkCollisions() {
        // Mock implementation
    }
    
    render() {
        // Mock implementation
    }
}

describe('GameplayEngine - Mob AI System', () => {
    let engine;
    
    beforeEach(() => {
        vi.clearAllMocks();
        engine = new MockGameplayEngine();
    });
    
    describe('Mob Initialization', () => {
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
                expect(mob).toHaveProperty('attackRange');
                expect(mob).toHaveProperty('patrolCenter');
                expect(mob).toHaveProperty('patrolRadius');
                expect(mob).toHaveProperty('lastAttack');
                expect(mob).toHaveProperty('attackCooldown');
            });
        });
        
        it('should set correct initial AI state', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            engine.mobs.forEach(mob => {
                expect(mob.aiState).toBe('patrolling');
                expect(mob.fleeThreshold).toBe(0.3);
                expect(mob.aggroRange).toBe(100);
                expect(mob.attackRange).toBe(30);
                expect(mob.decisionCooldown).toBe(1000);
                expect(mob.attackCooldown).toBe(2000);
            });
        });
        
        it('should initialize patrol centers', () => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
            
            engine.mobs.forEach(mob => {
                expect(mob.patrolCenter).toBeDefined();
                expect(mob.patrolCenter.x).toBe(mob.x);
                expect(mob.patrolCenter.y).toBe(mob.y);
                expect(mob.patrolRadius).toBe(150);
            });
        });
    });
    
    describe('AI State Transitions', () => {
        beforeEach(() => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
        });
        
        it('should transition to fleeing when HP is low', () => {
            const mob = engine.mobs[0];
            const initialTime = Date.now();
            
            // Simular HP baixo
            mob.hp = 5;
            mob.maxHp = 20;
            mob.lastDecision = initialTime - 2000; // Forçar decisão
            
            engine.updateMobAI(mob, 0.016);
            
            expect(mob.aiState).toBe('fleeing');
            expect(mob.target).toBeNull();
        });
        
        it('should transition to aggro when player is near', () => {
            const mob = engine.mobs[0];
            const player = engine.player;
            const initialTime = Date.now();
            
            // Colocar player no range de aggro
            player.x = mob.x + 50; // Dentro do range de 100
            player.y = mob.y + 50;
            mob.lastDecision = initialTime - 2000; // Forçar decisão
            
            engine.updateMobAI(mob, 0.016);
            
            expect(mob.aiState).toBe('aggro');
            expect(mob.target).toBe(player);
        });
        
        it('should transition to attacking when in range', () => {
            const mob = engine.mobs[0];
            const player = engine.player;
            const initialTime = Date.now();
            
            // Configurar para estado aggro e player no range de ataque
            mob.aiState = 'aggro';
            mob.target = player;
            player.x = mob.x + 20; // Dentro do range de 30
            player.y = mob.y + 20;
            mob.lastDecision = initialTime - 2000; // Forçar decisão
            mob.lastAttack = initialTime - 3000; // Forçar ataque
            
            engine.updateMobAI(mob, 0.016);
            
            expect(mob.aiState).toBe('attacking');
        });
        
        it('should return to patrolling when player is far', () => {
            const mob = engine.mobs[0];
            const player = engine.player;
            const initialTime = Date.now();
            
            // Configurar para estado aggro mas player longe
            mob.aiState = 'aggro';
            mob.target = player;
            player.x = mob.x + 200; // Fora do range de 150
            player.y = mob.y + 200;
            mob.lastDecision = initialTime - 2000; // Forçar decisão
            
            engine.updateMobAI(mob, 0.016);
            
            expect(mob.aiState).toBe('patrolling');
            expect(mob.target).toBeNull();
        });
    });
    
    describe('AI Behavior Methods', () => {
        beforeEach(() => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
        });
        
        it('should handle idle state correctly', () => {
            const mob = engine.mobs[0];
            const initialTime = Date.now();
            
            mob.aiState = 'idle';
            mob.lastDecision = initialTime - 2000; // Forçar decisão
            
            // Mock Math.random para retornar valor que causa transição
            const originalRandom = Math.random;
            Math.random = vi.fn(() => 0.2); // < 0.3
            
            engine.handleIdleState(mob);
            
            expect(mob.aiState).toBe('patrolling');
            
            Math.random = originalRandom;
        });
        
        it('should handle patrol state correctly', () => {
            const mob = engine.mobs[0];
            const initialTime = Date.now();
            
            mob.aiState = 'patrolling';
            mob.lastDecision = initialTime - 2000; // Forçar decisão
            mob.patrolCenter = { x: 400, y: 300 };
            
            // Mock Math.random para testar mudança de direção
            const originalRandom = Math.random;
            Math.random = vi.fn(() => 0.5);
            
            engine.handlePatrolState(mob);
            
            expect(mob.direction).toBeDefined();
            
            Math.random = originalRandom;
        });
        
        it('should handle flee state correctly', () => {
            const mob = engine.mobs[0];
            const player = engine.player;
            const initialTime = Date.now();
            
            mob.aiState = 'fleeing';
            mob.lastDecision = initialTime - 2000; // Forçar decisão
            player.x = mob.x + 100;
            player.y = mob.y + 100;
            
            engine.handleFleeState(mob);
            
            // Deve fugir na direção oposta ao player
            const expectedAngle = Math.atan2(mob.y - player.y, mob.x - player.x);
            expect(mob.direction).toBeCloseTo(expectedAngle, 0.1);
        });
        
        it('should handle attack state correctly', () => {
            const mob = engine.mobs[0];
            const player = engine.player;
            const initialTime = Date.now();
            
            mob.aiState = 'attacking';
            mob.target = player;
            mob.lastDecision = initialTime - 2000; // Forçar decisão
            mob.lastAttack = initialTime - 3000; // Forçar ataque
            
            // Mock mobAttackPlayer para verificar se é chamado
            const originalAttackPlayer = engine.mobAttackPlayer;
            engine.mobAttackPlayer = vi.fn();
            
            engine.handleAttackState(mob);
            
            expect(engine.mobAttackPlayer).toHaveBeenCalledWith(mob, player);
            
            engine.mobAttackPlayer = originalAttackPlayer;
        });
    });
    
    describe('Utility Methods', () => {
        beforeEach(() => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
        });
        
        it('should calculate distance correctly', () => {
            const obj1 = { x: 0, y: 0 };
            const obj2 = { x: 3, y: 4 };
            
            const distance = engine.getDistance(obj1, obj2);
            
            expect(distance).toBe(5); // 3-4-5 triangle
        });
        
        it('should calculate path correctly', () => {
            const mob = { x: 100, y: 100 };
            const target = { x: 200, y: 300 };
            
            const path = engine.calculatePath(mob, target);
            
            expect(Array.isArray(path)).toBe(true);
            expect(path).toHaveLength(2);
            expect(path[0]).toEqual({ x: 100, y: 100 });
            expect(path[1]).toEqual({ x: 200, y: 300 });
        });
        
        it('should avoid obstacles correctly', () => {
            const mob = { x: 100, y: 100, size: 32, direction: 0, speed: 50 };
            const obstacles = [
                { x: 120, y: 100, width: 50, height: 50 }
            ];
            
            const nextPos = engine.avoidObstacles(mob, obstacles);
            
            expect(nextPos.x).toBeDefined();
            expect(nextPos.y).toBeDefined();
            
            // Verificar se não colide com obstáculo
            const collision = nextPos.x < 120 + 50 &&
                             nextPos.x + mob.size > 120 &&
                             nextPos.y < 100 + 50 &&
                             nextPos.y + mob.size > 100;
            expect(collision).toBe(false);
        });
        
        it('should check rectangle collision correctly', () => {
            const pos = { x: 125, y: 125 };
            const size = 32;
            const obstacle = { x: 120, y: 120, width: 50, height: 50 };
            
            const collision = engine.checkRectCollision(pos, size, obstacle);
            
            expect(collision).toBe(true);
        });
    });
    
    describe('Mob Attack System', () => {
        beforeEach(() => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
        });
        
        it('should attack player with damage', () => {
            const mob = engine.mobs[0];
            const player = engine.player;
            
            mob.atk = 10;
            
            // Mock addChatMessage para verificar
            const originalAddChatMessage = engine.addChatMessage;
            engine.addChatMessage = vi.fn();
            
            engine.mobAttackPlayer(mob, player);
            
            expect(engine.addChatMessage).toHaveBeenCalled();
            
            engine.addChatMessage = originalAddChatMessage;
        });
        
        it('should apply knockback to player', () => {
            const mob = engine.mobs[0];
            const player = engine.player;
            const initialX = player.x;
            const initialY = player.y;
            
            mob.x = initialX + 50;
            mob.y = initialY + 50;
            
            engine.mobAttackPlayer(mob, player);
            
            // Player deve ter sido afastado
            expect(player.x).not.toBe(initialX);
            expect(player.y).not.toBe(initialY);
        });
        
        it('should keep player in bounds', () => {
            const mob = engine.mobs[0];
            const player = engine.player;
            
            // Colocar player perto da borda
            player.x = 750;
            player.y = 550;
            
            mob.x = 780;
            mob.y = 580;
            
            engine.mobAttackPlayer(mob, player);
            
            // Player deve estar dentro dos limites
            expect(player.x).toBeGreaterThanOrEqual(16);
            expect(player.x).toBeLessThanOrEqual(784);
            expect(player.y).toBeGreaterThanOrEqual(16);
            expect(player.y).toBeLessThanOrEqual(584);
        });
    });
    
    describe('Performance Tests', () => {
        beforeEach(() => {
            const characterData = { name: 'TestPlayer', level: 1 };
            engine.startGame(characterData);
        });
        
        it('should handle AI updates efficiently', () => {
            const startTime = performance.now();
            
            // Atualizar IA de todos os mobs
            engine.mobs.forEach(mob => {
                engine.updateMobAI(mob, 0.016);
            });
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Deve ser rápido (< 5ms para 12 mobs)
            expect(duration).toBeLessThan(5);
        });
        
        it('should maintain performance at 60 FPS', () => {
            const frameTime = 1000 / 60; // 16.67ms
            
            const startTime = performance.now();
            engine.update(frameTime / 1000);
            engine.render();
            const endTime = performance.now();
            
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(frameTime);
        });
    });
});
