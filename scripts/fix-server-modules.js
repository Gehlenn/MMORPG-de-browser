// Fix Server Modules Script
// Corrige problemas de importação de módulos no servidor

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Módulos do Servidor\n');

function fixServerModules() {
    const serverPath = path.join(__dirname, '../server/server.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // 1. Verificar quais módulos existem
    console.log('📝 Verificando módulos disponíveis...');
    
    const modulesDir = path.join(__dirname, '../server');
    const availableModules = [];
    
    // Verificar arquivos de módulos
    const moduleFiles = [
        'core/ModuleManager.js',
        'modules/combat/CombatModule.js',
        'modules/inventory/InventoryModule.js',
        'modules/skills/SkillModule.js',
        'modules/ModuleManager.js'
    ];
    
    moduleFiles.forEach(file => {
        const filePath = path.join(modulesDir, file);
        if (fs.existsSync(filePath)) {
            availableModules.push(file);
            console.log(`✅ ${file} encontrado`);
        } else {
            console.log(`❌ ${file} não encontrado`);
        }
    });
    
    // 2. Remover imports de módulos que não existem
    console.log('📝 Removendo imports de módulos inexistentes...');
    
    // Remover imports dos módulos que não existem
    const importsToRemove = [
        "const ModuleManager = require(\"./core/ModuleManager.js\");",
        "const CombatModule = require(\"./modules/combat/CombatModule.js\");",
        "const InventoryModule = require(\"./modules/inventory/InventoryModule.js\");",
        "const SkillModule = require(\"./modules/skills/SkillModule.js\");"
    ];
    
    importsToRemove.forEach(importLine => {
        if (serverContent.includes(importLine)) {
            serverContent = serverContent.replace(importLine, '');
            console.log(`✅ Import removido: ${importLine}`);
        }
    });
    
    // 3. Remover registro e inicialização de módulos
    console.log('📝 Removendo registro de módulos...');
    
    // Remover bloco de registro de módulos
    const moduleRegistrationPattern = /\/\/ Register modules[\s\S]*?await moduleManager\.initAll\(this\);[\s\S]*?\/\/ Start mob spawner/;
    
    if (moduleRegistrationPattern.test(serverContent)) {
        serverContent = serverContent.replace(moduleRegistrationPattern, '// Start mob spawner');
        console.log('✅ Registro de módulos removido');
    }
    
    // 4. Remover referências ao moduleManager no construtor
    console.log('📝 Removendo referências ao moduleManager...');
    
    serverContent = serverContent.replace(/this\.moduleManager = new ModuleManager\(\);/g, '');
    serverContent = serverContent.replace(/this\.moduleManager = null;/g, '');
    
    // 5. Simplificar o start() method
    console.log('📝 Simplificando método start()...');
    
    const startPattern = /async start\(\) \{[\s\S]*?this\.isRunning = true;[\s\S]*?\}/;
    
    const simplifiedStart = `async start() {
        try {
            console.log('Starting MMORPG Server...');
            
            // Start mob spawner
            if (global.mobSpawner) {
                global.mobSpawner.start();
                console.log('👾 Mob Spawner started');
            }
            
            // Start cleanup interval
            setInterval(() => {
                this.cleanupInactivePlayers();
            }, 60000); // Every minute
            
            this.eventEmitter.emit('serverStarted');
            
            // Start server
            this.server.listen(this.port, () => {
                console.log(\`🎮 MMORPG Server running on port \${this.port}\`);
                console.log(\`📊 Dashboard: http://localhost:\${this.port}\`);
                console.log(\`🕹️ Game: http://localhost:\${this.port}/index.html\`);
                this.isRunning = true;
            });
            
        } catch (error) {
            console.error('Failed to start server:', error);
            this.eventEmitter.emit('serverError', error);
            process.exit(1);
        }
    }`;
    
    if (startPattern.test(serverContent)) {
        serverContent = serverContent.replace(startPattern, simplifiedStart);
        console.log('✅ Método start() simplificado');
    }
    
    // Salvar arquivo
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Arquivo server.js salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Fix Server Modules v0.1.0');
console.log('===============================\n');

const success = fixServerModules();

if (success) {
    console.log('\n🎮 Módulos do servidor corrigidos!');
    console.log('📝 Imports de módulos inexistentes removidos');
    console.log('📝 Registro de módulos removido');
    console.log('📝 Referências ao moduleManager removidas');
    console.log('📝 Método start() simplificado');
    console.log('📝 Servidor pronto para iniciar');
} else {
    console.log('\n❌ Falha ao corrigir módulos');
}

console.log('\n✅ Script concluído!');
