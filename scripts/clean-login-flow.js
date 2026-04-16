// Clean Login Flow Script
// Remove código automático e consolida fluxo único de login

const fs = require('fs');
const path = require('path');

console.log('🔧 Limpando Fluxo de Login\n');

function cleanLoginFlow() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Remover scripts inline duplicados e código automático
    console.log('📝 Removendo código automático...');
    
    // Encontrar e remover scripts inline que não são o principal
    const scriptPattern = /<script>[\s\S]*?<\/script>/g;
    const scripts = indexContent.match(scriptPattern);
    
    if (scripts && scripts.length > 0) {
        let cleanedContent = indexContent;
        
        scripts.forEach(script => {
            // Manter apenas o script principal (que tem SimpleLoginManager)
            if (!script.includes('SimpleLoginManager')) {
                cleanedContent = cleanedContent.replace(script, '');
                console.log('✅ Script automático removido');
            } else {
                // Limpar o script principal para ficar só o essencial
                const cleanedScript = script.replace(/\/\/ Variáveis globais[\s\S]*?console\.log\('🎮 Eldoria MMORPG pronto!'\);?\s*?\}\);?\s*?<\/script>/, 
                    `    // Inicialização simplificada
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 DOM carregado, inicializando sistemas...');
        
        // Instanciar sistemas principais
        const loginManager = new SimpleLoginManager();
        window._gameplayEngine = new GameplayEngine();
        const testAgent = new GameplayTestAgent();
        
        console.log('🎮 Sistemas inicializados');
        loginManager.setupEvents();
        
        // TODO: Teste automático comentado - remover quando necessário
        // const testBtn = document.createElement('button');
        // testBtn.textContent = '🤖 Rodar Teste Automático';
        // testBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 99999; background: #2196F3; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;';
        // testBtn.onclick = () => {
        //     console.log('🤖 Iniciando teste automatizado...');
        // };
        // document.body.appendChild(testBtn);
        
        console.log('✅ Sistema inicializado com sucesso!');
    });`);
                
                cleanedContent = cleanedContent.replace(script, cleanedScript);
                console.log('✅ Script principal limpo');
            }
        });
        
        indexContent = cleanedContent;
    }
    
    // Salvar arquivo
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Arquivo index.html salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Clean Login Flow v0.1.0');
console.log('===============================\n');

const success = cleanLoginFlow();

if (success) {
    console.log('\n🎮 Fluxo de login limpo!');
    console.log('📝 Código automático removido');
    console.log('📝 Botão de teste comentado');
    console.log('📝 Apenas login manual ativo');
    console.log('📝 Fluxo único consolidado');
} else {
    console.log('\n❌ Falha ao limpar fluxo');
}

console.log('\n✅ Script concluído!');
