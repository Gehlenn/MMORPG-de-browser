// Debug Gameplay Script
// Testa e corrige problemas de gameplay

const fs = require('fs');
const path = require('path');

console.log('🎮 Debugando Gameplay\n');

function debugGameplay() {
    // 1. Verificar se o gameplay engine está sendo inicializado após login
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (fs.existsSync(indexPath)) {
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Adicionar inicialização do gameplay após login
        const loginSuccessPattern = /showMessage\('Login realizado com sucesso!', 'success'\);[\s\S]*?document\.getElementById\('gameContainer'\)\.style\.display = 'block';/;
        
        if (loginSuccessPattern.test(indexContent)) {
            const fixedContent = indexContent.replace(
                loginSuccessPattern,
                `showMessage('Login realizado com sucesso!', 'success');
                        
                        // Inicializar gameplay engine
                        initializeGameplay(username);`
            );
            
            // Adicionar função de inicialização do gameplay
            const gameplayFunction = `
        function initializeGameplay(username) {
            console.log('🎮 Inicializando gameplay para:', username);
            
            // Garantir que o gameplay engine exista
            if (typeof window.IntegratedGameplayEngine !== 'undefined') {
                try {
                    // Criar personagem padrão
                    const character = {
                        name: username,
                        level: 1,
                        hp: 100,
                        maxHp: 100,
                        exp: 0,
                        x: 400,
                        y: 300,
                        class: 'warrior'
                    };
                    
                    // Inicializar gameplay engine
                    window.gameplayEngine = new window.IntegratedGameplayEngine('gameCanvas', character);
                    
                    console.log('✅ Gameplay engine inicializado');
                    showMessage('Jogo carregado! Use WASD para mover.', 'success');
                    
                    // Configurar controles
                    setupControls();
                    
                } catch (error) {
                    console.error('❌ Erro ao inicializar gameplay:', error);
                    showMessage('Erro ao carregar jogo', 'error');
                }
            } else {
                console.error('❌ IntegratedGameplayEngine não encontrado');
                showMessage('Sistema de jogo não disponível', 'error');
            }
        }
        
        function setupControls() {
            console.log('🎮 Configurando controles...');
            
            const keys = {};
            
            document.addEventListener('keydown', (e) => {
                keys[e.key.toLowerCase()] = true;
                
                // Prevenir movimento se não estiver no jogo
                if (document.getElementById('loginScreen').style.display !== 'none') {
                    return;
                }
                
                // Movimento WASD
                if (window.gameplayEngine) {
                    if (keys['w']) window.gameplayEngine.movePlayer(0, -5);
                    if (keys['s']) window.gameplayEngine.movePlayer(0, 5);
                    if (keys['a']) window.gameplayEngine.movePlayer(-5, 0);
                    if (keys['d']) window.gameplayEngine.movePlayer(5, 0);
                }
            });
            
            document.addEventListener('keyup', (e) => {
                keys[e.key.toLowerCase()] = false;
            });
            
            console.log('✅ Controles configurados');
        }`;
            
            const finalContent = fixedContent.replace('</body>', gameplayFunction + '</body>');
            fs.writeFileSync(indexPath, finalContent);
            console.log('✅ Gameplay inicialização adicionada');
        }
    }
    
    // 2. Verificar se o canvas do jogo existe
    const gameCanvasPattern = /<canvas id="gameCanvas"><\/canvas>/;
    if (fs.existsSync(indexPath)) {
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        
        if (!gameCanvasPattern.test(indexContent)) {
            // Adicionar canvas do jogo se não existir
            indexContent = indexContent.replace(
                '<!-- Game Canvas -->',
                '<!-- Game Canvas -->\n        <canvas id="gameCanvas" width="800" height="600" style="display: block;"></canvas>'
            );
            fs.writeFileSync(indexPath, indexContent);
            console.log('✅ Canvas do jogo adicionado');
        }
    }
    
    return true;
}

// Executar
console.log('🎯 Debug Gameplay v0.1.0');
console.log('===============================\n');

const success = debugGameplay();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Gameplay debugado!');
    console.log('📝 Após login, use WASD para mover o personagem');
} else {
    console.log('\n❌ Falha ao debugar gameplay');
}

console.log('\n✅ Script concluído!');
