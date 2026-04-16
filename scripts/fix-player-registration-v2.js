// Fix Player Registration Script v2
// Corrige problema de registro de jogador no servidor

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Registro de Jogador v2\n');

function fixPlayerRegistration() {
    const serverPath = path.join(__dirname, '../server/server-simple-fixed.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server-simple-fixed.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Procurar pelo handler de login
    const loginHandler = /socket\.on\('login', \(data\) => \{[\s\S]*?console\.log\('Login request:', data\);/;
    
    if (loginHandler.test(serverContent)) {
        // Adicionar registro de jogador
        const fixedContent = serverContent.replace(
            loginHandler,
            `socket.on('login', (data) => {
                console.log('Login request:', data);
                
                // Registrar jogador na lista de jogadores
                this.players.set(socket.id, {
                    id: socket.id,
                    name: data.username || 'Player',
                    x: data.character?.x || 400,
                    y: data.character?.y || 300,
                    hp: 100,
                    maxHp: 100,
                    level: data.character?.level || 1,
                    class: data.character?.class || 'warrior'
                });
                
                console.log('✅ Jogador registrado:', data.username);`
        );
        
        fs.writeFileSync(serverPath, fixedContent);
        console.log('✅ Sistema de registro de jogador adicionado');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Fix Player Registration v0.2.0');
console.log('===============================\n');

const success = fixPlayerRegistration();

if (success) {
    console.log('\n🔄 Reinicie o servidor:');
    console.log('   taskkill /f /im node.exe');
    console.log('   node server/server-simple-fixed.js');
    
    console.log('\n🎮 Registro de jogador corrigido!');
} else {
    console.log('\n❌ Falha ao corrigir registro');
}

console.log('\n✅ Script concluído!');
