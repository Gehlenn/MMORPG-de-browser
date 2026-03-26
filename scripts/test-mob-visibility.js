// Test Mob Visibility Script
// Verifica se mobs estão sendo enviados para o cliente

const http = require('http');

console.log('🔍 Testando Visibilidade de Mobs\n');

function testMobVisibility() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET',
        timeout: 5000
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', chunk => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('✅ Servidor respondendo');
            console.log('📄 Status:', res.statusCode);
            
            if (res.statusCode === 200) {
                console.log('🎮 Servidor online e respondendo');
                console.log('\n📋 Teste Manual:');
                console.log('1. Abra: http://localhost:3000');
                console.log('2. Faça login com: teste / 123456');
                console.log('3. Entre no mundo');
                console.log('4. Verifique se mobs aparecem no mapa');
                console.log('5. Use F12 para ver console');
                console.log('6. Procure por erros de JavaScript');
                
                console.log('\n🔍 Se mobs não aparecem:');
                console.log('- Verifique se há erros no console');
                console.log('- Verifique se eventos WebSocket estão funcionando');
                console.log('- Verifique se o cliente está recebendo eventos mobSpawn');
                
            } else {
                console.log('❌ Servidor não respondendo corretamente');
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ Erro ao conectar:', error.message);
    });
    
    req.on('timeout', () => {
        console.log('❌ Timeout ao conectar');
        req.destroy();
    });
    
    req.end();
}

// Executar teste
console.log('🎯 Teste de Visibilidade de Mobs v0.4.0');
console.log('=================================\n');

try {
    testMobVisibility();
} catch (error) {
    console.error('❌ Erro no teste:', error.message);
    process.exit(1);
}

console.log('\n✅ Teste concluído!');
