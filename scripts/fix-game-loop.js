// Fix Game Loop Script
// Melhora o loop principal para seguir práticas recomendadas

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Loop Principal do Jogo\n');

function fixGameLoop() {
    const gameplayEnginePath = path.join(__dirname, '../client/modes/offline/GameplayEngine.js');
    
    if (!fs.existsSync(gameplayEnginePath)) {
        console.error('❌ GameplayEngine.js não encontrado');
        return false;
    }
    
    let gameplayContent = fs.readFileSync(gameplayEnginePath, 'utf8');
    
    // 1. Adicionar animationFrameId no constructor
    console.log('📝 Adicionando animationFrameId ao constructor...');
    
    const constructorPattern = /constructor\(.*?\) \{[\s\S]*?this\.isRunning = false;/;
    
    if (constructorPattern.test(gameplayContent)) {
        const updatedConstructor = gameplayContent.match(constructorPattern)[0] + '\n        this.animationFrameId = null;';
        gameplayContent = gameplayContent.replace(constructorPattern, updatedConstructor);
        console.log('✅ animationFrameId adicionado ao constructor');
    }
    
    // 2. Substituir startGameLoop por versão melhorada
    console.log('📝 Melhorando método startGameLoop...');
    
    const newStartGameLoop = `startGameLoop() {
        console.log('🔄 Starting game loop...');
    
        if (!this.player || !this.ctx) {
          console.error('❌ Cannot start game loop: missing dependencies');
          return;
        }
    
        this.isRunning = true;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fpsTime = performance.now();
    
        const loop = (currentTime) => {
          if (!this.isRunning) return;
    
          this.animationFrameId = requestAnimationFrame(loop);
    
          const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
          this.lastTime = currentTime;
    
          this.update(deltaTime);
          this.render();
    
          this.frameCount++;
          if (currentTime - this.fpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = currentTime;
          }
        };
    
        this.animationFrameId = requestAnimationFrame(loop);
      }`;
    
    const startGameLoopPattern = /startGameLoop\(\) \{[\s\S]*?this\.animationFrameId = requestAnimationFrame\(loop\);[\s\S]*?\}/;
    
    if (startGameLoopPattern.test(gameplayContent)) {
        gameplayContent = gameplayContent.replace(startGameLoopPattern, newStartGameLoop);
        console.log('✅ startGameLoop melhorado com requestAnimationFrame robusto');
    }
    
    // 3. Melhorar stopGame
    console.log('📝 Melhorando método stopGame...');
    
    const newStopGame = `stopGame() {
        this.isRunning = false;
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
        console.log('🎮 Gameplay parado');
      }`;
    
    const stopGamePattern = /stopGame\(\) \{[\s\S]*?console\.log\('🎮 Gameplay parado'\);[\s\S]*?\}/;
    
    if (stopGamePattern.test(gameplayContent)) {
        gameplayContent = gameplayContent.replace(stopGamePattern, newStopGame);
        console.log('✅ stopGame melhorado com cancelAnimationFrame');
    }
    
    // Salvar arquivo
    fs.writeFileSync(gameplayEnginePath, gameplayContent);
    console.log('✅ Arquivo GameplayEngine.js salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Fix Game Loop v0.1.0');
console.log('=============================\n');

const success = fixGameLoop();

if (success) {
    console.log('\n🎮 Loop principal corrigido!');
    console.log('📝 animationFrameId adicionado ao constructor');
    console.log('📝 startGameLoop com requestAnimationFrame robusto');
    console.log('📝 stopGame com cancelAnimationFrame');
    console.log('📝 Loop alinhado com repaint do navegador');
    console.log('📝 Preparado para pausar em abas ocultas');
} else {
    console.log('\n❌ Falha ao corrigir loop principal');
}

console.log('\n✅ Script concluído!');
