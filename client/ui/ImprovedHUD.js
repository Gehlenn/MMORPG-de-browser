/**
 * Improved HUD System - Legacy of Komodo
 * HUD melhorada, organizada e sem sobreposições
 * Design moderno e funcional
 */

class ImprovedHUD {
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
        
        // Layout responsivo
        this.layout = {
            padding: 20,
            spacing: 10,
            borderRadius: 8,
            fontSize: {
                small: 10,
                medium: 12,
                large: 14,
                title: 16
            }
        };
        
        // Elementos do HUD - Layout otimizado
        this.elements = {
            // Painel esquerdo superior - Status do jogador
            playerStatus: { x: 20, y: 20, width: 250, height: 120 },
            
            // Painel direito superior - Minimapa
            minimap: { x: 0, y: 20, width: 180, height: 180 },
            
            // Painel direito médio - Missões ativas
            questTracker: { x: 0, y: 0, width: 220, height: 140 },
            
            // Painel direito inferior - Habilidades
            skillBar: { x: 0, y: 0, width: 220, height: 80 },
            
            // Painel inferior esquerdo - Chat
            chat: { x: 20, y: 0, width: 350, height: 120 },
            
            // Painel inferior centro - Notificações
            notifications: { x: 0, y: 0, width: 300, height: 60 },
            
            // Painel central - Informações de combate
            combatInfo: { x: 0, y: 0, width: 200, height: 40 },
            
            // Indicadores de sistema
            systemIndicators: { x: 20, y: 0, width: 200, height: 30 }
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
            fragments: 0,
            position: { x: 400, y: 300 },
            stats: {
                attack: 10,
                defense: 5,
                speed: 200,
                critical: 5,
                evasion: 10
            }
        };
        
        // Estado da UI
        this.uiState = {
            showInventory: false,
            showChat: false,
            showQuests: false,
            showSkills: false,
            showSystemInfo: false,
            currentDialogue: null,
            notifications: [],
            combatMode: false,
            targetInfo: null
        };
        
        // Animações suaves
        this.animations = {
            healthBar: { current: 100, target: 100, color: '#4CAF50' },
            manaBar: { current: 50, target: 50 },
            expBar: { current: 0, target: 0 },
            fadeIn: { opacity: 0, target: 1 }
        };
        
        // Cores temáticas
        this.colors = {
            primary: '#2196F3',
            success: '#4CAF50',
            warning: '#FFC107',
            error: '#F44336',
            info: '#00BCD4',
            gold: '#FFD700',
            purple: '#9C27B0',
            dark: '#263238',
            light: '#ECEFF1',
            background: 'rgba(0, 0, 0, 0.85)',
            border: '#37474F'
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎮 Inicializando HUD Melhorada...');
        
        // Verificar se já existe canvas
        const existingCanvas = document.getElementById('improved-hud');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        // Criar canvas para HUD
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'improved-hud';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '2'; // Baixo para não bloquear UI
        this.canvas.style.display = 'none';
        
        // Adicionar ao DOM
        setTimeout(() => {
            document.body.appendChild(this.canvas);
            console.log('✅ Canvas HUD Melhorada adicionado ao DOM');
        }, 100);
        
        // Configurar contexto
        this.ctx = this.canvas.getContext('2d');
        
        // Ajustar tamanho
        this.resize();
        
        // Event listeners
        this.setupEventListeners();
        
        console.log('✅ HUD Melhorada inicializada');
    }
    
    setupEventListeners() {
        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            switch((e && e.key ? e.key.toLowerCase() : "")) {
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
                case 'm':
                    this.toggleMinimap();
                    break;
                case 'escape':
                    this.closeAllPanels();
                    break;
                case 'f1':
                    this.toggleSystemInfo();
                    break;
            }
        });
        
        // Redimensionamento
        window.addEventListener('resize', () => {
            this.resize();
        });
    }
    
    resize() {
        if (!this.canvas) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Renderizar após redimensionar
        if (this.render) {
            this.render();
        }
        
        // Recalcular posições
        this.calculateLayout();
        
        console.log('🔄 ImprovedHUD resized');
    }
    
    calculateLayout() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = this.layout.padding;
        
        // Painel esquerdo - Status do jogador
        this.elements.playerStatus.x = padding;
        this.elements.playerStatus.y = padding;
        
        // Painel direito superior - Minimapa
        this.elements.minimap.x = width - this.elements.minimap.width - padding;
        this.elements.minimap.y = padding;
        
        // Painel direito médio - Missões
        this.elements.questTracker.x = width - this.elements.questTracker.width - padding;
        this.elements.questTracker.y = this.elements.minimap.y + this.elements.minimap.height + this.layout.spacing;
        
        // Painel direito inferior - Habilidades
        this.elements.skillBar.x = width - this.elements.skillBar.width - padding;
        this.elements.skillBar.y = height - this.elements.skillBar.height - padding;
        
        // Painel inferior esquerdo - Chat
        this.elements.chat.x = padding;
        this.elements.chat.y = height - this.elements.chat.height - padding;
        
        // Painel inferior centro - Notificações
        this.elements.notifications.x = (width - this.elements.notifications.width) / 2;
        this.elements.notifications.y = height - this.elements.notifications.height - padding - 130;
        
        // Painel central - Combate
        this.elements.combatInfo.x = (width - this.elements.combatInfo.width) / 2;
        this.elements.combatInfo.y = 80;
        
        // Indicadores de sistema
        this.elements.systemIndicators.x = padding;
        this.elements.systemIndicators.y = height - this.elements.systemIndicators.height - padding - 150;
    }
    
    update(deltaTime) {
        if (!this.visible) return;
        
        // Atualizar animações
        this.updateAnimations(deltaTime);
        
        // Atualizar notificações
        this.updateNotifications(deltaTime);
        
        // Fade in effect
        if (this.animations.fadeIn.opacity < this.animations.fadeIn.target) {
            this.animations.fadeIn.opacity += deltaTime * 0.002;
        }
    }
    
    updateAnimations(deltaTime) {
        // Animação suave da barra de vida
        const healthDiff = this.animations.healthBar.target - this.animations.healthBar.current;
        this.animations.healthBar.current += healthDiff * deltaTime * 0.005;
        
        // Atualizar cor da barra de vida
        const healthPercentage = this.animations.healthBar.current / 100;
        if (healthPercentage > 0.6) {
            this.animations.healthBar.color = this.colors.success;
        } else if (healthPercentage > 0.3) {
            this.animations.healthBar.color = this.colors.warning;
        } else {
            this.animations.healthBar.color = this.colors.error;
        }
        
        // Animação suave da barra de mana
        const manaDiff = this.animations.manaBar.target - this.animations.manaBar.current;
        this.animations.manaBar.current += manaDiff * deltaTime * 0.005;
        
        // Animação suave da barra de exp
        const expDiff = this.animations.expBar.target - this.animations.expBar.current;
        this.animations.expBar.current += expDiff * deltaTime * 0.005;
    }
    
    updateNotifications(deltaTime) {
        this.uiState.notifications = this.uiState.notifications.filter(notification => {
            notification.lifeTime -= deltaTime;
            notification.opacity = Math.max(0, notification.lifeTime / 3000);
            return notification.lifeTime > 0;
        });
    }
    
    render() {
        if (!this.ctx || !this.visible) return;
        
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Aplicar fade in
        this.ctx.globalAlpha = this.animations.fadeIn.opacity;
        
        // Renderizar elementos na ordem correta
        this.renderPlayerStatus();
        this.renderMinimap();
        this.renderQuestTracker();
        this.renderSkillBar();
        this.renderChat();
        this.renderNotifications();
        this.renderCombatInfo();
        this.renderSystemIndicators();
        
        // Renderizar diálogo se existir
        if (this.uiState.currentDialogue) {
            this.renderDialogue();
        }
        
        // Resetar alpha
        this.ctx.globalAlpha = 1;
    }
    
    renderPlayerStatus() {
        const { x, y, width, height } = this.elements.playerStatus;
        const padding = 10;
        
        // Background com borda arredondada
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.background);
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.border, 2);
        
        // Nome e nível do jogador
        this.ctx.fillStyle = this.colors.light;
        this.ctx.font = `bold ${this.layout.fontSize.large}px Arial`;
        this.ctx.fillText(this.playerState.name, x + padding, y + 25);
        
        this.ctx.fillStyle = this.colors.gold;
        this.ctx.font = `${this.layout.fontSize.medium}px Arial`;
        this.ctx.fillText(`Nível ${this.playerState.level}`, x + padding, y + 45);
        
        // Barras de status
        const barY = y + 55;
        const barHeight = 8;
        const barSpacing = 15;
        
        // Barra de vida
        this.renderStatusBar(
            x + padding, barY, width - padding * 2, barHeight,
            this.animations.healthBar.current, 100,
            this.animations.healthBar.color, 'HP'
        );
        
        // Barra de mana
        this.renderStatusBar(
            x + padding, barY + barSpacing, width - padding * 2, barHeight,
            this.animations.manaBar.current, 100,
            this.colors.primary, 'MP'
        );
        
        // Barra de experiência
        this.renderStatusBar(
            x + padding, barY + barSpacing * 2, width - padding * 2, barHeight,
            this.animations.expBar.current, 100,
            this.colors.gold, 'EXP'
        );
        
        // Ouro e fragmentos
        this.ctx.fillStyle = this.colors.gold;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        this.ctx.fillText(`💰 ${this.playerState.gold}`, x + padding, y + height - 15);
        
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillText(`🐉 ${this.playerState.fragments}`, x + padding + 80, y + height - 15);
    }
    
    renderStatusBar(x, y, width, height, current, max, color, label) {
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, width, height);
        
        // Barra
        const percentage = current / max;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width * percentage, height);
        
        // Texto
        this.ctx.fillStyle = this.colors.light;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        this.ctx.fillText(label, x + 2, y - 2);
        
        // Valores
        const actualValue = Math.round((current / 100) * (label === 'HP' ? this.playerState.maxHealth : 
                                                         label === 'MP' ? this.playerState.maxMana : 
                                                         this.playerState.maxExp));
        const maxValue = label === 'HP' ? this.playerState.maxHealth : 
                        label === 'MP' ? this.playerState.maxMana : 
                        this.playerState.maxExp;
        
        this.ctx.fillText(`${actualValue}/${maxValue}`, x + width - 40, y - 2);
    }
    
    renderMinimap() {
        const { x, y, width, height } = this.elements.minimap;
        
        // Background
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.background);
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.primary, 2);
        
        // Título
        this.ctx.fillStyle = this.colors.light;
        this.ctx.font = `bold ${this.layout.fontSize.medium}px Arial`;
        this.ctx.fillText('MAPA', x + 10, y + 20);
        
        // Área do mapa
        const mapArea = { x: x + 5, y: y + 25, width: width - 10, height: height - 30 };
        
        // Background do mapa
        this.ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';
        this.ctx.fillRect(mapArea.x, mapArea.y, mapArea.width, mapArea.height);
        
        // Grid simples
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const gridX = mapArea.x + (mapArea.width / 4) * i;
            const gridY = mapArea.y + (mapArea.height / 4) * i;
            
            this.ctx.beginPath();
            this.ctx.moveTo(gridX, mapArea.y);
            this.ctx.lineTo(gridX, mapArea.y + mapArea.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(mapArea.x, gridY);
            this.ctx.lineTo(mapArea.x + mapArea.width, gridY);
            this.ctx.stroke();
        }
        
        // Posição do jogador
        const playerX = mapArea.x + (this.playerState.position.x / 800) * mapArea.width;
        const playerY = mapArea.y + (this.playerState.position.y / 600) * mapArea.height;
        
        // Pulsing effect para o jogador
        const pulse = Math.sin(Date.now() * 0.003) * 2 + 2;
        
        this.ctx.fillStyle = this.colors.error;
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, 3 + pulse, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Área de visão
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, 20, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    renderQuestTracker() {
        const { x, y, width, height } = this.elements.questTracker;
        const padding = 10;
        
        // Background
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.background);
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.gold, 2);
        
        // Título
        this.ctx.fillStyle = this.colors.gold;
        this.ctx.font = `bold ${this.layout.fontSize.medium}px Arial`;
        this.ctx.fillText('📜 MISSÕES ATIVAS', x + padding, y + 20);
        
        // Missões placeholder
        const quests = [
            { text: 'Caça aos Goblins', progress: '0/5', completed: false },
            { text: 'Explorar Ruínas Antigas', progress: '1/1', completed: true },
            { text: 'Coletar Poções Mágicas', progress: '3/5', completed: false }
        ];
        
        let questY = y + 40;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        
        quests.forEach((quest, index) => {
            const icon = quest.completed ? '✅' : '☐';
            const color = quest.completed ? this.colors.success : this.colors.light;
            
            this.ctx.fillStyle = color;
            this.ctx.fillText(`${icon} ${quest.text}`, x + padding, questY);
            
            this.ctx.fillStyle = this.colors.info;
            this.ctx.fillText(`(${quest.progress})`, x + padding + 150, questY);
            
            questY += 20;
        });
    }
    
    renderSkillBar() {
        const { x, y, width, height } = this.elements.skillBar;
        const padding = 10;
        const skillSize = 40;
        const skillSpacing = 5;
        
        // Background
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.background);
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.purple, 2);
        
        // Título
        this.ctx.fillStyle = this.colors.light;
        this.ctx.font = `bold ${this.layout.fontSize.medium}px Arial`;
        this.ctx.fillText('⚔️ HABILIDADES', x + padding, y + 20);
        
        // Habilidades
        const skills = [
            { key: 'Q', name: 'Ataque', icon: '⚔️', cooldown: 0 },
            { key: 'W', name: 'Defesa', icon: '🛡️', cooldown: 0 },
            { key: 'E', name: 'Cura', icon: '💚', cooldown: 2000 },
            { key: 'R', name: 'Mágia', icon: '✨', cooldown: 5000 }
        ];
        
        let skillX = x + padding;
        const skillY = y + 30;
        
        skills.forEach((skill, index) => {
            // Background do skill
            const isOnCooldown = skill.cooldown > 0;
            const skillColor = isOnCooldown ? 'rgba(255, 255, 255, 0.2)' : 'rgba(156, 39, 176, 0.3)';
            
            this.drawRoundedRect(skillX, skillY, skillSize, skillSize, 4, skillColor);
            this.drawRoundedRect(skillX, skillY, skillSize, skillSize, 4, this.colors.purple, 1);
            
            // Ícone
            this.ctx.fillStyle = isOnCooldown ? this.colors.light : this.colors.gold;
            this.ctx.font = '20px Arial';
            this.ctx.fillText(skill.icon, skillX + 10, skillY + 28);
            
            // Tecla
            this.ctx.fillStyle = this.colors.light;
            this.ctx.font = `bold ${this.layout.fontSize.small}px Arial`;
            this.ctx.fillText(skill.key, skillX + 2, skillY + 12);
            
            // Cooldown
            if (isOnCooldown) {
                const cooldownSeconds = Math.ceil(skill.cooldown / 1000);
                this.ctx.fillStyle = this.colors.error;
                this.ctx.font = `bold ${this.layout.fontSize.small}px Arial`;
                this.ctx.fillText(cooldownSeconds, skillX + 15, skillY + 25);
            }
            
            skillX += skillSize + skillSpacing;
        });
    }
    
    renderChat() {
        const { x, y, width, height } = this.elements.chat;
        const padding = 10;
        
        // Background
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.background);
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.info, 2);
        
        // Título
        this.ctx.fillStyle = this.colors.light;
        this.ctx.font = `bold ${this.layout.fontSize.medium}px Arial`;
        this.ctx.fillText('💬 CHAT', x + padding, y + 20);
        
        // Mensagens
        const messages = [
            { type: 'system', text: 'Bem-vindo ao mundo de Aethelgard!', color: this.colors.info },
            { type: 'guild', text: '[Guilda] Novos membros online', color: this.colors.gold },
            { type: 'world', text: '[Mundo] Evento começando em 5 minutos', color: this.colors.warning }
        ];
        
        let messageY = y + 40;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        
        messages.forEach((message, index) => {
            this.ctx.fillStyle = message.color;
            this.ctx.fillText(message.text, x + padding, messageY);
            messageY += 18;
        });
        
        // Input indicator
        this.ctx.fillStyle = this.colors.light;
        this.ctx.fillText('▶ Pressione [C] para abrir o chat...', x + padding, y + height - 10);
    }
    
    renderNotifications() {
        const startX = this.elements.notifications.x;
        const startY = this.elements.notifications.y;
        
        this.uiState.notifications.forEach((notification, index) => {
            const y = startY + index * 35;
            const width = 280;
            const height = 30;
            
            // Background com fade
            this.ctx.globalAlpha = notification.opacity;
            this.drawRoundedRect(startX, y, width, height, this.layout.borderRadius, this.colors.background);
            this.drawRoundedRect(startX, y, width, height, this.layout.borderRadius, notification.color, 2);
            
            // Texto
            this.ctx.fillStyle = this.colors.light;
            this.ctx.font = `${this.layout.fontSize.small}px Arial`;
            this.ctx.fillText(notification.text, startX + 10, y + 20);
            
            this.ctx.globalAlpha = 1;
        });
    }
    
    renderCombatInfo() {
        if (!this.uiState.combatMode && !this.uiState.targetInfo) return;
        
        const { x, y, width, height } = this.elements.combatInfo;
        
        // Background
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, 'rgba(244, 67, 54, 0.9)');
        
        // Texto de combate
        this.ctx.fillStyle = this.colors.light;
        this.ctx.font = `bold ${this.layout.fontSize.medium}px Arial`;
        this.ctx.fillText('⚔️ MODO DE COMBATE', x + 50, y + 25);
        
        // Informações do alvo
        if (this.uiState.targetInfo) {
            const target = this.uiState.targetInfo;
            this.ctx.font = `${this.layout.fontSize.small}px Arial`;
            this.ctx.fillText(`Alvo: ${target.name} (Lv.${target.level})`, x + 10, y + 40);
        }
    }
    
    renderSystemIndicators() {
        const { x, y, width, height } = this.elements.systemIndicators;
        
        // Background
        this.drawRoundedRect(x, y, width, height, 4, 'rgba(0, 0, 0, 0.7)');
        
        // FPS
        const fps = this.getFPS();
        this.ctx.fillStyle = fps > 50 ? this.colors.success : fps > 30 ? this.colors.warning : this.colors.error;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        this.ctx.fillText(`FPS: ${fps}`, x + 10, y + 20);
        
        // Ping
        this.ctx.fillStyle = this.colors.info;
        this.ctx.fillText(`Ping: 45ms`, x + 80, y + 20);
        
        // Tempo
        const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        this.ctx.fillStyle = this.colors.light;
        this.ctx.fillText(currentTime, x + 150, y + 20);
    }
    
    renderDialogue() {
        if (!this.uiState.currentDialogue) return;
        
        const dialogue = this.uiState.currentDialogue;
        const width = 500;
        const height = 180;
        const x = (this.canvas.width - width) / 2;
        const y = this.canvas.height - height - 50;
        
        // Background
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.background);
        this.drawRoundedRect(x, y, width, height, this.layout.borderRadius, this.colors.gold, 2);
        
        // Nome do NPC
        this.ctx.fillStyle = this.colors.gold;
        this.ctx.font = `bold ${this.layout.fontSize.large}px Arial`;
        this.ctx.fillText(dialogue.npcName, x + 20, y + 30);
        
        // Texto do diálogo
        this.ctx.fillStyle = this.colors.light;
        this.ctx.font = `${this.layout.fontSize.medium}px Arial`;
        
        // Quebrar texto em linhas
        const lines = this.wrapText(dialogue.text, width - 40);
        lines.forEach((line, index) => {
            this.ctx.fillText(line, x + 20, y + 60 + index * 20);
        });
        
        // Opções
        if (dialogue.options) {
            this.ctx.fillStyle = this.colors.info;
            dialogue.options.forEach((option, index) => {
                this.ctx.fillText(`[${index + 1}] ${option}`, x + 20, y + 120 + index * 20);
            });
        }
        
        // Instrução
        this.ctx.fillStyle = this.colors.light;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        this.ctx.fillText('Pressione ESC para fechar', x + width - 150, y + height - 15);
    }
    
    // Utilitários de desenho
    drawRoundedRect(x, y, width, height, radius, fillStyle, lineWidth = 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        
        if (fillStyle) {
            this.ctx.fillStyle = fillStyle;
            this.ctx.fill();
        }
        
        if (lineWidth > 0) {
            this.ctx.lineWidth = lineWidth;
            this.ctx.stroke();
        }
    }
    
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }
    
    getFPS() {
        const now = performance.now();
        const delta = now - (this.lastFrameTime || now);
        this.lastFrameTime = now;
        return Math.round(1000 / delta);
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
            info: this.colors.info,
            success: this.colors.success,
            warning: this.colors.warning,
            error: this.colors.error
        };
        
        this.uiState.notifications.push({
            text,
            color: colors[type] || colors.info,
            lifeTime: duration,
            opacity: 1
        });
        
        // Limitar notificações
        if (this.uiState.notifications.length > 3) {
            this.uiState.notifications.shift();
        }
    }
    
    showDialogue(npcName, text, options = null) {
        this.uiState.currentDialogue = { npcName, text, options };
    }
    
    closeDialogue() {
        this.uiState.currentDialogue = null;
    }
    
    setCombatMode(enabled, targetInfo = null) {
        this.uiState.combatMode = enabled;
        this.uiState.targetInfo = targetInfo;
        
        if (enabled) {
            this.showNotification('Modo de combate ativado!', 'warning');
        } else {
            this.showNotification('Modo de combate desativado', 'info');
        }
    }
    
    // Métodos de toggle
    toggleInventory() {
        this.uiState.showInventory = !this.uiState.showInventory;
        this.closeOtherPanels('inventory');
    }
    
    toggleChat() {
        this.uiState.showChat = !this.uiState.showChat;
        this.closeOtherPanels('chat');
    }
    
    toggleQuests() {
        this.uiState.showQuests = !this.uiState.showQuests;
        this.closeOtherPanels('quests');
    }
    
    toggleSkills() {
        this.uiState.showSkills = !this.uiState.showSkills;
        this.closeOtherPanels('skills');
    }
    
    toggleMinimap() {
        // Implementar toggle do minimapa
        this.showNotification('Minimapa alternado', 'info');
    }
    
    toggleSystemInfo() {
        this.uiState.showSystemInfo = !this.uiState.showSystemInfo;
    }
    
    closeOtherPanels(except = null) {
        const panels = ['inventory', 'chat', 'quests', 'skills'];
        panels.forEach(panel => {
            if (panel !== except) {
                this.uiState[`show${panel.charAt(0).toUpperCase() + panel.slice(1)}`] = false;
            }
        });
    }
    
    closeAllPanels() {
        this.uiState.showInventory = false;
        this.uiState.showChat = false;
        this.uiState.showQuests = false;
        this.uiState.showSkills = false;
        this.closeDialogue();
    }
    
    show() {
        this.visible = true;
        this.canvas.style.display = 'block';
        this.animations.fadeIn.target = 1;
    }
    
    hide() {
        this.visible = false;
        this.canvas.style.display = 'none';
        this.animations.fadeIn.target = 0;
    }
}

// Exportar para uso global
window.ImprovedHUD = ImprovedHUD;
