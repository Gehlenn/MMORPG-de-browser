/**
 * init-pvp.js - Script de inicialização do sistema PvP
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('⚔️ Inicializando sistema PvP...');
    
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initPvPSystem(window._gameplayEngine);
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initPvPSystem(gameEngine) {
    if (typeof PvPArenaUI === 'undefined') {
        console.error('[PvP] PvPArenaUI não encontrado');
        return;
    }
    
    try {
        gameEngine.pvpUI = new PvPArenaUI(gameEngine);
        console.log('✅ PvPArenaUI inicializado');
    } catch (e) {
        console.error('[PvP] Erro ao inicializar:', e);
    }
}

window.initPvPSystem = initPvPSystem;
