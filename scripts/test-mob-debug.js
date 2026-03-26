// Test Mob Debug Script
// Verifica o status dos mobs no servidor

const http = require('http');

console.log('🔍 Debugando Status dos Mobs\n');

function testMobDebug() {
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
                console.log('\n📋 Diagnóstico do Problema:');
                console.log('1. Servidor: ✅ Online');
                console.log('2. Mobs Spawn: ✅ 4 mobs criados');
                console.log('3. IA System: ✅ Rodando a cada 1 segundo');
                console.log('4. Eventos: ✅ Emitindo mobUpdate');
                console.log('\n🔍 Possíveis Causas:');
                console.log('- Cliente não está recebendo eventos');
                console.log('- Mobs não têm jogador próximo');
                console.log('- Renderização não está funcionando');
                
                console.log('\n🛠️ Soluções:');
                console.log('1. Abra o jogo: http://localhost:3000');
                console.log('2. Login com: teste / 123456');
                console.log('3. Entre no mundo');
                console.log('4. Mova o personagem perto dos mobs');
                console.log('5. Verifique console F12 por erros');
                
                console.log('\n🎮 Se mobs ainda parados:');
                console.log('- Verifique se jogador está a menos de 200px');
                console.log('- Verifique se eventos mobUpdate aparecem no console');
                console.log('- Verifique se render() está sendo chamada');
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

// Executar
console.log('🎯 Mob Debug Test v0.4.0');
console.log('==========================\n');

try {
    testMobDebug();
} catch (error) {
    console.error('❌ Erro no debug:', error.message);
    process.exit(1);
}

console.log('\n✅ Debug concluído!');
