/**
 * EconomyManager - Sistema de Economia Dinâmica
 * 
 * Responsabilidades:
 * - Preços flutuantes baseados em oferta/demanda
 * - Eventos que afetam o mercado
 * - Histórico de preços
 * - Tendências de mercado
 * - Modificadores regionais
 */

class EconomyManager {
    constructor() {
        // Preços base (referência)
        this.basePrices = new Map();
        
        // Preços atuais
        this.currentPrices = new Map();
        
        // Histórico de preços (últimas 24h simuladas)
        this.priceHistory = new Map(); // itemId -> [{timestamp, price}]
        
        // Demanda por item
        this.demand = new Map(); // itemId -> {buyCount, sellCount, lastUpdate}
        
        // Eventos ativos
        this.activeEvents = [];
        
        // Configurações
        this.priceUpdateInterval = 300000; // 5 minutos
        this.maxPriceChange = 0.3; // Máximo 30% de variação
        this.historyLimit = 50; // Máximo de registros no histórico
        
        // Categorias e volatilidade
        this.categories = {
            'common_materials': { volatility: 0.1, baseMultiplier: 1.0 },
            'rare_materials': { volatility: 0.2, baseMultiplier: 2.0 },
            'consumables': { volatility: 0.15, baseMultiplier: 1.0 },
            'equipment': { volatility: 0.05, baseMultiplier: 3.0 },
            'luxury': { volatility: 0.25, baseMultiplier: 5.0 },
            'event_items': { volatility: 0.4, baseMultiplier: 10.0 }
        };
        
        // Modificadores regionais
        this.regionalModifiers = {
            'verdantis': { 'herbs': 0.8, 'wood': 0.7, 'ores': 1.2 },
            'eldoria': { 'ores': 0.7, 'crystals': 0.8, 'furs': 1.3 },
            'aurelia': { 'gems': 0.7, 'spices': 0.8, 'water': 1.5 }
        };
        
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        // Carregar dados salvos
        this.loadFromStorage();
        
        // Inicializar preços base
        this.initializeBasePrices();
        
        // Iniciar loop de atualização
        this.startPriceUpdateLoop();
        
        // Gerar eventos aleatórios periódicos
        this.startEventGenerator();
        
        this.initialized = true;
        console.log('💹 EconomyManager inicializado');
        console.log('   - Itens rastreados:', this.currentPrices.size);
    }
    
    // ===================== PREÇOS BASE =====================
    
    initializeBasePrices() {
        // Materiais comuns
        this.setBasePrice('herbs', 5, 'common_materials');
        this.setBasePrice('wood', 8, 'common_materials');
        this.setBasePrice('stone', 3, 'common_materials');
        this.setBasePrice('cloth', 10, 'common_materials');
        this.setBasePrice('leather', 15, 'common_materials');
        
        // Materiais raros
        this.setBasePrice('silver_ore', 50, 'rare_materials');
        this.setBasePrice('gold_ore', 100, 'rare_materials');
        this.setBasePrice('crystal', 80, 'rare_materials');
        this.setBasePrice('gem', 150, 'rare_materials');
        this.setBasePrice('rune', 200, 'rare_materials');
        
        // Consumíveis
        this.setBasePrice('health_potion', 25, 'consumables');
        this.setBasePrice('mana_potion', 30, 'consumables');
        this.setBasePrice('food', 10, 'consumables');
        this.setBasePrice('antidote', 40, 'consumables');
        
        // Equipamentos (preços mais altos)
        this.setBasePrice('iron_sword', 150, 'equipment');
        this.setBasePrice('steel_armor', 300, 'equipment');
        this.setBasePrice('magic_staff', 250, 'equipment');
        this.setBasePrice('bow', 120, 'equipment');
        
        // Luxo
        this.setBasePrice('gold_ring', 500, 'luxury');
        this.setBasePrice('crown', 2000, 'luxury');
        this.setBasePrice('epic_weapon', 1000, 'luxury');
        
        // Itens de evento
        this.setBasePrice('event_token', 50, 'event_items');
        this.setBasePrice('festival_item', 100, 'event_items');
    }
    
    setBasePrice(itemId, price, category = 'common_materials') {
        this.basePrices.set(itemId, { price, category });
        
        // Se não tem preço atual, inicializar com base
        if (!this.currentPrices.has(itemId)) {
            this.currentPrices.set(itemId, {
                buyPrice: price,
                sellPrice: Math.floor(price * 0.6),
                category,
                lastUpdate: Date.now()
            });
        }
    }
    
    // ===================== CÁLCULO DE PREÇOS =====================
    
    /**
     * Calcula preço atual considerando todos os fatores
     */
    calculatePrice(itemId, zone = 'verdantis') {
        const baseData = this.basePrices.get(itemId);
        if (!baseData) return null;
        
        let price = baseData.price;
        const category = this.categories[baseData.category] || this.categories['common_materials'];
        
        // 1. Demanda/Oferta
        const demandFactor = this.getDemandFactor(itemId);
        price *= demandFactor;
        
        // 2. Eventos ativos
        const eventFactor = this.getEventFactor(itemId, baseData.category);
        price *= eventFactor;
        
        // 3. Modificador regional
        const regionalFactor = this.getRegionalFactor(baseData.category, zone);
        price *= regionalFactor;
        
        // 4. Tendência (inércia de mercado)
        const trendFactor = this.getTrendFactor(itemId);
        price *= trendFactor;
        
        // Limitar variação
        const minPrice = baseData.price * (1 - this.maxPriceChange);
        const maxPrice = baseData.price * (1 + this.maxPriceChange);
        price = Math.max(minPrice, Math.min(maxPrice, price));
        
        // Arredondar
        const finalPrice = Math.round(price);
        
        return {
            buyPrice: finalPrice,
            sellPrice: Math.floor(finalPrice * 0.6),
            basePrice: baseData.price,
            category: baseData.category,
            trend: this.getTrend(itemId),
            changePercent: ((finalPrice - baseData.price) / baseData.price * 100).toFixed(1),
            factors: {
                demand: demandFactor.toFixed(2),
                events: eventFactor.toFixed(2),
                regional: regionalFactor.toFixed(2),
                trend: trendFactor.toFixed(2)
            }
        };
    }
    
    getDemandFactor(itemId) {
        const demand = this.demand.get(itemId);
        if (!demand) return 1.0;
        
        // Se vendeu muito, preço sobe (demanda alta)
        // Se comprou muito (estoque alto), preço cai
        const buyCount = demand.buyCount || 0;
        const sellCount = demand.sellCount || 0;
        
        const ratio = (sellCount + 1) / (buyCount + 1);
        // Ratio > 1 = vendeu mais que comprou = alta demanda = preço sobe
        // Ratio < 1 = comprou mais que vendeu = baixa demanda = preço cai
        
        return Math.max(0.7, Math.min(1.3, ratio));
    }
    
    getEventFactor(itemId, category) {
        let factor = 1.0;
        
        for (const event of this.activeEvents) {
            // Verificar se evento afeta este item/categoria
            if (event.affectedItems?.includes(itemId) || 
                event.affectedCategories?.includes(category)) {
                factor *= event.priceMultiplier;
            }
        }
        
        return factor;
    }
    
    getRegionalFactor(category, zone) {
        const modifiers = this.regionalModifiers[zone];
        if (!modifiers) return 1.0;
        
        return modifiers[category] || 1.0;
    }
    
    getTrendFactor(itemId) {
        const history = this.priceHistory.get(itemId);
        if (!history || history.length < 3) return 1.0;
        
        // Calcular tendência dos últimos 3 registros
        const recent = history.slice(-3);
        const first = recent[0].price;
        const last = recent[recent.length - 1].price;
        
        const change = (last - first) / first;
        
        // Inércia: tendência a continuar o movimento
        return 1 + (change * 0.3); // 30% de inércia
    }
    
    getTrend(itemId) {
        const history = this.priceHistory.get(itemId);
        if (!history || history.length < 2) return 'stable';
        
        const current = history[history.length - 1].price;
        const previous = history[history.length - 2].price;
        
        const change = current - previous;
        const threshold = current * 0.02; // 2% de threshold
        
        if (change > threshold) return 'up';
        if (change < -threshold) return 'down';
        return 'stable';
    }
    
    // ===================== ATUALIZAÇÃO DE PREÇOS =====================
    
    updateAllPrices(zone = 'verdantis') {
        const updates = [];
        
        for (const [itemId, baseData] of this.basePrices) {
            const newPrice = this.calculatePrice(itemId, zone);
            
            if (newPrice) {
                const oldPrice = this.currentPrices.get(itemId);
                
                // Salvar no histórico
                this.addToHistory(itemId, newPrice.buyPrice);
                
                // Atualizar preço atual
                this.currentPrices.set(itemId, {
                    ...newPrice,
                    lastUpdate: Date.now()
                });
                
                // Se mudou significativamente, notificar
                if (oldPrice && Math.abs(newPrice.buyPrice - oldPrice.buyPrice) > oldPrice.buyPrice * 0.1) {
                    updates.push({
                        itemId,
                        oldPrice: oldPrice.buyPrice,
                        newPrice: newPrice.buyPrice,
                        trend: newPrice.trend
                    });
                }
            }
        }
        
        this.saveToStorage();
        
        if (updates.length > 0) {
            console.log('💹 Preços atualizados:', updates.length, 'itens');
            this.notifyPriceChanges(updates);
        }
        
        return updates;
    }
    
    addToHistory(itemId, price) {
        if (!this.priceHistory.has(itemId)) {
            this.priceHistory.set(itemId, []);
        }
        
        const history = this.priceHistory.get(itemId);
        history.push({
            timestamp: Date.now(),
            price
        });
        
        // Limitar tamanho
        if (history.length > this.historyLimit) {
            history.shift();
        }
    }
    
    startPriceUpdateLoop() {
        setInterval(() => {
            this.updateAllPrices();
        }, this.priceUpdateInterval);
    }
    
    // ===================== REGISTRO DE TRANSAÇÕES =====================
    
    /**
     * Registra compra (aumenta demanda)
     */
    recordBuy(itemId, quantity) {
        if (!this.demand.has(itemId)) {
            this.demand.set(itemId, { buyCount: 0, sellCount: 0, lastUpdate: Date.now() });
        }
        
        const demand = this.demand.get(itemId);
        demand.buyCount += quantity;
        demand.lastUpdate = Date.now();
        
        // Decair demanda ao longo do tempo
        this.decayDemand();
    }
    
    /**
     * Registra venda (aumenta oferta)
     */
    recordSell(itemId, quantity) {
        if (!this.demand.has(itemId)) {
            this.demand.set(itemId, { buyCount: 0, sellCount: 0, lastUpdate: Date.now() });
        }
        
        const demand = this.demand.get(itemId);
        demand.sellCount += quantity;
        demand.lastUpdate = Date.now();
        
        this.decayDemand();
    }
    
    decayDemand() {
        const now = Date.now();
        const decayTime = 3600000; // 1 hora
        
        for (const [itemId, demand] of this.demand) {
            if (now - demand.lastUpdate > decayTime) {
                demand.buyCount = Math.floor(demand.buyCount * 0.5);
                demand.sellCount = Math.floor(demand.sellCount * 0.5);
                demand.lastUpdate = now;
            }
        }
    }
    
    // ===================== EVENTOS DE MERCADO =====================
    
    startEventGenerator() {
        // Gerar evento a cada 30 minutos (simulado)
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% de chance
                this.generateRandomEvent();
            }
        }, 300000); // 5 minutos real = 30 minutos simulado
    }
    
    generateRandomEvent() {
        const eventTypes = [
            {
                name: 'Colheita Abundante',
                description: 'A colheita foi boa, preços de alimentos caíram',
                affectedCategories: ['consumables'],
                priceMultiplier: 0.8,
                duration: 3600000 // 1 hora
            },
            {
                name: 'Guerra de Clãs',
                description: 'Aumento na demanda por armas e armaduras',
                affectedCategories: ['equipment'],
                priceMultiplier: 1.3,
                duration: 7200000 // 2 horas
            },
            {
                name: 'Descoberta de Mina',
                description: 'Novos minérios disponíveis',
                affectedCategories: ['rare_materials'],
                priceMultiplier: 0.7,
                duration: 5400000 // 1.5 horas
            },
            {
                name: 'Festival do Comércio',
                description: 'Todos os itens com desconto!',
                affectedCategories: Object.keys(this.categories),
                priceMultiplier: 0.9,
                duration: 1800000 // 30 min
            },
            {
                name: 'Escassez de Cristais',
                description: 'Cristais estão em falta',
                affectedItems: ['crystal'],
                priceMultiplier: 1.5,
                duration: 3600000 // 1 hora
            }
        ];
        
        const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        event.id = `event_${Date.now()}`;
        event.startTime = Date.now();
        event.endTime = Date.now() + event.duration;
        
        this.activeEvents.push(event);
        
        // Notificar
        this.notifyEvent(event);
        
        // Atualizar preços imediatamente
        this.updateAllPrices();
        
        console.log('📢 Evento de mercado:', event.name);
    }
    
    cleanupExpiredEvents() {
        const now = Date.now();
        const expired = this.activeEvents.filter(e => e.endTime <= now);
        
        if (expired.length > 0) {
            this.activeEvents = this.activeEvents.filter(e => e.endTime > now);
            console.log('📢 Eventos expirados:', expired.length);
            this.updateAllPrices();
        }
    }
    
    // ===================== NOTIFICAÇÕES =====================
    
    notifyPriceChanges(updates) {
        // Mostrar toast para mudanças significativas
        const significantChanges = updates.filter(u => 
            Math.abs(u.newPrice - u.oldPrice) / u.oldPrice > 0.15
        );
        
        if (significantChanges.length > 0 && window.effectsManager) {
            const first = significantChanges[0];
            const direction = first.newPrice > first.oldPrice ? '📈' : '📉';
            
            window.effectsManager.showToast(
                `${direction} ${significantChanges.length} preços alterados!`,
                '💹',
                first.newPrice > first.oldPrice ? '#e74c3c' : '#2ecc71'
            );
        }
        
        // Emitir evento
        if (window.eventBus) {
            window.eventBus.emit('priceUpdate', updates);
        }
    }
    
    notifyEvent(event) {
        if (window.effectsManager) {
            window.effectsManager.showToast(
                `📢 ${event.name}: ${event.description}`,
                '📢',
                '#f1c40f'
            );
        }
    }
    
    // ===================== UTILS PÚBLICOS =====================
    
    getPrice(itemId, zone = 'verdantis') {
        const price = this.currentPrices.get(itemId);
        if (price) return price;
        
        // Calcular se não existir
        return this.calculatePrice(itemId, zone);
    }
    
    getAllPrices(zone = 'verdantis') {
        const prices = [];
        for (const [itemId] of this.basePrices) {
            const price = this.getPrice(itemId, zone);
            if (price) {
                prices.push({ itemId, ...price });
            }
        }
        return prices;
    }
    
    getTrendingItems(limit = 5) {
        const items = [];
        
        for (const [itemId, history] of this.priceHistory) {
            if (history.length >= 2) {
                const current = history[history.length - 1].price;
                const previous = history[history.length - 2].price;
                const change = ((current - previous) / previous * 100);
                
                items.push({
                    itemId,
                    change,
                    current,
                    trend: change > 0 ? 'up' : 'down'
                });
            }
        }
        
        // Ordenar por maior variação
        items.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
        
        return items.slice(0, limit);
    }
    
    getMarketStats() {
        const prices = this.getAllPrices();
        
        const rising = prices.filter(p => p.trend === 'up').length;
        const falling = prices.filter(p => p.trend === 'down').length;
        const stable = prices.filter(p => p.trend === 'stable').length;
        
        const avgChange = prices.reduce((sum, p) => sum + parseFloat(p.changePercent), 0) / prices.length;
        
        return {
            totalItems: prices.length,
            rising,
            falling,
            stable,
            averageChange: avgChange.toFixed(2),
            activeEvents: this.activeEvents.length,
            marketMood: avgChange > 2 ? 'bullish' : avgChange < -2 ? 'bearish' : 'neutral'
        };
    }
    
    getActiveEvents() {
        this.cleanupExpiredEvents();
        return this.activeEvents;
    }
    
    // ===================== PERSISTÊNCIA =====================
    
    saveToStorage() {
        const data = {
            currentPrices: Array.from(this.currentPrices.entries()),
            priceHistory: Array.from(this.priceHistory.entries()),
            demand: Array.from(this.demand.entries()),
            activeEvents: this.activeEvents
        };
        localStorage.setItem('economy_data', JSON.stringify(data));
    }
    
    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('economy_data') || '{}');
            
            if (data.currentPrices) {
                this.currentPrices = new Map(data.currentPrices);
            }
            if (data.priceHistory) {
                this.priceHistory = new Map(data.priceHistory);
            }
            if (data.demand) {
                this.demand = new Map(data.demand);
            }
            if (data.activeEvents) {
                this.activeEvents = data.activeEvents.filter(e => e.endTime > Date.now());
            }
        } catch (e) {
            console.log('💹 Nenhum dado econômico salvo');
        }
    }
    
    resetEconomy() {
        this.currentPrices.clear();
        this.priceHistory.clear();
        this.demand.clear();
        this.activeEvents = [];
        this.initializeBasePrices();
        this.saveToStorage();
    }
}

window.EconomyManager = EconomyManager;
