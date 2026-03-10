// Teste completo do fluxo do usuário
const io = require('socket.io-client');

console.log('🧪 CHECKUP: Teste completo do fluxo do usuário...');

const socket = io('http://localhost:3002');

let step = 1;

socket.on('connect', () => {
    console.log('✅ Passo 1: Conectado ao servidor');
    testStep2();
});

function testStep2() {
    console.log('📝 Passo 2: Criando conta...');
    socket.emit('createAccount', {
        username: 'CheckupUser' + Date.now(),
        email: 'checkup' + Date.now() + '@test.com',
        password: 'password123'
    });
}

socket.on('createSuccess', (data) => {
    if (step === 2) {
        console.log('✅ Passo 2: Conta criada -', data.message);
        step = 3;
        testStep3();
    } else if (step === 4) {
        console.log('✅ Passo 4: Personagem criado -', data.message);
        console.log('🎉 FLUXO COMPLETO FUNCIONANDO!');
        socket.disconnect();
        process.exit(0);
    }
});

socket.on('createError', (data) => {
    console.log('❌ Erro no passo', step + ':', data.message);
    console.log('   Código:', data.code);
    console.log('   Explicação:', data.shortExplanation);
    
    if (step === 4) {
        console.log('⚠️ Personagem pode já existir, tentando login...');
        step = 5;
        testStep5();
    }
});

function testStep3() {
    console.log('🔐 Passo 3: Fazendo login...');
    socket.emit('login', {
        username: 'CheckupUser' + (Date.now() - 1000), // Usar usuário criado anteriormente
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
    console.log('⚔️ Passo 4: Criando personagem...');
    socket.emit('createCharacter', {
        name: 'CheckupHero' + Date.now(),
        class: 'recruta',
        race: 'human'
    });
}

function testStep5() {
    console.log('🔐 Passo 5: Tentando login com personagem existente...');
    // Teste adicional
}

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout do teste');
    socket.disconnect();
    process.exit(0);
}, 15000);
