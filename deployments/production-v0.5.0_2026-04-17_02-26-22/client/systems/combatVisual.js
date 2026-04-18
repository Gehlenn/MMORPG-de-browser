/**
 * Combat Visual System - Client-side Combat Effects and Animations
 * Handles damage numbers, combat animations, and visual feedback
 * Version 0.3 - First Playable Gameplay Loop
 */

class CombatVisual {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        
        // Configuration
        this.config = {
            // Damage numbers
            damageNumberLifetime: 2000, // ms
            damageNumberSpeed: 50, // pixels per second
            damageNumberColors: {
                physical: '#ffffff',
                magical: '#00ffff',
                fire: '#ff6600',
                ice: '#00ccff',
                poison: '#00ff00',
                shadow: '#9933ff',
                holy: '#ffcc00',
                critical: '#ff0000',
                heal: '#00ff00',
                miss: '#888888'
            },
            
            // Combat animations
            attackAnimationDuration: 300, // ms
            hitAnimationDuration: 200, // ms
            deathAnimationDuration: 1000, // ms
            
            // Visual effects
            particleCount: 10,
            particleLifetime: 1000, // ms
            screenShakeIntensity: 5,
            screenShakeDuration: 200, // ms
            
            // Floating text
            floatingTextSpeed: 30, // pixels per second
            floatingTextFadeTime: 500, // ms
            
            // Combat log
            maxCombatLogEntries: 50,
            combatLogFadeTime: 5000 // ms
        };
        
        // Active visual elements
        this.damageNumbers = [];
        this.particles = [];
        this.combatAnimations = new Map(); // entityId -> Animation
        this.floatingTexts = [];
        
        // Screen shake
        this.screenShake = {
            active: false,
            intensity: 0,
            duration: 0,
            offsetX: 0,
            offsetY: 0
        };
        
        // Combat log
        this.combatLog = [];
        this.combatLogVisible = true;
        
        // Performance optimization
        this.lastFrameTime = 0;
        this.maxFPS = 60;
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Setup event listeners
        this.setupEventListeners();
        
        // Create combat log UI
        this.createCombatLogUI();
        
        // Start animation loop
        this.startAnimationLoop();
        
        console.log('Combat Visual System initialized');
    }
    
    setupEventListeners() {
        // Listen to combat events from server
        this.game.socket.on('damage_dealt', (data) => {
            this.onDamageDealt(data);
        });
        
        this.game.socket.on('healing_done', (data) => {
            this.onHealingDone(data);
        });
        
        this.game.socket.on('status_effect_applied', (data) => {
            this.onStatusEffectApplied(data);
        });
        
        this.game.socket.on('mob_death', (data) => {
            this.onMobDeath(data);
        });
        
        this.game.socket.on('combat_log', (data) => {
            this.onCombatLog(data);
        });
        
        this.game.socket.on('attack_animation', (data) => {
            this.onAttackAnimation(data);
        });
        
        // Listen to local events
        this.game.on('playerAttack', (data) => {
            this.onPlayerAttack(data);
        });
        
        this.game.on('playerHit', (data) => {
            this.onPlayerHit(data);
        });
    }
    
    createCombatLogUI() {
        // Create combat log container
        const logContainer = document.createElement('div');
        logContainer.id = 'combat-log';
        logContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            max-height: 200px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #444;
            border-radius: 5px;
            padding: 10px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 12px;
            color: #fff;
            overflow-y: auto;
            z-index: 1000;
            display: block;
        `;
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Combat Log';
        toggleButton.style.cssText = `
            position: fixed;
            bottom: 220px;
            right: 20px;
            padding: 5px 10px;
            background: #333;
            color: #fff;
            border: 1px solid #555;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            z-index: 1001;
        `;
        
        toggleButton.addEventListener('click', () => {
            this.combatLogVisible = !this.combatLogVisible;
            logContainer.style.display = this.combatLogVisible ? 'block' : 'none';
            toggleButton.textContent = this.combatLogVisible ? 'Hide Log' : 'Show Log';
        });
        
        document.body.appendChild(logContainer);
        document.body.appendChild(toggleButton);
        
        this.combatLogElement = logContainer;
    }
    
    startAnimationLoop() {
        const animate = (currentTime) => {
            // Limit FPS
            const deltaTime = currentTime - this.lastFrameTime;
            const targetFrameTime = 1000 / this.maxFPS;
            
            if (deltaTime >= targetFrameTime) {
                this.update(deltaTime);
                this.render();
                this.lastFrameTime = currentTime;
            }
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    // Event handlers
    onDamageDealt(data) {
        const { attackerId, targetId, damage, damageType, isCritical, isMiss } = data;
        
        // Show damage number
        if (!isMiss) {
            this.showDamageNumber(targetId, damage, damageType, isCritical);
        } else {
            this.showMissNumber(targetId);
        }
        
        // Add to combat log
        const attackerName = this.getEntityName(attackerId);
        const targetName = this.getEntityName(targetId);
        
        if (isMiss) {
            this.addCombatLogEntry(`${attackerName} missed ${targetName}!`, '#888888');
        } else if (isCritical) {
            this.addCombatLogEntry(`${attackerName} critically hit ${targetName} for ${damage} ${damageType} damage!`, '#ff0000');
        } else {
            this.addCombatLogEntry(`${attackerName} hit ${targetName} for ${damage} ${damageType} damage`, this.config.damageNumberColors[damageType] || '#ffffff');
        }
        
        // Create hit animation
        this.createHitAnimation(targetId, damageType);
        
        // Screen shake for critical hits
        if (isCritical) {
            this.startScreenShake(this.config.screenShakeIntensity * 1.5);
        }
        
        // Create particles
        this.createDamageParticles(targetId, damageType, isCritical);
    }
    
    onHealingDone(data) {
        const { healerId, targetId, healing } = data;
        
        // Show heal number
        this.showHealNumber(targetId, healing);
        
        // Add to combat log
        const healerName = this.getEntityName(healerId);
        const targetName = this.getEntityName(targetId);
        this.addCombatLogEntry(`${healerName} healed ${targetName} for ${healing} HP`, '#00ff00');
        
        // Create heal effect
        this.createHealEffect(targetId);
    }
    
    onStatusEffectApplied(data) {
        const { casterId, targetId, effectId, effectName } = data;
        
        // Add to combat log
        const casterName = this.getEntityName(casterId);
        const targetName = this.getEntityName(targetId);
        this.addCombatLogEntry(`${casterName} applied ${effectName} to ${targetName}`, '#9933ff');
        
        // Create status effect visual
        this.createStatusEffectVisual(targetId, effectId);
    }
    
    onMobDeath(data) {
        const { mobId, killerId, loot, experience } = data;
        
        // Create death animation
        this.createDeathAnimation(mobId);
        
        // Add to combat log
        const killerName = this.getEntityName(killerId);
        const mobName = this.getEntityName(mobId);
        this.addCombatLogEntry(`${killerName} killed ${mobName}! (+${experience} XP)`, '#ffff00');
        
        // Show experience gain
        if (killerId === this.game.player.id) {
            this.showExperienceGain(experience);
        }
        
        // Show loot notification
        if (loot && loot.length > 0) {
            this.showLootNotification(loot);
        }
    }
    
    onCombatLog(data) {
        this.addCombatLogEntry(data.message, data.color || '#ffffff');
    }
    
    onAttackAnimation(data) {
        const { attackerId, targetId, attackType } = data;
        this.createAttackAnimation(attackerId, targetId, attackType);
    }
    
    onPlayerAttack(data) {
        const { targetId, skill } = data;
        this.createPlayerAttackAnimation(targetId, skill);
    }
    
    onPlayerHit(data) {
        const { damage, damageType } = data;
        this.createPlayerHitEffect(damage, damageType);
    }
    
    // Damage numbers
    showDamageNumber(targetId, damage, damageType, isCritical) {
        const target = this.getEntityById(targetId);
        if (!target) return;
        
        const color = this.config.damageNumberColors[damageType] || '#ffffff';
        const size = isCritical ? 24 : 18;
        const yOffset = isCritical ? -20 : 0;
        
        this.damageNumbers.push({
            x: target.x,
            y: target.y + yOffset,
            text: isCritical ? `${damage}!` : damage.toString(),
            color: color,
            size: size,
            lifetime: this.config.damageNumberLifetime,
            age: 0,
            velocity: {
                x: (Math.random() - 0.5) * 20,
                y: -this.config.damageNumberSpeed
            },
            isCritical: isCritical
        });
    }
    
    showMissNumber(targetId) {
        const target = this.getEntityById(targetId);
        if (!target) return;
        
        this.damageNumbers.push({
            x: target.x,
            y: target.y,
            text: 'MISS',
            color: this.config.damageNumberColors.miss,
            size: 16,
            lifetime: this.config.damageNumberLifetime,
            age: 0,
            velocity: {
                x: (Math.random() - 0.5) * 10,
                y: -this.config.damageNumberSpeed * 0.5
            },
            isCritical: false
        });
    }
    
    showHealNumber(targetId, healing) {
        const target = this.getEntityById(targetId);
        if (!target) return;
        
        this.damageNumbers.push({
            x: target.x,
            y: target.y,
            text: `+${healing}`,
            color: this.config.damageNumberColors.heal,
            size: 20,
            lifetime: this.config.damageNumberLifetime,
            age: 0,
            velocity: {
                x: (Math.random() - 0.5) * 15,
                y: -this.config.damageNumberSpeed * 0.8
            },
            isCritical: false
        });
    }
    
    showExperienceGain(experience) {
        const player = this.game.player;
        
        this.floatingTexts.push({
            x: player.x,
            y: player.y - 30,
            text: `+${experience} XP`,
            color: '#ffff00',
            size: 16,
            lifetime: 3000,
            age: 0,
            velocity: {
                x: 0,
                y: -this.config.floatingTextSpeed
            }
        });
    }
    
    showLootNotification(loot) {
        const lootText = loot.map(item => `${item.quantity}x ${item.name}`).join(', ');
        
        this.floatingTexts.push({
            x: this.game.canvas.width / 2,
            y: 100,
            text: `Loot: ${lootText}`,
            color: '#00ff00',
            size: 14,
            lifetime: 4000,
            age: 0,
            velocity: {
                x: 0,
                y: -this.config.floatingTextSpeed * 0.5
            },
            centered: true
        });
    }
    
    // Animations
    createAttackAnimation(attackerId, targetId, attackType) {
        const attacker = this.getEntityById(attackerId);
        const target = this.getEntityById(targetId);
        
        if (!attacker || !target) return;
        
        this.combatAnimations.set(attackerId, {
            type: 'attack',
            startTime: Date.now(),
            duration: this.config.attackAnimationDuration,
            startPos: { x: attacker.x, y: attacker.y },
            targetPos: { x: target.x, y: target.y },
            attackType: attackType
        });
    }
    
    createHitAnimation(targetId, damageType) {
        const target = this.getEntityById(targetId);
        if (!target) return;
        
        this.combatAnimations.set(`${targetId}_hit`, {
            type: 'hit',
            startTime: Date.now(),
            duration: this.config.hitAnimationDuration,
            targetId: targetId,
            damageType: damageType
        });
    }
    
    createDeathAnimation(mobId) {
        const mob = this.getEntityById(mobId);
        if (!mob) return;
        
        this.combatAnimations.set(mobId, {
            type: 'death',
            startTime: Date.now(),
            duration: this.config.deathAnimationDuration,
            targetId: mobId,
            startPos: { x: mob.x, y: mob.y }
        });
    }
    
    createPlayerAttackAnimation(targetId, skill) {
        const target = this.getEntityById(targetId);
        const player = this.game.player;
        
        if (!target || !player) return;
        
        // Create projectile animation for ranged attacks
        if (skill === 'ranged_attack' || skill === 'fireball') {
            this.createProjectile(player.x, player.y, target.x, target.y, skill);
        } else {
            // Create melee attack animation
            this.createMeleeSwing(player.x, player.y, target.x, target.y);
        }
    }
    
    createPlayerHitEffect(damage, damageType) {
        // Screen shake for player taking damage
        this.startScreenShake(this.config.screenShakeIntensity);
        
        // Red flash effect
        this.createScreenFlash('#ff0000', 100);
    }
    
    createProjectile(startX, startY, endX, endY, type) {
        const projectile = {
            type: 'projectile',
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            currentX: startX,
            currentY: startY,
            speed: 300, // pixels per second
            type: type,
            startTime: Date.now(),
            lifetime: 2000
        };
        
        this.particles.push(projectile);
    }
    
    createMeleeSwing(startX, startY, endX, endY) {
        const swing = {
            type: 'melee_swing',
            x: startX,
            y: startY,
            targetX: endX,
            targetY: endY,
            angle: 0,
            maxAngle: Math.PI / 4,
            startTime: Date.now(),
            duration: 200
        };
        
        this.particles.push(swing);
    }
    
    // Visual effects
    createDamageParticles(targetId, damageType, isCritical) {
        const target = this.getEntityById(targetId);
        if (!target) return;
        
        const particleCount = isCritical ? this.config.particleCount * 2 : this.config.particleCount;
        const color = this.config.damageNumberColors[damageType] || '#ffffff';
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 50 + Math.random() * 100;
            
            this.particles.push({
                type: 'damage_particle',
                x: target.x,
                y: target.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: isCritical ? 4 : 2,
                lifetime: this.config.particleLifetime,
                age: 0
            });
        }
    }
    
    createHealEffect(targetId) {
        const target = this.getEntityById(targetId);
        if (!target) return;
        
        // Create healing particles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            
            this.particles.push({
                type: 'heal_particle',
                x: target.x + Math.cos(angle) * 20,
                y: target.y + Math.sin(angle) * 20,
                targetX: target.x,
                targetY: target.y,
                speed: 100,
                color: '#00ff00',
                size: 3,
                lifetime: 1000,
                age: 0
            });
        }
    }
    
    createStatusEffectVisual(targetId, effectId) {
        const target = this.getEntityById(targetId);
        if (!target) return;
        
        // Create status effect icon above target
        this.particles.push({
            type: 'status_icon',
            targetId: targetId,
            x: target.x,
            y: target.y - 30,
            effectId: effectId,
            lifetime: 5000,
            age: 0
        });
    }
    
    startScreenShake(intensity) {
        this.screenShake.active = true;
        this.screenShake.intensity = intensity;
        this.screenShake.duration = this.config.screenShakeDuration;
        this.screenShake.offsetX = 0;
        this.screenShake.offsetY = 0;
    }
    
    createScreenFlash(color, duration) {
        this.particles.push({
            type: 'screen_flash',
            color: color,
            lifetime: duration,
            age: 0
        });
    }
    
    // Combat log
    addCombatLogEntry(message, color = '#ffffff') {
        const entry = {
            message: message,
            color: color,
            timestamp: Date.now()
        };
        
        this.combatLog.unshift(entry);
        
        // Limit log size
        if (this.combatLog.length > this.config.maxCombatLogEntries) {
            this.combatLog.pop();
        }
        
        // Update UI
        this.updateCombatLogUI();
    }
    
    updateCombatLogUI() {
        if (!this.combatLogElement) return;
        
        const logHTML = this.combatLog.map(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            return `<div style="color: ${entry.color}; margin-bottom: 2px;">[${time}] ${entry.message}</div>`;
        }).join('');
        
        this.combatLogElement.innerHTML = logHTML;
        
        // Auto-scroll to top
        this.combatLogElement.scrollTop = 0;
    }
    
    // Update and render
    update(deltaTime) {
        // Update damage numbers
        this.updateDamageNumbers(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update animations
        this.updateAnimations(deltaTime);
        
        // Update floating text
        this.updateFloatingText(deltaTime);
        
        // Update screen shake
        this.updateScreenShake(deltaTime);
        
        // Clean up old elements
        this.cleanupOldElements();
    }
    
    updateDamageNumbers(deltaTime) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const damage = this.damageNumbers[i];
            damage.age += deltaTime;
            
            // Update position
            damage.x += damage.velocity.x * (deltaTime / 1000);
            damage.y += damage.velocity.y * (deltaTime / 1000);
            
            // Apply gravity
            damage.velocity.y += 100 * (deltaTime / 1000);
            
            // Remove if expired
            if (damage.age >= damage.lifetime) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.age += deltaTime;
            
            switch (particle.type) {
                case 'damage_particle':
                    particle.x += particle.vx * (deltaTime / 1000);
                    particle.y += particle.vy * (deltaTime / 1000);
                    particle.vy += 200 * (deltaTime / 1000); // gravity
                    break;
                    
                case 'heal_particle':
                    const dx = particle.targetX - particle.x;
                    const dy = particle.targetY - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 5) {
                        particle.x += (dx / distance) * particle.speed * (deltaTime / 1000);
                        particle.y += (dy / distance) * particle.speed * (deltaTime / 1000);
                    }
                    break;
                    
                case 'projectile':
                    const projDx = particle.endX - particle.startX;
                    const projDy = particle.endY - particle.startY;
                    const projDistance = Math.sqrt(projDx * projDx + projDy * projDy);
                    const progress = (particle.age / particle.lifetime);
                    
                    particle.currentX = particle.startX + projDx * progress;
                    particle.currentY = particle.startY + projDy * progress;
                    break;
                    
                case 'melee_swing':
                    const swingProgress = particle.age / particle.duration;
                    particle.angle = particle.maxAngle * Math.sin(swingProgress * Math.PI);
                    break;
            }
            
            // Remove if expired
            if (particle.age >= particle.lifetime) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateAnimations(deltaTime) {
        const now = Date.now();
        
        for (const [id, animation] of this.combatAnimations) {
            const progress = (now - animation.startTime) / animation.duration;
            
            if (progress >= 1) {
                this.combatAnimations.delete(id);
            }
        }
    }
    
    updateFloatingText(deltaTime) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            text.age += deltaTime;
            
            // Update position
            text.x += text.velocity.x * (deltaTime / 1000);
            text.y += text.velocity.y * (deltaTime / 1000);
            
            // Remove if expired
            if (text.age >= text.lifetime) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }
    
    updateScreenShake(deltaTime) {
        if (this.screenShake.active) {
            this.screenShake.duration -= deltaTime;
            
            if (this.screenShake.duration <= 0) {
                this.screenShake.active = false;
                this.screenShake.offsetX = 0;
                this.screenShake.offsetY = 0;
            } else {
                // Random shake
                this.screenShake.offsetX = (Math.random() - 0.5) * this.screenShake.intensity;
                this.screenShake.offsetY = (Math.random() - 0.5) * this.screenShake.intensity;
            }
        }
    }
    
    cleanupOldElements() {
        // Remove old combat log entries
        const now = Date.now();
        this.combatLog = this.combatLog.filter(entry => 
            now - entry.timestamp < this.config.combatLogFadeTime
        );
    }
    
    render() {
        // Save context state
        this.ctx.save();
        
        // Apply screen shake
        if (this.screenShake.active) {
            this.ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);
        }
        
        // Render particles (bottom layer)
        this.renderParticles();
        
        // Render damage numbers
        this.renderDamageNumbers();
        
        // Render floating text
        this.renderFloatingText();
        
        // Render screen flash
        this.renderScreenFlash();
        
        // Restore context state
        this.ctx.restore();
    }
    
    renderDamageNumbers() {
        for (const damage of this.damageNumbers) {
            const opacity = Math.max(0, 1 - (damage.age / damage.lifetime));
            const scale = damage.isCritical ? 1.2 : 1.0;
            
            this.ctx.save();
            this.ctx.globalAlpha = opacity;
            this.ctx.font = `bold ${damage.size * scale}px Arial`;
            this.ctx.fillStyle = damage.color;
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Draw shadow
            this.ctx.strokeText(damage.text, damage.x, damage.y);
            
            // Draw text
            this.ctx.fillText(damage.text, damage.x, damage.y);
            
            this.ctx.restore();
        }
    }
    
    renderParticles() {
        for (const particle of this.particles) {
            switch (particle.type) {
                case 'damage_particle':
                    this.renderDamageParticle(particle);
                    break;
                case 'heal_particle':
                    this.renderHealParticle(particle);
                    break;
                case 'projectile':
                    this.renderProjectile(particle);
                    break;
                case 'melee_swing':
                    this.renderMeleeSwing(particle);
                    break;
                case 'status_icon':
                    this.renderStatusIcon(particle);
                    break;
            }
        }
    }
    
    renderDamageParticle(particle) {
        const opacity = Math.max(0, 1 - (particle.age / particle.lifetime));
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    renderHealParticle(particle) {
        const opacity = Math.max(0, 1 - (particle.age / particle.lifetime));
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = particle.color;
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;
        
        // Draw cross
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x - 3, particle.y);
        this.ctx.lineTo(particle.x + 3, particle.y);
        this.ctx.moveTo(particle.x, particle.y - 3);
        this.ctx.lineTo(particle.x, particle.y + 3);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    renderProjectile(particle) {
        this.ctx.save();
        this.ctx.fillStyle = particle.type === 'fireball' ? '#ff6600' : '#00ffff';
        this.ctx.shadowColor = particle.type === 'fireball' ? '#ff6600' : '#00ffff';
        this.ctx.shadowBlur = 10;
        
        this.ctx.beginPath();
        this.ctx.arc(particle.currentX, particle.currentY, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    renderMeleeSwing(particle) {
        this.ctx.save();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.angle);
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(30, 0);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    renderStatusIcon(particle) {
        const opacity = Math.max(0, 1 - (particle.age / particle.lifetime));
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = '#9933ff';
        this.ctx.fillRect(particle.x - 8, particle.y - 8, 16, 16);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('S', particle.x, particle.y);
        
        this.ctx.restore();
    }
    
    renderFloatingText() {
        for (const text of this.floatingTexts) {
            const opacity = Math.max(0, 1 - (text.age / text.lifetime));
            
            this.ctx.save();
            this.ctx.globalAlpha = opacity;
            this.ctx.font = `${text.size}px Arial`;
            this.ctx.fillStyle = text.color;
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            
            if (text.centered) {
                this.ctx.textAlign = 'center';
                this.ctx.fillText(text.text, text.x, text.y);
            } else {
                this.ctx.fillText(text.text, text.x, text.y);
            }
            
            this.ctx.restore();
        }
    }
    
    renderScreenFlash() {
        const flash = this.particles.find(p => p.type === 'screen_flash');
        if (!flash) return;
        
        const opacity = Math.max(0, 1 - (flash.age / flash.lifetime));
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity * 0.3;
        this.ctx.fillStyle = flash.color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    // Utility methods
    getEntityById(entityId) {
        // Check if it's the player
        if (entityId === this.game.player.id) {
            return this.game.player;
        }
        
        // Check other players
        if (this.game.otherPlayers && this.game.otherPlayers.has(entityId)) {
            return this.game.otherPlayers.get(entityId);
        }
        
        // Check mobs
        if (this.game.mobs && this.game.mobs.has(entityId)) {
            return this.game.mobs.get(entityId);
        }
        
        return null;
    }
    
    getEntityName(entityId) {
        const entity = this.getEntityById(entityId);
        return entity ? entity.name : `Unknown(${entityId})`;
    }
    
    // Public API
    clearAllEffects() {
        this.damageNumbers = [];
        this.particles = [];
        this.combatAnimations.clear();
        this.floatingTexts = [];
        this.screenShake.active = false;
    }
    
    setCombatLogVisible(visible) {
        this.combatLogVisible = visible;
        if (this.combatLogElement) {
            this.combatLogElement.style.display = visible ? 'block' : 'none';
        }
    }
    
    getStatistics() {
        return {
            activeDamageNumbers: this.damageNumbers.length,
            activeParticles: this.particles.length,
            activeAnimations: this.combatAnimations.size,
            combatLogEntries: this.combatLog.length
        };
    }
}

export default CombatVisual;
