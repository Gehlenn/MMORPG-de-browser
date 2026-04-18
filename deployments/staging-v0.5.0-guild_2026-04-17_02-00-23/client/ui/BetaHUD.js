/**
 * Beta HUD Interface - Sistema de Interface Completo
 * Interface otimizada para beta com todos os sistemas integrados
 * Version 1.0.0 - Beta Ready
 */

class BetaHUD {
    constructor() {
        this.elements = {};
        this.playerState = null;
        this.inventory = null;
        this.skills = null;
        this.quests = null;
        this.chat = null;
        this.minimap = null;
        this.notifications = [];
        this.isInitialized = false;
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎨 Inicializando Beta HUD v1.0.0');
        
        // Criar estrutura HTML
        this.createHUDStructure();
        
        // Inicializar componentes
        this.initializeComponents();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Iniciar atualizações
        this.startUpdateLoop();
        
        this.isInitialized = true;
        console.log('✅ Beta HUD inicializado com sucesso');
    }
    
    createHUDStructure() {
        // Container principal
        const hudContainer = document.createElement('div');
        hudContainer.id = 'betaHUD';
        hudContainer.className = 'beta-hud';
        hudContainer.innerHTML = `
            <!-- Barra Superior -->
            <div class="hud-top-bar">
                <div class="player-info">
                    <div class="player-name" id="playerName">Player</div>
                    <div class="player-level" id="playerLevel">Lv. 1</div>
                    <div class="player-class" id="playerClass">Warrior</div>
                </div>
                
                <div class="stats-bars">
                    <div class="health-bar-container">
                        <div class="stat-label">HP</div>
                        <div class="health-bar">
                            <div class="health-fill" id="healthFill"></div>
                            <div class="health-text" id="healthText">100/100</div>
                        </div>
                    </div>
                    
                    <div class="mana-bar-container">
                        <div class="stat-label">MP</div>
                        <div class="mana-bar">
                            <div class="mana-fill" id="manaFill"></div>
                            <div class="mana-text" id="manaText">50/50</div>
                        </div>
                    </div>
                    
                    <div class="exp-bar-container">
                        <div class="stat-label">EXP</div>
                        <div class="exp-bar">
                            <div class="exp-fill" id="expFill"></div>
                            <div class="exp-text" id="expText">0/100</div>
                        </div>
                    </div>
                </div>
                
                <div class="resources">
                    <div class="gold-display">
                        <span class="gold-icon">💰</span>
                        <span id="goldAmount">0</span>
                    </div>
                    <div class="fragments-display">
                        <span class="fragment-icon">💎</span>
                        <span id="fragmentAmount">0</span>
                    </div>
                </div>
            </div>
            
            <!-- Barra de Skills -->
            <div class="skills-bar">
                <div class="skills-container" id="skillsContainer">
                    <!-- Skills serão adicionadas dinamicamente -->
                </div>
                <div class="skill-points-display">
                    <span>Skill Points: <span id="skillPoints">0</span></span>
                </div>
            </div>
            
            <!-- Área Principal -->
            <div class="hud-main-area">
                <!-- Minimapa -->
                <div class="minimap-container">
                    <canvas id="minimap" width="150" height="150"></canvas>
                    <div class="minimap-overlay">
                        <div class="minimap-title">Aethelgard</div>
                        <div class="minimap-coords" id="minimapCoords">X:0 Y:0</div>
                    </div>
                </div>
                
                <!-- Chat -->
                <div class="chat-container">
                    <div class="chat-header">
                        <span>Chat</span>
                        <div class="chat-tabs">
                            <button class="chat-tab active" data-channel="global">Global</button>
                            <button class="chat-tab" data-channel="guild">Guild</button>
                            <button class="chat-tab" data-channel="party">Party</button>
                        </div>
                    </div>
                    <div class="chat-messages" id="chatMessages">
                        <div class="chat-message system">Bem-vindo ao mundo de Aethelgard!</div>
                    </div>
                    <div class="chat-input-container">
                        <input type="text" id="chatInput" placeholder="Digite sua mensagem..." maxlength="100">
                        <button id="chatSend">Enviar</button>
                    </div>
                </div>
                
                <!-- Quests -->
                <div class="quests-container">
                    <div class="quests-header">
                        <span>Missões</span>
                        <button id="toggleQuests">▼</button>
                    </div>
                    <div class="quests-list" id="questsList">
                        <!-- Quests serão adicionadas dinamicamente -->
                    </div>
                </div>
            </div>
            
            <!-- Barra Lateral -->
            <div class="hud-side-bar">
                <!-- Inventário -->
                <div class="inventory-container">
                    <div class="inventory-header">
                        <span>Inventário</span>
                        <button id="toggleInventory">▼</button>
                    </div>
                    <div class="inventory-grid" id="inventoryGrid">
                        <!-- Grid de inventário -->
                    </div>
                </div>
                
                <!-- Status -->
                <div class="status-container">
                    <div class="status-header">
                        <span>Status</span>
                    </div>
                    <div class="status-stats">
                        <div class="stat-row">
                            <span>Força:</span>
                            <span id="statStrength">10</span>
                        </div>
                        <div class="stat-row">
                            <span>Destreza:</span>
                            <span id="statDexterity">10</span>
                        </div>
                        <div class="stat-row">
                            <span>Inteligência:</span>
                            <span id="statIntelligence">10</span>
                        </div>
                        <div class="stat-row">
                            <span>Agilidade:</span>
                            <span id="statAgility">10</span>
                        </div>
                        <div class="stat-row">
                            <span>Vitalidade:</span>
                            <span id="statVitality">10</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Notificações -->
            <div class="notifications-container" id="notificationsContainer">
                <!-- Notificações aparecerão aqui -->
            </div>
            
            <!-- Debug Info -->
            <div class="debug-info" id="debugInfo" style="display: none;">
                <div>FPS: <span id="debugFPS">60</span></div>
                <div>Position: <span id="debugPosition">0,0</span></div>
                <div>Mobs: <span id="debugMobs">0</span></div>
                <div>Entities: <span id="debugEntities">0</span></div>
            </div>
        `;
        
        // Adicionar ao body
        document.body.appendChild(hudContainer);
        
        // Adicionar CSS
        this.addHUDStyles();
    }
    
    addHUDStyles() {
        const styles = `
            .beta-hud {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                z-index: 1000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .beta-hud > * {
                pointer-events: auto;
            }
            
            /* Barra Superior */
            .hud-top-bar {
                position: absolute;
                top: 10px;
                left: 10px;
                right: 10px;
                background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9));
                border: 2px solid #444;
                border-radius: 8px;
                padding: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                backdrop-filter: blur(5px);
            }
            
            .player-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .player-name {
                color: #fff;
                font-weight: bold;
                font-size: 16px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            }
            
            .player-level {
                color: #4CAF50;
                font-size: 14px;
                font-weight: bold;
            }
            
            .player-class {
                color: #2196F3;
                font-size: 12px;
            }
            
            .stats-bars {
                display: flex;
                gap: 20px;
                flex: 1;
                margin: 0 20px;
            }
            
            .health-bar-container,
            .mana-bar-container,
            .exp-bar-container {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .stat-label {
                color: #fff;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .health-bar,
            .mana-bar,
            .exp-bar {
                width: 150px;
                height: 20px;
                background: rgba(0,0,0,0.5);
                border: 1px solid #444;
                border-radius: 10px;
                position: relative;
                overflow: hidden;
            }
            
            .health-fill {
                height: 100%;
                background: linear-gradient(90deg, #f44336, #ff6b6b);
                transition: width 0.3s ease;
                border-radius: 8px;
            }
            
            .mana-fill {
                height: 100%;
                background: linear-gradient(90deg, #2196F3, #64b5f6);
                transition: width 0.3s ease;
                border-radius: 8px;
            }
            
            .exp-fill {
                height: 100%;
                background: linear-gradient(90deg, #FF9800, #ffb74d);
                transition: width 0.3s ease;
                border-radius: 8px;
            }
            
            .health-text,
            .mana-text,
            .exp-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #fff;
                font-size: 10px;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            }
            
            .resources {
                display: flex;
                gap: 15px;
                align-items: center;
            }
            
            .gold-display,
            .fragments-display {
                display: flex;
                align-items: center;
                gap: 5px;
                color: #fff;
                font-weight: bold;
            }
            
            .gold-icon,
            .fragment-icon {
                font-size: 16px;
            }
            
            /* Barra de Skills */
            .skills-bar {
                position: absolute;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9));
                border: 2px solid #444;
                border-radius: 8px;
                padding: 10px;
                display: flex;
                gap: 10px;
                align-items: center;
                backdrop-filter: blur(5px);
            }
            
            .skills-container {
                display: flex;
                gap: 5px;
            }
            
            .skill-slot {
                width: 50px;
                height: 50px;
                background: rgba(0,0,0,0.5);
                border: 2px solid #555;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .skill-slot:hover {
                border-color: #4CAF50;
                transform: scale(1.1);
            }
            
            .skill-slot.active {
                border-color: #2196F3;
                box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
            }
            
            .skill-slot.on-cooldown {
                opacity: 0.5;
                border-color: #666;
            }
            
            .skill-icon {
                font-size: 24px;
            }
            
            .skill-cooldown {
                position: absolute;
                bottom: 2px;
                right: 2px;
                background: rgba(0,0,0,0.8);
                color: #fff;
                font-size: 10px;
                padding: 2px 4px;
                border-radius: 4px;
            }
            
            .skill-hotkey {
                position: absolute;
                top: 2px;
                left: 2px;
                background: rgba(0,0,0,0.8);
                color: #fff;
                font-size: 8px;
                padding: 1px 3px;
                border-radius: 2px;
            }
            
            .skill-points-display {
                color: #4CAF50;
                font-size: 12px;
                font-weight: bold;
            }
            
            /* Área Principal */
            .hud-main-area {
                position: absolute;
                top: 80px;
                left: 10px;
                width: 300px;
            }
            
            /* Minimapa */
            .minimap-container {
                position: relative;
                margin-bottom: 10px;
            }
            
            #minimap {
                border: 2px solid #444;
                border-radius: 8px;
                background: rgba(0,0,0,0.8);
            }
            
            .minimap-overlay {
                position: absolute;
                top: 5px;
                left: 5px;
                color: #fff;
                font-size: 10px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            }
            
            .minimap-title {
                font-weight: bold;
            }
            
            .minimap-coords {
                font-size: 8px;
                color: #aaa;
            }
            
            /* Chat */
            .chat-container {
                background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9));
                border: 2px solid #444;
                border-radius: 8px;
                margin-bottom: 10px;
                overflow: hidden;
            }
            
            .chat-header {
                background: rgba(0,0,0,0.5);
                padding: 5px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #444;
            }
            
            .chat-header span {
                color: #fff;
                font-weight: bold;
                font-size: 12px;
            }
            
            .chat-tabs {
                display: flex;
                gap: 2px;
            }
            
            .chat-tab {
                background: rgba(255,255,255,0.1);
                border: 1px solid #555;
                color: #fff;
                padding: 2px 8px;
                font-size: 10px;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.3s ease;
            }
            
            .chat-tab:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .chat-tab.active {
                background: #2196F3;
                border-color: #2196F3;
            }
            
            .chat-messages {
                height: 150px;
                overflow-y: auto;
                padding: 5px;
            }
            
            .chat-message {
                margin-bottom: 2px;
                font-size: 11px;
                word-wrap: break-word;
            }
            
            .chat-message.system {
                color: #4CAF50;
                font-style: italic;
            }
            
            .chat-message.global {
                color: #fff;
            }
            
            .chat-message.guild {
                color: #2196F3;
            }
            
            .chat-message.party {
                color: #4CAF50;
            }
            
            .chat-message .author {
                font-weight: bold;
                margin-right: 5px;
            }
            
            .chat-input-container {
                display: flex;
                padding: 5px;
                border-top: 1px solid #444;
            }
            
            #chatInput {
                flex: 1;
                background: rgba(255,255,255,0.1);
                border: 1px solid #555;
                color: #fff;
                padding: 5px;
                font-size: 11px;
                border-radius: 4px;
            }
            
            #chatSend {
                background: #2196F3;
                color: #fff;
                border: none;
                padding: 5px 10px;
                font-size: 11px;
                border-radius: 4px;
                cursor: pointer;
                margin-left: 5px;
            }
            
            #chatSend:hover {
                background: #1976D2;
            }
            
            /* Quests */
            .quests-container {
                background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9));
                border: 2px solid #444;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .quests-header {
                background: rgba(0,0,0,0.5);
                padding: 5px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #444;
            }
            
            .quests-header span {
                color: #fff;
                font-weight: bold;
                font-size: 12px;
            }
            
            #toggleQuests {
                background: none;
                border: none;
                color: #fff;
                cursor: pointer;
                font-size: 12px;
            }
            
            .quests-list {
                max-height: 200px;
                overflow-y: auto;
                padding: 5px;
            }
            
            .quest-item {
                background: rgba(255,255,255,0.05);
                border: 1px solid #555;
                border-radius: 4px;
                padding: 8px;
                margin-bottom: 5px;
            }
            
            .quest-title {
                color: #FF9800;
                font-weight: bold;
                font-size: 11px;
                margin-bottom: 2px;
            }
            
            .quest-description {
                color: #ccc;
                font-size: 10px;
                margin-bottom: 4px;
            }
            
            .quest-progress {
                color: #4CAF50;
                font-size: 10px;
            }
            
            .quest-rewards {
                color: #2196F3;
                font-size: 10px;
                margin-top: 4px;
            }
            
            /* Barra Lateral */
            .hud-side-bar {
                position: absolute;
                top: 80px;
                right: 10px;
                width: 200px;
            }
            
            /* Inventário */
            .inventory-container {
                background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9));
                border: 2px solid #444;
                border-radius: 8px;
                margin-bottom: 10px;
                overflow: hidden;
            }
            
            .inventory-header {
                background: rgba(0,0,0,0.5);
                padding: 5px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #444;
            }
            
            .inventory-header span {
                color: #fff;
                font-weight: bold;
                font-size: 12px;
            }
            
            #toggleInventory {
                background: none;
                border: none;
                color: #fff;
                cursor: pointer;
                font-size: 12px;
            }
            
            .inventory-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 2px;
                padding: 5px;
            }
            
            .inventory-slot {
                width: 40px;
                height: 40px;
                background: rgba(255,255,255,0.05);
                border: 1px solid #555;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                position: relative;
            }
            
            .inventory-slot:hover {
                border-color: #4CAF50;
                background: rgba(76, 175, 80, 0.1);
            }
            
            .item-icon {
                font-size: 20px;
            }
            
            .item-quantity {
                position: absolute;
                bottom: 2px;
                right: 2px;
                background: rgba(0,0,0,0.8);
                color: #fff;
                font-size: 8px;
                padding: 1px 3px;
                border-radius: 2px;
            }
            
            /* Status */
            .status-container {
                background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9));
                border: 2px solid #444;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .status-header {
                background: rgba(0,0,0,0.5);
                padding: 5px;
                border-bottom: 1px solid #444;
            }
            
            .status-header span {
                color: #fff;
                font-weight: bold;
                font-size: 12px;
            }
            
            .status-stats {
                padding: 5px;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                color: #fff;
                font-size: 11px;
                margin-bottom: 2px;
            }
            
            .stat-row span:first-child {
                color: #ccc;
            }
            
            .stat-row span:last-child {
                font-weight: bold;
                color: #4CAF50;
            }
            
            /* Notificações */
            .notifications-container {
                position: absolute;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                pointer-events: none;
                z-index: 2000;
            }
            
            .notification {
                background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(20,20,20,0.95));
                border: 2px solid #444;
                border-radius: 8px;
                padding: 10px 20px;
                margin-bottom: 5px;
                color: #fff;
                font-size: 12px;
                text-align: center;
                animation: slideDown 0.3s ease;
                pointer-events: auto;
            }
            
            .notification.success {
                border-color: #4CAF50;
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(76, 175, 80, 0.95));
            }
            
            .notification.warning {
                border-color: #FF9800;
                background: linear-gradient(135deg, rgba(255, 152, 0, 0.9), rgba(255, 152, 0, 0.95));
            }
            
            .notification.error {
                border-color: #f44336;
                background: linear-gradient(135deg, rgba(244, 67, 54, 0.9), rgba(244, 67, 54, 0.95));
            }
            
            .notification.info {
                border-color: #2196F3;
                background: linear-gradient(135deg, rgba(33, 150, 243, 0.9), rgba(33, 150, 243, 0.95));
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Debug Info */
            .debug-info {
                position: absolute;
                top: 10px;
                right: 220px;
                background: rgba(0,0,0,0.8);
                border: 1px solid #444;
                border-radius: 4px;
                padding: 5px;
                color: #0f0;
                font-family: monospace;
                font-size: 10px;
            }
            
            .debug-info div {
                margin-bottom: 2px;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    initializeComponents() {
        // Obter referências aos elementos
        this.elements = {
            // Player info
            playerName: document.getElementById('playerName'),
            playerLevel: document.getElementById('playerLevel'),
            playerClass: document.getElementById('playerClass'),
            
            // Stats bars
            healthFill: document.getElementById('healthFill'),
            healthText: document.getElementById('healthText'),
            manaFill: document.getElementById('manaFill'),
            manaText: document.getElementById('manaText'),
            expFill: document.getElementById('expFill'),
            expText: document.getElementById('expText'),
            
            // Resources
            goldAmount: document.getElementById('goldAmount'),
            fragmentAmount: document.getElementById('fragmentAmount'),
            
            // Skills
            skillsContainer: document.getElementById('skillsContainer'),
            skillPoints: document.getElementById('skillPoints'),
            
            // Minimap
            minimap: document.getElementById('minimap'),
            minimapCoords: document.getElementById('minimapCoords'),
            
            // Chat
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),
            chatSend: document.getElementById('chatSend'),
            
            // Quests
            questsList: document.getElementById('questsList'),
            toggleQuests: document.getElementById('toggleQuests'),
            
            // Inventory
            inventoryGrid: document.getElementById('inventoryGrid'),
            toggleInventory: document.getElementById('toggleInventory'),
            
            // Status
            statStrength: document.getElementById('statStrength'),
            statDexterity: document.getElementById('statDexterity'),
            statIntelligence: document.getElementById('statIntelligence'),
            statAgility: document.getElementById('statAgility'),
            statVitality: document.getElementById('statVitality'),
            
            // Notifications
            notificationsContainer: document.getElementById('notificationsContainer'),
            
            // Debug
            debugFPS: document.getElementById('debugFPS'),
            debugPosition: document.getElementById('debugPosition'),
            debugMobs: document.getElementById('debugMobs'),
            debugEntities: document.getElementById('debugEntities')
        };
        
        // Inicializar inventário
        this.initializeInventory();
        
        // Inicializar skills
        this.initializeSkills();
    }
    
    initializeInventory() {
        // Criar grid de inventário (20 slots)
        for (let i = 0; i < 20; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            
            slot.addEventListener('click', () => this.handleInventoryClick(i));
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleInventoryRightClick(i);
            });
            
            this.elements.inventoryGrid.appendChild(slot);
        }
    }
    
    initializeSkills() {
        // Criar 10 slots de skills
        for (let i = 0; i < 10; i++) {
            const slot = document.createElement('div');
            slot.className = 'skill-slot';
            slot.dataset.slot = i;
            
            const hotkey = document.createElement('div');
            hotkey.className = 'skill-hotkey';
            hotkey.textContent = i < 9 ? i + 1 : '0';
            
            const icon = document.createElement('div');
            icon.className = 'skill-icon';
            icon.textContent = '?';
            
            const cooldown = document.createElement('div');
            cooldown.className = 'skill-cooldown';
            cooldown.style.display = 'none';
            
            slot.appendChild(hotkey);
            slot.appendChild(icon);
            slot.appendChild(cooldown);
            
            slot.addEventListener('click', () => this.handleSkillClick(i));
            
            this.elements.skillsContainer.appendChild(slot);
        }
    }
    
    setupEventListeners() {
        // Chat
        this.elements.chatSend.addEventListener('click', () => this.sendChatMessage());
        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        
        // Chat tabs
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchChatChannel(e.target.dataset.channel));
        });
        
        // Toggle buttons
        this.elements.toggleQuests.addEventListener('click', () => this.toggleQuests());
        this.elements.toggleInventory.addEventListener('click', () => this.toggleInventory());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    handleKeyPress(e) {
        // Skill hotkeys (1-0)
        if (e.key >= '1' && e.key <= '9') {
            const slotIndex = parseInt(e.key) - 1;
            this.handleSkillClick(slotIndex);
        } else if (e.key === '0') {
            this.handleSkillClick(9);
        }
        
        // Debug toggle
        if (e.key === 'F1') {
            this.toggleDebug();
        }
        
        // Chat focus
        if (e.key === 'Enter' && document.activeElement !== this.elements.chatInput) {
            this.elements.chatInput.focus();
        }
        
        // Chat unfocus
        if (e.key === 'Escape' && document.activeElement === this.elements.chatInput) {
            this.elements.chatInput.blur();
        }
    }
    
    handleSkillClick(slotIndex) {
        if (!this.elements.skillsContainer || !this.elements.skillsContainer.children) {
            console.warn('⚠️ Skills container não encontrado');
            return;
        }
        
        const slot = this.elements.skillsContainer.children[slotIndex];
        if (!slot) {
            console.warn('⚠️ Slot não encontrado:', slotIndex);
            return;
        }
        
        const skill = this.skills && this.skills[slotIndex];
        
        if (skill && window.gameplayEngine) {
            window.gameplayEngine.useSkill(slotIndex);
            this.addNotification(`Usando skill: ${skill.name}`, 'info');
        } else {
            console.warn('⚠️ Skill ou gameplayEngine não encontrado');
        }
    }
    
    handleInventoryClick(slotIndex) {
        const item = this.inventory[slotIndex];
        if (item) {
            this.addNotification(`Item selecionado: ${item.name}`, 'info');
            // Implementar lógica de uso de item
        }
    }
    
    handleInventoryRightClick(slotIndex) {
        const item = this.inventory[slotIndex];
        if (item) {
            this.addNotification(`Menu de contexto para: ${item.name}`, 'info');
            // Implementar menu de contexto
        }
    }
    
    sendChatMessage() {
        const message = this.elements.chatInput.value.trim();
        if (message) {
            this.addChatMessage('global', this.playerState?.name || 'Player', message);
            this.elements.chatInput.value = '';
            
            // Enviar para servidor se disponível
            if (window.gameplayEngine && window.gameplayEngine.socket) {
                window.gameplayEngine.socket.emit('chat_message', {
                    channel: 'global',
                    message: message
                });
            }
        }
    }
    
    switchChatChannel(channel) {
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-channel="${channel}"]`).classList.add('active');
        
        this.currentChatChannel = channel;
        this.addNotification(`Canal de chat: ${channel}`, 'info');
    }
    
    toggleQuests() {
        const questsList = this.elements.questsList;
        const toggle = this.elements.toggleQuests;
        
        if (questsList.style.display === 'none') {
            questsList.style.display = 'block';
            toggle.textContent = '▼';
        } else {
            questsList.style.display = 'none';
            toggle.textContent = '▶';
        }
    }
    
    toggleInventory() {
        const inventoryGrid = this.elements.inventoryGrid;
        const toggle = this.elements.toggleInventory;
        
        if (inventoryGrid.style.display === 'none') {
            inventoryGrid.style.display = 'grid';
            toggle.textContent = '▼';
        } else {
            inventoryGrid.style.display = 'none';
            toggle.textContent = '▶';
        }
    }
    
    toggleDebug() {
        const debugInfo = document.getElementById('debugInfo');
        debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
    }
    
    startUpdateLoop() {
        setInterval(() => {
            this.updateDebugInfo();
        }, 1000);
    }
    
    updateDebugInfo() {
        if (!window.gameplayEngine) return;
        
        const player = window.gameplayEngine.getPlayer();
        const mobs = window.gameplayEngine.getMobs();
        const entities = window.gameplayEngine.getEntities();
        
        if (this.elements.debugFPS) {
            this.elements.debugFPS.textContent = window.gameplayEngine.actualFPS || 60;
        }
        
        if (this.elements.debugPosition && player) {
            this.elements.debugPosition.textContent = `${Math.round(player.x)},${Math.round(player.y)}`;
        }
        
        if (this.elements.debugMobs) {
            this.elements.debugMobs.textContent = mobs.length;
        }
        
        if (this.elements.debugEntities) {
            this.elements.debugEntities.textContent = entities.length;
        }
    }
    
    // Métodos de atualização
    updatePlayerState(playerState) {
        this.playerState = playerState;
        
        // Atualizar informações básicas
        if (this.elements.playerName) this.elements.playerName.textContent = playerState.name || 'Player';
        if (this.elements.playerLevel) this.elements.playerLevel.textContent = `Lv. ${playerState.level || 1}`;
        if (this.elements.playerClass) this.elements.playerClass.textContent = playerState.class || 'Warrior';
        
        // Atualizar barras de status
        this.updateHealthBar(playerState.health || 100, playerState.maxHealth || 100);
        this.updateManaBar(playerState.mana || 50, playerState.maxMana || 50);
        this.updateExpBar(playerState.exp || 0, playerState.maxExp || 100);
        
        // Atualizar recursos
        if (this.elements.goldAmount) this.elements.goldAmount.textContent = playerState.gold || 0;
        if (this.elements.fragmentAmount) this.elements.fragmentAmount.textContent = playerState.fragments || 0;
        
        // Atualizar status
        this.updateStats(playerState);
        
        // Atualizar minimapa
        this.updateMinimap(playerState.position);
    }
    
    updateHealthBar(current, max) {
        const percentage = (current / max) * 100;
        if (this.elements.healthFill) this.elements.healthFill.style.width = `${percentage}%`;
        if (this.elements.healthText) this.elements.healthText.textContent = `${current}/${max}`;
    }
    
    updateManaBar(current, max) {
        const percentage = (current / max) * 100;
        if (this.elements.manaFill) this.elements.manaFill.style.width = `${percentage}%`;
        if (this.elements.manaText) this.elements.manaText.textContent = `${current}/${max}`;
    }
    
    updateExpBar(current, max) {
        const percentage = (current / max) * 100;
        if (this.elements.expFill) this.elements.expFill.style.width = `${percentage}%`;
        if (this.elements.expText) this.elements.expText.textContent = `${current}/${max}`;
    }
    
    updateStats(playerState) {
        if (this.elements.statStrength) this.elements.statStrength.textContent = playerState.strength || 10;
        if (this.elements.statDexterity) this.elements.statDexterity.textContent = playerState.dexterity || 10;
        if (this.elements.statIntelligence) this.elements.statIntelligence.textContent = playerState.intelligence || 10;
        if (this.elements.statAgility) this.elements.statAgility.textContent = playerState.agility || 10;
        if (this.elements.statVitality) this.elements.statVitality.textContent = playerState.vitality || 10;
    }
    
    updateMinimap(position) {
        if (!position || !this.elements.minimapCoords) return;
        
        this.elements.minimapCoords.textContent = `X:${Math.round(position.x)} Y:${Math.round(position.y)}`;
    }
    
    updateInventory(inventory) {
        this.inventory = inventory || [];
        
        // Limpar slots
        Array.from(this.elements.inventoryGrid.children).forEach(slot => {
            slot.innerHTML = '';
            slot.dataset.itemId = '';
        });
        
        // Preencher com itens
        this.inventory.forEach((item, index) => {
            if (index < 20) {
                const slot = this.elements.inventoryGrid.children[index];
                slot.dataset.itemId = item.id;
                
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                icon.textContent = item.icon || '📦';
                
                if (item.quantity > 1) {
                    const quantity = document.createElement('div');
                    quantity.className = 'item-quantity';
                    quantity.textContent = item.quantity;
                    slot.appendChild(quantity);
                }
                
                slot.appendChild(icon);
            }
        });
    }
    
    updateSkills(skills) {
        this.skills = skills || [];
        
        // Limpar slots
        Array.from(this.elements.skillsContainer.children).forEach(slot => {
            const icon = slot.querySelector('.skill-icon');
            icon.textContent = '?';
            slot.dataset.skillId = '';
            slot.classList.remove('active', 'on-cooldown');
        });
        
        // Preencher com skills
        this.skills.forEach((skill, index) => {
            if (index < 10) {
                const slot = this.elements.skillsContainer.children[index];
                slot.dataset.skillId = skill.id;
                
                const icon = slot.querySelector('.skill-icon');
                icon.textContent = skill.icon || '⚔️';
                
                if (skill.active) {
                    slot.classList.add('active');
                }
                
                if (skill.cooldown > 0) {
                    slot.classList.add('on-cooldown');
                    const cooldown = slot.querySelector('.skill-cooldown');
                    cooldown.style.display = 'block';
                    cooldown.textContent = Math.ceil(skill.cooldown);
                }
            }
        });
        
        // Atualizar skill points
        if (this.elements.skillPoints) {
            this.elements.skillPoints.textContent = this.playerState?.skillPoints || 0;
        }
    }
    
    updateQuests(quests) {
        this.quests = quests || [];
        
        // Limpar lista
        this.elements.questsList.innerHTML = '';
        
        // Adicionar quests
        this.quests.forEach(quest => {
            const questElement = document.createElement('div');
            questElement.className = 'quest-item';
            
            questElement.innerHTML = `
                <div class="quest-title">${quest.name}</div>
                <div class="quest-description">${quest.description}</div>
                <div class="quest-progress">Progresso: ${quest.progress || 0}/${quest.target || 1}</div>
                <div class="quest-rewards">Recompensa: ${quest.reward ? `${quest.reward.gold || 0} gold, ${quest.reward.exp || 0} exp` : 'Nenhuma'}</div>
            `;
            
            this.elements.questsList.appendChild(questElement);
        });
    }
    
    addChatMessage(channel, author, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${channel}`;
        messageElement.innerHTML = `<span class="author">${author}:</span> ${message}`;
        
        this.elements.chatMessages.appendChild(messageElement);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // Limitar número de mensagens
        while (this.elements.chatMessages.children.length > 100) {
            this.elements.chatMessages.removeChild(this.elements.chatMessages.firstChild);
        }
    }
    
    addNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.elements.notificationsContainer.appendChild(notification);
        
        // Auto-remover
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }
    
    // Métodos públicos
    showNotification(message, type = 'info', duration = 3000) {
        this.addNotification(message, type, duration);
    }
    
    updatePlayerInfo(playerData) {
        this.updatePlayerState(playerData);
    }
    
    updatePlayerInventory(inventory) {
        this.updateInventory(inventory);
    }
    
    updatePlayerSkills(skills) {
        this.updateSkills(skills);
    }
    
    updatePlayerQuests(quests) {
        this.updateQuests(quests);
    }
}

// Exportar para uso global
window.BetaHUD = BetaHUD;
