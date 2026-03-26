// Fix All Screens Script
// Corrige centralização de todas as telas e remove problemas de layout

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Todas as Telas\n');

function fixAllScreens() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Adicionar CSS global para centralização e layout
    const globalCSS = `
    /* Reset e Layout Global */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: 'Arial', sans-serif;
        background: #1a1a1a;
        overflow: hidden;
        position: relative;
        width: 100vw;
        height: 100vh;
    }
    
    /* Telas Principais */
    .screen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 1000 !important;
        background: rgba(0, 0, 0, 0.95) !important;
    }
    
    #loginScreen {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        z-index: 9999 !important;
    }
    
    #characterScreen {
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%) !important;
        z-index: 9998 !important;
    }
    
    /* Container do Jogo */
    #gameContainer {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 1 !important;
        background: #000 !important;
        display: none !important;
    }
    
    /* Canvas do Jogo */
    #gameCanvas {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        border: 2px solid #333 !important;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5) !important;
    }
    
    #visual-map-canvas {
        position: absolute !important;
        top: 10px !important;
        left: 10px !important;
        border: 1px solid #444 !important;
        opacity: 0.8 !important;
    }
    
    /* Containers */
    .login-container, .character-container {
        background: rgba(0, 0, 0, 0.9) !important;
        border-radius: 15px !important;
        padding: 30px !important;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3) !important;
        border: 2px solid rgba(255, 255, 255, 0.1) !important;
        max-width: 400px !important;
        width: 100% !important;
        text-align: center !important;
    }
    
    /* Botões */
    .login-button, .character-card {
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        border: none !important;
        outline: none !important;
    }
    
    .login-button {
        background: linear-gradient(45deg, #4CAF50, #45a049) !important;
        color: white !important;
        padding: 12px 24px !important;
        border-radius: 8px !important;
        font-weight: bold !important;
        font-size: 14px !important;
        margin: 5px !important;
        min-width: 120px !important;
    }
    
    .login-button:hover {
        background: linear-gradient(45deg, #45a049, #4CAF50) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4) !important;
    }
    
    .character-card {
        background: rgba(255, 255, 255, 0.1) !important;
        border: 2px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 10px !important;
        padding: 20px !important;
        margin: 10px !important;
        text-align: center !important;
    }
    
    .character-card:hover {
        background: rgba(255, 255, 255, 0.2) !important;
        border-color: #4CAF50 !important;
        transform: translateY(-3px) !important;
    }
    
    /* Formulários */
    .form-input {
        width: 100% !important;
        padding: 12px !important;
        border: 2px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 6px !important;
        background: rgba(255, 255, 255, 0.1) !important;
        color: white !important;
        font-size: 14px !important;
        margin: 8px 0 !important;
        transition: all 0.3s ease !important;
    }
    
    .form-input:focus {
        border-color: #4CAF50 !important;
        background: rgba(255, 255, 255, 0.15) !important;
        box-shadow: 0 0 10px rgba(76, 175, 80, 0.3) !important;
        outline: none !important;
    }
    
    /* Mensagens */
    .message {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        padding: 12px 20px !important;
        border-radius: 8px !important;
        color: white !important;
        font-weight: bold !important;
        z-index: 10000 !important;
        max-width: 300px !important;
        word-wrap: break-word !important;
        animation: slideIn 0.3s ease !important;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    /* HUDs */
    .hud {
        position: absolute !important;
        z-index: 100 !important;
        pointer-events: none !important;
    }
    
    /* Responsivo */
    @media (max-width: 768px) {
        .login-container, .character-container {
            margin: 20px !important;
            padding: 20px !important;
        }
    }
    `;
    
    // 2. Adicionar CSS global no head
    const headPattern = /<\/head>/;
    if (headPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            headPattern,
            `    <style>
        ${globalCSS}
    </style>
</head>`
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ CSS global de centralização adicionado');
    }
    
    // 3. Simplificar JavaScript para garantir funcionamento
    const cleanJS = `
    // Sistema Centralizado e Funcional
    let currentUser = null;
    
    function handleLogin() {
        console.log('🔐 Login iniciado');
        
        const username = document.getElementById('username')?.value?.trim();
        const password = document.getElementById('password')?.value?.trim();
        
        if (!username || !password) {
            showMessage('Preencha usuário e senha', 'error');
            return;
        }
        
        // Login local
        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users[username];
            
            if (user && user.password === password) {
                console.log('✅ Login sucesso:', username);
                currentUser = username;
                localStorage.setItem('currentUser', username);
                showMessage('Login realizado! Redirecionando...', 'success');
                
                // Transição suave para seleção de personagem
                setTimeout(() => {
                    const loginScreen = document.getElementById('loginScreen');
                    const characterScreen = document.getElementById('characterScreen');
                    
                    if (loginScreen) {
                        loginScreen.style.opacity = '0';
                        setTimeout(() => {
                            loginScreen.style.display = 'none';
                        }, 300);
                    }
                    
                    if (characterScreen) {
                        characterScreen.style.display = 'flex';
                        characterScreen.style.opacity = '0';
                        setTimeout(() => {
                            characterScreen.style.opacity = '1';
                        }, 100);
                    }
                }, 1000);
                
                return;
            }
        } catch (error) {
            console.error('Erro login:', error);
        }
        
        showMessage('Usuário ou senha incorretos', 'error');
    }
    
    function showCreateAccount() {
        console.log('📝 Criar conta');
        
        const loginForm = document.getElementById('loginForm');
        const createForm = document.getElementById('createAccountForm');
        
        if (loginForm && createForm) {
            loginForm.style.opacity = '0';
            setTimeout(() => {
                loginForm.style.display = 'none';
                createForm.style.display = 'block';
                createForm.style.opacity = '0';
                setTimeout(() => {
                    createForm.style.opacity = '1';
                }, 100);
            }, 300);
        }
    }
    
    function handleCreateAccount() {
        const username = document.getElementById('newUsername')?.value?.trim();
        const email = document.getElementById('newEmail')?.value?.trim();
        const password = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (!username || !email || !password || !confirmPassword) {
            showMessage('Preencha todos os campos', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Senhas não coincidem', 'error');
            return;
        }
        
        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            
            if (users[username]) {
                showMessage('Usuário já existe', 'error');
                return;
            }
            
            users[username] = {
                username, email, password,
                createdAt: new Date().toISOString()
            };
            
            localStorage.setItem('users', JSON.stringify(users));
            showMessage('Conta criada com sucesso!', 'success');
            
            setTimeout(() => backToLogin(), 1500);
            
        } catch (error) {
            console.error('Erro criar conta:', error);
            showMessage('Erro ao criar conta', 'error');
        }
    }
    
    function backToLogin() {
        const loginForm = document.getElementById('loginForm');
        const createForm = document.getElementById('createAccountForm');
        
        if (createForm && loginForm) {
            createForm.style.opacity = '0';
            setTimeout(() => {
                createForm.style.display = 'none';
                loginForm.style.display = 'block';
                loginForm.style.opacity = '0';
                setTimeout(() => {
                    loginForm.style.opacity = '1';
                }, 100);
            }, 300);
        }
    }
    
    function selectCharacter(characterClass) {
        console.log('📝 Personagem:', characterClass);
        
        // Destacar selecionado
        document.querySelectorAll('.character-card').forEach(card => {
            card.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        });
        
        if (event && event.currentTarget) {
            event.currentTarget.style.borderColor = '#4CAF50';
            event.currentTarget.style.transform = 'scale(1.05)';
        }
    }
    
    function startGame() {
        console.log('🚀 Iniciando jogo');
        
        const characterScreen = document.getElementById('characterScreen');
        const gameContainer = document.getElementById('gameContainer');
        
        if (characterScreen && gameContainer) {
            characterScreen.style.opacity = '0';
            setTimeout(() => {
                characterScreen.style.display = 'none';
                gameContainer.style.display = 'block';
                gameContainer.style.opacity = '0';
                setTimeout(() => {
                    gameContainer.style.opacity = '1';
                    initializeGameplay('warrior');
                }, 100);
            }, 300);
        }
    }
    
    function backToLoginFromCharacter() {
        const loginScreen = document.getElementById('loginScreen');
        const characterScreen = document.getElementById('characterScreen');
        
        if (characterScreen && loginScreen) {
            characterScreen.style.opacity = '0';
            setTimeout(() => {
                characterScreen.style.display = 'none';
                loginScreen.style.display = 'flex';
                loginScreen.style.opacity = '0';
                setTimeout(() => {
                    loginScreen.style.opacity = '1';
                }, 100);
            }, 300);
        }
    }
    
    function initializeGameplay(characterClass) {
        console.log('🎮 Gameplay:', characterClass);
        
        if (typeof window.IntegratedGameplayEngine !== 'undefined') {
            try {
                const character = {
                    name: currentUser || 'Player',
                    class: characterClass,
                    level: 1,
                    hp: 100,
                    maxHp: 100,
                    exp: 0,
                    x: 400,
                    y: 300
                };
                
                window.gameplayEngine = new window.IntegratedGameplayEngine('gameCanvas', character);
                showMessage('Jogo carregado! Use WASD', 'success');
                setupControls();
                
            } catch (error) {
                console.error('Erro gameplay:', error);
                showMessage('Erro ao carregar jogo', 'error');
            }
        } else {
            showMessage('Jogo em modo básico', 'info');
        }
    }
    
    function setupControls() {
        if (!window.gameplayEngine) return;
        
        const keys = {};
        
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
            
            if (keys['w']) window.gameplayEngine.movePlayer(0, -5);
            if (keys['s']) window.gameplayEngine.movePlayer(0, 5);
            if (keys['a']) window.gameplayEngine.movePlayer(-5, 0);
            if (keys['d']) window.gameplayEngine.movePlayer(5, 0);
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });
    }
    
    function showMessage(message, type = 'info') {
        // Remover mensagem anterior se existir
        const existingMsg = document.querySelector('.message');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.style.cssText = \`
            background: \${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
        \`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }`;
    
    // 4. Substituir completamente o JavaScript
    const scriptStartPattern = /<script>/;
    const scriptEndPattern = /<\/script>/;
    
    if (scriptStartPattern.test(indexContent) && scriptEndPattern.test(indexContent)) {
        const beforeScript = indexContent.substring(0, indexContent.indexOf('<script>') + 8);
        const afterScript = indexContent.substring(indexContent.lastIndexOf('</script>') + 9);
        
        const finalContent = beforeScript + cleanJS + '\n    </script>' + afterScript;
        
        fs.writeFileSync(indexPath, finalContent);
        console.log('✅ JavaScript substituído com versão limpa');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Fix All Screens v0.1.0');
console.log('===============================\n');

const success = fixAllScreens();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Todas as telas corrigidas!');
    console.log('📝 Login centralizado');
    console.log('📝 Seleção de personagem centralizada');
    console.log('📝 Canvas posicionado corretamente');
    console.log('📝 Sem sobreposição de telas');
} else {
    console.log('\n❌ Falha ao corrigir telas');
}

console.log('\n✅ Script concluído!');
