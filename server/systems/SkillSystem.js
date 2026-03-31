/**
 * ⚔️ SkillSystem - Sistema de Habilidades
 * Arquivo: server/systems/SkillSystem.js
 * Define todas as skills e cálculos de dano
 */

class SkillSystem {
    constructor() {
        this.skills = {
            // Guerreiro
            slash: {
                id: "slash",
                name: "Corte Rápido",
                class: "warrior",
                type: "physical",
                cooldown: 2,
                manaCost: 0,
                description: "Ataque básico com espada",
                scaling: { STR: 1.5 },
                baseDamage: 10
            },
            shieldBash: {
                id: "shieldBash",
                name: "Investida Escudada",
                class: "warrior",
                type: "physical",
                cooldown: 5,
                manaCost: 0,
                description: "Avança com escudo e atordoa",
                scaling: { STR: 1.0, FIS: 1.0 },
                baseDamage: 15,
                effects: { stun: 1.5 }
            },
            
            // Mago
            fireball: {
                id: "fireball",
                name: "Bola de Fogo",
                class: "mage",
                type: "magic",
                cooldown: 3,
                manaCost: 10,
                description: "Projetil de fogo explosivo",
                scaling: { INT: 2.0 },
                baseDamage: 20,
                effects: { burn: 3 }
            },
            iceBolt: {
                id: "iceBolt",
                name: "Lança de Gelo",
                class: "mage",
                type: "magic",
                cooldown: 2,
                manaCost: 8,
                description: "Projétil de gelo que desacelera",
                scaling: { INT: 1.5 },
                baseDamage: 12,
                effects: { slow: 2 }
            },
            
            // Arqueiro
            quickShot: {
                id: "quickShot",
                name: "Tiro Rápido",
                class: "archer",
                type: "physical",
                cooldown: 1.5,
                manaCost: 0,
                description: "Disparo rápido de flecha",
                scaling: { AGI: 1.8 },
                baseDamage: 12
            },
            powerShot: {
                id: "powerShot",
                name: "Tiro Potente",
                class: "archer",
                type: "physical",
                cooldown: 4,
                manaCost: 5,
                description: "Disparo carregado com dano aumentado",
                scaling: { AGI: 2.2, STR: 0.5 },
                baseDamage: 25,
                effects: { knockback: 1 }
            },
            
            // Sacerdote
            heal: {
                id: "heal",
                name: "Cura Divina",
                class: "priest",
                type: "heal",
                cooldown: 3,
                manaCost: 15,
                description: "Restaura HP do alvo",
                scaling: { SAB: 2.0 },
                baseHeal: 30
            },
            smite: {
                id: "smite",
                name: "Castigo Sagrado",
                class: "priest",
                type: "magic",
                cooldown: 4,
                manaCost: 12,
                description: "Dano sagrado contra inimigos",
                scaling: { SAB: 1.8 },
                baseDamage: 18
            },
            
            // Skills básicas (todas as classes)
            basicAttack: {
                id: "basicAttack",
                name: "Ataque Básico",
                class: "all",
                type: "physical",
                cooldown: 1,
                manaCost: 0,
                description: "Ataque básico com arma",
                scaling: { STR: 1.0, AGI: 0.5 },
                baseDamage: 5
            }
        };

        this.activeCooldowns = new Map();
        console.log('✅ SkillSystem inicializado com', Object.keys(this.skills).length, 'skills');
    }

    /**
     * Calcula dano de uma skill
     * @param {object} skill - Dados da skill
     * @param {object} player - Jogador usando a skill
     * @returns {number} Dano calculado
     */
    calculateDamage(skill, player) {
        if (!skill || !player || !player.stats) return 0;

        let damage = skill.baseDamage || 0;

        // Aplicar scaling dos stats
        for (const stat in skill.scaling) {
            if (player.stats[stat]) {
                damage += player.stats[stat] * skill.scaling[stat];
            }
        }

        // Adicionar variação aleatória (±10%)
        const variance = 0.9 + Math.random() * 0.2;
        damage = Math.floor(damage * variance);

        return damage;
    }

    /**
     * Calcula cura de uma skill
     * @param {object} skill - Dados da skill
     * @param {object} player - Jogador usando a skill
     * @returns {number} Cura calculada
     */
    calculateHeal(skill, player) {
        if (!skill || !player || !player.stats) return 0;

        let heal = skill.baseHeal || 0;

        for (const stat in skill.scaling) {
            if (player.stats[stat]) {
                heal += player.stats[stat] * skill.scaling[stat];
            }
        }

        return Math.floor(heal * (0.9 + Math.random() * 0.2));
    }

    /**
     * Usa uma skill
     * @param {object} player - Jogador
     * @param {string} skillId - ID da skill
     * @param {object} target - Alvo (opcional)
     * @returns {object} Resultado do uso
     */
    useSkill(player, skillId, target = null) {
        const skill = this.skills[skillId];
        if (!skill) {
            return { error: "Skill não encontrada" };
        }

        // Verificar cooldown
        const cooldownKey = `${player.id}-${skillId}`;
        if (this.activeCooldowns.has(cooldownKey)) {
            const remaining = this.activeCooldowns.get(cooldownKey) - Date.now();
            if (remaining > 0) {
                return { error: `Cooldown: ${Math.ceil(remaining / 1000)}s` };
            }
        }

        // Verificar mana
        if (player.mana < skill.manaCost) {
            return { error: "Mana insuficiente" };
        }

        // Consumir mana
        player.mana -= skill.manaCost;

        // Aplicar cooldown
        this.activeCooldowns.set(cooldownKey, Date.now() + (skill.cooldown * 1000));

        // Calcular resultado
        let result = {
            skillId: skill.id,
            skillName: skill.name,
            type: skill.type,
            manaCost: skill.manaCost,
            effects: skill.effects || {}
        };

        if (skill.type === "heal") {
            result.heal = this.calculateHeal(skill, player);
        } else {
            result.damage = this.calculateDamage(skill, player);
        }

        return result;
    }

    /**
     * Retorna skills disponíveis para uma classe
     * @param {string} classId - ID da classe
     * @returns {array} Lista de skills
     */
    getSkillsForClass(classId) {
        return Object.values(this.skills).filter(skill => 
            skill.class === classId || skill.class === "all"
        );
    }

    /**
     * Limpa cooldowns expirados
     */
    cleanupCooldowns() {
        const now = Date.now();
        for (const [key, expireTime] of this.activeCooldowns.entries()) {
            if (expireTime <= now) {
                this.activeCooldowns.delete(key);
            }
        }
    }
}

module.exports = SkillSystem;
