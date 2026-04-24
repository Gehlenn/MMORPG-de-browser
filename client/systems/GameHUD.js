/**
 * GameHUD v3 - Interface Estilo WoW
 * 
 * Layout:
 * - HP/MP/Info Box: Canto superior esquerdo (tudo junto)
 * - Minimap: Canto superior direito
 * - Quest Tracker: Abaixo do minimap
 * - Botões: Canto inferior (esquerda e direita)
 * - Skill Bar: Centro inferior
 * - XP Bar: Abaixo da Skill Bar
 * - Botão Mute: Canto superior direito (próximo ao minimap)
 */

class GameHUD {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.player = null;
        this.container = null;
        this.panels = {};
        this.openPanel = null;
        this.isMuted = false;
        
        // Configurações de skill bars (customizável)
        this.skillBarConfig = {
            rows: 1,
            slotsPerRow: 8,
            totalSlots: 8
        };
        
        // Skills padrão (8 slots)
        this.skills = [
            { key: '1', name: 'Ataque', icon: '⚔️', cd: 0, maxCd: 0 },
            { key: '2', name: 'Defesa', icon: '🛡️', cd: 0, maxCd: 5 },
            { key: '3', name: 'Skill 1', icon: '🔥', cd: 0, maxCd: 8 },
            { key: '4', name: 'Skill 2', icon: '⚡', cd: 0, maxCd: 10 },
            { key: '5', name: 'Skill 3', icon: '❄️', cd: 0, maxCd: 12 },
            { key: '6', name: 'Cura', icon: '💚', cd: 0, maxCd: 15 },
            { key: '7', name: 'Buff', icon: '✨', cd: 0, maxCd: 20 },
            { key: '8', name: 'Ultimate', icon: '💀', cd: 0, maxCd: 30 }
        ];
        
        // Botões inferiores esquerdo
        this.leftButtons = [
            { id: 'character', icon: '👤', label: 'Personagem', key: 'C' },
            { id: 'quests', icon: '📜', label: 'Quests', key: 'L' },
            { id: 'inventory', icon: '🎒', label: 'Inventário', key: 'I' },
            { id: 'map', icon: '🗺️', label: 'Mapa', key: 'M' }
        ];
        
        // Botões inferiores direito
        this.rightButtons = [
            { id: 'guild', icon: '🛡️', label: 'Guilda', key: 'G' },
            { id: 'shop', icon: '🏪', label: 'Loja', key: 'H' },
            { id: 'reputation', icon: '⚖️', label: 'Reputação', key: 'R' },
            { id: 'settings', icon: '⚙️', label: 'Config', key: 'O' }
        ];
        
        // Guildas exemplo
        this.guilds = [
            { name: 'Cavaleiros de Eldoria', level: 15, members: 45, leader: 'ArthasDK' },
            { name: 'Mago Supremo', level: 12, members: 32, leader: 'GandalfGrey' },
            { name: 'Ladinos Noturnos', level: 8, members: 28, leader: 'ShadowStab' },
            { name: 'Irmandade do Lobo', level: 20, members: 67, leader: 'WolfKing' }
        ];
        
        // Quests exemplo
        this.activeQuests = [
            { title: 'Forest Patrol', steps: [
                { text: 'Derrotar Goblins', current: 3, total: 5, completed: false },
                { text: 'Coletar Ervas', current: 2, total: 5, completed: false },
                { text: 'Falar com NPC', current: 0, total: 1, completed: false }
            ], rewards: { xp: 100, gold: 50 }}
        ];
        
        console.log('🎮 GameHUD v3 inicializado');
    }
    
    initialize(player) {
        this.player = player;
        this.createHUD();
        this.setupEventListeners();
        console.log('✅ GameHUD criado');
    }
    
    createHUD() {
        this.container = document.createElement('div');
        this.container.id = 'game-hud-v3';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 1000; font-family: 'Segoe UI', sans-serif;
            user-select: none;
        `;
        
        this.createPlayerInfoBox();
        this.createMinimap();
        // this.createMuteButton(); // Removido - controle de volume já está no minimap
        this.createQuestTracker();
        this.createBottomButtons();
        this.createSkillBar();
        this.createXPBar();
        this.createPanels();
        
        document.body.appendChild(this.container);
    }
    
    createPlayerInfoBox() {
        const box = document.createElement('div');
        box.id = 'hud-player-box';
        box.style.cssText = `
            position: absolute; top: 10px; left: 10px;
            width: 220px; pointer-events: auto;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #5c3a21;
            border-radius: 10px;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        `;
        
        // Header: Nome, Classe, Ícone
        box.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #5c3a21;">
                <div id="hud-class-icon" style="font-size: 32px; filter: drop-shadow(0 0 5px rgba(255,215,0,0.5));">⚔️</div>
                <div style="flex: 1;">
                    <div id="hud-player-name" style="font-weight: bold; color: #ffd700; font-size: 14px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">Player</div>
                    <div id="hud-player-info" style="font-size: 11px; color: #d4a574;">Aprendiz Nível 1</div>
                </div>
            </div>
            
            <!-- HP Bar -->
            <div style="margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #ff6b6b; margin-bottom: 2px;">
                    <span>❤️ Vida</span>
                    <span id="hud-hp-text">100/100</span>
                </div>
                <div style="width: 100%; height: 18px; background: #2a0a0a; border: 1px solid #8b0000; border-radius: 9px; overflow: hidden;">
                    <div id="hud-hp-fill" style="width: 100%; height: 100%; background: linear-gradient(180deg, #ff4444 0%, #cc0000 50%, #8b0000 100%); transition: width 0.3s;"></div>
                </div>
            </div>
            
            <!-- MP Bar -->
            <div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #6b9aff; margin-bottom: 2px;">
                    <span>💧 Mana</span>
                    <span id="hud-mp-text">50/50</span>
                </div>
                <div style="width: 100%; height: 14px; background: #0a0a2a; border: 1px solid #0066cc; border-radius: 7px; overflow: hidden;">
                    <div id="hud-mp-fill" style="width: 100%; height: 100%; background: linear-gradient(180deg, #4488ff 0%, #0066cc 50%, #004499 100%); transition: width 0.3s;"></div>
                </div>
            </div>
            
            <!-- Gold -->
            <div style="display: flex; align-items: center; gap: 5px; font-size: 12px; color: #ffd700; justify-content: flex-end;">
                <span>💰</span>
                <span id="hud-gold">0</span>
            </div>
        `;
        
        this.container.appendChild(box);
    }
    
    createMuteButton() {
        const btn = document.createElement('div');
        btn.id = 'hud-mute-btn';
        btn.style.cssText = `
            position: absolute; top: 50px; right: 10px;
            width: 30px; height: 30px;
            background: rgba(0, 0, 0, 0.85);
            border: 2px solid #5c3a21;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; pointer-events: auto;
            font-size: 14px; transition: all 0.2s;
            z-index: 1001;
        `;
        btn.innerHTML = '🔊';
        
        btn.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            btn.innerHTML = this.isMuted ? '🔇' : '🔊';
            btn.style.opacity = this.isMuted ? '0.5' : '1';
            console.log(this.isMuted ? '🔇 Mudo ativado' : '🔊 Som ativado');
        });
        
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.borderColor = '#d4a574';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.borderColor = '#5c3a21';
        });
        
        this.container.appendChild(btn);
    }
    
    createMinimap() {
        const minimap = document.createElement('div');
        minimap.id = 'hud-minimap';
        minimap.style.cssText = `
            position: absolute; top: 10px; right: 10px;
            width: 150px; height: 150px; pointer-events: auto;
            background: radial-gradient(circle, rgba(34,50,30,0.95) 0%, rgba(20,30,18,0.95) 100%);
            border: 3px solid #5c3a21; border-radius: 50%; overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            cursor: pointer;
        `;
        
        const canvas = document.createElement('canvas');
        canvas.width = 150; canvas.height = 150;
        minimap.appendChild(canvas);
        this.minimapCanvas = canvas;
        this.minimapCtx = canvas.getContext('2d');
        
        // Label
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%);
            font-size: 10px; color: #aaa; background: rgba(0,0,0,0.7);
            padding: 3px 10px; border-radius: 10px; white-space: nowrap;
            border: 1px solid #5c3a21;
        `;
        label.textContent = '🗺️ Clique ou M';
        minimap.appendChild(label);
        
        minimap.addEventListener('click', () => this.togglePanel('map'));
        
        this.container.appendChild(minimap);
    }
    
    createQuestTracker() {
        const tracker = document.createElement('div');
        tracker.id = 'hud-quests';
        tracker.style.cssText = `
            position: absolute; top: 210px; right: 10px;
            width: 200px; max-height: 220px;
            background: rgba(0,0,0,0.9); border: 2px solid #5c3a21;
            border-radius: 10px; padding: 12px; pointer-events: auto;
            overflow-y: auto;
        `;
        
        tracker.innerHTML = `
            <div style="font-weight: bold; color: #ffd700; font-size: 12px; margin-bottom: 10px; border-bottom: 1px solid #5c3a21; padding-bottom: 6px; display: flex; align-items: center; gap: 5px;">
                📜 Quests
            </div>
            <div id="hud-quest-list"></div>
        `;
        
        this.container.appendChild(tracker);
        this.updateQuestDisplay();
    }
    
    createBottomButtons() {
        // Container esquerdo - mais abaixo (bottom: 20px)
        const leftContainer = document.createElement('div');
        leftContainer.style.cssText = `
            position: absolute; bottom: 20px; left: 20px;
            display: flex; gap: 8px; pointer-events: auto;
        `;
        
        this.leftButtons.forEach(btn => {
            const el = this.createBottomButton(btn, 'left');
            leftContainer.appendChild(el);
        });
        
        this.container.appendChild(leftContainer);
        
        // Container direito - mais abaixo
        const rightContainer = document.createElement('div');
        rightContainer.style.cssText = `
            position: absolute; bottom: 20px; right: 20px;
            display: flex; gap: 8px; pointer-events: auto;
        `;
        
        this.rightButtons.forEach(btn => {
            const el = this.createBottomButton(btn, 'right');
            rightContainer.appendChild(el);
        });
        
        this.container.appendChild(rightContainer);
    }
    
    createBottomButton(btn, side) {
        const el = document.createElement('div');
        el.className = 'hud-btn';
        el.dataset.id = btn.id;
        el.style.cssText = `
            width: 48px; height: 48px;
            background: linear-gradient(145deg, #3d2817 0%, #1a0f0a 100%);
            border: 2px solid #5c3a21; border-radius: 10px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.15s ease; position: relative;
            box-shadow: 0 3px 10px rgba(0,0,0,0.6);
        `;
        
        el.innerHTML = `
            <span style="font-size: 22px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">${btn.icon}</span>
            <span style="font-size: 9px; color: #888; position: absolute; top: 3px; right: 5px; font-weight: bold; text-shadow: 1px 1px 1px rgba(0,0,0,0.8);">${btn.key}</span>
        `;
        
        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute; bottom: 55px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.9); color: #fff; padding: 5px 10px;
            border-radius: 5px; font-size: 11px; white-space: nowrap;
            opacity: 0; transition: opacity 0.2s; pointer-events: none;
            border: 1px solid #5c3a21; z-index: 1002;
        `;
        tooltip.innerHTML = `<span style="color:#d4a574">${btn.label}</span> <span style="color:#888">[${btn.key}]</span>`;
        el.appendChild(tooltip);
        
        // Eventos
        el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.15)';
            el.style.borderColor = '#d4a574';
            el.style.boxShadow = '0 5px 15px rgba(212,165,116,0.3)';
            tooltip.style.opacity = '1';
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
            el.style.borderColor = '#5c3a21';
            el.style.boxShadow = '0 3px 10px rgba(0,0,0,0.6)';
            tooltip.style.opacity = '0';
        });
        
        el.addEventListener('click', () => this.togglePanel(btn.id));
        
        return el;
    }
    
    createSkillBar() {
        const bar = document.createElement('div');
        bar.id = 'hud-skills';
        bar.style.cssText = `
            position: absolute; bottom: 75px; left: 50%; transform: translateX(-50%);
            display: flex; flex-direction: column; gap: 4px; padding: 8px;
            background: rgba(0,0,0,0.85); border: 2px solid #5c3a21;
            border-radius: 12px; pointer-events: auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        `;
        
        // Container para linhas de skills
        this.skillRowsContainer = document.createElement('div');
        this.skillRowsContainer.style.cssText = `
            display: flex; flex-direction: column; gap: 4px;
        `;
        
        this.renderSkillSlots();
        
        bar.appendChild(this.skillRowsContainer);
        this.container.appendChild(bar);
    }
    
    renderSkillSlots() {
        this.skillRowsContainer.innerHTML = '';
        
        const slotsPerRow = this.skillBarConfig.slotsPerRow;
        const totalSlots = this.skillBarConfig.totalSlots;
        const rows = Math.ceil(totalSlots / slotsPerRow);
        
        for (let r = 0; r < rows; r++) {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; gap: 4px;';
            
            for (let i = 0; i < slotsPerRow; i++) {
                const slotIndex = r * slotsPerRow + i;
                if (slotIndex >= totalSlots) break;
                
                const skill = this.skills[slotIndex] || { key: (slotIndex + 1).toString(), name: 'Vazio', icon: '', cd: 0, maxCd: 0 };
                const slot = this.createSkillSlot(skill, slotIndex);
                row.appendChild(slot);
            }
            
            this.skillRowsContainer.appendChild(row);
        }
    }
    
    createSkillSlot(skill, index) {
        const slot = document.createElement('div');
        slot.className = 'hud-skill';
        slot.dataset.index = index;
        
        const hasSkill = skill.icon !== '';
        slot.style.cssText = `
            width: 44px; height: 44px;
            background: ${hasSkill ? 'linear-gradient(135deg, #4a3728 0%, #2c1810 100%)' : 'rgba(44,24,16,0.5)' };
            border: 2px solid ${hasSkill ? '#5c3a21' : '#3a2820'}; 
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            cursor: ${hasSkill ? 'pointer' : 'default'}; position: relative; font-size: 22px;
            transition: all 0.15s;
        `;
        
        slot.innerHTML = hasSkill ? `
            <span style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">${skill.icon}</span>
            <span style="position: absolute; bottom: 2px; left: 4px; font-size: 10px; color: #aaa; font-weight: bold; text-shadow: 1px 1px 1px rgba(0,0,0,0.8);">${skill.key}</span>
            <div class="skill-cd" style="position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.75); display: none; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: bold; border-radius: 6px;"></div>
        ` : '';
        
        if (hasSkill) {
            slot.addEventListener('mouseenter', () => {
                slot.style.transform = 'scale(1.1)';
                slot.style.borderColor = '#d4a574';
            });
            
            slot.addEventListener('mouseleave', () => {
                slot.style.transform = 'scale(1)';
                slot.style.borderColor = '#5c3a21';
            });
            
            slot.addEventListener('click', () => this.useSkill(index));
        }
        
        return slot;
    }
    
    createXPBar() {
        const xpBar = document.createElement('div');
        xpBar.id = 'hud-xp-bar';
        xpBar.style.cssText = `
            position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%);
            width: 500px; pointer-events: auto;
        `;
        
        xpBar.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 9px; color: #aaa; margin-bottom: 2px;">
                <span>⭐ XP</span>
                <span id="hud-xp-text">0 / 100</span>
            </div>
            <div style="width: 100%; height: 10px; background: #1a1a1a; border: 1px solid #444; border-radius: 5px; overflow: hidden;">
                <div id="hud-xp-fill" style="width: 0%; height: 100%; background: linear-gradient(180deg, #ffd700 0%, #b8860b 50%, #8b6914 100%); transition: width 0.3s;"></div>
            </div>
        `;
        
        this.container.appendChild(xpBar);
    }
    
    createPanels() {
        this.createGuildPanel();
        this.createSettingsPanel();
        this.createShopPanel();
        this.createReputationPanel();
        this.createCharacterPanel();
        this.createQuestsPanel();
        this.createInventoryPanel();
        this.createMapPanel();
    }
    
    createGuildPanel() {
        const panel = document.createElement('div');
        panel.id = 'panel-guild';
        panel.style.cssText = this.getPanelStyle();
        panel.style.display = 'none';
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #5c3a21; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #ffd700; font-size: 18px;">🛡️ Guildas</h2>
                <button onclick="window.gameHUD.closeAllPanels()" style="background: #8b0000; color: #fff; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px;">✕</button>
            </div>
            <div id="guild-list" style="max-height: 280px; overflow-y: auto;"></div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #5c3a21;">
                <button id="btn-create-guild" style="width: 100%; padding: 12px; background: linear-gradient(180deg, #4a3728, #2c1810); color: #d4a574; border: 1px solid #5c3a21; border-radius: 6px; cursor: pointer; font-weight: bold;">
                    ➕ Criar Nova Guilda
                </button>
            </div>
        `;
        
        this.container.appendChild(panel);
        this.panels.guild = panel;
        this.updateGuildList();
    }
    
    updateGuildList() {
        const list = document.getElementById('guild-list');
        if (!list) return;
        
        list.innerHTML = this.guilds.map(g => `
            <div style="padding: 12px; margin-bottom: 8px; background: rgba(44,24,16,0.85); border: 1px solid #5c3a21; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold; color: #ffd700; font-size: 13px;">${g.name}</div>
                        <div style="font-size: 11px; color: #aaa;">Nv. ${g.level} • ${g.members} membros</div>
                        <div style="font-size: 10px; color: #666;">Líder: ${g.leader}</div>
                    </div>
                    <button class="btn-join-guild" data-guild="${g.name}" style="padding: 8px 14px; background: linear-gradient(180deg, #2e7d32, #1b5e20); color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">
                        Solicitar
                    </button>
                </div>
            </div>
        `).join('');
        
        list.querySelectorAll('.btn-join-guild').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const guildName = e.target.dataset.guild;
                alert(`📨 Solicitação enviada para: ${guildName}`);
                e.target.textContent = 'Pendente';
                e.target.disabled = true;
                e.target.style.background = '#555';
            });
        });
    }
    
    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.id = 'panel-settings';
        panel.style.cssText = this.getPanelStyle();
        panel.style.width = '550px';
        panel.style.height = '450px';
        panel.style.display = 'none';
        panel.style.padding = '0';
        panel.style.overflow = 'hidden';
        
        panel.innerHTML = `
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 2px solid #5c3a21; background: rgba(0,0,0,0.3);">
                <h2 style="margin: 0; color: #ffd700; font-size: 18px;">⚙️ Opções do Jogo</h2>
                <button onclick="window.gameHUD.closeAllPanels()" style="background: #8b0000; color: #fff; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px; transition: all 0.2s;" onmouseover="this.style.background='#ff0000'" onmouseout="this.style.background='#8b0000'">✕</button>
            </div>
            
            <!-- Content com Abas -->
            <div style="display: flex; height: calc(100% - 65px);">
                <!-- Abas Laterais -->
                <div style="width: 140px; background: rgba(0,0,0,0.5); border-right: 1px solid #5c3a21; padding: 10px 0;">
                    <div class="settings-tab active" data-tab="video" onclick="window.gameHUD.switchSettingsTab('video')" style="padding: 12px 15px; cursor: pointer; color: #ffd700; font-size: 13px; border-left: 3px solid #ffd700; background: rgba(255,215,0,0.1); display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
                        🎨 Vídeo
                    </div>
                    <div class="settings-tab" data-tab="audio" onclick="window.gameHUD.switchSettingsTab('audio')" style="padding: 12px 15px; cursor: pointer; color: #aaa; font-size: 13px; border-left: 3px solid transparent; display: flex; align-items: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="if(!this.classList.contains('active')) this.style.background='transparent'">
                        🎵 Áudio
                    </div>
                    <div class="settings-tab" data-tab="interface" onclick="window.gameHUD.switchSettingsTab('interface')" style="padding: 12px 15px; cursor: pointer; color: #aaa; font-size: 13px; border-left: 3px solid transparent; display: flex; align-items: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="if(!this.classList.contains('active')) this.style.background='transparent'">
                        🖥️ Interface
                    </div>
                    <div class="settings-tab" data-tab="skills" onclick="window.gameHUD.switchSettingsTab('skills')" style="padding: 12px 15px; cursor: pointer; color: #aaa; font-size: 13px; border-left: 3px solid transparent; display: flex; align-items: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="if(!this.classList.contains('active')) this.style.background='transparent'">
                        ⚔️ Skills
                    </div>
                    <div class="settings-tab" data-tab="controls" onclick="window.gameHUD.switchSettingsTab('controls')" style="padding: 12px 15px; cursor: pointer; color: #aaa; font-size: 13px; border-left: 3px solid transparent; display: flex; align-items: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="if(!this.classList.contains('active')) this.style.background='transparent'">
                        ⌨️ Controles
                    </div>
                    <div class="settings-tab" data-tab="account" onclick="window.gameHUD.switchSettingsTab('account')" style="padding: 12px 15px; cursor: pointer; color: #aaa; font-size: 13px; border-left: 3px solid transparent; display: flex; align-items: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="if(!this.classList.contains('active')) this.style.background='transparent'">
                        👤 Conta
                    </div>
                </div>
                
                <!-- Conteúdo das Abas -->
                <div style="flex: 1; padding: 20px; overflow-y: auto;">
                    
                    <!-- Aba: Vídeo -->
                    <div id="tab-video" class="tab-content" style="display: block;">
                        <h3 style="color: #d4a574; font-size: 14px; margin: 0 0 15px 0; border-bottom: 1px solid #5c3a21; padding-bottom: 8px;">📺 Configurações de Vídeo</h3>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; justify-content: space-between; font-size: 12px; color: #aaa; margin-bottom: 5px;">
                                <span>Qualidade Gráfica</span>
                                <span style="color: #ffd700;">Alta</span>
                            </label>
                            <select style="width: 100%; padding: 8px; background: #2c1810; color: #d4a574; border: 1px solid #5c3a21; border-radius: 5px; font-size: 12px;">
                                <option>Baixa</option>
                                <option>Média</option>
                                <option selected>Alta</option>
                                <option>Ultra</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; justify-content: space-between; font-size: 12px; color: #aaa; margin-bottom: 5px;">
                                <span>Resolução</span>
                            </label>
                            <select style="width: 100%; padding: 8px; background: #2c1810; color: #d4a574; border: 1px solid #5c3a21; border-radius: 5px; font-size: 12px;">
                                <option>1280x720</option>
                                <option selected>1920x1080</option>
                                <option>2560x1440</option>
                            </select>
                        </div>
                        
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #aaa; cursor: pointer; margin-bottom: 10px;">
                            <input type="checkbox" checked style="width: 16px; height: 16px;"> Modo Tela Cheia
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #aaa; cursor: pointer; margin-bottom: 10px;">
                            <input type="checkbox" checked style="width: 16px; height: 16px;"> Sincronização Vertical (V-Sync)
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #aaa; cursor: pointer;">
                            <input type="checkbox" style="width: 16px; height: 16px;"> Limitar FPS
                        </label>
                    </div>
                    
                    <!-- Aba: Áudio -->
                    <div id="tab-audio" class="tab-content" style="display: none;">
                        <h3 style="color: #d4a574; font-size: 14px; margin: 0 0 15px 0; border-bottom: 1px solid #5c3a21; padding-bottom: 8px;">🎵 Configurações de Áudio</h3>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; justify-content: space-between; font-size: 12px; color: #aaa; margin-bottom: 5px;">
                                <span>Volume Principal</span>
                                <span id="vol-master-text" style="color: #ffd700;">80%</span>
                            </label>
                            <input type="range" id="vol-master" min="0" max="100" value="80" style="width: 100%; height: 6px; accent-color: #ffd700;" oninput="window.gameHUD.updateVolume('master', this.value)">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; justify-content: space-between; font-size: 12px; color: #aaa; margin-bottom: 5px;">
                                <span>Música</span>
                                <span id="vol-music-text" style="color: #ffd700;">60%</span>
                            </label>
                            <input type="range" id="vol-music" min="0" max="100" value="60" style="width: 100%; height: 6px; accent-color: #4488ff;" oninput="window.gameHUD.updateVolume('music', this.value)">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; justify-content: space-between; font-size: 12px; color: #aaa; margin-bottom: 5px;">
                                <span>Efeitos Sonoros</span>
                                <span id="vol-sfx-text" style="color: #ffd700;">70%</span>
                            </label>
                            <input type="range" id="vol-sfx" min="0" max="100" value="70" style="width: 100%; height: 6px; accent-color: #4CAF50;" oninput="window.gameHUD.updateVolume('sfx', this.value)">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; justify-content: space-between; font-size: 12px; color: #aaa; margin-bottom: 5px;">
                                <span>Diálogos NPCs</span>
                                <span id="vol-voice-text" style="color: #ffd700;">100%</span>
                            </label>
                            <input type="range" id="vol-voice" min="0" max="100" value="100" style="width: 100%; height: 6px; accent-color: #ff9800;" oninput="window.gameHUD.updateVolume('voice', this.value)">
                        </div>
                        
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #aaa; cursor: pointer;">
                            <input type="checkbox" style="width: 16px; height: 16px;"> Ativar Áudio em Segundo Plano
                        </label>
                    </div>
                    
                    <!-- Aba: Interface -->
                    <div id="tab-interface" class="tab-content" style="display: none;">
                        <h3 style="color: #d4a574; font-size: 14px; margin: 0 0 15px 0; border-bottom: 1px solid #5c3a21; padding-bottom: 8px;">🖥️ Configurações de Interface</h3>
                        
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #aaa; cursor: pointer; margin-bottom: 10px;">
                            <input type="checkbox" checked style="width: 16px; height: 16px;"> Mostrar números de dano flutuantes
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #aaa; cursor: pointer; margin-bottom: 10px;">
                            <input type="checkbox" checked style="width: 16px; height: 16px;"> Mostrar nomes dos mobs
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #aaa; cursor: pointer; margin-bottom: 10px;">
                            <input type="checkbox" checked style="width: 16px; height: 16px;"> Mostrar dicas de tooltips
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #aaa; cursor: pointer; margin-bottom: 10px;">
                            <input type="checkbox" style="width: 16px; height: 16px;"> Modo econômico (menos partículas)
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #aaa; cursor: pointer;">
                            <input type="checkbox" style="width: 16px; height: 16px;"> Esconder interface durante combate
                        </label>
                    </div>
                    
                    <!-- Aba: Skills -->
                    <div id="tab-skills" class="tab-content" style="display: none;">
                        <h3 style="color: #d4a574; font-size: 14px; margin: 0 0 15px 0; border-bottom: 1px solid #5c3a21; padding-bottom: 8px;">⚔️ Configuração de Barras de Skill</h3>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="font-size: 12px; color: #aaa; margin-bottom: 8px; display: block;">Número de barras:</label>
                            <div style="display: flex; gap: 10px;">
                                <button class="skill-row-btn" data-rows="1" onclick="window.gameHUD.setSkillRows(1)" style="flex: 1; padding: 10px; background: linear-gradient(180deg, #4a3728, #2c1810); color: #ffd700; border: 2px solid #ffd700; border-radius: 6px; cursor: pointer; font-weight: bold;">1</button>
                                <button class="skill-row-btn" data-rows="2" onclick="window.gameHUD.setSkillRows(2)" style="flex: 1; padding: 10px; background: #2c1810; color: #aaa; border: 1px solid #5c3a21; border-radius: 6px; cursor: pointer;">2</button>
                                <button class="skill-row-btn" data-rows="3" onclick="window.gameHUD.setSkillRows(3)" style="flex: 1; padding: 10px; background: #2c1810; color: #aaa; border: 1px solid #5c3a21; border-radius: 6px; cursor: pointer;">3</button>
                            </div>
                            <div style="font-size: 11px; color: #888; margin-top: 5px;">Total: <span id="total-skills">8</span> skills</div>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="font-size: 12px; color: #aaa; margin-bottom: 8px; display: block;">Slots por barra:</label>
                            <div style="display: flex; gap: 8px;">
                                <button class="skill-slot-btn" data-slots="6" onclick="window.gameHUD.setSkillSlots(6)" style="flex: 1; padding: 8px; background: #2c1810; color: #aaa; border: 1px solid #5c3a21; border-radius: 5px; cursor: pointer; font-size: 11px;">6</button>
                                <button class="skill-slot-btn" data-slots="8" onclick="window.gameHUD.setSkillSlots(8)" style="flex: 1; padding: 8px; background: linear-gradient(180deg, #4a3728, #2c1810); color: #ffd700; border: 2px solid #ffd700; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">8</button>
                                <button class="skill-slot-btn" data-slots="10" onclick="window.gameHUD.setSkillSlots(10)" style="flex: 1; padding: 8px; background: #2c1810; color: #aaa; border: 1px solid #5c3a21; border-radius: 5px; cursor: pointer; font-size: 11px;">10</button>
                                <button class="skill-slot-btn" data-slots="12" onclick="window.gameHUD.setSkillSlots(12)" style="flex: 1; padding: 8px; background: #2c1810; color: #aaa; border: 1px solid #5c3a21; border-radius: 5px; cursor: pointer; font-size: 11px;">12</button>
                            </div>
                        </div>
                        
                        <div style="padding: 12px; background: rgba(44,24,16,0.6); border-radius: 8px; border: 1px solid #5c3a21;">
                            <div style="font-size: 11px; color: #888; margin-bottom: 8px;">Preview:</div>
                            <div id="skill-preview" style="display: flex; flex-direction: column; gap: 4px;">
                                <div style="display: flex; gap: 4px;">
                                    ${Array(8).fill(0).map((_, i) => `<div style="width: 30px; height: 30px; background: #3d2817; border: 1px solid #5c3a21; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">${i + 1}</div>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Aba: Controles -->
                    <div id="tab-controls" class="tab-content" style="display: none;">
                        <h3 style="color: #d4a574; font-size: 14px; margin: 0 0 15px 0; border-bottom: 1px solid #5c3a21; padding-bottom: 8px;">⌨️ Configuração de Controles</h3>
                        
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                                <span>Mover para Cima</span>
                                <span style="color: #ffd700; font-family: monospace;">W / ↑</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                                <span>Mover para Baixo</span>
                                <span style="color: #ffd700; font-family: monospace;">S / ↓</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                                <span>Mover Esquerda</span>
                                <span style="color: #ffd700; font-family: monospace;">A / ←</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                                <span>Mover Direita</span>
                                <span style="color: #ffd700; font-family: monospace;">D / →</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                                <span>Atacar / Interagir</span>
                                <span style="color: #ffd700; font-family: monospace;">ESPAÇO</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                                <span>Skills</span>
                                <span style="color: #ffd700; font-family: monospace;">1 - 8</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                                <span>Inventário</span>
                                <span style="color: #ffd700; font-family: monospace;">I / B</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                <span>Mapa</span>
                                <span style="color: #ffd700; font-family: monospace;">M</span>
                            </div>
                        </div>
                        
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #aaa; cursor: pointer;">
                            <input type="checkbox" checked style="width: 16px; height: 16px;"> Inverter Eixo Y do Mouse
                        </label>
                    </div>
                    
                    <!-- Aba: Conta -->
                    <div id="tab-account" class="tab-content" style="display: none;">
                        <h3 style="color: #d4a574; font-size: 14px; margin: 0 0 15px 0; border-bottom: 1px solid #5c3a21; padding-bottom: 8px;">👤 Informações da Conta</h3>
                        
                        <div style="padding: 15px; background: rgba(44,24,16,0.6); border-radius: 8px; margin-bottom: 15px;">
                            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">Nome da Conta:</div>
                            <div style="font-size: 14px; color: #ffd700; font-weight: bold;">Player123</div>
                        </div>
                        
                        <div style="padding: 15px; background: rgba(44,24,16,0.6); border-radius: 8px; margin-bottom: 15px;">
                            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">Email:</div>
                            <div style="font-size: 14px; color: #d4a574;">player@email.com</div>
                        </div>
                        
                        <div style="padding: 15px; background: rgba(44,24,16,0.6); border-radius: 8px; margin-bottom: 15px;">
                            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">Tipo de Conta:</div>
                            <div style="font-size: 14px; color: #ffd700; font-weight: bold;">⭐ Gratuita</div>
                        </div>
                        
                        <button style="width: 100%; padding: 12px; background: linear-gradient(180deg, #8b0000, #5c0000); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 10px;" onclick="alert('Logout realizado!')">
                            🚪 Logout
                        </button>
                        
                        <button style="width: 100%; padding: 12px; background: #2c1810; color: #888; border: 1px solid #5c3a21; border-radius: 6px; cursor: pointer; font-size: 11px;" onclick="alert('Função em desenvolvimento')">
                            🗑️ Deletar Personagem
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="display: flex; justify-content: flex-end; gap: 10px; padding: 15px 20px; border-top: 2px solid #5c3a21; background: rgba(0,0,0,0.3);">
                <button onclick="window.gameHUD.closeAllPanels()" style="padding: 10px 20px; background: #2c1810; color: #aaa; border: 1px solid #5c3a21; border-radius: 5px; cursor: pointer; font-size: 12px;">
                    Cancelar
                </button>
                <button onclick="window.gameHUD.saveSettings(); window.gameHUD.closeAllPanels();" style="padding: 10px 25px; background: linear-gradient(180deg, #2e7d32, #1b5e20); color: #fff; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 12px;">
                    💾 Aplicar
                </button>
            </div>
        `;
        
        this.container.appendChild(panel);
        this.panels.settings = panel;
    }
    
    switchSettingsTab(tabId) {
        // Atualizar abas
        document.querySelectorAll('.settings-tab').forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
                tab.style.color = '#ffd700';
                tab.style.borderLeftColor = '#ffd700';
                tab.style.background = 'rgba(255,215,0,0.1)';
            } else {
                tab.classList.remove('active');
                tab.style.color = '#aaa';
                tab.style.borderLeftColor = 'transparent';
                tab.style.background = 'transparent';
            }
        });
        
        // Mostrar conteúdo
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        const activeContent = document.getElementById(`tab-${tabId}`);
        if (activeContent) {
            activeContent.style.display = 'block';
        }
    }
    
    setSkillRows(rows) {
        this.skillBarConfig.rows = rows;
        this.skillBarConfig.totalSlots = rows * this.skillBarConfig.slotsPerRow;
        
        // Atualizar visual dos botões
        document.querySelectorAll('.skill-row-btn').forEach(btn => {
            const btnRows = parseInt(btn.dataset.rows);
            if (btnRows === rows) {
                btn.style.background = 'linear-gradient(180deg, #4a3728, #2c1810)';
                btn.style.color = '#ffd700';
                btn.style.border = '2px solid #ffd700';
                btn.style.fontWeight = 'bold';
            } else {
                btn.style.background = '#2c1810';
                btn.style.color = '#aaa';
                btn.style.border = '1px solid #5c3a21';
                btn.style.fontWeight = 'normal';
            }
        });
        
        document.getElementById('total-skills').textContent = this.skillBarConfig.totalSlots;
        this.updateSkillPreview();
    }
    
    setSkillSlots(slots) {
        this.skillBarConfig.slotsPerRow = slots;
        this.skillBarConfig.totalSlots = this.skillBarConfig.rows * slots;
        
        // Atualizar visual dos botões
        document.querySelectorAll('.skill-slot-btn').forEach(btn => {
            const btnSlots = parseInt(btn.dataset.slots);
            if (btnSlots === slots) {
                btn.style.background = 'linear-gradient(180deg, #4a3728, #2c1810)';
                btn.style.color = '#ffd700';
                btn.style.border = '2px solid #ffd700';
                btn.style.fontWeight = 'bold';
            } else {
                btn.style.background = '#2c1810';
                btn.style.color = '#aaa';
                btn.style.border = '1px solid #5c3a21';
                btn.style.fontWeight = 'normal';
            }
        });
        
        document.getElementById('total-skills').textContent = this.skillBarConfig.totalSlots;
        this.updateSkillPreview();
    }
    
    updateSkillPreview() {
        const preview = document.getElementById('skill-preview');
        if (!preview) return;
        
        const rows = this.skillBarConfig.rows;
        const slots = this.skillBarConfig.slotsPerRow;
        
        let html = '';
        for (let r = 0; r < rows; r++) {
            html += '<div style="display: flex; gap: 4px;">';
            for (let s = 0; s < slots; s++) {
                const num = r * slots + s + 1;
                html += `<div style="width: 30px; height: 30px; background: #3d2817; border: 1px solid #5c3a21; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">${num}</div>`;
            }
            html += '</div>';
        }
        preview.innerHTML = html;
    }
    
    updateSkillBarConfig() {
        const rows = parseInt(document.getElementById('skill-rows').value);
        const slots = parseInt(document.getElementById('skill-slots').value);
        
        this.skillBarConfig.rows = rows;
        this.skillBarConfig.slotsPerRow = slots;
        this.skillBarConfig.totalSlots = rows * slots;
        
        // Expandir array de skills se necessário
        while (this.skills.length < this.skillBarConfig.totalSlots) {
            const idx = this.skills.length;
            this.skills.push({
                key: (idx + 1).toString(),
                name: 'Vazio',
                icon: '',
                cd: 0,
                maxCd: 0
            });
        }
        
        this.renderSkillSlots();
        console.log(`⚔️ Skill bars atualizadas: ${rows} rows x ${slots} slots = ${this.skillBarConfig.totalSlots} total`);
    }
    
    saveSettings() {
        const settings = {
            skillBarConfig: this.skillBarConfig,
            isMuted: this.isMuted
        };
        localStorage.setItem('gameHUD_settings', JSON.stringify(settings));
        alert('✅ Configurações salvas!');
        console.log('💾 Configurações salvas:', settings);
    }
    
    loadSettings() {
        const saved = localStorage.getItem('gameHUD_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.skillBarConfig = settings.skillBarConfig || this.skillBarConfig;
            this.isMuted = settings.isMuted || false;
            console.log('📂 Configurações carregadas:', settings);
        }
    }
    
    updateVolume(type, value) {
        document.getElementById(`vol-${type}-text`).textContent = value + '%';
        console.log(`🔊 Volume ${type}: ${value}%`);
    }
    
    createShopPanel() {
        const panel = document.createElement('div');
        panel.id = 'panel-shop';
        panel.style.cssText = this.getPanelStyle();
        panel.style.display = 'none';
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #5c3a21; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #ffd700; font-size: 18px;">🏪 Loja do Comerciante</h2>
                <button onclick="window.gameHUD.closeAllPanels()" style="background: #8b0000; color: #fff; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px;">✕</button>
            </div>
            <div style="padding: 20px; text-align: center; color: #888;">
                <p style="margin-bottom: 15px;">💰 Procure um NPC comerciante nas cidades para acessar a loja completa!</p>
                <p style="font-size: 12px; color: #aaa;">Itens básicos disponíveis:</p>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 15px;">
                    <div style="padding: 15px; background: rgba(44,24,16,0.85); border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid #5c3a21;" onmouseover="this.style.borderColor='#d4a574'" onmouseout="this.style.borderColor='#5c3a21'" onclick="alert('🧪 Poção de Vida comprada!')">
                        <div style="font-size: 28px; margin-bottom: 5px;">🧪</div>
                        <div style="font-size: 11px; color: #d4a574;">Poção Vida</div>
                        <div style="font-size: 10px; color: #ffd700; margin-top: 3px;">10 💰</div>
                    </div>
                    <div style="padding: 15px; background: rgba(44,24,16,0.85); border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid #5c3a21;" onmouseover="this.style.borderColor='#d4a574'" onmouseout="this.style.borderColor='#5c3a21'" onclick="alert('💊 Poção de Mana comprada!')">
                        <div style="font-size: 28px; margin-bottom: 5px;">💊</div>
                        <div style="font-size: 11px; color: #d4a574;">Poção Mana</div>
                        <div style="font-size: 10px; color: #ffd700; margin-top: 3px;">15 💰</div>
                    </div>
                    <div style="padding: 15px; background: rgba(44,24,16,0.85); border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid #5c3a21;" onmouseover="this.style.borderColor='#d4a574'" onmouseout="this.style.borderColor='#5c3a21'" onclick="alert('🍞 Pão comprado!')">
                        <div style="font-size: 28px; margin-bottom: 5px;">🍞</div>
                        <div style="font-size: 11px; color: #d4a574;">Pão</div>
                        <div style="font-size: 10px; color: #ffd700; margin-top: 3px;">5 💰</div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.appendChild(panel);
        this.panels.shop = panel;
    }
    
    createReputationPanel() {
        const panel = document.createElement('div');
        panel.id = 'panel-reputation';
        panel.style.cssText = this.getPanelStyle();
        panel.style.display = 'none';
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #5c3a21; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #ffd700; font-size: 18px;">⚖️ Reputação</h2>
                <button onclick="window.gameHUD.closeAllPanels()" style="background: #8b0000; color: #fff; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px;">✕</button>
            </div>
            <div style="padding: 10px;">
                <div style="margin-bottom: 15px; padding: 12px; background: rgba(44,24,16,0.85); border-radius: 8px; border: 1px solid #5c3a21;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: #4CAF50; font-weight: bold;">🌿 Verdantis</span>
                        <span style="color: #ffd700; font-size: 12px;">Amigável</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                        <div style="width: 65%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 4px;"></div>
                    </div>
                    <div style="font-size: 10px; color: #888; margin-top: 3px; text-align: right;">3250 / 5000</div>
                </div>
                <div style="margin-bottom: 15px; padding: 12px; background: rgba(44,24,16,0.85); border-radius: 8px; border: 1px solid #5c3a21;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: #2196F3; font-weight: bold;">🏰 Eldoria</span>
                        <span style="color: #aaa; font-size: 12px;">Neutro</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                        <div style="width: 45%; height: 100%; background: linear-gradient(90deg, #2196F3, #64B5F6); border-radius: 4px;"></div>
                    </div>
                    <div style="font-size: 10px; color: #888; margin-top: 3px; text-align: right;">1120 / 2500</div>
                </div>
                <div style="margin-bottom: 15px; padding: 12px; background: rgba(44,24,16,0.85); border-radius: 8px; border: 1px solid #5c3a21;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: #f44336; font-weight: bold;">👺 Goblins</span>
                        <span style="color: #f44336; font-size: 12px;">Hostil</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                        <div style="width: 10%; height: 100%; background: linear-gradient(90deg, #f44336, #ef5350); border-radius: 4px;"></div>
                    </div>
                    <div style="font-size: 10px; color: #888; margin-top: 3px; text-align: right;">-1200 / -3000</div>
                </div>
            </div>
        `;
        
        this.container.appendChild(panel);
        this.panels.reputation = panel;
    }
    
    createCharacterPanel() {
        const panel = document.createElement('div');
        panel.id = 'panel-character';
        panel.style.cssText = this.getPanelStyle();
        panel.style.display = 'none';
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #5c3a21; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #ffd700; font-size: 18px;">👤 Personagem</h2>
                <button onclick="window.gameHUD.closeAllPanels()" style="background: #8b0000; color: #fff; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px;">✕</button>
            </div>
            <div style="text-align: center; padding: 30px;">
                <div id="char-icon" style="font-size: 64px; margin-bottom: 15px; filter: drop-shadow(0 0 10px rgba(255,215,0,0.3));">⚔️</div>
                <div id="char-name" style="font-size: 18px; color: #ffd700; font-weight: bold; margin-bottom: 5px;">Player</div>
                <div id="char-class" style="font-size: 14px; color: #d4a574; margin-bottom: 20px;">Aprendiz Nível 1</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; text-align: left; margin-top: 20px; padding: 20px; background: rgba(44,24,16,0.6); border-radius: 10px;">
                    <div style="color: #aaa; font-size: 12px;">❤️ Vida: <span style="color: #ff6b6b;">100/100</span></div>
                    <div style="color: #aaa; font-size: 12px;">💧 Mana: <span style="color: #6b9aff;">50/50</span></div>
                    <div style="color: #aaa; font-size: 12px;">⚔️ Força: <span style="color: #d4a574;">10</span></div>
                    <div style="color: #aaa; font-size: 12px;">🛡️ Defesa: <span style="color: #d4a574;">5</span></div>
                    <div style="color: #aaa; font-size: 12px;">⚡ Agilidade: <span style="color: #d4a574;">8</span></div>
                    <div style="color: #aaa; font-size: 12px;">🔮 Inteligência: <span style="color: #d4a574;">6</span></div>
                </div>
            </div>
        `;
        this.container.appendChild(panel);
        this.panels.character = panel;
    }
    
    createQuestsPanel() {
        const panel = document.createElement('div');
        panel.id = 'panel-quests';
        panel.style.cssText = this.getPanelStyle();
        panel.style.display = 'none';
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #5c3a21; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #ffd700; font-size: 18px;">📜 Quest Log</h2>
                <button onclick="window.gameHUD.closeAllPanels()" style="background: #8b0000; color: #fff; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px;">✕</button>
            </div>
            <div id="panel-quest-list" style="max-height: 350px; overflow-y: auto;"></div>
        `;
        this.container.appendChild(panel);
        this.panels.quests = panel;
    }
    
    createInventoryPanel() {
        const panel = document.createElement('div');
        panel.id = 'panel-inventory';
        panel.style.cssText = this.getPanelStyle();
        panel.style.display = 'none';
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #5c3a21; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #ffd700; font-size: 18px;">🎒 Inventário</h2>
                <button onclick="window.gameHUD.closeAllPanels()" style="background: #8b0000; color: #fff; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px;">✕</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; padding: 15px; background: rgba(44,24,16,0.6); border-radius: 8px;">
                ${Array(24).fill(0).map((_, i) => `
                    <div style="width: 45px; height: 45px; background: rgba(44,24,16,0.8); border: 1px solid #5c3a21; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#d4a574'" onmouseout="this.style.borderColor='#5c3a21'"></div>
                `).join('')}
            </div>
            <div style="margin-top: 15px; padding: 12px; background: rgba(44,24,16,0.6); border-radius: 8px; text-align: center;">
                <span style="color: #888; font-size: 12px;">💰 Ouro: </span>
                <span id="inv-gold" style="color: #ffd700; font-weight: bold;">0</span>
            </div>
        `;
        this.container.appendChild(panel);
        this.panels.inventory = panel;
    }
    
    createMapPanel() {
        const panel = document.createElement('div');
        panel.id = 'panel-map';
        panel.style.cssText = this.getPanelStyle();
        panel.style.width = '650px';
        panel.style.height = '550px';
        panel.style.display = 'none';
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #5c3a21; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #ffd700; font-size: 18px;">🗺️ Mapa Mundial</h2>
                <button onclick="window.gameHUD.closeAllPanels()" style="background: #8b0000; color: #fff; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px;">✕</button>
            </div>
            <div style="width: 100%; height: 420px; background: linear-gradient(135deg, #1a3a1a 0%, #0d1f0d 100%); border-radius: 10px; border: 2px solid #5c3a21; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #4CAF50; font-size: 20px;">
                <div style="font-size: 48px; margin-bottom: 15px;">🌍</div>
                <div style="font-weight: bold;">Mapa de Aethelgard</div>
                <div style="font-size: 13px; color: #888; margin-top: 10px;">Verdantis • Eldoria • Dracônia • Aurélia</div>
                <div style="font-size: 11px; color: #666; margin-top: 20px;">(Mapa interativo em desenvolvimento)</div>
            </div>
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 15px;">
                <span style="font-size: 11px; color: #4CAF50;">● Zona Segura</span>
                <span style="font-size: 11px; color: #f44336;">● Zona de Combate</span>
                <span style="font-size: 11px; color: #ffd700;">● Cidades</span>
            </div>
        `;
        this.container.appendChild(panel);
        this.panels.map = panel;
    }
    
    getPanelStyle() {
        return `
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 420px; max-height: 550px;
            background: rgba(15, 12, 8, 0.98); border: 2px solid #5c3a21;
            border-radius: 12px; padding: 20px; pointer-events: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.9); overflow-y: auto;
        `;
    }
    
    togglePanel(panelId) {
        if (this.openPanel === panelId) {
            this.closeAllPanels();
            return;
        }
        
        this.closeAllPanels();
        
        const panel = this.panels[panelId];
        if (panel) {
            panel.style.display = 'block';
            this.openPanel = panelId;
            
            if (panelId === 'quests') {
                this.updateQuestPanel();
            }
        }
    }
    
    closeAllPanels() {
        Object.values(this.panels).forEach(p => p.style.display = 'none');
        this.openPanel = null;
    }
    
    updateQuestPanel() {
        const list = document.getElementById('panel-quest-list');
        if (!list) return;
        
        list.innerHTML = this.activeQuests.map(q => `
            <div style="padding: 15px; margin-bottom: 12px; background: rgba(44,24,16,0.85); border: 1px solid #5c3a21; border-radius: 10px;">
                <div style="font-weight: bold; color: #ffd700; margin-bottom: 10px; font-size: 14px;">${q.title}</div>
                ${q.steps.map(s => `
                    <div style="font-size: 12px; color: ${s.completed ? '#4CAF50' : '#aaa'}; margin: 5px 0; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 14px;">${s.completed ? '✅' : '⬜'}</span>
                        <span>${s.text} <span style="color: #888;">(${s.current}/${s.total})</span></span>
                    </div>
                `).join('')}
                <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #444; font-size: 11px; color: #888;">
                    Recompensa: <span style="color: #ffd700;">${q.rewards.xp} XP</span>, <span style="color: #ffd700;">${q.rewards.gold} 💰</span>
                </div>
            </div>
        `).join('');
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            if (e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                if (index < this.skillBarConfig.totalSlots) {
                    this.useSkill(index);
                }
            }
            
            switch(key) {
                case 'c': this.togglePanel('character'); break;
                case 'l': this.togglePanel('quests'); break;
                case 'i': this.togglePanel('inventory'); break;
                case 'm': this.togglePanel('map'); break;
                case 'g': this.togglePanel('guild'); break;
                case 'h': this.togglePanel('shop'); break;
                case 'r': this.togglePanel('reputation'); break;
                case 'o': this.togglePanel('settings'); break;
                case 'escape': this.closeAllPanels(); break;
            }
        });
    }
    
    useSkill(index) {
        const skill = this.skills[index];
        if (!skill || !skill.icon || skill.cd > 0) return;
        
        skill.cd = skill.maxCd;
        console.log(`⚡ Skill: ${skill.name}`);
        
        const slot = document.querySelector(`.hud-skill[data-index="${index}"] .skill-cd`);
        if (slot) {
            slot.style.display = 'flex';
            slot.textContent = skill.cd;
            
            const interval = setInterval(() => {
                skill.cd -= 0.1;
                if (skill.cd <= 0) {
                    skill.cd = 0;
                    slot.style.display = 'none';
                    clearInterval(interval);
                } else {
                    slot.textContent = skill.cd.toFixed(1);
                }
            }, 100);
        }
    }
    
    updatePlayerData() {
        if (!this.player) return;
        
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        const mpPercent = (this.player.mana / this.player.maxMana) * 100;
        const xpPercent = (this.player.xp / this.player.xpToNext) * 100;
        
        const hpFill = document.getElementById('hud-hp-fill');
        const hpText = document.getElementById('hud-hp-text');
        const mpFill = document.getElementById('hud-mp-fill');
        const mpText = document.getElementById('hud-mp-text');
        const xpFill = document.getElementById('hud-xp-fill');
        const xpText = document.getElementById('hud-xp-text');
        
        if (hpFill) hpFill.style.width = `${Math.max(0, Math.min(100, hpPercent))}%`;
        if (hpText) hpText.textContent = `${Math.floor(this.player.hp)}/${this.player.maxHp}`;
        if (mpFill) mpFill.style.width = `${Math.max(0, Math.min(100, mpPercent))}%`;
        if (mpText) mpText.textContent = `${Math.floor(this.player.mana)}/${this.player.maxMana}`;
        if (xpFill) xpFill.style.width = `${Math.max(0, Math.min(100, xpPercent))}%`;
        if (xpText) xpText.textContent = `${this.player.xp}/${this.player.xpToNext}`;
        
        const nameEl = document.getElementById('hud-player-name');
        const infoEl = document.getElementById('hud-player-info');
        const goldEl = document.getElementById('hud-gold');
        const iconEl = document.getElementById('hud-class-icon');
        
        if (nameEl) nameEl.textContent = this.player.name || 'Player';
        if (infoEl) infoEl.textContent = `${this.player.class || 'Aprendiz'} Nível ${this.player.level || 1}`;
        if (goldEl) goldEl.textContent = this.player.gold || 0;
        
        if (iconEl) {
            const classColors = {
                'Guerreiro': '#C79C6E', 'Arqueiro': '#A9D271', 'Mago': '#3FC7EB',
                'Ladino': '#FFF569', 'Sacerdote': '#FFFFFF', 'Druida': '#FF7D0A',
                'Bruxo': '#9482C9', 'Monge': '#00FF96', 'Aprendiz': '#9D9D9D'
            };
            iconEl.textContent = this.getClassIcon(this.player.class);
            iconEl.style.color = classColors[this.player.class] || '#ffd700';
        }
        
        // Atualizar painel de personagem se aberto
        const charIcon = document.getElementById('char-icon');
        const charName = document.getElementById('char-name');
        const charClass = document.getElementById('char-class');
        const invGold = document.getElementById('inv-gold');
        
        if (charIcon) charIcon.textContent = this.getClassIcon(this.player.class);
        if (charName) charName.textContent = this.player.name || 'Player';
        if (charClass) charClass.textContent = `${this.player.class || 'Aprendiz'} Nível ${this.player.level || 1}`;
        if (invGold) invGold.textContent = this.player.gold || 0;
        
        this.updateMinimap();
    }
    
    getClassIcon(className) {
        const icons = { 
            'Guerreiro': '⚔️', 'Arqueiro': '🏹', 'Mago': '🔮', 'Ladino': '🗡️',
            'Sacerdote': '✝️', 'Druida': '🌿', 'Bruxo': '☠️', 'Monge': '🥋',
            'Aprendiz': '📖', 'Apprentice': '📖', 'Warrior': '⚔️', 'Archer': '🏹', 
            'Mage': '🔮', 'Rogue': '🗡️', 'Priest': '✝️', 'Druid': '🌿', 
            'Warlock': '☠️', 'Monk': '🥋'
        };
        return icons[className] || '⚔️';
    }
    
    updateMinimap() {
        if (!this.minimapCtx || !this.game) return;
        
        const ctx = this.minimapCtx;
        const size = 150;
        const center = size / 2;
        
        ctx.clearRect(0, 0, size, size);
        
        // Fundo
        ctx.fillStyle = '#1a2a15';
        ctx.beginPath();
        ctx.arc(center, center, center - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Grid sutil
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < size; i += 15) {
            ctx.beginPath();
            ctx.moveTo(i, 0); ctx.lineTo(i, size);
            ctx.moveTo(0, i); ctx.lineTo(size, i);
            ctx.stroke();
        }
        
        // Player (triângulo apontando para cima)
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(center, center - 8);
        ctx.lineTo(center - 6, center + 4);
        ctx.lineTo(center + 6, center + 4);
        ctx.closePath();
        ctx.fill();
        
        // Mobs
        if (this.game.mobs) {
            this.game.mobs.forEach(mob => {
                if (!mob.isAlive) return;
                const dx = ((mob.x - this.player.x) * 0.1) + center;
                const dy = ((mob.y - this.player.y) * 0.1) + center;
                if (dx > 5 && dx < size - 5 && dy > 5 && dy < size - 5) {
                    ctx.fillStyle = '#ff4444';
                    ctx.beginPath();
                    ctx.arc(dx, dy, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
        
        // Borda
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(center, center, center - 4, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    updateQuestDisplay() {
        const list = document.getElementById('hud-quest-list');
        if (!list) return;
        
        list.innerHTML = this.activeQuests.map(q => `
            <div style="padding: 10px; margin-bottom: 8px; background: rgba(44,24,16,0.7); border-radius: 6px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent;" 
                 onmouseover="this.style.background='rgba(44,24,16,0.9)'; this.style.borderColor='#5c3a21'" 
                 onmouseout="this.style.background='rgba(44,24,16,0.7)'; this.style.borderColor='transparent'"
                 onclick="window.gameHUD.togglePanel('quests')">
                <div style="font-weight: bold; color: #ffd700; font-size: 11px; margin-bottom: 5px;">${q.title}</div>
                ${q.steps.slice(0, 2).map(s => `
                    <div style="font-size: 10px; color: ${s.completed ? '#4CAF50' : '#aaa'}; margin: 2px 0;">
                        ${s.completed ? '✅' : '⏳'} ${s.text} <span style="color:#666">${s.current}/${s.total}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }
    
    update(deltaTime) {
        this.updatePlayerData();
    }
}

window.GameHUD = GameHUD;
