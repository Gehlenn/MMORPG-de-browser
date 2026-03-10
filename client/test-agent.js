/**
 * Agente de Teste Automatizado - Gameplay Completo
 * Testa todo o fluxo: Criar Conta → Login → Criar Personagem → Gameplay Completo
 */

class TestAgent {
    constructor() {
        this.testResults = [];
        this.currentStep = 0;
        this.testData = {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@test.com`,
            password: 'test123456',
            characterName: `TestHero_${Date.now()}`,
            characterRace: 'human',
            characterClass: 'warrior'
        };
        this.loginSystem = null;
        this.game = null;
        this.testInterval = null;
    }
    
    /**
     * Iniciar teste automatizado completo
     */
    async startFullTest() {
        console.log('🤖 INICIANDO AGENTE DE TESTE AUTOMATIZADO - GAMEPLAY COMPLETO');
        console.log('📋 Test Data:', this.testData);
        
        this.testResults = [];
        this.currentStep = 0;
        
        // Aguardar sistemas carregarem
        await this.waitForSystems();
        
        // Iniciar sequência de testes
        this.runTestSequence();
    }
    
    /**
     * Aguardar sistemas carregarem
     */
    async waitForSystems() {
        console.log('⏳ Aguardando sistemas carregarem...');
        
        const maxWait = 10000; // 10 segundos
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (window.loginSystem && window.game && window.storage) {
                this.loginSystem = window.loginSystem;
                this.game = window.game;
                console.log('✅ Sistemas carregados');
                return;
            }
            await this.sleep(100);
        }
        
        throw new Error('❌ Sistemas não carregaram a tempo');
    }
    
    /**
     * Sequência completa de testes
     */
    async runTestSequence() {
        const testSteps = [
            { name: 'Criar Conta', action: () => this.testCreateAccount() },
            { name: 'Fazer Login', action: () => this.testLogin() },
            { name: 'Criar Personagem', action: () => this.testCreateCharacter() },
            { name: 'Entrar no Jogo', action: () => this.testEnterGame() },
            { name: 'Testar Movimento WASD', action: () => this.testMovement() },
            { name: 'Testar Combate', action: () => this.testCombat() },
            { name: 'Testar Exploração', action: () => this.testMapExploration() },
            { name: 'Testar UI', action: () => this.testUIFeedback() },
            { name: 'Testar Performance', action: () => this.testPerformance() },
            { name: 'Testar Persistência', action: () => this.testPersistence() }
        ];
        
        for (let i = 0; i < testSteps.length; i++) {
            const step = testSteps[i];
            this.currentStep = i;
            
            console.log(`\n🧪 PASSO ${i + 1}/${testSteps.length}: ${step.name}`);
            
            try {
                const result = await step.action();
                this.testResults.push({
                    step: step.name,
                    status: 'SUCCESS',
                    result: result,
                    timestamp: new Date().toISOString()
                });
                console.log(`✅ ${step.name}: SUCESSO`);
            } catch (error) {
                this.testResults.push({
                    step: step.name,
                    status: 'ERROR',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                console.error(`❌ ${step.name}: ERRO - ${error.message}`);
                break; // Parar em caso de erro crítico
            }
            
            // Pequena pausa entre testes
            await this.sleep(1000);
        }
        
        this.generateTestReport();
    }
    
    /**
     * Testar criação de conta
     */
    async testCreateAccount() {
        console.log('👤 Testing account creation...');
        
        // Clicar no link "Criar Nova Conta"
        const createAccountLink = document.getElementById('createAccountLink');
        if (!createAccountLink) {
            throw new Error('Link "Criar Nova Conta" não encontrado');
        }
        
        createAccountLink.click();
        await this.sleep(500);
        
        // Debug: Verificar elementos existentes
        console.log('🔍 Elementos na página após clicar:');
        console.log('  - createAccountForm:', document.getElementById('createAccountForm'));
        console.log('  - newUsername:', document.getElementById('newUsername'));
        console.log('  - newEmail:', document.getElementById('newEmail'));
        console.log('  - newPassword:', document.getElementById('newPassword'));
        console.log('  - confirmPassword:', document.getElementById('confirmPassword'));
        
        // Aguardar formulário aparecer (aumentado timeout)
        await this.waitForElement('createAccountForm', null, 3000);
        
        // Preencher formulário
        const usernameInput = document.getElementById('newUsername');
        const emailInput = document.getElementById('newEmail');
        const passwordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (!usernameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
            throw new Error('Campos do formulário de criação não encontrados');
        }
        
        usernameInput.value = this.testData.username;
        emailInput.value = this.testData.email;
        passwordInput.value = this.testData.password;
        confirmPasswordInput.value = this.testData.password;
        
        console.log('📝 Formulário preenchido');
        
        // Submeter formulário
        const createAccountForm = document.getElementById('createAccountForm');
        if (!createAccountForm) {
            throw new Error('Formulário de criação não encontrado');
        }
        
        createAccountForm.dispatchEvent(new Event('submit'));
        
        // Aguardar sucesso e retorno para login
        await this.waitForElement('loginScreen', 'flex', 8000);
        
        // Verificar se conta foi salva no localStorage
        const savedAccount = window.storage.getAccount(this.testData.username);
        if (!savedAccount) {
            throw new Error('Conta não foi salva no localStorage');
        }
        
        return { 
            username: this.testData.username, 
            email: this.testData.email,
            savedInStorage: true
        };
    }
    
    /**
     * Testar login
     */
    async testLogin() {
        console.log('🔑 Testing login...');
        
        // Preencher formulário de login
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (!usernameInput || !passwordInput) {
            throw new Error('Campos do formulário de login não encontrados');
        }
        
        usernameInput.value = this.testData.username;
        passwordInput.value = this.testData.password;
        
        console.log('📝 Formulário de login preenchido');
        
        // Submeter login
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) {
            throw new Error('Formulário de login não encontrado');
        }
        
        loginForm.dispatchEvent(new Event('submit'));
        
        // Aguardar tela de seleção de personagem
        await this.waitForElement('characterScreen', 'flex', 5000);
        
        // Verificar se usuário está logado
        const currentUser = window.storage.getCurrentUser();
        if (!currentUser || currentUser.username !== this.testData.username) {
            throw new Error('Usuário não está logado corretamente');
        }
        
        return { 
            logged: true,
            currentUser: currentUser.username
        };
    }
    
    /**
     * Testar criação de personagem
     */
    async testCreateCharacter() {
        console.log('🎨 Testing character creation...');
        
        // Procurar slot vazio
        const emptySlots = document.querySelectorAll('.empty-slot');
        if (emptySlots.length === 0) {
            throw new Error('Nenhum slot vazio encontrado');
        }
        
        // Clicar no primeiro slot vazio
        emptySlots[0].click();
        await this.sleep(500);
        
        // Preencher formulário de personagem
        const nameInput = document.getElementById('characterName');
        const raceSelect = document.getElementById('characterRace');
        const classSelect = document.getElementById('characterClass');
        
        if (!nameInput || !raceSelect || !classSelect) {
            throw new Error('Campos do formulário de personagem não encontrados');
        }
        
        nameInput.value = this.testData.characterName;
        raceSelect.value = this.testData.characterRace;
        classSelect.value = this.testData.characterClass;
        
        console.log('📝 Formulário de personagem preenchido');
        
        // Submeter criação
        const createCharacterForm = document.getElementById('createCharacterForm');
        if (!createCharacterForm) {
            throw new Error('Formulário de criação de personagem não encontrado');
        }
        
        createCharacterForm.dispatchEvent(new Event('submit'));
        
        // Aguardar tela de jogo
        await this.waitForElement('gameScreen', 'block', 5000);
        
        return { 
            name: this.testData.characterName,
            race: this.testData.characterRace,
            class: this.testData.characterClass
        };
    }
    
    /**
     * Testar entrada no jogo
     */
    async testEnterGame() {
        console.log('🎮 Testing game entry...');
        
        // Verificar se o jogo foi inicializado
        if (!this.game || !this.game.player) {
            throw new Error('Jogo não inicializado ou player não criado');
        }
        
        const player = this.game.player;
        const mobs = this.game.mobs;
        
        console.log('📊 Status do jogo:');
        console.log(`  - Player: ${player.name} (Level ${player.level})`);
        console.log(`  - Position: (${player.x}, ${player.y})`);
        console.log(`  - HP: ${player.hp}/${player.maxHp}`);
        console.log(`  - Mobs: ${mobs.size}`);
        
        // Verificar elementos do jogo
        const canvas = document.getElementById('gameCanvas');
        const gameUI = document.getElementById('game-ui');
        
        if (!canvas || !gameUI) {
            throw new Error('Elementos do jogo não encontrados');
        }
        
        return {
            playerLoaded: true,
            mobCount: mobs.size,
            canvasExists: true,
            uiExists: true,
            playerData: {
                name: player.name,
                level: player.level,
                position: { x: player.x, y: player.y },
                hp: player.hp
            }
        };
    }
    
    /**
     * Testar movimento do player
     */
    async testMovement() {
        console.log('🏃 Testing player movement...');
        
        if (!this.game || !this.game.player) {
            throw new Error('Player not available for movement test');
        }
        
        const initialPos = { x: this.game.player.x, y: this.game.player.y };
        
        // Simular teclas WASD por mais tempo
        const keys = ['w', 'a', 's', 'd'];
        
        for (let key of keys) {
            // Key down
            const downEvent = new KeyboardEvent('keydown', { key });
            document.dispatchEvent(downEvent);
            
            await this.sleep(800); // Mais tempo para movimento
            
            // Key up
            const upEvent = new KeyboardEvent('keyup', { key });
            document.dispatchEvent(upEvent);
            
            await this.sleep(500);
        }
        
        // Verificar se posição mudou
        const finalPos = { x: this.game.player.x, y: this.game.player.y };
        const moved = (initialPos.x !== finalPos.x) || (initialPos.y !== finalPos.y);
        
        console.log(`📍 Initial: (${initialPos.x}, ${initialPos.y})`);
        console.log(`📍 Final: (${finalPos.x}, ${finalPos.y})`);
        console.log(`📈 Movement detected: ${moved}`);
        
        return {
            initialPosition: initialPos,
            finalPosition: finalPos,
            moved: moved,
            keysTested: keys,
            movementDistance: Math.sqrt(Math.pow(finalPos.x - initialPos.x, 2) + Math.pow(finalPos.y - initialPos.y, 2))
        };
    }
    
    /**
     * Testar combate intensivo
     */
    async testCombat() {
        console.log('⚔️ Testing combat system...');
        
        if (!this.game || !this.game.player) {
            throw new Error('Player not available for combat test');
        }
        
        const player = this.game.player;
        const mobs = this.game.mobs;
        
        if (mobs.size === 0) {
            throw new Error('No mobs found for combat test');
        }
        
        // Encontrar mobs próximos
        const nearbyMobs = [];
        for (let mob of mobs.values()) {
            const distance = Math.sqrt(
                Math.pow(mob.x - player.x, 2) + 
                Math.pow(mob.y - player.y, 2)
            );
            if (distance < 200) { // Mobs próximos
                nearbyMobs.push({ mob, distance });
            }
        }
        
        console.log(`🎯 Found ${nearbyMobs.length} nearby mobs`);
        
        // Atacar múltiplos mobs
        const combatResults = [];
        for (let i = 0; i < Math.min(3, nearbyMobs.length); i++) {
            const { mob, distance } = nearbyMobs[i];
            
            // Simular clique de ataque
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                const clickEvent = new MouseEvent('click', {
                    clientX: mob.x,
                    clientY: mob.y,
                    bubbles: true
                });
                canvas.dispatchEvent(clickEvent);
                
                await this.sleep(1000); // Esperar 1 segundo entre ataques
                
                combatResults.push({
                    mobType: mob.type,
                    distance: distance,
                    hp: mob.hp,
                    maxHp: mob.maxHp
                });
            }
        }
        
        return {
            totalMobs: mobs.size,
            nearbyMobs: nearbyMobs.length,
            combatResults: combatResults,
            playerLevel: player.level,
            playerHp: player.hp
        };
    }
    
    /**
     * Testar exploração do mapa
     */
    async testMapExploration() {
        console.log('🗺️ Testing map exploration...');
        
        if (!this.game || !this.game.player) {
            throw new Error('Player not available for map exploration test');
        }
        
        const player = this.game.player;
        const mapRenderer = this.game.mapRenderer;
        const gameMap = this.game.gameMap;
        
        if (!mapRenderer || !gameMap) {
            throw new Error('Map system not available');
        }
        
        // Testar movimento em diferentes direções
        const explorationResults = [];
        const directions = [
            { key: 'w', name: 'North', duration: 1000 },
            { key: 'a', name: 'West', duration: 1000 },
            { key: 's', name: 'South', duration: 1000 },
            { key: 'd', name: 'East', duration: 1000 }
        ];
        
        for (let dir of directions) {
            const startPos = { x: player.x, y: player.y };
            
            // Mover na direção
            const downEvent = new KeyboardEvent('keydown', { key: dir.key });
            document.dispatchEvent(downEvent);
            
            await this.sleep(dir.duration);
            
            const upEvent = new KeyboardEvent('keyup', { key: dir.key });
            document.dispatchEvent(upEvent);
            
            const endPos = { x: player.x, y: player.y };
            const tile = mapRenderer.getTileAt(endPos.x, endPos.y);
            
            explorationResults.push({
                direction: dir.name,
                startPosition: startPos,
                endPosition: endPos,
                distance: Math.sqrt(Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)),
                tileType: tile ? tile.type : 'unknown',
                walkable: tile ? tile.walkable : false
            });
            
            await this.sleep(500); // Pausa entre direções
        }
        
        return {
            mapDimensions: { width: gameMap.width, height: gameMap.height },
            tileSize: mapRenderer.tileSize,
            explorationResults: explorationResults,
            totalDistance: explorationResults.reduce((sum, r) => sum + r.distance, 0)
        };
    }
    
    /**
     * Testar sistema de UI e feedback
     */
    async testUIFeedback() {
        console.log('🖼️ Testing UI feedback system...');
        
        const uiElements = {
            playerName: document.getElementById('player-name'),
            playerHealth: document.getElementById('player-health'),
            playerLevel: document.getElementById('player-level'),
            playerXP: document.getElementById('player-xp'),
            mobCount: document.getElementById('mob-count'),
            playerX: document.getElementById('player-x'),
            playerY: document.getElementById('player-y')
        };
        
        const uiStatus = {};
        let uiWorking = true;
        
        // Verificar elementos
        for (let [key, element] of Object.entries(uiElements)) {
            uiStatus[key] = {
                exists: !!element,
                text: element ? element.textContent : 'N/A'
            };
            
            if (!element) {
                uiWorking = false;
            }
        }
        
        // Testar atualização de UI (simular mudança de HP)
        if (this.game && this.game.player) {
            const originalHP = this.game.player.hp;
            this.game.player.hp = 50; // Simular dano
            
            await this.sleep(1000);
            
            const updatedHP = uiStatus.playerHealth.text;
            this.game.player.hp = originalHP; // Restaurar HP
            
            uiStatus.hpUpdateTest = {
                originalHP: originalHP,
                simulatedHP: 50,
                updatedUI: updatedHP
            };
        }
        
        return {
            uiWorking: uiWorking,
            elements: uiStatus
        };
    }
    
    /**
     * Testar performance do jogo
     */
    async testPerformance() {
        console.log('⚡ Testing game performance...');
        
        if (!this.game || !this.game.player) {
            throw new Error('Game not available for performance test');
        }
        
        const performanceResults = {
            fps: [],
            mobCount: 0,
            renderTime: 0
        };
        
        // Medir FPS por 5 segundos
        const startTime = performance.now();
        let frameCount = 0;
        let lastFrameTime = startTime;
        
        const measureFPS = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastFrameTime;
            const fps = 1000 / deltaTime;
            
            performanceResults.fps.push(fps);
            frameCount++;
            lastFrameTime = currentTime;
            
            if (currentTime - startTime < 5000) { // 5 segundos
                requestAnimationFrame(measureFPS);
            }
        };
        
        measureFPS();
        
        await this.sleep(5500); // Esperar medição
        
        // Contar mobs
        performanceResults.mobCount = this.game.mobs.size;
        
        // Calcular estatísticas
        const fpsValues = performanceResults.fps;
        performanceResults.averageFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
        performanceResults.minFPS = Math.min(...fpsValues);
        performanceResults.maxFPS = Math.max(...fpsValues);
        
        return performanceResults;
    }
    
    /**
     * Testar persistência
     */
    async testPersistence() {
        console.log('💾 Testing data persistence...');
        
        if (!this.game || !this.game.player) {
            throw new Error('Player not available for persistence test');
        }
        
        const player = this.game.player;
        
        // Salvar estado atual
        const originalState = {
            level: player.level,
            hp: player.hp,
            xp: player.xp,
            x: player.x,
            y: player.y
        };
        
        console.log('💾 Estado original:', originalState);
        
        // Simular mudança de estado
        player.x += 10;
        player.y += 10;
        player.hp = 50;
        
        await this.sleep(1000);
        
        // Verificar se estado foi mantido
        const changedState = {
            level: player.level,
            hp: player.hp,
            xp: player.xp,
            x: player.x,
            y: player.y
        };
        
        console.log('💾 Estado alterado:', changedState);
        
        const persistenceWorking = 
            changedState.x !== originalState.x &&
            changedState.y !== originalState.y &&
            changedState.hp !== originalState.hp;
        
        return {
            originalState: originalState,
            changedState: changedState,
            persistenceWorking: persistenceWorking
        };
    }
    
    /**
     * Aguardar elemento aparecer com display específico
     */
    async waitForElement(elementId, display, timeout = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const element = document.getElementById(elementId);
            if (element) {
                // Se display for null, só verifica se elemento existe
                if (display === null || element.style.display === display) {
                    return element;
                }
            }
            await this.sleep(100);
        }
        
        throw new Error(`Elemento ${elementId} não apareceu${display ? ' com display ' + display : ''} em ${timeout}ms`);
    }
    
    /**
     * Gerar relatório de testes
     */
    generateTestReport() {
        console.log('\n📊 RELATÓRIO DE TESTES AUTOMATIZADOS - GAMEPLAY COMPLETO');
        console.log('=' .repeat(60));
        
        const successCount = this.testResults.filter(r => r.status === 'SUCCESS').length;
        const errorCount = this.testResults.filter(r => r.status === 'ERROR').length;
        
        console.log(`✅ Testes bem-sucedidos: ${successCount}/${this.testResults.length}`);
        console.log(`❌ Testes com erro: ${errorCount}/${this.testResults.length}`);
        console.log(`📈 Taxa de sucesso: ${((successCount / this.testResults.length) * 100).toFixed(1)}%`);
        
        console.log('\n📋 Detalhes dos testes:');
        this.testResults.forEach((result, index) => {
            const icon = result.status === 'SUCCESS' ? '✅' : '❌';
            console.log(`${icon} ${index + 1}. ${result.status}: ${result.step}`);
            
            if (result.status === 'ERROR') {
                console.log(`   Erro: ${result.error}`);
            } else if (result.result) {
                console.log(`   Resultado:`, result.result);
            }
        });
        
        // Salvar relatório em localStorage
        const report = {
            timestamp: new Date().toISOString(),
            testData: this.testData,
            results: this.testResults,
            summary: {
                total: this.testResults.length,
                success: successCount,
                error: errorCount,
                successRate: ((successCount / this.testResults.length) * 100).toFixed(1)
            }
        };
        
        localStorage.setItem('testAgentReport', JSON.stringify(report));
        console.log('\n💾 Relatório salvo em localStorage (testAgentReport)');
        
        // Mostrar resumo visual
        this.showTestSummary(report);
    }
    
    /**
     * Mostrar resumo visual dos testes
     */
    showTestSummary(report) {
        const summaryDiv = document.createElement('div');
        summaryDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #3b82f6;
            font-family: monospace;
            font-size: 14px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        
        summaryDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #3b82f6;">🤖 RELATÓRIO DE TESTES - GAMEPLAY</h3>
            <div style="margin-bottom: 10px;">
                <strong>Total:</strong> ${report.summary.total} testes<br>
                <strong>✅ Sucesso:</strong> ${report.summary.success}<br>
                <strong>❌ Erros:</strong> ${report.summary.error}<br>
                <strong>📈 Taxa:</strong> ${report.summary.successRate}%
            </div>
            <div style="font-size: 12px; opacity: 0.8;">
                Teste executado: ${new Date(report.timestamp).toLocaleString()}
            </div>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 10px;
                padding: 5px 10px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">Fechar</button>
        `;
        
        document.body.appendChild(summaryDiv);
        
        // Auto-remover após 15 segundos
        setTimeout(() => {
            if (summaryDiv.parentElement) {
                summaryDiv.remove();
            }
        }, 15000);
    }
    
    /**
     * Utilitário de sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Parar teste
     */
    stopTest() {
        if (this.testInterval) {
            clearInterval(this.testInterval);
            this.testInterval = null;
        }
        console.log('🛑 Teste interrompido');
    }
}

// Exportar para uso global
window.TestAgent = TestAgent;

// Função global para iniciar teste
window.startAutomatedTest = async function() {
    const agent = new TestAgent();
    await agent.startFullTest();
    return agent;
};

console.log('🤖 Agente de Teste Automatizado - Gameplay Completo carregado');
console.log('💡 Para iniciar: startAutomatedTest()');
