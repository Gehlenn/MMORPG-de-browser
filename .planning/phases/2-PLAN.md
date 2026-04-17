# Phase 2 Plan: AI Visualization System

**Date:** 2026-04-16  
**Phase:** 2 - AI Visualization System  
**Estimated Time:** 3 hours

---

## Implementation Tasks

### Task 2.1: Server Broadcast Integration
**Priority:** High  
**Time:** 1.5h  

Add Socket.io event emitters to server AI systems:

1. **AIMobController.js**
   - Emit `ai:state_update` when mob state changes
   - Emit `ai:decision` for major AI decisions
   - Throttle: Max 10 updates/second per mob

2. **AIBossController.js**
   - Emit `ai:boss_phase_change` on phase transition
   - Include: phase, nextAttack, weakness, mechanics

3. **server.js Integration**
   - Broadcast AI state on `world_init`
   - Set up periodic AI state sync (every 500ms)

---

### Task 2.2: Network Manager Updates
**Priority:** High  
**Time:** 0.5h  

Update `NetworkManager` to handle new AI events:

```javascript
// Add event constants
NET_EVENTS.AI_STATE_UPDATE = 'ai:state_update';
NET_EVENTS.AI_BOSS_PHASE = 'ai:boss_phase_change';

// Register handlers in ClientAIController
```

---

### Task 2.3: GameplayEngine Integration
**Priority:** Medium  
**Time:** 0.5h  

Integrate AI controller into gameplay loop:

1. Initialize `ClientAIController` in `GameplayEngine`
2. Call `renderAIOverlay(ctx)` in render loop
3. Add F9 key binding for debug toggle

---

### Task 2.4: Testing & Validation
**Priority:** Medium  
**Time:** 0.5h  

Test scenarios:
- [ ] 50 mobs visible simultaneously
- [ ] Boss fight with phase changes
- [ ] Network throttling (3G simulation)
- [ ] Debug mode toggle

---

## File Changes

| File | Action | Lines |
|------|--------|-------|
| `server/ai/AIMobController.js` | Add emitters | +30 |
| `server/ai/AIBossController.js` | Add phase events | +20 |
| `server/server.js` | Broadcast setup | +40 |
| `client/NetworkManager.js` | Event constants | +5 |
| `client/engine/GameplayEngine.js` | AI integration | +25 |

---

## Dependencies

- Phase 1: ✅ `ClientAIController.js` complete
- Network: ✅ `NetworkManager.js` ready
- Canvas: ✅ Rendering system in place

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Network overload | Throttle to 10 updates/sec |
| FPS drops | Viewport culling, LOD |
| Out of sync | Periodic full sync every 500ms |

---

## Success Metrics

- ✅ All 4 mob types show correct states
- ✅ Boss phase changes trigger visual updates
- ✅ FPS stays > 60 with 50 visible mobs
- ✅ Network usage < 5 KB/s

---

## Rollback Plan

If performance issues occur:
1. Disable intent arrows
2. Reduce update frequency to 1/sec
3. Disable state animations
