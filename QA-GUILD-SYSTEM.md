# QA Checklist - Guild System v0.5.0

**QA Date:** ___________  
**Tester:** ___________  
**Environment:** Staging  
**Version:** v0.5.0 Guild System

## Pre-Conditions

- [ ] Server running: `npm start`
- [ ] Client accessible: `http://localhost:3001`
- [ ] Database migrated: `004_add_guilds.sql`
- [ ] Two test accounts available (Player A: Level 10+, 10k+ gold; Player B: Any level)

---

## Critical Path Tests

### 1. Guild Creation
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1.1 | Login with Player A (Level 10+, 10k gold) | Successfully logged in | [ ] |
| 1.2 | Open Guild Directory (G key or button) | Guild UI opens showing directory | [ ] |
| 1.3 | Click "Create Guild" | Create Guild modal opens | [ ] |
| 1.4 | Enter guild name (2-24 chars) | Name accepted | [ ] |
| 1.5 | Enter guild tag (3-4 uppercase chars) | Tag accepted | [ ] |
| 1.6 | Enter description (optional) | Description saved | [ ] |
| 1.7 | Click "Create" | Guild created, 10k gold deducted | [ ] |
| 1.8 | Verify guild panel shows | Guild panel displays with member list | [ ] |
| 1.9 | Verify gold deducted | Player gold reduced by 10,000 | [ ] |

**Result:** ⬜ PASS / ⬜ FAIL  
**Notes:** _________________________________

### 2. Guild Invitations
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 2.1 | Player A opens Guild panel | Guild panel visible | [ ] |
| 2.2 | Click "Invite Member" | Invite dialog opens | [ ] |
| 2.3 | Enter Player B username | Username found | [ ] |
| 2.4 | Send invitation | "Invitation sent" notification | [ ] |
| 2.5 | Player B checks notifications | Invitation notification received | [ ] |
| 2.6 | Player B opens Guild Directory | "Invitations" tab shows 1 invite | [ ] |
| 2.7 | Click "View Invitation" | Invitation details shown | [ ] |
| 2.8 | Accept invitation | Player B joins guild | [ ] |
| 2.9 | Verify member list | Player B appears in member list | [ ] |

**Result:** ⬜ PASS / ⬜ FAIL  
**Notes:** _________________________________

### 3. Guild Chat
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 3.1 | Player B opens Guild Chat | Chat panel opens | [ ] |
| 3.2 | Type message: "Hello guild!" | Message appears in input | [ ] |
| 3.3 | Press Enter or click Send | Message sent | [ ] |
| 3.4 | Player A verifies message | Message appears in Player A's chat | [ ] |
| 3.5 | Player A replies | Reply visible to both players | [ ] |
| 3.6 | Test rate limit (5 messages) | 6th message shows rate limit warning | [ ] |
| 3.7 | Wait 10 seconds | Can send messages again | [ ] |

**Result:** ⬜ PASS / ⬜ FAIL  
**Notes:** _________________________________

### 4. Guild Management (Kick)
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 4.1 | Player A opens member list | All members visible | [ ] |
| 4.2 | Right-click on Player B | Context menu appears | [ ] |
| 4.3 | Select "Kick Member" | Confirmation dialog appears | [ ] |
| 4.4 | Confirm kick | Player B removed from guild | [ ] |
| 4.5 | Player B verifies | No longer in guild, guild chat closed | [ ] |

**Result:** ⬜ PASS / ⬜ FAIL  
**Notes:** _________________________________

### 5. Leave Guild
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 5.1 | Invite Player B again (repeat 2.1-2.8) | Player B rejoins guild | [ ] |
| 5.2 | Player B opens Guild Settings | Settings panel visible | [ ] |
| 5.3 | Click "Leave Guild" | Confirmation dialog appears | [ ] |
| 5.4 | Confirm leave | Player B leaves guild | [ ] |
| 5.5 | Verify member list | Player B no longer in list | [ ] |

**Result:** ⬜ PASS / ⬜ FAIL  
**Notes:** _________________________________

---

## Edge Case Tests

### 6. Validation - Create Guild
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 6.1 | Try create guild with level 5 character | Error: "Requires level 10" | [ ] |
| 6.2 | Try create guild with 5,000 gold | Error: "Requires 10000 gold" | [ ] |
| 6.3 | Try create guild with name "A" | Error: "Name must be 2-24 characters" | [ ] |
| 6.4 | Try create guild with tag "AB" | Error: "Tag must be 3-4 characters" | [ ] |
| 6.5 | Try create guild with lowercase tag "test" | Tag auto-converted to "TEST" | [ ] |
| 6.6 | Try create guild with existing name | Error: "Name already exists" | [ ] |
| 6.7 | Try create second guild while in guild | Error: "Already in a guild" | [ ] |

**Result:** ⬜ PASS / ⬜ FAIL  
**Notes:** _________________________________

### 7. Permissions & Ranks
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 7.1 | Invite Player B and accept | Player B joins as INITIATE | [ ] |
| 7.2 | Promote Player B to MEMBER | Rank updated to MEMBER | [ ] |
| 7.3 | Promote Player B to OFFICER | Rank updated to OFFICER | [ ] |
| 7.4 | Player B tries to promote Player A | Error: "Only leader can promote" | [ ] |
| 7.5 | Player B tries to kick Player A | Error: "Cannot kick the leader" | [ ] |
| 7.6 | Invite Player C (initiate) | Player C joins | [ ] |
| 7.7 | Player B (officer) kicks Player C | Success - officer can kick initiate | [ ] |
| 7.8 | Invite Player C again | Player C joins | [ ] |
| 7.9 | Promote Player C to OFFICER | Player C is now officer | [ ] |
| 7.10 | Player B tries to kick Player C | Error: "Cannot kick other officers" | [ ] |

**Result:** ⬜ PASS / ⬜ FAIL  
**Notes:** _________________________________

### 8. Officer Chat
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 8.1 | Ensure Player A (Leader) and Player B (Officer) are in guild | Both in guild | [ ] |
| 8.2 | Player A switches to Officer Chat | Chat mode changed | [ ] |
| 8.3 | Player A sends officer message | Message marked as officer-only | [ ] |
| 8.4 | Player B sees message in officer chat | Message visible | [ ] |
| 8.5 | Invite Player C as MEMBER | Player C joins | [ ] |
| 8.6 | Player C checks officer chat | No officer messages visible | [ ] |
| 8.7 | Player C tries to send officer message | Error: "Officers only" | [ ] |

**Result:** ⬜ PASS / ⬜ FAIL  
**Notes:** _________________________________

### 9. Guild Directory
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 9.1 | Create Guild X (recruiting) | Guild created | [ ] |
| 9.2 | Open Guild Directory | Directory loads | [ ] |
| 9.3 | Search for "Guild" | Matching guilds shown | [ ] |
| 9.4 | Filter by recruiting only | Only recruiting guilds shown | [ ] |
| 9.5 | Click on guild name | Guild details shown | [ ] |
| 9.6 | Guild X turns off recruiting | Settings updated | [ ] |
| 9.7 | Directory refreshes | Guild X not in recruiting list | [ ] |

**Result:** ⬜ PASS / ⬜ FAIL  
**Notes:** _________________________________

### 10. Guild Disband
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 10.1 | Invite Player B to guild | Player B joins | [ ] |
| 10.2 | Player B tries to disband guild | Error: "Only leader can disband" | [ ] |
| 10.3 | Player A (leader) opens settings | Settings panel open | [ ] |
| 10.4 | Click "Disband Guild" | Confirmation dialog appears | [ ] |
| 10.5 | Confirm disband | Guild disbanded | [ ] |
| 10.6 | Player A verifies | No longer in guild | [ ] |
| 10.7 | Player B verifies | No longer in guild, notification received | [ ] |

**Result:** ⬜ PASS / ⬜ FAIL  
**Notes:** _________________________________

---

## Summary

| Category | Total | Pass | Fail | Skip |
|----------|-------|------|------|------|
| Critical Path | 5 | | | |
| Edge Cases | 5 | | | |
| **TOTAL** | **10** | | | |

**Overall Result:** ⬜ PASS / ⬜ CONDITIONAL / ⬜ FAIL

**Critical Issues Found:**
- 

**Minor Issues Found:**
- 

**Recommendations:**
- 

**Tester Signature:** _______________  **Date:** _____________

**Approved for Production:** ⬜ YES / ⬜ NO  
**Approved By:** _______________  **Date:** _____________
