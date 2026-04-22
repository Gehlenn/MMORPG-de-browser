/**
 * ResponsiveManager - Sistema de Responsividade
 *
 * Responsabilidades:
 * - Detectar tamanho da tela e orientação
 * - Adaptar painéis para mobile/desktop
 * - Reposicionar elementos dinamicamente
 * - Touch gestures para mobile
 * - Breakpoints personalizáveis
 */

class ResponsiveManager {
    constructor() {
        this.breakpoints = {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            wide: 1440
        };

        this.currentBreakpoint = 'desktop';
        this.isTouch = false;
        this.orientation = 'landscape';
        this.initialized = false;

        // Callbacks
        this.onResize = null;
        this.onOrientationChange = null;
        this.onBreakpointChange = null;
    }

    init() {
        if (this.initialized) return;

        this.detectTouch();
        this.checkBreakpoint();
        this.checkOrientation();
        this.createStyles();
        this.bindEvents();

        this.initialized = true;
        console.log('📱 ResponsiveManager inicializado');
        console.log('   - Breakpoint:', this.currentBreakpoint);
        console.log('   - Touch:', this.isTouch);
        console.log('   - Orientação:', this.orientation);
    }

    detectTouch() {
        this.isTouch = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0;

        if (this.isTouch) {
            document.body.classList.add('touch-device');
        } else {
            document.body.classList.add('mouse-device');
        }
    }

    checkBreakpoint() {
        const width = window.innerWidth;
        let newBreakpoint = 'mobile';

        if (width >= this.breakpoints.wide) {
            newBreakpoint = 'wide';
        } else if (width >= this.breakpoints.desktop) {
            newBreakpoint = 'desktop';
        } else if (width >= this.breakpoints.tablet) {
            newBreakpoint = 'tablet';
        }

        if (newBreakpoint !== this.currentBreakpoint) {
            const oldBreakpoint = this.currentBreakpoint;
            this.currentBreakpoint = newBreakpoint;

            // Update body class
            document.body.classList.remove('bp-mobile', 'bp-tablet', 'bp-desktop', 'bp-wide');
            document.body.classList.add(`bp-${newBreakpoint}`);

            if (this.onBreakpointChange) {
                this.onBreakpointChange(newBreakpoint, oldBreakpoint);
            }

            console.log('📱 Breakpoint mudou:', oldBreakpoint, '→', newBreakpoint);
        }

        return this.currentBreakpoint;
    }

    checkOrientation() {
        const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

        if (newOrientation !== this.orientation) {
            this.orientation = newOrientation;

            document.body.classList.remove('orientation-landscape', 'orientation-portrait');
            document.body.classList.add(`orientation-${newOrientation}`);

            if (this.onOrientationChange) {
                this.onOrientationChange(newOrientation);
            }
        }

        return this.orientation;
    }

    createStyles() {
        const styles = document.createElement('style');
        styles.id = 'responsive-manager-styles';
        styles.textContent = `
            /* Base Responsive Classes */
            .mobile-only { display: none !important; }
            .desktop-only { display: block !important; }
            .tablet-only { display: none !important; }

            /* Mobile (até 480px) */
            @media (max-width: 480px) {
                .mobile-only { display: block !important; }
                .desktop-only { display: none !important; }
                .tablet-only { display: none !important; }

                /* Painéis em tela cheia */
                .game-panel {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    max-width: none !important;
                    max-height: none !important;
                    border-radius: 0 !important;
                    z-index: 100000 !important;
                }

                /* Inventory grid compacto */
                .inventory-grid {
                    grid-template-columns: repeat(4, 1fr) !important;
                    gap: 5px !important;
                }

                /* Quest list compacta */
                .quest-item {
                    padding: 10px !important;
                }

                /* Crafting grid */
                .crafting-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                }

                /* Merchant items */
                .merchant-items {
                    grid-template-columns: repeat(2, 1fr) !important;
                }

                /* Party members */
                .party-member {
                    padding: 8px !important;
                }

                /* Guild members */
                .guild-member {
                    padding: 8px !important;
                }

                /* PvP arena list */
                .arena-item {
                    padding: 10px !important;
                }

                /* Toast notifications */
                .toast-container {
                    max-width: 100% !important;
                    padding: 10px !important;
                }

                .game-toast {
                    min-width: auto !important;
                    max-width: 100% !important;
                }

                /* HUD elements */
                .hud-container {
                    font-size: 12px !important;
                }

                .hud-bars {
                    width: 120px !important;
                }

                /* Chat */
                .chat-container {
                    width: 100% !important;
                    height: 150px !important;
                }

                /* Quick slots */
                .quick-slots {
                    transform: scale(0.8);
                    transform-origin: bottom center;
                }
            }

            /* Tablet (481px - 768px) */
            @media (min-width: 481px) and (max-width: 768px) {
                .mobile-only { display: none !important; }
                .desktop-only { display: none !important; }
                .tablet-only { display: block !important; }

                /* Painéis um pouco menores */
                .game-panel {
                    max-width: 95vw !important;
                    max-height: 90vh !important;
                }

                /* Inventory grid */
                .inventory-grid {
                    grid-template-columns: repeat(6, 1fr) !important;
                }

                /* Crafting grid */
                .crafting-grid {
                    grid-template-columns: repeat(3, 1fr) !important;
                }

                /* Merchant items */
                .merchant-items {
                    grid-template-columns: repeat(3, 1fr) !important;
                }

                /* Toast container */
                .toast-container {
                    max-width: 350px !important;
                }
            }

            /* Desktop (769px - 1024px) */
            @media (min-width: 769px) and (max-width: 1024px) {
                .game-panel {
                    max-width: 90vw !important;
                }
            }

            /* Wide (1025px+) */
            @media (min-width: 1025px) {
                .game-panel {
                    max-width: 1000px !important;
                }
            }

            /* Portrait orientation */
            @media (orientation: portrait) and (max-width: 768px) {
                .orientation-portrait .game-panel {
                    flex-direction: column !important;
                }

                .orientation-portrait .panel-sidebar {
                    width: 100% !important;
                    max-height: 150px !important;
                    overflow-x: auto !important;
                    overflow-y: hidden !important;
                    flex-direction: row !important;
                }

                .orientation-portrait .panel-content {
                    flex: 1 !important;
                }
            }

            /* Touch device optimizations */
            .touch-device .game-panel {
                /* Larger touch targets */
            }

            .touch-device .btn,
            .touch-device .setting-toggle,
            .touch-device .color-btn {
                min-height: 44px;
                min-width: 44px;
            }

            .touch-device .inventory-slot,
            .touch-device .crafting-slot,
            .touch-device .merchant-item {
                min-height: 50px;
                min-width: 50px;
            }

            .touch-device .toast-close {
                width: 44px;
                height: 44px;
            }

            /* Mouse device hover effects */
            .mouse-device .btn:hover,
            .mouse-device .inventory-slot:hover,
            .mouse-device .crafting-slot:hover {
                transform: translateY(-2px);
            }

            /* Safe areas for notched phones */
            @supports (padding-top: env(safe-area-inset-top)) {
                .game-panel {
                    padding-top: env(safe-area-inset-top);
                    padding-bottom: env(safe-area-inset-bottom);
                    padding-left: env(safe-area-inset-left);
                    padding-right: env(safe-area-inset-right);
                }
            }

            /* Hide scrollbar on mobile for panels */
            @media (max-width: 768px) {
                .game-panel::-webkit-scrollbar {
                    display: none;
                }

                .game-panel {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            }

            /* Bottom sheet style for mobile panels */
            @media (max-width: 480px) {
                .game-panel.sheet-mode {
                    top: auto !important;
                    bottom: 0 !important;
                    height: 85vh !important;
                    border-radius: 20px 20px 0 0 !important;
                    animation: slide-up-panel 0.3s ease;
                }

                @keyframes slide-up-panel {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .panel-drag-handle {
                    display: block !important;
                }
            }

            /* Floating action button for mobile */
            @media (max-width: 768px) {
                .fab-menu {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 99999;
                }

                .fab-button {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
                    border: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    font-size: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            }

            /* Virtual D-pad for mobile */
            @media (max-width: 768px) {
                .virtual-dpad {
                    position: fixed;
                    bottom: 100px;
                    left: 20px;
                    width: 120px;
                    height: 120px;
                    z-index: 99998;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: repeat(3, 1fr);
                    gap: 5px;
                }

                .virtual-dpad button {
                    background: rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 8px;
                    color: #fff;
                    font-size: 20px;
                    backdrop-filter: blur(5px);
                }

                .virtual-dpad .dpad-up { grid-column: 2; grid-row: 1; }
                .virtual-dpad .dpad-left { grid-column: 1; grid-row: 2; }
                .virtual-dpad .dpad-center { grid-column: 2; grid-row: 2; opacity: 0.3; }
                .virtual-dpad .dpad-right { grid-column: 3; grid-row: 2; }
                .virtual-dpad .dpad-down { grid-column: 2; grid-row: 3; }
            }

            /* Swipe gestures hint */
            .swipe-hint {
                display: none;
            }

            @media (max-width: 768px) {
                .swipe-hint {
                    display: flex;
                    position: fixed;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.7);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    color: rgba(255,255,255,0.7);
                    z-index: 99997;
                    gap: 5px;
                    align-items: center;
                }
            }
        `;

        if (!document.getElementById('responsive-manager-styles')) {
            document.head.appendChild(styles);
        }
    }

    bindEvents() {
        // Resize handler with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.checkBreakpoint();
                this.checkOrientation();

                if (this.onResize) {
                    this.onResize(window.innerWidth, window.innerHeight);
                }
            }, 250);
        });

        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.checkOrientation();
            }, 100);
        });
    }

    // Make a panel responsive
    makePanelResponsive(panelElement, options = {}) {
        if (!panelElement) return;

        panelElement.classList.add('game-panel');

        const defaults = {
            draggable: false,
            resizable: false,
            mobileFullScreen: true,
            sheetMode: false
        };

        const config = { ...defaults, ...options };

        // Add drag handle for mobile bottom sheets
        if (config.sheetMode && this.isTouch) {
            const dragHandle = document.createElement('div');
            dragHandle.className = 'panel-drag-handle';
            dragHandle.style.cssText = `
                display: none;
                width: 40px;
                height: 5px;
                background: rgba(255,255,255,0.3);
                border-radius: 3px;
                margin: 10px auto;
                cursor: grab;
            `;
            panelElement.insertBefore(dragHandle, panelElement.firstChild);

            // Enable sheet mode on mobile
            if (window.innerWidth <= 480) {
                panelElement.classList.add('sheet-mode');
            }
        }

        // Make draggable if needed
        if (config.draggable && !this.isTouch) {
            this.makeDraggable(panelElement);
        }
    }

    makeDraggable(element) {
        let isDragging = false;
        let currentX, currentY, initialX, initialY;
        let xOffset = 0, yOffset = 0;

        element.addEventListener('mousedown', dragStart);
        element.addEventListener('touchstart', dragStart, { passive: false });

        function dragStart(e) {
            if (e.target.closest('.panel-content') || e.target.closest('button')) return;

            initialX = e.type === 'touchstart' ? e.touches[0].clientX - xOffset : e.clientX - xOffset;
            initialY = e.type === 'touchstart' ? e.touches[0].clientY - yOffset : e.clientY - yOffset;

            if (e.target === element || e.target.closest('.panel-header')) {
                isDragging = true;
            }
        }

        document.addEventListener('mousemove', dragMove);
        document.addEventListener('touchmove', dragMove, { passive: false });
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);

        function dragMove(e) {
            if (!isDragging) return;

            e.preventDefault();

            currentX = e.type === 'touchmove' ? e.touches[0].clientX - initialX : e.clientX - initialX;
            currentY = e.type === 'touchmove' ? e.touches[0].clientY - initialY : e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, element);
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }
    }

    // Add swipe gesture support
    addSwipeGestures(element, callbacks = {}) {
        if (!this.isTouch) return;

        let startX, startY, startTime;
        let isSwiping = false;

        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
            isSwiping = true;
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = startY - currentY;

            // Prevent default scrolling for horizontal swipes
            if (Math.abs(diffX) > Math.abs(diffY)) {
                e.preventDefault();
            }
        }, { passive: false });

        element.addEventListener('touchend', (e) => {
            if (!isSwiping) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;
            const duration = Date.now() - startTime;

            // Minimum swipe distance and maximum duration
            const minDistance = 50;
            const maxDuration = 300;

            if (duration < maxDuration && Math.abs(diffX) > minDistance) {
                if (diffX > 0 && callbacks.onSwipeLeft) {
                    callbacks.onSwipeLeft();
                } else if (diffX < 0 && callbacks.onSwipeRight) {
                    callbacks.onSwipeRight();
                }
            }

            if (duration < maxDuration && Math.abs(diffY) > minDistance) {
                if (diffY > 0 && callbacks.onSwipeUp) {
                    callbacks.onSwipeUp();
                } else if (diffY < 0 && callbacks.onSwipeDown) {
                    callbacks.onSwipeDown();
                }
            }

            isSwiping = false;
        }, { passive: true });
    }

    // Add pinch-to-zoom prevention for game area
    preventZoom(element) {
        element.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        element.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
    }

    // Get current state
    getState() {
        return {
            breakpoint: this.currentBreakpoint,
            isTouch: this.isTouch,
            orientation: this.orientation,
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    // Check if current breakpoint matches
    is(breakpoint) {
        return this.currentBreakpoint === breakpoint;
    }

    // Check if mobile (tablet or smaller)
    isMobile() {
        return ['mobile', 'tablet'].includes(this.currentBreakpoint);
    }

    // Check if desktop
    isDesktop() {
        return ['desktop', 'wide'].includes(this.currentBreakpoint);
    }

    // Update breakpoints
    updateBreakpoints(breakpoints) {
        this.breakpoints = { ...this.breakpoints, ...breakpoints };
        this.checkBreakpoint();
    }
}

window.ResponsiveManager = ResponsiveManager;
