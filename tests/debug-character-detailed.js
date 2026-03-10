// Debug detalhado da criação de personagem
const io = require('socket.io-client');

console.log('🔍 DEBUG DETALHADO: Criação de personagem...');

const socket = io('http://localhost:3002');

socket.on('connect', () => {
    console.log('✅ Conectado');
    
    // Login direto
    socket.emit('login', {
        username: 'komodo1212',
        password: 'password123'
    });
});

socket.on('loginSuccess', (data) => {
    console.log('✅ Login successful');
    
    // Testar diferentes dados de personagem
    const testCases = [
        {
            name: 'TestChar1',
            class: 'recruta',
            race: 'human'
        },
        {
            name: 'TestChar2',
            class: 'warrior',
            race: 'elf'
        },
        {
            name: 'SimpleHero',
            class: 'recruta',
            race: 'human'
        }
    ];
    
    // Testar primeiro caso
    const characterData = testCases[0];
    console.log('🧪 Enviando dados:', JSON.stringify(characterData, null, 2));
    
    socket.emit('createCharacter', characterData);
});

socket.on('loginError', (data) => {
    console.log('❌ Erro no login:', data.message);
    
    // Criar conta se não existir
    socket.emit('createAccount', {
        username: 'komodo1212',
        email: 'komodo1212@test.com',
        password: 'password123'
    });
});

socket.on('createSuccess', (data) => {
    console.log('✅ Sucesso na criação:', data.message);
    
    // Se foi conta criada, tentar login novamente
    if (data.message.includes('Conta criada')) {
        setTimeout(() => {
            socket.emit('login', {
                username: 'komodo1212',
                password: 'password123'
            });
        }, 1000);
    } else if (data.message.includes('Personagem criado')) {
        console.log('🎉 Personagem criado com sucesso!');
        setTimeout(() => {
            socket.disconnect();
        }, 1000);
    }
});

socket.on('createError', (data) => {
    console.log('❌ Erro detalhado na criação:');
    console.log('   Mensagem completa:', JSON.stringify(data, null, 2));
    
    // Tentar entender o tipo de erro
    if (data.code === 'UNKNOWN_ERROR') {
        console.log('🔍 Erro desconhecido - possíveis causas:');
        console.log('   1. Erro no banco de dados');
        console.log('   2. Erro na validação');
        console.log('   3. Erro no ErrorCatalog');
        console.log('   4. Dados mal formatados');
        
        // Tentar criar personagem com dados mínimos
        console.log('🧪 Tentando com dados mínimos...');
        setTimeout(() => {
            socket.emit('createCharacter', {
                name: 'Minimal',
                class: 'recruta',
                race: 'human'
            });
        }, 2000);
    }
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
});

setTimeout(() => {
    console.log('⏰ Timeout final');
    socket.disconnect();
}, 15000);
