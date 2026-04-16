# Phase 6: New Zones - World Expansion

## Goal
Expand the game world with 2 new explorable regions: Eldoria (levels 20-40) and Aurélia (levels 40-60).

## Context from v0.4.0
- Current world: Verdantis (levels 1-20) only
- ZoneManager system exists and is functional
- 4 mob types implemented (Slime, Goblin, Wolf, Orc)
- Boss system with phases implemented
- Players need more content for mid-game progression

## Deliverables

### 1. Eldoria - The Central Kingdom
**Theme:** Medieval kingdom, political hub, castle architecture  
**Level Range:** 20-40  
**Size:** 2x larger than Verdantis

**Sub-zones:**
- **Eldoria City** (safe zone, NPC hub, bank, shops)
- **Royal Forest** (levels 20-25, deer, boars, bandits)
- **Iron Mines** (levels 25-30, golems, miners, cave trolls)
- **Castle Grounds** (levels 30-35, guards, knights, nobles)
- **The Throne Room** (level 40 raid, King Eldor boss)

**New Mobs:**
| Mob | Level | Type | Behavior |
|-----|-------|------|----------|
| Forest Deer | 20 | Passive | Flees when attacked |
| Wild Boar | 22 | Neutral | Charges when provoked |
| Bandit | 24 | Aggressive | Steals gold, runs at low HP |
| Iron Golem | 28 | Aggressive | High armor, slow |
| Cave Troll | 32 | Aggressive | Regenerates health |
| Royal Guard | 35 | Neutral | Attacks criminals |
| Knight | 38 | Aggressive | Uses shield bash |
| King Eldor | 40 | Boss | Multi-phase, summons guards |

**New Resources:**
- Iron Ore (mining nodes)
- Royal Wood (chopping trees)
- Silk (from rare spiders)

### 2. Aurélia - The Golden Desert
**Theme:** Desert, merchant hub, ancient ruins, sand dunes  
**Level Range:** 40-60  
**Size:** 1.5x Verdantis

**Sub-zones:**
- **Oasis City** (safe zone, auction house, bank, luxury vendors)
- **Shifting Sands** (levels 40-45, scorpions, sand worms)
- **Ruins of Zephyr** (levels 45-50, ancient constructs, mummies)
- **Merchant Caravan Routes** (levels 50-55, bandits, mercenaries)
- **The Sunken Pyramid** (level 60 raid, Pharaoh Anub boss)

**New Mobs:**
| Mob | Level | Type | Behavior |
|-----|-------|------|----------|
| Giant Scorpion | 42 | Aggressive | Poison attack, burrows |
| Sand Worm | 45 | Aggressive | Burrow ambush |
| Mummy | 48 | Aggressive | Curse debuff |
| Ancient Construct | 52 | Aggressive | Magic resistant |
| Desert Bandit | 55 | Aggressive | Uses ranged weapons |
| Mercenary Captain | 58 | Aggressive | Commands minions |
| Pharaoh Anub | 60 | Boss | Summons, curses, sandstorm |

**New Resources:**
- Gold Ore (rich deposits)
- Desert Herbs (alchemy)
- Ancient Relics (crafting)

### 3. Zone Transition System
**Location:** `server/zones/ZoneTransition.js`, `client/ui/ZoneTransitionUI.js`

**Features:**
- Portal/boundary crossing between zones
- Level requirement checks
- Loading screen with zone art
- Party member zone sync
- Safe zone cooldown (10s after combat)

### 4. World Map System
**Location:** `client/ui/WorldMap.js`

**Features:**
- Press 'M' to open world map
- Fog of war (undiscovered areas grayed)
- Zone level ranges displayed
- Player location marker
- Fast travel points (discovered cities)
- Zone completion tracking (% explored, % mobs killed)

## Zone Configuration

### Eldoria Config
```javascript
{
  id: 'eldoria',
  name: 'Eldoria - Central Kingdom',
  levelRange: { min: 20, max: 40 },
  size: { width: 2000, height: 1500 },
  safeZones: [
    { name: 'Eldoria City', x: 1000, y: 750, radius: 200 }
  ],
  dungeons: [
    { name: 'Iron Mines', x: 500, y: 300, level: 25 },
    { name: 'Castle Grounds', x: 1500, y: 600, level: 35 }
  ],
  boss: { name: 'King Eldor', x: 1600, y: 700, level: 40 },
  mobs: ['forest_deer', 'wild_boar', 'bandit', 'iron_golem', 'cave_troll', 'royal_guard', 'knight'],
  resources: ['iron_ore', 'royal_wood', 'silk']
}
```

### Aurélia Config
```javascript
{
  id: 'aurelia',
  name: 'Aurélia - Golden Desert',
  levelRange: { min: 40, max: 60 },
  size: { width: 1800, height: 1200 },
  safeZones: [
    { name: 'Oasis City', x: 900, y: 600, radius: 150 }
  ],
  dungeons: [
    { name: 'Ruins of Zephyr', x: 300, y: 400, level: 45 },
    { name: 'Caravan Routes', x: 1200, y: 800, level: 55 }
  ],
  boss: { name: 'Pharaoh Anub', x: 600, y: 900, level: 60 },
  mobs: ['giant_scorpion', 'sand_worm', 'mummy', 'ancient_construct', 'desert_bandit', 'mercenary_captain'],
  resources: ['gold_ore', 'desert_herb', 'ancient_relic']
}
```

## Art Assets Needed

### Tilesets
- [ ] Grass/castle tiles (Eldoria)
- [ ] Sand/ruin tiles (Aurélia)
- [ ] Transition tiles (grass → sand)

### Mob Sprites
- [ ] Forest Deer (16x16)
- [ ] Wild Boar (16x16)
- [ ] Bandit variants (16x16)
- [ ] Iron Golem (24x24)
- [ ] Cave Troll (24x24)
- [ ] Royal Guard/Knight (16x16)
- [ ] King Eldor boss (32x32)
- [ ] Desert mobs set (16x16 - 24x24)
- [ ] Pharaoh Anub (32x32)

### UI
- [ ] World map background
- [ ] Zone icons
- [ ] Portal animation
- [ ] Zone loading screens (2 images)

## Success Criteria

1. Players can travel between all 3 zones seamlessly
2. Each zone has unique mobs (no reuse from Verdantis)
3. Level-appropriate content for 20-60 range
4. Boss encounters are challenging but fair
5. World map is intuitive and helpful
6. Zone transitions load in < 3 seconds
7. No memory leaks when switching zones

## Dependencies
- Phase 5 complete (economy for vendors)
- ZoneManager system (exists, needs extension)
- Mob spawning system (exists)
- Boss system (exists, needs new bosses)

## Estimation
- Eldoria zone: 6 hours
- Aurélia zone: 6 hours
- New mob implementations: 4 hours
- Boss encounters (2): 4 hours
- Zone transition system: 3 hours
- World map UI: 3 hours
- Testing: 4 hours
- **Total: 30 hours**

## Files to Create/Modify

**New:**
1. `server/zones/EldoriaZone.js`
2. `server/zones/AureliaZone.js`
3. `server/zones/ZoneTransition.js`
4. `server/mobs/eldoria/ForestDeer.js`
5. `server/mobs/eldoria/WildBoar.js`
6. `server/mobs/eldoria/Bandit.js`
7. `server/mobs/eldoria/IronGolem.js`
8. `server/mobs/eldoria/CaveTroll.js`
9. `server/mobs/eldoria/RoyalGuard.js`
10. `server/mobs/eldoria/Knight.js`
11. `server/mobs/aurelia/GiantScorpion.js`
12. `server/mobs/aurelia/SandWorm.js`
13. `server/mobs/aurelia/Mummy.js`
14. `server/mobs/aurelia/AncientConstruct.js`
15. `server/mobs/aurelia/DesertBandit.js`
16. `server/mobs/aurelia/MercenaryCaptain.js`
17. `server/bosses/KingEldor.js`
18. `server/bosses/PharaohAnub.js`
19. `client/ui/WorldMap.js`
20. `client/ui/ZoneLoadingScreen.js`
21. `assets/tilesets/eldoria.png`
22. `assets/tilesets/aurelia.png`

**Modify:**
23. `server/systems/ZoneManager.js` - Add multi-zone support
24. `server/server.js` - Register new zones
25. `client/GameplayEngine.js` - Zone rendering
26. `client/input/InputHandler.js` - World map keybind
27. `client/index.html` - Add zone assets

## Risk Mitigation

- **Risk:** Zone loading lag
  - **Mitigation:** Lazy load mob assets, keep zone data in memory

- **Risk:** Players get lost
  - **Mitigation:** World map with clear markers, zone level indicators

- **Risk:** Empty zones (not enough players)
  - **Mitigation:** Dynamic mob spawning based on player count

## Verification Checklist
- [ ] Can travel from Verdantis to Eldoria to Aurélia
- [ ] All new mobs spawn and behave correctly
- [ ] Bosses work end-to-end
- [ ] World map shows correct location
- [ ] Zone level requirements enforced
- [ ] Fast travel works (if discovered)
- [ ] No performance degradation
- [ ] Mobile controls work in all zones

## Lore Integration

**Eldoria:**
"The Kingdom of Eldoria was founded 500 years ago by King Eldor I. It became the political center of Aethelgard after the fall of the ancient empire. The current ruler, King Eldor IV, maintains order through his elite Royal Guard. However, corruption festers within the castle walls, and bandits plague the outer forests."

**Aurélia:**
"Once a fertile river valley, Aurélia became a desert after the magical catastrophe of the Sundering. The survivors adapted, building Oasis City around the last magical spring. Ancient ruins dot the landscape, remnants of the pre-Sundering civilization. Treasure hunters and merchants now flock here seeking riches from the past."
