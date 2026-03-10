// Teste bypassando validação
const io = require('socket.io-client');

console.log('🧪 TESTE: Bypassando validação...');

const socket = io('http://localhost:3002');

socket.on('connect', () => {
    console.log('✅ Conectado');
    
    // Login
    socket.emit('login', {
        username: 'komodo1212',
        password: 'password123'
    });
});

socket.on('loginSuccess', (data) => {
    console.log('✅ Login successful');
    
    // Testar criação de personagem sem validação
    console.log('🧪 Enviando createCharacter direto...');
    
    // Enviar dados exatos como o cliente envia
    socket.emit('createCharacter', {
        name: 'TestHero' + Date.now(),
        class: 'recruta',
        race: 'human'
    });
});

socket.on('loginError', (data) => {
    console.log('❌ Erro no login:', data.message);
});

socket.on('createSuccess', (data) => {
    console.log('✅ Personagem criado:', data.message);
    console.log('🎉 SUCESSO!');
    
    setTimeout(() => {
        socket.disconnect();
    }, 1000);
});

socket.on('createError', (data) => {
    console.log('❌ Erro na criação:');
    console.log('   Código:', data.code);
    console.log('   Mensagem:', data.message);
    
    if (data.code === 'UNKNOWN_ERROR') {
        console.log('🔍 Erro desconhecido persiste');
        console.log('   Possível problema no banco de dados');
        console.log('   Ou no método validateCharacterInput');
    }
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout');
    socket.disconnect();
}, 10000);
