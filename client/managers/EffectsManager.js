/**
 * EffectsManager - Sistema de Efeitos Visuais Avançados
 * 
 * Gerencia:
 * - Screen transitions (fade in/out)
 * - Toast notifications melhoradas
 * - Floating combat text pool
 * - Weather effects (rain, snow)
 * - Ambient particles
 * - Screen flash effects
 */

class EffectsManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas?.getContext('2d');
        
        // Configurações
        this.config = {
            maxToasts: 5,
            toastDuration: 3000,
            maxFloatingTexts: 30,
            weatherEnabled: false,
            weatherType: null, // 'rain', 'snow'
            ambientParticles: true
        };
        
        // Estado
        this.toasts = [];
        this.floatingTexts = [];
        this.screenEffects = {
            flash: null,
            fade: null,
            shake: { active: false, intensity: 0, duration: 0 }
        };
        this.weather = {
            particles: [],
            intensity: 0.5
        };
        this.ambient = {
            particles: [],
            lastSpawn: 0
        };
        
        this.initialized = false;
    }
    
    init() {
        if (this.initialized || !this.ctx) return;
        
        this.initialized = true;
        console.log('✨ EffectsManager inicializado');
    }
    
    // ===================== SCREEN TRANSITIONS =====================
    
    /**
     * Inicia fade out da tela
     */
    fadeOut(duration = 1000, color = '#000000', callback = null) {
        this.screenEffects.fade = {
            type: 'out',
            color,
            startTime: Date.now(),
            duration,
            progress: 0,
            callback
        };
    }
    
    /**
     * Inicia fade in da tela
     */
    fadeIn(duration = 1000, color = '#000000', callback = null) {
        this.screenEffects.fade = {
            type: 'in',
            color,
            startTime: Date.now(),
            duration,
            progress: 1,
            callback
        };
    }
    
    /**
     * Flash da tela (dano, level up, etc)
     */
    flashScreen(color = '#ffffff', duration = 200, intensity = 0.3) {
        this.screenEffects.flash = {
            color,
            startTime: Date.now(),
            duration,
            intensity
        };
    }
    
    /**
     * Renderiza efeitos de tela
     */
    renderScreenEffects(ctx, canvas) {
        // Flash effect
        if (this.screenEffects.flash) {
            const elapsed = Date.now() - this.screenEffects.flash.startTime;
            
            if (elapsed < this.screenEffects.flash.duration) {
                const progress = elapsed / this.screenEffects.flash.duration;
                const alpha = this.screenEffects.flash.intensity * (1 - progress);
                
                ctx.save();
                ctx.fillStyle = this.hexToRgba(this.screenEffects.flash.color, alpha);
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            } else {
                this.screenEffects.flash = null;
            }
        }
        
        // Fade effect
        if (this.screenEffects.fade) {
            const { fade } = this.screenEffects;
            const elapsed = Date.now() - fade.startTime;
            const progress = Math.min(elapsed / fade.duration, 1);
            
            let alpha;
            if (fade.type === 'out') {
                alpha = progress;
                fade.progress = progress;
            } else {
                alpha = 1 - progress;
                fade.progress = 1 - progress;
            }
            
            if (progress < 1) {
                ctx.save();
                ctx.fillStyle = this.hexToRgba(fade.color, alpha);
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            } else {
                if (fade.callback) fade.callback();
                this.screenEffects.fade = null;
            }
        }
    }
    
    // ===================== TOAST NOTIFICATIONS =====================
    
    /**
     * Adiciona toast notification
     */
    showToast(message, options = {}) {
        const {
            type = 'info', // info, success, warning, error
            icon = null,
            duration = this.config.toastDuration,
            position = 'top-right'
        } = options;
        
        // Limitar número de toasts
        if (this.toasts.length >= this.config.maxToasts) {
            this.toasts.shift();
        }
        
        const colors = {
            info: { bg: '#2196F3', border: '#1976D2' },
            success: { bg: '#4CAF50', border: '#388E3C' },
            warning: { bg: '#FF9800', border: '#F57C00' },
            error: { bg: '#f44336', border: '#D32F2F' }
        };
        
        const toast = {
            id: Date.now() + Math.random(),
            message,
            type,
            icon: icon || this.getDefaultIcon(type),
            color: colors[type],
            startTime: Date.now(),
            duration,
            position,
            y: 0 // Calculado no render
        };
        
        this.toasts.push(toast);
        
        // Auto-remove
        setTimeout(() => {
            this.removeToast(toast.id);
        }, duration);
        
        return toast.id;
    }
    
    removeToast(id) {
        const index = this.toasts.findIndex(t => t.id === id);
        if (index > -1) {
            this.toasts.splice(index, 1);
        }
    }
    
    getDefaultIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || '🔔';
    }
    
    renderToasts(ctx, canvas) {
        const toastHeight = 50;
        const toastWidth = 280;
        const gap = 10;
        const startY = 20;
        const startX = canvas.width - toastWidth - 20;
        
        this.toasts.forEach((toast, index) => {
            const elapsed = Date.now() - toast.startTime;
            const progress = Math.min(elapsed / toast.duration, 1);
            
            // Animação de entrada e saída
            let offsetX = 0;
            let alpha = 1;
            
            if (elapsed < 300) {
                // Entrada
                offsetX = (1 - elapsed / 300) * 50;
                alpha = elapsed / 300;
            } else if (progress > 0.8) {
                // Saída
                const exitProgress = (progress - 0.8) / 0.2;
                offsetX = exitProgress * 50;
                alpha = 1 - exitProgress;
            }
            
            const x = startX + offsetX;
            const y = startY + index * (toastHeight + gap);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Background
            ctx.fillStyle = 'rgba(30, 30, 30, 0.95)';
            ctx.beginPath();
            ctx.roundRect(x, y, toastWidth, toastHeight, 8);
            ctx.fill();
            
            // Border color
            ctx.strokeStyle = toast.color.border;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Icon
            ctx.font = '24px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.fillText(toast.icon, x + 15, y + 35);
            
            // Message
            ctx.font = '14px Arial';
            this.wrapText(ctx, toast.message, x + 50, y + 28, toastWidth - 70, 18);
            
            // Progress bar
            const barWidth = toastWidth - 20;
            const barProgress = 1 - progress;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x + 10, y + toastHeight - 8, barWidth, 3);
            
            ctx.fillStyle = toast.color.bg;
            ctx.fillRect(x + 10, y + toastHeight - 8, barWidth * barProgress, 3);
            
            ctx.restore();
        });
        
        // Limpar toasts antigos
        this.toasts = this.toasts.filter(t => (Date.now() - t.startTime) < t.duration);
    }
    
    // ===================== FLOATING COMBAT TEXT =====================
    
    /**
     * Adiciona texto flutuante de combate
     */
    addFloatingText(text, x, y, options = {}) {
        const {
            color = '#ffffff',
            size = 16,
            duration = 1500,
            velocity = { x: (Math.random() - 0.5) * 2, y: -1 },
            isCritical = false,
            isHeal = false
        } = options;
        
        // Limitar quantidade
        if (this.floatingTexts.length >= this.config.maxFloatingTexts) {
            this.floatingTexts.shift();
        }
        
        this.floatingTexts.push({
            text,
            x,
            y,
            startX: x,
            startY: y,
            color,
            size,
            startTime: Date.now(),
            duration,
            velocity,
            isCritical,
            isHeal,
            offsetY: 0
        });
    }
    
    renderFloatingTexts(ctx) {
        this.floatingTexts = this.floatingTexts.filter(ft => {
            const elapsed = Date.now() - ft.startTime;
            const progress = elapsed / ft.duration;
            
            if (progress >= 1) return false;
            
            // Movimento
            ft.offsetY = -progress * 50;
            ft.x = ft.startX + Math.sin(progress * Math.PI * 2) * 10;
            
            // Alpha
            const alpha = 1 - progress;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Sombra
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            // Texto
            ctx.font = `${ft.isCritical ? 'bold ' : ''}${ft.size}px Arial`;
            ctx.fillStyle = ft.color;
            ctx.textAlign = 'center';
            
            // Outline para legibilidade
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, ft.x, ft.y + ft.offsetY);
            
            ctx.fillText(ft.text, ft.x, ft.y + ft.offsetY);
            
            // Indicador crítico
            if (ft.isCritical && progress < 0.3) {
                const scale = 1 + Math.sin(progress * Math.PI * 3) * 0.3;
                ctx.font = '12px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.fillText('CRIT!', ft.x, ft.y + ft.offsetY - ft.size);
            }
            
            ctx.restore();
            
            return true;
        });
    }
    
    // ===================== WEATHER EFFECTS =====================
    
    /**
     * Ativa efeito climático
     */
    setWeather(type, intensity = 0.5) {
        this.config.weatherType = type;
        this.config.weatherEnabled = !!type;
        this.weather.intensity = intensity;
        this.weather.particles = [];
        
        // Pré-gerar partículas
        if (type) {
            const count = Math.floor(intensity * 200);
            for (let i = 0; i < count; i++) {
                this.spawnWeatherParticle();
            }
        }
    }
    
    spawnWeatherParticle() {
        const canvas = this.canvas;
        if (!canvas) return;
        
        const particle = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            speed: this.config.weatherType === 'rain' ? 15 + Math.random() * 10 : 2 + Math.random() * 2,
            size: this.config.weatherType === 'rain' ? 2 : 3 + Math.random() * 2,
            opacity: 0.3 + Math.random() * 0.4
        };
        
        this.weather.particles.push(particle);
    }
    
    renderWeather(ctx, canvas) {
        if (!this.config.weatherEnabled) return;
        
        const isRain = this.config.weatherType === 'rain';
        
        ctx.save();
        
        this.weather.particles = this.weather.particles.filter(p => {
            // Atualizar posição
            p.y += p.speed;
            if (isRain) {
                p.x += Math.random() - 0.5; // Vento leve
            } else {
                p.x += Math.sin(p.y / 50) * 0.5; // Flutuação da neve
            }
            
            // Render
            ctx.globalAlpha = p.opacity;
            
            if (isRain) {
                ctx.strokeStyle = 'rgba(200, 200, 255, 0.6)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + 1, p.y + p.size * 3);
                ctx.stroke();
            } else {
                // Snow
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Reset se sair da tela
            if (p.y > canvas.height) {
                if (Math.random() < 0.1) { // 10% chance de reciclar
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                    return true;
                }
                return false;
            }
            
            return true;
        });
        
        // Spawn novas partículas
        if (this.weather.particles.length < this.weather.intensity * 200) {
            this.spawnWeatherParticle();
        }
        
        ctx.restore();
    }
    
    // ===================== AMBIENT PARTICLES =====================
    
    /**
     * Renderiza partículas ambiente (poeira, fagulhas)
     */
    renderAmbient(ctx, canvas) {
        const now = Date.now();
        
        // Spawn gradual
        if (now - this.ambient.lastSpawn > 500 && this.ambient.particles.length < 30) {
            this.ambient.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -0.2 - Math.random() * 0.3,
                size: 1 + Math.random() * 2,
                life: 0,
                maxLife: 3000 + Math.random() * 2000,
                color: Math.random() > 0.5 ? 'rgba(255, 200, 150, ' : 'rgba(200, 200, 255, '
            });
            this.ambient.lastSpawn = now;
        }
        
        this.ambient.particles = this.ambient.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life += 16;
            
            const progress = p.life / p.maxLife;
            const alpha = progress < 0.2 ? progress * 5 : 1 - progress;
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = p.color + '0.3)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            return p.life < p.maxLife;
        });
    }
    
    // ===================== RENDER ALL =====================
    
    render(ctx, canvas) {
        if (!this.initialized) return;
        
        // Weather primeiro (fundo)
        this.renderWeather(ctx, canvas);
        
        // Ambient
        this.renderAmbient(ctx, canvas);
        
        // Screen effects (flash, fade)
        this.renderScreenEffects(ctx, canvas);
        
        // UI effects por cima
        this.renderFloatingTexts(ctx);
        this.renderToasts(ctx, canvas);
    }
    
    // ===================== UTILS =====================
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }
    
    /**
     * Limpa todos os efeitos
     */
    clear() {
        this.toasts = [];
        this.floatingTexts = [];
        this.screenEffects = { flash: null, fade: null, shake: { active: false } };
        this.weather.particles = [];
        this.ambient.particles = [];
    }
}

// Exportar
window.EffectsManager = EffectsManager;
