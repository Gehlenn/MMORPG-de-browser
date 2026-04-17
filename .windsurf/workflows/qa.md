---
description: QA Workflow for v0.4.0 Client-Side AI Integration Release
---

# QA Workflow - v0.4.0 Release Validation

## Pre-Flight Checks

### 1. Environment Setup
```bash
// turbo
node --version    # Should be 18+
npm --version     # Should be 9+
```

### 2. Install Dependencies
```bash
// turbo
npm ci
```

### 3. Lint Check
```bash
// turbo
npm run lint
```

## Test Execution

### 4. Unit Tests
```bash
// turbo
npm test -- tests/v0.4.0/ai-integration.test.js
```

**Expected:** All 19 tests passing

### 5. Coverage Check
```bash
// turbo
npm test -- --coverage --collectCoverageFrom="client/ai/**/*.js" --collectCoverageFrom="server/ai/**/*.js"
```

**Expected:** 95%+ coverage

### 6. Regression Tests
```bash
// turbo
npm test -- tests/v0.4.0/regression.test.js
```

## Integration Testing

### 7. Start Server
```bash
// turbo
npm start &
sleep 3
```

### 8. Health Check
```bash
// turbo
curl http://localhost:3000/health || echo "Server check failed"
```

## Manual QA Checklist

### Phase 2: AI Visualization
- [ ] Press F9 - debug overlay appears
- [ ] Kill mob and verify state changes
- [ ] Observe boss phase change banner
- [ ] Check color coding (green=idle, red=chase, orange=attack)

### Phase 3: Player-AI Interaction
- [ ] Attack mob - threat meter appears
- [ ] Get top threat - "AGGRO" warning shows
- [ ] Use CC ability - tactical tip appears
- [ ] Boss mechanic - warning notification shows

### Phase 4: Performance
- [ ] Spawn 50+ mobs - check FPS stays 60
- [ ] Monitor network tab - bandwidth < 5 KB/s
- [ ] No memory leaks over 10 minutes
- [ ] Smooth gameplay at 100ms latency

## Sign-Off

### Criteria for Release
- [ ] All automated tests passing
- [ ] 95%+ code coverage
- [ ] 0 lint errors
- [ ] Manual QA checklist complete
- [ ] Performance benchmarks met

### Release Command
```bash
// turbo
echo "v0.4.0 READY FOR PRODUCTION"
```
