---
description: QA Workflow for v0.5.0 Phase 1 - Guild System
---

# QA Workflow - Guild System v0.5.0

## Pre-Flight Checks

### 1. Environment Setup
```bash
// turbo
node --version    # Should be 18+
npm --version     # Should be 9+
```

### 2. Database Migration
```bash
// turbo
node scripts/apply-migration.js 004_add_guilds.sql
```

### 3. Install & Build
```bash
// turbo
npm ci
npm run build --if-present
```

### 4. Lint Check
```bash
// turbo
npm run lint || echo "No lint script"
```

## Unit Test Execution

### 5. Guild System Unit Tests
```bash
// turbo
npm test -- server/guild/__tests__/GuildDatabase.test.js
npm test -- server/guild/__tests__/GuildManager.test.js
npm test -- server/guild/__tests__/GuildChatHandler.test.js
npm test -- server/guild/__tests__/GuildInvitationManager.test.js
```

**Expected:** 125+ tests passing

### 6. Coverage Check
```bash
// turbo
npm test -- --coverage --collectCoverageFrom="server/guild/**/*.js"
```

**Expected:** 90%+ coverage

## Integration Testing

### 7. Start Server
```bash
// turbo
cd server && node server.js &
sleep 5
curl http://localhost:3000/health
```

### 8. Socket Connection Test
```bash
// turbo
node scripts/test-guild-socket.js
```

## Manual QA Checklist - Guild System

### Player Prerequisites
- [ ] Create test player (level 10+, 10,000 gold)
- [ ] Create second test player for invitations

### Guild Creation
- [ ] Press **G** - Guild panel opens
- [ ] Click "Create Guild" - Modal appears
- [ ] Try create with level < 10 - Error shown
- [ ] Try create with < 10,000 gold - Error shown
- [ ] Try create with invalid name (2 chars) - Validation error
- [ ] Try create with invalid tag (lowercase) - Validation error
- [ ] Create guild "Test Guild" [TEST] - Success
- [ ] Verify 10,000 gold deducted
- [ ] Verify player becomes Leader

### Guild Directory
- [ ] Click "Browse Guilds" - Directory opens
- [ ] Search for guilds - Results filter in real-time
- [ ] Click on a guild - Shows details (if implemented)

### Invitations
- [ ] Officer clicks "Invite Member" - Dialog appears
- [ ] Try invite player already in guild - Error shown
- [ ] Invite offline player - Error shown
- [ ] Invite valid player - Success, invitation sent
- [ ] Invitee receives notification
- [ ] Invitee accepts - Added as Initiate
- [ ] Invitee declines - Invitation removed
- [ ] Test invitation expiration (24h)

### Member Management
- [ ] Leader right-clicks member - Context menu appears
- [ ] Promote Initiate to Member - Rank updated
- [ ] Promote Member to Officer - Rank updated
- [ ] Demote Officer to Member - Rank updated
- [ ] Kick Member - Member removed
- [ ] Try kick as Officer - Permission denied
- [ ] Try kick Leader - Error shown

### Leadership Transfer
- [ ] Leader transfers to Officer - New leader set
- [ ] Old leader becomes Officer
- [ ] New leader can kick old leader

### Guild Chat
- [ ] Send message in guild chat - All members receive
- [ ] Send 6 messages rapidly - Rate limit applied (5/10s)
- [ ] Officer sends officer chat - Only officers/leader see
- [ ] Regular member tries officer chat - Permission denied
- [ ] Empty message - Rejected
- [ ] 500+ char message - Truncated

### Settings & MOTD
- [ ] Leader opens Settings - MOTD editable
- [ ] Change MOTD - Saved and displayed
- [ ] Officer tries edit MOTD - Permission denied
- [ ] Leader clicks Disband - Confirmation required
- [ ] Check "Confirm disband" checkbox - Enabled
- [ ] Click Disband Guild - Guild removed
- [ ] All members notified

### Leaving Guild
- [ ] Member clicks "Leave Guild" - Confirmation dialog
- [ ] Confirm leave - Removed from guild
- [ ] Leader tries leave - Error (must transfer first)

### Edge Cases
- [ ] Create guild with duplicate name - Error
- [ ] Create guild with duplicate tag - Error
- [ ] Join guild while having pending invitations - Others auto-cancelled
- [ ] 100 members max - Cannot invite more
- [ ] Player data loads correctly with guild info

## Regression Tests

### Core Gameplay
- [ ] Login works normally
- [ ] Character selection works
- [ ] Movement (WASD) works
- [ ] Combat works
- [ ] Other UI panels work (inventory, skills, etc.)
- [ ] No console errors

## Performance Tests

### Stress Test
- [ ] Create 50 guilds - No lag
- [ ] 100 members in one guild - List scrolls smoothly
- [ ] Rapid chat messages (5+ players) - No server lag
- [ ] Guild panel opens in <100ms

## Sign-Off

### Criteria for Phase 1 Complete
- [ ] 125+ unit tests passing
- [ ] 90%+ code coverage
- [ ] 0 lint errors
- [ ] All manual QA checklist items tested
- [ ] No critical bugs
- [ ] Performance benchmarks met

### Ready for Production
```bash
// turbo
echo "✅ Phase 1: Guild System - READY FOR PRODUCTION"
```
