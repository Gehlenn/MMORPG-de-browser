/**
 * Sprite Initialization System
 * Loads and initializes all game sprites before starting the game
 */

class SpriteInitializer {
    constructor() {
        this.loadingScreen = null;
        this.progressBar = null;
        this.loadingText = null;
        this.isLoaded = false;
        this.loadStartTime = 0;
    }
    
    /**
     * Initialize loading screen - REMOVIDO do início
     */
    initLoadingScreen() {
        // NÃO mostrar tela de carregamento no início
        // Apenas criar função para usar depois do login
        console.log('🎮 Loading screen desativado para o início');
        
        this.loadingScreen = null;
        this.progressBar = null;
        this.loadingText = null;
    }
    
    /**
     * Update loading progress
     */
    updateProgress(percent, message) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percent * 100}%`;
        }
        
        if (this.loadingText) {
            this.loadingText.textContent = message;
        }
    }
    
    /**
     * Initialize all sprites
     */
    async initialize() {
        console.log('🎮 Iniciando carregamento de sprites...');
        this.loadStartTime = Date.now();
        
        try {
            // Check if spriteManager is available
            if (!window.spriteManager) {
                console.error('❌ SpriteManager não encontrado');
                this.showError('SpriteManager não encontrado');
                return false;
            }
            
            // Initialize sprite manager
            this.updateProgress(0.1, 'Carregando sprites de personagens...');
            const success = await window.spriteManager.initialize();
            
            if (!success) {
                this.showError('Falha ao carregar sprites');
                return false;
            }
            
            this.updateProgress(0.5, 'Sprites carregados, preparando renderização...');
            
            // Small delay to show completion
            await this.delay(500);
            
            this.updateProgress(1.0, 'Sprites carregados com sucesso!');
            await this.delay(300);
            
            this.hideLoadingScreen();
            this.isLoaded = true;
            
            const loadTime = Date.now() - this.loadStartTime;
            console.log(`✅ Todos os sprites carregados em ${loadTime}ms`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro na inicialização de sprites:', error);
            this.showError('Erro crítico ao carregar sprites');
            return false;
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        if (this.loadingScreen) {
            this.loadingScreen.innerHTML = `
                <div style="text-align: center; color: #ff6b6b;">
                    <h2 style="margin-bottom: 20px;">❌ Erro no Carregamento</h2>
                    <p style="font-size: 1.2em;">${message}</p>
                    <button onclick="location.reload()" style="
                        margin-top: 20px;
                        padding: 10px 20px;
                        font-size: 1.1em;
                        background: #ff6b6b;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Recarregar</button>
                </div>
            `;
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            this.loadingScreen.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                if (this.loadingScreen) {
                    this.loadingScreen.remove();
                    this.loadingScreen = null;
                }
            }, 500);
        }
    }
    
    /**
     * Check if sprites are loaded
     */
    isReady() {
        return this.isLoaded;
    }
    
    /**
     * Force show loading screen
     */
    showLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
            this.loadingScreen.style.opacity = '1';
        }
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get loading statistics
     */
    getStats() {
        return {
            loadTime: Date.now() - this.loadStartTime,
            spritesLoaded: window.spriteManager?.sprites.size || 0,
            isReady: this.isLoaded
        };
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Only initialize if we're in game context
    if (document.getElementById('gameScreen')) {
        console.log('🎮 DOM pronto, inicializando sprites...');
        
        window.spriteInitializer = new SpriteInitializer();
        
        // Initialize sprites
        const success = await window.spriteInitializer.initialize();
        
        if (success) {
            console.log('✅ Sistema de sprites inicializado com sucesso!');
            
            // Emit ready event
            window.dispatchEvent(new CustomEvent('spritesReady'));
        } else {
            console.error('❌ Falha na inicialização dos sprites');
        }
    }
});

// Export for module usage
window.SpriteInitializer = SpriteInitializer;
