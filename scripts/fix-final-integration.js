// Fix Final Integration Script
// Corrige integração final entre SimpleLoginManager e GameplayEngine

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Integração Final\n');

function fixFinalIntegration() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Limpar o script inline completamente
    console.log('📝 Limpando script inline...');
    
    // Encontrar o script inline e remover completamente
    const scriptPattern = /<script>[\s\S]*?<\/script>/g;
    const scripts = indexContent.match(scriptPattern);
    
    if (scripts && scripts.length > 0) {
        // Manter apenas os scripts de src, remover o inline
        let cleanedContent = indexContent;
        
        scripts.forEach(script => {
            if (!script.includes('src=')) {
                cleanedContent = cleanedContent.replace(script, '');
            }
        });
        
        indexContent = cleanedContent;
        console.log('✅ Scripts inline removidos');
    }
    
    // 2. Adicionar script simplificado no final
    const simplifiedScript = `
    <script>
    // Inicialização Simplificada - Eldoria MMORPG
    console.log('🌍 Iniciando Eldoria MMORPG...');
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 DOM carregado, inicializando sistemas...');
        
        // Instanciar sistemas principais
        const loginManager = new SimpleLoginManager();
        window._gameplayEngine = new GameplayEngine();
        const testAgent = new GameplayTestAgent();
        
        console.log('🎮 Sistemas inicializados');
        loginManager.setupEvents();
        
        // Opcional: Botão de teste manual
        const testBtn = document.createElement('button');
        testBtn.textContent = '🤖 Rodar Teste Automático';
        testBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 99999; background: #2196F3; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;';
        testBtn.onclick = () => {
            console.log('🤖 Iniciando teste automatizado...');
            // Teste manual se necessário
        };
        document.body.appendChild(testBtn);
        
        console.log('✅ Sistema inicializado com sucesso!');
    });
    </script>`;
    
    // Adicionar antes do </body>
    const bodyEndPattern = /<\/body>/;
    if (bodyEndPattern.test(indexContent)) {
        indexContent = indexContent.replace(bodyEndPattern, simplifiedScript + '\n</body>');
        console.log('✅ Script simplificado adicionado');
    }
    
    // Salvar arquivo
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Arquivo index.html salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Fix Final Integration v0.1.0');
console.log('===============================\n');

const success = fixFinalIntegration();

if (success) {
    console.log('\n🎮 Integração final corrigida!');
    console.log('📝 Scripts inline removidos');
    console.log('📝 Script simplificado adicionado');
    console.log('📝 SimpleLoginManager controlando telas');
    console.log('📝 GameplayEngine controlando jogo');
    console.log('📝 Separação clara de responsabilidades');
} else {
    console.log('\n❌ Falha ao corrigir integração');
}

console.log('\n✅ Script concluído!');
