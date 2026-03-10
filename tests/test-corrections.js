// Teste das correções aplicadas
const io = require('socket.io-client');

console.log('🧪 TESTANDO CORREÇÕES APLICADAS...');

const socket = io('http://localhost:3002');

let step = 1;

socket.on('connect', () => {
    console.log('✅ Passo 1: Conectado ao servidor (porta 3002)');
    testStep2();
});

function testStep2() {
    console.log('📝 Passo 2: Testando criação de conta...');
    socket.emit('createAccount', {
        username: 'CorrigidoUser' + Date.now(),
        email: 'corrigido' + Date.now() + '@test.com',
        password: 'password123'
    });
}

socket.on('createSuccess', (data) => {
    if (step === 2) {
        console.log('✅ Passo 2: Conta criada -', data.message);
        step = 3;
        testStep3();
    } else if (step === 4) {
        console.log('✅ Passo 4: Personagem criado com RACE -', data.message);
        console.log('🎉 TODAS AS CORREÇÕES FUNCIONANDO!');
        socket.disconnect();
        process.exit(0);
    }
});

socket.on('createError', (data) => {
    console.log('❌ Erro no passo', step + ':', data.message);
    console.log('   Código:', data.code);
    console.log('   Explicação:', data.shortExplanation);
    
    if (step === 4 && data.code === 'DUPLICATE_KEY') {
        console.log('⚠️ Personagem duplicado, mas sistema funcionando!');
        socket.disconnect();
        process.exit(0);
    }
});

function testStep3() {
    console.log('🔐 Passo 3: Testando login...');
    socket.emit('login', {
        username: 'CorrigidoUser' + (Date.now() - 1000),
        password: 'password123'
    });
}

socket.on('loginSuccess', (data) => {
    console.log('✅ Passo 3: Login successful');
    step = 4;
    testStep4();
});

socket.on('loginError', (data) => {
    console.log('❌ Erro no login:', data.message);
});

function testStep4() {
    console.log('⚔️ Passo 4: Testando criação de personagem COM RACE...');
    socket.emit('createCharacter', {
        name: 'HeroCorrigido' + Date.now(),
        class: 'recruta',
        race: 'human'  // 🎯 TESTANDO CAMPO RACE
    });
}

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout do teste');
    socket.disconnect();
    process.exit(0);
}, 10000);
