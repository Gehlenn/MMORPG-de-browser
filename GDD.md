# MMORPG de Browser - Game Design Document

## Version 0.3.1 - First Playable Gameplay Build

*Last Updated: March 2026*

## Table of Contents
1. [Game Vision](#game-vision)
2. [Version 0.3.1 Features](#version-031-features)
3. [Core Gameplay Loop](#core-gameplay-loop)
4. [World Design](#world-design)
5. [Character Systems](#character-systems)
6. [Combat System](#combat-system)
7. [Progression Systems](#progression-systems)
8. [Economy & Crafting](#economy--crafting)

---

## 🎯 Version 0.3.4 Features

### Dynamic World Events and MMO Game Loop

#### World Events System
- **Dynamic Event Spawning**: Random world events across different regions
- **Event Types**: Demon invasions, world bosses, resource bonanzas, temporal dungeons, celestial blessings
- **Regional Management**: Events spawn in specific regions with cooldown periods
- **Global Announcements**: Server-wide notifications for major events
- **Participation Tracking**: Real-time participant monitoring and reward distribution

#### MMO Game Loop Architecture
- **20 TPS Server**: 20 ticks per second for smooth gameplay
- **Spatial Indexing**: Grid-based spatial optimization for proximity queries
- **Batch Processing**: Efficient update batching for network optimization
- **Nearby Updates**: Only send updates to players within 300px radius
- **Performance Monitoring**: Real-time performance metrics and optimization

#### Event Mechanics
- **Level Requirements**: Minimum level requirements for event participation
- **Participant Limits**: Maximum participants per event for balance
- **Dynamic Difficulty**: Scaling based on participant count and levels
- **Reward Multipliers**: XP and loot bonuses for event completion
- **Achievement Integration**: Achievement rewards for event participation

#### Performance Optimizations
- **Spatial Grid**: O(1) proximity queries replacing O(n) searches
- **Update Queues**: Batching system for efficient network updates
- **Memory Management**: Automatic cleanup and garbage collection
- **Network Optimization**: 80% reduction in network calls through batching

---

## 🎯 Version 0.3.3 Features

### Cooperative Multiplayer Gameplay

#### Party System
- **Party Creation**: Players can create parties with up to 5 members
- **Invite System**: Invite players by name with 30-second timeout
- **Leader Management**: Party leader can promote, kick, and manage members
- **Real-time Updates**: Live party member status and location updates
- **Party Chat**: Built-in communication for party coordination
- **Auto-disband**: Parties automatically disband when empty

#### Dungeon Instance System
- **Instance Types**: Solo, Group (2-5 players), and Raid (6-10 players)
- **Dynamic Scaling**: Difficulty scales based on party size and type
- **Mob Spawning**: Dynamic mob spawning with respawns
- **Boss Encounters**: Boss fights with unique mechanics and loot
- **Instance Management**: Automatic cleanup and state persistence
- **Party Integration**: Dungeons created per party for exclusive access

#### Character Panel
- **Tabbed Interface**: Stats, Combat Records, and Talent Trees
- **Attribute Display**: Visual representation of STR, DEX, INT, VIT, WIS, AGI
- **Combat Statistics**: K/D ratio, total damage, kills, deaths
- **Gear Score**: Real-time gear score calculation and display
- **Level Progression**: Visual level and XP information
- **Interactive Elements**: Hover effects and detailed tooltips

#### Attribute System
- **Six Core Attributes**: Strength, Dexterity, Intelligence, Vitality, Wisdom, Agility
- **Stat Impact**: Attributes directly affect combat calculations
- **Visual Feedback**: Color-coded attribute display with descriptions
- **Progression Tracking**: Attribute growth with level advancement
- **Talent Integration**: Foundation for future talent system

#### XP and Loot Distribution
- **Party XP Bonus**: 10% XP bonus for party members
- **Shared XP**: XP distributed among nearby party members
- **Loot Bonus**: 10% increased drop chance in parties
- **Fair Distribution**: Random loot distribution among party members
- **Boss Rewards**: Enhanced loot for dungeon boss encounters

---

## 🎯 Version 0.3.2 Features

### Character Progression Systems

#### Inventory System
- **24-Slot Inventory**: Grid-based inventory with drag-and-drop functionality
- **Item Stacking**: Consumables and materials can stack up to 99 units
- **Item Management**: Use, equip, drop, and organize items efficiently
- **Visual Feedback**: Color-coded rarity borders and item icons
- **Context Menus**: Right-click actions for item interaction
- **Tooltips**: Detailed item information on hover

#### Equipment System
- **7 Equipment Slots**: Weapon, Helmet, Armor, Gloves, Boots, Ring, Amulet
- **Real-time Stats**: Automatic stat recalculation when equipping items
- **Gear Score**: Overall power calculation based on equipment quality
- **Visual Display**: Character paper doll with equipped items
- **Stat Bonuses**: Equipment provides attack, defense, health, and other bonuses
- **Level Requirements**: Equipment has minimum level requirements

#### Skill System
- **Active Skills**: Castable abilities with mana costs and cooldowns
- **Passive Skills**: Automatic bonuses and effects
- **Class-Based Skills**: Different skills for Warrior, Mage, and Rogue classes
- **Skill Progression**: Learn and upgrade skills as you level
- **Status Effects**: Buffs, debuffs, damage over time, healing over time
- **Elemental Damage**: Fire, ice, lightning, and poison damage types

#### Skill Bar Interface
- **6-Slot Hotbar**: Quick access to frequently used skills
- **Hotkey Binding**: Skills bound to keys 1-6
- **Cooldown Indicators**: Visual feedback for skill availability
- **Drag-and-Drop**: Easy skill assignment to hotbar slots
- **Casting System**: Cast times and casting animations
- **Mana Management**: Visual mana cost and regeneration

#### Item Database
- **5 Rarity Tiers**: Common, Uncommon, Rare, Epic, Legendary
- **Multiple Item Types**: Weapons, armor, accessories, consumables, materials
- **Stat Scaling**: Item stats scale with rarity and level
- **Item Descriptions**: Lore and functionality information
- **Visual Icons**: Emoji-based icons for quick identification

---

## 🎯 Version 0.3.1 Features

### First Playable Gameplay Build

#### Multiplayer Movement System
- **Server-Side Validation**: All movement validated server-side with anti-cheat protection
- **Real-Time Broadcasting**: Player positions broadcast to nearby players at 20 updates/second
- **Client Prediction**: Smooth movement with server reconciliation for lag compensation
- **Collision Detection**: World boundary and obstacle collision with proper response
- **Speed Limiting**: Configurable movement speeds with validation thresholds

#### Combat System Implementation
- **Real-Time Combat**: Action-based combat with immediate response
- **Damage Calculation**: Complex damage formula with multiple variables
- **Critical Hits**: 5% chance for 2x damage with visual indicators
- **Attack Range**: 50 pixel range validation for melee attacks
- **Cooldown System**: 1 second attack cooldown to prevent spam

#### Visual Effects System
- **Damage Numbers**: Floating damage indicators with color coding
- **Particle Effects**: Blood, sparks, and magic particles for combat feedback
- **Screen Shake**: Impact effects for critical hits and powerful attacks
- **Death Animations**: Fade out and particle explosion effects
- **Combat Animations**: Slash effects and attack animations

#### Progression System
- **Experience Points**: Gained from defeating mobs based on level difference
- **Level Scaling**: Exponential XP requirements (100 × 1.2^(level-1))
- **Stat Growth**: Automatic increases to health, attack, and defense
- **Level Up Rewards**: Full health regeneration and stat improvements

#### Loot System
- **Drop Chances**: 70% chance for mobs to drop something
- **Gold Rewards**: 90% chance for gold drops based on mob level
- **Item Drops**: 30% chance for equipment with rarity levels
- **Loot Visualization**: Visual indicators when loot is dropped

#### Mob System
- **Dynamic Spawning**: Mobs spawn in regions using spawn tables
- **Mob Stats**: HP, attack, defense, and level attributes
- **AI Behavior**: Basic AI with aggro and attack patterns
- **Respawn System**: 30-second respawn with ±10 second variation

#### User Interface
- **Health Bars**: Real-time health display for player and targets
- **Target Frames**: Mob information with health and level
- **Combat Log**: Real-time combat messages and events
- **XP Notifications**: Level up and XP gain notifications

#### Technical Implementation
- **Server Architecture**: Modular systems with event-driven communication
- **Client Integration**: Seamless integration with existing game client
- **Database Integration**: Persistent combat stats and progression
- **Network Optimization**: Efficient packet structure and broadcasting

---

## �🎮 Game Vision

### High-Level Concept
MMORPG de Browser is a classic-style MMORPG that brings the depth and complexity of traditional MMOs to the browser platform. The game combines nostalgic tile-based gameplay with modern systems design, creating an accessible yet deep experience.

### Target Audience
- **Primary**: MMORPG enthusiasts seeking a browser-based experience
- **Secondary**: Casual gamers looking for progression-based gameplay
- **Tertiary**: Students and professionals with limited gaming time

### Unique Selling Points
1. **Browser Accessibility**: No download required, play anywhere
2. **Classic Feel**: Tile-based movement with modern systems
3. **Deep Progression**: Complex class and skill systems
4. **Player-Driven Economy**: Dynamic marketplace and crafting
5. **Procedural Content**: Infinite world with unique experiences

### Design Pillars
1. **Accessibility**: Easy to learn, difficult to master
2. **Depth**: Multiple progression paths and systems
3. **Community**: Social interaction at the core
4. **Persistence**: Meaningful long-term progression
5. **Performance**: Smooth gameplay on any device

---

## 🔄 Core Gameplay Loop

### Primary Loop
```
Explore → Combat → Loot → Craft → Upgrade → Repeat
```

### Detailed Breakdown

#### 1. Exploration Phase
- **World Discovery**: Uncover new biomes and locations
- **Resource Gathering**: Collect materials for crafting
- **Quest Acceptance**: Find and undertake missions
- **Social Interaction**: Meet other players and NPCs

#### 2. Combat Phase
- **Monster Hunting**: Fight creatures for experience and loot
- **Skill Usage**: Deploy abilities strategically
- **Position Management**: Use terrain and spacing
- **Team Coordination**: Work with party members

#### 3. Loot Phase
- **Item Collection**: Gather dropped equipment and materials
- **Quality Assessment**: Evaluate item rarity and usefulness
- **Inventory Management**: Organize and optimize storage
- **Market Preparation**: Prepare items for trading

#### 4. Craft Phase
- **Material Processing**: Refine gathered resources
- **Item Creation**: Craft equipment and consumables
- **Quality Improvement**: Enhance crafted items
- **Market Analysis**: Study economic trends

#### 5. Upgrade Phase
- **Equipment Enhancement**: Upgrade and enchant gear
- **Skill Development**: Learn and improve abilities
- **Stat Allocation**: Optimize character attributes
- **Strategy Planning**: Prepare for next challenges

### Session Structure
- **Short Sessions (15-30 min)**: Daily quests, resource gathering, social interaction
- **Medium Sessions (1-2 hours)**: Dungeon runs, crafting sessions, market trading
- **Long Sessions (3+ hours)**: Raid progression, territory control, large events

---

## 🌍 World Design

### World Structure
- **Infinite Procedural World**: Chunk-based generation system
- **Biome Diversity**: 8 unique biomes with distinct characteristics
- **City Hubs**: Major population centers with services
- **Dungeon Instances**: Instanced challenges for groups and solo players
- **Portal Network**: Fast travel between major locations

### Biome Details

#### Plains
- **Theme**: Peaceful grasslands, beginner-friendly
- **Resources**: Herbs, wood, common materials
- **Monsters**: Goblins, wolves, basic creatures
- **Dungeons**: Forest caves, goblin camps
- **Cities**: Starting towns, trade hubs

#### Forest
- **Theme**: Dense woodland, mysterious atmosphere
- **Resources**: Rare wood, magical herbs, mushrooms
- **Monsters**: Bears, spiders, magical creatures
- **Dungeons**: Ancient groves, spider lairs
- **Cities**: Elven outposts, druid circles

#### Mountain
- **Theme**: Rocky peaks, mining opportunities
- **Resources**: Iron, gold, precious gems
- **Monsters**: Orcs, eagles, golems
- **Dungeons**: Dwarf mines, dragon peaks
- **Cities**: Dwarf fortresses, trading posts

#### Swamp
- **Theme**: Murky wetlands, dangerous environment
- **Resources**: Poison ingredients, rare herbs
- **Monsters**: Crocodiles, snakes, dark creatures
- **Dungeons**: Witch huts, ancient ruins
- **Cities**: Small settlements, alchemist towers

#### Desert
- **Theme**: Sandy wastes, survival challenges
- **Resources**: Crystals, glass, rare minerals
- **Monsters**: Scorpions, mummies, djinn
- **Dungeons**: Pharaoh tombs, sand worm nests
- **Cities**: Oasis towns, trading caravans

#### Frozen Lands
- **Theme**: Icy wastelands, harsh conditions
- **Resources**: Ice ore, frozen materials
- **Monsters**: Ice elementals, frost creatures
- **Dungeons**: Ice caves, frozen fortresses
- **Cities**: Viking settlements, research outposts

#### Volcanic Wastes
- **Theme**: Fiery lands, extreme danger
- **Resources**: Obsidian, fire crystals
- **Monsters**: Fire elementals, demons
- **Dungeons**: Fire temples, lava caverns
- **Cities**: Black citadels, forge towns

#### Darklands
- **Theme**: Corrupted lands, endgame content
- **Resources**: Shadow essence, cursed materials
- **Monsters**: Shadow creatures, powerful demons
- **Dungeons**: Shadow fortresses, abyss portals
- **Cities**: Dark citadels, forbidden knowledge

### City Design
- **Services**: Vendors, crafters, quest givers, facilities
- **Economy**: Regional markets, speciality goods
- **Social**: Meeting points, guild halls, event spaces
- **Security**: Safe zones, guard protection
- **Progression**: Unlockable services, reputation systems

---

## 👥 Character Systems

### Character Creation

#### Race Selection
1. **Human**: Balanced stats, versatile
2. **Elf**: High intelligence, agile
3. **Dwarf**: High constitution, strong

#### Class Progression

##### Apprentice (Level 1-9)
- **Purpose**: Introduction to game mechanics
- **Skills**: Basic abilities from all classes
- **Stats**: Balanced attribute growth
- **Goal**: Prepare for class specialization

##### Base Classes (Level 10-29)
1. **Warrior**: Melee combat, high health
2. **Mage**: Magic damage, area effects
3. **Hunter**: Ranged combat, pet support
4. **Rogue**: Stealth, critical strikes
5. **Priest**: Healing, support magic
6. **Druid**: Nature magic, versatility

##### Advanced Classes (Level 30-49)

**Warrior Paths**:
- **Knight**: Defense, protection
- **Berserker**: Offense, damage

**Mage Paths**:
- **Wizard**: Elemental magic
- **Elementalist**: Specialized elements

**Hunter Paths**:
- **Ranger**: Marksmanship, tracking
- **Beast Master**: Pet specialization

**Rogue Paths**:
- **Assassin**: Stealth, burst damage
- **Ninja**: Speed, mobility

**Priest Paths**:
- **Cleric**: Healing, protection
- **Paladin**: Combat healing

**Druid Paths**:
- **Shaman**: Elemental spirits
- **Nature Guardian**: Shape-shifting

##### Master Classes (Level 50+)

**Knight Master Paths**:
- **Lord**: Leadership, group buffs
- **Guardian**: Ultimate defense
- **Champion**: Balanced combat
- **Warlord**: Battle tactics

**Wizard Master Paths**:
- **Archmage**: Ultimate power
- **Battle Mage**: Combat magic
- **Chronomancer**: Time manipulation
- **Necromancer**: Dark magic

*(Similar 4-path progression for each advanced class)*

### Attribute System

#### Primary Attributes
- **STR (Strength)**: Physical damage, carrying capacity
- **AGI (Agility)**: Attack speed, dodge chance
- **INT (Intelligence)**: Magic damage, mana pool
- **VIT (Vitality)**: Health, defense
- **DEX (Dexterity)**: Accuracy, critical chance
- **WIS (Wisdom)**: Mana regen, resistance

#### Attribute Points
- **Gain**: 3 points per level
- **Allocation**: Player choice
- **Respec**: Available for in-game currency
- **Caps**: No hard caps, diminishing returns

---

## ⚔️ Combat System

### Combat Philosophy
- **Position-Based**: Tactical positioning matters
- **Resource Management**: Mana and cooldowns
- **Skill Priority**: Intelligent ability usage
- **Team Coordination**: Group synergy important
- **Risk vs Reward**: Strategic decision-making

### Combat Mechanics

#### Auto-Targeting System
- **Target Selection**: Nearest hostile entity
- **Priority System**: Threat-based targeting
- **Manual Override**: Player can select targets
- **Switching**: Quick target changes

#### Attack System
- **Basic Attacks**: Automatic, resource-free
- **Skill Attacks**: Manual, resource-based
- **Critical Hits**: Chance-based bonus damage
- **Miss Chance**: Accuracy vs. evasion
- **Damage Types**: Physical, magical, elemental

#### Skill System
- **Cooldowns**: Ability-specific timers
- **Mana Costs**: Resource consumption
- **Range Requirements**: Positional gameplay
- **Area Effects**: Multi-target abilities
- **Status Effects**: Buffs and debuffs

#### Combat Flow
1. **Engagement**: Target acquisition
2. **Positioning**: Strategic movement
3. **Resource Management**: Mana and cooldowns
4. **Execution**: Ability usage
5. **Adaptation**: Response to enemy actions
6. **Resolution**: Victory or defeat

### Monster AI

#### AI States
1. **Idle**: Resting, waiting
2. **Patrol**: Movement patterns
3. **Aggro**: Target acquisition
4. **Attack**: Combat engagement
5. **Return**: Returning to spawn
6. **Dead**: Defeated state

#### AI Behaviors
- **Threat Calculation**: Damage-based threat
- **Ability Usage**: Strategic skill deployment
- **Group Coordination**: Monster teamwork
- **Environmental Awareness**: Terrain usage
- **Escape Behavior**: Retreat when overwhelmed

#### Monster Variants
- **Normal**: Standard stats and abilities
- **Elite**: Enhanced stats, additional abilities
- **Rare**: Significantly boosted, unique mechanics
- **Boss**: Complex encounters, multiple phases

---

## 📈 Progression Systems

### Experience System
- **Monster Kills**: Primary experience source
- **Quest Completion**: Bonus experience rewards
- **Discovery Rewards**: Exploration benefits
- **Group Bonuses**: Party experience sharing
- **Rest Bonuses**: Offline progression

### Level Progression
- **Experience Requirements**: Exponential growth
- **Level Benefits**: Stat points, skill points
- **Ability Unlocks**: New abilities at key levels
- **Class Advancement**: Tier-based progression
- **Master System**: Endgame specialization

### Skill Development
- **Skill Points**: Earned through leveling
- **Skill Trees**: Branching progression paths
- **Skill Mastery**: Repeated usage improvement
- **Combination System**: Skill synergy bonuses
- **Specialization**: Focused skill development

### Equipment Progression
- **Item Quality**: Rarity-based stats
- **Upgrade System**: Enhancement levels (+1 to +9)
- **Enchantment System**: Special effect additions
- **Set Bonuses**: Equipment set benefits
- **Customization**: Visual and stat modifications

---

## 💰 Economy & Crafting

### Economic Design
- **Player-Driven**: Supply and demand dynamics
- **Regional Variation**: Biome-specific resources
- **Transportation**: Logistics and trading
- **Market Taxation**: 5% transaction fee
- **Price Fluctuation**: Dynamic pricing

### Crafting Professions

#### Gathering Professions
- **Mining**: Ore and gem extraction
- **Herbalism**: Plant and material collection
- **Logging**: Wood and rare material gathering

#### Crafting Professions
- **Blacksmith**: Weapons and heavy armor
- **Armorer**: Defensive equipment
- **Alchemist**: Potions and consumables
- **Tailor**: Light armor and clothing
- **Carpenter**: Furniture and items
- **Jeweler**: Accessories and enhancements
- **Runemaster**: Magical enhancements

#### Crafting Mechanics
- **Recipe System**: Learnable combinations
- **Quality Levels**: Randomized outcomes
- **Material Requirements**: Resource management
- **Skill Progression**: Practice improves results
- **Specialization**: Focus on specific items

### Marketplace System
- **Regional Markets**: Location-based pricing
- **Global Auction House**: Cross-region trading
- **Player Shops**: Personal vending
- **Trade Contracts**: Long-term agreements
- **Market Analysis**: Price tracking tools

---

## 🌐 Social Features

### Communication Systems
- **Chat Channels**: Global, local, party, guild
- **Mail System**: Asynchronous messaging
- **Friend System**: Social networking
- **Ignore List**: Harassment prevention
- **Voice Chat**: Real-time communication

### Group Systems
- **Party Formation**: Temporary groups
- **Guild System**: Large organizations
- **Alliance System**: Guild coalitions
- **Group Activities**: Shared objectives
- **Leadership Roles**: Hierarchy management

### Social Activities
- **Community Events**: Server-wide activities
- **Competitions**: PvP tournaments
- **Collaborative Projects**: Community goals
- **Social Hubs**: Meeting locations
- **Player Housing**: Personal spaces

---

## 🏆 Endgame Content

### Raid System
- **Large Groups**: 20-40 players
- **Complex Mechanics**: Multi-phase encounters
- **Difficulty Tiers**: Progressive challenges
- **Loot Distribution**: Fair reward systems
- **Achievement Tracking**: Completion recognition

### PvP System
- **Arena Combat**: Structured matches
- **Open World PvP**: Territory control
- **Guild Wars**: Large-scale conflicts
- **Tournament System**: Competitive rankings
- **Seasonal Rewards**: Time-based benefits

### Progression Systems
- **Mythic Dungeons**: Extreme challenges
- **Master Classes**: Ultimate specializations
- **Legendary Equipment**: Best-in-slot items
- **Title System**: Prestige recognition
- **Leaderboards**: Competitive tracking

---

## 🔧 Technical Design

### Architecture
- **Client-Server**: Authoritative server model
- **Modular Design**: System separation
- **Event-Driven**: Loose coupling
- **Data-Driven**: Configuration-based
- **Scalable**: Performance optimization

### Performance
- **60 FPS Target**: Smooth gameplay
- **Entity Optimization**: Efficient rendering
- **Network Optimization**: Minimal latency
- **Memory Management**: Resource pooling
- **Load Balancing**: Server distribution

### Security
- **Cheat Prevention**: Server validation
- **Data Protection**: Secure communication
- **Account Security**: Authentication systems
- **Anti-Bot**: Automated detection
- **Fair Play**: Rule enforcement

---

## 🎯 Design Goals & Metrics

### Success Metrics
- **Player Retention**: 30-day retention > 40%
- **Session Duration**: Average 2+ hours
- **Social Engagement**: 80% in groups
- **Economic Activity**: Daily trades > 1000
- **Content Completion**: 70% reach max level

### Balance Philosophy
- **Accessibility**: Easy to start
- **Depth**: Complex to master
- **Fairness**: No pay-to-win
- **Community**: Social focus
- **Longevity**: Sustainable progression

### Future Expansion
- **Content Updates**: Regular additions
- **Feature Expansion**: System improvements
- **Community Input**: Player feedback
- **Technology Updates**: Platform evolution
- **Market Adaptation**: Industry trends

---

**Document Version**: 1.0
**Last Updated**: March 6, 2026
**Next Review**: End of Version 0.2 Development
**Design Team**: Core Development Team
