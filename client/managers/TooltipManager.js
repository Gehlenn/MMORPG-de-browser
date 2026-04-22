/**
 * TooltipManager - Sistema de Tooltips Avançado
 *
 * Responsabilidades:
 * - Tooltips informativos em hover
 * - Tooltips com título, descrição e atalhos
 * - Posicionamento inteligente
 * - Tooltips para itens, skills, botões
 * - Suporte a HTML e imagens
 */

class TooltipManager {
    constructor() {
        this.tooltip = null;
        this.currentTarget = null;
        this.initialized = false;

        // Configurações
        this.config = {
            delay: 300,
            fadeDuration: 200,
            maxWidth: 300,
            position: 'auto', // auto, top, bottom, left, right
            offset: 10,
            showShortcut: true,
            showIcon: true
        };

        // Registro de tooltips predefinidos
        this.registeredTooltips = new Map();
    }

    init() {
        if (this.initialized) return;

        this.createTooltipElement();
        this.createStyles();
        this.setupGlobalListeners();
        this.registerDefaultTooltips();

        this.initialized = true;
        console.log('💬 TooltipManager inicializado');
    }

    createTooltipElement() {
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'game-tooltip';
        this.tooltip.className = 'game-tooltip';
        this.tooltip.style.cssText = `
            position: fixed;
            z-index: 100000;
            pointer-events: none;
            opacity: 0;
            transition: opacity ${this.config.fadeDuration}ms ease;
        `;
        this.tooltip.innerHTML = `
            <div class="tooltip-content">
                <div class="tooltip-header">
                    <span class="tooltip-icon"></span>
                    <span class="tooltip-title"></span>
                </div>
                <div class="tooltip-body"></div>
                <div class="tooltip-footer">
                    <span class="tooltip-shortcut"></span>
                </div>
            </div>
            <div class="tooltip-arrow"></div>
        `;
        document.body.appendChild(this.tooltip);
    }

    createStyles() {
        const styles = document.createElement('style');
        styles.id = 'tooltip-manager-styles';
        styles.textContent = `
            .game-tooltip {
                font-family: 'Cinzel', 'Georgia', serif;
                max-width: ${this.config.maxWidth}px;
            }

            .game-tooltip .tooltip-content {
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-radius: 8px;
                padding: 12px 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 10px rgba(255, 215, 0, 0.1);
                position: relative;
            }

            .game-tooltip.tooltip-rare .tooltip-content {
                border-color: rgba(33, 150, 243, 0.5);
                box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 10px rgba(33, 150, 243, 0.2);
            }

            .game-tooltip.tooltip-epic .tooltip-content {
                border-color: rgba(156, 39, 176, 0.5);
                box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 10px rgba(156, 39, 176, 0.2);
            }

            .game-tooltip.tooltip-legendary .tooltip-content {
                border-color: rgba(255, 152, 0, 0.5);
                box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(255, 152, 0, 0.3);
            }

            .game-tooltip .tooltip-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .game-tooltip .tooltip-icon {
                font-size: 20px;
                line-height: 1;
            }

            .game-tooltip .tooltip-title {
                color: #ffd700;
                font-weight: bold;
                font-size: 14px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }

            .game-tooltip.tooltip-rare .tooltip-title { color: #2196f3; }
            .game-tooltip.tooltip-epic .tooltip-title { color: #9c27b0; }
            .game-tooltip.tooltip-legendary .tooltip-title { color: #ff9800; }

            .game-tooltip .tooltip-body {
                color: #ccc;
                font-size: 12px;
                line-height: 1.5;
                margin-bottom: 8px;
            }

            .game-tooltip .tooltip-body strong {
                color: #fff;
            }

            .game-tooltip .tooltip-stats {
                background: rgba(0,0,0,0.2);
                border-radius: 4px;
                padding: 8px;
                margin: 8px 0;
            }

            .game-tooltip .tooltip-stat {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                padding: 2px 0;
            }

            .game-tooltip .tooltip-stat-label {
                color: #888;
            }

            .game-tooltip .tooltip-stat-value {
                color: #4caf50;
                font-weight: bold;
            }

            .game-tooltip .tooltip-stat-value.negative {
                color: #f44336;
            }

            .game-tooltip .tooltip-footer {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }

            .game-tooltip .tooltip-shortcut {
                background: rgba(255,255,255,0.1);
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                color: #888;
                font-family: monospace;
            }

            .game-tooltip .tooltip-arrow {
                position: absolute;
                width: 0;
                height: 0;
                border-style: solid;
            }

            .game-tooltip.position-top .tooltip-arrow {
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 6px 6px 0 6px;
                border-color: rgba(255, 215, 0, 0.3) transparent transparent transparent;
            }

            .game-tooltip.position-bottom .tooltip-arrow {
                top: -6px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 0 6px 6px 6px;
                border-color: transparent transparent rgba(255, 215, 0, 0.3) transparent;
            }

            .game-tooltip.position-left .tooltip-arrow {
                right: -6px;
                top: 50%;
                transform: translateY(-50%);
                border-width: 6px 0 6px 6px;
                border-color: transparent transparent transparent rgba(255, 215, 0, 0.3);
            }

            .game-tooltip.position-right .tooltip-arrow {
                left: -6px;
                top: 50%;
                transform: translateY(-50%);
                border-width: 6px 6px 6px 0;
                border-color: transparent rgba(255, 215, 0, 0.3) transparent transparent;
            }

            /* Tooltip para items */
            .game-tooltip.tooltip-item .tooltip-body {
                min-height: 20px;
            }

            .game-tooltip .tooltip-item-level {
                color: #ffd700;
                font-size: 11px;
                margin-top: 4px;
            }

            .game-tooltip .tooltip-item-type {
                color: #888;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            /* Quick tooltip (simple) */
            .game-tooltip.tooltip-simple .tooltip-content {
                padding: 8px 12px;
            }

            .game-tooltip.tooltip-simple .tooltip-header,
            .game-tooltip.tooltip-simple .tooltip-footer {
                display: none;
            }

            .game-tooltip.tooltip-simple .tooltip-body {
                margin: 0;
                font-size: 13px;
            }
        `;

        if (!document.getElementById('tooltip-manager-styles')) {
            document.head.appendChild(styles);
        }
    }

    setupGlobalListeners() {
        // Global mouse move for tooltip positioning
        document.addEventListener('mousemove', (e) => {
            if (this.currentTarget && this.tooltip) {
                this.positionTooltip(e.clientX, e.clientY);
            }
        });

        // Hide tooltip on scroll
        document.addEventListener('scroll', () => this.hide(), true);
    }

    registerDefaultTooltips() {
        // Atalhos de teclado
        this.register('inventory-btn', {
            title: 'Inventário',
            description: 'Gerencie seus itens e equipamentos',
            shortcut: 'Tecla I',
            icon: '🎒'
        });

        this.register('quests-btn', {
            title: 'Quests',
            description: 'Veja suas missões ativas e disponíveis',
            shortcut: 'Tecla Q',
            icon: '📜'
        });

        this.register('crafting-btn', {
            title: 'Crafting',
            description: 'Crie itens e melhore suas habilidades',
            shortcut: 'Tecla C',
            icon: '⚒️'
        });

        this.register('merchant-btn', {
            title: 'Mercadores',
            description: 'Compre e venda itens',
            shortcut: 'Tecla M',
            icon: '💰'
        });

        this.register('trade-btn', {
            title: 'Troca',
            description: 'Troque itens com outros jogadores',
            shortcut: 'Tecla T',
            icon: '🔄'
        });

        this.register('party-btn', {
            title: 'Grupo',
            description: 'Gerencie seu grupo de aventureiros',
            shortcut: 'Tecla P',
            icon: '👥'
        });

        this.register('guild-btn', {
            title: 'Guilda',
            description: 'Acesse sua guilda e membros',
            shortcut: 'Tecla G',
            icon: '🏰'
        });

        this.register('pvp-btn', {
            title: 'PvP',
            description: 'Duelos, arenas e ranking',
            shortcut: 'Tecla V',
            icon: '⚔️'
        });

        // Botões comuns
        this.register('btn-close', {
            title: 'Fechar',
            description: 'Fechar esta janela',
            shortcut: 'ESC',
            icon: '✕'
        });

        this.register('btn-accept', {
            title: 'Aceitar',
            description: 'Confirmar esta ação',
            icon: '✓'
        });

        this.register('btn-decline', {
            title: 'Recusar',
            description: 'Cancelar esta ação',
            icon: '✗'
        });
    }

    // Register a tooltip
    register(id, data) {
        this.registeredTooltips.set(id, data);
    }

    // Attach tooltip to element
    attach(element, data) {
        if (!element) return;

        // Can pass ID of registered tooltip or data object
        const tooltipData = typeof data === 'string'
            ? this.registeredTooltips.get(data)
            : data;

        if (!tooltipData) {
            console.warn('Tooltip data not found:', data);
            return;
        }

        // Store data on element
        element.dataset.tooltipId = typeof data === 'string' ? data : '';
        element._tooltipData = tooltipData;

        // Add event listeners
        element.addEventListener('mouseenter', (e) => this.show(element, e));
        element.addEventListener('mouseleave', () => this.hide());
        element.addEventListener('focus', (e) => this.show(element, e));
        element.addEventListener('blur', () => this.hide());

        // Mark as processed
        element.classList.add('tooltip-attached');
    }

    // Show tooltip
    show(element, event) {
        if (!this.tooltip || !element) return;

        const data = element._tooltipData;
        if (!data) return;

        this.currentTarget = element;

        // Update content
        const iconEl = this.tooltip.querySelector('.tooltip-icon');
        const titleEl = this.tooltip.querySelector('.tooltip-title');
        const bodyEl = this.tooltip.querySelector('.tooltip-body');
        const shortcutEl = this.tooltip.querySelector('.tooltip-shortcut');

        iconEl.textContent = data.icon || '';
        iconEl.style.display = data.icon ? 'block' : 'none';

        titleEl.textContent = data.title || '';

        // Build body content
        let bodyContent = data.description || '';

        // Add stats if present
        if (data.stats && data.stats.length > 0) {
            bodyContent += '<div class="tooltip-stats">';
            data.stats.forEach(stat => {
                const valueClass = stat.value < 0 ? 'negative' : '';
                bodyContent += `
                    <div class="tooltip-stat">
                        <span class="tooltip-stat-label">${stat.label}</span>
                        <span class="tooltip-stat-value ${valueClass}">${stat.value > 0 ? '+' : ''}${stat.value}</span>
                    </div>
                `;
            });
            bodyContent += '</div>';
        }

        // Add item info if present
        if (data.itemLevel) {
            bodyContent += `<div class="tooltip-item-level">Nível ${data.itemLevel}</div>`;
        }
        if (data.itemType) {
            bodyContent += `<div class="tooltip-item-type">${data.itemType}</div>`;
        }

        bodyEl.innerHTML = bodyContent;

        // Update shortcut
        if (this.config.showShortcut && data.shortcut) {
            shortcutEl.textContent = data.shortcut;
            shortcutEl.style.display = 'inline';
        } else {
            shortcutEl.style.display = 'none';
        }

        // Apply rarity class
        this.tooltip.className = 'game-tooltip';
        if (data.rarity) {
            this.tooltip.classList.add(`tooltip-${data.rarity}`);
        }
        if (data.simple) {
            this.tooltip.classList.add('tooltip-simple');
        }
        if (data.itemType) {
            this.tooltip.classList.add('tooltip-item');
        }

        // Position and show
        this.positionTooltip(event.clientX, event.clientY);

        requestAnimationFrame(() => {
            this.tooltip.style.opacity = '1';
        });
    }

    // Hide tooltip
    hide() {
        if (!this.tooltip) return;

        this.tooltip.style.opacity = '0';
        this.currentTarget = null;

        setTimeout(() => {
            if (!this.currentTarget) {
                this.tooltip.className = 'game-tooltip';
            }
        }, this.config.fadeDuration);
    }

    // Position tooltip
    positionTooltip(x, y) {
        if (!this.tooltip) return;

        const rect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let posX = x;
        let posY = y - rect.height - this.config.offset;
        let position = 'top';

        // Auto-position based on viewport
        if (this.config.position === 'auto') {
            // Check top space
            if (posY < 0) {
                posY = y + this.config.offset;
                position = 'bottom';
            }

            // Check right overflow
            if (posX + rect.width > viewportWidth) {
                posX = viewportWidth - rect.width - this.config.offset;
            }

            // Check left overflow
            if (posX < 0) {
                posX = this.config.offset;
            }
        } else {
            // Manual positioning
            switch (this.config.position) {
                case 'top':
                    posY = y - rect.height - this.config.offset;
                    break;
                case 'bottom':
                    posY = y + this.config.offset;
                    break;
                case 'left':
                    posX = x - rect.width - this.config.offset;
                    break;
                case 'right':
                    posX = x + this.config.offset;
                    break;
            }
        }

        this.tooltip.style.left = `${posX}px`;
        this.tooltip.style.top = `${posY}px`;
        this.tooltip.classList.add(`position-${position}`);
    }

    // Quick tooltip - just text
    showQuick(element, text) {
        this.attach(element, {
            description: text,
            simple: true
        });
    }

    // Item tooltip helper
    showItem(element, item) {
        const rarityMap = {
            1: 'common',
            2: 'uncommon',
            3: 'rare',
            4: 'epic',
            5: 'legendary'
        };

        const stats = [];
        if (item.damage) stats.push({ label: 'Dano', value: item.damage });
        if (item.defense) stats.push({ label: 'Defesa', value: item.defense });
        if (item.health) stats.push({ label: 'Vida', value: item.health });
        if (item.mana) stats.push({ label: 'Mana', value: item.mana });

        this.attach(element, {
            title: item.name,
            description: item.description || '',
            icon: item.icon || '📦',
            rarity: rarityMap[item.rarity] || 'common',
            itemLevel: item.level,
            itemType: item.type,
            stats: stats
        });
    }

    // Skill tooltip helper
    showSkill(element, skill) {
        this.attach(element, {
            title: skill.name,
            description: skill.description,
            icon: skill.icon || '⚡',
            shortcut: skill.shortcut || '',
            stats: [
                { label: 'Custo de Mana', value: -skill.manaCost },
                { label: 'Dano', value: skill.damage },
                { label: 'Cooldown', value: -skill.cooldown + 's' }
            ]
        });
    }

    // Update config
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };

        // Update tooltip transition
        if (this.tooltip) {
            this.tooltip.style.transition = `opacity ${this.config.fadeDuration}ms ease`;
        }

        // Update styles
        const styleEl = document.getElementById('tooltip-manager-styles');
        if (styleEl) {
            styleEl.remove();
            this.createStyles();
        }
    }

    // Auto-attach tooltips to elements with data-tooltip attribute
    autoAttach(container = document) {
        const elements = container.querySelectorAll('[data-tooltip]');
        elements.forEach(el => {
            if (!el.classList.contains('tooltip-attached')) {
                const tooltipId = el.dataset.tooltip;
                if (tooltipId) {
                    this.attach(el, tooltipId);
                }
            }
        });
    }

    // Destroy tooltip manager
    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }

        const styleEl = document.getElementById('tooltip-manager-styles');
        if (styleEl) {
            styleEl.remove();
        }

        this.initialized = false;
    }
}

window.TooltipManager = TooltipManager;
