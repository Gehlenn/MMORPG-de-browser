/**
 * WoW Style HUD - Legacy of Komodo
 * HUD inspirada em World of Warcraft com elementos maximizados
 * Inventário, stats e habilidades alternáveis
 */

class WoWStyleHUD {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.canvas = null;
        this.ctx = null;
        this.visible = true;
        
        // Configurações do mundo
        this.gameWorld = {
            name: 'Aethelgard',
            title: 'Legacy of Komodo',
            realm: 'Realm of the Lost'
        };
        
        // Layout WoW-style
        this.layout = {
            actionBarRows: 3,
            actionBarColumns: 12,
            iconSize: 36,
            padding: 5,
            spacing: 2,
            borderRadius: 4,
            fontSize: {
                small: 10,
                medium: 12,
                large: 14,
                title: 16
            }
        };
        
        // Elementos da HUD WoW-style
        this.elements = {
            // Action Bar (bottom center) - Principal
            actionBar: { x: 0, y: 0, width: 0, height: 0 },
            
            // Player Frame (top left)
            playerFrame: { x: 20, y: 20, width: 200, height: 80 },
            
            // Target Frame (top left, below player)
            targetFrame: { x: 20, y: 110, width: 200, height: 80 },
            
            // Minimap (top right)
            minimap: { x: 0, y: 20, width: 150, height: 150 },
            
            // Buffs/Debuffs (top center)
            buffFrame: { x: 0, y: 0, width: 0, height: 0 },
            
            // Quest Tracker (right side)
            questTracker: { x: 0, y: 0, width: 250, height: 200 },
            
            // Chat Frame (bottom left)
            chatFrame: { x: 20, y: 0, width: 400, height: 150 },
            
            // Menu Buttons (top right, below minimap)
            menuButtons: { x: 0, y: 0, width: 0, height: 0 },
            
            // Inventory (toggleable)
            inventoryFrame: { x: 0, y: 0, width: 0, height: 0 },
            
            // Character Stats (toggleable)
            characterFrame: { x: 0, y: 0, width: 0, height: 0 },
            
            // Spellbook (toggleable)
            spellbookFrame: { x: 0, y: 0, width: 0, height: 0 },
            
            // System Info (bottom right)
            systemInfo: { x: 0, y: 0, width: 200, height: 30 }
        };
        
        // Estado do jogador
        this.playerState = {
            name: 'Hero',
            level: 1,
            class: 'Aprendiz',
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            exp: 0,
            maxExp: 100,
            gold: 0,
            silver: 0,
            copper: 0,
            position: { x: 400, y: 300 },
            stats: {
                attack: 10,
                defense: 5,
                speed: 200,
                critical: 5,
                evasion: 10,
                strength: 10,
                agility: 8,
                intellect: 15,
                stamina: 12,
                spirit: 10
            },
            equipment: {
                head: null,
                neck: null,
                shoulders: null,
                chest: 'apprentice_robes',
                waist: null,
                legs: null,
                feet: null,
                wrists: null,
                hands: null,
                finger1: 'apprentice_ring',
                finger2: null,
                trinket1: null,
                trinket2: null,
                back: null,
                mainHand: 'apprentice_wand',
                offHand: null,
                ranged: null
            }
        };
        
        // Estado do alvo
        this.targetState = {
            name: null,
            level: 0,
            health: 0,
            maxHealth: 0,
            mana: 0,
            maxMana: 0,
            type: 'none', // player, npc, mob
            hostile: false,
            elite: false
        };
        
        // Estado da UI
        this.uiState = {
            showInventory: false,
            showCharacter: false,
            showSpellbook: false,
            showQuestLog: false,
            showMap: false,
            showFriends: false,
            showGuild: false,
            currentTab: 'inventory', // inventory/character/spellbook
            locked: false,
            combatMode: false,
            notifications: [],
            buffs: [],
            debuffs: [],
            cooldowns: new Map()
        };
        
        // Action Bar
        this.actionBar = {
            slots: [],
            currentRow: 0,
            totalSlots: 36, // 12 slots x 3 rows
            keybindings: [
                '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=',
                'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']',
                'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
            ]
        };
        
        // Inicializar action bar
        this.initializeActionBar();
        
        // Inventário
        this.inventory = {
            slots: [],
            totalSlots: 16, // 4x4 grid
            bagSlots: 20,
            currentBag: 0,
            bags: [
                { id: 0, name: 'Backpack', slots: 16 },
                { id: 1, name: 'Bag 1', slots: 20 },
                { id: 2, name: 'Bag 2', slots: 20 },
                { id: 3, name: 'Bag 3', slots: 20 },
                { id: 4, name: 'Bag 4', slots: 20 }
            ]
        };
        
        // Inicializar inventário
        this.initializeInventory();
        
        // Cores temáticas WoW-style
        this.colors = {
            // Cores de classe
            warrior: '#C79C6E',
            mage: '#40C7EB',
            hunter: '#ABD473',
            rogue: '#FFF569',
            priest: '#FFFFFF',
            druid: '#FF7D0A',
            apprentice: '#2196F3', // Nossa classe custom
            
            // Cores de qualidade
            poor: '#9D9D9D',      // Cinza
            common: '#FFFFFF',    // Branco
            uncommon: '#1EFF00',  // Verde
            rare: '#0070DD',      // Azul
            epic: '#A335EE',      // Roxo
            legendary: '#FF8000',  // Laranja
            
            // Cores de status
            health: '#FF0000',
            mana: '#0000FF',
            rage: '#FF0000',
            energy: '#FFFF00',
            focus: '#808080',
            
            // Cores de UI
            background: 'rgba(0, 0, 0, 0.8)',
            border: '#C0C0C0',
            text: '#FFFFFF',
            gold: '#FFD700',
            silver: '#C0C0C0',
            copper: '#B87333'
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎮 Inicializando HUD estilo WoW...');
        
        // Verificar se já existe canvas
        const existingCanvas = document.getElementById('wow-style-hud');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        // Criar canvas para HUD
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'wow-style-hud';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '3'; // Baixo para não bloquear UI
        this.canvas.style.display = 'none';
        
        // Adicionar ao DOM
        setTimeout(() => {
            document.body.appendChild(this.canvas);
            console.log('✅ Canvas WoW-style HUD adicionado ao DOM');
        }, 100);
        
        // Configurar contexto
        this.ctx = this.canvas.getContext('2d');
        
        // Ajustar tamanho
        this.resize();
        
        // Event listeners
        this.setupEventListeners();
        
        console.log('✅ HUD estilo WoW inicializada');
    }
    
    initializeActionBar() {
        // Preencher action bar com habilidades e itens
        const defaultActions = [
            { type: 'skill', id: 'attack', name: 'Attack', icon: '⚔️', cooldown: 0 },
            { type: 'skill', id: 'magic_missile', name: 'Magic Missile', icon: '✨', cooldown: 0 },
            { type: 'skill', id: 'heal', name: 'Heal', icon: '💚', cooldown: 0 },
            { type: 'skill', id: 'defend', name: 'Defend', icon: '🛡️', cooldown: 0 },
            { type: 'item', id: 'health_potion', name: 'Health Potion', icon: '🧪', count: 3 },
            { type: 'item', id: 'mana_potion', name: 'Mana Potion', icon: '💙', count: 3 },
            { type: 'skill', id: 'fire_bolt', name: 'Fire Bolt', icon: '🔥', cooldown: 5000 },
            { type: 'skill', id: 'ice_shard', name: 'Ice Shard', icon: '❄️', cooldown: 3000 },
            { type: 'skill', id: 'lightning', name: 'Lightning', icon: '⚡', cooldown: 8000 },
            { type: 'item', id: 'bread', name: 'Bread', icon: '🍞', count: 5 },
            { type: 'skill', id: 'teleport', name: 'Teleport', icon: '🌀', cooldown: 60000 },
            { type: 'skill', id: 'resurrect', name: 'Resurrect', icon: '✝️', cooldown: 300000 }
        ];
        
        for (let i = 0; i < this.actionBar.totalSlots; i++) {
            this.actionBar.slots[i] = defaultActions[i % defaultActions.length] || null;
        }
    }
    
    initializeInventory() {
        // Inicializar slots do inventário
        for (let i = 0; i < this.inventory.totalSlots; i++) {
            this.inventory.slots[i] = null;
        }
        
        // Adicionar alguns itens iniciais
        const starterItems = [
            { id: 'health_potion', name: 'Health Potion', icon: '🧪', quality: 'common', count: 3, slot: 0 },
            { id: 'mana_potion', name: 'Mana Potion', icon: '💙', quality: 'common', count: 3, slot: 1 },
            { id: 'bread', name: 'Bread', icon: '🍞', quality: 'common', count: 5, slot: 2 },
            { id: 'sword', name: 'Iron Sword', icon: '⚔️', quality: 'uncommon', count: 1, slot: 3 }
        ];
        
        starterItems.forEach(item => {
            if (item.slot < this.inventory.totalSlots) {
                this.inventory.slots[item.slot] = item;
            }
        });
    }
    
    setupEventListeners() {
        // Teclas de atalho WoW-style
        document.addEventListener('keydown', (e) => {
            // Action bar keys
            const keyIndex = this.actionBar.keybindings.indexOf((e && e.key ? e.key.toUpperCase() : ""));
            if (keyIndex !== -1 && keyIndex < this.actionBar.totalSlots) {
                this.useActionBarSlot(keyIndex);
                return;
            }
            
            // Toggle windows
            switch((e && e.key ? e.key.toLowerCase() : "")) {
                case 'b':
                    this.toggleWindow('inventory');
                    break;
                case 'c':
                    this.toggleWindow('character');
                    break;
                case 'p':
                    this.toggleWindow('spellbook');
                    break;
                case 'l':
                    this.toggleWindow('questlog');
                    break;
                case 'm':
                    this.toggleWindow('map');
                    break;
                case 'o':
                    this.toggleWindow('friends');
                    break;
                case 'g':
                    this.toggleWindow('guild');
                    break;
                case 'escape':
                    this.closeAllWindows();
                    break;
            }
        });
        
        // Mouse events para interação
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        // Redimensionamento
        window.addEventListener('resize', () => {
            this.resize();
        });
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Recalcular posições
        this.calculateLayout();
    }
    
    calculateLayout() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = this.layout.padding;
        const iconSize = this.layout.iconSize;
        
        // Action Bar (bottom center)
        const actionBarWidth = this.layout.actionBarColumns * (iconSize + this.layout.spacing * 2);
        const actionBarHeight = this.layout.actionBarRows * (iconSize + this.layout.spacing * 2);
        this.elements.actionBar = {
            x: (width - actionBarWidth) / 2,
            y: height - actionBarHeight - 20,
            width: actionBarWidth,
            height: actionBarHeight
        };
        
        // Minimap (top right)
        this.elements.minimap.x = width - this.elements.minimap.width - 20;
        
        // Menu Buttons (abaixo do minimap)
        this.elements.menuButtons = {
            x: width - 150,
            y: this.elements.minimap.y + this.elements.minimap.height + 10,
            width: 130,
            height: 120
        };
        
        // Buff Frame (top center)
        this.elements.buffFrame = {
            x: (width - 300) / 2,
            y: 20,
            width: 300,
            height: 60
        };
        
        // Quest Tracker (right side)
        this.elements.questTracker.x = width - this.elements.questTracker.width - 20;
        this.elements.questTracker.y = this.elements.menuButtons.y + this.elements.menuButtons.height + 10;
        
        // Chat Frame (bottom left)
        this.elements.chatFrame.y = height - this.elements.chatFrame.height - 20;
        
        // Inventory Frame (center)
        this.elements.inventoryFrame = {
            x: (width - 400) / 2,
            y: (height - 300) / 2,
            width: 400,
            height: 300
        };
        
        // Character Frame (center)
        this.elements.characterFrame = {
            x: (width - 350) / 2,
            y: (height - 400) / 2,
            width: 350,
            height: 400
        };
        
        // Spellbook Frame (center)
        this.elements.spellbookFrame = {
            x: (width - 450) / 2,
            y: (height - 350) / 2,
            width: 450,
            height: 350
        };
        
        // System Info (bottom right)
        this.elements.systemInfo.x = width - this.elements.systemInfo.width - 20;
        this.elements.systemInfo.y = height - this.elements.systemInfo.height - 20;
    }
    
    update(deltaTime) {
        if (!this.visible) return;
        
        // Atualizar cooldowns
        this.updateCooldowns(deltaTime);
        
        // Atualizar buffs/debuffs
        this.updateBuffs(deltaTime);
        
        // Atualizar notificações
        this.updateNotifications(deltaTime);
    }
    
    updateCooldowns(deltaTime) {
        this.uiState.cooldowns.forEach((cooldown, key) => {
            if (cooldown > 0) {
                const newCooldown = cooldown - deltaTime;
                if (newCooldown <= 0) {
                    this.uiState.cooldowns.delete(key);
                } else {
                    this.uiState.cooldowns.set(key, newCooldown);
                }
            }
        });
    }
    
    updateBuffs(deltaTime) {
        // Atualizar buffs
        this.uiState.buffs = this.uiState.buffs.filter(buff => {
            buff.duration -= deltaTime;
            return buff.duration > 0;
        });
        
        // Atualizar debuffs
        this.uiState.debuffs = this.uiState.debuffs.filter(debuff => {
            debuff.duration -= deltaTime;
            return debuff.duration > 0;
        });
    }
    
    updateNotifications(deltaTime) {
        this.uiState.notifications = this.uiState.notifications.filter(notification => {
            notification.lifeTime -= deltaTime;
            return notification.lifeTime > 0;
        });
    }
    
    render() {
        if (!this.ctx || !this.visible) return;
        
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderizar elementos na ordem correta
        this.renderPlayerFrame();
        this.renderTargetFrame();
        this.renderMinimap();
        this.renderBuffFrame();
        this.renderActionBar();
        this.renderChatFrame();
        this.renderQuestTracker();
        this.renderMenuButtons();
        this.renderSystemInfo();
        
        // Renderizar janelas toggleables
        if (this.uiState.showInventory) this.renderInventoryFrame();
        if (this.uiState.showCharacter) this.renderCharacterFrame();
        if (this.uiState.showSpellbook) this.renderSpellbookFrame();
        
        // Renderizar notificações
        this.renderNotifications();
    }
    
    renderPlayerFrame() {
        const { x, y, width, height } = this.elements.playerFrame;
        const classColor = this.colors[this.playerState.class.toLowerCase()] || this.colors.apprentice;
        
        // Background
        this.drawWoWFrame(x, y, width, height, classColor);
        
        // Nome e nível
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${this.layout.fontSize.large}px Arial`;
        this.ctx.fillText(this.playerState.name, x + 10, y + 20);
        
        this.ctx.font = `${this.layout.fontSize.medium}px Arial`;
        this.ctx.fillText(`Level ${this.playerState.level} ${this.playerState.class}`, x + 10, y + 35);
        
        // Barra de vida
        this.renderWoWHealthBar(x + 10, y + 45, width - 20, 15, this.playerState.health, this.playerState.maxHealth);
        
        // Barra de mana (se tiver)
        if (this.playerState.maxMana > 0) {
            this.renderWoWManaBar(x + 10, y + 62, width - 20, 15, this.playerState.mana, this.playerState.maxMana);
        }
    }
    
    renderTargetFrame() {
        const { x, y, width, height } = this.elements.targetFrame;
        
        if (!this.targetState.name) {
            // Esconder frame se não tiver alvo
            return;
        }
        
        // Cor baseada no tipo/hostilidade
        let frameColor = this.colors.border;
        if (this.targetState.type === 'player') {
            frameColor = this.colors.text;
        } else if (this.targetState.hostile) {
            frameColor = this.colors.health;
        }
        
        // Background
        this.drawWoWFrame(x, y, width, height, frameColor);
        
        // Nome e nível
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${this.layout.fontSize.large}px Arial`;
        this.ctx.fillText(this.targetState.name, x + 10, y + 20);
        
        const levelText = this.targetState.elite ? `Level ${this.targetState.level} Elite` : `Level ${this.targetState.level}`;
        this.ctx.font = `${this.layout.fontSize.medium}px Arial`;
        this.ctx.fillText(levelText, x + 10, y + 35);
        
        // Barra de vida
        this.renderWoWHealthBar(x + 10, y + 45, width - 20, 15, this.targetState.health, this.targetState.maxHealth);
        
        // Barra de mana (se tiver)
        if (this.targetState.maxMana > 0) {
            this.renderWoWManaBar(x + 10, y + 62, width - 20, 15, this.targetState.mana, this.targetState.maxMana);
        }
    }
    
    renderWoWHealthBar(x, y, width, height, current, max) {
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, width, height);
        
        // Borda
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        
        // Barra de vida
        const percentage = Math.max(0, Math.min(1, current / max));
        const healthWidth = width * percentage;
        
        // Gradiente de vida
        const gradient = this.ctx.createLinearGradient(x, y, x + healthWidth, y);
        gradient.addColorStop(0, '#FF0000');
        gradient.addColorStop(0.5, '#CC0000');
        gradient.addColorStop(1, '#990000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x + 1, y + 1, healthWidth - 2, height - 2);
        
        // Texto
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        this.ctx.fillText(`${Math.round(current)}/${max}`, x + 5, y + height - 3);
    }
    
    renderWoWManaBar(x, y, width, height, current, max) {
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, width, height);
        
        // Borda
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        
        // Barra de mana
        const percentage = Math.max(0, Math.min(1, current / max));
        const manaWidth = width * percentage;
        
        // Gradiente de mana
        const gradient = this.ctx.createLinearGradient(x, y, x + manaWidth, y);
        gradient.addColorStop(0, '#0000FF');
        gradient.addColorStop(0.5, '#0066FF');
        gradient.addColorStop(1, '#0099FF');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x + 1, y + 1, manaWidth - 2, height - 2);
        
        // Texto
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        this.ctx.fillText(`${Math.round(current)}/${max}`, x + 5, y + height - 3);
    }
    
    renderMinimap() {
        const { x, y, width, height } = this.elements.minimap;
        
        // Background circular
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(x + width/2, y + height/2, width/2 - 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Borda
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Renderização do mapa (simplificada)
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x + width/2, y + height/2, width/2 - 7, 0, Math.PI * 2);
        this.ctx.clip();
        
        // Grid do mapa
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const gridX = x + (width / 4) * i;
            const gridY = y + (height / 4) * i;
            
            this.ctx.beginPath();
            this.ctx.moveTo(gridX, y);
            this.ctx.lineTo(gridX, y + height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, gridY);
            this.ctx.lineTo(x + width, gridY);
            this.ctx.stroke();
        }
        
        // Posição do jogador
        const playerX = x + width/2 + (this.playerState.position.x / 800 - 0.5) * (width - 20);
        const playerY = y + height/2 + (this.playerState.position.y / 600 - 0.5) * (height - 20);
        
        this.ctx.fillStyle = this.colors.health;
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Norte indicator
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${this.layout.fontSize.medium}px Arial`;
        this.ctx.fillText('N', x + width/2 - 5, y + 15);
    }
    
    renderBuffFrame() {
        const { x, y, width, height } = this.elements.buffFrame;
        const iconSize = 20;
        const spacing = 2;
        
        let currentX = x;
        
        // Renderizar buffs
        this.uiState.buffs.forEach((buff, index) => {
            if (currentX + iconSize > x + width) return;
            
            this.renderBuffIcon(currentX, y, iconSize, buff, true);
            currentX += iconSize + spacing;
        });
        
        // Renderizar debuffs
        this.uiState.debuffs.forEach((debuff, index) => {
            if (currentX + iconSize > x + width) return;
            
            this.renderBuffIcon(currentX, y, iconSize, debuff, false);
            currentX += iconSize + spacing;
        });
    }
    
    renderBuffIcon(x, y, size, buff, isBuff) {
        // Background
        const bgColor = isBuff ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(x, y, size, size);
        
        // Borda
        this.ctx.strokeStyle = isBuff ? this.colors.uncommon : this.colors.health;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);
        
        // Ícone
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${size - 4}px Arial`;
        this.ctx.fillText(buff.icon, x + 2, y + size - 4);
        
        // Duration
        if (buff.duration > 0) {
            const seconds = Math.ceil(buff.duration / 1000);
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = `${this.layout.fontSize.small}px Arial`;
            this.ctx.fillText(seconds.toString(), x + 1, y + size - 1);
        }
    }
    
    renderActionBar() {
        const { x, y, width, height } = this.elements.actionBar;
        const iconSize = this.layout.iconSize;
        const spacing = this.layout.spacing;
        
        // Background da action bar
        this.drawWoWFrame(x, y, width, height, this.colors.border);
        
        // Renderizar slots
        for (let row = 0; row < this.layout.actionBarRows; row++) {
            for (let col = 0; col < this.layout.actionBarColumns; col++) {
                const slotIndex = row * this.layout.actionBarColumns + col;
                const slotX = x + spacing + col * (iconSize + spacing * 2);
                const slotY = y + spacing + row * (iconSize + spacing * 2);
                
                this.renderActionBarSlot(slotX, slotY, iconSize, slotIndex);
            }
        }
    }
    
    renderActionBarSlot(x, y, size, slotIndex) {
        const action = this.actionBar.slots[slotIndex];
        const keybind = this.actionBar.keybindings[slotIndex];
        const cooldown = this.uiState.cooldowns.get(keybind) || 0;
        
        // Background do slot
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, size, size);
        
        // Borda
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, size, size);
        
        // Se tiver action, renderizar
        if (action) {
            // Ícone
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = `${size - 8}px Arial`;
            this.ctx.fillText(action.icon, x + 4, y + size - 6);
            
            // Keybind
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = `bold ${this.layout.fontSize.small}px Arial`;
            this.ctx.fillText(keybind, x + 2, y + 10);
            
            // Cooldown
            if (cooldown > 0) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(x, y, size, size);
                
                const cooldownSeconds = Math.ceil(cooldown / 1000);
                this.ctx.fillStyle = this.colors.text;
                this.ctx.font = `bold ${this.layout.fontSize.medium}px Arial`;
                this.ctx.fillText(cooldownSeconds.toString(), x + size/2 - 5, y + size/2 + 5);
            }
            
            // Count (para itens)
            if (action.type === 'item' && action.count > 1) {
                this.ctx.fillStyle = this.colors.text;
                this.ctx.font = `bold ${this.layout.fontSize.small}px Arial`;
                this.ctx.fillText(action.count.toString(), x + size - 15, y + size - 3);
            }
        }
    }
    
    renderChatFrame() {
        const { x, y, width, height } = this.elements.chatFrame;
        
        // Background
        this.drawWoWFrame(x, y, width, height, this.colors.border);
        
        // Tabs
        const tabHeight = 20;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, width, tabHeight);
        
        // Tab names
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        this.ctx.fillText('General', x + 10, y + 14);
        this.ctx.fillText('Combat', x + 70, y + 14);
        this.ctx.fillText('Guild', x + 130, y + 14);
        
        // Mensagens (placeholder)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        this.ctx.fillText('[System] Bem-vindo ao mundo de Aethelgard!', x + 10, y + tabHeight + 15);
        this.ctx.fillText('[Guild] Novos membros online', x + 10, y + tabHeight + 30);
        this.ctx.fillText('[Party] Iniciando combate...', x + 10, y + tabHeight + 45);
        
        // Input
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.strokeRect(x + 5, y + height - 25, width - 10, 20);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillText('Pressione Enter para digitar...', x + 10, y + height - 10);
    }
    
    renderQuestTracker() {
        const { x, y, width, height } = this.elements.questTracker;
        
        // Background
        this.drawWoWFrame(x, y, width, height, this.colors.gold);
        
        // Título
        this.ctx.fillStyle = this.colors.gold;
        this.ctx.font = `bold ${this.layout.fontSize.medium}px Arial`;
        this.ctx.fillText('Quest Tracker', x + 10, y + 20);
        
        // Missões (placeholder)
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        this.ctx.fillText('☐ Caça aos Goblins (0/5)', x + 10, y + 40);
        this.ctx.fillText('☐ Explorar Ruínas', x + 10, y + 55);
        this.ctx.fillText('✓ Coletar Poções', x + 10, y + 70);
        this.ctx.fillText('☐ Derrotar Chefe', x + 10, y + 85);
    }
    
    renderMenuButtons() {
        const { x, y, width, height } = this.elements.menuButtons;
        const buttonHeight = 22;
        const spacing = 2;
        
        // Botões do menu
        const buttons = [
            { text: 'Character', key: 'C', toggle: 'character' },
            { text: 'Spellbook', key: 'P', toggle: 'spellbook' },
            { text: 'Talents', key: 'N', toggle: 'talents' },
            { text: 'Quest Log', key: 'L', toggle: 'questlog' },
            { text: 'Map', key: 'M', toggle: 'map' },
            { text: 'Social', key: 'O', toggle: 'social' }
        ];
        
        buttons.forEach((button, index) => {
            const buttonY = y + index * (buttonHeight + spacing);
            
            // Background
            const isActive = this.uiState[`show${button.toggle.charAt(0).toUpperCase() + button.toggle.slice(1)}`];
            this.ctx.fillStyle = isActive ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(x, buttonY, width, buttonHeight);
            
            // Borda
            this.ctx.strokeStyle = isActive ? this.colors.gold : this.colors.border;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, buttonY, width, buttonHeight);
            
            // Texto
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = `${this.layout.fontSize.small}px Arial`;
            this.ctx.fillText(button.text, x + 10, buttonY + 14);
            
            // Keybind
            this.ctx.fillStyle = this.colors.gold;
            this.ctx.fillText(`[${button.key}]`, x + width - 30, buttonY + 14);
        });
    }
    
    renderInventoryFrame() {
        if (!this.uiState.showInventory) return;
        
        const { x, y, width, height } = this.elements.inventoryFrame;
        
        // Background
        this.drawWoWFrame(x, y, width, height, this.colors.border);
        
        // Título
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${this.layout.fontSize.large}px Arial`;
        this.ctx.fillText('Inventory', x + 10, y + 25);
        
        // Bag slots
        const bagStartX = x + 10;
        const bagStartY = y + 40;
        const bagSize = 30;
        const bagSpacing = 2;
        
        for (let i = 0; i < 5; i++) {
            const bagX = bagStartX + i * (bagSize + bagSpacing);
            this.renderBagSlot(bagX, bagStartY, bagSize, i);
        }
        
        // Inventory grid (4x4)
        const gridStartX = x + 10;
        const gridStartY = bagStartY + bagSize + 20;
        const slotSize = 35;
        const slotSpacing = 3;
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const slotIndex = row * 4 + col;
                const slotX = gridStartX + col * (slotSize + slotSpacing);
                const slotY = gridStartY + row * (slotSize + slotSpacing);
                
                this.renderInventorySlot(slotX, slotY, slotSize, slotIndex);
            }
        }
        
        // Dinheiro
        this.renderMoneyDisplay(x + 10, y + height - 30, this.playerState.gold, this.playerState.silver, this.playerState.copper);
    }
    
    renderBagSlot(x, y, size, bagIndex) {
        const bag = this.inventory.bags[bagIndex];
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, size, size);
        
        // Borda
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);
        
        // Ícone da bag
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${size - 8}px Arial`;
        this.ctx.fillText('👜', x + 4, y + size - 6);
        
        // Slots disponíveis
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        this.ctx.fillText(bag.slots.toString(), x + size - 12, y + size - 3);
    }
    
    renderInventorySlot(x, y, size, slotIndex) {
        const item = this.inventory.slots[slotIndex];
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, size, size);
        
        // Borda
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);
        
        // Se tiver item, renderizar
        if (item) {
            // Cor da qualidade
            const qualityColor = this.colors[item.quality] || this.colors.common;
            
            // Ícone
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = `${size - 8}px Arial`;
            this.ctx.fillText(item.icon, x + 2, y + size - 6);
            
            // Borda da qualidade
            this.ctx.strokeStyle = qualityColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, size, size);
            
            // Quantidade
            if (item.count > 1) {
                this.ctx.fillStyle = this.colors.text;
                this.ctx.font = `bold ${this.layout.fontSize.small}px Arial`;
                this.ctx.fillText(item.count.toString(), x + size - 15, y + size - 3);
            }
        }
    }
    
    renderMoneyDisplay(x, y, gold, silver, copper) {
        this.ctx.fillStyle = this.colors.gold;
        this.ctx.font = `${this.layout.fontSize.medium}px Arial`;
        
        let moneyText = '';
        if (gold > 0) moneyText += `${gold}g `;
        if (silver > 0) moneyText += `${silver}s `;
        if (copper > 0) moneyText += `${copper}c `;
        
        this.ctx.fillText(moneyText.trim(), x, y);
    }
    
    renderCharacterFrame() {
        if (!this.uiState.showCharacter) return;
        
        const { x, y, width, height } = this.elements.characterFrame;
        
        // Background
        this.drawWoWFrame(x, y, width, height, this.colors.border);
        
        // Título
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${this.layout.fontSize.large}px Arial`;
        this.ctx.fillText('Character', x + 10, y + 25);
        
        // Stats
        const stats = [
            { name: 'Strength', value: this.playerState.stats.strength },
            { name: 'Agility', value: this.playerState.stats.agility },
            { name: 'Intellect', value: this.playerState.stats.intellect },
            { name: 'Stamina', value: this.playerState.stats.stamina },
            { name: 'Spirit', value: this.playerState.stats.spirit },
            { name: 'Attack', value: this.playerState.stats.attack },
            { name: 'Defense', value: this.playerState.stats.defense },
            { name: 'Critical', value: `${this.playerState.stats.critical}%` },
            { name: 'Evasion', value: `${this.playerState.stats.evasion}%` }
        ];
        
        let statY = y + 50;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        
        stats.forEach(stat => {
            this.ctx.fillStyle = this.colors.text;
            this.ctx.fillText(`${stat.name}:`, x + 20, statY);
            
            this.ctx.fillStyle = this.colors.gold;
            this.ctx.fillText(stat.value.toString(), x + 120, statY);
            
            statY += 20;
        });
        
        // Equipment slots
        this.renderEquipmentSlots(x + 220, y + 50);
    }
    
    renderEquipmentSlots(x, y) {
        const slotSize = 40;
        const slotSpacing = 5;
        
        const slots = [
            { name: 'Head', key: 'head', icon: '🎩' },
            { name: 'Neck', key: 'neck', icon: '📿' },
            { name: 'Shoulders', key: 'shoulders', icon: '🛡️' },
            { name: 'Back', key: 'back', icon: '🧥' },
            { name: 'Chest', key: 'chest', icon: '👔' },
            { name: 'Wrists', key: 'wrists', icon: '⌚' },
            { name: 'Hands', key: 'hands', icon: '🧤' },
            { name: 'Waist', key: 'waist', icon: '👖' },
            { name: 'Legs', key: 'legs', icon: '👖' },
            { name: 'Feet', key: 'feet', icon: '👟' },
            { name: 'Finger1', key: 'finger1', icon: '💍' },
            { name: 'Finger2', key: 'finger2', icon: '💍' },
            { name: 'Main Hand', key: 'mainHand', icon: '⚔️' },
            { name: 'Off Hand', key: 'offHand', icon: '🛡️' }
        ];
        
        slots.forEach((slot, index) => {
            const slotY = y + index * (slotSize + slotSpacing);
            this.renderEquipmentSlot(x, slotY, slotSize, slot);
        });
    }
    
    renderEquipmentSlot(x, y, size, slot) {
        const item = this.playerState.equipment[slot.key];
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, size, size);
        
        // Borda
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);
        
        // Se tiver item equipado
        if (item) {
            // Ícone
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = `${size - 8}px Arial`;
            this.ctx.fillText(slot.icon, x + 2, y + size - 6);
            
            // Qualidade do item
            const qualityColor = this.colors.uncommon; // Simplificado
            this.ctx.strokeStyle = qualityColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, size, size);
        } else {
            // Slot vazio
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.font = `${size - 12}px Arial`;
            this.ctx.fillText(slot.icon, x + 4, y + size - 8);
        }
    }
    
    renderSpellbookFrame() {
        if (!this.uiState.showSpellbook) return;
        
        const { x, y, width, height } = this.elements.spellbookFrame;
        
        // Background
        this.drawWoWFrame(x, y, width, height, this.colors.border);
        
        // Título
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${this.layout.fontSize.large}px Arial`;
        this.ctx.fillText('Spellbook', x + 10, y + 25);
        
        // Tabs de escola de magia
        const tabs = ['Arcane', 'Fire', 'Frost', 'Nature', 'Shadow'];
        let tabX = x + 10;
        
        tabs.forEach(tab => {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(tabX, y + 35, 60, 20);
            this.ctx.strokeStyle = this.colors.border;
            this.ctx.strokeRect(tabX, y + 35, 60, 20);
            
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = `${this.layout.fontSize.small}px Arial`;
            this.ctx.fillText(tab, tabX + 5, y + 48);
            
            tabX += 65;
        });
        
        // Grade de magias (4x6)
        const spellSize = 32;
        const spellSpacing = 4;
        const gridStartX = x + 10;
        const gridStartY = y + 65;
        
        const spells = [
            { name: 'Magic Missile', icon: '✨', level: 1, mana: 5 },
            { name: 'Heal', icon: '💚', level: 1, mana: 10 },
            { name: 'Fire Bolt', icon: '🔥', level: 3, mana: 15 },
            { name: 'Ice Shard', icon: '❄️', level: 3, mana: 12 },
            { name: 'Lightning', icon: '⚡', level: 5, mana: 25 },
            { name: 'Teleport', icon: '🌀', level: 8, mana: 50 }
        ];
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 6; col++) {
                const spellIndex = row * 6 + col;
                const spellX = gridStartX + col * (spellSize + spellSpacing);
                const spellY = gridStartY + row * (spellSize + spellSpacing);
                
                this.renderSpellSlot(spellX, spellY, spellSize, spells[spellIndex]);
            }
        }
    }
    
    renderSpellSlot(x, y, size, spell) {
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, size, size);
        
        // Borda
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);
        
        if (spell) {
            // Ícone
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = `${size - 8}px Arial`;
            this.ctx.fillText(spell.icon, x + 2, y + size - 6);
            
            // Level
            this.ctx.fillStyle = this.colors.gold;
            this.ctx.font = `${this.layout.fontSize.small}px Arial`;
            this.ctx.fillText(spell.level.toString(), x + 2, y + 10);
            
            // Mana cost
            this.ctx.fillStyle = this.colors.primary;
            this.ctx.font = `${this.layout.fontSize.small}px Arial`;
            this.ctx.fillText(spell.mana.toString(), x + size - 10, y + size - 3);
        }
    }
    
    renderSystemInfo() {
        const { x, y, width, height } = this.elements.systemInfo;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, width, height);
        
        // FPS
        const fps = this.getFPS();
        this.ctx.fillStyle = fps > 50 ? this.colors.uncommon : fps > 30 ? this.colors.gold : this.colors.health;
        this.ctx.font = `${this.layout.fontSize.small}px Arial`;
        this.ctx.fillText(`FPS: ${fps}`, x + 10, y + 20);
        
        // Ping
        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText(`Ping: 45ms`, x + 80, y + 20);
        
        // Tempo
        const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        this.ctx.fillText(currentTime, x + 150, y + 20);
    }
    
    renderNotifications() {
        const startY = 200;
        let currentY = startY;
        
        this.uiState.notifications.forEach((notification, index) => {
            const notificationWidth = 300;
            const notificationHeight = 40;
            const x = (this.canvas.width - notificationWidth) / 2;
            const y = currentY;
            
            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.fillRect(x, y, notificationWidth, notificationHeight);
            
            // Borda
            this.ctx.strokeStyle = notification.color || this.colors.border;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, notificationWidth, notificationHeight);
            
            // Texto
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = `${this.layout.fontSize.medium}px Arial`;
            this.ctx.fillText(notification.text, x + 10, y + 25);
            
            currentY += notificationHeight + 10;
        });
    }
    
    // Utilitários de desenho WoW-style
    drawWoWFrame(x, y, width, height, color) {
        // Background principal
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(x, y, width, height);
        
        // Borda principal
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Borda interna
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
        
        // Cantos decorativos
        this.drawWoWCorner(x, y, color);
        this.drawWoWCorner(x + width - 10, y, color);
        this.drawWoWCorner(x, y + height - 10, color);
        this.drawWoWCorner(x + width - 10, y + height - 10, color);
    }
    
    drawWoWCorner(x, y, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        
        // Linha horizontal
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 5);
        this.ctx.lineTo(x + 10, y + 5);
        this.ctx.stroke();
        
        // Linha vertical
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y);
        this.ctx.lineTo(x + 5, y + 10);
        this.ctx.stroke();
    }
    
    // Métodos de interação
    useActionBarSlot(slotIndex) {
        const action = this.actionBar.slots[slotIndex];
        if (!action) return;
        
        const keybind = this.actionBar.keybindings[slotIndex];
        const cooldown = this.uiState.cooldowns.get(keybind) || 0;
        
        if (cooldown > 0) return;
        
        console.log(`Using action: ${action.name}`);
        
        // Aplicar cooldown
        if (action.cooldown > 0) {
            this.uiState.cooldowns.set(keybind, action.cooldown);
        }
        
        // Executar ação
        if (action.type === 'skill') {
            this.executeSkill(action.id);
        } else if (action.type === 'item') {
            this.useItem(action.id);
        }
    }
    
    executeSkill(skillId) {
        console.log(`Executing skill: ${skillId}`);
        // Implementar lógica de skill
        this.showNotification(`Skill ${skillId} used!`, 'info');
    }
    
    useItem(itemId) {
        console.log(`Using item: ${itemId}`);
        // Implementar lógica de item
        this.showNotification(`Item ${itemId} used!`, 'info');
    }
    
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Verificar cliques em elementos interativos
        this.checkActionBarClick(x, y);
        this.checkMenuButtonClick(x, y);
        this.checkWindowClick(x, y);
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Implementar hover effects
        this.updateHoverState(x, y);
    }
    
    checkActionBarClick(x, y) {
        const { x: barX, y: barY } = this.elements.actionBar;
        const iconSize = this.layout.iconSize;
        const spacing = this.layout.spacing;
        
        for (let row = 0; row < this.layout.actionBarRows; row++) {
            for (let col = 0; col < this.layout.actionBarColumns; col++) {
                const slotIndex = row * this.layout.actionBarColumns + col;
                const slotX = barX + spacing + col * (iconSize + spacing * 2);
                const slotY = barY + spacing + row * (iconSize + spacing * 2);
                
                if (x >= slotX && x <= slotX + iconSize && y >= slotY && y <= slotY + iconSize) {
                    this.useActionBarSlot(slotIndex);
                    return;
                }
            }
        }
    }
    
    checkMenuButtonClick(x, y) {
        const { x: menuX, y: menuY, width, height } = this.elements.menuButtons;
        const buttonHeight = 22;
        const spacing = 2;
        
        if (x >= menuX && x <= menuX + width && y >= menuY && y <= menuY + height) {
            const buttonIndex = Math.floor((y - menuY) / (buttonHeight + spacing));
            const buttons = ['character', 'spellbook', 'talents', 'questlog', 'map', 'social'];
            
            if (buttonIndex >= 0 && buttonIndex < buttons.length) {
                this.toggleWindow(buttons[buttonIndex]);
            }
        }
    }
    
    checkWindowClick(x, y) {
        // Implementar cliques em janelas abertas
        if (this.uiState.showInventory) {
            this.checkInventoryClick(x, y);
        }
        if (this.uiState.showCharacter) {
            this.checkCharacterClick(x, y);
        }
        if (this.uiState.showSpellbook) {
            this.checkSpellbookClick(x, y);
        }
    }
    
    checkInventoryClick(x, y) {
        // Implementar cliques nos slots do inventário
        console.log('Inventory click at:', x, y);
    }
    
    checkCharacterClick(x, y) {
        // Implementar cliques na janela de character
        console.log('Character click at:', x, y);
    }
    
    checkSpellbookClick(x, y) {
        // Implementar cliques no spellbook
        console.log('Spellbook click at:', x, y);
    }
    
    updateHoverState(x, y) {
        // Implementar estados de hover
        // Poderia mostrar tooltips ou mudar cursor
    }
    
    // Métodos de toggle
    toggleWindow(windowType) {
        this.closeAllWindows();
        
        switch(windowType) {
            case 'inventory':
                this.uiState.showInventory = !this.uiState.showInventory;
                break;
            case 'character':
                this.uiState.showCharacter = !this.uiState.showCharacter;
                break;
            case 'spellbook':
                this.uiState.showSpellbook = !this.uiState.showSpellbook;
                break;
            case 'questlog':
                this.uiState.showQuestLog = !this.uiState.showQuestLog;
                break;
            case 'map':
                this.uiState.showMap = !this.uiState.showMap;
                break;
            case 'friends':
                this.uiState.showFriends = !this.uiState.showFriends;
                break;
            case 'guild':
                this.uiState.showGuild = !this.uiState.showGuild;
                break;
        }
    }
    
    closeAllWindows() {
        this.uiState.showInventory = false;
        this.uiState.showCharacter = false;
        this.uiState.showSpellbook = false;
        this.uiState.showQuestLog = false;
        this.uiState.showMap = false;
        this.uiState.showFriends = false;
        this.uiState.showGuild = false;
    }
    
    // Métodos de estado
    updatePlayerState(state) {
        Object.assign(this.playerState, state);
    }
    
    updateTargetState(state) {
        Object.assign(this.targetState, state);
    }
    
    showNotification(text, type = 'info', duration = 3000) {
        const colors = {
            info: this.colors.info,
            success: this.colors.uncommon,
            warning: this.colors.gold,
            error: this.colors.health
        };
        
        this.uiState.notifications.push({
            text,
            color: colors[type] || colors.info,
            lifeTime: duration
        });
        
        // Limitar notificações
        if (this.uiState.notifications.length > 5) {
            this.uiState.notifications.shift();
        }
    }
    
    addBuff(buff) {
        this.uiState.buffs.push(buff);
    }
    
    addDebuff(debuff) {
        this.uiState.debuffs.push(debuff);
    }
    
    setCombatMode(enabled) {
        this.uiState.combatMode = enabled;
        if (enabled) {
            this.showNotification('Combat Mode Enabled', 'warning');
        } else {
            this.showNotification('Combat Mode Disabled', 'info');
        }
    }
    
    getFPS() {
        const now = performance.now();
        const delta = now - (this.lastFrameTime || now);
        this.lastFrameTime = now;
        return Math.round(1000 / delta);
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
window.WoWStyleHUD = WoWStyleHUD;
