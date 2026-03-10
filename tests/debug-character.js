// Debug específico da criação de personagem
const io = require('socket.io-client');

console.log('🐛 DEBUG: Criação de personagem...');

const socket = io('http://localhost:3002');

let step = 1;

socket.on('connect', () => {
    console.log('✅ Conectado');
    
    // Criar conta primeiro
    socket.emit('createAccount', {
        username: 'DebugUser' + Date.now(),
        email: 'debug@test.com',
        password: 'password123'
    });
});

socket.on('createSuccess', (data) => {
    if (step === 1) {
        console.log('✅ Conta criada:', data.message);
        step = 2;
        
        // Fazer login
        socket.emit('login', {
            username: 'DebugUser' + (Date.now() - 1000),
            password: 'password123'
        });
    } else if (step === 3) {
        console.log('✅ Personagem criado:', data.message);
        socket.disconnect();
        process.exit(0);
    }
});

socket.on('createError', (data) => {
    console.log('❌ ERRO NA CRIAÇÃO:');
    console.log('   Mensagem:', data.message);
    console.log('   Código:', data.code);
    console.log('   Explicação:', data.shortExplanation);
    console.log('   Sugestão:', data.suggestion);
    
    if (data.code === 'UNKNOWN_ERROR') {
        console.log('\n🔍 ERRO DESCONHECIDO - Precisa investigar servidor');
    }
    
    socket.disconnect();
    process.exit(1);
});

socket.on('loginSuccess', (data) => {
    console.log('✅ Login successful');
    step = 3;
    
    // Tentar criar personagem
    console.log('\n🧪 Tentando criar personagem...');
    socket.emit('createCharacter', {
        name: 'DebugHero' + Date.now(),
        class: 'recruta',
        race: 'human'
    });
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
}, 15000);
