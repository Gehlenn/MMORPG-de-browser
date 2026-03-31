// Integrate Systems into GameplayEngine Script
// Integra QuestSystem, ZoneSystem, ProgressionSystem e NPCSystem

const fs = require('fs');
const path = require('path');

console.log('🔧 Integrando Sistemas no GameplayEngine\n');

function integrateSystems() {
    const gameplayEnginePath = path.join(__dirname, '../client/modes/offline/GameplayEngine.js');
    
    if (!fs.existsSync(gameplayEnginePath)) {
        console.error('❌ GameplayEngine.js não encontrado');
        return false;
    }
    
    let gameplayContent = fs.readFileSync(gameplayEnginePath, 'utf8');
    
    // 1. Adicionar sistemas no constructor
    console.log('📝 Adicionando sistemas ao constructor...');
    
    const constructorPattern = /constructor\(.*?\) \{[\s\S]*?this\.remotePlayers = \[\];/;
    
    if (constructorPattern.test(gameplayContent)) {
        const updatedConstructor = gameplayContent.match(constructorPattern)[0] + `
        // Sistemas de Jogo
        this.zoneSystem = null;
        this.questSystem = null;
        this.progressionSystem = null;
        this.npcSystem = null;
        this.currentZone = 'korvien_village';`;
        gameplayContent = gameplayContent.replace(constructorPattern, updatedConstructor);
        console.log('✅ Sistemas adicionados ao constructor');
    }
    
    // 2. Adicionar inicialização dos sistemas no startGame
    console.log('📝 Adicionando inicialização dos sistemas...');
    
    const startGamePattern = /startGame\(characterData\) \{[\s\S]*?this\.isRunning = true;/;
    
    if (startGamePattern.test(gameplayContent)) {
        const updatedStartGame = gameplayContent.match(startGamePattern)[0] + `
        
        // Inicializar sistemas
        this.initializeGameSystems(characterData);`;
        gameplayContent = gameplayContent.replace(startGamePattern, updatedStartGame);
        console.log('✅ Inicialização dos sistemas adicionada');
    }
    
    // 3. Adicionar método initializeGameSystems
    console.log('📝 Adicionando método initializeGameSystems...');
    
    const initializeSystemsMethod = `initializeGameSystems(characterData) {
        console.log('🎮 Inicializando sistemas de jogo...');
        
        // Inicializar ZoneSystem
        if (typeof ZoneSystem !== 'undefined') {
            this.zoneSystem = new ZoneSystem();
            this.zoneSystem.setCurrentZone(this.currentZone);
            console.log('✅ ZoneSystem inicializado');
        }
        
        // Inicializar QuestSystem
        if (typeof QuestSystem !== 'undefined') {
            this.questSystem = new QuestSystem();
            console.log('✅ QuestSystem inicializado');
        }
        
        // Inicializar ProgressionSystem
        if (typeof ProgressionSystem !== 'undefined') {
            this.progressionSystem = new ProgressionSystem();
            // Aplicar stats do personagem
            if (characterData && characterData.class) {
                characterData.stats = this.progressionSystem.getPlayerStats(characterData.class, characterData.level || 1);
                characterData.maxHealth = 100 + (characterData.stats.stamina * 5);
                characterData.health = characterData.maxHealth;
                characterData.maxMana = 50 + (characterData.stats.intelligence * 3);
                characterData.mana = characterData.maxMana;
            }
            console.log('✅ ProgressionSystem inicializado');
        }
        
        // Inicializar NPCSystem
        if (typeof NPCSystem !== 'undefined') {
            this.npcSystem = new NPCSystem();
            console.log('✅ NPCSystem inicializado');
        }
        
        // Gerar conteúdo da zona
        this.generateZoneContent();
        
        // Iniciar primeira quest
        if (this.questSystem) {
            this.questSystem.startQuest('q1_tutorial');
        }
    }`;
    
    // Adicionar método antes do último método existente
    const lastMethodPattern = /(\s+)(\w+)\([^)]*\) \{[\s\S]*?^(\s+)\}/m;
    const match = gameplayContent.match(lastMethodPattern);
    
    if (match) {
        const indent = match[1];
        gameplayContent = gameplayContent.replace(
            match[0],
            match[0] + '\n' + indent + initializeSystemsMethod + '\n'
        );
        console.log('✅ Método initializeGameSystems adicionado');
    }
    
    // 4. Adicionar método generateZoneContent
    console.log('📝 Adicionando método generateZoneContent...');
    
    const generateZoneContentMethod = `generateZoneContent() {
        if (!this.zoneSystem) return;
        
        const zone = this.zoneSystem.getCurrentZone();
        if (!zone) return;
        
        // Gerar mobs da zona
        this.mobs = this.zoneSystem.generateMobs();
        console.log(\`👾 Gerados \${this.mobs.length} mobs na zona \${zone.name}\`);
        
        // Gerar itens da zona
        this.items = this.zoneSystem.generateItems();
        console.log(\`💎 Gerados \${this.items.length} itens na zona \${zone.name}\`);
        
        // Aplicar tema da zona
        const theme = this.zoneSystem.getZoneTheme();
        this.zoneTheme = theme;
        
        // Posicionar jogador no spawn da zona
        const spawnPos = this.zoneSystem.getSpawnPosition('player');
        if (this.player) {
            this.player.x = spawnPos.x;
            this.player.y = spawnPos.y;
        }
    }`;
    
    // Adicionar método após initializeGameSystems
    gameplayContent = gameplayContent.replace(
        initializeSystemsMethod,
        initializeSystemsMethod + '\n' + generateZoneContentMethod
    );
    console.log('✅ Método generateZoneContent adicionado');
    
    // 5. Atualizar render para incluir NPCs e tema
    console.log('📝 Atualizando método render...');
    
    const renderPattern = /render\(\) \{[\s\S]*?\/\/ Renderizar player local/;
    
    if (renderPattern.test(gameplayContent)) {
        const currentRender = gameplayContent.match(renderPattern)[0];
        const updatedRender = currentRender.replace(
            /\/\/ Renderizar player local/,
            `// Renderizar NPCs
        if (this.npcSystem) {
            this.npcSystem.renderNPCs(this.ctx, { x: this.player?.x || 0, y: this.player?.y || 0 });
        }
        
        // Renderizar mobs
        this.mobs.forEach(mob => {
            this.ctx.fillStyle = mob.boss ? '#8B0000' : '#FF6B6B';
            this.ctx.fillRect(mob.x - 16, mob.y - 16, 32, 32);
            this.ctx.strokeStyle = mob.boss ? '#4B0000' : '#8B0000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(mob.x - 16, mob.y - 16, 32, 32);
            
            // Nome e level do mob
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            const mobName = mob.type.charAt(0).toUpperCase() + mob.type.slice(1);
            this.ctx.fillText(\`\${mobName} Lv.\${mob.level}\`, mob.x, mob.y - 20);
            
            // Barra de vida
            const healthPercent = mob.health / mob.maxHealth;
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(mob.x - 16, mob.y - 25, 32, 4);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(mob.x - 16, mob.y - 25, 32 * healthPercent, 4);
        });
        
        // Renderizar itens
        this.items.forEach(item => {
            const colors = {
                gold: '#FFD700',
                health_potion: '#FF0000',
                mana_potion: '#0000FF',
                ancient_herb: '#00FF00',
                rare_gem: '#FF00FF'
            };
            this.ctx.fillStyle = colors[item.type] || '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Brilho para itens raros
            if (item.type === 'rare_gem') {
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        });
        
        // Renderizar player local`
        );
        gameplayContent = gameplayContent.replace(currentRender, updatedRender);
        console.log('✅ Método render atualizado');
    }
    
    // 6. Atualizar método render para aplicar tema da zona
    console.log('📝 Adicionando tema da zona no render...');
    
    const renderBackgroundPattern = /\/\/ Fundo do mundo[\s\S]*?this\.ctx\.fillStyle = '#87CEEB';/;
    
    if (renderBackgroundPattern.test(gameplayContent)) {
        const updatedBackground = `// Fundo do mundo com tema da zona
        if (this.zoneTheme) {
            this.ctx.fillStyle = this.zoneTheme.background;
        } else {
            this.ctx.fillStyle = '#87CEEB';
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid com tema da zona
        this.ctx.strokeStyle = this.zoneTheme?.grid || '#6B8E23';
        this.ctx.lineWidth = 0.5;`;
        gameplayContent = gameplayContent.replace(renderBackgroundPattern, updatedBackground);
        console.log('✅ Tema da zona adicionado ao render');
    }
    
    // 7. Adicionar interação com NPCs
    console.log('📝 Adicionando interação com NPCs...');
    
    const npcInteractionMethod = `handleNPCInteraction() {
        if (!this.npcSystem || !this.player) return;
        
        const nearestNPC = this.npcSystem.getNearestNPC(this.player.x, this.player.y, this.currentZone);
        
        if (nearestNPC && nearestNPC.distance <= this.npcSystem.interactionRange) {
            // Mostrar prompt de interação
            if (this.hud) {
                this.hud.addChatMessage(\`Pressione [E] para falar com \${nearestNPC.npc.name}\`, '#00FF00');
            }
            
            // Verificar tecla E
            if (this.keys && this.keys['e'] || this.keys['E']) {
                const dialog = this.npcSystem.startInteraction(nearestNPC.npc, this.player);
                if (dialog && this.hud) {
                    this.hud.addChatMessage(\`\${nearestNPC.npc.name}: \${dialog.text}\`, '#FFD700');
                }
            }
        }
    }`;
    
    // Adicionar método após generateZoneContent
    gameplayContent = gameplayContent.replace(
        generateZoneContentMethod,
        generateZoneContentMethod + '\n' + npcInteractionMethod
    );
    console.log('✅ Método handleNPCInteraction adicionado');
    
    // 8. Atualizar update para incluir sistemas
    console.log('📝 Atualizando método update...');
    
    const updatePattern = /update\(deltaTime\) \{[\s\S]*?this\.updatePlayerMovement\(\);/;
    
    if (updatePattern.test(gameplayContent)) {
        const currentUpdate = gameplayContent.match(updatePattern)[0];
        const updatedUpdate = currentUpdate.replace(
            /this\.updatePlayerMovement\(\);/,
            `this.updatePlayerMovement();
        
        // Atualizar NPCs
        if (this.npcSystem) {
            this.npcSystem.updateNPCs(deltaTime);
        }
        
        // Verificar interação com NPCs
        this.handleNPCInteraction();
        
        // Verificar transições de zona
        this.checkZoneTransition();`
        );
        gameplayContent = gameplayContent.replace(currentUpdate, updatedUpdate);
        console.log('✅ Método update atualizado');
    }
    
    // 9. Adicionar método checkZoneTransition
    console.log('📝 Adicionando método checkZoneTransition...');
    
    const zoneTransitionMethod = `checkZoneTransition() {
        if (!this.zoneSystem || !this.player) return;
        
        const transition = this.zoneSystem.checkTransition(this.player.x, this.player.y);
        
        if (transition) {
            console.log(\`🌍 Transicionando para zona: \${transition.to}\`);
            
            // Mudar de zona
            this.currentZone = transition.to;
            this.zoneSystem.setCurrentZone(transition.to);
            
            // Gerar conteúdo da nova zona
            this.generateZoneContent();
            
            // Notificar jogador
            if (this.hud) {
                const newZone = this.zoneSystem.getCurrentZone();
                this.hud.addChatMessage(\`🌍 Entrou em: \${newZone.name}\`, '#00FF00');
                const warning = this.zoneSystem.getLevelRangeWarning(this.player.level);
                if (warning) {
                    this.hud.addChatMessage(warning, '#FFFF00');
                }
            }
        }
    }`;
    
    // Adicionar método após handleNPCInteraction
    gameplayContent = gameplayContent.replace(
        npcInteractionMethod,
        npcInteractionMethod + '\n' + zoneTransitionMethod
    );
    console.log('✅ Método checkZoneTransition adicionado');
    
    // 10. Atualizar updateUI para incluir informações de zona e quests
    console.log('📝 Atualizando método updateUI...');
    
    const updateUIPattern = /updateUI\(\) \{[\s\S]*?this\.hud\.update\(this\.player, this\.mobs\.length, this\.fps\);/;
    
    if (updateUIPattern.test(gameplayContent)) {
        const currentUpdateUI = gameplayContent.match(updateUIPattern)[0];
        const updatedUpdateUI = currentUpdateUI.replace(
            /this\.hud\.update\(this\.player, this\.mobs\.length, this\.fps\);/,
            `// Atualizar HUD básico
        this.hud.update(this.player, this.mobs.length, this.fps);
        
        // Atualizar informações de zona
        if (this.zoneSystem) {
            const zone = this.zoneSystem.getCurrentZone();
            if (zone && this.hud) {
                // Adicionar informações da zona ao chat
                if (!this.lastZoneUpdate || Date.now() - this.lastZoneUpdate > 5000) {
                    this.hud.addChatMessage(\`🌍 Zona: \${zone.name} (Lv. \${zone.levelRange.min}-\${zone.levelRange.max})\`, '#87CEEB');
                    this.lastZoneUpdate = Date.now();
                }
            }
        }
        
        // Atualizar informações de progressão
        if (this.progressionSystem && this.player) {
            const levelInfo = this.progressionSystem.calculateLevel(this.player.experience || 0);
            if (levelInfo && this.hud) {
                // Atualizar informações de nível no HUD (já feito pelo update básico)
            }
        }`
        );
        gameplayContent = gameplayContent.replace(currentUpdateUI, updatedUpdateUI);
        console.log('✅ Método updateUI atualizado');
    }
    
    // Salvar arquivo
    fs.writeFileSync(gameplayEnginePath, gameplayContent);
    console.log('✅ Arquivo GameplayEngine.js salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Integrate Systems v0.1.0');
console.log('=================================\n');

const success = integrateSystems();

if (success) {
    console.log('\n🎮 Sistemas integrados com sucesso!');
    console.log('📝 ZoneSystem para gerenciamento de zonas');
    console.log('📝 QuestSystem para missões e progressão');
    console.log('📝 ProgressionSystem para níveis e stats');
    console.log('📝 NPCSystem para interação com personagens');
    console.log('📝 Renderização aprimorada com temas');
    console.log('📝 Sistema de transição entre zonas');
    console.log('📝 Interação com NPCs via tecla E');
} else {
    console.log('\n❌ Falha ao integrar sistemas');
}

console.log('\n✅ Script concluído!');
