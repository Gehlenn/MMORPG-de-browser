/**
 * Item Entity Class
 * Represents items that can be picked up, equipped, or used
 */

import Entity from './Entity.js';

class Item extends Entity {
    constructor(config = {}) {
        super({
            type: 'item',
            solid: false,
            blocking: false,
            interactive: true,
            width: 0.5,
            height: 0.5,
            ...config
        });
        
        // Item-specific properties
        this.itemId = config.itemId || 'unknown_item';
        this.itemType = config.itemType || 'misc';
        this.rarity = config.rarity || 'common';
        this.quantity = config.quantity || 1;
        this.maxStack = config.maxStack || this.getMaxStackSize();
        this.quality = config.quality || 1.0; // 0.0 to 1.0
        
        // Item data (would normally come from item database)
        this.itemData = config.itemData || this.getDefaultItemData();
        
        // Visual properties
        this.glowIntensity = 0;
        this.floatOffset = 0;
        this.rotationAngle = 0;
        this.bobSpeed = Math.random() * 0.5 + 0.5;
        
        // Pickup properties
        this.autoPickup = config.autoPickup || false;
        this.pickupRange = config.pickupRange || 1;
        this.ownerId = config.ownerId || null; // For dropped items
        this.pickupTimer = config.pickupTimer || 0; // Trade protection timer
        this.expiresIn = config.expiresIn || 0; // Item expiration
        
        // Value
        this.value = config.value || this.calculateValue();
        this.sellPrice = config.sellPrice || Math.floor(this.value * 0.5);
        
        // Enchantments and upgrades
        this.enchantments = config.enchantments || [];
        this.upgradeLevel = config.upgradeLevel || 0;
        this.maxUpgradeLevel = config.maxUpgradeLevel || 9;
        
        // Durability (for equipment)
        this.durability = config.durability || null;
        this.maxDurability = config.maxDurability || null;
        
        // State
        this.pickedUp = false;
        this.beingPickedUp = false;
        this.spawnTime = Date.now();
        
        // Initialize
        this.initializeItem();
    }
    
    initializeItem() {
        // Set visual properties based on rarity
        this.updateVisualProperties();
        
        // Set pickup protection timer
        if (this.pickupTimer > 0) {
            this.ownerId = 'temporary';
        }
    }
    
    getDefaultItemData() {
        // This would normally come from a comprehensive item database
        const itemDatabase = {
            gold: { name: 'Gold', type: 'currency', color: '#ffd700', stackSize: 9999 },
            silver: { name: 'Silver', type: 'currency', color: '#c0c0c0', stackSize: 9999 },
            copper: { name: 'Copper', type: 'currency', color: '#b87333', stackSize: 9999 },
            health_potion: { name: 'Health Potion', type: 'consumable', color: '#ff0000', effect: 'heal', value: 50 },
            mana_potion: { name: 'Mana Potion', type: 'consumable', color: '#0000ff', effect: 'restore_mana', value: 30 },
            iron_sword: { name: 'Iron Sword', type: 'weapon', color: '#c0c0c0', damage: 15, value: 200 },
            leather_armor: { name: 'Leather Armor', type: 'armor', color: '#8b4513', defense: 10, value: 150 },
            magic_ring: { name: 'Magic Ring', type: 'accessory', color: '#9400d3', stats: { int: 5 }, value: 500 },
            monster_tooth: { name: 'Monster Tooth', type: 'material', color: '#f5f5dc', stackSize: 99, value: 10 },
            rare_gem: { name: 'Rare Gem', type: 'material', color: '#ff69b4', stackSize: 10, value: 1000 }
        };
        
        return itemDatabase[this.itemId] || {
            name: 'Unknown Item',
            type: 'misc',
            color: '#808080',
            stackSize: 1,
            value: 1
        };
    }
    
    getMaxStackSize() {
        const stackSizes = {
            currency: 9999,
            consumable: 99,
            material: 999,
            misc: 99,
            weapon: 1,
            armor: 1,
            accessory: 1
        };
        
        return stackSizes[this.itemType] || 1;
    }
    
    calculateValue() {
        let baseValue = this.itemData.value || 1;
        
        // Apply rarity multiplier
        const rarityMultipliers = {
            common: 1.0,
            uncommon: 1.5,
            rare: 2.5,
            epic: 5.0,
            legendary: 10.0,
            mythic: 25.0
        };
        
        baseValue *= rarityMultipliers[this.rarity] || 1.0;
        
        // Apply quality multiplier
        baseValue *= (0.5 + this.quality * 0.5);
        
        // Apply upgrade multiplier
        baseValue *= (1 + this.upgradeLevel * 0.2);
        
        // Apply enchantment value
        for (const enchantment of this.enchantments) {
            baseValue += this.getEnchantmentValue(enchantment);
        }
        
        return Math.floor(baseValue);
    }
    
    getEnchantmentValue(enchantment) {
        const enchantmentValues = {
            fire_damage: 100,
            ice_damage: 100,
            lightning_damage: 150,
            life_steal: 200,
            crit_chance: 150,
            crit_damage: 180,
            mana_regen: 120,
            attack_speed: 130,
            defense: 80,
            health: 60
        };
        
        const baseValue = enchantmentValues[enchantment.type] || 50;
        return baseValue * (enchantment.level || 1);
    }
    
    updateVisualProperties() {
        // Set color based on rarity
        const rarityColors = {
            common: '#ffffff',
            uncommon: '#1eff00',
            rare: '#0070dd',
            epic: '#a335ee',
            legendary: '#ff8000',
            mythic: '#e6cc80'
        };
        
        this.color = this.itemData.color || rarityColors[this.rarity] || '#ffffff';
        
        // Set glow intensity based on rarity
        const glowIntensities = {
            common: 0,
            uncommon: 0.3,
            rare: 0.5,
            epic: 0.7,
            legendary: 0.9,
            mythic: 1.0
        };
        
        this.glowIntensity = glowIntensities[this.rarity] || 0;
    }
    
    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);
        
        // Update visual effects
        this.updateVisualEffects(deltaTime);
        
        // Check expiration
        if (this.expiresIn > 0) {
            const age = Date.now() - this.spawnTime;
            if (age > this.expiresIn) {
                this.expire();
            }
        }
        
        // Check pickup timer
        if (this.pickupTimer > 0) {
            this.pickupTimer -= deltaTime;
            if (this.pickupTimer <= 0) {
                this.ownerId = null;
            }
        }
        
        // Check for auto pickup
        if (this.autoPickup && !this.beingPickedUp) {
            this.checkAutoPickup();
        }
    }
    
    updateVisualEffects(deltaTime) {
        // Floating animation
        this.floatOffset = Math.sin(Date.now() / 1000 * this.bobSpeed) * 3;
        
        // Rotation for rare items
        if (this.glowIntensity > 0.3) {
            this.rotationAngle += deltaTime / 1000;
        }
        
        // Pulsing glow for legendary+ items
        if (this.glowIntensity > 0.7) {
            const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
            this.opacity = 0.8 + pulse * 0.2;
        }
    }
    
    checkAutoPickup() {
        if (this.entityManager) {
            const nearbyEntities = this.entityManager.getEntitiesInRange(
                this.x, this.y, this.pickupRange
            );
            
            for (const entity of nearbyEntities) {
                if (entity.type === 'player' && this.canBePickedUpBy(entity)) {
                    this.pickup(entity);
                    break;
                }
            }
        }
    }
    
    canBePickedUpBy(player) {
        // Check ownership
        if (this.ownerId && this.ownerId !== player.id && this.pickupTimer > 0) {
            return false;
        }
        
        // Check inventory space
        if (this.itemType === 'currency') {
            return true; // Currency always fits
        }
        
        return player.inventory.length < player.inventorySize;
    }
    
    pickup(picker) {
        if (this.pickedUp || this.beingPickedUp) {
            return false;
        }
        
        this.beingPickedUp = true;
        
        // Add to picker's inventory
        const success = this.addToInventory(picker);
        
        if (success) {
            this.pickedUp = true;
            this.active = false;
            
            // Emit events
            this.emit('picked_up', { picker });
            picker.emit('item_picked_up', { item: this });
            
            // Remove from world
            if (this.entityManager) {
                this.entityManager.removeEntity(this.id);
            }
            
            return true;
        }
        
        this.beingPickedUp = false;
        return false;
    }
    
    addToInventory(player) {
        switch (this.itemType) {
            case 'currency':
                return this.addCurrency(player);
            case 'consumable':
            case 'material':
            case 'misc':
                return this.addStackableItem(player);
            case 'weapon':
            case 'armor':
            case 'accessory':
                return this.addEquipment(player);
            default:
                return player.addToInventory(this.itemId, this.quantity);
        }
    }
    
    addCurrency(player) {
        switch (this.itemId) {
            case 'gold':
                player.gold += this.quantity;
                break;
            case 'silver':
                player.silver += this.quantity;
                break;
            case 'copper':
                player.copper += this.quantity;
                break;
        }
        return true;
    }
    
    addStackableItem(player) {
        // Check if player already has this item
        let currentAmount = player.getItemCount(this.itemId);
        
        if (currentAmount > 0) {
            // Add to existing stack
            const availableSpace = this.maxStack - currentAmount;
            const amountToAdd = Math.min(this.quantity, availableSpace);
            
            if (amountToAdd > 0) {
                player.addToInventory(this.itemId, amountToAdd);
                this.quantity -= amountToAdd;
                
                if (this.quantity <= 0) {
                    return true; // All picked up
                }
            }
        }
        
        // Add new stacks if needed
        while (this.quantity > 0 && player.inventory.length < player.inventorySize) {
            const stackSize = Math.min(this.quantity, this.maxStack);
            player.addToInventory(this.itemId, stackSize);
            this.quantity -= stackSize;
        }
        
        return this.quantity <= 0;
    }
    
    addEquipment(player) {
        return player.addToInventory(this.itemId, this.quantity);
    }
    
    use(user) {
        if (this.itemData.type !== 'consumable') {
            return { success: false, reason: 'not_consumable' };
        }
        
        // Apply item effect
        const result = this.applyItemEffect(user);
        
        if (result.success) {
            // Remove one from stack
            this.quantity--;
            
            if (this.quantity <= 0) {
                // Item consumed
                this.emit('consumed', { user });
                return { success: true, consumed: true, ...result };
            } else {
                return { success: true, consumed: false, remaining: this.quantity, ...result };
            }
        }
        
        return result;
    }
    
    applyItemEffect(user) {
        switch (this.itemData.effect) {
            case 'heal':
                const healAmount = this.itemData.value || 50;
                const actualHeal = user.heal(healAmount);
                return { success: true, effect: 'heal', amount: actualHeal };
                
            case 'restore_mana':
                const manaAmount = this.itemData.value || 30;
                user.mana = Math.min(user.maxMana, user.mana + manaAmount);
                return { success: true, effect: 'restore_mana', amount: manaAmount };
                
            case 'buff':
                // Apply temporary buff
                user.addStatusEffect({
                    type: this.itemData.buffType || 'unknown_buff',
                    duration: this.itemData.duration || 60000,
                    value: this.itemData.value || 10
                });
                return { success: true, effect: 'buff', type: this.itemData.buffType };
                
            default:
                return { success: false, reason: 'unknown_effect' };
        }
    }
    
    equip(equipper) {
        if (!['weapon', 'armor', 'accessory'].includes(this.itemType)) {
            return { success: false, reason: 'not_equipment' };
        }
        
        // Determine equipment slot
        let slot = this.itemType;
        if (this.itemType === 'weapon') {
            slot = 'weapon';
        } else if (this.itemType === 'armor') {
            slot = 'armor';
        } else if (this.itemType === 'accessory') {
            // Find empty accessory slot
            if (!equipper.equipment.accessory1) {
                slot = 'accessory1';
            } else if (!equipper.equipment.accessory2) {
                slot = 'accessory2';
            } else {
                return { success: false, reason: 'no_free_slot' };
            }
        }
        
        // Equip the item
        const success = equipper.equipItem(this.itemId, slot);
        
        if (success) {
            this.emit('equipped', { equipper, slot });
            return { success: true, slot };
        }
        
        return { success: false, reason: 'equip_failed' };
    }
    
    upgrade() {
        if (this.upgradeLevel >= this.maxUpgradeLevel) {
            return { success: false, reason: 'max_level' };
        }
        
        // Calculate upgrade chance
        const upgradeChances = [1.0, 1.0, 0.95, 0.85, 0.70, 0.55, 0.40, 0.25, 0.15];
        const chance = upgradeChances[this.upgradeLevel] || 0.1;
        
        if (Math.random() < chance) {
            this.upgradeLevel++;
            this.value = this.calculateValue();
            this.emit('upgraded', { level: this.upgradeLevel });
            return { success: true, level: this.upgradeLevel };
        } else {
            this.emit('upgrade_failed', { level: this.upgradeLevel });
            return { success: false, reason: 'failed', level: this.upgradeLevel };
        }
    }
    
    enchant(enchantmentType, level = 1) {
        if (this.enchantments.length >= 3) {
            return { success: false, reason: 'max_enchantments' };
        }
        
        // Check if already enchanted with this type
        const existing = this.enchantments.find(e => e.type === enchantmentType);
        if (existing) {
            existing.level = Math.min(existing.level + 1, 5);
        } else {
            this.enchantments.push({ type: enchantmentType, level });
        }
        
        this.value = this.calculateValue();
        this.emit('enchanted', { type: enchantmentType, level });
        
        return { success: true, enchantments: this.enchantments };
    }
    
    expire() {
        this.active = false;
        this.emit('expired');
        
        if (this.entityManager) {
            this.entityManager.removeEntity(this.id);
        }
    }
    
    renderEffects(ctx, x, y) {
        super.renderEffects(ctx, x, y);
        
        // Apply floating offset
        const renderY = y + this.floatOffset;
        
        // Apply rotation
        if (this.rotationAngle !== 0) {
            ctx.save();
            ctx.translate(x + 16, renderY + 16);
            ctx.rotate(this.rotationAngle);
            ctx.translate(-16, -16);
        }
        
        // Render glow effect
        if (this.glowIntensity > 0) {
            const gradient = ctx.createRadialGradient(x + 16, renderY + 16, 0, x + 16, renderY + 16, 20);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.glowIntensity * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x - 4, renderY - 4, 40, 40);
        }
        
        // Render item
        this.renderItem(ctx, x, renderY);
        
        // Restore rotation
        if (this.rotationAngle !== 0) {
            ctx.restore();
        }
        
        // Render quantity for stackable items
        if (this.quantity > 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(this.quantity.toString(), x + 30, renderY + 28);
        }
        
        // Render pickup timer
        if (this.pickupTimer > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(x, renderY, 32, 4);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            const progress = 1 - (this.pickupTimer / 30000); // 30 second timer
            ctx.fillRect(x, renderY, 32 * progress, 4);
        }
    }
    
    renderItem(ctx, x, y) {
        // Render item based on type
        switch (this.itemType) {
            case 'currency':
                this.renderCurrency(ctx, x, y);
                break;
            case 'weapon':
                this.renderWeapon(ctx, x, y);
                break;
            case 'armor':
                this.renderArmor(ctx, x, y);
                break;
            default:
                this.renderDefaultItem(ctx, x, y);
        }
    }
    
    renderCurrency(ctx, x, y) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Currency symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('$', x + 16, y + 19);
    }
    
    renderWeapon(ctx, x, y) {
        ctx.fillStyle = this.color;
        ctx.fillRect(x + 10, y + 8, 4, 20);
        ctx.fillRect(x + 8, y + 6, 8, 4);
        ctx.fillRect(x + 12, y + 24, 8, 4);
    }
    
    renderArmor(ctx, x, y) {
        ctx.fillStyle = this.color;
        ctx.fillRect(x + 8, y + 8, 16, 16);
        ctx.fillRect(x + 6, y + 6, 4, 4);
        ctx.fillRect(x + 22, y + 6, 4, 4);
    }
    
    renderDefaultItem(ctx, x, y) {
        ctx.fillStyle = this.color;
        ctx.fillRect(x + 6, y + 6, 20, 20);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 6, y + 6, 20, 20);
    }
    
    // Utility methods
    getDisplayName() {
        let name = this.itemData.name || 'Unknown Item';
        
        if (this.upgradeLevel > 0) {
            name = `+${this.upgradeLevel} ${name}`;
        }
        
        if (this.enchantments.length > 0) {
            const enchantNames = this.enchantments.map(e => e.type.replace('_', ' '));
            name = `${name} (${enchantNames.join(', ')})`;
        }
        
        return name;
    }
    
    getTooltip() {
        return {
            name: this.getDisplayName(),
            rarity: this.rarity,
            type: this.itemType,
            quantity: this.quantity,
            value: this.value,
            description: this.itemData.description || '',
            stats: this.itemData.stats || {},
            enchantments: this.enchantments,
            upgradeLevel: this.upgradeLevel,
            quality: this.quality
        };
    }
    
    // Serialization
    serialize() {
        const baseData = super.serialize();
        
        return {
            ...baseData,
            itemId: this.itemId,
            itemType: this.itemType,
            rarity: this.rarity,
            quantity: this.quantity,
            maxStack: this.maxStack,
            quality: this.quality,
            itemData: this.itemData,
            autoPickup: this.autoPickup,
            pickupRange: this.pickupRange,
            ownerId: this.ownerId,
            pickupTimer: this.pickupTimer,
            expiresIn: this.expiresIn,
            value: this.value,
            sellPrice: this.sellPrice,
            enchantments: this.enchantments,
            upgradeLevel: this.upgradeLevel,
            durability: this.durability,
            maxDurability: this.maxDurability,
            spawnTime: this.spawnTime
        };
    }
    
    deserialize(data) {
        super.deserialize(data);
        
        this.itemId = data.itemId;
        this.itemType = data.itemType;
        this.rarity = data.rarity;
        this.quantity = data.quantity;
        this.maxStack = data.maxStack;
        this.quality = data.quality;
        this.itemData = data.itemData;
        this.autoPickup = data.autoPickup;
        this.pickupRange = data.pickupRange;
        this.ownerId = data.ownerId;
        this.pickupTimer = data.pickupTimer;
        this.expiresIn = data.expiresIn;
        this.value = data.value;
        this.sellPrice = data.sellPrice;
        this.enchantments = data.enchantments;
        this.upgradeLevel = data.upgradeLevel;
        this.durability = data.durability;
        this.maxDurability = data.maxDurability;
        this.spawnTime = data.spawnTime;
        
        this.updateVisualProperties();
    }
}

export default Item;
