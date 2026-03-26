// Add Mob Movement Debug
// Adiciona logs detalhados para debug do movimento dos mobs

const fs = require('fs');
const path = require('path');

console.log('🔍 Adicionando Debug de Movimento dos Mobs\n');

function addMobMovementDebug() {
    const serverPath = path.join(__dirname, '../server/server-simple.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server-simple.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Encontrar a seção de IA dos mobs
    const aiSection = `startMobAI() {
        console.log('🤖 Starting Mob AI...');
        
        setInterval(() => {
            this.mobs.forEach((mob, mobId) => {`;
    
    const enhancedAI = `startMobAI() {
        console.log('🤖 Starting Mob AI...');
        
        setInterval(() => {
            console.log('🔄 AI Update - Players:', this.players.size, 'Mobs:', this.mobs.size);
            
            this.mobs.forEach((mob, mobId) => {
                console.log(\`🤖 Processing mob \${mob.name} at (\${mob.x}, \${mob.y})\`);
                
                // Simple AI: move towards nearest player
                let nearestPlayer = null;
                let minDistance = Infinity;
                
                this.players.forEach(player => {
                    const dx = player.x - mob.x;
                    const dy = player.y - mob.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    console.log(\`📏 Distance to player \${player.name}: \${distance.toFixed(2)}px\`);
                    
                    if (distance < minDistance && distance < 400) {
                        minDistance = distance;
                        nearestPlayer = player;
                        console.log(\`🎯 Nearest player found: \${player.name} at \${distance.toFixed(2)}px\`);
                    }
                });
                
                if (nearestPlayer && minDistance > 30) {
                    const dx = nearestPlayer.x - mob.x;
                    const dy = nearestPlayer.y - mob.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    const moveX = (dx / distance) * (mob.speed || 2);
                    const moveY = (dy / distance) * (mob.speed || 2);
                    
                    const oldX = mob.x;
                    const oldY = mob.y;
                    
                    mob.x += moveX;
                    mob.y += moveY;
                    
                    console.log(\`🏃 \${mob.name} moving from (\${oldX.toFixed(1)}, \${oldY.toFixed(1)}) to (\${mob.x.toFixed(1)}, \${mob.y.toFixed(1)})\`);
                    
                    // Emitir update para todos os jogadores
                    this.io.emit('mobUpdate', { 
                        id: mobId, 
                        x: mob.x, 
                        y: mob.y,
                        name: mob.name,
                        type: mob.type,
                        hp: mob.hp,
                        maxHp: mob.maxHp,
                        color: mob.color
                    });
                    
                    console.log(\`📡 Emitted mobUpdate for \${mob.name}\`);
                } else {
                    console.log(\`⏸️ \${mob.name} not moving - nearestPlayer: \${nearestPlayer ? nearestPlayer.name : 'none'}, distance: \${minDistance.toFixed(2)}px\`);
                    
                    // Emitir update mesmo se não se mover (para manter sincronizado)
                    this.io.emit('mobUpdate', { 
                        id: mobId, 
                        x: mob.x, 
                        y: mob.y,
                        name: mob.name,
                        type: mob.type,
                        hp: mob.hp,
                        maxHp: mob.maxHp,
                        color: mob.color
                    });
                }
            });
        }, 1000); // Update every second`;
    
    if (serverContent.includes(aiSection)) {
        serverContent = serverContent.replace(aiSection, enhancedAI);
        
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ Debug de movimento dos mobs adicionado');
        console.log('🔍 Logs detalhados serão exibidos no console do servidor');
        return true;
    } else {
        console.log('⚠️ Seção de IA não encontrada ou já foi modificada');
        return false;
    }
}

// Executar
console.log('🎯 Add Mob Movement Debug v0.4.0');
console.log('====================================\n');

const success = addMobMovementDebug();

if (success) {
    console.log('\n🔄 Reinicie o servidor para ver os logs detalhados:');
    console.log('   taskkill /f /im node.exe');
    console.log('   node server/server-simple.js');
    
    console.log('\n🔍 Logs que aparecerão:');
    console.log('   🤖 AI Update - Players: X, Mobs: Y');
    console.log('   🤖 Processing mob NAME at (X, Y)');
    console.log('   📏 Distance to player NAME: XX.XXpx');
    console.log('   🎯 Nearest player found: NAME at XX.XXpx');
    console.log('   🏃 NAME moving from (X, Y) to (X, Y)');
    console.log('   📡 Emitted mobUpdate for NAME');
    console.log('   ⏸️ NAME not moving - reason');
} else {
    console.log('\n❌ Falha ao adicionar debug');
}

console.log('\n✅ Script concluído!');
