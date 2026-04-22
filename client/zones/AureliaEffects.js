/**
 * AureliaEffects.js
 * 
 * Client-side environmental effects for Aurélia desert zone
 * Sandstorms, heat haze, day/night cycle visuals, quicksand effects
 */

class AureliaEffects {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Environmental state
        this.environment = {
            isDaytime: true,
            hour: 12,
            sandstormActive: false,
            sandstormIntensity: 0,
            heatHazeActive: false,
            heatHazeIntensity: 0,
            quicksandNearby: false,
            inOasis: false
        };
        
        // Effect systems
        this.particleSystem = new ParticleSystem(ctx);
        this.postProcess = new PostProcess(ctx);
        
        // Sandstorm particles
        this.sandParticles = [];
        this.maxSandParticles = 500;
        this.sandWindDirection = { x: 1, y: 0.3 };
        this.sandWindSpeed = 5;
        
        // Heat haze
        this.heatWaves = [];
        this.heatWaveCount = 20;
        
        // Day/night colors
        this.skyColors = {
            dawn: { top: '#1a1a2e', bottom: '#e94560', ambient: 0.4 },
            day: { top: '#87CEEB', bottom: '#E0F6FF', ambient: 1.0 },
            dusk: { top: '#2d1b69', bottom: '#ff6b35', ambient: 0.5 },
            night: { top: '#0a0a0a', bottom: '#1a1a2e', ambient: 0.2 }
        };
        
        // Screen effects
        this.screenShake = 0;
        this.vignetteIntensity = 0;
        this.colorTemperature = 0; // -1 (cold) to 1 (hot)
        
        // Animation frame
        this.animationId = null;
        this.lastFrame = 0;
        
        this.initialize();
    }
    
    initialize() {
        console.log('[AureliaEffects] Initializing desert effects...');
        this.startAnimationLoop();
    }
    
    /**
     * Start animation loop
     */
    startAnimationLoop() {
        const animate = (timestamp) => {
            const deltaTime = timestamp - this.lastFrame;
            this.lastFrame = timestamp;
            
            this.update(deltaTime);
            this.render();
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    /**
     * Update effects
     */
    update(deltaTime) {
        // Update sandstorm
        if (this.environment.sandstormActive) {
            this.updateSandstorm(deltaTime);
        }
        
        // Update heat haze
        if (this.environment.heatHazeActive && this.environment.isDaytime) {
            this.updateHeatHaze(deltaTime);
        }
        
        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }
        
        // Update vignette
        this.updateVignette();
        
        // Update color temperature based on time and heat
        this.updateColorTemperature();
    }
    
    /**
     * Update sandstorm particles
     */
    updateSandstorm(deltaTime) {
        const targetIntensity = this.environment.sandstormIntensity;
        
        // Add new particles
        const spawnRate = Math.floor(targetIntensity * 10);
        for (let i = 0; i < spawnRate; i++) {
            if (this.sandParticles.length < this.maxSandParticles) {
                this.sandParticles.push(this.createSandParticle());
            }
        }
        
        // Update existing particles
        for (let i = this.sandParticles.length - 1; i >= 0; i--) {
            const particle = this.sandParticles[i];
            
            // Move with wind
            particle.x += this.sandWindDirection.x * this.sandWindSpeed * particle.speed;
            particle.y += this.sandWindDirection.y * this.sandWindSpeed * particle.speed;
            
            // Add turbulence
            particle.x += Math.sin(Date.now() * 0.001 + particle.offset) * 2;
            particle.y += Math.cos(Date.now() * 0.002 + particle.offset) * 1;
            
            // Age
            particle.life -= deltaTime / 1000;
            
            // Remove dead particles
            if (particle.life <= 0 || 
                particle.x > this.width + 50 || 
                particle.y > this.height + 50) {
                this.sandParticles.splice(i, 1);
            }
        }
        
        // Screen shake based on intensity
        if (targetIntensity > 0.7) {
            this.screenShake = targetIntensity * 3;
        }
    }
    
    /**
     * Create a sand particle
     */
    createSandParticle() {
        return {
            x: Math.random() * this.width - 50,
            y: Math.random() * this.height - 50,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 2 + 0.5,
            life: Math.random() * 2 + 1,
            opacity: Math.random() * 0.6 + 0.2,
            offset: Math.random() * Math.PI * 2,
            color: this.getSandColor()
        };
    }
    
    /**
     * Get sand color based on time
     */
    getSandColor() {
        if (this.environment.isDaytime) {
            return `rgba(194, 178, 128, ${Math.random() * 0.6 + 0.2})`;
        } else {
            return `rgba(139, 125, 107, ${Math.random() * 0.4 + 0.1})`;
        }
    }
    
    /**
     * Update heat haze effect
     */
    updateHeatHaze(deltaTime) {
        // Update heat waves
        for (let i = 0; i < this.heatWaveCount; i++) {
            if (!this.heatWaves[i]) {
                this.heatWaves[i] = this.createHeatWave();
            }
            
            const wave = this.heatWaves[i];
            wave.time += deltaTime / 1000;
            wave.x += wave.speedX;
            wave.y += wave.speedY;
            
            // Reset if out of bounds
            if (wave.x > this.width || wave.y < -50) {
                this.heatWaves[i] = this.createHeatWave();
            }
        }
    }
    
    /**
     * Create heat wave
     */
    createHeatWave() {
        return {
            x: Math.random() * this.width,
            y: this.height + Math.random() * 50,
            width: Math.random() * 100 + 50,
            height: Math.random() * 30 + 10,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: -(Math.random() * 2 + 1),
            opacity: Math.random() * 0.3,
            time: 0
        };
    }
    
    /**
     * Update vignette effect
     */
    updateVignette() {
        let targetVignette = 0;
        
        // Heat exhaustion vignette
        if (this.environment.heatHazeActive && this.environment.isDaytime) {
            targetVignette += 0.3;
        }
        
        // Sandstorm vignette
        if (this.environment.sandstormActive) {
            targetVignette += this.environment.sandstormIntensity * 0.4;
        }
        
        // Night vignette
        if (!this.environment.isDaytime) {
            targetVignette += 0.2;
        }
        
        this.vignetteIntensity = targetVignette;
    }
    
    /**
     * Update color temperature
     */
    updateColorTemperature() {
        let temp = 0;
        
        // Hot during day in desert
        if (this.environment.isDaytime) {
            temp += 0.7;
            if (this.environment.heatHazeActive) {
                temp += 0.3;
            }
        } else {
            // Cold at night
            temp -= 0.5;
        }
        
        // Oasis is neutral
        if (this.environment.inOasis) {
            temp = 0;
        }
        
        this.colorTemperature = temp;
    }
    
    /**
     * Render all effects
     */
    render() {
        // Save context
        this.ctx.save();
        
        // Apply screen shake
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Render sky gradient
        this.renderSky();
        
        // Render heat haze
        if (this.environment.heatHazeActive && this.environment.isDaytime) {
            this.renderHeatHaze();
        }
        
        // Render sandstorm
        if (this.environment.sandstormActive) {
            this.renderSandstorm();
        }
        
        // Render vignette
        if (this.vignetteIntensity > 0) {
            this.renderVignette();
        }
        
        // Apply color grading
        this.renderColorGrading();
        
        // Restore context
        this.ctx.restore();
    }
    
    /**
     * Render sky based on time
     */
    renderSky() {
        const hour = this.environment.hour;
        let colors = this.skyColors.day;
        
        if (hour >= 5 && hour < 7) {
            colors = this.skyColors.dawn;
        } else if (hour >= 7 && hour < 17) {
            colors = this.skyColors.day;
        } else if (hour >= 17 && hour < 19) {
            colors = this.skyColors.dusk;
        } else {
            colors = this.skyColors.night;
        }
        
        // Create gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, colors.top);
        gradient.addColorStop(1, colors.bottom);
        
        // Fill background
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Render sandstorm particles
     */
    renderSandstorm() {
        const intensity = this.environment.sandstormIntensity;
        
        // Sand overlay
        const sandOverlay = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, Math.max(this.width, this.height)
        );
        sandOverlay.addColorStop(0, `rgba(194, 178, 128, ${intensity * 0.3})`);
        sandOverlay.addColorStop(1, `rgba(139, 125, 107, ${intensity * 0.6})`);
        
        this.ctx.fillStyle = sandOverlay;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Render particles
        for (const particle of this.sandParticles) {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        
        // Wind streaks for high intensity
        if (intensity > 0.6) {
            this.renderWindStreaks(intensity);
        }
    }
    
    /**
     * Render wind streaks
     */
    renderWindStreaks(intensity) {
        const streakCount = Math.floor(intensity * 20);
        
        this.ctx.strokeStyle = `rgba(194, 178, 128, ${intensity * 0.4})`;
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < streakCount; i++) {
            const y = Math.random() * this.height;
            const length = Math.random() * 100 + 50;
            const x = (Date.now() * 0.1 + i * 100) % (this.width + length) - length;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + length, y + Math.sin(x * 0.01) * 10);
            this.ctx.stroke();
        }
    }
    
    /**
     * Render heat haze
     */
    renderHeatHaze() {
        this.ctx.save();
        
        for (const wave of this.heatWaves) {
            const distortion = Math.sin(wave.time * 3 + wave.x * 0.01) * 10;
            
            this.ctx.beginPath();
            this.ctx.ellipse(
                wave.x + distortion,
                wave.y,
                wave.width,
                wave.height,
                0,
                0,
                Math.PI * 2
            );
            
            const gradient = this.ctx.createRadialGradient(
                wave.x, wave.y, 0,
                wave.x, wave.y, wave.width
            );
            gradient.addColorStop(0, `rgba(255, 200, 100, ${wave.opacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Render vignette effect
     */
    renderVignette() {
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.width * 0.3,
            this.width / 2, this.height / 2, this.width * 0.8
        );
        
        // Color based on condition
        let vignetteColor = '0, 0, 0';
        if (this.environment.heatHazeActive && this.environment.isDaytime) {
            vignetteColor = '139, 69, 19'; // Brown for heat
        } else if (this.environment.sandstormActive) {
            vignetteColor = '194, 178, 128'; // Sand color
        }
        
        gradient.addColorStop(0, `rgba(${vignetteColor}, 0)`);
        gradient.addColorStop(1, `rgba(${vignetteColor}, ${this.vignetteIntensity})`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    /**
     * Render color grading
     */
    renderColorGrading() {
        const temp = this.colorTemperature;
        
        if (temp === 0) return;
        
        let color;
        let alpha;
        
        if (temp > 0) {
            // Warm/hot (orange/red tint)
            color = '255, 100, 0';
            alpha = temp * 0.15;
        } else {
            // Cold (blue tint)
            color = '0, 100, 255';
            alpha = Math.abs(temp) * 0.15;
        }
        
        this.ctx.fillStyle = `rgba(${color}, ${alpha})`;
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    /**
     * Update environmental state from server
     */
    updateEnvironment(data) {
        this.environment = {
            ...this.environment,
            ...data
        };
    }
    
    /**
     * Set sandstorm state
     */
    setSandstorm(active, intensity = 0.5) {
        this.environment.sandstormActive = active;
        this.environment.sandstormIntensity = intensity;
        
        if (active) {
            // Pre-warm particles
            for (let i = 0; i < 100; i++) {
                this.sandParticles.push(this.createSandParticle());
            }
        } else {
            // Fade out
            this.sandParticles = [];
        }
    }
    
    /**
     * Set time of day
     */
    setTimeOfDay(hour) {
        this.environment.hour = hour;
        this.environment.isDaytime = hour >= 6 && hour < 18;
        this.environment.heatHazeActive = this.environment.isDaytime && hour >= 10 && hour <= 15;
        
        if (this.environment.heatHazeActive) {
            // Peak heat at noon
            const distanceFromNoon = Math.abs(hour - 12);
            this.environment.heatHazeIntensity = 1 - (distanceFromNoon / 3);
        } else {
            this.environment.heatHazeIntensity = 0;
        }
    }
    
    /**
     * Trigger quicksand warning
     */
    triggerQuicksandWarning() {
        this.environment.quicksandNearby = true;
        this.screenShake = 2;
        
        // Flash warning
        this.flashWarning('#8B4513', 1000);
        
        setTimeout(() => {
            this.environment.quicksandNearby = false;
        }, 5000);
    }
    
    /**
     * Flash warning color
     */
    flashWarning(color, duration) {
        const startTime = Date.now();
        
        const flash = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                this.ctx.fillStyle = color;
                this.ctx.globalAlpha = (1 - progress) * 0.3;
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.ctx.globalAlpha = 1;
                requestAnimationFrame(flash);
            }
        };
        
        flash();
    }
    
    /**
     * Enter oasis effect
     */
    enterOasis() {
        this.environment.inOasis = true;
        this.flashWarning('#00CED1', 1500); // Turquoise flash
        
        // Reduce heat effects
        this.environment.heatHazeIntensity *= 0.3;
    }
    
    /**
     * Leave oasis effect
     */
    leaveOasis() {
        this.environment.inOasis = false;
        this.flashWarning('#FFD700', 1000); // Gold flash
        
        // Restore heat effects
        this.updateHeatHaze(0);
    }
    
    /**
     * Resize canvas
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * Get current environment state
     */
    getEnvironmentState() {
        return {
            ...this.environment,
            particleCount: this.sandParticles.length,
            screenShake: this.screenShake,
            vignette: this.vignetteIntensity,
            temperature: this.colorTemperature
        };
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.sandParticles = [];
        this.heatWaves = [];
    }
}

/**
 * Particle System helper
 */
class ParticleSystem {
    constructor(ctx) {
        this.ctx = ctx;
    }
}

/**
 * Post-processing helper
 */
class PostProcess {
    constructor(ctx) {
        this.ctx = ctx;
    }
}

module.exports = AureliaEffects;
