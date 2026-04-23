/**
 * init-bank.js - Script de inicialização do sistema Bancário
 * 
 * Este script inicializa:
 * - BankUI (interface do banco)
 */

// Inicialização do sistema bancário
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏦 Inicializando sistema bancário...');
    
    // Verificar se o game engine está disponível
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initBankSystem(window._gameplayEngine);
        }
    }, 500);
    
    // Timeout após 30 segundos
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initBankSystem(gameEngine) {
    // Verificar se a classe está disponível
    if (typeof BankUI === 'undefined') {
        console.error('[Bank] BankUI não encontrado');
        return;
    }
    
    // Inicializar BankUI
    try {
        gameEngine.bankUI = new BankUI(gameEngine);
        window._bankUI = gameEngine.bankUI; // Global access for onclick handlers
        console.log('✅ BankUI inicializado');
    } catch (e) {
        console.error('[Bank] Erro ao inicializar BankUI:', e);
    }
}

// Exportar para uso global
window.initBankSystem = initBankSystem;
