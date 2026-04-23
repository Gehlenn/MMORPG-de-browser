/**
 * init-worldmap.js - Script de inicialização do Mapa do Mundo
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🗺️ Inicializando mapa do mundo...');
    
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initWorldMapSystem(window._gameplayEngine);
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initWorldMapSystem(gameEngine) {
    if (typeof WorldMapUI === 'undefined') {
        console.error('[WorldMap] WorldMapUI não encontrado');
        return;
    }
    
    try {
        gameEngine.worldMapUI = new WorldMapUI(gameEngine);
        console.log('✅ WorldMapUI inicializado');
    } catch (e) {
        console.error('[WorldMap] Erro ao inicializar:', e);
    }
}

window.initWorldMapSystem = initWorldMapSystem;
