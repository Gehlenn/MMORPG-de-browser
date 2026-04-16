// Setup file para Vitest - Configuração global de testes
import { vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Configurar DOM global
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock do sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock do performance API
const performanceMock = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 2048 * 1024 * 1024
  }
};

global.performance = performanceMock;

// Mock do requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock do Canvas API
class MockCanvasRenderingContext2D {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 1;
    this.font = '';
    this.textAlign = '';
    this.textBaseline = '';
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
    this.shadowBlur = 0;
    this.shadowColor = '';
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
    this.lineCap = 'butt';
    this.lineJoin = 'miter';
    this.miterLimit = 10;
  }

  fillRect(x, y, width, height) {
    vi.mocked(this.fillRect).mockImplementation([x, y, width, height]);
  }

  strokeRect(x, y, width, height) {
    vi.mocked(this.strokeRect).mockImplementation([x, y, width, height]);
  }

  clearRect(x, y, width, height) {
    vi.mocked(this.clearRect).mockImplementation([x, y, width, height]);
  }

  fillText(text, x, y, maxWidth) {
    vi.mocked(this.fillText).mockImplementation([text, x, y, maxWidth]);
  }

  strokeText(text, x, y, maxWidth) {
    vi.mocked(this.strokeText).mockImplementation([text, x, y, maxWidth]);
  }

  beginPath() {
    vi.mocked(this.beginPath).mockImplementation([]);
  }

  closePath() {
    vi.mocked(this.closePath).mockImplementation([]);
  }

  moveTo(x, y) {
    vi.mocked(this.moveTo).mockImplementation([x, y]);
  }

  lineTo(x, y) {
    vi.mocked(this.lineTo).mockImplementation([x, y]);
  }

  arc(x, y, radius, startAngle, endAngle, anticlockwise) {
    vi.mocked(this.arc).mockImplementation([x, y, radius, startAngle, endAngle, anticlockwise]);
  }

  rect(x, y, width, height) {
    vi.mocked(this.rect).mockImplementation([x, y, width, height]);
  }

  stroke() {
    vi.mocked(this.stroke).mockImplementation([]);
  }

  fill() {
    vi.mocked(this.fill).mockImplementation([]);
  }

  save() {
    vi.mocked(this.save).mockImplementation([]);
  }

  restore() {
    vi.mocked(this.restore).mockImplementation([]);
  }

  translate(x, y) {
    vi.mocked(this.translate).mockImplementation([x, y]);
  }

  rotate(angle) {
    vi.mocked(this.rotate).mockImplementation([angle]);
  }

  scale(x, y) {
    vi.mocked(this.scale).mockImplementation([x, y]);
  }

  transform(a, b, c, d, e, f) {
    vi.mocked(this.transform).mockImplementation([a, b, c, d, e, f]);
  }

  setTransform(a, b, c, d, e, f) {
    vi.mocked(this.setTransform).mockImplementation([a, b, c, d, e, f]);
  }

  resetTransform() {
    vi.mocked(this.resetTransform).mockImplementation([]);
  }

  createLinearGradient(x0, y0, x1, y1) {
    return {
      addColorStop: vi.fn(),
      __proto__: CanvasGradient.prototype
    };
  }

  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    return {
      addColorStop: vi.fn(),
      __proto__: CanvasGradient.prototype
    };
  }

  createPattern(image, repetition) {
    return {
      __proto__: CanvasPattern.prototype
    };
  }

  getImageData(x, y, width, height) {
    return {
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
      __proto__: ImageData.prototype
    };
  }

  putImageData(imageData, x, y) {
    vi.mocked(this.putImageData).mockImplementation([imageData, x, y]);
  }

  drawImage(image, ...args) {
    vi.mocked(this.drawImage).mockImplementation([image, ...args]);
  }

  createImageData(width, height) {
    return {
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
      __proto__: ImageData.prototype
    };
  }

  isPointInPath(x, y) {
    return false;
  }

  isPointInStroke(x, y) {
    return false;
  }

  measureText(text) {
    return {
      width: text.length * 8,
      __proto__: TextMetrics.prototype
    };
  }
}

// Mock do Canvas
class MockCanvas {
  constructor(width = 800, height = 600) {
    this.width = width;
    this.height = height;
    this.style = {
      width: width + 'px',
      height: height + 'px'
    };
  }

  getContext(contextType) {
    if (contextType === '2d') {
      return new MockCanvasRenderingContext2D();
    }
    return null;
  }

  toDataURL(type = 'image/png', quality) {
    return 'data:image/png;base64,mock';
  }

  toBlob(callback, type = 'image/png', quality) {
    callback(new Blob(['mock'], { type }));
  }
}

global.HTMLCanvasElement = MockCanvas;
global.CanvasRenderingContext2D = MockCanvasRenderingContext2D;

// Mock do WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
    
    // Simular conexão bem-sucedida
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 10);
  }

  send(data) {
    if (this.readyState === WebSocket.OPEN) {
      // Simular envio
    }
  }

  close(code, reason) {
    this.readyState = WebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = WebSocket.CLOSED;
      if (this.onclose) this.onclose();
    }, 10);
  }

  addEventListener(event, callback) {
    this[`on${event}`] = callback;
  }

  removeEventListener(event, callback) {
    this[`on${event}`] = null;
  }
}

global.WebSocket = MockWebSocket;

// Mock do Fetch API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
  })
);

// Mock do IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock do ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock do MutationObserver
global.MutationObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}));

// Mock do console para evitar poluição nos testes
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Configurar timeout para testes
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000
});

// Cleanup após cada teste
beforeEach(() => {
  // Limpar mocks
  vi.clearAllMocks();
  
  // Reset localStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Reset sessionStorage
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset performance
  performanceMock.now.mockClear();
  
  // Reset requestAnimationFrame
  vi.clearAllTimers();
});

afterEach(() => {
  // Limpar timers
  vi.clearAllTimers();
  
  // Limpar DOM
  document.body.innerHTML = '';
  
  // Reset console
  console.log.mockClear();
  console.warn.mockClear();
  console.error.mockClear();
  console.info.mockClear();
  console.debug.mockClear();
});

// Exportar utilidades para testes
export {
  MockCanvas,
  MockCanvasRenderingContext2D,
  MockWebSocket,
  localStorageMock,
  sessionStorageMock,
  performanceMock
};
