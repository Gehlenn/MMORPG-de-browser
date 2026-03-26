// Fix Login Screen Script
// Corrige problemas com a tela de login e botões

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Tela de Login\n');

function fixLoginScreen() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Corrigir a função de login - esconder tela de login e mostrar jogo
    const loginSuccessPattern = /showMessage\('Login realizado com sucesso!', 'success'\);[\s\S]*?initializeGameplay\(username\);[\s\S]*?return;/;
    
    if (loginSuccessPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            loginSuccessPattern,
            `showMessage('Login realizado com sucesso!', 'success');
                        
                        // Esconder tela de login
                        document.getElementById('loginScreen').style.display = 'none';
                        
                        // Mostrar jogo
                        document.getElementById('gameContainer').style.display = 'block';
                        
                        // Inicializar gameplay engine
                        initializeGameplay(username);
                        return;`
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Função de login corrigida');
    }
    
    // 2. Corrigir a função initializeGameplay
    const gameplayPattern = /function initializeGameplay\(username\) \{[\s\S]*?console\.log\('✅ Gameplay engine inicializado'\);[\s\S]*?showMessage\('Jogo carregado! Use WASD para mover\.', 'success'\);[\s\S]*?setupControls\(\);[\s\S]*?\}/;
    
    if (gameplayPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            gameplayPattern,
            `function initializeGameplay(username) {
            console.log('🎮 Inicializando gameplay para:', username);
            
            // Esconder tela de login se ainda estiver visível
            const loginScreen = document.getElementById('loginScreen');
            if (loginScreen) {
                loginScreen.style.display = 'none';
            }
            
            // Mostrar container do jogo
            const gameContainer = document.getElementById('gameContainer');
            if (gameContainer) {
                gameContainer.style.display = 'block';
            }
            
            // Garantir que o gameplay engine exista
            if (typeof window.IntegratedGameplayEngine !== 'undefined') {
                try {
                    // Criar personagem padrão
                    const character = {
                        name: username,
                        level: 1,
                        hp: 100,
                        maxHp: 100,
                        exp: 0,
                        x: 400,
                        y: 300,
                        class: 'warrior'
                    };
                    
                    // Inicializar gameplay engine
                    window.gameplayEngine = new window.IntegratedGameplayEngine('gameCanvas', character);
                    
                    console.log('✅ Gameplay engine inicializado');
                    showMessage('Jogo carregado! Use WASD para mover.', 'success');
                    
                    // Configurar controles
                    setupControls();
                    
                } catch (error) {
                    console.error('❌ Erro ao inicializar gameplay:', error);
                    showMessage('Erro ao carregar jogo', 'error');
                }
            } else {
                console.error('❌ IntegratedGameplayEngine não encontrado');
                showMessage('Sistema de jogo não disponível', 'error');
            }
        }`
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Função initializeGameplay corrigida');
    }
    
    // 3. Verificar se os elementos HTML existem
    const loginScreenPattern = /<div id="loginScreen"/;
    const gameContainerPattern = /<div id="gameContainer"/;
    
    if (!loginScreenPattern.test(indexContent)) {
        console.log('❌ loginScreen não encontrado no HTML');
    }
    
    if (!gameContainerPattern.test(indexContent)) {
        console.log('❌ gameContainer não encontrado no HTML');
    }
    
    // 4. Adicionar verificação de elementos na função de login
    const loginFunctionPattern = /function handleLogin\(\) \{[\s\S]*?console\.log\('🔐 Botão de login clicado'\);/;
    
    if (loginFunctionPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            loginFunctionPattern,
            `function handleLogin() {
            console.log('🔐 Botão de login clicado');
            
            // Verificar se elementos existem
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const loginScreen = document.getElementById('loginScreen');
            const gameContainer = document.getElementById('gameContainer');
            
            if (!usernameInput || !passwordInput) {
                showMessage('Campos de login não encontrados', 'error');
                return;
            }
            
            if (!loginScreen || !gameContainer) {
                showMessage('Elementos da tela não encontrados', 'error');
                return;
            }`
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Verificação de elementos adicionada');
    }
    
    return true;
}

// Executar
console.log('🎯 Fix Login Screen v0.1.0');
console.log('===============================\n');

const success = fixLoginScreen();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Tela de login corrigida!');
    console.log('📝 Botões devem funcionar agora');
} else {
    console.log('\n❌ Falha ao corrigir tela de login');
}

console.log('\n✅ Script concluído!');
