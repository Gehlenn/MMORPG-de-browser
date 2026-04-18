/**
 * LootManager.js
 * Gerenciamento de loot/drops no cliente - cria, sincroniza, coleta e renderiza loot
 * Parte da refatoração MVP (Passo 2)
 */

class LootManager {
    constructor(gameplayEngine) {
        this.engine = gameplayEngine;
        this.lootDrops = [];
        this.collectedLoot = []; // Histórico para evitar duplicatas
        
        // Configurações
        this.config = {
            autoCollectRange: 50, // Distância para auto-coleta
            pulseSpeed: 200, // Velocidade do efeito de pulso
            maxLootAge: 300000, // 5 minutos antes de desaparecer
            showNames: true,
            nameRange: 200
        };
    }

    // ========== GERENCIAMENTO DE LOOT ==========
    
    addLootDrop(dropData) {
        if (!dropData || !dropData.id) {
            console.warn('LootManager: Tentativa de adicionar loot sem ID');
            return null;
        }
        
        // Verificar se já foi coletado
        if (this.collectedLoot.includes(dropData.id)) {
            return null;
        }
        
        // Verificar se já existe
        const existing = this.lootDrops.find(l => l.id === dropData.id);
        if (existing) {
            Object.assign(existing, dropData);
            return existing;
        }
        
        const newLoot = {
            id: dropData.id,
            itemId: dropData.itemId || dropData.item?.id || 'unknown',
            itemName: dropData.itemName || dropData.item?.name || 'Item',
            x: dropData.x || 0,
            y: dropData.y || 0,
            quantity: dropData.quantity || 1,
            rarity: dropData.rarity || 'common',
            color: dropData.color || this.getRarityColor(dropData.rarity || 'common'),
            createdAt: Date.now(),
            ownerId: dropData.ownerId || null // Quem matou o mob (para shared loot)
        };
        
        this.lootDrops.push(newLoot);
        console.log(`💎 Loot drop criado: ${newLoot.itemName} x${newLoot.quantity}`);
        
        // Notificação no HUD
        if (this.engine.hud) {
            this.engine.hud.addChatMessage(`💎 ${newLoot.itemName} caiu no chão!`, this.getRarityColor(newLoot.rarity));
        }
        
        return newLoot;
    }
    
    removeLootDrop(dropId) {
        const index = this.lootDrops.findIndex(l => l.id === dropId);
        if (index >= 0) {
            const removed = this.lootDrops.splice(index, 1)[0];
            this.collectedLoot.push(dropId);
            console.log(`LootManager: Loot removido - ${removed.itemName}`);
            return removed;
        }
        return null;
    }
    
    clearLootDrops() {
        this.lootDrops = [];
        console.log('LootManager: Todos os loots removidos');
    }
    
    getLootById(dropId) {
        return this.lootDrops.find(l => l.id === dropId);
    }
    
    getLootInRange(x, y, range) {
        return this.lootDrops.filter(loot => {
            const dx = loot.x - x;
            const dy = loot.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= range;
        });
    }
    
    // ========== COLETA ==========
    
    tryCollectLoot(dropId, playerId) {
        const loot = this.getLootById(dropId);
        if (!loot) {
            console.warn('LootManager: Tentativa de coletar loot inexistente:', dropId);
            return { success: false, error: 'Loot não encontrado' };
        }
        
        // Verificar se o jogador está próximo o suficiente
        if (this.engine.player) {
            const dist = Math.hypot(loot.x - this.engine.player.x, loot.y - this.engine.player.y);
            if (dist > this.config.autoCollectRange * 1.5) {
                return { success: false, error: 'Muito longe' };
            }
        }
        
        // Coletar
        const collected = this.removeLootDrop(dropId);
        if (collected) {
            console.log(`💎 Coletado: ${collected.itemName} x${collected.quantity}`);
            
            // Notificação
            if (this.engine.hud) {
                const color = this.getRarityColor(collected.rarity);
                this.engine.hud.addChatMessage(`+${collected.quantity} ${collected.itemName}`, color);
            }
            
            return { 
                success: true, 
                item: collected,
                itemId: collected.itemId,
                quantity: collected.quantity
            };
        }
        
        return { success: false, error: 'Falha ao coletar' };
    }
    
    tryAutoCollect() {
        if (!this.engine.player) return [];
        
        const player = this.engine.player;
        const collected = [];
        
        // Encontrar loot próximo
        const nearbyLoot = this.getLootInRange(player.x, player.y, this.config.autoCollectRange);
        
        nearbyLoot.forEach(loot => {
            // Verificar se pode coletar (owner check para shared loot)
            if (loot.ownerId && loot.ownerId !== player.id) {
                // TODO: Implementar sistema de shared loot
                // Por enquanto, qualquer um pode coletar
            }
            
            const result = this.tryCollectLoot(loot.id, player.id);
            if (result.success) {
                collected.push(result);
            }
        });
        
        return collected;
    }
    
    // ========== RENDERIZAÇÃO ==========
    
    render(ctx, camera) {
        if (!ctx || !camera) return;
        
        const now = Date.now();
        
        this.lootDrops.forEach(loot => {
            // Verificar se está dentro da câmera
            if (this.isInCamera(loot, camera)) {
                this.renderLoot(ctx, loot, camera, now);
            }
        });
    }
    
    renderLoot(ctx, loot, camera, now) {
        const screenX = loot.x - camera.x;
        const screenY = loot.y - camera.y;
        
        // Efeito de pulso
        const pulse = Math.sin(now / this.config.pulseSpeed) * 2;
        const size = 8 + pulse * 0.5;
        
        ctx.save();
        
        // Brilho externo
        ctx.strokeStyle = loot.color || '#FFD54F';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + pulse * 0.1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 10 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        // Círculo principal
        ctx.fillStyle = loot.color || '#FFD54F';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Brilho interno
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(screenX - 2, screenY - 2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Nome do item
        if (this.config.showNames && this.engine.player) {
            const dist = Math.hypot(loot.x - this.engine.player.x, loot.y - this.engine.player.y);
            if (dist <= this.config.nameRange) {
                ctx.fillStyle = '#FFF';
                ctx.font = '11px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                
                // Sombra do texto
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 2;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                
                ctx.fillText(loot.itemName, screenX, screenY - 12);
                
                // Reset shadow
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Quantidade se > 1
                if (loot.quantity > 1) {
                    ctx.font = '9px Arial';
                    ctx.fillStyle = '#FFD54F';
                    ctx.fillText(`x${loot.quantity}`, screenX, screenY - 2);
                }
            }
        }
        
        ctx.restore();
    }
    
    isInCamera(entity, camera) {
        const margin = 50;
        return entity.x > camera.x - margin &&
               entity.x < camera.x + camera.width + margin &&
               entity.y > camera.y - margin &&
               entity.y < camera.y + camera.height + margin;
    }
    
    // ========== UTILITÁRIOS ==========
    
    getRarityColor(rarity) {
        const colors = {
            'common': '#9E9E9E',
            'uncommon': '#4CAF50',
            'rare': '#2196F3',
            'epic': '#9C27B0',
            'legendary': '#FF9800',
            'mythic': '#F44336'
        };
        return colors[rarity] || '#FFD54F';
    }
    
    getLootCount() {
        return this.lootDrops.length;
    }
    
    // ========== SINCRONIZAÇÃO COM SERVIDOR ==========
    
    handleLootDropCreated(data) {
        return this.addLootDrop(data);
    }
    
    handleLootCollected(data) {
        const removed = this.removeLootDrop(data.dropId);
        if (removed) {
            console.log(`Loot coletado por ${data.playerName || 'alguém'}: ${removed.itemName}`);
        }
        return removed;
    }
    
    syncLootFromServer(serverLoot) {
        if (!Array.isArray(serverLoot)) return;
        
        // Adicionar loots novos
        serverLoot.forEach(loot => {
            const existing = this.lootDrops.find(l => l.id === loot.id);
            if (!existing) {
                this.addLootDrop(loot);
            }
        });
        
        // Remover loots que não estão mais no servidor
        this.lootDrops = this.lootDrops.filter(loot => {
            const stillExists = serverLoot.some(sl => sl.id === loot.id);
            return stillExists;
        });
    }
    
    // ========== LIMPEZA ==========
    
    cleanupOldLoot() {
        const now = Date.now();
        const beforeCount = this.lootDrops.length;
        
        this.lootDrops = this.lootDrops.filter(loot => {
            return (now - loot.createdAt) < this.config.maxLootAge;
        });
        
        const removed = beforeCount - this.lootDrops.length;
        if (removed > 0) {
            console.log(`LootManager: ${removed} loots antigos removidos`);
        }
    }
    
    serializeForNetwork() {
        return this.lootDrops.map(loot => ({
            id: loot.id,
            itemId: loot.itemId,
            x: loot.x,
            y: loot.y,
            quantity: loot.quantity,
            rarity: loot.rarity
        }));
    }
}

// Exportar para uso global
window.LootManager = LootManager;
