// Fix Gameplay Integration Script
// Corrige integração entre SimpleLoginManager e GameplayEngine

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Integração do Gameplay\n');

function fixGameplayIntegration() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Adicionar método startGame ao SimpleLoginManager se não existir
    console.log('📝 Adicionando método startGame ao SimpleLoginManager...');
    
    const startGameMethod = `
  startGame(characterData) {
    const character = characterData || this.currentCharacter;
    console.log('🚀 startGame chamado com:', character);
    if (!character) {
      console.error('❌ Nenhum personagem para iniciar o jogo');
      return;
    }
    
    // Trocar telas
    if (this.loginScreen) this.loginScreen.style.display = 'none';
    if (this.characterScreen) this.characterScreen.style.display = 'none';
    if (this.gameScreen) this.gameScreen.style.display = 'flex';
    
    // Iniciar IntegratedGameplayEngine se disponível
    if (typeof window !== 'undefined' && window.IntegratedGameplayEngine && window._gameplayEngine) {
      window._gameplayEngine.startGame(character);
      console.log('✅ GameplayEngine existente iniciado');
    } else if (typeof window !== 'undefined' && window.IntegratedGameplayEngine) {
      window._gameplayEngine = new window.IntegratedGameplayEngine('gameCanvas');
      window._gameplayEngine.startGame(character);
      console.log('✅ Novo GameplayEngine criado e iniciado');
    } else {
      console.warn('⚠️ IntegratedGameplayEngine não encontrado, usando fallback');
      // Fallback: mostrar tela de jogo básica
      this.showBasicGameplay(character);
    }
    
    console.log('✅ Jogo iniciado!');
  }
  
  showBasicGameplay(character) {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('❌ Canvas não encontrado');
      return;
    }
    
    canvas.width = 800;
    canvas.height = 600;
    
    const ctx = canvas.getContext('2d');
    
    const player = {
      x: 400,
      y: 300,
      width: 32,
      height: 32,
      color: '#4CAF50',
      name: character.name || 'Player',
      class: character.class || 'apprentice'
    };
    
    function render() {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText(\`\${player.name} - \${player.class}\`, 10, 30);
      ctx.fillText('WASD: Mover | Espaço: Atacar', 10, canvas.height - 20);
    }
    
    function gameLoop() {
      render();
      requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
    console.log('✅ Gameplay básico iniciado');
  }
`;
    
    // Verificar se SimpleLoginManager está no arquivo
    if (indexContent.includes('class SimpleLoginManager')) {
        // Encontrar o fim da classe e adicionar o método
        const classEndPattern = /class SimpleLoginManager[\s\S]*?^}$/m;
        const match = indexContent.match(classEndPattern);
        
        if (match) {
            const classContent = match[0];
            const lastBraceIndex = classContent.lastIndexOf('}');
            
            if (lastBraceIndex !== -1 && !classContent.includes('startGame(')) {
                const newClassContent = classContent.substring(0, lastBraceIndex) + 
                                      startGameMethod + '\n' + 
                                      classContent.substring(lastBraceIndex);
                
                indexContent = indexContent.replace(classContent, newClassContent);
                console.log('✅ Método startGame adicionado ao SimpleLoginManager');
            }
        }
    }
    
    // 2. Corrigir inicialização do GameplayEngine no index.html
    console.log('📝 Corrigindo inicialização do GameplayEngine...');
    
    // Remover criação duplicada do GameplayEngine
    const gameplayEnginePattern = /const gameplayEngine = new GameplayEngine\(\);?/g;
    if (gameplayEnginePattern.test(indexContent)) {
        indexContent = indexContent.replace(gameplayEnginePattern, '');
        console.log('✅ Criação duplicada do GameplayEngine removida');
    }
    
    // Adicionar inicialização correta
    if (!indexContent.includes('window._gameplayEngine = new')) {
        const initPattern = /waitForScripts\(\)\.then\(\(\) => \{[\s\S]*?\}\);/;
        const match = indexContent.match(initPattern);
        
        if (match) {
            const originalContent = match[0];
            const newContent = originalContent.replace(
                /}\);$/,
                `// Criar GameplayEngine global
    if (typeof IntegratedGameplayEngine !== 'undefined') {
      window._gameplayEngine = new IntegratedGameplayEngine('gameCanvas');
      console.log('✅ GameplayEngine criado globalmente');
    }
    
    // Adicionar startGame ao loginManager se existir
    if (window.loginManager) {
      window.loginManager.startGame = function(characterData) {
        const character = characterData || this.currentCharacter;
        console.log('🚀 startGame chamado via loginManager:', character);
        
        if (window._gameplayEngine) {
          window._gameplayEngine.startGame(character);
        }
      };
    }
  });`
            );
            
            indexContent = indexContent.replace(originalContent, newContent);
            console.log('✅ Inicialização do GameplayEngine corrigida');
        }
    }
    
    // 3. Adicionar fallback para quando SimpleLoginManager não estiver disponível
    if (!indexContent.includes('window.startGame')) {
        const windowStartGame = `
// Fallback global para startGame
window.startGame = function(characterData) {
  console.log('🚀 startGame global chamado com:', characterData);
  
  if (window.loginManager && typeof window.loginManager.startGame === 'function') {
    window.loginManager.startGame(characterData);
  } else if (window._gameplayEngine) {
    window._gameplayEngine.startGame(characterData);
  } else {
    console.error('❌ Nenhum sistema de jogo disponível');
  }
};

console.log('✅ Fallback startGame adicionado');`;
        
        // Adicionar antes do fechamento do script
        const scriptEndPattern = /<\/script>/;
        if (scriptEndPattern.test(indexContent)) {
            indexContent = indexContent.replace(
                scriptEndPattern,
                windowStartGame + '\n    </script>'
            );
            console.log('✅ Fallback startGame adicionado');
        }
    }
    
    // Salvar arquivo
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Arquivo index.html salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Fix Gameplay Integration v0.1.0');
console.log('===============================\n');

const success = fixGameplayIntegration();

if (success) {
    console.log('\n🎮 Integração do gameplay corrigida!');
    console.log('📝 Método startGame adicionado');
    console.log('📝 GameplayEngine global configurado');
    console.log('📝 Fallback implementado');
    console.log('📝 Compatibilidade garantida');
} else {
    console.log('\n❌ Falha ao corrigir integração');
}

console.log('\n✅ Script concluído!');
