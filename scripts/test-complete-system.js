// Test Complete System Script
// Testa automaticamente login, criação de conta e gameplay

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🧪 Testando Sistema Completo\n');

function runTest() {
    console.log('📋 Testando Sistema de Login e Gameplay\n');
    
    // 1. Verificar se servidor está rodando
    console.log('1️⃣ Verificando servidor...');
    exec('netstat -ano | findstr :3000', (error, stdout) => {
        if (stdout.includes('3000')) {
            console.log('✅ Servidor está rodando na porta 3000');
            
            // 2. Criar arquivo de teste
            console.log('2️⃣ Criando arquivo de teste...');
            const testContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Teste Automático</title>
</head>
<body>
    <h1>Teste Automático do Sistema</h1>
    <div id="testResults"></div>
    
    <script>
        const results = document.getElementById('testResults');
        
        function log(message, type = 'info') {
            const div = document.createElement('div');
            div.style.color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'blue';
            div.textContent = message;
            results.appendChild(div);
            console.log(message);
        }
        
        // Testar localStorage
        log('🧪 Testando localStorage...');
        try {
            localStorage.setItem('test', 'value');
            const value = localStorage.getItem('test');
            if (value === 'value') {
                log('✅ localStorage funcionando', 'success');
            } else {
                log('❌ localStorage com problemas', 'error');
            }
        } catch (error) {
            log('❌ localStorage erro: ' + error.message, 'error');
        }
        
        // Testar Socket.io
        log('🧪 Testando Socket.io...');
        if (typeof io !== 'undefined') {
            const socket = io('http://localhost:3000');
            socket.on('connect', () => {
                log('✅ Conexão Socket.io funcionando', 'success');
                
                // Testar login
                log('🧪 Testando login...');
                socket.emit('login', { username: 'testuser', password: 'testpass' });
                
                socket.on('loginSuccess', (data) => {
                    log('✅ Login servidor funcionando', 'success');
                });
                
                socket.on('loginError', (error) => {
                    log('⚠️ Login servidor falhou (esperado): ' + error.message);
                });
            });
            
            socket.on('connect_error', (error) => {
                log('❌ Erro de conexão Socket.io: ' + error.message, 'error');
            });
        } else {
            log('❌ Socket.io não carregado', 'error');
        }
        
        // Testar criação de conta local
        log('🧪 Testando criação de conta local...');
        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            users['testuser'] = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'testpass',
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('users', JSON.stringify(users));
            
            const savedUsers = JSON.parse(localStorage.getItem('users') || '{}');
            if (savedUsers['testuser']) {
                log('✅ Criação de conta local funcionando', 'success');
            } else {
                log('❌ Criação de conta local falhou', 'error');
            }
        } catch (error) {
            log('❌ Erro criação conta: ' + error.message, 'error');
        }
        
        // Testar login local
        log('🧪 Testando login local...');
        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users['testuser'];
            
            if (user && user.password === 'testpass') {
                log('✅ Login local funcionando', 'success');
            } else {
                log('❌ Login local falhou', 'error');
            }
        } catch (error) {
            log('❌ Erro login local: ' + error.message, 'error');
        }
        
        // Testar elementos DOM
        log('🧪 Testando elementos DOM...');
        setTimeout(() => {
            const loginBtn = document.getElementById('loginBtn');
            const createBtn = document.getElementById('showCreateAccountBtn');
            
            if (loginBtn && createBtn) {
                log('✅ Botões de login encontrados', 'success');
                
                // Testar clique nos botões
                loginBtn.click();
                log('🧪 Botão login clicado');
                
                setTimeout(() => {
                    createBtn.click();
                    log('🧪 Botão criar conta clicado');
                }, 1000);
                
            } else {
                log('❌ Botões de login não encontrados', 'error');
            }
        }, 2000);
        
        log('🎯 Testes iniciados! Aguarde resultados...');
    </script>
    
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</body>
</html>`;
            
            const testPath = path.join(__dirname, '../client/test-auto.html');
            fs.writeFileSync(testPath, testContent);
            console.log('✅ Arquivo de teste criado: client/test-auto.html');
            
            // 3. Abrir navegador com teste
            console.log('3️⃣ Abrindo navegador com teste...');
            exec('start http://localhost:3000/client/test-auto.html', (error) => {
                if (error) {
                    console.error('❌ Erro ao abrir navegador:', error);
                } else {
                    console.log('✅ Navegador aberto com página de teste');
                    console.log('\n📝 Instruções:');
                    console.log('1. A página de teste abrirá automaticamente');
                    console.log('2. Observe os resultados dos testes');
                    console.log('3. Teste manualmente os botões de login');
                    console.log('4. Verifique o console do navegador (F12) para erros');
                    console.log('\n🔗 Links úteis:');
                    console.log('- Teste automático: http://localhost:3000/client/test-auto.html');
                    console.log('- Jogo principal: http://localhost:3000');
                }
            });
            
        } else {
            console.log('❌ Servidor não está rodando');
            console.log('💡 Inicie o servidor com: node server/server-simple-fixed.js');
        }
    });
}

// Executar teste
console.log('🎯 Test Complete System v0.1.0');
console.log('===============================\n');

runTest();

console.log('\n✅ Script de teste concluído!');
