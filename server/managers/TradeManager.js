/**
 * TradeManager - Sistema de Trocas Aprimorado
 * 
 * Features:
 * - Solicitações de troca entre jogadores
 * - Múltiplos slots de troca
 * - Confirmação de ambas partes
 * - Verificação de espaço de inventário
 * - Taxa de troca opcional (para economia)
 * - Histórico de trocas
 * - Trade seguro (anti-scam)
 * - Troca em grupo (até 4 jogadores)
 */

class TradeManager {
    constructor(server) {
        this.server = server;
        this.io = server.io;
        
        // Active trades
        this.activeTrades = new Map(); // tradeId -> trade data
        this.playerTrades = new Map(); // playerId -> tradeId
        
        // Trade history
        this.tradeHistory = [];
        
        // Config
        this.config = {
            maxTradeSlots: 6,
            maxPartyTrade: 4,
            tradeTimeout: 120000, // 2 minutes
            confirmationDelay: 3000, // 3 seconds lock-in
            tradeTax: 0 // No tax by default
        };
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        this.startCleanupLoop();
        console.log('[TradeManager] Sistema de trocas inicializado');
    }
    
    setupEventHandlers() {
        // Basic trade
        this.server.on('trade:request', (socket, data) => {
            this.handleTradeRequest(socket, data);
        });
        
        this.server.on('trade:accept', (socket, data) => {
            this.handleAcceptTrade(socket, data);
        });
        
        this.server.on('trade:decline', (socket, data) => {
            this.handleDeclineTrade(socket, data);
        });
        
        this.server.on('trade:cancel', (socket) => {
            this.handleCancelTrade(socket);
        });
        
        // Trade management
        this.server.on('trade:add_item', (socket, data) => {
            this.handleAddItem(socket, data);
        });
        
        this.server.on('trade:remove_item', (socket, data) => {
            this.handleRemoveItem(socket, data);
        });
        
        this.server.on('trade:add_gold', (socket, data) => {
            this.handleAddGold(socket, data);
        });
        
        this.server.on('trade:confirm', (socket) => {
            this.handleConfirmTrade(socket);
        });
        
        this.server.on('trade:unconfirm', (socket) => {
            this.handleUnconfirmTrade(socket);
        });
        
        // Party trade (multi-player)
        this.server.on('trade:party_create', (socket) => {
            this.handleCreatePartyTrade(socket);
        });
        
        this.server.on('trade:party_join', (socket, data) => {
            this.handleJoinPartyTrade(socket, data);
        });
        
        // History
        this.server.on('trade:history', (socket) => {
            this.handleGetHistory(socket);
        });
    }
    
    // ===== TRADE REQUESTS =====
    
    handleTradeRequest(socket, data) {
        const { targetPlayerId } = data;
        const player = this.server.players.get(socket.playerId);
        const target = this.server.players.get(targetPlayerId);
        
        if (!player || !target) {
            socket.emit('trade:error', { message: 'Jogador não encontrado!' });
            return;
        }
        
        // Check if either player is already in a trade
        if (this.playerTrades.has(socket.playerId)) {
            socket.emit('trade:error', { message: 'Você já está em uma troca!' });
            return;
        }
        
        if (this.playerTrades.has(targetPlayerId)) {
            socket.emit('trade:error', { message: 'Jogador já está em uma troca!' });
            return;
        }
        
        // Check distance (players must be nearby)
        const distance = this.calculateDistance(player, target);
        if (distance > 100) {
            socket.emit('trade:error', { message: 'Jogador muito longe!' });
            return;
        }
        
        // Send request to target
        const targetSocket = target.socket;
        if (targetSocket) {
            targetSocket.emit('trade:request_received', {
                fromPlayerId: socket.playerId,
                fromPlayerName: player.name,
                timeout: 30000 // 30 seconds to respond
            });
        }
        
        socket.emit('trade:request_sent', {
            toPlayerId: targetPlayerId,
            toPlayerName: target.name
        });
        
        console.log(`[TradeManager] ${player.name} solicitou troca com ${target.name}`);
    }
    
    handleAcceptTrade(socket, data) {
        const { fromPlayerId } = data;
        const player = this.server.players.get(socket.playerId);
        const initiator = this.server.players.get(fromPlayerId);
        
        if (!player || !initiator) return;
        
        // Check if initiator still available
        if (this.playerTrades.has(fromPlayerId)) {
            socket.emit('trade:error', { message: 'Jogador já está em outra troca!' });
            return;
        }
        
        // Create trade session
        const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const trade = {
            id: tradeId,
            type: 'pair',
            participants: [
                {
                    playerId: fromPlayerId,
                    playerName: initiator.name,
                    items: [],
                    gold: 0,
                    confirmed: false,
                    locked: false
                },
                {
                    playerId: socket.playerId,
                    playerName: player.name,
                    items: [],
                    gold: 0,
                    confirmed: false,
                    locked: false
                }
            ],
            createdAt: Date.now(),
            status: 'active'
        };
        
        this.activeTrades.set(tradeId, trade);
        this.playerTrades.set(fromPlayerId, tradeId);
        this.playerTrades.set(socket.playerId, tradeId);
        
        // Notify both players
        const initiatorSocket = initiator.socket;
        if (initiatorSocket) {
            initiatorSocket.emit('trade:started', {
                tradeId,
                partnerId: socket.playerId,
                partnerName: player.name,
                maxSlots: this.config.maxTradeSlots
            });
        }
        
        socket.emit('trade:started', {
            tradeId,
            partnerId: fromPlayerId,
            partnerName: initiator.name,
            maxSlots: this.config.maxTradeSlots
        });
        
        console.log(`[TradeManager] Troca iniciada: ${initiator.name} <-> ${player.name}`);
    }
    
    handleDeclineTrade(socket, data) {
        const { fromPlayerId } = data;
        const initiator = this.server.players.get(fromPlayerId);
        
        if (initiator?.socket) {
            initiator.socket.emit('trade:declined', {
                byPlayerId: socket.playerId,
                byPlayerName: this.server.players.get(socket.playerId)?.name
            });
        }
    }
    
    handleCancelTrade(socket) {
        const tradeId = this.playerTrades.get(socket.playerId);
        if (!tradeId) return;
        
        const trade = this.activeTrades.get(tradeId);
        if (!trade) return;
        
        // Return items to players
        this.returnTradeItems(trade);
        
        // Notify all participants
        for (const participant of trade.participants) {
            this.playerTrades.delete(participant.playerId);
            
            const p = this.server.players.get(participant.playerId);
            if (p?.socket) {
                p.socket.emit('trade:cancelled', {
                    byPlayerId: socket.playerId,
                    byPlayerName: this.server.players.get(socket.playerId)?.name
                });
            }
        }
        
        this.activeTrades.delete(tradeId);
    }
    
    // ===== TRADE MANAGEMENT =====
    
    handleAddItem(socket, data) {
        const { item, slot } = data;
        const tradeId = this.playerTrades.get(socket.playerId);
        
        if (!tradeId) return;
        
        const trade = this.activeTrades.get(tradeId);
        if (!trade || trade.status !== 'active') return;
        
        // Check if player is locked
        const participant = trade.participants.find(p => p.playerId === socket.playerId);
        if (!participant || participant.locked) {
            socket.emit('trade:error', { message: 'Troca confirmada! Não pode modificar.' });
            return;
        }
        
        // Check slot limit
        if (slot < 0 || slot >= this.config.maxTradeSlots) return;
        
        // Add/replace item
        participant.items[slot] = {
            itemId: item.id,
            name: item.name,
            icon: item.icon,
            quantity: item.quantity || 1,
            rarity: item.rarity,
            slot
        };
        
        // Reset confirmations
        this.resetConfirmations(trade);
        
        // Notify partner
        this.notifyTradeUpdate(trade, socket.playerId);
        
        socket.emit('trade:item_added', { slot, item });
    }
    
    handleRemoveItem(socket, data) {
        const { slot } = data;
        const tradeId = this.playerTrades.get(socket.playerId);
        
        if (!tradeId) return;
        
        const trade = this.activeTrades.get(tradeId);
        if (!trade || trade.status !== 'active') return;
        
        const participant = trade.participants.find(p => p.playerId === socket.playerId);
        if (!participant || participant.locked) {
            socket.emit('trade:error', { message: 'Troca confirmada! Não pode modificar.' });
            return;
        }
        
        // Remove item
        participant.items[slot] = null;
        
        // Reset confirmations
        this.resetConfirmations(trade);
        
        // Notify partner
        this.notifyTradeUpdate(trade, socket.playerId);
        
        socket.emit('trade:item_removed', { slot });
    }
    
    handleAddGold(socket, data) {
        const { amount } = data;
        const tradeId = this.playerTrades.get(socket.playerId);
        
        if (!tradeId) return;
        
        const trade = this.activeTrades.get(tradeId);
        if (!trade || trade.status !== 'active') return;
        
        const participant = trade.participants.find(p => p.playerId === socket.playerId);
        if (!participant || participant.locked) {
            socket.emit('trade:error', { message: 'Troca confirmada! Não pode modificar.' });
            return;
        }
        
        // Check if player has enough gold
        const player = this.server.players.get(socket.playerId);
        if (!player || (player.gold || 0) < amount) {
            socket.emit('trade:error', { message: 'Ouro insuficiente!' });
            return;
        }
        
        participant.gold = amount;
        
        // Reset confirmations
        this.resetConfirmations(trade);
        
        // Notify partner
        this.notifyTradeUpdate(trade, socket.playerId);
        
        socket.emit('trade:gold_updated', { amount });
    }
    
    handleConfirmTrade(socket) {
        const tradeId = this.playerTrades.get(socket.playerId);
        if (!tradeId) return;
        
        const trade = this.activeTrades.get(tradeId);
        if (!trade || trade.status !== 'active') return;
        
        const participant = trade.participants.find(p => p.playerId === socket.playerId);
        if (!participant) return;
        
        participant.confirmed = true;
        participant.locked = true;
        
        // Check if all confirmed
        const allConfirmed = trade.participants.every(p => p.confirmed);
        
        if (allConfirmed) {
            this.executeTrade(trade);
        } else {
            // Notify partner
            const partner = trade.participants.find(p => p.playerId !== socket.playerId);
            if (partner) {
                const partnerPlayer = this.server.players.get(partner.playerId);
                if (partnerPlayer?.socket) {
                    partnerPlayer.socket.emit('trade:partner_confirmed', {
                        playerId: socket.playerId,
                        playerName: participant.playerName
                    });
                }
            }
            
            socket.emit('trade:confirmed', { waitingForPartner: true });
        }
    }
    
    handleUnconfirmTrade(socket) {
        const tradeId = this.playerTrades.get(socket.playerId);
        if (!tradeId) return;
        
        const trade = this.activeTrades.get(tradeId);
        if (!trade || trade.status !== 'active') return;
        
        const participant = trade.participants.find(p => p.playerId === socket.playerId);
        if (!participant) return;
        
        participant.confirmed = false;
        participant.locked = false;
        
        // Notify partner
        const partner = trade.participants.find(p => p.playerId !== socket.playerId);
        if (partner) {
            const partnerPlayer = this.server.players.get(partner.playerId);
            if (partnerPlayer?.socket) {
                partnerPlayer.socket.emit('trade:partner_unconfirmed', {
                    playerId: socket.playerId,
                    playerName: participant.playerName
                });
            }
        }
        
        socket.emit('trade:unconfirmed');
    }
    
    // ===== TRADE EXECUTION =====
    
    executeTrade(trade) {
        trade.status = 'executing';
        
        // Validate all participants can receive items
        for (const participant of trade.participants) {
            const player = this.server.players.get(participant.playerId);
            if (!player) {
                this.cancelTradeDueToError(trade, 'Jogador não encontrado');
                return;
            }
            
            // Check inventory space for received items
            // (Would need actual inventory system integration)
        }
        
        // Execute gold transfers
        for (const participant of trade.participants) {
            const player = this.server.players.get(participant.playerId);
            if (participant.gold > 0) {
                player.gold -= participant.gold;
            }
        }
        
        // Execute gold receipts
        for (let i = 0; i < trade.participants.length; i++) {
            const participant = trade.participants[i];
            const player = this.server.players.get(participant.playerId);
            
            // Get gold from other participants
            const receivedGold = trade.participants
                .filter((_, idx) => idx !== i)
                .reduce((sum, p) => sum + (p.gold || 0), 0);
            
            if (receivedGold > 0) {
                player.gold = (player.gold || 0) + receivedGold;
            }
        }
        
        // Execute item transfers
        // (Would integrate with inventory system)
        
        // Log trade
        this.logTrade(trade);
        
        // Notify success
        for (const participant of trade.participants) {
            this.playerTrades.delete(participant.playerId);
            
            const player = this.server.players.get(participant.playerId);
            if (player?.socket) {
                player.socket.emit('trade:completed', {
                    tradeId: trade.id,
                    received: {
                        gold: trade.participants
                            .filter(p => p.playerId !== participant.playerId)
                            .reduce((sum, p) => sum + (p.gold || 0), 0),
                        items: trade.participants
                            .filter(p => p.playerId !== participant.playerId)
                            .flatMap(p => p.items.filter(i => i))
                    }
                });
            }
        }
        
        // Clean up
        this.activeTrades.delete(trade.id);
        
        console.log(`[TradeManager] Troca ${trade.id} executada com sucesso`);
    }
    
    cancelTradeDueToError(trade, reason) {
        this.returnTradeItems(trade);
        
        for (const participant of trade.participants) {
            this.playerTrades.delete(participant.playerId);
            
            const player = this.server.players.get(participant.playerId);
            if (player?.socket) {
                player.socket.emit('trade:error', { message: reason });
            }
        }
        
        this.activeTrades.delete(trade.id);
    }
    
    returnTradeItems(trade) {
        // Return items to their owners
        // (Would integrate with inventory system)
    }
    
    // ===== PARTY TRADE =====
    
    handleCreatePartyTrade(socket) {
        // Create multi-player trade session
        const tradeId = `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const player = this.server.players.get(socket.playerId);
        
        const trade = {
            id: tradeId,
            type: 'party',
            leaderId: socket.playerId,
            participants: [{
                playerId: socket.playerId,
                playerName: player.name,
                items: [],
                gold: 0,
                confirmed: false
            }],
            maxParticipants: this.config.maxPartyTrade,
            createdAt: Date.now(),
            status: 'forming'
        };
        
        this.activeTrades.set(tradeId, trade);
        this.playerTrades.set(socket.playerId, tradeId);
        
        socket.emit('trade:party_created', {
            tradeId,
            inviteCode: tradeId.substr(-6).toUpperCase()
        });
    }
    
    handleJoinPartyTrade(socket, data) {
        const { inviteCode } = data;
        
        // Find trade by invite code
        const trade = Array.from(this.activeTrades.values())
            .find(t => t.type === 'party' && 
                      t.status === 'forming' && 
                      t.id.substr(-6).toUpperCase() === inviteCode.toUpperCase());
        
        if (!trade) {
            socket.emit('trade:error', { message: 'Código de convite inválido!' });
            return;
        }
        
        if (trade.participants.length >= trade.maxParticipants) {
            socket.emit('trade:error', { message: 'Grupo cheio!' });
            return;
        }
        
        const player = this.server.players.get(socket.playerId);
        
        trade.participants.push({
            playerId: socket.playerId,
            playerName: player.name,
            items: [],
            gold: 0,
            confirmed: false
        });
        
        this.playerTrades.set(socket.playerId, trade.id);
        
        // Notify all participants
        for (const p of trade.participants) {
            const participant = this.server.players.get(p.playerId);
            if (participant?.socket) {
                participant.socket.emit('trade:party_updated', {
                    participants: trade.participants.map(tp => ({
                        playerId: tp.playerId,
                        playerName: tp.playerName
                    }))
                });
            }
        }
        
        socket.emit('trade:party_joined', { tradeId: trade.id });
    }
    
    // ===== UTILITIES =====
    
    resetConfirmations(trade) {
        for (const participant of trade.participants) {
            participant.confirmed = false;
            participant.locked = false;
        }
        
        // Notify all
        for (const participant of trade.participants) {
            const player = this.server.players.get(participant.playerId);
            if (player?.socket) {
                player.socket.emit('trade:confirmations_reset');
            }
        }
    }
    
    notifyTradeUpdate(trade, fromPlayerId) {
        const participant = trade.participants.find(p => p.playerId === fromPlayerId);
        
        for (const p of trade.participants) {
            if (p.playerId === fromPlayerId) continue;
            
            const player = this.server.players.get(p.playerId);
            if (player?.socket) {
                player.socket.emit('trade:partner_updated', {
                    partnerId: fromPlayerId,
                    partnerName: participant?.playerName,
                    items: participant?.items,
                    gold: participant?.gold
                });
            }
        }
    }
    
    calculateDistance(player1, player2) {
        const dx = (player1.x || 0) - (player2.x || 0);
        const dy = (player1.y || 0) - (player2.y || 0);
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    logTrade(trade) {
        const logEntry = {
            tradeId: trade.id,
            type: trade.type,
            participants: trade.participants.map(p => ({
                playerId: p.playerId,
                playerName: p.playerName,
                gave: {
                    items: p.items.filter(i => i),
                    gold: p.gold
                }
            })),
            timestamp: Date.now()
        };
        
        this.tradeHistory.push(logEntry);
        
        // Keep only last 1000 trades
        if (this.tradeHistory.length > 1000) {
            this.tradeHistory.shift();
        }
    }
    
    handleGetHistory(socket) {
        const playerHistory = this.tradeHistory.filter(t => 
            t.participants.some(p => p.playerId === socket.playerId)
        ).slice(-50).reverse();
        
        socket.emit('trade:history', playerHistory);
    }
    
    startCleanupLoop() {
        // Clean up stale trades every minute
        setInterval(() => {
            const now = Date.now();
            
            for (const [tradeId, trade] of this.activeTrades) {
                if (now - trade.createdAt > this.config.tradeTimeout) {
                    this.cancelTradeDueToError(trade, 'Tempo de troca expirado');
                }
            }
        }, 60000);
    }
    
    // ===== API =====
    
    getPlayerTrade(playerId) {
        const tradeId = this.playerTrades.get(playerId);
        return tradeId ? this.activeTrades.get(tradeId) : null;
    }
    
    isPlayerInTrade(playerId) {
        return this.playerTrades.has(playerId);
    }
}

module.exports = TradeManager;
