/**
 * WorldEventManager - Sistema de Eventos de Mundo
 * 
 * Features:
 * - Eventos automáticos periódicos
 * - Eventos triggered por admin/GMs
 * - Tipos: Invasão, Boss World, Meteor Shower, etc.
 * - Notificações em tempo real
 * - Recompensas por participação
 * - Leaderboard de contribuição
 */

class WorldEventManager {
    constructor(server) {
        this.server = server;
        this.io = server.io;
        this.activeEvents = new Map(); // eventId -> event data
        this.eventHistory = []; // Completed events
        this.playerContributions = new Map(); // eventId -> player contributions
        
        // Configurações
        this.config = {
            autoEvents: true,
            minIntervalBetweenEvents: 30 * 60 * 1000, // 30 minutos
            maxConcurrentEvents: 2,
            eventDuration: {
                invasion: 20 * 60 * 1000,      // 20 minutos
                boss: 30 * 60 * 1000,            // 30 minutos
                meteor: 15 * 60 * 1000,          // 15 minutos
                treasure: 10 * 60 * 1000,        // 10 minutos
                defenseline: 25 * 60 * 1000      // 25 minutos
            }
        };
        
        // Definições dos eventos
        this.EVENT_DEFINITIONS = {
            monster_invasion: {
                id: 'monster_invasion',
                name: 'Invasão de Monstros',
                description: 'Hordas de monstros estão atacando a cidade! Defenda os civis!',
                icon: '👹',
                color: '#DC143C',
                type: 'invasion',
                duration: 20 * 60 * 1000,
                minPlayers: 5,
                maxPlayers: 100,
                locations: ['korvien_village', 'eldoria_city', 'verdantis_outpost'],
                waves: 5,
                mobs: ['goblin_raider', 'orc_warrior', 'troll_brute', 'ogre_crusher'],
                rewards: {
                    xp: 2000,
                    gold: 500,
                    items: ['Invasion Token', 'Defender Medal'],
                    bonusPerKill: { xp: 50, gold: 10 }
                }
            },
            
            world_boss: {
                id: 'world_boss',
                name: 'Boss World',
                description: 'Um boss poderoso apareceu! Todos os jogadores devem se unir para derrotá-lo!',
                icon: '👾',
                color: '#8B008B',
                type: 'boss',
                duration: 30 * 60 * 1000,
                minPlayers: 10,
                maxPlayers: 100,
                locations: ['world_boss_arena', 'ancient_ruins'],
                bosses: [
                    { name: 'Ancient Dragon', level: 50, hp: 1000000 },
                    { name: 'Colossal Golem', level: 45, hp: 800000 },
                    { name: 'Demon Lord', level: 55, hp: 1200000 }
                ],
                rewards: {
                    xp: 5000,
                    gold: 2000,
                    items: ['World Boss Chest', 'Epic Token'],
                    damageBonus: { xp: 1, gold: 0.5 } // per 1000 damage
                }
            },
            
            meteor_shower: {
                id: 'meteor_shower',
                name: 'Chuva de Meteoros',
                description: 'Meteoros caem do céu trazendo recursos raros! Colete-os antes que sumam!',
                icon: '☄️',
                color: '#FF4500',
                type: 'meteor',
                duration: 15 * 60 * 1000,
                minPlayers: 1,
                maxPlayers: 50,
                locations: ['crimson_wastes', 'stardust_fields'],
                meteorCount: 30,
                rewards: {
                    xp: 1000,
                    gold: 0,
                    items: ['Meteorite Ore', 'Stardust', 'Cosmic Gem'],
                    bonusPerMeteor: { xp: 100, items: ['Rare Material'] }
                }
            },
            
            treasure_hunt: {
                id: 'treasure_hunt',
                name: 'Caça ao Tesouro',
                description: 'Tesouros antigos foram descobertos! Encontre-os primeiro!',
                icon: '💰',
                color: '#FFD700',
                type: 'treasure',
                duration: 10 * 60 * 1000,
                minPlayers: 1,
                maxPlayers: 30,
                locations: ['forgotten_ruins', 'sunken_caves'],
                treasureCount: 10,
                rewards: {
                    xp: 800,
                    gold: 1000,
                    items: ['Treasure Map', 'Ancient Coin', 'Golden Idol'],
                    bonusPerTreasure: { gold: 500, xp: 200 }
                }
            },
            
            defense_line: {
                id: 'defense_line',
                name: 'Linha de Defesa',
                description: 'Defenda a linha de defesa contra ondas crescentes de inimigos!',
                icon: '🛡️',
                color: '#4169E1',
                type: 'defenseline',
                duration: 25 * 60 * 1000,
                minPlayers: 8,
                maxPlayers: 50,
                locations: ['border_fortress', 'watchtower_ridge'],
                waves: 8,
                rewards: {
                    xp: 3000,
                    gold: 800,
                    items: ['Defense Token', 'Veteran Badge'],
                    waveBonus: { xp: 500, gold: 150 } // per wave survived
                }
            }
        };
        
        // Schedule de eventos automáticos
        this.eventSchedule = [
            { type: 'monster_invasion', hour: 10 },
            { type: 'world_boss', hour: 14 },
            { type: 'meteor_shower', hour: 18 },
            { type: 'treasure_hunt', hour: 20 },
            { type: 'defense_line', hour: 22 },
            { type: 'world_boss', hour: 2 } // late night for different timezone
        ];
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        this.startAutoEventScheduler();
        this.startContributionTracker();
        
        console.log('[WorldEventManager] Sistema de eventos de mundo inicializado');
    }
    
    setupEventHandlers() {
        // GM/Admin commands
        this.server.on('gm:startEvent', (socket, data) => {
            this.handleGMStartEvent(socket, data);
        });
        
        this.server.on('gm:stopEvent', (socket, data) => {
            this.handleGMStopEvent(socket, data);
        });
        
        // Player participation
        this.server.on('event:contribute', (socket, data) => {
            this.handlePlayerContribution(socket, data);
        });
        
        this.server.on('event:join', (socket, data) => {
            this.handlePlayerJoin(socket, data);
        });
        
        // Mob death tracking for invasion events
        this.server.on('mob:death', (mobId, killerId, eventData) => {
            this.handleMobDeathInEvent(mobId, killerId, eventData);
        });
    }
    
    // ===== AUTO SCHEDULER =====
    
    startAutoEventScheduler() {
        if (!this.config.autoEvents) return;
        
        // Check every minute for scheduled events
        setInterval(() => {
            this.checkScheduledEvents();
        }, 60 * 1000);
        
        console.log('[WorldEventManager] Auto-scheduler iniciado');
    }
    
    checkScheduledEvents() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Only trigger at minute 0 of each hour
        if (currentMinute !== 0) return;
        
        // Check if there's an event scheduled for this hour
        const scheduledEvent = this.eventSchedule.find(e => e.hour === currentHour);
        
        if (scheduledEvent) {
            // Check if we already have too many events
            if (this.activeEvents.size >= this.config.maxConcurrentEvents) {
                console.log(`[WorldEventManager] Evento agendado para ${currentHour}h ignorado - máximo de eventos ativos atingido`);
                return;
            }
            
            // Start the scheduled event
            this.startEvent(scheduledEvent.type);
        }
    }
    
    // ===== EVENT MANAGEMENT =====
    
    startEvent(eventType, forced = false) {
        const eventDef = this.EVENT_DEFINITIONS[eventType];
        if (!eventDef) {
            console.error(`[WorldEventManager] Tipo de evento inválido: ${eventType}`);
            return null;
        }
        
        // Check if already running
        for (const [id, event] of this.activeEvents) {
            if (event.type === eventType) {
                console.log(`[WorldEventManager] Evento ${eventType} já está em execução`);
                return null;
            }
        }
        
        // Create event instance
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const location = eventDef.locations[Math.floor(Math.random() * eventDef.locations.length)];
        
        const event = {
            id: eventId,
            type: eventType,
            definition: eventDef,
            status: 'starting',
            startTime: Date.now(),
            endTime: Date.now() + eventDef.duration,
            location: location,
            participants: new Set(),
            contributions: new Map(), // playerId -> contribution data
            data: {} // Event-specific data
        };
        
        // Initialize event-specific data
        this.initializeEventData(event);
        
        this.activeEvents.set(eventId, event);
        this.playerContributions.set(eventId, new Map());
        
        // Start countdown
        this.startEventCountdown(event);
        
        // Broadcast to all players
        this.broadcastEventStart(event);
        
        console.log(`[WorldEventManager] Evento iniciado: ${eventDef.name} (${eventId})`);
        
        return event;
    }
    
    initializeEventData(event) {
        const def = event.definition;
        
        switch (def.type) {
            case 'invasion':
                event.data.currentWave = 0;
                event.data.totalKills = 0;
                event.data.mobsSpawned = [];
                break;
                
            case 'boss':
                const boss = def.bosses[Math.floor(Math.random() * def.bosses.length)];
                event.data.boss = { ...boss, currentHp: boss.hp };
                event.data.damageDealt = new Map();
                break;
                
            case 'meteor':
                event.data.meteors = [];
                event.data.meteorsCollected = 0;
                this.spawnMeteors(event);
                break;
                
            case 'treasure':
                event.data.treasures = [];
                event.data.treasuresFound = 0;
                this.spawnTreasures(event);
                break;
                
            case 'defenseline':
                event.data.currentWave = 0;
                event.data.wavesSurvived = 0;
                event.data.lineHealth = 100;
                break;
        }
    }
    
    stopEvent(eventId, reason = 'completed') {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        event.status = reason;
        
        // Calculate final rewards
        this.distributeRewards(event);
        
        // Broadcast end
        this.broadcastEventEnd(event, reason);
        
        // Save to history
        this.eventHistory.push({
            ...event,
            participants: Array.from(event.participants),
            contributions: Object.fromEntries(event.contributions)
        });
        
        // Cleanup
        this.activeEvents.delete(eventId);
        this.playerContributions.delete(eventId);
        
        console.log(`[WorldEventManager] Evento ${eventId} finalizado: ${reason}`);
    }
    
    // ===== EVENT MECHANICS =====
    
    spawnMeteors(event) {
        const def = event.definition;
        const location = event.location;
        
        // Spawn meteors periodically
        const meteorInterval = setInterval(() => {
            if (!this.activeEvents.has(event.id)) {
                clearInterval(meteorInterval);
                return;
            }
            
            if (event.data.meteors.length >= def.meteorCount) {
                clearInterval(meteorInterval);
                return;
            }
            
            const meteor = {
                id: `meteor_${Date.now()}_${Math.random()}`,
                x: 200 + Math.random() * 600,
                y: 200 + Math.random() * 400,
                spawnedAt: Date.now(),
                collectedBy: null
            };
            
            event.data.meteors.push(meteor);
            
            // Notify players about new meteor
            this.io.emit('worldevent:meteor_spawned', {
                eventId: event.id,
                meteor: meteor,
                location: location
            });
        }, 30000); // New meteor every 30 seconds
    }
    
    spawnTreasures(event) {
        const def = event.definition;
        
        for (let i = 0; i < def.treasureCount; i++) {
            const treasure = {
                id: `treasure_${Date.now()}_${i}`,
                x: 200 + Math.random() * 600,
                y: 200 + Math.random() * 400,
                rarity: Math.random() < 0.2 ? 'rare' : Math.random() < 0.5 ? 'uncommon' : 'common',
                foundBy: null,
                foundAt: null
            };
            
            event.data.treasures.push(treasure);
        }
        
        // Send treasure locations to all players
        this.io.emit('worldevent:treasures_spawned', {
            eventId: event.id,
            treasures: event.data.treasures.map(t => ({
                id: t.id,
                x: t.x,
                y: t.y,
                rarity: t.rarity
            })),
            location: event.location
        });
    }
    
    // ===== PARTICIPATION =====
    
    handlePlayerJoin(socket, data) {
        const event = this.activeEvents.get(data.eventId);
        if (!event) {
            socket.emit('worldevent:error', { message: 'Evento não encontrado' });
            return;
        }
        
        const playerId = socket.playerId;
        
        // Check if already joined
        if (event.participants.has(playerId)) {
            socket.emit('worldevent:already_joined');
            return;
        }
        
        // Check player level
        const player = this.server.players.get(playerId);
        if (!player) return;
        
        // Add to participants
        event.participants.add(playerId);
        
        // Initialize contribution
        event.contributions.set(playerId, {
            kills: 0,
            damage: 0,
            objectives: 0,
            score: 0
        });
        
        socket.emit('worldevent:joined', {
            eventId: event.id,
            eventType: event.type,
            endTime: event.endTime,
            location: event.location
        });
        
        console.log(`[WorldEventManager] Jogador ${player.name} entrou no evento ${event.id}`);
    }
    
    handlePlayerContribution(socket, data) {
        const event = this.activeEvents.get(data.eventId);
        if (!event) return;
        
        const playerId = socket.playerId;
        const contribution = event.contributions.get(playerId);
        if (!contribution) return;
        
        // Update contribution based on type
        switch (data.type) {
            case 'kill':
                contribution.kills += data.amount || 1;
                contribution.score += 10;
                break;
                
            case 'damage':
                contribution.damage += data.amount || 0;
                contribution.score += Math.floor(data.amount / 100);
                break;
                
            case 'objective':
                contribution.objectives += 1;
                contribution.score += 50;
                break;
                
            case 'meteor':
                contribution.objectives += 1;
                contribution.score += 20;
                event.data.meteorsCollected++;
                break;
                
            case 'treasure':
                contribution.objectives += 1;
                contribution.score += 30;
                event.data.treasuresFound++;
                break;
        }
        
        // Update personal contribution tracking
        this.playerContributions.get(event.id).set(playerId, contribution);
        
        // Send update to player
        socket.emit('worldevent:contribution_updated', contribution);
    }
    
    handleMobDeathInEvent(mobId, killerId, eventData) {
        // Check if this mob was part of an active event
        for (const [eventId, event] of this.activeEvents) {
            if (event.data.mobsSpawned?.includes(mobId)) {
                // Award contribution to killer
                const socket = this.getSocketByPlayerId(killerId);
                if (socket) {
                    this.handlePlayerContribution(socket, {
                        eventId: eventId,
                        type: 'kill',
                        amount: 1
                    });
                }
                
                event.data.totalKills++;
                
                // Check for wave completion
                if (event.definition.type === 'invasion') {
                    this.checkWaveProgress(event);
                }
                
                break;
            }
        }
    }
    
    checkWaveProgress(event) {
        const def = event.definition;
        const killsNeededPerWave = 10; // Example: 10 kills per wave
        
        const currentWaveKills = event.data.totalKills % killsNeededPerWave;
        
        if (currentWaveKills === 0 && event.data.totalKills > 0) {
            event.data.currentWave++;
            
            // Broadcast wave completion
            this.io.emit('worldevent:wave_completed', {
                eventId: event.id,
                wave: event.data.currentWave,
                totalWaves: def.waves
            });
            
            // Spawn next wave
            if (event.data.currentWave < def.waves) {
                this.spawnInvasionWave(event);
            } else {
                // All waves completed
                this.stopEvent(event.id, 'completed');
            }
        }
    }
    
    spawnInvasionWave(event) {
        const def = event.definition;
        const mobType = def.mobs[Math.min(event.data.currentWave, def.mobs.length - 1)];
        
        // This would integrate with your mob spawning system
        console.log(`[WorldEventManager] Spawning wave ${event.data.currentWave + 1} of ${mobType}s`);
        
        // Notify clients
        this.io.emit('worldevent:wave_started', {
            eventId: event.id,
            wave: event.data.currentWave + 1,
            mobType: mobType
        });
    }
    
    // ===== REWARDS =====
    
    distributeRewards(event) {
        const def = event.definition;
        const contributions = Array.from(event.contributions.entries());
        
        // Sort by score
        contributions.sort((a, b) => b[1].score - a[1].score);
        
        // Base rewards for all participants
        for (const [playerId, contribution] of contributions) {
            const player = this.server.players.get(playerId);
            if (!player) continue;
            
            const socket = this.getSocketByPlayerId(playerId);
            if (!socket) continue;
            
            // Calculate rewards
            let xpReward = def.rewards.xp;
            let goldReward = def.rewards.gold;
            const items = [...def.rewards.items];
            
            // Add bonus based on contribution
            if (contribution.kills > 0 && def.rewards.bonusPerKill) {
                xpReward += contribution.kills * def.rewards.bonusPerKill.xp;
                goldReward += contribution.kills * def.rewards.bonusPerKill.gold;
            }
            
            if (contribution.damage > 0 && def.rewards.damageBonus) {
                xpReward += Math.floor(contribution.damage / 1000) * def.rewards.damageBonus.xp;
                goldReward += Math.floor(contribution.damage / 1000) * def.rewards.damageBonus.gold;
            }
            
            // Top 3 get extra rewards
            const rank = contributions.findIndex(c => c[0] === playerId) + 1;
            if (rank <= 3) {
                items.push(`${rank}st Place Trophy`);
                xpReward *= (1.5 - (rank * 0.1)); // 1.4x, 1.3x, 1.2x
            }
            
            // Give rewards
            this.giveRewardsToPlayer(player, socket, {
                xp: xpReward,
                gold: goldReward,
                items: items,
                rank: rank,
                contribution: contribution
            });
        }
    }
    
    giveRewardsToPlayer(player, socket, rewards) {
        // Add XP
        if (rewards.xp > 0) {
            player.xp = (player.xp || 0) + rewards.xp;
            player.totalXp = (player.totalXp || 0) + rewards.xp;
        }
        
        // Add gold
        if (rewards.gold > 0) {
            player.gold = (player.gold || 0) + rewards.gold;
        }
        
        // Add items (placeholder - would integrate with inventory system)
        if (rewards.items && !player.eventRewards) {
            player.eventRewards = [];
        }
        player.eventRewards?.push(...rewards.items);
        
        // Send to player
        socket.emit('worldevent:rewards', {
            xp: rewards.xp,
            gold: rewards.gold,
            items: rewards.items,
            rank: rewards.rank,
            contribution: rewards.contribution
        });
    }
    
    // ===== BROADCASTING =====
    
    broadcastEventStart(event) {
        const def = event.definition;
        
        this.io.emit('worldevent:started', {
            eventId: event.id,
            type: event.type,
            name: def.name,
            description: def.description,
            icon: def.icon,
            color: def.color,
            location: event.location,
            endTime: event.endTime,
            duration: def.duration
        });
        
        // Also send announcement
        this.io.emit('chat:announcement', {
            type: 'world_event',
            message: `🌍 EVENTO MUNDIAL: ${def.name} começou! Vá para ${event.location}!`,
            color: def.color
        });
    }
    
    broadcastEventEnd(event, reason) {
        const def = event.definition;
        
        this.io.emit('worldevent:ended', {
            eventId: event.id,
            type: event.type,
            name: def.name,
            reason: reason,
            participants: event.participants.size
        });
        
        // Announcement
        const message = reason === 'completed' 
            ? `🎉 ${def.name} foi completado com sucesso!` 
            : `⏹️ ${def.name} foi encerrado.`;
            
        this.io.emit('chat:announcement', {
            type: 'world_event',
            message: message,
            color: def.color
        });
    }
    
    startEventCountdown(event) {
        const updateInterval = setInterval(() => {
            if (!this.activeEvents.has(event.id)) {
                clearInterval(updateInterval);
                return;
            }
            
            const remaining = event.endTime - Date.now();
            
            if (remaining <= 0) {
                this.stopEvent(event.id, 'timeout');
                clearInterval(updateInterval);
                return;
            }
            
            // Send time update every 30 seconds
            if (remaining % 30000 < 1000) {
                this.io.emit('worldevent:time_update', {
                    eventId: event.id,
                    remaining: remaining
                });
            }
        }, 1000);
    }
    
    // ===== GM COMMANDS =====
    
    handleGMStartEvent(socket, data) {
        // Verify GM status
        if (!this.isGM(socket.playerId)) {
            socket.emit('gm:error', { message: 'Acesso negado' });
            return;
        }
        
        const event = this.startEvent(data.eventType, true);
        if (event) {
            socket.emit('gm:success', { 
                message: `Evento ${data.eventType} iniciado com ID: ${event.id}` 
            });
        }
    }
    
    handleGMStopEvent(socket, data) {
        if (!this.isGM(socket.playerId)) {
            socket.emit('gm:error', { message: 'Acesso negado' });
            return;
        }
        
        this.stopEvent(data.eventId, 'gm_stopped');
        socket.emit('gm:success', { message: 'Evento encerrado' });
    }
    
    // ===== UTILITIES =====
    
    isGM(playerId) {
        const player = this.server.players.get(playerId);
        return player?.isGM || player?.isAdmin || false;
    }
    
    getSocketByPlayerId(playerId) {
        // This would need to be implemented based on your socket.io setup
        // For now, placeholder
        return null;
    }
    
    startContributionTracker() {
        // Periodic leaderboard updates
        setInterval(() => {
            for (const [eventId, event] of this.activeEvents) {
                if (event.contributions.size === 0) continue;
                
                const sorted = Array.from(event.contributions.entries())
                    .sort((a, b) => b[1].score - a[1].score)
                    .slice(0, 10);
                
                this.io.emit('worldevent:leaderboard', {
                    eventId: eventId,
                    leaderboard: sorted.map(([id, contrib]) => ({
                        playerId: id,
                        score: contrib.score,
                        kills: contrib.kills,
                        damage: contrib.damage
                    }))
                });
            }
        }, 30000); // Update every 30 seconds
    }
    
    // ===== API =====
    
    getActiveEvents() {
        return Array.from(this.activeEvents.values()).map(event => ({
            id: event.id,
            type: event.type,
            name: event.definition.name,
            icon: event.definition.icon,
            color: event.definition.color,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            participants: event.participants.size,
            status: event.status
        }));
    }
    
    getEventHistory(limit = 10) {
        return this.eventHistory.slice(-limit).reverse();
    }
}

module.exports = WorldEventManager;
