/**
 * GuildUI - Interface de Guildas
 * 
 * Features:
 * - Painel de guilda com membros
 * - Banco da guilda
 * - Habilidades de guilda
 * - Guerras
 * - Chat de guilda
 * - Criar/entrar em guildas
 * - Atalho de teclado (G)
 */

class GuildUI {
    constructor(guildManager) {
        this.guildManager = guildManager;
        this.visible = false;
        this.elements = {};
        this.currentTab = 'overview';
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        this.createStyles();
        this.createGuildPanel();
        this.bindKeys();
        
        // Bind events do manager
        if (this.guildManager) {
            this.guildManager.onGuildCreated = (guild) => {
                this.showToast(`🏰 Guilda "${guild.name}" criada!`, 'success');
                this.render();
            };
            this.guildManager.onGuildJoined = (guild) => {
                this.showToast(`🏰 Você entrou em [${guild.tag}] ${guild.name}!`, 'success');
                this.render();
            };
            this.guildManager.onGuildLeft = () => this.render();
            this.guildManager.onMemberJoined = (data) => {
                this.showToast(`➕ ${data.playerName} entrou na guilda`, 'info');
                this.render();
            };
            this.guildManager.onMemberLeft = (data) => {
                const msg = data.kicked ? `🚫 ${data.playerName} foi expulso` : `➖ ${data.playerName} saiu`;
                this.showToast(msg, 'warning');
                this.render();
            };
            this.guildManager.onInviteReceived = (invite) => this.showInvite(invite);
        }
        
        this.initialized = true;
        console.log('🏰 GuildUI inicializada');
    }
    
    createStyles() {
        const styles = `
            .guild-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1600; display: none; opacity: 0; transition: opacity 0.2s; }
            .guild-overlay.active { display: flex; opacity: 1; justify-content: center; align-items: center; }
            .guild-panel { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #9b59b6; border-radius: 12px; width: 900px; max-height: 90vh; overflow-y: auto; padding: 0; box-shadow: 0 0 50px rgba(155,89,182,0.3); }
            .guild-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid rgba(155,89,182,0.3); background: rgba(155,89,182,0.05); }
            .guild-title { display: flex; align-items: center; gap: 16px; }
            .guild-title-icon { font-size: 40px; width: 60px; height: 60px; background: rgba(155,89,182,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(155,89,182,0.3); }
            .guild-title-text { font-size: 22px; font-weight: bold; color: #9b59b6; }
            .guild-title-tag { font-size: 14px; color: #888; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; }
            .guild-close { background: transparent; border: 1px solid #e94560; color: #e94560; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 20px; transition: all 0.2s; }
            .guild-close:hover { background: #e94560; color: white; }
            .guild-tabs { display: flex; gap: 0; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); }
            .guild-tab { flex: 1; padding: 14px 20px; border: none; background: transparent; color: #888; font-size: 13px; cursor: pointer; transition: all 0.2s; border-bottom: 3px solid transparent; }
            .guild-tab:hover { color: white; background: rgba(255,255,255,0.05); }
            .guild-tab.active { color: #9b59b6; border-bottom-color: #9b59b6; background: rgba(155,89,182,0.1); }
            .guild-content { padding: 24px; min-height: 400px; }
            .guild-section { margin-bottom: 24px; }
            .guild-section-title { font-size: 14px; font-weight: bold; color: #9b59b6; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; }
            .guild-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
            .guild-stat { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; text-align: center; }
            .guild-stat-value { font-size: 24px; font-weight: bold; color: white; }
            .guild-stat-label { font-size: 11px; color: #888; text-transform: uppercase; margin-top: 4px; }
            .guild-member { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px; transition: all 0.2s; }
            .guild-member:hover { background: rgba(255,255,255,0.1); }
            .guild-member.leader { border: 1px solid rgba(241,196,15,0.5); }
            .guild-member.officer { border-left: 3px solid #3498db; }
            .guild-member.self { background: rgba(155,89,182,0.1); }
            .guild-member-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 20px; }
            .guild-member-info { flex: 1; }
            .guild-member-name { font-size: 14px; font-weight: bold; color: white; display: flex; align-items: center; gap: 8px; }
            .guild-member-rank { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
            .guild-member-rank.leader { background: rgba(241,196,15,0.2); color: #f1c40f; }
            .guild-member-rank.officer { background: rgba(52,152,219,0.2); color: #3498db; }
            .guild-member-rank.member { background: rgba(149,165,166,0.2); color: #95a5a6; }
            .guild-member-rank.initiate { background: rgba(142,68,173,0.2); color: #8e44ad; }
            .guild-member-status { font-size: 11px; color: #888; }
            .guild-member-status.online { color: #2ecc71; }
            .guild-member-contribution { font-size: 12px; color: #f1c40f; }
            .guild-member-actions { display: flex; gap: 6px; }
            .guild-member-btn { width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
            .guild-member-btn.promote { background: rgba(46,204,113,0.2); color: #2ecc71; }
            .guild-member-btn.promote:hover { background: #2ecc71; color: white; }
            .guild-member-btn.demote { background: rgba(241,196,15,0.2); color: #f1c40f; }
            .guild-member-btn.demote:hover { background: #f1c40f; color: black; }
            .guild-member-btn.kick { background: rgba(231,76,60,0.2); color: #e74c3c; }
            .guild-member-btn.kick:hover { background: #e74c3c; color: white; }
            .guild-no-guild { text-align: center; padding: 60px 20px; }
            .guild-no-guild-icon { font-size: 64px; margin-bottom: 20px; opacity: 0.5; }
            .guild-no-guild-text { font-size: 16px; color: #888; margin-bottom: 24px; }
            .guild-btn { padding: 14px 28px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s; display: inline-flex; align-items: center; gap: 10px; }
            .guild-btn.primary { background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white; }
            .guild-btn.primary:hover { background: linear-gradient(135deg, #af7ac5, #9b59b6); }
            .guild-btn.secondary { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; }
            .guild-btn.secondary:hover { background: rgba(255,255,255,0.2); }
            .guild-form { max-width: 400px; margin: 0 auto; }
            .guild-form-group { margin-bottom: 16px; }
            .guild-form-label { display: block; font-size: 12px; color: #888; margin-bottom: 6px; text-transform: uppercase; }
            .guild-form-input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 12px 14px; color: white; font-size: 14px; }
            .guild-form-input:focus { outline: none; border-color: #9b59b6; }
            .guild-form-textarea { resize: vertical; min-height: 80px; }
            .guild-bank { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .guild-bank-section { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; }
            .guild-bank-title { font-size: 14px; font-weight: bold; color: #f1c40f; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
            .guild-bank-amount { font-size: 28px; font-weight: bold; color: white; margin-bottom: 12px; }
            .guild-bank-actions { display: flex; gap: 8px; }
            .guild-bank-btn { flex: 1; padding: 10px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: white; border-radius: 6px; cursor: pointer; font-size: 12px; }
            .guild-bank-btn:hover { background: rgba(255,255,255,0.1); }
            .guild-skills { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .guild-skill { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; }
            .guild-skill-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .guild-skill-name { font-size: 14px; font-weight: bold; color: white; }
            .guild-skill-level { font-size: 12px; color: #f1c40f; }
            .guild-skill-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
            .guild-skill-progress { height: 100%; background: linear-gradient(90deg, #9b59b6, #8e44ad); border-radius: 3px; }
            .guild-skill-effect { font-size: 12px; color: #888; margin-bottom: 12px; }
            .guild-skill-btn { width: 100%; padding: 8px; background: rgba(155,89,182,0.2); border: 1px solid #9b59b6; color: #9b59b6; border-radius: 6px; cursor: pointer; font-size: 12px; }
            .guild-skill-btn:hover { background: #9b59b6; color: white; }
            .guild-skill-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .guild-list { display: grid; gap: 12px; }
            .guild-list-item { display: flex; align-items: center; gap: 16px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 8px; transition: all 0.2s; }
            .guild-list-item:hover { background: rgba(255,255,255,0.1); }
            .guild-list-icon { width: 50px; height: 50px; background: rgba(155,89,182,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; }
            .guild-list-info { flex: 1; }
            .guild-list-name { font-size: 16px; font-weight: bold; color: white; display: flex; align-items: center; gap: 8px; }
            .guild-list-tag { font-size: 11px; color: #9b59b6; background: rgba(155,89,182,0.1); padding: 2px 6px; border-radius: 4px; }
            .guild-list-desc { font-size: 12px; color: #888; margin-top: 4px; }
            .guild-list-stats { font-size: 12px; color: #888; }
            .guild-list-btn { padding: 10px 20px; background: rgba(155,89,182,0.2); border: 1px solid #9b59b6; color: #9b59b6; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; }
            .guild-list-btn:hover { background: #9b59b6; color: white; }
            .guild-invite-notification { position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #1a1a2e, #16213e); border: 1px solid #9b59b6; border-radius: 10px; padding: 16px; z-index: 2000; box-shadow: 0 4px 20px rgba(0,0,0,0.5); animation: slideInGuild 0.3s ease; }
            @keyframes slideInGuild { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            .guild-invite-title { font-size: 14px; font-weight: bold; color: #9b59b6; margin-bottom: 8px; }
            .guild-invite-text { font-size: 12px; color: white; margin-bottom: 12px; }
            .guild-invite-actions { display: flex; gap: 8px; }
            .guild-invite-btn { flex: 1; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; }
            .guild-invite-btn.accept { background: #9b59b6; color: white; }
            .guild-invite-btn.decline { background: rgba(255,255,255,0.1); color: #888; }
            .guild-toast { position: fixed; top: 80px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; font-size: 13px; z-index: 2001; animation: slideInToast 0.3s ease; }
            @keyframes slideInToast { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            .guild-toast.success { background: rgba(46,204,113,0.9); }
            .guild-toast.error { background: rgba(231,76,60,0.9); }
            .guild-toast.warning { background: rgba(241,196,15,0.9); color: black; }
            .guild-toast.info { background: rgba(52,152,219,0.9); }
        `;
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    createGuildPanel() {
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'guild-overlay';
        
        this.elements.panel = document.createElement('div');
        this.elements.panel.className = 'guild-panel';
        
        this.elements.overlay.appendChild(this.elements.panel);
        document.body.appendChild(this.elements.overlay);
    }
    
    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'g' || e.key === 'G') {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                this.toggle();
            }
            if (e.key === 'Escape') {
                if (this.visible) this.hide();
            }
        });
    }
    
    render() {
        const status = this.guildManager?.getGuildStatus();
        
        if (!status?.inGuild) {
            this.renderNoGuild();
        } else {
            this.renderGuild(status);
        }
    }
    
    renderNoGuild() {
        this.elements.panel.innerHTML = `
            <div class="guild-no-guild">
                <div class="guild-no-guild-icon">🏰</div>
                <div class="guild-no-guild-text">Você não está em uma guilda</div>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="guild-btn primary" id="guild-create-btn">+ Criar Guilda</button>
                    <button class="guild-btn secondary" id="guild-browse-btn">🔍 Procurar Guilda</button>
                </div>
            </div>
        `;
        
        this.bindNoGuildEvents();
    }
    
    renderGuild(status) {
        const guild = status.guild;
        const isLeader = status.guild.myRank === 'LEADER';
        const isOfficer = status.guild.myRank === 'OFFICER';
        
        this.elements.panel.innerHTML = `
            <div class="guild-header">
                <div class="guild-title">
                    <div class="guild-title-icon">🏰</div>
                    <div>
                        <div class="guild-title-text">${guild.name}</div>
                        <div class="guild-title-tag">[${guild.tag}] Nível ${guild.level}</div>
                    </div>
                </div>
                <button class="guild-close" id="guild-close">×</button>
            </div>
            
            <div class="guild-tabs">
                <button class="guild-tab ${this.currentTab === 'overview' ? 'active' : ''}" data-tab="overview">📋 Visão Geral</button>
                <button class="guild-tab ${this.currentTab === 'members' ? 'active' : ''}" data-tab="members">👤 Membros</button>
                <button class="guild-tab ${this.currentTab === 'bank' ? 'active' : ''}" data-tab="bank">🏦 Banco</button>
                <button class="guild-tab ${this.currentTab === 'skills' ? 'active' : ''}" data-tab="skills">⚡ Habilidades</button>
            </div>
            
            <div class="guild-content">
                ${this.renderTabContent(this.currentTab, status)}
            </div>
        `;
        
        this.bindGuildEvents(isLeader, isOfficer);
    }
    
    renderTabContent(tab, status) {
        switch(tab) {
            case 'overview': return this.renderOverview(status);
            case 'members': return this.renderMembers(status);
            case 'bank': return this.renderBank(status);
            case 'skills': return this.renderSkills(status);
            default: return this.renderOverview(status);
        }
    }
    
    renderOverview(status) {
        const guild = status.guild;
        const onlineMembers = status.members.filter(m => m.status === 'online').length;
        const skillEffects = this.guildManager?.getSkillEffects();
        
        return `
            <div class="guild-section">
                <div class="guild-section-title">📊 Estatísticas da Guilda</div>
                <div class="guild-stats">
                    <div class="guild-stat">
                        <div class="guild-stat-value">${guild.memberCount}</div>
                        <div class="guild-stat-label">Membros</div>
                    </div>
                    <div class="guild-stat">
                        <div class="guild-stat-value" style="color: #2ecc71;">${onlineMembers}</div>
                        <div class="guild-stat-label">Online</div>
                    </div>
                    <div class="guild-stat">
                        <div class="guild-stat-value">${guild.level}</div>
                        <div class="guild-stat-label">Nível</div>
                    </div>
                    <div class="guild-stat">
                        <div class="guild-stat-value">${guild.bank.gold.toLocaleString()}</div>
                        <div class="guild-stat-label">💰 Banco</div>
                    </div>
                </div>
            </div>
            
            <div class="guild-section">
                <div class="guild-section-title">📝 Descrição</div>
                <p style="color: #aaa; font-size: 13px; line-height: 1.6;">${guild.description || 'Sem descrição'}</p>
            </div>
            
            <div class="guild-section">
                <div class="guild-section-title">⚡ Bônus Ativos</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                    <div style="background: rgba(46,204,113,0.1); padding: 12px; border-radius: 8px; border-left: 3px solid #2ecc71;">
                        <div style="font-size: 12px; color: #888;">Bônus de Ataque</div>
                        <div style="font-size: 20px; font-weight: bold; color: #2ecc71;">+${skillEffects?.attackBonus || 0}%</div>
                    </div>
                    <div style="background: rgba(52,152,219,0.1); padding: 12px; border-radius: 8px; border-left: 3px solid #3498db;">
                        <div style="font-size: 12px; color: #888;">Bônus de Defesa</div>
                        <div style="font-size: 20px; font-weight: bold; color: #3498db;">+${skillEffects?.defenseBonus || 0}%</div>
                    </div>
                    <div style="background: rgba(241,196,15,0.1); padding: 12px; border-radius: 8px; border-left: 3px solid #f1c40f;">
                        <div style="font-size: 12px; color: #888;">Bônus de XP</div>
                        <div style="font-size: 20px; font-weight: bold; color: #f1c40f;">+${skillEffects?.xpBonus || 0}%</div>
                    </div>
                    <div style="background: rgba(155,89,182,0.1); padding: 12px; border-radius: 8px; border-left: 3px solid #9b59b6;">
                        <div style="font-size: 12px; color: #888;">Bônus de Ouro</div>
                        <div style="font-size: 20px; font-weight: bold; color: #9b59b6;">+${skillEffects?.goldBonus || 0}%</div>
                    </div>
                </div>
            </div>
            
            <div class="guild-section">
                <div class="guild-section-title">🎯 Sua Contribuição</div>
                <div style="background: rgba(155,89,182,0.1); padding: 16px; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #9b59b6;">${guild.myContribution.toLocaleString()} 💰</div>
                    <div style="font-size: 12px; color: #888; margin-top: 4px;">Seu rank: ${this.guildManager?.getRankName(guild.myRank) || guild.myRank}</div>
                </div>
            </div>
        `;
    }
    
    renderMembers(status) {
        const isLeader = status.guild.myRank === 'LEADER';
        const isOfficer = status.guild.myRank === 'OFFICER';
        const members = status.members;
        
        return `
            <div class="guild-section">
                <div class="guild-section-title">👤 Membros (${members.length})</div>
                <div>
                    ${members.map(m => this.renderMember(m, isLeader, isOfficer)).join('')}
                </div>
            </div>
            
            ${(isLeader || isOfficer) ? `
            <div class="guild-section">
                <div class="guild-section-title">📨 Convidar Novo Membro</div>
                <div style="display: flex; gap: 8px;">
                    <input type="text" class="guild-form-input" id="invite-player-name" placeholder="Nome do jogador...">
                    <button class="guild-btn primary" id="guild-invite-btn" style="padding: 12px 20px;">Convidar</button>
                </div>
            </div>
            ` : ''}
            
            ${isLeader ? `
            <div class="guild-section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div class="guild-section-title">⚠️ Zona de Perigo</div>
                <button class="guild-btn" id="guild-disband-btn" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white;">
                    💥 Desfazer Guilda
                </button>
            </div>
            ` : ''}
        `;
    }
    
    renderMember(member, isLeader, isOfficer) {
        const isSelf = member.id === this.guildManager?.playerId;
        const rankClass = member.rank.toLowerCase();
        const canManage = (isLeader || (isOfficer && member.rank !== 'OFFICER' && member.rank !== 'LEADER')) && !isSelf;
        
        return `
            <div class="guild-member ${member.rank === 'LEADER' ? 'leader' : ''} ${member.rank === 'OFFICER' ? 'officer' : ''} ${isSelf ? 'self' : ''}">
                <div class="guild-member-avatar">${this.getMemberAvatar(member.rank)}</div>
                <div class="guild-member-info">
                    <div class="guild-member-name">
                        ${member.name} ${isSelf ? '(Você)' : ''}
                        <span class="guild-member-rank ${rankClass}">${this.guildManager?.getRankName(member.rank) || member.rank}</span>
                    </div>
                    <div class="guild-member-status ${member.status}">
                        ${member.status === 'online' ? '🟢 Online' : `⭕ Offline ${this.getTimeAgo(member.lastActive)}`}
                    </div>
                    ${member.contribution > 0 ? `<div class="guild-member-contribution">💰 ${member.contribution.toLocaleString()}</div>` : ''}
                </div>
                ${canManage ? `
                <div class="guild-member-actions">
                    ${isLeader && member.rank !== 'LEADER' ? `
                        ${member.rank === 'OFFICER' ? `
                            <button class="guild-member-btn demote" title="Rebaixar" data-member="${member.id}" data-rank="MEMBER">⬇️</button>
                        ` : `
                            <button class="guild-member-btn promote" title="Promover" data-member="${member.id}" data-rank="${member.rank === 'INITIATE' ? 'MEMBER' : 'OFFICER'}">⬆️</button>
                        `}
                        ${member.rank !== 'LEADER' ? `<button class="guild-member-btn kick" title="Expulsar" data-member="${member.id}">🚫</button>` : ''}
                    ` : ''}
                </div>
                ` : ''}
            </div>
        `;
    }
    
    renderBank(status) {
        const guild = status.guild;
        const isLeader = guild.myRank === 'LEADER';
        const isOfficer = guild.myRank === 'OFFICER';
        
        return `
            <div class="guild-bank">
                <div class="guild-bank-section">
                    <div class="guild-bank-title">💰 Ouro do Banco</div>
                    <div class="guild-bank-amount">${guild.bank.gold.toLocaleString()} 💰</div>
                    <div class="guild-bank-actions">
                        <button class="guild-bank-btn" id="bank-deposit-btn">Depositar</button>
                        ${(isLeader || isOfficer) ? `<button class="guild-bank-btn" id="bank-withdraw-btn">Sacar</button>` : ''}
                    </div>
                </div>
                
                <div class="guild-bank-section">
                    <div class="guild-bank-title">📦 Itens do Banco</div>
                    <div style="color: #888; font-size: 12px; margin-bottom: 12px;">${guild.bank.items?.length || 0} itens armazenados</div>
                    <div class="guild-bank-actions">
                        <button class="guild-bank-btn" id="bank-deposit-item-btn">Depositar Item</button>
                        ${(isLeader || isOfficer) ? `<button class="guild-bank-btn" id="bank-withdraw-item-btn">Sacar Item</button>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="guild-section" style="margin-top: 20px;">
                <div class="guild-section-title">📜 Histórico de Transações</div>
                <p style="color: #666; font-size: 12px;">As transações são registradas automaticamente...</p>
            </div>
        `;
    }
    
    renderSkills(status) {
        const guild = status.guild;
        const isLeader = guild.myRank === 'LEADER';
        const skillEffects = this.guildManager?.getSkillEffects();
        
        const skills = [
            { id: 'attackBonus', name: 'Força de Ataque', icon: '⚔️', desc: 'Aumenta dano em +' + (skillEffects?.attackBonus || 0) + '%' },
            { id: 'defenseBonus', name: 'Defesa Fortificada', icon: '🛡️', desc: 'Reduz dano recebido em +' + (skillEffects?.defenseBonus || 0) + '%' },
            { id: 'xpBonus', name: 'Sabedoria Ancestral', icon: '📚', desc: 'XP adicional de +' + (skillEffects?.xpBonus || 0) + '%' },
            { id: 'goldBonus', name: 'Prosperidade', icon: '💰', desc: 'Ouro adicional de +' + (skillEffects?.goldBonus || 0) + '%' }
        ];
        
        return `
            <div class="guild-section">
                <div class="guild-section-title">⚡ Habilidades da Guilda</div>
                <div class="guild-skills">
                    ${skills.map(skill => `
                        <div class="guild-skill">
                            <div class="guild-skill-header">
                                <div class="guild-skill-name">${skill.icon} ${skill.name}</div>
                                <div class="guild-skill-level">Nv. ${guild.skills[skill.id] || 0}/10</div>
                            </div>
                            <div class="guild-skill-bar">
                                <div class="guild-skill-progress" style="width: ${(guild.skills[skill.id] || 0) * 10}%"></div>
                            </div>
                            <div class="guild-skill-effect">${skill.desc}</div>
                            ${isLeader ? `
                                <button class="guild-skill-btn" data-skill="${skill.id}" ${(guild.skills[skill.id] || 0) >= 10 ? 'disabled' : ''}>
                                    ${(guild.skills[skill.id] || 0) >= 10 ? 'Máximo' : `Melhorar (${(10000 * ((guild.skills[skill.id] || 0) + 1)).toLocaleString()}💰)`}
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="guild-section" style="margin-top: 20px; padding: 16px; background: rgba(155,89,182,0.05); border-radius: 8px;">
                <div style="font-size: 13px; color: #888;">
                    💡 Apenas o líder pode melhorar as habilidades da guilda. O custo aumenta com cada nível.
                </div>
            </div>
        `;
    }
    
    renderBrowseGuilds() {
        const guilds = this.guildManager?.browseGuilds() || [];
        
        return `
            <div class="guild-header">
                <div class="guild-title">
                    <div class="guild-title-icon">🔍</div>
                    <div class="guild-title-text">Procurar Guilda</div>
                </div>
                <button class="guild-close" id="guild-close">×</button>
            </div>
            
            <div class="guild-content">
                <div class="guild-section">
                    <div class="guild-section-title">🏰 Guildas Disponíveis</div>
                    <div class="guild-list">
                        ${guilds.map(g => `
                            <div class="guild-list-item">
                                <div class="guild-list-icon">🏰</div>
                                <div class="guild-list-info">
                                    <div class="guild-list-name">
                                        ${g.name}
                                        <span class="guild-list-tag">[${g.tag}]</span>
                                    </div>
                                    <div class="guild-list-desc">${g.description || 'Sem descrição'}</div>
                                </div>
                                <div class="guild-list-stats">
                                    Nv. ${g.level} • ${g.memberCount}/${g.maxMembers} membros
                                </div>
                                <button class="guild-list-btn" data-guild="${g.id}">Solicitar Entrada</button>
                            </div>
                        `).join('')}
                        ${guilds.length === 0 ? '<p style="color: #666; text-align: center;">Nenhuma guilda disponível</p>' : ''}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button class="guild-btn secondary" id="guild-back-btn">← Voltar</button>
                </div>
            </div>
        `;
    }
    
    renderCreateForm() {
        return `
            <div class="guild-header">
                <div class="guild-title">
                    <div class="guild-title-icon">+</div>
                    <div class="guild-title-text">Criar Nova Guilda</div>
                </div>
                <button class="guild-close" id="guild-close">×</button>
            </div>
            
            <div class="guild-content">
                <div class="guild-form">
                    <div class="guild-form-group">
                        <label class="guild-form-label">Nome da Guilda</label>
                        <input type="text" class="guild-form-input" id="guild-name" placeholder="Ex: Dragões de Eldoria" maxlength="24">
                    </div>
                    
                    <div class="guild-form-group">
                        <label class="guild-form-label">Tag (3-4 letras)</label>
                        <input type="text" class="guild-form-input" id="guild-tag" placeholder="Ex: DRAG" maxlength="4" style="text-transform: uppercase;">
                    </div>
                    
                    <div class="guild-form-group">
                        <label class="guild-form-label">Descrição</label>
                        <textarea class="guild-form-input guild-form-textarea" id="guild-description" placeholder="Descreva sua guilda..."></textarea>
                    </div>
                    
                    <div style="background: rgba(241,196,15,0.1); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 12px; color: #f1c40f;">
                            💰 Custo: 10,000 ouro<br>
                            📊 Requisito: Nível 10
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button class="guild-btn primary" id="guild-create-submit">Criar Guilda</button>
                        <button class="guild-btn secondary" id="guild-create-cancel">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    bindNoGuildEvents() {
        document.getElementById('guild-close')?.addEventListener('click', () => this.hide());
        
        document.getElementById('guild-create-btn')?.addEventListener('click', () => {
            this.elements.panel.innerHTML = this.renderCreateForm();
            this.bindCreateFormEvents();
        });
        
        document.getElementById('guild-browse-btn')?.addEventListener('click', () => {
            this.elements.panel.innerHTML = this.renderBrowseGuilds();
            this.bindBrowseEvents();
        });
    }
    
    bindCreateFormEvents() {
        document.getElementById('guild-close')?.addEventListener('click', () => this.hide());
        document.getElementById('guild-create-cancel')?.addEventListener('click', () => this.render());
        
        document.getElementById('guild-create-submit')?.addEventListener('click', () => {
            const name = document.getElementById('guild-name')?.value?.trim();
            const tag = document.getElementById('guild-tag')?.value?.trim().toUpperCase();
            const description = document.getElementById('guild-description')?.value?.trim();
            
            const result = this.guildManager?.createGuild(name, tag, description);
            
            if (result?.success) {
                this.render();
            } else {
                this.showToast(result?.error || 'Erro ao criar guilda', 'error');
            }
        });
    }
    
    bindBrowseEvents() {
        document.getElementById('guild-close')?.addEventListener('click', () => this.hide());
        document.getElementById('guild-back-btn')?.addEventListener('click', () => this.render());
    }
    
    bindGuildEvents(isLeader, isOfficer) {
        document.getElementById('guild-close')?.addEventListener('click', () => this.hide());
        
        // Tabs
        document.querySelectorAll('.guild-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.currentTab = e.target.dataset.tab;
                this.render();
            });
        });
        
        // Invite
        document.getElementById('guild-invite-btn')?.addEventListener('click', () => {
            const input = document.getElementById('invite-player-name');
            const name = input?.value?.trim();
            if (name) {
                this.guildManager?.invitePlayer(`player_${name}`, name);
                input.value = '';
            }
        });
        
        // Promote/Demote/Kick
        document.querySelectorAll('.guild-member-btn.promote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = e.target.dataset.member;
                const newRank = e.target.dataset.rank;
                this.guildManager?.promoteMember(memberId, newRank);
            });
        });
        
        document.querySelectorAll('.guild-member-btn.demote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = e.target.dataset.member;
                const newRank = e.target.dataset.rank;
                this.guildManager?.promoteMember(memberId, newRank);
            });
        });
        
        document.querySelectorAll('.guild-member-btn.kick').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = e.target.dataset.member;
                if (confirm('Tem certeza que deseja expulsar este membro?')) {
                    this.guildManager?.kickMember(memberId);
                }
            });
        });
        
        // Disband
        document.getElementById('guild-disband-btn')?.addEventListener('click', () => {
            if (confirm('⚠️ ATENÇÃO: Isso irá desfazer a guilda PERMANENTEMENTE! Tem certeza?')) {
                this.guildManager?.disbandGuild();
            }
        });
        
        // Bank
        document.getElementById('bank-deposit-btn')?.addEventListener('click', () => {
            const amount = prompt('Quantidade de ouro para depositar:');
            if (amount && !isNaN(amount)) {
                this.guildManager?.depositToBank('gold', parseInt(amount));
                this.render();
            }
        });
        
        document.getElementById('bank-withdraw-btn')?.addEventListener('click', () => {
            const amount = prompt('Quantidade de ouro para sacar:');
            if (amount && !isNaN(amount)) {
                this.guildManager?.withdrawFromBank('gold', parseInt(amount));
                this.render();
            }
        });
        
        // Skills
        document.querySelectorAll('.guild-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skillId = e.target.dataset.skill;
                const result = this.guildManager?.upgradeSkill(skillId);
                if (result?.success) {
                    this.showToast(result.message, 'success');
                    this.render();
                } else {
                    this.showToast(result?.error || 'Erro', 'error');
                }
            });
        });
    }
    
    getMemberAvatar(rank) {
        const avatars = {
            'LEADER': '👑',
            'OFFICER': '⭐',
            'MEMBER': '👤',
            'INITIATE': '🌱'
        };
        return avatars[rank] || '👤';
    }
    
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'agora';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    }
    
    showInvite(invite) {
        document.querySelectorAll('.guild-invite-notification').forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = 'guild-invite-notification';
        notification.innerHTML = `
            <div class="guild-invite-title">🏰 Convite de Guilda</div>
            <div class="guild-invite-text">${invite.inviterName} convidou você para [${invite.guildTag}] ${invite.guildName}</div>
            <div class="guild-invite-actions">
                <button class="guild-invite-btn accept" id="guild-invite-accept-${invite.id}">Aceitar</button>
                <button class="guild-invite-btn decline" id="guild-invite-decline-${invite.id}">Recusar</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 60000);
        
        document.getElementById(`guild-invite-accept-${invite.id}`)?.addEventListener('click', () => {
            this.guildManager?.acceptInvite(invite.id);
            notification.remove();
        });
        
        document.getElementById(`guild-invite-decline-${invite.id}`)?.addEventListener('click', () => {
            this.guildManager?.declineInvite(invite.id);
            notification.remove();
        });
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `guild-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
    
    show() {
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
            this.show();
        }
    }
}

window.GuildUI = GuildUI;
