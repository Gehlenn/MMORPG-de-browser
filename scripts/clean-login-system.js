// Clean Login System Script
// Limpa e reorganiza todo o sistema de login

const fs = require('fs');
const path = require('path');

console.log('🔧 Limpando Sistema de Login\n');

function cleanLoginSystem() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Encontrar onde começa o caos de funções duplicadas
    const chaosStart = indexContent.indexOf('        // Funções de login direto');
    const scriptEnd = indexContent.indexOf('</script>');
    
    if (chaosStart !== -1 && scriptEnd !== -1) {
        // Remover todo o código JavaScript duplicado e confuso
        const beforeChaos = indexContent.substring(0, chaosStart);
        const afterScript = indexContent.substring(scriptEnd + 9);
        
        // Criar um sistema de login limpo e simples
        const cleanJS = `
    // Sistema de Login Limpo e Simples
    function handleLogin() {
        console.log('🔐 Botão de login clicado');
        
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!username || !password) {
            showMessage('Preencha usuário e senha', 'error');
            return;
        }
        
        console.log('📝 Tentando login:', username);
        
        // Login local
        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users[username];
            
            if (user && user.password === password) {
                console.log('✅ Login successful:', username);
                showMessage('Login realizado com sucesso!', 'success');
                
                // Esconder login
                const loginScreen = document.getElementById('loginScreen');
                if (loginScreen) {
                    loginScreen.style.display = 'none';
                }
                
                // Mostrar jogo
                const gameContainer = document.getElementById('gameContainer');
                if (gameContainer) {
                    gameContainer.style.display = 'block';
                }
                
                // Inicializar gameplay
                initializeGameplay(username);
                return;
            }
        } catch (error) {
            console.log('⚠️ Erro login local:', error);
        }
        
        showMessage('Usuário ou senha incorretos', 'error');
    }
    
    function showCreateAccount() {
        console.log('📝 Botão criar conta clicado');
        
        const loginForm = document.getElementById('loginForm');
        const createForm = document.getElementById('createAccountForm');
        
        if (loginForm && createForm) {
            loginForm.style.display = 'none';
            createForm.style.display = 'block';
        }
    }
    
    function handleCreateAccount() {
        console.log('📝 Criando conta...');
        
        const username = document.getElementById('newUsername')?.value;
        const email = document.getElementById('newEmail')?.value;
        const password = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (!username || !email || !password || !confirmPassword) {
            showMessage('Preencha todos os campos', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem', 'error');
            return;
        }
        
        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            
            if (users[username]) {
                showMessage('Usuário já existe', 'error');
                return;
            }
            
            users[username] = {
                username: username,
                email: email,
                password: password,
                createdAt: new Date().toISOString()
            };
            
            localStorage.setItem('users', JSON.stringify(users));
            showMessage('Conta criada com sucesso!', 'success');
            
            setTimeout(() => {
                backToLogin();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao criar conta:', error);
            showMessage('Erro ao criar conta', 'error');
        }
    }
    
    function backToLogin() {
        console.log('🔙 Voltando para login');
        
        const loginForm = document.getElementById('loginForm');
        const createForm = document.getElementById('createAccountForm');
        
        if (loginForm && createForm) {
            createForm.style.display = 'none';
            loginForm.style.display = 'block';
            
            // Limpar campos
            document.getElementById('newUsername').value = '';
            document.getElementById('newEmail').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        }
    }
    
    function showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            \${type === 'error' ? 'background: #f44336;' : 
              type === 'success' ? 'background: #4CAF50;' : 
              'background: #2196F3;'}
        \`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
    
    function initializeGameplay(username) {
        console.log('🎮 Inicializando gameplay para:', username);
        
        if (typeof window.IntegratedGameplayEngine !== 'undefined') {
            try {
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
                
                window.gameplayEngine = new window.IntegratedGameplayEngine('gameCanvas', character);
                console.log('✅ Gameplay engine inicializado');
                showMessage('Jogo carregado! Use WASD para mover', 'success');
                
                // Configurar controles simples
                setupControls();
                
            } catch (error) {
                console.error('❌ Erro ao inicializar gameplay:', error);
                showMessage('Erro ao carregar jogo', 'error');
            }
        } else {
            console.log('⚠️ Gameplay engine não disponível');
            showMessage('Jogo carregado! (Modo simplificado)', 'success');
        }
    }
    
    function setupControls() {
        console.log('🎮 Configurando controles WASD');
        
        const keys = {};
        
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
            
            if (document.getElementById('loginScreen').style.display !== 'none') {
                return;
            }
            
            if (window.gameplayEngine) {
                if (keys['w']) window.gameplayEngine.movePlayer(0, -5);
                if (keys['s']) window.gameplayEngine.movePlayer(0, 5);
                if (keys['a']) window.gameplayEngine.movePlayer(-5, 0);
                if (keys['d']) window.gameplayEngine.movePlayer(5, 0);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });
        
        console.log('✅ Controles configurados');
    }`;
        
        // Reconstruir o arquivo com JavaScript limpo
        const fixedContent = beforeChaos + cleanJS + '\n    </script>' + afterScript;
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Sistema de login limpo criado');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Clean Login System v0.1.0');
console.log('===============================\n');

const success = cleanLoginSystem();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Sistema de login limpo!');
    console.log('📝 Código duplicado removido');
    console.log('📝 Funções simples e funcionais');
} else {
    console.log('\n❌ Falha ao limpar sistema');
}

console.log('\n✅ Script concluído!');
