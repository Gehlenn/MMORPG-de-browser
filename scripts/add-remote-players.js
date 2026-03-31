// Add Remote Players Script
// Prepara o GameplayEngine para entidades remotas (multiplayer)

const fs = require('fs');
const path = require('path');

console.log('🔧 Adicionando Suporte a Entidades Remotas\n');

function addRemotePlayers() {
    const gameplayEnginePath = path.join(__dirname, '../client/modes/offline/GameplayEngine.js');
    
    if (!fs.existsSync(gameplayEnginePath)) {
        console.error('❌ GameplayEngine.js não encontrado');
        return false;
    }
    
    let gameplayContent = fs.readFileSync(gameplayEnginePath, 'utf8');
    
    // 1. Adicionar remotePlayers no constructor
    console.log('📝 Adicionando remotePlayers ao constructor...');
    
    const constructorPattern = /constructor\(.*?\) \{[\s\S]*?this\.mobs = \[\];/;
    
    if (constructorPattern.test(gameplayContent)) {
        const updatedConstructor = gameplayContent.match(constructorPattern)[0] + '\n        this.remotePlayers = [];';
        gameplayContent = gameplayContent.replace(constructorPattern, updatedConstructor);
        console.log('✅ remotePlayers adicionado ao constructor');
    }
    
    // 2. Adicionar renderização de remotePlayers
    console.log('📝 Adicionando renderização de remotePlayers...');
    
    const remotePlayerRender = `// Renderizar jogadores remotos
        this.remotePlayers.forEach(remotePlayer => {
          this.ctx.fillStyle = '#2196F3';
          this.ctx.fillRect(remotePlayer.x - 16, remotePlayer.y - 16, 32, 32);
          this.ctx.strokeStyle = '#0D47A1';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(remotePlayer.x - 16, remotePlayer.y - 16, 32, 32);
          
          // Nome do jogador remoto
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.font = '12px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(remotePlayer.name || 'Remote Player', remotePlayer.x, remotePlayer.y - 20);
        });`;
    
    const renderPattern = /render\(\) \{[\s\S]*?\/\/ Renderizar player local/;
    
    if (renderPattern.test(gameplayContent)) {
        const updatedRender = gameplayContent.match(renderPattern)[0] + '\n        ' + remotePlayerRender;
        gameplayContent = gameplayContent.replace(renderPattern, updatedRender);
        console.log('✅ Renderização de remotePlayers adicionada');
    }
    
    // 3. Atualizar updateFromServer para tratar remotePlayers
    console.log('📝 Atualizando updateFromServer para remotePlayers...');
    
    const updateFromServerPattern = /updateFromServer\(updates\) \{[\s\S]*?if \(updates\.entities\) \{[\s\S]*?\}/;
    
    if (updateFromServerPattern.test(gameplayContent)) {
        const currentUpdate = updateFromServerPattern.exec(gameplayContent)[0];
        const updatedUpdate = currentUpdate.replace(
            /this\.remotePlayers = updates\.entities\.filter\(entity => entity\.type === 'player'\);/,
            `this.remotePlayers = updates.entities.filter(entity => entity.type === 'player' && entity.id !== this.player?.id);`
        );
        
        gameplayContent = gameplayContent.replace(currentUpdate, updatedUpdate);
        console.log('✅ updateFromServer atualizado para remotePlayers');
    }
    
    // 4. Adicionar método para limpar remotePlayers
    console.log('📝 Adicionando método clearRemotePlayers...');
    
    const clearRemotePlayersMethod = `clearRemotePlayers() {
        this.remotePlayers = [];
        console.log('🧹 Remote players limpos');
      }`;
    
    // Adicionar antes do último método
    const lastMethodPattern = /(\s+)(\w+)\([^)]*\) \{[\s\S]*?^(\s+)\}/m;
    const match = gameplayContent.match(lastMethodPattern);
    
    if (match) {
        const indent = match[1];
        const lastMethod = match[2];
        gameplayContent = gameplayContent.replace(
            match[0],
            match[0] + '\n' + indent + clearRemotePlayersMethod + '\n'
        );
        console.log('✅ Método clearRemotePlayers adicionado');
    }
    
    // Salvar arquivo
    fs.writeFileSync(gameplayEnginePath, gameplayContent);
    console.log('✅ Arquivo GameplayEngine.js salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Add Remote Players v0.1.0');
console.log('=================================\n');

const success = addRemotePlayers();

if (success) {
    console.log('\n🎮 Suporte a entidades remotas adicionado!');
    console.log('📝 remotePlayers array criado');
    console.log('📝 Renderização de jogadores remotos');
    console.log('📝 updateFromServer filtrando players remotos');
    console.log('📝 clearRemotePlayers método adicionado');
    console.log('📝 Preparado para multiplayer real');
} else {
    console.log('\n❌ Falha ao adicionar suporte a entidades remotas');
}

console.log('\n✅ Script concluído!');
