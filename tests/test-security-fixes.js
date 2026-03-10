// Teste das correções de segurança
const io = require('socket.io-client');

console.log('🔒 TESTANDO CORREÇÕES DE SEGURANÇA...');

const socket = io('http://localhost:3002');

let testCount = 0;
let securityTests = [
    {
        name: 'Nome vazio',
        data: { username: '', email: 'test@test.com', password: 'password123' },
        shouldFail: true
    },
    {
        name: 'Nome muito curto',
        data: { username: 'ab', email: 'test@test.com', password: 'password123' },
        shouldFail: true
    },
    {
        name: 'Nome com caracteres especiais',
        data: { username: 'test<script>', email: 'test@test.com', password: 'password123' },
        shouldFail: true
    },
    {
        name: 'Email inválido',
        data: { username: 'validuser', email: 'invalid-email', password: 'password123' },
        shouldFail: true
    },
    {
        name: 'Senha muito curta',
        data: { username: 'validuser', email: 'test@test.com', password: '123' },
        shouldFail: true
    },
    {
        name: 'Dados válidos',
        data: { username: 'SecureUser' + Date.now(), email: 'secure@test.com', password: 'password123' },
        shouldFail: false
    }
];

socket.on('connect', () => {
    console.log('✅ Conectado, iniciando testes de segurança...');
    runSecurityTest();
});

function runSecurityTest() {
    if (testCount >= securityTests.length) {
        showSecurityResults();
        return;
    }
    
    const test = securityTests[testCount];
    console.log(`\n🧪 Teste ${testCount + 1}: ${test.name}`);
    
    socket.emit('createAccount', test.data);
}

socket.on('createSuccess', (data) => {
    const test = securityTests[testCount];
    
    if (test.shouldFail) {
        console.log('❌ FALHA: Deveria bloquear mas passou!');
        test.result = 'FAILED';
    } else {
        console.log('✅ PASS: Permitido corretamente');
        test.result = 'PASSED';
    }
    
    testCount++;
    setTimeout(runSecurityTest, 500);
});

socket.on('createError', (data) => {
    const test = securityTests[testCount];
    
    if (test.shouldFail) {
        console.log('✅ PASS: Bloqueado corretamente -', data.message);
        test.result = 'PASSED';
    } else {
        console.log('❌ FALHA: Deveria permitir mas bloqueou!');
        test.result = 'FAILED';
    }
    
    testCount++;
    setTimeout(runSecurityTest, 500);
});

function showSecurityResults() {
    console.log('\n📊 RESULTADOS DOS TESTES DE SEGURANÇA:');
    
    const passed = securityTests.filter(t => t.result === 'PASSED').length;
    const failed = securityTests.filter(t => t.result === 'FAILED').length;
    
    console.log(`✅ Testes passados: ${passed}`);
    console.log(`❌ Testes falhados: ${failed}`);
    
    if (failed > 0) {
        console.log('\n🚨 TESTES FALHARAM:');
        securityTests.filter(t => t.result === 'FAILED').forEach((test, i) => {
            console.log(`${i + 1}. ${test.name}`);
        });
    }
    
    const securityScore = (passed / securityTests.length * 100).toFixed(1);
    console.log(`\n🛡️ Pontuação de segurança: ${securityScore}%`);
    console.log('🎯 STATUS:', securityScore >= 80 ? '✅ SEGURO' : '❌ AINDA VULNERÁVEL');
    
    // Testar login com hash
    if (securityScore >= 80) {
        console.log('\n🔐 Testando login com hash...');
        testLoginWithHash();
    } else {
        socket.disconnect();
        process.exit(securityScore >= 80 ? 0 : 1);
    }
}

function testLoginWithHash() {
    // Criar uma conta para testar login
    socket.emit('createAccount', {
        username: 'HashTest' + Date.now(),
        email: 'hashtest@test.com',
        password: 'testpassword123'
    });
    
    // Depois testar login
    socket.once('createSuccess', (data) => {
        console.log('✅ Conta criada para teste de hash');
        
        // Tentar login com senha correta
        socket.emit('login', {
            username: 'HashTest' + (Date.now() - 1000),
            password: 'testpassword123'
        });
    });
    
    socket.once('loginSuccess', (data) => {
        console.log('✅ Login com hash funcionando!');
        console.log('\n🎉 TODAS AS CORREÇÕES DE SEGURANÇA FUNCIONANDO!');
        socket.disconnect();
        process.exit(0);
    });
    
    socket.once('loginError', (data) => {
        console.log('❌ Erro no login com hash:', data.message);
        socket.disconnect();
        process.exit(1);
    });
}

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout do teste');
    socket.disconnect();
    process.exit(1);
}, 30000);
