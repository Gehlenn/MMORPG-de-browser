/**
 * AchievementsUI - Client-side UI for the achievement system
 * Displays achievements, progress, and handles notifications
 */

class AchievementsUI {
    constructor(gameplayEngine) {
        this.gameplayEngine = gameplayEngine;
        this.achievements = [];
        this.stats = null;
        this.categories = ['all', 'combat', 'exploration', 'social', 'progression', 'collection', 'special'];
        this.currentCategory = 'all';
        this.isVisible = false;
        this.unlockedQueue = [];
        this.processingQueue = false;

        this.setupSocketListeners();
        this.createStyles();
    }

    /**
     * Initialize achievements UI
     */
    initialize() {
        this.createPanel();
        this.setupKeyboardShortcuts();
        console.log('[AchievementsUI] Initialized');
    }

    /**
     * Setup socket listeners for server events
     */
    setupSocketListeners() {
        if (!this.gameplayEngine.socket) return;

        // Achievement unlocked
        this.gameplayEngine.socket.on('achievement:unlocked', (data) => {
            this.queueUnlockNotification(data);
        });

        // Achievement list update
        this.gameplayEngine.socket.on('achievement:list', (data) => {
            this.achievements = data.achievements;
            this.stats = data.stats;
            this.render();
        });
    }

    /**
     * Create CSS styles
     */
    createStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .achievements-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 800px;
                height: 600px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #e94560;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                z-index: 10000;
                display: none;
                flex-direction: column;
                overflow: hidden;
            }

            .achievements-panel.visible {
                display: flex;
            }

            .achievements-header {
                background: linear-gradient(90deg, #e94560, #ff6b6b);
                padding: 16px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid rgba(255,255,255,0.1);
            }

            .achievements-title {
                font-size: 24px;
                font-weight: bold;
                color: white;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .achievements-stats {
                display: flex;
                gap: 20px;
                color: white;
                font-size: 14px;
            }

            .stat-badge {
                background: rgba(255,255,255,0.2);
                padding: 6px 12px;
                border-radius: 20px;
                font-weight: bold;
            }

            .achievements-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .achievements-close:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }

            .achievements-tabs {
                display: flex;
                background: rgba(0,0,0,0.3);
                padding: 8px 16px;
                gap: 8px;
                overflow-x: auto;
            }

            .achievement-tab {
                background: transparent;
                border: 1px solid rgba(233, 69, 96, 0.3);
                color: #aaa;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 13px;
                white-space: nowrap;
            }

            .achievement-tab:hover {
                border-color: #e94560;
                color: #fff;
            }

            .achievement-tab.active {
                background: #e94560;
                border-color: #e94560;
                color: white;
            }

            .achievements-content {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
            }

            .achievements-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
                gap: 16px;
            }

            .achievement-card {
                background: rgba(255,255,255,0.05);
                border: 2px solid transparent;
                border-radius: 12px;
                padding: 16px;
                display: flex;
                gap: 16px;
                transition: all 0.3s;
                position: relative;
            }

            .achievement-card:hover {
                background: rgba(255,255,255,0.08);
                transform: translateY(-2px);
            }

            .achievement-card.unlocked {
                border-color: #ffd700;
                background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05));
            }

            .achievement-card.rare {
                border-color: #9b59b6;
                background: linear-gradient(135deg, rgba(155,89,182,0.1), rgba(155,89,182,0.05));
            }

            .achievement-icon {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #2c3e50, #34495e);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 30px;
                flex-shrink: 0;
            }

            .achievement-card.unlocked .achievement-icon {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                box-shadow: 0 0 20px rgba(255,215,0,0.4);
            }

            .achievement-info {
                flex: 1;
                min-width: 0;
            }

            .achievement-name {
                font-size: 16px;
                font-weight: bold;
                color: #fff;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .achievement-card.unlocked .achievement-name {
                color: #ffd700;
            }

            .achievement-desc {
                font-size: 13px;
                color: #aaa;
                margin-bottom: 8px;
            }

            .achievement-progress-bar {
                height: 8px;
                background: rgba(0,0,0,0.3);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 4px;
            }

            .achievement-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #e94560, #ff6b6b);
                border-radius: 4px;
                transition: width 0.5s ease;
            }

            .achievement-card.unlocked .achievement-progress-fill {
                background: linear-gradient(90deg, #ffd700, #ffed4e);
            }

            .achievement-progress-text {
                font-size: 12px;
                color: #888;
                text-align: right;
            }

            .achievement-points {
                position: absolute;
                top: 12px;
                right: 12px;
                background: rgba(233, 69, 96, 0.3);
                color: #fff;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
            }

            .achievement-card.unlocked .achievement-points {
                background: rgba(255, 215, 0, 0.3);
                color: #ffd700;
            }

            /* Notification Toast */
            .achievement-toast {
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                border-radius: 16px;
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 16px;
                box-shadow: 0 10px 40px rgba(255,215,0,0.4);
                z-index: 10001;
                transform: translateX(120%);
                transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                max-width: 400px;
            }

            .achievement-toast.show {
                transform: translateX(0);
            }

            .achievement-toast-icon {
                width: 60px;
                height: 60px;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                flex-shrink: 0;
            }

            .achievement-toast-content h3 {
                margin: 0 0 4px 0;
                color: #333;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .achievement-toast-content h4 {
                margin: 0 0 8px 0;
                color: #000;
                font-size: 18px;
            }

            .achievement-toast-content p {
                margin: 0;
                color: #666;
                font-size: 13px;
            }

            .achievement-toast-rewards {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }

            .reward-badge {
                background: rgba(0,0,0,0.1);
                padding: 4px 8px;
                border-radius: 8px;
                font-size: 11px;
                color: #333;
            }

            /* Responsive */
            @media (max-width: 850px) {
                .achievements-panel {
                    width: 95vw;
                    height: 80vh;
                }

                .achievements-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Create the achievements panel
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'achievements-panel';
        this.panel.innerHTML = `
            <div class="achievements-header">
                <div class="achievements-title">
                    <span>🏆</span>
                    <span>Conquistas</span>
                </div>
                <div class="achievements-stats">
                    <span class="stat-badge" id="ach-unlocked">0/30</span>
                    <span class="stat-badge" id="ach-points">0 pts</span>
                </div>
                <button class="achievements-close" onclick="window.achievementsUI.hide()">×</button>
            </div>
            <div class="achievements-tabs">
                ${this.categories.map(cat => `
                    <button class="achievement-tab ${cat === 'all' ? 'active' : ''}" 
                            data-category="${cat}"
                            onclick="window.achievementsUI.selectCategory('${cat}')">
                        ${this.getCategoryLabel(cat)}
                    </button>
                `).join('')}
            </div>
            <div class="achievements-content">
                <div class="achievements-grid" id="achievements-grid"></div>
            </div>
        `;

        // Create toast notification container
        this.toast = document.createElement('div');
        this.toast.className = 'achievement-toast';
        this.toast.innerHTML = `
            <div class="achievement-toast-icon">🏆</div>
            <div class="achievement-toast-content">
                <h3>Conquista Desbloqueada!</h3>
                <h4 id="toast-name"></h4>
                <p id="toast-desc"></p>
                <div class="achievement-toast-rewards" id="toast-rewards"></div>
            </div>
        `;

        document.body.appendChild(this.panel);
        document.body.appendChild(this.toast);
    }

    /**
     * Get category label in Portuguese
     */
    getCategoryLabel(category) {
        const labels = {
            'all': 'Todas',
            'combat': 'Combate',
            'exploration': 'Exploração',
            'social': 'Social',
            'progression': 'Progressão',
            'collection': 'Coleção',
            'special': 'Especiais'
        };
        return labels[category] || category;
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'K' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Show achievements panel
     */
    show() {
        this.isVisible = true;
        this.panel.classList.add('visible');
        this.requestAchievementList();
    }

    /**
     * Hide achievements panel
     */
    hide() {
        this.isVisible = false;
        this.panel.classList.remove('visible');
    }

    /**
     * Toggle panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Select category tab
     */
    selectCategory(category) {
        this.currentCategory = category;

        // Update tab styling
        this.panel.querySelectorAll('.achievement-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        this.render();
    }

    /**
     * Request achievements from server
     */
    requestAchievementList() {
        if (this.gameplayEngine.socket) {
            this.gameplayEngine.socket.emit('achievement:get_list');
        }
    }

    /**
     * Render achievements list
     */
    render() {
        const grid = document.getElementById('achievements-grid');
        if (!grid) return;

        // Filter by category
        let filtered = this.achievements;
        if (this.currentCategory !== 'all') {
            filtered = this.achievements.filter(a => a.category === this.currentCategory);
        }

        // Sort: unlocked first, then by progress
        filtered.sort((a, b) => {
            if (a.isUnlocked !== b.isUnlocked) return b.isUnlocked ? 1 : -1;
            return b.completion - a.completion;
        });

        grid.innerHTML = filtered.map(ach => this.createAchievementCard(ach)).join('');

        // Update stats
        if (this.stats) {
            document.getElementById('ach-unlocked').textContent = 
                `${this.stats.totalUnlocked}/${this.getTotalCount()}`;
            document.getElementById('ach-points').textContent = `${this.stats.totalPoints} pts`;
        }
    }

    /**
     * Create achievement card HTML
     */
    createAchievementCard(achievement) {
        const isRare = achievement.points >= 100;
        const progressPercent = (achievement.progress / achievement.maxProgress) * 100;

        return `
            <div class="achievement-card ${achievement.isUnlocked ? 'unlocked' : ''} ${isRare ? 'rare' : ''}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">
                        ${achievement.name}
                        ${achievement.isUnlocked ? '✓' : ''}
                    </div>
                    <div class="achievement-desc">${achievement.description}</div>
                    <div class="achievement-progress-bar">
                        <div class="achievement-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="achievement-progress-text">
                        ${achievement.progress} / ${achievement.maxProgress}
                        ${achievement.isUnlocked ? '(Completado!)' : ''}
                    </div>
                </div>
                <div class="achievement-points">+${achievement.points} pts</div>
            </div>
        `;
    }

    /**
     * Get total achievement count
     */
    getTotalCount() {
        return 30; // Based on AchievementManager definitions
    }

    /**
     * Queue unlock notification
     */
    queueUnlockNotification(data) {
        this.unlockedQueue.push(data);
        if (!this.processingQueue) {
            this.processQueue();
        }
    }

    /**
     * Process notification queue
     */
    async processQueue() {
        if (this.unlockedQueue.length === 0) {
            this.processingQueue = false;
            return;
        }

        this.processingQueue = true;
        const data = this.unlockedQueue.shift();

        await this.showToast(data);

        // Wait before showing next
        setTimeout(() => {
            this.processQueue();
        }, 3500);
    }

    /**
     * Show achievement unlock toast
     */
    async showToast(data) {
        const iconEl = this.toast.querySelector('.achievement-toast-icon');
        const nameEl = document.getElementById('toast-name');
        const descEl = document.getElementById('toast-desc');
        const rewardsEl = document.getElementById('toast-rewards');

        iconEl.textContent = data.icon || '🏆';
        nameEl.textContent = data.name;
        descEl.textContent = data.description;

        // Build rewards HTML
        const rewards = [];
        if (data.rewards) {
            if (data.rewards.gold) rewards.push(`💰 ${data.rewards.gold} Gold`);
            if (data.rewards.exp) rewards.push(`⭐ ${data.rewards.exp} EXP`);
            if (data.rewards.item) rewards.push(`📦 Item`);
            if (data.rewards.title) rewards.push(`👑 Título`);
        }

        rewardsEl.innerHTML = rewards.map(r => `<span class="reward-badge">${r}</span>`).join('');

        // Show toast
        this.toast.classList.add('show');

        // Play sound if available
        this.playUnlockSound();

        // Hide after delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        this.toast.classList.remove('show');
    }

    /**
     * Play unlock sound
     */
    playUnlockSound() {
        // Can integrate with AudioManager if available
        if (this.gameplayEngine.audioManager) {
            this.gameplayEngine.audioManager.playSFX('achievement_unlock');
        }
    }

    /**
     * Get unlocked achievements count
     */
    getUnlockedCount() {
        return this.achievements.filter(a => a.isUnlocked).length;
    }

    /**
     * Check if achievement is unlocked
     */
    isUnlocked(achievementId) {
        const ach = this.achievements.find(a => a.id === achievementId);
        return ach ? ach.isUnlocked : false;
    }

    /**
     * Get achievement progress
     */
    getProgress(achievementId) {
        const ach = this.achievements.find(a => a.id === achievementId);
        return ach ? {
            current: ach.progress,
            max: ach.maxProgress,
            percent: ach.completion
        } : null;
    }
}

// Expose to window for HTML onclick handlers
window.AchievementsUI = AchievementsUI;
