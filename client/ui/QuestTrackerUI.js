/**
 * Quest Tracker UI - HUD Integration
 * Displays active quests and progress in the game interface
 * Version 0.2.1 - Quest System Integration
 */

class QuestTrackerUI {
    constructor(questSystem, game) {
        this.questSystem = questSystem;
        this.game = game;
        
        // UI elements
        this.trackerContainer = null;
        this.questList = null;
        this.minimized = false;
        
        // Display settings
        this.settings = {
            maxVisibleQuests: 5,
            showCompletedObjectives: true,
            autoHideCompleted: false,
            position: 'top-right',
            opacity: 0.9,
            fontSize: 12
        };
        
        // Animation
        this.animations = new Map();
        
        // Initialize
        this.createUI();
        this.setupEventHandlers();
    }
    
    createUI() {
        // Create main quest tracker container
        this.trackerContainer = document.createElement('div');
        this.trackerContainer.className = 'quest-tracker';
        this.trackerContainer.innerHTML = `
            <div class="quest-tracker-header">
                <div class="quest-tracker-title">
                    <span class="quest-icon">📜</span>
                    <span>Quests</span>
                </div>
                <div class="quest-tracker-controls">
                    <button class="quest-toggle" title="Minimizar">_</button>
                    <button class="quest-close" title="Fechar">×</button>
                </div>
            </div>
            <div class="quest-list"></div>
            <div class="quest-tracker-footer">
                <button class="quest-log">Ver Log</button>
                <button class="quest-map">Mapa</button>
            </div>
        `;
        
        // Style the quest tracker to match the HUD style from reference
        this.trackerContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 320px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(20, 20, 40, 0.85));
            border: 2px solid rgba(100, 150, 255, 0.3);
            border-radius: 12px;
            color: #ffffff;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: ${this.settings.fontSize}px;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        `;
        
        // Add to page
        document.body.appendChild(this.trackerContainer);
        
        // Get references
        this.questList = this.trackerContainer.querySelector('.quest-list');
        
        // Style sub-elements
        this.styleSubElements();
        
        // Setup event handlers
        this.setupUIHandlers();
        
        // Initial update
        this.updateTracker();
    }
    
    styleSubElements() {
        // Header styling
        const header = this.trackerContainer.querySelector('.quest-tracker-header');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: linear-gradient(90deg, rgba(100, 150, 255, 0.2), rgba(50, 100, 200, 0.1));
            border-bottom: 1px solid rgba(100, 150, 255, 0.3);
            border-radius: 10px 10px 0 0;
        `;
        
        // Title styling
        const title = this.trackerContainer.querySelector('.quest-tracker-title');
        title.style.cssText = `
            display: flex;
            align-items: center;
            font-weight: bold;
            font-size: 14px;
            color: #6495ff;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        `;
        
        const questIcon = this.trackerContainer.querySelector('.quest-icon');
        questIcon.style.cssText = `
            margin-right: 8px;
            font-size: 16px;
        `;
        
        // Controls styling
        const controls = this.trackerContainer.querySelector('.quest-tracker-controls');
        controls.style.cssText = `
            display: flex;
            gap: 8px;
        `;
        
        // Button styling
        const buttons = this.trackerContainer.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.cssText = `
                background: rgba(100, 150, 255, 0.2);
                border: 1px solid rgba(100, 150, 255, 0.4);
                color: #ffffff;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                transition: all 0.2s ease;
            `;
            
            button.addEventListener('mouseenter', () => {
                button.style.background = 'rgba(100, 150, 255, 0.4)';
                button.style.transform = 'scale(1.05)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = 'rgba(100, 150, 255, 0.2)';
                button.style.transform = 'scale(1)';
            });
        });
        
        // Quest list styling
        this.questList.style.cssText = `
            max-height: 300px;
            overflow-y: auto;
            padding: 8px;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        // Footer styling
        const footer = this.trackerContainer.querySelector('.quest-tracker-footer');
        footer.style.cssText = `
            display: flex;
            justify-content: space-between;
            padding: 8px 16px;
            background: rgba(0, 0, 0, 0.3);
            border-top: 1px solid rgba(100, 150, 255, 0.2);
            border-radius: 0 0 10px 10px;
        `;
        
        // Custom scrollbar
        this.questList.style.cssText += `
            scrollbar-width: thin;
            scrollbar-color: rgba(100, 150, 255, 0.5) transparent;
        `;
        
        // Webkit scrollbar
        const style = document.createElement('style');
        style.textContent = `
            .quest-tracker .quest-list::-webkit-scrollbar {
                width: 6px;
            }
            .quest-tracker .quest-list::-webkit-scrollbar-track {
                background: transparent;
            }
            .quest-tracker .quest-list::-webkit-scrollbar-thumb {
                background: rgba(100, 150, 255, 0.5);
                border-radius: 3px;
            }
            .quest-tracker .quest-list::-webkit-scrollbar-thumb:hover {
                background: rgba(100, 150, 255, 0.7);
            }
        `;
        document.head.appendChild(style);
    }
    
    setupUIHandlers() {
        // Toggle button
        const toggleButton = this.trackerContainer.querySelector('.quest-toggle');
        toggleButton.addEventListener('click', () => {
            this.toggleMinimized();
        });
        
        // Close button
        const closeButton = this.trackerContainer.querySelector('.quest-close');
        closeButton.addEventListener('click', () => {
            this.hide();
        });
        
        // Quest log button
        const logButton = this.trackerContainer.querySelector('.quest-log');
        logButton.addEventListener('click', () => {
            this.showQuestLog();
        });
        
        // Map button
        const mapButton = this.trackerContainer.querySelector('.quest-map');
        mapButton.addEventListener('click', () => {
            this.showQuestMap();
        });
        
        // Drag functionality
        this.setupDragHandling();
    }
    
    setupDragHandling() {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        const header = this.trackerContainer.querySelector('.quest-tracker-header');
        header.style.cursor = 'move';
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = this.trackerContainer.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            header.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            this.trackerContainer.style.left = (initialX + deltaX) + 'px';
            this.trackerContainer.style.top = (initialY + deltaY) + 'px';
            this.trackerContainer.style.right = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            header.style.cursor = 'move';
        });
    }
    
    setupEventHandlers() {
        // Listen to quest system events
        this.questSystem.onQuestAccepted = (quest) => {
            this.updateTracker();
            this.showQuestNotification(quest, 'accepted');
        };
        
        this.questSystem.onQuestCompleted = (quest) => {
            this.updateTracker();
            this.showQuestNotification(quest, 'completed');
        };
        
        this.questSystem.onObjectiveUpdated = (questId, objective, progress) => {
            this.updateQuestProgress(questId, objective, progress);
        };
        
        // Listen to game events
        if (this.game) {
            this.game.on('questUpdate', () => {
                this.updateTracker();
            });
        }
    }
    
    updateTracker() {
        this.questList.innerHTML = '';
        
        const activeQuests = this.questSystem.getActiveQuests();
        
        if (activeQuests.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Sort quests: tracked quest first, then by priority
        const trackedQuestId = this.questSystem.trackedQuestId;
        const sortedQuests = activeQuests.sort((a, b) => {
            if (a.id === trackedQuestId) return -1;
            if (b.id === trackedQuestId) return 1;
            return (b.priority || 0) - (a.priority || 0);
        });
        
        // Display quests (limit to max visible)
        const visibleQuests = sortedQuests.slice(0, this.settings.maxVisibleQuests);
        
        for (const quest of visibleQuests) {
            const questElement = this.createQuestElement(quest);
            this.questList.appendChild(questElement);
        }
        
        // Show "more" indicator if there are more quests
        if (activeQuests.length > this.settings.maxVisibleQuests) {
            const moreElement = this.createMoreIndicator(activeQuests.length - this.settings.maxVisibleQuests);
            this.questList.appendChild(moreElement);
        }
    }
    
    createQuestElement(quest) {
        const questElement = document.createElement('div');
        questElement.className = 'quest-item';
        questElement.dataset.questId = quest.id;
        
        const isTracked = quest.id === this.questSystem.trackedQuestId;
        const progress = this.calculateQuestProgress(quest);
        
        questElement.style.cssText = `
            margin-bottom: 12px;
            padding: 12px;
            background: ${isTracked ? 
                'linear-gradient(135deg, rgba(100, 150, 255, 0.2), rgba(50, 100, 200, 0.1))' : 
                'rgba(255, 255, 255, 0.05)'};
            border: ${isTracked ? 
                '2px solid rgba(100, 150, 255, 0.5)' : 
                '1px solid rgba(255, 255, 255, 0.1)'};
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        `;
        
        questElement.innerHTML = `
            <div class="quest-header">
                <div class="quest-title">
                    <span class="quest-type-icon">${this.getQuestTypeIcon(quest.type)}</span>
                    <span class="quest-name">${quest.title}</span>
                    ${isTracked ? '<span class="tracked-indicator">⭐</span>' : ''}
                </div>
                <div class="quest-progress-text">${progress}%</div>
            </div>
            <div class="quest-objectives">
                ${this.createObjectivesList(quest)}
            </div>
            <div class="quest-progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
        `;
        
        // Style quest elements
        this.styleQuestElement(questElement);
        
        // Add event listeners
        questElement.addEventListener('click', () => {
            this.onQuestClick(quest);
        });
        
        questElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showQuestContextMenu(quest, e);
        });
        
        return questElement;
    }
    
    styleQuestElement(element) {
        // Quest header
        const header = element.querySelector('.quest-header');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        `;
        
        // Quest title
        const title = element.querySelector('.quest-title');
        title.style.cssText = `
            display: flex;
            align-items: center;
            font-weight: bold;
            font-size: 13px;
            color: #6495ff;
        `;
        
        const typeIcon = element.querySelector('.quest-type-icon');
        typeIcon.style.cssText = `
            margin-right: 6px;
            font-size: 14px;
        `;
        
        const trackedIndicator = element.querySelector('.tracked-indicator');
        if (trackedIndicator) {
            trackedIndicator.style.cssText = `
                margin-left: 6px;
                font-size: 12px;
                animation: pulse 2s infinite;
            `;
        }
        
        // Progress text
        const progressText = element.querySelector('.quest-progress-text');
        progressText.style.cssText = `
            font-size: 11px;
            color: #888;
            font-weight: bold;
        `;
        
        // Objectives
        const objectives = element.querySelector('.quest-objectives');
        objectives.style.cssText = `
            margin-bottom: 8px;
        `;
        
        // Progress bar
        const progressBar = element.querySelector('.quest-progress-bar');
        progressBar.style.cssText = `
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
        `;
        
        const progressFill = element.querySelector('.progress-fill');
        progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #4ade80, #22c55e);
            transition: width 0.5s ease;
            border-radius: 2px;
        `;
    }
    
    createObjectivesList(quest) {
        let html = '';
        
        for (const objective of quest.objectives) {
            const progress = quest.progress[objective.id] || 0;
            const isCompleted = progress >= objective.amount;
            
            html += `
                <div class="objective-item ${isCompleted ? 'completed' : ''}">
                    <span class="objective-status">${isCompleted ? '✓' : '○'}</span>
                    <span class="objective-text">${objective.description}</span>
                    <span class="objective-progress">${progress}/${objective.amount}</span>
                </div>
            `;
        }
        
        return html;
    }
    
    createMoreIndicator(count) {
        const moreElement = document.createElement('div');
        moreElement.className = 'more-quests';
        moreElement.style.cssText = `
            text-align: center;
            padding: 8px;
            color: #888;
            font-size: 11px;
            cursor: pointer;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        moreElement.innerHTML = `+${count} mais quests...`;
        
        moreElement.addEventListener('click', () => {
            this.showQuestLog();
        });
        
        return moreElement;
    }
    
    showEmptyState() {
        this.questList.innerHTML = `
            <div class="empty-quests" style="
                text-align: center;
                padding: 20px;
                color: #888;
                font-style: italic;
            ">
                <div style="font-size: 24px; margin-bottom: 8px;">📜</div>
                <div>Nenhuma quest ativa</div>
                <div style="font-size: 10px; margin-top: 4px;">Fale com NPCs para encontrar quests</div>
            </div>
        `;
    }
    
    updateQuestProgress(questId, objective, progress) {
        const questElement = this.questList.querySelector(`[data-quest-id="${questId}"]`);
        if (!questElement) return;
        
        // Update progress bar
        const quest = this.questSystem.activeQuests.get(questId);
        if (quest) {
            const overallProgress = this.calculateQuestProgress(quest);
            const progressFill = questElement.querySelector('.progress-fill');
            const progressText = questElement.querySelector('.quest-progress-text');
            
            if (progressFill) {
                progressFill.style.width = overallProgress + '%';
            }
            
            if (progressText) {
                progressText.textContent = overallProgress + '%';
            }
        }
        
        // Update objective
        const objectives = questElement.querySelectorAll('.objective-item');
        objectives.forEach((objElement, index) => {
            if (quest.objectives[index] && quest.objectives[index].id === objective.id) {
                const status = objElement.querySelector('.objective-status');
                const progressSpan = objElement.querySelector('.objective-progress');
                
                if (status) {
                    status.textContent = progress >= objective.amount ? '✓' : '○';
                }
                
                if (progressSpan) {
                    progressSpan.textContent = `${progress}/${objective.amount}`;
                }
                
                // Add completion animation
                if (progress >= objective.amount) {
                    objElement.classList.add('completed');
                    this.animateObjectiveCompletion(objElement);
                }
            }
        });
    }
    
    calculateQuestProgress(quest) {
        if (!quest.objectives || quest.objectives.length === 0) return 0;
        
        let totalProgress = 0;
        let totalRequired = 0;
        
        for (const objective of quest.objectives) {
            const progress = quest.progress[objective.id] || 0;
            totalProgress += progress;
            totalRequired += objective.amount;
        }
        
        return Math.round((totalProgress / totalRequired) * 100);
    }
    
    getQuestTypeIcon(type) {
        const icons = {
            kill: '⚔️',
            collect: '📦',
            explore: '🗺️',
            escort: '🛡️',
            boss: '👹',
            craft: '🔨',
            delivery: '📬'
        };
        
        return icons[type] || '📜';
    }
    
    animateObjectiveCompletion(element) {
        element.style.animation = 'objective-complete 0.5s ease';
        
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
        
        // Add animation keyframes if not exists
        if (!document.querySelector('#quest-animations')) {
            const style = document.createElement('style');
            style.id = 'quest-animations';
            style.textContent = `
                @keyframes objective-complete {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); background: rgba(74, 222, 128, 0.3); }
                    100% { transform: scale(1); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Event handlers
    onQuestClick(quest) {
        // Track/untrack quest
        if (this.questSystem.trackedQuestId === quest.id) {
            this.questSystem.trackedQuestId = null;
        } else {
            this.questSystem.trackQuest(quest.id);
        }
        
        this.updateTracker();
    }
    
    showQuestContextMenu(quest, event) {
        // Remove existing context menu
        const existingMenu = document.querySelector('.quest-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.className = 'quest-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${event.clientX}px;
            top: ${event.clientY}px;
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid rgba(100, 150, 255, 0.5);
            border-radius: 6px;
            padding: 4px 0;
            z-index: 2000;
            min-width: 150px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        `;
        
        menu.innerHTML = `
            <div class="context-item" data-action="track">⭐ Rastrear</div>
            <div class="context-item" data-action="abandon">❌ Abandonar</div>
            <div class="context-item" data-action="details">📋 Detalhes</div>
            <div class="context-item" data-action="share">🔗 Compartilhar</div>
        `;
        
        // Style menu items
        const items = menu.querySelectorAll('.context-item');
        items.forEach(item => {
            item.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                font-size: 12px;
                color: #ffffff;
                transition: background 0.2s ease;
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(100, 150, 255, 0.3)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
        });
        
        // Add event listeners
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            this.handleContextMenuAction(action, quest);
            menu.remove();
        });
        
        document.body.appendChild(menu);
        
        // Remove menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', () => {
                if (menu.parentNode) {
                    menu.remove();
                }
            }, { once: true });
        }, 100);
    }
    
    handleContextMenuAction(action, quest) {
        switch (action) {
            case 'track':
                this.questSystem.trackQuest(quest.id);
                this.updateTracker();
                break;
                
            case 'abandon':
                if (confirm(`Tem certeza que deseja abandonar "${quest.title}"?`)) {
                    this.questSystem.abandonQuest(quest.id);
                    this.updateTracker();
                }
                break;
                
            case 'details':
                this.showQuestDetails(quest);
                break;
                
            case 'share':
                this.shareQuest(quest);
                break;
        }
    }
    
    showQuestDetails(quest) {
        // Create quest details modal
        const modal = document.createElement('div');
        modal.className = 'quest-details-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 40, 0.95));
            border: 2px solid rgba(100, 150, 255, 0.5);
            border-radius: 12px;
            padding: 20px;
            color: white;
            z-index: 2000;
            min-width: 400px;
            max-width: 600px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        
        const progress = this.calculateQuestProgress(quest);
        
        modal.innerHTML = `
            <div class="quest-details-header">
                <h3 style="margin: 0; color: #6495ff; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">${this.getQuestTypeIcon(quest.type)}</span>
                    ${quest.title}
                </h3>
                <button class="close-modal" style="
                    background: none;
                    border: none;
                    color: #888;
                    font-size: 20px;
                    cursor: pointer;
                    margin-left: auto;
                ">×</button>
            </div>
            <div class="quest-details-content" style="margin: 15px 0;">
                <p style="color: #ccc; margin-bottom: 15px;">${quest.description}</p>
                
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #6495ff; margin-bottom: 8px;">Objetivos:</h4>
                    ${this.createObjectivesList(quest)}
                </div>
                
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #6495ff; margin-bottom: 8px;">Progresso:</h4>
                    <div style="background: rgba(255, 255, 255, 0.1); border-radius: 4px; height: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #4ade80, #22c55e); height: 100%; width: ${progress}%; transition: width 0.5s ease;"></div>
                    </div>
                    <div style="text-align: center; margin-top: 4px; font-size: 12px; color: #888;">${progress}%</div>
                </div>
                
                <div>
                    <h4 style="color: #6495ff; margin-bottom: 8px;">Recompensas:</h4>
                    ${this.createRewardsList(quest.rewards)}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal handlers
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    createRewardsList(rewards) {
        if (!rewards) return '<div style="color: #888;">Nenhuma recompensa</div>';
        
        let html = '';
        
        if (rewards.xp) {
            html += `<div style="color: #f59e0b;">⭐ ${rewards.xp} EXP</div>`;
        }
        
        if (rewards.gold) {
            html += `<div style="color: #facc15;">💰 ${rewards.gold} Gold</div>`;
        }
        
        if (rewards.items) {
            for (const item of rewards.items) {
                html += `<div style="color: #a78bfa;">📦 ${item}</div>`;
            }
        }
        
        return html || '<div style="color: #888;">Nenhuma recompensa</div>';
    }
    
    shareQuest(quest) {
        // Share quest to chat
        if (this.game.chatSystem) {
            const shareText = `📜 [Quest] ${quest.title} - ${this.calculateQuestProgress(quest)}% completo`;
            this.game.chatSystem.addSystemMessage(shareText, 'info');
        }
    }
    
    showQuestLog() {
        // Show full quest log (would open a larger modal)
        console.log('Quest log - to be implemented');
    }
    
    showQuestMap() {
        // Show quest objectives on map
        console.log('Quest map - to be implemented');
    }
    
    showQuestNotification(quest, type) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'quest-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 40, 0.9));
            border: 2px solid ${type === 'completed' ? '#4ade80' : '#6495ff'};
            border-radius: 8px;
            padding: 12px 16px;
            color: white;
            z-index: 2000;
            min-width: 250px;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        
        const icon = type === 'completed' ? '✅' : '📋';
        const message = type === 'completed' ? 'Quest completada!' : 'Nova quest aceita!';
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="font-size: 20px; margin-right: 8px;">${icon}</span>
                <div>
                    <div style="font-weight: bold; color: ${type === 'completed' ? '#4ade80' : '#6495ff'};">
                        ${message}
                    </div>
                    <div style="font-size: 12px; color: #ccc;">${quest.title}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
        
        // Add animations
        if (!document.querySelector('#notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // UI control methods
    toggleMinimized() {
        this.minimized = !this.minimized;
        
        const questList = this.trackerContainer.querySelector('.quest-list');
        const footer = this.trackerContainer.querySelector('.quest-tracker-footer');
        const toggleButton = this.trackerContainer.querySelector('.quest-toggle');
        
        if (this.minimized) {
            questList.style.display = 'none';
            footer.style.display = 'none';
            toggleButton.textContent = '□';
            this.trackerContainer.style.height = 'auto';
        } else {
            questList.style.display = 'block';
            footer.style.display = 'flex';
            toggleButton.textContent = '_';
            this.trackerContainer.style.height = '';
        }
    }
    
    show() {
        this.trackerContainer.style.display = 'block';
    }
    
    hide() {
        this.trackerContainer.style.display = 'none';
    }
    
    isVisible() {
        return this.trackerContainer.style.display !== 'none';
    }
    
    // Public API
    updateQuestTracker(quest = null) {
        if (quest) {
            // Update specific quest
            const questElement = this.questList.querySelector(`[data-quest-id="${quest.id}"]`);
            if (questElement) {
                // Update existing quest element
                const newQuestElement = this.createQuestElement(quest);
                questElement.replaceWith(newQuestElement);
            }
        } else {
            // Update all quests
            this.updateTracker();
        }
    }
    
    setSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        this.updateTracker();
    }
    
    // Cleanup
    cleanup() {
        if (this.trackerContainer && this.trackerContainer.parentNode) {
            this.trackerContainer.parentNode.removeChild(this.trackerContainer);
        }
        
        // Remove styles
        const styles = ['quest-animations', 'notification-animations'];
        styles.forEach(id => {
            const style = document.querySelector(`#${id}`);
            if (style) style.remove();
        });
    }
}

export default QuestTrackerUI;
