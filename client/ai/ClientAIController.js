/**
 * ClientAIController.js
 * Client-side AI visualization and control system
 * Phases 2, 3, 4: AI Visualization, Player-AI Interaction, Performance Optimization
 * 
 * @version 0.4.0
 * @author Legacy of Komodo Team
 */

class ClientAIController {
    constructor(options = {}) {
        this.networkManager = options.networkManager || null;
        this.gameplayEngine = options.gameplayEngine || null;
        this.playerId = options.playerId || null;
        
        // AI entity state storage
        this.aiEntities = new Map();
        this.bossStates = new Map();
        
        // Visualization settings
        this.settings = {
            showIntentArrows: true,
            showStateColors: true,
            showDebugOverlay: false,
            showAggroRanges: false,
            showPathLines: true
        };
        
        // State color mappings
        this.stateColors = {
            idle: '#4CAF50',
            chase: '#FF5252',
            attack: '#FF9800',
            flee: '#2196F3',
            patrol: '#9C27B0',
            dead: '#757575'
        };
        
        // UI Components (Phase 3)
        this.aggroDisplay = null;
        this.tacticalFeedback = null;
        
        // Performance (Phase 4)
        this.statePool = typeof AIStatePool !== 'undefined' ? new AIStatePool(100) : null;
        this.spatialIndex = null;
        this.viewport = { x: 0, y: 0, width: 800, height: 600 };
        this.updateFrequency = 1;
        
        // Bind methods
        this.onAIStateUpdate = this.onAIStateUpdate.bind(this);
        this.onBossPhaseChange = this.onBossPhaseChange.bind(this);
        this.onAIDecision = this.onAIDecision.bind(this);
        this.onAggroUpdate = this.onAggroUpdate.bind(this);
        this.onAIReaction = this.onAIReaction.bind(this);
        this.onTacticalTip = this.onTacticalTip.bind(this);
        
        console.log('[ClientAIController] Initialized');
    }
    
    initialize() {
        if (!this.networkManager) {
            console.warn('[ClientAIController] No network manager provided');
            return;
        }
        
        // Phase 2: AI Visualization events
        this.networkManager.on('ai:state_update', this.onAIStateUpdate);
        this.networkManager.on('ai:boss_phase_change', this.onBossPhaseChange);
        this.networkManager.on('ai:decision', this.onAIDecision);
        
        // Phase 3: Player-AI Interaction events
        this.networkManager.on('ai:aggro_update', this.onAggroUpdate);
        this.networkManager.on('ai:reaction', this.onAIReaction);
        this.networkManager.on('tactical:tip', this.onTacticalTip);
        
        this.initializeUI();
        console.log('[ClientAIController] Event handlers registered');
    }
    
    initializeUI() {
        if (typeof AggroDisplay !== 'undefined') {
            this.aggroDisplay = new AggroDisplay();
        }
        if (typeof TacticalFeedback !== 'undefined') {
            this.tacticalFeedback = new TacticalFeedback();
        }
    }
    
    // ========== Phase 2: AI Visualization ==========
    
    onAIStateUpdate(data) {
        const { mobId, state, position, targetId, confidence, intent } = data;
        
        let aiState = this.aiEntities.get(mobId);
        if (!aiState && this.statePool) {
            aiState = this.statePool.acquire();
        } else if (!aiState) {
            aiState = {};
        }
        
        aiState.mobId = mobId;
        aiState.state = state;
        aiState.position = position;
        aiState.targetId = targetId;
        aiState.confidence = confidence;
        aiState.intent = intent;
        aiState.lastUpdate = Date.now();
        
        this.aiEntities.set(mobId, aiState);
    }
    
    onBossPhaseChange(data) {
        const { bossId, bossName, previousPhase, newPhase, newPhaseName } = data;
        
        this.bossStates.set(bossId, {
            bossId,
            bossName,
            phase: newPhase,
            phaseName: newPhaseName,
            lastUpdate: Date.now()
        });
        
        if (this.tacticalFeedback) {
            this.tacticalFeedback.showBossMechanic(
                `Phase ${newPhase}: ${newPhaseName}`,
                'Prepare for new abilities!',
                5000
            );
        }
    }
    
    onAIDecision(data) {
        const { mobId, decision, reasoning, confidence } = data;
        console.log(`[AI] ${mobId} decided: ${decision} (${confidence}%)`);
    }
    
    // ========== Phase 3: Player-AI Interaction ==========
    
    onAggroUpdate(data) {
        if (this.aggroDisplay) {
            this.aggroDisplay.handleAggroUpdate(data, this.playerId);
        }
    }
    
    onAIReaction(data) {
        const { targetId, reactionType, data: reactionData } = data;
        
        const entity = this.aiEntities.get(targetId);
        if (entity) {
            entity.lastReaction = {
                type: reactionType,
                data: reactionData,
                timestamp: Date.now()
            };
        }
        
        if (this.tacticalFeedback && reactionType === 'crowd_controlled') {
            this.tacticalFeedback.showTip('success', 'Crowd Control',
                `${reactionData.abilityName} landed!`, { duration: 3000 }
            );
        }
    }
    
    onTacticalTip(data) {
        if (this.tacticalFeedback) {
            this.tacticalFeedback.handleTacticalTip(data);
        }
    }
    
    setPlayerId(playerId) {
        this.playerId = playerId;
    }
    
    // ========== Phase 4: Performance Optimization ==========
    
    setViewport(viewport) {
        this.viewport = viewport;
        if (!this.spatialIndex && typeof SpatialIndex !== 'undefined') {
            this.spatialIndex = new SpatialIndex({
                x: 0, y: 0,
                width: viewport.width * 2,
                height: viewport.height * 2
            });
        }
    }
    
    updateSpatialIndex() {
        if (!this.spatialIndex) return;
        this.spatialIndex.clear();
        
        for (const [mobId, state] of this.aiEntities) {
            if (state.position) {
                this.spatialIndex.insert({
                    id: mobId,
                    x: state.position.x,
                    y: state.position.y,
                    width: 32,
                    height: 32,
                    data: state
                });
            }
        }
    }
    
    getVisibleEntities() {
        if (!this.spatialIndex) {
            return Array.from(this.aiEntities.values());
        }
        return this.spatialIndex.query(this.viewport).map(obj => obj.data);
    }
    
    // ========== Rendering ==========
    
    renderAIOverlay(ctx) {
        this.updateFrequency = (this.updateFrequency + 1) % 2;
        const skipRender = this.updateFrequency !== 0;
        
        if (this.spatialIndex && !skipRender) {
            this.updateSpatialIndex();
        }
        
        const visibleEntities = this.getVisibleEntities();
        
        for (const state of visibleEntities) {
            if (state && state.position) {
                this.renderEntityState(ctx, state);
            }
        }
        
        for (const [bossId, state] of this.bossStates) {
            this.drawBossOverlay(ctx, state);
        }
        
        if (this.settings.showDebugOverlay && !skipRender) {
            this.drawDebugOverlay(ctx);
        }
    }
    
    renderEntityState(ctx, state) {
        if (!this.settings.showStateColors) return;
        
        const color = this.stateColors[state.state] || '#FFFFFF';
        const { x, y } = state.position;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        if (this.settings.showDebugOverlay) {
            ctx.fillStyle = color;
            ctx.font = '10px sans-serif';
            ctx.fillText(state.state, x - 15, y - 25);
        }
        ctx.restore();
    }
    
    drawBossOverlay(ctx, state) {
        ctx.save();
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`BOSS: ${state.bossName} - ${state.phaseName}`, 10, 30);
        ctx.restore();
    }
    
    drawDebugOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(5, 50, 200, 100);
        
        ctx.fillStyle = '#00FF00';
        ctx.font = '12px monospace';
        ctx.fillText(`AI Entities: ${this.aiEntities.size}`, 10, 70);
        ctx.fillText(`Boss States: ${this.bossStates.size}`, 10, 85);
        ctx.fillText(`Visible: ${this.getVisibleEntities().length}`, 10, 100);
        
        if (this.statePool) {
            const stats = this.statePool.getStats();
            ctx.fillText(`Pool: ${stats.inUse}/${stats.total}`, 10, 115);
        }
        ctx.restore();
    }
    
    // ========== Controls ==========
    
    toggleDebug() {
        this.settings.showDebugOverlay = !this.settings.showDebugOverlay;
        console.log(`[ClientAIController] Debug: ${this.settings.showDebugOverlay ? 'ON' : 'OFF'}`);
    }
    
    enableDebug() {
        this.settings.showDebugOverlay = true;
        this.settings.showIntentArrows = true;
        this.settings.showStateColors = true;
    }
    
    disableDebug() {
        this.settings.showDebugOverlay = false;
    }
    
    toggleSetting(setting, value) {
        if (this.settings.hasOwnProperty(setting)) {
            this.settings[setting] = value !== undefined ? value : !this.settings[setting];
        }
    }
    
    getEntityState(mobId) {
        return this.aiEntities.get(mobId) || null;
    }
    
    getAllEntities() {
        return Array.from(this.aiEntities.values());
    }
    
    // ========== Cleanup ==========
    
    destroy() {
        if (this.networkManager) {
            this.networkManager.off('ai:state_update', this.onAIStateUpdate);
            this.networkManager.off('ai:boss_phase_change', this.onBossPhaseChange);
            this.networkManager.off('ai:decision', this.onAIDecision);
            this.networkManager.off('ai:aggro_update', this.onAggroUpdate);
            this.networkManager.off('ai:reaction', this.onAIReaction);
            this.networkManager.off('tactical:tip', this.onTacticalTip);
        }
        
        if (this.statePool) {
            this.aiEntities.forEach(state => this.statePool.release(state));
            this.statePool.destroy();
        }
        
        this.aiEntities.clear();
        this.bossStates.clear();
        
        if (this.aggroDisplay) this.aggroDisplay.cleanup();
        if (this.tacticalFeedback) this.tacticalFeedback.cleanup();
        
        console.log('[ClientAIController] Destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientAIController;
}
