/**
 * Player Movement System - Client-side Movement Input and Prediction
 * Handles player input, movement prediction, and position synchronization
 * Version 0.3 - First Playable Gameplay Loop
 */

class PlayerMovement {
    constructor(game) {
        this.game = game;
        this.socket = game.socket;
        
        // Movement configuration
        this.config = {
            speed: 100, // pixels per second
            sprintMultiplier: 1.5,
            acceleration: 200, // pixels per second²
            friction: 150, // pixels per second²
            
            // Input
            inputDelay: 50, // ms between input sends
            predictionBuffer: 3, // Number of positions to keep for prediction
            
            // Smoothing
            interpolationSpeed: 10,
            snapThreshold: 5, // pixels
            
            // Diagonal movement
            diagonalMultiplier: 0.707 // 1/sqrt(2)
        };
        
        // Player state
        this.player = {
            id: null,
            x: 0,
            y: 0,
            velocityX: 0,
            velocityY: 0,
            direction: 'down',
            speed: this.config.speed,
            isMoving: false,
            isSprinting: false
        };
        
        // Input state
        this.input = {
            up: false,
            down: false,
            left: false,
            right: false,
            sprint: false
        };
        
        // Movement prediction
        this.positionHistory = [];
        this.lastInputTime = 0;
        this.lastServerPosition = null;
        this.clientSidePrediction = true;
        
        // Other players
        this.otherPlayers = new Map();
        
        // Animation
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
        
        // Performance
        this.lastUpdateTime = 0;
        this.targetFPS = 60;
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Setup keyboard input
        this.setupKeyboardInput();
        
        // Setup mouse input
        this.setupMouseInput();
        
        // Setup network events
        this.setupNetworkEvents();
        
        // Start movement loop
        this.startMovementLoop();
        
        console.log('Player Movement System initialized');
    }
    
    setupKeyboardInput() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
    }
    
    setupMouseInput() {
        // Right-click for movement to position
        this.game.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        
        // Left-click for attack/interaction
        this.game.canvas.addEventListener('click', (e) => {
            this.handleLeftClick(e);
        });
    }
    
    setupNetworkEvents() {
        // Server position updates
        this.socket.on('position_update', (data) => {
            this.onServerPositionUpdate(data);
        });
        
        // Position correction
        this.socket.on('position_correction', (data) => {
            this.onPositionCorrection(data);
        });
        
        // Other player position updates
        this.socket.on('player_position_update', (data) => {
            this.onOtherPlayerPositionUpdate(data);
        });
        
        // Player joined
        this.socket.on('player_joined', (data) => {
            this.onPlayerJoined(data);
        });
        
        // Player left
        this.socket.on('player_left', (data) => {
            this.onPlayerLeft(data);
        });
        
        // Player teleported
        this.socket.on('player_teleported', (data) => {
            this.onPlayerTeleported(data);
        });
        
        // Movement warning
        this.socket.on('movement_warning', (data) => {
            this.onMovementWarning(data);
        });
    }
    
    startMovementLoop() {
        const update = (currentTime) => {
            const deltaTime = currentTime - this.lastUpdateTime;
            const targetFrameTime = 1000 / this.targetFPS;
            
            if (deltaTime >= targetFrameTime) {
                this.update(deltaTime);
                this.lastUpdateTime = currentTime;
            }
            
            requestAnimationFrame(update);
        };
        
        requestAnimationFrame(update);
    }
    
    // Input handlers
    handleKeyDown(e) {
        let inputChanged = false;
        
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                if (!this.input.up) {
                    this.input.up = true;
                    inputChanged = true;
                }
                break;
            case 's':
            case 'arrowdown':
                if (!this.input.down) {
                    this.input.down = true;
                    inputChanged = true;
                }
                break;
            case 'a':
            case 'arrowleft':
                if (!this.input.left) {
                    this.input.left = true;
                    inputChanged = true;
                }
                break;
            case 'd':
            case 'arrowright':
                if (!this.input.right) {
                    this.input.right = true;
                    inputChanged = true;
                }
                break;
            case 'shift':
                if (!this.input.sprint) {
                    this.input.sprint = true;
                    inputChanged = true;
                }
                break;
        }
        
        if (inputChanged) {
            e.preventDefault();
            this.onInputChange();
        }
    }
    
    handleKeyUp(e) {
        let inputChanged = false;
        
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                if (this.input.up) {
                    this.input.up = false;
                    inputChanged = true;
                }
                break;
            case 's':
            case 'arrowdown':
                if (this.input.down) {
                    this.input.down = false;
                    inputChanged = true;
                }
                break;
            case 'a':
            case 'arrowleft':
                if (this.input.left) {
                    this.input.left = false;
                    inputChanged = true;
                }
                break;
            case 'd':
            case 'arrowright':
                if (this.input.right) {
                    this.input.right = false;
                    inputChanged = true;
                }
                break;
            case 'shift':
                if (this.input.sprint) {
                    this.input.sprint = false;
                    inputChanged = true;
                }
                break;
        }
        
        if (inputChanged) {
            e.preventDefault();
            this.onInputChange();
        }
    }
    
    handleRightClick(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to world coordinates
        const worldX = x + this.game.camera.x;
        const worldY = y + this.game.camera.y;
        
        // Move to position (could implement pathfinding later)
        this.moveToPosition(worldX, worldY);
    }
    
    handleLeftClick(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to world coordinates
        const worldX = x + this.game.camera.x;
        const worldY = y + this.game.camera.y;
        
        // Check if clicking on entity
        const clickedEntity = this.getEntityAtPosition(worldX, worldY);
        if (clickedEntity) {
            this.handleEntityInteraction(clickedEntity);
        }
    }
    
    // Movement update
    update(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Update player movement
        this.updatePlayerMovement(dt);
        
        // Update other players
        this.updateOtherPlayers(dt);
        
        // Update animations
        this.updateAnimations(dt);
        
        // Send input to server if needed
        this.sendInputToServer();
    }
    
    updatePlayerMovement(dt) {
        // Calculate movement vector
        let moveX = 0;
        let moveY = 0;
        
        if (this.input.up) moveY -= 1;
        if (this.input.down) moveY += 1;
        if (this.input.left) moveX -= 1;
        if (this.input.right) moveX += 1;
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            moveX *= this.config.diagonalMultiplier;
            moveY *= this.config.diagonalMultiplier;
        }
        
        // Calculate target velocity
        const currentSpeed = this.input.sprint ? this.player.speed * this.config.sprintMultiplier : this.player.speed;
        const targetVelocityX = moveX * currentSpeed;
        const targetVelocityY = moveY * currentSpeed;
        
        // Apply acceleration
        const accelX = (targetVelocityX - this.player.velocityX) * this.config.acceleration * dt;
        const accelY = (targetVelocityY - this.player.velocityY) * this.config.acceleration * dt;
        
        this.player.velocityX += accelX;
        this.player.velocityY += accelY;
        
        // Apply friction
        if (moveX === 0) {
            this.player.velocityX *= Math.pow(this.config.friction / this.config.acceleration, dt);
        }
        if (moveY === 0) {
            this.player.velocityY *= Math.pow(this.config.friction / this.config.acceleration, dt);
        }
        
        // Update position
        const newX = this.player.x + this.player.velocityX * dt;
        const newY = this.player.y + this.player.velocityY * dt;
        
        // Check boundaries (simple)
        const boundedX = Math.max(0, Math.min(this.game.world.width, newX));
        const boundedY = Math.max(0, Math.min(this.game.world.height, newY));
        
        // Update player position
        this.player.x = boundedX;
        this.player.y = boundedY;
        
        // Update direction
        if (moveX !== 0 || moveY !== 0) {
            this.player.direction = this.calculateDirection(moveX, moveY);
            this.player.isMoving = true;
        } else {
            this.player.isMoving = false;
        }
        
        this.player.isSprinting = this.input.sprint;
        
        // Update camera to follow player
        this.updateCamera();
    }
    
    updateOtherPlayers(dt) {
        for (const [playerId, playerData] of this.otherPlayers) {
            if (playerData.targetPosition) {
                // Interpolate to target position
                const dx = playerData.targetPosition.x - playerData.x;
                const dy = playerData.targetPosition.y - playerData.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > this.config.snapThreshold) {
                    const moveSpeed = Math.min(distance, this.config.interpolationSpeed);
                    const moveX = (dx / distance) * moveSpeed * dt;
                    const moveY = (dy / distance) * moveSpeed * dt;
                    
                    playerData.x += moveX;
                    playerData.y += moveY;
                } else {
                    // Snap to position if close enough
                    playerData.x = playerData.targetPosition.x;
                    playerData.y = playerData.targetPosition.y;
                    playerData.targetPosition = null;
                }
            }
            
            // Update animation
            if (playerData.isMoving) {
                playerData.animationFrame += this.animationSpeed * dt;
                if (playerData.animationFrame >= 1) {
                    playerData.animationFrame = 0;
                }
            } else {
                playerData.animationFrame = 0;
            }
        }
    }
    
    updateAnimations(dt) {
        // Update player animation
        if (this.player.isMoving) {
            this.animationFrame += this.animationSpeed * dt;
            if (this.animationFrame >= 1) {
                this.animationFrame = 0;
            }
        } else {
            this.animationFrame = 0;
        }
    }
    
    updateCamera() {
        // Simple camera follow
        const targetX = this.player.x - this.game.canvas.width / 2;
        const targetY = this.player.y - this.game.canvas.height / 2;
        
        // Smooth camera movement
        this.game.camera.x += (targetX - this.game.camera.x) * 0.1;
        this.game.camera.y += (targetY - this.game.camera.y) * 0.1;
        
        // Clamp camera to world bounds
        this.game.camera.x = Math.max(0, Math.min(this.game.world.width - this.game.canvas.width, this.game.camera.x));
        this.game.camera.y = Math.max(0, Math.min(this.game.world.height - this.game.canvas.height, this.game.camera.y));
    }
    
    // Network communication
    onInputChange() {
        // Send input to server with throttling
        const now = Date.now();
        if (now - this.lastInputTime >= this.config.inputDelay) {
            this.sendInputToServer();
            this.lastInputTime = now;
        }
    }
    
    sendInputToServer() {
        if (!this.player.id) return;
        
        const movementData = {
            input: { ...this.input },
            position: {
                x: this.player.x,
                y: this.player.y
            },
            velocity: {
                x: this.player.velocityX,
                y: this.player.velocityY
            },
            direction: this.player.direction,
            timestamp: Date.now()
        };
        
        // Add to position history for prediction
        this.positionHistory.push({
            position: { x: this.player.x, y: this.player.y },
            input: { ...this.input },
            timestamp: Date.now()
        });
        
        // Keep only recent positions
        if (this.positionHistory.length > this.config.predictionBuffer) {
            this.positionHistory.shift();
        }
        
        this.socket.emit('playerMovement', movementData);
    }
    
    // Network event handlers
    onServerPositionUpdate(data) {
        if (data.playerId === this.player.id) {
            // This is our own position update
            this.lastServerPosition = {
                x: data.position.x,
                y: data.position.y,
                timestamp: data.timestamp
            };
            
            // Client-side prediction reconciliation
            if (this.clientSidePrediction) {
                this.reconcilePosition(data);
            }
        } else {
            // Other player update
            this.updateOtherPlayerPosition(data);
        }
    }
    
    onPositionCorrection(data) {
        // Server corrected our position
        this.player.x = data.position.x;
        this.player.y = data.position.y;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        
        // Clear prediction history
        this.positionHistory = [];
        
        // Show warning message
        this.game.showNotification(data.message, 'warning');
    }
    
    onOtherPlayerPositionUpdate(data) {
        const playerData = this.otherPlayers.get(data.playerId);
        if (!playerData) return;
        
        playerData.targetPosition = {
            x: data.position.x,
            y: data.position.y
        };
        playerData.direction = data.direction;
        playerData.isMoving = data.isMoving;
        playerData.velocity = data.velocity;
    }
    
    onPlayerJoined(data) {
        this.otherPlayers.set(data.playerId, {
            id: data.playerId,
            name: data.name,
            x: data.x,
            y: data.y,
            direction: data.direction || 'down',
            isMoving: false,
            animationFrame: 0,
            targetPosition: null,
            velocity: { x: 0, y: 0 }
        });
        
        this.game.showNotification(`${data.name} joined the game`, 'info');
    }
    
    onPlayerLeft(data) {
        this.otherPlayers.delete(data.playerId);
        this.game.showNotification(`Player left the game`, 'info');
    }
    
    onPlayerTeleported(data) {
        if (data.playerId === this.player.id) {
            // We were teleported
            this.player.x = data.position.x;
            this.player.y = data.position.y;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
            this.positionHistory = [];
            
            this.game.showNotification(`Teleported: ${data.reason}`, 'info');
        } else {
            // Another player was teleported
            const playerData = this.otherPlayers.get(data.playerId);
            if (playerData) {
                playerData.x = data.position.x;
                playerData.y = data.position.y;
                playerData.targetPosition = null;
            }
        }
    }
    
    onMovementWarning(data) {
        this.game.showNotification(data.message, 'warning');
    }
    
    // Utility methods
    calculateDirection(moveX, moveY) {
        if (moveX === 0 && moveY === 0) {
            return this.player.direction;
        }
        
        const angle = Math.atan2(moveY, moveX);
        const degrees = angle * (180 / Math.PI);
        
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
        
        return this.player.direction;
    }
    
    reconcilePosition(serverData) {
        // Find the position in our history that matches the server timestamp
        const serverTime = serverData.timestamp;
        let reconciledPosition = null;
        
        for (let i = this.positionHistory.length - 1; i >= 0; i--) {
            const history = this.positionHistory[i];
            if (history.timestamp <= serverTime) {
                reconciledPosition = history;
                break;
            }
        }
        
        if (reconciledPosition) {
            // Calculate position difference
            const serverX = serverData.position.x;
            const serverY = serverData.position.y;
            const clientX = reconciledPosition.position.x;
            const clientY = reconciledPosition.position.y;
            
            const diffX = serverX - clientX;
            const diffY = serverY - clientY;
            const distance = Math.sqrt(diffX * diffX + diffY * diffY);
            
            // If difference is significant, apply correction
            if (distance > this.config.snapThreshold) {
                // Apply correction
                this.player.x = serverX;
                this.player.y = serverY;
                
                // Replay inputs from that point forward
                this.replayInputsFrom(reconciledPosition.timestamp);
            }
        }
    }
    
    replayInputsFrom(fromTimestamp) {
        // Replay all inputs since the reconciled position
        for (const history of this.positionHistory) {
            if (history.timestamp > fromTimestamp) {
                // This would replay the movement calculation
                // For simplicity, we'll just trust the server position
            }
        }
    }
    
    updateOtherPlayerPosition(data) {
        let playerData = this.otherPlayers.get(data.playerId);
        
        if (!playerData) {
            // Create new player data
            playerData = {
                id: data.playerId,
                name: `Player ${data.playerId}`,
                x: data.position.x,
                y: data.position.y,
                direction: data.direction || 'down',
                isMoving: data.isMoving || false,
                animationFrame: 0,
                targetPosition: null,
                velocity: data.velocity || { x: 0, y: 0 }
            };
            this.otherPlayers.set(data.playerId, playerData);
        }
        
        // Update target position for interpolation
        playerData.targetPosition = {
            x: data.position.x,
            y: data.position.y
        };
        playerData.direction = data.direction;
        playerData.isMoving = data.isMoving;
        playerData.velocity = data.velocity || { x: 0, y: 0 };
    }
    
    moveToPosition(targetX, targetY) {
        // Simple move-to-position (could be enhanced with pathfinding)
        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            // Set input towards target
            this.input.up = dy < -5;
            this.input.down = dy > 5;
            this.input.left = dx < -5;
            this.input.right = dx > 5;
            
            this.onInputChange();
        }
    }
    
    getEntityAtPosition(x, y) {
        // Check if clicking on player
        for (const [playerId, playerData] of this.otherPlayers) {
            const distance = Math.sqrt(
                Math.pow(x - playerData.x, 2) + 
                Math.pow(y - playerData.y, 2)
            );
            if (distance < 20) {
                return { type: 'player', id: playerId, data: playerData };
            }
        }
        
        // Check if clicking on mob
        if (this.game.mobs) {
            for (const [mobId, mobData] of this.game.mobs) {
                const distance = Math.sqrt(
                    Math.pow(x - mobData.x, 2) + 
                    Math.pow(y - mobData.y, 2)
                );
                if (distance < 25) {
                    return { type: 'mob', id: mobId, data: mobData };
                }
            }
        }
        
        return null;
    }
    
    handleEntityInteraction(entity) {
        if (entity.type === 'mob') {
            // Attack mob
            this.game.attack(entity.id);
        } else if (entity.type === 'player') {
            // Could implement player interaction (trade, party invite, etc.)
            this.game.showNotification(`Clicked on ${entity.data.name}`, 'info');
        }
    }
    
    // Public API
    setPlayerId(playerId) {
        this.player.id = playerId;
    }
    
    setPlayerPosition(x, y) {
        this.player.x = x;
        this.player.y = y;
        this.updateCamera();
    }
    
    getPlayerPosition() {
        return {
            x: this.player.x,
            y: this.player.y
        };
    }
    
    getPlayerDirection() {
        return this.player.direction;
    }
    
    isMoving() {
        return this.player.isMoving;
    }
    
    stopMovement() {
        this.input.up = false;
        this.input.down = false;
        this.input.left = false;
        this.input.right = false;
        this.input.sprint = false;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isMoving = false;
    }
    
    setSpeed(speed) {
        this.player.speed = speed;
    }
    
    // Rendering
    render(ctx) {
        // Render other players
        this.renderOtherPlayers(ctx);
        
        // Render player (handled by main game renderer)
    }
    
    renderOtherPlayers(ctx) {
        for (const [playerId, playerData] of this.otherPlayers) {
            const screenX = playerData.x - this.game.camera.x;
            const screenY = playerData.y - this.game.camera.y;
            
            // Skip if outside screen
            if (screenX < -50 || screenX > this.game.canvas.width + 50 ||
                screenY < -50 || screenY > this.game.canvas.height + 50) {
                continue;
            }
            
            // Draw player sprite (simple rectangle for now)
            ctx.fillStyle = '#4488ff';
            ctx.fillRect(screenX - 10, screenY - 15, 20, 30);
            
            // Draw player name
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(playerData.name, screenX, screenY - 20);
            
            // Draw direction indicator
            this.drawDirectionIndicator(ctx, screenX, screenY, playerData.direction);
        }
    }
    
    drawDirectionIndicator(ctx, x, y, direction) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        switch (direction) {
            case 'up':
                ctx.moveTo(x, y - 15);
                ctx.lineTo(x, y - 25);
                break;
            case 'down':
                ctx.moveTo(x, y + 15);
                ctx.lineTo(x, y + 25);
                break;
            case 'left':
                ctx.moveTo(x - 10, y);
                ctx.lineTo(x - 20, y);
                break;
            case 'right':
                ctx.moveTo(x + 10, y);
                ctx.lineTo(x + 20, y);
                break;
        }
        
        ctx.stroke();
    }
}

export default PlayerMovement;
