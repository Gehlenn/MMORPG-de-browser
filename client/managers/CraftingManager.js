/**
 * CraftingManager - Sistema de Criação/Artesanato
 * 
 * Gerencia:
 * - Receitas de crafting
 * - Materiais necessários
 * - Níveis de profissão
 * - Produção de itens
 * - Desbloqueio de receitas
 */

class CraftingManager {
    constructor(playerId) {
        this.playerId = playerId;
        
        // Profissões disponíveis
        this.professions = {
            blacksmith: { name: 'Ferreiro', icon: '⚒️', level: 1, xp: 0, xpToNext: 100 },
            alchemist: { name: 'Alquimista', icon: '🧪', level: 1, xp: 0, xpToNext: 100 },
            tailor: { name: 'Alfaiate', icon: '🧵', level: 1, xp: 0, xpToNext: 100 },
            enchanter: { name: 'Encantador', icon: '✨', level: 1, xp: 0, xpToNext: 100 },
            cook: { name: 'Cozinheiro', icon: '🍳', level: 1, xp: 0, xpToNext: 100 }
        };
        
        // Receitas desbloqueadas
        this.unlockedRecipes = new Set([
            'iron_dagger', 'health_potion_small', 'linen_cloth', 'grilled_meat'
        ]);
        
        // Fila de crafting (para produção em massa)
        this.craftQueue = [];
        this.isCrafting = false;
        
        // Callbacks
        this.onCraftComplete = null;
        this.onRecipeUnlocked = null;
        this.onProfessionLevelUp = null;
        
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        this.loadFromStorage();
        this.initialized = true;
        
        console.log('⚒️ CraftingManager inicializado');
        console.log('   - Profissões:', Object.keys(this.professions).length);
        console.log('   - Receitas desbloqueadas:', this.unlockedRecipes.size);
    }
    
    // ===================== RECEITAS =====================
    
    /**
     * Retorna todas as receitas disponíveis
     */
    getAllRecipes() {
        return window.RecipeDatabase ? window.RecipeDatabase.getAll() : [];
    }
    
    /**
     * Retorna receitas por profissão
     */
    getRecipesByProfession(professionId) {
        if (!window.RecipeDatabase) return [];
        return window.RecipeDatabase.getByProfession(professionId);
    }
    
    /**
     * Retorna receitas desbloqueadas para uma profissão
     */
    getUnlockedRecipesForProfession(professionId) {
        const all = this.getRecipesByProfession(professionId);
        const profession = this.professions[professionId];
        
        return all.filter(recipe => {
            // Verificar se está desbloqueada
            if (!this.unlockedRecipes.has(recipe.id)) return false;
            
            // Verificar nível necessário
            if (recipe.requiredLevel > profession.level) return false;
            
            return true;
        });
    }
    
    /**
     * Verifica se pode craftar uma receita
     */
    canCraft(recipeId, inventoryManager) {
        const recipe = window.RecipeDatabase?.getById(recipeId);
        if (!recipe) return { canCraft: false, reason: 'recipe_not_found' };
        
        // Verificar nível de profissão
        const profession = this.professions[recipe.profession];
        if (profession.level < recipe.requiredLevel) {
            return { canCraft: false, reason: 'level_requirement', required: recipe.requiredLevel, current: profession.level };
        }
        
        // Verificar materiais
        const missingMaterials = [];
        for (const material of recipe.materials) {
            const hasAmount = inventoryManager?.countItem(material.id) || 0;
            if (hasAmount < material.quantity) {
                missingMaterials.push({
                    id: material.id,
                    name: material.name,
                    required: material.quantity,
                    has: hasAmount
                });
            }
        }
        
        if (missingMaterials.length > 0) {
            return { canCraft: false, reason: 'missing_materials', missing: missingMaterials };
        }
        
        // Verificar espaço no inventário
        if (inventoryManager?.isFull()) {
            return { canCraft: false, reason: 'inventory_full' };
        }
        
        return { canCraft: true };
    }
    
    // ===================== CRAFTING =====================
    
    /**
     * Crafta um item
     */
    craft(recipeId, inventoryManager, quantity = 1) {
        const check = this.canCraft(recipeId, inventoryManager);
        if (!check.canCraft) {
            return { success: false, reason: check.reason, missing: check.missing };
        }
        
        const recipe = window.RecipeDatabase.getById(recipeId);
        
        // Consumir materiais
        for (const material of recipe.materials) {
            const totalNeeded = material.quantity * quantity;
            
            // Encontrar e remover itens
            let remainingToRemove = totalNeeded;
            while (remainingToRemove > 0) {
                const items = inventoryManager.findItem(material.id);
                if (items.length === 0) break;
                
                const item = items[0];
                const removeQty = Math.min(remainingToRemove, item.quantity);
                inventoryManager.removeItem(item.slot, removeQty);
                remainingToRemove -= removeQty;
            }
        }
        
        // Criar item(s)
        const craftedItems = [];
        for (let i = 0; i < quantity; i++) {
            const newItem = {
                ...recipe.result,
                craftedAt: Date.now(),
                craftedBy: this.playerId,
                quality: this.calculateQuality(recipe.profession)
            };
            
            // Adicionar ao inventário
            const result = inventoryManager.addItem(newItem, recipe.result.quantity || 1, 'crafted');
            
            if (result.success) {
                craftedItems.push(newItem);
            }
        }
        
        // Ganhar XP de profissão
        const xpGained = (recipe.xpReward || 10) * quantity;
        this.addProfessionXP(recipe.profession, xpGained);
        
        // Evento
        if (this.onCraftComplete) {
            this.onCraftComplete(recipeId, craftedItems, xpGained);
        }
        
        // Som
        if (window.audioManager) {
            window.audioManager.playSFX('craft_success');
        }
        
        return {
            success: true,
            items: craftedItems,
            xpGained,
            quantity
        };
    }
    
    /**
     * Calcula qualidade do item baseado no nível de profissão
     */
    calculateQuality(professionId) {
        const profession = this.professions[professionId];
        const level = profession.level;
        
        // Chance de qualidade superior baseada no nível
        const roll = Math.random();
        
        if (level >= 50 && roll > 0.95) return 'legendary';
        if (level >= 40 && roll > 0.90) return 'epic';
        if (level >= 30 && roll > 0.80) return 'rare';
        if (level >= 20 && roll > 0.70) return 'uncommon';
        return 'common';
    }
    
    // ===================== XP E NÍVEIS =====================
    
    /**
     * Adiciona XP a uma profissão
     */
    addProfessionXP(professionId, amount) {
        const profession = this.professions[professionId];
        if (!profession) return;
        
        profession.xp += amount;
        
        // Verificar level up
        while (profession.xp >= profession.xpToNext) {
            profession.xp -= profession.xpToNext;
            profession.level++;
            profession.xpToNext = Math.floor(profession.xpToNext * 1.5);
            
            console.log(`⚒️ ${profession.name} level up! Nível ${profession.level}`);
            
            // Notificar
            if (this.onProfessionLevelUp) {
                this.onProfessionLevelUp(professionId, profession.level);
            }
            
            if (window.effectsManager) {
                window.effectsManager.showToast(
                    `${profession.name} nível ${profession.level}!`,
                    profession.icon,
                    '#FFD700'
                );
            }
            
            // Desbloquear novas receitas
            this.checkNewRecipes(professionId, profession.level);
        }
        
        this.saveToStorage();
    }
    
    /**
     * Verifica e desbloqueia novas receitas ao subir de nível
     */
    checkNewRecipes(professionId, level) {
        if (!window.RecipeDatabase) return;
        
        const recipes = window.RecipeDatabase.getByProfession(professionId);
        let newUnlocks = 0;
        
        for (const recipe of recipes) {
            if (recipe.requiredLevel === level && !this.unlockedRecipes.has(recipe.id)) {
                this.unlockedRecipes.add(recipe.id);
                newUnlocks++;
                
                console.log(`📜 Nova receita desbloqueada: ${recipe.name}`);
                
                if (this.onRecipeUnlocked) {
                    this.onRecipeUnlocked(recipe);
                }
            }
        }
        
        if (newUnlocks > 0) {
            this.saveToStorage();
        }
    }
    
    /**
     * Desbloqueia uma receita específica (por quest/recompensa)
     */
    unlockRecipe(recipeId) {
        if (this.unlockedRecipes.has(recipeId)) return false;
        
        const recipe = window.RecipeDatabase?.getById(recipeId);
        if (!recipe) return false;
        
        this.unlockedRecipes.add(recipeId);
        this.saveToStorage();
        
        console.log(`📜 Receita desbloqueada: ${recipe.name}`);
        
        if (this.onRecipeUnlocked) {
            this.onRecipeUnlocked(recipe);
        }
        
        if (window.effectsManager) {
            window.effectsManager.showToast(`Receita aprendida: ${recipe.name}`, '📜', '#BA68C8');
        }
        
        return true;
    }
    
    // ===================== CONSULTAS =====================
    
    /**
     * Retorna informação de uma profissão
     */
    getProfession(professionId) {
        return this.professions[professionId];
    }
    
    /**
     * Retorna todas as profissões
     */
    getAllProfessions() {
        return Object.entries(this.professions).map(([id, data]) => ({
            id,
            ...data
        }));
    }
    
    /**
     * Retorna progresso de profissão (0-100%)
     */
    getProfessionProgress(professionId) {
        const profession = this.professions[professionId];
        if (!profession) return 0;
        return Math.min(100, Math.floor((profession.xp / profession.xpToNext) * 100));
    }
    
    /**
     * Verifica se uma receita está desbloqueada
     */
    isRecipeUnlocked(recipeId) {
        return this.unlockedRecipes.has(recipeId);
    }
    
    // ===================== PERSISTÊNCIA =====================
    
    saveToStorage() {
        try {
            const data = {
                professions: this.professions,
                unlockedRecipes: Array.from(this.unlockedRecipes),
                savedAt: Date.now()
            };
            localStorage.setItem(`crafting_${this.playerId}`, JSON.stringify(data));
        } catch (e) {
            console.warn('⚠️ Erro ao salvar crafting:', e);
        }
    }
    
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(`crafting_${this.playerId}`);
            if (saved) {
                const data = JSON.parse(saved);
                
                if (data.professions) {
                    Object.assign(this.professions, data.professions);
                }
                
                if (data.unlockedRecipes) {
                    this.unlockedRecipes = new Set(data.unlockedRecipes);
                }
                
                console.log('⚒️ Progresso de crafting carregado');
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar crafting:', e);
        }
    }
    
    // ===================== UTILS =====================
    
    /**
     * Retorna resumo do crafting
     */
    getSummary() {
        return {
            professions: this.getAllProfessions(),
            totalRecipes: this.unlockedRecipes.size,
            canCraftAny: this.getAllRecipes().some(r => this.canCraft(r.id).canCraft)
        };
    }
    
    /**
     * Limpa dados (debug)
     */
    clear() {
        Object.keys(this.professions).forEach(key => {
            this.professions[key].level = 1;
            this.professions[key].xp = 0;
            this.professions[key].xpToNext = 100;
        });
        this.unlockedRecipes.clear();
        this.saveToStorage();
    }
}

window.CraftingManager = CraftingManager;
