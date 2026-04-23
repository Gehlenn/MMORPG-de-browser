/**
 * QuestManager - Sistema de Quests Completo
 * 
 * Tipos de Quests:
 * - HUNT: Caçar monstros específicos
 * - STORY: Quests de história linear
 * - DAILY: Quests diárias renováveis
 * - EVENT: Eventos aleatórios que aparecem no mundo
 * - DELIVERY: Entregar itens entre NPCs
 * - ESCORT: Proteger NPCs
 * - GATHER: Coletar recursos
 */

class QuestManager {
    constructor(db, characterPersistence, mobManager, zoneManager) {
        this.db = db;
        this.characterPersistence = characterPersistence;
        this.mobManager = mobManager;
        this.zoneManager = zoneManager;
        
        this.activeQuests = new Map(); // characterId -> Map(questId -> questData)
        this.dailyQuests = new Map(); // characterId -> { date, completed: Set }
        this.eventQuests = new Map(); // eventId -> eventData
        
        this.DAILY_RESET_HOUR = 4; // 4 AM reset
        this.MAX_ACTIVE_QUESTS = 20;
        this.MAX_DAILY_QUESTS = 10;
    }

    async initialize() {
        await this.createTables();
        this.startDailyResetTimer();
        this.startEventSpawner();
        console.log('[QuestManager] Sistema de quests inicializado');
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS quests (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    type TEXT NOT NULL, -- HUNT, STORY, DAILY, EVENT, DELIVERY, ESCORT, GATHER
                    level_required INTEGER DEFAULT 1,
                    class_required TEXT,
                    zone_id TEXT,
                    npc_giver TEXT,
                    npc_receiver TEXT,
                    time_limit INTEGER, -- em minutos, NULL = sem limite
                    expires_at DATETIME, -- para eventos
                    rewards JSON,
                    objectives JSON NOT NULL,
                    prerequisites JSON, -- quests necessárias
                    chain_quest_id TEXT, -- próxima quest na cadeia
                    is_repeatable BOOLEAN DEFAULT 0,
                    is_daily BOOLEAN DEFAULT 0,
                    is_event BOOLEAN DEFAULT 0,
                    event_duration INTEGER, -- minutos que o evento fica ativo
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS character_quests (
                    character_id TEXT NOT NULL,
                    quest_id TEXT NOT NULL,
                    status TEXT DEFAULT 'active', -- active, completed, failed, turned_in
                    progress JSON, -- progresso atual
                    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    completed_at DATETIME,
                    expires_at DATETIME,
                    PRIMARY KEY (character_id, quest_id),
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
                    FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS daily_quest_progress (
                    character_id TEXT NOT NULL,
                    date TEXT NOT NULL,
                    quests_completed INTEGER DEFAULT 0,
                    quests_data JSON,
                    rewards_claimed BOOLEAN DEFAULT 0,
                    PRIMARY KEY (character_id, date)
                );

                CREATE TABLE IF NOT EXISTS quest_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    character_id TEXT NOT NULL,
                    quest_id TEXT NOT NULL,
                    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    completion_time INTEGER, -- tempo em segundos
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(type);
                CREATE INDEX IF NOT EXISTS idx_quests_level ON quests(level_required);
                CREATE INDEX IF NOT EXISTS idx_character_quests ON character_quests(character_id, status);
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // ============ QUEST CREATION ============

    async createQuest(questData) {
        const id = `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO quests (id, title, description, type, level_required, 
                 class_required, zone_id, npc_giver, npc_receiver, time_limit, expires_at,
                 rewards, objectives, prerequisites, chain_quest_id, is_repeatable, 
                 is_daily, is_event, event_duration)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    questData.title,
                    questData.description,
                    questData.type,
                    questData.levelRequired || 1,
                    questData.classRequired || null,
                    questData.zoneId || null,
                    questData.npcGiver || null,
                    questData.npcReceiver || null,
                    questData.timeLimit || null,
                    questData.expiresAt || null,
                    JSON.stringify(questData.rewards || {}),
                    JSON.stringify(questData.objectives),
                    JSON.stringify(questData.prerequisites || []),
                    questData.chainQuestId || null,
                    questData.isRepeatable || false,
                    questData.isDaily || false,
                    questData.isEvent || false,
                    questData.eventDuration || null
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve({ id, ...questData });
                }
            );
        });
    }

    // ============ QUEST ACCEPTANCE ============

    async acceptQuest(characterId, questId) {
        const quest = await this.getQuest(questId);
        if (!quest) return { success: false, error: 'Quest não encontrada' };

        // Verificar se já está ativa
        const activeQuests = await this.getActiveQuests(characterId);
        if (activeQuests.some(q => q.quest_id === questId)) {
            return { success: false, error: 'Quest já está ativa' };
        }

        // Verificar limite de quests
        if (activeQuests.length >= this.MAX_ACTIVE_QUESTS) {
            return { success: false, error: 'Limite de quests ativas atingido' };
        }

        // Verificar requisitos
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (quest.level_required > (char?.data?.level || 1)) {
            return { success: false, error: `Nível ${quest.level_required} necessário` };
        }

        // Verificar prerequisitos
        if (quest.prerequisites?.length > 0) {
            const completedQuests = await this.getCompletedQuests(characterId);
            const missing = quest.prerequisites.filter(p => !completedQuests.includes(p));
            if (missing.length > 0) {
                return { success: false, error: 'Prerequisitos não atendidos' };
            }
        }

        // Inicializar progresso
        const progress = this.initializeProgress(quest);

        // Calcular expiração
        let expiresAt = null;
        if (quest.time_limit) {
            expiresAt = new Date(Date.now() + quest.time_limit * 60000);
        } else if (quest.expires_at) {
            expiresAt = new Date(quest.expires_at);
        }

        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO character_quests (character_id, quest_id, status, progress, expires_at)
                 VALUES (?, ?, 'active', ?, ?)`,
                [characterId, questId, JSON.stringify(progress), expiresAt],
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Notificar jogador
                    this.notifyQuestAccepted(characterId, quest);
                    
                    resolve({ 
                        success: true, 
                        quest: { ...quest, progress, expiresAt }
                    });
                }
            );
        });
    }

    initializeProgress(quest) {
        const progress = {};
        
        for (const [key, objective] of Object.entries(quest.objectives)) {
            switch (objective.type) {
                case 'kill':
                    progress[key] = { current: 0, target: objective.count, mobs: objective.mobIds };
                    break;
                case 'gather':
                    progress[key] = { current: 0, target: objective.count, items: objective.itemIds };
                    break;
                case 'deliver':
                    progress[key] = { delivered: false, itemId: objective.itemId, npcId: objective.npcId };
                    break;
                case 'escort':
                    progress[key] = { npcId: objective.npcId, destination: objective.destination, completed: false };
                    break;
                case 'explore':
                    progress[key] = { zones: objective.zones, visited: [] };
                    break;
                case 'talk':
                    progress[key] = { npcId: objective.npcId, talked: false };
                    break;
            }
        }
        
        return progress;
    }

    // ============ QUEST PROGRESS UPDATES ============

    async updateKillProgress(characterId, mobId, mobType) {
        const activeQuests = await this.getActiveQuests(characterId);
        
        for (const quest of activeQuests) {
            const questData = await this.getQuest(quest.quest_id);
            if (!questData || questData.type !== 'HUNT') continue;

            let updated = false;
            const progress = { ...quest.progress };

            for (const [key, obj] of Object.entries(progress)) {
                if (obj.mobs && obj.mobs.includes(mobId) && obj.current < obj.target) {
                    obj.current++;
                    updated = true;
                    
                    // Notificar progresso
                    this.notifyQuestProgress(characterId, questData, key, obj.current, obj.target);
                }
            }

            if (updated) {
                await this.saveQuestProgress(characterId, quest.quest_id, progress);
                
                // Verificar se completou
                if (this.isQuestComplete(progress)) {
                    await this.completeQuest(characterId, quest.quest_id);
                }
            }
        }
    }

    async updateGatherProgress(characterId, itemId, amount = 1) {
        const activeQuests = await this.getActiveQuests(characterId);
        
        for (const quest of activeQuests) {
            const questData = await this.getQuest(quest.quest_id);
            if (!questData) continue;

            let updated = false;
            const progress = { ...quest.progress };

            for (const [key, obj] of Object.entries(progress)) {
                if (obj.items && obj.items.includes(itemId) && obj.current < obj.target) {
                    obj.current = Math.min(obj.current + amount, obj.target);
                    updated = true;
                    
                    this.notifyQuestProgress(characterId, questData, key, obj.current, obj.target);
                }
            }

            if (updated) {
                await this.saveQuestProgress(characterId, quest.quest_id, progress);
                
                if (this.isQuestComplete(progress)) {
                    await this.completeQuest(characterId, quest.quest_id);
                }
            }
        }
    }

    async updateDeliveryProgress(characterId, npcId, itemId) {
        const activeQuests = await this.getActiveQuests(characterId);
        
        for (const quest of activeQuests) {
            const questData = await this.getQuest(quest.quest_id);
            if (!questData || questData.type !== 'DELIVERY') continue;

            const progress = { ...quest.progress };
            let updated = false;

            for (const [key, obj] of Object.entries(progress)) {
                if (obj.npcId === npcId && obj.itemId === itemId && !obj.delivered) {
                    obj.delivered = true;
                    updated = true;
                }
            }

            if (updated) {
                await this.saveQuestProgress(characterId, quest.quest_id, progress);
                
                if (this.isQuestComplete(progress)) {
                    await this.completeQuest(characterId, quest.quest_id);
                }
            }
        }
    }

    async updateExploreProgress(characterId, zoneId) {
        const activeQuests = await this.getActiveQuests(characterId);
        
        for (const quest of activeQuests) {
            const questData = await this.getQuest(quest.quest_id);
            if (!questData) continue;

            const progress = { ...quest.progress };
            let updated = false;

            for (const [key, obj] of Object.entries(progress)) {
                if (obj.zones && obj.zones.includes(zoneId) && !obj.visited.includes(zoneId)) {
                    obj.visited.push(zoneId);
                    updated = true;
                    
                    this.notifyQuestProgress(
                        characterId, 
                        questData, 
                        key, 
                        obj.visited.length, 
                        obj.zones.length
                    );
                }
            }

            if (updated) {
                await this.saveQuestProgress(characterId, quest.quest_id, progress);
                
                if (this.isQuestComplete(progress)) {
                    await this.completeQuest(characterId, quest.quest_id);
                }
            }
        }
    }

    async updateTalkProgress(characterId, npcId) {
        const activeQuests = await this.getActiveQuests(characterId);
        
        for (const quest of activeQuests) {
            const questData = await this.getQuest(quest.quest_id);
            if (!questData) continue;

            const progress = { ...quest.progress };
            let updated = false;

            for (const [key, obj] of Object.entries(progress)) {
                if (obj.npcId === npcId && !obj.talked) {
                    obj.talked = true;
                    updated = true;
                }
            }

            if (updated) {
                await this.saveQuestProgress(characterId, quest.quest_id, progress);
                
                if (this.isQuestComplete(progress)) {
                    await this.completeQuest(characterId, quest.quest_id);
                }
            }
        }
    }

    isQuestComplete(progress) {
        for (const obj of Object.values(progress)) {
            if (obj.target !== undefined && obj.current < obj.target) return false;
            if (obj.delivered !== undefined && !obj.delivered) return false;
            if (obj.talked !== undefined && !obj.talked) return false;
            if (obj.completed !== undefined && !obj.completed) return false;
            if (obj.zones !== undefined && obj.visited.length < obj.zones.length) return false;
        }
        return true;
    }

    async saveQuestProgress(characterId, questId, progress) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE character_quests SET progress = ? WHERE character_id = ? AND quest_id = ?`,
                [JSON.stringify(progress), characterId, questId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    // ============ QUEST COMPLETION ============

    async completeQuest(characterId, questId) {
        const quest = await this.getQuest(questId);
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE character_quests 
                 SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                 WHERE character_id = ? AND quest_id = ?`,
                [characterId, questId],
                async (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Registrar no histórico
                    await this.addToHistory(characterId, questId);

                    // Notificar jogador
                    this.notifyQuestCompleted(characterId, quest);

                    // Verificar se tem quest em cadeia
                    if (quest.chain_quest_id) {
                        this.notifyChainQuestAvailable(characterId, quest.chain_quest_id);
                    }

                    resolve({ success: true, quest });
                }
            );
        });
    }

    async turnInQuest(characterId, questId, npcId) {
        const quest = await this.getQuest(questId);
        if (!quest) return { success: false, error: 'Quest não encontrada' };

        // Verificar se está completa
        const charQuest = await this.getCharacterQuest(characterId, questId);
        if (charQuest.status !== 'completed') {
            return { success: false, error: 'Quest não está completa' };
        }

        // Verificar NPC
        if (quest.npc_receiver && quest.npc_receiver !== npcId) {
            return { success: false, error: 'NPC errado para entregar quest' };
        }

        // Dar recompensas
        const rewards = await this.giveRewards(characterId, quest.rewards);

        // Marcar como entregue
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE character_quests SET status = 'turned_in' 
                 WHERE character_id = ? AND quest_id = ?`,
                [characterId, questId],
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    this.notifyQuestTurnedIn(characterId, quest, rewards);

                    // Se for daily, registrar
                    if (quest.is_daily) {
                        this.recordDailyQuestCompletion(characterId, questId);
                    }

                    resolve({ success: true, rewards });
                }
            );
        });
    }

    async giveRewards(characterId, rewards) {
        const given = { exp: 0, gold: 0, items: [], skills: [] };
        const char = this.characterPersistence?.getActiveCharacter(characterId);

        if (rewards.exp) {
            given.exp = rewards.exp;
            // Adicionar EXP via characterPersistence
            if (char?.addExperience) {
                char.addExperience(rewards.exp);
            }
        }

        if (rewards.gold) {
            given.gold = rewards.gold;
            if (char?.addGold) {
                char.addGold(rewards.gold);
            }
        }

        if (rewards.items) {
            for (const item of rewards.items) {
                given.items.push(item);
                if (char?.addItem) {
                    char.addItem(item.id, item.amount || 1);
                }
            }
        }

        if (rewards.skills) {
            for (const skillId of rewards.skills) {
                given.skills.push(skillId);
                // Aprender skill via AdvanceClassSystem
            }
        }

        return given;
    }

    // ============ DAILY QUESTS ============

    startDailyResetTimer() {
        const checkReset = () => {
            const now = new Date();
            if (now.getHours() === this.DAILY_RESET_HOUR) {
                this.resetDailyQuests();
            }
        };

        setInterval(checkReset, 60000); // Checar a cada minuto
    }

    async resetDailyQuests() {
        console.log('[QuestManager] Resetando quests diárias');
        this.dailyQuests.clear();
        
        // Gerar novas daily quests para todos online
        const onlineChars = this.characterPersistence?.getAllOnlineCharacters() || [];
        for (const char of onlineChars) {
            await this.generateDailyQuests(char.id);
        }
    }

    async generateDailyQuests(characterId) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        const level = char?.data?.level || 1;

        // Buscar quests diárias apropriadas para o nível
        const dailyQuests = await this.getAvailableDailyQuests(level);
        
        // Selecionar até MAX_DAILY_QUESTS aleatoriamente
        const selected = dailyQuests
            .sort(() => 0.5 - Math.random())
            .slice(0, this.MAX_DAILY_QUESTS);

        this.dailyQuests.set(characterId, {
            date: new Date().toISOString().split('T')[0],
            available: selected.map(q => q.id),
            completed: new Set()
        });

        return selected;
    }

    async getAvailableDailyQuests(level) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM quests 
                 WHERE is_daily = 1 
                 AND level_required <= ?
                 ORDER BY RANDOM()`,
                [level + 10], // Quests até 10 níveis abaixo
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    async recordDailyQuestCompletion(characterId, questId) {
        const daily = this.dailyQuests.get(characterId);
        if (daily) {
            daily.completed.add(questId);
        }

        const today = new Date().toISOString().split('T')[0];
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO daily_quest_progress (character_id, date, quests_completed)
                 VALUES (?, ?, 1)
                 ON CONFLICT(character_id, date) DO UPDATE SET
                 quests_completed = quests_completed + 1`,
                [characterId, today],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    // ============ EVENT QUESTS ============

    startEventSpawner() {
        // Spawnar eventos aleatórios a cada 30-60 minutos
        const scheduleNextEvent = () => {
            const delay = 30 + Math.random() * 30; // 30-60 minutos
            setTimeout(() => {
                this.spawnRandomEvent();
                scheduleNextEvent();
            }, delay * 60000);
        };

        scheduleNextEvent();
    }

    async spawnRandomEvent() {
        const events = [
            { type: 'invasion', title: 'Invasão de Goblins!', description: 'Goblins estão invadindo a cidade!' },
            { type: 'boss', title: 'Boss Apareceu!', description: 'Um boss poderoso foi avistado nas redondezas!' },
            { type: 'gather', title: 'Recursos em Abundância', description: 'Recursos raros apareceram no mapa!' },
            { type: 'escort', title: 'Caravana Precisa de Ajuda', description: 'Uma caravana mercante precisa de escolta!' }
        ];

        const eventTemplate = events[Math.floor(Math.random() * events.length)];
        const eventId = `event_${Date.now()}`;
        
        const eventQuest = await this.createQuest({
            title: eventTemplate.title,
            description: eventTemplate.description,
            type: 'EVENT',
            levelRequired: 1,
            isEvent: true,
            eventDuration: 30, // 30 minutos
            objectives: this.generateEventObjectives(eventTemplate.type),
            rewards: this.generateEventRewards()
        });

        this.eventQuests.set(eventId, {
            ...eventQuest,
            spawnedAt: Date.now(),
            expiresAt: Date.now() + 30 * 60000
        });

        // Notificar todos os jogadores online
        this.broadcastEvent(eventQuest);

        // Auto-expirar após duração
        setTimeout(() => {
            this.eventQuests.delete(eventId);
            this.endEvent(eventId);
        }, 30 * 60000);
    }

    generateEventObjectives(type) {
        switch (type) {
            case 'invasion':
                return {
                    kill_goblins: { type: 'kill', count: 20, mobIds: ['goblin', 'goblin_archer'] }
                };
            case 'boss':
                return {
                    defeat_boss: { type: 'kill', count: 1, mobIds: ['event_boss'] }
                };
            case 'gather':
                return {
                    collect_resources: { type: 'gather', count: 10, itemIds: ['rare_herb', 'rare_ore'] }
                };
            case 'escort':
                return {
                    escort_caravan: { type: 'escort', npcId: 'caravan_master', destination: 'safe_zone' }
                };
            default:
                return {};
        }
    }

    generateEventRewards() {
        return {
            exp: 1000 + Math.floor(Math.random() * 2000),
            gold: 500 + Math.floor(Math.random() * 1000),
            items: [
                { id: 'event_box', amount: 1 }
            ]
        };
    }

    broadcastEvent(eventQuest) {
        // Emitir para todos os sockets
        const io = global.io;
        if (io) {
            io.emit('quest:event_spawned', {
                id: eventQuest.id,
                title: eventQuest.title,
                description: eventQuest.description,
                expiresIn: 30 * 60000,
                rewards: eventQuest.rewards
            });
        }
    }

    endEvent(eventId) {
        const io = global.io;
        if (io) {
            io.emit('quest:event_ended', { eventId });
        }
    }

    // ============ UTILITY METHODS ============

    async getQuest(questId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM quests WHERE id = ?`,
                [questId],
                (err, row) => {
                    if (err) reject(err);
                    else {
                        if (row) {
                            row.rewards = JSON.parse(row.rewards || '{}');
                            row.objectives = JSON.parse(row.objectives || '{}');
                            row.prerequisites = JSON.parse(row.prerequisites || '[]');
                        }
                        resolve(row);
                    }
                }
            );
        });
    }

    async getActiveQuests(characterId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT cq.*, q.* FROM character_quests cq
                 JOIN quests q ON cq.quest_id = q.id
                 WHERE cq.character_id = ? AND cq.status = 'active'`,
                [characterId],
                (err, rows) => {
                    if (err) reject(err);
                    else {
                        resolve(rows.map(row => ({
                            ...row,
                            progress: JSON.parse(row.progress || '{}'),
                            rewards: JSON.parse(row.rewards || '{}'),
                            objectives: JSON.parse(row.objectives || '{}')
                        })));
                    }
                }
            );
        });
    }

    async getCharacterQuest(characterId, questId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM character_quests WHERE character_id = ? AND quest_id = ?`,
                [characterId, questId],
                (err, row) => {
                    if (err) reject(err);
                    else {
                        if (row) {
                            row.progress = JSON.parse(row.progress || '{}');
                        }
                        resolve(row);
                    }
                }
            );
        });
    }

    async getCompletedQuests(characterId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT quest_id FROM character_quests 
                 WHERE character_id = ? AND status IN ('completed', 'turned_in')`,
                [characterId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => r.quest_id));
                }
            );
        });
    }

    async addToHistory(characterId, questId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO quest_history (character_id, quest_id) VALUES (?, ?)`,
                [characterId, questId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async getAvailableQuests(characterId, level, zoneId = null) {
        const completedQuests = await this.getCompletedQuests(characterId);
        
        return new Promise((resolve, reject) => {
            let query = `
                SELECT * FROM quests 
                WHERE level_required <= ?
                AND id NOT IN (
                    SELECT quest_id FROM character_quests 
                    WHERE character_id = ? AND status IN ('active', 'completed', 'turned_in')
                )
            `;
            const params = [level + 5, characterId]; // Quests até 5 níveis acima

            if (zoneId) {
                query += ` AND (zone_id = ? OR zone_id IS NULL)`;
                params.push(zoneId);
            }

            query += ` AND (is_daily = 0 OR is_daily IS NULL)`;
            query += ` AND (is_event = 0 OR is_event IS NULL)`;
            query += ` ORDER BY level_required ASC`;

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else {
                    // Filtrar por prerequisitos
                    const available = rows.filter(row => {
                        const prereqs = JSON.parse(row.prerequisites || '[]');
                        return prereqs.every(p => completedQuests.includes(p));
                    });
                    resolve(available);
                }
            });
        });
    }

    // ============ NOTIFICATIONS ============

    notifyQuestAccepted(characterId, quest) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (char?.socket) {
            char.socket.emit('quest:accepted', {
                id: quest.id,
                title: quest.title,
                description: quest.description,
                type: quest.type,
                objectives: quest.objectives,
                rewards: quest.rewards,
                timeLimit: quest.time_limit
            });
        }
    }

    notifyQuestProgress(characterId, quest, objectiveKey, current, target) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (char?.socket) {
            char.socket.emit('quest:progress', {
                questId: quest.id,
                objective: objectiveKey,
                current,
                target,
                percentage: Math.floor((current / target) * 100)
            });
        }
    }

    notifyQuestCompleted(characterId, quest) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (char?.socket) {
            char.socket.emit('quest:completed', {
                id: quest.id,
                title: quest.title,
                message: `Quest "${quest.title}" completada! Entregue para receber recompensas.`
            });
        }
    }

    notifyQuestTurnedIn(characterId, quest, rewards) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (char?.socket) {
            char.socket.emit('quest:turned_in', {
                id: quest.id,
                title: quest.title,
                rewards,
                message: `Recompensas recebidas! +${rewards.exp} EXP, +${rewards.gold} Ouro`
            });
        }
    }

    notifyChainQuestAvailable(characterId, nextQuestId) {
        const char = this.characterPersistence?.getActiveCharacter(characterId);
        if (char?.socket) {
            char.socket.emit('quest:chain_available', {
                questId: nextQuestId,
                message: 'Nova quest na história disponível!'
            });
        }
    }

    // ============ DEFAULT QUESTS ============

    async createDefaultQuests() {
        const defaultQuests = [
            // HUNT QUESTS
            {
                title: 'Caça aos Slimes',
                description: 'Elimine 10 Slimes que estão infestando a floresta.',
                type: 'HUNT',
                levelRequired: 1,
                zoneId: 'floresta_inicial',
                npcGiver: 'guarda_chefe',
                npcReceiver: 'guarda_chefe',
                objectives: {
                    kill_slimes: { type: 'kill', count: 10, mobIds: ['slime'] }
                },
                rewards: { exp: 100, gold: 50, items: [{ id: 'potion_hp', amount: 3 }] }
            },
            {
                title: 'Ameaça dos Goblins',
                description: 'Os Goblins estão atacando viajantes. Elimine 15 deles.',
                type: 'HUNT',
                levelRequired: 10,
                zoneId: 'planicies',
                npcGiver: 'capitao_guarda',
                objectives: {
                    kill_goblins: { type: 'kill', count: 15, mobIds: ['goblin', 'goblin_warrior'] }
                },
                rewards: { exp: 300, gold: 150, items: [{ id: 'sword_iron', amount: 1 }] }
            },
            
            // STORY QUESTS
            {
                title: 'O Início da Jornada',
                description: 'Fale com o Elder da vila para começar sua aventura.',
                type: 'STORY',
                levelRequired: 1,
                npcGiver: 'instructor',
                npcReceiver: 'elder',
                objectives: {
                    talk_elder: { type: 'talk', npcId: 'elder' }
                },
                rewards: { exp: 50, gold: 25 },
                chainQuestId: 'quest_primeira_batalha'
            },
            {
                id: 'quest_primeira_batalha',
                title: 'Primeira Batalha',
                description: 'Derrote seu primeiro monstro para provar sua coragem.',
                type: 'STORY',
                levelRequired: 1,
                prerequisites: ['quest_inicio_jornada'],
                npcGiver: 'elder',
                objectives: {
                    first_kill: { type: 'kill', count: 1, mobIds: ['slime', 'poring'] }
                },
                rewards: { exp: 100, gold: 50, items: [{ id: 'beginner_box', amount: 1 }] }
            },

            // DAILY QUESTS
            {
                title: 'Limpeza Diária',
                description: 'Elimine 20 monstros quaisquer para ajudar a manter a segurança.',
                type: 'HUNT',
                levelRequired: 10,
                isDaily: true,
                objectives: {
                    daily_kills: { type: 'kill', count: 20, mobIds: ['*'] }
                },
                rewards: { exp: 200, gold: 100 }
            },
            {
                title: 'Coleta de Recursos',
                description: 'Colete ervas medicinais para o alquimista.',
                type: 'GATHER',
                levelRequired: 5,
                isDaily: true,
                objectives: {
                    gather_herbs: { type: 'gather', count: 10, itemIds: ['herb_red', 'herb_green'] }
                },
                rewards: { exp: 150, gold: 80, items: [{ id: 'potion_hp', amount: 5 }] }
            },

            // DELIVERY QUESTS
            {
                title: 'Entrega Urgente',
                description: 'Entregue esta carta ao ferreiro na próxima cidade.',
                type: 'DELIVERY',
                levelRequired: 5,
                npcGiver: 'mercador',
                npcReceiver: 'ferreiro',
                objectives: {
                    deliver_letter: { type: 'deliver', itemId: 'urgent_letter', npcId: 'ferreiro' }
                },
                rewards: { exp: 80, gold: 40 }
            },

            // EXPLORE QUESTS
            {
                title: 'Explorador Iniciante',
                description: 'Visite todas as zonas da floresta inicial.',
                type: 'EXPLORE',
                levelRequired: 5,
                objectives: {
                    explore_zones: { type: 'explore', zones: ['floresta_norte', 'floresta_sul', 'lago_central'] }
                },
                rewards: { exp: 120, gold: 60 }
            }
        ];

        for (const quest of defaultQuests) {
            await this.createQuest(quest);
        }

        console.log(`[QuestManager] ${defaultQuests.length} quests padrão criadas`);
    }
}

module.exports = QuestManager;
