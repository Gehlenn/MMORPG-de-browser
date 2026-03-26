// Fix Character Buttons Final Script
// Corrige definitivamente os botões da tela de personagem

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Botões Finais de Personagem\n');

function fixCharacterButtonsFinal() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Adicionar funções dos botões se não existirem
    const buttonFunctions = `
    // Funções dos botões da tela de personagem
    function selectCharacter(characterClass) {
        console.log('📝 Personagem selecionado:', characterClass);
        
        // Destacar card selecionado
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(card => {
            card.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            card.style.transform = 'scale(1)';
            card.style.boxShadow = 'none';
        });
        
        // Encontrar e destacar o card clicado
        const clickedCard = event.currentTarget;
        if (clickedCard) {
            clickedCard.style.borderColor = '#4CAF50';
            clickedCard.style.transform = 'scale(1.05)';
            clickedCard.style.boxShadow = '0 5px 15px rgba(76, 175, 80, 0.4)';
        }
        
        // Salvar seleção
        localStorage.setItem('selectedCharacter', characterClass);
        
        // Habilitar botão de entrar
        const enterBtn = document.getElementById('enterWorldBtn');
        if (enterBtn) {
            enterBtn.disabled = false;
            enterBtn.style.opacity = '1';
        }
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
    }
    
    function createNewCharacter() {
        console.log('👤 Criar novo personagem');
        
        const characterList = document.getElementById('characterList');
        const characterCreation = document.getElementById('characterCreation');
        const createNewBtn = document.getElementById('createNewCharacterBtn');
        const enterBtn = document.getElementById('enterWorldBtn');
        
        if (characterList && characterCreation && createNewBtn && enterBtn) {
            characterList.style.opacity = '0';
            setTimeout(() => {
                characterList.style.display = 'none';
                characterCreation.style.display = 'block';
                createNewBtn.style.display = 'none';
                enterBtn.style.display = 'none';
            }, 300);
        }
    }
    
    function cancelCharacterCreation() {
        console.log('❌ Cancelar criação');
        
        const characterList = document.getElementById('characterList');
        const characterCreation = document.getElementById('characterCreation');
        const createNewBtn = document.getElementById('createNewCharacterBtn');
        const enterBtn = document.getElementById('enterWorldBtn');
        
        if (characterList && characterCreation && createNewBtn && enterBtn) {
            characterCreation.style.opacity = '0';
            setTimeout(() => {
                characterCreation.style.display = 'none';
                characterList.style.display = 'block';
                createNewBtn.style.display = 'block';
                
                // Habilitar botão entrar só se houver personagem selecionado
                const selectedChar = localStorage.getItem('selectedCharacter');
                if (enterBtn) {
                    enterBtn.disabled = !selectedChar;
                    enterBtn.style.opacity = selectedChar ? '1' : '0.5';
                }
            }, 300);
        }
    }
    
    function createCharacter() {
        console.log('👤 Criando personagem...');
        
        const name = document.getElementById('characterName')?.value?.trim();
        const race = document.getElementById('characterRace')?.value;
        const selectedClass = localStorage.getItem('selectedCharacter') || 'warrior';
        
        if (!name || !race) {
            showMessage('Preencha nome e raça', 'error');
            return;
        }
        
        // Salvar personagem
        const characters = JSON.parse(localStorage.getItem('characters') || '{}');
        
        if (!characters[selectedClass]) {
            characters[selectedClass] = [];
        }
        
        characters[selectedClass].push({
            name: name,
            race: race,
            class: selectedClass,
            level: 1,
            createdAt: new Date().toISOString()
        });
        
        localStorage.setItem('characters', JSON.stringify(characters));
        showMessage('Personagem criado com sucesso!', 'success');
        
        setTimeout(() => {
            cancelCharacterCreation();
        }, 1500);
    }
    
    function logout() {
        console.log('🚪 Sair da conta');
        
        localStorage.removeItem('currentUser');
        localStorage.removeItem('selectedCharacter');
        
        // Voltar para login
        const gameContainer = document.getElementById('gameContainer');
        const loginScreen = document.getElementById('loginScreen');
        
        if (gameContainer && loginScreen) {
            gameContainer.style.opacity = '0';
            setTimeout(() => {
                gameContainer.style.display = 'none';
                loginScreen.style.display = 'flex';
                loginScreen.style.opacity = '0';
                
                setTimeout(() => {
                    loginScreen.style.opacity = '1';
                }, 100);
            }, 300);
        }
    }`;
    
    // 2. Adicionar funções antes do fechamento do script
    const scriptEndPattern = /<\/script>/;
    if (scriptEndPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            scriptEndPattern,
            buttonFunctions + '\n    </script>'
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Funções dos botões adicionadas');
    }
    
    // 3. Verificar e adicionar onclick nos botões
    let updatedContent = fs.readFileSync(indexPath, 'utf8');
    
    // Botão Criar Novo Personagem
    updatedContent = updatedContent.replace(
        /<button id="createNewCharacterBtn"[^>]*>Criar Novo Personagem<\/button>/,
        '<button id="createNewCharacterBtn" class="login-button create-account" onclick="createNewCharacter()">Criar Novo Personagem</button>'
    );
    
    // Botão Entrar no Mundo
    updatedContent = updatedContent.replace(
        /<button id="enterWorldBtn"[^>]*>Entrar no Mundo<\/button>/,
        '<button id="enterWorldBtn" class="login-button" onclick="startGame()" disabled>Entrar no Mundo</button>'
    );
    
    // Botão Sair da Conta
    updatedContent = updatedContent.replace(
        /<button id="logoutBtn"[^>]*>Sair da Conta<\/button>/,
        '<button id="logoutBtn" class="login-button" style="background: #666;" onclick="logout()">Sair da Conta</button>'
    );
    
    // Botão Criar Aprendiz
    updatedContent = updatedContent.replace(
        /<button id="createCharacterBtn"[^>]*>Criar Aprendiz<\/button>/,
        '<button id="createCharacterBtn" class="login-button create-account" onclick="createCharacter()">Criar Aprendiz</button>'
    );
    
    // Botão Cancelar
    updatedContent = updatedContent.replace(
        /<button id="cancelCreationBtn"[^>]*>Cancelar<\/button>/,
        '<button id="cancelCreationBtn" class="login-button" style="background: #666;" onclick="cancelCharacterCreation()">Cancelar</button>'
    );
    
    fs.writeFileSync(indexPath, updatedContent);
    console.log('✅ Onclick adicionado em todos os botões');
    return true;
}

// Executar
console.log('🎯 Fix Character Buttons Final v0.1.0');
console.log('===============================\n');

const success = fixCharacterButtonsFinal();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Botões da tela de personagem corrigidos!');
    console.log('📝 Todos os botões com onclick funcionais');
    console.log('📝 Sistema de criação de personagem completo');
    console.log('📝 Funções de logout e navegação');
} else {
    console.log('\n❌ Falha ao corrigir botões');
}

console.log('\n✅ Script concluído!');
