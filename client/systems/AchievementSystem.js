/**
 * AchievementSystem.js
 * Sistema de Conquistas e Títulos
 * Legacy of Komodo MMORPG v0.5.0 - Nível 9
 */

class AchievementSystem {
    constructor(database, playerManager, notificationManager) {
        this.db = database;
        this.playerManager = playerManager;
        this.notificationManager = notificationManager;
        
        // Definições de conquistas
        this.achievements = {
            // Combate
            first_blood: {
                id: 'first_blood',
                name: 'Primeiro Sangue',
                description: 'Derrote seu primeiro inimigo',
                icon: '🩸',
                category: 'combat',
                points: 10,
                reward: { title: 'Guerreiro Novato' }
            },
            killer_100: {
                id: 'killer_100',
                name: 'Caçador de Mobs',
                description: 'Derrote 100 inimigos',
                icon: '⚔️',
                category: 'combat',
                points: 25,
                requirement: { type: 'kills', count: 100 },
                reward: { title: 'Caçador', item: 'hunter_badge' }
            },
            killer_1000: {
                id: 'killer_1000',
                name: 'Exterminador',
                description: 'Derrote 1.000 inimigos',
                icon: '💀',
                category: 'combat',
                points: 100,
                requirement: { type: 'kills', count: 1000 },
                reward: { title: 'Exterminador', item: 'exterminator_cape' }
            },
            boss_slayer: {
                id: 'boss_slayer',
                name: 'Matador de Bosses',
                description: 'Derrote 10 bosses',
                icon: '👑',
                category: 'combat',
                points: 50,
                requirement: { type: 'boss_kills', count: 10 },
                reward: { title: 'Boss Slayer', item: 'boss_trophy' }
            },
            critical_master: {
                id: 'critical_master',
                name: 'Mestre dos Críticos',
                description: 'Acerte 100 golpes críticos',
                icon: '💥',
                category: 'combat',
                points: 30,
                requirement: { type: 'critical_hits', count: 100 },
                reward: { title: 'Preciso' }
            },
            
            // Progressão
            level_10: {
                id: 'level_10',
                name: 'Aprendiz',
                description: 'Alcance o nível 10',
                icon: '📈',
                category: 'progression',
                points: 10,
                requirement: { type: 'level', count: 10 },
                reward: { title: 'Aprendiz' }
            },
            level_50: {
                id: 'level_50',
                name: 'Veterano',
                description: 'Alcance o nível 50',
                icon: '⭐',
                category: 'progression',
                points: 50,
                requirement: { type: 'level', count: 50 },
                reward: { title: 'Veterano', item: 'veteran_ring' }
            },
            level_100: {
                id: 'level_100',
                name: 'Lenda Viva',
                description: 'Alcance o nível 100',
                icon: '🌟',
                category: 'progression',
                points: 200,
                requirement: { type: 'level', count: 100 },
                reward: { title: 'Lenda', item: 'legendary_aura' }
            },
            
            // Exploração
            explorer_novice: {
                id: 'explorer_novice',
                name: 'Explorador',
                description: 'Visite todas as zonas de Eldoria',
                icon: '🗺️',
                category: 'exploration',
                points: 20,
                requirement: { type: 'zones_visited', zones: ['eldoria_forest', 'eldoria_city', 'eldoria_caves'] },
                reward: { title: 'Explorador' }
            },
            world_traveler: {
                id: 'world_traveler',
                name: 'Viajante do Mundo',
                description: 'Visite todas as zonas do jogo',
                icon: '🌍',
                category: 'exploration',
                points: 100,
                requirement: { type: 'all_zones', count: 6 },
                reward: { title: 'Viajante', item: 'world_walker_boots' }
            },
            secret_finder: {
                id: 'secret_finder',
                name: 'Caçador de Segredos',
                description: 'Descubra 10 segredos escondidos',
                icon: '🔍',
                category: 'exploration',
                points: 40,
                requirement: { type: 'secrets_found', count: 10 },
                reward: { title: 'Detetive' }
            },
            
            // Quests
            quest_completed_10: {
                id: 'quest_completed_10',
                name: 'Ajudante',
                description: 'Complete 10 quests',
                icon: '📜',
                category: 'quests',
                points: 15,
                requirement: { type: 'quests_completed', count: 10 },
                reward: { title: 'Ajudante' }
            },
            quest_completed_100: {
                id: 'quest_completed_100',
                name: 'Herói das Quests',
                description: 'Complete 100 quests',
                icon: '📚',
                category: 'quests',
                points: 75,
                requirement: { type: 'quests_completed', count: 100 },
                reward: { title: 'Herói Local', item: 'quest_master_badge' }
            },
            quest_master: {
                id: 'quest_master',
                name: 'Mestre de Quests',
                description: 'Complete todas as quests do jogo',
                icon: '🏆',
                category: 'quests',
                points: 150,
                requirement: { type: 'all_quests' },
                reward: { title: 'Mestre de Quests', item: 'master_scroll' }
            },
            
            // Profissões
            profession_novice: {
                id: 'profession_novice',
                name: 'Artesão',
                description: 'Alcance nível 25 em uma profissão',
                icon: '⚒️',
                category: 'professions',
                points: 25,
                requirement: { type: 'profession_level', level: 25 },
                reward: { title: 'Artesão' }
            },
            profession_master: {
                id: 'profession_master',
                name: 'Mestre Artesão',
                description: 'Alcance nível 100 em uma profissão',
                icon: '🏅',
                category: 'professions',
                points: 100,
                requirement: { type: 'profession_level', level: 100 },
                reward: { title: 'Grão-Mestre', item: 'master_craftsman_hammer' }
            },
            
            // PvP
            pvp_first_win: {
                id: 'pvp_first_win',
                name: 'Primeira Vitória',
                description: 'Vença sua primeira partida PvP',
                icon: '🥇',
                category: 'pvp',
                points: 15,
                requirement: { type: 'pvp_wins', count: 1 },
                reward: { title: 'Combatente' }
            },
            pvp_wins_10: {
                id: 'pvp_wins_10',
                name: 'Vencedor',
                description: 'Vença 10 partidas PvP',
                icon: '🏅',
                category: 'pvp',
                points: 30,
                requirement: { type: 'pvp_wins', count: 10 },
                reward: { title: 'Vencedor' }
            },
            pvp_wins_100: {
                id: 'pvp_wins_100',
                name: 'Campeão da Arena',
                description: 'Vença 100 partidas PvP',
                icon: '👑',
                category: 'pvp',
                points: 100,
                requirement: { type: 'pvp_wins', count: 100 },
                reward: { title: 'Campeão', item: 'champion_belt' }
            },
            pvp_streak_10: {
                id: 'pvp_streak_10',
                name: 'Imparável',
                description: 'Vença 10 partidas consecutivas',
                icon: '🔥',
                category: 'pvp',
                points: 75,
                requirement: { type: 'pvp_streak', count: 10 },
                reward: { title: 'Imparável', item: 'streak_flame' }
            },
            
            // Raids
            raid_first_clear: {
                id: 'raid_first_clear',
                name: 'Conquistador de Raids',
                description: 'Complete sua primeira raid',
                icon: '🏰',
                category: 'raids',
                points: 50,
                requirement: { type: 'raids_completed', count: 1 },
                reward: { title: 'Raider' }
            },
            raid_veteran: {
                id: 'raid_veteran',
                name: 'Veterano de Raids',
                description: 'Complete 10 raids',
                icon: '🛡️',
                category: 'raids',
                points: 100,
                requirement: { type: 'raids_completed', count: 10 },
                reward: { title: 'Veterano de Raids', item: 'raid_veteran_shield' }
            },
            raid_legend: {
                id: 'raid_legend',
                name: 'Lenda das Raids',
                description: 'Complete todas as raids em dificuldade máxima',
                icon: '⚡',
                category: 'raids',
                points: 250,
                requirement: { type: 'all_raids_max_difficulty' },
                reward: { title: 'Lenda das Raids', item: 'legendary_raid_armor' }
            },
            
            // Sociais
            guild_join: {
                id: 'guild_join',
                name: 'Membro da Guilda',
                description: 'Junte-se a uma guilda',
                icon: '🤝',
                category: 'social',
                points: 10,
                requirement: { type: 'guild_joined' },
                reward: { title: 'Guildie' }
            },
            friend_10: {
                id: 'friend_10',
                name: 'Popular',
                description: 'Faça 10 amigos',
                icon: '👥',
                category: 'social',
                points: 20,
                requirement: { type: 'friends', count: 10 },
                reward: { title: 'Popular' }
            },
            
            // Especiais
            speed_runner: {
                id: 'speed_runner',
                name: 'Speedrunner',
                description: 'Complete uma raid em menos de 30 minutos',
                icon: '⏱️',
                category: 'special',
                points: 100,
                requirement: { type: 'raid_time', seconds: 1800 },
                reward: { title: 'Speedrunner', item: 'speed_boots' }
            },
            no_damage: {
                id: 'no_damage',
                name: 'Perfeccionista',
                description: 'Complete uma raid sem morrer',
                icon: '✨',
                category: 'special',
                points: 150,
                requirement: { type: 'flawless_raid' },
                reward: { title: 'Perfeito', item: 'perfection_crystal' }
            },
            collector: {
                id: 'collector',
                name: 'Colecionador',
                description: 'Colete 100 itens únicos',
                icon: '🎒',
                category: 'special',
                points: 50,
                requirement: { type: 'unique_items', count: 100 },
                reward: { title: 'Colecionador' }
            }
        };
        
        // Categorias
        this.categories = {
            combat: { name: 'Combate', icon: '⚔️', color: '#ff4444' },
            progression: { name: 'Progressão', icon: '📈', color: '#44ff44' },
            exploration: { name: 'Exploração', icon: '🗺️', color: '#4444ff' },
            quests: { name: 'Missões', icon: '📜', color: '#ffaa00' },
            professions: { name: 'Profissões', icon: '⚒️', color: '#aa44aa' },
            pvp: { name: 'PvP', icon: '🏆', color: '#ff6600' },
            raids: { name: 'Raids', icon: '🏰', color: '#6600ff' },
            social: { name: 'Social', icon: '👥', color: '#00aaff' },
            special: { name: 'Especiais', icon: '⭐', color: '#ffd700' }
        };
        
        console.log('🏆 AchievementSystem initialized');
    }

    /**
     * Verifica e concede conquistas
     */
    async checkAchievements(playerId, trigger, data = {}) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player) return;
        
        const unlocked = player.achievements || [];
        const newAchievements = [];
        
        for (const [id, achievement] of Object.entries(this.achievements)) {
            // Pula se já desbloqueou
            if (unlocked.includes(id)) continue;
            
            // Verifica requisitos
            if (this.checkRequirements(achievement, trigger, data, player)) {
                // Conquista desbloqueada!
                await this.unlockAchievement(player, achievement);
                newAchievements.push(achievement);
            }
        }
        
        return newAchievements;
    }

    /**
     * Verifica requisitos
     */
    checkRequirements(achievement, trigger, data, player) {
        const req = achievement.requirement;
        if (!req) return false;
        
        switch (req.type) {
            case 'kills':
                return data.kills >= req.count;
            case 'boss_kills':
                return data.bossKills >= req.count;
            case 'critical_hits':
                return data.criticalHits >= req.count;
            case 'level':
                return player.level >= req.count;
            case 'quests_completed':
                return (player.completedQuests?.length || 0) >= req.count;
            case 'profession_level':
                return Object.values(player.professions || {}).some(p => p.level >= req.level);
            case 'pvp_wins':
                return data.pvpWins >= req.count;
            case 'pvp_streak':
                return data.pvpStreak >= req.count;
            case 'raids_completed':
                return data.raidsCompleted >= req.count;
            case 'zones_visited':
                return req.zones.every(z => player.visitedZones?.includes(z));
            case 'guild_joined':
                return !!player.guildId;
            case 'friends':
                return (player.friends?.length || 0) >= req.count;
            default:
                return false;
        }
    }

    /**
     * Desbloqueia conquista
     */
    async unlockAchievement(player, achievement) {
        // Adiciona à lista
        if (!player.achievements) player.achievements = [];
        player.achievements.push(achievement.id);
        
        // Atualiza pontos
        player.achievementPoints = (player.achievementPoints || 0) + achievement.points;
        
        // Salva
        await this.playerManager.updatePlayer(player);
        await this.db.saveAchievement(player.id, achievement.id);
        
        // Notifica
        this.notificationManager?.notify(player.id, 'achievement:unlock', {
            achievement: achievement,
            points: achievement.points,
            totalPoints: player.achievementPoints
        });
        
        // Concede recompensas
        if (achievement.reward) {
            await this.grantReward(player, achievement.reward);
        }
        
        console.log(`🏆 ${player.name} desbloqueou: ${achievement.name}`);
    }

    /**
     * Concede recompensa
     */
    async grantReward(player, reward) {
        if (reward.title) {
            if (!player.unlockedTitles) player.unlockedTitles = [];
            if (!player.unlockedTitles.includes(reward.title)) {
                player.unlockedTitles.push(reward.title);
            }
        }
        
        if (reward.item) {
            if (!player.inventory) player.inventory = [];
            player.inventory.push({
                id: reward.item,
                source: 'achievement',
                obtainedAt: new Date().toISOString()
            });
        }
        
        await this.playerManager.updatePlayer(player);
    }

    /**
     * Obtém progresso do jogador
     */
    async getPlayerProgress(playerId) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player) return null;
        
        const unlocked = player.achievements || [];
        const total = Object.keys(this.achievements).length;
        
        const byCategory = {};
        for (const [catId, cat] of Object.entries(this.categories)) {
            const catAchievements = Object.values(this.achievements)
                .filter(a => a.category === catId);
            const catUnlocked = catAchievements.filter(a => unlocked.includes(a.id));
            
            byCategory[catId] = {
                name: cat.name,
                icon: cat.icon,
                color: cat.color,
                total: catAchievements.length,
                unlocked: catUnlocked.length,
                percentage: Math.round((catUnlocked.length / catAchievements.length) * 100)
            };
        }
        
        return {
            totalAchievements: total,
            unlocked: unlocked.length,
            percentage: Math.round((unlocked.length / total) * 100),
            totalPoints: player.achievementPoints || 0,
            categories: byCategory,
            recentUnlocks: await this.getRecentUnlocks(playerId, 5)
        };
    }

    /**
     * Obtém conquistas recentes
     */
    async getRecentUnlocks(playerId, limit = 5) {
        return await this.db.getRecentAchievements(playerId, limit);
    }

    /**
     * Obtém todas as conquistas
     */
    getAllAchievements(category = null) {
        let achievements = Object.values(this.achievements);
        
        if (category) {
            achievements = achievements.filter(a => a.category === category);
        }
        
        return achievements.map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            icon: a.icon,
            category: a.category,
            points: a.points,
            reward: a.reward
        }));
    }

    /**
     * Define título ativo
     */
    async setActiveTitle(playerId, title) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player) return { success: false, error: 'Player not found' };
        
        if (!player.unlockedTitles?.includes(title)) {
            return { success: false, error: 'Title not unlocked' };
        }
        
        player.activeTitle = title;
        await this.playerManager.updatePlayer(player);
        
        return { success: true, title: title };
    }

    /**
     * Obtém leaderboard de conquistas
     */
    async getLeaderboard(limit = 100) {
        return await this.db.getAchievementLeaderboard(limit);
    }

    /**
     * Event handlers
     */
    async onKill(playerId, data) {
        await this.checkAchievements(playerId, 'kill', data);
    }

    async onLevelUp(playerId, newLevel) {
        await this.checkAchievements(playerId, 'level_up', { level: newLevel });
    }

    async onQuestComplete(playerId, questId) {
        const completed = await this.db.getCompletedQuestsCount(playerId);
        await this.checkAchievements(playerId, 'quest_complete', { completedQuests: completed });
    }

    async onPVPWin(playerId, streak) {
        const wins = await this.db.getPVPWins(playerId);
        await this.checkAchievements(playerId, 'pvp_win', { pvpWins: wins, pvpStreak: streak });
    }

    async onRaidComplete(playerId, raidData) {
        const completed = await this.db.getRaidsCompleted(playerId);
        await this.checkAchievements(playerId, 'raid_complete', { 
            raidsCompleted: completed,
            raidTime: raidData.duration,
            flawless: raidData.noDeaths
        });
    }

    getStats() {
        return {
            totalAchievements: Object.keys(this.achievements).length,
            categories: Object.keys(this.categories).length,
            totalPoints: Object.values(this.achievements).reduce((sum, a) => sum + a.points, 0)
        };
    }
}

// Exporta
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementSystem;
} else {
    window.AchievementSystem = AchievementSystem;
}
