/**
 * Player Movement System - Multiplayer Movement Validation and Broadcasting
 * Handles real-time player movement with validation and synchronization
 * Version 0.3 - First Playable Gameplay Loop
 */

class PlayerMovement {
    constructor(worldManager, database) {
        this.worldManager = worldManager;
        this.database = database;
        
        // Movement configuration
        this.config = {
            updateRate: 20, // 50ms = 20 updates per second
            maxSpeed: 5.0, // units per second
            acceleration: 10.0, // units per second²
            friction: 8.0, // friction coefficient
            
            // Validation thresholds
            maxDistancePerUpdate: 2.0, // max distance per update
            maxTeleportDistance: 50.0, // max teleport distance without validation
            positionHistorySize: 10, // positions to keep for validation
            
            // Broadcasting
            broadcastRadius: 200, // units
            interpolationDelay: 100, // ms
            
            // Cheating detection
            speedHackThreshold: 1.5, // 50% above max speed
            teleportHackThreshold: 100, // units
            violationThreshold: 5, // violations before action
            violationCooldown: 30000 // 30 seconds
        };
        
        // Player movement states
        this.playerStates = new Map(); // playerId -> MovementState
        this.positionHistory = new Map(); // playerId -> Array<Position>
        this.movementViolations = new Map(); // playerId -> ViolationCount
        
        // Movement queue for processing
        this.movementQueue = [];
        this.processingMovement = false;
        
        // Last broadcast positions
        this.lastBroadcastPositions = new Map(); // playerId -> Position
        
        // Statistics
        this.movementStats = {
            totalMovements: 0,
            validMovements: 0,
            invalidMovements: 0,
            teleports: 0,
            speedViolations: 0,
            positionViolations: 0,
            averageLatency: 0
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start movement processing loop
        this.startMovementLoop();
        
        // Start broadcast loop
        this.startBroadcastLoop();
        
        // Start validation loop
        this.startValidationLoop();
        
        console.log('Player Movement System initialized');
    }
    
    setupEventHandlers() {
        // Listen to player connections
        this.worldManager.on('playerConnected', (playerId) => {
            this.onPlayerConnected(playerId);
        });
        
        this.worldManager.on('playerDisconnected', (playerId) => {
            this.onPlayerDisconnected(playerId);
        });
        
        // Listen to player movement requests
        this.worldManager.on('playerMovement', (playerId, movementData) => {
            this.onPlayerMovement(playerId, movementData);
        });
    }
    
    startMovementLoop() {
        setInterval(() => {
            this.processMovementQueue();
        }, 1000 / this.config.updateRate);
    }
    
    startBroadcastLoop() {
        setInterval(() => {
            this.broadcastPlayerPositions();
        }, 50); // 20 broadcasts per second
    }
    
    startValidationLoop() {
        setInterval(() => {
            this.validatePlayerMovements();
        }, 1000); // Validate every second
    }
    
    // Player state management
    onPlayerConnected(playerId) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return;
        
        // Initialize movement state
        const state = {
            playerId: playerId,
            position: { x: player.x || 0, y: player.y || 0 },
            velocity: { x: 0, y: 0 },
            direction: player.direction || 'down',
            speed: player.speed || this.config.maxSpeed,
            
            // Movement flags
            isMoving: false,
            isSprinting: false,
            isJumping: false,
            
            // Timestamps
            lastUpdate: Date.now(),
            lastBroadcast: Date.now(),
            lastValidation: Date.now(),
            
            // Input state
            input: {
                up: false,
                down: false,
                left: false,
                right: false,
                sprint: false
            },
            
            // Server-side prediction
            serverPosition: { x: player.x || 0, y: player.y || 0 },
            lastCorrection: Date.now(),
            
            // Network info
            latency: 0,
            packetLoss: 0
        };
        
        this.playerStates.set(playerId, state);
        this.positionHistory.set(playerId, []);
        this.movementViolations.set(playerId, {
            count: 0,
            lastViolation: 0,
            violations: []
        });
        
        console.log(`Player ${player.name} movement state initialized`);
    }
    
    onPlayerDisconnected(playerId) {
        // Clean up player data
        this.playerStates.delete(playerId);
        this.positionHistory.delete(playerId);
        this.movementViolations.delete(playerId);
        this.lastBroadcastPositions.delete(playerId);
        
        // Notify other players
        this.broadcastPlayerLeft(playerId);
    }
    
    // Movement processing
    onPlayerMovement(playerId, movementData) {
        const state = this.playerStates.get(playerId);
        if (!state) return;
        
        // Add to movement queue
        this.movementQueue.push({
            playerId: playerId,
            data: movementData,
            timestamp: Date.now()
        });
    }
    
    processMovementQueue() {
        if (this.processingMovement || this.movementQueue.length === 0) return;
        
        this.processingMovement = true;
        
        try {
            // Process movements in order
            const movements = this.movementQueue.splice(0);
            
            for (const movement of movements) {
                this.processMovement(movement.playerId, movement.data, movement.timestamp);
            }
        } finally {
            this.processingMovement = false;
        }
    }
    
    processMovement(playerId, movementData, timestamp) {
        const state = this.playerStates.get(playerId);
        if (!state) return;
        
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return;
        
        // Update input state
        if (movementData.input) {
            state.input = { ...state.input, ...movementData.input };
        }
        
        // Calculate new position based on input
        const newPosition = this.calculateNewPosition(state, movementData);
        
        // Validate movement
        const validation = this.validateMovement(playerId, state.position, newPosition, movementData);
        
        if (validation.isValid) {
            // Apply movement
            state.position = newPosition;
            state.velocity = validation.velocity;
            state.direction = validation.direction;
            state.isMoving = validation.isMoving;
            
            // Update player object
            player.x = newPosition.x;
            player.y = newPosition.y;
            player.direction = validation.direction;
            
            // Add to position history
            this.addToPositionHistory(playerId, newPosition, timestamp);
            
            // Update statistics
            this.movementStats.totalMovements++;
            this.movementStats.validMovements++;
            
        } else {
            // Handle invalid movement
            this.handleInvalidMovement(playerId, validation);
        }
        
        state.lastUpdate = timestamp;
    }
    
    calculateNewPosition(state, movementData) {
        const deltaTime = 0.05; // 50ms fixed timestep
        let newX = state.position.x;
        let newY = state.position.y;
        let newVelocityX = state.velocity.x;
        let newVelocityY = state.velocity.y;
        
        // Calculate movement vector from input
        let moveX = 0;
        let moveY = 0;
        
        if (state.input.up) moveY -= 1;
        if (state.input.down) moveY += 1;
        if (state.input.left) moveX -= 1;
        if (state.input.right) moveX += 1;
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707; // 1/sqrt(2)
            moveY *= 0.707;
        }
        
        // Apply speed
        const currentSpeed = state.input.sprint ? state.speed * 1.5 : state.speed;
        const targetVelocityX = moveX * currentSpeed;
        const targetVelocityY = moveY * currentSpeed;
        
        // Apply acceleration
        const accelX = (targetVelocityX - newVelocityX) * this.config.acceleration * deltaTime;
        const accelY = (targetVelocityY - newVelocityY) * this.config.acceleration * deltaTime;
        
        newVelocityX += accelX;
        newVelocityY += accelY;
        
        // Apply friction
        if (moveX === 0) {
            newVelocityX *= Math.pow(this.config.friction, deltaTime);
        }
        if (moveY === 0) {
            newVelocityY *= Math.pow(this.config.friction, deltaTime);
        }
        
        // Update position
        newX += newVelocityX * deltaTime;
        newY += newVelocityY * deltaTime;
        
        // Get current region and validate boundaries
        const regionId = this.worldManager.playerRegions.get(playerId);
        const region = this.worldManager.regions.get(regionId);
        
        if (region) {
            // Clamp to region boundaries
            newX = Math.max(region.bounds.x, Math.min(region.bounds.x + region.bounds.width, newX));
            newY = Math.max(region.bounds.y, Math.min(region.bounds.y + region.bounds.height, newY));
            
            // Check collision with obstacles (simplified)
            const collision = this.checkCollision(newX, newY, region);
            if (collision) {
                newX = state.position.x;
                newY = state.position.y;
                newVelocityX = 0;
                newVelocityY = 0;
            }
        }
        
        return {
            x: newX,
            y: newY,
            velocity: { x: newVelocityX, y: newVelocityY },
            direction: this.calculateDirection(moveX, moveY, state.direction),
            isMoving: moveX !== 0 || moveY !== 0
        };
    }
    
    validateMovement(playerId, oldPosition, newPosition, movementData) {
        const distance = Math.sqrt(
            Math.pow(newPosition.x - oldPosition.x, 2) + 
            Math.pow(newPosition.y - oldPosition.y, 2)
        );
        
        // Check maximum distance per update
        if (distance > this.config.maxDistancePerUpdate) {
            return {
                isValid: false,
                reason: 'distance_exceeded',
                distance: distance,
                maxAllowed: this.config.maxDistancePerUpdate
            };
        }
        
        // Check for teleport (could be legitimate)
        if (distance > this.config.maxTeleportDistance) {
            return {
                isValid: false,
                reason: 'teleport_detected',
                distance: distance,
                teleportThreshold: this.config.maxTeleportDistance
            };
        }
        
        // Check speed consistency
        const speed = Math.sqrt(
            Math.pow(newPosition.velocity.x, 2) + 
            Math.pow(newPosition.velocity.y, 2)
        );
        
        if (speed > this.config.maxSpeed * this.config.speedHackThreshold) {
            return {
                isValid: false,
                reason: 'speed_hack',
                speed: speed,
                maxAllowed: this.config.maxSpeed * this.config.speedHackThreshold
            };
        }
        
        return {
            isValid: true,
            velocity: newPosition.velocity,
            direction: newPosition.direction,
            isMoving: newPosition.isMoving
        };
    }
    
    handleInvalidMovement(playerId, validation) {
        const violations = this.movementViolations.get(playerId);
        const player = this.worldManager.connectedPlayers.get(playerId);
        
        if (!player || !violations) return;
        
        // Record violation
        violations.count++;
        violations.lastViolation = Date.now();
        violations.violations.push({
            timestamp: Date.now(),
            reason: validation.reason,
            details: validation
        });
        
        // Keep only recent violations
        if (violations.violations.length > 10) {
            violations.violations.shift();
        }
        
        // Update statistics
        this.movementStats.invalidMovements++;
        
        switch (validation.reason) {
            case 'distance_exceeded':
                this.movementStats.positionViolations++;
                break;
            case 'speed_hack':
                this.movementStats.speedViolations++;
                break;
            case 'teleport_detected':
                this.movementStats.teleports++;
                // Teleports might be legitimate (respawn, teleport spells, etc.)
                // Allow them but log for investigation
                break;
        }
        
        // Take action if too many violations
        if (violations.count >= this.config.violationThreshold) {
            this.handleCheatingPlayer(playerId, violations);
        }
        
        // Send correction to player
        this.sendPositionCorrection(playerId, validation);
    }
    
    handleCheatingPlayer(playerId, violations) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return;
        
        // Log cheating attempt
        console.warn(`Player ${player.name} (${playerId}) suspected of cheating. Violations: ${violations.count}`);
        
        // Send warning to player
        this.worldManager.sendToPlayer(playerId, {
            type: 'movement_warning',
            message: 'Movimento anormal detectado. Por favor, jogue de forma justa.',
            violations: violations.count
        });
        
        // Could implement temporary kick, ban, or other penalties here
        // For now, just reset violation count after cooldown
        setTimeout(() => {
            violations.count = 0;
        }, this.config.violationCooldown);
    }
    
    sendPositionCorrection(playerId, validation) {
        const state = this.playerStates.get(playerId);
        if (!state) return;
        
        this.worldManager.sendToPlayer(playerId, {
            type: 'position_correction',
            position: state.position,
            reason: validation.reason,
            message: 'Posição corrigida pelo servidor.'
        });
    }
    
    // Broadcasting
    broadcastPlayerPositions() {
        const now = Date.now();
        
        for (const [playerId, state] of this.playerStates) {
            // Check if enough time has passed since last broadcast
            if (now - state.lastBroadcast < this.config.interpolationDelay) continue;
            
            // Check if position changed significantly
            const lastBroadcast = this.lastBroadcastPositions.get(playerId);
            if (lastBroadcast) {
                const distance = Math.sqrt(
                    Math.pow(state.position.x - lastBroadcast.x, 2) + 
                    Math.pow(state.position.y - lastBroadcast.y, 2)
                );
                
                if (distance < 0.1) continue; // Don't broadcast tiny movements
            }
            
            // Find nearby players
            const nearbyPlayers = this.getNearbyPlayers(playerId, this.config.broadcastRadius);
            
            if (nearbyPlayers.length > 0) {
                const broadcastData = {
                    type: 'player_position_update',
                    playerId: playerId,
                    position: state.position,
                    direction: state.direction,
                    velocity: state.velocity,
                    isMoving: state.isMoving,
                    timestamp: now
                };
                
                // Send to nearby players
                for (const nearbyId of nearbyPlayers) {
                    if (nearbyId !== playerId) {
                        this.worldManager.sendToPlayer(nearbyId, broadcastData);
                    }
                }
                
                // Update last broadcast position
                this.lastBroadcastPositions.set(playerId, { ...state.position });
                state.lastBroadcast = now;
            }
        }
    }
    
    getNearbyPlayers(playerId, radius) {
        const state = this.playerStates.get(playerId);
        if (!state) return [];
        
        const nearby = [];
        
        for (const [otherId, otherState] of this.playerStates) {
            if (otherId === playerId) continue;
            
            const distance = Math.sqrt(
                Math.pow(state.position.x - otherState.position.x, 2) + 
                Math.pow(state.position.y - otherState.position.y, 2)
            );
            
            if (distance <= radius) {
                nearby.push(otherId);
            }
        }
        
        return nearby;
    }
    
    broadcastPlayerLeft(playerId) {
        const nearbyPlayers = this.getNearbyPlayers(playerId, this.config.broadcastRadius * 2);
        
        for (const nearbyId of nearbyPlayers) {
            this.worldManager.sendToPlayer(nearbyId, {
                type: 'player_left',
                playerId: playerId,
                timestamp: Date.now()
            });
        }
    }
    
    // Validation and cheating detection
    validatePlayerMovements() {
        const now = Date.now();
        
        for (const [playerId, history] of this.positionHistory) {
            if (history.length < 3) continue;
            
            // Analyze movement patterns
            const recent = history.slice(-10); // Last 10 positions
            const analysis = this.analyzeMovementPattern(recent);
            
            if (analysis.isSuspicious) {
                this.handleSuspiciousMovement(playerId, analysis);
            }
        }
    }
    
    analyzeMovementPattern(positions) {
        if (positions.length < 3) {
            return { isSuspicious: false };
        }
        
        let totalDistance = 0;
        let maxSpeed = 0;
        let teleportCount = 0;
        
        for (let i = 1; i < positions.length; i++) {
            const distance = Math.sqrt(
                Math.pow(positions[i].x - positions[i-1].x, 2) + 
                Math.pow(positions[i].y - positions[i-1].y, 2)
            );
            
            totalDistance += distance;
            
            const timeDiff = positions[i].timestamp - positions[i-1].timestamp;
            if (timeDiff > 0) {
                const speed = distance / (timeDiff / 1000);
                maxSpeed = Math.max(maxSpeed, speed);
                
                if (distance > this.config.maxTeleportDistance) {
                    teleportCount++;
                }
            }
        }
        
        // Check for suspicious patterns
        const avgSpeed = totalDistance / ((positions[positions.length - 1].timestamp - positions[0].timestamp) / 1000);
        const isSuspicious = (
            maxSpeed > this.config.maxSpeed * this.config.speedHackThreshold ||
            teleportCount > 0 ||
            avgSpeed > this.config.maxSpeed * 1.2
        );
        
        return {
            isSuspicious,
            maxSpeed,
            avgSpeed,
            teleportCount,
            totalDistance
        };
    }
    
    handleSuspiciousMovement(playerId, analysis) {
        const violations = this.movementViolations.get(playerId);
        if (!violations) return;
        
        console.warn(`Suspicious movement detected for player ${playerId}:`, analysis);
        
        // Could implement additional checks or penalties here
        // For now, just log the analysis
    }
    
    // Utility methods
    addToPositionHistory(playerId, position, timestamp) {
        if (!this.positionHistory.has(playerId)) {
            this.positionHistory.set(playerId, []);
        }
        
        const history = this.positionHistory.get(playerId);
        history.push({
            x: position.x,
            y: position.y,
            timestamp: timestamp
        });
        
        // Keep only recent positions
        if (history.length > this.config.positionHistorySize) {
            history.shift();
        }
    }
    
    calculateDirection(moveX, moveY, currentDirection) {
        if (moveX === 0 && moveY === 0) {
            return currentDirection;
        }
        
        const angle = Math.atan2(moveY, moveX);
        const degrees = angle * (180 / Math.PI);
        
        // Convert angle to direction
        if (degrees >= -22.5 && degrees < 22.5) {
            return 'right';
        } else if (degrees >= 22.5 && degrees < 67.5) {
            return 'down-right';
        } else if (degrees >= 67.5 && degrees < 112.5) {
            return 'down';
        } else if (degrees >= 112.5 && degrees < 157.5) {
            return 'down-left';
        } else if (degrees >= 157.5 || degrees < -157.5) {
            return 'left';
        } else if (degrees >= -157.5 && degrees < -112.5) {
            return 'up-left';
        } else if (degrees >= -112.5 && degrees < -67.5) {
            return 'up';
        } else if (degrees >= -67.5 && degrees < -22.5) {
            return 'up-right';
        }
        
        return currentDirection;
    }
    
    checkCollision(x, y, region) {
        // Simplified collision detection
        // In a real implementation, this would check against actual obstacles
        
        // Check region boundaries
        if (x < region.bounds.x || x > region.bounds.x + region.bounds.width ||
            y < region.bounds.y || y > region.bounds.y + region.bounds.height) {
            return true;
        }
        
        // Check for obstacles (simplified - could be trees, rocks, buildings, etc.)
        for (const obstacle of region.obstacles || []) {
            const distance = Math.sqrt(
                Math.pow(x - obstacle.x, 2) + 
                Math.pow(y - obstacle.y, 2)
            );
            
            if (distance < obstacle.radius) {
                return true;
            }
        }
        
        return false;
    }
    
    // Public API
    getPlayerPosition(playerId) {
        const state = this.playerStates.get(playerId);
        return state ? { ...state.position } : null;
    }
    
    getPlayerState(playerId) {
        const state = this.playerStates.get(playerId);
        return state ? { ...state } : null;
    }
    
    getNearbyPlayersForPlayer(playerId) {
        return this.getNearbyPlayers(playerId, this.config.broadcastRadius);
    }
    
    setPlayerSpeed(playerId, speed) {
        const state = this.playerStates.get(playerId);
        if (state) {
            state.speed = Math.max(0, Math.min(this.config.maxSpeed * 2, speed));
        }
    }
    
    teleportPlayer(playerId, x, y, reason = 'teleport') {
        const state = this.playerStates.get(playerId);
        const player = this.worldManager.connectedPlayers.get(playerId);
        
        if (!state || !player) return false;
        
        // Update position
        const oldPosition = { ...state.position };
        state.position = { x, y };
        state.velocity = { x: 0, y: 0 };
        
        player.x = x;
        player.y = y;
        
        // Clear position history to avoid false positives
        this.positionHistory.set(playerId, []);
        
        // Add to history
        this.addToPositionHistory(playerId, { x, y }, Date.now());
        
        // Broadcast teleport
        const nearbyPlayers = this.getNearbyPlayers(playerId, this.config.broadcastRadius * 2);
        for (const nearbyId of nearbyPlayers) {
            this.worldManager.sendToPlayer(nearbyId, {
                type: 'player_teleported',
                playerId: playerId,
                position: { x, y },
                reason: reason,
                timestamp: Date.now()
            });
        }
        
        // Notify player
        this.worldManager.sendToPlayer(playerId, {
            type: 'teleported',
            position: { x, y },
            reason: reason
        });
        
        console.log(`Player ${player.name} teleported to (${x}, ${y}) - ${reason}`);
        return true;
    }
    
    getMovementStatistics() {
        return {
            ...this.movementStats,
            activePlayers: this.playerStates.size,
            averageSpeed: this.calculateAverageSpeed()
        };
    }
    
    calculateAverageSpeed() {
        if (this.playerStates.size === 0) return 0;
        
        let totalSpeed = 0;
        let movingPlayers = 0;
        
        for (const state of this.playerStates.values()) {
            if (state.isMoving) {
                const speed = Math.sqrt(
                    Math.pow(state.velocity.x, 2) + 
                    Math.pow(state.velocity.y, 2)
                );
                totalSpeed += speed;
                movingPlayers++;
            }
        }
        
        return movingPlayers > 0 ? totalSpeed / movingPlayers : 0;
    }
    
    // Cleanup
    cleanup() {
        this.playerStates.clear();
        this.positionHistory.clear();
        this.movementViolations.clear();
        this.lastBroadcastPositions.clear();
        this.movementQueue = [];
    }
}

module.exports = PlayerMovement;
