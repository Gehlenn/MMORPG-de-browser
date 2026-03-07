/**
 * HUD System - Heads-Up Display for Game Interface
 * Displays player stats, skills, and real-time information
 * Version 0.3 - First Playable Gameplay Systems
 */

class HUD {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        
        // HUD configuration
        this.config = {
            position: { x: 10, y: 10 },
            width: 300,
            height: 200,
            barHeight: 20,
            barSpacing: 5,
            
            // Colors
            colors: {
                hp: '#ff4444',
                hpBackground: '#330000',
                mana: '#4444ff',
                manaBackground: '#000033',
                xp: '#44ff44',
                xpBackground: '#003300',
                stamina: '#ffaa00',
                staminaBackground: '#332200',
                buff: '#00ff00',
                debuff: '#ff0000',
                border: '#333333',
                text: '#ffffff',
                background: 'rgba(0, 0, 0, 0.8)'
            },
            
            // Animation
            animationSpeed: 0.1,
            pulseSpeed: 0.002
        };
        
        // Player data
        this.player = {
            hp: 100,
            maxHp: 100,
            mana: 50,
            maxMana: 50,
            xp: 0,
            maxXp: 100,
            level: 1,
            stamina: 100,
            maxStamina: 100,
            gearScore: 0,
            name: 'Player'
        };
        
        // Status effects
        this.buffs = [];
        this.debuffs = [];
        
        // Skill hotbar
        this.hotbar = {
            skills: new Array(6).fill(null),
            cooldowns: new Array(6).fill(0),
            activeSlot: 0
        };
        
        // Animation states
        this.animations = {
            hp: { current: 100, target: 100 },
            mana: { current: 50, target: 50 },
            xp: { current: 0, target: 0 },
            stamina: { current: 100, target: 100 }
        };
        
        // UI elements
        this.elements = {};
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.createHUDElements();
        this.setupEventListeners();
        this.startAnimationLoop();
        
        console.log('HUD System initialized');
    }
    
    createHUDElements() {
        // Create main HUD container
        const hudContainer = document.createElement('div');
        hudContainer.id = 'hud-container';
        hudContainer.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 300px;
            background: ${this.config.colors.background};
            border: 2px solid ${this.config.colors.border};
            border-radius: 8px;
            padding: 10px;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: ${this.config.colors.text};
            z-index: 1000;
            user-select: none;
        `;
        
        // Player info section
        const playerInfo = document.createElement('div');
        playerInfo.id = 'player-info';
        playerInfo.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span id="player-name">Player</span>
                <span id="player-level">Level 1</span>
                <span id="player-gs">GS: 0</span>
            </div>
        `;
        
        // Health bar
        const hpBar = this.createStatusBar('hp', 'HP');
        
        // Mana bar
        const manaBar = this.createStatusBar('mana', 'MP');
        
        // XP bar
        const xpBar = this.createStatusBar('xp', 'XP');
        
        // Stamina bar
        const staminaBar = this.createStatusBar('stamina', 'Stamina');
        
        // Status effects section
        const statusEffects = document.createElement('div');
        statusEffects.id = 'status-effects';
        statusEffects.style.cssText = `
            margin-top: 10px;
            display: flex;
            gap: 5px;
            min-height: 30px;
        `;
        
        // Assemble HUD
        hudContainer.appendChild(playerInfo);
        hudContainer.appendChild(hpBar.container);
        hudContainer.appendChild(manaBar.container);
        hudContainer.appendChild(xpBar.container);
        hudContainer.appendChild(staminaBar.container);
        hudContainer.appendChild(statusEffects);
        
        document.body.appendChild(hudContainer);
        
        // Store references
        this.elements.hudContainer = hudContainer;
        this.elements.playerInfo = playerInfo;
        this.elements.hpBar = hpBar;
        this.elements.manaBar = manaBar;
        this.elements.xpBar = xpBar;
        this.elements.staminaBar = staminaBar;
        this.elements.statusEffects = statusEffects;
        
        // Create skill hotbar
        this.createSkillHotbar();
    }
    
    createStatusBar(type, label) {
        const container = document.createElement('div');
        container.style.cssText = `
            margin-bottom: ${this.config.barSpacing}px;
        `;
        
        const labelDiv = document.createElement('div');
        labelDiv.textContent = label;
        labelDiv.style.cssText = `
            font-size: 12px;
            margin-bottom: 2px;
        `;
        
        const barContainer = document.createElement('div');
        barContainer.style.cssText = `
            width: 100%;
            height: ${this.config.barHeight}px;
            background: ${this.config.colors[`${type}Background`]};
            border: 1px solid ${this.config.colors.border};
            border-radius: 3px;
            overflow: hidden;
            position: relative;
        `;
        
        const barFill = document.createElement('div');
        barFill.id = `${type}-fill`;
        barFill.style.cssText = `
            height: 100%;
            background: ${this.config.colors[type]};
            width: 100%;
            transition: width 0.3s ease;
            position: relative;
        `;
        
        const barText = document.createElement('div');
        barText.id = `${type}-text`;
        barText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 10px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            z-index: 1;
        `;
        
        barContainer.appendChild(barFill);
        barContainer.appendChild(barText);
        container.appendChild(labelDiv);
        container.appendChild(barContainer);
        
        return {
            container: container,
            fill: barFill,
            text: barText
        };
    }
    
    createSkillHotbar() {
        const hotbarContainer = document.createElement('div');
        hotbarContainer.id = 'skill-hotbar';
        hotbarContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 5px;
            background: ${this.config.colors.background};
            border: 2px solid ${this.config.colors.border};
            border-radius: 8px;
            padding: 10px;
            z-index: 1000;
        `;
        
        // Create 6 skill slots
        for (let i = 0; i < 6; i++) {
            const slot = document.createElement('div');
            slot.className = 'skill-slot';
            slot.id = `skill-slot-${i}`;
            slot.style.cssText = `
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid ${this.config.colors.border};
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                position: relative;
                transition: all 0.2s ease;
            `;
            
            // Skill number
            const number = document.createElement('div');
            number.textContent = i + 1;
            number.style.cssText = `
                position: absolute;
                top: 2px;
                left: 2px;
                font-size: 10px;
                color: ${this.config.colors.text};
                opacity: 0.7;
            `;
            
            // Skill icon
            const icon = document.createElement('div');
            icon.className = 'skill-icon';
            icon.style.cssText = `
                width: 30px;
                height: 30px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            `;
            
            // Cooldown overlay
            const cooldown = document.createElement('div');
            cooldown.className = 'cooldown-overlay';
            cooldown.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 3px;
                display: none;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
                font-weight: bold;
            `;
            
            slot.appendChild(number);
            slot.appendChild(icon);
            slot.appendChild(cooldown);
            hotbarContainer.appendChild(slot);
            
            // Add hover effect
            slot.addEventListener('mouseenter', () => {
                if (this.hotbar.skills[i]) {
                    slot.style.background = 'rgba(255, 255, 255, 0.2)';
                    slot.style.transform = 'scale(1.05)';
                }
            });
            
            slot.addEventListener('mouseleave', () => {
                slot.style.background = 'rgba(255, 255, 255, 0.1)';
                slot.style.transform = 'scale(1)';
            });
            
            // Add click handler
            slot.addEventListener('click', () => {
                this.useSkill(i);
            });
        }
        
        document.body.appendChild(hotbarContainer);
        this.elements.hotbarContainer = hotbarContainer;
    }
    
    setupEventListeners() {
        // Keyboard input for skills
        document.addEventListener('keydown', (e) => {
            const key = parseInt(e.key);
            if (key >= 1 && key <= 6) {
                this.useSkill(key - 1);
            }
        });
        
        // Listen to game events
        this.game.on('playerStatsUpdate', (data) => {
            this.updatePlayerStats(data);
        });
        
        this.game.on('statusEffectApplied', (data) => {
            this.addStatusEffect(data);
        });
        
        this.game.on('statusEffectRemoved', (data) => {
            this.removeStatusEffect(data.id);
        });
        
        this.game.on('skillCooldown', (data) => {
            this.updateSkillCooldown(data.slot, data.duration);
        });
        
        // Network events
        if (this.game.socket) {
            this.game.socket.on('player_stats', (data) => {
                this.updatePlayerStats(data);
            });
            
            this.game.socket.on('status_effects', (data) => {
                this.updateStatusEffects(data);
            });
            
            this.game.socket.on('skill_cooldown', (data) => {
                this.updateSkillCooldown(data.slot, data.duration);
            });
        }
    }
    
    startAnimationLoop() {
        setInterval(() => {
            this.updateAnimations();
        }, 16); // ~60 FPS
    }
    
    // Update methods
    updatePlayerStats(stats) {
        if (stats.hp !== undefined) {
            this.player.hp = stats.hp;
            this.player.maxHp = stats.maxHp || this.player.maxHp;
            this.animations.hp.target = (stats.hp / stats.maxHp) * 100;
        }
        
        if (stats.mana !== undefined) {
            this.player.mana = stats.mana;
            this.player.maxMana = stats.maxMana || this.player.maxMana;
            this.animations.mana.target = (stats.mana / stats.maxMana) * 100;
        }
        
        if (stats.xp !== undefined) {
            this.player.xp = stats.xp;
            this.player.maxXp = stats.maxXp || this.player.maxXp;
            this.animations.xp.target = (stats.xp / stats.maxXp) * 100;
        }
        
        if (stats.stamina !== undefined) {
            this.player.stamina = stats.stamina;
            this.player.maxStamina = stats.maxStamina || this.player.maxStamina;
            this.animations.stamina.target = (stats.stamina / stats.maxStamina) * 100;
        }
        
        if (stats.level !== undefined) {
            this.player.level = stats.level;
            this.updatePlayerInfo();
        }
        
        if (stats.gearScore !== undefined) {
            this.player.gearScore = stats.gearScore;
            this.updatePlayerInfo();
        }
        
        if (stats.name !== undefined) {
            this.player.name = stats.name;
            this.updatePlayerInfo();
        }
    }
    
    updatePlayerInfo() {
        const nameElement = document.getElementById('player-name');
        const levelElement = document.getElementById('player-level');
        const gsElement = document.getElementById('player-gs');
        
        if (nameElement) nameElement.textContent = this.player.name || 'Player';
        if (levelElement) levelElement.textContent = `Level ${this.player.level}`;
        if (gsElement) gsElement.textContent = `GS: ${this.player.gearScore}`;
    }
    
    updateAnimations() {
        // Animate HP bar
        this.animations.hp.current += (this.animations.hp.target - this.animations.hp.current) * this.config.animationSpeed;
        this.elements.hpBar.fill.style.width = `${this.animations.hp.current}%`;
        this.elements.hpBar.text.textContent = `${Math.floor(this.player.hp)}/${this.player.maxHp}`;
        
        // Animate Mana bar
        this.animations.mana.current += (this.animations.mana.target - this.animations.mana.current) * this.config.animationSpeed;
        this.elements.manaBar.fill.style.width = `${this.animations.mana.current}%`;
        this.elements.manaBar.text.textContent = `${Math.floor(this.player.mana)}/${this.player.maxMana}`;
        
        // Animate XP bar
        this.animations.xp.current += (this.animations.xp.target - this.animations.xp.current) * this.config.animationSpeed;
        this.elements.xpBar.fill.style.width = `${this.animations.xp.current}%`;
        this.elements.xpBar.text.textContent = `${this.player.xp}/${this.player.maxXp} XP`;
        
        // Animate Stamina bar
        this.animations.stamina.current += (this.animations.stamina.target - this.animations.stamina.current) * this.config.animationSpeed;
        this.elements.staminaBar.fill.style.width = `${this.animations.stamina.current}%`;
        this.elements.staminaBar.text.textContent = `${Math.floor(this.player.stamina)}/${this.player.maxStamina}`;
        
        // Update cooldowns
        this.updateCooldowns();
    }
    
    updateCooldowns() {
        const now = Date.now();
        
        for (let i = 0; i < 6; i++) {
            const cooldown = this.hotbar.cooldowns[i];
            const slot = document.getElementById(`skill-slot-${i}`);
            const overlay = slot.querySelector('.cooldown-overlay');
            
            if (cooldown > now) {
                const remaining = Math.ceil((cooldown - now) / 1000);
                overlay.style.display = 'flex';
                overlay.textContent = remaining;
            } else {
                overlay.style.display = 'none';
            }
        }
    }
    
    // Status effects
    addStatusEffect(effect) {
        const statusEffect = {
            id: effect.id,
            name: effect.name,
            icon: effect.icon || '⚡',
            duration: effect.duration,
            startTime: Date.now(),
            type: effect.type // 'buff' or 'debuff'
        };
        
        if (effect.type === 'buff') {
            this.buffs.push(statusEffect);
        } else {
            this.debuffs.push(statusEffect);
        }
        
        this.renderStatusEffects();
    }
    
    removeStatusEffect(effectId) {
        this.buffs = this.buffs.filter(buff => buff.id !== effectId);
        this.debuffs = this.debuffs.filter(debuff => debuff.id !== effectId);
        this.renderStatusEffects();
    }
    
    updateStatusEffects(effects) {
        this.buffs = [];
        this.debuffs = [];
        
        for (const effect of effects) {
            this.addStatusEffect(effect);
        }
    }
    
    renderStatusEffects() {
        this.elements.statusEffects.innerHTML = '';
        
        // Render buffs
        for (const buff of this.buffs) {
            const icon = this.createStatusIcon(buff, 'buff');
            this.elements.statusEffects.appendChild(icon);
        }
        
        // Render debuffs
        for (const debuff of this.debuffs) {
            const icon = this.createStatusIcon(debuff, 'debuff');
            this.elements.statusEffects.appendChild(icon);
        }
    }
    
    createStatusIcon(effect, type) {
        const icon = document.createElement('div');
        icon.className = 'status-icon';
        icon.style.cssText = `
            width: 24px;
            height: 24px;
            background: ${type === 'buff' ? this.config.colors.buff : this.config.colors.debuff};
            border: 1px solid ${this.config.colors.border};
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            position: relative;
            cursor: pointer;
        `;
        
        icon.textContent = effect.icon;
        icon.title = `${effect.name} (${Math.ceil((effect.duration - (Date.now() - effect.startTime)) / 1000)}s)`;
        
        // Add click handler to remove effect (for testing)
        icon.addEventListener('click', () => {
            this.removeStatusEffect(effect.id);
        });
        
        return icon;
    }
    
    // Skill system
    setSkill(slot, skill) {
        if (slot < 0 || slot >= 6) return;
        
        this.hotbar.skills[slot] = skill;
        const skillSlot = document.getElementById(`skill-slot-${slot}`);
        const icon = skillSlot.querySelector('.skill-icon');
        
        if (skill) {
            icon.textContent = skill.icon || '⚔️';
            icon.title = `${skill.name} (${skill.key})`;
            skillSlot.style.background = 'rgba(255, 255, 255, 0.15)';
        } else {
            icon.textContent = '';
            icon.title = '';
            skillSlot.style.background = 'rgba(255, 255, 255, 0.1)';
        }
    }
    
    useSkill(slot) {
        if (slot < 0 || slot >= 6) return;
        
        const skill = this.hotbar.skills[slot];
        const now = Date.now();
        
        if (!skill) {
            console.log(`No skill in slot ${slot + 1}`);
            return;
        }
        
        if (this.hotbar.cooldowns[slot] > now) {
            console.log(`Skill ${skill.name} is on cooldown`);
            return;
        }
        
        if (this.player.mana < skill.manaCost) {
            console.log(`Not enough mana for ${skill.name}`);
            return;
        }
        
        // Use skill
        console.log(`Using skill: ${skill.name}`);
        
        // Trigger skill use event
        this.game.emit('skillUsed', {
            slot: slot,
            skill: skill
        });
        
        // Send to server
        if (this.game.socket) {
            this.game.socket.emit('useSkill', {
                slot: slot,
                skillId: skill.id
            });
        }
        
        // Apply cooldown
        this.hotbar.cooldowns[slot] = now + (skill.cooldown * 1000);
        
        // Deduct mana
        this.updatePlayerStats({
            mana: this.player.mana - skill.manaCost
        });
    }
    
    updateSkillCooldown(slot, duration) {
        if (slot < 0 || slot >= 6) return;
        
        this.hotbar.cooldowns[slot] = Date.now() + (duration * 1000);
    }
    
    // Utility methods
    show() {
        this.elements.hudContainer.style.display = 'block';
        this.elements.hotbarContainer.style.display = 'flex';
    }
    
    hide() {
        this.elements.hudContainer.style.display = 'none';
        this.elements.hotbarContainer.style.display = 'none';
    }
    
    toggle() {
        const isVisible = this.elements.hudContainer.style.display !== 'none';
        if (isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    // Public API for game engine
    setPlayerData(data) {
        this.updatePlayerStats(data);
    }
    
    addBuff(effect) {
        this.addStatusEffect({ ...effect, type: 'buff' });
    }
    
    addDebuff(effect) {
        this.addStatusEffect({ ...effect, type: 'debuff' });
    }
    
    setSkills(skills) {
        for (let i = 0; i < Math.min(skills.length, 6); i++) {
            this.setSkill(i, skills[i]);
        }
    }
    
    getSkill(slot) {
        return this.hotbar.skills[slot];
    }
    
    isSkillReady(slot) {
        return this.hotbar.cooldowns[slot] <= Date.now();
    }
    
    // Cleanup
    cleanup() {
        // Remove DOM elements
        if (this.elements.hudContainer) {
            this.elements.hudContainer.remove();
        }
        if (this.elements.hotbarContainer) {
            this.elements.hotbarContainer.remove();
        }
        
        // Clear data
        this.buffs = [];
        this.debuffs = [];
        this.hotbar.skills = new Array(6).fill(null);
        this.hotbar.cooldowns = new Array(6).fill(0);
    }
}

export default HUD;
        
        // HUD components
        this.components = new Map();
        this.panels = new Map();
        this.notifications = [];
        this.activeDialogs = [];
        
        // HUD settings
        this.settings = {
            showMinimap: true,
            showQuestTracker: true,
            showChat: true,
            showParty: true,
            showInventory: false,
            showCharacter: false,
            notificationDuration: 4000,
            maxNotifications: 5,
            autoHidePanels: true,
            panelHideDelay: 5000
        };
        
        // UI state
        this.isVisible = true;
        this.isMinimized = false;
        this.draggedPanel = null;
        this.hoveredElement = null;
        
        // Animation
        this.animations = new Map();
        this.lastFrameTime = 0;
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.createMainContainer();
        this.createCoreComponents();
        this.createPanels();
        this.setupEventHandlers();
        this.startAnimationLoop();
    }
    
    createMainContainer() {
        // Create main HUD container
        this.container = document.createElement('div');
        this.container.className = 'hud-main-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 1000;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        document.body.appendChild(this.container);
    }
    
    createCoreComponents() {
        // Create health/mana bars
        this.createStatusBars();
        
        // Create experience bar
        this.createExperienceBar();
        
        // Create minimap
        this.createMinimap();
        
        // Create quest tracker
        this.createQuestTracker();
        
        // Create chat system
        this.createChatSystem();
        
        // Create party panel
        this.createPartyPanel();
        
        // Create action bars
        this.createActionBars();
        
        // Create target frame
        this.createTargetFrame();
        
        // Create notifications area
        this.createNotificationsArea();
        
        // Create menu buttons
        this.createMenuButtons();
    }
    
    createStatusBars() {
        const statusContainer = document.createElement('div');
        statusContainer.className = 'hud-status-bars';
        statusContainer.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            width: 200px;
            pointer-events: auto;
        `;
        
        statusContainer.innerHTML = `
            <div class="health-bar-container">
                <div class="bar-label">
                    <span class="bar-icon">❤️</span>
                    <span class="bar-text">HP</span>
                    <span class="bar-value" id="health-value">100/100</span>
                </div>
                <div class="bar-background">
                    <div class="bar-fill health-fill" id="health-fill"></div>
                </div>
            </div>
            <div class="mana-bar-container">
                <div class="bar-label">
                    <span class="bar-icon">💧</span>
                    <span class="bar-text">MP</span>
                    <span class="bar-value" id="mana-value">50/50</span>
                </div>
                <div class="bar-background">
                    <div class="bar-fill mana-fill" id="mana-fill"></div>
                </div>
            </div>
            <div class="stamina-bar-container">
                <div class="bar-label">
                    <span class="bar-icon">⚡</span>
                    <span class="bar-text">ST</span>
                    <span class="bar-value" id="stamina-value">100/100</span>
                </div>
                <div class="bar-background">
                    <div class="bar-fill stamina-fill" id="stamina-fill"></div>
                </div>
            </div>
        `;
        
        this.container.appendChild(statusContainer);
        this.components.set('statusBars', statusContainer);
        
        // Style status bars
        this.styleStatusBars(statusContainer);
    }
    
    styleStatusBars(container) {
        const barContainers = container.querySelectorAll('.health-bar-container, .mana-bar-container, .stamina-bar-container');
        
        barContainers.forEach(barContainer => {
            barContainer.style.cssText = `
                margin-bottom: 8px;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                padding: 8px;
                backdrop-filter: blur(5px);
            `;
        });
        
        // Bar labels
        const labels = container.querySelectorAll('.bar-label');
        labels.forEach(label => {
            label.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
                font-size: 11px;
                color: #ffffff;
                font-weight: bold;
            `;
        });
        
        const icons = container.querySelectorAll('.bar-icon');
        icons.forEach(icon => {
            icon.style.cssText = `
                margin-right: 4px;
                font-size: 12px;
            `;
        });
        
        const values = container.querySelectorAll('.bar-value');
        values.forEach(value => {
            value.style.cssText = `
                font-size: 10px;
                color: #ccc;
            `;
        });
        
        // Bar backgrounds
        const backgrounds = container.querySelectorAll('.bar-background');
        backgrounds.forEach(bg => {
            bg.style.cssText = `
                height: 8px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            `;
        });
        
        // Bar fills
        const healthFill = container.querySelector('.health-fill');
        healthFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #ef4444, #dc2626);
            transition: width 0.3s ease;
            border-radius: 4px;
        `;
        
        const manaFill = container.querySelector('.mana-fill');
        manaFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #2563eb);
            transition: width 0.3s ease;
            border-radius: 4px;
        `;
        
        const staminaFill = container.querySelector('.stamina-fill');
        staminaFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #f59e0b, #d97706);
            transition: width 0.3s ease;
            border-radius: 4px;
        `;
    }
    
    createExperienceBar() {
        const expContainer = document.createElement('div');
        expContainer.className = 'hud-experience-bar';
        expContainer.style.cssText = `
            position: absolute;
            top: 140px;
            left: 20px;
            width: 200px;
            pointer-events: auto;
        `;
        
        expContainer.innerHTML = `
            <div class="exp-bar-container">
                <div class="exp-label">
                    <span class="exp-text">Level <span id="player-level">1</span></span>
                    <span class="exp-value" id="exp-value">0/100</span>
                </div>
                <div class="exp-background">
                    <div class="exp-fill" id="exp-fill"></div>
                </div>
            </div>
        `;
        
        this.container.appendChild(expContainer);
        this.components.set('experienceBar', expContainer);
        
        // Style experience bar
        this.styleExperienceBar(expContainer);
    }
    
    styleExperienceBar(container) {
        const expBar = container.querySelector('.exp-bar-container');
        expBar.style.cssText = `
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 6px;
            padding: 6px 8px;
            backdrop-filter: blur(5px);
        `;
        
        const expLabel = container.querySelector('.exp-label');
        expLabel.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3px;
            font-size: 10px;
            color: #ffd700;
            font-weight: bold;
        `;
        
        const expBackground = container.querySelector('.exp-background');
        expBackground.style.cssText = `
            height: 6px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 3px;
            overflow: hidden;
        `;
        
        const expFill = container.querySelector('.exp-fill');
        expFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #ffd700, #ffed4e);
            transition: width 0.5s ease;
            border-radius: 3px;
            width: 0%;
        `;
    }
    
    createMinimap() {
        // Minimap will be initialized separately
        // This creates the container for it
        const minimapContainer = document.createElement('div');
        minimapContainer.className = 'hud-minimap';
        minimapContainer.id = 'minimap-container';
        minimapContainer.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            pointer-events: auto;
        `;
        
        this.container.appendChild(minimapContainer);
        this.components.set('minimap', minimapContainer);
    }
    
    createQuestTracker() {
        // Quest tracker will be initialized separately
        const questContainer = document.createElement('div');
        questContainer.className = 'hud-quest-tracker';
        questContainer.id = 'quest-tracker-container';
        questContainer.style.cssText = `
            position: absolute;
            top: 80px;
            right: 20px;
            pointer-events: auto;
        `;
        
        this.container.appendChild(questContainer);
        this.components.set('questTracker', questContainer);
    }
    
    createChatSystem() {
        const chatContainer = document.createElement('div');
        chatContainer.className = 'hud-chat';
        chatContainer.id = 'chat-container';
        chatContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 400px;
            height: 200px;
            pointer-events: auto;
        `;
        
        this.container.appendChild(chatContainer);
        this.components.set('chat', chatContainer);
    }
    
    createPartyPanel() {
        const partyContainer = document.createElement('div');
        partyContainer.className = 'hud-party';
        partyContainer.id = 'party-container';
        partyContainer.style.cssText = `
            position: absolute;
            top: 200px;
            left: 20px;
            width: 200px;
            pointer-events: auto;
        `;
        
        this.container.appendChild(partyContainer);
        this.components.set('party', partyContainer);
    }
    
    createActionBars() {
        const actionBarContainer = document.createElement('div');
        actionBarContainer.className = 'hud-action-bars';
        actionBarContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            pointer-events: auto;
        `;
        
        actionBarContainer.innerHTML = `
            <div class="action-bar-main">
                ${this.createActionSlots(10)}
            </div>
            <div class="action-bar-secondary">
                ${this.createActionSlots(10)}
            </div>
        `;
        
        this.container.appendChild(actionBarContainer);
        this.components.set('actionBars', actionBarContainer);
        
        // Style action bars
        this.styleActionBars(actionBarContainer);
    }
    
    createActionSlots(count) {
        let slots = '';
        for (let i = 0; i < count; i++) {
            slots += `
                <div class="action-slot" data-slot="${i}">
                    <div class="slot-icon"></div>
                    <div class="slot-key">${i < 10 ? i : '0'}</div>
                    <div class="slot-cooldown"></div>
                </div>
            `;
        }
        return slots;
    }
    
    styleActionBars(container) {
        const mainBar = container.querySelector('.action-bar-main');
        const secondaryBar = container.querySelector('.action-bar-secondary');
        
        mainBar.style.cssText = `
            display: flex;
            gap: 4px;
            margin-bottom: 4px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            backdrop-filter: blur(5px);
        `;
        
        secondaryBar.style.cssText = `
            display: flex;
            gap: 4px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            backdrop-filter: blur(5px);
        `;
        
        const slots = container.querySelectorAll('.action-slot');
        slots.forEach(slot => {
            slot.style.cssText = `
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                position: relative;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            
            slot.addEventListener('mouseenter', () => {
                slot.style.background = 'rgba(255, 255, 255, 0.2)';
                slot.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            });
            
            slot.addEventListener('mouseleave', () => {
                slot.style.background = 'rgba(255, 255, 255, 0.1)';
                slot.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            });
        });
        
        const icons = container.querySelectorAll('.slot-icon');
        icons.forEach(icon => {
            icon.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 24px;
                height: 24px;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            `;
        });
        
        const keys = container.querySelectorAll('.slot-key');
        keys.forEach(key => {
            key.style.cssText = `
                position: absolute;
                bottom: 2px;
                right: 2px;
                font-size: 8px;
                color: #ffffff;
                font-weight: bold;
                text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
            `;
        });
        
        const cooldowns = container.querySelectorAll('.slot-cooldown');
        cooldowns.forEach(cooldown => {
            cooldown.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 2px;
                pointer-events: none;
            `;
        });
    }
    
    createTargetFrame() {
        const targetContainer = document.createElement('div');
        targetContainer.className = 'hud-target-frame';
        targetContainer.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            pointer-events: auto;
            display: none;
        `;
        
        targetContainer.innerHTML = `
            <div class="target-frame-content">
                <div class="target-name" id="target-name">Nenhum alvo</div>
                <div class="target-health-bar">
                    <div class="target-health-fill" id="target-health-fill"></div>
                </div>
                <div class="target-info">
                    <span class="target-level" id="target-level">-</span>
                    <span class="target-type" id="target-type">-</span>
                </div>
            </div>
        `;
        
        this.container.appendChild(targetContainer);
        this.components.set('targetFrame', targetContainer);
        
        // Style target frame
        this.styleTargetFrame(targetContainer);
    }
    
    styleTargetFrame(container) {
        container.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid rgba(255, 0, 0, 0.5);
            border-radius: 8px;
            padding: 10px;
            backdrop-filter: blur(5px);
        `;
        
        const targetName = container.querySelector('.target-name');
        targetName.style.cssText = `
            font-size: 14px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 5px;
            text-align: center;
        `;
        
        const targetHealthBar = container.querySelector('.target-health-bar');
        targetHealthBar.style.cssText = `
            height: 6px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 5px;
        `;
        
        const targetHealthFill = container.querySelector('.target-health-fill');
        targetHealthFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #ef4444, #dc2626);
            transition: width 0.3s ease;
            width: 0%;
        `;
        
        const targetInfo = container.querySelector('.target-info');
        targetInfo.style.cssText = `
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #ccc;
        `;
    }
    
    createNotificationsArea() {
        const notificationContainer = document.createElement('div');
        notificationContainer.className = 'hud-notifications';
        notificationContainer.style.cssText = `
            position: absolute;
            top: 200px;
            right: 20px;
            width: 300px;
            pointer-events: none;
        `;
        
        this.container.appendChild(notificationContainer);
        this.components.set('notifications', notificationContainer);
    }
    
    createMenuButtons() {
        const menuContainer = document.createElement('div');
        menuContainer.className = 'hud-menu-buttons';
        menuContainer.style.cssText = `
            position: absolute;
            top: 20px;
            right: 350px;
            display: flex;
            gap: 8px;
            pointer-events: auto;
        `;
        
        menuContainer.innerHTML = `
            <button class="menu-button" id="menu-character" title="Personagem (C)">C</button>
            <button class="menu-button" id="menu-inventory" title="Inventário (I)">I</button>
            <button class="menu-button" id="menu-map" title="Mapa (M)">M</button>
            <button class="menu-button" id="menu-quests" title="Quests (Q)">Q</button>
            <button class="menu-button" id="menu-guild" title="Guilda (G)">G</button>
            <button class="menu-button" id="menu-settings" title="Configurações (ESC)">⚙️</button>
        `;
        
        this.container.appendChild(menuContainer);
        this.components.set('menuButtons', menuContainer);
        
        // Style menu buttons
        this.styleMenuButtons(menuContainer);
        
        // Setup menu handlers
        this.setupMenuHandlers(menuContainer);
    }
    
    styleMenuButtons(container) {
        const buttons = container.querySelectorAll('.menu-button');
        buttons.forEach(button => {
            button.style.cssText = `
                width: 32px;
                height: 32px;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                color: #ffffff;
                font-size: 12px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                backdrop-filter: blur(5px);
            `;
            
            button.addEventListener('mouseenter', () => {
                button.style.background = 'rgba(100, 150, 255, 0.3)';
                button.style.borderColor = 'rgba(100, 150, 255, 0.6)';
                button.style.transform = 'scale(1.1)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = 'rgba(0, 0, 0, 0.7)';
                button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                button.style.transform = 'scale(1)';
            });
        });
    }
    
    setupMenuHandlers(container) {
        const buttons = {
            'menu-character': () => this.togglePanel('character'),
            'menu-inventory': () => this.togglePanel('inventory'),
            'menu-map': () => this.toggleWorldMap(),
            'menu-quests': () => this.togglePanel('quests'),
            'menu-guild': () => this.togglePanel('guild'),
            'menu-settings': () => this.togglePanel('settings')
        };
        
        for (const [id, handler] of Object.entries(buttons)) {
            const button = container.querySelector(`#${id}`);
            if (button) {
                button.addEventListener('click', handler);
            }
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'c': buttons['menu-character'](); break;
                case 'i': buttons['menu-inventory'](); break;
                case 'm': buttons['menu-map'](); break;
                case 'q': buttons['menu-quests'](); break;
                case 'g': buttons['menu-guild'](); break;
                case 'escape': buttons['menu-settings'](); break;
            }
        });
    }
    
    createPanels() {
        // Create collapsible panels
        this.createPanel('character', this.createCharacterPanel());
        this.createPanel('inventory', this.createInventoryPanel());
        this.createPanel('quests', this.createQuestsPanel());
        this.createPanel('guild', this.createGuildPanel());
        this.createPanel('settings', this.createSettingsPanel());
    }
    
    createPanel(id, content) {
        const panel = document.createElement('div');
        panel.className = 'hud-panel';
        panel.id = `panel-${id}`;
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 40, 0.95));
            border: 2px solid rgba(100, 150, 255, 0.5);
            border-radius: 12px;
            color: white;
            z-index: 2000;
            min-width: 400px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(15px);
            display: none;
        `;
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">${this.getPanelTitle(id)}</h3>
                <button class="panel-close">×</button>
            </div>
            <div class="panel-content">
                ${content}
            </div>
        `;
        
        document.body.appendChild(panel);
        this.panels.set(id, panel);
        
        // Setup panel handlers
        this.setupPanelHandlers(panel, id);
        
        return panel;
    }
    
    getPanelTitle(id) {
        const titles = {
            character: 'Personagem',
            inventory: 'Inventário',
            quests: 'Quests',
            guild: 'Guilda',
            settings: 'Configurações'
        };
        
        return titles[id] || id;
    }
    
    createCharacterPanel() {
        return `
            <div class="character-stats">
                <div class="stat-row">
                    <span class="stat-label">Nível:</span>
                    <span class="stat-value" id="char-level">1</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Classe:</span>
                    <span class="stat-value" id="char-class">Guerreiro</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">XP:</span>
                    <span class="stat-value" id="char-xp">0/100</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Ouro:</span>
                    <span class="stat-value" id="char-gold">0</span>
                </div>
                <div class="stat-section">
                    <h4>Atributos</h4>
                    <div class="stat-row">
                        <span class="stat-label">Força:</span>
                        <span class="stat-value" id="char-str">10</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Agilidade:</span>
                        <span class="stat-value" id="char-agi">10</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Inteligência:</span>
                        <span class="stat-value" id="char-int">10</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    createInventoryPanel() {
        return `
            <div class="inventory-grid">
                <div class="inventory-tabs">
                    <button class="tab active" data-tab="equipment">Equipamentos</button>
                    <button class="tab" data-tab="consumables">Consumíveis</button>
                    <button class="tab" data-tab="materials">Materiais</button>
                    <button class="tab" data-tab="quest">Quest Items</button>
                </div>
                <div class="inventory-slots">
                    ${this.createInventorySlots(24)}
                </div>
            </div>
        `;
    }
    
    createInventorySlots(count) {
        let slots = '';
        for (let i = 0; i < count; i++) {
            slots += `
                <div class="inventory-slot" data-slot="${i}">
                    <div class="slot-content"></div>
                    <div class="slot-quantity"></div>
                </div>
            `;
        }
        return slots;
    }
    
    createQuestsPanel() {
        return `
            <div class="quest-tabs">
                <button class="tab active" data-tab="active">Ativas</button>
                <button class="tab" data-tab="completed">Completadas</button>
                <button class="tab" data-tab="available">Disponíveis</button>
            </div>
            <div class="quest-list" id="quest-list">
                <div class="quest-item">Nenhuma quest ativa</div>
            </div>
        `;
    }
    
    createGuildPanel() {
        return `
            <div class="guild-info">
                <div class="guild-header">
                    <div class="guild-name">Sem Guilda</div>
                    <div class="guild-tag">-</div>
                </div>
                <div class="guild-stats">
                    <div class="stat-row">
                        <span class="stat-label">Membros:</span>
                        <span class="stat-value">0/50</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Nível:</span>
                        <span class="stat-value">1</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Cargo:</span>
                        <span class="stat-value">-</span>
                    </div>
                </div>
                <div class="guild-actions">
                    <button class="guild-button">Criar Guilda</button>
                    <button class="guild-button">Procurar Guildas</button>
                </div>
            </div>
        `;
    }
    
    createSettingsPanel() {
        return `
            <div class="settings-categories">
                <div class="settings-category">
                    <h4>Video</h4>
                    <div class="setting-row">
                        <label>Qualidade Gráfica</label>
                        <select>
                            <option>Baixa</option>
                            <option>Média</option>
                            <option>Alta</option>
                        </select>
                    </div>
                    <div class="setting-row">
                        <label>Full Screen</label>
                        <input type="checkbox">
                    </div>
                </div>
                <div class="settings-category">
                    <h4>Áudio</h4>
                    <div class="setting-row">
                        <label>Volume Master</label>
                        <input type="range" min="0" max="100" value="50">
                    </div>
                    <div class="setting-row">
                        <label>Efeitos Sonoros</label>
                        <input type="checkbox" checked>
                    </div>
                </div>
                <div class="settings-category">
                    <h4>Interface</h4>
                    <div class="setting-row">
                        <label>Mostrar Minimapa</label>
                        <input type="checkbox" checked>
                    </div>
                    <div class="setting-row">
                        <label>Mostrar Chat</label>
                        <input type="checkbox" checked>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupPanelHandlers(panel, id) {
        const closeBtn = panel.querySelector('.panel-close');
        closeBtn.addEventListener('click', () => {
            this.hidePanel(id);
        });
        
        // Tab handling
        const tabs = panel.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                tab.classList.add('active');
                // Handle tab content (to be implemented)
                this.handleTabChange(id, tab.dataset.tab);
            });
        });
        
        // Style panel elements
        this.stylePanelElements(panel);
    }
    
    stylePanelElements(panel) {
        // Panel header
        const header = panel.querySelector('.panel-header');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: linear-gradient(90deg, rgba(100, 150, 255, 0.3), rgba(50, 100, 200, 0.2));
            border-bottom: 1px solid rgba(100, 150, 255, 0.4);
            border-radius: 10px 10px 0 0;
        `;
        
        const title = panel.querySelector('.panel-title');
        title.style.cssText = `
            margin: 0;
            color: #6495ff;
            font-size: 18px;
            font-weight: bold;
        `;
        
        const closeBtn = panel.querySelector('.panel-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: #ffffff;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background 0.2s ease;
        `;
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
        });
        
        // Panel content
        const content = panel.querySelector('.panel-content');
        content.style.cssText = `
            padding: 20px;
        `;
        
        // Style specific panel content
        this.styleCharacterPanel(panel);
        this.styleInventoryPanel(panel);
        this.styleQuestsPanel(panel);
        this.styleGuildPanel(panel);
        this.styleSettingsPanel(panel);
    }
    
    styleCharacterPanel(panel) {
        const stats = panel.querySelector('.character-stats');
        if (!stats) return;
        
        const statRows = stats.querySelectorAll('.stat-row');
        statRows.forEach(row => {
            row.style.cssText = `
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            `;
        });
        
        const labels = stats.querySelectorAll('.stat-label');
        labels.forEach(label => {
            label.style.cssText = `
                color: #ccc;
                font-size: 14px;
            `;
        });
        
        const values = stats.querySelectorAll('.stat-value');
        values.forEach(value => {
            value.style.cssText = `
                color: #ffffff;
                font-weight: bold;
                font-size: 14px;
            `;
        });
        
        const sections = stats.querySelectorAll('.stat-section');
        sections.forEach(section => {
            section.style.cssText = `
                margin-top: 20px;
            `;
            
            const heading = section.querySelector('h4');
            if (heading) {
                heading.style.cssText = `
                    color: #6495ff;
                    margin: 0 0 10px 0;
                    font-size: 16px;
                    border-bottom: 1px solid rgba(100, 150, 255, 0.3);
                    padding-bottom: 5px;
                `;
            }
        });
    }
    
    styleInventoryPanel(panel) {
        const tabs = panel.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 4px 4px 0 0;
                margin-right: 2px;
            `;
            
            if (tab.classList.contains('active')) {
                tab.style.background = 'rgba(100, 150, 255, 0.3)';
                tab.style.borderColor = 'rgba(100, 150, 255, 0.5)';
            }
        });
        
        const slots = panel.querySelectorAll('.inventory-slot');
        slots.forEach(slot => {
            slot.style.cssText = `
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin: 2px;
                position: relative;
                cursor: pointer;
            `;
        });
    }
    
    styleQuestsPanel(panel) {
        // Similar styling for quest panel
        const questList = panel.querySelector('#quest-list');
        if (questList) {
            questList.style.cssText = `
                max-height: 400px;
                overflow-y: auto;
            `;
        }
    }
    
    styleGuildPanel(panel) {
        // Style guild panel elements
        const guildHeader = panel.querySelector('.guild-header');
        if (guildHeader) {
            guildHeader.style.cssText = `
                text-align: center;
                margin-bottom: 20px;
            `;
        }
    }
    
    styleSettingsPanel(panel) {
        const categories = panel.querySelectorAll('.settings-category');
        categories.forEach(category => {
            category.style.cssText = `
                margin-bottom: 20px;
            `;
            
            const heading = category.querySelector('h4');
            if (heading) {
                heading.style.cssText = `
                    color: #6495ff;
                    margin: 0 0 10px 0;
                    font-size: 16px;
                `;
            }
            
            const settingRows = category.querySelectorAll('.setting-row');
            settingRows.forEach(row => {
                row.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                `;
                
                const label = row.querySelector('label');
                if (label) {
                    label.style.cssText = `
                        color: #ccc;
                        font-size: 14px;
                    `;
                }
            });
        });
    }
    
    setupEventHandlers() {
        // Game events
        if (this.game) {
            this.game.on('playerStatsUpdate', () => this.updatePlayerStats());
            this.game.on('targetChanged', (target) => this.updateTargetFrame(target));
            this.game.on('levelUp', () => this.showNotification('Parabéns! Você subiu de nível!', 'success'));
            this.game.on('itemLooted', (item) => this.showNotification(`Você obteve: ${item.name}`, 'loot'));
        }
        
        // Window events
        window.addEventListener('resize', () => this.handleResize());
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }
    
    startAnimationLoop() {
        const animate = (timestamp) => {
            this.lastFrameTime = timestamp;
            this.updateAnimations();
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    // Public API methods
    updatePlayerStats() {
        if (!this.game || !this.game.player) return;
        
        const player = this.game.player;
        
        // Update health bar
        this.updateStatusBar('health', player.currentHealth || 100, player.maxHealth || 100);
        
        // Update mana bar
        this.updateStatusBar('mana', player.currentMana || 50, player.maxMana || 50);
        
        // Update stamina bar
        this.updateStatusBar('stamina', player.currentStamina || 100, player.maxStamina || 100);
        
        // Update experience bar
        this.updateExperienceBar(player.level || 1, player.experience || 0, player.experienceToNext || 100);
        
        // Update character panel if visible
        this.updateCharacterPanel(player);
    }
    
    updateStatusBar(type, current, max) {
        const fillElement = document.getElementById(`${type}-fill`);
        const valueElement = document.getElementById(`${type}-value`);
        
        if (fillElement) {
            const percentage = Math.max(0, Math.min(100, (current / max) * 100));
            fillElement.style.width = `${percentage}%`;
        }
        
        if (valueElement) {
            valueElement.textContent = `${Math.floor(current)}/${Math.floor(max)}`;
        }
    }
    
    updateExperienceBar(level, current, required) {
        const levelElement = document.getElementById('player-level');
        const expValueElement = document.getElementById('exp-value');
        const expFillElement = document.getElementById('exp-fill');
        
        if (levelElement) levelElement.textContent = level;
        if (expValueElement) expValueElement.textContent = `${Math.floor(current)}/${Math.floor(required)}`;
        if (expFillElement) {
            const percentage = (current / required) * 100;
            expFillElement.style.width = `${percentage}%`;
        }
    }
    
    updateTargetFrame(target) {
        const targetFrame = this.components.get('targetFrame');
        if (!targetFrame) return;
        
        if (target) {
            targetFrame.style.display = 'block';
            
            const nameElement = document.getElementById('target-name');
            const levelElement = document.getElementById('target-level');
            const typeElement = document.getElementById('target-type');
            const healthFillElement = document.getElementById('target-health-fill');
            
            if (nameElement) nameElement.textContent = target.name || 'Desconhecido';
            if (levelElement) levelElement.textContent = `Nível ${target.level || '?'}`;
            if (typeElement) typeElement.textContent = target.type || 'Monstro';
            if (healthFillElement && target.health) {
                const percentage = (target.currentHealth / target.maxHealth) * 100;
                healthFillElement.style.width = `${percentage}%`;
            }
        } else {
            targetFrame.style.display = 'none';
        }
    }
    
    updateCharacterPanel(player) {
        const panel = this.panels.get('character');
        if (!panel || panel.style.display === 'none') return;
        
        const levelElement = panel.querySelector('#char-level');
        const classElement = panel.querySelector('#char-class');
        const xpElement = panel.querySelector('#char-xp');
        const goldElement = panel.querySelector('#char-gold');
        
        if (levelElement) levelElement.textContent = player.level || 1;
        if (classElement) classElement.textContent = player.className || 'Guerreiro';
        if (xpElement) xpElement.textContent = `${player.experience || 0}/${player.experienceToNext || 100}`;
        if (goldElement) goldElement.textContent = player.gold || 0;
    }
    
    showNotification(message, type = 'info', duration = null) {
        const notification = document.createElement('div');
        notification.className = `hud-notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            border: 1px solid ${this.getNotificationBorderColor(type)};
            border-radius: 6px;
            padding: 10px 15px;
            margin-bottom: 5px;
            color: white;
            font-size: 13px;
            pointer-events: auto;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        `;
        
        notification.textContent = message;
        
        const notificationsContainer = this.components.get('notifications');
        notificationsContainer.appendChild(notification);
        
        this.notifications.push(notification);
        
        // Limit notifications
        if (this.notifications.length > this.settings.maxNotifications) {
            const oldNotification = this.notifications.shift();
            oldNotification.remove();
        }
        
        // Auto remove
        const notificationDuration = duration || this.settings.notificationDuration;
        setTimeout(() => {
            this.removeNotification(notification);
        }, notificationDuration);
    }
    
    removeNotification(notification) {
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }
        
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    getNotificationColor(type) {
        const colors = {
            info: 'rgba(59, 130, 246, 0.9)',
            success: 'rgba(34, 197, 94, 0.9)',
            warning: 'rgba(245, 158, 11, 0.9)',
            error: 'rgba(239, 68, 68, 0.9)',
            loot: 'rgba(168, 85, 247, 0.9)'
        };
        
        return colors[type] || colors.info;
    }
    
    getNotificationBorderColor(type) {
        const colors = {
            info: 'rgba(59, 130, 246, 0.5)',
            success: 'rgba(34, 197, 94, 0.5)',
            warning: 'rgba(245, 158, 11, 0.5)',
            error: 'rgba(239, 68, 68, 0.5)',
            loot: 'rgba(168, 85, 247, 0.5)'
        };
        
        return colors[type] || colors.info;
    }
    
    togglePanel(id) {
        const panel = this.panels.get(id);
        if (!panel) return;
        
        if (panel.style.display === 'none') {
            this.showPanel(id);
        } else {
            this.hidePanel(id);
        }
    }
    
    showPanel(id) {
        const panel = this.panels.get(id);
        if (!panel) return;
        
        panel.style.display = 'block';
        
        // Update panel content
        if (id === 'character') {
            this.updateCharacterPanel(this.game.player);
        }
        
        // Auto-hide if enabled
        if (this.settings.autoHidePanels) {
            setTimeout(() => {
                if (panel.style.display !== 'none') {
                    this.hidePanel(id);
                }
            }, this.settings.panelHideDelay);
        }
    }
    
    hidePanel(id) {
        const panel = this.panels.get(id);
        if (panel) {
            panel.style.display = 'none';
        }
    }
    
    toggleWorldMap() {
        if (this.game && this.game.worldMap) {
            this.game.worldMap.toggle();
        }
    }
    
    handleTabChange(panelId, tabName) {
        // Handle tab content switching
        console.log(`Panel ${panelId} tab changed to ${tabName}`);
    }
    
    updateAnimations() {
        // Update ongoing animations
        for (const [id, animation] of this.animations) {
            if (animation.update) {
                animation.update(this.lastFrameTime);
            }
        }
    }
    
    handleResize() {
        // Handle window resize
        // Adjust HUD layout if needed
    }
    
    pause() {
        // Pause animations and updates
        this.isVisible = false;
    }
    
    resume() {
        // Resume animations and updates
        this.isVisible = true;
    }
    
    // Settings management
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        
        // Apply settings
        if (this.settings.showMinimap) {
            this.components.get('minimap').style.display = 'block';
        } else {
            this.components.get('minimap').style.display = 'none';
        }
        
        if (this.settings.showQuestTracker) {
            this.components.get('questTracker').style.display = 'block';
        } else {
            this.components.get('questTracker').style.display = 'none';
        }
    }
    
    // Cleanup
    cleanup() {
        // Remove all components
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // Remove all panels
        for (const panel of this.panels.values()) {
            if (panel.parentNode) {
                panel.parentNode.removeChild(panel);
            }
        }
        
        // Clear data
        this.components.clear();
        this.panels.clear();
        this.notifications = [];
        this.animations.clear();
    }
}

// Add CSS animations
const hudStyles = document.createElement('style');
hudStyles.textContent = `
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
`;
document.head.appendChild(hudStyles);

export default HUD;
