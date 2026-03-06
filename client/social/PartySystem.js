/**
 * Party System - Group Formation and Management
 * Handles party creation, invitations, and shared activities
 * Version 0.3 - Social & Multiplayer Systems
 */

class PartySystem {
    constructor(networkManager, chatSystem) {
        this.networkManager = networkManager;
        this.chatSystem = chatSystem;
        
        // Party data
        this.currentParty = null;
        this.partyInvites = new Map();
        this.partyHistory = [];
        
        // Party settings
        this.settings = {
            autoAcceptInvites: false,
            autoShareLoot: true,
            lootMethod: 'need_before_greed', // need_before_greed, free_for_all, master_loot
            maxPartySize: 6,
            inviteTimeout: 60000 // 1 minute
        };
        
        // UI elements
        this.partyUI = null;
        this.inviteDialog = null;
        this.lootRollDialog = null;
        
        // Event callbacks
        this.onPartyJoined = null;
        this.onPartyLeft = null;
        this.onMemberJoined = null;
        this.onMemberLeft = null;
        this.onInviteReceived = null;
        this.onLootReceived = null;
        
        // Initialize
        this.setupNetworkHandlers();
        this.createUI();
    }
    
    setupNetworkHandlers() {
        this.networkManager.registerHandler('party_invite', this.handlePartyInvite.bind(this));
        this.networkManager.registerHandler('party_invite_response', this.handleInviteResponse.bind(this));
        this.networkManager.registerHandler('party_joined', this.handlePartyJoined.bind(this));
        this.networkManager.registerHandler('party_left', this.handlePartyLeft.bind(this));
        this.networkManager.registerHandler('party_member_joined', this.handleMemberJoined.bind(this));
        this.networkManager.registerHandler('party_member_left', this.handleMemberLeft.bind(this));
        this.networkManager.registerHandler('party_disbanded', this.handlePartyDisbanded.bind(this));
        this.networkManager.registerHandler('party_leader_changed', this.handleLeaderChanged.bind(this));
        this.networkManager.registerHandler('party_loot_roll', this.handleLootRoll.bind(this));
        this.networkManager.registerHandler('party_loot_distributed', this.handleLootDistributed.bind(this));
        this.networkManager.registerHandler('party_update', this.handlePartyUpdate.bind(this));
    }
    
    createUI() {
        // Create party panel
        this.partyUI = document.createElement('div');
        this.partyUI.className = 'party-system';
        this.partyUI.innerHTML = `
            <div class="party-header">
                <h3>Party</h3>
                <div class="party-controls">
                    <button class="party-create" title="Criar Party">+</button>
                    <button class="party-leave" title="Sair da Party">×</button>
                </div>
            </div>
            <div class="party-members"></div>
            <div class="party-actions">
                <button class="party-invite">Convidar</button>
                <button class="party-settings">Configurações</button>
            </div>
            <div class="party-loot-method">
                <span>Método de Loot:</span>
                <select class="loot-method-select">
                    <option value="need_before_greed">Need Before Greed</option>
                    <option value="free_for_all">Free for All</option>
                    <option value="master_loot">Master Loot</option>
                </select>
            </div>
        `;
        
        // Style the party UI
        this.partyUI.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 250px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #444;
            border-radius: 8px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
        `;
        
        // Add to page
        document.body.appendChild(this.partyUI);
        
        // Get references
        this.membersContainer = this.partyUI.querySelector('.party-members');
        this.lootMethodSelect = this.partyUI.querySelector('.loot-method-select');
        
        // Setup event handlers
        this.setupUIHandlers();
        
        // Initially hide if not in party
        this.updateUIVisibility();
    }
    
    setupUIHandlers() {
        // Party controls
        this.partyUI.querySelector('.party-create').addEventListener('click', () => {
            this.createParty();
        });
        
        this.partyUI.querySelector('.party-leave').addEventListener('click', () => {
            this.leaveParty();
        });
        
        // Party actions
        this.partyUI.querySelector('.party-invite').addEventListener('click', () => {
            this.showInviteDialog();
        });
        
        this.partyUI.querySelector('.party-settings').addEventListener('click', () => {
            this.showSettingsDialog();
        });
        
        // Loot method
        this.lootMethodSelect.addEventListener('change', (e) => {
            this.changeLootMethod(e.target.value);
        });
    }
    
    // Party management
    createParty() {
        if (this.currentParty) {
            this.showMessage('Você já está em uma party!', 'error');
            return;
        }
        
        this.networkManager.sendPartyAction('create', {
            lootMethod: this.settings.lootMethod,
            maxSize: this.settings.maxPartySize
        });
    }
    
    leaveParty() {
        if (!this.currentParty) {
            this.showMessage('Você não está em uma party!', 'error');
            return;
        }
        
        this.networkManager.sendPartyAction('leave');
    }
    
    invitePlayer(playerName) {
        if (!this.currentParty) {
            this.showMessage('Você não está em uma party!', 'error');
            return;
        }
        
        if (this.currentParty.leaderId !== window.game?.player?.id) {
            this.showMessage('Apenas o líder pode convidar!', 'error');
            return;
        }
        
        if (this.currentParty.members.length >= this.settings.maxPartySize) {
            this.showMessage('Party está cheia!', 'error');
            return;
        }
        
        this.networkManager.sendPartyAction('invite', {
            targetPlayer: playerName
        });
        
        this.showMessage(`Convite enviado para ${playerName}`, 'success');
    }
    
    acceptInvite(inviteId) {
        const invite = this.partyInvites.get(inviteId);
        if (!invite) {
            return;
        }
        
        this.networkManager.sendPartyAction('accept_invite', {
            inviteId: inviteId
        });
        
        this.partyInvites.delete(inviteId);
    }
    
    declineInvite(inviteId) {
        const invite = this.partyInvites.get(inviteId);
        if (!invite) {
            return;
        }
        
        this.networkManager.sendPartyAction('decline_invite', {
            inviteId: inviteId
        });
        
        this.partyInvites.delete(inviteId);
    }
    
    kickMember(memberId) {
        if (!this.currentParty) {
            return;
        }
        
        if (this.currentParty.leaderId !== window.game?.player?.id) {
            this.showMessage('Apenas o líder pode remover membros!', 'error');
            return;
        }
        
        if (memberId === this.currentParty.leaderId) {
            this.showMessage('Não pode remover o líder!', 'error');
            return;
        }
        
        this.networkManager.sendPartyAction('kick', {
            memberId: memberId
        });
    }
    
    promoteLeader(memberId) {
        if (!this.currentParty) {
            return;
        }
        
        if (this.currentParty.leaderId !== window.game?.player?.id) {
            this.showMessage('Apenas o líder pode promover!', 'error');
            return;
        }
        
        this.networkManager.sendPartyAction('promote', {
            memberId: memberId
        });
    }
    
    changeLootMethod(method) {
        if (!this.currentParty) {
            return;
        }
        
        if (this.currentParty.leaderId !== window.game?.player?.id) {
            this.showMessage('Apenas o líder pode mudar o método de loot!', 'error');
            return;
        }
        
        this.settings.lootMethod = method;
        this.networkManager.sendPartyAction('change_loot_method', {
            method: method
        });
    }
    
    // Network message handlers
    handlePartyInvite(data) {
        const invite = {
            id: data.inviteId,
            inviterName: data.inviterName,
            inviterId: data.inviterId,
            timestamp: Date.now(),
            timeout: setTimeout(() => {
                this.partyInvites.delete(data.inviteId);
                this.updateInviteDialog();
            }, this.settings.inviteTimeout)
        };
        
        this.partyInvites.set(data.inviteId, invite);
        
        this.showMessage(`${data.inviterName} convidou você para a party!`, 'info');
        
        if (this.settings.autoAcceptInvites) {
            this.acceptInvite(data.inviteId);
        } else {
            this.showInviteNotification(invite);
        }
        
        this.updateInviteDialog();
        
        if (this.onInviteReceived) {
            this.onInviteReceived(invite);
        }
    }
    
    handleInviteResponse(data) {
        if (data.accepted) {
            this.showMessage(`${data.playerName} aceitou o convite!`, 'success');
        } else {
            this.showMessage(`${data.playerName} recusou o convite.`, 'info');
        }
    }
    
    handlePartyJoined(data) {
        this.currentParty = {
            id: data.partyId,
            leaderId: data.leaderId,
            members: data.members,
            lootMethod: data.lootMethod,
            maxSize: data.maxSize,
            createdAt: Date.now()
        };
        
        this.updateUI();
        this.updateUIVisibility();
        
        this.chatSystem.addSystemMessage(`Você entrou na party!`, 'success');
        
        if (this.onPartyJoined) {
            this.onPartyJoined(this.currentParty);
        }
    }
    
    handlePartyLeft(data) {
        const wasLeader = this.currentParty && this.currentParty.leaderId === window.game?.player?.id;
        
        this.currentParty = null;
        this.updateUI();
        this.updateUIVisibility();
        
        if (data.reason === 'disbanded') {
            this.chatSystem.addSystemMessage('A party foi dissolvida!', 'info');
        } else {
            this.chatSystem.addSystemMessage('Você saiu da party!', 'info');
        }
        
        if (this.onPartyLeft) {
            this.onPartyLeft(data.reason);
        }
    }
    
    handleMemberJoined(data) {
        if (!this.currentParty) return;
        
        // Add member to party
        this.currentParty.members.push(data.member);
        
        this.updateUI();
        this.chatSystem.addSystemMessage(`${data.member.name} entrou na party!`, 'success');
        
        if (this.onMemberJoined) {
            this.onMemberJoined(data.member);
        }
    }
    
    handleMemberLeft(data) {
        if (!this.currentParty) return;
        
        // Remove member from party
        this.currentParty.members = this.currentParty.members.filter(
            member => member.id !== data.memberId
        );
        
        this.updateUI();
        this.chatSystem.addSystemMessage(`${data.memberName} saiu da party.`, 'info');
        
        if (this.onMemberLeft) {
            this.onMemberLeft(data.memberId, data.memberName);
        }
    }
    
    handlePartyDisbanded(data) {
        this.currentParty = null;
        this.updateUI();
        this.updateUIVisibility();
        
        this.chatSystem.addSystemMessage('A party foi dissolvida!', 'info');
        
        if (this.onPartyLeft) {
            this.onPartyLeft('disbanded');
        }
    }
    
    handleLeaderChanged(data) {
        if (!this.currentParty) return;
        
        this.currentParty.leaderId = data.newLeaderId;
        
        const newLeader = this.currentParty.members.find(m => m.id === data.newLeaderId);
        if (newLeader) {
            this.chatSystem.addSystemMessage(`${newLeader.name} é o novo líder da party!`, 'info');
        }
        
        this.updateUI();
    }
    
    handleLootRoll(data) {
        this.showLootRollDialog(data);
    }
    
    handleLootDistributed(data) {
        this.chatSystem.addSystemMessage(
            `${data.winnerName} recebeu ${data.itemName}!`, 
            'success'
        );
        
        if (this.onLootReceived) {
            this.onLootReceived(data);
        }
    }
    
    handlePartyUpdate(data) {
        if (!this.currentParty) return;
        
        // Update party data
        Object.assign(this.currentParty, data.updates);
        this.updateUI();
    }
    
    // UI methods
    updateUI() {
        this.updateMembersList();
        this.updateControls();
        this.updateLootMethod();
    }
    
    updateMembersList() {
        this.membersContainer.innerHTML = '';
        
        if (!this.currentParty) {
            this.membersContainer.innerHTML = '<div style="text-align: center; color: #888;">Você não está em uma party</div>';
            return;
        }
        
        for (const member of this.currentParty.members) {
            const memberElement = document.createElement('div');
            memberElement.className = 'party-member';
            memberElement.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 8px;
                margin: 2px 0;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            `;
            
            const isLeader = member.id === this.currentParty.leaderId;
            const isLocalPlayer = member.id === window.game?.player?.id;
            
            memberElement.innerHTML = `
                <div class="member-info">
                    <span class="member-name" style="color: ${isLeader ? '#f59e0b' : '#ffffff'}; font-weight: ${isLeader ? 'bold' : 'normal'}">
                        ${member.name} ${isLeader ? '👑' : ''}
                    </span>
                    <span class="member-level" style="color: #888; font-size: 12px;">
                        Lv.${member.level || 1}
                    </span>
                    <span class="member-class" style="color: #888; font-size: 12px;">
                        ${member.class || 'Unknown'}
                    </span>
                </div>
                <div class="member-actions">
                    ${this.getMemberActions(member)}
                </div>
            `;
            
            this.membersContainer.appendChild(memberElement);
        }
    }
    
    getMemberActions(member) {
        const isLeader = this.currentParty && this.currentParty.leaderId === window.game?.player?.id;
        const isLocalPlayer = member.id === window.game?.player?.id;
        
        let actions = '';
        
        if (isLeader && !isLocalPlayer) {
            actions += `
                <button onclick="window.game.partySystem.kickMember('${member.id}')" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 2px; margin-left: 4px; cursor: pointer;">Kick</button>
                <button onclick="window.game.partySystem.promoteLeader('${member.id}')" style="background: #3b82f6; color: white; border: none; padding: 2px 6px; border-radius: 2px; margin-left: 2px; cursor: pointer;">Promover</button>
            `;
        }
        
        if (!isLocalPlayer) {
            actions += `
                <button onclick="window.game.partySystem.whisperMember('${member.name}')" style="background: #10b981; color: white; border: none; padding: 2px 6px; border-radius: 2px; margin-left: 2px; cursor: pointer;">Whisper</button>
            `;
        }
        
        return actions;
    }
    
    updateControls() {
        const createButton = this.partyUI.querySelector('.party-create');
        const leaveButton = this.partyUI.querySelector('.party-leave');
        const inviteButton = this.partyUI.querySelector('.party-invite');
        
        const hasParty = this.currentParty !== null;
        const isLeader = this.currentParty && this.currentParty.leaderId === window.game?.player?.id;
        
        createButton.style.display = hasParty ? 'none' : 'block';
        leaveButton.style.display = hasParty ? 'block' : 'none';
        inviteButton.style.display = hasParty && isLeader ? 'block' : 'none';
    }
    
    updateLootMethod() {
        if (this.currentParty) {
            this.lootMethodSelect.value = this.currentParty.lootMethod;
        }
        
        // Enable/disable based on leadership
        const isLeader = this.currentParty && this.currentParty.leaderId === window.game?.player?.id;
        this.lootMethodSelect.disabled = !isLeader;
    }
    
    updateUIVisibility() {
        this.partyUI.style.display = this.currentParty ? 'block' : 'none';
    }
    
    // Dialog methods
    showInviteDialog() {
        if (!this.currentParty) return;
        
        // Simple prompt for now - could be enhanced with player search
        const playerName = prompt('Digite o nome do jogador para convidar:');
        if (playerName && playerName.trim()) {
            this.invitePlayer(playerName.trim());
        }
    }
    
    showInviteNotification(invite) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'party-invite-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            color: white;
            z-index: 2000;
            min-width: 300px;
            text-align: center;
        `;
        
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #3b82f6;">Convite de Party</h3>
            <p style="margin: 0 0 20px 0;">${invite.inviterName} convidou você para a party!</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="window.game.partySystem.acceptInvite('${invite.id}')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Aceitar</button>
                <button onclick="window.game.partySystem.declineInvite('${invite.id}')" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Recusar</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after timeout
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, this.settings.inviteTimeout);
    }
    
    updateInviteDialog() {
        // Update any open invite dialogs
        // This would be implemented if we had a persistent invite dialog
    }
    
    showLootRollDialog(data) {
        // Create loot roll dialog
        const dialog = document.createElement('div');
        dialog.className = 'loot-roll-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            color: white;
            z-index: 2000;
            min-width: 350px;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #f59e0b;">Roll de Loot</h3>
            <div style="margin: 0 0 20px 0; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">${data.itemIcon || '📦'}</div>
                <div style="font-weight: bold; color: ${data.itemRarityColor || '#ffffff'};">${data.itemName}</div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="window.game.partySystem.rollNeed('${data.rollId}')" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Need</button>
                <button onclick="window.game.partySystem.rollGreed('${data.rollId}')" style="background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Greed</button>
                <button onclick="window.game.partySystem.rollPass('${data.rollId}')" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Pass</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (dialog.parentNode) {
                dialog.parentNode.removeChild(dialog);
            }
        }, 30000);
    }
    
    showSettingsDialog() {
        // Create settings dialog
        const dialog = document.createElement('div');
        dialog.className = 'party-settings-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #444;
            border-radius: 8px;
            padding: 20px;
            color: white;
            z-index: 2000;
            min-width: 300px;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0;">Configurações da Party</h3>
            <div style="margin-bottom: 15px;">
                <label>
                    <input type="checkbox" ${this.settings.autoAcceptInvites ? 'checked' : ''} onchange="window.game.partySystem.settings.autoAcceptInvites = this.checked">
                    Auto-aceitar convites
                </label>
            </div>
            <div style="margin-bottom: 15px;">
                <label>
                    <input type="checkbox" ${this.settings.autoShareLoot ? 'checked' : ''} onchange="window.game.partySystem.settings.autoShareLoot = this.checked">
                    Compartilhar loot automaticamente
                </label>
            </div>
            <div style="text-align: center;">
                <button onclick="this.parentElement.parentElement.remove()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Fechar</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
    }
    
    // Loot rolling methods
    rollNeed(rollId) {
        this.networkManager.sendPartyAction('roll', {
            rollId: rollId,
            choice: 'need'
        });
        
        // Close dialog
        const dialog = document.querySelector('.loot-roll-dialog');
        if (dialog) dialog.remove();
    }
    
    rollGreed(rollId) {
        this.networkManager.sendPartyAction('roll', {
            rollId: rollId,
            choice: 'greed'
        });
        
        // Close dialog
        const dialog = document.querySelector('.loot-roll-dialog');
        if (dialog) dialog.remove();
    }
    
    rollPass(rollId) {
        this.networkManager.sendPartyAction('roll', {
            rollId: rollId,
            choice: 'pass'
        });
        
        // Close dialog
        const dialog = document.querySelector('.loot-roll-dialog');
        if (dialog) dialog.remove();
    }
    
    // Utility methods
    whisperMember(playerName) {
        if (this.chatSystem) {
            const input = document.querySelector('.chat-input');
            if (input) {
                input.value = `/w ${playerName} `;
                input.focus();
            }
        }
    }
    
    showMessage(message, type = 'info') {
        if (this.chatSystem) {
            this.chatSystem.addSystemMessage(message, type);
        }
    }
    
    // Public API
    isInParty() {
        return this.currentParty !== null;
    }
    
    isPartyLeader() {
        return this.currentParty && this.currentParty.leaderId === window.game?.player?.id;
    }
    
    getPartySize() {
        return this.currentParty ? this.currentParty.members.length : 0;
    }
    
    getPartyMembers() {
        return this.currentParty ? [...this.currentParty.members] : [];
    }
    
    getPartyLeader() {
        if (!this.currentParty) return null;
        return this.currentParty.members.find(m => m.id === this.currentParty.leaderId);
    }
    
    cleanup() {
        // Remove UI elements
        if (this.partyUI && this.partyUI.parentNode) {
            this.partyUI.parentNode.removeChild(this.partyUI);
        }
        
        // Clear invites
        for (const invite of this.partyInvites.values()) {
            clearTimeout(invite.timeout);
        }
        this.partyInvites.clear();
        
        // Clear data
        this.currentParty = null;
        this.partyHistory = [];
    }
}

export default PartySystem;
