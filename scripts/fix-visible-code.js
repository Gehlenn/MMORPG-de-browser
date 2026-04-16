// Fix Visible Code Script
// Esconde o código JavaScript que está aparecendo na tela

const fs = require('fs');
const path = require('path');

console.log('🔧 Escondendo Código Visível\n');

function fixVisibleCode() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Procurar pelo código que está fora das tags <script>
    const visibleCodePattern = /[\s\S]*?<\/script>[\s\S]*?function initializeGameplay[\s\S]*?function setupControls[\s\S]*?<\/script>/;
    
    // Encontrar onde o código está escapando das tags script
    const scriptEndPattern = /<\/script>/g;
    const matches = indexContent.match(scriptEndPattern);
    
    if (matches && matches.length > 1) {
        console.log('❌ Encontradas múltiplas tags </script> - código escapando');
        
        // Juntar todos os scripts em um só
        const allScriptContent = indexContent.match(/<script>[\s\S]*?<\/script>/g);
        
        if (allScriptContent && allScriptContent.length > 0) {
            // Combinar todo o conteúdo JavaScript
            let combinedJS = '';
            allScriptContent.forEach(script => {
                const content = script.replace(/<\/?script>/g, '');
                combinedJS += content + '\n';
            });
            
            // Encontrar onde começa o primeiro script e onde termina o último
            const firstScriptStart = indexContent.indexOf('<script>');
            const lastScriptEnd = indexContent.lastIndexOf('</script>');
            
            if (firstScriptStart !== -1 && lastScriptEnd !== -1) {
                // Reconstruir o HTML com um só script
                const beforeScript = indexContent.substring(0, firstScriptStart);
                const afterScript = indexContent.substring(lastScriptEnd + 9);
                
                const fixedContent = beforeScript + 
                    '<script>\n' + 
                    combinedJS + 
                    '\n</script>' + 
                    afterScript;
                
                fs.writeFileSync(indexPath, fixedContent);
                console.log('✅ Scripts combinados e código escondido');
                return true;
            }
        }
    }
    
    // Alternativa: procurar por código JavaScript fora de tags script
    const jsOutsideScriptPattern = /function initializeGameplay[\s\S]*?function setupControls[\s\S]*?console\.log\('✅ Controles configurados'\);[\s\S]*?}/;
    
    if (jsOutsideScriptPattern.test(indexContent)) {
        // Encontrar e remover o código visível
        const fixedContent = indexContent.replace(
            jsOutsideScriptPattern,
            ''
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Código JavaScript visível removido');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Fix Visible Code v0.1.0');
console.log('===============================\n');

const success = fixVisibleCode();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Código visível corrigido!');
    console.log('📝 O JavaScript não deve mais aparecer na tela');
} else {
    console.log('\n❌ Falha ao corrigir código visível');
    console.log('📝 Verificando estrutura do arquivo...');
    
    // Verificar estrutura
    const indexPath = path.join(__dirname, '../client/index.html');
    if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf8');
        const scriptTags = content.match(/<script>|<\/script>/g);
        console.log('Tags script encontradas:', scriptTags ? scriptTags.length : 0);
    }
}

console.log('\n✅ Script concluído!');
