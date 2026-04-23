/**
 * init-mountpet.js - Script de inicialização do sistema de Montarias e Pets
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🐾 Inicializando sistema de montarias e pets...');
    
    const checkGameEngine = setInterval(() => {
        if (window._gameplayEngine) {
            clearInterval(checkGameEngine);
            initMountPetSystem(window._gameplayEngine);
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(checkGameEngine);
    }, 30000);
});

function initMountPetSystem(gameEngine) {
    if (typeof MountPetUI === 'undefined') {
        console.error('[MountPet] MountPetUI não encontrado');
        return;
    }
    
    try {
        gameEngine.mountPetUI = new MountPetUI(gameEngine);
        console.log('✅ MountPetUI inicializado');
    } catch (e) {
        console.error('[MountPet] Erro ao inicializar:', e);
    }
}

window.initMountPetSystem = initMountPetSystem;
