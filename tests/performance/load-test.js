/**
 * Load Test Suite - Testes de Carga e Performance
 * Verifica escalabilidade e performance sob carga pesada
 * Version 1.0.0 - Performance Testing
 */

import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';

class LoadTestSuite {
    constructor() {
        this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
        this.maxUsers = 1000;
        this.rampUpTime = 60000; // 1 minuto
        this.testDuration = 300000; // 5 minutos
        this.metrics = {
            requests: 0,
            errors: 0,
            responseTime: [],
            memoryUsage: [],
            cpuUsage: []
        };
    }
    
    /**
     * Teste de carga básico
     */
    async basicLoadTest() {
        console.log('🚀 Iniciando teste de carga básico');
        
        const startTime = performance.now();
        const users = [];
        
        // Simular múltiplos usuários
        for (let i = 0; i < this.maxUsers; i++) {
            users.push(this.simulateUser(i));
            
            // Ramp-up gradual
            if (i % 50 === 0) {
                await this.sleep(this.rampUpTime / 50);
            }
        }
        
        // Aguardar todos os usuários completarem
        await Promise.all(users);
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        // Analisar resultados
        this.analyzeResults(totalTime);
        
        console.log('✅ Teste de carga básico concluído');
    }
    
    /**
     * Simula um usuário
     */
    async simulateUser(userId) {
        console.log(`👤 Simulando usuário ${userId}`);
        
        const userMetrics = {
            requests: 0,
            errors: 0,
            responseTime: []
        };
        
        try {
            // Login
            const loginStart = performance.now();
            await this.loginUser(`user${userId}`, `pass${userId}`);
            const loginTime = performance.now() - loginStart;
            userMetrics.responseTime.push(loginTime);
            userMetrics.requests++;
            
            // Navegar pelo jogo
            await this.simulateGameplay(userMetrics);
            
        } catch (error) {
            console.error(`❌ Erro no usuário ${userId}:`, error);
            userMetrics.errors++;
        }
        
        return userMetrics;
    }
    
    /**
     * Simula gameplay do usuário
     */
    async simulateGameplay(userMetrics) {
        const actions = [
            'move', 'attack', 'useSkill', 'interact', 'chat', 'trade'
        ];
        
        for (let i = 0; i < 100; i++) {
            const action = actions[Math.floor(Math.random() * actions.length)];
            
            try {
                const actionStart = performance.now();
                await this.performAction(action);
                const actionTime = performance.now() - actionStart;
                
                userMetrics.responseTime.push(actionTime);
                userMetrics.requests++;
                
                // Simular tempo entre ações
                await this.sleep(Math.random() * 1000 + 500);
                
            } catch (error) {
                console.error(`❌ Erro na ação ${action}:`, error);
                userMetrics.errors++;
            }
        }
    }
    
    /**
     * Realiza login do usuário
     */
    async loginUser(username, password) {
        const response = await fetch(`${this.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            throw new Error(`Login falhou: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    /**
     * Realiza ação no jogo
     */
    async performAction(action) {
        const response = await fetch(`${this.baseURL}/api/game/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({ action, timestamp: Date.now() })
        });
        
        if (!response.ok) {
            throw new Error(`Ação ${action} falhou: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    /**
     * Obtém token de autenticação
     */
    getAuthToken() {
        return 'mock-token';
    }
    
    /**
     * Teste de stress do servidor
     */
    async stressTest() {
        console.log('💪 Iniciando teste de stress do servidor');
        
        const stressLevels = [100, 500, 1000, 2000, 5000];
        
        for (const level of stressLevels) {
            console.log(`📊 Testando com ${level} usuários simultâneos`);
            
            const startTime = performance.now();
            
            // Criar carga simultânea
            const promises = [];
            for (let i = 0; i < level; i++) {
                promises.push(this.createLoad(i));
            }
            
            await Promise.all(promises);
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Coletar métricas do servidor
            await this.collectServerMetrics(level, duration);
            
            // Aguardar recuperação
            await this.sleep(5000);
        }
        
        console.log('✅ Teste de stress concluído');
    }
    
    /**
     * Cria carga de teste
     */
    async createLoad(userId) {
        const requests = [];
        
        // Gerar 10 requisições por usuário
        for (let i = 0; i < 10; i++) {
            requests.push(this.makeRequest(userId, i));
        }
        
        await Promise.all(requests);
    }
    
    /**
     * Faz requisição de teste
     */
    async makeRequest(userId, requestId) {
        const start = performance.now();
        
        try {
            const response = await fetch(`${this.baseURL}/api/test/load`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    requestId,
                    timestamp: Date.now()
                })
            });
            
            const end = performance.now();
            const responseTime = end - start;
            
            if (!response.ok) {
                throw new Error(`Request failed: ${response.statusText}`);
            }
            
            this.metrics.requests++;
            this.metrics.responseTime.push(responseTime);
            
        } catch (error) {
            this.metrics.errors++;
            console.error(`❌ Request error for user ${userId}:`, error);
        }
    }
    
    /**
     * Coleta métricas do servidor
     */
    async collectServerMetrics(userCount, duration) {
        try {
            const response = await fetch(`${this.baseURL}/api/metrics`);
            const metrics = await response.json();
            
            console.log(`📊 Métricas do servidor (${userCount} usuários):`);
            console.log(`  - CPU: ${metrics.cpu}%`);
            console.log(`  - Memory: ${metrics.memory}%`);
            console.log(`  - Response Time: ${metrics.responseTime}ms`);
            console.log(`  - Throughput: ${metrics.throughput} req/s`);
            console.log(`  - Duration: ${duration}ms`);
            
            this.metrics.memoryUsage.push(metrics.memory);
            this.metrics.cpuUsage.push(metrics.cpu);
            
        } catch (error) {
            console.error('❌ Erro ao coletar métricas:', error);
        }
    }
    
    /**
     * Teste de endurance
     */
    async enduranceTest() {
        console.log('⏱️ Iniciando teste de endurance (24 horas)');
        
        const startTime = Date.now();
        const endTime = startTime + (24 * 60 * 60 * 1000); // 24 horas
        
        while (Date.now() < endTime) {
            // Teste de carga a cada hora
            await this.basicLoadTest();
            
            // Aguardar próxima hora
            await this.sleep(60 * 60 * 1000);
            
            // Verificar estabilidade
            this.checkStability();
        }
        
        console.log('✅ Teste de endurance concluído');
    }
    
    /**
     * Teste de escalabilidade
     */
    async scalabilityTest() {
        console.log('📈 Iniciando teste de escalabilidade');
        
        const scenarios = [
            { users: 100, duration: 60000 },
            { users: 500, duration: 120000 },
            { users: 1000, duration: 180000 },
            { users: 2000, duration: 240000 },
            { users: 5000, duration: 300000 }
        ];
        
        for (const scenario of scenarios) {
            console.log(`📊 Testando escalabilidade: ${scenario.users} usuários por ${scenario.duration/1000}s`);
            
            const results = await this.runScalabilityScenario(scenario);
            
            // Analisar degradação de performance
            this.analyzeScalability(results);
        }
        
        console.log('✅ Teste de escalabilidade concluído');
    }
    
    /**
     * Executa cenário de escalabilidade
     */
    async runScalabilityScenario(scenario) {
        const startTime = performance.now();
        const promises = [];
        
        // Criar usuários gradualmente
        for (let i = 0; i < scenario.users; i++) {
            promises.push(this.simulateUser(i));
            
            if (i % 100 === 0) {
                await this.sleep(1000);
            }
        }
        
        // Manter carga durante o período
        const loadPromises = [];
        for (let i = 0; i < scenario.users; i++) {
            loadPromises.push(this.maintainLoad(i, scenario.duration));
        }
        
        await Promise.all([...promises, ...loadPromises]);
        
        const endTime = performance.now();
        
        return {
            duration: endTime - startTime,
            users: scenario.users,
            metrics: { ...this.metrics }
        };
    }
    
    /**
     * Mantém carga contínua
     */
    async maintainLoad(userId, duration) {
        const endTime = Date.now() + duration;
        
        while (Date.now() < endTime) {
            await this.makeRequest(userId, Math.random());
            await this.sleep(Math.random() * 5000 + 1000);
        }
    }
    
    /**
     * Analisa resultados dos testes
     */
    analyzeResults(totalTime) {
        const avgResponseTime = this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length;
        const maxResponseTime = Math.max(...this.metrics.responseTime);
        const minResponseTime = Math.min(...this.metrics.responseTime);
        const errorRate = (this.metrics.errors / this.metrics.requests) * 100;
        const throughput = (this.metrics.requests / totalTime) * 1000;
        
        console.log('📊 Resultados do Teste:');
        console.log(`  - Total Requests: ${this.metrics.requests}`);
        console.log(`  - Errors: ${this.metrics.errors}`);
        console.log(`  - Error Rate: ${errorRate.toFixed(2)}%`);
        console.log(`  - Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`  - Max Response Time: ${maxResponseTime.toFixed(2)}ms`);
        console.log(`  - Min Response Time: ${minResponseTime.toFixed(2)}ms`);
        console.log(`  - Throughput: ${throughput.toFixed(2)} req/s`);
        console.log(`  - Total Time: ${totalTime.toFixed(2)}ms`);
        
        // Verificar se atende aos requisitos
        this.validateRequirements(avgResponseTime, errorRate, throughput);
    }
    
    /**
     * Valida requisitos de performance
     */
    validateRequirements(avgResponseTime, errorRate, throughput) {
        const requirements = {
            maxResponseTime: 100, // ms
            maxErrorRate: 1, // %
            minThroughput: 1000 // req/s
        };
        
        if (avgResponseTime > requirements.maxResponseTime) {
            console.warn(`⚠️ Response time acima do limite: ${avgResponseTime.toFixed(2)}ms > ${requirements.maxResponseTime}ms`);
        }
        
        if (errorRate > requirements.maxErrorRate) {
            console.warn(`⚠️ Error rate acima do limite: ${errorRate.toFixed(2)}% > ${requirements.maxErrorRate}%`);
        }
        
        if (throughput < requirements.minThroughput) {
            console.warn(`⚠️ Throughput abaixo do limite: ${throughput.toFixed(2)} req/s < ${requirements.minThroughput} req/s`);
        }
        
        if (avgResponseTime <= requirements.maxResponseTime && 
            errorRate <= requirements.maxErrorRate && 
            throughput >= requirements.minThroughput) {
            console.log('✅ Todos os requisitos de performance atendidos!');
        }
    }
    
    /**
     * Verifica estabilidade do sistema
     */
    checkStability() {
        const recentMemory = this.metrics.memoryUsage.slice(-10);
        const recentCPU = this.metrics.cpuUsage.slice(-10);
        
        const avgMemory = recentMemory.reduce((a, b) => a + b, 0) / recentMemory.length;
        const avgCPU = recentCPU.reduce((a, b) => a + b, 0) / recentCPU.length;
        
        console.log(`📊 Estabilidade - Memory: ${avgMemory.toFixed(2)}%, CPU: ${avgCPU.toFixed(2)}%`);
        
        if (avgMemory > 90) {
            console.warn('⚠️ Alto uso de memória detectado');
        }
        
        if (avgCPU > 80) {
            console.warn('⚠️ Alto uso de CPU detectado');
        }
    }
    
    /**
     * Analisa escalabilidade
     */
    analyzeScalability(results) {
        console.log(`📊 Análise de escalabilidade para ${results.users} usuários:`);
        console.log(`  - Duração: ${results.duration.toFixed(2)}ms`);
        console.log(`  - Requests: ${results.metrics.requests}`);
        console.log(`  - Throughput: ${(results.metrics.requests / results.duration * 1000).toFixed(2)} req/s`);
        
        // Calcular degradação
        const baselineThroughput = 1000; // baseline para 1 usuário
        const currentThroughput = results.metrics.requests / results.duration * 1000;
        const degradation = ((baselineThroughput - currentThroughput) / baselineThroughput) * 100;
        
        console.log(`  - Degradação: ${degradation.toFixed(2)}%`);
        
        if (degradation > 50) {
            console.warn('⚠️ Alta degradação de performance detectada');
        }
    }
    
    /**
     * Gera relatório completo
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalRequests: this.metrics.requests,
                totalErrors: this.metrics.errors,
                errorRate: (this.metrics.errors / this.metrics.requests) * 100,
                avgResponseTime: this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length,
                maxResponseTime: Math.max(...this.metrics.responseTime),
                minResponseTime: Math.min(...this.metrics.responseTime)
            },
            performance: {
                memoryUsage: this.metrics.memoryUsage,
                cpuUsage: this.metrics.cpuUsage,
                throughput: this.calculateThroughput()
            },
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }
    
    /**
     * Calcula throughput
     */
    calculateThroughput() {
        if (this.metrics.responseTime.length === 0) return 0;
        
        const totalTime = this.metrics.responseTime.reduce((a, b) => a + b, 0);
        return (this.metrics.requests / totalTime) * 1000;
    }
    
    /**
     * Gera recomendações
     */
    generateRecommendations() {
        const recommendations = [];
        
        const avgResponseTime = this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length;
        const errorRate = (this.metrics.errors / this.metrics.requests) * 100;
        
        if (avgResponseTime > 100) {
            recommendations.push('Otimizar response time - implementar cache adicional');
        }
        
        if (errorRate > 1) {
            recommendations.push('Reduzir error rate - melhorar tratamento de erros e retry logic');
        }
        
        const avgMemory = this.metrics.memoryUsage.reduce((a, b) => a + b, 0) / this.metrics.memoryUsage.length;
        if (avgMemory > 80) {
            recommendations.push('Otimizar uso de memória - implementar garbage collection');
        }
        
        const avgCPU = this.metrics.cpuUsage.reduce((a, b) => a + b, 0) / this.metrics.cpuUsage.length;
        if (avgCPU > 70) {
            recommendations.push('Otimizar uso de CPU - implementar load balancing');
        }
        
        return recommendations;
    }
    
    /**
     * Função utilitária de sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Exportar para uso nos testes
export default LoadTestSuite;

// Testes do Playwright
test.describe('Load Tests', () => {
    let loadTestSuite;
    
    test.beforeAll(async () => {
        loadTestSuite = new LoadTestSuite();
    });
    
    test('Basic Load Test', async () => {
        await loadTestSuite.basicLoadTest();
    });
    
    test('Stress Test', async () => {
        await loadTestSuite.stressTest();
    });
    
    test('Scalability Test', async () => {
        await loadTestSuite.scalabilityTest();
    });
    
    test('Generate Performance Report', async () => {
        const report = loadTestSuite.generateReport();
        console.log('📊 Performance Report:', JSON.stringify(report, null, 2));
        
        // Validar requisitos
        expect(report.summary.errorRate).toBeLessThan(1);
        expect(report.summary.avgResponseTime).toBeLessThan(100);
        expect(report.performance.throughput).toBeGreaterThan(1000);
    });
});
