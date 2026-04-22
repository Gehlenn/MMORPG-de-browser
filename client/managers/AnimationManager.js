/**
 * AnimationManager - Sistema de Animações UI
 *
 * Responsabilidades:
 * - Animações de entrada/saída para painéis
 * - Efeitos de hover em botões
 * - Animações de loading/spinner
 * - Partículas e efeitos visuais
 * - Transições suaves entre estados
 */

class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.particleContainers = new Map();
        this.initialized = false;

        // Configurações
        this.config = {
            defaultDuration: 300,
            defaultEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            particleCount: 50,
            enableParticles: true,
            reducedMotion: false
        };
    }

    init() {
        if (this.initialized) return;

        this.createStyles();
        this.checkReducedMotion();

        // Listen for system preference changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.config.reducedMotion = e.matches;
            });
        }

        this.initialized = true;
        console.log('✨ AnimationManager inicializado');
    }

    checkReducedMotion() {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.config.reducedMotion = true;
        }
    }

    createStyles() {
        const styles = document.createElement('style');
        styles.id = 'animation-manager-styles';
        styles.textContent = `
            /* Animações Base */
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            @keyframes slide-in-up {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @keyframes slide-in-down {
                from { transform: translateY(-30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @keyframes slide-in-left {
                from { transform: translateX(30px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slide-in-right {
                from { transform: translateX(-30px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes scale-in {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }

            @keyframes scale-out {
                from { transform: scale(1); opacity: 1; }
                to { transform: scale(0.9); opacity: 0; }
            }

            @keyframes bounce-in {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            @keyframes glow {
                0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
                50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4); }
            }

            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @keyframes ripple {
                0% { transform: scale(0); opacity: 1; }
                100% { transform: scale(4); opacity: 0; }
            }

            @keyframes typewriter {
                from { width: 0; }
                to { width: 100%; }
            }

            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }

            @keyframes progress {
                0% { background-position: 0% 50%; }
                100% { background-position: 100% 50%; }
            }

            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            /* Classes de Animação */
            .anim-fade-in { animation: fade-in 0.3s ease-out forwards; }
            .anim-fade-out { animation: fade-out 0.3s ease-out forwards; }
            .anim-slide-up { animation: slide-in-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            .anim-slide-down { animation: slide-in-down 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            .anim-slide-left { animation: slide-in-left 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            .anim-slide-right { animation: slide-in-right 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            .anim-scale-in { animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            .anim-scale-out { animation: scale-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            .anim-bounce { animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }
            .anim-shake { animation: shake 0.5s ease-in-out; }
            .anim-pulse { animation: pulse 2s ease-in-out infinite; }
            .anim-glow { animation: glow 2s ease-in-out infinite; }
            .anim-float { animation: float 3s ease-in-out infinite; }
            .anim-spin { animation: spin 1s linear infinite; }

            /* Estados de Hover */
            .hover-lift {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .hover-lift:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            }

            .hover-scale {
                transition: transform 0.2s ease;
            }
            .hover-scale:hover {
                transform: scale(1.05);
            }

            .hover-glow {
                transition: box-shadow 0.3s ease;
            }
            .hover-glow:hover {
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            }

            .hover-brightness {
                transition: filter 0.2s ease;
            }
            .hover-brightness:hover {
                filter: brightness(1.2);
            }

            /* Efeito Ripple em Botões */
            .btn-ripple {
                position: relative;
                overflow: hidden;
            }
            .btn-ripple::after {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                pointer-events: none;
                background-image: radial-gradient(circle, rgba(255,255,255,0.3) 10%, transparent 10.01%);
                background-repeat: no-repeat;
                background-position: 50%;
                transform: scale(10, 10);
                opacity: 0;
                transition: transform 0.5s, opacity 1s;
            }
            .btn-ripple:active::after {
                transform: scale(0, 0);
                opacity: 0.3;
                transition: 0s;
            }

            /* Efeito Shimmer (Loading) */
            .shimmer {
                background: linear-gradient(
                    90deg,
                    rgba(255,255,255,0) 0%,
                    rgba(255,255,255,0.2) 50%,
                    rgba(255,255,255,0) 100%
                );
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }

            /* Contêiner de Partículas */
            .particle-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 99999;
                overflow: hidden;
            }

            .particle {
                position: absolute;
                pointer-events: none;
                will-change: transform, opacity;
            }

            /* Toast Animations */
            .toast-enter {
                animation: slide-in-right 0.3s ease-out forwards;
            }
            .toast-exit {
                animation: fade-out 0.3s ease-out forwards;
            }

            /* Reduced Motion */
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;

        if (!document.getElementById('animation-manager-styles')) {
            document.head.appendChild(styles);
        }
    }

    // Animate element with specified animation
    animate(element, animationName, duration = null) {
        if (!element || this.config.reducedMotion) return;

        const animDuration = duration || this.config.defaultDuration;
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = `${animationName} ${animDuration}ms ${this.config.defaultEasing} forwards`;

        return new Promise(resolve => {
            const handler = () => {
                element.removeEventListener('animationend', handler);
                resolve();
            };
            element.addEventListener('animationend', handler, { once: true });
        });
    }

    // Fade in element
    fadeIn(element, duration = 300) {
        return this.animate(element, 'fade-in', duration);
    }

    // Fade out element
    fadeOut(element, duration = 300) {
        return this.animate(element, 'fade-out', duration);
    }

    // Slide up animation
    slideUp(element, duration = 400) {
        return this.animate(element, 'slide-in-up', duration);
    }

    // Slide down animation
    slideDown(element, duration = 400) {
        return this.animate(element, 'slide-in-down', duration);
    }

    // Scale in animation
    scaleIn(element, duration = 300) {
        return this.animate(element, 'scale-in', duration);
    }

    // Bounce animation
    bounce(element, duration = 600) {
        return this.animate(element, 'bounce-in', duration);
    }

    // Shake animation (for errors)
    shake(element) {
        return this.animate(element, 'shake', 500);
    }

    // Pulse animation
    pulse(element, infinite = true) {
        element.style.animation = infinite
            ? `pulse 2s ease-in-out infinite`
            : `pulse 2s ease-in-out 3`;
    }

    // Glow animation
    glow(element, infinite = true) {
        element.style.animation = infinite
            ? `glow 2s ease-in-out infinite`
            : `glow 2s ease-in-out 3`;
    }

    // Float animation
    float(element) {
        element.style.animation = 'float 3s ease-in-out infinite';
    }

    // Stop all animations on element
    stop(element) {
        if (element) {
            element.style.animation = 'none';
        }
    }

    // Add hover effects
    addHoverEffect(element, effect = 'lift') {
        if (!element) return;
        element.classList.add(`hover-${effect}`);
    }

    // Add ripple effect to button
    addRippleEffect(button) {
        if (!button) return;
        button.classList.add('btn-ripple');
    }

    // Create particle explosion
    createParticles(x, y, options = {}) {
        if (!this.config.enableParticles || this.config.reducedMotion) return;

        const defaults = {
            count: 20,
            color: '#ffd700',
            size: { min: 4, max: 8 },
            speed: { min: 2, max: 6 },
            spread: 100,
            gravity: 0.3,
            fadeRate: 0.02,
            shapes: ['circle', 'square', 'star']
        };

        const config = { ...defaults, ...options };

        const container = this.getParticleContainer();

        for (let i = 0; i < config.count; i++) {
            const particle = this.createParticleElement(x, y, config);
            container.appendChild(particle);
            this.animateParticle(particle, config);
        }
    }

    getParticleContainer() {
        let container = document.getElementById('global-particle-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'global-particle-container';
            container.className = 'particle-container';
            document.body.appendChild(container);
        }
        return container;
    }

    createParticleElement(x, y, config) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = this.randomBetween(config.size.min, config.size.max);
        const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${config.color};
            border-radius: ${shape === 'circle' ? '50%' : shape === 'square' ? '0' : '2px'};
            left: ${x}px;
            top: ${y}px;
            opacity: 1;
            clip-path: ${shape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : 'none'};
        `;

        // Store physics data
        particle.dataset.vx = (Math.random() - 0.5) * config.speed.max;
        particle.dataset.vy = -this.randomBetween(config.speed.min, config.speed.max);
        particle.dataset.gravity = config.gravity;
        particle.dataset.fadeRate = config.fadeRate;

        return particle;
    }

    animateParticle(particle, config) {
        let x = parseFloat(particle.style.left);
        let y = parseFloat(particle.style.top);
        let vx = parseFloat(particle.dataset.vx);
        let vy = parseFloat(particle.dataset.vy);
        let opacity = 1;

        const animate = () => {
            if (opacity <= 0) {
                particle.remove();
                return;
            }

            vy += parseFloat(particle.dataset.gravity);
            x += vx;
            y += vy;
            opacity -= parseFloat(particle.dataset.fadeRate);

            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.opacity = opacity;

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Success effect
    successEffect(element) {
        if (!element) return;
        this.bounce(element);
        this.glow(element, false);

        const rect = element.getBoundingClientRect();
        this.createParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            { count: 15, color: '#4caf50', shapes: ['circle'] }
        );
    }

    // Error effect
    errorEffect(element) {
        if (!element) return;
        this.shake(element);

        const rect = element.getBoundingClientRect();
        this.createParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            { count: 10, color: '#f44336', shapes: ['square'] }
        );
    }

    // Level up effect
    levelUpEffect(element) {
        if (!element) return;
        this.bounce(element, 800);

        const rect = element.getBoundingClientRect();
        this.createParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            { count: 30, color: '#ffd700', shapes: ['star', 'circle'], spread: 200 }
        );
    }

    // Stagger animations for multiple elements
    stagger(elements, animationName, staggerDelay = 100, duration = null) {
        if (!elements || this.config.reducedMotion) return Promise.resolve();

        return Promise.all(
            Array.from(elements).map((el, i) =>
                new Promise(resolve => {
                    setTimeout(() => {
                        this.animate(el, animationName, duration).then(resolve);
                    }, i * staggerDelay);
                })
            )
        );
    }

    // Page transition
    pageTransition(outElement, inElement, type = 'fade') {
        if (this.config.reducedMotion) {
            if (outElement) outElement.style.display = 'none';
            if (inElement) inElement.style.display = 'block';
            return Promise.resolve();
        }

        return new Promise(resolve => {
            if (outElement) {
                const outAnim = type === 'slide' ? 'slide-in-left' : 'fade-out';
                this.animate(outElement, outAnim, 300).then(() => {
                    outElement.style.display = 'none';

                    if (inElement) {
                        inElement.style.display = 'block';
                        const inAnim = type === 'slide' ? 'slide-in-right' : 'fade-in';
                        this.animate(inElement, inAnim, 300).then(resolve);
                    } else {
                        resolve();
                    }
                });
            } else if (inElement) {
                inElement.style.display = 'block';
                const inAnim = type === 'slide' ? 'slide-in-right' : 'fade-in';
                this.animate(inElement, inAnim, 300).then(resolve);
            } else {
                resolve();
            }
        });
    }

    // Loading shimmer effect
    addShimmer(element) {
        if (!element) return;
        element.classList.add('shimmer');
    }

    removeShimmer(element) {
        if (!element) return;
        element.classList.remove('shimmer');
    }

    // Typewriter effect for text
    async typewriter(element, text, speed = 50) {
        if (!element || this.config.reducedMotion) {
            if (element) element.textContent = text;
            return;
        }

        element.textContent = '';
        element.style.borderRight = '2px solid currentColor';
        element.style.animation = 'blink 1s infinite';

        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await this.delay(speed);
        }

        element.style.borderRight = 'none';
        element.style.animation = 'none';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Parallax effect
    addParallax(element, intensity = 0.5) {
        if (!element || this.config.reducedMotion) return;

        const handler = (e) => {
            const x = (window.innerWidth - e.pageX * intensity) / 100;
            const y = (window.innerHeight - e.pageY * intensity) / 100;
            element.style.transform = `translateX(${x}px) translateY(${y}px)`;
        };

        document.addEventListener('mousemove', handler);

        // Return cleanup function
        return () => document.removeEventListener('mousemove', handler);
    }

    // Smooth scroll to element
    scrollTo(element, duration = 500) {
        if (!element) return;

        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;

        if (this.config.reducedMotion) {
            window.scrollTo(0, targetPosition);
            return Promise.resolve();
        }

        return new Promise(resolve => {
            let startTime = null;

            const animation = (currentTime) => {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);

                // Ease in-out
                const ease = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                window.scrollTo(0, startPosition + distance * ease);

                if (progress < 1) {
                    requestAnimationFrame(animation);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animation);
        });
    }

    // Update settings
    updateSettings(settings) {
        this.config = { ...this.config, ...settings };
        console.log('✨ AnimationManager settings updated:', this.config);
    }

    // Get current settings
    getSettings() {
        return { ...this.config };
    }
}

window.AnimationManager = AnimationManager;
