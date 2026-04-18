/**
 * 🎮 ClassSystem - Sistema Central de Classes
 * Arquivo: server/systems/ClassSystem.js
 * Define todas as classes base com stats e roles
 */

class ClassSystem {
    constructor() {
        this.classes = {
            warrior: {
                name: "Guerreiro",
                baseStats: {
                    STR: 20,  // Força
                    AGI: 10,  // Agilidade
                    INT: 5,   // Inteligência
                    VIT: 15,  // Vitalidade
                    SAB: 8,   // Sabedoria
                    FIS: 12   // Física
                },
                role: "tank/melee",
                primary: "STR",
                secondary: "VIT",
                description: "Guerreiro versátil, especialista em combate corpo a corpo e proteção"
            },
            mage: {
                name: "Mago",
                baseStats: {
                    STR: 5,
                    AGI: 12,
                    INT: 25,
                    VIT: 5,
                    SAB: 15,
                    FIS: 10
                },
                role: "ranged/magic",
                primary: "INT",
                secondary: "SAB",
                description: "Mestre das artes arcanas, domina magias devastadoras"
            },
            archer: {
                name: "Arqueiro",
                baseStats: {
                    STR: 12,
                    AGI: 22,
                    INT: 8,
                    VIT: 10,
                    SAB: 10,
                    FIS: 8
                },
                role: "ranged/physical",
                primary: "AGI",
                secondary: "STR",
                description: "Especialista em ataques à distância com precisão mortal"
            },
            priest: {
                name: "Sacerdote",
                baseStats: {
                    STR: 8,
                    AGI: 8,
                    INT: 18,
                    VIT: 12,
                    SAB: 22,
                    FIS: 5
                },
                role: "support/healer",
                primary: "SAB",
                secondary: "INT",
                description: "Devoto divino, cura aliados e banish inimigos"
            },
            druid: {
                name: "Druida",
                baseStats: {
                    STR: 14,
                    AGI: 15,
                    INT: 12,
                    VIT: 14,
                    SAB: 14,
                    FIS: 12
                },
                role: "hybrid/nature",
                primary: "SAB",
                secondary: "AGI",
                description: "Guardião da natureza, domina formas selvagens e magia natural"
            },
            rogue: {
                name: "Ladino",
                baseStats: {
                    STR: 12,
                    AGI: 24,
                    INT: 8,
                    VIT: 8,
                    SAB: 10,
                    FIS: 8
                },
                role: "melee/stealth",
                primary: "AGI",
                secondary: "STR",
                description: "Mestre da furtividade, ataca das sombras com precisão letal"
            },
            warlock: {
                name: "Bruxo",
                baseStats: {
                    STR: 8,
                    AGI: 10,
                    INT: 22,
                    VIT: 8,
                    SAB: 18,
                    FIS: 8
                },
                role: "ranged/dot",
                primary: "INT",
                secondary: "SAB",
                description: "Manipulador de forças sombrias, aplica DoTs e maldições"
            },
            fighter: {
                name: "Lutador",
                baseStats: {
                    STR: 18,
                    AGI: 16,
                    INT: 8,
                    VIT: 16,
                    SAB: 10,
                    FIS: 15
                },
                role: "melee/combo",
                primary: "STR",
                secondary: "FIS",
                description: "Especialista em combos corpo a corpo, dominador de arenas"
            }
        };

        console.log('✅ ClassSystem inicializado com', Object.keys(this.classes).length, 'classes');
    }

    /**
     * Retorna dados de uma classe específica
     * @param {string} classId - ID da classe
     * @returns {object} Dados da classe ou null
     */
    getClassData(classId) {
        return this.classes[classId] || null;
    }

    /**
     * Aplica classe a um jogador
     * @param {object} player - Objeto do jogador
     * @param {string} classId - ID da classe
     */
    applyClassToPlayer(player, classId) {
        const data = this.classes[classId];
        if (!data) {
            console.error(`❌ Classe ${classId} não encontrada`);
            return;
        }

        player.class = classId;
        player.className = data.name;
        player.role = data.role;
        player.stats = { ...data.baseStats };
        player.level = 1;
        player.xp = 0;
        
        // Calcular HP e Mana base
        player.maxHp = player.stats.VIT * 10;
        player.hp = player.maxHp;
        player.maxMana = player.stats.INT * 8;
        player.mana = player.maxMana;

        console.log(`✅ Classe ${data.name} aplicada ao jogador`);
    }

    /**
     * Lista todas as classes disponíveis
     * @returns {array} Lista de classes
     */
    getAllClasses() {
        return Object.keys(this.classes).map(key => ({
            id: key,
            name: this.classes[key].name,
            role: this.classes[key].role,
            primary: this.classes[key].primary,
            description: this.classes[key].description
        }));
    }
}

module.exports = ClassSystem;
