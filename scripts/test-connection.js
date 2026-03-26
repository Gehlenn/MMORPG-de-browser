// Test Connection Script
// Testa conexão WebSocket e login

const io = require('socket.io-client');

console.log('🔧 Testando Conexão WebSocket\n');

function testConnection() {
    const socket = io('http://localhost:3000');
    
    socket.on('connect', () => {
        console.log('✅ Conectado ao servidor');
        
        // Tentar login
        socket.emit('login', {
            username: 'testuser',
            character: {
                name: 'Test Player',
                class: 'warrior',
                level: 1
            }
        });
        
        console.log('📤 Login enviado');
    });
    
    socket.on('login_success', (data) => {
        console.log('✅ Login bem sucedido:', data);
        
        // Enviar movimento para ativar mobs
        socket.emit('playerMove', {
            x: 400,
            y: 300
        });
        
        console.log('📤 Posição do jogador enviada');
    });
    
    socket.on('login_error', (error) => {
        console.error('❌ Erro no login:', error);
    });
    
    socket.on('mobSpawn', (mob) => {
        console.log('👾 Mob spawn recebido:', mob.name);
    });
    
    socket.on('mobUpdate', (mob) => {
        console.log('🔄 Mob update recebido:', mob.name, 'at (' + mob.x + ', ' + mob.y + ')');
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Desconectado do servidor');
    });
    
    // Timeout
    setTimeout(() => {
        console.log('⏰ Timeout - fechando conexão');
        socket.disconnect();
        process.exit(0);
    }, 10000);
}

// Executar
console.log('🎯 Test Connection v0.1.0');
console.log('===============================\n');

testConnection();
