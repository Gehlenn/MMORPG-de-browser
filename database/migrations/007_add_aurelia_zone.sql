-- Migration 007: Add Aurélia Zone System Tables
-- Date: 2026-04-20
-- Phase: 4 - Desert Expansion

-- aurelia_zone_data table - Player-specific data for Aurélia
CREATE TABLE IF NOT EXISTS aurelia_zone_data (
    player_id TEXT PRIMARY KEY,
    heat_resistance INTEGER DEFAULT 0,
    cold_resistance INTEGER DEFAULT 0,
    discovered_locations TEXT DEFAULT '["oasis"]', -- JSON array
    sandstorms_survived INTEGER DEFAULT 0,
    anub_attempts INTEGER DEFAULT 0,
    anub_kills INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for player lookups
CREATE INDEX IF NOT EXISTS idx_aurelia_player_id ON aurelia_zone_data(player_id);

-- aurelia_transitions table - Track zone entries
CREATE TABLE IF NOT EXISTS aurelia_transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    from_zone TEXT NOT NULL,
    to_zone TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    entry_type TEXT DEFAULT 'portal', -- 'portal', 'recall', 'death'
    position_x INTEGER,
    position_y INTEGER
);

-- Indexes for transition queries
CREATE INDEX IF NOT EXISTS idx_aurelia_trans_player ON aurelia_transitions(player_id);
CREATE INDEX IF NOT EXISTS idx_aurelia_trans_timestamp ON aurelia_transitions(timestamp);

-- sandstorm_events table - Server-side tracking of sandstorm events
CREATE TABLE IF NOT EXISTS sandstorm_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER DEFAULT 300,
    intensity TEXT DEFAULT 'moderate', -- 'light', 'moderate', 'severe'
    affected_players INTEGER DEFAULT 0
);

-- sandstorm_survivors table - Track players who survived sandstorms
CREATE TABLE IF NOT EXISTS sandstorm_survivors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    sandstorm_id INTEGER NOT NULL,
    survived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_exposed INTEGER, -- seconds
    FOREIGN KEY (sandstorm_id) REFERENCES sandstorm_events(id)
);

CREATE INDEX IF NOT EXISTS idx_sandstorm_survivors_player ON sandstorm_survivors(player_id);

-- pharaoh_anub_encounters table - Track boss attempts
CREATE TABLE IF NOT EXISTS pharaoh_anub_encounters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raid_id TEXT UNIQUE NOT NULL,
    player_ids TEXT NOT NULL, -- JSON array of participants
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    success BOOLEAN DEFAULT FALSE,
    final_phase INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    loot_distributed TEXT -- JSON object
);

CREATE INDEX IF NOT EXISTS idx_anub_encounters_raid ON pharaoh_anub_encounters(raid_id);
CREATE INDEX IF NOT EXISTS idx_anub_encounters_time ON pharaoh_anub_encounters(start_time);

-- aurelia_crafting_unlocks table - Track unlocked recipes
CREATE TABLE IF NOT EXISTS aurelia_crafting_unlocks (
    player_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, recipe_id)
);

-- aurelia_resources_gathered table - Track resource gathering
CREATE TABLE IF NOT EXISTS aurelia_resources_gathered (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    amount INTEGER DEFAULT 1,
    gathered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    position_x INTEGER,
    position_y INTEGER
);

CREATE INDEX IF NOT EXISTS idx_aurelia_resources_player ON aurelia_resources_gathered(player_id);

-- Insert default data for testing (optional, remove for production)
-- INSERT INTO aurelia_zone_data (player_id) VALUES ('test_player_1');

-- Migration log entry
INSERT INTO migrations (version, name, applied_at) 
VALUES (7, 'Add Aurelia Zone System', datetime('now'));
