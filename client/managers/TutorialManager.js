/**
 * TutorialManager - Sistema de Tutorial e Dicas
 * 
 * Gerencia:
 * - Tutorial passo a passo para novos jogadores
 * - Dicas contextuais
 * - Tooltips explicativos
 * - Progresso de tutorial salvo
 */

class TutorialManager {
    constructor(gameplayEngine) {
        this.engine = gameplayEngine;
        
        // Estado
        this.active = false;
        this.currentStep = 0;
        this.completed = false;
        this.showHints = true;
        
        // Configuração dos passos do tutorial
        this.steps = [
            {
                id: 'welcome',
                title: 'Bem-vindo!',
                message: 'Use WASD para se mover pelo mundo. Segure Shift para correr mais rápido!',
                highlight: null,
                condition: { type: 'move', distance: 100 },
                duration: 5000,
                position: 'center'
            },
            {
                id: 'combat',
                title: 'Combate',
                message: 'Pressione ESPAÇO para atacar mobs próximos. Experimente em um inimigo!',
                highlight: 'mobs',
                condition: { type: 'attack', count: 1 },
                duration: 6000,
                position: 'top'
            },
            {
                id: 'loot',
                title: 'Coletando Itens',
                message: 'Ande sobre itens dourados para coletar ou segure E para puxar itens próximos.',
                highlight: 'loot',
                condition: { type: 'collect', count: 1 },
                duration: 5000,
                position: 'top'
            },
            {
                id: 'npc',
                title: 'NPCs',
                message: 'Aproxime-se de NPCs (quadrados azuis) e pressione E para interagir.',
                highlight: 'npcs',
                condition: { type: 'interact', count: 1 },
                duration: 6000,
                position: 'top'
            },
            {
                id: 'minimap',
                title: 'Minimapa',
                message: 'Veja sua posição e entidades próximas no minimapa no canto superior direito.',
                highlight: 'minimap',
                condition: { type: 'wait', seconds: 3 },
                duration: 4000,
                position: 'center'
            },
            {
                id: 'worldmap',
                title: 'Mapa Mundial',
                message: 'Pressione M para abrir o mapa completo e ver todas as zonas do mundo.',
                highlight: null,
                condition: { type: 'key', key: 'm' },
                duration: 5000,
                position: 'center'
            },
            {
                id: 'skills',
                title: 'Habilidades',
                message: 'Use as teclas 1, 2 e 3 para usar habilidades especiais.',
                highlight: null,
                condition: { type: 'skill', count: 1 },
                duration: 4000,
                position: 'top'
            },
            {
                id: 'complete',
                title: 'Tutorial Completo!',
                message: 'Parabéns! Você aprendeu o básico. Explore o mundo e divirta-se!',
                highlight: null,
                condition: { type: 'wait', seconds: 2 },
                duration: 5000,
                position: 'center'
            }
        ];
        
        // Tracking
        this.progress = {
            distanceMoved: 0,
            attacksMade: 0,
            itemsCollected: 0,
            npcsInteracted: 0,
            skillsUsed: 0,
            waitStartTime: 0
        };
        
        this.lastPlayerPos = null;
        this.ui = null;
        
        // Dicas contextuais
        this.contextualHints = [
            { id: 'health_low', condition: () => this.engine.player?.hp < this.engine.player?.maxHp * 0.3, message: '⚠️ Vida baixa! Cuidado com os inimigos.' },
            { id: 'level_up', condition: () => this.engine.player?.xp > this.engine.player?.maxExp * 0.9, message: '⭐ Você está perto de subir de nível!' },
            { id: 'many_mobs', condition: () => this.engine.mobs?.length > 10, message: '👾 Muitos inimigos por aqui. Tome cuidado!' }
        ];
        
        this.shownHints = new Set();
        this.hintCooldown = 0;
    }
    
    /**
     * Inicializa o tutorial
     */
    init() {
        // Carregar progresso salvo
        this.loadProgress();
        
        // Se não completou, iniciar
        if (!this.completed && this.engine.config.showTutorial !== false) {
            this.start();
        }
        
        console.log('📚 TutorialManager inicializado');
    }
    
    /**
     * Carrega progresso do localStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('tutorialProgress');
            if (saved) {
                const data = JSON.parse(saved);
                this.currentStep = data.step || 0;
                this.completed = data.completed || false;
                this.showHints = data.showHints !== false;
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar progresso do tutorial:', e);
        }
    }
    
    /**
     * Salva progresso
     */
    saveProgress() {
        try {
            localStorage.setItem('tutorialProgress', JSON.stringify({
                step: this.currentStep,
                completed: this.completed,
                showHints: this.showHints,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('⚠️ Erro ao salvar progresso do tutorial:', e);
        }
    }
    
    /**
     * Inicia o tutorial
     */
    start() {
        if (this.completed) return;
        
        this.active = true;
        this.createUI();
        this.showCurrentStep();
        
        console.log('📚 Tutorial iniciado');
    }
    
    /**
     * Cria UI do tutorial
     */
    createUI() {
        if (this.ui) return;
        
        // Container principal
        const container = document.createElement('div');
        container.id = 'tutorial-overlay';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9000;
            display: none;
        `;
        
        // Painel do tutorial
        const panel = document.createElement('div');
        panel.id = 'tutorial-panel';
        panel.style.cssText = `
            position: absolute;
            background: rgba(20, 30, 40, 0.95);
            border: 2px solid #4CAF50;
            border-radius: 12px;
            padding: 20px;
            max-width: 400px;
            color: white;
            font-family: Arial, sans-serif;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            pointer-events: auto;
            transition: all 0.3s ease;
        `;
        
        // Título
        const title = document.createElement('h3');
        title.id = 'tutorial-title';
        title.style.cssText = `
            margin: 0 0 10px 0;
            color: #4CAF50;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        panel.appendChild(title);
        
        // Mensagem
        const message = document.createElement('p');
        message.id = 'tutorial-message';
        message.style.cssText = `
            margin: 0 0 15px 0;
            font-size: 14px;
            line-height: 1.5;
        `;
        panel.appendChild(message);
        
        // Barra de progresso
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            height: 4px;
            border-radius: 2px;
            margin-bottom: 10px;
            overflow: hidden;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.id = 'tutorial-progress';
        progressFill.style.cssText = `
            background: #4CAF50;
            height: 100%;
            width: 0%;
            transition: width 0.3s;
        `;
        progressBar.appendChild(progressFill);
        panel.appendChild(progressBar);
        
        // Botões
        const buttons = document.createElement('div');
        buttons.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: space-between;
        `;
        
        // Botão pular
        const skipBtn = document.createElement('button');
        skipBtn.textContent = 'Pular Tutorial';
        skipBtn.style.cssText = `
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: rgba(255, 255, 255, 0.7);
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        `;
        skipBtn.onmouseenter = () => {
            skipBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            skipBtn.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        };
        skipBtn.onmouseleave = () => {
            skipBtn.style.background = 'transparent';
            skipBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        };
        skipBtn.onclick = () => this.skip();
        buttons.appendChild(skipBtn);
        
        // Botão próximo
        const nextBtn = document.createElement('button');
        nextBtn.id = 'tutorial-next-btn';
        nextBtn.textContent = 'Próximo →';
        nextBtn.style.cssText = `
            background: #4CAF50;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        `;
        nextBtn.onmouseenter = () => nextBtn.style.background = '#45a049';
        nextBtn.onmouseleave = () => nextBtn.style.background = '#4CAF50';
        nextBtn.onclick = () => this.nextStep();
        buttons.appendChild(nextBtn);
        
        panel.appendChild(buttons);
        container.appendChild(panel);
        
        // Highlight overlay
        const highlight = document.createElement('div');
        highlight.id = 'tutorial-highlight';
        highlight.style.cssText = `
            position: absolute;
            border: 3px solid #FFD700;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.2);
            pointer-events: none;
            display: none;
            animation: pulse 1.5s infinite;
        `;
        container.appendChild(highlight);
        
        document.body.appendChild(container);
        
        this.ui = {
            container,
            panel,
            title,
            message,
            progressFill,
            nextBtn,
            highlight
        };
    }
    
    /**
     * Mostra o passo atual
     */
    showCurrentStep() {
        if (!this.active || this.currentStep >= this.steps.length) {
            this.complete();
            return;
        }
        
        const step = this.steps[this.currentStep];
        
        // Atualizar UI
        this.ui.title.innerHTML = `📚 ${step.title}`;
        this.ui.message.textContent = step.message;
        this.ui.progressFill.style.width = `${((this.currentStep + 1) / this.steps.length) * 100}%`;
        
        // Posicionar
        this.positionPanel(step.position);
        
        // Highlight
        if (step.highlight) {
            this.showHighlight(step.highlight);
        } else {
            this.ui.highlight.style.display = 'none';
        }
        
        // Mostrar
        this.ui.container.style.display = 'block';
        
        // Reset tracking
        this.resetProgressTracking();
        
        console.log(`📚 Tutorial: ${step.title}`);
    }
    
    /**
     * Posiciona o painel
     */
    positionPanel(position) {
        const panel = this.ui.panel;
        panel.style.top = '';
        panel.style.bottom = '';
        panel.style.left = '';
        panel.style.right = '';
        panel.style.transform = '';
        
        switch (position) {
            case 'center':
                panel.style.top = '50%';
                panel.style.left = '50%';
                panel.style.transform = 'translate(-50%, -50%)';
                break;
            case 'top':
                panel.style.top = '20%';
                panel.style.left = '50%';
                panel.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                panel.style.bottom = '20%';
                panel.style.left = '50%';
                panel.style.transform = 'translateX(-50%)';
                break;
        }
    }
    
    /**
     * Mostra highlight em elemento
     */
    showHighlight(target) {
        const highlight = this.ui.highlight;
        const canvas = this.engine.canvas;
        
        let x, y, width, height;
        
        switch (target) {
            case 'minimap':
                x = canvas.width - 220;
                y = 20;
                width = 200;
                height = 200;
                break;
            case 'mobs':
                // Encontrar mob mais próximo
                if (this.engine.mobs.length > 0) {
                    const mob = this.engine.mobs[0];
                    x = mob.x - this.engine.camera.x + canvas.width / 2 - 20;
                    y = mob.y - this.engine.camera.y + canvas.height / 2 - 20;
                    width = 64;
                    height = 64;
                }
                break;
            case 'loot':
                if (this.engine.lootDrops.length > 0) {
                    const loot = this.engine.lootDrops[0];
                    x = loot.x - this.engine.camera.x + canvas.width / 2 - 20;
                    y = loot.y - this.engine.camera.y + canvas.height / 2 - 20;
                    width = 40;
                    height = 40;
                }
                break;
            case 'npcs':
                // Centro da tela
                x = canvas.width / 2 - 50;
                y = canvas.height / 2 - 50;
                width = 100;
                height = 100;
                break;
            default:
                highlight.style.display = 'none';
                return;
        }
        
        if (x !== undefined) {
            highlight.style.left = `${x}px`;
            highlight.style.top = `${y}px`;
            highlight.style.width = `${width}px`;
            highlight.style.height = `${height}px`;
            highlight.style.display = 'block';
        }
    }
    
    /**
     * Próximo passo
     */
    nextStep() {
        this.currentStep++;
        this.saveProgress();
        this.showCurrentStep();
    }
    
    /**
     * Pula tutorial
     */
    skip() {
        this.active = false;
        this.completed = true;
        this.saveProgress();
        
        if (this.ui) {
            this.ui.container.style.display = 'none';
        }
        
        console.log('📚 Tutorial pulado');
    }
    
    /**
     * Completa tutorial
     */
    complete() {
        this.active = false;
        this.completed = true;
        this.saveProgress();
        
        if (this.ui) {
            this.ui.container.style.display = 'none';
        }
        
        console.log('📚 Tutorial completado!');
        
        // Mostrar notificação
        if (window.effectsManager) {
            window.effectsManager.showToast('Tutorial Completado! 🎉', { type: 'success' });
        }
    }
    
    /**
     * Reset tracking do passo atual
     */
    resetProgressTracking() {
        const step = this.steps[this.currentStep];
        
        this.progress = {
            distanceMoved: 0,
            attacksMade: 0,
            itemsCollected: 0,
            npcsInteracted: 0,
            skillsUsed: 0,
            waitStartTime: step?.condition?.type === 'wait' ? Date.now() : 0
        };
        
        this.lastPlayerPos = this.engine.player ? { 
            x: this.engine.player.x, 
            y: this.engine.player.y 
        } : null;
    }
    
    /**
     * Update do tutorial - chamado no game loop
     */
    update() {
        if (!this.active) {
            this.updateContextualHints();
            return;
        }
        
        const step = this.steps[this.currentStep];
        if (!step) return;
        
        const condition = step.condition;
        let completed = false;
        
        switch (condition.type) {
            case 'move':
                if (this.engine.player && this.lastPlayerPos) {
                    const dx = this.engine.player.x - this.lastPlayerPos.x;
                    const dy = this.engine.player.y - this.lastPlayerPos.y;
                    this.progress.distanceMoved += Math.sqrt(dx * dx + dy * dy);
                    this.lastPlayerPos = { x: this.engine.player.x, y: this.engine.player.y };
                    
                    if (this.progress.distanceMoved >= condition.distance) {
                        completed = true;
                    }
                }
                break;
                
            case 'attack':
                // Verificado externamente
                break;
                
            case 'collect':
                // Verificado externamente
                break;
                
            case 'interact':
                // Verificado externamente
                break;
                
            case 'skill':
                // Verificado externamente
                break;
                
            case 'key':
                if (this.engine.keys[condition.key]) {
                    completed = true;
                }
                break;
                
            case 'wait':
                if (Date.now() - this.progress.waitStartTime >= condition.seconds * 1000) {
                    completed = true;
                }
                break;
        }
        
        if (completed) {
            setTimeout(() => this.nextStep(), 500);
        }
    }
    
    /**
     * Update dicas contextuais
     */
    updateContextualHints() {
        if (!this.showHints || Date.now() < this.hintCooldown) return;
        
        for (const hint of this.contextualHints) {
            if (this.shownHints.has(hint.id)) continue;
            
            if (hint.condition()) {
                this.shownHints.add(hint.id);
                this.hintCooldown = Date.now() + 10000; // 10s cooldown
                
                if (window.effectsManager) {
                    window.effectsManager.showToast(hint.message, { 
                        type: 'warning',
                        duration: 5000 
                    });
                }
                break;
            }
        }
    }
    
    /**
     * Registra ação do jogador
     */
    trackAction(type) {
        if (!this.active) return;
        
        const step = this.steps[this.currentStep];
        if (!step || step.condition.type !== type) return;
        
        switch (type) {
            case 'attack':
                this.progress.attacksMade++;
                if (this.progress.attacksMade >= step.condition.count) {
                    setTimeout(() => this.nextStep(), 500);
                }
                break;
                
            case 'collect':
                this.progress.itemsCollected++;
                if (this.progress.itemsCollected >= step.condition.count) {
                    setTimeout(() => this.nextStep(), 500);
                }
                break;
                
            case 'interact':
                this.progress.npcsInteracted++;
                if (this.progress.npcsInteracted >= step.condition.count) {
                    setTimeout(() => this.nextStep(), 500);
                }
                break;
                
            case 'skill':
                this.progress.skillsUsed++;
                if (this.progress.skillsUsed >= step.condition.count) {
                    setTimeout(() => this.nextStep(), 500);
                }
                break;
        }
    }
    
    /**
     * Reseta tutorial
     */
    reset() {
        this.currentStep = 0;
        this.completed = false;
        this.active = false;
        this.shownHints.clear();
        this.saveProgress();
        console.log('📚 Tutorial resetado');
    }
}

// Exportar
window.TutorialManager = TutorialManager;
