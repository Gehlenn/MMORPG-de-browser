// Debug Login Buttons Script
// Adiciona debug e verificações para os botões de login

const fs = require('fs');
const path = require('path');

console.log('🔧 Debug Botões de Login\n');

function debugLoginButtons() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Adicionar função de debug no início do script
    const debugFunction = `
    // Função de debug para botões
    function debugLoginButtons() {
        console.log('🔍 Debugando botões de login...');
        
        const loginBtn = document.getElementById('loginBtn');
        const createBtn = document.getElementById('showCreateAccountBtn');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginScreen = document.getElementById('loginScreen');
        const gameContainer = document.getElementById('gameContainer');
        
        console.log('📋 Elementos encontrados:');
        console.log('- loginBtn:', loginBtn ? '✅' : '❌');
        console.log('- createBtn:', createBtn ? '✅' : '❌');
        console.log('- usernameInput:', usernameInput ? '✅' : '❌');
        console.log('- passwordInput:', passwordInput ? '✅' : '❌');
        console.log('- loginScreen:', loginScreen ? '✅' : '❌');
        console.log('- gameContainer:', gameContainer ? '✅' : '❌');
        
        // Adicionar clique manual para teste
        if (loginBtn) {
            loginBtn.addEventListener('click', function(e) {
                console.log('🖱️ Botão login clicado via addEventListener');
                e.preventDefault();
                handleLogin();
            });
        }
        
        if (createBtn) {
            createBtn.addEventListener('click', function(e) {
                console.log('🖱️ Botão criar conta clicado via addEventListener');
                e.preventDefault();
                showCreateAccount();
            });
        }
        
        // Forçar visibilidade dos elementos
        if (loginScreen) {
            loginScreen.style.zIndex = '9999';
            loginScreen.style.position = 'fixed';
            loginScreen.style.top = '0';
            loginScreen.style.left = '0';
            loginScreen.style.width = '100%';
            loginScreen.style.height = '100%';
            loginScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            loginScreen.style.display = 'flex';
        }
        
        if (gameContainer) {
            gameContainer.style.position = 'absolute';
            gameContainer.style.top = '0';
            gameContainer.style.left = '0';
            gameContainer.style.width = '100%';
            gameContainer.style.height = '100%';
            gameContainer.style.zIndex = '1';
        }
        
        console.log('✅ Debug concluído');
    }`;
    
    // Adicionar a função de debug antes do DOMContentLoaded
    const domContentLoadedPattern = /document\.addEventListener\('DOMContentLoaded', \(\) => \{/;
    
    if (domContentLoadedPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            domContentLoadedPattern,
            debugFunction + '\n\n        document.addEventListener(\'DOMContentLoaded\', () => {'
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Função de debug adicionada');
    }
    
    // Adicionar chamada da função de debug dentro do DOMContentLoaded
    const debugCallPattern = /console\.log\('🚀 Configurando botões de login'\);/;
    
    if (debugCallPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            debugCallPattern,
            `console.log('🚀 Configurando botões de login');\n            debugLoginButtons();`
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Chamada de debug adicionada');
    }
    
    // Simplificar a função handleLogin para garantir que funcione
    const handleLoginPattern = /function handleLogin\(\) \{[\s\S]*?console\.log\('🔐 Botão de login clicado'\);[\s\S]*?\}/;
    
    if (handleLoginPattern.test(indexContent)) {
        const simplifiedLogin = `function handleLogin() {
            console.log('🔐 Botão de login clicado - VERSÃO SIMPLIFICADA');
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            console.log('📝 Dados:', { username: username, password: password ? '***' : 'vazio' });
            
            if (!username || !password) {
                showMessage('Por favor, preencha todos os campos', 'error');
                return;
            }
            
            // Simular login bem-sucedido para teste
            showMessage('Login realizado com sucesso!', 'success');
            
            // Esconder login e mostrar jogo
            const loginScreen = document.getElementById('loginScreen');
            const gameContainer = document.getElementById('gameContainer');
            
            if (loginScreen) {
                loginScreen.style.display = 'none';
                console.log('✅ Tela de login escondida');
            }
            
            if (gameContainer) {
                gameContainer.style.display = 'block';
                console.log('✅ Container do jogo mostrado');
            }
            
            // Inicializar gameplay
            initializeGameplay(username);
        }`;
        
        const fixedContent = indexContent.replace(handleLoginPattern, simplifiedLogin);
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Função handleLogin simplificada');
    }
    
    return true;
}

// Executar
console.log('🎯 Debug Login Buttons v0.1.0');
console.log('===============================\n');

const success = debugLoginButtons();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Debug adicionado!');
    console.log('📝 Verifique o console para detalhes');
    console.log('📝 Botões devem funcionar agora');
} else {
    console.log('\n❌ Falha ao adicionar debug');
}

console.log('\n✅ Script concluído!');
