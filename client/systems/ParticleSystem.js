/**
 * ParticleSystem.js
 * Sistema de partículas do cliente MMORPG
 * Responsabilidade: Gerenciar criação, atualização e renderização de partículas
 */

class ParticleSystem {
    constructor(gameplayEngine) {
        this.engine = gameplayEngine;
        this.particles = [];
        this.maxParticles = 200;
        
        console.log('✨ ParticleSystem inicializado');
    }

    /**
     * Criar uma partícula simples
     */
    createParticle(x, y, color, size, life, velocity = null) {
        if (this.particles.length >= this.maxParticles) {
            // Remover partícula mais antiga se atingir limite
            this.particles.shift();
        }
        
        const particle = {
            x: x,
            y: y,
            vx: velocity ? velocity.x : (Math.random() - 0.5) * 100,
            vy: velocity ? velocity.y : (Math.random() - 0.5) * 100 - 50,
            color: color || '#4CAF50',
            size: size || 3,
            life: life || 0.5,
            maxLife: life || 0.5,
            createdAt: Date.now()
        };
        
        this.particles.push(particle);
        return particle;
    }

    /**
     * Criar explosão de partículas
     */
    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 50 + Math.random() * 50;
            
            this.createParticle(
                x, 
                y, 
                color || '#FF5722', 
                2 + Math.random() * 4, 
                0.3 + Math.random() * 0.5,
                {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                }
            );
        }
    }

    /**
     * Criar texto flutuante (dano, cura, etc)
     */
    createFloatingText(x, y, text, color, duration = 1.0) {
        const element = document.createElement('div');
        element.textContent = text;
        element.style.position = 'absolute';
        element.style.left = (x - 20) + 'px';
        element.style.top = (y - 30) + 'px';
        element.style.color = color || '#fff';
        element.style.fontSize = '14px';
        element.style.fontWeight = 'bold';
        element.style.zIndex = '9999';
        element.style.pointerEvents = 'none';
        element.style.transition = `all ${duration}s ease-out`;
        element.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        
        document.body.appendChild(element);
        
        // Animação
        requestAnimationFrame(() => {
            element.style.transform = 'translateY(-30px)';
            element.style.opacity = '0';
        });
        
        // Remover após animação
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, duration * 1000);
        
        return element;
    }

    /**
     * Criar efeito de dano
     */
    createDamageEffect(x, y, damage, isCritical = false) {
        const color = isCritical ? '#FF1744' : '#FF5722';
        const text = isCritical ? `${damage}!` : `${damage}`;
        
        // Partículas de sangue/dano
        this.createExplosion(x, y, color, 5);
        
        // Texto flutuante
        this.createFloatingText(x, y - 20, text, color);
    }

    /**
     * Criar efeito de cura
     */
    createHealEffect(x, y, amount) {
        // Partículas verdes
        this.createExplosion(x, y, '#4CAF50', 8);
        
        // Texto flutuante
        this.createFloatingText(x, y - 20, `+${amount}`, '#4CAF50');
    }

    /**
     * Criar efeito de level up
     */
    createLevelUpEffect(x, y) {
        // Explosão dourada
        this.createExplosion(x, y, '#FFD700', 20);
        
        // Texto
        this.createFloatingText(x, y - 40, 'LEVEL UP!', '#FFD700', 2.0);
    }

    /**
     * Criar efeito de coleta
     */
    createCollectEffect(x, y, itemName) {
        // Partículas douradas
        this.createExplosion(x, y, '#FFD54F', 6);
        
        // Texto
        this.createFloatingText(x, y - 20, itemName, '#FFD54F');
    }

    /**
     * Criar efeito de skill
     */
    createSkillEffect(skillName, x, y, color) {
        const element = document.createElement('div');
        element.textContent = '✨ ' + skillName;
        element.style.position = 'absolute';
        element.style.left = (x - 30) + 'px';
        element.style.top = (y - 40) + 'px';
        element.style.color = color || '#ffff00';
        element.style.fontSize = '14px';
        element.style.fontWeight = 'bold';
        element.style.zIndex = '9999';
        element.style.pointerEvents = 'none';
        element.style.transition = 'all 1.5s ease-out';
        
        document.body.appendChild(element);
        
        // Animação
        requestAnimationFrame(() => {
            element.style.transform = 'translateY(-20px) scale(1.5)';
            element.style.opacity = '0';
        });
        
        // Remover após animação
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 1600);
        
        // Partículas
        this.createExplosion(x, y, color || '#FFD700', 8);
        
        return element;
    }

    /**
     * Criar trilha de movimento
     */
    createTrail(x, y, color, count = 3) {
        for (let i = 0; i < count; i++) {
            this.createParticle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                color || '#64B5F6',
                2,
                0.2 + Math.random() * 0.3
            );
        }
    }

    /**
     * Criar partículas de ambiente (fogo, magia, etc)
     */
    createAmbientParticles(x, y, color, intensity = 1) {
        const count = Math.floor(2 * intensity);
        for (let i = 0; i < count; i++) {
            this.createParticle(
                x + (Math.random() - 0.5) * 40,
                y + (Math.random() - 0.5) * 40,
                color || '#FF9800',
                1 + Math.random() * 2,
                0.5 + Math.random() * 1.0
            );
        }
    }

    /**
     * Atualizar todas as partículas
     */
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Atualizar posição
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // Gravidade
            particle.vy += 100 * deltaTime;
            
            // Reduzir vida
            particle.life -= deltaTime;
            
            // Remover se vida acabou
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Renderizar partículas
     */
    render(ctx, camera) {
        if (!ctx || !camera) return;
        
        for (const particle of this.particles) {
            // Verificar se está na câmera
            if (particle.x < camera.x - 50 || 
                particle.x > camera.x + camera.width + 50 ||
                particle.y < camera.y - 50 || 
                particle.y > camera.y + camera.height + 50) {
                continue;
            }
            
            const screenX = particle.x - camera.x;
            const screenY = particle.y - camera.y;
            
            // Calcular opacidade baseada na vida
            const alpha = particle.life / particle.maxLife;
            
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(screenX, screenY, particle.size, particle.size);
        }
        
        // Resetar alpha
        ctx.globalAlpha = 1;
    }

    /**
     * Limpar todas as partículas
     */
    clear() {
        this.particles = [];
        console.log('🧹 Partículas limpas');
    }

    /**
     * Obter contagem de partículas
     */
    getParticleCount() {
        return this.particles.length;
    }
}

// Exportar para uso global
window.ParticleSystem = ParticleSystem;
