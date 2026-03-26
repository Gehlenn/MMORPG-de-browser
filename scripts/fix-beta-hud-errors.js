// Fix Beta HUD Errors Script
// Corrige erros no BetaHUD.handleSkillClick

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Erros do Beta HUD\n');

function fixBetaHUDErrors() {
    const betaHUDPath = path.join(__dirname, '../client/ui/BetaHUD.js');
    
    if (!fs.existsSync(betaHUDPath)) {
        console.error('❌ BetaHUD.js não encontrado');
        return false;
    }
    
    let betaHUDContent = fs.readFileSync(betaHUDPath, 'utf8');
    
    // Procurar pelo erro no handleSkillClick
    const errorPattern = /handleSkillClick\(index\) \{[\s\S]*?this\.skills\[index\]/;
    
    if (errorPattern.test(betaHUDContent)) {
        // Adicionar verificação de null
        const fixedContent = betaHUDContent.replace(
            errorPattern,
            `handleSkillClick(index) {
        if (!this.skills || !this.skills[index]) {
            console.warn('⚠️ Skill não encontrado no índice:', index);
            return;
        }
        
        const skill = this.skills[index];`
        );
        
        fs.writeFileSync(betaHUDPath, fixedContent);
        console.log('✅ BetaHUD.handleSkillClick corrigido');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Fix Beta HUD Errors v0.1.0');
console.log('===============================\n');

const success = fixBetaHUDErrors();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Erros do Beta HUD corrigidos!');
} else {
    console.log('\n❌ Falha ao corrigir Beta HUD');
}

console.log('\n✅ Script concluído!');
