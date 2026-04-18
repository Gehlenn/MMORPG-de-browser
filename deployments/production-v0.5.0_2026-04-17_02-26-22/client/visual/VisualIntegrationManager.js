/**
 * Visual Integration Manager - Legacy of Komodo
 * Integração completa de elementos visuais com HUDs
 * Mapa, Mobs, NPCs, Player, Sprites, Efeitos
 */

class VisualIntegrationManager {
    constructor() {
        this.initialized = false;
        this.active = false;
        
        // Sistemas visuais
        this.spriteSystem = null;
        this.mapRenderer = null;
        this.mobSystem = null;
        this.npcSystem = null;
        this.playerSystem = null;
        this.effectSystem = null;
        
        // Canvas principal
        this.mainCanvas = null;
        this.mainCtx = null;
        
        // Configurações
        this.config = {
            tileSize: 32,
            mapWidth: 50,
            mapHeight: 40,
            maxMobs: 20,
            maxNPCs: 15,
            maxEffects: 50,
            renderDistance: 10,
            updateInterval: 1000 / 60, // 60 FPS
            particleCount: 100
        };
        
        // Estado do mundo
        this.worldState = {
            player: null,
            mobs: [],
            npcs: [],
            effects: [],
            projectiles: [],
            items: [],
            environment: {
                timeOfDay: 12, // 24h format
                weather: 'clear',
                lighting: 1.0
            }
        };
        
        // Performance
        this.lastUpdateTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        this.renderQueue = [];
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎨 Inicializando Visual Integration Manager...');
        
        // Configurar canvas principal
        this.setupMainCanvas();
        
        // Esconder canvas inicialmente
        this.mainCanvas.style.display = 'none';
        
        // Inicializar sistemas
        this.initializeSpriteSystem();
        this.initializeMapRenderer();
        this.initializeMobSystem();
        this.initializeNPCSystem();
        this.initializePlayerSystem();
        this.initializeEffectSystem();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Iniciar loop de renderização (mas pausado)
        this.active = false;
        this.startRenderLoop();
        
        console.log('✅ Visual Integration Manager inicializado');
        this.initialized = true;
    }
    
    setupMainCanvas() {
        // Criar canvas principal para renderização
        this.mainCanvas = document.createElement('canvas');
        this.mainCanvas.id = 'visual-main-canvas';
        this.mainCanvas.style.position = 'absolute';
        this.mainCanvas.style.top = '0';
        this.mainCanvas.style.left = '0';
        this.mainCanvas.style.width = '100%';
        this.mainCanvas.style.height = '100%';
        this.mainCanvas.style.pointerEvents = 'auto';
        this.mainCanvas.style.zIndex = '0'; // Mais baixo para não bloquear UI
        
        // Adicionar ao DOM
        document.body.appendChild(this.mainCanvas);
        
        // Configurar contexto
        this.mainCtx = this.mainCanvas.getContext('2d');
        
        // Ajustar tamanho
        this.resizeCanvas();
        
        console.log('✅ Canvas principal configurado');
    }
    
    resizeCanvas() {
        this.mainCanvas.width = window.innerWidth;
        this.mainCanvas.height = window.innerHeight;
        
        // Notificar sistemas sobre resize
        if (this.mapRenderer && this.mapRenderer.resize) {
            this.mapRenderer.resize();
        }
    }
    
    initializeSpriteSystem() {
        if (window.SimpleSpriteSystem) {
            this.spriteSystem = new window.SimpleSpriteSystem(window.assetManager);
            console.log('✅ Sprite System inicializado');
        } else {
            console.warn('⚠️ SimpleSpriteSystem não disponível');
        }
    }
    
    initializeMapRenderer() {
        if (window.SimpleMapRenderer && this.spriteSystem) {
            this.mapRenderer = new window.SimpleMapRenderer(this.mainCanvas, this.spriteSystem);
            console.log('✅ Map Renderer inicializado');
        } else {
            console.warn('⚠️ SimpleMapRenderer não disponível');
        }
    }
    
    initializeMobSystem() {
        this.mobSystem = {
            mobs: new Map(),
            templates: new Map(),
            
            // Templates de mobs
            initializeTemplates() {
                this.templates.set('rat', {
                    name: 'Rat',
                    sprite: 'rat',
                    level: 1,
                    health: 10,
                    maxHealth: 10,
                    damage: 2,
                    speed: 150,
                    exp: 5,
                    gold: 2,
                    behavior: 'aggressive',
                    aggroRange: 100,
                    attackRange: 30,
                    attackCooldown: 2000
                });
                
                this.templates.set('slime', {
                    name: 'Slime',
                    sprite: 'slime',
                    level: 2,
                    health: 15,
                    maxHealth: 15,
                    damage: 3,
                    speed: 100,
                    exp: 8,
                    gold: 3,
                    behavior: 'passive',
                    aggroRange: 50,
                    attackRange: 25,
                    attackCooldown: 2500
                });
                
                this.templates.set('wolf', {
                    name: 'Wolf',
                    sprite: 'wolf',
                    level: 3,
                    health: 25,
                    maxHealth: 25,
                    damage: 5,
                    speed: 200,
                    exp: 15,
                    gold: 5,
                    behavior: 'aggressive',
                    aggroRange: 150,
                    attackRange: 40,
                    attackCooldown: 1500
                });
                
                this.templates.set('goblin', {
                    name: 'Goblin',
                    sprite: 'goblin',
                    level: 4,
                    health: 30,
                    maxHealth: 30,
                    damage: 6,
                    speed: 180,
                    exp: 20,
                    gold: 8,
                    behavior: 'aggressive',
                    aggroRange: 120,
                    attackRange: 35,
                    attackCooldown: 1800
                });
                
                this.templates.set('bear', {
                    name: 'Bear',
                    sprite: 'bear',
                    level: 5,
                    health: 50,
                    maxHealth: 50,
                    damage: 10,
                    speed: 120,
                    exp: 35,
                    gold: 15,
                    behavior: 'territorial',
                    aggroRange: 80,
                    attackRange: 50,
                    attackCooldown: 3000
                });
            },
            
            spawnMob(templateId, x, y) {
                const template = this.templates.get(templateId);
                if (!template) return null;
                
                const mob = {
                    id: `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ...template,
                    x: x,
                    y: y,
                    vx: 0,
                    vy: 0,
                    rotation: 0,
                    target: null,
                    lastAttack: 0,
                    state: 'idle', // idle, moving, attacking, dead
                    animationFrame: 0,
                    animationTime: 0
                };
                
                this.mobs.set(mob.id, mob);
                return mob;
            },
            
            updateMob(mob, deltaTime, playerPos) {
                // AI behavior
                switch(mob.behavior) {
                    case 'aggressive':
                        this.updateAggressiveBehavior(mob, deltaTime, playerPos);
                        break;
                    case 'passive':
                        this.updatePassiveBehavior(mob, deltaTime, playerPos);
                        break;
                    case 'territorial':
                        this.updateTerritorialBehavior(mob, deltaTime, playerPos);
                        break;
                }
                
                // Update animation
                mob.animationTime += deltaTime;
                if (mob.animationTime > 200) {
                    mob.animationFrame = (mob.animationFrame + 1) % 4;
                    mob.animationTime = 0;
                }
            },
            
            updateAggressiveBehavior(mob, deltaTime, playerPos) {
                const dx = playerPos.x - mob.x;
                const dy = playerPos.y - mob.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mob.aggroRange && mob.state !== 'dead') {
                    mob.target = playerPos;
                    mob.state = 'moving';
                    
                    if (distance < mob.attackRange) {
                        // Attack
                        if (Date.now() - mob.lastAttack > mob.attackCooldown) {
                            this.performAttack(mob);
                            mob.lastAttack = Date.now();
                        }
                    } else {
                        // Move towards player
                        const angle = Math.atan2(dy, dx);
                        mob.vx = Math.cos(angle) * mob.speed;
                        mob.vy = Math.sin(angle) * mob.speed;
                        mob.rotation = angle;
                    }
                } else {
                    // Return to idle
                    mob.target = null;
                    mob.state = 'idle';
                    mob.vx *= 0.9;
                    mob.vy *= 0.9;
                }
                
                // Update position
                mob.x += mob.vx * deltaTime / 1000;
                mob.y += mob.vy * deltaTime / 1000;
            },
            
            updatePassiveBehavior(mob, deltaTime, playerPos) {
                const dx = playerPos.x - mob.x;
                const dy = playerPos.y - mob.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mob.aggroRange && mob.state !== 'dead') {
                    // Run away from player
                    const angle = Math.atan2(dy, dx);
                    mob.vx = -Math.cos(angle) * mob.speed;
                    mob.vy = -Math.sin(angle) * mob.speed;
                    mob.state = 'moving';
                } else {
                    // Random movement
                    if (Math.random() < 0.01) {
                        const angle = Math.random() * Math.PI * 2;
                        mob.vx = Math.cos(angle) * mob.speed * 0.5;
                        mob.vy = Math.sin(angle) * mob.speed * 0.5;
                    }
                    mob.vx *= 0.95;
                    mob.vy *= 0.95;
                }
                
                // Update position
                mob.x += mob.vx * deltaTime / 1000;
                mob.y += mob.vy * deltaTime / 1000;
            },
            
            updateTerritorialBehavior(mob, deltaTime, playerPos) {
                const dx = playerPos.x - mob.x;
                const dy = playerPos.y - mob.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mob.aggroRange && mob.state !== 'dead') {
                    // Similar to aggressive but more defensive
                    this.updateAggressiveBehavior(mob, deltaTime, playerPos);
                } else {
                    // Patrol area
                    if (Math.random() < 0.02) {
                        const angle = Math.random() * Math.PI * 2;
                        mob.vx = Math.cos(angle) * mob.speed * 0.3;
                        mob.vy = Math.sin(angle) * mob.speed * 0.3;
                    }
                    mob.vx *= 0.9;
                    mob.vy *= 0.9;
                }
                
                // Update position
                mob.x += mob.vx * deltaTime / 1000;
                mob.y += mob.vy * deltaTime / 1000;
            },
            
            performAttack(mob) {
                // Create attack effect
                if (window.visualManager) {
                    window.visualManager.createAttackEffect(mob.x, mob.y, mob.target);
                }
                
                // Notify HUD of combat
                if (window.wowHUDIntegration) {
                    window.wowHUDIntegration.updateTargetState({
                        name: mob.name,
                        level: mob.level,
                        health: mob.health,
                        maxHealth: mob.maxHealth,
                        type: 'mob',
                        hostile: true,
                        elite: mob.level > 3
                    });
                }
            },
            
            renderMob(ctx, mob, camera) {
                if (!this.spriteSystem) return;
                
                const screenX = mob.x - camera.x;
                const screenY = mob.y - camera.y;
                
                // Render shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY + 15, 12, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Render sprite
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(mob.rotation);
                
                // Draw mob sprite
                this.spriteSystem.drawMob(ctx, mob.sprite, 0, 0, mob.animationFrame);
                
                ctx.restore();
                
                // Render health bar if damaged
                if (mob.health < mob.maxHealth) {
                    const barWidth = 30;
                    const barHeight = 4;
                    const barY = screenY - 20;
                    
                    // Background
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(screenX - barWidth/2, barY, barWidth, barHeight);
                    
                    // Health
                    const healthPercent = mob.health / mob.maxHealth;
                    ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
                    ctx.fillRect(screenX - barWidth/2, barY, barWidth * healthPercent, barHeight);
                    
                    // Border
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(screenX - barWidth/2, barY, barWidth, barHeight);
                }
                
                // Render name and level
                ctx.fillStyle = '#FFF';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${mob.name} Lv.${mob.level}`, screenX, screenY - 25);
            }
        };
        
        // Inicializar templates
        this.mobSystem.initializeTemplates();
        
        console.log('✅ Mob System inicializado');
    }
    
    initializeNPCSystem() {
        this.npcSystem = {
            npcs: new Map(),
            templates: new Map(),
            
            initializeTemplates() {
                this.templates.set('merchant', {
                    name: 'Merchant',
                    sprite: 'merchant',
                    dialogue: [
                        'Welcome, traveler!',
                        'I have the finest goods in the land.',
                        'May I interest you in some potions?'
                    ],
                    quests: ['first_purchase'],
                    shop: {
                        items: [
                            { id: 'health_potion', name: 'Health Potion', price: 10 },
                            { id: 'mana_potion', name: 'Mana Potion', price: 15 },
                            { id: 'bread', name: 'Bread', price: 5 }
                        ]
                    }
                });
                
                this.templates.set('guard', {
                    name: 'Town Guard',
                    sprite: 'guard',
                    dialogue: [
                        'Halt! Who goes there?',
                        'Welcome to our humble town.',
                        'Be careful outside the walls.'
                    ],
                    quests: ['patrol_duty'],
                    services: ['quest_giver']
                });
                
                this.templates.set('blacksmith', {
                    name: 'Blacksmith',
                    sprite: 'blacksmith',
                    dialogue: [
                        'Need your blade sharpened?',
                        'I forge the finest weapons.',
                        'Bring me materials and I\'ll craft you something special.'
                    ],
                    quests: ['material_collection'],
                    services: ['crafting', 'repair']
                });
                
                this.templates.set('healer', {
                    name: 'Healer',
                    sprite: 'healer',
                    dialogue: [
                        'You look wounded, let me help.',
                        'The light guides my hands.',
                        'Rest here and recover your strength.'
                    ],
                    quests: ['healing_arts'],
                    services: ['heal', 'buff']
                });
                
                this.templates.set('quest_giver', {
                    name: 'Elder',
                    sprite: 'elder',
                    dialogue: [
                        'Young adventurer, I have a task for you.',
                        'Our town needs your help.',
                        'Will you accept this quest?'
                    ],
                    quests: ['main_quest_1', 'side_quest_1'],
                    services: ['quest_giver']
                });
            },
            
            spawnNPC(templateId, x, y) {
                const template = this.templates.get(templateId);
                if (!template) return null;
                
                const npc = {
                    id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ...template,
                    x: x,
                    y: y,
                    rotation: 0,
                    state: 'idle',
                    animationFrame: 0,
                    animationTime: 0,
                    currentDialogue: 0,
                    playerInRange: false
                };
                
                this.npcs.set(npc.id, npc);
                return npc;
            },
            
            updateNPC(npc, deltaTime, playerPos) {
                const dx = playerPos.x - npc.x;
                const dy = playerPos.y - npc.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Check if player is in dialogue range
                const wasInRange = npc.playerInRange;
                npc.playerInRange = distance < 50;
                
                // Show dialogue indicator when player gets close
                if (!wasInRange && npc.playerInRange) {
                    if (window.wowHUDIntegration) {
                        window.wowHUDIntegration.showNotification(`${npc.name}: Press E to talk`, 'info', 2000);
                    }
                }
                
                // Update animation
                npc.animationTime += deltaTime;
                if (npc.animationTime > 300) {
                    npc.animationFrame = (npc.animationFrame + 1) % 4;
                    npc.animationTime = 0;
                }
                
                // Face player when in range
                if (npc.playerInRange) {
                    npc.rotation = Math.atan2(dy, dx);
                }
            },
            
            startDialogue(npc) {
                if (window.wowHUDIntegration) {
                    const dialogue = npc.dialogue[npc.currentDialogue];
                    window.wowHUDIntegration.showNotification(`${npc.name}: "${dialogue}"`, 'info', 3000);
                    
                    // Advance dialogue
                    npc.currentDialogue = (npc.currentDialogue + 1) % npc.dialogue.length;
                }
            },
            
            renderNPC(ctx, npc, camera) {
                if (!this.spriteSystem) return;
                
                const screenX = npc.x - camera.x;
                const screenY = npc.y - camera.y;
                
                // Render shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY + 15, 12, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Render sprite
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(npc.rotation);
                
                // Draw NPC sprite
                this.spriteSystem.drawNPC(ctx, npc.sprite, 0, 0, npc.animationFrame);
                
                ctx.restore();
                
                // Render dialogue indicator
                if (npc.playerInRange) {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('!', screenX, screenY - 30);
                    
                    // Pulsing effect
                    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
                    ctx.globalAlpha = pulse;
                    ctx.fillText('!', screenX, screenY - 30);
                    ctx.globalAlpha = 1;
                }
                
                // Render name
                ctx.fillStyle = '#FFF';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(npc.name, screenX, screenY - 25);
            }
        };
        
        // Inicializar templates
        this.npcSystem.initializeTemplates();
        
        console.log('✅ NPC System inicializado');
    }
    
    initializePlayerSystem() {
        this.playerSystem = {
            player: null,
            
            createPlayer(name, classType, x, y) {
                this.player = {
                    name: name,
                    class: classType,
                    x: x,
                    y: y,
                    vx: 0,
                    vy: 0,
                    speed: 200,
                    rotation: 0,
                    level: 1,
                    health: 100,
                    maxHealth: 100,
                    mana: 50,
                    maxMana: 50,
                    exp: 0,
                    maxExp: 100,
                    gold: 0,
                    equipment: {
                        weapon: 'apprentice_wand',
                        armor: 'apprentice_robes'
                    },
                    state: 'idle',
                    animationFrame: 0,
                    animationTime: 0,
                    casting: false,
                    castTime: 0,
                    currentSpell: null
                };
                
                return this.player;
            },
            
            updatePlayer(deltaTime, input) {
                if (!this.player) return;
                
                // Movement
                let dx = 0, dy = 0;
                
                if (input.up) dy = -1;
                if (input.down) dy = 1;
                if (input.left) dx = -1;
                if (input.right) dx = 1;
                
                // Normalize diagonal movement
                if (dx !== 0 && dy !== 0) {
                    dx *= 0.707;
                    dy *= 0.707;
                }
                
                this.player.vx = dx * this.player.speed;
                this.player.vy = dy * this.player.speed;
                
                // Update position
                this.player.x += this.player.vx * deltaTime / 1000;
                this.player.y += this.player.vy * deltaTime / 1000;
                
                // Update rotation based on movement
                if (dx !== 0 || dy !== 0) {
                    this.player.rotation = Math.atan2(dy, dx);
                    this.player.state = 'moving';
                } else {
                    this.player.state = 'idle';
                }
                
                // Update animation
                this.player.animationTime += deltaTime;
                if (this.player.animationTime > 150) {
                    this.player.animationFrame = (this.player.animationFrame + 1) % 4;
                    this.player.animationTime = 0;
                }
                
                // Update casting
                if (this.player.casting) {
                    this.player.castTime -= deltaTime;
                    if (this.player.castTime <= 0) {
                        this.completeSpellCast();
                    }
                }
            },
            
            startSpellCast(spellId) {
                if (!this.player || this.player.casting) return;
                
                const spells = {
                    'magic_missile': { castTime: 1000, mana: 5 },
                    'fire_bolt': { castTime: 1500, mana: 10 },
                    'heal': { castTime: 2000, mana: 15 }
                };
                
                const spell = spells[spellId];
                if (!spell || this.player.mana < spell.mana) return;
                
                this.player.casting = true;
                this.player.castTime = spell.castTime;
                this.player.currentSpell = spellId;
                this.player.mana -= spell.mana;
                
                // Update HUD
                if (window.wowHUDIntegration) {
                    window.wowHUDIntegration.updatePlayerState(this.player);
                }
            },
            
            completeSpellCast() {
                if (!this.player || !this.player.currentSpell) return;
                
                // Create spell effect
                if (window.visualManager) {
                    window.visualManager.createSpellEffect(
                        this.player.x, 
                        this.player.y, 
                        this.player.rotation,
                        this.player.currentSpell
                    );
                }
                
                // Reset casting
                this.player.casting = false;
                this.player.castTime = 0;
                this.player.currentSpell = null;
            },
            
            takeDamage(amount) {
                if (!this.player) return;
                
                this.player.health = Math.max(0, this.player.health - amount);
                
                // Create damage effect
                if (window.visualManager) {
                    window.visualManager.createDamageEffect(this.player.x, this.player.y, amount);
                }
                
                // Update HUD
                if (window.wowHUDIntegration) {
                    window.wowHUDIntegration.updatePlayerState(this.player);
                }
                
                // Check death
                if (this.player.health <= 0) {
                    this.playerDeath();
                }
            },
            
            heal(amount) {
                if (!this.player) return;
                
                this.player.health = Math.min(this.player.maxHealth, this.player.health + amount);
                
                // Create heal effect
                if (window.visualManager) {
                    window.visualManager.createHealEffect(this.player.x, this.player.y, amount);
                }
                
                // Update HUD
                if (window.wowHUDIntegration) {
                    window.wowHUDIntegration.updatePlayerState(this.player);
                }
            },
            
            playerDeath() {
                // Handle player death
                console.log('Player died!');
                if (window.wowHUDIntegration) {
                    window.wowHUDIntegration.showNotification('You have died!', 'error', 5000);
                }
            },
            
            renderPlayer(ctx, camera) {
                if (!this.player || !window.visualManager.spriteSystem) return;
                
                const screenX = this.player.x - camera.x;
                const screenY = this.player.y - camera.y;
                
                // Render shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY + 15, 12, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Render sprite
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.player.rotation);
                
                // Draw player sprite
                window.visualManager.spriteSystem.drawPlayer(
                    ctx, 
                    this.player.class, 
                    0, 
                    0, 
                    this.player.animationFrame
                );
                
                ctx.restore();
                
                // Render casting bar
                if (this.player.casting) {
                    const barWidth = 40;
                    const barHeight = 6;
                    const castPercent = 1 - (this.player.castTime / 2000);
                    
                    // Background
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(screenX - barWidth/2, screenY - 35, barWidth, barHeight);
                    
                    // Cast progress
                    ctx.fillStyle = '#2196F3';
                    ctx.fillRect(screenX - barWidth/2, screenY - 35, barWidth * castPercent, barHeight);
                    
                    // Border
                    ctx.strokeStyle = '#FFF';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(screenX - barWidth/2, screenY - 35, barWidth, barHeight);
                }
                
                // Render name
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.player.name, screenX, screenY - 25);
            }
        };
        
        console.log('✅ Player System inicializado');
    }
    
    initializeEffectSystem() {
        this.effectSystem = {
            effects: [],
            particles: [],
            
            createAttackEffect(x, y, target) {
                this.effects.push({
                    type: 'attack',
                    x: x,
                    y: y,
                    target: target,
                    startTime: Date.now(),
                    duration: 500,
                    color: '#FF0000'
                });
            },
            
            createSpellEffect(x, y, direction, spellType) {
                const spellColors = {
                    'magic_missile': '#9C27B0',
                    'fire_bolt': '#FF5722',
                    'heal': '#4CAF50',
                    'ice_shard': '#2196F3',
                    'lightning': '#FFC107'
                };
                
                this.effects.push({
                    type: 'spell',
                    x: x,
                    y: y,
                    direction: direction,
                    spellType: spellType,
                    startTime: Date.now(),
                    duration: 1000,
                    color: spellColors[spellType] || '#FFFFFF',
                    speed: 300
                });
            },
            
            createDamageEffect(x, y, amount) {
                this.effects.push({
                    type: 'damage',
                    x: x,
                    y: y,
                    amount: amount,
                    startTime: Date.now(),
                    duration: 1000,
                    color: '#FF0000',
                    velocity: { x: (Math.random() - 0.5) * 50, y: -100 }
                });
            },
            
            createHealEffect(x, y, amount) {
                this.effects.push({
                    type: 'heal',
                    x: x,
                    y: y,
                    amount: amount,
                    startTime: Date.now(),
                    duration: 1000,
                    color: '#4CAF50',
                    velocity: { x: (Math.random() - 0.5) * 50, y: -100 }
                });
                
                // Add healing particles
                for (let i = 0; i < 10; i++) {
                    this.particles.push({
                        x: x + (Math.random() - 0.5) * 20,
                        y: y + (Math.random() - 0.5) * 20,
                        vx: (Math.random() - 0.5) * 100,
                        vy: -Math.random() * 100 - 50,
                        color: '#4CAF50',
                        size: Math.random() * 4 + 2,
                        life: 1000
                    });
                }
            },
            
            createLevelUpEffect(x, y) {
                // Create level up particles
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 * i) / 20;
                    this.particles.push({
                        x: x,
                        y: y,
                        vx: Math.cos(angle) * 150,
                        vy: Math.sin(angle) * 150,
                        color: '#FFD700',
                        size: Math.random() * 6 + 4,
                        life: 2000
                    });
                }
                
                // Add level up text effect
                this.effects.push({
                    type: 'levelup',
                    x: x,
                    y: y,
                    startTime: Date.now(),
                    duration: 2000,
                    color: '#FFD700'
                });
            },
            
            updateEffects(deltaTime) {
                const now = Date.now();
                
                // Update effects
                this.effects = this.effects.filter(effect => {
                    const elapsed = now - effect.startTime;
                    
                    if (elapsed > effect.duration) {
                        return false;
                    }
                    
                    switch(effect.type) {
                        case 'spell':
                            effect.x += Math.cos(effect.direction) * effect.speed * deltaTime / 1000;
                            effect.y += Math.sin(effect.direction) * effect.speed * deltaTime / 1000;
                            break;
                        case 'damage':
                        case 'heal':
                            effect.x += effect.velocity.x * deltaTime / 1000;
                            effect.y += effect.velocity.y * deltaTime / 1000;
                            effect.velocity.y += 200 * deltaTime / 1000; // Gravity
                            break;
                    }
                    
                    return true;
                });
                
                // Update particles
                this.particles = this.particles.filter(particle => {
                    particle.x += particle.vx * deltaTime / 1000;
                    particle.y += particle.vy * deltaTime / 1000;
                    particle.vy += 200 * deltaTime / 1000; // Gravity
                    particle.life -= deltaTime;
                    
                    return particle.life > 0;
                });
            },
            
            renderEffects(ctx, camera) {
                const now = Date.now();
                
                // Render effects
                this.effects.forEach(effect => {
                    const elapsed = now - effect.startTime;
                    const progress = elapsed / effect.duration;
                    const screenX = effect.x - camera.x;
                    const screenY = effect.y - camera.y;
                    
                    switch(effect.type) {
                        case 'spell':
                            const alpha = 1 - progress;
                            ctx.globalAlpha = alpha;
                            ctx.fillStyle = effect.color;
                            ctx.beginPath();
                            ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
                            ctx.fill();
                            
                            // Glow effect
                            ctx.shadowBlur = 20;
                            ctx.shadowColor = effect.color;
                            ctx.fill();
                            ctx.shadowBlur = 0;
                            break;
                            
                        case 'damage':
                        case 'heal':
                            const textAlpha = 1 - progress;
                            ctx.globalAlpha = textAlpha;
                            ctx.fillStyle = effect.color;
                            ctx.font = 'bold 16px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText(effect.amount > 0 ? `+${effect.amount}` : effect.amount.toString(), screenX, screenY);
                            break;
                            
                        case 'levelup':
                            const levelUpAlpha = 1 - progress;
                            ctx.globalAlpha = levelUpAlpha;
                            ctx.fillStyle = effect.color;
                            ctx.font = 'bold 24px Arial';
                            ctx.textAlign = 'center';
                            ctx.strokeStyle = '#000';
                            ctx.lineWidth = 3;
                            ctx.strokeText('LEVEL UP!', screenX, screenY - 50);
                            ctx.fillText('LEVEL UP!', screenX, screenY - 50);
                            break;
                    }
                    
                    ctx.globalAlpha = 1;
                });
                
                // Render particles
                this.particles.forEach(particle => {
                    const alpha = particle.life / 1000;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = particle.color;
                    ctx.beginPath();
                    ctx.arc(
                        particle.x - camera.x,
                        particle.y - camera.y,
                        particle.size,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                });
                
                ctx.globalAlpha = 1;
            }
        };
        
        console.log('✅ Effect System inicializado');
    }
    
    setupEventListeners() {
        // Keyboard input
        this.input = {
            up: false,
            down: false,
            left: false,
            right: false,
            attack: false,
            interact: false
        };
        
        document.addEventListener('keydown', (e) => {
            switch((e && e.key ? e.key.toLowerCase() : "")) {
                case 'w': this.input.up = true; break;
                case 's': this.input.down = true; break;
                case 'a': this.input.left = true; break;
                case 'd': this.input.right = true; break;
                case ' ': this.input.attack = true; break;
                case 'e': this.input.interact = true; break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch((e && e.key ? e.key.toLowerCase() : "")) {
                case 'w': this.input.up = false; break;
                case 's': this.input.down = false; break;
                case 'a': this.input.left = false; break;
                case 'd': this.input.right = false; break;
                case ' ': this.input.attack = false; break;
                case 'e': this.input.interact = false; break;
            }
        });
        
        // Mouse input
        this.mainCanvas.addEventListener('click', (e) => {
            const rect = this.mainCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleClick(x, y);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        console.log('✅ Event listeners configurados');
    }
    
    handleClick(x, y) {
        // Convert screen coordinates to world coordinates
        const worldX = x + (this.camera ? this.camera.x : 0);
        const worldY = y + (this.camera ? this.camera.y : 0);
        
        // Check for NPC interaction
        if (this.npcSystem) {
            this.npcSystem.npcs.forEach(npc => {
                const dx = worldX - npc.x;
                const dy = worldY - npc.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 30) {
                    this.npcSystem.startDialogue(npc);
                }
            });
        }
        
        // Check for mob interaction (attack)
        if (this.mobSystem && this.playerSystem && this.playerSystem.player) {
            this.mobSystem.mobs.forEach(mob => {
                const dx = worldX - mob.x;
                const dy = worldY - mob.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 30) {
                    // Attack mob
                    const damage = 10 + Math.floor(Math.random() * 5);
                    mob.health -= damage;
                    
                    // Create attack effect
                    this.effectSystem.createAttackEffect(
                        this.playerSystem.player.x,
                        this.playerSystem.player.y,
                        { x: mob.x, y: mob.y }
                    );
                    
                    // Create damage effect
                    this.effectSystem.createDamageEffect(mob.x, mob.y, damage);
                    
                    // Check if mob is dead
                    if (mob.health <= 0) {
                        this.mobSystem.mobs.delete(mob.id);
                        
                        // Award experience and gold
                        if (this.playerSystem.player) {
                            this.playerSystem.player.exp += mob.exp;
                            this.playerSystem.player.gold += mob.gold;
                            
                            // Check level up
                            if (this.playerSystem.player.exp >= this.playerSystem.player.maxExp) {
                                this.levelUpPlayer();
                            }
                            
                            // Update HUD
                            if (window.wowHUDIntegration) {
                                window.wowHUDIntegration.updatePlayerState(this.playerSystem.player);
                            }
                        }
                        
                        // Create death effect
                        this.createDeathEffect(mob.x, mob.y);
                    }
                }
            });
        }
    }
    
    levelUpPlayer() {
        if (!this.playerSystem || !this.playerSystem.player) return;
        
        const player = this.playerSystem.player;
        player.level++;
        player.exp = 0;
        player.maxExp = player.level * 100;
        player.maxHealth += 20;
        player.health = player.maxHealth;
        player.maxMana += 10;
        player.mana = player.maxMana;
        
        // Create level up effect
        this.effectSystem.createLevelUpEffect(
            player.x,
            player.y
        );
        
        // Notify HUD
        if (window.wowHUDIntegration) {
            window.wowHUDIntegration.showNotification(`Level Up! You are now level ${player.level}!`, 'success', 5000);
            window.wowHUDIntegration.updatePlayerState(player);
        }
    }
    
    createDeathEffect(x, y) {
        // Create death particles
        if (!this.effectSystem || !this.effectSystem.particles) return;
        
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            this.effectSystem.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                color: '#FF0000',
                size: Math.random() * 4 + 2,
                life: 1000
            });
        }
    }
    
    startRenderLoop() {
        const render = (currentTime) => {
            if (!this.active) return;
            
            const deltaTime = currentTime - this.lastUpdateTime;
            this.lastUpdateTime = currentTime;
            
            // Update FPS
            this.frameCount++;
            if (this.frameCount % 60 === 0) {
                this.fps = Math.round(1000 / deltaTime);
            }
            
            // Update systems
            this.update(deltaTime);
            
            // Render
            this.render();
            
            requestAnimationFrame(render);
        };
        
        this.active = true;
        requestAnimationFrame(render);
        
        console.log('✅ Render loop iniciado');
    }
    
    update(deltaTime) {
        // Update player
        if (this.playerSystem && this.playerSystem.player) {
            this.playerSystem.updatePlayer(deltaTime, this.input);
            
            // Update camera to follow player
            this.updateCamera();
        }
        
        // Update mobs
        if (this.mobSystem && this.playerSystem && this.playerSystem.player) {
            this.mobSystem.mobs.forEach(mob => {
                this.mobSystem.updateMob(mob, deltaTime, this.playerSystem.player);
            });
        }
        
        // Update NPCs
        if (this.npcSystem && this.playerSystem && this.playerSystem.player) {
            this.npcSystem.npcs.forEach(npc => {
                this.npcSystem.updateNPC(npc, deltaTime, this.playerSystem.player);
            });
        }
        
        // Update effects
        if (this.effectSystem) {
            this.effectSystem.updateEffects(deltaTime);
        }
        
        // Update HUD minimap
        if (this.playerSystem && this.playerSystem.player && window.wowStyleHUD) {
            window.wowStyleHUD.playerState.position = {
                x: this.playerSystem.player.x,
                y: this.playerSystem.player.y
            };
        }
    }
    
    updateCamera() {
        if (!this.playerSystem || !this.playerSystem.player || !this.mapRenderer) return;
        
        const player = this.playerSystem.player;
        const canvas = this.mainCanvas;
        
        // Center camera on player
        this.camera = {
            x: player.x - canvas.width / 2,
            y: player.y - canvas.height / 2
        };
        
        // Clamp camera to map bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.config.mapWidth * this.config.tileSize - canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.config.mapHeight * this.config.tileSize - canvas.height));
    }
    
    render() {
        const ctx = this.mainCtx;
        
        // Limpar canvas
        ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        
        // Só renderizar se estiver ativo
        if (!this.active) return;
        
        // Renderizar mapa
        if (this.mapRenderer && this.camera) {
            this.mapRenderer.render(ctx, this.camera);
        }
        
        // Renderizar NPCs
        if (this.npcSystem) {
            this.npcSystem.npcs.forEach(npc => {
                this.npcSystem.renderNPC(ctx, npc, this.camera);
            });
        }
        
        // Renderizar mobs
        if (this.mobSystem) {
            this.mobSystem.mobs.forEach(mob => {
                this.mobSystem.renderMob(ctx, mob, this.camera);
            });
        }
        
        // Renderizar player
        if (this.playerSystem && this.playerSystem.player) {
            this.playerSystem.renderPlayer(ctx, this.camera);
        }
        
        // Renderizar efeitos
        if (this.effectSystem) {
            this.effectSystem.renderEffects(ctx, this.camera);
        }
        
        // Renderizar debug info
        if (this.showDebug) {
            this.renderDebugInfo(ctx);
        }
    }
    
    renderDebugInfo(ctx) {
        ctx.fillStyle = '#FFF';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        
        const debugInfo = [
            `FPS: ${this.fps}`,
            `Player: ${this.playerSystem && this.playerSystem.player ? `(${Math.round(this.playerSystem.player.x || 0)}, ${Math.round(this.playerSystem.player.y || 0)})` : 'None'}`,
            `Mobs: ${this.mobSystem ? this.mobSystem.mobs.size : 0}`,
            `NPCs: ${this.npcSystem ? this.npcSystem.npcs.size : 0}`,
            `Effects: ${this.effectSystem ? this.effectSystem.effects.length : 0}`,
            `Particles: ${this.effectSystem ? this.effectSystem.particles.length : 0}`
        ];
        
        debugInfo.forEach((info, index) => {
            ctx.fillText(info, 10, 20 + index * 15);
        });
    }
    
    // Public methods for external control
    spawnWorld() {
        console.log('🌍 Gerando mundo...');
        
        // Spawn player
        if (this.playerSystem) {
            this.playerSystem.createPlayer('Hero', 'apprentice', 400, 300);
            console.log('✅ Player spawnado');
        }
        
        // Spawn mobs
        if (this.mobSystem) {
            const mobTypes = ['rat', 'slime', 'wolf', 'goblin', 'bear'];
            for (let i = 0; i < this.config.maxMobs; i++) {
                const type = mobTypes[Math.floor(Math.random() * mobTypes.length)];
                const x = Math.random() * this.config.mapWidth * this.config.tileSize;
                const y = Math.random() * this.config.mapHeight * this.config.tileSize;
                this.mobSystem.spawnMob(type, x, y);
            }
            console.log(`✅ ${this.config.maxMobs} mobs spawnados`);
        }
        
        // Spawn NPCs
        if (this.npcSystem) {
            const npcTypes = ['merchant', 'guard', 'blacksmith', 'healer', 'quest_giver'];
            const npcPositions = [
                { x: 200, y: 200 },  // Merchant
                { x: 600, y: 200 },  // Guard
                { x: 400, y: 400 },  // Blacksmith
                { x: 200, y: 400 },  // Healer
                { x: 600, y: 400 }   // Quest Giver
            ];
            
            npcPositions.forEach((pos, index) => {
                if (index < npcTypes.length) {
                    this.npcSystem.spawnNPC(npcTypes[index], pos.x, pos.y);
                }
            });
            console.log(`✅ ${npcTypes.length} NPCs spawnados`);
        }
        
        // Update HUD with initial player state
        if (this.playerSystem.player && window.wowHUDIntegration) {
            window.wowHUDIntegration.updatePlayerState(this.playerSystem.player);
        }
        
        console.log('✅ Mundo gerado com sucesso');
    }
    
    activate() {
        this.active = true;
        this.mainCanvas.style.display = 'block';
        this.spawnWorld();
        console.log('✅ Visual Integration Manager ativado');
    }
    
    deactivate() {
        this.active = false;
        this.mainCanvas.style.display = 'none';
        console.log('✅ Visual Integration Manager desativado');
    }
    
    toggleDebug() {
        this.showDebug = !this.showDebug;
        console.log(`🐛 Debug mode: ${this.showDebug ? 'ON' : 'OFF'}`);
    }
    
    getSystemInfo() {
        return {
            initialized: this.initialized,
            active: this.active,
            fps: this.fps,
            entities: {
                player: !!(this.playerSystem && this.playerSystem.player),
                mobs: this.mobSystem ? this.mobSystem.mobs.size : 0,
                npcs: this.npcSystem ? this.npcSystem.npcs.size : 0,
                effects: this.effectSystem ? this.effectSystem.effects.length : 0,
                particles: this.effectSystem ? this.effectSystem.particles.length : 0
            },
            systems: {
                spriteSystem: !!this.spriteSystem,
                mapRenderer: !!this.mapRenderer,
                mobSystem: !!this.mobSystem,
                npcSystem: !!this.npcSystem,
                playerSystem: !!this.playerSystem,
                effectSystem: !!this.effectSystem
            }
        };
    }
}

// Criar instância global
window.visualManager = new VisualIntegrationManager();

// Exportar para uso global
window.VisualIntegrationManager = VisualIntegrationManager;
