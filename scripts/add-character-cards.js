// Add Character Cards Script
// Adiciona os cards de personagem faltantes no HTML

const fs = require('fs');
const path = require('path');

console.log('🔧 Adicionando Cards de Personagem\n');

function addCharacterCards() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Encontrar onde inserir os cards
    const characterListPattern = /<div id="characterList" class="character-list"><\/div>/;
    
    if (!characterListPattern.test(indexContent)) {
        console.log('❌ characterList não encontrado');
        return false;
    }
    
    // 2. Criar HTML dos cards de personagem
    const characterCardsHTML = `
                <div class="character-card" onclick="selectCharacter('warrior')">
                    <h3>⚔️ Guerreiro</h3>
                    <p>Classe equilibrada com alta defesa</p>
                    <div class="character-stats">
                        <span>HP: 120</span>
                        <span>FOR: 15</span>
                        <span>DEF: 10</span>
                    </div>
                </div>
                
                <div class="character-card" onclick="selectCharacter('mage')">
                    <h3>🧙 Mago</h3>
                    <p>Mestre das artes mágicas</p>
                    <div class="character-stats">
                        <span>HP: 80</span>
                        <span>INT: 15</span>
                        <span>DEF: 5</span>
                    </div>
                </div>
                
                <div class="character-card" onclick="selectCharacter('ranger')">
                    <h3>🏹 Arqueiro</h3>
                    <p>Especialista em ataques à distância</p>
                    <div class="character-stats">
                        <span>HP: 100</span>
                        <span>AGI: 15</span>
                        <span>DEF: 8</span>
                    </div>
                </div>
                
                <div class="character-card" onclick="selectCharacter('rogue')">
                    <h3>🗡️ Ladino</h3>
                    <p>Ágil e furtivo, especialista em armadilhas</p>
                    <div class="character-stats">
                        <span>HP: 90</span>
                        <span>AGI: 12</span>
                        <span>DEF: 6</span>
                    </div>
                </div>`;
    
    // 3. CSS para os cards de personagem
    const characterCardCSS = `
        .character-stats {
            display: flex;
            justify-content: space-around;
            margin-top: 10px;
            font-size: 0.8em;
        }
        
        .character-stats span {
            background: rgba(255, 255, 255, 0.1);
            padding: 2px 6px;
            border-radius: 3px;
            margin: 0 2px;
        }
        
        .character-card:nth-child(1) .character-stats span:first-child {
            background: rgba(76, 175, 80, 0.2);
        }
        
        .character-card:nth-child(2) .character-stats span:nth-child(2) {
            background: rgba(33, 150, 243, 0.2);
        }
        
        .character-card:nth-child(3) .character-stats span:nth-child(3) {
            background: rgba(76, 175, 80, 0.2);
        }
        
        .character-card:nth-child(4) .character-stats span:first-child {
            background: rgba(156, 39, 176, 0.2);
        }
    `;
    
    // 4. Adicionar CSS para os stats
    const headPattern = /<\/style>/;
    if (headPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            headPattern,
            characterCardCSS + '\n    </style>'
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ CSS dos cards de personagem adicionado');
    }
    
    // 5. Adicionar os cards no HTML
    const updatedContent = fs.readFileSync(indexPath, 'utf8');
    const finalContent = updatedContent.replace(
        characterListPattern,
        `<div id="characterList" class="character-list">
${characterCardsHTML}
                </div>`
    );
    
    fs.writeFileSync(indexPath, finalContent);
    console.log('✅ Cards de personagem adicionados');
    return true;
}

// Executar
console.log('🎯 Add Character Cards v0.1.0');
console.log('===============================\n');

const success = addCharacterCards();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Cards de personagem adicionados!');
    console.log('📝 4 classes disponíveis: Guerreiro, Mago, Arqueiro, Ladino');
    console.log('📝 Cards com stats visuais');
    console.log('📝 Botões com onclick funcionais');
} else {
    console.log('\n❌ Falha ao adicionar cards');
}

console.log('\n✅ Script concluído!');
