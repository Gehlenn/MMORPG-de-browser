/**
 * init-dailyquests.js - Script de inicialização do sistema de Missões Diárias
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Inicializando sistema de missões diárias...');
    
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initDailyQuestSystem(window._gameplayEngine);
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initDailyQuestSystem(gameEngine) {
    if (typeof DailyQuestUI === 'undefined') {
        console.error('[DailyQuest] DailyQuestUI não encontrado');
        return;
    }
    
    try {
        gameEngine.dailyQuestUI = new DailyQuestUI(gameEngine);
        console.log('✅ DailyQuestUI inicializado');
    } catch (e) {
        console.error('[DailyQuest] Erro ao inicializar:', e);
    }
}

window.initDailyQuestSystem = initDailyQuestSystem;
