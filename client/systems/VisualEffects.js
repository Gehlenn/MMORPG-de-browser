/**
 * VisualEffects.js
 * Sistema Avançado de Efeitos Visuais e Animações
 * Legacy of Komodo MMORPG v0.5.0
 */

class VisualEffects {
    constructor() {
        this.particles = [];
        this.animations = new Map();
        this.canvas = null;
        this.ctx = null;
        this.initialized = false;
        
        // Configurações de efeitos
        this.effects = {
            attack: { color: '#ff4444', size: 3, count: 8 },
            magic: { color: '#4444ff', size: 4, count: 12 },
            heal: { color: '#44ff44', size: 3, count: 10 },
            buff: { color: '#ffff44', size: 5, count: 15 },
            debuff: { color: '#ff44ff', size: 4, count: 8 },
            critical: { color: '#ff8800', size: 6, count: 20 },
            levelup: { color: '#ffd700', size: 8, count: 30 }
        };
        
        console.log('✨ VisualEffects initialized');
    }

    initialize(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.initialized = true;
        console.log('✨ VisualEffects ready');
    }

    /**
     * Efeito de ataque com trail
     */
    createAttackTrail(x, y, direction, type = 'normal') {
        const config = this.effects[type] || this.effects.attack;
        const particles = [];
        
        for (let i = 0; i < config.count; i++) {
            particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(direction) * (2 + Math.random() * 3),
                vy: Math.sin(direction) * (2 + Math.random() * 3),
                life: 1.0,
                maxLife: 1.0,
                size: config.size + Math.random() * 2,
                color: config.color,
                type: 'attack'
            });
        }
        
        this.particles.push(...particles);
    }

    /**
     * Efeito de magia com partículas orbitais
     */
    createMagicEffect(x, y, element = 'fire') {
        const elements = {
            fire: { color: '#ff6600', secondary: '#ffaa00' },
            ice: { color: '#00ffff', secondary: '#aaddff' },
            lightning: { color: '#ffff00', secondary: '#ffffff' },
            dark: { color: '#6600ff', secondary: '#aa00ff' },
            holy: { color: '#ffffaa', secondary: '#ffffff' }
        };
        
        const config = elements[element] || elements.fire;
        
        // Partículas centrais
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            this.particles.push({
                x: x + Math.cos(angle) * 30,
                y: y + Math.sin(angle) * 30,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                life: 1.0,
                maxLife: 1.0,
                size: 4 + Math.random() * 3,
                color: i % 2 === 0 ? config.color : config.secondary,
                type: 'magic',
                orbit: true,
                centerX: x,
                centerY: y,
                angle: angle,
                radius: 30
            });
        }
    }

    /**
     * Efeito de cura com ícone flutuante
     */
    createHealEffect(x, y, amount) {
        // Partículas de cura
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 1,
                vy: -1 - Math.random() * 2,
                life: 1.0,
                maxLife: 1.0,
                size: 3 + Math.random() * 2,
                color: '#44ff44',
                type: 'heal',
                shape: 'cross'
            });
        }
        
        // Texto flutuante
        this.createFloatingText(x, y - 20, `+${amount}`, '#44ff44', 20);
    }

    /**
     * Efeito de level up épico
     */
    createLevelUpEffect(x, y) {
        const config = this.effects.levelup;
        
        // Anel expansivo
        for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 / 20) * i;
                    this.particles.push({
                        x: x,
                        y: y,
                        vx: Math.cos(angle) * (3 + ring),
                        vy: Math.sin(angle) * (3 + ring),
                        life: 1.0,
                        maxLife: 1.0,
                        size: config.size,
                        color: config.color,
                        type: 'levelup',
                        fade: true
                    });
                }
            }, ring * 200);
        }
        
        // Texto
        this.createFloatingText(x, y - 40, 'LEVEL UP!', '#ffd700', 24);
    }

    /**
     * Efeito de buff/debuff
     */
    createBuffEffect(x, y, isBuff = true) {
        const config = isBuff ? this.effects.buff : this.effects.debuff;
        const icon = isBuff ? '▲' : '▼';
        
        // Partículas em espiral
        for (let i = 0; i < config.count; i++) {
            const angle = (Math.PI * 2 / config.count) * i;
            this.particles.push({
                x: x + Math.cos(angle) * 25,
                y: y + Math.sin(angle) * 25,
                vx: Math.cos(angle) * 0.5,
                vy: Math.sin(angle) * 0.5 - 1,
                life: 1.0,
                maxLife: 1.0,
                size: config.size,
                color: config.color,
                type: isBuff ? 'buff' : 'debuff',
                spiral: true,
                spiralSpeed: 0.1,
                angle: angle
            });
        }
        
        this.createFloatingText(x, y - 30, icon, config.color, 18);
    }

    /**
     * Efeito de dano crítico
     */
    createCriticalEffect(x, y, damage) {
        const config = this.effects.critical;
        
        // Explosão de partículas
        for (let i = 0; i < config.count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 1.0,
                size: config.size + Math.random() * 3,
                color: config.color,
                type: 'critical',
                trail: true
            });
        }
        
        // Shake effect
        this.createScreenShake(5, 300);
        
        // Texto grande
        this.createFloatingText(x, y - 35, `CRIT ${damage}!`, '#ff8800', 26, true);
    }

    /**
     * Texto flutuante animado
     */
    createFloatingText(x, y, text, color, size = 16, bold = false) {
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: -1.5,
            life: 1.0,
            maxLife: 1.0,
            size: size,
            color: color,
            type: 'text',
            text: text,
            bold: bold,
            fade: true
        });
    }

    /**
     * Screen shake effect
     */
    createScreenShake(intensity, duration) {
        if (!this.initialized) return;
        
        const startTime = Date.now();
        const originalTransform = this.ctx.getTransform();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const dx = (Math.random() - 0.5) * intensity * (1 - elapsed / duration);
                const dy = (Math.random() - 0.5) * intensity * (1 - elapsed / duration);
                this.ctx.translate(dx, dy);
                requestAnimationFrame(shake);
            } else {
                this.ctx.setTransform(originalTransform);
            }
        };
        
        shake();
    }

    /**
     * Animação de aura para personagem
     */
    createAuraEffect(x, y, color, radius = 30) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + Date.now() * 0.001;
            this.particles.push({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: 0,
                vy: 0,
                life: 0.8,
                maxLife: 0.8,
                size: 4,
                color: color,
                type: 'aura',
                pulse: true
            });
        }
    }

    /**
     * Update e render de partículas
     */
    updateAndRender() {
        if (!this.initialized || this.particles.length === 0) return;
        
        this.ctx.save();
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update
            p.life -= 0.016; // ~60fps
            
            if (p.orbit) {
                p.angle += 0.05;
                p.x = p.centerX + Math.cos(p.angle) * p.radius;
                p.y = p.centerY + Math.sin(p.angle) * p.radius;
            } else if (p.spiral) {
                p.angle += p.spiralSpeed;
                p.x += Math.cos(p.angle) * 2;
                p.y += Math.sin(p.angle) * 2;
            } else {
                p.x += p.vx;
                p.y += p.vy;
            }
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Render
            const alpha = p.fade ? p.life : 1;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;
            
            if (p.type === 'text') {
                this.ctx.font = `${p.bold ? 'bold ' : ''}${p.size}px Arial`;
                this.ctx.fillStyle = p.color;
                this.ctx.fillText(p.text, p.x, p.y);
            } else if (p.shape === 'cross') {
                this.drawCross(p.x, p.y, p.size, p.color);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Trail effect
            if (p.trail && p.life > 0.5) {
                this.ctx.beginPath();
                this.ctx.arc(p.x - p.vx, p.y - p.vy, p.size * 0.5, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color + '44';
                this.ctx.fill();
            }
        }
        
        this.ctx.restore();
    }

    drawCross(x, y, size, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = size / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y);
        this.ctx.lineTo(x + size, y);
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x, y + size);
        this.ctx.stroke();
    }

    /**
     * Limpa todas as partículas
     */
    clear() {
        this.particles = [];
    }

    /**
     * Estatísticas
     */
    getStats() {
        return {
            activeParticles: this.particles.length,
            effectsSupported: Object.keys(this.effects).length
        };
    }
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualEffects;
} else {
    window.VisualEffects = VisualEffects;
}
