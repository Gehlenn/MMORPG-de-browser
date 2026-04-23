/**
 * DailyQuestUI - Interface do Sistema de Missões Diárias
 * 
 * Features:
 * - Lista de missões diárias
 * - Progresso visual
 * - Sistema de streak
 * - Recompensas
 * - Timer de reset
 */

class DailyQuestUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.quests = [];
        this.streak = 0;
        this.maxStreak = 0;
        this.resetTime = null;
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
    }
    
    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'dailyquest-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 650px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
        `;
        
        const header = this.createHeader();
        this.container.appendChild(header);
        
        this.contentArea = document.createElement('div');
        this.contentArea.style.cssText = `
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            padding: 25px;
        `;
        this.container.appendChild(this.contentArea);
        
        document.body.appendChild(this.container);
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #f59e0b, #d97706);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '📅 Missões Diárias';
        title.style.cssText = `
            margin: 0;
            font-size: 22px;
            font-weight: 600;
        `;
        
        this.timerDisplay = document.createElement('div');
        this.timerDisplay.style.cssText = `
            font-size: 14px;
            color: rgba(255,255,255,0.9);
            font-family: monospace;
        `;
        this.timerDisplay.innerHTML = 'Reset em: --:--:--';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        `;
        closeBtn.onclick = () => this.hide();
        
        header.appendChild(title);
        header.appendChild(this.timerDisplay);
        header.appendChild(closeBtn);
        
        // Start timer
        this.startTimer();
        
        return header;
    }
    
    startTimer() {
        setInterval(() => {
            if (this.resetTime) {
                const now = Date.now();
                const reset = new Date(this.resetTime).getTime();
                const diff = Math.max(0, reset - now);
                
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                this.timerDisplay.innerHTML = `Reset em: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    renderContent() {
        this.contentArea.innerHTML = '';
        
        // Streak display
        const streakPanel = document.createElement('div');
        streakPanel.style.cssText = `
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2));
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        streakPanel.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 48px;">🔥</div>
                <div>
                    <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${this.streak} dias</div>
                    <div style="font-size: 13px; color: rgba(255,255,255,0.7);">Streak de Login (Máx: ${this.maxStreak})</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 18px; font-weight: 600; color: #22c55e;">+${(this.streak * 10)}%</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Bônus de Recompensa</div>
            </div>
        `;
        
        this.contentArea.appendChild(streakPanel);
        
        // Quests list
        const questsTitle = document.createElement('h3');
        questsTitle.innerHTML = '🎯 Missões de Hoje';
        questsTitle.style.cssText = 'margin: 0 0 15px 0; color: #f59e0b;';
        this.contentArea.appendChild(questsTitle);
        
        const questsList = document.createElement('div');
        questsList.style.cssText = `
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        
        if (this.quests.length === 0) {
            questsList.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center; padding: 40px;">Carregando missões...</div>';
        } else {
            this.quests.forEach(quest => {
                const card = this.createQuestCard(quest);
                questsList.appendChild(card);
            });
        }
        
        this.contentArea.appendChild(questsList);
        
        // Claim all button
        const hasClaimable = this.quests.some(q => q.completed && !q.claimed);
        if (hasClaimable) {
            const claimAllBtn = document.createElement('button');
            claimAllBtn.innerHTML = '🎁 Resgatar Todas as Recompensas';
            claimAllBtn.style.cssText = `
                margin-top: 15px;
                padding: 15px;
                background: linear-gradient(45deg, #22c55e, #16a34a);
                border: none;
                border-radius: 10px;
                color: white;
                font-weight: 700;
                font-size: 16px;
                cursor: pointer;
            `;
            claimAllBtn.onclick = () => {
                this.socket?.emit('dailyquest:claim_all');
            };
            this.contentArea.appendChild(claimAllBtn);
        }
    }
    
    createQuestCard(quest) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid ${quest.completed ? (quest.claimed ? '#22c55e' : '#f59e0b') : 'rgba(255,255,255,0.1)'};
            border-radius: 12px;
            padding: 18px;
            display: flex;
            align-items: center;
            gap: 15px;
        `;
        
        const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
        
        card.innerHTML = `
            <div style="font-size: 36px;">${quest.icon}</div>
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span style="font-weight: 600; color: #fff; font-size: 15px;">${quest.name}</span>
                    ${quest.completed ? `
                        <span style="background: ${quest.claimed ? '#22c55e' : '#f59e0b'}; color: ${quest.claimed ? 'white' : '#1a1a2e'}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            ${quest.claimed ? '✓ Resgatado' : '✓ Completado'}
                        </span>
                    ` : ''}
                </div>
                <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 8px;">${quest.description}</div>
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${progressPercent}%; height: 100%; background: ${quest.completed ? '#22c55e' : '#f59e0b'}; border-radius: 4px; transition: width 0.3s;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 12px; color: rgba(255,255,255,0.5);">
                    <span>${quest.progress}/${quest.target}</span>
                    <span>${Math.round(progressPercent)}%</span>
                </div>
            </div>
            <div style="text-align: right; min-width: 100px;">
                <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 5px;">Recompensa:</div>
                <div style="display: flex; flex-direction: column; gap: 2px; font-size: 12px;">
                    ${quest.reward.exp ? `<span style="color: #3b82f6;">⭐ ${Math.floor(quest.reward.exp * (quest.reward.multiplier || 1))} EXP</span>` : ''}
                    ${quest.reward.gold ? `<span style="color: #ffd700;">💰 ${Math.floor(quest.reward.gold * (quest.reward.multiplier || 1))} Gold</span>` : ''}
                    ${quest.reward.honor ? `<span style="color: #ef4444;">🏆 ${quest.reward.honor} Honor</span>` : ''}
                </div>
                ${quest.completed && !quest.claimed ? `
                    <button class="claim-btn" data-quest-id="${quest.id}" style="
                        margin-top: 8px;
                        padding: 8px 16px;
                        background: linear-gradient(45deg, #f59e0b, #d97706);
                        border: none;
                        border-radius: 6px;
                        color: #1a1a2e;
                        font-weight: 600;
                        font-size: 12px;
                        cursor: pointer;
                    ">Resgatar</button>
                ` : ''}
            </div>
        `;
        
        const claimBtn = card.querySelector('.claim-btn');
        if (claimBtn) {
            claimBtn.onclick = () => {
                this.socket?.emit('dailyquest:claim', { questId: quest.id });
            };
        }
        
        return card;
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('dailyquest:list', (data) => {
            this.quests = data.quests || [];
            this.streak = data.streak || 0;
            this.maxStreak = data.maxStreak || 0;
            this.resetTime = data.resetTime;
            this.renderContent();
        });
        
        this.socket.on('dailyquest:update', (data) => {
            this.quests = data.quests || [];
            this.renderContent();
        });
        
        this.socket.on('dailyquest:completed', (data) => {
            this.game?.showFloatingText?.(`Missão completada: ${data.questName}!`, 0, -40, '#f59e0b');
        });
        
        this.socket.on('dailyquest:claimed', (data) => {
            const rewards = [];
            if (data.rewards.exp) rewards.push(`${data.rewards.exp} EXP`);
            if (data.rewards.gold) rewards.push(`${data.rewards.gold} Gold`);
            if (data.rewards.honor) rewards.push(`${data.rewards.honor} Honor`);
            
            this.game?.showFloatingText?.(`Recompensa: ${rewards.join(', ')}!`, 0, -40, '#22c55e');
            
            // Update the quest
            const quest = this.quests.find(q => q.id === data.questId);
            if (quest) {
                quest.claimed = true;
                this.renderContent();
            }
        });
        
        this.socket.on('dailyquest:all_claimed', (data) => {
            this.game?.showFloatingText?.(`${data.count} recompensas resgatadas!`, 0, -40, '#22c55e');
            this.socket?.emit('dailyquest:get');
        });
        
        this.socket.on('dailyquest:reset', () => {
            this.game?.showFloatingText?.('Missões diárias resetadas!', 0, -40, '#f59e0b');
            this.socket?.emit('dailyquest:get');
        });
        
        this.socket.on('dailyquest:error', (data) => {
            this.game?.showFloatingText?.(data.message, 0, -40, '#ef4444');
        });
    }
    
    // ===== KEYBOARD =====
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'q' && !e.ctrlKey && !e.altKey && !e.metaKey) {
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
    
    // ===== SHOW/HIDE =====
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.socket?.emit('dailyquest:get');
        this.renderContent();
        
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

window.DailyQuestUI = DailyQuestUI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DailyQuestUI;
}
