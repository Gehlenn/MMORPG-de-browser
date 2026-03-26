// Fix Login Errors Script
// Corrige erros de login e inicialização

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Erros de Login e Inicialização\n');

function fixLoginErrors() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Procurar pelo erro do SimpleMapRenderer
    const mapRendererError = indexContent.includes('SimpleMapRenderer.js:9:27');
    
    if (mapRendererError) {
        // Adicionar verificação de null antes de inicializar
        const fixedContent = indexContent.replace(
            /new SimpleMapRenderer\('visual-map-canvas'\)/g,
            'document.getElementById("visual-map-canvas") ? new SimpleMapRenderer("visual-map-canvas") : null'
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Erro do SimpleMapRenderer corrigido');
    }
    
    // Corrigir erro do BetaHUD
    const betaHUDPath = path.join(__dirname, '../client/ui/BetaHUD.js');
    if (fs.existsSync(betaHUDPath)) {
        let betaHUDContent = fs.readFileSync(betaHUDPath, 'utf8');
        
        // Adicionar verificação de null em handleSkillClick
        const fixedBetaHUD = betaHUDContent.replace(
            /handleSkillClick\(skillIndex\) \{[\s\S]*?const skill = this\.skills\[skillIndex\];/g,
            `handleSkillClick(skillIndex) {
        if (!this.skills || !this.skills[skillIndex]) {
            console.warn('Skill não encontrado:', skillIndex);
            return;
        }
        const skill = this.skills[skillIndex];`
        );
        
        fs.writeFileSync(betaHUDPath, fixedBetaHUD);
        console.log('✅ Erro do BetaHUD corrigido');
    }
    
    // Corrigir erro do VisualIntegrationManager
    const visualManagerPath = path.join(__dirname, '../client/visual/VisualIntegrationManager.js');
    if (fs.existsSync(visualManagerPath)) {
        let visualManagerContent = fs.readFileSync(visualManagerPath, 'utf8');
        
        // Adicionar verificação de null em resizeCanvas
        const fixedVisualManager = visualManagerContent.replace(
            /resizeCanvas\(\) \{[\s\S]*?this\.mapRenderer\.resize\(/g,
            `resizeCanvas() {
        if (this.mapRenderer && this.mapRenderer.resize) {
            this.mapRenderer.resize(`
        );
        
        fs.writeFileSync(visualManagerPath, fixedVisualManager);
        console.log('✅ Erro do VisualIntegrationManager corrigido');
    }
    
    return true;
}

// Executar
console.log('🎯 Fix Login Errors v0.1.0');
console.log('===============================\n');

const success = fixLoginErrors();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Erros corrigidos!');
} else {
    console.log('\n❌ Falha ao corrigir erros');
}

console.log('\n✅ Script concluído!');
