# MMORPG Knowledge Graph - v0.5.0

## Overview
- **Total Nodes:** ~8,600
- **Total Edges:** ~14,600
- **Communities:** 358
- **Source:** client/ + server/ + tests/

## Top 15 Communities (by size)

| Community | Size | Sample Nodes |
|-----------|------|--------------|
| 0 | 200+ | gameplayengine, integratedgameplayengine, acceptquestfromhud |
| 1 | 150+ | guildmanager, guilddatabase, createguild |
| 2 | 140+ | aimobcontroller, aibosscontroller, pathfindingsystem |
| 3 | 130+ | spawnmanager, zonemanager, bossmanager |
| 4 | 120+ | integratedhud, characterui, questtrackerui |
| 5 | 110+ | simpleloginmanager, localdatamanager, accountcreation |
| 6 | 100+ | integratedmap, maptransitions, zonetriggers |
| 7 | 90+ | npchandler, merchantnpc, guardnpc |
| 8 | 80+ | inventorysystem, bagsystem, equipment |
| 9 | 75+ | combatsystem, attacksystem, skills |
| 10 | 70+ | websocketserver, connectionhandler, messagehandler |
| 11 | 65+ | eventmanager, dynamicevents, worldevents |
| 12 | 60+ | audioengine, soundeffects, backgroundmusic |
| 13 | 55+ | spritesheetmanager, spriteloader, animation |
| 14 | 50+ | talentsystem, skilltree, abilities |

## Key Systems Architecture

### Client Core
- IntegratedGameplayEngine - Main game loop
- SimpleLoginManager - Authentication
- IntegratedAssetManager - Asset loading
- IntegratedHUD - User interface
- IntegratedMap - World rendering
- NPCManager - Entity management

### Server Core
- GuildSystem - Guilds/Parties (SQLite)
- AIMobController - Mob AI
- AIBossController - Boss AI  
- SpawnManager - Entity spawning
- EventManager - Dynamic events
- PathfindingSystem - A* navigation

### World Systems
- Continent Maps (10 zones: Starter Plains, Oakheart Forest, etc.)
- Rare Mob System (0.1% spawn chance)
- Mini-Boss System (2h respawn)
- Dungeon Maps (solo/team)

## Files Generated
- `graph.json` - Raw graph data (obsidian-vault/Projects/MMORPG/)
- `GRAPH_REPORT.md` - This report

## Usage
Query the graph with Claude skills:
```
/graphify query "gameplay engine"
/graphify path "SimpleLoginManager" "IntegratedGameplayEngine"
```

---
Generated: 2026-04-23
Version: v0.5.0
