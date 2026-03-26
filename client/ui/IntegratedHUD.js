/**
 * Integrated HUD System - Legacy of Komodo
 * Sistema de HUD completo do mundo de Aethelgard
 * Fragmentos de Komodo e civilizações perdidas
 */

class IntegratedHUD {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.canvas = null;
        this.ctx = null;
        this.visible = true;
        
        // Configurações do mundo
        this.gameWorld = {
            name: 'Aethelgard',
            title: 'Legacy of Komodo',
            lore: 'Mundo de fantasia medieval com Fragmentos de Komodo'
        };
        
        // Elementos do HUD
        this.elements = {
            healthBar: { x: 20, y: 20, width: 200, height: 20 },
            manaBar: { x: 20, y: 45, width: 200, height: 15 },
            expBar: { x: 20, y: 65, width: 200, height: 10 },
            minimap: { x: 20, y: 100, width: 150, height: 150 },
            playerInfo: { x: 20, y: 260, width: 150, height: 80 },
            inventory: { x: 20, y: 350, width: 150, height: 100 },
            chat: { x: 20, y: 460, width: 300, height: 120 },
            questTracker: { x: 340, y: 20, width: 200, height: 150 },
            skills: { x: 340, y: 180, width: 200, height: 100 },
            raidInfo: { x: 560, y: 20, width: 200, height: 120 },
            notifications: { x: 560, y: 150, width: 200, height: 80 }
        };
        
        // Estado do jogador
        this.playerState = {
            name: 'Hero',
            level: 1,
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            exp: 0,
            maxExp: 100,
            gold: 0,
            fragments: 0, // Fragmentos de Komodo
            position: { x: 400, y: 300 },
            stats: {
                attack: 10,
                defense: 5,
                speed: 200
            }
        };
        
        // Estado da UI
        this.uiState = {
            showInventory: false,
            showChat: false,
            showQuests: false,
            showSkills: false,
            currentDialogue: null,
            notifications: [],
            combatMode: false
        };
        
        // Animações
        this.animations = {
            healthBar: { current: 100, target: 100 },
            manaBar: { current: 50, target: 50 },
            expBar: { current: 0, target: 0 }
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎮 Inicializando HUD integrado...');
        
        // Verificar se já existe canvas com este ID
        const existingCanvas = document.getElementById('integrated-hud');
        if (existingCanvas) {
            console.log('⚠️ Canvas integrated-hud já existe, removendo...');
            existingCanvas.remove();
        }
        
        // Criar canvas para HUD
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'integrated-hud';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1'; // Muito baixo para não interferir com UI
        
        // Inicialmente oculto - só aparece após login no gameplay
        this.canvas.style.display = 'none';
        
        // TORNAR CANVAS TRANSPARENTE
        this.canvas.style.backgroundColor = 'transparent';
        this.canvas.style.background = 'transparent';
        
        // Adicionar ao DOM ATRÁS de outros elementos
        setTimeout(() => {
            document.body.appendChild(this.canvas);
            console.log('✅ Canvas HUD adicionado ao DOM');
        }, 100);
        
        // Configurar contexto
        this.ctx = this.canvas.getContext('2d');
        
        // Configurar canvas para ser transparente
        this.ctx.globalAlpha = 1.0;
        
        // Ajustar tamanho da tela
        this.resize();
        
        // Event listeners
        this.setupEventListeners();
        
        console.log('✅ HUD integrado inicializado (oculto até login)');
    }
    
    setupEventListeners() {
        // Teclas de atalho para HUD
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'i':
                    this.toggleInventory();
                    break;
                case 'c':
                    this.toggleChat();
                    break;
                case 'q':
                    this.toggleQuests();
                    break;
                case 'k':
                    this.toggleSkills();
                    break;
                case 'escape':
                    this.closeAllPanels();
                    break;
            }
        });
        
        // Redimensionamento
        window.addEventListener('resize', () => {
            this.resize();
        });
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Ajustar posições dos elementos
        this.adjustPositions();
    }
    
    adjustPositions() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Ajustar minimap para canto superior direito
        this.elements.minimap.x = width - 170;
        this.elements.minimap.y = 20;
        
        // Ajustar painéis para canto inferior direito
        this.elements.questTracker.x = width - 220;
        this.elements.questTracker.y = height - 170;
        this.elements.skills.x = width - 220;
        this.elements.skills.y = height - 280;
        
        // Ajustar chat para canto inferior esquerdo
        this.elements.chat.x = 20;
        this.elements.chat.y = height - 140;
    }
    
    update(deltaTime) {
        if (!this.visible) return;
        
        // Atualizar animações das barras
        this.updateAnimations(deltaTime);
        
        // Atualizar notificações
        this.updateNotifications(deltaTime);
    }
    
    updateAnimations(deltaTime) {
        // Animação suave da barra de vida
        const healthDiff = this.animations.healthBar.target - this.animations.healthBar.current;
        this.animations.healthBar.current += healthDiff * deltaTime * 0.005;
        
        // Animação suave da barra de mana
        const manaDiff = this.animations.manaBar.target - this.animations.manaBar.current;
        this.animations.manaBar.current += manaDiff * deltaTime * 0.005;
        
        // Animação suave da barra de exp
        const expDiff = this.animations.expBar.target - this.animations.expBar.current;
        this.animations.expBar.current += expDiff * deltaTime * 0.005;
    }
    
    updateNotifications(deltaTime) {
        // Atualizar tempo de vida das notificações
        this.uiState.notifications = this.uiState.notifications.filter(notification => {
            notification.lifeTime -= deltaTime;
            return notification.lifeTime > 0;
        });
    }
    
    render() {
        if (!this.ctx || !this.visible) return;
        
        // Limpar canvas completamente para transparência total
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // NÃO desenhar background preto - deixar transparente
        
        // Renderizar elementos na ordem correta
        this.renderHealthBar();
        this.renderManaBar();
        this.renderExpBar();
        this.renderMinimap();
        this.renderPlayerInfo();
        this.renderInventory();
        this.renderChat();
        this.renderQuestTracker();
        this.renderSkills();
        this.renderRaidInfo();
        
        // Renderizar notificações
        this.renderNotifications();
        
        // Renderizar modo de combate
        if (this.uiState.combatMode) this.renderCombatMode();
    }
    
    renderPlayerInfo() {
        const { x, y, width, height } = this.elements.playerInfo;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, width, height);
        
        // Borda
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Texto do jogador
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(this.playerState.name, x + 10, y + 20);
        
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Level ${this.playerState.level}`, x + 10, y + 40);
        this.ctx.fillText(`Gold: ${this.playerState.gold}`, x + 10, y + 60);
        
        // Fragmentos de Komodo
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(`🐉 ${this.playerState.fragments}`, x + 10, y + 75);
    }
    
    renderHealthBar() {
        const { x, y, width, height } = this.elements.healthBar;
        const percentage = this.animations.healthBar.current / 100;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, width, height);
        
        // Borda
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        
        // Barra de vida
        const healthColor = percentage > 0.5 ? '#4CAF50' : percentage > 0.25 ? '#FFC107' : '#F44336';
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(x + 2, y + 2, (width - 4) * percentage, height - 4);
        
        // Texto
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`${Math.round(this.playerState.health)}/${this.playerState.maxHealth} HP`, x + 5, y + height - 5);
    }
    
    renderManaBar() {
        const { x, y, width, height } = this.elements.manaBar;
        const percentage = this.animations.manaBar.current / 100;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, width, height);
        
        // Borda
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        
        // Barra de mana
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(x + 2, y + 2, (width - 4) * percentage, height - 4);
        
        // Texto
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`${Math.round(this.playerState.mana)}/${this.playerState.maxMana} MP`, x + 5, y + height - 5);
    }
    
    renderExpBar() {
        const { x, y, width, height } = this.elements.expBar;
        const percentage = this.animations.expBar.current / 100;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, width, height);
        
        // Borda
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        
        // Barra de exp
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 2, y + 2, (width - 4) * percentage, height - 4);
        
        // Texto
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '9px Arial';
        this.ctx.fillText(`EXP: ${this.playerState.exp}/${this.playerState.maxExp}`, x + 5, y + height - 3);
    }
    
    renderMinimap() {
        const { x, y, width, height } = this.elements.minimap;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(x, y, width, height);
        
        // Borda
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Título
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.fillText('MAPA', x + width/2 - 20, y + 15);
        
        // Desenhar posição do jogador (simplificado)
        const playerMapX = x + (this.playerState.position.x / 800) * width;
        const playerMapY = y + (this.playerState.position.y / 600) * height;
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(playerMapX - 2, playerMapY - 2, 4, 4);
    }
    
    renderChat() {
        const { x, y, width, height } = this.elements.chat;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, width, height);
        
        // Borda
        this.ctx.strokeStyle = '#2196F3';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Título
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText('CHAT', x + 10, y + 20);
        
        // Mensagens placeholder
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#AAA';
        this.ctx.fillText('[Sistema] Bem-vindo ao mundo!', x + 10, y + 40);
        this.ctx.fillText('[Guilda] Novos membros online', x + 10, y + 55);
    }
    
    renderQuestTracker() {
        const { x, y, width, height } = this.elements.questTracker;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(x, y, width, height);
        
        // Borda
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Título
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText('MISSÕES', x + 10, y + 20);
        
        // Quests placeholder
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText('☐ Caça aos Goblins (0/5)', x + 10, y + 40);
        this.ctx.fillText('☐ Explorar Ruínas', x + 10, y + 55);
        this.ctx.fillText('✓ Coletar Poções', x + 10, y + 70);
    }
    
    renderSkills() {
        const { x, y, width, height } = this.elements.skills;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(x, y, width, height);
        
        // Borda
        this.ctx.strokeStyle = '#9C27B0';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Título
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText('HABILIDADES', x + 10, y + 20);
        
        // Skills placeholder
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#9C27B0';
        this.ctx.fillText('[Q] Ataque Básico', x + 10, y + 40);
        this.ctx.fillText('[W] Defesa', x + 10, y + 55);
        this.ctx.fillText('[E] Cura Rápida', x + 10, y + 70);
    }
    
    renderDialogue() {
        if (!this.uiState.currentDialogue) return;
        
        const dialogue = this.uiState.currentDialogue;
        const width = 400;
        const height = 150;
        const x = (this.canvas.width - width) / 2;
        const y = this.canvas.height - height - 100;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(x, y, width, height);
        
        // Borda
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Nome do NPC
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(dialogue.npcName, x + 20, y + 30);
        
        // Texto do diálogo
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(dialogue.text, x + 20, y + 60);
        
        // Opções
        if (dialogue.options) {
            dialogue.options.forEach((option, index) => {
                this.ctx.fillText(`[${index + 1}] ${option}`, x + 20, y + 90 + index * 20);
            });
        }
    }
    
    renderNotifications() {
        const startX = this.canvas.width - 250;
        let startY = 100;
        
        this.uiState.notifications.forEach((notification, index) => {
            const y = startY + index * 60;
            
            // Background
            this.ctx.fillStyle = `rgba(0, 0, 0, ${notification.opacity})`;
            this.ctx.fillRect(startX, y, 230, 50);
            
            // Borda
            this.ctx.strokeStyle = notification.color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(startX, y, 230, 50);
            
            // Texto
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '11px Arial';
            this.ctx.fillText(notification.text, startX + 10, y + 30);
        });
    }
    
    renderCombatMode() {
        const x = this.canvas.width / 2 - 100;
        const y = 50;
        
        // Background
        this.ctx.fillStyle = 'rgba(244, 67, 54, 0.8)';
        this.ctx.fillRect(x, y, 200, 30);
        
        // Texto
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('⚔️ MODO DE COMBATE', x + 50, y + 20);
    }
    
    // Métodos de atualização de estado
    updatePlayerState(state) {
        Object.assign(this.playerState, state);
        
        // Atualizar alvos das animações
        this.animations.healthBar.target = (state.health / state.maxHealth) * 100;
        this.animations.manaBar.target = (state.mana / state.maxMana) * 100;
        this.animations.expBar.target = (state.exp / state.maxExp) * 100;
    }
    
    showNotification(text, type = 'info', duration = 3000) {
        const colors = {
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FFC107',
            error: '#F44336'
        };
        
        this.uiState.notifications.push({
            text,
            color: colors[type] || colors.info,
            lifeTime: duration,
            opacity: 1
        });
        
        // Limitar número de notificações
        if (this.uiState.notifications.length > 5) {
            this.uiState.notifications.shift();
        }
    }
    
    showDialogue(npcName, text, options = null) {
        this.uiState.currentDialogue = {
            npcName,
            text,
            options
        };
    }
    
    closeDialogue() {
        this.uiState.currentDialogue = null;
    }
    
    toggleInventory() {
        this.uiState.showInventory = !this.uiState.showInventory;
        this.uiState.showChat = false;
        this.uiState.showQuests = false;
        this.uiState.showSkills = false;
    }
    
    toggleChat() {
        this.uiState.showChat = !this.uiState.showChat;
        this.uiState.showInventory = false;
        this.uiState.showQuests = false;
        this.uiState.showSkills = false;
    }
    
    toggleQuests() {
        this.uiState.showQuests = !this.uiState.showQuests;
        this.uiState.showInventory = false;
        this.uiState.showChat = false;
        this.uiState.showSkills = false;
    }
    
    toggleSkills() {
        this.uiState.showSkills = !this.uiState.showSkills;
        this.uiState.showInventory = false;
        this.uiState.showChat = false;
        this.uiState.showQuests = false;
    }
    
    closeAllPanels() {
        this.uiState.showInventory = false;
        this.uiState.showChat = false;
        this.uiState.showQuests = false;
        this.uiState.showSkills = false;
        this.closeDialogue();
    }
    
    setCombatMode(enabled) {
        this.uiState.combatMode = enabled;
        if (enabled) {
            this.showNotification('Modo de combate ativado!', 'warning');
        } else {
            this.showNotification('Modo de combate desativado', 'info');
        }
    }
    
    show() {
        this.visible = true;
        this.canvas.style.display = 'block';
    }
    
    hide() {
        this.visible = false;
        this.canvas.style.display = 'none';
    }
}

// Exportar para uso global
window.IntegratedHUD = IntegratedHUD;
