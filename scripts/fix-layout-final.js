// Fix Layout Final Script
// Corrige layout da tela de seleção e problemas de CSP

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Layout Final e CSP\n');

function fixLayoutFinal() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Corrigir CSP para permitir eval
    const newCSP = `
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io https://cdnjs.cloudflare.com https://www.google.com https://ajax.googleapis.com https://use.typekit.net;
        style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://use.typekit.net;
        img-src 'self' data: blob:;
        font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com https://use.typekit.net;
        connect-src 'self' ws://localhost:3000 http://localhost:3000 https://cdn.socket.io;
        media-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
    ">`;
    
    // Substituir CSP antigo
    const oldCSPPattern = /<meta http-equiv="Content-Security-Policy"[^>]*>/g;
    if (oldCSPPattern.test(indexContent)) {
        indexContent = indexContent.replace(oldCSPPattern, newCSP.trim());
        console.log('✅ CSP atualizado com unsafe-eval permitido');
    }
    
    // 2. Adicionar CSS para corrigir layout definitivamente
    const layoutCSS = `
    /* Layout Definitivo - Tela de Seleção Acima de Tudo */
    #characterScreen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.98) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 99999 !important;
        opacity: 1 !important;
        pointer-events: all !important;
    }
    
    #loginScreen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 99998 !important;
        opacity: 1 !important;
        pointer-events: all !important;
    }
    
    #gameContainer {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: #000 !important;
        display: none !important;
        z-index: 1 !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }
    
    #gameContainer.active {
        display: block !important;
        opacity: 1 !important;
        pointer-events: all !important;
    }
    
    #gameCanvas {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        border: 2px solid #333 !important;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5) !important;
        background: #1a1a1a !important;
        z-index: 2 !important;
    }
    
    /* Esconder elementos HUD que podem interferir */
    .hud, #visual-map-canvas, .wow-hud-canvas, .improved-hud-canvas {
        display: none !important;
    }
    
    /* Garantir que personagens e botões sejam clicáveis */
    .character-card {
        position: relative !important;
        z-index: 100000 !important;
        pointer-events: auto !important;
        cursor: pointer !important;
    }
    
    .character-card:hover {
        transform: translateY(-5px) !important;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
    }
    
    .login-button {
        position: relative !important;
        z-index: 100001 !important;
        pointer-events: auto !important;
        cursor: pointer !important;
    }
    
    .login-button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3) !important;
    }
    
    /* Container de personagem */
    .character-container {
        position: relative !important;
        z-index: 99999 !important;
        background: rgba(0, 0, 0, 0.9) !important;
        border: 2px solid #333 !important;
        border-radius: 15px !important;
        padding: 30px !important;
        max-width: 800px !important;
        max-height: 80vh !important;
        overflow-y: auto !important;
    }
    
    /* Login container */
    .login-container {
        position: relative !important;
        z-index: 99999 !important;
        background: rgba(0, 0, 0, 0.9) !important;
        border: 2px solid #333 !important;
        border-radius: 15px !important;
        padding: 40px !important;
    }
    
    /* Transições suaves */
    .screen {
        transition: opacity 0.3s ease !important;
    }
    
    .screen.hidden {
        opacity: 0 !important;
        pointer-events: none !important;
    }
    `;
    
    // Adicionar CSS ao head
    const headPattern = /<\/head>/;
    if (headPattern.test(indexContent)) {
        const cssToAdd = `<style>
        ${layoutCSS}
    </style>
</head>`;
        
        indexContent = indexContent.replace(headPattern, cssToAdd);
        console.log('✅ CSS de layout definitivo adicionado');
    }
    
    // 3. Corrigir função startGame para funcionar corretamente
    const startGamePattern = /function startGame\(\) \{[\s\S]*?\}/;
    
    const newStartGame = `function startGame() {
        console.log('🚀 Iniciando jogo');
        
        const characterScreen = document.getElementById('characterScreen');
        const gameContainer = document.getElementById('gameContainer');
        
        if (characterScreen && gameContainer) {
            console.log('📱 Elementos encontrados, iniciando transição');
            
            // Esconder tela de seleção
            characterScreen.style.opacity = '0';
            characterScreen.classList.add('hidden');
            
            setTimeout(() => {
                characterScreen.style.display = 'none';
                
                // Mostrar jogo
                gameContainer.style.display = 'block';
                gameContainer.classList.add('active');
                
                setTimeout(() => {
                    gameContainer.style.opacity = '1';
                    console.log('🎮 Gameplay iniciando...');
                    initializeGameplay(selectedCharacterClass);
                }, 100);
            }, 300);
        } else {
            console.error('❌ Elementos não encontrados:', {
                characterScreen: !!characterScreen,
                gameContainer: !!gameContainer
            });
            showMessage('Erro ao iniciar jogo', 'error');
        }
    }`;
    
    if (startGamePattern.test(indexContent)) {
        indexContent = indexContent.replace(startGamePattern, newStartGame);
        console.log('✅ Função startGame corrigida');
    }
    
    // 4. Corrigir função initializeGameplay para garantir funcionamento
    const initializeGameplayPattern = /function initializeGameplay\(characterClass\) \{[\s\S]*?\}/;
    
    const newInitializeGameplay = `function initializeGameplay(characterClass) {
        console.log('🎮 Inicializando gameplay para:', characterClass);
        
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('❌ Canvas gameCanvas não encontrado!');
            showMessage('Erro: Canvas do jogo não encontrado', 'error');
            return;
        }
        
        try {
            // Configurar canvas
            canvas.width = 800;
            canvas.height = 600;
            
            const ctx = canvas.getContext('2d');
            
            // Stats baseadas na classe
            const classStats = {
                warrior: { hp: 120, maxHp: 120, mana: 20, maxMana: 20, attack: 15, defense: 10, speed: 4, color: '#4CAF50' },
                mage: { hp: 80, maxHp: 80, mana: 100, maxMana: 100, attack: 8, defense: 5, speed: 5, color: '#2196F3' },
                ranger: { hp: 100, maxHp: 100, mana: 50, maxMana: 50, attack: 12, defense: 8, speed: 6, color: '#FF9800' },
                rogue: { hp: 90, maxHp: 90, mana: 30, maxMana: 30, attack: 14, defense: 6, speed: 7, color: '#9C27B0' }
            };
            
            const stats = classStats[characterClass] || classStats.warrior;
            const className = getClassName(characterClass);
            
            // Criar player
            const player = {
                x: 400,
                y: 300,
                width: 32,
                height: 32,
                color: stats.color,
                name: currentUser || 'Player',
                class: characterClass,
                ...stats,
                level: 1,
                exp: 0,
                maxExp: 100,
                gold: 50
            };
            
            // Criar NPCs e itens
            const npcs = [
                { x: 200, y: 200, width: 32, height: 32, color: '#4CAF50', name: 'Merchant' },
                { x: 600, y: 200, width: 32, height: 32, color: '#2196F3', name: 'Guard' }
            ];
            
            const items = [
                { x: 300, y: 400, width: 20, height: 20, color: '#FFD700', name: 'Gold' },
                { x: 500, y: 400, width: 20, height: 20, color: '#FF0000', name: 'Potion' }
            ];
            
            // Variáveis de controle
            const keys = {};
            let isAttacking = false;
            
            // Função de render
            function render() {
                // Limpar canvas
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Desenhar grade
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                for (let x = 0; x < canvas.width; x += 50) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();
                }
                for (let y = 0; y < canvas.height; y += 50) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                    ctx.stroke();
                }
                
                // Desenhar NPCs
                npcs.forEach(npc => {
                    ctx.fillStyle = npc.color;
                    ctx.fillRect(npc.x, npc.y, npc.width, npc.height);
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px Arial';
                    ctx.fillText(npc.name, npc.x, npc.y - 5);
                });
                
                // Desenhar itens
                items.forEach(item => {
                    ctx.fillStyle = item.color;
                    ctx.fillRect(item.x, item.y, item.width, item.height);
                    
                    // Brilho nos itens
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = item.color;
                    ctx.fillRect(item.x, item.y, item.width, item.height);
                    ctx.shadowBlur = 0;
                });
                
                // Desenhar player
                ctx.fillStyle = player.color;
                ctx.fillRect(player.x, player.y, player.width, player.height);
                
                // HUD
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Arial';
                ctx.fillText(\`\${player.name} - \${className}\`, 10, 30);
                
                ctx.font = '12px Arial';
                ctx.fillText(\`HP: \${player.hp}/\${player.maxHp}\`, 10, 50);
                ctx.fillText(\`Mana: \${player.mana}/\${player.maxMana}\`, 10, 70);
                ctx.fillText(\`Level: \${player.level}\`, 10, 90);
                ctx.fillText(\`Gold: \${player.gold}\`, 10, 110);
                
                // Controles
                ctx.fillStyle = '#aaa';
                ctx.font = '11px Arial';
                ctx.fillText('WASD: Mover | Espaço: Atacar | 1-3: Habilidades', 10, canvas.height - 20);
            }
            
            // Função de movimento
            function movePlayer(dx, dy) {
                player.x += dx;
                player.y += dy;
                
                // Limitar ao canvas
                player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
                player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
            }
            
            // Controles
            document.addEventListener('keydown', (e) => {
                keys[e.key.toLowerCase()] = true;
                
                // Prevenir movimento se não estiver no jogo
                if (gameContainer.style.display !== 'block') {
                    return;
                }
                
                const speed = e.shiftKey ? 8 : 5;
                
                if (keys['w']) movePlayer(0, -speed);
                if (keys['s']) movePlayer(0, speed);
                if (keys['a']) movePlayer(-speed, 0);
                if (keys['d']) movePlayer(speed, 0);
                
                // Ataque
                if (keys[' '] && !isAttacking) {
                    isAttacking = true;
                    console.log('⚔️ Player atacou!');
                    setTimeout(() => {
                        isAttacking = false;
                    }, 500);
                }
                
                // Habilidades
                if (keys['1']) console.log('✨ Fireball!');
                if (keys['2']) console.log('💚 Heal!');
                if (keys['3']) console.log('⚡ Lightning!');
            });
            
            document.addEventListener('keyup', (e) => {
                keys[e.key.toLowerCase()] = false;
            });
            
            // Game loop
            function gameLoop() {
                render();
                requestAnimationFrame(gameLoop);
            }
            
            gameLoop();
            
            console.log('✅ Gameplay inicializado com sucesso!');
            showMessage(\`Bem-vindo ao mundo, \${className}!\`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar gameplay:', error);
            showMessage('Erro ao carregar jogo', 'error');
        }
    }`;
    
    if (initializeGameplayPattern.test(indexContent)) {
        indexContent = indexContent.replace(initializeGameplayPattern, newInitializeGameplay);
        console.log('✅ Função initializeGameplay corrigida');
    }
    
    // Salvar arquivo
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Arquivo salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Fix Layout Final v0.1.0');
console.log('===============================\n');

const success = fixLayoutFinal();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Layout e CSP corrigidos!');
    console.log('📝 Tela de seleção acima do canvas');
    console.log('📝 unsafe-eval permitido no CSP');
    console.log('📝 startGame funcionando');
    console.log('📝 initializeGameplay completo');
    console.log('📝 Gameplay com NPCs e itens');
} else {
    console.log('\n❌ Falha ao corrigir layout');
}

console.log('\n✅ Script concluído!');
