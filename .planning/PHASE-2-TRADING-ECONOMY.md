# Phase 2: Trading & Economy System

**Project:** Legacy of Komodo MMORPG  
**Phase:** 2 of v0.5.0 World Expansion  
**Estimate:** 22 hours  
**Status:** 🚀 READY TO START

## Overview

Implement comprehensive trading and economy systems to enable player commerce, item valuation, and market dynamics. This phase builds upon the Guild System to create a vibrant in-game economy.

## Scope

### 1. Direct Player-to-Player Trading (6h)
**Priority:** HIGH

#### Features
- Trade request system (right-click player → "Request Trade")
- Trade window UI with drag-and-drop slots
- Gold and item exchange in same trade
- Trade confirmation with both parties
- Trade cancellation at any time
- Trade completion with item/gold transfer

#### Database Schema
```sql
-- Trade sessions
CREATE TABLE trade_sessions (
    id TEXT PRIMARY KEY,
    player1_id TEXT NOT NULL,
    player2_id TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, ACTIVE, COMPLETED, CANCELLED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (player1_id) REFERENCES players(id),
    FOREIGN KEY (player2_id) REFERENCES players(id)
);

-- Trade items
CREATE TABLE trade_items (
    id TEXT PRIMARY KEY,
    trade_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    item_id TEXT,
    item_data TEXT, -- JSON item data
    gold_amount INTEGER DEFAULT 0,
    slot_index INTEGER,
    FOREIGN KEY (trade_id) REFERENCES trade_sessions(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);
```

#### Server Components
- `TradeManager.js` - Core trade logic
- `TradeHandler.js` - Socket event handlers
- Trade validation and security checks

#### Client Components
- `TradeWindow.js` - Trade UI component
- `TradeRequestModal.js` - Request/accept modal
- Trade slot drag-and-drop system

#### Network Events
```javascript
// Trade requests
trade:request → trade:request_received
trade:accept → trade:session_started
trade:decline → (notification only)

// Trade session
trade:add_item → trade:item_added
trade:remove_item → trade:item_removed
trade:add_gold → trade:gold_updated
trade:confirm → trade:player_confirmed
trade:complete → trade:completed
trade:cancel → trade:cancelled
```

### 2. Auction House System (10h)
**Priority:** HIGH

#### Features
- Browse all auctions with filters
- Create auction (item + starting price + duration)
- Bid on auctions
- Buyout option (instant purchase)
- Auction expiration and auto-return
- Auction fees (5% of sale price)
- Search by item name, level, rarity
- Sort by price, time remaining, bids

#### Database Schema
```sql
-- Auctions
CREATE TABLE auctions (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_data TEXT NOT NULL, -- Full item JSON
    starting_price INTEGER NOT NULL,
    buyout_price INTEGER,
    current_bid INTEGER,
    highest_bidder_id TEXT,
    bids_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, SOLD, EXPIRED, CANCELLED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (seller_id) REFERENCES players(id)
);

-- Bid history
CREATE TABLE auction_bids (
    id TEXT PRIMARY KEY,
    auction_id TEXT NOT NULL,
    bidder_id TEXT NOT NULL,
    bid_amount INTEGER NOT NULL,
    bid_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (bidder_id) REFERENCES players(id)
);
```

#### Server Components
- `AuctionManager.js` - Auction CRUD and logic
- `AuctionSearch.js` - Search and filtering
- `AuctionCleanup.js` - Expiration handling

#### Client Components
- `AuctionHouseUI.js` - Main auction house interface
- `AuctionCreateModal.js` - Create auction form
- `AuctionBrowsePanel.js` - Browse and search
- `AuctionBidModal.js` - Place bid interface
- `AuctionWatchList.js` - Watched auctions

#### Network Events
```javascript
// Auction house
auction:get_list → auction:list
auction:search → auction:search_results
auction:create → auction:created
auction:bid → auction:bid_accepted / auction:bid_outbid
auction:buyout → auction:purchased
auction:cancel → auction:cancelled
auction:get_my_auctions → auction:my_auctions
auction:get_bids → auction:my_bids
```

### 3. Trade Chat Channel (3h)
**Priority:** MEDIUM

#### Features
- Dedicated trade chat channel (`/trade` or `T` key)
- WTB (Want To Buy) messages with item linking
- WTS (Want To Sell) messages with item linking
- Price check requests
- Trade spam prevention (rate limiting)

#### Client Components
- `TradeChat.js` - Trade chat panel
- Item linking system (shift-click item to link)
- Trade chat filters (WTB/WTS/Price Check)

#### Network Events
```javascript
trade_chat:message → trade_chat:broadcast
```

### 4. Item Valuation System (3h)
**Priority:** MEDIUM

#### Features
- Market price estimation for items
- Historical price tracking
- Price trends (24h, 7d, 30d)
- Rarity-based value ranges
- Item level factor in pricing

#### Database Schema
```sql
-- Price history
CREATE TABLE price_history (
    id TEXT PRIMARY KEY,
    item_type TEXT NOT NULL, -- item template ID
    item_level INTEGER,
    rarity TEXT,
    avg_price INTEGER,
    min_price INTEGER,
    max_price INTEGER,
    trade_count INTEGER,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast lookups
CREATE INDEX idx_price_history_item ON price_history(item_type, recorded_at);
```

#### Server Components
- `ValuationEngine.js` - Price calculation
- `PriceHistoryTracker.js` - Record and analyze trades

#### Client Components
- `ItemTooltipPrice.js` - Show estimated value in tooltips
- `PriceCheckModal.js` - Detailed price analysis

## Implementation Order

1. **Day 1-2:** Direct Trading System
   - Database migrations
   - TradeManager.js
   - TradeWindow.js UI
   - Socket handlers

2. **Day 3-5:** Auction House
   - Auction database schema
   - AuctionManager.js
   - Auction house UI
   - Search and filters
   - Bid system

3. **Day 6:** Trade Chat
   - Trade chat channel
   - Item linking
   - Rate limiting

4. **Day 7:** Valuation System
   - Price history tracking
   - Valuation engine
   - Tooltip integration

5. **Day 8:** Testing & Polish
   - Unit tests (target: 95% coverage)
   - Integration testing
   - UI polish

## Technical Requirements

### Dependencies
- Existing inventory system
- Existing player management
- Existing item database
- Gold/currency system

### Security Considerations
- Trade validation (both parties have items/gold)
- Auction bid validation (sufficient gold)
- Prevent duplicate trades
- Transaction rollback on error
- Anti-spam for trade chat

### Performance Targets
- Auction search < 100ms for 1000 items
- Trade completion < 500ms
- Price lookup < 50ms

## Testing Strategy

### Unit Tests
- TradeManager: 20+ test cases
- AuctionManager: 30+ test cases
- ValuationEngine: 15+ test cases

### Integration Tests
- Full trade flow
- Full auction flow
- Edge cases (cancel, expire, outbid)

### Manual QA
- Trade with multiple item types
- Auction create/bid/buyout flow
- Trade chat functionality
- Price accuracy verification

## Success Metrics

- All unit tests passing (95%+ coverage)
- Zero critical bugs in trading
- Average auction search < 100ms
- Trade completion success rate > 99%

## Deliverables

1. ✅ Trading system fully functional
2. ✅ Auction house live with 1000+ items
3. ✅ Trade chat active
4. ✅ Price estimation accurate within 10%
5. ✅ Complete test suite
6. ✅ Documentation updated

## Next Phase

**Phase 3: New Zones** (30h estimated)
- Zone: Eldoria (levels 20-40)
- 14 new mobs
- 2 new bosses
- World map system
