-- Migration 006: Add Zone System for Phase 3 - Eldoria
-- Date: 2026-04-17

-- Player zone progress tracking
CREATE TABLE IF NOT EXISTS player_zone_progress (
    player_id TEXT PRIMARY KEY,
    current_zone TEXT DEFAULT 'verdantis',
    discovered_zones TEXT DEFAULT '["verdantis"]', -- JSON array of zone IDs
    last_position TEXT, -- JSON {x, y, zone}
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Zone transition history (for analytics/debugging)
CREATE TABLE IF NOT EXISTS zone_transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    from_zone TEXT NOT NULL,
    to_zone TEXT NOT NULL,
    from_x INTEGER,
    from_y INTEGER,
    to_x INTEGER,
    to_y INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Boss kill tracking (for raid lockouts and achievements)
CREATE TABLE IF NOT EXISTS boss_kills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    boss_id TEXT NOT NULL,
    boss_name TEXT NOT NULL,
    zone_id TEXT NOT NULL,
    kill_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    raid_group TEXT, -- JSON array of participant IDs
    loot_distributed BOOLEAN DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zone_transitions_player ON zone_transitions(player_id);
CREATE INDEX IF NOT EXISTS idx_zone_transitions_timestamp ON zone_transitions(timestamp);
CREATE INDEX IF NOT EXISTS idx_boss_kills_player ON boss_kills(player_id);
CREATE INDEX IF NOT EXISTS idx_boss_kills_boss ON boss_kills(boss_id);
CREATE INDEX IF NOT EXISTS idx_boss_kills_time ON boss_kills(kill_time);

-- Insert default zone data
INSERT OR IGNORE INTO player_zone_progress (player_id, current_zone, discovered_zones)
SELECT id, 'verdantis', '["verdantis"]' FROM players;
