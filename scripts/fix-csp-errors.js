// Fix CSP Errors Script
// Corrige erros de Content Security Policy

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Erros de CSP\n');

function fixCSPErrors() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Adicionar meta tag CSP adequada
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io https://www.google.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob:;
        font-src 'self' data:;
        connect-src 'self' ws://localhost:3000 http://localhost:3000;
        media-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
    ">`;
    
    // Procurar pela tag head existente
    const headPattern = /<head>/;
    
    if (headPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            headPattern,
            `<head>\n    ${cspMeta}`
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ CSP meta tag adicionada');
    } else {
        console.log('❌ Tag head não encontrada');
        return false;
    }
    
    // Corrigir também o arquivo de teste
    const testPath = path.join(__dirname, '../client/test-auto.html');
    if (fs.existsSync(testPath)) {
        let testContent = fs.readFileSync(testPath, 'utf8');
        
        if (headPattern.test(testContent)) {
            const fixedTestContent = testContent.replace(
                headPattern,
                `<head>\n    <meta http-equiv="Content-Security-Policy" content="
                    default-src 'self';
                    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io;
                    style-src 'self' 'unsafe-inline';
                    img-src 'self' data: blob:;
                    font-src 'self' data:;
                    connect-src 'self' ws://localhost:3000 http://localhost:3000;
                    media-src 'self';
                    object-src 'none';
                    base-uri 'self';
                    form-action 'self';
                    frame-ancestors 'none';
                ">`
            );
            
            fs.writeFileSync(testPath, fixedTestContent);
            console.log('✅ CSP meta tag adicionada ao teste');
        }
    }
    
    return true;
}

// Executar
console.log('🎯 Fix CSP Errors v0.1.0');
console.log('===============================\n');

const success = fixCSPErrors();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Erros de CSP corrigidos!');
    console.log('📝 Os erros de Content Security Policy devem desaparecer');
} else {
    console.log('\n❌ Falha ao corrigir CSP');
}

console.log('\n✅ Script concluído!');
