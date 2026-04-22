/**
 * CraftingUI - Interface do Sistema de Crafting
 * 
 * Features:
 * - Seleção de profissão
 * - Lista de receitas desbloqueadas
 * - Preview de materiais necessários
 * - Crafting em massa
 * - Progresso de profissões
 */

class CraftingUI {
    constructor(craftingManager, inventoryManager) {
        this.craftingManager = craftingManager;
        this.inventoryManager = inventoryManager;
        this.visible = false;
        this.selectedProfession = 'blacksmith';
        this.selectedRecipe = null;
        this.craftQuantity = 1;
        this.elements = {};
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        this.createStyles();
        this.createCraftingPanel();
        this.bindKeys();
        
        this.initialized = true;
        console.log('⚒️ CraftingUI inicializado');
    }
    
    createStyles() {
        const styles = `
            .craft-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; display: none; opacity: 0; transition: opacity 0.2s; }
            .craft-overlay.active { display: flex; opacity: 1; justify-content: center; align-items: center; }
            .craft-panel { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #ff9800; border-radius: 12px; width: 800px; max-height: 85vh; overflow-y: auto; padding: 20px; box-shadow: 0 0 40px rgba(255,152,0,0.3); }
            .craft-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,152,0,0.3); }
            .craft-title { font-size: 20px; font-weight: bold; color: #ff9800; text-transform: uppercase; letter-spacing: 1px; }
            .craft-close { background: transparent; border: 1px solid #ff9800; color: #ff9800; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 18px; transition: all 0.2s; }
            .craft-close:hover { background: #ff9800; color: #1a1a2e; }
            .craft-content { display: grid; grid-template-columns: 180px 1fr 280px; gap: 16px; }
            .craft-professions { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; }
            .craft-prof-title { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 12px; }
            .craft-prof-item { display: flex; align-items: center; gap: 10px; padding: 10px; margin-bottom: 6px; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; }
            .craft-prof-item:hover { background: rgba(255,152,0,0.1); }
            .craft-prof-item.active { background: rgba(255,152,0,0.2); border-left-color: #ff9800; }
            .craft-prof-icon { font-size: 20px; }
            .craft-prof-info { flex: 1; }
            .craft-prof-name { font-size: 12px; font-weight: bold; color: white; }
            .craft-prof-level { font-size: 10px; color: #ff9800; }
            .craft-prof-bar { height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 4px; overflow: hidden; }
            .craft-prof-fill { height: 100%; background: linear-gradient(90deg, #ff9800, #ffc107); transition: width 0.3s; }
            .craft-recipes { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; max-height: 500px; overflow-y: auto; }
            .craft-recipes-title { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
            .craft-recipe-item { display: flex; align-items: center; gap: 10px; padding: 10px; margin-bottom: 6px; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
            .craft-recipe-item:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,152,0,0.3); }
            .craft-recipe-item.active { background: rgba(255,152,0,0.2); border-color: #ff9800; }
            .craft-recipe-item.locked { opacity: 0.5; cursor: not-allowed; }
            .craft-recipe-icon { font-size: 24px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border-radius: 6px; }
            .craft-recipe-info { flex: 1; }
            .craft-recipe-name { font-size: 12px; font-weight: bold; color: white; margin-bottom: 2px; }
            .craft-recipe-meta { font-size: 10px; color: #888; }
            .craft-recipe-result { text-align: right; }
            .craft-recipe-qty { font-size: 11px; color: #4ecca3; font-weight: bold; }
            .craft-details { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 16px; }
            .craft-details-empty { color: #666; text-align: center; padding: 40px 20px; }
            .craft-details-title { font-size: 16px; font-weight: bold; color: #ff9800; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
            .craft-details-desc { color: #aaa; font-size: 13px; margin-bottom: 16px; line-height: 1.4; }
            .craft-materials { margin-bottom: 16px; }
            .craft-materials-title { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 10px; }
            .craft-material { display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; margin-bottom: 6px; }
            .craft-material.have { border-left: 2px solid #4ecca3; }
            .craft-material.missing { border-left: 2px solid #e94560; }
            .craft-material-icon { font-size: 16px; }
            .craft-material-name { flex: 1; font-size: 12px; color: #ccc; }
            .craft-material-count { font-size: 11px; }
            .craft-material-count.have { color: #4ecca3; }
            .craft-material-count.missing { color: #e94560; }
            .craft-result { background: rgba(255,152,0,0.1); border: 1px solid rgba(255,152,0,0.3); border-radius: 6px; padding: 12px; margin-bottom: 16px; }
            .craft-result-title { font-size: 11px; color: #ff9800; text-transform: uppercase; margin-bottom: 8px; }
            .craft-result-item { display: flex; align-items: center; gap: 12px; }
            .craft-result-icon { font-size: 32px; }
            .craft-result-info { flex: 1; }
            .craft-result-name { font-size: 14px; font-weight: bold; color: white; }
            .craft-result-quality { font-size: 11px; }
            .craft-result-quality.common { color: #888; }
            .craft-result-quality.uncommon { color: #4ecca3; }
            .craft-result-quality.rare { color: #3498db; }
            .craft-result-quality.epic { color: #9b59b6; }
            .craft-result-quality.legendary { color: #ff9800; }
            .craft-actions { display: flex; flex-direction: column; gap: 10px; }
            .craft-quantity { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
            .craft-quantity-label { font-size: 12px; color: #888; }
            .craft-quantity-btn { width: 32px; height: 32px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; cursor: pointer; font-size: 16px; transition: all 0.2s; }
            .craft-quantity-btn:hover { background: rgba(255,152,0,0.3); border-color: #ff9800; }
            .craft-quantity-input { width: 50px; height: 32px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: white; text-align: center; border-radius: 4px; font-size: 14px; }
            .craft-btn { padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .craft-btn.primary { background: linear-gradient(135deg, #ff9800, #f57c00); color: white; }
            .craft-btn.primary:hover:not(:disabled) { background: linear-gradient(135deg, #ffa726, #ff9800); transform: translateY(-1px); }
            .craft-btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
            .craft-btn.secondary { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #888; }
            .craft-btn.secondary:hover { background: rgba(255,255,255,0.15); color: white; }
            .craft-xp-preview { text-align: center; font-size: 11px; color: #888; margin-top: 8px; }
            .craft-notification { position: fixed; bottom: 100px; right: 20px; background: rgba(26,26,46,0.95); border: 1px solid #4ecca3; border-radius: 8px; padding: 16px; z-index: 2000; transform: translateX(120%); transition: transform 0.3s; }
            .craft-notification.show { transform: translateX(0); }
            .craft-notification-title { font-weight: bold; color: #4ecca3; margin-bottom: 4px; }
            .craft-notification-text { font-size: 12px; color: #ccc; }
        `;
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    createCraftingPanel() {
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'craft-overlay';
        
        this.elements.panel = document.createElement('div');
        this.elements.panel.className = 'craft-panel';
        
        this.elements.panel.innerHTML = `
            <div class="craft-header">
                <div class="craft-title">⚒️ Artesanato</div>
                <button class="craft-close">×</button>
            </div>
            <div class="craft-content">
                <div class="craft-professions" id="craft-professions"></div>
                <div class="craft-recipes" id="craft-recipes"></div>
                <div class="craft-details" id="craft-details">
                    <div class="craft-details-empty">
                        <div style="font-size: 48px; margin-bottom: 16px;">⚒️</div>
                        Selecione uma profissão e receita
                    </div>
                </div>
            </div>
        `;
        
        this.elements.overlay.appendChild(this.elements.panel);
        document.body.appendChild(this.elements.overlay);
        
        this.elements.closeBtn = this.elements.panel.querySelector('.craft-close');
        this.elements.closeBtn.onclick = () => this.hide();
        
        // Notificação de crafting
        this.elements.notification = document.createElement('div');
        this.elements.notification.className = 'craft-notification';
        this.elements.notification.innerHTML = `
            <div class="craft-notification-title">✓ Item Criado!</div>
            <div class="craft-notification-text" id="craft-notif-text"></div>
        `;
        document.body.appendChild(this.elements.notification);
    }
    
    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'K' || e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }
    
    show() {
        this.visible = true;
        this.elements.overlay.classList.add('active');
        this.render();
        if (window.audioManager) window.audioManager.playSFX('ui_open');
    }
    
    hide() {
        this.visible = false;
        this.elements.overlay.classList.remove('active');
    }
    
    toggle() {
        if (this.visible) this.hide(); else this.show();
    }
    
    render() {
        this.renderProfessions();
        this.renderRecipes();
        this.renderDetails();
    }
    
    renderProfessions() {
        const container = document.getElementById('craft-professions');
        if (!container) return;
        
        const professions = this.craftingManager?.getAllProfessions() || [];
        
        container.innerHTML = `
            <div class="craft-prof-title">Profissões</div>
            ${professions.map(prof => {
                const progress = this.craftingManager?.getProfessionProgress(prof.id) || 0;
                const isActive = this.selectedProfession === prof.id;
                return `
                    <div class="craft-prof-item ${isActive ? 'active' : ''}" data-prof="${prof.id}">
                        <span class="craft-prof-icon">${prof.icon}</span>
                        <div class="craft-prof-info">
                            <div class="craft-prof-name">${prof.name}</div>
                            <div class="craft-prof-level">Nível ${prof.level}</div>
                            <div class="craft-prof-bar">
                                <div class="craft-prof-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
        
        container.querySelectorAll('.craft-prof-item').forEach(item => {
            item.onclick = () => {
                this.selectedProfession = item.dataset.prof;
                this.selectedRecipe = null;
                this.craftQuantity = 1;
                this.render();
            };
        });
    }
    
    renderRecipes() {
        const container = document.getElementById('craft-recipes');
        if (!container) return;
        
        const recipes = this.craftingManager?.getUnlockedRecipesForProfession(this.selectedProfession) || [];
        const profession = this.craftingManager?.getProfession(this.selectedProfession);
        
        container.innerHTML = `
            <div class="craft-recipes-title">
                <span>Receitas Desbloqueadas</span>
                <span style="color: #888; font-size: 10px;">${recipes.length} total</span>
            </div>
            ${recipes.length === 0 ? `
                <div style="color: #666; text-align: center; padding: 20px;">
                    Nenhuma receita desbloqueada<br>
                    <small>Suba de nível para desbloquear</small>
                </div>
            ` : recipes.map(recipe => {
                const isActive = this.selectedRecipe?.id === recipe.id;
                const canCraft = this.craftingManager?.canCraft(recipe.id, this.inventoryManager)?.canCraft;
                return `
                    <div class="craft-recipe-item ${isActive ? 'active' : ''} ${!canCraft ? 'locked' : ''}" data-recipe="${recipe.id}">
                        <div class="craft-recipe-icon">${recipe.result?.icon || '📦'}</div>
                        <div class="craft-recipe-info">
                            <div class="craft-recipe-name">${recipe.name}</div>
                            <div class="craft-recipe-meta">Nv. ${recipe.requiredLevel} • ${recipe.category || 'Item'}</div>
                        </div>
                        <div class="craft-recipe-result">
                            <div class="craft-recipe-qty">×${recipe.result?.quantity || 1}</div>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
        
        container.querySelectorAll('.craft-recipe-item').forEach(item => {
            item.onclick = () => {
                const recipeId = item.dataset.recipe;
                const recipes = this.craftingManager?.getUnlockedRecipesForProfession(this.selectedProfession) || [];
                this.selectedRecipe = recipes.find(r => r.id === recipeId);
                this.craftQuantity = 1;
                this.render();
            };
        });
    }
    
    renderDetails() {
        const container = document.getElementById('craft-details');
        if (!container) return;
        
        if (!this.selectedRecipe) {
            container.innerHTML = `
                <div class="craft-details-empty">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚒️</div>
                    Selecione uma receita para ver detalhes
                </div>
            `;
            return;
        }
        
        const recipe = this.selectedRecipe;
        const canCraftCheck = this.craftingManager?.canCraft(recipe.id, this.inventoryManager);
        const canCraft = canCraftCheck?.canCraft;
        
        // Renderizar materiais
        const materialsHtml = recipe.materials?.map(mat => {
            const have = this.inventoryManager?.countItem(mat.id) || 0;
            const haveEnough = have >= mat.quantity * this.craftQuantity;
            return `
                <div class="craft-material ${haveEnough ? 'have' : 'missing'}">
                    <span class="craft-material-icon">${mat.icon || '📦'}</span>
                    <span class="craft-material-name">${mat.name}</span>
                    <span class="craft-material-count ${haveEnough ? 'have' : 'missing'}">
                        ${have}/${mat.quantity * this.craftQuantity}
                    </span>
                </div>
            `;
        }).join('') || '<div style="color: #666; padding: 8px;">Nenhum material necessário</div>';
        
        container.innerHTML = `
            <div class="craft-details-title">
                <span>${recipe.result?.icon || '📦'}</span>
                ${recipe.name}
            </div>
            <div class="craft-details-desc">${recipe.description || 'Sem descrição'}</div>
            
            <div class="craft-materials">
                <div class="craft-materials-title">📦 Materiais Necessários</div>
                ${materialsHtml}
            </div>
            
            <div class="craft-result">
                <div class="craft-result-title">🎁 Resultado</div>
                <div class="craft-result-item">
                    <span class="craft-result-icon">${recipe.result?.icon || '📦'}</span>
                    <div class="craft-result-info">
                        <div class="craft-result-name">${recipe.result?.name || 'Item'}</div>
                        <div class="craft-result-quality common">Qualidade: Comum (pode melhorar)</div>
                    </div>
                    <span style="font-size: 20px; color: #4ecca3; font-weight: bold;">×${(recipe.result?.quantity || 1) * this.craftQuantity}</span>
                </div>
            </div>
            
            <div class="craft-actions">
                <div class="craft-quantity">
                    <span class="craft-quantity-label">Quantidade:</span>
                    <button class="craft-quantity-btn" id="craft-qty-minus">−</button>
                    <input type="number" class="craft-quantity-input" id="craft-qty-input" value="${this.craftQuantity}" min="1" max="99">
                    <button class="craft-quantity-btn" id="craft-qty-plus">+</button>
                </div>
                <button class="craft-btn primary" id="craft-btn-craft" ${!canCraft ? 'disabled' : ''}>
                    ⚒️ Criar ${this.craftQuantity > 1 ? `×${this.craftQuantity}` : ''}
                </button>
                ${!canCraft ? `<div style="color: #e94560; font-size: 11px; text-align: center; margin-top: 8px;">${this.getCraftErrorMessage(canCraftCheck?.reason)}</div>` : ''}
                <div class="craft-xp-preview">+${(recipe.xpReward || 10) * this.craftQuantity} XP de ${this.craftingManager?.professions[recipe.profession]?.name || 'Profissão'}</div>
            </div>
        `;
        
        // Eventos
        const minusBtn = document.getElementById('craft-qty-minus');
        const plusBtn = document.getElementById('craft-qty-plus');
        const qtyInput = document.getElementById('craft-qty-input');
        const craftBtn = document.getElementById('craft-btn-craft');
        
        if (minusBtn) {
            minusBtn.onclick = () => {
                if (this.craftQuantity > 1) {
                    this.craftQuantity--;
                    this.renderDetails();
                }
            };
        }
        
        if (plusBtn) {
            plusBtn.onclick = () => {
                if (this.craftQuantity < 99) {
                    this.craftQuantity++;
                    this.renderDetails();
                }
            };
        }
        
        if (qtyInput) {
            qtyInput.onchange = (e) => {
                let val = parseInt(e.target.value) || 1;
                val = Math.max(1, Math.min(99, val));
                this.craftQuantity = val;
                this.renderDetails();
            };
        }
        
        if (craftBtn) {
            craftBtn.onclick = () => this.performCraft();
        }
    }
    
    getCraftErrorMessage(reason) {
        const messages = {
            'recipe_not_found': 'Receita não encontrada',
            'level_requirement': 'Nível de profissão insuficiente',
            'missing_materials': 'Materiais insuficientes',
            'inventory_full': 'Inventário cheio'
        };
        return messages[reason] || 'Não pode criar';
    }
    
    performCraft() {
        if (!this.selectedRecipe) return;
        
        const result = this.craftingManager?.craft(
            this.selectedRecipe.id,
            this.inventoryManager,
            this.craftQuantity
        );
        
        if (result?.success) {
            this.showCraftNotification(result.items[0], result.quantity);
            this.render();
        } else {
            // Mostrar erro
            if (window.effectsManager) {
                window.effectsManager.showToast(
                    this.getCraftErrorMessage(result?.reason),
                    '⚠️',
                    '#e94560'
                );
            }
        }
    }
    
    showCraftNotification(item, quantity) {
        const notif = this.elements.notification;
        const text = document.getElementById('craft-notif-text');
        
        if (text) {
            text.textContent = `Você criou ${quantity > 1 ? quantity + 'x ' : ''}${item.name}`;
        }
        
        notif.classList.add('show');
        
        setTimeout(() => {
            notif.classList.remove('show');
        }, 3000);
    }
}

window.CraftingUI = CraftingUI;
