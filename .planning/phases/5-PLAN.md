# Phase 5: Trading & Economy System

## Goal
Implement player-to-player trading and marketplace system for the MMORPG economy.

## Context from v0.4.0
- Currency system exists (gold)
- Item system with rarity tiers
- Inventory management functional
- Players can drop/pick up items
- No player-to-player economy yet

## Deliverables

### 1. Direct Trading System
**Location:** `client/systems/TradingSystem.js`, `server/systems/TradingManager.js`

**Features:**
- Trade request/accept/decline flow
- Trade window UI (6 slots each side)
- Gold transfer in trades
- Trade confirmation with countdown
- Cancel trade anytime before confirmation

**Security:**
- Distance check (max 5 tiles)
- Anti-scam: items locked when confirmed
- Trade log for moderation

### 2. Auction House
**Location:** `server/systems/AuctionHouse.js`, `client/ui/AuctionHouseUI.js`

**Features:**
- List items for sale (24-72h duration)
- Bid system with minimum increments
- Buyout option
- Search and filter (category, level, rarity)
- Auction fee (5% of sale price)
- Mail system for expired/unsold items

**Database Schema:**
```javascript
{
  auctionId: string,
  sellerId: string,
  item: Item,
  startingBid: number,
  buyoutPrice: number | null,
  currentBid: number,
  highestBidder: string | null,
  createdAt: timestamp,
  expiresAt: timestamp,
  status: 'active' | 'sold' | 'expired' | 'cancelled'
}
```

### 3. Trade Chat Channel
**Location:** `server/chat/TradeChannel.js`

**Features:**
- Dedicated trade chat (/trade or #trade)
- WTB/WTS shorthand support
- Item linking in chat
- Price history lookup

### 4. Item Valuation System
**Location:** `server/economy/ItemValuation.js`

**Features:**
- Base price by item type and rarity
- Market-adjusted prices based on auction data
- Price history tracking (30 days)
- Suggested listing prices

## UI Components

### Trade Window
```
┌─────────────────────────────────┐
│  Trading with: PlayerName      │
├──────────────┬────────────────┤
│ Your Offer   │ Their Offer    │
│ [ ] [ ] [ ]  │ [ ] [ ] [ ]    │
│ [ ] [ ] [ ]  │ [ ] [ ] [ ]    │
├──────────────┼────────────────┤
│ Gold: [    ] │ Gold: [    ]   │
├──────────────┴────────────────┤
│ [  CONFIRM  ] [  CANCEL  ]    │
│ 3... 2... 1...               │
└─────────────────────────────────┘
```

### Auction House UI
- Browse tab with filters
- Sell tab (my listings)
- Bids tab (my active bids)
- History tab (completed transactions)

## Success Criteria

1. Players can trade items and gold directly
2. Auction house lists 100+ items without lag
3. Trade chat handles 50+ messages/minute
4. No item duplication exploits
5. Auction fees are correctly calculated
6. UI is responsive at all screen sizes

## Dependencies
- Phase 4 complete (AI system stable)
- Currency system (exists)
- Item system (exists)
- Mail system (to be built)

## Estimation
- Direct trading: 4 hours
- Auction house: 6 hours
- Trade chat: 2 hours
- Item valuation: 3 hours
- UI implementation: 4 hours
- Testing: 3 hours
- **Total: 22 hours**

## Files to Create/Modify

**New:**
1. `server/systems/TradingManager.js`
2. `server/systems/AuctionHouse.js`
3. `server/economy/ItemValuation.js`
4. `server/chat/TradeChannel.js`
5. `client/systems/TradingSystem.js`
6. `client/ui/TradeWindow.js`
7. `client/ui/AuctionHouseUI.js`
8. `shared/types/economy.js`

**Modify:**
9. `server/server.js` - Add economy systems
10. `client/GameplayEngine.js` - Integrate trading
11. `client/index.html` - Add trade UI CSS

## Risk Mitigation

- **Risk:** Trade scams (last-second item swap)
  - **Mitigation:** Lock items on confirmation, countdown timer

- **Risk:** Auction house spam
  - **Mitigation:** Listing limits per player, fees discourage junk

- **Risk:** Gold farming/exploits
  - **Mitigation:** Trade logs, rate limits, admin tools

## Verification Checklist
- [ ] Two players can complete a trade
- [ ] Auction house listing works end-to-end
- [ ] Bid system increments correctly
- [ ] Trade chat channels work
- [ ] No console errors during trading
- [ ] Mobile touch controls work for trading
