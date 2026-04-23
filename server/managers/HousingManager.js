/**
 * HousingManager - Sistema de Moradias/Player Housing
 * 
 * Features:
 * - Casas compráveis em diferentes zonas
 * - Sistema de instâncias privadas
 * - Decoração com móveis
 * - Armazenamento pessoal (baú da casa)
 * - Visitas de amigos/guilda
 * - Sistema de aluguel/manutenção
 * - Upgrades de tamanho
 */

class HousingManager {
    constructor(server) {
        this.server = server;
        this.io = server.io;
        
        // Storage
        this.playerHomes = new Map(); // playerId -> home data
        this.activeInstances = new Map(); // instanceId -> instance data
        this.furnitureDatabase = this.initializeFurnitureDatabase();
        this.houseTemplates = this.initializeHouseTemplates();
        
        // Config
        this.config = {
            maxFurniturePerHome: 100,
            baseMaintenanceCost: 100, // per day
            visitTimeout: 300000, // 5 minutes AFK kicks visitors
            maxVisitors: 20
        };
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        this.startMaintenanceLoop();
        console.log('[HousingManager] Sistema de housing inicializado');
    }
    
    initializeHouseTemplates() {
        return {
            small_cabin: {
                id: 'small_cabin',
                name: 'Cabana Simples',
                icon: '🏠',
                size: 'small',
                maxFurniture: 20,
                storageSlots: 20,
                rooms: 2,
                cost: 5000,
                maintenance: 50,
                location: 'verdantis_outskirts',
                unlockRequirement: { level: 10 }
            },
            cozy_cottage: {
                id: 'cozy_cottage',
                name: 'Cottage Aconchegante',
                icon: '🏡',
                size: 'small',
                maxFurniture: 35,
                storageSlots: 40,
                rooms: 3,
                cost: 15000,
                maintenance: 100,
                location: 'verdantis_village',
                unlockRequirement: { level: 20 }
            },
            townhouse: {
                id: 'townhouse',
                name: 'Casa na Cidade',
                icon: '🏘️',
                size: 'medium',
                maxFurniture: 60,
                storageSlots: 80,
                rooms: 4,
                cost: 50000,
                maintenance: 250,
                location: 'eldoria_residential',
                unlockRequirement: { level: 30, reputation: { faction: 'alliance_sentinels', level: 'amigavel' } }
            },
            manor: {
                id: 'manor',
                name: 'Mansão Elegante',
                icon: '🏰',
                size: 'medium',
                maxFurniture: 100,
                storageSlots: 150,
                rooms: 6,
                cost: 200000,
                maintenance: 1000,
                location: 'eldoria_noble_district',
                unlockRequirement: { level: 40, achievement: 'wealthy' }
            },
            villa: {
                id: 'villa',
                name: 'Vila de Luxo',
                icon: '🏛️',
                size: 'large',
                maxFurniture: 150,
                storageSlots: 250,
                rooms: 8,
                cost: 500000,
                maintenance: 2500,
                location: 'aurélia_oasis',
                unlockRequirement: { level: 50, title: 'wealthy' }
            },
            floating_tower: {
                id: 'floating_tower',
                name: 'Torre Flutuante',
                icon: '🗼',
                size: 'large',
                maxFurniture: 200,
                storageSlots: 400,
                rooms: 10,
                cost: 1000000,
                maintenance: 5000,
                location: 'dracônia_peaks',
                unlockRequirement: { level: 60, achievement: 'completionist' }
            }
        };
    }
    
    initializeFurnitureDatabase() {
        return {
            // Storage
            wooden_chest: {
                id: 'wooden_chest',
                name: 'Baú de Madeira',
                icon: '📦',
                category: 'storage',
                slots: 10,
                cost: 100,
                size: { x: 1, y: 1 }
            },
            iron_strongbox: {
                id: 'iron_strongbox',
                name: 'Cofre de Ferro',
                icon: '🔒',
                category: 'storage',
                slots: 20,
                cost: 500,
                size: { x: 1, y: 1 }
            },
            magic_wardrobe: {
                id: 'magic_wardrobe',
                name: 'Armário Mágico',
                icon: '🚪',
                category: 'storage',
                slots: 50,
                cost: 2000,
                size: { x: 2, y: 1 }
            },
            
            // Seating
            wooden_chair: {
                id: 'wooden_chair',
                name: 'Cadeira de Madeira',
                icon: '🪑',
                category: 'seating',
                cost: 50,
                size: { x: 1, y: 1 },
                interactable: true
            },
            comfy_sofa: {
                id: 'comfy_sofa',
                name: 'Sofá Confortável',
                icon: '🛋️',
                category: 'seating',
                cost: 300,
                size: { x: 2, y: 1 },
                interactable: true,
                buff: { comfort: 5 }
            },
            throne: {
                id: 'throne',
                name: 'Trono Real',
                icon: '👑',
                category: 'seating',
                cost: 10000,
                size: { x: 2, y: 2 },
                interactable: true,
                buff: { prestige: 10 },
                rarity: 'legendary'
            },
            
            // Tables
            wooden_table: {
                id: 'wooden_table',
                name: 'Mesa de Madeira',
                icon: '🪑',
                category: 'surface',
                cost: 100,
                size: { x: 2, y: 1 }
            },
            dining_table: {
                id: 'dining_table',
                name: 'Mesa de Jantar',
                icon: '🍽️',
                category: 'surface',
                cost: 400,
                size: { x: 3, y: 2 }
            },
            crafting_table: {
                id: 'crafting_table',
                name: 'Mesa de Craft',
                icon: '⚒️',
                category: 'crafting',
                cost: 500,
                size: { x: 2, y: 1 },
                interactable: true,
                buff: { craftingSpeed: 0.1 }
            },
            alchemy_lab: {
                id: 'alchemy_lab',
                name: 'Laboratório de Alquimia',
                icon: '⚗️',
                category: 'crafting',
                cost: 2000,
                size: { x: 3, y: 2 },
                interactable: true,
                buff: { alchemyBonus: 0.15 },
                rarity: 'rare'
            },
            
            // Decorations
            potted_plant: {
                id: 'potted_plant',
                name: 'Planta em Vaso',
                icon: '🪴',
                category: 'decoration',
                cost: 50,
                size: { x: 1, y: 1 }
            },
            painting: {
                id: 'painting',
                name: 'Pintura Decorativa',
                icon: '🖼️',
                category: 'decoration',
                cost: 200,
                size: { x: 1, y: 1 },
                wall: true
            },
            tapestry: {
                id: 'tapestry',
                name: 'Tapeçaria',
                icon: '🏴',
                category: 'decoration',
                cost: 500,
                size: { x: 2, y: 1 },
                wall: true
            },
            chandelier: {
                id: 'chandelier',
                name: 'Lustre',
                icon: '💡',
                category: 'lighting',
                cost: 800,
                size: { x: 1, y: 1 },
                ceiling: true
            },
            fireplace: {
                id: 'fireplace',
                name: 'Lareira',
                icon: '🔥',
                category: 'feature',
                cost: 1000,
                size: { x: 2, y: 1 },
                wall: true,
                interactable: true,
                buff: { comfort: 10 }
            },
            
            // Beds
            simple_bed: {
                id: 'simple_bed',
                name: 'Cama Simples',
                icon: '🛏️',
                category: 'bed',
                cost: 150,
                size: { x: 2, y: 1 },
                interactable: true,
                buff: { restedXP: 0.05 }
            },
            fancy_bed: {
                id: 'fancy_bed',
                name: 'Cama de Luxo',
                icon: '🛌',
                category: 'bed',
                cost: 800,
                size: { x: 2, y: 2 },
                interactable: true,
                buff: { restedXP: 0.1, comfort: 5 }
            },
            
            // Special
            trophy_rack: {
                id: 'trophy_rack',
                name: 'Suporte de Troféus',
                icon: '🏆',
                category: 'display',
                cost: 500,
                size: { x: 2, y: 1 },
                interactable: true
            },
            guild_banner: {
                id: 'guild_banner',
                name: 'Estandarte de Guilda',
                icon: '🚩',
                category: 'decoration',
                cost: 1000,
                size: { x: 1, y: 2 },
                wall: true,
                interactable: true,
                requires: 'guild_member'
            }
        };
    }
    
    setupEventHandlers() {
        this.server.on('housing:get_available', (socket) => {
            this.handleGetAvailableHomes(socket);
        });
        
        this.server.on('housing:buy', (socket, data) => {
            this.handleBuyHome(socket, data);
        });
        
        this.server.on('housing:enter', (socket) => {
            this.handleEnterHome(socket);
        });
        
        this.server.on('housing:visit', (socket, data) => {
            this.handleVisitHome(socket, data);
        });
        
        this.server.on('housing:leave', (socket) => {
            this.handleLeaveHome(socket);
        });
        
        this.server.on('housing:place_furniture', (socket, data) => {
            this.handlePlaceFurniture(socket, data);
        });
        
        this.server.on('housing:remove_furniture', (socket, data) => {
            this.handleRemoveFurniture(socket, data);
        });
        
        this.server.on('housing:get_storage', (socket) => {
            this.handleGetStorage(socket);
        });
        
        this.server.on('housing:deposit', (socket, data) => {
            this.handleDepositToStorage(socket, data);
        });
        
        this.server.on('housing:withdraw', (socket, data) => {
            this.handleWithdrawFromStorage(socket, data);
        });
        
        this.server.on('housing:set_permissions', (socket, data) => {
            this.handleSetPermissions(socket, data);
        });
        
        this.server.on('housing:pay_maintenance', (socket) => {
            this.handlePayMaintenance(socket);
        });
    }
    
    // ===== HOME OPERATIONS =====
    
    handleGetAvailableHomes(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const playerHome = this.playerHomes.get(socket.playerId);
        
        const available = Object.values(this.houseTemplates)
            .filter(home => this.checkRequirements(player, home.unlockRequirement))
            .map(home => ({
                ...home,
                owned: playerHome?.templateId === home.id,
                canAfford: (player.gold || 0) >= home.cost
            }));
        
        socket.emit('housing:available_list', {
            homes: available,
            currentHome: playerHome || null
        });
    }
    
    handleBuyHome(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { templateId } = data;
        const template = this.houseTemplates[templateId];
        
        if (!template) {
            socket.emit('housing:error', { message: 'Modelo de casa não encontrado!' });
            return;
        }
        
        // Check if already has home
        if (this.playerHomes.has(socket.playerId)) {
            socket.emit('housing:error', { message: 'Você já possui uma casa! Venda-a primeiro.' });
            return;
        }
        
        // Check requirements
        if (!this.checkRequirements(player, template.unlockRequirement)) {
            socket.emit('housing:error', { message: 'Requisitos não atendidos!' });
            return;
        }
        
        // Check gold
        if ((player.gold || 0) < template.cost) {
            socket.emit('housing:error', { message: `Ouro insuficiente! Necessário: ${template.cost}g` });
            return;
        }
        
        // Deduct gold
        player.gold -= template.cost;
        
        // Create home
        const home = {
            ownerId: socket.playerId,
            ownerName: player.name,
            templateId: template.id,
            template: template,
            instanceId: `home_${socket.playerId}_${Date.now()}`,
            furniture: [],
            storage: [],
            permissions: {
                friends: true,
                guild: true,
                public: false
            },
            purchasedAt: Date.now(),
            lastMaintenance: Date.now(),
            maintenanceDebt: 0,
            visitors: []
        };
        
        this.playerHomes.set(socket.playerId, home);
        
        socket.emit('housing:purchased', { home });
        
        console.log(`[HousingManager] ${player.name} comprou ${template.name}`);
    }
    
    handleEnterHome(socket) {
        const home = this.playerHomes.get(socket.playerId);
        
        if (!home) {
            socket.emit('housing:error', { message: 'Você não possui uma casa!' });
            return;
        }
        
        // Create or get instance
        let instance = this.activeInstances.get(home.instanceId);
        if (!instance) {
            instance = {
                instanceId: home.instanceId,
                ownerId: socket.playerId,
                template: home.template,
                furniture: [...home.furniture],
                occupants: [],
                createdAt: Date.now()
            };
            this.activeInstances.set(home.instanceId, instance);
        }
        
        // Add player to instance
        const player = this.server.players.get(socket.playerId);
        if (player) {
            player.currentInstance = home.instanceId;
            player.isHomeOwner = true;
        }
        
        instance.occupants.push({
            playerId: socket.playerId,
            name: player?.name,
            isOwner: true,
            joinedAt: Date.now()
        });
        
        socket.emit('housing:entered', {
            instanceId: home.instanceId,
            template: home.template,
            furniture: instance.furniture,
            isOwner: true,
            buffs: this.calculateHomeBuffs(home)
        });
        
        socket.join(home.instanceId);
    }
    
    handleVisitHome(socket, data) {
        const { ownerId } = data;
        const home = this.playerHomes.get(ownerId);
        const visitor = this.server.players.get(socket.playerId);
        
        if (!home || !visitor) {
            socket.emit('housing:error', { message: 'Casa não encontrada!' });
            return;
        }
        
        // Check permissions
        const canVisit = this.checkVisitPermission(socket.playerId, home, visitor);
        if (!canVisit) {
            socket.emit('housing:error', { message: 'Você não tem permissão para visitar esta casa!' });
            return;
        }
        
        // Check maintenance
        if (home.maintenanceDebt > 1000) {
            socket.emit('housing:error', { message: 'A casa está em manutenção. Visita não permitida.' });
            return;
        }
        
        // Check visitor limit
        const instance = this.activeInstances.get(home.instanceId);
        if (instance && instance.occupants.length >= this.config.maxVisitors) {
            socket.emit('housing:error', { message: 'Casa cheia! Tente novamente mais tarde.' });
            return;
        }
        
        // Notify owner
        const ownerSocket = this.getSocketByPlayerId(ownerId);
        if (ownerSocket) {
            ownerSocket.emit('housing:visitor_arrived', {
                visitorId: socket.playerId,
                visitorName: visitor.name
            });
        }
        
        // Add to instance
        visitor.currentInstance = home.instanceId;
        visitor.isHomeOwner = false;
        
        if (instance) {
            instance.occupants.push({
                playerId: socket.playerId,
                name: visitor.name,
                isOwner: false,
                joinedAt: Date.now()
            });
        }
        
        socket.emit('housing:entered', {
            instanceId: home.instanceId,
            template: home.template,
            furniture: instance?.furniture || home.furniture,
            isOwner: false,
            ownerName: home.ownerName
        });
        
        socket.join(home.instanceId);
    }
    
    handleLeaveHome(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player?.currentInstance) return;
        
        const instance = this.activeInstances.get(player.currentInstance);
        if (instance) {
            instance.occupants = instance.occupants.filter(o => o.playerId !== socket.playerId);
            
            // Notify others
            this.io.to(player.currentInstance).emit('housing:player_left', {
                playerId: socket.playerId,
                name: player.name
            });
        }
        
        socket.leave(player.currentInstance);
        player.currentInstance = null;
        player.isHomeOwner = false;
        
        socket.emit('housing:left');
    }
    
    // ===== FURNITURE OPERATIONS =====
    
    handlePlaceFurniture(socket, data) {
        const { furnitureId, position, rotation } = data;
        const home = this.playerHomes.get(socket.playerId);
        
        if (!home) {
            socket.emit('housing:error', { message: 'Você não possui uma casa!' });
            return;
        }
        
        // Check furniture limit
        if (home.furniture.length >= home.template.maxFurniture) {
            socket.emit('housing:error', { message: 'Limite de móveis atingido!' });
            return;
        }
        
        const furnitureDef = this.furnitureDatabase[furnitureId];
        if (!furnitureDef) {
            socket.emit('housing:error', { message: 'Móvel não encontrado!' });
            return;
        }
        
        // Check if player owns this furniture (would check inventory)
        // For now, assume they can place if they have it
        
        const furniture = {
            id: `${furnitureId}_${Date.now()}`,
            furnitureId,
            name: furnitureDef.name,
            icon: furnitureDef.icon,
            category: furnitureDef.category,
            position,
            rotation: rotation || 0,
            placedAt: Date.now()
        };
        
        home.furniture.push(furniture);
        
        // Update instance if active
        const instance = this.activeInstances.get(home.instanceId);
        if (instance) {
            instance.furniture.push(furniture);
            this.io.to(home.instanceId).emit('housing:furniture_placed', { furniture });
        }
        
        socket.emit('housing:furniture_added', { furniture });
    }
    
    handleRemoveFurniture(socket, data) {
        const { furnitureInstanceId } = data;
        const home = this.playerHomes.get(socket.playerId);
        
        if (!home) return;
        
        const index = home.furniture.findIndex(f => f.id === furnitureInstanceId);
        if (index === -1) {
            socket.emit('housing:error', { message: 'Móvel não encontrado!' });
            return;
        }
        
        const removed = home.furniture.splice(index, 1)[0];
        
        // Update instance
        const instance = this.activeInstances.get(home.instanceId);
        if (instance) {
            const instIndex = instance.furniture.findIndex(f => f.id === furnitureInstanceId);
            if (instIndex !== -1) {
                instance.furniture.splice(instIndex, 1);
            }
            this.io.to(home.instanceId).emit('housing:furniture_removed', { furnitureId: furnitureInstanceId });
        }
        
        socket.emit('housing:furniture_removed_confirm', { furniture: removed });
    }
    
    // ===== STORAGE OPERATIONS =====
    
    handleGetStorage(socket) {
        const home = this.playerHomes.get(socket.playerId);
        if (!home) {
            socket.emit('housing:error', { message: 'Você não possui uma casa!' });
            return;
        }
        
        socket.emit('housing:storage', {
            items: home.storage,
            maxSlots: home.template.storageSlots
        });
    }
    
    handleDepositToStorage(socket, data) {
        const { item, quantity } = data;
        const home = this.playerHomes.get(socket.playerId);
        
        if (!home) return;
        
        if (home.storage.length >= home.template.storageSlots) {
            socket.emit('housing:error', { message: 'Armazenamento cheio!' });
            return;
        }
        
        home.storage.push({
            itemId: item.id,
            name: item.name,
            quantity,
            icon: item.icon,
            depositedAt: Date.now()
        });
        
        socket.emit('housing:deposited', { item, quantity });
        socket.emit('housing:storage', {
            items: home.storage,
            maxSlots: home.template.storageSlots
        });
    }
    
    handleWithdrawFromStorage(socket, data) {
        const { slotIndex, quantity } = data;
        const home = this.playerHomes.get(socket.playerId);
        
        if (!home) return;
        
        if (slotIndex < 0 || slotIndex >= home.storage.length) {
            socket.emit('housing:error', { message: 'Item não encontrado!' });
            return;
        }
        
        const item = home.storage[slotIndex];
        const withdrawQty = Math.min(quantity || item.quantity, item.quantity);
        
        if (withdrawQty >= item.quantity) {
            home.storage.splice(slotIndex, 1);
        } else {
            item.quantity -= withdrawQty;
        }
        
        socket.emit('housing:withdrawn', { item, quantity: withdrawQty });
        socket.emit('housing:storage', {
            items: home.storage,
            maxSlots: home.template.storageSlots
        });
    }
    
    // ===== UTILITIES =====
    
    checkRequirements(player, requirements) {
        if (!requirements) return true;
        
        if (requirements.level && player.level < requirements.level) {
            return false;
        }
        
        if (requirements.achievement) {
            // Would check achievement manager
        }
        
        if (requirements.reputation) {
            // Would check reputation manager
        }
        
        return true;
    }
    
    checkVisitPermission(visitorId, home, visitor) {
        if (home.permissions.public) return true;
        if (home.permissions.friends) {
            // Would check friend list
        }
        if (home.permissions.guild && visitor.guildId) {
            // Would check if same guild
        }
        return false;
    }
    
    calculateHomeBuffs(home) {
        const buffs = {};
        
        for (const furniture of home.furniture) {
            const def = this.furnitureDatabase[furniture.furnitureId];
            if (def?.buff) {
                for (const [key, value] of Object.entries(def.buff)) {
                    buffs[key] = (buffs[key] || 0) + value;
                }
            }
        }
        
        return buffs;
    }
    
    startMaintenanceLoop() {
        // Check maintenance every hour
        setInterval(() => {
            this.processMaintenance();
        }, 3600000);
    }
    
    processMaintenance() {
        const now = Date.now();
        
        for (const [playerId, home] of this.playerHomes) {
            const daysSincePayment = Math.floor((now - home.lastMaintenance) / 86400000);
            
            if (daysSincePayment > 0) {
                const debt = daysSincePayment * home.template.maintenance;
                home.maintenanceDebt += debt;
                home.lastMaintenance = now;
                
                // Notify player
                const socket = this.getSocketByPlayerId(playerId);
                if (socket && home.maintenanceDebt > 0) {
                    socket.emit('housing:maintenance_due', {
                        debt: home.maintenanceDebt,
                        dailyCost: home.template.maintenance
                    });
                }
            }
        }
    }
    
    handlePayMaintenance(socket) {
        const home = this.playerHomes.get(socket.playerId);
        const player = this.server.players.get(socket.playerId);
        
        if (!home || home.maintenanceDebt <= 0) {
            socket.emit('housing:error', { message: 'Não há manutenção pendente!' });
            return;
        }
        
        if ((player.gold || 0) < home.maintenanceDebt) {
            socket.emit('housing:error', { message: `Ouro insuficiente! Necessário: ${home.maintenanceDebt}g` });
            return;
        }
        
        player.gold -= home.maintenanceDebt;
        home.maintenanceDebt = 0;
        
        socket.emit('housing:maintenance_paid');
    }
    
    handleSetPermissions(socket, data) {
        const home = this.playerHomes.get(socket.playerId);
        if (!home) return;
        
        home.permissions = { ...home.permissions, ...data };
        
        socket.emit('housing:permissions_updated', home.permissions);
    }
    
    getSocketByPlayerId(playerId) {
        // Placeholder
        return null;
    }
    
    // ===== API =====
    
    getPlayerHome(playerId) {
        return this.playerHomes.get(playerId);
    }
    
    getInstance(instanceId) {
        return this.activeInstances.get(instanceId);
    }
}

module.exports = HousingManager;
