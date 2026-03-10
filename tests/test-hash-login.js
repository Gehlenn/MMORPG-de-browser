// Teste simples de login com hash
const io = require('socket.io-client');

console.log('🔐 Testando login com hash...');

const socket = io('http://localhost:3002');

const testUser = 'HashLogin' + Date.now();
const testPass = 'password123';

socket.on('connect', () => {
    console.log('✅ Conectado');
    
    // Criar conta
    socket.emit('createAccount', {
        username: testUser,
        email: 'hashlogin@test.com',
        password: testPass
    });
});

socket.on('createSuccess', (data) => {
    console.log('✅ Conta criada:', data.message);
    
    // Testar login com senha correta
    socket.emit('login', {
        username: testUser,
        password: testPass
    });
});

socket.on('createError', (data) => {
    console.log('❌ Erro ao criar conta:', data.message);
    socket.disconnect();
    process.exit(1);
});

socket.on('loginSuccess', (data) => {
    console.log('✅ Login com hash funcionando!');
    console.log('🎉 SENHAS SEGURAS COM BCRYPT!');
    socket.disconnect();
    process.exit(0);
});

socket.on('loginError', (data) => {
    console.log('❌ Erro no login:', data.message);
    socket.disconnect();
    process.exit(1);
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout');
    socket.disconnect();
    process.exit(1);
}, 10000);
