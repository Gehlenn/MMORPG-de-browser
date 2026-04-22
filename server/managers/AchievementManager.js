/**
 * AchievementManager - Manages player achievements and rewards
 * Tracks progress, unlocks achievements, and handles rewards
 */

class AchievementManager {
    constructor(db, characterPersistence) {
        this.db = db;
        this.characterPersistence = characterPersistence;
        this.definitions = this.loadAchievementDefinitions();
        this.categories = ['combat', 'exploration', 'social', 'progression', 'collection', 'special'];
    }

    /**
     * Initialize achievement system
     */
    async initialize() {
        await this.createTables();
        console.log('[AchievementManager] Initialized');
    }

    /**
     * Create achievement tables
     */
    async createTables() {
        return new Promise((resolve, reject) => {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS achievements (
                    id TEXT PRIMARY KEY,
                    character_id TEXT NOT NULL,
                    definition_id TEXT NOT NULL,
                    unlocked_at DATETIME,
                    progress INTEGER DEFAULT 0,
                    max_progress INTEGER NOT NULL,
                    is_unlocked BOOLEAN DEFAULT 0,
                    notified BOOLEAN DEFAULT 0,
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS achievement_rewards_claimed (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    character_id TEXT NOT NULL,
                    achievement_id TEXT NOT NULL,
                    reward_type TEXT NOT NULL,
                    reward_value INTEGER NOT NULL,
                    claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS achievement_stats (
                    character_id TEXT PRIMARY KEY,
                    total_unlocked INTEGER DEFAULT 0,
                    total_points INTEGER DEFAULT 0,
                    rare_achievements INTEGER DEFAULT 0,
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_achievements_character ON achievements(character_id);
                CREATE INDEX IF NOT EXISTS idx_achievements_unlocked ON achievements(is_unlocked);
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Load achievement definitions
     */
    loadAchievementDefinitions() {
        return {
            // === COMBAT ACHIEVEMENTS ===
            'first_blood': {
                name: 'Primeiro Sangue',
                description: 'Derrote seu primeiro inimigo',
                category: 'combat',
                icon: '⚔️',
                maxProgress: 1,
                points: 10,
                rewards: { gold: 50, exp: 100 }
            },
            'monster_hunter': {
                name: 'Caçador de Monstros',
                description: 'Derrote 100 monstros',
                category: 'combat',
                icon: '🐉',
                maxProgress: 100,
                points: 50,
                rewards: { gold: 500, exp: 1000, item: 'monster_hunter_badge' }
            },
            'elite_slayer': {
                name: 'Exterminador de Elite',
                description: 'Derrote 10 monstros elite',
                category: 'combat',
                icon: '👑',
                maxProgress: 10,
                points: 100,
                rewards: { gold: 1000, exp: 2000, title: 'Elite Slayer' }
            },
            'boss_bane': {
                name: 'Flagelo dos Bosses',
                description: 'Derrote 5 bosses',
                category: 'combat',
                icon: '💀',
                maxProgress: 5,
                points: 200,
                rewards: { gold: 5000, exp: 5000, item: 'boss_slayer_ring' }
            },
            'pvp_champion': {
                name: 'Campeão PvP',
                description: 'Vença 50 duelos PvP',
                category: 'combat',
                icon: '🏆',
                maxProgress: 50,
                points: 150,
                rewards: { gold: 2000, exp: 3000, title: 'PvP Champion' }
            },
            'untouchable': {
                name: 'Intocável',
                description: 'Vença um duelo sem perder HP',
                category: 'combat',
                icon: '🛡️',
                maxProgress: 1,
                points: 75,
                rewards: { gold: 1000, exp: 1500 }
            },

            // === EXPLORATION ACHIEVEMENTS ===
            'world_traveler': {
                name: 'Viajante do Mundo',
                description: 'Visite todas as zonas do jogo',
                category: 'exploration',
                icon: '🗺️',
                maxProgress: 6,
                points: 100,
                rewards: { gold: 1000, exp: 2000, item: 'explorers_compass' }
            },
            'zone_discoverer': {
                name: 'Descobridor',
                description: 'Descubra 3 zonas secretas',
                category: 'exploration',
                icon: '🔍',
                maxProgress: 3,
                points: 75,
                rewards: { gold: 500, exp: 1000 }
            },
            'step_by_step': {
                name: 'Passo a Passo',
                description: 'Ande 10.000 passos',
                category: 'exploration',
                icon: '👣',
                maxProgress: 10000,
                points: 25,
                rewards: { gold: 100, exp: 200 }
            },
            'marathon_runner': {
                name: 'Maratonista',
                description: 'Ande 100.000 passos',
                category: 'exploration',
                icon: '🏃',
                maxProgress: 100000,
                points: 50,
                rewards: { gold: 500, exp: 1000 }
            },

            // === SOCIAL ACHIEVEMENTS ===
            'friendly_adventurer': {
                name: 'Aventureiro Amigável',
                description: 'Faça 10 amigos',
                category: 'social',
                icon: '🤝',
                maxProgress: 10,
                points: 50,
                rewards: { gold: 300, exp: 500 }
            },
            'guild_founder': {
                name: 'Fundador de Guilda',
                description: 'Crie ou junte-se a uma guilda',
                category: 'social',
                icon: '🏰',
                maxProgress: 1,
                points: 50,
                rewards: { gold: 500, exp: 1000 }
            },
            'party_leader': {
                name: 'Líder de Grupo',
                description: 'Lidere um grupo de 4+ membros',
                category: 'social',
                icon: '👥',
                maxProgress: 1,
                points: 75,
                rewards: { gold: 400, exp: 800 }
            },
            'mentor': {
                name: 'Mentor',
                description: 'Ajudar 5 jogadores novatos',
                category: 'social',
                icon: '🎓',
                maxProgress: 5,
                points: 100,
                rewards: { gold: 1000, exp: 1500, title: 'Mentor' }
            },

            // === PROGRESSION ACHIEVEMENTS ===
            'level_10': {
                name: 'Iniciante Experiente',
                description: 'Alcance o nível 10',
                category: 'progression',
                icon: '⭐',
                maxProgress: 10,
                points: 25,
                rewards: { gold: 200, exp: 500 }
            },
            'level_25': {
                name: 'Aventureiro Veterano',
                description: 'Alcance o nível 25',
                category: 'progression',
                icon: '⭐⭐',
                maxProgress: 25,
                points: 50,
                rewards: { gold: 500, exp: 1000 }
            },
            'level_50': {
                name: 'Campeão',
                description: 'Alcance o nível 50',
                category: 'progression',
                icon: '⭐⭐⭐',
                maxProgress: 50,
                points: 100,
                rewards: { gold: 2000, exp: 3000 }
            },
            'level_100': {
                name: 'Lenda Viva',
                description: 'Alcance o nível máximo (100)',
                category: 'progression',
                icon: '🌟',
                maxProgress: 100,
                points: 500,
                rewards: { gold: 10000, exp: 10000, title: 'Legend', item: 'legendary_cape' }
            },
            'first_class_change': {
                name: 'Evolução',
                description: 'Faça sua primeira mudança de classe',
                category: 'progression',
                icon: '🔮',
                maxProgress: 1,
                points: 100,
                rewards: { gold: 1000, exp: 2000 }
            },

            // === COLLECTION ACHIEVEMENTS ===
            'treasure_hunter': {
                name: 'Caçador de Tesouros',
                description: 'Colete 50 itens raros',
                category: 'collection',
                icon: '💎',
                maxProgress: 50,
                points: 75,
                rewards: { gold: 800, exp: 1200 }
            },
            'equipment_collector': {
                name: 'Colecionador de Equipamentos',
                description: 'Equipe-se com itens raros em todos os slots',
                category: 'collection',
                icon: '🎒',
                maxProgress: 1,
                points: 100,
                rewards: { gold: 1000, exp: 1500 }
            },
            'gold_hoarder': {
                name: 'Acumulador de Ouro',
                description: 'Acumule 10.000 gold',
                category: 'collection',
                icon: '💰',
                maxProgress: 10000,
                points: 50,
                rewards: { exp: 1000 }
            },
            'wealthy_merchant': {
                name: 'Comerciante Abastado',
                description: 'Acumule 100.000 gold',
                category: 'collection',
                icon: '💵',
                maxProgress: 100000,
                points: 100,
                rewards: { exp: 3000, title: 'Wealthy' }
            },

            // === SPECIAL ACHIEVEMENTS ===
            'first_login': {
                name: 'Bem-vindo a Aethelgard',
                description: 'Entre no mundo pela primeira vez',
                category: 'special',
                icon: '🎉',
                maxProgress: 1,
                points: 10,
                rewards: { gold: 100, exp: 50, item: 'starter_pack' }
            },
            'early_bird': {
                name: 'Madrugador',
                description: 'Jogue às 6 da manhã',
                category: 'special',
                icon: '🐦',
                maxProgress: 1,
                points: 25,
                rewards: { gold: 200, exp: 300 }
            },
            'night_owl': {
                name: 'Coruja da Noite',
                description: 'Jogue à meia-noite',
                category: 'special',
                icon: '🦉',
                maxProgress: 1,
                points: 25,
                rewards: { gold: 200, exp: 300 }
            },
            'dedicated_player': {
                name: 'Jogador Dedicado',
                description: 'Jogue por 7 dias consecutivos',
                category: 'special',
                icon: '📅',
                maxProgress: 7,
                points: 100,
                rewards: { gold: 1000, exp: 2000 }
            },
            'veteran': {
                name: 'Veterano',
                description: 'Jogue por 30 dias consecutivos',
                category: 'special',
                icon: '🎖️',
                maxProgress: 30,
                points: 300,
                rewards: { gold: 5000, exp: 5000, title: 'Veteran' }
            },
            'completionist': {
                name: 'Completista',
                description: 'Desbloqueie todas as conquistas',
                category: 'special',
                icon: '🏆',
                maxProgress: 30, // Total count
                points: 1000,
                rewards: { gold: 50000, exp: 50000, title: 'Completionist', item: 'completionist_trophy' }
            }
        };
    }

    /**
     * Initialize achievements for a new character
     */
    async initializeCharacterAchievements(characterId) {
        try {
            // Check if already initialized
            const existing = await this.getCharacterAchievementCount(characterId);
            if (existing > 0) return;

            // Create all achievements for character
            const promises = Object.entries(this.definitions).map(([defId, def]) => {
                return new Promise((resolve, reject) => {
                    this.db.run(
                        `INSERT INTO achievements (id, character_id, definition_id, max_progress)
                         VALUES (?, ?, ?, ?)`,
                        [`ach_${characterId}_${defId}`, characterId, defId, def.maxProgress],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            });

            await Promise.all(promises);

            // Initialize stats
            await this.initializeStats(characterId);

            // Trigger first login achievement
            await this.updateProgress(characterId, 'first_login', 1);

            console.log(`[AchievementManager] Initialized achievements for character ${characterId}`);
        } catch (error) {
            console.error('[AchievementManager] Init error:', error);
        }
    }

    /**
     * Initialize achievement stats
     */
    async initializeStats(characterId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR IGNORE INTO achievement_stats (character_id) VALUES (?)`,
                [characterId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Update achievement progress
     */
    async updateProgress(characterId, achievementId, amount = 1) {
        try {
            const achievement = await this.getAchievement(characterId, achievementId);
            if (!achievement || achievement.is_unlocked) return null;

            const definition = this.definitions[achievementId];
            const newProgress = Math.min(achievement.progress + amount, definition.maxProgress);

            // Update progress
            await this.setProgress(characterId, achievementId, newProgress);

            // Check for unlock
            if (newProgress >= definition.maxProgress) {
                await this.unlockAchievement(characterId, achievementId);
                return { unlocked: true, achievement: definition };
            }

            return { unlocked: false, progress: newProgress, max: definition.maxProgress };
        } catch (error) {
            console.error('[AchievementManager] Progress error:', error);
            return null;
        }
    }

    /**
     * Set absolute progress
     */
    async setProgress(characterId, achievementId, progress) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE achievements SET progress = ?
                 WHERE character_id = ? AND definition_id = ?`,
                [progress, characterId, achievementId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Unlock an achievement
     */
    async unlockAchievement(characterId, achievementId) {
        try {
            const definition = this.definitions[achievementId];

            // Mark as unlocked
            await new Promise((resolve, reject) => {
                this.db.run(
                    `UPDATE achievements 
                     SET is_unlocked = 1, unlocked_at = CURRENT_TIMESTAMP, progress = ?
                     WHERE character_id = ? AND definition_id = ?`,
                    [definition.maxProgress, characterId, achievementId],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Update stats
            await this.updateStatsOnUnlock(characterId, definition.points);

            // Give rewards
            await this.giveRewards(characterId, achievementId, definition.rewards);

            // Notify player
            this.notifyUnlock(characterId, achievementId, definition);

            console.log(`[AchievementManager] ${achievementId} unlocked for ${characterId}`);
        } catch (error) {
            console.error('[AchievementManager] Unlock error:', error);
        }
    }

    /**
     * Update stats when achievement unlocked
     */
    async updateStatsOnUnlock(characterId, points) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE achievement_stats
                 SET total_unlocked = total_unlocked + 1,
                     total_points = total_points + ?,
                     last_updated = CURRENT_TIMESTAMP
                 WHERE character_id = ?`,
                [points, characterId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Give achievement rewards
     */
    async giveRewards(characterId, achievementId, rewards) {
        const activeChar = this.characterPersistence?.getActiveCharacter(characterId);
        if (!activeChar) return;

        const { gold = 0, exp = 0, item, title } = rewards;

        // Add gold
        if (gold > 0) {
            this.characterPersistence.addGold(characterId, gold);
        }

        // Add EXP
        if (exp > 0) {
            this.characterPersistence.addExperience(characterId, exp);
        }

        // Log reward
        const rewardTypes = [];
        if (gold > 0) rewardTypes.push({ type: 'gold', value: gold });
        if (exp > 0) rewardTypes.push({ type: 'exp', value: exp });
        if (item) rewardTypes.push({ type: 'item', value: item });
        if (title) rewardTypes.push({ type: 'title', value: title });

        // Save to database
        for (const reward of rewardTypes) {
            await new Promise((resolve, reject) => {
                this.db.run(
                    `INSERT INTO achievement_rewards_claimed 
                     (character_id, achievement_id, reward_type, reward_value)
                     VALUES (?, ?, ?, ?)`,
                    [characterId, achievementId, reward.type, reward.value],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
    }

    /**
     * Notify player of achievement unlock
     */
    notifyUnlock(characterId, achievementId, definition) {
        const activeChar = this.characterPersistence?.getActiveCharacter(characterId);
        if (!activeChar || !activeChar.socket) return;

        activeChar.socket.emit('achievement:unlocked', {
            id: achievementId,
            name: definition.name,
            description: definition.description,
            icon: definition.icon,
            category: definition.category,
            points: definition.points,
            rewards: definition.rewards
        });
    }

    /**
     * Get achievement data
     */
    async getAchievement(characterId, achievementId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM achievements
                 WHERE character_id = ? AND definition_id = ?`,
                [characterId, achievementId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    /**
     * Get all achievements for character
     */
    async getCharacterAchievements(characterId, category = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT a.*, d.name, d.description, d.icon, d.category, d.points
                FROM achievements a
                JOIN (
                    SELECT definition_id, name, description, icon, category, points
                    FROM (VALUES 
            `;

            // Build values from definitions
            const values = Object.entries(this.definitions).map(([id, def]) => {
                return `('${id}', '${def.name}', '${def.description}', '${def.icon}', '${def.category}', ${def.points})`;
            }).join(',');

            query += values + `) AS t(definition_id, name, description, icon, category, points)) d
                ON a.definition_id = d.definition_id
                WHERE a.character_id = ?
            `;

            if (category) {
                query += ` AND d.category = ?`;
            }

            query += ` ORDER BY a.is_unlocked DESC, a.unlocked_at DESC`;

            const params = category ? [characterId, category] : [characterId];

            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve((rows || []).map(row => ({
                    id: row.definition_id,
                    name: row.name,
                    description: row.description,
                    icon: row.icon,
                    category: row.category,
                    points: row.points,
                    progress: row.progress,
                    maxProgress: row.max_progress,
                    isUnlocked: row.is_unlocked === 1,
                    unlockedAt: row.unlocked_at,
                    completion: Math.floor((row.progress / row.max_progress) * 100)
                })));
            });
        });
    }

    /**
     * Get achievement stats
     */
    async getAchievementStats(characterId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM achievement_stats WHERE character_id = ?`,
                [characterId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve({
                            totalUnlocked: 0,
                            totalPoints: 0,
                            rareAchievements: 0,
                            completion: 0
                        });
                        return;
                    }

                    const totalAchievements = Object.keys(this.definitions).length;

                    resolve({
                        totalUnlocked: row.total_unlocked,
                        totalPoints: row.total_points,
                        rareAchievements: row.rare_achievements,
                        completion: Math.floor((row.total_unlocked / totalAchievements) * 100)
                    });
                }
            );
        });
    }

    /**
     * Get achievements by category
     */
    getAchievementsByCategory() {
        const byCategory = {};

        for (const category of this.categories) {
            byCategory[category] = [];
        }

        for (const [id, def] of Object.entries(this.definitions)) {
            if (byCategory[def.category]) {
                byCategory[def.category].push({ id, ...def });
            }
        }

        return byCategory;
    }

    /**
     * Get total achievement count
     */
    getTotalAchievementCount() {
        return Object.keys(this.definitions).length;
    }

    /**
     * Get character achievement count
     */
    async getCharacterAchievementCount(characterId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT COUNT(*) as count FROM achievements WHERE character_id = ?`,
                [characterId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.count || 0);
                }
            );
        });
    }

    // === EVENT HANDLERS ===

    /**
     * Handle monster kill
     */
    async onMonsterKill(characterId, monsterData) {
        await this.updateProgress(characterId, 'first_blood', 1);
        await this.updateProgress(characterId, 'monster_hunter', 1);

        if (monsterData.isElite) {
            await this.updateProgress(characterId, 'elite_slayer', 1);
        }

        if (monsterData.isBoss) {
            await this.updateProgress(characterId, 'boss_bane', 1);
        }
    }

    /**
     * Handle PvP win
     */
    async onPvPWin(characterId, damageDealt, damageTaken) {
        await this.updateProgress(characterId, 'pvp_champion', 1);

        if (damageTaken === 0) {
            await this.updateProgress(characterId, 'untouchable', 1);
        }
    }

    /**
     * Handle level up
     */
    async onLevelUp(characterId, newLevel) {
        if (newLevel >= 10) await this.updateProgress(characterId, 'level_10', newLevel);
        if (newLevel >= 25) await this.updateProgress(characterId, 'level_25', newLevel);
        if (newLevel >= 50) await this.updateProgress(characterId, 'level_50', newLevel);
        if (newLevel >= 100) await this.updateProgress(characterId, 'level_100', newLevel);
    }

    /**
     * Handle zone discovery
     */
    async onZoneDiscovered(characterId, zoneId, isSecret = false) {
        // Get all discovered zones
        const zones = await this.getDiscoveredZones(characterId);
        await this.updateProgress(characterId, 'world_traveler', zones.length);

        if (isSecret) {
            await this.updateProgress(characterId, 'zone_discoverer', 1);
        }
    }

    /**
     * Handle steps (movement)
     */
    async onSteps(characterId, stepCount) {
        await this.updateProgress(characterId, 'step_by_step', stepCount);
        await this.updateProgress(characterId, 'marathon_runner', stepCount);
    }

    /**
     * Handle friend added
     */
    async onFriendAdded(characterId) {
        await this.updateProgress(characterId, 'friendly_adventurer', 1);
    }

    /**
     * Handle guild join
     */
    async onGuildJoin(characterId) {
        await this.updateProgress(characterId, 'guild_founder', 1);
    }

    /**
     * Handle party formed
     */
    async onPartyFormed(characterId, partySize) {
        if (partySize >= 4) {
            await this.updateProgress(characterId, 'party_leader', 1);
        }
    }

    /**
     * Handle item collected
     */
    async onItemCollected(characterId, itemData) {
        if (itemData.rarity === 'rare' || itemData.rarity === 'epic' || itemData.rarity === 'legendary') {
            await this.updateProgress(characterId, 'treasure_hunter', 1);
        }
    }

    /**
     * Handle gold earned
     */
    async onGoldEarned(characterId, totalGold) {
        await this.updateProgress(characterId, 'gold_hoarder', totalGold);
        await this.updateProgress(characterId, 'wealthy_merchant', totalGold);
    }

    /**
     * Handle play time
     */
    async onPlayTime(characterId, consecutiveDays) {
        await this.updateProgress(characterId, 'dedicated_player', consecutiveDays);
        await this.updateProgress(characterId, 'veteran', consecutiveDays);
    }

    /**
     * Check time-based achievements
     */
    async checkTimeAchievements(characterId) {
        const hour = new Date().getHours();

        if (hour === 6) {
            await this.updateProgress(characterId, 'early_bird', 1);
        }

        if (hour === 0) {
            await this.updateProgress(characterId, 'night_owl', 1);
        }
    }

    /**
     * Check completionist achievement
     */
    async checkCompletionist(characterId) {
        const stats = await this.getAchievementStats(characterId);
        const total = this.getTotalAchievementCount();

        await this.updateProgress(characterId, 'completionist', stats.totalUnlocked);
    }

    /**
     * Get discovered zones (placeholder - would query from character data)
     */
    async getDiscoveredZones(characterId) {
        // This would normally query from a zones_discovered table
        // For now return empty array
        return [];
    }
}

module.exports = AchievementManager;
