/**
 * PartyUI - Interface de Grupo/Party
 * 
 * Features:
 * - Painel de membros com HP/MP bars
 * - Criar/join/leave party
 * - Gerenciar convites
 * - Modo de loot
 * - Atalho de teclado (P)
 */

class PartyUI {
    constructor(partyManager) {
        this.partyManager = partyManager;
        this.visible = false;
        this.elements = {};
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        this.createStyles();
        this.createPartyPanel();
        this.bindKeys();
        
        // Bind events do manager
        if (this.partyManager) {
            this.partyManager.onPartyCreated = (party) => this.onPartyUpdate();
            this.partyManager.onPartyJoined = (party) => this.onPartyUpdate();
            this.partyManager.onPartyLeft = () => this.onPartyUpdate();
            this.partyManager.onPartyDisbanded = () => this.onPartyUpdate();
            this.partyManager.onMemberJoined = () => this.onPartyUpdate();
            this.partyManager.onMemberLeft = () => this.onPartyUpdate();
            this.partyManager.onMemberUpdated = () => this.renderMembers();
            this.partyManager.onInviteReceived = (invite) => this.showInvite(invite);
            this.partyManager.onLootModeChanged = (mode) => this.updateLootMode(mode);
        }
        
        this.initialized = true;
        console.log('👥 PartyUI inicializada');
    }
    
    createStyles() {
        const styles = `
            .party-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1400; display: none; opacity: 0; transition: opacity 0.2s; }
            .party-overlay.active { display: flex; opacity: 1; justify-content: center; align-items: center; }
            .party-panel { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #3498db; border-radius: 12px; width: 400px; max-height: 80vh; overflow-y: auto; padding: 24px; box-shadow: 0 0 50px rgba(52,152,219,0.3); }
            .party-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(52,152,219,0.3); }
            .party-title { display: flex; align-items: center; gap: 12px; }
            .party-title-icon { font-size: 28px; width: 45px; height: 45px; background: rgba(52,152,219,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .party-title-text { font-size: 18px; font-weight: bold; color: #3498db; }
            .party-close { background: transparent; border: 1px solid #e94560; color: #e94560; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 18px; transition: all 0.2s; }
            .party-close:hover { background: #e94560; color: white; }
            .party-section { margin-bottom: 20px; }
            .party-section-title { font-size: 13px; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
            .party-member { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px; transition: all 0.2s; }
            .party-member:hover { background: rgba(255,255,255,0.1); }
            .party-member.leader { border: 1px solid rgba(241,196,15,0.5); }
            .party-member.self { background: rgba(52,152,219,0.1); }
            .party-member-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; background: rgba(255,255,255,0.1); }
            .party-member-info { flex: 1; }
            .party-member-name { font-size: 14px; font-weight: bold; color: white; display: flex; align-items: center; gap: 6px; }
            .party-member-class { font-size: 11px; color: #888; }
            .party-member-bars { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
            .party-bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); position: relative; overflow: hidden; }
            .party-bar-hp { background: linear-gradient(90deg, #e74c3c, #c0392b); }
            .party-bar-mp { background: linear-gradient(90deg, #3498db, #2980b9); }
            .party-member-actions { display: flex; gap: 6px; }
            .party-member-btn { width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
            .party-member-btn.kick { background: rgba(231,76,60,0.2); color: #e74c3c; }
            .party-member-btn.kick:hover { background: #e74c60; color: white; }
            .party-member-btn.promote { background: rgba(241,196,15,0.2); color: #f1c40f; }
            .party-member-btn.promote:hover { background: #f1c40f; color: black; }
            .party-loot-mode { display: flex; gap: 8px; margin-bottom: 16px; }
            .party-loot-btn { flex: 1; padding: 10px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: #888; border-radius: 6px; cursor: pointer; font-size: 11px; transition: all 0.2s; }
            .party-loot-btn:hover { border-color: rgba(255,255,255,0.4); color: white; }
            .party-loot-btn.active { border-color: #3498db; background: rgba(52,152,219,0.1); color: #3498db; }
            .party-actions { display: flex; gap: 12px; margin-top: 16px; }
            .party-btn { flex: 1; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: bold; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .party-btn.primary { background: linear-gradient(135deg, #3498db, #2980b9); color: white; }
            .party-btn.primary:hover { background: linear-gradient(135deg, #5dade2, #3498db); }
            .party-btn.secondary { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #888; }
            .party-btn.secondary:hover { background: rgba(255,255,255,0.2); color: white; }
            .party-btn.danger { background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; }
            .party-btn.danger:hover { background: linear-gradient(135deg, #ec7063, #e74c3c); }
            .party-invite { display: flex; gap: 8px; margin-bottom: 16px; }
            .party-invite-input { flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 10px 14px; color: white; font-size: 13px; }
            .party-invite-input:focus { outline: none; border-color: #3498db; }
            .party-no-party { text-align: center; padding: 40px 20px; }
            .party-no-party-icon { font-size: 48px; margin-bottom: 16px; }
            .party-no-party-text { font-size: 14px; color: #888; margin-bottom: 20px; }
            .party-invite-notification { position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #1a1a2e, #16213e); border: 1px solid #f1c40f; border-radius: 10px; padding: 16px; z-index: 2000; box-shadow: 0 4px 20px rgba(0,0,0,0.5); animation: slideIn 0.3s ease; }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            .party-invite-title { font-size: 14px; font-weight: bold; color: #f1c40f; margin-bottom: 8px; }
            .party-invite-text { font-size: 12px; color: white; margin-bottom: 12px; }
            .party-invite-actions { display: flex; gap: 8px; }
            .party-invite-btn { flex: 1; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; }
            .party-invite-btn.accept { background: #2ecc71; color: white; }
            .party-invite-btn.decline { background: rgba(255,255,255,0.1); color: #888; }
            .party-badge { display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
            .party-badge.leader { background: rgba(241,196,15,0.2); color: #f1c40f; }
            .party-badge.offline { background: rgba(149,165,166,0.2); color: #95a5a6; }
            .party-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
            .party-stat { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 10px; text-align: center; }
            .party-stat-value { font-size: 16px; font-weight: bold; color: white; }
            .party-stat-label { font-size: 10px; color: #888; text-transform: uppercase; }
        `;
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    createPartyPanel() {
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'party-overlay';
        
        this.elements.panel = document.createElement('div');
        this.elements.panel.className = 'party-panel';
        
        this.elements.overlay.appendChild(this.elements.panel);
        document.body.appendChild(this.elements.overlay);
        
        this.render();
    }
    
    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                this.toggle();
            }
            if (e.key === 'Escape') {
                if (this.visible) this.hide();
            }
        });
    }
    
    render() {
        const status = this.partyManager?.getPartyStatus();
        
        if (!status?.inParty) {
            this.renderNoParty();
        } else {
            this.renderParty(status);
        }
    }
    
    renderNoParty() {
        this.elements.panel.innerHTML = `
            <div class="party-header">
                <div class="party-title">
                    <div class="party-title-icon">👥</div>
                    <div class="party-title-text">Grupo</div>
                </div>
                <button class="party-close" id="party-close">×</button>
            </div>
            
            <div class="party-no-party">
                <div class="party-no-party-icon">👤</div>
                <div class="party-no-party-text">Você não está em um grupo</div>
                <button class="party-btn primary" id="party-create">+ Criar Grupo</button>
            </div>
            
            <div class="party-section">
                <div class="party-section-title">📋 Convites Pendentes</div>
                <div id="party-invites-list">
                    <p style="color: #666; font-size: 12px; text-align: center;">Nenhum convite</p>
                </div>
            </div>
        `;
        
        this.bindNoPartyEvents();
    }
    
    renderParty(status) {
        const isLeader = status.isLeader;
        const members = status.members || [];
        const lootMode = status.lootMode || 'free-for-all';
        const groupType = status.groupType || 'party';
        const maxSize = status.maxSize || 5;
        const isRaid = groupType === 'raid';
        
        // Bônus de XP estilo WoW (só até 5 membros)
        const memberCount = Math.min(members.length, 5);
        const xpBonus = members.length >= 2 ? (memberCount - 1) * 20 : 0; // 20%, 40%, 60%, 80%
        
        this.elements.panel.innerHTML = `
            <div class="party-header">
                <div class="party-title">
                    <div class="party-title-icon">${isRaid ? '⚔️' : '👥'}</div>
                    <div>
                        <div class="party-title-text">${isRaid ? 'RAID' : 'GRUPO'} (${members.length}/${maxSize})</div>
                        <div style="font-size: 11px; color: ${isRaid ? '#e74c3c' : '#2ecc71'};">
                            ${isRaid ? 'XP Individual • Máx 12 membros' : `XP Compartilhado • +${xpBonus}% bônus`}
                        </div>
                    </div>
                </div>
                <button class="party-close" id="party-close">×</button>
            </div>
            
            <div class="party-stats">
                <div class="party-stat">
                    <div class="party-stat-value">${members.length}</div>
                    <div class="party-stat-label">Membros</div>
                </div>
                <div class="party-stat">
                    <div class="party-stat-value">+${xpBonus}%</div>
                    <div class="party-stat-label">XP Bonus</div>
                </div>
                <div class="party-stat">
                    <div class="party-stat-value">${this.getLootModeName(lootMode)}</div>
                    <div class="party-stat-label">Loot</div>
                </div>
            </div>
            
            ${isLeader ? `
            <div class="party-section">
                <div class="party-section-title">🎲 Modo de Loot</div>
                <div class="party-loot-mode">
                    <button class="party-loot-btn ${lootMode === 'free' ? 'active' : ''}" data-mode="free">FFA</button>
                    <button class="party-loot-btn ${lootMode === 'random' ? 'active' : ''}" data-mode="random">Round</button>
                    <button class="party-loot-btn ${lootMode === 'master' ? 'active' : ''}" data-mode="master">Master</button>
                    <button class="party-loot-btn ${lootMode === 'need_greed' ? 'active' : ''}" data-mode="need_greed">Need</button>
                </div>
            </div>
            
            <div class="party-section">
                <div class="party-section-title">🔄 Converter Grupo</div>
                <div style="display: flex; gap: 8px;">
                    <button class="party-btn ${isRaid ? 'secondary' : 'primary'}" id="convert-party" ${isRaid ? '' : 'disabled'}>
                        👥 Party (5)
                    </button>
                    <button class="party-btn ${isRaid ? 'primary' : 'secondary'}" id="convert-raid" ${!isRaid && members.length <= 5 ? '' : 'disabled'}>
                        ⚔️ Raid (12)
                    </button>
                </div>
                ${!isRaid && members.length > 5 ? '<div style="font-size: 11px; color: #e74c3c; margin-top: 8px;">Não pode converter: grupo tem +5 membros</div>' : ''}
            </div>
            ` : ''}
            
            <div class="party-section">
                <div class="party-section-title">👤 Membros ${isRaid ? '(Raid)' : ''}</div>
                <div id="party-members-list">
                    ${members.map(m => this.renderMember(m, isLeader)).join('')}
                </div>
            </div>
            
            ${isLeader && !isRaid && members.length < maxSize ? `
            <div class="party-section">
                <div class="party-section-title">📨 Convidar Jogador</div>
                <div class="party-invite">
                    <input type="text" class="party-invite-input" id="invite-player-name" placeholder="Nome do jogador...">
                    <button class="party-btn primary" id="invite-btn">Convidar</button>
                </div>
            </div>
            ` : isLeader && isRaid && members.length < maxSize ? `
            <div class="party-section">
                <div class="party-section-title">📨 Convidar para Raid</div>
                <div class="party-invite">
                    <input type="text" class="party-invite-input" id="invite-player-name" placeholder="Nome do jogador...">
                    <button class="party-btn primary" id="invite-btn">Convidar</button>
                </div>
            </div>
            ` : ''}
            
            <div class="party-actions">
                <button class="party-btn danger" id="party-leave">${isLeader ? 'Desfazer ' + (isRaid ? 'Raid' : 'Grupo') : 'Sair do ' + (isRaid ? 'Raid' : 'Grupo')}</button>
            </div>
        `;
        
        this.bindPartyEvents(isLeader);
    }
    
    renderMember(member, isLeader) {
        const isSelf = member.id === this.partyManager?.playerId;
        const isPartyLeader = member.id === this.partyManager?.currentParty?.leaderId;
        const hpPercent = (member.hp / member.maxHp) * 100;
        const mpPercent = (member.mp / member.maxMp) * 100;
        
        const classIcons = {
            warrior: '⚔️',
            mage: '🔮',
            archer: '🏹',
            rogue: '🗡️'
        };
        
        return `
            <div class="party-member ${isPartyLeader ? 'leader' : ''} ${isSelf ? 'self' : ''}">
                <div class="party-member-avatar">${classIcons[member.class] || '👤'}</div>
                <div class="party-member-info">
                    <div class="party-member-name">
                        ${member.name} ${isSelf ? '(Você)' : ''}
                        ${isPartyLeader ? '<span class="party-badge leader">LÍDER</span>' : ''}
                        ${member.status !== 'online' ? '<span class="party-badge offline">OFF</span>' : ''}
                    </div>
                    <div class="party-member-class">Nível ${member.level} • ${this.getClassName(member.class)}</div>
                    <div class="party-member-bars">
                        <div class="party-bar">
                            <div class="party-bar-hp" style="width: ${hpPercent}%"></div>
                        </div>
                        <div class="party-bar">
                            <div class="party-bar-mp" style="width: ${mpPercent}%"></div>
                        </div>
                    </div>
                </div>
                ${isLeader && !isSelf ? `
                <div class="party-member-actions">
                    <button class="party-member-btn promote" title="Promover a Líder" data-member="${member.id}">👑</button>
                    <button class="party-member-btn kick" title="Expulsar" data-member="${member.id}">🚫</button>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    renderMembers() {
        const status = this.partyManager?.getPartyStatus();
        if (!status?.inParty) return;
        
        const list = document.getElementById('party-members-list');
        if (list) {
            list.innerHTML = status.members.map(m => this.renderMember(m, status.isLeader)).join('');
            this.bindMemberActions();
        }
    }
    
    bindNoPartyEvents() {
        document.getElementById('party-close')?.addEventListener('click', () => this.hide());
        document.getElementById('party-create')?.addEventListener('click', () => {
            this.partyManager?.createParty();
        });
    }
    
    bindPartyEvents(isLeader) {
        document.getElementById('party-close')?.addEventListener('click', () => this.hide());
        document.getElementById('party-leave')?.addEventListener('click', () => {
            if (isLeader) {
                if (confirm('Deseja realmente desfazer o grupo?')) {
                    this.partyManager?.disbandParty();
                }
            } else {
                this.partyManager?.leaveParty();
            }
        });
        
        if (isLeader) {
            // Loot mode
            document.querySelectorAll('.party-loot-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const mode = e.target.dataset.mode;
                    this.partyManager?.setLootMode(mode);
                });
            });
            
            // Convert buttons
            document.getElementById('convert-party')?.addEventListener('click', () => {
                if (confirm('Converter Raid para Party? Isso limitará o grupo a 5 membros.')) {
                    this.partyManager?.convertToParty();
                }
            });
            
            document.getElementById('convert-raid')?.addEventListener('click', () => {
                if (confirm('Converter Party para Raid? Isso desativará o compartilhamento de XP.')) {
                    this.partyManager?.convertToRaid();
                }
            });
            
            // Invite
            document.getElementById('invite-btn')?.addEventListener('click', () => {
                const input = document.getElementById('invite-player-name');
                const name = input?.value?.trim();
                if (name) {
                    this.partyManager?.invitePlayer(`player_${name}`, name);
                    input.value = '';
                }
            });
            
            this.bindMemberActions();
        }
    }
    
    bindMemberActions() {
        // Kick buttons
        document.querySelectorAll('.party-member-btn.kick').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = e.target.dataset.member;
                this.partyManager?.kickMember(memberId);
            });
        });
        
        // Promote buttons
        document.querySelectorAll('.party-member-btn.promote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = e.target.dataset.member;
                this.partyManager?.transferLeadership(memberId);
            });
        });
    }
    
    showInvite(invite) {
        // Remover notificação anterior se existir
        document.querySelectorAll('.party-invite-notification').forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = 'party-invite-notification';
        notification.innerHTML = `
            <div class="party-invite-title">🎉 Convite de Grupo</div>
            <div class="party-invite-text">${invite.partyLeaderName} convidou você para o grupo!</div>
            <div class="party-invite-actions">
                <button class="party-invite-btn accept" id="invite-accept-${invite.partyId}">Aceitar</button>
                <button class="party-invite-btn decline" id="invite-decline-${invite.partyId}">Recusar</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover após 1 minuto
        setTimeout(() => {
            notification.remove();
        }, 60000);
        
        // Eventos
        document.getElementById(`invite-accept-${invite.partyId}`)?.addEventListener('click', () => {
            this.partyManager?.acceptInvite(invite.partyId);
            notification.remove();
        });
        
        document.getElementById(`invite-decline-${invite.partyId}`)?.addEventListener('click', () => {
            this.partyManager?.declineInvite(invite.partyId);
            notification.remove();
        });
    }
    
    onPartyUpdate() {
        this.render();
    }
    
    updateLootMode(mode) {
        document.querySelectorAll('.party-loot-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }
    
    getLootModeName(mode) {
        const names = {
            'free-for-all': 'FFA',
            'round-robin': 'Round',
            'master-looter': 'Master',
            'need-before-greed': 'Need'
        };
        return names[mode] || mode;
    }
    
    getClassName(classId) {
        const names = {
            warrior: 'Guerreiro',
            mage: 'Mago',
            archer: 'Arqueiro',
            rogue: 'Ladino'
        };
        return names[classId] || classId;
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

window.PartyUI = PartyUI;
