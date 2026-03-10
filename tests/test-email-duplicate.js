// Teste de email duplicado
const io = require('socket.io-client');

console.log('🧪 Testando email duplicado...');

const socket = io('http://localhost:3002');

socket.on('connect', () => {
    console.log('✅ Conectado ao servidor!');
    
    // Tentar criar conta com email que já existe
    console.log('📝 Testando email duplicado: test@example.com');
    socket.emit('createAccount', {
        username: 'UserDiferente123',
        email: 'test@example.com', // Email que já existe
        password: 'password123'
    });
});

socket.on('createSuccess', (data) => {
    console.log('✅ Sucesso inesperado:', data.message);
});

socket.on('createError', (data) => {
    console.log('❌ ERRO DE EMAIL:');
    console.log('   Código:', data.code);
    console.log('   Mensagem:', data.message);
    console.log('   Explicação:', data.shortExplanation);
    console.log('   Sugestão:', data.suggestion);
    
    if (data.code === 'EMAIL_DUPLICATE') {
        console.log('✅ Sistema reconheceu email duplicado corretamente!');
    } else {
        console.log('❌ Sistema não reconheceu email duplicado!');
    }
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
    process.exit(0);
});

setTimeout(() => {
    socket.disconnect();
    process.exit(0);
}, 5000);
