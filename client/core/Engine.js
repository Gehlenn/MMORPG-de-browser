/**
 * Unified Gameplay Engine - Core System
 * Sistema centralizado de gameplay unificado
 * Version 1.0.0 - Refactoring
 */

class UnifiedGameplayEngine {
    constructor(canvasId, characterData) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.characterData = characterData;
        
        // Sistemas centralizados
        this.stateManager = new StateManager();
        this.skillSystem = new SkillSystem();
        this.levelSystem = new LevelSystem();
        this.classSystem = new ClassSystem();
        this.progressionSystem = new ProgressionSystem();
        this.renderSystem = new RenderSystem(this.canvas, this.ctx);
        this.inputSystem = new InputSystem();
        this.physicsSystem = new PhysicsSystem();
        
        // Estado do jogo
        this.isRunning = false;
        this.lastTime = 0;
        this.fps = 0;
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎮 Inicializando Unified Gameplay Engine v1.0.0');
        
        // Inicializar sistemas
        this.stateManager.initialize();
        this.skillSystem.initialize();
        this.levelSystem.initialize();
        this.classSystem.initialize();
        this.progressionSystem.initialize();
        this.renderSystem.initialize();
        this.inputSystem.initialize();
        this.physicsSystem.initialize();
        
        // Configurar personagem
        this.setupPlayer();
        
        // Iniciar game loop
        this.start();
    }
    
    setupPlayer() {
        this.player = {
            x: this.characterData.x || 400,
            y: this.characterData.y || 300,
            width: 32,
            height: 32,
            color: this.characterData.color || '#4CAF50',
            speed: 5,
            health: this.characterData.hp || 100,
            maxHealth: this.characterData.maxHp || 100,
            mana: this.characterData.mana || 50,
            maxMana: this.characterData.maxMana || 50,
            level: this.characterData.level || 1,
            experience: this.characterData.exp || 0,
            class: this.characterData.class || 'warrior',
            skills: this.characterData.skills || []
        };
        
        this.stateManager.set('player', this.player);
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Atualizar sistemas
        this.update(deltaTime);
        this.render();
        
        // Calcular FPS
        this.calculateFPS(currentTime);
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Sistema de input
        this.inputSystem.update();
        
        // Sistema de física
        this.physicsSystem.update(this.player, deltaTime);
        
        // Sistema de skills
        this.skillSystem.update(this.player, deltaTime);
        
        // Sistema de level up
        this.levelSystem.update(this.player, deltaTime);
        
        // Sistema de progressão
        this.progressionSystem.update(this.player, deltaTime);
    }
    
    render() {
        // Sistema de renderização
        this.renderSystem.render(this.player);
    }
    
    calculateFPS(currentTime) {
        this.fps = Math.round(1000 / (currentTime - this.lastTime));
    }
    
    // Métodos públicos para compatibilidade
    getPlayer() {
        return this.player;
    }
    
    getFPS() {
        return this.fps;
    }
    
    isRunning() {
        return this.isRunning;
    }
}

// Sistemas de suporte
class StateManager {
    constructor() {
        this.state = {};
    }
    
    initialize() {
        console.log('📊 State Manager inicializado');
    }
    
    set(key, value) {
        this.state[key] = value;
    }
    
    get(key) {
        return this.state[key];
    }
}

class SkillSystem {
    constructor() {
        this.skills = new Map();
        this.cooldowns = new Map();
    }
    
    initialize() {
        console.log('🛡️ Skill System inicializado');
    }
    
    update(player, deltaTime) {
        // Atualizar cooldowns
        for (const [skillId, cooldown] of this.cooldowns) {
            if (cooldown > 0) {
                this.cooldowns.set(skillId, Math.max(0, cooldown - deltaTime));
            }
        }
    }
    
    useSkill(player, skillId) {
        const skill = this.skills.get(skillId);
        if (!skill) return false;
        
        const cooldown = this.cooldowns.get(skillId) || 0;
        if (cooldown > 0) return false;
        
        // Aplicar efeito da skill
        this.applySkillEffect(player, skill);
        this.cooldowns.set(skillId, skill.cooldown);
        
        return true;
    }
    
    applySkillEffect(player, skill) {
        console.log(`⚡ Usando skill: ${skill.name}`);
        // Lógica de efeito da skill
        switch (skill.type) {
            case 'heal':
                this.applyHeal(player, skill);
                break;
            case 'damage':
                this.applyDamage(player, skill);
                break;
            case 'buff':
                this.applyBuff(player, skill);
                break;
        }
    }
    
    applyHeal(player, skill) {
        player.health = Math.min(player.maxHealth, player.health + skill.value);
    }
    
    applyDamage(player, skill) {
        // Lógica de dano em área
        console.log(`💥 Dano aplicado: ${skill.value}`);
    }
    
    applyBuff(player, skill) {
        console.log(`✨ Buff aplicado: ${skill.name}`);
    }
}

class LevelSystem {
    constructor() {
        this.expTable = this.generateExpTable();
    }
    
    initialize() {
        console.log('📈 Level System inicializado');
    }
    
    update(player, deltaTime) {
        // Verificar level up
        const requiredExp = this.getExpRequired(player.level + 1);
        if (player.experience >= requiredExp) {
            this.levelUp(player);
        }
    }
    
    levelUp(player) {
        player.level++;
        player.experience -= this.getExpRequired(player.level);
        
        // Conceder pontos de skill e atributos
        player.skillPoints = (player.skillPoints || 0) + 1;
        player.attributePoints = (player.attributePoints || 0) + 2;
        
        console.log(`🎉 LEVEL UP! Nível ${player.level} alcançado!`);
        console.log(`🎯 Pontos ganhos: +1 skill, +2 atributos`);
    }
    
    getExpRequired(level) {
        return this.expTable[level] || 100 * level;
    }
    
    generateExpTable() {
        const table = {};
        for (let i = 1; i <= 100; i++) {
            table[i] = 100 * i * Math.pow(1.1, i - 1);
        }
        return table;
    }
}

class ClassSystem {
    constructor() {
        this.classes = {
            warrior: { name: 'Guerreiro', stats: { strength: 5, defense: 3, agility: 2 } },
            mage: { name: 'Mago', stats: { strength: 2, defense: 2, agility: 3, intelligence: 5 } },
            rogue: { name: 'Ladino', stats: { strength: 3, defense: 2, agility: 5, intelligence: 2 } },
            druid: { name: 'Druida', stats: { strength: 3, defense: 3, agility: 3, intelligence: 3 } }
        };
    }
    
    initialize() {
        console.log('🏛️ Class System inicializado');
    }
    
    getClassInfo(className) {
        return this.classes[className] || null;
    }
    
    evolveClass(player) {
        // Lógica de evolução de classe
        console.log(`🔄 Evoluindo classe: ${player.class}`);
    }
}

class ProgressionSystem {
    constructor() {
        this.achievements = new Map();
        this.quests = new Map();
    }
    
    initialize() {
        console.log('📊 Progression System inicializado');
    }
    
    update(player, deltaTime) {
        // Verificar conquistas
        this.checkAchievements(player);
        
        // Verificar progressão de quests
        this.updateQuests(player);
    }
    
    checkAchievements(player) {
        // Lógica de conquistas
        if (player.level >= 10 && !this.achievements.has('veteran')) {
            this.achievements.set('veteran', { name: 'Veterano', description: 'Alcançou nível 10' });
            console.log('🏆 Conquista desbloqueada: Veterano');
        }
    }
    
    updateQuests(player) {
        // Lógica de progressão de quests
        // Implementar sistema de quests dinâmicas
    }
}

class RenderSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.camera = { x: 0, y: 0 };
    }
    
    initialize() {
        console.log('🎨 Render System inicializado');
    }
    
    render(player) {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Atualizar câmera
        this.updateCamera(player);
        
        // Aplicar transformação da câmera
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Renderizar jogador
        this.renderPlayer(player);
        
        // Renderizar elementos do jogo
        this.renderGameElements();
        
        // Restaurar contexto
        this.ctx.restore();
    }
    
    updateCamera(player) {
        // Câmera suave seguindo jogador
        const targetX = player.x - this.canvas.width / 2;
        const targetY = player.y - this.canvas.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
    }
    
    renderPlayer(player) {
        // Renderizar sprite ou retângulo do jogador
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Renderizar nome
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(player.name || 'Player', player.x, player.y - 10);
    }
    
    renderGameElements() {
        // Renderizar elementos do jogo (UI, efeitos, etc.)
        this.renderUI();
    }
    
    renderUI() {
        // Renderizar barra de vida
        this.renderHealthBar();
        
        // Renderizar barra de mana
        this.renderManaBar();
        
        // Renderizar nível
        this.renderLevel();
    }
    
    renderHealthBar() {
        const player = this.stateManager.get('player');
        if (!player) return;
        
        const barWidth = 200;
        const barHeight = 20;
        const x = 10;
        const y = this.canvas.height - 60;
        
        // Background
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Health atual
        const healthPercent = player.health / player.maxHealth;
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // Texto
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`HP: ${Math.floor(player.health)}/${player.maxHealth}`, x, y - 15);
    }
    
    renderManaBar() {
        const player = this.stateManager.get('player');
        if (!player) return;
        
        const barWidth = 200;
        const barHeight = 20;
        const x = 10;
        const y = this.canvas.height - 40;
        
        // Background
        this.ctx.fillStyle = 'blue';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Mana atual
        const manaPercent = player.mana / player.maxMana;
        this.ctx.fillStyle = 'cyan';
        this.ctx.fillRect(x, y, barWidth * manaPercent, barHeight);
        
        // Texto
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`MP: ${Math.floor(player.mana)}/${player.maxMana}`, x, y - 15);
    }
    
    renderLevel() {
        const player = this.stateManager.get('player');
        if (!player) return;
        
        const x = 10;
        const y = this.canvas.height - 20;
        
        this.ctx.fillStyle = 'yellow';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Level: ${player.level}`, x, y);
    }
}

class InputSystem {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
    }
    
    initialize() {
        console.log('⌨️ Input System inicializado');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse input
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        document.addEventListener('mousedown', (e) => {
            this.mouse.clicked = true;
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouse.clicked = false;
        });
    }
    
    update() {
        // Processar input do jogador
        const player = this.stateManager.get('player');
        if (!player) return;
        
        const speed = player.speed || 5;
        
        // Movimento WASD
        if (this.keys['w']) player.y -= speed;
        if (this.keys['s']) player.y += speed;
        if (this.keys['a']) player.x -= speed;
        if (this.keys['d']) player.x += speed;
        
        // Limites do canvas
        player.x = Math.max(0, Math.min(this.canvas.width - player.width, player.x));
        player.y = Math.max(0, Math.min(this.canvas.height - player.height, player.y));
    }
}

class PhysicsSystem {
    constructor() {
        this.gravity = 0.5;
        this.friction = 0.9;
    }
    
    initialize() {
        console.log('⚛️ Physics System inicializado');
    }
    
    update(player, deltaTime) {
        // Aplicar gravidade
        player.velocityY = (player.velocityY || 0) + this.gravity * deltaTime;
        
        // Aplicar fricção
        player.velocityX = (player.velocityX || 0) * this.friction;
        
        // Atualizar posição
        player.x += player.velocityX * deltaTime;
        player.y += player.velocityY * deltaTime;
        
        // Colisão com o chão
        if (player.y > this.canvas.height - player.height - 50) {
            player.y = this.canvas.height - player.height - 50;
            player.velocityY = 0;
        }
    }
}

// Exportar para uso global
window.UnifiedGameplayEngine = UnifiedGameplayEngine;
