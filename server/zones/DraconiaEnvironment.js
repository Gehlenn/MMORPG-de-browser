/**
 * DraconiaEnvironment.js
 * 
 * Environmental system for Draconia - The Dragon Peaks
 * High altitude, extreme weather, volcanic activity
 */

const EventEmitter = require('events');

class DraconiaEnvironment extends EventEmitter {
    constructor(database, zone) {
        super();
        this.db = database;
        this.zone = zone;
        
        // Weather state
        this.currentWeather = 'clear'; // clear, ash_storm, avalanche, dragon_roar
        this.weatherIntensity = 0;
        this.weatherStartTime = 0;
        this.weatherDuration = 0;
        
        // Altitude sickness tracking
        this.playerAltitudeData = new Map(); // playerId -> { sicknessLevel, timeAtAltitude }
        
        // Environmental hazards
        this.thermalVents = this.setupThermalVents();
        this.iceFissures = this.setupIceFissures();
        this.lavaRivers = this.setupLavaRivers();
        
        // Wind system (Wyvern Heights)
        this.windDirection = { x: 1, y: 0 }; // Changes periodically
        this.windStrength = 0.5; // 0-1
        this.lastWindChange = Date.now();
        
        // Update loop
        this.updateInterval = null;
        this.lastUpdate = Date.now();
        
        // Constants
        this.ALTITUDE_SICKNESS_THRESHOLD = 30000; // 30 seconds
        this.THIN_AIR_STAMINA_PENALTY = 0.5; // 50% reduction
        this.ASH_STORM_DAMAGE = 5; // Per second
        this.LAVA_DAMAGE = 100; // Per second (fatal)
        this.THERMAL_VENT_DAMAGE = 15; // Per tick
        this.ICE_FISSURE_DAMAGE = 20; // Per tick
        
        this.initialized = false;
    }
    
    async initialize() {
        console.log('[DraconiaEnvironment] Initializing Draconia environmental system...');
        
        // Start weather system
        this.startWeatherSystem();
        
        // Start update loop
        this.startUpdateLoop();
        
        this.initialized = true;
        console.log('[DraconiaEnvironment] Environmental system initialized');
        this.emit('initialized');
        return true;
    }
    
    setupThermalVents() {
        return [
            { id: 'vent_1', x: 1400, y: 950, radius: 50, active: true },
            { id: 'vent_2', x: 1600, y: 1050, radius: 60, active: true },
            { id: 'vent_3', x: 1500, y: 1100, radius: 45, active: true },
            { id: 'vent_4', x: 1450, y: 1000, radius: 55, active: true },
            { id: 'vent_5', x: 1550, y: 950, radius: 50, active: true }
        ];
    }
    
    setupIceFissures() {
        return [
            { id: 'fissure_1', x: 1700, y: 900, radius: 80, active: true },
            { id: 'fissure_2', x: 1650, y: 1150, radius: 70, active: true },
            { id: 'fissure_3', x: 1750, y: 1050, radius: 90, active: true },
            { id: 'fissure_4', x: 1600, y: 950, radius: 75, active: true }
        ];
    }
    
    setupLavaRivers() {
        return [
            { 
                id: 'lava_river_1', 
                points: [
                    { x: 3800, y: 1800 },
                    { x: 3900, y: 1900 },
                    { x: 4000, y: 2000 },
                    { x: 4100, y: 2100 }
                ],
                width: 60,
                active: true 
            },
            {
                id: 'lava_pool_1',
                x: 4200,
                y: 2200,
                radius: 150,
                active: true
            }
        ];
    }
    
    startWeatherSystem() {
        // Schedule random weather events
        this.scheduleNextWeatherEvent();
    }
    
    scheduleNextWeatherEvent() {
        // Random weather in 5-15 minutes
        const delay = (5 + Math.random() * 10) * 60 * 1000;
        
        setTimeout(() => {
            this.triggerRandomWeatherEvent();
        }, delay);
    }
    
    triggerRandomWeatherEvent() {
        const events = ['ash_storm', 'avalanche', 'dragon_roar', 'clear'];
        const weights = [0.3, 0.2, 0.1, 0.4]; // Probabilities
        
        const random = Math.random();
        let cumulative = 0;
        let selectedEvent = 'clear';
        
        for (let i = 0; i < events.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                selectedEvent = events[i];
                break;
            }
        }
        
        if (selectedEvent !== 'clear') {
            this.startWeatherEvent(selectedEvent);
        }
        
        // Schedule next event
        this.scheduleNextWeatherEvent();
    }
    
    startWeatherEvent(eventType, duration = null) {
        this.currentWeather = eventType;
        this.weatherStartTime = Date.now();
        this.weatherDuration = duration || this.getWeatherDuration(eventType);
        this.weatherIntensity = 1.0;
        
        console.log(`[DraconiaEnvironment] Weather event started: ${eventType}`);
        
        // Log to database
        this.logWeatherEvent(eventType);
        
        // Emit event
        this.emit('weatherChange', {
            type: eventType,
            intensity: this.weatherIntensity,
            duration: this.weatherDuration
        });
        
        // End weather after duration
        setTimeout(() => {
            this.endWeatherEvent();
        }, this.weatherDuration);
    }
    
    getWeatherDuration(eventType) {
        const durations = {
            'ash_storm': (5 + Math.random() * 5) * 60 * 1000, // 5-10 min
            'avalanche': 30000, // 30 seconds
            'dragon_roar': 30000, // 30 seconds
            'clear': 0
        };
        return durations[eventType] || 0;
    }
    
    endWeatherEvent() {
        if (this.currentWeather !== 'clear') {
            console.log(`[DraconiaEnvironment] Weather event ended: ${this.currentWeather}`);
            this.currentWeather = 'clear';
            this.weatherIntensity = 0;
            
            this.emit('weatherChange', {
                type: 'clear',
                intensity: 0,
                duration: 0
            });
        }
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 1000); // Update every second
    }
    
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // Update wind
        this.updateWind();
        
        // Apply environmental effects to players
        for (const [playerId, player] of this.zone.players) {
            this.applyEnvironmentalEffects(playerId, deltaTime);
        }
        
        // Emit periodic updates
        if (now % 5000 < 1000) { // Every ~5 seconds
            this.emit('environmentUpdate', this.getClientData());
        }
    }
    
    updateWind() {
        const now = Date.now();
        
        // Change wind every 10-30 seconds
        if (now - this.lastWindChange > (10 + Math.random() * 20) * 1000) {
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            this.windDirection = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };
            this.windStrength = 0.3 + Math.random() * 0.7; // 0.3-1.0
            this.lastWindChange = now;
            
            this.emit('windChange', {
                direction: this.windDirection,
                strength: this.windStrength
            });
        }
    }
    
    applyEnvironmentalEffects(playerId, deltaTime) {
        const player = this.zone.players.get(playerId);
        if (!player) return;
        
        // Skip if in safe zone
        if (this.zone.isInSafeZone(player.x, player.y)) {
            this.resetAltitudeSickness(playerId);
            return;
        }
        
        const subZone = this.zone.getSubZoneAt(player.x, player.y);
        
        // Altitude sickness (all zones except safe zone)
        this.updateAltitudeSickness(playerId, deltaTime);
        
        // Weather effects
        this.applyWeatherEffects(playerId, player);
        
        // Sub-zone specific effects
        if (subZone) {
            this.applySubZoneEffects(playerId, player, subZone);
        }
    }
    
    updateAltitudeSickness(playerId, deltaTime) {
        const data = this.playerAltitudeData.get(playerId) || {
            sicknessLevel: 0,
            timeAtAltitude: 0,
            lastUpdate: Date.now()
        };
        
        // Check if player has Thin Air Mask
        const player = this.zone.players.get(playerId);
        const hasMask = player.inventory?.hasItem('thin_air_mask');
        
        if (hasMask) {
            // Reset sickness
            data.sicknessLevel = Math.max(0, data.sicknessLevel - deltaTime * 0.5);
        } else {
            // Accumulate sickness
            data.timeAtAltitude += deltaTime * 1000;
            
            if (data.timeAtAltitude > this.ALTITUDE_SICKNESS_THRESHOLD) {
                data.sicknessLevel = Math.min(3, Math.floor(
                    (data.timeAtAltitude - this.ALTITUDE_SICKNESS_THRESHOLD) / 30000
                ) + 1);
            }
        }
        
        data.lastUpdate = Date.now();
        this.playerAltitudeData.set(playerId, data);
        
        // Apply sickness effects
        if (data.sicknessLevel > 0 && player.takeDamage) {
            const damage = data.sicknessLevel * 2; // 2, 4, 6 damage per tick
            player.takeDamage(damage, 'environment', 'true');
            
            // Reduce stats
            if (player.stats) {
                player.stats.staminaRegen = (player.stats.staminaRegen || 1) * 
                    Math.pow(this.THIN_AIR_STAMINA_PENALTY, data.sicknessLevel);
            }
        }
    }
    
    resetAltitudeSickness(playerId) {
        this.playerAltitudeData.set(playerId, {
            sicknessLevel: 0,
            timeAtAltitude: 0,
            lastUpdate: Date.now()
        });
    }
    
    applyWeatherEffects(playerId, player) {
        switch (this.currentWeather) {
            case 'ash_storm':
                this.applyAshStormDamage(playerId, player);
                break;
            case 'dragon_roar':
                this.applyDragonRoarEffect(playerId, player);
                break;
            case 'avalanche':
                // Avalanche damage is location-based, handled separately
                break;
        }
    }
    
    applyAshStormDamage(playerId, player) {
        // Check if player has mask/helmet
        const hasProtection = player.equipment?.helmet || 
                             player.inventory?.hasItem('thin_air_mask');
        
        if (!hasProtection && player.takeDamage) {
            const damage = this.ASH_STORM_DAMAGE * this.weatherIntensity;
            player.takeDamage(damage, 'environment', 'true');
            
            // Apply blind effect
            if (player.applyStatusEffect) {
                player.applyStatusEffect({
                    type: 'blind',
                    duration: 2000,
                    intensity: 0.5
                });
            }
        }
    }
    
    applyDragonRoarEffect(playerId, player) {
        // Fear effect
        if (player.applyStatusEffect && Math.random() < 0.3) {
            player.applyStatusEffect({
                type: 'fear',
                duration: 2000,
                description: 'The dragon\'s roar fills you with terror!'
            });
        }
    }
    
    applySubZoneEffects(playerId, player, subZone) {
        switch (subZone.id) {
            case 'frostfire_ridge':
                this.checkThermalVentDamage(playerId, player);
                this.checkIceFissureDamage(playerId, player);
                break;
            case 'wyvern_heights':
                this.applyWindEffects(playerId, player);
                break;
            case 'volcanic_core':
                this.checkLavaDamage(playerId, player);
                this.checkToxicFumes(playerId, player);
                break;
        }
    }
    
    checkThermalVentDamage(playerId, player) {
        for (const vent of this.thermalVents) {
            if (!vent.active) continue;
            
            const dx = player.x - vent.x;
            const dy = player.y - vent.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= vent.radius) {
                if (player.takeDamage) {
                    player.takeDamage(this.THERMAL_VENT_DAMAGE, 'environment', 'true');
                }
                
                // Can be used against ice mobs (not implemented here)
                this.emit('thermalVentDamage', { playerId, ventId: vent.id });
                break;
            }
        }
    }
    
    checkIceFissureDamage(playerId, player) {
        for (const fissure of this.iceFissures) {
            if (!fissure.active) continue;
            
            const dx = player.x - fissure.x;
            const dy = player.y - fissure.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= fissure.radius) {
                if (player.takeDamage) {
                    player.takeDamage(this.ICE_FISSURE_DAMAGE, 'environment', 'true');
                }
                
                // Root effect
                if (player.applyStatusEffect) {
                    player.applyStatusEffect({
                        type: 'root',
                        duration: 3000,
                        description: 'You are trapped in ice!'
                    });
                }
                
                this.emit('iceFissureDamage', { playerId, fissureId: fissure.id });
                break;
            }
        }
    }
    
    checkLavaDamage(playerId, player) {
        // Check lava rivers
        for (const lava of this.lavaRivers) {
            if (!lava.active) continue;
            
            let inLava = false;
            
            if (lava.points) {
                // River - check if point is near line segments
                inLava = this.isPointNearLineRiver(player.x, player.y, lava);
            } else {
                // Pool
                const dx = player.x - lava.x;
                const dy = player.y - lava.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                inLava = distance <= lava.radius;
            }
            
            if (inLava) {
                // Check fire immunity
                const isImmune = player.resistances?.fire >= 1.0 ||
                                player.activeEffects?.some(e => e.type === 'fire_immunity');
                
                if (!isImmune && player.takeDamage) {
                    // Fatal damage
                    player.takeDamage(this.LAVA_DAMAGE, 'environment', 'true');
                    this.emit('lavaDamage', { playerId, fatal: true });
                }
                break;
            }
        }
    }
    
    isPointNearLineRiver(x, y, river) {
        const points = river.points;
        const width = river.width / 2;
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            const distance = this.pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
            if (distance <= width) return true;
        }
        return false;
    }
    
    pointToLineDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    checkToxicFumes(playerId, player) {
        // Toxic fumes in Volcanic Core
        const subZone = this.zone.getSubZoneAt(player.x, player.y);
        if (subZone?.id !== 'volcanic_core') return;
        
        // Check if player has mask
        const hasMask = player.inventory?.hasItem('thin_air_mask') ||
                       player.equipment?.helmet?.type === 'gas_mask';
        
        if (!hasMask && player.takeDamage) {
            player.takeDamage(8, 'environment', 'true'); // Poison damage
            
            if (player.applyStatusEffect) {
                player.applyStatusEffect({
                    type: 'poison',
                    duration: 5000,
                    damagePerSecond: 5
                });
            }
        }
    }
    
    applyWindEffects(playerId, player) {
        const subZone = this.zone.getSubZoneAt(player.x, player.y);
        if (subZone?.id !== 'wyvern_heights') return;
        
        // Strong winds push players
        if (this.windStrength > 0.7 && player.x && player.y) {
            const pushDistance = this.windStrength * 2;
            player.x += this.windDirection.x * pushDistance;
            player.y += this.windDirection.y * pushDistance;
            
            // Check if player fell off edge
            if (!this.zone.isValidPosition(player.x, player.y)) {
                // Fall damage
                if (player.takeDamage) {
                    player.takeDamage(9999, 'environment', 'true'); // Fatal fall
                }
            }
            
            this.emit('windPush', { playerId, direction: this.windDirection });
        }
    }
    
    // Avalanche event
    triggerAvalanche(startX, startY, direction) {
        console.log(`[DraconiaEnvironment] Avalanche triggered at (${startX}, ${startY})`);
        
        this.emit('avalanche', {
            x: startX,
            y: startY,
            direction: direction,
            width: 200,
            speed: 300, // pixels per second
            damage: 500
        });
        
        // Log to database
        this.logWeatherEvent('avalanche');
    }
    
    // Database logging
    async logWeatherEvent(eventType) {
        try {
            await this.db.run(`
                INSERT INTO draconia_weather_events (event_type, sub_zone, intensity)
                VALUES (?, ?, ?)
            `, [eventType, this.getActiveSubZone(), this.weatherIntensity]);
        } catch (error) {
            console.error('[DraconiaEnvironment] Error logging weather event:', error);
        }
    }
    
    getActiveSubZone() {
        // Return most populated sub-zone or current event location
        const subZoneCounts = {};
        for (const player of this.zone.players.values()) {
            const sz = this.zone.getSubZoneAt(player.x, player.y);
            if (sz) {
                subZoneCounts[sz.id] = (subZoneCounts[sz.id] || 0) + 1;
            }
        }
        
        let maxCount = 0;
        let activeZone = null;
        for (const [zoneId, count] of Object.entries(subZoneCounts)) {
            if (count > maxCount) {
                maxCount = count;
                activeZone = zoneId;
            }
        }
        return activeZone;
    }
    
    // Player data management
    getPlayerAltitudeSickness(playerId) {
        const data = this.playerAltitudeData.get(playerId);
        return data?.sicknessLevel || 0;
    }
    
    // Data export
    getClientData() {
        return {
            weather: {
                type: this.currentWeather,
                intensity: this.weatherIntensity,
                timeRemaining: Math.max(0, this.weatherDuration - (Date.now() - this.weatherStartTime))
            },
            wind: {
                direction: this.windDirection,
                strength: this.windStrength
            },
            hazards: {
                thermalVents: this.thermalVents.filter(v => v.active).length,
                iceFissures: this.iceFissures.filter(f => f.active).length,
                lavaActive: this.lavaRivers.some(l => l.active)
            },
            altitudeSickness: this.zone.players.size > 0 ? 
                Array.from(this.playerAltitudeData.entries()).map(([id, data]) => ({
                    playerId: id,
                    level: data.sicknessLevel
                })) : []
        };
    }
    
    getFullData() {
        return {
            ...this.getClientData(),
            thermalVents: this.thermalVents,
            iceFissures: this.iceFissures,
            lavaRivers: this.lavaRivers,
            playerAltitudeData: Array.from(this.playerAltitudeData.entries())
        };
    }
    
    // Cleanup
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.playerAltitudeData.clear();
        this.removeAllListeners();
        console.log('[DraconiaEnvironment] Environmental system cleaned up');
    }
}

module.exports = DraconiaEnvironment;
