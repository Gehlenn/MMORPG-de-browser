/**
 * Network Manager - Multiplayer Foundation
 * Handles WebSocket connections and message routing
 */

export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.isConnected = false;
        
        // Initialize connection
        this.connect();
    }
    
    connect() {
        // Verificar se Socket.IO está disponível
        if (typeof io === 'undefined') {
            console.error('❌ Socket.IO not loaded - make sure /socket.io/socket.io.js is included in HTML');
            return;
        }
        
        this.socket = io();
        
        this.socket.on("connect", () => {
            console.log('🌐 Connected to server');
            this.isConnected = true;
        });
        
        this.socket.on("world_init", data => {
            this.game.onWorldInit(data);
        });
        
        this.socket.on("login_success", (player) => {
            console.log('✅ Login success received');
            if (this.game.loginManager) {
                this.game.loginManager.onLoginSuccess(player);
            }
        });
        
        this.socket.on("login_error", (error) => {
            console.error('❌ Login error received');
            if (this.game.loginManager) {
                this.game.loginManager.onLoginError(error);
            }
        });
        
        this.socket.on("create_account_success", (account) => {
            console.log('✅ Account creation success');
            if (this.game.loginManager) {
                this.game.loginManager.showMessage('success', 'Conta criada com sucesso!');
                setTimeout(() => {
                    this.game.loginManager.showLogin();
                }, 2000);
            }
        });
        
        this.socket.on("create_account_error", (error) => {
            console.error('❌ Account creation error');
            if (this.game.loginManager) {
                this.game.loginManager.showMessage('error', error);
            }
        });
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
    }
    
    // === LOGIN METHODS ===
    
    login(username, password) {
        if (!this.isConnected) {
            console.error('❌ Not connected to server');
            return;
        }
        
        console.log('🔑 Sending login request');
        this.socket.emit("login", { username, password });
    }
    
    createAccount(username, password, email) {
        if (!this.isConnected) {
            console.error('❌ Not connected to server');
            return;
        }
        
        console.log('👤 Sending create account request');
        this.socket.emit("createAccount", { username, password, email });
    }
    
    requestWorld() {
        if (!this.isConnected) {
            console.error('❌ Not connected to server');
            return;
        }
        
        console.log('🌍 Requesting world data');
        this.socket.emit("requestWorld");
    }
    
    // === GAME METHODS ===
    
    sendPlayerUpdate(playerData) {
        if (this.isConnected && this.socket) {
            this.socket.emit("player_update", playerData);
        }
    }
    
    sendAction(action) {
        if (this.isConnected && this.socket) {
            this.socket.emit("player_action", action);
        }
    }
}

// Also expose globally for debugging
window.NetworkManager = NetworkManager;
