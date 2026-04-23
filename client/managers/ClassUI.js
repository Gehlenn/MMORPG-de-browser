/**
 * ClassUI - Client-side interface for Ragnarök-style class system
 * Shows class tree, handles job changes, displays skills
 */

class ClassUI {
    constructor(gameplayEngine) {
        this.gameplayEngine = gameplayEngine;
        this.classData = null;
        this.skillTree = null;
        this.isVisible = false;
        this.currentTab = 'tree'; // tree, skills, change
        
        this.createStyles();
        this.createPanel();
        this.setupSocketListeners();
    }

    initialize() {
        this.setupKeyboardShortcuts();
        console.log('[ClassUI] Initialized');
    }

    setupSocketListeners() {
        if (!this.gameplayEngine.socket) return;

        // Class data update
        this.gameplayEngine.socket.on('class:data', (data) => {
            this.classData = data;
            this.render();
        });

        // Job change available
        this.gameplayEngine.socket.on('class:can_evolve', (data) => {
            this.showEvolutionDialog(data);
        });

        // Job change success
        this.gameplayEngine.socket.on('class:job_change', (data) => {
            this.showJobChangeAnimation(data);
        });

        // Master title
        this.gameplayEngine.socket.on('class:master_title', (data) => {
            this.showMasterTitleAnimation(data);
        });
    }

    createStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .class-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 900px;
                height: 650px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #e94560;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                z-index: 10000;
                display: none;
                flex-direction: column;
                overflow: hidden;
            }

            .class-panel.visible {
                display: flex;
            }

            .class-header {
                background: linear-gradient(90deg, #e94560, #ff6b6b);
                padding: 16px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .class-title {
                font-size: 22px;
                font-weight: bold;
                color: white;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .class-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .class-tabs {
                display: flex;
                background: rgba(0,0,0,0.3);
                padding: 8px 16px;
                gap: 8px;
            }

            .class-tab {
                background: transparent;
                border: 1px solid rgba(233, 69, 96, 0.3);
                color: #aaa;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .class-tab:hover, .class-tab.active {
                background: #e94560;
                border-color: #e94560;
                color: white;
            }

            .class-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }

            /* Class Tree View */
            .class-tree {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 40px;
            }

            .tree-tier {
                display: flex;
                justify-content: center;
                gap: 60px;
                position: relative;
            }

            .tree-node {
                background: rgba(255,255,255,0.1);
                border: 3px solid rgba(255,255,255,0.2);
                border-radius: 16px;
                padding: 20px;
                width: 160px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                position: relative;
            }

            .tree-node:hover {
                background: rgba(255,255,255,0.15);
                transform: scale(1.05);
            }

            .tree-node.active {
                border-color: #e94560;
                background: rgba(233, 69, 96, 0.2);
                box-shadow: 0 0 20px rgba(233, 69, 96, 0.4);
            }

            .tree-node.master {
                border-color: #ffd700;
                background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1));
            }

            .tree-node.locked {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .node-icon {
                font-size: 40px;
                margin-bottom: 8px;
            }

            .node-name {
                font-size: 14px;
                font-weight: bold;
                color: white;
                margin-bottom: 4px;
            }

            .node-level {
                font-size: 12px;
                color: #aaa;
            }

            .tree-connector {
                position: absolute;
                width: 2px;
                background: rgba(255,255,255,0.2);
                top: -40px;
                height: 40px;
            }

            /* Evolution Dialog */
            .evolution-dialog {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 10002;
                display: none;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            }

            .evolution-dialog.visible {
                display: flex;
                animation: fadeIn 0.5s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .evolution-title {
                font-size: 32px;
                color: #ffd700;
                margin-bottom: 30px;
                text-align: center;
            }

            .evolution-options {
                display: flex;
                gap: 40px;
                justify-content: center;
            }

            .evolution-card {
                background: linear-gradient(135deg, rgba(233, 69, 96, 0.3), rgba(233, 69, 96, 0.1));
                border: 3px solid #e94560;
                border-radius: 20px;
                padding: 30px;
                width: 250px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
            }

            .evolution-card:hover {
                transform: scale(1.1);
                box-shadow: 0 0 40px rgba(233, 69, 96, 0.6);
            }

            .evolution-icon {
                font-size: 60px;
                margin-bottom: 16px;
            }

            .evolution-name {
                font-size: 24px;
                font-weight: bold;
                color: white;
                margin-bottom: 12px;
            }

            .evolution-desc {
                font-size: 14px;
                color: #ccc;
                line-height: 1.5;
            }

            .evolution-skills {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid rgba(255,255,255,0.2);
            }

            .evolution-skill {
                font-size: 12px;
                color: #e94560;
                margin: 4px 0;
            }

            /* Master Title Animation */
            .master-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle, rgba(255,215,0,0.3), rgba(0,0,0,0.95));
                z-index: 10003;
                display: none;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            }

            .master-overlay.visible {
                display: flex;
                animation: masterGlow 3s ease;
            }

            @keyframes masterGlow {
                0% { opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { opacity: 0; }
            }

            .master-text {
                font-size: 24px;
                color: #ffd700;
                margin-bottom: 20px;
            }

            .master-title {
                font-size: 48px;
                font-weight: bold;
                color: #ffd700;
                text-shadow: 0 0 30px #ffd700;
                animation: masterPulse 2s infinite;
            }

            @keyframes masterPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            /* Responsive */
            @media (max-width: 950px) {
                .class-panel {
                    width: 95vw;
                    height: 85vh;
                }

                .tree-tier {
                    gap: 20px;
                    flex-wrap: wrap;
                }

                .tree-node {
                    width: 120px;
                    padding: 15px;
                }

                .evolution-options {
                    flex-direction: column;
                    gap: 20px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'class-panel';
        this.panel.innerHTML = `
            <div class="class-header">
                <div class="class-title">
                    <span>⚔️</span>
                    <span>Sistema de Classes</span>
                </div>
                <button class="class-close" onclick="window.classUI.hide()">×</button>
            </div>
            <div class="class-tabs">
                <button class="class-tab active" data-tab="tree" onclick="window.classUI.switchTab('tree')">
                    Árvore de Classes
                </button>
                <button class="class-tab" data-tab="skills" onclick="window.classUI.switchTab('skills')">
                    Habilidades
                </button>
            </div>
            <div class="class-content" id="class-content"></div>
        `;

        // Evolution dialog
        this.evolutionDialog = document.createElement('div');
        this.evolutionDialog.className = 'evolution-dialog';
        this.evolutionDialog.innerHTML = `
            <div class="evolution-title">🌟 Escolha sua Evolução! 🌟</div>
            <div class="evolution-options" id="evolution-options"></div>
        `;

        // Master overlay
        this.masterOverlay = document.createElement('div');
        this.masterOverlay.className = 'master-overlay';
        this.masterOverlay.innerHTML = `
            <div class="master-text">Você alcançou o pináculo!</div>
            <div class="master-title" id="master-title-text"></div>
        `;

        document.body.appendChild(this.panel);
        document.body.appendChild(this.evolutionDialog);
        document.body.appendChild(this.masterOverlay);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'J' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape') {
                this.hide();
                this.hideEvolutionDialog();
            }
        });
    }

    show() {
        this.isVisible = true;
        this.panel.classList.add('visible');
        this.requestClassData();
    }

    hide() {
        this.isVisible = false;
        this.panel.classList.remove('visible');
    }

    toggle() {
        if (this.isVisible) this.hide();
        else this.show();
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.panel.querySelectorAll('.class-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        this.render();
    }

    requestClassData() {
        if (this.gameplayEngine.socket) {
            this.gameplayEngine.socket.emit('class:get_data');
        }
    }

    render() {
        const content = document.getElementById('class-content');
        if (!content) return;

        if (this.currentTab === 'tree') {
            content.innerHTML = this.renderClassTree();
        } else if (this.currentTab === 'skills') {
            content.innerHTML = this.renderSkills();
        }
    }

    renderClassTree() {
        if (!this.classData) {
            return '<div style="text-align:center;color:#aaa;padding:40px;">Carregando dados da classe...</div>';
        }

        const { base_class, first_job, second_job, is_master } = this.classData;

        // Base tier
        const baseClass = this.getClassInfo(base_class);
        const baseActive = !first_job;

        // First job tier
        let firstJobsHtml = '';
        if (baseClass?.nextJobs) {
            firstJobsHtml = `
                <div class="tree-tier">
                    ${baseClass.nextJobs.map(jobId => {
                        const job = this.getClassInfo(jobId);
                        const isActive = first_job === jobId;
                        const isLocked = !first_job || (first_job !== jobId && !second_job);
                        return `
                            <div class="tree-node ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}" 
                                 ${!isLocked ? `onclick="window.classUI.requestEvolution('${jobId}')"` : ''}>
                                <div class="tree-connector"></div>
                                <div class="node-icon">${job?.icon || '❓'}</div>
                                <div class="node-name">${job?.name || jobId}</div>
                                <div class="node-level">Nv. 50</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // Second job tier
        let secondJobsHtml = '';
        if (first_job) {
            const firstJobInfo = this.getClassInfo(first_job);
            if (firstJobInfo?.nextJobs) {
                secondJobsHtml = `
                    <div class="tree-tier">
                        ${firstJobInfo.nextJobs.map(jobId => {
                            const job = this.getClassInfo(jobId);
                            const isActive = second_job === jobId;
                            const isLocked = !second_job || second_job !== jobId;
                            return `
                                <div class="tree-node ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''} ${isActive && is_master ? 'master' : ''}"
                                     ${!isLocked ? `onclick="window.classUI.requestEvolution('${jobId}')"` : ''}>
                                    <div class="tree-connector"></div>
                                    <div class="node-icon">${job?.icon || '❓'}</div>
                                    <div class="node-name">${job?.name || jobId}</div>
                                    <div class="node-level">Nv. 80${isActive && is_master ? ' ⭐ MESTRE' : ''}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
        }

        return `
            <div class="class-tree">
                <div class="tree-tier">
                    <div class="tree-node ${baseActive ? 'active' : ''}">
                        <div class="node-icon">${baseClass?.icon || '⚔️'}</div>
                        <div class="node-name">${baseClass?.name || base_class}</div>
                        <div class="node-level">Nv. 1</div>
                    </div>
                </div>
                ${firstJobsHtml}
                ${secondJobsHtml}
            </div>
        `;
    }

    renderSkills() {
        if (!this.classData?.skills) {
            return '<div style="text-align:center;color:#aaa;padding:40px;">Nenhuma habilidade aprendida</div>';
        }

        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                ${this.classData.skills.map(skill => `
                    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px;">
                        <div style="font-size: 20px; margin-bottom: 8px;">⚡</div>
                        <div style="font-weight: bold; color: white; margin-bottom: 4px;">${skill.skill_id}</div>
                        <div style="font-size: 12px; color: #aaa;">Nv. ${skill.skill_level}/${skill.max_level}</div>
                        <div style="font-size: 11px; color: #e94560; margin-top: 8px; text-transform: uppercase;">
                            ${skill.job_tier}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getClassInfo(classId) {
        // This would be populated from server data
        const classes = {
            swordsman: { icon: '⚔️', name: 'Espadachim', nextJobs: ['knight', 'crusader'] },
            archer: { icon: '🏹', name: 'Arqueiro', nextJobs: ['hunter', 'bard_dancer'] },
            mage: { icon: '🔮', name: 'Mago', nextJobs: ['wizard', 'sage'] },
            thief: { icon: '🗡️', name: 'Ladrão', nextJobs: ['assassin', 'rogue'] },
            knight: { icon: '🛡️', name: 'Cavaleiro', nextJobs: ['lord_knight', 'paladin'] },
            crusader: { icon: '✝️', name: 'Cruzado', nextJobs: ['paladin', 'templar'] },
            hunter: { icon: '🐺', name: 'Caçador', nextJobs: ['sniper', 'beast_master'] },
            bard_dancer: { icon: '🎵', name: 'Bardo/Dançarina', nextJobs: ['minstrel_gypsy', 'maestro_wanderer'] },
            wizard: { icon: '🔥', name: 'Feiticeiro', nextJobs: ['high_wizard', 'warlock'] },
            sage: { icon: '📚', name: 'Sábio', nextJobs: ['scholar', 'sorcerer'] },
            assassin: { icon: '☠️', name: 'Assassino', nextJobs: ['assassin_cross', 'guillotine_cross'] },
            rogue: { icon: '🎭', name: 'Trapaceiro', nextJobs: ['stalker', 'shadow_chaser'] }
        };
        return classes[classId] || { icon: '❓', name: classId };
    }

    showEvolutionDialog(data) {
        const optionsEl = document.getElementById('evolution-options');
        if (!optionsEl) return;

        optionsEl.innerHTML = data.options.map(opt => `
            <div class="evolution-card" onclick="window.classUI.confirmEvolution('${opt.id}')">
                <div class="evolution-icon">${opt.icon}</div>
                <div class="evolution-name">${opt.name}</div>
                <div class="evolution-desc">${opt.description}</div>
                <div class="evolution-skills">
                    ${opt.skills.slice(0, 3).map(s => `<div class="evolution-skill">⚡ ${s}</div>`).join('')}
                </div>
            </div>
        `).join('');

        this.evolutionDialog.classList.add('visible');
    }

    hideEvolutionDialog() {
        this.evolutionDialog.classList.remove('visible');
    }

    requestEvolution(jobId) {
        if (this.gameplayEngine.socket) {
            this.gameplayEngine.socket.emit('class:request_evolution', { jobId });
        }
    }

    confirmEvolution(jobId) {
        this.hideEvolutionDialog();
        if (this.gameplayEngine.socket) {
            this.gameplayEngine.socket.emit('class:confirm_evolution', { jobId });
        }
    }

    showJobChangeAnimation(data) {
        // Could show a fancy animation here
        if (this.gameplayEngine.toastManager) {
            this.gameplayEngine.toastManager.show(
                `Evolução completa! Você agora é ${data.className}!`,
                'success'
            );
        }
        this.requestClassData();
    }

    showMasterTitleAnimation(data) {
        const titleEl = document.getElementById('master-title-text');
        if (titleEl) {
            titleEl.textContent = data.title;
        }

        this.masterOverlay.classList.add('visible');

        setTimeout(() => {
            this.masterOverlay.classList.remove('visible');
        }, 3000);

        if (this.gameplayEngine.toastManager) {
            this.gameplayEngine.toastManager.show(
                `Parabéns! Você recebeu o título: ${data.title}!`,
                'achievement'
            );
        }
    }
}

window.ClassUI = ClassUI;
