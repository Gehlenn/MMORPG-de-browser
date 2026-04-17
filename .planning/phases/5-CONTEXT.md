# Phase 1 Context: Guild System (v0.5.0)

**Milestone:** v0.5.0 World Expansion  
**Phase:** 1 - Guild System  
**Status:** Planning  
**Created:** 2026-04-16

---

## Overview

The Guild System is the foundation of social gameplay in Legacy of Komodo. It enables players to form organized groups with shared identity, communication channels, and cooperative benefits.

---

## Goals

1. **Core Guild Management**
   - Create and disband guilds
   - Invite and manage members
   - Role-based permissions (Leader, Officer, Member)
   - Guild information display

2. **Communication**
   - Guild chat channel
   - Guild announcements/officers chat
   - Member online status

3. **Guild Identity**
   - Custom guild names
   - Guild tags (3-4 letter abbreviations)
   - Guild description and message of the day
   - Guild member list

4. **Social Features**
   - View other guild profiles
   - Guild search/directory
   - Guild invite system

---

## Research

### Existing Systems Analysis

#### Current State
- **Solo gameplay:** No guild mechanics exist
- **Chat:** Global chat only, no private channels
- **Social:** Friend list not implemented

#### Required Infrastructure
- Guild data persistence (SQLite/PostgreSQL)
- Real-time guild updates via WebSocket
- Guild member status tracking
- Permission system

### Reference Games

**World of Warcraft Guild System:**
- Ranks: Guild Master, Officer, Member, Initiate
- Features: Guild bank, calendar, achievements
- Guild events and challenges

**Guild Wars 2 Guild System:**
- Influence system for guild progression
- Guild missions
- Custom guild halls (future)

**Albion Online Guild System:**
- Territory control
- Guild vs Guild combat
- Economic benefits

### Technical Considerations

**Data Model:**
```javascript
Guild {
    id: UUID,
    name: String (2-24 chars),
    tag: String (3-4 uppercase letters),
    description: String (max 500 chars),
    motd: String (max 200 chars), // Message of the day
    leaderId: UUID,
    createdAt: DateTime,
    memberCount: Number,
    maxMembers: 100
}

GuildMember {
    guildId: UUID,
    playerId: UUID,
    rank: Enum ['LEADER', 'OFFICER', 'MEMBER', 'INITIATE'],
    joinedAt: DateTime,
    lastActive: DateTime
}

GuildInvitation {
    id: UUID,
    guildId: UUID,
    inviterId: UUID,
    inviteeId: UUID,
    status: Enum ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'],
    createdAt: DateTime,
    expiresAt: DateTime
}
```

---

## Constraints & Requirements

### Functional Requirements

1. **Guild Creation**
   - Name must be unique (server-wide)
   - Tag must be unique (server-wide)
   - Cost: 10,000 gold (prevents spam)
   - Minimum level: 10
   - Cannot be in another guild

2. **Guild Membership**
   - Maximum 100 members per guild
   - Player can only be in one guild at a time
   - Leader can transfer leadership
   - Officers can invite and kick members
   - Members can leave freely

3. **Guild Chat**
   - Separate channel from global chat
   - Shows online/offline status
   - Officers-only channel option
   - Message persistence (last 100 messages)

4. **Guild Search**
   - Browse open guilds
   - Search by name or tag
   - Filter by member count
   - View guild profiles

### Non-Functional Requirements

1. **Performance**
   - Guild operations < 100ms response time
   - Chat messages broadcast < 50ms
   - Member list loads < 200ms for 100 members

2. **Scalability**
   - Support 1000+ guilds per server
   - Handle 100 concurrent guild operations

3. **Security**
   - Prevent duplicate guild names/tags
   - Rate limit guild creation (1 per hour per player)
   - Prevent SQL injection in guild names

---

## User Stories

### As a Player

**US-1:** I want to create a guild so I can play with friends under a shared identity.
- Given I am level 10+ and not in a guild
- When I provide a unique name/tag and pay 10,000 gold
- Then my guild is created and I become the leader

**US-2:** I want to invite friends to my guild so we can coordinate gameplay.
- Given I am an Officer or Leader
- When I invite a player by username
- Then they receive an invitation they can accept or decline

**US-3:** I want to chat with my guild so we can communicate privately.
- Given I am a guild member
- When I type in guild chat
- Then all online guild members see my message

**US-4:** I want to browse guilds so I can find one to join.
- Given I am not in a guild
- When I open the guild directory
- Then I see a list of open guilds with member counts

**US-5:** I want to leave a guild if it doesn't match my playstyle.
- Given I am a guild member (not leader)
- When I click "Leave Guild"
- Then I am removed from the guild immediately

### As a Guild Leader

**US-6:** I want to promote/demote members to manage my guild hierarchy.
- Given I am the guild leader
- When I change a member's rank
- Then their permissions update immediately

**US-7:** I want to kick disruptive members to maintain guild quality.
- Given I am the leader or an officer
- When I remove a member
- Then they are immediately removed and notified

**US-8:** I want to set a guild message of the day to inform members.
- Given I am the leader or an officer
- When I update the MOTD
- Then all members see it when they log in

---

## UI/UX Considerations

### Guild UI Components

1. **Guild Panel** (Main UI)
   - Guild name and tag
   - Member list with status indicators
   - Online count: "42/100 Online"
   - Quick action buttons (Invite, Leave, Settings)

2. **Guild Chat Tab**
   - Separate from global chat
   - Color-coded messages (Guild: green, Officers: gold)
   - Member names with ranks

3. **Guild Directory**
   - Search bar
   - Filter options (size, recruitment status)
   - Guild cards with name, tag, member count
   - "Apply to Join" button

4. **Create Guild Modal**
   - Name input with validation
   - Tag input (auto-uppercase)
   - Description textarea
   - Cost display (10,000 gold)
   - Create button (disabled until valid)

5. **Guild Member Tooltip**
   - Rank badge
   - Join date
   - Last active
   - Quick actions (if leader/officer)

### Visual Design

**Guild Tag Display:**
```
[LOK] PlayerName
```
- Tag in brackets, colored by guild (customizable)
- Player name after space
- Shows in chat, player list, above character

**Rank Badges:**
- 👑 Crown for Leader
- ⚔️ Sword for Officer
- 👤 Person for Member
- 🔰 Shield for Initiate

---

## Technical Architecture

### Server-Side

**New Files:**
```
server/guild/
├── GuildManager.js          # Core guild operations
├── GuildChatHandler.js      # Guild chat broadcast
├── GuildInvitationManager.js # Invite lifecycle
└── GuildDatabase.js         # Data persistence
```

**Database Schema:**
```sql
-- Guilds table
CREATE TABLE guilds (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    tag TEXT UNIQUE NOT NULL,
    description TEXT,
    motd TEXT,
    leader_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    max_members INTEGER DEFAULT 100
);

-- Guild members table
CREATE TABLE guild_members (
    guild_id TEXT,
    player_id TEXT,
    rank TEXT DEFAULT 'INITIATE',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME,
    PRIMARY KEY (guild_id, player_id),
    FOREIGN KEY (guild_id) REFERENCES guilds(id)
);

-- Guild invitations table
CREATE TABLE guild_invitations (
    id TEXT PRIMARY KEY,
    guild_id TEXT,
    inviter_id TEXT,
    invitee_id TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);
```

### Client-Side

**New Files:**
```
client/guild/
├── GuildUI.js              # Main guild interface
├── GuildChat.js            # Chat component
├── GuildDirectory.js       # Browse/search guilds
├── CreateGuildModal.js     # Guild creation UI
└── GuildMemberList.js      # Member management
```

**Network Events:**
```javascript
// Guild events
guild:create
guild:disband
guild:invite
guild:invite_response
guild:kick
guild:promote
guild:leave
guild:join
guild:update_info
guild:member_list
guild:chat
guild:officer_chat

// Player events
guild:invited
guild:kicked
guild:member_joined
guild:member_left
guild:member_promoted
guild:disbanded
guild:info_updated
```

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Guild name/tag conflicts | High | Medium | Atomic creation, validation before commit |
| Database performance with many guilds | Medium | Low | Proper indexing, pagination |
| Chat spam in guild channels | Medium | Medium | Rate limiting, officer moderation tools |
| Guild leader abandons guild | High | Medium | Auto-promote senior officer after 30 days inactivity |
| Guild bank/feature scope creep | High | High | Strictly limit Phase 1 to core features |

---

## Dependencies

**Internal:**
- Authentication system (existing)
- Player database (existing)
- Chat system (needs extension)
- NetworkManager (existing)

**External:**
- None for Phase 1 (keep it simple)

---

## Definition of Done

- [ ] Players can create guilds with unique names/tags
- [ ] Guild invitation system works (invite → accept/decline)
- [ ] Guild chat broadcasts to all online members
- [ ] Member list shows online/offline status
- [ ] Leader/Officer can kick and promote members
- [ ] Guild directory allows browsing open guilds
- [ ] All operations persist to database
- [ ] UI is responsive and intuitive
- [ ] Test coverage > 95%
- [ ] No critical bugs in manual QA

---

## Next Steps

1. Create detailed implementation plan (PLAN.md)
2. Design database schema and migrations
3. Implement GuildManager core logic
4. Create UI components
5. Write tests
6. Manual QA
7. Integration with v0.4.0 systems

---

**Related Documents:**
- PROMPT_MESTRE.md - Guilds mentioned in Fase 2 roadmap
- ROADMAP.md - v0.5.0 planning
- STATE.md - Current project status

---

*This context document defines the scope and requirements for the Guild System implementation in Legacy of Komodo v0.5.0.*
