# MMORPG de Browser - Version 0.2

A scalable browser-based MMORPG engine built with modern web technologies.

## 🎮 Overview

MMORPG de Browser is a comprehensive multiplayer online role-playing game engine that runs entirely in the browser. Version 0.2 introduces major architectural improvements and advanced systems including procedural world generation, sophisticated AI, and complex game mechanics.

## 🚀 Features

### Core Engine
- **Modular Architecture**: Clean separation of concerns with dedicated systems
- **Entity-Component System**: Flexible entity management
- **Tile-Based World**: Classic MMORPG grid movement (32x32 tiles)
- **Camera System**: Smooth following and effects
- **Input System**: Keyboard, mouse, and touch support
- **Performance Optimized**: Spatial indexing and entity pooling

### World System
- **Procedural Generation**: Infinite world with biomes
- **8 Unique Biomes**: Plains, Forest, Mountain, Swamp, Desert, Frozen, Volcanic, Darklands
- **Cities and Roads**: Dynamic city placement and road generation
- **Portal System**: Fast travel between locations
- **Resource Distribution**: Biome-specific resources

### Dungeon System
- **Procedural Dungeons**: Albion Online inspired layouts
- **5 Room Types**: Spawn, Combat, Elite, Treasure, Boss rooms
- **Raids**: Static high-difficulty dungeons
- **Dynamic Difficulty**: Scales with player level

### Advanced Monster AI
- **6 AI States**: Idle, Patrol, Aggro, Attack, Return, Dead
- **Rare Variants**: 0.1% to 1% spawn chance with enhanced stats
- **Boss Mechanics**: Complex abilities and phases
- **40+ Monster Types**: Distributed across biomes
- **Smart Pathfinding**: A* pathfinding with obstacle avoidance

### Combat System
- **Ragnarok Online Inspired**: Auto-targeting and basic attacks
- **Skill Priority System**: Intelligent skill usage
- **Cooldowns and Mana**: Strategic resource management
- **Damage Numbers**: Visual feedback for combat
- **Battle Log UI**: Detailed combat information

### Class Progression
- **Apprentice to Master**: 6-tier progression system
- **6 Base Classes**: Warrior, Mage, Hunter, Rogue, Priest, Druid
- **12 Advanced Classes**: Level 30 specializations
- **24 Master Classes**: Level 50 ultimate forms
- **6 Attributes**: STR, AGI, INT, VIT, DEX, WIS

### Skill System
- **Dynamic Skills**: Damage, buffs, debuffs, area effects
- **Cooldown Management**: Strategic timing
- **Mana Costs**: Resource balancing
- **Range Requirements**: Positional gameplay
- **Skill Combinations**: Combo system

### Item System
- **6 Rarity Tiers**: Common to Mythic
- **Upgrade System**: +1 to +9 enhancement
- **Enchantment System**: Elemental damage and special effects
- **Durability**: Equipment degradation
- **Visual Rarity**: Color-coded items

### Crafting System
- **7 Professions**: Blacksmith, Armorer, Alchemist, Tailor, Carpenter, Jeweler, Runemaster
- **5 Quality Levels**: Common to Legendary
- **Material Requirements**: Resource gathering
- **Recipe System**: Discoverable combinations

### Economy System
- **Dynamic Marketplace**: Player-driven economy
- **Regional Resources**: Biome-specific materials
- **Supply and Demand**: Price fluctuations
- **Trade Transport**: Logistics mechanics
- **5% Market Tax**: Economic balance

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **JavaScript ES6+**: Modern JavaScript features
- **Canvas API**: Hardware-accelerated rendering
- **CSS3**: Modern styling with animations

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **SQLite3**: Database management
- **WebSockets**: Real-time communication (planned)

### Architecture
- **Modular Design**: Separated concerns
- **Entity System**: Component-based architecture
- **Event-Driven**: Loose coupling
- **Data-Driven**: Configuration-based systems

## 📁 Project Structure

```
client/
├── engine/           # Core engine systems
│   ├── Game.js      # Main game loop
│   ├── Renderer.js  # Rendering system
│   ├── Input.js     # Input handling
│   ├── Camera.js    # Camera management
│   └── EntityManager.js # Entity management
├── world/           # World generation
│   ├── TileMap.js   # Tile-based maps
│   ├── BiomeSystem.js # Biome management
│   ├── WorldGenerator.js # Procedural generation
│   └── Chunk.js     # World chunks
├── entities/        # Game entities
│   ├── Entity.js    # Base entity class
│   ├── Player.js    # Player entity
│   ├── Monster.js   # Monster entity
│   ├── NPC.js       # Non-player characters
│   └── Item.js      # Item entities
├── systems/         # Game systems
│   ├── CombatSystem.js # Combat mechanics
│   ├── AISystem.js  # AI behavior
│   ├── SpawnSystem.js # Entity spawning
│   ├── SkillSystem.js # Skill management
│   └── ClassSystem.js # Class progression
├── economy/         # Economic systems
│   ├── EconomyManager.js # Economy management
│   ├── MarketManager.js # Marketplace
│   └── ResourceManager.js # Resource management
├── dungeon/         # Dungeon system
│   ├── DungeonGenerator.js # Procedural dungeons
│   ├── DungeonManager.js # Dungeon management
│   └── DungeonRoom.js # Room types
├── ui/              # User interface
│   ├── InventoryUI.js # Inventory interface
│   ├── StatsUI.js   # Character stats
│   ├── ChatUI.js    # Chat system
│   └── BattleLogUI.js # Combat log
├── data/            # Game data
│   ├── classes.js   # Class definitions
│   ├── skills.js    # Skill data
│   ├── monsters.js  # Monster data
│   ├── items.js     # Item database
│   └── resources.js # Resource data
└── assets/          # Game assets
    ├── tilesets/    # Tile graphics
    ├── sprites/     # Entity sprites
    ├── monsters/    # Monster graphics
    └── items/       # Item icons

server/
├── server.js        # Main server
└── database/        # Database management
    └── database.js   # Database connection

scripts/             # Build and utility scripts
art/                 # Game art and assets
output/              # Generated files
```

## 🚀 Quick Start

### Prerequisites
- Node.js 14.0 or higher
- npm 6.0 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MMORPG-de-browser
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Commands

```bash
# Start the server
npm start

# Apply art pipeline
npm run art:apply

# Optimize images
npm run assets:optimize

# Dry run art pipeline
npm run art:dry
```

## 🎮 Gameplay

### Character Creation
1. Create an account or login
2. Choose your race (Human, Elf, Dwarf)
3. Select your starting class
4. Customize your character's appearance

### Basic Controls
- **WASD/Arrow Keys**: Movement
- **E/Space**: Interact
- **Enter**: Attack/Confirm
- **I**: Inventory
- **M**: Map
- **1-9**: Use skills

### Combat
- **Auto-Attack**: Targets nearest enemy
- **Skills**: Use number keys or click skill bar
- **Movement**: Position-based combat
- **Strategy**: Manage cooldowns and mana

### Progression
- **Experience**: Defeat monsters and complete quests
- **Levels**: Gain stat points and unlock abilities
- **Classes**: Advance through class tiers
- **Skills**: Learn and upgrade abilities
- **Equipment**: Find and upgrade gear

## 🔧 Configuration

### Game Settings
Edit `client/data/` files to modify:
- Class statistics
- Skill parameters
- Monster stats
- Item properties
- Resource distribution

### Server Settings
Modify `server/server.js` for:
- Port configuration
- Database settings
- Security options
- Performance tuning

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Update documentation
- Test all functionality

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🗺️ Roadmap

### Version 0.1 (Completed)
- Basic map and movement
- Simple monsters
- Basic inventory
- Simple combat

### Version 0.2 (Current)
- ✅ Core engine architecture
- ✅ Procedural world generation
- ✅ Advanced monster AI
- ✅ Class progression system
- ✅ Skill system
- ✅ Item upgrade system
- ✅ Crafting system
- ✅ Dynamic economy

### Version 0.3 (Planned)
- Multiplayer networking
- Guild system
- PvP arenas
- Housing system
- Pets and mounts

### Version 0.4 (Future)
- Large-scale raids
- Territory conquest
- Advanced crafting
- Player housing
- Weather system

## 🐛 Bug Reports

Found a bug? Please report it on our GitHub Issues page with:
- Detailed description
- Steps to reproduce
- Expected vs actual behavior
- System information

## 💬 Support

Join our community:
- **Discord**: [Link to Discord server]
- **Reddit**: r/MMORPGdeBrowser
- **Wiki**: [Link to game wiki]

## 🙏 Credits

- **Development Team**: [Team members]
- **Art Assets**: [Artists and sources]
- **Music & Sound**: [Audio credits]
- **Special Thanks**: [Contributors and supporters]

---

**Version 0.2** - Built with passion for the MMORPG community 🎮
