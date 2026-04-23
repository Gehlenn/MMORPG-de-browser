/**
 * init-titles.js - Script de inicialização do sistema de Títulos
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('👑 Inicializando sistema de títulos...');
    
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initTitleSystem(window._gameplayEngine);
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initTitleSystem(gameEngine) {
    if (typeof TitleUI === 'undefined') {
        console.error('[Title] TitleUI não encontrado');
        return;
    }
    
    try {
        gameEngine.titleUI = new TitleUI(gameEngine);
        console.log('✅ TitleUI inicializado');
    } catch (e) {
        console.error('[Title] Erro ao inicializar:', e);
    }
}

window.initTitleSystem = initTitleSystem;
