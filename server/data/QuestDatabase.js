/**
 * QuestDatabase - Banco de dados de quests
 * 
 * Definições de todas as quests disponíveis no jogo.
 * Organizadas por zona e nível.
 */

const QuestDatabase = {
    // ===================== ZONA: VERDANTIS (Níveis 1-10) =====================
    verdantis: {
        startingQuests: [
            {
                id: 'verdantis_welcome',
                title: 'Bem-vindo a Verdantis',
                description: 'Fale com o Guardião da Vila para receber suas instruções iniciais.',
                type: 'talk',
                requiredLevel: 1,
                npcId: 'guardian_elder',
                zone: 'verdantis',
                objectives: [
                    { description: 'Fale com o Guardião da Vila', target: 1, type: 'talk' }
                ],
                rewards: {
                    xp: 50,
                    gold: 10,
                    items: [
                        { id: 'starter_potion', name: 'Poção Inicial', icon: '🧪', quantity: 3, stackable: true }
                    ]
                },
                nextQuest: 'verdantis_slimes'
            },
            {
                id: 'verdantis_slimes',
                title: 'Problema com Slimes',
                description: 'Os Slimes estão invadindo os arredores da vila. Elimine 5 deles para nos ajudar.',
                type: 'kill',
                requiredLevel: 1,
                npcId: 'guardian_elder',
                zone: 'verdantis',
                objectives: [
                    { description: 'Elimine Slimes', target: 5, type: 'kill', mobType: 'slime' }
                ],
                rewards: {
                    xp: 100,
                    gold: 25,
                    items: [
                        { id: 'rusty_sword', name: 'Espada Enferrujada', icon: '⚔️', equipable: true, equipSlot: 'weapon', rarity: 'common' }
                    ]
                },
                nextQuest: 'verdantis_goblins'
            },
            {
                id: 'verdantis_goblins',
                title: 'Ameaça Goblin',
                description: 'Goblins foram vistos roubando suprimentos. Elimine 3 Goblins e recupere os suprimentos.',
                type: 'kill',
                requiredLevel: 2,
                npcId: 'village_merchant',
                zone: 'verdantis',
                objectives: [
                    { description: 'Elimine Goblins', target: 3, type: 'kill', mobType: 'goblin' }
                ],
                rewards: {
                    xp: 150,
                    gold: 40,
                    items: [
                        { id: 'leather_vest', name: 'Colete de Couro', icon: '🛡️', equipable: true, equipSlot: 'armor', rarity: 'common' }
                    ]
                },
                nextQuest: 'verdantis_herbs'
            },
            {
                id: 'verdantis_herbs',
                title: 'Ervas Medicinais',
                description: 'Preciso de ervas para fazer poções. Colete 8 Ervas Verdes nas redondezas.',
                type: 'collect',
                requiredLevel: 2,
                npcId: 'village_healer',
                zone: 'verdantis',
                objectives: [
                    { description: 'Colete Ervas Verdes', target: 8, type: 'collect', itemId: 'green_herb' }
                ],
                rewards: {
                    xp: 120,
                    gold: 30,
                    items: [
                        { id: 'health_potion', name: 'Poção de Vida', icon: '❤️', quantity: 5, stackable: true, consumable: true, effect: { hp: 50 } }
                    ]
                },
                nextQuest: 'verdantis_wolves'
            },
            {
                id: 'verdantis_wolves',
                title: 'Lobos Selvagens',
                description: 'Os lobos estão atacando os viajantes. Elimine 4 Lobos para tornar a estrada segura.',
                type: 'kill',
                requiredLevel: 3,
                npcId: 'road_guard',
                zone: 'verdantis',
                objectives: [
                    { description: 'Elimine Lobos', target: 4, type: 'kill', mobType: 'wolf' }
                ],
                rewards: {
                    xp: 200,
                    gold: 60,
                    items: [
                        { id: 'wolf_fang', name: 'Presa de Lobo', icon: '🦷', quantity: 2, stackable: true, rarity: 'uncommon' }
                    ]
                },
                nextQuest: 'verdantis_orc_camp'
            },
            {
                id: 'verdantis_orc_camp',
                title: 'Acampamento Orc',
                description: 'Um acampamento orc está muito próximo da vila. Infiltre-se e elimine 2 Orcs.',
                type: 'kill',
                requiredLevel: 4,
                npcId: 'guardian_elder',
                zone: 'verdantis',
                difficulty: 'medium',
                objectives: [
                    { description: 'Elimine Orcs', target: 2, type: 'kill', mobType: 'orc' }
                ],
                rewards: {
                    xp: 300,
                    gold: 100,
                    items: [
                        { id: 'iron_helmet', name: 'Capacete de Ferro', icon: '⛑️', equipable: true, equipSlot: 'helmet', rarity: 'uncommon', stats: { defense: 5 } }
                    ]
                },
                nextQuest: 'verdantis_exploration'
            },
            {
                id: 'verdantis_exploration',
                title: 'Explorador de Verdantis',
                description: 'Descubra os pontos de interesse de Verdantis. Visite a Cachoeira, a Floresta Sombria e a Colina Anciã.',
                type: 'discover',
                requiredLevel: 3,
                npcId: 'cartographer',
                zone: 'verdantis',
                objectives: [
                    { description: 'Descubra a Cachoeira', target: 1, type: 'discover', locationId: 'verdantis_waterfall' },
                    { description: 'Descubra a Floresta Sombria', target: 1, type: 'discover', locationId: 'dark_forest' },
                    { description: 'Descubra a Colina Anciã', target: 1, type: 'discover', locationId: 'ancient_hill' }
                ],
                rewards: {
                    xp: 250,
                    gold: 75,
                    items: [
                        { id: 'explorer_ring', name: 'Anel do Explorador', icon: '💍', equipable: true, equipSlot: 'accessory1', rarity: 'rare', stats: { speed: 5 } }
                    ]
                }
            }
        ],
        
        // Quests diárias
        dailyQuests: [
            {
                id: 'verdantis_daily_slimes',
                title: '[Diária] Extermínio de Slimes',
                description: 'Elimine 10 Slimes para manter a vila segura.',
                type: 'kill',
                requiredLevel: 1,
                npcId: 'guardian_elder',
                zone: 'verdantis',
                isDaily: true,
                resetTime: '00:00',
                objectives: [
                    { description: 'Elimine Slimes', target: 10, type: 'kill', mobType: 'slime' }
                ],
                rewards: {
                    xp: 100,
                    gold: 50
                }
            },
            {
                id: 'verdantis_daily_goblins',
                title: '[Diária] Caça aos Goblins',
                description: 'Os goblins estão causando problemas novamente. Elimine 5 deles.',
                type: 'kill',
                requiredLevel: 2,
                npcId: 'road_guard',
                zone: 'verdantis',
                isDaily: true,
                resetTime: '00:00',
                objectives: [
                    { description: 'Elimine Goblins', target: 5, type: 'kill', mobType: 'goblin' }
                ],
                rewards: {
                    xp: 150,
                    gold: 75
                }
            }
        ]
    },
    
    // ===================== ZONA: ELDORIA (Níveis 10-20) =====================
    eldoria: {
        startingQuests: [
            {
                id: 'eldoria_welcome',
                title: 'Chegada em Eldoria',
                description: 'Bem-vindo ao Reino Central! Apresente-se ao Comandante da Guarda.',
                type: 'talk',
                requiredLevel: 10,
                npcId: 'guard_commander',
                zone: 'eldoria',
                objectives: [
                    { description: 'Fale com o Comandante da Guarda', target: 1, type: 'talk' }
                ],
                rewards: {
                    xp: 300,
                    gold: 100,
                    items: [
                        { id: 'eldoria_map', name: 'Mapa de Eldoria', icon: '🗺️', usable: true }
                    ]
                },
                nextQuest: 'eldoria_bandits'
            },
            {
                id: 'eldoria_bandits',
                title: 'Problema com Bandidos',
                description: 'Bandidos estão assaltando caravanas na estrada. Elimine 6 Bandidos.',
                type: 'kill',
                requiredLevel: 10,
                npcId: 'guard_commander',
                zone: 'eldoria',
                objectives: [
                    { description: 'Elimine Bandidos', target: 6, type: 'kill', mobType: 'bandit' }
                ],
                rewards: {
                    xp: 400,
                    gold: 150
                },
                nextQuest: 'eldoria_cave_spiders'
            },
            {
                id: 'eldoria_cave_spiders',
                title: 'Infestação na Caverna',
                description: 'Aranhas gigantes invadiram a caverna sul. Elimine 5 Aranhas Gigantes.',
                type: 'kill',
                requiredLevel: 12,
                npcId: 'mine_foreman',
                zone: 'eldoria',
                difficulty: 'medium',
                objectives: [
                    { description: 'Elimine Aranhas Gigantes', target: 5, type: 'kill', mobType: 'giant_spider' }
                ],
                rewards: {
                    xp: 500,
                    gold: 200,
                    items: [
                        { id: 'spider_silk', name: 'Seda de Aranha', icon: '🕸️', quantity: 3, stackable: true, rarity: 'uncommon' }
                    ]
                }
            }
        ],
        
        dailyQuests: [
            {
                id: 'eldoria_daily_patrol',
                title: '[Diária] Patrulha da Guarda',
                description: 'Ajude a patrulhar as estradas de Eldoria. Elimine qualquer ameaça.',
                type: 'kill',
                requiredLevel: 10,
                npcId: 'guard_commander',
                zone: 'eldoria',
                isDaily: true,
                objectives: [
                    { description: 'Elimine inimigos', target: 8, type: 'kill', mobTypes: ['bandit', 'wolf', 'thief'] }
                ],
                rewards: {
                    xp: 400,
                    gold: 200
                }
            }
        ]
    },
    
    // ===================== ZONA: AURÉLIA (Níveis 20-30) =====================
    aurelia: {
        startingQuests: [
            {
                id: 'aurelia_welcome',
                title: 'Bem-vindo ao Deserto Dourado',
                description: 'Bem-vindo a Aurélia! Fale com o Sheik local para orientações.',
                type: 'talk',
                requiredLevel: 20,
                npcId: 'aurelia_sheik',
                zone: 'aurelia',
                objectives: [
                    { description: 'Fale com o Sheik', target: 1, type: 'talk' }
                ],
                rewards: {
                    xp: 600,
                    gold: 300
                },
                nextQuest: 'aurelia_scorpions'
            },
            {
                id: 'aurelia_scorpions',
                title: 'Escorpiões do Deserto',
                description: 'Escorpiões gigantes estão atacando viajantes. Elimine 6 Escorpiões do Deserto.',
                type: 'kill',
                requiredLevel: 20,
                npcId: 'desert_guide',
                zone: 'aurelia',
                objectives: [
                    { description: 'Elimine Escorpiões', target: 6, type: 'kill', mobType: 'desert_scorpion' }
                ],
                rewards: {
                    xp: 700,
                    gold: 350,
                    items: [
                        { id: 'scorpion_venom', name: 'Veneno de Escorpião', icon: '🧪', quantity: 2, stackable: true, rarity: 'rare' }
                    ]
                }
            }
        ],
        
        dailyQuests: [
            {
                id: 'aurelia_daily_oasis',
                title: '[Diária] Proteção do Oásis',
                description: 'Proteja o oásis de criaturas hostis.',
                type: 'kill',
                requiredLevel: 20,
                npcId: 'oasis_guardian',
                zone: 'aurelia',
                isDaily: true,
                objectives: [
                    { description: 'Elimine criaturas do deserto', target: 10, type: 'kill', mobTypes: ['desert_scorpion', 'sand_worm', 'desert_bandit'] }
                ],
                rewards: {
                    xp: 800,
                    gold: 400
                }
            }
        ]
    }
};

// Funções auxiliares
QuestDatabase.getQuestById = function(questId) {
    for (const zone of Object.values(this)) {
        if (zone.startingQuests) {
            const quest = zone.startingQuests.find(q => q.id === questId);
            if (quest) return quest;
        }
        if (zone.dailyQuests) {
            const quest = zone.dailyQuests.find(q => q.id === questId);
            if (quest) return quest;
        }
    }
    return null;
};

QuestDatabase.getQuestsForZone = function(zoneId, playerLevel = 1) {
    const zone = this[zoneId];
    if (!zone) return [];
    
    const quests = [];
    
    if (zone.startingQuests) {
        quests.push(...zone.startingQuests.filter(q => playerLevel >= q.requiredLevel));
    }
    
    return quests;
};

QuestDatabase.getDailyQuests = function(zoneId, playerLevel = 1) {
    const zone = this[zoneId];
    if (!zone || !zone.dailyQuests) return [];
    
    return zone.dailyQuests.filter(q => playerLevel >= q.requiredLevel);
};

QuestDatabase.getAvailableQuests = function(npcId, playerLevel = 1, completedQuests = []) {
    const available = [];
    
    for (const zone of Object.values(this)) {
        if (zone.startingQuests) {
            for (const quest of zone.startingQuests) {
                // Verificar se é para este NPC
                if (quest.npcId !== npcId) continue;
                
                // Verificar nível
                if (playerLevel < quest.requiredLevel) continue;
                
                // Verificar se já foi completada
                if (completedQuests.includes(quest.id)) continue;
                
                // Verificar se tem quest anterior necessária
                if (quest.prevQuest && !completedQuests.includes(quest.prevQuest)) continue;
                
                available.push(quest);
            }
        }
    }
    
    return available;
};

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestDatabase;
} else {
    window.QuestDatabase = QuestDatabase;
}
