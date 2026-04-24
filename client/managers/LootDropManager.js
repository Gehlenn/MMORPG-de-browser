/**
 * LootDropManager - Sistema de Drops de Mobs
 * 
 * Responsabilidades:
 * - Gerar loot quando mob morre
 * - Calcular drops baseados em chance
 * - Gerenciar pilhas de loot no chão
 * - Auto-loot e loot por proximidade
 * - Integração com InventoryManager
 */

class LootDropManager {
    constructor() {
        this.activeDrops = new Map(); // lootId -> dropData
        this.dropExpiryTime = 120000; // 2 minutos para desaparecer
        this.autoLootDistance = 60; // distância para auto-loot
        this.playerPosition = { x: 0, y: 0 };
        this.initialized = false;
    }
    
    init(inventoryManager) {
        if (this.initialized) return;
        
        this.inventoryManager = inventoryManager;
        this.initialized = true;
        
        // Iniciar loop de limpeza
        this.startCleanupLoop();
        
        console.log('💰 LootDropManager inicializado');
    }
    
    // ===================== GERAÇÃO DE DROPS =====================
    
    /**
     * Gera drops quando um mob morre
     */
    generateMobDrops(mobType, mobPosition, mobLevel = 1, killerLuck = 0) {
        const lootTable = window.LootDatabase?.getByMobId(mobType);
        if (!lootTable) {
            console.log(`⚠️ Nenhuma tabela de loot para: ${mobType}`);
            return this.generateDefaultDrops(mobPosition, mobLevel);
        }
        
        const drops = [];
        
        // Calcular gold
        const goldAmount = this.calculateGold(lootTable.gold, mobLevel, killerLuck);
        if (goldAmount > 0) {
            drops.push({
                type: 'gold',
                id: 'gold',
                name: `${goldAmount} Gold`,
                icon: '💰',
                quantity: goldAmount,
                rarity: 'common'
            });
        }
        
        // Calcular drops de itens
        for (const dropEntry of lootTable.drops) {
            const rolled = this.rollDrop(dropEntry, killerLuck);
            if (rolled) {
                drops.push({
                    type: 'item',
                    id: dropEntry.id,
                    name: dropEntry.name,
                    icon: dropEntry.icon,
                    quantity: rolled.quantity,
                    rarity: dropEntry.rarity,
                    category: dropEntry.category,
                    value: dropEntry.value || 0
                });
            }
        }
        
        // Criar pilha de loot no chão
        if (drops.length > 0) {
            return this.createLootDrop(drops, mobPosition, mobType);
        }
        
        return null;
    }
    
    /**
     * Rolls para um item específico
     */
    rollDrop(dropEntry, luckBonus = 0) {
        const adjustedChance = dropEntry.chance + luckBonus;
        const roll = Math.random() * 100;
        
        if (roll <= adjustedChance) {
            const quantity = Math.floor(
                Math.random() * (dropEntry.maxQty - dropEntry.minQty + 1)
            ) + dropEntry.minQty;
            
            return {
                id: dropEntry.id,
                quantity: quantity
            };
        }
        
        return null;
    }
    
    /**
     * Calcula quantidade de gold
     */
    calculateGold(goldRange, mobLevel, luckBonus) {
        const baseMin = goldRange.min;
        const baseMax = goldRange.max;
        const levelMultiplier = 1 + (mobLevel * 0.1);
        const luckMultiplier = 1 + (luckBonus * 0.01);
        
        const min = Math.floor(baseMin * levelMultiplier * luckMultiplier);
        const max = Math.floor(baseMax * levelMultiplier * luckMultiplier);
        
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Gera drops padrão quando não há tabela
     */
    generateDefaultDrops(position, level) {
        const goldAmount = Math.floor(Math.random() * 10) + 5 + (level * 2);
        
        const drops = [{
            type: 'gold',
            id: 'gold',
            name: `${goldAmount} Gold`,
            icon: '💰',
            quantity: goldAmount,
            rarity: 'common'
        }];
        
        return this.createLootDrop(drops, position, 'generic');
    }
    
    // ===================== PILHAS DE LOOT =====================
    
    /**
     * Cria uma pilha de loot no chão
     */
    createLootDrop(items, position, sourceMob) {
        const lootId = `loot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const dropData = {
            id: lootId,
            items: items,
            position: { ...position },
            sourceMob: sourceMob,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.dropExpiryTime,
            visible: true,
            collected: false
        };
        
        this.activeDrops.set(lootId, dropData);
        
        // Emitir evento para renderização
        if (window.gameplayEngine?.onLootSpawned) {
            window.gameplayEngine.onLootSpawned(dropData);
        }
        
        // Verificar auto-loot imediato
        this.checkAutoLoot(dropData);
        
        return dropData;
    }
    
    /**
     * Coleta toda uma pilha de loot
     */
    collectLootDrop(lootId, autoLoot = false) {
        const drop = this.activeDrops.get(lootId);
        if (!drop || drop.collected) return null;
        
        const collected = [];
        const failed = [];
        
        for (const item of drop.items) {
            if (item.type === 'gold') {
                const success = this.addGoldToPlayer(item.quantity);
                if (success) {
                    collected.push(item);
                } else {
                    failed.push(item);
                }
            } else {
                const success = this.addItemToPlayer(item);
                if (success) {
                    collected.push(item);
                } else {
                    failed.push(item);
                }
            }
        }
        
        // Se coletou tudo, remover pilha
        if (failed.length === 0) {
            drop.collected = true;
            this.activeDrops.delete(lootId);
        } else {
            // Atualizar pilha com itens restantes
            drop.items = failed;
        }
        
        // Notificar
        if (collected.length > 0) {
            this.notifyLootCollected(collected, autoLoot);
        }
        
        return { collected, failed, allCollected: failed.length === 0 };
    }
    
    /**
     * Coleta item específico de uma pilha
     */
    collectItemFromDrop(lootId, itemIndex) {
        const drop = this.activeDrops.get(lootId);
        if (!drop || drop.collected) return null;
        
        const item = drop.items[itemIndex];
        if (!item) return null;
        
        let success = false;
        
        if (item.type === 'gold') {
            success = this.addGoldToPlayer(item.quantity);
        } else {
            success = this.addItemToPlayer(item);
        }
        
        if (success) {
            drop.items.splice(itemIndex, 1);
            
            // Se pilha vazia, remover
            if (drop.items.length === 0) {
                drop.collected = true;
                this.activeDrops.delete(lootId);
            }
            
            this.notifyLootCollected([item], false);
        }
        
        return { success, item, dropEmpty: drop.items.length === 0 };
    }
    
    // ===================== AUTO-LOOT =====================
    
    /**
     * Atualiza posição do jogador e verifica auto-loot
     */
    updatePlayerPosition(x, y) {
        this.playerPosition = { x, y };
        
        // Verificar pilhas próximas
        for (const drop of this.activeDrops.values()) {
            if (!drop.collected && drop.visible) {
                this.checkAutoLoot(drop);
            }
        }
    }
    
    /**
     * Verifica se deve auto-loot
     */
    checkAutoLoot(drop) {
        const distance = this.getDistance(drop.position, this.playerPosition);
        
        if (distance <= this.autoLootDistance) {
            // Auto-loot: coleta imediata
            this.collectLootDrop(drop.id, true);
        }
    }
    
    /**
     * Calcula distância entre dois pontos
     */
    getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // ===================== ADIÇÃO AO INVENTÁRIO =====================
    
    addGoldToPlayer(amount) {
        if (this.inventoryManager?.addGold) {
            this.inventoryManager.addGold(amount);
            return true;
        }
        
        // Fallback: adicionar direto
        const currentGold = parseInt(localStorage.getItem('player_gold') || '0');
        localStorage.setItem('player_gold', currentGold + amount);
        return true;
    }
    
    addItemToPlayer(item) {
        if (this.inventoryManager?.addItem) {
            const success = this.inventoryManager.addItem({
                id: item.id,
                name: item.name,
                icon: item.icon,
                rarity: item.rarity,
                category: item.category
            }, item.quantity, 'loot');
            
            return success;
        }
        
        // Fallback: adicionar ao array de itens
        const items = JSON.parse(localStorage.getItem('player_items') || '[]');
        items.push({
            id: item.id,
            name: item.name,
            icon: item.icon,
            quantity: item.quantity,
            rarity: item.rarity
        });
        localStorage.setItem('player_items', JSON.stringify(items));
        return true;
    }
    
    // ===================== NOTIFICAÇÕES =====================
    
    notifyLootCollected(items, autoLoot) {
        // Agrupar por tipo
        const gold = items.filter(i => i.type === 'gold');
        const items_list = items.filter(i => i.type !== 'gold');
        
        let message = '';
        
        if (gold.length > 0) {
            const totalGold = gold.reduce((sum, g) => sum + g.quantity, 0);
            message += `💰 +${totalGold} Gold `;
        }
        
        if (items_list.length > 0) {
            if (items_list.length === 1) {
                message += `${items_list[0].icon} ${items_list[0].name}`;
            } else {
                message += `+${items_list.length} itens`;
            }
        }
        
        // Mostrar toast
        if (window.effectsManager?.showToast) {
            window.effectsManager.showToast(
                autoLoot ? `Auto-loot: ${message}` : message,
                '🎁',
                '#4ecca3'
            );
        }
        
        // Som
        if (window.audioManager?.playSFX) {
            window.audioManager.playSFX(autoLoot ? 'auto_loot' : 'loot_collect');
        }
        
        // Evento
        if (window.eventBus) {
            window.eventBus.emit('lootCollected', { items, autoLoot });
        }
    }
    
    // ===================== LIMPEZA =====================
    
    startCleanupLoop() {
        setInterval(() => {
            this.cleanupExpiredDrops();
        }, 10000); // Verificar a cada 10 segundos
    }
    
    cleanupExpiredDrops() {
        const now = Date.now();
        const expired = [];
        
        for (const [id, drop] of this.activeDrops) {
            if (drop.expiresAt <= now && !drop.collected) {
                expired.push(id);
            }
        }
        
        for (const id of expired) {
            const drop = this.activeDrops.get(id);
            if (drop) {
                drop.visible = false;
                this.activeDrops.delete(id);
                
                // Notificar desaparecimento
                if (window.gameplayEngine?.onLootDespawned) {
                    window.gameplayEngine.onLootDespawned(id);
                }
            }
        }
        
        if (expired.length > 0) {
            console.log(`🧹 ${expired.length} pilha(s) de loot expiraram`);
        }
    }
    
    // ===================== UTILS =====================
    
    getActiveDrops() {
        return Array.from(this.activeDrops.values()).filter(d => !d.collected);
    }
    
    getDropsInRadius(center, radius) {
        return this.getActiveDrops().filter(drop => {
            const dist = this.getDistance(center, drop.position);
            return dist <= radius;
        });
    }
    
    clearAllDrops() {
        this.activeDrops.clear();
    }
    
    getDropById(lootId) {
        return this.activeDrops.get(lootId) || null;
    }
    
    /**
     * Preview de drops (para display na UI)
     */
    getDropPreview(mobType) {
        const lootTable = window.LootDatabase?.getByMobId(mobType);
        if (!lootTable) return null;
        
        return {
            mobName: lootTable.name,
            zone: lootTable.zone,
            isBoss: lootTable.boss || false,
            possibleDrops: lootTable.drops.map(d => ({
                name: d.name,
                icon: d.icon,
                chance: d.chance,
                rarity: d.rarity,
                category: d.category,
                quantity: `${d.minQty}-${d.maxQty}`
            })),
            goldRange: lootTable.gold
        };
    }
}

window.LootDropManager = LootDropManager;
