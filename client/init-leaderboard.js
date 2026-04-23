/**
 * init-leaderboard.js - Script de inicialização do sistema de Leaderboards
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏆 Inicializando sistema de leaderboards...');
    
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initLeaderboardSystem(window._gameplayEngine);
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initLeaderboardSystem(gameEngine) {
    if (typeof LeaderboardUI === 'undefined') {
        console.error('[Leaderboard] LeaderboardUI não encontrado');
        return;
    }
    
    try {
        gameEngine.leaderboardUI = new LeaderboardUI(gameEngine);
        console.log('✅ LeaderboardUI inicializado');
    } catch (e) {
        console.error('[Leaderboard] Erro ao inicializar:', e);
    }
}

window.initLeaderboardSystem = initLeaderboardSystem;
