// Create Visual Map Canvas Script
// Cria o canvas visual-map-canvas que está faltando

const fs = require('fs');
const path = require('path');

console.log('🔧 Criando Canvas Visual Map\n');

function createVisualMapCanvas() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Procurar pelo gameCanvas
    const gameCanvasPattern = /<canvas id="gameCanvas"><\/canvas>/;
    
    if (gameCanvasPattern.test(indexContent)) {
        // Adicionar visual-map-canvas antes do gameCanvas
        const fixedContent = indexContent.replace(
            gameCanvasPattern,
            `        <canvas id="visual-map-canvas" style="display: none;"></canvas>
        <!-- Game Canvas -->
        <canvas id="gameCanvas"></canvas>`
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Canvas visual-map-canvas criado');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Create Visual Map Canvas v0.1.0');
console.log('===============================\n');

const success = createVisualMapCanvas();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Canvas visual-map criado!');
} else {
    console.log('\n❌ Falha ao criar canvas');
}

console.log('\n✅ Script concluído!');
