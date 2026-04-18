/**
 * Inventory UI System - Player Inventory Management
 * Handles inventory display, item management, and drag-and-drop functionality
 * Version 0.3.2 - Character Progression Systems
 */

class InventoryUI {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.inventory = [];
        this.maxSlots = 24;
        this.slotSize = 50;
        this.slotsPerRow = 6;
        
        // UI Elements
        this.container = null;
        this.inventoryGrid = null;
        this.itemTooltip = null;
        
        // Drag and Drop
        this.draggedItem = null;
        this.draggedSlot = null;
        
        // Item types and rarities
        this.itemTypes = {
            weapon: { icon: '⚔️', color: '#ff6b6b' },
            helmet: { icon: '🪖', color: '#3498db' },
            armor: { icon: '🦺', color: '#2ecc71' },
            gloves: { icon: '🧤', color: '#f39c12' },
            boots: { icon: '👢', color: '#9b59b6' },
            ring: { icon: '💍', color: '#e74c3c' },
            amulet: { icon: '📿', color: '#1abc9c' },
            consumable: { icon: '🧪', color: '#34495e' },
            material: { icon: '🔨', color: '#95a5a6' },
            quest: { icon: '📜', color: '#f1c40f' }
        };
        
        this.rarities = {
            common: { color: '#ffffff', name: 'Comum' },
            uncommon: { color: '#00ff00', name: 'Incomum' },
            rare: { color: '#0080ff', name: 'Raro' },
            epic: { color: '#8000ff', name: 'Épico' },
            legendary: { color: '#ff8000', name: 'Lendário' }
        };
        
        this.initialize();
    }
    
    initialize() {
        this.createInventoryUI();
        this.setupEventListeners();
        this.setupSocketEvents();
        
        // Request inventory from server
        this.game.socket.emit('requestInventory');
    }
    
    createInventoryUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'inventory-ui';
        this.container.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            height: 300px;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            border: 3px solid #34495e;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: none;
            z-index: 1000;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
            color: #ecf0f1;
            padding: 10px;
            border-radius: 7px 7px 0 0;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            border-bottom: 2px solid #1a252f;
        `;
        header.textContent = 'Inventário';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        closeButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 10px;
            background: #e74c3c;
            color: white;
            border: none;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        `;
        closeButton.onclick = () => this.toggle();
        
        header.appendChild(closeButton);
        
        // Create inventory grid
        this.inventoryGrid = document.createElement('div');
        this.inventoryGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 5px;
            padding: 15px;
            height: calc(100% - 50px);
            overflow-y: auto;
        `;
        
        // Create inventory slots
        for (let i = 0; i < this.maxSlots; i++) {
            const slot = this.createSlot(i);
            this.inventoryGrid.appendChild(slot);
        }
        
        // Create item tooltip
        this.itemTooltip = document.createElement('div');
        this.itemTooltip.id = 'item-tooltip';
        this.itemTooltip.style.cssText = `
            position: absolute;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            border: 2px solid #34495e;
            border-radius: 8px;
            padding: 10px;
            color: #ecf0f1;
            font-size: 12px;
            pointer-events: none;
            z-index: 1001;
            display: none;
            min-width: 200px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        `;
        
        // Assemble UI
        this.container.appendChild(header);
        this.container.appendChild(this.inventoryGrid);
        document.body.appendChild(this.container);
        document.body.appendChild(this.itemTooltip);
    }
    
    createSlot(index) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.dataset.slotIndex = index;
        slot.style.cssText = `
            width: ${this.slotSize}px;
            height: ${this.slotSize}px;
            background: linear-gradient(135deg, #1a252f 0%, #2c3e50 100%);
            border: 2px solid #34495e;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
        `;
        
        // Hover effects
        slot.addEventListener('mouseenter', (e) => {
            slot.style.borderColor = '#3498db';
            slot.style.transform = 'scale(1.05)';
            this.showTooltip(e, index);
        });
        
        slot.addEventListener('mouseleave', () => {
            slot.style.borderColor = '#34495e';
            slot.style.transform = 'scale(1)';
            this.hideTooltip();
        });
        
        // Drag and drop events
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            slot.style.borderColor = '#f39c12';
            slot.style.background = 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
        });
        
        slot.addEventListener('dragleave', () => {
            slot.style.borderColor = '#34495e';
            slot.style.background = 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)';
        });
        
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e, index);
        });
        
        // Click events
        slot.addEventListener('click', () => {
            this.handleSlotClick(index);
        });
        
        slot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(index);
        });
        
        return slot;
    }
    
    setupEventListeners() {
        // Keyboard shortcut to toggle inventory
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                this.toggle();
            }
        });
        
        // Close inventory when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target)) {
                this.close();
            }
        });
    }
    
    setupSocketEvents() {
        // Receive inventory from server
        this.game.socket.on('inventoryUpdate', (data) => {
            this.updateInventory(data);
        });
        
        // Item pickup notification
        this.game.socket.on('itemPickup', (data) => {
            this.showPickupNotification(data);
        });
        
        // Item move confirmation
        this.game.socket.on('itemMoveResult', (data) => {
            if (!data.success) {
                this.showError(data.message);
            }
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.isOpen = true;
        this.container.style.display = 'block';
        
        // Request fresh inventory data
        this.game.socket.emit('requestInventory');
    }
    
    close() {
        this.isOpen = false;
        this.container.style.display = 'none';
        this.hideTooltip();
    }
    
    updateInventory(inventoryData) {
        this.inventory = inventoryData;
        this.renderInventory();
    }
    
    renderInventory() {
        const slots = this.inventoryGrid.children;
        
        for (let i = 0; i < this.maxSlots; i++) {
            const slot = slots[i];
            const item = this.inventory[i];
            
            // Clear slot
            slot.innerHTML = '';
            slot.style.background = 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)';
            
            if (item) {
                this.renderItem(slot, item);
            }
        }
    }
    
    renderItem(slot, item) {
        const itemData = this.itemTypes[item.type] || { icon: '❓', color: '#ffffff' };
        const rarityData = this.rarities[item.rarity] || { color: '#ffffff', name: 'Comum' };
        
        // Create item container
        const itemContainer = document.createElement('div');
        itemContainer.draggable = true;
        itemContainer.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            cursor: grab;
        `;
        
        // Item icon
        const icon = document.createElement('div');
        icon.textContent = itemData.icon;
        icon.style.cssText = `
            font-size: 24px;
            filter: drop-shadow(0 0 3px ${rarityData.color});
        `;
        
        // Item quantity (if stackable)
        if (item.quantity > 1) {
            const quantity = document.createElement('div');
            quantity.textContent = item.quantity;
            quantity.style.cssText = `
                position: absolute;
                bottom: 2px;
                right: 2px;
                background: rgba(0,0,0,0.8);
                color: white;
                font-size: 10px;
                padding: 2px 4px;
                border-radius: 3px;
                font-weight: bold;
            `;
            itemContainer.appendChild(quantity);
        }
        
        // Rarity border
        slot.style.borderColor = rarityData.color;
        slot.style.boxShadow = `0 0 10px ${rarityData.color}40`;
        
        // Drag events
        itemContainer.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, slot.dataset.slotIndex);
        });
        
        itemContainer.addEventListener('dragend', () => {
            this.handleDragEnd();
        });
        
        itemContainer.appendChild(icon);
        slot.appendChild(itemContainer);
    }
    
    handleDragStart(e, slotIndex) {
        this.draggedItem = this.inventory[slotIndex];
        this.draggedSlot = slotIndex;
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', slotIndex);
        
        // Visual feedback
        e.target.style.opacity = '0.5';
    }
    
    handleDragEnd() {
        // Reset visual feedback
        const draggedElements = document.querySelectorAll('.inventory-slot > div');
        draggedElements.forEach(el => {
            el.style.opacity = '1';
        });
        
        this.draggedItem = null;
        this.draggedSlot = null;
    }
    
    handleDrop(e, targetSlot) {
        e.preventDefault();
        
        const sourceSlot = parseInt(e.dataTransfer.getData('text/plain'));
        
        if (sourceSlot === targetSlot) return;
        
        // Send move request to server
        this.game.socket.emit('moveItem', {
            fromSlot: sourceSlot,
            toSlot: targetSlot
        });
        
        // Reset slot styling
        e.currentTarget.style.borderColor = '#34495e';
        e.currentTarget.style.background = 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)';
    }
    
    handleSlotClick(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item) return;
        
        // Use/consume item if it's a consumable
        if (item.type === 'consumable') {
            this.game.socket.emit('useItem', { slotIndex });
        }
    }
    
    handleRightClick(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item) return;
        
        // Show context menu for item actions
        this.showContextMenu(slotIndex, item);
    }
    
    showTooltip(e, slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item) return;
        
        const itemData = this.itemTypes[item.type] || { icon: '❓', color: '#ffffff' };
        const rarityData = this.rarities[item.rarity] || { color: '#ffffff', name: 'Comum' };
        
        let tooltipHTML = `
            <div style="color: ${rarityData.color}; font-weight: bold; margin-bottom: 5px;">
                ${itemData.icon} ${item.name}
            </div>
            <div style="color: #bdc3c7; font-size: 11px; margin-bottom: 5px;">
                ${rarityData.name} ${this.capitalizeFirst(item.type)}
            </div>
        `;
        
        // Add stats if equipment
        if (item.stats) {
            tooltipHTML += '<div style="margin-top: 8px; border-top: 1px solid #34495e; padding-top: 5px;">';
            for (const [stat, value] of Object.entries(item.stats)) {
                const color = value > 0 ? '#27ae60' : '#e74c3c';
                const sign = value > 0 ? '+' : '';
                tooltipHTML += `<div style="color: ${color};">${sign}${value} ${this.translateStat(stat)}</div>`;
            }
            tooltipHTML += '</div>';
        }
        
        // Add level requirement
        if (item.levelRequirement) {
            tooltipHTML += `<div style="color: #f39c12;">Nível ${item.levelRequirement}</div>`;
        }
        
        // Add description
        if (item.description) {
            tooltipHTML += `<div style="color: #ecf0f1; font-style: italic; margin-top: 5px; font-size: 11px;">${item.description}</div>`;
        }
        
        this.itemTooltip.innerHTML = tooltipHTML;
        this.itemTooltip.style.display = 'block';
        
        // Position tooltip
        const rect = e.target.getBoundingClientRect();
        this.itemTooltip.style.left = rect.right + 10 + 'px';
        this.itemTooltip.style.top = rect.top + 'px';
        
        // Adjust if tooltip goes off screen
        const tooltipRect = this.itemTooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            this.itemTooltip.style.left = rect.left - tooltipRect.width - 10 + 'px';
        }
        if (tooltipRect.bottom > window.innerHeight) {
            this.itemTooltip.style.top = rect.bottom - tooltipRect.height + 'px';
        }
    }
    
    hideTooltip() {
        this.itemTooltip.style.display = 'none';
    }
    
    showContextMenu(slotIndex, item) {
        // Remove existing context menu
        const existingMenu = document.getElementById('context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.style.cssText = `
            position: absolute;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            border: 2px solid #34495e;
            border-radius: 5px;
            padding: 5px;
            z-index: 1002;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        `;
        
        // Menu options
        const options = [];
        
        if (item.type === 'consumable') {
            options.push({ text: 'Usar', action: () => this.useItem(slotIndex) });
        }
        
        if (['weapon', 'helmet', 'armor', 'gloves', 'boots', 'ring', 'amulet'].includes(item.type)) {
            options.push({ text: 'Equipar', action: () => this.equipItem(slotIndex) });
        }
        
        options.push({ text: 'Descartar', action: () => this.dropItem(slotIndex) });
        
        // Create menu items
        options.forEach(option => {
            const menuItem = document.createElement('div');
            menuItem.textContent = option.text;
            menuItem.style.cssText = `
                padding: 8px 15px;
                color: #ecf0f1;
                cursor: pointer;
                border-radius: 3px;
                transition: background 0.2s;
            `;
            
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = '#34495e';
            });
            
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = 'transparent';
            });
            
            menuItem.addEventListener('click', () => {
                option.action();
                menu.remove();
            });
            
            menu.appendChild(menuItem);
        });
        
        // Position menu
        const rect = event.target.getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = rect.bottom + 'px';
        
        document.body.appendChild(menu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    }
    
    useItem(slotIndex) {
        this.game.socket.emit('useItem', { slotIndex });
    }
    
    equipItem(slotIndex) {
        this.game.socket.emit('equipItem', { slotIndex });
    }
    
    dropItem(slotIndex) {
        if (confirm('Tem certeza que deseja descartar este item?')) {
            this.game.socket.emit('dropItem', { slotIndex });
        }
    }
    
    showPickupNotification(data) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1003;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        notification.textContent = `+${data.item.name}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    showError(message) {
        const error = document.createElement('div');
        error.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1003;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        error.textContent = message;
        
        document.body.appendChild(error);
        
        setTimeout(() => {
            error.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => error.remove(), 300);
        }, 3000);
    }
    
    // Utility methods
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    translateStat(stat) {
        const translations = {
            attack: 'Ataque',
            defense: 'Defesa',
            health: 'Vida',
            mana: 'Mana',
            speed: 'Velocidade',
            critChance: 'Chance Crítica',
            critDamage: 'Dano Crítico'
        };
        return translations[stat] || stat;
    }
    
    // Public API
    getItem(slotIndex) {
        return this.inventory[slotIndex];
    }
    
    hasItem(itemId, quantity = 1) {
        return this.inventory.some(item => item && item.id === itemId && item.quantity >= quantity);
    }
    
    findEmptySlot() {
        return this.inventory.findIndex(slot => !slot);
    }
    
    // Cleanup
    cleanup() {
        if (this.container) this.container.remove();
        if (this.itemTooltip) this.itemTooltip.remove();
        
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu) contextMenu.remove();
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .inventory-slot::-webkit-scrollbar {
        width: 8px;
    }
    
    .inventory-slot::-webkit-scrollbar-track {
        background: #1a252f;
        border-radius: 4px;
    }
    
    .inventory-slot::-webkit-scrollbar-thumb {
        background: #34495e;
        border-radius: 4px;
    }
    
    .inventory-slot::-webkit-scrollbar-thumb:hover {
        background: #4a5f7f;
    }
`;
document.head.appendChild(style);

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryUI;
} else {
    window.InventoryUI = InventoryUI;
}
