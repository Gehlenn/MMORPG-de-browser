/**
 * PlayerDataManager.js
 * Sistema de persistência de dados de jogadores em JSON
 * Parte do MVP - Passo 3
 */

const fs = require('fs').promises;
const path = require('path');

class PlayerDataManager {
    constructor(dataDir = './data/players') {
        this.dataDir = dataDir;
        this.cache = new Map(); // Cache em memória
        this.cacheTTL = 300000; // 5 minutos
        this.ensureDirectory();
    }

    async ensureDirectory() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            console.log(`📁 PlayerDataManager: Diretório ${this.dataDir} pronto`);
        } catch (err) {
            console.error('❌ Erro ao criar diretório de dados:', err);
        }
    }

    getPlayerFilePath(playerId) {
        return path.join(this.dataDir, `player-${playerId}.json`);
    }

    // ========== SAVE ==========
    async savePlayer(playerId, playerData) {
        if (!playerId) {
            console.warn('PlayerDataManager: Tentativa de salvar sem ID');
            return false;
        }

        try {
            const data = {
                id: playerId,
                name: playerData.name || 'Unknown',
                class: playerData.class || 'warrior',
                level: playerData.level || 1,
                xp: playerData.xp || 0,
                totalXp: playerData.totalXp || 0,
                hp: playerData.hp || 100,
                maxHp: playerData.maxHp || 100,
                mana: playerData.mana || 50,
                maxMana: playerData.maxMana || 50,
                gold: playerData.gold || 0,
                stats: playerData.stats || {
                    strength: 10,
                    agility: 10,
                    intelligence: 10,
                    stamina: 10
                },
                equipment: playerData.equipment || {
                    weapon: null,
                    armor: null,
                    helmet: null,
                    shield: null,
                    accessory: null,
                    boots: null
                },
                inventory: playerData.inventory || [],
                position: playerData.position || { x: 400, y: 300 },
                zone: playerData.zone || 'korvien_village',
                lastLogin: new Date().toISOString(),
                createdAt: playerData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                talents: playerData.talents || [],
                quests: {
                    active: playerData.activeQuests || [],
                    completed: playerData.completedQuests || []
                },
                professions: playerData.professions || {
                    mining: { level: 1, xp: 0 }
                }
            };

            const filePath = this.getPlayerFilePath(playerId);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            
            // Atualizar cache
            this.cache.set(playerId, {
                data: data,
                timestamp: Date.now()
            });

            console.log(`💾 PlayerDataManager: ${data.name} (Lv.${data.level}) salvo`);
            return true;
        } catch (err) {
            console.error(`❌ Erro ao salvar jogador ${playerId}:`, err);
            return false;
        }
    }

    // ========== LOAD ==========
    async loadPlayer(playerId) {
        if (!playerId) {
            console.warn('PlayerDataManager: Tentativa de carregar sem ID');
            return null;
        }

        try {
            // Verificar cache primeiro
            const cached = this.cache.get(playerId);
            if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
                console.log(`💾 PlayerDataManager: ${playerId} carregado do cache`);
                return cached.data;
            }

            const filePath = this.getPlayerFilePath(playerId);
            
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const data = JSON.parse(content);
                
                // Atualizar cache
                this.cache.set(playerId, {
                    data: data,
                    timestamp: Date.now()
                });

                console.log(`💾 PlayerDataManager: ${data.name} (Lv.${data.level}) carregado`);
                return data;
            } catch (readErr) {
                if (readErr.code === 'ENOENT') {
                    // Arquivo não existe - jogador novo
                    console.log(`💾 PlayerDataManager: ${playerId} é novo jogador`);
                    return null;
                }
                throw readErr;
            }
        } catch (err) {
            console.error(`❌ Erro ao carregar jogador ${playerId}:`, err);
            return null;
        }
    }

    // ========== UPDATE ==========
    async updatePlayer(playerId, updates) {
        if (!playerId) return false;

        try {
            const existing = await this.loadPlayer(playerId);
            if (!existing) {
                console.warn(`PlayerDataManager: Jogador ${playerId} não encontrado para atualizar`);
                return false;
            }

            const updated = {
                ...existing,
                ...updates,
                updatedAt: new Date().toISOString()
            };

            return await this.savePlayer(playerId, updated);
        } catch (err) {
            console.error(`❌ Erro ao atualizar jogador ${playerId}:`, err);
            return false;
        }
    }

    // ========== DELETE ==========
    async deletePlayer(playerId) {
        if (!playerId) return false;

        try {
            const filePath = this.getPlayerFilePath(playerId);
            await fs.unlink(filePath);
            this.cache.delete(playerId);
            console.log(`🗑️ PlayerDataManager: ${playerId} deletado`);
            return true;
        } catch (err) {
            if (err.code === 'ENOENT') {
                return true; // Já não existe
            }
            console.error(`❌ Erro ao deletar jogador ${playerId}:`, err);
            return false;
        }
    }

    // ========== LIST ==========
    async listAllPlayers() {
        try {
            const files = await fs.readdir(this.dataDir);
            const players = [];

            for (const file of files) {
                if (file.startsWith('player-') && file.endsWith('.json')) {
                    const playerId = file.replace('player-', '').replace('.json', '');
                    const data = await this.loadPlayer(playerId);
                    if (data) {
                        players.push({
                            id: data.id,
                            name: data.name,
                            level: data.level,
                            class: data.class,
                            lastLogin: data.lastLogin
                        });
                    }
                }
            }

            return players;
        } catch (err) {
            console.error('❌ Erro ao listar jogadores:', err);
            return [];
        }
    }

    // ========== BACKUP ==========
    async backupPlayer(playerId, backupDir = './data/backups') {
        if (!playerId) return false;

        try {
            await fs.mkdir(backupDir, { recursive: true });
            
            const data = await this.loadPlayer(playerId);
            if (!data) return false;

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `player-${playerId}-${timestamp}.json`);
            
            await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
            console.log(`💾 PlayerDataManager: Backup de ${playerId} criado`);
            return true;
        } catch (err) {
            console.error(`❌ Erro ao criar backup de ${playerId}:`, err);
            return false;
        }
    }

    // ========== AUTO-SAVE ==========
    startAutoSave(playerId, playerDataProvider, intervalMs = 30000) {
        console.log(`💾 PlayerDataManager: Auto-save iniciado para ${playerId} (${intervalMs}ms)`);
        
        return setInterval(async () => {
            const data = playerDataProvider();
            if (data) {
                await this.savePlayer(playerId, data);
            }
        }, intervalMs);
    }

    stopAutoSave(intervalId) {
        if (intervalId) {
            clearInterval(intervalId);
            console.log('💾 PlayerDataManager: Auto-save parado');
        }
    }

    // ========== CACHE MANAGEMENT ==========
    clearCache(playerId = null) {
        if (playerId) {
            this.cache.delete(playerId);
        } else {
            this.cache.clear();
            console.log('💾 PlayerDataManager: Cache limpo');
        }
    }

    // ========== STATISTICS ==========
    async getStatistics() {
        try {
            const players = await this.listAllPlayers();
            const levels = players.map(p => p.level);
            
            return {
                totalPlayers: players.length,
                averageLevel: levels.length > 0 ? (levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(1) : 0,
                highestLevel: levels.length > 0 ? Math.max(...levels) : 0,
                cacheSize: this.cache.size
            };
        } catch (err) {
            console.error('❌ Erro ao calcular estatísticas:', err);
            return { totalPlayers: 0, averageLevel: 0, highestLevel: 0, cacheSize: 0 };
        }
    }
}

// Singleton para uso global
let instance = null;

module.exports = {
    PlayerDataManager,
    getInstance: (dataDir) => {
        if (!instance) {
            instance = new PlayerDataManager(dataDir);
        }
        return instance;
    },
    resetInstance: () => {
        instance = null;
    }
};
