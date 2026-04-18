/**
 * Guild System - Large Scale Organization
 * Handles guild creation, management, and activities
 * Version 0.3 - Social & Multiplayer Systems
 */

class GuildSystem {
    constructor(networkManager, chatSystem) {
        this.networkManager = networkManager;
        this.chatSystem = chatSystem;
        
        // Guild data
        this.currentGuild = null;
        this.guildInvites = new Map();
        this.guildApplications = new Map();
        this.guildHistory = [];
        
        // Guild settings
        this.settings = {
            autoAcceptInvites: false,
            showOnlineMembers: true,
            guildChatNotifications: true,
            inviteOnlyMode: false,
            minLevelToJoin: 10,
            maxGuildSize: 50
        };
        
        // UI elements
        this.guildUI = null;
        this.guildHallUI = null;
        this.guildManagementUI = null;
        
        // Guild hall data
        this.guildHall = null;
        this.guildStorage = null;
        
        // Event callbacks
        this.onGuildJoined = null;
        this.onGuildLeft = null;
        this.onMemberJoined = null;
        this.onMemberLeft = null;
        this.onPromoted = null;
        this.onDemoted = null;
        
        // Initialize
        this.setupNetworkHandlers();
        this.createUI();
    }
    
    setupNetworkHandlers() {
        this.networkManager.registerHandler('guild_invite', this.handleGuildInvite.bind(this));
        this.networkManager.registerHandler('guild_invite_response', this.handleInviteResponse.bind(this));
        this.networkManager.registerHandler('guild_joined', this.handleGuildJoined.bind(this));
        this.networkManager.registerHandler('guild_left', this.handleGuildLeft.bind(this));
        this.networkManager.registerHandler('guild_member_joined', this.handleMemberJoined.bind(this));
        this.networkManager.registerHandler('guild_member_left', this.handleMemberLeft.bind(this));
        this.networkManager.registerHandler('guild_disbanded', this.handleGuildDisbanded.bind(this));
        this.networkManager.registerHandler('guild_promoted', this.handlePromoted.bind(this));
        this.networkManager.registerHandler('guild_demoted', this.handleDemoted.bind(this));
        this.networkManager.registerHandler('guild_update', this.handleGuildUpdate.bind(this));
        this.networkManager.registerHandler('guild_storage_update', this.handleStorageUpdate.bind(this));
        this.networkManager.registerHandler('guild_activity', this.handleGuildActivity.bind(this));
    }
    
    createUI() {
        // Create main guild panel
        this.guildUI = document.createElement('div');
        this.guildUI.className = 'guild-system';
        this.guildUI.innerHTML = `
            <div class="guild-header">
                <h3>Guild</h3>
                <div class="guild-controls">
                    <button class="guild-create" title="Criar Guild">+</button>
                    <button class="guild-leave" title="Sair da Guild">×</button>
                    <button class="guild-hall" title="Guild Hall">🏰</button>
                </div>
            </div>
            <div class="guild-info"></div>
            <div class="guild-members"></div>
            <div class="guild-actions">
                <button class="guild-invite">Convidar</button>
                <button class="guild-management">Gerenciar</button>
                <button class="guild-activities">Atividades</button>
            </div>
        `;
        
        // Style the guild UI
        this.guildUI.style.cssText = `
            position: fixed;
            top: 400px;
            right: 20px;
            width: 280px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #444;
            border-radius: 8px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
            display: none; // Initially hidden
        `;
        
        // Add to page
        document.body.appendChild(this.guildUI);
        
        // Get references
        this.guildInfoContainer = this.guildUI.querySelector('.guild-info');
        this.membersContainer = this.guildUI.querySelector('.guild-members');
        
        // Setup event handlers
        this.setupUIHandlers();
        
        // Initially hide if not in guild
        this.updateUIVisibility();
    }
    
    setupUIHandlers() {
        // Guild controls
        this.guildUI.querySelector('.guild-create').addEventListener('click', () => {
            this.showCreateGuildDialog();
        });
        
        this.guildUI.querySelector('.guild-leave').addEventListener('click', () => {
            this.leaveGuild();
        });
        
        this.guildUI.querySelector('.guild-hall').addEventListener('click', () => {
            this.openGuildHall();
        });
        
        // Guild actions
        this.guildUI.querySelector('.guild-invite').addEventListener('click', () => {
            this.showInviteDialog();
        });
        
        this.guildUI.querySelector('.guild-management').addEventListener('click', () => {
            this.showManagementDialog();
        });
        
        this.guildUI.querySelector('.guild-activities').addEventListener('click', () => {
            this.showActivitiesDialog();
        });
    }
    
    // Guild management
    createGuild(guildName, guildTag, guildDescription) {
        if (this.currentGuild) {
            this.showMessage('Você já está em uma guild!', 'error');
            return;
        }
        
        if (window.game.player.level < this.settings.minLevelToJoin) {
            this.showMessage(`Você precisa ser nível ${this.settings.minLevelToJoin} para criar uma guild!`, 'error');
            return;
        }
        
        if (!guildName || guildName.trim().length < 3) {
            this.showMessage('Nome da guild deve ter pelo menos 3 caracteres!', 'error');
            return;
        }
        
        this.networkManager.sendGuildAction('create', {
            name: guildName.trim(),
            tag: guildTag ? guildTag.trim().toUpperCase() : '',
            description: guildDescription || ''
        });
    }
    
    leaveGuild() {
        if (!this.currentGuild) {
            this.showMessage('Você não está em uma guild!', 'error');
            return;
        }
        
        if (this.currentGuild.leaderId === window.game.player.id) {
            if (!confirm('Você é o líder da guild. Se sair, a guild será dissolvida. Continuar?')) {
                return;
            }
        }
        
        this.networkManager.sendGuildAction('leave');
    }
    
    invitePlayer(playerName) {
        if (!this.currentGuild) {
            this.showMessage('Você não está em uma guild!', 'error');
            return;
        }
        
        if (!this.hasPermission('invite')) {
            this.showMessage('Você não tem permissão para convidar!', 'error');
            return;
        }
        
        if (this.currentGuild.members.length >= this.settings.maxGuildSize) {
            this.showMessage('Guild está cheia!', 'error');
            return;
        }
        
        this.networkManager.sendGuildAction('invite', {
            targetPlayer: playerName
        });
        
        this.showMessage(`Convite enviado para ${playerName}`, 'success');
    }
    
    acceptInvite(inviteId) {
        const invite = this.guildInvites.get(inviteId);
        if (!invite) return;
        
        this.networkManager.sendGuildAction('accept_invite', {
            inviteId: inviteId
        });
        
        this.guildInvites.delete(inviteId);
    }
    
    declineInvite(inviteId) {
        const invite = this.guildInvites.get(inviteId);
        if (!invite) return;
        
        this.networkManager.sendGuildAction('decline_invite', {
            inviteId: inviteId
        });
        
        this.guildInvites.delete(inviteId);
    }
    
    applyToGuild(guildId, applicationMessage) {
        if (this.currentGuild) {
            this.showMessage('Você já está em uma guild!', 'error');
            return;
        }
        
        this.networkManager.sendGuildAction('apply', {
            guildId: guildId,
            message: applicationMessage || ''
        });
    }
    
    kickMember(memberId) {
        if (!this.currentGuild) return;
        
        if (!this.hasPermission('kick')) {
            this.showMessage('Você não tem permissão para remover membros!', 'error');
            return;
        }
        
        if (memberId === this.currentGuild.leaderId) {
            this.showMessage('Não pode remover o líder!', 'error');
            return;
        }
        
        if (!confirm('Tem certeza que deseja remover este membro?')) {
            return;
        }
        
        this.networkManager.sendGuildAction('kick', {
            memberId: memberId
        });
    }
    
    promoteMember(memberId, newRank) {
        if (!this.currentGuild) return;
        
        if (!this.hasPermission('promote')) {
            this.showMessage('Você não tem permissão para promover!', 'error');
            return;
        }
        
        this.networkManager.sendGuildAction('promote', {
            memberId: memberId,
            rank: newRank
        });
    }
    
    demoteMember(memberId, newRank) {
        if (!this.currentGuild) return;
        
        if (!this.hasPermission('promote')) {
            this.showMessage('Você não tem permissão para rebaixar!', 'error');
            return;
        }
        
        this.networkManager.sendGuildAction('demote', {
            memberId: memberId,
            rank: newRank
        });
    }
    
    changeGuildMotd(newMotd) {
        if (!this.currentGuild) return;
        
        if (!this.hasPermission('motd')) {
            this.showMessage('Você não tem permissão para mudar o MOTD!', 'error');
            return;
        }
        
        this.networkManager.sendGuildAction('change_motd', {
            motd: newMotd
        });
    }
    
    depositToGuildHall(amount, itemType = 'gold') {
        if (!this.currentGuild) return;
        
        if (!this.hasPermission('storage')) {
            this.showMessage('Você não tem permissão para usar o armazenamento!', 'error');
            return;
        }
        
        this.networkManager.sendGuildAction('deposit', {
            amount: amount,
            itemType: itemType
        });
    }
    
    withdrawFromGuildHall(amount, itemType = 'gold') {
        if (!this.currentGuild) return;
        
        if (!this.hasPermission('storage')) {
            this.showMessage('Você não tem permissão para usar o armazenamento!', 'error');
            return;
        }
        
        this.networkManager.sendGuildAction('withdraw', {
            amount: amount,
            itemType: itemType
        });
    }
    
    // Network message handlers
    handleGuildInvite(data) {
        const invite = {
            id: data.inviteId,
            guildId: data.guildId,
            guildName: data.guildName,
            guildTag: data.guildTag,
            inviterName: data.inviterName,
            inviterId: data.inviterId,
            timestamp: Date.now(),
            timeout: setTimeout(() => {
                this.guildInvites.delete(data.inviteId);
            }, 300000) // 5 minutes
        };
        
        this.guildInvites.set(data.inviteId, invite);
        
        this.showMessage(`${data.inviterName} convidou você para guild ${data.guildName}!`, 'info');
        
        if (this.settings.autoAcceptInvites) {
            this.acceptInvite(data.inviteId);
        } else {
            this.showGuildInviteNotification(invite);
        }
        
        if (this.onGuildJoined) {
            this.onGuildJoined(invite);
        }
    }
    
    handleInviteResponse(data) {
        if (data.accepted) {
            this.showMessage(`${data.playerName} aceitou o convite da guild!`, 'success');
        } else {
            this.showMessage(`${data.playerName} recusou o convite da guild.`, 'info');
        }
    }
    
    handleGuildJoined(data) {
        this.currentGuild = {
            id: data.guildId,
            name: data.guildName,
            tag: data.guildTag,
            description: data.description,
            leaderId: data.leaderId,
            members: data.members,
            motd: data.motd,
            level: data.level,
            experience: data.experience,
            createdAt: data.createdAt,
            storage: data.storage || { gold: 0, items: [] }
        };
        
        this.updateUI();
        this.updateUIVisibility();
        
        this.chatSystem.addSystemMessage(`Você entrou na guild ${data.guildName}!`, 'success');
        
        if (this.onGuildJoined) {
            this.onGuildJoined(this.currentGuild);
        }
    }
    
    handleGuildLeft(data) {
        const wasLeader = this.currentGuild && this.currentGuild.leaderId === window.game.player.id;
        
        this.currentGuild = null;
        this.updateUI();
        this.updateUIVisibility();
        
        if (data.reason === 'disbanded') {
            this.chatSystem.addSystemMessage('A guild foi dissolvida!', 'info');
        } else {
            this.chatSystem.addSystemMessage('Você saiu da guild!', 'info');
        }
        
        if (this.onGuildLeft) {
            this.onGuildLeft(data.reason);
        }
    }
    
    handleMemberJoined(data) {
        if (!this.currentGuild) return;
        
        this.currentGuild.members.push(data.member);
        this.updateUI();
        
        this.chatSystem.addSystemMessage(`${data.member.name} entrou na guild!`, 'success');
        
        if (this.onMemberJoined) {
            this.onMemberJoined(data.member);
        }
    }
    
    handleMemberLeft(data) {
        if (!this.currentGuild) return;
        
        this.currentGuild.members = this.currentGuild.members.filter(
            member => member.id !== data.memberId
        );
        
        this.updateUI();
        
        this.chatSystem.addSystemMessage(`${data.memberName} saiu da guild.`, 'info');
        
        if (this.onMemberLeft) {
            this.onMemberLeft(data.memberId, data.memberName);
        }
    }
    
    handleGuildDisbanded(data) {
        this.currentGuild = null;
        this.updateUI();
        this.updateUIVisibility();
        
        this.chatSystem.addSystemMessage('A guild foi dissolvida!', 'info');
        
        if (this.onGuildLeft) {
            this.onGuildLeft('disbanded');
        }
    }
    
    handlePromoted(data) {
        if (!this.currentGuild) return;
        
        const member = this.currentGuild.members.find(m => m.id === data.memberId);
        if (member) {
            member.rank = data.newRank;
            this.updateUI();
            
            if (data.memberId === window.game.player.id) {
                this.chatSystem.addSystemMessage(`Você foi promovido a ${data.newRank}!`, 'success');
                
                if (this.onPromoted) {
                    this.onPromoted(data.newRank);
                }
            } else {
                this.chatSystem.addSystemMessage(`${member.name} foi promovido a ${data.newRank}!`, 'info');
            }
        }
    }
    
    handleDemoted(data) {
        if (!this.currentGuild) return;
        
        const member = this.currentGuild.members.find(m => m.id === data.memberId);
        if (member) {
            member.rank = data.newRank;
            this.updateUI();
            
            if (data.memberId === window.game.player.id) {
                this.chatSystem.addSystemMessage(`Você foi rebaixado a ${data.newRank}.`, 'info');
                
                if (this.onDemoted) {
                    this.onDemoted(data.newRank);
                }
            } else {
                this.chatSystem.addSystemMessage(`${member.name} foi rebaixado a ${data.newRank}.`, 'info');
            }
        }
    }
    
    handleGuildUpdate(data) {
        if (!this.currentGuild) return;
        
        Object.assign(this.currentGuild, data.updates);
        this.updateUI();
    }
    
    handleStorageUpdate(data) {
        if (!this.currentGuild) return;
        
        this.currentGuild.storage = data.storage;
        
        if (this.guildHallUI) {
            this.updateGuildHallUI();
        }
    }
    
    handleGuildActivity(data) {
        // Log guild activities
        this.guildHistory.push({
            type: data.type,
            message: data.message,
            timestamp: Date.now(),
            playerId: data.playerId,
            playerName: data.playerName
        });
        
        // Keep only last 100 activities
        if (this.guildHistory.length > 100) {
            this.guildHistory.shift();
        }
        
        // Show notification if enabled
        if (this.settings.guildChatNotifications) {
            this.chatSystem.addSystemMessage(`[Guild] ${data.message}`, 'info');
        }
    }
    
    // UI methods
    updateUI() {
        this.updateGuildInfo();
        this.updateMembersList();
        this.updateControls();
    }
    
    updateGuildInfo() {
        if (!this.currentGuild) {
            this.guildInfoContainer.innerHTML = '<div style="text-align: center; color: #888;">Você não está em uma guild</div>';
            return;
        }
        
        this.guildInfoContainer.innerHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <div style="font-size: 18px; font-weight: bold; color: #f59e0b;">
                    [${this.currentGuild.tag}] ${this.currentGuild.name}
                </div>
                <div style="font-size: 12px; color: #888;">
                    Nível ${this.currentGuild.level} • ${this.currentGuild.members.length}/${this.settings.maxGuildSize} membros
                </div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 10px;">
                <div style="font-size: 11px; color: #888; margin-bottom: 4px;">MOTD:</div>
                <div style="font-size: 12px;">${this.currentGuild.motd || 'Nenhuma mensagem'}</div>
            </div>
        `;
    }
    
    updateMembersList() {
        this.membersContainer.innerHTML = '';
        
        if (!this.currentGuild) {
            this.membersContainer.innerHTML = '<div style="text-align: center; color: #888;">Nenhum membro</div>';
            return;
        }
        
        // Sort members by rank then by name
        const sortedMembers = [...this.currentGuild.members].sort((a, b) => {
            const rankOrder = { 'Leader': 0, 'Officer': 1, 'Veteran': 2, 'Member': 3, 'Initiate': 4 };
            const aRank = rankOrder[a.rank] || 99;
            const bRank = rankOrder[b.rank] || 99;
            
            if (aRank !== bRank) return aRank - bRank;
            return a.name.localeCompare(b.name);
        });
        
        for (const member of sortedMembers) {
            const memberElement = document.createElement('div');
            memberElement.className = 'guild-member';
            memberElement.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 8px;
                margin: 2px 0;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                font-size: 12px;
            `;
            
            const isLeader = member.id === this.currentGuild.leaderId;
            const isOnline = member.online !== false; // Assume online if not specified
            const isLocalPlayer = member.id === window.game.player.id;
            
            memberElement.innerHTML = `
                <div class="member-info">
                    <span class="member-status" style="color: ${isOnline ? '#10b981' : '#6b7280'};">●</span>
                    <span class="member-name" style="color: ${isLeader ? '#f59e0b' : '#ffffff'}; font-weight: ${isLeader ? 'bold' : 'normal'};">
                        ${member.name}
                    </span>
                    <span class="member-rank" style="color: #888; font-size: 10px;">
                        ${member.rank}
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
        const isLeader = this.currentGuild && this.currentGuild.leaderId === window.game.player.id;
        const isOfficer = this.hasPermission('moderate');
        const isLocalPlayer = member.id === window.game.player.id;
        
        let actions = '';
        
        if ((isLeader || isOfficer) && !isLocalPlayer) {
            actions += `
                <button onclick="window.game.guildSystem.kickMember('${member.id}')" style="background: #ef4444; color: white; border: none; padding: 1px 4px; border-radius: 2px; margin-left: 2px; cursor: pointer; font-size: 10px;">Kick</button>
            `;
        }
        
        if (isLeader && !isLocalPlayer && member.id !== this.currentGuild.leaderId) {
            actions += `
                <button onclick="window.game.guildSystem.showMemberOptions('${member.id}')" style="background: #3b82f6; color: white; border: none; padding: 1px 4px; border-radius: 2px; margin-left: 2px; cursor: pointer; font-size: 10px;">Opções</button>
            `;
        }
        
        if (!isLocalPlayer) {
            actions += `
                <button onclick="window.game.guildSystem.whisperMember('${member.name}')" style="background: #10b981; color: white; border: none; padding: 1px 4px; border-radius: 2px; margin-left: 2px; cursor: pointer; font-size: 10px;">Whisper</button>
            `;
        }
        
        return actions;
    }
    
    updateControls() {
        const createButton = this.guildUI.querySelector('.guild-create');
        const leaveButton = this.guildUI.querySelector('.guild-leave');
        const inviteButton = this.guildUI.querySelector('.guild-invite');
        const managementButton = this.guildUI.querySelector('.guild-management');
        
        const hasGuild = this.currentGuild !== null;
        const canManage = hasGuild && this.hasPermission('manage');
        
        createButton.style.display = hasGuild ? 'none' : 'block';
        leaveButton.style.display = hasGuild ? 'block' : 'none';
        inviteButton.style.display = hasGuild && this.hasPermission('invite') ? 'block' : 'none';
        managementButton.style.display = hasGuild && canManage ? 'block' : 'none';
    }
    
    updateUIVisibility() {
        this.guildUI.style.display = this.currentGuild ? 'block' : 'none';
    }
    
    // Dialog methods
    showCreateGuildDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'create-guild-dialog';
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
            min-width: 400px;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #f59e0b;">Criar Guild</h3>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Nome da Guild:</label>
                <input type="text" id="guildName" maxlength="30" style="width: 100%; padding: 8px; background: rgba(255, 255, 255, 0.1); border: 1px solid #444; color: white; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Tag (3-5 letras):</label>
                <input type="text" id="guildTag" maxlength="5" style="width: 100%; padding: 8px; background: rgba(255, 255, 255, 0.1); border: 1px solid #444; color: white; border-radius: 4px; text-transform: uppercase;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px;">Descrição:</label>
                <textarea id="guildDescription" rows="3" style="width: 100%; padding: 8px; background: rgba(255, 255, 255, 0.1); border: 1px solid #444; color: white; border-radius: 4px; resize: vertical;"></textarea>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="window.game.guildSystem.confirmCreateGuild()" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Criar</button>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Cancelar</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Focus on name input
        dialog.querySelector('#guildName').focus();
    }
    
    confirmCreateGuild() {
        const name = document.querySelector('#guildName').value.trim();
        const tag = document.querySelector('#guildTag').value.trim();
        const description = document.querySelector('#guildDescription').value.trim();
        
        this.createGuild(name, tag, description);
        
        // Close dialog
        const dialog = document.querySelector('.create-guild-dialog');
        if (dialog) dialog.remove();
    }
    
    showGuildInviteNotification(invite) {
        const notification = document.createElement('div');
        notification.className = 'guild-invite-notification';
        notification.style.cssText = `
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
            text-align: center;
        `;
        
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #f59e0b;">Convite de Guild</h3>
            <div style="margin: 0 0 10px 0;">
                <div style="font-size: 16px; font-weight: bold; color: #f59e0b;">[${invite.guildTag}] ${invite.guildName}</div>
                <div style="color: #888; font-size: 12px;">Convidado por: ${invite.inviterName}</div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="window.game.guildSystem.acceptInvite('${invite.id}')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Aceitar</button>
                <button onclick="window.game.guildSystem.declineInvite('${invite.id}')" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Recusar</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 minutes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300000);
    }
    
    showInviteDialog() {
        const playerName = prompt('Digite o nome do jogador para convidar:');
        if (playerName && playerName.trim()) {
            this.invitePlayer(playerName.trim());
        }
    }
    
    showManagementDialog() {
        // Implementation for guild management dialog
        this.showMessage('Sistema de gerenciamento em desenvolvimento.', 'info');
    }
    
    showActivitiesDialog() {
        // Implementation for guild activities dialog
        this.showMessage('Sistema de atividades em desenvolvimento.', 'info');
    }
    
    openGuildHall() {
        if (!this.currentGuild) {
            this.showMessage('Você não está em uma guild!', 'error');
            return;
        }
        
        this.showMessage('Guild Hall em desenvolvimento.', 'info');
    }
    
    // Utility methods
    hasPermission(permission) {
        if (!this.currentGuild) return false;
        
        const playerRank = this.currentGuild.members.find(m => m.id === window.game.player.id)?.rank;
        const leaderId = this.currentGuild.leaderId;
        const playerId = window.game.player.id;
        
        // Leader has all permissions
        if (leaderId === playerId) return true;
        
        // Permission mapping by rank
        const permissions = {
            'Officer': ['invite', 'kick', 'promote', 'motd', 'storage', 'moderate'],
            'Veteran': ['invite', 'storage'],
            'Member': ['storage'],
            'Initiate': []
        };
        
        const rankPermissions = permissions[playerRank] || [];
        return rankPermissions.includes(permission);
    }
    
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
    isInGuild() {
        return this.currentGuild !== null;
    }
    
    isGuildLeader() {
        return this.currentGuild && this.currentGuild.leaderId === window.game.player.id;
    }
    
    getGuildRank() {
        if (!this.currentGuild) return null;
        const member = this.currentGuild.members.find(m => m.id === window.game.player.id);
        return member ? member.rank : null;
    }
    
    getGuildSize() {
        return this.currentGuild ? this.currentGuild.members.length : 0;
    }
    
    getGuildMembers() {
        return this.currentGuild ? [...this.currentGuild.members] : [];
    }
    
    getOnlineMembers() {
        return this.currentGuild ? 
            this.currentGuild.members.filter(m => m.online !== false) : [];
    }
    
    cleanup() {
        // Remove UI elements
        if (this.guildUI && this.guildUI.parentNode) {
            this.guildUI.parentNode.removeChild(this.guildUI);
        }
        
        // Clear invites
        for (const invite of this.guildInvites.values()) {
            clearTimeout(invite.timeout);
        }
        this.guildInvites.clear();
        
        // Clear data
        this.currentGuild = null;
        this.guildHistory = [];
    }
}

export default GuildSystem;
