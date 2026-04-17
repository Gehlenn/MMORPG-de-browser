/**
 * TacticalFeedback - Contextual combat tips and feedback
 * Shows real-time tips based on combat state
 */

class TacticalFeedback {
    constructor(container) {
        this.container = container || document.body;
        this.activeTips = new Map();
        this.tipQueue = [];
        this.isProcessing = false;
        
        // Configuration
        this.config = {
            maxActiveTips: 3,
            tipDuration: 5000,
            fadeInDuration: 300,
            fadeOutDuration: 300,
            queueDelay: 200
        };
        
        this.initialize();
    }
    
    initialize() {
        this.createStyles();
        this.createContainer();
        console.log('[TacticalFeedback] Initialized');
    }
    
    createStyles() {
        if (document.getElementById('tactical-feedback-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'tactical-feedback-styles';
        styles.textContent = `
            .tactical-feedback-container {
                position: fixed;
                top: 100px;
                left: 20px;
                width: 300px;
                z-index: 1000;
                pointer-events: none;
            }
            
            .tactical-tip {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 20, 0.95));
                border-left: 4px solid #44aaff;
                border-radius: 4px;
                padding: 12px 16px;
                margin-bottom: 8px;
                color: white;
                font-family: 'Segoe UI', sans-serif;
                font-size: 13px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                opacity: 0;
                transform: translateX(-20px);
                transition: all 0.3s ease;
                pointer-events: auto;
                position: relative;
                overflow: hidden;
            }
            
            .tactical-tip.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .tactical-tip.warning {
                border-left-color: #ffaa44;
            }
            
            .tactical-tip.critical {
                border-left-color: #ff4444;
                animation: critical-pulse 1s infinite;
            }
            
            .tactical-tip.success {
                border-left-color: #44ff88;
            }
            
            @keyframes critical-pulse {
                0%, 100% { box-shadow: 0 0 5px rgba(255, 68, 68, 0.3); }
                50% { box-shadow: 0 0 15px rgba(255, 68, 68, 0.6); }
            }
            
            .tactical-tip::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, currentColor, transparent);
                opacity: 0.3;
            }
            
            .tactical-tip-icon {
                font-size: 16px;
                margin-right: 10px;
                vertical-align: middle;
            }
            
            .tactical-tip-content {
                display: inline-block;
                vertical-align: middle;
                max-width: calc(100% - 30px);
            }
            
            .tactical-tip-title {
                font-weight: bold;
                margin-bottom: 2px;
                color: #fff;
            }
            
            .tactical-tip-message {
                color: #ccc;
                font-size: 12px;
                line-height: 1.4;
            }
            
            .tactical-tip-close {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 16px;
                height: 16px;
                line-height: 16px;
                text-align: center;
                cursor: pointer;
                opacity: 0.5;
                transition: opacity 0.2s;
                font-size: 14px;
            }
            
            .tactical-tip-close:hover {
                opacity: 1;
            }
            
            .tactical-tip-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                background: rgba(255, 255, 255, 0.3);
                transition: width linear;
            }
            
            .boss-mechanic-warning {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 68, 68, 0.95);
                color: white;
                padding: 30px 50px;
                border-radius: 12px;
                font-size: 24px;
                font-weight: bold;
                z-index: 2000;
                text-align: center;
                box-shadow: 0 0 30px rgba(255, 68, 68, 0.6);
                animation: mechanic-warning-in 0.5s ease;
            }
            
            @keyframes mechanic-warning-in {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                60% { transform: translate(-50%, -50%) scale(1.1); }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            .boss-mechanic-warning .warning-title {
                font-size: 16px;
                opacity: 0.8;
                margin-bottom: 8px;
            }
            
            .weakness-notification {
                position: fixed;
                bottom: 200px;
                right: 20px;
                background: linear-gradient(135deg, #44ff88, #22cc66);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                z-index: 1500;
                box-shadow: 0 4px 15px rgba(68, 255, 136, 0.4);
                animation: weakness-in 0.5s ease;
            }
            
            @keyframes weakness-in {
                0% { transform: translateX(100px); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }
            
            .weakness-notification .weakness-bonus {
                font-size: 18px;
                margin-top: 4px;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    createContainer() {
        this.tipContainer = document.createElement('div');
        this.tipContainer.className = 'tactical-feedback-container';
        this.container.appendChild(this.tipContainer);
    }
    
    /**
     * Show a tactical tip
     * @param {string} tipType - Type of tip (info, warning, critical, success)
     * @param {string} title - Tip title
     * @param {string} message - Tip message
     * @param {Object} options - Additional options
     */
    showTip(tipType, title, message, options = {}) {
        const id = `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const tip = {
            id,
            type: tipType,
            title,
            message,
            icon: options.icon || this.getDefaultIcon(tipType),
            duration: options.duration || this.config.tipDuration,
            priority: options.priority || 0
        };
        
        // Add to queue
        this.tipQueue.push(tip);
        
        // Process queue
        this.processQueue();
        
        return id;
    }
    
    /**
     * Show boss mechanic warning
     * @param {string} mechanic - Mechanic name
     * @param {string} instruction - What to do
     * @param {number} duration - How long to show (ms)
     */
    showBossMechanic(mechanic, instruction, duration = 5000) {
        // Remove existing warning
        const existing = document.querySelector('.boss-mechanic-warning');
        if (existing) existing.remove();
        
        const warning = document.createElement('div');
        warning.className = 'boss-mechanic-warning';
        warning.innerHTML = `
            <div class="warning-title">⚠️ BOSS MECHANIC</div>
            <div class="warning-mechanic">${mechanic}</div>
            <div class="warning-instruction" style="font-size: 16px; margin-top: 10px; opacity: 0.9;">${instruction}</div>
        `;
        
        this.container.appendChild(warning);
        
        setTimeout(() => {
            warning.style.opacity = '0';
            warning.style.transform = 'translate(-50%, -50%) scale(0.8)';
            warning.style.transition = 'all 0.3s ease';
            setTimeout(() => warning.remove(), 300);
        }, duration);
    }
    
    /**
     * Show weakness exploited notification
     * @param {string} damageType - Type of damage that hit weakness
     * @param {string} bonus - Bonus amount (e.g., "50%")
     * @param {string} message - Custom message
     */
    showWeaknessExploited(damageType, bonus, message) {
        // Remove existing notification
        const existing = document.querySelector('.weakness-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'weakness-notification';
        notification.innerHTML = `
            <div class="weakness-title">💥 WEAKNESS HIT!</div>
            <div class="weakness-message">${message || `${damageType.toUpperCase()} damage exploited weakness!`}</div>
            <div class="weakness-bonus">+${bonus} DAMAGE</div>
        `;
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            notification.style.transition = 'all 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }
    
    /**
     * Handle tactical tip from network
     * @param {Object} data 
     */
    handleTacticalTip(data) {
        const { tipType, data: tipData } = data;
        
        switch (tipType) {
            case 'weakness_exploited':
                this.showWeaknessExploited(
                    tipData.damageType,
                    tipData.bonus,
                    tipData.message
                );
                break;
                
            case 'mechanic_warning':
                this.showBossMechanic(
                    tipData.mechanic,
                    tipData.instruction,
                    tipData.duration
                );
                break;
                
            case 'target_switch':
                this.showTip('warning', '⚠️ Target Switch', 
                    `${tipData.mobName} changed target to ${tipData.newTarget === tipData.playerId ? 'YOU' : 'another player'}!`,
                    { icon: '⚠️', duration: 4000 }
                );
                break;
                
            case 'ability_effective':
                this.showTip('success', '✓ Effective', 
                    `${tipData.abilityName} was very effective!`,
                    { icon: '✓', duration: 3000 }
                );
                break;
                
            case 'taunt_success':
                this.showTip('success', '✓ Taunt Success', 
                    `You successfully taunted ${tipData.mobName}!`,
                    { icon: '✓', duration: 3000 }
                );
                break;
                
            default:
                this.showTip('info', tipType, JSON.stringify(tipData));
        }
    }
    
    /**
     * Process tip queue
     */
    processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        
        while (this.tipQueue.length > 0 && this.activeTips.size < this.config.maxActiveTips) {
            const tip = this.tipQueue.shift();
            this.renderTip(tip);
        }
        
        this.isProcessing = false;
    }
    
    /**
     * Render a tip
     */
    renderTip(tip) {
        const tipEl = document.createElement('div');
        tipEl.className = `tactical-tip ${tip.type}`;
        tipEl.id = tip.id;
        tipEl.innerHTML = `
            <span class="tactical-tip-icon">${tip.icon}</span>
            <div class="tactical-tip-content">
                <div class="tactical-tip-title">${tip.title}</div>
                <div class="tactical-tip-message">${tip.message}</div>
            </div>
            <span class="tactical-tip-close">×</span>
            <div class="tactical-tip-progress"></div>
        `;
        
        // Close button
        const closeBtn = tipEl.querySelector('.tactical-tip-close');
        closeBtn.addEventListener('click', () => this.removeTip(tip.id));
        
        // Add to container
        this.tipContainer.appendChild(tipEl);
        this.activeTips.set(tip.id, { element: tipEl, data: tip });
        
        // Animate in
        requestAnimationFrame(() => {
            tipEl.classList.add('show');
        });
        
        // Progress bar animation
        const progressBar = tipEl.querySelector('.tactical-tip-progress');
        progressBar.style.width = '100%';
        progressBar.style.transition = `width ${tip.duration}ms linear`;
        
        requestAnimationFrame(() => {
            progressBar.style.width = '0%';
        });
        
        // Auto remove
        setTimeout(() => {
            this.removeTip(tip.id);
        }, tip.duration);
    }
    
    /**
     * Remove a tip
     */
    removeTip(id) {
        const tip = this.activeTips.get(id);
        if (!tip) return;
        
        const { element } = tip;
        element.classList.remove('show');
        element.style.opacity = '0';
        element.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            element.remove();
            this.activeTips.delete(id);
            
            // Process queue if there are pending tips
            if (this.tipQueue.length > 0) {
                setTimeout(() => this.processQueue(), this.config.queueDelay);
            }
        }, this.config.fadeOutDuration);
    }
    
    /**
     * Get default icon for tip type
     */
    getDefaultIcon(tipType) {
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            critical: '🚨',
            success: '✓'
        };
        return icons[tipType] || 'ℹ️';
    }
    
    /**
     * Clear all tips
     */
    clearAll() {
        this.activeTips.forEach((tip, id) => this.removeTip(id));
        this.tipQueue = [];
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        this.clearAll();
        if (this.tipContainer) {
            this.tipContainer.remove();
        }
    }
}

export default TacticalFeedback;
