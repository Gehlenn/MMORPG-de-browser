/**
 * QA Automation Suite - Free Tier Testing
 * Suite completa de testes automatizados para ambiente gratuito
 * Version 1.0.0 - Free Tier Ready
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class FreeTierAutomationSuite {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            duration: 0,
            errors: []
        };
        this.config = {
            baseURL: process.env.TEST_URL || 'http://localhost:3000',
            headless: process.env.HEADLESS !== 'false',
            timeout: 30000,
            retries: 2,
            screenshots: true,
            videos: false // Desabilitado para economizar espaço
        };
    }
    
    async initialize() {
        console.log('🧪 Inicializando QA Automation Suite v1.0.0');
        
        try {
            // Criar diretórios de testes
            await this.createTestDirectories();
            
            // Inicializar browser
            await this.initializeBrowser();
            
            console.log('✅ QA Automation Suite inicializado');
        } catch (error) {
            console.error('❌ Falha na inicialização:', error);
            throw error;
        }
    }
    
    async createTestDirectories() {
        const dirs = [
            'tests/results',
            'tests/screenshots',
            'tests/reports',
            'tests/logs'
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }
    
    async initializeBrowser() {
        this.browser = await chromium.launch({
            headless: this.config.headless,
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Configurar timeout
        this.page.setDefaultTimeout(this.config.timeout);
        
        // Configurar viewport
        await this.page.setViewportSize({ width: 1280, height: 720 });
        
        // Interceptar requisições para monitoramento
        await this.page.route('**/*', (route) => {
            const url = route.request().url();
            
            // Log requisições importantes
            if (url.includes('/api/') || url.includes('/socket.io/')) {
                console.log(`📡 ${route.request().method()} ${url}`);
            }
            
            route.continue();
        });
    }
    
    async runFullSuite() {
        console.log('🚀 Iniciando Full Test Suite');
        const startTime = Date.now();
        
        try {
            // Testes de Funcionalidade
            await this.runFunctionalTests();
            
            // Testes de Performance
            await this.runPerformanceTests();
            
            // Testes de Concorrência
            await this.runConcurrencyTests();
            
            // Testes de Stress
            await this.runStressTests();
            
            // Testes de UI/UX
            await this.runUITests();
            
            // Testes de API
            await this.runAPITests();
            
        } catch (error) {
            console.error('❌ Erro na execução da suite:', error);
            this.testResults.errors.push(error.message);
        } finally {
            this.testResults.duration = Date.now() - startTime;
            await this.generateReport();
            await this.cleanup();
        }
        
        return this.testResults;
    }
    
    async runFunctionalTests() {
        console.log('🧪 Executando Functional Tests');
        
        const tests = [
            { name: 'Load Homepage', test: () => this.testLoadHomepage() },
            { name: 'Login System', test: () => this.testLoginSystem() },
            { name: 'Character Creation', test: () => this.testCharacterCreation() },
            { name: 'Game World Load', test: () => this.testGameWorldLoad() },
            { name: 'Player Movement', test: () => this.testPlayerMovement() },
            { name: 'Combat System', test: () => this.testCombatSystem() },
            { name: 'Chat System', test: () => this.testChatSystem() },
            { name: 'Inventory System', test: () => this.testInventorySystem() }
        ];
        
        for (const test of tests) {
            await this.runTest(test.name, test.test);
        }
    }
    
    async runPerformanceTests() {
        console.log('⚡ Executando Performance Tests');
        
        const tests = [
            { name: 'Page Load Time', test: () => this.testPageLoadTime() },
            { name: 'Memory Usage', test: () => this.testMemoryUsage() },
            { name: 'CPU Usage', test: () => this.testCPUUsage() },
            { name: 'Network Latency', test: () => this.testNetworkLatency() },
            { name: 'Frame Rate', test: () => this.testFrameRate() }
        ];
        
        for (const test of tests) {
            await this.runTest(test.name, test.test);
        }
    }
    
    async runConcurrencyTests() {
        console.log('🔄 Executando Concurrency Tests');
        
        const tests = [
            { name: 'Multiple Players', test: () => this.testMultiplePlayers() },
            { name: 'Simultaneous Connections', test: () => this.testSimultaneousConnections() },
            { name: 'Chat Concurrency', test: () => this.testChatConcurrency() },
            { name: 'Mob Spawn Concurrency', test: () => this.testMobSpawnConcurrency() }
        ];
        
        for (const test of tests) {
            await this.runTest(test.name, test.test);
        }
    }
    
    async runStressTests() {
        console.log('💪 Executando Stress Tests');
        
        const tests = [
            { name: 'High Player Count', test: () => this.testHighPlayerCount() },
            { name: 'Long Session', test: () => this.testLongSession() },
            { name: 'Resource Exhaustion', test: () => this.testResourceExhaustion() }
        ];
        
        for (const test of tests) {
            await this.runTest(test.name, test.test);
        }
    }
    
    async runUITests() {
        console.log('🎨 Executando UI/UX Tests');
        
        const tests = [
            { name: 'Responsive Design', test: () => this.testResponsiveDesign() },
            { name: 'Accessibility', test: () => this.testAccessibility() },
            { name: 'Visual Consistency', test: () => this.testVisualConsistency() },
            { name: 'User Flow', test: () => this.testUserFlow() }
        ];
        
        for (const test of tests) {
            await this.runTest(test.name, test.test);
        }
    }
    
    async runAPITests() {
        console.log('🔧 Executando API Tests');
        
        const tests = [
            { name: 'Health Check', test: () => this.testHealthCheck() },
            { name: 'World Status', test: () => this.testWorldStatus() },
            { name: 'Player Join', test: () => this.testPlayerJoinAPI() },
            { name: 'Chat API', test: () => this.testChatAPI() }
        ];
        
        for (const test of tests) {
            await this.runTest(test.name, test.test);
        }
    }
    
    async runTest(testName, testFunction) {
        this.testResults.total++;
        
        try {
            console.log(`🧪 Executando: ${testName}`);
            const startTime = Date.now();
            
            await testFunction();
            
            const duration = Date.now() - startTime;
            console.log(`✅ ${testName} - ${duration}ms`);
            this.testResults.passed++;
            
            // Screenshot em caso de sucesso
            if (this.config.screenshots) {
                await this.takeScreenshot(`${testName}-success`);
            }
            
        } catch (error) {
            console.error(`❌ ${testName} - ${error.message}`);
            this.testResults.failed++;
            this.testResults.errors.push(`${testName}: ${error.message}`);
            
            // Screenshot em caso de erro
            if (this.config.screenshots) {
                await this.takeScreenshot(`${testName}-error`);
            }
        }
    }
    
    // Testes Funcionais
    async testLoadHomepage() {
        await this.page.goto(this.config.baseURL);
        
        // Verificar se a página carregou
        const title = await this.page.title();
        if (!title.includes('Legacy of Komodo')) {
            throw new Error('Título da página não encontrado');
        }
        
        // Verificar elementos principais
        const loginScreen = await this.page.locator('#loginScreen').isVisible();
        if (!loginScreen) {
            throw new Error('Tela de login não encontrada');
        }
    }
    
    async testLoginSystem() {
        await this.page.goto(this.config.baseURL);
        
        // Preencher formulário de login
        await this.page.fill('#username', 'testuser');
        await this.page.fill('#password', 'testpass');
        
        // Clicar em login
        await this.page.click('#loginButton');
        
        // Aguardar redirecionamento
        await this.page.waitForSelector('#gameScreen', { timeout: 5000 });
        
        // Verificar se o login foi bem-sucedido
        const gameScreen = await this.page.locator('#gameScreen').isVisible();
        if (!gameScreen) {
            throw new Error('Login falhou');
        }
    }
    
    async testCharacterCreation() {
        await this.page.goto(this.config.baseURL);
        
        // Fazer login
        await this.page.fill('#username', 'testuser');
        await this.page.fill('#password', 'testpass');
        await this.page.click('#loginButton');
        
        // Aguardar tela de personagem
        await this.page.waitForSelector('#characterSelection', { timeout: 5000 });
        
        // Selecionar classe
        await this.page.click('.class-option[data-class="warrior"]');
        
        // Criar personagem
        await this.page.fill('#characterName', 'TestWarrior');
        await this.page.click('#createCharacterButton');
        
        // Aguardar tela do jogo
        await this.page.waitForSelector('#gameCanvas', { timeout: 5000 });
        
        // Verificar se o personagem foi criado
        const canvas = await this.page.locator('#gameCanvas').isVisible();
        if (!canvas) {
            throw new Error('Criação de personagem falhou');
        }
    }
    
    async testGameWorldLoad() {
        await this.page.goto(this.config.baseURL);
        
        // Login rápido
        await this.quickLogin();
        
        // Aguardar carregamento do mundo
        await this.page.waitForSelector('#gameCanvas', { timeout: 10000 });
        
        // Verificar elementos do mundo
        const minimap = await this.page.locator('#minimap').isVisible();
        if (!minimap) {
            throw new Error('Minimapa não encontrado');
        }
        
        const hud = await this.page.locator('.hud-top-bar').isVisible();
        if (!hud) {
            throw new Error('HUD não encontrado');
        }
    }
    
    async testPlayerMovement() {
        await this.page.goto(this.config.baseURL);
        await this.quickLogin();
        
        // Aguardar carregamento
        await this.page.waitForSelector('#gameCanvas', { timeout: 10000 });
        
        // Obter posição inicial
        const initialPosition = await this.page.evaluate(() => {
            return window.gameplayEngine ? window.gameplayEngine.getPlayer().position : null;
        });
        
        if (!initialPosition) {
            throw new Error('Posição inicial não encontrada');
        }
        
        // Simular movimento (pressionar W)
        await this.page.keyboard.press('w');
        await this.page.waitForTimeout(1000);
        await this.page.keyboard.up('w');
        
        // Verificar se a posição mudou
        const newPosition = await this.page.evaluate(() => {
            return window.gameplayEngine ? window.gameplayEngine.getPlayer().position : null;
        });
        
        if (!newPosition || newPosition.x === initialPosition.x && newPosition.y === initialPosition.y) {
            throw new Error('Movimento do jogador não funcionou');
        }
    }
    
    async testCombatSystem() {
        await this.page.goto(this.config.baseURL);
        await this.quickLogin();
        
        // Aguardar carregamento
        await this.page.waitForSelector('#gameCanvas', { timeout: 10000 });
        
        // Spawn mob de teste
        await this.page.keyboard.press('F2');
        await this.page.waitForTimeout(1000);
        
        // Verificar se o mob apareceu
        const mobCount = await this.page.evaluate(() => {
            return window.gameplayEngine ? window.gameplayEngine.getMobs().length : 0;
        });
        
        if (mobCount === 0) {
            throw new Error('Mob não spawnou');
        }
        
        // Mover perto do mob e atacar
        await this.page.keyboard.press('w');
        await this.page.waitForTimeout(500);
        await this.page.keyboard.up('w');
        await this.page.keyboard.press('space'); // Ataque
        await this.page.waitForTimeout(500);
        
        // Verificar se houve dano
        const mobHP = await this.page.evaluate(() => {
            const mobs = window.gameplayEngine ? window.gameplayEngine.getMobs() : [];
            return mobs.length > 0 ? mobs[0].hp : null;
        });
        
        if (mobHP === null || mobHP >= 100) {
            throw new Error('Sistema de combate não funcionou');
        }
    }
    
    async testChatSystem() {
        await this.page.goto(this.config.baseURL);
        await this.quickLogin();
        
        // Aguardar carregamento
        await this.page.waitForSelector('#gameCanvas', { timeout: 10000 });
        
        // Enviar mensagem no chat
        await this.page.fill('#chatInput', 'Hello World!');
        await this.page.click('#chatSend');
        
        // Verificar se a mensagem apareceu
        const messageExists = await this.page.locator('.chat-message').filter({ hasText: 'Hello World!' }).isVisible();
        
        if (!messageExists) {
            throw new Error('Chat não funcionou');
        }
    }
    
    async testInventorySystem() {
        await this.page.goto(this.config.baseURL);
        await this.quickLogin();
        
        // Aguardar carregamento
        await this.page.waitForSelector('#gameCanvas', { timeout: 10000 });
        
        // Verificar se o inventário está visível
        const inventory = await this.page.locator('.inventory-grid').isVisible();
        if (!inventory) {
            throw new Error('Inventário não encontrado');
        }
        
        // Verificar slots
        const slots = await this.page.locator('.inventory-slot').count();
        if (slots === 0) {
            throw new Error('Slots do inventário não encontrados');
        }
    }
    
    // Testes de Performance
    async testPageLoadTime() {
        const startTime = Date.now();
        await this.page.goto(this.config.baseURL);
        const loadTime = Date.now() - startTime;
        
        if (loadTime > 5000) {
            throw new Error(`Tempo de carregamento muito alto: ${loadTime}ms`);
        }
        
        console.log(`⚡ Tempo de carregamento: ${loadTime}ms`);
    }
    
    async testMemoryUsage() {
        const metrics = await this.page.evaluate(() => {
            if (performance.memory) {
                return {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                };
            }
            return null;
        });
        
        if (metrics && metrics.used > 200) {
            throw new Error(`Uso de memória muito alto: ${metrics.used}MB`);
        }
        
        console.log(`💾 Memória usada: ${metrics ? metrics.used + 'MB' : 'N/A'}`);
    }
    
    async testNetworkLatency() {
        const startTime = Date.now();
        await this.page.evaluate(() => fetch('/health'));
        const latency = Date.now() - startTime;
        
        if (latency > 1000) {
            throw new Error(`Latência muito alta: ${latency}ms`);
        }
        
        console.log(`🌐 Latência da rede: ${latency}ms`);
    }
    
    // Testes de Concorrência
    async testMultiplePlayers() {
        // Simular múltiplos jogadores
        const players = [];
        
        for (let i = 0; i < 5; i++) {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            
            await page.goto(this.config.baseURL);
            await page.fill('#username', `player${i}`);
            await page.fill('#password', 'testpass');
            await page.click('#loginButton');
            
            players.push({ context, page });
        }
        
        // Aguardar um pouco
        await this.page.waitForTimeout(2000);
        
        // Verificar se todos estão online
        const healthResponse = await this.page.evaluate(async () => {
            const response = await fetch('/health');
            return response.json();
        });
        
        if (healthResponse.players < 5) {
            throw new Error('Nem todos os jogadores estão online');
        }
        
        // Limpar
        for (const player of players) {
            await player.context.close();
        }
        
        console.log(`🔄 Teste de múltiplos jogadores: ${healthResponse.players} online`);
    }
    
    // Métodos utilitários
    async quickLogin() {
        await this.page.goto(this.config.baseURL);
        await this.page.fill('#username', 'testuser');
        await this.page.fill('#password', 'testpass');
        await this.page.click('#loginButton');
        await this.page.waitForSelector('#gameCanvas', { timeout: 10000 });
    }
    
    async takeScreenshot(name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `tests/screenshots/${name}-${timestamp}.png`;
        
        await this.page.screenshot({ path: filename, fullPage: true });
        console.log(`📸 Screenshot salvo: ${filename}`);
    }
    
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.testResults,
            config: this.config,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };
        
        const reportPath = `tests/results/report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Gerar relatório HTML
        const htmlReport = this.generateHTMLReport(report);
        const htmlPath = `tests/results/report-${Date.now()}.html`;
        fs.writeFileSync(htmlPath, htmlReport);
        
        console.log(`📋 Relatório gerado: ${reportPath}`);
        console.log(`🌐 Relatório HTML: ${htmlPath}`);
        
        // Log do resumo
        console.log('\n📊 RESUMO DOS TESTES:');
        console.log(`✅ Passaram: ${this.testResults.passed}`);
        console.log(`❌ Falharam: ${this.testResults.failed}`);
        console.log(`⏭️ Pulados: ${this.testResults.skipped}`);
        console.log(`📊 Total: ${this.testResults.total}`);
        console.log(`⏱️ Duração: ${this.testResults.duration}ms`);
        console.log(`📈 Taxa de sucesso: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);
    }
    
    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>QA Automation Report - ${report.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .passed { color: green; }
        .failed { color: red; }
        .skipped { color: orange; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>🧪 QA Automation Report</h1>
    <div class="summary">
        <h2>📊 Resumo</h2>
        <p><span class="passed">✅ Passaram: ${report.summary.passed}</span></p>
        <p><span class="failed">❌ Falharam: ${report.summary.failed}</span></p>
        <p><span class="skipped">⏭️ Pulados: ${report.summary.skipped}</span></p>
        <p><strong>📊 Total: ${report.summary.total}</strong></p>
        <p><strong>⏱️ Duração: ${report.summary.duration}ms</strong></p>
        <p><strong>📈 Taxa de sucesso: ${((report.summary.passed / report.summary.total) * 100).toFixed(2)}%</strong></p>
    </div>
    
    <h2>🔧 Configuração</h2>
    <table>
        <tr><th>Base URL</th><td>${report.config.baseURL}</td></tr>
        <tr><th>Headless</th><td>${report.config.headless}</td></tr>
        <tr><th>Timeout</th><td>${report.config.timeout}ms</td></tr>
    </table>
    
    <h2>🌍 Ambiente</h2>
    <table>
        <tr><th>Node Version</th><td>${report.environment.nodeVersion}</td></tr>
        <tr><th>Platform</th><td>${report.environment.platform}</td></tr>
        <tr><th>Architecture</th><td>${report.environment.arch}</td></tr>
    </table>
    
    ${report.summary.errors.length > 0 ? `
    <h2>❌ Erros</h2>
    <ul>
        ${report.summary.errors.map(error => `<li>${error}</li>`).join('')}
    </ul>
    ` : ''}
    
    <p><em>Gerado em: ${report.timestamp}</em></p>
</body>
</html>
        `;
    }
    
    async cleanup() {
        if (this.page) {
            await this.page.close();
        }
        
        if (this.browser) {
            await this.browser.close();
        }
        
        console.log('🧹 QA Automation Suite limpo');
    }
}

// Executar suite se chamado diretamente
if (require.main === module) {
    const suite = new FreeTierAutomationSuite();
    suite.runFullSuite().then(results => {
        console.log('\n🎉 Testes concluídos!');
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('❌ Erro na execução dos testes:', error);
        process.exit(1);
    });
}

module.exports = FreeTierAutomationSuite;
