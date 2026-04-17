# Phase 3 Plan: Player-AI Interaction

**Phase:** 3  
**Estimated Time:** 2-3 hours  
**Priority:** High

---

## Task 1: Aggro System Enhancement (60 min)

### server/ai/AggroSystem.js
**Action:** Enhance existing aggro system with broadcasting

**Implementation:**
```javascript
// Add to existing aggro system
- Broadcast aggro updates to clients
- Add threat level calculation
- Implement taunt handling
```

**Key Features:**
- `broadcastAggroUpdate(mobId, threatTable)`
- `handleTaunt(mobId, playerId)` - Force target switch
- `calculateThreatLevel(playerId, mobId)` - Get visual threat indicator

---

## Task 2: AI Reaction Handler (45 min)

### server/ai/AIReactionHandler.js
**Action:** Create new handler for player action reactions

**Implementation:**
- Hook into combat events
- Process crowd control (fear, stun, charm)
- Broadcast AI reaction events

**Methods:**
- `onPlayerAbility(playerId, targetId, ability)`
- `onPlayerDamage(playerId, targetId, damage)`
- `onPlayerHeal(playerId, targetId, amount)`
- `broadcastReaction(mobId, reactionType, data)`

---

## Task 3: Client Aggro Display (45 min)

### client/ui/AggroDisplay.js
**Action:** Create aggro indicator component

**Features:**
- Threat meter (0-100%)
- Aggro indicator (red border when targeted)
- Threat list (who has aggro)

**Methods:**
- `showAggroIndicator(mobId)`
- `updateThreatMeter(percentage)`
- `hideAggroIndicator()`

---

## Task 4: Tactical Feedback System (45 min)

### client/ui/TacticalFeedback.js
**Action:** Create contextual combat tips

**Features:**
- Real-time tips based on combat state
- AI weakness notifications
- Ability effectiveness feedback
- Boss mechanic warnings

**Events:**
- `tactical:weakness_exposed`
- `tactical:mechanic_warning`
- `tactical:ability_effective`
- `tactical:target_switch`

---

## Task 5: Network Events (30 min)

### client/network-events.js & server
**Action:** Add player-AI interaction events

**New Events:**
- `ai:aggro_update` - Threat table changes
- `ai:reaction` - AI reacts to player action
- `ai:taunt` - Taunt successful
- `tactical:tip` - Contextual tip

---

## Task 6: Integration (30 min)

### client/engine/GameEngine.js
- Hook aggro display into render loop
- Connect tactical feedback to combat events

### client/ai/ClientAIController.js
- Handle new reaction events
- Update aggro indicators

---

## Testing Checklist

- [ ] Taunt forces AI target switch
- [ ] Aggro indicator shows when targeted
- [ ] Threat meter updates correctly
- [ ] Tactical tips appear in context
- [ ] CC effects show visual feedback
