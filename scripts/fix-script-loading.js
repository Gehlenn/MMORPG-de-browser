// Fix Script Loading Script
// Corrige problema de carregamento de scripts que causa funções não definidas

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Carregamento de Scripts\n');

function fixScriptLoading() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Encontrar onde está o script principal
    const mainScriptPattern = /<script>[\s\S]*?function handleLogin\(\)[\s\S]*?<\/script>/;
    
    if (!mainScriptPattern.test(indexContent)) {
        console.log('❌ Script principal não encontrado no padrão esperado');
        return false;
    }
    
    // 2. Mover o script principal para o final do body, antes do </body>
    const bodyEndPattern = /<\/body>/;
    
    if (bodyEndPattern.test(indexContent)) {
        // Extrair o script principal
        const mainScriptMatch = indexContent.match(mainScriptPattern);
        const mainScript = mainScriptMatch[0];
        
        // Remover o script do local atual
        let updatedContent = indexContent.replace(mainScript, '');
        
        // Adicionar o script no final do body
        updatedContent = updatedContent.replace(
            bodyEndPattern,
            `    ${mainScript}
</body>`
        );
        
        // 3. Adicionar evento DOMContentLoaded para garantir que as funções estejam disponíveis
        const wrappedScript = updatedContent.replace(
            /<script>/,
            `<script>
    // Garantir que as funções estejam disponíveis globalmente
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 DOM carregado, configurando funções globais...');
        
        // Tornar funções disponíveis globalmente
        if (typeof handleLogin === 'function') {
            window.handleLogin = handleLogin;
            console.log('✅ handleLogin disponível globalmente');
        }
        
        if (typeof showCreateAccount === 'function') {
            window.showCreateAccount = showCreateAccount;
            console.log('✅ showCreateAccount disponível globalmente');
        }
        
        if (typeof handleCreateAccount === 'function') {
            window.handleCreateAccount = handleCreateAccount;
            console.log('✅ handleCreateAccount disponível globalmente');
        }
        
        if (typeof backToLogin === 'function') {
            window.backToLogin = backToLogin;
            console.log('✅ backToLogin disponível globalmente');
        }
        
        // Adicionar listeners aos botões como backup
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn && !loginBtn.hasAttribute('onclick')) {
            loginBtn.addEventListener('click', handleLogin);
            console.log('✅ Event listener adicionado ao botão de login');
        }
        
        const createAccountBtn = document.getElementById('showCreateAccountBtn');
        if (createAccountBtn && !createAccountBtn.hasAttribute('onclick')) {
            createAccountBtn.addEventListener('click', showCreateAccount);
            console.log('✅ Event listener adicionado ao botão criar conta');
        }
        
        console.log('🎮 Sistema de login inicializado com sucesso!');
    });
    
    // Funções principais
    `
        );
        
        fs.writeFileSync(indexPath, wrappedScript);
        console.log('✅ Script movido e configurado para carregamento correto');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Fix Script Loading v0.1.0');
console.log('===============================\n');

const success = fixScriptLoading();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Carregamento de scripts corrigido!');
    console.log('📝 Script principal movido para o final');
    console.log('📝 Funções disponíveis globalmente');
    console.log('📝 Event listeners como backup');
    console.log('📝 DOMContentLoaded garantido');
} else {
    console.log('\n❌ Falha ao corrigir carregamento de scripts');
}

console.log('\n✅ Script concluído!');
