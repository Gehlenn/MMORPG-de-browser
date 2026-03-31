/**
 * 🌟 TalentSystem - Sistema de Talentos
 * Arquivo: server/systems/TalentSystem.js
 * Gerencia árvore de talentos por classe
 */

class TalentSystem {
    constructor() {
        this.talentTrees = {
            warrior: {
                name: "Guerreiro",
                lines: [
                    {
                        name: "Linha de Força",
                        levelReq: 40,
                        talents: [
                            { id: "str_boost_1", name: "Força Extra I", bonus: { STR: 5 }, cost: 1 },
                            { id: "str_boost_2", name: "Força Extra II", bonus: { STR: 8 }, cost: 1, req: "str_boost_1" },
                            { id: "str_boost_3", name: "Força Extra III", bonus: { STR: 12 }, cost: 1, req: "str_boost_2" }
                        ]
                    },
                    {
                        name: "Linha de Defesa",
                        levelReq: 50,
                        talents: [
                            { id: "def_boost_1", name: "Armadura Reforçada I", bonus: { FIS: 5 }, cost: 1 },
                            { id: "def_boost_2", name: "Armadura Reforçada II", bonus: { FIS: 8 }, cost: 1, req: "def_boost_1" },
                            { id: "def_boost_3", name: "Armadura Reforçada III", bonus: { FIS: 12 }, cost: 1, req: "def_boost_2" }
                        ]
                    }
                ]
            },
            mage: {
                name: "Mago",
                lines: [
                    {
                        name: "Linha Arcana",
                        levelReq: 40,
                        talents: [
                            { id: "int_boost_1", name: "Inteligência Arcana I", bonus: { INT: 5 }, cost: 1 },
                            { id: "int_boost_2", name: "Inteligência Arcana II", bonus: { INT: 8 }, cost: 1, req: "int_boost_1" },
                            { id: "int_boost_3", name: "Inteligência Arcana III", bonus: { INT: 12 }, cost: 1, req: "int_boost_2" }
                        ]
                    },
                    {
                        name: "Linha de Sabedoria",
                        levelReq: 50,
                        talents: [
                            { id: "sab_boost_1", name: "Sabedoria Mística I", bonus: { SAB: 5 }, cost: 1 },
                            { id: "sab_boost_2", name: "Sabedoria Mística II", bonus: { SAB: 8 }, cost: 1, req: "sab_boost_1" },
                            { id: "sab_boost_3", name: "Sabedoria Mística III", bonus: { SAB: 12 }, cost: 1, req: "sab_boost_2" }
                        ]
                    }
                ]
            }
        };

        // Jogadores e seus talentos
        this.playerTalents = new Map();
        
        console.log('✅ TalentSystem inicializado com', Object.keys(this.talentTrees).length, 'árvores de talentos');
    }

    /**
     * Obtém árvore de talentos de uma classe
     * @param {string} classId - ID da classe
     * @returns {object} Árvore de talentos
     */
    getTalentTree(classId) {
        return this.talentTrees[classId] || null;
    }

    /**
     * Aplica talentos ao jogador
     * @param {object} player - Objeto do jogador
     */
    applyTalents(player) {
        if (!player || !player.class) return;

        const talents = this.playerTalents.get(player.id);
        if (!talents || talents.length === 0) return;

        const tree = this.talentTrees[player.class];
        if (!tree) return;

        // Aplicar cada talento
        for (const talentId of talents) {
            this.applyTalent(player, talentId);
        }

        console.log(`✅ ${talents.length} talentos aplicados ao jogador ${player.name || player.id}`);
    }

    /**
     * Aplica um talento específico
     * @param {object} player - Jogador
     * @param {string} talentId - ID do talento
     */
    applyTalent(player, talentId) {
        const tree = this.talentTrees[player.class];
        if (!tree) return;

        // Procurar talento na árvore
        let talent = null;
        for (const line of tree.lines) {
            const found = line.talents.find(t => t.id === talentId);
            if (found) {
                talent = found;
                break;
            }
        }

        if (!talent) return;

        // Aplicar bônus
        if (talent.bonus) {
            for (const stat in talent.bonus) {
                if (player.stats[stat] !== undefined) {
                    player.stats[stat] += talent.bonus[stat];
                }
            }
        }

        // Bônus especiais
        if (talent.specialBonus) {
            if (talent.specialBonus.hp) {
                player.maxHp += talent.specialBonus.hp;
            }
            if (talent.specialBonus.mana) {
                player.maxMana += talent.specialBonus.mana;
            }
        }
    }

    /**
     * Adiciona um talento ao jogador
     * @param {string} playerId - ID do jogador
     * @param {string} talentId - ID do talento
     * @returns {boolean} Sucesso
     */
    addTalent(playerId, talentId) {
        if (!this.playerTalents.has(playerId)) {
            this.playerTalents.set(playerId, []);
        }

        const talents = this.playerTalents.get(playerId);
        if (talents.includes(talentId)) {
            return false; // Já tem
        }

        talents.push(talentId);
        return true;
    }

    /**
     * Remove um talento do jogador
     * @param {string} playerId - ID do jogador
     * @param {string} talentId - ID do talento
     */
    removeTalent(playerId, talentId) {
        const talents = this.playerTalents.get(playerId);
        if (!talents) return;

        const index = talents.indexOf(talentId);
        if (index > -1) {
            talents.splice(index, 1);
        }
    }

    /**
     * Obtém talentos de um jogador
     * @param {string} playerId - ID do jogador
     * @returns {array} Lista de talentos
     */
    getPlayerTalents(playerId) {
        return this.playerTalents.get(playerId) || [];
    }

    /**
     * Verifica se jogador pode pegar um talento
     * @param {object} player - Jogador
     * @param {string} talentId - ID do talento
     * @returns {boolean} Pode pegar
     */
    canGetTalent(player, talentId) {
        const tree = this.talentTrees[player.class];
        if (!tree) return false;

        // Procurar talento
        let talent = null;
        let lineIndex = -1;
        
        for (let i = 0; i < tree.lines.length; i++) {
            const found = tree.lines[i].talents.find(t => t.id === talentId);
            if (found) {
                talent = found;
                lineIndex = i;
                break;
            }
        }

        if (!talent) return false;

        // Verificar level
        const line = tree.lines[lineIndex];
        if (player.level < line.levelReq) {
            return false;
        }

        // Verificar requisito
        if (talent.req) {
            const playerTalents = this.getPlayerTalents(player.id);
            if (!playerTalents.includes(talent.req)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Reseta todos os talentos de um jogador
     * @param {string} playerId - ID do jogador
     */
    resetTalents(playerId) {
        this.playerTalents.set(playerId, []);
        console.log(`🔄 Talentos resetados para jogador ${playerId}`);
    }

    /**
     * Lista todas as árvores disponíveis
     * @returns {array} Lista de árvores
     */
    getAllTrees() {
        return Object.keys(this.talentTrees).map(key => ({
            id: key,
            name: this.talentTrees[key].name,
            lines: this.talentTrees[key].lines.length
        }));
    }
}

module.exports = TalentSystem;
