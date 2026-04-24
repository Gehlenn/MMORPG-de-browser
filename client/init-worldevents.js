/**
 * init-worldevents.js - Script de inicialização do sistema de Eventos de Mundo
 * 
 * Este script inicializa:
 * - WorldEventUI (interface de eventos de mundo)
 */

// Inicialização do sistema de eventos de mundo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌍 Inicializando sistema de eventos de mundo...');
    
    // Verificar se o game engine está disponível
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initWorldEventSystem(window._gameplayEngine);
        }
    }, 500);
    
    // Timeout após 30 segundos
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initWorldEventSystem(gameEngine) {
    // Verificar se a classe está disponível
    if (typeof WorldEventUI === 'undefined') {
        console.error('[WorldEvents] WorldEventUI não encontrado');
        return;
    }
    
    // Verificar se gameEngine existe
    if (!gameEngine) {
        console.error('[WorldEvents] gameEngine não disponível');
        return;
    }
    
    // Inicializar WorldEventUI
    try {
        gameEngine.worldEventUI = new WorldEventUI(gameEngine);
        console.log('✅ WorldEventUI inicializado');
    } catch (e) {
        console.warn('[WorldEvents] Erro ao inicializar WorldEventUI (modo offline):', e.message);
        // Não crashar o jogo - continuar sem WorldEventUI
    }
}

// Exportar para uso global
window.initWorldEventSystem = initWorldEventSystem;
