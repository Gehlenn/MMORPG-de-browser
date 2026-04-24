/**
 * AutoCombatSystem - Sistema de Combate Automático
 * 
 * Features:
 * - Auto-attack: Ataca automaticamente quando inimigos estão no range
 * - Attack Speed: Cada classe tem velocidade de ataque diferente
 * - Attack Range: Cada classe tem alcance diferente
 * - Class Damage: Dano base diferente por classe
 * - Auto-Skills: Skills ativas/passivas por classe
 * 
 * Sistema de Classes:
 * - Inicial: Aprendiz (lvl 1-9)
 * - Level 10: Primeiras Classes disponíveis:
 *   - Guerreiro: Tank, dano físico, defesa alta
 *   - Arqueiro: Longo alcance, ataques rápidos
 *   - Mago: Dano mágico, AOE
 *   - Ladino: Crítico, stealth, hits rápidos
 *   - Sacerdote: Healer, suporte, dano sagrado
 *   - Druida: Transformações, natureza, híbrido
 *   - Bruxo: Dano sombrio, debuffs, pets
 *   - Monk: Combate corpo-a-corpo, chi, combos
 */

class AutoCombatSystem {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.player = null;
        
        // Configurações de classe
        this.classConfigs = {
            warrior: {
                name: 'Guerreiro',
                attackSpeed: 1.2, // ataques por segundo
                attackRange: 60, // pixels
                baseDamage: 15,
                damageVariance: 4, // +/- 4
                critChance: 0.15,
                critMultiplier: 2.0,
                damageType: 'physical',
                autoTarget: true,
                skills: [
                    { name: 'Golpe Poderoso', cooldown: 8, damage: 2.5, levelReq: 1 },
                    { name: 'Grito de Guerra', cooldown: 15, buff: true, levelReq: 5 },
                    { name: 'Executar', cooldown: 12, execute: true, levelReq: 10 }
                ]
            },
            archer: {
                name: 'Arqueiro',
                attackSpeed: 1.8,
                attackRange: 200,
                baseDamage: 10,
                damageVariance: 3,
                critChance: 0.25,
                critMultiplier: 1.8,
                damageType: 'physical',
                autoTarget: true,
                skills: [
                    { name: 'Tiro Múltiplo', cooldown: 6, arrows: 3, levelReq: 1 },
                    { name: 'Tiro Perfurante', cooldown: 10, pierce: true, levelReq: 5 },
                    { name: 'Chuva de Flechas', cooldown: 20, aoe: true, levelReq: 10 }
                ]
            },
            mage: {
                name: 'Mago',
                attackSpeed: 0.8,
                attackRange: 150,
                baseDamage: 20,
                damageVariance: 6,
                critChance: 0.20,
                critMultiplier: 2.2,
                damageType: 'magical',
                autoTarget: true,
                skills: [
                    { name: 'Bola de Fogo', cooldown: 5, damage: 2.0, aoe: true, levelReq: 1 },
                    { name: 'Raio', cooldown: 4, damage: 1.8, chain: true, levelReq: 5 },
                    { name: 'Explosão Arcana', cooldown: 15, damage: 3.5, aoe: true, levelReq: 10 }
                ]
            },
            rogue: {
                name: 'Ladino',
                attackSpeed: 2.5,
                attackRange: 50,
                baseDamage: 8,
                damageVariance: 3,
                critChance: 0.35,
                critMultiplier: 2.5,
                damageType: 'physical',
                autoTarget: true,
                skills: [
                    { name: 'Golpe Duplo', cooldown: 4, strikes: 2, levelReq: 1 },
                    { name: 'Veneno', cooldown: 12, dot: true, levelReq: 5 },
                    { name: 'Furtividade', cooldown: 20, stealth: true, levelReq: 10 }
                ]
            },
            priest: {
                name: 'Sacerdote',
                attackSpeed: 1.0,
                attackRange: 120,
                baseDamage: 12,
                damageVariance: 3,
                critChance: 0.10,
                critMultiplier: 1.8,
                damageType: 'holy',
                autoTarget: true,
                skills: [
                    { name: 'Luz Sagrada', cooldown: 6, damage: 1.8, heal: true, levelReq: 1 },
                    { name: 'Escudo Divino', cooldown: 15, buff: true, levelReq: 5 },
                    { name: 'Julgamento', cooldown: 10, damage: 2.2, stun: true, levelReq: 10 }
                ]
            },
            druid: {
                name: 'Druida',
                attackSpeed: 1.4,
                attackRange: 100,
                baseDamage: 13,
                damageVariance: 4,
                critChance: 0.15,
                critMultiplier: 2.0,
                damageType: 'nature',
                autoTarget: true,
                skills: [
                    { name: 'Forma de Urso', cooldown: 20, transform: true, tank: true, levelReq: 1 },
                    { name: 'Espinho Venenoso', cooldown: 8, dot: true, levelReq: 5 },
                    { name: 'Cura da Natureza', cooldown: 12, heal: true, aoe: true, levelReq: 10 }
                ]
            },
            warlock: {
                name: 'Bruxo',
                attackSpeed: 0.9,
                attackRange: 160,
                baseDamage: 18,
                damageVariance: 5,
                critChance: 0.20,
                critMultiplier: 2.3,
                damageType: 'shadow',
                autoTarget: true,
                skills: [
                    { name: 'Drenar Vida', cooldown: 5, damage: 1.5, lifeSteal: true, levelReq: 1 },
                    { name: 'Maldição', cooldown: 10, debuff: true, dot: true, levelReq: 5 },
                    { name: 'Invocar Demônio', cooldown: 25, pet: true, levelReq: 10 }
                ]
            },
            monk: {
                name: 'Monge',
                attackSpeed: 2.0,
                attackRange: 55,
                baseDamage: 11,
                damageVariance: 3,
                critChance: 0.25,
                critMultiplier: 2.2,
                damageType: 'chi',
                autoTarget: true,
                skills: [
                    { name: 'Combo de Palma', cooldown: 4, combo: true, strikes: 3, levelReq: 1 },
                    { name: 'Chute Voador', cooldown: 8, damage: 2.0, knockback: true, levelReq: 5 },
                    { name: 'Meditação', cooldown: 20, heal: true, manaRestore: true, levelReq: 10 }
                ]
            },
            apprentice: {
                name: 'Aprendiz',
                attackSpeed: 1.0,
                attackRange: 70,
                baseDamage: 8,
                damageVariance: 2,
                critChance: 0.10,
                critMultiplier: 1.5,
                damageType: 'physical',
                autoTarget: true,
                skills: [
                    { name: 'Golpe Básico', cooldown: 5, damage: 1.2, levelReq: 1 },
                    { name: 'Recuperar Fôlego', cooldown: 15, heal: true, levelReq: 3 }
                ]
            }
        };
        
        // Estado do combate
        this.currentTarget = null;
        this.lastAttackTime = 0;
        this.isAutoAttacking = true; // Começa ativo
        this.attackEffects = [];
        this.skillCooldowns = {};
        
        // Visual
        this.targetIndicator = null;
        this.damageNumbers = [];
        
        console.log('⚔️ AutoCombatSystem inicializado');
    }
    
    /**
     * Inicializa o sistema com dados do player
     */
    initialize(player) {
        this.player = player;
        
        // Detectar classe do personagem
        this.playerClass = this.detectPlayerClass();
        this.config = this.classConfigs[this.playerClass] || this.classConfigs.warrior;
        
        // Inicializar cooldowns das skills
        this.config.skills.forEach(skill => {
            this.skillCooldowns[skill.name] = 0;
        });
        
        console.log(`⚔️ AutoCombat configurado: ${this.config.name}`);
        console.log(`   - Attack Speed: ${this.config.attackSpeed}/s`);
        console.log(`   - Range: ${this.config.attackRange}px`);
        console.log(`   - Dano: ${this.config.baseDamage} (${this.config.damageType})`);
    }
    
    /**
     * Detecta a classe baseada nos dados do personagem
     */
    detectPlayerClass() {
        // Tentar obter classe do personagem
        const characterData = this.game.currentCharacter || {};
        const className = characterData.class?.toLowerCase() || '';
        
        // Level 1: Aprendiz (classe inicial)
        if (className.includes('aprendiz') || className.includes('aprendiz') || className.includes('novice')) return 'apprentice';
        
        // Level 10: Primeiras Classes
        if (className.includes('guerreiro') || className.includes('warrior')) return 'warrior';
        if (className.includes('arqueiro') || className.includes('archer') || className.includes('arqueira')) return 'archer';
        if (className.includes('mago') || className.includes('mage')) return 'mage';
        if (className.includes('ladrao') || className.includes('ladino') || className.includes('rogue') || className.includes('assassino')) return 'rogue';
        if (className.includes('sacerdote') || className.includes('priest') || className.includes('clérigo') || className.includes('cleric')) return 'priest';
        if (className.includes('druida') || className.includes('druid')) return 'druid';
        if (className.includes('bruxo') || className.includes('warlock') || className.includes('necromante')) return 'warlock';
        if (className.includes('monge') || className.includes('monk') || className.includes('pugilista')) return 'monk';
        
        // Default: Aprendiz (classe inicial lvl 1-9)
        return 'apprentice';
    }
    
    /**
     * Atualiza o sistema de combate (chamado no game loop)
     */
    update(deltaTime) {
        if (!this.player || !this.config) return;
        
        const now = Date.now();
        
        // Atualizar cooldowns das skills
        Object.keys(this.skillCooldowns).forEach(skillName => {
            if (this.skillCooldowns[skillName] > 0) {
                this.skillCooldowns[skillName] -= deltaTime;
            }
        });
        
        // Atualizar efeitos visuais
        this.updateEffects(deltaTime);
        
        // Se auto-attack está desativado, não ataca
        if (!this.isAutoAttacking) return;
        
        // Encontrar alvo mais próximo no range
        const target = this.findBestTarget();
        
        if (target) {
            this.currentTarget = target;
            
            // Verificar se pode atacar (cooldown)
            const attackInterval = 1000 / this.config.attackSpeed; // ms entre ataques
            
            if (now - this.lastAttackTime >= attackInterval) {
                this.performAutoAttack(target);
                this.lastAttackTime = now;
                
                // Tentar usar skill automaticamente se disponível
                this.tryAutoUseSkill(target);
            }
        } else {
            this.currentTarget = null;
        }
        
        // Atualizar indicador de alvo
        this.updateTargetIndicator();
    }
    
    /**
     * Encontra o melhor alvo (mais próximo dentro do range)
     */
    findBestTarget() {
        let bestTarget = null;
        let minDistance = this.config.attackRange;
        
        // Verificar mobs
        if (this.game.mobs) {
            for (const mob of this.game.mobs) {
                if (!mob.isAlive || mob.hp <= 0) continue;
                
                const dist = this.distanceTo(this.player, mob);
                if (dist <= this.config.attackRange && dist < minDistance) {
                    minDistance = dist;
                    bestTarget = mob;
                }
            }
        }
        
        // Verificar outros jogadores (PvP - futuro)
        
        return bestTarget;
    }
    
    /**
     * Executa ataque automático no alvo
     */
    performAutoAttack(target) {
        // Calcular dano
        const damage = this.calculateDamage();
        
        // Verificar crítico
        const isCrit = Math.random() < this.config.critChance;
        const finalDamage = isCrit ? Math.floor(damage * this.config.critMultiplier) : damage;
        
        // Aplicar dano
        if (target.takeDamage) {
            target.takeDamage(finalDamage, this.player);
        } else {
            // Fallback para mobs sem sistema de dano formal
            target.hp -= finalDamage;
        }
        
        // Efeitos visuais
        this.spawnAttackEffect(target.x, target.y, this.config.damageType);
        this.spawnDamageNumber(target.x, target.y, finalDamage, isCrit, this.config.damageType);
        
        // Animação de ataque baseado na classe
        this.playAttackAnimation(target);
        
        // Log
        if (isCrit) {
            console.log(`💥 CRÍTICO! ${this.config.name} causou ${finalDamage} de dano em ${target.name || target.type}`);
        }
        
        // Verificar se matou
        if (target.hp <= 0 || !target.isAlive) {
            this.onTargetKilled(target);
        }
    }
    
    /**
     * Tenta usar skill automaticamente
     */
    tryAutoUseSkill(target) {
        // Procurar skill disponível (fora de cooldown e nível adequado)
        const availableSkills = this.config.skills.filter(skill => {
            const levelReq = skill.levelReq || 1;
            const playerLevel = this.player.level || 1;
            return this.skillCooldowns[skill.name] <= 0 && playerLevel >= levelReq;
        });
        
        if (availableSkills.length > 0) {
            // Usar primeira skill disponível (pode ser aleatória ou por prioridade)
            const skill = availableSkills[0];
            this.useSkill(skill, target);
        }
    }
    
    /**
     * Usa uma skill específica
     */
    useSkill(skill, target) {
        // Colocar em cooldown
        this.skillCooldowns[skill.name] = skill.cooldown;
        
        console.log(`✨ Skill usada: ${skill.name}`);
        
        // Aplicar efeitos da skill
        if (skill.damage) {
            const damage = Math.floor(this.calculateDamage() * skill.damage);
            target.hp -= damage;
            this.spawnDamageNumber(target.x, target.y, damage, true, 'skill');
            this.spawnSkillEffect(target.x, target.y, skill.name);
        }
        
        if (skill.aoe) {
            // Dano em área
            this.game.mobs.forEach(mob => {
                if (mob.isAlive && mob !== target) {
                    const dist = this.distanceTo(target, mob);
                    if (dist <= 100) { // Raio da AOE
                        const aoeDamage = Math.floor(this.calculateDamage() * (skill.damage || 1.5) * 0.5);
                        mob.hp -= aoeDamage;
                        this.spawnDamageNumber(mob.x, mob.y, aoeDamage, false, 'aoe');
                    }
                }
            });
        }
        
        // Notificar HUD
        if (this.game.hud && this.game.hud.showSkillUsed) {
            this.game.hud.showSkillUsed(skill.name);
        }
    }
    
    /**
     * Calcula dano base
     */
    calculateDamage() {
        const variance = Math.floor(Math.random() * (this.config.damageVariance * 2 + 1)) - this.config.damageVariance;
        return Math.max(1, this.config.baseDamage + variance + (this.player.level || 1));
    }
    
    /**
     * Quando mata um alvo
     */
    onTargetKilled(target) {
        target.isAlive = false;
        
        // XP
        const xpGained = target.xpReward || 10;
        if (this.game.player && this.game.player.xp !== undefined) {
            this.game.player.xp += xpGained;
            
            // Verificar level up
            if (this.game.player.xp >= (this.game.player.xpToNext || 100)) {
                this.levelUp();
            }
        }
        
        // Spawnar loot
        if (this.game.spawnLootAt) {
            this.game.spawnLootAt(target.x, target.y, target);
        }
        
        // Efeito de morte
        this.spawnDeathEffect(target.x, target.y);
        
        console.log(`💀 ${target.name || target.type} foi derrotado! +${xpGained} XP`);
    }
    
    /**
     * Level up do player
     */
    levelUp() {
        const player = this.game.player;
        player.level = (player.level || 1) + 1;
        player.xp -= (player.xpToNext || 100);
        player.xpToNext = Math.floor((player.xpToNext || 100) * 1.2);
        player.maxHp = Math.floor(player.maxHp * 1.1);
        player.hp = player.maxHp;
        
        // Efeito visual
        this.spawnLevelUpEffect();
        
        console.log(`🎉 LEVEL UP! ${player.name} agora é nível ${player.level}`);
        
        if (this.game.hud) {
            this.game.hud.showLevelUp();
        }
    }
    
    /**
     * EFEITOS VISUAIS
     */
    
    spawnAttackEffect(x, y, type) {
        const colors = {
            physical: '#ff6b6b',
            magical: '#9b59b6',
            skill: '#f39c12',
            aoe: '#e74c3c'
        };
        
        this.attackEffects.push({
            x, y,
            type: 'hit',
            color: colors[type] || colors.physical,
            life: 0.3,
            maxLife: 0.3,
            size: 20
        });
    }
    
    spawnSkillEffect(x, y, skillName) {
        this.attackEffects.push({
            x, y,
            type: 'skill',
            text: skillName,
            life: 1.0,
            maxLife: 1.0,
            size: 30
        });
    }
    
    spawnDamageNumber(x, y, damage, isCrit, type) {
        const colors = {
            physical: '#ffffff',
            magical: '#9b59b6',
            skill: '#f1c40f',
            aoe: '#e67e22',
            crit: '#ff0000'
        };
        
        this.damageNumbers.push({
            x, y: y - 20,
            value: damage,
            isCrit,
            color: isCrit ? colors.crit : (colors[type] || colors.physical),
            life: 1.0,
            velocity: { x: (Math.random() - 0.5) * 2, y: -1 }
        });
    }
    
    spawnDeathEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.attackEffects.push({
                x, y,
                type: 'particle',
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 0.5,
                maxLife: 0.5,
                color: '#e74c3c',
                size: 5
            });
        }
    }
    
    spawnLevelUpEffect() {
        const player = this.player;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.attackEffects.push({
                x: player.x, y: player.y,
                type: 'particle',
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                life: 1.0,
                maxLife: 1.0,
                color: '#f1c40f',
                size: 8
            });
        }
    }
    
    updateEffects(deltaTime) {
        // Atualizar números de dano
        this.damageNumbers = this.damageNumbers.filter(dn => {
            dn.life -= deltaTime;
            dn.x += dn.velocity.x;
            dn.y += dn.velocity.y;
            return dn.life > 0;
        });
        
        // Atualizar efeitos
        this.attackEffects = this.attackEffects.filter(effect => {
            effect.life -= deltaTime;
            if (effect.vx) effect.x += effect.vx;
            if (effect.vy) effect.y += effect.vy;
            return effect.life > 0;
        });
    }
    
    playAttackAnimation(target) {
        // Criar projétil baseado na classe
        if (this.playerClass === 'archer') {
            this.createProjectile(target, 'arrow');
        } else if (this.playerClass === 'mage') {
            this.createProjectile(target, 'magic');
        }
        // Guerreiro e Ladrão usam melee (sem projétil)
    }
    
    createProjectile(target, type) {
        if (!this.game.projectiles) this.game.projectiles = [];
        
        this.game.projectiles.push({
            x: this.player.x,
            y: this.player.y,
            targetX: target.x,
            targetY: target.y,
            target: target,
            speed: 8,
            type: type,
            life: 2.0
        });
    }
    
    updateTargetIndicator() {
        // O indicador é desenhado no render
    }
    
    /**
     * RENDERIZAÇÃO
     */
    render(ctx, cameraX, cameraY) {
        // Desenhar indicador de alvo
        if (this.currentTarget && this.currentTarget.isAlive) {
            const screenX = this.currentTarget.x - cameraX;
            const screenY = this.currentTarget.y - cameraY - 40;
            
            // Círculo vermelho pulsante
            const pulse = Math.sin(Date.now() / 200) * 3;
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 15 + pulse, 0, Math.PI * 2);
            ctx.stroke();
            
            // HP do alvo
            const hpPercent = (this.currentTarget.hp / this.currentTarget.maxHp) * 100;
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX - 25, screenY - 25, 50, 6);
            ctx.fillStyle = hpPercent > 50 ? '#2ecc71' : (hpPercent > 25 ? '#f39c12' : '#e74c3c');
            ctx.fillRect(screenX - 25, screenY - 25, 50 * (hpPercent / 100), 6);
        }
        
        // Desenhar números de dano
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        
        this.damageNumbers.forEach(dn => {
            const alpha = Math.min(1, dn.life);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = dn.color;
            ctx.font = dn.isCrit ? 'bold 22px Arial' : 'bold 16px Arial';
            ctx.fillText(dn.value.toString(), dn.x - cameraX, dn.y - cameraY);
        });
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        // Desenhar efeitos
        this.attackEffects.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            ctx.globalAlpha = alpha;
            
            if (effect.type === 'hit') {
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.arc(effect.x - cameraX, effect.y - cameraY, effect.size * (1 - alpha), 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'skill') {
                ctx.fillStyle = effect.color;
                ctx.font = 'bold 14px Arial';
                ctx.fillText(effect.text, effect.x - cameraX, effect.y - cameraY);
            } else if (effect.type === 'particle') {
                ctx.fillStyle = effect.color;
                ctx.fillRect(
                    effect.x - cameraX - effect.size / 2,
                    effect.y - cameraY - effect.size / 2,
                    effect.size, effect.size
                );
            }
        });
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * UTILIDADES
     */
    distanceTo(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Controles
     */
    toggleAutoAttack() {
        this.isAutoAttacking = !this.isAutoAttacking;
        console.log(`🎯 Auto-Attack: ${this.isAutoAttacking ? 'ON' : 'OFF'}`);
        return this.isAutoAttacking;
    }
    
    setTarget(entity) {
        this.currentTarget = entity;
    }
    
    /**
     * Informações da classe atual
     */
    getClassInfo() {
        return {
            class: this.playerClass,
            ...this.config,
            autoAttacking: this.isAutoAttacking
        };
    }
}

// Exportar para uso global
window.AutoCombatSystem = AutoCombatSystem;
