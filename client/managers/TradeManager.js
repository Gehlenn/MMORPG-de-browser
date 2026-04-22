/**
 * TradeManager - Sistema de Troca entre Jogadores
 * 
 * Gerencia:
 * - Solicitações de troca
 * - Estado da troca (oferta, confirmação)
 * - Segurança (timeout, validações)
 * - Finalização ou cancelamento
 */

class TradeManager {
    constructor(playerId) {
        this.playerId = playerId;
        
        // Estado atual
        this.state = 'idle'; // idle, pending, active, confirming, completed, cancelled
        this.currentTrade = null;
        
        // Callbacks
        this.onTradeRequest = null;
        this.onTradeStart = null;
        this.onTradeUpdate = null;
        this.onTradeComplete = null;
        this.onTradeCancel = null;
        this.onTradeDecline = null;
        
        // Configurações
        this.tradeTimeout = 120000; // 2 minutos para timeout
        this.maxSlots = 6; // Máximo de slots de troca
        this.confirmationTimeout = 10000; // 10 segundos para confirmar
        
        this.initialized = false;
    }
    
    init(inventoryManager, goldManager) {
        if (this.initialized) return;
        
        this.inventoryManager = inventoryManager;
        this.goldManager = goldManager;
        
        this.initialized = true;
        console.log('🤝 TradeManager inicializado');
    }
    
    // ===================== SOLICITAÇÕES =====================
    
    /**
     * Envia solicitação de troca para outro jogador
     */
    requestTrade(targetPlayerId, targetPlayerName) {
        if (this.state !== 'idle') {
            return { success: false, reason: 'already_trading' };
        }
        
        if (targetPlayerId === this.playerId) {
            return { success: false, reason: 'cannot_trade_self' };
        }
        
        this.state = 'pending';
        this.currentTrade = {
            id: this.generateTradeId(),
            initiator: this.playerId,
            target: targetPlayerId,
            targetName: targetPlayerName,
            initiatorOffer: { items: [], gold: 0, confirmed: false },
            targetOffer: { items: [], gold: 0, confirmed: false },
            startTime: Date.now(),
            status: 'pending'
        };
        
        // Em modo offline, auto-aceitar para testes
        if (!window.networkManager?.isConnected) {
            console.log('🤝 Modo offline - auto-aceitando trade');
            this.acceptTrade();
        } else {
            // Enviar para servidor
            this.sendTradeRequest(targetPlayerId);
        }
        
        // Timeout de solicitação
        this.tradeTimeoutId = setTimeout(() => {
            if (this.state === 'pending') {
                this.cancelTrade('timeout_request');
            }
        }, this.tradeTimeout);
        
        return { success: true, tradeId: this.currentTrade.id };
    }
    
    /**
     * Recebe solicitação de troca
     */
    receiveTradeRequest(tradeData) {
        if (this.state !== 'idle') {
            this.declineTrade(tradeData.id, 'busy');
            return;
        }
        
        this.state = 'pending';
        this.currentTrade = {
            ...tradeData,
            initiatorOffer: { items: [], gold: 0, confirmed: false },
            targetOffer: { items: [], gold: 0, confirmed: false },
            status: 'pending'
        };
        
        // Notificar UI
        if (this.onTradeRequest) {
            this.onTradeRequest(tradeData);
        }
        
        // Som
        if (window.audioManager) {
            window.audioManager.playSFX('trade_request');
        }
        
        // Timeout
        this.tradeTimeoutId = setTimeout(() => {
            if (this.state === 'pending') {
                this.declineTrade(this.currentTrade?.id, 'timeout');
            }
        }, this.tradeTimeout);
    }
    
    /**
     * Aceita solicitação de troca
     */
    acceptTrade() {
        if (this.state !== 'pending' || !this.currentTrade) {
            return { success: false, reason: 'no_pending_trade' };
        }
        
        clearTimeout(this.tradeTimeoutId);
        
        this.state = 'active';
        this.currentTrade.status = 'active';
        this.currentTrade.acceptTime = Date.now();
        
        // Notificar outro jogador
        this.sendTradeAccept();
        
        if (this.onTradeStart) {
            this.onTradeStart(this.currentTrade);
        }
        
        return { success: true };
    }
    
    /**
     * Recusa solicitação de troca
     */
    declineTrade(tradeId = null, reason = 'declined') {
        clearTimeout(this.tradeTimeoutId);
        
        if (this.currentTrade && this.onTradeDecline) {
            this.onTradeDecline(this.currentTrade, reason);
        }
        
        this.sendTradeDecline(tradeId || this.currentTrade?.id, reason);
        this.resetTrade();
    }
    
    // ===================== OFERTAS =====================
    
    /**
     * Adiciona item à oferta
     */
    addItemToOffer(inventorySlot, quantity = 1) {
        if (this.state !== 'active') {
            return { success: false, reason: 'trade_not_active' };
        }
        
        const item = this.inventoryManager?.getItemAt(inventorySlot);
        if (!item) {
            return { success: false, reason: 'item_not_found' };
        }
        
        // Verificar se item está equipado
        if (item.equipped) {
            return { success: false, reason: 'item_equipped' };
        }
        
        // Verificar limite de slots
        const myOffer = this.getMyOffer();
        if (myOffer.items.length >= this.maxSlots) {
            return { success: false, reason: 'max_slots_reached' };
        }
        
        // Verificar quantidade
        const actualQty = Math.min(quantity, item.quantity || 1);
        
        // Adicionar à oferta
        const offerItem = {
            slot: inventorySlot,
            id: item.id,
            name: item.name,
            icon: item.icon,
            rarity: item.rarity,
            quantity: actualQty,
            stats: item.stats
        };
        
        myOffer.items.push(offerItem);
        
        // Resetar confirmação ao modificar oferta
        this.resetConfirmations();
        
        // Notificar
        this.notifyTradeUpdate();
        
        if (window.audioManager) {
            window.audioManager.playSFX('trade_add_item');
        }
        
        return { success: true, item: offerItem };
    }
    
    /**
     * Remove item da oferta
     */
    removeItemFromOffer(offerIndex) {
        if (this.state !== 'active') {
            return { success: false, reason: 'trade_not_active' };
        }
        
        const myOffer = this.getMyOffer();
        if (offerIndex < 0 || offerIndex >= myOffer.items.length) {
            return { success: false, reason: 'invalid_index' };
        }
        
        myOffer.items.splice(offerIndex, 1);
        
        // Resetar confirmação
        this.resetConfirmations();
        
        // Notificar
        this.notifyTradeUpdate();
        
        return { success: true };
    }
    
    /**
     * Adiciona gold à oferta
     */
    addGoldToOffer(amount) {
        if (this.state !== 'active') {
            return { success: false, reason: 'trade_not_active' };
        }
        
        const currentGold = this.goldManager?.getGold() || 0;
        const myOffer = this.getMyOffer();
        
        if (amount > currentGold) {
            return { success: false, reason: 'insufficient_gold', has: currentGold, requested: amount };
        }
        
        myOffer.gold = amount;
        
        // Resetar confirmação
        this.resetConfirmations();
        
        // Notificar
        this.notifyTradeUpdate();
        
        return { success: true };
    }
    
    /**
     * Retorna minha oferta
     */
    getMyOffer() {
        if (!this.currentTrade) return null;
        
        const isInitiator = this.currentTrade.initiator === this.playerId;
        return isInitiator ? this.currentTrade.initiatorOffer : this.currentTrade.targetOffer;
    }
    
    /**
     * Retorna oferta do outro jogador
     */
    getOtherOffer() {
        if (!this.currentTrade) return null;
        
        const isInitiator = this.currentTrade.initiator === this.playerId;
        return isInitiator ? this.currentTrade.targetOffer : this.currentTrade.initiatorOffer;
    }
    
    // ===================== CONFIRMAÇÃO =====================
    
    /**
     * Confirma a troca
     */
    confirmTrade() {
        if (this.state !== 'active') {
            return { success: false, reason: 'trade_not_active' };
        }
        
        const myOffer = this.getMyOffer();
        myOffer.confirmed = true;
        
        // Verificar se ambos confirmaram
        const otherOffer = this.getOtherOffer();
        if (otherOffer.confirmed) {
            this.executeTrade();
        } else {
            // Aguardando outro jogador
            this.state = 'confirming';
            this.currentTrade.status = 'confirming';
            
            // Timeout de confirmação
            this.confirmTimeoutId = setTimeout(() => {
                if (this.state === 'confirming') {
                    this.cancelTrade('confirmation_timeout');
                }
            }, this.confirmationTimeout);
        }
        
        // Notificar
        this.notifyTradeUpdate();
        
        if (window.audioManager) {
            window.audioManager.playSFX('trade_confirm');
        }
        
        return { success: true, waiting: !otherOffer.confirmed };
    }
    
    /**
     * Desconfirma (modificou oferta após confirmar)
     */
    unconfirmTrade() {
        if (this.state !== 'active' && this.state !== 'confirming') {
            return { success: false, reason: 'cannot_unconfirm' };
        }
        
        const myOffer = this.getMyOffer();
        myOffer.confirmed = false;
        
        this.state = 'active';
        this.currentTrade.status = 'active';
        
        clearTimeout(this.confirmTimeoutId);
        
        this.notifyTradeUpdate();
        
        return { success: true };
    }
    
    /**
     * Reseta confirmações quando oferta é modificada
     */
    resetConfirmations() {
        if (!this.currentTrade) return;
        
        this.currentTrade.initiatorOffer.confirmed = false;
        this.currentTrade.targetOffer.confirmed = false;
        
        if (this.state === 'confirming') {
            this.state = 'active';
            this.currentTrade.status = 'active';
            clearTimeout(this.confirmTimeoutId);
        }
    }
    
    // ===================== EXECUÇÃO =====================
    
    /**
     * Executa a troca (ambos confirmaram)
     */
    executeTrade() {
        clearTimeout(this.confirmTimeoutId);
        
        this.state = 'completed';
        this.currentTrade.status = 'completed';
        this.currentTrade.completeTime = Date.now();
        
        // Transferir itens
        const isInitiator = this.currentTrade.initiator === this.playerId;
        const myOffer = isInitiator ? this.currentTrade.initiatorOffer : this.currentTrade.targetOffer;
        const otherOffer = isInitiator ? this.currentTrade.targetOffer : this.currentTrade.initiatorOffer;
        
        // Validar espaço
        const itemsToReceive = otherOffer.items.length;
        const freeSlots = this.inventoryManager?.getFreeSlots() || 0;
        
        if (itemsToReceive > freeSlots) {
            this.cancelTrade('inventory_full');
            return;
        }
        
        // Validar gold
        const myGold = this.goldManager?.getGold() || 0;
        if (myOffer.gold > myGold) {
            this.cancelTrade('insufficient_gold');
            return;
        }
        
        // Executar transferência
        try {
            // Remover meus itens
            for (const item of myOffer.items) {
                this.inventoryManager?.removeItem(item.slot, item.quantity);
            }
            
            // Remover meu gold
            if (myOffer.gold > 0) {
                this.goldManager?.removeGold(myOffer.gold);
            }
            
            // Receber itens do outro
            for (const item of otherOffer.items) {
                this.inventoryManager?.addItem({
                    id: item.id,
                    name: item.name,
                    icon: item.icon,
                    rarity: item.rarity,
                    stats: item.stats
                }, item.quantity, 'trade');
            }
            
            // Receber gold
            if (otherOffer.gold > 0) {
                this.goldManager?.addGold(otherOffer.gold);
            }
            
            // Notificar
            if (this.onTradeComplete) {
                this.onTradeComplete(this.currentTrade);
            }
            
            // Som
            if (window.audioManager) {
                window.audioManager.playSFX('trade_complete');
            }
            
            // Reset após um delay
            setTimeout(() => this.resetTrade(), 2000);
            
        } catch (e) {
            console.error('🤝 Erro ao executar troca:', e);
            this.cancelTrade('execution_error');
        }
    }
    
    /**
     * Cancela a troca
     */
    cancelTrade(reason = 'cancelled') {
        clearTimeout(this.tradeTimeoutId);
        clearTimeout(this.confirmTimeoutId);
        
        const wasActive = this.state !== 'idle';
        
        this.state = 'cancelled';
        if (this.currentTrade) {
            this.currentTrade.status = 'cancelled';
            this.currentTrade.cancelReason = reason;
            this.currentTrade.cancelTime = Date.now();
        }
        
        // Notificar outro jogador
        if (wasActive) {
            this.sendTradeCancel(reason);
        }
        
        if (this.onTradeCancel) {
            this.onTradeCancel(this.currentTrade, reason);
        }
        
        this.resetTrade();
    }
    
    /**
     * Reseta estado da troca
     */
    resetTrade() {
        this.state = 'idle';
        this.currentTrade = null;
        clearTimeout(this.tradeTimeoutId);
        clearTimeout(this.confirmTimeoutId);
    }
    
    // ===================== NETWORK (Offline Mode) =====================
    
    sendTradeRequest(targetId) {
        // Em modo online, enviar via networkManager
        // Por enquanto, log apenas
        console.log('🤝 Enviando solicitação para:', targetId);
    }
    
    sendTradeAccept() {
        console.log('🤝 Enviando aceite');
    }
    
    sendTradeDecline(tradeId, reason) {
        console.log('🤝 Enviando recusa:', reason);
    }
    
    sendTradeCancel(reason) {
        console.log('🤝 Enviando cancelamento:', reason);
    }
    
    notifyTradeUpdate() {
        // Em modo online, sincronizar com outro jogador
        if (this.onTradeUpdate) {
            this.onTradeUpdate(this.currentTrade);
        }
    }
    
    // ===================== UTILS =====================
    
    generateTradeId() {
        return `trade_${this.playerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Retorna estado atual
     */
    getStatus() {
        return {
            state: this.state,
            trade: this.currentTrade,
            canTrade: this.state === 'idle',
            isInTrade: this.state !== 'idle' && this.state !== 'completed' && this.state !== 'cancelled'
        };
    }
    
    /**
     * Retorna valor total da oferta (para display)
     */
    getOfferValue(offer) {
        if (!offer) return { items: 0, gold: 0, total: 0 };
        
        const itemValue = offer.items.reduce((sum, item) => {
            const baseValue = item.value || 10;
            return sum + (baseValue * item.quantity);
        }, 0);
        
        return {
            items: itemValue,
            gold: offer.gold,
            total: itemValue + offer.gold
        };
    }
}

window.TradeManager = TradeManager;
