// Backup do servidor original - Restaurar se necessário
// Este é um backup limpo do servidor antes das modificações

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Import game systems
const database = require("../database/database.js");
const ErrorCatalog = require("./errorCatalog.js");
const MobSpawner = require("./mob-spawner.js");
const SimpleCombat = require("./combat/simpleCombat.js");
const startMap = require("./world/maps/startMap.js");

// Import Player Data Manager (MVP - Passo 3)
const { PlayerDataManager, getInstance: getPlayerDataManager } = require("./PlayerDataManager.js");

// Import New Core Systems
const ClassSystem = require("./systems/ClassSystem.js");
const StatSystem = require("./systems/StatSystem.js");
const SkillSystem = require("./systems/SkillSystem.js");
const MobSystem = require("./systems/MobSystem.js");
const TalentSystem = require("./systems/TalentSystem.js");

// Import Spawn System v0.3.6v
const SpawnManager = require("./SpawnManager.js");
const ZoneManager = require("./ZoneManager.js");
const BossManager = require("./BossManager.js");
const EventManager = require("./EventManager.js");

// Import Enhanced AI System v0.3.7v
const AIMobController = require("./ai/AIMobController.js");
const PathfindingSystem = require("./ai/PathfindingSystem.js");
const AIBossController = require("./ai/AIBossController.js");
const DecisionTree = require("./ai/DecisionTree.js");

// Import Guild System v0.5.0
const GuildDatabase = require("./guild/GuildDatabase.js");
const GuildManager = require("./guild/GuildManager.js");
const GuildChatHandler = require("./guild/GuildChatHandler.js");
const GuildInvitationManager = require("./guild/GuildInvitationManager.js");

// Import Trading & Economy System v0.5.0
const TradeManager = require("./trading/TradeManager.js");
const AuctionManager = require("./trading/AuctionManager.js");
const ValuationEngine = require("./trading/ValuationEngine.js");
const TradeSocketHandler = require("./trading/TradeSocketHandler.js");

// Import Zone System v0.5.0 - Phase 3: Eldoria
const EldoriaZone = require("./zones/EldoriaZone.js");
const ZoneTransition = require("./zones/ZoneTransition.js");
const KingEldor = require("./bosses/KingEldor.js");

// Import Eldoria Mobs
const ForestDeer = require("./mobs/eldoria/ForestDeer.js");
const WildBoar = require("./mobs/eldoria/WildBoar.js");
const Bandit = require("./mobs/eldoria/Bandit.js");
const IronGolem = require("./mobs/eldoria/IronGolem.js");
const CaveTroll = require("./mobs/eldoria/CaveTroll.js");
const RoyalGuard = require("./mobs/eldoria/RoyalGuard.js");
const Knight = require("./mobs/eldoria/Knight.js");

// Import modules
const CombatModule = require("./modules/CombatModule.js");
const QuestModule = require("./modules/QuestModule.js");
const LootModule = require("./modules/LootModule.js");

class MMOServer {
    constructor() {
        this.port = process.env.PORT || 3000;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.players = new Map();
        this.mobs = new Map();
        this.items = new Map();
        this.lootDrops = new Map(); // Drops no chão
        this.isRunning = false;
        
        // Quest Database (em memória - depois pode ser movido para DB)
        this.questDatabase = new Map([
            ['kill_rats_1', {
                id: 'kill_rats_1',
                name: 'Exterminio de Ratos',
                title: 'Exterminio de Ratos',
                description: 'Mate 5 ratos na area inicial.',
                type: 'kill',
                targetMobType: 'rat',
                requiredCount: 5,
                rewards: { xp: 50, gold: 10 }
            }],
            ['kill_slimes_1', {
                id: 'kill_slimes_1',
                name: 'Caca as Gosmas',
                title: 'Caca as Gosmas',
                description: 'Mate 3 slimes.',
                type: 'kill',
                targetMobType: 'slime',
                requiredCount: 3,
                rewards: { xp: 75, gold: 15 }
            }]
        ]);
        
        // Active quests por player (socketId -> { questId -> progress })
        this.playerQuests = new Map();
        
        // NOVO: Sistema de Profissões e Gathering
        this.resourceNodes = new Map();
        this.craftRecipes = new Map([
            ['copper_ingot', {
                id: 'copper_ingot',
                name: 'Copper Ingot',
                requires: [{ itemId: 'copper_ore', quantity: 3 }],
                produces: { itemId: 'copper_ingot', name: 'Copper Ingot', quantity: 1 }
            }],
            ['healing_potion', {
                id: 'healing_potion',
                name: 'Healing Potion',
                requires: [
                    { itemId: 'herb_leaf', quantity: 2 },
                    { itemId: 'water_flask', quantity: 1 }
                ],
                produces: { itemId: 'healing_potion', name: 'Healing Potion', quantity: 1 }
            }]
        ]);
        this.spawnResourceNodes();
        
        // Initialize modules
        this.playerDataManager = getPlayerDataManager('./data/players');
        
        // Initialize new modules (refactoring P0)
        this.combatModule = new CombatModule(this);
        this.questModule = new QuestModule(this);
        this.lootModule = new LootModule(this);
        
        this.combatSystem = new SimpleCombat();
        this.mobSpawner = new MobSpawner();
        
        // Initialize New Core Systems
        this.classSystem = new ClassSystem();
        this.skillSystem = new SkillSystem();
        this.mobSystem = new MobSystem();
        this.talentSystem = new TalentSystem();
        
        // Initialize world systems
        this.spawnManager = new SpawnManager();
        this.zoneManager = new ZoneManager();
        this.bossManager = new BossManager();
        this.eventManager = new EventManager();
        
        // Initialize Enhanced AI System v0.3.7v
        this.aiMobController = new AIMobController();
        this.pathfindingSystem = new PathfindingSystem();
        this.aiBossController = new AIBossController();
        this.decisionTree = new DecisionTree();
        this.eventReactions = new EventReactions();
        
        // Initialize Guild System v0.5.0
        this.guildDatabase = new GuildDatabase(this.db || database);
        this.guildManager = new GuildManager(this.guildDatabase, this.playerDataManager, null);
        this.guildChatHandler = new GuildChatHandler(this.guildManager, this.guildDatabase);
        this.guildInvitationManager = new GuildInvitationManager(this.guildManager, this.guildDatabase);
        
        // Initialize guild systems
        this.guildManager.initialize();
        this.guildChatHandler.initialize();
        this.guildInvitationManager.initialize();
        
        // Initialize Trading & Economy System v0.5.0
        this.tradeManager = new TradeManager(database, this.playerDataManager, null);
        this.auctionManager = new AuctionManager(database, this.playerDataManager);
        this.valuationEngine = new ValuationEngine(database);
        this.tradeSocketHandler = new TradeSocketHandler(this.io, database);
        
        // Initialize trading systems
        this.tradeManager.initialize();
        this.auctionManager.initialize();
        this.valuationEngine.initialize();
        
        // Initialize Zone System v0.5.0 - Phase 3: Eldoria
        this.zones = new Map();
        this.eldoriaZone = new EldoriaZone(database, this.mobSpawner, this.lootModule);
        this.zones.set('eldoria', this.eldoriaZone);
        
        // Initialize zone transition system
        this.zoneTransition = new ZoneTransition(database, this.zones, this.playerDataManager);
        
        // Initialize Eldoria boss
        this.kingEldor = new KingEldor(this.eldoriaZone);
        
        // Initialize zone systems
        this.eldoriaZone.initialize();
        this.zoneTransition.initialize?.();
        
        // Set server references
        if (this.mobSpawner && typeof this.mobSpawner.setServer === 'function') {
            this.mobSpawner.setServer(this);
        }
        if (this.combatSystem && typeof this.combatSystem.setServer === 'function') {
            this.combatSystem.setServer(this);
        }
        
        // Setup Spawn System integration
        this.setupSpawnSystemIntegration();
        
        // Setup Enhanced AI System integration
        this.setupAIIntegration();
        
        // Initialize Profession & Rested XP Systems
        const ProfessionRestedIntegration = require('./ProfessionRestedIntegration.js');
        new ProfessionRestedIntegration(this);
        
        // Simple event emitter
        this.eventEmitter = {
            emit: (event, ...args) => {
                console.log(`Event: ${event}`, ...args);
            }
        };
    }
    
    setupMiddleware() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../client')));
        
        // JSON parsing
        this.app.use(express.json());
        
        // Error handling
        this.app.use((error, req, res, next) => {
            console.error('Express error:', error);
            this.eventEmitter.emit('serverError', error);
            res.status(500).json({ error: 'Internal server error' });
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`Player connected: ${socket.id}`);
            
            // Handle player connection
            this.handlePlayerConnection(socket);
            
            // Handle disconnection
            socket.on('disconnect', () => {
                this.handlePlayerDisconnection(socket);
            });
        });
    }
    
    handlePlayerConnection(socket) {
        console.log(`🔗 Player connected: ${socket.id}`);
        
        // Don't auto-spawn player - wait for login
        console.log('⏳ Waiting for login authentication...');
        
        // Setup event handlers
        this.setupPlayerEventHandlers(socket);
        
        // Send current mobs to new player
        if (global.mobSpawner) {
            const mobs = global.mobSpawner.getAllMobs();
            socket.emit('mob:spawn', mobs); // NET_EVENTS.MOB_SPAWN
            console.log(`👾 Sent ${mobs.length} mobs to player ${socket.id}`);
        }
        
        // Notify guild system of player online
        if (this.guildManager) {
            this.guildManager.handlePlayerOnline(socket.id);
        }
        
        // Send connection event
        this.eventEmitter.emit('playerConnected', socket.id);
    }
    
    handlePlayerDisconnection(socket) {
        console.log(`👋 Player disconnected: ${socket.id}`);
        
        // Notify guild system of player offline
        if (this.guildManager) {
            this.guildManager.handlePlayerOffline(socket.id);
        }
        
        // Remove player from server
        this.players.delete(socket.id);
        
        // Send disconnection event
        this.eventEmitter.emit('playerDisconnected', socket.id);
    }
    
    setupPlayerEventHandlers(socket) {
        socket.on("auth:login", async (data) => {
            console.log("Player login:", data.username)
            
            // NOVO: Carregar dados salvos do jogador (MVP - Passo 3)
            const savedData = await this.playerDataManager.loadPlayer(data.username);
            
            const player = {
                id: socket.id,
                name: data.username,
                x: savedData?.position?.x || 400,
                y: savedData?.position?.y || 300,
                hp: savedData?.hp || 100,
                maxHp: savedData?.maxHp || 100,
                mana: savedData?.mana || 50,
                maxMana: savedData?.maxMana || 50,
                level: savedData?.level || 1,
                xp: savedData?.xp || 0,
                totalXp: savedData?.totalXp || 0,
                gold: savedData?.gold || 0,
                class: savedData?.class || 'warrior',
                stats: savedData?.stats || {
                    strength: 10,
                    agility: 10,
                    intelligence: 10,
                    stamina: 10
                },
                equipment: savedData?.equipment || {
                    weapon: null,
                    armor: null,
                    helmet: null,
                    shield: null,
                    accessory: null,
                    boots: null
                },
                inventory: savedData?.inventory || [],
                talents: savedData?.talents || [],
                activeQuests: savedData?.quests?.active || [],
                completedQuests: savedData?.quests?.completed || [],
                professions: savedData?.professions || { mining: { level: 1, xp: 0 } },
                createdAt: savedData?.createdAt || new Date().toISOString()
            }
            
            // Store player
            this.players.set(socket.id, player)
            
            // NOVO: Iniciar auto-save para este jogador (MVP - Passo 3)
            player._autoSaveInterval = this.playerDataManager.startAutoSave(
                player.name, 
                () => this.getPlayerDataForSave(socket.id),
                30000 // Salvar a cada 30 segundos
            );
            
            // Send success response
            this.sendWorldInit(socket, player);
            socket.emit('auth:login-success', { 
                username: data.username,
                isNewPlayer: !savedData // Indicar se é jogador novo
            });
            console.log('✅ Login successful:', data.username, savedData ? '(dados carregados)' : '(novo jogador)');
        });
        
        socket.on("player:move", (data) => {
            if (this.players.has(socket.id)) {
                const player = this.players.get(socket.id);
                player.x = data.x;
                player.y = data.y;
                
                // Broadcast player movement
                this.io.emit("player:moved", { // NET_EVENTS.PLAYER_MOVED
                    id: socket.id,
                    x: data.x,
                    y: data.y
                });
                
                console.log(`Player ${socket.id} moved to (${data.x}, ${data.y})`);
            }
        });
        
        socket.on("player:attack", (data) => {
            console.log("Player attacking mob:", data);
            // Handle combat
            if (this.combatSystem) {
                const result = this.combatSystem.handleAttack(socket.id, data.mobId, data.damage);
                socket.emit("player:attacked", result); // NET_EVENTS.PLAYER_ATTACKED
            }
        });
        
        // Handler de combate padronizado - delegar para CombatModule
        socket.on(NET_EVENTS.COMBAT_ATTACK, (data) => {
            console.log("⚔️ COMBAT_ATTACK recebido:", data);
            this.combatModule.handleCombatAttack(socket, data);
        });
        
        // Handler de coleta de loot - delegar para LootModule
        socket.on(NET_EVENTS.LOOT_COLLECT, (data) => {
            console.log("💰 LOOT_COLLECT recebido:", data);
            this.lootModule.handleLootCollect(socket, data);
        });
        
        // NOVOS: Handlers de equipamento
        socket.on(NET_EVENTS.EQUIPMENT_EQUIP, (data) => {
            console.log("🛡️ EQUIPMENT_EQUIP recebido:", data);
            this.handleEquipItem(socket, data);
        });
        
        socket.on(NET_EVENTS.EQUIPMENT_UNEQUIP, (data) => {
            console.log("🛡️ EQUIPMENT_UNEQUIP recebido:", data);
            this.handleUnequipItem(socket, data);
        });
        
        // Handlers de Quests - delegar para QuestModule
        socket.on(NET_EVENTS.QUEST_GIVER_INTERACT, (data) => {
            console.log("📜 QUEST_GIVER_INTERACT recebido:", data);
            this.questModule.handleQuestGiverInteract(socket, data);
        });
        
        socket.on(NET_EVENTS.QUEST_ACCEPT, (data) => {
            console.log("📜 QUEST_ACCEPT recebido:", data);
            this.questModule.handleQuestAccept(socket, data);
        });
        
        socket.on(NET_EVENTS.QUEST_COMPLETE, (data) => {
            console.log("📜 QUEST_COMPLETE recebido:", data);
            this.questModule.handleQuestComplete(socket, data);
        });
        
        // NOVOS: Handlers de Profissões e Crafting
        socket.on(NET_EVENTS.PROFESSION_GATHER_REQUEST, (data) => {
            console.log("⛏️ PROFESSION_GATHER_REQUEST recebido:", data);
            this.handleGatherRequest(socket, data);
        });
        
        socket.on(NET_EVENTS.CRAFT_REQUEST, (data) => {
            console.log("🔨 CRAFT_REQUEST recebido:", data);
            this.handleCraftRequest(socket, data);
        });
        
        // NOVOS: Handlers de Talent System (BLOCO 13)
        socket.on(NET_EVENTS.TALENT_TREE_REQUEST, () => {
            console.log("🌟 TALENT_TREE_REQUEST recebido");
            this.handleTalentTreeRequest(socket);
        });
        
        socket.on(NET_EVENTS.TALENT_SELECT, (data) => {
            console.log("🌟 TALENT_SELECT recebido:", data);
            this.handleTalentSelect(socket, data);
        });
        
        // Guild System Handlers v0.5.0
        this.setupGuildEventHandlers(socket);
        
        // Trading & Economy System Handlers v0.5.0
        this.setupTradingEventHandlers(socket);
    }
    
    /**
     * Setup Guild System event handlers
     */
    setupGuildEventHandlers(socket) {
        // Guild info
        socket.on("guild:get_info", async () => {
            const result = await this.guildManager.getPlayerGuildInfo(socket.id);
            socket.emit("guild:info", result);
        });
        
        // Create guild
        socket.on("guild:create", async (data) => {
            const player = this.players.get(socket.id);
            if (!player) return;
            
            const result = await this.guildManager.createGuild(socket.id, data);
            socket.emit("guild:created", result);
            
            if (result.success) {
                this.io.emit("notification", {
                    message: `[${result.guild.tag}] ${result.guild.name} has been founded!`,
                    type: "guild"
                });
            }
        });
        
        // Disband guild
        socket.on("guild:disband", async () => {
            const membership = await this.guildManager.db.getPlayerGuild(socket.id);
            if (!membership) {
                socket.emit("guild:error", { error: "Not in a guild" });
                return;
            }
            
            const result = await this.guildManager.disbandGuild(socket.id, membership.guild_id);
            socket.emit("guild:disbanded", result);
        });
        
        // Invite player
        socket.on("guild:invite", async (data) => {
            const membership = await this.guildManager.db.getPlayerGuild(socket.id);
            if (!membership) {
                socket.emit("guild:error", { error: "Not in a guild" });
                return;
            }
            
            // Find player by username
            let targetPlayerId = null;
            for (const [id, player] of this.players.entries()) {
                if (player.name.toLowerCase() === data.username.toLowerCase()) {
                    targetPlayerId = id;
                    break;
                }
            }
            
            if (!targetPlayerId) {
                socket.emit("guild:invite_result", { 
                    success: false, 
                    error: "Player not found or offline" 
                });
                return;
            }
            
            const result = await this.guildManager.invitePlayer(socket.id, membership.guild_id, data.username);
            socket.emit("guild:invite_result", result);
        });
        
        // Get invitations
        socket.on("guild:get_invitations", async () => {
            const result = await this.guildManager.getPlayerInvitations(socket.id);
            socket.emit("guild:invitations", result);
        });
        
        // Respond to invitation
        socket.on("guild:respond_invite", async (data) => {
            const result = await this.guildManager.respondToInvitation(socket.id, data.invitationId, data.accept);
            socket.emit("guild:invite_response", result);
        });
        
        // Leave guild
        socket.on("guild:leave", async () => {
            const result = await this.guildManager.leaveGuild(socket.id);
            socket.emit("guild:left", result);
        });
        
        // Kick member
        socket.on("guild:kick", async (data) => {
            const result = await this.guildManager.kickMember(socket.id, data.playerId);
            socket.emit("guild:kick_result", result);
        });
        
        // Promote/Demote
        socket.on("guild:promote", async (data) => {
            const result = await this.guildManager.promoteMember(socket.id, data.playerId, data.newRank);
            socket.emit("guild:promote_result", result);
        });
        
        // Transfer leadership
        socket.on("guild:transfer_leadership", async (data) => {
            const result = await this.guildManager.transferLeadership(socket.id, data.playerId);
            socket.emit("guild:leadership_transferred", result);
        });
        
        // Update guild info
        socket.on("guild:update_info", async (data) => {
            const result = await this.guildManager.updateGuildInfo(socket.id, data);
            socket.emit("guild:info_updated", result);
        });
        
        // Chat
        socket.on("guild:chat", async (data) => {
            const result = await this.guildChatHandler.handleChat(socket.id, data.message);
            if (!result.success) {
                socket.emit("guild:chat_error", { error: result.error });
            }
        });
        
        socket.on("guild:officer_chat", async (data) => {
            const result = await this.guildChatHandler.handleOfficerChat(socket.id, data.message);
            if (!result.success) {
                socket.emit("guild:chat_error", { error: result.error });
            }
        });
        
        // Browse guilds
        socket.on("guild:browse", async (data) => {
            const result = await this.guildManager.browseGuilds(data);
            socket.emit("guild:browse_result", result);
        });
        
        // Listen for guild events to broadcast
        this.guildManager.on('guild:member_joined', (data) => {
            this.io.to(data.guildId).emit('guild:member_joined', data);
        });
        
        this.guildManager.on('guild:member_left', (data) => {
            this.io.to(data.guildId).emit('guild:member_left', data);
        });
        
        // Price: Estimate
        socket.on("price:estimate", async (data) => {
            const result = await this.valuationEngine.estimatePrice(data.item, data.historicalDays);
            socket.emit("price:estimate_result", result);
        });
        
        // Price: Auction Suggestion
        socket.on("price:auction_suggestion", async (data) => {
            const result = await this.valuationEngine.getAuctionSuggestion(data.item);
            socket.emit("price:auction_suggestion_result", result);
        });
        
        // Market: Overview
        socket.on("market:overview", async () => {
            const result = await this.valuationEngine.getMarketOverview();
            socket.emit("market:overview_result", result);
        });
        
        // Trade Chat: Message
        socket.on("trade_chat:message", async (data) => {
            // Get player info
            const player = this.players.get(socket.id);
            if (!player) {
                socket.emit("trade_chat:error", { error: "Player not found" });
                return;
            }
            
            // Broadcast to all players
            this.io.emit("trade_chat:message", {
                playerId: socket.id,
                playerName: player.name,
                message: data.message,
                messageType: data.messageType,
                linkedItem: data.linkedItem,
                timestamp: new Date().toISOString()
            });
            
            socket.emit("trade_chat:sent", { success: true });
        });
        
        // Trade Chat: Get History
        socket.on("trade_chat:history", async (data) => {
            const limit = data?.limit || 50;
            // In production, query from database
            socket.emit("trade_chat:history_result", {
                success: true,
                messages: [] // Placeholder
            });
        });
        
        // Listen for trade events to broadcast
        this.tradeManager.on('trade:session_started', (data) => {
            this.io.to(data.sessionId).emit('trade:session_started', data);
        });
        
        this.tradeManager.on('trade:gold_updated', (data) => {
            this.io.to(data.sessionId).emit('trade:gold_updated', data);
        });
        
        this.tradeManager.on('trade:item_added', (data) => {
            this.io.to(data.sessionId).emit('trade:item_added', data);
        });
        
        this.tradeManager.on('trade:item_removed', (data) => {
            this.io.to(data.sessionId).emit('trade:item_removed', data);
        });
        
        this.tradeManager.on('trade:confirmed', (data) => {
            this.io.to(data.sessionId).emit('trade:confirmed', data);
        });
        
        this.tradeManager.on('trade:completed', (data) => {
            this.io.to(data.sessionId).emit('trade:completed', data);
            
            // Notify participants
            data.player1Id && this.io.to(data.player1Id).emit('notification', {
                message: 'Trade completed successfully!',
                type: 'success'
            });
            data.player2Id && this.io.to(data.player2Id).emit('notification', {
                message: 'Trade completed successfully!',
                type: 'success'
            });
        });
        
        this.tradeManager.on('trade:cancelled', (data) => {
            this.io.to(data.sessionId).emit('trade:cancelled', data);
        });
        
        // Listen for auction events
        this.auctionManager.on('auction:created', (data) => {
            this.io.emit('auction:new', data);
        });
        
        this.auctionManager.on('auction:bid_placed', (data) => {
            this.io.emit('auction:bid_update', data);
        });
        
        this.auctionManager.on('auction:completed', (data) => {
            this.io.emit('auction:sold', data);
            
            // Notify seller
            this.io.to(data.sellerId).emit('notification', {
                message: `Your ${data.itemName} sold for ${data.finalPrice}g!`,
                type: 'success'
            });
            
            // Notify buyer
            if (data.buyerId) {
                this.io.to(data.buyerId).emit('notification', {
                    message: `You won the auction for ${data.itemName}!`,
                    type: 'success'
                });
            }
        });
    }
    
    /**
     * Setup Zone System event handlers
     * Phase 3: Eldoria
     */
    setupZoneEventHandlers(socket) {
        // Zone: Get Info
        socket.on("zone:get_info", async (data) => {
            const zone = this.zones.get(data.zoneId);
            if (zone) {
                socket.emit("zone:info", {
                    success: true,
                    zoneId: data.zoneId,
                    zoneInfo: zone.getZoneInfo()
                });
            } else {
                socket.emit("zone:info", {
                    success: false,
                    error: "Zone not found"
                });
            }
        });
        
        // Zone: Get Current Zone
        socket.on("zone:get_current", async () => {
            const zoneInfo = await this.zoneTransition.getPlayerZoneInfo(socket.id);
            socket.emit("zone:current", zoneInfo);
        });
        
        // Zone: Travel Request
        socket.on("zone:travel_request", async (data, callback) => {
            console.log(`🌍 Travel request from ${socket.id} to ${data.targetZone}`);
            
            const player = this.players.get(socket.id);
            if (!player) {
                if (callback) callback({ success: false, error: "Player not found" });
                return;
            }
            
            // Check if player can use portal
            const portalId = data.portalId || `verdantis_to_${data.targetZone}`;
            const result = await this.zoneTransition.canUsePortal(socket.id, portalId);
            
            if (!result.allowed) {
                if (callback) callback({ success: false, error: result.reason });
                socket.emit("zone:travel_error", { error: result.reason });
                return;
            }
            
            // Execute travel
            const travelResult = await this.zoneTransition.usePortal(socket.id, portalId);
            
            if (travelResult.success) {
                // Update player position
                player.x = travelResult.position.x;
                player.y = travelResult.position.y;
                player.currentZone = travelResult.zone;
                
                // Notify player
                socket.emit("zone:traveled", {
                    success: true,
                    zone: travelResult.zone,
                    position: travelResult.position,
                    zoneInfo: travelResult.zoneInfo
                });
                
                // Notify old zone players
                socket.to(result.portal.fromZone).emit("player:left_zone", {
                    playerId: socket.id,
                    zone: result.portal.fromZone
                });
                
                // Notify new zone players
                socket.to(travelResult.zone).emit("player:joined_zone", {
                    playerId: socket.id,
                    playerName: player.name,
                    zone: travelResult.zone
                });
                
                if (callback) callback({ success: true });
            } else {
                if (callback) callback(travelResult);
            }
        });
        
        // Zone: Check Portal
        socket.on("zone:check_portal", async (data) => {
            const portal = this.zoneTransition.getPortalAt(data.zoneId, data.x, data.y);
            if (portal) {
                const canUse = await this.zoneTransition.canUsePortal(socket.id, portal.id);
                socket.emit("zone:portal_status", {
                    nearby: true,
                    portal: portal,
                    canUse: canUse.allowed,
                    reason: canUse.reason
                });
            } else {
                socket.emit("zone:portal_status", { nearby: false });
            }
        });
        
        // Zone: Get Available Portals
        socket.on("zone:get_portals", async () => {
            const zoneInfo = await this.zoneTransition.getPlayerZoneInfo(socket.id);
            const portals = await this.zoneTransition.getAvailablePortals(socket.id, zoneInfo.currentZone);
            socket.emit("zone:portals", { portals });
        });
        
        // Boss: Get Info
        socket.on("boss:get_info", async () => {
            if (this.kingEldor) {
                socket.emit("boss:info", this.kingEldor.getBossData());
            }
        });
        
        // Boss: Start Encounter
        socket.on("boss:start_encounter", async (data) => {
            const player = this.players.get(socket.id);
            if (!player) return;
            
            // Get nearby players for raid group
            const nearbyPlayers = [];
            for (const [id, p] of this.players) {
                if (p.currentZone === 'eldoria') {
                    nearbyPlayers.push({ id: id, name: p.name });
                }
            }
            
            const result = this.kingEldor.startEncounter(nearbyPlayers);
            socket.emit("boss:encounter_result", result);
        });
        
        // Boss: Attack
        socket.on("boss:attack", async (data) => {
            const player = this.players.get(socket.id);
            if (!player) return;
            
            const damage = data.damage || Math.floor(Math.random() * 50) + 20;
            const result = this.kingEldor.takeDamage(damage, player);
            
            socket.emit("boss:attack_result", result);
            
            // Broadcast boss state to all in zone
            this.io.to('eldoria').emit("boss:update", this.kingEldor.getBossData());
        });
        
        // Listen for Eldoria zone events
        this.eldoriaZone.on('mob:spawned', (data) => {
            this.io.to('eldoria').emit('zone:mob_spawned', data);
        });
        
        this.eldoriaZone.on('mob:died', (data) => {
            this.io.to('eldoria').emit('zone:mob_died', data);
        });
        
        this.eldoriaZone.on('boss:spawned', (data) => {
            this.io.to('eldoria').emit('zone:boss_spawned', data);
            this.io.emit('notification', {
                message: `King Eldor has appeared in The Throne Room!`,
                type: 'boss'
            });
        });
        
        // Listen for King Eldor events
        this.kingEldor.on('boss:encounter_started', (data) => {
            this.io.to('eldoria').emit('boss:encounter_started', data);
        });
        
        this.kingEldor.on('boss:phase_transition', (data) => {
            this.io.to('eldoria').emit('boss:phase_transition', data);
        });
        
        this.kingEldor.on('boss:defeated', (data) => {
            this.io.to('eldoria').emit('boss:defeated', data);
            this.io.emit('notification', {
                message: `King Eldor has been defeated! Kingslayers: ${data.participants.map(p => p.playerId).join(', ')}`,
                type: 'achievement'
            });
        });
    }
    
    async handlePlayerDisconnection(socket) {
        console.log(`Player disconnected: ${socket.id}`);
        
        const player = this.players.get(socket.id);
        if (player) {
            // NOVO: Parar auto-save e salvar dados finais (MVP - Passo 3)
            this.playerDataManager.stopAutoSave(player._autoSaveInterval);
            
            // Atualizar posição e timestamp
            const dataToSave = this.getPlayerDataForSave(socket.id);
            if (dataToSave) {
                await this.playerDataManager.savePlayer(player.name, dataToSave);
                console.log(`💾 Dados de ${player.name} salvos no disconnect`);
            }
        }
        
        // Remove player
        this.players.delete(socket.id);
        
        // Notify other players
        this.io.emit("player:leave", { id: socket.id }); // NET_EVENTS.PLAYER_LEAVE
    }
    
    /**
     * Handle combat attack from player
     */
    handleCombatAttack(socket, data) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        
        if (!player) {
            socket.emit(NET_EVENTS.COMBAT_ATTACK_RESULT, {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        const targetId = data.targetId;
        const targetType = data.targetType || 'mob';
        
        console.log(`⚔️ Player ${player.name} attacking ${targetType} ${targetId}`);
        
        // Find target (mob only for now)
        let target = null;
        if (targetType === 'mob') {
            // Try to find in mobSystem first
            if (this.mobSystem) {
                target = this.mobSystem.getMob(targetId);
            }
            // Fallback to mobSpawner
            if (!target && global.mobSpawner) {
                target = global.mobSpawner.getMob(targetId);
            }
        }
        
        if (!target) {
            socket.emit(NET_EVENTS.COMBAT_ATTACK_RESULT, {
                success: false,
                error: 'Target not found',
                targetId: targetId
            });
            return;
        }
        
        // Calculate damage
        const damage = this.calculateDamage(player, target);
        
        // Apply damage
        const currentHealth = target.hp || target.health || 100;
        const newHealth = Math.max(0, currentHealth - damage);
        target.hp = newHealth;
        target.health = newHealth;
        
        console.log(`💥 ${target.name || target.type} took ${damage} damage. HP: ${newHealth}/${target.maxHp || 100}`);
        
        // Check if target died
        const isDead = newHealth <= 0;
        
        if (isDead) {
            // Target died
            this.handleTargetDeath(socket, player, target, targetType, damage);
        } else {
            // Target survived - send damage result
            socket.emit(NET_EVENTS.COMBAT_ATTACK_RESULT, {
                success: true,
                targetId: targetId,
                targetType: targetType,
                damage: damage,
                currentHealth: newHealth,
                maxHealth: target.maxHp || 100,
                isDead: false
            });
            
            // Broadcast damage to nearby players
            this.io.emit(NET_EVENTS.COMBAT_DAMAGE, {
                targetId: targetId,
                targetType: targetType,
                damage: damage,
                currentHealth: newHealth,
                attackerId: playerId
            });
        }
    }
    
    /**
     * Calculate damage for combat
     */
    calculateDamage(player, target) {
        // Base damage (10-20)
        const baseDamage = 10 + Math.floor(Math.random() * 11);
        
        // Level bonus (+2 per level)
        const levelBonus = (player.level || 1) * 2;
        
        // Random variation (0.8 - 1.2)
        const variation = 0.8 + (Math.random() * 0.4);
        
        const totalDamage = Math.floor((baseDamage + levelBonus) * variation);
        
        return Math.max(1, totalDamage); // Minimum 1 damage
    }
    
    /**
     * Handle target death com shared XP/loot (MVP - Passo 5)
     */
    handleTargetDeath(socket, player, target, targetType, damage) {
        const playerId = socket.id;
        
        console.log(`💀 ${target.name || target.type} died!`);
        
        // NOVO: Encontrar jogadores próximos para shared XP (MVP - Passo 5)
        const nearbyPlayers = this.getNearbyPlayers(target.x, target.y, 200, playerId);
        const allContributors = [{ player: player, playerId: playerId, damage: damage }, ...nearbyPlayers];
        
        // Calcular XP total
        const baseXp = target.xpValue || (target.level || 1) * 10;
        
        // NOVO: Distribuir XP entre contribuidores (MVP - Passo 5)
        if (allContributors.length > 1) {
            // Shared XP: cada um ganha 100% do XP base (incentivo ao grupo)
            console.log(`👥 Shared XP: ${allContributors.length} jogadores próximos`);
        }
        
        // Dar XP para cada contribuidor
        for (const contributor of allContributors) {
            const xpAmount = Math.floor(baseXp); // 100% para todos no grupo
            const xpResult = this.grantXpToPlayer(contributor.player, xpAmount);
            
            if (xpResult) {
                const contributorSocket = this.getPlayerSocket(contributor.playerId);
                if (contributorSocket) {
                    contributorSocket.emit(NET_EVENTS.PLAYER_XP_GAIN, {
                        ...xpResult,
                        isShared: allContributors.length > 1,
                        sharedWith: allContributors.length
                    });
                    
                    if (xpResult.leveledUp) {
                        contributorSocket.emit(NET_EVENTS.PLAYER_LEVEL_UP, {
                            newLevel: xpResult.newLevel,
                            newMaxHP: contributor.player.baseStats?.maxHealth || (100 + xpResult.newLevel * 10),
                            newHP: contributor.player.baseStats?.maxHealth || (100 + xpResult.newLevel * 10),
                            xpToNext: xpResult.xpToNext
                        });
                    }
                    
                    // Sync stats
                    const newStats = this.calculatePlayerStats(contributor.player);
                    contributorSocket.emit(NET_EVENTS.PLAYER_STATS_SYNC, { stats: newStats });
                }
                
                console.log(`⭐ Player ${contributor.player.name} ganhou ${xpResult.gained} XP (${allContributors.length > 1 ? 'shared' : 'solo'})`);
            }
        }
        
        // NOVO: Criar drops individuais para cada jogador (MVP - Passo 5)
        this.createSharedLootDrops(target, allContributors);
        
        // Send attack result (final blow) para quem deu o último hit
        socket.emit(NET_EVENTS.COMBAT_ATTACK_RESULT, {
            success: true,
            targetId: target.id,
            targetType: targetType,
            damage: damage,
            currentHealth: 0,
            maxHealth: target.maxHp || 100,
            isDead: true,
            xpGained: baseXp,
            isShared: allContributors.length > 1,
            sharedWith: allContributors.length
        });
        
        // Broadcast mob death to all players
        this.io.emit(NET_EVENTS.MOB_DIED, {
            mobId: target.id,
            mobType: target.type,
            mobName: target.name,
            killerId: playerId,
            killerName: player.name,
            xpGained: baseXp,
            isShared: allContributors.length > 1,
            contributors: allContributors.map(c => ({ id: c.playerId, name: c.player.name })),
            position: { x: target.x, y: target.y }
        });
        
        // Remove mob from world
        if (targetType === 'mob') {
            if (this.mobSystem) {
                this.mobSystem.removeMob(target.id);
            }
            if (global.mobSpawner) {
                global.mobSpawner.removeMob(target.id);
            }
        }
        
        // Atualizar progresso de quests v2
        if (target.type) {
            for (const contributor of allContributors) {
                this.updateQuestProgressV2(contributor.playerId, target.type);
            }
        }
    }
    
    /**
     * NOVO: Retorna jogadores próximos a uma posição (MVP - Passo 5)
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {number} range - Raio de distância
     * @param {string} excludePlayerId - ID do jogador a excluir (opcional)
     * @returns {array} Lista de {player, playerId, damage}
     */
    getNearbyPlayers(x, y, range, excludePlayerId = null) {
        const nearby = [];
        
        for (const [playerId, player] of this.players) {
            if (excludePlayerId && playerId === excludePlayerId) continue;
            
            const dx = player.x - x;
            const dy = player.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= range) {
                // Simular dano (na versão completa, rastrear dano real)
                const simulatedDamage = 10; // Dano estimado
                nearby.push({ player, playerId, damage: simulatedDamage });
            }
        }
        
        return nearby;
    }
    
    /**
     * NOVO: Cria drops individuais para cada jogador (MVP - Passo 5)
     * @param {object} target - Mob morto
     * @param {array} contributors - Lista de contribuidores
     */
    createSharedLootDrops(target, contributors) {
        // Criar um drop por jogador (sistema mais simples e justo)
        for (const contributor of contributors) {
            const dropId = `drop_${target.id}_${contributor.playerId}_${Date.now()}`;
            
            // Loot personalizado por jogador
            const drop = {
                id: dropId,
                itemId: 'gold_coin',
                itemName: 'Gold Coin',
                quantity: 1 + Math.floor(Math.random() * 3), // 1-3 coins
                x: target.x + (Math.random() - 0.5) * 40, // Spread ao redor do mob
                y: target.y + (Math.random() - 0.5) * 40,
                createdAt: Date.now(),
                droppedBy: target.id,
                ownerId: contributor.playerId, // Drop pertence a este jogador
                isSharedDrop: contributors.length > 1
            };
            
            this.lootDrops.set(dropId, drop);
            
            // Notificar apenas o jogador dono do drop
            const socket = this.getPlayerSocket(contributor.playerId);
            if (socket) {
                socket.emit(NET_EVENTS.LOOT_DROP_CREATED, {
                    ...drop,
                    message: contributors.length > 1 
                        ? `💰 Loot compartilhado! ${drop.quantity} gold para você!` 
                        : `💰 ${drop.quantity} gold dropado!`
                });
            }
        }
        
        console.log(`💰 ${contributors.length} drops criados (shared loot) para ${target.name}`);
    }
    
    /**
     * Check and handle player level up
     */
    checkPlayerLevelUp(socket, player) {
        const xpNeeded = (player.level || 1) * 100;
        
        if (player.xp >= xpNeeded) {
            player.level = (player.level || 1) + 1;
            player.xp -= xpNeeded;
            player.maxHp = (player.maxHp || 100) + 10;
            player.hp = player.maxHp; // Full heal
            
            console.log(`🎉 Player ${player.name} leveled up to ${player.level}!`);
            
            socket.emit(NET_EVENTS.PLAYER_LEVEL_UP, {
                newLevel: player.level,
                newMaxHP: player.maxHp,
                newHP: player.hp,
                xpToNext: player.level * 100
            });
        }
    }
    
    async start() {
        try {
            console.log('Starting MMORPG Server...');
            
            // Start mob spawner
            if (global.mobSpawner) {
                global.mobSpawner.start();
                console.log('👾 Mob Spawner started');
            }
            
            // Start new MobSystem and spawn initial mobs
            if (this.mobSystem) {
                this.mobSystem.spawnInitialMobs();
                console.log('👾 MobSystem started with initial mobs');
            }
            
            // Start cleanup interval
            setInterval(() => {
                this.cleanupInactivePlayers();
            }, 60000); // Every minute
            
            this.eventEmitter.emit('serverStarted');
            
            // Start server
            this.server.listen(this.port, () => {
                console.log(`🎮 MMORPG Server running on port ${this.port}`);
                console.log(`📊 Dashboard: http://localhost:${this.port}`);
                console.log(`🕹️ Game: http://localhost:${this.port}/index.html`);
                this.isRunning = true;
            });
            
        } catch (error) {
            console.error('Failed to start server:', error);
            this.eventEmitter.emit('serverError', error);
            process.exit(1);
        }
    }
    
    stop() {
        if (!this.isRunning) return;
        
        console.log('Stopping MMORPG Server...');
        
        // Stop mob spawner
        if (global.mobSpawner) {
            global.mobSpawner.stop();
        }
        
        // Close server
        this.server.close(() => {
            console.log('Server stopped');
            this.isRunning = false;
        });
    }
    
    setupAIIntegration() {
        console.log('🤖 Setting up Enhanced AI System integration...');
        
        // Conectar AIMobController com o servidor
        if (this.aiMobController) {
            this.aiMobController.server = this;
            this.aiMobController.initialize();
            console.log('✅ AIMobController connected to server');
        }
        
        // Conectar PathfindingSystem
        if (this.pathfindingSystem) {
            this.pathfindingSystem.initialize();
            console.log('✅ PathfindingSystem initialized');
        }
        
        // Conectar AIBossController
        if (this.aiBossController) {
            this.aiBossController.server = this;
            this.aiBossController.initialize();
            console.log('✅ AIBossController connected to server');
        }
        
        // Conectar DecisionTree
        if (this.decisionTree) {
            this.decisionTree.initialize();
            console.log('✅ DecisionTree initialized');
        }
        
        // Conectar EventReactions
        if (this.eventReactions) {
            this.eventReactions.server = this;
            this.eventReactions.initialize();
            console.log('✅ EventReactions connected to server');
        }
        
        console.log('🎯 Enhanced AI System integration complete');
    }
    
    setupSpawnSystemIntegration() {
        console.log('👾 Setting up Spawn System integration...');
        
        // Conectar SpawnManager com o servidor
        if (this.spawnManager) {
            this.spawnManager.server = this;
            this.spawnManager.initialize();
            console.log('✅ SpawnManager connected to server');
        }
        
        // Conectar ZoneManager
        if (this.zoneManager) {
            this.zoneManager.server = this;
            this.zoneManager.initialize();
            console.log('✅ ZoneManager connected to server');
        }
        
        // Conectar BossManager
        if (this.bossManager) {
            this.bossManager.server = this;
            this.bossManager.initialize();
            console.log('✅ BossManager connected to server');
        }
        
        // Conectar EventManager
        if (this.eventManager) {
            this.eventManager.server = this;
            this.eventManager.initialize();
            console.log('✅ EventManager connected to server');
        }
        
        console.log('🎯 Spawn System integration complete');
    }
    
    cleanupInactivePlayers() {
        // Implementation for cleaning up inactive players
        console.log('Cleaning up inactive players...');
    }
    
    /**
     * Create loot drop when mob dies
     */
    createLootDrop(mob, playerId) {
        const dropId = 'drop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Loot fixo simples para MVP
        const drop = {
            id: dropId,
            itemId: 'gold_coin',
            itemName: 'Gold Coin',
            quantity: 1 + Math.floor(Math.random() * 3), // 1-3 coins
            x: mob.x,
            y: mob.y,
            createdAt: Date.now(),
            droppedBy: mob.id
        };
        
        // Salvar drop
        this.lootDrops.set(dropId, drop);
        
        // Broadcast para todos os players
        this.io.emit(NET_EVENTS.LOOT_DROP_CREATED, drop);
        
        console.log(`💰 Loot drop created: ${drop.itemName} x${drop.quantity} at (${drop.x}, ${drop.y})`);
        
        // Auto-remove após 60 segundos
        setTimeout(() => {
            if (this.lootDrops.has(dropId)) {
                this.lootDrops.delete(dropId);
                console.log(`🗑️ Loot drop expired: ${dropId}`);
            }
        }, 60000);
    }
    
    /**
     * Handle loot collection from player
     */
    handleLootCollect(socket, data) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        const dropId = data.dropId;
        
        if (!player) {
            socket.emit(NET_EVENTS.LOOT_COLLECTED, {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        const drop = this.lootDrops.get(dropId);
        if (!drop) {
            socket.emit(NET_EVENTS.LOOT_COLLECTED, {
                success: false,
                error: 'Drop not found or already collected'
            });
            return;
        }
        
        // Validar distância
        const dx = drop.x - player.x;
        const dy = drop.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) {
            socket.emit(NET_EVENTS.LOOT_COLLECTED, {
                success: false,
                error: 'Too far away'
            });
            return;
        }
        
        // Inicializar inventário se não existir
        player.inventory = player.inventory || [];
        
        // Verificar se item já existe no inventário
        const existingItem = player.inventory.find(item => item.id === drop.itemId);
        if (existingItem) {
            existingItem.quantity += drop.quantity;
        } else {
            player.inventory.push({
                id: drop.itemId,
                name: drop.itemName,
                quantity: drop.quantity
            });
        }
        
        // Remover drop do mundo
        this.lootDrops.delete(dropId);
        
        // Enviar confirmação
        socket.emit(NET_EVENTS.LOOT_COLLECTED, {
            success: true,
            dropId: dropId,
            itemName: drop.itemName,
            quantity: drop.quantity,
            inventory: player.inventory
        });
        
        // Sincronizar inventário
        socket.emit(NET_EVENTS.INVENTORY_SYNC, {
            items: player.inventory
        });
        
        console.log(`✅ Player ${player.name} collected ${drop.itemName} x${drop.quantity}`);
    }
    
    /**
     * Calculate XP required for a level
     * Curva: 50 * level^2
     */
    xpRequiredForLevel(level) {
        return 50 * level * level;
    }

    /**
     * Grant XP to player and handle level up
     */
    grantXpToPlayer(player, amount) {
        if (!player || !amount || amount <= 0) return null;

        // Initialize progress if needed
        player.progress = player.progress || { xp: 0, totalXp: 0 };
        player.baseStats = player.baseStats || { 
            level: 1, 
            maxHealth: 100, 
            attack: 10, 
            defense: 0, 
            speed: 1 
        };

        // Add XP
        player.progress.xp += amount;
        player.progress.totalXp += amount;

        let leveledUp = false;

        // Check for level up
        while (player.progress.xp >= this.xpRequiredForLevel(player.baseStats.level)) {
            player.progress.xp -= this.xpRequiredForLevel(player.baseStats.level);
            player.baseStats.level += 1;
            leveledUp = true;

            // Buff stats on level up
            player.baseStats.maxHealth += 10;
            player.baseStats.attack += 2;
        }

        const currentLevel = player.baseStats.level;
        const xpToNext = this.xpRequiredForLevel(currentLevel);

        return {
            gained: amount,
            newXp: player.progress.xp,
            totalXp: player.progress.totalXp,
            xpToNext,
            leveledUp,
            newLevel: currentLevel
        };
    }

    /**
     * Calculate player stats with equipment bonuses
     */
    calculatePlayerStats(player) {
        const baseStats = {
            level: player.level || 1,
            maxHealth: 100 + (player.level || 1) * 10,
            attack: 10 + (player.level || 1) * 2,
            defense: 0,
            speed: 1
        };
        
        const equipment = player.equipment || {};
        
        // Apply equipment bonuses
        for (const slot of Object.values(equipment)) {
            if (!slot || !slot.bonuses) continue;
            
            baseStats.maxHealth += slot.bonuses.maxHealth || 0;
            baseStats.attack += slot.bonuses.attack || 0;
            baseStats.defense += slot.bonuses.defense || 0;
            baseStats.speed += slot.bonuses.speed || 0;
        }
        
        return baseStats;
    }
    
    /**
     * Handle equip item request
     */
    handleEquipItem(socket, data) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        
        if (!player) {
            socket.emit(NET_EVENTS.EQUIPMENT_SYNC, {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        const itemId = data.itemId;
        const inventory = player.inventory || [];
        
        // Find item in inventory
        const itemIndex = inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            socket.emit(NET_EVENTS.EQUIPMENT_SYNC, {
                success: false,
                error: 'Item not found in inventory'
            });
            return;
        }
        
        const item = inventory[itemIndex];
        
        if (!item.equippable || !item.slot) {
            socket.emit(NET_EVENTS.EQUIPMENT_SYNC, {
                success: false,
                error: 'Item is not equippable'
            });
            return;
        }
        
        // Initialize equipment if needed
        player.equipment = player.equipment || {
            weapon: null,
            armor: null,
            accessory: null
        };
        
        const slot = item.slot;
        const currentEquipped = player.equipment[slot];
        
        // If there's already an item equipped, return it to inventory
        if (currentEquipped) {
            inventory.push({
                ...currentEquipped,
                quantity: 1
            });
        }
        
        // Equip new item
        player.equipment[slot] = { ...item, quantity: 1 };
        
        // Remove from inventory (or decrease quantity)
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            inventory.splice(itemIndex, 1);
        }
        
        // Recalculate stats
        const newStats = this.calculatePlayerStats(player);
        
        // Send equipment sync
        socket.emit(NET_EVENTS.EQUIPMENT_SYNC, {
            success: true,
            equipment: player.equipment,
            equippedItem: item.name
        });
        
        // Send stats sync
        socket.emit(NET_EVENTS.PLAYER_STATS_SYNC, {
            stats: newStats
        });
        
        // Send inventory sync
        socket.emit(NET_EVENTS.INVENTORY_SYNC, {
            items: inventory
        });
        
        console.log(`🛡️ Player ${player.name} equipped ${item.name} in ${slot}`);
    }
    
    /**
     * Handle unequip item request
     */
    handleUnequipItem(socket, data) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        
        if (!player) {
            socket.emit(NET_EVENTS.EQUIPMENT_SYNC, {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        const slot = data.slot;
        const equipment = player.equipment || {};
        
        if (!equipment[slot]) {
            socket.emit(NET_EVENTS.EQUIPMENT_SYNC, {
                success: false,
                error: 'No item equipped in that slot'
            });
            return;
        }
        
        const item = equipment[slot];
        
        // Return item to inventory
        player.inventory = player.inventory || [];
        const existingItem = player.inventory.find(inv => inv.id === item.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            player.inventory.push({
                ...item,
                quantity: 1
            });
        }
        
        // Clear slot
        equipment[slot] = null;
        
        // Recalculate stats
        const newStats = this.calculatePlayerStats(player);
        
        // Send equipment sync
        socket.emit(NET_EVENTS.EQUIPMENT_SYNC, {
            success: true,
            equipment: player.equipment,
            unequippedItem: item.name
        });
        
        // Send stats sync
        socket.emit(NET_EVENTS.PLAYER_STATS_SYNC, {
            stats: newStats
        });
        
        // Send inventory sync
        socket.emit(NET_EVENTS.INVENTORY_SYNC, {
            items: player.inventory
        });
        
        console.log(`🛡️ Player ${player.name} unequipped ${item.name} from ${slot}`);
    }
    
    // ===== MÉTODOS DE QUEST =====
    
    /**
     * Retorna lista de quests disponíveis para o player de um NPC específico
     */
    handleQuestGiverInteract(socket, data) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        const npcId = data?.npcId;
        
        if (!player) {
            socket.emit(NET_EVENTS.QUEST_LIST, { 
                success: false, 
                error: 'Player not found',
                quests: [] 
            });
            return;
        }
        
        // Pega quests ativas do player
        const playerActiveQuests = this.playerQuests.get(playerId) || {};
        
        // Monta lista de quests disponíveis (que não estão ativas nem completadas)
        const availableQuests = [];
        for (const [questId, quest] of this.questDatabase) {
            // Só mostra quests que não estão ativas e não foram completadas
            if (!playerActiveQuests[questId]) {
                availableQuests.push({
                    id: quest.id,
                    title: quest.title,
                    description: quest.description,
                    type: quest.type,
                    targetMobType: quest.targetMobType,
                    targetItemId: quest.targetItemId,
                    requiredCount: quest.requiredCount,
                    rewards: quest.rewards
                });
            }
        }
        
        // Adiciona quests ativas com progresso
        const activeQuests = [];
        for (const [questId, progressData] of Object.entries(playerActiveQuests)) {
            const quest = this.questDatabase.get(questId);
            if (quest && !progressData.completed) {
                activeQuests.push({
                    id: quest.id,
                    title: quest.title,
                    description: quest.description,
                    type: quest.type,
                    targetMobType: quest.targetMobType,
                    targetItemId: quest.targetItemId,
                    requiredCount: quest.requiredCount,
                    currentCount: progressData.currentCount || 0,
                    completed: (progressData.currentCount || 0) >= quest.requiredCount,
                    rewards: quest.rewards
                });
            }
        }
        
        socket.emit(NET_EVENTS.QUEST_LIST, {
            success: true,
            npcId: npcId,
            available: availableQuests,
            active: activeQuests
        });
        
        console.log(`📜 Quest list sent to ${player.name}: ${availableQuests.length} available, ${activeQuests.length} active`);
    }
    
    /**
     * Player aceita uma quest
     */
    handleQuestAccept(socket, data) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        const questId = data.questId;
        
        if (!player) {
            socket.emit(NET_EVENTS.QUEST_ACCEPTED, { 
                success: false, 
                error: 'Player not found' 
            });
            return;
        }
        
        const quest = this.questDatabase.get(questId);
        if (!quest) {
            socket.emit(NET_EVENTS.QUEST_ACCEPTED, { 
                success: false, 
                error: 'Quest not found' 
            });
            return;
        }
        
        // Inicializa estrutura do player se não existir
        if (!this.playerQuests.has(playerId)) {
            this.playerQuests.set(playerId, {});
        }
        
        const playerQuests = this.playerQuests.get(playerId);
        
        // Verifica se já tem essa quest
        if (playerQuests[questId]) {
            socket.emit(NET_EVENTS.QUEST_ACCEPTED, { 
                success: false, 
                error: 'Quest already active' 
            });
            return;
        }
        
        // Adiciona quest ativa
        playerQuests[questId] = {
            currentCount: 0,
            acceptedAt: Date.now(),
            completed: false
        };
        
        socket.emit(NET_EVENTS.QUEST_ACCEPTED, {
            success: true,
            questId: questId,
            questTitle: quest.title,
            quest: {
                id: quest.id,
                title: quest.title,
                description: quest.description,
                type: quest.type,
                targetMobType: quest.targetMobType,
                targetItemId: quest.targetItemId,
                requiredCount: quest.requiredCount,
                currentCount: 0,
                rewards: quest.rewards
            }
        });
        
        console.log(`📜 Player ${player.name} accepted quest: ${quest.title}`);
    }
    
    /**
     * Player completa uma quest
     */
    handleQuestComplete(socket, data) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        const questId = data.questId;
        
        if (!player) {
            socket.emit(NET_EVENTS.QUEST_COMPLETED, { 
                success: false, 
                error: 'Player not found' 
            });
            return;
        }
        
        const playerQuests = this.playerQuests.get(playerId);
        if (!playerQuests || !playerQuests[questId]) {
            socket.emit(NET_EVENTS.QUEST_COMPLETED, { 
                success: false, 
                error: 'Quest not found or not active' 
            });
            return;
        }
        
        const questProgress = playerQuests[questId];
        const quest = this.questDatabase.get(questId);
        
        if (!quest) {
            socket.emit(NET_EVENTS.QUEST_COMPLETED, { 
                success: false, 
                error: 'Quest data not found' 
            });
            return;
        }
        
        // Verifica se completou
        if (questProgress.currentCount < quest.requiredCount) {
            socket.emit(NET_EVENTS.QUEST_COMPLETED, { 
                success: false, 
                error: 'Quest requirements not met',
                currentCount: questProgress.currentCount,
                requiredCount: quest.requiredCount
            });
            return;
        }
        
        // Marca como completada
        questProgress.completed = true;
        questProgress.completedAt = Date.now();
        
        // Dá recompensas
        const rewards = quest.rewards;
        if (rewards.xp) {
            player.xp = (player.xp || 0) + rewards.xp;
        }
        if (rewards.gold) {
            player.gold = (player.gold || 0) + rewards.gold;
        }
        
        // Verifica level up
        this.checkPlayerLevelUp(socket, player);
        
        // Remove da lista de ativas
        delete playerQuests[questId];
        
        socket.emit(NET_EVENTS.QUEST_COMPLETED, {
            success: true,
            questId: questId,
            questTitle: quest.title,
            rewards: rewards
        });
        
        console.log(`📜 Player ${player.name} completed quest: ${quest.title}, rewards:`, rewards);
    }
    
    /**
     * Atualiza progresso de quest quando mob morre
     */
    updateQuestProgress(playerId, mobType) {
        const playerQuests = this.playerQuests.get(playerId);
        if (!playerQuests) return;
        
        const player = this.players.get(playerId);
        if (!player) return;
        
        // Procura quests de kill para esse mob
        for (const [questId, progressData] of Object.entries(playerQuests)) {
            if (progressData.completed) continue;
            
            const quest = this.questDatabase.get(questId);
            if (!quest) continue;
            
            if (quest.type === 'kill' && quest.targetMobType === mobType) {
                // Incrementa progresso
                progressData.currentCount = Math.min(quest.requiredCount, (progressData.currentCount || 0) + 1);
                
                console.log(`📜 Quest progress for ${player.name}: ${quest.title} = ${progressData.currentCount}/${quest.requiredCount}`);
                
                // Envia update para o cliente
                const socket = this.getPlayerSocket(playerId);
                if (socket) {
                    socket.emit(NET_EVENTS.QUEST_PROGRESS, {
                        questId: questId,
                        currentCount: progressData.currentCount,
                        requiredCount: quest.requiredCount,
                        progressText: `${progressData.currentCount} / ${quest.requiredCount}`,
                        completed: progressData.currentCount >= quest.requiredCount
                    });
                }
                
                // Se completou, notifica
                if (progressData.currentCount >= quest.requiredCount) {
                    console.log(`📜 Quest ready to complete: ${quest.title}`);
                }
            }
        }
    }
    
    /**
     * Helper para pegar socket do player
     */
    getPlayerSocket(playerId) {
        // io.sockets.sockets é um Map no socket.io v4+
        if (this.io.sockets && this.io.sockets.sockets) {
            return this.io.sockets.sockets.get(playerId);
        }
        return null;
    }
    
    sendWorldInit(socket, player) {
        const worldData = {
            playerId: socket.id,
            entities: [],
            lootDrops: [],
            inventory: [],
            equipment: {
                weapon: null,
                armor: null,
                accessory: null
            },
            stats: {
                level: player.level || 1,
                maxHealth: 100 + (player.level || 1) * 10,
                attack: 10 + (player.level || 1) * 2,
                defense: 0,
                speed: 1
            },
            progression: {
                level: player.baseStats?.level || player.level || 1,
                xp: player.progress?.xp || 0,
                totalXp: player.progress?.totalXp || 0,
                xpToNextLevel: this.xpRequiredForLevel(player.baseStats?.level || player.level || 1)
            }
        };
        
        // Add other players
        for (const [otherId, otherPlayer] of this.players) {
            if (otherId !== socket.id) {
                worldData.entities.push({
                    id: otherId,
                    type: 'player',
                    name: otherPlayer.name,
                    x: otherPlayer.x,
                    y: otherPlayer.y,
                    health: otherPlayer.hp || 100,
                    maxHealth: 100
                });
            }
        }
        
        // Add mobs from new MobSystem
        if (this.mobSystem) {
            const mobs = this.mobSystem.getAllMobs();
            for (const mob of mobs) {
                worldData.entities.push({
                    id: mob.id,
                    type: 'mob',
                    name: mob.name,
                    x: mob.x,
                    y: mob.y,
                    health: mob.hp,
                    maxHealth: mob.maxHp,
                    level: mob.level,
                    color: mob.color
                });
            }
        }
        
        // Add loot drops
        for (const [dropId, drop] of this.lootDrops) {
            worldData.lootDrops.push(drop);
        }
        
        // Add player inventory
        if (player.inventory) {
            worldData.inventory = player.inventory;
        }
        
        // Add player equipment
        if (player.equipment) {
            worldData.equipment = player.equipment;
        }
        
        // Calculate and add player stats
        worldData.stats = this.calculatePlayerStats(player);
        
        // Sync progression with stats
        worldData.progression.level = worldData.stats.level;
        
        // Add player quests
        const playerQuests = this.playerQuests.get(socket.id);
        if (playerQuests) {
            const activeQuests = [];
            const completedQuests = [];
            
            for (const [questId, progressData] of Object.entries(playerQuests)) {
                const quest = this.questDatabase.get(questId);
                if (quest) {
                    const questInfo = {
                        id: quest.id,
                        title: quest.title,
                        description: quest.description,
                        type: quest.type,
                        progress: progressData.progress,
                        required: quest.required,
                        progressText: `${progressData.progress} / ${quest.required}`,
                        completed: progressData.completed,
                        rewards: quest.rewards
                    };
                    
                    if (progressData.completed) {
                        completedQuests.push(questInfo);
                    } else {
                        activeQuests.push(questInfo);
                    }
                }
            }
            
            worldData.quests = {
                active: activeQuests,
                completed: completedQuests
            };
        }
        
        // NOVO: Add resource nodes
        worldData.resourceNodes = Array.from(this.resourceNodes.values());
        
        // NOVO: Add craft recipes
        worldData.craftRecipes = Array.from(this.craftRecipes.values());
        
        // NOVO: Add player professions
        player.professions = player.professions || {
            mining: { level: 1, xp: 0 },
            herbalism: { level: 1, xp: 0 }
        };
        
        // Calcular xpToNext para cada profissão
        worldData.professions = {};
        for (const [profName, profData] of Object.entries(player.professions)) {
            const xpRequiredForLevel = (level) => 30 * level * level;
            worldData.professions[profName] = {
                level: profData.level,
                xp: profData.xp,
                xpToNext: xpRequiredForLevel(profData.level)
            };
        }
        
        socket.emit('world:init', worldData); // NET_EVENTS.WORLD_INIT
        console.log('🌍 World init sent to player:', socket.id, `(${worldData.entities.length} entities, ${worldData.lootDrops.length} drops, ${worldData.inventory.length} items, level ${worldData.progression.level}, ${worldData.quests?.active?.length || 0} active quests, ${worldData.resourceNodes?.length || 0} resource nodes, ${worldData.craftRecipes?.length || 0} recipes)`);
    }
    
    // ===== MÉTODOS DE PROFISSÕES E GATHERING =====
    
    spawnResourceNodes() {
        // Spawn initial resource nodes
        const nodeTypes = [
            { type: 'mining', name: 'Copper Ore', itemId: 'copper_ore', color: '#B0BEC5' },
            { type: 'mining', name: 'Iron Ore', itemId: 'iron_ore', color: '#78909C' },
            { type: 'herbalism', name: 'Herb', itemId: 'herb_leaf', color: '#66BB6A' }
        ];
        
        // Spawn 10 nodes of each type at random positions
        for (let i = 0; i < 30; i++) {
            const nodeType = nodeTypes[i % 3];
            const node = {
                id: `node_${Date.now()}_${i}`,
                type: nodeType.type,
                name: nodeType.name,
                itemId: nodeType.itemId,
                color: nodeType.color,
                x: 100 + Math.random() * 600,
                y: 100 + Math.random() * 400,
                respawnTime: 30000 // 30 seconds respawn
            };
            this.resourceNodes.set(node.id, node);
        }
        
        console.log(`⛏️ Spawned ${this.resourceNodes.size} resource nodes`);
    }
    
    handleGatherRequest(socket, data) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        const nodeId = data.nodeId;
        
        if (!player) {
            socket.emit(NET_EVENTS.PROFESSION_GATHER_RESULT, {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        const node = this.resourceNodes.get(nodeId);
        if (!node) {
            socket.emit(NET_EVENTS.PROFESSION_GATHER_RESULT, {
                success: false,
                error: 'Resource node not found'
            });
            return;
        }
        
        // Validate distance
        const dx = node.x - player.x;
        const dy = node.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 60) {
            socket.emit(NET_EVENTS.PROFESSION_GATHER_RESULT, {
                success: false,
                error: 'Too far away from resource node'
            });
            return;
        }
        
        // Initialize player professions if needed
        player.professions = player.professions || {
            mining: { level: 1, xp: 0 },
            herbalism: { level: 1, xp: 0 }
        };
        
        // Determine profession
        const professionName = node.type; // 'mining' or 'herbalism'
        
        // Grant profession XP (more light than combat)
        const professionResult = this.grantProfessionXp(player, professionName, 10);
        
        // Add item to inventory
        player.inventory = player.inventory || [];
        const existingItem = player.inventory.find(item => item.id === node.itemId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            player.inventory.push({
                id: node.itemId,
                name: node.name,
                quantity: 1
            });
        }
        
        // Remove node (will respawn later)
        this.resourceNodes.delete(nodeId);
        
        // Schedule respawn
        setTimeout(() => {
            const newNode = {
                ...node,
                id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                x: 100 + Math.random() * 600,
                y: 100 + Math.random() * 400
            };
            this.resourceNodes.set(newNode.id, newNode);
            console.log(`⛏️ Resource node respawned: ${newNode.name}`);
        }, node.respawnTime);
        
        // Send result
        socket.emit(NET_EVENTS.PROFESSION_GATHER_RESULT, {
            success: true,
            nodeId: nodeId,
            removedNode: true,
            itemGained: { id: node.itemId, name: node.name, quantity: 1 },
            inventory: player.inventory,
            profession: professionResult,
            message: `You collected ${node.name}!`
        });
        
        // Sync inventory
        socket.emit(NET_EVENTS.INVENTORY_SYNC, {
            items: player.inventory
        });
        
        console.log(`⛏️ Player ${player.name} gathered ${node.name} (profession: ${professionName} Lv.${professionResult.level})`);
    }
    
    grantProfessionXp(player, professionName, amount) {
        if (!player.professions || !player.professions[professionName]) return null;
        
        const prof = player.professions[professionName];
        prof.xp += amount;
        
        let leveledUp = false;
        
        const xpRequiredForLevel = (level) => 30 * level * level;
        
        while (prof.xp >= xpRequiredForLevel(prof.level)) {
            prof.xp -= xpRequiredForLevel(prof.level);
            prof.level += 1;
            leveledUp = true;
        }
        
        const xpToNext = xpRequiredForLevel(prof.level);
        
        return {
            name: professionName,
            level: prof.level,
            xp: prof.xp,
            xpToNext,
            leveledUp
        };
    }
    
    handleCraftRequest(socket, data) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        const recipeId = data.recipeId;
        
        if (!player) {
            socket.emit(NET_EVENTS.CRAFT_RESULT, {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        const recipe = this.craftRecipes.get(recipeId);
        if (!recipe) {
            socket.emit(NET_EVENTS.CRAFT_RESULT, {
                success: false,
                error: 'Recipe not found'
            });
            return;
        }
        
        // Check if player has required materials
        player.inventory = player.inventory || [];
        
        for (const req of recipe.requires) {
            const item = player.inventory.find(i => i.id === req.itemId);
            if (!item || item.quantity < req.quantity) {
                socket.emit(NET_EVENTS.CRAFT_RESULT, {
                    success: false,
                    error: `Missing materials: ${req.itemId} x${req.quantity}`
                });
                return;
            }
        }
        
        // Remove materials
        for (const req of recipe.requires) {
            const item = player.inventory.find(i => i.id === req.itemId);
            if (item) {
                item.quantity -= req.quantity;
                if (item.quantity <= 0) {
                    player.inventory = player.inventory.filter(i => i.id !== req.itemId);
                }
            }
        }
        
        // Add crafted item
        const existingItem = player.inventory.find(i => i.id === recipe.produces.itemId);
        if (existingItem) {
            existingItem.quantity += recipe.produces.quantity;
        } else {
            player.inventory.push({
                id: recipe.produces.itemId,
                name: recipe.produces.name,
                quantity: recipe.produces.quantity
            });
        }
        
        // Send result
        socket.emit(NET_EVENTS.CRAFT_RESULT, {
            success: true,
            recipeId: recipeId,
            itemCreated: recipe.produces,
            inventory: player.inventory,
            message: `Crafted ${recipe.produces.name}!`
        });
        
        // Sync inventory
        socket.emit(NET_EVENTS.INVENTORY_SYNC, {
            items: player.inventory
        });
        
        console.log(`🔨 Player ${player.name} crafted ${recipe.produces.name}`);
    }
    
    // ===== MÉTODOS DE QUEST V2 =====
    
    /**
     * Dá uma quest para o jogador (Quest System v2)
     */
    giveQuest(socket, questData) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        
        if (!player) {
            socket.emit(NET_EVENTS.QUEST_GIVE, {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        // Initialize player quest data if needed
        if (!this.playerQuests.has(playerId)) {
            this.playerQuests.set(playerId, {});
        }
        
        const playerQuests = this.playerQuests.get(playerId);
        
        // Store quest progress
        playerQuests[questData.id] = {
            currentCount: 0,
            acceptedAt: Date.now(),
            completed: false
        };
        
        // Send quest to client
        socket.emit(NET_EVENTS.QUEST_GIVE, {
            id: questData.id,
            title: questData.title,
            description: questData.description,
            type: questData.type,
            mobId: questData.mobId,
            mobName: questData.mobName,
            target: questData.target
        });
        
        console.log(`📜 Quest given to ${player.name}: ${questData.title}`);
    }
    
    /**
     * Completa uma quest e dá recompensas (Quest System v2)
     */
    completePlayerQuest(socket, questId) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        
        if (!player) return;
        
        const playerQuests = this.playerQuests.get(playerId);
        if (!playerQuests || !playerQuests[questId]) return;
        
        const questProgress = playerQuests[questId];
        const quest = this.questDatabase.get(questId);
        
        if (!quest) return;
        
        // Verificar se completou
        if (questProgress.currentCount < quest.requiredCount) {
            socket.emit(NET_EVENTS.QUEST_COMPLETE, {
                success: false,
                error: 'Quest requirements not met',
                questId: questId
            });
            return;
        }
        
        // Marcar como completada
        questProgress.completed = true;
        questProgress.completedAt = Date.now();
        
        // Dar recompensas
        const rewards = quest.rewards || {};
        
        if (rewards.xp) {
            const xpResult = this.grantXpToPlayer(player, rewards.xp);
            if (xpResult && xpResult.leveledUp) {
                socket.emit(NET_EVENTS.PLAYER_LEVEL_UP, {
                    newLevel: xpResult.newLevel,
                    newMaxHP: player.baseStats?.maxHealth || (100 + xpResult.newLevel * 10),
                    newHP: player.baseStats?.maxHealth || (100 + xpResult.newLevel * 10),
                    xpToNext: xpResult.xpToNext
                });
            }
        }
        
        if (rewards.gold) {
            player.gold = (player.gold || 0) + rewards.gold;
        }
        
        // Send completion to client
        socket.emit(NET_EVENTS.QUEST_COMPLETE, {
            success: true,
            questId: questId,
            title: quest.title,
            xpReward: rewards.xp || 0,
            lootRewardName: rewards.itemName || null,
            lootRewardQuantity: rewards.itemQuantity || null
        });
        
        // Send reward details
        socket.emit(NET_EVENTS.QUEST_REWARD, {
            questId: questId,
            title: quest.title,
            xp: rewards.xp || 0,
            coins: rewards.gold || 0,
            items: rewards.items || []
        });
        
        console.log(`📜 Quest completed by ${player.name}: ${quest.title}`);
    }
    
    // ===== MÉTODOS DE TALENT SYSTEM (BLOCO 13) =====
    
    /**
     * Retorna árvore de talentos da classe do jogador
     */
    handleTalentTreeRequest(socket) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        
        if (!player) {
            socket.emit(NET_EVENTS.TALENT_TREE_DATA, {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        // Obter árvore de talentos do sistema
        const talentTree = this.talentSystem ? this.talentSystem.getTalentTree(player.class || 'warrior') : null;
        
        // Talentos já adquiridos pelo jogador
        const playerTalents = this.talentSystem ? this.talentSystem.getPlayerTalents(playerId) : [];
        
        // Calcular pontos de talento disponíveis (1 a cada 5 níveis)
        const level = player.baseStats?.level || player.level || 1;
        const talentsSpent = playerTalents.length;
        const totalTalentPoints = Math.floor((level - 1) / 5) + 1;
        const availablePoints = Math.max(0, totalTalentPoints - talentsSpent);
        
        socket.emit(NET_EVENTS.TALENT_TREE_DATA, {
            success: true,
            className: player.class || 'warrior',
            tree: talentTree,
            playerTalents: playerTalents,
            availablePoints: availablePoints,
            totalPoints: totalTalentPoints,
            spentPoints: talentsSpent
        });
        
        console.log(`🌟 Talent tree sent to ${player.name}: ${availablePoints} points available`);
    }
    
    /**
     * Seleciona um talento para o jogador
     */
    handleTalentSelect(socket, data) {
        const playerId = socket.id;
        const player = this.players.get(playerId);
        const talentId = data?.talentId;
        
        if (!player) {
            socket.emit(NET_EVENTS.TALENT_SELECT_RESULT, {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        if (!talentId) {
            socket.emit(NET_EVENTS.TALENT_SELECT_RESULT, {
                success: false,
                error: 'Talent ID required'
            });
            return;
        }
        
        // Verificar se pode pegar o talento
        if (!this.talentSystem) {
            socket.emit(NET_EVENTS.TALENT_SELECT_RESULT, {
                success: false,
                error: 'Talent system not available'
            });
            return;
        }
        
        // Verificar requisitos
        if (!this.talentSystem.canGetTalent(player, talentId)) {
            socket.emit(NET_EVENTS.TALENT_SELECT_RESULT, {
                success: false,
                error: 'Requirements not met'
            });
            return;
        }
        
        // Calcular pontos disponíveis
        const playerTalents = this.talentSystem.getPlayerTalents(playerId);
        const level = player.baseStats?.level || player.level || 1;
        const totalTalentPoints = Math.floor((level - 1) / 5) + 1;
        const availablePoints = Math.max(0, totalTalentPoints - playerTalents.length);
        
        if (availablePoints <= 0) {
            socket.emit(NET_EVENTS.TALENT_SELECT_RESULT, {
                success: false,
                error: 'No talent points available'
            });
            return;
        }
        
        // Adicionar talento
        const success = this.talentSystem.addTalent(playerId, talentId);
        
        if (success) {
            // Aplicar talento ao jogador
            this.talentSystem.applyTalent(player, talentId);
            
            // Recalcular stats
            const newStats = this.calculatePlayerStats(player);
            
            socket.emit(NET_EVENTS.TALENT_SELECT_RESULT, {
                success: true,
                talentId: talentId,
                message: 'Talent acquired!'
            });
            
            // Sync de talentos atualizados
            const updatedTalents = this.talentSystem.getPlayerTalents(playerId);
            const updatedAvailable = totalTalentPoints - updatedTalents.length;
            
            socket.emit(NET_EVENTS.PLAYER_TALENTS_SYNC, {
                talents: updatedTalents,
                availablePoints: updatedAvailable,
                totalPoints: totalTalentPoints
            });
            
            // Sync de stats atualizados
            socket.emit(NET_EVENTS.PLAYER_STATS_SYNC, { stats: newStats });
            
            console.log(`🌟 Player ${player.name} acquired talent: ${talentId}`);
        } else {
            socket.emit(NET_EVENTS.TALENT_SELECT_RESULT, {
                success: false,
                error: 'Failed to acquire talent'
            });
        }
    }
    
    /**
     * Retorna dados do jogador para salvamento (MVP - Passo 3)
     */
    getPlayerDataForSave(playerId) {
        const player = this.players.get(playerId);
        if (!player) return null;
        
        return {
            id: player.id,
            name: player.name,
            class: player.class || 'warrior',
            level: player.level || 1,
            xp: player.xp || 0,
            totalXp: player.totalXp || 0,
            hp: player.hp || 100,
            maxHp: player.maxHp || 100,
            mana: player.mana || 50,
            maxMana: player.maxMana || 50,
            gold: player.gold || 0,
            stats: player.stats || {
                strength: 10,
                agility: 10,
                intelligence: 10,
                stamina: 10
            },
            equipment: player.equipment || {
                weapon: null,
                armor: null,
                helmet: null,
                shield: null,
                accessory: null,
                boots: null
            },
            inventory: player.inventory || [],
            position: { x: player.x || 400, y: player.y || 300 },
            zone: player.zone || 'korvien_village',
            createdAt: player.createdAt || new Date().toISOString(),
            talents: player.talents || [],
            quests: {
                active: player.activeQuests || [],
                completed: player.completedQuests || []
            },
            professions: player.professions || {
                mining: { level: 1, xp: 0 }
            }
        };
    }
}

module.exports = MMOServer;