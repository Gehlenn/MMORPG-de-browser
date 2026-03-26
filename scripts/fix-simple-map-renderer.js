// Fix Simple Map Renderer Script
// Corrige erro canvas.getContext is not a function

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Simple Map Renderer\n');

function fixSimpleMapRenderer() {
    const rendererPath = path.join(__dirname, '../client/world/SimpleMapRenderer.js');
    
    if (!fs.existsSync(rendererPath)) {
        console.error('❌ SimpleMapRenderer.js não encontrado');
        return false;
    }
    
    let rendererContent = fs.readFileSync(rendererPath, 'utf8');
    
    // Procurar pelo construtor
    const constructorPattern = /constructor\(canvasId, spriteSystem\) \{[\s\S]*?this\.canvas = document\.getElementById\(canvasId\);[\s\S]*?this\.ctx = this\.canvas\.getContext\('2d'\);/;
    
    if (constructorPattern.test(rendererContent)) {
        // Adicionar verificação de canvas
        const fixedContent = rendererContent.replace(
            constructorPattern,
            `constructor(canvasId, spriteSystem) {
        this.spriteSystem = spriteSystem;
        
        if (canvasId && typeof canvasId === 'string') {
            this.canvas = document.getElementById(canvasId);
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                console.log('✅ SimpleMapRenderer canvas configurado:', canvasId);
            } else {
                console.warn('⚠️ Canvas não encontrado:', canvasId);
                this.canvas = null;
                this.ctx = null;
            }
        } else if (canvasId && canvasId.getContext) {
            // Se canvasId já é um elemento canvas
            this.canvas = canvasId;
            this.ctx = canvasId.getContext('2d');
            console.log('✅ SimpleMapRenderer canvas direto configurado');
        } else {
            console.warn('⚠️ Canvas inválido fornecido para SimpleMapRenderer');
            this.canvas = null;
            this.ctx = null;
        }`
        );
        
        fs.writeFileSync(rendererPath, fixedContent);
        console.log('✅ SimpleMapRenderer corrigido');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Fix Simple Map Renderer v0.1.0');
console.log('===============================\n');

const success = fixSimpleMapRenderer();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 SimpleMapRenderer corrigido!');
} else {
    console.log('\n❌ Falha ao corrigir SimpleMapRenderer');
}

console.log('\n✅ Script concluído!');
