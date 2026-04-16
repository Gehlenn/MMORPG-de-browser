// Fix Player Registration Script
// Corrige o problema do jogador não ser registrado no sistema AI

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Registro de Jogador no Sistema AI\n');

function fixPlayerRegistration() {
    const clientPath = path.join(__dirname, '../client/IntegratedGameplayEngine.js');
    
    if (!fs.existsSync(clientPath)) {
        console.error('❌ IntegratedGameplayEngine.js não encontrado');
        return false;
    }
    
    let clientContent = fs.readFileSync(clientPath, 'utf8');
    
    // Encontrar a seção de conexão
    const connectionSection = `this.socket.on('connect', () => {
            console.log('📡 Conectado ao servidor');
            
            this.socket.emit('player_join', {
                id: this.player.id,
                name: this.player.name,
                x: this.player.x,
                y: this.player.y,
                level: this.player.level
            });
        });`;
    
    const enhancedConnection = `this.socket.on('connect', () => {
            console.log('📡 Conectado ao servidor');
            
            // Enviar player_join para registrar no servidor
            this.socket.emit('player_join', {
                id: this.player.id,
                name: this.player.name,
                x: this.player.x,
                y: this.player.y,
                level: this.player.level
            });
            
            // Enviar posição inicial para ativar AI dos mobs
            setTimeout(() => {
                this.socket.emit('playerMove', {
                    x: this.player.x,
                    y: this.player.y
                });
                console.log('🏃 Posição inicial enviada para ativar IA dos mobs');
            }, 1000);
        });`;
    
    // Encontrar e substituir a seção de playerMove
    const playerMoveSection = `socket.on('playerMove', (data) => {
            if (this.players.has(socket.id)) {
                const player = this.players.get(socket.id);
                player.x = data.x;
                player.y = data.y;
                
                // Broadcast player movement
                this.io.emit('playerUpdate', {
                    id: socket.id,
                    x: data.x,
                    y: data.y
                });
                
                console.log('🏃 Player ' + socket.id + ' moved to (' + data.x + ', ' + data.y + ')');
            }
        });`;
    
    const enhancedPlayerMove = `socket.on('playerMove', (data) => {
            if (this.players.has(socket.id)) {
                const player = this.players.get(socket.id);
                player.x = data.x;
                player.y = data.y;
                
                // Broadcast player movement
                this.io.emit('playerUpdate', {
                    id: socket.id,
                    x: data.x,
                    y: data.y
                });
                
                console.log('🏃 Player ' + socket.id + ' moved to (' + data.x + ', ' + data.y + ')');
            }
        });`;
    
    // Adicionar playerJoin handler no servidor
    const serverPath = path.join(__dirname, '../server/server-simple-fixed.js');
    if (fs.existsSync(serverPath)) {
        let serverContent = fs.readFileSync(serverPath, 'utf8');
        
        // Encontrar setupPlayerEventHandlers e adicionar playerJoin
        const handlerSection = `setupPlayerEventHandlers(socket) {
        // Login handler
        socket.on('login', (data) => {
            console.log('👤 Player login: ' + data.username);
            
            const player = {
                id: socket.id,
                name: data.username,
                x: 400,
                y: 300,
                hp: 100,
                maxHp: 100,
                level: 1,
                exp: 0
            };
            
            this.players.set(socket.id, player);
            socket.emit('login_success', player);
            console.log('✅ Login successful: ' + data.username);
        });`;
        
        const enhancedHandler = `setupPlayerEventHandlers(socket) {
        // Player join handler (para registro no sistema AI)
        socket.on('player_join', (data) => {
            console.log('👤 Player join: ' + data.name);
            
            const player = {
                id: data.id,
                name: data.name,
                x: data.x || 400,
                y: data.y || 300,
                hp: 100,
                maxHp: 100,
                level: data.level || 1,
                exp: 0
            };
            
            this.players.set(data.id, player);
            console.log('✅ Player registered in AI system: ' + data.name);
        });
        
        // Login handler
        socket.on('login', (data) => {
            console.log('👤 Player login: ' + data.username);
            
            const player = {
                id: socket.id,
                name: data.username,
                x: 400,
                y: 300,
                hp: 100,
                maxHp: 100,
                level: 1,
                exp: 0
            };
            
            this.players.set(socket.id, player);
            socket.emit('login_success', player);
            console.log('✅ Login successful: ' + data.username);
        });`;
        
        if (serverContent.includes(handlerSection)) {
            serverContent = serverContent.replace(handlerSection, enhancedHandler);
            fs.writeFileSync(serverPath, serverContent);
            console.log('✅ Servidor atualizado com handler player_join');
        }
    }
    
    // Atualizar cliente
    if (clientContent.includes(connectionSection)) {
        clientContent = clientContent.replace(connectionSection, enhancedConnection);
        fs.writeFileSync(clientPath, clientContent);
        console.log('✅ Cliente atualizado com envio de posição inicial');
        return true;
    } else {
        console.log('⚠️ Seção de conexão não encontrada no cliente');
        return false;
    }
}

// Executar
console.log('🎯 Fix Player Registration v0.4.0');
console.log('===================================\n');

const success = fixPlayerRegistration();

if (success) {
    console.log('\n🔄 Reinicie o servidor e o cliente para aplicar as mudanças:');
    console.log('   1. taskkill /f /im node.exe');
    console.log('   2. node server/server-simple-fixed.js');
    console.log('   3. Abra o jogo e entre no mundo');
    console.log('   4. Mova o personagem');
    
    console.log('\n🎮 Resultado esperado:');
    console.log('   - Jogador registrado no sistema AI');
    console.log('   - Mobs detectarão jogador');
    console.log('   - Mobs começarão a se mover');
    console.log('   - Colisão funcionará');
} else {
    console.log('\n❌ Falha ao corrigir registro do jogador');
}

console.log('\n✅ Script concluído!');
