// Teste completo do fluxo do usuário
const io = require('socket.io-client');

console.log('🔍 VARREDURA: Teste completo do fluxo...');

const socket = io('http://localhost:3002');

let testResults = {
    connection: false,
    accountCreation: false,
    login: false,
    characterCreation: false,
    errors: []
};

socket.on('connect', () => {
    console.log('✅ Etapa 1: Conexão estabelecida');
    testResults.connection = true;
    testAccountCreation();
});

function testAccountCreation() {
    console.log('📝 Etapa 2: Criando conta...');
    socket.emit('createAccount', {
        username: 'FlowTest' + Date.now(),
        email: 'flowtest' + Date.now() + '@test.com',
        password: 'password123'
    });
}

socket.on('createSuccess', (data) => {
    if (!testResults.accountCreation) {
        console.log('✅ Etapa 2: Conta criada -', data.message);
        testResults.accountCreation = true;
        testLogin();
    } else if (!testResults.characterCreation) {
        console.log('✅ Etapa 4: Personagem criado -', data.message);
        testResults.characterCreation = true;
        showResults();
    }
});

socket.on('createError', (data) => {
    testResults.errors.push({
        step: 'account/character creation',
        error: data.message,
        code: data.code
    });
    console.log('❌ Erro na criação:', data.message);
});

function testLogin() {
    console.log('🔐 Etapa 3: Fazendo login...');
    socket.emit('login', {
        username: 'FlowTest' + (Date.now() - 1000),
        password: 'password123'
    });
}

socket.on('loginSuccess', (data) => {
    console.log('✅ Etapa 3: Login successful');
    testResults.login = true;
    testCharacterCreation();
});

socket.on('loginError', (data) => {
    testResults.errors.push({
        step: 'login',
        error: data.message
    });
    console.log('❌ Erro no login:', data.message);
});

function testCharacterCreation() {
    console.log('⚔️ Etapa 4: Criando personagem...');
    socket.emit('createCharacter', {
        name: 'FlowHero' + Date.now(),
        class: 'recruta',
        race: 'human'
    });
}

function showResults() {
    console.log('\n📊 RESULTADOS DO TESTE:');
    console.log('✅ Conexão:', testResults.connection);
    console.log('✅ Criação de conta:', testResults.accountCreation);
    console.log('✅ Login:', testResults.login);
    console.log('✅ Criação de personagem:', testResults.characterCreation);
    console.log('❌ Erros:', testResults.errors.length);
    
    if (testResults.errors.length > 0) {
        console.log('\n🚨 ERROS ENCONTRADOS:');
        testResults.errors.forEach((err, i) => {
            console.log(`${i + 1}. ${err.step}: ${err.error}`);
        });
    }
    
    const allPassed = Object.values(testResults).filter(v => typeof v === 'boolean').every(v => v);
    console.log('\n🎯 STATUS:', allPassed ? '✅ FUNCIONANDO' : '❌ PROBLEMAS');
    
    socket.disconnect();
    process.exit(allPassed ? 0 : 1);
}

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout - mostrando resultados parciais...');
    showResults();
}, 15000);
