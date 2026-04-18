/**
 * Free Tier VFX System - Efeitos Visuais Otimizados
 * Sistema de efeitos visuais performático para zero budget
 * Version 1.0.0 - Free Tier Ready
 */

class FreeTierVFX {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.effects = [];
        this.animations = [];
        
        // Configurações otimizadas para free tier
        this.config = {
            maxParticles: 100,
            maxEffects: 20,
            particlePoolSize: 50,
            animationFPS: 30,
            quality: 'medium', // low, medium, high
            enableGlow: true,
            enableShadows: false,
            enableBlur: false
        };
        
        // Pool de partículas para performance
        this.particlePool = [];
        this.animationFrame = 0;
        
        this.initialize();
    }
    
    initialize() {
        console.log('✨ Inicializando Free Tier VFX v1.0.0');
        
        // Criar pool de partículas
        this.createParticlePool();
        
        // Configurar canvas
        this.setupCanvas();
        
        // Iniciar loop de animação
        this.startAnimationLoop();
        
        console.log('✅ Free Tier VFX inicializado');
    }
    
    createParticlePool() {
        for (let i = 0; i < this.config.particlePoolSize; i++) {
            this.particlePool.push({
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                size: 1,
                color: '#ffffff',
                alpha: 1,
                life: 0,
                maxLife: 100,
                active: false,
                type: 'basic'
            });
        }
    }
    
    setupCanvas() {
        // Configurar contexto para performance
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.globalCompositeOperation = 'lighter';
    }
    
    startAnimationLoop() {
        const animate = () => {
            this.animationFrame++;
            this.update();
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    // Sistema de partículas otimizado
    createParticle(x, y, options = {}) {
        if (this.particles.length >= this.config.maxParticles) {
            // Reciclar partícula mais antiga
            const oldParticle = this.particles.shift();
            this.returnParticleToPool(oldParticle);
        }
        
        // Obter partícula do pool
        const particle = this.getParticleFromPool();
        
        // Configurar partícula
        particle.x = x;
        particle.y = y;
        particle.vx = options.vx || (Math.random() - 0.5) * 4;
        particle.vy = options.vy || (Math.random() - 0.5) * 4;
        particle.size = options.size || Math.random() * 3 + 1;
        particle.color = options.color || '#ffffff';
        particle.alpha = options.alpha || 1;
        particle.life = 0;
        particle.maxLife = options.maxLife || 60;
        particle.active = true;
        particle.type = options.type || 'basic';
        particle.gravity = options.gravity || 0.1;
        particle.fadeRate = options.fadeRate || 0.02;
        
        this.particles.push(particle);
        return particle;
    }
    
    getParticleFromPool() {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        
        // Criar nova partícula se pool estiver vazio
        return {
            x: 0, y: 0, vx: 0, vy: 0, size: 1, color: '#ffffff',
            alpha: 1, life: 0, maxLife: 100, active: false, type: 'basic'
        };
    }
    
    returnParticleToPool(particle) {
        particle.active = false;
        this.particlePool.push(particle);
    }
    
    update() {
        // Atualizar partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (!particle.active) continue;
            
            // Atualizar posição
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Aplicar gravidade
            particle.vy += particle.gravity;
            
            // Atualizar vida
            particle.life++;
            
            // Atualizar alpha (fade out)
            if (particle.life > particle.maxLife * 0.7) {
                particle.alpha -= particle.fadeRate;
            }
            
            // Remover partícula morta
            if (particle.life >= particle.maxLife || particle.alpha <= 0) {
                this.particles.splice(i, 1);
                this.returnParticleToPool(particle);
            }
        }
        
        // Atualizar animações
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const animation = this.animations[i];
            
            animation.currentTime += 16; // ~60fps
            
            if (animation.currentTime >= animation.duration) {
                this.animations.splice(i, 1);
            }
        }
    }
    
    render() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderizar partículas
        for (const particle of this.particles) {
            if (!particle.active) continue;
            
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            
            if (this.config.enableGlow && particle.type === 'magic') {
                // Efeito de glow para partículas mágicas
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = particle.color;
            }
            
            // Desenhar partícula baseada no tipo
            switch (particle.type) {
                case 'basic':
                    this.ctx.fillRect(
                        particle.x - particle.size / 2,
                        particle.y - particle.size / 2,
                        particle.size,
                        particle.size
                    );
                    break;
                    
                case 'circle':
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'star':
                    this.drawStar(particle.x, particle.y, particle.size);
                    break;
                    
                case 'magic':
                    this.drawMagicParticle(particle.x, particle.y, particle.size);
                    break;
                    
                case 'fire':
                    this.drawFireParticle(particle.x, particle.y, particle.size);
                    break;
                    
                case 'ice':
                    this.drawIceParticle(particle.x, particle.y, particle.size);
                    break;
            }
            
            this.ctx.restore();
        }
        
        // Renderizar animações
        for (const animation of this.animations) {
            this.renderAnimation(animation);
        }
    }
    
    drawStar(x, y, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;
        
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawMagicParticle(x, y, size) {
        // Partícula mágica com brilho
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(150, 150, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(100, 100, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawFireParticle(x, y, size) {
        // Partícula de fogo com gradiente
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 200, 0, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 100, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawIceParticle(x, y, size) {
        // Partícula de gelo cristalina
        this.ctx.strokeStyle = '#87CEEB';
        this.ctx.lineWidth = 1;
        
        // Desenhar hexágono
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Preenchimento leve
        this.ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
        this.ctx.fill();
    }
    
    renderAnimation(animation) {
        const progress = animation.currentTime / animation.duration;
        
        switch (animation.type) {
            case 'explosion':
                this.renderExplosion(animation, progress);
                break;
                
            case 'heal':
                this.renderHeal(animation, progress);
                break;
                
            case 'levelup':
                this.renderLevelUp(animation, progress);
                break;
                
            case 'teleport':
                this.renderTeleport(animation, progress);
                break;
        }
    }
    
    renderExplosion(animation, progress) {
        const maxRadius = animation.maxRadius || 50;
        const radius = maxRadius * progress;
        const alpha = 1 - progress;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Círculo expansivo
        const gradient = this.ctx.createRadialGradient(
            animation.x, animation.y, 0,
            animation.x, animation.y, radius
        );
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(animation.x, animation.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    renderHeal(animation, progress) {
        const maxRadius = animation.maxRadius || 30;
        const radius = maxRadius * (1 - progress);
        const alpha = 1 - progress;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Círculo de cura
        const gradient = this.ctx.createRadialGradient(
            animation.x, animation.y, 0,
            animation.x, animation.y, radius
        );
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 200, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 150, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(animation.x, animation.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cruz de cura
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(animation.x - 10, animation.y);
        this.ctx.lineTo(animation.x + 10, animation.y);
        this.ctx.moveTo(animation.x, animation.y - 10);
        this.ctx.lineTo(animation.x, animation.y + 10);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    renderLevelUp(animation, progress) {
        const maxRadius = animation.maxRadius || 40;
        const radius = maxRadius * progress;
        const alpha = 1 - progress;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Anéis concêntricos
        for (let i = 0; i < 3; i++) {
            const ringRadius = radius * (1 - i * 0.3);
            const ringAlpha = alpha * (1 - i * 0.3);
            
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${ringAlpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(animation.x, animation.y, ringRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Estrelas
        if (progress < 0.5) {
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                const distance = radius * 1.5;
                const x = animation.x + Math.cos(angle) * distance;
                const y = animation.y + Math.sin(angle) * distance;
                
                this.drawStar(x, y, 3);
            }
        }
        
        this.ctx.restore();
    }
    
    renderTeleport(animation, progress) {
        const maxRadius = animation.maxRadius || 35;
        const alpha = Math.sin(progress * Math.PI);
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Efeito de portal
        const gradient = this.ctx.createRadialGradient(
            animation.x, animation.y, 0,
            animation.x, animation.y, maxRadius
        );
        gradient.addColorStop(0, 'rgba(150, 100, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(100, 50, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(50, 0, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(animation.x, animation.y, maxRadius * progress, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Partículas de portal
        if (Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const distance = maxRadius * progress;
            const x = animation.x + Math.cos(angle) * distance;
            const y = animation.y + Math.sin(angle) * distance;
            
            this.createParticle(x, y, {
                type: 'magic',
                color: '#9370DB',
                size: 2,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2,
                maxLife: 30
            });
        }
        
        this.ctx.restore();
    }
    
    // Métodos de efeitos específicos
    createExplosion(x, y, options = {}) {
        const particleCount = options.particleCount || 20;
        const colors = options.colors || ['#FFA500', '#FF6347', '#FFD700'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 5 + 2;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                type: 'circle',
                gravity: 0.1,
                fadeRate: 0.03,
                maxLife: 40
            });
        }
        
        // Adicionar animação de explosão
        this.animations.push({
            type: 'explosion',
            x: x,
            y: y,
            maxRadius: options.maxRadius || 50,
            duration: 500,
            currentTime: 0
        });
    }
    
    createHeal(x, y, options = {}) {
        const particleCount = options.particleCount || 15;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 2 + 1;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1, // Para cima
                size: Math.random() * 3 + 1,
                color: '#00FF00',
                type: 'circle',
                gravity: -0.05, // Flutuar para cima
                fadeRate: 0.02,
                maxLife: 60
            });
        }
        
        // Adicionar animação de cura
        this.animations.push({
            type: 'heal',
            x: x,
            y: y,
            maxRadius: options.maxRadius || 30,
            duration: 1000,
            currentTime: 0
        });
    }
    
    createLevelUp(x, y, options = {}) {
        const particleCount = options.particleCount || 25;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 3 + 2;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                color: '#FFD700',
                type: 'star',
                gravity: 0.05,
                fadeRate: 0.02,
                maxLife: 80
            });
        }
        
        // Adicionar animação de level up
        this.animations.push({
            type: 'levelup',
            x: x,
            y: y,
            maxRadius: options.maxRadius || 40,
            duration: 1500,
            currentTime: 0
        });
    }
    
    createTeleport(x, y, options = {}) {
        // Partículas de entrada
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 2 + 1,
                color: '#9370DB',
                type: 'magic',
                gravity: 0,
                fadeRate: 0.03,
                maxLife: 30
            });
        }
        
        // Adicionar animação de portal
        this.animations.push({
            type: 'teleport',
            x: x,
            y: y,
            maxRadius: options.maxRadius || 35,
            duration: 800,
            currentTime: 0
        });
    }
    
    createMagicSpell(x, y, spellType = 'fire') {
        const spellConfig = {
            fire: {
                color: '#FF4500',
                particleType: 'fire',
                particleCount: 15,
                gravity: 0.05,
                fadeRate: 0.04
            },
            ice: {
                color: '#87CEEB',
                particleType: 'ice',
                particleCount: 12,
                gravity: 0,
                fadeRate: 0.03
            },
            lightning: {
                color: '#FFFF00',
                particleType: 'magic',
                particleCount: 20,
                gravity: 0,
                fadeRate: 0.05
            },
            heal: {
                color: '#00FF00',
                particleType: 'circle',
                particleCount: 10,
                gravity: -0.02,
                fadeRate: 0.02
            }
        };
        
        const config = spellConfig[spellType] || spellConfig.fire;
        
        for (let i = 0; i < config.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / config.particleCount;
            const speed = Math.random() * 3 + 1;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                color: config.color,
                type: config.particleType,
                gravity: config.gravity,
                fadeRate: config.fadeRate,
                maxLife: 40
            });
        }
    }
    
    createDamageNumber(x, y, damage, options = {}) {
        const color = damage > 0 ? '#FF0000' : '#00FF00';
        const text = damage > 0 ? `-${damage}` : `+${Math.abs(damage)}`;
        
        // Criar partículas de texto simplificadas
        for (let i = 0; i < 5; i++) {
            this.createParticle(x, y, {
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 1,
                size: 2,
                color: color,
                type: 'circle',
                gravity: 0.1,
                fadeRate: 0.05,
                maxLife: 30
            });
        }
    }
    
    createTrail(x1, y1, x2, y2, options = {}) {
        const steps = options.steps || 10;
        const color = options.color || '#FFFFFF';
        
        for (let i = 0; i < steps; i++) {
            const progress = i / steps;
            const x = x1 + (x2 - x1) * progress;
            const y = y1 + (y2 - y1) * progress;
            
            this.createParticle(x, y, {
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                color: color,
                type: 'circle',
                gravity: 0,
                fadeRate: 0.05,
                maxLife: 20
            });
        }
    }
    
    // Métodos de controle de qualidade
    setQuality(quality) {
        this.config.quality = quality;
        
        switch (quality) {
            case 'low':
                this.config.maxParticles = 50;
                this.config.maxEffects = 10;
                this.config.enableGlow = false;
                this.config.animationFPS = 15;
                break;
                
            case 'medium':
                this.config.maxParticles = 100;
                this.config.maxEffects = 20;
                this.config.enableGlow = true;
                this.config.animationFPS = 30;
                break;
                
            case 'high':
                this.config.maxParticles = 200;
                this.config.maxEffects = 40;
                this.config.enableGlow = true;
                this.config.animationFPS = 60;
                break;
        }
    }
    
    // Métodos de utilidade
    clear() {
        this.particles = [];
        this.animations = [];
    }
    
    getStats() {
        return {
            particles: this.particles.length,
            effects: this.animations.length,
            poolSize: this.particlePool.length,
            quality: this.config.quality,
            maxParticles: this.config.maxParticles
        };
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.setupCanvas();
    }
}

// Exportar para uso global
window.FreeTierVFX = FreeTierVFX;
