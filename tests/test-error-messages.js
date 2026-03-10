// Teste de mensagens de erro
const io = require('socket.io-client');

console.log('🧪 Testando mensagens de erro...');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
    console.log('✅ Conectado ao servidor!');
    
    // Testar criação de personagem com nome que já existe
    console.log('⚔️ Testando nome duplicado: ShadowKomodoknight');
    socket.emit('createCharacter', {
        name: 'ShadowKomodoknight',
        class: 'recruta',
        race: 'human'
    });
});

socket.on('createSuccess', (data) => {
    console.log('✅ Sucesso:', data.message);
});

socket.on('createError', (data) => {
    console.log('❌ ERRO DETALHADO:');
    console.log('   Mensagem:', data.message);
    console.log('   Código:', data.code);
    console.log('   Explicação:', data.shortExplanation);
    console.log('   Sugestão:', data.suggestion);
    console.log('');
    console.log('📋 Como aparecerá no navegador:');
    console.log('   1️⃣ Status: ❌ Nome de personagem já existe');
    console.log('   2️⃣ (2s depois) Status: 💡 Tente: "SuperHero123", "DragonX", "MegaPlayer77"');
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
    process.exit(0);
});

setTimeout(() => {
    socket.disconnect();
    process.exit(0);
}, 5000);
