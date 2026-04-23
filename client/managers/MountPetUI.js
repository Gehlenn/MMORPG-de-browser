/**
 * MountPetUI - Interface de Montarias e Pets
 * 
 * Features:
 * - Grid de montarias e pets
 * - Invocação/despawning
 * - Preview de modelos
 * - Comandos de pet
 * - Loja de montarias/pets
 */

class MountPetUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.currentTab = 'mounts'; // 'mounts' or 'pets'
        this.ownedMounts = [];
        this.ownedPets = [];
        this.availableMounts = [];
        this.availablePets = [];
        this.activeMount = null;
        this.activePet = null;
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
    }
    
    createUI() {
        // Container principal
        this.container = document.createElement('div');
        this.container.id = 'mountpet-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 900px;
            height: 650px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #8b5cf6;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
        `;
        
        // Header
        const header = this.createHeader();
        this.container.appendChild(header);
        
        // Navigation
        const nav = this.createNavigation();
        this.container.appendChild(nav);
        
        // Content area
        this.contentArea = document.createElement('div');
        this.contentArea.style.cssText = `
            flex: 1;
            overflow: hidden;
            display: flex;
        `;
        this.container.appendChild(this.contentArea);
        
        // Active entity bar
        this.activeBar = this.createActiveBar();
        this.container.appendChild(this.activeBar);
        
        document.body.appendChild(this.container);
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #8b5cf6, #a855f7);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '🐾 Estábulo';
        title.style.cssText = `
            margin: 0;
            font-size: 22px;
            font-weight: 600;
        `;
        
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
        header.appendChild(closeBtn);
        
        return header;
    }
    
    createNavigation() {
        const nav = document.createElement('div');
        nav.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            padding: 0 20px;
            display: flex;
            gap: 5px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        this.mountBtn = document.createElement('button');
        this.mountBtn.innerHTML = '🐴 Montarias';
        this.mountBtn.style.cssText = this.getTabStyle(true);
        this.mountBtn.onclick = () => this.switchTab('mounts');
        
        this.petBtn = document.createElement('button');
        this.petBtn.innerHTML = '🐕 Pets';
        this.petBtn.style.cssText = this.getTabStyle(false);
        this.petBtn.onclick = () => this.switchTab('pets');
        
        nav.appendChild(this.mountBtn);
        nav.appendChild(this.petBtn);
        
        return nav;
    }
    
    getTabStyle(active) {
        return `
            padding: 12px 25px;
            background: ${active ? 'rgba(139, 92, 246, 0.3)' : 'transparent'};
            border: none;
            border-bottom: 3px solid ${active ? '#8b5cf6' : 'transparent'};
            color: ${active ? '#fff' : 'rgba(255,255,255,0.7)'};
            cursor: pointer;
            font-weight: ${active ? '600' : '400'};
            font-size: 15px;
        `;
    }
    
    createActiveBar() {
        const bar = document.createElement('div');
        bar.style.cssText = `
            background: rgba(0, 0, 0, 0.4);
            padding: 12px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 60px;
        `;
        
        this.activeInfo = document.createElement('div');
        this.activeInfo.style.cssText = 'color: rgba(255,255,255,0.7); font-size: 14px;';
        this.activeInfo.innerHTML = 'Nenhuma montaria ou pet ativo';
        
        this.dismissBtn = document.createElement('button');
        this.dismissBtn.innerHTML = '❌ Dispensar';
        this.dismissBtn.style.cssText = `
            padding: 8px 16px;
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.5);
            border-radius: 6px;
            color: #ef4444;
            cursor: pointer;
            font-weight: 600;
            display: none;
        `;
        this.dismissBtn.onclick = () => this.dismissActive();
        
        bar.appendChild(this.activeInfo);
        bar.appendChild(this.dismissBtn);
        
        return bar;
    }
    
    // ===== TAB SWITCHING =====
    
    switchTab(tab) {
        this.currentTab = tab;
        
        this.mountBtn.style.cssText = this.getTabStyle(tab === 'mounts');
        this.petBtn.style.cssText = this.getTabStyle(tab === 'pets');
        
        this.contentArea.innerHTML = '';
        
        if (tab === 'mounts') {
            this.renderMountsTab();
        } else {
            this.renderPetsTab();
        }
    }
    
    renderMountsTab() {
        // Left panel - Owned mounts
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const ownedTitle = document.createElement('h3');
        ownedTitle.textContent = '📦 Suas Montarias';
        ownedTitle.style.cssText = 'margin: 0 0 15px 0; color: #8b5cf6;';
        leftPanel.appendChild(ownedTitle);
        
        this.ownedMountsContainer = document.createElement('div');
        this.ownedMountsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        `;
        leftPanel.appendChild(this.ownedMountsContainer);
        
        this.renderOwnedMounts();
        
        // Right panel - Available to buy
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        const shopTitle = document.createElement('h3');
        shopTitle.textContent = '🏪 Loja de Montarias';
        shopTitle.style.cssText = 'margin: 0 0 15px 0; color: #d69e2e;';
        rightPanel.appendChild(shopTitle);
        
        this.shopMountsContainer = document.createElement('div');
        this.shopMountsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        `;
        rightPanel.appendChild(this.shopMountsContainer);
        
        this.renderShopMounts();
        
        this.contentArea.appendChild(leftPanel);
        this.contentArea.appendChild(rightPanel);
    }
    
    renderPetsTab() {
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const ownedTitle = document.createElement('h3');
        ownedTitle.textContent = '📦 Seus Pets';
        ownedTitle.style.cssText = 'margin: 0 0 15px 0; color: #8b5cf6;';
        leftPanel.appendChild(ownedTitle);
        
        this.ownedPetsContainer = document.createElement('div');
        this.ownedPetsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        `;
        leftPanel.appendChild(this.ownedPetsContainer);
        
        this.renderOwnedPets();
        
        // Pet commands if active
        if (this.activePet) {
            const commandsPanel = document.createElement('div');
            commandsPanel.style.cssText = `
                margin-top: 20px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
            `;
            
            const cmdTitle = document.createElement('h4');
            cmdTitle.textContent = '🎮 Comandos';
            cmdTitle.style.cssText = 'margin: 0 0 10px 0; color: #fff;';
            commandsPanel.appendChild(cmdTitle);
            
            const cmdGrid = document.createElement('div');
            cmdGrid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            `;
            
            const commands = [
                { cmd: 'follow', label: '👣 Seguir', color: '#22c55e' },
                { cmd: 'stay', label: '🛑 Ficar', color: '#ef4444' },
                { cmd: 'attack', label: '⚔️ Atacar', color: '#f59e0b' },
                { cmd: 'gather', label: '🌿 Coletar', color: '#3b82f6' }
            ];
            
            commands.forEach(({ cmd, label, color }) => {
                const btn = document.createElement('button');
                btn.textContent = label;
                btn.style.cssText = `
                    padding: 10px;
                    background: ${color}20;
                    border: 1px solid ${color};
                    border-radius: 6px;
                    color: ${color};
                    cursor: pointer;
                    font-weight: 600;
                `;
                btn.onclick = () => this.sendPetCommand(cmd);
                cmdGrid.appendChild(btn);
            });
            
            commandsPanel.appendChild(cmdGrid);
            leftPanel.appendChild(commandsPanel);
        }
        
        // Right panel - Shop
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        const shopTitle = document.createElement('h3');
        shopTitle.textContent = '🏪 Loja de Pets';
        shopTitle.style.cssText = 'margin: 0 0 15px 0; color: #d69e2e;';
        rightPanel.appendChild(shopTitle);
        
        this.shopPetsContainer = document.createElement('div');
        this.shopPetsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        `;
        rightPanel.appendChild(this.shopPetsContainer);
        
        this.renderShopPets();
        
        this.contentArea.appendChild(leftPanel);
        this.contentArea.appendChild(rightPanel);
    }
    
    // ===== RENDERING =====
    
    renderOwnedMounts() {
        this.ownedMountsContainer.innerHTML = '';
        
        if (this.ownedMounts.length === 0) {
            this.ownedMountsContainer.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center;">Nenhuma montaria</div>';
            return;
        }
        
        this.ownedMounts.forEach(mount => {
            const card = this.createMountCard(mount, true);
            this.ownedMountsContainer.appendChild(card);
        });
    }
    
    renderShopMounts() {
        this.shopMountsContainer.innerHTML = '';
        
        if (this.availableMounts.length === 0) {
            this.shopMountsContainer.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center;">Nenhuma montaria disponível</div>';
            return;
        }
        
        this.availableMounts.forEach(mount => {
            const card = this.createMountCard(mount, false);
            this.shopMountsContainer.appendChild(card);
        });
    }
    
    createMountCard(mount, owned) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid ${owned ? (this.activeMount?.mountId === mount.id ? '#8b5cf6' : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.1)'};
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            cursor: ${owned ? 'pointer' : 'default'};
            transition: all 0.2s;
        `;
        
        const rarityColor = this.getRarityColor(mount.rarity);
        
        card.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px; filter: drop-shadow(0 0 5px ${rarityColor});">
                ${mount.icon}
            </div>
            <div style="font-weight: 600; color: ${rarityColor}; margin-bottom: 5px;">
                ${mount.name}
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">
                ${mount.type === 'flying' ? '🦅 Voadora' : mount.type === 'aquatic' ? '🌊 Aquática' : '🌍 Terrestre'}
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 10px;">
                Velocidade: +${Math.round(mount.speedBonus * 100)}%
            </div>
            ${owned ? `
                <button class="summon-btn" style="
                    width: 100%;
                    padding: 8px;
                    background: ${this.activeMount?.mountId === mount.id ? '#ef4444' : '#8b5cf6'};
                    border: none;
                    border-radius: 6px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                ">${this.activeMount?.mountId === mount.id ? '❌ Dispensar' : '🐴 Montar'}</button>
            ` : `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #ffd700; font-weight: 600;">${mount.cost}g</span>
                    <button class="buy-btn" style="
                        padding: 6px 12px;
                        background: #22c55e;
                        border: none;
                        border-radius: 6px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                    ">Comprar</button>
                </div>
            `}
        `;
        
        if (owned) {
            const btn = card.querySelector('.summon-btn');
            btn.onclick = () => {
                if (this.activeMount?.mountId === mount.id) {
                    this.socket?.emit('mount:dismiss');
                } else {
                    this.socket?.emit('mount:summon', { mountId: mount.id });
                }
            };
        } else {
            const btn = card.querySelector('.buy-btn');
            btn.onclick = () => {
                this.socket?.emit('mount:buy', { mountId: mount.id });
            };
        }
        
        return card;
    }
    
    renderOwnedPets() {
        this.ownedPetsContainer.innerHTML = '';
        
        if (this.ownedPets.length === 0) {
            this.ownedPetsContainer.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center;">Nenhum pet</div>';
            return;
        }
        
        this.ownedPets.forEach(pet => {
            const card = this.createPetCard(pet, true);
            this.ownedPetsContainer.appendChild(card);
        });
    }
    
    renderShopPets() {
        this.shopPetsContainer.innerHTML = '';
        
        if (this.availablePets.length === 0) {
            this.shopPetsContainer.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center;">Nenhum pet disponível</div>';
            return;
        }
        
        this.availablePets.forEach(pet => {
            const card = this.createPetCard(pet, false);
            this.shopPetsContainer.appendChild(card);
        });
    }
    
    createPetCard(pet, owned) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid ${owned ? (this.activePet?.petId === pet.id ? '#8b5cf6' : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.1)'};
            border-radius: 10px;
            padding: 15px;
            text-align: center;
        `;
        
        const rarityColor = this.getRarityColor(pet.rarity);
        const typeIcon = pet.type === 'combat' ? '⚔️' : pet.type === 'gathering' ? '🌿' : '✨';
        
        card.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px; filter: drop-shadow(0 0 5px ${rarityColor});">
                ${pet.icon}
            </div>
            <div style="font-weight: 600; color: ${rarityColor}; margin-bottom: 5px;">
                ${pet.name}
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">
                ${typeIcon} ${pet.type === 'combat' ? 'Combate' : pet.type === 'gathering' ? 'Coleta' : 'Cosmético'}
            </div>
            ${owned ? `
                <button class="summon-btn" style="
                    width: 100%;
                    padding: 8px;
                    background: ${this.activePet?.petId === pet.id ? '#ef4444' : '#8b5cf6'};
                    border: none;
                    border-radius: 6px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                ">${this.activePet?.petId === pet.id ? '❌ Dispensar' : '🐕 Invocar'}</button>
            ` : `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #ffd700; font-weight: 600;">${pet.cost}g</span>
                    <button class="buy-btn" style="
                        padding: 6px 12px;
                        background: #22c55e;
                        border: none;
                        border-radius: 6px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                    ">Comprar</button>
                </div>
            `}
        `;
        
        if (owned) {
            const btn = card.querySelector('.summon-btn');
            btn.onclick = () => {
                if (this.activePet?.petId === pet.id) {
                    this.socket?.emit('pet:dismiss');
                } else {
                    this.socket?.emit('pet:summon', { petId: pet.id });
                }
            };
        } else {
            const btn = card.querySelector('.buy-btn');
            btn.onclick = () => {
                this.socket?.emit('pet:buy', { petId: pet.id });
            };
        }
        
        return card;
    }
    
    // ===== ACTIONS =====
    
    sendPetCommand(command) {
        this.socket?.emit('pet:command', { command });
    }
    
    dismissActive() {
        if (this.currentTab === 'mounts' && this.activeMount) {
            this.socket?.emit('mount:dismiss');
        } else if (this.currentTab === 'pets' && this.activePet) {
            this.socket?.emit('pet:dismiss');
        }
    }
    
    updateActiveBar() {
        const hasMount = this.activeMount && this.currentTab === 'mounts';
        const hasPet = this.activePet && this.currentTab === 'pets';
        
        if (hasMount) {
            const mount = this.ownedMounts.find(m => m.id === this.activeMount.mountId);
            this.activeInfo.innerHTML = `
                <span style="color: #8b5cf6; font-weight: 600;">🐴 ${mount?.name || 'Montaria'}</span>
                <span style="color: rgba(255,255,255,0.5); margin-left: 10px;">
                    Stamina: ${Math.round(this.activeMount.stamina)}/${this.activeMount.maxStamina}
                </span>
            `;
            this.dismissBtn.style.display = 'block';
        } else if (hasPet) {
            const pet = this.ownedPets.find(p => p.id === this.activePet.petId);
            this.activeInfo.innerHTML = `
                <span style="color: #8b5cf6; font-weight: 600;">🐕 ${pet?.name || 'Pet'}</span>
                <span style="color: rgba(255,255,255,0.5); margin-left: 10px;">
                    HP: ${this.activePet.hp}/${this.activePet.maxHp}
                </span>
            `;
            this.dismissBtn.style.display = 'block';
        } else {
            this.activeInfo.innerHTML = 'Nenhuma montaria ou pet ativo';
            this.dismissBtn.style.display = 'none';
        }
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('mount:list', (data) => {
            this.ownedMounts = data.owned || [];
            this.availableMounts = data.available || [];
            this.activeMount = data.activeMount;
            if (this.currentTab === 'mounts') {
                this.renderOwnedMounts();
                this.renderShopMounts();
                this.updateActiveBar();
            }
        });
        
        this.socket.on('mount:summoned', (data) => {
            this.activeMount = data;
            this.game?.showFloatingText?.('Montaria invocada!', 0, -40, '#8b5cf6');
            if (this.currentTab === 'mounts') {
                this.renderOwnedMounts();
                this.updateActiveBar();
            }
        });
        
        this.socket.on('mount:dismissed', () => {
            this.activeMount = null;
            if (this.currentTab === 'mounts') {
                this.renderOwnedMounts();
                this.updateActiveBar();
            }
        });
        
        this.socket.on('mount:purchased', (data) => {
            this.game?.showFloatingText?.(`${data.mount.name} adquirido!`, 0, -40, '#22c55e');
            this.socket?.emit('mount:get_list');
        });
        
        this.socket.on('pet:list', (data) => {
            this.ownedPets = data.owned || [];
            this.availablePets = data.available || [];
            this.activePet = data.activePet;
            if (this.currentTab === 'pets') {
                this.renderPetsTab();
                this.updateActiveBar();
            }
        });
        
        this.socket.on('pet:summoned', (data) => {
            this.activePet = data;
            this.game?.showFloatingText?.('Pet invocado!', 0, -40, '#8b5cf6');
            if (this.currentTab === 'pets') {
                this.renderPetsTab();
                this.updateActiveBar();
            }
        });
        
        this.socket.on('pet:dismissed', () => {
            this.activePet = null;
            if (this.currentTab === 'pets') {
                this.renderPetsTab();
                this.updateActiveBar();
            }
        });
        
        this.socket.on('pet:purchased', (data) => {
            this.game?.showFloatingText?.(`${data.pet.name} adquirido!`, 0, -40, '#22c55e');
            this.socket?.emit('pet:get_list');
        });
        
        this.socket.on('mountpet:error', (data) => {
            this.game?.showFloatingText?.(data.message, 0, -40, '#ef4444');
        });
    }
    
    // ===== UTILITIES =====
    
    getRarityColor(rarity) {
        const colors = {
            common: '#9CA3AF',
            uncommon: '#22c55e',
            rare: '#3b82f6',
            epic: '#a855f7',
            legendary: '#f59e0b'
        };
        return colors[rarity] || '#9CA3AF';
    }
    
    // ===== KEYBOARD =====
    
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
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.socket?.emit('mount:get_list');
        this.socket?.emit('pet:get_list');
        this.switchTab(this.currentTab);
        
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

// Export
window.MountPetUI = MountPetUI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MountPetUI;
}
