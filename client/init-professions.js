/**
 * init-professions.js - Script de inicialização dos sistemas de Profissões
 * 
 * Este script inicializa:
 * - ProfessionUI (interface de profissões)
 * - ResourceNodeManager (nodes de gathering no mapa)
 * - CraftingDetailedUI (interface de crafting detalhada)
 */

// Inicialização dos sistemas de profissões
document.addEventListener('DOMContentLoaded', function() {
    console.log('⚒️ Inicializando sistemas de profissões...');
    
    // Verificar se o game engine está disponível
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initProfessionSystems(window._gameplayEngine);
        }
    }, 500);
    
    // Timeout após 30 segundos
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initProfessionSystems(gameEngine) {
    // Verificar se as classes estão disponíveis
    if (typeof ProfessionUI === 'undefined') {
        console.error('[Professions] ProfessionUI não encontrado');
        return;
    }
    
    // Verificar se gameEngine existe
    if (!gameEngine) {
        console.error('[Professions] gameEngine não disponível');
        return;
    }
    
    // Inicializar ProfessionUI
    try {
        gameEngine.professionUI = new ProfessionUI(gameEngine);
        console.log('✅ ProfessionUI inicializado');
    } catch (e) {
        console.warn('[Professions] Erro ao inicializar ProfessionUI (modo offline):', e.message);
        // Não crashar o jogo - continuar sem ProfessionUI
    }
    
    // Inicializar ResourceNodeManager
    if (typeof ResourceNodeManager !== 'undefined' && gameEngine.canvas && gameEngine.ctx) {
        try {
            gameEngine.resourceNodeManager = new ResourceNodeManager(
                gameEngine,
                gameEngine.canvas,
                gameEngine.ctx
            );
            console.log('✅ ResourceNodeManager inicializado');
            
            // Adicionar ao loop de renderização
            const originalRender = gameEngine.render.bind(gameEngine);
            gameEngine.render = function() {
                originalRender();
                // Renderizar nós de recursos COM offset de câmera
                if (gameEngine.resourceNodeManager && gameEngine.ctx) {
                    gameEngine.ctx.save();
                    gameEngine.ctx.translate(
                        -gameEngine.camera.x,
                        -gameEngine.camera.y
                    );
                    gameEngine.resourceNodeManager.render(gameEngine.ctx);
                    gameEngine.ctx.restore();
                }
            };
            
            // Adicionar ao loop de update
            const originalUpdate = gameEngine.update.bind(gameEngine);
            gameEngine.update = function(deltaTime) {
                originalUpdate(deltaTime);
                if (gameEngine.resourceNodeManager && gameEngine.player) {
                    gameEngine.resourceNodeManager.update(
                        gameEngine.player.x,
                        gameEngine.player.y
                    );
                }
            };
            
            // Registrar tecla E para interação com nodes
            const originalKeyHandler = gameEngine.handleKeyPress?.bind(gameEngine);
            gameEngine.handleKeyPress = function(key) {
                if (originalKeyHandler) originalKeyHandler(key);
                if (gameEngine.resourceNodeManager) {
                    gameEngine.resourceNodeManager.handleKeyPress(key);
                }
            };
            
            // Spawn nodes de teste (remover em produção)
            setTimeout(() => {
                if (gameEngine.resourceNodeManager) {
                    gameEngine.resourceNodeManager.spawnDebugNodes(15);
                }
            }, 2000);
            
        } catch (e) {
            console.error('[Professions] Erro ao inicializar ResourceNodeManager:', e);
        }
    }
    
    // Inicializar CraftingDetailedUI
    if (typeof CraftingDetailedUI !== 'undefined') {
        try {
            gameEngine.craftingDetailedUI = new CraftingDetailedUI(gameEngine);
            console.log('✅ CraftingDetailedUI inicializado');
        } catch (e) {
            console.error('[Professions] Erro ao inicializar CraftingDetailedUI:', e);
        }
    }
    
    console.log('✅ Todos os sistemas de profissões inicializados');
}

// Exportar para uso global
window.initProfessionSystems = initProfessionSystems;
