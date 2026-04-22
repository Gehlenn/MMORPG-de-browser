-- Migration 008: Add Draconia Zone System
-- Phase 5: Dracônia - The Dragon Peaks (Levels 60-80)

-- Player data for Draconia zone
CREATE TABLE IF NOT EXISTS draconia_zone_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    altitude_sickness_level INTEGER DEFAULT 0,
    total_time_in_draconia INTEGER DEFAULT 0,
    avalanches_survived INTEGER DEFAULT 0,
    dragons_killed INTEGER DEFAULT 0,
    highest_peak_reached TEXT,
    last_position_x REAL,
    last_position_y REAL,
    sub_zone TEXT,
    dragon_scales_collected INTEGER DEFAULT 0,
    UNIQUE(player_id)
);

-- Zone transition tracking
CREATE TABLE IF NOT EXISTS draconia_transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    from_zone TEXT NOT NULL,
    to_zone TEXT NOT NULL,
    transition_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    altitude_effect TEXT,
    temperature_effect TEXT
);

-- Weather events in Draconia
CREATE TABLE IF NOT EXISTS draconia_weather_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL, -- 'ash_storm', 'avalanche', 'dragon_roar'
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    sub_zone TEXT,
    intensity REAL DEFAULT 1.0,
    active INTEGER DEFAULT 1
);

-- Weather survivors (achievement tracking)
CREATE TABLE IF NOT EXISTS draconia_weather_survivors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    survived_time INTEGER,
    survived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sub_zone TEXT
);

-- Ancient Dragon Krazgoth encounters
CREATE TABLE IF NOT EXISTS krazgoth_encounters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    encounter_id TEXT UNIQUE NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    raid_size INTEGER,
    highest_phase INTEGER DEFAULT 1,
    successful INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,
    total_damage_dealt INTEGER DEFAULT 0,
    player_ids TEXT -- JSON array of player IDs
);

-- Player encounter participation
CREATE TABLE IF NOT EXISTS krazgoth_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    encounter_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    damage_dealt INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    highest_phase_reached INTEGER DEFAULT 1,
    loot_received TEXT, -- JSON array of items
    UNIQUE(encounter_id, player_id)
);

-- Draconia crafting unlocks
CREATE TABLE IF NOT EXISTS draconia_crafting_unlocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unlocked_by TEXT, -- 'discovery', 'quest', 'purchase'
    UNIQUE(player_id, recipe_id)
);

-- Resources gathered in Draconia
CREATE TABLE IF NOT EXISTS draconia_resources_gathered (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    amount INTEGER DEFAULT 1,
    gathered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sub_zone TEXT,
    position_x REAL,
    position_y REAL
);

-- Dragon Scale transactions (currency)
CREATE TABLE IF NOT EXISTS dragon_scale_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    amount INTEGER NOT NULL, -- positive = gain, negative = spend
    transaction_type TEXT NOT NULL, -- 'mob_drop', 'boss_kill', 'crafting', 'trade'
    reference_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_draconia_data_player ON draconia_zone_data(player_id);
CREATE INDEX IF NOT EXISTS idx_draconia_transitions_player ON draconia_transitions(player_id);
CREATE INDEX IF NOT EXISTS idx_draconia_transitions_time ON draconia_transitions(transition_time);
CREATE INDEX IF NOT EXISTS idx_weather_events_active ON draconia_weather_events(active);
CREATE INDEX IF NOT EXISTS idx_weather_events_type ON draconia_weather_events(event_type);
CREATE INDEX IF NOT EXISTS idx_krazgoth_encounters_time ON krazgoth_encounters(start_time);
CREATE INDEX IF NOT EXISTS idx_draconia_crafting_player ON draconia_crafting_unlocks(player_id);
CREATE INDEX IF NOT EXISTS idx_draconia_resources_player ON draconia_resources_gathered(player_id);
CREATE INDEX IF NOT EXISTS idx_dragon_scales_player ON dragon_scale_transactions(player_id);

-- Insert initial zone configuration
INSERT OR REPLACE INTO zone_configurations (
    zone_id, zone_name, min_level, max_level, width, height, 
    safe_zone_x, safe_zone_y, safe_zone_radius, pvp_enabled,
    environment_type, special_features
) VALUES (
    'draconia',
    'Dracônia - The Dragon Peaks',
    60, 80,
    5000, 5000,
    500, 500, 400,
    1, -- PvP enabled outside safe zone
    'mountain',
    '{"features": ["high_altitude", "volcanic", "dragons", "extreme_weather"]}'
);
