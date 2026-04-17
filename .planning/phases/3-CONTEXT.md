# Phase 3 Context: Player-AI Interaction

**Date:** 2026-04-16  
**Phase:** 3 - Player-AI Interaction  
**Milestone:** v0.4.0 Client-Side AI Integration  
**Status:** IN PROGRESS

---

## Current State

After Phase 2:
- ✅ Server broadcasts AI state changes
- ✅ Client visualizes AI states and boss phases
- ✅ Network events flow bidirectionally
- ✅ F9 debug toggle available

Now need to enable player actions to affect AI behavior and provide tactical feedback.

---

## Goals

Enable players to:
1. See AI reactions to their actions in real-time
2. Understand AI threat/aggro levels
3. Receive tactical feedback during combat
4. Influence AI behavior through abilities

---

## Technical Context

### Existing Systems
- `AIMobController` manages mob behavior
- `ClientAIController` visualizes AI states
- `GameplayEngine` handles player input and combat
- Network events: `ai:state_update`, `ai:decision`, `ai:boss_phase_change`

### Data Flow Needed
```
Player Action → Server Processing → AI Reaction → Broadcast → Client Update
```

---

## Requirements

### 1. AI Reaction System
- AI responds to player abilities
- Taunt effects force target change
- Healing generates threat
- Damage generates aggro

### 2. Aggro Management
- Visual aggro indicators
- Threat table updates
- Target switching logic

### 3. Tactical Feedback
- Real-time combat tips
- AI weakness notifications
- Ability effectiveness feedback

### 4. Player Influence
- Abilities that modify AI behavior
- Fear, stun, charm effects
- Position-based tactics

---

## UI/UX Requirements

1. **Aggro Indicator:** Show when player has aggro
2. **Threat Meter:** Visual representation of threat level
3. **Tactical Alerts:** Pop-up tips during combat
4. **Reaction Feedback:** See AI respond to player actions

---

## Performance Considerations

- Throttle threat updates (100ms minimum)
- Batch tactical feedback messages
- Client-side prediction for UI responsiveness

---

## Integration Points

1. **Combat System:** Hook into damage/healing events
2. **Ability System:** Process crowd control effects
3. **Network Manager:** Send aggro updates
4. **UI Layer:** Show threat and feedback

---

## Success Criteria

- [ ] AI visibly reacts to player taunts
- [ ] Threat meter shows accurate levels
- [ ] Tactical tips appear contextually
- [ ] Client receives aggro updates in < 50ms
