// Fix Simple Login Manager Script
// Corrige problemas no SimpleLoginManager

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Simple Login Manager\n');

function fixSimpleLoginManager() {
    const loginManagerPath = path.join(__dirname, '../client/SimpleLoginManager.js');
    
    if (!fs.existsSync(loginManagerPath)) {
        console.error('❌ SimpleLoginManager.js não encontrado');
        return false;
    }
    
    let loginManagerContent = fs.readFileSync(loginManagerPath, 'utf8');
    
    // Procurar pelo erro de inicialização
    const errorPattern = /❌ Erro ao inicializar sistemas: \{\}/;
    
    if (errorPattern.test(loginManagerContent)) {
        // Adicionar tratamento de erro
        const fixedContent = loginManagerContent.replace(
            /initializeGameplay\(\) \{[\s\S]*?\} catch \(error\) \{[\s\S]*?console\.error\('❌ Erro ao inicializar gameplay:', error\);[\s\S]*?\}/,
            `initializeGameplay() {
                if (!window.IntegratedGameplayEngine) {
                    console.error('❌ IntegratedGameplayEngine não encontrado');
                    this.showMessage('characterMessage', 'Erro ao carregar sistema de jogo', 'error');
                    return;
                }
                
                try {
                    this.gameplayEngine = new window.IntegratedGameplayEngine('gameCanvas', this.currentCharacter);
                    window.gameplayEngine = this.gameplayEngine;
                    
                    const characterData = {
                        name: this.currentCharacter.name,
                        level: this.currentCharacter.level || 1,
                        hp: this.currentCharacter.hp || 100,
                        maxHp: this.currentCharacter.maxHp || 100,
                        exp: this.currentCharacter.exp || 0
                    };
                    
                    if (window.hudSystem) {
                        window.hudSystem.updatePlayerState(characterData);
                        window.hudSystem.showNotification(\`Bem-vindo ao mundo, \${this.currentCharacter.name}!\`, 'success');
                        window.hudSystem.show();
                    }
                    
                    this.gameplayEngine.start();
                } catch (error) {
                    console.error('❌ Erro ao inicializar gameplay:', error);
                    this.showMessage('characterMessage', 'Erro ao iniciar jogo. Tente novamente.', 'error');
                }
            }`
        );
        
        fs.writeFileSync(loginManagerPath, fixedContent);
        console.log('✅ SimpleLoginManager corrigido');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Fix Simple Login Manager v0.1.0');
console.log('===============================\n');

const success = fixSimpleLoginManager();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 SimpleLoginManager corrigido!');
} else {
    console.log('\n❌ Falha ao corrigir SimpleLoginManager');
}

console.log('\n✅ Script concluído!');
