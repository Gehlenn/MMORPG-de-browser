// Teste completo end-to-end do fluxo de dados
const io = require('socket.io-client');

console.log('🔍 VARREDURA V3: Teste end-to-end completo...');

const socket = io('http://localhost:3002');

let testData = {
    account: null,
    character: null,
    errors: [],
    flowSteps: []
};

function logStep(step, status, details = '') {
    const stepData = { step, status, details, timestamp: new Date().toISOString() };
    testData.flowSteps.push(stepData);
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${step}${details ? ': ' + details : ''}`);
}

socket.on('connect', () => {
    logStep('Conexão', 'PASS', 'Socket conectado');
    testAccountCreation();
});

function testAccountCreation() {
    logStep('Criando Conta', 'TEST');
    
    const accountData = {
        username: 'E2EUser' + Date.now(),
        email: 'e2e@test.com',
        password: 'e2epassword123'
    };
    
    socket.emit('createAccount', accountData);
    testData.account = accountData;
}

socket.on('createSuccess', (data) => {
    if (!testData.account.created) {
        testData.account.created = true;
        logStep('Criar Conta', 'PASS', data.message);
        testLogin();
    } else if (!testData.character.created) {
        testData.character.created = true;
        logStep('Criar Personagem', 'PASS', data.message);
        testCompleteFlow();
    }
});

socket.on('createError', (data) => {
    const step = testData.character.created ? 'Criar Personagem' : 'Criar Conta';
    logStep(step, 'FAIL', data.message);
    testData.errors.push({ step, error: data.message, code: data.code });
});

function testLogin() {
    logStep('Login', 'TEST');
    
    socket.emit('login', {
        username: testData.account.username,
        password: testData.account.password
    });
}

socket.on('loginSuccess', (data) => {
    logStep('Login', 'PASS', 'Autenticado com sucesso');
    testData.account.loggedIn = true;
    testData.account.sessionData = data;
    
    // Aguardar um pouco antes de criar personagem
    setTimeout(testCharacterCreation, 500);
});

socket.on('loginError', (data) => {
    logStep('Login', 'FAIL', data.message);
    testData.errors.push({ step: 'Login', error: data.message, code: data.code });
});

function testCharacterCreation() {
    logStep('Criando Personagem', 'TEST');
    
    const characterData = {
        name: 'E2EHero' + Date.now(),
        class: 'recruta',
        race: 'human'
    };
    
    socket.emit('createCharacter', characterData);
    testData.character = { ...characterData };
}

function testCompleteFlow() {
    logStep('Fluxo Completo', 'TEST', 'Verificando consistência de dados');
    
    // Verificar se todos os dados estão consistentes
    const checks = [
        {
            name: 'Dados da conta',
            check: () => testData.account && testData.account.created && testData.account.loggedIn
        },
        {
            name: 'Dados do personagem',
            check: () => testData.character && testData.character.created
        },
        {
            name: 'Sem erros críticos',
            check: () => testData.errors.filter(e => e.code === 'DUPLICATE_KEY').length === 0
        }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
        const passed = check.check();
        logStep(`Verificação: ${check.name}`, passed ? 'PASS' : 'FAIL');
        if (!passed) allPassed = false;
    });
    
    logStep('Resultado Final', allPassed ? 'PASS' : 'FAIL', allPassed ? 'Fluxo completo funcional' : 'Problemas encontrados');
    
    showDetailedResults();
}

function showDetailedResults() {
    console.log('\n📊 RESULTADO DETALHADO DO FLUXO END-TO-END:');
    
    const passed = testData.flowSteps.filter(s => s.status === 'PASS').length;
    const failed = testData.flowSteps.filter(s => s.status === 'FAIL').length;
    const total = testData.flowSteps.length;
    
    console.log(`\n📈 ESTATÍSTICAS:`);
    console.log(`✅ Passaram: ${passed}/${total}`);
    console.log(`❌ Falharam: ${failed}/${total}`);
    console.log(`📊 Taxa de sucesso: ${(passed/total*100).toFixed(1)}%`);
    
    if (testData.errors.length > 0) {
        console.log(`\n🚨 ERROS ENCONTRADOS:`);
        testData.errors.forEach((error, i) => {
            console.log(`${i+1}. ${error.step}: ${error.error} (${error.code})`);
        });
    }
    
    console.log(`\n🕐 LINHA DO TEMPO:`);
    testData.flowSteps.forEach((step, i) => {
        const time = new Date(step.timestamp).toLocaleTimeString();
        console.log(`${i+1}. [${time}] ${step.step}: ${step.status}`);
    });
    
    const successRate = passed / total;
    console.log(`\n🎯 STATUS FINAL: ${successRate >= 0.8 ? '✅ FUNCIONAL' : '❌ PROBLEMAS'}`);
    
    socket.disconnect();
    process.exit(successRate >= 0.8 ? 0 : 1);
}

socket.on('disconnect', () => {
    logStep('Desconexão', 'INFO', 'Socket desconectado');
});

// Timeout
setTimeout(() => {
    logStep('Timeout', 'FAIL', 'Teste não concluído no tempo esperado');
    socket.disconnect();
    process.exit(1);
}, 20000);
