/**
 * CraftingDetailedUI - Interface de Crafting Detalhada
 * 
 * Features:
 * - Visualização de recipes por profissão
 * - Ingredientes necessários com quantidades
 * - Preview do item resultante
 * - Chance de sucesso/qualidade
 * - Fila de crafting (queue)
 * - Crafting em massa
 * - Favoritos/bookmarks
 */

class CraftingDetailedUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.selectedProfession = null;
        this.selectedRecipe = null;
        this.recipes = [];
        this.inventory = {};
        this.craftingQueue = [];
        
        // Mock de recipes para demonstração
        this.MOCK_RECIPES = [
            // Weaponsmithing
            {
                id: 'iron_sword',
                name: 'Espada de Ferro',
                profession: 'weaponsmithing',
                tier: 1,
                icon: '⚔️',
                ingredients: [
                    { item: 'iron_ingot', name: 'Lingote de Ferro', quantity: 3, icon: '🔩' },
                    { item: 'wood_handle', name: 'Cabo de Madeira', quantity: 1, icon: '🪵' }
                ],
                output: { name: 'Espada de Ferro', quantity: 1, icon: '⚔️', gearScore: 200 },
                skillReq: 0,
                difficulty: 10
            },
            {
                id: 'iron_greatsword',
                name: 'Espada Larga de Ferro',
                profession: 'weaponsmithing',
                tier: 2,
                icon: '⚔️',
                ingredients: [
                    { item: 'iron_ingot', name: 'Lingote de Ferro', quantity: 5, icon: '🔩' },
                    { item: 'leather_grip', name: 'Cabo de Couro', quantity: 2, icon: '🧶' }
                ],
                output: { name: 'Espada Larga de Ferro', quantity: 1, icon: '⚔️', gearScore: 250 },
                skillReq: 25,
                difficulty: 30
            },
            {
                id: 'steel_sword',
                name: 'Espada de Aço',
                profession: 'weaponsmithing',
                tier: 3,
                icon: '⚔️',
                ingredients: [
                    { item: 'steel_ingot', name: 'Lingote de Aço', quantity: 4, icon: '🔩' },
                    { item: 'iron_ingot', name: 'Lingote de Ferro', quantity: 2, icon: '🔩' },
                    { item: 'leather_grip', name: 'Cabo de Couro', quantity: 1, icon: '🧶' }
                ],
                output: { name: 'Espada de Aço', quantity: 1, icon: '⚔️', gearScore: 350 },
                skillReq: 50,
                difficulty: 60
            },
            
            // Armoring
            {
                id: 'iron_chestplate',
                name: 'Peitoral de Ferro',
                profession: 'armoring',
                tier: 1,
                icon: '🛡️',
                ingredients: [
                    { item: 'iron_ingot', name: 'Lingote de Ferro', quantity: 6, icon: '🔩' },
                    { item: 'leather_strap', name: 'Tiras de Couro', quantity: 4, icon: '🧶' }
                ],
                output: { name: 'Peitoral de Ferro', quantity: 1, icon: '🛡️', gearScore: 200 },
                skillReq: 0,
                difficulty: 15
            },
            
            // Alchemy
            {
                id: 'health_potion_t1',
                name: 'Poção de Cura Menor',
                profession: 'alchemy',
                tier: 1,
                icon: '🧪',
                ingredients: [
                    { item: 'herb_leaf', name: 'Folha de Erva', quantity: 2, icon: '🌿' },
                    { item: 'water_flask', name: 'Frasco de Água', quantity: 1, icon: '💧' }
                ],
                output: { name: 'Poção de Cura Menor', quantity: 1, icon: '🧪', heal: 50 },
                skillReq: 0,
                difficulty: 5
            },
            {
                id: 'mana_potion_t1',
                name: 'Poção de Mana Menor',
                profession: 'alchemy',
                tier: 1,
                icon: '🧪',
                ingredients: [
                    { item: 'magic_herb', name: 'Erva Mágica', quantity: 2, icon: '✨' },
                    { item: 'water_flask', name: 'Frasco de Água', quantity: 1, icon: '💧' }
                ],
                output: { name: 'Poção de Mana Menor', quantity: 1, icon: '🧪', mana: 30 },
                skillReq: 5,
                difficulty: 8
            },
            {
                id: 'strength_tonic',
                name: 'Tônico de Força',
                profession: 'alchemy',
                tier: 2,
                icon: '⚗️',
                ingredients: [
                    { item: 'bear_meat', name: 'Carne de Urso', quantity: 1, icon: '🥩' },
                    { item: 'magic_herb', name: 'Erva Mágica', quantity: 3, icon: '✨' },
                    { item: 'water_flask', name: 'Frasco de Água', quantity: 1, icon: '💧' }
                ],
                output: { name: 'Tônico de Força', quantity: 1, icon: '⚗️', buff: 'STR+5' },
                skillReq: 30,
                difficulty: 35
            },
            
            // Cooking
            {
                id: 'cooked_meat',
                name: 'Carne Cozida',
                profession: 'cooking',
                tier: 1,
                icon: '🍖',
                ingredients: [
                    { item: 'raw_meat', name: 'Carne Crua', quantity: 1, icon: '🥩' },
                    { item: 'salt', name: 'Sal', quantity: 1, icon: '🧂' }
                ],
                output: { name: 'Carne Cozida', quantity: 1, icon: '🍖', food: 20 },
                skillReq: 0,
                difficulty: 3
            },
            {
                id: 'hearty_stew',
                name: 'Ensopado Recheado',
                profession: 'cooking',
                tier: 2,
                icon: '🥘',
                ingredients: [
                    { item: 'raw_meat', name: 'Carne Crua', quantity: 2, icon: '🥩' },
                    { item: 'vegetables', name: 'Vegetais', quantity: 3, icon: '🥕' },
                    { item: 'herb_leaf', name: 'Folha de Erva', quantity: 1, icon: '🌿' }
                ],
                output: { name: 'Ensopado Recheado', quantity: 1, icon: '🥘', food: 50, buff: 'HP+10' },
                skillReq: 20,
                difficulty: 25
            },
            
            // Engineering
            {
                id: 'simple_arrows',
                name: 'Flechas Simples',
                profession: 'engineering',
                tier: 1,
                icon: '🏹',
                ingredients: [
                    { item: 'wood_shaft', name: 'Haste de Madeira', quantity: 1, icon: '🪵' },
                    { item: 'iron_tip', name: 'Ponta de Ferro', quantity: 1, icon: '🔩' }
                ],
                output: { name: 'Flechas Simples', quantity: 10, icon: '🏹', damage: 5 },
                skillReq: 0,
                difficulty: 5
            },
            
            // Refining (Smelting)
            {
                id: 'smelt_iron',
                name: 'Fundir Ferro',
                profession: 'smelting',
                tier: 1,
                icon: '🔥',
                ingredients: [
                    { item: 'iron_ore', name: 'Minério de Ferro', quantity: 4, icon: '⛏️' }
                ],
                output: { name: 'Lingote de Ferro', quantity: 1, icon: '🔩' },
                skillReq: 0,
                difficulty: 0
            },
            {
                id: 'smelt_steel',
                name: 'Fundir Aço',
                profession: 'smelting',
                tier: 2,
                icon: '🔥',
                ingredients: [
                    { item: 'iron_ingot', name: 'Lingote de Ferro', quantity: 3, icon: '🔩' },
                    { item: 'coal', name: 'Carvão', quantity: 2, icon: '⚫' }
                ],
                output: { name: 'Lingote de Aço', quantity: 1, icon: '🔩' },
                skillReq: 50,
                difficulty: 40
            }
        ];
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
        
        // Inicializar com recipes mock (remover em produção)
        this.recipes = this.MOCK_RECIPES;
    }
    
    createUI() {
        // Container principal
        this.container = document.createElement('div');
        this.container.id = 'crafting-detailed-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 1000px;
            height: 700px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
            overflow: hidden;
        `;
        
        // Header
        const header = this.createHeader();
        this.container.appendChild(header);
        
        // Content
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            flex: 1;
            overflow: hidden;
        `;
        
        // Sidebar com filtros e lista
        this.sidebar = this.createSidebar();
        content.appendChild(this.sidebar);
        
        // Main panel
        this.mainPanel = this.createMainPanel();
        content.appendChild(this.mainPanel);
        
        // Right panel (preview)
        this.previewPanel = this.createPreviewPanel();
        content.appendChild(this.previewPanel);
        
        this.container.appendChild(content);
        
        // Queue/Footer
        const footer = this.createFooter();
        this.container.appendChild(footer);
        
        document.body.appendChild(this.container);
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #f59e0b, #d97706);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '⚒️ Crafting';
        title.style.cssText = `
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `;
        
        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            gap: 10px;
            align-items: center;
        `;
        
        // Search
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Buscar recipe...';
        searchInput.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 8px 12px;
            color: white;
            font-size: 13px;
            width: 180px;
        `;
        searchInput.oninput = (e) => this.filterRecipes(e.target.value);
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.onclick = () => this.hide();
        
        controls.appendChild(searchInput);
        controls.appendChild(closeBtn);
        
        header.appendChild(title);
        header.appendChild(controls);
        
        return header;
    }
    
    createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.style.cssText = `
            width: 280px;
            background: rgba(0, 0, 0, 0.3);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        
        // Filters
        const filters = document.createElement('div');
        filters.style.cssText = `
            padding: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        // Profissão filter
        const profLabel = document.createElement('div');
        profLabel.textContent = 'Profissão';
        profLabel.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 8px;
        `;
        
        this.professionFilter = document.createElement('select');
        this.professionFilter.style.cssText = `
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 8px;
            color: white;
            font-size: 13px;
            cursor: pointer;
        `;
        
        const professions = [
            { id: 'all', name: 'Todas' },
            { id: 'weaponsmithing', name: '⚔️ Armaria' },
            { id: 'armoring', name: '🛡️ Armaduraria' },
            { id: 'alchemy', name: '⚗️ Alquimia' },
            { id: 'cooking', name: '🍳 Culinária' },
            { id: 'engineering', name: '⚙️ Engenharia' },
            { id: 'smelting', name: '🔥 Fundição' }
        ];
        
        for (const prof of professions) {
            const option = document.createElement('option');
            option.value = prof.id;
            option.textContent = prof.name;
            option.style.cssText = 'background: #1a1a2e; color: white;';
            this.professionFilter.appendChild(option);
        }
        
        this.professionFilter.onchange = () => this.filterByProfession(this.professionFilter.value);
        
        // Tier filter
        const tierLabel = document.createElement('div');
        tierLabel.textContent = 'Tier';
        tierLabel.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.6);
            margin: 12px 0 8px 0;
        `;
        
        this.tierFilter = document.createElement('select');
        this.tierFilter.style.cssText = this.professionFilter.style.cssText;
        
        const tiers = [
            { id: 'all', name: 'Todos' },
            { id: '1', name: '⭐ Tier 1 - Iniciante' },
            { id: '2', name: '⭐⭐ Tier 2 - Aprendiz' },
            { id: '3', name: '⭐⭐⭐ Tier 3 - Especialista' },
            { id: '4', name: '⭐⭐⭐⭐ Tier 4 - Mestre' },
            { id: '5', name: '⭐⭐⭐⭐⭐ Tier 5 - Grão-Mestre' }
        ];
        
        for (const tier of tiers) {
            const option = document.createElement('option');
            option.value = tier.id;
            option.textContent = tier.name;
            option.style.cssText = 'background: #1a1a2e; color: white;';
            this.tierFilter.appendChild(option);
        }
        
        this.tierFilter.onchange = () => this.filterByTier(this.tierFilter.value);
        
        filters.appendChild(profLabel);
        filters.appendChild(this.professionFilter);
        filters.appendChild(tierLabel);
        filters.appendChild(this.tierFilter);
        
        // Recipe list
        const listHeader = document.createElement('div');
        listHeader.textContent = 'Recipes';
        listHeader.style.cssText = `
            padding: 12px 15px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.6);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        this.recipeList = document.createElement('div');
        this.recipeList.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        `;
        
        sidebar.appendChild(filters);
        sidebar.appendChild(listHeader);
        sidebar.appendChild(this.recipeList);
        
        return sidebar;
    }
    
    createMainPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        panel.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5);">
                <div style="font-size: 48px; margin-bottom: 20px;">⚒️</div>
                <h3 style="margin: 0 0 10px 0;">Selecione uma Recipe</h3>
                <p style="margin: 0; font-size: 14px;">Escolha uma recipe da lista para ver detalhes</p>
            </div>
        `;
        
        return panel;
    }
    
    createPreviewPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            width: 250px;
            background: rgba(0, 0, 0, 0.3);
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            padding: 20px;
            overflow-y: auto;
        `;
        
        panel.innerHTML = `
            <div style="text-align: center; color: rgba(255,255,255,0.4); padding: 40px 0;">
                <div style="font-size: 32px; margin-bottom: 10px;">📋</div>
                <p style="font-size: 12px; margin: 0;">Preview do item aparecerá aqui</p>
            </div>
        `;
        
        return panel;
    }
    
    createFooter() {
        const footer = document.createElement('div');
        footer.style.cssText = `
            background: rgba(0, 0, 0, 0.4);
            padding: 12px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
        `;
        
        this.queueInfo = document.createElement('div');
        this.queueInfo.innerHTML = 'Fila de Crafting: Vazia';
        this.queueInfo.style.cssText = `
            color: rgba(255, 255, 255, 0.7);
        `;
        
        footer.appendChild(this.queueInfo);
        
        return footer;
    }
    
    // ===== RECIPE LIST =====
    
    renderRecipeList() {
        this.recipeList.innerHTML = '';
        
        for (const recipe of this.recipes) {
            const item = this.createRecipeItem(recipe);
            this.recipeList.appendChild(item);
        }
    }
    
    createRecipeItem(recipe) {
        const item = document.createElement('div');
        item.className = 'recipe-item';
        item.dataset.recipeId = recipe.id;
        item.style.cssText = `
            display: flex;
            align-items: center;
            padding: 10px;
            margin: 4px 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
        `;
        
        // Tier color
        const tierColors = {
            1: '#9CA3AF',
            2: '#10B981',
            3: '#3B82F6',
            4: '#8B5CF6',
            5: '#F59E0B'
        };
        
        item.onmouseover = () => {
            item.style.background = 'rgba(255, 255, 255, 0.1)';
            item.style.borderColor = tierColors[recipe.tier];
        };
        
        item.onmouseout = () => {
            if (this.selectedRecipe !== recipe.id) {
                item.style.background = 'rgba(255, 255, 255, 0.05)';
                item.style.borderColor = 'transparent';
            }
        };
        
        item.onclick = () => this.selectRecipe(recipe);
        
        // Icon
        const icon = document.createElement('span');
        icon.textContent = recipe.icon;
        icon.style.cssText = `
            font-size: 24px;
            margin-right: 10px;
        `;
        
        // Info
        const info = document.createElement('div');
        info.style.cssText = 'flex: 1;';
        
        const name = document.createElement('div');
        name.textContent = recipe.name;
        name.style.cssText = `
            font-weight: 500;
            font-size: 13px;
            margin-bottom: 2px;
        `;
        
        const meta = document.createElement('div');
        meta.style.cssText = `
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
        `;
        meta.innerHTML = `
            <span style="color: ${tierColors[recipe.tier]};">Tier ${recipe.tier}</span> • 
            Nível ${recipe.skillReq}+
        `;
        
        info.appendChild(name);
        info.appendChild(meta);
        
        item.appendChild(icon);
        item.appendChild(info);
        
        return item;
    }
    
    selectRecipe(recipe) {
        this.selectedRecipe = recipe;
        
        // Highlight
        document.querySelectorAll('.recipe-item').forEach(el => {
            if (el.dataset.recipeId === recipe.id) {
                el.style.background = 'rgba(245, 158, 11, 0.2)';
                el.style.borderColor = '#f59e0b';
            } else {
                el.style.background = 'rgba(255, 255, 255, 0.05)';
                el.style.borderColor = 'transparent';
            }
        });
        
        this.updateMainPanel(recipe);
        this.updatePreviewPanel(recipe);
    }
    
    updateMainPanel(recipe) {
        // Check if can craft
        const canCraft = this.canCraft(recipe);
        const missingIngredients = this.getMissingIngredients(recipe);
        
        this.mainPanel.innerHTML = '';
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const icon = document.createElement('div');
        icon.textContent = recipe.icon;
        icon.style.cssText = `
            font-size: 48px;
            margin-right: 15px;
        `;
        
        const titleInfo = document.createElement('div');
        titleInfo.innerHTML = `
            <h3 style="margin: 0 0 8px 0; color: #f59e0b;">${recipe.name}</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
                <span style="
                    background: rgba(245, 158, 11, 0.2);
                    color: #f59e0b;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                ">Tier ${recipe.tier}</span>
                <span style="color: rgba(255,255,255,0.6); font-size: 13px;">
                    Nível ${recipe.skillReq} necessário
                </span>
            </div>
        `;
        
        header.appendChild(icon);
        header.appendChild(titleInfo);
        this.mainPanel.appendChild(header);
        
        // Ingredients
        const ingSection = document.createElement('div');
        ingSection.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
        `;
        
        const ingTitle = document.createElement('h4');
        ingTitle.textContent = '📦 Ingredientes';
        ingTitle.style.cssText = `
            margin: 0 0 12px 0;
            color: #f59e0b;
            font-size: 14px;
        `;
        
        ingSection.appendChild(ingTitle);
        
        for (const ing of recipe.ingredients) {
            const have = this.inventory[ing.item] || 0;
            const need = ing.quantity;
            const enough = have >= need;
            
            const ingRow = document.createElement('div');
            ingRow.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            `;
            
            ingRow.innerHTML = `
                <span style="font-size: 20px; margin-right: 10px;">${ing.icon}</span>
                <span style="flex: 1; font-size: 13px;">${ing.name}</span>
                <span style="
                    font-size: 13px;
                    font-weight: 600;
                    color: ${enough ? '#10b981' : '#ef4444'};
                ">${have}/${need}</span>
            `;
            
            ingSection.appendChild(ingRow);
        }
        
        this.mainPanel.appendChild(ingSection);
        
        // Craft button
        const craftSection = document.createElement('div');
        craftSection.style.cssText = `
            display: flex;
            gap: 10px;
            align-items: center;
        `;
        
        // Quantity selector
        const qtyContainer = document.createElement('div');
        qtyContainer.style.cssText = `
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            padding: 5px;
        `;
        
        const qtyBtnMinus = document.createElement('button');
        qtyBtnMinus.textContent = '-';
        qtyBtnMinus.style.cssText = `
            width: 30px;
            height: 30px;
            background: transparent;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
        `;
        
        this.craftQty = document.createElement('input');
        this.craftQty.type = 'number';
        this.craftQty.value = '1';
        this.craftQty.min = '1';
        this.craftQty.max = '99';
        this.craftQty.style.cssText = `
            width: 50px;
            text-align: center;
            background: transparent;
            border: none;
            color: white;
            font-size: 14px;
        `;
        
        const qtyBtnPlus = document.createElement('button');
        qtyBtnPlus.textContent = '+';
        qtyBtnPlus.style.cssText = qtyBtnMinus.style.cssText;
        
        qtyBtnMinus.onclick = () => {
            const val = parseInt(this.craftQty.value) || 1;
            if (val > 1) this.craftQty.value = val - 1;
        };
        
        qtyBtnPlus.onclick = () => {
            const val = parseInt(this.craftQty.value) || 1;
            if (val < 99) this.craftQty.value = val + 1;
        };
        
        qtyContainer.appendChild(qtyBtnMinus);
        qtyContainer.appendChild(this.craftQty);
        qtyContainer.appendChild(qtyBtnPlus);
        
        // Craft button
        const craftBtn = document.createElement('button');
        craftBtn.textContent = canCraft ? '⚒️ Craftar' : '❌ Ingredientes Insuficientes';
        craftBtn.style.cssText = `
            flex: 1;
            padding: 12px 20px;
            background: ${canCraft ? 'linear-gradient(45deg, #f59e0b, #d97706)' : '#666'};
            border: none;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            font-size: 14px;
            cursor: ${canCraft ? 'pointer' : 'not-allowed'};
            transition: all 0.2s;
        `;
        
        if (canCraft) {
            craftBtn.onmouseover = () => {
                craftBtn.style.transform = 'translateY(-2px)';
                craftBtn.style.boxShadow = '0 5px 15px rgba(245, 158, 11, 0.4)';
            };
            
            craftBtn.onmouseout = () => {
                craftBtn.style.transform = 'translateY(0)';
                craftBtn.style.boxShadow = 'none';
            };
            
            craftBtn.onclick = () => {
                const qty = parseInt(this.craftQty.value) || 1;
                this.craftItem(recipe, qty);
            };
        }
        
        craftSection.appendChild(qtyContainer);
        craftSection.appendChild(craftBtn);
        
        this.mainPanel.appendChild(craftSection);
    }
    
    updatePreviewPanel(recipe) {
        const tierColors = {
            1: '#9CA3AF',
            2: '#10B981',
            3: '#3B82F6',
            4: '#8B5CF6',
            5: '#F59E0B'
        };
        
        this.previewPanel.innerHTML = '';
        
        // Output preview
        const preview = document.createElement('div');
        preview.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-bottom: 15px;
        `;
        
        preview.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 15px;">${recipe.output.icon}</div>
            <h4 style="margin: 0 0 10px 0; color: #f59e0b;">${recipe.output.name}</h4>
            <div style="
                display: inline-block;
                background: ${tierColors[recipe.tier]};
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 10px;
            ">Tier ${recipe.tier}</div>
            <div style="color: rgba(255,255,255,0.7); font-size: 13px;">
                Quantidade: ${recipe.output.quantity}
            </div>
            ${recipe.output.gearScore ? `
                <div style="color: #f59e0b; font-size: 13px; margin-top: 8px;">
                    Gear Score: ${recipe.output.gearScore}
                </div>
            ` : ''}
        `;
        
        this.previewPanel.appendChild(preview);
        
        // Info section
        const infoSection = document.createElement('div');
        infoSection.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 15px;
        `;
        
        // Difficulty bar
        const difficultyPercent = Math.min(100, recipe.difficulty);
        
        infoSection.innerHTML = `
            <h4 style="margin: 0 0 12px 0; color: rgba(255,255,255,0.8); font-size: 13px;">📊 Informações</h4>
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                    <span style="color: rgba(255,255,255,0.6);">Dificuldade</span>
                    <span style="color: ${difficultyPercent > 50 ? '#ef4444' : '#10b981'};">${recipe.difficulty}</span>
                </div>
                <div style="
                    width: 100%;
                    height: 6px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 3px;
                    overflow: hidden;
                ">
                    <div style="
                        width: ${difficultyPercent}%;
                        height: 100%;
                        background: ${difficultyPercent > 50 ? '#ef4444' : '#10b981'};
                        border-radius: 3px;
                    "></div>
                </div>
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.6;">
                <div>🎯 Chance de Sucesso: ${Math.max(50, 100 - recipe.difficulty)}%</div>
                <div>✨ Qualidade Máxima: ${recipe.tier >= 4 ? 'Épico' : recipe.tier >= 3 ? 'Raro' : 'Incomum'}</div>
                <div>⚡ XP por Craft: ${recipe.difficulty * 2 + 10}</div>
            </div>
        `;
        
        this.previewPanel.appendChild(infoSection);
    }
    
    // ===== CRAFTING =====
    
    canCraft(recipe) {
        for (const ing of recipe.ingredients) {
            const have = this.inventory[ing.item] || 0;
            if (have < ing.quantity) {
                return false;
            }
        }
        return true;
    }
    
    getMissingIngredients(recipe) {
        const missing = [];
        for (const ing of recipe.ingredients) {
            const have = this.inventory[ing.item] || 0;
            if (have < ing.quantity) {
                missing.push({
                    ...ing,
                    missing: ing.quantity - have
                });
            }
        }
        return missing;
    }
    
    craftItem(recipe, quantity = 1) {
        console.log(`[CraftingUI] Crafting ${quantity}x ${recipe.name}`);
        
        // Add to queue
        this.addToQueue(recipe, quantity);
        
        // Send to server
        if (this.socket) {
            this.socket.emit('profession:craft', {
                professionId: recipe.profession,
                recipeId: recipe.id,
                quantity: quantity
            });
        }
        
        // Visual feedback
        this.game?.showFloatingText?.(`Crafting ${recipe.name}...`, 0, -40, '#f59e0b');
    }
    
    addToQueue(recipe, quantity) {
        const queueItem = {
            id: Date.now(),
            recipe: recipe,
            quantity: quantity,
            startTime: Date.now(),
            duration: recipe.difficulty * 500 + 2000 // Mock duration
        };
        
        this.craftingQueue.push(queueItem);
        this.updateQueueDisplay();
    }
    
    updateQueueDisplay() {
        if (this.craftingQueue.length === 0) {
            this.queueInfo.innerHTML = 'Fila de Crafting: Vazia';
        } else {
            this.queueInfo.innerHTML = `
                Fila de Crafting: ${this.craftingQueue.length} item(s)
                <span style="color: #f59e0b; margin-left: 10px;">
                    (${Math.ceil(this.craftingQueue[0].duration / 1000)}s)
                </span>
            `;
        }
    }
    
    // ===== FILTERS =====
    
    filterRecipes(searchTerm) {
        const term = searchTerm.toLowerCase();
        const items = this.recipeList.querySelectorAll('.recipe-item');
        
        items.forEach(item => {
            const recipeId = item.dataset.recipeId;
            const recipe = this.recipes.find(r => r.id === recipeId);
            
            if (recipe) {
                const match = recipe.name.toLowerCase().includes(term);
                item.style.display = match ? 'flex' : 'none';
            }
        });
    }
    
    filterByProfession(profession) {
        this.selectedProfession = profession === 'all' ? null : profession;
        this.applyFilters();
    }
    
    filterByTier(tier) {
        this.selectedTier = tier === 'all' ? null : parseInt(tier);
        this.applyFilters();
    }
    
    applyFilters() {
        const items = this.recipeList.querySelectorAll('.recipe-item');
        
        items.forEach(item => {
            const recipeId = item.dataset.recipeId;
            const recipe = this.recipes.find(r => r.id === recipeId);
            
            if (recipe) {
                let show = true;
                
                if (this.selectedProfession && recipe.profession !== this.selectedProfession) {
                    show = false;
                }
                
                if (this.selectedTier && recipe.tier !== this.selectedTier) {
                    show = false;
                }
                
                item.style.display = show ? 'flex' : 'none';
            }
        });
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (this.socket) {
            this.socket.on('profession:craft_result', (result) => {
                if (result.success) {
                    this.game?.showFloatingText?.(
                        `Craftado: ${result.name || result.item}`, 
                        0, -40, '#10b981'
                    );
                    
                    // Remove from queue
                    this.craftingQueue.shift();
                    this.updateQueueDisplay();
                } else {
                    this.game?.showFloatingText?.(
                        result.error || 'Crafting falhou', 
                        0, -40, '#ef4444'
                    );
                }
            });
        }
    }
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'k' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.toggle();
                }
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    // ===== SHOW/HIDE =====
    
    show(profession = null) {
        this.isVisible = true;
        this.container.style.display = 'flex';
        
        // Render recipe list
        this.renderRecipeList();
        
        // Set profession filter if specified
        if (profession) {
            this.professionFilter.value = profession;
            this.filterByProfession(profession);
        }
        
        if (this.game?.pause) {
            this.game.pause();
        }
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        
        if (this.game?.resume) {
            this.game.resume();
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Exportar
if (typeof window !== 'undefined') {
    window.CraftingDetailedUI = CraftingDetailedUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraftingDetailedUI;
}
