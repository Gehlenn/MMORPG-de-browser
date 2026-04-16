/**
 * Character.js
 * Classe base para Player, Mobs, NPCs
 * Versão: 1.0 MVP Core
 */

class Character {
    constructor(data = {}) {
        // Identificação
        this.id = data.id || Character.generateId();
        this.name = data.name || 'Unknown';
        this.type = data.type || 'character'; // player, mob, npc
        
        // Classe e nível
        this.class = data.class || 'apprentice';
        this.level = data.level || 1;
        this.xp = data.xp || 0;
        
        // Position
        this.x = data.x || 400;
        this.y = data.y || 300;
        this.direction = data.direction || 'down';
        
        // Stats base
        this.baseStats = data.stats || this.getClassBaseStats();
        
        // Stats calculados (inclui bônus de nível, equipamento, buffs)
        this.stats = this.calculateStats();
        
        // Combat
        this.maxHp = this.calculateMaxHP();
        this.hp = data.hp !== undefined ? data.hp : this.maxHp;
        this.maxMp = this.calculateMaxMP();
        this.mp = data.mp !== undefined ? data.mp : this.maxMp;
        
        // Estado
        this.isDead = data.isDead || false;
        this.isMoving = false;
        this.isAttacking = false;
        this.isStunned = false;
        
        // Cooldowns de skills
        this.cooldowns = {};
        
        // Efeitos ativos (buffs/debuffs)
        this.effects = [];
        
        // Skills
        this.skills = data.skills || this.getDefaultSkills();
        
        // Equipamento
        this.equipment = data.equipment || {};
        
        // Visual
        this.color = data.color || this.getClassColor();
        this.icon = data.icon || this.getClassIcon();
    }
    
    // ============================================================
    // STATIC METHODS
    // ============================================================
    
    static generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    
    static getClassData(className) {
        const classes = {
            warrior: {
                name: 'Guerreiro',
                description: 'Melee DPS/Tank - Mestre das armas e armaduras',
                stats: { str: 20, agi: 10, vit: 15, int: 5, sab: 8, fis: 12 },
                color: '#e74c3c',
                icon: '⚔️',
                hpMult: 12,
                mpMult: 6,
                skills: ['slash', 'shieldBash', 'warCry']
            },
            mage: {
                name: 'Mago',
                description: 'Ranged DPS/Control - Mestre da magia elemental',
                stats: { str: 5, agi: 12, vit: 5, int: 25, sab: 15, fis: 10 },
                color: '#3498db',
                icon: '🔮',
                hpMult: 6,
                mpMult: 15,
                skills: ['fireball', 'iceBolt', 'manaShield']
            },
            archer: {
                name: 'Arqueiro',
                description: 'Ranged DPS/Precision - Mestre do arco e flecha',
                stats: { str: 12, agi: 22, vit: 10, int: 8, sab: 10, fis: 8 },
                color: '#27ae60',
                icon: '🏹',
                hpMult: 8,
                mpMult: 8,
                skills: ['quickShot', 'powerShot', 'evasion']
            },
            priest: {
                name: 'Sacerdote',
                description: 'Suporte/Healer - Mestre da cura e proteção',
                stats: { str: 8, agi: 8, vit: 12, int: 18, sab: 22, fis: 5 },
                color: '#f1c40f',
                icon: '⭐',
                hpMult: 9,
                mpMult: 12,
                skills: ['heal', 'smite', 'bless']
            },
            druid: {
                name: 'Druida',
                description: 'Híbrido/Natureza - Mestre da natureza e transformação',
                stats: { str: 14, agi: 15, vit: 14, int: 12, sab: 14, fis: 12 },
                color: '#2ecc71',
                icon: '🌿',
                hpMult: 10,
                mpMult: 10,
                skills: ['natureTouch', 'rootBind', 'beastForm']
            },
            rogue: {
                name: 'Ladino',
                description: 'Melee DPS/Stealth - Mestre da furtividade e assassinato',
                stats: { str: 12, agi: 24, vit: 8, int: 8, sab: 10, fis: 8 },
                color: '#9b59b6',
                icon: '🗡️',
                hpMult: 7,
                mpMult: 7,
                skills: ['backstab', 'stealth', 'poisonBlade']
            },
            warlock: {
                name: 'Bruxo',
                description: 'Ranged DPS/DoT - Mestre das artes sombrias',
                stats: { str: 8, agi: 10, vit: 8, int: 22, sab: 18, fis: 8 },
                color: '#8e44ad',
                icon: '💀',
                hpMult: 7,
                mpMult: 14,
                skills: ['shadowBolt', 'curse', 'lifeDrain']
            },
            fighter: {
                name: 'Lutador',
                description: 'Melee DPS/Combo - Mestre do corpo-a-corpo',
                stats: { str: 18, agi: 16, vit: 16, int: 8, sab: 10, fis: 15 },
                color: '#e67e22',
                icon: '👊',
                hpMult: 11,
                mpMult: 7,
                skills: ['comboPunch', 'uppercut', 'focus']
            },
            apprentice: {
                name: 'Aprendiz',
                description: 'Iniciante - Ainda escolhendo seu caminho',
                stats: { str: 10, agi: 10, vit: 10, int: 10, sab: 10, fis: 10 },
                color: '#95a5a6',
                icon: '👤',
                hpMult: 8,
                mpMult: 8,
                skills: ['basicAttack']
            }
        };
        
        return classes[className] || classes.apprentice;
    }
    
    static getAllClasses() {
        return ['warrior', 'mage', 'archer', 'priest', 'druid', 'rogue', 'warlock', 'fighter'];
    }
    
    // ============================================================
    // INSTANCE METHODS - Stats
    // ============================================================
    
    getClassBaseStats() {
        const classData = Character.getClassData(this.class);
        return { ...classData.stats };
    }
    
    getClassColor() {
        const classData = Character.getClassData(this.class);
        return classData.color;
    }
    
    getClassIcon() {
        const classData = Character.getClassData(this.class);
        return classData.icon;
    }
    
    calculateStats() {
        const levelBonus = this.level - 1;
        const stats = {};
        
        // Calcular cada stat com bônus de nível
        for (const [stat, baseValue] of Object.entries(this.baseStats)) {
            // Cada stat cresce ~1.5-2 por nível
            const growthRate = stat === 'str' || stat === 'vit' ? 2 : 1.5;
            stats[stat] = Math.floor(baseValue + (levelBonus * growthRate));
        }
        
        // Aplicar bônus de equipamento
        const equipBonus = this.getEquipmentStatsBonus();
        for (const stat of Object.keys(stats)) {
            stats[stat] += equipBonus[stat] || 0;
        }
        
        // Aplicar bônus de efeitos ativos
        for (const effect of this.effects) {
            if (effect.statBonus) {
                for (const [stat, bonus] of Object.entries(effect.statBonus)) {
                    stats[stat] = (stats[stat] || 0) + bonus;
                }
            }
        }
        
        return stats;
    }
    
    getEquipmentStatsBonus() {
        const bonus = { str: 0, agi: 0, vit: 0, int: 0, sab: 0, fis: 0 };
        
        for (const item of Object.values(this.equipment)) {
            if (item && item.stats) {
                for (const [stat, value] of Object.entries(item.stats)) {
                    bonus[stat] = (bonus[stat] || 0) + value;
                }
            }
        }
        
        return bonus;
    }
    
    calculateMaxHP() {
        const classData = Character.getClassData(this.class);
        const vitMult = classData.hpMult || 10;
        return Math.floor(this.stats.vit * vitMult);
    }
    
    calculateMaxMP() {
        const classData = Character.getClassData(this.class);
        const intMult = classData.mpMult || 8;
        return Math.floor(this.stats.int * intMult);
    }
    
    recalculateStats() {
        this.stats = this.calculateStats();
        
        const oldMaxHp = this.maxHp;
        const oldMaxMp = this.maxMp;
        
        this.maxHp = this.calculateMaxHP();
        this.maxMp = this.calculateMaxMP();
        
        // Ajustar HP/MP atuais proporcionalmente
        if (oldMaxHp > 0) {
            const hpRatio = this.hp / oldMaxHp;
            this.hp = Math.min(this.maxHp, Math.floor(this.maxHp * hpRatio));
        }
        
        if (oldMaxMp > 0) {
            const mpRatio = this.mp / oldMaxMp;
            this.mp = Math.min(this.maxMp, Math.floor(this.maxMp * mpRatio));
        }
    }
    
    // ============================================================
    // INSTANCE METHODS - Combat
    // ============================================================
    
    takeDamage(amount, attacker = null, type = 'physical') {
        if (this.isDead) return { damage: 0, killed: false };
        
        // Cálculo de defesa baseado no tipo
        let defense = 0;
        if (type === 'physical') {
            defense = this.stats.fis || 0;
        } else if (type === 'magic') {
            defense = (this.stats.sab || 0) * 0.5 + (this.stats.int || 0) * 0.3;
        }
        
        // Fórmula de redução de dano (suavizada)
        const reduction = defense / (defense + 100);
        let finalDamage = Math.max(1, Math.floor(amount * (1 - reduction)));
        
        // Aplicar modificadores de efeitos
        for (const effect of this.effects) {
            if (effect.damageModifier) {
                finalDamage = Math.floor(finalDamage * effect.damageModifier);
            }
        }
        
        // Aplicar dano
        this.hp = Math.max(0, this.hp - finalDamage);
        
        // Verificar morte
        if (this.hp <= 0) {
            this.die(attacker);
            return { damage: finalDamage, killed: true };
        }
        
        return { damage: finalDamage, killed: false };
    }
    
    heal(amount, source = null) {
        if (this.isDead) return 0;
        
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        
        return this.hp - oldHp; // Retorna quanto realmente curou
    }
    
    restoreMana(amount) {
        const oldMp = this.mp;
        this.mp = Math.min(this.maxMp, this.mp + amount);
        return this.mp - oldMp;
    }
    
    die(killer = null) {
        this.isDead = true;
        this.hp = 0;
        this.clearEffects();
        
        // Limpar cooldowns
        this.cooldowns = {};
        
        return {
            xpReward: this.calculateXpReward(),
            loot: this.generateLoot()
        };
    }
    
    calculateXpReward() {
        // XP base + bônus por nivel
        return this.level * 20 + 10;
    }
    
    generateLoot() {
        // TODO: sistema de loot
        return [];
    }
    
    revive(hpPercent = 1) {
        this.isDead = false;
        this.hp = Math.floor(this.maxHp * hpPercent);
    }
    
    // ============================================================
    // INSTANCE METHODS - Progression
    // ============================================================
    
    gainXp(amount) {
        if (this.type !== 'player') return { xp: amount, leveledUp: false };
        
        this.xp += amount;
        const needed = this.getXpNeeded();
        
        if (this.xp >= needed) {
            this.levelUp();
            return { xp: amount, leveledUp: true, newLevel: this.level };
        }
        
        return { xp: amount, leveledUp: false };
    }
    
    getXpNeeded() {
        // XP necessário aumenta exponencialmente
        return Math.floor(100 * Math.pow(1.1, this.level - 1));
    }
    
    levelUp() {
        const oldStats = { ...this.stats };
        
        this.level++;
        this.xp = 0;
        
        // Recalcular tudo
        this.recalculateStats();
        
        // Curar completamente no level up
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        
        // Aprender novas skills se houver
        this.checkNewSkills();
        
        return {
            newLevel: this.level,
            statIncreases: {
                str: this.stats.str - oldStats.str,
                agi: this.stats.agi - oldStats.agi,
                vit: this.stats.vit - oldStats.vit,
                int: this.stats.int - oldStats.int,
                sab: this.stats.sab - oldStats.sab,
                fis: this.stats.fis - oldStats.fis
            },
            hpIncrease: this.maxHp - (oldStats.vit * 10),
            mpIncrease: this.maxMp - (oldStats.int * 8)
        };
    }
    
    // ============================================================
    // INSTANCE METHODS - Skills
    // ============================================================
    
    getDefaultSkills() {
        const classData = Character.getClassData(this.class);
        return classData.skills || ['basicAttack'];
    }
    
    checkNewSkills() {
        // TODO: verificar se desbloqueou novas skills no novo nível
    }
    
    hasSkill(skillId) {
        return this.skills.includes(skillId);
    }
    
    learnSkill(skillId) {
        if (!this.hasSkill(skillId)) {
            this.skills.push(skillId);
            return true;
        }
        return false;
    }
    
    useSkill(skillId, target = null) {
        if (!this.hasSkill(skillId)) {
            return { success: false, error: 'Skill não conhecida' };
        }
        
        if (this.isDead) {
            return { success: false, error: 'Personagem morto' };
        }
        
        if (this.isStunned) {
            return { success: false, error: 'Atordoado' };
        }
        
        // Verificar cooldown
        if (this.cooldowns[skillId] > 0) {
            return { success: false, error: 'Em cooldown' };
        }
        
        // TODO: Verificar mana, range, etc
        
        // Aplicar cooldown
        // this.cooldowns[skillId] = skillData.cooldown;
        
        return { success: true, skillId };
    }
    
    // ============================================================
    // INSTANCE METHODS - Effects (Buffs/Debuffs)
    // ============================================================
    
    addEffect(effect) {
        effect.startTime = Date.now();
        this.effects.push(effect);
        
        // Recalcular stats se necessário
        if (effect.statBonus) {
            this.recalculateStats();
        }
        
        return effect;
    }
    
    removeEffect(effectId) {
        const index = this.effects.findIndex(e => e.id === effectId);
        if (index !== -1) {
            const effect = this.effects[index];
            this.effects.splice(index, 1);
            
            if (effect.statBonus) {
                this.recalculateStats();
            }
            
            return effect;
        }
        return null;
    }
    
    clearEffects() {
        const hadStatEffects = this.effects.some(e => e.statBonus);
        this.effects = [];
        
        if (hadStatEffects) {
            this.recalculateStats();
        }
    }
    
    updateEffects(deltaTime) {
        const now = Date.now();
        const hadStatEffects = this.effects.some(e => e.statBonus);
        
        this.effects = this.effects.filter(effect => {
            const elapsed = (now - effect.startTime) / 1000;
            
            // Aplicar efeitos periódicos (DoT, HoT)
            if (effect.tickInterval && effect.nextTick <= elapsed) {
                this.applyEffectTick(effect);
                effect.nextTick += effect.tickInterval;
            }
            
            // Remover se expirou
            return elapsed < effect.duration;
        });
        
        // Recalcular stats se efeitos com stat bonus expiraram
        if (hadStatEffects && !this.effects.some(e => e.statBonus)) {
            this.recalculateStats();
        }
    }
    
    applyEffectTick(effect) {
        if (effect.healPerTick) {
            this.heal(effect.healPerTick);
        }
        if (effect.damagePerTick) {
            this.takeDamage(effect.damagePerTick, null, effect.damageType || 'magic');
        }
    }
    
    // ============================================================
    // INSTANCE METHODS - Update Loop
    // ============================================================
    
    update(deltaTime) {
        if (this.isDead) return;
        
        // Atualizar cooldowns
        for (const skillId in this.cooldowns) {
            if (this.cooldowns[skillId] > 0) {
                this.cooldowns[skillId] -= deltaTime;
                if (this.cooldowns[skillId] < 0) {
                    this.cooldowns[skillId] = 0;
                }
            }
        }
        
        // Atualizar efeitos
        this.updateEffects(deltaTime);
        
        // Regeneração natural (fora de combate)
        // TODO: detectar combate
        // this.regenerate(deltaTime);
    }
    
    regenerate(deltaTime) {
        // HP regeneration
        if (this.hp < this.maxHp) {
            const hpRegen = (this.stats.vit * 0.1) * deltaTime;
            this.hp = Math.min(this.maxHp, this.hp + hpRegen);
        }
        
        // MP regeneration
        if (this.mp < this.maxMp) {
            const mpRegen = (this.stats.sab * 0.1) * deltaTime;
            this.mp = Math.min(this.maxMp, this.mp + mpRegen);
        }
    }
    
    // ============================================================
    // INSTANCE METHODS - Equipment
    // ============================================================
    
    equipItem(slot, item) {
        const oldItem = this.equipment[slot];
        this.equipment[slot] = item;
        this.recalculateStats();
        return oldItem;
    }
    
    unequipItem(slot) {
        const item = this.equipment[slot];
        delete this.equipment[slot];
        this.recalculateStats();
        return item;
    }
    
    getEquippedItem(slot) {
        return this.equipment[slot];
    }
    
    // ============================================================
    // INSTANCE METHODS - Serialization
    // ============================================================
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            class: this.class,
            level: this.level,
            xp: this.xp,
            hp: this.hp,
            maxHp: this.maxHp,
            mp: this.mp,
            maxMp: this.maxMp,
            x: this.x,
            y: this.y,
            direction: this.direction,
            stats: this.stats,
            skills: this.skills,
            equipment: this.equipment,
            isDead: this.isDead,
            color: this.color,
            icon: this.icon
        };
    }
    
    static fromJSON(data) {
        return new Character(data);
    }
    
    clone() {
        return Character.fromJSON(this.toJSON());
    }
    
    // ============================================================
    // INSTANCE METHODS - Utils
    // ============================================================
    
    distanceTo(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getAttackPower() {
        return this.stats.str * 2 + (this.stats.agi * 0.5);
    }
    
    getDefense() {
        return this.stats.fis * 1.5;
    }
    
    getMagicPower() {
        return this.stats.int * 2 + (this.stats.sab * 0.5);
    }
    
    getCritChance() {
        // Base 5% + bonus de AGI
        return Math.min(0.5, 0.05 + (this.stats.agi / 100) * 0.2);
    }
    
    getDodgeChance() {
        // Base 3% + bonus de AGI
        return Math.min(0.4, 0.03 + (this.stats.agi / 100) * 0.15);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Character;
} else {
    window.Character = Character;
}
