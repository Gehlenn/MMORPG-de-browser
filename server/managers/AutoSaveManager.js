/**
 * AutoSaveManager - Manages automatic character saving
 * Triggers saves on important events and intervals
 */

class AutoSaveManager {
    constructor(characterPersistence) {
        this.persistence = characterPersistence;
        this.saveCallbacks = new Map();
        this.importantEvents = [
            'character:levelup',
            'inventory:item_added',
            'inventory:item_removed',
            'quest:completed',
            'player:zone_changed',
            'combat:boss_killed',
            'trade:completed'
        ];
    }

    /**
     * Initialize auto-save manager
     */
    initialize() {
        console.log('[AutoSaveManager] Initialized');
    }

    /**
     * Register a character for auto-save tracking
     */
    registerCharacter(characterId, socket) {
        // Set up event listeners for important events
        this.importantEvents.forEach(event => {
            const callback = (data) => this.handleImportantEvent(characterId, event, data);
            socket.on(event, callback);

            // Store callback for cleanup
            if (!this.saveCallbacks.has(characterId)) {
                this.saveCallbacks.set(characterId, new Map());
            }
            this.saveCallbacks.get(characterId).set(event, callback);
        });

        console.log(`[AutoSaveManager] Registered character ${characterId}`);
    }

    /**
     * Unregister a character
     */
    unregisterCharacter(characterId, socket) {
        const callbacks = this.saveCallbacks.get(characterId);
        if (callbacks) {
            callbacks.forEach((callback, event) => {
                socket.off(event, callback);
            });
            this.saveCallbacks.delete(characterId);
        }

        console.log(`[AutoSaveManager] Unregistered character ${characterId}`);
    }

    /**
     * Handle important events that trigger immediate save
     */
    async handleImportantEvent(characterId, event, data) {
        console.log(`[AutoSaveManager] Important event ${event} for ${characterId}`);

        // Immediate save on important events
        const result = await this.persistence.saveCharacter(characterId, true);

        if (result.success) {
            this.notifySaveSuccess(characterId, event);
        }
    }

    /**
     * Notify player of successful save
     */
    notifySaveSuccess(characterId, trigger) {
        const char = this.persistence.getActiveCharacter(characterId);
        if (char && char.socket) {
            char.socket.emit('autosave:success', {
                timestamp: Date.now(),
                trigger: trigger
            });
        }
    }

    /**
     * Manual save trigger (e.g., player presses save button)
     */
    async manualSave(characterId) {
        console.log(`[AutoSaveManager] Manual save triggered for ${characterId}`);
        const result = await this.persistence.saveCharacter(characterId, true);

        const char = this.persistence.getActiveCharacter(characterId);
        if (char && char.socket) {
            if (result.success) {
                char.socket.emit('save:success', {
                    timestamp: Date.now(),
                    characterId
                });
            } else {
                char.socket.emit('save:error', {
                    error: result.error
                });
            }
        }

        return result;
    }

    /**
     * Emergency save all (e.g., server shutdown)
     */
    async emergencySaveAll() {
        console.log('[AutoSaveManager] Emergency save triggered');

        const activeChars = this.persistence.getAllActiveCharacters();
        const results = [];

        for (const char of activeChars) {
            const result = await this.persistence.saveCharacter(char.id, true);
            results.push({ characterId: char.id, success: result.success });
        }

        const saved = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`[AutoSaveManager] Emergency save complete: ${saved} saved, ${failed} failed`);

        return { saved, failed, results };
    }

    /**
     * Get save status for a character
     */
    getSaveStatus(characterId) {
        const char = this.persistence.getActiveCharacter(characterId);
        if (!char) return null;

        return {
            lastSave: char.lastSave,
            dirty: char.dirty,
            timeSinceSave: Date.now() - char.lastSave
        };
    }

    /**
     * Cleanup all registrations
     */
    cleanup() {
        this.saveCallbacks.clear();
        console.log('[AutoSaveManager] Cleaned up');
    }
}

module.exports = AutoSaveManager;
