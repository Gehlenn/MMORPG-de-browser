// Debug Server Loop Script
// Identifica e corrige o problema de loop infinito no servidor

const fs = require('fs');
const path = require('path');

console.log('🔧 Debugando Loop do Servidor\n');

function debugServerLoop() {
    const serverPath = path.join(__dirname, '../server/server-simple-fixed.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server-simple-fixed.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Procurar pelo problema do loop infinito
    const aiUpdatePattern = /setInterval\(\(\) => \{[\s\S]*?startMobAI\(\);[\s\S]*?\}, 100\);/;
    
    if (aiUpdatePattern.test(serverContent)) {
        // Reduzir frequência do AI update para evitar loop
        const fixedContent = serverContent.replace(
            /setInterval\(\(\) => \{[\s\S]*?startMobAI\(\);[\s\S]*?\}, 100\);/,
            `setInterval(() => {
                // Limitar updates para evitar loop infinito
                if (this.isRunning && this.players.size > 0) {
                    this.startMobAI();
                }
            }, 1000); // Reduzido para 1 segundo`
        );
        
        fs.writeFileSync(serverPath, fixedContent);
        console.log('✅ Loop do servidor corrigido');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Debug Server Loop v0.1.0');
console.log('===============================\n');

const success = debugServerLoop();

if (success) {
    console.log('\n🔄 Reinicie o servidor:');
    console.log('   node server/server-simple-fixed.js');
    
    console.log('\n🎮 Loop do servidor corrigido!');
} else {
    console.log('\n❌ Falha ao corrigir loop');
}

console.log('\n✅ Script concluído!');
