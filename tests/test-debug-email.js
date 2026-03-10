// Teste debug do sistema de email
const io = require('socket.io-client');

console.log('🧪 Debug do sistema de email...');

const socket = io('http://localhost:3002');

socket.on('connect', () => {
    console.log('✅ Conectado ao servidor!');
    
    // Primeiro tentar criar conta com email novo
    console.log('📝 Criando conta com email novo...');
    socket.emit('createAccount', {
        username: 'TesteEmailNovo',
        email: 'novo@teste.com',
        password: 'password123'
    });
});

socket.on('createSuccess', (data) => {
    console.log('✅ Primeira conta criada:', data.message);
    
    // Agora tentar com mesmo email
    console.log('📝 Tentando duplicar email...');
    socket.emit('createAccount', {
        username: 'OutroUsuario',
        email: 'novo@teste.com', // Mesmo email
        password: 'password456'
    });
});

socket.on('createError', (data) => {
    console.log('❌ ERRO DETALHADO:');
    console.log('   Código:', data.code);
    console.log('   Mensagem:', data.message);
    console.log('   Explicação:', data.shortExplanation);
    console.log('   Sugestão:', data.suggestion);
    console.log('   Original Error:', data.originalError);
    console.log('   Context:', data.context);
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
    process.exit(0);
});

setTimeout(() => {
    socket.disconnect();
    process.exit(0);
}, 10000);
