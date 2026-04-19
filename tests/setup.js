// Jest Setup File for Enhanced Testing
const { TextEncoder, TextDecoder } = require('util');

// Mock Canvas API
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Canvas and Context
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: () => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    strokeRect: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    fillStyle: '',
    font: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over'
  })
};

global.HTMLCanvasElement = function() {
  return mockCanvas;
};

global.document = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getElementById: jest.fn((id) => {
    // Return different mock elements based on ID for better testing
    if (id === 'gameCanvas') {
      return mockCanvas;
    }
    return {
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false)
      },
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      setAttribute: jest.fn(),
      textContent: '',
      innerHTML: '',
      value: ''
    };
  }),
  createElement: jest.fn((tag) => {
    if (tag === 'canvas') {
      return mockCanvas;
    }
    return {
      getContext: jest.fn(() => mockCanvas.getContext()),
      width: 800,
      height: 600,
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn()
      }
    };
  }),
  createElementNS: jest.fn(),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  },
  querySelector: jest.fn(() => null),
  querySelectorAll: jest.fn(() => [])
};

global.window = {
  requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: jest.fn(),
  performance: {
    now: jest.fn(() => Date.now())
  }
};

global.navigator = {
  userAgent: 'jest-test-environment'
};

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

global.localStorage = localStorageMock;

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore?.();
  console.warn.mockRestore?.();
  console.error.mockRestore?.();
});

// Set up global test helpers
global.testHelpers = {
  createMockPlayer: (overrides = {}) => ({
    id: 'test-player-1',
    name: 'TestPlayer',
    class: 'warrior',
    level: 1,
    experience: 0,
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    position: { x: 400, y: 300, z: 0 },
    velocity: { x: 0, y: 0 },
    stats: {
      strength: 12,
      agility: 8,
      intelligence: 6,
      speed: 5,
      critChance: 5,
      critMultiplier: 1.5
    },
    skills: [],
    inventory: [],
    ...overrides
  }),
  
  createMockMob: (overrides = {}) => ({
    id: 'test-mob-1',
    name: 'TestMob',
    type: 'goblin',
    level: 1,
    health: 50,
    maxHealth: 50,
    position: { x: 200, y: 200, z: 0 },
    velocity: { x: 0, y: 0 },
    stats: {
      damage: 10,
      defense: 5,
      speed: 3
    },
    ai: {
      behavior: 'aggressive',
      patrolRadius: 100,
      attackRadius: 50
    },
    ...overrides
  }),
  
  createMockItem: (overrides = {}) => ({
    id: 'test-item-1',
    name: 'Test Item',
    type: 'weapon',
    rarity: 'common',
    stats: {
      damage: 15,
      strength: 2
    },
    stackable: false,
    consumable: false,
    ...overrides
  }),
  
  createMockQuest: (overrides = {}) => ({
    id: 'test-quest-1',
    name: 'Test Quest',
    description: 'A test quest',
    type: 'kill',
    objectives: [
      {
        type: 'kill',
        target: 'goblin',
        count: 5,
        current: 0
      }
    ],
    rewards: {
      experience: 100,
      gold: 50,
      items: ['test-item-1']
    },
    requirements: {
      level: 1,
      class: null
    },
    status: 'available',
    ...overrides
  })
};
