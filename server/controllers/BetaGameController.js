/**
 * Beta Game Controller - Controlador Principal do Jogo
 * Gerencia todas as operações de gameplay para beta
 * Version 1.0.0 - Beta Ready
 */

const DatabaseService = require('../services/DatabaseService');
const RedisCacheService = require('../cache/RedisCacheService');

class BetaGameController {
    constructor() {
        this.db = new DatabaseService();
        this.cache = new RedisCacheService();
        this.players = new Map();
        this.mobs = new Map();
        this.worldState = {
            time: 0,
            weather: 'clear',
            events: [],
            globalQuests: []
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎮 Inicializando Beta Game Controller v1.0.0');
        
        // Inicializar sistemas
        await this.initializeWorld();
        await this.initializeMobs();
        await this.initializeQuests();
        await this.initializeEvents();
        
        // Iniciar loops do jogo
        this.startGameLoops();
        
        console.log('✅ Beta Game Controller inicializado com sucesso');
    }
    
    async initializeWorld() {
        // Configurar mundo base
        this.worldConfig = {
            name: 'Aethelgard',
            title: 'Legacy of Komodo',
            width: 2000,
            height: 2000,
            maxPlayers: 100,
            maxMobs: 500,
            safeZones: [
                { x: 400, y: 400, radius: 100, name: 'Aethelgard City' },
                { x: 1000, y: 1000, radius: 80, name: 'Trading Post' },
                { x: 1600, y: 1600, radius: 60, name: 'Sanctuary' }
            ],
            spawnPoints: [
                { x: 400, y: 400, type: 'city' },
                { x: 300, y: 300, type: 'forest' },
                { x: 500, y: 500, type: 'plains' },
                { x: 1500, y: 1500, type: 'mountains' }
            ]
        };
        
        // Salvar configuração no cache
        await this.cache.set('world_config', this.worldConfig, 3600);
    }
    
    async initializeMobs() {
        // Configurações de mobs
        this.mobConfigs = {
            goblin_raider: {
                name: 'Goblin Saqueador',
                level: 1,
                hp: 30,
                maxHp: 30,
                attack: 5,
                defense: 2,
                speed: 80,
                exp: 15,
                gold: 5,
                respawnTime: 30000,
                spawnAreas: ['forest', 'plains'],
                behavior: 'aggressive',
                skills: ['basic_attack'],
                loot: [
                    { id: 'goblin_ear', chance: 0.3, quantity: 1 },
                    { id: 'rusty_dagger', chance: 0.1, quantity: 1 }
                ]
            },
            dire_wolf: {
                name: 'Lobo Terrível',
                level: 3,
                hp: 50,
                maxHp: 50,
                attack: 8,
                defense: 3,
                speed: 120,
                exp: 25,
                gold: 10,
                respawnTime: 45000,
                spawnAreas: ['forest', 'mountains'],
                behavior: 'aggressive',
                skills: ['bite', 'howl'],
                loot: [
                    { id: 'wolf_pelt', chance: 0.4, quantity: 1 },
                    { id: 'wolf_tooth', chance: 0.2, quantity: 2 }
                ]
            },
            mountain_orc: {
                name: 'Orc da Montanha',
                level: 5,
                hp: 80,
                maxHp: 80,
                attack: 12,
                defense: 5,
                speed: 60,
                exp: 40,
                gold: 20,
                respawnTime: 60000,
                spawnAreas: ['mountains'],
                behavior: 'territorial',
                skills: ['heavy_attack', 'battle_cry'],
                loot: [
                    { id: 'orc_axe', chance: 0.2, quantity: 1 },
                    { id: 'iron_ore', chance: 0.3, quantity: 2 }
                ]
            },
            forest_spirit: {
                name: 'Espírito da Floresta',
                level: 7,
                hp: 60,
                maxHp: 60,
                attack: 10,
                defense: 8,
                speed: 100,
                exp: 35,
                gold: 15,
                respawnTime: 90000,
                spawnAreas: ['forest'],
                behavior: 'neutral',
                skills: ['nature_heal', 'entangle'],
                loot: [
                    { id: 'spirit_essence', chance: 0.3, quantity: 1 },
                    { id: 'healing_herb', chance: 0.5, quantity: 2 }
                ]
            },
            shadow_assassin: {
                name: 'Assassino das Sombras',
                level: 10,
                hp: 100,
                maxHp: 100,
                attack: 18,
                defense: 6,
                speed: 140,
                exp: 60,
                gold: 40,
                respawnTime: 120000,
                spawnAreas: ['plains', 'forest'],
                behavior: 'stealth',
                skills: ['backstab', 'vanish', 'poison_blade'],
                loot: [
                    { id: 'shadow_cloak', chance: 0.1, quantity: 1 },
                    { id: 'poison_vial', chance: 0.3, quantity: 1 }
                ]
            },
            ancient_guardian: {
                name: 'Guardião Ancião',
                level: 15,
                hp: 200,
                maxHp: 200,
                attack: 25,
                defense: 15,
                speed: 40,
                exp: 100,
                gold: 100,
                respawnTime: 300000,
                spawnAreas: ['mountains'],
                behavior: 'boss',
                skills: ['ground_slam', 'earthquake', 'regeneration'],
                loot: [
                    { id: 'guardian_shard', chance: 0.5, quantity: 1 },
                    { id: 'ancient_scroll', chance: 0.3, quantity: 1 },
                    { id: 'epic_weapon', chance: 0.1, quantity: 1 }
                ]
            }
        };
        
        // Spawn inicial de mobs
        await this.spawnInitialMobs();
    }
    
    async spawnInitialMobs() {
        const mobCount = 50; // Número inicial de mobs
        
        for (let i = 0; i < mobCount; i++) {
            await this.spawnRandomMob();
        }
        
        console.log(`👾 ${mobCount} mobs spawnados inicialmente`);
    }
    
    async spawnRandomMob() {
        if (this.mobs.size >= this.worldConfig.maxMobs) {
            return null;
        }
        
        // Escolher tipo de mob aleatório
        const mobTypes = Object.keys(this.mobConfigs);
        const randomType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
        const config = this.mobConfigs[randomType];
        
        // Escolher área de spawn
        const spawnArea = config.spawnAreas[Math.floor(Math.random() * config.spawnAreas.length)];
        const position = this.getRandomPositionInArea(spawnArea);
        
        // Criar mob
        const mob = {
            id: `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: randomType,
            ...config,
            x: position.x,
            y: position.y,
            targetX: position.x,
            targetY: position.y,
            lastAttack: 0,
            isDead: false,
            respawnAt: null,
            ai: {
                state: 'idle',
                target: null,
                lastUpdate: Date.now()
            }
        };
        
        this.mobs.set(mob.id, mob);
        
        return mob;
    }
    
    getRandomPositionInArea(area) {
        const areaBounds = {
            forest: { x: 100, y: 100, width: 400, height: 400 },
            plains: { x: 600, y: 100, width: 400, height: 400 },
            mountains: { x: 1100, y: 1100, width: 400, height: 400 }
        };
        
        const bounds = areaBounds[area] || areaBounds.plains;
        
        return {
            x: bounds.x + Math.random() * bounds.width,
            y: bounds.y + Math.random() * bounds.height
        };
    }
    
    async initializeQuests() {
        // Missões globais
        this.globalQuests = [
            {
                id: 'goblin_hunt',
                name: 'Caça aos Goblins',
                description: 'Elimine 10 goblins saqueadores para proteger a cidade.',
                type: 'kill',
                target: 'goblin_raider',
                count: 10,
                reward: { gold: 100, exp: 50, fragments: 2 },
                isActive: true,
                progress: 0,
                participants: new Set()
            },
            {
                id: 'wolf_pelts',
                name: 'Peles de Lobo',
                description: 'Colete 5 peles de lobo para o comerciante.',
                type: 'collect',
                target: 'wolf_pelt',
                count: 5,
                reward: { gold: 75, exp: 30 },
                isActive: true,
                progress: 0,
                participants: new Set()
            },
            {
                id: 'mountain_exploration',
                name: 'Exploração da Montanha',
                description: 'Explore as montanhas e encontre 3 locais secretos.',
                type: 'explore',
                target: 'mountain_location',
                count: 3,
                reward: { gold: 150, exp: 75, fragments: 3 },
                isActive: true,
                progress: 0,
                participants: new Set()
            }
        ];
        
        // Salvar quests no cache
        await this.cache.set('global_quests', this.globalQuests, 3600);
    }
    
    async initializeEvents() {
        // Eventos dinâmicos
        this.eventConfigs = [
            {
                id: 'goblin_invasion',
                name: 'Invasão Goblin',
                type: 'invasion',
                duration: 300000, // 5 minutos
                probability: 0.1, // 10% de chance por hora
                description: 'Goblins estão invadindo a área!',
                rewards: { gold: 200, exp: 100, fragments: 5 },
                requirements: { minPlayers: 5 }
            },
            {
                id: 'merchant_arrival',
                name: 'Chegada do Mercador',
                type: 'merchant',
                duration: 600000, // 10 minutos
                probability: 0.2, // 20% de chance por hora
                description: 'Um mercador viajante chegou com itens raros!',
                rewards: { discount: 20, special_items: true }
            },
            {
                id: 'world_boss',
                name: 'Aparição do Boss Mundial',
                type: 'boss',
                duration: 900000, // 15 minutos
                probability: 0.05, // 5% de chance por hora
                description: 'Um boss poderoso apareceu no mundo!',
                rewards: { epic_items: true, fragments: 10 }
            }
        ];
    }
    
    startGameLoops() {
        // Loop principal do jogo (60 FPS)
        setInterval(() => this.gameLoop(), 16);
        
        // Loop de AI dos mobs (10 FPS)
        setInterval(() => this.updateMobAI(), 100);
        
        // Loop de spawn de mobs (a cada 30 segundos)
        setInterval(() => this.maintenanceLoop(), 30000);
        
        // Loop de eventos (a cada 5 minutos)
        setInterval(() => this.eventLoop(), 300000);
        
        // Loop de tempo do mundo (a cada minuto)
        setInterval(() => this.updateWorldTime(), 60000);
    }
    
    gameLoop() {
        this.worldState.time += 16; // 16ms por frame
        
        // Atualizar todos os mobs
        for (const mob of this.mobs.values()) {
            if (!mob.isDead) {
                this.updateMobPosition(mob);
            }
        }
        
        // Verificar colisões
        this.checkCollisions();
        
        // Atualizar cache do mundo
        if (this.worldState.time % 1000 === 0) { // A cada segundo
            this.updateWorldCache();
        }
    }
    
    updateMobAI() {
        const now = Date.now();
        
        for (const mob of this.mobs.values()) {
            if (mob.isDead) continue;
            
            // Atualizar estado da AI
            const ai = mob.ai;
            const timeSinceUpdate = now - ai.lastUpdate;
            
            if (timeSinceUpdate < 1000) continue; // Update a cada segundo
            
            ai.lastUpdate = now;
            
            // Encontrar jogador mais próximo
            const nearestPlayer = this.findNearestPlayer(mob);
            
            if (nearestPlayer) {
                const distance = this.getDistance(mob, nearestPlayer);
                
                // Comportamento baseado no tipo
                switch (mob.behavior) {
                    case 'aggressive':
                        if (distance < 200) {
                            ai.state = 'chasing';
                            ai.target = nearestPlayer.id;
                        } else {
                            ai.state = 'patrolling';
                            ai.target = null;
                        }
                        break;
                        
                    case 'territorial':
                        if (distance < 100) {
                            ai.state = 'attacking';
                            ai.target = nearestPlayer.id;
                        } else {
                            ai.state = 'patrolling';
                            ai.target = null;
                        }
                        break;
                        
                    case 'neutral':
                        if (distance < 50) {
                            ai.state = 'fleeing';
                            ai.target = nearestPlayer.id;
                        } else {
                            ai.state = 'wandering';
                            ai.target = null;
                        }
                        break;
                        
                    case 'stealth':
                        if (distance < 150 && Math.random() < 0.3) {
                            ai.state = 'stalking';
                            ai.target = nearestPlayer.id;
                        } else {
                            ai.state = 'patrolling';
                            ai.target = null;
                        }
                        break;
                        
                    case 'boss':
                        if (distance < 300) {
                            ai.state = 'rampage';
                            ai.target = nearestPlayer.id;
                        } else {
                            ai.state = 'patrolling';
                            ai.target = null;
                        }
                        break;
                }
            }
            
            // Executar comportamento
            this.executeMobBehavior(mob);
        }
    }
    
    executeMobBehavior(mob) {
        const ai = mob.ai;
        
        switch (ai.state) {
            case 'chasing':
            case 'stalking':
                if (ai.target) {
                    const target = this.players.get(ai.target);
                    if (target) {
                        mob.targetX = target.x;
                        mob.targetY = target.y;
                    }
                }
                break;
                
            case 'attacking':
                if (ai.target) {
                    const target = this.players.get(ai.target);
                    if (target && this.getDistance(mob, target) < 50) {
                        this.mobAttack(mob, target);
                    }
                }
                break;
                
            case 'fleeing':
                if (ai.target) {
                    const target = this.players.get(ai.target);
                    if (target) {
                        // Fugir na direção oposta
                        const dx = mob.x - target.x;
                        const dy = mob.y - target.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance > 0) {
                            mob.targetX = mob.x + (dx / distance) * 100;
                            mob.targetY = mob.y + (dy / distance) * 100;
                        }
                    }
                }
                break;
                
            case 'patrolling':
            case 'wandering':
                // Movimento aleatório
                if (Math.random() < 0.1) {
                    mob.targetX = mob.x + (Math.random() - 0.5) * 200;
                    mob.targetY = mob.y + (Math.random() - 0.5) * 200;
                }
                break;
        }
    }
    
    updateMobPosition(mob) {
        const dx = mob.targetX - mob.x;
        const dy = mob.targetY - mob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const moveSpeed = mob.speed / 60; // Converter para pixels por frame
            mob.x += (dx / distance) * moveSpeed;
            mob.y += (dy / distance) * moveSpeed;
            
            // Limitar ao mundo
            mob.x = Math.max(0, Math.min(mob.x, this.worldConfig.width));
            mob.y = Math.max(0, Math.min(mob.y, this.worldConfig.height));
        }
    }
    
    mobAttack(mob, target) {
        const now = Date.now();
        const attackCooldown = 2000; // 2 segundos entre ataques
        
        if (now - mob.lastAttack < attackCooldown) return;
        
        mob.lastAttack = now;
        
        // Calcular dano
        const baseDamage = mob.attack;
        const defense = target.defense || 0;
        const damage = Math.max(1, baseDamage - defense);
        
        // Aplicar dano
        target.hp = Math.max(0, target.hp - damage);
        
        // Notificar jogador
        const playerSocket = this.getPlayerSocket(target.id);
        if (playerSocket) {
            playerSocket.emit('combat_damage', {
                attacker: mob.name,
                damage: damage,
                currentHp: target.hp,
                maxHp: target.maxHp
            });
        }
        
        // Verificar se jogador morreu
        if (target.hp <= 0) {
            this.handlePlayerDeath(target);
        }
        
        console.log(`👾 ${mob.name} atacou ${target.name} por ${damage} de dano`);
    }
    
    handlePlayerDeath(player) {
        // Resetar jogador
        player.hp = player.maxHp;
        player.mana = player.maxMana;
        
        // Mover para ponto de spawn seguro
        const safeZone = this.worldConfig.safeZones[0];
        player.x = safeZone.x;
        player.y = safeZone.y;
        
        // Notificar jogador
        const playerSocket = this.getPlayerSocket(player.id);
        if (playerSocket) {
            playerSocket.emit('player_death', {
                message: 'Você morreu! Foi ressuscitado na cidade.',
                newPosition: { x: player.x, y: player.y }
            });
        }
        
        // Penalidade de exp
        const expLoss = Math.floor(player.exp * 0.1);
        player.exp = Math.max(0, player.exp - expLoss);
        
        console.log(`💀 Jogador ${player.name} morreu e perdeu ${expLoss} de exp`);
    }
    
    findNearestPlayer(mob) {
        let nearestPlayer = null;
        let nearestDistance = Infinity;
        
        for (const player of this.players.values()) {
            const distance = this.getDistance(mob, player);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPlayer = player;
            }
        }
        
        return nearestPlayer;
    }
    
    getDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    checkCollisions() {
        // Verificar colisões entre jogadores e mobs
        for (const player of this.players.values()) {
            for (const mob of this.mobs.values()) {
                if (mob.isDead) continue;
                
                const distance = this.getDistance(player, mob);
                
                if (distance < 30) { // Colisão
                    // Jogador ataca mob
                    if (player.lastAttack && Date.now() - player.lastAttack > 1000) {
                        this.playerAttackMob(player, mob);
                    }
                }
            }
        }
    }
    
    playerAttackMob(player, mob) {
        player.lastAttack = Date.now();
        
        // Calcular dano
        const baseDamage = player.attack || 10;
        const defense = mob.defense || 0;
        const damage = Math.max(1, baseDamage - defense + Math.floor(Math.random() * 5));
        
        // Aplicar dano
        mob.hp = Math.max(0, mob.hp - damage);
        
        // Notificar jogador
        const playerSocket = this.getPlayerSocket(player.id);
        if (playerSocket) {
            playerSocket.emit('mob_damage', {
                mobId: mob.id,
                damage: damage,
                currentHp: mob.hp,
                maxHp: mob.maxHp
            });
        }
        
        // Verificar se mob morreu
        if (mob.hp <= 0) {
            this.handleMobDeath(mob, player);
        }
        
        console.log(`⚔️ ${player.name} atacou ${mob.name} por ${damage} de dano`);
    }
    
    handleMobDeath(mob, killer) {
        mob.isDead = true;
        mob.respawnAt = Date.now() + mob.respawnTime;
        
        // Dar recompensas ao jogador
        killer.exp += mob.exp;
        killer.gold += mob.gold;
        
        // Chance de drop
        if (mob.loot) {
            for (const loot of mob.loot) {
                if (Math.random() < loot.chance) {
                    this.giveLoot(killer, loot);
                }
            }
        }
        
        // Atualizar quests
        this.updateQuestProgress(killer, 'kill', mob.type, 1);
        
        // Notificar todos os jogadores
        this.broadcastToAll('mob_death', {
            mobId: mob.id,
            killer: killer.name,
            rewards: { exp: mob.exp, gold: mob.gold }
        });
        
        // Remover mob do mapa
        this.mobs.delete(mob.id);
        
        console.log(`💀 ${mob.name} morto por ${killer.name}. Recompensas: ${mob.exp} exp, ${mob.gold} gold`);
    }
    
    giveLoot(player, loot) {
        // Adicionar item ao inventário do jogador
        if (!player.inventory) {
            player.inventory = [];
        }
        
        // Verificar se já tem o item
        const existingItem = player.inventory.find(item => item.id === loot.id);
        
        if (existingItem && loot.quantity > 1) {
            existingItem.quantity += loot.quantity;
        } else {
            player.inventory.push({
                id: loot.id,
                name: loot.id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                quantity: loot.quantity || 1,
                icon: this.getItemIcon(loot.id)
            });
        }
        
        // Notificar jogador
        const playerSocket = this.getPlayerSocket(player.id);
        if (playerSocket) {
            playerSocket.emit('loot_received', {
                item: {
                    id: loot.id,
                    name: loot.id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    quantity: loot.quantity || 1
                }
            });
        }
    }
    
    getItemIcon(itemId) {
        const icons = {
            goblin_ear: '👂',
            rusty_dagger: '🗡️',
            wolf_pelt: '🐺',
            wolf_tooth: '🦷',
            orc_axe: '🪓',
            iron_ore: '⛏️',
            spirit_essence: '✨',
            healing_herb: '🌿',
            shadow_cloak: '👘',
            poison_vial: '☠️',
            guardian_shard: '💎',
            ancient_scroll: '📜',
            epic_weapon: '⚔️'
        };
        
        return icons[itemId] || '📦';
    }
    
    updateQuestProgress(player, type, target, count) {
        // Atualizar quests globais
        for (const quest of this.globalQuests) {
            if (quest.type === type && quest.target === target) {
                const playerProgress = quest.progress.get(player.id) || 0;
                const newProgress = Math.min(playerProgress + count, quest.count);
                
                quest.progress.set(player.id, newProgress);
                
                // Verificar se completou
                if (newProgress >= quest.count) {
                    this.completeQuest(player, quest);
                }
                
                // Notificar jogador
                const playerSocket = this.getPlayerSocket(player.id);
                if (playerSocket) {
                    playerSocket.emit('quest_progress', {
                        questId: quest.id,
                        progress: newProgress,
                        total: quest.count
                    });
                }
            }
        }
    }
    
    completeQuest(player, quest) {
        // Dar recompensas
        if (quest.reward.gold) {
            player.gold += quest.reward.gold;
        }
        
        if (quest.reward.exp) {
            player.exp += quest.reward.exp;
        }
        
        if (quest.reward.fragments) {
            player.fragments = (player.fragments || 0) + quest.reward.fragments;
        }
        
        // Notificar jogador
        const playerSocket = this.getPlayerSocket(player.id);
        if (playerSocket) {
            playerSocket.emit('quest_completed', {
                questId: quest.id,
                questName: quest.name,
                rewards: quest.reward
            });
        }
        
        console.log(`🎯 ${player.name} completou a quest: ${quest.name}`);
    }
    
    maintenanceLoop() {
        // Respawn mobs
        this.respawnMobs();
        
        // Limpar jogadores inativos
        this.cleanupInactivePlayers();
        
        // Atualizar cache
        this.updateWorldCache();
    }
    
    respawnMobs() {
        const now = Date.now();
        const maxMobs = this.worldConfig.maxMobs;
        
        // Respawn mobs que morreram
        for (const [mobId, mob] of this.mobs.entries()) {
            if (mob.isDead && mob.respawnAt && now >= mob.respawnAt) {
                // Resetar mob
                mob.hp = mob.maxHp;
                mob.isDead = false;
                mob.respawnAt = null;
                mob.ai.state = 'idle';
                mob.ai.target = null;
                
                // Nova posição
                const position = this.getRandomPositionInArea(mob.spawnAreas[0]);
                mob.x = position.x;
                mob.y = position.y;
                mob.targetX = mob.x;
                mob.targetY = mob.y;
                
                console.log(`👾 ${mob.name} respawnado`);
            }
        }
        
        // Spawn novos mobs se necessário
        while (this.mobs.size < maxMobs) {
            this.spawnRandomMob();
        }
    }
    
    cleanupInactivePlayers() {
        const now = Date.now();
        const inactiveTimeout = 300000; // 5 minutos
        
        for (const [playerId, player] of this.players.entries()) {
            if (now - player.lastActivity > inactiveTimeout) {
                this.players.delete(playerId);
                console.log(`👋 Jogador ${player.name} removido por inatividade`);
            }
        }
    }
    
    eventLoop() {
        // Verificar eventos aleatórios
        for (const eventConfig of this.eventConfigs) {
            if (Math.random() < eventConfig.probability) {
                this.startEvent(eventConfig);
            }
        }
    }
    
    startEvent(eventConfig) {
        const event = {
            ...eventConfig,
            startTime: Date.now(),
            endTime: Date.now() + eventConfig.duration,
            isActive: true,
            participants: new Set()
        };
        
        this.worldState.events.push(event);
        
        // Notificar todos os jogadores
        this.broadcastToAll('event_started', {
            eventId: event.id,
            eventName: event.name,
            description: event.description,
            duration: event.duration
        });
        
        console.log(`🎪 Evento iniciado: ${event.name}`);
        
        // Configurar fim do evento
        setTimeout(() => this.endEvent(event.id), event.duration);
    }
    
    endEvent(eventId) {
        const event = this.worldState.events.find(e => e.id === eventId);
        if (!event) return;
        
        event.isActive = false;
        event.endTime = Date.now();
        
        // Dar recompensas aos participantes
        for (const participantId of event.participants) {
            const participant = this.players.get(participantId);
            if (participant && event.rewards) {
                this.giveEventRewards(participant, event.rewards);
            }
        }
        
        // Notificar fim do evento
        this.broadcastToAll('event_ended', {
            eventId: event.id,
            eventName: event.name
        });
        
        console.log(`🎪 Evento encerrado: ${event.name}`);
    }
    
    giveEventRewards(player, rewards) {
        if (rewards.gold) {
            player.gold += rewards.gold;
        }
        
        if (rewards.exp) {
            player.exp += rewards.exp;
        }
        
        if (rewards.fragments) {
            player.fragments = (player.fragments || 0) + rewards.fragments;
        }
        
        // Notificar jogador
        const playerSocket = this.getPlayerSocket(player.id);
        if (playerSocket) {
            playerSocket.emit('event_rewards', rewards);
        }
    }
    
    updateWorldTime() {
        // Simular ciclo dia/noite
        this.worldState.time = (this.worldState.time + 1) % 1440; // 1440 minutos = 24 horas
        
        const hour = Math.floor(this.worldState.time / 60);
        const minute = this.worldState.time % 60;
        
        // Determinar período do dia
        let timeOfDay;
        if (hour >= 6 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
        else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
        else timeOfDay = 'night';
        
        // Notificar jogadores
        this.broadcastToAll('world_time_update', {
            hour: hour,
            minute: minute,
            timeOfDay: timeOfDay
        });
    }
    
    updateWorldCache() {
        // Atualizar cache do mundo
        const worldData = {
            players: Array.from(this.players.values()),
            mobs: Array.from(this.mobs.values()).filter(mob => !mob.isDead),
            time: this.worldState.time,
            weather: this.worldState.weather,
            events: this.worldState.events.filter(e => e.isActive),
            globalQuests: this.globalQuests
        };
        
        this.cache.set('world_state', worldData, 10); // Cache por 10 segundos
    }
    
    // Métodos de API
    async handlePlayerJoin(socket, playerData) {
        const player = {
            id: playerData.id,
            name: playerData.name,
            level: playerData.level || 1,
            class: playerData.class || 'warrior',
            hp: playerData.hp || 100,
            maxHp: playerData.maxHp || 100,
            mana: playerData.mana || 50,
            maxMana: playerData.maxMana || 50,
            exp: playerData.exp || 0,
            maxExp: playerData.maxExp || 100,
            gold: playerData.gold || 0,
            fragments: playerData.fragments || 0,
            x: playerData.x || 400,
            y: playerData.y || 400,
            attack: playerData.attack || 10,
            defense: playerData.defense || 5,
            inventory: playerData.inventory || [],
            skills: playerData.skills || [],
            lastActivity: Date.now(),
            socket: socket
        };
        
        this.players.set(player.id, player);
        
        // Enviar estado inicial do mundo
        socket.emit('world_init', {
            player: player,
            world: this.worldConfig,
            mobs: Array.from(this.mobs.values()).filter(mob => !mob.isDead),
            quests: this.globalQuests,
            events: this.worldState.events.filter(e => e.isActive)
        });
        
        // Notificar outros jogadores
        this.broadcastToOthers(player.id, 'player_joined', {
            player: {
                id: player.id,
                name: player.name,
                level: player.level,
                class: player.class,
                x: player.x,
                y: player.y
            }
        });
        
        console.log(`👤 Jogador ${player.name} entrou no mundo`);
        
        return player;
    }
    
    handlePlayerMove(playerId, data) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        player.x = data.x;
        player.y = data.y;
        player.lastActivity = Date.now();
        
        // Verificar se está em safe zone
        const inSafeZone = this.isInSafeZone(player.x, player.y);
        
        // Broadcast para outros jogadores
        this.broadcastToOthers(playerId, 'player_move', {
            playerId: playerId,
            x: data.x,
            y: data.y,
            inSafeZone: inSafeZone
        });
    }
    
    handlePlayerAttack(playerId, data) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        player.lastActivity = Date.now();
        
        // Encontrar mob alvo
        const targetMob = this.findMobAtPosition(data.x, data.y);
        if (targetMob) {
            this.playerAttackMob(player, targetMob);
        }
    }
    
    handlePlayerUseSkill(playerId, skillIndex) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        const skill = player.skills[skillIndex];
        if (!skill) return;
        
        player.lastActivity = Date.now();
        
        // Implementar lógica de skill
        this.executePlayerSkill(player, skill);
        
        // Broadcast para outros jogadores
        this.broadcastToOthers(playerId, 'player_skill', {
            playerId: playerId,
            skillIndex: skillIndex,
            skillName: skill.name
        });
    }
    
    executePlayerSkill(player, skill) {
        // Implementar diferentes tipos de skills
        switch (skill.type) {
            case 'heal':
                const healAmount = skill.value || 20;
                player.hp = Math.min(player.maxHp, player.hp + healAmount);
                break;
                
            case 'damage':
                // Damage em área
                const mobsInRange = this.getMobsInRange(player.x, player.y, skill.range || 100);
                for (const mob of mobsInRange) {
                    const damage = skill.value || 15;
                    mob.hp = Math.max(0, mob.hp - damage);
                    
                    if (mob.hp <= 0) {
                        this.handleMobDeath(mob, player);
                    }
                }
                break;
                
            case 'buff':
                // Aplicar buff ao jogador
                player.buffs = player.buffs || [];
                player.buffs.push({
                    type: skill.buffType,
                    value: skill.value,
                    duration: skill.duration || 30000,
                    startTime: Date.now()
                });
                break;
        }
        
        console.log(`⚡ ${player.name} usou skill: ${skill.name}`);
    }
    
    getMobsInRange(x, y, range) {
        const mobs = [];
        
        for (const mob of this.mobs.values()) {
            if (mob.isDead) continue;
            
            const distance = this.getDistance({ x, y }, mob);
            if (distance <= range) {
                mobs.push(mob);
            }
        }
        
        return mobs;
    }
    
    findMobAtPosition(x, y) {
        const range = 50; // Range de ataque
        
        for (const mob of this.mobs.values()) {
            if (mob.isDead) continue;
            
            const distance = this.getDistance({ x, y }, mob);
            if (distance <= range) {
                return mob;
            }
        }
        
        return null;
    }
    
    isInSafeZone(x, y) {
        for (const safeZone of this.worldConfig.safeZones) {
            const distance = Math.sqrt(
                Math.pow(x - safeZone.x, 2) + Math.pow(y - safeZone.y, 2)
            );
            
            if (distance <= safeZone.radius) {
                return true;
            }
        }
        
        return false;
    }
    
    handlePlayerLeave(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            this.players.delete(playerId);
            
            // Notificar outros jogadores
            this.broadcastToOthers(playerId, 'player_left', {
                playerId: playerId,
                playerName: player.name
            });
            
            console.log(`👋 Jogador ${player.name} saiu do mundo`);
        }
    }
    
    handleChatMessage(playerId, data) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        player.lastActivity = Date.now();
        
        // Broadcast para todos
        this.broadcastToAll('chat_message', {
            channel: data.channel || 'global',
            author: player.name,
            message: data.message,
            playerId: playerId
        });
    }
    
    // Métodos utilitários
    getPlayerSocket(playerId) {
        const player = this.players.get(playerId);
        return player ? player.socket : null;
    }
    
    broadcastToAll(event, data) {
        for (const player of this.players.values()) {
            if (player.socket) {
                player.socket.emit(event, data);
            }
        }
    }
    
    broadcastToOthers(excludeId, event, data) {
        for (const [playerId, player] of this.players.entries()) {
            if (playerId !== excludeId && player.socket) {
                player.socket.emit(event, data);
            }
        }
    }
    
    // Métodos de API para controllers
    async getWorldStatus() {
        return {
            players: this.players.size,
            mobs: this.mobs.size,
            maxPlayers: this.worldConfig.maxPlayers,
            maxMobs: this.worldConfig.maxMobs,
            time: this.worldState.time,
            weather: this.worldState.weather,
            events: this.worldState.events.filter(e => e.isActive),
            uptime: process.uptime()
        };
    }
    
    async getMobsInArea(area) {
        const { x, y, width, height } = area;
        
        return Array.from(this.mobs.values()).filter(mob => {
            return !mob.isDead &&
                   mob.x >= x && mob.x <= x + width &&
                   mob.y >= y && mob.y <= y + height;
        });
    }
    
    async getEvents() {
        return this.worldState.events.filter(e => e.isActive);
    }
    
    async joinEvent(playerId, eventId) {
        const player = this.players.get(playerId);
        const event = this.worldState.events.find(e => e.id === eventId);
        
        if (player && event && event.isActive) {
            event.participants.add(playerId);
            return { success: true, event: event };
        }
        
        return { success: false, message: 'Evento não encontrado ou inativo' };
    }
}

module.exports = BetaGameController;
