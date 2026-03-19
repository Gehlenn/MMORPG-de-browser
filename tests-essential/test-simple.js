// Teste simples
const io = require('socket.io-client');

console.log('🧪 Teste simples...');
const socket = io('http://localhost:3002');

socket.on('connect', () => {
    console.log('✅ Conectado!');
    
    // Teste simples
    socket.emit('createAccount', {
        username: 'Teste' + Date.now(),
        email: 'teste@test.com',
        password: '123'
    });
});

socket.on('createSuccess', (data) => {
    console.log('✅ Sucesso:', data.message);
});

socket.on('createError', (data) => {
    console.log('❌ Erro:', data.message);
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
    process.exit(0);
});

setTimeout(() => {
    console.log('⏰ Timeout');
    socket.disconnect();
    process.exit(0);
}, 5000);
