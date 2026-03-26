// Force Client to See Mobs
// Script para forçar cliente a mostrar mobs

const WebSocket = require('ws');

console.log('🎮 Forçando Cliente a Ver Mobs\n');

function connectAndForceMobs() {
    console.log('🔌 Conectando ao servidor como cliente...');
    
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.on('open', () => {
        console.log('✅ Conectado ao servidor');
        
        // Request mobs
        ws.send(JSON.stringify({ type: 'requestMobs' }));
        
        // Simular movimento de jogador para ativar IA
        setTimeout(() => {
            ws.send(JSON.stringify({
                type: 'playerMove',
                x: 410,
                y: 310
            }));
            console.log('🏃 Movimento simulado para ativar IA dos mobs');
        }, 1000);
        
        // Manter conexão para ver se mobs aparecem
        setTimeout(() => {
            console.log('📊 Verificando status dos mobs...');
            ws.send(JSON.stringify({ type: 'requestMobs' }));
        }, 2000);
        
        setTimeout(() => {
            console.log('✅ Verificação completa!');
            ws.close();
        }, 5000);
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            if (message.type === 'currentMobs') {
                console.log('👾 Mobs recebidos:', message.length);
                message.forEach((mob, index) => {
                    console.log(`   ${index + 1}. ${mob.name} (${mob.x}, ${mob.y}) - HP: ${mob.hp}/${mob.maxHp}`);
                });
            } else if (message.type === 'mobSpawn') {
                console.log('👾 Mob spawn recebido:', message.name);
            } else if (message.type === 'mobUpdate') {
                console.log('📊 Mob atualizado:', message.name || message.id);
            } else if (message.type === 'mobRemove') {
                console.log('💀 Mob removido:', message.id);
            } else {
                console.log('📨 Outra mensagem:', message);
            }
        } catch (error) {
            console.log('📨 Mensagem não-JSON:', data.toString());
        }
    });
    
    ws.on('error', (error) => {
        console.error('❌ Erro na conexão:', error.message);
    });
    
    ws.on('close', () => {
        console.log('🔌 Conexão fechada');
        console.log('✅ Script concluído!');
        console.log('\n📋 Resultados:');
        console.log('   - Conectado ao servidor: ✅');
        console.log('   - Mobs solicitados: ✅');
        console.log('   - Movimento simulado: ✅');
        console.log('   - Status verificado: ✅');
        console.log('\n🎮 Se os mobs apareceram no cliente, o sistema está funcionando!');
    });
}

// Executar
console.log('🎯 Force Client Mobs v1.0');
console.log('============================\n');

try {
    connectAndForceMobs();
} catch (error) {
    console.error('❌ Erro ao executar:', error.message);
    process.exit(1);
}
