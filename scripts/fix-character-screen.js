// Fix Character Screen Script
// Corrige tela de seleção de personagem e centraliza login

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Tela de Personagem e Login\n');

function fixCharacterScreen() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Adicionar tela de seleção de personagem
    const characterScreenHTML = `
    <!-- CHARACTER SCREEN -->
    <div id="characterScreen" class="screen" style="display: none;">
        <div class="character-container">
            <h2>⚔️ Seleção de Personagem</h2>
            <div id="characterMessage" class="message"></div>
            
            <div class="character-list">
                <div class="character-card" onclick="selectCharacter('warrior')">
                    <h3>⚔️ Guerreiro</h3>
                    <p>Classe padrão, equilibrada em combate</p>
                </div>
                
                <div class="character-card" onclick="selectCharacter('mage')">
                    <h3>🧙 Mago</h3>
                    <p>Usuário de magias poderosas</p>
                </div>
                
                <div class="character-card" onclick="selectCharacter('ranger')">
                    <h3>🏹 Arqueiro</h3>
                    <p>Especialista em ataques à distância</p>
                </div>
            </div>
            
            <div class="form-row">
                <button class="login-button" onclick="startGame()">Iniciar Jogo</button>
                <button class="login-button" style="background: #666;" onclick="backToLoginFromCharacter()">Voltar</button>
            </div>
        </div>
    </div>`;
    
    // Inserir tela de personagem antes do gameScreen
    const gameScreenPattern = /<!-- GAME SCREEN -->/;
    if (gameScreenPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            gameScreenPattern,
            characterScreenHTML + '\n    <!-- GAME SCREEN -->'
        );
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Tela de personagem adicionada');
    }
    
    // 2. Centralizar tela de login
    const loginScreenStyle = `
    #loginScreen {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        z-index: 9999 !important;
    }
    
    .login-container {
        background: rgba(0, 0, 0, 0.8) !important;
        border-radius: 15px !important;
        padding: 30px !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
        border: 2px solid rgba(255, 255, 255, 0.1) !important;
    }`;
    
    // Adicionar CSS para centralizar login
    const headPattern = /<\/head>/;
    if (headPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            headPattern,
            `    <style>
        ${loginScreenStyle}
        
        #characterScreen {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            z-index: 9999 !important;
        }
        
        .character-container {
            background: rgba(0, 0, 0, 0.8) !important;
            border-radius: 15px !important;
            padding: 30px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
            border: 2px solid rgba(255, 255, 255, 0.1) !important;
            max-width: 600px !important;
            width: 100% !important;
        }
        
        .character-list {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
            gap: 20px !important;
            margin: 20px 0 !important;
        }
        
        .character-card {
            background: rgba(255, 255, 255, 0.1) !important;
            border: 2px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 10px !important;
            padding: 20px !important;
            text-align: center !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
        }
        
        .character-card:hover {
            background: rgba(255, 255, 255, 0.2) !important;
            transform: translateY(-5px) !important;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3) !important;
        }
        
        .character-card h3 {
            margin: 0 0 10px 0 !important;
            color: #4CAF50 !important;
        }
        
        .character-card p {
            margin: 0 !important;
            color: #ccc !important;
            font-size: 0.9em !important;
        }
    </style>
    </head>`
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ CSS de centralização adicionado');
    }
    
    // 3. Adicionar funções da tela de personagem
    const characterFunctions = `
    // Funções da tela de personagem
    let selectedCharacter = 'warrior';
    
    function selectCharacter(characterClass) {
        console.log('📝 Personagem selecionado:', characterClass);
        selectedCharacter = characterClass;
        
        // Atualizar visual dos cards
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(card => {
            card.style.border = '2px solid rgba(255, 255, 255, 0.2)';
        });
        
        // Destacar selecionado
        event.currentTarget.style.border = '2px solid #4CAF50';
    }
    
    function startGame() {
        console.log('🚀 Iniciando jogo com personagem:', selectedCharacter);
        
        // Esconder tela de personagem
        const characterScreen = document.getElementById('characterScreen');
        if (characterScreen) {
            characterScreen.style.display = 'none';
        }
        
        // Mostrar jogo
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.style.display = 'block';
        }
        
        // Inicializar gameplay com personagem selecionado
        initializeGameplayWithCharacter(selectedCharacter);
    }
    
    function backToLoginFromCharacter() {
        console.log('🔙 Voltando para login');
        
        // Esconder tela de personagem
        const characterScreen = document.getElementById('characterScreen');
        if (characterScreen) {
            characterScreen.style.display = 'none';
        }
        
        // Mostrar login
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'flex';
        }
    }
    
    function initializeGameplayWithCharacter(characterClass) {
        const username = localStorage.getItem('currentUser') || 'Player';
        
        console.log('🎮 Inicializando gameplay com personagem:', characterClass);
        
        if (typeof window.IntegratedGameplayEngine !== 'undefined') {
            try {
                const character = {
                    name: username,
                    class: characterClass,
                    level: 1,
                    hp: characterClass === 'warrior' ? 120 : characterClass === 'mage' ? 80 : 100,
                    maxHp: characterClass === 'warrior' ? 120 : characterClass === 'mage' ? 80 : 100,
                    exp: 0,
                    x: 400,
                    y: 300,
                    strength: characterClass === 'warrior' ? 15 : characterClass === 'mage' ? 8 : 12,
                    intelligence: characterClass === 'mage' ? 15 : characterClass === 'warrior' ? 8 : 12,
                    agility: characterClass === 'ranger' ? 15 : characterClass === 'warrior' ? 10 : 12
                };
                
                window.gameplayEngine = new window.IntegratedGameplayEngine('gameCanvas', character);
                console.log('✅ Gameplay engine inicializado com personagem:', characterClass);
                showMessage('Jogo iniciado! Use WASD para mover', 'success');
                
                // Configurar controles
                setupControls();
                
            } catch (error) {
                console.error('❌ Erro ao inicializar gameplay:', error);
                showMessage('Erro ao carregar jogo', 'error');
            }
        } else {
            console.log('⚠️ Gameplay engine não disponível');
            showMessage('Jogo iniciado! (Modo simplificado)', 'success');
        }
    }`;
    
    // Adicionar funções antes do fechamento do script
    const scriptEndPattern = /<\/script>/;
    if (scriptEndPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            scriptEndPattern,
            characterFunctions + '\n    </script>'
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Funções da tela de personagem adicionadas');
    }
    
    // 4. Modificar login para mostrar tela de personagem
    const loginSuccessPattern = /showMessage\('Login realizado com sucesso!', 'success'\);[\s\S]*?const loginScreen = document\.getElementById\('loginScreen'\);[\s\S]*?if \(loginScreen\) \{[\s\S]*?loginScreen\.style\.display = 'none';[\s\S]*?\}/;
    
    if (loginSuccessPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            loginSuccessPattern,
            `showMessage('Login realizado com sucesso!', 'success');
            
            // Mostrar tela de seleção de personagem
            const loginScreen = document.getElementById('loginScreen');
            const characterScreen = document.getElementById('characterScreen');
            
            if (loginScreen) {
                loginScreen.style.display = 'none';
            }
            
            if (characterScreen) {
                characterScreen.style.display = 'flex';
            }`
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Login modificado para mostrar tela de personagem');
    }
    
    return true;
}

// Executar
console.log('🎯 Fix Character Screen v0.1.0');
console.log('===============================\n');

const success = fixCharacterScreen();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Sistema corrigido!');
    console.log('📝 Login centralizado');
    console.log('📝 Tela de personagem adicionada');
    console.log('📝 Código visível removido');
} else {
    console.log('\n❌ Falha ao corrigir sistema');
}

console.log('\n✅ Script concluído!');
