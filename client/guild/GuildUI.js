/**
 * GuildUI.js
 * Main guild interface for Legacy of Komodo MMORPG v0.5.0
 */

class GuildUI {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.isOpen = false;
        this.currentView = 'main'; // 'main', 'directory', 'create'
        this.guildData = null;
        this.selectedMember = null;
        
        // UI Elements (created dynamically)
        this.elements = {};
        
        // Event handlers
        this.boundHandlers = {};
        
        this.createStyles();
    }

    /**
     * Create CSS styles for guild UI
     */
    createStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .guild-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 500px;
                max-height: 80vh;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #4a4a6a;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                font-family: 'Segoe UI', Tahoma, sans-serif;
                color: #e0e0e0;
                z-index: 1000;
                overflow: hidden;
                display: none;
            }
            
            .guild-panel.active {
                display: block;
            }
            
            .guild-header {
                background: linear-gradient(90deg, #4a4a6a 0%, #6a6a8a 100%);
                padding: 16px 20px;
                border-radius: 10px 10px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .guild-title {
                font-size: 18px;
                font-weight: bold;
                color: #fff;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            }
            
            .guild-tag {
                background: #ffd700;
                color: #1a1a2e;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 12px;
                margin-left: 8px;
            }
            
            .guild-close-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: #fff;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.2s;
            }
            
            .guild-close-btn:hover {
                background: rgba(255,0,0,0.5);
            }
            
            .guild-content {
                padding: 20px;
                max-height: calc(80vh - 200px);
                overflow-y: auto;
            }
            
            .guild-motd {
                background: rgba(255,215,0,0.1);
                border-left: 3px solid #ffd700;
                padding: 12px;
                margin-bottom: 16px;
                border-radius: 0 8px 8px 0;
                font-style: italic;
            }
            
            .guild-section-title {
                font-size: 14px;
                color: #aaa;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 12px;
            }
            
            .guild-member-list {
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
                overflow: hidden;
            }
            
            .guild-member-item {
                display: flex;
                align-items: center;
                padding: 10px 16px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .guild-member-item:hover {
                background: rgba(255,255,255,0.05);
            }
            
            .guild-member-item:last-child {
                border-bottom: none;
            }
            
            .guild-member-rank {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                font-size: 14px;
            }
            
            .rank-leader {
                background: linear-gradient(135deg, #ffd700, #ffaa00);
                box-shadow: 0 0 10px rgba(255,215,0,0.5);
            }
            
            .rank-officer {
                background: linear-gradient(135deg, #c0c0c0, #808080);
            }
            
            .rank-member {
                background: #4a6fa5;
            }
            
            .rank-initiate {
                background: #666;
            }
            
            .guild-member-name {
                flex: 1;
                font-size: 14px;
            }
            
            .guild-member-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-left: 8px;
            }
            
            .status-online {
                background: #4caf50;
                box-shadow: 0 0 6px #4caf50;
            }
            
            .status-offline {
                background: #666;
            }
            
            .guild-footer {
                padding: 16px 20px;
                background: rgba(0,0,0,0.3);
                display: flex;
                gap: 12px;
                border-radius: 0 0 10px 10px;
            }
            
            .guild-btn {
                flex: 1;
                padding: 10px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.2s;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .guild-btn-primary {
                background: linear-gradient(135deg, #4a6fa5, #6a8fc5);
                color: #fff;
            }
            
            .guild-btn-primary:hover {
                background: linear-gradient(135deg, #5a7fb5, #7a9fd5);
                transform: translateY(-1px);
            }
            
            .guild-btn-danger {
                background: linear-gradient(135deg, #a54a4a, #c56a6a);
                color: #fff;
            }
            
            .guild-btn-danger:hover {
                background: linear-gradient(135deg, #b55a5a, #d57a7a);
            }
            
            .guild-btn-secondary {
                background: rgba(255,255,255,0.1);
                color: #e0e0e0;
            }
            
            .guild-btn-secondary:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .guild-stats {
                display: flex;
                gap: 16px;
                margin-bottom: 16px;
                padding: 12px;
                background: rgba(255,255,255,0.03);
                border-radius: 8px;
            }
            
            .guild-stat {
                text-align: center;
                flex: 1;
            }
            
            .guild-stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #4a6fa5;
            }
            
            .guild-stat-label {
                font-size: 11px;
                color: #888;
                text-transform: uppercase;
            }
            
            .guild-context-menu {
                position: absolute;
                background: #2a2a4e;
                border: 1px solid #4a4a6a;
                border-radius: 6px;
                padding: 8px 0;
                min-width: 150px;
                z-index: 1001;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            }
            
            .guild-context-item {
                padding: 8px 16px;
                cursor: pointer;
                font-size: 13px;
                transition: background 0.2s;
            }
            
            .guild-context-item:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .guild-context-divider {
                height: 1px;
                background: rgba(255,255,255,0.1);
                margin: 4px 0;
            }
            
            .no-guild-view {
                text-align: center;
                padding: 40px 20px;
            }
            
            .no-guild-icon {
                font-size: 64px;
                margin-bottom: 16px;
            }
            
            .no-guild-title {
                font-size: 18px;
                margin-bottom: 8px;
            }
            
            .no-guild-desc {
                font-size: 13px;
                color: #888;
                margin-bottom: 24px;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Initialize the UI
     */
    initialize() {
        this.createMainPanel();
        this.setupEventListeners();
        console.log('🏰 GuildUI initialized');
    }

    /**
     * Create main guild panel
     */
    createMainPanel() {
        this.elements.panel = document.createElement('div');
        this.elements.panel.className = 'guild-panel';
        this.elements.panel.id = 'guild-panel';
        document.body.appendChild(this.elements.panel);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Keyboard shortcut (G for Guild)
        this.boundHandlers.keydown = (e) => {
            if (e.key === 'g' || e.key === 'G') {
                if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                    // Don't trigger if typing in input
                    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                        this.toggle();
                    }
                }
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        document.addEventListener('keydown', this.boundHandlers.keydown);

        // Listen for guild data updates from server
        this.game.network.on('guild:info_updated', (data) => {
            if (this.guildData && this.guildData.id === data.guildId) {
                this.refreshGuildData();
            }
        });

        this.game.network.on('guild:member_joined', () => {
            if (this.isOpen) this.refreshGuildData();
        });

        this.game.network.on('guild:member_left', () => {
            if (this.isOpen) this.refreshGuildData();
        });
    }

    /**
     * Toggle guild panel visibility
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open guild panel
     */
    async open() {
        // Fetch guild data
        const response = await this.game.network.send('guild:get_info', {});
        
        if (response.success && response.guild) {
            this.guildData = response.guild;
            this.renderGuildView();
        } else {
            this.renderNoGuildView();
        }

        this.elements.panel.classList.add('active');
        this.isOpen = true;
    }

    /**
     * Close guild panel
     */
    close() {
        this.elements.panel.classList.remove('active');
        this.isOpen = false;
        this.currentView = 'main';
        this.selectedMember = null;
    }

    /**
     * Render view for player in a guild
     */
    renderGuildView() {
        const g = this.guildData;
        const isLeader = g.myRank === 'LEADER';
        const isOfficer = isLeader || g.myRank === 'OFFICER';

        this.elements.panel.innerHTML = `
            <div class="guild-header">
                <div>
                    <span class="guild-tag">[${g.tag}]</span>
                    <span class="guild-title">${g.name}</span>
                </div>
                <button class="guild-close-btn" id="guild-close">×</button>
            </div>
            
            <div class="guild-content">
                ${g.motd ? `
                    <div class="guild-motd">
                        <strong>Message of the Day:</strong><br>
                        ${g.motd}
                    </div>
                ` : ''}
                
                <div class="guild-stats">
                    <div class="guild-stat">
                        <div class="guild-stat-value">${g.onlineCount}</div>
                        <div class="guild-stat-label">Online</div>
                    </div>
                    <div class="guild-stat">
                        <div class="guild-stat-value">${g.memberCount}</div>
                        <div class="guild-stat-label">Members</div>
                    </div>
                    <div class="guild-stat">
                        <div class="guild-stat-value">${g.maxMembers}</div>
                        <div class="guild-stat-label">Max</div>
                    </div>
                </div>
                
                <div class="guild-section-title">Members (${g.memberCount})</div>
                <div class="guild-member-list" id="guild-members">
                    ${g.members.map(m => this.renderMemberItem(m, isOfficer)).join('')}
                </div>
            </div>
            
            <div class="guild-footer">
                ${isOfficer ? `
                    <button class="guild-btn guild-btn-primary" id="guild-invite">Invite</button>
                ` : ''}
                <button class="guild-btn guild-btn-secondary" id="guild-chat">Guild Chat</button>
                ${isLeader ? `
                    <button class="guild-btn guild-btn-secondary" id="guild-settings">Settings</button>
                ` : ''}
                <button class="guild-btn guild-btn-danger" id="guild-leave">Leave</button>
            </div>
        `;

        this.attachGuildEventListeners(isOfficer, isLeader);
    }

    /**
     * Render a single member item
     */
    renderMemberItem(member, isOfficer) {
        const rankIcons = {
            'LEADER': '👑',
            'OFFICER': '⚔️',
            'MEMBER': '👤',
            'INITIATE': '🔰'
        };

        const rankClasses = {
            'LEADER': 'rank-leader',
            'OFFICER': 'rank-officer',
            'MEMBER': 'rank-member',
            'INITIATE': 'rank-initiate'
        };

        return `
            <div class="guild-member-item" data-player-id="${member.player_id}" data-rank="${member.rank}">
                <div class="guild-member-rank ${rankClasses[member.rank]}">
                    ${rankIcons[member.rank]}
                </div>
                <div class="guild-member-name">
                    ${member.username}
                    <small style="color: #888; margin-left: 8px;">Lv.${member.level}</small>
                </div>
                <div class="guild-member-status ${member.is_online ? 'status-online' : 'status-offline'}"></div>
            </div>
        `;
    }

    /**
     * Render view for player without guild
     */
    renderNoGuildView() {
        this.elements.panel.innerHTML = `
            <div class="guild-header">
                <span class="guild-title">Guild</span>
                <button class="guild-close-btn" id="guild-close">×</button>
            </div>
            
            <div class="guild-content">
                <div class="no-guild-view">
                    <div class="no-guild-icon">🏰</div>
                    <div class="no-guild-title">You are not in a guild</div>
                    <div class="no-guild-desc">
                        Join a guild to chat with allies, participate in raids, and earn exclusive rewards!
                    </div>
                    <button class="guild-btn guild-btn-primary" id="guild-browse" style="width: 100%; margin-bottom: 12px;">
                        Browse Guilds
                    </button>
                    <button class="guild-btn guild-btn-secondary" id="guild-create" style="width: 100%;">
                        Create Guild (10,000 gold)
                    </button>
                </div>
            </div>
        `;

        this.attachNoGuildEventListeners();
    }

    /**
     * Attach event listeners for guild view
     */
    attachGuildEventListeners(isOfficer, isLeader) {
        // Close button
        document.getElementById('guild-close').addEventListener('click', () => this.close());

        // Invite button
        const inviteBtn = document.getElementById('guild-invite');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', () => this.showInviteDialog());
        }

        // Chat button
        document.getElementById('guild-chat').addEventListener('click', () => {
            this.close();
            this.game.chatUI.switchToChannel('guild');
        });

        // Settings button
        const settingsBtn = document.getElementById('guild-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsDialog());
        }

        // Leave button
        document.getElementById('guild-leave').addEventListener('click', () => {
            this.confirmLeaveGuild();
        });

        // Member context menu
        document.getElementById('guild-members').addEventListener('click', (e) => {
            const memberItem = e.target.closest('.guild-member-item');
            if (memberItem) {
                const playerId = memberItem.dataset.playerId;
                const rank = memberItem.dataset.rank;
                this.showMemberContextMenu(playerId, rank, e, isOfficer, isLeader);
            }
        });
    }

    /**
     * Attach event listeners for no guild view
     */
    attachNoGuildEventListeners() {
        document.getElementById('guild-close').addEventListener('click', () => this.close());
        document.getElementById('guild-browse').addEventListener('click', () => this.showDirectory());
        document.getElementById('guild-create').addEventListener('click', () => this.showCreateDialog());
    }

    /**
     * Show invite dialog
     */
    showInviteDialog() {
        const username = prompt('Enter player username to invite:');
        if (username && username.trim()) {
            this.game.network.send('guild:invite', { username: username.trim() })
                .then(response => {
                    if (response.success) {
                        this.game.showNotification(response.message, 'success');
                    } else {
                        this.game.showNotification(response.error, 'error');
                    }
                });
        }
    }

    /**
     * Show leave guild confirmation
     */
    confirmLeaveGuild() {
        if (confirm('Are you sure you want to leave this guild?')) {
            this.game.network.send('guild:leave', {})
                .then(response => {
                    if (response.success) {
                        this.game.showNotification(response.message, 'success');
                        this.close();
                        this.open(); // Reopen to show no guild view
                    } else {
                        this.game.showNotification(response.error, 'error');
                    }
                });
        }
    }

    /**
     * Show member context menu
     */
    showMemberContextMenu(playerId, rank, event, isOfficer, isLeader) {
        // Remove existing context menu
        const existing = document.querySelector('.guild-context-menu');
        if (existing) existing.remove();

        const isSelf = playerId === this.game.playerId;
        const canManage = isOfficer && !isSelf && rank !== 'LEADER';
        const canPromote = isLeader && !isSelf;

        const menu = document.createElement('div');
        menu.className = 'guild-context-menu';
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;

        let menuItems = [
            `<div class="guild-context-item" onclick="guildUI.whisperMember('${playerId}')">Whisper</div>`,
            `<div class="guild-context-item" onclick="guildUI.viewProfile('${playerId}')">View Profile</div>`
        ];

        if (canManage) {
            menuItems.push('<div class="guild-context-divider"></div>');
            if (rank === 'INITIATE' || rank === 'MEMBER') {
                menuItems.push(`<div class="guild-context-item" onclick="guildUI.promoteMember('${playerId}')">Promote</div>`);
            }
            if (rank === 'OFFICER' || rank === 'MEMBER') {
                menuItems.push(`<div class="guild-context-item" onclick="guildUI.demoteMember('${playerId}')">Demote</div>`);
            }
            menuItems.push(`<div class="guild-context-item" onclick="guildUI.kickMember('${playerId}')" style="color: #ff6666;">Kick</div>`);
        }

        if (canPromote && rank === 'OFFICER') {
            menuItems.push('<div class="guild-context-divider"></div>');
            menuItems.push(`<div class="guild-context-item" onclick="guildUI.transferLeadership('${playerId}')">Transfer Leadership</div>`);
        }

        menu.innerHTML = menuItems.join('');
        document.body.appendChild(menu);

        // Close on outside click
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    /**
     * Refresh guild data
     */
    async refreshGuildData() {
        if (!this.isOpen || !this.guildData) return;
        
        const response = await this.game.network.send('guild:get_info', {});
        if (response.success && response.guild) {
            this.guildData = response.guild;
            this.renderGuildView();
        }
    }

    /**
     * Show guild directory
     */
    showDirectory() {
        // This would open the directory UI
        this.game.showNotification('Guild directory - coming soon!', 'info');
    }

    /**
     * Show create guild dialog
     */
    showCreateDialog() {
        // This would open the create modal
        this.game.showNotification('Create guild - coming soon!', 'info');
    }

    // Context menu actions (attached to window for onclick handlers)
    whisperMember(playerId) {
        document.querySelector('.guild-context-menu')?.remove();
        const member = this.guildData.members.find(m => m.player_id === playerId);
        if (member) {
            this.game.chatUI.startWhisper(member.username);
        }
    }

    viewProfile(playerId) {
        document.querySelector('.guild-context-menu')?.remove();
        this.game.showNotification('Profile view - coming soon!', 'info');
    }

    async promoteMember(playerId) {
        document.querySelector('.guild-context-menu')?.remove();
        const member = this.guildData.members.find(m => m.player_id === playerId);
        const ranks = { 'INITIATE': 'MEMBER', 'MEMBER': 'OFFICER' };
        const newRank = ranks[member?.rank];
        
        if (newRank && confirm(`Promote ${member.username} to ${newRank}?`)) {
            const response = await this.game.network.send('guild:promote', {
                playerId,
                newRank
            });
            this.game.showNotification(response.message, response.success ? 'success' : 'error');
            if (response.success) this.refreshGuildData();
        }
    }

    async demoteMember(playerId) {
        document.querySelector('.guild-context-menu')?.remove();
        const member = this.guildData.members.find(m => m.player_id === playerId);
        const ranks = { 'OFFICER': 'MEMBER', 'MEMBER': 'INITIATE' };
        const newRank = ranks[member?.rank];
        
        if (newRank && confirm(`Demote ${member.username} to ${newRank}?`)) {
            const response = await this.game.network.send('guild:promote', {
                playerId,
                newRank
            });
            this.game.showNotification(response.message, response.success ? 'success' : 'error');
            if (response.success) this.refreshGuildData();
        }
    }

    async kickMember(playerId) {
        document.querySelector('.guild-context-menu')?.remove();
        const member = this.guildData.members.find(m => m.player_id === playerId);
        
        if (member && confirm(`Kick ${member.username} from the guild?`)) {
            const response = await this.game.network.send('guild:kick', { playerId });
            this.game.showNotification(response.message, response.success ? 'success' : 'error');
            if (response.success) this.refreshGuildData();
        }
    }

    async transferLeadership(playerId) {
        document.querySelector('.guild-context-menu')?.remove();
        const member = this.guildData.members.find(m => m.player_id === playerId);
        
        if (member && confirm(`Transfer guild leadership to ${member.username}? This action cannot be undone.`)) {
            const response = await this.game.network.send('guild:transfer_leadership', { playerId });
            this.game.showNotification(response.message, response.success ? 'success' : 'error');
            if (response.success) this.refreshGuildData();
        }
    }

    showSettingsDialog() {
        this.game.showNotification('Guild settings - coming soon!', 'info');
    }
}

// Expose to window for onclick handlers
window.guildUI = null;

module.exports = GuildUI;
