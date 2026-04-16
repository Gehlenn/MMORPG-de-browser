// Fix CSP Final Script
// Corrige todos os erros de Content Security Policy

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Erros de CSP Final\n');

function fixCSPErrors() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Corrigir CSP para permitir recursos necessários
    const newCSP = `
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io https://cdnjs.cloudflare.com https://www.google.com https://ajax.googleapis.com;
        style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
        img-src 'self' data: blob:;
        font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com;
        connect-src 'self' ws://localhost:3000 http://localhost:3000 https://cdn.socket.io;
        media-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
    ">`;
    
    // 2. Substituir CSP antigo
    const oldCSPPattern = /<meta http-equiv="Content-Security-Policy" content="[^"]*">/g;
    
    if (oldCSPPattern.test(indexContent)) {
        indexContent = indexContent.replace(oldCSPPattern, newCSP.trim());
        console.log('✅ CSP atualizado para permitir recursos necessários');
    }
    
    // 3. Adicionar autocomplete nos formulários
    const usernameInputPattern = /<input type="text" id="username" class="form-input" placeholder="Nome de Usuário" maxlength="20">/;
    const passwordInputPattern = /<input type="password" id="password" class="form-input" placeholder="Senha" maxlength="30">/;
    const newUsernamePattern = /<input type="text" id="newUsername" class="form-input" placeholder="Nome de Usuário" maxlength="20">/;
    const newPasswordPattern = /<input type="password" id="newPassword" class="form-input" placeholder="Senha" maxlength="30">/;
    const confirmPasswordPattern = /<input type="password" id="confirmPassword" class="form-input" placeholder="Confirmar Senha" maxlength="30">/;
    const emailInputPattern = /<input type="email" id="newEmail" class="form-input" placeholder="E-mail" maxlength="50">/;
    const characterNamePattern = /<input type="text" id="characterName" class="form-input" placeholder="Nome do Personagem" maxlength="20">/;
    
    // Adicionar autocomplete
    indexContent = indexContent.replace(usernameInputPattern, '<input type="text" id="username" class="form-input" placeholder="Nome de Usuário" maxlength="20" autocomplete="username">');
    indexContent = indexContent.replace(passwordInputPattern, '<input type="password" id="password" class="form-input" placeholder="Senha" maxlength="30" autocomplete="current-password">');
    indexContent = indexContent.replace(newUsernamePattern, '<input type="text" id="newUsername" class="form-input" placeholder="Nome de Usuário" maxlength="20" autocomplete="new-username">');
    indexContent = indexContent.replace(newPasswordPattern, '<input type="password" id="newPassword" class="form-input" placeholder="Senha" maxlength="30" autocomplete="new-password">');
    indexContent = indexContent.replace(confirmPasswordPattern, '<input type="password" id="confirmPassword" class="form-input" placeholder="Confirmar Senha" maxlength="30" autocomplete="new-password">');
    indexContent = indexContent.replace(emailInputPattern, '<input type="email" id="newEmail" class="form-input" placeholder="E-mail" maxlength="50" autocomplete="email">');
    indexContent = indexContent.replace(characterNamePattern, '<input type="text" id="characterName" class="form-input" placeholder="Nome do Personagem" maxlength="20" autocomplete="off">');
    
    console.log('✅ Atributos autocomplete adicionados aos formulários');
    
    // 4. Remover eval() do código JavaScript se existir
    const evalPattern = /eval\(/g;
    if (evalPattern.test(indexContent)) {
        console.log('⚠️ Encontradas referências a eval() - considerando remover');
        // Nota: Não removeremos eval() automaticamente pois pode quebrar funcionalidades
    }
    
    // 5. Adicionar fontes Google Fonts se necessário
    const googleFontsLink = '<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">';
    
    if (!indexContent.includes('fonts.googleapis.com')) {
        indexContent = indexContent.replace(
            '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">',
            googleFontsLink + '\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">'
        );
        console.log('✅ Google Fonts adicionado ao CSP');
    }
    
    // 6. Salvar arquivo corrigido
    fs.writeFileSync(indexPath, indexContent);
    
    return true;
}

// Executar
console.log('🎯 Fix CSP Final v0.1.0');
console.log('===============================\n');

const success = fixCSPErrors();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🔒 Erros de CSP corrigidos!');
    console.log('📝 Recursos externos permitidos');
    console.log('📝 Eval() permitido para funcionalidades');
    console.log('📝 Autocomplete adicionado aos formulários');
    console.log('📝 Google Fonts incluído');
    
    console.log('\n📋 Recursos permitidos:');
    console.log('   • Scripts: Socket.io, Cloudflare, Google');
    console.log('   • Estilos: Cloudflare, Google Fonts');
    console.log('   • Fontes: Cloudflare, Google Fonts');
    console.log('   • Conexões: localhost:3000');
    console.log('   • Eval: Permitido para funcionalidades');
} else {
    console.log('\n❌ Falha ao corrigir CSP');
}

console.log('\n✅ Script concluído!');
