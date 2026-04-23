/**
 * DungeonUI - Interface de Dungeons e Instâncias
 * 
 * Features:
 * - Lista de dungeons disponíveis (Solo, Group, Raid)
 * - Requisitos e informações de cada dungeon
 * - Entrada solo ou em grupo
 * - Progresso da dungeon atual
 * - Sistema de matchmaking para dungeons em grupo
 */

class DungeonUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.selectedDungeon = null;
        this.currentInstance = null;
        this.dungeonTypes = ['solo', 'group', 'raid'];
        this.activeTab = 'solo';
        
        // Definições das dungeons
        this.DUNGEONS = {
            solo: [
                {
                    id: 'mines_of_sorrow',
                    name: 'Minas da Tristeza',
                    description: 'Minas abandonadas infestadas de goblins e criaturas das trevas.',
                    level: 10,
                    minLevel: 8,
                    maxPlayers: 1,
                    difficulty: 'easy',
                    duration: '15-20 min',
                    icon: '⛏️',
                    color: '#8B4513',
                    rewards: {
                        xp: 500,
                        gold: 50,
                        items: ['Rusty Pickaxe', 'Miner\'s Helmet']
                    }
                },
                {
                    id: 'forgotten_crypt',
                    name: 'Cripta Esquecida',
                    description: 'Uma antiga cripta com esqueletos e fantasmas vingativos.',
                    level: 20,
                    minLevel: 18,
                    maxPlayers: 1,
                    difficulty: 'medium',
                    duration: '20-30 min',
                    icon: '💀',
                    color: '#4B0082',
                    rewards: {
                        xp: 1200,
                        gold: 120,
                        items: ['Bone Staff', 'Spectral Cloak']
                    }
                },
                {
                    id: 'crystal_caverns',
                    name: 'Cavernas de Cristal',
                    description: 'Cavernas brilhantes protegidas por golems de cristal.',
                    level: 35,
                    minLevel: 32,
                    maxPlayers: 1,
                    difficulty: 'hard',
                    duration: '30-45 min',
                    icon: '💎',
                    color: '#00CED1',
                    rewards: {
                        xp: 3000,
                        gold: 300,
                        items: ['Crystal Shard', 'Gemstone Amulet']
                    }
                },
                {
                    id: 'shadow_depths',
                    name: 'Profundezas Sombrias',
                    description: 'As profundezas mais escuras, lar de horrores indescritíveis.',
                    level: 50,
                    minLevel: 48,
                    maxPlayers: 1,
                    difficulty: 'extreme',
                    duration: '45-60 min',
                    icon: '🌑',
                    color: '#1a1a2e',
                    rewards: {
                        xp: 6000,
                        gold: 600,
                        items: ['Shadow Blade', 'Dark Mantle']
                    }
                }
            ],
            group: [
                {
                    id: 'bandit_stronghold',
                    name: 'Fortaleza dos Bandidos',
                    description: 'Uma fortaleza tomada por bandidos liderados pelo infame Capitão Rourke.',
                    level: 15,
                    minLevel: 12,
                    maxPlayers: 5,
                    minPlayers: 2,
                    difficulty: 'easy',
                    duration: '20-30 min',
                    icon: '🏰',
                    color: '#8B4513',
                    rewards: {
                        xp: 1500,
                        gold: 200,
                        items: ['Bandit Bow', 'Rourke\'s Ring']
                    },
                    boss: 'Capitão Rourke'
                },
                {
                    id: 'sunken_temple',
                    name: 'Templo Submerso',
                    description: 'Ruínas de um antigo templo agora infestado de nagas e cultistas.',
                    level: 30,
                    minLevel: 27,
                    maxPlayers: 5,
                    minPlayers: 3,
                    difficulty: 'medium',
                    duration: '30-45 min',
                    icon: '🏛️',
                    color: '#20B2AA',
                    rewards: {
                        xp: 4000,
                        gold: 500,
                        items: ['Naga Trident', 'Aqua Pearl']
                    },
                    boss: 'Naga Queen'
                },
                {
                    id: 'dragon_roost',
                    name: 'Ninho do Dragão',
                    description: 'O covil de um dragão jovem e sua ninhada de draconianos.',
                    level: 45,
                    minLevel: 42,
                    maxPlayers: 5,
                    minPlayers: 3,
                    difficulty: 'hard',
                    duration: '45-60 min',
                    icon: '🐉',
                    color: '#FF4500',
                    rewards: {
                        xp: 8000,
                        gold: 1000,
                        items: ['Dragon Scale', 'Fire Staff']
                    },
                    boss: 'Draconis'
                },
                {
                    id: 'abyssal_spire',
                    name: 'Torre Abissal',
                    description: 'Uma torre demoníaca que toca as próprias profundezas do abismo.',
                    level: 60,
                    minLevel: 58,
                    maxPlayers: 5,
                    minPlayers: 3,
                    difficulty: 'extreme',
                    duration: '60-90 min',
                    icon: '🗼',
                    color: '#DC143C',
                    rewards: {
                        xp: 15000,
                        gold: 2000,
                        items: ['Abyssal Blade', 'Demon Heart']
                    },
                    boss: 'Archdemon Malphas'
                }
            ],
            raid: [
                {
                    id: 'fortress_of_agony',
                    name: 'Fortaleza da Agonia',
                    description: 'A fortaleza de Arkazhul, Mestre da Tortura. Um desafio para os mais corajosos.',
                    level: 90,
                    minLevel: 88,
                    maxPlayers: 40,
                    minPlayers: 20,
                    difficulty: 'extreme',
                    duration: '3-4 horas',
                    icon: '🏰',
                    color: '#8B0000',
                    rewards: {
                        xp: 100000,
                        gold: 50000,
                        items: ['Arkazhul\'s Painblade', 'Torturer\'s Plate']
                    },
                    boss: 'Arkazhul',
                    phases: 6,
                    reset: '7 dias'
                },
                {
                    id: 'infernal_crucible',
                    name: 'Crisol Infernal',
                    description: 'O vulcão onde Vorthrax forja armas de destruição.',
                    level: 92,
                    minLevel: 90,
                    maxPlayers: 40,
                    minPlayers: 25,
                    difficulty: 'extreme',
                    duration: '4-5 horas',
                    icon: '🌋',
                    color: '#FF4500',
                    rewards: {
                        xp: 120000,
                        gold: 60000,
                        items: ['Vorthrax\'s Warhammer', 'Infernal Plate']
                    },
                    boss: 'Vorthrax',
                    phases: 5,
                    reset: '7 dias'
                }
            ]
        };
        
        this.DIFFICULTY_COLORS = {
            easy: '#22c55e',
            medium: '#eab308',
            hard: '#f97316',
            extreme: '#ef4444'
        };
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
    }
    
    createUI() {
        // Container principal
        this.container = document.createElement('div');
        this.container.id = 'dungeon-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 900px;
            height: 650px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #8B0000;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
            overflow: hidden;
        `;
        
        // Header
        const header = this.createHeader();
        this.container.appendChild(header);
        
        // Tabs
        const tabs = this.createTabs();
        this.container.appendChild(tabs);
        
        // Content
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            flex: 1;
            overflow: hidden;
        `;
        
        // Sidebar com lista
        this.sidebar = document.createElement('div');
        this.sidebar.style.cssText = `
            width: 350px;
            background: rgba(0, 0, 0, 0.3);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            overflow-y: auto;
            padding: 15px;
        `;
        
        content.appendChild(this.sidebar);
        
        // Main panel
        this.mainPanel = document.createElement('div');
        this.mainPanel.style.cssText = `
            flex: 1;
            padding: 25px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        content.appendChild(this.mainPanel);
        
        this.container.appendChild(content);
        
        document.body.appendChild(this.container);
        
        // Render initial state
        this.renderDungeonList();
        this.renderMainPanel();
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #8B0000, #DC143C);
            padding: 18px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '🏰 Dungeons & Raids';
        title.style.cssText = `
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.onclick = () => this.hide();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        return header;
    }
    
    createTabs() {
        const tabs = document.createElement('div');
        tabs.style.cssText = `
            display: flex;
            background: rgba(0, 0, 0, 0.4);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const tabConfigs = [
            { id: 'solo', name: '👤 Solo', description: 'Para jogadores individuais' },
            { id: 'group', name: '👥 Grupo', description: '2-5 jogadores' },
            { id: 'raid', name: '⚔️ Raid', description: '20-40 jogadores' }
        ];
        
        this.tabButtons = {};
        
        for (const tabConfig of tabConfigs) {
            const tab = document.createElement('div');
            tab.className = 'dungeon-tab';
            tab.dataset.tab = tabConfig.id;
            tab.style.cssText = `
                flex: 1;
                padding: 15px 20px;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s;
                border-bottom: 3px solid transparent;
            `;
            
            tab.innerHTML = `
                <div style="font-size: 18px; font-weight: 600;">${tabConfig.name}</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 4px;">${tabConfig.description}</div>
            `;
            
            tab.onmouseover = () => {
                if (this.activeTab !== tabConfig.id) {
                    tab.style.background = 'rgba(255, 255, 255, 0.05)';
                }
            };
            
            tab.onmouseout = () => {
                if (this.activeTab !== tabConfig.id) {
                    tab.style.background = 'transparent';
                }
            };
            
            tab.onclick = () => this.switchTab(tabConfig.id);
            
            this.tabButtons[tabConfig.id] = tab;
            tabs.appendChild(tab);
        }
        
        // Activate initial tab
        this.updateTabVisuals();
        
        return tabs;
    }
    
    switchTab(tabId) {
        this.activeTab = tabId;
        this.selectedDungeon = null;
        this.updateTabVisuals();
        this.renderDungeonList();
        this.renderMainPanel();
    }
    
    updateTabVisuals() {
        for (const [id, tab] of Object.entries(this.tabButtons)) {
            if (id === this.activeTab) {
                tab.style.background = 'rgba(139, 0, 0, 0.3)';
                tab.style.borderBottom = '3px solid #DC143C';
                tab.style.color = '#fff';
            } else {
                tab.style.background = 'transparent';
                tab.style.borderBottom = '3px solid transparent';
                tab.style.color = 'rgba(255, 255, 255, 0.7)';
            }
        }
    }
    
    renderDungeonList() {
        this.sidebar.innerHTML = '';
        
        const dungeons = this.DUNGEONS[this.activeTab] || [];
        
        if (dungeons.length === 0) {
            this.sidebar.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.5);">
                    <div style="font-size: 32px; margin-bottom: 10px;">📭</div>
                    <p>Nenhuma dungeon disponível</p>
                </div>
            `;
            return;
        }
        
        for (const dungeon of dungeons) {
            const item = this.createDungeonItem(dungeon);
            this.sidebar.appendChild(item);
        }
    }
    
    createDungeonItem(dungeon) {
        const item = document.createElement('div');
        item.className = 'dungeon-item';
        item.dataset.dungeonId = dungeon.id;
        item.style.cssText = `
            display: flex;
            align-items: center;
            padding: 15px;
            margin: 8px 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid transparent;
        `;
        
        const diffColor = this.DIFFICULTY_COLORS[dungeon.difficulty];
        
        item.onmouseover = () => {
            item.style.background = 'rgba(255, 255, 255, 0.1)';
            item.style.borderColor = diffColor;
        };
        
        item.onmouseout = () => {
            if (this.selectedDungeon?.id !== dungeon.id) {
                item.style.background = 'rgba(255, 255, 255, 0.05)';
                item.style.borderColor = 'transparent';
            }
        };
        
        item.onclick = () => this.selectDungeon(dungeon);
        
        // Icon
        const icon = document.createElement('div');
        icon.textContent = dungeon.icon;
        icon.style.cssText = `
            font-size: 36px;
            margin-right: 15px;
            filter: drop-shadow(0 0 8px ${dungeon.color});
        `;
        
        // Info
        const info = document.createElement('div');
        info.style.cssText = 'flex: 1;';
        
        const name = document.createElement('div');
        name.textContent = dungeon.name;
        name.style.cssText = `
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 4px;
        `;
        
        const meta = document.createElement('div');
        meta.style.cssText = `
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        `;
        meta.innerHTML = `
            <span style="color: ${diffColor}; font-weight: 600; text-transform: uppercase;">${dungeon.difficulty}</span> • 
            Nível ${dungeon.level}
        `;
        
        info.appendChild(name);
        info.appendChild(meta);
        
        item.appendChild(icon);
        item.appendChild(info);
        
        return item;
    }
    
    selectDungeon(dungeon) {
        this.selectedDungeon = dungeon;
        
        // Update visual selection
        document.querySelectorAll('.dungeon-item').forEach(el => {
            if (el.dataset.dungeonId === dungeon.id) {
                const diffColor = this.DIFFICULTY_COLORS[dungeon.difficulty];
                el.style.background = `rgba(220, 20, 60, 0.2)`;
                el.style.borderColor = diffColor;
            } else {
                el.style.background = 'rgba(255, 255, 255, 0.05)';
                el.style.borderColor = 'transparent';
            }
        });
        
        this.renderMainPanel();
    }
    
    renderMainPanel() {
        if (!this.selectedDungeon) {
            this.mainPanel.innerHTML = `
                <div style="text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.5);">
                    <div style="font-size: 64px; margin-bottom: 20px;">🏰</div>
                    <h3 style="margin: 0 0 10px 0; font-size: 20px;">Selecione uma Dungeon</h3>
                    <p style="margin: 0; font-size: 14px;">Escolha uma dungeon da lista para ver detalhes e entrar</p>
                </div>
            `;
            return;
        }
        
        const dungeon = this.selectedDungeon;
        const diffColor = this.DIFFICULTY_COLORS[dungeon.difficulty];
        
        this.mainPanel.innerHTML = '';
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: flex-start;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const icon = document.createElement('div');
        icon.textContent = dungeon.icon;
        icon.style.cssText = `
            font-size: 64px;
            margin-right: 20px;
            filter: drop-shadow(0 0 15px ${dungeon.color});
        `;
        
        const info = document.createElement('div');
        info.innerHTML = `
            <h2 style="margin: 0 0 12px 0; color: ${dungeon.color}; font-size: 26px;">${dungeon.name}</h2>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
                <span style="
                    background: ${diffColor};
                    color: white;
                    padding: 5px 14px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                ">${dungeon.difficulty}</span>
                <span style="color: rgba(255,255,255,0.7); font-size: 14px;">
                    ⏱️ ${dungeon.duration}
                </span>
                <span style="color: rgba(255,255,255,0.7); font-size: 14px;">
                    👥 ${dungeon.maxPlayers} max
                </span>
            </div>
        `;
        
        header.appendChild(icon);
        header.appendChild(info);
        this.mainPanel.appendChild(header);
        
        // Description
        const descSection = document.createElement('div');
        descSection.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        `;
        descSection.innerHTML = `
            <h4 style="margin: 0 0 12px 0; color: ${dungeon.color}; font-size: 15px;">📜 Descrição</h4>
            <p style="margin: 0; color: rgba(255,255,255,0.9); line-height: 1.6; font-size: 14px;">
                ${dungeon.description}
            </p>
        `;
        this.mainPanel.appendChild(descSection);
        
        // Requirements
        const reqSection = document.createElement('div');
        reqSection.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        `;
        
        const playerLevel = this.game?.player?.level || 1;
        const levelReqMet = playerLevel >= dungeon.minLevel;
        
        reqSection.innerHTML = `
            <h4 style="margin: 0 0 15px 0; color: #f59e0b; font-size: 15px;">⚠️ Requisitos</h4>
            <div style="display: grid; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: rgba(255,255,255,0.7);">Nível Mínimo</span>
                    <span style="color: ${levelReqMet ? '#22c55e' : '#ef4444'}; font-weight: 600;">
                        ${dungeon.minLevel} ${levelReqMet ? '✓' : '✗'}
                    </span>
                </div>
                ${dungeon.minPlayers ? `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: rgba(255,255,255,0.7);">Jogadores Mínimos</span>
                        <span style="color: #fff; font-weight: 600;">${dungeon.minPlayers}</span>
                    </div>
                ` : ''}
                ${dungeon.boss ? `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: rgba(255,255,255,0.7);">Boss Final</span>
                        <span style="color: #ef4444; font-weight: 600;">👹 ${dungeon.boss}</span>
                    </div>
                ` : ''}
            </div>
        `;
        this.mainPanel.appendChild(reqSection);
        
        // Rewards
        const rewardsSection = document.createElement('div');
        rewardsSection.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        `;
        
        let rewardsHTML = `
            <h4 style="margin: 0 0 15px 0; color: #22c55e; font-size: 15px;">🎁 Recompensas</h4>
            <div style="display: grid; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: rgba(255,255,255,0.7);">Experiência</span>
                    <span style="color: #22c55e; font-weight: 600;">+${dungeon.rewards.xp.toLocaleString()} XP</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: rgba(255,255,255,0.7);">Ouro</span>
                    <span style="color: #eab308; font-weight: 600;">💰 ${dungeon.rewards.gold}</span>
                </div>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="color: rgba(255,255,255,0.7); margin-bottom: 10px; font-size: 13px;">Itens Possíveis:</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${dungeon.rewards.items.map(item => `
                        <span style="
                            background: rgba(139, 0, 0, 0.3);
                            color: #f59e0b;
                            padding: 5px 12px;
                            border-radius: 15px;
                            font-size: 12px;
                            border: 1px solid rgba(245, 158, 11, 0.3);
                        ">${item}</span>
                    `).join('')}
                </div>
            </div>
        `;
        
        rewardsSection.innerHTML = rewardsHTML;
        this.mainPanel.appendChild(rewardsSection);
        
        // Enter button
        const canEnter = levelReqMet;
        const enterBtn = document.createElement('button');
        enterBtn.textContent = canEnter ? `🚪 Entrar na Dungeon` : '❌ Nível Insuficiente';
        enterBtn.style.cssText = `
            width: 100%;
            padding: 16px;
            background: ${canEnter ? 'linear-gradient(45deg, #DC143C, #8B0000)' : '#666'};
            border: none;
            border-radius: 10px;
            color: white;
            font-weight: 700;
            font-size: 16px;
            cursor: ${canEnter ? 'pointer' : 'not-allowed'};
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        
        if (canEnter) {
            enterBtn.onmouseover = () => {
                enterBtn.style.transform = 'translateY(-2px)';
                enterBtn.style.boxShadow = '0 8px 25px rgba(220, 20, 60, 0.4)';
            };
            
            enterBtn.onmouseout = () => {
                enterBtn.style.transform = 'translateY(0)';
                enterBtn.style.boxShadow = 'none';
            };
            
            enterBtn.onclick = () => this.enterDungeon(dungeon);
        }
        
        this.mainPanel.appendChild(enterBtn);
    }
    
    enterDungeon(dungeon) {
        console.log(`[DungeonUI] Entrando na dungeon: ${dungeon.name}`);
        
        // Check party requirements for group/raid
        if (dungeon.minPlayers && dungeon.minPlayers > 1) {
            // Check if player is in a party
            const party = this.game?.partySystem?.getParty?.(this.game.player.id);
            if (!party || party.members.length < dungeon.minPlayers) {
                this.showError(`Você precisa de um grupo com pelo menos ${dungeon.minPlayers} jogadores!`);
                return;
            }
        }
        
        // Send to server
        if (this.socket) {
            this.socket.emit('dungeon:enter', {
                dungeonId: dungeon.id,
                dungeonType: this.activeTab
            });
        }
        
        // Visual feedback
        this.game?.showFloatingText?.(`Entrando em ${dungeon.name}...`, 0, -40, '#DC143C');
        
        // Close UI
        this.hide();
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 20000;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('dungeon:entered', (data) => {
            this.currentInstance = data;
            this.showDungeonProgress(data);
        });
        
        this.socket.on('dungeon:error', (data) => {
            this.showError(data.message);
        });
        
        this.socket.on('dungeon:progress', (data) => {
            this.updateDungeonProgress(data);
        });
        
        this.socket.on('dungeon:completed', (data) => {
            this.showDungeonCompleted(data);
        });
    }
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'd' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.toggle();
                }
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    // ===== DUNGEON PROGRESS UI =====
    
    showDungeonProgress(data) {
        // Create floating dungeon progress UI
        if (this.progressUI) {
            this.progressUI.remove();
        }
        
        this.progressUI = document.createElement('div');
        this.progressUI.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: linear-gradient(135deg, rgba(139, 0, 0, 0.9), rgba(220, 20, 60, 0.9));
            padding: 15px 20px;
            border-radius: 12px;
            color: white;
            z-index: 5000;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        
        this.progressUI.innerHTML = `
            <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">
                🏰 ${data.dungeonName}
            </div>
            <div style="font-size: 13px; opacity: 0.9;">
                Progresso: ${data.progress || 0}%
            </div>
            <div style="
                width: 200px;
                height: 6px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 3px;
                margin-top: 8px;
                overflow: hidden;
            ">
                <div style="
                    width: ${data.progress || 0}%;
                    height: 100%;
                    background: #22c55e;
                    border-radius: 3px;
                    transition: width 0.3s;
                "></div>
            </div>
        `;
        
        document.body.appendChild(this.progressUI);
    }
    
    updateDungeonProgress(data) {
        if (this.progressUI) {
            const progressBar = this.progressUI.querySelector('div > div > div');
            if (progressBar) {
                progressBar.style.width = `${data.progress}%`;
            }
            const text = this.progressUI.querySelector('div:nth-child(2)');
            if (text) {
                text.textContent = `Progresso: ${data.progress}%`;
            }
        }
    }
    
    showDungeonCompleted(data) {
        // Remove progress UI
        if (this.progressUI) {
            this.progressUI.remove();
            this.progressUI = null;
        }
        
        // Show completion screen
        const completionUI = document.createElement('div');
        completionUI.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 40px 60px;
            border-radius: 20px;
            border: 3px solid #22c55e;
            text-align: center;
            z-index: 20000;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        `;
        
        completionUI.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
            <h2 style="margin: 0 0 15px 0; color: #22c55e; font-size: 28px;">Dungeon Completada!</h2>
            <p style="margin: 0 0 25px 0; color: rgba(255,255,255,0.8); font-size: 16px;">
                ${data.dungeonName} foi conquistada!
            </p>
            <div style="display: grid; gap: 10px; margin-bottom: 25px;">
                <div style="color: #eab308; font-weight: 600;">💰 +${data.rewards.gold} Ouro</div>
                <div style="color: #22c55e; font-weight: 600;">⭐ +${data.rewards.xp.toLocaleString()} XP</div>
            </div>
            <button onclick="this.parentElement.remove()" style="
                padding: 12px 30px;
                background: linear-gradient(45deg, #22c55e, #16a34a);
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: 700;
                cursor: pointer;
                font-size: 15px;
            ">Continuar</button>
        `;
        
        document.body.appendChild(completionUI);
    }
    
    // ===== SHOW/HIDE =====
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        
        if (this.game?.pause) {
            this.game.pause();
        }
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        
        if (this.game?.resume) {
            this.game.resume();
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Exportar
if (typeof window !== 'undefined') {
    window.DungeonUI = DungeonUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DungeonUI;
}
