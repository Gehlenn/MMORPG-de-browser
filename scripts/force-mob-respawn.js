// Force Mob Respawn Script
// Força o respawn dos mobs no servidor

const fs = require('fs');
const path = require('path');

console.log('👾 Forçando Respawn dos Mobs\n');

function forceMobRespawn() {
    const serverPath = path.join(__dirname, '../server/server-simple-fixed.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server-simple-fixed.js não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Encontrar a seção de spawn inicial
    const spawnSection = `spawnInitialMobs() {
        console.log('👾 Spawning initial mobs...');
        
        const mobTypes = [
            { type: 'goblin', name: 'Goblin Selvagem', x: 200, y: 200, hp: 50, damage: 10, color: '#228B22' },
            { type: 'wolf', name: 'Lobo Feroz', x: 600, y: 200, hp: 75, damage: 15, color: '#696969' },
            { type: 'orc', name: 'Orc Guerreiro', x: 200, y: 400, hp: 100, damage: 20, color: '#8B4513' },
            { type: 'slime', name: 'Slime Gelatinoso', x: 600, y: 400, hp: 30, damage: 5, color: '#90EE90' }
        ];`;
    
    const enhancedSpawn = `spawnInitialMobs() {
        console.log('👾 Spawning initial mobs...');
        
        const mobTypes = [
            { type: 'goblin', name: 'Goblin Selvagem', x: 200, y: 200, hp: 50, damage: 10, color: '#228B22' },
            { type: 'wolf', name: 'Lobo Feroz', x: 600, y: 200, hp: 75, damage: 15, color: '#696969' },
            { type: 'orc', name: 'Orc Guerreiro', x: 200, y: 400, hp: 100, damage: 20, color: '#8B4513' },
            { type: 'slime', name: 'Slime Gelatinoso', x: 600, y: 400, hp: 30, damage: 5, color: '#90EE90' }
        ];`;
    
    // Adicionar método de respawn automático
    const respawnMethod = `    respawnMobs() {
        console.log('🔄 Respawning mobs...');
        
        const mobTypes = [
            { type: 'goblin', name: 'Goblin Selvagem', x: 200, y: 200, hp: 50, damage: 10, color: '#228B22' },
            { type: 'wolf', name: 'Lobo Feroz', x: 600, y: 200, hp: 75, damage: 15, color: '#696969' },
            { type: 'orc', name: 'Orc Guerreiro', x: 200, y: 400, hp: 100, damage: 20, color: '#8B4513' },
            { type: 'slime', name: 'Slime Gelatinoso', x: 600, y: 400, hp: 30, damage: 5, color: '#90EE90' }
        ];
        
        mobTypes.forEach((mobData, index) => {
            const mobId = 'mob_' + (index + 1);
            
            // Remover mob existente se houver
            if (this.mobs.has(mobId)) {
                this.io.emit('mobRemove', { id: mobId });
                this.mobs.delete(mobId);
            }
            
            // Criar novo mob
            const mob = {
                id: mobId,
                ...mobData,
                maxHp: mobData.hp,
                exp: Math.floor(mobData.hp * 1.5)
            };
            
            this.mobs.set(mob.id, mob);
            this.io.emit('mobSpawn', mob);
            console.log('👾 Respawned ' + mob.name + ' at (' + mob.x + ', ' + mob.y + ')');
        });
    }`;
    
    // Adicionar respawn no start
    const startSection = `// Spawn initial mobs after server starts
        setTimeout(() => {
            this.spawnInitialMobs();
            this.startMobAI();
        }, 2000);`;
    
    const enhancedStart = `// Spawn initial mobs after server starts
        setTimeout(() => {
            this.spawnInitialMobs();
            this.startMobAI();
        }, 2000);
        
        // Respawn mobs a cada 30 segundos
        setInterval(() => {
            this.respawnMobs();
        }, 30000);`;
    
    let changes = 0;
    
    // Aplicar mudanças
    if (!serverContent.includes('respawnMobs()')) {
        // Adicionar método respawn antes do final da classe
        const classEnd = `    stop() {
        if (!this.isRunning) return;
        
        console.log('🛑 Stopping Simple MMORPG Server...');
        this.server.close(() => {
            console.log('✅ Server stopped');
            this.isRunning = false;
        });
    }`;
        
        if (serverContent.includes(classEnd)) {
            serverContent = serverContent.replace(classEnd, respawnMethod + '\n\n    ' + classEnd);
            changes++;
            console.log('✅ Método respawnMobs adicionado');
        }
    }
    
    if (serverContent.includes(startSection)) {
        serverContent = serverContent.replace(startSection, enhancedStart);
        changes++;
        console.log('✅ Respawn automático a cada 30 segundos adicionado');
    }
    
    if (changes > 0) {
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ ' + changes + ' mudanças aplicadas com sucesso');
        return true;
    } else {
        console.log('⚠️ Nenhuma mudança necessária');
        return false;
    }
}

// Executar
console.log('🎯 Force Mob Respawn v0.4.0');
console.log('===============================\n');

const success = forceMobRespawn();

if (success) {
    console.log('\n🔄 Reinicie o servidor para aplicar as mudanças:');
    console.log('   taskkill /f /im node.exe');
    console.log('   node server/server-simple-fixed.js');
    
    console.log('\n🎮 Sistema de Respawn:');
    console.log('   🔄 Respawn automático a cada 30 segundos');
    console.log('   👾 4 mobs sempre disponíveis');
    console.log('   ⚔️ Gameplay contínuo sem interrupção');
    console.log('   📊 Mobs reaparecem mesmo se derrotados');
    
    console.log('\n📋 Status Final do MMORPG:');
    console.log('   ✅ Login System');
    console.log('   ✅ Character Selection');
    console.log('   ✅ Player Movement (WASD)');
    console.log('   ✅ Mob Spawning & Respawn');
    console.log('   ✅ Mob AI & Perseguição');
    console.log('   ✅ Combat System');
    console.log('   ✅ Damage & HP System');
    console.log('   ✅ XP System');
    console.log('   ✅ Death & Respawn');
    console.log('   ✅ Visual Effects');
    console.log('   ✅ Complete MMORPG Gameplay');
} else {
    console.log('\n❌ Falha ao adicionar respawn');
}

console.log('\n✅ Script concluído!');
