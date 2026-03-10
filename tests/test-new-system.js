// Teste do novo sistema de login
const io = require('socket.io-client');

console.log('🧪 Testando novo sistema de login...');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
    console.log('✅ Conectado ao servidor!');
    
    // Testar criação de conta
    console.log('📝 Criando conta: TestUser2024');
    socket.emit('createAccount', {
        username: 'TestUser2024',
        email: 'testuser2024@example.com',
        password: 'password123'
    });
});

socket.on('createSuccess', (data) => {
    console.log('✅ Conta criada:', data.message);
    
    // Testar login
    console.log('🔐 Fazendo login...');
    socket.emit('login', {
        username: 'TestUser2024',
        password: 'password123'
    });
});

socket.on('loginSuccess', (data) => {
    console.log('✅ Login successful:', data);
    
    // Testar criação de personagem
    console.log('⚔️ Criando personagem: KomodoTest2024');
    socket.emit('createCharacter', {
        name: 'KomodoTest2024',
        class: 'recruta',
        race: 'human'
    });
});

socket.on('createError', (data) => {
    console.log('❌ Erro:', data);
    console.log('Código:', data.code);
    console.log('Mensagem:', data.message);
    console.log('Explicação:', data.shortExplanation);
    console.log('Sugestão:', data.suggestion);
});

socket.on('loginError', (data) => {
    console.log('❌ Erro no login:', data);
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado do servidor');
});

socket.on('connect_error', (error) => {
    console.log('❌ Erro de conexão:', error);
});

// Timeout após 15 segundos
setTimeout(() => {
    console.log('⏰ Teste concluído');
    socket.disconnect();
    process.exit(0);
}, 15000);
