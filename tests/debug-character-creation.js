// Debug da criação de personagem
const io = require('socket.io-client');

console.log('🐛 DEBUG: Criação de personagem...');

const socket = io('http://localhost:3002');

let step = 1;

socket.on('connect', () => {
    console.log('✅ Conectado ao servidor');
    
    // Fazer login primeiro
    socket.emit('login', {
        username: 'komodo1212',
        password: 'password123' // Assumindo senha padrão
    });
});

socket.on('loginSuccess', (data) => {
    console.log('✅ Login successful:', data.player.name);
    console.log('   Player ID:', data.player.id);
    console.log('   Level:', data.player.level);
    
    // Aguardar um pouco e tentar criar personagem
    setTimeout(() => {
        console.log('⚔️ Tentando criar personagem...');
        socket.emit('createCharacter', {
            name: 'KomodoHero' + Date.now(),
            class: 'recruta',
            race: 'human'
        });
    }, 1000);
});

socket.on('loginError', (data) => {
    console.log('❌ Erro no login:', data.message);
    console.log('   Código:', data.code);
    
    if (data.code === 'USER_NOT_FOUND') {
        console.log('🔍 Usuário komodo1212 não encontrado');
        console.log('💡 Tentando criar conta...');
        
        // Criar conta
        socket.emit('createAccount', {
            username: 'komodo1212',
            email: 'komodo1212@test.com',
            password: 'password123'
        });
    } else if (data.code === 'INVALID_PASSWORD') {
        console.log('🔍 Senha incorreta para komodo1212');
    }
});

socket.on('createSuccess', (data) => {
    if (step === 1) {
        console.log('✅ Conta criada:', data.message);
        step = 2;
        
        // Tentar login novamente
        socket.emit('login', {
            username: 'komodo1212',
            password: 'password123'
        });
    } else if (step === 2) {
        console.log('✅ Personagem criado:', data.message);
        console.log('🎉 SUCESSO! Personagem criado com sucesso');
        
        setTimeout(() => {
            socket.disconnect();
        }, 1000);
    }
});

socket.on('createError', (data) => {
    console.log('❌ Erro na criação de personagem:');
    console.log('   Mensagem:', data.message);
    console.log('   Código:', data.code);
    console.log('   Explicação:', data.shortExplanation);
    console.log('   Sugestão:', data.suggestion);
    
    if (data.code === 'UNKNOWN_ERROR') {
        console.log('🔍 Erro desconhecido - verificando servidor...');
    }
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

// Timeout estendido para debug
setTimeout(() => {
    console.log('⏰ Timeout extendido - verificando status...');
    socket.disconnect();
}, 20000);
