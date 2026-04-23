/**
 * BankManager - Sistema de Banco e Guild Bank
 * 
 * Features:
 * - Contas bancárias individuais (slots limitados)
 * - Guild Bank compartilhado
 * - Sistema de permissões (depositar/sacar/ver)
 * - Taxas de transação
 * - Logs de atividades
 * - Upgrade de slots
 */

class BankManager {
    constructor(server) {
        this.server = server;
        this.io = server.io;
        
        // Storage
        this.playerBanks = new Map(); // playerId -> bank data
        this.guildBanks = new Map(); // guildId -> guild bank data
        this.transactions = []; // Transaction log
        
        // Configurações
        this.config = {
            // Player bank
            baseSlots: 20,
            maxSlots: 200,
            upgradeCostPerSlot: 100, // gold per slot
            
            // Guild bank
            guildBaseSlots: 50,
            guildMaxSlots: 500,
            guildUpgradeCostPerSlot: 500,
            
            // Transaction fees
            depositFee: 0, // free
            withdrawFee: 0, // free
            transferFee: 0.02, // 2% fee for player-to-player transfers
            
            // Permissions
            defaultGuildPermissions: {
                leader: ['deposit', 'withdraw', 'view', 'manage'],
                officer: ['deposit', 'withdraw', 'view'],
                member: ['deposit', 'view']
            }
        };
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        console.log('[BankManager] Sistema bancário inicializado');
    }
    
    setupEventHandlers() {
        // Player bank operations
        this.server.on('bank:open', (socket) => {
            this.handleOpenBank(socket);
        });
        
        this.server.on('bank:deposit', (socket, data) => {
            this.handleDeposit(socket, data);
        });
        
        this.server.on('bank:withdraw', (socket, data) => {
            this.handleWithdraw(socket, data);
        });
        
        this.server.on('bank:move', (socket, data) => {
            this.handleMoveItem(socket, data);
        });
        
        this.server.on('bank:upgrade', (socket) => {
            this.handleUpgradeSlots(socket);
        });
        
        // Guild bank operations
        this.server.on('guildbank:open', (socket) => {
            this.handleOpenGuildBank(socket);
        });
        
        this.server.on('guildbank:deposit', (socket, data) => {
            this.handleGuildDeposit(socket, data);
        });
        
        this.server.on('guildbank:withdraw', (socket, data) => {
            this.handleGuildWithdraw(socket, data);
        });
        
        this.server.on('guildbank:setpermissions', (socket, data) => {
            this.handleSetPermissions(socket, data);
        });
        
        this.server.on('guildbank:upgrade', (socket) => {
            this.handleUpgradeGuildSlots(socket);
        });
        
        // Transfers
        this.server.on('bank:transfer', (socket, data) => {
            this.handleTransfer(socket, data);
        });
        
        // History/logs
        this.server.on('bank:history', (socket) => {
            this.handleGetHistory(socket);
        });
    }
    
    // ===== PLAYER BANK =====
    
    getOrCreatePlayerBank(playerId) {
        if (!this.playerBanks.has(playerId)) {
            this.playerBanks.set(playerId, {
                playerId: playerId,
                slots: this.config.baseSlots,
                items: [], // Array of { slot, itemId, quantity, data }
                gold: 0,
                createdAt: Date.now(),
                lastAccess: Date.now(),
                upgradeCount: 0
            });
        }
        
        const bank = this.playerBanks.get(playerId);
        bank.lastAccess = Date.now();
        return bank;
    }
    
    handleOpenBank(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const bank = this.getOrCreatePlayerBank(socket.playerId);
        
        socket.emit('bank:opened', {
            slots: bank.slots,
            usedSlots: bank.items.length,
            items: bank.items,
            gold: bank.gold,
            canUpgrade: bank.slots < this.config.maxSlots,
            upgradeCost: (bank.slots + 10) * this.config.upgradeCostPerSlot,
            maxSlots: this.config.maxSlots
        });
    }
    
    handleDeposit(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { item, quantity, slotIndex } = data;
        const bank = this.getOrCreatePlayerBank(socket.playerId);
        
        // Check if bank has space
        if (bank.items.length >= bank.slots) {
            socket.emit('bank:error', { message: 'Banco cheio!' });
            return;
        }
        
        // Check if player has the item
        if (!this.playerHasItem(player, item, quantity)) {
            socket.emit('bank:error', { message: 'Item não encontrado no inventário!' });
            return;
        }
        
        // Remove from player inventory
        this.removeItemFromPlayer(player, item, quantity);
        
        // Add to bank
        const bankSlot = slotIndex !== undefined ? slotIndex : this.findFreeSlot(bank);
        if (bankSlot === -1) {
            socket.emit('bank:error', { message: 'Nenhum slot disponível!' });
            return;
        }
        
        bank.items.push({
            slot: bankSlot,
            itemId: item.id,
            name: item.name,
            quantity: quantity,
            icon: item.icon,
            rarity: item.rarity,
            data: item
        });
        
        // Log transaction
        this.logTransaction({
            type: 'deposit',
            playerId: socket.playerId,
            playerName: player.name,
            item: item.name,
            quantity: quantity,
            timestamp: Date.now()
        });
        
        socket.emit('bank:deposit_success', {
            slot: bankSlot,
            item: item,
            quantity: quantity
        });
        
        // Update bank UI
        this.handleOpenBank(socket);
        
        console.log(`[BankManager] ${player.name} depositou ${quantity}x ${item.name}`);
    }
    
    handleWithdraw(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { slotIndex, quantity } = data;
        const bank = this.getOrCreatePlayerBank(socket.playerId);
        
        // Find item in bank
        const itemIndex = bank.items.findIndex(i => i.slot === slotIndex);
        if (itemIndex === -1) {
            socket.emit('bank:error', { message: 'Item não encontrado no banco!' });
            return;
        }
        
        const bankItem = bank.items[itemIndex];
        const withdrawQty = Math.min(quantity || bankItem.quantity, bankItem.quantity);
        
        // Check player inventory space
        if (!this.playerHasInventorySpace(player, bankItem.data, withdrawQty)) {
            socket.emit('bank:error', { message: 'Inventário cheio!' });
            return;
        }
        
        // Add to player inventory
        this.addItemToPlayer(player, bankItem.data, withdrawQty);
        
        // Remove from bank
        if (withdrawQty >= bankItem.quantity) {
            bank.items.splice(itemIndex, 1);
        } else {
            bankItem.quantity -= withdrawQty;
        }
        
        // Log transaction
        this.logTransaction({
            type: 'withdraw',
            playerId: socket.playerId,
            playerName: player.name,
            item: bankItem.name,
            quantity: withdrawQty,
            timestamp: Date.now()
        });
        
        socket.emit('bank:withdraw_success', {
            item: bankItem.data,
            quantity: withdrawQty
        });
        
        // Update bank UI
        this.handleOpenBank(socket);
        
        console.log(`[BankManager] ${player.name} retirou ${withdrawQty}x ${bankItem.name}`);
    }
    
    handleMoveItem(socket, data) {
        const { fromSlot, toSlot } = data;
        const bank = this.getOrCreatePlayerBank(socket.playerId);
        
        const itemIndex = bank.items.findIndex(i => i.slot === fromSlot);
        if (itemIndex === -1) return;
        
        // Check if target slot is occupied
        const targetOccupied = bank.items.findIndex(i => i.slot === toSlot);
        if (targetOccupied !== -1) {
            // Swap items
            const temp = bank.items[itemIndex].slot;
            bank.items[itemIndex].slot = bank.items[targetOccupied].slot;
            bank.items[targetOccupied].slot = temp;
        } else {
            // Just move
            bank.items[itemIndex].slot = toSlot;
        }
        
        socket.emit('bank:move_success', { fromSlot, toSlot });
        this.handleOpenBank(socket);
    }
    
    handleUpgradeSlots(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const bank = this.getOrCreatePlayerBank(socket.playerId);
        
        // Check max slots
        if (bank.slots >= this.config.maxSlots) {
            socket.emit('bank:error', { message: 'Máximo de slots atingido!' });
            return;
        }
        
        // Calculate cost
        const newSlots = Math.min(bank.slots + 10, this.config.maxSlots);
        const cost = (newSlots - bank.slots) * this.config.upgradeCostPerSlot;
        
        // Check gold
        if ((player.gold || 0) < cost) {
            socket.emit('bank:error', { message: `Ouro insuficiente! Necessário: ${cost}` });
            return;
        }
        
        // Deduct gold
        player.gold -= cost;
        bank.slots = newSlots;
        bank.upgradeCount++;
        
        socket.emit('bank:upgrade_success', {
            newSlots: bank.slots,
            cost: cost
        });
        
        this.handleOpenBank(socket);
        
        console.log(`[BankManager] ${player.name} upgradeou banco para ${bank.slots} slots`);
    }
    
    // ===== GUILD BANK =====
    
    getOrCreateGuildBank(guildId) {
        if (!this.guildBanks.has(guildId)) {
            this.guildBanks.set(guildId, {
                guildId: guildId,
                slots: this.config.guildBaseSlots,
                items: [],
                gold: 0,
                permissions: { ...this.config.defaultGuildPermissions },
                logs: [],
                createdAt: Date.now(),
                upgradeCount: 0
            });
        }
        
        return this.guildBanks.get(guildId);
    }
    
    handleOpenGuildBank(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        // Check if player is in a guild
        const guildId = player.guildId;
        if (!guildId) {
            socket.emit('guildbank:error', { message: 'Você não está em uma guilda!' });
            return;
        }
        
        const bank = this.getOrCreateGuildBank(guildId);
        
        // Check permissions
        const permission = this.getGuildPermission(guildId, socket.playerId);
        if (!permission.includes('view')) {
            socket.emit('guildbank:error', { message: 'Sem permissão para ver o banco da guilda!' });
            return;
        }
        
        socket.emit('guildbank:opened', {
            slots: bank.slots,
            usedSlots: bank.items.length,
            items: bank.items,
            gold: bank.gold,
            permissions: permission,
            canUpgrade: permission.includes('manage') && bank.slots < this.config.guildMaxSlots,
            upgradeCost: (bank.slots + 20) * this.config.guildUpgradeCostPerSlot,
            logs: bank.logs.slice(-20) // Last 20 entries
        });
    }
    
    handleGuildDeposit(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const guildId = player.guildId;
        if (!guildId) {
            socket.emit('guildbank:error', { message: 'Você não está em uma guilda!' });
            return;
        }
        
        const { item, quantity, slotIndex } = data;
        const bank = this.getOrCreateGuildBank(guildId);
        
        // Check permissions
        const permission = this.getGuildPermission(guildId, socket.playerId);
        if (!permission.includes('deposit')) {
            socket.emit('guildbank:error', { message: 'Sem permissão para depositar!' });
            return;
        }
        
        // Check space
        if (bank.items.length >= bank.slots) {
            socket.emit('guildbank:error', { message: 'Banco da guilda cheio!' });
            return;
        }
        
        // Check player has item
        if (!this.playerHasItem(player, item, quantity)) {
            socket.emit('guildbank:error', { message: 'Item não encontrado!' });
            return;
        }
        
        // Remove from player
        this.removeItemFromPlayer(player, item, quantity);
        
        // Add to guild bank
        const bankSlot = slotIndex !== undefined ? slotIndex : this.findFreeSlot(bank);
        bank.items.push({
            slot: bankSlot,
            itemId: item.id,
            name: item.name,
            quantity: quantity,
            icon: item.icon,
            rarity: item.rarity,
            depositedBy: player.name,
            depositedAt: Date.now(),
            data: item
        });
        
        // Log
        bank.logs.push({
            action: 'deposit',
            player: player.name,
            item: item.name,
            quantity: quantity,
            timestamp: Date.now()
        });
        
        // Broadcast to guild
        this.io.to(`guild:${guildId}`).emit('guildbank:updated', {
            depositedBy: player.name,
            item: item.name,
            quantity: quantity
        });
        
        socket.emit('guildbank:deposit_success');
        this.handleOpenGuildBank(socket);
        
        console.log(`[BankManager] ${player.name} depositou ${quantity}x ${item.name} no banco da guilda ${guildId}`);
    }
    
    handleGuildWithdraw(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const guildId = player.guildId;
        if (!guildId) {
            socket.emit('guildbank:error', { message: 'Você não está em uma guilda!' });
            return;
        }
        
        const { slotIndex, quantity } = data;
        const bank = this.getOrCreateGuildBank(guildId);
        
        // Check permissions
        const permission = this.getGuildPermission(guildId, socket.playerId);
        if (!permission.includes('withdraw')) {
            socket.emit('guildbank:error', { message: 'Sem permissão para retirar!' });
            return;
        }
        
        const itemIndex = bank.items.findIndex(i => i.slot === slotIndex);
        if (itemIndex === -1) {
            socket.emit('guildbank:error', { message: 'Item não encontrado!' });
            return;
        }
        
        const bankItem = bank.items[itemIndex];
        const withdrawQty = Math.min(quantity || bankItem.quantity, bankItem.quantity);
        
        // Check inventory space
        if (!this.playerHasInventorySpace(player, bankItem.data, withdrawQty)) {
            socket.emit('guildbank:error', { message: 'Inventário cheio!' });
            return;
        }
        
        // Add to player
        this.addItemToPlayer(player, bankItem.data, withdrawQty);
        
        // Remove from bank
        if (withdrawQty >= bankItem.quantity) {
            bank.items.splice(itemIndex, 1);
        } else {
            bankItem.quantity -= withdrawQty;
        }
        
        // Log
        bank.logs.push({
            action: 'withdraw',
            player: player.name,
            item: bankItem.name,
            quantity: withdrawQty,
            timestamp: Date.now()
        });
        
        // Broadcast
        this.io.to(`guild:${guildId}`).emit('guildbank:updated', {
            withdrawnBy: player.name,
            item: bankItem.name,
            quantity: withdrawQty
        });
        
        socket.emit('guildbank:withdraw_success');
        this.handleOpenGuildBank(socket);
        
        console.log(`[BankManager] ${player.name} retirou ${withdrawQty}x ${bankItem.name} do banco da guilda`);
    }
    
    handleSetPermissions(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const guildId = player.guildId;
        if (!guildId) return;
        
        // Check if leader
        const guild = this.server.systems.guildSystem?.getGuild?.(guildId);
        if (!guild || guild.leader !== socket.playerId) {
            socket.emit('guildbank:error', { message: 'Apenas o líder pode alterar permissões!' });
            return;
        }
        
        const bank = this.getOrCreateGuildBank(guildId);
        bank.permissions[data.role] = data.permissions;
        
        socket.emit('guildbank:permissions_updated', bank.permissions);
    }
    
    handleUpgradeGuildSlots(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const guildId = player.guildId;
        if (!guildId) return;
        
        // Check if leader/officer
        const permission = this.getGuildPermission(guildId, socket.playerId);
        if (!permission.includes('manage')) {
            socket.emit('guildbank:error', { message: 'Sem permissão!' });
            return;
        }
        
        const bank = this.getOrCreateGuildBank(guildId);
        
        if (bank.slots >= this.config.guildMaxSlots) {
            socket.emit('guildbank:error', { message: 'Máximo atingido!' });
            return;
        }
        
        // Use guild gold
        const newSlots = Math.min(bank.slots + 20, this.config.guildMaxSlots);
        const cost = (newSlots - bank.slots) * this.config.guildUpgradeCostPerSlot;
        
        if (bank.gold < cost) {
            socket.emit('guildbank:error', { message: `Ouro insuficiente no banco! Necessário: ${cost}` });
            return;
        }
        
        bank.gold -= cost;
        bank.slots = newSlots;
        bank.upgradeCount++;
        
        bank.logs.push({
            action: 'upgrade',
            player: player.name,
            newSlots: newSlots,
            cost: cost,
            timestamp: Date.now()
        });
        
        socket.emit('guildbank:upgrade_success', { newSlots, cost });
        this.handleOpenGuildBank(socket);
        
        console.log(`[BankManager] Banco da guilda ${guildId} upgradeado para ${bank.slots} slots`);
    }
    
    // ===== UTILITIES =====
    
    getGuildPermission(guildId, playerId) {
        const guild = this.server.systems.guildSystem?.getGuild?.(guildId);
        if (!guild) return [];
        
        const bank = this.getOrCreateGuildBank(guildId);
        
        if (guild.leader === playerId) {
            return bank.permissions.leader;
        }
        
        const member = guild.members?.find(m => m.id === playerId);
        if (!member) return [];
        
        if (member.role === 'officer') {
            return bank.permissions.officer;
        }
        
        return bank.permissions.member;
    }
    
    findFreeSlot(bank) {
        const usedSlots = new Set(bank.items.map(i => i.slot));
        for (let i = 0; i < bank.slots; i++) {
            if (!usedSlots.has(i)) return i;
        }
        return -1;
    }
    
    playerHasItem(player, item, quantity) {
        // Placeholder - integrate with your inventory system
        return true;
    }
    
    removeItemFromPlayer(player, item, quantity) {
        // Placeholder - integrate with your inventory system
    }
    
    addItemToPlayer(player, item, quantity) {
        // Placeholder - integrate with your inventory system
    }
    
    playerHasInventorySpace(player, item, quantity) {
        // Placeholder - integrate with your inventory system
        return true;
    }
    
    logTransaction(transaction) {
        this.transactions.push(transaction);
        
        // Keep only last 1000 transactions
        if (this.transactions.length > 1000) {
            this.transactions.shift();
        }
    }
    
    handleGetHistory(socket) {
        const playerHistory = this.transactions.filter(
            t => t.playerId === socket.playerId
        ).slice(-50);
        
        socket.emit('bank:history', playerHistory);
    }
    
    // ===== TRANSFERS =====
    
    handleTransfer(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { targetPlayerId, item, quantity } = data;
        
        // Check if player has item
        if (!this.playerHasItem(player, item, quantity)) {
            socket.emit('bank:error', { message: 'Item não encontrado!' });
            return;
        }
        
        // Calculate fee
        const fee = Math.floor(item.value * quantity * this.config.transferFee);
        
        // Check if player can pay fee
        if ((player.gold || 0) < fee) {
            socket.emit('bank:error', { message: `Ouro insuficiente para taxa (${fee})!` });
            return;
        }
        
        // Deduct fee
        player.gold -= fee;
        
        // Remove from sender
        this.removeItemFromPlayer(player, item, quantity);
        
        // Add to target
        const targetPlayer = this.server.players.get(targetPlayerId);
        if (targetPlayer) {
            this.addItemToPlayer(targetPlayer, item, quantity);
            
            // Notify target
            const targetSocket = this.getSocketByPlayerId(targetPlayerId);
            if (targetSocket) {
                targetSocket.emit('bank:received_transfer', {
                    from: player.name,
                    item: item.name,
                    quantity: quantity
                });
            }
        } else {
            // Store in target's bank
            const targetBank = this.getOrCreatePlayerBank(targetPlayerId);
            targetBank.items.push({
                slot: this.findFreeSlot(targetBank),
                itemId: item.id,
                name: item.name,
                quantity: quantity,
                icon: item.icon,
                rarity: item.rarity,
                data: item,
                fromTransfer: player.name
            });
        }
        
        socket.emit('bank:transfer_success', {
            to: targetPlayerId,
            item: item.name,
            quantity: quantity,
            fee: fee
        });
        
        this.logTransaction({
            type: 'transfer',
            playerId: socket.playerId,
            playerName: player.name,
            targetId: targetPlayerId,
            item: item.name,
            quantity: quantity,
            fee: fee,
            timestamp: Date.now()
        });
    }
    
    getSocketByPlayerId(playerId) {
        // Placeholder - implement based on your socket.io setup
        return null;
    }
    
    // ===== API =====
    
    getPlayerBank(playerId) {
        return this.playerBanks.get(playerId);
    }
    
    getGuildBank(guildId) {
        return this.guildBanks.get(guildId);
    }
    
    getBankStats() {
        return {
            playerBanks: this.playerBanks.size,
            guildBanks: this.guildBanks.size,
            totalTransactions: this.transactions.length
        };
    }
}

module.exports = BankManager;
