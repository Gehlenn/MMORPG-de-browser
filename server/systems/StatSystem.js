/**
 * 📊 StatSystem - Sistema de Cálculo de Stats
 * Arquivo: server/systems/StatSystem.js
 * Calcula atributos derivados dos stats base
 */

class StatSystem {
    /**
     * Calcula stats finais baseados nos atributos do jogador
     * @param {object} player - Objeto do jogador com stats
     * @returns {object} Stats calculados para combate
     */
    static calculateFinalStats(player) {
        if (!player || !player.stats) {
            console.error('❌ Player ou stats não definidos');
            return null;
        }

        const stats = player.stats;

        return {
            // Stats de combate
            attack: Math.floor(stats.STR * 2 + stats.AGI * 0.5),
            defense: Math.floor(stats.FIS * 1.5 + stats.VIT * 0.5),
            magicAttack: Math.floor(stats.INT * 2 + stats.SAB * 0.5),
            magicDefense: Math.floor(stats.SAB * 1.5 + stats.INT * 0.5),
            
            // Stats de sobrevivência
            hp: Math.floor(stats.VIT * 10 + stats.STR * 2),
            mana: Math.floor(stats.INT * 8 + stats.SAB * 2),
            hpRegen: Math.floor(stats.VIT * 0.1 + 1),
            manaRegen: Math.floor(stats.SAB * 0.1 + 1),
            
            // Stats secundários
            critChance: Math.min(stats.AGI * 0.1, 50), // Cap 50%
            critDamage: 1.5 + (stats.AGI * 0.005),
            dodge: Math.min(stats.AGI * 0.05, 30), // Cap 30%
            block: Math.min(stats.FIS * 0.08, 25), // Cap 25%
            parry: Math.min(stats.STR * 0.05, 20), // Cap 20%
            
            // Stats de movimento
            moveSpeed: 100 + (stats.AGI * 0.2),
            attackSpeed: 100 + (stats.AGI * 0.5),
            
            // Stats de carry
            carryCapacity: stats.STR * 5 + stats.FIS * 2
        };
    }

    /**
     * Aplica stats calculados ao jogador
     * @param {object} player - Objeto do jogador
     */
    static applyStatsToPlayer(player) {
        const finalStats = this.calculateFinalStats(player);
        if (!finalStats) return;

        // Atualizar max HP e Mana se necessário
        if (finalStats.hp > player.maxHp) {
            player.maxHp = finalStats.hp;
            player.hp = player.maxHp;
        }
        
        if (finalStats.mana > player.maxMana) {
            player.maxMana = finalStats.mana;
            player.mana = player.maxMana;
        }

        // Armazenar stats calculados
        player.finalStats = finalStats;
        
        console.log(`✅ Stats aplicados ao jogador: ATK ${finalStats.attack}, DEF ${finalStats.defense}`);
    }

    /**
     * Level up - aumenta stats base
     * @param {object} player - Objeto do jogador
     */
    static levelUp(player) {
        if (!player.stats) return;

        // Aumento por stat primário e secundário
        const classData = player.classData;
        if (classData) {
            const primaryStat = classData.primary;
            const secondaryStat = classData.secondary;
            
            player.stats[primaryStat] += 3;
            player.stats[secondaryStat] += 2;
            
            // Outros stats aumentam 1
            Object.keys(player.stats).forEach(stat => {
                if (stat !== primaryStat && stat !== secondaryStat) {
                    player.stats[stat] += 1;
                }
            });
        }

        player.level++;
        console.log(`🆙 Jogador subiu para nível ${player.level}`);
        
        // Recalcular stats
        this.applyStatsToPlayer(player);
    }
}

module.exports = StatSystem;
