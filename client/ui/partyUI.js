/**
 * Party UI System - Party Management Interface
 * Handles party display, member management, and communication
 * Version 0.3.3 - Cooperative Multiplayer Gameplay
 */

class PartyUI {
    constructor(game) {
        this.game = game;
        this.party = null;
        this.isOpen = false;
        this.invites = new Map();
        
        // UI Elements
        this.container = null;
        this.membersList = null;
        this.invitesList = null;
        
        // Configuration
        this.config = {
            maxPartySize: 5,
            showOfflineMembers: false,
            autoAcceptInvites: false
        };
        
        // Class icons and colors
        this.classIcons = {
            warrior: '⚔️',
            mage: '🔮',
            rogue: '🗡️'
        };
        
        this.classColors = {
            warrior: '#e74c3c',
            mage: '#3498db',
            rogue: '#2ecc71'
        };
        
        this.initialize();
    }
    
    initialize() {
        this.createPartyUI();
        this.setupEventListeners();
        this.setupSocketEvents();
    }
    
    createPartyUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'party-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 280px;
            max-height: 400px;
            background: linear-gradient(135deg, rgba(44, 62, 80, 0.95) 0%, rgba(52, 73, 94, 0.95) 100%);
            border: 3px solid #34495e;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 998;
            font-family: 'Segoe UI', Arial, sans-serif;
            display: none;
            overflow: hidden;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
            color: #ecf0f1;
            padding: 12px;
            font-weight: bold;
            font-size: 14px;
            text-align: center;
            border-bottom: 2px solid #1a252f;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const title = document.createElement('span');
        title.textContent = 'Grupo';
        
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        closeButton.style.cssText = `
            background: #e74c3c;
            color: white;
            border: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeButton.onclick = () => this.toggle();
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        // Create content area
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 10px;
            max-height: 350px;
            overflow-y: auto;
        `;
        
        // Create party members section
        const membersSection = document.createElement('div');
        membersSection.style.cssText = `
            margin-bottom: 15px;
        `;
        
        const membersTitle = document.createElement('div');
        membersTitle.style.cssText = `
            color: #ecf0f1;
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 12px;
        `;
        membersTitle.textContent = 'Membros';
        
        this.membersList = document.createElement('div');
        this.membersList.id = 'party-members-list';
        this.membersList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 5px;
        `;
        
        membersSection.appendChild(membersTitle);
        membersSection.appendChild(this.membersList);
        
        // Create actions section
        const actionsSection = document.createElement('div');
        actionsSection.style.cssText = `
            display: flex;
            gap: 5px;
            margin-bottom: 15px;
        `;
        
        const inviteButton = this.createActionButton('Convidar', () => this.showInviteDialog());
        const leaveButton = this.createActionButton('Sair', () => this.leaveParty());
        
        actionsSection.appendChild(inviteButton);
        actionsSection.appendChild(leaveButton);
        
        // Create invites section
        const invitesSection = document.createElement('div');
        invitesSection.style.cssText = `
            border-top: 1px solid #34495e;
            padding-top: 10px;
        `;
        
        const invitesTitle = document.createElement('div');
        invitesTitle.style.cssText = `
            color: #ecf0f1;
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 12px;
        `;
        invitesTitle.textContent = 'Convites';
        
        this.invitesList = document.createElement('div');
        this.invitesList.id = 'party-invites-list';
        this.invitesList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 5px;
        `;
        
        invitesSection.appendChild(invitesTitle);
        invitesSection.appendChild(this.invitesList);
        
        // Assemble UI
        content.appendChild(membersSection);
        content.appendChild(actionsSection);
        content.appendChild(invitesSection);
        this.container.appendChild(header);
        this.container.appendChild(content);
        document.body.appendChild(this.container);
    }
    
    createActionButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            flex: 1;
            padding: 8px;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.2s ease;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = 'linear-gradient(135deg, #2980b9 0%, #21618c 100%)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
        });
        
        button.addEventListener('click', onClick);
        
        return button;
    }
    
    createMemberElement(member) {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'party-member';
        memberDiv.dataset.memberId = member.id;
        
        const isLeader = member.isLeader;
        const classIcon = this.classIcons[member.class] || '❓';
        const classColor = this.classColors[member.class] || '#95a5a6';
        
        memberDiv.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px;
            background: linear-gradient(135deg, rgba(52, 73, 94, 0.5) 0%, rgba(44, 62, 80, 0.5) 100%);
            border: 1px solid ${isLeader ? '#f39c12' : '#34495e'};
            border-radius: 5px;
            color: #ecf0f1;
            font-size: 12px;
            transition: all 0.2s ease;
        `;
        
        memberDiv.addEventListener('mouseenter', () => {
            memberDiv.style.background = 'linear-gradient(135deg, rgba(52, 73, 94, 0.8) 0%, rgba(44, 62, 80, 0.8) 100%)';
        });
        
        memberDiv.addEventListener('mouseleave', () => {
            memberDiv.style.background = 'linear-gradient(135deg, rgba(52, 73, 94, 0.5) 0%, rgba(44, 62, 80, 0.5) 100%)';
        });
        
        // Class icon
        const icon = document.createElement('div');
        icon.textContent = classIcon;
        icon.style.cssText = `
            font-size: 16px;
            margin-right: 8px;
            filter: drop-shadow(0 0 3px ${classColor});
        `;
        
        // Member info
        const info = document.createElement('div');
        info.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
        `;
        
        const name = document.createElement('div');
        name.style.cssText = `
            font-weight: bold;
            color: ${classColor};
        `;
        name.textContent = member.name;
        
        if (isLeader) {
            name.textContent += ' 👑';
        }
        
        const level = document.createElement('div');
        level.style.cssText = `
            font-size: 10px;
            color: #bdc3c7;
        `;
        level.textContent = `Nível ${member.level}`;
        
        info.appendChild(name);
        info.appendChild(level);
        
        // Actions (for leader)
        if (this.party && this.party.isLeader && !isLeader) {
            const actions = document.createElement('div');
            actions.style.cssText = `
                display: flex;
                gap: 3px;
            `;
            
            const promoteButton = this.createMiniButton('⬆️', () => this.promoteMember(member.id));
            const kickButton = this.createMiniButton('❌', () => this.kickMember(member.id));
            
            actions.appendChild(promoteButton);
            actions.appendChild(kickButton);
            
            memberDiv.appendChild(icon);
            memberDiv.appendChild(info);
            memberDiv.appendChild(actions);
        } else {
            memberDiv.appendChild(icon);
            memberDiv.appendChild(info);
        }
        
        return memberDiv;
    }
    
    createMiniButton(icon, onClick) {
        const button = document.createElement('button');
        button.innerHTML = icon;
        button.style.cssText = `
            width: 20px;
            height: 20px;
            background: rgba(52, 73, 94, 0.8);
            color: #ecf0f1;
            border: 1px solid #34495e;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(231, 76, 60, 0.8)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(52, 73, 94, 0.8)';
        });
        
        button.addEventListener('click', onClick);
        
        return button;
    }
    
    createInviteElement(invite) {
        const inviteDiv = document.createElement('div');
        inviteDiv.className = 'party-invite';
        inviteDiv.dataset.inviteId = invite.from;
        
        inviteDiv.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px;
            background: linear-gradient(135deg, rgba(46, 204, 113, 0.2) 0%, rgba(39, 174, 96, 0.2) 100%);
            border: 1px solid #27ae60;
            border-radius: 5px;
            color: #ecf0f1;
            font-size: 12px;
            animation: pulse 2s infinite;
        `;
        
        // Invite text
        const text = document.createElement('div');
        text.style.cssText = `
            flex: 1;
        `;
        text.textContent = `${invite.fromName} convidou você para o grupo`;
        
        // Action buttons
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 3px;
        `;
        
        const acceptButton = this.createMiniButton('✓', () => this.acceptInvite(invite.partyId));
        const declineButton = this.createMiniButton('✕', () => this.declineInvite(invite.from));
        
        actions.appendChild(acceptButton);
        actions.appendChild(declineButton);
        
        inviteDiv.appendChild(text);
        inviteDiv.appendChild(actions);
        
        return inviteDiv;
    }
    
    setupEventListeners() {
        // Keyboard shortcut to toggle party UI
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                this.toggle();
            }
        });
    }
    
    setupSocketEvents() {
        // Party events
        this.game.socket.on('partyCreated', (data) => {
            this.handlePartyCreated(data);
        });
        
        this.game.socket.on('partyJoined', (data) => {
            this.handlePartyJoined(data);
        });
        
        this.game.socket.on('partyLeft', () => {
            this.handlePartyLeft();
        });
        
        this.game.socket.on('partyKicked', (data) => {
            this.handlePartyKicked(data);
        });
        
        this.game.socket.on('partyMemberJoined', (data) => {
            this.handlePartyMemberJoined(data);
        });
        
        this.game.socket.on('partyMemberLeft', (data) => {
            this.handlePartyMemberLeft(data);
        });
        
        this.game.socket.on('partyMemberKicked', (data) => {
            this.handlePartyMemberKicked(data);
        });
        
        this.game.socket.on('partyLeaderChanged', (data) => {
            this.handlePartyLeaderChanged(data);
        });
        
        this.game.socket.on('partyMemberDisconnected', (data) => {
            this.handlePartyMemberDisconnected(data);
        });
        
        this.game.socket.on('partyMemberLevelUp', (data) => {
            this.handlePartyMemberLevelUp(data);
        });
        
        // Invite events
        this.game.socket.on('partyInvite', (data) => {
            this.handlePartyInvite(data);
        });
        
        this.game.socket.on('partyInviteExpired', (data) => {
            this.handlePartyInviteExpired(data);
        });
        
        // Loot events
        this.game.socket.on('partyLoot', (data) => {
            this.handlePartyLoot(data);
        });
        
        // Error events
        this.game.socket.on('partyError', (data) => {
            this.showNotification(data.message, 'error');
        });
    }
    
    handlePartyCreated(data) {
        this.party = {
            id: data.partyId,
            members: data.members,
            isLeader: data.isLeader
        };
        
        this.renderParty();
        this.showNotification('Grupo criado!', 'success');
    }
    
    handlePartyJoined(data) {
        this.party = {
            id: data.partyId,
            members: data.members,
            isLeader: data.isLeader
        };
        
        this.renderParty();
        this.showNotification('Você entrou no grupo!', 'success');
    }
    
    handlePartyLeft() {
        this.party = null;
        this.renderParty();
        this.showNotification('Você saiu do grupo', 'info');
    }
    
    handlePartyKicked(data) {
        this.party = null;
        this.renderParty();
        this.showNotification('Você foi removido do grupo', 'warning');
    }
    
    handlePartyMemberJoined(data) {
        if (this.party) {
            this.party.members.push(data.member);
            this.renderParty();
            this.showNotification(`${data.member.name} entrou no grupo`, 'info');
        }
    }
    
    handlePartyMemberLeft(data) {
        if (this.party) {
            this.party.members = this.party.members.filter(m => m.id !== data.memberId);
            this.renderParty();
            this.showNotification(`${data.memberName} saiu do grupo`, 'info');
        }
    }
    
    handlePartyMemberKicked(data) {
        if (this.party) {
            this.party.members = this.party.members.filter(m => m.id !== data.memberId);
            this.renderParty();
            this.showNotification(`${data.memberName} foi removido do grupo`, 'info');
        }
    }
    
    handlePartyLeaderChanged(data) {
        if (this.party) {
            // Update leader status
            this.party.members.forEach(member => {
                member.isLeader = member.id === data.newLeaderId;
            });
            
            this.party.isLeader = this.party.members.find(m => m.id === this.game.player?.id)?.isLeader || false;
            
            this.renderParty();
            this.showNotification(`${data.newLeaderName} é o novo líder`, 'info');
        }
    }
    
    handlePartyMemberDisconnected(data) {
        if (this.party) {
            const member = this.party.members.find(m => m.id === data.memberId);
            if (member) {
                member.disconnected = true;
                this.renderParty();
                this.showNotification(`${data.memberName} desconectou`, 'warning');
            }
        }
    }
    
    handlePartyMemberLevelUp(data) {
        this.showNotification(`${data.memberName} alcançou nível ${data.newLevel}!`, 'success');
        
        // Update member level in UI
        if (this.party) {
            const member = this.party.members.find(m => m.id === data.memberId);
            if (member) {
                member.level = data.newLevel;
                this.renderParty();
            }
        }
    }
    
    handlePartyInvite(data) {
        this.invites.set(data.from, data);
        this.renderInvites();
        this.showNotification(`${data.from} convidou você para o grupo!`, 'info');
    }
    
    handlePartyInviteExpired(data) {
        this.invites.delete(data.from);
        this.renderInvites();
        this.showNotification('Convite expirou', 'info');
    }
    
    handlePartyLoot(data) {
        this.showNotification(`${data.playerName} recebeu loot!`, 'success');
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.isOpen = true;
        this.container.style.display = 'block';
        
        // Request party info if not available
        if (!this.party) {
            this.game.socket.emit('requestPartyInfo');
        }
    }
    
    close() {
        this.isOpen = false;
        this.container.style.display = 'none';
    }
    
    renderParty() {
        this.membersList.innerHTML = '';
        
        if (!this.party) {
            const emptyMessage = document.createElement('div');
            emptyMessage.style.cssText = `
                text-align: center;
                color: #7f8c8d;
                padding: 20px;
                font-style: italic;
            `;
            emptyMessage.textContent = 'Você não está em um grupo';
            this.membersList.appendChild(emptyMessage);
            return;
        }
        
        // Sort members: leader first, then by level
        const sortedMembers = [...this.party.members].sort((a, b) => {
            if (a.isLeader) return -1;
            if (b.isLeader) return 1;
            return b.level - a.level;
        });
        
        for (const member of sortedMembers) {
            const memberElement = this.createMemberElement(member);
            this.membersList.appendChild(memberElement);
        }
    }
    
    renderInvites() {
        this.invitesList.innerHTML = '';
        
        if (this.invites.size === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.style.cssText = `
                text-align: center;
                color: #7f8c8d;
                padding: 10px;
                font-style: italic;
                font-size: 11px;
            `;
            emptyMessage.textContent = 'Nenhum convite pendente';
            this.invitesList.appendChild(emptyMessage);
            return;
        }
        
        for (const invite of this.invites.values()) {
            const inviteElement = this.createInviteElement(invite);
            this.invitesList.appendChild(inviteElement);
        }
    }
    
    showInviteDialog() {
        const playerName = prompt('Digite o nome do jogador para convidar:');
        if (!playerName) return;
        
        this.game.socket.emit('inviteToParty', { targetPlayerName: playerName });
    }
    
    leaveParty() {
        if (!this.party) return;
        
        if (confirm('Tem certeza que deseja sair do grupo?')) {
            this.game.socket.emit('leaveParty');
        }
    }
    
    promoteMember(memberId) {
        if (!this.party || !this.party.isLeader) return;
        
        this.game.socket.emit('promotePartyLeader', { targetPlayerId: memberId });
    }
    
    kickMember(memberId) {
        if (!this.party || !this.party.isLeader) return;
        
        const member = this.party.members.find(m => m.id === memberId);
        if (!member) return;
        
        if (confirm(`Tem certeza que deseja remover ${member.name} do grupo?`)) {
            this.game.socket.emit('kickFromParty', { targetPlayerId: memberId });
        }
    }
    
    acceptInvite(partyId) {
        this.game.socket.emit('acceptPartyInvite', { partyId: partyId });
        this.invites.clear();
        this.renderInvites();
    }
    
    declineInvite(fromPlayerId) {
        this.game.socket.emit('declinePartyInvite', { partyId: this.invites.get(fromPlayerId)?.partyId });
        this.invites.delete(fromPlayerId);
        this.renderInvites();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1003;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            max-width: 300px;
            font-size: 12px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
            error: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            info: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            warning: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
        };
        return colors[type] || colors.info;
    }
    
    // Public API
    isInParty() {
        return !!this.party;
    }
    
    getPartySize() {
        return this.party ? this.party.members.length : 0;
    }
    
    isPartyLeader() {
        return this.party ? this.party.isLeader : false;
    }
    
    getPartyMembers() {
        return this.party ? this.party.members : [];
    }
    
    // Cleanup
    cleanup() {
        if (this.container) this.container.remove();
        this.invites.clear();
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    @keyframes pulse {
        0% {
            box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.4);
        }
        70% {
            box-shadow: 0 0 0 10px rgba(39, 174, 96, 0);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(39, 174, 96, 0);
        }
    }
    
    .party-ui::-webkit-scrollbar {
        width: 6px;
    }
    
    .party-ui::-webkit-scrollbar-track {
        background: rgba(44, 62, 80, 0.3);
        border-radius: 3px;
    }
    
    .party-ui::-webkit-scrollbar-thumb {
        background: #34495e;
        border-radius: 3px;
    }
    
    .party-ui::-webkit-scrollbar-thumb:hover {
        background: #4a5f7f;
    }
`;
document.head.appendChild(style);

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PartyUI;
} else {
    window.PartyUI = PartyUI;
}
