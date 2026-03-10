// === LEGACY OF KOMODO - MAIN CLIENT ===

/**
 * Pipeline principal do cliente
 * Orquestra a sequência correta de inicialização
 */

// Import modules
import { ClientStateManager, ClientStates } from './state/ClientStateManager.js';
import { LoginUI } from './ui/LoginUI.js';
import { CharacterUI } from './ui/CharacterUI.js';
import { SessionManager } from './state/SessionManager.js';
import { NetworkManager } from './network/NetworkManager.js';
import { GameEngine } from './engine/GameEngine.js';

class LegacyOfKomodoClient {
    constructor() {
        console.log('🎮 Legacy of Komodo Client v0.3.6v - Engine Stabilization');
        
        // Core systems
        this.stateManager = new ClientStateManager();
        this.sessionManager = new SessionManager();
        this.networkManager = new NetworkManager();
        this.gameEngine = null;
        
        // UI systems
        this.loginUI = null;
        this.characterUI = null;
        
        // State
        this.isInitialized = false;
        this.currentPipeline = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Legacy of Komodo Client...');
        
        try {
            // 1. Setup UI Systems
            await this.setupUI();
            
            // 2. Setup Event Handlers
            this.setupEventHandlers();
            
            // 3. Start Pipeline
            this.startPipeline();
            
            this.isInitialized = true;
            console.log('✅ Legacy of Komodo Client initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize client:', error);
            this.handleInitializationError(error);
        }
    }
    
    async setupUI() {
        console.log('🎨 Setting up UI systems...');
        
        // Initialize Login UI
        this.loginUI = new LoginUI();
        if (!this.loginUI.isReady()) {
            throw new Error('LoginUI failed to initialize');
        }
        
        // Initialize Character UI
        this.characterUI = new CharacterUI();
        if (!this.characterUI.isReady()) {
            throw new Error('CharacterUI failed to initialize');
        }
        
        // Setup UI callbacks
        this.loginUI.onLogin((username, password) => this.handleLogin(username, password));
        this.loginUI.onCreateAccount((username, email, password) => this.handleCreateAccount(username, email, password));
        
        this.characterUI.onCreateCharacter((characterData) => this.handleCreateCharacter(characterData));
        this.characterUI.onEnterWorld((character) => this.handleEnterWorld(character));
        
        console.log('✅ UI systems ready');
    }
    
    setupEventHandlers() {
        console.log('📡 Setting up event handlers...');
        
        // State manager events
        this.stateManager.onStateChange(ClientStates.LOGIN, () => {
            console.log('🔑 Entering LOGIN state');
            this.loginUI.show();
            this.characterUI.hide();
            this.hideGameScreen();
        });
        
        this.stateManager.onStateChange(ClientStates.CHARACTER_SELECT, () => {
            console.log('👥 Entering CHARACTER_SELECT state');
            this.loginUI.hide();
            this.characterUI.show();
            this.hideGameScreen();
            this.loadCharacters();
        });
        
        this.stateManager.onStateChange(ClientStates.LOADING_WORLD, () => {
            console.log('🌍 Entering LOADING_WORLD state');
            this.loginUI.hide();
            this.characterUI.hide();
            this.showLoadingScreen();
        });
        
        this.stateManager.onStateChange(ClientStates.IN_GAME, () => {
            console.log('🎮 Entering IN_GAME state');
            this.hideLoadingScreen();
            this.showGameScreen();
        });
        
        // Network events
        this.networkManager.on('connected', () => {
            console.log('🌐 Connected to server');
        });
        
        this.networkManager.on('disconnected', () => {
            console.log('🌐 Disconnected from server');
            this.handleDisconnection();
        });
        
        this.networkManager.on('login_success', (data) => {
            console.log('✅ Login successful:', data.user.username);
            this.sessionManager.setCurrentUser(data.user);
            this.stateManager.setState(ClientStates.CHARACTER_SELECT, { user: data.user });
        });
        
        this.networkManager.on('login_error', (data) => {
            console.error('❌ Login failed:', data.error);
            this.loginUI.showMessage('error', data.error);
            this.loginUI.setLoading(false);
        });
        
        this.networkManager.on('create_account_success', (data) => {
            console.log('✅ Account created successfully');
            this.sessionManager.saveUserData(data.user);
            this.loginUI.showMessage('success', 'Conta criada com sucesso! Faça login.');
            this.loginUI.setLoading(false);
        });
        
        this.networkManager.on('create_account_error', (data) => {
            console.error('❌ Account creation failed:', data.error);
            this.loginUI.showMessage('error', data.error);
            this.loginUI.setLoading(false);
        });
        
        this.networkManager.on('character_created', (data) => {
            console.log('✅ Character created:', data.character.name);
            this.sessionManager.saveCharacterData(this.sessionManager.getCurrentUser().username, data.character);
            this.loadCharacters();
        });
        
        this.networkManager.on('world_init', (data) => {
            console.log('🌍 World init received');
            this.handleWorldInit(data.worldData);
        });
        
        console.log('✅ Event handlers ready');
    }
    
    startPipeline() {
        console.log('🔄 Starting client pipeline...');
        
        // Check for existing session
        const sessionValid = this.sessionManager.repairSession();
        
        if (sessionValid && this.sessionManager.isValid()) {
            console.log('📦 Valid session found, skipping login');
            this.stateManager.setState(ClientStates.CHARACTER_SELECT);
        } else {
            console.log('🔑 No valid session, starting with login');
            this.stateManager.setState(ClientStates.LOGIN);
        }
        
        // Connect to network
        this.networkManager.connect();
    }
    
    // === PIPELINE HANDLERS ===
    
    handleLogin(username, password) {
        console.log('🔑 Handling login:', username);
        
        this.loginUI.setLoading(true);
        this.loginUI.clearMessage();
        
        // Validate session first
        if (this.sessionManager.validateUser(username, password)) {
            const userData = this.sessionManager.loadUserData(username);
            this.sessionManager.setCurrentUser(userData);
            this.stateManager.setState(ClientStates.CHARACTER_SELECT, { user: userData });
            this.loginUI.setLoading(false);
            return;
        }
        
        // Send to server
        this.networkManager.send('login', { username, password });
    }
    
    handleCreateAccount(username, email, password) {
        console.log('👤 Creating account:', username);
        
        this.loginUI.setLoading(true);
        this.loginUI.clearMessage();
        
        // Check if user exists locally
        if (this.sessionManager.userExists(username)) {
            this.loginUI.showMessage('error', 'Nome de usuário já existe');
            this.loginUI.setLoading(false);
            return;
        }
        
        // Send to server
        this.networkManager.send('createAccount', { username, email, password });
    }
    
    handleCreateCharacter(characterData) {
        console.log('👥 Creating character:', characterData.name);
        
        // Check if character exists locally
        const user = this.sessionManager.getCurrentUser();
        if (this.sessionManager.characterExists(user.username, characterData.name)) {
            this.characterUI.showMessage('error', 'Nome de personagem já existe');
            return;
        }
        
        // Send to server
        this.networkManager.send('createCharacter', characterData);
    }
    
    handleEnterWorld(character) {
        console.log('🌍 Entering world with character:', character.name);
        
        this.sessionManager.setCurrentCharacter(character);
        this.stateManager.setState(ClientStates.LOADING_WORLD);
        
        // Send to server
        this.networkManager.send('enterWorld', { characterId: character.id });
    }
    
    handleWorldInit(worldData) {
        console.log('🌍 Initializing world...');
        
        try {
            // Create game engine
            this.gameEngine = new GameEngine();
            
            // Initialize world
            const success = this.gameEngine.initializeWorld(worldData);
            
            if (success) {
                this.stateManager.setState(ClientStates.IN_GAME, { worldData });
                console.log('✅ World initialization complete');
            } else {
                throw new Error('Failed to initialize world');
            }
            
        } catch (error) {
            console.error('❌ World initialization failed:', error);
            this.stateManager.setState(ClientStates.CHARACTER_SELECT);
            this.characterUI.showMessage('error', 'Falha ao entrar no mundo');
        }
    }
    
    handleDisconnection() {
        console.log('🌐 Handling disconnection...');
        
        if (this.gameEngine) {
            this.gameEngine.stop();
            this.gameEngine = null;
        }
        
        this.stateManager.setState(ClientStates.LOGIN);
        this.loginUI.showMessage('error', 'Conexão perdida com o servidor');
    }
    
    handleInitializationError(error) {
        console.error('💥 Critical initialization error:', error);
        
        // Show error screen
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a; color: white; font-family: Arial, sans-serif;">
                <div style="text-align: center; max-width: 500px; padding: 20px;">
                    <h1 style="color: #ff4444;">❌ Erro Crítico</h1>
                    <p>Falha ao inicializar Legacy of Komodo:</p>
                    <pre style="background: #333; padding: 10px; border-radius: 4px; text-align: left; overflow: auto;">${error.message}</pre>
                    <button onclick="location.reload()" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 20px;">
                        Recarregar Página
                    </button>
                </div>
            </div>
        `;
    }
    
    // === UTILITY METHODS ===
    
    loadCharacters() {
        const user = this.sessionManager.getCurrentUser();
        if (!user) return;
        
        const characters = this.sessionManager.loadCharacters(user.username);
        this.characterUI.setCharacters(characters);
    }
    
    showGameScreen() {
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.style.display = 'block';
        }
    }
    
    hideGameScreen() {
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.style.display = 'none';
        }
    }
    
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
    
    // === DEBUG METHODS ===
    
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentState: this.stateManager.getCurrentState(),
            sessionInfo: this.sessionManager.getSessionInfo(),
            networkStatus: this.networkManager.getStatus(),
            gameEngineStatus: this.gameEngine ? this.gameEngine.getStatus() : null,
            uiStatus: {
                loginUI: this.loginUI?.isReady() || false,
                characterUI: this.characterUI?.isReady() || false
            }
        };
    }
    
    debugPipeline() {
        console.log('\n🔍 === CLIENT PIPELINE DEBUG ===');
        console.log('Status:', this.getStatus());
        console.log('State History:');
        this.stateManager.logStateHistory();
    }
    
    // === CLEANUP ===
    
    destroy() {
        console.log('🗑️ Destroying Legacy of Komodo Client...');
        
        if (this.gameEngine) {
            this.gameEngine.stop();
        }
        
        this.networkManager.disconnect();
        this.sessionManager.logout();
        
        console.log('✅ Client destroyed');
    }
}

// Initialize client when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM ready, initializing Legacy of Komodo...');
        window.legacyClient = new LegacyOfKomodoClient();
        
        // Make available globally for debugging
        window.legacyOfKomodo = {
            client: window.legacyClient,
            debug: () => window.legacyClient.debugPipeline(),
            status: () => window.legacyClient.getStatus()
        };
    });
}

// Export for testing
export { LegacyOfKomodoClient };
