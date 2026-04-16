# Phase 1: Client-Side AI Controller

## Goal
Implement client-side AI visualization and control system that connects to the server-side AI (AIMobController, AIBossController) and provides real-time visual feedback of AI behaviors to players.

## Context from v0.3.7v
The server now has fully implemented AI systems:
- **AIMobController**: Advanced mob behaviors with states (idle, chase, attack, flee)
- **PathfindingSystem**: A* algorithm with optimization
- **AIBossController**: Tactical boss AI with adaptive difficulty
- **DecisionTree**: Contextual decision making
- **EventReactions**: Event-driven AI responses

Current gap: Client only receives position updates but doesn't visualize AI state, intentions, or behaviors.

## Deliverables

### 1. ClientAIController Class
**Location:** `client/ai/ClientAIController.js`

**Responsibilities:**
- Receive AI state updates from server (not just positions)
- Maintain local AI state visualization
- Coordinate with existing GameplayEngine

**Key Methods:**
```javascript
class ClientAIController {
  constructor(socket, renderer) {
    this.socket = socket;
    this.renderer = renderer;
    this.aiEntities = new Map(); // mobId -> AIState
  }
  
  onAIStateUpdate(data) {
    // Process server AI state broadcast
  }
  
  visualizeAIIntent(entityId, intent) {
    // Draw intent indicators (arrows, circles, colors)
  }
  
  renderAIOverlay(ctx) {
    // Called each frame by GameplayEngine
  }
}
```

### 2. AI State Protocol Extension
**Server-side:** Extend `server/server.js` to broadcast AI states

**New Events:**
- `ai:state_update` - Broadcast mob AI states
- `ai:boss_phase_change` - Boss phase transitions
- `ai:decision` - Decision tree choices

**Payload Example:**
```javascript
{
  mobId: "mob_123",
  state: "chase", // idle, chase, attack, flee
  targetId: "player_456",
  intent: {
    type: "move_to",
    target: { x: 100, y: 200 },
    path: [{x: 50, y: 100}, {x: 75, y: 150}]
  },
  confidence: 0.85 // AI certainty score
}
```

### 3. Visualization Components

**AI Intent Indicators:**
- Movement arrows showing path
- State-based color coding:
  - 🟢 Idle: Green outline
  - 🔴 Chase: Red pulsing outline
  - ⚔️ Attack: Orange + weapon icon
  - 💨 Flee: Blue dashed outline

**Boss UI Overlay:**
- Phase indicator bar
- Next attack prediction
- Weakness indicator

**Debug Overlay (toggleable):**
- Decision tree path display
- Pathfinding grid visualization
- Aggro range circles

### 4. Integration Points

**NetworkManager.js:**
- Add handlers for AI state events
- Route to ClientAIController

**GameplayEngine:**
- Call `clientAIController.renderAIOverlay(ctx)` in render loop
- Provide access to canvas context

**SimpleCombat.js (client):**
- Show AI attack warnings based on prediction
- Visual telegraphing of boss attacks

## Success Criteria

1. Players can see mob AI states visually
2. Boss phases are clearly indicated
3. AI movement intentions are previewed
4. No performance degradation (>60 FPS maintained)
5. Works with existing 4 mob types (Goblin, Lobo, Orc, Slime)

## Dependencies
- Server AI systems (already implemented)
- Socket.io connection (already active)
- Canvas rendering system (GameplayEngine)

## Estimation
- Research/Design: 1 hour
- Implementation: 3 hours
- Testing/Integration: 1 hour
- **Total: 5 hours**

## Files to Modify
1. `client/ai/ClientAIController.js` - NEW
2. `server/server.js` - Add AI broadcast events
3. `client/modes/online/NetworkManager.js` - Add handlers
4. `client/engine/GameplayEngine.js` - Integration point
5. `client/ui/AIOverlayRenderer.js` - NEW (visualization)

## Risk Mitigation
- **Risk:** Performance impact of visualizing all AI
  - **Mitigation:** Only visualize AI within viewport + buffer
- **Risk:** Information overload for players
  - **Mitigation:** Toggleable debug mode, subtle indicators by default

## Verification Checklist
- [ ] AI states received from server
- [ ] Mobs show correct state colors
- [ ] Boss shows phase indicator
- [ ] No console errors
- [ ] 60 FPS maintained with 10+ mobs visible
- [ ] Toggle key (F9) shows/hides debug overlay
