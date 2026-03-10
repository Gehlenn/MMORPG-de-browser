// Teste de limites e exceções extremas
const io = require('socket.io-client');

console.log('🧪 VARREDURA: Teste de limites extremos...');

const socket = io('http://localhost:3002');

let extremeTests = [
    {
        name: 'Nome com 1000 caracteres',
        data: {
            username: 'A'.repeat(1000),
            email: 'extreme@test.com',
            password: 'password123'
        }
    },
    {
        name: 'Email com 500 caracteres',
        data: {
            username: 'ExtremeEmail' + Date.now(),
            email: 'test@' + 'A'.repeat(480) + '.com',
            password: 'password123'
        }
    },
    {
        name: 'Senha com SQL Injection',
        data: {
            username: 'SQLTest' + Date.now(),
            email: 'sql@test.com',
            password: "'; DROP TABLE accounts; --"
        }
    },
    {
        name: 'Nome com Unicode extremo',
        data: {
            username: '🚀🎮🎯🎲🎸🎪🎨🎬🎭🎪' + Date.now(),
            email: 'unicode@test.com',
            password: 'password123'
        }
    },
    {
        name: 'Dados nulos',
        data: {
            username: null,
            email: null,
            password: null
        }
    }
];

let currentTest = 0;
let results = [];

socket.on('connect', () => {
    console.log('✅ Conectado, iniciando testes extremos...');
    runNextTest();
});

function runNextTest() {
    if (currentTest >= extremeTests.length) {
        showResults();
        return;
    }
    
    const test = extremeTests[currentTest];
    console.log(`\n🧪 Teste Extremo ${currentTest + 1}: ${test.name}`);
    
    socket.emit('createAccount', test.data);
}

socket.on('createSuccess', (data) => {
    console.log('⚠️ AVISO: Passou (pode ser vulnerável) -', data.message);
    results.push({
        test: extremeTests[currentTest].name,
        status: 'PASSOU (RISCO)',
        message: data.message
    });
    
    currentTest++;
    setTimeout(runNextTest, 100);
});

socket.on('createError', (data) => {
    console.log('✅ SEGURO: Bloqueado corretamente -', data.message);
    results.push({
        test: extremeTests[currentTest].name,
        status: 'BLOQUEADO (SEGURO)',
        message: data.message
    });
    
    currentTest++;
    setTimeout(runNextTest, 100);
});

function showResults() {
    console.log('\n📊 RESULTADOS DOS TESTES EXTREMOS:');
    
    const safe = results.filter(r => r.status.includes('SEGURO')).length;
    const risky = results.filter(r => r.status.includes('RISCO')).length;
    
    console.log(`✅ Testes seguros (bloqueados): ${safe}`);
    console.log(`⚠️ Testes arriscados (passaram): ${risky}`);
    
    if (risky > 0) {
        console.log('\n🚨 TESTES ARRISCADOS:');
        results.filter(r => r.status.includes('RISCO')).forEach((test, i) => {
            console.log(`${i + 1}. ${test.test}: ${test.message}`);
        });
    }
    
    const securityScore = (safe / results.length * 100).toFixed(1);
    console.log(`\n🛡️ Pontuação de segurança: ${securityScore}%`);
    console.log('🎯 STATUS:', securityScore >= 80 ? '✅ SEGURO' : '❌ VULNERÁVEL');
    
    socket.disconnect();
    process.exit(securityScore >= 80 ? 0 : 1);
}

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout do teste');
    showResults();
}, 20000);
