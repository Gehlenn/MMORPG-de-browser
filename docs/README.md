# MMORPG Browser - Engine Architecture

## Overview

The MMORPG Browser engine is built with a hybrid architecture combining traditional systems with a modern Entity Component System (ECS) for optimal performance and scalability, enhanced with advanced multiplayer networking.

## Architecture Evolution

### Version 0.3 - Traditional Architecture
- Object-oriented design with separate managers
- Direct entity references
- Monolithic systems

### Version 0.4 - ECS Integration
- Hybrid approach: ECS coexists with legacy systems
- Gradual migration path
- Performance-optimized entity management

### Version 0.5 - Networking Enhancement
- Interest Management for scalable multiplayer
- Delta Compression for bandwidth optimization
- Client Interpolation for smooth gameplay
- Support for 100+ concurrent players

## Multiplayer Networking Architecture

### Interest Management

#### InterestManager
- **Location:** `server/network/InterestManager.js`
- **Purpose:** Determine visible entities for each player
- **Features:**
  - Spatial Grid integration for O(1) proximity queries
  - Configurable view radius (100-500px)
  - Priority-based entity culling
  - Performance caching
  - Line of sight considerations

```javascript
// Get visible entities for player
const visibleEntities = interestManager.getVisibleEntities(playerId);

// Set player view radius
interestManager.setPlayerViewRadius(playerId, 300);
```

### Snapshot System

#### SnapshotSystem
- **Location:** `server/network/SnapshotSystem.js`
- **Purpose:** Generate optimized world state snapshots
- **Features:**
  - 20 FPS snapshot generation
  - Per-player interest-based snapshots
  - Entity state tracking
  - Snapshot history for interpolation
  - Performance monitoring

```javascript
// Create world snapshots
const snapshots = snapshotSystem.createWorldSnapshot(playerIds);

// Get snapshot history for interpolation
const history = snapshotSystem.getSnapshotHistory(playerId, 2);
```

### Delta Compression

#### DeltaCompressor
- **Location:** `server/network/DeltaCompressor.js`
- **Purpose:** Minimize bandwidth usage through delta compression
- **Features:**
  - Field-level change detection
  - Configurable thresholds for position/health
  - Removed entity tracking
  - Compression statistics
  - Automatic fallback to full snapshots

```javascript
// Compress snapshot
const compressed = deltaCompressor.compressSnapshot(snapshot, playerId);

// Decompress on client
const fullSnapshot = deltaCompressor.decompressDelta(delta, lastSnapshot);
```

## Client-Side Networking

### Snapshot Handler

#### SnapshotHandler
- **Location:** `client/network/SnapshotHandler.js`
- **Purpose:** Process server snapshots and manage entities
- **Features:**
  - Real-time entity state updates
  - Entity creation/destruction
  - Snapshot validation
  - Performance tracking
  - Connection state management

```javascript
// Handle incoming snapshot
snapshotHandler.handleSnapshot(snapshot);

// Get entity state
const entity = snapshotHandler.getEntityState(entityId);
```

### Interpolation System

#### InterpolationSystem
- **Location:** `client/network/InterpolationSystem.js`
- **Purpose:** Provide smooth 60 FPS movement between snapshots
- **Features:**
  - Linear interpolation with configurable delay
  - Velocity-based extrapolation
  - Position smoothing
  - Prediction support
  - Performance optimization

```javascript
// Get interpolated position
const position = interpolationSystem.getInterpolatedPosition(entityId, renderTime);

// Predict future position
const predicted = interpolationSystem.predictPosition(entityId, 100);
```

## Network Flow Architecture

### Server-Side Flow
```
Game Tick (50ms)
    ↓
Update ECS Systems
    ↓
InterestManager.findVisibleEntities()
    ↓
SnapshotSystem.createWorldSnapshot()
    ↓
DeltaCompressor.compressSnapshot()
    ↓
Send to Client via Socket.IO
```

### Client-Side Flow
```
Receive Snapshot
    ↓
SnapshotHandler.processSnapshot()
    ↓
Update Entity States
    ↓
InterpolationSystem.interpolate()
    ↓
Render at 60 FPS
```

## Performance Characteristics

### Bandwidth Optimization
- **Interest Management:** Only send visible entities
- **Delta Compression:** Only send changed data
- **Field Thresholds:** Ignore insignificant changes
- **Entity Limits:** Maximum 100 entities per player

### Client Performance
- **60 FPS Rendering:** Smooth interpolated movement
- **Memory Efficient:** Limited snapshot history
- **CPU Optimized:** Minimal per-frame calculations
- **Network Resilient:** Handles packet loss gracefully

### Server Scalability
- **100+ Players:** Tested concurrent capacity
- **Spatial Queries:** O(1) proximity lookups
- **Delta Processing:** Minimal CPU overhead
- **Memory Management:** Automatic cleanup

## Configuration

### Server Configuration
```javascript
// Interest Management
interestManager.config = {
    defaultViewRadius: 300,
    maxViewRadius: 500,
    updateInterval: 100,
    maxEntitiesPerPlayer: 100
};

// Snapshot System
snapshotSystem.config = {
    snapshotRate: 20,
    maxEntitiesPerSnapshot: 200,
    compressionEnabled: true
};

// Delta Compression
deltaCompressor.config = {
    positionThreshold: 0.1,
    healthThreshold: 1,
    maxDeltaSize: 1024
};
```

### Client Configuration
```javascript
// Snapshot Handler
snapshotHandler.config = {
    maxHistorySize: 10,
    interpolationDelay: 100,
    enablePrediction: true
};

// Interpolation System
interpolationSystem.config = {
    interpolationDelay: 100,
    maxExtrapolationTime: 500,
    smoothingFactor: 0.1,
    targetFPS: 60
};
```

## Integration with ECS

### Network-ECS Bridge
The networking system integrates seamlessly with the ECS architecture:

- **Interest Management** uses ECS Component Manager for entity queries
- **Snapshot System** reads ECS component states
- **Spatial Grid** provides efficient proximity queries
- **Entity Templates** ensure consistent data structures

### ECS Network Components
```javascript
// Network-relevant ECS components
const networkComponents = {
    position: { x, y },           // Required for interest
    velocity: { vx, vy },         // Required for interpolation
    health: { hp, maxHp },       // Required for state sync
    combat: { level, attack }     // Optional combat info
};
```

## Debugging and Monitoring

### Performance Metrics
- **Server:** Snapshot generation time, compression ratio, bandwidth usage
- **Client:** Interpolation performance, network latency, packet loss
- **Network:** Entity count per player, update frequency, error rates

### Debug Tools
```javascript
// Server debug
const networkStats = {
    interest: interestManager.getStats(),
    snapshots: snapshotSystem.getStats(),
    compression: deltaCompressor.getStats()
};

// Client debug
const clientStats = {
    snapshots: snapshotHandler.getStats(),
    interpolation: interpolationSystem.getStats()
};
```

## Usage Examples

### Basic Server Setup
```javascript
// Initialize network systems
const interestManager = new InterestManager(spatialGrid, componentManager);
const snapshotSystem = new SnapshotSystem(componentManager, interestManager);
const deltaCompressor = new DeltaCompressor();

// Add to game loop
gameLoop.interestManager = interestManager;
gameLoop.snapshotSystem = snapshotSystem;
gameLoop.deltaCompressor = deltaCompressor;
```

### Client Setup
```javascript
// Initialize client networking
const snapshotHandler = new SnapshotHandler(gameEngine);
const interpolationSystem = new InterpolationSystem(gameEngine);

// Setup network handlers
snapshotHandler.initialize();

// In game loop
function render() {
    interpolationSystem.update(entities);
    // Render interpolated positions
}
```

## Benefits

### Multiplayer Performance
- **Scalable Architecture:** Supports 100+ concurrent players
- **Bandwidth Efficient:** 60-90% reduction with delta compression
- **Smooth Gameplay:** 60 FPS interpolated movement
- **Low Latency:** Optimized snapshot delivery

### Developer Experience
- **Easy Integration:** Drop-in replacement for existing systems
- **Comprehensive Debugging:** Detailed performance metrics
- **Flexible Configuration:** Tunable for different game types
- **Robust Error Handling:** Graceful degradation

## Future Enhancements

### Planned Features
- **Advanced Prediction:** Client-side movement prediction
- **Lag Compensation:** Server-side rewind for competitive play
- **Network Prioritization:** Critical entity updates first
- **Adaptive Quality:** Dynamic snapshot rates based on connection
- **Zone-based Interest:** Hierarchical interest management

### Performance Targets
- **200+ Players:** Next scalability target
- **30% Bandwidth Reduction:** Advanced compression
- <50ms **Latency:** Optimized delivery pipeline
- **120 FPS Client:** High-refresh-rate support

## Troubleshooting

### Common Issues
- **Entity Jitter:** Increase interpolation delay
- **High Bandwidth:** Reduce view radius or increase thresholds
- **Packet Loss:** Implement client-side prediction
- **Memory Usage:** Reduce history size or cleanup frequency

### Performance Tuning
- **Server:** Adjust snapshot rate and entity limits
- **Client:** Tune interpolation delay and smoothing
- **Network:** Optimize compression thresholds
- **Rendering:** Balance quality vs performance
