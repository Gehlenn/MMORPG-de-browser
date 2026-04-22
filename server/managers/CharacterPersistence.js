/**
 * CharacterPersistence - Handles character save/load operations
 * Coordinates between game state and database
 */

class CharacterPersistence {
    constructor(characterDb, accountDb) {
        this.characterDb = characterDb;
        this.accountDb = accountDb;
        this.activeCharacters = new Map(); // characterId -> { playerId, socket, lastSave }
        this.autoSaveInterval = null;
        this.AUTO_SAVE_MS = 60000; // 1 minute
        this.DIRTY_CHECK_MS = 30000; // Check for dirty data every 30s
    }

    /**
     * Initialize persistence manager
     */
    async initialize() {
        await this.characterDb.initialize();
        this.startAutoSave();
        console.log('[CharacterPersistence] Initialized');
    }

    /**
     * Start auto-save interval
     */
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveAllCharacters();
        }, this.AUTO_SAVE_MS);
    }

    /**
     * Stop auto-save
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Load character when player logs in
     */
    async loadCharacter(characterId, playerId, socket) {
        try {
            // Get character data
            const character = await this.characterDb.getCharacter(characterId);
            if (!character) {
                throw new Error('Character not found');
            }

            // Get inventory
            const inventory = await this.characterDb.getInventory(characterId);

            // Get skills
            const skills = await this.getCharacterSkills(characterId);

            // Get active quests
            const quests = await this.getCharacterQuests(characterId);

            // Update last login
            await this.characterDb.updateLastLogin(characterId);

            // Register as active
            this.activeCharacters.set(characterId, {
                playerId,
                socket,
                data: character,
                inventory,
                skills,
                quests,
                dirty: false,
                lastSave: Date.now()
            });

            console.log(`[CharacterPersistence] Loaded character ${character.name} (${characterId})`);

            return {
                success: true,
                character: this.formatCharacterData(character, inventory, skills, quests)
            };
        } catch (error) {
            console.error('[CharacterPersistence] Load error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save character data
     */
    async saveCharacter(characterId, immediate = false) {
        const activeChar = this.activeCharacters.get(characterId);
        if (!activeChar) {
            console.warn(`[CharacterPersistence] Cannot save inactive character ${characterId}`);
            return { success: false, error: 'Character not active' };
        }

        try {
            // Update character stats
            await this.characterDb.updateCharacter(characterId, {
                x: activeChar.data.x,
                y: activeChar.data.y,
                zone: activeChar.data.zone,
                hp: activeChar.data.hp,
                mp: activeChar.data.mp,
                level: activeChar.data.level,
                experience: activeChar.data.experience,
                gold: activeChar.data.gold,
                play_time: (activeChar.data.play_time || 0) + 1
            });

            activeChar.lastSave = Date.now();
            activeChar.dirty = false;

            if (immediate) {
                console.log(`[CharacterPersistence] Saved character ${characterId}`);
            }

            return { success: true };
        } catch (error) {
            console.error('[CharacterPersistence] Save error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save all active characters
     */
    async saveAllCharacters() {
        const promises = [];
        for (const [characterId, charData] of this.activeCharacters) {
            if (charData.dirty || Date.now() - charData.lastSave > this.AUTO_SAVE_MS) {
                promises.push(this.saveCharacter(characterId));
            }
        }

        if (promises.length > 0) {
            const results = await Promise.allSettled(promises);
            const saved = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            console.log(`[CharacterPersistence] Auto-saved ${saved}/${promises.length} characters`);
        }
    }

    /**
     * Unload character when player disconnects
     */
    async unloadCharacter(characterId) {
        const activeChar = this.activeCharacters.get(characterId);
        if (!activeChar) return;

        // Final save
        await this.saveCharacter(characterId, true);

        // Remove from active
        this.activeCharacters.delete(characterId);

        console.log(`[CharacterPersistence] Unloaded character ${characterId}`);
    }

    /**
     * Update character position
     */
    updatePosition(characterId, x, y, zone) {
        const activeChar = this.activeCharacters.get(characterId);
        if (activeChar) {
            activeChar.data.x = x;
            activeChar.data.y = y;
            if (zone) activeChar.data.zone = zone;
            activeChar.dirty = true;
        }
    }

    /**
     * Update character stats
     */
    updateStats(characterId, stats) {
        const activeChar = this.activeCharacters.get(characterId);
        if (activeChar) {
            Object.assign(activeChar.data, stats);
            activeChar.dirty = true;
        }
    }

    /**
     * Add experience
     */
    addExperience(characterId, amount) {
        const activeChar = this.activeCharacters.get(characterId);
        if (activeChar) {
            activeChar.data.experience = (activeChar.data.experience || 0) + amount;
            activeChar.dirty = true;

            // Check level up
            this.checkLevelUp(characterId);
        }
    }

    /**
     * Check and handle level up
     */
    checkLevelUp(characterId) {
        const activeChar = this.activeCharacters.get(characterId);
        if (!activeChar) return;

        const { level, experience } = activeChar.data;
        const expNeeded = this.getExpForLevel(level + 1);

        if (experience >= expNeeded) {
            activeChar.data.level = level + 1;
            activeChar.data.experience = experience - expNeeded;
            activeChar.data.stat_points = (activeChar.data.stat_points || 0) + 3;
            activeChar.data.skill_points = (activeChar.data.skill_points || 0) + 1;
            activeChar.dirty = true;

            // Notify player
            if (activeChar.socket) {
                activeChar.socket.emit('character:levelup', {
                    newLevel: activeChar.data.level,
                    statPoints: activeChar.data.stat_points,
                    skillPoints: activeChar.data.skill_points
                });
            }

            console.log(`[CharacterPersistence] ${activeChar.data.name} leveled up to ${activeChar.data.level}`);
        }
    }

    /**
     * Get EXP needed for level
     */
    getExpForLevel(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    /**
     * Spend stat point
     */
    async spendStatPoint(characterId, stat) {
        const activeChar = this.activeCharacters.get(characterId);
        if (!activeChar) return { success: false, error: 'Character not active' };

        if (activeChar.data.stat_points <= 0) {
            return { success: false, error: 'No stat points available' };
        }

        const validStats = ['strength', 'agility', 'intelligence', 'vitality'];
        if (!validStats.includes(stat)) {
            return { success: false, error: 'Invalid stat' };
        }

        activeChar.data[stat]++;
        activeChar.data.stat_points--;
        activeChar.dirty = true;

        // Recalculate derived stats
        if (stat === 'vitality') {
            activeChar.data.max_hp += 10;
            activeChar.data.hp += 10;
        }

        await this.saveCharacter(characterId, true);

        return { success: true, stats: activeChar.data };
    }

    /**
     * Add gold
     */
    addGold(characterId, amount) {
        const activeChar = this.activeCharacters.get(characterId);
        if (activeChar) {
            activeChar.data.gold = (activeChar.data.gold || 0) + amount;
            activeChar.dirty = true;
        }
    }

    /**
     * Get character skills
     */
    async getCharacterSkills(characterId) {
        return new Promise((resolve, reject) => {
            // This would query from character_skills table
            // For now return empty array
            resolve([]);
        });
    }

    /**
     * Get character quests
     */
    async getCharacterQuests(characterId) {
        return new Promise((resolve, reject) => {
            // This would query from character_quests table
            // For now return empty array
            resolve([]);
        });
    }

    /**
     * Format character data for client
     */
    formatCharacterData(character, inventory, skills, quests) {
        return {
            id: character.id,
            name: character.name,
            class: character.class,
            level: character.level,
            experience: character.experience,
            position: { x: character.x, y: character.y, zone: character.zone },
            stats: {
                hp: character.hp,
                maxHp: character.max_hp,
                mp: character.mp,
                maxMp: character.max_mp,
                strength: character.strength,
                agility: character.agility,
                intelligence: character.intelligence,
                vitality: character.vitality
            },
            resources: {
                statPoints: character.stat_points,
                skillPoints: character.skill_points,
                gold: character.gold
            },
            inventory: inventory || [],
            skills: skills || [],
            quests: quests || [],
            createdAt: character.created_at,
            playTime: character.play_time
        };
    }

    /**
     * Get active character data
     */
    getActiveCharacter(characterId) {
        return this.activeCharacters.get(characterId);
    }

    /**
     * Get all active characters
     */
    getAllActiveCharacters() {
        return Array.from(this.activeCharacters.entries()).map(([id, data]) => ({
            id,
            playerId: data.playerId,
            name: data.data.name,
            level: data.data.level,
            zone: data.data.zone
        }));
    }

    /**
     * Cleanup on shutdown
     */
    async cleanup() {
        console.log('[CharacterPersistence] Saving all characters before shutdown...');
        await this.saveAllCharacters();
        this.stopAutoSave();
        this.activeCharacters.clear();
    }
}

module.exports = CharacterPersistence;
