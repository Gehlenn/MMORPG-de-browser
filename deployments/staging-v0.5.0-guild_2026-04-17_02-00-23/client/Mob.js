/**
 * Mob - Classe base para monstros/inimigos
 * Inimigos controlados pelo jogo com IA básica
 */
class Mob {
    constructor(data = {}) {
        // Identificação
        this.id = data.id || this.generateId();
        this.name = data.name || 'Mob';
        this.type = data.type || 'slime'; // slime, goblin, wolf, etc.
        
        // Nível (determina stats)
        this.level = data.level || 1;
        
        // Posição
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.spawnX = this.x; // Posição original de spawn
        this.spawnY = this.y;
        this.direction = data.direction || 'down';
        
        // Stats base por tipo
        this.baseStats = this.getBaseStatsForType(this.type);
        
        // Stats calculados
        this.stats = this.calculateStats();
        
        // Vida
        this.maxHealth = this.stats.vitality * 8 + (this.level - 1) * 3;
        this.health = data.health || this.maxHealth;
        
        // Movimento
        this.speed = this.baseStats.speed || 80; // pixels por segundo
        this.patrolRadius = data.patrolRadius || 150; // Raio de patrulha
        
        // Estado
        this.isAlive = true;
        this.isMoving = false;
        this.isAttacking = false;
        this.isInvulnerable = false;
        
        // IA
        this.aiState = 'idle'; // idle, patrol, chase, attack, flee, return
        this.aiTimer = 0;
        this.target = null; // Alvo atual (geralmente o jogador)
        this.aggroRadius = data.aggroRadius || 200; // Distância para detectar jogador
        this.attackRadius = data.attackRadius || 40; // Distância para atacar
        this.leashRadius = data.leashRadius || 400; // Distância máxima do spawn
        
        // Combat
        this.attackCooldown = 0;
        this.attackSpeed = this.baseStats.attackSpeed || 0.8; // ataques por segundo
        this.damage = this.calculateDamage();
        this.xpReward = this.calculateXpReward();
        
        // Visual
        this.color = data.color || this.getTypeColor();
        this.size = data.size || this.getTypeSize();
        
        // Timers
        this.invulnerabilityTime = 0;
        this.despawnTimer = 0;
        
        // Patrulha
        this.patrolTarget = null;
        this.patrolWaitTime = 0;
        
        console.log(`👾 Mob criado: ${this.name} (Lv.${this.level} ${this.type})`);
    }
    
    /**
     * Gera ID único
     */
    generateId() {
        return 'mob_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Retorna stats base por tipo
     */
    getBaseStatsForType(type) {
        const stats = {
            slime: {
                strength: 5,
                agility: 3,
                vitality: 8,
                intelligence: 1,
                speed: 60,
                attackSpeed: 0.5
            },
            goblin: {
                strength: 8,
                agility: 10,
                vitality: 6,
                intelligence: 3,
                speed: 100,
                attackSpeed: 1.0
            },
            wolf: {
                strength: 10,
                agility: 12,
                vitality: 7,
                intelligence: 2,
                speed: 120,
                attackSpeed: 1.2
            },
            skeleton: {
                strength: 9,
                agility: 5,
                vitality: 5,
                intelligence: 2,
                speed: 70,
                attackSpeed: 0.8
            },
            orc: {
                strength: 15,
                agility: 6,
                vitality: 12,
                intelligence: 3,
                speed: 85,
                attackSpeed: 0.7
            }
        };
        return stats[type] || stats.slime;
    }
    
    /**
     * Calcula stats baseado no nível
     */
    calculateStats() {
        const multiplier = 1 + (this.level - 1) * 0.2; // 20% por nível
        
        return {
            strength: Math.floor(this.baseStats.strength * multiplier),
            agility: Math.floor(this.baseStats.agility * multiplier),
            vitality: Math.floor(this.baseStats.vitality * multiplier),
            intelligence: Math.floor(this.baseStats.intelligence * multiplier)
        };
    }
    
    /**
     * Calcula dano
     */
    calculateDamage() {
        return this.stats.strength + Math.floor(this.level * 0.5);
    }
    
    /**
     * Calcula XP reward
     */
    calculateXpReward() {
        const baseXp = {
            slime: 10,
            goblin: 20,
            wolf: 25,
            skeleton: 30,
            orc: 50
        };
        return Math.floor((baseXp[this.type] || 10) * (1 + (this.level - 1) * 0.3));
    }
    
    /**
     * Retorna cor por tipo
     */
    getTypeColor() {
        const colors = {
            slime: '#88ff88',
            goblin: '#66aa44',
            wolf: '#8888aa',
            skeleton: '#dddddd',
            orc: '#44aa44'
        };
        return colors[this.type] || '#888888';
    }
    
    /**
     * Retorna tamanho por tipo
     */
    getTypeSize() {
        const sizes = {
            slime: 25,
            goblin: 22,
            wolf: 24,
            skeleton: 20,
            orc: 28
        };
        return sizes[this.type] || 20;
    }
    
    /**
     * Atualiza mob (IA e lógica)
     */
    update(deltaTime, players = []) {
        if (!this.isAlive) return;
        
        // Atualizar cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        if (this.invulnerabilityTime > 0) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.isInvulnerable = false;
            }
        }
        
        // Executar IA
        this.updateAI(deltaTime, players);
    }
    
    /**
     * Atualiza IA do mob
     */
    updateAI(deltaTime, players) {
        this.aiTimer += deltaTime;
        
        // Encontrar jogador mais próximo
        const nearestPlayer = this.findNearestPlayer(players);
        const distToSpawn = this.distanceTo({ x: this.spawnX, y: this.spawnY });
        
        switch (this.aiState) {
            case 'idle':
                this.isMoving = false;
                
                // Verificar se jogador entrou no aggro
                if (nearestPlayer && this.distanceTo(nearestPlayer) <= this.aggroRadius) {
                    this.target = nearestPlayer;
                    this.setState('chase');
                }
                // Iniciar patrulha após tempo parado
                else if (this.aiTimer > 2) {
                    this.setState('patrol');
                }
                break;
                
            case 'patrol':
                if (!this.patrolTarget || this.distanceTo(this.patrolTarget) < 5) {
                    // Escolher novo ponto de patrulha
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * this.patrolRadius;
                    this.patrolTarget = {
                        x: this.spawnX + Math.cos(angle) * distance,
                        y: this.spawnY + Math.sin(angle) * distance
                    };
                }
                
                this.moveTo(this.patrolTarget, deltaTime);
                
                // Verificar jogador
                if (nearestPlayer && this.distanceTo(nearestPlayer) <= this.aggroRadius) {
                    this.target = nearestPlayer;
                    this.setState('chase');
                }
                
                // Voltar a ficar ocioso
                if (this.aiTimer > 5) {
                    this.setState('idle');
                }
                break;
                
            case 'chase':
                if (!this.target || !this.target.isAlive) {
                    this.setState('return');
                    break;
                }
                
                const distToTarget = this.distanceTo(this.target);
                
                // Verificar leash (não ir muito longe do spawn)
                if (distToSpawn > this.leashRadius) {
                    this.setState('return');
                    break;
                }
                
                // Perseguir jogador
                this.moveTo(this.target, deltaTime);
                
                // Verificar se está próximo o suficiente para atacar
                if (distToTarget <= this.attackRadius) {
                    this.setState('attack');
                }
                
                // Perder interesse se jogador fugir muito
                if (distToTarget > this.aggroRadius * 1.5) {
                    this.setState('return');
                }
                break;
                
            case 'attack':
                if (!this.target || !this.target.isAlive) {
                    this.setState('return');
                    break;
                }
                
                const attackDist = this.distanceTo(this.target);
                
                // Jogador fugiu
                if (attackDist > this.attackRadius * 1.5) {
                    this.setState('chase');
                    break;
                }
                
                // Atacar
                this.isMoving = false;
                this.faceTarget(this.target);
                this.performAttack(this.target);
                break;
                
            case 'return':
                this.target = null;
                
                // Voltar para spawn
                if (distToSpawn > 10) {
                    this.moveTo({ x: this.spawnX, y: this.spawnY }, deltaTime);
                } else {
                    // Curar ao voltar
                    this.heal(this.maxHealth * 0.1 * deltaTime);
                    
                    if (this.health >= this.maxHealth) {
                        this.health = this.maxHealth;
                        this.setState('idle');
                    }
                }
                break;
                
            case 'flee':
                // Fugir do alvo (quando vida baixa)
                if (this.target && this.target.isAlive) {
                    this.fleeFrom(this.target, deltaTime);
                } else {
                    this.setState('return');
                }
                
                // Parar de fugir se vida recuperou ou chegou longe
                if (this.health > this.maxHealth * 0.5 || distToSpawn > this.leashRadius * 0.8) {
                    this.setState('return');
                }
                break;
        }
        
        // Fugir se vida muito baixa (para mobs que fugem)
        if (this.aiState !== 'flee' && this.aiState !== 'return' && 
            this.health < this.maxHealth * 0.2 && this.type !== 'orc') {
            this.setState('flee');
        }
    }
    
    /**
     * Muda estado da IA
     */
    setState(newState) {
        if (this.aiState !== newState) {
            this.aiState = newState;
            this.aiTimer = 0;
            this.patrolTarget = null;
        }
    }
    
    /**
     * Encontra jogador mais próximo
     */
    findNearestPlayer(players) {
        let nearest = null;
        let minDist = Infinity;
        
        for (const player of players) {
            if (!player.isAlive) continue;
            
            const dist = this.distanceTo(player);
            if (dist < minDist) {
                minDist = dist;
                nearest = player;
            }
        }
        
        return nearest;
    }
    
    /**
     * Move em direção a um alvo
     */
    moveTo(target, deltaTime) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 5) {
            this.isMoving = false;
            return;
        }
        
        // Normalizar e aplicar velocidade
        const moveX = (dx / dist) * this.speed * deltaTime;
        const moveY = (dy / dist) * this.speed * deltaTime;
        
        this.x += moveX;
        this.y += moveY;
        
        // Atualizar direção
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
        
        this.isMoving = true;
    }
    
    /**
     * Foge de um alvo
     */
    fleeFrom(target, deltaTime) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            // Mover na direção oposta
            const moveX = (dx / dist) * this.speed * 1.2 * deltaTime; // 20% mais rápido fugindo
            const moveY = (dy / dist) * this.speed * 1.2 * deltaTime;
            
            this.x += moveX;
            this.y += moveY;
            this.isMoving = true;
        }
    }
    
    /**
     * Vira para o alvo
     */
    faceTarget(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }
    
    /**
     * Realiza ataque
     */
    performAttack(target) {
        if (this.attackCooldown > 0) return false;
        
        const damage = this.damage + Math.floor(Math.random() * 3);
        const actualDamage = target.takeDamage(damage, this);
        
        this.attackCooldown = 1 / this.attackSpeed;
        this.isAttacking = true;
        
        // Reset flag após animação
        setTimeout(() => {
            this.isAttacking = false;
        }, 200);
        
        return actualDamage;
    }
    
    /**
     * Recebe dano
     */
    takeDamage(amount, attacker = null) {
        if (!this.isAlive || this.isInvulnerable) return 0;
        
        const defense = this.stats.vitality * 0.3;
        const actualDamage = Math.max(1, Math.floor(amount - defense));
        
        this.health -= actualDamage;
        this.isInvulnerable = true;
        this.invulnerabilityTime = 0.25;
        
        // Reagir ao dano
        if (attacker && this.aiState !== 'chase' && this.aiState !== 'attack') {
            this.target = attacker;
            this.setState('chase');
        }
        
        if (this.health <= 0) {
            this.die(attacker);
        }
        
        return actualDamage;
    }
    
    /**
     * Cura o mob
     */
    heal(amount) {
        if (!this.isAlive) return 0;
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        return this.health - oldHealth;
    }
    
    /**
     * Morre
     */
    die(killer = null) {
        this.health = 0;
        this.isAlive = false;
        this.isMoving = false;
        this.aiState = 'dead';
        
        // Dar XP para o matador
        if (killer && killer.addXp) {
            killer.addXp(this.xpReward);
        }
        
        console.log(`💀 ${this.name} foi derrotado! (+${this.xpReward} XP)`);
        
        // Notificar sistema
        if (window.gameState) {
            window.gameState.addEvent('mob_died', {
                mob: this,
                killer: killer,
                xpReward: this.xpReward
            });
        }
    }
    
    /**
     * Ressuscita (para respawn)
     */
    revive() {
        this.isAlive = true;
        this.health = this.maxHealth;
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.aiState = 'idle';
        this.target = null;
        this.aiTimer = 0;
    }
    
    /**
     * Retorna distância até alvo
     */
    distanceTo(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Serializa dados
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            level: this.level,
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            isAlive: this.isAlive,
            aiState: this.aiState
        };
    }
    
    /**
     * Renderiza o mob
     */
    render(ctx, cameraX = 0, cameraY = 0) {
        if (!this.isAlive) return;
        
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        
        // Efeito de invulnerabilidade (piscar)
        if (this.isInvulnerable && Math.floor(Date.now() / 50) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Corpo do mob (forma varia por tipo)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        if (this.type === 'slime') {
            // Slime é um círculo achatado
            ctx.ellipse(screenX, screenY, this.size / 2, this.size / 3, 0, 0, Math.PI * 2);
        } else if (this.type === 'wolf') {
            // Lobo é um círculo com "orelhas"
            ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
            // Orelhas
            ctx.moveTo(screenX - 8, screenY - this.size / 2);
            ctx.lineTo(screenX - 12, screenY - this.size / 2 - 8);
            ctx.lineTo(screenX - 4, screenY - this.size / 2);
            ctx.moveTo(screenX + 8, screenY - this.size / 2);
            ctx.lineTo(screenX + 12, screenY - this.size / 2 - 8);
            ctx.lineTo(screenX + 4, screenY - this.size / 2);
        } else {
            // Padrão: círculo
            ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
        }
        
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Borda
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Indicador de direção para mobs hostis
        if (this.aiState === 'chase' || this.aiState === 'attack') {
            const angle = this.getDirectionAngle();
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(
                screenX + Math.cos(angle) * (this.size / 2 + 5),
                screenY + Math.sin(angle) * (this.size / 2 + 5)
            );
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Barra de vida
        if (this.health < this.maxHealth || this.aiState === 'chase' || this.aiState === 'attack') {
            const barWidth = 30;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            // Fundo
            ctx.fillStyle = '#333333';
            ctx.fillRect(screenX - barWidth / 2, screenY - this.size / 2 - 10, barWidth, barHeight);
            
            // Vida (amarelo/laranja para mobs)
            ctx.fillStyle = healthPercent > 0.5 ? '#FFC107' : healthPercent > 0.25 ? '#FF9800' : '#F44336';
            ctx.fillRect(screenX - barWidth / 2, screenY - this.size / 2 - 10, barWidth * healthPercent, barHeight);
        }
        
        // Nome e nível
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.name} Lv.${this.level}`, screenX, screenY + this.size / 2 + 15);
        
        // Indicador de estado (debug)
        if (window.DEBUG_MOBS) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '10px Arial';
            ctx.fillText(this.aiState, screenX, screenY - this.size / 2 - 20);
            
            // Raio de aggro (círculo tracejado)
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.aggroRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    /**
     * Retorna ângulo baseado na direção
     */
    getDirectionAngle() {
        const angles = {
            up: -Math.PI / 2,
            down: Math.PI / 2,
            left: Math.PI,
            right: 0
        };
        return angles[this.direction] || 0;
    }
}

// Criar mobs predefinidos
Mob.TYPES = {
    SLIME: 'slime',
    GOBLIN: 'goblin',
    WOLF: 'wolf',
    SKELETON: 'skeleton',
    ORC: 'orc'
};

// Factory method para criar mobs fácil
Mob.create = function(type, level, x, y) {
    const names = {
        slime: 'Slime',
        goblin: 'Goblin',
        wolf: 'Lobo',
        skeleton: 'Esqueleto',
        orc: 'Orc'
    };
    
    return new Mob({
        name: names[type] || 'Mob',
        type: type,
        level: level,
        x: x,
        y: y
    });
};

// Exportar
window.Mob = Mob;

export default Mob;
