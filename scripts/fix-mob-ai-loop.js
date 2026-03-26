// Fix Mob AI Loop Script
// Corrige o problema de loop infinito no AI dos mobs

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Loop do Mob AI\n');

function fixMobAILoop() {
    const serverPath = path.join(__dirname, '../server/server-simple-fixed.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server-simple-fixed.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Procurar pelo startMobAI function
    const startMobAIPattern = /startMobAI\(\) \{[\s\S]*?setInterval\(\(\) => \{[\s\S]*?\}, 100\);[\s\S]*?\}/;
    
    if (startMobAIPattern.test(serverContent)) {
        // Adicionar verificação para evitar loop quando não há jogadores
        const fixedContent = serverContent.replace(
            startMobAIPattern,
            `startMobAI() {
        if (!this.isRunning) return;
        
        console.log('🔄 AI Update - Players: ' + this.players.size + ', Mobs: ' + this.mobs.size);
        
        setInterval(() => {
            if (!this.isRunning) return;
            
            // Só processar mobs se houver jogadores conectados
            if (this.players.size === 0) {
                return;
            }
            
            // Processar cada mob
            this.mobs.forEach((mob, mobId) => {
                // Encontrar jogador mais próximo
                let nearestPlayer = null;
                let minDistance = Infinity;
                
                this.players.forEach((player, playerId) => {
                    const distance = Math.sqrt(
                        Math.pow(mob.x - player.x, 2) + 
                        Math.pow(mob.y - player.y, 2)
                    );
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestPlayer = player;
                    }
                });
                
                // Se encontrou jogador e está dentro do alcance
                if (nearestPlayer && minDistance < 400) {
                    // Calcular direção
                    const dx = nearestPlayer.x - mob.x;
                    const dy = nearestPlayer.y - mob.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Normalizar e aplicar velocidade
                    const speed = 0.5; // Reduzido para evitar movimentos rápidos
                    const vx = (dx / distance) * speed;
                    const vy = (dy / distance) * speed;
                    
                    // Atualizar posição
                    mob.x += vx;
                    mob.y += vy;
                    
                    // Enviar atualização para clientes
                    this.io.emit('mobUpdate', {
                        id: mobId,
                        x: mob.x,
                        y: mob.y
                    });
                } else {
                    // Enviar posição atual mesmo se não estiver se movendo
                    this.io.emit('mobUpdate', {
                        id: mobId,
                        x: mob.x,
                        y: mob.y
                    });
                }
            });
        }, 1000); // Reduzido para 1 segundo
    }`
        );
        
        fs.writeFileSync(serverPath, fixedContent);
        console.log('✅ Loop do Mob AI corrigido');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Fix Mob AI Loop v0.1.0');
console.log('===============================\n');

const success = fixMobAILoop();

if (success) {
    console.log('\n🔄 Reinicie o servidor:');
    console.log('   node server/server-simple-fixed.js');
    
    console.log('\n🎮 Loop do Mob AI corrigido!');
} else {
    console.log('\n❌ Falha ao corrigir loop');
}

console.log('\n✅ Script concluído!');
