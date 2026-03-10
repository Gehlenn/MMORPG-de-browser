// Teste simulando exatamente o fluxo do navegador
const io = require('socket.io-client');

console.log('🌐 TESTE: Simulando fluxo do navegador...');

const socket = io('http://localhost:3002');

socket.on('connect', () => {
    console.log('✅ Conectado');
    
    // Login como o navegador faria
    socket.emit('login', {
        username: 'komodo1212',
        password: 'password123'
    });
});

socket.on('loginSuccess', (data) => {
    console.log('✅ Login successful - dados:', JSON.stringify(data, null, 2));
    
    // Simular criação de personagem como o navegador
    const characterData = {
        name: 'robson1421as',
        class: 'recruta',
        race: 'elf'
    };
    
    console.log('🎮 Enviando createCharacter com:', JSON.stringify(characterData, null, 2));
    socket.emit('createCharacter', characterData);
});

socket.on('loginError', (data) => {
    console.log('❌ Erro no login:', data);
});

socket.on('createSuccess', (data) => {
    console.log('✅ createSuccess recebido!');
    console.log('📊 Dados completos:', JSON.stringify(data, null, 2));
    
    // Verificar se tem os dados que o cliente espera
    if (data.character) {
        console.log('🎯 Personagem presente em data.character');
        console.log('🎮 Cliente deveria chamar showGameScreen() agora');
        
        // Simular o que o cliente faria
        console.log('🎮 Chamando showGameScreen()...');
        
        setTimeout(() => {
            console.log('🎮 Interface do jogo inicializada');
            console.log('🎉 FLUXO COMPLETO!');
        }, 1500);
    } else {
        console.log('❌ data.character não encontrado!');
        console.log('📊 data completo:', Object.keys(data));
    }
});

socket.on('createError', (data) => {
    console.log('❌ Erro na criação:', JSON.stringify(data, null, 2));
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout - fluxo não completou');
    socket.disconnect();
}, 20000);
