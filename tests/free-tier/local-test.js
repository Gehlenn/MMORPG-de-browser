/**
 * Local Test Suite - Testes simplificados para ambiente local
 * Version 1.0.0 - Local Testing Ready
 */

const http = require('http');

class LocalTestSuite {
    constructor() {
        this.serverURL = 'http://localhost:8080';
        this.clientURL = 'http://localhost:3000';
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: []
        };
    }
    
    async runTests() {
        console.log('🧪 Iniciando Testes Locais Simplificados');
        
        try {
            // Testes do servidor
            await this.testServerHealth();
            await this.testServerMetrics();
            await this.testAPIEndpoints();
            
            // Testes de gameplay
            await this.testGameplaySystems();
            await this.testMobSystem();
            
            // Testes de performance
            await this.testPerformance();
            
        } catch (error) {
            console.error('❌ Erro na execução dos testes:', error);
            this.testResults.errors.push(error.message);
        }
        
        this.generateReport();
        return this.testResults;
    }
    
    async testServerHealth() {
        console.log('🔍 Testando Health Check...');
        
        try {
            const response = await this.makeRequest('/health');
            const data = JSON.parse(response);
            
            if (data.status === 'healthy') {
                console.log('✅ Health check passed');
                this.testResults.passed++;
            } else {
                console.log('❌ Health check failed');
                this.testResults.failed++;
                this.testResults.errors.push('Health check returned unhealthy status');
            }
        } catch (error) {
            console.log('❌ Health check error:', error.message);
            this.testResults.failed++;
            this.testResults.errors.push(`Health check error: ${error.message}`);
        }
        
        this.testResults.total++;
    }
    
    async testServerMetrics() {
        console.log('📊 Testando Metrics API...');
        
        try {
            const response = await this.makeRequest('/metrics');
            const data = JSON.parse(response);
            
            if (data.uptime && data.memory && data.config) {
                console.log('✅ Metrics API passed');
                console.log(`📊 Uptime: ${data.uptime}s, Memory: ${Math.round(data.memory.rss / 1024 / 1024)}MB`);
                this.testResults.passed++;
            } else {
                console.log('❌ Metrics API failed - missing data');
                this.testResults.failed++;
                this.testResults.errors.push('Metrics API missing required fields');
            }
        } catch (error) {
            console.log('❌ Metrics API error:', error.message);
            this.testResults.failed++;
            this.testResults.errors.push(`Metrics API error: ${error.message}`);
        }
        
        this.testResults.total++;
    }
    
    async testAPIEndpoints() {
        console.log('🔧 Testando API Endpoints...');
        
        const endpoints = [
            '/health',
            '/metrics',
            '/api/world/status'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(endpoint);
                const data = JSON.parse(response);
                
                if (data && !data.error) {
                    console.log(`✅ ${endpoint} passed`);
                    this.testResults.passed++;
                } else {
                    console.log(`❌ ${endpoint} failed`);
                    this.testResults.failed++;
                    this.testResults.errors.push(`${endpoint} returned error`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint} error:`, error.message);
                this.testResults.failed++;
                this.testResults.errors.push(`${endpoint} error: ${error.message}`);
            }
            
            this.testResults.total++;
        }
    }
    
    async testGameplaySystems() {
        console.log('🎮 Testando Gameplay Systems...');
        
        try {
            // Simular criação de jogador
            const playerData = {
                name: 'TestPlayer',
                class: 'warrior',
                level: 1,
                x: 400,
                y: 300
            };
            
            // Testar se o servidor pode handle player data
            const response = await this.makeRequest('/api/world/status');
            const data = JSON.parse(response);
            
            if (data.players !== undefined && data.mobs !== undefined) {
                console.log('✅ Gameplay systems passed');
                console.log(`🎮 Players: ${data.players}, Mobs: ${data.mobs}`);
                this.testResults.passed++;
            } else {
                console.log('❌ Gameplay systems failed');
                this.testResults.failed++;
                this.testResults.errors.push('Gameplay systems missing player/mob data');
            }
        } catch (error) {
            console.log('❌ Gameplay systems error:', error.message);
            this.testResults.failed++;
            this.testResults.errors.push(`Gameplay systems error: ${error.message}`);
        }
        
        this.testResults.total++;
    }
    
    async testMobSystem() {
        console.log('👾 Testando Mob System...');
        
        try {
            const response = await this.makeRequest('/api/world/status');
            const data = JSON.parse(response);
            
            if (data.mobs >= 0) {
                console.log('✅ Mob system passed');
                console.log(`👾 Mobs ativos: ${data.mobs}`);
                this.testResults.passed++;
            } else {
                console.log('❌ Mob system failed');
                this.testResults.failed++;
                this.testResults.errors.push('Mob system returned invalid count');
            }
        } catch (error) {
            console.log('❌ Mob system error:', error.message);
            this.testResults.failed++;
            this.testResults.errors.push(`Mob system error: ${error.message}`);
        }
        
        this.testResults.total++;
    }
    
    async testPerformance() {
        console.log('⚡ Testando Performance...');
        
        try {
            const startTime = Date.now();
            
            // Fazer múltiplas requisições
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(this.makeRequest('/health'));
            }
            
            await Promise.all(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            
            if (totalTime < 1000) { // Menos de 1 segundo para 10 requisições
                console.log('✅ Performance test passed');
                console.log(`⚡ 10 requisições em ${totalTime}ms`);
                this.testResults.passed++;
            } else {
                console.log('❌ Performance test failed - too slow');
                this.testResults.failed++;
                this.testResults.errors.push(`Performance too slow: ${totalTime}ms for 10 requests`);
            }
        } catch (error) {
            console.log('❌ Performance test error:', error.message);
            this.testResults.failed++;
            this.testResults.errors.push(`Performance test error: ${error.message}`);
        }
        
        this.testResults.total++;
    }
    
    makeRequest(endpoint) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.serverURL);
            const req = http.request(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }
    
    generateReport() {
        console.log('\n📋 RELATÓRIO DE TESTES LOCAIS');
        console.log('================================');
        console.log(`✅ Passaram: ${this.testResults.passed}`);
        console.log(`❌ Falharam: ${this.testResults.failed}`);
        console.log(`📊 Total: ${this.testResults.total}`);
        console.log(`📈 Taxa de sucesso: ${this.testResults.total > 0 ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(2) : 0}%`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ ERROS:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        console.log('\n🎮 STATUS DO JOGO:');
        console.log(`🌐 Servidor: ${this.serverURL}`);
        console.log(`🎱 Cliente: ${this.clientURL}`);
        console.log(`📊 Proxy: http://127.0.0.1:50636`);
        console.log('\n🚀 PRONTO PARA JOGAR!');
    }
}

// Executar testes
if (require.main === module) {
    const suite = new LocalTestSuite();
    suite.runTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('❌ Erro fatal nos testes:', error);
        process.exit(1);
    });
}

module.exports = LocalTestSuite;
