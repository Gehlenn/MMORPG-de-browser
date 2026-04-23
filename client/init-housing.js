/**
 * init-housing.js - Script de inicialização do sistema de Housing
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Inicializando sistema de housing...');
    
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initHousingSystem(window._gameplayEngine);
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initHousingSystem(gameEngine) {
    if (typeof HousingUI === 'undefined') {
        console.error('[Housing] HousingUI não encontrado');
        return;
    }
    
    try {
        gameEngine.housingUI = new HousingUI(gameEngine);
        console.log('✅ HousingUI inicializado');
    } catch (e) {
        console.error('[Housing] Erro ao inicializar:', e);
    }
}

window.initHousingSystem = initHousingSystem;
