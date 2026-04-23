/**
 * HousingUI - Interface do Sistema de Housing/Moradias
 * 
 * Features:
 * - Compra de casas
 * - Decoração com móveis
 * - Armazenamento da casa
 * - Gerenciamento de visitantes
 * - Visualização de instância
 */

class HousingUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.currentTab = 'browse';
        this.availableHomes = [];
        this.currentHome = null;
        this.isInHome = false;
        this.furnitureCatalog = [];
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
    }
    
    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'housing-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 950px;
            height: 700px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #10b981;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
        `;
        
        const header = this.createHeader();
        this.container.appendChild(header);
        
        this.contentArea = document.createElement('div');
        this.contentArea.style.cssText = `
            flex: 1;
            overflow: hidden;
            display: flex;
        `;
        this.container.appendChild(this.contentArea);
        
        document.body.appendChild(this.container);
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #10b981, #059669);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '🏠 Sua Moradia';
        title.style.cssText = `
            margin: 0;
            font-size: 22px;
            font-weight: 600;
        `;
        
        this.statusDisplay = document.createElement('div');
        this.statusDisplay.style.cssText = `
            font-size: 14px;
            color: rgba(255,255,255,0.9);
        `;
        this.statusDisplay.innerHTML = 'Nenhuma casa';
        
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
        `;
        closeBtn.onclick = () => this.hide();
        
        header.appendChild(title);
        header.appendChild(this.statusDisplay);
        header.appendChild(closeBtn);
        
        return header;
    }
    
    renderContent() {
        this.contentArea.innerHTML = '';
        
        if (!this.currentHome) {
            this.renderBrowseTab();
        } else {
            this.renderManageTab();
        }
    }
    
    renderBrowseTab() {
        // Browse available homes
        const panel = document.createElement('div');
        panel.style.cssText = `
            flex: 1;
            padding: 25px;
            overflow-y: auto;
        `;
        
        const title = document.createElement('h3');
        title.textContent = '🏘️ Casas Disponíveis';
        title.style.cssText = 'margin: 0 0 20px 0; color: #10b981;';
        panel.appendChild(title);
        
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        `;
        
        this.availableHomes.forEach(home => {
            const card = this.createHomeCard(home, false);
            grid.appendChild(card);
        });
        
        panel.appendChild(grid);
        this.contentArea.appendChild(panel);
    }
    
    renderManageTab() {
        // Navigation tabs
        const nav = document.createElement('div');
        nav.style.cssText = `
            position: absolute;
            top: 70px;
            left: 20px;
            display: flex;
            gap: 10px;
        `;
        
        const tabs = [
            { id: 'enter', icon: '🚪', label: 'Entrar' },
            { id: 'decorate', icon: '🛋️', label: 'Decorar' },
            { id: 'storage', icon: '📦', label: 'Armazenamento' },
            { id: 'visitors', icon: '👥', label: 'Visitantes' },
            { id: 'settings', icon: '⚙️', label: 'Config' }
        ];
        
        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.innerHTML = `${tab.icon} ${tab.label}`;
            btn.style.cssText = `
                padding: 10px 18px;
                background: ${this.currentTab === tab.id ? '#10b981' : 'rgba(255,255,255,0.1)'};
                border: none;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
            `;
            btn.onclick = () => {
                this.currentTab = tab.id;
                this.renderManageTab();
            };
            nav.appendChild(btn);
        });
        
        // Tab content
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            padding: 70px 25px 25px 25px;
            overflow-y: auto;
        `;
        
        switch (this.currentTab) {
            case 'enter':
                content.appendChild(this.renderEnterTab());
                break;
            case 'decorate':
                content.appendChild(this.renderDecorateTab());
                break;
            case 'storage':
                content.appendChild(this.renderStorageTab());
                break;
            case 'visitors':
                content.appendChild(this.renderVisitorsTab());
                break;
            case 'settings':
                content.appendChild(this.renderSettingsTab());
                break;
        }
        
        this.contentArea.appendChild(nav);
        this.contentArea.appendChild(content);
    }
    
    renderEnterTab() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            text-align: center;
            padding: 40px;
        `;
        
        panel.innerHTML = `
            <div style="font-size: 80px; margin-bottom: 20px;">${this.currentHome?.template?.icon || '🏠'}</div>
            <h3 style="color: #10b981; margin-bottom: 10px;">${this.currentHome?.template?.name || 'Sua Casa'}</h3>
            <p style="color: rgba(255,255,255,0.7); margin-bottom: 30px;">
                ${this.currentHome?.template?.rooms || 0} cômodos • ${this.currentHome?.template?.maxFurniture || 0} móveis máx
            </p>
            <button id="enter-home-btn" style="
                padding: 15px 40px;
                background: linear-gradient(45deg, #10b981, #059669);
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 18px;
                font-weight: 600;
                cursor: pointer;
            ">🏠 Entrar na Casa</button>
            
            ${this.currentHome?.maintenanceDebt > 0 ? `
                <div style="margin-top: 30px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 15px; border-radius: 10px;">
                    <div style="color: #ef4444; font-weight: 600; margin-bottom: 5px;">⚠️ Manutenção Pendente</div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 10px;">
                        Débito: <span style="color: #ffd700; font-weight: 600;">${this.currentHome.maintenanceDebt}g</span>
                    </div>
                    <button id="pay-maintenance-btn" style="
                        padding: 8px 20px;
                        background: #f59e0b;
                        border: none;
                        border-radius: 6px;
                        color: #000;
                        font-weight: 600;
                        cursor: pointer;
                    ">Pagar Agora</button>
                </div>
            ` : ''}
        `;
        
        setTimeout(() => {
            const enterBtn = panel.querySelector('#enter-home-btn');
            if (enterBtn) {
                enterBtn.onclick = () => {
                    this.socket?.emit('housing:enter');
                    this.hide();
                };
            }
            
            const payBtn = panel.querySelector('#pay-maintenance-btn');
            if (payBtn) {
                payBtn.onclick = () => {
                    this.socket?.emit('housing:pay_maintenance');
                };
            }
        }, 0);
        
        return panel;
    }
    
    renderDecorateTab() {
        const panel = document.createElement('div');
        
        panel.innerHTML = `
            <h4 style="color: #10b981; margin-bottom: 15px;">🛋️ Catálogo de Móveis</h4>
            <div style="font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 20px;">
                Móveis atuais: ${this.currentHome?.furniture?.length || 0}/${this.currentHome?.template?.maxFurniture || 0}
            </div>
        `;
        
        const categories = ['storage', 'seating', 'surface', 'crafting', 'decoration', 'bed'];
        
        categories.forEach(cat => {
            const catSection = document.createElement('div');
            catSection.style.cssText = 'margin-bottom: 25px;';
            
            const catTitle = document.createElement('h5');
            catTitle.textContent = this.getCategoryName(cat);
            catTitle.style.cssText = 'color: rgba(255,255,255,0.8); margin-bottom: 12px; text-transform: uppercase; font-size: 12px;';
            catSection.appendChild(catTitle);
            
            const grid = document.createElement('div');
            grid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 12px;
            `;
            
            // Would populate from actual furniture catalog
            // For now, show placeholder
            grid.innerHTML = '<div style="color: rgba(255,255,255,0.4); font-size: 13px;">Catálogo carregando...</div>';
            
            catSection.appendChild(grid);
            panel.appendChild(catSection);
        });
        
        return panel;
    }
    
    renderStorageTab() {
        const panel = document.createElement('div');
        
        panel.innerHTML = `
            <h4 style="color: #10b981; margin-bottom: 15px;">📦 Armazenamento da Casa</h4>
            <div style="font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 20px;">
                Slots: ${this.currentHome?.storage?.length || 0}/${this.currentHome?.template?.storageSlots || 0}
            </div>
            <div id="storage-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                gap: 10px;
            ">
                <!-- Storage items would go here -->
            </div>
        `;
        
        return panel;
    }
    
    renderVisitorsTab() {
        const panel = document.createElement('div');
        
        panel.innerHTML = `
            <h4 style="color: #10b981; margin-bottom: 15px;">👥 Gerenciar Visitantes</h4>
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h5 style="margin: 0 0 10px 0; color: rgba(255,255,255,0.8);">Permissões Atuais</h5>
                <div style="display: grid; gap: 8px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" ${this.currentHome?.permissions?.friends ? 'checked' : ''}>
                        <span style="font-size: 14px;">Permitir amigos</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" ${this.currentHome?.permissions?.guild ? 'checked' : ''}>
                        <span style="font-size: 14px;">Permitir membros da guilda</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" ${this.currentHome?.permissions?.public ? 'checked' : ''}>
                        <span style="font-size: 14px;">Público (qualquer um pode visitar)</span>
                    </label>
                </div>
            </div>
            <button id="save-perms-btn" style="
                padding: 10px 20px;
                background: #10b981;
                border: none;
                border-radius: 6px;
                color: white;
                font-weight: 600;
                cursor: pointer;
            ">Salvar Permissões</button>
        `;
        
        return panel;
    }
    
    renderSettingsTab() {
        const panel = document.createElement('div');
        
        panel.innerHTML = `
            <h4 style="color: #10b981; margin-bottom: 15px;">⚙️ Configurações da Casa</h4>
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 15px; border-radius: 10px;">
                <h5 style="margin: 0 0 10px 0; color: #ef4444;">⚠️ Zona de Perigo</h5>
                <p style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 15px;">
                    Vender sua casa devolverá apenas 50% do valor. Todos os móveis serão perdidos!
                </p>
                <button id="sell-home-btn" style="
                    padding: 10px 20px;
                    background: #ef4444;
                    border: none;
                    border-radius: 6px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                ">Vender Casa</button>
            </div>
        `;
        
        return panel;
    }
    
    createHomeCard(home, owned) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid ${owned ? '#10b981' : 'rgba(255,255,255,0.1)'};
            border-radius: 12px;
            padding: 20px;
            transition: all 0.2s;
        `;
        
        card.innerHTML = `
            <div style="font-size: 56px; text-align: center; margin-bottom: 15px;">${home.icon}</div>
            <h4 style="margin: 0 0 10px 0; color: #fff; text-align: center;">${home.name}</h4>
            <div style="font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 15px; text-align: center;">
                ${home.rooms} cômodos • ${home.maxFurniture} móveis<br>
                ${home.storageSlots} slots de armazenamento
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 15px; text-align: center;">
                Localização: ${home.location}
            </div>
            ${!home.owned ? `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #ffd700; font-weight: 600; font-size: 18px;">${home.cost.toLocaleString()}g</div>
                        <div style="font-size: 11px; color: rgba(255,255,255,0.5);">Manutenção: ${home.maintenance}g/dia</div>
                    </div>
                    <button class="buy-btn" ${!home.canAfford ? 'disabled' : ''} style="
                        padding: 10px 20px;
                        background: ${home.canAfford ? '#10b981' : 'rgba(255,255,255,0.1)'};
                        border: none;
                        border-radius: 8px;
                        color: ${home.canAfford ? 'white' : 'rgba(255,255,255,0.3)'};
                        font-weight: 600;
                        cursor: ${home.canAfford ? 'pointer' : 'not-allowed'};
                    ">Comprar</button>
                </div>
            ` : '<div style="text-align: center; color: #10b981; font-weight: 600;">✓ Sua Casa</div>'}
        `;
        
        const buyBtn = card.querySelector('.buy-btn');
        if (buyBtn && !owned) {
            buyBtn.onclick = () => {
                this.socket?.emit('housing:buy', { templateId: home.id });
            };
        }
        
        return card;
    }
    
    getCategoryName(cat) {
        const names = {
            storage: '📦 Armazenamento',
            seating: '🪑 Assentos',
            surface: '🪑 Mesas',
            crafting: '⚒️ Crafting',
            decoration: '🎨 Decoração',
            bed: '🛏️ Camas'
        };
        return names[cat] || cat;
    }
    
    updateStatus() {
        if (this.currentHome) {
            this.statusDisplay.innerHTML = `
                <span style="color: rgba(255,255,255,0.7);">Casa atual:</span>
                <span style="color: #10b981; font-weight: 600;">${this.currentHome.template?.name || 'Casa'}</span>
            `;
        } else {
            this.statusDisplay.innerHTML = 'Nenhuma casa - Compre uma!';
        }
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('housing:available_list', (data) => {
            this.availableHomes = data.homes || [];
            this.currentHome = data.currentHome;
            this.updateStatus();
            this.renderContent();
        });
        
        this.socket.on('housing:purchased', (data) => {
            this.currentHome = data.home;
            this.game?.showFloatingText?.('Casa adquirida!', 0, -40, '#10b981');
            this.updateStatus();
            this.currentTab = 'enter';
            this.renderContent();
        });
        
        this.socket.on('housing:entered', (data) => {
            this.isInHome = true;
            this.game?.showFloatingText?.('Entrou na casa!', 0, -40, '#10b981');
        });
        
        this.socket.on('housing:left', () => {
            this.isInHome = false;
        });
        
        this.socket.on('housing:maintenance_due', (data) => {
            if (this.currentHome) {
                this.currentHome.maintenanceDebt = data.debt;
            }
        });
        
        this.socket.on('housing:maintenance_paid', () => {
            if (this.currentHome) {
                this.currentHome.maintenanceDebt = 0;
            }
            this.game?.showFloatingText?.('Manutenção paga!', 0, -40, '#22c55e');
            this.renderContent();
        });
        
        this.socket.on('housing:error', (data) => {
            this.game?.showFloatingText?.(data.message, 0, -40, '#ef4444');
        });
    }
    
    // ===== KEYBOARD =====
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'u' && !e.ctrlKey && !e.altKey && !e.metaKey) {
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
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.socket?.emit('housing:get_available');
        this.renderContent();
        
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

window.HousingUI = HousingUI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HousingUI;
}
