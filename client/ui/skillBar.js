/**
 * Skill Bar UI System - Skill Hotbar and Management
 * Handles skill bar display, hotkey binding, and skill casting
 * Version 0.3.2 - Character Progression Systems
 */

class SkillBarUI {
    constructor(game) {
        this.game = game;
        this.skills = {};
        this.cooldowns = {};
        this.maxSlots = 6;
        
        // UI Elements
        this.container = null;
        this.skillSlots = [];
        this.skillTooltip = null;
        
        // Configuration
        this.config = {
            slotSize: 60,
            hotkeys: ['1', '2', '3', '4', '5', '6'],
            showCooldownNumbers: true,
            showHotkeys: true
        };
        
        // Skill icons and colors
        this.skillIcons = {
            power_strike: '⚔️',
            whirlwind: '🌪️',
            battle_cry: '📢',
            fireball: '🔥',
            frost_armor: '❄️',
            lightning_bolt: '⚡',
            backstab: '🗡️',
            stealth: '👤',
            poison_blade: '🩸',
            weapon_mastery: '🎯',
            mana_efficiency: '💧',
            critical_strike: '💥'
        };
        
        this.skillColors = {
            warrior: '#e74c3c',
            mage: '#3498db',
            rogue: '#2ecc71',
            passive: '#95a5a6'
        };
        
        this.initialize();
    }
    
    initialize() {
        this.createSkillBarUI();
        this.setupEventListeners();
        this.setupSocketEvents();
        
        // Request skills from server
        this.game.socket.emit('requestSkills');
    }
    
    createSkillBarUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'skill-bar-ui';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            padding: 15px;
            background: linear-gradient(135deg, rgba(44, 62, 80, 0.9) 0%, rgba(52, 73, 94, 0.9) 100%);
            border: 3px solid #34495e;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 999;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        // Create skill slots
        for (let i = 0; i < this.maxSlots; i++) {
            const slot = this.createSkillSlot(i);
            this.skillSlots.push(slot);
            this.container.appendChild(slot);
        }
        
        // Create skill tooltip
        this.skillTooltip = document.createElement('div');
        this.skillTooltip.id = 'skill-tooltip';
        this.skillTooltip.style.cssText = `
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
        
        document.body.appendChild(this.container);
        document.body.appendChild(this.skillTooltip);
    }
    
    createSkillSlot(index) {
        const slot = document.createElement('div');
        slot.className = 'skill-slot';
        slot.dataset.slotIndex = index;
        
        slot.style.cssText = `
            width: ${this.config.slotSize}px;
            height: ${this.config.slotSize}px;
            background: linear-gradient(135deg, #1a252f 0%, #2c3e50 100%);
            border: 2px solid #34495e;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
        `;
        
        // Hotkey display
        if (this.config.showHotkeys) {
            const hotkey = document.createElement('div');
            hotkey.className = 'hotkey';
            hotkey.textContent = this.config.hotkeys[index];
            hotkey.style.cssText = `
                position: absolute;
                top: 2px;
                left: 2px;
                background: rgba(0,0,0,0.7);
                color: #ecf0f1;
                font-size: 10px;
                font-weight: bold;
                padding: 2px 4px;
                border-radius: 3px;
                pointer-events: none;
            `;
            slot.appendChild(hotkey);
        }
        
        // Skill icon
        const icon = document.createElement('div');
        icon.className = 'skill-icon';
        icon.style.cssText = `
            font-size: 28px;
            opacity: 0.3;
            pointer-events: none;
        `;
        slot.appendChild(icon);
        
        // Cooldown overlay
        const cooldownOverlay = document.createElement('div');
        cooldownOverlay.className = 'cooldown-overlay';
        cooldownOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            border-radius: 6px;
            display: none;
            pointer-events: none;
        `;
        slot.appendChild(cooldownOverlay);
        
        // Cooldown text
        const cooldownText = document.createElement('div');
        cooldownText.className = 'cooldown-text';
        cooldownText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ecf0f1;
            font-size: 16px;
            font-weight: bold;
            pointer-events: none;
            display: none;
        `;
        slot.appendChild(cooldownText);
        
        // Level indicator
        const levelIndicator = document.createElement('div');
        levelIndicator.className = 'level-indicator';
        levelIndicator.style.cssText = `
            position: absolute;
            bottom: 2px;
            right: 2px;
            background: rgba(52, 152, 219, 0.8);
            color: white;
            font-size: 8px;
            padding: 1px 3px;
            border-radius: 3px;
            pointer-events: none;
            display: none;
        `;
        slot.appendChild(levelIndicator);
        
        // Hover effects
        slot.addEventListener('mouseenter', (e) => {
            if (this.getSkillInSlot(index)) {
                slot.style.borderColor = '#f39c12';
                slot.style.transform = 'scale(1.05)';
                this.showTooltip(e, index);
            }
        });
        
        slot.addEventListener('mouseleave', () => {
            slot.style.borderColor = '#34495e';
            slot.style.transform = 'scale(1)';
            this.hideTooltip();
        });
        
        // Click to cast skill
        slot.addEventListener('click', () => {
            this.castSkillInSlot(index);
        });
        
        // Drag and drop for skill assignment
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
            this.handleSkillDrop(e, index);
        });
        
        return slot;
    }
    
    setupEventListeners() {
        // Keyboard hotkeys
        document.addEventListener('keydown', (e) => {
            const hotkeyIndex = this.config.hotkeys.indexOf(e.key);
            if (hotkeyIndex !== -1) {
                e.preventDefault();
                this.castSkillInSlot(hotkeyIndex);
            }
        });
        
        // Right-click to unassign skill
        this.container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const slot = e.target.closest('.skill-slot');
            if (slot) {
                const index = parseInt(slot.dataset.slotIndex);
                this.unassignSkill(index);
            }
        });
    }
    
    setupSocketEvents() {
        // Receive skills from server
        this.game.socket.on('skillsUpdate', (data) => {
            this.updateSkills(data);
        });
        
        // Receive cooldown updates
        this.game.socket.on('cooldownsUpdate', (data) => {
            this.updateCooldowns(data);
        });
        
        // Skill cast start
        this.game.socket.on('skillCastStart', (data) => {
            this.handleSkillCastStart(data);
        });
        
        // Skill cast result
        this.game.socket.on('skillCastResult', (data) => {
            this.handleSkillCastResult(data);
        });
        
        // Other player skill casting
        this.game.socket.on('skillCast', (data) => {
            this.handleOtherPlayerSkillCast(data);
        });
        
        // Skill learn result
        this.game.socket.on('skillLearnResult', (data) => {
            if (data.success) {
                this.showNotification('Habilidade aprendida!', 'success');
            } else {
                this.showNotification(data.message, 'error');
            }
        });
    }
    
    updateSkills(skillsData) {
        this.skills = skillsData || {};
        this.renderSkillBar();
    }
    
    updateCooldowns(cooldownsData) {
        this.cooldowns = cooldownsData || {};
        this.renderCooldowns();
    }
    
    renderSkillBar() {
        // Auto-assign skills to slots (simplified)
        const skillList = Object.values(this.skills);
        let slotIndex = 0;
        
        // Prioritize active skills
        const activeSkills = skillList.filter(skill => skill.type === 'active');
        const passiveSkills = skillList.filter(skill => skill.type === 'passive');
        
        // Assign active skills first
        for (const skill of activeSkills) {
            if (slotIndex < this.maxSlots) {
                this.assignSkillToSlot(slotIndex, skill.id);
                slotIndex++;
            }
        }
        
        // Fill remaining slots with passive skills or leave empty
        for (const skill of passiveSkills) {
            if (slotIndex < this.maxSlots) {
                this.assignSkillToSlot(slotIndex, skill.id);
                slotIndex++;
            }
        }
    }
    
    assignSkillToSlot(slotIndex, skillId) {
        const slot = this.skillSlots[slotIndex];
        if (!slot) return;
        
        const skill = this.skills[skillId];
        if (!skill) return;
        
        slot.dataset.skillId = skillId;
        
        // Update icon
        const icon = slot.querySelector('.skill-icon');
        icon.textContent = this.skillIcons[skillId] || '❓';
        icon.style.opacity = '1';
        
        // Update color based on skill type/class
        const color = this.skillColors[skill.class] || this.skillColors.passive;
        slot.style.borderColor = color;
        slot.style.boxShadow = `0 0 10px ${color}40`;
        
        // Update level indicator
        const levelIndicator = slot.querySelector('.level-indicator');
        if (skill.level > 1) {
            levelIndicator.textContent = skill.level;
            levelIndicator.style.display = 'block';
        } else {
            levelIndicator.style.display = 'none';
        }
        
        // Update hotkey visibility for passive skills
        const hotkey = slot.querySelector('.hotkey');
        if (skill.type === 'passive') {
            hotkey.style.display = 'none';
        } else {
            hotkey.style.display = 'block';
        }
    }
    
    unassignSkill(slotIndex) {
        const slot = this.skillSlots[slotIndex];
        if (!slot) return;
        
        delete slot.dataset.skillId;
        
        // Reset icon
        const icon = slot.querySelector('.skill-icon');
        icon.textContent = '';
        icon.style.opacity = '0.3';
        
        // Reset styling
        slot.style.borderColor = '#34495e';
        slot.style.boxShadow = 'none';
        
        // Hide level indicator
        const levelIndicator = slot.querySelector('.level-indicator');
        levelIndicator.style.display = 'none';
        
        // Show hotkey again
        const hotkey = slot.querySelector('.hotkey');
        hotkey.style.display = 'block';
    }
    
    renderCooldowns() {
        for (let i = 0; i < this.maxSlots; i++) {
            this.renderSlotCooldown(i);
        }
    }
    
    renderSlotCooldown(slotIndex) {
        const slot = this.skillSlots[slotIndex];
        if (!slot) return;
        
        const skillId = slot.dataset.skillId;
        if (!skillId) {
            this.clearSlotCooldown(slot);
            return;
        }
        
        const cooldownRemaining = this.cooldowns[skillId];
        if (cooldownRemaining && cooldownRemaining > 0) {
            this.showSlotCooldown(slot, cooldownRemaining);
        } else {
            this.clearSlotCooldown(slot);
        }
    }
    
    showSlotCooldown(slot, cooldownRemaining) {
        const cooldownOverlay = slot.querySelector('.cooldown-overlay');
        const cooldownText = slot.querySelector('.cooldown-text');
        
        cooldownOverlay.style.display = 'block';
        
        if (this.config.showCooldownNumbers) {
            const seconds = Math.ceil(cooldownRemaining / 1000);
            cooldownText.textContent = seconds.toString();
            cooldownText.style.display = 'block';
        }
    }
    
    clearSlotCooldown(slot) {
        const cooldownOverlay = slot.querySelector('.cooldown-overlay');
        const cooldownText = slot.querySelector('.cooldown-text');
        
        cooldownOverlay.style.display = 'none';
        cooldownText.style.display = 'none';
    }
    
    castSkillInSlot(slotIndex) {
        const slot = this.skillSlots[slotIndex];
        if (!slot) return;
        
        const skillId = slot.dataset.skillId;
        if (!skillId) return;
        
        const skill = this.skills[skillId];
        if (!skill) return;
        
        // Check if skill is on cooldown
        if (this.cooldowns[skillId] && this.cooldowns[skillId] > 0) {
            this.showNotification('Habilidade em recarga!', 'error');
            return;
        }
        
        // Check if passive skill
        if (skill.type === 'passive') {
            this.showNotification('Habilidades passivas são automáticas!', 'info');
            return;
        }
        
        // Check mana cost
        const player = this.game.player;
        if (player.mana < skill.manaCost) {
            this.showNotification('Mana insuficiente!', 'error');
            return;
        }
        
        // Cast skill
        this.game.socket.emit('castSkill', {
            skillId: skillId,
            targetId: this.getCurrentTarget()
        });
    }
    
    getCurrentTarget() {
        // Get current target from combat system
        if (this.game.combatSystem && this.game.combatSystem.currentTarget) {
            return this.game.combatSystem.currentTarget.id;
        }
        return null;
    }
    
    handleSkillDrop(e, slotIndex) {
        e.preventDefault();
        
        const skillId = e.dataTransfer.getData('text/plain');
        if (!skillId) return;
        
        const skill = this.skills[skillId];
        if (!skill) return;
        
        // Assign skill to slot
        this.assignSkillToSlot(slotIndex, skillId);
        
        // Reset slot styling
        e.currentTarget.style.borderColor = '#34495e';
        e.currentTarget.style.background = 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)';
    }
    
    handleSkillCastStart(data) {
        const { skillId, castTime } = data;
        
        // Show casting indicator
        this.showCastingIndicator(skillId, castTime);
    }
    
    handleSkillCastResult(data) {
        const { success, skillId, results } = data;
        
        if (success) {
            // Start cooldown animation
            this.startCooldownAnimation(skillId);
            
            // Show cast feedback
            this.showCastFeedback(skillId, results);
        } else {
            // Show error
            this.showNotification('Falha ao lançar habilidade!', 'error');
        }
    }
    
    handleOtherPlayerSkillCast(data) {
        const { casterId, skillId, phase, results } = data;
        
        if (phase === 'execute') {
            // Show visual effect for other player's skill
            this.showOtherPlayerSkillEffect(casterId, skillId, results);
        }
    }
    
    startCooldownAnimation(skillId) {
        // Find slot with this skill
        const slotIndex = this.findSlotWithSkill(skillId);
        if (slotIndex === -1) return;
        
        const slot = this.skillSlots[slotIndex];
        const skill = this.skills[skillId];
        if (!skill) return;
        
        // Animate cooldown
        let remaining = skill.cooldown;
        const interval = setInterval(() => {
            remaining -= 100;
            
            if (remaining <= 0) {
                clearInterval(interval);
                this.clearSlotCooldown(slot);
            } else {
                this.showSlotCooldown(slot, remaining);
            }
        }, 100);
    }
    
    findSlotWithSkill(skillId) {
        for (let i = 0; i < this.maxSlots; i++) {
            if (this.skillSlots[i].dataset.skillId === skillId) {
                return i;
            }
        }
        return -1;
    }
    
    getSkillInSlot(slotIndex) {
        const slot = this.skillSlots[slotIndex];
        if (!slot) return null;
        
        const skillId = slot.dataset.skillId;
        return skillId ? this.skills[skillId] : null;
    }
    
    showTooltip(e, slotIndex) {
        const skill = this.getSkillInSlot(slotIndex);
        if (!skill) return;
        
        const icon = this.skillIcons[skill.id] || '❓';
        const color = this.skillColors[skill.class] || this.skillColors.passive;
        
        let tooltipHTML = `
            <div style="color: ${color}; font-weight: bold; margin-bottom: 5px;">
                ${icon} ${skill.name}
            </div>
            <div style="color: #bdc3c7; font-size: 11px; margin-bottom: 5px;">
                ${skill.type === 'passive' ? 'Passiva' : 'Ativa'} • ${this.capitalizeFirst(skill.class || 'comum')}
            </div>
        `;
        
        if (skill.description) {
            tooltipHTML += `<div style="color: #ecf0f1; font-style: italic; margin-bottom: 8px; font-size: 11px;">${skill.description}</div>`;
        }
        
        if (skill.type === 'active') {
            tooltipHTML += '<div style="margin-top: 8px; border-top: 1px solid #34495e; padding-top: 5px;">';
            
            if (skill.manaCost > 0) {
                tooltipHTML += `<div style="color: #3498db;">Custo: ${skill.manaCost} mana</div>`;
            }
            
            if (skill.cooldown > 0) {
                tooltipHTML += `<div style="color: #f39c12;">Recarga: ${skill.cooldown / 1000}s</div>`;
            }
            
            if (skill.range > 0) {
                tooltipHTML += `<div style="color: #e74c3c;">Alcance: ${skill.range}</div>`;
            }
            
            tooltipHTML += '</div>';
        }
        
        if (skill.levelRequirement > 1) {
            tooltipHTML += `<div style="color: #f39c12; margin-top: 5px;">Requer nível ${skill.levelRequirement}</div>`;
        }
        
        // Show hotkey
        const hotkey = this.config.hotkeys[slotIndex];
        tooltipHTML += `<div style="color: #95a5a6; margin-top: 5px; font-size: 10px;">Hotkey: ${hotkey}</div>`;
        
        this.skillTooltip.innerHTML = tooltipHTML;
        this.skillTooltip.style.display = 'block';
        
        // Position tooltip
        const rect = e.target.getBoundingClientRect();
        this.skillTooltip.style.left = rect.left + 'px';
        this.skillTooltip.style.top = rect.top - 10 + 'px';
        
        // Adjust if tooltip goes off screen
        const tooltipRect = this.skillTooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            this.skillTooltip.style.left = rect.right - tooltipRect.width + 'px';
        }
        if (tooltipRect.bottom > window.innerHeight) {
            this.skillTooltip.style.top = rect.bottom - tooltipRect.height + 'px';
        }
    }
    
    hideTooltip() {
        this.skillTooltip.style.display = 'none';
    }
    
    showCastingIndicator(skillId, castTime) {
        // Show casting bar or indicator
        const skill = this.skills[skillId];
        if (!skill) return;
        
        this.showNotification(`Lançando ${skill.name}...`, 'info', castTime);
    }
    
    showCastFeedback(skillId, results) {
        const skill = this.skills[skillId];
        if (!skill) return;
        
        if (results && results.damage > 0) {
            this.showNotification(`${skill.name} causou ${results.damage} de dano!`, 'success');
        } else {
            this.showNotification(`${skill.name} lançado!`, 'success');
        }
    }
    
    showOtherPlayerSkillEffect(casterId, skillId, results) {
        // Show visual effects for other players' skills
        const caster = this.game.otherPlayers.find(p => p.id === casterId);
        if (!caster) return;
        
        const skill = this.skills[skillId];
        if (!skill) return;
        
        // Add visual effect to combat visual system
        if (this.game.combatVisualSystem) {
            this.game.combatVisualSystem.playSpellAnimation(caster, null, skill.elementType || 'magic');
        }
    }
    
    showNotification(message, type = 'info', duration = 2000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1003;
            animation: fadeInOut 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
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
    
    // Utility methods
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    // Public API
    getSkills() {
        return this.skills;
    }
    
    getCooldowns() {
        return this.cooldowns;
    }
    
    isSkillOnCooldown(skillId) {
        return this.cooldowns[skillId] && this.cooldowns[skillId] > 0;
    }
    
    // Cleanup
    cleanup() {
        if (this.container) this.container.remove();
        if (this.skillTooltip) this.skillTooltip.remove();
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
        }
    }
    
    .skill-slot {
        user-select: none;
    }
    
    .skill-slot:hover {
        z-index: 1;
    }
`;
document.head.appendChild(style);

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillBarUI;
} else {
    window.SkillBarUI = SkillBarUI;
}
