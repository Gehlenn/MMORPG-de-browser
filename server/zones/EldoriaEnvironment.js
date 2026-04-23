/**
 * EldoriaEnvironment.js
 * Environmental system for Eldoria - The Central Kingdom
 * Features: weather, forest ambiance, mine hazards, castle atmosphere
 */

const EventEmitter = require('events');

class EldoriaEnvironment extends EventEmitter {
    constructor(database, zone) {
        super();
        this.db = database;
        this.zone = zone;
        this.initialized = false;
        
        // Weather system
        this.weather = {
            current: 'clear', // clear, rain, fog, storm
            intensity: 0,
            duration: 0,
            nextChange: Date.now() + 300000 // 5 minutes
        };
        
        // Environmental features
        this.features = {
            streams: [],
            campfires: [],
            torches: [],
            fogAreas: []
        };
        
        // Ambient effects for zones
        this.ambientEffects = {
            royalForest: { birds: true, wind: 0.3 },
            ironMines: { darkness: 0.7, dripping: true },
            castleGrounds: { flags: true, wind: 0.5 }
        };
        
        this.updateInterval = null;
    }
    
    async initialize() {
        await this.loadFeatures();
        this.startWeatherCycle();
        this.initialized = true;
        console.log('[EldoriaEnvironment] Initialized');
    }
    
    async loadFeatures() {
        // Streams in Royal Forest
        this.features.streams = [
            { x: 200, y: 300, width: 400, height: 50, direction: 'east' },
            { x: 500, y: 600, width: 50, height: 200, direction: 'south' }
        ];
        
        // Campfires (safe rest spots)
        this.features.campfires = [
            { x: 350, y: 450, lit: true },
            { x: 600, y: 250, lit: true },
            { x: 1500, y: 600, lit: false } // Castle grounds
        ];
        
        // Mine fog areas
        this.features.fogAreas = [
            { x: 1200, y: 400, radius: 200, density: 0.6 } // Iron Mines entrance
        ];
    }
    
    startWeatherCycle() {
        this.updateInterval = setInterval(() => this.update(), 60000); // Every minute
    }
    
    update() {
        this.updateWeather();
        this.emit('environmentUpdate', this.getClientData());
    }
    
    updateWeather() {
        const now = Date.now();
        
        if (now >= this.weather.nextChange) {
            const weathers = ['clear', 'rain', 'fog', 'clear'];
            const currentIndex = weathers.indexOf(this.weather.current);
            const nextIndex = (currentIndex + 1) % weathers.length;
            
            const oldWeather = this.weather.current;
            this.weather.current = weathers[nextIndex];
            this.weather.intensity = Math.random() * 0.5 + 0.3;
            this.weather.duration = 300000 + Math.random() * 300000; // 5-10 minutes
            this.weather.nextChange = now + this.weather.duration;
            
            this.emit('weatherChange', {
                type: this.weather.current,
                intensity: this.weather.intensity,
                duration: this.weather.duration,
                previous: oldWeather
            });
        }
    }
    
    getWeatherData() {
        return {
            type: this.weather.current,
            intensity: this.weather.intensity,
            timeRemaining: Math.max(0, this.weather.nextChange - Date.now())
        };
    }
    
    getAmbientForPosition(x, y) {
        const zone = this.zone.getSubZoneAt(x, y);
        if (!zone) return { birds: false, wind: 0, darkness: 0 };
        
        return this.ambientEffects[zone.id] || { birds: false, wind: 0, darkness: 0 };
    }
    
    isNearStream(x, y, radius = 30) {
        return this.features.streams.some(stream => 
            x >= stream.x - radius && 
            x <= stream.x + stream.width + radius &&
            y >= stream.y - radius && 
            y <= stream.y + stream.height + radius
        );
    }
    
    isInFogArea(x, y) {
        return this.features.fogAreas.some(fog => {
            const dx = x - fog.x;
            const dy = y - fog.y;
            return Math.sqrt(dx * dx + dy * dy) <= fog.radius;
        });
    }
    
    getFogDensity(x, y) {
        const fog = this.features.fogAreas.find(fog => {
            const dx = x - fog.x;
            const dy = y - fog.y;
            return Math.sqrt(dx * dx + dy * dy) <= fog.radius;
        });
        return fog ? fog.density : 0;
    }
    
    lightCampfire(index) {
        if (this.features.campfires[index]) {
            this.features.campfires[index].lit = true;
            this.emit('campfireLit', { index, x: this.features.campfires[index].x, y: this.features.campfires[index].y });
        }
    }
    
    extinguishCampfire(index) {
        if (this.features.campfires[index]) {
            this.features.campfires[index].lit = false;
            this.emit('campfireExtinguished', { index });
        }
    }
    
    getClientData() {
        return {
            weather: this.getWeatherData(),
            campfires: this.features.campfires.filter(c => c.lit).map(c => ({ x: c.x, y: c.y })),
            fogAreas: this.features.fogAreas,
            streams: this.features.streams
        };
    }
    
    getFullData() {
        return {
            weather: this.weather,
            features: this.features,
            ambientEffects: this.ambientEffects
        };
    }
    
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.removeAllListeners();
    }
}

module.exports = EldoriaEnvironment;
