// NetworkManager - Gerencia comunicação com servidor
// Futuro: implementar quando GAME_MODE === 'SERVER_ONLINE'

class NetworkManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.serverAddress = null;
        this.eventHandlers = {};
    }

    connect(serverAddress) {
        console.log('🔌 Conectando ao servidor:', serverAddress);
        this.serverAddress = serverAddress;
        
        // Inicializar Socket.IO
        if (typeof io !== 'undefined') {
            this.socket = io(serverAddress);
            
            this.socket.on('connect', () => this.onConnect());
            this.socket.on('disconnect', () => this.onDisconnect());
            this.socket.on('connect_error', (error) => {
                console.error('❌ Erro de conexão:', error);
                this.connected = false;
            });
            
            // Registrar handlers de eventos
            this.setupEventHandlers();
        } else {
            console.warn('⚠️ Socket.IO não disponível. Modo offline ativado.');
        }
    }
    
    setupEventHandlers() {
        if (!this.socket) return;
        
        // Handlers de autenticação
        this.socket.on(NET_EVENTS.AUTH_LOGIN_SUCCESS, (data) => {
            this.emitHandler('loginSuccess', data);
        });
        
        this.socket.on(NET_EVENTS.AUTH_LOGIN_ERROR, (data) => {
            this.emitHandler('loginError', data);
        });
        
        // Handlers de mundo
        this.socket.on(NET_EVENTS.WORLD_INIT, (data) => {
            this.onWorldInit(data);
            this.emitHandler('worldInit', data);
        });
        
        this.socket.on(NET_EVENTS.WORLD_UPDATE, (data) => {
            this.emitHandler('worldUpdate', data);
        });
        
        // Handlers de jogador
        this.socket.on(NET_EVENTS.PLAYER_MOVED, (data) => {
            this.emitHandler('playerMoved', data);
        });
        
        this.socket.on(NET_EVENTS.PLAYER_JOIN, (data) => {
            this.emitHandler('playerJoin', data);
        });
        
        this.socket.on(NET_EVENTS.PLAYER_LEAVE, (data) => {
            this.emitHandler('playerLeave', data);
        });
        
        // Handlers de mobs
        this.socket.on(NET_EVENTS.MOB_SPAWN, (data) => {
            this.emitHandler('mobSpawn', data);
        });
        
        this.socket.on(NET_EVENTS.MOB_UPDATE, (data) => {
            this.emitHandler('mobUpdate', data);
        });
        
        this.socket.on(NET_EVENTS.MOB_DIE, (data) => {
            this.emitHandler('mobDie', data);
        });
        
        // NOVOS: Handlers de combate
        this.socket.on(NET_EVENTS.COMBAT_ATTACK_RESULT, (data) => {
            this.emitHandler('combatAttackResult', data);
        });
        
        this.socket.on(NET_EVENTS.MOB_DIED, (data) => {
            this.emitHandler('mobDied', data);
        });
        
        // NOVOS: Handlers de equipamento e stats
        this.socket.on(NET_EVENTS.EQUIPMENT_SYNC, (data) => {
            this.emitHandler('equipmentSync', data);
        });
        
        this.socket.on(NET_EVENTS.PLAYER_STATS_SYNC, (data) => {
            this.emitHandler('playerStatsSync', data);
        });
        
        // NOVO: Handler de XP gain
        this.socket.on(NET_EVENTS.PLAYER_XP_GAIN, (data) => {
            this.emitHandler('playerXpGain', data);
        });
        
        // NOVO: Handler de Level Up
        this.socket.on(NET_EVENTS.PLAYER_LEVEL_UP, (data) => {
            this.emitHandler('playerLevelUp', data);
        });
        
        // NOVOS: Handlers de quests
        this.socket.on(NET_EVENTS.QUEST_LIST, (data) => {
            this.emitHandler('questList', data);
        });
        
        this.socket.on(NET_EVENTS.QUEST_SYNC, (data) => {
            this.emitHandler('questSync', data);
        });
        
        this.socket.on(NET_EVENTS.QUEST_ACCEPTED, (data) => {
            this.emitHandler('questAccepted', data);
        });
        
        this.socket.on(NET_EVENTS.QUEST_UPDATE, (data) => {
            this.emitHandler('questUpdate', data);
        });
        
        this.socket.on(NET_EVENTS.QUEST_COMPLETED, (data) => {
            this.emitHandler('questCompleted', data);
        });
        
        // NOVOS: Handlers de Quest System v2
        this.socket.on(NET_EVENTS.QUEST_GIVE, (data) => {
            this.emitHandler('questGive', data);
        });
        
        this.socket.on(NET_EVENTS.QUEST_PROGRESS_SYNC, (data) => {
            this.emitHandler('questProgressSync', data);
        });
        
        this.socket.on(NET_EVENTS.QUEST_REWARD, (data) => {
            this.emitHandler('questReward', data);
        });
        
        // NOVOS: Handlers de Talent System (BLOCO 13)
        this.socket.on(NET_EVENTS.TALENT_TREE_DATA, (data) => {
            this.emitHandler('talentTreeData', data);
        });
        
        this.socket.on(NET_EVENTS.TALENT_SELECT_RESULT, (data) => {
            this.emitHandler('talentSelectResult', data);
        });
        
        this.socket.on(NET_EVENTS.PLAYER_TALENTS_SYNC, (data) => {
            this.emitHandler('playerTalentsSync', data);
        });
        
        this.socket.on(NET_EVENTS.TALENT_POINTS_AVAILABLE, (data) => {
            this.emitHandler('talentPointsAvailable', data);
        });
        
        // NOVOS: Handlers de Profissoes e Crafting
        this.socket.on(NET_EVENTS.PROFESSION_GATHER_RESULT, (data) => {
            this.emitHandler('professionGatherResult', data);
        });
        
        this.socket.on(NET_EVENTS.CRAFT_RESULT, (data) => {
            this.emitHandler('craftResult', data);
        });
        
        // Handlers de sistema
        this.socket.on(NET_EVENTS.SYSTEM_ERROR, (data) => {
            console.error('❌ Erro do servidor:', data);
            this.emitHandler('systemError', data);
        });
        
        this.socket.on(NET_EVENTS.SYSTEM_MESSAGE, (data) => {
            console.log('📢 Mensagem do servidor:', data);
            this.emitHandler('systemMessage', data);
        });
    }
    
    // Sistema de eventos
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }
    
    off(event, handler) {
        if (!this.eventHandlers[event]) return;
        const index = this.eventHandlers[event].indexOf(handler);
        if (index > -1) {
            this.eventHandlers[event].splice(index, 1);
        }
    }
    
    emitHandler(event, data) {
        if (!this.eventHandlers[event]) return;
        this.eventHandlers[event].forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Erro no handler de ${event}:`, error);
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
            console.log('🔌 Desconectado do servidor');
        }
    }

    // Métodos de comunicação
    sendLogin(username, password) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.AUTH_LOGIN, { username, password });
            console.log('📤 Login enviado para servidor');
        } else {
            console.warn('⚠️ Não conectado ao servidor');
        }
    }

    sendCreateAccount(username, password, email) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.ACCOUNT_CREATE, { username, password, email });
            console.log('📤 Criação de conta enviada para servidor');
        }
    }
    
    sendCharacterCreate(characterData) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.CHARACTER_CREATE, characterData);
            console.log('📤 Criação de personagem enviada');
        }
    }
    
    sendCharacterSelect(characterId) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.CHARACTER_SELECT, { characterId });
            console.log('📤 Seleção de personagem enviada');
        }
    }

    sendPlayerMove(x, y) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.PLAYER_MOVE, { x, y });
        }
    }

    sendPlayerStop(x, y) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.PLAYER_STOP, { x, y });
        }
    }
    
    // NOVO: Método de ataque
    attack(payload) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.COMBAT_ATTACK, payload);
            console.log('⚔️ Ataque enviado:', payload);
        } else {
            console.warn('⚠️ Não conectado - ataque local apenas');
        }
    }

    // NOVOS: Métodos de equipamento
    equipItem(payload) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.EQUIPMENT_EQUIP, payload);
            console.log('🛡️ Equipar item:', payload);
        } else {
            console.warn('⚠️ Não conectado - não pode equipar item');
        }
    }

    unequipItem(payload) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.EQUIPMENT_UNEQUIP, payload);
            console.log('🛡️ Desequipar item:', payload);
        } else {
            console.warn('⚠️ Não conectado - não pode desequipar item');
        }
    }

    // NOVOS: Métodos de quest
    requestQuestList(payload) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.QUEST_LIST, payload);
            console.log('📜 Solicitando lista de quests:', payload);
        } else {
            console.warn('⚠️ Não conectado - não pode solicitar quests');
        }
    }

    acceptQuest(payload) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.QUEST_ACCEPT, payload);
            console.log('📜 Aceitando quest:', payload);
        } else {
            console.warn('⚠️ Não conectado - não pode aceitar quest');
        }
    }

    completeQuest(payload) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.QUEST_COMPLETE, payload);
            console.log('📜 Completando quest:', payload);
        } else {
            console.warn('⚠️ Não conectado - não pode completar quest');
        }
    }

    // NOVOS: Métodos de Profissões e Gathering
    requestGather(payload) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.PROFESSION_GATHER_REQUEST, payload);
            console.log('⛏️ Solicitando gathering:', payload);
        } else {
            console.warn('⚠️ Não conectado - não pode coletar recurso');
        }
    }

    // NOVOS: Métodos de Talent System (BLOCO 13)
    requestTalentTree() {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.TALENT_TREE_REQUEST);
            console.log('🌟 Solicitando árvore de talentos');
        } else {
            console.warn('⚠️ Não conectado - não pode solicitar talentos');
        }
    }

    selectTalent(talentId) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.TALENT_SELECT, { talentId });
            console.log('🌟 Selecionando talento:', talentId);
        } else {
            console.warn('⚠️ Não conectado - não pode selecionar talento');
        }
    }

    requestCraft(payload) {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.CRAFT_REQUEST, payload);
            console.log('🔨 Solicitando craft:', payload);
        } else {
            console.warn('⚠️ Não conectado - não pode craftar item');
        }
    }

    sendAttackMob(mobId, damage) {
        console.warn('⚠️ sendAttackMob está deprecado. Use attack() com NET_EVENTS.COMBAT_ATTACK');
        this.attack({
            targetId: mobId,
            targetType: 'mob',
            damage: damage
        });
    }
    
    requestWorldInit() {
        if (this.socket && this.connected) {
            this.socket.emit(NET_EVENTS.WORLD_INIT_REQUEST);
            console.log('🌍 Solicitando inicialização do mundo');
        }
    }

    // Event handlers
    onConnect() {
        this.connected = true;
        console.log('✅ Conectado ao servidor');
        this.emitHandler('connect', { connected: true });
    }

    onDisconnect() {
        this.connected = false;
        console.log('❌ Desconectado do servidor');
        this.emitHandler('disconnect', { connected: false });
    }

    onWorldInit(data) {
        console.log('🌍 Mundo inicial recebido:', data);
        // Enviar para GameplayEngine
        if (window._gameplayEngine && window._gameplayEngine.updateFromServer) {
            window._gameplayEngine.updateFromServer(data);
        }
    }

    onPlayerUpdate(data) {
        console.log('👤 Update de jogador recebido:', data);
        // Atualizar outros jogadores no GameplayEngine
    }

    onMobUpdate(data) {
        console.log('👾 Update de mob recebido:', data);
        // Atualizar mobs no GameplayEngine
    }
}

// Export para uso global
if (typeof window !== 'undefined') {
    window.NetworkManager = NetworkManager;
}

export default NetworkManager;
