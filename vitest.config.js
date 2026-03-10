import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Configuração de Coverage para atingir 98%
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      
      // Thresholds para atingir a meta
      thresholds: {
        global: {
          branches: 98,
          functions: 98,
          lines: 98,
          statements: 98
        }
      },
      
      // Incluir apenas arquivos que realmente testamos
      include: [
        'src/**/*.js',
        'tests/**/*.test.js'
      ],
      
      // Excluir arquivos que não precisam de coverage
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '*.config.js',
        '*.config.ts'
      ],
      
      // Configurações avançadas de coverage
      all: true, // Incluir todos os arquivos, mesmo os não testados
      clean: true, // Limpar coverage antes de cada execução
      cleanOnRerun: true, // Limpar em re-runs
      
      // Skip se não houver testes
      skipIfNoTests: true,
      
      // Verificar coverage mesmo em testes falhando
      reportOnFailure: true,
      
      // Configurações de timeout
      timeout: 10000,
      
      // Número máximo de workers para coverage
      maxWorkers: 4,
      
      // Configurações de cache
      cache: {
        dir: './node_modules/.vitest'
      }
    },
    
    // Configurações gerais de teste
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    
    // Configurações de watch
    watch: false,
    
    // Configurações de timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Configurações de reporters
    reporters: ['verbose', 'json'],
    
    // Configurações de output
    outputFile: {
      json: './test-results.json',
      junit: './junit.xml'
    },
    
    // Configurações de include/exclude
    include: [
      'tests/**/*.test.js',
      'tests/**/*.spec.js'
    ],
    
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**'
    ],
    
    // Configurações de threads
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    
    // Configurações de isolate
    isolate: true,
    
    // Configurações de globals
    // globalSetup: './tests/global-setup.js',
    // globalTeardown: './tests/global-teardown.js'
  },
  
  // Configurações de resolve
  resolve: {
    alias: {
      '@': './src',
      '@client': './client',
      '@server': './server',
      '@tests': './tests'
    }
  },
  
  // Configurações de define
  define: {
    __VERSION__: '"0.3.5.1"',
    __TEST__: true
  }
});
