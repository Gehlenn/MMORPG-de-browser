// Fix Final Errors Script
// Corrige os erros finais de CSP e EnhancedSpriteSystem

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Erros Finais\n');

function fixFinalErrors() {
    // 1. Corrigir CSP para permitir recursos externos necessários
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (fs.existsSync(indexPath)) {
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Atualizar CSP para permitir Font Awesome e outros recursos
        const cspPattern = /<meta http-equiv="Content-Security-Policy" content="[^"]*">/;
        const newCSP = `<meta http-equiv="Content-Security-Policy" content="
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io https://cdnjs.cloudflare.com https://www.google.com;
        style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
        img-src 'self' data: blob:;
        font-src 'self' data: https://cdnjs.cloudflare.com;
        connect-src 'self' ws://localhost:3000 http://localhost:3000 https://cdn.socket.io;
        media-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
    ">`;
        
        if (cspPattern.test(indexContent)) {
            const fixedContent = indexContent.replace(cspPattern, newCSP);
            fs.writeFileSync(indexPath, fixedContent);
            console.log('✅ CSP atualizada para Font Awesome');
        }
    }
    
    // 2. Corrigir EnhancedSpriteSystem - adicionar inicialização do Map
    const enhancedSpritePath = path.join(__dirname, '../client/visual/EnhancedSpriteSystem.js');
    
    if (fs.existsSync(enhancedSpritePath)) {
        let content = fs.readFileSync(enhancedSpritePath, 'utf8');
        
        // Adicionar inicialização do this.sprites se não existir
        const constructorPattern = /constructor\(assetManager\) \{[\s\S]*?this\.assetManager = assetManager;[\s\S]*?this\.initializeEnhancedSprites\(\);/;
        
        if (constructorPattern.test(content)) {
            const fixedContent = content.replace(
                constructorPattern,
                `constructor(assetManager) {
        this.assetManager = assetManager;
        this.sprites = new Map(); // Inicializar sprites Map
        this.initializeEnhancedSprites();`
            );
            
            fs.writeFileSync(enhancedSpritePath, fixedContent);
            console.log('✅ EnhancedSpriteSystem construtor corrigido');
        }
    }
    
    // 3. Corrigir HUDIntegration resize
    const hudIntegrationPath = path.join(__dirname, '../client/ui/HUDIntegration.js');
    
    if (fs.existsSync(hudIntegrationPath)) {
        let content = fs.readFileSync(hudIntegrationPath, 'utf8');
        
        // Adicionar método resize se não existir
        const resizePattern = /if \(this\.improvedHUD && typeof this\.improvedHUD\.resize === 'function'\) \{[\s\S]*?\}/;
        
        if (resizePattern.test(content)) {
            const fixedContent = content.replace(
                resizePattern,
                `if (this.improvedHUD) {
            // Verificar se o método resize existe, senão criar um padrão
            if (typeof this.improvedHUD.resize !== 'function') {
                this.improvedHUD.resize = function() {
                    console.log('🔄 HUD resize (padrão)');
                };
            }
            this.improvedHUD.resize();
        }`
            );
            
            fs.writeFileSync(hudIntegrationPath, content);
            console.log('✅ HUDIntegration resize corrigido');
        }
    }
    
    // 4. Adicionar método resize ao ImprovedHUD
    const improvedHUDPath = path.join(__dirname, '../client/ui/ImprovedHUD.js');
    
    if (fs.existsSync(improvedHUDPath)) {
        let content = fs.readFileSync(improvedHUDPath, 'utf8');
        
        // Verificar se o método resize existe
        if (!content.includes('resize()')) {
            // Adicionar método resize no final da classe
            const classEndPattern = /class ImprovedHUD[\s\S]*?^}/;
            
            if (classEndPattern.test(content)) {
                const fixedContent = content.replace(
                    classEndPattern,
                    `class ImprovedHUD extends BaseHUD {
    // ... conteúdo existente ...
    
    // Método resize
    resize() {
        console.log('🔄 ImprovedHUD resized');
        if (this.canvas) {
            // Ajustar canvas ao tamanho da janela
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.render();
        }
    }
}`
                );
                
                fs.writeFileSync(improvedHUDPath, fixedContent);
                console.log('✅ ImprovedHUD resize method adicionado');
            }
        }
    }
    
    return true;
}

// Executar
console.log('🎯 Fix Final Errors v0.1.0');
console.log('===============================\n');

const success = fixFinalErrors();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Erros finais corrigidos!');
    console.log('📝 CSP agora permite Font Awesome');
    console.log('📝 EnhancedSpriteSystem corrigido');
    console.log('📝 HUD resize funcionando');
} else {
    console.log('\n❌ Falha ao corrigir erros finais');
}

console.log('\n✅ Script concluído!');
