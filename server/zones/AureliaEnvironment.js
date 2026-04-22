/**
 * AureliaEnvironment.js
 * 
 * Environmental system for Aurélia desert zone
 * - Day/night cycle with heat/cold damage
 * - Sandstorm events
 * - Quicksand mechanics
 */

class AureliaEnvironment {
    constructor(database, zoneConfig) {
        this.db = database;
        this.zoneConfig = zoneConfig;
        
        // Game time (2 real hours = 24 game hours)
        this.timeScale = 12; // 1 real hour = 12 game hours
        this.currentGameTime = this.calculateGameTime(new Date());
        
        // Environmental effects state
        this.activeEffects = new Map(); // playerId -> effects
        this.playerPositions = new Map(); // playerId -> {x, y}
        this.playerInSafeZone = new Set();
        
        // Sandstorm state
        this.currentSandstorm = null;
        this.nextSandstormTime = this.calculateNextSandstorm();
        this.sandstormWarning = false;
        
        // Quicksand locations
        this.quicksandLocations = this.generateQuicksandLocations();
        
        // Update interval
        this.updateInterval = null;
        this.environmentalTickInterval = null;
        
        // Player resistances
        this.playerResistances = new Map(); // playerId -> {heat, cold}
        
        this.isRunning = false;
    }
    
    /**
     * Initialize the environmental system
     */
    async initialize() {
        console.log('[AureliaEnvironment] Initializing desert environment system...');
        
        // Load any active sandstorm from database
        await this.loadActiveSandstorm();
        
        // Start update loop
        this.startUpdateLoop();
        
        this.isRunning = true;
        console.log(`[AureliaEnvironment] System active. Next sandstorm: ${new Date(this.nextSandstormTime)}`);
    }
    
    /**
     * Calculate current game time (0-23 hours)
     */
    calculateGameTime(realTime = new Date()) {
        const hours = realTime.getHours();
        const minutes = realTime.getMinutes();
        
        // Scale real time to game time
        const totalGameHours = (hours + minutes / 60) * this.timeScale;
        return Math.floor(totalGameHours % 24);
    }
    
    /**
     * Load active sandstorm from database
     */
    async loadActiveSandstorm() {
        try {
            const activeStorm = await this.db.get(
                `SELECT * FROM sandstorm_events 
                 WHERE datetime(start_time, '+' || duration_seconds || ' seconds') > datetime('now')
                 ORDER BY start_time DESC LIMIT 1`
            );
            
            if (activeStorm) {
                const startTime = new Date(activeStorm.start_time);
                const endTime = new Date(startTime.getTime() + activeStorm.duration_seconds * 1000);
                
                if (endTime > new Date()) {
                    this.currentSandstorm = {
                        id: activeStorm.id,
                        startTime,
                        endTime,
                        intensity: activeStorm.intensity,
                        duration: activeStorm.duration_seconds
                    };
                    console.log(`[AureliaEnvironment] Loaded active sandstorm: ${activeStorm.intensity}`);
                }
            }
        } catch (error) {
            console.error('[AureliaEnvironment] Error loading sandstorm:', error);
        }
    }
    
    /**
     * Calculate next sandstorm time
     */
    calculateNextSandstorm() {
        const minInterval = this.zoneConfig.sandstormConfig.minInterval;
        const maxInterval = this.zoneConfig.sandstormConfig.maxInterval;
        const randomInterval = minInterval + Math.random() * (maxInterval - minInterval);
        return Date.now() + randomInterval;
    }
    
    /**
     * Start update loop
     */
    startUpdateLoop() {
        // Main update loop (every 1 second)
        this.updateInterval = setInterval(() => {
            this.update();
        }, 1000);
        
        // Environmental effects tick (every 10 seconds)
        this.environmentalTickInterval = setInterval(() => {
            this.environmentalTick();
        }, 10000);
    }
    
    /**
     * Main update loop
     */
    update() {
        // Update game time
        this.currentGameTime = this.calculateGameTime();
        
        // Check sandstorm
        this.updateSandstorm();
        
        // Update quicksand
        this.updateQuicksand();
    }
    
    /**
     * Update sandstorm state
     */
    updateSandstorm() {
        const now = Date.now();
        const config = this.zoneConfig.sandstormConfig;
        
        // Check if sandstorm should end
        if (this.currentSandstorm) {
            if (now >= this.currentSandstorm.endTime.getTime()) {
                this.endSandstorm();
            }
            return;
        }
        
        // Check if warning should be issued
        if (!this.sandstormWarning && now >= this.nextSandstormTime - config.warningTime) {
            this.issueSandstormWarning();
        }
        
        // Check if sandstorm should start
        if (now >= this.nextSandstormTime) {
            this.startSandstorm();
        }
    }
    
    /**
     * Issue sandstorm warning
     */
    issueSandstormWarning() {
        this.sandstormWarning = true;
        console.log('[AureliaEnvironment] Sandstorm warning issued - 1 minute until impact');
        
        // Notify all players in zone
        this.broadcastToZone({
            type: 'sandstorm_warning',
            message: '⚠️ Tempestade de areia se aproximando! Encontre abrigo no Oásis em 1 minuto!',
            timeRemaining: 60
        });
    }
    
    /**
     * Start a sandstorm
     */
    async startSandstorm() {
        const config = this.zoneConfig.sandstormConfig;
        const duration = config.minDuration + Math.random() * (config.maxDuration - config.minDuration);
        
        // Random intensity
        const intensities = ['light', 'moderate', 'severe'];
        const weights = [0.3, 0.5, 0.2]; // 30% light, 50% moderate, 20% severe
        const intensity = this.weightedRandomChoice(intensities, weights);
        
        // Save to database
        try {
            const result = await this.db.run(
                'INSERT INTO sandstorm_events (duration_seconds, intensity) VALUES (?, ?)',
                [Math.floor(duration / 1000), intensity]
            );
            
            this.currentSandstorm = {
                id: result.lastID,
                startTime: new Date(),
                endTime: new Date(Date.now() + duration),
                intensity,
                duration: Math.floor(duration / 1000)
            };
            
            console.log(`[AureliaEnvironment] Sandstorm started: ${intensity}, duration: ${Math.floor(duration / 1000)}s`);
            
            // Notify players
            this.broadcastToZone({
                type: 'sandstorm_start',
                message: `🌪️ Tempestade de areia ${intensity === 'light' ? 'leve' : intensity === 'moderate' ? 'moderada' : 'SEVERA'} atingiu Aurélia!`,
                intensity,
                effects: this.getSandstormEffects(intensity)
            });
            
            // Reset warning
            this.sandstormWarning = false;
            
        } catch (error) {
            console.error('[AureliaEnvironment] Error starting sandstorm:', error);
        }
    }
    
    /**
     * End current sandstorm
     */
    async endSandstorm() {
        if (!this.currentSandstorm) return;
        
        const stormId = this.currentSandstorm.id;
        const survivors = await this.getSandstormSurvivors(stormId);
        
        console.log(`[AureliaEnvironment] Sandstorm ended. Survivors: ${survivors.length}`);
        
        // Update database
        try {
            await this.db.run(
                'UPDATE sandstorm_events SET affected_players = ? WHERE id = ?',
                [survivors.length, stormId]
            );
        } catch (error) {
            console.error('[AureliaEnvironment] Error updating sandstorm:', error);
        }
        
        // Notify players
        this.broadcastToZone({
            type: 'sandstorm_end',
            message: '🌅 A tempestade de areia passou. O deserto retorna ao seu silêncio mortal.',
            survivors: survivors.length
        });
        
        // Clear current storm and schedule next
        this.currentSandstorm = null;
        this.nextSandstormTime = this.calculateNextSandstorm();
        
        console.log(`[AureliaEnvironment] Next sandstorm: ${new Date(this.nextSandstormTime)}`);
    }
    
    /**
     * Get effects based on sandstorm intensity
     */
    getSandstormEffects(intensity) {
        const config = this.zoneConfig.sandstormConfig;
        const multipliers = {
            light: 0.5,
            moderate: 1.0,
            severe: 1.5
        };
        
        const mult = multipliers[intensity] || 1.0;
        
        return {
            visibilityReduction: config.visibilityReduction * mult,
            speedReduction: config.speedReduction * mult,
            pushForce: config.pushForce * mult
        };
    }
    
    /**
     * Get survivors of sandstorm
     */
    async getSandstormSurvivors(stormId) {
        try {
            const survivors = await this.db.all(
                'SELECT player_id FROM sandstorm_survivors WHERE sandstorm_id = ?',
                [stormId]
            );
            return survivors.map(s => s.player_id);
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Environmental effects tick (damage, etc.)
     */
    environmentalTick() {
        const isDay = this.currentGameTime >= 6 && this.currentGameTime < 18;
        const envConfig = isDay ? this.zoneConfig.environmentalConfig.day : this.zoneConfig.environmentalConfig.night;
        
        // Apply environmental damage to all players not in safe zones
        for (const [playerId, position] of this.playerPositions) {
            if (this.playerInSafeZone.has(playerId)) continue;
            
            const resistances = this.playerResistances.get(playerId) || { heat: 0, cold: 0 };
            
            if (isDay) {
                // Heat damage
                const heatResist = resistances.heat || 0;
                const damage = Math.max(0, envConfig.heatDamage - heatResist);
                
                if (damage > 0) {
                    this.applyEnvironmentalDamage(playerId, damage, 'heat');
                }
            } else {
                // Cold damage
                const coldResist = resistances.cold || 0;
                const damage = Math.max(0, envConfig.coldDamage - coldResist);
                
                if (damage > 0) {
                    this.applyEnvironmentalDamage(playerId, damage, 'cold');
                }
            }
        }
    }
    
    /**
     * Apply environmental damage to player
     */
    applyEnvironmentalDamage(playerId, damage, type) {
        // This would be called by the game server
        // For now, just log it
        console.log(`[AureliaEnvironment] ${type} damage to ${playerId}: ${damage}`);
    }
    
    /**
     * Update quicksand mechanics
     */
    updateQuicksand() {
        for (const [playerId, position] of this.playerPositions) {
            if (this.playerInSafeZone.has(playerId)) continue;
            
            // Check if player is in quicksand
            const quicksand = this.isInQuicksand(position.x, position.y);
            if (quicksand) {
                this.applyQuicksandEffect(playerId, quicksand);
            }
        }
    }
    
    /**
     * Generate quicksand locations
     */
    generateQuicksandLocations() {
        const locations = [];
        const numPatches = 15;
        
        for (let i = 0; i < numPatches; i++) {
            // Random position in golden dunes and ruins areas
            locations.push({
                x: 200 + Math.random() * 1500,
                y: 200 + Math.random() * 1000,
                radius: 30 + Math.random() * 40,
                strength: 0.3 + Math.random() * 0.4 // Pull strength
            });
        }
        
        return locations;
    }
    
    /**
     * Check if position is in quicksand
     */
    isInQuicksand(x, y) {
        for (const quicksand of this.quicksandLocations) {
            const dx = x - quicksand.x;
            const dy = y - quicksand.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= quicksand.radius) {
                return quicksand;
            }
        }
        return null;
    }
    
    /**
     * Apply quicksand effect to player
     */
    applyQuicksandEffect(playerId, quicksand) {
        // Send effect to player - they need to move to escape
        this.sendToPlayer(playerId, {
            type: 'quicksand',
            message: '⚠️ Você está afundando na areia movediça! Mova-se rapidamente!',
            pullStrength: quicksand.strength
        });
    }
    
    /**
     * Register player in environment
     */
    registerPlayer(playerId, initialPosition, resistances = { heat: 0, cold: 0 }) {
        this.playerPositions.set(playerId, initialPosition);
        this.playerResistances.set(playerId, resistances);
        this.activeEffects.set(playerId, {
            heatDamage: 0,
            coldDamage: 0,
            inQuicksand: false
        });
        
        // Check if in safe zone
        if (this.zoneConfig.isInSafeZone(initialPosition.x, initialPosition.y)) {
            this.playerInSafeZone.add(playerId);
        }
        
        console.log(`[AureliaEnvironment] Player ${playerId} registered`);
    }
    
    /**
     * Update player position
     */
    updatePlayerPosition(playerId, x, y) {
        this.playerPositions.set(playerId, { x, y });
        
        // Check safe zone status
        const wasInSafeZone = this.playerInSafeZone.has(playerId);
        const isInSafeZone = this.zoneConfig.isInSafeZone(x, y);
        
        if (isInSafeZone && !wasInSafeZone) {
            this.playerInSafeZone.add(playerId);
            this.sendToPlayer(playerId, {
                type: 'safe_zone_enter',
                message: '🏝️ Você entrou no Oásis de Shamara. Protegido do clima extremo.'
            });
        } else if (!isInSafeZone && wasInSafeZone) {
            this.playerInSafeZone.delete(playerId);
            this.sendToPlayer(playerId, {
                type: 'safe_zone_exit',
                message: '🌵 Você deixou o oásis. O deserto aguarda...'
            });
        }
        
        // Check sub-zone discovery
        const subZone = this.zoneConfig.getSubZoneAt(x, y);
        if (subZone && subZone.id !== 'oasis') {
            // Could trigger discovery notification
        }
    }
    
    /**
     * Update player resistances
     */
    updatePlayerResistances(playerId, heatResist, coldResist) {
        this.playerResistances.set(playerId, {
            heat: heatResist,
            cold: coldResist
        });
    }
    
    /**
     * Unregister player
     */
    unregisterPlayer(playerId) {
        this.playerPositions.delete(playerId);
        this.playerResistances.delete(playerId);
        this.activeEffects.delete(playerId);
        this.playerInSafeZone.delete(playerId);
        
        console.log(`[AureliaEnvironment] Player ${playerId} unregistered`);
    }
    
    /**
     * Get current environmental state for a player
     */
    getPlayerEnvironmentState(playerId) {
        const isDay = this.currentGameTime >= 6 && this.currentGameTime < 18;
        const envConfig = isDay ? this.zoneConfig.environmentalConfig.day : this.zoneConfig.environmentalConfig.night;
        const position = this.playerPositions.get(playerId);
        const inSafeZone = this.playerInSafeZone.has(playerId);
        const resistances = this.playerResistances.get(playerId) || { heat: 0, cold: 0 };
        
        const state = {
            gameTime: this.currentGameTime,
            isDay,
            inSafeZone,
            environmentalEffects: null,
            sandstorm: null,
            quicksand: null,
            resistanceBonus: resistances
        };
        
        // Environmental effects (only if not in safe zone)
        if (!inSafeZone) {
            state.environmentalEffects = {
                type: isDay ? 'heat' : 'cold',
                damage: isDay ? envConfig.heatDamage : envConfig.coldDamage,
                description: envConfig.description,
                nextTick: envConfig.damageInterval
            };
            
            // Apply resistance reduction
            if (isDay) {
                state.environmentalEffects.damage = Math.max(0, state.environmentalEffects.damage - resistances.heat);
            } else {
                state.environmentalEffects.damage = Math.max(0, state.environmentalEffects.damage - resistances.cold);
            }
        }
        
        // Sandstorm effects
        if (this.currentSandstorm && !inSafeZone) {
            state.sandstorm = {
                active: true,
                intensity: this.currentSandstorm.intensity,
                timeRemaining: Math.floor((this.currentSandstorm.endTime - Date.now()) / 1000),
                ...this.getSandstormEffects(this.currentSandstorm.intensity)
            };
        }
        
        // Quicksand check
        if (position && !inSafeZone) {
            const quicksand = this.isInQuicksand(position.x, position.y);
            if (quicksand) {
                state.quicksand = {
                    active: true,
                    pullStrength: quicksand.strength,
                    warning: 'Mova-se para escapar!'
                };
            }
        }
        
        return state;
    }
    
    /**
     * Get full environmental state for broadcast
     */
    getGlobalEnvironmentState() {
        const isDay = this.currentGameTime >= 6 && this.currentGameTime < 18;
        
        return {
            gameTime: this.currentGameTime,
            isDay,
            timeOfDay: this.getTimeOfDayString(),
            sandstorm: this.currentSandstorm ? {
                active: true,
                intensity: this.currentSandstorm.intensity,
                timeRemaining: Math.floor((this.currentSandstorm.endTime - Date.now()) / 1000)
            } : {
                active: false,
                nextIn: Math.floor((this.nextSandstormTime - Date.now()) / 1000),
                warning: this.sandstormWarning
            }
        };
    }
    
    /**
     * Get time of day string
     */
    getTimeOfDayString() {
        const hour = this.currentGameTime;
        if (hour >= 5 && hour < 7) return 'Amanhecer';
        if (hour >= 7 && hour < 12) return 'Manhã';
        if (hour >= 12 && hour < 14) return 'Meio-dia';
        if (hour >= 14 && hour < 17) return 'Tarde';
        if (hour >= 17 && hour < 19) return 'Entardecer';
        if (hour >= 19 && hour < 21) return 'Anoitecer';
        return 'Noite';
    }
    
    /**
     * Weighted random choice helper
     */
    weightedRandomChoice(items, weights) {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }
    
    /**
     * Broadcast message to all players in zone
     */
    broadcastToZone(message) {
        // This would integrate with the game's broadcast system
        console.log(`[AureliaEnvironment] Broadcast: ${message.type || message}`);
    }
    
    /**
     * Send message to specific player
     */
    sendToPlayer(playerId, message) {
        // This would integrate with the game's player messaging system
        console.log(`[AureliaEnvironment] To ${playerId}: ${message.type || message}`);
    }
    
    /**
     * Record sandstorm survival
     */
    async recordSurvival(playerId, sandstormId, durationExposed) {
        try {
            await this.db.run(
                'INSERT INTO sandstorm_survivors (player_id, sandstorm_id, duration_exposed) VALUES (?, ?, ?)',
                [playerId, sandstormId, durationExposed]
            );
            
            // Increment player's survival count
            await this.db.run(
                'UPDATE aurelia_zone_data SET sandstorms_survived = sandstorms_survived + 1 WHERE player_id = ?',
                [playerId]
            );
        } catch (error) {
            console.error('[AureliaEnvironment] Error recording survival:', error);
        }
    }
    
    /**
     * Get environmental statistics
     */
    async getEnvironmentStats() {
        try {
            const stats = await this.db.get(
                `SELECT 
                    COUNT(*) as total_sandstorms,
                    AVG(affected_players) as avg_affected,
                    SUM(affected_players) as total_affected
                 FROM sandstorm_events`
            );
            
            return {
                currentTime: this.currentGameTime,
                isDay: this.currentGameTime >= 6 && this.currentGameTime < 18,
                activeSandstorm: this.currentSandstorm ? {
                    intensity: this.currentSandstorm.intensity,
                    timeRemaining: Math.floor((this.currentSandstorm.endTime - Date.now()) / 1000)
                } : null,
                nextSandstormIn: this.currentSandstorm ? null : Math.floor((this.nextSandstormTime - Date.now()) / 1000),
                totalSandstorms: stats.total_sandstorms || 0,
                avgPlayersAffected: Math.round(stats.avg_affected || 0),
                totalPlayersAffected: stats.total_affected || 0
            };
        } catch (error) {
            console.error('[AureliaEnvironment] Error getting stats:', error);
            return null;
        }
    }
    
    /**
     * Force start sandstorm (admin command)
     */
    async forceStartSandstorm(intensity = 'moderate', durationMinutes = 5) {
        if (this.currentSandstorm) {
            await this.endSandstorm();
        }
        
        this.nextSandstormTime = Date.now();
        this.sandstormWarning = false;
        
        // Override config temporarily
        const originalMinDuration = this.zoneConfig.sandstormConfig.minDuration;
        const originalMaxDuration = this.zoneConfig.sandstormConfig.maxDuration;
        
        this.zoneConfig.sandstormConfig.minDuration = durationMinutes * 60 * 1000;
        this.zoneConfig.sandstormConfig.maxDuration = (durationMinutes + 1) * 60 * 1000;
        
        // Manually set intensity
        this.currentSandstorm = {
            id: 'forced_' + Date.now(),
            startTime: new Date(),
            endTime: new Date(Date.now() + durationMinutes * 60 * 1000),
            intensity,
            duration: durationMinutes * 60
        };
        
        // Broadcast
        this.broadcastToZone({
            type: 'sandstorm_start',
            message: `🌪️ Tempestade de areia ${intensity} INICIADA POR ADMIN!`,
            intensity,
            effects: this.getSandstormEffects(intensity),
            forced: true
        });
        
        // Restore config
        this.zoneConfig.sandstormConfig.minDuration = originalMinDuration;
        this.zoneConfig.sandstormConfig.maxDuration = originalMaxDuration;
        
        return { success: true, message: `Sandstorm ${intensity} started` };
    }
    
    /**
     * Force stop sandstorm (admin command)
     */
    async forceStopSandstorm() {
        if (!this.currentSandstorm) {
            return { success: false, message: 'No active sandstorm' };
        }
        
        await this.endSandstorm();
        return { success: true, message: 'Sandstorm stopped' };
    }
    
    /**
     * Stop update loop
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.environmentalTickInterval) {
            clearInterval(this.environmentalTickInterval);
            this.environmentalTickInterval = null;
        }
        this.isRunning = false;
        console.log('[AureliaEnvironment] System stopped');
    }
    
    /**
     * Cleanup
     */
    async cleanup() {
        this.stop();
        
        // End any active sandstorm
        if (this.currentSandstorm) {
            await this.endSandstorm();
        }
        
        // Clear all data
        this.playerPositions.clear();
        this.playerResistances.clear();
        this.activeEffects.clear();
        this.playerInSafeZone.clear();
        
        console.log('[AureliaEnvironment] Cleanup complete');
    }
}

module.exports = AureliaEnvironment;
