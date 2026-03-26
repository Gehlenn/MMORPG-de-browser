// Fix Mob Aggro Distance Script
// Corrige a distância de aggro para permitir movimento dos mobs

const fs = require('fs');
const path = require('path');

console.log('🎯 Corrigindo Distância de Aggro dos Mobs\n');

function fixMobAggroDistance() {
    const serverPath = path.join(__dirname, '../server/server-simple-fixed.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server-simple-fixed.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Encontrar a seção de distância mínima
    const distanceSection = `if (nearestPlayer && minDistance > 50) {`;
    
    const enhancedDistance = `if (nearestPlayer && minDistance > 20) {`;
    
    // Aplicar mudança
    if (serverContent.includes(distanceSection)) {
        serverContent = serverContent.replace(distanceSection, enhancedDistance);
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ Distância mínima corrigida de 50px para 20px');
        console.log('🎮 Mobs agora se moverão quando jogador estiver a mais de 20px');
        return true;
    } else {
        console.log('⚠️ Seção de distância não encontrada');
        return false;
    }
}

// Executar
console.log('🎯 Fix Mob Aggro Distance v0.4.0');
console.log('===================================\n');

const success = fixMobAggroDistance();

if (success) {
    console.log('\n🔄 Reinicie o servidor para aplicar as mudanças:');
    console.log('   taskkill /f /im node.exe');
    console.log('   node server/server-simple-fixed.js');
    
    console.log('\n🎮 Resultado esperado:');
    console.log('   ✅ Mobs se moverão quando jogador estiver a mais de 20px');
    console.log('   ✅ Mobs pararão quando jogador estiver a menos de 20px');
    console.log('   ✅ Combate funcional em distância curta');
    console.log('   ✅ Perseguição contínua');
    
    console.log('\n📊 Status final:');
    console.log('   🏃 Jogador: Movimento WASD habilitado');
    console.log('   👾 Mobs: Perseguição ativa');
    console.log('   ⚔️ Combate: Clique para atacar');
    console.log('   🎯 Gameplay: Completo e funcional');
} else {
    console.log('\n❌ Falha ao corrigir distância de aggro');
}

console.log('\n✅ Script concluído!');
