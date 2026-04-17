# Phase 4 Plan: Performance Optimization

**Phase:** 4  
**Estimated Time:** 2-3 hours  
**Priority:** High

---

## Task 1: Object Pooling (45 min)

### client/ai/AIStatePool.js
**Action:** Create object pool for AI state objects

**Implementation:**
- Pre-allocate pool of AI state objects
- Reuse instead of create/destroy
- Reset method for cleanup

**Methods:**
- `acquire()` - Get object from pool
- `release(obj)` - Return object to pool
- `expand(size)` - Grow pool capacity

---

## Task 2: Spatial Indexing (45 min)

### client/ai/SpatialIndex.js
**Action:** Quadtree for efficient entity queries

**Implementation:**
- Quadtree spatial partitioning
- Query entities in viewport
- Update entity positions

**Methods:**
- `insert(entity)` - Add entity
- `remove(entity)` - Remove entity
- `query(range)` - Get entities in range
- `update(entity)` - Update position

---

## Task 3: Update Throttling (30 min)

### server/ai/AIMobController.js
**Action:** Distance-based update frequencies

**Implementation:**
- Near: 60 updates/sec
- Medium: 20 updates/sec
- Far: 5 updates/sec
- Off-screen: 1 update/sec

---

## Task 4: Delta Compression (30 min)

### server/ai/DeltaCompressor.js
**Action:** Only send changed fields

**Implementation:**
- Track last sent state
- Compare and build delta
- Client applies delta

**Example:**
```javascript
// Instead of full state
{ x: 100, y: 200, state: 'chase', hp: 80 }

// Send only changes
{ x: 102, y: 200 } // Only position changed
```

---

## Task 5: Client Prediction (30 min)

### client/ai/ClientAIController.js
**Action:** Predict AI movement between updates

**Implementation:**
- Store last known velocity
- Interpolate position
- Smooth corrections

---

## Task 6: Render Optimization (30 min)

### client/engine/GameEngine.js
**Action:** Spatial culling and LOD

**Implementation:**
- Only render visible entities
- Simplified sprites for far entities
- Skip off-screen rendering

---

## Task 7: Performance Tests (30 min)

### tests/performance/ai-load.test.js
**Action:** Validate performance targets

**Tests:**
- 100 mobs at 60 FPS
- Memory stability over 1 hour
- Network < 5 KB/s
- Latency < 50ms

---

## Success Criteria

- [ ] FPS stays at 60 with 100 mobs
- [ ] Memory usage stable (no leaks)
- [ ] Network usage < 5 KB/s per player
- [ ] All tests pass
