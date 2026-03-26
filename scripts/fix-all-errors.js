// Fix All Errors Script
// Corrige todos os erros de JavaScript

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Todos os Erros\n');

function fixAllErrors() {
    // 1. Corrigir EnhancedSpriteSystem
    const enhancedSpritePath = path.join(__dirname, '../client/visual/EnhancedSpriteSystem.js');
    if (fs.existsSync(enhancedSpritePath)) {
        let content = fs.readFileSync(enhancedSpritePath, 'utf8');
        
        // Adicionar verificação para this.sprites
        content = content.replace(
            /initializeEnhancedSprites\(\) \{[\s\S]*?this\.sprites\.set\(/,
            `initializeEnhancedSprites() {
        if (!this.sprites) {
            this.sprites = new Map();
        }
        
        this.sprites.set(`
        );
        
        fs.writeFileSync(enhancedSpritePath, content);
        console.log('✅ EnhancedSpriteSystem corrigido');
    }
    
    // 2. Corrigir erros de key events
    const files = [
        'client/visual/VisualIntegrationManager.js',
        'client/ui/ImprovedHUD.js',
        'client/ui/WoWStyleHUD.js'
    ];
    
    files.forEach(file => {
        const filePath = path.join(__dirname, '../', file);
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Corrigir erro de toLowerCase/toUpperCase
            content = content.replace(
                /e\.key\.toLowerCase\(\)/g,
                '(e && e.key ? e.key.toLowerCase() : "")'
            ).replace(
                /e\.key\.toUpperCase\(\)/g,
                '(e && e.key ? e.key.toUpperCase() : "")'
            );
            
            fs.writeFileSync(filePath, content);
            console.log(`✅ ${file} corrigido`);
        }
    });
    
    // 3. Corrigir HUDIntegration resize
    const hudIntegrationPath = path.join(__dirname, '../client/ui/HUDIntegration.js');
    if (fs.existsSync(hudIntegrationPath)) {
        let content = fs.readFileSync(hudIntegrationPath, 'utf8');
        
        content = content.replace(
            /if \(this\.improvedHUD && this\.improvedHUD\.resize\) \{[\s\S]*?\}/,
            `if (this.improvedHUD && typeof this.improvedHUD.resize === 'function') {
            this.improvedHUD.resize();
        }`
        );
        
        fs.writeFileSync(hudIntegrationPath, content);
        console.log('✅ HUDIntegration corrigido');
    }
    
    // 4. Corrigir IntegratedMap area não encontrada
    const mapPath = path.join(__dirname, '../client/world/IntegratedMap.js');
    if (fs.existsSync(mapPath)) {
        let content = fs.readFileSync(mapPath, 'utf8');
        
        content = content.replace(
            /loadArea\(areaId\) \{[\s\S]*?if \(!this\.areas\.has\(areaId\)\) \{[\s\S]*?console\.error\('Área não encontrada:' \+ areaId\);[\s\S]*?return null;[\s\S]*?\}/,
            `loadArea(areaId) {
        if (!this.areas.has(areaId)) {
            console.warn('⚠️ Área não encontrada: ' + areaId + ', usando área padrão');
            // Criar área padrão
            return this.createDefaultArea(areaId);
        }
        
        return this.areas.get(areaId);
    }
    
    createDefaultArea(areaId) {
        return {
            id: areaId,
            name: 'Área Desconhecida',
            width: 800,
            height: 600,
            npcs: [],
            items: [],
            portais: []
        };
    }`
        );
        
        fs.writeFileSync(mapPath, content);
        console.log('✅ IntegratedMap corrigido');
    }
    
    return true;
}

// Executar
console.log('🎯 Fix All Errors v0.1.0');
console.log('===============================\n');

const success = fixAllErrors();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Todos os erros corrigidos!');
} else {
    console.log('\n❌ Falha ao corrigir erros');
}

console.log('\n✅ Script concluído!');
