// Increase Mob Aggro Range Script
// Aumenta a distância de detecção dos mobs para 400 pixels

const fs = require('fs');
const path = require('path');

console.log('🎯 Aumentando Distância de Aggro dos Mobs\n');

function increaseMobAggro() {
    const serverPath = path.join(__dirname, '../server/server-simple.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server-simple.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Encontrar a linha com a distância de aggro
    const oldDistance = 'if (distance < minDistance && distance < 200)';
    const newDistance = 'if (distance < minDistance && distance < 400)';
    
    if (serverContent.includes(oldDistance)) {
        serverContent = serverContent.replace(oldDistance, newDistance);
        
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ Distância de aggro aumentada de 200 para 400 pixels');
        console.log('🎮 Mobs agora detectarão jogadores a 400px de distância');
        return true;
    } else {
        console.log('⚠️ Distância de aggro já foi alterada ou não encontrada');
        return false;
    }
}

// Executar
console.log('🎯 Increase Mob Aggro v0.4.0');
console.log('===============================\n');

const success = increaseMobAggro();

if (success) {
    console.log('\n🔄 Reinicie o servidor para aplicar as mudanças:');
    console.log('   taskkill /f /im node.exe');
    console.log('   node server/server-simple.js');
    
    console.log('\n🎮 Após reiniciar:');
    console.log('   1. Mobs detectarão jogadores a 400px');
    console.log('   2. Mobs começarão a se mover mais cedo');
    console.log('   3. Gameplay mais dinâmico');
} else {
    console.log('\n❌ Falha ao alterar distância de aggro');
}

console.log('\n✅ Script concluído!');
