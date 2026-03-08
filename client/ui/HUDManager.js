/**
 * HUD Manager
 * Manages all UI elements using generated art assets
 */

class HUDManager {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.canvas = null;
        this.ctx = null;
        this.visible = true;
        
        // HUD elements
        this.elements = {
            healthBar: null,
            manaBar: null,
            expBar: null,
            minimap: { visible: true },
            inventory: null,
            chat: null,
            buttons: null,
            stats: null
        };
        
        // UI state
        this.state = {
            playerHealth: 100,
            playerMaxHealth: 100,
            playerMana: 50,
            playerMaxMana: 50,
            playerExp: 0,
            playerExpToNext: 100,
            playerLevel: 1,
            playerGold: 0,
            inventory: [],
            chatMessages: [],
            showInventory: false,
            showChat: true
        };
        
        // Button configurations
        this.buttons = {
            inventory: { x: 10, y: 10, width: 60, height: 30, icon: '🎒', label: 'Inventário' },
            character: { x: 80, y: 10, width: 80, height: 30, icon: '👤', label: 'Personagem' },
            map: { x: 170, y: 10, width: 60, height: 30, icon: '🗺️', label: 'Mapa' },
            quests: { x: 240, y: 10, width: 60, height: 30, icon: '📜', label: 'Missões' },
            settings: { x: 310, y: 10, width: 60, height: 30, icon: '⚙️', label: 'Config' }
        };
        
        this.init();
    }
    
    /**
     * Set game engine reference
     */
    setGameEngine(gameEngine) {
        this.gameEngine = gameEngine;
        this.canvas = gameEngine.canvas; // Usar canvas do jogo
        console.log('🎮 HUD Manager recebeu referência do game engine');
    }
    
    /**
     * Initialize HUD
     */
    init() {
        this.createHUDCanvas();
        this.setupEventListeners();
        this.loadUIAssets();
        console.log('🎮 HUD inicializado');
    }
    
    /**
     * Create HUD canvas - REMOVIDO para não criar canvas sobreposto
     */
    createHUDCanvas() {
        // NÃO criar canvas HUD - estava causando sobreposição
        console.log('🎮 HUD Canvas desativado para evitar sobreposição');
        this.canvas = null;
        this.ctx = null;
    }
    
    /**
     * Load UI assets
     */
    async loadUIAssets() {
        try {
            // Load layout assets
            if (this.assetManager && this.assetManager.getUI) {
                const layoutAsset = this.assetManager.getUI('layout_main_01');
                if (layoutAsset && layoutAsset.loaded) {
                    this.elements.layout = layoutAsset;
                    console.log('✅ Layout UI carregado');
                }
                
                // Load main UI asset
                const mainAsset = this.assetManager.getUI('_main_01');
                if (mainAsset && mainAsset.loaded) {
                    this.elements.main = mainAsset;
                    console.log('✅ Main UI carregado');
                }
            } else {
                console.log('⚠️ AssetManager não disponível ainda');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar UI assets:', error);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window resize - apenas se canvas existir
        window.addEventListener('resize', () => {
            if (this.canvas) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                this.toggleInventory();
            } else if (e.key === 'm' || e.key === 'M') {
                this.toggleMinimap();
            } else if (e.key === 'Enter' && e.shiftKey) {
                this.focusChat();
            }
        });
        
        // Mouse events for buttons - apenas se canvas existir
        if (this.canvas) {
            this.canvas.style.pointerEvents = 'auto';
            this.canvas.addEventListener('click', (e) => {
                this.handleClick(e);
            });
            
            this.canvas.addEventListener('mousemove', (e) => {
                this.handleMouseMove(e);
            });
        }
    }
    
    /**
     * Handle mouse clicks
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check button clicks
        Object.entries(this.buttons).forEach(([key, button]) => {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {
                this.onButtonClick(key);
            }
        });
    }
    
    /**
     * Handle mouse movement
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check button hover
        Object.entries(this.buttons).forEach(([key, button]) => {
            button.hovered = x >= button.x && x <= button.x + button.width &&
                           y >= button.y && y <= button.y + button.height;
        });
    }
    
    /**
     * Handle button clicks
     */
    onButtonClick(buttonKey) {
        console.log(`🖱️ Botão clicado: ${buttonKey}`);
        
        switch (buttonKey) {
            case 'inventory':
                this.toggleInventory();
                break;
            case 'character':
                this.showCharacterSheet();
                break;
            case 'map':
                this.toggleMinimap();
                break;
            case 'quests':
                this.showQuestLog();
                break;
            case 'settings':
                this.showSettings();
                break;
        }
    }
    
    /**
     * Toggle inventory
     */
    toggleInventory() {
        this.state.showInventory = !this.state.showInventory;
        console.log('🎒 Inventário:', this.state.showInventory ? 'aberto' : 'fechado');
    }
    
    /**
     * Toggle minimap
     */
    toggleMinimap() {
        if (this.elements.minimap) {
            this.elements.minimap.visible = !this.elements.minimap.visible;
            console.log('🗺️ Minimapa:', this.elements.minimap.visible ? 'visível' : 'oculto');
        }
    }
    
    /**
     * Focus chat
     */
    focusChat() {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.focus();
        }
    }
    
    /**
     * Show character sheet
     */
    showCharacterSheet() {
        console.log('👤 Abrindo ficha de personagem...');
        // This would open a detailed character stats modal
    }
    
    /**
     * Show quest log
     */
    showQuestLog() {
        console.log('📜 Abrindo registro de missões...');
        // This would open the quest log modal
    }
    
    /**
     * Show settings
     */
    showSettings() {
        console.log('⚙️ Abrindo configurações...');
        // This would open the settings modal
    }
    
    /**
     * Update player stats
     */
    updatePlayerStats(stats) {
        Object.assign(this.state, stats);
    }
    
    /**
     * Add chat message
     */
    addChatMessage(message, type = 'normal') {
        const timestamp = new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        this.state.chatMessages.push({
            message,
            type,
            timestamp
        });
        
        // Keep only last 50 messages
        if (this.state.chatMessages.length > 50) {
            this.state.chatMessages.shift();
        }
    }
    
    /**
     * Add item to inventory
     */
    addInventoryItem(item) {
        this.state.inventory.push(item);
        console.log(`🎒 Item adicionado ao inventário: ${item.name}`);
    }
    
    /**
     * Remove item from inventory
     */
    removeInventoryItem(itemId) {
        const index = this.state.inventory.findIndex(item => item.id === itemId);
        if (index !== -1) {
            const removedItem = this.state.inventory.splice(index, 1)[0];
            console.log(`🎒 Item removido do inventário: ${removedItem.name}`);
            return removedItem;
        }
        return null;
    }
    
    /**
     * Render all HUD elements
     */
    render() {
        if (!this.visible || !this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render in order (bottom to top)
        this.renderBackground();
        this.renderButtons();
        this.renderHealthBar();
        this.renderManaBar();
        this.renderExpBar();
        this.renderMinimap();
        this.renderInventory();
        this.renderChat();
        this.renderStats();
    }
    
    /**
     * Render background
     */
    renderBackground() {
        if (this.elements.layout) {
            // Draw background panel
            this.ctx.globalAlpha = 0.8;
            this.ctx.drawImage(this.elements.layout.image, 0, 0);
            this.ctx.globalAlpha = 1.0;
        }
    }
    
    /**
     * Render buttons
     */
    renderButtons() {
        Object.entries(this.buttons).forEach(([key, button]) => {
            const isHovered = button.hovered || false;
            
            // Button background
            this.ctx.fillStyle = isHovered ? 'rgba(76, 175, 80, 0.8)' : 'rgba(76, 175, 80, 0.6)';
            this.ctx.fillRect(button.x, button.y, button.width, button.height);
            
            // Button border
            this.ctx.strokeStyle = isHovered ? '#4CAF50' : '#2E7D32';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(button.x, button.y, button.width, button.height);
            
            // Button icon and text
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            
            const iconX = button.x + 8;
            const textX = button.x + 35;
            const centerY = button.y + button.height / 2;
            
            this.ctx.fillText(button.icon, iconX, centerY);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(button.label, textX, centerY);
        });
    }
    
    /**
     * Render health bar
     */
    renderHealthBar() {
        const x = 10;
        const y = this.canvas.height - 80;
        const width = 200;
        const height = 20;
        
        const healthPercent = this.state.playerHealth / this.state.playerMaxHealth;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, width, height);
        
        // Health fill
        const healthColor = healthPercent > 0.5 ? '#4CAF50' : 
                          healthPercent > 0.25 ? '#FF9800' : '#F44336';
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(x, y, width * healthPercent, height);
        
        // Border
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Text
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `❤️ ${this.state.playerHealth}/${this.state.playerMaxHealth}`,
            x + width / 2,
            y + height / 2
        );
    }
    
    /**
     * Render mana bar
     */
    renderManaBar() {
        const x = 10;
        const y = this.canvas.height - 55;
        const width = 200;
        const height = 20;
        
        const manaPercent = this.state.playerMana / this.state.playerMaxMana;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, width, height);
        
        // Mana fill
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(x, y, width * manaPercent, height);
        
        // Border
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Text
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `💧 ${this.state.playerMana}/${this.state.playerMaxMana}`,
            x + width / 2,
            y + height / 2
        );
    }
    
    /**
     * Render experience bar
     */
    renderExpBar() {
        const x = 10;
        const y = this.canvas.height - 30;
        const width = 200;
        const height = 15;
        
        const expPercent = this.state.playerExp / this.state.playerExpToNext;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, width, height);
        
        // Exp fill
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x, y, width * expPercent, height);
        
        // Border
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        
        // Text
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            `⭐ Lv.${this.state.playerLevel} - ${this.state.playerExp}/${this.state.playerExpToNext} XP`,
            x + 5,
            y + height / 2
        );
    }
    
    /**
     * Render minimap
     */
    renderMinimap() {
        if (!this.elements.minimap.visible) return;
        
        const size = 150;
        const x = this.canvas.width - size - 10;
        const y = 10;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, size, size);
        
        // Border
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, size, size);
        
        // Title
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🗺️ Mapa', x + size / 2, y - 5);
        
        // Draw minimap content (simplified)
        this.renderMinimapContent(x, y, size);
    }
    
    /**
     * Render minimap content
     */
    renderMinimapContent(x, y, size) {
        // This would render the actual map content
        // For now, just draw a placeholder
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x + size/2 - 5, y + size/2 - 5, 10, 10);
        
        // Draw exit indicators
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + size - 20, y + size/2 - 5, 10, 10); // East
        this.ctx.fillRect(x + 5, y + 5, 10, 10); // South
    }
    
    /**
     * Render inventory
     */
    renderInventory() {
        if (!this.state.showInventory) return;
        
        const x = this.canvas.width / 2 - 200;
        const y = this.canvas.height / 2 - 150;
        const width = 400;
        const height = 300;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(x, y, width, height);
        
        // Border
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);
        
        // Title
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎒 Inventário', x + width / 2, y + 30);
        
        // Grid background
        const gridSize = 50;
        const gridCols = 7;
        const gridRows = 4;
        const gridX = x + 25;
        const gridY = y + 60;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const slotX = gridX + col * gridSize;
                const slotY = gridY + row * gridSize;
                
                this.ctx.strokeRect(slotX, slotY, gridSize, gridSize);
                
                // Draw item if exists
                const itemIndex = row * gridCols + col;
                const item = this.state.inventory[itemIndex];
                if (item) {
                    this.renderInventoryItem(item, slotX, slotY, gridSize);
                }
            }
        }
        
        // Close button
        this.ctx.fillStyle = '#F44336';
        this.ctx.fillRect(x + width - 30, y + 5, 25, 25);
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('✕', x + width - 17, y + 22);
    }
    
    /**
     * Render inventory item
     */
    renderInventoryItem(item, x, y, size) {
        // Item background
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Item icon (simplified)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const icons = {
            weapon: '⚔️',
            armor: '🛡️',
            potion: '🧪',
            food: '🍞',
            gem: '💎',
            gold: '🪙',
            quest: '📜'
        };
        
        const icon = icons[item.type] || '📦';
        this.ctx.fillText(icon, x + size / 2, y + size / 2);
        
        // Item quantity
        if (item.quantity > 1) {
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(item.quantity, x + size - 8, y + 12);
        }
    }
    
    /**
     * Render chat
     */
    renderChat() {
        if (!this.state.showChat) return;
        
        const x = 10;
        const y = 60;
        const width = 300;
        const height = 200;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, width, height);
        
        // Border
        this.ctx.strokeStyle = '#2196F3';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Title
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('💬 Chat', x + 10, y + 20);
        
        // Messages
        this.ctx.font = '11px Arial';
        let messageY = y + 40;
        
        this.state.chatMessages.slice(-10).forEach(msg => {
            const color = msg.type === 'system' ? '#4CAF50' : 
                          msg.type === 'error' ? '#F44336' : '#FFF';
            
            this.ctx.fillStyle = color;
            this.ctx.fillText(
                `[${msg.timestamp}] ${msg.message}`,
                x + 10,
                messageY
            );
            
            messageY += 18;
        });
    }
    
    /**
     * Render stats
     */
    renderStats() {
        const x = this.canvas.width - 160;
        const y = this.canvas.height - 80;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, 150, 70);
        
        // Border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, 150, 70);
        
        // Stats text
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const stats = [
            `🪙 Ouro: ${this.state.playerGold}`,
            `🎒 Itens: ${this.state.inventory.length}`,
            `⏱️ Tempo: ${Math.floor(Date.now() / 1000)}s`
        ];
        
        stats.forEach((stat, index) => {
            this.ctx.fillText(stat, x + 10, y + 20 + index * 18);
        });
    }
    
    /**
     * Show/hide HUD
     */
    setVisible(visible) {
        this.visible = visible;
        this.canvas.style.display = visible ? 'block' : 'none';
    }
    
    /**
     * Get HUD state
     */
    getState() {
        return this.state;
    }
    
    /**
     * Destroy HUD
     */
    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Global instance
window.hudManager = new HUDManager();
