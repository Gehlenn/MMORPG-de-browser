// Add Gameplay Content Script
// Adiciona conteúdo visual e funcionalidades ao gameplay

const fs = require('fs');
const path = require('path');

console.log('🔧 Adicionando Conteúdo ao Gameplay\n');

function addGameplayContent() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Adicionar função getClassName
    const getClassNameFunction = `
    function getClassName(characterClass) {
        const classNames = {
            warrior: 'Guerreiro',
            mage: 'Mago',
            ranger: 'Arqueiro',
            rogue: 'Ladino'
        };
        return classNames[characterClass] || 'Guerreiro';
    }`;
    
    // 2. Adicionar setupControls melhorado
    const setupControlsFunction = `
    function setupControls() {
        console.log('🎮 Configurando controles avançados');
        
        if (!window.gameplayEngine) return;
        
        const keys = {};
        let isAttacking = false;
        
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
            
            // Prevenir movimento se não estiver no jogo
            if (document.getElementById('loginScreen').style.display !== 'none' || 
                document.getElementById('characterScreen').style.display !== 'none') {
                return;
            }
            
            // Movimento WASD
            if (window.gameplayEngine) {
                const speed = e.shiftKey ? 8 : 5; // Shift para correr
                
                if (keys['w']) window.gameplayEngine.movePlayer(0, -speed);
                if (keys['s']) window.gameplayEngine.movePlayer(0, speed);
                if (keys['a']) window.gameplayEngine.movePlayer(-speed, 0);
                if (keys['d']) window.gameplayEngine.movePlayer(speed, 0);
                
                // Ataque com Espaço
                if (keys[' '] && !isAttacking) {
                    isAttacking = true;
                    window.gameplayEngine.playerAttack();
                    
                    setTimeout(() => {
                        isAttacking = false;
                    }, 500); // Cooldown de ataque
                }
                
                // Habilidades numéricas
                if (keys['1']) window.gameplayEngine.useSkill('fireball');
                if (keys['2']) window.gameplayEngine.useSkill('heal');
                if (keys['3']) window.gameplayEngine.useSkill('lightning');
            }
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });
        
        console.log('✅ Controles avançados configurados');
        showMessage('Controles: WASD=mover, Espaço=atacar, 1-3=habilidades', 'info');
    }`;
    
    // 3. Adicionar conteúdo visual ao canvas
    const canvasContent = `
    function addGameplayVisuals() {
        console.log('🎨 Adicionando visuais ao gameplay');
        
        if (!window.gameplayEngine) return;
        
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // Adicionar elementos visuais
        window.gameplayEngine.addVisualElement = function(type, x, y, data) {
            ctx.save();
            
            switch(type) {
                case 'damage':
                    // Dano flutuante
                    ctx.fillStyle = '#ff0000';
                    ctx.font = 'bold 16px Arial';
                    ctx.globalAlpha = 1.0;
                    ctx.fillText('-' + data.amount, x, y);
                    break;
                    
                case 'heal':
                    // Cura flutuante
                    ctx.fillStyle = '#00ff00';
                    ctx.font = 'bold 16px Arial';
                    ctx.globalAlpha = 1.0;
                    ctx.fillText('+' + data.amount, x, y);
                    break;
                    
                case 'levelup':
                    // Level up
                    ctx.fillStyle = '#ffff00';
                    ctx.font = 'bold 20px Arial';
                    ctx.globalAlpha = 1.0;
                    ctx.fillText('LEVEL UP!', x, y);
                    break;
                    
                case 'pickup':
                    // Item pickup
                    ctx.fillStyle = '#00ffff';
                    ctx.font = '14px Arial';
                    ctx.globalAlpha = 1.0;
                    ctx.fillText('+ ' + data.item, x, y);
                    break;
            }
            
            ctx.restore();
        };
        
        // Adicionar NPCs estáticos
        window.gameplayEngine.addNPC = function(x, y, type) {
            const npcs = window.gameplayEngine.npcs || [];
            npcs.push({
                x: x,
                y: y,
                type: type,
                width: 32,
                height: 32,
                color: type === 'merchant' ? '#4CAF50' : '#2196F3'
            });
            window.gameplayEngine.npcs = npcs;
        };
        
        // Adicionar itens no mapa
        window.gameplayEngine.addItem = function(x, y, type) {
            const items = window.gameplayEngine.items || [];
            items.push({
                x: x,
                y: y,
                type: type,
                width: 20,
                height: 20,
                color: type === 'gold' ? '#FFD700' : '#FF6347'
            });
            window.gameplayEngine.items = items;
        };
        
        // Renderizar NPCs
        window.gameplayEngine.renderNPCs = function() {
            const npcs = this.npcs || [];
            npcs.forEach(npc => {
                ctx.fillStyle = npc.color;
                ctx.fillRect(npc.x, npc.y, npc.width, npc.height);
                
                // Nome do NPC
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(npc.type, npc.x + npc.width/2, npc.y - 5);
            });
        };
        
        // Renderizar itens
        window.gameplayEngine.renderItems = function() {
            const items = this.items || [];
            items.forEach(item => {
                ctx.fillStyle = item.color;
                ctx.fillRect(item.x, item.y, item.width, item.height);
                
                // Brilho dos itens
                ctx.strokeStyle = '#fff';
                ctx.globalAlpha = 0.5;
                ctx.strokeRect(item.x - 2, item.y - 2, item.width + 4, item.height + 4);
                ctx.globalAlpha = 1.0;
            });
        };
        
        // Modificar render principal
        const originalRender = window.gameplayEngine.render;
        window.gameplayEngine.render = function() {
            // Render original
            originalRender.call(this);
            
            // Adicionar elementos extras
            this.renderNPCs();
            this.renderItems();
            
            // HUD no canvas
            this.renderCanvasHUD();
        };
        
        // HUD no canvas
        window.gameplayEngine.renderCanvasHUD = function() {
            const player = this.player;
            if (!player) return;
            
            ctx.save();
            
            // Barra de vida
            const barWidth = 200;
            const barHeight = 20;
            const barX = 10;
            const barY = 10;
            
            // Fundo da barra
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Vida atual
            const healthPercent = player.hp / player.maxHp;
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#f44336';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Texto da vida
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(\`\${player.hp}/\${player.maxHp} HP\`, barX + 5, barY + 14);
            
            // Nome e nível
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(player.name || 'Player', canvas.width / 2, 30);
            
            // Classe
            ctx.fillStyle = '#4CAF50';
            ctx.font = '14px Arial';
            ctx.fillText(getClassName(player.class || 'warrior'), canvas.width / 2, 50);
            
            ctx.restore();
        };
        
        // Adicionar alguns NPCs e itens iniciais
        window.gameplayEngine.addNPC(200, 200, 'merchant');
        window.gameplayEngine.addNPC(600, 200, 'guard');
        window.gameplayEngine.addItem(300, 300, 'gold');
        window.gameplayEngine.addItem(500, 400, 'potion');
        
        console.log('✅ Visuais e conteúdo adicionados ao gameplay');
    }`;
    
    // 4. Adicionar funções ao JavaScript existente
    const scriptEndPattern = /<\/script>/;
    if (scriptEndPattern.test(indexContent)) {
        const beforeScriptEnd = indexContent.substring(0, indexContent.lastIndexOf('</script>'));
        
        const combinedFunctions = getClassNameFunction + '\n' + setupControlsFunction + '\n' + canvasContent;
        
        const finalContent = beforeScriptEnd + combinedFunctions + '\n    </script>';
        
        fs.writeFileSync(indexPath, finalContent);
        console.log('✅ Funções de gameplay adicionadas');
        return true;
    }
    
    return false;
}

// Executar
console.log('🎯 Add Gameplay Content v0.1.0');
console.log('===============================\n');

const success = addGameplayContent();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Conteúdo de gameplay adicionado!');
    console.log('📝 NPCs visíveis no mapa');
    console.log('📝 Itens para coletar');
    console.log('📝 HUD no canvas');
    console.log('📝 Controles avançados');
} else {
    console.log('\n❌ Falha ao adicionar conteúdo');
}

console.log('\n✅ Script concluído!');
