/**
 * Skill Tree System - Árvore de Habilidades
 * Sistema completo de skill tree com evolução e desbloqueios
 * Version 1.0.0 - Refactoring
 */

class SkillTree {
    constructor() {
        this.trees = {
            warrior: this.createWarriorTree(),
            mage: this.createMageTree(),
            rogue: this.createRogueTree(),
            druid: this.createDruidTree()
        };
        
        this.unlockedSkills = new Set();
        this.skillPoints = 0;
        this.currentTree = 'warrior';
    }
    
    /**
     * Cria árvore de skills para Warrior
     */
    createWarriorTree() {
        return {
            name: 'Guerreiro',
            description: 'Mestre do combate corpo a corpo',
            icon: '⚔️',
            color: '#e74c3c',
            skills: [
                {
                    id: 'slash',
                    name: 'Slash',
                    description: 'Ataque básico com espada',
                    icon: '⚔️',
                    level: 1,
                    cost: 0,
                    maxLevel: 5,
                    prerequisites: [],
                    effects: ['damage: 15'],
                    unlocked: true
                },
                {
                    id: 'power_strike',
                    name: 'Power Strike',
                    description: 'Golpe poderoso que causa dano extra',
                    icon: '💥',
                    level: 3,
                    cost: 1,
                    maxLevel: 5,
                    prerequisites: ['slash'],
                    effects: ['damage: 25', 'stun: 1.0'],
                    unlocked: false
                },
                {
                    id: 'shield_bash',
                    name: 'Shield Bash',
                    description: 'Ataque com escudo que atordoa inimigos',
                    icon: '🛡️',
                    level: 3,
                    cost: 1,
                    maxLevel: 5,
                    prerequisites: ['slash'],
                    effects: ['damage: 12', 'stun: 1.0'],
                    unlocked: false
                },
                {
                    id: 'whirlwind',
                    name: 'Whirlwind',
                    description: 'Giro mortal que ataca todos os inimigos próximos',
                    icon: '🌪️',
                    level: 5,
                    cost: 2,
                    maxLevel: 5,
                    prerequisites: ['power_strike', 'shield_bash'],
                    effects: ['damage: 40', 'area: true'],
                    unlocked: false
                },
                {
                    id: 'battle_cry',
                    name: 'Battle Cry',
                    description: 'Grito de guerra que aumenta força dos aliados',
                    icon: '📢',
                    level: 7,
                    cost: 3,
                    maxLevel: 5,
                    prerequisites: ['whirlwind'],
                    effects: ['buff: attack_20', 'area: true'],
                    unlocked: false
                }
            ]
        };
    }
    
    /**
     * Cria árvore de skills para Mage
     */
    createMageTree() {
        return {
            name: 'Mago',
            description: 'Mestre das artes arcanas',
            icon: '🔥',
            color: '#3498db',
            skills: [
                {
                    id: 'fireball',
                    name: 'Fireball',
                    description: 'Lança uma bola de fogo explosiva',
                    icon: '🔥',
                    level: 1,
                    cost: 0,
                    maxLevel: 5,
                    prerequisites: [],
                    effects: ['damage: 20', 'burn: 5'],
                    unlocked: true
                },
                {
                    id: 'frost_bolt',
                    name: 'Frost Bolt',
                    description: 'Dispara um raio de gelo que diminui velocidade',
                    icon: '❄️',
                    level: 3,
                    cost: 1,
                    maxLevel: 5,
                    prerequisites: ['fireball'],
                    effects: ['damage: 18', 'slow: 30'],
                    unlocked: false
                },
                {
                    id: 'lightning_bolt',
                    name: 'Lightning Bolt',
                    description: 'Raio que acerta múltiplos inimigos',
                    icon: '⚡',
                    level: 5,
                    cost: 2,
                    maxLevel: 5,
                    prerequisites: ['frost_bolt'],
                    effects: ['damage: 30', 'chain: 2'],
                    unlocked: false
                },
                {
                    id: 'meteor',
                    name: 'Meteor',
                    description: 'Chuva de meteoros devastadora',
                    icon: '☄️',
                    level: 7,
                    cost: 3,
                    maxLevel: 5,
                    prerequisites: ['lightning_bolt'],
                    effects: ['damage: 60', 'area: true', 'burn: 10'],
                    unlocked: false
                }
            ]
        };
    }
    
    /**
     * Cria árvore de skills para Rogue
     */
    createRogueTree() {
        return {
            name: 'Ladino',
            description: 'Mestre das sombras e furtividade',
            icon: '🗡️',
            color: '#2ecc71',
            skills: [
                {
                    id: 'backstab',
                    name: 'Backstab',
                    description: 'Ataque furtivo pelas costas',
                    icon: '🗡️',
                    level: 1,
                    cost: 0,
                    maxLevel: 5,
                    prerequisites: [],
                    effects: ['damage: 25', 'critical: true'],
                    unlocked: true
                },
                {
                    id: 'stealth',
                    name: 'Stealth',
                    description: 'Fica invisível por alguns segundos',
                    icon: '👤',
                    level: 3,
                    cost: 1,
                    maxLevel: 5,
                    prerequisites: ['backstab'],
                    effects: ['invisible: 5'],
                    unlocked: false
                },
                {
                    id: 'poison_blade',
                    name: 'Poison Blade',
                    description: 'Envenena lâmina por tempo limitado',
                    icon: '🩸',
                    level: 5,
                    cost: 2,
                    maxLevel: 5,
                    prerequisites: ['stealth'],
                    effects: ['damage: 15', 'poison: 10'],
                    unlocked: false
                },
                {
                    id: 'vanish',
                    name: 'Vanish',
                    description: 'Some instantaneamente e ganha velocidade',
                    icon: '💨',
                    level: 7,
                    cost: 3,
                    maxLevel: 5,
                    prerequisites: ['poison_blade'],
                    effects: ['invisible: 15', 'speed: 50'],
                    unlocked: false
                }
            ]
        };
    }
    
    /**
     * Cria árvore de skills para Druid
     */
    createDruidTree() {
        return {
            name: 'Druida',
            description: 'Guardião da natureza',
            icon: '🌿',
            color: '#27ae60',
            skills: [
                {
                    id: 'wrath',
                    name: 'Wrath',
                    description: 'Fúria da natureza que causa dano',
                    icon: '🌿',
                    level: 1,
                    cost: 0,
                    maxLevel: 5,
                    prerequisites: [],
                    effects: ['damage: 18'],
                    unlocked: true
                },
                {
                    id: 'moonfire',
                    name: 'Moonfire',
                    description: 'Energia lunar que causa dano e lentidão',
                    icon: '🌙',
                    level: 3,
                    cost: 1,
                    maxLevel: 5,
                    prerequisites: ['wrath'],
                    effects: ['damage: 22', 'slow: 20'],
                    unlocked: false
                },
                {
                    id: 'healing_light',
                    name: 'Healing Light',
                    description: 'Cura com luz sagrada',
                    icon: '💚',
                    level: 5,
                    cost: 2,
                    maxLevel: 5,
                    prerequisites: ['moonfire'],
                    effects: ['heal: 50'],
                    unlocked: false
                },
                {
                    id: 'nature_avatar',
                    name: 'Nature Avatar',
                    description: 'Transforma-se em avatar da natureza',
                    icon: '🌳',
                    level: 7,
                    cost: 3,
                    maxLevel: 5,
                    prerequisites: ['healing_light'],
                    effects: ['buff: all_stats', 'transform: true'],
                    unlocked: false
                }
            ]
        };
    }
    
    /**
     * Inicializa o sistema de skill tree
     */
    initialize(playerClass = 'warrior') {
        console.log(`🌳 Inicializando Skill Tree para classe: ${playerClass}`);
        this.currentTree = playerClass;
        this.loadUnlockedSkills(playerClass);
    }
    
    /**
     * Carrega skills desbloqueadas do jogador
     */
    loadUnlockedSkills(playerClass) {
        // Carregar do localStorage ou backend
        const saved = localStorage.getItem(`skillTree_${playerClass}`);
        if (saved) {
            const data = JSON.parse(saved);
            this.unlockedSkills = new Set(data.unlockedSkills || []);
            this.skillPoints = data.skillPoints || 0;
        }
    }
    
    /**
     * Salva skills desbloqueadas
     */
    saveUnlockedSkills() {
        const data = {
            unlockedSkills: Array.from(this.unlockedSkills),
            skillPoints: this.skillPoints,
            currentTree: this.currentTree
        };
        localStorage.setItem(`skillTree_${this.currentTree}`, JSON.stringify(data));
    }
    
    /**
     * Obtém árvore de skills atual
     */
    getCurrentTree() {
        return this.trees[this.currentTree] || null;
    }
    
    /**
     * Muda para outra árvore de classe
     */
    switchTree(treeName) {
        if (this.trees[treeName]) {
            this.currentTree = treeName;
            this.loadUnlockedSkills(treeName);
            console.log(`🌳 Mudou para árvore: ${treeName}`);
            return true;
        }
        return false;
    }
    
    /**
     * Verifica se uma skill pode ser desbloqueada
     */
    canUnlockSkill(skillId) {
        const tree = this.getCurrentTree();
        if (!tree) return false;
        
        const skill = tree.skills.find(s => s.id === skillId);
        if (!skill) return false;
        
        // Verificar nível
        const playerLevel = this.getPlayerLevel();
        if (playerLevel < skill.level) return false;
        
        // Verificar pontos de skill
        if (this.skillPoints < skill.cost) return false;
        
        // Verificar pré-requisitos
        if (skill.prerequisites.length > 0) {
            for (const prereq of skill.prerequisites) {
                if (!this.unlockedSkills.has(prereq)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Desbloqueia uma skill
     */
    unlockSkill(skillId) {
        const tree = this.getCurrentTree();
        if (!tree) return false;
        
        const skill = tree.skills.find(s => s.id === skillId);
        if (!skill) return false;
        
        if (!this.canUnlockSkill(skillId)) return false;
        
        this.unlockedSkills.add(skillId);
        this.skillPoints -= skill.cost;
        skill.unlocked = true;
        
        this.saveUnlockedSkills();
        console.log(`🌳 Skill desbloqueada: ${skill.name}`);
        
        return true;
    }
    
    /**
     * Sobe nível de uma skill
     */
    upgradeSkill(skillId) {
        const tree = this.getCurrentTree();
        if (!tree) return false;
        
        const skill = tree.skills.find(s => s.id === skillId);
        if (!skill || !skill.unlocked) return false;
        
        if (skill.level >= skill.maxLevel) return false;
        
        skill.level++;
        console.log(`⬆️ Skill upgradada: ${skill.name} para nível ${skill.level}`);
        
        this.saveUnlockedSkills();
        return true;
    }
    
    /**
     * Obtém nível do jogador (placeholder)
     */
    getPlayerLevel() {
        // Integrar com sistema de level real
        return parseInt(localStorage.getItem('playerLevel') || '1');
    }
    
    /**
     * Concede pontos de skill ao jogador
     */
    addSkillPoints(points) {
        this.skillPoints += points;
        this.saveUnlockedSkills();
        console.log(`🎯 Ganhou ${points} pontos de skill! Total: ${this.skillPoints}`);
    }
    
    /**
     * Obtém skills disponíveis para desbloquear
     */
    getAvailableSkills() {
        const tree = this.getCurrentTree();
        if (!tree) return [];
        
        return tree.skills.filter(skill => 
            !skill.unlocked && this.canUnlockSkill(skill.id)
        );
    }
    
    /**
     * Obtém skills desbloqueadas
     */
    getUnlockedSkills() {
        const tree = this.getCurrentTree();
        if (!tree) return [];
        
        return tree.skills.filter(skill => skill.unlocked);
    }
    
    /**
     * Obtém informações de uma skill
     */
    getSkillInfo(skillId) {
        const tree = this.getCurrentTree();
        if (!tree) return null;
        
        return tree.skills.find(s => s.id === skillId) || null;
    }
    
    /**
     * Calcula progressão total
     */
    getProgress() {
        const tree = this.getCurrentTree();
        if (!tree) return 0;
        
        const totalSkills = tree.skills.length;
        const unlockedSkills = tree.skills.filter(s => s.unlocked).length;
        
        return Math.round((unlockedSkills / totalSkills) * 100);
    }
}

// Exportar para uso global
window.SkillTree = SkillTree;
