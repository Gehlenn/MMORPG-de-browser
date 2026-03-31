// Improve Gameplay Engine Script
// Adiciona suporte a atualizações do servidor para multiplayer futuro

const fs = require('fs');
const path = require('path');

console.log('🔧 Melhorando GameplayEngine para Multiplayer\n');

function improveGameplayEngine() {
    const gameplayEnginePath = path.join(__dirname, '../client/modes/offline/GameplayEngine.js');
    
    if (!fs.existsSync(gameplayEnginePath)) {
        console.error('❌ GameplayEngine.js não encontrado');
        return false;
    }
    
    let gameplayContent = fs.readFileSync(gameplayEnginePath, 'utf8');
    
    // 1. Adicionar método updateFromServer()
    console.log('📝 Adicionando método updateFromServer()...');
    
    const updateFromServerMethod = `updateFromServer(updates) {
    // updates: { player: {x, y, ...}, entities: [...] }
    console.log('🔄 Atualizando jogo a partir do servidor:', updates);
    
    // Atualizar jogador local se necessário
    if (updates.player) {
      this.player = {
        ...this.player,
        ...updates.player
      };
      console.log('👤 Jogador atualizado:', this.player);
    }
    
    // Atualizar entidades (outros jogadores, mobs, etc)
    if (updates.entities && Array.isArray(updates.entities)) {
      this.entities = updates.entities.map(entity => ({
        id: entity.id,
        type: entity.type || 'unknown',
        name: entity.name || 'Entity',
        x: entity.x || 400,
        y: entity.y || 300,
        width: entity.width || 32,
        height: entity.height || 32,
        color: entity.color || this.getEntityColor(entity.type),
        health: entity.health || 100,
        maxHealth: entity.maxHealth || 100,
        velocity: { x: 0, y: 0 }
      }));
      
      console.log(\`🌍 Entidades atualizadas: \${this.entities.length}\`);
    }
    
    // Atualizar mundo se fornecido
    if (updates.world) {
      this.world = {
        ...this.world,
        ...updates.world
      };
    }
    
    // Sincronizar estado visual
    this.render();
  }
  
  getEntityColor(type) {
    const colors = {
      player: '#4CAF50',
      mob: '#FF5722',
      npc: '#2196F3',
      item: '#FFC107',
      unknown: '#9E9E9E'
    };
    return colors[type] || colors.unknown;
  }`;

    // Adicionar método antes do último método da classe
    const lastMethodPattern = /(\s+)(\w+)\([^)]*\) \{[\s\S]*?^(\s+)\}/m;
    const match = gameplayContent.match(lastMethodPattern);
    
    if (match) {
        const indent = match[1];
        const lastMethod = match[2];
        gameplayContent = gameplayContent.replace(
            match[0],
            match[0] + '\n' + indent + updateFromServerMethod + '\n'
        );
        console.log('✅ Método updateFromServer() adicionado');
    }
    
    // 2. Adicionar método sendToServer() para comunicação
    console.log('📝 Adicionando método sendToServer()...');
    
    const sendToServerMethod = `sendToServer(event, data) {
    // Envia dados para o servidor se estiver em modo online
    if (typeof Config !== 'undefined' && Config.GAME_MODE === 'SERVER_ONLINE') {
      if (window.networkManager && window.networkManager.connected) {
        switch (event) {
          case 'playerMove':
            window.networkManager.sendPlayerMove(data.x, data.y);
            break;
          case 'attackMob':
            window.networkManager.sendAttackMob(data.mobId, data.damage);
            break;
          case 'useSkill':
            window.networkManager.sendUseSkill(data.skillId, data.target);
            break;
          default:
            console.warn('📡 Evento não reconhecido:', event);
        }
      } else {
        console.warn('📡 NetworkManager não disponível para enviar:', event);
      }
    } else {
      // Modo offline - processar localmente
      console.log('📡 Processando evento localmente:', event, data);
    }
  }`;

    // Adicionar após updateFromServer
    const updateFromServerPattern = /updateFromServer\(updates\) \{[\s\S]*?getEntityColor\(type\) \{[\s\S]*?\}/;
    
    if (updateFromServerPattern.test(gameplayContent)) {
        gameplayContent = gameplayContent.replace(
            updateFromServerPattern,
            updateFromServerPattern.exec(gameplayContent)[0] + '\n\n    ' + sendToServerMethod
        );
        console.log('✅ Método sendToServer() adicionado');
    }
    
    // 3. Modificar método de movimento para usar sendToServer()
    console.log('📝 Modificando método de movimento para multiplayer...');
    
    // Encontrar método de movimento e adicionar chamada sendToServer
    const movePlayerPattern = /movePlayer\(dx, dy\) \{[\s\S]*?this\.player\.y = newY;[\s\S]*?\}/;
    
    if (movePlayerPattern.test(gameplayContent)) {
        const currentMoveMethod = movePlayerPattern.exec(gameplayContent)[0];
        const updatedMoveMethod = currentMoveMethod.replace(
            /this\.player\.y = newY;/,
            `this.player.y = newY;\n        \n        // Enviar movimento para o servidor\n        this.sendToServer('playerMove', { x: this.player.x, y: this.player.y });`
        );
        
        gameplayContent = gameplayContent.replace(currentMoveMethod, updatedMoveMethod);
        console.log('✅ Método de movimento atualizado para multiplayer');
    }
    
    // 4. Modificar método de ataque para usar sendToServer()
    console.log('📝 Modificando método de ataque para multiplayer...');
    
    const attackPattern = /attack\(target\) \{[\s\S]*?console\.log\('Player attacking', target\);[\s\S]*?\}/;
    
    if (attackPattern.test(gameplayContent)) {
        const currentAttackMethod = attackPattern.exec(gameplayContent)[0];
        const updatedAttackMethod = currentAttackMethod.replace(
            /console\.log\('Player attacking', target\);/,
            `console.log('Player attacking', target);\n        \n        // Enviar ataque para o servidor\n        this.sendToServer('attackMob', { mobId: target.id, damage: this.player.attack || 10 });`
        );
        
        gameplayContent = gameplayContent.replace(currentAttackMethod, updatedAttackMethod);
        console.log('✅ Método de ataque atualizado para multiplayer');
    }
    
    // Salvar arquivo
    fs.writeFileSync(gameplayEnginePath, gameplayContent);
    console.log('✅ Arquivo GameplayEngine.js salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Improve Gameplay Engine v0.1.0');
console.log('===============================\n');

const success = improveGameplayEngine();

if (success) {
    console.log('\n🎮 GameplayEngine melhorado para multiplayer!');
    console.log('📝 Método updateFromServer() adicionado');
    console.log('📝 Método sendToServer() adicionado');
    console.log('📝 Movimento integrado com servidor');
    console.log('📝 Ataque integrado com servidor');
    console.log('📝 Preparado para multiplayer online');
} else {
    console.log('\n❌ Falha ao melhorar GameplayEngine');
}

console.log('\n✅ Script concluído!');
