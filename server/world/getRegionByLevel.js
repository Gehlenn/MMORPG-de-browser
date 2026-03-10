/**
 * Get Region By Level Utility
 * Returns appropriate region for player level
 */

const worldMap = require("./worldMap");

/**
 * Get region by player level
 * @param {number} level - Player level
 * @returns {Object|null} Region object or null if not found
 */
function getRegionByLevel(level) {
    return worldMap.regions.find(region => {
        return level >= region.levelRange[0] && level <= region.levelRange[1];
    }) || null;
}

/**
 * Get all regions available for level range
 * @param {number} minLevel - Minimum level
 * @param {number} maxLevel - Maximum level
 * @returns {Array} Array of regions
 */
function getRegionsByLevelRange(minLevel, maxLevel) {
    return worldMap.regions.filter(region => {
        return region.levelRange[0] <= maxLevel && region.levelRange[1] >= minLevel;
    });
}

/**
 * Get next region for progression
 * @param {number} currentLevel - Current player level
 * @returns {Object|null} Next region or null if at max
 */
function getNextRegion(currentLevel) {
    const currentRegion = getRegionByLevel(currentLevel);
    if (!currentRegion) return null;
    
    // Find region with higher level range
    return worldMap.regions.find(region => 
        region.levelRange[0] > currentRegion.levelRange[1]
    ) || null;
}

/**
 * Get previous region for lower level content
 * @param {number} currentLevel - Current player level
 * @returns {Object|null} Previous region or null if at min
 */
function getPreviousRegion(currentLevel) {
    const currentRegion = getRegionByLevel(currentLevel);
    if (!currentRegion) return null;
    
    // Find region with lower level range
    return worldMap.regions.find(region => 
        region.levelRange[1] < currentRegion.levelRange[0]
    ) || null;
}

/**
 * Check if player can access region
 * @param {number} playerLevel - Player level
 * @param {string} regionId - Region ID
 * @returns {boolean} True if player can access
 */
function canAccessRegion(playerLevel, regionId) {
    const region = worldMap.getRegionById(regionId);
    if (!region) return false;
    
    return playerLevel >= region.levelRange[0];
}

/**
 * Get recommended regions for player
 * @param {number} playerLevel - Player level
 * @returns {Array} Array of recommended regions
 */
function getRecommendedRegions(playerLevel) {
    const currentRegion = getRegionByLevel(playerLevel);
    const recommended = [];
    
    if (currentRegion) {
        recommended.push(currentRegion);
    }
    
    // Add next region if close to max level
    if (currentRegion && playerLevel >= currentRegion.levelRange[1] - 5) {
        const nextRegion = getNextRegion(playerLevel);
        if (nextRegion) {
            recommended.push(nextRegion);
        }
    }
    
    return recommended;
}

/**
 * Get region difficulty rating
 * @param {string} regionId - Region ID
 * @returns {string} Difficulty rating (Easy, Medium, Hard, Extreme)
 */
function getRegionDifficulty(regionId) {
    const region = worldMap.getRegionById(regionId);
    if (!region) return 'Unknown';
    
    const [minLevel, maxLevel] = region.levelRange;
    const avgLevel = (minLevel + maxLevel) / 2;
    
    if (avgLevel <= 20) return 'Easy';
    if (avgLevel <= 40) return 'Medium';
    if (avgLevel <= 70) return 'Hard';
    return 'Extreme';
}

module.exports = {
    getRegionByLevel,
    getRegionsByLevelRange,
    getNextRegion,
    getPreviousRegion,
    canAccessRegion,
    getRecommendedRegions,
    getRegionDifficulty
};
