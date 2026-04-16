// Fix Server Handlers Script
// Corrige handlers duplicados e problemas no servidor

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Handlers do Servidor\n');

function fixServerHandlers() {
    const serverPath = path.join(__dirname, '../server/server.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // 1. Remover handlers duplicados de login e createAccount se existirem
    console.log('📝 Verificando handlers duplicados...');
    
    // Verificar se há múltiplos handlers de login
    const loginMatches = serverContent.match(/socket\.on\("login"/g);
    if (loginMatches && loginMatches.length > 1) {
        console.log(`⚠️ Encontrados ${loginMatches.length} handlers de login - mantendo apenas o primeiro`);
        
        // Remover handlers duplicados (manter apenas o primeiro)
        const firstLoginIndex = serverContent.indexOf('socket.on("login"');
        const remainingContent = serverContent.substring(firstLoginIndex);
        
        // Encontrar o fim do primeiro handler
        let braceCount = 0;
        let endIndex = -1;
        let inString = false;
        let stringChar = '';
        
        for (let i = 0; i < remainingContent.length; i++) {
            const char = remainingContent[i];
            
            if (inString) {
                if (char === stringChar && remainingContent[i-1] !== '\\') {
                    inString = false;
                }
                continue;
            }
            
            if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
                continue;
            }
            
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endIndex = firstLoginIndex + i + 1;
                    break;
                }
            }
        }
        
        if (endIndex !== -1) {
            const firstHandler = serverContent.substring(firstLoginIndex, endIndex);
            const restContent = serverContent.substring(endIndex);
            
            // Remover outros handlers de login
            const cleanedRest = restContent.replace(/socket\.on\("login",[^}]+}\);?/g, '');
            
            serverContent = serverContent.substring(0, firstLoginIndex) + firstHandler + cleanedRest;
            console.log('✅ Handlers de login duplicados removidos');
        }
    }
    
    // 2. Adicionar método sendWorldInit se não existir
    if (!serverContent.includes('sendWorldInit')) {
        console.log('📝 Adicionando método sendWorldInit...');
        
        const sendWorldInitMethod = `
    sendWorldInit(socket, player) {
        const worldData = {
            playerId: socket.id,
            entities: []
        };
        
        // Add other players
        for (const [otherId, otherPlayer] of this.players) {
            if (otherId !== socket.id) {
                worldData.entities.push({
                    id: otherId,
                    type: 'player',
                    name: otherPlayer.name,
                    x: otherPlayer.x,
                    y: otherPlayer.y,
                    health: otherPlayer.hp || 100,
                    maxHealth: 100
                });
            }
        }
        
        // Add mobs to world data
        for (const [mobId, mob] of this.mobs) {
            worldData.entities.push({
                id: mob.id || mobId,
                type: 'mob',
                name: mob.name || 'Mob',
                x: mob.x || 400,
                y: mob.y || 300,
                health: mob.health || 50,
                maxHealth: mob.maxHealth || 50
            });
        }
        
        socket.emit('world_init', worldData);
        console.log('🌍 World init sent to player:', socket.id);
    }
    
    `;
        
        // Adicionar método antes do último método da classe
        const lastMethodIndex = serverContent.lastIndexOf('    }');
        if (lastMethodIndex !== -1) {
            serverContent = serverContent.substring(0, lastMethodIndex) + sendWorldInitMethod + '\n    }';
            console.log('✅ Método sendWorldInit adicionado');
        }
    }
    
    // 3. Corrigir handlers para usar sendWorldInit
    if (serverContent.includes('socket.emit("login_success"') && !serverContent.includes('this.sendWorldInit')) {
        console.log('📝 Atualizando handler de login para usar sendWorldInit...');
        
        serverContent = serverContent.replace(
            /socket\.emit\("login_success", player\);?\s*console\.log\("✅ Login successful:", data\.username\);?/g,
            `this.sendWorldInit(socket, player);\n            console.log('✅ Login successful:', data.username);`
        );
        
        console.log('✅ Handler de login atualizado');
    }
    
    // Salvar arquivo
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Arquivo server.js salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Fix Server Handlers v0.1.0');
console.log('===============================\n');

const success = fixServerHandlers();

if (success) {
    console.log('\n🎮 Handlers do servidor corrigidos!');
    console.log('📝 Handlers duplicados removidos');
    console.log('📝 sendWorldInit implementado');
    console.log('📝 Login atualizado para enviar mundo');
    console.log('📝 Mobs incluídos no world_init');
} else {
    console.log('\n❌ Falha ao corrigir handlers');
}

console.log('\n✅ Script concluído!');
