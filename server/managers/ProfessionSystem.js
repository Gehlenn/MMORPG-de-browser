/**
 * ProfessionSystem - Sistema de Profissões (New World style)
 * 
 * Features:
 * - 5 Gathering skills (Mining, Logging, Harvesting, Fishing, Tracking)
 * - 5 Refining skills (Smelting, Weaving, Carpentry, Tanning, Stonecutting)
 * - 5 Crafting skills (Weaponsmithing, Armoring, Engineering, Alchemy, Cooking)
 * - Level 1-200 para cada profissão
 * - Rested XP bonus para profissões (descansar em town)
 * - Resource nodes no mundo (veins, trees, plants)
 * - Crafting stations necessárias
 * - Tier system (T1-T5 materiais/items)
 */

class ProfessionSystem {
    constructor(characterPersistence, itemDatabase) {
        this.characterPersistence = characterPersistence;
        this.itemDatabase = itemDatabase;
        
        // Max level para profissões (New World style: 1-200)
        this.MAX_PROF_LEVEL = 200;
        
        // Thresholds de tier baseado no level
        this.TIER_THRESHOLDS = {
            1: 0,    // Tier 1: 0-49
            2: 50,   // Tier 2: 50-99
            3: 100,  // Tier 3: 100-149
            4: 150,  // Tier 4: 150-199
            5: 200   // Tier 5: 200
        };
        
        // Tipos de profissões
        this.PROFESSION_TYPES = {
            GATHERING: 'gathering',
            REFINING: 'refining',
            CRAFTING: 'crafting'
        };
        
        // Definição de todas as profissões
        this.PROFESSIONS = {
            // === GATHERING (Coleta) ===
            mining: {
                id: 'mining',
                name: 'Mineração',
                type: 'gathering',
                icon: '⛏️',
                description: 'Extrai minérios de veins de pedra',
                resources: ['iron_ore', 'silver_ore', 'gold_ore', 'platinum_ore', 'orichalcum_ore'],
                tool: 'pickaxe'
            },
            logging: {
                id: 'logging',
                name: 'Corte de Madeira',
                type: 'gathering',
                icon: '🪓',
                description: 'Corta árvores para madeira',
                resources: ['green_wood', 'aged_wood', 'wyrd_wood', 'ironwood', 'glittering_wood'],
                tool: 'axe'
            },
            harvesting: {
                id: 'harvesting',
                name: 'Coleta',
                type: 'gathering',
                icon: '🌿',
                description: 'Coleta plantas e vegetais',
                resources: ['fiber', 'silk', 'wirefiber', 'cloth_weave', 'scalecord'],
                tool: 'sickle'
            },
            fishing: {
                id: 'fishing',
                name: 'Pesca',
                type: 'gathering',
                icon: '🎣',
                description: 'Pesca peixes em rios e oceanos',
                resources: ['mackerel', 'salmon', 'tuna', 'swordfish', 'legendary_fish'],
                tool: 'fishing_rod'
            },
            tracking: {
                id: 'tracking',
                name: 'Rastreamento',
                type: 'gathering',
                icon: '👣',
                description: 'Caça animais e coleta couros',
                resources: ['rawhide', 'leather', 'thick_leather', 'iron_hide', 'smolderhide'],
                tool: 'skinning_knife'
            },
            
            // === REFINING (Refinamento) ===
            smelting: {
                id: 'smelting',
                name: 'Fundição',
                type: 'refining',
                icon: '🔥',
                description: 'Refina minérios em barras de metal',
                converts: 'ore_to_ingot',
                station: 'smelter'
            },
            weaving: {
                id: 'weaving',
                name: 'Tecelagem',
                type: 'refining',
                icon: '🧵',
                description: 'Refina fibras em tecidos',
                converts: 'fiber_to_cloth',
                station: 'loom'
            },
            carpentry: {
                id: 'carpentry',
                name: 'Carpintaria',
                type: 'refining',
                icon: '🪚',
                description: 'Refina madeira em tábuas',
                converts: 'wood_to_lumber',
                station: 'woodshop'
            },
            tanning: {
                id: 'tanning',
                name: 'Curtição',
                type: 'refining',
                icon: '🛡️',
                description: 'Refina couros em couros trabalhados',
                converts: 'hide_to_leather',
                station: 'tannery'
            },
            stonecutting: {
                id: 'stonecutting',
                name: 'Lapidaria',
                type: 'refining',
                icon: '💎',
                description: 'Corta pedras preciosas e refina materiais de pedra',
                converts: 'stone_to_cut',
                station: 'stonecutter'
            },
            
            // === CRAFTING (Fabricação) ===
            weaponsmithing: {
                id: 'weaponsmithing',
                name: 'Armaria',
                type: 'crafting',
                icon: '⚔️',
                description: 'Cria armas corpo a corpo',
                items: ['sword', 'axe', 'hammer', 'spear', 'greatsword'],
                station: 'forge'
            },
            armoring: {
                id: 'armoring',
                name: 'Armaduraria',
                type: 'crafting',
                icon: '🛡️',
                description: 'Cria armaduras pesadas e leves',
                items: ['heavy_armor', 'light_armor', 'medium_armor', 'shield'],
                station: 'forge'
            },
            engineering: {
                id: 'engineering',
                name: 'Engenharia',
                type: 'crafting',
                icon: '⚙️',
                description: 'Cria armas de fogo, munição e ferramentas',
                items: ['musket', 'pistol', 'ammo', 'tools', 'traps'],
                station: 'workshop'
            },
            alchemy: {
                id: 'alchemy',
                name: 'Alquimia',
                type: 'crafting',
                icon: '⚗️',
                description: 'Cria poções, tônicos e encantamentos',
                items: ['health_potion', 'mana_potion', 'buff_tonic', 'dye'],
                station: 'alchemy_table'
            },
            cooking: {
                id: 'cooking',
                name: 'Culinária',
                type: 'crafting',
                icon: '🍳',
                description: 'Prepara comidas que dão buffs',
                items: ['meal', 'dessert', 'drink', 'provision'],
                station: 'kitchen'
            }
        };
        
        // Resource nodes no mundo
        this.RESOURCE_NODES = {
            // Mineração
            iron_vein: { type: 'mining', tier: 1, skillReq: 0, yield: 'iron_ore', respawn: 120000 },
            silver_vein: { type: 'mining', tier: 2, skillReq: 50, yield: 'silver_ore', respawn: 180000 },
            gold_vein: { type: 'mining', tier: 3, skillReq: 100, yield: 'gold_ore', respawn: 240000 },
            platinum_vein: { type: 'mining', tier: 4, skillReq: 150, yield: 'platinum_ore', respawn: 300000 },
            orichalcum_vein: { type: 'mining', tier: 5, skillReq: 175, yield: 'orichalcum_ore', respawn: 600000 },
            
            // Corte
            young_tree: { type: 'logging', tier: 1, skillReq: 0, yield: 'green_wood', respawn: 90000 },
            mature_tree: { type: 'logging', tier: 2, skillReq: 50, yield: 'aged_wood', respawn: 120000 },
            wyrdwood: { type: 'logging', tier: 3, skillReq: 100, yield: 'wyrd_wood', respawn: 180000 },
            ironwood_tree: { type: 'logging', tier: 4, skillReq: 150, yield: 'ironwood', respawn: 240000 },
            glittering_tree: { type: 'logging', tier: 5, skillReq: 175, yield: 'glittering_wood', respawn: 480000 },
            
            // Coleta
            fiber_plant: { type: 'harvesting', tier: 1, skillReq: 0, yield: 'fiber', respawn: 60000 },
            silk_plant: { type: 'harvesting', tier: 2, skillReq: 50, yield: 'silk', respawn: 90000 },
            wirefiber_plant: { type: 'harvesting', tier: 3, skillReq: 100, yield: 'wirefiber', respawn: 120000 },
            scalecord_plant: { type: 'harvesting', tier: 4, skillReq: 150, yield: 'scalecord', respawn: 180000 },
            blightroot: { type: 'harvesting', tier: 5, skillReq: 175, yield: 'blightroot', respawn: 360000 },
            
            // Rastreamento (animais)
            rabbit: { type: 'tracking', tier: 1, skillReq: 0, yield: 'rawhide', respawn: 60000 },
            deer: { type: 'tracking', tier: 2, skillReq: 50, yield: 'leather', respawn: 90000 },
            wolf: { type: 'tracking', tier: 3, skillReq: 100, yield: 'thick_leather', respawn: 120000 },
            bear: { type: 'tracking', tier: 4, skillReq: 150, yield: 'iron_hide', respawn: 180000 },
            corrupted_beast: { type: 'tracking', tier: 5, skillReq: 175, yield: 'smolderhide', respawn: 300000 }
        };
        
        // Configuração de Rested XP para profissões
        this.RESTED_XP = {
            maxAccumulated: 300000, // Máximo de XP rested acumulado
            accumulationRate: 100, // XP por hora de descanso (off-line ou em town)
            bonusMultiplier: 2.0, // 2x XP enquanto tiver rested
            consumptionRate: 1.0 // Consome 1 rested XP para cada 1 XP ganho
        };
        
        // Cache de recipes
        this.recipeCache = new Map();
    }
    
    initialize() {
        console.log('[ProfessionSystem] Sistema de profissões inicializado');
        this.startResourceRespawnTimer();
        this.startRestedXpAccumulationTimer();
    }
    
    // ============ GATHERING ============
    
    gatherResource(characterId, nodeId, position) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char) return { success: false, error: 'Personagem não encontrado' };
        
        const node = this.RESOURCE_NODES[nodeId];
        if (!node) return { success: false, error: 'Recurso não encontrado' };
        
        const professionId = node.type;
        const profData = this.getProfessionData(characterId, professionId);
        
        // Verificar skill requirement
        if (profData.level < node.skillReq) {
            return { 
                success: false, 
                error: `Nível de ${this.PROFESSIONS[professionId].name} muito baixo. Requer: ${node.skillReq}` 
            };
        }
        
        // Verificar se tem a ferramenta necessária
        const tool = this.PROFESSIONS[professionId].tool;
        if (!this.hasTool(char, tool)) {
            return { success: false, error: `Ferramenta necessária: ${tool}` };
        }
        
        // Calcular quantidade baseada no tier e luck
        const tierBonus = this.getTierBonus(profData.level);
        const luckBonus = this.calculateLuckBonus(profData.level, node.tier);
        const quantity = Math.floor(Math.random() * 2) + 1 + tierBonus;
        
        // Calcular XP (com rested bonus se tiver)
        const baseXp = node.tier * 50;
        const restedMultiplier = this.getRestedXpMultiplier(characterId, professionId);
        const finalXp = Math.floor(baseXp * restedMultiplier * (1 + luckBonus * 0.1));
        
        // Adicionar recurso ao inventário
        this.addToInventory(char, node.yield, quantity);
        
        // Ganhar XP na profissão
        const xpResult = this.addProfessionXp(characterId, professionId, finalXp);
        
        // Consumir rested XP se usou
        if (restedMultiplier > 1) {
            this.consumeRestedXp(characterId, professionId, finalXp / 2);
        }
        
        // Marcar node como coletado (respawn depois)
        this.markNodeAsCollected(nodeId, position, node.respawn);
        
        return {
            success: true,
            resource: node.yield,
            quantity,
            xp: finalXp,
            profession: professionId,
            levelUp: xpResult.leveledUp,
            newLevel: xpResult.newLevel,
            restedBonus: restedMultiplier > 1
        };
    }
    
    // ============ REFINING ============
    
    refineMaterial(characterId, professionId, materialId, quantity = 1) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char) return { success: false, error: 'Personagem não encontrado' };
        
        const profession = this.PROFESSIONS[professionId];
        if (!profession || profession.type !== 'refining') {
            return { success: false, error: 'Profissão de refinamento inválida' };
        }
        
        const profData = this.getProfessionData(characterId, professionId);
        
        // Verificar recipe
        const recipe = this.getRefiningRecipe(materialId);
        if (!recipe) return { success: false, error: 'Recipe não encontrada' };
        
        // Verificar skill requirement
        if (profData.level < recipe.skillReq) {
            return { success: false, error: `Nível ${recipe.skillReq} necessário` };
        }
        
        // Verificar materiais
        if (!this.hasMaterials(char, recipe.input, quantity)) {
            return { success: false, error: 'Materiais insuficientes' };
        }
        
        // Consumir materiais
        this.consumeMaterials(char, recipe.input, quantity);
        
        // Calcular yield (pode ganhar extras baseado no skill)
        const tierBonus = this.getTierBonus(profData.level);
        const outputQuantity = recipe.output.quantity * quantity + tierBonus;
        
        // Calcular XP
        const baseXp = recipe.xp * quantity;
        const restedMultiplier = this.getRestedXpMultiplier(characterId, professionId);
        const finalXp = Math.floor(baseXp * restedMultiplier);
        
        // Adicionar produto
        this.addToInventory(char, recipe.output.item, outputQuantity);
        
        // Ganhar XP
        const xpResult = this.addProfessionXp(characterId, professionId, finalXp);
        
        // Consumir rested XP
        if (restedMultiplier > 1) {
            this.consumeRestedXp(characterId, professionId, finalXp / 2);
        }
        
        return {
            success: true,
            output: recipe.output.item,
            quantity: outputQuantity,
            xp: finalXp,
            levelUp: xpResult.leveledUp,
            newLevel: xpResult.newLevel
        };
    }
    
    // ============ CRAFTING ============
    
    craftItem(characterId, professionId, recipeId, quantity = 1) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char) return { success: false, error: 'Personagem não encontrado' };
        
        const profession = this.PROFESSIONS[professionId];
        if (!profession || profession.type !== 'crafting') {
            return { success: false, error: 'Profissão de crafting inválida' };
        }
        
        const profData = this.getProfessionData(characterId, professionId);
        
        // Pegar recipe
        const recipe = this.getCraftingRecipe(recipeId);
        if (!recipe) return { success: false, error: 'Recipe não encontrada' };
        
        // Verificar skill
        if (profData.level < recipe.skillReq) {
            return { success: false, error: `Nível ${recipe.skillReq} necessário` };
        }
        
        // Verificar estação de crafting
        if (recipe.station && !this.isNearStation(char, recipe.station)) {
            return { success: false, error: `Estação necessária: ${recipe.station}` };
        }
        
        // Verificar materiais
        if (!this.hasMaterials(char, recipe.materials, quantity)) {
            return { success: false, error: 'Materiais insuficientes' };
        }
        
        // Calcular chance de sucesso e qualidade
        const successChance = this.calculateCraftSuccess(profData.level, recipe.difficulty);
        const roll = Math.random();
        
        if (roll > successChance) {
            // Falha - perde 50% dos materiais
            this.consumeMaterials(char, recipe.materials, Math.floor(quantity * 0.5));
            return { success: false, error: 'Crafting falhou!', materialsLost: Math.floor(quantity * 0.5) };
        }
        
        // Sucesso
        this.consumeMaterials(char, recipe.materials, quantity);
        
        // Calcular qualidade (pode ser normal, bom, excelente, épico)
        const quality = this.calculateQuality(profData.level, recipe.difficulty, roll);
        const gearScore = this.calculateGearScore(profData.level, recipe.tier, quality);
        
        // Calcular XP
        const baseXp = recipe.xp * quantity * (1 + quality * 0.2);
        const restedMultiplier = this.getRestedXpMultiplier(characterId, professionId);
        const finalXp = Math.floor(baseXp * restedMultiplier);
        
        // Criar item
        const item = this.createCraftedItem(recipe.output, quality, gearScore);
        this.addToInventory(char, item.id, quantity, { quality, gearScore });
        
        // Ganhar XP
        const xpResult = this.addProfessionXp(characterId, professionId, finalXp);
        
        // Consumir rested XP
        if (restedMultiplier > 1) {
            this.consumeRestedXp(characterId, professionId, finalXp / 2);
        }
        
        return {
            success: true,
            item: item.id,
            name: item.name,
            quality,
            gearScore,
            xp: finalXp,
            levelUp: xpResult.leveledUp,
            newLevel: xpResult.newLevel
        };
    }
    
    // ============ RESTED XP SYSTEM ============
    
    accumulateRestedXp(characterId, isInTown = false) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char) return;
        
        const now = Date.now();
        const lastOnline = char.data?.lastLogout || char.data?.lastSave || now;
        const hoursOffline = (now - lastOnline) / (1000 * 60 * 60);
        
        // Acumula XP rested por tempo off-line ou em town
        const accumulationMultiplier = isInTown ? 2 : 1; // 2x mais rápido em town
        const restedAmount = Math.floor(
            Math.min(hoursOffline * this.RESTED_XP.accumulationRate * accumulationMultiplier, 
            this.RESTED_XP.maxAccumulated)
        );
        
        if (restedAmount <= 0) return;
        
        // Distribuir entre todas as profissões
        const professions = Object.keys(this.PROFESSIONS);
        const restedPerProfession = Math.floor(restedAmount / professions.length);
        
        if (!char.data.professionsRestedXp) {
            char.data.professionsRestedXp = {};
        }
        
        for (const profId of professions) {
            const current = char.data.professionsRestedXp[profId] || 0;
            char.data.professionsRestedXp[profId] = Math.min(
                current + restedPerProfession,
                this.RESTED_XP.maxAccumulated
            );
        }
        
        // Também acumular rested XP normal de combate
        if (!char.data.restedXp) char.data.restedXp = 0;
        char.data.restedXp = Math.min(
            char.data.restedXp + restedAmount,
            this.RESTED_XP.maxAccumulated
        );
        
        char.save();
    }
    
    getRestedXpMultiplier(characterId, professionId = null) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char) return 1;
        
        // Se especificou profissão, verifica rested de profissão
        if (professionId && char.data?.professionsRestedXp?.[professionId] > 0) {
            return this.RESTED_XP.bonusMultiplier;
        }
        
        // Se não, verifica rested geral (para profissões)
        if (char.data?.professionsRestedXp && 
            Object.values(char.data.professionsRestedXp).some(xp => xp > 0)) {
            return this.RESTED_XP.bonusMultiplier;
        }
        
        return 1;
    }
    
    consumeRestedXp(characterId, professionId, amount) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char || !char.data?.professionsRestedXp?.[professionId]) return;
        
        char.data.professionsRestedXp[professionId] = Math.max(
            0,
            char.data.professionsRestedXp[professionId] - amount
        );
    }
    
    // ============ UTILITIES ============
    
    getProfessionData(characterId, professionId) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char) return { level: 1, xp: 0, maxXp: 100 };
        
        const professions = char.data?.professions || {};
        const prof = professions[professionId] || { level: 1, xp: 0 };
        
        return {
            ...prof,
            maxXp: this.calculateXpForLevel(prof.level),
            tier: this.getTierFromLevel(prof.level),
            restedXp: char.data?.professionsRestedXp?.[professionId] || 0
        };
    }
    
    addProfessionXp(characterId, professionId, xp) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char) return { leveledUp: false };
        
        if (!char.data.professions) char.data.professions = {};
        if (!char.data.professions[professionId]) {
            char.data.professions[professionId] = { level: 1, xp: 0 };
        }
        
        const prof = char.data.professions[professionId];
        prof.xp += xp;
        
        let leveledUp = false;
        let newLevel = prof.level;
        
        // Check level up
        while (newLevel < this.MAX_PROF_LEVEL) {
            const xpNeeded = this.calculateXpForLevel(newLevel);
            if (prof.xp >= xpNeeded) {
                prof.xp -= xpNeeded;
                newLevel++;
                leveledUp = true;
            } else {
                break;
            }
        }
        
        if (leveledUp) {
            prof.level = newLevel;
            this.notifyProfessionLevelUp(characterId, professionId, newLevel);
        }
        
        char.save();
        
        return { leveledUp, newLevel };
    }
    
    calculateXpForLevel(level) {
        // XP curve: cada level precisa de mais XP (exponencial suave)
        return Math.floor(100 * Math.pow(1.05, level - 1));
    }
    
    getTierFromLevel(level) {
        for (let tier = 5; tier >= 1; tier--) {
            if (level >= this.TIER_THRESHOLDS[tier]) return tier;
        }
        return 1;
    }
    
    getTierBonus(level) {
        const tier = this.getTierFromLevel(level);
        return Math.floor((tier - 1) * 0.5); // +0, +0.5, +1, +1.5, +2
    }
    
    calculateLuckBonus(level, resourceTier) {
        const tier = this.getTierFromLevel(level);
        return Math.max(0, tier - resourceTier + 1);
    }
    
    calculateCraftSuccess(level, difficulty) {
        const baseSuccess = 0.95;
        const levelAdvantage = (level - difficulty) * 0.02;
        return Math.min(0.99, Math.max(0.5, baseSuccess + levelAdvantage));
    }
    
    calculateQuality(level, difficulty, roll) {
        const successMargin = level - difficulty;
        if (roll < 0.05 && successMargin > 20) return 4; // Legendary
        if (roll < 0.15 && successMargin > 10) return 3; // Epic
        if (roll < 0.30 && successMargin > 0) return 2; // Rare
        if (roll < 0.50) return 1; // Uncommon
        return 0; // Common
    }
    
    calculateGearScore(level, itemTier, quality) {
        const base = itemTier * 100;
        const levelBonus = level * 2;
        const qualityBonus = quality * 25;
        return base + levelBonus + qualityBonus;
    }
    
    // ============ DATA METHODS ============
    
    getAllProfessions() {
        return Object.values(this.PROFESSIONS).map(p => ({
            id: p.id,
            name: p.name,
            type: p.type,
            icon: p.icon,
            description: p.description
        }));
    }
    
    getRefiningRecipe(materialId) {
        // Recipes de refinamento baseadas no material
        const recipes = {
            iron_ingot: { input: { iron_ore: 4 }, output: { item: 'iron_ingot', quantity: 1 }, skillReq: 0, xp: 40 },
            silver_ingot: { input: { silver_ore: 4 }, output: { item: 'silver_ingot', quantity: 1 }, skillReq: 50, xp: 80 },
            gold_ingot: { input: { gold_ore: 4 }, output: { item: 'gold_ingot', quantity: 1 }, skillReq: 100, xp: 120 },
            linen: { input: { fiber: 4 }, output: { item: 'linen', quantity: 1 }, skillReq: 0, xp: 30 },
            sateen: { input: { silk: 4 }, output: { item: 'sateen', quantity: 1 }, skillReq: 50, xp: 60 }
        };
        return recipes[materialId];
    }
    
    getCraftingRecipe(recipeId) {
        // Recipes de crafting (simplificado - em produção viriam do banco)
        return this.recipeCache.get(recipeId) || null;
    }
    
    // ============ NOTIFICATIONS ============
    
    notifyProfessionLevelUp(characterId, professionId, newLevel) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (!char?.socket) return;
        
        const prof = this.PROFESSIONS[professionId];
        const tier = this.getTierFromLevel(newLevel);
        
        char.socket.emit('profession:level_up', {
            professionId,
            professionName: prof.name,
            newLevel,
            tier,
            icon: prof.icon
        });
    }
    
    // ============ PLACEHOLDERS ============
    
    hasTool(char, tool) { return true; } // Implementar verificação real
    hasMaterials(char, materials, quantity) { return true; } // Implementar
    consumeMaterials(char, materials, quantity) {} // Implementar
    addToInventory(char, itemId, quantity, metadata = {}) {} // Implementar
    isNearStation(char, station) { return true; } // Implementar
    markNodeAsCollected(nodeId, position, respawnTime) {} // Implementar
    startResourceRespawnTimer() {} // Implementar
    startRestedXpAccumulationTimer() {} // Implementar
    createCraftedItem(itemId, quality, gearScore) { return { id: itemId, name: 'Item' }; }
}

module.exports = ProfessionSystem;
