/**
 * System Manager
 * Manages and executes ECS systems
 * Handles system registration and coordinated updates
 */

class SystemManager {
    constructor() {
        // Array of systems in execution order
        this.systems = [];
        
        // System registry for lookup
        this.systemRegistry = new Map();
        
        // Performance tracking
        this.stats = {
            totalSystems: 0,
            lastUpdateTime: 0,
            averageUpdateTime: 0
        };
        
        // System execution stats
        this.systemStats = new Map();
    }

    /**
     * Add a system to the manager
     * @param {object} system - System object with update method
     * @param {number} priority - Execution priority (lower = earlier)
     * @returns {boolean} - True if system was added
     */
    add(system, priority = 0) {
        if (!system || typeof system.update !== 'function') {
            console.error('System must have an update method');
            return false;
        }

        const systemInfo = {
            system,
            priority,
            name: system.name || system.constructor.name,
            enabled: true
        };

        // Insert in priority order
        let insertIndex = this.systems.length;
        for (let i = 0; i < this.systems.length; i++) {
            if (this.systems[i].priority > priority) {
                insertIndex = i;
                break;
            }
        }

        this.systems.splice(insertIndex, 0, systemInfo);
        this.systemRegistry.set(systemInfo.name, systemInfo);
        
        // Initialize system stats
        this.systemStats.set(systemInfo.name, {
            executionCount: 0,
            totalTime: 0,
            averageTime: 0,
            lastTime: 0
        });

        this.stats.totalSystems++;
        
        console.log(`System ${systemInfo.name} added with priority ${priority}`);
        return true;
    }

    /**
     * Remove a system by name
     * @param {string} systemName - Name of system to remove
     * @returns {boolean} - True if system was removed
     */
    remove(systemName) {
        const index = this.systems.findIndex(s => s.name === systemName);
        if (index === -1) return false;

        const systemInfo = this.systems[index];
        this.systems.splice(index, 1);
        this.systemRegistry.delete(systemName);
        this.systemStats.delete(systemName);
        
        this.stats.totalSystems--;
        
        console.log(`System ${systemName} removed`);
        return true;
    }

    /**
     * Enable/disable a system
     * @param {string} systemName - Name of system
     * @param {boolean} enabled - Enable state
     * @returns {boolean} - True if system state was changed
     */
    setEnabled(systemName, enabled) {
        const systemInfo = this.systemRegistry.get(systemName);
        if (!systemInfo) return false;

        systemInfo.enabled = enabled;
        console.log(`System ${systemName} ${enabled ? 'enabled' : 'disabled'}`);
        return true;
    }

    /**
     * Update all enabled systems
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        const startTime = performance.now();
        
        for (const systemInfo of this.systems) {
            if (!systemInfo.enabled) continue;
            
            const systemStartTime = performance.now();
            
            try {
                systemInfo.system.update(deltaTime);
                
                const systemEndTime = performance.now();
                const systemTime = systemEndTime - systemStartTime;
                
                // Update system stats
                const stats = this.systemStats.get(systemInfo.name);
                stats.executionCount++;
                stats.totalTime += systemTime;
                stats.averageTime = stats.totalTime / stats.executionCount;
                stats.lastTime = systemTime;
                
            } catch (error) {
                console.error(`Error in system ${systemInfo.name}:`, error);
                // Disable system on error to prevent crashes
                systemInfo.enabled = false;
            }
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        // Update global stats
        this.stats.lastUpdateTime = totalTime;
        this.stats.averageUpdateTime = 
            (this.stats.averageUpdateTime * (this.systemStats.get('total')?.executionCount || 0) + totalTime) / 
            (this.systemStats.get('total')?.executionCount || 1);
    }

    /**
     * Get system by name
     * @param {string} systemName - Name of system
     * @returns {object|null} - System object or null
     */
    getSystem(systemName) {
        const systemInfo = this.systemRegistry.get(systemName);
        return systemInfo ? systemInfo.system : null;
    }

    /**
     * Get all systems
     * @returns {object[]} - Array of system objects
     */
    getAllSystems() {
        return this.systems.map(s => s.system);
    }

    /**
     * Get system execution order
     * @returns {string[]} - Array of system names in execution order
     */
    getExecutionOrder() {
        return this.systems.map(s => s.name);
    }

    /**
     * Get performance statistics
     * @returns {object} - Performance stats
     */
    getStats() {
        return {
            ...this.stats,
            systemStats: Object.fromEntries(this.systemStats)
        };
    }

    /**
     * Get detailed system information
     * @returns {object} - Detailed system info
     */
    getSystemInfo() {
        return this.systems.map(systemInfo => ({
            name: systemInfo.name,
            priority: systemInfo.priority,
            enabled: systemInfo.enabled,
            stats: this.systemStats.get(systemInfo.name)
        }));
    }

    /**
     * Reset all statistics
     */
    resetStats() {
        this.stats = {
            totalSystems: this.systems.length,
            lastUpdateTime: 0,
            averageUpdateTime: 0
        };
        
        for (const stats of this.systemStats.values()) {
            stats.executionCount = 0;
            stats.totalTime = 0;
            stats.averageTime = 0;
            stats.lastTime = 0;
        }
    }

    /**
     * Clear all systems (for testing)
     */
    clear() {
        this.systems = [];
        this.systemRegistry.clear();
        this.systemStats.clear();
        this.stats = {
            totalSystems: 0,
            lastUpdateTime: 0,
            averageUpdateTime: 0
        };
    }
}

module.exports = SystemManager;
