/**
 * Tile Types Configuration
 * Defines properties for different tile types
 */

module.exports = {
    grass: {
        walkable: true,
        color: "#2e8b57",  // Sea green
        texture: "grass",
        movementSpeed: 1.0
    },
    
    water: {
        walkable: false,
        color: "#1e90ff",  // Dodger blue
        texture: "water",
        movementSpeed: 0
    },
    
    dirt: {
        walkable: true,
        color: "#8b4513",  // Saddle brown
        texture: "dirt",
        movementSpeed: 0.9
    },
    
    stone: {
        walkable: true,
        color: "#696969",  // Dim gray
        texture: "stone",
        movementSpeed: 0.8
    },
    
    sand: {
        walkable: true,
        color: "#f4a460",  // Sandy brown
        texture: "sand",
        movementSpeed: 0.7
    },
    
    forest: {
        walkable: false,
        color: "#228b22",  // Forest green
        texture: "forest",
        movementSpeed: 0
    },
    
    mountain: {
        walkable: false,
        color: "#808080",  // Gray
        texture: "mountain",
        movementSpeed: 0
    }
};
