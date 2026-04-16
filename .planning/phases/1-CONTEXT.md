# Phase 1 Context: Client-Side AI Controller

## Research: Existing AI Systems

### Server-Side AI (v0.3.7v - COMPLETE)

**AIMobController.js**
- Location: `server/ai/AIMobController.js`
- Handles 4 mob types: Goblin, Lobo, Orc, Slime
- States: idle → chase → attack → flee → dead
- Decisions made server-side every 500ms
- Currently sends: position updates only

**Key Server Events:**
```javascript
// Currently broadcasted
socket.emit('mobUpdate', { id, x, y, hp });

// NOT broadcasted (Phase 1 will add)
// mob.state, mob.targetId, mob.intent
```

**AIBossController.js**
- Tactical phases: defensive → aggressive → enraged
- Special attack patterns
- Adaptive difficulty based on player performance

### Client-Side Architecture

**NetworkManager.js** (current)
- Receives: `mobUpdate`, `playerUpdate`, `combatEvent`
- Does NOT receive AI state data

**GameplayEngine.js**
- Render loop at 60 FPS
- Calls: `renderMobs()`, `renderPlayers()`
- Needs: AI overlay render call

**SimpleCombat.js**
- Shows damage numbers
- Could show: AI attack warnings

### Technical Constraints

**Performance:**
- 60 FPS minimum
- 10+ mobs visible simultaneously
- Mobile browser support required

**Network:**
- WebSocket latency: ~50ms average
- AI state updates: Can batch every 250ms

**Visual Style:**
- Existing: Clean retro RPG style
- New: Subtle indicators, not clutter

## Similar Implementations (Reference)

**World of Warcraft:**
- Enemy cast bars (showing incoming attacks)
- Aggro radius indicators (debug mode)
- Boss mod addons (predictive warnings)

**Path of Exile:**
- Enemy aura effects
- Telegraphing for boss attacks

**Hades (Rogue-like):**
- Enemy attack previews
- Minimalist but clear

## Decision: What to Visualize

**Must Have (Phase 1):**
1. Mob state (idle/chase/attack/flee) - color coding
2. Boss phase indicator
3. Basic debug toggle (F9)

**Nice to Have (Future Phase):**
1. Path visualization
2. Decision tree display
3. Aggro range circles

## Files to Study

1. `server/ai/AIMobController.js` - Understand states
2. `server/server.js` - Where to add broadcasts
3. `client/engine/GameplayEngine.js` - Render integration point
4. `client/modes/online/NetworkManager.js` - Event routing

## Unknowns

1. How much state data is currently calculated but not stored?
2. What's the impact of adding AI state to socket broadcasts?
3. How to handle AI state sync when player re-enters viewport?

## Research Tasks

- [x] Read AIMobController.js implementation
- [x] Check current socket.io payload sizes
- [x] Identify optimal broadcast frequency
- [x] Review canvas performance profiling
