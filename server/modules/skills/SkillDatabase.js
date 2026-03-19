/**
 * SkillDatabase - Banco de Dados de Skills
 * Contém todas as skills do jogo por classe
 */

const skills = {
    // Warrior Skills
    slash: {
        id: 'slash',
        name: 'Slash',
        class: 'warrior',
        level: 1,
        damage: 15,
        cooldown: 2000,
        manaCost: 0,
        range: 50,
        type: 'attack',
        subtype: 'melee',
        description: 'A powerful slash with your weapon.',
        icon: 'slash.png',
        effects: [],
        requirements: {
            level: 1,
            class: ['warrior'],
            strength: 10
        }
    },
    
    power_strike: {
        id: 'power_strike',
        name: 'Power Strike',
        class: 'warrior',
        level: 5,
        damage: 25,
        cooldown: 4000,
        manaCost: 10,
        range: 50,
        type: 'attack',
        subtype: 'melee',
        description: 'A devastating strike that deals extra damage.',
        icon: 'power_strike.png',
        effects: ['stun_0.5'],
        requirements: {
            level: 5,
            class: ['warrior'],
            strength: 15
        }
    },
    
    whirlwind: {
        id: 'whirlwind',
        name: 'Whirlwind',
        class: 'warrior',
        level: 10,
        damage: 20,
        cooldown: 8000,
        manaCost: 20,
        range: 100,
        type: 'attack',
        subtype: 'aoe',
        description: 'Spin around dealing damage to all nearby enemies.',
        icon: 'whirlwind.png',
        effects: ['knockback_5'],
        requirements: {
            level: 10,
            class: ['warrior'],
            strength: 20
        }
    },
    
    defensive_stance: {
        id: 'defensive_stance',
        name: 'Defensive Stance',
        class: 'warrior',
        level: 8,
        damage: 0,
        cooldown: 5000,
        manaCost: 15,
        range: 0,
        type: 'buff',
        subtype: 'self',
        description: 'Increase defense by 50% for 10 seconds.',
        icon: 'defensive_stance.png',
        duration: 10000,
        effects: ['defense_50'],
        requirements: {
            level: 8,
            class: ['warrior']
        }
    },
    
    // Mage Skills
    fireball: {
        id: 'fireball',
        name: 'Fireball',
        class: 'mage',
        level: 1,
        damage: 25,
        cooldown: 3000,
        manaCost: 20,
        range: 200,
        type: 'magic',
        subtype: 'projectile',
        description: 'Launch a fireball that explodes on impact.',
        icon: 'fireball.png',
        effects: ['burn_5'],
        requirements: {
            level: 1,
            class: ['mage'],
            intelligence: 10
        }
    },
    
    frost_bolt: {
        id: 'frost_bolt',
        name: 'Frost Bolt',
        class: 'mage',
        level: 3,
        damage: 20,
        cooldown: 2500,
        manaCost: 15,
        range: 180,
        type: 'magic',
        subtype: 'projectile',
        description: 'Launch a bolt of frost that slows enemies.',
        icon: 'frost_bolt.png',
        effects: ['slow_30_3'],
        requirements: {
            level: 3,
            class: ['mage'],
            intelligence: 12
        }
    },
    
    lightning_bolt: {
        id: 'lightning_bolt',
        name: 'Lightning Bolt',
        class: 'mage',
        level: 7,
        damage: 35,
        cooldown: 4000,
        manaCost: 30,
        range: 250,
        type: 'magic',
        subtype: 'projectile',
        description: 'Strike with lightning that chains to nearby enemies.',
        icon: 'lightning_bolt.png',
        effects: ['chain_2'],
        requirements: {
            level: 7,
            class: ['mage'],
            intelligence: 18
        }
    },
    
    arcane_shield: {
        id: 'arcane_shield',
        name: 'Arcane Shield',
        class: 'mage',
        level: 6,
        damage: 0,
        cooldown: 15000,
        manaCost: 40,
        range: 0,
        type: 'buff',
        subtype: 'self',
        description: 'Create a magical shield that absorbs damage.',
        icon: 'arcane_shield.png',
        duration: 15000,
        effects: ['shield_100'],
        requirements: {
            level: 6,
            class: ['mage'],
            intelligence: 15
        }
    },
    
    // Hunter Skills
    poison_arrow: {
        id: 'poison_arrow',
        name: 'Poison Arrow',
        class: 'hunter',
        level: 1,
        damage: 12,
        cooldown: 2500,
        manaCost: 5,
        range: 300,
        type: 'attack',
        subtype: 'ranged',
        description: 'An arrow coated in poison that deals damage over time.',
        icon: 'poison_arrow.png',
        effects: ['poison_5_3'],
        requirements: {
            level: 1,
            class: ['hunter'],
            dexterity: 10
        }
    },
    
    multi_shot: {
        id: 'multi_shot',
        name: 'Multi Shot',
        class: 'hunter',
        level: 5,
        damage: 8,
        cooldown: 6000,
        manaCost: 15,
        range: 300,
        type: 'attack',
        subtype: 'ranged',
        description: 'Shoot multiple arrows at different targets.',
        icon: 'multi_shot.png',
        effects: ['multi_3'],
        requirements: {
            level: 5,
            class: ['hunter'],
            dexterity: 15
        }
    },
    
    rapid_fire: {
        id: 'rapid_fire',
        name: 'Rapid Fire',
        class: 'hunter',
        level: 9,
        damage: 6,
        cooldown: 10000,
        manaCost: 20,
        range: 300,
        type: 'attack',
        subtype: 'ranged',
        description: 'Fire arrows rapidly for 5 seconds.',
        icon: 'rapid_fire.png',
        duration: 5000,
        effects: ['attack_speed_100'],
        requirements: {
            level: 9,
            class: ['hunter'],
            dexterity: 20
        }
    },
    
    pet_summon: {
        id: 'pet_summon',
        name: 'Summon Pet',
        class: 'hunter',
        level: 4,
        damage: 0,
        cooldown: 30000,
        manaCost: 50,
        range: 0,
        type: 'summon',
        subtype: 'pet',
        description: 'Summon a pet to fight alongside you.',
        icon: 'pet_summon.png',
        duration: 60000,
        effects: ['pet_wolf'],
        requirements: {
            level: 4,
            class: ['hunter']
        }
    },
    
    // Rogue Skills
    backstab: {
        id: 'backstab',
        name: 'Backstab',
        class: 'rogue',
        level: 1,
        damage: 20,
        cooldown: 3000,
        manaCost: 0,
        range: 30,
        type: 'attack',
        subtype: 'melee',
        description: 'Attack from behind for massive damage.',
        icon: 'backstab.png',
        effects: ['crit_100'],
        requirements: {
            level: 1,
            class: ['rogue'],
            agility: 10
        }
    },
    
    stealth: {
        id: 'stealth',
        name: 'Stealth',
        class: 'rogue',
        level: 3,
        damage: 0,
        cooldown: 10000,
        manaCost: 10,
        range: 0,
        type: 'buff',
        subtype: 'self',
        description: 'Become invisible for 10 seconds.',
        icon: 'stealth.png',
        duration: 10000,
        effects: ['invisible'],
        requirements: {
            level: 3,
            class: ['rogue'],
            agility: 12
        }
    },
    
    vanish: {
        id: 'vanish',
        name: 'Vanish',
        class: 'rogue',
        level: 8,
        damage: 0,
        cooldown: 60000,
        manaCost: 30,
        range: 0,
        type: 'buff',
        subtype: 'self',
        description: 'Instantly enter stealth and gain speed boost.',
        icon: 'vanish.png',
        duration: 15000,
        effects: ['invisible', 'speed_50'],
        requirements: {
            level: 8,
            class: ['rogue'],
            agility: 18
        }
    },
    
    poison_blade: {
        id: 'poison_blade',
        name: 'Poison Blade',
        class: 'rogue',
        level: 6,
        damage: 15,
        cooldown: 8000,
        manaCost: 15,
        range: 30,
        type: 'attack',
        subtype: 'melee',
        description: 'Coat your blade with poison for 20 seconds.',
        icon: 'poison_blade.png',
        duration: 20000,
        effects: ['poison_weapon_3'],
        requirements: {
            level: 6,
            class: ['rogue'],
            agility: 15
        }
    },
    
    // Priest Skills
    heal: {
        id: 'heal',
        name: 'Heal',
        class: 'priest',
        level: 1,
        damage: -30,
        cooldown: 2000,
        manaCost: 15,
        range: 150,
        type: 'heal',
        subtype: 'target',
        description: 'Restore health to an ally.',
        icon: 'heal.png',
        effects: [],
        requirements: {
            level: 1,
            class: ['priest'],
            intelligence: 10
        }
    },
    
    greater_heal: {
        id: 'greater_heal',
        name: 'Greater Heal',
        class: 'priest',
        level: 5,
        damage: -75,
        cooldown: 5000,
        manaCost: 40,
        range: 150,
        type: 'heal',
        subtype: 'target',
        description: 'Restore a large amount of health to an ally.',
        icon: 'greater_heal.png',
        effects: [],
        requirements: {
            level: 5,
            class: ['priest'],
            intelligence: 15
        }
    },
    
    holy_light: {
        id: 'holy_light',
        name: 'Holy Light',
        class: 'priest',
        level: 7,
        damage: 40,
        cooldown: 4000,
        manaCost: 35,
        range: 200,
        type: 'magic',
        subtype: 'projectile',
        description: 'Unleash holy light that damages undead.',
        icon: 'holy_light.png',
        effects: ['undead_bonus_50'],
        requirements: {
            level: 7,
            class: ['priest'],
            intelligence: 18
        }
    },
    
    divine_shield: {
        id: 'divine_shield',
        name: 'Divine Shield',
        class: 'priest',
        level: 9,
        damage: 0,
        cooldown: 30000,
        manaCost: 60,
        range: 0,
        type: 'buff',
        subtype: 'self',
        description: 'Become immune to all damage for 8 seconds.',
        icon: 'divine_shield.png',
        duration: 8000,
        effects: ['immunity'],
        requirements: {
            level: 9,
            class: ['priest'],
            intelligence: 20
        }
    },
    
    // Druid Skills
    wrath: {
        id: 'wrath',
        name: 'Wrath',
        class: 'druid',
        level: 1,
        damage: 18,
        cooldown: 2500,
        manaCost: 12,
        range: 180,
        type: 'magic',
        subtype: 'projectile',
        description: 'Call upon nature to strike with lightning.',
        icon: 'wrath.png',
        effects: [],
        requirements: {
            level: 1,
            class: ['druid'],
            intelligence: 10
        }
    },
    
    rejuvenation: {
        id: 'rejuvenation',
        name: 'Rejuvenation',
        class: 'druid',
        level: 3,
        damage: -5,
        cooldown: 3000,
        manaCost: 18,
        range: 150,
        type: 'heal',
        subtype: 'hot',
        description: 'Heal target over time.',
        icon: 'rejuvenation.png',
        duration: 12000,
        effects: ['hot_5_3'],
        requirements: {
            level: 3,
            class: ['druid'],
            intelligence: 12
        }
    },
    
    bear_form: {
        id: 'bear_form',
        name: 'Bear Form',
        class: 'druid',
        level: 5,
        damage: 0,
        cooldown: 5000,
        manaCost: 25,
        range: 0,
        type: 'transform',
        subtype: 'self',
        description: 'Transform into a bear, increasing health and armor.',
        icon: 'bear_form.png',
        duration: 30000,
        effects: ['health_50', 'armor_100'],
        requirements: {
            level: 5,
            class: ['druid'],
            intelligence: 15
        }
    },
    
    moonfire: {
        id: 'moonfire',
        name: 'Moonfire',
        class: 'druid',
        level: 7,
        damage: 22,
        cooldown: 3500,
        manaCost: 20,
        range: 200,
        type: 'magic',
        subtype: 'projectile',
        description: 'Lunar energy that damages and slows.',
        icon: 'moonfire.png',
        effects: ['slow_20_2'],
        requirements: {
            level: 7,
            class: ['druid'],
            intelligence: 18
        }
    },
    
    // Nova Skill - Warrior
    shield_bash: {
        id: 'shield_bash',
        name: 'Shield Bash',
        class: 'warrior',
        level: 3,
        damage: 12,
        cooldown: 3000,
        manaCost: 8,
        range: 40,
        type: 'attack',
        subtype: 'melee',
        description: 'Bash enemy with your shield, stunning them briefly.',
        icon: 'shield_bash.png',
        effects: ['stun_1.0'],
        requirements: {
            level: 3,
            class: ['warrior'],
            strength: 12
        }
    }
};

/**
 * Obtém skill por ID
 * @param {string} skillId - ID da skill
 * @returns {object|null}
 */
function getSkill(skillId) {
    return skills[skillId] || null;
}

/**
 * Obtém skills de uma classe
 * @param {string} className - Nome da classe
 * @returns {array}
 */
function getSkillsByClass(className) {
    return Object.values(skills).filter(skill => skill.class === className);
}

/**
 * Obtém skills disponíveis para um nível
 * @param {number} level - Nível
 * @returns {array}
 */
function getSkillsByLevel(level) {
    return Object.values(skills).filter(skill => skill.level <= level);
}

/**
 * Obtém skills de uma classe e nível
 * @param {string} className - Nome da classe
 * @param {number} level - Nível
 * @returns {array}
 */
function getSkillsByClassAndLevel(className, level) {
    return Object.values(skills).filter(skill => 
        skill.class === className && skill.level <= level
    );
}

/**
 * Verifica se jogador pode usar skill
 * @param {object} player - Dados do jogador
 * @param {object} skill - Dados da skill
 * @returns {boolean}
 */
function canUseSkill(player, skill) {
    // Verificar classe
    if (skill.requirements.class && !skill.requirements.class.includes(player.class)) {
        return false;
    }
    
    // Verificar nível
    if (skill.requirements.level && player.level < skill.requirements.level) {
        return false;
    }
    
    // Verificar atributos
    if (skill.requirements.strength && (player.strength || 0) < skill.requirements.strength) {
        return false;
    }
    
    if (skill.requirements.dexterity && (player.dexterity || 0) < skill.requirements.dexterity) {
        return false;
    }
    
    if (skill.requirements.intelligence && (player.intelligence || 0) < skill.requirements.intelligence) {
        return false;
    }
    
    if (skill.requirements.agility && (player.agility || 0) < skill.requirements.agility) {
        return false;
    }
    
    return true;
}

/**
 * Obtém todas as skills
 * @returns {object}
 */
function getAllSkills() {
    return skills;
}

module.exports = {
    skills,
    getSkill,
    getSkillsByClass,
    getSkillsByLevel,
    getSkillsByClassAndLevel,
    canUseSkill,
    getAllSkills
};
