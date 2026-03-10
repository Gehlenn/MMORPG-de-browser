/**
 * Map Discovery System
 * Handles region discovery and exploration tracking
 */

const worldMap = require("./worldMap");

/**
 * Discover a new region for a player
 * @param {Object} player - Player object
 * @param {string} regionId - Region ID to discover
 * @returns {boolean} True if newly discovered, false if already known
 */
function discoverRegion(player, regionId) {
    // Initialize discovered regions if not exists
    if (!player.discoveredRegions) {
        player.discoveredRegions = [];
    }
    
    // Check if already discovered
    if (player.discoveredRegions.includes(regionId)) {
        return false;
    }
    
    // Add to discovered regions
    player.discoveredRegions.push(regionId);
    
    // Log discovery
    const region = worldMap.getRegionById(regionId);
    console.log(`🗺️ Player ${player.username} discovered ${region ? region.name : regionId}`);
    
    // Award discovery XP
    const discoveryXP = 100;
    player.xp = (player.xp || 0) + discoveryXP;
    
    return true;
}

/**
 * Check if player has discovered a region
 * @param {Object} player - Player object
 * @param {string} regionId - Region ID to check
 * @returns {boolean} True if discovered
 */
function hasDiscoveredRegion(player, regionId) {
    return player.discoveredRegions && player.discoveredRegions.includes(regionId);
}

/**
 * Get all discovered regions for a player
 * @param {Object} player - Player object
 * @returns {Array} Array of discovered region objects
 */
function getDiscoveredRegions(player) {
    if (!player.discoveredRegions) return [];
    
    return player.discoveredRegions
        .map(regionId => worldMap.getRegionById(regionId))
        .filter(region => region !== undefined);
}

/**
 * Get discoverable regions for player level
 * @param {Object} player - Player object
 * @returns {Array} Array of discoverable region objects
 */
function getDiscoverableRegions(player) {
    const { getRegionByLevel, canAccessRegion } = require("./getRegionByLevel");
    
    return worldMap.regions.filter(region => {
        // Can access based on level
        if (!canAccessRegion(player.level || 1, region.id)) {
            return false;
        }
        
        // Not yet discovered
        return !hasDiscoveredRegion(player, region.id);
    });
}

/**
 * Auto-discover starting region for new players
 * @param {Object} player - Player object
 * @returns {string} Starting region ID
 */
function autoDiscoverStartingRegion(player) {
    const startingRegionId = worldMap.metadata.startingRegion;
    discoverRegion(player, startingRegionId);
    return startingRegionId;
}

/**
 * Discover adjacent regions (regions near current position)
 * @param {Object} player - Player object
 * @param {Object} currentRegion - Current region object
 * @returns {Array} Array of newly discovered region IDs
 */
function discoverAdjacentRegions(player, currentRegion) {
    const newlyDiscovered = [];
    
    if (!currentRegion) return newlyDiscovered;
    
    // Get adjacent regions (simplified - could use actual coordinates)
    const adjacentRegions = worldMap.getAdjacentRegions(currentRegion.id);
    
    for (const region of adjacentRegions) {
        // Check if player can access based on level
        const { canAccessRegion } = require("./getRegionByLevel");
        if (canAccessRegion(player.level || 1, region.id)) {
            if (discoverRegion(player, region.id)) {
                newlyDiscovered.push(region.id);
            }
        }
    }
    
    return newlyDiscovered;
}

/**
 * Get discovery progress percentage
 * @param {Object} player - Player object
 * @returns {number} Percentage of world discovered (0-100)
 */
function getDiscoveryProgress(player) {
    if (!player.discoveredRegions) return 0;
    
    const totalRegions = worldMap.metadata.totalRegions;
    const discoveredCount = player.discoveredRegions.length;
    
    return Math.round((discoveredCount / totalRegions) * 100);
}

/**
 * Get discovery statistics
 * @param {Object} player - Player object
 * @returns {Object} Discovery statistics
 */
function getDiscoveryStats(player) {
    const discoveredRegions = getDiscoveredRegions(player);
    const discoverableRegions = getDiscoverableRegions(player);
    
    return {
        totalRegions: worldMap.metadata.totalRegions,
        discoveredCount: discoveredRegions.length,
        discoverableCount: discoverableRegions.length,
        progressPercentage: getDiscoveryProgress(player),
        discoveredRegions: discoveredRegions.map(r => r.name),
        nextRegions: discoverableRegions.slice(0, 3).map(r => r.name)
    };
}

/**
 * Check if player can enter region
 * @param {Object} player - Player object
 * @param {string} regionId - Region ID to enter
 * @returns {Object} Result with canEnter and reason
 */
function canEnterRegion(player, regionId) {
    const region = worldMap.getRegionById(regionId);
    if (!region) {
        return { canEnter: false, reason: 'Region not found' };
    }
    
    const { canAccessRegion } = require("./getRegionByLevel");
    if (!canAccessRegion(player.level || 1, regionId)) {
        return { 
            canEnter: false, 
            reason: `Requires level ${region.levelRange[0]}`,
            requiredLevel: region.levelRange[0]
        };
    }
    
    return { canEnter: true, reason: 'Can enter' };
}

module.exports = {
    discoverRegion,
    hasDiscoveredRegion,
    getDiscoveredRegions,
    getDiscoverableRegions,
    autoDiscoverStartingRegion,
    discoverAdjacentRegions,
    getDiscoveryProgress,
    getDiscoveryStats,
    canEnterRegion
};
