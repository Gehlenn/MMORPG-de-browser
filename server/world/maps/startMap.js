/**
 * Start Map - Tibia Style
 * Simple tile-based map for the MMORPG
 */

const map = {
    width: 50,
    height: 50,
    tiles: []
};

// Generate basic grass map
for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
        map.tiles.push({
            x,
            y,
            type: "grass",
            walkable: true
        });
    }
}

// Add some water features
const waterTiles = [
    // Small lake in the middle
    { x: 20, y: 20 }, { x: 21, y: 20 }, { x: 22, y: 20 },
    { x: 20, y: 21 }, { x: 21, y: 21 }, { x: 22, y: 21 },
    { x: 20, y: 22 }, { x: 21, y: 22 }, { x: 22, y: 22 },
    
    // River
    { x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }, { x: 10, y: 13 },
    { x: 11, y: 13 }, { x: 12, y: 13 }, { x: 13, y: 13 }, { x: 14, y: 13 }
];

// Apply water tiles
waterTiles.forEach(water => {
    const tile = map.tiles.find(t => t.x === water.x && t.y === water.y);
    if (tile) {
        tile.type = "water";
        tile.walkable = false;
    }
});

// Add some dirt paths
const dirtTiles = [
    // Horizontal path
    { x: 5, y: 25 }, { x: 6, y: 25 }, { x: 7, y: 25 }, { x: 8, y: 25 }, { x: 9, y: 25 },
    { x: 10, y: 25 }, { x: 11, y: 25 }, { x: 12, y: 25 }, { x: 13, y: 25 }, { x: 14, y: 25 },
    
    // Vertical path
    { x: 25, y: 5 }, { x: 25, y: 6 }, { x: 25, y: 7 }, { x: 25, y: 8 }, { x: 25, y: 9 },
    { x: 25, y: 10 }, { x: 25, y: 11 }, { x: 25, y: 12 }, { x: 25, y: 13 }, { x: 25, y: 14 }
];

// Apply dirt tiles
dirtTiles.forEach(dirt => {
    const tile = map.tiles.find(t => t.x === dirt.x && t.y === dirt.y);
    if (tile) {
        tile.type = "dirt";
        tile.walkable = true;
    }
});

console.log(`🗺️ Map generated: ${map.width}x${map.height} with ${map.tiles.length} tiles`);

module.exports = map;
