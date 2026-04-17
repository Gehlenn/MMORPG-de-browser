-- Migration 004: Add Guild System Tables
-- Legacy of Komodo MMORPG v0.5.0

-- Guilds table
CREATE TABLE IF NOT EXISTS guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(24) NOT NULL UNIQUE,
    tag VARCHAR(4) NOT NULL UNIQUE,
    description VARCHAR(500) DEFAULT '',
    motd VARCHAR(200) DEFAULT '',
    leader_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    max_members INTEGER DEFAULT 100,
    is_recruiting BOOLEAN DEFAULT TRUE,
    CONSTRAINT valid_name CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 24),
    CONSTRAINT valid_tag CHECK (LENGTH(tag) >= 3 AND LENGTH(tag) <= 4),
    CONSTRAINT valid_tag_uppercase CHECK (tag = UPPER(tag))
);

-- Guild members table
CREATE TABLE IF NOT EXISTS guild_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    player_id UUID NOT NULL UNIQUE,
    rank VARCHAR(20) NOT NULL DEFAULT 'INITIATE',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_rank CHECK (rank IN ('LEADER', 'OFFICER', 'MEMBER', 'INITIATE'))
);

-- Guild invitations table
CREATE TABLE IF NOT EXISTS guild_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL,
    invitee_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
    CONSTRAINT unique_pending_invite UNIQUE (guild_id, invitee_id, status) WHERE status = 'PENDING'
);

-- Guild chat history (last 100 messages)
CREATE TABLE IF NOT EXISTS guild_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(50) NOT NULL,
    sender_rank VARCHAR(20) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_officer_chat BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guild_members_guild_id ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_player_id ON guild_members(player_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_rank ON guild_members(guild_id, rank);
CREATE INDEX IF NOT EXISTS idx_guild_invitations_guild_id ON guild_invitations(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_invitations_invitee_id ON guild_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_guild_invitations_status ON guild_invitations(status);
CREATE INDEX IF NOT EXISTS idx_guild_chat_guild_id ON guild_chat_history(guild_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_guilds_recruiting ON guilds(is_recruiting) WHERE is_recruiting = TRUE;

-- Function to get guild member count
CREATE OR REPLACE FUNCTION get_guild_member_count(guild_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM guild_members WHERE guild_id = guild_uuid);
END;
$$ LANGUAGE plpgsql;

-- Function to get online guild members
CREATE OR REPLACE FUNCTION get_online_guild_members(guild_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM guild_members gm
        JOIN players p ON gm.player_id = p.id
        WHERE gm.guild_id = guild_uuid AND p.is_online = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE guild_invitations 
    SET status = 'EXPIRED' 
    WHERE status = 'PENDING' AND expires_at < NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Run cleanup every hour (optional, can also be done in application)
-- CREATE OR REPLACE TRIGGER trigger_cleanup_expired_invitations
--     AFTER INSERT ON guild_invitations
--     EXECUTE FUNCTION cleanup_expired_invitations();

-- Insert test data (for development)
-- INSERT INTO guilds (name, tag, description, leader_id) VALUES
-- ('Test Guild', 'TEST', 'A test guild for development', '00000000-0000-0000-0000-000000000001');
