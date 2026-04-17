/**
 * ClientAIController.js
 * Client-side AI visualization and control system
 * Connects to server-side AI (AIMobController, AIBossController)
 * Provides real-time visual feedback of AI behaviors to players
 * 
 * @version 0.4.0
 * @author Legacy of Komodo Team
 */

class ClientAIController {
    /**
     * @param {Object} options - Configuration options
     * @param {NetworkManager} options.networkManager - Network manager instance
     * @param {GameplayEngine} options.gameplayEngine - Gameplay engine instance
     */
    constructor(options = {}) {
        this.networkManager = options.networkManager || null;
        this.gameplayEngine = options.gameplayEngine || null;
        
        // AI entity state storage
        this.aiEntities = new Map(); // mobId -> AIState
        this.bossStates = new Map(); // bossId -> BossState
        
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
            idle: '#4CAF50',      // Green
            chase: '#FF5252',     // Red
            attack: '#FF9800',    // Orange
            flee: '#2196F3',      // Blue
            patrol: '#9C27B0',    // Purple
            dead: '#757575'       // Gray
        };
        
        // UI Components (Phase 3)
        this.aggroDisplay = null;
        this.tacticalFeedback = null;
        this.playerId = options.playerId || null;
        
        // Performance Optimization (Phase 4)
        this.statePool = typeof AIStatePool !== 'undefined' ? new AIStatePool(100) : null;
        this.spatialIndex = null;
        this.lastReceivedStates = new Map(); // For delta decompression
        this.viewport = { x: 0, y: 0, width: 800, height: 600 };
        this.updateFrequency = 1; // Frame skip counter
        
        // Bind methods
        this.onAIStateUpdate = this.onAIStateUpdate.bind(this);
        this.onBossPhaseChange = this.onBossPhaseChange.bind(this);
        this.onAIDecision = this.onAIDecision.bind(this);
        this.onAggroUpdate = this.onAggroUpdate.bind(this);
        this.onAIReaction = this.onAIReaction.bind(this);
        this.onTacticalTip = this.onTacticalTip.bind(this);
        
        console.log('[ClientAIController] Initialized');
    }
    
    /**
     * Initialize and connect to network events
     */
    initialize() {
        if (!this.networkManager) {
            console.warn('[ClientAIController] No network manager provided');
            return;
        }
        
        // Register event handlers
        this.networkManager.on('ai:state_update', this.onAIStateUpdate);
        this.networkManager.on('ai:boss_phase_change', this.onBossPhaseChange);
        this.networkManager.on('ai:decision', this.onAIDecision);
        
        // Phase 3: Player-AI Interaction events
        this.networkManager.on('ai:aggro_update', this.onAggroUpdate);
        this.networkManager.on('ai:reaction', this.onAIReaction);
        this.networkManager.on('tactical:tip', this.onTacticalTip);
        
        // Initialize UI components
        this.initializeUI();
        
        console.log('[ClientAIController] Event handlers registered');
    }
    
    /**
     * Initialize UI components (Phase 3)
     */
    initializeUI() {
        // Aggro Display
        if (typeof AggroDisplay !== 'undefined') {
            this.aggroDisplay = new AggroDisplay();
        }
        
        // Tactical Feedback
        if (typeof TacticalFeedback !== 'undefined') {
            this.tacticalFeedback = new TacticalFeedback();
        }
    }
    
    /**
     * Handle AI state updates from server
     * @param {Object} data - State update data
     */
    onAIStateUpdate(data) {
        const { mobId, state, targetId, intent, confidence, position } = data;
        
        // Update or create entity state
        this.aiEntities.set(mobId, {
            mobId,
            state,
            targetId,
            intent,
            confidence,
            position,
            lastUpdate: Date.now()
        });
        
        // Update visual representation if entity exists in gameplay
        const entity = this.gameplayEngine?.getEntity(mobId);
        if (entity) {
            entity.aiState = state;
            entity.aiTargetId = targetId;
            entity.aiIntent = intent;
        }
        
        console.log(`[AI] Mob ${mobId} -> ${state} (confidence: ${confidence})`);
    }
    
    /**
     * Handle boss phase change events
     * @param {Object} data - Boss phase data
     */
    onBossPhaseChange(data) {
        const { bossId, phase, nextAttack, weakness, mechanics } = data;
        
        this.bossStates.set(bossId, {
            bossId,
            phase,
            nextAttack,
            weakness,
            mechanics,
            lastUpdate: Date.now()
        });
        
        console.log(`[AI] Boss ${bossId} entered phase ${phase}`);
        
        // Trigger boss UI update
        this.updateBossUI(bossId, phase, nextAttack, weakness);
    }
    
    /**
     * Handle AI decision events
     * @param {Object} data - Decision data
     */
    onAIDecision(data) {
        const { mobId, decision, reasoning, alternatives } = data;
        
        const entityState = this.aiEntities.get(mobId);
        if (entityState) {
            entityState.lastDecision = {
                decision,
                reasoning,
                alternatives,
                timestamp: Date.now()
            };
        }
        
        if (this.settings.showDebugOverlay) {
            console.log(`[AI Decision] ${mobId}: ${decision} - ${reasoning}`);
        }
    }
    
    /**
     * Render AI overlay on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderAIOverlay(ctx) {
        // Skip frames based on update frequency (performance optimization)
        this.updateFrequency = (this.updateFrequency + 1) % 2; // Every 2nd frame
        const skipRender = this.updateFrequency !== 0;
        
        // Update spatial index periodically
        if (this.spatialIndex && !skipRender) {
            this.updateSpatialIndex();
        }
        
        // Get visible entities (spatial culling)
        const visibleEntities = this.spatialIndex ? 
            this.getVisibleEntities() : 
            Array.from(this.aiEntities.values());
        
        // Draw visible AI entity states
        for (const state of visibleEntities) {
            if (state && state.position) {
                this.renderEntityState(ctx, state);
                
                const boss = this.bossStates.get(state.mobId);
                if (boss) {
                    this.drawBossOverlay(ctx, boss, state);
                }
            }
        }
    }
    
    /**
     * Draw state-based visual effects
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} entity 
     * @param {Object} state 
     */
    drawStateEffects(ctx, entity, state) {
        if (!this.settings.showStateColors) return;
        
        const color = this.stateColors[state.state] || this.stateColors.idle;
        const { x, y, width, height } = entity;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.max(width, height) / 2 + 8;
        
        ctx.save();
        
        // Draw colored outline based on state
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        // Pulsing effect for chase/attack states
        if (state.state === 'chase' || state.state === 'attack') {
            const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
            ctx.globalAlpha = 0.5 + pulse * 0.5;
        }
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw state icon
        this.drawStateIcon(ctx, centerX, centerY - radius - 10, state.state);
        
        ctx.restore();
    }
    
    /**
     * Draw state icon above entity
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x 
     * @param {number} y 
     * @param {string} state 
     */
    drawStateIcon(ctx, x, y, state) {
        const icons = {
            idle: '😴',
            chase: '👁️',
            attack: '⚔️',
            flee: '💨',
            patrol: '🚶',
            dead: '💀'
        };
        
        const icon = icons[state] || '❓';
        
        ctx.save();
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(icon, x, y);
        ctx.restore();
    }
    
    /**
     * Draw intent arrow showing AI intention
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} entity 
     * @param {Object} intent 
     */
    drawIntentArrow(ctx, entity, intent) {
        const { x: startX, y: startY, width, height } = entity;
        const centerX = startX + width / 2;
        const centerY = startY + height / 2;
        
        let endX, endY;
        
        if (intent.type === 'move_to' && intent.target) {
            endX = intent.target.x;
            endY = intent.target.y;
        } else if (intent.type === 'attack' && intent.target) {
            endX = intent.target.x;
            endY = intent.target.y;
        } else if (intent.type === 'chase' && intent.target) {
            endX = intent.target.x;
            endY = intent.target.y;
        } else {
            return; // Unknown intent type
        }
        
        // Draw path line
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw arrow head
        const angle = Math.atan2(endY - centerY, endX - centerX);
        const arrowLength = 10;
        
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI / 6),
            endY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI / 6),
            endY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * Draw debug information overlay
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} entity 
     * @param {Object} state 
     */
    drawDebugInfo(ctx, entity, state) {
        const { x, y } = entity;
        const textY = y - 25;
        
        ctx.save();
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        
        const info = `${state.state} | ${(state.confidence * 100).toFixed(0)}%`;
        
        ctx.strokeText(info, x, textY);
        ctx.fillText(info, x, textY);
        
        ctx.restore();
    }
    
    /**
     * Draw boss-specific overlay
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} boss 
     * @param {Object} state 
     */
    drawBossOverlay(ctx, boss, state) {
        const { x, y, width } = boss;
        const barWidth = width;
        const barHeight = 6;
        const barX = x;
        const barY = y - 20;
        
        ctx.save();
        
        // Draw phase indicator bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        // Phase color
        const phaseColors = ['#4CAF50', '#FFC107', '#FF9800', '#F44336', '#9C27B0'];
        const phaseColor = phaseColors[state.phase - 1] || phaseColors[0];
        
        ctx.fillStyle = phaseColor;
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Phase text
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.fillText(`FASE ${state.phase}`, barX + barWidth / 2, barY + barHeight + 12);
        
        // Next attack warning
        if (state.nextAttack) {
            ctx.fillStyle = '#FF5252';
            ctx.font = '9px Arial';
            ctx.fillText(`⚠️ ${state.nextAttack}`, barX + barWidth / 2, barY - 5);
        }
        
        // Weakness indicator
        if (state.weakness) {
            ctx.fillStyle = '#4CAF50';
            ctx.font = '9px Arial';
            ctx.fillText(`💀 Fraco: ${state.weakness}`, barX + barWidth / 2, y + barHeight + 25);
        }
        
        ctx.restore();
    }
    
    /**
     * Update boss UI with phase information
     * @param {string} bossId 
     * @param {number} phase 
     * @param {string} nextAttack 
     * @param {string} weakness 
     */
    updateBossUI(bossId, phase, nextAttack, weakness) {
        // This can be extended to update DOM UI elements
        // For now, it's handled in drawBossOverlay
        console.log(`[BossUI] ${bossId} - Phase ${phase}, Next: ${nextAttack}, Weak: ${weakness}`);
    }
    
    /**
     * Toggle visualization settings
     * @param {string} setting 
     * @param {boolean} value 
     */
    toggleSetting(setting, value) {
        if (this.settings.hasOwnProperty(setting)) {
            this.settings[setting] = value !== undefined ? value : !this.settings[setting];
        }
    }
    
    /**
     * Get current AI state for an entity
     * @param {string} mobId 
     * @returns {Object|null}
     */
    getEntityState(mobId) {
        return this.aiEntities.get(mobId) || null;
    }
    
    /**
     * Get all tracked AI entities
     * @returns {Map}
     */
    getAllEntities() {
        return this.aiEntities;
    }
    
    /**
     * Cleanup and disconnect
     */
    destroy() {
        if (this.networkManager) {
            this.networkManager.off('ai:state_update', this.onAIStateUpdate);
            this.networkManager.off('ai:boss_phase_change', this.onBossPhaseChange);
            this.networkManager.off('ai:decision', this.onAIDecision);
            this.networkManager.off('ai:aggro_update', this.onAggroUpdate);
            this.networkManager.off('ai:reaction', this.onAIReaction);
            this.networkManager.off('tactical:tip', this.onTacticalTip);
        }
        
        this.aiEntities.clear();
        this.bossStates.clear();
        
        // Cleanup UI components
        if (this.aggroDisplay) {
            this.aggroDisplay.cleanup();
        }
        if (this.tacticalFeedback) {
            this.tacticalFeedback.cleanup();
        }
        
        console.log('[ClientAIController] Destroyed');
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientAIController;
}

if (typeof window !== 'undefined') {
    window.ClientAIController = ClientAIController;
}
