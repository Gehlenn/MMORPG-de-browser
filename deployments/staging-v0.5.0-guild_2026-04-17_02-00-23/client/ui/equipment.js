/**
 * Equipment UI System - Player Equipment Management
 * Handles equipment display, equipping items, and stat visualization
 * Version 0.3.2 - Character Progression Systems
 */

class EquipmentUI {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.equipment = {};
        
        // Equipment slots configuration
        this.equipmentSlots = {
            weapon: { name: 'Arma', icon: '⚔️', x: 3, y: 1 },
            helmet: { name: 'Elmo', icon: '🪖', x: 3, y: 0 },
            armor: { name: 'Armadura', icon: '🦺', x: 3, y: 2 },
            gloves: { name: 'Luvas', icon: '🧤', x: 2, y: 1 },
            boots: { name: 'Botas', icon: '👢', x: 3, y: 3 },
            ring: { name: 'Anel', icon: '💍', x: 4, y: 1 },
            amulet: { name: 'Amuleto', icon: '📿', x: 2, y: 2 }
        };
        
        // UI Elements
        this.container = null;
        this.equipmentGrid = null;
        this.statsPanel = null;
        this.itemTooltip = null;
        
        // Item types and rarities (same as inventory)
        this.itemTypes = {
            weapon: { icon: '⚔️', color: '#ff6b6b' },
            helmet: { icon: '🪖', color: '#3498db' },
            armor: { icon: '🦺', color: '#2ecc71' },
            gloves: { icon: '🧤', color: '#f39c12' },
            boots: { icon: '👢', color: '#9b59b6' },
            ring: { icon: '💍', color: '#e74c3c' },
            amulet: { icon: '📿', color: '#1abc9c' }
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
        this.createEquipmentUI();
        this.setupEventListeners();
        this.setupSocketEvents();
        
        // Request equipment from server
        this.game.socket.emit('requestEquipment');
    }
    
    createEquipmentUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'equipment-ui';
        this.container.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            height: 400px;
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
        header.textContent = 'Equipamento';
        
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
        
        // Create main content area
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
            display: flex;
            height: calc(100% - 50px);
        `;
        
        // Create equipment section
        const equipmentSection = document.createElement('div');
        equipmentSection.style.cssText = `
            flex: 1;
            padding: 15px;
            border-right: 2px solid #1a252f;
        `;
        
        // Create equipment grid
        this.equipmentGrid = document.createElement('div');
        this.equipmentGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(5, 60px);
            grid-template-rows: repeat(4, 60px);
            gap: 5px;
            justify-content: center;
            margin-bottom: 15px;
        `;
        
        // Create equipment slots
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 5; col++) {
                const slot = this.createEquipmentSlot(row, col);
                this.equipmentGrid.appendChild(slot);
            }
        }
        
        // Create gear score display
        const gearScoreDisplay = document.createElement('div');
        gearScoreDisplay.id = 'gear-score';
        gearScoreDisplay.style.cssText = `
            background: linear-gradient(135deg, #1a252f 0%, #2c3e50 100%);
            border: 2px solid #34495e;
            border-radius: 5px;
            padding: 10px;
            text-align: center;
            color: #ecf0f1;
            font-weight: bold;
        `;
        gearScoreDisplay.innerHTML = `
            <div style="font-size: 12px; color: #bdc3c7;">Gear Score</div>
            <div id="gear-score-value" style="font-size: 24px; color: #f39c12;">0</div>
        `;
        
        equipmentSection.appendChild(this.equipmentGrid);
        equipmentSection.appendChild(gearScoreDisplay);
        
        // Create stats section
        const statsSection = document.createElement('div');
        statsSection.style.cssText = `
            flex: 1;
            padding: 15px;
        `;
        
        const statsHeader = document.createElement('div');
        statsHeader.style.cssText = `
            font-weight: bold;
            color: #ecf0f1;
            margin-bottom: 15px;
            text-align: center;
            font-size: 16px;
        `;
        statsHeader.textContent = 'Atributos';
        
        this.statsPanel = document.createElement('div');
        this.statsPanel.id = 'stats-panel';
        this.statsPanel.style.cssText = `
            background: linear-gradient(135deg, #1a252f 0%, #2c3e50 100%);
            border: 2px solid #34495e;
            border-radius: 5px;
            padding: 15px;
        `;
        
        statsSection.appendChild(statsHeader);
        statsSection.appendChild(this.statsPanel);
        
        // Create item tooltip (reuse from inventory)
        this.itemTooltip = document.createElement('div');
        this.itemTooltip.id = 'equipment-tooltip';
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
        contentArea.appendChild(equipmentSection);
        contentArea.appendChild(statsSection);
        this.container.appendChild(header);
        this.container.appendChild(contentArea);
        document.body.appendChild(this.container);
        document.body.appendChild(this.itemTooltip);
    }
    
    createEquipmentSlot(row, col) {
        const slot = document.createElement('div');
        slot.className = 'equipment-slot';
        slot.dataset.row = row;
        slot.dataset.col = col;
        
        // Find slot type at this position
        const slotType = this.getSlotTypeAtPosition(row, col);
        
        if (slotType) {
            const slotData = this.equipmentSlots[slotType];
            slot.dataset.slotType = slotType;
            
            slot.style.cssText = `
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #1a252f 0%, #2c3e50 100%);
                border: 2px solid #34495e;
                border-radius: 5px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                position: relative;
                transition: all 0.2s ease;
            `;
            
            // Slot icon
            const icon = document.createElement('div');
            icon.textContent = slotData.icon;
            icon.style.cssText = `
                font-size: 20px;
                opacity: 0.3;
                margin-bottom: 2px;
            `;
            
            // Slot name
            const name = document.createElement('div');
            name.textContent = slotData.name;
            name.style.cssText = `
                font-size: 8px;
                color: #7f8c8d;
                text-align: center;
            `;
            
            slot.appendChild(icon);
            slot.appendChild(name);
            
            // Hover effects
            slot.addEventListener('mouseenter', (e) => {
                slot.style.borderColor = '#3498db';
                slot.style.transform = 'scale(1.05)';
                this.showTooltip(e, slotType);
            });
            
            slot.addEventListener('mouseleave', () => {
                slot.style.borderColor = '#34495e';
                slot.style.transform = 'scale(1)';
                this.hideTooltip();
            });
            
            // Click to unequip
            slot.addEventListener('click', () => {
                if (this.equipment[slotType]) {
                    this.unequipItem(slotType);
                }
            });
            
            // Drag and drop
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (slotType) {
                    slot.style.borderColor = '#f39c12';
                    slot.style.background = 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
                }
            });
            
            slot.addEventListener('dragleave', () => {
                slot.style.borderColor = '#34495e';
                slot.style.background = 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)';
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                this.handleDrop(e, slotType);
            });
            
        } else {
            // Empty slot
            slot.style.cssText = `
                width: 60px;
                height: 60px;
                background: transparent;
                border: none;
                pointer-events: none;
            `;
        }
        
        return slot;
    }
    
    getSlotTypeAtPosition(row, col) {
        for (const [slotType, data] of Object.entries(this.equipmentSlots)) {
            if (data.x === col && data.y === row) {
                return slotType;
            }
        }
        return null;
    }
    
    setupEventListeners() {
        // Keyboard shortcut to toggle equipment
        document.addEventListener('keydown', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                this.toggle();
            }
        });
        
        // Close equipment when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target)) {
                this.close();
            }
        });
    }
    
    setupSocketEvents() {
        // Receive equipment from server
        this.game.socket.on('equipmentUpdate', (data) => {
            this.updateEquipment(data);
        });
        
        // Receive player stats update
        this.game.socket.on('playerStatsUpdate', (data) => {
            this.updateStats(data);
        });
        
        // Item equip result
        this.game.socket.on('itemEquipResult', (data) => {
            if (!data.success) {
                this.showError(data.message);
            }
        });
        
        // Item unequip result
        this.game.socket.on('itemUnequipResult', (data) => {
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
        
        // Request fresh equipment data
        this.game.socket.emit('requestEquipment');
        this.game.socket.emit('requestPlayerStats');
    }
    
    close() {
        this.isOpen = false;
        this.container.style.display = 'none';
        this.hideTooltip();
    }
    
    updateEquipment(equipmentData) {
        this.equipment = equipmentData || {};
        this.renderEquipment();
        this.updateGearScore();
    }
    
    renderEquipment() {
        const slots = this.equipmentGrid.children;
        
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const slotType = slot.dataset.slotType;
            
            if (!slotType) continue;
            
            // Clear slot
            slot.innerHTML = '';
            slot.style.background = 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)';
            
            const item = this.equipment[slotType];
            if (item) {
                this.renderEquippedItem(slot, item, slotType);
            } else {
                // Show empty slot icon
                const slotData = this.equipmentSlots[slotType];
                const icon = document.createElement('div');
                icon.textContent = slotData.icon;
                icon.style.cssText = `
                    font-size: 20px;
                    opacity: 0.3;
                    margin-bottom: 2px;
                `;
                
                const name = document.createElement('div');
                name.textContent = slotData.name;
                name.style.cssText = `
                    font-size: 8px;
                    color: #7f8c8d;
                    text-align: center;
                `;
                
                slot.appendChild(icon);
                slot.appendChild(name);
            }
        }
    }
    
    renderEquippedItem(slot, item, slotType) {
        const itemData = this.itemTypes[item.type] || { icon: '❓', color: '#ffffff' };
        const rarityData = this.rarities[item.rarity] || { color: '#ffffff', name: 'Comum' };
        
        // Create item container
        const itemContainer = document.createElement('div');
        itemContainer.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            cursor: pointer;
        `;
        
        // Item icon
        const icon = document.createElement('div');
        icon.textContent = itemData.icon;
        icon.style.cssText = `
            font-size: 28px;
            filter: drop-shadow(0 0 3px ${rarityData.color});
        `;
        
        // Rarity border
        slot.style.borderColor = rarityData.color;
        slot.style.boxShadow = `0 0 10px ${rarityData.color}40`;
        
        // Click to unequip
        itemContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            this.unequipItem(slotType);
        });
        
        itemContainer.appendChild(icon);
        slot.appendChild(itemContainer);
    }
    
    updateStats(statsData) {
        if (!statsData) return;
        
        let statsHTML = '';
        
        // Display stats
        const stats = [
            { key: 'attack', name: 'Ataque', icon: '⚔️' },
            { key: 'defense', name: 'Defesa', icon: '🛡️' },
            { key: 'health', name: 'Vida', icon: '❤️' },
            { key: 'maxHealth', name: 'Vida Máxima', icon: '💚' },
            { key: 'mana', name: 'Mana', icon: '💙' },
            { key: 'maxMana', name: 'Mana Máxima', icon: '💠' }
        ];
        
        for (const stat of stats) {
            if (statsData[stat.key] !== undefined) {
                const value = statsData[stat.key];
                const maxValue = statsData[stat.key.replace(/^(.)/, 'max$1')];
                
                statsHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 5px; background: rgba(52, 73, 94, 0.3); border-radius: 3px;">
                        <span style="color: #bdc3c7;">${stat.icon} ${stat.name}</span>
                        <span style="color: #ecf0f1; font-weight: bold;">
                            ${Math.round(value)}${maxValue ? ` / ${Math.round(maxValue)}` : ''}
                        </span>
                    </div>
                `;
            }
        }
        
        // Gear score
        if (statsData.gearScore !== undefined) {
            statsHTML += `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #34495e;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #f39c12;">⭐ Gear Score</span>
                        <span style="color: #f39c12; font-weight: bold; font-size: 16px;">${statsData.gearScore}</span>
                    </div>
                </div>
            `;
        }
        
        this.statsPanel.innerHTML = statsHTML;
    }
    
    updateGearScore() {
        let gearScore = 0;
        
        for (const item of Object.values(this.equipment)) {
            if (item && item.stats) {
                for (const value of Object.values(item.stats)) {
                    if (typeof value === 'number') {
                        gearScore += Math.abs(value);
                    }
                }
            }
        }
        
        const gearScoreElement = document.getElementById('gear-score-value');
        if (gearScoreElement) {
            gearScoreElement.textContent = gearScore;
        }
    }
    
    handleDrop(e, slotType) {
        e.preventDefault();
        
        // Get item from inventory (dragged from inventory)
        const slotIndex = e.dataTransfer.getData('text/plain');
        
        if (!slotIndex || !slotType) return;
        
        // Send equip request to server
        this.game.socket.emit('equipItem', { slotIndex: parseInt(slotIndex) });
        
        // Reset slot styling
        e.currentTarget.style.borderColor = '#34495e';
        e.currentTarget.style.background = 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)';
    }
    
    unequipItem(slotType) {
        if (!this.equipment[slotType]) return;
        
        // Send unequip request to server
        this.game.socket.emit('unequipItem', { slotType });
    }
    
    showTooltip(e, slotType) {
        const item = this.equipment[slotType];
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
        
        // Add stats
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
        
        // Add unequip hint
        tooltipHTML += `<div style="color: #3498db; margin-top: 8px; font-size: 10px;">Clique para desequipar</div>`;
        
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
            critDamage: 'Dano Crítico',
            healthRestore: 'Restaura Vida',
            manaRestore: 'Restaura Mana',
            attackBoost: 'Aumento de Ataque',
            duration: 'Duração'
        };
        return translations[stat] || stat;
    }
    
    // Public API
    getEquipment() {
        return this.equipment;
    }
    
    isEquipped(slotType) {
        return !!this.equipment[slotType];
    }
    
    getEquippedItem(slotType) {
        return this.equipment[slotType];
    }
    
    // Cleanup
    cleanup() {
        if (this.container) this.container.remove();
        if (this.itemTooltip) this.itemTooltip.remove();
    }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EquipmentUI;
} else {
    window.EquipmentUI = EquipmentUI;
}
