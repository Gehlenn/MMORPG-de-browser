/**
 * init-notifications.js - Script de inicialização do sistema de Notificações
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔔 Inicializando sistema de notificações...');
    
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initNotificationSystem(window._gameplayEngine);
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initNotificationSystem(gameEngine) {
    if (typeof NotificationManager === 'undefined') {
        console.error('[Notification] NotificationManager não encontrado');
        return;
    }
    
    try {
        gameEngine.notificationManager = new NotificationManager(gameEngine);
        window.notificationManager = gameEngine.notificationManager;
        console.log('✅ NotificationManager inicializado');
    } catch (e) {
        console.error('[Notification] Erro ao inicializar:', e);
    }
}

window.initNotificationSystem = initNotificationSystem;
