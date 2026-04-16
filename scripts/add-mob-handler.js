// Add Mob Handler to Server
// Adiciona handlers para spawn e controle de mobs

const fs = require('fs');
const path = require('path');

console.log('👾 Adding Mob Handler to Server\n');

// Socket handlers para mobs
const mobHandlers = `
// Mob System Socket Handlers
socket.on('admin_spawn_mob', (data) => {
    console.log('👾 Admin spawn request:', data);
    
    // Validar dados do mob
    if (!data.id || !data.type || !data.x || !data.y) {
        console.log('❌ Invalid mob data');
        return;
    }
    
    // Criar mob
    const mob = {
        id: data.id,
        type: data.type,
        name: data.name || data.type.charAt(0).toUpperCase() + data.type.slice(1),
        x: data.x,
        y: data.y,
        stats: {
            health: data.health || 50,
            maxHealth: data.maxHealth || 50,
            damage: data.damage || 10,
            defense: data.defense || 5,
            speed: data.speed || 2,
            exp: data.exp || 25
        },
        color: data.color || '#FF0000',
        velocity: { x: 0, y: 0 },
        target: null,
        lastAttack: 0,
        attackCooldown: 0
    };
    
    // Adicionar ao sistema de mobs
    if (global.mobSpawner) {
        global.mobSpawner.mobs.set(data.id, mob);
    }
    
    // Emitir para todos os jogadores
    if (global.io && global.io.emit) {
        global.io.emit('mobSpawn', mob);
        console.log(\`👾 Mob spawned: \${mob.name} at (\${mob.x}, \${mob.y})\`);
    }
});

socket.on('playerMove', (data) => {
    // Atualizar AI de todos os mobs quando jogador se move
    if (global.mobSpawner && data.position) {
        global.mobSpawner.getAllMobs().forEach(mob => {
            global.mobSpawner.updateMobAI(mob.id, data.position);
        });
    }
});

socket.on('attackMob', (data) => {
    const { mobId, damage } = data;
    
    if (global.mobSpawner) {
        const defeated = global.mobSpawner.attackMob(mobId, damage, socket.id);
        
        if (defeated) {
            socket.emit('mobDefeated', { 
                mobId, 
                exp: global.mobSpawner.getMob(mobId)?.stats.exp || 25,
                defeatedBy: socket.id 
            });
        }
    }
});

socket.on('requestMobs', () => {
    // Enviar todos os mobs atuais
    if (global.mobSpawner) {
        const mobs = global.mobSpawner.getAllMobs();
        socket.emit('currentMobs', mobs);
        console.log(\`📨 Sent \${mobs.length} mobs to player \${socket.id}\`);
    }
});
`;

// Adicionar handlers ao servidor
function addMobHandlers() {
    const serverPath = path.join(__dirname, '../server/server.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Encontrar onde adicionar os handlers (dentro de setupPlayerEventHandlers)
    const handlerInsertPoint = serverContent.indexOf('socket.on("login", (data) => {');
    
    if (handlerInsertPoint === -1) {
        console.error('❌ Ponto de inserção não encontrado');
        return false;
    }
    
    // Inserir handlers antes do login handler
    const beforeInsert = serverContent.substring(0, handlerInsertPoint);
    const afterInsert = serverContent.substring(handlerInsertPoint);
    
    const newServerContent = beforeInsert + mobHandlers + '\n\n' + afterInsert;
    
    fs.writeFileSync(serverPath, newServerContent);
    console.log('✅ Mob handlers adicionados ao servidor');
    return true;
}

// Adicionar handler de playerMove ao login
function addPlayerMoveHandler() {
    const serverPath = path.join(__dirname, '../server/server.js');
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Encontrar login handler
    const loginHandlerStart = serverContent.indexOf('socket.on("login", (data) => {');
    const loginHandlerEnd = serverContent.indexOf('})', loginHandlerStart) + 1;
    
    if (loginHandlerStart === -1 || loginHandlerEnd === -1) {
        console.error('❌ Login handler não encontrado');
        return false;
    }
    
    // Inserir playerMove handler após login
    const beforeLogin = serverContent.substring(0, loginHandlerEnd);
    const afterLogin = serverContent.substring(loginHandlerEnd);
    
    const playerMoveHandler = `
            
            socket.on("playerMove", (data) => {
                if (this.players.has(socket.id)) {
                    const player = this.players.get(socket.id);
                    player.x = data.x;
                    player.y = data.y;
                    
                    // Broadcast player movement
                    this.io.emit("playerUpdate", {
                        id: socket.id,
                        x: data.x,
                        y: data.y
                    });
                    
                    // Atualizar AI de mobs
                    if (global.mobSpawner) {
                        global.mobSpawner.getAllMobs().forEach(mob => {
                            global.mobSpawner.updateMobAI(mob.id, { x: data.x, y: data.y });
                        });
                    }
                }
            });`;
    
    const newServerContent = beforeLogin + playerMoveHandler + afterLogin;
    
    fs.writeFileSync(serverPath, newServerContent);
    console.log('✅ Player move handler adicionado');
    return true;
}

// Executar modificações
function main() {
    console.log('🎯 Mob Handler Integration v0.4.0');
    console.log('==================================\n');
    
    // Adicionar mob handlers
    const handlersAdded = addMobHandlers();
    
    // Adicionar player move handler
    const moveHandlerAdded = addPlayerMoveHandler();
    
    if (handlersAdded && moveHandlerAdded) {
        console.log('✅ Todos os handlers de mobs adicionados!');
        console.log('📋 Handlers adicionados:');
        console.log('   - admin_spawn_mob');
        console.log('   - playerMove');
        console.log('   - attackMob');
        console.log('   - requestMobs');
        
        console.log('\n🔄 Reinicie o servidor para aplicar as mudanças:');
        console.log('   npm start');
        
        console.log('\n🎮 Após reiniciar:');
        console.log('   1. Mobs spawnarão automaticamente');
        console.log('   2. Personagem poderá andar');
        console.log('   3. Mobs aparecerão no mapa');
        console.log('   4. Sistema de combate funcionará');
        
    } else {
        console.error('❌ Falha ao adicionar handlers');
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erro na integração:', error);
        process.exit(1);
    });
}

module.exports = { main, addMobHandlers, addPlayerMoveHandler };
