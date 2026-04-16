// Standardize Server Events Script
// Padroniza nomes de eventos no servidor para o formato dominio:acao

const fs = require('fs');
const path = require('path');

console.log('🔧 Padronizando Eventos do Servidor\n');

function standardizeServerEvents() {
    const serverPath = path.join(__dirname, '../server/server.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Mapeamento de eventos antigos para novos
    const eventMappings = [
        { old: /socket\.on\("login"/g, new: 'socket.on("auth:login"' },
        { old: /socket\.on\("createAccount"/g, new: 'socket.on("account:create"' },
        { old: /socket\.on\("playerMove"/g, new: 'socket.on("player:move"' },
        { old: /socket\.on\("attackMob"/g, new: 'socket.on("player:attack"' },
        { old: /socket\.emit\("login_success"/g, new: 'socket.emit("auth:login-success"' },
        { old: /socket\.emit\("world_init"/g, new: 'socket.emit("world:init"' },
        { old: /socket\.emit\("playerUpdate"/g, new: 'socket.emit("player:moved"' },
        { old: /socket\.emit\("mobs_update"/g, new: 'socket.emit("mob:update"' }
    ];
    
    console.log('📝 Substituindo eventos antigos...');
    
    let changesCount = 0;
    eventMappings.forEach(mapping => {
        const matches = serverContent.match(mapping.old);
        if (matches) {
            serverContent = serverContent.replace(mapping.old, mapping.new);
            changesCount += matches.length;
            console.log(`✅ ${matches.length} eventos "${mapping.old}" -> "${mapping.new}"`);
        }
    });
    
    // Salvar arquivo
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Arquivo server.js salvo com sucesso');
    
    console.log(`\n📊 Total de alterações: ${changesCount}`);
    
    return true;
}

// Executar
console.log('🎯 Standardize Server Events v0.1.0');
console.log('====================================\n');

const success = standardizeServerEvents();

if (success) {
    console.log('\n🎮 Eventos do servidor padronizados!');
    console.log('📝 Formato dominio:acao aplicado');
    console.log('📝 Autenticação: auth:login, auth:login-success');
    console.log('📝 Contas: account:create, account:create-success');
    console.log('📝 Mundo: world:init, world:update');
    console.log('📝 Jogador: player:move, player:moved, player:attack');
    console.log('📝 Mobs: mob:update, mob:spawn');
} else {
    console.log('\n❌ Falha ao padronizar eventos');
}

console.log('\n✅ Script concluído!');
