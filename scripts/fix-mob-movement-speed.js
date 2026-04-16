// Fix Mob Movement Speed Script
// Corrige velocidade e spawn dos mobs

const fs = require('fs');
const path = require('path');

console.log('🏃 Corrigindo Velocidade e Spawn dos Mobs\n');

function fixMobMovementSpeed() {
    const serverPath = path.join(__dirname, '../server/server-simple-fixed.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server-simple-fixed.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Encontrar a seção de spawn dos mobs
    const mobSpawnSection = `const mobTypes = [
            { type: 'goblin', name: 'Goblin Selvagem', x: 350, y: 250, hp: 50, damage: 10, color: '#228B22' },
            { type: 'wolf', name: 'Lobo Feroz', x: 450, y: 350, hp: 75, damage: 15, color: '#696969' },
            { type: 'orc', name: 'Orc Guerreiro', x: 400, y: 300, hp: 100, damage: 20, color: '#8B4513' },
            { type: 'slime', name: 'Slime Gelatinoso', x: 500, y: 400, hp: 30, damage: 5, color: '#90EE90' }
        ];`;
    
    const enhancedMobSpawn = `const mobTypes = [
            { type: 'goblin', name: 'Goblin Selvagem', x: 200, y: 200, hp: 50, damage: 10, color: '#228B22' },
            { type: 'wolf', name: 'Lobo Feroz', x: 600, y: 200, hp: 75, damage: 15, color: '#696969' },
            { type: 'orc', name: 'Orc Guerreiro', x: 200, y: 400, hp: 100, damage: 20, color: '#8B4513' },
            { type: 'slime', name: 'Slime Gelatinoso', x: 600, y: 400, hp: 30, damage: 5, color: '#90EE90' }
        ];`;
    
    // Encontrar a seção de movimento dos mobs
    const movementSection = `const moveX = (dx / distance) * (mob.speed || 2);
                    const moveY = (dy / distance) * (mob.speed || 2);`;
    
    const enhancedMovement = `const moveX = (dx / distance) * (mob.speed || 4);
                    const moveY = (dy / distance) * (mob.speed || 4);`;
    
    // Encontrar a seção de distância mínima
    const distanceSection = `if (nearestPlayer && minDistance > 30) {`;
    
    const enhancedDistance = `if (nearestPlayer && minDistance > 50) {`;
    
    // Encontrar o intervalo da IA
    const intervalSection = `}, 1000); // Update every second`;
    
    const enhancedInterval = `}, 100); // Update every 100ms (10x faster)`;
    
    let changes = 0;
    
    // Aplicar mudanças
    if (serverContent.includes(mobSpawnSection)) {
        serverContent = serverContent.replace(mobSpawnSection, enhancedMobSpawn);
        changes++;
        console.log('✅ Posição dos mobs corrigida');
    }
    
    if (serverContent.includes(movementSection)) {
        serverContent = serverContent.replace(movementSection, enhancedMovement);
        changes++;
        console.log('✅ Velocidade dos mobs aumentada para 4');
    }
    
    if (serverContent.includes(distanceSection)) {
        serverContent = serverContent.replace(distanceSection, enhancedDistance);
        changes++;
        console.log('✅ Distância mínima aumentada para 50px');
    }
    
    if (serverContent.includes(intervalSection)) {
        serverContent = serverContent.replace(intervalSection, enhancedInterval);
        changes++;
        console.log('✅ IA atualizada para 10x mais rápida');
    }
    
    if (changes > 0) {
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ ' + changes + ' mudanças aplicadas com sucesso');
        return true;
    } else {
        console.log('⚠️ Nenhuma mudança necessária');
        return false;
    }
}

// Executar
console.log('🎯 Fix Mob Movement Speed v0.4.0');
console.log('===================================\n');

const success = fixMobMovementSpeed();

if (success) {
    console.log('\n🔄 Reinicie o servidor para aplicar as mudanças:');
    console.log('   taskkill /f /im node.exe');
    console.log('   node server/server-simple-fixed.js');
    
    console.log('\n🎮 Melhorias aplicadas:');
    console.log('   📍 Mobs spawnados nos cantos do mapa');
    console.log('   🏃 Velocidade aumentada de 2 para 4');
    console.log('   📏 Distância mínima aumentada de 30 para 50px');
    console.log('   ⚡ IA 10x mais rápida (100ms vs 1000ms)');
    console.log('   ⚔️ Mobs agora se movem rapidamente e podem ser atacados');
} else {
    console.log('\n❌ Falha ao aplicar mudanças');
}

console.log('\n✅ Script concluído!');
