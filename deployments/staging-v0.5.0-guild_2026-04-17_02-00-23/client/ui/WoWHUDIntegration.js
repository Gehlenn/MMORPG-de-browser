/**
 * WoW HUD Integration - Legacy of Komodo
 * Sistema de integração para HUD estilo World of Warcraft
 * Alternância entre HUDs com maximização de elementos
 */

class WoWHUDIntegration {
    constructor() {
        this.currentHUD = null;
        this.wowHUD = null;
        this.improvedHUD = null;
        this.transitioning = false;
        this.initialized = false;
        this.currentMode = 'normal'; // 'normal', 'improved', 'wow'
        
        // Configurações de alternância
        this.config = {
            autoSwitch: false,
            rememberPreference: true,
            transitions: {
                duration: 500,
                easing: 'ease-in-out'
            },
            keybindings: {
                toggleHUD: 'F10',
                switchToNormal: 'F9',
                switchToImproved: 'F8',
                switchToWoW: 'F7'
            }
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎮 Inicializando sistema de HUD WoW-style...');
        
        // Verificar HUDs existentes
        this.checkExistingHUDs();
        
        // Carregar CSS WoW-style
        this.loadWoWHUDCSS();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Carregar preferência salva
        this.loadUserPreference();
        
        console.log('✅ Sistema de HUD WoW-style inicializado');
        this.initialized = true;
    }
    
    checkExistingHUDs() {
        // Verificar HUD original
        const originalHUD = document.getElementById('integrated-hud');
        if (originalHUD) {
            console.log('📋 HUD original encontrada');
        }
        
        // Verificar HUD melhorada
        const improvedHUD = document.getElementById('improved-hud');
        if (improvedHUD) {
            console.log('🎨 HUD melhorada encontrada');
            this.improvedHUD = window.improvedHUD || null;
        }
        
        // Verificar se já existe HUD WoW-style
        const wowHUD = document.getElementById('wow-style-hud');
        if (wowHUD) {
            console.log('🎮 HUD WoW-style já existe');
            this.wowHUD = window.wowStyleHUD || null;
        }
    }
    
    loadWoWHUDCSS() {
        // Verificar se CSS já foi carregado
        const existingCSS = document.getElementById('wow-style-hud-css');
        if (existingCSS) {
            console.log('🎨 CSS WoW-style já carregado');
            return;
        }
        
        // Criar elemento link
        const link = document.createElement('link');
        link.id = 'wow-style-hud-css';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'css/wow-style-hud.css';
        
        // Adicionar ao head
        document.head.appendChild(link);
        
        // Verificar carregamento
        link.onload = () => {
            console.log('✅ CSS WoW-style carregado com sucesso');
        };
        
        link.onerror = () => {
            console.error('❌ Erro ao carregar CSS WoW-style');
        };
    }
    
    setupEventListeners() {
        // Eventos de teclado para alternância
        document.addEventListener('keydown', (e) => {
            // Prevenir se estiver em campo de input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.key) {
                case this.config.keybindings.toggleHUD:
                    e.preventDefault();
                    this.toggleHUDMode();
                    break;
                case this.config.keybindings.switchToNormal:
                    e.preventDefault();
                    this.switchToNormalHUD();
                    break;
                case this.config.keybindings.switchToImproved:
                    e.preventDefault();
                    this.switchToImprovedHUD();
                    break;
                case this.config.keybindings.switchToWoW:
                    e.preventDefault();
                    this.switchToWoWHUD();
                    break;
            }
        });
        
        // Eventos de estado do jogador
        window.addEventListener('playerStateUpdate', (event) => {
            this.updateAllHUDs(event.detail);
        });
        
        // Eventos de notificações
        window.addEventListener('showNotification', (event) => {
            this.showNotificationOnAllHUDs(event.detail.text, event.detail.type, event.detail.duration);
        });
        
        // Eventos de combate
        window.addEventListener('combatModeChange', (event) => {
            this.updateCombatModeOnAllHUDs(event.detail.enabled, event.detail.targetInfo);
        });
        
        // Eventos de alvo
        window.addEventListener('targetUpdate', (event) => {
            this.updateTargetOnAllHUDs(event.detail);
        });
        
        // Eventos de buffs/debuffs
        window.addEventListener('buffUpdate', (event) => {
            this.updateBuffsOnAllHUDs(event.detail.buffs, event.detail.debuffs);
        });
        
        // Eventos de inventário
        window.addEventListener('inventoryUpdate', (event) => {
            this.updateInventoryOnAllHUDs(event.detail);
        });
        
        // Evento de resize
        window.addEventListener('resize', () => {
            this.resizeAllHUDs();
        });
    }
    
    createWoWHUD() {
        if (this.wowHUD) {
            console.log('⚠️ HUD WoW-style já existe');
            return;
        }
        
        console.log('🎮 Criando HUD WoW-style...');
        
        // Verificar se assetManager está disponível
        const assetManager = window.assetManager || null;
        
        // Criar instância da HUD WoW-style
        this.wowHUD = new window.WoWStyleHUD(assetManager);
        
        // Configurar referência global
        window.wowStyleHUD = this.wowHUD;
        
        console.log('✅ HUD WoW-style criada com sucesso');
    }
    
    switchToNormalHUD() {
        if (this.currentMode === 'normal') {
            console.log('⚠️ Já está usando HUD normal');
            return;
        }
        
        console.log('🔄 Alternando para HUD normal...');
        this.performTransition(() => {
            // Esconder outras HUDs
            this.hideAllHUDs();
            
            // Mostrar HUD original se existir
            const originalHUD = document.getElementById('integrated-hud');
            if (originalHUD) {
                originalHUD.style.display = 'block';
                this.currentHUD = originalHUD;
            }
            
            // Atualizar modo
            this.currentMode = 'normal';
            window.hudSystem = this.currentHUD;
            
            // Salvar preferência
            this.saveUserPreference();
            
            console.log('✅ HUD normal ativada');
        });
    }
    
    switchToImprovedHUD() {
        if (this.currentMode === 'improved') {
            console.log('⚠️ Já está usando HUD melhorada');
            return;
        }
        
        if (!this.improvedHUD) {
            console.log('⚠️ HUD melhorada não disponível');
            return;
        }
        
        console.log('🔄 Alternando para HUD melhorada...');
        this.performTransition(() => {
            // Esconder outras HUDs
            this.hideAllHUDs();
            
            // Mostrar HUD melhorada
            this.improvedHUD.show();
            this.currentHUD = this.improvedHUD;
            
            // Atualizar modo
            this.currentMode = 'improved';
            window.hudSystem = this.improvedHUD;
            
            // Salvar preferência
            this.saveUserPreference();
            
            console.log('✅ HUD melhorada ativada');
        });
    }
    
    switchToWoWHUD() {
        if (this.currentMode === 'wow') {
            console.log('⚠️ Já está usando HUD WoW-style');
            return;
        }
        
        if (!this.wowHUD) {
            this.createWoWHUD();
        }
        
        console.log('🔄 Alternando para HUD WoW-style...');
        this.performTransition(() => {
            // Esconder outras HUDs
            this.hideAllHUDs();
            
            // Mostrar HUD WoW-style
            this.wowHUD.show();
            this.currentHUD = this.wowHUD;
            
            // Atualizar modo
            this.currentMode = 'wow';
            window.hudSystem = this.wowHUD;
            
            // Salvar preferência
            this.saveUserPreference();
            
            console.log('✅ HUD WoW-style ativada');
        });
    }
    
    toggleHUDMode() {
        console.log('🔄 Alternando modo de HUD...');
        
        // Ciclo: normal -> improved -> wow -> normal
        switch(this.currentMode) {
            case 'normal':
                this.switchToImprovedHUD();
                break;
            case 'improved':
                this.switchToWoWHUD();
                break;
            case 'wow':
                this.switchToNormalHUD();
                break;
            default:
                this.switchToImprovedHUD();
        }
    }
    
    performTransition(callback) {
        if (this.transitioning) {
            console.log('⚠️ Transição já em andamento');
            return;
        }
        
        this.transitioning = true;
        
        // Efeito de transição WoW-style
        const transitionOverlay = document.createElement('div');
        transitionOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
            z-index: 9999;
            opacity: 0;
            transition: opacity ${this.config.transitions.duration}ms ${this.config.transitions.easing};
            pointer-events: none;
        `;
        
        document.body.appendChild(transitionOverlay);
        
        // Fade in
        requestAnimationFrame(() => {
            transitionOverlay.style.opacity = '1';
        });
        
        // Executar callback e fade out
        setTimeout(() => {
            callback();
            
            transitionOverlay.style.opacity = '0';
            
            setTimeout(() => {
                document.body.removeChild(transitionOverlay);
                this.transitioning = false;
            }, this.config.transitions.duration);
        }, this.config.transitions.duration / 2);
    }
    
    hideAllHUDs() {
        // Esconder HUD original
        const originalHUD = document.getElementById('integrated-hud');
        if (originalHUD) {
            originalHUD.style.display = 'none';
        }
        
        // Esconder HUD melhorada
        if (this.improvedHUD) {
            this.improvedHUD.hide();
        }
        
        // Esconder HUD WoW-style
        if (this.wowHUD) {
            this.wowHUD.hide();
        }
    }
    
    // Métodos de atualização para todas as HUDs
    updateAllHUDs(playerState) {
        if (this.improvedHUD) {
            this.improvedHUD.updatePlayerState(playerState);
        }
        
        if (this.wowHUD) {
            this.wowHUD.updatePlayerState(playerState);
        }
    }
    
    showNotificationOnAllHUDs(text, type = 'info', duration = 3000) {
        if (this.improvedHUD) {
            this.improvedHUD.showNotification(text, type, duration);
        }
        
        if (this.wowHUD) {
            this.wowHUD.showNotification(text, type, duration);
        }
    }
    
    updateCombatModeOnAllHUDs(enabled, targetInfo = null) {
        if (this.improvedHUD) {
            this.improvedHUD.setCombatMode(enabled, targetInfo);
        }
        
        if (this.wowHUD) {
            this.wowHUD.setCombatMode(enabled);
        }
    }
    
    updateTargetOnAllHUDs(targetState) {
        if (this.wowHUD) {
            this.wowHUD.updateTargetState(targetState);
        }
    }
    
    updateBuffsOnAllHUDs(buffs, debuffs) {
        if (this.wowHUD) {
            // Limpar buffs/debuffs existentes
            this.wowHUD.uiState.buffs = [];
            this.wowHUD.uiState.debuffs = [];
            
            // Adicionar novos buffs
            buffs.forEach(buff => {
                this.wowHUD.addBuff(buff);
            });
            
            // Adicionar novos debuffs
            debuffs.forEach(debuff => {
                this.wowHUD.addDebuff(debuff);
            });
        }
    }
    
    updateInventoryOnAllHUDs(inventoryState) {
        if (this.wowHUD) {
            // Atualizar inventário WoW-style
            this.wowHUD.inventory.slots = inventoryState.slots || [];
            this.wowHUD.playerState.gold = inventoryState.gold || 0;
            this.wowHUD.playerState.silver = inventoryState.silver || 0;
            this.wowHUD.playerState.copper = inventoryState.copper || 0;
        }
    }
    
    resizeAllHUDs() {
        if (this.improvedHUD) {
            this.improvedHUD.resize();
        }
        
        if (this.wowHUD) {
            this.wowHUD.resize();
        }
    }
    
    // Métodos de preferência do usuário
    saveUserPreference() {
        if (!this.config.rememberPreference) return;
        
        try {
            localStorage.setItem('wow-hud-preference', this.currentMode);
            console.log(`💾 Preferência salva: ${this.currentMode}`);
        } catch (error) {
            console.warn('⚠️ Erro ao salvar preferência:', error);
        }
    }
    
    loadUserPreference() {
        if (!this.config.rememberPreference) return;
        
        try {
            const savedPreference = localStorage.getItem('wow-hud-preference');
            if (savedPreference) {
                console.log(`📂 Preferência carregada: ${savedPreference}`);
                
                // Aplicar preferência após um pequeno delay
                setTimeout(() => {
                    switch(savedPreference) {
                        case 'normal':
                            this.switchToNormalHUD();
                            break;
                        case 'improved':
                            this.switchToImprovedHUD();
                            break;
                        case 'wow':
                            this.switchToWoWHUD();
                            break;
                    }
                }, 1000);
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar preferência:', error);
        }
    }
    
    // Métodos de conveniência
    getCurrentHUD() {
        return this.currentHUD;
    }
    
    getCurrentMode() {
        return this.currentMode;
    }
    
    isUsingWoWHUD() {
        return this.currentMode === 'wow';
    }
    
    // Métodos de API unificada
    updatePlayerState(state) {
        this.updateAllHUDs(state);
    }
    
    showNotification(text, type = 'info', duration = 3000) {
        this.showNotificationOnAllHUDs(text, type, duration);
    }
    
    setCombatMode(enabled, targetInfo = null) {
        this.updateCombatModeOnAllHUDs(enabled, targetInfo);
    }
    
    updateTargetState(state) {
        this.updateTargetOnAllHUDs(state);
    }
    
    addBuff(buff) {
        if (this.wowHUD) {
            this.wowHUD.addBuff(buff);
        }
    }
    
    addDebuff(debuff) {
        if (this.wowHUD) {
            this.wowHUD.addDebuff(debuff);
        }
    }
    
    updateInventory(state) {
        this.updateInventoryOnAllHUDs(state);
    }
    
    show() {
        if (this.currentHUD) {
            if (typeof this.currentHUD.show === 'function') {
                this.currentHUD.show();
            } else {
                this.currentHUD.style.display = 'block';
            }
        }
    }
    
    hide() {
        if (this.currentHUD) {
            if (typeof this.currentHUD.hide === 'function') {
                this.currentHUD.hide();
            } else {
                this.currentHUD.style.display = 'none';
            }
        }
    }
    
    // Sistema de configuração
    configure(options) {
        Object.assign(this.config, options);
        console.log('⚙️ Configuração atualizada:', this.config);
    }
    
    // Sistema de debug
    enableDebugMode() {
        console.log('🐛 Modo debug da HUD WoW ativado');
        
        // Adicionar classe de debug
        document.body.classList.add('wow-debug-mode');
        
        // Log informações detalhadas
        setInterval(() => {
            const currentHUDName = this.getCurrentMode();
            const fps = this.getCurrentFPS();
            const memory = this.getMemoryUsage();
            
            console.log(`🔍 WoW HUD Debug: Mode=${currentHUDName}, FPS=${fps}, Memory=${memory}MB`);
        }, 5000);
    }
    
    disableDebugMode() {
        console.log('🐛 Modo debug da HUD WoW desativado');
        document.body.classList.remove('wow-debug-mode');
    }
    
    getCurrentFPS() {
        if (this.currentHUD && typeof this.currentHUD.getFPS === 'function') {
            return this.currentHUD.getFPS();
        }
        return 'N/A';
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / 1048576);
        }
        return 'N/A';
    }
    
    // Sistema de performance
    monitorPerformance() {
        let frameCount = 0;
        let lastTime = performance.now();
        let fpsHistory = [];
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                fpsHistory.push(fps);
                
                // Manter apenas últimos 10 segundos
                if (fpsHistory.length > 10) {
                    fpsHistory.shift();
                }
                
                // Calcular média
                const avgFPS = Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length);
                
                // Se FPS baixo, sugerir mudança
                if (avgFPS < 30 && this.currentMode === 'wow') {
                    console.warn(`⚠️ FPS baixo detectado (${avgFPS}). Considerando voltar para HUD normal...`);
                    
                    // Opcional: alternar automaticamente
                    // this.switchToImprovedHUD();
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
        console.log('🚀 Inicialização completa do sistema de HUD WoW...');
        
        // Criar HUD WoW-style
        this.createWoWHUD();
        
        // Iniciar monitoramento de performance
        this.monitorPerformance();
        
        // Auto-alterar se configurado
        if (this.config.autoSwitch) {
            setTimeout(() => {
                this.switchToWoWHUD();
            }, 2000);
        }
        
        console.log('✅ Sistema de HUD WoW completamente inicializado');
    }
    
    // Informações do sistema
    getSystemInfo() {
        return {
            currentMode: this.currentMode,
            availableHUDs: {
                normal: !!document.getElementById('integrated-hud'),
                improved: !!this.improvedHUD,
                wow: !!this.wowHUD
            },
            config: this.config,
            performance: {
                fps: this.getCurrentFPS(),
                memory: this.getMemoryUsage()
            },
            features: {
                transitions: true,
                keybindings: true,
                preferences: true,
                debug: true,
                monitoring: true
            }
        };
    }
    
    // Exportar configuração
    exportConfig() {
        const configData = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            config: this.config,
            userPreference: this.currentMode,
            systemInfo: this.getSystemInfo()
        };
        
        const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wow-hud-config.json';
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📄 Configuração exportada');
    }
    
    // Importar configuração
    importConfig(configData) {
        try {
            const config = JSON.parse(configData);
            
            if (config.config) {
                this.configure(config.config);
            }
            
            if (config.userPreference) {
                this.currentMode = config.userPreference;
                this.switchToMode(config.userPreference);
            }
            
            console.log('📂 Configuração importada com sucesso');
        } catch (error) {
            console.error('❌ Erro ao importar configuração:', error);
        }
    }
    
    switchToMode(mode) {
        switch(mode) {
            case 'normal':
                this.switchToNormalHUD();
                break;
            case 'improved':
                this.switchToImprovedHUD();
                break;
            case 'wow':
                this.switchToWoWHUD();
                break;
            default:
                console.warn(`⚠️ Modo desconhecido: ${mode}`);
        }
    }
    
    // Cleanup
    destroy() {
        console.log('🧹 Limpando sistema de HUD WoW...');
        
        // Esconder todas as HUDs
        this.hideAllHUDs();
        
        // Remover HUD WoW-style
        if (this.wowHUD) {
            this.wowHUD.hide();
            if (this.wowHUD.canvas && this.wowHUD.canvas.parentNode) {
                this.wowHUD.canvas.parentNode.removeChild(this.wowHUD.canvas);
            }
            this.wowHUD = null;
        }
        
        // Remover CSS
        const cssElement = document.getElementById('wow-style-hud-css');
        if (cssElement) {
            cssElement.parentNode.removeChild(cssElement);
        }
        
        // Limpar referências globais
        delete window.wowStyleHUD;
        
        console.log('✅ Sistema de HUD WoW limpo');
    }
}

// Criar instância global
window.wowHUDIntegration = new WoWHUDIntegration();

// Auto-inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.wowHUDIntegration.fullInit();
    });
} else {
    window.wowHUDIntegration.fullInit();
}

// Exportar para uso global
window.WoWHUDIntegration = WoWHUDIntegration;
