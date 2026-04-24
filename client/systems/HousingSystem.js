/**
 * HousingSystem.js
 * Sistema de Moradia, Território e Base
 * Legacy of Komodo MMORPG v0.5.0
 */

class HousingSystem {
    constructor(playerManager, database) {
        this.playerManager = playerManager;
        this.db = database;
        
        // Tipos de propriedades
        this.propertyTypes = {
            apartment: {
                name: 'Apartamento',
                icon: '🏠',
                maxSize: 10,
                rooms: 2,
                cost: 5000,
                upkeep: 50
            },
            house: {
                name: 'Casa',
                icon: '🏡',
                maxSize: 20,
                rooms: 4,
                cost: 15000,
                upkeep: 150
            },
            mansion: {
                name: 'Mansão',
                icon: '🏰',
                maxSize: 40,
                rooms: 8,
                cost: 50000,
                upkeep: 500
            },
            guildhall: {
                name: 'Salão da Guild',
                icon: '⛪',
                maxSize: 100,
                rooms: 20,
                cost: 200000,
                upkeep: 2000,
                guildOnly: true
            }
        };
        
        // Categorias de decoração
        this.decorations = {
            furniture: ['chair', 'table', 'bed', 'bookshelf', 'wardrobe'],
            utilities: ['crafting_station', 'storage', 'teleport_pad', 'training_dummy'],
            decorative: ['painting', 'statue', 'plant', 'carpet', 'chandelier'],
            trophy: ['boss_trophy', 'achievement_display', 'rare_item_case']
        };
        
        // Buffs de moradia
        this.houseBuffs = {
            'rest': { hp_regen: 2, mp_regen: 2 },
            'crafting_station': { craft_speed: 0.25, craft_quality: 0.1 },
            'training_dummy': { xp_bonus: 0.05 },
            'teleport_pad': { recall_efficiency: 0.5 },
            'storage': { inventory_space: 50 }
        };
        
        console.log('🏠 HousingSystem initialized');
    }

    /**
     * Compra propriedade
     */
    async buyProperty(playerId, typeId, location) {
        const type = this.propertyTypes[typeId];
        if (!type) {
            return { success: false, error: 'Invalid property type' };
        }
        
        const player = await this.playerManager.getPlayer(playerId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }
        
        // Verifica se já tem propriedade
        if (player.property) {
            return { success: false, error: 'Already owns a property' };
        }
        
        // Verifica gold
        if (player.gold < type.cost) {
            return { success: false, error: 'Insufficient gold' };
        }
        
        // Verifica requisitos de guild
        if (type.guildOnly && !player.guildId) {
            return { success: false, error: 'Requires guild membership' };
        }
        
        // Cria propriedade
        const property = {
            id: this.generatePropertyId(),
            ownerId: playerId,
            type: typeId,
            location: location,
            name: `${player.name}'s ${type.name}`,
            decorations: [],
            rooms: this.generateRooms(type.rooms),
            buffs: [],
            visitors: [],
            createdAt: new Date().toISOString()
        };
        
        // Deduz gold
        player.gold -= type.cost;
        player.property = property.id;
        
        // Salva no banco
        await this.db.saveProperty(property);
        await this.playerManager.updatePlayer(player);
        
        console.log(`🏠 ${player.name} comprou ${type.name}`);
        
        return {
            success: true,
            property: property,
            message: `You now own a ${type.name}!`
        };
    }

    /**
     * Gera salas da propriedade
     */
    generateRooms(count) {
        const rooms = [];
        const roomTypes = ['main', 'bedroom', 'storage', 'crafting', 'garden', 'trophy'];
        
        for (let i = 0; i < count; i++) {
            rooms.push({
                id: `room_${i}`,
                type: roomTypes[i % roomTypes.length],
                decorations: [],
                maxDecorations: 5 + Math.floor(i / 2)
            });
        }
        
        return rooms;
    }

    /**
     * Adiciona decoração
     */
    async addDecoration(playerId, roomId, decorationId) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player || !player.property) {
            return { success: false, error: 'No property owned' };
        }
        
        const property = await this.db.getProperty(player.property);
        if (!property) {
            return { success: false, error: 'Property not found' };
        }
        
        // Verifica se decoração existe no inventário
        const hasDecoration = player.inventory.some(item => item.id === decorationId);
        if (!hasDecoration) {
            return { success: false, error: 'Decoration not in inventory' };
        }
        
        // Encontra sala
        const room = property.rooms.find(r => r.id === roomId);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }
        
        // Verifica limite
        if (room.decorations.length >= room.maxDecorations) {
            return { success: false, error: 'Room is full' };
        }
        
        // Adiciona
        const decoration = {
            id: decorationId,
            placedAt: new Date().toISOString(),
            position: { x: 0, y: 0 }, // Simplified
            rotation: 0
        };
        
        room.decorations.push(decoration);
        
        // Atualiza buffs
        this.updatePropertyBuffs(property);
        
        // Remove do inventário
        player.inventory = player.inventory.filter(item => item.id !== decorationId);
        
        // Salva
        await this.db.saveProperty(property);
        await this.playerManager.updatePlayer(player);
        
        return {
            success: true,
            decoration: decoration,
            buffs: property.buffs
        };
    }

    /**
     * Remove decoração
     */
    async removeDecoration(playerId, roomId, decorationId) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player || !player.property) {
            return { success: false, error: 'No property owned' };
        }
        
        const property = await this.db.getProperty(player.property);
        const room = property.rooms.find(r => r.id === roomId);
        
        if (!room) {
            return { success: false, error: 'Room not found' };
        }
        
        // Remove
        room.decorations = room.decorations.filter(d => d.id !== decorationId);
        
        // Retorna ao inventário
        player.inventory.push({ id: decorationId });
        
        // Atualiza buffs
        this.updatePropertyBuffs(property);
        
        // Salva
        await this.db.saveProperty(property);
        await this.playerManager.updatePlayer(player);
        
        return { success: true };
    }

    /**
     * Atualiza buffs da propriedade
     */
    updatePropertyBuffs(property) {
        const buffs = [];
        
        // Coleta todas as decorações
        const allDecorations = property.rooms.flatMap(r => r.decorations);
        
        // Verifica tipos e aplica buffs
        allDecorations.forEach(decoration => {
            for (const [buffType, buffData] of Object.entries(this.houseBuffs)) {
                if (decoration.id.includes(buffType)) {
                    buffs.push({
                        type: buffType,
                        ...buffData
                    });
                }
            }
        });
        
        property.buffs = buffs;
    }

    /**
     * Visita propriedade de outro jogador
     */
    async visitProperty(visitorId, propertyId) {
        const property = await this.db.getProperty(propertyId);
        if (!property) {
            return { success: false, error: 'Property not found' };
        }
        
        const visitor = await this.playerManager.getPlayer(visitorId);
        
        // Verifica permissões
        if (property.ownerId !== visitorId && !property.visitors.includes(visitorId)) {
            return { success: false, error: 'Not authorized to visit' };
        }
        
        // Adiciona à lista de visitantes
        if (!property.visitors.includes(visitorId)) {
            property.visitors.push(visitorId);
            await this.db.saveProperty(property);
        }
        
        // Aplica buffs temporários
        const tempBuffs = property.buffs.map(b => ({
            ...b,
            duration: 300 // 5 minutos
        }));
        
        return {
            success: true,
            property: property,
            tempBuffs: tempBuffs,
            owner: await this.playerManager.getPlayer(property.ownerId)
        };
    }

    /**
     * Descansa na propriedade (regeneração acelerada)
     */
    async rest(playerId) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player || !player.property) {
            return { success: false, error: 'No property owned' };
        }
        
        const property = await this.db.getProperty(player.property);
        
        // Verifica se está na propriedade
        // (Em implementação real, verificaria posição)
        
        // Aplica regeneração
        const restBuff = property.buffs.find(b => b.type === 'rest');
        const regenMultiplier = restBuff ? 3 : 2; // 3x com buff, 2x normal
        
        const hpRegen = (player.stats.maxHp * 0.1) * regenMultiplier;
        const mpRegen = (player.stats.maxMp * 0.1) * regenMultiplier;
        
        player.hp = Math.min(player.stats.maxHp, player.hp + hpRegen);
        player.mp = Math.min(player.stats.maxMp, player.mp + mpRegen);
        
        await this.playerManager.updatePlayer(player);
        
        return {
            success: true,
            hpRegenerated: hpRegen,
            mpRegenerated: mpRegen,
            message: 'You feel well rested!'
        };
    }

    /**
     * Crafting na propriedade
     */
    async craftAtHome(playerId, recipeId) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player || !player.property) {
            return { success: false, error: 'No property owned' };
        }
        
        const property = await this.db.getProperty(player.property);
        
        // Verifica se tem estação de crafting
        const hasCraftingStation = property.rooms.some(r =>
            r.decorations.some(d => d.id.includes('crafting'))
        );
        
        if (!hasCraftingStation) {
            return { success: false, error: 'No crafting station installed' };
        }
        
        // Aplica buff de crafting
        const craftBuff = property.buffs.find(b => b.type === 'crafting_station');
        const speedBonus = craftBuff ? craftBuff.craft_speed : 0;
        const qualityBonus = craftBuff ? craftBuff.craft_quality : 0;
        
        // Executa crafting com bonus
        // (Integraria com sistema de crafting)
        
        return {
            success: true,
            speedBonus: speedBonus,
            qualityBonus: qualityBonus,
            message: 'Crafting with home bonuses!'
        };
    }

    /**
     * Paga manutenção
     */
    async payUpkeep(playerId) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player || !player.property) {
            return { success: false, error: 'No property owned' };
        }
        
        const property = await this.db.getProperty(player.property);
        const type = this.propertyTypes[property.type];
        
        if (player.gold < type.upkeep) {
            return { success: false, error: 'Insufficient gold for upkeep' };
        }
        
        player.gold -= type.upkeep;
        property.lastUpkeep = new Date().toISOString();
        
        await this.db.saveProperty(property);
        await this.playerManager.updatePlayer(player);
        
        return {
            success: true,
            upkeep: type.upkeep,
            message: 'Upkeep paid successfully'
        };
    }

    /**
     * Vende propriedade
     */
    async sellProperty(playerId) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player || !player.property) {
            return { success: false, error: 'No property owned' };
        }
        
        const property = await this.db.getProperty(player.property);
        const type = this.propertyTypes[property.type];
        
        // Calcula valor de venda (70% do custo)
        const sellValue = Math.floor(type.cost * 0.7);
        
        // Devolve decorações
        property.rooms.forEach(room => {
            room.decorations.forEach(decoration => {
                player.inventory.push({ id: decoration.id });
            });
        });
        
        // Adiciona gold
        player.gold += sellValue;
        player.property = null;
        
        // Remove propriedade
        await this.db.deleteProperty(property.id);
        await this.playerManager.updatePlayer(player);
        
        return {
            success: true,
            sellValue: sellValue,
            message: `Property sold for ${sellValue} gold`
        };
    }

    /**
     * Lista propriedades disponíveis
     */
    getAvailableProperties() {
        return Object.entries(this.propertyTypes).map(([id, type]) => ({
            id,
            ...type
        }));
    }

    /**
     * Obtém estatísticas de propriedade
     */
    async getPropertyStats(playerId) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player || !player.property) {
            return null;
        }
        
        const property = await this.db.getProperty(player.property);
        const type = this.propertyTypes[property.type];
        
        const totalDecorations = property.rooms.reduce((sum, r) => sum + r.decorations.length, 0);
        
        return {
            type: type,
            rooms: property.rooms.length,
            decorations: totalDecorations,
            maxDecorations: type.maxSize,
            buffs: property.buffs,
            visitors: property.visitors.length,
            upkeep: type.upkeep
        };
    }

    /**
     * Gera ID único
     */
    generatePropertyId() {
        return `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Estatísticas
     */
    async getStats() {
        return {
            totalProperties: await this.db.countProperties(),
            byType: await this.db.countPropertiesByType(),
            avgDecorations: await this.db.avgDecorations(),
            mostVisited: await this.db.mostVisitedProperty()
        };
    }
}

// Exporta
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HousingSystem;
} else {
    window.HousingSystem = HousingSystem;
}
