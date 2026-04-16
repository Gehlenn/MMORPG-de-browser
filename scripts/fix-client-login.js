// Fix Client Login Script
// Corrige problemas de login no cliente

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Login do Cliente\n');

function fixClientLogin() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Procurar pelo erro de inicialização
    const errorPattern = /❌ Erro ao inicializar sistemas: \{\}/;
    
    if (errorPattern.test(indexContent)) {
        // Adicionar try-catch em volta da inicialização
        const fixedContent = indexContent.replace(
            /try \{[\s\S]*?console\.log\('✅ Todos os scripts carregados com sucesso'\);[\s\S]*?\} catch \(error\) \{[\s\S]*?console\.error\('❌ Erro ao inicializar sistemas:', error\);[\s\S]*?\}/,
            `try {
                // Inicializar sistemas na ordem correta
                initializeSystems();
            } catch (error) {
                console.error('❌ Erro ao inicializar sistemas:', error);
                
                // Tentar inicialização segura
                try {
                    initializeSafely();
                } catch (safeError) {
                    console.error('❌ Erro na inicialização segura:', safeError);
                    
                    // Fallback - mostrar login básico
                    showBasicLogin();
                }
            }`
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Sistema de login corrigido');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Fix Client Login v0.1.0');
console.log('===============================\n');

const success = fixClientLogin();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Login do cliente corrigido!');
} else {
    console.log('\n❌ Falha ao corrigir login');
}

console.log('\n✅ Script concluído!');
