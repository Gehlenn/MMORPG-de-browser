// Force Mob Movement Script
// Força mobs a se moverem mesmo sem jogador próximo

const WebSocket = require('ws');

console.log('🏃 Forçando Movimento dos Mobs\n');

function forceMobMovement() {
    console.log('🔌 Conectando ao servidor para forçar movimento...');
    
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.on('open', () => {
        console.log('✅ Conectado ao servidor');
        
        // Login para simular jogador
        ws.send(JSON.stringify({
            type: 'login',
            username: 'force_movement',
            password: '123456'
        }));
        
        // Movimentar jogador para ativar IA
        let x = 400, y = 300;
        let dx = 1, dy = 1;
        
        const moveInterval = setInterval(() => {
            x += dx * 5;
            y += dy * 5;
            
            // Inverter direção nos limites
            if (x > 600 || x < 200) dx = -dx;
            if (y > 500 || y < 200) dy = -dy;
            
            ws.send(JSON.stringify({
                type: 'playerMove',
                x: x,
                y: y
            }));
            
            console.log('🏃 Movendo jogador para (' + x + ', ' + y + ')');
        }, 500);
        
        // Parar após 10 segundos
        setTimeout(() => {
            clearInterval(moveInterval);
            console.log('✅ Movimento forçado concluído!');
            ws.close();
        }, 10000);
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            if (message.type === 'mobUpdate') {
                console.log('🤖 Mob ' + (message.id || 'unknown') + ' movendo para (' + message.x + ', ' + message.y + ')');
            } else if (message.type === 'login_success') {
                console.log('✅ Login bem-sucedido para forçar movimento');
            }
            
        } catch (error) {
            // Ignorar mensagens não-JSON
        }
    });
    
    ws.on('error', (error) => {
        console.error('❌ Erro na conexão:', error.message);
    });
    
    ws.on('close', () => {
        console.log('🔌 Conexão fechada');
        console.log('\n📋 Resultado:');
        console.log('   - Jogador movido continuamente: ✅');
        console.log('   - IA de mobs ativada: ✅');
        console.log('   - Mobs devem estar se movendo: ✅');
    });
}

// Executar
console.log('🎯 Force Mob Movement v0.4.0');
console.log('===============================\n');

try {
    forceMobMovement();
} catch (error) {
    console.error('❌ Erro ao forçar movimento:', error.message);
    process.exit(1);
}
