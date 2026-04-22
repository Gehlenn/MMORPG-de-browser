/**
 * AureliaTransition.js
 * 
 * Zone transition system for Aurélia
 * Handles player movement between zones with effects and validations
 */

class AureliaTransition {
    constructor(zoneManager, database) {
        this.zoneManager = zoneManager;
        this.db = database;
        
        // Transition points
        this.portals = new Map();
        this.activeTransitions = new Map(); // playerId -> transition data
        
        // Transition configuration
        this.transitionDelay = 3000; // 3 seconds
        this.cooldownPeriod = 5000; // 5 seconds between transitions
        
        // Environmental effects
        this.effects = {
            heatExhaustion: {
                name: 'Heat Exhaustion',
                appliesTo: 'all', // entering from any zone during day
                duration: 10000,
                moveSpeedReduction: 0.2,
                staminaDrain: 5
            },
            sandInEyes: {
                name: 'Sand in Eyes',
                appliesTo: 'eldoria', // entering from Eldoria (forest to desert)
                duration: 5000,
                accuracyReduction: 0.15,
                visualEffect: 'sand_particles'
            },
            cultureShock: {
                name: 'Culture Shock',
                appliesTo: 'lumina', // entering from Lumina (city to desert)
                duration: 15000,
                staminaRegenReduction: 0.3,
                socialBonus: -10
            },
            relief: {
                name: 'Relief from Heat',
                appliesTo: 'exiting', // leaving Aurelia
                duration: 8000,
                staminaRegenBoost: 0.5,
                hpRegenBoost: 0.1
            }
        };
        
        // Sandstorm transition blocker
        this.sandstormBlockChance = 0.7; // 70% chance to block during sandstorm
        
        this.initialize();
    }
    
    /**
     * Initialize transition system
     */
    async initialize() {
        console.log('[AureliaTransition] Initializing zone transition system...');
        
        // Register portals
        this.registerPortals();
        
        // Load portal data from database
        await this.loadPortalData();
        
        console.log('[AureliaTransition] System initialized with', this.portals.size, 'portals');
    }
    
    /**
     * Register default portals
     */
    registerPortals() {
        // Portal to Eldoria (west)
        this.portals.set('aurelia_to_eldoria', {
            id: 'aurelia_to_eldoria',
            from: 'aurelia',
            to: 'eldoria',
            fromX: 100,
            fromY: 2000,
            toX: 2400,
            toY: 2000,
            direction: 'west',
            levelRequirement: 35,
            requiresItem: null
        });
        
        // Portal from Eldoria (east)
        this.portals.set('eldoria_to_aurelia', {
            id: 'eldoria_to_aurelia',
            from: 'eldoria',
            to: 'aurelia',
            fromX: 2500,
            fromY: 2000,
            toX: 150,
            toY: 2000,
            direction: 'east',
            levelRequirement: 35,
            requiresItem: null
        });
        
        // Portal to Lumina (safe zone, south)
        this.portals.set('aurelia_to_lumina', {
            id: 'aurelia_to_lumina',
            from: 'aurelia',
            to: 'lumina',
            fromX: 2000,
            fromY: 100,
            toX: 2000,
            toY: 4900,
            direction: 'south',
            levelRequirement: 1,
            requiresItem: null,
            isSafe: true
        });
        
        // Oasis portal (within Aurelia)
        this.portals.set('oasis_gate', {
            id: 'oasis_gate',
            from: 'aurelia',
            to: 'aurelia_oasis',
            fromX: 1500,
            fromY: 1500,
            toX: 500,
            toY: 500,
            direction: 'teleport',
            levelRequirement: 40,
            requiresItem: 'oasis_key',
            isInstance: true
        });
        
        // Pyramid portal (raid entrance)
        this.portals.set('pyramid_entrance', {
            id: 'pyramid_entrance',
            from: 'aurelia',
            to: 'pyramid_anub',
            fromX: 2000,
            fromY: 500,
            toX: 2000,
            toY: 900,
            direction: 'enter',
            levelRequirement: 60,
            requiresItem: 'sun_artifact',
            isRaid: true,
            minGroupSize: 5,
            maxGroupSize: 8
        });
    }
    
    /**
     * Load portal data from database
     */
    async loadPortalData() {
        try {
            const rows = await this.db.all(
                'SELECT * FROM aurelia_transitions WHERE active = 1'
            );
            
            for (const row of rows) {
                this.portals.set(row.portal_id, {
                    id: row.portal_id,
                    from: row.from_zone,
                    to: row.to_zone,
                    fromX: row.from_x,
                    fromY: row.from_y,
                    toX: row.to_x,
                    toY: row.to_y,
                    levelRequirement: row.level_requirement,
                    requiresItem: row.requires_item,
                    useCount: row.use_count,
                    lastUsed: row.last_used
                });
            }
        } catch (error) {
            console.error('[AureliaTransition] Error loading portal data:', error);
        }
    }
    
    /**
     * Check if player can use portal
     */
    async canUsePortal(player, portalId, environment) {
        const portal = this.portals.get(portalId);
        if (!portal) {
            return { allowed: false, reason: 'Portal not found' };
        }
        
        // Check level requirement
        if (player.level < portal.levelRequirement) {
            return {
                allowed: false,
                reason: `Requires level ${portal.levelRequirement}`,
                requiredLevel: portal.levelRequirement
            };
        }
        
        // Check required item
        if (portal.requiresItem && !player.inventory?.hasItem(portal.requiresItem)) {
            return {
                allowed: false,
                reason: `Requires item: ${portal.requiresItem}`,
                requiredItem: portal.requiresItem
            };
        }
        
        // Check cooldown
        const lastTransition = this.activeTransitions.get(player.id);
        if (lastTransition) {
            const timeSinceTransition = Date.now() - lastTransition.timestamp;
            if (timeSinceTransition < this.cooldownPeriod) {
                return {
                    allowed: false,
                    reason: 'Transition cooldown active',
                    cooldownRemaining: this.cooldownPeriod - timeSinceTransition
                };
            }
        }
        
        // Check sandstorm (blocks transition)
        if (environment?.sandstormActive) {
            const roll = Math.random();
            if (roll < this.sandstormBlockChance) {
                return {
                    allowed: false,
                    reason: 'SANDSTORM! The portal is obscured by swirling sands.',
                    sandstorm: true
                };
            }
        }
        
        // Check raid requirements
        if (portal.isRaid) {
            const groupSize = player.group?.members?.length || 1;
            if (groupSize < portal.minGroupSize) {
                return {
                    allowed: false,
                    reason: `Raid requires ${portal.minGroupSize}-${portal.maxGroupSize} players`,
                    currentGroupSize: groupSize
                };
            }
        }
        
        // Check distance to portal
        const distance = Math.sqrt(
            Math.pow(player.x - portal.fromX, 2) +
            Math.pow(player.y - portal.fromY, 2)
        );
        
        if (distance > 100) {
            return {
                allowed: false,
                reason: 'Too far from portal',
                distance
            };
        }
        
        return { allowed: true, portal };
    }
    
    /**
     * Start zone transition
     */
    async startTransition(player, portalId, environment) {
        const check = await this.canUsePortal(player, portalId, environment);
        
        if (!check.allowed) {
            return {
                success: false,
                message: check.reason,
                ...check
            };
        }
        
        const portal = check.portal;
        
        // Create transition record
        const transition = {
            playerId: player.id,
            fromZone: portal.from,
            toZone: portal.to,
            fromX: player.x,
            fromY: player.y,
            toX: portal.toX,
            toY: portal.toY,
            portalId,
            timestamp: Date.now(),
            effects: this.calculateTransitionEffects(player, portal, environment),
            status: 'in_progress'
        };
        
        this.activeTransitions.set(player.id, transition);
        
        // Save to database
        await this.saveTransition(transition);
        
        // Send transition start event
        return {
            success: true,
            transitionId: `${player.id}_${Date.now()}`,
            delay: this.transitionDelay,
            effects: transition.effects,
            destination: {
                zone: portal.to,
                x: portal.toX,
                y: portal.toY
            },
            message: this.getTransitionMessage(portal, environment)
        };
    }
    
    /**
     * Complete transition after delay
     */
    async completeTransition(playerId) {
        const transition = this.activeTransitions.get(playerId);
        if (!transition) {
            return { success: false, reason: 'No active transition' };
        }
        
        // Apply transition effects
        await this.applyTransitionEffects(playerId, transition.effects);
        
        // Update portal stats
        await this.updatePortalStats(transition.portalId);
        
        // Update transition status
        transition.status = 'completed';
        transition.completedAt = Date.now();
        await this.updateTransitionStatus(transition);
        
        // Clean up after cooldown
        setTimeout(() => {
            this.activeTransitions.delete(playerId);
        }, this.cooldownPeriod);
        
        return {
            success: true,
            fromZone: transition.fromZone,
            toZone: transition.toZone,
            position: {
                x: transition.toX,
                y: transition.toY
            },
            effectsApplied: transition.effects.map(e => e.name)
        };
    }
    
    /**
     * Cancel active transition
     */
    cancelTransition(playerId) {
        const transition = this.activeTransitions.get(playerId);
        if (!transition) return { success: false, reason: 'No active transition' };
        
        transition.status = 'cancelled';
        this.activeTransitions.delete(playerId);
        
        return {
            success: true,
            message: 'Transition cancelled'
        };
    }
    
    /**
     * Calculate effects for transition
     */
    calculateTransitionEffects(player, portal, environment) {
        const effects = [];
        
        // Zone entry effects
        if (portal.to === 'aurelia') {
            // Entering Aurelia
            
            // Heat exhaustion during day
            if (environment?.isDaytime) {
                effects.push({
                    ...this.effects.heatExhaustion,
                    type: 'debuff'
                });
            }
            
            // Coming from specific zones
            if (portal.from === 'eldoria') {
                effects.push({
                    ...this.effects.sandInEyes,
                    type: 'debuff'
                });
            }
            
            if (portal.from === 'lumina') {
                effects.push({
                    ...this.effects.cultureShock,
                    type: 'debuff'
                });
            }
        }
        
        // Exiting Aurelia
        if (portal.from === 'aurelia') {
            effects.push({
                ...this.effects.relief,
                type: 'buff'
            });
        }
        
        // Raid entrance effect
        if (portal.isRaid) {
            effects.push({
                name: 'Raid Focus',
                type: 'buff',
                duration: -1, // Until raid ends
                damageBoost: 0.1,
                message: 'The spirit of ancient warriors strengthens you'
            });
        }
        
        return effects;
    }
    
    /**
     * Apply transition effects to player
     */
    async applyTransitionEffects(playerId, effects) {
        // In real implementation, would apply status effects to player
        console.log(`[AureliaTransition] Applying ${effects.length} effects to player ${playerId}`);
        
        for (const effect of effects) {
            console.log(`  - ${effect.name} (${effect.type})`);
        }
    }
    
    /**
     * Get transition message based on conditions
     */
    getTransitionMessage(portal, environment) {
        if (portal.isRaid) {
            return '⚔️ You approach the ancient pyramid. The air grows heavy with anticipation...';
        }
        
        if (portal.to === 'aurelia') {
            if (environment?.sandstormActive) {
                return '🌪️ You step into a wall of swirling sand. The desert claims you...';
            }
            if (environment?.isDaytime) {
                return '☀️ The scorching heat of Aurélia washes over you as you enter the desert...';
            }
            return '🌙 The cool night air of the desert greets you. Stars glitter above...';
        }
        
        if (portal.from === 'aurelia') {
            return '🌿 Leaving the desert behind, you feel the tension ease from your shoulders...';
        }
        
        return 'Transitioning...';
    }
    
    /**
     * Save transition to database
     */
    async saveTransition(transition) {
        try {
            await this.db.run(
                `INSERT INTO aurelia_transitions_log 
                 (player_id, from_zone, to_zone, from_x, from_y, to_x, to_y, 
                  transition_time, environmental_effects)
                 VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
                [
                    transition.playerId,
                    transition.fromZone,
                    transition.toZone,
                    transition.fromX,
                    transition.fromY,
                    transition.toX,
                    transition.toY,
                    JSON.stringify(transition.effects)
                ]
            );
        } catch (error) {
            console.error('[AureliaTransition] Error saving transition:', error);
        }
    }
    
    /**
     * Update portal usage stats
     */
    async updatePortalStats(portalId) {
        try {
            await this.db.run(
                `UPDATE aurelia_transitions 
                 SET use_count = use_count + 1, last_used = datetime('now')
                 WHERE portal_id = ?`,
                [portalId]
            );
        } catch (error) {
            console.error('[AureliaTransition] Error updating portal stats:', error);
        }
    }
    
    /**
     * Update transition status
     */
    async updateTransitionStatus(transition) {
        try {
            await this.db.run(
                `UPDATE aurelia_transitions_log 
                 SET status = ?
                 WHERE player_id = ? AND transition_time = ?`,
                [
                    transition.status,
                    transition.playerId,
                    new Date(transition.timestamp).toISOString()
                ]
            );
        } catch (error) {
            console.error('[AureliaTransition] Error updating transition status:', error);
        }
    }
    
    /**
     * Get portal info for client
     */
    getPortalInfo(portalId) {
        const portal = this.portals.get(portalId);
        if (!portal) return null;
        
        return {
            id: portal.id,
            from: portal.from,
            to: portal.to,
            fromX: portal.fromX,
            fromY: portal.fromY,
            direction: portal.direction,
            levelRequirement: portal.levelRequirement,
            requiresItem: portal.requiresItem,
            isRaid: portal.isRaid,
            minGroupSize: portal.minGroupSize,
            maxGroupSize: portal.maxGroupSize
        };
    }
    
    /**
     * Get all portals for a zone
     */
    getZonePortals(zoneId) {
        const zonePortals = [];
        
        for (const [id, portal] of this.portals) {
            if (portal.from === zoneId) {
                zonePortals.push(this.getPortalInfo(id));
            }
        }
        
        return zonePortals;
    }
    
    /**
     * Get player's active transition
     */
    getPlayerTransition(playerId) {
        return this.activeTransitions.get(playerId) || null;
    }
    
    /**
     * Get transition statistics
     */
    async getStatistics() {
        try {
            const totalTransitions = await this.db.get(
                'SELECT COUNT(*) as count FROM aurelia_transitions_log'
            );
            
            const popularPortal = await this.db.get(
                `SELECT portal_id, COUNT(*) as count 
                 FROM aurelia_transitions_log 
                 GROUP BY portal_id 
                 ORDER BY count DESC 
                 LIMIT 1`
            );
            
            const blockedBySandstorm = await this.db.get(
                `SELECT COUNT(*) as count 
                 FROM aurelia_transitions_log 
                 WHERE status = 'blocked' 
                 AND environmental_effects LIKE '%sandstorm%'`
            );
            
            return {
                totalTransitions: totalTransitions?.count || 0,
                mostUsedPortal: popularPortal?.portal_id || 'none',
                blockedBySandstorm: blockedBySandstorm?.count || 0,
                activeTransitions: this.activeTransitions.size
            };
        } catch (error) {
            console.error('[AureliaTransition] Error getting statistics:', error);
            return null;
        }
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        this.activeTransitions.clear();
        this.portals.clear();
    }
}

module.exports = AureliaTransition;
