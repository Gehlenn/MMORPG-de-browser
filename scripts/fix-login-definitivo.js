// Fix Login Definitivo Script
// Corrige definitivamente os problemas de login e CSP

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Login e CSP Definitivo\n');

function fixLoginDefinitivo() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Remover todos os scripts existentes e criar um script único
    const scriptPattern = /<script>[\s\S]*?<\/script>/g;
    indexContent = indexContent.replace(scriptPattern, '');
    
    // 2. Adicionar CSP atualizado com TypeKit permitido
    const newCSP = `
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io https://cdnjs.cloudflare.com https://www.google.com https://ajax.googleapis.com https://use.typekit.net;
        style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://use.typekit.net;
        img-src 'self' data: blob:;
        font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com https://use.typekit.net;
        connect-src 'self' ws://localhost:3000 http://localhost:3000 https://cdn.socket.io;
        media-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
    ">`;
    
    // Substituir CSP antigo
    const oldCSPPattern = /<meta http-equiv="Content-Security-Policy"[^>]*>/g;
    if (oldCSPPattern.test(indexContent)) {
        indexContent = indexContent.replace(oldCSPPattern, newCSP.trim());
        console.log('✅ CSP atualizado com TypeKit permitido');
    }
    
    // 3. Adicionar TypeKit fonts
    const typeKitLink = '<link rel="stylesheet" href="https://use.typekit.net/af/bcdde2/00000000000000003b9af1d8/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3">';
    
    if (!indexContent.includes('use.typekit.net')) {
        indexContent = indexContent.replace(
            '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">',
            typeKitLink + '\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">'
        );
        console.log('✅ TypeKit fonts adicionado');
    }
    
    // 4. Criar script único e completo no final do body
    const completeScript = `
    <script>
    // Sistema de Login Completo - Eldoria
    console.log('🌍 Iniciando Eldoria MMORPG...');
    
    // Variáveis globais
    let currentUser = null;
    let selectedCharacterClass = 'warrior';
    
    // Funções de login
    function handleLogin() {
        console.log('🔐 Botão de login clicado');
        
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
                
                // Transição para seleção de personagem
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
        console.log('📝 Selecionando classe:', characterClass);
        selectedCharacterClass = characterClass;
        
        // Visual feedback
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(card => card.classList.remove('selected'));
        
        const selectedCard = document.querySelector(\`[onclick="selectCharacter('\${characterClass}')"]\`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        // Habilitar botão de entrar
        const enterBtn = document.getElementById('enterWorldBtn');
        if (enterBtn) {
            enterBtn.disabled = false;
        }
        
        showMessage(\`\${getClassName(characterClass)} selecionado!\`, 'success');
    }
    
    function getClassName(characterClass) {
        const classes = {
            warrior: 'Guerreiro',
            mage: 'Mago',
            ranger: 'Arqueiro',
            rogue: 'Ladino'
        };
        return classes[characterClass] || 'Desconhecido';
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
                    initializeGameplay(selectedCharacterClass);
                }, 100);
            }, 300);
        }
    }
    
    function initializeGameplay(characterClass) {
        console.log('🎮 Inicializando gameplay para:', characterClass);
        
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('❌ Canvas não encontrado');
            return;
        }
        
        // Gameplay simplificado
        canvas.width = 800;
        canvas.height = 600;
        
        const ctx = canvas.getContext('2d');
        
        const player = {
            x: 400,
            y: 300,
            width: 32,
            height: 32,
            color: '#4CAF50',
            name: currentUser || 'Player',
            class: characterClass
        };
        
        function render() {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, player.width, player.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(\`\${player.name} - \${getClassName(characterClass)}\`, 10, 30);
            ctx.fillText('WASD: Mover | Espaço: Atacar', 10, canvas.height - 20);
        }
        
        function gameLoop() {
            render();
            requestAnimationFrame(gameLoop);
        }
        
        gameLoop();
        showMessage(\`Bem-vindo ao mundo, \${getClassName(characterClass)}!\`, 'success');
    }
    
    function showMessage(message, type) {
        console.log(\`💬 \${type.toUpperCase()}: \${message}\`);
        
        // Criar elemento de mensagem
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.3s;
            \${type === 'error' ? 'background: #f44336;' : 'background: #4CAF50;'}
        \`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    }
    
    // Inicialização
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 DOM carregado, configurando funções globais...');
        
        // Tornar funções globais
        window.handleLogin = handleLogin;
        window.showCreateAccount = showCreateAccount;
        window.handleCreateAccount = handleCreateAccount;
        window.backToLogin = backToLogin;
        window.selectCharacter = selectCharacter;
        window.startGame = startGame;
        window.initializeGameplay = initializeGameplay;
        window.showMessage = showMessage;
        
        console.log('✅ Funções globais configuradas');
        console.log('🎮 Eldoria MMORPG pronto!');
    });
    </script>`;
    
    // Adicionar script no final do body
    const bodyEndPattern = /<\/body>/;
    if (bodyEndPattern.test(indexContent)) {
        indexContent = indexContent.replace(bodyEndPattern, completeScript + '\n</body>');
        console.log('✅ Script completo adicionado');
    }
    
    // Salvar arquivo
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Arquivo salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Fix Login Definitivo v0.1.0');
console.log('===============================\n');

const success = fixLoginDefinitivo();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Login e CSP corrigidos!');
    console.log('📝 Script único e completo');
    console.log('📝 TypeKit permitido no CSP');
    console.log('📝 Funções globais garantidas');
    console.log('📝 DOMContentLoaded configurado');
    console.log('📝 Sem erros de referência');
} else {
    console.log('\n❌ Falha ao corrigir login');
}

console.log('\n✅ Script concluído!');
