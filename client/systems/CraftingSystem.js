/**
 * Crafting System - Professions and Item Creation
 * Version 0.4.0 - Crafting & Professions
 */

class CraftingSystem {
    constructor(game) {
        this.game = game;
        this.professions = this.initializeProfessions();
        this.recipes = this.initializeRecipes();
        this.activeCrafting = null;
        this.craftingQueue = [];
        
        this.initialize();
    }
    
    initialize() {
        this.createCraftingUI();
        this.setupEventListeners();
    }
    
    initializeProfessions() {
        return {
            blacksmith: {
                name: 'Ferreiro',
                icon: '🔨',
                description: 'Cria armas e armaduras de metal',
                maxLevel: 300,
                recipes: ['iron_sword', 'steel_armor', 'mithril_blade', 'legendary_weapon']
            },
            alchemist: {
                name: 'Alquimista',
                icon: '⚗️',
                description: 'Cria poções e elixires',
                maxLevel: 300,
                recipes: ['health_potion', 'mana_potion', 'strength_elixir', 'poison_antidote', 'phoenix_down']
            },
            tailor: {
                name: 'Alfaiate',
                icon: '🧵',
                description: 'Cria roupas e armaduras leves',
                maxLevel: 300,
                recipes: ['cloth_robe', 'leather_vest', 'silk_mantle', 'dragon_scale_armor']
            },
            enchanter: {
                name: 'Encantador',
                icon: '✨',
                description: 'Encanta itens com magia',
                maxLevel: 300,
                recipes: ['fire_enchant', 'ice_enchant', 'lightning_enchant', 'soul_bind']
            },
            cook: {
                name: 'Cozinheiro',
                icon: '🍳',
                description: 'Cria comidas que dão buffs',
                maxLevel: 300,
                recipes: ['hearty_stew', 'dragon_steak', 'mystic_soup', 'feast_platter']
            },
            jeweler: {
                name: 'Joalheiro',
                icon: '💎',
                description: 'Cria joias e acessórios',
                maxLevel: 300,
                recipes: ['silver_ring', 'gold_necklace', 'gem_crown', 'artifact_relic']
            }
        };
    }
    
    initializeRecipes() {
        return {
            // Blacksmith Recipes
            iron_sword: {
                name: 'Espada de Ferro',
                profession: 'blacksmith',
                level: 1,
                materials: [
                    { item: 'iron_ore', quantity: 3 },
                    { item: 'wood', quantity: 1 }
                ],
                time: 5000,
                result: { item: 'iron_sword', quantity: 1, quality: 1 },
                xpReward: 25
            },
            steel_armor: {
                name: 'Armadura de Aço',
                profession: 'blacksmith',
                level: 25,
                materials: [
                    { item: 'steel_ingot', quantity: 5 },
                    { item: 'leather', quantity: 2 }
                ],
                time: 15000,
                result: { item: 'steel_armor', quantity: 1, quality: 1.2 },
                xpReward: 75
            },
            mithril_blade: {
                name: 'Lâmina de Mithril',
                profession: 'blacksmith',
                level: 100,
                materials: [
                    { item: 'mithril_ore', quantity: 4 },
                    { item: 'flame_orb', quantity: 1 },
                    { item: 'soul_shard', quantity: 1 }
                ],
                time: 60000,
                result: { item: 'mithril_blade', quantity: 1, quality: 1.5 },
                xpReward: 200
            },
            legendary_weapon: {
                name: 'Arma Lendária',
                profession: 'blacksmith',
                level: 250,
                materials: [
                    { item: 'mithril_ore', quantity: 10 },
                    { item: 'golem_core', quantity: 2 },
                    { item: 'dragon_scale', quantity: 5 },
                    { item: 'ancient_artifact', quantity: 1 }
                ],
                time: 300000,
                result: { item: 'legendary_weapon', quantity: 1, quality: 2 },
                xpReward: 1000
            },
            
            // Alchemist Recipes
            health_potion: {
                name: 'Poção de Vida',
                profession: 'alchemist',
                level: 1,
                materials: [
                    { item: 'herb', quantity: 2 },
                    { item: 'slime_gel', quantity: 1 }
                ],
                time: 3000,
                result: { item: 'health_potion', quantity: 1, potency: 50 },
                xpReward: 20
            },
            mana_potion: {
                name: 'Poção de Mana',
                profession: 'alchemist',
                level: 5,
                materials: [
                    { item: 'mana_herb', quantity: 2 },
                    { item: 'ectoplasm', quantity: 1 }
                ],
                time: 4000,
                result: { item: 'mana_potion', quantity: 1, potency: 40 },
                xpReward: 25
            },
            strength_elixir: {
                name: 'Elixir de Força',
                profession: 'alchemist',
                level: 50,
                materials: [
                    { item: 'wolf_fang', quantity: 2 },
                    { item: 'fire_essence', quantity: 1 },
                    { item: 'ogre_blood', quantity: 1 }
                ],
                time: 20000,
                result: { item: 'strength_elixir', quantity: 1, duration: 300000, buff: { strength: 20 } },
                xpReward: 100
            },
            poison_antidote: {
                name: 'Antídoto',
                profession: 'alchemist',
                level: 30,
                materials: [
                    { item: 'venom_sac', quantity: 1 },
                    { item: 'healing_herb', quantity: 3 },
                    { item: 'holy_water', quantity: 1 }
                ],
                time: 10000,
                result: { item: 'poison_antidote', quantity: 1 },
                xpReward: 60
            },
            phoenix_down: {
                name: 'Pluma de Fênix',
                profession: 'alchemist',
                level: 200,
                materials: [
                    { item: 'fire_essence', quantity: 5 },
                    { item: 'soul_shard', quantity: 3 },
                    { item: 'phoenix_feather', quantity: 1 },
                    { item: 'life_crystal', quantity: 1 }
                ],
                time: 120000,
                result: { item: 'phoenix_down', quantity: 1, effect: 'revive' },
                xpReward: 500
            },
            
            // Tailor Recipes
            cloth_robe: {
                name: 'Túnica de Tecido',
                profession: 'tailor',
                level: 1,
                materials: [
                    { item: 'cotton', quantity: 4 }
                ],
                time: 4000,
                result: { item: 'cloth_robe', quantity: 1, defense: 5 },
                xpReward: 15
            },
            leather_vest: {
                name: 'Colete de Couro',
                profession: 'tailor',
                level: 15,
                materials: [
                    { item: 'leather', quantity: 3 },
                    { item: 'thread', quantity: 2 }
                ],
                time: 8000,
                result: { item: 'leather_vest', quantity: 1, defense: 12 },
                xpReward: 40
            },
            silk_mantle: {
                name: 'Manto de Seda',
                profession: 'tailor',
                level: 75,
                materials: [
                    { item: 'spider_silk', quantity: 5 },
                    { item: 'magic_thread', quantity: 2 },
                    { item: 'silver_dust', quantity: 1 }
                ],
                time: 30000,
                result: { item: 'silk_mantle', quantity: 1, defense: 20, magicResist: 15 },
                xpReward: 150
            },
            dragon_scale_armor: {
                name: 'Armadura de Escamas de Dragão',
                profession: 'tailor',
                level: 225,
                materials: [
                    { item: 'dragon_scale', quantity: 8 },
                    { item: 'mithril_thread', quantity: 3 },
                    { item: 'dragon_heart', quantity: 1 }
                ],
                time: 180000,
                result: { item: 'dragon_scale_armor', quantity: 1, defense: 50, fireResist: 30 },
                xpReward: 800
            },
            
            // Enchanter Recipes
            fire_enchant: {
                name: 'Encantamento de Fogo',
                profession: 'enchanter',
                level: 20,
                materials: [
                    { item: 'fire_essence', quantity: 3 },
                    { item: 'ember_stone', quantity: 1 },
                    { item: 'scroll', quantity: 1 }
                ],
                time: 15000,
                result: { item: 'fire_enchant', quantity: 1, damage: 10, effect: 'burn' },
                xpReward: 80
            },
            ice_enchant: {
                name: 'Encantamento de Gelo',
                profession: 'enchanter',
                level: 35,
                materials: [
                    { item: 'ice_crystal', quantity: 3 },
                    { item: 'frost_shard', quantity: 1 },
                    { item: 'scroll', quantity: 1 }
                ],
                time: 18000,
                result: { item: 'ice_enchant', quantity: 1, damage: 8, effect: 'freeze' },
                xpReward: 100
            },
            lightning_enchant: {
                name: 'Encantamento de Raio',
                profession: 'enchanter',
                level: 60,
                materials: [
                    { item: 'thunder_stone', quantity: 3 },
                    { item: 'storm_essence', quantity: 1 },
                    { item: 'scroll', quantity: 1 }
                ],
                time: 25000,
                result: { item: 'lightning_enchant', quantity: 1, damage: 15, effect: 'chain' },
                xpReward: 150
            },
            soul_bind: {
                name: 'Vínculo de Alma',
                profession: 'enchanter',
                level: 150,
                materials: [
                    { item: 'soul_shard', quantity: 5 },
                    { item: 'ectoplasm', quantity: 3 },
                    { item: 'life_crystal', quantity: 1 },
                    { item: 'ancient_scroll', quantity: 1 }
                ],
                time: 90000,
                result: { item: 'soul_bind', quantity: 1, effect: 'soulbound' },
                xpReward: 400
            },
            
            // Cook Recipes
            hearty_stew: {
                name: 'Ensopado Caseiro',
                profession: 'cook',
                level: 1,
                materials: [
                    { item: 'meat', quantity: 2 },
                    { item: 'vegetable', quantity: 2 },
                    { item: 'water', quantity: 1 }
                ],
                time: 6000,
                result: { item: 'hearty_stew', quantity: 2, heal: 30, buff: { hpRegen: 5 } },
                xpReward: 20
            },
            dragon_steak: {
                name: 'Bife de Dragão',
                profession: 'cook',
                level: 100,
                materials: [
                    { item: 'dragon_meat', quantity: 1 },
                    { item: 'fire_herb', quantity: 2 },
                    { item: 'spices', quantity: 1 }
                ],
                time: 30000,
                result: { item: 'dragon_steak', quantity: 1, heal: 100, buff: { strength: 15, fireResist: 10 } },
                xpReward: 180
            },
            mystic_soup: {
                name: 'Sopa Mística',
                profession: 'cook',
                level: 80,
                materials: [
                    { item: 'magic_mushroom', quantity: 3 },
                    { item: 'mana_herb', quantity: 2 },
                    { item: 'crystal_water', quantity: 1 }
                ],
                time: 25000,
                result: { item: 'mystic_soup', quantity: 1, mana: 50, buff: { manaRegen: 10, int: 10 } },
                xpReward: 140
            },
            feast_platter: {
                name: 'Banquete Real',
                profession: 'cook',
                level: 175,
                materials: [
                    { item: 'dragon_meat', quantity: 2 },
                    { item: 'golden_apple', quantity: 3 },
                    { item: 'magic_spices', quantity: 2 },
                    { item: 'wine', quantity: 1 }
                ],
                time: 60000,
                result: { item: 'feast_platter', quantity: 5, heal: 200, buff: { allStats: 20, duration: 600000 } },
                xpReward: 350
            },
            
            // Jeweler Recipes
            silver_ring: {
                name: 'Anel de Prata',
                profession: 'jeweler',
                level: 10,
                materials: [
                    { item: 'silver_ore', quantity: 2 },
                    { item: 'polish', quantity: 1 }
                ],
                time: 8000,
                result: { item: 'silver_ring', quantity: 1, stats: { luck: 2 } },
                xpReward: 35
            },
            gold_necklace: {
                name: 'Colar de Ouro',
                profession: 'jeweler',
                level: 40,
                materials: [
                    { item: 'gold_ore', quantity: 3 },
                    { item: 'gem', quantity: 1 },
                    { item: 'chain', quantity: 1 }
                ],
                time: 20000,
                result: { item: 'gold_necklace', quantity: 1, stats: { charisma: 5 } },
                xpReward: 90
            },
            gem_crown: {
                name: 'Coroa de Gemas',
                profession: 'jeweler',
                level: 120,
                materials: [
                    { item: 'gold_ore', quantity: 5 },
                    { item: 'diamond', quantity: 2 },
                    { item: 'ruby', quantity: 2 },
                    { item: 'sapphire', quantity: 2 }
                ],
                time: 60000,
                result: { item: 'gem_crown', quantity: 1, stats: { charisma: 15, luck: 10, wisdom: 5 } },
                xpReward: 300
            },
            artifact_relic: {
                name: 'Relíquia Antiga',
                profession: 'jeweler',
                level: 275,
                materials: [
                    { item: 'ancient_coin', quantity: 10 },
                    { item: 'soul_shard', quantity: 3 },
                    { item: 'legendary_gem', quantity: 1 },
                    { item: 'divine_blessing', quantity: 1 }
                ],
                time: 240000,
                result: { item: 'artifact_relic', quantity: 1, stats: { allStats: 10, special: 'divine_aura' } },
                xpReward: 900
            }
        };
    }
    
    createCraftingUI() {
        this.craftingPanel = document.createElement('div');
        this.craftingPanel.id = 'crafting-panel';
        this.craftingPanel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 700px;
            height: 500px;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            border: 3px solid #34495e;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: none;
            z-index: 1000;
            font-family: 'Segoe UI', Arial, sans-serif;
            overflow: hidden;
        `;
        
        this.craftingPanel.innerHTML = `
            <div style="background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%); 
                        padding: 15px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; color: #ecf0f1;">🛠️ Sistema de Crafting</h2>
                <button id="close-crafting" style="background: #e74c3c; color: white; border: none; 
                        border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 16px;">×</button>
            </div>
            <div style="display: flex; height: calc(100% - 60px);">
                <div id="profession-tabs" style="width: 150px; background: #1a252f; padding: 10px; overflow-y: auto;">
                    <!-- Profession tabs will be populated here -->
                </div>
                <div id="recipe-list" style="flex: 1; padding: 15px; overflow-y: auto;">
                    <!-- Recipes will be populated here -->
                </div>
                <div id="crafting-details" style="width: 200px; background: #1a252f; padding: 15px; color: #ecf0f1;">
                    <p style="color: #95a5a6; text-align: center;">Selecione uma receita</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.craftingPanel);
        
        // Close button
        this.craftingPanel.querySelector('#close-crafting').onclick = () => this.toggleCraftingUI();
        
        this.populateProfessionTabs();
    }
    
    populateProfessionTabs() {
        const tabsContainer = this.craftingPanel.querySelector('#profession-tabs');
        tabsContainer.innerHTML = '';
        
        Object.entries(this.professions).forEach(([key, profession]) => {
            const tab = document.createElement('div');
            tab.className = 'profession-tab';
            tab.dataset.profession = key;
            tab.style.cssText = `
                padding: 12px;
                margin-bottom: 5px;
                background: #2c3e50;
                border-radius: 8px;
                cursor: pointer;
                color: #ecf0f1;
                text-align: center;
                transition: all 0.3s;
            `;
            tab.innerHTML = `
                <div style="font-size: 24px;">${profession.icon}</div>
                <div style="font-size: 11px; margin-top: 5px;">${profession.name}</div>
            `;
            
            tab.addEventListener('click', () => this.selectProfession(key));
            tab.addEventListener('mouseenter', () => {
                tab.style.background = '#3498db';
            });
            tab.addEventListener('mouseleave', () => {
                if (this.selectedProfession !== key) {
                    tab.style.background = '#2c3e50';
                }
            });
            
            tabsContainer.appendChild(tab);
        });
    }
    
    selectProfession(professionKey) {
        this.selectedProfession = professionKey;
        
        // Update tab styles
        this.craftingPanel.querySelectorAll('.profession-tab').forEach(tab => {
            if (tab.dataset.profession === professionKey) {
                tab.style.background = '#3498db';
            } else {
                tab.style.background = '#2c3e50';
            }
        });
        
        this.showRecipesForProfession(professionKey);
    }
    
    showRecipesForProfession(professionKey) {
        const recipeList = this.craftingPanel.querySelector('#recipe-list');
        const profession = this.professions[professionKey];
        
        recipeList.innerHTML = `
            <h3 style="color: #ecf0f1; margin-bottom: 15px;">${profession.icon} ${profession.name}</h3>
            <p style="color: #95a5a6; margin-bottom: 20px;">${profession.description}</p>
        `;
        
        const recipeGrid = document.createElement('div');
        recipeGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
        `;
        
        profession.recipes.forEach(recipeKey => {
            const recipe = this.recipes[recipeKey];
            if (!recipe) return;
            
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            recipeCard.dataset.recipe = recipeKey;
            recipeCard.style.cssText = `
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                border: 2px solid #34495e;
                border-radius: 10px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.3s;
            `;
            
            const canCraft = this.canCraft(recipeKey);
            
            recipeCard.innerHTML = `
                <div style="font-weight: bold; color: ${canCraft ? '#ecf0f1' : '#7f8c8d'}; margin-bottom: 8px;">
                    ${recipe.name}
                </div>
                <div style="font-size: 11px; color: #95a5a6; margin-bottom: 5px;">
                    Nível: ${recipe.level}
                </div>
                <div style="font-size: 11px; color: #f39c12;">
                    ${recipe.time / 1000}s
                </div>
                <div style="font-size: 10px; color: ${canCraft ? '#2ecc71' : '#e74c3c'}; margin-top: 8px;">
                    ${canCraft ? '✓ Pode fabricar' : '✗ Materiais insuficientes'}
                </div>
            `;
            
            recipeCard.addEventListener('click', () => this.selectRecipe(recipeKey));
            recipeCard.addEventListener('mouseenter', () => {
                recipeCard.style.borderColor = '#3498db';
                recipeCard.style.transform = 'scale(1.02)';
            });
            recipeCard.addEventListener('mouseleave', () => {
                recipeCard.style.borderColor = '#34495e';
                recipeCard.style.transform = 'scale(1)';
            });
            
            recipeGrid.appendChild(recipeCard);
        });
        
        recipeList.appendChild(recipeGrid);
    }
    
    selectRecipe(recipeKey) {
        const recipe = this.recipes[recipeKey];
        const detailsPanel = this.craftingPanel.querySelector('#crafting-details');
        
        const canCraft = this.canCraft(recipeKey);
        
        let materialsHTML = '<div style="margin-bottom: 15px;"><strong style="color: #3498db;">Materiais:</strong>';
        recipe.materials.forEach(mat => {
            const hasEnough = this.hasItem(mat.item, mat.quantity);
            const itemName = this.getItemDisplayName(mat.item);
            materialsHTML += `
                <div style="font-size: 12px; color: ${hasEnough ? '#2ecc71' : '#e74c3c'}; margin: 5px 0;">
                    ${hasEnough ? '✓' : '✗'} ${itemName} x${mat.quantity}
                </div>
            `;
        });
        materialsHTML += '</div>';
        
        detailsPanel.innerHTML = `
            <h4 style="color: #ecf0f1; margin-bottom: 15px;">${recipe.name}</h4>
            ${materialsHTML}
            <div style="margin-bottom: 15px;">
                <strong style="color: #3498db;">Tempo:</strong>
                <span style="color: #ecf0f1;">${recipe.time / 1000} segundos</span>
            </div>
            <div style="margin-bottom: 15px;">
                <strong style="color: #3498db;">XP:</strong>
                <span style="color: #f39c12;">+${recipe.xpReward} XP</span>
            </div>
            <button id="craft-btn" 
                    style="width: 100%; padding: 12px; background: ${canCraft ? '#27ae60' : '#7f8c8d'}; 
                           color: white; border: none; border-radius: 5px; cursor: ${canCraft ? 'pointer' : 'not-allowed'};
                           font-size: 14px; font-weight: bold;"
                    ${canCraft ? '' : 'disabled'}>
                ${canCraft ? '🔨 Fabricar' : 'Materiais Insuficientes'}
            </button>
        `;
        
        if (canCraft) {
            detailsPanel.querySelector('#craft-btn').onclick = () => this.startCrafting(recipeKey);
        }
        
        this.selectedRecipe = recipeKey;
    }
    
    canCraft(recipeKey) {
        const recipe = this.recipes[recipeKey];
        if (!recipe) return false;
        
        // Check if player has required level in profession
        const playerProfessionLevel = this.getProfessionLevel(recipe.profession);
        if (playerProfessionLevel < recipe.level) return false;
        
        // Check materials
        return recipe.materials.every(mat => this.hasItem(mat.item, mat.quantity));
    }
    
    hasItem(itemId, quantity) {
        // This should check the player's inventory
        // For now, return a mock value - integrate with actual inventory
        return this.game.inventory && this.game.inventory.hasItem(itemId, quantity);
    }
    
    getProfessionLevel(profession) {
        // Get from player data
        return this.game.player.professions?.[profession] || 1;
    }
    
    getItemDisplayName(itemId) {
        const names = {
            iron_ore: 'Minério de Ferro',
            wood: 'Madeira',
            steel_ingot: 'Lingote de Aço',
            leather: 'Couro',
            mithril_ore: 'Minério de Mithril',
            flame_orb: 'Orbe de Chama',
            soul_shard: 'Fragmento de Alma',
            herb: 'Erva',
            slime_gel: 'Gel de Slime',
            mana_herb: 'Erva de Mana',
            ectoplasm: 'Ectoplasma',
            cotton: 'Algodão',
            thread: 'Linha',
            spider_silk: 'Seda de Aranha',
            magic_thread: 'Linha Mágica',
            silver_dust: 'Pó de Prata',
            scroll: 'Pergaminho',
            ice_crystal: 'Cristal de Gelo',
            thunder_stone: 'Pedra do Trovão',
            meat: 'Carne',
            vegetable: 'Vegetal',
            water: 'Água',
            gold_ore: 'Minério de Ouro',
            gem: 'Gema'
        };
        return names[itemId] || itemId;
    }
    
    startCrafting(recipeKey) {
        const recipe = this.recipes[recipeKey];
        if (!recipe || !this.canCraft(recipeKey)) return;
        
        // Consume materials
        recipe.materials.forEach(mat => {
            this.game.inventory.removeItem(mat.item, mat.quantity);
        });
        
        // Start crafting process
        this.activeCrafting = {
            recipe: recipeKey,
            startTime: Date.now(),
            endTime: Date.now() + recipe.time
        };
        
        this.showCraftingProgress();
        
        // Set timeout for completion
        setTimeout(() => {
            this.completeCrafting(recipeKey);
        }, recipe.time);
        
        // Update UI
        this.selectRecipe(recipeKey);
    }
    
    showCraftingProgress() {
        const detailsPanel = this.craftingPanel.querySelector('#crafting-details');
        
        const updateProgress = () => {
            if (!this.activeCrafting) return;
            
            const now = Date.now();
            const elapsed = now - this.activeCrafting.startTime;
            const total = this.activeCrafting.endTime - this.activeCrafting.startTime;
            const percent = Math.min(100, (elapsed / total) * 100);
            
            detailsPanel.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 32px; margin-bottom: 15px;">🔨</div>
                    <div style="color: #ecf0f1; margin-bottom: 10px;">Fabricando...</div>
                    <div style="background: #2c3e50; border-radius: 10px; height: 20px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #27ae60, #2ecc71); 
                                    width: ${percent}%; height: 100%; transition: width 0.1s;"></div>
                    </div>
                    <div style="color: #95a5a6; font-size: 12px; margin-top: 10px;">
                        ${Math.ceil((total - elapsed) / 1000)}s restantes
                    </div>
                </div>
            `;
            
            if (percent < 100) {
                requestAnimationFrame(updateProgress);
            }
        };
        
        updateProgress();
    }
    
    completeCrafting(recipeKey) {
        const recipe = this.recipes[recipeKey];
        if (!recipe) return;
        
        this.activeCrafting = null;
        
        // Add crafted item to inventory
        const result = { ...recipe.result };
        this.game.inventory.addItem(result);
        
        // Award profession XP
        this.awardProfessionXP(recipe.profession, recipe.xpReward);
        
        // Show notification
        this.showNotification(`✓ ${recipe.name} fabricado com sucesso!`, '#27ae60');
        
        // Update UI
        if (this.selectedProfession) {
            this.showRecipesForProfession(this.selectedProfession);
        }
    }
    
    awardProfessionXP(profession, amount) {
        if (!this.game.player.professions) {
            this.game.player.professions = {};
        }
        
        const currentLevel = this.getProfessionLevel(profession);
        const maxLevel = this.professions[profession].maxLevel;
        
        if (currentLevel < maxLevel) {
            // Simple level calculation: level = XP / 100
            const currentXP = (this.game.player.professions[profession + '_xp'] || 0) + amount;
            const newLevel = Math.min(maxLevel, Math.floor(currentXP / 100) + 1);
            
            this.game.player.professions[profession + '_xp'] = currentXP;
            
            if (newLevel > currentLevel) {
                this.game.player.professions[profession] = newLevel;
                this.showNotification(`🎉 ${this.professions[profession].name} nível ${newLevel}!`, '#f39c12');
            }
        }
    }
    
    showNotification(message, color) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1003;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    toggleCraftingUI() {
        const isVisible = this.craftingPanel.style.display === 'block';
        this.craftingPanel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible && this.selectedProfession) {
            this.showRecipesForProfession(this.selectedProfession);
        }
    }
    
    setupEventListeners() {
        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                if (e.target.tagName !== 'INPUT') {
                    this.toggleCraftingUI();
                }
            }
        });
    }
    
    // Public API methods
    addRecipe(recipeKey, recipe) {
        this.recipes[recipeKey] = recipe;
    }
    
    removeRecipe(recipeKey) {
        delete this.recipes[recipeKey];
    }
    
    getRecipesForProfession(profession) {
        return Object.entries(this.recipes)
            .filter(([_, recipe]) => recipe.profession === profession)
            .map(([key, recipe]) => ({ key, ...recipe }));
    }
    
    getAvailableRecipes() {
        return Object.entries(this.recipes)
            .filter(([key, _]) => this.canCraft(key))
            .map(([key, recipe]) => ({ key, ...recipe }));
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraftingSystem;
} else {
    window.CraftingSystem = CraftingSystem;
}
