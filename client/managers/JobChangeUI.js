/**
 * JobChangeUI - Interface de Mudança de Classe
 * 
 * Features:
 * - Visualização da árvore de classes (91 classes)
 * - Preview de stats e skills
 * - Animação de evolução
 * - Confirmação de job change
 */

class JobChangeUI {
    constructor(partyManager) {
        this.partyManager = partyManager;
        this.visible = false;
        this.elements = {};
        this.initialized = false;
        this.currentClass = null;
        this.selectedJob = null;
        this.animationPlaying = false;
    }
    
    init() {
        if (this.initialized) return;
        
        this.createStyles();
        this.createPanel();
        this.bindKeys();
        
        this.initialized = true;
        console.log('🎭 JobChangeUI inicializada');
    }
    
    createStyles() {
        const styles = `
            .job-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1500; display: none; opacity: 0; transition: opacity 0.3s; }
            .job-overlay.active { display: flex; opacity: 1; justify-content: center; align-items: center; }
            .job-panel { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #f1c40f; border-radius: 16px; width: 900px; max-height: 90vh; overflow-y: auto; padding: 30px; box-shadow: 0 0 60px rgba(241,196,15,0.3); }
            .job-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid rgba(241,196,15,0.3); }
            .job-title { display: flex; align-items: center; gap: 16px; }
            .job-title-icon { font-size: 36px; width: 60px; height: 60px; background: linear-gradient(135deg, rgba(241,196,15,0.2), rgba(241,196,15,0.1)); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid #f1c40f; }
            .job-title-text { font-size: 22px; font-weight: bold; color: #f1c40f; }
            .job-close { background: transparent; border: 1px solid #e94560; color: #e94560; width: 40px; height: 40px; border-radius: 8px; cursor: pointer; font-size: 20px; transition: all 0.2s; }
            .job-close:hover { background: #e94560; color: white; }
            .job-tree { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }
            .job-row { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
            .job-node { background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; min-width: 140px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; }
            .job-node:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); transform: translateY(-4px); }
            .job-node.selected { border-color: #f1c40f; background: rgba(241,196,15,0.1); box-shadow: 0 0 20px rgba(241,196,15,0.3); }
            .job-node.locked { opacity: 0.5; cursor: not-allowed; }
            .job-node.current { border-color: #2ecc71; background: rgba(46,204,113,0.1); }
            .job-node-icon { font-size: 32px; margin-bottom: 8px; }
            .job-node-name { font-size: 14px; font-weight: bold; color: white; margin-bottom: 4px; }
            .job-node-level { font-size: 11px; color: #888; }
            .job-node-requirement { font-size: 10px; color: #e74c3c; margin-top: 4px; }
            .job-connector { position: absolute; bottom: -20px; left: 50%; width: 2px; height: 20px; background: rgba(255,255,255,0.2); transform: translateX(-50%); }
            .job-details { background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
            .job-details-title { font-size: 18px; font-weight: bold; color: #f1c40f; margin-bottom: 16px; }
            .job-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
            .job-stat { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; text-align: center; }
            .job-stat-value { font-size: 18px; font-weight: bold; color: white; }
            .job-stat-label { font-size: 11px; color: #888; text-transform: uppercase; margin-top: 4px; }
            .job-skills { display: flex; flex-wrap: wrap; gap: 8px; }
            .job-skill { background: rgba(52,152,219,0.2); border: 1px solid rgba(52,152,219,0.3); border-radius: 6px; padding: 6px 12px; font-size: 12px; color: #3498db; }
            .job-actions { display: flex; gap: 16px; justify-content: center; }
            .job-btn { padding: 14px 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s; }
            .job-btn.primary { background: linear-gradient(135deg, #f1c40f, #f39c12); color: black; }
            .job-btn.primary:hover { background: linear-gradient(135deg, #f5d657, #f1c40f); }
            .job-btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
            .job-btn.secondary { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #888; }
            .job-btn.secondary:hover { background: rgba(255,255,255,0.2); color: white; }
            .job-evolution-animation { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; z-index: 1600; display: none; justify-content: center; align-items: center; flex-direction: column; }
            .job-evolution-animation.active { display: flex; }
            .job-evolution-icon { font-size: 120px; animation: evolutionPulse 2s ease-in-out; margin-bottom: 24px; }
            @keyframes evolutionPulse { 0% { transform: scale(0) rotate(0deg); opacity: 0; } 50% { transform: scale(1.5) rotate(180deg); } 100% { transform: scale(1) rotate(360deg); opacity: 1; } }
            .job-evolution-text { font-size: 32px; font-weight: bold; color: #f1c40f; animation: fadeInUp 1s ease 0.5s both; }
            .job-evolution-old { font-size: 18px; color: #888; margin-bottom: 8px; animation: fadeInUp 1s ease 0.3s both; }
            .job-evolution-new { font-size: 24px; color: #2ecc71; margin-top: 8px; animation: fadeInUp 1s ease 0.7s both; }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            .job-part-effects { position: absolute; width: 100%; height: 100%; pointer-events: none; overflow: hidden; }
            .job-particle { position: absolute; width: 4px; height: 4px; background: #f1c40f; border-radius: 50%; animation: floatUp 3s linear infinite; }
            @keyframes floatUp { from { transform: translateY(100vh) rotate(0deg); opacity: 1; } to { transform: translateY(-100px) rotate(720deg); opacity: 0; } }
            .job-progress { background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 20px; }
            .job-progress-title { font-size: 14px; color: #888; margin-bottom: 12px; }
            .job-progress-bar { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
            .job-progress-fill { height: 100%; background: linear-gradient(90deg, #f1c40f, #f39c12); border-radius: 4px; transition: width 0.3s; }
            .job-progress-text { font-size: 12px; color: #888; margin-top: 8px; text-align: center; }
        `;
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    createPanel() {
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'job-overlay';
        
        this.elements.panel = document.createElement('div');
        this.elements.panel.className = 'job-panel';
        
        this.elements.overlay.appendChild(this.elements.panel);
        document.body.appendChild(this.elements.overlay);
    }
    
    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'j' || e.key === 'J') {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                this.toggle();
            }
            if (e.key === 'Escape') {
                if (this.visible) this.hide();
            }
        });
    }
    
    show(playerClass, playerLevel) {
        this.currentClass = playerClass;
        this.playerLevel = playerLevel;
        this.selectedJob = null;
        this.visible = true;
        this.elements.overlay.classList.add('active');
        this.render();
    }
    
    hide() {
        this.visible = false;
        this.elements.overlay.classList.remove('active');
    }
    
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            // Pegar dados do jogador
            const player = window.gameEngine?.player;
            if (player) {
                this.show(player.class, player.level);
            }
        }
    }
    
    render() {
        const classTree = this.getClassTree();
        
        this.elements.panel.innerHTML = `
            <div class="job-header">
                <div class="job-title">
                    <div class="job-title-icon">🎭</div>
                    <div>
                        <div class="job-title-text">Mudança de Classe</div>
                        <div style="font-size: 12px; color: #888;">Selecione sua evolução</div>
                    </div>
                </div>
                <button class="job-close" id="job-close">×</button>
            </div>
            
            ${this.renderProgressBar()}
            
            <div class="job-tree">
                ${classTree.map((tier, index) => this.renderTier(tier, index)).join('')}
            </div>
            
            ${this.renderJobDetails()}
            
            <div class="job-actions">
                <button class="job-btn secondary" id="job-cancel">Cancelar</button>
                <button class="job-btn primary" id="job-confirm" ${!this.selectedJob ? 'disabled' : ''}>
                    Confirmar Evolução
                </button>
            </div>
        `;
        
        this.bindEvents();
    }
    
    renderProgressBar() {
        const milestones = [
            { level: 10, name: '1ª Classe', reached: this.playerLevel >= 10 },
            { level: 40, name: '1ª Evolução', reached: this.playerLevel >= 40 },
            { level: 80, name: '2ª Evolução', reached: this.playerLevel >= 80 },
            { level: 99, name: 'Mestre', reached: this.playerLevel >= 99 }
        ];
        
        const progress = Math.min((this.playerLevel / 99) * 100, 100);
        const nextMilestone = milestones.find(m => !m.reached) || milestones[milestones.length - 1];
        
        return `
            <div class="job-progress">
                <div class="job-progress-title">Progresso: Nível ${this.playerLevel}/99</div>
                <div class="job-progress-bar">
                    <div class="job-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="job-progress-text">
                    ${this.playerLevel >= 99 ? '🏆 MESTRE! Todas evoluções desbloqueadas!' : 
                      `Próximo marco: Nível ${nextMilestone.level} - ${nextMilestone.name}`}
                </div>
            </div>
        `;
    }
    
    renderTier(tier, index) {
        const titles = ['', '⚔️ CLASSE BASE (Nv. 10)', '🔥 1ª EVOLUÇÃO (Nv. 40)', '⭐ 2ª EVOLUÇÃO (Nv. 80)', '👑 MESTRE (Nv. 99)'];
        
        return `
            <div style="margin-bottom: 8px; text-align: center; color: #f1c40f; font-size: 12px; font-weight: bold;">
                ${titles[index] || ''}
            </div>
            <div class="job-row">
                ${tier.map(job => this.renderJobNode(job)).join('')}
            </div>
        `;
    }
    
    renderJobNode(job) {
        const isCurrent = job.id === this.currentClass;
        const isSelected = this.selectedJob?.id === job.id;
        const isLocked = job.requiredLevel > this.playerLevel;
        const canSelect = !isLocked && !isCurrent;
        
        return `
            <div class="job-node ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''} ${isCurrent ? 'current' : ''}"
                 data-job-id="${job.id}"
                 style="${canSelect ? 'cursor: pointer;' : ''}">
                <div class="job-node-icon">${job.icon}</div>
                <div class="job-node-name">${job.name}</div>
                <div class="job-node-level">Nv. ${job.requiredLevel}</div>
                ${isLocked ? `<div class="job-node-requirement">Requer Nv. ${job.requiredLevel}</div>` : ''}
                ${isCurrent ? '<div style="font-size: 10px; color: #2ecc71; margin-top: 4px;">ATUAL</div>' : ''}
            </div>
        `;
    }
    
    renderJobDetails() {
        if (!this.selectedJob) {
            return `<div class="job-details" style="text-align: center; color: #888;">
                <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
                <div>Selecione uma classe para ver detalhes</div>
            </div>`;
        }
        
        return `
            <div class="job-details">
                <div class="job-details-title">${this.selectedJob.icon} ${this.selectedJob.name}</div>
                <div style="color: #888; font-size: 13px; margin-bottom: 16px;">${this.selectedJob.description}</div>
                
                <div style="font-size: 12px; color: #f1c40f; margin-bottom: 8px;">📊 Bônus de Atributos:</div>
                <div class="job-stats">
                    ${Object.entries(this.selectedJob.stats || {}).map(([stat, value]) => `
                        <div class="job-stat">
                            <div class="job-stat-value">+${value}</div>
                            <div class="job-stat-label">${this.getStatName(stat)}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="font-size: 12px; color: #f1c40f; margin-bottom: 8px;">⚡ Habilidades:</div>
                <div class="job-skills">
                    ${(this.selectedJob.skills || []).map(skill => `
                        <div class="job-skill">${skill}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        document.getElementById('job-close')?.addEventListener('click', () => this.hide());
        document.getElementById('job-cancel')?.addEventListener('click', () => this.hide());
        
        document.querySelectorAll('.job-node').forEach(node => {
            node.addEventListener('click', (e) => {
                const jobId = e.currentTarget.dataset.jobId;
                const job = this.findJobById(jobId);
                if (job && job.requiredLevel <= this.playerLevel && job.id !== this.currentClass) {
                    this.selectedJob = job;
                    this.render();
                }
            });
        });
        
        document.getElementById('job-confirm')?.addEventListener('click', () => {
            if (this.selectedJob) {
                this.performJobChange(this.selectedJob);
            }
        });
    }
    
    getClassTree() {
        // Simplified tree structure - em produção carregar do AdvanceClassSystem
        const baseClasses = [
            { id: 'aprendiz', name: 'Aprendiz', icon: '🎒', requiredLevel: 1, stats: {}, skills: ['Aprender'], description: 'O começo de toda jornada.' }
        ];
        
        const tier1 = [
            { id: 'guerreiro', name: 'Guerreiro', icon: '⚔️', requiredLevel: 10, stats: { str: 5, vit: 3 }, skills: ['Golpe Pesado', 'Provocar'], description: 'Especialista em combate corpo a corpo.' },
            { id: 'mago', name: 'Mago', icon: '🔮', requiredLevel: 10, stats: { int: 5, wis: 3 }, skills: ['Bola de Fogo', 'Escudo Arcano'], description: 'Mestre da magia elemental.' },
            { id: 'ladino', name: 'Ladino', icon: '🗡️', requiredLevel: 10, stats: { agi: 5, dex: 3 }, skills: ['Ataque Furtivo', 'Esconder'], description: 'Especialista em furtividade.' },
            { id: 'arqueiro', name: 'Arqueiro', icon: '🏹', requiredLevel: 10, stats: { dex: 5, agi: 3 }, skills: ['Tiro Preciso', 'Rajada'], description: 'Mestre do arco.' },
            { id: 'druida', name: 'Druida', icon: '🌿', requiredLevel: 10, stats: { wis: 4, vit: 4 }, skills: ['Cura Natural', 'Forma Animal'], description: 'Guardião da natureza.' },
            { id: 'sacerdote', name: 'Sacerdote', icon: '✨', requiredLevel: 10, stats: { wis: 5, int: 3 }, skills: ['Cura Divina', 'Bênção'], description: 'Curandeiro devoto.' },
            { id: 'bruxo', name: 'Bruxo', icon: '💀', requiredLevel: 10, stats: { int: 5, str: 3 }, skills: ['Drenar Vida', 'Maldição'], description: 'Usuário de magia negra.' }
        ];
        
        const tier2 = [
            { id: 'cavaleiro', name: 'Cavaleiro', icon: '🛡️', requiredLevel: 40, stats: { str: 8, vit: 6 }, skills: ['Escudo Sagrado', 'Investida'], description: 'Defensor inabalável.' },
            { id: 'berserker', name: 'Berserker', icon: '🪓', requiredLevel: 40, stats: { str: 10, vit: 4 }, skills: ['Fúria', 'Golpe Duplo'], description: 'Guerreiro frenético.' },
            { id: 'elementalista', name: 'Elementalista', icon: '🔥', requiredLevel: 40, stats: { int: 10, wis: 4 }, skills: ['Tempestade', 'Meteoro'], description: 'Mestre dos elementos.' },
            { id: 'assassino', name: 'Assassino', icon: '☠️', requiredLevel: 40, stats: { agi: 10, dex: 4 }, skills: ['Assassinato', 'Veneno'], description: 'Lâmina silenciosa.' },
            { id: 'cacador', name: 'Caçador', icon: '🐺', requiredLevel: 40, stats: { dex: 8, agi: 6 }, skills: ['Armadilha', 'Tiro Fatal'], description: 'Rastreador experiente.' }
        ];
        
        const tier3 = [
            { id: 'lorde_cavaleiro', name: 'Lorde Cavaleiro', icon: '👑', requiredLevel: 80, stats: { str: 12, vit: 10 }, skills: ['Aura Divina', 'Ultimate Defense'], description: 'Lenda viva da defesa.' },
            { id: 'archimago', name: 'Archimago', icon: '🔥', requiredLevel: 80, stats: { int: 15, wis: 8 }, skills: ['Apocalipse', 'Time Stop'], description: 'Mago lendário.' },
            { id: 'lamina_noturna', name: 'Lâmina Noturna', icon: '🌙', requiredLevel: 80, stats: { agi: 15, dex: 6 }, skills: ['Sombra Eterna', 'Execução'], description: 'A morte encarnada.' }
        ];
        
        const master = [
            { id: 'mestre', name: 'Mestre do Ofício', icon: '👑', requiredLevel: 99, stats: { str: 5, agi: 5, int: 5, vit: 5, dex: 5, wis: 5 }, skills: ['Ultimate Mastery', 'God Mode'], description: 'Apex da existência.' }
        ];
        
        return [baseClasses, tier1, tier2, tier3, master];
    }
    
    findJobById(id) {
        const tree = this.getClassTree();
        for (const tier of tree) {
            const job = tier.find(j => j.id === id);
            if (job) return job;
        }
        return null;
    }
    
    getStatName(stat) {
        const names = {
            str: 'Força', agi: 'Agilidade', vit: 'Vitalidade',
            int: 'Inteligência', dex: 'Destreza', wis: 'Sabedoria'
        };
        return names[stat] || stat;
    }
    
    performJobChange(job) {
        if (this.animationPlaying) return;
        this.animationPlaying = true;
        
        // Criar elemento de animação
        const animation = document.createElement('div');
        animation.className = 'job-evolution-animation';
        animation.innerHTML = `
            <div class="job-evolution-old">${this.currentClass || 'Aprendiz'}</div>
            <div class="job-evolution-icon">${job.icon}</div>
            <div class="job-evolution-text">EVOLUÇÃO!</div>
            <div class="job-evolution-new">${job.name}</div>
        `;
        document.body.appendChild(animation);
        
        // Adicionar partículas
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'job-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particle.style.background = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71'][Math.floor(Math.random() * 4)];
            animation.appendChild(particle);
        }
        
        // Mostrar animação
        setTimeout(() => animation.classList.add('active'), 10);
        
        // Esconder e limpar após animação
        setTimeout(() => {
            animation.classList.remove('active');
            setTimeout(() => animation.remove(), 500);
            this.animationPlaying = false;
            this.hide();
            
            // Notificar servidor
            this.sendJobChangeToServer(job);
        }, 3500);
    }
    
    sendJobChangeToServer(job) {
        if (window.socket) {
            window.socket.emit('job:change', {
                jobId: job.id,
                jobName: job.name,
                previousJob: this.currentClass
            });
        }
        
        // Atualizar localmente
        if (window.gameEngine?.player) {
            window.gameEngine.player.class = job.id;
        }
    }
}

window.JobChangeUI = JobChangeUI;
console.log('✅ JobChangeUI loaded');
