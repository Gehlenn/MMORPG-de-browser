// Teste de edge cases e casos limite
const io = require('socket.io-client');

console.log('🧪 VARREDURA: Teste de edge cases...');

const socket = io('http://localhost:3002');

let testCount = 0;
let passedTests = 0;
let failedTests = [];

function runTest(testName, testData) {
    testCount++;
    console.log(`\n🧪 Teste ${testCount}: ${testName}`);
    
    socket.emit('createAccount', testData);
}

// Teste 1: Nome de usuário vazio
runTest('Nome de usuário vazio', {
    username: '',
    email: 'empty@test.com',
    password: 'password123'
});

// Teste 2: Email inválido
runTest('Email inválido', {
    username: 'InvalidEmail' + Date.now(),
    email: 'invalid-email',
    password: 'password123'
});

// Teste 3: Senha muito curta
runTest('Senha muito curta', {
    username: 'ShortPass' + Date.now(),
    email: 'short@test.com',
    password: '1'
});

// Teste 4: Nome de usuário muito longo
runTest('Nome muito longo', {
    username: 'A'.repeat(100),
    email: 'long@test.com',
    password: 'password123'
});

// Teste 5: Caracteres especiais no nome
runTest('Caracteres especiais', {
    username: 'Test<script>alert("xss")</script>' + Date.now(),
    email: 'xss@test.com',
    password: 'password123'
});

socket.on('createSuccess', (data) => {
    console.log('❌ ERRO: Deveria falhar mas passou -', data.message);
    failedTests.push({
        test: testCount,
        issue: 'Deveria falhar mas passou'
    });
});

socket.on('createError', (data) => {
    console.log('✅ PASS: Erro esperado -', data.message);
    passedTests++;
    
    if (testCount >= 5) {
        showResults();
    }
});

socket.on('loginError', (data) => {
    console.log('✅ PASS: Erro de login esperado -', data.message);
});

function showResults() {
    console.log('\n📊 RESULTADOS DOS TESTES DE EDGE CASE:');
    console.log(`Total de testes: ${testCount}`);
    console.log(`✅ Passaram: ${passedTests}`);
    console.log(`❌ Falharam: ${failedTests.length}`);
    
    if (failedTests.length > 0) {
        console.log('\n🚨 TESTES FALHARAM:');
        failedTests.forEach((test, i) => {
            console.log(`${i + 1}. Teste ${test.test}: ${test.issue}`);
        });
    }
    
    const successRate = (passedTests / testCount * 100).toFixed(1);
    console.log(`\n🎯 Taxa de sucesso: ${successRate}%`);
    console.log('🎯 STATUS:', successRate >= 80 ? '✅ BOM' : '❌ PRECISA MELHORAR');
    
    socket.disconnect();
    process.exit(successRate >= 80 ? 0 : 1);
}

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout do teste');
    showResults();
}, 10000);
