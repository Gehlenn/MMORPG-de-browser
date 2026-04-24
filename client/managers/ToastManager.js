/**
 * ToastManager - Sistema de Notificações Avançado
 *
 * Responsabilidades:
 * - Notificações toast empilháveis
 * - Diferentes tipos: success, error, warning, info
 * - Animações de entrada/saída
 * - Progress bar para auto-dismiss
 * - Botões de ação nos toasts
 * - Ícones e cores diferenciadas
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.queue = [];
        this.initialized = false;
        this.toastId = 0;

        // Configurações
        this.config = {
            position: 'top-right', // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
            maxToasts: 5,
            duration: 5000,
            pauseOnHover: true,
            newestOnTop: true,
            showProgress: true,
            preventDuplicates: false
        };

        // Tipos de toast
        this.types = {
            success: {
                icon: '✓',
                color: '#4caf50',
                bgGradient: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                borderColor: 'rgba(76, 175, 80, 0.5)'
            },
            error: {
                icon: '✕',
                color: '#f44336',
                bgGradient: 'linear-gradient(135deg, #7f0000 0%, #c62828 100%)',
                borderColor: 'rgba(244, 67, 54, 0.5)'
            },
            warning: {
                icon: '⚠',
                color: '#ff9800',
                bgGradient: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
                borderColor: 'rgba(255, 152, 0, 0.5)'
            },
            info: {
                icon: 'ℹ',
                color: '#2196f3',
                bgGradient: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)',
                borderColor: 'rgba(33, 150, 243, 0.5)'
            },
            achievement: {
                icon: '🏆',
                color: '#ffd700',
                bgGradient: 'linear-gradient(135deg, #f57f17 0%, #fbc02d 100%)',
                borderColor: 'rgba(255, 215, 0, 0.5)'
            },
            loot: {
                icon: '🎁',
                color: '#9c27b0',
                bgGradient: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)',
                borderColor: 'rgba(156, 39, 176, 0.5)'
            },
            levelup: {
                icon: '⬆',
                color: '#00bcd4',
                bgGradient: 'linear-gradient(135deg, #006064 0%, #0097a7 100%)',
                borderColor: 'rgba(0, 188, 212, 0.5)'
            }
        };
    }

    init() {
        if (this.initialized) return;

        this.createContainer();
        this.createStyles();

        this.initialized = true;
        console.log('🍞 ToastManager inicializado');
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = `toast-container position-${this.config.position}`;
        document.body.appendChild(this.container);
    }

    createStyles() {
        const styles = document.createElement('style');
        styles.id = 'toast-manager-styles';
        styles.textContent = `
            .toast-container {
                position: fixed;
                z-index: 100001;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
                max-width: 400px;
                padding: 20px;
            }

            .toast-container.position-top-left {
                top: 0;
                left: 0;
            }

            .toast-container.position-top-center {
                top: 0;
                left: 50%;
                transform: translateX(-50%);
            }

            .toast-container.position-top-right {
                top: 0;
                right: 0;
            }

            .toast-container.position-bottom-left {
                bottom: 0;
                left: 0;
                flex-direction: column-reverse;
            }

            .toast-container.position-bottom-center {
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                flex-direction: column-reverse;
            }

            .toast-container.position-bottom-right {
                bottom: 0;
                right: 0;
                flex-direction: column-reverse;
            }

            .game-toast {
                pointer-events: auto;
                min-width: 300px;
                max-width: 400px;
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05);
                overflow: hidden;
                transform-origin: center;
                animation: toast-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            @keyframes toast-in {
                0% { transform: translateX(100%) scale(0.8); opacity: 0; }
                100% { transform: translateX(0) scale(1); opacity: 1; }
            }

            .game-toast.toast-exit {
                animation: toast-out 0.3s ease forwards;
            }

            @keyframes toast-out {
                0% { transform: translateX(0) scale(1); opacity: 1; }
                100% { transform: translateX(100%) scale(0.8); opacity: 0; }
            }

            .toast-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 15px;
                position: relative;
            }

            .toast-border {
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                border-radius: 12px 0 0 12px;
            }

            .toast-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                flex-shrink: 0;
                background: rgba(255,255,255,0.1);
            }

            .toast-body {
                flex: 1;
                min-width: 0;
            }

            .toast-title {
                color: #fff;
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 4px;
                font-family: 'Cinzel', serif;
            }

            .toast-message {
                color: rgba(255,255,255,0.8);
                font-size: 13px;
                line-height: 1.4;
                word-wrap: break-word;
            }

            .toast-close {
                background: none;
                border: none;
                color: rgba(255,255,255,0.5);
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .toast-close:hover {
                background: rgba(255,255,255,0.1);
                color: #fff;
            }

            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: rgba(255,255,255,0.1);
            }

            .toast-progress-bar {
                height: 100%;
                width: 100%;
                transform-origin: left;
                animation: progress linear forwards;
            }

            @keyframes progress {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }

            .toast-actions {
                display: flex;
                gap: 8px;
                margin-top: 10px;
            }

            .toast-action-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: inherit;
            }

            .toast-action-btn:hover {
                transform: translateY(-1px);
            }

            .toast-action-btn.primary {
                background: rgba(255,255,255,0.2);
                color: #fff;
            }

            .toast-action-btn.secondary {
                background: transparent;
                color: rgba(255,255,255,0.7);
                border: 1px solid rgba(255,255,255,0.2);
            }

            /* Efeito de brilho para toasts especiais */
            .game-toast.toast-shine {
                position: relative;
                overflow: hidden;
            }

            .game-toast.toast-shine::after {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(
                    45deg,
                    transparent 30%,
                    rgba(255,255,255,0.1) 50%,
                    transparent 70%
                );
                animation: shine 3s infinite;
            }

            @keyframes shine {
                0% { transform: translateX(-100%) rotate(45deg); }
                100% { transform: translateX(100%) rotate(45deg); }
            }

            /* Stack effect */
            .game-toast:nth-child(1) { transform: scale(1); z-index: 5; }
            .game-toast:nth-child(2) { transform: scale(0.95) translateY(-5px); z-index: 4; opacity: 0.9; }
            .game-toast:nth-child(3) { transform: scale(0.9) translateY(-10px); z-index: 3; opacity: 0.8; }
            .game-toast:nth-child(4) { transform: scale(0.85) translateY(-15px); z-index: 2; opacity: 0.7; }
            .game-toast:nth-child(5) { transform: scale(0.8) translateY(-20px); z-index: 1; opacity: 0.6; }
        `;

        if (!document.getElementById('toast-manager-styles')) {
            document.head.appendChild(styles);
        }
    }

    // Show a toast notification
    show(message, options = {}) {
        const opts = {
            type: 'info',
            title: null,
            duration: this.config.duration,
            actions: [],
            onClose: null,
            showProgress: this.config.showProgress,
            id: ++this.toastId,
            ...options
        };

        // Check duplicates
        if (this.config.preventDuplicates) {
            const duplicate = this.toasts.find(t => t.message === message && t.type === opts.type);
            if (duplicate) {
                // Reset timer of existing toast
                this.resetToastTimer(duplicate.id);
                return duplicate.id;
            }
        }

        // Check max toasts
        if (this.toasts.length >= this.config.maxToasts) {
            // Remove oldest
            const oldest = this.config.newestOnTop
                ? this.toasts[this.toasts.length - 1]
                : this.toasts[0];
            this.remove(oldest.id, false);
        }

        const toast = this.createToastElement(message, opts);

        // Add to container
        if (this.config.newestOnTop) {
            this.container.insertBefore(toast.element, this.container.firstChild);
        } else {
            this.container.appendChild(toast.element);
        }

        // Store toast data
        const toastData = {
            id: opts.id,
            element: toast.element,
            message: message,
            type: opts.type,
            startTime: Date.now(),
            duration: opts.duration,
            onClose: opts.onClose,
            timer: null
        };

        this.toasts.push(toastData);

        // Start timer
        this.startToastTimer(toastData);

        // Pause on hover
        if (this.config.pauseOnHover) {
            toast.element.addEventListener('mouseenter', () => this.pauseToast(toastData.id));
            toast.element.addEventListener('mouseleave', () => this.resumeToast(toastData.id));
        }

        return opts.id;
    }

    createToastElement(message, opts) {
        const typeData = this.types[opts.type] || this.types.info;

        const toast = document.createElement('div');
        toast.className = 'game-toast';
        toast.dataset.id = opts.id;

        const titleHtml = opts.title
            ? `<div class="toast-title">${opts.title}</div>`
            : '';

        const actionsHtml = opts.actions.length > 0
            ? `<div class="toast-actions">${opts.actions.map(a => `
                <button class="toast-action-btn ${a.type || 'primary'}" data-action="${a.id}">
                    ${a.label}
                </button>
            `).join('')}</div>`
            : '';

        const progressHtml = opts.showProgress
            ? `<div class="toast-progress">
                <div class="toast-progress-bar" style="
                    background: ${typeData.color};
                    animation-duration: ${opts.duration}ms;
                "></div>
               </div>`
            : '';

        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-border" style="background: ${typeData.color};"></div>
                <div class="toast-icon" style="color: ${typeData.color};">
                    ${typeData.icon}
                </div>
                <div class="toast-body">
                    ${titleHtml}
                    <div class="toast-message">${message}</div>
                    ${actionsHtml}
                </div>
                <button class="toast-close">×</button>
                ${progressHtml}
            </div>
        `;

        // Style the toast
        toast.style.background = typeData.bgGradient;
        toast.style.border = `1px solid ${typeData.borderColor}`;

        // Bind events
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.onclick = () => this.remove(opts.id);

        // Bind action buttons
        if (opts.actions.length > 0) {
            toast.querySelectorAll('.toast-action-btn').forEach(btn => {
                btn.onclick = () => {
                    const actionId = btn.dataset.action;
                    const action = opts.actions.find(a => a.id === actionId);
                    if (action && action.callback) {
                        action.callback();
                    }
                    if (action && action.closeOnClick !== false) {
                        this.remove(opts.id);
                    }
                };
            });
        }

        return { element: toast };
    }

    startToastTimer(toastData) {
        toastData.timer = setTimeout(() => {
            this.remove(toastData.id);
        }, toastData.duration);
    }

    pauseToast(id) {
        const toast = this.toasts.find(t => t.id === id);
        if (!toast || !toast.timer) return;

        clearTimeout(toast.timer);
        toast.timer = null;

        // Pause progress bar
        const progressBar = toast.element.querySelector('.toast-progress-bar');
        if (progressBar) {
            progressBar.style.animationPlayState = 'paused';
        }
    }

    resumeToast(id) {
        const toast = this.toasts.find(t => t.id === id);
        if (!toast) return;

        // Calculate remaining time
        const elapsed = Date.now() - toast.startTime;
        const remaining = Math.max(0, toast.duration - elapsed);

        if (remaining > 0) {
            toast.timer = setTimeout(() => {
                this.remove(id);
            }, remaining);

            // Resume progress bar
            const progressBar = toast.element.querySelector('.toast-progress-bar');
            if (progressBar) {
                progressBar.style.animationPlayState = 'running';
            }
        } else {
            this.remove(id);
        }
    }

    resetToastTimer(id) {
        const toast = this.toasts.find(t => t.id === id);
        if (!toast) return;

        clearTimeout(toast.timer);
        toast.startTime = Date.now();
        this.startToastTimer(toast);

        // Reset progress bar
        const progressBar = toast.element.querySelector('.toast-progress-bar');
        if (progressBar) {
            progressBar.style.animation = 'none';
            progressBar.offsetHeight; // Trigger reflow
            progressBar.style.animation = `progress ${toast.duration}ms linear forwards`;
        }
    }

    remove(id, animate = true) {
        const index = this.toasts.findIndex(t => t.id === id);
        if (index === -1) return;

        const toast = this.toasts[index];

        if (toast.timer) {
            clearTimeout(toast.timer);
        }

        if (animate && toast.element) {
            toast.element.classList.add('toast-exit');

            setTimeout(() => {
                this.destroyToast(toast, index);
            }, 300);
        } else {
            this.destroyToast(toast, index);
        }
    }

    destroyToast(toast, index) {
        if (toast.element && toast.element.parentNode) {
            toast.element.remove();
        }

        if (toast.onClose) {
            toast.onClose();
        }

        this.toasts.splice(index, 1);
    }

    // Clear all toasts
    clearAll(animate = true) {
        [...this.toasts].forEach(t => this.remove(t.id, animate));
    }

    // Quick methods for different types
    success(message, title = null, duration = null) {
        return this.show(message, { type: 'success', title, duration: duration || this.config.duration });
    }

    error(message, title = null, duration = null) {
        return this.show(message, { type: 'error', title, duration: duration || this.config.duration * 1.5 });
    }

    warning(message, title = null, duration = null) {
        return this.show(message, { type: 'warning', title, duration: duration || this.config.duration });
    }

    info(message, title = null, duration = null) {
        return this.show(message, { type: 'info', title, duration: duration || this.config.duration });
    }

    achievement(message, title = 'Conquista Desbloqueada!', duration = 8000) {
        return this.show(message, {
            type: 'achievement',
            title,
            duration,
            showProgress: true
        });
    }

    loot(itemName, quantity = 1, rarity = 'common') {
        const message = quantity > 1 ? `${quantity}x ${itemName}` : itemName;
        return this.show(message, {
            type: 'loot',
            title: 'Item Obtido!',
            duration: 5000
        });
    }

    levelUp(level, rewards = []) {
        const rewardText = rewards.length > 0
            ? `Recompensas: ${rewards.join(', ')}`
            : '';

        return this.show(`Parabéns! Você alcançou o nível ${level}! ${rewardText}`, {
            type: 'levelup',
            title: 'Level Up!',
            duration: 6000,
            actions: [
                { id: 'view', label: 'Ver Status', type: 'primary', callback: () => {
                    if (window.eventBus) {
                        window.eventBus.emit('showCharacterStatus');
                    }
                }}
            ]
        });
    }

    // Update config
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };

        // Update container position
        if (this.container) {
            this.container.className = `toast-container position-${this.config.position}`;
        }
    }

    // Get active toast count
    getActiveCount() {
        return this.toasts.length;
    }
}

window.ToastManager = ToastManager;
