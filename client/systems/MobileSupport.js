/**
 * MobileSupport.js
 * Sistema de Suporte Mobile Completo
 * Legacy of Komodo MMORPG v0.6.0 - Nível 10
 * 
 * Features:
 * - Virtual Joystick
 * - Touch Controls
 * - Gesture Recognition
 * - Responsive HUD
 * - Mobile-Optimized Rendering
 * - Device Detection
 */

class MobileSupport {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.isMobile = this.detectMobile();
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Configurações mobile
        this.config = {
            joystickSize: 120,
            joystickDeadzone: 0.15,
            buttonSize: 60,
            hudScale: this.isMobile ? 1.3 : 1.0,
            touchSensitivity: 1.0,
            doubleTapDelay: 300,
            longPressDelay: 500,
            swipeThreshold: 50
        };
        
        // Estado dos controles
        this.joystick = {
            active: false,
            centerX: 0,
            centerY: 0,
            currentX: 0,
            currentY: 0,
            dx: 0,
            dy: 0,
            angle: 0,
            force: 0
        };
        
        // Botões virtuais
        this.buttons = {
            attack: { active: false, x: 0, y: 0, radius: 35 },
            skill1: { active: false, x: 0, y: 0, radius: 30 },
            skill2: { active: false, x: 0, y: 0, radius: 30 },
            skill3: { active: false, x: 0, y: 0, radius: 30 },
            skill4: { active: false, x: 0, y: 0, radius: 30 },
            menu: { active: false, x: 0, y: 0, radius: 25 }
        };
        
        // Gestos
        this.gestures = {
            pinchDistance: 0,
            pinchScale: 1,
            lastTapTime: 0,
            tapCount: 0,
            touchStartTime: 0,
            touchStartPos: { x: 0, y: 0 }
        };
        
        // Touch tracking
        this.touches = new Map();
        
        // Layout responsivo
        this.layout = this.calculateLayout();
        
        console.log('📱 MobileSupport initialized');
        console.log(`   Device: ${this.isMobile ? 'Mobile' : 'Desktop'}`);
        console.log(`   Touch: ${this.isTouch ? 'Yes' : 'No'}`);
        
        if (this.isTouch) {
            this.setupTouchControls();
        }
        
        this.setupResponsiveHUD();
    }

    /**
     * Detecta dispositivo mobile
     */
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Patterns de dispositivos mobile
        const mobilePatterns = [
            /Android/i,
            /webOS/i,
            /iPhone/i,
            /iPad/i,
            /iPod/i,
            /BlackBerry/i,
            /Windows Phone/i,
            /Opera Mini/i,
            /IEMobile/i,
            /Mobile/i
        ];
        
        const isMobileDevice = mobilePatterns.some(pattern => pattern.test(userAgent));
        
        // Também detecta por tamanho de tela
        const isSmallScreen = window.innerWidth < 1024;
        
        // Detecta orientation
        const isPortrait = window.innerHeight > window.innerWidth;
        
        return {
            isMobile: isMobileDevice || (isSmallScreen && this.isTouch),
            isSmallScreen,
            isPortrait,
            platform: this.detectPlatform(userAgent),
            screenSize: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    /**
     * Detecta plataforma específica
     */
    detectPlatform(userAgent) {
        if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
        if (/Android/.test(userAgent)) return 'Android';
        if (/Windows Phone/.test(userAgent)) return 'Windows Phone';
        if (/BlackBerry/.test(userAgent)) return 'BlackBerry';
        return 'Unknown';
    }

    /**
     * Calcula layout responsivo
     */
    calculateLayout() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isPortrait = height > width;
        
        // Escala baseada no tamanho da tela
        const baseScale = Math.min(width, height) / 800;
        const scale = Math.max(0.8, Math.min(1.5, baseScale));
        
        return {
            width,
            height,
            isPortrait,
            scale,
            joystick: {
                x: width * 0.15,
                y: height * 0.75,
                size: 120 * scale
            },
            buttons: {
                attack: {
                    x: width * 0.85,
                    y: height * 0.75,
                    size: 70 * scale
                },
                skills: {
                    x: width * 0.72,
                    y: height * 0.85,
                    size: 50 * scale,
                    spacing: 60 * scale
                },
                menu: {
                    x: width - 40 * scale,
                    y: 40 * scale,
                    size: 35 * scale
                }
            },
            hud: {
                scale: scale,
                padding: 15 * scale,
                fontSize: {
                    small: 10 * scale,
                    normal: 14 * scale,
                    large: 18 * scale
                }
            }
        };
    }

    /**
     * Setup controles touch
     */
    setupTouchControls() {
        const canvas = this.game.canvas;
        
        if (!canvas) {
            console.warn('Canvas not found for touch controls');
            return;
        }
        
        // Touch events
        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
        
        // Gesture events
        canvas.addEventListener('gesturestart', this.handleGestureStart.bind(this), { passive: false });
        canvas.addEventListener('gesturechange', this.handleGestureChange.bind(this), { passive: false });
        canvas.addEventListener('gestureend', this.handleGestureEnd.bind(this), { passive: false });
        
        // Prevent default touch behaviors
        document.body.addEventListener('touchmove', (e) => {
            if (e.target === canvas) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevent zoom
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        
        console.log('✅ Touch controls configured');
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        const now = Date.now();
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const x = touch.clientX;
            const y = touch.clientY;
            
            this.touches.set(touch.identifier, {
                x, y,
                startX: x,
                startY: y,
                startTime: now
            });
            
            // Check joystick zone
            const joystickDist = Math.hypot(
                x - this.layout.joystick.x,
                y - this.layout.joystick.y
            );
            
            if (joystickDist < this.layout.joystick.size && !this.joystick.active) {
                this.activateJoystick(x, y);
                continue;
            }
            
            // Check buttons
            this.checkButtonPress(x, y);
            
            // Detect double tap
            if (now - this.gestures.lastTapTime < this.config.doubleTapDelay) {
                this.gestures.tapCount++;
                if (this.gestures.tapCount === 2) {
                    this.handleDoubleTap(x, y);
                }
            } else {
                this.gestures.tapCount = 1;
            }
            
            this.gestures.lastTapTime = now;
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const tracked = this.touches.get(touch.identifier);
            
            if (!tracked) continue;
            
            tracked.x = touch.clientX;
            tracked.y = touch.clientY;
            
            // Update joystick if active
            if (this.joystick.active && 
                Math.hypot(tracked.startX - this.joystick.centerX, 
                          tracked.startY - this.joystick.centerY) < 50) {
                this.updateJoystick(touch.clientX, touch.clientY);
            }
        }
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        e.preventDefault();
        
        const now = Date.now();
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const tracked = this.touches.get(touch.identifier);
            
            if (!tracked) continue;
            
            const duration = now - tracked.startTime;
            const distance = Math.hypot(
                touch.clientX - tracked.startX,
                touch.clientY - tracked.startY
            );
            
            // Detect long press
            if (duration > this.config.longPressDelay && distance < 10) {
                this.handleLongPress(tracked.startX, tracked.startY);
            }
            
            // Detect swipe
            if (distance > this.config.swipeThreshold && duration < 500) {
                const angle = Math.atan2(
                    touch.clientY - tracked.startY,
                    touch.clientX - tracked.startX
                );
                this.handleSwipe(angle, distance);
            }
            
            // Deactivate joystick
            if (this.joystick.active && 
                Math.hypot(tracked.startX - this.joystick.centerX, 
                          tracked.startY - this.joystick.centerY) < 50) {
                this.deactivateJoystick();
            }
            
            // Release buttons
            this.releaseButtons();
            
            this.touches.delete(touch.identifier);
        }
    }

    /**
     * Activate joystick
     */
    activateJoystick(x, y) {
        this.joystick.active = true;
        this.joystick.centerX = x;
        this.joystick.centerY = y;
        this.joystick.currentX = x;
        this.joystick.currentY = y;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
        this.joystick.force = 0;
        
        console.log('🎮 Joystick activated');
    }

    /**
     * Update joystick position
     */
    updateJoystick(x, y) {
        if (!this.joystick.active) return;
        
        const maxDistance = this.layout.joystick.size / 2;
        const dx = x - this.joystick.centerX;
        const dy = y - this.joystick.centerY;
        const distance = Math.hypot(dx, dy);
        
        // Clamp to max distance
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);
        
        this.joystick.currentX = this.joystick.centerX + Math.cos(angle) * clampedDistance;
        this.joystick.currentY = this.joystick.centerY + Math.sin(angle) * clampedDistance;
        
        // Normalize values (-1 to 1)
        this.joystick.dx = (dx / maxDistance);
        this.joystick.dy = (dy / maxDistance);
        this.joystick.force = clampedDistance / maxDistance;
        this.joystick.angle = angle;
        
        // Apply deadzone
        if (this.joystick.force < this.config.joystickDeadzone) {
            this.joystick.dx = 0;
            this.joystick.dy = 0;
            this.joystick.force = 0;
        }
        
        // Send to game engine
        if (this.game && this.game.onJoystickInput) {
            this.game.onJoystickInput(this.joystick.dx, this.joystick.dy, this.joystick.force);
        }
    }

    /**
     * Deactivate joystick
     */
    deactivateJoystick() {
        this.joystick.active = false;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
        this.joystick.force = 0;
        
        if (this.game && this.game.onJoystickInput) {
            this.game.onJoystickInput(0, 0, 0);
        }
    }

    /**
     * Check button press
     */
    checkButtonPress(x, y) {
        // Attack button
        const attackDist = Math.hypot(
            x - this.layout.buttons.attack.x,
            y - this.layout.buttons.attack.y
        );
        if (attackDist < this.layout.buttons.attack.size / 2) {
            this.buttons.attack.active = true;
            this.game?.attack?.();
            return;
        }
        
        // Skill buttons
        const skills = ['skill1', 'skill2', 'skill3', 'skill4'];
        const skillX = this.layout.buttons.skills.x;
        const skillY = this.layout.buttons.skills.y;
        const spacing = this.layout.buttons.skills.spacing;
        
        for (let i = 0; i < skills.length; i++) {
            const btnX = skillX + (i * spacing);
            const dist = Math.hypot(x - btnX, y - skillY);
            
            if (dist < this.layout.buttons.skills.size / 2) {
                this.buttons[skills[i]].active = true;
                this.game?.useSkill?.(i);
                return;
            }
        }
        
        // Menu button
        const menuDist = Math.hypot(
            x - this.layout.buttons.menu.x,
            y - this.layout.buttons.menu.y
        );
        if (menuDist < this.layout.buttons.menu.size / 2) {
            this.buttons.menu.active = true;
            this.game?.toggleMenu?.();
        }
    }

    /**
     * Release all buttons
     */
    releaseButtons() {
        Object.keys(this.buttons).forEach(key => {
            this.buttons[key].active = false;
        });
    }

    /**
     * Handle gestures
     */
    handleGestureStart(e) {
        e.preventDefault();
        this.gestures.pinchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }

    handleGestureChange(e) {
        e.preventDefault();
        const distance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        
        this.gestures.pinchScale = distance / this.gestures.pinchDistance;
        
        // Apply zoom
        if (this.game && this.game.setZoom) {
            this.game.setZoom(this.gestures.pinchScale);
        }
    }

    handleGestureEnd(e) {
        e.preventDefault();
        this.gestures.pinchScale = 1;
    }

    /**
     * Handle double tap
     */
    handleDoubleTap(x, y) {
        console.log('👆 Double tap detected');
        
        // Use special ability or dash
        if (this.game && this.game.onDoubleTap) {
            this.game.onDoubleTap(x, y);
        }
    }

    /**
     * Handle long press
     */
    handleLongPress(x, y) {
        console.log('⏱️ Long press detected');
        
        // Show context menu or use charged attack
        if (this.game && this.game.onLongPress) {
            this.game.onLongPress(x, y);
        }
    }

    /**
     * Handle swipe
     */
    handleSwipe(angle, distance) {
        const degrees = (angle * 180 / Math.PI + 360) % 360;
        
        // Determine direction
        let direction;
        if (degrees >= 315 || degrees < 45) direction = 'right';
        else if (degrees >= 45 && degrees < 135) direction = 'down';
        else if (degrees >= 135 && degrees < 225) direction = 'left';
        else direction = 'up';
        
        console.log(`👋 Swipe ${direction} (${Math.round(distance)}px)`);
        
        if (this.game && this.game.onSwipe) {
            this.game.onSwipe(direction, distance);
        }
    }

    /**
     * Setup responsive HUD
     */
    setupResponsiveHUD() {
        if (!this.isMobile.isMobile) return;
        
        // Add mobile CSS
        const style = document.createElement('style');
        style.textContent = `
            .mobile-hud {
                transform-origin: top left;
                transform: scale(${this.layout.hud.scale});
            }
            
            .mobile-button {
                min-width: ${this.config.buttonSize}px;
                min-height: ${this.config.buttonSize}px;
                font-size: ${14 * this.layout.hud.scale}px;
            }
            
            .mobile-chat {
                max-height: ${150 * this.layout.hud.scale}px;
                font-size: ${12 * this.layout.hud.scale}px;
            }
            
            @media (orientation: portrait) {
                .mobile-joystick {
                    bottom: 100px;
                    left: 50px;
                }
                
                .mobile-controls {
                    bottom: 100px;
                    right: 30px;
                }
            }
            
            @media (orientation: landscape) {
                .mobile-joystick {
                    bottom: 50px;
                    left: 50px;
                }
                
                .mobile-controls {
                    bottom: 50px;
                    right: 50px;
                }
            }
        `;
        
        document.head.appendChild(style);
        
        // Add mobile classes to body
        document.body.classList.add('mobile-device');
        if (this.isMobile.isPortrait) {
            document.body.classList.add('mobile-portrait');
        } else {
            document.body.classList.add('mobile-landscape');
        }
        
        console.log('✅ Responsive HUD configured');
    }

    /**
     * Render touch controls
     */
    render(ctx) {
        if (!this.isTouch) return;
        
        // Render joystick
        this.renderJoystick(ctx);
        
        // Render buttons
        this.renderButtons(ctx);
    }

    /**
     * Render joystick
     */
    renderJoystick(ctx) {
        const { x, y, size } = this.layout.joystick;
        const radius = size / 2;
        
        // Base
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Stick
        const stickX = this.joystick.active ? this.joystick.currentX : x;
        const stickY = this.joystick.active ? this.joystick.currentY : y;
        
        ctx.beginPath();
        ctx.arc(stickX, stickY, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = this.joystick.active ? 
            'rgba(76, 175, 80, 0.8)' : 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        
        // Direction indicator
        if (this.joystick.active && this.joystick.force > 0.3) {
            const indicatorLength = radius * 0.8;
            const endX = x + Math.cos(this.joystick.angle) * indicatorLength;
            const endY = y + Math.sin(this.joystick.angle) * indicatorLength;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    /**
     * Render buttons
     */
    renderButtons(ctx) {
        // Attack button
        const attack = this.layout.buttons.attack;
        this.renderButton(ctx, attack.x, attack.y, attack.size, 
            '⚔️', this.buttons.attack.active, '#f44336');
        
        // Skill buttons
        const skills = ['skill1', 'skill2', 'skill3', 'skill4'];
        const skillLabels = ['1', '2', '3', '4'];
        const skillColors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'];
        
        for (let i = 0; i < skills.length; i++) {
            const x = this.layout.buttons.skills.x + (i * this.layout.buttons.skills.spacing);
            this.renderButton(ctx, x, this.layout.buttons.skills.y, 
                this.layout.buttons.skills.size, skillLabels[i], 
                this.buttons[skills[i]].active, skillColors[i]);
        }
        
        // Menu button
        const menu = this.layout.buttons.menu;
        this.renderButton(ctx, menu.x, menu.y, menu.size, 
            '☰', this.buttons.menu.active, '#607D8B');
    }

    /**
     * Render single button
     */
    renderButton(ctx, x, y, size, label, active, color) {
        const radius = size / 2;
        
        // Button base
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = active ? color : 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        
        // Border
        ctx.strokeStyle = active ? '#fff' : color;
        ctx.lineWidth = active ? 3 : 2;
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    }

    /**
     * Handle window resize
     */
    onResize() {
        this.layout = this.calculateLayout();
        
        // Update mobile classes
        const isPortrait = window.innerHeight > window.innerWidth;
        document.body.classList.remove('mobile-portrait', 'mobile-landscape');
        document.body.classList.add(isPortrait ? 'mobile-portrait' : 'mobile-landscape');
        
        console.log('📱 Layout recalculated:', this.layout.width, 'x', this.layout.height);
    }

    /**
     * Get input state
     */
    getInputState() {
        return {
            joystick: {
                active: this.joystick.active,
                x: this.joystick.dx,
                y: this.joystick.dy,
                force: this.joystick.force
            },
            buttons: {
                attack: this.buttons.attack.active,
                skill1: this.buttons.skill1.active,
                skill2: this.buttons.skill2.active,
                skill3: this.buttons.skill3.active,
                skill4: this.buttons.skill4.active
            },
            device: this.isMobile
        };
    }

    /**
     * Vibration feedback
     */
    vibrate(pattern = 50) {
        if (navigator.vibrate && this.isMobile.isMobile) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Stats
     */
    getStats() {
        return {
            isMobile: this.isMobile.isMobile,
            platform: this.isMobile.platform,
            isTouch: this.isTouch,
            layout: this.layout,
            joystickActive: this.joystick.active,
            touches: this.touches.size
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileSupport;
} else {
    window.MobileSupport = MobileSupport;
}
