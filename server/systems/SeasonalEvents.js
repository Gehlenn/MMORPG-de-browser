/**
 * SeasonalEvents.js
 * Sistema de Eventos Temporários e Sazonais
 * Legacy of Komodo MMORPG v0.6.0 - Nível 10
 */

class SeasonalEvents {
    constructor(database, playerManager, notificationManager, bossManager) {
        this.db = database;
        this.playerManager = playerManager;
        this.notificationManager = notificationManager;
        this.bossManager = bossManager;
        
        // Eventos ativos
        this.activeEvents = new Map();
        
        // Eventos recorrentes
        this.eventSchedule = {
            // Eventos semanais
            weekly: {
                doubleXP: { day: 'saturday', multiplier: 2.0, type: 'xp' },
                doubleGold: { day: 'sunday', multiplier: 2.0, type: 'gold' },
                bossRush: { day: 'friday', duration: 4 * 60 * 60 * 1000 }
            },
            
            // Eventos mensais
            monthly: {
                guildWars: { week: 2, day: 'saturday' },
                treasureHunt: { week: 3, day: 'sunday' }
            }
        };
        
        // Eventos especiais (datas fixas)
        this.specialEvents = {
            halloween: {
                id: 'halloween',
                name: 'Festival das Sombras',
                icon: '🎃',
                description: 'Evento de Halloween com bosses especiais e recompensas temáticas',
                startMonth: 10, // Outubro
                startDay: 20,
                endMonth: 10,
                endDay: 31,
                features: {
                    specialBosses: ['headless_horseman', 'pumpkin_king', 'ghost_queen'],
                    exclusiveDrops: ['halloween_candy', 'spooky_mask', 'haunted_ring'],
                    xpMultiplier: 1.5,
                    goldMultiplier: 1.3,
                    spawnRateMultiplier: 2.0
                },
                quests: [
                    { id: 'halloween_1', name: 'Caça às Bruxas', reward: 'witch_hat' },
                    { id: 'halloween_2', name: 'Doçura ou Travessura', reward: 'candy_bag' },
                    { id: 'halloween_3', name: 'O Cavaleiro Sem Cabeça', reward: 'horseman_blade' }
                ]
            },
            
            winter: {
                id: 'winter',
                name: 'Festival do Inverno',
                icon: '❄️',
                description: 'Celebração de inverno com neve, presentes e bosses de gelo',
                startMonth: 12,
                startDay: 15,
                endMonth: 1,
                endDay: 5,
                features: {
                    specialBosses: ['ice_dragon', 'frost_giant', 'yeti_king'],
                    exclusiveDrops: ['snowflake', 'winter_coat', 'ice_crystal'],
                    xpMultiplier: 1.5,
                    goldMultiplier: 1.5,
                    spawnRateMultiplier: 1.5,
                    dailyGifts: true
                },
                quests: [
                    { id: 'winter_1', name: 'Caçador de Yeti', reward: 'yeti_fur' },
                    { id: 'winter_2', name: 'Presentes para Todos', reward: 'gift_sack' },
                    { id: 'winter_3', name: 'Derrotando o Dragão de Gelo', reward: 'frost_sword' }
                ]
            },
            
            spring: {
                id: 'spring',
                name: 'Festival da Renovação',
                icon: '🌸',
                description: 'Celebração da primavera com flores, ovos e natureza',
                startMonth: 4,
                startDay: 1,
                endMonth: 4,
                endDay: 15,
                features: {
                    specialBosses: ['nature_guardian', 'easter_bunny', 'flower_queen'],
                    exclusiveDrops: ['spring_flower', 'easter_egg', 'bloom_staff'],
                    xpMultiplier: 1.3,
                    goldMultiplier: 1.3,
                    spawnRateMultiplier: 1.5,
                    eggHunt: true
                },
                quests: [
                    { id: 'spring_1', name: 'Caça aos Ovos', reward: 'easter_basket' },
                    { id: 'spring_2', name: 'Guardião da Natureza', reward: 'nature_staff' },
                    { id: 'spring_3', name: 'Despertar da Primavera', reward: 'flower_crown' }
                ]
            },
            
            summer: {
                id: 'summer',
                name: 'Festival do Sol',
                icon: '☀️',
                description: 'Celebração de verão com praias, ondas e bosses de fogo',
                startMonth: 7,
                startDay: 1,
                endMonth: 7,
                endDay: 31,
                features: {
                    specialBosses: ['sun_king', 'beach_titan', 'volcano_lord'],
                    exclusiveDrops: ['sun_shard', 'beach_ball', 'surf_board'],
                    xpMultiplier: 1.5,
                    goldMultiplier: 1.2,
                    spawnRateMultiplier: 2.0,
                    heatwave: true
                },
                quests: [
                    { id: 'summer_1', name: 'Rei do Sol', reward: 'sun_crown' },
                    { id: 'summer_2', name: 'Mestre das Ondas', reward: 'surf_trident' },
                    { id: 'summer_3', name: 'Senhor do Vulcão', reward: 'magma_armor' }
                ]
            },
            
            anniversary: {
                id: 'anniversary',
                name: 'Aniversário do Legacy',
                icon: '🎂',
                description: 'Celebração do aniversário do jogo com recompensas especiais',
                startMonth: 6,
                startDay: 15,
                endMonth: 6,
                endDay: 30,
                features: {
                    specialBosses: ['legacy_guardian', 'founder_spirit'],
                    exclusiveDrops: ['anniversary_cake', 'legacy_coin', 'founder_badge'],
                    xpMultiplier: 2.0,
                    goldMultiplier: 2.0,
                    spawnRateMultiplier: 3.0,
                    specialRewards: true
                },
                quests: [
                    { id: 'anni_1', name: 'Guardião do Legado', reward: 'legacy_sword' },
                    { id: 'anni_2', name: 'Celebração de Um Ano', reward: 'anniversary_mount' },
                    { id: 'anni_3', name: 'Veterano da Guilda', reward: 'veteran_title' }
                ]
            }
        };
        
        // Inicializa sistema
        this.init();
        
        console.log('🎉 SeasonalEvents initialized');
    }

    /**
     * Inicializa sistema de eventos
     */
    init() {
        // Verifica eventos ativos a cada hora
        setInterval(() => this.checkActiveEvents(), 60 * 60 * 1000);
        
        // Verifica eventos semanais a cada dia
        setInterval(() => this.checkWeeklyEvents(), 24 * 60 * 60 * 1000);
        
        // Verificação inicial
        this.checkActiveEvents();
        this.checkWeeklyEvents();
        
        console.log('🎉 Seasonal events system active');
    }

    /**
     * Verifica eventos sazonais ativos
     */
    checkActiveEvents() {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        
        for (const [key, event] of Object.entries(this.specialEvents)) {
            const isActive = this.isEventActive(event, currentMonth, currentDay);
            const wasActive = this.activeEvents.has(key);
            
            if (isActive && !wasActive) {
                // Evento começou
                this.startEvent(event);
            } else if (!isActive && wasActive) {
                // Evento terminou
                this.endEvent(key);
            }
        }
    }

    /**
     * Verifica se evento está ativo
     */
    isEventActive(event, currentMonth, currentDay) {
        // Evento que cruza anos (ex: inverno)
        if (event.startMonth > event.endMonth) {
            // Dezembro para Janeiro
            if (currentMonth === event.startMonth) {
                return currentDay >= event.startDay;
            } else if (currentMonth === event.endMonth) {
                return currentDay <= event.endDay;
            }
            return false;
        }
        
        // Evento no mesmo ano
        if (currentMonth < event.startMonth || currentMonth > event.endMonth) {
            return false;
        }
        
        if (currentMonth === event.startMonth && currentDay < event.startDay) {
            return false;
        }
        
        if (currentMonth === event.endMonth && currentDay > event.endDay) {
            return false;
        }
        
        return true;
    }

    /**
     * Inicia evento
     */
    async startEvent(event) {
        console.log(`🎉 Starting event: ${event.name}`);
        
        // Adiciona aos ativos
        this.activeEvents.set(event.id, {
            ...event,
            startedAt: Date.now()
        });
        
        // Aplica modificações
        await this.applyEventEffects(event);
        
        // Notifica todos os jogadores online
        this.notificationManager?.broadcast('event:start', {
            eventId: event.id,
            name: event.name,
            icon: event.icon,
            description: event.description,
            features: event.features,
            duration: this.calculateEventDuration(event)
        });
        
        // Log no banco
        await this.db.logEventStart(event.id, Date.now());
        
        console.log(`✅ Event ${event.name} started successfully`);
    }

    /**
     * Finaliza evento
     */
    async endEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        console.log(`🎉 Ending event: ${event.name}`);
        
        // Remove efeitos
        await this.removeEventEffects(event);
        
        // Remove dos ativos
        this.activeEvents.delete(eventId);
        
        // Notifica jogadores
        this.notificationManager?.broadcast('event:end', {
            eventId: eventId,
            name: event.name,
            message: `${event.name} has ended! See you next year!`
        });
        
        // Log no banco
        await this.db.logEventEnd(eventId, Date.now());
        
        console.log(`✅ Event ${event.name} ended`);
    }

    /**
     * Aplica efeitos do evento
     */
    async applyEventEffects(event) {
        // Spawn bosses especiais
        if (event.features.specialBosses) {
            for (const bossId of event.features.specialBosses) {
                await this.bossManager?.spawnEventBoss(bossId, event.id);
            }
        }
        
        // Modifica rates globais (aplicado via PlayerManager)
        // XP, Gold, Spawn rates são verificados em tempo real
    }

    /**
     * Remove efeitos do evento
     */
    async removeEventEffects(event) {
        // Remove bosses especiais
        if (event.features.specialBosses) {
            for (const bossId of event.features.specialBosses) {
                await this.bossManager?.despawnEventBoss(bossId);
            }
        }
    }

    /**
     * Verifica eventos semanais
     */
    checkWeeklyEvents() {
        const now = new Date();
        const dayName = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
        
        // Verifica eventos semanais
        for (const [name, event] of Object.entries(this.eventSchedule.weekly)) {
            if (event.day === dayName) {
                this.activateWeeklyEvent(name, event);
            }
        }
    }

    /**
     * Ativa evento semanal
     */
    activateWeeklyEvent(name, event) {
        console.log(`📅 Weekly event activated: ${name}`);
        
        this.notificationManager?.broadcast('event:weekly', {
            name: name,
            type: event.type,
            multiplier: event.multiplier,
            message: `It's ${name}! ${event.multiplier}x ${event.type} all day!`
        });
    }

    /**
     * Obtém multiplicadores ativos para jogador
     */
    getActiveMultipliers(playerId) {
        const multipliers = {
            xp: 1.0,
            gold: 1.0,
            dropRate: 1.0,
            spawnRate: 1.0
        };
        
        // Aplica multiplicadores de eventos ativos
        for (const event of this.activeEvents.values()) {
            if (event.features.xpMultiplier) {
                multipliers.xp = Math.max(multipliers.xp, event.features.xpMultiplier);
            }
            if (event.features.goldMultiplier) {
                multipliers.gold = Math.max(multipliers.gold, event.features.goldMultiplier);
            }
            if (event.features.spawnRateMultiplier) {
                multipliers.spawnRate = Math.max(multipliers.spawnRate, event.features.spawnRateMultiplier);
            }
        }
        
        return multipliers;
    }

    /**
     * Verifica se item é exclusivo de evento
     */
    isEventItem(itemId) {
        for (const event of Object.values(this.specialEvents)) {
            if (event.features.exclusiveDrops?.includes(itemId)) {
                return { isExclusive: true, event: event.id };
            }
        }
        return { isExclusive: false, event: null };
    }

    /**
     * Calcula duração do evento
     */
    calculateEventDuration(event) {
        const start = new Date();
        start.setMonth(event.startMonth - 1);
        start.setDate(event.startDay);
        
        const end = new Date();
        end.setMonth(event.endMonth - 1);
        end.setDate(event.endDay);
        
        if (end < start) {
            end.setFullYear(end.getFullYear() + 1);
        }
        
        return end - start;
    }

    /**
     * Obtém eventos ativos
     */
    getActiveEvents() {
        return Array.from(this.activeEvents.values()).map(event => ({
            id: event.id,
            name: event.name,
            icon: event.icon,
            description: event.description,
            features: event.features,
            startedAt: event.startedAt,
            timeRemaining: this.calculateTimeRemaining(event)
        }));
    }

    /**
     * Calcula tempo restante
     */
    calculateTimeRemaining(event) {
        const now = new Date();
        const end = new Date();
        end.setMonth(event.endMonth - 1);
        end.setDate(event.endDay);
        end.setHours(23, 59, 59);
        
        return Math.max(0, end - now);
    }

    /**
     * Obtém todos os eventos do ano
     */
    getYearlyCalendar() {
        return Object.values(this.specialEvents).map(event => ({
            id: event.id,
            name: event.name,
            icon: event.icon,
            startDate: `${event.startMonth}/${event.startDay}`,
            endDate: `${event.endMonth}/${event.endDay}`,
            description: event.description
        }));
    }

    /**
     * Completar quest de evento
     */
    async completeEventQuest(playerId, questId) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player) return { success: false, error: 'Player not found' };
        
        // Verifica se quest existe em evento ativo
        let eventQuest = null;
        let activeEvent = null;
        
        for (const event of this.activeEvents.values()) {
            const quest = event.quests?.find(q => q.id === questId);
            if (quest) {
                eventQuest = quest;
                activeEvent = event;
                break;
            }
        }
        
        if (!eventQuest) {
            return { success: false, error: 'Quest not available' };
        }
        
        // Verifica se já completou
        if (player.completedEventQuests?.includes(questId)) {
            return { success: false, error: 'Quest already completed' };
        }
        
        // Marca como completa
        if (!player.completedEventQuests) player.completedEventQuests = [];
        player.completedEventQuests.push(questId);
        
        // Recompensa
        const reward = eventQuest.reward;
        if (!player.inventory) player.inventory = [];
        player.inventory.push({
            id: reward,
            source: 'event_quest',
            eventId: activeEvent.id,
            obtainedAt: new Date().toISOString()
        });
        
        await this.playerManager.updatePlayer(player);
        
        // Notifica
        this.notificationManager?.notify(playerId, 'event:quest_complete', {
            questName: eventQuest.name,
            reward: reward,
            eventName: activeEvent.name
        });
        
        return {
            success: true,
            reward: reward,
            quest: eventQuest
        };
    }

    getStats() {
        return {
            activeEvents: this.activeEvents.size,
            scheduledEvents: Object.keys(this.specialEvents).length,
            weeklyEvents: Object.keys(this.eventSchedule.weekly).length,
            nextEvent: this.getNextEvent()
        };
    }

    getNextEvent() {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        
        let nextEvent = null;
        let minDays = Infinity;
        
        for (const event of Object.values(this.specialEvents)) {
            let daysUntil = this.calculateDaysUntil(event, currentMonth, currentDay);
            if (daysUntil < minDays && daysUntil > 0) {
                minDays = daysUntil;
                nextEvent = event;
            }
        }
        
        return nextEvent ? {
            name: nextEvent.name,
            icon: nextEvent.icon,
            daysUntil: minDays,
            startDate: `${nextEvent.startMonth}/${nextEvent.startDay}`
        } : null;
    }

    calculateDaysUntil(event, currentMonth, currentDay) {
        const currentYear = new Date().getFullYear();
        const eventDate = new Date(currentYear, event.startMonth - 1, event.startDay);
        const today = new Date(currentYear, currentMonth - 1, currentDay);
        
        if (eventDate < today) {
            eventDate.setFullYear(currentYear + 1);
        }
        
        return Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    }
}

// Exporta
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeasonalEvents;
} else {
    window.SeasonalEvents = SeasonalEvents;
}
