# Phase 4: New Zones - Aurélia

**Project:** Legacy of Komodo MMORPG  
**Phase:** 4 of v0.6.0 Desert Expansion  
**Status:** 🚀 PLANNED  
**Date:** 2026-04-20  

## Goal

Implement Aurélia - The Golden Desert, the second expansion zone for levels 40-60, bringing desert-themed mobs, ancient ruins, and the Pharaoh Anub raid boss.

## Scope

This phase focuses ONLY on Aurélia. Dracônia will be Phase 5.

## Lore

"Aurélia, o Deserto Dourado, é uma terra de contrastes extremos. De dia, o sol escaldante transforma as dunas em um forno; à noite, o frio cortante congela até os mais resistentes. 

Há 800 anos, este era o coração do Império do Sol, governado pelo poderoso Faraó Anub. Suas pirâmides tocavam o céu e seus templos brilhavam com ouro puro. Mas a ambição do faraó o levou a buscar a imortalidade através de magia proibida dos Construtores.

A maldição caiu sobre Aurélia. O império desmoronou em dias, soterrado pelas próprias dunas douradas. Agora, apenas ruínas permanecem - e os mortos que não descansam.

Os escaravelhos gigantes patrulham as dunas, vermes das areias devoram os desavisados, e os mortos-vivos guardam os tesouros do antigo império. Mas o maior perigo é o próprio Faraó Anub, que aguarda em sua tumba, nem vivo nem morto, protegendo o segredo da imortalidade."

## Deliverables

### 1. Aurélia Zone System
**File:** `server/zones/AureliaZone.js`

**Theme:** Ancient desert with golden dunes, ruins, and pyramids  
**Level Range:** 40-60  
**Size:** 2500x2000 pixels (larger than Eldoria)

**Sub-zones:**
- **Oásis de Shamara** (safe zone, x: 500, y: 1500, radius: 150) - única área segura
- **Dunas Douradas** (levels 40-45, scorpions and sand worms)
- **Ruínas de Ankhet** (levels 45-50, mummies and constructs)
- **Vale dos Ladrões** (levels 50-55, desert bandits and mercenaries)
- **Pirâmide de Anub** (level 60 raid, Pharaoh Anub boss)

**Configuration:**
```javascript
{
  id: 'aurelia',
  name: 'Aurélia - The Golden Desert',
  levelRange: { min: 40, max: 60 },
  size: { width: 2500, height: 2000 },
  safeZones: [
    { name: 'Oásis de Shamara', x: 500, y: 1500, radius: 150 }
  ],
  spawnPoints: {
    newPlayers: { x: 500, y: 1500 },
    fromEldoria: { x: 100, y: 1000 } // Portal from Eldoria
  },
  resources: ['desert_herbs', 'gold_nuggets', 'ancient_relics', 'sand_crystal'],
  environmentalEffects: {
    day: { heatDamage: 2, speedPenalty: 0.1 }, // 6AM to 6PM
    night: { coldDamage: 1, visionReduction: 0.3 } // 6PM to 6AM
  }
}
```

### 2. Zone Transition System
**File:** `server/zones/AureliaTransition.js`

**Features:**
- Portal from Eldoria to Aurélia (requires level 40)
- Heat/cold environmental damage system
- Sandstorm events (periodic visibility reduction)
- Position preservation when returning
- Oasis as only safe zone

**Portal Locations:**
- Eldoria → Aurélia: South boundary (x: 1000, y: 1400) - "Southern Desert Gate"
- Aurélia → Eldoria: North boundary (x: 100, y: 1000) - "Desert Pass"

### 3. New Mobs (6 types)

#### Giant Scorpion
**File:** `server/mobs/aurelia/GiantScorpion.js`
```javascript
{
  name: 'Giant Scorpion',
  level: 40,
  type: 'aggressive',
  hp: 600,
  damage: 45,
  behavior: 'ambush_predator',
  xpValue: 120,
  drops: ['scorpion_tail', 'chitin_plate', 'venom_sac'],
  abilities: ['burrow_attack', 'venom_sting', 'pincer_crush'],
  habitat: 'dunes',
  spawnTime: 'any'
}
```

#### Sand Worm
**File:** `server/mobs/aurelia/SandWorm.js`
```javascript
{
  name: 'Sand Worm',
  level: 42,
  type: 'aggressive',
  hp: 800,
  damage: 60,
  behavior: 'burrow_striker',
  xpValue: 150,
  drops: ['worm_tooth', 'digestive_acid', 'sand_gland'],
  abilities: ['underground_ambush', 'devour', 'sand_spray'],
  habitat: 'deep_dunes',
  spawnTime: 'any',
  special: 'Can sense vibrations - players running attract them'
}
```

#### Mummy
**File:** `server/mobs/aurelia/Mummy.js`
```javascript
{
  name: 'Cursed Mummy',
  level: 45,
  type: 'aggressive',
  hp: 550,
  damage: 50,
  behavior: 'slow_striker',
  xpValue: 140,
  drops: ['linen_wraps', 'ancient_coin', 'cursed_amulet'],
  abilities: ['bandage_bind', 'curse_of_decay', 'summon_scarab'],
  habitat: 'ruins',
  weakness: 'fire',
  resistance: 'physical'
}
```

#### Ancient Construct
**File:** `server/mobs/aurelia/AncientConstruct.js`
```javascript
{
  name: 'Ancient Construct',
  level: 48,
  type: 'neutral',
  hp: 1000,
  damage: 70,
  behavior: 'guardian',
  xpValue: 200,
  drops: ['construct_core', 'relic_shard', 'golden_gear'],
  abilities: ['energy_beam', 'shield_mode', 'self_repair'],
  habitat: 'temple_ruins',
  aggroIf: 'player_steals_treasure',
  special: 'Regenerates 1% HP every 5 seconds'
}
```

#### Desert Bandit
**File:** `server/mobs/aurelia/DesertBandit.js`
```javascript
{
  name: 'Desert Bandit',
  level: 52,
  type: 'aggressive',
  hp: 450,
  damage: 55,
  behavior: 'hit_and_run',
  xpValue: 160,
  drops: ['stolen_water', 'desert_dagger', 'bandit_mask'],
  abilities: ['sand_toss', 'quick_escape', 'ambush'],
  habitat: 'valley',
  spawnTime: 'day',
  special: 'Steals gold on hit'
}
```

#### Mercenary Captain
**File:** `server/mobs/aurelia/MercenaryCaptain.js`
```javascript
{
  name: 'Mercenary Captain',
  level: 55,
  type: 'aggressive',
  hp: 800,
  damage: 75,
  behavior: 'commander',
  xpValue: 250,
  drops: ['captain_insignia', 'master_sword', 'desert_armor'],
  abilities: ['command_bandits', 'sword_dance', 'inspire', 'retreat_call'],
  habitat: 'valley_camp',
  spawnTime: 'any',
  special: 'Summons 2-3 Desert Bandits when attacked'
}
```

### 4. Boss: Pharaoh Anub
**File:** `server/bosses/PharaohAnub.js`

**Overview:**
- Level 60 Raid Boss
- Location: Pyramid Chamber (2000, 500)
- Required players: 5-8
- Respawn: 8 hours
- Entrance: Requires "Key of the Sun" (drop from Ancient Constructs)

**Phases:**

#### Phase 1 (100-75% HP) - "The Eternal King"
- Scepter melee attacks (high damage)
- Summon 2 Mummies every 25 seconds
- "Curse of Aging" - reduces player max HP by 10% (stackable, lasts 30s)
- Teleport to corners of the room

#### Phase 2 (75-50% HP) - "Wrath of the Sun"
- "Solar Beam" - frontal AoE, high damage, must hide behind pillars
- Summon 4 Mummies + 1 Ancient Construct
- Room temperature rises - periodic heat damage to all players
- Ground sand becomes quicksand (slows movement)

#### Phase 3 (50-25% HP) - "Rise of the Dead"
- Summon 2 Mercenary Captains + 4 Mummies
- "Army of the Dead" - resurrects all slain mummies at 50% HP
- "Pharaoh's Decree" - fear effect on all players for 3s
- Anub becomes immune for 5s after each summon wave

#### Phase 4 (25-0% HP) - "Immortality's Price"
- "Final Curse" - all players take 2% max HP damage every 5 seconds
- Unleash all remaining summons
- "Soul Drain" - life steal 20% of damage dealt
- Enrage timer: 8 minutes
- Final ability at 5% HP: "Eternal Rest" - massive AoE, wipes raid if not interrupted by destroying 4 pillars

**Rewards:**
- Crown of the Sun (legendary helmet - fire resistance +50%)
- Scepter of Anub (epic weapon - can summon 1 mummy ally)
- Ankh of Immortality (trinket - once per hour, survive fatal blow with 1 HP)
- Gold: 1000-2000g per participant
- Title: "Sand Conqueror"
- Achievement: "Curse Breaker"

### 5. Environmental Systems
**File:** `server/zones/AureliaEnvironment.js`

**Day/Night Cycle:**
- Day (6:00 - 18:00): Heat damage every 10s, reduced stamina regeneration
- Night (18:00 - 6:00): Cold damage every 15s, reduced vision range
- Equipment: Desert Cloak (reduces heat/cold damage by 50%)

**Sandstorm Events:**
- Random events every 30-60 minutes
- Duration: 5-10 minutes
- Effects: -50% visibility, -30% movement speed, wind pushes players
- Can be predicted by NPCs at the Oasis

**Quicksand:**
- Hidden in certain areas of deep dunes
- Players sink slowly, must move quickly to escape
- Can be spotted by subtle texture differences

### 6. New Resources & Crafting
**File:** `server/crafting/AureliaRecipes.js`

**New Materials:**
- Desert Herbs: Health potions with heat resistance
- Gold Nuggets: High-value currency, tradeable
- Ancient Relics: Quest items, vendor for reputation
- Sand Crystal: Crafting material for desert gear
- Scorpion Venom: Weapon coating (poison damage)
- Chitin Plate: Armor crafting (high physical defense)

**New Recipes:**
- Desert Cloak: Reduces environmental damage
- Heat Resistance Potion: 1 hour immunity to heat
- Sand Walker Boots: No movement penalty on sand
- Scorpion Blade: Sword with poison proc
- Guardian Armor: High defense, reduces construct aggro

### 7. Zone Loading Screen
**File:** `client/ui/AureliaLoadingScreen.js`

**Features:**
- Desert pyramid artwork
- Loading tips:
  - "Stay near the Oásis de Shamara for safety"
  - "Sand Worms are attracted to fast movement"
  - "Fire magic deals extra damage to mummies"
  - "Night in the desert is as dangerous as day"
  - "Pharaoh Anub can only be challenged with the Key of the Sun"
- Day/night indicator showing current time in zone
- Temperature warning indicator

## Database Schema

### aurelia_zone_data table
```sql
CREATE TABLE aurelia_zone_data (
  player_id TEXT PRIMARY KEY,
  heat_resistance INTEGER DEFAULT 0,
  cold_resistance INTEGER DEFAULT 0,
  discovered_locations TEXT DEFAULT '[]', -- JSON array
  sandstorms_survived INTEGER DEFAULT 0,
  anub_attempts INTEGER DEFAULT 0,
  anub_kills INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### aurelia_transitions table
```sql
CREATE TABLE aurelia_transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  from_zone TEXT NOT NULL,
  to_zone TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  entry_type TEXT DEFAULT 'portal', -- 'portal', 'recall', 'death'
  position_x INTEGER,
  position_y INTEGER
);
```

### sandstorm_events table (server-side tracking)
```sql
CREATE TABLE sandstorm_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_seconds INTEGER DEFAULT 300,
  intensity TEXT DEFAULT 'moderate', -- 'light', 'moderate', 'severe'
  affected_players INTEGER DEFAULT 0
);
```

## Files to Create

### Server (10 files)
1. `server/zones/AureliaZone.js` - Zone configuration
2. `server/zones/AureliaTransition.js` - Portal and transition
3. `server/zones/AureliaEnvironment.js` - Day/night, sandstorms
4. `server/mobs/aurelia/GiantScorpion.js`
5. `server/mobs/aurelia/SandWorm.js`
6. `server/mobs/aurelia/Mummy.js`
7. `server/mobs/aurelia/AncientConstruct.js`
8. `server/mobs/aurelia/DesertBandit.js`
9. `server/mobs/aurelia/MercenaryCaptain.js`
10. `server/bosses/PharaohAnub.js`

### Client (3 files)
11. `client/ui/AureliaLoadingScreen.js`
12. `client/ui/WorldMapAurelia.js` - Map overlay for desert
13. `client/environment/AureliaEffects.js` - Heat shimmer, sand particles

### Assets (placeholders)
14. `assets/zones/aurelia_bg.png`
15. `assets/zones/aurelia_night_bg.png`
16. `assets/ui/map_aurelia.png`
17. `assets/effects/sandstorm_overlay.png`

### Tests (1 file)
18. `server/zones/__tests__/AureliaZone.test.js`

### Crafting (1 file)
19. `server/crafting/AureliaRecipes.js`

## Files to Modify

### Server
- `server/server.js` - Register Aurélia zone, add handlers
- `server/systems/ZoneManager.js` - Add Aurélia to multi-zone
- `server/world/spawnSystem.js` - Add desert mob spawners
- `server/ai/AIMobController.js` - Add desert behaviors

### Client
- `client/index.html` - Add desert assets
- `client/ui/WorldMap.js` - Add Aurélia to world map
- `client/GameplayEngine.js` - Environmental effects
- `client/Character.js` - Heat/cold resistance stats

## Implementation Order

1. **Database & Schema** (30 min)
   - Create migration files
   - Zone tables

2. **AureliaZone Core** (2h)
   - Zone configuration
   - Spawn points
   - Sub-zone definitions
   - Environmental data

3. **Environment System** (2h)
   - Day/night cycle
   - Heat/cold damage
   - Sandstorm events
   - Quicksand mechanics

4. **Zone Transition** (1h)
   - Portal from Eldoria
   - Level 40 requirement

5. **Mobs** (5h)
   - Giant Scorpion (45 min)
   - Sand Worm (60 min) - complex burrow mechanics
   - Mummy (45 min)
   - Ancient Construct (60 min) - regeneration
   - Desert Bandit (45 min)
   - Mercenary Captain (60 min) - summon ability

6. **Boss: Pharaoh Anub** (4h)
   - 4-phase mechanics
   - Curse system
   - Pillar destruction mechanic
   - Life steal and enrage

7. **Crafting System** (2h)
   - New recipes
   - Desert gear
   - Potions

8. **Client Effects** (2h)
   - Loading screen
   - World map
   - Environmental visuals
   - Sandstorm overlay

9. **Integration** (2h)
   - server.js wiring
   - Zone manager integration
   - AI behavior wiring

10. **Tests** (1.5h)
    - Zone system tests
    - Boss encounter tests
    - Environment tests

**Total: ~22 hours**

## Success Criteria

- [ ] Can travel from Eldoria to Aurélia via portal
- [ ] Level 40+ required to enter Aurélia
- [ ] All 6 Aurélia mobs spawn and behave correctly
- [ ] Pharaoh Anub boss works with all 4 phases
- [ ] Day/night cycle affects gameplay
- [ ] Sandstorms occur and affect visibility/movement
- [ ] Heat/cold environmental damage works
- [ ] World map shows Aurélia with fog of war
- [ ] Position saved when switching zones
- [ ] No memory leaks when switching zones
- [ ] Loading screen displays with desert theme
- [ ] New crafting recipes work

## Dependencies

- ✅ Phase 1: Guild System (COMPLETE)
- ✅ Phase 2: Trading & Economy (COMPLETE)
- ✅ Phase 3: Eldoria (COMPLETE)
- ZoneManager system (exists, needs Aurélia extension)
- Mob spawning system (exists)
- Boss system (exists, needs new boss)
- Day/night system (needs implementation)

## Notes

**Aurélia Design Principles:**
1. **Contrast**: Aurélia is the opposite of verdant Eldoria - harsh, dry, deadly
2. **Resource Scarcity**: Water is valuable, players must plan ahead
3. **Time Matters**: Day and night require different strategies
4. **Risk vs Reward**: Ancient treasures guarded by powerful constructs

**Dracônia Preview (Phase 5):**
- Dragon-themed zone (levels 60-80)
- Mountain terrain with flying mechanics
- Dragon boss: Ancient Wyrm
- Elemental challenges (fire, ice, storm)

**Connection to Lore:**
The discovery of Aurélia reveals more about the ancient empire that fell before Komodo's time. The curse that destroyed this civilization may be connected to the same dark forces threatening Aethelgard now.

## Testing Checklist

- [ ] Zone transition with level 40 check
- [ ] Each mob type behavior verification
- [ ] Sand Worm burrow mechanics
- [ ] Ancient Construct regeneration
- [ ] Mercenary Captain bandit summoning
- [ ] Day/night environmental damage
- [ ] Sandstorm visual effects
- [ ] Boss phase transitions
- [ ] Pillar destruction mechanic
- [ ] Curse system functionality
- [ ] World map fog of war for desert
- [ ] Position persistence
- [ ] Edge cases (combat during sandstorm, etc.)

## Risk Mitigation

- **Risk:** Day/night cycle annoying for players
  - **Mitigation:** Make cycle slower (2 hours real-time = 24 hours game-time), potions available

- **Risk:** Sandstorms too frequent/disruptive
  - **Mitigation:** Predictable warning system, shelter locations, player-toggle option

- **Risk:** Boss too difficult with environmental damage
  - **Mitigation:** Environmental effects paused during boss fight, or boss room is climate-controlled

- **Risk:** Burrow mechanics confusing
  - **Mitigation:** Clear visual indicators, tutorial NPC at entrance

- **Risk:** Getting lost in desert
  - **Mitigation:** Always-visible Oasis marker, compass points to nearest safe zone
