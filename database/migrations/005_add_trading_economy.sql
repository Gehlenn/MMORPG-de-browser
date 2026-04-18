-- Migration: 005_add_trading_economy
-- Phase 2: Trading & Economy System
-- Created: 2026-04-17

-- Trade sessions table
CREATE TABLE IF NOT EXISTS trade_sessions (
    id TEXT PRIMARY KEY,
    player1_id TEXT NOT NULL,
    player2_id TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, ACTIVE, COMPLETED, CANCELLED
    player1_confirmed INTEGER DEFAULT 0,
    player2_confirmed INTEGER DEFAULT 0,
    player1_gold INTEGER DEFAULT 0,
    player2_gold INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    cancelled_at DATETIME,
    FOREIGN KEY (player1_id) REFERENCES players(id),
    FOREIGN KEY (player2_id) REFERENCES players(id)
);

-- Trade items table
CREATE TABLE IF NOT EXISTS trade_items (
    id TEXT PRIMARY KEY,
    trade_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    item_id TEXT,
    item_data TEXT, -- JSON item data
    slot_index INTEGER,
    FOREIGN KEY (trade_id) REFERENCES trade_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_data TEXT NOT NULL, -- Full item JSON
    starting_price INTEGER NOT NULL,
    buyout_price INTEGER,
    current_bid INTEGER DEFAULT 0,
    highest_bidder_id TEXT,
    bids_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, SOLD, EXPIRED, CANCELLED
    watchers TEXT DEFAULT '[]', -- JSON array of player IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    sold_at DATETIME,
    FOREIGN KEY (seller_id) REFERENCES players(id),
    FOREIGN KEY (highest_bidder_id) REFERENCES players(id)
);

-- Auction bids table
CREATE TABLE IF NOT EXISTS auction_bids (
    id TEXT PRIMARY KEY,
    auction_id TEXT NOT NULL,
    bidder_id TEXT NOT NULL,
    bid_amount INTEGER NOT NULL,
    is_buyout INTEGER DEFAULT 0,
    bid_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES players(id)
);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    item_type TEXT NOT NULL, -- item template ID
    item_level INTEGER,
    rarity TEXT,
    avg_price INTEGER,
    min_price INTEGER,
    max_price INTEGER,
    trade_count INTEGER,
    source TEXT DEFAULT 'auction', -- auction, direct_trade
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trade chat messages table
CREATE TABLE IF NOT EXISTS trade_chat (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'GENERAL', -- GENERAL, WTB, WTS, PRICE_CHECK
    linked_item TEXT, -- JSON item data if linked
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_sessions_status ON trade_sessions(status);
CREATE INDEX IF NOT EXISTS idx_trade_sessions_player1 ON trade_sessions(player1_id);
CREATE INDEX IF NOT EXISTS idx_trade_sessions_player2 ON trade_sessions(player2_id);
CREATE INDEX IF NOT EXISTS idx_trade_items_trade ON trade_items(trade_id);

CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_seller ON auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_auctions_expires ON auctions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auctions_item ON auctions(item_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON auction_bids(auction_id);

CREATE INDEX IF NOT EXISTS idx_price_history_item ON price_history(item_type, recorded_at);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(recorded_at);

CREATE INDEX IF NOT EXISTS idx_trade_chat_time ON trade_chat(created_at);

-- Cleanup old records (run periodically)
-- DELETE FROM trade_chat WHERE created_at < datetime('now', '-7 days');
-- DELETE FROM price_history WHERE recorded_at < datetime('now', '-90 days');

PRAGMA user_version = 5;
