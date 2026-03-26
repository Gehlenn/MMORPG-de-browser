// Fix Login Buttons Script
// Corrige problema dos botões de login não funcionarem

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Botões de Login\n');

function fixLoginButtons() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Procurar pelos botões de login
    const loginButtonPattern = /<button id="loginBtn" class="login-button">Entrar no Jogo<\/button>/;
    const createButtonPattern = /<button id="showCreateAccountBtn" class="login-button create-account">Criar Nova Conta<\/button>/;
    
    if (loginButtonPattern.test(indexContent) && createButtonPattern.test(indexContent)) {
        // Adicionar event listeners diretamente nos botões
        const fixedContent = indexContent.replace(
            loginButtonPattern,
            `<button id="loginBtn" class="login-button" onclick="handleLogin()">Entrar no Jogo</button>`
        ).replace(
            createButtonPattern,
            `<button id="showCreateAccountBtn" class="login-button create-account" onclick="showCreateAccount()">Criar Nova Conta</button>`
        );
        
        // Adicionar as funções de login no final do script
        const scriptAddition = `
    <script>
        // Funções de login direto
        function handleLogin() {
            console.log('🔐 Botão de login clicado');
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                alert('Por favor, preencha todos os campos');
                return;
            }
            
            console.log('📝 Tentando login com:', username);
            
            // Conectar ao servidor
            if (typeof io !== 'undefined') {
                const socket = io('http://localhost:3000');
                
                socket.on('connect', () => {
                    console.log('✅ Conectado ao servidor');
                    
                    socket.emit('login', {
                        username: username,
                        password: password
                    });
                });
                
                socket.on('loginSuccess', (data) => {
                    console.log('🎉 Login successful:', data);
                    alert('Login realizado com sucesso!');
                    
                    // Esconder tela de login
                    document.getElementById('loginScreen').style.display = 'none';
                    
                    // Mostrar jogo
                    document.getElementById('gameContainer').style.display = 'block';
                });
                
                socket.on('loginError', (error) => {
                    console.error('❌ Login error:', error);
                    alert('Erro no login: ' + error.message);
                });
                
            } else {
                console.error('❌ Socket.io não carregado');
                alert('Erro: Sistema de conexão não disponível');
            }
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
        
        // Adicionar event listeners quando a página carregar
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 Configurando botões de login');
            
            const loginBtn = document.getElementById('loginBtn');
            const createBtn = document.getElementById('showCreateAccountBtn');
            
            if (loginBtn) {
                loginBtn.addEventListener('click', handleLogin);
                console.log('✅ Botão de login configurado');
            }
            
            if (createBtn) {
                createBtn.addEventListener('click', showCreateAccount);
                console.log('✅ Botão criar conta configurado');
            }
        });
    </script>`;
        
        const finalContent = fixedContent.replace('</body>', scriptAddition + '</body>');
        
        fs.writeFileSync(indexPath, finalContent);
        console.log('✅ Botões de login corrigidos');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Fix Login Buttons v0.1.0');
console.log('===============================\n');

const success = fixLoginButtons();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Botões de login corrigidos!');
} else {
    console.log('\n❌ Falha ao corrigir botões');
}

console.log('\n✅ Script concluído!');
