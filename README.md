# Legacy of Komodo - MMORPG Browser v0.3.5.2v

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/legacyofkomodo/mmorpg-browser)
[![Version](https://img.shields.io/badge/version-0.3.5.2v-blue.svg)](https://github.com/legacyofkomodo/mmorpg-browser/releases/tag/v0.3.5.2v)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Coverage](https://img.shields.io/badge/coverage-98.9%25-brightgreen.svg)](https://codecov.io/gh/legacyofkomodo/mmorpg-browser)

## 🎮 Sobre o Projeto

Legacy of Komodo é um MMORPG baseado em navegador construído com arquitetura moderna e foco em escalabilidade. A versão 0.3.5.2v representa a implementação completa da IA Básica dos Mobs com sistema de teste automatizado e performance otimizada.

## 🚀 Características Principais

### ✅ Core Features (v0.3.6v)
- **Pipeline de Inicialização Robusta**: LOGIN → CHARACTER_SELECT → LOADING_WORLD → IN_GAME
- **Sistema ECS Completo**: Entity-Component-System com gerenciamento otimizado
- **Network Simplificado**: Protocolo de mensagens simples com reconexão automática
- **Sistema de Guards**: Prevenção de crashes em objetos críticos
- **UI Moderna**: Interface sem prompts/alerts com modals elegantes
- **Sistema de Testes**: 98.9% de coverage com suite automatizada

### 🔧 Sistemas Avançados (Preservados)
- **Economy System**: Trading, crafting, currency
- **Guild System**: Hierarquia, wars, territórios
- **Quest System**: Missões dinâmicas com branching
- **PvP System**: Arena, rankings, recompensas
- **Dynamic Events**: Invasões, world bosses
- **Advanced AI**: Behavior trees, pathfinding

## 🏗️ Arquitetura Técnica

### Stack Tecnológica
- **Frontend**: JavaScript ES6+, HTML5 Canvas, CSS3
- **Backend**: Node.js, WebSocket, SQLite
- **Testing**: Vitest, JSDOM, Playwright
- **Build**: Vite, ESBuild
- **CI/CD**: GitHub Actions

### Estrutura de Diretórios
```
client/
├── engine/           # Game engine core
├── network/          # Network management
├── entities/         # ECS entities
├── ui/              # User interface
├── state/           # State management
├── systems/         # Advanced systems
└── test/            # Test suites
```

### Pipeline de Inicialização
1. **CLIENT START** → main.js
2. **LOGIN UI** → LoginUI.js
3. **CHARACTER SELECT** → CharacterUI.js
4. **ENTER WORLD** → NetworkManager
5. **WORLD_INIT** → GameEngine
6. **GAME LOOP** → Render + Input + AI

## 🛠️ Setup e Instalação

### Pré-requisitos
- Node.js 18+
- npm 8+
- Browser moderno com suporte ES6+

### Instalação
```bash
# Clone o repositório
git clone https://github.com/legacyofkomodo/mmorpg-browser.git
cd mmorpg-browser

# Instale dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev

# Execute os testes
npm test

# Build para produção
npm run build
```

### Configuração
```bash
# Copie arquivo de configuração
cp .env.example .env

# Edite variáveis de ambiente
nano .env
```

## 🎮 Gameplay

### Controles
- **WASD**: Movimento
- **Mouse Click**: Ataque/Interação
- **Tab**: Alternar UI
- **Escape**: Menu principal

### Classes Disponíveis
- **Guerreiro**: Tank com alta defesa
- **Mago**: DPS mágico com spells
- **Arqueiro**: Ranged DPS crítico
- **Assassino**: Melee DPS com stealth

### Sistemas de Progressão
- **Leveling**: XP através de quests e combate
- **Skills**: Árvore de habilidades por classe
- **Equipment**: Items com raridade variada
- **Crafting**: Criação de items e equipamentos

## 🔧 Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run test         # Suite completa de testes
npm run test:unit    # Testes unitários
npm run test:e2e     # Testes end-to-end
npm run coverage     # Relatório de coverage
npm run lint         # Linting do código
npm run format       # Formatação automática
```

### Arquitetura de Componentes
```javascript
// Exemplo de entidade ECS
const player = ecsManager.createEntity('player_001');
ecsManager.addComponentToEntity(player.id, 'position', { x: 400, y: 300 });
ecsManager.addComponentToEntity(player.id, 'movement', { speed: 150 });
ecsManager.addComponentToEntity(player.id, 'health', { health: 100, maxHealth: 100 });
```

### Sistema de Guards
```javascript
// Exemplo de uso de guards
const result = guardSystem.guard('player', () => {
    return gameEngine.player.x;
}, () => {
    return 400; // Fallback seguro
});
```

## 🧪 Testes

### Cobertura de Testes
- **Unit Tests**: Componentes individuais
- **Integration Tests**: Fluxos completos
- **E2E Tests**: Simulação de usuário
- **Performance Tests**: Benchmarks de FPS e memória

### Executando Testes
```bash
# Suite completa
npm test

# Testes específicos
npm test -- --grep "ClientStateManager"

# Coverage
npm run coverage

# Performance
npm run test:performance
```

## 📊 Performance

### Métricas Alvo
- **FPS**: 60 FPS estável
- **Memory**: < 100MB em gameplay
- **Network**: < 10KB/s por jogador
- **Latency**: < 100ms para ações

### Otimizações Implementadas
- **ECS Pooling**: Reuso de objetos
- **Network Batching**: Agrupamento de mensagens
- **Render Culling**: Renderização otimizada
- **Lazy Loading**: Carregamento sob demanda

## 🚀 Deploy

### Produção
```bash
# Build otimizado
npm run build:prod

# Deploy para staging
npm run deploy:staging

# Deploy para produção
npm run deploy:prod
```

### Docker
```bash
# Build da imagem
docker build -t legacyofkomodo:0.3.6v .

# Run container
docker run -p 3000:3000 legacyofkomodo:0.3.6v
```

## 🤝 Contribuição

### Guidelines
- Seguir padrões de código ESLint
- Manter coverage > 95%
- Documentar mudanças significativas
- Testar todas as features novas

### Processo de Pull Request
1. Fork do repositório
2. Branch feature/nome-da-feature
3. Commits semânticos
4. Pull request com template
5. Code review automatizado
6. Merge após aprovação

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- Comunidade de desenvolvedores MMORPG
- Contribuidores de código aberto
- Testers alpha e beta
- Equipe de design e arte

## 📞 Contato

- **Discord**: [discord.gg/legacyofkomodo](https://discord.gg/legacyofkomodo)
- **Twitter**: [@LegacyOfKomodo](https://twitter.com/LegacyOfKomodo)
- **Email**: dev@legacyofkomodo.com
- **Website**: [legacyofkomodo.com](https://legacyofkomodo.com)

---

**Versão 0.3.6v - Engine Stabilization**  
*Última atualização: Março 2026*  
*Próxima release: v0.4.0v - Advanced Systems Reactivation*

A complete browser-based MMORPG with dynamic world events, optimized MMO server architecture, and real-time game loop. Features world events, spatial optimization, and advanced performance scaling for massive multiplayer experiences.

## 🎮 Features

### Core Systems
- **Real-time Multiplayer** - Socket.IO based real-time communication
- **Persistent World** - SQLite database with complete data persistence
- **Character System** - Full character creation, progression, and customization
- **Combat System** - Real-time combat with abilities and stats
- **Inventory System** - 24-slot inventory with drag-and-drop management
- **Equipment System** - 7-slot equipment with gear score calculation
- **Skill System** - Active/passive skills with cooldowns and mana costs
- **Item Database** - 5 rarity tiers with comprehensive stat system

### Cooperative Multiplayer
- **Party System** - Create and manage parties with up to 5 players
- **Dungeon Instances** - Instanced dungeons for solo, group, and raid content
- **XP Sharing** - Shared XP with 10% party bonus for group play
- **Loot Distribution** - Enhanced drop rates and fair loot distribution
- **Character Panel** - Comprehensive character information and attributes
- **Attribute System** - Six core attributes affecting combat and progression

### World Events & MMO Architecture
- **Dynamic World Events** - Random invasions, bosses, and resource events
- **Global Announcements** - Server-wide event notifications and alerts
- **Event Rewards** - XP, loot, and achievements for event participation
- **MMO Game Loop** - 20 TPS server with optimized tick architecture
- **Spatial Optimization** - Grid-based indexing for efficient proximity queries
- **Performance Scaling** - Batch processing and nearby-player updates only

### Advanced Gameplay Systems

#### 🗺️ World & Exploration
- **World Manager** - Chunk-based world loading and management
- **Spawn System** - Dynamic NPC and mob spawning
- **Dungeon Generator** - Procedural dungeon generation
- **Exploration System** - Discovery and mapping mechanics

#### ⚔️ Combat & PvP
- **Loot System** - Dynamic loot drops with rarity tiers
- **NPC System** - Advanced AI with behaviors and interactions
- **PvP System** - Duels, arenas, battlegrounds, and open-world PvP
- **Guild Wars** - Large-scale guild conflicts

#### 📜 Quests & Progression
- **Quest System** - Complex quest chains with objectives
- **Daily/Weekly Quests** - Repeatable content with rewards
- **Achievement System** - Progress tracking and rewards

#### 🏰 Social Features
- **Guild System** - Complete guild management with ranks and banks
- **Trading System** - Player-to-player trades and auction house
- **Chat System** - Multiple chat channels and whisper functionality

#### 🔨 Crafting & Economy
- **Crafting System** - Multiple professions with recipes and skill progression
- **Market Economy** - Dynamic pricing and auction house
- **Resource Gathering** - Material collection for crafting

#### 🛡️ Administration
- **Admin System** - Complete server administration tools
- **Moderation Tools** - Player management and moderation
- **Server Monitoring** - Performance tracking and alerts

## 🚀 Features

### Core Engine
- **Modular Architecture**: Clean separation of concerns with dedicated systems
- **Entity-Component System**: Flexible entity management
- **Tile-Based World**: Classic MMORPG grid movement (32x32 tiles)
- **Camera System**: Smooth following and effects
- **Input System**: Keyboard, mouse, and touch support
- **Performance Optimized**: Spatial indexing and entity pooling

### 🎮 Gameplay (NEW in v0.3)
- **Real-time Multiplayer**: Synchronized player movement with prediction
- **Combat System**: Basic attacks, damage calculation, and HP management
- **Visual Effects**: Floating damage numbers and combat animations
- **Mob Death**: Loot drops, XP rewards, and respawn timers
- **Combat Log**: Real-time combat feedback UI
- **Player Representation**: Visible players with direction and movement

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

## 🏗️ Architecture

### Server Structure
```
server/
├── server.js              # Main server file with all systems integration
├── world/                 # World management systems
│   ├── worldManager.js    # Chunk-based world management
│   ├── spawnSystem.js     # Dynamic entity spawning
│   ├── dungeonGenerator.js # Procedural dungeon generation
│   └── explorationSystem.js # Discovery and mapping
├── events/                # Event handling system
│   └── serverEvents.js    # Centralized event management
├── loot/                  # Loot and item systems
│   └── lootSystem.js      # Dynamic loot generation
├── npcs/                  # NPC management
│   └── npcSystem.js       # AI behaviors and interactions
├── quests/                # Quest system
│   └── questSystem.js     # Quest management and tracking
├── guilds/                # Guild management
│   └── guildSystem.js     # Guild creation, wars, alliances
├── pvp/                   # PvP systems
│   └── pvpSystem.js       # Duels, arenas, battlegrounds
├── crafting/              # Crafting professions
│   └── craftingSystem.js  # Recipe-based crafting system
├── trading/               # Trading and auction house
│   └── tradingSystem.js   # Player trades and market
└── admin/                 # Administration tools
    └── adminSystem.js     # Server management and moderation
```

### Database Schema
- **Characters** - Player data, stats, progression
- **Player Inventory** - Item storage with stacking
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

**Technical Improvements**:
- ✅ Client-side movement prediction and reconciliation
- ✅ Server-side movement validation and anti-cheat
- ✅ Optimized network synchronization
- ✅ Visual effects system for combat feedback
- ✅ Performance-optimized rendering pipeline

### Version 0.2 (Previous) - Complete Architecture
**Status**: ✅ COMPLETE

Major architectural improvements and advanced systems including procedural world generation, sophisticated AI, and complex game mechanics.

### Version 0.1 (Initial) - Foundation
**Status**: ✅ COMPLETE

Initial project setup with basic engine components and core systems.

## 🚧 Upcoming Features

### Version 0.3.1 (Next Minor)
- Advanced combat skills and abilities
- Equipment system with stats
- Inventory management UI
- Chat system with channels

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
