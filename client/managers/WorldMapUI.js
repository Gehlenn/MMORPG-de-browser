/**
 * WorldMapUI - Sistema de Mapa do Mundo
 * 
 * Features:
 * - Mapa interativo do mundo
 * - Fast travel entre zonas desbloqueadas
 * - Marcações de POIs
 * - Exploração de áreas
 * - Filtros de visualização
 */

class WorldMapUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.currentZone = null;
        this.discoveredZones = [];
        this.currentFilter = 'all';
        
        this.zones = [
            { id: 'verdantis', name: 'Verdantis', level: 1, x: 20, y: 60, icon: '🌲', color: '#22c55e', connections: ['eldoria'] },
            { id: 'eldoria', name: 'Eldoria', level: 20, x: 50, y: 50, icon: '🏰', color: '#3b82f6', connections: ['verdantis', 'aurélia', 'dracônia'] },
            { id: 'aurélia', name: 'Aurélia', level: 40, x: 30, y: 30, icon: '🏜️', color: '#f59e0b', connections: ['eldoria'] },
            { id: 'dracônia', name: 'Dracônia', level: 60, x: 80, y: 40, icon: '🐉', color: '#ef4444', connections: ['eldoria', 'ruins'] },
            { id: 'ruins', name: 'Ruínas de Komodo', level: 80, x: 90, y: 70, icon: '⛩️', color: '#8b5cf6', connections: ['dracônia'] },
            { id: 'crypt', name: 'Cripta dos Construtores', level: 90, x: 60, y: 80, icon: '🗿', color: '#1f2937', connections: [] }
        ];
        
        this.pois = [
            { id: 'merchant', name: 'Mercador', icon: '🏪', filter: 'services' },
            { id: 'bank', name: 'Banco', icon: '🏦', filter: 'services' },
            { id: 'dungeon', name: 'Dungeon', icon: '🏰', filter: 'dungeons' },
            { id: 'quest', name: 'Quest', icon: '📜', filter: 'quests' },
            { id: 'resource', name: 'Recursos', icon: '⛏️', filter: 'gathering' },
            { id: 'portal', name: 'Portal', icon: '🌀', filter: 'services' }
        ];
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
    }
    
    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'worldmap-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 1000px;
            height: 750px;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            border: 2px solid #3b82f6;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9);
            display: none;
            flex-direction: column;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
        `;
        
        const header = this.createHeader();
        this.container.appendChild(header);
        
        const filters = this.createFilters();
        this.container.appendChild(filters);
        
        this.mapArea = document.createElement('div');
        this.mapArea.style.cssText = `
            flex: 1;
            position: relative;
            overflow: hidden;
            background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
        `;
        this.container.appendChild(this.mapArea);
        
        const infoPanel = this.createInfoPanel();
        this.container.appendChild(infoPanel);
        
        document.body.appendChild(this.container);
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '🗺️ Mapa do Mundo';
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
    
    createFilters() {
        const filters = document.createElement('div');
        filters.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            padding: 10px 20px;
            display: flex;
            gap: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const filterOptions = [
            { id: 'all', label: 'Tudo', icon: '🌍' },
            { id: 'services', label: 'Serviços', icon: '🏪' },
            { id: 'dungeons', label: 'Dungeons', icon: '🏰' },
            { id: 'quests', label: 'Quests', icon: '📜' },
            { id: 'gathering', label: 'Recursos', icon: '⛏️' }
        ];
        
        filterOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.innerHTML = `${opt.icon} ${opt.label}`;
            btn.style.cssText = `
                padding: 6px 14px;
                background: ${this.currentFilter === opt.id ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 13px;
            `;
            btn.onclick = () => {
                this.currentFilter = opt.id;
                this.renderMap();
            };
            filters.appendChild(btn);
        });
        
        return filters;
    }
    
    createInfoPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            background: rgba(0, 0, 0, 0.4);
            padding: 15px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            min-height: 100px;
        `;
        
        this.infoContent = document.createElement('div');
        this.infoContent.innerHTML = '<div style="color: rgba(255,255,255,0.5);">Selecione uma zona para ver detalhes</div>';
        
        panel.appendChild(this.infoContent);
        return panel;
    }
    
    renderMap() {
        this.mapArea.innerHTML = '';
        
        // Create connections between zones
        this.zones.forEach(zone => {
            if (zone.connections) {
                zone.connections.forEach(targetId => {
                    const target = this.zones.find(z => z.id === targetId);
                    if (target) {
                        this.drawConnection(zone, target);
                    }
                });
            }
        });
        
        // Create zone nodes
        this.zones.forEach(zone => {
            const isDiscovered = this.discoveredZones.includes(zone.id);
            const isCurrent = this.currentZone === zone.id;
            const canTravel = isDiscovered && zone.id !== this.currentZone;
            
            const node = document.createElement('div');
            node.style.cssText = `
                position: absolute;
                left: ${zone.x}%;
                top: ${zone.y}%;
                transform: translate(-50%, -50%);
                width: 60px;
                height: 60px;
                background: ${isCurrent ? 'linear-gradient(135deg, #ffd700, #f59e0b)' : isDiscovered ? `linear-gradient(135deg, ${zone.color}, ${zone.color}80)` : 'linear-gradient(135deg, #64748b, #475569)'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                cursor: ${canTravel ? 'pointer' : 'default'};
                border: 3px solid ${isCurrent ? '#ffd700' : isDiscovered ? zone.color : '#64748b'};
                box-shadow: ${isCurrent ? '0 0 30px rgba(255, 215, 0, 0.5)' : '0 4px 15px rgba(0,0,0,0.3)'};
                transition: all 0.3s;
                z-index: ${isCurrent ? 10 : 1};
            `;
            
            node.innerHTML = zone.icon;
            
            // Zone name label
            const label = document.createElement('div');
            label.style.cssText = `
                position: absolute;
                top: 70px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 12px;
                font-weight: 600;
                color: ${isDiscovered ? '#fff' : 'rgba(255,255,255,0.5)'};
                text-align: center;
                white-space: nowrap;
                text-shadow: 0 2px 4px rgba(0,0,0,0.8);
            `;
            label.textContent = isDiscovered ? zone.name : '???';
            node.appendChild(label);
            
            // Level requirement
            if (isDiscovered) {
                const levelBadge = document.createElement('div');
                levelBadge.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: ${zone.level > this.game?.player?.level ? '#ef4444' : '#22c55e'};
                    color: white;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 10px;
                `;
                levelBadge.textContent = `Lv.${zone.level}`;
                node.appendChild(levelBadge);
            }
            
            if (canTravel) {
                node.onmouseover = () => {
                    node.style.transform = 'translate(-50%, -50%) scale(1.1)';
                };
                node.onmouseout = () => {
                    node.style.transform = 'translate(-50%, -50%) scale(1)';
                };
                node.onclick = () => this.selectZone(zone);
            } else if (isDiscovered) {
                node.onclick = () => this.selectZone(zone);
            }
            
            this.mapArea.appendChild(node);
        });
        
        // Render POIs
        this.renderPOIs();
        
        // Player position indicator
        if (this.currentZone) {
            const currentZoneData = this.zones.find(z => z.id === this.currentZone);
            if (currentZoneData) {
                const indicator = document.createElement('div');
                indicator.style.cssText = `
                    position: absolute;
                    left: ${currentZoneData.x}%;
                    top: ${currentZoneData.y}%;
                    transform: translate(-50%, -50%);
                    width: 20px;
                    height: 20px;
                    background: #22c55e;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 0 20px #22c55e;
                    z-index: 20;
                    animation: pulse 2s infinite;
                `;
                this.mapArea.appendChild(indicator);
            }
        }
    }
    
    drawConnection(from, to) {
        const line = document.createElement('div');
        const x1 = from.x;
        const y1 = from.y;
        const x2 = to.x;
        const y2 = to.y;
        
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        line.style.cssText = `
            position: absolute;
            left: ${x1}%;
            top: ${y1}%;
            width: ${length}%;
            height: 2px;
            background: linear-gradient(90deg, ${from.color}40, ${to.color}40);
            transform: rotate(${angle}deg);
            transform-origin: 0 50%;
            z-index: 0;
        `;
        
        this.mapArea.appendChild(line);
    }
    
    renderPOIs() {
        // Would render actual POIs based on filter
    }
    
    selectZone(zone) {
        const isDiscovered = this.discoveredZones.includes(zone.id);
        const isCurrent = this.currentZone === zone.id;
        const playerLevel = this.game?.player?.level || 1;
        const canTravel = isDiscovered && zone.id !== this.currentZone && playerLevel >= zone.level;
        
        this.infoContent.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 48px;">${isDiscovered ? zone.icon : '❓'}</div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 5px 0; color: ${zone.color};">${isDiscovered ? zone.name : 'Zona Desconhecida'}</h3>
                    ${isDiscovered ? `
                        <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 8px;">
                            Nível recomendado: <span style="color: ${playerLevel >= zone.level ? '#22c55e' : '#ef4444'}; font-weight: 600;">${zone.level}</span>
                        </div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.5);">
                            ${isCurrent ? '📍 Você está aqui' : canTravel ? '✅ Clique em "Viajar" para teleportar' : zone.level > playerLevel ? '❌ Nível insuficiente' : '🔒 Zona bloqueada'}
                        </div>
                    ` : '<div style="font-size: 12px; color: rgba(255,255,255,0.5);">Explore para desbloquear esta zona</div>'}
                </div>
                ${canTravel ? `
                    <button id="travel-btn" style="
                        padding: 12px 24px;
                        background: linear-gradient(45deg, #3b82f6, #1d4ed8);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                    ">🌀 Viajar</button>
                ` : ''}
            </div>
        `;
        
        const travelBtn = this.infoContent.querySelector('#travel-btn');
        if (travelBtn) {
            travelBtn.onclick = () => {
                this.socket?.emit('worldmap:fast_travel', { zoneId: zone.id });
                this.hide();
            };
        }
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('worldmap:zones', (data) => {
            this.discoveredZones = data.discovered || [];
            this.currentZone = data.currentZone;
            this.renderMap();
        });
        
        this.socket.on('worldmap:zone_discovered', (data) => {
            if (!this.discoveredZones.includes(data.zoneId)) {
                this.discoveredZones.push(data.zoneId);
                this.game?.showFloatingText?.(`Zona descoberta: ${data.zoneName}!`, 0, -40, '#3b82f6');
                this.renderMap();
            }
        });
        
        this.socket.on('worldmap:traveled', (data) => {
            this.currentZone = data.zoneId;
            this.game?.showFloatingText?.(`Viajou para ${data.zoneName}!`, 0, -40, '#3b82f6');
            this.hide();
        });
    }
    
    // ===== KEYBOARD =====
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'm' && !e.ctrlKey && !e.altKey && !e.metaKey) {
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
        this.socket?.emit('worldmap:get_zones');
        this.renderMap();
        
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

window.WorldMapUI = WorldMapUI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorldMapUI;
}
