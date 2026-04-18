/**
 * HUDManager.js
 * Interface do jogo - Independente, lê GameplayEngine.state e atualiza DOM
 * Versão: 1.0 MVP Core
 */

class HUDManager {
    constructor(gameplayEngine) {
        this.engine = gameplayEngine;
        this.container = null;
        this.elements = {};
        this.updateInterval = null;
        this.lastState = null;
        
        // Configurações de atualização
        this.config = {
            updateRate: 100, // ms entre atualizações (10fps é suficiente para UI)
            showDebug: false
        };
        
        console.log('✅ HUDManager criado');
    }
    
    /**
     * Inicializa o HUD - cria elementos DOM
     */
    init() {
        this.createContainer();
        this.createPlayerPanel();
        this.createXPBar();
        this.createSkillBar();
        this.createMinimap();
        this.createCombatLog();
        this.createChatBox();
        this.createFloatingTextContainer();
        this.cacheElements();
        
        console.log('✅ HUD inicializado');
    }
    
    /**
     * Container principal do HUD
     */
    createContainer() {
        // Remover HUD antigo se existir
        const oldHud = document.getElementById('game-hud');
        if (oldHud) oldHud.remove();
        
        this.container = document.createElement('div');
        this.container.id = 'game-hud';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Painel do jogador (HP, MP, Nome, Level)
     */
    createPlayerPanel() {
        const panel = document.createElement('div');
        panel.id = 'hud-player-panel';
        panel.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #444;
            border-radius: 8px;
            padding: 12px;
            color: white;
            min-width: 220px;
            pointer-events: auto;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div id="hud-player-avatar" style="width: 40px; height: 40px; background: #3498db; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">👤</div>
                <div>
                    <div id="hud-player-name" style="font-weight: bold; font-size: 16px;">Jogador</div>
                    <div style="font-size: 12px; color: #aaa;">
                        <span id="hud-player-class">Aprendiz</span> 
                        <span style="color: #ffd700;">Lv <span id="hud-player-level">1</span></span>
                    </div>
                </div>
            </div>
            
            <!-- HP Bar -->
            <div style="margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                    <span style="color: #e74c3c;">HP</span>
                    <span id="hud-hp-text">100/100</span>
                </div>
                <div style="width: 100%; height: 14px; background: #333; border-radius: 7px; overflow: hidden; border: 1px solid #555;">
                    <div id="hud-hp-bar" style="width: 100%; height: 100%; background: linear-gradient(90deg, #e74c3c, #c0392b); transition: width 0.2s ease;"></div>
                </div>
            </div>
            
            <!-- MP Bar -->
            <div style="margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                    <span style="color: #3498db;">MP</span>
                    <span id="hud-mp-text">50/50</span>
                </div>
                <div style="width: 100%; height: 10px; background: #333; border-radius: 5px; overflow: hidden; border: 1px solid #555;">
                    <div id="hud-mp-bar" style="width: 100%; height: 100%; background: linear-gradient(90deg, #3498db, #2980b9); transition: width 0.2s ease;"></div>
                </div>
            </div>
            
            <!-- Stats (colapsável) -->
            <div id="hud-stats" style="font-size: 10px; color: #aaa; border-top: 1px solid #444; padding-top: 6px; margin-top: 6px; display: none;">
                STR: <span id="hud-stat-str">10</span> | 
                AGI: <span id="hud-stat-agi">10</span> | 
                INT: <span id="hud-stat-int">10</span>
            </div>
        `;
        
        this.container.appendChild(panel);
        
        // Toggle stats on click
        panel.addEventListener('click', (e) => {
            if (e.target.closest('#hud-player-avatar') || e.target.closest('#hud-player-name')) {
                const stats = panel.querySelector('#hud-stats');
                stats.style.display = stats.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
    
    /**
     * Barra de XP
     */
    createXPBar() {
        const xpContainer = document.createElement('div');
        xpContainer.id = 'hud-xp-container';
        xpContainer.style.cssText = `
            position: absolute;
            top: 110px;
            left: 10px;
            right: 170px;
            height: 20px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 3px;
            border: 1px solid #444;
        `;
        
        xpContainer.innerHTML = `
            <div id="hud-xp-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #9b59b6, #8e44ad); border-radius: 7px; transition: width 0.3s ease;"></div>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 11px; text-shadow: 1px 1px 2px black; font-weight: bold;">
                XP: <span id="hud-xp-text">0/100</span>
            </div>
        `;
        
        this.container.appendChild(xpContainer);
    }
    
    /**
     * Barra de Skills (8 slots)
     */
    createSkillBar() {
        const skillBar = document.createElement('div');
        skillBar.id = 'hud-skill-bar';
        skillBar.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            pointer-events: auto;
            background: rgba(0, 0, 0, 0.6);
            padding: 8px;
            border-radius: 8px;
            border: 2px solid #444;
        `;
        
        for (let i = 1; i <= 8; i++) {
            const slot = document.createElement('div');
            slot.className = 'skill-slot';
            slot.dataset.slot = i;
            slot.style.cssText = `
                width: 50px;
                height: 50px;
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid #555;
                border-radius: 6px;
                position: relative;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.1s;
            `;
            
            slot.innerHTML = `
                <div class="skill-icon" style="font-size: 24px; filter: grayscale(0.3);">❔</div>
                <div class="skill-key" style="position: absolute; bottom: 2px; right: 4px; font-size: 10px; color: #aaa; font-weight: bold;">${i}</div>
                <div class="cooldown-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 0%; background: rgba(0, 0, 0, 0.7); transition: height 0.1s; border-radius: 4px;"></div>
                <div class="skill-mana" style="position: absolute; top: 2px; left: 2px; font-size: 9px; color: #3498db; display: none;">⚡</div>
            `;
            
            // Hover effect
            slot.addEventListener('mouseenter', () => {
                slot.style.borderColor = '#888';
                slot.style.transform = 'scale(1.05)';
            });
            
            slot.addEventListener('mouseleave', () => {
                slot.style.borderColor = '#555';
                slot.style.transform = 'scale(1)';
            });
            
            // Click
            slot.addEventListener('click', () => {
                this.onSkillClick?.(i);
            });
            
            skillBar.appendChild(slot);
        }
        
        this.container.appendChild(skillBar);
    }
    
    /**
     * Minimap
     */
    createMinimap() {
        const minimap = document.createElement('div');
        minimap.id = 'hud-minimap';
        minimap.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            width: 150px;
            height: 150px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #444;
            border-radius: 50%;
            overflow: hidden;
            pointer-events: auto;
        `;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'hud-minimap-canvas';
        canvas.width = 150;
        canvas.height = 150;
        canvas.style.cssText = 'width: 100%; height: 100%;';
        
        minimap.appendChild(canvas);
        this.container.appendChild(minimap);
    }
    
    /**
     * Combat Log
     */
    createCombatLog() {
        const combatLog = document.createElement('div');
        combatLog.id = 'hud-combat-log';
        combatLog.style.cssText = `
            position: absolute;
            top: 140px;
            right: 10px;
            width: 200px;
            max-height: 200px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid #444;
            border-radius: 4px;
            padding: 8px;
            overflow-y: auto;
            font-size: 11px;
            color: white;
            pointer-events: auto;
        `;
        
        combatLog.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; color: #f39c12; font-size: 12px; border-bottom: 1px solid #444; padding-bottom: 4px;">
                ⚔️ Combat Log
            </div>
            <div id="hud-combat-entries"></div>
        `;
        
        this.container.appendChild(combatLog);
        
        // Auto-scroll
        combatLog.addEventListener('DOMNodeInserted', () => {
            combatLog.scrollTop = combatLog.scrollHeight;
        });
    }
    
    /**
     * Chat Box
     */
    createChatBox() {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'hud-chat-container';
        chatContainer.style.cssText = `
            position: absolute;
            bottom: 90px;
            left: 10px;
            width: 300px;
            display: none;
            pointer-events: auto;
        `;
        
        chatContainer.innerHTML = `
            <div id="hud-chat-messages" style="max-height: 150px; overflow-y: auto; background: rgba(0, 0, 0, 0.7); border-radius: 4px 4px 0 0; padding: 8px; font-size: 12px; color: white;">
                <div style="color: #888;">Pressione Enter para digitar...</div>
            </div>
            <input type="text" id="hud-chat-input" placeholder="Digite sua mensagem..." style="width: 100%; padding: 6px; background: rgba(0, 0, 0, 0.9); border: none; border-radius: 0 0 4px 4px; color: white; outline: none; font-size: 12px;">
        `;
        
        this.container.appendChild(chatContainer);
        
        // Input handling
        const input = chatContainer.querySelector('#hud-chat-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const message = input.value.trim();
                if (message) {
                    this.onChatMessage?.(message);
                    input.value = '';
                }
                this.hideChat();
            } else if (e.key === 'Escape') {
                this.hideChat();
            }
        });
    }
    
    /**
     * Container para floating texts
     */
    createFloatingTextContainer() {
        const container = document.createElement('div');
        container.id = 'hud-floating-texts';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 999;
        `;
        
        document.body.appendChild(container);
    }
    
    /**
     * Cache de elementos DOM para atualização rápida
     */
    cacheElements() {
        this.elements = {
            // Player
            playerName: document.getElementById('hud-player-name'),
            playerClass: document.getElementById('hud-player-class'),
            playerLevel: document.getElementById('hud-player-level'),
            playerAvatar: document.getElementById('hud-player-avatar'),
            
            // HP/MP
            hpBar: document.getElementById('hud-hp-bar'),
            hpText: document.getElementById('hud-hp-text'),
            mpBar: document.getElementById('hud-mp-bar'),
            mpText: document.getElementById('hud-mp-text'),
            
            // XP
            xpBar: document.getElementById('hud-xp-bar'),
            xpText: document.getElementById('hud-xp-text'),
            
            // Stats
            statStr: document.getElementById('hud-stat-str'),
            statAgi: document.getElementById('hud-stat-agi'),
            statInt: document.getElementById('hud-stat-int'),
            
            // Combat Log
            combatEntries: document.getElementById('hud-combat-entries'),
            
            // Chat
            chatContainer: document.getElementById('hud-chat-container'),
            chatMessages: document.getElementById('hud-chat-messages'),
            chatInput: document.getElementById('hud-chat-input'),
            
            // Skill slots
            skillSlots: []
        };
        
        // Cache skill slots
        for (let i = 1; i <= 8; i++) {
            const slot = document.querySelector(`.skill-slot[data-slot="${i}"]`);
            if (slot) {
                this.elements.skillSlots[i] = {
                    container: slot,
                    icon: slot.querySelector('.skill-icon'),
                    cooldown: slot.querySelector('.cooldown-overlay'),
                    mana: slot.querySelector('.skill-mana')
                };
            }
        }
        
        // Minimap canvas
        this.elements.minimapCanvas = document.getElementById('hud-minimap-canvas');
        this.elements.floatingContainer = document.getElementById('hud-floating-texts');
    }
    
    // ============================================================
    // UPDATE LOOP
    // ============================================================
    
    start() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            this.update();
        }, this.config.updateRate);
        
        console.log('✅ HUDManager atualizando');
    }
    
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    update() {
        if (!this.engine) return;
        
        const state = this.engine.state;
        const player = state.player;
        
        // Atualizar dados do player
        this.updatePlayerInfo(player);
        this.updateHPMP(player);
        this.updateXP(player);
        this.updateStats(player);
        this.updateSkillCooldowns(player);
        this.updateMinimap(state);
    }
    
    updatePlayerInfo(player) {
        if (!this.elements.playerName) return;
        
        this.elements.playerName.textContent = player.name || 'Jogador';
        this.elements.playerClass.textContent = this.getClassName(player.class);
        this.elements.playerLevel.textContent = player.level;
        
        // Avatar emoji por classe
        const classEmojis = {
            warrior: '⚔️', mage: '🔮', archer: '🏹', priest: '⭐',
            druid: '🌿', rogue: '🗡️', warlock: '💀', fighter: '👊',
            apprentice: '👤'
        };
        this.elements.playerAvatar.textContent = classEmojis[player.class] || '👤';
    }
    
    updateHPMP(player) {
        // HP
        const hpPct = (player.hp / player.maxHp) * 100;
        this.elements.hpBar.style.width = `${Math.max(0, hpPct)}%`;
        this.elements.hpText.textContent = `${Math.floor(player.hp)}/${player.maxHp}`;
        
        // MP
        const mpPct = (player.mp / player.maxMp) * 100;
        this.elements.mpBar.style.width = `${Math.max(0, mpPct)}%`;
        this.elements.mpText.textContent = `${Math.floor(player.mp)}/${player.maxMp}`;
    }
    
    updateXP(player) {
        const needed = player.level * 100;
        const pct = (player.xp / needed) * 100;
        
        this.elements.xpBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
        this.elements.xpText.textContent = `${player.xp}/${needed}`;
    }
    
    updateStats(player) {
        if (!this.elements.statStr) return;
        
        this.elements.statStr.textContent = Math.floor(player.stats.str);
        this.elements.statAgi.textContent = Math.floor(player.stats.agi);
        this.elements.statInt.textContent = Math.floor(player.stats.int);
    }
    
    updateSkillCooldowns(player) {
        // TODO: integrar com sistema de skills quando disponível
        // Por agora, apenas mostrar slots vazios
    }
    
    updateMinimap(state) {
        const canvas = this.elements.minimapCanvas;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        
        // Limpar
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        
        // Escala
        const scaleX = w / state.map.width;
        const scaleY = h / state.map.height;
        
        // Desenhar obstacles (pontos escuros)
        ctx.fillStyle = '#333';
        for (const obs of state.map.obstacles) {
            const mx = obs.x * scaleX;
            const my = obs.y * scaleY;
            const mw = obs.width * scaleX;
            const mh = obs.height * scaleY;
            ctx.fillRect(mx - mw/2, my - mh/2, mw, mh);
        }
        
        // Desenhar entities (mobs)
        for (const [id, entity] of state.entities) {
            if (entity.type !== 'mob') continue;
            
            const mx = entity.x * scaleX;
            const my = entity.y * scaleY;
            
            ctx.fillStyle = entity.isAggressive ? '#e74c3c' : '#2ecc71';
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Desenhar player (sempre no centro ou posição real)
        const px = state.player.x * scaleX;
        const py = state.player.y * scaleY;
        
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Borda
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w/2, h/2, w/2 - 1, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // ============================================================
    // PUBLIC API
    // ============================================================
    
    /**
     * Define skill em um slot
     */
    setSkill(slot, skillData) {
        if (slot < 1 || slot > 8) return;
        
        const slotEl = this.elements.skillSlots[slot];
        if (!slotEl) return;
        
        slotEl.icon.textContent = skillData.icon || '❔';
        slotEl.icon.style.filter = 'none';
        slotEl.container.title = `${skillData.name}\n${skillData.description || ''}`;
        
        if (skillData.manaCost > 0) {
            slotEl.mana.style.display = 'block';
        }
    }
    
    /**
     * Atualiza cooldown visual de um slot
     */
    setCooldown(slot, current, max) {
        if (slot < 1 || slot > 8) return;
        
        const slotEl = this.elements.skillSlots[slot];
        if (!slotEl) return;
        
        const pct = (current / max) * 100;
        slotEl.cooldown.style.height = `${pct}%`;
        
        if (current > 0) {
            slotEl.icon.style.filter = 'grayscale(1)';
        } else {
            slotEl.icon.style.filter = 'none';
        }
    }
    
    /**
     * Mostra dano como floating text
     */
    showDamage(x, y, amount, isCrit = false) {
        this.createFloatingText(x, y, `-${amount}`, isCrit ? '#ff0' : '#fff', isCrit ? 20 : 16, isCrit);
    }
    
    /**
     * Mostra cura como floating text
     */
    showHeal(x, y, amount) {
        this.createFloatingText(x, y, `+${amount}`, '#2ecc71', 16);
    }
    
    /**
     * Mostra XP ganho
     */
    showXp(amount) {
        const canvas = this.engine?.canvas;
        if (canvas) {
            this.createFloatingText(
                canvas.width / 2,
                canvas.height / 2 - 50,
                `+${amount} XP`,
                '#9b59b6',
                18
            );
        }
    }
    
    /**
     * Cria floating text
     */
    createFloatingText(x, y, text, color, size, isCrit = false) {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-size: ${size}px;
            font-weight: ${isCrit ? 'bold' : 'normal'};
            text-shadow: 2px 2px 4px black;
            pointer-events: none;
            transition: all 1s ease-out;
            transform: translate(-50%, -50%);
            ${isCrit ? 'text-shadow: 0 0 10px ' + color + ';' : ''}
        `;
        
        this.elements.floatingContainer.appendChild(el);
        
        // Animar
        requestAnimationFrame(() => {
            el.style.transform = 'translate(-50%, -150px)';
            el.style.opacity = '0';
        });
        
        // Remover
        setTimeout(() => {
            el.remove();
        }, 1000);
    }
    
    /**
     * Adiciona mensagem ao combat log
     */
    addCombatLog(message, type = 'normal') {
        const entry = document.createElement('div');
        entry.style.cssText = `
            margin-bottom: 2px;
            color: ${this.getCombatLogColor(type)};
        `;
        entry.textContent = message;
        
        this.elements.combatEntries.appendChild(entry);
        
        // Limitar entries
        while (this.elements.combatEntries.children.length > 20) {
            this.elements.combatEntries.removeChild(this.elements.combatEntries.firstChild);
        }
        
        // Auto-scroll
        this.elements.combatEntries.parentElement.scrollTop = 
            this.elements.combatEntries.parentElement.scrollHeight;
    }
    
    getCombatLogColor(type) {
        const colors = {
            damage: '#e74c3c',
            heal: '#2ecc71',
            xp: '#9b59b6',
            loot: '#f39c12',
            system: '#3498db',
            normal: '#fff'
        };
        return colors[type] || colors.normal;
    }
    
    /**
     * Mostra chat
     */
    showChat() {
        this.elements.chatContainer.style.display = 'block';
        this.elements.chatInput.focus();
    }
    
    /**
     * Esconde chat
     */
    hideChat() {
        this.elements.chatContainer.style.display = 'none';
        this.elements.chatInput.blur();
    }
    
    /**
     * Adiciona mensagem ao chat
     */
    addChatMessage(from, message, channel = 'global') {
        const msg = document.createElement('div');
        msg.style.marginBottom = '4px';
        
        const channelColors = {
            global: '#fff',
            party: '#2ecc71',
            guild: '#f39c12',
            whisper: '#9b59b6',
            system: '#e74c3c'
        };
        
        const color = channelColors[channel] || channelColors.global;
        
        msg.innerHTML = `
            <span style="color: #888;">[${channel}]</span>
            <span style="color: ${color}; font-weight: bold;">${from}:</span>
            <span style="color: #ddd;">${message}</span>
        `;
        
        this.elements.chatMessages.appendChild(msg);
        
        // Limitar
        while (this.elements.chatMessages.children.length > 50) {
            this.elements.chatMessages.removeChild(this.elements.chatMessages.firstChild);
        }
        
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }
    
    /**
     * Toggle visibilidade do HUD
     */
    toggle() {
        this.container.style.display = 
            this.container.style.display === 'none' ? 'block' : 'none';
    }
    
    /**
     * Mostra/esconde debug info
     */
    toggleDebug() {
        this.config.showDebug = !this.config.showDebug;
        const stats = document.getElementById('hud-stats');
        if (stats) {
            stats.style.display = this.config.showDebug ? 'block' : 'none';
        }
    }
    
    // ============================================================
    // UTILS
    // ============================================================
    
    getClassName(classId) {
        const names = {
            warrior: 'Guerreiro',
            mage: 'Mago',
            archer: 'Arqueiro',
            priest: 'Sacerdote',
            druid: 'Druida',
            rogue: 'Ladino',
            warlock: 'Bruxo',
            fighter: 'Lutador',
            apprentice: 'Aprendiz'
        };
        return names[classId] || 'Desconhecido';
    }
    
    /**
     * Callbacks configuráveis
     */
    onSkillClick = null;
    onChatMessage = null;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HUDManager;
} else {
    window.HUDManager = HUDManager;
}
