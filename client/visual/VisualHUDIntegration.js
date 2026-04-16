/**
 * Visual HUD Integration - Legacy of Komodo
 * Integração entre elementos visuais e HUDs
 * Conecta mapa, mobs, NPCs, player com as interfaces
 */

class VisualHUDIntegration {
    constructor() {
        this.initialized = false;
        this.active = false;
        
        // Sistemas
        this.visualManager = null;
        this.hudSystems = [];
        
        // Estado de integração
        this.integrationState = {
            playerTracking: true,
            mobTracking: true,
            npcTracking: true,
            worldTracking: true,
            combatTracking: true,
            questTracking: true,
            inventoryTracking: true
        };
        
        // Event listeners
        this.eventListeners = new Map();
        
        // Cache de dados
        this.dataCache = {
            lastPlayerUpdate: 0,
            lastMobUpdate: 0,
            lastNPCUpdate: 0,
            updateInterval: 100 // 10 updates per second
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🔗 Inicializando Visual HUD Integration...');
        
        // Aguardar sistemas estarem prontos
        setTimeout(() => {
            this.connectToSystems();
            this.setupEventListeners();
            this.startIntegrationLoop();
            
            console.log('✅ Visual HUD Integration inicializado');
            this.initialized = true;
        }, 1000);
    }
    
    connectToSystems() {
        // Conectar ao Visual Manager
        if (window.visualManager) {
            this.visualManager = window.visualManager;
            console.log('✅ Conectado ao Visual Manager');
        }
        
        // Conectar às HUDs
        if (window.wowHUDIntegration) {
            this.hudSystems.push(window.wowHUDIntegration);
            console.log('✅ Conectado ao WoW HUD Integration');
        }
        
        if (window.hudIntegration) {
            this.hudSystems.push(window.hudIntegration);
            console.log('✅ Conectado ao HUD Integration');
        }
        
        if (window.improvedHUD) {
            this.hudSystems.push(window.improvedHUD);
            console.log('✅ Conectado ao Improved HUD');
        }
    }
    
    setupEventListeners() {
        // Eventos do Visual Manager
        if (this.visualManager) {
            // Player events
            this.addEventListener('playerMoved', (data) => this.onPlayerMoved(data));
            this.addEventListener('playerAttacked', (data) => this.onPlayerAttacked(data));
            this.addEventListener('playerDamaged', (data) => this.onPlayerDamaged(data));
            this.addEventListener('playerHealed', (data) => this.onPlayerHealed(data));
            this.addEventListener('playerLeveledUp', (data) => this.onPlayerLeveledUp(data));
            this.addEventListener('playerDied', (data) => this.onPlayerDied(data));
            
            // Mob events
            this.addEventListener('mobSpawned', (data) => this.onMobSpawned(data));
            this.addEventListener('mobDied', (data) => this.onMobDied(data));
            this.addEventListener('mobAttacked', (data) => this.onMobAttacked(data));
            
            // NPC events
            this.addEventListener('npcInteracted', (data) => this.onNPCInteracted(data));
            this.addEventListener('npcDialogue', (data) => this.onNPCDialogue(data));
            
            // World events
            this.addEventListener('itemDropped', (data) => this.onItemDropped(data));
            this.addEventListener('itemPicked', (data) => this.onItemPicked(data));
            this.addEventListener('effectCreated', (data) => this.onEffectCreated(data));
        }
        
        // Eventos globais
        this.addEventListener('keydown', (e) => this.onKeyDown(e));
        this.addEventListener('keyup', (e) => this.onKeyUp(e));
        this.addEventListener('mousedown', (e) => this.onMouseDown(e));
        
        console.log('✅ Event listeners configurados');
    }
    
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    triggerEvent(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
    
    startIntegrationLoop() {
        this.active = true;
        this.integrationLoop();
        
        console.log('✅ Integration loop iniciado');
    }
    
    integrationLoop() {
        if (!this.active) return;
        
        const now = Date.now();
        
        // Update player data
        if (this.integrationState.playerTracking && 
            now - this.dataCache.lastPlayerUpdate > this.dataCache.updateInterval) {
            this.updatePlayerData();
            this.dataCache.lastPlayerUpdate = now;
        }
        
        // Update mob data
        if (this.integrationState.mobTracking && 
            now - this.dataCache.lastMobUpdate > this.dataCache.updateInterval) {
            this.updateMobData();
            this.dataCache.lastMobUpdate = now;
        }
        
        // Update NPC data
        if (this.integrationState.npcTracking && 
            now - this.dataCache.lastNPCUpdate > this.dataCache.updateInterval) {
            this.updateNPCData();
            this.dataCache.lastNPCUpdate = now;
        }
        
        // Update world data
        if (this.integrationState.worldTracking) {
            this.updateWorldData();
        }
        
        requestAnimationFrame(() => this.integrationLoop());
    }
    
    updatePlayerData() {
        if (!this.visualManager || !this.visualManager.playerSystem || !this.visualManager.playerSystem.player) {
            return;
        }
        
        const player = this.visualManager.playerSystem.player;
        
        // Preparar dados do jogador para as HUDs
        const playerData = {
            name: player.name,
            level: player.level,
            health: player.health,
            maxHealth: player.maxHealth,
            mana: player.mana,
            maxMana: player.maxMana,
            exp: player.exp,
            maxExp: player.maxExp,
            gold: player.gold,
            position: { x: player.x, y: player.y },
            class: player.class,
            state: player.state,
            casting: player.casting,
            currentSpell: player.currentSpell
        };
        
        // Atualizar todas as HUDs
        this.hudSystems.forEach(hud => {
            if (hud.updatePlayerState) {
                hud.updatePlayerState(playerData);
            }
        });
        
        // Atualizar minimapa
        this.updateMinimap(playerData.position);
    }
    
    updateMobData() {
        if (!this.visualManager || !this.visualManager.mobSystem) return;
        
        const mobs = Array.from(this.visualManager.mobSystem.mobs.values());
        
        // Encontrar mobs próximos ao jogador
        const nearbyMobs = this.findNearbyEntities(mobs, 200);
        
        // Atualizar alvo se houver
        if (nearbyMobs.length > 0) {
            const closestMob = nearbyMobs[0];
            this.updateTargetData(closestMob);
        }
        
        // Atualizar contador de mobs
        this.updateMobCount(mobs.length);
    }
    
    updateNPCData() {
        if (!this.visualManager || !this.visualManager.npcSystem) return;
        
        const npcs = Array.from(this.visualManager.npcSystem.npcs.values());
        
        // Encontrar NPCs próximos
        const nearbyNPCs = this.findNearbyEntities(npcs, 100);
        
        // Mostrar indicadores de interação
        nearbyNPCs.forEach(npc => {
            if (npc.playerInRange) {
                this.showInteractionIndicator(npc);
            }
        });
    }
    
    updateWorldData() {
        if (!this.visualManager) return;
        
        // Atualizar informações do mundo
        const worldInfo = this.visualManager.getSystemInfo();
        
        // Atualizar FPS nas HUDs
        this.updateFPS(worldInfo.fps);
        
        // Atualizar tempo do jogo
        this.updateGameTime();
    }
    
    updateMinimap(position) {
        // Atualizar minimapa na WoW HUD
        if (window.wowStyleHUD) {
            window.wowStyleHUD.playerState.position = position;
        }
    }
    
    updateTargetData(target) {
        const targetData = {
            name: target.name,
            level: target.level,
            health: target.health,
            maxHealth: target.maxHealth,
            mana: target.mana || 0,
            maxMana: target.maxMana || 0,
            type: 'mob',
            hostile: target.behavior === 'aggressive' || target.behavior === 'territorial',
            elite: target.level > 3
        };
        
        // Atualizar alvo nas HUDs
        this.hudSystems.forEach(hud => {
            if (hud.updateTargetState) {
                hud.updateTargetState(targetData);
            }
        });
    }
    
    updateMobCount(count) {
        // Atualizar contador de mobs
        this.hudSystems.forEach(hud => {
            if (hud.showNotification && count > 0) {
                // Mostrar apenas se mudou significativamente
                if (count % 5 === 0) {
                    hud.showNotification(`${count} mobs nearby`, 'info', 2000);
                }
            }
        });
    }
    
    updateFPS(fps) {
        // Atualizar FPS nas HUDs
        if (window.wowStyleHUD) {
            // FPS é atualizado automaticamente no render
        }
    }
    
    updateGameTime() {
        // Simular tempo do jogo
        const now = new Date();
        const gameTime = {
            hours: now.getHours(),
            minutes: now.getMinutes(),
            seconds: now.getSeconds()
        };
        
        // Atualizar tempo nas HUDs
        this.hudSystems.forEach(hud => {
            if (hud.updateGameTime) {
                hud.updateGameTime(gameTime);
            }
        });
    }
    
    showInteractionIndicator(npc) {
        // Mostrar indicador de interação
        this.hudSystems.forEach(hud => {
            if (hud.showNotification) {
                hud.showNotification(`${npc.name}: Press E to interact`, 'info', 1000);
            }
        });
    }
    
    findNearbyEntities(entities, range) {
        if (!this.visualManager || !this.visualManager.playerSystem.player) return [];
        
        const player = this.visualManager.playerSystem.player;
        
        return entities
            .map(entity => ({
                ...entity,
                distance: Math.sqrt(
                    Math.pow(entity.x - player.x, 2) + 
                    Math.pow(entity.y - player.y, 2)
                )
            }))
            .filter(entity => entity.distance <= range)
            .sort((a, b) => a.distance - b.distance);
    }
    
    // === EVENT HANDLERS ===
    
    onPlayerMoved(data) {
        // Atualizar posição do jogador nas HUDs
        this.updatePlayerData();
    }
    
    onPlayerAttacked(data) {
        // Mostrar animação de ataque
        this.hudSystems.forEach(hud => {
            if (hud.showNotification) {
                hud.showNotification('Attacked!', 'warning', 500);
            }
        });
    }
    
    onPlayerDamaged(data) {
        // Atualizar vida do jogador
        this.updatePlayerData();
        
        // Mostrar dano
        this.hudSystems.forEach(hud => {
            if (hud.showNotification) {
                hud.showNotification(`-${data.amount} damage`, 'error', 1000);
            }
        });
    }
    
    onPlayerHealed(data) {
        // Atualizar vida do jogador
        this.updatePlayerData();
        
        // Mostrar cura
        this.hudSystems.forEach(hud => {
            if (hud.showNotification) {
                hud.showNotification(`+${data.amount} health`, 'success', 1000);
            }
        });
    }
    
    onPlayerLeveledUp(data) {
        // Atualizar dados do jogador
        this.updatePlayerData();
        
        // Mostrar level up
        this.hudSystems.forEach(hud => {
            if (hud.showNotification) {
                hud.showNotification(`LEVEL UP! Now level ${data.level}!`, 'success', 5000);
            }
        });
        
        // Adicionar buff temporário
        this.addTemporaryBuff('Level Up Boost', '⭐', 30000);
    }
    
    onPlayerDied(data) {
        // Atualizar estado do jogador
        this.updatePlayerData();
        
        // Mostrar morte
        this.hudSystems.forEach(hud => {
            if (hud.showNotification) {
                hud.showNotification('You have died!', 'error', 5000);
            }
        });
        
        // Desativar modo de combate
        this.setCombatMode(false);
    }
    
    onMobSpawned(data) {
        // Atualizar contador de mobs
        this.updateMobData();
        
        // Notificar se for mob especial
        if (data.mob.level > 3) {
            this.hudSystems.forEach(hud => {
                if (hud.showNotification) {
                    hud.showNotification(`Elite ${data.mob.name} spawned!`, 'warning', 3000);
                }
            });
        }
    }
    
    onMobDied(data) {
        // Atualizar contador de mobs
        this.updateMobData();
        
        // Mostrar recompensas
        this.hudSystems.forEach(hud => {
            if (hud.showNotification) {
                hud.showNotification(`${data.mob.name} defeated! +${data.mob.exp} XP, +${data.mob.gold} Gold`, 'success', 2000);
            }
        });
        
        // Limpar alvo
        this.clearTarget();
        
        // Atualizar inventário
        this.updateInventory({
            gold: this.visualManager.playerSystem.player.gold,
            exp: this.visualManager.playerSystem.player.exp
        });
    }
    
    onMobAttacked(data) {
        // Atualizar vida do alvo
        if (data.mob) {
            this.updateTargetData(data.mob);
        }
    }
    
    onNPCInteracted(data) {
        // Mostrar diálogo
        this.hudSystems.forEach(hud => {
            if (hud.showDialogue) {
                hud.showDialogue(data.npc.name, data.dialogue, data.options);
            }
        });
    }
    
    onNPCDialogue(data) {
        // Atualizar diálogo
        this.hudSystems.forEach(hud => {
            if (hud.showNotification) {
                hud.showNotification(`${data.npc.name}: "${data.text}"`, 'info', 3000);
            }
        });
    }
    
    onItemDropped(data) {
        // Mostrar item drop
        this.hudSystems.forEach(hud => {
            if (hud.showNotification) {
                hud.showNotification(`${data.item.name} dropped!`, 'info', 2000);
            }
        });
    }
    
    onItemPicked(data) {
        // Atualizar inventário
        this.updateInventory(data.inventory);
        
        // Mostrar pickup
        this.hudSystems.forEach(hud => {
            if (hud.showNotification) {
                hud.showNotification(`${data.item.name} picked up!`, 'success', 2000);
            }
        });
    }
    
    onEffectCreated(data) {
        // Mostrar efeito visual
        this.hudSystems.forEach(hud => {
            if (hud.showNotification && data.type === 'spell') {
                hud.showNotification(`${data.spellType} cast!`, 'info', 1000);
            }
        });
    }
    
    onKeyDown(e) {
        // Processar input do teclado
        if (this.visualManager) {
            // O input já é processado pelo Visual Manager
            // Aqui podemos adicionar interações específicas das HUDs
            
            // Debug mode
            if (e.key === 'F6') {
                this.visualManager.toggleDebug();
            }
            
            // Toggle tracking
            if (e.key === 'F5') {
                this.toggleTracking();
            }
        }
    }
    
    onKeyUp(e) {
        // Processar release de teclas
    }
    
    onMouseDown(e) {
        // Processar clique do mouse
        // O clique já é processado pelo Visual Manager
    }
    
    // === MÉTODOS DE CONTROLE ===
    
    setCombatMode(enabled) {
        // Atualizar modo de combate nas HUDs
        this.hudSystems.forEach(hud => {
            if (hud.setCombatMode) {
                hud.setCombatMode(enabled);
            }
        });
    }
    
    clearTarget() {
        // Limpar alvo nas HUDs
        this.hudSystems.forEach(hud => {
            if (hud.updateTargetState) {
                hud.updateTargetState({
                    name: null,
                    level: 0,
                    health: 0,
                    maxHealth: 0,
                    type: 'none',
                    hostile: false
                });
            }
        });
    }
    
    addTemporaryBuff(name, icon, duration) {
        // Adicionar buff temporário
        this.hudSystems.forEach(hud => {
            if (hud.addBuff) {
                hud.addBuff({
                    name: name,
                    icon: icon,
                    duration: duration
                });
            }
        });
    }
    
    updateInventory(inventoryData) {
        // Atualizar inventário nas HUDs
        this.hudSystems.forEach(hud => {
            if (hud.updateInventory) {
                hud.updateInventory(inventoryData);
            }
        });
    }
    
    toggleTracking() {
        // Alternar tracking de entidades
        this.integrationState.mobTracking = !this.integrationState.mobTracking;
        this.integrationState.npcTracking = !this.integrationState.npcTracking;
        
        const status = this.integrationState.mobTracking ? 'enabled' : 'disabled';
        this.hudSystems.forEach(hud => {
            if (hud.showNotification) {
                hud.showNotification(`Entity tracking ${status}`, 'info', 2000);
            }
        });
    }
    
    // === MÉTODOS PÚBLICOS ===
    
    activate() {
        this.active = true;
        console.log('✅ Visual HUD Integration ativado');
    }
    
    deactivate() {
        this.active = false;
        console.log('✅ Visual HUD Integration desativado');
    }
    
    getIntegrationStatus() {
        return {
            initialized: this.initialized,
            active: this.active,
            connectedSystems: {
                visualManager: !!this.visualManager,
                hudSystems: this.hudSystems.length
            },
            tracking: this.integrationState,
            performance: {
                updateInterval: this.dataCache.updateInterval,
                lastUpdates: {
                    player: this.dataCache.lastPlayerUpdate,
                    mob: this.dataCache.lastMobUpdate,
                    npc: this.dataCache.lastNPCUpdate
                }
            }
        };
    }
    
    // === DEBUG ===
    
    debugPlayerData() {
        if (this.visualManager && this.visualManager.playerSystem.player) {
            console.log('🔍 Player Data Debug:', this.visualManager.playerSystem.player);
        }
    }
    
    debugMobData() {
        if (this.visualManager && this.visualManager.mobSystem) {
            const mobs = Array.from(this.visualManager.mobSystem.mobs.values());
            console.log('🔍 Mob Data Debug:', mobs);
        }
    }
    
    debugNPCData() {
        if (this.visualManager && this.visualManager.npcSystem) {
            const npcs = Array.from(this.visualManager.npcSystem.npcs.values());
            console.log('🔍 NPC Data Debug:', npcs);
        }
    }
    
    debugIntegration() {
        console.log('🔍 Integration Debug:', this.getIntegrationStatus());
    }
}

// Criar instância global
window.visualHUDIntegration = new VisualHUDIntegration();

// Exportar para uso global
window.VisualHUDIntegration = VisualHUDIntegration;
