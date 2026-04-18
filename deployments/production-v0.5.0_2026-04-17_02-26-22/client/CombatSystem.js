/**
 * CombatSystem - Sistema de Combate Local
 * Gerencia ataques entre player e mobs
 */
class CombatSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.player = null;
        this.mobs = [];
        
        // Configurações de combate
        this.config = {
            attackCooldown: 0.5, // segundos entre ataques
            attackRange: 60, // pixels
            critChance: 0.1, // 10% chance crítica
            critMultiplier: 1.5 // dano crítico 50% maior
        };
        
        // Estado
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.attackTarget = null;
        
        // Efeitos visuais
        this.damageNumbers = [];
        this.attackEffects = [];
        
        console.log('⚔️ CombatSystem inicializado');
    }
    
    /**
     * Inicializa o sistema com player e mobs
     */
    initialize(player, mobs) {
        this.player = player;
        this.mobs = mobs || [];
        
        // Configurar input de ataque
        this.setupInput();
    }
    
    /**
     * Configura input de combate
     */
    setupInput() {
        // Usar InputManager se disponível
        if (window.inputManager) {
            window.inputManager.on('keyDown', (key) => {
                if (key === ' ') { // Espaço para atacar
                    this.performAttack();
                }
            });
            
            window.inputManager.on('mouseClick', (mouse) => {
                if (mouse.button === 'left') {
                    this.performAttackAt(mouse.worldX, mouse.worldY);
                }
            });
        }
    }
    
    /**
     * Atualiza o sistema de combate
     */
    update(deltaTime) {
        // Atualizar mobs
        this.mobs.forEach(mob => {
            if (mob.update) {
                // Mob persegue player se estiver próximo
                mob.update(deltaTime, [this.player]);
            }
        });
        
        // Remover mobs mortos
        this.mobs = this.mobs.filter(mob => {
            if (!mob.isAlive && mob.xpRewarded) {
                return false;
            }
            return true;
        });
        
        // Atualizar números de dano
        this.damageNumbers = this.damageNumbers.filter(dn => {
            dn.life -= deltaTime;
            dn.y -= 20 * deltaTime; // Subir
            return dn.life > 0;
        });
        
        // Atualizar efeitos de ataque
        this.attackEffects = this.attackEffects.filter(effect => {
            effect.life -= deltaTime;
            return effect.life > 0;
        });
    }
    
    /**
     * Realiza ataque básico
     */
    performAttack() {
        const now = Date.now() / 1000;
        
        // Verificar cooldown
        if (now - this.lastAttackTime < this.config.attackCooldown) {
            return false;
        }
        
        // Encontrar alvo mais próximo dentro do range
        const target = this.findNearestTarget();
        
        if (target) {
            this.attackTarget(target);
            this.lastAttackTime = now;
            return true;
        }
        
        // Ataque no ar (sem alvo)
        this.performMissAttack();
        this.lastAttackTime = now;
        return false;
    }
    
    /**
     * Ataca em posição específica (clique do mouse)
     */
    performAttackAt(x, y) {
        const now = Date.now() / 1000;
        
        if (now - this.lastAttackTime < this.config.attackCooldown) {
            return false;
        }
        
        // Virar para a posição
        if (this.player) {
            const dx = x - this.player.x;
            const dy = y - this.player.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.player.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.player.direction = dy > 0 ? 'down' : 'up';
            }
        }
        
        // Encontrar alvo na posição
        const target = this.findTargetAt(x, y);
        
        if (target) {
            this.attackTarget(target);
            this.lastAttackTime = now;
            return true;
        }
        
        this.performMissAttack();
        this.lastAttackTime = now;
        return false;
    }
    
    /**
     * Encontra alvo mais próximo dentro do range
     */
    findNearestTarget() {
        if (!this.player) return null;
        
        let nearest = null;
        let minDist = this.config.attackRange;
        
        this.mobs.forEach(mob => {
            if (!mob.isAlive) return;
            
            const dist = this.distanceTo(this.player, mob);
            if (dist < minDist) {
                minDist = dist;
                nearest = mob;
            }
        });
        
        return nearest;
    }
    
    /**
     * Encontra alvo em posição específica
     */
    findTargetAt(x, y) {
        const clickRadius = 30;
        
        for (const mob of this.mobs) {
            if (!mob.isAlive) continue;
            
            const dist = Math.sqrt(
                Math.pow(mob.x - x, 2) + 
                Math.pow(mob.y - y, 2)
            );
            
            if (dist < clickRadius) {
                // Verificar se está no range de ataque
                const distToPlayer = this.distanceTo(this.player, mob);
                if (distToPlayer <= this.config.attackRange) {
                    return mob;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Executa ataque em alvo
     */
    attackTarget(target) {
        // Calcular dano
        let damage = this.calculateDamage();
        
        // Verificar crítico
        let isCrit = Math.random() < this.config.critChance;
        if (isCrit) {
            damage = Math.floor(damage * this.config.critMultiplier);
        }
        
        // Aplicar dano
        const actualDamage = target.takeDamage(damage, this.player);
        
        // Efeitos visuais
        this.spawnDamageNumber(target.x, target.y, actualDamage, isCrit);
        this.spawnAttackEffect(target.x, target.y);
        
        // Log
        const critText = isCrit ? ' CRÍTICO!' : '';
        console.log(`⚔️ ${this.player.name} atacou ${target.name} causando ${actualDamage} de dano${critText}!`);
        
        // Verificar se matou
        if (!target.isAlive) {
            this.onTargetKilled(target);
        }
        
        return actualDamage;
    }
    
    /**
     * Ataque que não acertou nada
     */
    performMissAttack() {
        // Efeito visual de "swing"
        const angle = this.player.getDirectionAngle ? this.player.getDirectionAngle() : 0;
        const x = this.player.x + Math.cos(angle) * 30;
        const y = this.player.y + Math.sin(angle) * 30;
        
        this.attackEffects.push({
            x: x,
            y: y,
            type: 'swing',
            life: 0.2,
            angle: angle
        });
    }
    
    /**
     * Calcula dano do player
     */
    calculateDamage() {
        if (!this.player) return 10;
        
        const baseDamage = this.player.damage || 10;
        const variance = Math.floor(Math.random() * 5) - 2; // -2 a +2
        
        return Math.max(1, baseDamage + variance);
    }
    
    /**
     * Quando mata um alvo
     */
    onTargetKilled(target) {
        target.xpRewarded = true;
        
        // Dar XP
        if (this.player.addXp) {
            const xpGained = target.xpReward || 10;
            this.player.addXp(xpGained);
            this.spawnXpNumber(target.x, target.y, xpGained);
        }
        
        // Spawnar loot (placeholder)
        this.spawnLoot(target);
        
        console.log(`💀 ${target.name} foi derrotado!`);
    }
    
    /**
     * Spawnar loot
     */
    spawnLoot(target) {
        // Chance de dropar item
        if (Math.random() < 0.3) {
            const loot = {
                x: target.x,
                y: target.y,
                type: 'gold',
                amount: Math.floor(Math.random() * 10) + 1
            };
            
            if (this.gameEngine.items) {
                this.gameEngine.items.push(loot);
            }
            
            console.log(`💰 ${target.name} dropou ${loot.amount} gold!`);
        }
    }
    
    /**
     * Spawna número de dano flutuante
     */
    spawnDamageNumber(x, y, damage, isCrit) {
        this.damageNumbers.push({
            x: x,
            y: y - 20,
            value: damage,
            isCrit: isCrit,
            life: 1.0,
            color: isCrit ? '#ff0000' : '#ffffff'
        });
    }
    
    /**
     * Spawna número de XP
     */
    spawnXpNumber(x, y, xp) {
        this.damageNumbers.push({
            x: x,
            y: y - 40,
            value: `+${xp} XP`,
            isCrit: false,
            life: 1.5,
            color: '#00ff00',
            isXp: true
        });
    }
    
    /**
     * Spawna efeito de ataque
     */
    spawnAttackEffect(x, y) {
        this.attackEffects.push({
            x: x,
            y: y,
            type: 'hit',
            life: 0.3
        });
    }
    
    /**
     * Calcula distância entre duas entidades
     */
    distanceTo(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Adiciona mob ao combate
     */
    addMob(mob) {
        this.mobs.push(mob);
    }
    
    /**
     * Remove mob do combate
     */
    removeMob(mob) {
        this.mobs = this.mobs.filter(m => m.id !== mob.id);
    }
    
    /**
     * Renderiza efeitos de combate
     */
    render(ctx, cameraX = 0, cameraY = 0) {
        // Renderizar números de dano
        this.damageNumbers.forEach(dn => {
            const screenX = dn.x - cameraX;
            const screenY = dn.y - cameraY;
            
            ctx.save();
            ctx.fillStyle = dn.color;
            ctx.font = dn.isCrit ? 'bold 20px Arial' : '16px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText(dn.value.toString(), screenX, screenY);
            ctx.restore();
        });
        
        // Renderizar efeitos de ataque
        this.attackEffects.forEach(effect => {
            const screenX = effect.x - cameraX;
            const screenY = effect.y - cameraY;
            
            ctx.save();
            ctx.globalAlpha = effect.life / 0.3;
            
            if (effect.type === 'hit') {
                // Estrela/explosão simples
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 2 * Math.PI / 5) + effect.life * 10;
                    const r = 15 * (1 - effect.life / 0.3);
                    const x = screenX + Math.cos(angle) * r;
                    const y = screenY + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            } else if (effect.type === 'swing') {
                // Arco de ataque
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 25, effect.angle - 0.5, effect.angle + 0.5);
                ctx.stroke();
            }
            
            ctx.restore();
        });
    }
    
    /**
     * Serializa estado do combate
     */
    serialize() {
        return {
            mobs: this.mobs.filter(m => m.isAlive).map(m => m.serialize()),
            playerHealth: this.player ? this.player.health : 0,
            playerMaxHealth: this.player ? this.player.maxHealth : 0
        };
    }
}

// Exportar
window.CombatSystem = CombatSystem;

export default CombatSystem;
