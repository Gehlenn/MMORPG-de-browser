# Phase 2 UI Specification: AI Visualization

**Date:** 2026-04-16  
**Phase:** 2 - AI Visualization System  

---

## Visual Design System

### State Colors
```css
--state-idle: #4CAF50;    /* Green */
--state-chase: #FF5252;   /* Red */
--state-attack: #FF9800;  /* Orange */
--state-flee: #2196F3;    /* Blue */
--state-patrol: #9C27B0;  /* Purple */
--state-dead: #757575;    /* Gray */
```

### Visual Elements

#### 1. Mob State Indicator
- **Shape:** Circle outline around mob
- **Size:** Mob width + 8px
- **Animation:** Pulse for chase/attack (1Hz)
- **Icon:** Emoji above mob (14px)

#### 2. Intent Arrow
- **Style:** Dashed white line
- **Pattern:** 5px dash, 5px gap
- **Arrowhead:** 10px at target
- **Opacity:** 40%

#### 3. Boss Phase Bar
- **Position:** Above boss nameplate
- **Height:** 6px
- **Colors:** Phase-specific (green→yellow→orange→red→purple)
- **Text:** "FASE X" centered below

---

## Layout Specifications

```
┌─────────────────────────────────────────┐
│  [😴] Mob Name          HP: 100/100    │  ← State icon + name
│    ◯                                   │  ← State outline
│  ─ ─ ─ ─ ─ →                           │  ← Intent arrow
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  👹 BOSS NAME          FASE 2         │
│  ████████████░░░░░░░░                   │  ← Phase bar
│  ⚠️ Próximo: Fireball                   │  ← Attack warning
│  💀 Fraco: Ice                          │  ← Weakness
└─────────────────────────────────────────┘
```

---

## Interaction Behaviors

| Action | Trigger | Visual Feedback |
|--------|---------|-----------------|
| Toggle debug | F9 key | Debug overlay appears |
| State change | Server event | Smooth color transition (200ms) |
| Intent update | 500ms interval | Arrow updates smoothly |
| Boss phase | Server event | Phase bar fills animation |

---

## Accessibility

- Color-blind friendly: Icons accompany colors
- High contrast: White text on dark backgrounds
- Screen reader: ARIA labels for AI states

---

## Responsive Behavior

- **Zoomed out:** Show only state icons
- **Normal view:** Show full visualization
- **Zoomed in:** Add debug info (if enabled)

---

## Performance Guidelines

- Max 50 mobs with visualization simultaneously
- Viewport culling: Only render visible entities
- LOD: Simplify at distance > 500px
- Throttle: Max 30 AI updates/second
