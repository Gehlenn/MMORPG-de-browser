// Fix Gameplay Issues Script
// Corrige problemas de layout e inicialização do gameplay

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Problemas de Gameplay\n');

function fixGameplayIssues() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Corrigir problema de layout - tela de seleção abaixo do canvas
    const layoutFixCSS = `
    /* Correção de Layout - Tela de Seleção Acima do Canvas */
    #characterScreen {
        z-index: 10000 !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.95) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
    }
    
    #gameContainer {
        z-index: 1 !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: #000 !important;
        display: none !important;
    }
    
    #gameCanvas {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        border: 2px solid #333 !important;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5) !important;
        background: #1a1a1a !important;
    }
    
    /* Esconder elementos que não devem aparecer */
    #visual-map-canvas {
        display: none !important;
    }
    
    .hud {
        position: absolute !important;
        z-index: 100 !important;
        pointer-events: none !important;
    }
    
    /* Garantir que tela de seleção fique visível */
    .character-container {
        z-index: 10001 !important;
        position: relative !important;
    }
    
    .character-card {
        position: relative !important;
        z-index: 10002 !important;
        pointer-events: auto !important;
    }
    
    .login-button {
        position: relative !important;
        z-index: 10003 !important;
        pointer-events: auto !important;
    }
    `;
    
    // 2. Adicionar CSS de correção
    const headPattern = /<\/head>/;
    if (headPattern.test(indexContent)) {
        const fixedContent = indexContent.replace(
            headPattern,
            `    <style>
        ${layoutFixCSS}
    </style>
</head>`
        );
        
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ CSS de correção de layout adicionado');
    }
    
    // 3. Corrigir função initializeGameplay para não depender de assets
    const initializeGameplayPattern = /function initializeGameplay\(characterClass\) \{[\s\S]*?console\.log\('🎮 Inicializando gameplay'\);[\s\S]*?if \(typeof window\.IntegratedGameplayEngine !== 'undefined'\) \{[\s\S]*?\}/;
    
    if (initializeGameplayPattern.test(indexContent)) {
        const fixedInitializeGameplay = `function initializeGameplay(characterClass) {
        console.log('🎮 Inicializando gameplay para:', characterClass);
        
        // Verificar se canvas existe
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('❌ Canvas gameCanvas não encontrado!');
            showMessage('Erro: Canvas do jogo não encontrado', 'error');
            return;
        }
        
        // Criar gameplay simplificado sem dependência de assets
        try {
            // Stats baseadas na classe selecionada
            const classStats = {
                warrior: { hp: 120, maxHp: 120, mana: 20, maxMana: 20, attack: 15, defense: 10, speed: 4, color: '#4CAF50' },
                mage: { hp: 80, maxHp: 80, mana: 100, maxMana: 100, attack: 8, defense: 5, speed: 5, color: '#2196F3' },
                ranger: { hp: 100, maxHp: 100, mana: 50, maxMana: 50, attack: 12, defense: 8, speed: 6, color: '#FF9800' },
                rogue: { hp: 90, maxHp: 90, mana: 30, maxMana: 30, attack: 14, defense: 6, speed: 7, color: '#9C27B0' }
            };
            
            const stats = classStats[characterClass] || classStats.warrior;
            const className = getClassName(characterClass);
            
            const character = {
                name: currentUser || 'Player',
                class: characterClass,
                level: 1,
                ...stats,
                exp: 0,
                maxExp: 100,
                x: 400,
                y: 300,
                gold: 50
            };
            
            // Criar gameplay engine simplificado
            window.gameplayEngine = {
                canvas: canvas,
                ctx: canvas.getContext('2d'),
                player: character,
                npcs: [],
                items: [],
                mobs: [],
                
                // Métodos básicos
                movePlayer: function(dx, dy) {
                    this.player.x += dx;
                    this.player.y += dy;
                    
                    // Limitar ao canvas
                    this.player.x = Math.max(0, Math.min(canvas.width - this.player.width, this.player.x));
                    this.player.y = Math.max(0, Math.min(canvas.height - this.player.height, this.player.y));
                },
                
                playerAttack: function() {
                    console.log('⚔️ Player atacou!');
                    // Efeito visual simples
                    this.showDamage(this.player.x + 50, this.player.y, 10);
                },
                
                useSkill: function(skill) {
                    console.log('✨ Usando skill:', skill);
                    // Efeito visual simples
                    this.showDamage(this.player.x, this.player.y - 30, 5);
                },
                
                showDamage: function(x, y, damage) {
                    const ctx = this.ctx;
                    ctx.save();
                    ctx.fillStyle = '#ff0000';
                    ctx.font = 'bold 16px Arial';
                    ctx.globalAlpha = 1.0;
                    ctx.fillText('-' + damage, x, y);
                    ctx.restore();
                },
                
                render: function() {
                    const ctx = this.ctx;
                    
                    // Limpar canvas
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Desenhar player
                    ctx.fillStyle = this.player.color;
                    ctx.fillRect(this.player.x, this.player.y, 32, 32);
                    
                    // Desenhar NPCs
                    this.npcs.forEach(npc => {
                        ctx.fillStyle = npc.color;
                        ctx.fillRect(npc.x, npc.y, 32, 32);
                    });
                    
                    // Desenhar itens
                    this.items.forEach(item => {
                        ctx.fillStyle = item.color;
                        ctx.fillRect(item.x, item.y, 20, 20);
                    });
                    
                    // HUD básico
                    ctx.fillStyle = '#fff';
                    ctx.font = '14px Arial';
                    ctx.fillText(\`\${this.player.name} - \${className}\`, 10, 30);
                    ctx.fillText(\`HP: \${this.player.hp}/\${this.player.maxHp}\`, 10, 50);
                    ctx.fillText(\`Classe: \${this.player.class}\`, 10, 70);
                    ctx.fillText('WASD: Mover | Espaço: Atacar | 1-3: Habilidades', 10, canvas.height - 20);
                }
            };
            
            // Configurar canvas
            canvas.width = 800;
            canvas.height = 600;
            
            // Iniciar render loop
            function gameLoop() {
                window.gameplayEngine.render();
                requestAnimationFrame(gameLoop);
            }
            
            gameLoop();
            
            console.log('✅ Gameplay simplificado inicializado');
            showMessage(\`Bem-vindo ao mundo, \${className}! Use WASD para mover, Espaço para atacar\`, 'success');
            
            // Configurar controles básicos
            setupBasicControls();
            
        } catch (error) {
            console.error('Erro ao inicializar gameplay:', error);
            showMessage('Erro ao carregar jogo', 'error');
        }
    }`;
        
        const fixedContent = indexContent.replace(initializeGameplayPattern, fixedInitializeGameplay);
        fs.writeFileSync(indexPath, fixedContent);
        console.log('✅ Função initializeGameplay corrigida');
    }
    
    // 4. Adicionar função setupBasicControls
    const setupControlsPattern = /function setupControls\(\) \{[\s\S]*?\}/;
    
    if (!setupControlsPattern.test(indexContent)) {
        const setupBasicControls = `
    function setupBasicControls() {
        console.log('🎮 Configurando controles básicos');
        
        if (!window.gameplayEngine) return;
        
        const keys = {};
        
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
            
            // Prevenir movimento se não estiver no jogo
            if (document.getElementById('loginScreen').style.display !== 'none' || 
                document.getElementById('characterScreen').style.display !== 'none') {
                return;
            }
            
            // Movimento WASD
            if (window.gameplayEngine) {
                const speed = e.shiftKey ? 8 : 5;
                
                if (keys['w']) window.gameplayEngine.movePlayer(0, -speed);
                if (keys['s']) window.gameplayEngine.movePlayer(0, speed);
                if (keys['a']) window.gameplayEngine.movePlayer(-speed, 0);
                if (keys['d']) window.gameplayEngine.movePlayer(speed, 0);
                
                // Ataque com Espaço
                if (keys[' ']) {
                    window.gameplayEngine.playerAttack();
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
        
        console.log('✅ Controles básicos configurados');
    }`;
        
        const scriptEndPattern = /<\/script>/;
        const finalContent = indexContent.replace(
            scriptEndPattern,
            setupBasicControls + '\n    </script>'
        );
        
        fs.writeFileSync(indexPath, finalContent);
        console.log('✅ Função setupBasicControls adicionada');
    }
    
    return true;
}

// Executar
console.log('🎯 Fix Gameplay Issues v0.1.0');
console.log('===============================\n');

const success = fixGameplayIssues();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Problemas de gameplay corrigidos!');
    console.log('📝 Layout da tela de seleção corrigido');
    console.log('📝 Canvas posicionado corretamente');
    console.log('📝 Gameplay simplificado sem dependências');
    console.log('📝 Controles básicos funcionais');
} else {
    console.log('\n❌ Falha ao corrigir problemas');
}

console.log('\n✅ Script concluído!');
