/**
 * Spawn Zones Configuration
 * Defines areas where mobs can spawn
 */

const zones = [
    {
        name: "Goblin Camp",
        x: 200,
        y: 200,
        radius: 150,
        mob: "goblin",
        count: 5,
        respawnTime: 10000 // 10 seconds
    },
    {
        name: "Wolf Den",
        x: 500,
        y: 400,
        radius: 150,
        mob: "wolf",
        count: 5,
        respawnTime: 15000 // 15 seconds
    },
    {
        name: "Slime Pond",
        x: 800,
        y: 300,
        radius: 100,
        mob: "slime",
        count: 8,
        respawnTime: 8000 // 8 seconds
    },
    {
        name: "Northern Outpost",
        x: 1000,
        y: 100,
        radius: 120,
        mob: "goblin",
        count: 4,
        respawnTime: 12000 // 12 seconds
    },
    {
        name: "Eastern Plains",
        x: 1200,
        y: 500,
        radius: 180,
        mob: "wolf",
        count: 6,
        respawnTime: 18000 // 18 seconds
    }
];

module.exports = zones;
