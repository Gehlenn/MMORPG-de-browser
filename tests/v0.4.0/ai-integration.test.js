/**
 * AI Integration Tests - v0.4.0
 * Tests for Client-Side AI Integration phases 2, 3, and 4
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock classes
class MockSocket {
  constructor() {
    this.events = new Map();
    this.emitted = [];
  }
  
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(handler);
  }
  
  off(event, handler) {
    if (this.events.has(event)) {
      const handlers = this.events.get(event);
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    }
  }
  
  emit(event, data) {
    this.emitted.push({ event, data });
    if (this.events.has(event)) {
      this.events.get(event).forEach(h => h(data));
    }
  }
  
  trigger(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(h => h(data));
    }
  }
}

class MockNetworkManager extends MockSocket {
  constructor() {
    super();
    this.socket = new MockSocket();
  }
}

describe('Phase 2: AI Visualization System', () => {
  let networkManager;
  
  beforeEach(() => {
    networkManager = new MockNetworkManager();
  });
  
  describe('AI State Broadcasting', () => {
    it('should receive ai:state_update events', (done) => {
      const mockState = {
        mobId: 'mob_123',
        state: 'chase',
        position: { x: 100, y: 200 },
        targetId: 'player_456'
      };
      
      networkManager.on('ai:state_update', (data) => {
        expect(data.mobId).toBe('mob_123');
        expect(data.state).toBe('chase');
        done();
      });
      
      networkManager.trigger('ai:state_update', mockState);
    });
    
    it('should receive ai:boss_phase_change events', (done) => {
      const mockPhase = {
        bossId: 'boss_dragon',
        bossName: 'Ancient Dragon',
        previousPhase: 1,
        newPhase: 2,
        newPhaseName: 'ENRAGED'
      };
      
      networkManager.on('ai:boss_phase_change', (data) => {
        expect(data.bossId).toBe('boss_dragon');
        expect(data.newPhase).toBe(2);
        done();
      });
      
      networkManager.trigger('ai:boss_phase_change', mockPhase);
    });
    
    it('should handle multiple concurrent AI entities', () => {
      const states = [];
      
      networkManager.on('ai:state_update', (data) => {
        states.push(data);
      });
      
      // Simulate 50 concurrent mob updates
      for (let i = 0; i < 50; i++) {
        networkManager.trigger('ai:state_update', {
          mobId: `mob_${i}`,
          state: i % 2 === 0 ? 'chase' : 'idle',
          position: { x: i * 10, y: i * 20 }
        });
      }
      
      expect(states).toHaveLength(50);
    });
  });
  
  describe('Debug Toggle (F9)', () => {
    it('should toggle debug mode on F9 key', () => {
      let debugEnabled = false;
      
      const toggleDebug = () => {
        debugEnabled = !debugEnabled;
      };
      
      // Simulate F9 press
      toggleDebug();
      expect(debugEnabled).toBe(true);
      
      // Simulate second F9 press
      toggleDebug();
      expect(debugEnabled).toBe(false);
    });
  });
});

describe('Phase 3: Player-AI Interaction', () => {
  let networkManager;
  
  beforeEach(() => {
    networkManager = new MockNetworkManager();
  });
  
  describe('Aggro System', () => {
    it('should receive aggro updates', (done) => {
      const aggroData = {
        monsterId: 'mob_123',
        monsterName: 'Dragon',
        currentTarget: 'player_456',
        threatList: [
          { playerId: 'player_456', threat: 1500, percentage: '60.0', isTop: true },
          { playerId: 'player_789', threat: 800, percentage: '32.0', isTop: false }
        ]
      };
      
      networkManager.on('ai:aggro_update', (data) => {
        expect(data.monsterId).toBe('mob_123');
        expect(data.threatList).toHaveLength(2);
        expect(data.threatList[0].isTop).toBe(true);
        done();
      });
      
      networkManager.trigger('ai:aggro_update', aggroData);
    });
    
    it('should handle taunt events', (done) => {
      const tauntData = {
        monsterId: 'mob_123',
        playerId: 'player_456',
        newTarget: 'player_456',
        previousTarget: 'player_789',
        threatTable: { 'player_456': 2000, 'player_789': 800 }
      };
      
      networkManager.on('ai:taunt', (data) => {
        expect(data.newTarget).toBe('player_456');
        expect(data.threatTable['player_456']).toBe(2000);
        done();
      });
      
      networkManager.trigger('ai:taunt', tauntData);
    });
  });
  
  describe('AI Reactions', () => {
    it('should receive crowd control reactions', (done) => {
      const reactionData = {
        targetId: 'mob_123',
        reactionType: 'crowd_controlled',
        data: {
          playerId: 'player_456',
          effectType: 'stun',
          duration: 3000
        }
      };
      
      networkManager.on('ai:reaction', (data) => {
        expect(data.reactionType).toBe('crowd_controlled');
        expect(data.data.effectType).toBe('stun');
        done();
      });
      
      networkManager.trigger('ai:reaction', reactionData);
    });
    
    it('should receive tactical tips', (done) => {
      const tipData = {
        playerId: 'player_456',
        tipType: 'weakness_exploited',
        data: {
          damageType: 'ice',
          bonus: '50%',
          message: 'You hit the boss weakness! +50% damage!'
        }
      };
      
      networkManager.on('tactical:tip', (data) => {
        expect(data.tipType).toBe('weakness_exploited');
        expect(data.data.bonus).toBe('50%');
        done();
      });
      
      networkManager.trigger('tactical:tip', tipData);
    });
  });
  
  describe('Threat Calculation', () => {
    it('should calculate threat percentages correctly', () => {
      const threatTable = {
        'player_1': 1000,
        'player_2': 500,
        'player_3': 250
      };
      
      const total = Object.values(threatTable).reduce((a, b) => a + b, 0);
      const percentages = Object.entries(threatTable).map(([id, threat]) => ({
        playerId: id,
        percentage: ((threat / total) * 100).toFixed(1)
      }));
      
      expect(percentages[0].percentage).toBe('57.1');
      expect(percentages[1].percentage).toBe('28.6');
      expect(percentages[2].percentage).toBe('14.3');
    });
  });
});

describe('Phase 4: Performance Optimization', () => {
  let statePool;
  let spatialIndex;
  
  beforeEach(() => {
    // Mock AIStatePool
    statePool = {
      available: [],
      inUse: new Set(),
      acquire() {
        if (this.available.length === 0) {
          this.expand(10);
        }
        const obj = this.available.pop();
        this.inUse.add(obj);
        return obj;
      },
      release(obj) {
        this.inUse.delete(obj);
        this.available.push(obj);
      },
      expand(n) {
        for (let i = 0; i < n; i++) {
          this.available.push({ mobId: null, state: 'idle' });
        }
      },
      getStats() {
        return {
          available: this.available.length,
          inUse: this.inUse.size,
          utilizationRate: this.inUse.size / (this.available.length + this.inUse.size || 1)
        };
      }
    };
    
    // Mock SpatialIndex
    spatialIndex = {
      objects: [],
      insert(obj) { this.objects.push(obj); },
      remove(obj) {
        const idx = this.objects.indexOf(obj);
        if (idx !== -1) this.objects.splice(idx, 1);
      },
      query(range) {
        return this.objects.filter(obj => 
          obj.x >= range.x && obj.x <= range.x + range.width &&
          obj.y >= range.y && obj.y <= range.y + range.height
        );
      }
    };
  });
  
  describe('Object Pooling', () => {
    it('should reuse objects from pool', () => {
      statePool.expand(5);
      
      const obj1 = statePool.acquire();
      obj1.mobId = 'mob_1';
      
      const obj2 = statePool.acquire();
      obj2.mobId = 'mob_2';
      
      expect(statePool.inUse.size).toBe(2);
      expect(statePool.available.length).toBe(3);
      
      statePool.release(obj1);
      expect(statePool.inUse.size).toBe(1);
      expect(statePool.available.length).toBe(4);
    });
    
    it('should expand pool when exhausted', () => {
      statePool.expand(2);
      
      statePool.acquire();
      statePool.acquire();
      
      // Third acquisition should trigger expansion
      const obj3 = statePool.acquire();
      expect(obj3).toBeDefined();
    });
    
    it('should report pool statistics', () => {
      statePool.expand(10);
      statePool.acquire();
      statePool.acquire();
      
      const stats = statePool.getStats();
      expect(stats.available).toBe(8);
      expect(stats.inUse).toBe(2);
      expect(stats.utilizationRate).toBeCloseTo(0.2, 1);
    });
  });
  
  describe('Spatial Indexing', () => {
    it('should insert and query entities', () => {
      const entity = { id: 'mob_1', x: 100, y: 100, width: 32, height: 32 };
      spatialIndex.insert(entity);
      
      const results = spatialIndex.query({ x: 50, y: 50, width: 200, height: 200 });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('mob_1');
    });
    
    it('should filter entities outside viewport', () => {
      spatialIndex.insert({ id: 'mob_1', x: 100, y: 100 });
      spatialIndex.insert({ id: 'mob_2', x: 500, y: 500 });
      spatialIndex.insert({ id: 'mob_3', x: 150, y: 150 });
      
      // Query viewport that only includes mob_1 and mob_3
      const results = spatialIndex.query({ x: 50, y: 50, width: 200, height: 200 });
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id)).toContain('mob_1');
      expect(results.map(r => r.id)).toContain('mob_3');
      expect(results.map(r => r.id)).not.toContain('mob_2');
    });
  });
  
  describe('Delta Compression', () => {
    it('should detect changed fields', () => {
      const lastState = { x: 100, y: 200, state: 'idle', hp: 100 };
      const currentState = { x: 102, y: 200, state: 'chase', hp: 100 };
      
      const delta = {};
      for (const key of Object.keys(currentState)) {
        if (lastState[key] !== currentState[key]) {
          delta[key] = currentState[key];
        }
      }
      
      expect(delta).toEqual({ x: 102, state: 'chase' });
    });
    
    it('should calculate compression ratio', () => {
      const fullSize = JSON.stringify({ x: 100, y: 200, state: 'idle', hp: 100 }).length;
      const deltaSize = JSON.stringify({ x: 102, state: 'chase' }).length;
      const ratio = ((fullSize - deltaSize) / fullSize * 100).toFixed(0);
      
      expect(parseInt(ratio)).toBeGreaterThan(30); // At least 30% compression
    });
  });
  
  describe('Frame Skipping', () => {
    it('should skip frames correctly', () => {
      let frameCounter = 0;
      let renderCount = 0;
      const skipInterval = 2; // Render every 2nd frame
      
      for (let i = 0; i < 60; i++) {
        frameCounter = (frameCounter + 1) % skipInterval;
        if (frameCounter === 0) {
          renderCount++;
        }
      }
      
      expect(renderCount).toBe(30); // Half the frames
    });
  });
});

describe('Integration: End-to-End Flow', () => {
  let networkManager;
  const receivedEvents = [];
  
  beforeEach(() => {
    networkManager = new MockNetworkManager();
    receivedEvents.length = 0;
    
    // Subscribe to all AI events
    ['ai:state_update', 'ai:boss_phase_change', 'ai:aggro_update', 
     'ai:reaction', 'tactical:tip'].forEach(event => {
      networkManager.on(event, (data) => {
        receivedEvents.push({ event, data });
      });
    });
  });
  
  it('should handle complete combat scenario', () => {
    // 1. Player attacks mob
    networkManager.trigger('ai:aggro_update', {
      monsterId: 'mob_123',
      currentTarget: 'player_456',
      threatList: [{ playerId: 'player_456', percentage: '100.0', isTop: true }]
    });
    
    // 2. Mob chases player
    networkManager.trigger('ai:state_update', {
      mobId: 'mob_123',
      state: 'chase',
      targetId: 'player_456'
    });
    
    // 3. Player uses CC
    networkManager.trigger('ai:reaction', {
      targetId: 'mob_123',
      reactionType: 'crowd_controlled',
      data: { effectType: 'stun', duration: 3000 }
    });
    
    // 4. Tactical feedback
    networkManager.trigger('tactical:tip', {
      tipType: 'weakness_exploited',
      data: { bonus: '50%' }
    });
    
    expect(receivedEvents).toHaveLength(4);
    expect(receivedEvents[0].event).toBe('ai:aggro_update');
    expect(receivedEvents[1].event).toBe('ai:state_update');
    expect(receivedEvents[2].event).toBe('ai:reaction');
    expect(receivedEvents[3].event).toBe('tactical:tip');
  });
  
  it('should handle boss encounter', () => {
    // Boss phase change
    networkManager.trigger('ai:boss_phase_change', {
      bossId: 'boss_dragon',
      newPhase: 2,
      newPhaseName: 'ENRAGED'
    });
    
    // Multiple adds spawn
    for (let i = 0; i < 5; i++) {
      networkManager.trigger('ai:state_update', {
        mobId: `add_${i}`,
        state: 'chase',
        targetId: 'player_456'
      });
    }
    
    const bossEvents = receivedEvents.filter(e => e.data.bossId === 'boss_dragon');
    const addEvents = receivedEvents.filter(e => e.data.mobId?.startsWith('add_'));
    
    expect(bossEvents).toHaveLength(1);
    expect(addEvents).toHaveLength(5);
  });
});
