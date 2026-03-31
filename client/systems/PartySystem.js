/**
 * Party System - Multiplayer Group Management
 * Version 0.4.0 - Party & Group Features
 */

class PartySystem {
    constructor(game) {
        this.game = game;
        this.currentParty = null;
        this.invites = [];
        this.nearbyPlayers = [];
        this.partySettings = {
            lootMode: 'roundrobin', // roundrobin, freeforall, needgreed, master
            expShare: true,
            autoInvite: false
        };
        
        this.initialize();
    }
    
    initialize() {
        this.createPartyUI();
        this.setupEventListeners();
        this.setupSocketEvents();
    }
    
    createPartyUI() {
        // Main party panel
        this.partyPanel = document.createElement('div');
        this.partyPanel.id = 'party-panel';
        this.partyPanel.style.cssText = `
            position: absolute;
            top: 100px;
            left: 20px;
            width: 250px;
            background: linear-gradient(135deg, rgba(44, 62, 80, 0.95) 0%, rgba(52, 73, 94, 0.95) 100%);
            border: 2px solid #34495e;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.5);
            display: none;
            z-index: 1000;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #ecf0f1;
        `;
        
        this.partyPanel.innerHTML = `
            <div style="padding: 12px; background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%); 
                        border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold;">👥 Grupo</span>
                <button id="party-settings-btn" style="background: none; border: none; color: #ecf0f1; 
                        cursor: pointer; font-size: 16px;">⚙️</button>
            </div>
            <div id="party-members" style="padding: 10px;">
                <div style="text-align: center; color: #95a5a6; padding: 20px;">
                    Você não está em um grupo
                </div>
            </div>
            <div id="party-actions" style="padding: 10px; border-top: 1px solid #34495e; display: none;">
                <button id="leave-party-btn" style="width: 100%; padding: 8px; background: #e74c3c; 
                        color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Sair do Grupo
                </button>
            </div>
        `;
        
        document.body.appendChild(this.partyPanel);
        
        // Invite panel
        this.invitePanel = document.createElement('div');
        this.invitePanel.id = 'party-invite-panel';
        this.invitePanel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            border: 3px solid #34495e;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: none;
            z-index: 1001;
            color: #ecf0f1;
        `;
        
        this.invitePanel.innerHTML = `
            <div style="padding: 15px; border-bottom: 1px solid #34495e;">
                <h3 style="margin: 0;">🎮 Convidar Jogadores</h3>
            </div>
            <div style="padding: 15px; max-height: 300px; overflow-y: auto;">
                <div id="nearby-players-list" style="margin-bottom: 15px;">
                    <!-- Nearby players will be populated here -->
                </div>
                <div style="margin-top: 15px;">
                    <input type="text" id="player-name-input" placeholder="Nome do jogador" 
                           style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #34495e; 
                                  background: #1a252f; color: #ecf0f1; box-sizing: border-box;">
                    <button id="invite-by-name-btn" style="width: 100%; margin-top: 10px; padding: 10px; 
                            background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Convidar por Nome
                    </button>
                </div>
            </div>
            <div style="padding: 15px; border-top: 1px solid #34495e; text-align: right;">
                <button id="close-invite-panel" style="padding: 8px 15px; background: #7f8c8d; 
                        color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Fechar
                </button>
            </div>
        `;
        
        document.body.appendChild(this.invitePanel);
        
        // Settings panel
        this.settingsPanel = document.createElement('div');
        this.settingsPanel.id = 'party-settings-panel';
        this.settingsPanel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 350px;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            border: 3px solid #34495e;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: none;
            z-index: 1002;
            color: #ecf0f1;
        `;
        
        this.settingsPanel.innerHTML = `
            <div style="padding: 15px; border-bottom: 1px solid #34495e;">
                <h3 style="margin: 0;">⚙️ Configurações do Grupo</h3>
            </div>
            <div style="padding: 15px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #95a5a6;">Modo de Loot</label>
                    <select id="loot-mode-select" style="width: 100%; padding: 10px; border-radius: 5px; 
                            border: 1px solid #34495e; background: #1a252f; color: #ecf0f1;">
                        <option value="roundrobin">Round Robin</option>
                        <option value="freeforall">Livre para Todos</option>
                        <option value="needgreed">Necessidade vs Ganância</option>
                        <option value="master">Mestre de Loot</option>
                    </select>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="exp-share-check" checked style="margin-right: 10px;">
                        <span>Compartilhar XP</span>
                    </label>
                </div>
                <div>
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="auto-invite-check" style="margin-right: 10px;">
                        <span>Auto-convidar próximos</span>
                    </label>
                </div>
            </div>
            <div style="padding: 15px; border-top: 1px solid #34495e; text-align: right;">
                <button id="save-party-settings" style="padding: 8px 15px; background: #27ae60; 
                        color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                    Salvar
                </button>
                <button id="close-settings-panel" style="padding: 8px 15px; background: #7f8c8d; 
                        color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Cancelar
                </button>
            </div>
        `;
        
        document.body.appendChild(this.settingsPanel);
        
        // Event listeners
        this.partyPanel.querySelector('#party-settings-btn').onclick = () => this.toggleSettingsPanel();
        this.partyPanel.querySelector('#leave-party-btn').onclick = () => this.leaveParty();
        this.invitePanel.querySelector('#close-invite-panel').onclick = () => this.toggleInvitePanel();
        this.invitePanel.querySelector('#invite-by-name-btn').onclick = () => this.inviteByName();
        this.settingsPanel.querySelector('#close-settings-panel').onclick = () => this.toggleSettingsPanel();
        this.settingsPanel.querySelector('#save-party-settings').onclick = () => this.saveSettings();
        
        // Invite notifications container
        this.inviteNotifications = document.createElement('div');
        this.inviteNotifications.id = 'party-invite-notifications';
        this.inviteNotifications.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            z-index: 1003;
        `;
        document.body.appendChild(this.inviteNotifications);
    }
    
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                if (e.target.tagName !== 'INPUT') {
                    this.togglePartyPanel();
                }
            }
        });
        
        // Update nearby players periodically
        setInterval(() => this.updateNearbyPlayers(), 5000);
    }
    
    setupSocketEvents() {
        // Party updates
        this.game.socket.on('partyUpdate', (data) => {
            this.updateParty(data);
        });
        
        // Party invite received
        this.game.socket.on('partyInvite', (data) => {
            this.showInviteNotification(data);
        });
        
        // Member joined
        this.game.socket.on('partyMemberJoined', (data) => {
            this.showNotification(`${data.name} entrou no grupo!`, '#27ae60');
            this.addMemberToParty(data);
        });
        
        // Member left
        this.game.socket.on('partyMemberLeft', (data) => {
            this.showNotification(`${data.name} saiu do grupo.`, '#e74c3c');
            this.removeMemberFromParty(data.id);
        });
        
        // Member status update
        this.game.socket.on('partyMemberStatus', (data) => {
            this.updateMemberStatus(data);
        });
        
        // Party disbanded
        this.game.socket.on('partyDisbanded', () => {
            this.showNotification('O grupo foi dissolvido.', '#e74c3c');
            this.disbandParty();
        });
    }
    
    togglePartyPanel() {
        const isVisible = this.partyPanel.style.display === 'block';
        this.partyPanel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.renderPartyMembers();
        }
    }
    
    toggleInvitePanel() {
        const isVisible = this.invitePanel.style.display === 'block';
        this.invitePanel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.renderNearbyPlayers();
        }
    }
    
    toggleSettingsPanel() {
        const isVisible = this.settingsPanel.style.display === 'block';
        this.settingsPanel.style.display = isVisible ? 'none' : 'block';
    }
    
    renderPartyMembers() {
        const membersContainer = this.partyPanel.querySelector('#party-members');
        const actionsContainer = this.partyPanel.querySelector('#party-actions');
        
        if (!this.currentParty || this.currentParty.members.length === 0) {
            membersContainer.innerHTML = `
                <div style="text-align: center; color: #95a5a6; padding: 20px;">
                    Você não está em um grupo<br><br>
                    <button id="create-party-btn" style="padding: 10px 20px; background: #27ae60; 
                            color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Criar Grupo
                    </button>
                    <br><br>
                    <button id="show-invite-btn" style="padding: 8px 15px; background: #3498db; 
                            color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Ver Convites
                    </button>
                </div>
            `;
            membersContainer.querySelector('#create-party-btn').onclick = () => this.createParty();
            membersContainer.querySelector('#show-invite-btn').onclick = () => this.toggleInvitePanel();
            actionsContainer.style.display = 'none';
            return;
        }
        
        let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
        
        this.currentParty.members.forEach(member => {
            const isLeader = member.id === this.currentParty.leaderId;
            const hpPercent = (member.hp / member.maxHp) * 100;
            const mpPercent = (member.mp / member.maxMp) * 100;
            
            html += `
                <div style="background: #1a252f; padding: 10px; border-radius: 8px; 
                            ${member.id === this.game.player.id ? 'border: 2px solid #3498db;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span style="font-weight: bold;">
                            ${isLeader ? '👑 ' : ''}${member.name}
                        </span>
                        <span style="font-size: 11px; color: #95a5a6;">Lvl ${member.level}</span>
                    </div>
                    <div style="font-size: 10px; color: #7f8c8d; margin-bottom: 5px;">
                        ${member.class} | ${member.zone || 'Unknown'}
                    </div>
                    
                    <!-- HP Bar -->
                    <div style="background: #2c3e50; height: 6px; border-radius: 3px; margin-bottom: 3px; overflow: hidden;">
                        <div style="background: ${hpPercent > 50 ? '#27ae60' : hpPercent > 25 ? '#f39c12' : '#e74c3c'}; 
                                    width: ${hpPercent}%; height: 100%; transition: width 0.3s;"></div>
                    </div>
                    
                    <!-- MP Bar -->
                    <div style="background: #2c3e50; height: 4px; border-radius: 2px; overflow: hidden;">
                        <div style="background: #3498db; width: ${mpPercent}%; height: 100%; transition: width 0.3s;"></div>
                    </div>
                    
                    ${isLeader && member.id !== this.game.player.id ? `
                        <div style="margin-top: 5px; display: flex; gap: 5px;">
                            <button onclick="partySystem.promoteToLeader('${member.id}')" 
                                    style="flex: 1; padding: 3px; font-size: 10px; background: #f39c12; 
                                           color: white; border: none; border-radius: 3px; cursor: pointer;">
                                Promover
                            </button>
                            <button onclick="partySystem.kickMember('${member.id}')" 
                                    style="flex: 1; padding: 3px; font-size: 10px; background: #e74c3c; 
                                           color: white; border: none; border-radius: 3px; cursor: pointer;">
                                Expulsar
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        
        // Party info
        html += `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #34495e;">
                <div style="font-size: 11px; color: #95a5a6; display: flex; justify-content: space-between;">
                    <span>Loot: ${this.getLootModeName()}</span>
                    <span>XP: ${this.partySettings.expShare ? 'Compartilhado' : 'Individual'}</span>
                </div>
            </div>
        `;
        
        membersContainer.innerHTML = html;
        actionsContainer.style.display = 'block';
    }
    
    renderNearbyPlayers() {
        const list = this.invitePanel.querySelector('#nearby-players-list');
        
        if (this.nearbyPlayers.length === 0) {
            list.innerHTML = '<div style="color: #95a5a6; text-align: center;">Nenhum jogador próximo</div>';
            return;
        }
        
        let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
        
        this.nearbyPlayers.forEach(player => {
            if (this.currentParty?.members.some(m => m.id === player.id)) return;
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; 
                            background: #1a252f; padding: 10px; border-radius: 5px;">
                    <div>
                        <div style="font-weight: bold;">${player.name}</div>
                        <div style="font-size: 11px; color: #95a5a6;">Lvl ${player.level} ${player.class}</div>
                    </div>
                    <button onclick="partySystem.invitePlayer('${player.id}')" 
                            style="padding: 5px 10px; background: #27ae60; color: white; border: none; 
                                   border-radius: 3px; cursor: pointer; font-size: 12px;">
                        Convidar
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        list.innerHTML = html;
    }
    
    updateNearbyPlayers() {
        // Request nearby players from server
        this.game.socket.emit('getNearbyPlayers');
    }
    
    setNearbyPlayers(players) {
        this.nearbyPlayers = players;
        if (this.invitePanel.style.display === 'block') {
            this.renderNearbyPlayers();
        }
    }
    
    createParty() {
        this.game.socket.emit('createParty', {
            settings: this.partySettings
        });
    }
    
    invitePlayer(playerId) {
        if (!this.currentParty) {
            this.createParty();
        }
        
        this.game.socket.emit('inviteToParty', { playerId });
        this.showNotification('Convite enviado!', '#3498db');
    }
    
    inviteByName() {
        const input = this.invitePanel.querySelector('#player-name-input');
        const name = input.value.trim();
        
        if (!name) {
            this.showNotification('Digite um nome de jogador', '#e74c3c');
            return;
        }
        
        this.game.socket.emit('inviteToPartyByName', { name });
        input.value = '';
        this.showNotification(`Convite enviado para ${name}`, '#3498db');
    }
    
    showInviteNotification(inviteData) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            border: 2px solid #3498db;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">
                🎮 Convite de Grupo
            </div>
            <div style="font-size: 12px; margin-bottom: 12px;">
                <strong>${inviteData.inviterName}</strong> te convidou para um grupo
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="accept-invite" style="flex: 1; padding: 8px; background: #27ae60; 
                        color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Aceitar
                </button>
                <button class="decline-invite" style="flex: 1; padding: 8px; background: #e74c3c; 
                        color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Recusar
                </button>
            </div>
        `;
        
        notification.querySelector('.accept-invite').onclick = () => {
            this.acceptInvite(inviteData.partyId);
            notification.remove();
        };
        
        notification.querySelector('.decline-invite').onclick = () => {
            this.declineInvite(inviteData.partyId);
            notification.remove();
        };
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 30000);
        
        this.inviteNotifications.appendChild(notification);
    }
    
    acceptInvite(partyId) {
        this.game.socket.emit('acceptPartyInvite', { partyId });
    }
    
    declineInvite(partyId) {
        this.game.socket.emit('declinePartyInvite', { partyId });
    }
    
    updateParty(partyData) {
        this.currentParty = partyData;
        this.renderPartyMembers();
        
        if (partyData) {
            this.partyPanel.style.display = 'block';
        }
    }
    
    addMemberToParty(member) {
        if (this.currentParty) {
            this.currentParty.members.push(member);
            this.renderPartyMembers();
        }
    }
    
    removeMemberFromParty(memberId) {
        if (this.currentParty) {
            this.currentParty.members = this.currentParty.members.filter(m => m.id !== memberId);
            this.renderPartyMembers();
        }
    }
    
    updateMemberStatus(memberData) {
        if (!this.currentParty) return;
        
        const member = this.currentParty.members.find(m => m.id === memberData.id);
        if (member) {
            Object.assign(member, memberData);
            this.renderPartyMembers();
        }
    }
    
    leaveParty() {
        if (this.currentParty) {
            this.game.socket.emit('leaveParty');
            this.currentParty = null;
            this.renderPartyMembers();
        }
    }
    
    disbandParty() {
        this.currentParty = null;
        this.renderPartyMembers();
    }
    
    promoteToLeader(memberId) {
        this.game.socket.emit('promotePartyLeader', { memberId });
    }
    
    kickMember(memberId) {
        if (confirm('Tem certeza que deseja expulsar este membro?')) {
            this.game.socket.emit('kickPartyMember', { memberId });
        }
    }
    
    saveSettings() {
        const lootMode = this.settingsPanel.querySelector('#loot-mode-select').value;
        const expShare = this.settingsPanel.querySelector('#exp-share-check').checked;
        const autoInvite = this.settingsPanel.querySelector('#auto-invite-check').checked;
        
        this.partySettings = {
            lootMode,
            expShare,
            autoInvite
        };
        
        this.game.socket.emit('updatePartySettings', this.partySettings);
        this.toggleSettingsPanel();
        this.renderPartyMembers();
        this.showNotification('Configurações salvas!', '#27ae60');
    }
    
    getLootModeName() {
        const modes = {
            roundrobin: 'Round Robin',
            freeforall: 'Livre',
            needgreed: 'Necessidade',
            master: 'Mestre'
        };
        return modes[this.partySettings.lootMode] || 'Round Robin';
    }
    
    showNotification(message, color) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1003;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Loot distribution methods
    distributeLoot(loot, mobLocation) {
        if (!this.currentParty) {
            // Solo play - all loot to player
            return [{ playerId: this.game.player.id, loot }];
        }
        
        switch (this.partySettings.lootMode) {
            case 'roundrobin':
                return this.distributeRoundRobin(loot);
            case 'freeforall':
                return this.distributeFreeForAll(loot, mobLocation);
            case 'master':
                return this.distributeMasterLoot(loot);
            default:
                return this.distributeRoundRobin(loot);
        }
    }
    
    distributeRoundRobin(loot) {
        const members = this.currentParty.members;
        const nextLooterIndex = this.currentParty.nextLooterIndex || 0;
        
        const distribution = [{
            playerId: members[nextLooterIndex].id,
            loot
        }];
        
        // Update next looter
        this.currentParty.nextLooterIndex = (nextLooterIndex + 1) % members.length;
        
        return distribution;
    }
    
    distributeFreeForAll(loot, mobLocation) {
        // Everyone gets their own roll, closest player has advantage
        return this.currentParty.members.map(member => ({
            playerId: member.id,
            loot: { ...loot, quantity: Math.floor(loot.quantity / this.currentParty.members.length) || 1 }
        }));
    }
    
    distributeMasterLoot(loot) {
        // Only party leader gets loot
        return [{
            playerId: this.currentParty.leaderId,
            loot
        }];
    }
    
    // EXP sharing
    calculateExpShare(baseExp, memberLevel) {
        if (!this.partySettings.expShare || !this.currentParty) {
            return baseExp;
        }
        
        const playerLevel = this.game.player.level;
        const levelDiff = Math.abs(memberLevel - playerLevel);
        
        // EXP penalty for large level differences
        let penalty = 0;
        if (levelDiff > 5) {
            penalty = (levelDiff - 5) * 0.1; // 10% penalty per level above 5
        }
        
        // Party bonus (more members = more bonus, up to 50%)
        const partyBonus = Math.min(0.5, (this.currentParty.members.length - 1) * 0.1);
        
        return Math.floor(baseExp * (1 + partyBonus - penalty));
    }
    
    // Public API
    getParty() {
        return this.currentParty;
    }
    
    isInParty() {
        return this.currentParty !== null;
    }
    
    isPartyLeader() {
        return this.currentParty?.leaderId === this.game.player.id;
    }
    
    getPartyMembers() {
        return this.currentParty?.members || [];
    }
    
    cleanup() {
        if (this.partyPanel) this.partyPanel.remove();
        if (this.invitePanel) this.invitePanel.remove();
        if (this.settingsPanel) this.settingsPanel.remove();
        if (this.inviteNotifications) this.inviteNotifications.remove();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PartySystem;
} else {
    window.PartySystem = PartySystem;
}
