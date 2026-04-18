/**
 * Client Combat System - Combat Logic and Input Handling
 * Handles combat input, targeting, and combat state management
 * Version 0.3.1 - First Playable Gameplay
 */

class CombatSystem {
    constructor(game) {
        this.game = game;
        
        // Combat state
        this.inCombat = false;
        this.currentTarget = null;
        this.combatTarget = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 1 second
        
        // Targeting
        this.targetRange = 100;
        this.attackRange = 50;
        
        // Combat UI
        this.combatUI = null;
        this.healthBar = null;
        this.targetFrame = null;
        
        // Input handling
        this.attackKey = 'Space';
        this.targetKey = 'Tab';
        
        // Visual effects
        this.damageNumbers = [];
        this.combatEffects = [];
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.createCombatUI();
        console.log('Client Combat System initialized');
    }
    
    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse input
        this.game.canvas.addEventListener('click', (e) => this.handleMouseClick(e));
        this.game.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Socket events
        this.game.socket.on('attackResult', (data) => this.handleAttackResult(data));
        this.game.socket.on('damageNumber', (data) => this.showDamageNumber(data));
        this.game.socket.on('mobKilled', (data) => this.handleMobKilled(data));
        this.game.socket.on('mobDeath', (data) => this.handleMobDeath(data));
        this.game.socket.on('xpGained', (data) => this.handleXPGained(data));
        this.game.socket.on('levelUp', (data) => this.handleLevelUp(data));
        this.game.socket.on('lootDropped', (data) => this.handleLootDropped(data));
    }
    
    createCombatUI() {
        // Create combat UI container
        this.combatUI = document.createElement('div');
        this.combatUI.id = 'combat-ui';
        this.combatUI.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Player health bar
        this.healthBar = document.createElement('div');
        this.healthBar.id = 'health-bar';
        this.healthBar.style.cssText = `
            margin-bottom: 10px;
        `;
        this.healthBar.innerHTML = `
            <div style="background: rgba(0,0,0,0.5); padding: 5px; border-radius: 5px;">
                <div style="color: #4CAF50;">HP: <span id="hp-text">100/100</span></div>
                <div style="width: 200px; height: 20px; background: #333; border: 2px solid #555; border-radius: 10px; margin-top: 5px;">
                    <div id="hp-fill" style="width: 100%; height: 100%; background: linear-gradient(to right, #4CAF50, #8BC34A); border-radius: 8px; transition: width 0.3s;"></div>
                </div>
            </div>
        `;
        
        // Target frame
        this.targetFrame = document.createElement('div');
        this.targetFrame.id = 'target-frame';
        this.targetFrame.style.cssText = `
            display: none;
        `;
        this.targetFrame.innerHTML = `
            <div style="background: rgba(0,0,0,0.5); padding: 5px; border-radius: 5px; border: 2px solid #ff6b6b;">
                <div style="color: #ff6b6b; font-weight: bold;" id="target-name">Target</div>
                <div style="color: #fff; font-size: 12px;">Level <span id="target-level">1</span></div>
                <div style="width: 150px; height: 15px; background: #333; border: 1px solid #555; border-radius: 5px; margin-top: 3px;">
                    <div id="target-hp-fill" style="width: 100%; height: 100%; background: linear-gradient(to right, #ff6b6b, #ff8787); border-radius: 4px; transition: width 0.3s;"></div>
                </div>
            </div>
        `;
        
        this.combatUI.appendChild(this.healthBar);
        this.combatUI.appendChild(this.targetFrame);
        document.body.appendChild(this.combatUI);
        
        // Create damage numbers container
        this.damageContainer = document.createElement('div');
        this.damageContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
        `;
        document.body.appendChild(this.damageContainer);
    }
    
    handleKeyDown(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.performAttack();
                break;
            case 'Tab':
                e.preventDefault();
                this.selectNextTarget();
                break;
        }
    }
    
    handleKeyUp(e) {
        // Handle key release if needed
    }
    
    handleMouseClick(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to world coordinates
        const worldX = this.game.camera.x + x;
        const worldY = this.game.camera.y + y;
        
        // Check if clicked on entity
        const clickedEntity = this.getEntityAtPosition(worldX, worldY);
        if (clickedEntity) {
            this.setTarget(clickedEntity);
        }
    }
    
    handleMouseMove(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to world coordinates
        const worldX = this.game.camera.x + x;
        const y = e.clientY - rect.top;
        
        // Update hover state
        this.updateHoverState(worldX, y);
    }
    
    getEntityAtPosition(x, y) {
        // Check mobs first
        for (const mob of this.game.mobs) {
            const distance = Math.sqrt(Math.pow(x - mob.x, 2) + Math.pow(y - mob.y, 2));
            if (distance < 30) { // 30 pixel hit radius
                return mob;
            }
        }
        
        // Check players
        for (const player of this.game.otherPlayers) {
            const distance = Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2));
            if (distance < 30) {
                return player;
            }
        }
        
        return null;
    }
    
    updateHoverState(x, y) {
        const hoveredEntity = this.getEntityAtPosition(x, y);
        
        // Update cursor
        if (hoveredEntity) {
            this.game.canvas.style.cursor = 'crosshair';
        } else {
            this.game.canvas.style.cursor = 'default';
        }
    }
    
    setTarget(entity) {
        this.currentTarget = entity;
        this.combatTarget = entity;
        
        if (entity) {
            this.showTargetFrame(entity);
            this.inCombat = true;
        } else {
            this.hideTargetFrame();
            this.inCombat = false;
        }
    }
    
    selectNextTarget() {
        const nearbyEntities = this.getNearbyEntities();
        
        if (nearbyEntities.length === 0) {
            this.setTarget(null);
            return;
        }
        
        let nextIndex = 0;
        
        if (this.currentTarget) {
            const currentIndex = nearbyEntities.findIndex(e => e.id === this.currentTarget.id);
            nextIndex = (currentIndex + 1) % nearbyEntities.length;
        }
        
        this.setTarget(nearbyEntities[nextIndex]);
    }
    
    getNearbyEntities() {
        const nearby = [];
        const player = this.game.player;
        
        // Check mobs
        for (const mob of this.game.mobs) {
            const distance = Math.sqrt(Math.pow(player.x - mob.x, 2) + Math.pow(player.y - mob.y, 2));
            if (distance <= this.targetRange) {
                nearby.push(mob);
            }
        }
        
        return nearby;
    }
    
    performAttack() {
        if (!this.currentTarget) {
            this.showCombatMessage('No target selected!');
            return;
        }
        
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) {
            return; // Still on cooldown
        }
        
        // Check range
        const player = this.game.player;
        const distance = Math.sqrt(
            Math.pow(player.x - this.currentTarget.x, 2) + 
            Math.pow(player.y - this.currentTarget.y, 2)
        );
        
        if (distance > this.attackRange) {
            this.showCombatMessage('Target is too far away!');
            return;
        }
        
        // Send attack request
        this.game.socket.emit('playerAttack', {
            attackerId: player.id,
            targetId: this.currentTarget.id
        });
        
        this.lastAttackTime = now;
        
        // Play attack animation
        this.playAttackAnimation();
    }
    
    playAttackAnimation() {
        const player = this.game.player;
        
        // Create attack effect
        const effect = {
            type: 'attack',
            x: player.x,
            y: player.y,
            direction: player.direction,
            startTime: Date.now(),
            duration: 300
        };
        
        this.combatEffects.push(effect);
    }
    
    showTargetFrame(target) {
        const targetFrame = this.targetFrame;
        targetFrame.style.display = 'block';
        
        document.getElementById('target-name').textContent = target.name || target.type;
        document.getElementById('target-level').textContent = target.level || 1;
        
        // Update HP bar
        const hpPercent = (target.hp / target.maxHP) * 100;
        document.getElementById('target-hp-fill').style.width = hpPercent + '%';
    }
    
    hideTargetFrame() {
        this.targetFrame.style.display = 'none';
    }
    
    updateTargetHP(targetId, currentHP, maxHP) {
        if (this.currentTarget && this.currentTarget.id === targetId) {
            const hpPercent = (currentHP / maxHP) * 100;
            document.getElementById('target-hp-fill').style.width = hpPercent + '%';
        }
    }
    
    updatePlayerHP(currentHP, maxHP) {
        document.getElementById('hp-text').textContent = `${Math.round(currentHP)}/${Math.round(maxHP)}`;
        const hpPercent = (currentHP / maxHP) * 100;
        document.getElementById('hp-fill').style.width = hpPercent + '%';
    }
    
    // Socket event handlers
    handleAttackResult(data) {
        if (!data.success) {
            this.showCombatMessage(data.reason === 'out_of_range' ? 'Too far away!' : 'Attack failed!');
            return;
        }
        
        // Update target HP
        if (data.targetId && this.currentTarget && this.currentTarget.id === data.targetId) {
            this.currentTarget.hp = data.targetHP;
            this.updateTargetHP(data.targetId, data.targetHP, data.targetMaxHP);
        }
        
        // Show damage number
        this.showDamageNumber({
            targetId: data.targetId,
            damage: data.damage,
            critical: data.critical
        });
    }
    
    showDamageNumber(data) {
        const target = this.getEntityById(data.targetId);
        if (!target) return;
        
        // Convert world position to screen position
        const screenX = target.x - this.game.camera.x;
        const screenY = target.y - this.game.camera.y;
        
        const damageElement = document.createElement('div');
        damageElement.style.cssText = `
            position: absolute;
            left: ${screenX}px;
            top: ${screenY}px;
            color: ${data.critical ? '#ff6b6b' : '#fff'};
            font-size: ${data.critical ? '24px' : '18px'};
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            z-index: 1001;
            animation: damageFloat 1.5s ease-out forwards;
        `;
        damageElement.textContent = data.damage;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes damageFloat {
                0% {
                    transform: translateY(0px);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-50px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        this.damageContainer.appendChild(damageElement);
        
        // Remove after animation
        setTimeout(() => {
            damageElement.remove();
        }, 1500);
    }
    
    handleMobKilled(data) {
        this.showCombatMessage(`Mob killed! +${data.xp} XP`);
        
        // Remove target if it was the killed mob
        if (this.currentTarget && this.currentTarget.id === data.mobId) {
            this.setTarget(null);
        }
        
        // Remove mob from game
        const mobIndex = this.game.mobs.findIndex(m => m.id === data.mobId);
        if (mobIndex !== -1) {
            this.game.mobs.splice(mobIndex, 1);
        }
    }
    
    handleMobDeath(data) {
        this.showCombatMessage(`${data.killer} killed a mob!`);
    }
    
    handleXPGained(data) {
        this.showCombatMessage(`+${data.xp} XP`);
        
        // Update player XP display
        // This would update an XP bar in the UI
    }
    
    handleLevelUp(data) {
        this.showCombatMessage(`LEVEL UP! You are now level ${data.level}!`);
        
        // Update player stats
        this.game.player.level = data.level;
        this.game.player.maxHealth = data.newStats.maxHealth;
        this.game.player.health = data.newStats.maxHealth;
        this.game.player.attack = data.newStats.attack;
        this.game.player.defense = data.newStats.defense;
        
        this.updatePlayerHP(data.newStats.maxHealth, data.newStats.maxHealth);
    }
    
    handleLootDropped(data) {
        this.showCombatMessage(`Loot dropped! ${data.gold} gold, ${data.itemCount} items`);
        
        // Add loot entity to game
        this.game.loot.push({
            id: data.lootId,
            x: data.x,
            y: data.y,
            gold: data.gold,
            itemCount: data.itemCount
        });
    }
    
    getEntityById(id) {
        // Check mobs
        const mob = this.game.mobs.find(m => m.id === id);
        if (mob) return mob;
        
        // Check players
        const player = this.game.otherPlayers.find(p => p.id === id);
        if (player) return player;
        
        return null;
    }
    
    showCombatMessage(message) {
        // Create combat log message
        const messageElement = document.createElement('div');
        messageElement.style.cssText = `
            position: absolute;
            top: 100px;
            left: 10px;
            color: #fff;
            font-family: Arial, sans-serif;
            font-size: 14px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            z-index: 1002;
            animation: fadeInOut 3s ease-out forwards;
        `;
        messageElement.textContent = message;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-10px); }
                20% { opacity: 1; transform: translateY(0); }
                80% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
        
        this.combatUI.appendChild(messageElement);
        
        // Remove after animation
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }
    
    // Update loop
    update(deltaTime) {
        // Update combat effects
        this.updateCombatEffects(deltaTime);
        
        // Update target frame if target exists
        if (this.currentTarget) {
            this.updateTargetFrame();
        }
        
        // Check if target is still valid
        if (this.currentTarget) {
            const target = this.getEntityById(this.currentTarget.id);
            if (!target || target.hp <= 0) {
                this.setTarget(null);
            }
        }
    }
    
    updateCombatEffects(deltaTime) {
        const now = Date.now();
        
        for (let i = this.combatEffects.length - 1; i >= 0; i--) {
            const effect = this.combatEffects[i];
            
            if (now - effect.startTime > effect.duration) {
                this.combatEffects.splice(i, 1);
            }
        }
    }
    
    updateTargetFrame() {
        if (!this.currentTarget) return;
        
        // Update target frame position to follow target
        const target = this.currentTarget;
        const screenX = target.x - this.game.camera.x;
        const screenY = target.y - this.game.camera.y - 50;
        
        this.targetFrame.style.transform = `translate(${screenX}px, ${screenY}px)`;
    }
    
    // Render combat effects
    render(ctx) {
        // Render combat effects
        for (const effect of this.combatEffects) {
            this.renderCombatEffect(ctx, effect);
        }
        
        // Render target indicator
        if (this.currentTarget) {
            this.renderTargetIndicator(ctx, this.currentTarget);
        }
    }
    
    renderCombatEffect(ctx, effect) {
        const progress = (Date.now() - effect.startTime) / effect.duration;
        
        if (effect.type === 'attack') {
            ctx.save();
            
            // Simple slash effect
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + (1 - progress) + ')';
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            const angle = this.getDirectionAngle(effect.direction);
            const radius = 30 * progress;
            
            ctx.arc(effect.x, effect.y, radius, angle - 0.5, angle + 0.5);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    renderTargetIndicator(ctx, target) {
        ctx.save();
        
        // Draw target reticle
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        
        const size = 40;
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 5;
        
        // Outer circle
        ctx.beginPath();
        ctx.arc(target.x, target.y, size/2 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        // Crosshair
        ctx.beginPath();
        ctx.moveTo(target.x - size/2, target.y);
        ctx.lineTo(target.x + size/2, target.y);
        ctx.moveTo(target.x, target.y - size/2);
        ctx.lineTo(target.x, target.y + size/2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    getDirectionAngle(direction) {
        const angles = {
            'up': -Math.PI/2,
            'down': Math.PI/2,
            'left': Math.PI,
            'right': 0,
            'up-left': -3*Math.PI/4,
            'up-right': -Math.PI/4,
            'down-left': 3*Math.PI/4,
            'down-right': Math.PI/4
        };
        
        return angles[direction] || 0;
    }
    
    // Cleanup
    cleanup() {
        if (this.combatUI) {
            this.combatUI.remove();
        }
        if (this.damageContainer) {
            this.damageContainer.remove();
        }
    }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatSystem;
} else {
    window.CombatSystem = CombatSystem;
}
