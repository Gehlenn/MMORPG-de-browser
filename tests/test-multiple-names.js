// Teste múltiplos nomes
const io = require('socket.io-client');

const names = ['komodo12321', 'komdo2321421', 'komodoclerig', 'ShadowKomodoknight'];

console.log('🧪 Testando múltiplos nomes...');

let currentIndex = 0;
const socket = io('http://localhost:3001');

socket.on('connect', () => {
    console.log('✅ Conectado ao servidor!');
    testNextName();
});

function testNextName() {
    if (currentIndex >= names.length) {
        console.log('🏁 Teste concluído!');
        socket.disconnect();
        process.exit(0);
        return;
    }
    
    const name = names[currentIndex];
    console.log(`\n⚔️ Testando nome ${currentIndex + 1}/${names.length}: ${name}`);
    
    socket.emit('createCharacter', {
        name: name,
        class: 'recruta',
        race: 'human'
    });
}

socket.on('createSuccess', (data) => {
    console.log('✅ SUCESSO:', data.message);
    currentIndex++;
    setTimeout(testNextName, 1000);
});

socket.on('createError', (data) => {
    console.log('❌ ERRO:');
    console.log('   Mensagem:', data.message);
    console.log('   Explicação:', data.shortExplanation);
    console.log('   Sugestão:', data.suggestion);
    currentIndex++;
    setTimeout(testNextName, 1000);
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout');
    socket.disconnect();
    process.exit(0);
}, 15000);
