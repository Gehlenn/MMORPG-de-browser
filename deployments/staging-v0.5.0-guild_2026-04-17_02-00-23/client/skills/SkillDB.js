/**
 * SkillDB.js
 * Database de skills do jogo - Todas as habilidades definidas aqui
 * Versão: 1.0 MVP Core
 */

const SkillDB = {
    // ============================================================
    // SKILLS COMUNS (Todas as classes)
    // ============================================================
    
    'basicAttack': {
        id: 'basicAttack',
        name: 'Ataque Básico',
        description: 'Um golpe simples com sua arma',
        icon: '👊',
        type: 'physical',
        damageType: 'normal',
        
        // Dano
        baseDamage: 10,
        scaling: { str: 0.5, agi: 0.3 },
        
        // Custo
        manaCost: 0,
        staminaCost: 0,
        
        // Cooldown
        cooldown: 1.0,
        globalCooldown: 0.5,
        
        // Range
        range: 40,
        rangeType: 'melee', // melee, ranged, self, aoe
        
        // Efeitos
        effects: [],
        
        // Animação
        animation: 'attack',
        castTime: 0,
        
        // Requisitos
        requiredLevel: 1,
        requiredClass: null, // null = todas as classes
        
        // Tooltip
        tooltip: 'Dano: {damage}\nCooldown: {cooldown}s\nRange: {range}m'
    },
    
    'dash': {
        id: 'dash',
        name: 'Dash',
        description: 'Um movimento rápido para desviar de ataques',
        icon: '💨',
        type: 'utility',
        damageType: null,
        
        baseDamage: 0,
        scaling: {},
        
        manaCost: 0,
        staminaCost: 15,
        
        cooldown: 4.0,
        globalCooldown: 0.5,
        
        range: 100,
        rangeType: 'dash',
        
        effects: [
            { type: 'dash', distance: 100 },
            { type: 'invulnerable', duration: 0.3 }
        ],
        
        animation: 'dash',
        castTime: 0,
        
        requiredLevel: 5,
        requiredClass: null,
        
        tooltip: 'Desloca-se rapidamente {range}m\nInvulnerável por 0.3s\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    // ============================================================
    // GUERREIRO
    // ============================================================
    
    'slash': {
        id: 'slash',
        name: 'Corte Rápido',
        description: 'Um corte rápido e preciso com a espada',
        icon: '⚔️',
        type: 'physical',
        damageType: 'slashing',
        
        baseDamage: 25,
        scaling: { str: 1.5, agi: 0.5 },
        
        manaCost: 0,
        staminaCost: 10,
        
        cooldown: 2.0,
        globalCooldown: 0.5,
        
        range: 50,
        rangeType: 'melee',
        
        effects: [],
        
        animation: 'slash',
        castTime: 0,
        
        requiredLevel: 1,
        requiredClass: 'warrior',
        
        tooltip: 'Dano: {damage} (físico)\nScaling: STR 150%\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    'shieldBash': {
        id: 'shieldBash',
        name: 'Investida Escudada',
        description: 'Avança com o escudo, atordoando o inimigo',
        icon: '🛡️',
        type: 'physical',
        damageType: 'blunt',
        
        baseDamage: 15,
        scaling: { str: 1.0, fis: 1.0 },
        
        manaCost: 0,
        staminaCost: 15,
        
        cooldown: 5.0,
        globalCooldown: 0.5,
        
        range: 60,
        rangeType: 'melee',
        
        effects: [
            { type: 'stun', duration: 1.5, chance: 1.0 }
        ],
        
        animation: 'shieldBash',
        castTime: 0,
        
        requiredLevel: 5,
        requiredClass: 'warrior',
        
        tooltip: 'Dano: {damage} (contundente)\nAtordoa por 1.5s\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    'warCry': {
        id: 'warCry',
        name: 'Grito de Guerra',
        description: 'Um grito que aumenta o dano e defesa temporariamente',
        icon: '📢',
        type: 'buff',
        damageType: null,
        
        baseDamage: 0,
        scaling: {},
        
        manaCost: 0,
        staminaCost: 20,
        
        cooldown: 15.0,
        globalCooldown: 0.5,
        
        range: 0,
        rangeType: 'self',
        
        effects: [
            { type: 'buff', stat: 'str', value: 10, duration: 10 },
            { type: 'buff', stat: 'fis', value: 10, duration: 10 }
        ],
        
        animation: 'warCry',
        castTime: 0.5,
        
        requiredLevel: 10,
        requiredClass: 'warrior',
        
        tooltip: '+10 STR e FIS por 10s\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    // ============================================================
    // MAGO
    // ============================================================
    
    'fireball': {
        id: 'fireball',
        name: 'Bola de Fogo',
        description: 'Projetil explosivo de fogo que queima o alvo',
        icon: '🔥',
        type: 'magic',
        damageType: 'fire',
        
        baseDamage: 35,
        scaling: { int: 2.0, str: 0.2 },
        
        manaCost: 15,
        staminaCost: 0,
        
        cooldown: 3.0,
        globalCooldown: 0.5,
        
        range: 200,
        rangeType: 'ranged',
        
        projectile: {
            speed: 300,
            size: 10,
            color: '#e74c3c'
        },
        
        effects: [
            { type: 'dot', damageType: 'fire', damage: 5, duration: 3, interval: 1 }
        ],
        
        animation: 'cast',
        castTime: 0.5,
        
        requiredLevel: 1,
        requiredClass: 'mage',
        
        tooltip: 'Dano: {damage} (fogo)\nQueima: 5 dano/s por 3s\nScaling: INT 200%\nCusto: {manaCost} mana\nCooldown: {cooldown}s'
    },
    
    'iceBolt': {
        id: 'iceBolt',
        name: 'Lança de Gelo',
        description: 'Um projétil gelado que desacelera o alvo',
        icon: '❄️',
        type: 'magic',
        damageType: 'ice',
        
        baseDamage: 20,
        scaling: { int: 1.5, sab: 0.5 },
        
        manaCost: 10,
        staminaCost: 0,
        
        cooldown: 2.0,
        globalCooldown: 0.5,
        
        range: 180,
        rangeType: 'ranged',
        
        projectile: {
            speed: 400,
            size: 8,
            color: '#3498db'
        },
        
        effects: [
            { type: 'slow', value: 0.5, duration: 3 } // 50% slow
        ],
        
        animation: 'cast',
        castTime: 0.3,
        
        requiredLevel: 3,
        requiredClass: 'mage',
        
        tooltip: 'Dano: {damage} (gelo)\nDesacelera 50% por 3s\nScaling: INT 150%\nCusto: {manaCost} mana\nCooldown: {cooldown}s'
    },
    
    'manaShield': {
        id: 'manaShield',
        name: 'Escudo de Mana',
        description: 'Cria um escudo mágico que absorve dano usando mana',
        icon: '🔮',
        type: 'buff',
        damageType: null,
        
        baseDamage: 0,
        scaling: { int: 5 },
        
        manaCost: 25,
        staminaCost: 0,
        
        cooldown: 10.0,
        globalCooldown: 0.5,
        
        range: 0,
        rangeType: 'self',
        
        effects: [
            { type: 'shield', scaling: { int: 10 }, duration: 15 }
        ],
        
        animation: 'cast',
        castTime: 0.5,
        
        requiredLevel: 8,
        requiredClass: 'mage',
        
        tooltip: 'Absorve até {shieldValue} dano\nCusto de absorção: 2 mana por dano\nDuração: 15s\nCusto: {manaCost} mana\nCooldown: {cooldown}s'
    },
    
    // ============================================================
    // ARQUEIRO
    // ============================================================
    
    'quickShot': {
        id: 'quickShot',
        name: 'Tiro Rápido',
        description: 'Um disparo rápido de flecha',
        icon: '🏹',
        type: 'physical',
        damageType: 'piercing',
        
        baseDamage: 18,
        scaling: { agi: 1.8, str: 0.3 },
        
        manaCost: 0,
        staminaCost: 8,
        
        cooldown: 1.5,
        globalCooldown: 0.5,
        
        range: 250,
        rangeType: 'ranged',
        
        projectile: {
            speed: 500,
            size: 4,
            color: '#95a5a6'
        },
        
        effects: [],
        
        animation: 'shoot',
        castTime: 0.2,
        
        requiredLevel: 1,
        requiredClass: 'archer',
        
        tooltip: 'Dano: {damage} (perfurante)\nScaling: AGI 180%\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    'powerShot': {
        id: 'powerShot',
        name: 'Tiro Potente',
        description: 'Um disparo carregado com dano aumentado',
        icon: '🎯',
        type: 'physical',
        damageType: 'piercing',
        
        baseDamage: 40,
        scaling: { agi: 2.0, str: 0.5 },
        
        manaCost: 0,
        staminaCost: 15,
        
        cooldown: 4.0,
        globalCooldown: 0.5,
        
        range: 300,
        rangeType: 'ranged',
        
        projectile: {
            speed: 600,
            size: 6,
            color: '#e67e22'
        },
        
        effects: [
            { type: 'knockback', distance: 30 }
        ],
        
        animation: 'shoot',
        castTime: 0.5,
        
        requiredLevel: 5,
        requiredClass: 'archer',
        
        tooltip: 'Dano: {damage} (perfurante)\nRepulsão: 30m\nScaling: AGI 200%\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    'evasion': {
        id: 'evasion',
        name: 'Evasão',
        description: 'Aumenta temporariamente a chance de esquiva',
        icon: '💨',
        type: 'buff',
        damageType: null,
        
        baseDamage: 0,
        scaling: { agi: 0.5 },
        
        manaCost: 0,
        staminaCost: 20,
        
        cooldown: 12.0,
        globalCooldown: 0.5,
        
        range: 0,
        rangeType: 'self',
        
        effects: [
            { type: 'buff', stat: 'agi', value: 15, duration: 8 },
            { type: 'dodgeChance', value: 0.25, duration: 8 }
        ],
        
        animation: 'buff',
        castTime: 0.3,
        
        requiredLevel: 10,
        requiredClass: 'archer',
        
        tooltip: '+15 AGI e +25% esquiva por 8s\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    // ============================================================
    // SACERDOTE
    // ============================================================
    
    'heal': {
        id: 'heal',
        name: 'Cura',
        description: 'Restaura HP do alvo com luz sagrada',
        icon: '💚',
        type: 'heal',
        damageType: null,
        
        baseDamage: 0,
        baseHeal: 40,
        scaling: { sab: 2.0, int: 0.5 },
        
        manaCost: 20,
        staminaCost: 0,
        
        cooldown: 3.0,
        globalCooldown: 0.5,
        
        range: 150,
        rangeType: 'ranged',
        
        effects: [],
        
        animation: 'cast',
        castTime: 0.5,
        
        requiredLevel: 1,
        requiredClass: 'priest',
        
        tooltip: 'Cura: {healAmount} HP\nScaling: SAB 200%\nCusto: {manaCost} mana\nCooldown: {cooldown}s'
    },
    
    'smite': {
        id: 'smite',
        name: 'Castigo',
        description: 'Dano sagrado contra inimigos',
        icon: '✨',
        type: 'magic',
        damageType: 'holy',
        
        baseDamage: 25,
        scaling: { sab: 1.8, int: 0.3 },
        
        manaCost: 12,
        staminaCost: 0,
        
        cooldown: 4.0,
        globalCooldown: 0.5,
        
        range: 120,
        rangeType: 'ranged',
        
        effects: [
            { type: 'bonusVsUndead', value: 1.5 } // 50% extra vs undead
        ],
        
        animation: 'cast',
        castTime: 0.4,
        
        requiredLevel: 3,
        requiredClass: 'priest',
        
        tooltip: 'Dano: {damage} (sagrado)\n+50% vs mortos-vivos\nScaling: SAB 180%\nCusto: {manaCost} mana\nCooldown: {cooldown}s'
    },
    
    'bless': {
        id: 'bless',
        name: 'Bênção',
        description: 'Aumenta os stats de um aliado temporariamente',
        icon: '🙏',
        type: 'buff',
        damageType: null,
        
        baseDamage: 0,
        scaling: { sab: 0.3 },
        
        manaCost: 30,
        staminaCost: 0,
        
        cooldown: 15.0,
        globalCooldown: 0.5,
        
        range: 200,
        rangeType: 'ranged',
        
        effects: [
            { type: 'buff', stat: 'str', value: 8, duration: 20 },
            { type: 'buff', stat: 'agi', value: 8, duration: 20 },
            { type: 'buff', stat: 'int', value: 8, duration: 20 }
        ],
        
        animation: 'cast',
        castTime: 0.8,
        
        requiredLevel: 8,
        requiredClass: 'priest',
        
        tooltip: '+8 em todos stats por 20s\nCusto: {manaCost} mana\nCooldown: {cooldown}s'
    },
    
    // ============================================================
    // DRUIDA
    // ============================================================
    
    'natureTouch': {
        id: 'natureTouch',
        name: 'Toque da Natureza',
        description: 'Cura e remove efeitos negativos',
        icon: '🌿',
        type: 'heal',
        damageType: null,
        
        baseDamage: 0,
        baseHeal: 25,
        scaling: { sab: 1.5, int: 0.5 },
        
        manaCost: 15,
        staminaCost: 0,
        
        cooldown: 4.0,
        globalCooldown: 0.5,
        
        range: 100,
        rangeType: 'melee',
        
        effects: [
            { type: 'cleanse' } // remove debuffs
        ],
        
        animation: 'cast',
        castTime: 0.3,
        
        requiredLevel: 1,
        requiredClass: 'druid',
        
        tooltip: 'Cura: {healAmount} HP\nRemove debuffs\nScaling: SAB 150%\nCusto: {manaCost} mana\nCooldown: {cooldown}s'
    },
    
    'rootBind': {
        id: 'rootBind',
        name: 'Raízes Prisão',
        description: 'Raízes emergem do chão e prendem o inimigo',
        icon: '🌱',
        type: 'magic',
        damageType: 'nature',
        
        baseDamage: 15,
        scaling: { int: 1.2, sab: 0.8 },
        
        manaCost: 18,
        staminaCost: 0,
        
        cooldown: 6.0,
        globalCooldown: 0.5,
        
        range: 150,
        rangeType: 'ranged',
        
        effects: [
            { type: 'root', duration: 3 } // não pode se mover
        ],
        
        animation: 'cast',
        castTime: 0.5,
        
        requiredLevel: 5,
        requiredClass: 'druid',
        
        tooltip: 'Dano: {damage} (natureza)\nPrende por 3s\nScaling: INT 120%\nCusto: {manaCost} mana\nCooldown: {cooldown}s'
    },
    
    // ============================================================
    // LADINO
    // ============================================================
    
    'backstab': {
        id: 'backstab',
        name: 'Punhalada pelas Costas',
        description: 'Ataque furtivo com dano crítico aumentado',
        icon: '🗡️',
        type: 'physical',
        damageType: 'piercing',
        
        baseDamage: 30,
        scaling: { agi: 2.0, str: 0.5 },
        
        manaCost: 0,
        staminaCost: 15,
        
        cooldown: 4.0,
        globalCooldown: 0.5,
        
        range: 45,
        rangeType: 'melee',
        
        effects: [
            { type: 'stealthBonus', value: 2.0 }, // 2x dano se furtivo
            { type: 'critChance', value: 0.5 }
        ],
        
        animation: 'attack',
        castTime: 0.3,
        
        requiredLevel: 1,
        requiredClass: 'rogue',
        
        tooltip: 'Dano: {damage} (perfurante)\n2x dano se furtivo\n+50% chance crítica\nScaling: AGI 200%\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    'stealth': {
        id: 'stealth',
        name: 'Furtividade',
        description: 'Fica invisível temporariamente',
        icon: '👤',
        type: 'buff',
        damageType: null,
        
        baseDamage: 0,
        scaling: { agi: 0.1 },
        
        manaCost: 0,
        staminaCost: 25,
        
        cooldown: 8.0,
        globalCooldown: 0.5,
        
        range: 0,
        rangeType: 'self',
        
        effects: [
            { type: 'stealth', duration: 10 },
            { type: 'speedBonus', value: 0.2, duration: 10 }
        ],
        
        animation: 'buff',
        castTime: 0.5,
        
        requiredLevel: 5,
        requiredClass: 'rogue',
        
        tooltip: 'Invisível por 10s\n+20% velocidade\nQuebra ao atacar\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    'poisonBlade': {
        id: 'poisonBlade',
        name: 'Lâmina Envenenada',
        description: 'Aplica veneno na arma, causando dano ao longo do tempo',
        icon: '☠️',
        type: 'physical',
        damageType: 'poison',
        
        baseDamage: 20,
        scaling: { agi: 1.2, str: 0.3 },
        
        manaCost: 0,
        staminaCost: 12,
        
        cooldown: 5.0,
        globalCooldown: 0.5,
        
        range: 45,
        rangeType: 'melee',
        
        effects: [
            { type: 'dot', damageType: 'poison', damage: 8, duration: 5, interval: 1 }
        ],
        
        animation: 'attack',
        castTime: 0.3,
        
        requiredLevel: 8,
        requiredClass: 'rogue',
        
        tooltip: 'Dano: {damage} (veneno)\nVeneno: 8 dano/s por 5s\nScaling: AGI 120%\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    // ============================================================
    // BRUXO
    // ============================================================
    
    'shadowBolt': {
        id: 'shadowBolt',
        name: 'Seta Sombria',
        description: 'Projétil de energia sombria',
        icon: '💀',
        type: 'magic',
        damageType: 'shadow',
        
        baseDamage: 30,
        scaling: { int: 1.8, sab: 0.7 },
        
        manaCost: 14,
        staminaCost: 0,
        
        cooldown: 2.5,
        globalCooldown: 0.5,
        
        range: 200,
        rangeType: 'ranged',
        
        projectile: {
            speed: 350,
            size: 10,
            color: '#8e44ad'
        },
        
        effects: [],
        
        animation: 'cast',
        castTime: 0.4,
        
        requiredLevel: 1,
        requiredClass: 'warlock',
        
        tooltip: 'Dano: {damage} (sombra)\nScaling: INT 180%\nCusto: {manaCost} mana\nCooldown: {cooldown}s'
    },
    
    'curse': {
        id: 'curse',
        name: 'Maldição',
        description: 'Reduz stats do inimigo temporariamente',
        icon: '😈',
        type: 'debuff',
        damageType: null,
        
        baseDamage: 0,
        scaling: { sab: 0.5 },
        
        manaCost: 20,
        staminaCost: 0,
        
        cooldown: 8.0,
        globalCooldown: 0.5,
        
        range: 180,
        rangeType: 'ranged',
        
        effects: [
            { type: 'debuff', stat: 'str', value: -10, duration: 10 },
            { type: 'debuff', stat: 'fis', value: -10, duration: 10 }
        ],
        
        animation: 'cast',
        castTime: 0.5,
        
        requiredLevel: 5,
        requiredClass: 'warlock',
        
        tooltip: '-10 STR e FIS por 10s\nCusto: {manaCost} mana\nCooldown: {cooldown}s'
    },
    
    'lifeDrain': {
        id: 'lifeDrain',
        name: 'Drenar Vida',
        description: 'Drena HP do inimigo e cura a si mesmo',
        icon: '🩸',
        type: 'magic',
        damageType: 'shadow',
        
        baseDamage: 20,
        scaling: { int: 1.2, sab: 0.8 },
        
        manaCost: 18,
        staminaCost: 0,
        
        cooldown: 6.0,
        globalCooldown: 0.5,
        
        range: 100,
        rangeType: 'ranged',
        
        effects: [
            { type: 'lifeSteal', value: 0.5 } // cura 50% do dano
        ],
        
        animation: 'cast',
        castTime: 0.6,
        
        requiredLevel: 10,
        requiredClass: 'warlock',
        
        tooltip: 'Dano: {damage} (sombra)\nCura: 50% do dano causado\nScaling: INT 120%\nCusto: {manaCost} mana\nCooldown: {cooldown}s'
    },
    
    // ============================================================
    // LUTADOR
    // ============================================================
    
    'comboPunch': {
        id: 'comboPunch',
        name: 'Soco Combo',
        description: 'Uma sequência rápida de 3 socos',
        icon: '👊',
        type: 'physical',
        damageType: 'blunt',
        
        baseDamage: 15,
        scaling: { str: 1.2, fis: 0.5 },
        
        manaCost: 0,
        staminaCost: 12,
        
        cooldown: 3.0,
        globalCooldown: 0.3, // GCD menor para combo
        
        range: 40,
        rangeType: 'melee',
        
        combo: {
            hits: 3,
            interval: 0.3,
            damageMultiplier: [1.0, 1.2, 1.5] // crescente
        },
        
        animation: 'attack',
        castTime: 0,
        
        requiredLevel: 1,
        requiredClass: 'fighter',
        
        tooltip: '3 golpes: {damage}x1, {damage}x1.2, {damage}x1.5\nDano total: {totalDamage}\nScaling: STR 120%\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    'uppercut': {
        id: 'uppercut',
        name: 'Gancho',
        description: 'Um gancho que lança o inimigo para cima',
        icon: '☝️',
        type: 'physical',
        damageType: 'blunt',
        
        baseDamage: 25,
        scaling: { str: 1.5, fis: 0.5 },
        
        manaCost: 0,
        staminaCost: 15,
        
        cooldown: 5.0,
        globalCooldown: 0.5,
        
        range: 45,
        rangeType: 'melee',
        
        effects: [
            { type: 'knockup', duration: 0.8 },
            { type: 'stun', duration: 1.0 }
        ],
        
        animation: 'attack',
        castTime: 0.3,
        
        requiredLevel: 5,
        requiredClass: 'fighter',
        
        tooltip: 'Dano: {damage} (contundente)\nLança e atordoa por 1s\nScaling: STR 150%\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    },
    
    'focus': {
        id: 'focus',
        name: 'Foco',
        description: 'Concentração que aumenta chance de crítico',
        icon: '🧘',
        type: 'buff',
        damageType: null,
        
        baseDamage: 0,
        scaling: { sab: 0.3 },
        
        manaCost: 0,
        staminaCost: 20,
        
        cooldown: 15.0,
        globalCooldown: 0.5,
        
        range: 0,
        rangeType: 'self',
        
        effects: [
            { type: 'critChance', value: 0.3, duration: 10 },
            { type: 'critDamage', value: 0.5, duration: 10 }
        ],
        
        animation: 'buff',
        castTime: 0.5,
        
        requiredLevel: 10,
        requiredClass: 'fighter',
        
        tooltip: '+30% chance crítica\n+50% dano crítico por 10s\nCusto: {staminaCost} stamina\nCooldown: {cooldown}s'
    }
};

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Busca uma skill pelo ID
 * @param {string} skillId - ID da skill
 * @returns {object|null} Dados da skill ou null
 */
function getSkill(skillId) {
    return SkillDB[skillId] || null;
}

/**
 * Busca todas as skills disponíveis para uma classe
 * @param {string} classId - ID da classe
 * @param {number} level - Nível do personagem (opcional)
 * @returns {Array} Lista de skills
 */
function getSkillsForClass(classId, level = null) {
    const skills = [];
    
    for (const [id, skill] of Object.entries(SkillDB)) {
        // Skills comuns (sem requiredClass)
        if (!skill.requiredClass) {
            skills.push(skill);
            continue;
        }
        
        // Skills da classe específica
        if (skill.requiredClass === classId) {
            // Verificar level se especificado
            if (level === null || skill.requiredLevel <= level) {
                skills.push(skill);
            }
        }
    }
    
    return skills.sort((a, b) => a.requiredLevel - b.requiredLevel);
}

/**
 * Calcula o dano de uma skill baseado nos stats do personagem
 * @param {object} skill - Dados da skill
 * @param {object} character - Personagem (com stats)
 * @returns {number} Dano calculado
 */
function calculateSkillDamage(skill, character) {
    if (!skill.baseDamage) return 0;
    
    let damage = skill.baseDamage;
    
    // Aplicar scaling
    if (skill.scaling) {
        for (const [stat, multiplier] of Object.entries(skill.scaling)) {
            const statValue = character.stats?.[stat] || 0;
            damage += statValue * multiplier;
        }
    }
    
    // Variação aleatória (±10%)
    const variance = 0.9 + Math.random() * 0.2;
    damage = Math.floor(damage * variance);
    
    return damage;
}

/**
 * Calcula a cura de uma skill
 * @param {object} skill - Dados da skill
 * @param {object} character - Personagem (com stats)
 * @returns {number} Cura calculada
 */
function calculateSkillHeal(skill, character) {
    if (!skill.baseHeal) return 0;
    
    let heal = skill.baseHeal;
    
    if (skill.scaling) {
        for (const [stat, multiplier] of Object.entries(skill.scaling)) {
            const statValue = character.stats?.[stat] || 0;
            heal += statValue * multiplier;
        }
    }
    
    // Variação aleatória (±10%)
    const variance = 0.9 + Math.random() * 0.2;
    heal = Math.floor(heal * variance);
    
    return heal;
}

/**
 * Gera o tooltip formatado de uma skill
 * @param {object} skill - Dados da skill
 * @param {object} character - Personagem (opcional, para valores dinâmicos)
 * @returns {string} Tooltip formatado
 */
function formatSkillTooltip(skill, character = null) {
    let tooltip = skill.tooltip || skill.description;
    
    // Substituir placeholders
    if (character) {
        const damage = calculateSkillDamage(skill, character);
        tooltip = tooltip.replace(/{damage}/g, damage);
        
        const heal = calculateSkillHeal(skill, character);
        tooltip = tooltip.replace(/{healAmount}/g, heal);
        
        // Calcular dano total para combos
        if (skill.combo) {
            let totalDamage = 0;
            for (let i = 0; i < skill.combo.hits; i++) {
                const mult = skill.combo.damageMultiplier?.[i] || 1.0;
                totalDamage += Math.floor(damage * mult);
            }
            tooltip = tooltip.replace(/{totalDamage}/g, totalDamage);
        }
        
        // Escudo
        if (skill.effects?.some(e => e.type === 'shield')) {
            const shieldEffect = skill.effects.find(e => e.type === 'shield');
            let shieldValue = 0;
            if (shieldEffect.scaling) {
                for (const [stat, multiplier] of Object.entries(shieldEffect.scaling)) {
                    shieldValue += (character.stats?.[stat] || 0) * multiplier;
                }
            }
            tooltip = tooltip.replace(/{shieldValue}/g, Math.floor(shieldValue));
        }
    } else {
        tooltip = tooltip.replace(/{damage}/g, skill.baseDamage || '?');
        tooltip = tooltip.replace(/{healAmount}/g, skill.baseHeal || '?');
        tooltip = tooltip.replace(/{totalDamage}/g, skill.baseDamage * 3 || '?');
        tooltip = tooltip.replace(/{shieldValue}/g, '?');
    }
    
    // Valores estáticos
    tooltip = tooltip.replace(/{manaCost}/g, skill.manaCost);
    tooltip = tooltip.replace(/{staminaCost}/g, skill.staminaCost);
    tooltip = tooltip.replace(/{cooldown}/g, skill.cooldown);
    tooltip = tooltip.replace(/{range}/g, skill.range);
    
    return tooltip;
}

/**
 * Verifica se uma skill pode ser usada
 * @param {object} skill - Dados da skill
 * @param {object} character - Personagem
 * @param {object} cooldowns - Cooldowns atuais
 * @returns {object} Resultado { canUse: boolean, reason: string }
 */
function canUseSkill(skill, character, cooldowns = {}) {
    // Verificar se personagem está morto
    if (character.isDead) {
        return { canUse: false, reason: 'Personagem morto' };
    }
    
    // Verificar se está atordoado
    if (character.isStunned) {
        return { canUse: false, reason: 'Atordoado' };
    }
    
    // Verificar cooldown
    const currentCooldown = cooldowns[skill.id] || 0;
    if (currentCooldown > 0) {
        return { canUse: false, reason: `Cooldown: ${currentCooldown.toFixed(1)}s` };
    }
    
    // Verificar mana
    if (skill.manaCost > 0 && character.mp < skill.manaCost) {
        return { canUse: false, reason: `Mana insuficiente (${character.mp}/${skill.manaCost})` };
    }
    
    // Verificar stamina
    if (skill.staminaCost > 0 && character.stamina !== undefined && character.stamina < skill.staminaCost) {
        return { canUse: false, reason: `Stamina insuficiente` };
    }
    
    // Verificar classe
    if (skill.requiredClass && skill.requiredClass !== character.class) {
        return { canUse: false, reason: 'Classe incorreta' };
    }
    
    // Verificar level
    if (skill.requiredLevel > character.level) {
        return { canUse: false, reason: `Requer nível ${skill.requiredLevel}` };
    }
    
    return { canUse: true, reason: null };
}

/**
 * Retorna todas as skills do banco de dados
 * @returns {Array} Lista de todas as skills
 */
function getAllSkills() {
    return Object.values(SkillDB);
}

/**
 * Busca skills por tipo
 * @param {string} type - Tipo da skill (physical, magic, heal, buff, etc)
 * @returns {Array} Lista de skills do tipo
 */
function getSkillsByType(type) {
    return Object.values(SkillDB).filter(skill => skill.type === type);
}

// ============================================================
// EXPORT
// ============================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SkillDB,
        getSkill,
        getSkillsForClass,
        calculateSkillDamage,
        calculateSkillHeal,
        formatSkillTooltip,
        canUseSkill,
        getAllSkills,
        getSkillsByType
    };
} else {
    window.SkillDB = SkillDB;
    window.getSkill = getSkill;
    window.getSkillsForClass = getSkillsForClass;
    window.calculateSkillDamage = calculateSkillDamage;
    window.calculateSkillHeal = calculateSkillHeal;
    window.formatSkillTooltip = formatSkillTooltip;
    window.canUseSkill = canUseSkill;
    window.getAllSkills = getAllSkills;
    window.getSkillsByType = getSkillsByType;
}
