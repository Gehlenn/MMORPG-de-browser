# Phase 3: New Zones - Eldoria

**Project:** Legacy of Komodo MMORPG  
**Phase:** 3 of v0.5.0 World Expansion  
**Status:** ✅ COMPLETE  
**Date:** 2026-04-21  
**Test Coverage:** 100% (61/61 tests passing)  

## Goal
Implement Eldoria - The Central Kingdom, the first expansion zone for levels 20-40, bringing new mobs, a raid boss, and zone transition systems.

## Scope
This phase focuses ONLY on Eldoria. Aurélia will be Phase 4.

## Deliverables

### 1. Eldoria Zone System
**File:** `server/zones/EldoriaZone.js`

**Theme:** Medieval kingdom with castle architecture, forests, and mines  
**Level Range:** 20-40  
**Size:** 2000x1500 pixels (2x Verdantis)

**Sub-zones:**
- **Eldoria City** (safe zone, x: 1000, y: 750, radius: 200)
- **Royal Forest** (levels 20-25, peaceful wildlife + bandits)
- **Iron Mines** (levels 25-30, dungeon entrance)
- **Castle Grounds** (levels 30-35, elite mobs)
- **The Throne Room** (level 40 raid, King Eldor boss)

**Configuration:**
```javascript
{
  id: 'eldoria',
  name: 'Eldoria - The Central Kingdom',
  levelRange: { min: 20, max: 40 },
  size: { width: 2000, height: 1500 },
  safeZones: [
    { name: 'Eldoria City', x: 1000, y: 750, radius: 200 }
  ],
  spawnPoints: {
    newPlayers: { x: 1000, y: 750 },
    fromVerdantis: { x: 100, y: 750 } // East of Verdantis
  },
  resources: ['iron_ore', 'royal_wood', 'silk']
}
```

### 2. Zone Transition System
**File:** `server/zones/ZoneTransition.js`

**Features:**
- Portal at boundary between Verdantis and Eldoria
- Level requirement check (level 20 to enter Eldoria)
- Loading screen with zone art
- Position preservation when returning
- Safe zone entry (10s cooldown after combat)

**Portal Locations:**
- Verdantis → Eldoria: East boundary (x: 1200, y: 400) - "Eastern Gate"
- Eldoria → Verdantis: West boundary (x: 100, y: 750) - "Western Pass"

### 3. New Mobs (7 types)

#### Forest Deer
**File:** `server/mobs/eldoria/ForestDeer.js`
```javascript
{
  name: 'Forest Deer',
  level: 20,
  type: 'passive',
  hp: 80,
  damage: 0, // Doesn't attack
  behavior: 'flee',
  xpValue: 15,
  drops: ['venison', 'deer_hide'],
  abilities: ['flee_when_attacked']
}
```

#### Wild Boar
**File:** `server/mobs/eldoria/WildBoar.js`
```javascript
{
  name: 'Wild Boar',
  level: 22,
  type: 'neutral',
  hp: 120,
  damage: 15,
  behavior: 'charge',
  xpValue: 25,
  drops: ['boar_meat', 'tusk'],
  abilities: ['charge_attack', 'enrage_at_low_hp']
}
```

#### Bandit
**File:** `server/mobs/eldoria/Bandit.js`
```javascript
{
  name: 'Forest Bandit',
  level: 24,
  type: 'aggressive',
  hp: 150,
  damage: 20,
  behavior: 'hit_and_run',
  xpValue: 35,
  drops: ['stolen_goods', 'bandit_dagger', 'small_gold_pouch'],
  abilities: ['steal_gold', 'retreat_at_30hp', 'ambush_from_bushes']
}
```

#### Iron Golem
**File:** `server/mobs/eldoria/IronGolem.js`
```javascript
{
  name: 'Iron Golem',
  level: 28,
  type: 'aggressive',
  hp: 400,
  damage: 35,
  armor: 50, // High physical resistance
  behavior: 'slow_tank',
  xpValue: 60,
  drops: ['iron_ore', 'golem_core', 'broken_plate'],
  abilities: ['heavy_slam', 'armor_up', 'slow_movement']
}
```

#### Cave Troll
**File:** `server/mobs/eldoria/CaveTroll.js`
```javascript
{
  name: 'Cave Troll',
  level: 32,
  type: 'aggressive',
  hp: 500,
  damage: 45,
  behavior: 'regenerator',
  xpValue: 80,
  drops: ['troll_hide', 'cave_moss', 'regeneration_gland'],
  abilities: ['regenerate_5hp_per_sec', 'club_slam', 'roar_stun']
}
```

#### Royal Guard
**File:** `server/mobs/eldoria/RoyalGuard.js`
```javascript
{
  name: 'Royal Guard',
  level: 35,
  type: 'neutral',
  hp: 350,
  damage: 40,
  behavior: 'protector',
  xpValue: 70,
  drops: ['guard_insignia', 'steel_sword', 'guard_armor'],
  abilities: ['shield_bash', 'call_for_help', 'protect_nobles'],
  aggroIf: 'player_attacked_civilian'
}
```

#### Knight
**File:** `server/mobs/eldoria/Knight.js`
```javascript
{
  name: 'Knight of Eldoria',
  level: 38,
  type: 'aggressive',
  hp: 450,
  damage: 55,
  behavior: 'disciplined_warrior',
  xpValue: 100,
  drops: ['knight_badge', 'mithril_shard', 'noble_sword'],
  abilities: ['shield_bash', 'charge', 'sword_flurry', 'parry']
}
```

### 4. Boss: King Eldor
**File:** `server/bosses/KingEldor.js`

**Overview:**
- Level 40 Raid Boss
- Location: Throne Room (1600, 700)
- Required players: 3-5
- Respawn: 6 hours

**Phases:**

#### Phase 1 (100-70% HP) - "The King's Pride"
- Basic sword attacks
- Summon 2 Royal Guards every 30 seconds
- Shield bash with stun

#### Phase 2 (70-40% HP) - "Royal Decree"
- Increased attack speed
- Summon 4 Royal Guards
- AoE "Royal Command" (fear effect on players for 2s)
- Self-heal 5% HP every 20s

#### Phase 3 (40-10% HP) - "Desperate King"
- Summon 2 Knights + 4 Guards
- "Last Stand" buff (+50% damage, +30% defense)
- Cleave attack (hits all nearby players)

#### Phase 4 (10-0% HP) - "Final Breath"
- Unleash all remaining summons
- "Final Decree" - massive AoE damage
- Enrage timer: 5 minutes (wipes raid if not killed)

**Rewards:**
- King's Crown (legendary helmet)
- Royal Scepter (epic weapon)
- Gold: 500-1000g per participant
- Title: "Kingslayer"

### 5. World Map System
**File:** `client/ui/WorldMap.js`

**Features:**
- Press 'M' to toggle
- Show all 3 zones (Verdantis, Eldoria, locked Aurélia)
- Fog of war for undiscovered areas
- Player location marker
- Zone level ranges
- Portal locations marked
- Fast travel to discovered cities (costs gold)

**UI Elements:**
- Zone icons with hover info
- "Travel" button for discovered locations
- Close button (X or ESC)

### 6. Zone Loading Screen
**File:** `client/ui/ZoneLoadingScreen.js`

**Features:**
- Show zone name and level range
- Loading tips (e.g., "Bring potions for the Iron Mines")
- Estimated load time
- Zone artwork placeholder

## Database Schema

### zone_transitions table
```sql
CREATE TABLE zone_transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  from_zone TEXT NOT NULL,
  to_zone TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  position_x INTEGER,
  position_y INTEGER
);
```

### player_zone_progress table
```sql
CREATE TABLE player_zone_progress (
  player_id TEXT PRIMARY KEY,
  current_zone TEXT DEFAULT 'verdantis',
  discovered_zones TEXT DEFAULT 'verdantis', -- JSON array
  last_position TEXT, -- JSON {x, y, zone}
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Files to Create

### Server (8 files)
1. `server/zones/EldoriaZone.js` - Zone configuration and management
2. `server/zones/ZoneTransition.js` - Portal and transition logic
3. `server/mobs/eldoria/ForestDeer.js`
4. `server/mobs/eldoria/WildBoar.js`
5. `server/mobs/eldoria/Bandit.js`
6. `server/mobs/eldoria/IronGolem.js`
7. `server/mobs/eldoria/CaveTroll.js`
8. `server/bosses/KingEldor.js`

### Client (2 files)
9. `client/ui/WorldMap.js` - Map interface
10. `client/ui/ZoneLoadingScreen.js` - Loading overlay

### Assets (placeholders)
11. `assets/zones/eldoria_bg.png` - Zone art
12. `assets/ui/map_eldoria.png` - Map icon

### Tests (1 file)
13. `server/zones/__tests__/EldoriaZone.test.js`

## Files to Modify

### Server
- `server/server.js` - Register Eldoria zone, add zone transition handlers
- `server/systems/ZoneManager.js` - Add multi-zone support

### Client
- `client/index.html` - Add zone assets, map keybind (M)
- `client/GameplayEngine.js` - Zone-specific rendering
- `client/input/InputHandler.js` - 'M' for map, portal interaction

## Implementation Order

1. **Database & Schema** (30 min)
   - Create zone tables
   - Migration file

2. **EldoriaZone Core** (2h)
   - Zone configuration
   - Spawn points
   - Sub-zone definitions

3. **Zone Transition System** (2h)
   - Portal logic
   - Level requirements
   - Position saving/loading

4. **Mobs** (4h)
   - Forest Deer (30 min)
   - Wild Boar (30 min)
   - Bandit (45 min)
   - Iron Golem (45 min)
   - Cave Troll (45 min)
   - Royal Guard (45 min)
   - Knight (45 min)

5. **Boss: King Eldor** (3h)
   - Phase logic
   - Summon abilities
   - Loot table

6. **World Map UI** (2h)
   - Map rendering
   - Player marker
   - Zone fog of war

7. **Loading Screen** (1h)
   - Overlay
   - Zone art
   - Tips system

8. **Integration** (2h)
   - server.js wiring
   - Client integration
   - Testing

9. **Tests** (1.5h)
   - Unit tests for zone system
   - Boss encounter tests

**Total: ~18 hours** (focused scope vs original 30h for both zones)

## Success Criteria

- [ ] Can travel from Verdantis to Eldoria via portal
- [ ] Level 20+ required to enter Eldoria
- [ ] All 7 Eldoria mobs spawn and behave correctly
- [ ] King Eldor boss works with all 4 phases
- [ ] World map shows correct location in all zones
- [ ] Position saved when switching zones
- [ ] No memory leaks when switching zones
- [ ] Loading screen displays during transitions

## Dependencies

- ✅ Phase 1: Guild System (COMPLETE)
- ✅ Phase 2: Trading & Economy (COMPLETE - integrated)
- ZoneManager system (exists, needs multi-zone extension)
- Mob spawning system (exists)
- Boss system (exists, needs new boss)

## Notes

**Aurélia Deferred to Phase 4:**
- Will include: Giant Scorpion, Sand Worm, Mummy, Ancient Construct, Desert Bandit, Mercenary Captain
- Boss: Pharaoh Anub
- Zone: Desert theme with ruins

**Lore:**
"The Kingdom of Eldoria was founded 500 years ago by King Eldor I. It became the political center of Aethelgard after the fall of the ancient empire. The current ruler, King Eldor IV, maintains order through his elite Royal Guard. However, corruption festers within the castle walls, and bandits plague the outer forests."

## Testing Checklist

- [ ] Zone transition with level check
- [ ] Each mob type behavior verification
- [ ] Boss phase transitions
- [ ] World map toggle and display
- [ ] Position persistence
- [ ] Edge cases (combat during transition, etc.)

## Risk Mitigation

- **Risk:** Zone loading lag
  - **Mitigation:** Pre-load zone assets, lazy spawn mobs
  
- **Risk:** Boss too difficult/easy
  - **Mitigation:** Tuning parameters (hp, damage, spawn rates)
  
- **Risk:** Players get lost in large zone
  - **Mitigation:** World map with clear markers, portal indicators
