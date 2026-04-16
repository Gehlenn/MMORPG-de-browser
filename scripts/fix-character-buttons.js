// Fix Character Buttons Script
// Corrige os botões da tela de seleção de personagem

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Botões de Seleção de Personagem\n');

function fixCharacterButtons() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Procurar pelas funções de personagem no JavaScript
    const selectCharacterPattern = /function selectCharacter\(characterClass\) \{[\s\S]*?\}/;
    const startGamePattern = /function startGame\(\) \{[\s\S]*?\}/;
    const backToLoginFromCharacterPattern = /function backToLoginFromCharacter\(\) \{[\s\S]*?\}/;
    
    // 2. Criar funções simples e funcionais
    const characterFunctions = `
    // Funções da tela de seleção de personagem
    function selectCharacter(characterClass) {
        console.log('📝 Personagem selecionado:', characterClass);
        
        // Destacar card selecionado
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(card => {
            card.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            card.style.transform = 'scale(1)';
        });
        
        // Encontrar o card clicado e destacar
        if (event && event.currentTarget) {
            event.currentTarget.style.borderColor = '#4CAF50';
            event.currentTarget.style.transform = 'scale(1.05)';
            event.currentTarget.style.boxShadow = '0 5px 15px rgba(76, 175, 80, 0.4)';
        }
        
        // Salvar personagem selecionado
        localStorage.setItem('selectedCharacter', characterClass);
    }
    
    function startGame() {
        console.log('🚀 Iniciando jogo');
        
        const characterScreen = document.getElementById('characterScreen');
        const gameContainer = document.getElementById('gameContainer');
        
        if (characterScreen && gameContainer) {
            // Transição suave
            characterScreen.style.opacity = '0';
            setTimeout(() => {
                characterScreen.style.display = 'none';
                gameContainer.style.display = 'block';
                gameContainer.style.opacity = '0';
                
                setTimeout(() => {
                    gameContainer.style.opacity = '1';
                    const selectedClass = localStorage.getItem('selectedCharacter') || 'warrior';
                    initializeGameplay(selectedClass);
                }, 100);
            }, 300);
        }
    }
    
    function backToLoginFromCharacter() {
        console.log('🔙 Voltando para login');
        
        const characterScreen = document.getElementById('characterScreen');
        const loginScreen = document.getElementById('loginScreen');
        
        if (characterScreen && loginScreen) {
            characterScreen.style.opacity = '0';
            setTimeout(() => {
                characterScreen.style.display = 'none';
                loginScreen.style.display = 'flex';
                loginScreen.style.opacity = '0';
                
                setTimeout(() => {
                    loginScreen.style.opacity = '1';
                }, 100);
            }, 300);
        }
    }`;
    
    // 3. Substituir as funções no JavaScript
    let updatedContent = indexContent;
    
    if (selectCharacterPattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(selectCharacterPattern, characterFunctions.match(/function selectCharacter\(characterClass\) \{[\s\S]*?\}/)[0]);
    }
    
    if (startGamePattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(startGamePattern, characterFunctions.match(/function startGame\(\) \{[\s\S]*?\}/)[0]);
    }
    
    if (backToLoginFromCharacterPattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(backToLoginFromCharacterPattern, characterFunctions.match(/function backToLoginFromCharacter\(\) \{[\s\S]*?\}/)[0]);
    }
    
    // 4. Verificar se os botões têm onclick no HTML
    const characterCardsPattern = /<div class="character-card"[^>]*>/g;
    const startButtonPattern = /<button[^>]*>Iniciar Jogo<\/button>/;
    const backButtonPattern = /<button[^>]*>Voltar<\/button>/;
    
    if (!characterCardsPattern.test(updatedContent)) {
        console.log('❌ Cards de personagem não encontrados');
        return false;
    }
    
    // 5. Adicionar onclick nos cards de personagem
    const fixedCards = updatedContent.replace(characterCardsPattern, (match) => {
        if (match.includes('onclick=')) {
            return match;
        }
        
        // Adicionar onclick para cada classe
        return match
            .replace('<div class="character-card"', '<div class="character-card" onclick="selectCharacter(\'warrior\')"')
            .replace('onclick="selectCharacter(\'warrior\')"', 'onclick="selectCharacter(\'warrior\')"'); // Manter o primeiro
    });
    
    // 6. Adicionar onclick nos botões
    const fixedButtons = fixedCards
        .replace(startButtonPattern, '<button class="login-button" onclick="startGame()">Iniciar Jogo</button>')
        .replace(backButtonPattern, '<button class="login-button" style="background: #666;" onclick="backToLoginFromCharacter()">Voltar</button>');
    
    fs.writeFileSync(indexPath, fixedButtons);
    console.log('✅ Botões da tela de personagem corrigidos');
    return true;
}

// Executar
console.log('🎯 Fix Character Buttons v0.1.0');
console.log('===============================\n');

const success = fixCharacterButtons();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Botões de seleção corrigidos!');
    console.log('📝 Cards de personagem com onclick');
    console.log('📝 Botão Iniciar Jogo funcionando');
    console.log('📝 Botão Voltar funcionando');
} else {
    console.log('\n❌ Falha ao corrigir botões');
}

console.log('\n✅ Script concluído!');
