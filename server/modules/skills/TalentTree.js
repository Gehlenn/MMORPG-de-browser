/**
 * TalentTree - Sistema de Talent Trees
 * Gerencia árvores de talentos para cada classe
 */

const talentTrees = {
    // Warrior Talent Tree
    warrior: {
        name: 'Warrior Talents',
        description: 'Master the art of combat and defense',
        maxPoints: 30,
        tierPoints: [5, 10, 15, 20, 25], // Pontos necessários por tier
        
        tier1: [
            {
                id: 'power_strike',
                name: 'Power Strike',
                description: 'Increases damage of basic attacks by 5%',
                icon: 'power_strike.png',
                maxRank: 3,
                currentRank: 0,
                cost: 1,
                effects: {
                    attack: 5,
                    bonusDamage: 5
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'defensive_stance',
                name: 'Defensive Stance',
                description: 'Increases defense by 5%',
                icon: 'defensive_stance.png',
                maxRank: 3,
                currentRank: 0,
                cost: 1,
                effects: {
                    defense: 5,
                    armor: 5
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'improved_slash',
                name: 'Improved Slash',
                description: 'Reduces cooldown of Slash by 0.5s',
                icon: 'improved_slash.png',
                maxRank: 2,
                currentRank: 0,
                cost: 1,
                effects: {
                    cooldownReduction: 500
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            }
        ],
        
        tier2: [
            {
                id: 'whirlwind',
                name: 'Whirlwind',
                description: 'Unlock Whirlwind ability',
                icon: 'whirlwind.png',
                maxRank: 1,
                currentRank: 0,
                cost: 2,
                unlockSkill: 'whirlwind',
                effects: {
                    unlockSkill: 'whirlwind'
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'blood_rage',
                name: 'Blood Rage',
                description: 'Increases attack speed by 10% but reduces defense',
                icon: 'blood_rage.png',
                maxRank: 2,
                currentRank: 0,
                cost: 2,
                effects: {
                    attackSpeed: 10,
                    defense: -5
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'armor_mastery',
                name: 'Armor Mastery',
                description: 'Increases armor effectiveness by 15%',
                icon: 'armor_mastery.png',
                maxRank: 3,
                currentRank: 0,
                cost: 2,
                effects: {
                    armorBonus: 15
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            }
        ],
        
        tier3: [
            {
                id: 'berserker_rage',
                name: 'Berserker Rage',
                description: 'Increases damage by 20% when below 30% health',
                icon: 'berserker_rage.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                effects: {
                    lowHealthBonus: 20,
                    threshold: 30
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'shield_wall',
                name: 'Shield Wall',
                description: 'Reduces all damage taken by 25% for 10s',
                icon: 'shield_wall.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'shield_wall',
                effects: {
                    unlockSkill: 'shield_wall',
                    damageReduction: 25,
                    duration: 10000
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'weapon_mastery',
                name: 'Weapon Mastery',
                description: 'Increases weapon damage by 10%',
                icon: 'weapon_mastery.png',
                maxRank: 3,
                currentRank: 0,
                cost: 3,
                effects: {
                    weaponDamage: 10
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            }
        ]
    },
    
    // Mage Talent Tree
    mage: {
        name: 'Mage Talents',
        description: 'Harness the power of arcane magic',
        maxPoints: 30,
        tierPoints: [5, 10, 15, 20, 25],
        
        tier1: [
            {
                id: 'improved_fireball',
                name: 'Improved Fireball',
                description: 'Increases Fireball damage by 8%',
                icon: 'improved_fireball.png',
                maxRank: 3,
                currentRank: 0,
                cost: 1,
                effects: {
                    fireballDamage: 8
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'arcane_focus',
                name: 'Arcane Focus',
                description: 'Reduces mana cost of all spells by 5%',
                icon: 'arcane_focus.png',
                maxRank: 3,
                currentRank: 0,
                cost: 1,
                effects: {
                    manaCostReduction: 5
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'spell_mastery',
                name: 'Spell Mastery',
                description: 'Increases spell critical chance by 3%',
                icon: 'spell_mastery.png',
                maxRank: 2,
                currentRank: 0,
                cost: 1,
                effects: {
                    spellCritChance: 3
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            }
        ],
        
        tier2: [
            {
                id: 'frost_armor',
                name: 'Frost Armor',
                description: 'Unlock Frost Armor ability',
                icon: 'frost_armor.png',
                maxRank: 1,
                currentRank: 0,
                cost: 2,
                unlockSkill: 'frost_armor',
                effects: {
                    unlockSkill: 'frost_armor'
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'elemental_mastery',
                name: 'Elemental Mastery',
                description: 'Increases all elemental damage by 12%',
                icon: 'elemental_mastery.png',
                maxRank: 2,
                currentRank: 0,
                cost: 2,
                effects: {
                    elementalDamage: 12
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'mana_shield',
                name: 'Mana Shield',
                description: 'Absorb damage with mana instead of health',
                icon: 'mana_shield.png',
                maxRank: 1,
                currentRank: 0,
                cost: 2,
                unlockSkill: 'mana_shield',
                effects: {
                    unlockSkill: 'mana_shield'
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            }
        ],
        
        tier3: [
            {
                id: 'arcane_power',
                name: 'Arcane Power',
                description: 'Increases spell damage by 25% for 15s',
                icon: 'arcane_power.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'arcane_power',
                effects: {
                    unlockSkill: 'arcane_power',
                    spellDamageBonus: 25,
                    duration: 15000
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'ice_block',
                name: 'Ice Block',
                description: 'Become immune to all damage for 8s',
                icon: 'ice_block.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'ice_block',
                effects: {
                    unlockSkill: 'ice_block',
                    immunity: true,
                    duration: 8000
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'master_of_elements',
                name: 'Master of Elements',
                description: 'Spells have 20% chance to not consume mana',
                icon: 'master_of_elements.png',
                maxRank: 2,
                currentRank: 0,
                cost: 3,
                effects: {
                    freeCastChance: 20
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            }
        ]
    },
    
    // Hunter Talent Tree
    hunter: {
        name: 'Hunter Talents',
        description: 'Master ranged combat and beast companions',
        maxPoints: 30,
        tierPoints: [5, 10, 15, 20, 25],
        
        tier1: [
            {
                id: 'improved_marksmanship',
                name: 'Improved Marksmanship',
                description: 'Increases ranged damage by 6%',
                icon: 'improved_marksmanship.png',
                maxRank: 3,
                currentRank: 0,
                cost: 1,
                effects: {
                    rangedDamage: 6
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'lethal_shots',
                name: 'Lethal Shots',
                description: 'Increases ranged critical chance by 4%',
                icon: 'lethal_shots.png',
                maxRank: 3,
                currentRank: 0,
                cost: 1,
                effects: {
                    rangedCritChance: 4
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'beast_mastery',
                name: 'Beast Mastery',
                description: 'Pet damage increased by 10%',
                icon: 'beast_mastery.png',
                maxRank: 2,
                currentRank: 0,
                cost: 1,
                effects: {
                    petDamage: 10
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            }
        ],
        
        tier2: [
            {
                id: 'viper_sting',
                name: 'Viper Sting',
                description: 'Unlock Viper Sting ability',
                icon: 'viper_sting.png',
                maxRank: 1,
                currentRank: 0,
                cost: 2,
                unlockSkill: 'viper_sting',
                effects: {
                    unlockSkill: 'viper_sting'
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'rapid_fire',
                name: 'Rapid Fire',
                description: 'Unlock Rapid Fire ability',
                icon: 'rapid_fire.png',
                maxRank: 1,
                currentRank: 0,
                cost: 2,
                unlockSkill: 'rapid_fire',
                effects: {
                    unlockSkill: 'rapid_fire'
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'survivalist',
                name: 'Survivalist',
                description: 'Increases health and mana by 8%',
                icon: 'survivalist.png',
                maxRank: 2,
                currentRank: 0,
                cost: 2,
                effects: {
                    health: 8,
                    mana: 8
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            }
        ],
        
        tier3: [
            {
                id: 'bestial_wrath',
                name: 'Bestial Wrath',
                description: 'Pet damage increased by 50% for 18s',
                icon: 'bestial_wrath.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'bestial_wrath',
                effects: {
                    unlockSkill: 'bestial_wrath',
                    petDamageBonus: 50,
                    duration: 18000
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'trueshot_aura',
                name: 'Trueshot Aura',
                description: 'Party ranged damage increased by 15%',
                icon: 'trueshot_aura.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'trueshot_aura',
                effects: {
                    unlockSkill: 'trueshot_aura',
                    partyRangedDamage: 15
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'explosive_shot',
                name: 'Explosive Shot',
                description: 'Unlock Explosive Shot ability',
                icon: 'explosive_shot.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'explosive_shot',
                effects: {
                    unlockSkill: 'explosive_shot'
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            }
        ]
    },
    
    // Rogue Talent Tree
    rogue: {
        name: 'Rogue Talents',
        description: 'Master stealth, poisons, and assassination',
        maxPoints: 30,
        tierPoints: [5, 10, 15, 20, 25],
        
        tier1: [
            {
                id: 'improved_stealth',
                name: 'Improved Stealth',
                description: 'Stealth lasts 50% longer',
                icon: 'improved_stealth.png',
                maxRank: 2,
                currentRank: 0,
                cost: 1,
                effects: {
                    stealthDuration: 50
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'lethal_poisons',
                name: 'Lethal Poisons',
                description: 'Poison damage increased by 15%',
                icon: 'lethal_poisons.png',
                maxRank: 3,
                currentRank: 0,
                cost: 1,
                effects: {
                    poisonDamage: 15
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'improved_backstab',
                name: 'Improved Backstab',
                description: 'Backstab damage increased by 10%',
                icon: 'improved_backstab.png',
                maxRank: 2,
                currentRank: 0,
                cost: 1,
                effects: {
                    backstabDamage: 10
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            }
        ],
        
        tier2: [
            {
                id: 'vanish',
                name: 'Vanish',
                description: 'Unlock Vanish ability',
                icon: 'vanish.png',
                maxRank: 1,
                currentRank: 0,
                cost: 2,
                unlockSkill: 'vanish',
                effects: {
                    unlockSkill: 'vanish'
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'cold_blood',
                name: 'Cold Blood',
                description: 'Next attack is guaranteed critical',
                icon: 'cold_blood.png',
                maxRank: 1,
                currentRank: 0,
                cost: 2,
                unlockSkill: 'cold_blood',
                effects: {
                    unlockSkill: 'cold_blood'
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'agility_training',
                name: 'Agility Training',
                description: 'Increases agility by 8%',
                icon: 'agility_training.png',
                maxRank: 2,
                currentRank: 0,
                cost: 2,
                effects: {
                    agility: 8
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            }
        ],
        
        tier3: [
            {
                id: 'shadowstep',
                name: 'Shadowstep',
                description: 'Unlock Shadowstep ability',
                icon: 'shadowstep.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'shadowstep',
                effects: {
                    unlockSkill: 'shadowstep'
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'premeditation',
                name: 'Premeditation',
                description: 'Instantly gain 2 combo points',
                icon: 'premeditation.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'premeditation',
                effects: {
                    unlockSkill: 'premeditation',
                    comboPoints: 2
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'master_of_subtlety',
                name: 'Master of Subtlety',
                description: 'All damage increased by 15% while stealthed',
                icon: 'master_of_subtlety.png',
                maxRank: 2,
                currentRank: 0,
                cost: 3,
                effects: {
                    stealthDamage: 15
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            }
        ]
    },
    
    // Priest Talent Tree
    priest: {
        name: 'Priest Talents',
        description: 'Master holy magic and healing arts',
        maxPoints: 30,
        tierPoints: [5, 10, 15, 20, 25],
        
        tier1: [
            {
                id: 'improved_heal',
                name: 'Improved Heal',
                description: 'Healing increased by 8%',
                icon: 'improved_heal.png',
                maxRank: 3,
                currentRank: 0,
                cost: 1,
                effects: {
                    healing: 8
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'holy_focus',
                name: 'Holy Focus',
                description: 'Reduces mana cost of heals by 10%',
                icon: 'holy_focus.png',
                maxRank: 2,
                currentRank: 0,
                cost: 1,
                effects: {
                    healManaReduction: 10
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'divine_wisdom',
                name: 'Divine Wisdom',
                description: 'Increases mana regeneration by 20%',
                icon: 'divine_wisdom.png',
                maxRank: 2,
                currentRank: 0,
                cost: 1,
                effects: {
                    manaRegen: 20
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            }
        ],
        
        tier2: [
            {
                id: 'circle_of_healing',
                name: 'Circle of Healing',
                description: 'Unlock Circle of Healing ability',
                icon: 'circle_of_healing.png',
                maxRank: 1,
                currentRank: 0,
                cost: 2,
                unlockSkill: 'circle_of_healing',
                effects: {
                    unlockSkill: 'circle_of_healing'
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'holy_nova',
                name: 'Holy Nova',
                description: 'Unlock Holy Nova ability',
                icon: 'holy_nova.png',
                maxRank: 1,
                currentRank: 0,
                cost: 2,
                unlockSkill: 'holy_nova',
                effects: {
                    unlockSkill: 'holy_nova'
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'spiritual_healing',
                name: 'Spiritual Healing',
                description: 'Increases all healing by 12%',
                icon: 'spiritual_healing.png',
                maxRank: 2,
                currentRank: 0,
                cost: 2,
                effects: {
                    allHealing: 12
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            }
        ],
        
        tier3: [
            {
                id: 'divine_favor',
                name: 'Divine Favor',
                description: 'Next heal is 50% more effective',
                icon: 'divine_favor.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'divine_favor',
                effects: {
                    unlockSkill: 'divine_favor',
                    healBonus: 50
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'guardian_spirit',
                name: 'Guardian Spirit',
                description: 'Unlock Guardian Spirit ability',
                icon: 'guardian_spirit.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'guardian_spirit',
                effects: {
                    unlockSkill: 'guardian_spirit'
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'master_healer',
                name: 'Master Healer',
                description: 'Healing spells have 20% chance to not consume mana',
                icon: 'master_healer.png',
                maxRank: 2,
                currentRank: 0,
                cost: 3,
                effects: {
                    freeHealChance: 20
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            }
        ]
    },
    
    // Druid Talent Tree
    druid: {
        name: 'Druid Talents',
        description: 'Master nature magic and shapeshifting',
        maxPoints: 30,
        tierPoints: [5, 10, 15, 20, 25],
        
        tier1: [
            {
                id: 'improved_wrath',
                name: 'Improved Wrath',
                description: 'Wrath damage increased by 8%',
                icon: 'improved_wrath.png',
                maxRank: 3,
                currentRank: 0,
                cost: 1,
                effects: {
                    wrathDamage: 8
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'improved_rejuvenation',
                name: 'Improved Rejuvenation',
                description: 'Rejuvenation healing increased by 10%',
                icon: 'improved_rejuvenation.png',
                maxRank: 2,
                currentRank: 0,
                cost: 1,
                effects: {
                    rejuvenationHealing: 10
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            },
            {
                id: 'natural_balance',
                name: 'Natural Balance',
                description: 'Reduces mana cost of nature spells by 8%',
                icon: 'natural_balance.png',
                maxRank: 2,
                currentRank: 0,
                cost: 1,
                effects: {
                    natureManaReduction: 8
                },
                requirements: {
                    tier: 1,
                    points: 0
                }
            }
        ],
        
        tier2: [
            {
                id: 'moonkin_form',
                name: 'Moonkin Form',
                description: 'Unlock Moonkin Form ability',
                icon: 'moonkin_form.png',
                maxRank: 1,
                currentRank: 0,
                cost: 2,
                unlockSkill: 'moonkin_form',
                effects: {
                    unlockSkill: 'moonkin_form'
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'cat_form',
                name: 'Cat Form',
                description: 'Unlock Cat Form ability',
                icon: 'cat_form.png',
                maxRank: 1,
                currentRank: 0,
                cost: 2,
                unlockSkill: 'cat_form',
                effects: {
                    unlockSkill: 'cat_form'
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            },
            {
                id: 'improved_bear_form',
                name: 'Improved Bear Form',
                description: 'Bear form health bonus increased by 25%',
                icon: 'improved_bear_form.png',
                maxRank: 2,
                currentRank: 0,
                cost: 2,
                effects: {
                    bearHealthBonus: 25
                },
                requirements: {
                    tier: 2,
                    points: 5
                }
            }
        ],
        
        tier3: [
            {
                id: 'starfall',
                name: 'Starfall',
                description: 'Unlock Starfall ability',
                icon: 'starfall.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'starfall',
                effects: {
                    unlockSkill: 'starfall'
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'wild_growth',
                name: 'Wild Growth',
                description: 'Unlock Wild Growth ability',
                icon: 'wild_growth.png',
                maxRank: 1,
                currentRank: 0,
                cost: 3,
                unlockSkill: 'wild_growth',
                effects: {
                    unlockSkill: 'wild_growth'
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            },
            {
                id: 'master_shapeshifter',
                name: 'Master Shapeshifter',
                description: 'All forms gain 15% bonus damage',
                icon: 'master_shapeshifter.png',
                maxRank: 2,
                currentRank: 0,
                cost: 3,
                effects: {
                    formDamageBonus: 15
                },
                requirements: {
                    tier: 3,
                    points: 10
                }
            }
        ]
    }
};

/**
 * Obtém árvore de talentos de uma classe
 * @param {string} className - Nome da classe
 * @returns {object|null} - Árvore de talentos
 */
function getTalentTree(className) {
    return talentTrees[className] || null;
}

/**
 * Obtém todos os talentos disponíveis
 * @returns {object} - Todas as árvores de talentos
 */
function getAllTalentTrees() {
    return talentTrees;
}

/**
 * Verifica se jogador pode aprender talento
 * @param {object} player - Dados do jogador
 * @param {string} className - Nome da classe
 * @param {object} talent - Dados do talento
 * @returns {boolean} - Pode aprender
 */
function canLearnTalent(player, className, talent) {
    // Verificar classe
    if (player.class !== className) {
        return false;
    }
    
    // Verificar se já tem max rank
    if (talent.currentRank >= talent.maxRank) {
        return false;
    }
    
    // Verificar pontos necessários
    const tree = getTalentTree(className);
    if (!tree) return false;
    
    const tierIndex = parseInt(talent.requirements.tier) - 1;
    const requiredPoints = tree.tierPoints[tierIndex];
    
    if (player.talentPoints < requiredPoints) {
        return false;
    }
    
    return true;
}

/**
 * Obtém talentos disponíveis para um jogador
 * @param {object} player - Dados do jogador
 * @returns {array} - Talentos disponíveis
 */
function getAvailableTalents(player) {
    const tree = getTalentTree(player.class);
    if (!tree) return [];
    
    const availableTalents = [];
    
    // Iterar por todos os tiers
    for (let tier = 1; tier <= 3; tier++) {
        const tierKey = `tier${tier}`;
        if (tree[tierKey]) {
            for (const talent of tree[tierKey]) {
                if (canLearnTalent(player, player.class, talent)) {
                    availableTalents.push(talent);
                }
            }
        }
    }
    
    return availableTalents;
}

module.exports = {
    talentTrees,
    getTalentTree,
    getAllTalentTrees,
    canLearnTalent,
    getAvailableTalents
};
