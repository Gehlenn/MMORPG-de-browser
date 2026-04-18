/**
 * Camera System
 * Handles viewport, following, and camera effects
 */

import { TILE_SIZE, GRID_W, GRID_H } from '../world/TileMap.js';

class Camera {
    constructor(viewportWidth, viewportHeight) {
        this.x = 0;
        this.y = 0;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        
        // Following settings
        this.target = null;
        this.followSpeed = 0.1;
        this.smoothing = true;
        
        // Bounds
        this.worldWidth = GRID_W * TILE_SIZE;
        this.worldHeight = GRID_H * TILE_SIZE;
        
        // Zoom
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 2.0;
        this.zoomSpeed = 0.1;
        
        // Effects
        this.shake = { x: 0, y: 0, duration: 0, intensity: 0 };
        this.fade = { alpha: 0, color: '#000000', duration: 0, active: false };
        
        // Constraints
        this.constrainToWorld = true;
        this.followPadding = { x: 100, y: 100 };
        
        // Parallax layers
        this.parallaxLayers = [];
    }
    
    updateViewport(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
        this.constrainPosition();
    }
    
    update(deltaTime) {
        // Update following
        if (this.target) {
            this.updateFollowing(deltaTime);
        }
        
        // Update effects
        this.updateEffects(deltaTime);
        
        // Constrain to world bounds
        if (this.constrainToWorld) {
            this.constrainPosition();
        }
    }
    
    updateFollowing(deltaTime) {
        if (!this.target) return;
        
        // Calculate target position (center of viewport on target)
        const targetX = this.target.x * TILE_SIZE - this.viewportWidth / 2;
        const targetY = this.target.y * TILE_SIZE - this.viewportHeight / 2;
        
        if (this.smoothing) {
            // Smooth following
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            
            this.x += dx * this.followSpeed;
            this.y += dy * this.followSpeed;
        } else {
            // Instant following
            this.x = targetX;
            this.y = targetY;
        }
    }
    
    updateEffects(deltaTime) {
        // Update screen shake
        if (this.shake.duration > 0) {
            this.shake.duration -= deltaTime;
            if (this.shake.duration <= 0) {
                this.shake.x = 0;
                this.shake.y = 0;
                this.shake.intensity = 0;
            } else {
                const progress = this.shake.duration / 1000; // Convert to seconds
                this.shake.x = (Math.random() - 0.5) * this.shake.intensity * progress;
                this.shake.y = (Math.random() - 0.5) * this.shake.intensity * progress;
            }
        }
        
        // Update fade effect
        if (this.fade.active && this.fade.duration > 0) {
            this.fade.duration -= deltaTime;
            if (this.fade.duration <= 0) {
                this.fade.active = false;
                this.fade.alpha = 0;
            }
        }
    }
    
    constrainPosition() {
        // Calculate effective viewport size with zoom
        const effectiveWidth = this.viewportWidth / this.zoom;
        const effectiveHeight = this.viewportHeight / this.zoom;
        
        // Constrain X
        if (this.worldWidth > effectiveWidth) {
            this.x = Math.max(0, Math.min(this.x, this.worldWidth - effectiveWidth));
        } else {
            // World smaller than viewport, center it
            this.x = (this.worldWidth - effectiveWidth) / 2;
        }
        
        // Constrain Y
        if (this.worldHeight > effectiveHeight) {
            this.y = Math.max(0, Math.min(this.y, this.worldHeight - effectiveHeight));
        } else {
            // World smaller than viewport, center it
            this.y = (this.worldHeight - effectiveHeight) / 2;
        }
    }
    
    follow(target, options = {}) {
        this.target = target;
        this.followSpeed = options.speed || this.followSpeed;
        this.smoothing = options.smoothing !== false;
        this.followPadding = options.padding || this.followPadding;
    }
    
    stopFollowing() {
        this.target = null;
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.constrainPosition();
    }
    
    moveBy(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.constrainPosition();
    }
    
    setZoom(zoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        this.constrainPosition();
    }
    
    zoomBy(delta) {
        this.setZoom(this.zoom + delta * this.zoomSpeed);
    }
    
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x + this.shake.x) * this.zoom,
            y: (worldY - this.y + this.shake.y) * this.zoom
        };
    }
    
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX / this.zoom) + this.x - this.shake.x,
            y: (screenY / this.zoom) + this.y - this.shake.y
        };
    }
    
    getVisibleBounds() {
        return {
            left: this.x,
            top: this.y,
            right: this.x + this.viewportWidth / this.zoom,
            bottom: this.y + this.viewportHeight / this.zoom
        };
    }
    
    isVisible(worldX, worldY, width = TILE_SIZE, height = TILE_SIZE) {
        const bounds = this.getVisibleBounds();
        return worldX + width >= bounds.left &&
               worldX <= bounds.right &&
               worldY + height >= bounds.top &&
               worldY <= bounds.bottom;
    }
    
    // Camera effects
    shake(intensity, duration = 500) {
        this.shake.intensity = intensity;
        this.shake.duration = duration;
        this.shake.x = 0;
        this.shake.y = 0;
    }
    
    fadeIn(color = '#000000', duration = 1000) {
        this.fade.color = color;
        this.fade.duration = duration;
        this.fade.alpha = 1.0;
        this.fade.active = true;
    }
    
    fadeOut(color = '#000000', duration = 1000) {
        this.fade.color = color;
        this.fade.duration = duration;
        this.fade.alpha = 0.0;
        this.fade.active = true;
        
        // Fade out means going from 0 to 1 alpha
        const fadeIn = () => {
            this.fade.alpha += 1 / (duration / 16); // Assuming 60 FPS
            if (this.fade.alpha < 1.0) {
                requestAnimationFrame(fadeIn);
            }
        };
        fadeIn();
    }
    
    flash(color = '#ffffff', duration = 200) {
        this.fade.color = color;
        this.fade.duration = duration;
        this.fade.alpha = 0.8;
        this.fade.active = true;
    }
    
    // Parallax support
    addParallaxLayer(layer) {
        this.parallaxLayers.push(layer);
    }
    
    removeParallaxLayer(layerId) {
        const index = this.parallaxLayers.findIndex(l => l.id === layerId);
        if (index > -1) {
            this.parallaxLayers.splice(index, 1);
        }
    }
    
    getParallaxOffset(layer) {
        const parallaxFactor = layer.parallaxFactor || 1.0;
        return {
            x: this.x * parallaxFactor,
            y: this.y * parallaxFactor
        };
    }
    
    // Utility methods
    centerOn(x, y) {
        this.x = x * TILE_SIZE - this.viewportWidth / 2;
        this.y = y * TILE_SIZE - this.viewportHeight / 2;
        this.constrainPosition();
    }
    
    lookAt(entity) {
        this.centerOn(entity.x, entity.y);
    }
    
    panTo(x, y, duration = 1000) {
        const startX = this.x;
        const startY = this.y;
        const targetX = x * TILE_SIZE - this.viewportWidth / 2;
        const targetY = y * TILE_SIZE - this.viewportHeight / 2;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1.0);
            const eased = this.easeInOutCubic(progress);
            
            this.x = startX + (targetX - startX) * eased;
            this.y = startY + (targetY - startY) * eased;
            
            if (progress < 1.0) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Getters
    getPosition() {
        return { x: this.x, y: this.y };
    }
    
    getZoom() {
        return this.zoom;
    }
    
    getTarget() {
        return this.target;
    }
    
    isShaking() {
        return this.shake.duration > 0;
    }
    
    isFading() {
        return this.fade.active;
    }
    
    // Configuration
    setWorldSize(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
        this.constrainPosition();
    }
    
    setFollowSpeed(speed) {
        this.followSpeed = Math.max(0.01, Math.min(1.0, speed));
    }
    
    setZoomLimits(min, max) {
        this.minZoom = Math.max(0.1, min);
        this.maxZoom = Math.max(this.minZoom, max);
        this.setZoom(this.zoom);
    }
    
    enableConstraints(enabled) {
        this.constrainToWorld = enabled;
        if (enabled) {
            this.constrainPosition();
        }
    }
    
    // Debug methods
    getDebugInfo() {
        return {
            position: { x: Math.round(this.x), y: Math.round(this.y) },
            zoom: this.zoom,
            target: this.target ? `${this.target.x}, ${this.target.y}` : null,
            shaking: this.isShaking(),
            fading: this.isFading(),
            viewport: { width: this.viewportWidth, height: this.viewportHeight },
            world: { width: this.worldWidth, height: this.worldHeight }
        };
    }
}

export default Camera;
