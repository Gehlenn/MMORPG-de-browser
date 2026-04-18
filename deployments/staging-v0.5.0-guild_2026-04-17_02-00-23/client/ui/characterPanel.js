/**
 * Character Panel UI - Character Information and Attributes Display
 * Shows character stats, attributes, gear score, and talent access
 * Version 0.3.3 - Cooperative Multiplayer Gameplay
 */

class CharacterPanel {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.currentTab = 'stats';
        
        // Character data
        this.character = {
            level: 1,
            gearScore: 0,
            attributes: {
                STR: 10,
                DEX: 10,
                INT: 10,
                VIT: 10,
                WIS: 10,
                AGI: 10
            },
            stats: {
                health: 100,
                maxHealth: 100,
                mana: 50,
                maxMana: 50,
                attack: 10,
                defense: 5,
                critChance: 0.05,
                critDamage: 2.0,
                speed: 100
            },
            combat: {
                totalDamage: 0,
                totalKills: 0,
                totalDeaths: 0,
                pvpKills: 0,
                pvpDeaths: 0
            }
        };
        
        // UI Elements
        this.container = null;
        this.tabs = {};
        this.panels = {};
        
        // Attribute configuration
        this.attributeConfig = {
            STR: { name: 'Força', color: '#e74c3c', description: 'Aumenta o ataque físico' },
            DEX: { name: 'Destreza', color: '#f39c12', description: 'Aumenta chance de crítico e velocidade' },
            INT: { name: 'Inteligência', color: '#3498db', description: 'Aumenta ataque mágico e mana' },
            VIT: { name: 'Vitalidade', color: '#27ae60', description: 'Aumenta vida e defesa' },
            WIS: { name: 'Sabedoria', color: '#9b59b6', description: 'Aumenta regeneração de mana' },
            AGI: { name: 'Agilidade', color: '#2ecc71', description: 'Aumenta esquiva e velocidade' }
        };
        
        this.initialize();
    }
    
    initialize() {
        this.createCharacterPanel();
        this.setupEventListeners();
        this.setupSocketEvents();
        
        // Request character data
        this.requestCharacterData();
    }
    
    createCharacterPanel() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'character-panel';
        this.container.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 500px;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            border: 3px solid #34495e;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: none;
            z-index: 1000;
            font-family: 'Segoe UI', Arial, sans-serif;
            overflow: hidden;
        `;
        
        // Create header
        const header = this.createHeader();
        this.container.appendChild(header);
        
        // Create tab navigation
        const tabNav = this.createTabNavigation();
        this.container.appendChild(tabNav);
        
        // Create content area
        const contentArea = this.createContentArea();
        this.container.appendChild(contentArea);
        
        document.body.appendChild(this.container);
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
            color: #ecf0f1;
            padding: 15px;
            border-bottom: 2px solid #1a252f;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        // Character name and level
        const charInfo = document.createElement('div');
        charInfo.style.cssText = `
            display: flex;
            align-items: center;
            gap: 15px;
        `;
        
        const charName = document.createElement('div');
        charName.id = 'character-name';
        charName.style.cssText = `
            font-size: 18px;
            font-weight: bold;
            color: #f39c12;
        `;
        charName.textContent = this.game.player?.name || 'Personagem';
        
        const charLevel = document.createElement('div');
        charLevel.id = 'character-level';
        charLevel.style.cssText = `
            background: rgba(52, 152, 219, 0.3);
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 14px;
            font-weight: bold;
        `;
        charLevel.textContent = `Nível ${this.character.level}`;
        
        // Gear score
        const gearScore = document.createElement('div');
        gearScore.id = 'gear-score';
        gearScore.style.cssText = `
            background: rgba(241, 196, 15, 0.3);
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 14px;
            font-weight: bold;
            color: #f1c40f;
        `;
        gearScore.textContent = `GS: ${this.character.gearScore}`;
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        closeButton.style.cssText = `
            background: #e74c3c;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeButton.onclick = () => this.close();
        
        charInfo.appendChild(charName);
        charInfo.appendChild(charLevel);
        header.appendChild(charInfo);
        header.appendChild(gearScore);
        header.appendChild(closeButton);
        
        return header;
    }
    
    createTabNavigation() {
        const tabNav = document.createElement('div');
        tabNav.style.cssText = `
            display: flex;
            background: rgba(44, 62, 80, 0.5);
            border-bottom: 1px solid #34495e;
        `;
        
        const tabs = [
            { id: 'stats', name: 'Atributos', icon: '📊' },
            { id: 'combat', name: 'Combate', icon: '⚔️' },
            { id: 'talents', name: 'Talentos', icon: '🌟' }
        ];
        
        for (const tab of tabs) {
            const tabButton = document.createElement('button');
            tabButton.dataset.tab = tab.id;
            tabButton.style.cssText = `
                flex: 1;
                padding: 12px;
                background: transparent;
                color: #bdc3c7;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            `;
            
            tabButton.innerHTML = `${tab.icon} ${tab.name}`;
            
            tabButton.addEventListener('click', () => {
                this.switchTab(tab.id);
            });
            
            tabButton.addEventListener('mouseenter', () => {
                if (this.currentTab !== tab.id) {
                    tabButton.style.background = 'rgba(52, 73, 94, 0.3)';
                    tabButton.style.color = '#ecf0f1';
                }
            });
            
            tabButton.addEventListener('mouseleave', () => {
                if (this.currentTab !== tab.id) {
                    tabButton.style.background = 'transparent';
                    tabButton.style.color = '#bdc3c7';
                }
            });
            
            this.tabs[tab.id] = tabButton;
            tabNav.appendChild(tabButton);
        }
        
        // Set first tab as active
        this.switchTab('stats');
        
        return tabNav;
    }
    
    createContentArea() {
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            height: calc(100% - 120px);
        `;
        
        // Create panels for each tab
        this.panels.stats = this.createStatsPanel();
        this.panels.combat = this.createCombatPanel();
        this.panels.talents = this.createTalentsPanel();
        
        contentArea.appendChild(this.panels.stats);
        contentArea.appendChild(this.panels.combat);
        contentArea.appendChild(this.panels.talents);
        
        // Hide all panels except the first one
        this.panels.combat.style.display = 'none';
        this.panels.talents.style.display = 'none';
        
        return contentArea;
    }
    
    createStatsPanel() {
        const panel = document.createElement('div');
        panel.id = 'stats-panel';
        
        // Attributes section
        const attributesSection = document.createElement('div');
        attributesSection.style.cssText = `
            margin-bottom: 25px;
        `;
        
        const attributesTitle = document.createElement('h3');
        attributesTitle.style.cssText = `
            color: #ecf0f1;
            margin-bottom: 15px;
            font-size: 16px;
            border-bottom: 2px solid #34495e;
            padding-bottom: 5px;
        `;
        attributesTitle.textContent = 'Atributos Principais';
        
        const attributesGrid = document.createElement('div');
        attributesGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        `;
        
        for (const [attr, config] of Object.entries(this.attributeConfig)) {
            const attrElement = this.createAttributeElement(attr, config);
            attributesGrid.appendChild(attrElement);
        }
        
        attributesSection.appendChild(attributesTitle);
        attributesSection.appendChild(attributesGrid);
        
        // Combat stats section
        const combatStatsSection = document.createElement('div');
        
        const combatStatsTitle = document.createElement('h3');
        combatStatsTitle.style.cssText = `
            color: #ecf0f1;
            margin-bottom: 15px;
            font-size: 16px;
            border-bottom: 2px solid #34495e;
            padding-bottom: 5px;
        `;
        combatStatsTitle.textContent = 'Estatísticas de Combate';
        
        const combatStatsGrid = document.createElement('div');
        combatStatsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        `;
        
        const combatStats = [
            { key: 'health', name: 'Vida', icon: '❤️', color: '#e74c3c' },
            { key: 'mana', name: 'Mana', icon: '💙', color: '#3498db' },
            { key: 'attack', name: 'Ataque', icon: '⚔️', color: '#f39c12' },
            { key: 'defense', name: 'Defesa', icon: '🛡️', color: '#27ae60' },
            { key: 'critChance', name: 'Chance Crítica', icon: '💥', color: '#e67e22' },
            { key: 'critDamage', name: 'Dano Crítico', icon: '⚡', color: '#9b59b6' }
        ];
        
        for (const stat of combatStats) {
            const statElement = this.createCombatStatElement(stat);
            combatStatsGrid.appendChild(statElement);
        }
        
        combatStatsSection.appendChild(combatStatsTitle);
        combatStatsSection.appendChild(combatStatsGrid);
        
        panel.appendChild(attributesSection);
        panel.appendChild(combatStatsSection);
        
        return panel;
    }
    
    createAttributeElement(attr, config) {
        const element = document.createElement('div');
        element.style.cssText = `
            background: linear-gradient(135deg, rgba(52, 73, 94, 0.5) 0%, rgba(44, 62, 80, 0.5) 100%);
            border: 2px solid ${config.color}40;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            transition: all 0.2s ease;
            cursor: pointer;
        `;
        
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'scale(1.05)';
            element.style.borderColor = config.color;
            element.style.boxShadow = `0 0 15px ${config.color}40`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'scale(1)';
            element.style.borderColor = `${config.color}40`;
            element.style.boxShadow = 'none';
        });
        
        // Attribute name
        const name = document.createElement('div');
        name.style.cssText = `
            color: ${config.color};
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
        `;
        name.textContent = config.name;
        
        // Attribute value
        const value = document.createElement('div');
        value.id = `attr-${attr}`;
        value.style.cssText = `
            color: #ecf0f1;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        `;
        value.textContent = this.character.attributes[attr];
        
        // Attribute description
        const description = document.createElement('div');
        description.style.cssText = `
            color: #7f8c8d;
            font-size: 10px;
            font-style: italic;
        `;
        description.textContent = config.description;
        
        element.appendChild(name);
        element.appendChild(value);
        element.appendChild(description);
        
        return element;
    }
    
    createCombatStatElement(stat) {
        const element = document.createElement('div');
        element.style.cssText = `
            background: linear-gradient(135deg, rgba(52, 73, 94, 0.3) 0%, rgba(44, 62, 80, 0.3) 100%);
            border: 1px solid #34495e;
            border-radius: 5px;
            padding: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        // Icon
        const icon = document.createElement('div');
        icon.style.cssText = `
            font-size: 20px;
        `;
        icon.textContent = stat.icon;
        
        // Stat info
        const info = document.createElement('div');
        info.style.cssText = `
            flex: 1;
        `;
        
        const name = document.createElement('div');
        name.style.cssText = `
            color: #bdc3c7;
            font-size: 12px;
            margin-bottom: 2px;
        `;
        name.textContent = stat.name;
        
        const value = document.createElement('div');
        value.id = `stat-${stat.key}`;
        value.style.cssText = `
            color: ${stat.color};
            font-size: 16px;
            font-weight: bold;
        `;
        
        // Format value based on stat type
        let displayValue = this.character.stats[stat.key];
        if (stat.key === 'critChance') {
            displayValue = `${(displayValue * 100).toFixed(1)}%`;
        } else if (stat.key === 'critDamage') {
            displayValue = `${displayValue.toFixed(1)}x`;
        } else if (stat.key === 'health' || stat.key === 'mana') {
            displayValue = `${displayValue}/${this.character.stats[`max${stat.key.charAt(0).toUpperCase() + stat.key.slice(1)}`]}`;
        }
        
        value.textContent = displayValue;
        
        info.appendChild(name);
        info.appendChild(value);
        
        element.appendChild(icon);
        element.appendChild(info);
        
        return element;
    }
    
    createCombatPanel() {
        const panel = document.createElement('div');
        panel.id = 'combat-panel';
        
        // Combat statistics
        const combatStats = document.createElement('div');
        combatStats.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        `;
        
        const stats = [
            { key: 'totalDamage', name: 'Dano Total', icon: '⚔️', color: '#e74c3c' },
            { key: 'totalKills', name: 'Abates Totais', icon: '💀', color: '#f39c12' },
            { key: 'totalDeaths', name: 'Mortes Totais', icon: '💀', color: '#95a5a6' },
            { key: 'pvpKills', name: 'Abates PvP', icon: '⚔️', color: '#e74c3c' },
            { key: 'pvpDeaths', name: 'Mortes PvP', icon: '💀', color: '#95a5a6' },
            { key: 'kdr', name: 'K/D Ratio', icon: '📊', color: '#3498db' }
        ];
        
        for (const stat of stats) {
            const statElement = this.createCombatRecordElement(stat);
            combatStats.appendChild(statElement);
        }
        
        panel.appendChild(combatStats);
        
        return panel;
    }
    
    createCombatRecordElement(stat) {
        const element = document.createElement('div');
        element.style.cssText = `
            background: linear-gradient(135deg, rgba(52, 73, 94, 0.5) 0%, rgba(44, 62, 80, 0.5) 100%);
            border: 1px solid #34495e;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        `;
        
        // Icon
        const icon = document.createElement('div');
        icon.style.cssText = `
            font-size: 24px;
            margin-bottom: 8px;
        `;
        icon.textContent = stat.icon;
        
        // Name
        const name = document.createElement('div');
        name.style.cssText = `
            color: #bdc3c7;
            font-size: 12px;
            margin-bottom: 5px;
        `;
        name.textContent = stat.name;
        
        // Value
        const value = document.createElement('div');
        value.id = `combat-${stat.key}`;
        value.style.cssText = `
            color: ${stat.color};
            font-size: 20px;
            font-weight: bold;
        `;
        
        // Calculate K/D ratio
        let displayValue = this.character.combat[stat.key] || 0;
        if (stat.key === 'kdr') {
            const kills = this.character.combat.totalKills || 0;
            const deaths = this.character.combat.totalDeaths || 0;
            displayValue = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
        }
        
        value.textContent = displayValue.toLocaleString();
        
        element.appendChild(icon);
        element.appendChild(name);
        element.appendChild(value);
        
        return element;
    }
    
    createTalentsPanel() {
        const panel = document.createElement('div');
        panel.id = 'talents-panel';
        
        // Talent tree placeholder
        const talentPlaceholder = document.createElement('div');
        talentPlaceholder.style.cssText = `
            text-align: center;
            padding: 50px;
            color: #7f8c8d;
        `;
        
        const icon = document.createElement('div');
        icon.style.cssText = `
            font-size: 48px;
            margin-bottom: 15px;
        `;
        icon.textContent = '🌟';
        
        const title = document.createElement('h3');
        title.style.cssText = `
            color: #ecf0f1;
            margin-bottom: 10px;
        `;
        title.textContent = 'Sistema de Talentos';
        
        const description = document.createElement('p');
        description.style.cssText = `
            color: #bdc3c7;
            font-style: italic;
            margin-bottom: 20px;
        `;
        description.textContent = 'O sistema de talentos estará disponível em breve!';
        
        const comingSoon = document.createElement('div');
        comingSoon.style.cssText = `
            background: rgba(241, 196, 15, 0.2);
            border: 2px solid #f1c40f;
            border-radius: 8px;
            padding: 15px;
            color: #f1c40f;
            font-weight: bold;
        `;
        comingSoon.textContent = 'Em Breve - Versão 0.4.0';
        
        talentPlaceholder.appendChild(icon);
        talentPlaceholder.appendChild(title);
        talentPlaceholder.appendChild(description);
        talentPlaceholder.appendChild(comingSoon);
        
        panel.appendChild(talentPlaceholder);
        
        return panel;
    }
    
    setupEventListeners() {
        // Keyboard shortcut to toggle character panel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'C' || e.key === 'c') {
                this.toggle();
            }
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target)) {
                this.close();
            }
        });
    }
    
    setupSocketEvents() {
        // Character data updates
        this.game.socket.on('characterDataUpdate', (data) => {
            this.updateCharacterData(data);
        });
        
        // Level up
        this.game.socket.on('levelUp', (data) => {
            this.handleLevelUp(data);
        });
        
        // Stats update
        this.game.socket.on('playerStatsUpdate', (data) => {
            this.updateStats(data);
        });
        
        // Combat record updates
        this.game.socket.on('combatRecordUpdate', (data) => {
            this.updateCombatRecord(data);
        });
    }
    
    switchTab(tabId) {
        if (this.currentTab === tabId) return;
        
        // Update tab buttons
        for (const [id, button] of Object.entries(this.tabs)) {
            if (id === tabId) {
                button.style.background = 'rgba(52, 152, 219, 0.3)';
                button.style.color = '#3498db';
                button.style.borderBottom = '2px solid #3498db';
            } else {
                button.style.background = 'transparent';
                button.style.color = '#bdc3c7';
                button.style.borderBottom = 'none';
            }
        }
        
        // Update panels
        for (const [id, panel] of Object.entries(this.panels)) {
            panel.style.display = id === tabId ? 'block' : 'none';
        }
        
        this.currentTab = tabId;
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
        this.requestCharacterData();
    }
    
    close() {
        this.isOpen = false;
        this.container.style.display = 'none';
    }
    
    requestCharacterData() {
        this.game.socket.emit('requestCharacterData');
    }
    
    updateCharacterData(data) {
        if (data.level) this.character.level = data.level;
        if (data.gearScore) this.character.gearScore = data.gearScore;
        if (data.attributes) this.character.attributes = { ...this.character.attributes, ...data.attributes };
        if (data.stats) this.character.stats = { ...this.character.stats, ...data.stats };
        if (data.combat) this.character.combat = { ...this.character.combat, ...data.combat };
        
        this.renderCharacterData();
    }
    
    updateStats(data) {
        this.character.stats = { ...this.character.stats, ...data };
        this.renderStats();
    }
    
    updateCombatRecord(data) {
        this.character.combat = { ...this.character.combat, ...data };
        this.renderCombatStats();
    }
    
    handleLevelUp(data) {
        this.character.level = data.newLevel;
        if (data.stats) {
            this.character.stats = { ...this.character.stats, ...data.stats };
        }
        
        this.renderCharacterData();
        this.showNotification(`Parabéns! Você alcançou nível ${data.newLevel}!`, 'success');
    }
    
    renderCharacterData() {
        this.renderHeader();
        this.renderAttributes();
        this.renderStats();
        this.renderCombatStats();
    }
    
    renderHeader() {
        // Update level
        const levelElement = document.getElementById('character-level');
        if (levelElement) {
            levelElement.textContent = `Nível ${this.character.level}`;
        }
        
        // Update gear score
        const gearScoreElement = document.getElementById('gear-score');
        if (gearScoreElement) {
            gearScoreElement.textContent = `GS: ${this.character.gearScore}`;
        }
    }
    
    renderAttributes() {
        for (const [attr, value] of Object.entries(this.character.attributes)) {
            const element = document.getElementById(`attr-${attr}`);
            if (element) {
                element.textContent = value;
            }
        }
    }
    
    renderStats() {
        const combatStats = [
            { key: 'health', format: (v) => `${v}/${this.character.stats.maxHealth}` },
            { key: 'mana', format: (v) => `${v}/${this.character.stats.maxMana}` },
            { key: 'attack', format: (v) => v.toString() },
            { key: 'defense', format: (v) => v.toString() },
            { key: 'critChance', format: (v) => `${(v * 100).toFixed(1)}%` },
            { key: 'critDamage', format: (v) => `${v.toFixed(1)}x` }
        ];
        
        for (const stat of combatStats) {
            const element = document.getElementById(`stat-${stat.key}`);
            if (element) {
                element.textContent = stat.format(this.character.stats[stat.key]);
            }
        }
    }
    
    renderCombatStats() {
        const combatStats = [
            'totalDamage', 'totalKills', 'totalDeaths', 'pvpKills', 'pvpDeaths'
        ];
        
        for (const stat of combatStats) {
            const element = document.getElementById(`combat-${stat}`);
            if (element) {
                element.textContent = (this.character.combat[stat] || 0).toLocaleString();
            }
        }
        
        // Update K/D ratio
        const kdrElement = document.getElementById('combat-kdr');
        if (kdrElement) {
            const kills = this.character.combat.totalKills || 0;
            const deaths = this.character.combat.totalDeaths || 0;
            const kdr = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
            kdrElement.textContent = kdr;
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1003;
            animation: slideInDown 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutUp 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
            error: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            info: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            warning: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
        };
        return colors[type] || colors.info;
    }
    
    // Public API
    updateAttribute(attr, value) {
        this.character.attributes[attr] = value;
        this.renderAttributes();
    }
    
    getAttribute(attr) {
        return this.character.attributes[attr];
    }
    
    // Cleanup
    cleanup() {
        if (this.container) this.container.remove();
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideOutUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
    
    .character-panel::-webkit-scrollbar {
        width: 8px;
    }
    
    .character-panel::-webkit-scrollbar-track {
        background: rgba(44, 62, 80, 0.3);
        border-radius: 4px;
    }
    
    .character-panel::-webkit-scrollbar-thumb {
        background: #34495e;
        border-radius: 4px;
    }
    
    .character-panel::-webkit-scrollbar-thumb:hover {
        background: #4a5f7f;
    }
`;
document.head.appendChild(style);

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterPanel;
} else {
    window.CharacterPanel = CharacterPanel;
}
