/**
 * init-achievements.js - Script de inicialização do sistema de Conquistas
 * 
 * Este script inicializa:
 * - AchievementsUI (interface de conquistas)
 */

// Inicialização do sistema de conquistas
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏆 Inicializando sistema de conquistas...');
    
    // Verificar se o game engine está disponível
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initAchievementsSystem(window._gameplayEngine);
        }
    }, 500);
    
    // Timeout após 30 segundos
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initAchievementsSystem(gameEngine) {
    // Verificar se a classe está disponível
    if (typeof AchievementsUI === 'undefined') {
        console.error('[Achievements] AchievementsUI não encontrado');
        return;
    }
    
    // Verificar se gameEngine existe
    if (!gameEngine) {
        console.error('[Achievements] gameEngine não disponível');
        return;
    }
    
    // Inicializar AchievementsUI
    try {
        if (!gameEngine.achievementsUI) {
            gameEngine.achievementsUI = new AchievementsUI(gameEngine);
            gameEngine.achievementsUI.initialize();
            window._achievementsUI = gameEngine.achievementsUI; // Global access
            console.log('✅ AchievementsUI inicializado');
        }
    } catch (e) {
        console.warn('[Achievements] Erro ao inicializar AchievementsUI (modo offline):', e.message);
        // Não crashar o jogo - continuar sem AchievementsUI
    }
}

// Exportar para uso global
window.initAchievementsSystem = initAchievementsSystem;
