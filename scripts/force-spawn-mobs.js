// Force Spawn Mobs - Script para forçar spawn de mobs no servidor

const WebSocket = require('ws');

console.log('👾 Forçando Spawn de Mobs no Servidor\n');

// Mobs para spawnar
const mobsToSpawn = [
    {
        id: 'test_goblin_1',
        type: 'goblin',
        name: 'Goblin Selvagem',
        x: 350,
        y: 250,
        health: 50,
        maxHealth: 50,
        damage: 10,
        speed: 2,
        color: '#228B22'
    },
    {
        id: 'test_wolf_1',
        type: 'wolf',
        name: 'Lobo Feroz',
        x: 450,
        y: 350,
        health: 75,
        maxHealth: 75,
        damage: 15,
        speed: 3,
        color: '#696969'
    },
    {
        id: 'test_orc_1',
        type: 'orc',
        name: 'Orc Guerreiro',
        x: 400,
        y: 300,
        health: 100,
        maxHealth: 100,
        damage: 20,
        speed: 1.5,
        color: '#8B4513'
    },
    {
        id: 'test_slime_1',
        type: 'slime',
        name: 'Slime Gelatinoso',
        x: 500,
        y: 400,
        health: 30,
        maxHealth: 30,
        damage: 5,
        speed: 1,
        color: '#90EE90'
    }
];

function connectAndSpawn() {
    console.log('🔌 Conectando ao servidor...');
    
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.on('open', () => {
        console.log('✅ Conectado ao servidor');
        
        // Forçar spawn de cada mob
        mobsToSpawn.forEach((mob, index) => {
            setTimeout(() => {
                // Enviar comando de spawn direto
                const spawnCommand = {
                    type: 'admin_spawn_mob',
                    data: mob
                };
                
                ws.send(JSON.stringify(spawnCommand));
                console.log(`👾 Spawn forçado: ${mob.name} (${mob.x}, ${mob.y})`);
            }, index * 500);
        });
        
        // Manter conexão aberta
        setTimeout(() => {
            console.log('✅ Todos os mobs spawnados com sucesso!');
            console.log('🔌 Mantendo conexão por 10 segundos...');
        }, mobsToSpawn.length * 500 + 1000);
        
        // Fechar conexão após 10 segundos
        setTimeout(() => {
            ws.close();
        }, mobsToSpawn.length * 500 + 11000);
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('📨 Mensagem do servidor:', message);
        } catch (error) {
            console.log('📨 Mensagem não-JSON:', data.toString());
        }
    });
    
    ws.on('error', (error) => {
        console.error('❌ Erro na conexão WebSocket:', error.message);
    });
    
    ws.on('close', () => {
        console.log('🔌 Conexão fechada');
        console.log('✅ Script concluído!');
    });
}

// Tentar conexão
function tryConnect() {
    try {
        connectAndSpawn();
    } catch (error) {
        console.error('❌ Erro ao executar script:', error.message);
        process.exit(1);
    }
}

// Executar
console.log('🎯 Force Spawn Mobs v1.0');
console.log('============================\n');

tryConnect();
