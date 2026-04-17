/**
 * AggroDisplay - Visual indicators for aggro and threat
 * Shows threat meter and aggro status
 */

class AggroDisplay {
    constructor(container) {
        this.container = container || document.body;
        this.elements = new Map();
        this.currentTarget = null;
        this.threatLevel = 0;
        
        // Configuration
        this.config = {
            meterWidth: 150,
            meterHeight: 12,
            updateInterval: 100,
            fadeOutDelay: 3000
        };
        
        this.initialize();
    }
    
    initialize() {
        this.createStyles();
        console.log('[AggroDisplay] Initialized');
    }
    
    createStyles() {
        if (document.getElementById('aggro-display-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'aggro-display-styles';
        styles.textContent = `
            .aggro-indicator {
                position: fixed;
                bottom: 120px;
                right: 20px;
                background: rgba(0, 0, 0, 0.85);
                border: 2px solid #444;
                border-radius: 8px;
                padding: 12px 16px;
                color: white;
                font-family: 'Segoe UI', sans-serif;
                font-size: 12px;
                z-index: 1000;
                min-width: 180px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            }
            
            .aggro-indicator.has-aggro {
                border-color: #ff4444;
                box-shadow: 0 0 15px rgba(255, 68, 68, 0.4);
                animation: aggro-pulse 1s infinite;
            }
            
            @keyframes aggro-pulse {
                0%, 100% { border-color: #ff4444; }
                50% { border-color: #ff8888; }
            }
            
            .aggro-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                border-bottom: 1px solid #555;
                padding-bottom: 6px;
            }
            
            .aggro-title {
                font-weight: bold;
                color: #ffaa44;
            }
            
            .aggro-status {
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 3px;
                background: #333;
            }
            
            .aggro-status.has-aggro {
                background: #ff4444;
                color: white;
                font-weight: bold;
            }
            
            .threat-meter-container {
                margin-top: 8px;
            }
            
            .threat-label {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
                font-size: 11px;
                color: #aaa;
            }
            
            .threat-bar {
                width: 100%;
                height: 12px;
                background: #333;
                border-radius: 6px;
                overflow: hidden;
                position: relative;
            }
            
            .threat-fill {
                height: 100%;
                border-radius: 6px;
                transition: width 0.3s ease, background-color 0.3s ease;
                background: linear-gradient(90deg, #44ff44, #ffff44, #ff4444);
                background-size: 100% 100%;
            }
            
            .threat-fill.low { background: #44ff44; }
            .threat-fill.medium { background: #ffff44; }
            .threat-fill.high { background: #ff8844; }
            .threat-fill.critical { background: #ff4444; }
            
            .threat-percentage {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 9px;
                font-weight: bold;
                color: white;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            }
            
            .threat-list {
                margin-top: 10px;
                padding-top: 8px;
                border-top: 1px solid #444;
            }
            
            .threat-list-title {
                font-size: 10px;
                color: #888;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .threat-entry {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 3px 0;
                font-size: 11px;
            }
            
            .threat-entry.you {
                color: #44ff44;
                font-weight: bold;
            }
            
            .threat-entry.top {
                color: #ff4444;
            }
            
            .threat-entry-name {
                flex: 1;
            }
            
            .threat-entry-value {
                color: #aaa;
            }
            
            .aggro-warning {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 68, 68, 0.9);
                color: white;
                padding: 20px 40px;
                border-radius: 8px;
                font-size: 18px;
                font-weight: bold;
                z-index: 2000;
                animation: warning-pulse 0.5s ease-in-out;
                display: none;
            }
            
            @keyframes warning-pulse {
                0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.1); }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            .aggro-warning.show {
                display: block;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    /**
     * Show aggro indicator for a mob
     * @param {string} mobId 
     * @param {string} mobName 
     * @param {boolean} hasAggro 
     * @param {number} threatPercent 
     */
    showAggroIndicator(mobId, mobName, hasAggro = false, threatPercent = 0) {
        this.currentTarget = mobId;
        this.threatLevel = threatPercent;
        
        let indicator = this.elements.get('indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'aggro-indicator';
            indicator.innerHTML = `
                <div class="aggro-header">
                    <span class="aggro-title">${mobName}</span>
                    <span class="aggro-status">${hasAggro ? 'AGGRO' : 'Normal'}</span>
                </div>
                <div class="threat-meter-container">
                    <div class="threat-label">
                        <span>Threat Level</span>
                        <span class="threat-value">${threatPercent}%</span>
                    </div>
                    <div class="threat-bar">
                        <div class="threat-fill ${this.getThreatClass(threatPercent)}" style="width: ${threatPercent}%"></div>
                        <span class="threat-percentage">${threatPercent}%</span>
                    </div>
                </div>
                <div class="threat-list" style="display: none;">
                    <div class="threat-list-title">Threat Table</div>
                </div>
            `;
            
            this.container.appendChild(indicator);
            this.elements.set('indicator', indicator);
        } else {
            // Update existing
            const titleEl = indicator.querySelector('.aggro-title');
            const statusEl = indicator.querySelector('.aggro-status');
            const threatValueEl = indicator.querySelector('.threat-value');
            const threatFillEl = indicator.querySelector('.threat-fill');
            const threatPercentEl = indicator.querySelector('.threat-percentage');
            
            titleEl.textContent = mobName;
            statusEl.textContent = hasAggro ? 'AGGRO' : 'Normal';
            statusEl.className = `aggro-status ${hasAggro ? 'has-aggro' : ''}`;
            
            threatValueEl.textContent = `${threatPercent}%`;
            threatFillEl.style.width = `${threatPercent}%`;
            threatFillEl.className = `threat-fill ${this.getThreatClass(threatPercent)}`;
            threatPercentEl.textContent = `${threatPercent}%`;
        }
        
        // Update aggro state
        indicator.className = `aggro-indicator ${hasAggro ? 'has-aggro' : ''}`;
        
        // Show aggro warning if gained aggro
        if (hasAggro) {
            this.showAggroWarning();
        }
    }
    
    /**
     * Update threat meter
     * @param {number} percentage 
     */
    updateThreatMeter(percentage) {
        this.threatLevel = Math.max(0, Math.min(100, percentage));
        
        const indicator = this.elements.get('indicator');
        if (!indicator) return;
        
        const threatValueEl = indicator.querySelector('.threat-value');
        const threatFillEl = indicator.querySelector('.threat-fill');
        const threatPercentEl = indicator.querySelector('.threat-percentage');
        
        threatValueEl.textContent = `${this.threatLevel}%`;
        threatFillEl.style.width = `${this.threatLevel}%`;
        threatFillEl.className = `threat-fill ${this.getThreatClass(this.threatLevel)}`;
        threatPercentEl.textContent = `${this.threatLevel}%`;
    }
    
    /**
     * Update threat list (top threat holders)
     * @param {Array} threatList 
     * @param {string} currentPlayerId 
     */
    updateThreatList(threatList, currentPlayerId) {
        const indicator = this.elements.get('indicator');
        if (!indicator) return;
        
        const threatListContainer = indicator.querySelector('.threat-list');
        if (!threatList || threatList.length === 0) {
            threatListContainer.style.display = 'none';
            return;
        }
        
        threatListContainer.style.display = 'block';
        
        // Clear existing entries
        const existingEntries = threatListContainer.querySelectorAll('.threat-entry');
        existingEntries.forEach(el => el.remove());
        
        // Add new entries
        threatList.forEach((entry, index) => {
            const entryEl = document.createElement('div');
            const isYou = entry.playerId === currentPlayerId;
            const isTop = entry.isTop;
            
            entryEl.className = `threat-entry ${isYou ? 'you' : ''} ${isTop ? 'top' : ''}`;
            entryEl.innerHTML = `
                <span class="threat-entry-name">${isYou ? 'YOU' : `Player ${index + 1}`}</span>
                <span class="threat-entry-value">${entry.percentage}%</span>
            `;
            
            threatListContainer.appendChild(entryEl);
        });
    }
    
    /**
     * Hide aggro indicator
     */
    hideAggroIndicator() {
        const indicator = this.elements.get('indicator');
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.remove();
                this.elements.delete('indicator');
            }, 300);
        }
        
        this.currentTarget = null;
        this.threatLevel = 0;
    }
    
    /**
     * Show aggro warning flash
     */
    showAggroWarning() {
        let warning = this.elements.get('warning');
        
        if (!warning) {
            warning = document.createElement('div');
            warning.className = 'aggro-warning';
            warning.textContent = '⚠️ YOU HAVE AGGRO!';
            this.container.appendChild(warning);
            this.elements.set('warning', warning);
        }
        
        warning.classList.add('show');
        
        setTimeout(() => {
            warning.classList.remove('show');
        }, 2000);
    }
    
    /**
     * Get threat class based on percentage
     * @param {number} percentage 
     * @returns {string}
     */
    getThreatClass(percentage) {
        if (percentage < 30) return 'low';
        if (percentage < 60) return 'medium';
        if (percentage < 90) return 'high';
        return 'critical';
    }
    
    /**
     * Handle aggro update from network
     * @param {Object} data 
     * @param {string} currentPlayerId 
     */
    handleAggroUpdate(data, currentPlayerId) {
        const { monsterId, monsterName, currentTarget, threatList } = data;
        
        // Find player's threat level
        const playerThreat = threatList?.find(t => t.playerId === currentPlayerId);
        const threatPercent = playerThreat ? parseFloat(playerThreat.percentage) : 0;
        const hasAggro = currentTarget === currentPlayerId;
        
        this.showAggroIndicator(monsterId, monsterName, hasAggro, threatPercent);
        this.updateThreatList(threatList, currentPlayerId);
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        this.elements.forEach(el => el.remove());
        this.elements.clear();
        this.currentTarget = null;
    }
}

export default AggroDisplay;
