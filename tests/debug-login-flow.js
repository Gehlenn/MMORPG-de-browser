// Debug do fluxo de login
const io = require('socket.io-client');

console.log('🐛 DEBUG: Fluxo de login...');

const socket = io('http://localhost:3002');

socket.on('connect', () => {
    console.log('✅ Conectado ao servidor');
    
    // Criar conta para teste
    console.log('📝 Criando conta de teste...');
    socket.emit('createAccount', {
        username: 'DebugLogin' + Date.now(),
        email: 'debuglogin@test.com',
        password: 'password123'
    });
});

socket.on('createSuccess', (data) => {
    console.log('✅ Conta criada:', data.message);
    
    // Tentar login imediatamente
    console.log('🔐 Tentando login...');
    socket.emit('login', {
        username: 'DebugLogin' + (Date.now() - 1000),
        password: 'password123'
    });
});

socket.on('createError', (data) => {
    console.log('❌ Erro ao criar conta:', data.message);
    console.log('   Código:', data.code);
});

socket.on('loginSuccess', (data) => {
    console.log('✅ Login SUCCESS:', data);
    console.log('   Player ID:', data.player.id);
    console.log('   Player Name:', data.player.name);
    console.log('   Player Level:', data.player.level);
    
    // Verificar se o cliente deveria redirecionar
    console.log('\n🔄 Cliente deveria redirecionar para tela de personagens agora');
    
    setTimeout(() => {
        console.log('🔌 Desconectando após login successful');
        socket.disconnect();
    }, 2000);
});

socket.on('loginError', (data) => {
    console.log('❌ Login ERROR:', data.message);
    console.log('   Código:', data.code);
    
    if (data.code === 'USER_NOT_FOUND') {
        console.log('🔍 Problema: Usuário não encontrado no banco');
    } else if (data.code === 'INVALID_PASSWORD') {
        console.log('🔍 Problema: Senha incorreta');
    } else {
        console.log('🔍 Problema desconhecido');
    }
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout - verificando status da conexão');
    socket.disconnect();
}, 15000);
