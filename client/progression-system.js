// Progression System - Sistema de Progressão e Níveis
class ProgressionSystem {
  constructor() {
    this.levelThresholds = this.generateLevelThresholds();
    this.statBonuses = this.generateStatBonuses();
    this.abilities = this.generateAbilities();
  }

  generateLevelThresholds() {
    // XP necessário para cada nível (inspirado em WoW/New World)
    const thresholds = {};
    let baseXP = 100;
    
    for (let level = 1; level <= 100; level++) {
      thresholds[level] = Math.floor(baseXP * Math.pow(1.15, level - 1));
    }
    
    return thresholds;
  }

  generateStatBonuses() {
    // Bônus de stats por nível (WoW-style)
    return {
      warrior: {
        perLevel: {
          strength: 3,
          stamina: 2,
          agility: 1,
          intelligence: 0.5
        },
        baseStats: {
          strength: 15,
          stamina: 12,
          agility: 8,
          intelligence: 5
        }
      },
      mage: {
        perLevel: {
          strength: 0.5,
          stamina: 1,
          agility: 1,
          intelligence: 3
        },
        baseStats: {
          strength: 5,
          stamina: 8,
          agility: 6,
          intelligence: 15
        }
      },
      archer: {
        perLevel: {
          strength: 1,
          stamina: 1.5,
          agility: 3,
          intelligence: 0.5
        },
        baseStats: {
          strength: 8,
          stamina: 10,
          agility: 15,
          intelligence: 6
        }
      },
      rogue: {
        perLevel: {
          strength: 1.5,
          stamina: 1,
          agility: 3,
          intelligence: 1
        },
        baseStats: {
          strength: 10,
          stamina: 8,
          agility: 15,
          intelligence: 8
        }
      }
    };
  }

  generateAbilities() {
    // Habilidades desbloqueadas por nível
    return {
      warrior: [
        { level: 1, name: 'Strike', damage: 10, cooldown: 1000, manaCost: 0 },
        { level: 3, name: 'Shield Bash', damage: 15, cooldown: 3000, manaCost: 5, stun: 1000 },
        { level: 5, name: 'Whirlwind', damage: 25, cooldown: 5000, manaCost: 10, aoe: true },
        { level: 7, name: 'Charge', damage: 20, cooldown: 4000, manaCost: 8, dash: 150 },
        { level: 10, name: 'Bladestorm', damage: 40, cooldown: 8000, manaCost: 20, aoe: true, duration: 3000 }
      ],
      mage: [
        { level: 1, name: 'Fireball', damage: 12, cooldown: 1500, manaCost: 5, projectile: true },
        { level: 3, name: 'Frost Bolt', damage: 10, cooldown: 1200, manaCost: 4, slow: 2000 },
        { level: 5, name: 'Arcane Explosion', damage: 20, cooldown: 4000, manaCost: 12, aoe: true },
        { level: 7, name: 'Teleport', damage: 0, cooldown: 6000, manaCost: 15, blink: 200 },
        { level: 10, name: 'Meteor', damage: 60, cooldown: 10000, manaCost: 30, aoe: true, delay: 2000 }
      ],
      archer: [
        { level: 1, name: 'Quick Shot', damage: 8, cooldown: 800, manaCost: 0, projectile: true },
        { level: 3, name: 'Piercing Arrow', damage: 15, cooldown: 2000, manaCost: 3, piercing: true },
        { level: 5, name: 'Multi Shot', damage: 10, cooldown: 3000, manaCost: 8, multishot: 3 },
        { level: 7, name: 'Evasive Roll', damage: 0, cooldown: 4000, manaCost: 5, iframe: 1000 },
        { level: 10, name: 'Rain of Arrows', damage: 25, cooldown: 7000, manaCost: 15, aoe: true, duration: 3000 }
      ],
      rogue: [
        { level: 1, name: 'Backstab', damage: 12, cooldown: 1000, manaCost: 0, positional: 'behind' },
        { level: 3, name: 'Evasion', damage: 0, cooldown: 8000, manaCost: 10, buff: 'dodge', duration: 5000 },
        { level: 5, name: 'Poison Blade', damage: 18, cooldown: 2500, manaCost: 6, dot: 5, dotDuration: 5000 },
        { level: 7, name: 'Stealth', damage: 0, cooldown: 10000, manaCost: 12, invisible: true, duration: 8000 },
        { level: 10, name: 'Assassinate', damage: 50, cooldown: 12000, manaCost: 25, positional: 'behind', critBonus: 2 }
      ]
    };
  }

  calculateLevel(totalXP) {
    let level = 1;
    let remainingXP = totalXP;

    for (let l = 1; l <= 100; l++) {
      if (remainingXP < this.levelThresholds[l]) {
        break;
      }
      remainingXP -= this.levelThresholds[l];
      level++;
    }

    return {
      level: Math.min(level, 100),
      currentXP: remainingXP,
      xpForNextLevel: this.levelThresholds[level] || 0,
      totalXP
    };
  }

  addExperience(player, amount) {
    if (!player.experience) player.experience = 0;
    
    player.experience += amount;
    const oldLevel = player.level || 1;
    const levelInfo = this.calculateLevel(player.experience);
    
    player.level = levelInfo.level;
    player.currentXP = levelInfo.currentXP;
    player.xpForNextLevel = levelInfo.xpForNextLevel;

    // Check for level up
    if (levelInfo.level > oldLevel) {
      return this.handleLevelUp(player, oldLevel, levelInfo.level);
    }

    return null;
  }

  handleLevelUp(player, oldLevel, newLevel) {
    const levelUpInfo = {
      oldLevel,
      newLevel,
      levelsGained: newLevel - oldLevel,
      statIncreases: {},
      newAbilities: []
    };

    // Update stats
    const classStats = this.statBonuses[player.class];
    if (classStats) {
      for (let level = oldLevel + 1; level <= newLevel; level++) {
        for (const [stat, bonus] of Object.entries(classStats.perLevel)) {
          if (!levelUpInfo.statIncreases[stat]) {
            levelUpInfo.statIncreases[stat] = 0;
          }
          levelUpInfo.statIncreases[stat] += bonus;
        }
      }

      // Apply stat increases
      if (!player.stats) player.stats = { ...classStats.baseStats };
      
      for (const [stat, increase] of Object.entries(levelUpInfo.statIncreases)) {
        player.stats[stat] = (player.stats[stat] || 0) + increase;
      }
    }

    // Check for new abilities
    const classAbilities = this.abilities[player.class];
    if (classAbilities) {
      classAbilities.forEach(ability => {
        if (ability.level > oldLevel && ability.level <= newLevel) {
          levelUpInfo.newAbilities.push(ability);
        }
      });
    }

    // Update health and mana
    if (player.stats) {
      player.maxHealth = 100 + (player.stats.stamina * 5);
      player.maxMana = 50 + (player.stats.intelligence * 3);
      player.health = player.maxHealth; // Full heal on level up
      player.mana = player.maxMana;
    }

    return levelUpInfo;
  }

  getAvailableAbilities(playerClass, playerLevel) {
    const classAbilities = this.abilities[playerClass];
    if (!classAbilities) return [];

    return classAbilities.filter(ability => ability.level <= playerLevel);
  }

  getPlayerStats(playerClass, playerLevel) {
    const classStats = this.statBonuses[playerClass];
    if (!classStats) return {};

    const stats = { ...classStats.baseStats };
    
    for (let level = 1; level < playerLevel; level++) {
      for (const [stat, bonus] of Object.entries(classStats.perLevel)) {
        stats[stat] = (stats[stat] || 0) + bonus;
      }
    }

    return stats;
  }

  getCombatPower(player) {
    if (!player.stats) return 0;

    const stats = player.stats;
    const level = player.level || 1;
    
    // Fórmula inspirada em WoW/New World
    const power = 
      (stats.strength * 2) + 
      (stats.agility * 1.5) + 
      (stats.intelligence * 1.2) + 
      (level * 10) +
      (player.maxHealth * 0.1);

    return Math.floor(power);
  }

  getLevelColor(level) {
    if (level <= 10) return '#FFFFFF'; // White - low level
    if (level <= 20) return '#00FF00'; // Green - easy
    if (level <= 30) return '#FFFF00'; // Yellow - moderate
    if (level <= 40) return '#FF8C00'; // Orange - hard
    return '#FF0000'; // Red - very hard
  }

  getDifficultyColor(playerLevel, targetLevel) {
    const diff = targetLevel - playerLevel;
    
    if (diff <= -5) return '#808080'; // Gray - trivial
    if (diff <= -3) return '#FFFFFF'; // White - easy
    if (diff <= 0) return '#FFFF00'; // Yellow - equal
    if (diff <= 3) return '#FF8C00'; // Orange - tough
    return '#FF0000'; // Red - deadly
  }

  saveProgression(player) {
    return {
      experience: player.experience || 0,
      level: player.level || 1,
      stats: player.stats || {},
      abilities: player.abilities || []
    };
  }

  loadProgression(player, data) {
    player.experience = data.experience || 0;
    player.level = data.level || 1;
    player.stats = data.stats || this.getPlayerStats(player.class, player.level);
    player.abilities = data.abilities || this.getAvailableAbilities(player.class, player.level);
  }
}

window.ProgressionSystem = ProgressionSystem;

export default ProgressionSystem;
