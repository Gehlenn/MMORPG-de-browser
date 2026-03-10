// Teste completo do fluxo até o jogo
const io = require('socket.io-client');

console.log('🎮 TESTE: Fluxo completo até o jogo...');

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
    
    // Criar personagem
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
    console.log('✅ Personagem criado com sucesso!');
    console.log('📊 Dados do personagem:', JSON.stringify(data.character, null, 2));
    
    // Verificar se tem os dados necessários para o jogo
    if (data.character) {
        console.log('🎯 Cliente deveria redirecionar para tela do jogo agora');
        console.log('🎮 Personagem pronto para jogar!');
        
        setTimeout(() => {
            console.log('🎉 FLUXO COMPLETO FUNCIONANDO!');
            socket.disconnect();
        }, 2000);
    } else {
        console.log('❌ Personagem não tem dados - problema no redirecionamento');
    }
});

socket.on('createError', (data) => {
    console.log('❌ Erro na criação:', data.message);
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout');
    socket.disconnect();
}, 15000);
