# Phase 1: Guild System (v0.5.0)

## Goal
Enable players to form and manage guilds for social gameplay in Legacy of Komodo.

## Context from v0.4.0
- ✅ v0.4.0 Client-Side AI Integration complete
- ✅ Authentication system functional
- ✅ Player database with levels and stats
- ✅ Chat system (global only, needs extension)
- ❌ No guild mechanics exist yet

## Deliverables

### 1. Guild Management Core
**Location:** `server/guild/GuildManager.js`, `client/guild/GuildUI.js`

**Features:**
- Create guild (cost: 10,000 gold, level 10+)
- Unique guild names (server-wide)
- Unique guild tags 3-4 letters [LOK] (server-wide)
- Disband guild (leader only)
- Transfer leadership
- Guild description and MOTD

**Database Schema:**
```javascript
Guild {
  id: UUID,
  name: String (2-24 chars, unique),
  tag: String (3-4 uppercase, unique),
  description: String (max 500 chars),
  motd: String (max 200 chars),
  leaderId: UUID,
  createdAt: DateTime,
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
  expiresAt: DateTime
}
```

### 2. Guild Membership
**Location:** `server/guild/GuildInvitationManager.js`

**Features:**
- Invite players by username
- Invitation expiration (24 hours)
- Accept/decline invitations
- Leave guild (members can leave freely)
- Kick members (Officers and Leader)
- Promote/demote members (Leader only)
- Max 100 members per guild

### 3. Guild Chat System
**Location:** `server/guild/GuildChatHandler.js`, `client/guild/GuildChat.js`

**Features:**
- Guild chat channel (green color)
- Officers-only chat (gold color)
- Member online/offline status
- Last 100 message persistence
- Rank badges in chat (👑⚔️👤🔰)

### 4. Guild Directory
**Location:** `client/guild/GuildDirectory.js`

**Features:**
- Browse open guilds
- Search by name or tag
- Filter by size (small/medium/large)
- View guild profiles
- "Request to Join" button
- Recruitment status (open/closed)

## UI Components

### Guild Panel (Main Interface)
```
┌──────────────────────────────────────┐
│  [LOK] Legacy of Komodo          [X] │
├──────────────────────────────────────┤
│  "For honor and glory!"              │
│  MOTD: Raid tonight at 8PM!         │
├──────────────────────────────────────┤
│  Members (42/100 Online)             │
├──────────────────────────────────────┤
│  👑 LeaderName      [Online]         │
│  ⚔️ Officer1        [Online]         │
│  👤 Member1         [Offline]        │
│  👤 Member2         [Online]         │
│  🔰 Initiate1       [Offline]        │
├──────────────────────────────────────┤
│  [Invite] [Leave] [Settings]         │
└──────────────────────────────────────┘
```

### Guild Chat Tab
```
┌──────────────────────────────────────┐
│  Guild Chat [42 online]        [# officers]  │
├──────────────────────────────────────┤
│  [LOK] 👑 Leader: Welcome everyone!  │
│  [LOK] ⚔️ Officer: Raid at 8PM      │
│  [LOK] 👤 Member1: I'll be there    │
│  [System] Player joined the guild    │
├──────────────────────────────────────┤
│  [Type message...]        [Send]     │
└──────────────────────────────────────┘
```

### Create Guild Modal
```
┌──────────────────────────────────────┐
│  Create New Guild                    │
├──────────────────────────────────────┤
│  Guild Name: [Legacy of Komodo]     │
│  Guild Tag:  [LOK]                   │
│  Description: [A guild for...      ] │
├──────────────────────────────────────┤
│  Cost: 10,000 gold                   │
│  Your gold: 15,500 gold              │
├──────────────────────────────────────┤
│  [Create Guild]       [Cancel]       │
└──────────────────────────────────────┘
```

### Guild Directory
- Search bar (name or tag)
- Filter: Open/Closed, Size, Recently Active
- Guild cards with name, tag, member count
- "View Profile" and "Request Join" buttons

## Success Criteria

1. Players can create guilds with unique names/tags
2. Guild invitation system works (invite → accept/decline)
3. Guild chat broadcasts to all online members
4. Member list shows real-time online/offline status
5. Leader/Officer can manage ranks and kick members
6. Guild directory allows browsing and joining
7. All operations persist to database
8. UI is responsive and intuitive
9. Test coverage > 95%
10. Performance: <100ms for guild operations

## Dependencies
- ✅ v0.4.0 Client-Side AI Integration (stable base)
- ✅ Authentication system (existing)
- ✅ Player database with levels/stats (existing)
- ✅ Chat system (needs extension for guild channels)
- ❌ Guild database (to be created)

## Estimation
- Guild Management Core: 4 hours
- Membership & Invitations: 3 hours
- Guild Chat System: 2 hours
- Guild Directory UI: 2 hours
- Guild Panel UI: 3 hours
- Database & Schema: 2 hours
- Testing: 3 hours
- **Total: 19 hours**

## Implementation Order

1. **Database Schema** (2 hours)
   - Create guilds, guild_members, guild_invitations tables
   - Add indexes for performance
   - Create migrations

2. **Server Core** (4 hours)
   - GuildManager.js - CRUD operations
   - GuildChatHandler.js - Message broadcasting
   - GuildInvitationManager.js - Invite lifecycle
   - Event handlers in server.js

3. **Client UI** (5 hours)
   - GuildPanel.js - Main interface
   - GuildChat.js - Chat component
   - GuildDirectory.js - Browse guilds
   - CreateGuildModal.js - Guild creation
   - Integration with GameplayEngine

4. **Testing & Polish** (3 hours)
   - Unit tests for all components
   - Integration tests
   - UI/UX polish
   - Performance validation

## Files to Create/Modify

**New Server Files:**
1. `server/guild/GuildManager.js` - Core operations
2. `server/guild/GuildChatHandler.js` - Chat broadcasting
3. `server/guild/GuildInvitationManager.js` - Invites
4. `server/guild/GuildDatabase.js` - Data persistence
5. `server/database/migrations/004_add_guilds.sql`

**New Client Files:**
6. `client/guild/GuildUI.js` - Main interface
7. `client/guild/GuildChat.js` - Chat component
8. `client/guild/GuildDirectory.js` - Browse/search
9. `client/guild/CreateGuildModal.js` - Creation UI
10. `client/guild/GuildMemberList.js` - Member management
11. `tests/guild/guild-system.test.js` - Test suite

**Modified Files:**
12. `server/server.js` - Add guild event handlers
13. `client/engine/GameEngine.js` - Integrate guild UI
14. `client/network-events.js` - Add guild events
15. `server/database/database.js` - Add guild tables

## Network Events

### Server → Client
```javascript
guild:created
guild:disbanded
guild:member_joined
guild:member_left
guild:member_kicked
guild:member_promoted
guild:invited
guild:invite_accepted
guild:invite_declined
guild:chat_message
guild:officer_chat_message
guild:info_updated
guild:error
```

### Client → Server
```javascript
guild:create
guild:disband
guild:invite
guild:invite_response
guild:leave
guild:kick
guild:promote
guild:chat
guild:officer_chat
guild:update_info
guild:directory_request
```

## Risk Mitigation

- **Risk:** Guild name/tag conflicts
  - **Mitigation:** Atomic creation with unique constraints, validate before commit

- **Risk:** Database performance with many guilds
  - **Mitigation:** Proper indexing, pagination for directory queries

- **Risk:** Chat spam in guild channels
  - **Mitigation:** Rate limiting (5 messages/10 seconds), officer moderation

- **Risk:** Guild leader abandons guild
  - **Mitigation:** Auto-promote senior officer after 30 days inactivity

- **Risk:** Feature scope creep (want guild bank, etc.)
  - **Mitigation:** Strictly limit Phase 1 to core guild features only

## Verification Checklist
- [ ] Create guild with unique name/tag
- [ ] Invite player and they accept
- [ ] Invite player and they decline
- [ ] Leave guild as member
- [ ] Kick member as officer
- [ ] Promote member to officer
- [ ] Transfer leadership
- [ ] Disband guild as leader
- [ ] Send guild chat message
- [ ] See online/offline status
- [ ] Browse guild directory
- [ ] No console errors
- [ ] 95%+ test coverage
- [ ] Performance <100ms operations
