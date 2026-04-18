/**
 * Character - Classe base para personagens (jogadores, NPCs)
 * Extensível para classes específicas (Warrior, Mage, etc.)
 */
class Character {
    constructor(data = {}) {
        // Identificação
        this.id = data.id || this.generateId();
        this.name = data.name || 'Unknown';
        this.classType = data.classType || 'warrior'; // warrior, mage, archer, etc.
        this.race = data.race || 'human';
        
        // Nível e XP
        this.level = data.level || 1;
        this.xp = data.xp || 0;
        this.xpToNextLevel = this.calculateXpToNextLevel();
        
        // Posição
        this.x = data.x || 400;
        this.y = data.y || 300;
        this.direction = data.direction || 'down'; // up, down, left, right
        this.speed = data.speed || 150; // pixels por segundo
        
        // Stats base
        this.baseStats = {
            strength: data.strength || 10,
            agility: data.agility || 10,
            intelligence: data.intelligence || 10,
            vitality: data.vitality || 10
        };
        
        // Stats calculados (serão recalculados baseado no nível)
        this.stats = this.calculateStats();
        
        // Vida
        this.maxHealth = this.stats.vitality * 10 + (this.level - 1) * 5;
        this.health = data.health || this.maxHealth;
        
        // Mana/Energia
        this.maxMana = this.stats.intelligence * 5 + (this.level - 1) * 2;
        this.mana = data.mana || this.maxMana;
        
        // Estado
        this.isAlive = true;
        this.isMoving = false;
        this.isAttacking = false;
        this.isInvulnerable = false;
        
        // Combat
        this.attackCooldown = 0;
        this.attackSpeed = 1.0; // ataques por segundo
        this.attackRange = 50;
        this.damage = this.calculateDamage();
        
        // Visual
        this.color = data.color || this.getClassColor();
        this.size = data.size || 20;
        this.sprite = data.sprite || null;
        
        // Timers
        this.invulnerabilityTime = 0;
        
        console.log(`✅ Character criado: ${this.name} (Lv.${this.level} ${this.classType})`);
    }
    
    /**
     * Gera ID único
     */
    generateId() {
        return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Calcula XP necessário para próximo nível
     */
    calculateXpToNextLevel() {
        // Fórmula: 100 * nível^1.5
        return Math.floor(100 * Math.pow(this.level, 1.5));
    }
    
    /**
     * Calcula stats baseado no nível e atributos base
     */
    calculateStats() {
        const levelBonus = this.level - 1;
        
        return {
            strength: this.baseStats.strength + Math.floor(levelBonus * 0.5),
            agility: this.baseStats.agility + Math.floor(levelBonus * 0.3),
            intelligence: this.baseStats.intelligence + Math.floor(levelBonus * 0.3),
            vitality: this.baseStats.vitality + Math.floor(levelBonus * 0.5)
        };
    }
    
    /**
     * Calcula dano base
     */
    calculateDamage() {
        // Baseado na classe
        switch(this.classType) {
            case 'warrior':
                return this.stats.strength * 2;
            case 'mage':
                return this.stats.intelligence * 2;
            case 'archer':
                return this.stats.agility * 2;
            default:
                return this.stats.strength;
        }
    }
    
    /**
     * Retorna cor baseada na classe
     */
    getClassColor() {
        const colors = {
            warrior: '#ff4444',
            mage: '#4444ff',
            archer: '#44ff44',
            rogue: '#ffff44',
            priest: '#ffffff'
        };
        return colors[this.classType] || '#888888';
    }
    
    /**
     * Atualiza personagem (chamado a cada frame)
     */
    update(deltaTime) {
        if (!this.isAlive) return;
        
        // Atualizar cooldown de ataque
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // Atualizar invulnerabilidade
        if (this.isInvulnerable) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.isInvulnerable = false;
            }
        }
        
        // Recuperação passiva de mana
        this.regenerateMana(deltaTime);
    }
    
    /**
     * Move o personagem
     */
    move(dx, dy, deltaTime, mapBounds = null) {
        if (!this.isAlive || this.isAttacking) return false;
        
        // Normalizar vetor
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) {
            this.isMoving = false;
            return false;
        }
        
        dx /= length;
        dy /= length;
        
        // Aplicar velocidade
        const moveDistance = this.speed * deltaTime;
        const newX = this.x + dx * moveDistance;
        const newY = this.y + dy * moveDistance;
        
        // Verificar limites do mapa
        if (mapBounds) {
            this.x = Math.max(mapBounds.x, Math.min(mapBounds.x + mapBounds.width, newX));
            this.y = Math.max(mapBounds.y, Math.min(mapBounds.y + mapBounds.height, newY));
        } else {
            this.x = newX;
            this.y = newY;
        }
        
        // Atualizar direção
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
        
        this.isMoving = true;
        return true;
    }
    
    /**
     * Para o movimento
     */
    stop() {
        this.isMoving = false;
    }
    
    /**
     * Recebe dano
     */
    takeDamage(amount, attacker = null) {
        if (!this.isAlive || this.isInvulnerable) return 0;
        
        // Calcular dano reduzido (defesa)
        const defense = this.stats.vitality * 0.5;
        const actualDamage = Math.max(1, Math.floor(amount - defense));
        
        this.health -= actualDamage;
        
        // Invulnerabilidade temporária
        this.isInvulnerable = true;
        this.invulnerabilityTime = 0.3; // 300ms
        
        // Verificar morte
        if (this.health <= 0) {
            this.die();
        }
        
        return actualDamage;
    }
    
    /**
     * Cura o personagem
     */
    heal(amount) {
        if (!this.isAlive) return 0;
        
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        
        return this.health - oldHealth;
    }
    
    /**
     * Usa mana
     */
    useMana(amount) {
        if (this.mana >= amount) {
            this.mana -= amount;
            return true;
        }
        return false;
    }
    
    /**
     * Regenera mana
     */
    regenerateMana(deltaTime) {
        if (this.mana < this.maxMana) {
            const regen = this.stats.intelligence * 0.1 * deltaTime;
            this.mana = Math.min(this.maxMana, this.mana + regen);
        }
    }
    
    /**
     * Morre
     */
    die() {
        this.health = 0;
        this.isAlive = false;
        this.isMoving = false;
        this.isAttacking = false;
        console.log(`💀 ${this.name} morreu!`);
    }
    
    /**
     * Ressuscita
     */
    revive(healthPercent = 1.0) {
        this.isAlive = true;
        this.health = Math.floor(this.maxHealth * healthPercent);
        this.mana = this.maxMana;
        console.log(`✨ ${this.name} foi ressuscitado!`);
    }
    
    /**
     * Adiciona XP
     */
    addXp(amount) {
        if (!this.isAlive) return false;
        
        this.xp += amount;
        console.log(`⭐ ${this.name} ganhou ${amount} XP`);
        
        // Verificar level up
        let leveledUp = false;
        while (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.levelUp();
            leveledUp = true;
        }
        
        return leveledUp;
    }
    
    /**
     * Sobe de nível
     */
    levelUp() {
        this.level++;
        
        // Recalcular stats
        this.stats = this.calculateStats();
        
        // Aumentar vida e mana máxima
        const oldMaxHealth = this.maxHealth;
        this.maxHealth = this.stats.vitality * 10 + (this.level - 1) * 5;
        this.health += this.maxHealth - oldMaxHealth; // Cura a diferença
        
        this.maxMana = this.stats.intelligence * 5 + (this.level - 1) * 2;
        this.mana = this.maxMana; // Restaura mana completa
        
        // Recalcular dano
        this.damage = this.calculateDamage();
        
        // Recalcular XP para próximo nível
        this.xpToNextLevel = this.calculateXpToNextLevel();
        
        console.log(`🎉 LEVEL UP! ${this.name} agora é nível ${this.level}!`);
        
        // Evento para HUD/notificações
        if (window.gameState) {
            window.gameState.addEvent('levelup', { character: this, level: this.level });
        }
    }
    
    /**
     * Ataca um alvo
     */
    attack(target) {
        if (!this.isAlive || this.isAttacking) return false;
        
        // Verificar cooldown
        if (this.attackCooldown > 0) return false;
        
        // Verificar distância
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.attackRange) return false;
        
        // Aplicar dano
        const damage = this.damage + Math.floor(Math.random() * 5); // Variação
        const actualDamage = target.takeDamage(damage, this);
        
        // Iniciar cooldown
        this.attackCooldown = 1 / this.attackSpeed;
        
        console.log(`⚔️ ${this.name} atacou ${target.name} causando ${actualDamage} de dano!`);
        
        return actualDamage;
    }
    
    /**
     * Retorna dados serializados
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            classType: this.classType,
            race: this.race,
            level: this.level,
            xp: this.xp,
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            mana: this.mana,
            maxMana: this.maxMana,
            baseStats: this.baseStats,
            isAlive: this.isAlive
        };
    }
    
    /**
     * Carrega dados
     */
    deserialize(data) {
        this.id = data.id || this.id;
        this.name = data.name || this.name;
        this.classType = data.classType || this.classType;
        this.race = data.race || this.race;
        this.level = data.level || this.level;
        this.xp = data.xp || this.xp;
        this.x = data.x || this.x;
        this.y = data.y || this.y;
        this.health = data.health || this.health;
        this.mana = data.mana || this.mana;
        this.baseStats = data.baseStats || this.baseStats;
        this.isAlive = data.isAlive !== undefined ? data.isAlive : this.isAlive;
        
        // Recalcular stats derivados
        this.stats = this.calculateStats();
        this.maxHealth = this.stats.vitality * 10 + (this.level - 1) * 5;
        this.maxMana = this.stats.intelligence * 5 + (this.level - 1) * 2;
        this.damage = this.calculateDamage();
        this.xpToNextLevel = this.calculateXpToNextLevel();
        
        return this;
    }
    
    /**
     * Renderiza o personagem
     */
    render(ctx, cameraX = 0, cameraY = 0) {
        if (!this.isAlive) return;
        
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        
        // Corpo
        ctx.fillStyle = this.isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0 
            ? '#ffffff' // Piscar quando invulnerável
            : this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Borda
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Indicador de direção
        const angle = this.getDirectionAngle();
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(
            screenX + Math.cos(angle) * (this.size / 2 + 5),
            screenY + Math.sin(angle) * (this.size / 2 + 5)
        );
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        
        // Barra de vida
        if (this.health < this.maxHealth) {
            const barWidth = 30;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            // Fundo
            ctx.fillStyle = '#333333';
            ctx.fillRect(screenX - barWidth / 2, screenY - this.size / 2 - 10, barWidth, barHeight);
            
            // Vida
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
            ctx.fillRect(screenX - barWidth / 2, screenY - this.size / 2 - 10, barWidth * healthPercent, barHeight);
        }
        
        // Nome
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, screenX, screenY + this.size / 2 + 15);
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
    
    /**
     * Calcula distância até outro personagem/ponto
     */
    distanceTo(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Verifica colisão com outro personagem
     */
    collidesWith(other) {
        const distance = this.distanceTo(other);
        return distance < (this.size + other.size) / 2;
    }
}

// Exportar para uso global
window.Character = Character;

export default Character;
