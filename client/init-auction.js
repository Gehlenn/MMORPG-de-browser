/**
 * init-auction.js - Script de inicialização do sistema de Casa de Leilões
 * 
 * Este script inicializa:
 * - AuctionUI (interface do leilão)
 */

// Inicialização do sistema de leilões
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏪 Inicializando sistema de leilões...');
    
    // Verificar se o game engine está disponível
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initAuctionSystem(window._gameplayEngine);
        }
    }, 500);
    
    // Timeout após 30 segundos
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initAuctionSystem(gameEngine) {
    // Verificar se a classe está disponível
    if (typeof AuctionUI === 'undefined') {
        console.error('[Auction] AuctionUI não encontrado');
        return;
    }
    
    // Inicializar AuctionUI
    try {
        gameEngine.auctionUI = new AuctionUI(gameEngine);
        window._auctionUI = gameEngine.auctionUI; // Global access
        console.log('✅ AuctionUI inicializado');
    } catch (e) {
        console.error('[Auction] Erro ao inicializar AuctionUI:', e);
    }
}

// Exportar para uso global
window.initAuctionSystem = initAuctionSystem;
