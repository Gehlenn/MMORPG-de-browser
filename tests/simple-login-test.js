// Teste simples de login
const io = require('socket.io-client');

console.log('🧪 Teste simples de login...');

const socket = io('http://localhost:3002');

socket.on('connect', () => {
    console.log('✅ Conectado');
    
    // Tentar criar conta simples
    socket.emit('createAccount', {
        username: 'SimpleUser',
        email: 'simple@test.com',
        password: 'password123'
    });
});

socket.on('createSuccess', (data) => {
    console.log('✅ Conta criada:', data.message);
    
    // Tentar login
    socket.emit('login', {
        username: 'SimpleUser',
        password: 'password123'
    });
});

socket.on('createError', (data) => {
    console.log('❌ Erro na criação:', data.message);
    console.log('   Código:', data.code);
    
    // Tentar login com conta existente
    socket.emit('login', {
        username: 'SimpleUser',
        password: 'password123'
    });
});

socket.on('loginSuccess', (data) => {
    console.log('✅ Login successful!');
    console.log('   Player:', data.player.name);
    console.log('   Level:', data.player.level);
    
    setTimeout(() => {
        socket.disconnect();
        console.log('🎉 Teste concluído com sucesso!');
    }, 1000);
});

socket.on('loginError', (data) => {
    console.log('❌ Erro no login:', data.message);
    console.log('   Código:', data.code);
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout');
    socket.disconnect();
}, 10000);
