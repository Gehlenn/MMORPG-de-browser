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
            
            /* Guild Directory Styles */
            .guild-directory {
                padding: 20px;
            }
            
            .guild-directory-header {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .guild-directory-search {
                flex: 1;
                padding: 10px 14px;
                background: rgba(255,255,255,0.05);
                border: 1px solid #4a4a6a;
                border-radius: 6px;
                color: #fff;
                font-size: 14px;
            }
            
            .guild-directory-search:focus {
                outline: none;
                border-color: #4a6fa5;
            }
            
            .guild-directory-list {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .guild-directory-item {
                display: flex;
                align-items: center;
                padding: 12px;
                background: rgba(255,255,255,0.03);
                border-radius: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .guild-directory-item:hover {
                background: rgba(255,255,255,0.08);
            }
            
            .guild-directory-info {
                flex: 1;
            }
            
            .guild-directory-name {
                font-weight: bold;
                color: #fff;
            }
            
            .guild-directory-meta {
                font-size: 12px;
                color: #888;
                margin-top: 4px;
            }
            
            .guild-directory-tag {
                background: #ffd700;
                color: #1a1a2e;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                margin-right: 12px;
            }
            
            /* Create Guild Modal */
            .guild-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1001;
            }
            
            .guild-modal {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #4a4a6a;
                border-radius: 12px;
                width: 420px;
                max-width: 90vw;
                overflow: hidden;
            }
            
            .guild-modal-header {
                background: linear-gradient(90deg, #4a6fa5 0%, #6a8fc5 100%);
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .guild-modal-title {
                font-size: 18px;
                font-weight: bold;
                color: #fff;
            }
            
            .guild-modal-body {
                padding: 20px;
            }
            
            .guild-form-group {
                margin-bottom: 16px;
            }
            
            .guild-form-label {
                display: block;
                font-size: 13px;
                color: #aaa;
                margin-bottom: 6px;
            }
            
            .guild-form-input {
                width: 100%;
                padding: 10px 12px;
                background: rgba(255,255,255,0.05);
                border: 1px solid #4a4a6a;
                border-radius: 6px;
                color: #fff;
                font-size: 14px;
                box-sizing: border-box;
            }
            
            .guild-form-input:focus {
                outline: none;
                border-color: #4a6fa5;
            }
            
            .guild-form-hint {
                font-size: 11px;
                color: #666;
                margin-top: 4px;
            }
            
            .guild-form-error {
                font-size: 12px;
                color: #ff6666;
                margin-top: 4px;
                display: none;
            }
            
            .guild-form-error.visible {
                display: block;
            }
            
            .guild-requirements {
                background: rgba(255,215,0,0.1);
                border-left: 3px solid #ffd700;
                padding: 12px;
                margin-bottom: 16px;
                font-size: 13px;
            }
            
            .guild-requirement-item {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }
            
            .guild-requirement-met {
                color: #4caf50;
            }
            
            .guild-requirement-unmet {
                color: #ff6666;
            }
            
            .guild-modal-footer {
                padding: 16px 20px;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                border-top: 1px solid rgba(255,255,255,0.1);
            }
            
            /* Settings Dialog */
            .guild-settings-textarea {
                width: 100%;
                min-height: 100px;
                padding: 10px 12px;
                background: rgba(255,255,255,0.05);
                border: 1px solid #4a4a6a;
                border-radius: 6px;
                color: #fff;
                font-size: 14px;
                resize: vertical;
                box-sizing: border-box;
            }
            
            .guild-settings-textarea:focus {
                outline: none;
                border-color: #4a6fa5;
            }
            
            .guild-char-count {
                font-size: 11px;
                color: #666;
                text-align: right;
                margin-top: 4px;
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
    async showDirectory() {
        this.currentView = 'directory';
        this.close(); // Close current panel
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'guild-modal-overlay';
        overlay.id = 'guild-directory-modal';
        
        overlay.innerHTML = `
            <div class="guild-modal" style="width: 500px;">
                <div class="guild-modal-header">
                    <span class="guild-modal-title">🏰 Guild Directory</span>
                    <button class="guild-close-btn" id="guild-dir-close">×</button>
                </div>
                <div class="guild-directory">
                    <div class="guild-directory-header">
                        <input type="text" 
                               class="guild-directory-search" 
                               id="guild-dir-search"
                               placeholder="Search guilds by name or tag...">
                    </div>
                    <div class="guild-directory-list" id="guild-dir-list">
                        <div style="text-align: center; padding: 40px; color: #888;">
                            Loading guilds...
                        </div>
                    </div>
                </div>
                <div class="guild-modal-footer">
                    <button class="guild-btn guild-btn-secondary" id="guild-dir-back">
                        ← Back
                    </button>
                    <button class="guild-btn guild-btn-primary" id="guild-dir-create">
                        Create Guild
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Event listeners
        document.getElementById('guild-dir-close').addEventListener('click', () => {
            overlay.remove();
            this.open();
        });
        
        document.getElementById('guild-dir-back').addEventListener('click', () => {
            overlay.remove();
            this.open();
        });
        
        document.getElementById('guild-dir-create').addEventListener('click', () => {
            overlay.remove();
            this.showCreateDialog();
        });
        
        // Search functionality
        let searchTimeout;
        document.getElementById('guild-dir-search').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchGuilds(e.target.value);
            }, 300);
        });
        
        // Load guilds
        await this.loadGuildDirectory();
    }
    
    /**
     * Load guild directory data
     */
    async loadGuildDirectory() {
        const listEl = document.getElementById('guild-dir-list');
        
        try {
            const response = await this.game.network.send('guild:browse', { limit: 50 });
            
            if (response.success && response.guilds) {
                this.renderGuildList(response.guilds);
            } else {
                listEl.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #888;">
                        No guilds found.<br>
                        <small>Be the first to create one!</small>
                    </div>
                `;
            }
        } catch (err) {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ff6666;">
                    Error loading guilds.<br>
                    <small>Please try again later.</small>
                </div>
            `;
        }
    }
    
    /**
     * Search guilds
     */
    async searchGuilds(query) {
        const listEl = document.getElementById('guild-dir-list');
        listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #888;">Searching...</div>';
        
        try {
            const response = await this.game.network.send('guild:browse', { 
                search: query,
                limit: 50 
            });
            
            if (response.success && response.guilds?.length > 0) {
                this.renderGuildList(response.guilds);
            } else {
                listEl.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #888;">
                        No guilds found matching "${query}"
                    </div>
                `;
            }
        } catch (err) {
            console.error('Search error:', err);
        }
    }
    
    /**
     * Render guild list
     */
    renderGuildList(guilds) {
        const listEl = document.getElementById('guild-dir-list');
        
        if (guilds.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    No guilds found.
                </div>
            `;
            return;
        }
        
        listEl.innerHTML = guilds.map(g => `
            <div class="guild-directory-item" data-guild-id="${g.id}">
                <span class="guild-directory-tag">[${g.tag}]</span>
                <div class="guild-directory-info">
                    <div class="guild-directory-name">${g.name}</div>
                    <div class="guild-directory-meta">
                        ${g.memberCount}/${g.maxMembers} members • ${g.onlineCount} online
                        ${g.recruiting ? ' • 🏳️ Recruiting' : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        listEl.querySelectorAll('.guild-directory-item').forEach(item => {
            item.addEventListener('click', () => {
                const guildId = item.dataset.guildId;
                this.viewGuildDetails(guildId);
            });
        });
    }
    
    /**
     * View guild details
     */
    viewGuildDetails(guildId) {
        // For now, show a notification
        // In the future, this could show guild info + apply button
        this.game.showNotification('Guild details view - coming soon!', 'info');
    }

    /**
     * Show create guild dialog
     */
    showCreateDialog() {
        this.currentView = 'create';
        
        const player = this.game.player || {};
        const hasEnoughGold = (player.gold || 0) >= 10000;
        const hasEnoughLevel = (player.level || 1) >= 10;
        
        // Remove any existing modal
        document.getElementById('guild-create-modal')?.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'guild-modal-overlay';
        overlay.id = 'guild-create-modal';
        
        overlay.innerHTML = `
            <div class="guild-modal">
                <div class="guild-modal-header">
                    <span class="guild-modal-title">🏰 Create Guild</span>
                    <button class="guild-close-btn" id="guild-create-close">×</button>
                </div>
                <div class="guild-modal-body">
                    <div class="guild-requirements">
                        <div class="guild-requirement-item ${hasEnoughLevel ? 'guild-requirement-met' : 'guild-requirement-unmet'}">
                            ${hasEnoughLevel ? '✅' : '❌'} Level 10 or higher (you: ${player.level || 1})
                        </div>
                        <div class="guild-requirement-item ${hasEnoughGold ? 'guild-requirement-met' : 'guild-requirement-unmet'}">
                            ${hasEnoughGold ? '✅' : '❌'} 10,000 gold (you: ${(player.gold || 0).toLocaleString()})
                        </div>
                    </div>
                    
                    <div class="guild-form-group">
                        <label class="guild-form-label">Guild Name *</label>
                        <input type="text" 
                               class="guild-form-input" 
                               id="guild-create-name"
                               placeholder="Enter guild name (3-30 chars)"
                               maxlength="30">
                        <div class="guild-form-hint">This will be your guild's full name</div>
                        <div class="guild-form-error" id="guild-name-error"></div>
                    </div>
                    
                    <div class="guild-form-group">
                        <label class="guild-form-label">Guild Tag *</label>
                        <input type="text" 
                               class="guild-form-input" 
                               id="guild-create-tag"
                               placeholder="TAG (3-4 uppercase letters)"
                               maxlength="4"
                               style="text-transform: uppercase;">
                        <div class="guild-form-hint">Short identifier shown in chat [TAG]</div>
                        <div class="guild-form-error" id="guild-tag-error"></div>
                    </div>
                    
                    <div class="guild-form-group">
                        <label class="guild-form-label">Description</label>
                        <textarea class="guild-form-input" 
                                  id="guild-create-desc"
                                  placeholder="Describe your guild... (optional)"
                                  maxlength="200"
                                  style="min-height: 80px; resize: vertical;"></textarea>
                        <div class="guild-char-count" id="guild-desc-count">0/200</div>
                    </div>
                </div>
                <div class="guild-modal-footer">
                    <button class="guild-btn guild-btn-secondary" id="guild-create-cancel">
                        Cancel
                    </button>
                    <button class="guild-btn guild-btn-primary" id="guild-create-submit"
                            ${!hasEnoughGold || !hasEnoughLevel ? 'disabled style="opacity: 0.5;"' : ''}>
                        Create Guild (10,000 gold)
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Event listeners
        document.getElementById('guild-create-close').addEventListener('click', () => {
            overlay.remove();
            this.open();
        });
        
        document.getElementById('guild-create-cancel').addEventListener('click', () => {
            overlay.remove();
            this.open();
        });
        
        // Character counter for description
        document.getElementById('guild-create-desc').addEventListener('input', (e) => {
            document.getElementById('guild-desc-count').textContent = `${e.target.value.length}/200`;
        });
        
        // Tag validation - only uppercase letters
        document.getElementById('guild-create-tag').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
        });
        
        // Submit
        document.getElementById('guild-create-submit').addEventListener('click', () => {
            this.submitCreateGuild();
        });
    }
    
    /**
     * Submit create guild form
     */
    async submitCreateGuild() {
        const nameInput = document.getElementById('guild-create-name');
        const tagInput = document.getElementById('guild-create-tag');
        const descInput = document.getElementById('guild-create-desc');
        
        const name = nameInput.value.trim();
        const tag = tagInput.value.trim();
        const description = descInput.value.trim();
        
        // Validation
        let hasError = false;
        
        // Name validation
        const nameError = document.getElementById('guild-name-error');
        if (name.length < 3) {
            nameError.textContent = 'Guild name must be at least 3 characters';
            nameError.classList.add('visible');
            hasError = true;
        } else if (name.length > 30) {
            nameError.textContent = 'Guild name must be 30 characters or less';
            nameError.classList.add('visible');
            hasError = true;
        } else if (!/^[a-zA-Z0-9\s_-]+$/.test(name)) {
            nameError.textContent = 'Guild name can only contain letters, numbers, spaces, hyphens and underscores';
            nameError.classList.add('visible');
            hasError = true;
        } else {
            nameError.classList.remove('visible');
        }
        
        // Tag validation
        const tagError = document.getElementById('guild-tag-error');
        if (tag.length < 3 || tag.length > 4) {
            tagError.textContent = 'Tag must be 3-4 uppercase letters';
            tagError.classList.add('visible');
            hasError = true;
        } else if (!/^[A-Z]{3,4}$/.test(tag)) {
            tagError.textContent = 'Tag can only contain uppercase letters A-Z';
            tagError.classList.add('visible');
            hasError = true;
        } else {
            tagError.classList.remove('visible');
        }
        
        if (hasError) return;
        
        // Submit
        const submitBtn = document.getElementById('guild-create-submit');
        submitBtn.textContent = 'Creating...';
        submitBtn.disabled = true;
        
        try {
            const response = await this.game.network.send('guild:create', {
                name,
                tag,
                description
            });
            
            if (response.success) {
                document.getElementById('guild-create-modal')?.remove();
                this.game.showNotification(`🏰 Guild [${tag}] ${name} created successfully!`, 'success');
                this.guildData = response.guild;
                this.open();
            } else {
                this.game.showNotification(response.error || 'Failed to create guild', 'error');
                submitBtn.textContent = 'Create Guild (10,000 gold)';
                submitBtn.disabled = false;
            }
        } catch (err) {
            console.error('Create guild error:', err);
            this.game.showNotification('Network error. Please try again.', 'error');
            submitBtn.textContent = 'Create Guild (10,000 gold)';
            submitBtn.disabled = false;
        }
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

    /**
     * Show guild settings dialog
     */
    showSettingsDialog() {
        if (!this.guildData) return;
        
        const isLeader = this.guildData.myRank === 'LEADER';
        
        // Remove any existing modal
        document.getElementById('guild-settings-modal')?.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'guild-modal-overlay';
        overlay.id = 'guild-settings-modal';
        
        overlay.innerHTML = `
            <div class="guild-modal">
                <div class="guild-modal-header">
                    <span class="guild-modal-title">⚙️ Guild Settings</span>
                    <button class="guild-close-btn" id="guild-settings-close">×</button>
                </div>
                <div class="guild-modal-body">
                    <div class="guild-form-group">
                        <label class="guild-form-label">Message of the Day (MOTD)</label>
                        <textarea class="guild-settings-textarea" 
                                  id="guild-motd-input"
                                  placeholder="Set a message for all guild members..."
                                  maxlength="500"
                                  ${!isLeader ? 'disabled' : ''}>${this.guildData.motd || ''}</textarea>
                        <div class="guild-char-count" id="guild-motd-count">${(this.guildData.motd || '').length}/500</div>
                    </div>
                    
                    ${isLeader ? `
                        <div class="guild-requirements" style="margin-top: 20px;">
                            <strong>Danger Zone</strong><br>
                            <small>These actions cannot be undone</small>
                        </div>
                        
                        <button class="guild-btn guild-btn-danger" id="guild-disband-btn" style="width: 100%;">
                            🗑️ Disband Guild
                        </button>
                    ` : ''}
                </div>
                <div class="guild-modal-footer">
                    <button class="guild-btn guild-btn-secondary" id="guild-settings-cancel">
                        Cancel
                    </button>
                    ${isLeader ? `
                        <button class="guild-btn guild-btn-primary" id="guild-settings-save">
                            Save Changes
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Event listeners
        document.getElementById('guild-settings-close').addEventListener('click', () => {
            overlay.remove();
        });
        
        document.getElementById('guild-settings-cancel').addEventListener('click', () => {
            overlay.remove();
        });
        
        // Character counter
        const motdInput = document.getElementById('guild-motd-input');
        if (motdInput) {
            motdInput.addEventListener('input', (e) => {
                document.getElementById('guild-motd-count').textContent = `${e.target.value.length}/500`;
            });
        }
        
        // Save button
        if (isLeader) {
            document.getElementById('guild-settings-save').addEventListener('click', () => {
                this.saveGuildSettings();
            });
            
            // Disband button
            document.getElementById('guild-disband-btn').addEventListener('click', () => {
                this.confirmDisbandGuild();
            });
        }
    }
    
    /**
     * Save guild settings
     */
    async saveGuildSettings() {
        const motd = document.getElementById('guild-motd-input').value.trim();
        
        const saveBtn = document.getElementById('guild-settings-save');
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        try {
            const response = await this.game.network.send('guild:update_info', {
                motd: motd || null
            });
            
            if (response.success) {
                document.getElementById('guild-settings-modal')?.remove();
                this.game.showNotification('Guild settings saved!', 'success');
                this.refreshGuildData();
            } else {
                this.game.showNotification(response.error || 'Failed to save settings', 'error');
                saveBtn.textContent = 'Save Changes';
                saveBtn.disabled = false;
            }
        } catch (err) {
            console.error('Save settings error:', err);
            this.game.showNotification('Network error. Please try again.', 'error');
            saveBtn.textContent = 'Save Changes';
            saveBtn.disabled = false;
        }
    }
    
    /**
     * Confirm disband guild
     */
    confirmDisbandGuild() {
        const modal = document.getElementById('guild-settings-modal');
        
        // Replace content with confirmation
        modal.querySelector('.guild-modal-body').innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <div style="font-size: 18px; font-weight: bold; color: #ff6666; margin-bottom: 12px;">
                    Disband Guild?
                </div>
                <div style="color: #aaa; margin-bottom: 20px;">
                    This will permanently delete <strong>[${this.guildData.tag}] ${this.guildData.name}</strong>.<br>
                    All members will be removed and this action cannot be undone.
                </div>
                <div style="background: rgba(255,0,0,0.1); border: 1px solid #ff6666; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="guild-disband-confirm">
                        <span>I understand this cannot be undone</span>
                    </label>
                </div>
            </div>
        `;
        
        modal.querySelector('.guild-modal-footer').innerHTML = `
            <button class="guild-btn guild-btn-secondary" id="guild-disband-cancel">
                Cancel
            </button>
            <button class="guild-btn guild-btn-danger" id="guild-disband-confirm-btn" disabled>
                Disband Guild
            </button>
        `;
        
        document.getElementById('guild-disband-cancel').addEventListener('click', () => {
            modal.remove();
            this.showSettingsDialog();
        });
        
        document.getElementById('guild-disband-confirm').addEventListener('change', (e) => {
            document.getElementById('guild-disband-confirm-btn').disabled = !e.target.checked;
        });
        
        document.getElementById('guild-disband-confirm-btn').addEventListener('click', () => {
            this.disbandGuild();
        });
    }
    
    /**
     * Disband guild
     */
    async disbandGuild() {
        try {
            const response = await this.game.network.send('guild:disband', {});
            
            if (response.success) {
                document.getElementById('guild-settings-modal')?.remove();
                this.game.showNotification(`Guild [${this.guildData.tag}] has been disbanded.`, 'success');
                this.guildData = null;
                this.close();
                this.open(); // Show no guild view
            } else {
                this.game.showNotification(response.error || 'Failed to disband guild', 'error');
            }
        } catch (err) {
            console.error('Disband guild error:', err);
            this.game.showNotification('Network error. Please try again.', 'error');
        }
    }
}

// Expose to window for onclick handlers
window.guildUI = null;

module.exports = GuildUI;
