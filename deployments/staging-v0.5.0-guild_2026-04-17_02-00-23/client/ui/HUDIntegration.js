/**
 * HUD Integration - Legacy of Komodo
 * Sistema de integração para substituir a HUD antiga pela melhorada
 */

class HUDIntegration {
    constructor() {
        this.currentHUD = null;
        this.improvedHUD = null;
        this.transitioning = false;
        this.initialized = false;
        
        this.initialize();
    }
    
    initialize() {
        console.log('🔄 Inicializando sistema de integração da HUD...');
        
        // Verificar se já existe uma HUD
        this.checkExistingHUD();
        
        // Carregar CSS da HUD melhorada
        this.loadImprovedHUDCSS();
        
        // Configurar eventos
        this.setupEventListeners();
        
        console.log('✅ Sistema de integração da HUD inicializado');
        this.initialized = true;
    }
    
    checkExistingHUD() {
        // Verificar HUD antiga
        const oldHUD = document.getElementById('integrated-hud');
        if (oldHUD) {
            console.log('📋 HUD antiga encontrada');
            this.currentHUD = oldHUD;
        }
        
        // Verificar se já existe HUD melhorada
        const improvedHUD = document.getElementById('improved-hud');
        if (improvedHUD) {
            console.log('🎨 HUD melhorada já existe');
            this.improvedHUD = improvedHUD;
        }
    }
    
    loadImprovedHUDCSS() {
        // Verificar se CSS já foi carregado
        const existingCSS = document.getElementById('improved-hud-css');
        if (existingCSS) {
            console.log('🎨 CSS da HUD melhorada já carregado');
            return;
        }
        
        // Criar elemento link
        const link = document.createElement('link');
        link.id = 'improved-hud-css';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'css/improved-hud.css';
        
        // Adicionar ao head
        document.head.appendChild(link);
        
        // Verificar carregamento
        link.onload = () => {
            console.log('✅ CSS da HUD melhorada carregado com sucesso');
        };
        
        link.onerror = () => {
            console.error('❌ Erro ao carregar CSS da HUD melhorada');
        };
    }
    
    setupEventListeners() {
        // Evento para atualizar estado do jogador
        window.addEventListener('playerStateUpdate', (event) => {
            if (this.improvedHUD) {
                this.improvedHUD.updatePlayerState(event.detail);
            }
        });
        
        // Evento para mostrar notificações
        window.addEventListener('showNotification', (event) => {
            if (this.improvedHUD) {
                this.improvedHUD.showNotification(event.detail.text, event.detail.type, event.detail.duration);
            }
        });
        
        // Evento para mostrar diálogo
        window.addEventListener('showDialogue', (event) => {
            if (this.improvedHUD) {
                this.improvedHUD.showDialogue(event.detail.npcName, event.detail.text, event.detail.options);
            }
        });
        
        // Evento para modo de combate
        window.addEventListener('combatModeChange', (event) => {
            if (this.improvedHUD) {
                this.improvedHUD.setCombatMode(event.detail.enabled, event.detail.targetInfo);
            }
        });
        
        // Evento de resize
        window.addEventListener('resize', () => {
            if (this.improvedHUD) {
                this.improvedHUD.resize();
            }
        });
    }
    
    createImprovedHUD() {
        if (this.improvedHUD) {
            console.log('⚠️ HUD melhorada já existe');
            return;
        }
        
        console.log('🎨 Criando HUD melhorada...');
        
        // Verificar se assetManager está disponível
        const assetManager = window.assetManager || null;
        
        // Criar instância da HUD melhorada
        this.improvedHUD = new window.ImprovedHUD(assetManager);
        
        // Configurar referência global
        window.hudSystem = this.improvedHUD;
        
        console.log('✅ HUD melhorada criada com sucesso');
    }
    
    switchToImprovedHUD() {
        if (this.transitioning) {
            console.log('⚠️ Transição já em andamento');
            return;
        }
        
        if (!this.improvedHUD) {
            this.createImprovedHUD();
        }
        
        console.log('🔄 Alternando para HUD melhorada...');
        this.transitioning = true;
        
        // Transição suave
        this.performTransition(() => {
            // Esconder HUD antiga
            if (this.currentHUD) {
                this.currentHUD.style.display = 'none';
                console.log('📋 HUD antiga escondida');
            }
            
            // Mostrar HUD melhorada
            if (this.improvedHUD) {
                this.improvedHUD.show();
                console.log('🎨 HUD melhorada ativada');
            }
            
            // Atualizar referências globais
            window.hudSystem = this.improvedHUD;
            
            this.transitioning = false;
            console.log('✅ Transição para HUD melhorada concluída');
        });
    }
    
    switchToOldHUD() {
        if (this.transitioning) {
            console.log('⚠️ Transição já em andamento');
            return;
        }
        
        if (!this.currentHUD) {
            console.log('⚠️ HUD antiga não encontrada');
            return;
        }
        
        console.log('🔄 Alternando para HUD antiga...');
        this.transitioning = true;
        
        // Transição suave
        this.performTransition(() => {
            // Esconder HUD melhorada
            if (this.improvedHUD) {
                this.improvedHUD.hide();
                console.log('🎨 HUD melhorada escondida');
            }
            
            // Mostrar HUD antiga
            if (this.currentHUD) {
                this.currentHUD.style.display = 'block';
                console.log('📋 HUD antiga ativada');
            }
            
            // Atualizar referências globais
            window.hudSystem = this.currentHUD;
            
            this.transitioning = false;
            console.log('✅ Transição para HUD antiga concluída');
        });
    }
    
    performTransition(callback) {
        // Efeito de fade
        const fadeOverlay = document.createElement('div');
        fadeOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        
        document.body.appendChild(fadeOverlay);
        
        // Fade in
        requestAnimationFrame(() => {
            fadeOverlay.style.opacity = '1';
        });
        
        // Executar callback e fade out
        setTimeout(() => {
            callback();
            
            fadeOverlay.style.opacity = '0';
            
            setTimeout(() => {
                document.body.removeChild(fadeOverlay);
            }, 300);
        }, 300);
    }
    
    toggleHUD() {
        if (!this.improvedHUD || !this.currentHUD) {
            console.log('⚠️ Ambas as HUDs não estão disponíveis');
            return;
        }
        
        const currentActive = window.hudSystem === this.improvedHUD;
        
        if (currentActive) {
            this.switchToOldHUD();
        } else {
            this.switchToImprovedHUD();
        }
    }
    
    getCurrentHUD() {
        return window.hudSystem;
    }
    
    isUsingImprovedHUD() {
        return window.hudSystem === this.improvedHUD;
    }
    
    // Métodos de conveniência para acessar a HUD atual
    updatePlayerState(state) {
        const currentHUD = this.getCurrentHUD();
        if (currentHUD && currentHUD.updatePlayerState) {
            currentHUD.updatePlayerState(state);
        }
    }
    
    showNotification(text, type = 'info', duration = 3000) {
        const currentHUD = this.getCurrentHUD();
        if (currentHUD && currentHUD.showNotification) {
            currentHUD.showNotification(text, type, duration);
        }
    }
    
    showDialogue(npcName, text, options = null) {
        const currentHUD = this.getCurrentHUD();
        if (currentHUD && currentHUD.showDialogue) {
            currentHUD.showDialogue(npcName, text, options);
        }
    }
    
    setCombatMode(enabled, targetInfo = null) {
        const currentHUD = this.getCurrentHUD();
        if (currentHUD && currentHUD.setCombatMode) {
            currentHUD.setCombatMode(enabled, targetInfo);
        }
    }
    
    show() {
        const currentHUD = this.getCurrentHUD();
        if (currentHUD && currentHUD.show) {
            currentHUD.show();
        }
    }
    
    hide() {
        const currentHUD = this.getCurrentHUD();
        if (currentHUD && currentHUD.hide) {
            currentHUD.hide();
        }
    }
    
    // Métodos de configuração
    autoSwitchToImproved() {
        console.log('🤖 Alternando automaticamente para HUD melhorada...');
        
        // Esperar um pouco para garantir que tudo foi carregado
        setTimeout(() => {
            this.switchToImprovedHUD();
        }, 1000);
    }
    
    addToggleKey() {
        // Adicionar tecla de atalho para alternar HUDs
        document.addEventListener('keydown', (e) => {
            // F12 para alternar
            if (e.key === 'F12') {
                e.preventDefault();
                this.toggleHUD();
                
                // Mostrar notificação
                const currentHUDName = this.isUsingImprovedHUD() ? 'Melhorada' : 'Antiga';
                this.showNotification(`HUD ${currentHUDName} ativada`, 'info', 2000);
            }
            
            // F11 para alternar automaticamente
            if (e.key === 'F11') {
                e.preventDefault();
                this.autoSwitchToImproved();
            }
        });
        
        console.log('⌨️ Teclas de atalho adicionadas: F12 (alternar), F11 (auto melhorada)');
    }
    
    // Sistema de debug
    enableDebugMode() {
        console.log('🐛 Modo debug da HUD ativado');
        
        // Adicionar classe de debug ao body
        document.body.classList.add('hud-debug-mode');
        
        // Adicionar informações no console
        setInterval(() => {
            const currentHUD = this.getCurrentHUD();
            const hudType = this.isUsingImprovedHUD() ? 'Melhorada' : 'Antiga';
            const fps = currentHUD ? currentHUD.getFPS ? currentHUD.getFPS() : 'N/A' : 'N/A';
            
            console.log(`🔍 HUD Debug: Tipo=${hudType}, FPS=${fps}, Ativa=${!!currentHUD}`);
        }, 5000);
    }
    
    disableDebugMode() {
        console.log('🐛 Modo debug da HUD desativado');
        document.body.classList.remove('hud-debug-mode');
    }
    
    // Sistema de performance
    monitorPerformance() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Se FPS baixo, sugerir mudança
                if (fps < 30 && this.isUsingImprovedHUD()) {
                    console.warn(`⚠️ FPS baixo detectado (${fps}). Considerando voltar para HUD antiga...`);
                    
                    // Opcional: alternar automaticamente
                    // this.switchToOldHUD();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        measureFPS();
    }
    
    // Inicialização completa
    fullInit() {
        console.log('🚀 Inicialização completa do sistema de HUD...');
        
        // Criar HUD melhorada
        this.createImprovedHUD();
        
        // Adicionar teclas de atalho
        this.addToggleKey();
        
        // Alternar automaticamente para melhorada
        this.autoSwitchToImproved();
        
        // Iniciar monitoramento de performance
        this.monitorPerformance();
        
        console.log('✅ Sistema de HUD completamente inicializado');
    }
    
    // Cleanup
    destroy() {
        console.log('🧹 Limpando sistema de integração da HUD...');
        
        // Remover HUD melhorada
        if (this.improvedHUD) {
            this.improvedHUD.hide();
            if (this.improvedHUD.canvas && this.improvedHUD.canvas.parentNode) {
                this.improvedHUD.canvas.parentNode.removeChild(this.improvedHUD.canvas);
            }
            this.improvedHUD = null;
        }
        
        // Remover CSS
        const cssElement = document.getElementById('improved-hud-css');
        if (cssElement) {
            cssElement.parentNode.removeChild(cssElement);
        }
        
        // Remover listeners
        // (implementar remoção específica se necessário)
        
        console.log('✅ Sistema de integração da HUD limpo');
    }
}

// Criar instância global
window.hudIntegration = new HUDIntegration();

// Auto-inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.hudIntegration.fullInit();
    });
} else {
    window.hudIntegration.fullInit();
}

// Exportar para uso global
window.HUDIntegration = HUDIntegration;
