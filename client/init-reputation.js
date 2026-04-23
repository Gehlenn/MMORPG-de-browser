/**
 * init-reputation.js - Script de inicialização do sistema de Reputação
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🤝 Inicializando sistema de reputação...');
    
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initReputationSystem(window._gameplayEngine);
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initReputationSystem(gameEngine) {
    if (typeof ReputationUI === 'undefined') {
        console.error('[Reputation] ReputationUI não encontrado');
        return;
    }
    
    try {
        gameEngine.reputationUI = new ReputationUI(gameEngine);
        console.log('✅ ReputationUI inicializado');
    } catch (e) {
        console.error('[Reputation] Erro ao inicializar:', e);
    }
}

window.initReputationSystem = initReputationSystem;
