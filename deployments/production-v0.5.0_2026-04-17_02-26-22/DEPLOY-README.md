# Production Deploy v0.5.0 - Guild System

**Deploy Date:** 2026-04-17 02:26:22  
**Version:** v0.5.0 Phase 1: Guild System  
**Environment:** Production  
**Status:** ✅ READY FOR DEPLOYMENT

## Pre-Flight Checklist

- [x] All 85 Guild System tests passing
- [x] Database migration ready (004_add_guilds.sql)
- [x] Server integration verified (15+ event handlers)
- [x] Client UI components complete
- [x] Staging deploy successful

## Deployed Components

### Server
- `server/guild/GuildDatabase.js` - SQLite CRUD operations
- `server/guild/GuildManager.js` - Core business logic
- `server/guild/GuildChatHandler.js` - Chat with rate limiting
- `server/guild/GuildInvitationManager.js` - Invitation lifecycle
- `server/server.js` - Integration with 15+ guild event handlers
- `database/migrations/004_add_guilds.sql` - Database schema

### Client
- `client/guild/GuildUI.js` - Main guild panel
- `client/guild/GuildDirectory.js` - Browse/search guilds
- `client/guild/CreateGuild.js` - Guild creation modal
- `client/guild/GuildChat.js` - Chat interface
- `client/guild/SettingsDialog.js` - Guild settings

## Database Migration

Run before starting server:
```bash
# SQLite
sqlite3 database/game.db < database/migrations/004_add_guilds.sql
```

## Start Production Server

```bash
cd deployments/production-v0.5.0_2026-04-17_02-26-22
npm install --production
npm start
```

## Features Live

1. **Guild Creation** (Level 10+, 10,000 gold)
2. **Guild Invitations** (24h expiration)
3. **Guild Membership** (Join/Leave/Kick)
4. **Guild Ranks** (Leader/Officer/Member/Initiate)
5. **Guild Chat** (General + Officer chat with 5s rate limit)
6. **Guild Directory** (Browse recruiting guilds)
7. **Guild Management** (Disband, Transfer, Settings)

## Health Check

Verify deployment:
- Server starts without errors
- Database connections successful
- WebSocket accepting connections
- Guild events responding correctly

## Rollback Plan

If issues detected:
1. Stop production server
2. Restore database from backup
3. Revert to previous deploy package
4. Restart server

## Next Phase

**Phase 2: Trading & Economy** - Starting after production stable
- Direct player-to-player trading
- Auction house system
- Trade chat channel
- Item valuation system
